//--------------------------
// 阴影着色
//
//
// uniform sampler2D vsm_shadow_shadowMap 深度纹理
// uniform float vsm_shadow_opacity 阴影透明度
//
//
// void shadow_computeShadow()
// 计算某个有向光源在当前片元的阴影值
//
// 示例：
// // 计算有向光源在当前片元的阴影值
// float shadow = shadow_computeShadow();
//--------------------------

uniform sampler2D vsm_shadow_shadowMap;
uniform float vsm_shadow_opacity;

varying vec4 vsm_shadow_vLightSpacePos;

float esm(vec3 projCoords, vec4 shadowTexel) {
    // vec2 uv = projCoords.xy;
    float compare = projCoords.z;
    float c = 50.0;
    float depth = shadowTexel.b;

    // depth = exp(-c * min(compare - depth, 0.05));
    depth = exp(c * depth) * exp(-c * compare);
    return clamp(depth, 0.0, 1.0);
}

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

float shadow_computeShadow_coeff(sampler2D shadowMap, vec3 projCoords) {
    vec2 uv = projCoords.xy;
    vec4 shadowTexel = texture2D(shadowMap, uv);
    float esm_coeff = esm(projCoords, shadowTexel);
    float vsm_coeff = vsm_shadow_chebyshevUpperBound(projCoords, shadowTexel);
    float coeff = esm_coeff * vsm_coeff;
    return 1.0 - (1.0 - coeff) * vsm_shadow_opacity;
}

float shadow_computeShadow() {
    // 执行透视除法
    vec3 projCoords = vsm_shadow_vLightSpacePos.xyz / vsm_shadow_vLightSpacePos.w;
    // 变换到[0,1]的范围
    projCoords = projCoords * 0.5 + 0.5;
    if(projCoords.z >= 1.0 || projCoords.x < 0.0 || projCoords.x > 1.0 || projCoords.y < 0.0 || projCoords.y > 1.0) return 1.0;
    return shadow_computeShadow_coeff(vsm_shadow_shadowMap, projCoords);

}
