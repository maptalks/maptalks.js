/*
 * @Author: wenrongz 2920356983@qq.com
 * @Date: 2023-08-23 11:31:56
 * @LastEditors: wenrongz 2920356983@qq.com
 * @LastEditTime: 2023-09-11 17:10:01
 * @FilePath: \fusion.gl\src\values\Buffer.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import GLContext from "../GLContext";
import { include } from "../Utils";

include(GLContext.prototype, {
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferData
     * @param  {...any} args
     */
    bufferData(...args) {
        this._checkAndRestore();
        return this._gl.bufferData(...args);
    },

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferSubData
     * @param  {...any} args
     */
    bufferSubData(...args) {
        this._checkAndRestore();
        return this._gl.bufferSubData(...args);
    },

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createBuffer
     */
    createBuffer() {
        return this._gl.createBuffer();
    },

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/deleteBuffer
     * @param {*} buffer
     */
    deleteBuffer(buffer) {
        const states = this.states;
        if (states.arrayBuffer === buffer) {
            states.arrayBuffer = null;
        } else if (states.elementArrayBuffer === buffer) {
            states.elementArrayBuffer = null;
        }
        const attrs = states.attributes;
        for (const p in attrs) {
            if (attrs[p].buffer === buffer) {
                // 2022-12-16 vt（开启debug）和tilelayer同时添加时，发现偶发的会因为deleteBuffer导致vt中的DebugPainter报错
                // 在disableVertexAttribArray后解决。这个操作一般都是安全的:
                // 因为delete不会在渲染过程中调用，而每次渲染开始或者切换context时，都会重新enableVertexAttribArray
                attrs[p].buffer = null;
                // attrs[p].enable = false;
                // 2022-12-29 不再disableVertexAttribArray，因为会导致ThreeLayer工作不正常
                // this._gl.disableVertexAttribArray(+p);
            }
        }
        return this._gl.deleteBuffer(buffer);
    },

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getBufferParameter
     * @param {*} target
     * @param {*} pname
     */
    getBufferParameter(target, pname) {
        this._checkAndRestore();
        return this._gl.getBufferParameter(target, pname);
    },

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/isBuffer
     * @param {*} buffer
     */
    isBuffer(buffer) {
        return this._gl.isBuffer(buffer);
    },

    /**
     * hhttps://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/copyBufferSubData
     * @param {*} readTarget
     * @param {*} writeTarget
     * @param {*} readOffset
     * @param {*} writeOffset
     * @param {*}  size
     */
    copyBufferSubData(readTarget, writeTarget, readOffset, writeOffset, size) {
        return this._gl.isBuffer(
            readTarget,
            writeTarget,
            readOffset,
            writeOffset,
            size
        );
    },

    readBuffer(source) {
        return this._gl.readBuffer(source);
    },
});
