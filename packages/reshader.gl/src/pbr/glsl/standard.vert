#define SHADER_NAME PBR
precision highp float;

attribute vec3 aPosition;
#if defined(HAS_MAP)
    attribute vec2 aTexCoord0;
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

// uniform mat3 uModelViewNormalMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
// uniform mat4 uProjViewModelMatrix;
// uniform mat4 uViewMatrix;
// uniform vec2 uGlobalTexRatio;
uniform vec2 uGlobalTexSize;
uniform vec2 uHalton;

uniform mat3 uModelNormalMatrix;

// varying vec3 vViewNormal;
varying vec3 vModelNormal;
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
        vTexCoord = (aTexCoord0 + uvOffset) * uvScale;
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

    vec4 localVertex = vec4(aPosition, 1.0);
    vModelVertex = (uModelMatrix * localVertex).xyz;

    vec3 localNormal = Normal;
    vModelNormal = uModelNormalMatrix * localNormal;

    #if defined(HAS_TANGENT)
        vModelBiTangent = cross(vModelNormal, vModelTangent.xyz) * sign(aTangent.w);
    #endif

    // vViewNormal = uModelViewNormalMatrix * localNormal;

    vec4 viewVertex = uModelViewMatrix * localVertex;
    // gl_Position = uProjectionMatrix * uModelViewMatrix * localVertex;
    mat4 jitteredProjection = uProjectionMatrix;
    jitteredProjection[2].xy += uHalton.xy / uGlobalTexSize.xy;
    gl_Position = jitteredProjection * viewVertex;
    // gl_PointSize = min(64.0, max(1.0, -uPointSize / vViewVertex.z));

    #if defined(HAS_COLOR)
        vColor = aColor / 255.0;
    #endif
}
