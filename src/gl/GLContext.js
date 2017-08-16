/**
 * warpped the WebGLRenderingContext
 * reference:
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext
 * 
 * 管理
 * -cache
 * 
 * reference https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmapRenderingContext/transferFromImageBitmap
 * 使用 OffscreenCanvas 创建不可见绘制canvas,后基于此canvas绘制图像，并保存成bitmap缓存帧
 * var htmlCanvas = document.getElementById("htmlCanvas").getContext("bitmaprenderer");
 * 预留一定的帧数后，使用bitmaprender绘制bitmap到前端canvas即可
 * htmlCanvas.transferFromImageBitmap(bitmap);
 * context相当于webglRender
 * 
 * @author yellow 2017/6/11
 * @modify yellow 2017/8/8
 * 
 * 
 */
const merge = require('./../utils/merge'),
    isFunction = require('./../utils/isFunction'),
    isNode = require('./../utils/isNode'),
    mapFunc = require('./../utils/mapFunc'),
    stamp = require('./../utils/stamp').stamp,
    humpToContinuous = require('./../utils/strManipulate').humpToContinuous,
    createTiny = require('./../dispatch/createTiny').createTiny,
    InternalTinys = require('./../dispatch/createTiny').InternalTinys,
    OverrallTinys= require('./../dispatch/createTiny').OverrallTinys,
    Dispose = require('./../utils/Dispose'),
    GLVertexShader = require('./shader/GLVertexShader'),
    GLFragmentShader = require('./shader/GLFragmentShader'),
    GLTexture = require('../gl/GLTexture'),
    GLConstants = require('./GLConstants'),
    GLExtension = require('./GLExtension'),
    GLLimits = require('./GLLimits'),
    GLProgram = require('./GLProgram');

    //without canvas,drawingBufferHeight,drawingBufferWidth
    //no implement :linkProgram,attachShader,compileShader
    // 'createProgram',
    // 'createShader',
    // 'createTexture',
//及时处理的函数
const ImplementBridge = [
    'isShader',
    'isBuffer',
    'isProgram',
    'isContextLost',
    'deleteBuffer',
    'createBuffer',
    'createFramebuffer',
    'getBufferParameter',
    'getParameter',
    'getError',
    'getProgramInfoLog',
    'getShaderInfoLog'
];

/**
 * @class
 * @example
 * let cvs = document.createElement('canvas'),
 *  ctx = new Context(cvs);
 */
