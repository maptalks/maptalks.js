#ifdef GL_ES
precision highp float;
#endif
uniform sampler2D meshesMap;
varying vec4 cut_positionFromViewpoint;
varying vec2 v_texCoord;

void main() {
    vec3 shadowCoord = (cut_positionFromViewpoint.xyz / cut_positionFromViewpoint.w)/2.0 + 0.5;
    if (shadowCoord.x > 0.0 && shadowCoord.x < 1.0 && shadowCoord.y > 0.0 && shadowCoord.y < 1.0 && shadowCoord.z < 1.0) {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    } else {
        #ifdef HAS_HELPERPARTS
          gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
        #else
          gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
        #endif
        vec2 v = v_texCoord;
    }
}
