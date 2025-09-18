#define SHADER_NAME HEATMAP_DISPLAY

uniform mat4 projViewModelMatrix;

attribute vec3 aPosition;

void main() {
    gl_Position = projViewModelMatrix * vec4(aPosition, 1.0);
}
