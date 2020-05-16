#version 100
#define SHADER_NAME SSAO_EXTRACT
#define PI 3.14159265359
#extension GL_OES_standard_derivatives : enable

precision highp float;

struct MaterialParams {
    //width, height, 1 / width, 1 / height
    vec4 resolution;
    //{-projection[3].z, projection[2].z - 1.0 } * 0.5f
    vec2 depthParams;
    //invProjection[0][0], invProjection[1][1]
    vec2 positionParams;
    //1.0 / (radius * radius)
    float invRadiusSquared;
    //sq(0.1 * options.radius)
    float peak2;
    ////Math.min(0.5f * cameraInfo.projection[0].x * desc.width, 0.5f * cameraInfo.projection[1].y * desc.height)
    float projectionScaleRadius;
    //options.bias
    float bias;
    //options.power
    float power;
    //options.intensity
    float intensity;
    //sampleCount, 1 / (sampleCount - 0.5)
    vec2 sampleCount;
    //spiralTurns
    float spiralTurns;
    //1 / -cameraFar
    float invFarPlane;
    //depth texture mipmap's maxLevel
    // float maxLevel;
};

uniform MaterialParams materialParams;
uniform sampler2D materialParams_depth;

const float kLog2LodRate = 3.0;
const float kEdgeDistance = 0.0625; // this shouldn't be hardcoded

vec2 sq(const vec2 a) {
    return a * a;
}

vec2 pack(highp float depth) {
    // we need 16-bits of precision
    highp float z = clamp(depth * materialParams.invFarPlane, 0.0, 1.0);
    highp float t = floor(256.0 * z);
    mediump float hi = t * (1.0 / 256.0);   // we only need 8-bits of precision
    mediump float lo = (256.0 * z) - t;     // we only need 8-bits of precision
    return vec2(hi, lo);
}

// random number between 0 and 1, using interleaved gradient noise
float random(const highp vec2 w) {
    const vec3 m = vec3(0.06711056, 0.00583715, 52.9829189);
    return fract(m.z * fract(dot(w, m.xy)));
}

highp float linearizeDepth(highp float depth) {
    // Our far plane is at infinity, which causes a division by zero below, which in turn
    // causes some issues on some GPU. We workaround it by replacing "infinity" by the closest
    // value representable in  a 24 bit depth buffer.
    const float preventDiv0 = -1.0 / 16777216.0;
    highp float z = depth * 2.0 - 1.0;
    return materialParams.depthParams.x / min(z + materialParams.depthParams.y, preventDiv0);


    // highp mat4 projection = projMatrix;
    // highp float z = depth * 2.0 - 1.0; // depth in clip space
    // return -projection[3].z / (z + projection[2].z);
}

highp float sampleDepthLinear(const vec2 uv, float lod) {
    return linearizeDepth(texture2D(materialParams_depth, uv).r);
}

highp vec3 computeViewSpacePositionFromDepth(highp vec2 uv, highp float linearDepth) {
    return vec3((0.5 - uv) * materialParams.positionParams.xy * linearDepth, linearDepth);
}

highp vec3 faceNormal(highp vec3 dpdx, highp vec3 dpdy) {
    return normalize(cross(dpdx, dpdy));
}

// Compute normals using derivatives, which essentially results in half-resolution normals
// this creates arifacts around geometry edges.
// Note: when using the spirv optimizer, this results in much slower execution time because
//       this whole expression is inlined in the AO loop below.
highp vec3 computeViewSpaceNormal(const highp vec3 position) {
    return faceNormal(dFdx(position), dFdy(position));
}

// Compute normals directly from the depth texture, resulting in full resolution normals
// Note: This is actually as cheap as using derivatives because the texture fetches
//       are essentially equivalent to textureGather (which we don't have on ES3.0),
//       and this is executed just once.
highp vec3 computeViewSpaceNormal(const highp vec3 position, const highp vec2 uv) {
    highp vec2 uvdx = uv + vec2(materialParams.resolution.z, 0.0);
    highp vec2 uvdy = uv + vec2(0.0, materialParams.resolution.w);
    highp vec3 px = computeViewSpacePositionFromDepth(uvdx, sampleDepthLinear(uvdx, 0.0));
    highp vec3 py = computeViewSpacePositionFromDepth(uvdy, sampleDepthLinear(uvdy, 0.0));
    highp vec3 dpdx = px - position;
    highp vec3 dpdy = py - position;
    return faceNormal(dpdx, dpdy);
}

