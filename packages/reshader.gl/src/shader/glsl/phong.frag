
precision mediump float;
varying vec2 TexCoords;
uniform float materialShininess;//反光度，即影响镜面高光的散射/半径
uniform float opacity;
uniform float ambientStrength;
uniform float specularStrength;


uniform vec3 lightPosition;
uniform vec4 lightAmbient;
uniform vec4 lightDiffuse;
uniform vec4 lightSpecular;

varying vec3 vNormal;
varying vec4 vFragPos;
uniform vec3 viewPos;

#ifdef USE_BASECOLORTEXTURE
uniform sampler2D sample;
#endif
void main() {
    //环境光
    // float ambientStrength = 0.5;
    #ifdef USE_BASECOLORTEXTURE
    vec3 ambient = ambientStrength * lightAmbient.xyz * texture2D(sample, TexCoords).rgb;
    #else
    vec3 ambient = ambientStrength * lightAmbient.xyz;
    #endif


    //漫反射光
    vec3 norm = normalize(vNormal);
    vec3 lightDir = vec3(normalize(lightPosition -vec3(vFragPos)));
    float diff = max(dot(norm, lightDir), 0.0);
    #ifdef USE_BASECOLORTEXTURE
    vec3 diffuse = lightDiffuse.xyz * diff *texture2D(sample, TexCoords).rgb;
    #else
    vec3 diffuse = lightDiffuse.xyz * diff;
    #endif

    //镜面反色光
    vec3 viewDir = vec3(normalize(viewPos -vec3(vFragPos)));
    // vec3 reflectDir = reflect(-lightDir, norm);
    vec3 halfwayDir = normalize(lightDir+viewDir);
    float spec = pow(max(dot(norm, halfwayDir), 0.0), materialShininess);
    vec3 specular = specularStrength * lightSpecular.xyz * spec;


    vec3 result = ambient +diffuse +specular;
    gl_FragColor = vec4(result, 1.0) * opacity;
}
