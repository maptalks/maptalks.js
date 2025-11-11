#extension GL_OES_standard_derivatives : enable
#extension GL_EXT_shader_texture_lod : enable

precision highp float;
#define PI 3.141592653589793

#define LIGHT_TYPE_DIRECTIONAL 0
#define LIGHT_TYPE_POINT 1

#define CUBEMAP_EDGE_FIXUP 1

#define TEXTURED_MATERIAL 0
#define USE_IES_PROFILE 1
#define ENV_MAP_RGBM 1
#define TRANSPARENT_MATERIAL 0
#define TRANSLUCENT_MATERIAL 0
#define ANISOTROPY 1

// three.js
uniform vec3 cameraPosition;
// world space

// direct lighting
uniform vec3 lightColor;
uniform vec3 lightPosition;
uniform vec3 lightDirection;
uniform float lightIntensity;
// luminous intensity (cd) for point lights
// point light:
// x = inv falloff^2, y = spot angle scale, z = spot angle offset, w = is spot
uniform vec4 lightGeometry;
uniform int lightType;
#if USE_IES_PROFILE == 1
    uniform sampler2D lightProfileMap;
#endif

// material
#if TEXTURED_MATERIAL == 1
    uniform sampler2D baseColorMap;
    uniform sampler2D metallicMap;
    uniform sampler2D roughnessMap;
    uniform sampler2D normalMap;
    uniform sampler2D aoMap;
    uniform int applyNormalMap;
#else
    uniform vec4 baseColor;
    uniform float metallic;
    uniform float roughness;
#endif
uniform float reflectance;
uniform vec4 emissive;
uniform float clearCoat;
uniform float clearCoatRoughness;
uniform vec3 clearCoatColor;
uniform float clearCoatThickness;
uniform float clearCoatIOR;
uniform float anisotropy;
// indirect lighting
uniform samplerCube environmentMap;
uniform vec3 sphericalHarmonics[9];
uniform float environmentLuminance;
// camera
uniform float exposure;
uniform float ev;
#if TRANSLUCENT_MATERIAL == 1
    uniform sampler2D translucencyThicknessMap;
    uniform vec3 translucencyAmbient;
    uniform float translucencyDistortion;
    uniform float translucencyScale;
    uniform float translucencyPower;
#endif

// from vertex shader
varying vec3 outWorldPosition;
varying vec3 outWorldNormal;
#if ANISOTROPY == 1
    varying vec3 outWorldTangent;
#endif
#if TEXTURED_MATERIAL == 1
    varying vec2 outUV;
#endif

