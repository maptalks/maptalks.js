precision mediump float;

uniform vec4 baseColorFactor;
uniform float materialShiness;//反光度，即影响镜面高光的散射/半径
uniform float opacity;
uniform float ambientStrength;
uniform float specularStrength;

uniform vec3 lightDirection;
uniform vec3 lightAmbient;
uniform vec3 lightDiffuse;
uniform vec3 lightSpecular;
uniform vec3 cameraPosition;

varying vec2 vTexCoords;
varying vec3 vNormal;
varying vec3 vFragPos;

#ifdef HAS_INSTANCE_COLOR
    varying vec4 vInstanceColor;
#endif

#ifdef HAS_BASECOLORTEXTURE
    uniform sampler2D baseColorTexture;
#endif

#ifdef HAS_EXTRUSION_OPACITY
    uniform vec2 extrusionOpacityRange;
    varying float vExtrusionOpacity;
#endif

#ifdef HAS_COLOR
    varying vec4 vColor;
#endif

vec4 linearTosRGB(const in vec4 color) {
    return vec4( color.r < 0.0031308 ? color.r * 12.92 : 1.055 * pow(color.r, 1.0/2.4) - 0.055, color.g < 0.0031308 ? color.g * 12.92 : 1.055 * pow(color.g, 1.0/2.4) - 0.055, color.b < 0.0031308 ? color.b * 12.92 : 1.055 * pow(color.b, 1.0/2.4) - 0.055, color.a);
}

void main() {
    //环境光
    #ifdef HAS_BASECOLORTEXTURE
        vec3 ambientColor = ambientStrength * lightAmbient * texture2D(baseColorTexture, vTexCoords).rgb;
    #else
        vec3 ambientColor = ambientStrength * lightAmbient;
    #endif
    #ifdef HAS_INSTANCE_COLOR
        ambientColor *= vInstanceColor.rgb;
    #endif
    vec3 ambient = ambientColor * baseColorFactor.rgb;
    //漫反射光
    vec3 norm = normalize(vNormal);
    vec3 lightDir = normalize(-lightDirection);
    float diff = max(dot(norm, lightDir), 0.0);
    #ifdef HAS_BASECOLORTEXTURE
        vec3 diffuse = lightDiffuse * diff * texture2D(baseColorTexture, vTexCoords).rgb;
    #else
        vec3 diffuse = lightDiffuse * diff * baseColorFactor.rgb;
    #endif
    #ifdef HAS_COLOR
        ambient *= vColor.rgb;
        diffuse *= vColor.rgb;
    #endif
    //镜面反色光
    vec3 viewDir = normalize(cameraPosition - vFragPos);
    // vec3 reflectDir = reflect(-lightDir, norm);
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(norm, halfwayDir), 0.0), materialShiness);
    vec3 specular = specularStrength * lightSpecular * spec;
    vec3 result = ambient + diffuse + specular;

    gl_FragColor = vec4(result, opacity);
    // gl_FragColor = linearTosRGB(gl_FragColor);
    #ifdef HAS_COLOR
        gl_FragColor *= vColor.a;
    #endif
    #ifdef HAS_EXTRUSION_OPACITY
        float topAlpha = extrusionOpacityRange.x;
        float bottomAlpha = extrusionOpacityRange.y;
        float alpha = topAlpha + vExtrusionOpacity * (bottomAlpha - topAlpha);
        alpha = clamp(alpha, 0.0, 1.0);
        gl_FragColor *= alpha;
    #endif
    // gl_FragColor.a = 0.7;
}
