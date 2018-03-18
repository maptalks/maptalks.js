/**
 * 矩阵计算
 */
const Mat4 = require('kiwi.matrix').Mat4,
    Vec3 = require('kiwi.matrix').Vec3,
    GLMatrix = require('kiwi.matrix').GLMatrix;

/**
 * @class
 */
class PerspectiveCameraP{
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
        //convert to radian
        this.fovy = GLMatrix.toRadian(fov);
        //create projection matrix
        this.projectionMatrix = Mat4.perspective(this.fovy,aspect,zNear,zFar);
        //camear matrix
        this.cameraMatrix = Mat4.fromYRotation(0);
        cameraMatrix.translate(new Vec3(0.0,500));
        //view matrix
        this.viewMatrix = this.cameraMatrix.clone().invert();
        //
    }

}