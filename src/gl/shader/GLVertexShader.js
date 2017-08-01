/**
 * vertex shader object
 * @author yellow date 2017/6/12
 */
const GLShader = require('./../GLShader'),
    GLConstants = require('./../GLConstants');

/**
 * @class
 */
class GLVertexShader extends GLShader {
    /**
     * 创建vertex shader
     * @param {WebGLRenderingContext} gl 
     * @param {String} source 
     * @param {GLExtension} extension
     */
    constructor(gl, source, extension) {
        super(gl, source, GLConstants.VERTEX_SHADER, extension);
    }
}

module.exports = GLVertexShader;