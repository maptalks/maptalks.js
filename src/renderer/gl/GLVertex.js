/**

 * reference https://github.com/mapbox/mapbox-gl-js/blob/master/src/data/buffer.js
 * 
 * Vertext Array class turns a structArray into WebGL buffer,each member of the structArray's Struct type is converted to a WebGL attribute
 * 
 * @author yellow date 2017/6/16
 * @class 
 */

import GLExtension from './GLExtension';

class GLVertexArray{

    _gl;

    /**
     * 
     * @param {WebGLRenderingContext} gl 
     */
    constructor(gl){
        this._gl=gl;
    }


}

/**
 * 使用 ext 扩展的VertexArrayObject
 * reference https://developer.mozilla.org/zh-CN/docs/Web/API/OES_vertex_array_object
 * 
 * @class GLVertexArrayObject
 */
class GLVertexArrayObject extends GLVertexArray{
    /**
     * @type {GLExtension}
     */
    _ext;

    _vao;
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     * @param {GLExtension} extension 
     */
    constructor(gl,extension){
        super(gl);
        this._ext = extension['vertexArrayObject'];
        this._vao=this._ext.createVertexArrayOES();
        this._ext.bindVertexArrayOES(this._vao);
    }


}
