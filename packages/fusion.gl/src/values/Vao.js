import GLContext from '../GLContext';
import { include } from '../Utils';

include(GLContext.prototype, {
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/createVertexArray
     */
    createVertexArray() {
        if (this._is2) {
            return this._gl.createVertexArray();
        }

        return this.vaoOES.createVertexArrayOES();
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
        if (this._is2) {
            return this._gl.deleteVertexArray(vao);
        }

        return this.vaoOES.deleteVertexArrayOES(vao);
    },

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/isVertexArray
     * @param {WebGLVertexArrayObject} vao
     */
    isVertexArray(vao) {
        if (this._is2) {
            return this._gl.isVertexArray(vao);
        }

        return this.vaoOES.isVertexArrayOES(vao);
    }
});
