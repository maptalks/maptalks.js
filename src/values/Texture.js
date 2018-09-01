import GLContext from '../GLContext';
import { include } from '../Utils';

include(GLContext.prototype, {

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/compressedTexImage2D
     */
    compressedTexImage2D(target, level, internalformat, width, height, border, pixels) {
        this._checkAndRestore();
        return this._gl.compressedTexImage2D(target, level, internalformat, width, height, border, pixels);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/copyTexImage2D
     */
    copyTexImage2D(target, level, internalformat, x, y, width, height, border) {
        this._checkAndRestore();
        return this._gl.copyTexImage2D(target, level, internalformat, x, y, width, height, border);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/copyTexSubImage2D
     */
    copyTexSubImage2D(target, level, xoffset, yoffset, x, y, width, height) {
        this._checkAndRestore();
        return this._gl.copyTexSubImage2D(target, level, xoffset, yoffset, x, y, width, height);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createTexture
     */
    createTexture() {
        return this._gl.createTexture();
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/deleteTexture
     */
    deleteTexture(texture) {
        return this._gl.deleteTexture(texture);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/generateMipmap
     */
    generateMipmap(target) {
        this._checkAndRestore();
        return this._gl.generateMipmap(target);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getTexParameter
     */
    getTexParameter(target, pname) {
        this._checkAndRestore();
        return this._gl.getTexParameter(target, pname);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/isTexture
     */
    isTexture(texture) {
        return this._gl.isTexture(texture);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
     */
    texImage2D(...args) {
        this._checkAndRestore();
        // if (args[0] === this._gl.TEXTURE_2D && !this._gl.getParameter(this._gl.TEXTURE_BINDING_2D) ||
        //     args[0] === this._gl.TEXTURE_CUBE_MAP && !this._gl.getParameter(this._gl.TEXTURE_BINDING_CUBE_MAP)) {
        //     debugger
        // }
        return this._gl.texImage2D(...args);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texSubImage2D
     */
    texSubImage2D(args) {
        this._checkAndRestore();
        return this._gl.texSubImage2D(...args);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
     */
    texParameterf(target, pname, param) {
        this._checkAndRestore();
        return this._gl.texParameterf(target, pname, param);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
     */
    texParameteri(target, pname, param) {
        this._checkAndRestore();
        return this._gl.texParameteri(target, pname, param);
    },
});
