/**
 * use texture soruce to create the texture form
 * reference:
 * https://webgl2fundamentals.org/webgl/lessons/webgl-2-textures.html
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/texImage3D
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
 * 
 * -mipmap
 * -支持非2的n次方规格的textures
 * 
 */
const Dispose = require('./../utils/Dispose'),
        GLConstants = require('./GLConstants');

/**
 * @class
 */
class GLTexture extends Dispose {
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     * @param {number} width 
     * @param {number} height 
     * @param {GLExtension} extenson 
     * @param {*} limits 
     * @param {*} format 
     * @param {*} type 
     */
    constructor(gl, width, height, extension, limits, format, type) {
        super();
        this._gl = gl;
        this._extension = extension;
        this._limits = limits;
        this._width = width || -1;
        this._height = height || -1;
        this._handle = this._createHandle();
        //usually, UNSINGED_BYTE use 8bit per channel,which suit for RGBA.
        this._format = format || GLConstants.RGBA;
        this._type = type || GLConstants.UNSIGNED_BYTE;
    };
    /**
     * overwrite
     */
    _createHandle() {
        return this._gl.createTexture();
    };
    /**
     * 释放texture资源
     */
    dispose() {
        this._gl.deleteTexture(this.handle);
    };
    /**
     * return the flag mipmap
     * @member
     */
    get mipmap() {
        return this._mipmap;
    }
    /**
     * 
     * @param {Image|Html} element 
     */
    loadImage(image) {
        this.bind();
        const gl = this._gl,
            mipmapLevel = 0;
        gl.texImage2D(gl.TEXTURE_2D, mipmapLevel, this._format, this._format, this._type, image);
    }
    /**
     * Use a data source and uploads this texture to the GPU
     * @param {TypedArray} data the data to upload to the texture
     */
    loadData(data) {
        this.bind();
        const gl = this._gl,
            ext = this._extension['textureFloat'];
        this._type = (data instanceof Float32Array) ? gl.FLOAT : this._type;
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this._premultiplyAlpha);
        gl.texImage2D(gl.TEXTURE_2D, 0, this.format, width, height, 0, this.format, this.type, data || null);
    }
    /**
     * 对纹理做插值，在不同分辨率下，当获取不到纹理原始值时，可以根据点位置和周围点的值插值计算。
     * 建议优先调用此方法
     */
    enableMipmap() {
        const gl = this._gl;
        this.bind();
        this._mipmap = true;
        gl.generateMipmap(GLConstants.TEXTURE_2D);
    }
    /**
     * 纹理延展到边界
     */
    enableWrapClamp() {
        const gl = this._gl;
        this.bind();
        gl.texParameteri(GLConstants.TEXTURE_2D, GLConstants.TEXTURE_WRAP_S, GLConstants.CLAMP_TO_EDGE);
        gl.texParameteri(GLConstants.TEXTURE_2D, GLConstants.TEXTURE_WRAP_T, GLConstants.CLAMP_TO_EDGE);
    }
    /**
     * 纹理超过边际，镜像repeat
     */
    enableWrapMirrorRepeat() {
        const gl = this._gl;
        this.bind();
        gl.texParameteri(GLConstants.TEXTURE_2D, GLConstants.TEXTURE_WRAP_S, GLConstants.MIRRORED_REPEAT);
        gl.texParameteri(GLConstants.TEXTURE_2D, GLConstants.TEXTURE_WRAP_T, GLConstants.MIRRORED_REPEAT);
    }
    /**
     * 纹理显现拉伸，使用线性插值法
     */
    enableLinearScaling() {
        const gl = this._gl;
        this.bind();
        gl.texParameteri(GLConstants.TEXTURE_2D, GLConstants.TEXTURE_MIN_FILTER, this._mipmap ? GLConstants.LINEAR_MIPMAP_LINEAR : GLConstants.LINEAR);
        gl.texParameteri(GLConstants.TEXTURE_2D, GLConstants.TEXTURE_MAG_FILTER, GLConstants.LINEAR);
    }
    /**
     * 纹理临近拉伸，使用最临近插值法
     */
    enableNearstScaling() {
        const gl = this._gl;
        this.bind();
        gl.texParameteri(GLConstants.TEXTURE_2D, GLConstants.TEXTURE_MIN_FILTER, this._mipmap ? GLConstants.NEAREST_MIPMAP_NEAREST : GLConstants.NEAREST);
        gl.texParameteri(GLConstants.TEXTURE_2D, GLConstants.TEXTURE_MAG_FILTER, GLConstants.NEAREST);
    }
    /**
     * binds the texture
     * @type {texture}
     */
    bind(location) {
        const gl = this._gl;
        if (location !== undefined)
            gl.activeTexture(GLConstants.TEXTURE0 + location);
        gl.bindTexture(GLConstants.TEXTURE_2D, this.handle);
    };
    /**
     * unbinds the texture
     */
    unbind() {
        const gl = this._gl;
        gl.bindTexture(gl.TEXTURE_2D, null);
    };
}

module.exports =  GLTexture;