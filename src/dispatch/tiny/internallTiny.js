/**
 * gl中基于Programn的赋值操作
 * 需useProgram切换到当前program后才能实际赋值
 */
/**
 * 存储gl中最简单的逻辑，即为当前program赋值操作，此操作没有:回滚，删除，覆盖
 * - uniforms
 * - attributes
 * - buffers,除了 createBuffer,deleteBuffer,getBufferParameter,isBuffer
 */
const INTERNAL_TINY_ENUM = {
    //
    'lineWidth': true,
    //
    'scissor': true,
    'viewport': true,
    'enable': true,
    'disable': true,
    'deleteTexture': true,
    'deleteBuffer': true,
    'deleteShader': true,
    'deleteProgram': true,
    'deleteFramebuffer': true,
    'deleteRenderbuffer': true,
    //
    'bindFramebuffer': true,
    'framebufferTexture2D': true,
    //
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
    'vertexAttrib4fv': true,
    //texture
    'bindTexture': true,
};

class InternalTiny {

    constructor(glProgram, name, ...rest) {
        this._glProgram = glProgram;
        this._name = name;
        this._rest = rest;
    }

    apply() {
        const gl = this._glProgram.gl;
        const name = this._name;
        gl[name].apply(gl,this._rest);
    }

}

module.exports = {
    INTERNAL_TINY_ENUM,
    InternalTiny
}