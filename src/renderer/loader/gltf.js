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
     * 读二进制数据
     * reference:
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView
     * 
     * @param {String} url 
     * @param {Object} args 
     */
    load(url, args) {

        http.getBinary(url, args || {}).then(function (data) {
            const arrayBuffer = data;
            const dv = new DataView(arrayBuffer, 0);
            //field
            const s0 = String.fromCharCode(dv.getUint8(0)),
                s1 = String.fromCharCode(dv.getUint8(1)),
                s2 = String.fromCharCode(dv.getUint8(2)),
                s3 = String.fromCharCode(dv.getUint8(3));
            const magicField = `${s0}${s1}${s2}${s3}`;
            //正常的gltf数据（非二进制）
            if (magicField !== 'glTF') {
                let gotText = DataUtil.arrayBufferToString(arrayBuffer);
                let partsOfPath = url.split('/');
                let basePath = '';
                for (let i = 0; i < partsOfPath.length - 1; i++) {
                    basePath += partsOfPath[i] + '/';
                }
                const json = JSON.parse(gotText);
                const version =!!json.asset?parseFloat(json.asset.version):1.0;
                this._loadResourcesAndScene(glBoostContext, null, basePath, json, defaultShader, glTFVer, resolve);
                return;
            } else {
                let gltfVer = dataView.getUint32(4, isLittleEndian);
                if (gltfVer !== 1) {
                    reject('invalid version field in this binary glTF file.');
                }
                let lengthOfThisFile = dataView.getUint32(8, isLittleEndian);
                let lengthOfContent = dataView.getUint32(12, isLittleEndian);
                let contentFormat = dataView.getUint32(16, isLittleEndian);
                if (contentFormat !== 0) { // 0 means JSON format
                    reject('invalid contentFormat field in this binary glTF file.');
                }
                let arrayBufferContent = arrayBuffer.slice(20, lengthOfContent + 20);
                let gotText = DataUtil.arrayBufferToString(arrayBufferContent);
                let json = JSON.parse(gotText);
                let arrayBufferBinary = arrayBuffer.slice(20 + lengthOfContent);
                let glTFVer = this._checkGLTFVersion(json);
                this._loadResourcesAndScene(glBoostContext, arrayBufferBinary, null, json, defaultShader, glTFVer, resolve);
            }


        }, function (error) {


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