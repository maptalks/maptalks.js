import GLContext from '../GLContext';
import { include } from '../Utils';

include(GLContext.prototype, {
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/createVertexArray
     */
    createVertexArray() {
        return this._gl.createVertexArray();
    },

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/deleteVertexArray
     * @param {WebGLVertexArrayObject} vao
     */
    deleteVertexArray(vao) {
        const states = this.states;
        if (states.vao === vao) {
            states.vao = null;
        }
        return this._gl.deleteVertexArray(vao);
    },

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/isVertexArray
     * @param {WebGLVertexArrayObject} vao
     */
    isVertexArray(vao) {
        return this._gl.isVertexArray(vao);
    }
});
