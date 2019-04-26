#define SHADER_NAME vsm_mapping
#extension GL_OES_standard_derivatives : enable

precision mediump float;

varying vec4 vPosition;

//VSM
void main()
{
    float depth = vPosition.z / vPosition.w;
    depth = depth * 0.5 + 0.5;
    float moment1 = depth;
    float moment2 = depth * depth;

    // Adjusting moments using partial derivative
    float dx = dFdx(depth);
    float dy = dFdy(depth);
    // Resovle shadow acne
    moment2 += 0.25 * (dx * dx + dy * dy);

    gl_FragColor = vec4(moment1, moment2, depth, 0.0);
}
