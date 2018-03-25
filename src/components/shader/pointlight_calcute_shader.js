
//计算pointlight分量
const pointlight_calcute_shader = `
    #ifdef POINTLIGHT

    vec3 pointlight_calcute(PointLight light,vec3 normal,vec3 fragPos,vec3 viewDir){
        //计算光照方向
        vec3 lightDir = normalize(light.position - fragPos);
        //漫反射着色
        float diff = max(dot(normal, lightDir), 0.0);
        //镜面光着色
        vec3 reflectDir = reflect(-1.0*lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
        //衰减
        float distance    = length(light.position - fragPos);
        float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * (distance * distance));
        //合并
        vec3 ambient  = light.ambient  * vec3(texture2D(material.diffuse, TexCoords));
        vec3 diffuse  = light.diffuse  * diff * vec3(texture2D(material.diffuse, TexCoords));
        vec3 specular = light.specular * spec * vec3(texture2D(material.specular, TexCoords));
        ambient  *= attenuation;
        diffuse  *= attenuation;
        specular *= attenuation;
        return (ambient + diffuse + specular);
    }

    #endif
`;

module.exports = pointlight_calcute_shader;