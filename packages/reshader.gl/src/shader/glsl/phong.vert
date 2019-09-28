attribute vec3 aPosition;

#ifdef HAS_BASECOLORTEXTURE
    attribute vec2 TEXCOORD_0;
    varying vec2 vTexCoords;
#endif

attribute vec3 NORMAL;
varying vec4 vFragPos;
varying vec3 vNormal;

uniform mat4 projViewModelMatrix;
uniform mat4 projViewMatrix;
uniform mat4 normalMatrix;
uniform mat4 modelMatrix;

#include <get_output>

void main()
{
    frameUniforms.modelMatrix = getModelMatrix();
    vec4 POSITION = getPosition(aPosition);
    vFragPos = frameUniforms.modelMatrix * POSITION;
    vec4 normal = getNormal(NORMAL);
    frameUniforms.normalMatrix = getNormalMatrix(frameUniforms.modelMatrix);
    vNormal = normalize(vec3(frameUniforms.normalMatrix * normal));
    gl_Position = projViewMatrix * frameUniforms.modelMatrix * POSITION;
    #ifdef HAS_BASECOLORTEXTURE
        vTexCoords = TEXCOORD_0;
    #endif
}
