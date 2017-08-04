
/**
 * 
 * @author yellow date 2017/8/4
 */
const GLFragmentShader = require('./GLFragmentShader'),
    GLVertexShader = require('./GLVertexShader');
/**
 * import glsl from shaderlib
 */
const shaderLib = {
    default_fragment: require('./lib/default.fragment.glsl'),
    default_vertex: require('./lib/default.vertex.glsl')
}
/**
 * @class
 * @static
 */
class GLShaderFactory  {
    /**
     * create shaders
     * @param {String} name 
     * @param {WebGLRenderingContext} gl 
     * @param {GLExtension} extension 
     */
    static create(name, gl, extension) {
         const vertexKey = `${name}_vertex`,
            fragmentKey=`${name}_fragment`;

         return [new GLVertexShader(gl, shaderLib[vertexKey], extension), new GLFragmentShader(gl, shaderLib[fragmentKey], extension)];
    }
}

module.exports = GLShaderFactory;
