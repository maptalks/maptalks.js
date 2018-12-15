precision mediump float;

varying vec3 vBC;

uniform float lineWidth;
uniform float alpha;
uniform vec3 frontColor;
uniform vec3 backColor;

#extension GL_OES_standard_derivatives : enable

float edgeFactor() {
    vec3 d = fwidth(vBC);
    vec3 a3 = smoothstep(vec3(0.0), d * lineWidth, vBC);
    return min(min(a3.x, a3.y), a3.z);
}

void main() {
    if(gl_FrontFacing) {
        gl_FragColor = vec4(frontColor, 1.0 - edgeFactor()) * alpha;
    } else {
        gl_FragColor = vec4(backColor, 1.0 - edgeFactor()) * alpha;
    }
    // if(gl_FrontFacing) {
    //     gl_FragColor = vec4(0.0, 0.0, 0.0, (1.0-edgeFactor())*0.95);
    // }
    // else {
    //     gl_FragColor = vec4(0.0, 0.0, 0.0, (1.0-edgeFactor())*0.7);
    // }
}
