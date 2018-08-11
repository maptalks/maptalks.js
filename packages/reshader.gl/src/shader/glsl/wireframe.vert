attribute vec3 aPosition;
attribute vec3 aBarycentric;
uniform mat4 projectionViewModel;

varying vec3 vBC;

void main() {
    vBC = aBarycentric;
    gl_Position = projectionViewModel * vec4(aPosition, 1.0);
}
