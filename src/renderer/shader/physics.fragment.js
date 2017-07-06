export default `precision highp float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec2 bounds;
uniform float tick;
const float gravity = 0.75;

highp float rand(vec2 co)
{
    highp float a = 12.9898;
    highp float b = 78.233;
    highp float c = 43758.5453;
    highp float dt= dot(co.xy, vec2(a, b));
    highp float sn= mod(dt, 3.14);
    return fract(sin(sn) * c);
}

void main(void)
{
    vec4 position = texture2D(uSampler, vTextureCoord);
    position.xy += position.zw;
    position.w += gravity;

    if (position.y > bounds.y) {
        position.y = bounds.y;
        position.w *= -0.85;

        if (position.w > -20.0) {
            position.w = rand(vTextureCoord) * -32.0;
        }
    }

    if (position.x > bounds.x) {
        position.x = bounds.x;
        position.z *= -1.0;
    }

    if (position.x < 0.0) {
        position.x = 0.0;
        position.z *= -1.0;
    }

    gl_FragColor = position;
}`;
