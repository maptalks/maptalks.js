import * as gltf from '@maptalks/gltf-loader';
import GLTFPack from './gltf/GLTFPack';

export function getJSON(url, options) {
    return gltf.Ajax.getJSON(url, options);
}

export function getArrayBuffer(url, options) {
    return gltf.Ajax.getArrayBuffer(url, options);
}

export function exportGLTFPack(gltf, regl) {
    const gltfpack = new GLTFPack(gltf, regl);
    return gltfpack;
}

export function load(root, options) {
    const loader = new gltf.GLTFLoader(root, options);
    return loader.load();
}
