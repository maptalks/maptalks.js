
import { matrix } from 'kiwi.matrix';
import Event from './../utils/Event';
import merge from './../utils/merge';
import { _KIWI_EVENT_RESIZE } from './../core/EventNames';


/**
 * abstract base renderer class
 * @author yellow 2017/5/24
 * @class Renderer
 */
class Renderder extends Event {
    /**
     * 
     * @memberof Renderder
     */
    _roundPixels=false;
    /**
     * support webglRenderer and canvasRenderer
     * @memberof Renderder
     */
    _renderType = '';
    /**
     * the drawing backgroud
     * @memberof Renderder
     */
    _backgroundColor = 0x000000;
    /**
     * rbg represent
     * @memberof Renderder
     */
    _backgroundColorRgba = [0, 0, 0, 0];
    /**
     * rbg string represent
     * @memberof Renderder
     */
    _backgroundColorString = '#000000';
    /**
     * the resolution, represent=x/y;
     * @memberof Renderder
     */
    _resolution;
    /**
     * 
     * @memberof Renderder
     */
    _transparent;
    /**
     * the canvas width
     * @memberof Renderder
     */
    _width;
    /**
     * the canvas height
     * @memberof Renderder
     */
    _height;
    /**
     * html canvas
     * @memberof Renderder
     */
    _view;
    /**
     * draw bufferData
     * @memberof Renderder
     * @member {float32array}
     */
    _bufferData;
    /**
     * 
     * @param {HTMLCanvasElement} view ,the canvas to draw
     * @param {Object} [options] 
     */
    constructor(view, options) {
        super();
        this._options = merge(this._options, options || {});
        this._view = view;
        this._width = this._options.width;
        this._height = this._options.height;
        this._resolution = this._options.roundPixels ? Math.floor(this._width / this._height) : this._width / this._height;
        //cause of unknown length,_bufferData don't need to be created
        //this._bufferData= new matrix.mat.ARRAY_TYPE(10);
        this.on(_KIWI_EVENT_RESIZE, this._onResize);
    }
    /**
     * 
     * @param {number} width of html canvas 
     * @param {number} height of html canvas
     */
    _onResize(eventData) {
        let [w,h]=[eventData.width || this._options.width,eventData.height || this._options.height];
        this._options.width = this._view.width = w;
        this._options.height = this._view.height = h;
<<<<<<< HEAD
        this._resolution = this._options.roundPixels ? Math.floor(this._width / this._height) : w / h;
=======
        this._resolution = this._options.roundPixels ? Math.floor(w/h) : w/h;
>>>>>>> d81f9c1b4173232b9c938fda1fce1fd91d2a2a77
    }

    get backgroundColor() {
        return this._backgroundColor;
    }

    get resolution() {
        return this._resolution;
    }

    get bufferData() {
        return this._bufferData;
    }

    set bufferData(value) {
        this._bufferData = value;
    }
}

export default Renderder;
