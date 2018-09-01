import GLContext from '../GLContext';
import { include } from '../Utils';

include(GLContext.prototype, {
    bindAttribLocation(program, index, name) {
        return this._gl.bindAttribLocation(program, index, name);
    },

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/enableVertexAttribArray
     * @param {GLuint} index
     */
    enableVertexAttribArray(index) {
        this._checkAndRestore();
        return this._gl.enableVertexAttribArray(index);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/disableVertexAttribArray
     * @param {GLunit} index
     */
    disableVertexAttribArray(index) {
        this._checkAndRestore();
        return this._gl.disableVertexAttribArray(index);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getActiveAttrib
     * @param {GLProgram} program
     * @param {GLuint} index
     */
    getActiveAttrib(program, index) {
        return this._gl.getActiveAttrib(program, index);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getActiveUniform
     * @param {GLProgram} program
     * @param {GLuint} index
     */
    getActiveUniform(program, index) {
        return this._gl.getActiveUniform(program, index);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getAttribLocation
     * @modify yellow date 2018/2/3 direction return
     *
     * @param {GLProgram} program
     * @param {String} name
     */
    getAttribLocation(program, name) {
        return this._gl.getAttribLocation(program, name);
    },

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getUniformLocation
     * @param {GLProgram} program
     * @param {DOMString} name
     */
    getUniformLocation(program, name) {
        return this._gl.getUniformLocation(program, name);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getVertexAttrib
     * @param {GLuint} index
     * @param {GLenum} pname
     */
    getVertexAttrib(index, pname) {
        this._checkAndRestore();
        return this._gl.getVertexAttrib(index, pname);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getVertexAttribOffset
     */
    getVertexAttribOffset(index, pname) {
        this._checkAndRestore();
        return this._gl.getVertexAttribOffset(index, pname);
    },

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniformMatrix
     */
    uniformMatrix2fv(location, transpose, value) {
        this._checkAndRestore();
        return this._gl.uniformMatrix2fv(location, transpose, value);
    },
    uniformMatrix3fv(location, transpose, value) {
        this._checkAndRestore();
        return this._gl.uniformMatrix3fv(location, transpose, value);

    },
    uniformMatrix4fv(location, transpose, value) {
        this._checkAndRestore();
        return this._gl.uniformMatrix4fv(location, transpose, value);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniform
     */
    uniform1f(location, v) {
        this._checkAndRestore();
        return this._gl.uniform1f(location, v);
    },
    uniform1fv(location, v) {
        this._checkAndRestore();
        return this._gl.uniform1fv(location, v);
    },
    uniform1i(location, v) {
        this._checkAndRestore();
        return this._gl.uniform1i(location, v);
    },
    uniform1iv(location, v) {
        this._checkAndRestore();
        return this._gl.uniform1iv(location, v);
    },
    uniform2f(location, v0, v1) {
        this._checkAndRestore();
        return this._gl.uniform2f(location, v0, v1);
    },
    uniform2fv(location, v) {
        this._checkAndRestore();
        return this._gl.uniform2fv(location, v);
    },
    uniform2i(location, v0, v1) {
        this._checkAndRestore();
        return this._gl.uniform2i(location, v0, v1);
    },
    uniform2iv(location, v) {
        this._checkAndRestore();
        return this._gl.uniform2iv(location, v);
    },
    uniform3f(location, v0, v1, v2) {
        this._checkAndRestore();
        return this._gl.uniform3f(location, v0, v1, v2);
    },
    uniform3fv(location, v) {
        this._checkAndRestore();
        return this._gl.uniform3fv(location, v);
    },
    uniform3i(location, v0, v1, v2) {
        this._checkAndRestore();
        return this._gl.uniform3i(location, v0, v1, v2);
    },
    uniform3iv(location, v) {
        this._checkAndRestore();
        return this._gl.uniform3iv(location, v);
    },
    uniform4f(location, v0, v1, v2, v3) {
        this._checkAndRestore();
        return this._gl.uniform4f(location, v0, v1, v2, v3);
    },
    uniform4fv(location, v) {
        this._checkAndRestore();
        return this._gl.uniform4fv(location, v);
    },
    uniform4i(location, v0, v1, v2, v3) {
        this._checkAndRestore();
        return this._gl.uniform4i(location, v0, v1, v2, v3);
    },
    uniform4iv(location, v) {
        this._checkAndRestore();
        return this._gl.uniform4iv(location, v);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttrib
     */
    vertexAttrib1f(index, v0) {
        this._checkAndRestore();
        return this._gl.vertexAttrib1f(index, v0);
    },
    vertexAttrib2f(index, v0, v1) {
        this._checkAndRestore();
        return this._gl.vertexAttrib2f(index, v0, v1);
    },
    vertexAttrib3f(location, v0, v1, v2) {
        this._checkAndRestore();
        return this._gl.vertexAttrib3f(location, v0, v1, v2);
    },
    vertexAttrib4f(location, v0, v1, v2, v3) {
        this._checkAndRestore();
        return this._gl.vertexAttrib4f(location, v0, v1, v2, v3);
    },
    vertexAttrib1fv(index, v) {
        this._checkAndRestore();
        return this._gl.vertexAttrib1fv(index, v);
    },
    vertexAttrib2fv(index, v) {
        this._checkAndRestore();
        return this._gl.vertexAttrib2fv(index, v);
    },
    vertexAttrib3fv(index, v) {
        this._checkAndRestore();
        return this._gl.vertexAttrib3fv(index, v);
    },
    vertexAttrib4fv(index, v) {
        this._checkAndRestore();
        return this._gl.vertexAttrib4fv(index, v);
    }
});
