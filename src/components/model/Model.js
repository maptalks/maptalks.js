const OBJ = require('webgl-obj-loader'),
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
     * 提供draw方法，用来写入相关数据(bufferdata)
     * @param {WebGLRenderingContext} gl 
     * @param {GLProgram} program 
     */
    prepareDarw(gl,program) {
        const vertices = this.vertices,
            normals = this.normals,
            indeices = this.indices,
            textureCoords = this.textureCoords;
        //vertices
        const pBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,pBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
        gl.bindBuffer(null);
        const a_position = gl.getAttribLocation(program,'a_position');
        gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);//在此设置顶点数据的读取方式,Stride,步长设置为0，让程序自动决定步长
        gl.enableVertexAttribArray(a_position); 
        //indeices
        const iBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,iBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Float32Array(indeices),gl.STATIC_DRAW);
        gl.bindBuffer(null);
        //normals
        const nBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(normals),gl.STATIC_DRAW);
        gl.bindBuffer(null);
        const a_normal = gl.getAttribLocation(program, 'a_normal');
        gl.vertexAttribPointer(a_normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_normal);
        //texture coords
        const tBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,tBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(textureCoords),gl.STATIC_DRAW);
        gl.bindBuffer(null);
        const a_texCoord = gl.getAttribLocation(program, 'a_texCoord');
        gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_texCoord);
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


