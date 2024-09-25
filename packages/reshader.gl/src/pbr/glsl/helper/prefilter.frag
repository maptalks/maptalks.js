#define SHADER_NAME PBR_prefilter
precision highp float;

varying vec3 vWorldPos;

uniform samplerCube environmentMap;
uniform sampler2D distributionMap;
uniform float roughness;
uniform float resolution; // resolution of source cubemap (per face)

const float PI = 3.14159265359;

// ----------------------------------------------------------------------------
float DistributionGGX(vec3 N, vec3 H, float roughness)
{
    float a = roughness*roughness;
    float a2 = a*a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH*NdotH;

    float nom   = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return nom / denom;
}

// ----------------------------------------------------------------------------
vec3 ImportanceSampleGGX(float Xi, vec3 N, float roughness)
{
    vec4 distro = texture2D(distributionMap, vec2(roughness, Xi));
    vec3 H = distro.xyz;
    //PBRHelper.generateNormalDistribution在第四位中保留了x和y的符号位，z永远都是正数
    //算法如下：200 *（x > 0 ? 1 : 0) + 55 * (y > 0 ? 1 : 0)
    //所以distro.w > 0.5时，x一定为正数
    // (distro.w - 200 / 255 * (x > 0 ? 1 : 0)) > 0.15 时，y一定为正数，55/255 = 0.21，取值0.15是为了避免误差
    float s0 = sign(distro.w - 0.5);
    float s1 = sign(distro.w - 200.0 / 255.0 * clamp(s0, 0.0, 1.0) - 0.15);
    H.x *= s0;
    H.y *= s1;

    // from tangent-space H vector to world-space sample vector
    vec3 up        = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangent   = normalize(cross(up, N));
    vec3 bitangent = cross(N, tangent);

    vec3 sampleVec = tangent * H.x + bitangent * H.y + N * H.z;
    return normalize(sampleVec);
}

vec4 encodeRGBM(const in vec3 color, const in float range) {
    if(range <= 0.0) return vec4(color, 1.0);
    vec4 rgbm;
    vec3 col = color / range;
    rgbm.a = clamp( max( max( col.r, col.g ), max( col.b, 1e-6 ) ), 0.0, 1.0 );
    rgbm.a = ceil( rgbm.a * 255.0 ) / 255.0;
    rgbm.rgb = col / rgbm.a;
    return rgbm;
}

vec3 decodeRGBM(const in vec4 color, const in float range) {
    if(range <= 0.0) return color.rgb;
    return range * color.rgb * color.a;
}
// ----------------------------------------------------------------------------
void main()
{
    vec3 N = normalize(vWorldPos);

    // make the simplyfying assumption that V equals R equals the normal
    vec3 R = N;
    vec3 V = R;

    const int SAMPLE_COUNT = 1024;
    vec3 prefilteredColor = vec3(0.0);
    float totalWeight = 0.0;

    for(int i = 0; i < SAMPLE_COUNT; ++i)
    {
        // generates a sample vector that's biased towards the preferred alignment direction (importance sampling).
        vec3 H = ImportanceSampleGGX(float(i) / float(SAMPLE_COUNT), N, roughness);
        vec3 L = normalize(2.0 * dot(V, H) * H - V);

        float NdotL = max(dot(N, L), 0.0);
        if(NdotL > 0.0)
        {
            // a more precision method,  sample from the environment's mip level based on roughness/pdf
            // float D   = DistributionGGX(N, H, roughness);
            // float NdotH = max(dot(N, H), 0.0);
            // float HdotV = max(dot(H, V), 0.0);
            // float pdf = D * NdotH / (4.0 * HdotV) + 0.0001;

            // float saTexel  = 4.0 * PI / (6.0 * resolution * resolution);
            // float saSample = 1.0 / (float(SAMPLE_COUNT) * pdf + 0.0001);

            // float mipLevel = roughness == 0.0 ? 0.0 : 0.5 * log2(saSample / saTexel);

            // prefilteredColor += decodeRGBM(textureCube(environmentMap, L, mipLevel), 7.0).rgb * NdotL;
            // totalWeight      += NdotL;
            //--------------------------------------------------------
            prefilteredColor += textureCube(environmentMap, L).rgb * NdotL;
            totalWeight      += NdotL;
        }
    }

    prefilteredColor = prefilteredColor / totalWeight;

    gl_FragColor = vec4(prefilteredColor, 1.0);
}
