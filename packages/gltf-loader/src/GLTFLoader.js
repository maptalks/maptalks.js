import GLTFV1 from './adapters/GLTFV1.js';
import GLTFV2 from './adapters/GLTFV2.js';
import Accessor from './core/Accessor.js';
import GLBReader from './GLBReader.js';
import { defined, extend, isNumber, isString, getTypedArrayCtor, readInterleavedArray } from './common/Util.js';
import AnimationClip from './core/AnimationClip.js';
import { vec3 } from 'gl-matrix';

let supportOffscreenLoad = false;
if (typeof OffscreenCanvas !== 'undefined') {
    let ctx;
    try {
        ctx = new OffscreenCanvas(2, 2).getContext('2d');
    } catch (err) {
        //nothing need to do
    }
    if (ctx && typeof createImageBitmap !== 'undefined') {
        supportOffscreenLoad = true;
    }
}

const canvas = typeof document === 'undefined' ? null : document.createElement('canvas');

export default class GLTFLoader {
    constructor(rootPath, gltf, options) {
        this.options = options || {};
        if (!this.options.decoders) {
            this.options.decoders = {};
        }
        this._fetchOptions = this.options.fetchOptions || {};
        if (gltf.buffer instanceof ArrayBuffer) {
            const { json, glbBuffer } = GLBReader.read(gltf.buffer, gltf.byteOffset, gltf.byteLength);
            this._init(rootPath, json, glbBuffer);
        } else {
            this._init(rootPath, gltf);
        }
        this._accessor = new Accessor(this.rootPath, this.gltf, this.glbBuffer, this._fetchOptions, this.options.urlModifier);
        this._checkExtensions();
    }

    _checkExtensions() {
        const extensionsRequired = this.gltf['extensionsRequired'];
        if (extensionsRequired) {
            if (extensionsRequired.indexOf('KHR_draco_mesh_compression') >= 0 && !this.options.decoders['draco']) {
                throw new Error('KHR_draco_mesh_compression is required but @maptalks/transcoders.draco is not loaded');
            }
            if (extensionsRequired.indexOf('KHR_texture_basisu') >= 0 && !this.options.decoders['image/ktx2']) {
                throw new Error('KHR_texture_basisu is required but @maptalks/transcoders.ktx2 is not loaded');
            }
            if (extensionsRequired.indexOf('EXT_meshopt_compression') >= 0) {
                throw new Error('EXT_meshopt_compression extension is not supported yet.');
            }
        }
    }

    _loadExtensions() {
        const extensions = this.gltf['extensions'];
        if (!extensions || !extensions['KHR_techniques_webgl']) {
            return Promise.resolve(extensions);
        }
        return this._accessor.requestKHRTechniquesWebgl(extensions['KHR_techniques_webgl']).then(extension  => {
            extensions['KHR_techniques_webgl'] = extension;
            return extensions;
        });
    }

    _convertKhrTechiqueToTechiques() {
        // convert extension KHR_technique_webgl (don't have "s") to KHR_techniques_webgl
        if (!this.gltf['programs']) {
            return;
        }
        const materials = this.gltf.materials;
        for (let i = 0; i < materials.length; i++) {
            if (materials[i] && materials[i].extensions && materials[i].extensions['KHR_technique_webgl']) {
                materials[i].extensions['KHR_techniques_webgl'] = materials[i].extensions['KHR_technique_webgl'];
                delete materials[i].extensions['KHR_technique_webgl'];
            }
        }

        const extensions = this.gltf.extensions || {};
        const techniques = this.gltf.techniques;
        extensions['KHR_techniques_webgl'] = {
            programs: this.gltf.programs,
            shaders: this.gltf.shaders,
            techniques: techniques
        };

        for (let i = 0; i < materials.length; i++) {
            const techValues = getTechniqueValues(materials[i]);
            if (techValues) {
                const { values, technique: techIndex } = techValues;
                const technique = techniques[techIndex];
                if (!technique || !values) {
                    continue;
                }
                const { uniforms, parameters } = technique;
                const realValues = {};
                for (const p in values) {
                    const uniName = findUniformName(uniforms, p);
                    realValues[uniName] = values[p];
                    if (parameters[p] && parameters[p].type === 35678) {
                        // texture
                        realValues[uniName] = { index: values[p] };
                    }
                }
                techValues.values = realValues;
            }
        }

        for (let i = 0; i < techniques.length; i++) {
            const technique = techniques[i];
            if (!technique) { continue; }
            const { attributes, uniforms, parameters } = technique;
            if (attributes) {
                for (const p in attributes) {
                    const param = attributes[p];
                    attributes[p] = parameters[param];
                }
            }
            if (uniforms) {
                for (const p in uniforms) {
                    const param = uniforms[p];
                    uniforms[p] = parameters[param];
                }
            }
            delete technique.parameters;
        }

        delete this.gltf.programs;
        delete this.gltf.shaders;
        delete this.gltf.techniques;
        this.gltf.extensions = extensions;
        return extensions;
    }

