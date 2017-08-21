/**
 * base camera class
 * reference https://webgl2fundamentals.org/webgl/lessons/webgl-3d-camera.html
 * @author yellow date 2017/6/12
 */

/**
 * @class
 */
class Camera {

    constructor() {
        /**
         * the camera position
         * @param {glMatrix.vec3} _position
         * @memberof Camera
         */
        this._position;
        /**
         * the projection matrix,build of perspective
         * @param {glMarix.mat4} _projection
         * @memberof Camera
         */
        this._projection;
        /**
         * the result matrix for camera
         * @param {glMarix.mat4} _view
         * @memberof Camera
         */
        this._view;
        /**
         * 
         * @param {glMarix.mat4} _viewProjection
         * @memberof Camera
         */
        this._viewProjection;
        /**
         * the projection invert matrix
         * @memberof Camera
         */
        this._viewProjectionInvert;
    };
}

module.exports = Camera;