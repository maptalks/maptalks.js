import * as gltf from '@maptalks/gltf-loader';
import GLTFPack from './gltf/GLTFPack';

export function getJSON(url, options) {
    return gltf.Ajax.getJSON(url, options);
}

export function getArrayBuffer(url, options) {
    return gltf.Ajax.getArrayBuffer(url, options);
}

export function load(url) {
    const index = url.lastIndexOf('/');
    const root = url.slice(0, index);
    const postfix = url.slice(url.lastIndexOf('.')).toLowerCase();
    if (postfix === '.gltf') {
        return getJSON(url, {}).then(json => {
            return load(root, json);
        });
    } else if (postfix === '.glb') {
        return getArrayBuffer(url, {}).then(bin => {
            return load(root, { buffer : bin.data, byteOffset : 0 });
        });
    }
    return null;
}

export function exportGLTFPack(gltf, regl) {
    const gltfpack = new GLTFPack(gltf, regl);
    return gltfpack;
}

// export function load(root, options) {
//     const loader = new gltf.GLTFLoader(root, options);
//     return loader.load();
// }