    load(options) {
        options = options || {};
        // this._initTexture();
        this._convertKhrTechiqueToTechiques();
        const gltf = this._loadScene(options);
        const animations = this._loadAnimations();
        const textures = this._loadTextures();
        const extensions = this._loadExtensions();
        return Promise.all([gltf, animations, textures, extensions]).then(fullfilled => {
            fullfilled[0].animations = fullfilled[1];
            fullfilled[0].textures = fullfilled[2];
            fullfilled[0].extensions = fullfilled[3];
            fullfilled[0].transferables = this.transferables || [];
            //预先将channels以key-value的形式存储起来，提高查找效率
            this.createChannelsMap(fullfilled[0]);
            return fullfilled[0];
        });
    }

    createChannelsMap(gltf) {
        const animations = gltf.animations;
        if (animations) {
            for (let i = 0; i < animations.length; i++) {
                const animation = animations[i];
                animation.channelsMap = {};
                for (let j = 0; j < animation.channels.length; j++) {
                    const channel = animation.channels[j];
                    if (!animation.channelsMap[channel.target.node]) {
                        animation.channelsMap[channel.target.node] = [];
                    }
                    animation.channelsMap[channel.target.node].push(channel);
                }
            }
        }
    }

    getExternalResources() {
        const resources = [];
        if (this.gltf) {
            const { buffers, images } = this.gltf;
            for (let i = 0; i < buffers.length; i++) {
                //https://github.com/KhronosGroup/glTF-Tutorials/issues/21
                if (buffers[i].uri && buffers[i].uri.indexOf('data:application/octet-stream;base64') < 0) {
                    resources.push({
                        type: 'buffer',
                        uri: buffers[i].uri
                    });
                }
            }
            for (let i = 0; i < images.length; i++) {
                if (images[i].uri && images[i].uri.indexOf('data:image/') < 0) {
                    resources.push({
                        type: 'image',
                        uri: images[i].uri
                    });
                }
            }
        }
        return resources;
    }

    static getAnimationClip(gltf, node, time, name) {
        return AnimationClip.getAnimationClip(gltf, node, time, name);
    }

    static getAnimationTimeSpan(gltf, name) {
        return AnimationClip.getTimeSpanByName(gltf, name);
    }

    static getTypedArrayCtor(componentType) {
        return getTypedArrayCtor(componentType);
    }

    static readInterleavedArray(out, arrayBuffer, count, size, stride, byteOffset, componentType) {
        return readInterleavedArray(out, arrayBuffer, count, size, stride, byteOffset, componentType);
    }

