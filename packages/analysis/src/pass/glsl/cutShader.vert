#include <gl2_vert>
attribute vec3 aPosition;
#include <line_extrusion_vert>

#ifdef HAS_MAP
    uniform vec2 uvScale;
    uniform vec2 uvOffset;
    attribute vec2 aTexCoord;
    varying vec2 vTexCoord;
#endif
#if defined(HAS_COLOR)
    attribute vec4 aColor;
    varying vec4 vColor;
#elif defined(HAS_COLOR0)
    attribute vec4 aColor0;
    varying vec4 vColor;
#endif

varying vec3 vFragPos;
varying vec3 vNormal;

uniform mat4 projMatrix;
uniform mat4 modelViewMatrix;
uniform mat3 modelNormalMatrix;
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

#ifdef HAS_EXTRUSION_OPACITY
    attribute float aExtrusionOpacity;
    varying float vExtrusionOpacity;
#endif

#if defined(HAS_TANGENT)
    varying vec4 vTangent;
#endif

uniform mat4 cut_projViewMatrixFromViewpoint;
varying vec4 cut_positionFromViewpoint;

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
            #ifdef HAS_DECODE_NORMAL
                Normal = getNormal(aNormal);
            #else
                Normal = aNormal;
            #endif
        #endif
        vec3 localNormal = appendMorphNormal(Normal);
        vNormal = normalize(localNormalMatrix * localNormal);
    #else
        vNormal = vec3(0.0);
    #endif

    mat4 jitteredProjection = projMatrix;
    jitteredProjection[2].xy += halton.xy / outSize.xy;
    gl_Position = jitteredProjection * modelViewMatrix * localPositionMatrix * localPosition;
    #ifdef HAS_MAP
        vec2 TexCoord = decode_getTexcoord(aTexCoord);
        vTexCoord = TexCoord * uvScale + uvOffset;
    #endif
    #ifdef HAS_EXTRUSION_OPACITY
        vExtrusionOpacity = aExtrusionOpacity;
    #endif
    #if defined(HAS_COLOR)
        vColor = aColor / 255.0;
    #elif defined(HAS_COLOR0)
        vColor = aColor0 / 255.0;
    #endif
    cut_positionFromViewpoint = cut_projViewMatrixFromViewpoint * modelMatrix * localPositionMatrix * localPosition;
}
