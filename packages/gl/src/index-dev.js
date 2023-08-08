import createREGL from '@maptalks/regl';
import * as reshader from '@maptalks/reshader.gl';

export {
    glMatrix,
    mat2, mat2d, mat3, mat4,
    quat, quat2,
    vec2, vec3, vec4,
} from 'gl-matrix';
export { createREGL, reshader };

import GroupGLLayer from './layer/GroupGLLayer';
import GroundPainter from './layer/GroundPainter';
import './light/MapLights.js';
import './map/MapPostProcess.js';

import * as HighlightUtil from './layer/util/highlight.js';
export { GroupGLLayer, GroundPainter, HighlightUtil };

export { default as HeatmapProcess } from './layer/HeatmapProcess';
export { GLContext } from '@maptalks/fusiongl';
import MaskLayerMixin from './layer/mask/MaskLayerMixin.js';
import MaskRendererMixin from './layer/mask/MaskRendererMixin.js';
export { MaskLayerMixin, MaskRendererMixin };
import ClipInsideMask from './layer/mask/ClipInsideMask.js';
import ClipOutsideMask from './layer/mask/ClipOutsideMask.js';
import FlatInsideMask from './layer/mask/FlatInsideMask.js';
import FlatOutsideMask from './layer/mask/FlatOutsideMask.js';
import ColorMask from './layer/mask/ColorMask.js';
import VideoMask from './layer/mask/VideoMask.js';
import ElevateMask from './layer/mask/ElevateMask.js';
import BoxInsideClipMask from './layer/mask/BoxInsideClipMask.js';
import BoxOutsideClipMask from './layer/mask/BoxOutsideClipMask.js';
export { ClipInsideMask, ClipOutsideMask, FlatInsideMask, FlatOutsideMask, ElevateMask, ColorMask, VideoMask, BoxInsideClipMask, BoxOutsideClipMask };

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
    }
}

import transcoders from '../src/transcoders';
export { transcoders };


import * as maptalks from 'maptalks';
import chunk from '../build/worker.js';
maptalks.registerWorkerAdapter('@maptalks/terrain', chunk);
