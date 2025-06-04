#define SHADER_NAME TEXT_VERT
#define RAD 0.0174532925

struct TextVertexUniforms {
    textSize: f32,
    textDx: f32,
    textDy: f32,
    textPitchWithMap: f32,
    textRotateWithMap: f32,
    textRotation: f32,
    flipY: f32,
    cameraToCenterDistance: f32,
    textPerspectiveRatio: f32,
    glyphTexSize: vec2f,
    canvasSize: vec2f,
    glyphSize: f32,
    mapPitch: f32,
    mapRotation: f32,
    zoomScale: f32,
    tileRatio: f32,
    layerScale: f32,
    isRenderingTerrain: f32
};

@group(0) @binding(0) var<uniform> uniforms: TextVertexUniforms;
@group(0) @binding(1) var positionMatrix: mat4x4f;
@group(0) @binding(2) var projViewModelMatrix: mat4x4f;

struct VertexInput {
#ifdef HAS_ALTITUDE
    @location($i) aPosition: vec2f,
    @location($i) aAltitude: f32,
#else
    @location($i) aPosition: vec3f,
#endif
    @location($i) aShape: vec4f,
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
#ifdef HAS_TEXT_ROTATION_ALIGN
    @location($i) aRotationAlign: f32,
#endif
#ifdef HAS_TEXT_ROTATION
    @location($i) aRotation: f32,
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
#ifndef PICKING_MODE
#include <highlight_vert>
#else
#include <fbo_picking_vert>
#endif

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    var position = unpackVTPosition();

#ifdef HAS_TEXT_SIZE
    var myTextSize = input.aTextSize * uniforms.layerScale;
#else
    var myTextSize = uniforms.textSize * uniforms.layerScale;
#endif

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

#ifdef HAS_PITCH_ALIGN
    var isPitchWithMap = input.aPitchAlign;
#else
    var isPitchWithMap = uniforms.textPitchWithMap;
#endif

#ifdef HAS_TEXT_ROTATION_ALIGN
    var isRotateWithMap = input.aRotationAlign;
#else
    var isRotateWithMap = uniforms.textRotateWithMap;
#endif

    output.position = uniforms.projViewModelMatrix * uniforms.positionMatrix * vec4f(position, 1.0);
    var projDistance = output.position.w;

    var perspectiveRatio: f32;
    if (uniforms.isRenderingTerrain == 1.0 && isPitchWithMap == 1.0) {
        perspectiveRatio = 1.0;
    } else {
        var distanceRatio = (1.0 - uniforms.cameraToCenterDistance / projDistance) * uniforms.textPerspectiveRatio;
        perspectiveRatio = clamp(
            0.5 + 0.5 * (1.0 - distanceRatio),
            0.0,
            4.0);
    }

#ifdef HAS_TEXT_ROTATION
    var rotation = -input.aRotation / 9362.0 - uniforms.mapRotation * isRotateWithMap;
#else
    var rotation = -uniforms.textRotation - uniforms.mapRotation * isRotateWithMap;
#endif

    if (isPitchWithMap == 1.0) {
#ifdef REVERSE_MAP_ROTATION_ON_PITCH
        rotation += uniforms.mapRotation;
#else
        rotation -= uniforms.mapRotation;
#endif
    }

    var angleSin = sin(rotation);
    var angleCos = cos(rotation);
    var shapeMatrix = mat2x2f(angleCos, -1.0 * angleSin, angleSin, angleCos);

    var shape = input.aShape.xy / 10.0;
    if (isPitchWithMap == 1.0 && uniforms.flipY == 0.0) {
        shape = shape * vec2f(1.0, -1.0);
    }

    var texCoord = input.aShape.zw;
    shape = shapeMatrix * (shape / uniforms.glyphSize * myTextSize);

    var cameraScale: f32;
    if (uniforms.isRenderingTerrain == 1.0) {
        cameraScale = 1.0;
    } else {
        cameraScale = projDistance / uniforms.cameraToCenterDistance;
    }

    if (isPitchWithMap == 0.0) {
        var offset = shape * 2.0 / uniforms.canvasSize;
        output.position.xy += offset * perspectiveRatio * projDistance;
    } else {
        var offsetScale: f32;
        if (uniforms.isRenderingTerrain == 1.0) {
            offsetScale = uniforms.tileRatio / uniforms.zoomScale;
        } else {
            offsetScale = uniforms.tileRatio / uniforms.zoomScale * cameraScale * perspectiveRatio;
        }
        var offset = shape;
        output.position = uniforms.projViewModelMatrix * uniforms.positionMatrix * vec4f(position + vec3f(offset, 0.0) * offsetScale, 1.0);
    }

    output.position.xy += vec2f(myTextDx, -myTextDy) * 2.0 / uniforms.canvasSize * projDistance;

#ifndef PICKING_MODE
    if (isPitchWithMap == 0.0) {
        output.vGammaScale = mix(1.0, cameraScale, uniforms.textPerspectiveRatio);
    } else {
        output.vGammaScale = cameraScale + uniforms.mapPitch / 4.0;
    }
    output.vTexCoord = texCoord / uniforms.glyphTexSize;
    output.vGammaScale = clamp(output.vGammaScale, 0.0, 1.0);

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