// Ambient Occlusion, largely inspired from:
// "The Alchemy Screen-Space Ambient Obscurance Algorithm" by Morgan McGuire
// "Scalable Ambient Obscurance" by Morgan McGuire, Michael Mara and David Luebke

vec3 tapLocation(float i, const float noise) {
    // note: with this formulation we could precompute the samples in an array
    //       and combine the noise, which would allow is to call sin/cos only
    //       once per pixel.
    float radius = (i + 0.5) * materialParams.sampleCount.y;
    float angle = (radius * materialParams.spiralTurns + noise) * (2.0 * PI);
    return vec3(cos(angle), sin(angle), radius);
}

void computeAmbientOcclusionSAO(inout float occlusion, float i, float ssDiskRadius,
        const highp vec2 uv,  const highp vec3 origin, const vec3 normal,
        const float noise) {
    //??
    // ssDiskRadius = 3.0;

    vec3 tap = tapLocation(i, noise);
    float ssRadius = max(1.0, tap.z * ssDiskRadius); // at least 1 pixel screen-space radius

    vec2 uvSamplePos = uv + vec2(ssRadius * tap.xy) * materialParams.resolution.zw;

    //TODO 我们没有生成depth texture，所以这里还是读取0级的depth值
    float level = 0.0;//clamp(floor(log2(ssRadius)) - kLog2LodRate, 0.0, float(materialParams.maxLevel));
    highp float occlusionDepth = sampleDepthLinear(uvSamplePos, level);
    highp vec3 p = computeViewSpacePositionFromDepth(uvSamplePos, occlusionDepth);

    // now we have the sample, compute AO
    vec3 v = p - origin;        // sample vector
    float vv = dot(v, v);       // squared distance
    float vn = dot(v, normal);  // distance * cos(v, normal)

    float w = max(0.0, 1.0 - vv * materialParams.invRadiusSquared);
    occlusion += (w * w) * max(0.0, vn + origin.z * materialParams.bias) / (vv + materialParams.peak2);
}

void main() {
    highp vec2 uv = gl_FragCoord.xy / materialParams.resolution.xy; // interpolated to pixel center

    highp float depth = sampleDepthLinear(uv, 0.0);
    highp vec3 origin = computeViewSpacePositionFromDepth(uv, depth);

    vec3 normal = computeViewSpaceNormal(origin, uv);
    float noise = random(gl_FragCoord.xy);

    // Choose the screen-space sample radius
    // proportional to the projected area of the sphere
    float ssDiskRadius = -(materialParams.projectionScaleRadius / origin.z);

    float occlusion = 0.0;
    // const int sampleCount = int(materialParams.sampleCount.x);
    for (int i = 0; i < 11; i += 1) {
        computeAmbientOcclusionSAO(occlusion, float(i), ssDiskRadius, uv, origin, normal, noise);
    }

    float ao = max(0.0, 1.0 - occlusion * (materialParams.intensity * materialParams.sampleCount.y));
    ao = pow(ao, materialParams.power);

    // Apply a 2x2 bilateral box filter, taking advantage of quad shading. If we were not
    // applying the bilateral filter, this would be equivalent to downsampling the AO buffer
    // using a 2x2 box. Thanks to the bilateral filter, we keep some sharp edges.
    // mod2() below will return either 0.5 or 1.5
    // This assumes full derivatives are supported.
    // ivec2 coords = ivec2(gl_FragCoord.xy);
    // ao += (1.0 - step(kEdgeDistance, abs(dFdx(origin.z)))) * dFdx(ao) * (0.5 - float(coords.x & 1));
    // ao += (1.0 - step(kEdgeDistance, abs(dFdy(origin.z)))) * dFdy(ao) * (0.5 - float(coords.y & 1));

    vec2 coords = floor(gl_FragCoord.xy);
    ao += (1.0 - step(kEdgeDistance, abs(dFdx(origin.z)))) * dFdx(ao) * (0.5 - mod(coords.x, 2.0));
    ao += (1.0 - step(kEdgeDistance, abs(dFdy(origin.z)))) * dFdy(ao) * (0.5 - mod(coords.y, 2.0));
    // gl_FragColor = vec4(ao, pack(origin.z), 1.0);
    gl_FragColor = vec4(vec3(ao), 1.0);
}
