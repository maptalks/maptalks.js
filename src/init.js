/**
 * -import from namespace renderer
 * -const polyfill = require('babel-polyfill'); 
 * @author yellow date 2017/6/20
 * @modify yellow date 2017/9/11
 */
const getId = require('./utils/stamp').stamp;
const GLCanvas = require('./gl/GLCanvas');
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
    /**
     * get fusion unique id
     */
    getId:getId,
    /**
     * main class of fusion.gl 
     */
    gl:{
        GLCanvas,
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