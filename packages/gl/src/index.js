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
import ClipInsideMask from './layer/mask/ClipInsideMask.js';
import ClipOutsideMask from './layer/mask/ClipOutsideMask.js';
import FlatInsideMask from './layer/mask/FlatInsideMask.js';
import FlatOutsideMask from './layer/mask/FlatOutsideMask.js';
import ColorMask from './layer/mask/ColorMask.js';
import VideoMask from './layer/mask/VideoMask.js';
export { MaskLayerMixin, MaskRendererMixin };
export { ClipInsideMask, ClipOutsideMask, FlatInsideMask, FlatOutsideMask, ColorMask, VideoMask };

if (typeof window !== 'undefined') {
    // append GroupGLLayer on maptalks manually
    if (window.maptalks) {
        window.maptalks.GroupGLLayer = GroupGLLayer;
        window.maptalks.ClipInsideMask = ClipInsideMask;
        window.maptalks.ClipOutsideMask = ClipOutsideMask;
        window.maptalks.FlatInsideMask = FlatInsideMask;
        window.maptalks.FlatOutsideMask = FlatOutsideMask;
        window.maptalks.ColorMask = ColorMask;
        window.maptalks.VideoMask = VideoMask;
    }
}
