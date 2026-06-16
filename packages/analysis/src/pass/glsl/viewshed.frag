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
        vec3 viewCoord = viewshed_positionFromViewpoint.xyz / viewshed_positionFromViewpoint.w;
        viewCoord = viewCoord / 2.0 + 0.5;
        float viewZ = linear(viewCoord.z);

        vec4 rgbaDepth = texture2D(depthMap, viewCoord.xy);
        float depth = unpackRGBAToDepth(rgbaDepth);
        float linearDepth = linear(depth);

        if (viewCoord.x >= 0.0 && viewCoord.x <= 1.0 &&
            viewCoord.y >= 0.0 && viewCoord.y <= 1.0 &&
            viewZ >= near && viewZ <= far - near) {
            // 给予一定的误差范围，避免由于精度问题导致的不正确结果
            float delta = (far - near) * 0.05;
            if (viewZ <= linearDepth + delta) {
                gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);//可视区
            } else {
                gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);//不可视区
            }
        } else {
            gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
        }
    #endif
}

