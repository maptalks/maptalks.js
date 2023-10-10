#define SHADER_NAME TERRAIN_SKIN

precision mediump float;
uniform float tileSize;
uniform sampler2D skinTexture;
uniform vec3 skinDim;
uniform float opacity;

void main() {
    // 除以2是因为瓦片实际的fbo是tileSize的2倍大
    vec2 fragCoord = gl_FragCoord.xy / 2.0;
    vec2 resolution = vec2(tileSize);
    vec2 uv = (fragCoord - skinDim.xy) /  (resolution * skinDim.z);
    if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
        gl_FragColor = texture2D(skinTexture, uv) * opacity;
    } else {
        gl_FragColor = vec4(0.0);
    }
}
