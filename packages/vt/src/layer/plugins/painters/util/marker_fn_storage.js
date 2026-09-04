/**
 * IconPainter（Marker + Text）的逐 feature storage records 工具。
 *
 * WebGPU 存在 maxVertexBuffers（默认 8）限制：marker/text 的 fn-type 动态属性
 * （aMarkerWidth/aMarkerHeight/aColorOpacity/aDxDy/aPitchAlign/aRotationAlign/aRotation/
 * aTextSize/aTextHalo/aTextFill/aTextHaloFill）各自占用一个顶点 buffer 名额，符号属性较多时
 * limitMarkerDefinesByDevice 会把这些外观 define 裁剪掉，导致图标/文字样式丢失。
 *
 * 解决思路与 line（line_fn_storage.js）一致：这些 fn-type 属性的取值对"同一 feature 的所有连续顶点"
 * 是相同的（packing 时逐 run 填充），因此可以按 feature 压成一条记录，存到只读 storage buffer 中，
 * 渲染时以 aPickingId（即 feature 序号）为下标读取，不再占用顶点 buffer 名额。WebGL/GLSL 路径不变。
 *
 * 与 line 的差异：marker 的属性字段只在"存在 fn/text-fit 逐顶点数组"时才打包进 records
 * （常量字段没有逐顶点数组，渲染继续走 per-mesh uniform 路径，shader 读取与 define 由各字段的
 * fn 数组是否存在决定，storage 模式不需要额外强制开启这些字段的 define）。
 *
 * 记录布局必须与 marker_vert.wgsl 中 MarkerFnRecords 的常量保持一致，每条固定 10 个 u32（FN_STRIDE）：
 *
 *   word0  markerWidth(u16) | markerHeight(u16)
 *   word1  markerOpacity(u8) | textOpacity(u8)
 *   word2  markerDx(i8) | markerDy(i8) | textDx(i8) | textDy(i8)
 *   word3  markerPitchAlign(u8) | textPitchAlign(u8)
 *   word4  markerRotationAlign(u8) | textRotationAlign(u8)
 *   word5  markerRotation(u16) | textRotation(u16)
 *   word6  textSize(u16)
 *   word7  textHaloRadius(u8) | textHaloOpacity(u8)
 *   word8  textFill(rgba)
 *   word9  textHaloFill(rgba)
 */
// fn_type_util 中保存的 CPU 副本属性名前缀（与 fn_type_util.PREFIX 保持一致），
// 这里不复用其导出，是为了避免 fn_type_util <-> marker_fn_storage 的循环依赖
const FN_TYPE_PREFIX = '_fn_type_';

// 存储数据 / WGSL var 名，bind group 通过该名字从 geometry 取 storage buffer
export const MARKER_FN_STORAGE_NAME = 'markerFnRecords';

export const FN_STRIDE = 10;

const RECORDS_PROP = '__markerFnStorageRecords';
const STORAGE_MODE_PROP = 'markerFnStorageMode';

/**
 * attrName -> 打包信息。
 * arrWidth：逐顶点数组每个顶点的分量数；byteOffset：该字段首字节在记录内的字节偏移；
 * kind：字节写入方式（u8/u16/i8/rgba），字节序为小端，与 WGSL 的位运算解码保持一致
 *
 * 逐顶点数组存在两种布局（对应两套 wgsl shader）：
 * 1. icon/text 合流几何（IconPainter，marker_vert）：共享字段合并进多分量数组，
 *    aColorOpacity = [markerOpacity, textOpacity]、aDxDy = [markerDx, markerDy, textDx, textDy]、
 *    aPitchAlign/aRotationAlign/aRotation 同理，数组宽度与记录槽位一一对应；
 * 2. 纯文字几何（TextPainter，text_vert/text_line_vert）：每个字段是独立的数组
 *    （aColorOpacity/aPitchAlign/aRotationAlign/aRotation/aTextDx/aTextDy 宽度为 1，
 *    仅代表 text 槽位），取值只落在记录的 text 槽位，marker 槽位保持 0。
 */
