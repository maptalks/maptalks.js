#ifdef GL_ES
precision highp float;
#endif
varying vec4 viewshed_positionFromViewpoint;
uniform sampler2D depthMap;
uniform float near;
uniform float far;
#ifdef HAS_HELPERLINE
  uniform vec3 lineColor;
#endif

const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3(256. * 256. * 256., 256. * 256., 256.);
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1.);
float unpackRGBAToDepth(const in vec4 v) {
    return dot(v, UnpackFactors);
}

float linear(float value) {
    float z = value * 2.0 - 1.0;
    return (2.0 * near * far) / (far + near - z * (far - near));
}

void main() {
    #ifdef HAS_HELPERLINE
        gl_FragColor = vec4(lineColor, 0.009);
    #else
        vec3 shadowCoord = (viewshed_positionFromViewpoint.xyz / viewshed_positionFromViewpoint.w)/2.0 + 0.5;
        vec4 rgbaDepth = texture2D(depthMap, shadowCoord.xy);
        float depth = unpackRGBAToDepth(rgbaDepth);
        float linearZ = linear(shadowCoord.z);
        float linearDepth = linear(depth);

        if (shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 &&
            shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0 &&
            linearZ >= near && linearZ <= far - near) {

            if (linearZ / far <= linearDepth / (far - near)) {
                gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);//可视区
            } else {
                gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);//不可视区
            }
        } else {
            gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
        }
    #endif
}

