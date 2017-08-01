/**
 * 渲染缓冲区是OpenGl管理的有效内存，包含了格式化的图像数据(texture)
 * 绑定渲染缓冲区后，并没有分配存储空间来存储图像数据，需要分配存储空间并指定其图像格式，然后才可以把渲染缓冲区附加到一个帧缓冲区并向其中进行渲染
 * 
 * reference https://www.web-tinker.com/article/20169.html
 * 
 * 使用帧缓冲和缓冲区缓冲来加速绘制
 * 提供framebuffer和renderbuffer
 * 
 * renderBuffer 用于离屏渲染，即将渲染场景渲染到renderbuffer object，RBO是一个数据存储区，包括一副图像和内部渲染格式，用于存储gl没有纹理格式的逻辑缓冲区。如模版和深度缓冲区
 * 
 * 渲染流程：
 * http://blog.csdn.net/myarrow/article/details/7782963
 * 
 */

const Dispose = require('./../../utils/Dispose'),
    GLConstants = require('./../GLConstants'),
    GLTexture = require('./../GLTexture');

/**
 * 帧缓冲类
 * @class
 */
class GLFramebuffer extends Dispose {
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     * @param {number} width 
     * @param {number} height 
     */
    constructor(gl, width, height) {
        super();
        this._gl = gl;
        this._width = width || 100;
        this._height = height || 100;
        this._handle = this._createHandle();
    }
    /**
     * 创建 framebuffer 帧缓冲
     */
    _createHandle() {
        const gl = this._gl;
        return gl.createFramebuffer();
    }
    /**
     * 绑定此buffer到绘制上下文（WebGLRenderingContext）
     */
    bind() {
        const gl = this._gl;
        gl.bindFramebuffer(GLConstants.FRAMEBUFFER, this.handle);
    }
    /**
     * 使用缓冲区绘制,即
     * the paramter example and reference:
     * https://www.web-tinker.com/article/20169.html
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/framebufferRenderbuffer
     */
    enableStencil() {
        //已应用过stencil缓冲区，则不再重复创建
        if (!!this._stencil) return;
        const gl = this._gl;
        this._stencil = gl.createRenderbuffer();
        gl.bindRenderbuffer(GLConstants.RENDERBUFFER, this._stencil);
        //把渲染缓冲绑定到当前工作帧缓冲上 the gl.DEPTH_STENCIL_ATTACHMENT is only supported in webgl2
        gl.framebufferRenderbuffer(GLConstants.FRAMEBUFFER, GLConstants.DEPTH_STENCIL_ATTACHMENT, GLConstants.RENDERBUFFER, this._stencil);
        //渲染缓冲参数已设置完毕，取消渲染缓冲,防止接下来的误操作
        gl.bindRenderbuffer(GLConstants.RENDERBUFFER, null);
        gl.renderbufferStorage(GLConstants.RENDERBUFFER, GLConstants.DEPTH_STENCIL, this._width, this._height);
    }
    /**
     * 
     * @param {GLTexture} glTexture 
     */
    enableTexture(glTexture) {
        const gl = this._gl;
        this._texture = glTexture;
        this._texture.bind();
        this.bind();
        //把贴图对象也绑定到帧缓冲中
        gl.framebufferTexture2D(GLConstants.FRAMEBUFFER, GLConstants.COLOR_ATTACHMENT0, GLConstants.TEXTURE_2D, this._texture.handle, 0);
        //设置贴图对象的属性...此步骤在外部调用，例如 glTexture.enableLineScaling();故此不做额外设置
    }
}

module.exports = GLFramebuffer;