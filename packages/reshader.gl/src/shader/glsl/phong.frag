
precision mediump float;
uniform vec3 materialAmbient;//环境光照
uniform vec3 materialDiffuse;//漫反射光照
uniform vec3 materialSpecular;//镜面光照
uniform float materialShininess;//反光度，即影响镜面高光的散射/半径
uniform float opacity;

uniform vec3 lightPosition;
uniform vec3 lightAmbient;
uniform vec3 lightDiffuse;
uniform vec3 lightSpecular;

varying vec3 vNormal;
varying vec4 vFragPos;
uniform vec3 viewPos;

void main() {
    //环境光
    vec3 ambient = lightAmbient * materialAmbient;

    //漫反射光
    vec3 norm = normalize(vNormal);
    vec3 lightDir = vec3(normalize(lightPosition -vec3(vFragPos)));
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = lightDiffuse * (diff * materialDiffuse);

    //镜面反色光
    vec3 viewDir = vec3(normalize(viewPos -vec3(vFragPos)));
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), materialShininess);
    vec3 specular = lightSpecular * (spec * materialSpecular);

    vec3 result = ambient +diffuse +specular;
    gl_FragColor = vec4(result, 1.0) * opacity;
}
