#define SHADER_NAME TERRAIN_SKIN

attribute vec2 aPosition;
void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
