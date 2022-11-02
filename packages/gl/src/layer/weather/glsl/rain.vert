attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

uniform mat4 projMatrix;
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 positionMatrix;

uniform vec3 cameraPosition;
uniform float top;
uniform float bottom;
uniform float time;

varying vec2 vTexCoord;

#include <get_output>

float angle(float x, float y){
    return atan(y, x);
}

vec2 getFoot(vec2 camera, vec2 normal, vec2 pos) {
    vec2 position = vec2(0.0, 0.0);
    float distanceLen = distance(pos, normal);
    float a = angle(camera.x - normal.x, camera.y - normal.y);
    pos.x > normal.x ? a -= 0.785 : a += 0.785;
    position.x = cos(a) * distanceLen;
    position.y = sin(a) * distanceLen;
    return position + normal;
    return position;
}

void main()
{
    vec4 localPosition = getPosition(aPosition);
    mat4 localPositionMatrix = getPositionMatrix();
    vec2 foot = getFoot(vec2(cameraPosition.x, cameraPosition.z), vec2(aNormal.x, aNormal.z), vec2(localPosition.x, localPosition.z));
    float height = top - bottom;
    float y = aNormal.y - bottom - height * time;
    y = y + (y < 0.0 ? height : 0.0);
    float ratio = (1.0 - y / height) * (1.0 - y / height);
    y = height * (1.0 - ratio);
    y += bottom;
    y += aPosition.y - aNormal.y;
    localPosition = vec4( foot.x, y, foot.y , 1.0);
    gl_Position = projMatrix * modelViewMatrix * localPositionMatrix * localPosition;
    vTexCoord = aTexCoord;
}
