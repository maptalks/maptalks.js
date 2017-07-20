/**
 * an implement of PerspectiveCamera
 */
import Camera from './Camera';
import glMatrix from 'kiwi.matrix';

/**
 * @class
 */
class PerspectiveCamera extends Camera {
    /**
     * Vertical field of view in radians
     * @memberof PerspectiveCamera
     */
    _fovy;
    /**
     * aspect this w/h ratio
     * @memberof PerspectiveCamera
     */
    _aspect;
    /**
     * near
     * @memberof PerspectiveCamera
     */
    _near;
    /**
     * far
     * @memberof PerspectiveCamera
     */
    _far;
    /**
     * Creates an instance of PerspectiveCamera.
     * @param {number} fov Vertical field of view in degree
     * @param {number} aspect this w/h ratio
     * @param {number} near 
     * @param {number} far 
     * @memberof PerspectiveCamera
     */
    constructor(fov, aspect, near, far) {
        super();
        this._fovy = fov ? glMatrix.matrix.toRadian(fov) : glMatrix.matrix.toRadian(45);
        this._aspect = aspect || 1;
        this._near = near || 0.1;
        this._far = far || 2000;
        this._up = new glMatrix.vec3().set(0, 1, 0);
        this._target = new glMatrix.vec3().set(0, 0, -1);
        this._position = new glMatrix.vec3();
        this._view = new glMatrix.mat4();
        this._update();
    };
    /**
     * update the perspective matrix for gl.canvas changed
     * @memberof PerspectiveCamera
     */
    _updatePorjection() {
        this._projection = new glMatrix.mat4.perspective(this._fovy, this._aspect, this._near, this._far);
    };
    /**
     * update
     * 
     * 
     * @memberof PerspectiveCamera
     */
    _updateView() {
        this._view.lookAt(this._position, this._target, this._up);
    };

    _updateViewProjection() {
        this._viewProjection = this._view.clone().multiply(this._projection);
        this._viewProjectionInvert = this._viewProjection.invert();
    };
    /**
     * update all matrix
     * @memberof PerspectiveCamera
     */
    _update() {
        this._updatePorjection();
        this._updateView();
        this._updatePorjection();
    };
    /**
     * 
     * 
     * @param {number} rad 
     * 
     * @memberof PerspectiveCamera
     */
    rotateX(rad) {

    };
    /**
     * 
     * 
     * @param {any} y 
     * 
     * @memberof PerspectiveCamera
     */
    rotate(y) {

    };
    /**
     * 
     * 
     * @param {any} z 
     * 
     * @memberof PerspectiveCamera
     */
    rotate(z) {

    };
    /**
     * set the distance to origin
     * @memberof PerspectiveCamera
     */
    set z(z) {
        this._position.value[2] = z;
        this._updateView();
        this._updateViewProjection();
    };

    get viewProjection() {
        return this._viewProjection;
    };
}

export default PerspectiveCamera;