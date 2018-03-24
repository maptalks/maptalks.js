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
     * 
     * @param {string} src the .obj file path 
     */
    constructor(filename) {
        /**
         * @type {string} directory of model(.obj)
         */
        this._directory = filename.substr(0, filename.lastIndexOf('/'));
        /**
         * @type {string}
         */
        this._fileName = filename.substr(filename.lastIndexOf('/'),filename.lastIndexOf('.'));
        /**
         * load model
         */
        this._loadModel(filename);
    }
    /**
     * 
     * @param {GLShader} shader 
     */
    draw(shader) {

    }
    /**
     * load model
     * @param {string} src 
     */
    _loadModel(filename) {
        const that = this;
        OBJ.downloadMeshes({ "single": filename }, function (meshs) {
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
        for(let i=0,len=materialNames.length;i<len;i++){
            
        }
        //
    }

}

module.exports = Model;


