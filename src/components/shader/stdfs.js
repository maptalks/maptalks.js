const std_fs =`precision mediump float;

struct PointLight{
    vec3 position;
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;

    float constant;
    float linear;
    float quadratic;
};

struct Material{
    vec3 ambient;
    sampler2D diffuse;
    sampler2D specular;
    float shininess;
};

vec3 pointlight_calcute(PointLight light,vec3 normal,vec3 fragPos,vec3 cameraPos){
    vec3 lightDir = normalize(light.position - FragPosition);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 reflectDir = reflect(-1.0*lightDir, normal);
    vec3 viewDir = normalize(cameraPos-fragPos);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    float distance    = length(light.position - fragPos);
    float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * (distance * distance));
    vec3 ambient  = light.ambient  * vec3(texture2D(material.diffuse, TexCoord));
    vec3 diffuse  = light.diffuse  * diff * vec3(texture2D(material.diffuse, TexCoord));
    vec3 specular = light.specular * spec * vec3(texture2D(material.specular, TexCoord));
    ambient  *= attenuation;
    diffuse  *= attenuation;
    specular *= attenuation;
    return (ambient + diffuse + specular);
}

uniform PointLight u_pointLight;
uniform Matreial u_material;
uniform vec3 u_cameraPosition;

varying vec3 Normal;
varying vec3 FragPosition;
varying vec2 TexCoord;

void main(){
    vec3 normal = normalize(Normal);
    vec3 componentLight = pointlight_calcute(pointlight,normal,FragPosition,u_cameraPosition);
    gl_FragColor = vec4(componentLight,1.0);
}`;

module.exports = std_fs;



