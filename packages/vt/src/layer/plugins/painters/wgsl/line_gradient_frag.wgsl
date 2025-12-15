#define SHADER_NAME LINE_GRADIENT
#define DEVICE_PIXEL_RATIO 1.0
#define MAX_LINE_COUNT 128.0

#ifdef HAS_SHADOWING && !HAS_BLOOM
    #include <vsm_shadow_frag>
#endif

#include <highlight_frag>

struct LineGradientUniforms {
    layerOpacity: f32,

    #ifdef HAS_TRAIL
        trailSpeed: f32,
        trailLength: f32,
        trailCircle: f32,
        currentTime: f32,
    #endif

};

struct LineFragmentUniforms {
    lineBlur: f32,
    tileExtent: f32,
    lineGradientTextureHeight: f32,
    #ifndef HAS_OPACITY
        lineOpacity: f32,
    #endif
};

@group(0) @binding($b) var<uniform> uniforms: LineGradientUniforms;
@group(0) @binding($b) var<uniform> lineUniforms: LineFragmentUniforms;
@group(0) @binding($b) var lineGradientTexture: texture_2d<f32>;
@group(0) @binding($b) var lineGradientTextureSampler: sampler;

struct VertexOutput {
    @location($i) vNormal: vec2f,
    @location($i) vWidth: vec2f,
    @location($i) vGammaScale: f32,
#ifndef ENABLE_TILE_STENCIL
    @location($i) vPosition: vec2f,
#endif
    @location($i) vVertex: vec3f,
#if HAS_PATTERN || HAS_DASHARRAY || HAS_GRADIENT || HAS_TRAIL
    @location($i) vLinesofar: f32,
#endif
    #ifdef HAS_STROKE_COLOR
        @location($i) vStrokeColor: vec4f,
    #endif
    #ifdef HAS_OPACITY
        @location($i) vOpacity: f32,
    #endif
    #ifdef HAS_GRADIENT
        @location($i) vGradIndex: f32,
    #endif
};

@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    #ifndef ENABLE_TILE_STENCIL
        let tileExtent = lineUniforms.tileExtent;
        let clip = sign(tileExtent - min(tileExtent, abs(vertexOutput.vPosition.x))) *
                   sign(1.0 + sign(vertexOutput.vPosition.x)) *
                   sign(tileExtent - min(tileExtent, abs(vertexOutput.vPosition.y))) *
                   sign(1.0 + sign(vertexOutput.vPosition.y));
        if clip == 0.0 {
            discard;
        }
    #endif

    let dist = length(vertexOutput.vNormal) * vertexOutput.vWidth.x;
    let blur2 = (lineUniforms.lineBlur + 1.0 / DEVICE_PIXEL_RATIO) * vertexOutput.vGammaScale;
    let alpha = clamp(min(dist - (vertexOutput.vWidth.y - blur2), vertexOutput.vWidth.x - dist) / blur2, 0.0, 1.0);

    let linesofar = vertexOutput.vLinesofar;
    let texCoord = vec2f(linesofar, (vertexOutput.vGradIndex * 2.0 + 0.5) / lineUniforms.lineGradientTextureHeight);
    var color = textureSample(lineGradientTexture, lineGradientTextureSampler, texCoord) * alpha;

    color = color * max(sign(MAX_LINE_COUNT - vertexOutput.vGradIndex), 0.0);

    #ifdef HAS_TRAIL
        let trailMod = mod(linesofar - uniforms.currentTime * uniforms.trailSpeed * 0.1, uniforms.trailCircle);
        let trailAlpha = select(0.0, mix(0.0, 1.0, trailMod / uniforms.trailLength), trailMod < uniforms.trailLength);
        color = color * trailAlpha;
    #endif

    #ifdef HAS_OPACITY
        let opacity = vertexOutput.vOpacity;
    #else
        let opacity = lineUniforms.lineOpacity;
    #endif

    var fragColor = color * opacity * uniforms.layerOpacity;

    #if HAS_SHADOWING && !HAS_BLOOM
        let shadowCoeff = shadow_computeShadow(vertexOutput);
        fragColor = vec4f(shadow_blend(fragColor.rgb, shadowCoeff).rgb, fragColor.a);
    #endif
    #if HAS_HIGHLIGHT_OPACITY || HAS_HIGHLIGHT_COLOR
        fragColor = highlight_blendColor(fragColor, vertexOutput);
    #endif

    return fragColor;
}