const PACKED_FIELD_DEFS = {
    'aMarkerWidth': { arrWidth: 1, byteOffset: 0, kind: 'u16' },
    'aMarkerHeight': { arrWidth: 1, byteOffset: 2, kind: 'u16' },
    'aColorOpacity': { arrWidth: 2, byteOffset: 4, kind: 'u8' },
    'aDxDy': { arrWidth: 4, byteOffset: 8, kind: 'i8' },
    'aPitchAlign': { arrWidth: 2, byteOffset: 12, kind: 'u8' },
    'aRotationAlign': { arrWidth: 2, byteOffset: 16, kind: 'u8' },
    'aRotation': { arrWidth: 2, byteOffset: 20, kind: 'u16' },
    'aTextSize': { arrWidth: 1, byteOffset: 24, kind: 'u16' },
    'aTextHalo': { arrWidth: 2, byteOffset: 28, kind: 'u8' },
    'aTextFill': { arrWidth: 4, byteOffset: 32, kind: 'rgba' },
    'aTextHaloFill': { arrWidth: 4, byteOffset: 36, kind: 'rgba' }
};

const TEXT_FIELD_DEFS = {
    'aColorOpacity': { arrWidth: 1, byteOffset: 5, kind: 'u8' },
    'aTextDx': { arrWidth: 1, byteOffset: 10, kind: 'i8' },
    'aTextDy': { arrWidth: 1, byteOffset: 11, kind: 'i8' },
    'aPitchAlign': { arrWidth: 1, byteOffset: 13, kind: 'u8' },
    'aRotationAlign': { arrWidth: 1, byteOffset: 17, kind: 'u8' },
    'aRotation': { arrWidth: 1, byteOffset: 22, kind: 'u16' },
    'aTextSize': { arrWidth: 1, byteOffset: 24, kind: 'u16' },
    'aTextHalo': { arrWidth: 2, byteOffset: 28, kind: 'u8' },
    'aTextFill': { arrWidth: 4, byteOffset: 32, kind: 'rgba' },
    'aTextHaloFill': { arrWidth: 4, byteOffset: 36, kind: 'rgba' }
};

// 记录打包使用哪套字段布局：IconPainter 的 icon/text 合流几何（含 marker 的共享多分量数组）
// 以 iconAtlas 为标志；纯文字几何没有 iconAtlas，只使用 text 槽位布局
function getFieldDefs(geometry) {
    const hasIcon = geometry && geometry.properties && geometry.properties.iconAtlas;
    return hasIcon ? PACKED_FIELD_DEFS : TEXT_FIELD_DEFS;
}

export function isMarkerFnStorageMode(geometry) {
    return !!(geometry && geometry.properties && geometry.properties[STORAGE_MODE_PROP]);
}

export function enableMarkerFnStorage(geometry) {
    if (geometry && geometry.properties) {
        geometry.properties[STORAGE_MODE_PROP] = true;
    }
}

/**
 * 判断该 geometry 是否值得启用 marker fn storage 模式（WebGPU）：
 * 只要逐顶点数据中带有 aPickingId（feature 序号），就可以按 feature 打包 records。
 * 注意 geometry 尚在 generateBuffers 之前，aPickingId 仍是数组。
 */
export function canEnableMarkerFnStorage(geometry) {
    const aPickingId = geometry && (geometry.properties && geometry.properties.aPickingId || geometry.data && geometry.data.aPickingId);
    return !!(aPickingId && aPickingId.length);
}

/**
 * 判断该 geometry 是否带有需要打包进 records 的外观字段逐顶点数组
 * （marker/text 的 fn-type 或 text-fit 产生的 aDxDy/aColorOpacity/aTextFill 等）。
 * 只有存在这些数组时才值得启用 storage 模式，否则打包只会产生全 0 的 records，白白增加开销。
 */
export function hasMarkerFnAttrs(geometry) {
    if (!geometry) {
        return false;
    }
    const defs = getFieldDefs(geometry);
    for (const attrName in defs) {
        if (getAttrArray(geometry, attrName)) {
            return true;
        }
    }
    return false;
}

