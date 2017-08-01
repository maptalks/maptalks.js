/**
 * 使用 ext 扩展的VertexArrayObject
 * reference https://developer.mozilla.org/zh-CN/docs/Web/API/OES_vertex_array_object
 * 
 * @class GLVertexArrayObject
 */
const Dispose = require('./../utils/Dispose'),
    GLConstants = require('./GLConstants');
/**
 * @class
 */
class GLVertexArrayObject extends Dispose {
    /**
     * @param {WebGLRenderingContext} gl 
     * @param {GLExtension} extension 
     * @param {GLLimits} limits
     */
    constructor(gl, extension, limits) {
        super();
        /**
         * @type {WebGLRenderingContext}
         */
        this._gl = gl;
        /**
         * 存储 indexbuffer ，用于重新排列 vertexbuffer顶点
         */
        this._indexBuffer=null;
        /**
         * 存储 vertexbuffer和其相关属性
         */
        this._attributes=[];

        /**
         * @type {GLExtension}
         */
        this._ext = extension['vertexArrayObject'];
        this._handle = this._createHandle();
    }
    /**
     * 创建vao对象
     * @description polyfill
     * @return va
     */
    _createHandle() {
        const gl = this._gl,
            ext = this._ext;
        if (!!ext)
            return ext.createVertexArrayOES();
        if (!!gl.createVertexArray)
            return gl.createVertexArray();
        return null;
    }
    /**
     * 销毁vao对象
     */
    dispose() {

    }
    /**
     * 绑定上下文
     */
    bind() {
        const ext = this._ext,
            gl = this._gl;
        if (!!ext)
            ext.bindVertexArrayOES(this._handle);
        else
            gl.bindVertexArray(this._handle);
    }
    /**
     * 解除上下文绑定
     */
    unbind() {
        const ext = this._ext,
            gl = this._gl;
        if (!!ext)
            ext.bindVertexArrayOES(null);
        else
            gl.bindVertexArray(null);
    }
    /**
     * 启动vertexbuffer和indexbuffer
     */
    _active() {
        this._activeVertexBuffer();
        this._activeIndexBuffer();
    }
    /**
     * 启用indexbuffer
     */
    _activeIndexBuffer() {
        this._indexBuffer.bind();
    }
    /**
     * bufferData到指定vao
     */
    _activeVertexBuffer() {
        const gl = this._gl;
        //设置 vertexbuffer 
        for (let i = 0, len = this._attributes.length; i < len; i++) {
            const att = this._attributes[i];
            //1.bind buffer
            att.buffer.bind();
            //2.setting vertexAttrib
            gl.vertexAttribPointer(att.location, att.size, att.type, att.normalized, att.stride, att.offset);
        }
    }
    /**
     * 
     * @param {GLVertexBuffer} buffer ,buffer数据存储器
     * @param {number} location ,需要修改的订单属性的索引值，例如 gPositionLocation
     * @param {number} size, 指定数据的纬度，如 [x,y] 则size=2 ,[x,y,z,w] 则size=4
     * @param {boolean} normalized 
     * @param {number} stride 指定连续顶点属性之间的偏移量。如果为0，那么顶点属性会被理解为：它们是紧密排列在一起的。初始值为0。
     * @param {number} offset 指定第一个组件在数组的第一个顶点属性中的偏移量。该数组与GL_ARRAY_BUFFER绑定，储存于缓冲区中。初始值为0；
     */
    addAttribute(buffer, location, size, normalized, stride, offset) {
        this._attributes.push({
            glBuffer: buffer,
            location: location,
            size: size,
            type: buffer.type || GLConstants.FLOAT,
            normalized: normalized || false,
            stride: stride || 0,
            offset: offset || 0
        });
    }
    /**
     * reference
     * http://www.cnblogs.com/excalibur/articles/1573892.html
     * 使用indexbuffer优势：
     * - 不改动vertexbuffer的情况下，排列绘制顶点顺序
     * - 复用转换后的顶点
     * 但是vertex cache数量有限，尽力将indexbuffer的数据放在相互靠近的地方。
     * @param {GLIndexBuffer} buffer 
     */
    addIndex(buffer) {
        this._indexBuffer = buffer;
    }
    /**
     * 清空vao对象
     */
    clear() {
        this.unbind();
        this.bind();
        this._attributes = [];
        this._indexBuffer = null;
    }
    /**
     * 
     * @param {*} type 
     * @param {*} size 
     * @param {number} offset 
     */
    draw(type, size, offset) {
        const gl = this._gl;
        if (!!this._indexBuffer) {
            gl.drawElements(type, size || this._indexBuffer.length, this._indexBuffer.type, (offset || 0) << 1)
        } else {
            gl.drawArrays(type, offset, size || this.size);
        }
    }
    /**
     * 获取vao规格
     */
    get size() {
        var attrib = this._attributes[0];
        return attrib.buffer.length / ((attrib.stride / 4) || attrib.size);
    }
}

module.exports =  GLVertexArrayObject;