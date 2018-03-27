const GLMatrix = require('kiwi.matrix').GLMatrix,
    Vec3 = require('kiwi.matrix').Vec3,
    Mat4 = require('kiwi.matrix').Mat4;
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
        this._rotate = opts.rotate||true;
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
            //图像数据
            this.image = opts.image;
        }
    }
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     * @param {*} program 
     */
    init(gl, program) {
        this._inited=true;
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
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indeices), gl.STATIC_DRAW);
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
        gl.activeTexture(gl.TEXTURE0);
        const texture1 = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture1);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,this.image);
        //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0]));
        gl.uniform1i(material_diffuse, 0);
        //texture_specular
        gl.activeTexture(gl.TEXTURE1);
        const texture2 = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture2);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,this.image);
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0]));
        gl.uniform1i(material_diffuse, 1);
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
    draw(gl, program) {
        if(!this._inited) this.init(gl,program);
        if(this._rotate) this.modelMatrix.rotateY(GLMatrix.toRadian(1));
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
        const u_modelMatrix = gl.getUniformLocation(program, 'u_modelMatrix');
        gl.uniformMatrix4fv(u_modelMatrix, false, this.modelMatrix.value);
        //----------------------------------------debug----------------------------------------------
        //1.创建帧缓冲
        // const frameBuffer = gl.createFramebuffer();
        // gl.bindFramebuffer(gl.FRAMEBUFFER,frameBuffer);
        //2.创建渲染缓冲
        // const renderBuffer = gl.createRenderbuffer();
        // gl.bindRenderbuffer(gl.RENDERBUFFER,renderBuffer);
        // gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_STENCIL,800,600);
        //2.1附加缓冲对象
        // gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_STENCIL_ATTACHMENT,gl.RENDERBUFFER,renderBuffer);
        //3.创建纹理
        // const texColorBuffer = gl.createTexture();
        // gl.bindTexture(gl.TEXTURE_2D,texColorBuffer);
        // gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,256,256,0,gl.RGB,gl.UNSIGNED_BYTE,null);
        // gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
        // gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
        // gl.bindTexture(gl.TEXTURE_2D,null);
        //3.1纹理附加到当前的帧缓冲
        // gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texColorBuffer,0);
        //5.在缓冲区中绘制图像
        gl.drawElements(gl.TRIANGLES,this.indices.length,gl.UNSIGNED_SHORT,0);
        //4.解绑帧缓冲
        // gl.bindFramebuffer(gl.FRAMEBUFFER,null);
        //5.使用缓冲的buffer绘制
        // gl.activeTexture(gl.TEXTURE0);
        // gl.bindTexture(gl.TEXTURE_2D, texColorBuffer);
        // gl.drawElements(gl.TRIANGLES,this.indices.length,gl.UNSIGNED_SHORT,0);
    }

    clone(){
        const model = new Model({
            vertices:this.vertices,
            normals:this.normals,
            indices:this.indices,
            textureCoords:this.textureCoords
        });
        return model;
    }

    translate(v){
        const v3 = new Vec3().set(v[0],v[1],v[2]);
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


