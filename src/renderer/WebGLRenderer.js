import Renderer from './Renderer';

class WebGLRenderer extends Renderer{

    //webgl context
    _context;
    
    constructor(view,options){
        super(view,options);
    }
}

export default WebGLRenderer;