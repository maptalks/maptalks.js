import GLContext from '../GLContext';
import { include } from '../Utils';

include(GLContext.prototype, {
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawArraysInstanced
     */
    drawArraysInstanced(mode, first, count, instanceCount) {
        this._checkAndRestore();
        this._addDrawCall();
        if (this._is2) {
            return this._gl.drawArraysInstanced(mode, first, count, instanceCount);
        }
        return this.angleOES.drawArraysInstancedANGLE(mode, first, count, instanceCount);
    },

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawElementsInstanced
     * @param {WebGLVertexArrayObject} vao
     */
    drawElementsInstanced(mode, count, type, offset, instanceCount) {
        this._checkAndRestore();
        this._addDrawCall();
        if (this._is2) {
            return this._gl.drawElementsInstanced(mode, count, type, offset, instanceCount);
        }
        return this.angleOES.drawElementsInstancedANGLE(mode, count, type, offset, instanceCount);
    }
});
