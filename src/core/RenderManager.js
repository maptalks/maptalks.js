import merge from './../utils/merge';

/**
 * 
 */
export default class RenderManager{

    _renderer;

    _options;

    /**
     * 
     * @param {Renderer} renderer 
     */
    constructor(renderer,options){
        this._renderer=renderer;
        this._options=merge({},options);
    }
    
}