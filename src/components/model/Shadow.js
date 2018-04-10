
const shadow_fragment = require('./../shader/shadow_fragment'),
    shadow_vertex = require('./../shader/shadow_vertex');

const Mat4 = require('kiwi.matrix').Mat4;
const generateFramebuffer = require('./../utils/generateFramebuffer');

let program;

/**
 * @class
 */
class Shadow {
    constructor() {

    }
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     */
    _init(gl,vertices) {
        if (program) return;
        //vertex shader
        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, shadow_vertex);
        gl.compileShader(vs);
        //fragment shader
        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, shadow_fragment);
        gl.compileShader(fs);
        //program
        program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        //vertices
        this.pBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.pBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        this.a_position = gl.getAttribLocation(program, 'a_position');
        gl.vertexAttribPointer(this.a_position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.a_position);
        //framebuffer
        this.fbo = generateFramebuffer(gl);
    }
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     * @param {*} model 
     * @param {*} light 
     */
    draw(gl, model, light,camera) {
        this._init(gl, model.vertices);
        gl.useProgram(program);
        //vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, this.pBuffer);
        gl.vertexAttribPointer(this.a_position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.a_position);
        //更新待绘制物体的相关矩阵
        const u_projectionMatrix = gl.getUniformLocation(program, 'u_projectionMatrix');
        gl.uniformMatrix4fv(u_projectionMatrix, false, light.projectionMatrix.value);
        // gl.uniformMatrix4fv(u_projectionMatrix, false, camera.projectionMatrix.value);
        const u_viewMatrix = gl.getUniformLocation(program, 'u_viewMatrix');
        gl.uniformMatrix4fv(u_viewMatrix, false, light.viewMatrix.value);
        // gl.uniformMatrix4fv(u_viewMatrix, false, camera.viewMatrix.value);
        const u_modelMatrix = gl.getUniformLocation(program, 'u_modelMatrix');
        gl.uniformMatrix4fv(u_modelMatrix, false, model.modelMatrix.value);
        // gl.uniformMatrix4fv(u_modelMatrix, false, new Mat4().value);
        //将场景绘制在fbo里
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D,this.fbo.texture);
        gl.enable(gl.DEPTH_TEST);
        gl.bindFramebuffer(gl.FRAMEBUFFER,this.fbo);
        //绘制到实际画板
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 36);
        gl.bindFramebuffer(gl.FRAMEBUFFER,null);

        

    }

}


module.exports = Shadow;