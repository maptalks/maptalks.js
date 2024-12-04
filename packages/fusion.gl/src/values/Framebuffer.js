import GLContext from '../GLContext';
import { include } from '../Utils';

include(GLContext.prototype, {

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/checkFramebufferStatus
     */
    checkFramebufferStatus(framebuffer) {
        return this._gl.checkFramebufferStatus(framebuffer);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createFramebuffer
     */
    createFramebuffer() {
        return this._gl.createFramebuffer();
    },

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/deleteFramebuffer
     */
    deleteFramebuffer(framebuffer) {
        const framebuffers = this.states.framebuffer;
        for (const p in framebuffers) {
            if (framebuffers[p] === framebuffer) {
                framebuffers[p] = null;
            }
        }
        return this._gl.deleteFramebuffer(framebuffer);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/framebufferRenderbuffer
     */
    framebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer) {
        this._checkAndRestore();
        return this._gl.framebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/framebufferTexture2D
     */
    framebufferTexture2D(target, attachment, textarget, texture, level) {
        this._checkAndRestore();
        return this._gl.framebufferTexture2D(target, attachment, textarget, texture, level);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getFramebufferAttachmentParameter
     */
    getFramebufferAttachmentParameter(target, attachment, pname) {
        this._checkAndRestore();
        return this._gl.getFramebufferAttachmentParameter(target, attachment, pname);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/isFramebuffer
     */
    isFramebuffer(framebuffer) {
        return this._gl.isFramebuffer(framebuffer);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/readPixels
     */
    readPixels(x, y, width, height, format, type, pixels) {
        this._checkAndRestore();
        return this._gl.readPixels(x, y, width, height, format, type, pixels);
    },

    blitFramebuffer(srcX0, srcY0, srcX1, srcY1, dstX0, dstY0, dstX1, dstY1, mask, filter) {
        this._checkAndRestore();
        return this._gl.blitFramebuffer(srcX0, srcY0, srcX1, srcY1, dstX0, dstY0, dstX1, dstY1, mask, filter);
    }
});
