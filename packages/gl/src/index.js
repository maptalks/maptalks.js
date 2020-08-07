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
export { GroupGLLayer };
export { default as HeatmapProcess } from './layer/HeatmapProcess';
export { GLContext } from '@maptalks/fusiongl';
import ViewshedAnalysis from './analysis/ViewshedAnalysis';
export { ViewshedAnalysis };
import FloodAnalysis from './analysis/FloodAnalysis';
export { FloodAnalysis };
import SkylineAnalysis  from './analysis/SkylineAnalysis';
export { SkylineAnalysis };
import './light/MapLights.js';
import './map/MapPostProcess.js';

if (typeof window !== 'undefined') {
    // append GroupGLLayer on maptalks manually
    if (window.maptalks) {
        window.maptalks.GroupGLLayer = GroupGLLayer;
        window.maptalks.ViewshedAnalysis = ViewshedAnalysis;
        window.maptalks.FloodAnalysis = FloodAnalysis;
        window.maptalks.SkylineAnalysis = SkylineAnalysis;
    }
}
