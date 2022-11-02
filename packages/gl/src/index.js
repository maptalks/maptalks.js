import GroupGLLayer from './layer/GroupGLLayer';
import GroundPainter from './layer/GroundPainter';
import './light/MapLights.js';
import './map/MapPostProcess.js';

export * as HighlightUtil from './layer/util/highlight.js';
export { GroupGLLayer, GroundPainter };

export { default as HeatmapProcess } from './layer/HeatmapProcess';
export { GLContext } from '@maptalks/fusiongl';
import MaskLayerMixin from './layer/mask/MaskLayerMixin.js';
import MaskRendererMixin from './layer/mask/MaskRendererMixin.js';
export { MaskLayerMixin, MaskRendererMixin };

if (typeof window !== 'undefined') {
    // append GroupGLLayer on maptalks manually
    if (window.maptalks) {
        window.maptalks.GroupGLLayer = GroupGLLayer;
    }
}
