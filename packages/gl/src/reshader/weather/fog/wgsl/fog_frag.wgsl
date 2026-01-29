
struct WeatherUniforms {
    time: f32,
    resolution: vec2f,
    #ifdef HAS_SNOW
        snowIntensity: f32,
    #endif
    #ifdef HAS_FOG
        fogColor: vec3f,
    #endif
};

@group(0) @binding($b) var<uniform> uniforms: WeatherUniforms;

#ifdef HAS_RAIN
    @group(0) @binding($b) var ripplesMapSampler: sampler;
    @group(0) @binding($b) var ripplesMap: texture_2d<f32>;
#endif

#ifdef HAS_SNOW
    @group(0) @binding($b) var normalMapSampler: sampler;
    @group(0) @binding($b) var normalMap: texture_2d<f32>;
#endif

@group(0) @binding($b) var sceneMapSampler: sampler;
#ifdef HAS_MULTISAMPLED
  @group(0) @binding($b) var sceneMap: texture_multisampled_2d<f32>;
#else
  @group(0) @binding($b) var sceneMap: texture_2d<f32>;
#endif
@group(0) @binding($b) var mixFactorMapSampler: sampler;
#ifdef HAS_MULTISAMPLED
  @group(0) @binding($b) var mixFactorMap: texture_multisampled_2d<f32>;
#else
  @group(0) @binding($b) var mixFactorMap: texture_2d<f32>;
#endif

const HASHSCALE1 = 0.1031;
const HASHSCALE3 = vec3f(0.1031, 0.1030, 0.0973);
const HASHSCALE4 = vec4f(0.1031, 0.1030, 0.0973, 0.1099);
const SIZE_RATE = 0.5;
const XSPEED = 0.2;
const YSPEED = 0.5;
const LAYERS = 20.0;

fn lerp(a: f32, b: f32, w: f32) -> f32 {
    return a + w * (b - a);
}

fn Hash11(p: f32) -> f32 {
    var p3 = fract(vec3f(p) * HASHSCALE1);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}

fn Hash22(p: vec2f) -> vec2f {
    var p3 = fract(vec3f(p.x, p.y, p.x) * HASHSCALE3);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.xx + p3.yz) * p3.zy);
}

fn Rand22(co: vec2f) -> vec2f {
    let x = fract(sin(dot(co, vec2f(122.9898, 783.233))) * 43758.5453);
    let y = fract(sin(dot(co, vec2f(457.6537, 537.2793))) * 37573.5913);
    return vec2f(x, y);
}
#ifdef HAS_SNOW
    fn SnowSingleLayer(uv: vec2f, layer: f32) -> vec3f {
        var uv_mut = uv * (2.0 + layer);
        let speedX = XSPEED * uniforms.snowIntensity;
        let xOffset = uv_mut.y * (((Hash11(layer) * 2.0 - 1.0) * 0.5 + 1.0) * speedX);
        let yOffset = YSPEED * uniforms.time;
        uv_mut += vec2f(xOffset, yOffset);

        let rgrid = Hash22(floor(uv_mut) + (31.1759 * layer));
        uv_mut = fract(uv_mut);
        uv_mut -= (rgrid * 2.0 - 1.0) * 0.35;
        uv_mut -= 0.5;

        let r = length(uv_mut);
        let circleSize = 0.05 * (1.0 + 0.3 * sin(uniforms.time * SIZE_RATE));
        let val = smoothstep(circleSize, -circleSize, r);
        let col = vec3f(val, val, val) * rgrid.x;

        return col;
    }

    fn snowFlower(@builtin(position) fragCoord: vec4f) -> vec3f {
        var acc = vec3f(0.0, 0.0, 0.0);
        var uv = fragCoord.xy / uniforms.resolution;
        uv *= vec2f(uniforms.resolution.x / uniforms.resolution.y, 1.0);

        let layers = LAYERS * uniforms.snowIntensity;

        for (var i: f32 = 0.0; i < layers; i += 1.0) {
            acc += SnowSingleLayer(uv, i);
        }

        return acc;
    }

    fn snow(sceneColor: vec4f, normalColor: vec4f, height: f32) -> vec3f {
        let snowIntense = normalColor.b;
        let fixedC = vec3f(1.0, 1.0, 1.0);

        if (height < 1.0) {
            let r = lerp(0.5, fixedC.x, snowIntense);
            let g = lerp(0.5, fixedC.y, snowIntense);
            let b = lerp(0.5, fixedC.z, snowIntense);
            return vec3f(r, g, b);
        } else {
            let r = lerp(sceneColor.r, fixedC.x, snowIntense);
            let g = lerp(sceneColor.g, fixedC.y, snowIntense);
            let b = lerp(sceneColor.b, fixedC.z, snowIntense);
            return vec3f(r, g, b);
        }
    }
#endif

@fragment
fn main(
    vertexOutput: VertexOutput
) -> @location(0) vec4f {
    let uv = vertexOutput.vTexCoord;
    #ifdef HAS_MULTISAMPLED
        let sceneColor = textureLoad(sceneMap, vec2i(uv * uniforms.resolution), 0);
    #else
        let sceneColor = textureSample(sceneMap, sceneMapSampler, uv);
    #endif
    var glFragColor = sceneColor;
    #ifdef HAS_MULTISAMPLED
        let mixFactorColor = textureLoad(mixFactorMap, vec2i(uv * uniforms.resolution), 0);
    #else
        let mixFactorColor = textureSample(mixFactorMap, mixFactorMapSampler, uv);
    #endif

    #ifdef HAS_RAIN
        let ripplesColor = textureSample(ripplesMap, ripplesMapSampler, vertexOutput.vTexCoord);
        if (mixFactorColor.g < 1.0) {
            glFragColor = mix(sceneColor, ripplesColor, 0.4);
        }
    #endif

    #ifdef HAS_SNOW
        let fragCoord = vertexOutput.position.xy;
        let snowFlowerColor = snowFlower(fragCoord);
        glFragColor = vec4f(glFragColor.rgb + snowFlowerColor, glFragColor.a);

        #ifdef HAS_SNOW_NORMAL_MAP
            let normalColor = textureSample(normalMap, normalMapSampler, vertexOutput.vTexCoord);
            let snowColor = snow(glFragColor, normalColor, mixFactorColor.a);
            glFragColor = vec4f(snowColor, glFragColor.a);
        #endif
    #endif

    #ifdef HAS_FOG
        let mixFactor = mixFactorColor.r;
        let mixColor = mix(uniforms.fogColor, glFragColor.rgb, mixFactor);
        glFragColor = vec4f(mixColor, glFragColor.a);
    #endif

    return glFragColor;
}
