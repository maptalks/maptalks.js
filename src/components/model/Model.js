const GLMatrix = require('kiwi.matrix').GLMatrix,
    Vec3 = require('kiwi.matrix').Vec3,
    Mat4 = require('kiwi.matrix').Mat4;

const standard_fragment = require('./../shader/standard_fragment'),
    standard_vertex = require('./../shader/standard_vertex');

let program;

/**
 * reference:
 * https://learnopengl-cn.github.io/03%20Model%20Loading/03%20Model/
 * https://github.com/xeolabs/xeogl/blob/master/src/geometry/boxGeometry.js
 * @author yellow date 2018/3/24
 * @class
 */
class Model {
    /**
     * @param {Object} opts
     * @param {String} [opts.src]
     * @param {String} [opts.vertices]
     * @param {String} [opts.indices]
     * @param {String} [opts.textureCoords]
     * @param {String} [opts.normals]
     * @param {String} [opts.modelMatrix]
     * @param {Boolean} [opts.rotate] true
     * @example
     * const model = new Model({
     *  src:'./assets/people.obj'
     * });
     * or
     * const model = new Model({
     *  vertices:[],
     *  indices:[],
     *  textureCoords:[],
     *  normals:[],
     *  modelMatrix:new Mat4()//optional,default is identity matrix
     * });
     */
    constructor(opts = {}) {
        /**
         * indicate inilized
         * @type {Boolean}
         */
        this._inited = false;
        /**
         * @type {Boolean}
         */
        this._rotate = opts.rotate || true;
        /**
         * 模型名
         */
        const filename = opts.src || opts.filename;
        //模型加载
        if (filename) {
            /**
             * @type {string} directory of model(.obj)
             */
            this._directory = filename.substr(0, filename.lastIndexOf('/'));
            /**
             * @type {string}
             */
            this._fileName = filename.substr(filename.lastIndexOf('/'), filename.lastIndexOf('.'));
            /**
             * load model
             */
            this._loadModel(filename);
        } else {
            this.vertices = opts.vertices;
            //顶点索引
            this.indices = opts.indices;
            //纹理(一般有三张，或者是一张的RGB三通道)
            this.textureCoords = opts.textureCoords;
            //法线
            this.normals = opts.normals;
            //模型矩阵是单位矩阵
            this.modelMatrix = opts.modelMatrix || new Mat4();
        }
    }
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     */
    _init(gl) {
        if (program) return;
        //vertex shader
        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, standard_vertex);
        gl.compileShader(vs);
        //fragment shader
        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, standard_fragment);
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
        //material
        const material_ambient = gl.getUniformLocation(program, 'material.ambient');
        const material_diffuse = gl.getUniformLocation(program, 'material.diffuse');
        const material_specular = gl.getUniformLocation(program, 'material.specular');
        const material_shininess = gl.getUniformLocation(program, 'material.shininess');
        gl.uniform3fv(material_ambient, [1.0, 0.5, 0.31]);
        gl.uniform1f(material_shininess, 32.0);
        //texture_diffuse
        // gl.activeTexture(gl.TEXTURE0);
        // const texture1 = gl.createTexture();
        // gl.bindTexture(gl.TEXTURE_2D, texture1);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 1, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, new Uint8Array([0]));
        // gl.uniform1i(material_diffuse, 0);
        //texture_specular
        // gl.activeTexture(gl.TEXTURE1);
        // const texture2 = gl.createTexture();
        // gl.bindTexture(gl.TEXTURE_2D, texture2);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 1, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, new Uint8Array([0]));
        // gl.uniform1i(material_specular, 1);
        //map buffer
        this._pBuffer = pBuffer;
        this._iBuffer = iBuffer;
        this._nBuffer = nBuffer;
        this._tBuffer = tBuffer;
        this.a_position = a_position;
        this.a_normal = a_normal;
        this.a_texCoord = a_texCoord;
    }
    /**
     * 提供draw方法，用来写入相关数据(bufferdata)
     * @param {WebGLRenderingContext} gl 
     * @param {GLProgram} program 
     */
    draw(gl, camera, light) {
        this._init(gl);
        gl.useProgram(program);
        gl.depthMask(true);
        gl.enable(gl.DEPTH_TEST);
        if (this._rotate) this.modelMatrix.rotateY(GLMatrix.toRadian(1));
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

    clone() {
        const model = new Model({
            vertices: this.vertices,
            normals: this.normals,
            indeices: this.indices,
            textureCoords: this.textureCoords
        });
        return model;
    }

    translate(v) {
        const v3 = new Vec3().set(v[0], v[1], v[2]);
        this.modelMatrix.translate(v3);
    }

    /**
     * load model
     * @param {string} src 
     */
    _loadModel(src) {
        const that = this;
        OBJ.downloadMeshes({ "single": src }, function (meshs) {
            //顶点
            that.vertices = meshs.single.vertices;
            //顶点索引
            that.indices = meshs.single.indices;
            //纹理(一般有三张，或者是一张的RGB三通道)
            that.textureCoords = meshs.single.textures;
            //法线
            that.normals = meshs.single.vertexNormals;
            //模型矩阵是单位矩阵
            that.modelMatrix = meshs.single.uv || new Mat4();
        });
    }
    /**
     * load material
     * @param {Array} materialNames 
     */
    _loadTexture(materialNames) {

    }



}

module.exports = Model;