#include <gl2_vert>
attribute vec2 aPosition;
attribute vec2 aTexCoord;
uniform mat4 projViewModelMatrix;
varying vec2 vTexCoord;

void main() {
    gl_Position = projViewModelMatrix * vec4(aPosition, 0., 1.);
    vTexCoord = aTexCoord;
}
