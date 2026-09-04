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
#include <fbo_picking_vert>

@vertex
fn main(input: VertexInput) -> VertexOutput {
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

#ifdef HAS_TEXT_DX
    #ifdef HAS_MARKERS_STORAGE
        var myTextDx = f32(recTextDx);
    #else
        var myTextDx = f32(input.aTextDx);
    #endif
#else
    var myTextDx = uniforms.textDx;
#endif

#ifdef HAS_TEXT_DY
    #ifdef HAS_MARKERS_STORAGE
        var myTextDy = f32(recTextDy);
    #else
        var myTextDy = f32(input.aTextDy);
    #endif
#else
    var myTextDy = uniforms.textDy;
#endif

#ifdef HAS_TEXT_SIZE
    #ifdef HAS_MARKERS_STORAGE
        var myTextSize = f32(recTextSize) * shaderUniforms.layerScale;
    #else
        var myTextSize = f32(input.aTextSize) * shaderUniforms.layerScale;
    #endif
#else
    var myTextSize = uniforms.textSize * shaderUniforms.layerScale;
#endif

#ifdef HAS_PITCH_ALIGN
    #ifdef HAS_MARKERS_STORAGE
        var isPitchWithMap = f32(recTextPitchAlign);
    #else
        var isPitchWithMap = f32(input.aPitchAlign);
    #endif
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
    var offset = vec3f(input.aOffset) / 10.0;
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
