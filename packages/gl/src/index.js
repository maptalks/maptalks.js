import createREGL from '@maptalks/regl';
import * as reshader from '@maptalks/reshader.gl';

import GroupGLLayer from './layer/GroupGLLayer';
import GroundPainter from './layer/GroundPainter';
import ViewshedAnalysis from './analysis/ViewshedAnalysis';
import FloodAnalysis from './analysis/FloodAnalysis';
import SkylineAnalysis  from './analysis/SkylineAnalysis';
import './light/MapLights.js';
import './map/MapPostProcess.js';

export {
    glMatrix,
    mat2, mat2d, mat3, mat4,
    quat, quat2,
    vec2, vec3, vec4,
} from 'gl-matrix';
export { createREGL, reshader };
export { GroupGLLayer, GroundPainter };

export { default as HeatmapProcess } from './layer/HeatmapProcess';
export { GLContext } from '@maptalks/fusiongl';
export { ViewshedAnalysis };
export { FloodAnalysis };
export { SkylineAnalysis };

if (typeof window !== 'undefined') {
    // append GroupGLLayer on maptalks manually
    if (window.maptalks) {
        window.maptalks.GroupGLLayer = GroupGLLayer;
        window.maptalks.ViewshedAnalysis = ViewshedAnalysis;
        window.maptalks.FloodAnalysis = FloodAnalysis;
        window.maptalks.SkylineAnalysis = SkylineAnalysis;
    }
}
