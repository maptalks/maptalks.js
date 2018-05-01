
const Dispose = require('./../utils/Dispose');

const prefix = 'BUFFER';

/**
 * @class
 */
class GLBuffer extends Dispose{
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

module.exports = GLBuffer;