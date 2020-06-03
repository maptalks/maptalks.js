import GLContext from '../GLContext';
import { include } from '../Utils';

include(GLContext.prototype, {
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/createVertexArray
     */
    createVertexArray() {
        if (this._isWebGL2) {
            return this._gl.createVertexArray();
        }
        if (!this._vaoOES) {
            this._vaoOES = this._gl.getExtension('OES_vertex_array_object');
        }
        return this._vaoOES.createVertexArrayOES();
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
        if (this._isWebGL2) {
            return this._gl.deleteVertexArray(vao);
        }
        if (!this._vaoOES) {
            this._vaoOES = this._gl.getExtension('OES_vertex_array_object');
        }
        return this._vaoOES.deleteVertexArray(vao);
    },

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/isVertexArray
     * @param {WebGLVertexArrayObject} vao
     */
    isVertexArray(vao) {
        if (this._isWebGL2) {
            return this._gl.isVertexArray(vao);
        }
        if (!this._vaoOES) {
            this._vaoOES = this._gl.getExtension('OES_vertex_array_object');
        }
        return this._vaoOES.isVertexArray(vao);
    }
});
