import { isNil } from '../../Util';
import { isFunctionDefinition } from '@maptalks/function-type';
import Color from 'color';

/**
 * LinePainter / LineGradientPainter 的逐 feature storage records 工具。
 *
 * WebGPU 存在 maxVertexBuffers（默认 8）限制：line 的 fn-type 动态属性（aColor/aLineWidth/aOpacity/
 * aLineOffset/aLineDxDy/aLinePattern/aLineStrokeWidth/aStrokeColor）各自占用一个顶点 buffer 名额，
 * 符号属性较多时 limitLineDefinesByDevice 会把这些外观 define 裁剪掉，导致线条样式丢失。
 *
 * 解决思路：这些 fn-type 属性的取值对"同一 feature 的所有连续顶点"是相同的（packing 时逐 run 填充），
 * 因此可以按 feature 压成一条记录，存到只读 storage buffer 中，渲染时以 aPickingId（即 feature 序号）为下标
 * 读取，不再占用顶点 buffer 名额。WebGL/GLSL 渲染路径保持不变（仍使用逐顶点 attribute）。
 *
 * WebGPU 下该模式对"纯常量"线条同样启用：常量外观值（lineColor/lineWidth/lineOpacity/lineStrokeWidth/
 * lineStrokeColor/lineOffset/lineDxDy）与 fn 属性一样逐 feature 打包进 records。这样渲染时 8 个外观字段
 * 一律从 records 读取，不再回退到 per-mesh 动态 uniform（WebGPU 动态 uniform 上传链路对部分顶点阶段字段
 * 不可靠，见 lineStrokeWidth 在 GPU 下读到 0 的问题），并且与 fn 模式共用同一套 shader 读取路径。
 *
 * 记录布局必须与 line_vert.wgsl 中 lineFnRecords 的常量保持一致（见文件顶部的注释）：
 * 每个 feature 一条记录，固定 8 个 u32（FN_STRIDE）：
 *
 *   word0  color       rgba 各占一个字节（bit24-31: r, bit16-23: g, bit8-15: b, bit0-7: a）
 *   word1  width       u8（lineWidth*2，与 aLineWidth 一致）
 *   word2  opacity     u8（0-255）
 *   word3  strokeWidth u8（lineStrokeWidth*2）
 *   word4  strokeColor rgba 同上
 *   word5  lineOffset  int16 存于 word 低位（直接存 int32 位模式）
 *   word6  dxdy        bit0-7: dx(int8), bit8-15: dy(int8)
 *   word7  pattern     bit0-7: patternAnimSpeed(int8), bit8-15: patternGap(int8)
 */
// fn_type_util 中保存的 CPU 副本属性名前缀（与 fn_type_util.PREFIX 保持一致），
// 这里不复用其导出，是为了避免 fn_type_util <-> line_fn_storage 的循环依赖
const FN_TYPE_PREFIX = '_fn_type_';

// 存储数据 / WGSL var 名，bind group 通过该名字从 geometry 取 storage buffer
export const LINE_FN_STORAGE_NAME = 'lineFnRecords';

export const FN_STRIDE = 8;
export const FN_OFFSET = {
    COLOR: 0,
    WIDTH: 1,
    OPACITY: 2,
    STROKE_WIDTH: 3,
    STROKE_COLOR: 4,
    LINE_OFFSET: 5,
    DX_DY: 6,
    PATTERN: 7
};

// 保存 CPU 侧 records 镜像的属性名
const RECORDS_PROP = '__fnStorageRecords';
const STORAGE_MODE_PROP = 'fntypeStorageMode';
// 保存"纯常量外观字段"打包进 records 所需的属性名：attributeName -> 取值数组（与 fn 逐顶点数组同单位）
const CONST_VALUES_PROP = '__fnConstValues';

// attrName 与记录中字段的映射。pack 表示该属性的取值如何压进一个 u32 word
const FIELD_DEFS = {
    'aColor': { offset: FN_OFFSET.COLOR, width: 4, pack: 'rgba' },
    'aLineWidth': { offset: FN_OFFSET.WIDTH, width: 1, pack: 'u8' },
    'aOpacity': { offset: FN_OFFSET.OPACITY, width: 1, pack: 'u8' },
    'aLineStrokeWidth': { offset: FN_OFFSET.STROKE_WIDTH, width: 1, pack: 'u8' },
    'aStrokeColor': { offset: FN_OFFSET.STROKE_COLOR, width: 4, pack: 'rgba' },
    'aLineOffset': { offset: FN_OFFSET.LINE_OFFSET, width: 1, pack: 'i16' },
    'aLineDxDy': { offset: FN_OFFSET.DX_DY, width: 2, pack: 'i8x2' },
    'aLinePattern': { offset: FN_OFFSET.PATTERN, width: 2, pack: 'i8x2' }
};

