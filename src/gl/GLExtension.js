/**
 * @author yellow date 2017/6/15
 * management of GLExtension
 */
const GL_STANDEXTENSIONS = {
    standardDerivatives: ['OES_standard_derivatives'],
    elementIndexUint: ['OES_element_index_uint'],
    depthTexture: ['WEBGL_depth_texture', 'WEBKIT_WEBGL_depth_texture'],
    textureFloat: ['OES_texture_float'],
    fragDepth: ['EXT_frag_depth'],
    debugShaders: ['WEBGL_debug_shaders'],
    s3tc: ['WEBGL_compressed_texture_s3tc', 'MOZ_WEBGL_compressed_texture_s3tc', 'WEBKIT_WEBGL_compressed_texture_s3tc'],
    pvrtc: ['WEBGL_compressed_texture_pvrtc', 'WEBKIT_WEBGL_compressed_texture_pvrtc'],
    etc1: ['WEBGL_compressed_texture_etc1'],
    textureFilterAnisotropic: ['EXT_texture_filter_anisotropic', 'MOZ_EXT_texture_filter_anisotropic', 'WEBKIT_EXT_texture_filter_anisotropic'],
    vertexArrayObject:['OES_vertex_array_object','MOZ_OES_vertex_array_object','WEBKIT_OES_vertex_array_object'],
    angleInstancedArrays:['ANGLE_instanced_arrays']
};
/**
 * 
 * @class
 * @example
 *  let extension = new GLExtension(gl);
 *  let standardDerivatives = extension['standardDerivatives']; 
 *  //or
 *  let standardDerivatives = extension.standardDerivatives; 
 */
class GLExtension {
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     * @param {Array} [names] the arry of extension names
     */
    constructor(gl) {
        this._gl = gl;
        this._extensions = {};
        this._includeExtension(gl);
        this._map();
    };

    _includeExtension(gl) {
        for (var key in GL_STANDEXTENSIONS) {
            if (GL_STANDEXTENSIONS.hasOwnProperty(key)) {
                let extensionName = GL_STANDEXTENSIONS[key],
                    extension = this._getExtension(gl, extensionName);
                if (!!extension)
                    this._extensions[key] = extension;
            }
        }
    };

    _getExtension(gl, names) {
        for (let i = 0, len = names.length; i < len; ++i) {
            let extension = gl.getExtension(names[i]);
            if (extension)
                return extension;
        }
        return undefined;
    };
    /**
     * map gl.extension to GLContext instance
     */
    _map() {
        for (var key in this._extensions) {
            if (this._extensions.hasOwnProperty(key)) {
                let target = this._extensions[key];
                if (!this[key] && !!target)
                    this[key] = target;
            }
        }
    };

}

module.exports = GLExtension;