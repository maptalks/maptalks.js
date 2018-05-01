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
 * convert DOMString to value
 */
const GLSL_TYPE_ENUM={
    'float':0x1406,
    'vec2':0x8b50,
    'vec3':0x8b51,
    'vec4':0x8b52,
    'mat2':0x8b5a,
    'mat3':0x8b5b,
    'mat4':0x8b5c,
    'sampler2D':0x8b5e,
    'sampler_external_oes':0x8d66,
    'sampler_cube':'0x8b60',
    'int':0x1404,
    'bool':0x8b56,
}
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
        /**
         * @type {boolean}
         */
        this._isComplied = false;
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
     * reference:
     * https://github.com/WebKit/webkit/blob/4c0ce4f62b30a6d39140ac9841c416dee3bd07e0/Source/ThirdParty/ANGLE/util/shader_utils.cpp
     * https://github.com/SDL-mirror/SDL/blob/865821287c68ff8039544a35e86eb56289bd162d/src/render/opengl/SDL_shaders_gl.c
     * 
     * }{yellow 寻找power vr sdk下 opengl es的实现
     * use regex pattern to analy active attri/uniforms
     */
    complie() {
        const source = this._source;
        const [uniforms,attributes] = this._parseShaderStrings(source);
        this._uniforms = uniforms;
        this._attributes = attributes;
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
    /**
     * reference:
     * https://github.com/KhronosGroup/glslang/blob/eb2c0c72bf4c2f7a972883003b5f5fca3f8c94bd/glslang/MachineIndependent/ParseHelper.cpp#L186
     */
    _parseShaderStrings(str) {
        const ast = complier.parse(str);
        const [uniforms,attributes] = complier.getUniformsAndAttributes(ast);
        return [this._convert(uniforms),this._convert(attributes)];
    }
    /**
     * @param {Array} nodes
     * @param {Array} attributeNodes
     */
    _convert(nodes){
        const collection = [];
        //deal with no struct type only 
        nodes.forEach(element => {
            collection.push({
                name:element.name,
                type:GLSL_TYPE_ENUM[element.type]
            });
        });
        return collection;
    }

}

module.exports = GLShader;