struct PixelParams {
    vec3 diffuseColor;
    vec3 f0;
    float roughness;
    float clearCoatRoughness;
    float ao;
    float eta;
    float refracted_NoV;
};
float D_GGX(float NoH, float a) {
    float a2 = a * a;
    float f = (NoH * a2 - NoH) * NoH + 1.0;
    return a2 / (PI * f * f);
}
float D_GGX_Anisotropy(float NoH, vec3 h, vec3 x, vec3 y, float ax, float ay) {
    float XoH = dot(x, h);
    float YoH = dot(y, h);
    float d = XoH * XoH * (ax * ax) + YoH * YoH * (ay * ay) + NoH * NoH;
    return (ax * ay) / (PI * d * d);
}
vec3 F_Schlick(float VoH, vec3 f0, float f90) {
    return f0 + (vec3(f90) - f0) * pow(1.0 - VoH, 5.0);
}
// Smith-GGX correlated for microfacets height
float V_SmithGGXCorrelated(float NoV, float NoL, float a) {
    float a2 = a * a;
    float GGXL = NoV * sqrt((-NoL * a2 + NoL) * NoL + a2);
    float GGXV = NoL * sqrt((-NoV * a2 + NoV) * NoV + a2);
    // approximation
    // float GGXL = NoV * (NoL * (1.0 - a) + a);
    // float GGXV = NoL * (NoV * (1.0 - a) + a);
    return 0.5 / (GGXV + GGXL);
}
float Fd_Lambert() {
    return 1.0 / PI;
}
float F_Schlick_Scalar(float VoH, float f0, float f90) {
    return f0 + (f90 - f0) * pow(1.0 - VoH, 5.0);
}
float square(float v) {
    return v * v;
}
vec3 irradianceSH(vec3 n) {
    return
    sphericalHarmonics[0]
    + sphericalHarmonics[1] * (n.y)
    + sphericalHarmonics[2] * (n.z)
    + sphericalHarmonics[3] * (n.x)
    + sphericalHarmonics[4] * (n.y * n.x)
    + sphericalHarmonics[5] * (n.y * n.z)
    + sphericalHarmonics[6] * (3.0 * n.z * n.z - 1.0)
    + sphericalHarmonics[7] * (n.z * n.x)
    + sphericalHarmonics[8] * (n.x * n.x - n.y * n.y);
}
vec2 prefilteredDFGKaris(float NoV, float roughness) {
    // see https://www.unrealengine.com/blog/physically-based-shading-on-mobile
    const vec4 c0 = vec4(-1.0, -0.0275, -0.572, 0.022);
    const vec4 c1 = vec4( 1.0, 0.0425, 1.040, -0.040);
    vec4 r = roughness * c0 + c1;
    float a004 = min(r.x * r.x, exp2(-9.28 * NoV)) * r.x + r.y;
    return vec2(-1.04, 1.04) * a004 + r.zw;
}
#if TEXTURED_MATERIAL == 1
    vec3 perturbNormal(vec3 n) {
        vec3 t = normalize(outWorldTangent - dot(outWorldTangent, n) * n);
        vec3 b = cross(t, n);
        vec3 normalSample = texture2D(normalMap, outUV).xyz * 2.0 - 1.0;
        return normalize(normalSample.x * t + (normalSample.y * b + (normalSample.z * n)));
    }
#endif

float sRGBtoLinear(float c) {
    return (c <= 0.04045) ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4);
}
vec3 sRGBtoLinear(vec3 c) {
    return vec3(sRGBtoLinear(c.r), sRGBtoLinear(c.g), sRGBtoLinear(c.b));
}
#if ENV_MAP_RGBM == 1
    vec3 decodeEnvironmentMap(vec4 c) {
        c.rgb *= (c.a * 16.0);
        // RGBM decode
        return c.rgb * c.rgb;
    }
#else
    vec3 decodeEnvironmentMap(vec4 c) {
        return sRGBtoLinear(c.rgb);
    }
#endif

#if TEXTURED_MATERIAL == 1
    float getMaterialAmbientOcclusion() {
        return texture2D(aoMap, outUV).r;
    }
#else
    float getMaterialAmbientOcclusion() {
        return 1.0;
    }
#endif

float getSquareFalloffAttenuation(float distanceSquare) {
    float factor = distanceSquare * lightGeometry.x;
    float smoothFactor = max(1.0 - factor * factor, 0.0);
    // we would normally divide by the square distance here
    // but we do it at the call site
    return smoothFactor * smoothFactor;
}
#if USE_IES_PROFILE == 1
    float getPhotometricAttenuation(vec3 lightToPos, vec3 lightDir) {
        float cosTheta = dot(lightToPos, lightDir);
        float angle = acos(cosTheta) * (1.0 / PI);
        return texture2DLodEXT(lightProfileMap, vec2(angle, 0.0), 0.0).r;
    }
#else
    float getPhotometricAttenuation(vec3 lightToPos, vec3 lightDir) {
        return 1.0;
    }
#endif

