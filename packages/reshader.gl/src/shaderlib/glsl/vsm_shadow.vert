//--------------------------
// 阴影相关的变量计算
//
//
// uniform mat4 vsm_shadow_lightProjViewModelMatrix 有向光源的projView矩阵， ortho projection * view matrix * model matrix
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

uniform mat4 vsm_shadow_lightProjViewModelMatrix;

varying vec4 vsm_shadow_vLightSpacePos;

void shadow_computeShadowPars(vec4 position) {
    vsm_shadow_vLightSpacePos = vsm_shadow_lightProjViewModelMatrix * position;
}
