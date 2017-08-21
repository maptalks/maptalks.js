/**
 * Tiny的作用与策略，详情请参见：
 * https://github.com/axmand/fusion.gl/wiki/Tiny
 * 
 * -
 */
const Ticker = require('./../ticker/Ticker');
/**
 * internal ticker
 */
const ticker = new Ticker({
    autoStart: true
});
/**
 * 与program相关的操作
 */
const INTERNAL_TINY_ENUM = {
    'lineWidth': true,
    //'viewport': true,
    //'enable': true,
    //'disable': true,
    'deleteBuffer': true,
    //'deleteShader': true,
    'deleteProgram': true,
    'deleteFramebuffer': true,
    'deleteRenderbuffer': true,
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
};
/**
 * 需要记住前序状态的webgl操作
 */
const OVERRAL_TINY_ENUM = {
    //'texParameteri': true,
    //'texImage2D': true,
    //'depthFunc': true,
    //'clearColor': true,
    //'clearDepth': true,
    //'clear': true,
    //'clearStencil': true,
    //'frontFace': true,
    //'cullFace': true,
    //'generateMipmap': true,
    //'pixelStorei': true,
    'activeTexture': true,
    //'blendEquationSeparate': true,
    //'blendFuncSeparate': true,
    'blendEquation': true,
    'blendFunc': true,
    'scissor': true,
    'stencilOp': true,
    'stencilFunc': true,
    'stencilMask': true,
    //'depthMask': true,
    //'colorMask': true,
    'texParameterf': true,
    'hint': true
};

 /**
  * @class
  */
class Tiny{
    /**
     * 
     * @param {GLContext} glCOntext 
     */
    constructor(glCOntext){
        /**
         * the operations which need's to be updated all without program context change
         */
        this._overrall=[];
        /**
         * the operations which need's to be updated in a tick combine with program context 
         */
        this._internal=[];
    }
    /**
     * indicate wether it's need to be updated
     */
    get isEmpty(){
        return this._internal.length === 0;
    }

    

}