float getAngleAttenuation(vec3 l, vec3 lightDir) {
    float cd = dot(lightDir, l);
    float attenuation = clamp(cd * lightGeometry.y + lightGeometry.z, 0.0, 1.0);
    return attenuation * attenuation;
}
vec3 beerLambert(float NoV, float NoL, vec3 alpha, float d) {
    return exp(alpha * -(d * ((NoL + NoV) / max(NoL * NoV, 1e-3))));
}
vec3 evaluateLight(vec3 n, vec3 v, in PixelParams params) {
    vec3 l;
    float NoL;
    float energy;
    float attenuation;
    vec3 lightDir = normalize(lightDirection);
    float linearRoughness = params.roughness * params.roughness;
    vec3 r = reflect(-v, n);
    if (lightType == LIGHT_TYPE_DIRECTIONAL) {
        l = -lightDir;
        // Disc area light
        vec3 sunDir = -lightDir;
        float e = sin(radians(0.53));
        float d = cos(radians(0.53));
        float DoR = dot(sunDir, r);
        vec3 s = r - DoR * sunDir;
        l = DoR < d ? normalize(d * sunDir + normalize(s) * e) : r;
        NoL = dot(n, l);
        energy = 1.0;
        attenuation = 1.0;
    }
    else if (lightType == LIGHT_TYPE_POINT) {
        vec3 posToLight = lightPosition - outWorldPosition;
        float distanceSquare = dot(posToLight, posToLight);
        l = normalize(posToLight);
        NoL = dot(n, l);
        energy = 1.0;
        attenuation = getSquareFalloffAttenuation(distanceSquare);
        attenuation *= 1.0 / max(distanceSquare, 1e-4);
        attenuation *= getPhotometricAttenuation(-l, lightDir);
        if (lightGeometry.w >= 1.0) {
            attenuation *= getAngleAttenuation(l, -lightDir);
        }

    }
    vec3 h = normalize(v + l);
    NoL = clamp(NoL, 0.0, 1.0);
    float NoV = abs(dot(n, v)) + 1e-5;
    float NoH = clamp(dot(n, h), 0.0, 1.0);
    float LoH = clamp(dot(l, h), 0.0, 1.0);
    // specular BRDF
    #if ANISOTROPY == 1
        vec3 t = normalize(outWorldTangent);
        vec3 b = normalize(cross(t, n));
        float aspect = inversesqrt(1.0 - anisotropy * 0.9);
        float ax = 1.0 / (linearRoughness * aspect);
        float ay = aspect / linearRoughness;
        float D = D_GGX_Anisotropy(NoH, h, t, b, ax, ay);
    #else
        float D = D_GGX(NoH, linearRoughness);
    #endif
    vec3  F = F_Schlick(LoH, params.f0, clamp(dot(params.f0, vec3(50.0 * 0.33)), 0.0, 1.0));
    float V = V_SmithGGXCorrelated(NoV, NoL, linearRoughness);
    vec3 Fr = (D * V) * F;
    // diffuse BRDF
    vec3 Fd = params.diffuseColor * Fd_Lambert();
    // clear coat
    float linearClearCoatRoughness = params.clearCoatRoughness * params.clearCoatRoughness;
    float Dcc = D_GGX(NoH, linearClearCoatRoughness);
    float Fcc = F_Schlick_Scalar(LoH, 0.04, 1.0) * clearCoat;
    float Vcc = V_SmithGGXCorrelated(NoV, NoL, linearClearCoatRoughness);
    float FrCC = Dcc * Vcc * Fcc;
    vec3 refracted_l = -refract(l, n, params.eta);
    float refracted_NoL = clamp(dot(n, refracted_l), 0.0, 1.0);
    vec3 clearCoatAbsorption = mix(vec3(1.0), beerLambert(params.refracted_NoV, refracted_NoL, clearCoatColor, clearCoatThickness), clearCoat);
    // direct contribution
    vec3 color = (attenuation * NoL) * lightColor * lightIntensity * energy *
    ((Fd + Fr) * (1.0 - Fcc) * clearCoatAbsorption + FrCC);
    #if TRANSLUCENT_MATERIAL == 1
        vec3 tL = l + n * translucencyDistortion;
        float tD = exp2(clamp(dot(v, -tL), 0.0, 1.0) * translucencyPower - translucencyPower) * translucencyScale;
        vec3 tT = attenuation * lightIntensity * (tD + translucencyAmbient) * texture2D(translucencyThicknessMap, outUV).r;
        color.rgb += Fd * lightColor * tT;
    #endif

    // micro-shadowing
    float aperture = 2.0 * params.ao * params.ao;
    float microShadow = clamp(abs(dot(l, n)) + aperture - 1.0, 0.0, 1.0);
    color.rgb *= microShadow;
    return color;
}
#if CUBEMAP_EDGE_FIXUP == 1
    vec3 fixCubemapLookup(vec3 v, float lod) {
        vec3 r = abs(v);
        float M = max(max(v.x, v.y), v.z);
        float scale = 1.0 - exp2(lod) * (1.0 / 256.0);
        if (v.x ! = M) v.x *= scale;
        if (v.y ! = M) v.y *= scale;
        if (v.z ! = M) v.z *= scale;
        return v;
    }
