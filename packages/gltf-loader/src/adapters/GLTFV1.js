import GLTFAdapter from './GLTFAdapter';
import { defined, getMatrix } from '../common/Util.js';
import Accessor from '../core/Accessor.js';

// GLTF 1.0 adapter
// https://github.com/KhronosGroup/glTF/tree/master/specification/1.0
export default class V1 extends GLTFAdapter {
    constructor(rootPath, gltf, glbBuffer, requestImage, decoders, supportedFormats, fetchOptions, urlModifier) {
        super(requestImage, decoders, supportedFormats, fetchOptions, urlModifier);
        this.rootPath = rootPath;
        this.gltf = gltf;
        this.requests = {};
        this.buffers = {};
        this.glbBuffer = glbBuffer;
        this.accessor = new Accessor(rootPath, gltf, glbBuffer, fetchOptions, urlModifier);
    }

    iterate(cb, propertyName) {
        const properties = this.gltf[propertyName];
        if (!properties) {
            return;
        }
        let index = 0;
        for (const p in properties) {
            cb(p, properties[p], index++);
        }
    }

    createNode(nodeJSON) {
        // camera	string	The ID of the camera referenced by this node.	No
        // children	string[]	The IDs of this node's children.	No, default: []
        // skeletons	string[]	The ID of skeleton nodes.	No
        // skin	string	The ID of the skin referenced by this node.	No
        // jointName	string	Name used when this node is a joint in a skin.	No
        // matrix	number[16]	A floating-point 4x4 transformation matrix stored in column-major order.	No, default: [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]
        // meshes	string[]	The IDs of the mesh objects in this node.	No
        // rotation	number[4]	The node's unit quaternion rotation in the order (x, y, z, w), where w is the scalar.	No, default: [0,0,0,1]
        // scale	number[3]	The node's non-uniform scale.	No, default: [1,1,1]
        // translation	number[3]	The node's translation.	No, default: [0,0,0]
        // name	string	The user-defined name of this object.	No
        // extensions	object	Dictionary object with extension-specific objects.	No
        // extras	any	Application-specific data.	No

        const node = {};
        if (defined(nodeJSON.name)) node.name = nodeJSON.name;
        if (defined(nodeJSON.children)) node.children = nodeJSON.children;
        if (defined(nodeJSON.jointName)) node.jointName = nodeJSON.jointName;
        if (defined(nodeJSON.matrix)) node.matrix = nodeJSON.matrix;
        if (defined(nodeJSON.rotation)) node.rotation = nodeJSON.rotation;
        if (defined(nodeJSON.scale)) node.scale = nodeJSON.scale;
        if (defined(nodeJSON.translation)) node.translation = nodeJSON.translation;
        if (defined(nodeJSON.extras)) node.extras = nodeJSON.extras;
        if (defined(nodeJSON.meshes)) {
            // node.meshes = nodeJSON.meshes.map(m => meshes[m]);
            node.mesh = nodeJSON.meshes[0];
        }
        if (node.translation || node.rotation || node.scale) {
            const matrix = getMatrix([], node);
            delete node.translation;
            delete node.rotation;
            delete node.scale;
            node.matrix = matrix;
        }
        //TODO 还缺 camera, skeletons, skin, extensions 的解析
        return node;
    }

    _loadMaterials(materials) {
        const out = {};
        for (const p in materials) {
            const mat = materials[p];
            let tech, texId;
            if (mat['instanceTechnique'] && mat['instanceTechnique'].values) {
                tech = mat['instanceTechnique'];
                texId = tech.values['diffuse'];
            } else {
                tech = mat;
                texId = tech.values['tex'] || tech.values['diffuseTex'] || tech.values['diffuse'];
            }
            const output = {
                'baseColorTexture': {
                    index: texId
                }
            };
            if (mat.name) {
                output.name = mat.name;
            }
            if (mat.extensions) {
                output.extensions = mat.extensions;
            }
            if (mat.extras) {
                output.extras = mat.extras;
            }
            out[p] = output;
        }
        return out;
    }

