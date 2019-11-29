attribute vec3 aPosition;

#ifdef HAS_MAP
    attribute vec2 aTexCoord;
    varying vec2 vTexCoords;
#endif
#ifdef HAS_COLOR
    attribute vec4 aColor;
    varying vec4 vColor;
#endif

#if defined(HAS_TANGENT)
    attribute vec4 aTangent;
#else
    attribute vec3 aNormal;
#endif
varying vec3 vFragPos;
varying vec3 vNormal;

uniform mat4 projMatrix;
uniform mat4 viewModelMatrix;
uniform mat4 normalMatrix;
uniform mat4 modelMatrix;
uniform mat4 positionMatrix;
uniform vec2 halton;
uniform vec2 globalTexSize;

uniform mat4 projViewMatrix;
// uniform mat4 projViewModelMatrix;

#include <get_output>

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


void main()
{
    mat4 localPositionMatrix = getPositionMatrix();
    vec4 localPosition = getPosition(aPosition);
    mat4 localNormalMatrix = getNormalMatrix(localPositionMatrix);
    vFragPos = vec3(modelMatrix * localPositionMatrix * localPosition);
    vec3 Normal;
    #if defined(HAS_TANGENT)
        vec3 t;
        toTangentFrame(aTangent, Normal, t);
        vTangent = vec4(localNormalMatrix * t, aTangent.w);
    #else
        Normal = aNormal;
    #endif
    vec4 localNormal = getNormal(Normal);
    vNormal = normalize(vec3(localNormalMatrix * localNormal));

    mat4 jitteredProjection = projMatrix;
    jitteredProjection[2].xy += halton.xy / globalTexSize.xy;
    gl_Position = jitteredProjection * viewModelMatrix * localPositionMatrix * localPosition;
    #ifdef HAS_MAP
        vTexCoords = aTexCoord;
    #endif
    #ifdef HAS_EXTRUSION_OPACITY
        vExtrusionOpacity = aExtrusionOpacity;
    #endif
    #ifdef HAS_COLOR
        vColor = aColor / 255.0;
    #endif
}
