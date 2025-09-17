// transcoders必须要在reshader.gl之前import，否则reshader.gl无法识别到GLTFLoader
import transcoders, { registerGLTFLoaderBundle } from '../../gl/src/transcoders';
export { transcoders };
import { gltfLoaderExport } from  '../../gl/build/dist/gltf-loader-bundle.js';
registerGLTFLoaderBundle(gltfLoaderExport);

import createREGL from '@maptalks/regl';

export {
    mat2, mat2d, mat3, mat4,
    quat, quat2,
    vec2, vec3, vec4,
} from 'gl-matrix';
export { createREGL };

export * from './dist/gpu/gpu.es.js';


import * as maptalks from 'maptalks';
import chunk from '../../gl/build/dist/worker.js';
maptalks.registerWorkerAdapter('@maptalks/terrain', chunk);
