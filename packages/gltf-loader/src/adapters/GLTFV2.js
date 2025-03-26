import { GL_LINEAR, GL_NEAREST, GL_NEAREST_MIPMAP_NEAREST, GL_NEAREST_MIPMAP_LINEAR, GL_LINEAR_MIPMAP_LINEAR } from '../common/Constants.js';
import { defined, extend, btoa } from '../common/Util.js';
import Accessor from '../core/Accessor.js';
import GLTFAdapter from './GLTFAdapter';

// GLTF 2.0 adapter
// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0
export default class V2 extends GLTFAdapter {
    constructor(rootPath, gltf, glbBuffer, requestImage, decoders, supportedFormats, fetchOptions, urlModifier) {
        super(requestImage, decoders, supportedFormats, fetchOptions, urlModifier);
        this.rootPath = rootPath;
        this.gltf = gltf;
        this.glbBuffer = glbBuffer;
        this.buffers = {};
        this.requests = {};
        this.accessor = new Accessor(rootPath, gltf, glbBuffer, fetchOptions, urlModifier);
    }

    iterate(cb, propertyName) {
        const properties = this.gltf[propertyName];
        if (!properties) {
            return;
        }
        for (let i = 0; i < properties.length; i++) {
            cb(i, properties[i], i);
        }
    }

    createNode(nodeJSON) {
        // camera	integer	The index of the camera referenced by this node.	No
        // children	integer [1-*]	The indices of this node's children.	No
        // skin	integer	The index of the skin referenced by this node.	No
        // matrix	number [16]	A floating-point 4x4 transformation matrix stored in column-major order.	No, default: [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]
        // mesh	integer	The index of the mesh in this node.	No
        // rotation	number [4]	The node's unit quaternion rotation in the order (x, y, z, w), where w is the scalar.	No, default: [0,0,0,1]
        // scale	number [3]	The node's non-uniform scale, given as the scaling factors along the x, y, and z axes.	No, default: [1,1,1]
        // translation	number [3]	The node's translation along the x, y, and z axes.	No, default: [0,0,0]
        // weights	number [1-*]	The weights of the instantiated Morph Target. Number of elements must match number of Morph Targets of used mesh.	No
        // name	string	The user-defined name of this object.	No
        // extensions	object	Dictionary object with extension-specific objects.	No
        // extras	any	Application-specific data.	No

        const node = {};
        extend(node, nodeJSON);
        // if (defined(nodeJSON.name)) node.name = nodeJSON.name;
        // if (defined(nodeJSON.children)) node.children = nodeJSON.children;
        // if (defined(nodeJSON.matrix)) node.matrix = nodeJSON.matrix;
        // if (defined(nodeJSON.rotation)) node.rotation = nodeJSON.rotation;
        // if (defined(nodeJSON.scale)) node.scale = nodeJSON.scale;
        // if (defined(nodeJSON.translation)) node.translation = nodeJSON.translation;
        // if (defined(nodeJSON.extras)) node.extras = nodeJSON.extras;
        if (!defined(nodeJSON.weights) && this.gltf.meshes && defined(node.mesh)) {
            node.weights = this.gltf.meshes[node.mesh].weights;
        } else if (nodeJSON.weights) {
            node.weights = nodeJSON.weights;
        }
        //TODO 还缺 camera, skeletons, skin, extensions, weights 的解析
        return node;
    }

