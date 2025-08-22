#define SHADER_NAME VT_HEIGHT_MASK_VERT
#include <gl2_vert>
#ifdef HAS_ALTITUDE
    attribute vec2 aPosition;
    attribute float aAltitude;
#else
    attribute vec3 aPosition;
#endif

uniform mat4 projViewModelMatrix;
uniform mat4 positionMatrix;

#include <vt_position_vert>

varying float vAltitude;

void main() {
    vec3 myPosition = unpackVTPosition();
    vec4 localVertex = positionMatrix * vec4(myPosition, 1.);
    // centimeter -> meter
    vAltitude = localVertex.z / 100.0;
    localVertex.z = 0.0;
    gl_Position = projViewModelMatrix * localVertex;
}
