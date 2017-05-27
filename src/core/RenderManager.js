import merge from './../utils/merge';
import { stamp } from './../utils/stamp';
import WebGLRenderer from './../renderer/WebGLRenderer';
import Event from './../utils/Event';
import { _KIWI_EVENT_RESIZE } from './EventNames';

/**
 * contain two dimensional
 * -renderer,the paint renderer method
 * -
 * @class RenderManager
 */
export default class RenderManager extends Event {
    /**
     * render instance
     * @memberof RenderManager
     * @member {Renderer}
     */
    _renderer;
    /**
     * html canvas
     * @memberof RenderManager
     * @member {htmlcanvas}
     */
    _view;
    /**
     * @memberof RenderManager
     */
    _width;
    /**
     * 
     * @memberof RenderManager
     */
    _height;
    /**
     * 
     * @param {Object} [options] 
     * @param {String} [options.renderType] default is 'webgl'
     * @param {number} [options.width] 
     * @param {number} [options.height]
     */
    constructor(options) {
        this._view = options.view || document.createElement('canvas');
        this._view.width = this._width = options.width;
        this._view.height = this._height = options.height;
        this._renderer = options.renderType === 'webgl' ? new WebGLRenderer(this._view, this._options) : null;
        this.addEventPopNode(this._renderer);
        this.on(_KIWI_EVENT_RESIZE, this._onResize);
    }

    _onResize(eventData) {
        this._width = eventData.width || this._width;
        this._height = eventData.height || this.height;
    }

}