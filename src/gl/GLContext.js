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
    Tiny = require('./../core/Tiny'),
    Dispose = require('./../utils/Dispose'),
    GLVertexShader = require('./shader/GLVertexShader'),
    GLFragmentShader = require('./shader/GLFragmentShader'),
    GLTexture = require('../gl/GLTexture'),
    GLConstants = require('./GLConstants'),
    GLExtension = require('./GLExtension'),
    GLLimits = require('./GLLimits'),
    GLProgram = require('./GLProgram');

const ALL_ENUM = require('./../core/handle').ALL_ENUM;

const GLPROGRAMS = require('./../utils/util').GLPROGRAMS,
    GLSHADERS = require('./../utils/util').GLSHADERS,
    GLTEXTURES = require('./../utils/util').GLTEXTURES;

/**
 * 实时处理的函数,多为直接获取结果函数
 * needs to be executing in real time1
 */
const BRIDGE_ARRAY = [
    'isShader',
    'isBuffer',
    'isProgram',
    'isTexture',
    'isContextLost',
    'getBufferParameter',
    'getProgramParameter',
    'getShaderParameter',
    'getTexParameter',
    'getParameter',
    //'getExtension',
    'getError',
    'getProgramInfoLog',
    'getShaderInfoLog',
    'getActiveAttrib',
    'getActiveUniform',
    'getAttribLocation',
    'getUniform',
    'getUniformLocation',
    'getVertexAttrib',
    'getVertexAttribOffset'
];
/**
 * @class
 * @example
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
         * the ticker datasource
         * @type {Tiny}
         */
        this._tiny = new Tiny(this);
        /**
         * current using program
         * @type {GLProgram}
         */
        //this._glProgram = null;
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
        //get the WebGLRenderingContext
        const gl = this._gl;
        //get tiny
        const tiny = this._tiny;
        //map constant
        for (const key in GLConstants) {
            if (!this.hasOwnProperty(key)) {
                const target = GLConstants[key];
                if (!this[key] && !!target)
                    this[key] = target;
            }
        }
        //map ImplementBridge
        for (let i = 0, len = BRIDGE_ARRAY.length; i < len; i++) {
            const key = BRIDGE_ARRAY[i];
            this[key] = (...rest) => {
                console.log(`${key},birdge`);
                return gl[key].apply(gl, rest);
            }
        }
        //map internalTinyOperation
        for (const key in ALL_ENUM) {
            this[key] = (...rest) => {
                console.log(`${key},internal`);
                //gl[key].apply(gl, rest);
                tiny.push(key,...rest);
            }
        }
    }
    /**
     * @return {WebGLRenderingContext}
     */
    get gl(){
        return this._gl;
    }
    /**
     * 获取canvas
     */
    get canvas() {
        const gl = this._gl;
        console.log(`canvas,birdge`);
        return gl.canvas;
    }
    /**
     * 获取drawingBuffer的width
     */
    get drawingBufferWidth() {
        const gl = this._gl;
        console.log(`drawingBufferWidth,birdge`);
        return gl.drawingBufferWidth;
    }
    /**
     * 获取drawingBuffer的height
     */
    get drawingBufferHeight() {
        const gl = this._gl;
        console.log(`drawingBufferHeight,birdge`);
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
        GLPROGRAMS[glProgram.id] = glProgram;
        console.log(`createProgram,birdge`);
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
        let glShader = null;
        console.log(`createShader,birdge`);
        if (type === GLConstants.VERTEX_SHADER) {
            glShader = new GLVertexShader(gl, null, glExtension);
        } else if (type === GLConstants.FRAGMENT_SHADER) {
            glShader = new GLFragmentShader(gl, null, glExtension);
        }
        if (!!glShader) {
            GLSHADERS[glShader.id] = glShader;
            return glShader.handle;
        }
        return null;
    }
    /**
     * @return {WebGLTexture}
     */
    createTexture() {
        const gl = this._gl;
        const glTexture = new GLTexture(gl);
        GLTEXTURES[glTexture.id] = glTexture;
        console.log(`createTexture,birdge`);
        return glTexture.handle;
    }
    /**
     * @return {WebGLBuffer}
     */
    createBuffer(){
        const gl = this._gl;
        console.log(`createBuffer,birdge`);
        return gl.createBuffer();
    }
    /**
     * @type {WebGLFramebuffer}
     */
    createFramebuffer(){
        const gl = this._gl;
        console.log(`createFramebuffer,birdge`);
        return gl.createFramebuffer();
    }
    /**
     * 注意在处理tiny的时候，需先useProgram
     * @param {WebGLProgram} program
     */
    useProgram(program) {
        const id = stamp(program),
            tiny = this._tiny,
            glProgram = GLPROGRAMS[id];
        glProgram.useProgram();
        console.log(`useProgram,birdge`);
        //this._glProgram = glProgram;
        tiny.switchPorgarm(glProgram);
    }
    /**
     * 获取extension
     */
    getExtension(name) {
        const glExtension = this._glExtension;
        console.log(`getExtension,birdge`);
        return glExtension.getExtension(name);
    }
    /**
     * 
     * @param {WebGLProgram} program 
     * @param {WebGLShader} shader 
     */
    attachShader(program, shader) {
        const glProgram = GLPROGRAMS[stamp(program)];
        const glShader = GLSHADERS[stamp(shader)];
        console.log(`attachShader,birdge`);
        glProgram.attachShader(glShader);
    }
    /**
     * 
     * @param {WebGLShader} shader 
     * @param {String} source 
     */
    shaderSource(shader, source) {
        const gl = this._gl;
        console.log(`shaderSource,birdge`);
        gl.shaderSource(shader, source);
    }
    /**
     * no need to implement
     */
    compileShader(shader) {
        const gl = this._gl;
        console.log(`compileShader,birdge`);
        gl.compileShader(shader);
    }
    /**
     * no needs to implement this function
     * @param {WebGLProgram} program 
     */
    linkProgram(program) {
        const gl = this._gl;
        console.log(`linkProgram,birdge`);
        gl.linkProgram(program);
    }
}

module.exports = GLContext;