class GLContext extends Dispose {
    /**
     * @param {Object} options
     * @param {HTMLCanvasElement} options.canvas
     * @param {WebGLRenderingContext} options.gl
     * @param {String} options.renderType 'webgl'、'webgl2'
     * @param {GLExtension} [options.glExtension] 
     * @param {GLLimits} [options.glLimits]
     */
    constructor(options = {}) {
        super();
        /**
         * @type {HTMLCanvasElement}
         */
        this._canvas = options.canvas || null;
        /**
         *  @type {WebGLRenderingContext}
         */
        this._gl = options.gl;
        /**
         * webgl扩展
         * @type {GLExtension}
         */
        this._glExtension = options.glExtension;
        /**
         * get parameter and extensions
         * @type {GLLimits}
         */
        this._glLimits = options.glLimits;
        /**
         * the program cache
         * @type {Object}
         */
        this._programCache = {};
        /**
         * the shader cache
         * @type {Object}
         */
        this._shaderCache={};
        /**
         * the texture cache
         */
        this._textureCache={};
        /**
         * current using program
         * @type {GLProgram}
         */
        this._glProgram = null;
        /**
         * setup env
         */
        this._setup();
        /**
         * map glContext to Context
         */
        this._map();
    };
    /**
     * 设置绘制区域的规则
     * 1. 混合颜色
     * 2. 深度
     * 3.
     */
    _setup() {
        const gl = this._gl;
        //reference http://www.cppblog.com/wc250en007/archive/2012/07/18/184088.html
        //gl.ONE 使用1.0作为因子，相当于完全使用了这种颜色参与混合运算
        //gl.ONE_MINUS_SRC_ALPHA 使用1.0-源颜色alpha值作为因子，
        //作用为：源颜色的alpha作为不透明度，即源颜色alpha值越大，混合时占比越高，混合时最常用的方式
        gl.enable(GLConstants.BLEND);
        gl.blendFunc(GLConstants.ONE, GLConstants.ONE_MINUS_SRC_ALPHA);
        //为了模仿真实物体和透明物体的混合颜色，需要使用深度信息
        //http://www.cnblogs.com/aokman/archive/2010/12/13/1904723.html
        //模版缓存区测试，用来对比当前值与预设值，用以判断是否更新此值
        //顺序为：(framment + associated data) - pixel ownership test - scissor test
        //       - alpha test - stencil test - depth test
        //       - blending - dithering - logic op - framebuffer
        //在模板测试的过程中，可以先使用一个比较用掩码（comparison mask）与模板缓冲区中的值进行位与运算，
        //再与参考值进行比较，从而实现对模板缓冲区中的值的某一位上的置位状态的判断。
        gl.enable(GLConstants.STENCIL_TEST);
        //gl.stencilFunc(gl)
        gl.enable(GLConstants.DEPTH_TEST);
        //深度参考值小于模版值时，测试通过
        gl.depthFunc(GLConstants.LEQUAL); 
        gl.depthMask(false);
    }
    /**
     * map相关属性与方法
     */
    _map() {
        const that =this;
        //get the WebGLRenderingContext
        const gl = this._gl;
        //1.map constant
        for (const key in GLConstants) {
            if (!this.hasOwnProperty(key)) {
                const target = GLConstants[key];
                if (!this[key] && !!target)
                    this[key] = target;
            }
        }
        //map ImplementBridge
        for(let i=0,len=ImplementBridge.length;i<len;i++){
            const key = ImplementBridge[i];
            this[key]=(...rest)=>{
                return gl[key].apply(gl,rest);
            }
        }
        //map internalTinyOperation
        for(const key in InternalTinys){
            if(InternalTinys[key]){
                this[key] = (...rest)=>{
                    const glProgram = this._glProgram;
                    createTiny(key,glProgram,rest);
                }
            }
        }
        //map overrallTinyOperation,construct rollback at the same time
        for(const key in OverrallTinys){
            if(OverrallTinys[key]){
                this[key] = (...rest)=>{
                    const glProgram = this._glProgram;
                    createTiny(key,glProgram,rest);
                }
            }
        }
    }
    /**
     * 获取canvas
     */
    get canvas() {
        const gl = this._gl;
        return gl.canvas;
    }
    /**
     * 获取drawingBuffer的width
     */
    get drawingBufferWidth(){
        const gl = this._gl;
        return gl.drawingBufferWidth;
    }
    /**
     * 获取drawingBuffer的height
     */
    get drawingBufferHeight(){
        const gl = this._gl;
        return gl.drawingBufferHeight;
    }
    /**
     * @return {WebGLProgram}
     */
    createProgram() {
        const gl = this._gl;
        //1.创建GLProgram
        const glProgram = new GLProgram(gl);
        //2.缓存program
        this._programCache[glProgram.id] = glProgram;
        //3.返回句柄
        return glProgram.handle;
    }
    /**
     * create shader
     * @param {number} type
     * @return {WebGLShader}
     */
    createShader(type) {
        const gl = this._gl,
            glExtension = this._glExtension;
        let glShader =null;
        if(type===GLConstants.VERTEX_SHADER){
            glShader = new GLVertexShader(gl,null,glExtension);
        }else if(type === GLConstants.FRAGMENT_SHADER){
            glShader = new GLFragmentShader(gl,null,glExtension);
        }
        if(!!glShader){
            this._shaderCache[glShader.id] = glShader;
            return glShader.handle;
        }
        return null;
    }
    /**
     * @return {WebGLTexture}
     */
    createTexture(){
        const gl = this._gl;
        const glTexture = new GLTexture(gl);
        this._textureCache[glTexture.id] = glTexture;
        return glTexture.handle;
    }
    /**
     * 注意在处理tiny的时候，需先useProgram
     * @param {WebGLProgram} program
     */
    useProgram(program) {
        const id = stamp(program);
        this._glProgram = this._programCache[id];
        createTiny(this._glProgram,'useProgram',arguments);
    }
    /**
     * 获取extension
     */
    getExtension(name) {
        const glExtension = this._glExtension;
        return glExtension.getExtension(name);
    }
    /**
     * 
     * @param {WebGLProgram} program 
     * @param {WebGLShader} shader 
     */
    attachShader(program, shader) {
        const glProgram = this._programCache[stamp(program)];
        const glShader = this._shaderCache[stamp(shader)];
        glProgram.attachShader(glShader);
    }
    /**
     * 
     * @param {WebGLShader} shader 
     * @param {String} source 
     */
    shaderSource(shader, source) {
        const glShader = this._shaderCache[stamp(shader)];
        glShader.source = source;
    }
    /**
     * 
     * @param {WebGLShader} shader 
     * @param {number} pname 
     */
    getShaderParameter(shader, pname) {
        const gl = this._gl;
        return gl.getShaderParameter(shader, pname)
    }
    /**
     * 
     * @param {WebGLProgram} program 
     * @param {number} pnam 
     * @return {any}
     */
    getProgramParameter(program, pnam) {
        const gl = this._gl;
        return gl.getProgramParameter(program, pnam);
    }
    /**
     * no need to implement
     */
    compileShader(shader) { 
        const gl = this._gl;
        gl.compileShader(shader);
    }
    /**
     * no needs to implement this function
     * @param {WebGLProgram} program 
     */
    linkProgram(program) { }
    /**
     * 
     * @param {WebGLProgram} program 
     * @param {number} index 
     * @return {WebGLActiveInfo}
     */
    getActiveUniform(program, index) {
        const gl = this._gl;
        return gl.getActiveUniform(program, index);
    }
    /**
     * 
     * @param {WebGLProgram} program 
     * @param {number} index 
     * @return {WebGLActiveInfo}
     */
    getActiveAttrib(program, index) {
        const glProgram = this._programCache[stamp(program)];
        return glProgram.getActiveAttrib(index)
    }
    /**
     * 
     * @param {WebGLProgram} program 
     * @param {number} name 
     * @return {WebGLUniformLocation}
     */
    getUniformLocation(program, name) {
        const glProgram = this._programCache[stamp(program)];
        return glProgram.uniforms[name];
    }

