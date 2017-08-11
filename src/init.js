// use polyfill
// import './../node_modules/babel-polyfill/dist/polyfill';
/**
 * import from namespace renderer
 */
const GLContext = require('./gl/GLContext');
const GLIndexbuffer = require('./gl/buffer/GLIndexbuffer');
const GLVertexbuffer = require('./gl/buffer/GLVertexbuffer');
const GLProgram = require('./gl/GLProgram');
const GLFragmentShader = require('./gl/shader/GLFragmentShader');
const GLVertexShader = require('./gl/shader/GLVertexShader');
const GLTexture = require('./gl/GLTexture');
const GLVertexArrayObject = require('./gl/GLVertexArrayObject');
const GLShaderFactory = require('./gl/shader/GLShaderFactory');

module.exports = {
    gl:{
        GLContext,
        GLIndexbuffer,
        GLVertexbuffer,
        GLProgram,
        GLFragmentShader,
        GLVertexShader,
        GLTexture,
        GLShaderFactory,
        GLVertexArrayObject
    }
}



