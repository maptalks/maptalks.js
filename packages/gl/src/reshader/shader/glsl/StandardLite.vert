precision mediump float;
#include <gl2_vert>
attribute vec3 aPosition;
#include <line_extrusion_vert>

#ifdef HAS_MAP
    uniform vec2 uvScale;
    uniform vec2 uvOffset;
    attribute vec2 aTexCoord;
    varying vec2 vTexCoord;

    #ifdef HAS_I3S_UVREGION
        attribute vec4 uvRegion;
        varying vec4 vUvRegion;
    #endif
#endif
#if defined(HAS_COLOR)
    attribute vec4 aColor;

#elif defined(HAS_COLOR0)
    #if COLOR0_SIZE == 3
        attribute vec3 aColor0;
    #else
        attribute vec4 aColor0;
    #endif
    varying vec4 vColor;
#endif

uniform mat4 projMatrix;
uniform mat3 modelNormalMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 modelMatrix;
uniform mat4 positionMatrix;
uniform vec2 halton;
uniform vec2 outSize;

uniform mat4 projViewMatrix;
#include <get_output>
#include <heatmap_render_vert>
#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
    #include <vsm_shadow_vert>
#endif
varying vec3 vViewPosition;

void main()
{
    #ifdef IS_LINE_EXTRUSION
        vec4 localPosition = getPosition(getLineExtrudePosition(aPosition));
    #else
        vec4 localPosition = getPosition(aPosition);
    #endif
    mat4 localPositionMatrix = getPositionMatrix();
    mat4 jitteredProjection = projMatrix;
    jitteredProjection[2].xy += halton.xy / outSize.xy;
    #ifdef HAS_MASK_EXTENT
        gl_Position = jitteredProjection * getMaskPosition(localPositionMatrix * localPosition, modelMatrix);
    #else
        gl_Position = jitteredProjection * modelViewMatrix * localPositionMatrix * localPosition;
    #endif
    vec4 mvPosition = modelViewMatrix * localPositionMatrix * localPosition;
    vViewPosition = -mvPosition.xyz;
    #ifdef HAS_MAP
        vec2 decodedTexCoord = decode_getTexcoord(aTexCoord);
        vTexCoord = decodedTexCoord * uvScale + uvOffset;
    #endif
    #if defined(HAS_COLOR)
        vColor = aColor / 255.0;
    #elif defined(HAS_COLOR0)
        #if COLOR0_SIZE == 3
            vColor = vec4(aColor0 / 255.0, 1.0);
        #else
            vColor = aColor0 / 255.0;
        #endif
    #endif
}
