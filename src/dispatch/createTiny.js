/**
 * reference:
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext
 * 
 * 总线进行调度时，生产系列的block
 * tiny分为三种：
 * 
 * 
 * -1.非全局影响式，例如 bufferData
 * -2.全局影响式，例如 gl.Clear
 * -3.全局转换容器式，例如 readPixel（可合并到2）
 * 
 * 
 * 流程：
 * 1、当glContext进行赋值等操作的时候，根据不同的操作，讲非全局影响操作暂存插入执行区
 * 2、当操作为 drawBuffer,drawElement和draw的时候，将队列包装成task插入raf待处理
 * 3、待全部glProgram都执行完毕后，写入frameBuffer
 * 4、最后统一调度全局影响操作
 * 5、复制结果图层到实际可视区
 * 
 */
const Dispose = require('./../../utils/Dispose');
/**
 * 
 */
const InternalTinyQueue = {};
/**
 * 
 */
const OverrallTinyQueue = {};
/**
 * 
 */
const TransferTinyQueue = {};
/**
 * @class
 */
class Tiny extends Dispose{
    
    constructor(glProgram,name,parameter){
        super();
        this._glProgram = glProgram;
        this._name = name;
        this._parameter = parameter;
    }

    apply(){

    }

}


class InternalTiny extends Tiny{
    
    constructor(glProgram,name,parameter){
      super(glProgram,name,parameter);
      InternalTinyQueue.push(this);
    }

    apply(){
        const glProgram = this._glProgram;
        glProgram.useProgram();
    }

 }

 class OverrallTiny extends Tiny{

    constructor(glProgram,name,parameter){
        super(glProgram,name,parameter);
    }
 }


 class TransferTiny extends Tiny{

    constructor(glProgram,name,parameter){
        super(glProgram,name,parameter);
    }
 }

 

 const merge = require('./../utils/merge'),
    enQueue = require('./queue').enQueue,
    acquireQueue = require('./queue').acquireQueue,
    InternalTiny = require('./tiny/InternallTiny'),
    OverrallTiny = require('./tiny/OverrallTiny');

const OverrallTinys = {
    'texParameteri':true,
    'texImage2D':true,
    'depthFunc':true,
    'clearColor':true,
    'clearDepth':true,
    'clear':true,
    'clearStencil':true,
    'frontFace':true,
    'cullFace':true,
    'pixelStorei':true,
    'generateMipmap':true,
    'pixelStorei':true,
    'activeTexture':true,
    'blendEquationSeparate':true,
    'blendFuncSeparate':true,
    'blendEquation':true,
    'blendFunc':true,
    'scissor':true,
    'stencilOp':true,
    'stencilFunc':true,
    'stencilMask':true,
    'depthMask':true,
    'colorMask':true,
    'texParameterf':true,
    'hint':true
};
/**
 * 存储gl中最简单的逻辑，即为当前program赋值操作，此操作没有:回滚，删除，覆盖
 * - uniforms
 * - attributes
 * - buffers,除了 createBuffer,deleteBuffer,getBufferParameter,isBuffer
 */
const InternalTinys = {
    //
    'lineWidth':true,
    //
    'scissor':true,
    'viewport':true,
    'enable':true,
    'disable':true,
    'deleteTexture':true,
    'deleteBuffer':true,
    'deleteShader':true,
    'deleteProgram':true,
    'deleteFramebuffer':true,
    'deleteRenderbuffer':true,
    //
    'bindFramebuffer':true,
    'framebufferTexture2D':true,
    //
    'readPixels':true,
    //buffer-uinform-attrib
    'bindBuffer':true,
    'bufferData':true,
    'bufferSubData':true,
    'disableVertexAttribArray': true,
    'enableVertexAttribArray': true,
    'getActiveAttrib': true,
    'getActiveUniform': true,
    'getAttribLocation': true,
    'getUniform': true,
    'getUniformLocation': true,
    'getVertexAttrib': true,
    'getVertexAttribOffset': true,
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
    'vertexAttrib1f':true,
    'vertexAttrib2f':true,
    'vertexAttrib3f':true,
    'vertexAttrib4f':true,
    //vertexAttrib1fv
    'vertexAttrib1fv':true,
    'vertexAttrib2fv':true,
    'vertexAttrib3fv':true,
    'vertexAttrib4fv':true,
    //texture
    'bindTexture':true,
};

const tinys = merge({},OverrallTinys,InternalTinys);
/**
 * @func
 */
<<<<<<< HEAD
const createTiny = function (glProgram, name,parameter) {
    //1.加入正序处理队列
    if(tinys[name]){
        const tiny = new InternalTiny(glProgram,name,parameter);
        enQueue(glProgram,tiny);
        return tiny;
    }
    //2.加入反序执行队列
    if(OverrallTinys[name]){

    }
=======
const createTiny = function (name,glProgram,parameter) {
    
>>>>>>> 3fe14018df4553bc171476dfcfe8d00dd5660d6e
}

module.exports = {
    createTiny,
    OverrallTinys,
    InternalTinys
}

