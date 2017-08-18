/**
 *  
 */
const GLContext = require('./GLContext'),
    merge = require('./../utils/merge'),
    stamp = require('./../utils/stamp').stamp,
    setId = require('./../utils/stamp').setId,
    raf = require('./../utils/raf').requestAnimationFrame,
    GLExtension = require('./GLExtension'),
    GLLimits = require('./GLLimits'),
    Dispose = require('./../utils/Dispose'),
    CANVAS = require('./../utils/util').CANVAS,
    GLCONTEXT = require('./../utils/util').GLCONTEXT,
    WEBGLCONTEXT = require('./../utils/util').WEBGLCONTEXT,
    GLEXTENSION = require('./../utils/util').GLEXTENSION,
    GLLIMITS = require('./../utils/util').GLLIMITS;
/**
 * @class
 */
class GLCanvas extends Dispose {
    /**
     * 
     * @param {HTMLCanvasElement} canvas 
     */
    constructor(canvas) {
        super();
        this._rootId = stamp(canvas);
        CANVAS[this._rootId] = canvas;
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
     * return HTMLCanvasElement.style 
     */
    get style() {
        const id = this._rootId;
        return CANVAS[id].style;
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
        if (!GLCONTEXT[id]) {
            const attrib = this._getContextAttributes(options);
            const canvas = CANVAS[rootId];
            if (!WEBGLCONTEXT[rootId])
                WEBGLCONTEXT[rootId] = canvas.getContext(renderType, attrib) || canvas.getContext(`experimental-${renderType}`, attrib);
            const gl = WEBGLCONTEXT[rootId];
            if (!GLLIMITS[rootId])
                GLLIMITS[rootId] = new GLLimits(gl);
            if (!GLEXTENSION[rootId])
                GLEXTENSION[rootId] = new GLExtension(gl);
            const glLimits = GLLIMITS[rootId],
                glExtension = GLEXTENSION[rootId];
            GLCONTEXT[id] = new GLContext({ renderType: renderType, canvas: canvas, gl: gl, glLimits: glLimits, glExtension: glExtension });
        }
        return GLCONTEXT[id];
    }

    getBoundingClientRect() {
        const id = this._rootId;
        CANVAS[id].getBoundingClientRect();
    }

    addEventListener(type, Listener, useCapture) {
        const id = this._rootId;
        CANVAS[id].addEventListener(type, Listener, useCapture);
    }

}

module.exports = GLCanvas;