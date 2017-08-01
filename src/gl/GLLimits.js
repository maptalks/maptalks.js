/**
 * detect hardware env to fix the number of Limits
 * @author yellow date 2017/6/15
 */

const merge = require('./../utils/merge'),
    GLConstants = require('./GLConstants');

const Limits = {
    maximumCombinedTextureImageUnits: 0,
    maximumCubeMapSize: 0,
    maximumFragmentUniformVectors: 0,
    maximumTextureImageUnits: 0,
    maximumRenderbufferSize: 0,
    maximumTextureSize: 0,
    maximumVaryingVectors: 0,
    maximumVertexAttributes: 0,
    maximumVertexTextureImageUnits: 0,
    maximumVertexUniformVectors: 0,
    minimumAliasedLineWidth: 0,
    maximumAliasedLineWidth: 0,
    minimumAliasedPointSize: 0,
    maximumAliasedPointSize: 0,
    maximumViewportWidth: 0,
    maximumViewportHeight: 0,
    maximumTextureFilterAnisotropy: 0,
    maximumDrawBuffers: 0,
    maximumColorAttachments: 0,
    highpFloatSupported: false,
    highpIntSupported: false,
    //多线程获取,A Number indicating the number of logical processor cores.
    //用于创建webwork 
    // reference https://developer.mozilla.org/en-US/docs/Web/API/NavigatorConcurrentHardware/hardwareConcurrency
    //@example 
    //  let newWorker = {
    //      worker=new Worker('cpuWorker.js'),
    //      inUse:false
    //  }
    hardwareConcurrency: 0
};

/**
 * @class
 */
class GLLimits {
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     */
    constructor(gl) {
        this._gl = gl;
        this._limits = merge({}, Limits);
        this._includeParamter(this._gl);
        this._map();
    };

    _includeParamter(gl) {
        this._limits.hardwareConcurrency = window.navigator.hardwareConcurrency || 2;
        this._limits.maximumCombinedTextureImageUnits = gl.getParameter(GLConstants.MAX_COMBINED_TEXTURE_IMAGE_UNITS); // min: 8
        this._limits.maximumCubeMapSize = gl.getParameter(GLConstants.MAX_CUBE_MAP_TEXTURE_SIZE); // min: 16
        this._limits.maximumFragmentUniformVectors = gl.getParameter(GLConstants.MAX_FRAGMENT_UNIFORM_VECTORS); // min: 16
        this._limits.maximumTextureImageUnits = gl.getParameter(GLConstants.MAX_TEXTURE_IMAGE_UNITS); // min: 8
        this._limits.maximumRenderbufferSize = gl.getParameter(GLConstants.MAX_RENDERBUFFER_SIZE); // min: 1
        this._limits.maximumTextureSize = gl.getParameter(GLConstants.MAX_TEXTURE_SIZE); // min: 64
        this._limits.maximumVaryingVectors = gl.getParameter(GLConstants.MAX_VARYING_VECTORS); // min: 8
        this._limits.maximumVertexAttributes = gl.getParameter(GLConstants.MAX_VERTEX_ATTRIBS); // min: 8
        this._limits.maximumVertexTextureImageUnits = gl.getParameter(GLConstants.MAX_VERTEX_TEXTURE_IMAGE_UNITS); // min: 0
        this._limits.maximumVertexUniformVectors = gl.getParameter(GLConstants.MAX_VERTEX_UNIFORM_VECTORS); // min: 128
        this._limits.highpFloatSupported = gl.getShaderPrecisionFormat(GLConstants.FRAGMENT_SHADER, GLConstants.HIGH_FLOAT) !== 0;
        this._limits.highpIntSupported = gl.getShaderPrecisionFormat(GLConstants.FRAGMENT_SHADER, GLConstants.HIGH_INT) !== 0;
        this._limits.maximumTextureFilterAnisotropy = gl.getParameter(GLConstants.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
        [this._limits.minimumAliasedLineWidth, this._limits.maximumAliasedLineWidth] = gl.getParameter(GLConstants.ALIASED_LINE_WIDTH_RANGE);    //must include 1
        [this._limits.minimumAliasedPointSize, this._limits.maximumAliasedPointSize] = gl.getParameter(GLConstants.ALIASED_POINT_SIZE_RANGE);    //must include 1
        [this._limits.maximumViewportWidth, this._limits.maximumViewportHeight] = gl.getParameter(GLConstants.MAX_VIEWPORT_DIMS);
    };
    /**
     * map the limits to GLLimits instance
     */
    _map() {
        for (var key in this._limits) {
            if (this._limits.hasOwnProperty(key)) {
                let target = this._limits[key];
                if (!this[key] && !!target)
                    this[key] = target;
            }
        }
    };

}

module.exports = GLLimits;