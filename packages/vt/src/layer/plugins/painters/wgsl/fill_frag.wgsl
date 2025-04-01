#define SHADER_NAME FILL

#if HAS_SHADOWING && !HAS_BLOOM
    #include <vsm_shadow_frag>
#endif

struct FragmentUniforms {
    #ifdef HAS_PATTERN
        #ifndef HAS_UV_SCALE
            uvScale: vec2f,
        #endif
        #ifndef HAS_UV_OFFSET
            uvOffset: vec2f,
        #endif
        atlasSize: vec2f,
    #endif
    // blendSrcIsOne: f32,
    #ifndef HAS_COLOR
        polygonFill: vec4f,
    #endif

    #ifndef HAS_OPACITY
        polygonOpacity: f32,
    #endif
    tileExtent: f32,
}

struct ShaderUniforms {
    layerOpacity: f32,

}

@group(0) @binding($b) var<uniform> fragmentUniforms: FragmentUniforms;
@group(0) @binding($b) var<uniform> uniforms: ShaderUniforms;
#if HAS_PATTERN
    @group(0) @binding($b) var polygonPatternFile: texture_2d<f32>;
    @group(0) @binding($b) var polygonPatternFileSampler: sampler;
#endif
#ifdef HAS_PATTERN || HAS_COLOR || HAS_OPACITY || HAS_UV_SCALE || HAS_UV_OFFSET || HAS_HIGHLIGHT_COLOR || HAS_HIGHLIGHT_OPACITY
    struct VertexOutput {
    #ifdef HAS_PATTERN
        @location($i) vTexCoord: vec2f,
        @location($i) vTexInfo: vec4f,
    #endif
    #ifdef HAS_COLOR
        @location($i) vColor: vec4f,
    #endif
    #ifdef HAS_OPACITY
        @location($i) vOpacity: f32,
    #endif
    #ifdef HAS_UV_SCALE
        @location($i) vUVScale: vec2f,
    #endif
    #ifdef HAS_UV_OFFSET
        @location($i) vUVOffset: vec2f,
    #endif
    }
#endif

#include <highlight_frag>

#ifdef HAS_PATTERN
    fn computeUV(vertexOutput: VertexOutput) -> vec2f {
        #ifdef HAS_UV_SCALE
            let myUVScale = vertexOutput.vUVScale;
        #else
            let myUVScale = fragmentUniforms.uvScale;
        #endif
        #ifdef HAS_UV_OFFSET
            let myUVOffset = vertexOutput.vUVOffset;
        #else
            let myUVOffset = fragmentUniforms.uvOffset;
        #endif

        let uv = (vertexOutput.vTexCoord * myUVScale + myUVOffset) % 1.0;
        let uvStart = vertexOutput.vTexInfo.xy;
        let uvSize = vertexOutput.vTexInfo.zw;
        return (uvStart + uv * uvSize) / fragmentUniforms.atlasSize;
    }
#endif

@fragment
fn main(
    #ifdef HAS_PATTERN || HAS_COLOR || HAS_OPACITY || HAS_UV_SCALE || HAS_UV_OFFSET || HAS_HIGHLIGHT_COLOR || HAS_HIGHLIGHT_OPACITY
    vertexOutput: VertexOutput
    #endif
) -> @location(0) vec4f {
    // #ifndef ENABLE_TILE_STENCIL
    //     let clipExtent = fragmentUniforms.tileExtent;
    //     let clip = sign(clipExtent - min(clipExtent, abs(vertexOutput.vPosition.x))) *
    //                sign(1.0 + sign(vertexOutput.vPosition.x)) *
    //                sign(clipExtent - min(clipExtent, abs(vertexOutput.vPosition.y))) *
    //                sign(1.0 + sign(vertexOutput.vPosition.y));
    //     if (clip == 0.0) {
    //         discard;
    //     }
    // #endif

    #ifdef HAS_COLOR
        var color = vertexOutput.vColor;
    #else
        var color = fragmentUniforms.polygonFill;
    #endif

    #ifdef HAS_PATTERN
        let uv = computeUV(vertexOutput);
        var texColor = textureSample(polygonPatternFile, polygonPatternFileSampler, uv);
        if (vertexOutput.vTexInfo.z * vertexOutput.vTexInfo.w > 1.0) {
            color = texColor;
        }
    #endif

    #ifdef HAS_OPACITY
        var outputColor = color * vertexOutput.vOpacity;
    #else
        var outputColor = color * fragmentUniforms.polygonOpacity;
    #endif

    outputColor *= uniforms.layerOpacity;

    #if HAS_SHADOWING && !HAS_BLOOM
        let shadowCoeff = shadow_computeShadow();
        outputColor.rgb = shadow_blend(outputColor.rgb, shadowCoeff);
    #endif

    #if HAS_HIGHLIGHT_COLOR || HAS_HIGHLIGHT_OPACITY
        outputColor = highlight_blendColor(outputColor, vertexOutput);
    #endif

    // if (fragmentUniforms.blendSrcIsOne == 1.0) {
    //     outputColor *= outputColor.a;
    // }
    // outputColor = vec4f(vertexOutput.vUVScale, 0.0, 1.0);

    return outputColor;
}
