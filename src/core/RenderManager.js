import merge from './../utils/merge';
import { stamp } from './../utils/stamp';
/**
 * @class RenderManager
 */
export default class RenderManager {
    //render collection
    _renderers = {};

    _options;

    /**
     * 
     * @param {Renderer} renderer 
     */
    constructor(options) {
        this._options = merge({}, options);
    }
    /**
     * add renderer to manager
     * @param {Renderer} renderer 
     */
    add(renderer) {
        let id = stamp(renderer);
        this._renderers[id] = renderer;
        return this;
    }
    /**
     * remove renderer 
     * @param {Renderer} renderer 
     */
    remove(renderer) {
        let id = stamp(renderer);
        if (!!this._renderers[id])
            delete this._renderers[id];
        return this;
    }


}