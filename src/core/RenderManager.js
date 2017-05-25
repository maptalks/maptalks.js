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
    //render collection
    _renderers = {};
    //the default options for RenderManager
    _options = {};

    _view;
    /**
     * 
     * @param {Renderer} renderer 
     */
    constructor(options) {
        merge(this._options, options);
        this._view = this._options.view || document.createElement('canvas');
        this._renderers = this._options.renderType === 'webgl' ? new WebGLRenderer(this._view, this._options) : null;
    }




}