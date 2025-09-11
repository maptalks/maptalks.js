import { getGLTFLoaderBundle } from './common/GLTFBundle'
import GLTFPack from './gltf/GLTFPack';

// options.fetchOptions
// options.gltfLoaderOptions
export function load(url, options) {
    const { Ajax } = getGLTFLoaderBundle();
    const { fetchOptions, gltfLoaderOptions, urlModifier } = options;
    const loaderOptions = gltfLoaderOptions || {};
    loaderOptions.urlModifier = urlModifier;
    const index = url.lastIndexOf('/');
    const root = url.slice(0, index);
    const postfix = url.slice(url.lastIndexOf('.')).toLowerCase();
    if (postfix === '.gltf') {
        return Ajax.getJSON(url, fetchOptions, urlModifier).then(json => {
            return loadGLTF(root, json, loaderOptions);
        });
    } else if (postfix === '.glb') {
        return Ajax.getArrayBuffer(url, fetchOptions, urlModifier).then(bin => {
            return loadGLTF(root, { buffer : bin.data, byteOffset : 0 }, loaderOptions);
        });
    }
    return null;
}

export function exportGLTFPack(gltf, regl) {
    const gltfpack = new GLTFPack(gltf, regl);
    return gltfpack;
}

export function loadGLTF(root, gltf, loaderOptions) {
    const { GLTFLoader } = getGLTFLoaderBundle();
    const loader = new GLTFLoader(root, gltf, loaderOptions);
    return loader.load();
}
