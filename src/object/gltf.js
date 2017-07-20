/**
 * reference:
 * https://github.com/emadurandal/GLBoost/blob/master/src/js/middle_level/loader/GLTFLoader.js
 * 
 * 支持gltf数据加载
 * -gltf 1.0
 * -gltf 1.1
 * 
 * load完成后，返回一个RenderNode对象，可插入Container待渲染
 * 加载gltf数据的主要步骤：
 * -创建gltf对象，解析内容并转换成promise集合
 * -add进renderNode后，处理资源队列，逐步加载
 */
import { arrayBufferToString, base64ToArrayBuffer } from './../utils/convert';
import http from './../utils/http.js';

/**
 * @class
 */
class GLTF {
    /**
     * @type {WebGLRenderingContext}
     */
    _gl;
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     */
    constructor(gl) {
        this._gl = gl;
    }
    /**
     * obey promise rule to load gltf data
     * @param {String} url
     * @return {Promise} 
     */
    load(url) {
        return new Promise(function (resolve, reject) {
            http.getBinary(url).then(function (data) {
                //1.判断是binary结构或者是json结构
                const arrayBuffer = data,
                    dv = new DataView(arrayBuffer, 0);
                //2.解析binary二进制头
                const s0 = String.fromCharCode(dv.getUint8(0)),
                    s1 = String.fromCharCode(dv.getUint8(1)),
                    s2 = String.fromCharCode(dv.getUint8(2)),
                    s3 = String.fromCharCode(dv.getUint8(3));
                const field = `${s0}${s1}${s2}${s3}`;
                //3.binary
                if (field === 'glTF') {
                    const lengthOfThisFile = dataView.getUint32(8),
                        lengthOfContent = dataView.getUint32(12),
                        contentFormat = dataView.getUint32(16),
                        arrayBufferContent = arrayBuffer.slice(20, lengthOfContent + 20);
                    const text = arrayBufferToString(arrayBufferContent),
                        json = JSON.parse(text),
                        version = !!json.asset ? parseFloat(json.asset.version) : 1.0,
                        arrayBufferBinary = arrayBuffer.slice(20 + lengthOfContent);
                    //3.1 载入模型并返回 resolve
                }
                //4.解析json
                else {
                    const text = arrayBufferToString(arrayBuffer),
                        partsOfPath = url.split('/');
                    let basePath = '';
                    for (let i = 0; i < partsOfPath.length - 1; i++) {
                        basePath += partsOfPath[i] + '/';
                    }
                    const json = JSON.parse(text),
                        version = !!json.asset ? parseFloat(json.asset.version) : 1.0;
                    //4.1 载入模型并返回 resolve
                }
            }, function (err) {
                reject(err);
            });
        });
    }
    /**
     * 加载gltf内的数据，成功后promise resolve
     * @param {ArrayBuffer} binary 
     * @param {String} basePath 
     * @param {String} defaultShader 
     * @param {float} version 
     * @param {Func} resolve 
     */
    _loadResourceAndScene(json, binary, basePath, defaultShader, version, resolve) {
        const gl = this._gl;
        let shaders = {},
            buffers = {},
            textures = {},
            promiseToLoadResources = [];
        //shaders collection
        const shaderCollection = json.shaders || {};
        //shaders
        for (let shaderName in shaderCollection) {
            shaders[shaderName] = {};
            const shaderJson = shaderCollection[shaderName],
                shaderType = shaderJson.type;
            if (typeof shaderJson.extensions !== 'undefined' && typeof shaderJson.extensions.KHR_binary_glTF !== 'undefined') {
                shaders[shaderName].shaderText = this._loadBinaryAsShader(shaderJson.extensions.KHR_binary_glTF.bufferView, json, binary);
                shaders[shaderName].shaderType = shaderType;
                continue;
            } else {
                //promise加载shader队列
                const shaderUri = shaderJson.uri;
                if (shaderUri.match(/^data:/)) {
                    promiseToLoadResources.push(new Promise(function (fulfilled, reject) {
                        const arrayBuffer = base64ToArrayBuffer(shaderUri);
                        shaders[shaderName].shaderText = arrayBufferToString(arrayBuffer);
                        shaders[shaderName].shaderType = shaderType;
                        fulfilled();
                    }));
                } else {
                    const shaderUri2 = basePath + shaderUri;
                    promiseToLoadResources.push(new Promise(function (fulfilled, reject) {
                        http.get(shaderUri2).then(function (data) {
                            shaders[shaderName].shaderText = data;
                            shaders[shaderName].shaderType = shaderType;
                            fulfilled();
                        }, function (err) {
                            reject(err);
                        });
                    }));
                }
            }
        }
        //buffers collection
        const bufferCollection = json.buffers;
        //buffers
        for (let bufferName in bufferCollection) {
            const buffer = bufferCollection[bufferName];
            if (buffer.uri.match(/^data:application\/octet-stream;base64,/)) {
                promiseToLoadResources.push(new Promise(function (fulfilled, reject) {
                    const arrayBuffer = base64ToArrayBuffer(buffer.uri);
                    buffers[bufferName] = arrayBuffer;
                    fulfilled();
                }));
            } else if (buffer.uri === 'data:,') {
                buffers[shaderName] = binary;
            } else {
                const bufferUri = basePath + buffer.uri;
                promiseToLoadResources.push(new Promise(function (fulfilled, reject) {
                    http.getBinary(bufferUri).then(function (data) {
                        buffers[bufferName] = data;
                        fulfilled();
                    }, function (err) {
                        reject(err);
                    });
                }));
            }
        }
        //Textures collection
        const textureCollection = json.textures;
        const imageCollection = json.images;
        const samplers = json.samplers;
        let textureUri;
        //Textures
        for(let textureName in textureCollection){
            const textureJson = textureCollection[textureName],
                imageJson = imageCollection[textureJson.source],
                samplerJson = samplers[textureJson.sampler];
            if (typeof imageJson.extensions !== 'undefined' && typeof imageJson.extensions.KHR_binary_glTF !== 'undefined') {
                textureUri = this._loadBinaryAsImage();
            }else{
                const imageStr = imageJson.uri;
                if(imageStr.match(/^data:/))
                    textureUri = imageStr;
                else
                    textureUri = basePath+imageStr;
            }
            /**
             * @type {WebGLTexture}
             */
            let texture = gl.createTexture(),
                promise = texture.generateTextureFromUri(textureUri,false);
            textures[textureName] = texture;
            promiseToLoadResources.push(promise);
        }
        //处理资源队列 - promiseToLoadResources


    }

    _processResource(){
        const gl = this._gl;
        let rootGroup = gl.creat
    }

    /**
     * 将二进制数据解析成shader对象
     */
    _loadBinaryAsShader(bufferView, json, binary) {

    }
    /**
     * 读取二进制数据，返回image
     * @param {*} bufferView 
     * @param {*} json 
     * @param {*} binary 
     * @param {*} mimeType 
     */
    _loadBinaryAsImage(bufferView,json,binary,mimeType){

    }
}


export default GLTF;