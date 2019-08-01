attribute vec3 aPosition;
attribute vec3 aBarycentric;
varying vec3 vBarycentric;
uniform mat4 projViewMatrix;
uniform mat4 projViewModelMatrix;

#ifdef USE_INSTANCE
  #include <instance_vert>
  varying vec4 vInstanceColor;
#endif
void main () {
  #ifdef USE_INSTANCE
    gl_Position = instance_drawInstance(aPosition, projViewMatrix);
    vInstanceColor = instance_getInstanceColor();
  #else
    gl_Position = projViewModelMatrix * vec4(aPosition, 1.0);
  #endif
  vBarycentric = aBarycentric;
}