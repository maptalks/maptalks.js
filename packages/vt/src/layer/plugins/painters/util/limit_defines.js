import { reshader } from '@maptalks/gl';


function getDefineSet(order) {
    const defineSet = new Set();
    for (const define of order) {
        if (define.includes("&&") || define.includes("||")) {
            const splitDefines = splitDefineCondition(define);
            for (const d of splitDefines) {
                defineSet.add(d.trim());
            }
        } else {
            defineSet.add(define);
        }
    }
    return defineSet;
}

function splitDefineCondition(defineKey) {
    return defineKey.split(/&&|\|\|/).map(v => v.trim());
}

export function limitDefinesByDevice(device, defines, defineOrder, checkedDefineKeys, currentAttrCount) {
    if (!device.wgpu) {
        return defines;
    }
    const limit = device.wgpu.limits.maxVertexBuffers;
    let count = 0;
    let limitedDefines = {};
    for (let i = 0; i < defineOrder.length; i++) {
        const define = defineOrder[i];
        const hit = reshader.WGSLParseDefines.getDefineConditionValue(define, defines);
        if (!hit) {
            continue;
        }
        count++;
        if ((count + currentAttrCount) <= limit) {
            const defineKeys = splitDefineCondition(define);
            for (const key of defineKeys) {
                if (defines[key]) {
                    limitedDefines[key] = defines[key];
                }
            }
        }
    }
    // 不需要lmit的define
    for (const p in defines) {
        if (!checkedDefineKeys.has(p)) {
            limitedDefines[p] = defines[p];
        }
    }
    return limitedDefines;
}



const MARKER_DEFINE_ORDER = [
    'HAS_ALTITUDE',
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

export function limitMarkerDefinesByDevice(device, defines) {
    // aPosition, aShape, aPickingId(for picking)
    const currentAttrCount = 3;
    return limitDefinesByDevice(device, defines, MARKER_DEFINE_ORDER, MARKER_DEFINES, currentAttrCount);
}

const LINE_DEFINE_ORDER = [
    'HAS_ALTITUDE',
    'HAS_COLOR',
    'HAS_OPACITY',
    'HAS_LINE_WIDTH',
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

export function limitLineDefinesByDevice(device, defines) {
    // aPosition, aExtrude
    const currentAttrCount = 2;
    return limitDefinesByDevice(device, defines, LINE_DEFINE_ORDER, LINE_DEFINES, currentAttrCount);
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
