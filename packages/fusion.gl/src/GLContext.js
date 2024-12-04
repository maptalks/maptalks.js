/**
 * remove current program in to gl.actuator.currentProgram
 * @modify 2018/5/2
 * @author yellow
 */
import { createDefaultStates } from "./Utils";
import MockExtensions from "./extensions/Mocks";

let uid = 1;

// work around for maptalks/issues#601, class name changed from GLContext to WebGL2RenderingContext

// three needs constructor.name to determine whether it's a webgl2 context, see
// https://github.com/mrdoob/three.js/issues/26968
/**
 * @class
 */
class WebGL2RenderingContext /* GLContext */ {
    /**
     *
     * @param {WebGLRenderingContext} gl
     * @param {Object} [options]
     */
    constructor(gl) {
        this.uid = uid++;
        /**
         * @type {String}
         */
        this.states = createDefaultStates(gl);
        /**
         * @type {WebGLRenderingContext}
         */
        this._gl = gl;

        this._gl["_fusiongl_drawCalls"] = 0;

        this._is2 =
            typeof window.WebGL2RenderingContext !== "undefined" &&
            this._gl instanceof window.WebGL2RenderingContext;

        const myProto = Object.getPrototypeOf(this);
        if (this._is2) {
            Object.setPrototypeOf(myProto, window.WebGL2RenderingContext.prototype);
        } else {
            Object.setPrototypeOf(myProto, WebGLRenderingContext.prototype);
        }

        this._attrLimit = gl.getParameter(gl["MAX_VERTEX_ATTRIBS"]);
    }

    /**
     * Get canvas of the context
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/canvas
     * @returns {HTMLCanvasElement}
     */
    get canvas() {
        return this._gl.canvas;
    }

    /**
     * drawingBufferWidth
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawingBufferWidth
     * @returns {Number}
     */
    get drawingBufferWidth() {
        return this._gl.drawingBufferWidth;
    }

    /**
     * drawingBufferHeight
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawingBufferHeight
     * @returns {Number}
     */
    get drawingBufferHeight() {
        return this._gl.drawingBufferHeight;
    }

    get drawingBufferColorSpace() {
        return this._gl.drawingBufferColorSpace;
    }

    set drawingBufferColorSpace(colorSpace) {
        this._gl.drawingBufferColorSpace = colorSpace;
    }

    /**
     * get webglrendercontext
     * @returns {WebGLRenderingContext}
     */
    get gl() {
        return this._gl;
    }

    get buffersOES() {
        if (!this._buffersOES) {
            this._buffersOES = this._gl.getExtension("WEBGL_draw_buffers");
        }
        return this._buffersOES;
    }

    get vaoOES() {
        if (!this._vaoOES) {
            this._vaoOES = this._gl.getExtension("OES_vertex_array_object");
        }
        return this._vaoOES;
    }

    get angleOES() {
        if (!this._angleOES) {
            this._angleOES = this._gl.getExtension("ANGLE_instanced_arrays");
        }
        return this._angleOES;
    }

    get standOES() {
        if (!this._standOES) {
            this._standOES = this._gl.getExtension("OES_standard_derivatives");
        }
        return this._standOES;
    }

