

class GLVertexArray{

    _gl;

    /**
     * 
     * @param {WebGLRenderingContext} gl 
     */
    constructor(gl){
        this._gl=gl;
        this._buffer = gl.createBuffer();
    }


}