    _loadImage(source) {
        if (source.bufferView || source.extensions && (source.extensions['KHR_binary_glTF'] || source.extensions['binary_glTF'])) {
            const binary = source.bufferView ? source : source.extensions['KHR_binary_glTF'] || source.extensions['binary_glTF'];
            if (source.extensions) {
                source.mimeType = binary.mimeType;
                source.width = binary.width;
                source.height = binary.height;
            }
            const bufferView = this.gltf.bufferViews[binary.bufferView];
            const start = (bufferView.byteOffset || 0) + this.glbBuffer.byteOffset;
            const length = bufferView.byteLength;
            const buffer = this.buffers[binary.bufferView] = new Uint8Array(this.glbBuffer.buffer, start, length);
            return this.getImageByBuffer(buffer, source);
        } else {
            return this.requestExternalImage(source);
        }
    }

    // _loadMaterial(primJSON) {
    //     const material = primJSON.material;
    //     //version 1
    //     const texture = this.adapter.getBaseColorTexture(material);
    //     if (!texture) {
    //         return null;
    //     }
    //     const promise = this._loadImage(texture.source);
    //     return promise.then(image => {
    //         const source = texture.source;
    //         //record index of the image, to reuse it as possible
    //         image.index = source;
    //         texture.source.image = image;
    //         // if (source.uri) texture.source.uri = source.uri;
    //         // if (source.name) texture.source.name = source.name;
    //         // if (source.extensions) texture.source.extensions = source.extensions;
    //         // if (source.extras) texture.source.extras = source.extras;
    //         // if (source.mimeType) texture.source.mimeType = source.mimeType;
    //         // if (source.width) texture.source.width = source.width;
    //         // if (source.height) texture.source.height = source.height;
    //         const result = {
    //             baseColorTexture : texture
    //             //TODO 其他材质的读取
    //         };
    //         if (material.name) result.name = material.name;
    //         if (material.extensions) result.extensions = material.extensions;
    //         if (result.extensions) {
    //             delete result.extensions['KHR_binary_glTF'];
    //             delete result.extensions['binary_glTF'];
    //             if (Object.keys(result.extensions).length === 0) {
    //                 delete result.extensions;
    //             }
    //         }
    //         if (material.extras) result.extras = material.extras;
    //         return {
    //             material : result,
    //         };
    //     });
    // }

    _getTexture(texId) {
        const texture = this.gltf.textures[texId];
        if (!texture) {
            return null;
        }
        const source = this.gltf.images[texture.source];
        const promise = this._loadImage(source);

        return promise.then(image => {
            //record index of the image, to reuse it as possible
            const sampler = this.gltf.samplers[texture.sampler];
            const out = {
                image: {
                    array : image.data,
                    width : image.width,
                    height : image.height,
                    index : texture.source,
                    mimeType : source.mimeType,
                    name : source.name,
                    extras : source.extras
                },
                sampler
            };
            return out;
        });
    }

    getBaseColorTexture(index) {
        const material = this.gltf.materials[index];
        let tech, texId;
        if (material['instanceTechnique'] && material['instanceTechnique'].values) {
            tech = material['instanceTechnique'];
            texId = tech.values['diffuse'];
        } else {
            tech = material;
            texId = tech.values['tex'] || tech.values['diffuseTex'] || tech.values['diffuse'];
        }
        if (texId === undefined || this.gltf.textures === undefined) {
            return null;
        }
        const texture = this.gltf.textures[texId];
        if (!texture) {
            return null;
        }
        const sampler = this.gltf.samplers[texture.sampler];
        const info = {
            format : texture.format || 6408,
            internalFormat : texture.internalFormat || 6408,
            type : texture.type || 5121,
            sampler,
            source : this.gltf.images[texture.source]
        };
        return info;
    }

    getMaterial() {
        return null;
    }

    getAnimations() {
        return null;
    }
}
