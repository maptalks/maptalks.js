export { default as VectorPack } from './pack/VectorPack';
export { default as PointPack } from './pack/PointPack';
export { default as LinePack } from './pack/LinePack';
export { default as LineExtrusionPack } from './pack/LineExtrusionPack';
export { default as NativeLinePack } from './pack/NativeLinePack';
export { default as NativePointPack } from './pack/NativePointPack';
export { default as PolygonPack } from './pack/PolygonPack';
export { default as CirclePack } from './pack/CirclePack';
export { default as GlyphRequestor } from './GlyphRequestor';
export { default as IconRequestor } from './IconRequestor';
export { default as LRUCache } from './LRUCache';
export { default as StyledPoint } from './pack/StyledPoint';
export { default as StyledVector } from './pack/StyledVector';
import * as PackUtil from './pack/util/index.js';
export { PackUtil };
import * as TextUtil from './style/Text.js';
export { TextUtil };
//256是2的8次方，在glZoom + 8级别时，texture为1:1比例
export const PACK_TEX_SIZE = 128 / 256;

// vt和vector图层，共同需要重建mesh的symbol属性
const SYMBOLS_NEED_REBUILD = {
    'polygonPatternFile': 1,

    'markerFile': 1,
    'markerPlacement': 1,
    'markerSpacing': 1,

    'textName': 1,
    'textStyle': 1,
    'textFaceName': 1,
    'textWeight': 1,
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
    'lineDasharray': 1
};

Object.assign(SYMBOLS_NEED_REBUILD_IN_VT, SYMBOLS_NEED_REBUILD);
Object.assign(SYMBOLS_NEED_REBUILD_IN_VECTOR, SYMBOLS_NEED_REBUILD);

export { SYMBOLS_NEED_REBUILD_IN_VECTOR, SYMBOLS_NEED_REBUILD_IN_VT };
