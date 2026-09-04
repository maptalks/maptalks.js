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

#ifdef HAS_MARKERS_STORAGE
// marker/text fn-type 动态属性按 feature 打包的只读 storage 记录。
// 记录布局必须与 vt 端 marker_fn_storage.js（FN_STRIDE/FN_OFFSET）保持一致（每条 10 个 u32）：
// word0 markerWidth(u16)|markerHeight(u16), word1 markerOpacity(u8)|textOpacity(u8),
// word2 dxdy(i8x4), word3 pitchAlign(u8x2), word4 rotationAlign(u8x2),
// word5 markerRotation(u16)|textRotation(u16), word6 textSize(u16),
// word7 textHaloRadius(u8)|textHaloOpacity(u8), word8 textFill(rgba), word9 textHaloFill(rgba)
struct MarkerFnRecords {
    records: array<u32>,
};
@group(0) @binding($b) var<storage, read> markerFnRecords: MarkerFnRecords;
#endif

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
    #ifndef HAS_MARKERS_STORAGE
        @location($i) aColorOpacity: vec2u,
    #endif
#endif
#ifdef HAS_TEXT_SIZE
    #ifndef HAS_MARKERS_STORAGE
        @location($i) aTextSize: u32,
    #endif
#endif
#if HAS_TEXT_DX || HAS_TEXT_DY || HAS_MARKER_DX || HAS_MARKER_DY
    #ifndef HAS_MARKERS_STORAGE
        @location($i) aDxDy: vec4i,
    #endif
#endif
#ifdef HAS_MARKER_WIDTH
    #ifndef HAS_MARKERS_STORAGE
        @location($i) aMarkerWidth: u32,
    #endif
#endif
#ifdef HAS_MARKER_HEIGHT
    #ifndef HAS_MARKERS_STORAGE
        @location($i) aMarkerHeight: u32,
    #endif
#endif
#if HAS_MARKER_PITCH_ALIGN || HAS_TEXT_PITCH_ALIGN
    #ifndef HAS_MARKERS_STORAGE
        @location($i) aPitchAlign: vec2u,
    #endif
#endif
#if HAS_MARKER_ROTATION_ALIGN || HAS_TEXT_ROTATION_ALIGN
    #ifndef HAS_MARKERS_STORAGE
        @location($i) aRotationAlign: vec2u,
    #endif
#endif
#if HAS_MARKER_ROTATION || HAS_TEXT_ROTATION
    #ifndef HAS_MARKERS_STORAGE
        @location($i) aRotation: vec2u,
    #endif
#endif
#ifdef HAS_PAD_OFFSET
    @location($i) aPadOffset: vec2i,
#endif
#ifdef HAS_TEXT_FILL
    #ifndef HAS_MARKERS_STORAGE
        @location($i) aTextFill: vec4u,
    #endif
#endif
#ifdef HAS_TEXT_HALO_FILL
    #ifndef HAS_MARKERS_STORAGE
        @location($i) aTextHaloFill: vec4u,
    #endif
#endif
#if HAS_TEXT_HALO_RADIUS || HAS_TEXT_HALO_OPACITY
    #ifndef HAS_MARKERS_STORAGE
        @location($i) aTextHalo: vec2u,
    #endif
#endif
#ifndef PICKING_MODE
    #ifdef HAS_MARKERS_STORAGE
        // storage 模式下 fn 动态属性已打包进只读 storage buffer（不占用顶点 buffer 名额），
        // 顶点只提供其所属 feature 的序号 aPickingId，作为 markerFnRecords 的下标。
        // PICKING_MODE 编译中该属性由 <fbo_picking_vert> include 注入，这里无需重复声明
        @location($i) aPickingId: f32,
    #endif
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

