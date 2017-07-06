/**
 * the program 
 * reference 
 * https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLProgram
 * https://github.com/pixijs/pixi-gl-core/blob/master/src/GLShader.js
 * https://github.com/pixijs/pixi-gl-core/blob/master/src/shader/extractAttributes.js
 * https://github.com/pixijs/pixi-gl-core/blob/master/src/shader/extractUniforms.js
 *
 * 
 * 合并shader，并缓存进gl，便于之后使用
 * 不提倡luma.gl的写法，即对gl对象添加属性，形如 gl.luma = {}
 * 所以在此类提供两个方法，为不同的实例化
 *
 * @author yellow date 2017/6/12
 */
import Dispose from './../../utils/Dispose';
import { stamp } from './../../utils/stamp';
import { GLFragmentShader, GLVertexShader } from './GLShader';
import GLConstants from './GLConstants';
// import matrix from 'kiwi.matrix';


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

const GL_TABLE = ((keys) => {
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
  return GL_TABLE[glType];
}
/**
 * @class
 */
class GLProgram extends Dispose {
  /**
   * program active attribute
   */
  _attributes = {};
  /**
   * program active 
   */
  _uniforms = {}
  /**
   * @type {GLExtension}
   */
  _extension;
  /**
   * @type {WebGLRenderingContext}
   */
  _gl;
  /**
   * vertex_shader
   * @type {GLVertexShader}
   */
  _vs;
  /**
   * fragment_shader
   * @type {GLFragmentShader}
   */
  _fs;
  /**
   * 创建program
   * @param {WebGLRenderingContext} gl 
   * @param {GLVertexShader} fragmentSource glsl shader文本
   * @param {GLFragmentShader} vertexSource glsl shader文本
   * @param {GLExtension} extension
   */
  constructor(gl, vs, fs, extension) {
    super();
    this._gl = gl;
    this._extension = extension;
    this._vs = vs;
    this._fs = fs;
    this._handle = this._createHandle();
    this._gl.attachShader(this._handle, this._vs.handle);
    this._gl.attachShader(this._handle, this._fs.handle);
  }

  _extractAttributes() {
    const gl = this._gl,
      attribLen = gl.getProgramParameter(this._handle, GLConstants.ACTIVE_ATTRIBUTES);
    let attributes = this._attributes;
    for (let i = 0; i < attribLen; i++) {
      const attrib = gl.getActiveAttrib(this._handle, i),
        type = getGLSLType(attrib.type),
        name = attrib.name;
      attributes[attrib.name] = {
        type: type,
        size: getGLSLTypeSize(type),
        location: gl.getAttribLocation(this._handle, name),
      }
    }
  }

  _extractUniforms() {
    const gl = this._gl,
      uniformsLen = gl.getProgramParameter(this._handle, GLConstants.ACTIVE_UNIFORMS);
    let uniforms = {};
    for (let i = 0; i < uniformsLen; i++) {
      const uniform = gl.getActiveUniform(this._handle, i),
        type = getGLSLType(uniform.type),
        name = uniform.name.replace(/\[.*?\]/, "");
      uniforms[name] = {
        type: type,
        size: uniform.size,
        location: gl.getUniformLocation(this._handle, name)
      }
    }

  }

  _createHandle() {
    return this._gl.createProgram();
  }

  useProgram() {
    this._gl.useProgram(this.handle);
    //extract active attributes
    this._extractAttributes();
    //extract active uniforms
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

  }

};


export default GLProgram;