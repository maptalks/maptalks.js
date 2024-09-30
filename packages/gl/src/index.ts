import GroupGLLayer from './layer/GroupGLLayer';
import GroundPainter from './layer/GroundPainter';
import './light/MapLights';
import './map/MapPostProcess';

import * as HighlightUtil from './layer/util/highlight';
import * as ContextUtil from './layer/util/context';
export { GroupGLLayer, GroundPainter, HighlightUtil, ContextUtil };

export { default as HeatmapProcess } from './layer/HeatmapProcess';
export { GLContext } from '@maptalks/fusiongl';
import MaskLayerMixin from './layer/mask/MaskLayerMixin';
import MaskRendererMixin from './layer/mask/MaskRendererMixin';
import ClipInsideMask from './layer/mask/ClipInsideMask';
import ClipOutsideMask from './layer/mask/ClipOutsideMask';
import FlatInsideMask from './layer/mask/FlatInsideMask';
import FlatOutsideMask from './layer/mask/FlatOutsideMask';
import ColorMask from './layer/mask/ColorMask';
import VideoMask from './layer/mask/VideoMask';
import ElevateMask from './layer/mask/ElevateMask';
import BoxInsideClipMask from './layer/mask/BoxInsideClipMask';
import BoxOutsideClipMask from './layer/mask/BoxOutsideClipMask';
import RayCaster from './layer/raycaster/RayCaster';
export { MaskLayerMixin, MaskRendererMixin };
export { ClipInsideMask, ClipOutsideMask, FlatInsideMask, FlatOutsideMask, ElevateMask, ColorMask, VideoMask, BoxInsideClipMask, BoxOutsideClipMask };
export { RayCaster };

import { earcut } from '@maptalks/reshader.gl';
export { earcut };

export { default as color } from 'color';

if (typeof window !== 'undefined') {
    // append GroupGLLayer on maptalks manually
    if (window.maptalks) {
      // @ts-expect-error-error
        window.maptalks.GroupGLLayer = GroupGLLayer;
        // @ts-expect-error-error
        window.maptalks.ClipInsideMask = ClipInsideMask;
        // @ts-expect-error-error
        window.maptalks.ClipOutsideMask = ClipOutsideMask;
        // @ts-expect-error-error
        window.maptalks.FlatInsideMask = FlatInsideMask;
        // @ts-expect-error-error
        window.maptalks.FlatOutsideMask = FlatOutsideMask;
        // @ts-expect-error-error
        window.maptalks.ElevateMask = ElevateMask;
        // @ts-expect-error-error
        window.maptalks.ColorMask = ColorMask;
        // @ts-expect-error-error
        window.maptalks.VideoMask = VideoMask;
        // @ts-expect-error-error
        window.maptalks.BoxInsideClipMask = BoxInsideClipMask;
        // @ts-expect-error-error
        window.maptalks.BoxOutsideClipMask = BoxOutsideClipMask;
        // @ts-expect-error-error
        window.maptalks.RayCaster = RayCaster;
    }
}
