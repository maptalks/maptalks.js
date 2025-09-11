import GroupGLLayer from './layer/GroupGLLayer';
import GroundPainter from './layer/GroundPainter';
import CanvasCompatible from './layer/CanvasCompatible';
import './light/MapLights';
import './map/MapPostProcess';
import './map/MapGLRenderer';

import * as HighlightUtil from './layer/util/highlight';
import * as ContextUtil from './layer/util/context';
export { GroupGLLayer, GroundPainter, CanvasCompatible, HighlightUtil, ContextUtil };

import './layer/TileLayerGLRenderer';
import './map/MapGLRenderer';
import './layer/ImageLayerGLRenderer';
// import './map/MapGPURenderer';

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
import ImageMask from './layer/mask/ImageMask';
import ElevateMask from './layer/mask/ElevateMask';
import BoxInsideClipMask from './layer/mask/BoxInsideClipMask';
import BoxOutsideClipMask from './layer/mask/BoxOutsideClipMask';
import RayCaster from './layer/raycaster/RayCaster';
export { MaskLayerMixin, MaskRendererMixin };
export { ClipInsideMask, ClipOutsideMask, FlatInsideMask, FlatOutsideMask, ImageMask, ElevateMask, ColorMask, VideoMask, BoxInsideClipMask, BoxOutsideClipMask };
export { RayCaster };

import Distance3DTool from './analysis/Distance3DTool';
import Measure3DTool from './analysis/Measure3DTool';
import Area3DTool from './analysis/Area3DTool';
import Height3DTool from './analysis/Height3DTool';
export { Distance3DTool, Measure3DTool, Area3DTool, Height3DTool };

import earcut from 'earcut';
export { earcut };

export { default as color } from 'color';

import * as reshader from './reshader';
export { reshader };

// if (typeof window !== 'undefined') {
//     // append GroupGLLayer on maptalks manually
//     if (window.maptalks) {
//       // @ts-expect-error-error
//         window.maptalks.GroupGLLayer = GroupGLLayer;
//         // @ts-expect-error-error
//         window.maptalks.ClipInsideMask = ClipInsideMask;
//         // @ts-expect-error-error
//         window.maptalks.ClipOutsideMask = ClipOutsideMask;
//         // @ts-expect-error-error
//         window.maptalks.FlatInsideMask = FlatInsideMask;
//         // @ts-expect-error-error
//         window.maptalks.FlatOutsideMask = FlatOutsideMask;
//         // @ts-expect-error-error
//         window.maptalks.ElevateMask = ElevateMask;
//         // @ts-expect-error-error
//         window.maptalks.ColorMask = ColorMask;
//         // @ts-expect-error-error
//         window.maptalks.VideoMask = VideoMask;
//         // @ts-expect-error-error
//         window.maptalks.BoxInsideClipMask = BoxInsideClipMask;
//         // @ts-expect-error-error
//         window.maptalks.BoxOutsideClipMask = BoxOutsideClipMask;
//         // @ts-expect-error-error
//         window.maptalks.RayCaster = RayCaster;
//     }
// }
