attribute vec3 aPosition;
attribute vec3 aBarycentric;
varying vec3 vBarycentric;
uniform mat4 projViewModelMatrix;


void main () {
  gl_Position = projViewModelMatrix * vec4(aPosition, 1.0);
  vBarycentric = aBarycentric;
}