/**
 * a virtual doom element
 * -simulate HTMLCanvasElement action
 * -using GLContext instead of WebGLRenderingContext
 * @author yellow date 2017/8/23
 * @modify support webworker 
 */
const merge = require('./../utils/merge'),
    stamp = require('./../utils/stamp').stamp,
    setId = require('./../utils/stamp').setId,
    isString = require('./../utils/isString'),
    Dispose = require('./../utils/Dispose'),
    GLContext = require('./../gl/GLContext');
/**
 * 存储glContext对象，根据canvasId存储
 */
const CACHE_GLCONTEXT = {};

/**
 * 逻辑变更：2017/12/12
 * GLCanvas不对dom进行操作，所有操作移回到Player
 * GlCanvas不再接受和记录对dom的操作
 *
 * a virtual HTMLCanvasElement element
 * @class
 */
class GLCanvas extends Dispose {
    /**
     * 
     * @param {HTMLCanvasElement|String} element,default is htmlCanvasElement,or canvas's fusion_id 
     * @param {Object} [options]
     * @param {number} [options.width]
     * @param {number} [options.height]
     */
    constructor(element, options = { width: 800, height: 600 }) {
        super();
        /*
         * get canvas id as unique signal 
         */
        const canvasId = isString(element) ? element : stamp(element);
        /**
         * 合并全局设置
         * @type {Object}
         */
        this._options = merge({}, options);
        /**
         * 记录glCanvas与真实canvasId关联
         * @type {String}
         */
        this._canvasId = canvasId;
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
     * 
     * @param {String} renderType ,default is 'webgl',experiment-webgl
     * @param {Object} [options]
     * @param {boolean} [options.alpha]
     * @param {boolean} [options.depth]
     * @param {boolean} [options.stencil]
     * @param {boolean} [options.antialias]
     * @param {boolean} [options.premultipliedAlpha]
     * @param {boolean} [options.preserveDrawingBuffer]
     * @param {boolean} [options.failIfMajorPerformanceCaveat]
     */
    getContext(renderType = 'webgl', options = {}) {
        const canvasId = this._canvasId;
        CACHE_GLCONTEXT[canvasId] = CACHE_GLCONTEXT[canvasId] || new GLContext(canvasId, this._getContextAttributes(options));
        return CACHE_GLCONTEXT[canvasId];
    }
    /**
     * return HTMLCanvasElement.style 
     */
    get style() {
        const canvasId = this._canvasId;
        return document.getElementById(canvasId).style;
    }
    /**
     * 
     */
    get parentElement() {
        const canvasId = this._canvasId;
        return document.getElementById(canvasId).parentElement;
    }
    /**
     * @type {HTMLCanvasElement}
     */
    get HTMLCanvasElement() {
        const canvasId = this._canvasId;
        return document.getElementById(canvasId);
    }
    /**
     * 
     */
    getBoundingClientRect() {
        const canvasId = this._canvasId;
        return document.getElementById(canvasId).getBoundingClientRect();
    }
    /**
     * 
     * @param {*} type 
     * @param {*} Listener 
     * @param {*} useCapture 
     */
    addEventListener(type, Listener, useCapture) {
        const canvasId = this._canvasId;
        document.getElementById(canvasId).addEventListener(type, Listener, useCapture);
    }
    /**
     * 
     */
    set width(v) {
        const canvasId = this._canvasId;
        document.getElementById(canvasId).width = v;
    }
    /**
     * 
     */
    set height(v) {
        const canvasId = this._canvasId;
        document.getElementById(canvasId).height = v;
    }
    /**
     * 
     */
    get width() {
        const canvasId = this._canvasId;
        return document.getElementById(canvasId).width;
    }
    /**
     * 
     */
    get height() {
        const canvasId = this._canvasId;
        return document.getElementById(canvasId).height;
    }
    /**
     * 
     */
    get clientWidth() {
        const canvasId = this._canvasId;
        return document.getElementById(canvasId).clientWidth;
    }
    /**
     * 
     */
    get clientHeight() {
        const canvasId = this._canvasId;
        return document.getElementById(canvasId).clientHeight;
    }
    /**
     * 
     */
    get offsetLeft() {
        const canvasId = this._canvasId;
        return document.getElementById(canvasId).offsetLeft;
    }
    /**
     * 
     */
    get offsetTop() {
        const canvasId = this._canvasId;
        return document.getElementById(canvasId).offsetTop;
    }
}

module.exports = GLCanvas;