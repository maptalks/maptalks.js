/**
 * 提供shader程序创建，销毁，应用等
 * @author yellow 2017/6/12
 */
import Dispose from './../../utils/Dispose';
import isString from './../../utils/isString';
import GLConstants from './GLConstants';

/** 
 * Shader抽象类
 * @class GLShader
 */
class GLShader extends Dispose {
    /**
     * the glContext 
     * @type {WebGLRenderingContext}
     * @memberof Shader
     */
    _gl;
    /**
     * the shader text
     * @memberof Shader
     */
    _source;
    /**
     * shader类型
     * @memberof Shader
     * @type {number} a instance of gl.Enum
     */
    _shaderType;
    /**
     * the shader instance
     * @memberof Shader
     */
    _handle;
    /**
     * @type {GLExtension}
     */
    _extension;
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
        //可以指定id，方便检索
        this._id = isString(source) ? source.id : stamp(this);
        this._source = isString(source) ? source : source.source;
        this._gl = gl;
        this._shaderType = shaderType;
        this._handle = this._createHandle();
        this._compile(this._source);
    };
    /**
     * Accessors of shader
     * @param {any} pname 
     * @returns 
     * @memberof Shader
     */
    _getParameter(pname) {
        return this.gl.getShaderParameter(this._handle, pname);
    };
    /**
     * 获取对象id
     */
    get id() {
        return this._id;
    }
    /**
     * return the complied source
     * @readonly
     * @memberof Shader
     */
    get translateSource() {
        const extension = this._extension['WEBGL_debug_shaders'];
        return extension ? extension.getTranslatedShaderSource(this.handle) : 'No translated source available. WEBGL_debug_shaders not implemented';
    };
    /**
     * @readonly
     * @memberof Shader
     */
    get source() {
        return this._source;
    };
    /**
     * use gl to compile the shader
     * @memberof Shader
     */
    _compile() {
        this._gl.shaderSource(this._handle, this._source);
        this._gl.compileShader(this._handle);
        const compileStatus = this._getParameter(gl.COMPILE_STATUS);
        if (!compileStatus) {
            const infoLog = this._gl.getShaderInfoLog(this._handle);
            this.dispose();
            throw new Error(infoLog);
        }
    };
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
        return this._gl.createShader(this._shaderType);
    }

};

/**
 * @class GLVertexShader
 */
class GLVertexShader extends GLShader {
    /**
     * 创建vertex shader
     * @param {WebGLRenderingContext} gl 
     * @param {String} source 
     * @param {GLExtension} extension
     */
    constructor(gl, source, extension) {
        super(gl, source, GLConstants.VERTEX_SHADER, extension);
    };
}

/**
 * @class GLVertexShader
 */
class GLFragmentShader extends GLShader {
    /**
     * 创建fragment shader
     * @param {WebGLRenderingContext} gl 
     * @param {String} source 
     * @param {GLExtension} extension
     */
    constructor(gl, source, extension) {
        super(gl, source, GLConstants.FRAGMENT_SHADER, extension);
    };
}

export { GLFragmentShader, GLVertexShader }