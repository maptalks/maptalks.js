/**
 *
 */
const GLContext = require('./GLContext'),
    merge = require('./../utils/merge'),
    stamp = require('./../utils/stamp').stamp,
    setId = require('./../utils/stamp').setId,
    raf = require('./../utils/raf').requestAnimationFrame,
    Dispose = require('./../utils/Dispose');
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
        setId(canvas, this._id);
        GLCanvas.CANVAS[this._id] = canvas;
    }

    _getContextAttributes(options) {
        options = options || {};
        return ctxAtt = {
            alpha: options.alpha || false,
            depth: options.depth || true,
            stencil: options.stencil || true,
            antialias: options.antialias || false,
            premultipliedAlpha: options.premultipliedAlpha || true,
            preserveDrawingBuffer: options.preserveDrawingBuffer || false,
            failIfMajorPerformanceCaveat: options.failIfMajorPerformanceCaveat || false,
        }
    }

    getContext(renderType, options) {
        const id = this._id;
        if(!GLCanvas.GLCONTEXT[id]){
            const canvas = GLCanvas.CANVAS[id];
            !canvas.gl ? canvas.gl = canvas.getContext(renderType, this._getContextAttributes(options)) : null;
            GLCanvas.GLCONTEXT[id] = new GLContext({ renderType: renderType, canvas: canvas, gl: canvas.gl });
        }
        return GLCanvas.GLCONTEXT[id];
    }

    getBoundingClientRect() {
        const canvas = this._canvas;
        return canvas.getBoundingClientRect();
    }

    addEventListener(type, Listener, useCapture) {
        const canvas = this._canvas;
        canvas.addEventListener(type, Listener, useCapture);
    }

    get style() {
        const canvas = this._canvas;
        return canvas.style;
    }

}
/**
 * singleton
 * store the canvas
 */
GLCanvas.CANVAS = {};
/**
 * singleton
 * store glContext
 */
GLCanvas.GLCONTEXT = {};


module.exports = GLCanvas;