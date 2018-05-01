const Dispose = require('./../utils/Dispose');

const prefix = 'RENDERBUFFER';

/**
 * @class
 */
class GLRenderbuffer extends Dispose{
    /**
     * 
     * @param {GLContext} glContext 
     */
    constructor(glContext){
        super(prefix);
        /**
         * @type {GLContext}
         */
        this._glContext = glContext;
    }

}


module.exports = GLRenderbuffer;