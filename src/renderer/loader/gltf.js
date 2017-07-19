/**
 * reference:
 * https://github.com/emadurandal/GLBoost/blob/master/src/js/middle_level/loader/GLTFLoader.js
 * 
 * 支持gltf数据加载
 * -gltf 1.0
 * -gltf 1.1
 * 
 */
import http from './../../utils/http.js';
import { arrayBufferToString } from './../../utils/convert';


class gltf {
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
                const buffer = data,
                    dv = new DataView(buffer, 0);
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
                        arrayBufferContent = buffer.slice(20, lengthOfContent + 20);
                    const text = arrayBufferToString(arrayBufferContent),
                        json = JSON.parse(text),
                        version = !!json.asset ? parseFloat(json.asset.version) : 1.0,
                        arrayBufferBinary = buffer.slice(20 + lengthOfContent);
                    //3.1
                }
                //4.解析json
                else {
                    const text = arrayBufferToString(buffer),
                        partsOfPath = url.split('/');
                    let basePath = '';
                    for (let i = 0; i < partsOfPath.length - 1; i++) {
                        basePath += partsOfPath[i] + '/';
                    }
                    const json = JSON.parse(text),
                        version = !!json.asset ? parseFloat(json.asset.version) : 1.0;
                    //4.1 载入模型并返回
                }
            }, function (err) {
            });
        });
    }
    /**
     * 读取binary
     * -scene
     * -resource
     */
    _accessBinary() {

    }
    /**
     * 读取scene
     * 
     */
    _accessScene() {

    }
    /**
     * 读取resource
     */
    _accessResource() {

    }
    /**
     * 读取shader
     */
    _accessShader() {
      
    }

}

export default gltf;