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
    scale(s){
        this._out[0]*=s;
        this._out[1]*=s;
        this._out[2]*=s;
        this._out[3]*=s;
        return this;
    };
    

};



/**
 * Rotates a quaternion by the given angle about the X axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
quat.rotateX = function (out, a, rad) {
    rad *= 0.5;

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw + aw * bx;
    out[1] = ay * bw + az * bx;
    out[2] = az * bw - ay * bx;
    out[3] = aw * bw - ax * bx;
    return out;
};

/**
 * Rotates a quaternion by the given angle about the Y axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
quat.rotateY = function (out, a, rad) {
    rad *= 0.5;

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        by = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw - az * by;
    out[1] = ay * bw + aw * by;
    out[2] = az * bw + ax * by;
    out[3] = aw * bw - ay * by;
    return out;
};

/**
 * Rotates a quaternion by the given angle about the Z axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
quat.rotateZ = function (out, a, rad) {
    rad *= 0.5;

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bz = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw + ay * bz;
    out[1] = ay * bw - ax * bz;
    out[2] = az * bw + aw * bz;
    out[3] = aw * bw - az * bz;
    return out;
};

/**
 * Calculates the W component of a quat from the X, Y, and Z components.
 * Assumes that quaternion is 1 unit in length.
 * Any existing W component will be ignored.
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate W component of
 * @returns {quat} out
 */
quat.calculateW = function (out, a) {
    var x = a[0], y = a[1], z = a[2];

    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
    return out;
};

/**
 * Calculates the dot product of two quat's
 *
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {Number} dot product of a and b
 * @function
 */
quat.dot = vec4.dot;

/**
 * Performs a linear interpolation between two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {quat} out
 * @function
 */
quat.lerp = vec4.lerp;

/**
 * Performs a spherical linear interpolation between two quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {quat} out
 */
quat.slerp = function (out, a, b, t) {
    // benchmarks:
    //    http://jsperf.com/quaternion-slerp-implementations

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = b[0], by = b[1], bz = b[2], bw = b[3];

    var omega, cosom, sinom, scale0, scale1;

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
    out[0] = scale0 * ax + scale1 * bx;
    out[1] = scale0 * ay + scale1 * by;
    out[2] = scale0 * az + scale1 * bz;
    out[3] = scale0 * aw + scale1 * bw;

    return out;
};

/**
 * Performs a spherical linear interpolation with two control points
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @param {quat} c the third operand
 * @param {quat} d the fourth operand
 * @param {Number} t interpolation amount
 * @returns {quat} out
 */
quat.sqlerp = (function () {
    var temp1 = quat.create();
    var temp2 = quat.create();

    return function (out, a, b, c, d, t) {
        quat.slerp(temp1, a, d, t);
        quat.slerp(temp2, b, c, t);
        quat.slerp(out, temp1, temp2, 2 * t * (1 - t));

        return out;
    };
}());

/**
 * Calculates the inverse of a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate inverse of
 * @returns {quat} out
 */
quat.invert = function (out, a) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        dot = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3,
        invDot = dot ? 1.0 / dot : 0;

    // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0

    out[0] = -a0 * invDot;
    out[1] = -a1 * invDot;
    out[2] = -a2 * invDot;
    out[3] = a3 * invDot;
    return out;
};

/**
 * Calculates the conjugate of a quat
 * If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate conjugate of
 * @returns {quat} out
 */
quat.conjugate = function (out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = a[3];
    return out;
};

/**
 * Calculates the length of a quat
 *
 * @param {quat} a vector to calculate length of
 * @returns {Number} length of a
 * @function
 */
quat.length = vec4.length;

/**
 * Alias for {@link quat.length}
 * @function
 */
quat.len = quat.length;

/**
 * Calculates the squared length of a quat
 *
 * @param {quat} a vector to calculate squared length of
 * @returns {Number} squared length of a
 * @function
 */
quat.squaredLength = vec4.squaredLength;

/**
 * Alias for {@link quat.squaredLength}
 * @function
 */
quat.sqrLen = quat.squaredLength;

/**
 * Normalize a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quaternion to normalize
 * @returns {quat} out
 * @function
 */
quat.normalize = vec4.normalize;

/**
 * Creates a quaternion from the given 3x3 rotation matrix.
 *
 * NOTE: The resultant quaternion is not normalized, so you should be sure
 * to renormalize the quaternion yourself where necessary.
 *
 * @param {quat} out the receiving quaternion
 * @param {mat3} m rotation matrix
 * @returns {quat} out
 * @function
 */
quat.fromMat3 = function (out, m) {
    // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
    // article "Quaternion Calculus and Fast Animation".
    var fTrace = m[0] + m[4] + m[8];
    var fRoot;

    if (fTrace > 0.0) {
        // |w| > 1/2, may as well choose w > 1/2
        fRoot = Math.sqrt(fTrace + 1.0);  // 2w
        out[3] = 0.5 * fRoot;
        fRoot = 0.5 / fRoot;  // 1/(4w)
        out[0] = (m[5] - m[7]) * fRoot;
        out[1] = (m[6] - m[2]) * fRoot;
        out[2] = (m[1] - m[3]) * fRoot;
    } else {
        // |w| <= 1/2
        var i = 0;
        if (m[4] > m[0])
            i = 1;
        if (m[8] > m[i * 3 + i])
            i = 2;
        var j = (i + 1) % 3;
        var k = (i + 2) % 3;

        fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1.0);
        out[i] = 0.5 * fRoot;
        fRoot = 0.5 / fRoot;
        out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
        out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
        out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
    }

    return out;
};

/**
 * Returns a string representation of a quatenion
 *
 * @param {quat} a vector to represent as a string
 * @returns {String} string representation of the vector
 */
quat.str = function (a) {
    return 'quat(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

/**
 * Returns whether or not the quaternions have exactly the same elements in the same position (when compared with ===)
 *
 * @param {quat} a The first quaternion.
 * @param {quat} b The second quaternion.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
quat.exactEquals = vec4.exactEquals;

/**
 * Returns whether or not the quaternions have approximately the same elements in the same position.
 *
 * @param {quat} a The first vector.
 * @param {quat} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
quat.equals = vec4.equals;