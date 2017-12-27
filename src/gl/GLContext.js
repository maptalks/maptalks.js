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
    Dispose = require('./../utils/Dispose'),
    GLConstants = require('./GLConstants'),
    //

    GLShader = require('./GLShader'),


    GLTexture = require('./GLTexture'),

    GLExtension = require('./GLExtension'),
    GLLimits = require('./GLLimits'),
    GLProgram = require('./GLProgram');

const Resource = require('./../core/Resource');

const GLPROGRAMS = require('./../utils/util').GLPROGRAMS,
    GLSHADERS = require('./../utils/util').GLSHADERS,
    GLTEXTURES = require('./../utils/util').GLTEXTURES;

const OVERRAL_ENUM = {
    'texParameterf': true,
    'texParameteri': true,
    'bindTexture': true,
    'compressedTexImage2D': true,
    'compressedTexSubImage2D': true,
    'viewport': true,
    'scissor': true,
    'enable': true,
    'disable': true,
    'texParameteri': true,
    'texImage2D': true,
    'texSubImage2D': true,
    'depthFunc': true,
    'depthMask': true,
    'colorMask': true,
    // 'clearColor': true,
    // 'clearDepth': true,
    // 'clear': true,
    // 'clearStencil': true,
    'frontFace': true,
    'cullFace': true,
    'blendEquationSeparate': true,
    'blendFuncSeparate': true,
    'pixelStorei': true,
    'generateMipmap': true,
    'activeTexture': true,
    'blendEquation': true,
    'blendFunc': true,
    'stencilOp': true,
    'stencilFunc': true,
    'stencilMask': true,
    'texParameterf': true,
    'hint': true
};

const TICKER_ENUM = {
    'drawElements': true,
    'drawArrays': true
};

const GL2_ENUM = {
    'bindTransformFeedback': true
};

const INTERNAL_ENUM = {
    'lineWidth': true,
    'deleteBuffer': true,
    'deleteShader': true,
    'deleteProgram': true,
    'deleteFramebuffer': true,
    'deleteRenderbuffer': true,
    'deleteTexture': true,
    //
    'bindAttribLocation': true,
    'bindRenderbuffer': true,
    'renderbufferStorage': true,
    'framebufferRenderbuffer': true,
    //
    'bindFramebuffer': true,
    'framebufferTexture2D': true,
    'readPixels': true,
    //buffer-uinform-attrib
    'bindBuffer': true,
    'bufferData': true,
    'bufferSubData': true,
    'disableVertexAttribArray': true,
    'enableVertexAttribArray': true,
    'vertexAttribPointer': true,
    //uniformMatrix
    'uniformMatrix2fv': true,
    'uniformMatrix3fv': true,
    'uniformMatrix4fv': true,
    //uniform1[f][i][v]
    'uniform1f': true,
    'uniform1fv': true,
    'uniform1i': true,
    'uniform1iv': true,
    //uniform2[f][i][v]
    'uniform2f': true,
    'uniform2fv': true,
    'uniform2i': true,
    'uniform2iv': true,
    //uniform3[f][i][v]
    'uniform3f': true,
    'uniform3fv': true,
    'uniform3i': true,
    'uniform3iv': true,
    //uniform4[f][i][v]
    'uniform4f': true,
    'uniform4fv': true,
    'uniform4i': true,
    'uniform4iv': true,
    //vertexAttrib1f
    'vertexAttrib1f': true,
    'vertexAttrib2f': true,
    'vertexAttrib3f': true,
    'vertexAttrib4f': true,
    //vertexAttrib1fv
    'vertexAttrib1fv': true,
    'vertexAttrib2fv': true,
    'vertexAttrib3fv': true,
    'vertexAttrib4fv': true
};
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
    'getContextAttributes',
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
    'getVertexAttribOffset',
    //
    'checkFramebufferStatus'
];

const ALL_ENUM = merge({}, INTERNAL_ENUM, OVERRAL_ENUM, TICKER_ENUM, GL2_ENUM);

