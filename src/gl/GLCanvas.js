/**
 * a virtual doom element
 * -simulate HTMLCanvasElement action
 * -using GLContext instead of WebGLRenderingContext
 * @author yellow date 2017/8/23
 * @modify support webworker 
 */
const GLContext = require('./GLContext'),
    merge = require('./../utils/merge'),
    stamp = require('./../utils/stamp').stamp,
    setId = require('./../utils/stamp').setId,
    isString = require('./../utils/isString'),
    GLExtension = require('./GLExtension'),
    GLLimits = require('./GLLimits'),
    Dispose = require('./../utils/Dispose'),
    CANVASES = require('./../utils/util').CANVASES,
    GLCONTEXTS = require('./../utils/util').GLCONTEXTS,
    WEBGLCONTEXTS = require('./../utils/util').WEBGLCONTEXTS,
    GLEXTENSIONS = require('./../utils/util').GLEXTENSIONS,
    GLLIMITS = require('./../utils/util').GLLIMITS;
/**
 * a virtual HTMLCanvasElement element
 * @class
 */
class GLCanvas extends Dispose {
    /**
     * 
     * @param {HTMLCanvasElement|String} canvas,default is htmlCanvasElement,or canvas's fusion_id 
     * @param {Object} [options]
     * @param {number} [options.width]
     * @param {number} [options.height]
     */
    constructor(canvas,options ={}) {
        super();
        /**
         *  
         */

        this._rootId = stamp(canvas);
        canvas.width = options.width || canvas.clientWidth;
        canvas.height = options.height || canvas.clientHeight;
        CANVASES[this._rootId] = canvas;
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
        const id = this._id,
            rootId = this._rootId;
        if (!GLCONTEXTS[id]) {
            const attrib = this._getContextAttributes(options);
            const canvas = CANVASES[rootId];
            if (!WEBGLCONTEXTS[rootId])
                WEBGLCONTEXTS[rootId] = canvas.getContext(renderType, attrib) || canvas.getContext(`experimental-${renderType}`, attrib);
            const gl = WEBGLCONTEXTS[rootId];
            if (!GLLIMITS[rootId])
                GLLIMITS[rootId] = new GLLimits(gl);
            if (!GLEXTENSIONS[rootId])
                GLEXTENSIONS[rootId] = new GLExtension(gl);
            const glLimits = GLLIMITS[rootId],
                glExtension = GLEXTENSIONS[rootId];
            GLCONTEXTS[id] = new GLContext({ renderType: renderType, canvas: canvas, gl: gl, glLimits: glLimits, glExtension: glExtension });
        }
        return GLCONTEXTS[id];
    }
    /**
     * return HTMLCanvasElement.style 
     */
    get style() {
        const id = this._rootId;
        return CANVASES[id].style;
    }
    /**
     * 
     */
    get parentElement(){
        const id = this._rootId;
        return CANVASES[id].parentElement
    }
    /**
     * @type {HTMLCanvasElement}
     */
    get HTMLCanvasElement(){
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
    set width(v){
        const id = this._rootId;
        CANVASES[id].width = v;
    }
    /**
     * 
     */
    set height(v){
        const id = this._rootId;
        CANVASES[id].height = v;
    }
    /**
     * 
     */
    get width(){
        const id = this._rootId;
        return CANVASES[id].width;
    }
    /**
     * 
     */
    get height(){
        const id = this._rootId;
        return CANVASES[id].height;
    }
    /**
     * 
     */
    get clientWidth(){
        const id = this._rootId;
        return CANVASES[id].clientWidth;
    }
    /**
     * 
     */
    get clientHeight(){
        const id = this._rootId;
        return CANVASES[id].clientHeight;
    }
    /**
     * 
     */
    get offsetLeft(){
        const id = this._rootId;
        return CANVASES[id].offsetLeft;
    }
    /**
     * 
     */
    get offsetTop(){
        const id = this._rootId;
        return CANVASES[id].offsetTop;
    }
}

module.exports = GLCanvas;