    //get texture by index
    _getTexture(index) {
        const texture = this.gltf.textures[index];
        if (!texture) {
            return null;
        }
        // https://github.com/KhronosGroup/glTF/blob/bcd622b26fa785e0bb0e8a89104087d6f24478ba/extensions/2.0/Vendor/EXT_texture_webp/README.md
        let source = texture.source;
        if (texture.extensions && texture.extensions['EXT_texture_webp']) {
            source = texture.extensions['EXT_texture_webp'].source;
        } else if (texture.extensions && texture.extensions['KHR_texture_basisu']) {
            source = texture.extensions['KHR_texture_basisu'].source;
        }
        if (!defined(source)) {
            return null;
        }
        const image = this.gltf.images[source];//get image object by source index
        const promise = this._loadImage(image);
        return promise.then(response => {
            if (!response) {
                return null;
            }
            const out = {
                image: {
                    array: response.data,
                    mipmap: response.mipmap,
                    width: response.width,
                    height: response.height,
                    index: texture.source,
                    mimeType: image.mimeType,
                    name: image.name,
                    extensions: image.extensions,
                    extras: image.extras
                }
            };
            extend(out, texture);
            // delete out.sampler;
            const sampler = defined(texture.sampler) ? this.gltf.samplers[texture.sampler] : undefined;
            if (sampler) {
                out.sampler = sampler;
                out.sampler.magFilter = sampler.magFilter || GL_LINEAR;
                out.sampler.minFilter = sampler.minFilter || GL_LINEAR_MIPMAP_LINEAR;
                out.sampler.wrapS = sampler.wrapS || 10497;
                out.sampler.wrapT = sampler.wrapT || 10497;
            }
            if (out.image.mimeType === 'image/ktx2' && !out.image.mipmap && out.sampler && out.sampler.minFilter !== GL_LINEAR && out.sampler.minFilter !== GL_NEAREST) {
                const minFilter = out.sampler.minFilter;
                if (minFilter === GL_NEAREST_MIPMAP_NEAREST || minFilter === GL_NEAREST_MIPMAP_LINEAR) {
                    out.sampler.minFilter = GL_NEAREST;
                } else {
                    out.sampler.minFilter = GL_LINEAR;
                }
            }
            if (response.format) {
                out.format = response.format;
            }
            return out;
        });
    }

    _loadImage(source) {
        if (defined(source.bufferView)) {
            const bufferView = this.gltf.bufferViews[source.bufferView];
            //如果bufferView对应的数据已经解析过，则直接使用
            //获取指向gltf中的buffers对象
            const buffer = this.gltf.buffers[bufferView.buffer];
            //如果所指向的buffer对象里有uri指向得数据，则直接从uri里面读取，否则如果glbBuffer存在，则从glbBuffer读取
            if (buffer.uri) {
                return this.requestImageFromBufferURI(buffer, bufferView, source);
            }
            if (this.glbBuffer) {
                return this._requestFromGlbBuffer(bufferView, source);
            }
        } else {
            //从外部图片获取
            return this.requestExternalImage(source);
        }
        return null;
    }


    _requestFromGlbBuffer(bufferView, source) {
        const dataview = this._createDataView(bufferView, this.glbBuffer.buffer, this.glbBuffer.byteOffset);
        return this.getImageByBuffer(dataview, source);
    }

    _createDataView(bufferView, bufferData, byteOffset) {
        byteOffset = !byteOffset ? 0 : byteOffset;
        const start = (bufferView.byteOffset || 0) + byteOffset;
        const length = bufferView.byteLength;
        const dataView = new Uint8Array(bufferData, start, length);
        return dataView;
    }

    //根据将ArrayBuffer转换成base64
    _transformArrayBufferToBase64(array, mimeType) {
        const binary = new Array(array.byteLength);
        for (let i = 0; i < array.byteLength; i++) {
            binary[i] = String.fromCharCode(array[i]);
        }
        binary.join('');
        mimeType = !mimeType ? 'image/png' : mimeType;
        const buffer = unescape(encodeURIComponent(binary));
        const base64Url = 'data:' + mimeType + ';base64,' + btoa(buffer);
        return base64Url;
    }

    //resolved data from accessors for samplers by its item's index
    getAnimations(animations) {
        const promises = [];
        animations.forEach(animation => {
            promises.push(this.getSamplers(animation.samplers));
        });
        return Promise.all(promises).then(assets => {
            for (let i = 0; i < assets.length; i++) {
                animations[i].samplers = assets[i];
            }
            return animations;
        });
    }

    //https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#reference-animation-sampler
    getSamplers(samplers) {
        const promises = [];
        for (let i = 0; i < samplers.length; i++) {
            if (!defined(samplers[i].input) && !defined(samplers[i].output))
                continue;
            promises.push(this.accessor._requestData('input', samplers[i].input));
            promises.push(this.accessor._requestData('output', samplers[i].output));
        }
        return Promise.all(promises).then(assets => {
            for (let i = 0; i < assets.length / 2; i++) {
                samplers[i].input = assets[i * 2];
                samplers[i].output = assets[i * 2 + 1];
                //sampler's default interpolation is 'LINEAR'
                if (!samplers[i].interpolation) {
                    samplers[i].interpolation = 'LINEAR';
                }
            }
            return samplers;
        });
    }
}
