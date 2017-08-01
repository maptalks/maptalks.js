/**
 * the program 
 * reference 
 * https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLProgram
 * https://github.com/pixijs/pixi-gl-core/blob/master/src/GLShader.js
 * https://github.com/pixijs/pixi-gl-core/blob/master/src/shader/extractAttributes.js
 * https://github.com/pixijs/pixi-gl-core/blob/master/src/shader/extractUniforms.js
 * 
 * 合并shader，并缓存进gl，便于之后使用
 * 不提倡luma.gl的写法，即对gl对象添加属性，形如 gl.luma = {}
 * 所以在此类提供两个方法，为不同的实例化
 *
 * -解决 uniform 和 attribute 通过属性即可设置的问题
 * -unifrom 涉及数据类型转换，所以规定属性使用 GLUniform
 * -attribuet 涉及数据转换，规定attribute使用 GLBuffer
 * 
 * @author yellow date 2017/6/12
 */

const Dispose = require('./../utils/Dispose'),
    stamp = require('./../utils/stamp').stamp,
    GLConstants = require('./GLConstants'),
    GLFragmentShader = require('./shader/GLFragmentShader'),
    GLVertexShader = require('./shader/GLVertexShader'),
    GLVertexbuffer = require('./buffer/GLVertexbuffer'),
    GLIndexbuffer = require('./buffer/GLIndexbuffer'),
    GLVertexArrayObject = require('./GLVertexArrayObject');

/**
 * 统一使用array方式调用， ..args
 */
const GLSL_UNIFORM = {
    'float': 'uniform1fv',//(location, value)
    'vec2': 'uniform2fv',//(location, value)
    'vec3': 'uniform3fv',//(location, value)
    'vec4': 'uniform4fv',//(location, value)
    'int': 'uniform1iv',//(location, value)
    'ivec2': 'uniform2iv',//(location, value)
    'ivec3': 'uniform3iv',//(location, value)
    'ivec4': 'uniform4iv',//(location, value)
    'bool': 'uniform1iv',//(location, value)
    'bvec2': 'uniform2iv',//(location, value)
    'bvec3': 'uniform3iv',//(location, value)
    'bvec4': 'uniform4iv',//
    'sampler2D': 'uniform1iv'//(location, value)
};

const GL_GLSL = {
    'FLOAT': 'float',
    'FLOAT_VEC2': 'vec2',
    'FLOAT_VEC3': 'vec3',
    'FLOAT_VEC4': 'vec4',
    'INT': 'int',
    'INT_VEC2': 'ivec2',
    'INT_VEC3': 'ivec3',
    'INT_VEC4': 'ivec4',
    'BOOL': 'bool',
    'BOOL_VEC2': 'bvec2',
    'BOOL_VEC3': 'bvec3',
    'BOOL_VEC4': 'bvec4',
    'FLOAT_MAT2': 'mat2',
    'FLOAT_MAT3': 'mat3',
    'FLOAT_MAT4': 'mat4',
    'SAMPLER_2D': 'sampler2D'
};

const GLSL_SIZE = {
    'float': 1,
    'vec2': 2,
    'vec3': 3,
    'vec4': 4,
    'int': 1,
    'ivec2': 2,
    'ivec3': 3,
    'ivec4': 4,
    'bool': 1,
    'bvec2': 2,
    'bvec3': 3,
    'bvec4': 4,
    'mat2': 4,
    'mat3': 9,
    'mat4': 16,
    'sampler2D': 1
};

/**
 * 构建gl类型（number）和 glsl类型映射表
 */
const NATIVE_GL_TABLE = ((keys) => {
    let _gl_table = {};
    for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i];
        _gl_table[GLConstants[key]] = GL_GLSL[key];
    }
    return _gl_table;
})(Object.keys(GL_GLSL));
/**
 * 获取glsl对象类型的size
 * @param {String} glslType 
 * @return {number}
 */
const getGLSLTypeSize = (glslType) => {
    return GLSL_SIZE[glslType];
}
/**
 * 获取gltype对应glsl的type
 * @param {number} glType 
 */
const getGLSLType = (glType) => {
    return NATIVE_GL_TABLE[glType];
}
/**
 * glsl类型转换成获取uniform设置属性的方法
 * @param {String} glslType 
 */
const getUniformFunc = (glslType) => {
    return GLSL_UNIFORM[glslType];
}
/**
 * @class
 */
