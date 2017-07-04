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

import Dispose from './../../utils/Dispose';
import GLConstants from './GLConstants';

/**
 * @class
 */
class GLTexture extends Dispose {
    /**
     * mipmap指示
     * @type {boolean}
     */
    _mipmap;
    /**
     * @type {WebGLRenderingContext}
     */
    _gl;
    /**
     *  the width of texture
     *  @type {number}
     */
    _width;
    /**
     *  the hight of texture
     *  @type {number}
     */
    _height;
    /**
     * @type {number}
     */
    _format;
    /**
     * @type {number}
     */
    _type;
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     * @param {*} width 
     * @param {*} height 
     * @param {*} format 
     * @param {*} type 
     * @param {*} extenson 
     * @param {*} limits 
     */
    constructor(gl, width, height, extenson, limits, format, type) {
        this._gl = gl;
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
    };
    /**
     * 
     * @param {*} element 
     */
    load(image) {
        this.bind();
        const gl = this._gl,
            mipmapLevel = 0;
        gl.texImage2D(gl.TEXTURE_2D, mipmapLevel, this._format, this._format, this._type, image);
    };
    /**
     * 对纹理做插值，在不同分辨率下，当获取不到纹理原始值时，可以根据点位置和周围点的值插值计算。
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

export default GLTexture;