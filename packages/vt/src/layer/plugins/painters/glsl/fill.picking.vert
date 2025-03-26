#include <gl2_vert>
#ifdef HAS_ALTITUDE
    attribute vec2 aPosition;
    attribute float aAltitude;
#else
    attribute vec3 aPosition;
#endif

uniform mat4 projViewModelMatrix;
uniform mat4 positionMatrix;

#include <fbo_picking_vert>

#include <vt_position_vert>

void main() {
    vec3 myPosition = unpackVTPosition();
    gl_Position = projViewModelMatrix * positionMatrix * vec4(myPosition, 1.);

    fbo_picking_setData(gl_Position.w, true);
}
