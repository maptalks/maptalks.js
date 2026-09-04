import { reshader } from '@maptalks/gl';


function getDefineSet(order) {
    const defineSet = new Set();
    for (const define of order) {
        const condition = getDefineCondition(define);
        if (condition.includes("&&") || condition.includes("||")) {
            const splitDefines = splitDefineCondition(condition);
            for (const d of splitDefines) {
                defineSet.add(d.trim());
            }
        } else {
            defineSet.add(condition);
        }
    }
    return defineSet;
}

function splitDefineCondition(defineKey) {
    return defineKey.split(/&&|\|\|/).map(v => v.trim());
}

// define条目可以写成 { condition: 'HAS_XXX', weight: n }，
// weight 表示该 define 激活后在wgsl中占用的顶点attribute(vertex buffer)数量，默认1
function getDefineCondition(define) {
    return (define && typeof define === 'object') ? define.condition : define;
}

function getDefineWeight(define) {
    return (define && typeof define === 'object') ? (define.weight || 1) : 1;
}

export function limitDefinesByDevice(device, defines, defineOrder, checkedDefineKeys, currentAttrCount, storageWeights) {
    if (!device.wgpu) {
        return defines;
    }
    const limit = device.wgpu.limits.maxVertexBuffers;
    let count = 0;
    let limitedDefines = {};
    for (let i = 0; i < defineOrder.length; i++) {
        const define = defineOrder[i];
        const condition = getDefineCondition(define);
        const hit = reshader.WGSLParseDefines.getDefineConditionValue(condition, defines);
        if (!hit) {
            continue;
        }
        let weight = getDefineWeight(define);
        if (storageWeights && storageWeights[condition] !== undefined) {
            // 例如 line fn-type 属性迁移到只读 storage buffer 后不再占用顶点 buffer 名额，
            // 其对应的 define 权重降为 0（或只保留仍然逐顶点的部分，如 aCapOffset）
            weight = storageWeights[condition];
        }
        if (weight === 0) {
            // 不占用顶点 buffer，直接放行（不能裁剪，否则 fn 外观在 webgpu 下丢失）
            const defineKeys = splitDefineCondition(condition);
            for (const key of defineKeys) {
                if (defines[key]) {
                    limitedDefines[key] = defines[key];
                }
            }
            continue;
        }
        if ((count + weight + currentAttrCount) <= limit) {
            count += weight;
            const defineKeys = splitDefineCondition(condition);
            for (const key of defineKeys) {
                if (defines[key]) {
                    limitedDefines[key] = defines[key];
                }
            }
        }
    }
    // 不需要limit的define
    for (const p in defines) {
        if (!checkedDefineKeys.has(p)) {
            limitedDefines[p] = defines[p];
        }
    }
    return limitedDefines;
}



const MARKER_DEFINE_ORDER = [
    'HAS_ALTITUDE',
    'ENABLE_COLLISION',
    'HAS_OFFSET_Z',
    'HAS_TEXT_SIZE',
    'HAS_MARKER_WIDTH',
    'HAS_MARKER_HEIGHT',
    'HAS_TEXT_FILL',
    'HAS_MARKER_DX || HAS_MARKER_DY || HAS_TEXT_DX || HAS_TEXT_DY',
    'HAS_OPACITY',
    'HAS_MARKER_PITCH_ALIGN || HAS_TEXT_PITCH_ALIGN',
    'HAS_MARKER_ROTATION_ALIGN || HAS_TEXT_ROTATION_ALIGN',
    'HAS_MARKER_ROTATION || HAS_TEXT_ROTATION',
    'HAS_TEXT_HALO_FILL',
    'HAS_HALO_ATTR || HAS_TEXT_HALO_RADIUS || HAS_TEXT_HALO_OPACITY'
];


const MARKER_DEFINES = getDefineSet(MARKER_DEFINE_ORDER);

// marker/text 的 fn-type 属性迁移到只读 storage buffer 后，对应的 define 不再占用顶点 buffer 名额。
// condition 为 MARKER_DEFINE_ORDER 中的条目，值为 storage 模式下的剩余权重（全部为 0，直接放行）。
// aAltitude(aAltitude)、ENABLE_COLLISION(aOpacity) 与 HAS_OFFSET_Z(aOffset) 是真正逐顶点的动态属性，
// storage 模式仍保留为逐顶点 attribute，不在这里。
const MARKER_STORAGE_WEIGHTS = {
    'HAS_TEXT_SIZE': 0,
    'HAS_MARKER_WIDTH': 0,
    'HAS_MARKER_HEIGHT': 0,
    'HAS_TEXT_FILL': 0,
    'HAS_MARKER_DX || HAS_MARKER_DY || HAS_TEXT_DX || HAS_TEXT_DY': 0,
    'HAS_OPACITY': 0,
    'HAS_MARKER_PITCH_ALIGN || HAS_TEXT_PITCH_ALIGN': 0,
    'HAS_MARKER_ROTATION_ALIGN || HAS_TEXT_ROTATION_ALIGN': 0,
    'HAS_MARKER_ROTATION || HAS_TEXT_ROTATION': 0,
    'HAS_TEXT_HALO_FILL': 0,
    // aTextHalo 已迁到 storage；HAS_HALO_ATTR 只是 aShape 携带的 halo 标志，不占用独立顶点 buffer
    'HAS_HALO_ATTR || HAS_TEXT_HALO_RADIUS || HAS_TEXT_HALO_OPACITY': 0
};

