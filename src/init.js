// use polyfill
// import './../node_modules/babel-polyfill/dist/polyfill';
/**
 * improt from namespace core
 */

const RenderNode = require('./core/RenderNode');
const RenderManager = require('./core/RenderManager');
const Container = require('./core/Container');

module.exports.RenderNode = RenderNode;
module.exports.RenderManager = RenderManager;
module.exports.Container = Container;
/**
 * import from namespace renderer
 */
const Context = require('./gl/Context');
const GLIndexbuffer = require('./gl/buffer/GLIndexbuffer');
const GLVertexbuffer = require('./gl/buffer/GLVertexbuffer');
const GLProgram = require('./gl/GLProgram');
const GLFragmentShader = require('./gl/shader/GLFragmentShader');
const GLVertexShader = require('./gl/shader/GLVertexShader');
const GLTexture = require('./gl/GLTexture');
const GLVertexArrayObject = require('./gl/GLVertexArrayObject');

module.exports.gl = {
    Context,
    GLIndexbuffer,
    GLVertexbuffer,
    GLProgram,
    GLFragmentShader,
    GLVertexShader,
    GLTexture,
    GLVertexArrayObject
}

//
