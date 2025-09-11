attribute vec3 aPosition;
uniform mat4 positionMatrix;
uniform mat4 projViewModelMatrix;
#ifdef HAS_TEXTURE
    attribute vec2 aTexCoord;
    varying vec2 uv;
    varying vec4 vPos;
#endif
#include <get_output>
void main()
{
    mat4 localPositionMatrix = getPositionMatrix();
    vec4 localPosition = localPositionMatrix * getPosition(aPosition);
    gl_Position = projViewModelMatrix * localPosition;
    #ifdef HAS_TEXTURE
        uv = aTexCoord;
        vPos = getPosition(aPosition);
    #endif
}
