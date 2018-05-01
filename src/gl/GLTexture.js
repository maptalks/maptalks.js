/**
 * birgde to attach texture
 */
const Dispose = require('./../utils/Dispose'),
    GLConstants = require('./GLConstants');
/**
 * the prefix of Texture type
 */
const prefix = 'TEXTURE';

class GLTexture extends Dispose{
    /**
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

module.exports = GLTexture;