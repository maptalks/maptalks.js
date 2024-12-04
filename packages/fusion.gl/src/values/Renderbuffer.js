import GLContext from '../GLContext';
import { include } from '../Utils';

include(GLContext.prototype, {

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createRenderbuffer
     */
    createRenderbuffer() {
        return this._gl.createRenderbuffer();
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/deleteRenderbuffer
     */
    deleteRenderbuffer(renderbuffer) {
        const renderbuffers = this.states.renderbuffer;
        for (const p in renderbuffers) {
            if (renderbuffers[p] === renderbuffer) {
                renderbuffers[p] = null;
            }
        }
        return this._gl.deleteRenderbuffer(renderbuffer);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getRenderbufferParameter
     */
    getRenderbufferParameter(target, pname) {
        this._checkAndRestore();
        return this._gl.getRenderbufferParameter(target, pname);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/isRenderbuffer
     */
    isRenderbuffer(renderbuffer) {
        return this._gl.isRenderbuffer(renderbuffer);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/renderbufferStorage
     */
    renderbufferStorage(target, internalFormat, width, height) {
        this._checkAndRestore();
        return this._gl.renderbufferStorage(target, internalFormat, width, height);
    },

    renderbufferStorageMultisample(target, samples, internalFormat, width, height) {
        this._checkAndRestore();
        return this._gl.renderbufferStorageMultisample(target, samples, internalFormat, width, height);
    }
});
