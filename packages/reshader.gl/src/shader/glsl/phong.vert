attribute vec3 aPosition;

#ifdef HAS_BASECOLORTEXTURE
    attribute vec2 TEXCOORD_0;
    varying vec2 vTexCoords;
#endif
#ifdef HAS_COLOR
    attribute vec4 aColor;
    varying vec4 vColor;
#endif

attribute vec3 aNormal;
varying vec3 vFragPos;
varying vec3 vNormal;

uniform mat4 projViewModelMatrix;
uniform mat4 projViewMatrix;
uniform mat4 normalMatrix;
uniform mat4 modelMatrix;

#include <get_output>

#ifdef HAS_EXTRUSION_OPACITY
    attribute float aExtrusionOpacity;
    varying float vExtrusionOpacity;
#endif
void main()
{
    frameUniforms.modelMatrix = getModelMatrix();
    vec4 POSITION = getPosition(aPosition);
    vFragPos = vec3(frameUniforms.modelMatrix * POSITION);
    vec4 normal = getNormal(aNormal);
    frameUniforms.normalMatrix = getNormalMatrix(frameUniforms.modelMatrix);
    vNormal = normalize(vec3(frameUniforms.normalMatrix * normal));
    gl_Position = projViewMatrix * frameUniforms.modelMatrix * POSITION;
    #ifdef HAS_BASECOLORTEXTURE
        vTexCoords = TEXCOORD_0;
    #endif
    #ifdef HAS_EXTRUSION_OPACITY
        vExtrusionOpacity = aExtrusionOpacity;
    #endif
    #ifdef HAS_COLOR
        vColor = aColor / 255.0;
    #endif
}
