/**
 * @author yellow date 2018/2/27
 */
const Dispose = require('./../utils/Dispose'),
    prefix = 'VERTEXARRAYOBJRCT ';
/** 
 * webgl2 vertex_array_object
 * @class
*/
class GLVertexArray extends Dispose {
    /**
     * 
     * @param {GLContext} glContext 
     */
    constructor(glContext) {
        super(prefix);
        this._glContext = glContext;
    }
}

module.exports = GLVertexArray;