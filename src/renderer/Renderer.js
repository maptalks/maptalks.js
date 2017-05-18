import Event from './../utils/Event';

/**
 * 
 */
class Renderder extends Event{

    //support webglRenderer and canvasRenderer
    _renderType=''; 
    //the drawing backgroud
    _backgroundColor=0x000000;
    //rbg represent
    _backgroundColorRgba=[0,0,0,0];
    //rbg string represent
    _backgroundColorString ='#000000';
    //the resolution, represent=x/y;
    _resolution;
    /**
     * 
     * @param {HTMLCanvasElement} view ,the canvas to draw
     */
    constructor(view,options){

    }

    get backgroundColor(){
        return this._backgroundColor;
    }

    get resolution(){
        return this._resolution;
    }

}

