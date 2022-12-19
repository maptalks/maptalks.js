precision mediump float;
#include <gl2_frag>

uniform vec4 baseColorFactor;
uniform float materialShininess;//反光度，即影响镜面高光的散射/半径
uniform float opacity;
uniform float environmentExposure;
uniform float specularStrength;

uniform vec3 light0_viewDirection;
uniform vec3 ambientColor;
uniform vec4 light0_diffuse;
uniform vec3 lightSpecular;
uniform vec3 cameraPosition;

#ifdef HAS_TANGENT
    varying vec4 vTangent;
#endif

#ifdef HAS_MAP
    varying vec2 vTexCoord;
#endif
varying vec3 vNormal;
varying vec3 vFragPos;

#ifdef HAS_INSTANCE_COLOR
    varying vec4 vInstanceColor;
#endif

#ifdef HAS_BASECOLOR_MAP
    uniform sampler2D baseColorTexture;
#endif

#ifdef HAS_EXTRUSION_OPACITY
    uniform vec2 extrusionOpacityRange;
    varying float vExtrusionOpacity;
#endif

#if defined(HAS_COLOR) || defined(HAS_COLOR0)
    varying vec4 vColor;
#elif defined(IS_LINE_EXTRUSION)
    uniform vec4 lineColor;
#else
    uniform vec4 polygonFill;
#endif

#ifdef IS_LINE_EXTRUSION
    uniform float lineOpacity;
#else
    uniform float polygonOpacity;
#endif

#ifdef HAS_OCCLUSION_MAP
    uniform sampler2D occlusionTexture;
#endif

#ifdef HAS_NORMAL_MAP
    uniform sampler2D normalTexture;
#endif

#ifdef HAS_EMISSIVE_MAP
    uniform sampler2D emissiveTexture;
#endif

#ifdef SHADING_MODEL_SPECULAR_GLOSSINESS
    uniform vec4 diffuseFactor;
    uniform vec3 specularFactor;
    #ifdef HAS_DIFFUSE_MAP
        uniform sampler2D diffuseTexture;
    #endif
    #ifdef HAS_SPECULARGLOSSINESS_MAP
        uniform sampler2D specularGlossinessTexture;
    #endif
#endif
#include <heatmap_render_frag>

#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
  #include <vsm_shadow_frag>
#endif
varying vec4 cut_positionFromViewpoint;

vec3 transformNormal() {
    #if defined(HAS_NORMAL_MAP)
        vec3 n = normalize(vNormal);
        vec3 normal = texture2D(normalTexture, vTexCoord).xyz * 2.0 - 1.0;
        #if defined(HAS_TANGENT)
            vec3 t = normalize(vTangent.xyz);
            vec3 b = normalize(cross(n, t) * sign(vTangent.w));
            mat3 tbn = mat3(t, b, n);
            return normalize(tbn * normal);
        #else
            return normalize(normal);
        #endif
    #else
        return normalize(vNormal);
    #endif
}

vec4 linearTosRGB(const in vec4 color) {
    return vec4( color.r < 0.0031308 ? color.r * 12.92 : 1.055 * pow(color.r, 1.0/2.4) - 0.055, color.g < 0.0031308 ? color.g * 12.92 : 1.055 * pow(color.g, 1.0/2.4) - 0.055, color.b < 0.0031308 ? color.b * 12.92 : 1.055 * pow(color.b, 1.0/2.4) - 0.055, color.a);
}

vec4 getBaseColor() {
    #if defined(HAS_BASECOLOR_MAP)
        return texture2D(baseColorTexture, vTexCoord);
    #elif defined(HAS_DIFFUSE_MAP)
        return texture2D(diffuseTexture, vTexCoord);
    #elif defined(SHADING_MODEL_SPECULAR_GLOSSINESS)
        return diffuseFactor;
    #else
        return baseColorFactor;
    #endif
}

vec3 getSpecularColor() {
    #if defined(HAS_SPECULARGLOSSINESS_MAP)
        return texture2D(specularGlossinessTexture, vTexCoord).rgb;
    #elif defined(SHADING_MODEL_SPECULAR_GLOSSINESS)
        return specularFactor;
    #else
        return vec3(1.0);
    #endif
}

void main() {
    //环境光
    vec4 baseColor = getBaseColor();
    vec3 ambient = environmentExposure * ambientColor * baseColor.rgb;

    #ifdef HAS_INSTANCE_COLOR
        ambient *= vInstanceColor.rgb;
    #endif

    //漫反射光
    vec3 norm = transformNormal();
    vec3 lightDir = normalize(-light0_viewDirection);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = light0_diffuse.rgb * diff * baseColor.rgb;
    #if defined(HAS_COLOR) || defined(HAS_COLOR0)
        vec3 color = vColor.rgb;
    #elif defined(IS_LINE_EXTRUSION)
        vec3 color = lineColor.rgb;
    #else
        vec3 color = polygonFill.rgb;
    #endif
    #ifdef HAS_INSTANCE_COLOR
        color *= vInstanceColor.rgb;
    #endif
    ambient *= color.rgb;
    diffuse *= color.rgb;

    //镜面反色光
    vec3 viewDir = normalize(cameraPosition - vFragPos);
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(norm, halfwayDir), 0.0), materialShininess);
    vec3 specular = specularStrength * lightSpecular * spec * getSpecularColor();
    #ifdef HAS_OCCLUSION_MAP
        float ao = texture2D(occlusionTexture, vTexCoord).r;
        ambient *= ao;
    #endif
    #if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
        float shadowCoeff = shadow_computeShadow();
        diffuse = shadow_blend(diffuse, shadowCoeff).rgb;
        specular = shadow_blend(specular, shadowCoeff).rgb;
    #endif
    vec3 result = ambient + diffuse + specular;

    #ifdef HAS_EMISSIVE_MAP
        vec3 emit = texture2D(emissiveTexture, vTexCoord).rgb;
        result += emit;
    #endif
    vec3 shadowCoord = (cut_positionFromViewpoint.xyz / cut_positionFromViewpoint.w)/2.0 + 0.5;
    if (shadowCoord.x > 0.0 && shadowCoord.x < 1.0 && shadowCoord.y > 0.0 && shadowCoord.y < 1.0 && shadowCoord.z < 1.0) {
        discard;
    }
    glFragColor = vec4(result, opacity);
    // glFragColor = linearTosRGB(glFragColor);
    #if defined(HAS_COLOR) || defined(HAS_COLOR0)
        float colorAlpha = vColor.a;
    #elif defined(IS_LINE_EXTRUSION)
        float colorAlpha = lineColor.a;
    #else
        float colorAlpha = polygonFill.a;
    #endif
        glFragColor *= colorAlpha;
    #ifdef HAS_EXTRUSION_OPACITY
        float topAlpha = extrusionOpacityRange.x;
        float bottomAlpha = extrusionOpacityRange.y;
        float alpha = topAlpha + vExtrusionOpacity * (bottomAlpha - topAlpha);
        alpha = clamp(alpha, 0.0, 1.0);
        glFragColor *= alpha;
    #endif

    #if __VERSION__ == 100
        gl_FragColor = glFragColor;
    #endif
}
