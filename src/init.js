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

/**
 * debug
 */


// const THREE = require('three.js');

// /**
//  * @type {WebGLRenderingContext}
//  */
// const gl = new GLContext({
//     width:600,
//     height:600
// })

// var renderer = new THREE.WebGLRenderer({context:gl});


// const obj ={
//     position:[-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0]
// }

// const veterxBuffer = new GLVertexbuffer(gl,obj.position);

// const shaders = GLShaderFactory.create('default',gl,null);

// const program = new GLProgram(gl,shaders[0],shaders[1]);

// const programId=program.id;

// ctx.mergeProrgam(program);

// const program2 = ctx.useProgram(programId);