#endif

vec3 evaluateSpecularIBL(vec3 r, float roughness) {
    float lod = 5.0 * roughness;
    #if CUBEMAP_EDGE_FIXUP == 1
        r = fixCubemapLookup(r, lod);
    #endif
    return decodeEnvironmentMap(textureCubeLodEXT(environmentMap, r, lod));
}
float computeSpecularAO(float NoV, float ao, float roughness) {
    return clamp(pow(NoV + ao, exp2(-16.0 * roughness - 1.0)) - 1.0 + ao, 0.0, 1.0);
}
vec3 getSpecularDominantDirection(vec3 n, vec3 r, float roughness) {
    float s = 1.0 - roughness;
    return mix(n, r, s * (sqrt(s) + roughness));
}
vec3 evaluateIBL(vec3 n, vec3 v, in PixelParams params) {
    float NoV = max(dot(n, v), 0.0);
    #if ANISOTROPY == 1
        vec3 t = normalize(outWorldTangent);
        vec3 b = normalize(cross(t, n));
        vec3 anisotropicTangent = cross(-v, b);
        vec3 anisotropicNormal = cross(anisotropicTangent, b);
        vec3 bentNormal = normalize(mix(n, anisotropicNormal, anisotropy));
        vec3 r = reflect(-v, bentNormal);
    #else
        vec3 r = reflect(-v, n);
        r = getSpecularDominantDirection(n, r, params.roughness * params.roughness);
    #endif

    float NoR = max(dot(r, n), 0.0);
    // specular indirect
    vec3 indirectSpecular = evaluateSpecularIBL(r, params.roughness);
    // horizon occlusion, can be removed for performance
    float horizon = min(1.0 + NoR, 1.0);
    indirectSpecular *= horizon * horizon;
    vec2 env = prefilteredDFGKaris(NoV, params.roughness);
    // we should multiply env.y by f90 for more accurate results
    vec3 specularColor = params.f0 * env.x + env.y * (1.0 - clearCoat) *
    clamp(dot(params.f0, vec3(50.0 * 0.33)), 0.0, 1.0);
    // diffuse indirect
    vec3 indirectDiffuse = max(irradianceSH(n), 0.0) * Fd_Lambert();
    // ambient occlusion
    float aoFade = clamp(dot(normalize(outWorldNormal), v), 0.0, 1.0);
    float ao = mix(1.0, params.ao, aoFade);
    indirectDiffuse *= ao;
    // TODO: Not really useful without SSAO/HBAO/etc.
    indirectSpecular *= computeSpecularAO(NoV, ao, params.roughness);
    // clear coat
    float Fcc = F_Schlick_Scalar(NoV, 0.04, 1.0) * clearCoat;
    #if ANISOTROPY == 1
        // We used the bent normal for the base layer
        r = reflect(-v, n);
    #endif
    vec3 indirectClearCoatSpecular = evaluateSpecularIBL(r, params.clearCoatRoughness);
    vec3 clearCoatAbsorption = mix(vec3(1.0), beerLambert(params.refracted_NoV, params.refracted_NoV, clearCoatColor, clearCoatThickness), clearCoat);
    // indirect contribution
    vec3 color = (params.diffuseColor * indirectDiffuse + indirectSpecular * specularColor)
    * (1.0 - Fcc) * clearCoatAbsorption +
    indirectClearCoatSpecular * Fcc;
    #if TRANSLUCENT_MATERIAL == 1
        indirectDiffuse = max(irradianceSH(-v), 0.0) * Fd_Lambert();
        vec3 tL = -v + n * translucencyDistortion;
        float tD = pow(clamp(dot(v, -tL), 0.0, 1.0), translucencyPower) * translucencyScale;
        vec3 tT = (tD + translucencyAmbient) * texture2D(translucencyThicknessMap, outUV).r;
        color.rgb += params.diffuseColor * indirectDiffuse * tT;
    #endif

    return color;
}
#if TEXTURED_MATERIAL == 1
    vec3 getNormal() {
        #if TRANSPARENT_MATERIAL == 1
            vec3 n = gl_FrontFacing ? outWorldNormal : -outWorldNormal;
        #else
            vec3 n = outWorldNormal;
        #endif
        if (applyNormalMap == 1) {
            return perturbNormal(normalize(n));
        }
        return normalize(n);
    }
