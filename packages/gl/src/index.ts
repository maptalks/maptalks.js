import GroupGLLayer from './layer/GroupGLLayer';
import GroundPainter from './layer/GroundPainter';
import './light/MapLights.js';
import './map/MapPostProcess.js';

import * as HighlightUtil from './layer/util/highlight.js';
import * as ContextUtil from './layer/util/context.js';
export { GroupGLLayer, GroundPainter, HighlightUtil, ContextUtil };

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
import ElevateMask from './layer/mask/ElevateMask.js';
import BoxInsideClipMask from './layer/mask/BoxInsideClipMask.js';
import BoxOutsideClipMask from './layer/mask/BoxOutsideClipMask.js';
import RayCaster from './layer/raycaster/RayCaster.js';
export { MaskLayerMixin, MaskRendererMixin };
export { ClipInsideMask, ClipOutsideMask, FlatInsideMask, FlatOutsideMask, ElevateMask, ColorMask, VideoMask, BoxInsideClipMask, BoxOutsideClipMask };
export { RayCaster };

import { earcut } from '@maptalks/reshader.gl';
export { earcut };

export { default as color } from 'color';

if (typeof window !== 'undefined') {
    // append GroupGLLayer on maptalks manually
    if (window.maptalks) {
        window.maptalks.GroupGLLayer = GroupGLLayer;
        window.maptalks.ClipInsideMask = ClipInsideMask;
        window.maptalks.ClipOutsideMask = ClipOutsideMask;
        window.maptalks.FlatInsideMask = FlatInsideMask;
        window.maptalks.FlatOutsideMask = FlatOutsideMask;
        window.maptalks.ElevateMask = ElevateMask;
        window.maptalks.ColorMask = ColorMask;
        window.maptalks.VideoMask = VideoMask;
        window.maptalks.BoxInsideClipMask = BoxInsideClipMask;
        window.maptalks.BoxOutsideClipMask = BoxOutsideClipMask;
        window.maptalks.RayCaster = RayCaster;
    }
}
