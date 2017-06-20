/**
 * the program
 * @author yellow date 2017/6/12
 */

import { stamp } from './../../utils/stamp';
import { FragmentShader, VertexShader } from './GLShader';
import GLConstants from './GLConstants';


let getVaryingMap = (varyings, bufferMode) => {
  const varyingMap = {};
  let index = 0;
  for (const varying of varyings) {
    if (bufferMode === GLConstants.SEPARATE_ATTRIBS) {
      varyingMap[varyings] = { index };
      index++;
    } else if (varying === 'gl_NextBuffer') {
      index++;
    } else {
      // Add a "safe" offset as fallback unless app specifies it
      // Could query
      varyingMap[varyings] = { index, offset: 16 };
    }
  }
  return varyingMap;
}

let getUniformDescriptors = (gl, program) => {
  const uniformDescriptors = {};
  const length = program.getUniformCount();
  for (let i = 0; i < length; i++) {
    const info = program.getUniformInfo(i);
    const location = program.getUniformLocation(info.name);
    const descriptor = getUniformSetter(gl, location, info);
    uniformDescriptors[descriptor.name] = descriptor;
  }
  return uniformDescriptors;
}


/**
 * @class GLProgram
 */
class GLProgram {

  /**
   * vertex shader
   */
  _vs;
  /**
   * fragment shader
   */
  _fs;
  /**
   * program id
   */
  _id;
  /**
   * @attribute {WebGLRenderingContext}
   */
  _gl;
  /**
   * program
   */
  _handle;

  _varyings;
  /**
   * 
   * @param {WebGLRenderingContext} gl 
   * @param {Object} options the options
   * @param {String} options.vs vertex shader source
   * @param {String} options.fs fragment shader source
   * @param {String} [options.id] the id of program
   */
  constructor(gl, options) {
    options = options || {};
    this._gl = gl;
    this._id = options.id || stamp(this);
    this._handle = this._gl.createProgram();
    this._resolveOptions(options);
  };

  _resolveOptions({ vs, fs, uniforms, varyings, bufferMode = GLConstants.SEPARATE_ATTRIBS } = {}) {
    //create shaders
    this._vs = new VertexShader(this._gl, vs);
    this._fs = new FragmentShader(this._gl, fs);
    this._unifroms = uniforms;
    //setup varyings if supplied
    if (!!varyings) {
      this._gl.transformFeedbackVaryings(this._handle, varyings, bufferMode);
      this._varyings = getVaryingMap(varyings, bufferMode);
    }
    //
    this._compileAndLink();
    this._attributeLocations = this._getAttributeLocations();
    this._attributeCount = this._getAttributeCount();
    this._warn = [];
    this._filledLocations = {};
    this._uniformSetters = this._getUniformSetters();
    this._uniformCount = this._getUniformCount();
    this._textureIndexCounter = 0;
  }

  get handle() {
    return this._handle;
  };

  _compileAndLink() {
    let gl = this._gl;
    gl.attachShader(this.handle, this.vs.handle);
    gl.attachShader(this.handle, this.fs.handle);
    gl.linkProgram(this.handle);
    // Avoid checking program linking error in production
    if (gl.debug) {
      gl.validateProgram(this.handle);
      const linked = gl.getProgramParameter(this.handle, gl.LINK_STATUS);
      if (!linked) throw new Error(`Error linking ${gl.getProgramInfoLog(this.handle)}`);
    }
  };

  _getAttributeLocations() {
    const attributeLocations = {};
    const length = this._getAttributeCount();
    for (let location = 0; location < length; location++) {
      const name = this.getAttributeInfo(location).name;
      attributeLocations[name] = this.getAttributeLocation(name);
    }
    return attributeLocations;
  };

  _getAttributeCount() {
    return this._getParameter(GLConstants.ACTIVE_ATTRIBUTES);
  };

  _getUniformCount() {
    return this._getParameter(GLConstants.ACTIVE_UNIFORMS);
  };

  _getUniformSetters() {
    const gl = this._gl;
    const uniformSetters = {};
    const length = this._getUniformCount();
    for (let i = 0; i < length; i++) {
      const info = this.getUniformInfo(i);
      const parsedName = parseUniformName(info.name);
      const location = this.getUniformLocation(parsedName.name);
      uniformSetters[parsedName.name] =
        getUniformSetter(gl, location, info, parsedName.isArray);
    }
    return uniformSetters;
  };

  use() {
    this._gl.useProgram(this._handle);
    return this;
  };

  /**
   * reference https://github.com/uber/luma.gl/blob/master/src/webgl/program.js line:90
   * @param {Object} param0 
   */
  draw({drawMode = GL.TRIANGLES,
        vertexCount,offset = 0,
        start,
        end,
        isIndexed = false,
        indexType = GL.UNSIGNED_SHORT,
        isInstanced = false,
        instanceCount = 0,
        vertexArray = null,
        transformFeedback = null,
        uniforms = {},
        samplers = {},
        settings = {}
  }) {
    


  };

};


export default GLProgram;