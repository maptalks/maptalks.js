#include <gl2_vert>
#define SHADER_NAME GEO_3DTILES_PICKING

attribute vec3 aPosition;

#if defined(HAS_COLOR)
    attribute vec4 aColor;
#endif
#if defined(HAS_COLOR0)
    #if COLOR0_SIZE == 3
        attribute vec3 aColor0;
        varying vec3 vColor0;
    #else
        attribute vec4 aColor0;
        varying vec4 vColor0;
    #endif
#endif


uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 positionMatrix;
uniform mat4 projMatrix;

#include <line_extrusion_vert>
#include <get_output>

#include <fbo_picking_vert>
void main() {
    mat4 localPositionMatrix = getPositionMatrix();
    vec4 localVertex = getPosition(aPosition);

    vec4 position = localPositionMatrix * localVertex;
    vec4 viewVertex = modelViewMatrix * position;

    #ifdef HAS_MASK_EXTENT
        gl_Position = projMatrix * getMaskPosition(position, modelMatrix);
    #else
        gl_Position = projMatrix * viewVertex;
    #endif

    float alpha = 1.0;
    #if defined(HAS_COLOR)
        alpha *= aColor.a;
    #endif
    #if defined(HAS_COLOR0) && COLOR0_SIZE == 4
        alpha *= aColor0.a;
    #endif

    fbo_picking_setData(gl_Position.w, alpha != 0.0);


}
