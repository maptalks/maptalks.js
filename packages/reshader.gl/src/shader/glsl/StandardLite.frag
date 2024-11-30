#if __VERSION__ == 100
    #if defined(GL_EXT_shader_texture_lod)
        #extension GL_EXT_shader_texture_lod : enable
        #define textureCubeLod(tex, uv, lod) textureCubeLodEXT(tex, uv, lod)
    #else
        #define textureCubeLod(tex, uv, lod) textureCube(tex, uv, lod)
    #endif
    #if defined(GL_OES_standard_derivatives)
         #extension GL_OES_standard_derivatives : enable
    #endif
#else
    #define textureCubeLod(tex, uv, lod) textureLod(tex, uv, lod)
#endif
#define saturate(x)        clamp(x, 0.0, 1.0)
precision mediump float;
#include <gl2_frag>
#include <hsv_frag>
uniform vec3 hsv;

#define GET_BASEMAP(UV) (texture2D(baseColorTexture, (UV)))
uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform vec3 cameraPosition;
#if defined(HAS_IBL_LIGHTING)
    uniform mat4 viewMatrixInverse;
#endif
uniform vec4 baseColorFactor;
uniform vec3 emissiveFactor;
uniform vec3 specularFactor;
uniform float opacity;
uniform float envRotationSin;
uniform float envRotationCos;
uniform float rgbmRange;

#if defined(HAS_MAP)
    #include <computeTexcoord_frag>
#endif
#ifdef HAS_BASECOLOR_MAP
    uniform sampler2D baseColorTexture;
#endif
#ifdef HAS_NORMAL_MAP
    uniform sampler2D normalTexture;
    vec3 perturbNormal2Arb(vec3 eye_pos, vec3 surf_norm) {
        vec3 q0 = dFdx(eye_pos.xyz);
        vec3 q1 = dFdy(eye_pos.xyz);
        vec3 S = normalize(q0 - q1);
        vec3 T = normalize(-q0 + q1);
        vec3 N = normalize(surf_norm);
        vec3 mapN = texture2D(normalTexture, computeTexCoord(vTexCoord)).rgb * 2.0 - 1.0;
        mat3 tsn = mat3(S, T, N);
        return normalize(tsn * mapN);
    }
#endif
#ifdef HAS_EMISSIVE_MAP
    uniform sampler2D emissiveTexture;
#endif
#ifdef SHADING_MODEL_SPECULAR_GLOSSINESS
    uniform vec4 diffuseFactor;
    #ifdef HAS_DIFFUSE_MAP
        uniform sampler2D diffuseTexture;
    #endif
    #ifdef HAS_SPECULARGLOSSINESS_MAP
        uniform sampler2D specularGlossinessTexture;
    #endif
#endif

#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
  #include <vsm_shadow_frag>
#endif

#if defined(HAS_COLOR) || defined(HAS_COLOR0)
    varying vec4 vColor;
#endif

#ifdef GAMMA_INPUT
    vec3 InputToLinear(vec3 c) {
        return c * c;
    }
    float InputToLinear(float c) {
        return c * c;
    }
#else
    vec3 InputToLinear(vec3 c) {
        return c;
    }
    float InputToLinear(float c) {
        return c;
    }
#endif

vec3 GET_SPECULAR() {
  #ifdef SHADING_MODEL_SPECULAR_GLOSSINESS
    #ifdef HAS_SPECULARGLOSSINESS_MAP
      return texture2D(specularGlossinessTexture, computeTexCoord(vTexCoord)).rgb;
    #else
      return specularFactor;
    #endif
  #else
      return specularFactor;
  #endif
}