export function isLineFnStorageMode(geometry) {
    return !!(geometry && geometry.properties && geometry.properties[STORAGE_MODE_PROP]);
}

export function enableLineFnStorage(geometry) {
    if (geometry && geometry.properties) {
        geometry.properties[STORAGE_MODE_PROP] = true;
    }
}

/**
 * 判断该 geometry 是否值得启用 line fn storage 模式（WebGPU）：
 * 只要逐顶点数据中带有 aPickingId（feature 序号），就可以把每个 feature 的 8 个外观字段
 * 压成一条 records。纯常量外观的线条（无任何 fn 属性）也满足该条件。
 * 注意 geometry 尚在 generateBuffers 之前，aPickingId 仍是数组。
 */
export function canEnableLineFnStorage(geometry) {
    const aPickingId = geometry && (geometry.properties && geometry.properties.aPickingId || geometry.data && geometry.data.aPickingId);
    return !!(aPickingId && aPickingId.length);
}

/**
 * 保存"纯常量"外观字段的取值（attributeName -> 与 fn 逐顶点数组同单位的取值数组）。
 * 该几何中如果某字段不存在 fn 逐顶点数组，syncLineFnStorageRecords 就使用这里的值打包进 records。
 * @param {Geometry} geometry
 * @param {Object} constValues
 */
export function storeLineFnConstantValues(geometry, constValues) {
    if (geometry && geometry.properties) {
        geometry.properties[CONST_VALUES_PROP] = constValues || null;
    }
}

const RGBA_DEFAULTS = {
    'aColor': [1, 1, 1, 1],
    'aStrokeColor': [0, 0, 0, 0]
};
const SCALAR_DEFAULTS = {
    'aLineWidth': 2,
    'aOpacity': 1,
    'aLineStrokeWidth': 0,
    'aLineOffset': 0
};
// 标量字段中需要 x2 存进 u8 的（与 aLineWidth/aLineStrokeWidth 的 fn 数组语义一致）
const DOUBLE_FIELDS = {
    'aLineWidth': 1,
    'aLineStrokeWidth': 1
};
// attributeName -> 对应 symbol key
const FIELD_SYMBOL = {
    'aColor': 'lineColor',
    'aLineWidth': 'lineWidth',
    'aOpacity': 'lineOpacity',
    'aLineStrokeWidth': 'lineStrokeWidth',
    'aStrokeColor': 'lineStrokeColor',
    'aLineOffset': 'lineOffset',
    'aLineDxDy': null
};

/**
 * 由该 mesh 的 symbol 计算出“纯常量”外观字段打包进 records 所需的取值（attributeName -> 数组）。
 * fn-type 字段（含 identity 型包装）的逐 feature 值由 prepareFnTypeData 生成的逐顶点数组提供，
 * 这里仅在其缺省值（fn 定义的 default）可回退时使用；缺失字段一律写入与 uniform 渲染路径一致的默认值，
 * 保证 records 中 8 个字段始终有值可读。
 * 数值单位与 fn 逐顶点数组一致（颜色 0-255、width*2、opacity*255、offset/dxdy 像素值），
 * 因此 shader 中 storage 读取与 fn 分支共用同一套换算。
 */
export function getLineFnConstantAttrValues(symbol) {
    const values = {};
    for (const attrName in FIELD_DEFS) {
        if (attrName === 'aLinePattern') {
            // pattern 字段的 anim/gap 常量仍走 uniform 路径（frag 中 linePatternGap/linePatternAnimSpeed），records 不打包
            continue;
        }
        const symbolKey = FIELD_SYMBOL[attrName];
        let value = symbol && symbolKey ? symbol[symbolKey] : undefined;
        if (isFunctionDefinition(value)) {
            // fn-type 字段（含 LINE_SYMBOL 中 identity 型包装）的逐 feature 值由逐顶点数组提供，
            // 这里只取其缺省值（fn 定义的 default），供“完全没有逐顶点数组”的 geometry
            // （例如纯常量瓦片样式）在打包 records 时回退，与 uniform 渲染路径的默认值保持一致
            value = value.default;
        }
        if (attrName === 'aColor' || attrName === 'aStrokeColor') {
            if (isNil(value)) {
                value = RGBA_DEFAULTS[attrName];
            }
            values[attrName] = normalizeColorToUint8(value);
        } else if (attrName === 'aLineDxDy') {
            values[attrName] = [resolveConstDxDy(symbol, 'lineDx'), resolveConstDxDy(symbol, 'lineDy')];
        } else {
            if (isNil(value)) {
                value = SCALAR_DEFAULTS[attrName];
            }
            let v = value;
            if (DOUBLE_FIELDS[attrName]) {
                v = Math.round(v * 2.0);
            } else if (attrName === 'aOpacity') {
                v = Math.floor(v * 255.0);
            } else {
                v = Math.round(v);
            }
            values[attrName] = [v];
        }
    }
    return values;
}

