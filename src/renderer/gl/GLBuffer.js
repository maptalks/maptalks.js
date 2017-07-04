/**
 * 
 * 提供 buffer,vertexbuffer,indexbuffer 三种类型
 * 
 */
import Dispose from './../../utils/Dispose';
import GLConstants from './GLConstants';

const EMPTY_BUFFER = new ArrayBuffer(0);

class GLBuffer extends Dispose {
    /**
     * @type {WebGLRenderingContext}
     */
    _gl;
    /**
     * @type {gl.ARRAY_BUFFER|gl.ELEMENT_ARRAY_BUFFER}
     */
    _type;
    /**
     * @type {gl.STATIC_DRAW|gl.DYNAMIC_DRAW|gl.STREAM_DRAW}
     */
    _drawType;
    /**
     * @type {ArrayBuffer| SharedArrayBuffer|ArrayBufferView}
     */
    _data = EMPTY_BUFFER;
    /**
     * @type {number}
     */
    _updateID = 0;
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     * @param {gl.ArrayBuffer|gl.ELEMENT_ARRAY_BUFFER} type 
     * @param {ArrayBuffer|SharedArrayBuffer|ArrayBufferView} data an array of data
     * @param {gl.STATIC_DRAW|gl.DYNAMIC_DRAW|gl.STREAM_DRAW} drawType 
     */
    constructor(gl, type, data, drawType) {
        super();
        this._gl = gl;
        this._type = type;
        this._data = data;
        this._drawType = drawType;
        this._handle = this._createHandle();
    }
    /**
     * 资源销毁
     */
    dispose(){
        const gl = this._gl;
        gl.deleteBuffer(this.handle);
    }
    /**
     * bind buffer
     */
    bind(){
        const gl=this._gl;
        gl.bindBuffer(this._type,this._handle);
    }
    /**
     * 创建句柄/对象
     */
    _createHandle() {
        const gl=this._gl;
        return gl.createBuffer();
    }
}

class GLVertexBuffer extends GLBuffer{
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     * @param {ArrayBuffer| SharedArrayBuffer|ArrayBufferView} data 
     * @param {gl.STATIC_DRAW|gl.DYNAMIC_DRAW|gl.STREAM_DRAW} drawType 
     */
    constructor(gl,data,drawType){
        super(gl,GLConstants.ARRAY_BUFFER,data,drawType);
    }
}

class GLIndexBuffer extends GLBuffer{
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     * @param {ArrayBuffer| SharedArrayBuffer|ArrayBufferView} data 
     * @param {gl.STATIC_DRAW|gl.DYNAMIC_DRAW|gl.STREAM_DRAW} drawType 
     */
    constructor(gl,data,drawType){
        super(gl,GLConstants.ELEMENT_ARRAY_BUFFER,data.drawType);
    }
}

export {
    GLBuffer,
    GLVertexBuffer,
    GLIndexBuffer
}