class GLProgram extends Dispose {
    /**
     * 创建program
     * @param {WebGLRenderingContext} gl 
     * @param {GLVertexShader} fragmentSource glsl shader文本
     * @param {GLFragmentShader} vertexSource glsl shader文本
     * @param {GLExtension} extension
     * @param {GLLimits} [limits] the context limtis
     * @param {Boolean} [isWebGL2] detect the evn support webgl2
     */
    constructor(gl, vs, fs, extension, limits, isWebGL2 = true) {
        super();
        /**
         * @type {WebGLRenderingContext}
         */
        this._gl = gl;
        /**
         *  program active attribute
         */
        this._attributes = null;
        /**
         * program active 
         */
        this._uniforms = null;
        /**
         * @type {GLExtension}
         */
        this._extension = extension;
        /**
         * @type {GLLimits}
         */
        this._limits = limits;
        /**
         * 混合存储 oes_vertex_array_object
         * @type {GLVertexArrayObject}
         * @memberof GLProgram
         */
        this._vao = new GLVertexArrayObject(gl, extension, limits);
        /**
         * vertex_shader
         * @type {GLVertexShader}
         */
        this._vs = vs;
        /**
         * fragment_shader
         * @type {GLFragmentShader}
         */
        this._fs = fs;
        /**
         * @type {WebGLProgram}
         */
        this._handle = this._createHandle();
        /**
         * indicate the glContext type
         * @type {boolean}
         */
        this._isWebGL2 = isWebGL2 && !!this._vao.handle;
        this._gl.attachShader(this._handle, this._vs.handle);
        this._gl.attachShader(this._handle, this._fs.handle);
    }
    /**
     * 获取attribues
     * @readonly
     * @memberof GLProgram
     */
    get attributes() {
        return this._attributes;
    };
    /**
     * 获取unfiroms
     * @readonly
     * @memberof GLProgram
     */
    get uniforms() {
        return this._uniforms;
    }
    /**
     * extract attributes
     * 展开attributes
     */
    _extractAttributes() {
        const isWebGL2 = this._isWebGL2,
            gl = this._gl,
            vao = this._vao,
            attribLen = gl.getProgramParameter(this._handle, GLConstants.ACTIVE_ATTRIBUTES);
        let attributes = {};
        //get attributes and store mapdata
        for (let i = 0; i < attribLen; i++) {
            const attrib = gl.getActiveAttrib(this._handle, i),
                type = getGLSLType(attrib.type),
                name = attrib.name,
                size = getGLSLTypeSize(type),
                location = gl.getAttribLocation(this._handle, name);
            gl.enableVertexAttribArray(location);
            //
            Object.defineProperty(attributes, name, {
                set: (function (gl2, loc, typ, ne, se) {
                    return gl2 ? function (value) {
                        const glBuffer = value;
                        gl.bindBuffer(glBuffer.type, glBuffer.handle);
                        gl.bufferData(glBuffer.type, glBuffer.float32, glBuffer.drawType);
                        vao.addAttribute(glBuffer, loc, se);
                    } : function (value) {
                        const glBuffer = value;
                        gl.bindBuffer(glBuffer.type, glBuffer.handle);
                        gl.bufferData(glBuffer.type, glBuffer.float32, glBuffer.drawType);
                        gl.vertexAttribPointer(loc, se, glBuffer.type, false, 0, 0);
                    }
                })(isWebGL2, location, type, name, size)
            });
        }
        //
        this._attributes = attributes;
    }
    /**
     * 展开uniforms并map到对象
     * @memberof GLProgram
     */
    _extractUniforms() {
        const isWebGL2 = this._isWebGL2,
            gl = this._gl,
            uniformsLen = gl.getProgramParameter(this._handle, GLConstants.ACTIVE_UNIFORMS);
        let uniforms = {};
        //1.get uniforms and store mapdata
        for (let i = 0; i < uniformsLen; i++) {
            const uniform = gl.getActiveUniform(this._handle, i),
                type = getGLSLType(uniform.type),
                name = uniform.name.replace(/\[.*?\]/, ""),
                size = uniform.size,
                location = gl.getUniformLocation(this._handle, name);
            //提供attribute属性访问
            Object.defineProperty(uniforms, name, {
                /**
               * @param {glMatrix.*} value
               */
                set: (value) => {
                    const funcName = getUniformFunc(type);
                    //gl[funcName](location,)
                    gl[funcName](location, value);
                }
            });
        }
        //
        this._uniforms = uniforms;
    }

    _createHandle() {
        return this._gl.createProgram();
    }

    useProgram() {
        const gl = this._gl;
        gl.useProgram(this.handle);
        this._extractAttributes();
        this._extractUniforms();
    }
    /**
     * 获取attribute地址
     * @param {String} name
     * @return {number} 
     */
    getAttribLocation(name) {
        const attributeLocation = this._gl.getAttribLocation(this.handle, name);
        return attributeLocation;
    }
    /**
     * 获取uniform地址
     * @param {String} name 
     * @return {number} 
     */
    getUniformLocation(name) {
        const uniformLocation = this._gl.getUniformLocation(this.handle, name);
        return uniformLocation;
    }
    /**
     * 清理绑定信息，销毁program对象
     */
    dispose() {
        const gl = this._gl;
        gl.deleteProgram(this._handle);
    }
    /**
     * 绘制
     * @param {gl.TRIANGLES|gl.POINTS} primitiveType 
     * @param {number} offset 
     * @param {number} count 
     */
    drawArrays(primitiveType, offset, count) {
        const gl = this._gl;
        gl.drawArrays(primitiveType || GLConstants.TRIANGLES, offset || 0, count || 6);
    }

};

module.exports = GLProgram;