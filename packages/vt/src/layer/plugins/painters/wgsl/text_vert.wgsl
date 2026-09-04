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

#ifdef HAS_MARKERS_STORAGE
// 纯文字（TextPainter）的 fn-type 动态外观属性按 feature 打包的只读 storage 记录。
// 与 IconPainter 的 markerFnRecords 共用同一 10 字记录布局（marker_fn_storage.js 的 FN_STRIDE），
// 纯文字只有 text 槽位有值，marker 槽位保持 0：
// word0 markerWidth(u16)|markerHeight(u16), word1 markerOpacity(u8)|textOpacity(u8),
// word2 dxdy(i8x4, 后两位为 textDx/textDy), word3 pitchAlign(u8x2, 高位为 text),
// word4 rotationAlign(u8x2, 高位为 text), word5 rotation(u16x2, 高位为 text),
// word6 textSize(u16), word7 textHaloRadius(u8)|textHaloOpacity(u8),
// word8 textFill(rgba), word9 textHaloFill(rgba)
struct TextFnRecords {
    records: array<u32>,
};
@group(0) @binding($b) var<storage, read> markerFnRecords: TextFnRecords;
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
        @location($i) aColorOpacity: u32,
    #endif
#endif
#ifdef HAS_TEXT_SIZE
    #ifndef HAS_MARKERS_STORAGE
        @location($i) aTextSize: u32,
    #endif
#endif
#ifdef HAS_TEXT_DX
    #ifndef HAS_MARKERS_STORAGE
        @location($i) aTextDx: i32,
    #endif
#endif
#ifdef HAS_TEXT_DY
    #ifndef HAS_MARKERS_STORAGE
        @location($i) aTextDy: i32,
    #endif
#endif
#ifdef HAS_PITCH_ALIGN
    #ifndef HAS_MARKERS_STORAGE
        @location($i) aPitchAlign: u32,
    #endif
#endif
#ifdef HAS_TEXT_ROTATION_ALIGN
    #ifndef HAS_MARKERS_STORAGE
        @location($i) aRotationAlign: u32,
    #endif
#endif
#ifdef HAS_TEXT_ROTATION
    #ifndef HAS_MARKERS_STORAGE
        @location($i) aRotation: u32,
    #endif
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
#include <highlight_vert>

#ifdef PICKING_MODE
#include <fbo_picking_vert>
#endif


