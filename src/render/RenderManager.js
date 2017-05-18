/**
 * 
 */
export default class RenderManager{

    _renderer;

    constructor(renderer){
        this._renderer=renderer;
        this._renderer.on()
    }
}