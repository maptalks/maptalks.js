attribute vec3 aPosition;
attribute vec3 aBarycentric;
varying vec3 vBarycentric;

uniform mat4 modelMatrix;
uniform mat4 projViewMatrix;
uniform mat4 projViewModelMatrix;
uniform mat4 positionMatrix;

#include <get_output>
void main () {
    frameUniforms.modelMatrix = getModelMatrix();
    vec4 POSITION = getPosition(aPosition);
    gl_Position = projViewMatrix * frameUniforms.modelMatrix * POSITION;
    vBarycentric = aBarycentric;
}
