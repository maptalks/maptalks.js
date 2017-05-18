/**
 * 
 */
export default class RenderManager{

    _renderer;

    /**
     * 
     * @param {Renderer} renderer 
     */
    constructor(renderer){
        this._renderer=renderer;
        this._renderer.on()
    }
}