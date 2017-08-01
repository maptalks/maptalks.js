/**
 * base camera class
 * reference https://webgl2fundamentals.org/webgl/lessons/webgl-3d-camera.html
 * @author yellow date 2017/6/12
 */
const glMatrix = require('kiwi.matrix').default;

/**
 * @class
 */
class Camera {
    /**
     * the camera position
     * @param {glMatrix.vec3} _position
     * @memberof Camera
     */
    _position;
    /**
     * the projection matrix,build of perspective
     * @param {glMarix.mat4} _projection
     * @memberof Camera
     */
    _projection;
    /**
     * the result matrix for camera
     * @param {glMarix.mat4} _view
     * @memberof Camera
     */
    _view;
    /**
     * 
     * @param {glMarix.mat4} _viewProjection
     * @memberof Camera
     */
    _viewProjection;
    /**
     * the projection invert matrix
     * @memberof Camera
     */
    _viewProjectionInvert;

    constructor() {

    };
}

export default Camera;