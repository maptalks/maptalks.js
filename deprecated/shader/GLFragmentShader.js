/**
 * fragment shader object
 * @author yellow date 2017/6/12
 */
const GLShader = require('./../GLShader'),
    GLConstants = require('./../GLConstants');

/**
 * @class
 */
class GLFragmentShader extends GLShader {
    /**
     * 创建fragment shader
     * @param {WebGLRenderingContext} gl 
     * @param {String} source 
     * @param {GLExtension} extension
     */
    constructor(gl, source, extension) {
        super(gl, source, GLConstants.FRAGMENT_SHADER, extension);
    }
}

module.exports = GLFragmentShader;