@vertex
fn main(input: VertexInput) -> VertexOutput {
    let isRenderingTerrain = textUniforms.isRenderingTerrain;
    let layerScale = textUniforms.layerScale;
    var output: VertexOutput;
    var position = unpackVTPosition(input);

#ifdef HAS_MARKERS_STORAGE
    // 逐 feature 记录读取：同一 feature（同一 label/文字）的 text fn-type 外观取值相同（packing 时逐 run 填充），
    // 因此打包成一条记录，顶点以 aPickingId（feature 序号）为下标读取，不再占用顶点 buffer 名额。
    // 记录布局必须与 vt 端 marker_fn_storage.js（FN_STRIDE/FIELD_DEFS）保持一致，每条固定 10 个 u32，
    // 纯文字只使用 text 槽位（word1 高 u8、word2 后两字节、word3/4/5 高位、word6-9），marker 槽位为 0：
    // word0 markerWidth(u16)|markerHeight(u16), word1 markerOpacity(u8)|textOpacity(u8),
    // word2 dxdy(i8x4), word3 pitchAlign(u8x2), word4 rotationAlign(u8x2),
    // word5 rotation(u16x2), word6 textSize(u16), word7 haloRadius(u8)|haloOpacity(u8),
    // word8 textFill(rgba), word9 textHaloFill(rgba)
    let recBase = u32(input.aPickingId) * 10u;
    let recOpacityWord = markerFnRecords.records[recBase + 1u];
    let recTextOpacity = (recOpacityWord >> 8u) & 0xffu;
    // dx/dy 各占一个字节，用左移再算术右移做 int8 符号扩展还原（x/y/z/w 依次对应 markerDx/markerDy/textDx/textDy）
    let recDxDyWord = bitcast<i32>(markerFnRecords.records[recBase + 2u]);
    let recTextDx = (recDxDyWord << 8) >> 24;
    let recTextDy = recDxDyWord >> 24;
    let recPitchAlignWord = markerFnRecords.records[recBase + 3u];
    let recTextPitchAlign = (recPitchAlignWord >> 8u) & 0xffu;
    let recRotationAlignWord = markerFnRecords.records[recBase + 4u];
    let recTextRotationAlign = (recRotationAlignWord >> 8u) & 0xffu;
    let recRotationWord = markerFnRecords.records[recBase + 5u];
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
        var myTextSize = f32(recTextSize) * layerScale;
    #else
        var myTextSize = input.aTextSize * layerScale;
    #endif
#else
    var myTextSize = uniforms.textSize * layerScale;
#endif

#ifdef HAS_TEXT_DX
    #ifdef HAS_MARKERS_STORAGE
        var myTextDx = f32(recTextDx);
    #else
        var myTextDx = input.aTextDx;
    #endif
#else
    var myTextDx = uniforms.textDx;
#endif

#ifdef HAS_TEXT_DY
    #ifdef HAS_MARKERS_STORAGE
        var myTextDy = f32(recTextDy);
    #else
        var myTextDy = input.aTextDy;
    #endif
#else
    var myTextDy = uniforms.textDy;
#endif

#ifdef HAS_PITCH_ALIGN
    #ifdef HAS_MARKERS_STORAGE
        var isPitchWithMap = f32(recTextPitchAlign);
    #else
        var isPitchWithMap = input.aPitchAlign;
    #endif
#else
    var isPitchWithMap = uniforms.textPitchWithMap;
#endif

#ifdef HAS_TEXT_ROTATION_ALIGN
    #ifdef HAS_MARKERS_STORAGE
        var isRotateWithMap = f32(recTextRotationAlign);
    #else
        var isRotateWithMap = input.aRotationAlign;
    #endif
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
    #ifdef HAS_MARKERS_STORAGE
        var rotation = -f32(recTextRotation) / 9362.0 - mapRotation * isRotateWithMap;
    #else
        var rotation = -input.aRotation / 9362.0 - mapRotation * isRotateWithMap;
    #endif
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
    #ifdef HAS_MARKERS_STORAGE
        output.vOpacity *= f32(recTextOpacity) / 255.0;
    #else
        output.vOpacity *= f32(input.aColorOpacity) / 255.0;
    #endif
#endif

#ifdef HAS_TEXT_FILL
    #ifdef HAS_MARKERS_STORAGE
        output.vTextFill = vec4f(recTextFill) / 255.0;
    #else
        output.vTextFill = vec4f(input.aTextFill) / 255.0;
    #endif
#endif

#ifdef HAS_TEXT_HALO_FILL
    #ifdef HAS_MARKERS_STORAGE
        output.vTextHaloFill = vec4f(recTextHaloFill) / 255.0;
    #else
        output.vTextHaloFill = vec4f(input.aTextHaloFill) / 255.0;
    #endif
#endif

#if HAS_TEXT_HALO_RADIUS || HAS_TEXT_HALO_OPACITY
    #ifdef HAS_MARKERS_STORAGE
        output.vTextHalo = vec2f(f32(recTextHaloRadius), f32(recTextHaloOpacity));
    #else
        output.vTextHalo = vec2f(input.aTextHalo);
    #endif
#endif
#if HAS_HIGHLIGHT_COLOR || HAS_HIGHLIGHT_OPACITY
    highlight_setVarying(input, &output);
#endif
#else
#ifdef ENABLE_COLLISION
    var visible = f32(input.aOpacity) == 255.0;
#else
    var visible = true;
#endif
    fbo_picking_setData(input, &output, output.position.w, visible);
#endif

    return output;
}
