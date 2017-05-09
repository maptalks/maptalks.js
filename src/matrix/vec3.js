/**
 * reference https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/vec3.js
 * switch to es6 syntax
 * @author yellow 2017/5/8
 * 
 */
import matrix from './mat';

/**
 * @class 3 Dimensional Vector
 * @name vec3
 */
export default class vec3 {

    _out;
    /**
     * Creates a new, empty vec3
     */
    constructor() {
        this._out = new matrix.ARRAY_TYPE(3);
        this._out[0] = 0;
        this._out[1] = 0;
        this._out[2] = 0;
        return this;
    };
    /**
     * Generates a random vector with the given scale
     * @param {number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
     */
    static random(scale = 1.0) {
        let vec = new vec3();
        scale = scale || 1.0;
        var r = matrix.RANDOM() * 2.0 * Math.PI;
        var z = (matrix.RANDOM() * 2.0) - 1.0;
        var z = Math.sqrt(1.0 - z * z) * scale;
        ax = Math.cos(r) * zScale;
        ay = Math.sin(r) * zScale;
        az = z * scale;
        vec.set(ax, ay, az);
        return vec;
    };

    /**
     * set value of v0 v1 v2
     */
    set(x, y, z) {
        this._out[0] = x;
        this._out[1] = y;
        this._out[2] = z;
        return this;
    };
    /**
     * Creates a new vec3 initialized with values from an existing vector
     */
    clone() {
        let vec = new vec3();
        vec.set(this._out[0], this._out[1], this._out[2]);
        return vec;
    };
    /**
     * Adds two vec3's
     * @param {vec3} vec 
     */
    add(vec) {
        this._out[0] += vec._out[0];
        this._out[1] += vec._out[1];
        this._out[2] += vec._out[2];
        return this;
    };
    /**
     * Subtracts vector vec from vector this
     * @param {vec3} vec
     */
    sub(vec) {
        this._out[0] -= vec._out[0];
        this._out[1] -= vec._out[1];
        this._out[2] -= vec._out[2];
        return this;
    };
    /**
     * Multiplies two vec3's
     */
    multiply(vec) {
        this._out[0] *= vec._out[0];
        this._out[1] *= vec._out[1];
        this._out[2] *= vec._out[2];
        return this;
    };
    /**
     * Divides two vec3's
     */
    divide(vec) {
        this._out[0] /= vec._out[0];
        this._out[1] /= vec._out[1];
        this._out[2] /= vec._out[2];
        return this;
    };
    /**
     * Math.ceil the components of a vec3
     */
    ceil() {
        this._out[0] = Math.ceil(this._out[0]);
        this._out[1] = Math.ceil(this._out[1]);
        this._out[2] = Math.ceil(this._out[2]);
        return this;
    };
    /**
     * Math.floor the components of a vec3
     */
    floor() {
        this._out[0] = Math.floor(this._out[0]);
        this._out[1] = Math.floor(this._out[1]);
        this._out[2] = Math.floor(this._out[2]);
        return this;
    };
    /**
     * Math.round the components of a vec3
     */
    round() {
        this._out[0] = Math.round(this._out[0]);
        this._out[1] = Math.round(this._out[1]);
        this._out[2] = Math.round(this._out[2]);
        return this;
    };
    /**
     * Returns the minimum of two vec3's
     */
    min(vec) {
        this._out[0] = Math.min(this._out[0], vec._out[0]);
        this._out[1] = Math.min(this._out[1], vec._out[1]);
        this._out[2] = Math.min(this._out[2], vec._out[2]);
        return this;
    };
    /**
     * Returns the maximum of two vec3's
     */
    max(vec) {
        this._out[0] = Math.max(this._out[0], vec._out[0]);
        this._out[1] = Math.max(this._out[1], vec._out[1]);
        this._out[2] = Math.max(this._out[2], vec._out[2]);
        return this;
    };
    /**
     * Scales a vec3 by a scalar number
     * @param {number} v amount to scale the vector by
     */
    scale(v) {
        this._out[0] *= v;
        this._out[1] *= v;
        this._out[2] *= v;
        return this;
    };
    /**
     * Calculates the euclidian distance between two vec3's
     * @param {vec3} vec
     */
    distance(vec) {
        let [x0, y0, z0] = this._out,
            [x1, y1, z1] = vec._out,
            x = x0 - x1,
            y = y0 - y1,
            z = z0 - z1;
        return Math.sqrt(x * x + y * y + z * z);
    };
    /**
     * Calculates the length of a vec3
     */
    len() {
        return distance(new vec3());
    };
    /**
     * Negates the components of a vec3
     */
    negate() {
        this._out[0] = -this._out[0];
        this._out[1] = -this._out[1];
        this._out[2] = -this._out[2];
        return this;
    };
    /**
     * Returns the inverse of the components of a vec3
     */
    inverse() {
        this._out[0] = 1.0 / this._out[0];
        this._out[1] = 1.0 / this._out[1];
        this._out[2] = 1.0 / this._out[2];
        return this;
    };
    /**
     * Normalize a vec3
     */
    normalize() {
        let len = this.len();
        if (len > 0) {
            this._out[0] /= len;
            this._out[1] /= len;
            this._out[2] /= len;
        }
        return this;
    };
    /**
     * Calculates the dot product of two vec3's
     * @param {vec3} vec
     */
    dot(vec) {
        let [x0, y0, z0] = this._out,
            [x1, y1, z1] = vec._out;
        return x0 * x1 + y0 * y1 + z0 * z1;
    };
    /**
     * Computes the cross product of two vec3's
     */
    cross(vec) {
        let [ax, ay, az] = this._out,
            [bx, by, bz] = vec._out;
        this._out[0] = ay * bz - az * by;
        this._out[1] = az * bx - ax * bz;
        this._out[2] = ax * by - ay * bx;
        return this;
    };
    /**
     * Performs a linear interpolation between two vec3's
     * @param {vec3} vec
     * @param {number} t
     */
    lerp(vec, t) {
        let [ax, ay, az] = this._out,
            [bx, by, bz] = vec._out;
        this._out[0] = ax + t * (bx - ax);
        this._out[1] = ay + t * (by - ay);
        this._out[2] = az + t * (bz - az);
        return this;
    };
    /**
     * Performs a hermite interpolation with two control points
     * @param {vec3} vecI
     * @param {vec3} vecI
     * @param {vec3} vecI
     * @param {number} t interpolation amount between the two inputs
     */
    hermite(vecI, vecII, vecIII, t) {
        let factorTimes2 = t * t,
            factor1 = factorTimes2 * (2 * t - 3) + 1,
            factor2 = factorTimes2 * (t - 2) + t,
            factor3 = factorTimes2 * (t - 1),
            factor4 = factorTimes2 * (3 - 2 * t);

        this._out[0] = this._out[0] * factor1 + vecI._out[0] * factor2 + vecII._out[0] * factor3 + vecIII._out[0] * factor4;
        this._out[1] = this._out[1] * factor1 + vecI._out[1] * factor2 + vecII._out[1] * factor3 + vecIII._out[1] * factor4;
        this._out[2] = this._out[2] * factor1 + vecI._out[2] * factor2 + vecII._out[2] * factor3 + vecIII._out[2] * factor4;
        return this;
    };
    /**
     * Performs a bezier interpolation with two control points
     * @param {vec3} vecI
     * @param {vec3} vecII
     * @param {vec3} vecIII
     * @param {Number} t interpolation amount between the two inputs
     */
    bezier(vecI, vecII, vecIII, t) {
        var inverseFactor = 1 - t,
            inverseFactorTimesTwo = inverseFactor * inverseFactor,
            factorTimes2 = t * t,
            factor1 = inverseFactorTimesTwo * inverseFactor,
            factor2 = 3 * t * inverseFactorTimesTwo,
            factor3 = 3 * factorTimes2 * inverseFactor,
            factor4 = factorTimes2 * t;
        out[0] = this._out[0] * factor1 + vecI._out[0] * factor2 + vecII._out[0] * factor3 + vecIII._out[0] * factor4;
        out[1] = this._out[1] * factor1 + vecI._out[1] * factor2 + vecII._out[1] * factor3 + vecIII._out[1] * factor4;
        out[2] = this._out[2] * factor1 + vecI._out[2] * factor2 + vecII._out[2] * factor3 + vecIII._out[2] * factor4;
        return this
    };
    /**
     * Transforms the vec3 with a mat4.
     * 4th vector component is implicitly '1'
     * @param {mat4} mat the 4x4 matrix to transform with
     */
    transformMat4(mat) {
        let [x, y, z] = this._out,
            w = (mat._out[3] * x + mat._out[7] * y + mat._out[11] * z + mat._out[15]) || 1.0;
        this._out[0] = (mat._out[0] * x + mat._out[4] * y + mat._out[8] * z + mat._out[12]) / w;
        this._out[1] = (mat._out[1] * x + mat._out[5] * y + mat._out[9] * z + mat._out[13]) / w;
        this._out[2] = (mat._out[2] * x + mat._out[6] * y + mat._out[10] * z + mat._out[14]) / w;
        return this;
    };
    /**
     * Transforms the vec3 with a mat3.
     * @param {mat3} mat  the 3x3 matrix to transform with
     */
    transformMat3(mat) {
        let [x, y, z] = this._out;
        this._out[0] = x * mat._out[0] + y * mat._out[3] + z * mat._out[6];
        this._out[1] = x * mat._out[1] + y * mat._out[4] + z * mat._out[7];
        this._out[2] = x * mat._out[2] + y * mat._out[5] + z * mat._out[8];
        return this;
    };
    /**
     * returns a string represent vec3
     */
    toString() {
        return 'vec3(' + this._out[0] + ', ' + this._out[1] + ', ' + this._out[2] + ')';
    };
    /**
     * ransforms the vec3 with a quat
     * benchmarks: http://jsperf.com/quaternion-transform-vec3-implementations
     * @param {quat} q quaternion to transform with
     */
    transformQuat(q) {
        let [x, y, z] = this._out,
            [qx, qy, qz, qw] = q._out,
            // calculate quat * vec
            ix = qw * x + qy * z - qz * y,
            iy = qw * y + qz * x - qx * z,
            iz = qw * z + qx * y - qy * x,
            iw = -qx * x - qy * y - qz * z;
        this._out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
        this._out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
        this._out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
        return this;
    };
    /**
     * Rotate a 3D vector around the x-axis
     * @param {vec3} vec the origin of the rotation
     * @param {number} c the angle of rotation
     */
    rotateX(vec, c) {
        var p = [], r = [];
        //Translate point to the origin
        p[0] = this._out[0] - vec._out[0];
        p[1] = this._out[1] - vec._out[1];
        p[2] = this._out[2] - vec._out[2];
        //perform rotation
        r[0] = p[0];
        r[1] = p[1] * Math.cos(c) - p[2] * Math.sin(c);
        r[2] = p[1] * Math.sin(c) + p[2] * Math.cos(c);
        //translate to correct position
        this._out[0] = r[0] + b[0];
        this._out[1] = r[1] + b[1];
        this._out[2] = r[2] + b[2];
        return this;
    };
    /**
     * Rotate a 3D vector around the y-axis
     * @param {vec3} vec The origin of the rotation
     * @param {number} c The angle of rotation
     */
    rotateY(vec, c) {
        var p = [], r = [];
        //Translate point to the origin
        p[0] = this._out[0] - vec._out[0];
        p[1] = this._out[1] - vec._out[1];
        p[2] = this._out[2] - vec._out[2];
        //perform rotation
        r[0] = p[2] * Math.sin(c) + p[0] * Math.cos(c);
        r[1] = p[1];
        r[2] = p[2] * Math.cos(c) - p[0] * Math.sin(c);
        //translate to correct position
        this._out[0] = r[0] + b[0];
        this._out[1] = r[1] + b[1];
        this._out[2] = r[2] + b[2];
        return this;
    };
    /**
     * Rotate a 3D vector around the z-axis
     * @param {vec3} vec The origin of the rotation
     * @param {number} c the angle of rotation
     */
    rotateZ(vec, c) {
        var p = [], r = [];
        //Translate point to the origin
        p[0] = this._out[0] - vec._out[0];
        p[1] = this._out[1] - vec._out[1];
        p[2] = this._out[2] - vec._out[2];
        //perform rotation
        r[0] = p[0] * Math.cos(c) - p[1] * Math.sin(c);
        r[1] = p[0] * Math.sin(c) + p[1] * Math.cos(c);
        r[2] = p[2];
        //translate to correct position
        this._out[0] = r[0] + b[0];
        this._out[1] = r[1] + b[1];
        this._out[2] = r[2] + b[2];
        return this;
    };
    /**
     * calcute the angle between two 3D vectors
     * @param {vec3} vec the second vector
     */
    angle(vec) {
        let vecI = this.clone().normalize(),
            vecII = vec.clone().normalize();
        var cosine = vec3.dot(vecI, vecII);
        if (cosine > 1.0)
            return 0;
        else if (cosine < -1.0)
            return Math.PI;
        else
            return Math.acos(cosine);
    };
    /**
     * Returns whether or not the vectors have approximately the same elements in the same position.
     */
    equals(vec) {
        let [a0, a1, a2] = this._out,
            [b0, b1, b2] = vec._out;
        return (Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
            Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
            Math.abs(a2 - b2) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)));
    };
}