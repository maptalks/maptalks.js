attribute vec3 aPosition;
#ifdef HAS_NORMAL
    attribute vec3 aNormal;
#else
    attribute vec4 aTangent;
#endif
attribute vec3 aColor;

uniform mat4 projViewModelMatrix; //
uniform mat4 modelMatrix;
uniform mat3 normalMatrix; //法线矩阵

varying vec3 vNormal;
varying vec3 vFragPos;
varying vec3 vColor;

#ifdef USE_EXTRUSION_OPACITY
    attribute float aExtrusionOpacity;
    varying float vExtrusionOpacity;
#endif
varying vec2 vPosition;

/**
 * Extracts the normal vector of the tangent frame encoded in the specified quaternion.
 */
void toTangentFrame(const highp vec4 q, out highp vec3 n) {
    n = vec3( 0.0,  0.0,  1.0) +
        vec3( 2.0, -2.0, -2.0) * q.x * q.zwx +
        vec3( 2.0,  2.0, -2.0) * q.y * q.wzy;
}

#include <highlight_vert>

void main()
{
    #ifdef HAS_NORMAL
        vec3 normal = aNormal;
    #else
        vec3 normal;
        toTangentFrame(aTangent, normal);
    #endif
    vec4 pos = vec4(aPosition, 1.0);
    gl_Position = projViewModelMatrix * pos;
    vNormal = normalMatrix * normal;
    vFragPos = vec3(modelMatrix * pos);
    vColor = aColor / 255.0;

    #ifdef USE_EXTRUSION_OPACITY
        vExtrusionOpacity = aExtrusionOpacity;
    #endif
    vPosition = aPosition.xy;

    highlight_setVarying();
}
