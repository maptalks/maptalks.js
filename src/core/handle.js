/**
 * 操作分类
 */

const merge = require('./../utils/merge'),
    Ticker = require('./Ticker');
/**
* 与program相关的操作
*/
const INTERNAL_ENUM = {
    'lineWidth': true,
    'deleteBuffer': true,
    'deleteShader': true,
    'deleteProgram': true,
    'deleteFramebuffer': true,
    'deleteRenderbuffer': true,
    'deleteTexture':true,
    //
    'bindFramebuffer': true,
    'framebufferTexture2D': true,
    'readPixels': true,
    //buffer-uinform-attrib
    'bindBuffer': true,
    'bufferData': true,
    'bufferSubData': true,
    'disableVertexAttribArray': true,
    'enableVertexAttribArray': true,
    'vertexAttribPointer': true,
    //uniformMatrix
    'uniformMatrix2fv': true,
    'uniformMatrix3fv': true,
    'uniformMatrix4fv': true,
    //uniform1[f][i][v]
    'uniform1f': true,
    'uniform1fv': true,
    'uniform1i': true,
    'uniform1iv': true,
    //uniform2[f][i][v]
    'uniform2f': true,
    'uniform2fv': true,
    'uniform2i': true,
    'uniform2iv': true,
    //uniform3[f][i][v]
    'uniform3f': true,
    'uniform3fv': true,
    'uniform3i': true,
    'uniform3iv': true,
    //uniform4[f][i][v]
    'uniform4f': true,
    'uniform4fv': true,
    'uniform4i': true,
    'uniform4iv': true,
    //vertexAttrib1f
    'vertexAttrib1f': true,
    'vertexAttrib2f': true,
    'vertexAttrib3f': true,
    'vertexAttrib4f': true,
    //vertexAttrib1fv
    'vertexAttrib1fv': true,
    'vertexAttrib2fv': true,
    'vertexAttrib3fv': true,
    'vertexAttrib4fv': true
}
/**
 * 需要记住前序状态的webgl操作
 */
const OVERRAL_ENUM = {
    'texParameterf': true,
    'texParameteri': true,
    'bindTexture': true,
    'compressedTexImage2D': true,
    'compressedTexSubImage2D': true,
    'viewport': true,
    'scissor': true,
    'enable': true,
    'disable': true,
    'texParameteri': true,
    'texImage2D': true,
    'texSubImage2D': true,
    'depthFunc': true,
    'depthMask': true,
    'colorMask': true,
    // 'clearColor': true,
    // 'clearDepth': true,
    // 'clear': true,
    // 'clearStencil': true,
    'frontFace': true,
    'cullFace': true,
    'blendEquationSeparate': true,
    'blendFuncSeparate': true,
    'pixelStorei': true,
    'generateMipmap': true,
    'activeTexture': true,
    'blendEquation': true,
    'blendFunc': true,
    'stencilOp': true,
    'stencilFunc': true,
    'stencilMask': true,
    'texParameterf': true,
    'hint': true
};

const TICKER_ENUM = {
    'drawElements': true,
    'drawArrays': true
}

const GL2_ENUM={
    'bindTransformFeedback':true
}


const ALL_ENUM = merge({}, INTERNAL_ENUM, OVERRAL_ENUM, TICKER_ENUM,GL2_ENUM);

/**
 * internal ticker
 */
const ticker = new Ticker();

module.exports = {
    INTERNAL_ENUM,
    OVERRAL_ENUM,
    TICKER_ENUM,
    ALL_ENUM,
    ticker
}