/* https://github.com/mitsuhiko/webgl-meincraft */

/* Basic FXAA implementation based on the code on geeks3d.com with the
   modification that the texture2DLod stuff was removed since it's
   unsupported by WebGL. */

#define SHADER_NAME FXAA
// #define FXAA_REDUCE_MIN   (1.0/ 128.0)
// #define FXAA_REDUCE_MUL   (1.0 / 8.0)
// #define FXAA_SPAN_MAX     8.0

precision mediump float;

varying vec2 vTexCoord;


uniform float enableFXAA;
uniform float enableToneMapping;
uniform float enableSharpen;
uniform vec2 resolution;
uniform sampler2D textureSource;
#ifdef HAS_NOAA_TEX
  uniform sampler2D noAaTextureSource;
#endif
#ifdef HAS_POINT_TEX
  uniform sampler2D pointTextureSource;
#endif
#ifdef HAS_TAA_TEX
  uniform sampler2D taaTextureSource;
  #ifdef HAS_FXAA_TEX
    uniform sampler2D fxaaTextureSource;
  #endif
#endif
uniform float pixelRatio;
uniform float sharpFactor;//0 - 5

#ifdef HAS_OUTLINE_TEX
  uniform sampler2D textureOutline;
  uniform float enableOutline;
  uniform float highlightFactor;
  uniform float outlineFactor;
  uniform float outlineWidth;
  uniform vec3 outlineColor;
#endif

vec2 gTexCoord;

vec4 readFXAATexture(vec2 uv) {
  #ifdef HAS_TAA_TEX
    vec4 source = texture2D(textureSource, uv);
    vec4 taa = texture2D(taaTextureSource, uv);
    #ifdef HAS_FXAA_TEX
      vec4 fxaa = texture2D(fxaaTextureSource, uv);
    #else
      vec4 fxaa = vec4(0.0);
    #endif
    vec4 taaBlended = taa + source * (1.0 - taa.a);
    return fxaa + taaBlended * (1.0 - fxaa.a);
  #else
    return texture2D(textureSource, uv);
  #endif

}

// vec4 applyFXAA(vec2 fragCoord)
// {
//     vec4 color;
//   mediump vec2 inverseVP = vec2(1.0 / resolution.x, 1.0 / resolution.y);
//   vec3 rgbNW = readFXAATexture((fragCoord + vec2(-1.0, -1.0)) * inverseVP).xyz;
//   vec3 rgbNE = readFXAATexture((fragCoord + vec2(1.0, -1.0)) * inverseVP).xyz;
//   vec3 rgbSW = readFXAATexture((fragCoord + vec2(-1.0, 1.0)) * inverseVP).xyz;
//   vec3 rgbSE = readFXAATexture((fragCoord + vec2(1.0, 1.0)) * inverseVP).xyz;
//   vec4 texColor = readFXAATexture(fragCoord  * inverseVP);
//   vec3 rgbM  = texColor.xyz;
//   vec3 luma = vec3(0.299, 0.587, 0.114);
//   float lumaNW = dot(rgbNW, luma);
//   float lumaNE = dot(rgbNE, luma);
//   float lumaSW = dot(rgbSW, luma);
//   float lumaSE = dot(rgbSE, luma);
//   float lumaM  = dot(rgbM,  luma);
//   float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
//   float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));

//   mediump vec2 dir;
//   dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
//   dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));

//   float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) *
//                         (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);

//   float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
//   dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX),
//             max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),
//             dir * rcpDirMin)) * inverseVP;

//   vec4 rgbA = 0.5 * (
//       readFXAATexture(fragCoord * inverseVP + dir * (1.0 / 3.0 - 0.5)) +
//       readFXAATexture(fragCoord * inverseVP + dir * (2.0 / 3.0 - 0.5)));
//   vec4 rgbB = rgbA * 0.5 + 0.25 * (
//       readFXAATexture(fragCoord * inverseVP + dir * -0.5) +
//       readFXAATexture(fragCoord * inverseVP + dir * 0.5));

//   float lumaB = dot(rgbB.xyz, luma);
//   if ((lumaB < lumaMin) || (lumaB > lumaMax))
//       color = rgbA;
//   else
//       color = rgbB;
//   return color;
// }