/**
 * 首次创建 records：在 generateBuffers 之前调用，setStorageData 只负责暂存 CPU 数组，
 * generateBuffers 时再自动创建 GPU storage buffer。
 * @param {Geometry} geometry
 */
export function prepareMarkerFnStorageRecords(geometry) {
    syncMarkerFnStorageRecords(geometry);
}

/**
 * WebGPU 下按需启用 marker/text fn storage 模式，并准备 records。
 * 启用条件：
 * 1. 当前渲染设备是 WebGPU（存在 maxVertexBuffers 限制，见文件头说明）；
 * 2. geometry 带 aPickingId（feature 序号，作为 records 下标）；
 * 3. geometry 中存在需要打包的 fn-type / text-fit 逐顶点外观数组（纯常量外观继续走
 *    per-mesh uniform 路径，没有逐顶点数组的字段即使启用 storage 也只会打出全 0 的 records，
 *    徒增开销，见 hasMarkerFnAttrs）。
 * 幂等：同一 geometry 只会启用一次（storageMode 标记），重复调用只会刷新 records。
 * 必须在 geometry.generateBuffers 之前调用：prepare 的 records 通过 setStorageData 暂存到
 * geometry，generateBuffers 时才会创建 GPU storage buffer（见 Geometry._generateStorageBuffers）。
 *
 * @param {Geometry} geometry
 * @param {Boolean} isWebGPU 渲染设备是否为 WebGPU（由 painter.isWebGPU() 提供）
 */
export function prepareMarkerFnStorageForDevice(geometry, isWebGPU) {
    if (!geometry || !isWebGPU) {
        return;
    }
    if (!isMarkerFnStorageMode(geometry)) {
        if (!canEnableMarkerFnStorage(geometry) || !hasMarkerFnAttrs(geometry)) {
            return;
        }
        enableMarkerFnStorage(geometry);
    }
    prepareMarkerFnStorageRecords(geometry);
}

/**
 * 整体同步 records 并上传。marker/text fn-type 数据更新（zoom / featureState / text-fit 变化）后调用：
 * GPU storage buffer 已生成时 setStorageData 会立即 writeBuffer 上传。
 *
 * 每个外观字段的取值来源：存在该字段的 fn-type / text-fit 逐顶点数组（prepareFnTypeData、
 * updateMarkerFitSize 等产生）时，按 feature run 取 run 起始顶点的数组值。
 *
 * @param {Geometry} geometry
 */
