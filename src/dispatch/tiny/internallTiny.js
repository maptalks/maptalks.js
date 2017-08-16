/**
 * gl中基于Programn的赋值操作
 * 需useProgram切换到当前program后才能实际赋值
 */

const InternalTinys = {
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


 class InternalTiny{
    
    constructor(glProgram,name,parameters){
        this._glProgram = glProgram;
        this._name = name;
        this._parameters = parameters;
        glProgram.enQueue()
    }

    apply(){
        const handle = this._glProgram.handle;
        const name = this._name;
        const parameters = this._parameters;
        handle[name].apply(this.parameters);
    }

 }

 module.exports = InternalTiny;