/**
 * @class
 * 
 * GlContext类，包含 glProgram类
 * 根据glProgram类构建子程序
 * 
 */
class GLContext extends Dispose {
    /**
     * 
     * @param {String} canvasId 
     * @param {*} options 
     * @param {GLExtension} [options.glExtension] 
     * @param {GLLimits} [options.glLimits]
     */
    constructor(canvasId, options = {}) {
        super();
        /*
         * merge all options
         */
        this._options = merge({}, options);
        /**
         * canvasId,用此id获取gl对象
         * @type {String}
         */
        this._canvasId = canvasId;
        /**
         * map glContext to Context
         */
        this._map();
    };
    /**
     * map相关属性与方法
     */
    _map() {
        //1.map internalTinyOperation
        for (const key in ALL_ENUM) {
            this[key] = (...rest) => {
                //gl[key].apply(gl, rest);
                tiny.push(key, ...rest);
            }
        }
        //2.map glContext
        for (const key in GLConstants) {
            if (!this.hasOwnProperty(key)) {
                const target = GLConstants[key];
                if (!this[key] && !!target)
                    this[key] = target;
            }
        }
    }
    /**
     * @return {WebGLRenderingContext}
     */
    get gl() {
        return this._gl;
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
    get drawingBufferWidth() {
        const gl = this._gl;
        return gl.drawingBufferWidth;
    }
    /**
     * 获取drawingBuffer的height
     */
    get drawingBufferHeight() {
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
        GLPROGRAMS[glProgram.id] = glProgram;
        //3.返回句柄
        return glProgram.handle;
    }
    /**
     * create shader
     * @param {number} type
     * @return {GLShader}
     */
    createShader(type) {
        if (type !== GLConstants.VERTEX_SHADER && type !== GLConstants.FRAGMENT_SHADER)
            throw new Error('createShader parameter error');
        const glContextId = this.id,
            glCanvasId = this._canvasId,
            glExtension = Resource.getInstance(glCanvasId).glExtension;
        return new GLShader(type, glContextId, glExtension);
    }
    /**
     * @return {WebGLTexture}
     */
    createTexture() {
        const gl = this._gl;
        const glTexture = new GLTexture(gl);
        GLTEXTURES[glTexture.id] = glTexture;
        return glTexture.handle;
    }
    /**
     * @return {WebGLBuffer}
     */
    createBuffer() {
        const gl = this._gl;
        return gl.createBuffer();
    }
    /**
     * @type {WebGLFramebuffer}
     */
    createFramebuffer() {
        const gl = this._gl;
        return gl.createFramebuffer();
    }
    /**
     * @type {WebGLRenderbuffer}
     */
    createRenderbuffer() {
        const gl = this._gl;
        return gl.createRenderbuffer();
    }
    /**
     * 注意在处理tiny的时候，需先useProgram
     * @param {WebGLProgram} program
     */
    useProgram(program) {
        const id = stamp(program),
            tiny = this._tiny,
            glProgram = GLPROGRAMS[id];
        tiny.switchPorgarm(glProgram);
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
        const glProgram = GLPROGRAMS[stamp(program)];
        const glShader = GLSHADERS[stamp(shader)];
        glProgram.attachShader(glShader);
    }
    /**
     * 
     * @param {WebGLShader} shader 
     * @param {String} source 
     */
    shaderSource(shader, source) {
        const gl = this._gl;
        //1.如果不存在'precision mediump float;'则添加
        source = source.indexOf('precision') === -1 ? `precision mediump float;\n${source}` : source;
        //指定glsl版本
        //source = source.indexOf('#version') === -1?`#version 300 es\n${source}`:source;
        gl.shaderSource(shader, source);
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
    linkProgram(program) {
        const gl = this._gl;
        gl.linkProgram(program);
    }


    //webgl2 
    createTransformFeedback() {
        const gl = this._gl;
        gl.createTransformFeedback.apply(gl, arguments);
    }

    clear() {

    }

    clearColor() {

    }

    clearDepth() {

    }

    clearStencil() {

    }

}

module.exports = GLContext;