    _init(rootPath, gltf, glbBuffer) {
        this.gltf = gltf;
        this.glbBuffer = glbBuffer;
        this.version = gltf.asset ? +gltf.asset.version : 1;
        this.rootPath = rootPath;
        this.buffers = {};
        this.requests = {};
        // this.options.requestImage = this.options.requestImage ? this.options.requestImage : (supportOffscreenLoad ? requestImageOffscreen.bind(this) : requestImage);
        this.options.requestImage = supportOffscreenLoad ? requestImageOffscreen.bind(this) : this.options.requestImage || requestImage;
        if (this.options['transferable']) {
            //用于在worker中解析gltf
            this.transferables = [];
        }
        //在修改莆田osgb => box模型的bug时，发现不同gltf版本对glbBuffer的offset处理方式不同
        //2.0中要忽略glbBuffer的byteOffset
        //1.0中不能忽略
        if (this.version === 2) {
            this.adapter = new GLTFV2(rootPath, gltf, glbBuffer, this.options.requestImage, this.options.decoders || {}, this.options.supportedFormats || {}, this._fetchOptions, this.options.urlModifier);
            // NOTE: buffer.id和image.id都会作为GLTFV2.requests的key，用前缀加以区分
            this.adapter.iterate((_key, buffer, index) => {
                buffer.id = 'buffer_' + index;
            }, 'buffers');
            // NOTE: image.bufferView(如果存在)也会作为GLTFV2.images的key，用前缀加以区分
            this.adapter.iterate((_key, image, index) => {
                image.id = 'image_' + index;
            }, 'images');
            this.adapter.iterate((_key, accessor, index) => {
                accessor.id = 'accessor_' + index;
            }, 'accessors');
        } else {
            this.adapter = new GLTFV1(rootPath, gltf, glbBuffer, this.options.requestImage, this.options.decoders || {}, this.options.supportedFormats || {}, this._fetchOptions, this.options.urlModifier);
            this.adapter.iterate((_key, accessor, index) => {
                accessor.id = 'accessor_' + index;
            }, 'accessors');
            this.adapter.iterate((_key, image, index) => {
                image.id = 'image_' + index;
            }, 'images');
        }
    }

    // _loadImages()

    //V1和V2需要实现的方法
    // iterateMesh, iterateNode,

    _parseNodes(node, nodeMap) {
        if (node.children && node.children.length > 0) {
            if (!isNumber(node.children[0]) && !isString(node.children[0])) {
                return node;
            }
            const children = node.children.map((c) => {
                const childNode = nodeMap[c];
                childNode.nodeIndex = c;
                return this._parseNodes(childNode, nodeMap);
            });
            node.children = children;
        }
        return node;
    }

    _loadScene(options) {
        return this._loadNodes(options).then(nodeMap => {
            const scenes = this.scenes = [];
            let defaultScene;
            for (const index in nodeMap) {
                nodeMap[index] = this._parseNodes(nodeMap[index], nodeMap);
                nodeMap[index].nodeIndex = Number(index) ? Number(index) : index;
            }
            this.adapter.iterate((key, sceneJSON, idx) => {
                const scene = {};
                if (sceneJSON.name) scene.name = sceneJSON.name;
                if (sceneJSON.nodes) {
                    scene.nodes = sceneJSON.nodes.map(n => {
                        return nodeMap[n];
                    });
                }
                if (this.gltf.scene === key) {
                    defaultScene = idx;
                }
                scenes.push(scene);
            }, 'scenes');
            const gltf = {
                textures: this.gltf.textures,
                asset: this.gltf.asset,
                scene : defaultScene,
                scenes : scenes,
                nodes : nodeMap,
                meshes : this.meshes,
                materials: this.gltf.materials,
                skins : this.skins,
                extensionsRequired: this.gltf.extensionsRequired,
                extensionsUsed: this.gltf.extensionsUsed
            };
            if (this.gltf.extensions) {
                gltf.extensions = this.gltf.extensions;
            }
            if (this.version === 1) {
                const materials = this.adapter._loadMaterials(this.gltf.materials);
                gltf.materials = materials;
            }
            delete this.gltf.buffers;
            gltf.json = this.gltf;
            return gltf;
        });
    }

    _loadNodes(options) {
        // node -> meshes -> primitives ->
        const promise = this._loadMeshes(options);
        return promise.then(() => {
            const nodes = this.nodes = {};
            this.adapter.iterate((key, nodeJSON) => {
                //TODO 缺少 skin， morgh targets 和 extensions
                const node = this.adapter.createNode(nodeJSON, this.meshes, this.skins);
                nodes[key] = node;
            }, 'nodes');
            return nodes;
        });
    }

