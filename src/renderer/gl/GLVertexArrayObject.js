/**
 * 使用 ext 扩展的VertexArrayObject
 * reference https://developer.mozilla.org/zh-CN/docs/Web/API/OES_vertex_array_object
 * 
 * @class GLVertexArrayObject
 */
import Dispose from './../../utils/Dispose';
import GLExtension from './GLExtension';

class GLVertexArrayObject extends Dispose{
    /**
     * @type {GLExtension}
     */
    _ext;

    _vao;
    /**
     * @type {WebGLRenderingContext}
     */
    _gl;
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     * @param {GLExtension} extension 
     */
    constructor(gl,extension){
        this._gl=gl;
        this._ext = extension['vertexArrayObject'];
        this._handle=this._createHandle();
    }

    _createHandle(){
        return this._ext.createVertexArrayOES();
    }

    bind(){
        this._ext.bindVertexArrayOES(this._vao);
    }

}