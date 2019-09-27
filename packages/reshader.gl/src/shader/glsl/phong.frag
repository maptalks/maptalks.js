precision mediump float;
varying vec2 vTexCoords;
uniform float materialShininess;//反光度，即影响镜面高光的散射/半径
uniform float opacity;
uniform float ambientStrength;
uniform float specularStrength;


uniform vec3 lightPosition;
uniform vec4 lightAmbient;
uniform vec4 lightDiffuse;
uniform vec4 lightSpecular;

#ifdef USE_NORMAL
    varying vec3 vNormal;
    varying vec4 vFragPos;
    uniform vec3 viewPos;
#endif

#ifdef USE_INSTANCE
    varying vec4 vInstanceColor;
#endif

#ifdef USE_BASECOLORTEXTURE
    uniform sampler2D baseColorTexture;
#endif
uniform vec4 baseColorFactor;

void main() {
    //环境光
    #ifdef USE_BASECOLORTEXTURE
        #ifdef USE_INSTANCE
            vec3 ambientColor = ambientStrength * vInstanceColor.xyz * texture2D(baseColorTexture, vTexCoords).rgb;
        #else
            vec3 ambientColor = ambientStrength * lightAmbient.xyz * texture2D(baseColorTexture, vTexCoords).rgb;
        #endif
    #else
        #ifdef USE_INSTANCE
            vec3 ambientColor = ambientStrength * vInstanceColor.xyz ;
        #else
            vec3 ambientColor = ambientStrength * lightAmbient.xyz;
        #endif
    #endif
    vec3 ambient = ambientColor * baseColorFactor.xyz;
    
    #ifdef USE_NORMAL
        //漫反射光
        vec3 norm = normalize(vNormal);
        vec3 lightDir = vec3(normalize(lightPosition -vec3(vFragPos)));
        float diff = max(dot(norm, lightDir), 0.0);
        #ifdef USE_BASECOLORTEXTURE
            vec3 diffuse = lightDiffuse.xyz * diff * texture2D(baseColorTexture, vTexCoords).rgb;
        #else
            vec3 diffuse = lightDiffuse.xyz * diff;
        #endif

        //镜面反色光
        vec3 viewDir = vec3(normalize(viewPos -vec3(vFragPos)));
        // vec3 reflectDir = reflect(-lightDir, norm);
        vec3 halfwayDir = normalize(lightDir + viewDir);
        float spec = pow(max(dot(norm, halfwayDir), 0.0), materialShininess);
        vec3 specular = specularStrength * lightSpecular.xyz * spec;
        vec3 result = ambient + diffuse + specular;
    #else
        vec3 result = ambient;
    #endif
    gl_FragColor = vec4(result, 1.0) * opacity;
}