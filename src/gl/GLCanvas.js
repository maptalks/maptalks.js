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
    Dispose = require('./../utils/Dispose');

const Resource = require('./../core/Resource');
const GLContext = require('./../gl/GLContext');


const GLCanvasOptions = {
    width: 800,
    height: 600
}

/**
 * 逻辑变更：2017/12/12
 * GLCanvas不对dom进行操作，所有操作移回到Player
 * GlCanvas接受对dom操作的记录
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
    constructor(element, options = {}) {
        super();

        const canvasId = isString(element) ? element : stamp(element);
        /**
         * style填充
         * @type object
         */
        this._style = {};
        /**
         * 合并全局设置
         * @type {Object}
         */
        this._options = merge({}, GLCanvasOptions, options);
        /**
         * 记录glCanvas与真实canvasId关联
         * @type {String}
         */
        this._canvasId = canvasId;
        /**
         * 创建resource包
         * @type {Resource}
         */
        this._resource = Resource.getInstance(canvasId);
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
        return this._resource.glContext;
    }
    /**
     * return HTMLCanvasElement.style 
     */
    get style() {
        return this._style;
    }
    /**
     * 
     */
    get parentElement() {
        const id = this._rootId;
        return CANVASES[id].parentElement
    }
    /**
     * @type {HTMLCanvasElement}
     */
    get HTMLCanvasElement() {
        const id = this._rootId;
        return CANVASES[id]
    }
    /**
     * 
     */
    getBoundingClientRect() {
        const id = this._rootId;
        CANVASES[id].getBoundingClientRect();
    }
    /**
     * 
     * @param {*} type 
     * @param {*} Listener 
     * @param {*} useCapture 
     */
    addEventListener(type, Listener, useCapture) {
        const id = this._rootId;
        CANVASES[id].addEventListener(type, Listener, useCapture);
    }
    /**
     * 
     */
    set width(v) {
        const id = this._rootId;
        CANVASES[id].width = v;
    }
    /**
     * 
     */
    set height(v) {
        const id = this._rootId;
        CANVASES[id].height = v;
    }
    /**
     * 
     */
    get width() {
        const id = this._rootId;
        return CANVASES[id].width;
    }
    /**
     * 
     */
    get height() {
        const id = this._rootId;
        return CANVASES[id].height;
    }
    /**
     * 
     */
    get clientWidth() {
        const id = this._rootId;
        return CANVASES[id].clientWidth;
    }
    /**
     * 
     */
    get clientHeight() {
        const id = this._rootId;
        return CANVASES[id].clientHeight;
    }
    /**
     * 
     */
    get offsetLeft() {
        const id = this._rootId;
        return CANVASES[id].offsetLeft;
    }
    /**
     * 
     */
    get offsetTop() {
        const id = this._rootId;
        return CANVASES[id].offsetTop;
    }
}

module.exports = GLCanvas;