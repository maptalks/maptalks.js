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
 * @modify yellow 2017/8/8
 * 
 * 
 */
const merge = require('./../utils/merge'),
    isFunction = require('./../utils/isFunction'),
    isNode = require('./../utils/isNode'),
    mapFunc = require('./../utils/mapFunc'),
    Dispose = require('./../utils/Dispose'),
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
class GLContext extends Dispose {
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
    constructor(options = {}) {
        super();
        this._canvas = options.canvas || null;
        /**
         * canvas width
         */
        this._width = options.width || window.innerWidth;
        /**
         * canvas height
         */
        this._height = options.height || window.innerHeight;
        /**
         * context类型，支持webgl,webgl2
         * @type {String} default is 'webgl'
         */
        this._renderType = options.renderType || 'webgl';
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
         *  @type {WebGLRenderingContext}
         */
        this._gl = this._createHandle();
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
         * @type {Object}
         */
        this._programCache = {};
        /**
         * @type {GLProgram}
         */
        this._currentProgram = null;
        /**
         * setup env
         */
        this._setup();
        /**
         * map glContext to Context
         */
        this._map();
    };
    /**
     * 兼容写法，创建非可见区域canvas，用户做缓冲绘制
     * 待绘制完成后，使用bitmaprender绘制到实际页面上
     * @memberof Context
     */
    _createHandle() {
        if (!isNode) {
            this._canvas = this._canvas || document.createElement('canvas');
            this._canvas.width = this._width;
            this._canvas.height = this._height;
            const gl = this._canvas.getContext(this._renderType, this.getContextAttributes()) || this._canvas.getContext('experimental-' + this._renderType, this.getContextAttributes());
            return gl;
        } else {
            // const GL = require('gl'),
            // return GL(this._width, this._height);
        }
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
     * map相关属性与方法
     */
    _map() {
        //map constant
        for (let key in GLConstants) {
            if (!this.hasOwnProperty(key)) {
                let target = GLConstants[key];
                if (!this[key] && !!target)
                    this[key] = target;
            }
        }
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
     * 
     * @param {*} programs 
     */
    mergeProrgam(...programs) {
        const gl = this._gl,
            _programList = [].concat(...programs),
            len = _programList.length;
        //map to programs
        for (let i = 0; i < len; i++) {
            const _program = _programList[i],
                _id = _program.id;
            if (!this._programCache[_id]) {
                this._programCache[_id] = _program;
                gl.linkProgram(_program.handle);
            }
        }
    }
    // /**
    //  * 使用指定program
    //  * @param {String} key 
    //  * @return {GLProgram}
    //  */
    // useProgram(key) {
    //     if (key instanceof GLProgram)
    //         key = key.id;
    //     const program = this._programCache[key];
    //     program.useProgram();
    //     return program;
    // }
    /**
     * 获取canvas
     */
    get canvas() {
        const gl = this._gl;
        return gl.canvas;
    }
    /**
    * Some experimental-webgl implementations do not have getShaderPrecisionFormat
    */
    // getShaderPrecisionFormat() {
    //     return { 'rangeMin': 1, 'rangeMax': 1, 'precision': 1 };
    // }
    /**
     * 获取extension
     */
    getExtension(name) {
        const glExtension = this._glExtension;
        return glExtension.getExtension(name);
    }
    /**
     * 
     * @param {number|GLConstants} number 枚举
     */
    getParameter(number) {
        const gl = this._gl;
        return gl.getParameter(number);
    }
    /**
     * map to texture
     */
    createTexture() {
        const gl = this._gl;
        return gl.createTexture();
    }
    /**
     * 
     * @param {number} target 
     * @param {texture} texture 
     */
    bindTexture(target, texture) {
        const gl = this._gl;
        gl.bindTexture(target, texture);
    }
    /**
     * 
     * @param {number} target 
     * @param {number} pname 
     * @param {number} param 
     */
    texParameteri(target, pname, param) {
        const gl = this._gl;
        gl.texParameteri(target, pname, param);
    }
    /**
     * @param {number} target 
     * @param {number} level 
     * @param {number} internalformat 
     * @param {number} width 
     * @param {number} height 
     * @param {number} border 
     * @param {number} format 
     * @param {number} type 
     * @param {ArrayBufferView} pixels 
     */
    texImage2D(target, level, internalformat, width, height, border, format, type, pixels) {
        const gl = this._gl;
        gl.texImage2D(target, level, internalformat, width, height, border, format, type, pixels)
    }
    /**
     * 
     * @param {number} cap 
     */
    enable(cap) {
        const gl = this._gl;
        gl.enable(cap);
    }
    /**
     * 
     * @param {number} cap 
     */
    disable(cap){
        const gl = this._gl;
        gl.disable(cap);
    }
    /**
     * 
     * @param {number} func 
     */
    depthFunc(func) {
        const gl = this._gl;
        gl.depthFunc(func);
    }
    /**
     * 
     * @param {number} red 
     * @param {number} green 
     * @param {number} blue 
     * @param {number} alpha 
     */
    clearColor(red,green,blue,alpha){
        const gl =this._gl;
        //gl.clearColor(red,green,blue,alpha);
    }
    /**
     * 
     * @param {number} depth 
     */
    clearDepth(depth) {
        const gl = this._gl;
        //gl.clearDepth(depth);
    }
    /**
     * 
     * @param {number} mask 
     */
    clear(mask) {
        const gl = this._gl;
        //gl.clear(mask);
    }
    /**
     * 
     * @param {GLenum} s 
     */
    clearStencil(s) {
        const gl = this._gl;
        //gl.clearStencil(s);
    }
    /**
     * 
     * @param {number} mode 
     */
    frontFace(mode) {
        const gl = this._gl;
        gl.frontFace(mode);
    }
    /**
     * 
     * @param {number} mode 
     */
    cullFace(mode) {
        const gl = this._gl;
        gl.cullFace(mode);
    }
    /**
     * 
     * @param {number} type 
     */
    createShader(type) {
        const gl = this._gl;
        return gl.createShader(type);
    }
    /**
     * 
     * @param {WebGLShader} shader 
     * @param {String} source 
     */
    shaderSource(shader, source) {
        const gl = this._gl;
        gl.shaderSource(shader, source);
    }
    /**
     * 
     * @param {WebGLShader} shader 
     */
    compileShader(shader) {
        const gl = this._gl;
        gl.compileShader(shader);
    }
    /**
     * 
     * @param {WebGLShader} shader 
     * @param {number} pname 
     */
    getShaderParameter(shader, pname) {
        const gl = this._gl;
        return gl.getShaderParameter(shader, pname)
    }
    /**
     * 
     * @param {WebGLShader} shader 
     */
    deleteShader(shader) {
        const gl = this._gl;
        gl.deleteShader(shader);
    }
    /**
     * @return {WebGLBuffer}
     */
    createBuffer() {
        const gl = this._gl;
        return gl.createBuffer();
    }
    /**
     * 
     * @param {number} target 
     * @param {WebGLBuffer} buffer 
     */
    bindBuffer(target, buffer) {
        const gl = this._gl;
        return gl.bindBuffer(target, buffer);
    }
    /**
     * 
     * @param {number} target 
     * @param {number | ArrayBufferView | ArrayBuffer} size 
     * @param {number} usage 
     */
    bufferData(target, size, usage) {
        const gl = this._gl;
        gl.bufferData(target, size, usage);
    }
    /**
     * 
     * @param {number} pname 
     * @param {number|boolean} param 
     */
    pixelStorei(pname, param) {
        const gl = this._gl;
        gl.pixelStorei(pname, param);
    }
    /**
     * 
     * @param {number} target 
     */
    generateMipmap(target) {
        const gl = this._gl;
        gl.generateMipmap(target);
    }
    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {number} width 
     * @param {number} height 
     */
    viewport(x, y, width, height) {
        const gl = this._gl;
        gl.viewport(x, y, width, height);
    }
    /**
     * @param {WebGLProgram} program
     */
    useProgram(program) {
        const gl = this._gl;
        gl.useProgram(program);
    }
    /**
     * @return {WebGLProgram}
     */
    createProgram() {
        const gl = this._gl;
        //1.创建GLProgram
        const glProgram = new GLProgram(gl);
        //2.缓存program
        this._programCache[glProgram.id] = glProgram;
        //3.兼容，返回句柄
        return glProgram.handle;
    }
    /**
     * 
     * @param {WebGLProgram} program 
     * @param {WebGLShader} shader 
     */
    attachShader(program, shader) {
        const gl = this._gl;
        gl.attachShader(program, shader);
    }
    /**
     * 
     * @param {WebGLProgram} program 
     */
    linkProgram(program) {
        const gl = this._gl;
        gl.linkProgram(program);
    }
    /**
     * 
     * @param {WebGLProgram} program 
     * @param {number} pnam 
     * @return {any}
     */
    getProgramParameter(program, pnam) {
        const gl = this._gl;
        return gl.getProgramParameter(program, pnam);
    }
    /**
     * 
     * @param {WebGLProgram} program 
     * @param {number} index 
     * @return {WebGLActiveInfo}
     */
    getActiveUniform(program, index) {
        const gl = this._gl;
        return gl.getActiveUniform(program, index);
    }
    /**
     * 
     * @param {WebGLProgram} program 
     * @param {number} name 
     * @return {WebGLUniformLocation}
     */
    getUniformLocation(program, name) {
        const gl = this._gl;
        return gl.getUniformLocation(program, name);
    }
    /**
     * 
     * @param {WebGLProgram} program 
     * @param {number} index 
     * @return {WebGLActiveInfo}
     */
    getActiveAttrib(program, index) {
        const gl = this._gl;
        return gl.getActiveAttrib(program, index)
    }
    /**
     * 
     * @param {WebGLProgram} program 
     * @param {number} name 
     * @return {number}
     */
    getAttribLocation(program, name) {
        const gl = this._gl;
        return gl.getAttribLocation(program, name);
    }
    /**
     * 
     * @param {number} index 
     */
    enableVertexAttribArray(index) {
        const gl = this._gl;
        gl.enableVertexAttribArray(index);
    }
    /**
     * 
     * @param {number} index 
     * @param {number} size 
     * @param {number} type 
     * @param {boolean} normalize 
     * @param {number} stride 
     * @param {number} offset 
     */
    vertexAttribPointer(index, size, type, normalize, stride, offset) {
        const gl = this._gl;
        gl.vertexAttribPointer(index, size, type, normalize, stride, offset);
    }
    /**
     * 
     * @param {WebGLUniformLocation} location 
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     */
    uniform3f(location,x,y,z){
        const gl = this._gl;
        gl.uniform3f(location,x,y,z);
    }
    /**
     * 
     * @param {WebGLUniformLocation} location 
     * @param {Float32Array|number[]} v 
     */
    uniform3fv(location, v) {
        const gl = this._gl;
        gl.uniform3fv(location, v);
    }
    /**
     * 
     * @param {WebGLUniformLocation} location 
     * @param {Float32Array|number[]} v 
     */
    uniform4fv(location, v) {
        const gl = this._gl;
        gl.uniform4fv(location, v);
    }
    /**
     * 
     * @param {WebGLUniformLocation} location 
     * @param {number} x 
     */
    uniform1f(location, x) {
        const gl = this._gl;
        gl.uniform1f(location, x);
    }
    /**
     * 
     * @param {WebGLUniformLocation} location 
     * @param {Float32Array|number[]} v 
     */
    uniform1fv(location, v) {
        const gl = this._gl;
        gl.uniform1fv(location, v);
    }
    /**
     * 
     * @param {WebGLUniformLocation} location 
     * @param {boolean} transpose
     * @param {Float32Array | number[]} v
     */
    uniformMatrix3fv(location,transpose,value){
        const gl = this._gl;
        gl.uniformMatrix3fv(location,transpose,value);
    }
    /**
     * 
     * @param {WebGLUniformLocation} location 
     * @param {boolean} transpose
     * @param {Float32Array | number[]} v
     */
    uniformMatrix4fv(location, transpose, v) {
        const gl = this._gl;
        gl.uniformMatrix4fv(location, transpose, v);
    }
    /**
     * 
     * @param {WebGLUniformLocation} location 
     * @param {number} x 
     */
    uniform1i(location, x) {
        const gl = this._gl;
        gl.uniform1i(location, x);
    }
    /**
     * 
     * @param {number} texture 
     */
    activeTexture(texture) {
        const gl = this._gl;
        gl.activeTexture(texture);
    }
    /**
     * 
     * @param {number} mode 
     * @param {number} count 
     * @param {number} type 
     * @param {number} offset 
     */
    drawElements(mode, count, type, offset) {
        const programCache = this._programCache;
        for(const key in programCache){
            const glProgram = programCache[key];
            glProgram.useProgram();
            glProgram.drawElements(mode, count, type, offset);
        }
        //gl.drawElements(mode, count, type, offset);
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquationSeparate
     * used to set the RGB blend equation and alpha blend equation separately.
     * The blend equation determines how a new pixel is combined with a pixel already in the WebGLFramebuffer
     * @param {GLenum} modeRGB 
     * @param {GLenum} modeAlpha 
     */
    blendEquationSeparate(modeRGB, modeAlpha) {
        const gl = this._gl;
        gl.blendEquationSeparate(modeRGB, modeAlpha);
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFuncSeparate
     * defines which function is used for blending pixel arithmetic for RGB and alpha components separately.
     * 
     * @param {number|GLenum} srcRGB 
     * @param {number|GLenum} dstRGB 
     * @param {number|GLenum} srcAlpha 
     * @param {number|GLenum} dstAlpha 
     */
    blendFuncSeparate(srcRGB, dstRGB, srcAlpha, dstAlpha) {
        const gl = this._gl;
        gl.blendFuncSeparate(srcRGB, dstRGB, srcAlpha, dstAlpha);
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/scissor
     * sets a scissor box, which limits the drawing to a specified rectangle.
     * 
     * turn on scissor test to open
     * gl.enable(gl.SCISSSOR_TEST);
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {number} widht 
     * @param {number} height 
     */
    scissor(x, y, widht, height) {
        const gl = this._gl;
        gl.scissor(x, y, widht, height);
    }
    /**
     * 
     * @param {boolean} flag 
     */
    depthMask(flag){
        const gl = this._gl;
        gl.depthMask(flag);
    }
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/colorMask
     * sets which color components to enable or to disable when drawing or rendering to a WebGLFramebuffer
     * @param {boolean} red 
     * @param {boolean} green 
     * @param {boolean} blue 
     * @param {boolean} alpha 
     */
    colorMask(red, green, blue, alpha){
        const gl = this._gl;
        gl.colorMask(red, green, blue, alpha);
    }
    /**
     * @param {WebGLProgram} program
     * @return {String}
     */
    getProgramInfoLog(program){
        const gl = this._gl;
        return gl.getProgramInfoLog(program);
    }
    /**
     * @param {WebGLShader} shader 
     * @return {String}
     */
    getShaderInfoLog(shader){
        const gl =this._gl;
        return gl.getShaderInfoLog(shader);
    }
    /**
     * 
     * @param {number} width 
     */
    lineWidth(width){
        const gl = this._gl;
        gl.lineWidth(width);
    }
}

module.exports = GLContext;