    /**
     * 
     * @param {WebGLProgram} program 
     * @param {number} name 
     * @return {number}
     */
    getAttribLocation(program, name) {
        const glProgram = this._programCache[stamp(program)];
        return glProgram.attributes[name];
    }
    /**
     * 
     * @param {number} mode 
     * @param {number} count 
     * @param {number} type 
     * @param {number} offset 
     */
    drawElements(mode, count, type, offset) {
        // const programCache = this._programCache;
        // for(const key in programCache){
        //     const glProgram = programCache[key];
        //     glProgram.useProgram();
        //     glProgram.update();
        //     glProgram.drawElements(mode, count, type, offset);
        // }
        //
        const gl = this._gl;
        gl.drawElements(mode, count, type, offset);
    }

    /**
     * 
     * @param {*} mode 
     * @param {*} first 
     * @param {*} count 
     */
    drawArrays(mode,first,count){
        const gl = this._gl;
        if(gl.program!==this._program){
            this.useProgram(this._program)
        }
        gl.drawArrays(mode,first,count);
    }

    /**
     * webgl2 support
     */
    createTransformFeedback(){
        const gl = this._gl;
        return gl.createTransformFeedback?gl.createTransformFeedback():null;
    }
    /**
     * webgl2 support
     * @param {*} target 
     * @param {*} transformFeedback 
     */
    bindTransformFeedback(target, transformFeedback){
        const gl = this._gl;
        return gl.bindTransformFeedback?gl.bindTransformFeedback(target, transformFeedback):null;
    }

}

module.exports = GLContext;