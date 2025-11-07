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
    textPerspectiveRatio: f32,
    glyphTexSize: vec2f,
    zoomScale: f32,
    tileRatio: f32,
    positionMatrix: mat4x4f,
    projViewModelMatrix: mat4x4f
};

struct TextUniforms {
    cameraToCenterDistance: f32,

    canvasSize: vec2f,
    glyphSize: f32,
    mapPitch: f32,
    mapRotation: f32,
    layerScale: f32,
    isRenderingTerrain: f32
};

@group(0) @binding($b) var<uniform> uniforms: TextVertexUniforms;
@group(0) @binding($b) var<uniform> textUniforms: TextUniforms;

struct VertexInput {
#ifdef HAS_ALTITUDE
    @location($i) aPosition: POSITION_TYPE_2,
    @location($i) aAltitude: f32,
#else
    @location($i) aPosition: POSITION_TYPE_3,
#endif
    @location($i) aShape: vec4i,
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
#ifdef HAS_TEXT_ROTATION_ALIGN
    @location($i) aRotationAlign: u32,
#endif
#ifdef HAS_TEXT_ROTATION
    @location($i) aRotation: u32,
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
#ifndef PICKING_MODE
#include <highlight_vert>
#else
#include <fbo_picking_vert>
#endif

@vertex
fn main(input: VertexInput) -> VertexOutput {
    let isRenderingTerrain = textUniforms.isRenderingTerrain;
    let layerScale = textUniforms.layerScale;
    var output: VertexOutput;
    var position = unpackVTPosition(input);

#ifdef HAS_TEXT_SIZE
    var myTextSize = input.aTextSize * layerScale;
#else
    var myTextSize = uniforms.textSize * layerScale;
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
    if (isRenderingTerrain == 1.0 && isPitchWithMap == 1.0) {
        perspectiveRatio = 1.0;
    } else {
        var distanceRatio = (1.0 - textUniforms.cameraToCenterDistance / projDistance) * uniforms.textPerspectiveRatio;
        perspectiveRatio = clamp(
            0.5 + 0.5 * (1.0 - distanceRatio),
            0.0,
            4.0);
    }
    let mapRotation = textUniforms.mapRotation;
#ifdef HAS_TEXT_ROTATION
    var rotation = -input.aRotation / 9362.0 - mapRotation * isRotateWithMap;
#else
    var rotation = -uniforms.textRotation - mapRotation * isRotateWithMap;
#endif

    if (isPitchWithMap == 1.0) {
#ifdef REVERSE_MAP_ROTATION_ON_PITCH
        rotation += mapRotation;
#else
        rotation -= mapRotation;
#endif
    }

    var angleSin = sin(rotation);
    var angleCos = cos(rotation);
    var shapeMatrix = mat2x2f(angleCos, -1.0 * angleSin, angleSin, angleCos);

    var shape = vec2f(input.aShape.xy) / 10.0;
    if (isPitchWithMap == 1.0 && uniforms.flipY == 0.0) {
        shape = shape * vec2f(1.0, -1.0);
    }

    var texCoord = vec2f(input.aShape.zw);
    shape = shapeMatrix * (shape / textUniforms.glyphSize * myTextSize);


    let tileRatio = uniforms.tileRatio;
    let zoomScale = uniforms.zoomScale;
    var cameraScale: f32;
    if (isRenderingTerrain == 1.0) {
        cameraScale = 1.0;
    } else {
        cameraScale = projDistance / textUniforms.cameraToCenterDistance;
    }
    let canvasSize = textUniforms.canvasSize;
    if (isPitchWithMap == 0.0) {
        var offset = shape * 2.0 / canvasSize;
        // output.position.xy += offset * perspectiveRatio * projDistance;
        output.position = vec4(output.position.xy + offset * perspectiveRatio * projDistance, output.position.zw);
    } else {
        var offsetScale: f32;
        if (isRenderingTerrain == 1.0) {
            offsetScale = tileRatio / zoomScale;
        } else {
            offsetScale = tileRatio / zoomScale * cameraScale * perspectiveRatio;
        }
        var offset = shape;
        output.position = uniforms.projViewModelMatrix * uniforms.positionMatrix * vec4f(position + vec3f(offset, 0.0) * offsetScale, 1.0);
    }

    let dxdy = vec2f(myTextDx, -myTextDy) * 2.0 / canvasSize * projDistance;
    output.position = vec4(output.position.xy + dxdy, output.position.zw);

#ifndef PICKING_MODE
    if (isPitchWithMap == 0.0) {
        output.vGammaScale = mix(1.0, cameraScale, uniforms.textPerspectiveRatio);
    } else {
        output.vGammaScale = cameraScale + textUniforms.mapPitch / 4.0;
    }
    output.vTexCoord = texCoord / uniforms.glyphTexSize;
    output.vGammaScale = clamp(output.vGammaScale, 0.0, 1.0);

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