#ifdef HAS_MARKERS_STORAGE
    // 逐 feature 记录读取：同一 feature 的 marker/text fn-type 外观取值相同（packing 时逐 run 填充），
    // 因此打包成一条记录，顶点以 aPickingId（feature 序号）为下标读取，不再占用顶点 buffer 名额，
    // 避免外观 define 因 maxVertexBuffers 限制被裁剪。记录布局必须与 vt 端 marker_fn_storage.js
    // （FN_STRIDE/FIELD_DEFS）保持一致，每条固定 10 个 u32：
    // word0 markerWidth(u16)|markerHeight(u16), word1 markerOpacity(u8)|textOpacity(u8),
    // word2 dxdy(i8x4), word3 pitchAlign(u8x2), word4 rotationAlign(u8x2),
    // word5 markerRotation(u16)|textRotation(u16), word6 textSize(u16),
    // word7 textHaloRadius(u8)|textHaloOpacity(u8), word8 textFill(rgba), word9 textHaloFill(rgba)
    let recBase = u32(vertexInput.aPickingId) * 10u;
    let recWidthWord = markerFnRecords.records[recBase + 0u];
    let recMarkerWidth = recWidthWord & 0xffffu;
    let recMarkerHeight = recWidthWord >> 16u;
    let recOpacityWord = markerFnRecords.records[recBase + 1u];
    let recMarkerOpacity = recOpacityWord & 0xffu;
    let recTextOpacity = (recOpacityWord >> 8u) & 0xffu;
    // dx/dy 各占一个字节，用左移再算术右移做 int8 符号扩展还原（x/y/z/w 依次对应 markerDx/markerDy/textDx/textDy）
    let recDxDyWord = bitcast<i32>(markerFnRecords.records[recBase + 2u]);
    let recMarkerDx = (recDxDyWord << 24) >> 24;
    let recMarkerDy = (recDxDyWord << 16) >> 24;
    let recTextDx = (recDxDyWord << 8) >> 24;
    let recTextDy = recDxDyWord >> 24;
    let recPitchAlignWord = markerFnRecords.records[recBase + 3u];
    let recMarkerPitchAlign = recPitchAlignWord & 0xffu;
    let recTextPitchAlign = (recPitchAlignWord >> 8u) & 0xffu;
    let recRotationAlignWord = markerFnRecords.records[recBase + 4u];
    let recMarkerRotationAlign = recRotationAlignWord & 0xffu;
    let recTextRotationAlign = (recRotationAlignWord >> 8u) & 0xffu;
    let recRotationWord = markerFnRecords.records[recBase + 5u];
    let recMarkerRotation = recRotationWord & 0xffffu;
    let recTextRotation = recRotationWord >> 16u;
    let recTextSize = markerFnRecords.records[recBase + 6u] & 0xffffu;
    let recHaloWord = markerFnRecords.records[recBase + 7u];
    let recTextHaloRadius = recHaloWord & 0xffu;
    let recTextHaloOpacity = (recHaloWord >> 8u) & 0xffu;
    // 颜色按 bit24-31 r / bit16-23 g / bit8-15 b / bit0-7 a 还原成 vec4u
    let recTextFillWord = markerFnRecords.records[recBase + 8u];
    let recTextFill = vec4u((recTextFillWord >> 24u) & 0xffu, (recTextFillWord >> 16u) & 0xffu, (recTextFillWord >> 8u) & 0xffu, recTextFillWord & 0xffu);
    let recTextHaloFillWord = markerFnRecords.records[recBase + 9u];
    let recTextHaloFill = vec4u((recTextHaloFillWord >> 24u) & 0xffu, (recTextHaloFillWord >> 16u) & 0xffu, (recTextHaloFillWord >> 8u) & 0xffu, recTextHaloFillWord & 0xffu);
#endif

#ifdef HAS_TEXT_SIZE
    #ifdef HAS_MARKERS_STORAGE
        var myTextSize = f32(recTextSize) * shaderUniforms.layerScale;
    #else
        var myTextSize = f32(vertexInput.aTextSize) * shaderUniforms.layerScale;
    #endif
#else
    var myTextSize = uniforms.textSize * shaderUniforms.layerScale;
#endif

#ifdef HAS_TEXT_DX
    #ifdef HAS_MARKERS_STORAGE
        var myTextDx = f32(recTextDx);
    #else
        var myTextDx = f32(vertexInput.aDxDy.z);
    #endif
#else
    var myTextDx = uniforms.textDx;
#endif

#ifdef HAS_TEXT_DY
    #ifdef HAS_MARKERS_STORAGE
        var myTextDy = f32(recTextDy);
    #else
        var myTextDy = f32(vertexInput.aDxDy.w);
    #endif
#else
    var myTextDy = uniforms.textDy;
#endif

#ifdef HAS_MARKER_WIDTH
    #ifdef HAS_MARKERS_STORAGE
        var myMarkerWidth = f32(recMarkerWidth);
    #else
        var myMarkerWidth = f32(vertexInput.aMarkerWidth);
    #endif
#else
    var myMarkerWidth = uniforms.markerWidth;
#endif

#ifdef HAS_MARKER_HEIGHT
    #ifdef HAS_MARKERS_STORAGE
        var myMarkerHeight = f32(recMarkerHeight);
    #else
        var myMarkerHeight = f32(vertexInput.aMarkerHeight);
    #endif
#else
    var myMarkerHeight = uniforms.markerHeight;
#endif

#ifdef HAS_MARKER_DX
    #ifdef HAS_MARKERS_STORAGE
        var myMarkerDx = f32(recMarkerDx);
    #else
        var myMarkerDx = f32(vertexInput.aDxDy.x);
    #endif
#else
    var myMarkerDx = uniforms.markerDx;
