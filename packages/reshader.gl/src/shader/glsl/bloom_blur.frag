#define SHADER_NAME GAUSSIAN_BLUR

precision highp float;
uniform sampler2D textureSampler;
uniform float bloomThreshold;
uniform vec2 resolution;
uniform vec2 direction;

const vec3 colorBright = vec3(0.2126, 0.7152, 0.0722);

float getLuminance(const in vec3 color) {
    return dot(color, colorBright);
}

vec4 extractBright(vec4 color) {
    float bright = sign(clamp(getLuminance(color.rgb) - bloomThreshold, 0.0, 1.0));
    return color * bright;
}

vec4 fetchTex(const in sampler2D image, const in vec2 uv) {
    vec4 fetchColor = texture2D(image, uv);
    return extractBright(fetchColor);
}

// vec4 blur5(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
//   vec4 color = vec4(0.0);
//   vec2 off1 = vec2(1.3333333333333333) * direction;
//   color += fetchTex(image, uv) * 0.29411764705882354;
//   color += fetchTex(image, uv + (off1 / resolution)) * 0.35294117647058826;
//   color += fetchTex(image, uv - (off1 / resolution)) * 0.35294117647058826;
//   return color;
// }

// vec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
//   vec4 color = vec4(0.0);
//   vec2 off1 = vec2(1.3846153846) * direction;
//   vec2 off2 = vec2(3.2307692308) * direction;
//   color += fetchTex(image, uv) * 0.2270270270;
//   color += fetchTex(image, uv + (off1 / resolution)) * 0.3162162162;
//   color += fetchTex(image, uv - (off1 / resolution)) * 0.3162162162;
//   color += fetchTex(image, uv + (off2 / resolution)) * 0.0702702703;
//   color += fetchTex(image, uv - (off2 / resolution)) * 0.0702702703;
//   return color;
// }

vec4 blur13(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.411764705882353) * direction;
  vec2 off2 = vec2(3.2941176470588234) * direction;
  vec2 off3 = vec2(5.176470588235294) * direction;
  color += fetchTex(image, uv) * 0.1964825501511404;
  color += fetchTex(image, uv + (off1 / resolution)) * 0.2969069646728344;
  color += fetchTex(image, uv - (off1 / resolution)) * 0.2969069646728344;
  color += fetchTex(image, uv + (off2 / resolution)) * 0.09447039785044732;
  color += fetchTex(image, uv - (off2 / resolution)) * 0.09447039785044732;
  color += fetchTex(image, uv + (off3 / resolution)) * 0.010381362401148057;
  color += fetchTex(image, uv - (off3 / resolution)) * 0.010381362401148057;
  return color;
}

varying vec2 vTexCoord;

void main() {
    gl_FragColor = blur13(textureSampler, vTexCoord, resolution, direction);
}
