/**
 * @author yellow 2017/6/12
 */
import { stamp } from './../../utils/stamp';
import isString from './../../utils/isString';
import GLConstants from './GLConstants';


class GLShader {
    /**
     * shader name
     * @memberof Shader
     */
    _id;
    /**
     * the glContext 
     * @memberof Shader
     */
    _gl;
    /**
     * the shader text
     * @memberof Shader
     */
    _source;
    /**
     * @memberof Shader
     */
    _shaderType;
    /**
     * the shader instance
     * @memberof Shader
     */
    _handle;
    /**
     * Creates an instance of Shader.
     * @param {any} gl 
     * @param {Object} source
     * @param {String} [source.source]
     * @param {String} [source.name] 
     * @param {any} shaderType 
     * 
     * @memberof Shader
     */
    constructor(gl, source, shaderType) {
        this._gl = gl;
        this._shaderType = shaderType;
        this._source = isString(source) ? source : source.source;
        this._id = isString(source) ? source.id : stamp(this);
        this._compile(this._source);
    }
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
     * return the shader's name
     * @returns 
     * @memberof Shader
     */
    get name() {
        return this._id;
    };
    /**
     * return the complied source
     * @readonly
     * @memberof Shader
     */
    get translateSource() {
        const extension = this.gl.getExtension('WEBGL_debug_shaders');
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
     * @readonly
     * @memberof Shader
     */
    get handle() {
        return this._handle;
    };
    /**
     * use gl to compile the shader
     * @memberof Shader
     */
    _compile() {
        this._handle = this._gl.createShader(this._shaderType);
        this._gl.shaderSource(this._handle, this._source);
        this._gl.compileShader(this._handle);
        const compileStatus = this._getParameter(gl.COMPILE_STATUS);
        if (!compileStatus) {
            const infoLog = this._gl.getShaderInfoLog(this._handle);
            this._distory();
            throw new Error(infoLog);
        }
    };
    /**
     * delete shader form gl
     * @memberof Shader
     */
    _distory() {
        this._gl.deleteShader(this._handle);
    };
};


class VertexShader extends GLShader {
    constructor(gl, source) {
        super(gl, source, GLConstants.VERTEX_SHADER);
    };
}

class FragmentShader extends GLShader {
    constructor(gl, source) {
        super(gl, source, GLConstants.FRAGMENT_SHADER);
    };
}

export { FragmentShader, VertexShader }