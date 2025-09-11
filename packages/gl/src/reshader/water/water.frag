
precision highp float;
precision highp sampler2D;
uniform sampler2D texWaveNormal;
uniform sampler2D texWavePerturbation;
uniform vec3 octaveTextureRepeat;
// waveParams是一个长度为4的数组，分别代表[波动强度, 法线贴图的repeat次数, 水流的强度, 水流动的偏移量]
uniform vec4 waveParams;
uniform vec2 waveDirection;
uniform vec4 waterColor;
uniform vec3 lightingDirection;
uniform vec3 lightingIntensity;
uniform vec3 camPos;
uniform float timeElapsed;
varying vec2 vuv;
varying vec3 vpos;
varying vec3 vnormal;
varying mat3 vtbnMatrix;

const vec2  FLOW_JUMP = vec2(6.0/25.0, 5.0/24.0);
vec2 textureDenormalized2D(sampler2D _tex, vec2 uv) {
    return 2.0 * texture2D(_tex, uv).rg - 1.0;
}
float sampleNoiseTexture(vec2 uv) {
    return texture2D(texWavePerturbation, uv).b;
}
vec3 textureDenormalized3D(sampler2D _tex, vec2 uv) {
    return 2.0 * texture2D(_tex, uv).rgb - 1.0;
}
float computeProgress(vec2 uv, float time) {
    return fract(time);
}
float computeWeight(vec2 uv, float time) {
    float progress = computeProgress(uv, time);
    return 1.0 - abs(1.0 - 2.0 * progress);
}
vec3 computeUVPerturbedWeigth(sampler2D texFlow, vec2 uv, float time, float phaseOffset) {
    float flowStrength = waveParams[2];
    float flowOffset = waveParams[3];
    vec2 flowVector = textureDenormalized2D(texFlow, uv) * flowStrength;
    float progress = computeProgress(uv, time + phaseOffset);
    float weight = computeWeight(uv, time + phaseOffset);
    vec2 result = uv;
    result -= flowVector * (progress + flowOffset);
    result += phaseOffset;
    result += (time - progress) * FLOW_JUMP;
    return vec3(result, weight);
}
const float TIME_NOISE_TEXTURE_REPEAT = 0.3737;
const float TIME_NOISE_STRENGTH = 7.77;
vec3 getWaveLayer(sampler2D texNormal, sampler2D dudv, vec2 uv, vec2 _waveDir, float time) {
    float waveStrength = waveParams[0];

    // 用于计算uv方向的整体偏移量
    //为确保波速的单位长度方向不至于过快，需要对波速做了一个硬编码的操作
    vec2 waveMovement = time * -_waveDir;
    float timeNoise = sampleNoiseTexture(uv * TIME_NOISE_TEXTURE_REPEAT) * TIME_NOISE_STRENGTH;

    //通过采样发现贴图和扰动贴图，实时计算当前帧点的位置
    vec3 uv_A = computeUVPerturbedWeigth(dudv, uv + waveMovement, time + timeNoise, 0.0);
    vec3 uv_B = computeUVPerturbedWeigth(dudv, uv + waveMovement, time + timeNoise, 0.5);
    vec3 normal_A = textureDenormalized3D(texNormal, uv_A.xy) * uv_A.z;
    vec3 normal_B = textureDenormalized3D(texNormal, uv_B.xy) * uv_B.z;

    //展平波形，缩放法线的xy分量，然后调整z（向上）分量
    vec3 mixNormal = normalize(normal_A + normal_B);
    mixNormal.xy *= waveStrength;
    mixNormal.z = sqrt(1.0 - dot(mixNormal.xy, mixNormal.xy));
    return mixNormal;
}
vec3 getSurfaceNormal(vec2 uv, float time) {
    float waveTextureRepeat = waveParams[1];
    return getWaveLayer(texWaveNormal, texWavePerturbation, uv * waveTextureRepeat, waveDirection, time);
}


const float PI = 3.141592653589793;
const float LIGHT_NORMALIZATION = 1.0 / PI;
const float INV_PI = 0.3183098861837907;
const float HALF_PI = 1.570796326794897;
struct PBRShadingWater {
    float NdotL;   //法线与光线夹角的余弦

    float NdotV;   //法线与视线夹角的余弦

    float NdotH;   //法线的半角余弦

    float VdotH;   //视线的半角余弦

    float LdotH;   //光线的半角余弦

