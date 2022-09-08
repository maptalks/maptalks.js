#include <gl2_vert>
attribute vec3 aPosition;
attribute vec3 aBarycentric;
varying vec3 vBarycentric;

uniform mat4 modelMatrix;
uniform mat4 projMatrix;
uniform mat4 positionMatrix;
varying vec3 vPosition;
#include <get_output>

void main () {
    mat4 localPositionMatrix = getPositionMatrix();
    vec4 localPosition = getPosition(aPosition);
    mat4 vmMatrix = getVMMatrix();
    gl_Position = projMatrix * vmMatrix * localPositionMatrix * localPosition;
    vBarycentric = aBarycentric;
    vPosition = aPosition;
}
