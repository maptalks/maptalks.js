#if __VERSION__ == 100
  #ifdef GL_OES_standard_derivatives
    #extension GL_OES_standard_derivatives : enable
  #endif
#endif
precision mediump float;
#include <gl2_frag>
varying vec2 vTexCoord;
#ifdef HAS_RAIN
    uniform sampler2D ripplesMap;
#endif
#ifdef HAS_SNOW
    uniform sampler2D normalMap;
#endif
#ifdef HAS_FOG
    uniform vec3 fogColor;
#endif
uniform sampler2D sceneMap;
uniform sampler2D mixFactorMap;
uniform float time;
uniform vec2 resolution;
uniform float snowIntensity;

float lerp(float a, float b, float w) {
    return a + w * (b - a);
}

#define HASHSCALE1 .1031
#define HASHSCALE3 vec3(.1031, .1030, .0973)
#define HASHSCALE4 vec3(.1031, .1030, .0973, .1099)

float SIZE_RATE = 0.5;
float XSPEED = 0.2;
float YSPEED = 0.5;
float LAYERS = 20.;

float Hash11(float p)
{
	vec3 p3  = fract(vec3(p) * HASHSCALE1);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}

vec2 Hash22(vec2 p)
{
	vec3 p3 = fract(vec3(p.xyx) * HASHSCALE3);
    p3 += dot(p3, p3.yzx+19.19);
    return fract((p3.xx+p3.yz)*p3.zy);
}


vec2 Rand22(vec2 co)
{
    float x = fract(sin(dot(co.xy ,vec2(122.9898,783.233))) * 43758.5453);
    float y = fract(sin(dot(co.xy ,vec2(457.6537,537.2793))) * 37573.5913);
    return vec2(x,y);
}

vec3 SnowSingleLayer(vec2 uv,float layer){
    vec3 acc = vec3(0.0,0.0,0.0);//让雪花的大小变化
    uv = uv * (2.0+layer);//透视视野变大效果
    float speedX = XSPEED * snowIntensity;
    float xOffset = uv.y * (((Hash11(layer)*2.-1.)*0.5+1.)*speedX);//增加x轴移动
    float yOffset = (YSPEED*time);//y轴下落过程
    uv += vec2(xOffset,yOffset);
    vec2 rgrid = Hash22(floor(uv)+(31.1759*layer));
    uv = fract(uv);
    uv -= (rgrid*2.-1.0) * 0.35;
    uv -=0.5;
    float r = length(uv);
    //让大小变化点
    float circleSize = 0.05*(1.0+0.3*sin(time*SIZE_RATE));
    float val = smoothstep(circleSize,-circleSize,r);
    vec3 col = vec3(val,val,val)* rgrid.x ;
    return col;
}

vec3 snowFlower() {
    vec3 acc = vec3(0,0,0);
    vec2 uv = gl_FragCoord.xy/resolution.xy;
    uv *= vec2(resolution.x/resolution.y,1.0);
    float layers = LAYERS * snowIntensity;
    for (float i = 0.; i < layers; i++) {
        acc += SnowSingleLayer(uv, i);
    }
    return acc;
}

vec3 snow(vec4 sceneColor, vec4 normalColor, float height) {
    float snowIntense = normalColor.b;
    vec3 fixedC = vec3(1.0, 1.0, 1.0);
    if (height < 1.0) {
        float r = lerp(0.5, fixedC.x, snowIntense);
        float g = lerp(0.5, fixedC.y, snowIntense);
        float b = lerp(0.5, fixedC.z, snowIntense);
        return vec3(r, g, b);
    } else {
        float r = lerp(sceneColor.r, fixedC.x, snowIntense);
        float g = lerp(sceneColor.g, fixedC.y, snowIntense);
        float b = lerp(sceneColor.b, fixedC.z, snowIntense);
        return vec3(r, g, b);
    }
}

void main() {
    vec4 sceneColor = texture2D(sceneMap, vTexCoord);
    glFragColor = sceneColor;
    vec4 mixFactorColor = texture2D(mixFactorMap, vTexCoord);
    #ifdef HAS_RAIN
        vec4 ripplesColor = texture2D(ripplesMap, vTexCoord);
        if (mixFactorColor.g < 1.0) {
            sceneColor = mix(sceneColor, ripplesColor, 0.4);
        }
        glFragColor = sceneColor;
    #endif

    #ifdef HAS_SNOW
        vec3 snowFlowerColor = snowFlower();
        glFragColor = vec4(sceneColor.rgb + snowFlowerColor, sceneColor.a);
    #endif

    #ifdef HAS_FOG
        float mixFactor = mixFactorColor.r;
        vec3 mixColor = mix(fogColor, glFragColor.rgb, mixFactor);
        glFragColor = vec4(mixColor, sceneColor.a);
    #endif
      #if __VERSION__ == 100
        gl_FragColor = glFragColor;
    #endif
}
