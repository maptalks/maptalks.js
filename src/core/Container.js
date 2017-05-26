import Event from './../utils/Event';
import merge from './../utils/merge';
import RenderManager from './RenderManager';
import { _KIWI_EVENT_RESIZE } from './EventNames';
/**
 * container 
 * used to transform accordance
 * @class Container
 */
class Container extends Event {

    //the renderer
    _renderManager;
    //the default options
    _options = {
        width: window.innerWidth,
        height: window.innerHeight,
        renderType: 'webgl',
        view: null
    }
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
        //merge options
        this._options = merge(this._options, options || {});
        this._renderManager = new RenderManager(this._options);
        this.addEventPopNode(this._renderManager.renderer);

    }
    /**
     * set container's height
     */
    set width(value) {
        this._options.width = value;
        this.fire(_KIWI_EVENT_RESIZE, { width: value }, true);
    }
    /**
     * set container's width
     */
    set height(value) {
        this._options.height = value;
        this.fire(_KIWI_EVENT_RESIZE, { height: value }, true);
    }

    get width() {
        return this._options.width;
    }

    get height() {
        return this._options.height;
    }

    /**
     * 
     * @param {Object} rNode, 
     */
    add() {

    }
}

export default Container;