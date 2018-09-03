//--------------------------
// 阴影相关的变量计算
//
// #define NUM_OF_DIR_LIGHTS 整型 有向光源数量
//
// uniform mat4 vsm_shadow_lightProjViewModelMatrix[NUM_OF_DIR_LIGHTS] 有向光源的projView矩阵， ortho projection * view matrix * model matrix
//
//
// void shadow_computeShadowPars(vec4 worldPos)
// 计算阴影frag需要的varying变量
//   * vec4 worldPos : 顶点世界坐标 model * aPosition
//
// 示例：
// vec4 position = vec4(aPosition, 1.0);
// shadow_computeShadowPars(worldPos);
//--------------------------

uniform mat4 vsm_shadow_lightProjViewModelMatrix[NUM_OF_DIR_LIGHTS];

varying vec4 vsm_shadow_vLightSpacePos[NUM_OF_DIR_LIGHTS];

void shadow_computeShadowPars(vec4 position) {
    for (int i = 0; i < NUM_OF_DIR_LIGHTS; i++) {
        vsm_shadow_vLightSpacePos[i] = vsm_shadow_lightProjViewModelMatrix[i] * position;
    }
}
