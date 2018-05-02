/**
 * 虚拟htmlCanvas对象，用于记录webgl在htmlCanvas时的过程
 * @author yellow date 2018/1/1
 */
const Dispose = require('./../utils/Dispose'),
    mergre = require('./../utils/merge'),
    Record = require('./../core/Record'),
    Recorder = require('./../core/Recorder'),
    Actuator = require('./../core/Actuator'),
    GLConstants = require('./GLConstants'),
    GLContext = require('./GLContext');
/**
 * get kiwi unique id
 */
const stamp = require('./../utils/stamp');
/**
 * store glContext cache
 */
const CACHE_GLCONTEXT = {};
/**
 * store WebGLRenderingContext
 */
const CACHE_GL = {};
/**
 * the prefix of GLCanvas
 */
const prefix = 'CANVASELEMENT';
/**
 * @class
 * @example
 * const gl = doucment.getElementById('mapCanvas').getContext('webgl');
 * const glCavnas = new GLCanvas(gl);
 */
class GLCanvas extends Dispose {
    /**
     * 
     * @param {WebGLRenderingContext} gl
     * @param {Object} [options] depreciated at this version
     */
    constructor(gl, options = {}) {
        /**
         * super call
         */
        super(prefix);
        /**
         * @type {Object}
         */
        this._options = mergre({}, options);
        /**
         * @type {WebGLRenderingContext}
         */
        this._gl = gl;
        /**
         * @type {String} 'webgl1' or 'webgl2'
         */
        this._glType = null;
        /**
         * real html canvas element
         * https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement
         * @type {HtmlCanvasElement}
         */
        this._canvas = gl.canvas;
        /**
         * @type {GLContext}
         */
        this._glContext = null;
        /**
         * @type {Object}
         */
        this._style = {};
        /**
         * store canvas operations
         * @type {Recorder}
         */
        this._records = new Recorder(null, false);
        /*
         * initial glcanvas by WebGLRenderingContext
         */
        this._initialize(gl);
    }
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     */
    _initialize(gl) {
        //get webgl version
        const glVersion = gl.getParameter(GLConstants.VERSION);
        if (glVersion.indexOf('WebGL 1.0') !== -1) {
            this._glType = 'webgl1';
        } else if (glVersion.indexOf('WebGL 2.0') !== -1) {
            this._glType = 'webgl2';
        } else {
            this._glType = 'webgl1';
        }
        //initial Actuator
        gl.actuator = gl.actuator || new Actuator(gl);
    }
    /**
     * get context attributes
     * include webgl2 attributes
     * reference https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
     * @param {Object} [options] 
     */
    _getContextAttributes(options = {}) {
        return {
            alpha: options.alpha || false,
            depth: options.depth || true,
            stencil: options.stencil || true,
            antialias: options.antialias || false,
            premultipliedAlpha: options.premultipliedAlpha || true,
            preserveDrawingBuffer: options.preserveDrawingBuffer || false,
            failIfMajorPerformanceCaveat: options.failIfMajorPerformanceCaveat || false,
        }
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style
     * https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration
     * @type {CSSStyleDeclaration}
     */
    get style() {
        const canvas = this._canvas;
        if (canvas)
            return canvas.style;
        else
            return this._style;
    }
    /**
     * 
     */
    get width() {
        const canvas = this._canvas;
        if (canvas)
            return canvas.width;
        else
            return 0;
    }
    /**
     * 
     */
    set width(v) {
        const canvas = this._canvas;
        if (canvas) canvas.width = v;
    }
    /**
     * 
     */
    get clientWidth(){
        const canvas = this._canvas;
        if (canvas)
            return canvas.clientWidth;
        else
            return 0;
    }
    /**
     * 
     */
    set clientWidth(v) {
        const canvas = this._canvas;
        if (canvas) canvas.clientWidth = v;
    }
    /**
     * 
     */
    get clientHeight(){
        const canvas = this._canvas;
        if (canvas)
            return canvas.clientHeight;
        else
            return 0;
    }
    /**
     * 
     */
    set clientHeight(v) {
        const canvas = this._canvas;
        if (canvas) canvas.clientHeight = v;
    }
    /**
     * 
     */
    get height() {
        const canvas = this._canvas;
        if (canvas)
            return canvas.height;
        else
            return 0;
    }
    /**
     * 
     */
    set height(v) {
        const canvas = this._canvas;
        if (canvas) canvas.height = v;
    }
    /**
     * get GLContext
     */
    getContext() {
        const gl = this._gl,
            glType = this._glType,
            contextOptions = this._getContextAttributes();
        this._glContext = this._glContext || new GLContext(gl, glType, contextOptions);
        return this._glContext;
    }
    /**
     * https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener
     * @param {String} type 
     * @param {Function} listener 
     * @param {Object} options 
     */
    addEventListener(type, listener, options) {
        const canvas = this._canvas;
        if (canvas) {
            canvas.addEventListener(type, listener, options);
        } else {
            const record = new Record('addEventListener', type, listener, options);
            this._records.increase(record);
        }
    }
    /**
     * 
     * @param {*} type 
     * @param {*} listener 
     * @param {*} options 
     */
    removeEventListener(type, listener, options) {
        const canvas = this._canvas;
        if (canvas) {
            canvas.removeEventListener(type, listener, options);
        } else {
            const record = new Record('removeEventListener', type, listener, options);
            this._records.increase(record);
        }
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeName
     */
    get nodeName() {
        return 'CANVAS';
    }
    /**
     * https://developer.mozilla.org/zh-CN/docs/Web/API/Element/getBoundingClientRect
     */
    getBoundingClientRect() {
        const canvas = this._canvas;
        if (canvas) {
            return canvas.getBoundingClientRect();
        } else
            return [0, 0, 0, 0]
    }
}

module.exports = GLCanvas;