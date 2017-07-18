/**
 * 
 * 提供 buffer,vertexbuffer,indexbuffer 三种类型
 * -vertexbuffer对应draw
 * -indexbuffer对应element draw
 */
import Dispose from './../../utils/Dispose';
import GLConstants from './GLConstants';

const EMPTY_BUFFER = new ArrayBuffer(0);

/**
 * @class
 */
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
    _data;
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
        this._type = type || GLConstants.ARRAY_BUFFER;
        this._data = data || EMPTY_BUFFER;
        this._drawType = drawType || GLConstants.STATIC_DRAW;
        this._handle = this._createHandle();
    }
    /**
     * 创建句柄/对象
     */
    _createHandle() {
        const gl = this._gl;
        return gl.createBuffer();
    }
    /**
     * 资源销毁
     */
    dispose() {
        const gl = this._gl;
        gl.deleteBuffer(this.handle);
    }
    /**
     * bind buffer
     */
    bind() {
        const gl = this._gl;
        gl.bindBuffer(this._type, this._handle);
    }
    /**
     * 获取buffer的长度
     */
    get len() {
        return this._data.length;
    }
    /**
     * 获取buffer data 的type,例如 gl.Float
     */
    get type() {
        return this._type;
    }
    /**
     * 绘制类型
     */
    get drawType(){
        return this._drawType;
    }
    /**
     * 获取buffer的Float32aArray类型数据
     * @readonly
     * @memberof GLBuffer
     * @return {Float32Array} 
     */
    get float32() {
        const array = this._data;
        return new Float32Array(array);
    }
}
/**
 * @class
 */
class GLVertexBuffer extends GLBuffer {
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     * @param {ArrayBuffer| SharedArrayBuffer|ArrayBufferView} data 
     * @param {gl.STATIC_DRAW|gl.DYNAMIC_DRAW|gl.STREAM_DRAW} drawType 
     */
    constructor(gl, data, drawType) {
        super(gl, GLConstants.ARRAY_BUFFER, data, drawType);
    }
}
/**
 * @class
 */
class GLIndexBuffer extends GLBuffer {
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     * @param {ArrayBuffer| SharedArrayBuffer|ArrayBufferView} data 
     * @param {gl.STATIC_DRAW|gl.DYNAMIC_DRAW|gl.STREAM_DRAW} drawType 
     */
    constructor(gl, data, drawType) {
        super(gl, GLConstants.ELEMENT_ARRAY_BUFFER, data.drawType);
    }
}

export {
    GLBuffer,
    GLVertexBuffer,
    GLIndexBuffer
}