/**
 * warpped the WebGLRenderingContext
 * 管理
 * -cache
 * -program
 * -matrix
 * -extension
 * -limits
 * 
 * 特点：
 * reference https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmapRenderingContext/transferFromImageBitmap
 * 使用 OffscreenCanvas 创建不可见绘制canvas,后基于此canvas绘制图像，并保存成bitmap缓存帧
 * var htmlCanvas = document.getElementById("htmlCanvas").getContext("bitmaprenderer");
 * //
 * var offscreen = new OffscreenCanvas(256, 256);
 * var gl = offscreen.getContext("webgl");
 * var bitmap = offscreen.transferToImageBitmap();
 * //
 * 预留一定的帧数后，使用bitmaprender绘制bitmap到前端canvas即可
 * htmlCanvas.transferFromImageBitmap(bitmap);
 * 
 * context相当于webglRender
 * 
 * @author yellow 2017/6/11
 */
import merge from './../utils/merge';
import GLConstants from './gl/GLConstants';
import GLExtension from './gl/GLExtension';
import GLLimits from './gl/GLLimits';
import GLProgram from './gl/GLProgram';
import { ShaderFactory, shadersName } from './shader/ShaderLib';

/**
 * @class
 * @example
 *   let cvs = document.createElement('canvas'),
 *       ctx = new Context(cvs);
 */
