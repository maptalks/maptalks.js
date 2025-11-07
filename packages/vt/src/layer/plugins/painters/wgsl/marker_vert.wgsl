#define RAD 0.0174532925

struct MarkerUniforms {
    positionMatrix: mat4x4f,
    projViewModelMatrix: mat4x4f,
    textSize: f32,
    markerDx: f32,
    markerDy: f32,
    textDx: f32,
    textDy: f32,
    markerWidth: f32,
    markerHeight: f32,
    markerPitchWithMap: f32,
    textPitchWithMap: f32,
    markerRotateWithMap: f32,
    textRotateWithMap: f32,
    markerRotation: f32,
    textRotation: f32,
    flipY: f32,
    textPerspectiveRatio: f32,
    markerPerspectiveRatio: f32,

    iconTexSize: vec2f,
    glyphTexSize: vec2f,

    tileRatio: f32,
    zoomScale: f32
}

struct ShaderUniforms {
    cameraToCenterDistance: f32,
    glyphSize: f32,
    iconSize: vec2f,
    canvasSize: vec2f,
    layerScale: f32,
    isRenderingTerrain: f32,
    mapPitch: f32,
    mapRotation: f32
}

@group(0) @binding($b) var<uniform> uniforms: MarkerUniforms;
@group(0) @binding($b) var<uniform> shaderUniforms: ShaderUniforms;

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
    @location($i) aColorOpacity: vec2u,
#endif
#ifdef HAS_TEXT_SIZE
    @location($i) aTextSize: u32,
#endif
#if HAS_TEXT_DX || HAS_TEXT_DY || HAS_MARKER_DX || HAS_MARKER_DY
    @location($i) aDxDy: vec4i,
#endif
#ifdef HAS_MARKER_WIDTH
    @location($i) aMarkerWidth: u32,
#endif
#ifdef HAS_MARKER_HEIGHT
    @location($i) aMarkerHeight: u32,
#endif
#if HAS_MARKER_PITCH_ALIGN || HAS_TEXT_PITCH_ALIGN
    @location($i) aPitchAlign: vec2u,
#endif
#if HAS_MARKER_ROTATION_ALIGN || HAS_TEXT_ROTATION_ALIGN
    @location($i) aRotationAlign: vec2u,
#endif
#if HAS_MARKER_ROTATION || HAS_TEXT_ROTATION
    @location($i) aRotation: vec2u,
