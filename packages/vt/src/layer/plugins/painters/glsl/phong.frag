#ifdef GL_ES
    precision mediump float;
#endif

//漫反射所需变量
varying vec3 vNormal; //法线矩阵用于消除 model 变换(不等比缩放时)给法线带来的误差，其计算方法： mat3(transpose(inverse(model)))
varying vec3 vFragPos; //物体当前表面点的世界坐标
varying vec3 vColor;

//镜面光照所需变量
uniform vec3 camPos; //相机的位置，用于计算

//材质struct
struct Material {
    vec3 ambient;  //环境光的物体颜色
    vec3 diffuse;  //漫反射的物体颜色
    vec3 specular; //镜面光照的反射颜色
    float shininess; //反光度，镜面高光的散射/半径
    float opacity;
};
uniform Material material;

//光源
struct Light {
    vec3 direction; //光源位置的世界坐标

    vec3 ambient;  //环境光光强（颜色）
    vec3 diffuse;  //漫反射光光强（颜色）
    vec3 specular; //镜面反射光光强（颜色）
};

uniform Light light;

uniform float opacity;


#ifdef USE_EXTRUSION_OPACITY
    uniform vec2 extrusionOpacityRange;
    uniform float extrusionOpacityStep;
    varying float vExtrusionOpacity;
#endif

uniform float tileExtent;
varying vec2 vPosition;

#include <highlight_frag>

void main()
{
    //当position的x, y超出tileExtent时，丢弃该片元
    // float clip = sign(tileExtent - min(tileExtent, abs(vPosition.x))) * sign(1.0 + sign(vPosition.x)) *
    //     sign(tileExtent - min(tileExtent, abs(vPosition.y))) * sign(1.0 + sign(vPosition.y));
    // if (clip == 0.0) {
    //     discard;
    // }
    // -------------- 光照 ----------------------
    //环境光
    vec3 ambient = vColor * light.ambient * material.ambient;
    //------

    //漫反射光
    vec3 norm = normalize(vNormal);
    // vec3 lightDir = normalize(light.position - vFragPos); //计算光入射方向
    vec3 lightDir = normalize(-light.direction);

    float diff = max(dot(norm, lightDir), 0.0); //散射系数，计算光的入射方向和法线夹角，夹角越大则系数越小，去掉小于0的值（没有意义）
    vec3 diffuse = vColor * light.diffuse * (diff * material.diffuse);
    //------

    //镜面反射
    // float specularStrength = 1.0; //镜面强度(Specular Intensity)变量
    vec3 viewDir = normalize(camPos - vFragPos); //观察方向
    vec3 reflectDir = reflect(-lightDir, norm);  //反射光方向

    //blinn
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(norm, halfwayDir), 0.0), material.shininess);

    vec3 specular = vColor * light.specular * (spec * material.specular);
    //------

    vec3 result = ambient + diffuse + specular;
    gl_FragColor = vec4(result, material.opacity);
    // gl_FragColor = vec4(1.0, 0.0, 0.0, material.opacity);

    #ifdef USE_EXTRUSION_OPACITY
        float topAlpha = extrusionOpacityRange.x;
        float bottomAlpha = extrusionOpacityRange.y;
        float alpha = topAlpha + vExtrusionOpacity * (bottomAlpha - topAlpha);
        alpha = clamp(alpha, 0.0, 1.0);
        gl_FragColor *= alpha;
    #endif

    gl_FragColor = highlight_blendColor(gl_FragColor);
}
