const text=`precision mediump float;

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

float DistributionGGX(vec3 N,vec3 H,float roughness){
    return 0.01;
}

float GeometrySchlickGGX(float NdotV,float roughness){
    return 0.01;
}

float GeometrySmith(vec3 N,vec3 V,vec3 L,float roughness){
    return 0.01;
}

vec3 freshnelSchlick(float cosTheta,vec3 F0){
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

void main(){
    vec3 N = normalize(Normal);
    gl_FragColor= vec4(0.8,0.8,0.8,1.0);
}`;

module.exports = text;