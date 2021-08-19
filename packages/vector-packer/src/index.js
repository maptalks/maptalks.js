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
//256是2的8次方，在glZoom + 8级别时，texture为1:1比例
export const PACK_TEX_SIZE = 128 / 256;
export const SYMBOLS_NEED_SETSTYLE = {
    'textName': 1,
    'polygonPatternFile': 1,
    'linePatternFile': 1,
    'markerFile': 1,
    'textStyle': 1,
    'textFaceName': 1,
    'textWeight': 1
};
