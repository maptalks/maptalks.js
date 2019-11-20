//--------------------------
// 阴影着色
//
//
// uniform sampler2D shadow_shadowMap 深度纹理
// uniform float shadow_opacity 阴影透明度
//
//
// void shadow_computeShadow()
// 计算某个有向光源在当前片元的阴影值
//
// 示例：
// // 计算有向光源在当前片元的阴影值
// float shadow = shadow_computeShadow();
//--------------------------

uniform sampler2D shadow_shadowMap;
uniform float shadow_opacity;
#if defined(USE_ESM)
    uniform float esm_shadow_threshold;
#endif

varying vec4 shadow_vLightSpacePos;

#ifdef PACK_FLOAT
    #include <common_pack_float>
#endif

#if defined(USE_ESM)
float esm(vec3 projCoords, vec4 shadowTexel) {
    // vec2 uv = projCoords.xy;
    float compare = projCoords.z;
    float c = 50.0;
    #ifdef PACK_FLOAT
        float depth = common_decodeDepth(shadowTexel);
        if (depth >= 1.0 - 1E-6 || compare <= depth) {
            return 1.0;
        }
    #else
        float depth = shadowTexel.r;
    #endif

    depth = exp(-c * min(compare - depth, 0.05));
    // depth = exp(c * depth) * exp(-c * compare);
    return clamp(depth, esm_shadow_threshold, 1.0);
}
#endif

#if defined(USE_VSM)
float vsm_shadow_chebyshevUpperBound(vec3 projCoords, vec4 shadowTexel){

    vec2 moments = shadowTexel.rg;
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
#endif

float shadow_computeShadow_coeff(sampler2D shadowMap, vec3 projCoords) {
    vec2 uv = projCoords.xy;
    vec4 shadowTexel = texture2D(shadowMap, uv);
    #if defined(USE_ESM)
        float esm_coeff = esm(projCoords, shadowTexel);
        float coeff = esm_coeff * esm_coeff;
    #endif
    #if defined(USE_VSM)
        float vsm_coeff = vsm_shadow_chebyshevUpperBound(projCoords, shadowTexel);
        float coeff = vsm_coeff;
    #endif
    return 1.0 - (1.0 - coeff) * shadow_opacity;
}

float shadow_computeShadow() {
    // 执行透视除法
    vec3 projCoords = shadow_vLightSpacePos.xyz / shadow_vLightSpacePos.w;
    // 变换到[0,1]的范围
    projCoords = projCoords * 0.5 + 0.5;
    if(projCoords.z >= 1.0 || projCoords.x < 0.0 || projCoords.x > 1.0 || projCoords.y < 0.0 || projCoords.y > 1.0) return 1.0;
    return shadow_computeShadow_coeff(shadow_shadowMap, projCoords);

}
