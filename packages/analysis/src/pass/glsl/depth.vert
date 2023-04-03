#include <gl2_vert>
#ifdef HAS_ALTITUDE
    attribute vec2 aPosition;
    attribute float aAltitude;
#else
    attribute vec3 aPosition;
#endif
// uniform mat4 projViewMatrix;
// uniform mat4 modelMatrix;
uniform mat4 projViewModelMatrix;
uniform mat4 positionMatrix;
varying vec2 vHighPrecisionZW;
#include <get_output>
varying float vFragDepth;

#ifdef HAS_ALTITUDE
    vec3 unpackVTPosition() {
        return vec3(aPosition, aAltitude);
    }
#endif
void main()
{
    #ifdef HAS_ALTITUDE
        vec3 i = unpackVTPosition();
        vec4 j = vec4(i, 1.);
        gl_Position = projViewModelMatrix * j;
    #else
        mat4 localPositionMatrix = getPositionMatrix();
        gl_Position = projViewModelMatrix * localPositionMatrix * getPosition(aPosition);
    #endif
    vFragDepth = 1.0 + gl_Position.w;
    vHighPrecisionZW = gl_Position.zw;
}