// lineDx/lineDy 的常量取值（像素）：fn-type 包装取其 default，缺省为 0
function resolveConstDxDy(symbol, symbolKey) {
    let value = symbol ? symbol[symbolKey] : undefined;
    if (isFunctionDefinition(value)) {
        value = value.default;
    }
    return isNil(value) ? 0 : Math.round(value);
}

/**
 * 把颜色转成 0-255 的 rgba 字节数组（与 fn 的 aColor/aStrokeColor 数组一致）。
 * 输入与 setUniformFromSymbol 一致：0-1 的数组或颜色字符串。
 */
function normalizeColorToUint8(color) {
    let unit;
    if (Array.isArray(color)) {
        const len = color.length;
        if (len === 3) {
            unit = [color[0], color[1], color[2], 1];
        } else {
            unit = [color[0], color[1], color[2], color[3]];
        }
        // 兼容 0-255 的取值范围（瓦片 symbol 的颜色可能已被 prepareSymbol 放大 255 倍）
        let max = 0;
        for (let i = 0; i < 4; i++) {
            if (unit[i] > max) {
                max = unit[i];
            }
        }
        if (max > 1) {
            unit = [unit[0] / 255, unit[1] / 255, unit[2] / 255, unit[3] / 255];
        }
    } else {
        unit = Color(color).unitArray();
        if (unit.length === 3) {
            unit = [unit[0], unit[1], unit[2], 1];
        }
    }
    return [Math.round(unit[0] * 255), Math.round(unit[1] * 255), Math.round(unit[2] * 255), Math.round(unit[3] * 255)];
}

// 获取 fn-type 属性的 CPU 数组：
// 1. 优先 geometry.properties 中由 fn_type_util 保存的 CPU 副本（generateBuffers 之后 geometry.data 中保存的是 GPU buffer 包装对象）
// 2. 其次读取 generateBuffers 之前仍保留在 geometry.data 中的原始 typed array。
//    注意原生 typed array 自带 .buffer（ArrayBuffer），不能用 !attr.buffer 区分"数组"，
//    要用 ArrayBuffer.isView 判断；generateBuffers 后的包装对象 { buffer: GPUBuffer } 不含 CPU 数据。
function getAttrArray(geometry, attrName) {
    const keyName = (FN_TYPE_PREFIX + attrName).trim();
    const copy = geometry.properties[keyName];
    if (copy && copy.length) {
        return copy;
    }
    const attr = geometry.data[attrName];
    if (!attr) {
        return null;
    }
    if (ArrayBuffer.isView(attr) && attr.length) {
        // 原生 typed array（generateBuffers 之前）
        return attr;
    }
    if (attr.array && attr.array.length) {
        return attr.array;
    }
    if (attr.data && attr.data.length) {
        return attr.data;
    }
    return null;
}

/**
 * 首次创建 records：在 generateBuffers 之前调用，setStorageData 只负责暂存 CPU 数组，
 * generateBuffers 时再自动创建 GPU storage buffer。
 *
 * @param {Geometry} geometry
 */
export function prepareLineFnStorageRecords(geometry) {
    syncLineFnStorageRecords(geometry);
}

/**
 * 整体同步 records 并上传。line fn-type 数据更新（zoom / featureState 变化）后调用：
 * GPU storage buffer 已生成时 setStorageData 会立即 writeBuffer 上传。
 *
 * 每个外观字段的取值来源：
 * 1. 存在该字段的 fn-type 逐顶点数组（prepareFnTypeData / 更新路径产生）时，按 feature run 取数组值；
 * 2. 不存在 fn 数组（该字段是"纯常量"，如 lineStrokeWidth: 3）时，回退到
 *    storeLineFnConstantValues 保存的该字段常量取值，所有 feature 打同一个值。
 * 这两种取值经过 packValue 后单位与语义一致，shader 读取路径相同。
 *
 * @param {Geometry} geometry
 */
