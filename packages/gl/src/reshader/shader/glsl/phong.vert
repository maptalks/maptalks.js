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
    #if defined(HAS_AO_MAP)
        attribute vec2 aTexCoord1;
        varying vec2 vTexCoord1;
    #endif
#endif
#if defined(HAS_COLOR)
    attribute vec4 aColor;
    varying vec4 vColor;
#elif defined(HAS_COLOR0)
    #if COLOR0_SIZE == 3
        attribute vec3 aColor0;
    #else
        attribute vec4 aColor0;
    #endif
    varying vec4 vColor;
#endif

varying vec3 vFragPos;
varying vec3 vNormal;

uniform mat4 projMatrix;
uniform mat3 modelNormalMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 modelMatrix;
uniform mat4 positionMatrix;
uniform vec2 halton;
uniform vec2 outSize;

uniform mat4 projViewMatrix;
// uniform mat4 projViewModelMatrix;
#include <highlight_vert>
#include <get_output>
#include <heatmap_render_vert>
#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
    #include <vsm_shadow_vert>
#endif

#ifdef HAS_EXTRUSION_OPACITY
    attribute float aExtrusionOpacity;
    varying float vExtrusionOpacity;
#endif

#if defined(HAS_TANGENT)
    varying vec4 vTangent;
#endif

/**
 * Extracts the normal vector of the tangent frame encoded in the specified quaternion.
 */
void toTangentFrame(const highp vec4 q, out highp vec3 n) {
    n = vec3( 0.0,  0.0,  1.0) +
        vec3( 2.0, -2.0, -2.0) * q.x * q.zwx +
        vec3( 2.0,  2.0, -2.0) * q.y * q.wzy;
}

/**
 * Extracts the normal and tangent vectors of the tangent frame encoded in the
 * specified quaternion.
 */
void toTangentFrame(const highp vec4 q, out highp vec3 n, out highp vec3 t) {
    toTangentFrame(q, n);
    t = vec3( 1.0,  0.0,  0.0) +
        vec3(-2.0,  2.0, -2.0) * q.y * q.yxw +
        vec3(-2.0,  2.0,  2.0) * q.z * q.zwx;
}

#include <vertex_color_vert>

void main()
{
    #ifdef IS_LINE_EXTRUSION
        vec4 localPosition = getPosition(getLineExtrudePosition(aPosition));
    #else
        vec4 localPosition = getPosition(aPosition);
    #endif
    mat4 localPositionMatrix = getPositionMatrix();

    vFragPos = vec3(modelMatrix * localPositionMatrix * localPosition);

    #if defined(HAS_NORMAL) || defined(HAS_TANGENT)
        mat3 localNormalMatrix = modelNormalMatrix * mat3(localPositionMatrix);
        vec3 Normal;
        #if defined(HAS_TANGENT)
            vec3 t;
            toTangentFrame(aTangent, Normal, t);
            vTangent = vec4(localNormalMatrix * t, aTangent.w);
        #else
            Normal = decode_getNormal(aNormal);
        #endif
        vec3 localNormal = appendMorphNormal(Normal);
        vNormal = normalize(localNormalMatrix * localNormal);
    #else
        vNormal = vec3(0.0);
    #endif
    mat4 jitteredProjection = projMatrix;
    jitteredProjection[2].xy += halton.xy / outSize.xy;
    #ifdef HAS_MASK_EXTENT
        gl_Position = jitteredProjection * getMaskPosition(localPositionMatrix * localPosition, modelMatrix);
    #else
        gl_Position = jitteredProjection * modelViewMatrix * localPositionMatrix * localPosition;
    #endif
    #ifdef HAS_MAP
        vec2 decodedTexCoord = decode_getTexcoord(aTexCoord);
        vTexCoord = decodedTexCoord * uvScale + uvOffset;
    #endif
    #ifdef HAS_AO_MAP
        vec2 decodedTexCoord1 = decode_getTexcoord(aTexCoord1);
        vTexCoord1 = decodedTexCoord1 * uvScale + uvOffset;
    #endif
    #ifdef HAS_EXTRUSION_OPACITY
        vExtrusionOpacity = aExtrusionOpacity;
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

    #if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
        shadow_computeShadowPars(localPositionMatrix * localPosition);
    #endif
    #ifdef HAS_HEATMAP
        heatmap_compute(projMatrix * modelViewMatrix * localPositionMatrix, localPosition);
    #endif

    #ifdef HAS_I3S_UVREGION
        vUvRegion = uvRegion / 65535.0;
    #endif

    highlight_setVarying();

    #ifdef HAS_VERTEX_COLOR
        vertexColor_update();
    #endif
}
