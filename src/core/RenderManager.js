import merge from './../utils/merge';
import { stamp } from './../utils/stamp';
import WebGLRenderer from './../renderer/WebGLRenderer';

/**
 * contain two dimensional
 * -renderer,the paint renderer method
 * -
 * @class RenderManager
 */
export default class RenderManager {
    //render instance
    _renderer;
    //the default options for RenderManager
    _options = {};
    //html canvas
    _view;
    /**
     * 
     * @param {Object} [options] 
     * @param {String} [options.renderType] default is 'webgl'
     * @param {number} [options.width] 
     * @param {number} [options.height]
     */
    constructor(options) {
        this._options=merge(this._options, options||{});
        // get/create canvas and resize it
        this._view = this._options.view || document.createElement('canvas');
        this._view.width = this._options.width;
        this._view.height = this._options.height;
        this._renderer = this._options.renderType === 'webgl' ? new WebGLRenderer(this._view, this._options) : null;
    }

    get renderer(){
        return this._renderer;
    }

}