/**
 * -import from namespace renderer
 * -const polyfill = require('babel-polyfill'); 
 * @author yellow date 2017/6/20
 * @modify yellow date 2017/9/11
 */
const stamp = require('./utils/stamp').stamp;
const GLCanvas = require('./gl/GLCanvas');
// const GLContext = require('./gl/GLContext');


/**
 *  本地测试
 */
const vertexShaderSource = `#version 300 es
 
// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
 
// all shaders have a main function
void main() {
 
  // gl_Position is a special variable a vertex shader
  // is responsible for setting
  gl_Position = a_position;
}
`;
 
const fragmentShaderSource = `#version 300 es
 
// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default. It means "medium precision"
precision mediump float;
 
// we need to declare an output for the fragment shader
out vec4 outColor;
 
void main() {
  // Just set the output to a constant redish-purple
  outColor = vec4(1, 0, 0.5, 1);
}
`;



/**
 * 模拟空的doucmentCanvas
 */
const htmlCanvas = {};

const canvasId = stamp(htmlCanvas);

const glCanvas = new GLCanvas(canvasId);

const gl = glCanvas.getContext('webgl');


 

