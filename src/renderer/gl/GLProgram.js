/**
 * the program 
 * reference https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLProgram
 * 合并shader，并缓存进gl，便于之后使用
 * 不提倡luma.gl的写法，即对gl对象添加属性，形如 gl.luma = {}
 * 所以在此类提供两个方法，为不同的实例化
 * @author yellow date 2017/6/12
 */

import { stamp } from './../../utils/stamp';
import { FragmentShader, VertexShader } from './GLShader';
import GLConstants from './GLConstants';

class GLProgram {

  _vs;
  /**
   * @type {}
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
   */
  constructor(gl, vertexSource, fragmentSource) {
    let vs = new VertexShader(gl, vertexSource),
      fs = new FragmentShader(gl, fragmentSource);
    //
    let program = gl.createProgram();
    gl.attachShader(program, vs.handle);
    gl.attachShader(program, fs.handle);
  }




}




export default GLProgram;