    _loadSkins() {
        this.skins = [];
        const promises = [];
        this.adapter.iterate((key, skinJSON, index) => {
            promises.push(this._loadSkin(skinJSON).then(skin => {
                skin.index = index;
                this.skins.push(skin);
            }));
        }, 'skins');
        return promises;
    }

    _loadSkin(skin) {
        const inverseBindMatrices = skin.inverseBindMatrices;
        return this.adapter.accessor._requestData('inverseBindMatrices', inverseBindMatrices).then(res => {
            skin.inverseBindMatrices = res;
            if (res && res.buffer && this.transferables && this.transferables.indexOf(res.buffer) < 0) {
                this.transferables.push(res.buffer);
            }
            return skin;
        });
    }

    _loadAnimations() {
        const animations = this.gltf.animations;
        const promise = defined(animations) ? this.adapter.getAnimations(animations) : null;
        return promise;
    }

    _loadMeshes(options) {
        this.meshes = {};
        let promises = [];
        this.adapter.iterate((key, meshJSON, index) => {
            promises.push(this._loadMesh(meshJSON, options).then(mesh => {
                //record mesh's index to reuse it as possible
                mesh.index = index;
                this.meshes[key] = mesh;
                //return mesh;
            }));
        }, 'meshes');
        promises = promises.concat(this._loadSkins());
        return Promise.all(promises);
    }

    _loadMesh(mesh, options) {
        //TODO 解析材质
        const primitives = mesh.primitives; // attributes
        const promises = primitives.map(p => {
            return this._loadPrimitive(p, options);
        }).filter(p => !!p);
        return Promise.all(promises).then(primitives => {
            const out = {};
            extend(out, mesh);
            out.primitives = primitives;
            return out;
        });
    }

    _loadTextures() {
        const textures = this.gltf.textures;
        if (!textures) {
            return null;
        }
        const promises = [];
        for (const i in textures) {
            promises.push(this.adapter._getTexture(i));
        }
        return Promise.all(promises).then(loaded => {
            if (this.transferables) {
                for (let i = 0; i < loaded.length; i++) {
                    const array = loaded[i] && loaded[i].image.array;
                    if (array) {
                        let buffer;
                        if (array instanceof ImageBitmap) {
                            buffer = array;
                        } else {
                            buffer = array.buffer;
                        }
                        if (buffer && this.transferables.indexOf(buffer) < 0) {
                            this.transferables.push(buffer);
                        }
                    }
                }
            }
            if (!Array.isArray(textures)) {
                //v1
                const out = {};
                const keys = Object.keys(textures);
                for (let i = 0; i < loaded.length; i++) {
                    if (loaded[i]) {
                        out[keys[i]] = loaded[i];
                    }
                }
                return out;
            }
            return loaded;
        });
    }

