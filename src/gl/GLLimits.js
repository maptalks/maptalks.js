/**
 * reference:
 * https://developer.mozilla.org/en-US/docs/Web/API/NavigatorConcurrentHardware/hardwareConcurrency
 * 
 * detect hardware env to fix the number of Limits
 * @author yellow date 2017/6/15
 */

const merge = require('./../utils/merge'),
    isNode = require('./../utils/isNode'),
    GLConstants = require('./GLConstants');

const _options = {
    hardwareConcurrency: 2,
    maximumCombinedTextureImageUnits: 8,
    maximumCubeMapSize: 16,
    maximumFragmentUniformVectors: 16,
    maximumTextureImageUnits: 8,
    maximumRenderbufferSize: 1,
    maximumTextureSize: 64,
    maximumVaryingVectors: 8,
    maximumVertexAttributes: 8,
    maximumVertexTextureImageUnits: 0,
    maximumVertexUniformVectors: 128,
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
    highpIntSupported: false
};

/**
 * @class
 */
class GLLimits {
    /**
     * 
     * @param {glContext} gl 
     */
    constructor(glContext) {
        this._glContext = glContext;
        this._options = merge({}, _options);
    };

    _includeParamter(gl) {
        this._options.hardwareConcurrency = isNode?2:(window.navigator.hardwareConcurrency||2);
        this._options.maximumCombinedTextureImageUnits = gl.getParameter(GLConstants.MAX_COMBINED_TEXTURE_IMAGE_UNITS); // min: 8
        this._options.maximumCubeMapSize = gl.getParameter(GLConstants.MAX_CUBE_MAP_TEXTURE_SIZE); // min: 16
        this._options.maximumFragmentUniformVectors = gl.getParameter(GLConstants.MAX_FRAGMENT_UNIFORM_VECTORS); // min: 16
        this._options.maximumTextureImageUnits = gl.getParameter(GLConstants.MAX_TEXTURE_IMAGE_UNITS); // min: 8
        this._options.maximumRenderbufferSize = gl.getParameter(GLConstants.MAX_RENDERBUFFER_SIZE); // min: 1
        this._options.maximumTextureSize = gl.getParameter(GLConstants.MAX_TEXTURE_SIZE); // min: 64
        this._options.maximumVaryingVectors = gl.getParameter(GLConstants.MAX_VARYING_VECTORS); // min: 8
        this._options.maximumVertexAttributes = gl.getParameter(GLConstants.MAX_VERTEX_ATTRIBS); // min: 8
        this._options.maximumVertexTextureImageUnits = gl.getParameter(GLConstants.MAX_VERTEX_TEXTURE_IMAGE_UNITS); // min: 0
        this._options.maximumVertexUniformVectors = gl.getParameter(GLConstants.MAX_VERTEX_UNIFORM_VECTORS); // min: 128
        this._options.highpFloatSupported = gl.getShaderPrecisionFormat(GLConstants.FRAGMENT_SHADER, GLConstants.HIGH_FLOAT) !== 0;
        this._options.highpIntSupported = gl.getShaderPrecisionFormat(GLConstants.FRAGMENT_SHADER, GLConstants.HIGH_INT) !== 0;
        this._options.minimumAliasedLineWidth = gl.getParameter(GLConstants.ALIASED_LINE_WIDTH_RANGE)[0];//must include 1
        this._options.maximumAliasedLineWidth = gl.getParameter(GLConstants.ALIASED_LINE_WIDTH_RANGE)[1];     
        this._options.minimumAliasedPointSize = gl.getParameter(GLConstants.ALIASED_POINT_SIZE_RANGE)[0]
        this._options.maximumAliasedPointSize = gl.getParameter(GLConstants.ALIASED_POINT_SIZE_RANGE)[1];//must include 1
        this._options.maximumViewportWidth = gl.getParameter(GLConstants.MAX_VIEWPORT_DIMS)[0];
        this._options.maximumViewportHeight = gl.getParameter(GLConstants.MAX_VIEWPORT_DIMS)[1];
    };
    /**
     * map the limits to GLLimits instance
     */
    _map() {
        for (var key in this._limits) {
            if (this._options.hasOwnProperty(key)) {
                let target = this._options[key];
                if (!this[key] && !!target)
                    this[key] = target;
            }
        }
    };

}




module.exports = GLLimits;