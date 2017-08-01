/**
 * 提供shader程序创建，销毁，应用等
 * @author yellow 2017/6/12
 */

const Dispose = require('./../utils/Dispose'),
     isString = require('./../utils/isString'), 
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
        this._source = source;
        this._shaderType = shaderType;
        this._handle = this._createHandle();
        this._compile();
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
     * use gl to compile the shader
     * @memberof Shader
     */
    _compile() {
        const gl = this._gl;
        gl.shaderSource(this._handle, this._source);
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
        return gl.createShader(this._shaderType);
    }
}

module.exports = GLShader;