#endif

#ifdef HAS_MARKER_DY
    #ifdef HAS_MARKERS_STORAGE
        var myMarkerDy = f32(recMarkerDy);
    #else
        var myMarkerDy = f32(vertexInput.aDxDy.y);
    #endif
#else
    var myMarkerDy = uniforms.markerDy;
#endif

    var isText = f32(vertexInput.aShape.z) % 2.0;
    var isPitchWithMap: f32;

    if (isText > 0.5) {
#ifdef HAS_TEXT_PITCH_ALIGN
        #ifdef HAS_MARKERS_STORAGE
            isPitchWithMap = f32(recTextPitchAlign);
        #else
            isPitchWithMap = f32(vertexInput.aPitchAlign.y);
        #endif
#else
        isPitchWithMap = uniforms.textPitchWithMap;
#endif
    } else {
#ifdef HAS_MARKER_PITCH_ALIGN
        #ifdef HAS_MARKERS_STORAGE
            isPitchWithMap = f32(recMarkerPitchAlign);
        #else
            isPitchWithMap = f32(vertexInput.aPitchAlign.x);
        #endif
#else
        isPitchWithMap = uniforms.markerPitchWithMap;
#endif
    }

    var isRotateWithMap: f32;
    if (isText > 0.5) {
#ifdef HAS_TEXT_ROTATION_ALIGN
        #ifdef HAS_MARKERS_STORAGE
            isRotateWithMap = f32(recTextRotationAlign);
        #else
            isRotateWithMap = f32(vertexInput.aRotationAlign.y);
        #endif
#else
        isRotateWithMap = uniforms.textRotateWithMap;
#endif
    } else {
#ifdef HAS_MARKER_ROTATION_ALIGN
        #ifdef HAS_MARKERS_STORAGE
            isRotateWithMap = f32(recMarkerRotationAlign);
        #else
            isRotateWithMap = f32(vertexInput.aRotationAlign.x);
        #endif
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
        #ifdef HAS_MARKERS_STORAGE
            rotation = -f32(recTextRotation) / 9362.0 - mapRotation * isRotateWithMap;
        #else
            rotation = -f32(vertexInput.aRotation.y) / 9362.0 - mapRotation * isRotateWithMap;
        #endif
#else
        rotation = -uniforms.textRotation - mapRotation * isRotateWithMap;
#endif
    } else {
#ifdef HAS_MARKER_ROTATION
        #ifdef HAS_MARKERS_STORAGE
            rotation = -f32(recMarkerRotation) / 9362.0 - mapRotation * isRotateWithMap;
        #else
            rotation = -f32(vertexInput.aRotation.x) / 9362.0 - mapRotation * isRotateWithMap;
        #endif
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
        var padOffsetX = f32(vertexInput.aPadOffset.x) - 1.0;
        var padOffsetY = f32(vertexInput.aPadOffset.y);
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
    output.vOpacity = f32(vertexInput.aOpacity) / 255.0;
#else
    output.vOpacity = 1.0;
#endif

#ifdef HAS_OPACITY
    if (isText > 0.5) {
        #ifdef HAS_MARKERS_STORAGE
            output.vOpacity *= f32(recTextOpacity) / 255.0;
        #else
            output.vOpacity *= f32(vertexInput.aColorOpacity.y) / 255.0;
        #endif
    } else {
        #ifdef HAS_MARKERS_STORAGE
            output.vOpacity *= f32(recMarkerOpacity) / 255.0;
        #else
            output.vOpacity *= f32(vertexInput.aColorOpacity.x) / 255.0;
        #endif
    }
#endif

#ifdef HAS_TEXT_FILL
    #ifdef HAS_MARKERS_STORAGE
        output.vTextFill = vec4f(recTextFill) / 255.0;
    #else
        output.vTextFill = vec4f(vertexInput.aTextFill) / 255.0;
    #endif
#endif

#ifdef HAS_TEXT_HALO_FILL
    #ifdef HAS_MARKERS_STORAGE
        output.vTextHaloFill = vec4f(recTextHaloFill) / 255.0;
    #else
        output.vTextHaloFill = vec4f(vertexInput.aTextHaloFill) / 255.0;
    #endif
#endif

#if HAS_TEXT_HALO_RADIUS || HAS_TEXT_HALO_OPACITY
    #ifdef HAS_MARKERS_STORAGE
        output.vTextHalo = vec2f(f32(recTextHaloRadius), f32(recTextHaloOpacity));
    #else
        output.vTextHalo = vec2f(vertexInput.aTextHalo);
    #endif
#endif

#if HAS_HIGHLIGHT_COLOR || HAS_HIGHLIGHT_OPACITY
    highlight_setVarying(vertexInput, &output);
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
