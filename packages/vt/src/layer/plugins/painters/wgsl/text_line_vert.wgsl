#define SHADER_NAME TEXT_LINE

struct TextLineUniforms {
    textSize: f32,
    textDx: f32,
    textDy: f32,
    textPitchWithMap: f32,
    projViewModelMatrix: mat4x4f,
    textPerspectiveRatio: f32,
    glyphTexSize: vec2f,
    tileRatio: f32,
    zoomScale: f32,
}

struct ShaderUniforms {

    cameraToCenterDistance: f32,
    mapPitch: f32,
    canvasSize: vec2f,
    textPitchFilter: f32,
    isRenderingTerrain: f32,
    layerScale: f32,
    #ifdef HAS_OFFSET_Z
        altitudeScale: f32,
    #endif
}

@group(0) @binding($b) var<uniform> uniforms: TextLineUniforms;
@group(0) @binding($b) var<uniform> shaderUniforms: ShaderUniforms;

struct VertexInput {
#ifdef HAS_ALTITUDE
    @location($i) aPosition: POSITION_TYPE_2,
    @location($i) aAltitude: f32,
#else
    @location($i) aPosition: POSITION_TYPE_3,
#endif
    @location($i) aTexCoord: vec2u,
#ifdef HAS_OFFSET_Z
    @location($i) aOffset: vec3i,
#else
    @location($i) aOffset: vec2i,
#endif
#ifdef ENABLE_COLLISION
    @location($i) aOpacity: u32,
#endif
#ifdef HAS_OPACITY
    @location($i) aColorOpacity: u32,
#endif
#ifdef HAS_TEXT_SIZE
    @location($i) aTextSize: u32,
#endif
#ifdef HAS_TEXT_DX
    @location($i) aTextDx: i32,
#endif
#ifdef HAS_TEXT_DY
    @location($i) aTextDy: i32,
#endif
#ifdef HAS_PITCH_ALIGN
    @location($i) aPitchAlign: u32,
#endif
#ifdef HAS_TEXT_FILL
    @location($i) aTextFill: vec4u,
#endif
#ifdef HAS_TEXT_HALO_FILL
    @location($i) aTextHaloFill: vec4u,
#endif
#if HAS_TEXT_HALO_RADIUS || HAS_TEXT_HALO_OPACITY
    @location($i) aTextHalo: vec2u,
#endif
};

struct VertexOutput {
    @builtin(position) position: vec4f,
#ifndef PICKING_MODE
    @location($o) vTexCoord: vec2f,
    @location($o) vGammaScale: f32,
    @location($o) vTextSize: f32,
    @location($o) vOpacity: f32,
    #ifdef HAS_TEXT_FILL
        @location($o) vTextFill: vec4f,
    #endif
    #ifdef HAS_TEXT_HALO_FILL
        @location($o) vTextHaloFill: vec4f,
    #endif
    #if HAS_TEXT_HALO_RADIUS || HAS_TEXT_HALO_OPACITY
        @location($o) vTextHalo: vec2f,
    #endif
#endif
};

#include <vt_position_vert>

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    var position = unpackVTPosition(input);

#ifdef HAS_TEXT_DX
    var myTextDx = f32(input.aTextDx);
#else
    var myTextDx = uniforms.textDx;
#endif

#ifdef HAS_TEXT_DY
    var myTextDy = f32(input.aTextDy);
#else
    var myTextDy = uniforms.textDy;
#endif

#ifdef HAS_TEXT_SIZE
    var myTextSize = f32(input.aTextSize) * shaderUniforms.layerScale;
#else
    var myTextSize = uniforms.textSize * shaderUniforms.layerScale;
#endif

#ifdef HAS_PITCH_ALIGN
    var isPitchWithMap = f32(input.aPitchAlign);
#else
    var isPitchWithMap = uniforms.textPitchWithMap;
#endif

    output.position = uniforms.projViewModelMatrix * vec4f(position, 1.0);
    var projDistance = output.position.w;

    var cameraScale = projDistance / shaderUniforms.cameraToCenterDistance;

    var perspectiveRatio: f32;
    if (shaderUniforms.isRenderingTerrain == 1.0) {
        perspectiveRatio = 1.0;
    } else {
        var distanceRatio = (1.0 - shaderUniforms.cameraToCenterDistance / projDistance) * uniforms.textPerspectiveRatio;
        perspectiveRatio = clamp(
            0.5 + 0.5 * (1.0 - distanceRatio),
            0.0,
            4.0);
    }

#ifdef HAS_OFFSET_Z
    var offset = vec2f(input.aOffset) / 10.0;
    offset.z /= shaderUniforms.altitudeScale;
#else
    var offset = vec3f(vec2f(input.aOffset) / 10.0, 0.0);
#endif

    var texCoord = vec2f(input.aTexCoord);

    if (isPitchWithMap == 1.0) {
        var offsetScale: f32;
        if (shaderUniforms.isRenderingTerrain == 1.0) {
            offsetScale = uniforms.tileRatio;
        } else {
            offsetScale = uniforms.tileRatio / uniforms.zoomScale * cameraScale * perspectiveRatio;
        }
        offset = offset * offsetScale;
        output.position = uniforms.projViewModelMatrix * vec4f(position + offset, 1.0);
    } else {
        let perspOffset = offset.xy * 2.0 / shaderUniforms.canvasSize * perspectiveRatio * projDistance;
        output.position = vec4f(output.position.xy + perspOffset, output.position.zw);
    }
    let dxdy = vec2f(myTextDx, -myTextDy) * 2.0 / shaderUniforms.canvasSize * projDistance;
    output.position = vec4f(output.position.xy + dxdy, output.position.zw);

    if (shaderUniforms.textPitchFilter > 0.0) {
        if ((shaderUniforms.textPitchFilter == 1.0 && isPitchWithMap == 0.0) || (shaderUniforms.textPitchFilter == 2.0 && isPitchWithMap == 1.0)) {
            output.position = vec4f(-9999.0, -9999.0, 0.0, 1.0);
        }
    }

#ifndef PICKING_MODE
    if (isPitchWithMap == 1.0) {
        output.vGammaScale = cameraScale + shaderUniforms.mapPitch / 4.0;
    } else {
        output.vGammaScale = mix(1.0, cameraScale, uniforms.textPerspectiveRatio);
    }
    output.vGammaScale = clamp(output.vGammaScale, 0.0, 1.0);
    output.vTexCoord = texCoord / uniforms.glyphTexSize;
    output.vTextSize = myTextSize;
#ifdef ENABLE_COLLISION
    output.vOpacity = f32(input.aOpacity) / 255.0;
#else
    output.vOpacity = 1.0;
#endif
#ifdef HAS_OPACITY
    output.vOpacity *= f32(input.aColorOpacity) / 255.0;
#endif

#ifdef HAS_TEXT_FILL
    output.vTextFill = vec4f(input.aTextFill) / 255.0;
#endif

#ifdef HAS_TEXT_HALO_FILL
    output.vTextHaloFill = vec4f(input.aTextHaloFill) / 255.0;
#endif

#if HAS_TEXT_HALO_RADIUS || HAS_TEXT_HALO_OPACITY
    output.vTextHalo = vec2f(input.aTextHalo);
#endif
#if HAS_HIGHLIGHT_COLOR || HAS_HIGHLIGHT_OPACITY
    highlight_setVarying(input, output);
#endif
#else
#ifdef ENABLE_COLLISION
    var visible = f32(input.aOpacity[0]) == 255.0;
#else
    var visible = true;
#endif
    fbo_picking_setData(output, output.position.w, visible);
#endif

    return output;
}
