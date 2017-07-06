/**
 * @author yellow 2017/5/15
 */

import Event from './../utils/Event';
import merge from './../utils/merge';
import RenderManager from './RenderManager';
import { _KIWI_EVENT_RESIZE } from './EventNames';

const defaultOptions = {
    width: window.innerHeight,
    height: window.innerHeight,
    renderType: 'webgl',
    roundPixels: false
};

/**
 * container 
 * used to transform accordance
 * @class Container
 */
class Container extends Event {

    /**
     * readerManager
     * @memberof Container
     * @readOnly
     */
    _renderManager;
    /**
     * container's width
     * @memberof Container
     * @member {number}
     */
    _width;
    /**
     * container's height
     * @memberof Container
     * @member {number}
     */
    _height;
    /**
     * 
     * @param {Object} [options] the settings of container 
     * @param {number} [options.width] the html canvas width
     * @param {number} [options.height] the html canvas height
     * @param {String} [options.renderType='webgl'] the renderType,support 'webgl' only currently
     * @param {HTMLCanvasElement} [options.view] the html canvas to use as a view,usually created by container self.
     * @param {boolean} [options.roundPixels] use Math.floor(x/y) values when rendering if true
     */
    constructor(options) {
        super();
        options = options || {};
        let _options = merge(defaultOptions, options);
        this._width = _options.width;
        this._height = _options.height;
        this._renderManager = new RenderManager(_options);
        this.addEventPopNode(this._renderManager);
    }
    /**
     * set container's height
     */
    set width(value) {
        this._width = value;
        this.fire(_KIWI_EVENT_RESIZE, { width: value }, true);
    }
    /**
     * set container's width
     */
    set height(value) {
        this._height = value;
        this.fire(_KIWI_EVENT_RESIZE, { height: value }, true);
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    get camera() {

    }

    /**
     * 
     * @param {Object} rNode, 
     */
    add() {

    }

}

export default Container;