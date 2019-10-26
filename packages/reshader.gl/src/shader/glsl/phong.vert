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

uniform mat4 projMatrix;
uniform mat4 viewMatrix;
uniform mat4 normalMatrix;
uniform mat4 modelMatrix;
uniform vec2 halton;
uniform vec2 globalTexSize;

#include <get_output>

#ifdef HAS_EXTRUSION_OPACITY
    attribute float aExtrusionOpacity;
    varying float vExtrusionOpacity;
#endif
void main()
{
    frameUniforms.modelMatrix = getModelMatrix();
    vec4 localPosition = getPosition(aPosition);
    vFragPos = vec3(frameUniforms.modelMatrix * localPosition);
    vec4 localNormal = getNormal(aNormal);
    frameUniforms.normalMatrix = getNormalMatrix(frameUniforms.modelMatrix);
    vNormal = normalize(vec3(frameUniforms.normalMatrix * localNormal));

    mat4 jitteredProjection = projMatrix;
    jitteredProjection[2].xy += halton.xy / globalTexSize.xy;
    gl_Position = jitteredProjection * viewMatrix * frameUniforms.modelMatrix * localPosition;
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
