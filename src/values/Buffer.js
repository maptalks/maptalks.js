import GLContext from '../GLContext';
import { include } from '../Utils';

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
                attrs[p].buffer = null;
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
    }
});
