const text = `precision mediump float;

varying vec3 Normal;
varying vec3 FragPosition;
varying vec2 TexCoord;

//view 位置
uniform vec3 u_cameraPosition;
//反射率
uniform vec3 albedo;
//金属度
uniform float metallic;
//粗糙度
uniform float roughness;
//环境光遮蔽
uniform float ao;

struct PointLight{
    vec3 color;
    vec3 position;
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;

    float constant;
    float linear;
    float quadratic;
};

uniform PointLight u_pointLight;

const float PI = 3.14159265359;

//正态分布，模拟微平面粗糙度
float DistributionGGX(vec3 N,vec3 H,float roughness){
    float a = roughness*roughness;
    float a2 = a*a;
    float NdotH = max(dot(N,H),0.0);
    float NdotH2 = NdotH*NdotH;
    float nom = a2;
    float denom = (NdotH2*(a2-1.0)+1.0);
    denom = PI*denom*denom;
    return nom/max(denom,0.001);
}

//菲涅尔方程
float GeometrySchlickGGX(float NdotV,float roughness){
    float r = (roughness + 1.0);
    float k = (r*r) / 8.0;
    float nom   = NdotV;
    float denom = NdotV * (1.0 - k) + k;
    return nom / denom;
}

//菲涅尔方程
float GeometrySmith(vec3 N,vec3 V,vec3 L,float roughness){
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);
    return ggx1 * ggx2;
}

//集合函数，用来模拟微平面相互遮蔽比率
vec3 fresnelSchlick(float cosTheta,vec3 F0){
    return F0 + (vec3(1.0) - F0) * pow(1.0 - cosTheta, 5.0);
}

void main(){
    vec3 F0 = vec3(0.04);
    vec3 Lo = vec3(0.0);
    F0 = mix(F0,albedo,metallic);
    float distance = length(u_pointLight.position-FragPosition);
    float attenuation = 1.0 / (distance * distance);
    vec3 radiance = u_pointLight.color * attenuation;
    vec3 N = normalize(Normal);
    vec3 V = normalize(u_cameraPosition - FragPosition);
    vec3 L = normalize(u_pointLight.position - FragPosition);
    vec3 H = normalize(V + L);
    //模拟微平面分部
    float NDF = DistributionGGX(N,H,roughness);
    float G = GeometrySmith(N,V,L,roughness);
    vec3 F = fresnelSchlick(clamp(dot(H, V), 0.0, 1.0), F0);
    vec3 nominator = NDF * G * F; 
    float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0);
    vec3 specular = nominator / max(denominator, 0.001);
    vec3 kS = F;
    vec3 kD = vec3(1.0) - kS;
    kD *= 1.0 - metallic;	  
    float NdotL = max(dot(N, L), 0.0);        
    Lo += (kD * albedo / PI + specular) * radiance * NdotL;
    //
    vec3 ambient = vec3(0.03) * albedo * ao;
    vec3 color = ambient + Lo;
    //HDR
    color = color / (color + vec3(1.0));
    //gamma correct
    color = pow(color, vec3(1.0/2.2));

    gl_FragColor= vec4(color,1.0);
}`;

module.exports = text;