export function syncLineFnStorageRecords(geometry) {
    if (!isLineFnStorageMode(geometry)) {
        return;
    }
    const aPickingId = getPickingId(geometry);
    const features = geometry.properties.features;
    if (!aPickingId || !aPickingId.length || !features) {
        return;
    }
    // 记录条数 = 最大的 feature 序号 + 1（aPickingId 即 feature 序号）
    let max = 0;
    for (let i = 0; i < aPickingId.length; i++) {
        if (aPickingId[i] > max) {
            max = aPickingId[i];
        }
    }
    const count = max + 1;
    const constValues = geometry.properties[CONST_VALUES_PROP] || null;
    const records = ensureRecords(geometry, count * FN_STRIDE);
    // 每次同步都基于最新的数据整体重建，保证与旧渲染路径取值完全一致
    for (const attrName in FIELD_DEFS) {
        const field = FIELD_DEFS[attrName];
        const width = field.width;
        const arr = getAttrArray(geometry, attrName);
        if (arr) {
            if (arr.length / aPickingId.length < width) {
                continue;
            }
            forEachFeatureRun(aPickingId, features, (feaIdx, start) => {
                records[feaIdx * FN_STRIDE + field.offset] = packValue(field.pack, arr, start * width, width);
            });
        } else if (constValues && constValues[attrName] !== undefined) {
            // 该字段没有逐顶点 fn 数组（纯常量外观），所有 feature 打同一个常量取值。
            // packValue 从 0 偏移读取固定长度的取值数组，与逐顶点路径共用同一套打包语义。
            const values = constValues[attrName];
            if (!values || values.length < width) {
                continue;
            }
            forEachFeatureRun(aPickingId, features, feaIdx => {
                records[feaIdx * FN_STRIDE + field.offset] = packValue(field.pack, values, 0, values.length);
            });
        }
    }
    geometry.setStorageData(LINE_FN_STORAGE_NAME, records);
}

function getPickingId(geometry) {
    const aPickingId = geometry.properties.aPickingId || geometry.data.aPickingId;
    if (!aPickingId) {
        return null;
    }
    // 原生 typed array 自带 .buffer（ArrayBuffer），需用 ArrayBuffer.isView 识别；
    // geometry.data.aPickingId 在 generateBuffers 后可能变成 {buffer} 包装对象
    if (ArrayBuffer.isView(aPickingId) && aPickingId.length) {
        return aPickingId;
    }
    if (aPickingId.array && aPickingId.array.length) {
        return aPickingId.array;
    }
    if (aPickingId.data && aPickingId.data.length) {
        return aPickingId.data;
    }
    return null;
}

function ensureRecords(geometry, length) {
    let records = geometry.properties[RECORDS_PROP];
    if (!records || records.length < length) {
        records = geometry.properties[RECORDS_PROP] = new Uint32Array(length);
    }
    return records;
}

function forEachFeatureRun(aPickingId, features, cb) {
    const l = aPickingId.length;
    let start = 0;
    let current = aPickingId[0];
    for (let i = 1; i <= l; i++) {
        if (i === l || aPickingId[i] !== current) {
            const feature = features[current];
            if (feature && feature.feature) {
                cb(current, start, i === l ? l : i);
            }
            if (i < l) {
                current = aPickingId[i];
                start = i;
            }
        }
    }
}

/**
 * 把某 feature 首顶点在 arr 中的取值压成一个 u32 word。
 * 数值语义与逐顶点 typed array 完全一致（Uint8 截断为 0-255、Int8/Int16 有符号位模式）。
 */
function packValue(pack, arr, offset, width) {
    let w = 0;
    switch (pack) {
        case 'rgba': {
            // 与 WGSL 中 r/g/b/a 的字节序一致：bit24-31 r, bit16-23 g, bit8-15 b, bit0-7 a
            const r = arr[offset] & 0xff;
            const g = arr[offset + 1] & 0xff;
            const b = arr[offset + 2] & 0xff;
            const a = arr[offset + 3] & 0xff;
            w = ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;
            break;
        }
        case 'u8': {
            // Uint8Array 语义
            w = arr[offset] & 0xff;
            break;
        }
        case 'i16': {
            // Int16Array 语义，直接存 int32 位模式（负数已符号扩展）
            w = arr[offset] >>> 0;
            break;
        }
        case 'i8x2': {
            const x = arr[offset] & 0xff;
            const y = width > 1 ? arr[offset + 1] & 0xff : 0;
            w = (x | (y << 8)) >>> 0;
            break;
        }
        default: {
            for (let i = 0; i < width; i++) {
                w = (w | ((arr[offset + i] & 0xff) << (i * 8))) >>> 0;
            }
        }
    }
    return w;
}
