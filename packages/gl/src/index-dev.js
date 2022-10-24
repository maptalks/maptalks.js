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

export * as HighlightUtil from './layer/util/highlight.js';
export { GroupGLLayer, GroundPainter };

export { default as HeatmapProcess } from './layer/HeatmapProcess';
export { GLContext } from '@maptalks/fusiongl';

if (typeof window !== 'undefined') {
    // append GroupGLLayer on maptalks manually
    if (window.maptalks) {
        window.maptalks.GroupGLLayer = GroupGLLayer;
    }
}

import transcoders from '../src/transcoders';
export { transcoders };


import * as maptalks from 'maptalks';
import chunk from '../build/worker.js';
maptalks.registerWorkerAdapter('@maptalks/terrain', chunk);