vec3 GET_EMISSIVE() {
  #ifdef HAS_EMISSIVE_MAP
    return texture2D(emissiveTexture, computeTexCoord(vTexCoord)).rgb;
  #else
    return emissiveFactor;
  #endif
}
#if defined(TONEMAP_OUTPUT)
  #if TONEMAP_OUTPUT > 0
      uniform float exposureBias;
      float luminance_post(vec3 rgb) {
          return dot(rgb, vec3(0.299, 0.587, 0.114));
      }
      float luminance_pre(vec3 rgb) {
          return dot(rgb, vec3(0.212671, 0.715160, 0.072169));
      }
      vec3 xyz2rgb(vec3 xyz) {
          vec3 R = vec3(3.240479, -1.537150, -0.498535);
          vec3 G = vec3(-0.969256, 1.875992, 0.041556);
          vec3 B = vec3(0.055648, -0.204043, 1.057311);
          vec3 rgb;
          rgb.b = dot(xyz, B);
          rgb.g = dot(xyz, G);
          rgb.r = dot(xyz, R);
          return rgb;
      }
      vec3 rgb2xyz(vec3 rgb) {
          vec3 X = vec3(0.412453, 0.35758, 0.180423);
          vec3 Y = vec3(0.212671, 0.71516, 0.0721688);
          vec3 Z = vec3(0.0193338, 0.119194, 0.950227);
          vec3 xyz;
          xyz.x = dot(rgb, X);
          xyz.y = dot(rgb, Y);
          xyz.z = dot(rgb, Z);
          return xyz;
      }
      vec3 xyz2xyY(vec3 xyz) {
          float sum = xyz.x + xyz.y + xyz.z;
          sum = 1.0 / sum;
          vec3 xyY;
          xyY.z = xyz.y;
          xyY.x = xyz.x * sum;
          xyY.y = xyz.y * sum;
          return xyY;
      }
      vec3 xyY2xyz(vec3 xyY) {
          float x = xyY.x;
          float y = xyY.y;
          float Y = xyY.z;
          vec3 xyz;
          xyz.y = Y;
          xyz.x = x * (Y / y);
          xyz.z = (1.0 - x - y) * (Y / y);
          return xyz;
      }
      float toneMapCanon_T(float x) {
          float xpow = pow(x, 1.60525727);
          float tmp = ((1.05542877*4.68037409)*xpow) / (4.68037409*xpow + 1.0);
          return clamp(tmp, 0.0, 1.0);
      }
      const float Shift = 1.0 / 0.18;
      float toneMapCanonFilmic_NoGamma(float x) {
          x *= Shift;
          const float A = 0.2;
          const float B = 0.34;
          const float C = 0.002;
          const float D = 1.68;
          const float E = 0.0005;
          const float F = 0.252;
          const float scale = 1.0/0.833837;
          return (((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F) * scale;
      }
      vec3 toneMapCanonFilmic_WithGamma(vec3 x) {
          x *= Shift;
          const float A = 0.27;
          const float B = 0.29;
          const float C = 0.052;
          const float D = 0.2;
          const float F = 0.18;
          const float scale = 1.0/0.897105;
          return (((x*(A*x+C*B))/(x*(A*x+B)+D*F))) * scale;
      }
      vec3 toneMapCanonOGS_WithGamma_WithColorPerserving(vec3 x) {
          vec3 outColor = x.rgb;
          outColor = min(outColor, vec3(3.0));
          float inLum = luminance_pre(outColor);
          if (inLum > 0.0) {
              float outLum = toneMapCanon_T(inLum);
              outColor = outColor * (outLum / inLum);
              outColor = clamp(outColor, vec3(0.0), vec3(1.0));
          }
          float gamma = 1.0/2.2;
          outColor = pow(outColor, vec3(gamma));
          return outColor;
      }
  #endif
#endif

#if defined(IRR_RGBM) || defined(ENV_RGBM) || defined(ENV_GAMMA) || defined(IRR_GAMMA)
    uniform float envMapExposure;
#endif

uniform vec4 themingColor;
uniform mat3 environmentTransform;

vec3 applyEnvShadow(vec3 colorWithoutShadow, vec3 worldNormal) {
    #if defined(HAS_SHADOWMAP)
        float dp = dot(shadowLightDir, worldNormal);
        float dpValue = (dp + 1.0) / 2.0;
        dpValue = min(1.0, dpValue * 1.5);
        float sv = 1.0;
        vec3 result = colorWithoutShadow * min(sv, dpValue);
        return result;
    #else
        return colorWithoutShadow;
    #endif
}
#ifdef HAS_IBL_LIGHTING
    uniform float reflectivity;
    uniform vec3 hdrHSV;
    uniform samplerCube prefilterMap;
    uniform vec3 diffuseSPH[9];
    uniform vec2 prefilterMiplevel;
    uniform vec2 prefilterSize;
#else
    uniform vec3 ambientColor;
#endif

#if defined(HAS_IBL_LIGHTING)
    vec3 computeDiffuseSPH(const in vec3 normal) {
        vec3 n = environmentTransform * normal;
        float x = n.x;
        float y = n.y;
        float z = n.z;
        vec3 result = (
            diffuseSPH[0] +

            diffuseSPH[1] * x +
            diffuseSPH[2] * y +
            diffuseSPH[3] * z +

            diffuseSPH[4] * z * x +
            diffuseSPH[5] * y * z +
            diffuseSPH[6] * y * x +
            diffuseSPH[7] * (3.0 * z * z - 1.0) +
            diffuseSPH[8] * (x*x - y*y)
        );
        if (length(hdrHSV) > 0.0) {
            result = hsv_apply(result, hdrHSV);
        }
        return max(result, vec3(0.0));
    }

    vec3 decodeRGBM(const in vec4 color, const in float range) {
      if(range <= 0.0) return color.rgb;
      return range * color.rgb * color.a;
    }

    float linRoughnessToMipmap(const in float roughnessLinear) {
        return roughnessLinear;
    }
    vec3 prefilterEnvMapCube(const in float rLinear, const in vec3 R) {
        vec3 dir = R;
        float maxLevels = prefilterMiplevel.x;
        float lod = min(maxLevels, linRoughnessToMipmap(rLinear) * prefilterMiplevel.y);
        vec3 envLight = decodeRGBM(textureCubeLod(prefilterMap, dir, lod), rgbmRange);
        if (length(hdrHSV) > 0.0) {
            return hsv_apply(envLight, hdrHSV);
        } else {
            return envLight;
        }
    }
    vec3 getSpecularDominantDir(const in vec3 N, const in vec3 R, const in float realRoughness) {
        float smoothness = 1.0 - realRoughness;
        float lerpFactor = smoothness * (sqrt(smoothness) + realRoughness);
        return mix(N, R, lerpFactor);
    }
    vec3 getPrefilteredEnvMapColor(const in vec3 normal, const in vec3 eyeVector, const in float roughness, const in vec3 frontNormal) {
        vec3 R = reflect(-eyeVector, normal);
        R = getSpecularDominantDir(normal, R, roughness);
        vec3 prefilteredColor = prefilterEnvMapCube(roughness, environmentTransform * R);
        float factor = clamp(1.0 + dot(R, frontNormal), 0.0, 1.0);
        prefilteredColor *= factor * factor;
        return prefilteredColor;
    }
#else
    vec3 getPrefilteredEnvMapColor(const in vec3 normal, const in vec3 eyeVector, const in float roughness, const in vec3 frontNormal) {
        return ambientColor;
    }
#endif

varying highp vec3 vViewPosition;

vec3 Schlick_v3(vec3 v, float cosHV) {
    float facing = max(1.0 - cosHV, 0.0);
    return v + (1.0 - v) * pow(facing, 5.0);
}
float Schlick_f(float v, float cosHV) {
    float facing = max(1.0 - cosHV, 0.0);
    return v + (1.0 - v) * pow(facing, 5.0);
}

#include <srgb_frag>

void main() {
    glFragColor = vec4(vec3(1.0), opacity);
    #ifdef HAS_BASECOLOR_MAP
        vec4 baseColor = GET_BASEMAP(computeTexCoord(vTexCoord));
        #ifdef GAMMA_INPUT
            baseColor.xyz *= baseColor.xyz;
        #endif
        glFragColor = glFragColor * baseColor;
    #endif

    #ifdef ALPHATEST
        if (glFragColor.a < ALPHATEST) discard;
    #endif
    float specularStrength = 1.0;
    vec3 fdx = dFdx(vViewPosition);
    vec3 fdy = dFdy(vViewPosition);
    vec3 normal = normalize(cross(fdx, fdy));

    vec3 viewDirection;
    if (projMatrix[3][3] == 0.0) {
        viewDirection = normalize(vViewPosition);
    } else {
        viewDirection = vec3(0.0, 0.0, 1.0);
    }
    normal = faceforward(normal, -viewDirection, normal);
    vec3 geomNormal = normal;
    #ifdef HAS_NORMAL_MAP
        normal = perturbNormal2Arb(-vViewPosition, normal);
    #endif

    vec3 totalDiffuse = vec3(0.0);
    vec3 totalSpecular = vec3(0.0);

    #ifdef HAS_IBL_LIGHTING
        vec3 worldNormal = mat3(viewMatrixInverse) * normal;
        vec3 indirectDiffuse = glFragColor.rgb * computeDiffuseSPH(worldNormal) * 0.5;
        indirectDiffuse = applyEnvShadow(indirectDiffuse, worldNormal);
        totalDiffuse += InputToLinear(baseColorFactor.rgb) * indirectDiffuse;
    #endif
    vec3 emissive = GET_EMISSIVE();
    #ifdef METAL
        glFragColor.xyz = glFragColor.xyz * (InputToLinear(emissive) + totalDiffuse + InputToLinear(baseColorFactor.rgb) + totalSpecular);
    #else
        glFragColor.xyz = glFragColor.xyz * (InputToLinear(emissive) + totalDiffuse + InputToLinear(baseColorFactor.rgb)) + totalSpecular;
    #endif

    vec3 lightDiffuse;
     #if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
        float shadowCoeff = shadow_computeShadow();
        lightDiffuse = shadow_blend(lightDiffuse, shadowCoeff).rgb;
    #endif
    #ifdef HAS_COLOR
        glFragColor = glFragColor * vColor;
    #endif
    glFragColor.rgb += lightDiffuse;
    glFragColor.rgb = linearTosRGB(glFragColor.rgb);
    #if defined(HAS_IBL_LIGHTING)
        vec3 reflectVec;
        #if defined(HAS_NORMAL_MAP)
            #ifdef ENVMAP_MODE_REFLECTION
                reflectVec = reflect(-viewDirection, normal);
            #else
                reflectVec = refract(-viewDirection, normal, 1.0);
            #endif
        #else
            reflectVec = reflect(-viewDirection, normal);
        #endif

        reflectVec = mat3(viewMatrixInverse) * reflectVec;
        float reflectScale = 1.0;
        vec3 ambient;
        #ifdef HAS_IBL_LIGHTING
          ambient = vec3(0.0);
        #elif
          ambient = ambientColor;
        #endif
        ambient *= reflectScale;
        float facing = dot(viewDirection, normal);
        if (facing < -1e-2  || reflectivity == 0.0)
        facing = 1.0;
        else
        facing = max(1e-6, facing);

        vec3 schlickRefl;
        vec3 specular = GET_SPECULAR();
        #ifdef METAL
          schlickRefl = InputToLinear(specular);
        #else
            schlickRefl = Schlick_v3(InputToLinear(specular), facing) * (1.0 - envRotationSin);
            glFragColor.a = mix(glFragColor.a, Schlick_f(glFragColor.a, facing), reflectivity) * envRotationCos;
            float invSchlick = pow(1.0 - facing * 0.5, 5.0);
            float norm_factor = (28.0 / 23.0) * (1.0 - invSchlick) * (1.0 - invSchlick);
            glFragColor.rgb *= norm_factor * (1.0 - InputToLinear(specular));
        #endif
        glFragColor.rgb += ambient.rgb * specularStrength * schlickRefl.rgb;
    #endif
    #if defined(TONEMAP_OUTPUT)
      #if TONEMAP_OUTPUT == 1
          glFragColor.rgb = toneMapCanonOGS_WithGamma_WithColorPerserving(exposureBias * glFragColor.rgb);
          #elif TONEMAP_OUTPUT == 2
          glFragColor.rgb = toneMapCanonFilmic_WithGamma(exposureBias * glFragColor.rgb);
      #endif
    #endif
    glFragColor.rgb = mix(glFragColor.rgb, themingColor.rgb, themingColor.a);
    #if __VERSION__ == 100
        gl_FragColor = glFragColor;
    #endif
}
