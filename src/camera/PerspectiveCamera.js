/**
 * 矩阵计算
 */
const Mat4 = require('kiwi.matrix').Mat4,
    Vec3 = require('kiwi.matrix').Vec3,
    Vec4 = require('kiwi.matrix').Vec4,
    GLMatrix = require('kiwi.matrix').GLMatrix;
/**
 * 
 * https://learnopengl-cn.github.io/01%20Getting%20started/09%20Camera/
 * 透视相机
 * 构建相机的本质：
 * 1.构建一个以相机位置为原点，与真实原点贯穿的三个轴为方向的坐标系
 * 2.
 * @class
 */
class PerspectiveCamera{
    /**
     * @example
     * var camera = new PerspectiveCameraP(45,800/600,1,2000);
     * 
     * @param {number} vertical of view in angle
     * @param {*} aspect 
     * @param {*} zNear 
     * @param {*} zFar 
     */
    constructor(fov,aspect,zNear,zFar){
        /**
         * 默认相机位置
         */
        this._position = new Vec3().set(0,0,0);
        /**
         * 透视矩阵，用于将空间的物体投影在锥形的区域内
         * http://www.cnblogs.com/yjmyzz/archive/2010/05/08/1730697.html
         * 核心：scale = f1/(f1+z)
         * 通过比例，将znear与zfar之间的元素投影在znear上，得到屏幕像素(x,y)
         */
        this.projectionMatrix = Mat4.perspective(GLMatrix.toRadian(fov),aspect,zNear,zFar);
        /**
         * 计算viewMatrix
         */
        this._update();
    }       
    /*
     * 计算相机矩阵
     */
    _update(){
        /**
         * 相机矩阵，这个矩阵代表的是相机在世界坐标中的位置和姿态。 
         * https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-3d-camera.html
         */
        const cameraMatrix = new Mat4().translate(this._position);
        /**
         * 视图矩阵是将所有物体以相反于相机的方向运动
         */
        const viewMatrix = cameraMatrix.clone().invert();
        /**
         * 将视图矩阵和投影矩阵结合在一起
         */
        this.viewProjectionMatrix = this.projectionMatrix.clone().multiply(viewMatrix);
    }
    /**
     * 更新相机位置，重新计算viewPorjection
     * @type {Array} [0,0,400]
     */
    set position(v){
        this._position.set(v[0],v[1],v[2]);
        this._update();
    }



}

module.exports = PerspectiveCamera;