    /**
     * https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/attachShader
     * @param {GLProgram} program
     * @param {GLShader} shader
     */
    attachShader(program, shader) {
        return this._gl.attachShader(program, shader);
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/shaderSource
     * @param {GLShader} shader
     * @param {String} source
     */
    shaderSource(shader, source) {
        return this._gl.shaderSource(shader, source);
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/compileShader
     * @param {GLShader} shader
     */
    compileShader(shader) {
        return this._gl.compileShader(shader);
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createShader
     * @param {String} type Either gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
     */
    createShader(type) {
        return this._gl.createShader(type);
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createProgram
     * @returns {GLProgram}
     */
    createProgram() {
        return this._gl.createProgram();
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/deleteProgram
     * @param {*} program
     */
    deleteProgram(program) {
        if (this.states.program === program) {
            this.states.program = null;
        }
        return this._gl.deleteProgram(program);
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/deleteShader
     * @param {*} shader
     */
    deleteShader(shader) {
        return this._gl.deleteShader(shader);
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/detachShader
     */
    detachShader(program, shader) {
        return this._gl.detachShader(program, shader);
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getAttachedShaders
     * @param {*} program
     */
    getAttachedShaders(program) {
        return this._gl.getAttachedShaders(program);
    }

    /**
     * https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/linkProgram
     * @param {GLProgram} program
     */
    linkProgram(program) {
        return this._gl.linkProgram(program);
    }

    makeXRCompatible() {
        return this._gl.makeXRCompatible();
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getShaderParameter
     * @param {GLShader} shader
     * @param {GLenum} name
     */
    getShaderParameter(shader, name) {
        return this._gl.getShaderParameter(shader, name);
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getShaderPrecisionFormat
     * @param {GLenum} shaderType
     * @param {GLenum} precisionType
     */
    getShaderPrecisionFormat(shaderType, precisionType) {
        return this._gl.getShaderPrecisionFormat(shaderType, precisionType);
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getShaderInfoLog
     * @param {GLShader} shader
     */
    getShaderInfoLog(shader) {
        return this._gl.getShaderInfoLog(shader);
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getShaderSource
     */
    getShaderSource(shader) {
        return this._gl.getShaderSource(shader);
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getProgramInfoLog
     * @param {GLProgram} program
     */
    getProgramInfoLog(program) {
        return this._gl.getProgramInfoLog(program);
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getProgramParameter
     * @type {GLProgram} program
     * @type {GLenum} pname
     */
    getProgramParameter(program, pname) {
        return this._gl.getProgramParameter(program, pname);
    }
    /**
     * https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/getError
     */
    getError() {
        return this._gl.getError();
    }
    /**
     * https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/getContextAttributes
     */
    getContextAttributes() {
        return this._gl.getContextAttributes();
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getExtension
     * @param {String} name
     */
    getExtension(name) {
        if (MockExtensions.has(this, name)) {
            return MockExtensions.mock(this, name);
        }
        return this._gl.getExtension(name);
    }

    getSupportedExtensions() {
        return this._gl.getSupportedExtensions();
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
     * @param {String} pname
     */
    getParameter(pname) {
        return this._gl.getParameter(pname);
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/isEnabled
     * @param {boolean} cap
     */
    isEnabled(cap) {
        return this._gl.isEnabled(cap);
    }

    isProgram(program) {
        return this._gl.isProgram(program);
    }

    isShader(shader) {
        return this._gl.isShader(shader);
    }

    validateProgram(program) {
        return this._gl.validateProgram(program);
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clear
     */
    clear(mask) {
        this._checkAndRestore();
        return this._gl.clear(mask);
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawArrays
     */
    drawArrays(mode, first, count) {
        this._checkAndRestore();
        this._addDrawCall();
        return this._gl.drawArrays(mode, first, count);
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements
     */
    drawElements(mode, count, type, offset) {
        this._checkAndRestore();
        // this._saveDataStatus();
        this._addDrawCall();
        return this._gl.drawElements(mode, count, type, offset);
    }

    drawBuffers(buffers) {
        this._checkAndRestore();
        // this._saveDataStatus();
        this._addDrawCall();
        if (this._is2) {
            return this._gl.drawBuffers(buffers);
        }
        return this.buffersOES.drawBuffersWEBGL(buffers);
    }

    _addDrawCall() {
        this._gl["_fusiongl_drawCalls"]++;
    }

    resetDrawCalls() {
        this._gl["_fusiongl_drawCalls"] = 0;
    }

    getDrawCalls() {
        return this._gl["_fusiongl_drawCalls"];
    }

    _saveDataStatus() {
        const gl = this._gl;
        const program = gl.getParameter(gl.CURRENT_PROGRAM);
        const max = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        const buffers = [];
        for (let i = 0; i < max; i++) {
            buffers.push(
                gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING)
            );
        }
        this._dataStatus = {
            buffers,
            elements: gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING),
            framebuffer: gl.getParameter(gl.FRAMEBUFFER_BINDING),
        };
        if (window.DEBUGGING) {
            console.log(this.uid, this._dataStatus);
            console.log(this.uid, this.states.attributes);
            console.log(
                this.states.attributes[0].buffer === this._dataStatus.buffers[0]
            );
            console.log(
                this.states.attributes[1].buffer === this._dataStatus.buffers[1]
            );
            console.log(
                this.states.attributes[2].buffer === this._dataStatus.buffers[2]
            );
            // console.trace();
        }
    }

    finish() {
        // avoid as recommended by WebGL best practices
        // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
        return this._gl.finish();
    }

    flush() {
        this._checkAndRestore();
        return this._gl.flush();
    }

    commit() {
        this._checkAndRestore();
        return this._gl.commit();
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/isContextLost
     */
    isContextLost() {
        return this._gl.isContextLost();
    }

    getFragDataLocation(program, name) {
        return this._gl.getFragDataLocation(program, name);
    }

    createSampler() {
        return this._gl.createSampler();
    }

    deleteSampler() {
        return this._gl.deleteSampler();
    }

    bindSampler() {
        return this._gl.bindSampler();
    }

    isSampler() {
        return this._gl.isSampler();
    }

    getSamplerParameter() {
        return this._gl.getSamplerParameter();
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/isQuery
     */
    isQuery(query) {
        return this._gl.beginQuery(query);
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/beginQuery
     */
    beginQuery(target, query) {
        return this._gl.beginQuery(target, query);
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/deleteQuery
     */
    deleteQuery(query) {
        return this._gl.query(query);
    }

    isTransformFeedback(transformFeedback) {
        return this._gl.isTransformFeedback(transformFeedback);
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/beginTransformFeedback
     */
    beginTransformFeedback(primitiveMode) {
        return this._gl.beginTransformFeedback(primitiveMode);
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/deleteTransformFeedback
     */
    deleteTransformFeedback(transformFeedback) {
        return this._gl.deleteTransformFeedback(transformFeedback);
    }

    pauseTransformFeedback() {
        return this._gl.pauseTransformFeedback();
    }

    resumeTransformFeedback() {
        return this._gl.resumeTransformFeedback();
    }

    transformFeedbackVaryings(program, varyings, bufferMode) {
        return this._gl.transformFeedbackVaryings(
            program,
            varyings,
            bufferMode
        );
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/bindBufferBase
     */
    bindBufferBase(target, index, buffer) {
        return this._gl.bbindBufferBase(target, index, buffer);
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/bindBufferRange
     */
    bindBufferRange(target, index, buffer, offset, size) {
        return this._gl.bindBufferRange(target, index, buffer, offset, size);
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/bindTransformFeedback
     */
    bindTransformFeedback(target, transformFeedback) {
        return this._gl.bindTransformFeedback(target, transformFeedback);
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/fenceSync
     */
    fenceSync(condition, flags) {
        return this._gl.fenceSync(condition, flags);
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/isSync
     */
    isSync(sync) {
        return this._gl.isSync(sync);
    }

    deleteSync(sync) {
        return this._gl.deleteSync(sync);
    }

    clientWaitSync(sync, flags, timeout) {
        return this._gl.clientWaitSync(sync, flags, timeout);
    }

    waitSync(sync, flags, timeout) {
        return this._gl.waitSync(sync, flags, timeout);
    }

    getSyncParameter(sync, pname) {
        return this._gl.getSyncParameter(sync, pname);
    }

    getIndexedParameter(target, index) {
        return this._gl.getIndexedParameter(target, index);
    }
}

// include(GLContext.prototype, GLConstants);

export default WebGL2RenderingContext;