    _loadPrimitive(primJSON, options) {
        // Type	Description	Required
        // attributes	object	A dictionary object, where each key corresponds to mesh attribute semantic and each value is the index of the accessor containing attribute's data.	✅ Yes
        // indices	integer	The index of the accessor that contains the indices.	No
        // material	integer	The index of the material to apply to this primitive when rendering.	No
        // mode	integer	The type of primitives to render.	No, default: 4
        // targets	object [1-*]	An array of Morph Targets, each Morph Target is a dictionary mapping attributes (only POSITION, NORMAL, and TANGENT supported) to their deviations in the Morph Target.	No
        // extensions	object	Dictionary object with extension-specific objects.	No
        // extras	any	Application-specific data.	No

        let promise;
        const promises = [];
        const extensions = primJSON.extensions;
        //targets不是attributes,对于draco和非draco的数据都需要处理
        if (defined(primJSON.targets)) {
            for (let i = 0; i < primJSON.targets.length; i++) {
                const target = primJSON.targets[i];
                for (const attr in target) {
                    const promise = this.adapter.accessor._requestData(`morphTargets_${attr}_${i}`, target[attr]);
                    if (promise) {
                        promises.push(promise);
                    }
                }
            }
        }
        if (extensions && extensions['KHR_draco_mesh_compression']) {
            // 没有载入draco时，如果 KHR_draco_mesh_compression 不在 extensionsRequired 中，则忽略该 primitive
            if (!this.options.decoders['draco'] && (!this.gltf.extensionsRequired || !this.gltf.extensionsRequired.indexOf('KHR_draco_mesh_compression') < 0)) {
                return null;
            }
            const draco = this.options.decoders['draco'];
            const { bufferView: bufferViewIndex, attributes } = extensions['KHR_draco_mesh_compression'];
            const bufferView = this.gltf.bufferViews[bufferViewIndex];
            const p = this._accessor._requestBufferOfBufferView(bufferView).then(buf => {
                // debugger
                const { buffer, byteOffset } = buf;
                let { byteOffset: viewOffset } = bufferView;
                const byteLength = bufferView.byteLength;
                if (!viewOffset) {
                    viewOffset = 0;
                }
                const dataView = new DataView(buffer, byteOffset + viewOffset, byteLength);
                // const dataView = buffer.slice(byteOffset + viewOffset, byteOffset + viewOffset + byteLength);
                const dracoOptions = {
                    attributes,
                    useUniqueIDs: false,
                    skipAttributeTransform: options.skipAttributeTransform
                };
                return draco(dataView, dracoOptions).then(data => {
                    const assets = Object.values(data.attributes);
                    if (data.indices) {
                        assets.push(data.indices);
                    }
                    return assets;
                });
            });
            promises.push(p);
            promise = Promise.all(promises);
        } else {
            const attributes = primJSON.attributes;
            for (const attr in attributes) {
                //e.g.          NORMAL, 0
                const promise = this.adapter.accessor._requestData(attr, attributes[attr]);
                if (promise) {
                    promises.push(promise);
                }
            }

            if (defined(primJSON.indices)) {
                const promise = this.adapter.accessor._requestData('indices', primJSON.indices);
                if (promise) {
                    promises.push(promise);
                }
            }
            promise = Promise.all(promises);
        }



        return promise.then(assets => {
            if (extensions && extensions['KHR_draco_mesh_compression']) {
                //assets的结构可能包含targets, 例如[POSITION_1, POSITION_2,...,[attributes...]]，这里是为了将assets重组成一维数组。
                const targetLength = primJSON.targets ? primJSON.targets.length : 0;
                assets[targetLength] = assets[targetLength].concat(assets.slice(0, targetLength));
                assets = assets[targetLength];
            }
            let indices, morphTargets;
            const attrData = assets.reduce((accumulator, currentValue) => {
                if (currentValue.name === 'indices') {
                    indices = currentValue;
                } else if (currentValue.name.indexOf('morphTargets_') > -1) {
                    morphTargets = morphTargets || {};
                    morphTargets[currentValue.name.slice(13)] = currentValue;
                } else {
                    if (currentValue.name === 'POSITION' && (!currentValue.min || !currentValue.max)) {
                        const min = [Infinity, Infinity, Infinity];
                        const max = [-Infinity, -Infinity, -Infinity];
                        const { itemSize, array } = currentValue;
                        const count = array.length / itemSize;
                        for (let i = 0; i < count; i++) {
                            for (let j = 0; j < itemSize; j++) {
                                const idx = i * itemSize + j;
                                if (array[idx] < min[j]) {
                                    min[j] = array[idx];
                                }
                                if (array[idx] > max[j]) {
                                    max[j] = array[idx];
                                }
                            }
                        }
                        if (currentValue.quantization) {
                            const quantization = currentValue.quantization;
                            const constant = quantization.range / (1 << quantization.quantizationBits);
                            const minValues = quantization.minValues;
                            vec3.scale(min, min, constant);
                            vec3.add(min, min, minValues);
                            vec3.scale(max, max, constant);
                            vec3.add(max, max, minValues);
                        }
                        currentValue.min = min;
                        currentValue.max = max;
                    }
                    accumulator[currentValue.name] = currentValue;
                }
                if (this.transferables && currentValue.array.buffer && this.transferables.indexOf(currentValue.array.buffer) < 0) {
                    this.transferables.push(currentValue.array.buffer);
                }
                return accumulator;
            }, {});
            const primitive = {
                attributes : attrData,
                material: primJSON.material
            };
            if (indices) primitive.indices = indices;
            if (morphTargets) primitive.morphTargets = morphTargets;
            primitive.mode = defined(primJSON.mode) ? primJSON.mode : 4; //default mode is triangles
            if (defined(primJSON.extras)) primitive.extras = primJSON.extras;
            //TODO material 和 targets 没有处理
            return primitive;
        });
    }
}

