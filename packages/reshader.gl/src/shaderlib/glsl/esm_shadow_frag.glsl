uniform sampler2D shadowMap;

varying vec3 vLightSpacePos[NUM_OF_DIR_LIGHTS];

float chebyshevUpperBound(vec3 projCoords){
    // if(projCoords.z >= 1.0 || projCoords.x < 0.0 || projCoords.x > 1.0 || projCoords.y < 0.0 || projCoords.y > 1.0) return 1.0; 
    vec2 moments = texture2D(shadowMap, projCoords.xy).rg;
    float distance = projCoords.z;
    // Surface is fully lit. as the current fragment is before the light occluder
    if (distance >= 1.0 || distance <= moments.x)
        return 1.0 ;

    // The fragment is either in shadow or penumbra. We now use chebyshev's upperBound to check
    // How likely this pixel is to be lit (p_max)
    float variance = moments.y - (moments.x*moments.x);
    variance = max(variance,0.00002);

    float d = distance - moments.x;
    float p_max = variance / (variance + d * d);

    return p_max;
}

float computeShadow(lightSpacePos) {
    // 执行透视除法
    vec3 projCoords = lightSpacePos.xyz / lightSpacePos.w;
    // 变换到[0,1]的范围
    projCoords = projCoords * 0.5 + 0.5;

    return chebyshevUpperBound(projCoords);
}
