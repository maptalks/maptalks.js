/**
 * 提供shader程序创建，销毁，应用等
 * 模拟WebGLShader对象，记录处理对象内容，并转换为可执行的操作记录
 * @author yellow 2017/6/12
 * @modify yellow 2017/12/25 不涉及真实buffer的创建
 */

const isString = require('./../utils/isString'),
    setId = require('./../utils/stamp').setId,
    Dispose = require('./../utils/Dispose'),
    GLConstants = require('./GLConstants');

/** 
 * Shader抽象类
 * @class
 */
class GLShader extends Dispose {
    /**
     * Creates an instance of Shader.
     * @constructor
     * @param {WebGLRenderingContext} gl 
     * @param {Object} source
     * @param {String} [source.source]
     * @param {String} [source.name] 
     * @param {String} shaderType 
     * @param {GLExtension} extension
     */
    constructor(shaderType,glContextId,extension) {
        super();
        /**
         * shaderType为顶点还是面片
         */
        this._shaderType = shaderType;
        /**
         * 创建此shader的glcontext上下文id
         */
        this._glContextId = glContextId;
        /**
         * 全局扩展获取
         */
        this._extension = extension;
    }
    /**
     * delete shader form gl
     */
    dispose() {
   
    }
    /**
     * overwrite 
     */
    _createHandle() {
      
    }
}

module.exports = GLShader;