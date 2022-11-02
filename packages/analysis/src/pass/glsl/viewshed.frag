#ifdef GL_ES
precision highp float;
#endif
varying vec4 viewshed_positionFromViewpoint;
uniform sampler2D depthMap;
uniform float near;
#ifdef HAS_HELPERLINE
  uniform vec3 lineColor;
#endif

float viewshed_unpack(const in vec4 rgbaDepth) {
    const vec4 bitShift = vec4(1.0, 1.0/256.0, 1.0/(256.0*256.0), 1.0/(256.0*256.0*256.0));
    float depth = dot(rgbaDepth, bitShift);
    return depth;
}

void main() {
    #ifdef HAS_HELPERLINE
        gl_FragColor = vec4(lineColor, 0.009);
    #else
        vec3 shadowCoord = (viewshed_positionFromViewpoint.xyz / viewshed_positionFromViewpoint.w)/2.0 + 0.5;
        vec4 rgbaDepth = texture2D(depthMap, shadowCoord.xy);
        float depth = viewshed_unpack(rgbaDepth); // Retrieve the z-value from R
        if (shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0 && shadowCoord.z <= 1.0) {
            if (shadowCoord.z < (depth - near)) {
                gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);//可视区
            } else {
                gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);//不可视区
            }
        } else {
            gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
        }
    #endif
}

