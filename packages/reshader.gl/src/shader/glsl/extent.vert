attribute vec3 aPosition;
uniform mat4 positionMatrix;
uniform mat4 projViewModelMatrix;
#ifdef HAS_VIDEO
    attribute vec2 aTexCoord;
    varying vec2 uv;
#endif
#include <get_output>
void main()
{
    mat4 localPositionMatrix = getPositionMatrix();
    vec4 localPosition = localPositionMatrix * getPosition(aPosition);
    gl_Position = projViewModelMatrix * localPosition;
    #ifdef HAS_VIDEO
        uv = aTexCoord;
    #endif
}
