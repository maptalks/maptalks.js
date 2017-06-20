/**
 * reference https://github.com/uber/luma.gl/blob/master/src/webgl/vertex-attributes.js
 * 
 * manipulating the vertext attributes array for shader execution
 * data stored with gl itself
 * 
 * vertex attributes are stored in 'arrays' with indices form 0 and up.
 * During shader execution,these indices(or 'locations') are matched to the indices assigned to shader attributes during WebGLProgram linking
 * 
 * Use VertexArray to manage multiple arrays
 * 
 * so,each vertex attribute has these properties
 * -enable or disable
 * -has an instance divisor
 * -has a size (1-4,eg. vec3 vec4)
 * -has a value or values that is accessible in shaders
 * 
 * attribute values are either
 * -generic:a constant value for all vertices/instances.or
 * -bound to WebGLBuffer with unique values for each vertex/instance
 * 
 * binding to WebGLBuffer it is necessary to specify the layout of data in the buffer:
 * -size
 * -data type( e.g. gl.BYTE)
 * -stride,offset,and integer normalization policy can also be specified
 * simpleness as 'gl.draw()'
 * 
 * all the indices and vertex data stored in gl.GLVertexAttribute
 * 
 * @author yellow date 2017/6/17
 * 
 */

import GLConstants from './GLConstants';

const ANGLE_instanced_arrays='ANGLE_instanced_arrays';

/**
 * @class GLVertexAttribute
 * let attributes = new GLVertexAttribute(gl);
 * attributes.
 */
class GLVertexAttribute {

    _gl;

    _isWebgl2;

    constructor(gl, options) {
        this._gl = gl;
        this._isWebgl2 = options.isWebgl2;
        this._gl.GLVertexAttribute = gl.GLVertexAttribute || {};
    }

    get MaxAttributes() {
        return this._gl.getParameter(GLConstants.MAX_VERTEX_ATTRIBS);
    };

    get HasDivisor() {
        return this._isWebgl2 && this._gl.getExtension(ANGLE_instanced_arrays);
    }

    /**
     * 
     * @param {GLunit} location , GLunit
     * @param {GLenum} pName , GLEnum 
     */
    getAttrib(location,pName){
        this._gl.getVertexAttrib(location,pName);
    }

    /**
     * turn on the location
     * @param {GLunit} location 
     */
    turnOn(location){
        this._gl.enableVertexAttribArray(location);
    }

    turnOff(location){
        if(location===0) return;
        this._gl.disableVertexAttribArray(location);
    }

}