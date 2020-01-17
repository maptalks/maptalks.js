#define SHADER_NAME depth_vert
precision highp float;

attribute vec3 aPosition;
#ifdef IS_LINE_EXTRUSION
    #define EXTRUDE_SCALE 63.0;
    attribute vec2 aExtrude;
    uniform float lineWidth;
    uniform float lineHeight;
    uniform float linePixelScale;
#endif

uniform mat4 uModelViewMatrix;
uniform mat4 positionMatrix;
uniform mat4 uProjectionMatrix;
uniform vec2 uGlobalTexSize;
uniform vec2 uHalton;

#include <get_output>

void main() {
    mat4 localPositionMatrix = getPositionMatrix();
    #ifdef IS_LINE_EXTRUSION
        float halfwidth = lineWidth / 2.0;
        float outset = halfwidth;
        vec2 dist = outset * aExtrude / EXTRUDE_SCALE;
        //linePixelScale = tileRatio * resolution / tileResolution
        vec4 localVertex = getPosition(aPosition + vec3(dist, 0.0) * linePixelScale);
    #else
        vec4 localVertex = getPosition(aPosition);
    #endif
    vec4 viewVertex = uModelViewMatrix * localPositionMatrix * localVertex;
    mat4 jitteredProjection = uProjectionMatrix;
    jitteredProjection[2].xy += uHalton.xy / uGlobalTexSize.xy;
    gl_Position = jitteredProjection * viewVertex;
}