//---------------sharpen-----------------------
vec3 sharpColorFactor(const in vec3 color, const float sharp) {
    vec2 off = pixelRatio / resolution.xy;
    float count = 0.0;
    vec4 rgbNW = texture2D(textureSource, gTexCoord + off * vec2(-1.0, -1.0));
    rgbNW.rgb = mix(vec3(0.0), rgbNW.rgb, sign(rgbNW.a));
    count += mix(0.0, 1.0, sign(rgbNW.a));
    vec4 rgbSE = texture2D(textureSource, gTexCoord + off * vec2(1.0, 1.0));
    rgbSE.rgb = mix(vec3(0.0), rgbSE.rgb, sign(rgbSE.a));
    count += mix(0.0, 1.0, sign(rgbSE.a));
    vec4 rgbNE = texture2D(textureSource, gTexCoord + off * vec2(1.0, -1.0));
    rgbNE.rgb = mix(vec3(0.0), rgbNE.rgb, sign(rgbNE.a));
    count += mix(0.0, 1.0, sign(rgbNE.a));
    vec4 rgbSW = texture2D(textureSource, gTexCoord + off * vec2(-1.0, 1.0));
    rgbSW.rgb = mix(vec3(0.0), rgbSW.rgb, sign(rgbSW.a));
    count += mix(0.0, 1.0, sign(rgbSW.a));
    return color + sharp * (count * color - rgbNW.rgb - rgbNE.rgb - rgbSW.rgb - rgbSE.rgb);
}
vec4 sharpen(const in vec4 color) {
    return vec4(sharpColorFactor(color.rgb, sharpFactor), color.a);
}

//---------------tone mapping-------------------
vec3 HDR_ACES(const vec3 x) {
    // Narkowicz 2015, "ACES Filmic Tone Mapping Curve"
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return (x * (a * x + b)) / (x * (c * x + d) + e);
}

vec3 tonemap(vec3 color) {
    // vec3 c = color;
    // c = HDR_ACES(c);
    // c = pow(c, vec3(1.0/2.2));
    // return c;
    // HDR tonemapping
    color = color / (color + vec3(1.0));
    // gamma correct
    return color = pow(color, vec3(1.0/2.2));
}
#ifdef HAS_OUTLINE_TEX
  vec4 outline() {
      float fac0 = 2.0;
      float fac1 = 1.0;
      float offsetx = pixelRatio / resolution[0] * outlineWidth;
      float offsety = pixelRatio / resolution[1] * outlineWidth;
      vec4 texel0 = (texture2D(textureOutline, gTexCoord + vec2(offsetx, offsety)));
      vec4 texel1 = (texture2D(textureOutline, gTexCoord + vec2(offsetx, 0.0)));
      vec4 texel2 = (texture2D(textureOutline, gTexCoord + vec2(offsetx, -offsety)));
      vec4 texel3 = (texture2D(textureOutline, gTexCoord + vec2(0.0, -offsety)));
      vec4 texel4 = (texture2D(textureOutline, gTexCoord + vec2(-offsetx, -offsety)));
      vec4 texel5 = (texture2D(textureOutline, gTexCoord + vec2(-offsetx, 0.0)));
      vec4 texel6 = (texture2D(textureOutline, gTexCoord + vec2(-offsetx, offsety)));
      vec4 texel7 = (texture2D(textureOutline, gTexCoord + vec2(0.0, offsety)));
      vec4 rowx = -fac0 * texel5 + fac0 * texel1 + -fac1 * texel6 + fac1 * texel0 + -fac1 * texel4 + fac1 * texel2;
      vec4 rowy = -fac0 * texel3 + fac0 * texel7 + -fac1 * texel4 + fac1 * texel6 + -fac1 * texel2 + fac1 * texel0;
      float magSqr = sqrt(dot(rowy, rowy) + dot(rowx, rowx));
      bool infMag = magSqr < 1.0 / 65025.0;
      vec3 texelCenter = (texture2D(textureOutline, gTexCoord)).r * outlineColor;
      if (texelCenter == vec3(0.0) || (highlightFactor == 0.0 && infMag)) {
          return vec4(0.0);
      }
      float finalFactor = infMag ? highlightFactor : min(1.0, sqrt(magSqr) * outlineFactor);
      return finalFactor * vec4(texelCenter, 1.0);
  }

  vec4 composeOutline(const in vec4 color) {
      vec4 outline = outline();
      return outline + vec4(color) * (1.0 - outline.a);
  }
#endif
void main() {
    gTexCoord = vTexCoord;
    vec4 color;
    if (enableFXAA == 1.0) {
        // color = applyFXAA(gTexCoord * resolution);
    } else {
        color = readFXAATexture(vTexCoord);
    }
    if (enableSharpen == 1.0) {
        color = sharpen(color);
    }
    #if defined(HAS_NOAA_TEX) || defined(HAS_POINT_TEX)
      vec4 pointColor = vec4(0.0);
      vec4 noaaColor = vec4(0.0);
      #ifdef HAS_POINT_TEX
        pointColor = texture2D(pointTextureSource, vTexCoord);
      #endif
      #ifdef HAS_NOAA_TEX
        noaaColor = texture2D(noAaTextureSource, vTexCoord);
      #endif
      vec4 color1 = pointColor + noaaColor * (1.0 - pointColor.a);
      color = color1 + color * (1.0 - color1.a);
    #endif

    if (enableToneMapping == 1.0) {
        color.rgb = tonemap(color.rgb);
    }
    #ifdef HAS_OUTLINE_TEX
        color = composeOutline(color);
    #endif
    gl_FragColor = color;
}
