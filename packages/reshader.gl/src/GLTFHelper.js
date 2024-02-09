import * as gltf from '@maptalks/gltf-loader';
import GLTFPack from './gltf/GLTFPack';

// options.fetchOptions
// options.gltfLoaderOptions
export function load(url, options) {
    const { fetchOptions, gltfLoaderOptions } = options;
    const index = url.lastIndexOf('/');
    const root = url.slice(0, index);
    const postfix = url.slice(url.lastIndexOf('.')).toLowerCase();
    if (postfix === '.gltf') {
        return gltf.Ajax.getJSON(url, fetchOptions).then(json => {
            return loadGLTF(root, json, gltfLoaderOptions);
        });
    } else if (postfix === '.glb') {
        return gltf.Ajax.getArrayBuffer(url, fetchOptions).then(bin => {
            return loadGLTF(root, { buffer : bin.data, byteOffset : 0 }, gltfLoaderOptions);
        });
    }
    return null;
}

export function exportGLTFPack(gltf, regl) {
    const gltfpack = new GLTFPack(gltf, regl);
    return gltfpack;
}

export function loadGLTF(root, gltf, gltfLoaderOptions) {
    const loader = new gltf.GLTFLoader(root, gltf, gltfLoaderOptions);
    return loader.load();
}
