
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
    //settings
    _options = {};
    //support webglRenderer and canvasRenderer
    _renderType = '';
    //the drawing backgroud
    _backgroundColor = 0x000000;
    //rbg represent
    _backgroundColorRgba = [0, 0, 0, 0];
    //rbg string represent
    _backgroundColorString = '#000000';
    //the resolution, represent=x/y;
    _resolution;
    //the canvas height
    _width;
    //the canvas width
    _height;
    //the canvas
    _view;
    //float32array,bufferData
    _bufferData;
    /**
     * 
     * @param {HTMLCanvasElement} view ,the canvas to draw
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
        let w = eventData.width || this._options.width,
            h = eventData.height || this._options.height;
        this._options.width = this._view.width = w;
        this._options.height = this._view.height = h;
        this._resolution = this._options.roundPixels ? Math.floor(this._width / this._height) : w / h;
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