class Context {
    /**
     * shaderCache
     */
    _shaderCache = {};
    /**
     * @type {Object}
     */
    _programCache = {};
    /**
     * @type {GLProgram}
     */
    _currentProgram;
    /**
     * the buffer canvas,
     * @type {OffscreenCanvas}
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
    /**
     * context类型，支持webgl,webgl2
     * @type {String}
     */
    _renderType;
    /**
     * @type {number}
     */
    _alpha;
    /**
     * 是否启用缓冲区
     * @type {boolean}
     */
    _stencil;
    /**
     * 设置绘制depth属性
     * @type {boolean}
     */
    _depth;
    /**
     * 抗锯齿
     * @type {boolean}
     */
    _antialias;
    /**
     * 设置材质属性
     */
    _premultipliedAlpha;
    /**
     * get context setting
     * @memberof Context
     */
    _preserveDrawingBuffer;
    /**
     * 绘制上下文
     * @type {WebGLRenderingContext}
     */
    _gl;
    /**
     * webgl扩展
     * @type {GLExtension}
     */
    _glExtension;
    /**
     * webgl detected
     * @type {GLLimits}
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
    constructor(options) {
        options = options || {};
        const width = options.width || window.innerWidth,
            height = options.height || window.innerHeight;
        //兼容性欠佳，故改用canvas = new OffscreenCanvas(width,height);
        this._offScreenCanvas(width, height);
        this._renderType = options.renderType || 'webgl2';
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
        this._gl = this._canvas.getContext(this._renderType, this.getContextAttributes()) || this._canvas.getContext('experimental-' + this._renderType, this.getContextAttributes()) || undefined;
        //get extension
        this._includeExtension();
        //get parameter and extensions
        this._includeParameter();
        //inilization shaders
        this._includeShaders();
        //inilization programs
        this._includePrograms();
        //setup env
        this._setup();
    };
    /**
     * 兼容写法，创建非可见区域canvas，用户做缓冲绘制
     * 待绘制完成后，使用bitmaprender绘制到实际页面上
     * @memberof Context
     * @param {number} width buffer canvas width
     * @param {number} height buffer canvas height
     */
    _offScreenCanvas(width, height) {
        let htmlCanvas = document.createElement('canvas');
        htmlCanvas.width = width;
        htmlCanvas.height = height;
        this._canvas = htmlCanvas;
        //bug only firfox 44 + support
        //this._canvas = htmlCanvas.transferControlToOffscreen();
        this._width = width;
        this._height = height;
    };
    /**
     * 兼容写法
     * -如果支持最新的bitmaprenderer则使用此方法
     * -如果不支持，则使用 canvas2d 贴图绘制
     * @param {HTMLCanvasElement} canvas
     * @memberof Context
     */
    renderToCanvas(canvas) {
        //}{debug adjust canvas to fit the output
        canvas.width = this._width;
        canvas.height = this._height;
        const _canvas = this._canvas;
        //
        let image = new Image();
        image.src = _canvas.toDataURL("image/png");
        //
        const renderContext = canvas.getContext('bitmaprenderer')||canvas.getContext('2d');
        !!renderContext.transferFromImageBitmap?renderContext.transferFromImageBitmap(image):renderContext.drawImage(image,0,0);
        //
    }
    /**
     * get context attributes
     * include webgl2 attributes
     * reference https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
     * 
     */
    getContextAttributes() {
        return {
            alpha: this._alpha,
            depth: this._depth,
            stencil: this._stencil,
            antialias: this._antialias,
            premultipliedAlpha: this._premultipliedAlpha,
            preserveDrawingBuffer: this._preserveDrawingBuffer,
            //如果系统性能较低，也会创建context
            failIfMajorPerformanceCaveat: true,
        }
    };
    /**
     * 设置绘制区域的规则
     * 1. 混合颜色
     * 2. 深度
     * 3.
     * @param {WebGLRenderingContext} gl [WebGL2RenderingContext]
     */
    _setup() {
        const gl = this._gl;
        //reference http://www.cppblog.com/wc250en007/archive/2012/07/18/184088.html
        //gl.ONE 使用1.0作为因子，相当于完全使用了这种颜色参与混合运算
        //gl.ONE_MINUS_SRC_ALPHA 使用1.0-源颜色alpha值作为因子，
        //作用为：源颜色的alpha作为不透明度，即源颜色alpha值越大，混合时占比越高，混合时最常用的方式
        gl.enable(GLConstants.BLEND);
        gl.blendFunc(GLConstants.ONE, GLConstants.ONE_MINUS_SRC_ALPHA);
        //为了模仿真实物体和透明物体的混合颜色，需要使用深度信息
        //http://www.cnblogs.com/aokman/archive/2010/12/13/1904723.html
        //模版缓存区测试，用来对比当前值与预设值，用以判断是否更新此值
        //顺序为：(framment + associated data) - pixel ownership test - scissor test
        //       - alpha test - stencil test - depth test
        //       - blending - dithering - logic op - framebuffer
        //在模板测试的过程中，可以先使用一个比较用掩码（comparison mask）与模板缓冲区中的值进行位与运算，
        //再与参考值进行比较，从而实现对模板缓冲区中的值的某一位上的置位状态的判断。
        gl.enable(GLConstants.STENCIL_TEST);
        //gl.stencilFunc(gl)
        gl.enable(GLConstants.DEPTH_TEST);
        gl.depthFunc(GLConstants.LEQUAL); //深度参考值小于模版值时，测试通过
        gl.depthMask(false);
    }
    /**
     * Query and initialize extensions
     */
    _includeExtension() {
        const gl = this._gl;
        this._glExtension = new GLExtension(gl);
    };
    /**
     * hardware
     */
    _includeParameter() {
        const gl = this._gl;
        this._glLimits = new GLLimits(gl);
    };
    /**
     *  加载shaders
     */
    _includeShaders() {
        const gl = this._gl,
            names = shadersName,
            //limits=this._glLimits,
            extension = this._glExtension;

        for (let i = 0, len = names.length; i < len; i++) {
            const name = names[i];
            this._shaderCache[name] = ShaderFactory.create(name, gl, extension);
        }
    }
    /**
     * 加载prgorams
     */
    _includePrograms() {
        const gl = this._gl,
            limits = this._glLimits,
            names = shadersName,
            extension = this._glExtension,
            shaderCache = this._shaderCache;

        for (let i = 0, len = names.length; i < len; i++) {
            const name = names[i];
            const shaders = shaderCache[name];
            const program = new GLProgram(gl, shaders[0], shaders[1], extension, limits);
            this._programCache[name] = program;
            gl.linkProgram(program.handle);
        }

    }
    /**
     * 清理颜色缓冲
     * @param {Array} rgba
     * @example 
     *  clearColor(1,1,1,1);
     */
    clearColor(...args) {
        const gl = this._gl,
            [r, g, b, a] = args;
        gl.clearColor(r || 0, g || 0, b || 0, a || 0);
        gl.clear(GLConstants.COLOR_BUFFER_BIT);
    };
    /**
     * 清理模版缓冲
     */
    clearStencil() {
        const gl = this._gl;
        gl.clearStencil(0x0);
        gl.stencilMask(0xFF);
        gl.clear(GLConstants.STENCIL_BUFFER_BIT);
    };
    /**
     * 清理深度缓冲
     */
    clearDepth() {
        const gl = this._gl;
        gl.clearDepth(0x1);
        gl.clear(GLConstants.DEPTH_BUFFER_BIT);
    };

    _getProgram(programName, programConfiguration) {
        let cache = this._programCache;
        const key = `${programName}`;
        if (!!cache[key])
            return cache[key];
        else {
            //create program
        }
    };

    get width(){
        return this._width;
    }

    get height(){
        return this._height;
    }

    get gl(){
        return this._gl;
    }

    useProgram(name) {
        const shaders = this._shaderCache[name],
            program = this._programCache[name];
        program.useProgram();
        return program;
    }




}


export default Context;