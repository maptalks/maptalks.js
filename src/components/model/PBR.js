const GLMatrix = require('kiwi.matrix').GLMatrix,
    Vec3 = require('kiwi.matrix').Vec3,
    Mat4 = require('kiwi.matrix').Mat4;

const pbr_fragment = require('./../shader/pbr_fragment'),
    pbr_vertex = require('./../shader/pbr_vertex'),
    Model = require('./Model');
/**
 * @type
 */
let program;
/**
 * @author yellow date 2018/4/10
 */
class PBR extends Model {
    constructor(opts = {}) {
        super(opts);
    }
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     */
    _init(gl) {
        if (program) return;
        //vertex shader
        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, pbr_vertex);
        gl.compileShader(vs);
        //fragment shader
        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, pbr_fragment);
        gl.compileShader(fs);
        //program
        program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        gl.useProgram(program);
        //
        const vertices = this.vertices,
            normals = this.normals,
            indeices = this.indices,
            textureCoords = this.textureCoords;
        //vertices
        const pBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        const a_position = gl.getAttribLocation(program, 'a_position');
        gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);//在此设置顶点数据的读取方式,Stride,步长设置为0，让程序自动决定步长
        gl.enableVertexAttribArray(a_position);
        //indeices
        const iBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Float32Array(indeices), gl.STATIC_DRAW);
        //normals
        const nBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
        const a_normal = gl.getAttribLocation(program, 'a_normal');
        gl.vertexAttribPointer(a_normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_normal);
        //texture coords
        const tBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
        const a_texCoord = gl.getAttribLocation(program, 'a_texCoord');
        gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_texCoord);
        //pbr
        //set albedo
        const albedo = gl.getUniformLocation(program, 'albedo');
        gl.uniform3fv(albedo, [0.5, 0.0, 0.0]);
        //set ao
        const ao = gl.getUniformLocation(program, 'ao');
        gl.uniform1f(ao, 1.0);
        //set metallic
        const metallic = gl.getUniformLocation(program, 'metallic');
        gl.uniform1f(metallic, 0.15);
        //set roughness
        const roughness = gl.getUniformLocation(program, 'roughness');
        gl.uniform1f(roughness, 0.05);
        //map buffer
        this._pBuffer = pBuffer;
        this._iBuffer = iBuffer;
        this._nBuffer = nBuffer;
        this._tBuffer = tBuffer;
        this.a_position = a_position;
        this.a_normal = a_normal;
        this.a_texCoord = a_texCoord;
    }

    draw(gl, camera, light) {
        this._init(gl);
        gl.useProgram(program);
        gl.depthMask(true);
        gl.enable(gl.DEPTH_TEST);
        if (this._rotate) this.modelMatrix.rotateY(GLMatrix.toRadian(1));
        //light position
        const u_pointLight_position = gl.getUniformLocation(program,'u_pointLight.position');
        gl.uniform3fv(u_pointLight_position,light.position.value);
        const u_pointLight_color = gl.getUniformLocation(program,'u_pointLight.color');
        gl.uniform3fv(u_pointLight_color,light.color.value);
        //
        const u_cameraPosition = gl.getUniformLocation(program, 'u_cameraPosition');
        gl.uniform3fv(u_cameraPosition, camera.position.value);
        const u_projectionMatrix = gl.getUniformLocation(program, 'u_projectionMatrix');
        gl.uniformMatrix4fv(u_projectionMatrix, false, camera.projectionMatrix.value);
        const u_viewMatrix = gl.getUniformLocation(program, 'u_viewMatrix');
        gl.uniformMatrix4fv(u_viewMatrix, false, camera.viewMatrix.value);
        const u_modelMatrix = gl.getUniformLocation(program, 'u_modelMatrix');
        gl.uniformMatrix4fv(u_modelMatrix, false, this.modelMatrix.value);
        //vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, this._pBuffer);
        const a_position = this.a_position;
        gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_position);
        //indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._iBuffer);
        //normals
        gl.bindBuffer(gl.ARRAY_BUFFER, this._nBuffer);
        const a_normal = this.a_normal;
        gl.vertexAttribPointer(a_normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_normal);
        //texCoords
        gl.bindBuffer(gl.ARRAY_BUFFER, this._tBuffer);
        const a_texCoord = this.a_texCoord;
        gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_texCoord);
        //
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 36);
    }

}

module.exports = PBR;