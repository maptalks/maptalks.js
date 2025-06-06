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
}

struct ShaderUniforms {
    zoomScale: f32,
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
    @location($i) aPosition: vec2f,
    @location($i) aAltitude: f32,
#else
    @location($i) aPosition: vec3f,
#endif
    @location($i) aTexCoord: vec2f,
#ifdef HAS_OFFSET_Z
    @location($i) aOffset: vec3f,
#else
    @location($i) aOffset: vec2f,
#endif
#ifdef ENABLE_COLLISION
    @location($i) aOpacity: f32,
#endif
#ifdef HAS_OPACITY
    @location($i) aColorOpacity: f32,
#endif
#ifdef HAS_TEXT_SIZE
    @location($i) aTextSize: f32,
#endif
#ifdef HAS_TEXT_DX
    @location($i) aTextDx: f32,
#endif
#ifdef HAS_TEXT_DY
    @location($i) aTextDy: f32,
#endif
#ifdef HAS_PITCH_ALIGN
    @location($i) aPitchAlign: f32,
#endif
#ifdef HAS_TEXT_FILL
    @location($i) aTextFill: vec4f,
#endif
#ifdef HAS_TEXT_HALO_FILL
    @location($i) aTextHaloFill: vec4f,
#endif
#if defined(HAS_TEXT_HALO_RADIUS) || defined(HAS_TEXT_HALO_OPACITY)
    @location($i) aTextHalo: vec2f,
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
    #if defined(HAS_TEXT_HALO_RADIUS) || defined(HAS_TEXT_HALO_OPACITY)
        @location($o) vTextHalo: vec2f,
    #endif
#endif
};

#include <vt_position_vert>

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    var position = unpackVTPosition();

#ifdef HAS_TEXT_DX
    var myTextDx = input.aTextDx;
#else
    var myTextDx = uniforms.textDx;
#endif

#ifdef HAS_TEXT_DY
    var myTextDy = input.aTextDy;
#else
    var myTextDy = uniforms.textDy;
#endif

#ifdef HAS_TEXT_SIZE
    var myTextSize = input.aTextSize * shaderUniforms.layerScale;
#else
    var myTextSize = uniforms.textSize * shaderUniforms.layerScale;
#endif

#ifdef HAS_PITCH_ALIGN
    var isPitchWithMap = input.aPitchAlign;
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
    var offset = input.aOffset / 10.0;
    offset.z /= shaderUniforms.altitudeScale;
#else
    var offset = vec3f(input.aOffset / 10.0, 0.0);
#endif

    var texCoord = input.aTexCoord;

    if (isPitchWithMap == 1.0) {
        var offsetScale: f32;
        if (shaderUniforms.isRenderingTerrain == 1.0) {
            offsetScale = uniforms.tileRatio;
        } else {
            offsetScale = uniforms.tileRatio / shaderUniforms.zoomScale * cameraScale * perspectiveRatio;
        }
        offset.xy *= offsetScale;
        output.position = uniforms.projViewModelMatrix * vec4f(position + offset, 1.0);
    } else {
        output.position.xy += offset.xy * 2.0 / shaderUniforms.canvasSize * perspectiveRatio * projDistance;
    }

    output.position.xy += vec2f(myTextDx, -myTextDy) * 2.0 / shaderUniforms.canvasSize * projDistance;

    if (shaderUniforms.textPitchFilter > 0.0) {
        if (shaderUniforms.textPitchFilter == 1.0 && isPitchWithMap == 0.0 || shaderUniforms.textPitchFilter == 2.0 && isPitchWithMap == 1.0) {
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
    output.vOpacity = input.aOpacity / 255.0;
#else
    output.vOpacity = 1.0;
#endif
#ifdef HAS_OPACITY
    output.vOpacity *= input.aColorOpacity / 255.0;
#endif

#ifdef HAS_TEXT_FILL
    output.vTextFill = input.aTextFill / 255.0;
#endif

#ifdef HAS_TEXT_HALO_FILL
    output.vTextHaloFill = input.aTextHaloFill / 255.0;
#endif

#if defined(HAS_TEXT_HALO_RADIUS) || defined(HAS_TEXT_HALO_OPACITY)
    output.vTextHalo = input.aTextHalo;
#endif
#if HAS_HIGHLIGHT_COLOR || HAS_HIGHLIGHT_OPACITY
    highlight_setVarying(input, output);
#endif
#else
#ifdef ENABLE_COLLISION
    var visible = input.aOpacity == 255.0;
#else
    var visible = true;
#endif
    fbo_picking_setData(output, output.position.w, visible);
#endif

    return output;
}
