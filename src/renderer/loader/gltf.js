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
    constructor(gl){
        this._gl = gl;
    }

    load(url){
        
    }

 }


 export default gltf;