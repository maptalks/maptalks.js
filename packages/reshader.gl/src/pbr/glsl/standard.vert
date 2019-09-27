#define SHADER_NAME PBR
// precision highp float;

attribute vec3 aPosition;
#if defined(HAS_MAP)
    attribute vec2 aTexCoord0;
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

// uniform mat3 uModelViewNormalMatrix;
uniform mat4 uModelMatrix;
// uniform mat4 uModelViewMatrix;
// uniform mat4 uProjectionMatrix;
uniform mat4 uProjViewModelMatrix;
// uniform mat4 uViewMatrix;
// uniform vec2 uGlobalTexRatio;
// uniform vec2 uGlobalTexSize;
// uniform vec4 uHalton;

uniform mat3 uModelNormalMatrix;

// varying vec3 vViewNormal;
varying vec3 vModelNormal;
#if defined(HAS_TANGENT)
    varying vec4 vModelTangent;
#endif

varying vec3 vModelVertex;
#if defined(HAS_MAP)
    varying vec2 vTexCoord;
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

void main() {
    #if defined(HAS_MAP)
        vTexCoord = aTexCoord0;
    #endif

    #if defined(HAS_TANGENT)
        vec3 t;
        toTangentFrame(aTangent, Normal, t);
        Tangent = vec4(t, sign(aTangent.w));
        vec4 localTangent = Tangent;
        // vViewTangent = vec4(uModelViewNormalMatrix * localTangent.xyz, localTangent.w);
        vModelTangent = vec4(uModelNormalMatrix * localTangent.xyz, sign(aTangent.w));
    #else
        Normal = aNormal;
    #endif

    vec4 localVertex = vec4(aPosition, 1.0);
    vModelVertex = (uModelMatrix * localVertex).xyz;

    vec3 localNormal = Normal;
    vModelNormal = uModelNormalMatrix * localNormal;

    // vViewNormal = uModelViewNormalMatrix * localNormal;

    // vViewVertex = uModelViewMatrix * vec4(localVertex, 1.0);
    gl_Position = uProjViewModelMatrix * localVertex;
    // mat4 jitteredProjection = uProjectionMatrix;
    // jitteredProjection[2].xy += (1.0 - uDisplay2D) * (uHalton.xy * uGlobalTexRatio.xy / uGlobalTexSize.xy);
    // gl_Position = jitteredProjection * vViewVertex;
    // gl_PointSize = min(64.0, max(1.0, -uPointSize / vViewVertex.z));
}