//默认的image读取方法，可在options中替换，例如由worker传回给主线程解析
function requestImage(url, fetchOptions, cb) {
    const image = new Image();
    image.crossOrigin = '';
    image.onload = () => {
        if (!canvas) {
            cb(new Error('There is no canvas to draw image!'));
            return;
        }
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(image, 0, 0, image.width, image.height);
        const imgData = ctx.getImageData(0, 0, image.width, image.height);
        //TODO, retina may need special operations
        const result = { width : image.width, height : image.height, data : new Uint8Array(imgData.data) };
        cb(null, result);
    };
    image.onerror = function (err) {
        cb(err);
    };
    image.src = url;
}


const requests = [];
const workingRequests = [];
const requestLimit = 30;
let offCanvas, offCtx;
function requestImageOffscreen(url, fetchOptions, cb) {
    if (!offCanvas) {
        offCanvas = new OffscreenCanvas(2, 2);
        offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    }
    let promise = null;
    if (isString(url)) {
        if (this.options.urlModifier) {
            url = this.options.urlModifier(url);
        }
        requests.push([url, fetchOptions, cb, this]);
        loopRequests();
    } else {
        const data = url;
        const blob = new Blob([data]);
        promise = createImageBitmap(blob);
        promise.then(thenMethod.bind(this)).then(res =>{
            cb(null, res);
        }).catch(err => {
            console.warn(err);
            cb(err);
        });
    }
}

function loopRequests() {
    if (!requests.length || workingRequests.length > requestLimit) {
        return;
    }
    const request = requests.shift();
    const [url, fetchOptions, cb, context] = request;
    workingRequests.push(request);
    fetch(url, fetchOptions)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
            // response.blob()方法似乎有内存泄漏
            // 2022-03-09
            const blob = new Blob([new Uint8Array(arrayBuffer)]);
            return createImageBitmap(blob);
        }).then(thenMethod.bind(context)).then(res =>{
            cb.call(context, null, res);
            const index = workingRequests.indexOf(request);
            workingRequests.splice(index, 1);
            loopRequests();
        }).catch(err => {
            console.warn(err);
            cb.call(context, err);
            const index = workingRequests.indexOf(request);
            workingRequests.splice(index, 1);
            loopRequests();
        });
}

function thenMethod(bitmap) {
    let { width, height } = bitmap;
    if (!isPowerOfTwo(width)) {
        width = floorPowerOfTwo(width);
    }
    if (!isPowerOfTwo(height)) {
        height = floorPowerOfTwo(height);
    }
    const maxSize = this.options['maxTextureSize'];
    if (maxSize) {
        width = Math.min(maxSize, width);
        height = Math.min(maxSize, height);
    }
    offCanvas.width = width;
    offCanvas.height = height;
    offCtx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const imgData = offCtx.getImageData(0, 0, width, height);
    return { width, height, data: new Uint8Array(imgData.data) };
}

function isPowerOfTwo(value) {
    return (value & (value - 1)) === 0 && value !== 0;
}


function floorPowerOfTwo(value) {
    return Math.pow(2, Math.floor(Math.log(value) / Math.LN2));
}

function getTechniqueValues(material) {
    return material && material.extensions && material.extensions['KHR_techniques_webgl']
}

function findUniformName(uniforms, value) {
    for (const p in uniforms) {
        if (uniforms[p] === value) {
            return p;
        }
    }
    return value;
}
