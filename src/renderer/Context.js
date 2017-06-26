/**
 * warpped the WebGLRenderingContext
 * 管理
 * -cache
 * -program
 * -matrix
 * -extension
 * -limits
 * 
 * 
 * @author yellow 2017/6/11
 */
import merge from './../utils/merge';
import GLExtension from './gl/GLExtension';
import GLLimits from './gl/GLLimits';
import GLProgram from './gl/GLProgram';

/**
 * @class Context
 * @example
 *   let cvs = document.createElement('canvas'),
 *       ctx = new Context(cvs);
 */
class Context {
    /**
     * program cache
     */
    _programCache = {};
    /**
     * the useing program
     */
    _currentProgram;
    /**
     * the html canvas
     */
    _canvas;
    /**
     * canvas width
     */
    _width;
    /**
     * canvas height
     */
    _height;

    _renderType;

    _isWebgl2;

    /**
     * gl.attributes
     * 
     */
    _alpha;
    /**
      * gl.attributes
      * 
      */
    _stencil;
    /**
    * gl.attributes
    * 
    */
    _depth;
    /**
        * gl.attributes
        * 
        */
    _antialias;
    /**
        * gl.attributes
        * 
        */
    _premultipliedAlpha;
    /**
        * gl.attributes
        * 
        */
    _preserveDrawingBuffer;

    /**
     * extension attrib
     */
    _validateFramebuffer;

    _validateShaderProgram;

    _logShaderCompilation;

    _gl;
    /**
     * @attribute {GLExtension}
     */
    _glExtension;
    /**
     * @attribute {GLLimits}
     */
    _glLimits;
    /**
     * @param {htmlCanvas} canvas
     * @param {Object} [options]
     * @param {number} [options.width]
     * @param {number} [options.height]
     * @param {String} [options.renderType] 'webgl'、'webgl2'
     * @param {boolean} [options.alpha] default is false,but gl default is true
     * @param {boolean} [options.stencil] default is true,but gl default is false.the stencilBuffer to draw color and depth
     * @param {boolean} [options.depth] enable gl depth
     * @param {boolean} [options.antialias] enable antialias,default is false
     * @param {boolean} [options.premultipliedAlpha] enable premultipliedAlpha,default is true , webgl2
     * @param {boolean} [options.preserveDrawingBuffer] enable preserveDrawingBuffer,default is false , webgl2
     */
    constructor(canvas, options) {
        options = options || {};
        this._canvas = canvas;
        this._width = options.width || canvas.width;
        this._height = options.height || canvas.height;
        this._renderType = options.renderType || 'webgl2';
        this._isWebgl2 = this._renderType === 'webgl2' ? true : false;
        this._alpha = options.alpha || false;
        this._stencil = options.stencil || true;
        this._depth = options.depth || true;
        this._antialias = options.antialias || false;
        this._premultipliedAlpha = options.premultipliedAlpha || true;
        this._preserveDrawingBuffer = options.preserveDrawingBuffer || false;
        this._allowTextureFilterAnisotropic = options.allowTextureFilterAnisotropic || true;
        //validation and logging disabled by default for speed.
        this._validateFramebuffer = false;
        this._validateShaderProgram = false;
        this._logShaderCompilation = false;
        //get glContext
        this._gl = canvas.getContext(this._renderType, this.getContextAttributes()) || canvas.getContext('experimental-' + this._renderType, this.getContextAttributes()) || undefined;
        //get extension
        this.includeExtension(this._gl);
        //get parameter and extensions
        this.includeParameter(this._gl);
    };
    /**
     * get context attributes
     * include webgl2 attributes
     */
    getContextAttributes() {
        return {
            alpha: this._alpha,
            stencil: this._stencil,
            depth: this._depth,
            antialias: this._antialias,
            premultipliedAlpha: this._premultipliedAlpha,
            preserveDrawingBuffer: this._preserveDrawingBuffer
        }
    };
    /**
     * Query and initialize extensions
     * @param {glContext} gl 
     */
    includeExtension(gl) {
        this._glExtension = new GLExtension(gl);
    };
    /**
     * hardware
     * @param {glContext} gl 
     */
    includeParameter(gl) {
        this._glLimits = new GLLimits(gl);
    };

    clearColor(){

    };

    clearSencil(){

    };

    clearDepth(){

    };

    _getProgram(programName,programConfiguration){
        let cache = this._programCache;
        const key = `${programName}`;
        if(!!cache[key])
            return cache[key];
        else{
            //create program
        }
    };

    useProgram(programName,programConfiguration){

    };


}


export default Context;