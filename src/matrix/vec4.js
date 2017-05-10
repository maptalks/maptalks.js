/**
 * reference https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/vec4.js
 * switch to es6 syntax
 * warning:if you don't want to change the source value,please use mat.clone().* instead of mat.*
 * @author yellow 2017.5.9
 */
import matrix from './mat';

/**
 * @class 4 Dimensional Vector
 * @name vec4
 */
export default class vec4 {
    /**
     * private vec4 array store
     */
    _out;
    /**
     *  Creates a new, empty vec4
     */
    constructor() {
        this._out = new glMatrix.ARRAY_TYPE(4);
        this._out[0] = 0;
        this._out[1] = 0;
        this._out[2] = 0;
        this._out[3] = 0;
        return this;
    };
    /**
     * Generates a random vector with the given scale
     * @param {number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
     */
    static random(scale = 1.0) {
        scale = scale || 1.0;
        let vec = new vec4();
        //TODO: This is a pretty awful way of doing this. Find something better.
        vec.set(matrix.RANDOM(), matrix.RANDOM(), matrix.RANDOM(), matrix.RANDOM()).normalize().scale();
        return vec;
    };
    /**
     * set the value of vec4
     */
    set(x, y, z, w) {
        this._out[0] = x;
        this._out[1] = y;
        this._out[2] = z;
        this._out[3] = w;
        return this;
    };
    /**
     * Creates a new vec4 initialized with values from an existing vector
     */
    clone() {
        let vec = new vec4();
        vec.set(this._out[0], this._out[1], this._out[2], this._out[3]);
        return vec;
    };
    /**
     * Adds two vec4's
     * @param {vec4} vec
     */
    add(vec) {
        this._out[0] += vec._out[0];
        this._out[1] += vec._out[1];
        this._out[2] += vec._out[2];
        this._out[3] += vec._out[3];
        return this;
    };
    /**
     * Subtracts vector vec from vector this
     */
    sub(vec) {
        this._out[0] -= vec._out[0];
        this._out[1] -= vec._out[1];
        this._out[2] -= vec._out[2];
        this._out[3] -= vec._out[3];
        return this;
    };
    /**
     * Multiplies two vec4's
     */
    multiply(vec) {
        this._out[0] *= vec._out[0];
        this._out[1] *= vec._out[1];
        this._out[2] *= vec._out[2];
        this._out[3] *= vec._out[3];
        return this;
    };
    /**
    * Divides two vec4's
    */
    divide(vec) {
        this._out[0] /= vec._out[0];
        this._out[1] /= vec._out[1];
        this._out[2] /= vec._out[2];
        this._out[3] /= vec._out[3];
        return this;
    };
    /**
     * Math.ceil the components of a vec4
     */
    ceil() {
        this._out[0] = Math.ceil(this._out[0]);
        this._out[1] = Math.ceil(this._out[1]);
        this._out[2] = Math.ceil(this._out[2]);
        this._out[3] = Math.ceil(this._out[3]);
        return this;
    };
    /**
     * Math.round the components of a vec4
     */
    round() {
        this._out[0] = Math.round(this._out[0]);
        this._out[1] = Math.round(this._out[1]);
        this._out[2] = Math.round(this._out[2]);
        this._out[3] = Math.round(this._out[3]);
        return this;
    };
    /**
    * Math.floor the components of a vec4
    */
    floor() {
        this._out[0] = Math.floor(this._out[0]);
        this._out[1] = Math.floor(this._out[1]);
        this._out[2] = Math.floor(this._out[2]);
        this._out[3] = Math.floor(this._out[3]);
        return this;
    };
    /**
     * Returns the minimum of two vec4's
     * @param {vec4} vec
     */
    min(vec) {
        this._out[0] = Math.min(this._out[0], vec._out[0]);
        this._out[1] = Math.min(this._out[1], vec._out[1]);
        this._out[2] = Math.min(this._out[2], vec._out[2]);
        this._out[3] = Math.min(this._out[3], vec._out[3]);
        return this;
    };
    /**
     * Returns the maximum of two vec4's
     * @param {vec4} vec
     */
    max(vec) {
        this._out[0] = Math.max(this._out[0], vec._out[0]);
        this._out[1] = Math.max(this._out[1], vec._out[1]);
        this._out[2] = Math.max(this._out[2], vec._out[2]);
        this._out[3] = Math.max(this._out[3], vec._out[3]);
        return this;
    };
    /**
     * Scales a vec4 by a scalar number
     * @param {number} s the scale
     */
    scale(s) {
        this._out[0] *= s;
        this._out[1] *= s;
        this._out[2] *= s;
        this._out[3] *= s;
        return this;
    };
    /**
     * Calculates the euclidian distance between two vec4's
     * @param {vec4} vec the distance to vec
     */
    distance(vec) {
        let [x0, y0, z0, w0] = this._out,
            [x1, y1, z1, w1] = vec._out,
            x = x0 - x1,
            y = y0 - y1,
            z = z0 - z1,
            w = w0 - w1;
        return Math.sqrt(x * x + y * y + z * z + w * w);
    };
    /**
     * Calculates the length of a vec4
     */
    len() {
        return this.distance(new vec4());
    };
    /**
     * Negates the components of a vec4
     */
    negate() {
        this._out[0] = -this._out[0];
        this._out[1] = -this._out[1];
        this._out[2] = -this._out[2];
        this._out[3] = -this._out[3];
        return this;
    };
    /**
     * Returns the inverse of the components of a vec4
     */
    inverse() {
        this._out[0] = 1.0 / this._out[0];
        this._out[1] = 1.0 / this._out[1];
        this._out[2] = 1.0 / this._out[2];
        this._out[3] = 1.0 / this._out[3];
    };
    /**
     * Normalize a vec4
     */
    normalize() {
        let len = this.len();
        if (len > 0) {
            len=1.0/len;
            this._out[0] *= len;
            this._out[1] *= len;
            this._out[2] *= len;
            this._out[3] *= len;
        }
        return this;
    };
    /**
     * @param {vec4} vec
     */
    dot(vec) {
        let [x0, y0, z0, w0] = this._out,
            [x1, y1, z1, w1] = vec._out;
        return x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1;
    };
    /**
     *  Performs a linear interpolation between two vec4's
     */
    lerp(vec, t) {
        let [ax, ay, az, aw] = this._out;
        this._out[0] = ax + t * (vec._out[0] - ax);
        this._out[1] = ay + t * (vec._out[1] - ay);
        this._out[2] = az + t * (vec._out[2] - az);
        this._out[3] = aw + t * (vec._out[3] - aw);
        return this;
    };
    /**
     * Transforms the vec4 with a mat4.
     * @param {mat4} mat matrix to transform with
     */
    transformMat4(mat) {
        let [x, y, z, w] = this._out;
        this._out[0] = mat._out[0] * x + mat._out[4] * y + mat._out[8] * z + mat._out[12] * w;
        this._out[1] = mat._out[1] * x + mat._out[5] * y + mat._out[9] * z + mat._out[13] * w;
        this._out[2] = mat._out[2] * x + mat._out[6] * y + mat._out[10] * z + mat._out[14] * w;
        this._out[3] = mat._out[3] * x + mat._out[7] * y + mat._out[11] * z + mat._out[15] * w;
        return this;
    };
    /**
     * Transforms the vec4 with a quat
     * @param {quat} q quaternion to transform with
     */
    transformQuat(q) {
        let [x, y, z, w] = this._out,
            [qx, qy, qz, qw] = q._out,
            ix = qw * x + qy * z - qz * y,
            iy = qw * y + qz * x - qx * z,
            iz = qw * z + qx * y - qy * x,
            iw = -qx * x - qy * y - qz * z;
        // calculate result * inverse quat
        this._out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
        this._out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
        this._out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
        this._out[3] = a[3];
        return this;
    };
    /**
     * Returns a string representation of a vector
     */
    toString() {
        return 'vec4(' + this._out[0] + ', ' + this._out[1] + ', ' + this._out[2] + ', ' + this._out[3] + ')';
    };
    /**
     * Returns whether or not the vectors have approximately the same elements in the same position.
     * @param {vec4} vec
     */
    equals(vec) {
        let [a0,a1,a2,a3]=this._out,
            [b0,b1,b2,b3]=vec._out;
        return (Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
            Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
            Math.abs(a2 - b2) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) &&
            Math.abs(a3 - b3) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)));
    };

};