export function limitMarkerDefinesByDevice(device, defines, markerFnStorage) {
    // aPosition, aShape, aPickingId
    // markerFnStorage 模式下这些外观字段由 records 读取，aPickingId 作为 storage 下标参与 base 计数
    const currentAttrCount = 3;
    const storageWeights = markerFnStorage ? MARKER_STORAGE_WEIGHTS : null;
    return limitDefinesByDevice(device, defines, MARKER_DEFINE_ORDER, MARKER_DEFINES, currentAttrCount, storageWeights);
}

const LINE_DEFINE_ORDER = [
    'HAS_ALTITUDE',
    'HAS_COLOR',
    'HAS_OPACITY',
    'HAS_LINE_WIDTH',
    // vector渲染中多symbol同线合并进同一mesh时，逐feature深度偏置占1个顶点attribute。
    // 放在HAS_LINE_OFFSET之前：WebGPU默认只有8个vertex buffer，若排在末尾会被优先裁剪，
    // 导致共面多symbol线的z-fighting修复在GPU后端失效。
    'HAS_LINE_DEPTH_BIAS',
    // aLineOffset和aCapOffset是两个顶点attribute，因此权重为2
    { condition: 'HAS_LINE_OFFSET', weight: 2 },
    'HAS_PATTERN || HAS_DASHARRAY || HAS_GRADIENT || HAS_TRAIL',
    'HAS_PATTERN',
    'HAS_GRADIENT',
    'HAS_DASHARRAY && HAS_DASHARRAY_ATTR',
    'HAS_DASHARRAY && HAS_DASHARRAY_COLOR',
    'HAS_LINE_DX || HAS_LINE_DY',
    'HAS_STROKE_WIDTH',
    'HAS_STROKE_COLOR'
];

const LINE_DEFINES = getDefineSet(LINE_DEFINE_ORDER);

// line 的 fn-type 属性迁移到只读 storage buffer 后，对应的 define 不再占用（或只占用部分）
// 顶点 buffer 名额。condition 为 LINE_DEFINE_ORDER 中的条目，值为 storage 模式下的剩余权重：
// 纯 fn 属性权重为 0（不占用），仍有逐顶点伙伴属性的保留其权重（如 HAS_LINE_OFFSET 的 aCapOffset）
const LINE_STORAGE_WEIGHTS = {
    'HAS_COLOR': 0,
    'HAS_OPACITY': 0,
    'HAS_LINE_WIDTH': 0,
    'HAS_LINE_DX || HAS_LINE_DY': 0,
    'HAS_STROKE_WIDTH': 0,
    'HAS_STROKE_COLOR': 0,
    // aLineOffset 已迁到 storage，aCapOffset 仍是逐顶点 attribute，保留 1 个权重
    'HAS_LINE_OFFSET': 1
};

export function limitLineDefinesByDevice(device, defines, lineFnStorage) {
    // aPosition, aExtrude
    // lineFnStorage 模式下 WGSL 颜色 pass 还需绑定逐顶点的 aPickingId（feature 序号，作为 storage 下标），
    // 基础顶点 buffer 数 +1；fn 外观属性本身由 LINE_STORAGE_WEIGHTS 降为 0 权重放行
    const currentAttrCount = lineFnStorage ? 3 : 2;
    const storageWeights = lineFnStorage ? LINE_STORAGE_WEIGHTS : null;
    return limitDefinesByDevice(device, defines, LINE_DEFINE_ORDER, LINE_DEFINES, currentAttrCount, storageWeights);
}

const POLYGON_DEFINE_ORDER = [
    'HAS_ALTITUDE',
    'HAS_COLOR',
    'HAS_OPACITY',
    'HAS_PATTERN',
    'HAS_PATTERN && HAS_PATTERN_WIDTH',
    'HAS_PATTERN && HAS_PATTERN_ORIGIN',
    'HAS_PATTERN && HAS_PATTERN_OFFSET',
    'HAS_PATTERN && HAS_UV_SCALE',
    'HAS_PATTERN && HAS_UV_OFFSET',
    'HAS_PATTERN && HAS_TEX_COORD',
];

const POLYGON_DEFINES = getDefineSet(POLYGON_DEFINE_ORDER);

export function limitPolygonDefinesByDevice(device, defines) {
    // aPosition
    const currentAttrCount = 1;
    return limitDefinesByDevice(device, defines, POLYGON_DEFINE_ORDER, POLYGON_DEFINES, currentAttrCount);
}
