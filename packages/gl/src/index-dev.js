import transcoders, { registerGLTFLoaderBundle } from './transcoders';
export { transcoders };
import { gltfLoaderExport } from  '../build/gltf-loader-bundle.js';
registerGLTFLoaderBundle(gltfLoaderExport);

import createREGL from '@maptalks/regl';
import * as reshader from '@maptalks/reshader.gl';

export {
    glMatrix,
    mat2, mat2d, mat3, mat4,
    quat, quat2,
    vec2, vec3, vec4,
} from '@maptalks/reshader.gl';
export { createREGL, reshader };

export * from './index.ts';



import * as maptalks from 'maptalks';
import chunk from '../build/worker.js';
maptalks.registerWorkerAdapter('@maptalks/terrain', chunk);
