
const skybox_fragment = require('./../shader/skybox_fragment'),
    skybox_vertex = require('./../shader/skybox_vertex');

let program;

const images = ['right.jpg', 'left.jpg', 'top.jpg', 'bottom.jpg', 'front.jpg', 'back.jpg'];

const width = 2048, height = 2048;

const skyboxVertices = [
    -1.0, 1.0, -1.0,
    -1.0, -1.0, -1.0,
    1.0, -1.0, -1.0,
    1.0, -1.0, -1.0,
    1.0, 1.0, -1.0,
    -1.0, 1.0, -1.0,

    -1.0, -1.0, 1.0,
    -1.0, -1.0, -1.0,
    -1.0, 1.0, -1.0,
    -1.0, 1.0, -1.0,
    -1.0, 1.0, 1.0,
    -1.0, -1.0, 1.0,

    1.0, -1.0, -1.0,
    1.0, -1.0, 1.0,
    1.0, 1.0, 1.0,
    1.0, 1.0, 1.0,
    1.0, 1.0, -1.0,
    1.0, -1.0, -1.0,

    -1.0, -1.0, 1.0,
    -1.0, 1.0, 1.0,
    1.0, 1.0, 1.0,
    1.0, 1.0, 1.0,
    1.0, -1.0, 1.0,
    -1.0, -1.0, 1.0,

    -1.0, 1.0, -1.0,
    1.0, 1.0, -1.0,
    1.0, 1.0, 1.0,
    1.0, 1.0, 1.0,
    -1.0, 1.0, 1.0,
    -1.0, 1.0, -1.0,

    -1.0, -1.0, -1.0,
    -1.0, -1.0, 1.0,
    1.0, -1.0, -1.0,
    1.0, -1.0, -1.0,
    -1.0, -1.0, 1.0,
    1.0, -1.0, 1.0
];

class Skybox {

    constructor(dir) {
        this._skybox_dir = dir;
    }
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     */
    _init(gl) {
        if (program) return;
        //vertex shader
        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, skybox_vertex);
        gl.compileShader(vs);
        //fragment shader
        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, skybox_fragment);
        gl.compileShader(fs);
        //program
        program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        //vertices data
        this.pBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.pBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(skyboxVertices), gl.STATIC_DRAW);
        this.a_position = gl.getAttribLocation(program, 'a_position');
        gl.vertexAttribPointer(this.a_position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.a_position);
        //cube map texture
        this.cube_map_texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cube_map_texture);
        //right
        // gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0]));
        const right = new Image();
        right.src = this._skybox_dir + images[0];
        right.onload = function () {
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, right);
        };
        //left
        // gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0]));
        const left = new Image();
        left.src = this._skybox_dir + images[1];
        left.onload = function () {
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, left);
        };
        //top
        // gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0]));
        const top = new Image();
        top.src = this._skybox_dir + images[2];
        top.onload = function () {
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, top);
        };
        //bottom
        // gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0]));
        const bottom = new Image();
        bottom.src = this._skybox_dir + images[3];
        bottom.onload = function () {
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, bottom);
        };
        //front
        // gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0]));
        const front = new Image();
        front.src = this._skybox_dir + images[4];
        front.onload = function () {
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, front);
        };
        //back
        // gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0]));
        const back = new Image();
        back.src = this._skybox_dir + images[5];
        back.onload = function () {
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, back);
        };
        //
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    /**
     * 
     * @param {WebGLRenderingContext} gl 
     * @param {GLProgram} program 
     */
    draw(gl, camera) {
        this._init(gl);
        gl.useProgram(program);
        gl.depthMask(false);
        gl.enable(gl.DEPTH_TEST);
        gl.frontFace(gl.CW);
        //
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cube_map_texture);
        const skybox = gl.getUniformLocation(program,'skybox');
        gl.uniform1i(skybox,0);
        //vertices
        gl.vertexAttribPointer(this.a_position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.a_position);
        //camera
        const u_projectionMatrix = gl.getUniformLocation(program, 'u_projectionMatrix');
        gl.uniformMatrix4fv(u_projectionMatrix, false, camera.projectionMatrix.value);
        const u_viewMatrix = gl.getUniformLocation(program, 'u_viewMatrix');
        gl.uniformMatrix4fv(u_viewMatrix, false, camera.viewMatrix.value);
        //draw
        gl.drawArrays(gl.TRIANGLES, 0, 36);
    }

    get program() {
        return program;
    }

}

module.exports = Skybox;