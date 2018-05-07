//--------------------------
// 阴影着色
//
// #define NUM_OF_DIR_LIGHTS 整型 有向光源数量
//
// uniform sampler2D vsm_shadow_shadowMap[NUM_OF_DIR_LIGHTS] 深度纹理
//
//
// void vsm_shadow_computeShadow(int dirLightIdx)
// 计算某个有向光源在当前片元的阴影值
//   * int dirLightIdx : 有向光源的序号
//
// 示例：
// // 计算第一个有向光源在当前片元的阴影值
// float shadow = vsm_shadow_computeShadow(0);
//--------------------------

uniform sampler2D vsm_shadow_shadowMap[NUM_OF_DIR_LIGHTS];

varying vec4 vsm_shadow_vLightSpacePos[NUM_OF_DIR_LIGHTS];

float vsm_shadow_chebyshevUpperBound(sampler2D shadowMap, vec3 projCoords){
    // if(projCoords.z >= 1.0 || projCoords.x < 0.0 || projCoords.x > 1.0 || projCoords.y < 0.0 || projCoords.y > 1.0) return 1.0;
    vec2 moments = texture2D(shadowMap, projCoords.xy).rg;
    float distance = projCoords.z;
    // Surface is fully lit. as the current fragment is before the light occluder
    if (distance >= 1.0 || distance <= moments.x)
        return 1.0 ;

    // The fragment is either in shadow or penumbra. We now use chebyshev's upperBound to check
    // How likely this pixel is to be lit (p_max)
    float variance = moments.y - (moments.x * moments.x);
    variance = max(variance, 0.00002);

    float d = distance - moments.x;
    float p_max = variance / (variance + d * d);

    return p_max;
}

float vsm_shadow_computeShadow(int dirLightIdx) {
    for (int i = 0; i < NUM_OF_DIR_LIGHTS; i++) {
        if (i == dirLightIdx) {
            // 执行透视除法
            vec3 projCoords = vsm_shadow_vLightSpacePos[i].xyz / vsm_shadow_vLightSpacePos[i].w;
            // 变换到[0,1]的范围
            projCoords = projCoords * 0.5 + 0.5;

            return vsm_shadow_chebyshevUpperBound(vsm_shadow_shadowMap[i], projCoords);
        }
    }

}
