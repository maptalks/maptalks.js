/**
 * remove current program in to gl.actuator.currentProgram
 * @modify 2018/5/2
 * @author yellow
 */
const Dispose = require('./../utils/Dispose'),
    Record = require('./../core/Record'),
    Recorder = require('./../core/Recorder'),
    Encrypt = require('./../core/Encrypt'),
    GLVertexAttrib = require('./GLVertexAttrib'),
    GLConstants = require('./GLConstants');
/**
 * bridge object
 */
const GLShader = require('./GLShader'),
    GLBuffer = require('./GLBuffer'),
    GLFramebuffer = require('./GLFramebuffer'),
    GLRenderbuffer = require('./GLRenderbuffer'),
    GLVertexArray = require('./GLVertexArray'),
    GLTexture = require('./GLTexture'),
    GLProgram = require('./GLProgram');
/**
 * bridge extension
 */
const OES_vertex_array_object = require('./Extensions/OES_vertex_array_object');
/**
 * the prefix of GLContext
 */
const prefix = "WEBGLRENDERGINGCONTEXT";
/**
 * @class
 */
class GLContext extends Dispose {
    /**
     * 
     * @param {WebGLRenderingContext} gl
     * @param {String} renderType support 'webgl' or 'webgl2'
     * @param {Object} [options] 
     */
    constructor(gl, renderType, options = {}) {
        /**
         * set element id
         */
        super(prefix);
        /**
         * @type {String}
         */
        this._renderType = renderType;
        /**
         * @type {Object}
         */
        this._options = options;
        /**
         * @type {Recorder}
         */
        this._recorder = new Recorder(this);
        /**
         * @type {WebGLRenderingContext}
         */
        this._gl = gl;
        /**
         * @type {GLBuffer}
         */
        this._glBuffer = null;
        /**
         * index of vertex_buffer 
         */
        this._bound_buffer = {};
        /**
         * index of attribs
         */
        this._attribs = {};
        /**
         * @type {Object}
         */
        this._extensions = {};
        /**
         * map funciont
         */
        this._mapConst();
    }
    /**
     * map function and constants to Class
     */
    _mapConst() {
        const recorder = this._recorder;
        //1.map constants
        for (const key in GLConstants) {
            if (!this.hasOwnProperty(key)) {
                const target = GLConstants[key];
                if (!this[key])
                    this[key] = target;
            }
        }
        //2.map void function(include replace and no replace)
        for (const key in Encrypt) {
            if (!this.hasOwnProperty(key)) {
                const target = Encrypt[key];
                //2.1 void and no replace
                if (!target.return && target.replace === 0) {
                    if (!this[key] && !!target) {
                        this[key] = (...rest) => {
                            const record = new Record(key, ...rest);
                            recorder.increase(record);
                        }
                    }
                }
                //2.2 void and replace ,no change program
                else if (!target.return && target.replace > 0 && !target.change) {
                    if (!this[key] && !!target) {
                        this[key] = (...rest) => {
                            const record = new Record(key, ...rest),
                                index = target.ptIndex;
                            record.exactIndexByObject(index);
                            recorder.increase(record);
                        }
                    }
                }
                //2.3 void replace as 1 and need to change program
                else if (!target.return && target.replace === 1 && target.change === 1) {
                    if (!this[key] && !!target) {
                        this[key] = (...rest) => {
                            const currentProgram = this.gl.actuator.currentProgram,
                                record = new Record(key, ...rest),
                                index = target.ptIndex,
                                u = record.args[index[0]];
                            if (u.glProgram !== currentProgram) this.useProgram(u.glProgram);
                            record.exactIndexByObject(index);
                            recorder.increase(record);
                        }
                    }
                }
                //2.4 return(make birdge to origin,should not to be implemented)
            }
        }
    }
    /**
     * get the version of webgl
     * @returns {String} 'webgl' or 'webgl2'
     */
    get renderType() {
        return this._renderType;
    }
    /**
     * get webglrendercontext
     * @returns {WebGLRenderingContext}
     */
    get gl() {
        return this._gl;
    }
    /**
     * get glcontext's recorder
     * @returns {Recorder}
     */
    get recorder() {
        return this._recorder;
    }
    /**
     * @param {GLProgram} program 
     */
    useProgram(program) {
        const record = new Record('useProgram', program);
        record.exactIndexByValue(0, program.id);
        this._recorder.increase(record);
        //store current programId and program
        this.gl.actuator.currentProgram = program;
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/shaderSource
     * @param {GLShader} shader 
     * @param {String} source 
     */
    shaderSource(shader, source) {
        shader.source = source;
        const returnId = shader.id,
            record = new Record('shaderSource', shader, source);
        record.exactIndexByValue(0, returnId);
        this._recorder.increase(record);
    }
    /**
    * 
    * @param {GLenum} target 
    * @param {GLBuffer} buffer 
    */
    bindBuffer(target, buffer) {
        //store currently bound buffer
        if (target === GLConstants.ARRAY_BUFFER) {
            this._glBuffer = buffer;
        }
        const record = new Record('bindBuffer', target, buffer);
        record.exactIndexByObject([1]);
        this._recorder.increase(record);
    }
    /**
     * 
     * @param {*} index 
     * @param {*} size 
     * @param {*} type 
     * @param {*} normalized 
     * @param {*} stride 
     * @param {*} offset 
     */
    vertexAttribPointer(index, size, type, normalized, stride, offset) {
        const glAttrib = new GLVertexAttrib({ buffer: this._glBuffer, size: size, index: index, type: type, stride: stride, offset: offset, normalized: normalized });
        this._attribs[index] = glAttrib;
        const record = new Record('vertexAttribPointer', index, size, type, normalized, stride, offset);
        this._recorder.increase(record);
    }
    /**
    * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/enableVertexAttribArray
    * @param {GLuint} index 
    */
    enableVertexAttribArray(index) {
        //active bound
        this._bound_buffer[index] = this._attribs[index];
        const record = new Record('enableVertexAttribArray', index);
        this._recorder.increase(record);
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/disableVertexAttribArray
     * @param {GLunit} index 
     */
    disableVertexAttribArray(index) {
        //turns the vertex attribute off at the given index position
        this._bound_buffer[index] = this._attribs[index];
        const record = new Record('disableVertexAttribArray', index);
        this._recorder.increase(record);
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/compileShader
     * @param {GLShader} shader 
     */
    compileShader(shader) {
        const returnId = shader.id,
            record = new Record('compileShader', shader);
        record.exactIndexByValue(0, returnId);
        shader._isComplied = true;
        this._recorder.increase(record);
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createShader
     * @param {String} type Either gl.VERTEX_SHADER or gl.FRAGMENT_SHADER 
     */
    createShader(type) {
        const glShader = new GLShader(type, this),
            record = new Record('createShader', type);
        record.setReturnId(glShader.id);
        this._recorder.increase(record);
        return glShader;
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createProgram
     * @returns {GLProgram}
     */
    createProgram() {
        const glProgram = new GLProgram(this),
            record = new Record('createProgram');
        record.setReturnId(glProgram.id);
        this._recorder.increase(record);
        return glProgram;
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createProgram
     * @returns {GLBuffer}
     */
    createBuffer() {
        const glBuffer = new GLBuffer(this),
            record = new Record('createBuffer');
        record.setReturnId(glBuffer.id);
        this._recorder.increase(record);
        return glBuffer;
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createFramebuffer
     * @returns {GLFramebuffer}
     */
    createFramebuffer() {
        const glFramebuffer = new GLFramebuffer(this),
            record = new Record('createFramebuffer');
        record.setReturnId(glFramebuffer.id);
        this._recorder.increase(record);
        return glFramebuffer;
    }
    /** 
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createRenderbuffer
     * @returns {GLRenderbuffer}
     */
    createRenderbuffer() {
        const glRenderbuffer = new GLRenderbuffer(this),
            record = new Record('createRenderbuffer');
        record.setReturnId(glRenderbuffer.id);
        this._recorder.increase(record);
        return glRenderbuffer;
    }
    /** 
     * needs ext 'OES_vertex_array_object' support
     * only avaiable in webgl2
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLVertexArrayObject
     * @returns {GL}
    */
    createVertexArray() {
        const glVao = new GLVertexArray(this),
            record = new Record('createVertexArray');
        record.setReturnId(glVao.id);
        this._recorder.increase(record);
        return glVao;
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createTexture
     * @returns {GLTexture}
     */
    createTexture() {
        const glTexture = new GLTexture(this),
            record = new Record('createTexture');
        record.setReturnId(glTexture.id);
        this._recorder.increase(record);
        return glTexture;
    }
    /**
     * https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/attachShader
     * @param {GLProgram} program 
     * @param {GLShader} shader 
     */
    attachShader(program, shader) {
        const record = new Record('attachShader', program, shader);
        record.exactIndexByValue(0, program.id);
        record.exactIndexByValue(1, shader.id);
        this._recorder.increase(record);
        //
        program.attachShader(shader);
    }
    /**
     * https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/linkProgram
     * @param {GLProgram} program 
     */
    linkProgram(program) {
        const record = new Record('linkProgram', program);
        record.exactIndexByValue(0, program.id);
        this._recorder.increase(record);
        program.link();
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getAttribLocation
     * @modify yellow date 2018/2/3 direction return 
     * 
     * @param {GLProgram} program 
     * @param {String} name 
     */
    getAttribLocation(program, name) {
        const returnId = program.getAttribLocation(name),
            record = new Record('getAttribLocation', program, name);
        record.exactIndexByValue(0, program.id);
        record.setReturnId(returnId, false);
        this._recorder.increase(record);
        return returnId;
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getUniformLocation
     * @param {GLProgram} program 
     * @param {DOMString} name 
     */
    getUniformLocation(program, name) {
        const returnId = program.getUnifromLocation(name),
            record = new Record('getUniformLocation', program, name);
        record.exactIndexByValue(0, program.id);
        record.setReturnId(returnId);
        this._recorder.increase(record);
        return returnId;
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getShaderParameter
     * @param {GLShader} shader 
     * @param {GLenum} pname 
     */
    getShaderParameter(shader, pname) {
        return shader.getParameters(pname);
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getShaderInfoLog
     * @param {GLShader} shader 
     */
    getShaderInfoLog(shader) {
        return '';
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getProgramInfoLog
     * @param {GLProgram} program 
     */
    getProgramInfoLog(program) {
        return '';
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getActiveAttrib
     * @param {GLProgram} program 
     * @param {GLuint} index 
     */
    getActiveAttrib(program, index) {
        return program.attributes[index];
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getVertexAttrib
     * @param {GLuint} index 
     * @param {GLenum} pname 
     */
    getVertexAttrib(index, pname) {
        if (pname === GLConstants.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING) {
            const gVertexAttrib = this._bound_buffer[index] || {};
            return gVertexAttrib.buffer;
        }
        return null;
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getActiveUniform
     * @param {GLProgram} program 
     * @param {GLuint} index 
     */
    getActiveUniform(program, index) {
        return program.uniforms[index];
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getProgramParameter
     * @type {GLProgram} program
     * @type {GLenum} pname
     */
    getProgramParameter(program, pname) {
        if (pname === GLConstants.ACTIVE_UNIFORMS) {
            return program.uniforms.length;
        } else if (pname === GLConstants.ACTIVE_ATTRIBUTES) {
            return program.attributes.length;
        } else if (pname === GLConstants.ATTACHED_SHADERS) {
            return program.attachNum;
        } else if (pname === GLConstants.LINK_STATUS) {
            return true;
        } else if (pname === GLConstants.DELETE_STATUS) {
            return true;
        }
    }
    /**
     * https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/getError
     */
    getError() {
        return GLConstants.NO_ERROR;
    }
    /**
     * https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/getContextAttributes
     */
    getContextAttributes() {
        const contextAttributes = this._options;
        return contextAttributes;
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getExtension
     * @param {String} name 
     */
    getExtension(name) {
        if (name === 'OES_vertex_array_object') {
            this._extensions['OES_vertex_array_object'] = this._extensions['OES_vertex_array_object'] || new OES_vertex_array_object('OES_vertex_array_object', this);
            return this._extensions['OES_vertex_array_object'];
        } else {
            const gl = this._gl;
            return gl.getExtension(name);
        }
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
     * @param {String} pname 
     */
    getParameter(pname) {
        //parameter search from limits
        const gl = this._gl;
        return gl.getParameter(pname);
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clear
     */
    clear(mask) {
        //}{hack igonre 'screen clearing operations'
        //1.GLConstants.COLOR_BUFFER_BIT|GLConstants.DEPTH_BUFFER_BIT|GLConstants.STENCIL_BUFFER_BIT  = 17664
        //2.mask alpah !== 0
        if (mask !== 17664) {
            const record = new Record('clear', mask);
            this._recorder.increase(record);
        }
    }
    /**
     * }{debug
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/checkFramebufferStatus
     * @param {GLenum} target 
     */
    checkFramebufferStatus(target) {
        return GLConstants.FRAMEBUFFER_COMPLETE;
    }
    /**
     * turning function
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawArrays
     */
    drawArrays(mode, first, count) {
        const actuator = this.gl.actuator,
            record = new Record('drawArrays', mode, first, count),
            programId = this.gl.actuator.currentProgram.id;
        this._recorder.increase(record);
        actuator.play(this._recorder.toOperation());
    }
    /**
     * turning function
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements
     */
    drawElements(mode, count, type, offset) {
        const actuator = this.gl.actuator,
            record = new Record('drawElements', mode, count, type, offset),
            programId = this.gl.actuator.currentProgram.id;
        this._recorder.increase(record);
        actuator.play(this._recorder.toOperation());
    }
}

module.exports = GLContext;