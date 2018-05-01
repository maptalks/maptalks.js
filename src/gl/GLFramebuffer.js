const Dispose = require('./../utils/Dispose');

const prefix = 'FRAMEBUFFER';

/**
 * @class
 */
class GLFramebuffer extends Dispose{
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


module.exports = GLFramebuffer;