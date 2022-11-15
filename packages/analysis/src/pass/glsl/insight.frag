#ifdef GL_ES
precision highp float;
#endif
varying vec4 insight_positionFromViewpoint;
uniform sampler2D depthMap;

const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3(256. * 256. * 256., 256. * 256., 256.);
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1.);
float unpackRGBAToDepth(const in vec4 v) {
    return dot(v, UnpackFactors);
}

void main() {
    vec3 shadowCoord = (insight_positionFromViewpoint.xyz / insight_positionFromViewpoint.w)/2.0 + 0.5;
    vec4 rgbaDepth = texture2D(depthMap, shadowCoord.xy);
    float depth = unpackRGBAToDepth(rgbaDepth); // Retrieve the z-value from R
    if (shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0 && shadowCoord.z <= 1.0) {
        if (depth <0.001) {
            gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);//可视区,green
        } else {
            if (shadowCoord.z <= depth + 0.002) {
                gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);//可视区,green
            } else {
                gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);//不可视区,red
            }
        }
    } else {
        gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);//非视野范围,blue
    }
}

