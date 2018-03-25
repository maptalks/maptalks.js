//定义点光源
const pointlight_shader = `
    #ifdef POINTLIGHT

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

    #endif
`;

module.exports = pointlight_shader;