#endif
#ifdef HAS_PAD_OFFSET
    @location($i) aPadOffset: vec2f,
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
    @location($o) vOpacity: f32,
    @location($o) vGammaScale: f32,
    @location($o) vTextSize: f32,
    @location($o) vHalo: f32,
    @location($o) vIsText: f32,
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
fn main(vertexInput: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    var position = unpackVTPosition(vertexInput);

#ifdef HAS_TEXT_SIZE
    var myTextSize = f32(vertexInput.aTextSize) * shaderUniforms.layerScale;
#else
    var myTextSize = uniforms.textSize * shaderUniforms.layerScale;
#endif

#ifdef HAS_TEXT_DX
    var myTextDx = f32(vertexInput.aDxDy.z);
#else
    var myTextDx = uniforms.textDx;
#endif

#ifdef HAS_TEXT_DY
    var myTextDy = f32(vertexInput.aDxDy.w);
#else
    var myTextDy = uniforms.textDy;
#endif

#ifdef HAS_MARKER_WIDTH
    var myMarkerWidth = f32(vertexInput.aMarkerWidth);
#else
    var myMarkerWidth = uniforms.markerWidth;
#endif

#ifdef HAS_MARKER_HEIGHT
    var myMarkerHeight = f32(vertexInput.aMarkerHeight);
#else
    var myMarkerHeight = uniforms.markerHeight;
#endif

#ifdef HAS_MARKER_DX
    var myMarkerDx = f32(vertexInput.aDxDy.x);
#else
    var myMarkerDx = uniforms.markerDx;
#endif

#ifdef HAS_MARKER_DY
    var myMarkerDy = f32(vertexInput.aDxDy.y);
#else
    var myMarkerDy = uniforms.markerDy;
#endif

    var isText = f32(vertexInput.aShape.z) % 2.0;
    var isPitchWithMap: f32;

    if (isText > 0.5) {
#ifdef HAS_TEXT_PITCH_ALIGN
        isPitchWithMap = f32(vertexInput.aPitchAlign.y);
#else
        isPitchWithMap = uniforms.textPitchWithMap;
#endif
    } else {
#ifdef HAS_MARKER_PITCH_ALIGN
        isPitchWithMap = f32(vertexInput.aPitchAlign.x);
#else
        isPitchWithMap = uniforms.markerPitchWithMap;
#endif
    }

    var isRotateWithMap: f32;
    if (isText > 0.5) {
#ifdef HAS_TEXT_ROTATION_ALIGN
        isRotateWithMap = f32(vertexInput.aRotationAlign.y);
#else
        isRotateWithMap = uniforms.textRotateWithMap;
#endif
    } else {
#ifdef HAS_MARKER_ROTATION_ALIGN
        isRotateWithMap = f32(vertexInput.aRotationAlign.x);
#else
        isRotateWithMap = uniforms.markerRotateWithMap;
#endif
    }

    let positionMatrix = uniforms.positionMatrix;
    let projViewModelMatrix = uniforms.projViewModelMatrix;

    output.position = projViewModelMatrix * positionMatrix * vec4f(position, 1.0);
    var projDistance = output.position.w;


    var perspectiveRatio: f32;
    if (shaderUniforms.isRenderingTerrain == 1.0 && isPitchWithMap == 1.0) {
        perspectiveRatio = 1.0;
    } else {
        var distanceRatio = (1.0 - shaderUniforms.cameraToCenterDistance / projDistance) * uniforms.markerPerspectiveRatio;
        perspectiveRatio = clamp(
            0.5 + 0.5 * (1.0 - distanceRatio),
            0.0,
            4.0);
    }

    var rotation: f32;
    let mapRotation = shaderUniforms.mapRotation;
    if (isText > 0.5) {
#ifdef HAS_TEXT_ROTATION
        rotation = -f32(vertexInput.aRotation.y) / 9362.0 - mapRotation * isRotateWithMap;
#else
        rotation = -uniforms.textRotation - mapRotation * isRotateWithMap;
#endif
    } else {
#ifdef HAS_MARKER_ROTATION
        rotation = -f32(vertexInput.aRotation.x) / 9362.0 - mapRotation * isRotateWithMap;
#else
        rotation = -uniforms.markerRotation - mapRotation * isRotateWithMap;
#endif
    }

    if (isPitchWithMap == 1.0) {
#ifdef REVERSE_MAP_ROTATION_ON_PITCH
        rotation += mapRotation;
#else
        if (isText > 0.5) {
            rotation -= mapRotation;
        } else {
            rotation += mapRotation;
        }
#endif
    }

    var angleSin = sin(rotation);
    var angleCos = cos(rotation);
    var shapeMatrix = mat2x2f(angleCos, -1.0 * angleSin, angleSin, angleCos);

    var shape = vec2f(vertexInput.aShape.xy) / 10.0;
    if (isPitchWithMap == 1.0 && uniforms.flipY == 0.0) {
        shape *= vec2f(1.0, -1.0);
    }


    if (isText > 0.5) {
        shape = shape / shaderUniforms.glyphSize * myTextSize;
    } else {
#ifdef HAS_PAD_OFFSET
        var padOffsetX = vertexInput.aPadOffset.x - 1.0;
        var padOffsetY = vertexInput.aPadOffset.y;
#else
        var padOffsetX = 0.0;
        var padOffsetY = 0.0;
#endif
        shape = (shape / shaderUniforms.iconSize * vec2f(myMarkerWidth, myMarkerHeight) + vec2f(padOffsetX, padOffsetY)) * shaderUniforms.layerScale;
    }

    shape = shapeMatrix * shape;

    var cameraScale: f32;
    if (shaderUniforms.isRenderingTerrain == 1.0) {
        cameraScale = 1.0;
    } else {
        cameraScale = projDistance / shaderUniforms.cameraToCenterDistance;
    }

    let canvasSize = shaderUniforms.canvasSize;
    if (isPitchWithMap == 0.0) {
        var offset = shape * 2.0 / canvasSize;
        output.position.x += offset.x * perspectiveRatio * projDistance;
        output.position.y += offset.y * perspectiveRatio * projDistance;
    } else if (isText > 0.5) {
        var offsetScale: f32;
        if (shaderUniforms.isRenderingTerrain == 1.0) {
            offsetScale = uniforms.tileRatio / uniforms.zoomScale;
        } else {
            offsetScale = uniforms.tileRatio / uniforms.zoomScale * cameraScale * perspectiveRatio;
        }
        var offset = shape;
        output.position = projViewModelMatrix * positionMatrix * vec4f(position + vec3f(offset, 0.0) * offsetScale, 1.0);
    } else {
        var offset = shape;
        output.position = projViewModelMatrix * positionMatrix * vec4f(position + vec3f(offset, 0.0) * uniforms.tileRatio / uniforms.zoomScale * cameraScale * perspectiveRatio, 1.0);
    }

    if (isText > 0.5) {
        output.position.x += myTextDx * 2.0 / canvasSize.x * projDistance;
        output.position.y += -myTextDy * 2.0 / canvasSize.y * projDistance;
    } else {
        output.position.x += myMarkerDx * 2.0 / canvasSize.x * projDistance;
        output.position.y += -myMarkerDy * 2.0 / canvasSize.y * projDistance;
    }

#ifndef PICKING_MODE
    output.vIsText = isText;
    if (isPitchWithMap == 0.0) {
        output.vGammaScale = mix(1.0, cameraScale, uniforms.textPerspectiveRatio);
    } else {
        output.vGammaScale = cameraScale + shaderUniforms.mapPitch / 4.0;
    }
    output.vGammaScale = clamp(output.vGammaScale, 0.0, 1.0);

    var texCoord = floor(vec2f(vertexInput.aShape.zw) / 2.0);
    if (isText > 0.5) {
        output.vTexCoord = texCoord / uniforms.glyphTexSize;
    } else {
        output.vTexCoord = texCoord / uniforms.iconTexSize;
    }

    output.vHalo = f32(vertexInput.aShape.w) % 2.0;
    output.vTextSize = myTextSize;
#ifdef ENABLE_COLLISION
    output.vOpacity = vertexInput.aOpacity / 255.0;
#else
    output.vOpacity = 1.0;
#endif

#ifdef HAS_OPACITY
    if (isText > 0.5) {
        output.vOpacity *= f32(vertexInput.aColorOpacity.y) / 255.0;
    } else {
        output.vOpacity *= f32(vertexInput.aColorOpacity.x) / 255.0;
    }
#endif

#ifdef HAS_TEXT_FILL
    output.vTextFill = vec4f(vertexInput.aTextFill) / 255.0;
#endif

#ifdef HAS_TEXT_HALO_FILL
    output.vTextHaloFill =  vec4f(vertexInput.aTextHaloFill) / 255.0;
#endif

#if HAS_TEXT_HALO_RADIUS || HAS_TEXT_HALO_OPACITY
    output.vTextHalo = vec2f(vertexInput.aTextHalo);
#endif

#if HAS_HIGHLIGHT_COLOR || HAS_HIGHLIGHT_OPACITY
    highlight_setVarying(vertexInput, output);
#endif
#else
#ifdef ENABLE_COLLISION
    var visible = f32(vertexInput.aOpacity) == 255.0;
#else
    var visible = true;
#endif

    fbo_picking_setData(vertexInput, &output, output.position.w, visible);
#endif

    return output;
}
