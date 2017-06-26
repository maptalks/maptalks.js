/**

 * reference https://github.com/mapbox/mapbox-gl-js/blob/master/src/data/buffer.js
 * 
 * Vertext Array class turns a structArray into WebGL buffer,each member of the structArray's Struct type is converted to a WebGL attribute
 * 
 * @author yellow date 2017/6/16
 * @class 
 */

class GLVertexArray{

    _gl;

    /**
     * 
     * @param {WebGLRenderingContext} gl 
     */
    constructor(gl){
        this._gl=gl;
        this._buffer = gl.createBuffer();
    }


}