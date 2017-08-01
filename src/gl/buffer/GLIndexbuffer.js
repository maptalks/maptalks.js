/**
 *
 */
const GLBuffer = require('./../GLBuffer'),
    GLConstants = require('./../GLConstants');

/**
 * @class
 */
class GLIndexbuffer extends GLBuffer {
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     * @param {ArrayBuffer| SharedArrayBuffer|ArrayBufferView} data 
     * @param {gl.STATIC_DRAW|gl.DYNAMIC_DRAW|gl.STREAM_DRAW} drawType 
     */
    constructor(gl, data, drawType) {
        super(gl, GLConstants.ELEMENT_ARRAY_BUFFER, data, drawType);
    }
}

module.exports = GLIndexbuffer;