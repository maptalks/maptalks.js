/**
 * 提供shader程序创建，销毁，应用等
 * @author yellow 2017/6/12
 * @modify yellow 2017/12/25 不涉及真实的buffer创建
 */

const isString = require('./../utils/isString'),
    setId = require('./../utils/stamp').setId,
    Dispose = require('./../utils/Dispose'),
    GLConstants = require('./GLConstants');

/** 
 * Shader抽象类
 * @class
 */
class GLShader extends Dispose {
    /**
     * Creates an instance of Shader.
     * @constructor
     * @param {WebGLRenderingContext} gl 
     * @param {Object} source
     * @param {String} [source.source]
     * @param {String} [source.name] 
     * @param {String} shaderType 
     * @param {GLExtension} extension
     */
    constructor(gl, source, shaderType, extension) {
        super();
        this._gl = gl;
        this._extension = extension;
        this._shaderType = shaderType;
        this._handle = this._createHandle();
        if(!!source){
            this.source = source;
            this.compile()
        }
    }
    /**
     * return the complied source
     * @readonly
     * @memberof Shader
     */
    get translateSource() {
        const ext = this._extension['WEBGL_debug_shaders'];
        return ext ? ext.getTranslatedShaderSource(this.handle) : 'No translated source available. WEBGL_debug_shaders not implemented';
    }
    /**
     * @readonly
     * @memberof Shader
     */
    get source() {
        return this._source;
    }
    /**
     * set the source
     */
    set source(value) {
        const gl = this._gl;
        this._source = value;
        gl.shaderSource(this._handle, this._source);
    }
    /**
     * use gl to compile the shader
     * @memberof Shader
     */
    compile() {
        const gl = this._gl;
        gl.compileShader(this._handle);
        const compileStatus = gl.getShaderParameter(this._handle, GLConstants.COMPILE_STATUS);
        if (!compileStatus) {
            const infoLog = gl.getShaderInfoLog(this.handle);
            this.dispose();
            throw new Error(infoLog);
        }
    }
    /**
     * delete shader form gl
     */
    dispose() {
        this._gl.deleteShader(this._handle);
    }
    /**
     * overwrite 
     */
    _createHandle() {
        const gl = this._gl;
        const shader = gl.createShader(this._shaderType);
        setId(shader, this._id);
        return shader
    }
}

module.exports = GLShader;