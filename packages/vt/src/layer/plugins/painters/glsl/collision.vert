attribute vec2 aPosition;
attribute float aVisible;

uniform vec2 size;

varying vec4 vColor;

void main() {
    vec2 uv = (aPosition / size - 0.5) * 2.0 * vec2(1.0, -1.0);
    gl_Position = vec4(uv, 0.0, 1.0);

    vColor = mix(vec4(1.0, 0.0, 0.0, 1.5) * 0.5, vec4(0.0, 1.0, 0.0, 1.0) * 0.4, aVisible);
}
