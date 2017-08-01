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
const merge = require('./../utils/merge'),

    GLConstants = require('./GLConstants'),
    GLExtension = require('./GLExtension'),
    GLLimits = require('./GLLimits'),
    GLProgram = require('./GLProgram');
/**
 * @class
 * @example
 * let cvs = document.createElement('canvas'),
 *  ctx = new Context(cvs);
 */
class Context {
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
        /**
         * canvas width
         */
        this._width = options.width || window.innerWidth;
        /**
         * canvas height
         */
        this._height = options.height || window.innerHeight;
        /**
         * 兼容性欠佳，故改用canvas = new OffscreenCanvas(width,height);
         * @type {HTMLCanvasElement}
         */
        this._canvas = this._offScreenCanvas();
        /**
         * context类型，支持webgl,webgl2
         * @type {String}
         */
        this._renderType = options.renderType || 'webgl2';
        /**
         * 设置允许透明度
         * @type {boolean}
         */
        this._alpha = options.alpha || false;
        /**
         * 是否启用缓冲区
         * @type {boolean}
         */
        this._stencil = options.stencil || true;
        /**
         * 设置绘制depth属性
         * @type {boolean}
         */
        this._depth = options.depth || true;
        /**
         * 抗锯齿
         * @type {boolean}
         */
        this._antialias = options.antialias || false;
        /**
         * 设置材质属性
         */
        this._premultipliedAlpha = options.premultipliedAlpha || true;
        /**
         * get context setting
         * @memberof Context
         */
        this._preserveDrawingBuffer = options.preserveDrawingBuffer || false;
        /**
         * @type {boolean}
         */
        this._allowTextureFilterAnisotropic = options.allowTextureFilterAnisotropic || true;
        /**
         * @type {GLProgram}
         */
        this._currentProgram = null;
        /**
         * webgl detected
         * @type {GLLimits}
         */
        this._glLimits;
        /**
         *  @type {WebGLRenderingContext}
         */
        this._gl = this._canvas.getContext(this._renderType, this.getContextAttributes()) || this._canvas.getContext('experimental-' + this._renderType, this.getContextAttributes()) || undefined;
        /**
         * webgl扩展
         * @type {GLExtension}
         */
        this._glExtension = this._includeExtension();
        /**
         * get parameter and extensions
         */
        this._glLimits = this._includeLimits();
        /**
         * 
         * @type {Object}
         */
        this._shaderCache = {};
        /**
         * @type {Object}
         */
        this._programCache = {};
        /**
         * setup env
         */
        this._setup();
    };
    /**
     * 兼容写法，创建非可见区域canvas，用户做缓冲绘制
     * 待绘制完成后，使用bitmaprender绘制到实际页面上
     * @memberof Context
     */
    _offScreenCanvas() {
        let htmlCanvas = document.createElement('canvas');
        htmlCanvas.width = this._width;
        htmlCanvas.height = this._height;
        //bug only firfox 44 + support
        //this._canvas = htmlCanvas.transferControlToOffscreen();
        return htmlCanvas;
    };
    /**
     * Query and initialize extensions
     */
    _includeExtension() {
        const gl = this._gl;
        return new GLExtension(gl);
    };
    /**
     * hardware
     */
    _includeLimits() {
        const gl = this._gl;
        return new GLLimits(gl);
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
        const renderContext = canvas.getContext('bitmaprenderer') || canvas.getContext('2d');
        !!renderContext.transferFromImageBitmap ? renderContext.transferFromImageBitmap(image) : renderContext.drawImage(image, 0, 0);
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
    /**
     * resize the gl.viewPort
     * }{yellow wait to be implemented
     * @param {number} width 
     * @param {number} height 
     */
    resize(width, height) {

    }
    /**
     * 返回渲染缓冲的宽度
     */
    get width() {
        return this._width;
    }
    /**
     * 返回渲染缓冲的高度
     */
    get height() {
        return this._height;
    }
    /**
     * 返回物理上下文
     * @return {WebGLRenderingConext}
     */
    get gl() {
        return this._gl;
    }
    /**
     * 使用指定program
     * @param {String} name 
     * @return {GLProgram}
     */
    useProgram(name) {
        const shaders = this._shaderCache[name],
            program = this._programCache[name];
        program.useProgram();
        return program;
    }
}

module.exports = Context;