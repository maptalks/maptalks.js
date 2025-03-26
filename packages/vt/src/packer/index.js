export { default as VectorPack } from './pack/VectorPack';
export { default as PointPack, TEXT_MAX_ANGLE } from './pack/PointPack';
export { default as LinePack } from './pack/LinePack';
export { default as LineExtrusionPack } from './pack/LineExtrusionPack';
export { default as NativeLinePack } from './pack/NativeLinePack';
export { default as NativePointPack } from './pack/NativePointPack';
export { default as PolygonPack, INVALID_TEX_COORD } from './pack/PolygonPack';
export { default as CirclePack } from './pack/CirclePack';
export { default as RoundTubePack } from './pack/RoundTubePack';
export { default as SquareTubePack } from './pack/SquareTubePack';
export { default as GlyphRequestor } from './GlyphRequestor';
// export { default as IconRequestor } from './IconRequestor';
export { default as LRUCache } from './LRUCache';
export { default as StyledPoint } from './pack/StyledPoint';
export { default as StyledVector } from './pack/StyledVector';
export { default as ArrayPool } from './pack/util/ArrayPool.js';
import * as PackUtil from './pack/util/index.js';
export { PackUtil };
import * as TextUtil from './style/Text.js';
export { TextUtil };
import * as StyleUtil from './style/Util.js';
export { StyleUtil };
import * as FilterUtil from './style/Filter.js';
export { FilterUtil };
import * as FuncTypeUtil from './style/FuncType.js';
export { FuncTypeUtil };

// in meters
export const DEFAULT_TEX_WIDTH = 128 / 256 * 46.5;
// vt和vector图层，共同需要重建mesh的symbol属性
const SYMBOLS_NEED_REBUILD = {
    'polygonPatternFile': 1,

    'markerFile': 1,
    'markerPlacement': 1,
    'markerSpacing': 1,

    'textName': 1,
    'textFaceName': 1,
    'textPlacement': 1,
    'textSpacing': 1,

    'lineJoin': 1,
    'lineCap': 1,
    'linePatternFile': 1,
};

// 只有vt图层，需要重建mesh的symbol属性
const SYMBOLS_NEED_REBUILD_IN_VT = {
    'visible': 1,

    'textHorizontalAlignment': 1,
    'textVerticalAlignment': 1,
    'textWrapWidth': 1,

    'markerHorizontalAlignment': 1,
    'markerVerticalAlignment': 1,
};

// 只有vector图层，需要重建mesh的symbol属性
const SYMBOLS_NEED_REBUILD_IN_VECTOR = {
    'lineDasharray': 1,
    'topPolygonFill': 1,
    'bottomPolygonFill': 1
};

Object.assign(SYMBOLS_NEED_REBUILD_IN_VT, SYMBOLS_NEED_REBUILD);
Object.assign(SYMBOLS_NEED_REBUILD_IN_VECTOR, SYMBOLS_NEED_REBUILD);

export { SYMBOLS_NEED_REBUILD_IN_VECTOR, SYMBOLS_NEED_REBUILD_IN_VT };