export function syncMarkerFnStorageRecords(geometry) {
    if (!isMarkerFnStorageMode(geometry)) {
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
    const records = ensureRecords(geometry, count * FN_STRIDE);
    // 每次同步都基于最新的数据整体重建（先清零，字段没有逐顶点数组时记录保持 0，define 关闭不会读取）
    records.fill(0);
    const defs = getFieldDefs(geometry);
    for (const attrName in defs) {
        const field = defs[attrName];
        const arr = getAttrArray(geometry, attrName);
        if (!arr || arr.length < aPickingId.length * field.arrWidth) {
            continue;
        }
        // 缓存 generateBuffers 后不可读的原始数组：geometry.data 中带 CPU 数据的 typed array
        // 在 generateBuffers 后会被替换成不含 CPU 数据的 GPU 包装对象（见 gl Geometry），
        // 而 prepareIconGeometry 等只缓存了部分字段（aMarkerWidth/aMarkerHeight/aDxDy/aPitchAlign/
        // aRotationAlign/aRotation），aColorOpacity/aTextFill/aTextHalo 等字段没有 CPU 副本，
        // 若不在此缓存，后续（addMesh / fn-type 更新触发的）records 重建会把缺失字段清零，
        // 导致 WebGPU 下 icon-only / text-only 渲染为全透明。
        const props = geometry.properties;
        if (ArrayBuffer.isView(arr) && props && !props[attrName]) {
            props[attrName] = arr;
        }
        forEachFeatureRun(aPickingId, features, (feaIdx, start) => {
            writeField(records, feaIdx, field, arr, start);
        });
    }
    geometry.setStorageData(MARKER_FN_STORAGE_NAME, records);
}

// 获取 fn-type / text-fit 属性的 CPU 数组：
// 1. 优先 geometry.properties 中由 fn_type_util 保存的 CPU 副本（zoom 更新直接写入该副本）
// 2. 其次 geometry.properties 中保存的普通副本（例如 prepareDxDy / text-fit 创建的 aMarkerWidth）
// 3. 再次读取 generateBuffers 之前仍保留在 geometry.data 中的原始 typed array。
//    generateBuffers 后的包装对象 { buffer: GPUBuffer } 不含 CPU 数据，需通过 .array/.data 取值
function getAttrArray(geometry, attrName) {
    const props = geometry.properties;
    if (props) {
        const keyName = (FN_TYPE_PREFIX + attrName).trim();
        if (props[keyName] && props[keyName].length) {
            return props[keyName];
        }
        if (props[attrName] && props[attrName].length) {
            return props[attrName];
        }
    }
    const attr = geometry.data && geometry.data[attrName];
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
 * 把某 feature 的字段逐顶点取值（取 run 起始顶点）写入记录对应的 word 槽位。
 * 数值语义与逐顶点 typed array 一致：u8 截断为 0-255、i8 保存低位（WGSL 侧符号扩展还原）、
 * u16 低位优先、rgba 与 WGSL 解码的字节序一致（bit24-31 r, bit16-23 g, bit8-15 b, bit0-7 a）。
 *
 * FIELD_DEFS 中 byteOffset 是字段首字节在记录内的字节偏移；一个 u32 word 内可能有多个小字段
 * （如 word0 = markerWidth(u16, byte0-1) | markerHeight(u16, byte2-3)），
 * 这里先按字段类型把取值压进一个 word 的低位，再整体左移该字段在 word 内的起始字节偏移，与原值按位或，
 * 保证跨字段打包（同一 word 的不同字节）互不覆盖。
 */
function writeField(records, feaIdx, field, arr, start) {
    const base = feaIdx * FN_STRIDE;
    const byteOffset = field.byteOffset;
    const arrOffset = start * field.arrWidth;
    // word 槽位 = 字节偏移 / 4，字段在 word 内的起始字节偏移 = byteOffset % 4（均不会跨 word）
    const wordIndex = Math.floor(byteOffset / 4);
    const byteShift = (byteOffset % 4) * 8;
    let w = 0;
    switch (field.kind) {
        case 'u8': {
            // 逐字节写入 arrWidth 个 u8
            for (let i = 0; i < field.arrWidth; i++) {
                const v = arr[arrOffset + i] & 0xff;
                w = w | (v << (i * 8));
            }
            break;
        }
        case 'i8': {
            // Int8Array 语义：只保存低位字节，WGSL 侧按符号扩展还原
            for (let i = 0; i < field.arrWidth; i++) {
                const v = arr[arrOffset + i] & 0xff;
                w = w | (v << (i * 8));
            }
            break;
        }
        case 'u16': {
            // 每个分量占 2 字节（u16 位模式），分量按 array 顺序排列
            for (let i = 0; i < field.arrWidth; i++) {
                const v = arr[arrOffset + i] & 0xffff;
                w = w | (v << (i * 16));
            }
            break;
        }
        case 'rgba': {
            // 颜色值（0-255），与 WGSL 解码的字节序一致：bit24-31 r, bit16-23 g, bit8-15 b, bit0-7 a
            const r = arr[arrOffset] & 0xff;
            const g = arr[arrOffset + 1] & 0xff;
            const b = arr[arrOffset + 2] & 0xff;
            const a = arr[arrOffset + 3] & 0xff;
            w = ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;
            break;
        }
        default:
            return;
    }
    records[base + wordIndex] = records[base + wordIndex] | (w << byteShift);
}
