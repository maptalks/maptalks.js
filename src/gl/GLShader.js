/**
 * birgde to attach shader
 * reference:
 * https://github.com/KhronosGroup/glslang/blob/04f4566f285beb1e3619eb40baa7629eb5eb3946/glslang/MachineIndependent/Initialize.cpp
 * https://www.cnblogs.com/bitzhuwei/p/LALR1-library-and-a-GLSL-parser-in-csharp.html
 * https://github.com/aras-p/glsl-optimizer
 * 
 * @author yellow
 */
const Dispose = require('./../utils/Dispose'),
    GLConstants = require('./GLConstants');
/**
 * the prefix of Shader type
 */
const prefix = 'SHADER';
/**
 * @class
 */
class GLShader extends Dispose {
    /**
     * 
     * @param {GLenum} type Either gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
     * @param {GLContext} glContext 
     */
    constructor(type, glContext) {
        super(prefix);
        /**
         * @type {GLenum}
         */
        this._type = type;
        /**
         * @type {GLContext}
         */
        this._glContext = glContext;
        /**
         * @type {String} shaderSource 
         */
        this._source = null;
        /**
         * @type {boolean}
         */
        this._isDelete = false;
    }
    /**
     * @returns {GLenum}
     */
    get type() {
        return this._type;
    }
    /**
     * @type {String}
     */
    set source(v) {
        this._source = v;
    }
    /**
     * @returns {String}
     */
    get source() {
        return this._source;
    }
    /**
     * bridge to shader
     * @param {GLenum} pname 
     */
    getParameters(pname) {
        if (pname === GLConstants.DELETE_STATUS)
            return this._isDelete;
        else if (pname === GLConstants.COMPILE_STATUS)
            return this._isComplied;
        else if (pname === GLConstants.SHADER_TYPE)
            return this._type;
    }
    /**
     * @returns {Array}
     */
    get uniforms() {
        return this._uniforms;
    }
    /**
     * @returns {Array}
     */
    get attributes() {
        return this._attributes;
    }
}

module.exports = GLShader;