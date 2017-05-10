/**
 * reference https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/quat.js
 * switch to es6 syntax
 * warning:if you don't want to change the source value,please use mat.clone().* instead of mat.*
 * @author yellow 2017/5/10
 */

import matrix from './mat';
import mat3 from './mat3';
import vec3 from './vec3';
import vec4 from './vec4';

/**
 * @class Quaternion
 * @name quat
 */
class quat {
    _out;
    /**
     * Creates a new identity quat
     */
    constructor() {
        this._out = new matrix.ARRAY_TYPE(4);
        this._out[0] = 0;
        this._out[1] = 0;
        this._out[2] = 0;
        this._out[3] = 1;
    };
    /**
     * generic a quat from mat3
     * @param {mat3} mat the 3x3 matrix 
     */
    static fromMat3(mat) {
        // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
        // article "Quaternion Calculus and Fast Animation".
        let fTrace = mat._out[0] + mat._out[4] + mat._out[8],
            qua = new quat(),
            fRoot;
        if (fTrace > 0.0) {
            // |w| > 1/2, may as well choose w > 1/2
            fRoot = Math.sqrt(fTrace + 1.0);  // 2w
            out[3] = 0.5 * fRoot;
            fRoot = 0.5 / fRoot;  // 1/(4w)
            qua._out[0] = (mat._out[5] - mat._out[7]) * fRoot;
            qua._out[1] = (mat._out[6] - mat._out[2]) * fRoot;
            qua._out[2] = (mat._out[1] - mat._out[3]) * fRoot;
        } else {
            // |w| <= 1/2
            var i = 0;
            if (m[4] > m[0]) i = 1;
            if (m[8] > m[i * 3 + i]) i = 2;
            var j = (i + 1) % 3;
            var k = (i + 2) % 3;
            fRoot = Math.sqrt(mat._out[i * 3 + i] - mat._out[j * 3 + j] - mat._out[k * 3 + k] + 1.0);
            out[i] = 0.5 * fRoot;
            fRoot = 0.5 / fRoot;
            qua._out[3] = (mat._out[j * 3 + k] - mat._out[k * 3 + j]) * fRoot;
            qua._out[j] = (mat._out[j * 3 + i] + mat._out[i * 3 + j]) * fRoot;
            qua._out[k] = (mat._out[k * 3 + i] + mat._out[i * 3 + k]) * fRoot;
        }
        return this;
    };
    /**
     * set the value of quat
     */
    set(x, y, z, w) {
        this._out[0] = x;
        this._out[1] = y;
        this._out[2] = z;
        this._out[3] = w;
        return this;
    };
    /**
     * Creates a new quat initialized with values from an existing quaternion
     */
    clone() {
        let qua = new quat();
        qua.set(qua._out[0], qua._out[1], qua._out[2], qua._out[3]);
        return qua;
    };
    /**
     * Set a quat to the identity quaternion
     */
    identity() {
        this._out[0] = 0;
        this._out[1] = 0;
        this._out[2] = 0;
        this._out[3] = 1;
        return this;
    };
    /**
     * @param {vec3} vecI the initial vector
     * @param {vec3} vecII the destination vector
     * 
     */
    rotationTo = (() => {
        let tmpvec3 = new vec3(),
            xUnitVec3 = new vec3().set(1, 0, 0),
            yUnitVec3 = new vec3().set(0, 1, 0);
        return (vecI, vecII) => {
            let dot = vecI.dot(vecII);
            if (dot < -0.999999) {
                tmpvec3 = xUnitVec3.clone().cross(vecI);
                if (tmpvec3.len() < 0.000001) {
                    tmpvec3 = yUnitVec3.clone().cross(vecI);
                }
                tmpvec3.normalize();
                this.setAxisAngle(tmpvec3, Math.PI);
                return this;
            } else if (dot > 0.999999) {
                this._out[0] = 0;
                this._out[1] = 0;
                this._out[2] = 0;
                this._out[3] = 1;
                return this;
            } else {
                tmpvec3 = vecI.clone().cross(vecII);
                this._out[0] = tmpvec3[0];
                this._out[1] = tmpvec3[1];
                this._out[2] = tmpvec3[2];
                this._out[3] = 1 + dot;
                return this.normalize();
            }
        }
    })();
    /**
     * Sets the specified quaternion with values corresponding to the given
     * axes. Each axis is a vec3 and is expected to be unit length and
     * perpendicular to all other specified axes.
     * @param {vec3} vecView  the vector representing the viewing direction
     * @param {vec3} vecRight the vector representing the local "right" direction
     * @param {vec3} vecUp    the vector representing the local "up" direction
     */
    setAxes = (() => {
        var mat = new mat3();

        return (vecView, vecRight, vecUp) => {
            mat._out[0] = vecRight._out[0];
            mat._out[3] = vecRight._out[1];
            mat._out[6] = vecRight._out[2];
            mat._out[1] = vecUp._out[0];
            mat._out[4] = vecUp._out[1];
            mat._out[7] = vecUp._out[2];
            mat._out[2] = -vecView._out[0];
            mat._out[5] = -vecView._out[1];
            mat._out[8] = -vecView._out[2];
            return quat.fromMat3(mat);
        }

    })();
    /**
     * Sets a quat from the given angle and rotation axis,
     * then returns it.
     * @param {vec3} axis the axis around which to rotate
     * @param {number} rad
     */
    setAxisAngle(axis, rad) {
        rad = rad * 0.5;
        var s = Math.sin(rad);
        this._out[0] = s * axis._out[0];
        this._out[1] = s * axis._out[1];
        this._out[2] = s * axis._out[2];
        this._out[3] = Math.cos(rad);
        return this;
    };
    /**
     * Gets the rotation axis and angle for a given quaternion. 
     * If a quaternion is created with setAxisAngle, 
     * this method will return the same values as providied in the original parameter list OR functionally equivalent values.
     * @example The quaternion formed by axis [0, 0, 1] and angle -90 is the same as the quaternion formed by [0, 0, 1] and 270. 
     *          This method favors the latter.
     * @return [axis,angle]
     */
    getAxisAngle() {
        let rad = Math.acos(this._out[3]) * 2.0,
            s = Math.sin(rad / 2.0);
        let axis = new vec3();
        s === 0.0 ? axis.set(1, 0, 0) : axis.set(q[0] / s, q[1] / s, q[2] / s);
        return [axis, rad];
    };
    /**
     * add two quat's
     * @param {quat} qua 
     */
    add(qua) {
        this._out[0] += qua._out[0];
        this._out[1] += qua._out[1];
        this._out[2] += qua._out[2];
        this._out[3] += qua._out[3];
        return this;
    };
    /**
     * Multiplies two quat's
     */
    multiply(qua) {
        let [ax, ay, az, aw] = this._out,
            [bx, by, bz, bw] = qua._out;
        this._out[0] = ax * bw + aw * bx + ay * bz - az * by;
        this._out[1] = ay * bw + aw * by + az * bx - ax * bz;
        this._out[2] = az * bw + aw * bz + ax * by - ay * bx;
        this._out[3] = aw * bw - ax * bx - ay * by - az * bz;
        return this;
    };
    /**
     * @param {number} s
     */
    scale(s) {
        this._out[0] *= s;
        this._out[1] *= s;
        this._out[2] *= s;
        this._out[3] *= s;
        return this;
    };
    /**
     * Rotates a quaternion by the given angle about the X axis
     * @param {number} rad angle (in radians) to rotate
     */
    rotateX(rad) {
        rad *= 0.5;
        let [ax, ay, az, aw] = this._out,
            bx = Math.sin(rad),
            bw = Math.cos(rad);
        this._out[0] = ax * bw + aw * bx;
        this._out[1] = ay * bw + az * bx;
        this._out[2] = az * bw - ay * bx;
        this._out[3] = aw * bw - ax * bx;
        return this;
    };
    /**
     * Rotates a quaternion by the given angle about the Y axis
     * @param {number} rad angle (in radians) to rotate
     */
    rotateY(rad) {
        rad *= 0.5;
        let [ax, ay, az, aw] = this._out,
            by = Math.sin(rad),
            bw = Math.cos(rad);
        this._out[0] = ax * bw - az * by;
        this._out[1] = ay * bw + aw * by;
        this._out[2] = az * bw + ax * by;
        this._out[3] = aw * bw - ay * by;
        return this;
    };
    /**
     * Rotates a quaternion by the given angle about the Z axis
     * @param {number} rad angle (in radians) to rotate
     */
    rotateZ(rad) {
        rad *= 0.5;
        let [ax, ay, az, aw] = this._out,
            bz = Math.sin(rad),
            bw = Math.cos(rad);
        out[0] = ax * bw + ay * bz;
        this._out[1] = ay * bw - ax * bz;
        this._out[2] = az * bw + aw * bz;
        this._out[3] = aw * bw - az * bz;
        return this;
    };
    /**
     * Calculates the W component of a quat from the X, Y, and Z components.
     * Assumes that quaternion is 1 unit in length
     * Any existing W component will be ignored.
     */
    calculateW() {
        let [x, y, z, w] = this._out;
        this._out[3] = Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
        return this;
    };
    /**
     * Calculates the dot product of two quat's
     * @return {number} dot product of two quat's
     */
    dot(qua) {
        let [x0, y0, z0, w0] = this._out,
            [x1, y1, z1, w1] = qua._out;
        return x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1;
    };
    /**
     * Performs a linear interpolation between two quat's
     * @param {quat} qua the second operand
     * @param {Number} t interpolation amount between the two inputs
     */
    lerp(qua, t) {
        let [ax, ay, az, aw] = this._out;
        this._out[0] = ax + t * (qua._out[0] - ax);
        this._out[1] = ay + t * (qua._out[1] - ay);
        this._out[2] = az + t * (qua._out[2] - az);
        this._out[3] = aw + t * (qua._out[3] - aw);
        return this;
    };
    /**
     * Performs a spherical linear interpolation between two quat
     * benchmarks: http://jsperf.com/quaternion-slerp-implementations
     */
    slerp(qua, t) {
        let [ax, ay, az, aw] = this._out,
            [bx, by, bz, bw] = qua._out;
        let omega, cosom, sinom, scale0, scale1;
        // calc cosine
        cosom = ax * bx + ay * by + az * bz + aw * bw;
        // adjust signs (if necessary)
        if (cosom < 0.0) {
            cosom = -cosom;
            bx = - bx;
            by = - by;
            bz = - bz;
            bw = - bw;
        }
        // calculate coefficients
        if ((1.0 - cosom) > 0.000001) {
            // standard case (slerp)
            omega = Math.acos(cosom);
            sinom = Math.sin(omega);
            scale0 = Math.sin((1.0 - t) * omega) / sinom;
            scale1 = Math.sin(t * omega) / sinom;
        } else {
            // "from" and "to" quaternions are very close 
            //  ... so we can do a linear interpolation
            scale0 = 1.0 - t;
            scale1 = t;
        }
        // calculate final values
        this._out[0] = scale0 * ax + scale1 * bx;
        this._out[1] = scale0 * ay + scale1 * by;
        this._out[2] = scale0 * az + scale1 * bz;
        this._out[3] = scale0 * aw + scale1 * bw;
        return this;
    };
    /**
     * Performs a spherical linear interpolation with two control points
     * @param {quat} quaI
     * @param {quat} quaII
     * @param {quat} quaIII
     * @return
     */
    sqlerp = (() => {
        let temp1 = new quat(),
            temp2 = new quat();
        return (quaI, quaII, quaIII, t) => {
            //a.slerp(d,t)  b.slerp(c,t)
            temp1 = this.clone().slerp(quaIII, t);
            temp2 = quaI.clone().slerp(quaII, t);
            let qua = temp1.clone().slerp(temp2, 2 * t * (1 - t));
            return qua;
        }
    })();
    /**
     * Calculates the inverse of a quat
     * @return {quat} the inversed quat 
     */
    invert() {
        let [a0, a1, a2, a3] = this._out,
            dot = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3,
            invDot = dot ? 1.0 / dot : 0;
        this._out[0] = -a0 * invDot;
        this._out[1] = -a1 * invDot;
        this._out[2] = -a2 * invDot;
        this._out[3] = a3 * invDot;
        return this;
    };
    /**
     * Calculates the conjugate of a quat
     * If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
     */
    conjugate() {
        this._out[0] = -this._out[0];
        this._out[1] = -this._out[1];
        this._out[2] = -this._out[2];
        //this._out[3] = this._out[3]; omit to reduce assignment operation
        return this;
    };
    /**
     * retrun the length of quat
     * @return {number} 
     */
    len() {
        let [x, y, z, w] = this._out;
        return Math.sqrt(x * x + y * y + z * z + w * w);
    };
    /**
     * Normalize a quat
     */
    normalize() {
        let len = this.len();
        if (len > 0) {
            len = 1.0 / len;
            this._out[0] *= len;
            this._out[0] *= len;
            this._out[0] *= len;
            this._out[0] *= len;
        }
        return this;
    };
    /**
     * Returns a string representation of a quatenion
     * @returns {String} string representation of the vector
     */
    toString() {
        return 'quat(' + this._out[0] + ', ' + this._out[1] + ', ' + this._out[2] + ', ' + this._out[3] + ')';
    };
    /**
     * Returns whether or not the quat have approximately the same elements in the same position.
     * @param 
     */
    equals(qua) {
        let [a0, a1, a2, a3] = this._out,
            [b0, b1, b2, b3] = qua._out;
        return (Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
            Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
            Math.abs(a2 - b2) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) &&
            Math.abs(a3 - b3) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)));
    };
};
