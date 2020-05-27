#include <gl2_vert>
#define SHADER_NAME PBR
precision highp float;

attribute vec3 aPosition;

#if defined(HAS_MAP)
    attribute vec2 aTexCoord;
    uniform vec2 uvScale;
    uniform vec2 uvOffset;
#endif
#if defined(HAS_TANGENT)
    attribute vec4 aTangent;
#else
    attribute vec3 aNormal;
#endif

vec3 Vertex;
// vec2 TexCoord6;
vec3 Normal;
vec4 Tangent;

// uniform float uDisplay2D;//0
// uniform float uPointSize;//1070.9412

uniform mat4 uModelMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 positionMatrix;
uniform mat4 uProjectionMatrix;
// uniform mat4 uProjViewModelMatrix;
// uniform mat4 uViewMatrix;
// uniform vec2 uGlobalTexRatio;
uniform vec2 uGlobalTexSize;
uniform vec2 uHalton;

uniform mat3 uModelNormalMatrix;

#ifdef HAS_SSR
    uniform mat3 uModelViewNormalMatrix;
    varying vec3 vViewNormal;
#endif
varying vec3 vModelNormal;
varying vec4 vViewVertex;

#if defined(HAS_TANGENT)
    varying vec4 vModelTangent;
    varying vec3 vModelBiTangent;
#endif

varying vec3 vModelVertex;
#if defined(HAS_MAP)
    varying vec2 vTexCoord;
#endif

#if defined(HAS_COLOR)
    attribute vec4 aColor;
    varying vec4 vColor;
#endif

#include <line_extrusion_vert>
#include <get_output>
#include <viewshed_vert>
#include <flood_vert>
#ifdef HAS_SHADOWING
    #include <vsm_shadow_vert>
#endif
#include <heatmap_render_vert>
#include <fog_render_vert>

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

void main() {
    #if defined(HAS_MAP)
        vTexCoord = (aTexCoord + uvOffset) * uvScale;
    #endif

    #if defined(HAS_TANGENT)
        vec3 t;
        toTangentFrame(aTangent, Normal, t);
        // Tangent = vec4(t, aTangent.w);
        // vec4 localTangent = Tangent;
        // vViewTangent = vec4(uModelViewNormalMatrix * localTangent.xyz, localTangent.w);
        vModelTangent = vec4(uModelNormalMatrix * t, aTangent.w);
    #else
        Normal = aNormal;
    #endif

    mat4 localPositionMatrix = getPositionMatrix();
    #ifdef IS_LINE_EXTRUSION
        vec3 linePosition = getLineExtrudePosition(aPosition);
        //linePixelScale = tileRatio * resolution / tileResolution
        vec4 localVertex = getPosition(linePosition);
    #else
        vec4 localVertex = getPosition(aPosition);
    #endif
    vModelVertex = (uModelMatrix * localVertex).xyz;

    vec3 localNormal = Normal;
    vModelNormal = uModelNormalMatrix * localNormal;

    #if defined(HAS_TANGENT)
        vModelBiTangent = cross(vModelNormal, vModelTangent.xyz) * sign(aTangent.w);
    #endif

    #ifdef HAS_SSR
        vViewNormal = uModelViewNormalMatrix * Normal;
         #if defined(HAS_TANGENT)
            // Tangent = vec4(t, aTangent.w);
            vec4 localTangent = vec4(t, aTangent.w);;
            vViewTangent = vec4(uModelViewNormalMatrix * localTangent.xyz, localTangent.w);
        #endif
    #endif

    vec4 viewVertex = uModelViewMatrix * localPositionMatrix * localVertex;
    vViewVertex = viewVertex;
    // gl_Position = uProjectionMatrix * uModelViewMatrix * localVertex;
    mat4 jitteredProjection = uProjectionMatrix;
    jitteredProjection[2].xy += uHalton.xy / uGlobalTexSize.xy;
    gl_Position = jitteredProjection * viewVertex;
    // gl_PointSize = min(64.0, max(1.0, -uPointSize / vViewVertex.z));

    #if defined(HAS_COLOR)
        vColor = aColor / 255.0;
    #endif

    #if defined(HAS_SHADOWING)
        shadow_computeShadowPars(localVertex);
    #endif

    #ifdef HAS_VIEWSHED
        viewshed_getPositionFromViewpoint(modelMatrix * localPositionMatrix * localVertex);
    #endif

    #ifdef HAS_FLOODANALYSE
        flood_getHeight(modelMatrix * localPositionMatrix * localVertex);
    #endif

    #ifdef HAS_HEATMAP
        heatmap_compute(uProjectionMatrix * uModelViewMatrix * localPositionMatrix,localVertex);
    #endif

    #ifdef HAS_FOG
        fog_getDist( modelMatrix * localPositionMatrix * localVertex);
    #endif
}
