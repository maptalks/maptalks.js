/**
 * the program 
 * reference https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLProgram
 * 合并shader，并缓存进gl，便于之后使用
 * 不提倡luma.gl的写法，即对gl对象添加属性，形如 gl.luma = {}
 * 所以在此类提供两个方法，为不同的实例化
 * @author yellow date 2017/6/12
 */
import Dispose from './../../utils/Dispose';
import { stamp } from './../../utils/stamp';
import { GLFragmentShader, GLVertexShader } from './GLShader';
import GLConstants from './GLConstants';

class GLProgram extends Dispose {
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
   * @type {WebGLProgram}
   */
  _program;
  /**
   * 创建program
   * @param {WebGLRenderingContext} gl 
   * @param {String} fragmentSource glsl shader文本
   * @param {String} vertexSource glsl shader文本
   * @param {GLExtension} extension
   */
  constructor(gl, vertexSource, fragmentSource,extension) {
    super();
    this._gl= gl;
    this._extension =extension;
    this._vs = new GLVertexShader(gl, vertexSource,extension),
    this._fs = new GLFragmentShader(gl, fragmentSource,extension);
    this._handle = this._createHandle();
    this._gl.attachShader(this._handle, this._vs.handle);
    this._gl.attachShader(this._handle, this._fs.handle);
  }
  
  _createHandle(){
    return this._gl.createProgram();
  }

  useProgram(){
    this._gl.useProgram(this.handle);
  }
  /**
   * 获取attribute地址
   * @param {String} name
   * @return {number} 
   */
  getAttribLocation(name){
    const attributeLocation = this._gl.getAttribLocation(this.handle,name);
    return attributeLocation;
  }
  /**
   * 获取uniform地址
   * @param {String} name 
   * @return {number} 
   */
  getUniformLocation(name){
    const uniformLocation = this._gl.getUniformLocation(this.handle,name);
  }
  /**
   * 清理绑定信息，销毁program对象
   */
  dispose(){

  }

};


export default GLProgram;