const std_fs =`precision mediump float;
#define POINTLIGHT
#ifdef POINTLIGHT
//定义point结构体
struct PointLight{
    //光源相关
    vec3 position;
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
    //衰减相关
    float constant;
    float linear;
    float quadratic;
}
//计算pointlight分量
vec3 pointlight_calcute(PointLight light,vec3 normal,vec3 fragPos,vec3 viewDir){
    //计算光照方向
    vec3 lightDir = normalize(light.position - FragPosition);
    //漫反射着色
    float diff = max(dot(normal, lightDir), 0.0);
    //镜面光着色
    vec3 reflectDir = reflect(-1.0*lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    //衰减
    float distance    = length(light.position - fragPos);
    float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * (distance * distance));
    //合并
    vec3 ambient  = light.ambient  * vec3(texture2D(material.diffuse, TexCoord));
    vec3 diffuse  = light.diffuse  * diff * vec3(texture2D(material.diffuse, TexCoord));
    vec3 specular = light.specular * spec * vec3(texture2D(material.specular, TexCoord));
    ambient  *= attenuation;
    diffuse  *= attenuation;
    specular *= attenuation;
    return (ambient + diffuse + specular);
}
//定义unifrom pointlight
uniform PointLight pointLight;
#endif
//相机位置
uniform vec3 CameraPosition;
//法线
varying vec3 Normal;
//模型坐标
varying vec3 FragPosition;
//纹理坐标
varying vec2 TexCoord;

void main(){
    vec3 normal = normalize(Normal);
    vec3 componentLight = pointlight_calcute(pointlight,normal,FragPosition);
    gl_FragColor = vec4(componentLight,1.0);
}`;

module.exports = std_fs;



