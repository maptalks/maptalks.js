attribute vec3 aPosition;
attribute vec2 aShape;
attribute float aRotation;

uniform float cameraToCenterDistance;
// uniform float uCosPitch;
uniform mat4 projViewModelMatrix;
uniform mat4 uMatrix;

//TODO markerRotation

uniform vec2 canvasSize;
uniform int pitchWithMap;

#include <fbo_picking_vert>

void main() {
    gl_Position = projViewModelMatrix * vec4(aPosition, 1.0);
    float distance = gl_Position.w;

    float distanceRatio = cameraToCenterDistance / distance;
    //通过distance动态调整大小
    float perspectiveRatio = clamp(
        0.5 + 0.5 * distanceRatio,
        0.0, // Prevents oversized near-field symbols in pitched/overzoomed tiles
        4.0);

    //图标的旋转角度
    float angleSin = sin(aRotation);
    float angleCos = cos(aRotation);
    vec2 shape = aShape * 2.0 / canvasSize; //乘以2.0
    if (pitchWithMap == 0) {
        // section 3.1 不随视角倾斜
        // 手动构造2x2旋转矩阵
        mat2 rotationMatrix = mat2(angleCos, -1.0 * angleSin, angleSin, angleCos);
        gl_Position.xy += rotationMatrix * shape * perspectiveRatio * gl_Position.w;
    } else {
        // section 3.2 随视角倾斜
        // 手动构造3x3旋转矩阵
        mat3 rotationMatrix = mat3(angleCos, -1.0 * angleSin, 0.0, angleSin, angleCos, 0.0, 0.0, 0.0, 1.0);
        vec3 cameraRight = vec3(uMatrix[0].x, uMatrix[1].x, uMatrix[2].x);
        vec3 offset = cameraRight * shape.x + vec3(0, shape.y, 0);
        gl_Position.xy += (uMatrix * vec4(rotationMatrix * offset, 1.0)).xy * perspectiveRatio * gl_Position.w;
    }

    fbo_picking_setData(gl_Position.w);
}
