#version 100
// precision highp float;

attribute vec3 aPosition;
// attribute vec2 aTexCoord;
attribute vec4 aTangent;

vec3 Vertex;
// vec2 TexCoord6;
vec3 Normal;
vec4 Tangent;

// uniform float uDisplay2D;//0
// uniform float uPointSize;//1070.9412
uniform mat3 uModelNormalMatrix;
uniform mat3 uModelViewNormalMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
// uniform mat4 uViewMatrix;
// uniform vec2 uGlobalTexRatio;
// uniform vec2 uGlobalTexSize;
// uniform vec4 uHalton;
varying vec3 vViewNormal;
varying vec3 vModelNormal;
varying vec3 vModelVertex;
varying vec2 vTexCoord6;
varying vec4 vViewTangent;
varying vec4 vViewVertex;
#define SHADER_NAME PBR_Opaque(glass)

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
    Vertex = aPosition;
    // TexCoord6 = aTexCoord;
    vec3 t;
    toTangentFrame(aTangent, Normal, t);
    Tangent = vec4(t, sign(aTangent.w));

    // vTexCoord6 = TexCoord6;
    vec3 localVertex = Vertex.xyz;
    vModelVertex = (uModelMatrix * vec4(localVertex, 1.0)).xyz;
    vec3 localNormal = Normal;
    vModelNormal = uModelNormalMatrix * localNormal;
    vViewNormal = uModelViewNormalMatrix * localNormal;
    vec4 localTangent = Tangent;
    vViewTangent = vec4(uModelViewNormalMatrix * localTangent.xyz, localTangent.w);
    vViewVertex = uModelViewMatrix * vec4(localVertex, 1.0);
    gl_Position = uProjectionMatrix * vViewVertex;
    // mat4 jitteredProjection = uProjectionMatrix;
    // jitteredProjection[2].xy += (1.0 - uDisplay2D) * (uHalton.xy * uGlobalTexRatio.xy / uGlobalTexSize.xy);
    // gl_Position = jitteredProjection * vViewVertex;
    // gl_PointSize = min(64.0, max(1.0, -uPointSize / vViewVertex.z));
}