    float VdotN;   //视线与法线夹角的余弦
};
float dtrExponent = 2.2;
vec3 fresnelReflection(float angle, vec3 f0, float f90) {
    return f0 + (f90 - f0) * pow(1.0 - angle, 5.0);
}
float normalDistributionWater(float NdotH, float roughness) {
    float r2 = roughness * roughness;
    float NdotH2 = NdotH * NdotH;
    float denom = pow((NdotH2 * (r2 - 1.0) + 1.0), dtrExponent) * PI;
    return r2 / denom;
}
float geometricOcclusionKelemen(float LoH) {
    return 0.25 / (LoH * LoH);
}
vec3 brdfWater(in PBRShadingWater props, float roughness, vec3 F0, float F0Max) {
    vec3  F = fresnelReflection(props.VdotH, F0, F0Max);
    float D = normalDistributionWater(props.NdotH, roughness);
    float V = geometricOcclusionKelemen(props.LdotH);
    return (D * V) * F;
}
vec3 tonemapACES(const vec3 x) {
    return (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
}
const float GAMMA = 2.2;
const float INV_GAMMA = 0.4545454545; // 1 / GAMMA


// gamma校正
vec4 delinearizeGamma(vec4 color) {
    return vec4(pow(color.rgb, vec3(INV_GAMMA)), color.w);
}
vec3 linearizeGamma(vec3 color) {
    return pow(color, vec3(GAMMA));
}
const vec3 fresnelSky = vec3(0.02, 1.0, 5.0);

const vec2 fresnelMaterial = vec2(0.02, 0.1);

const float roughness = 0.06;
const vec3 skyZenitColor = vec3(0, 0.6, 0.9);
const vec3 skyColor = vec3(0.72, 0.92, 1.0);
PBRShadingWater shadingInfo;

//计算菲涅尔折射
vec3 getSkyGradientColor(in float cosTheta, in vec3 horizon, in vec3 zenit) {
    float exponent = pow((1.0 - cosTheta), fresnelSky[2]);
    return mix(zenit, horizon, exponent);
}

vec3 getSeaColor(in vec3 n, in vec3 v, in vec3 l, vec3 color, in vec3 lightIntensity, in vec3 localUp, in float shadow) {
    vec3 seaWaterColor = linearizeGamma(color);

    vec3 h = normalize(l + v);
    shadingInfo.NdotL = clamp(dot(n, l), 0.0, 1.0);
    shadingInfo.NdotV = clamp(dot(n, v), 0.001, 1.0);
    shadingInfo.VdotN = clamp(dot(v, n), 0.001, 1.0);
    shadingInfo.NdotH = clamp(dot(n, h), 0.0, 1.0);
    shadingInfo.VdotH = clamp(dot(v, h), 0.0, 1.0);
    shadingInfo.LdotH = clamp(dot(l, h), 0.0, 1.0);

    float upDotV = max(dot(localUp, v), 0.0);

    //反射的天空颜色：反射的天空颜色由两种主要颜色组成，即地平线上的反射颜色和zenit的反射颜色。
    //然后，反射的天空颜色是基于菲涅耳方程的近似值计算。
    vec3 skyHorizon = linearizeGamma(skyColor);
    vec3 skyZenit = linearizeGamma(skyZenitColor);
    vec3 skyColor = getSkyGradientColor(upDotV, skyHorizon, skyZenit );

    //对水的反射光进行平滑
    float upDotL = max(dot(localUp, l), 0.0);

    skyColor *= 0.1 + upDotL * 0.9;

    //如果水面处于阴影中，需要稍微调暗，然后用clamp方法简单计算水波的偏移量
    float shadowModifier = clamp(shadow, 0.8, 1.0);

    //反射的天空颜色由菲涅耳反射乘以近似的天空颜色组成
    vec3 reflSky = fresnelReflection(shadingInfo.VdotN, vec3(fresnelSky[0]), fresnelSky[1]) * skyColor * shadowModifier;
    //计算水的颜色.
    vec3 reflSea = seaWaterColor * mix(skyColor, upDotL * lightIntensity * LIGHT_NORMALIZATION, 2.0 / 3.0) * shadowModifier;
    vec3 specular = vec3(0.0);
    if(upDotV > 0.0 && upDotL > 0.0) {
        // 计算 BRDF 并简化环境光遮罩
        vec3 specularSun = brdfWater(shadingInfo, roughness, vec3(fresnelMaterial[0]), fresnelMaterial[1]);

        vec3 incidentLight = lightIntensity * LIGHT_NORMALIZATION * shadow;
        specular = shadingInfo.NdotL * incidentLight * specularSun;
    }
    //对天空色，水色和高光色进行混合
    return tonemapACES(reflSky + reflSea + specular);
}
void main() {
    vec3 localUp = vnormal;
    //切线空间
    vec3 tangentNormal = getSurfaceNormal(vuv, timeElapsed);

    //在切线空间中旋转法线
    vec3 n = normalize(vtbnMatrix * tangentNormal);
    vec3 v = -normalize(vpos - camPos);
    vec3 l = normalize(-lightingDirection);
    float shadow = 1.0;
    vec4 final = vec4(getSeaColor(n, v, l, waterColor.rgb, lightingIntensity, localUp, shadow), waterColor.w);
    gl_FragColor = delinearizeGamma(final);
}
