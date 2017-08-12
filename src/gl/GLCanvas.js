/**
 *
 */
const GLContext = require('./GLContext'),
    merge = require('./../utils/merge');

class GLCanvas {

    /**
     * 
     * @param {HTMLCanvasElement} canvas 
     */
    constructor(canvas) {
        /**
         * @type {HTMLCanvasElement}
         */
        this._canvas = canvas;
    }

    getContext(renderType, options) {
        this._gl = this._gl || new GLContext(merge({}, { renderType: renderType, gl: this._gl, canvas: this._canvas }, options || {}))
        return this._gl;
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

module.exports = GLCanvas;