#else
    vec3 getNormal() {
        #if TRANSPARENT_MATERIAL == 1
            vec3 n = gl_FrontFacing ? outWorldNormal : -outWorldNormal;
        #else
            vec3 n = outWorldNormal;
        #endif
        return normalize(n);
    }
#endif

vec4 surfaceShading(vec4 baseColor, float metallic, float roughness, float reflectance) {
    vec3 diffuseColor = (1.0 - metallic) * baseColor.rgb;
    // Geometric AA
    vec3 wn = normalize(outWorldNormal);
    vec3 ndFdx = dFdx(wn);
    vec3 ndFdy = dFdy(wn);
    float geometricRoughness = pow(max(dot(ndFdx, ndFdx), dot(ndFdy, ndFdy)), 0.333);
    roughness = max(roughness, geometricRoughness);
    // Fresnel specular reflectance at normal incidence
    vec3 f0 = 0.16 * reflectance * reflectance * (1.0 - metallic) +
    baseColor.rgb * metallic;
    float alpha = 1.0;
    #if TRANSPARENT_MATERIAL == 1
        float reflectivity = max(max(f0.r, f0.g), f0.b);
        alpha = reflectivity + baseColor.a * (1.0 - reflectivity);
        diffuseColor *= baseColor.a;
    #endif

    vec3 v = normalize(cameraPosition - outWorldPosition);
    vec3 n = getNormal();
    PixelParams params;
    params.diffuseColor = diffuseColor;
    params.f0 = f0;
    params.roughness = roughness;
    params.clearCoatRoughness = max(mix(0.089, 0.6, clearCoatRoughness), geometricRoughness);
    params.ao = getMaterialAmbientOcclusion();
    params.eta = 1.0 / clearCoatIOR;
    vec3 refracted_v = -refract(v, n, params.eta);
    params.refracted_NoV = clamp(dot(n, refracted_v), 0.0, 1.0);
    // indirect lighting
    vec3 color = evaluateIBL(n, v, params);
    color *= environmentLuminance;
    // direct lighting
    color += evaluateLight(n, v, params);
    return vec4(color, alpha);
}
void main() {
    float surfaceReflectance = reflectance;
    #if TEXTURED_MATERIAL == 1
        vec4 baseColor = texture2D(baseColorMap, outUV);
        baseColor.rgb = sRGBtoLinear(baseColor.rgb);
        float metallic = texture2D(metallicMap, outUV).r;
        float roughness = texture2D(roughnessMap, outUV).r;
    #endif
    float safeRoughness = clamp(roughness, 0.05, 1.0);
    vec4 color = surfaceShading(baseColor, metallic, safeRoughness, surfaceReflectance);
    // current ev + emissive exposure compensation, converted to luminance
    if (emissive.w ! = 0.0) {
        color.rgb += baseColor.rgb * emissive.rgb * pow(2.0, emissive.w + ev - 3.0);
    }
    color.rgb *= exposure;
    gl_FragColor = color;
}
