/**
 * reference https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/mat3.js
 * switch to es6 syntax,and change to quote
 * warning:if you don't want to change the source value,please use mat.clone().* instead of mat.*
 * @author yellow 2017/5/8
 */

import matrix from './mat';

/**
 * @class 3x3 Matrix
 * @name mat3
 */
export default class mat3 {
    /**
     * an array to store the 3*3 matrix data
     * [1,0,0]
     * [0,1,0]
     * [0,0,1]
     * @private 
     */
    _out;

    /**
     * Creates a new identity mat3
     */
    constructor() {
        _out = new matrix.ARRAY_TYPE(9);
        _out[0] = 1;
        _out[1] = 0;
        _out[2] = 0;
        _out[3] = 0;
        _out[4] = 1;
        _out[5] = 0;
        _out[6] = 0;
        _out[7] = 0;
        _out[8] = 1;
        return this;
    };
    /**
     * set matrix value
     */
    set(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
        _out[0] = m00;
        _out[1] = m01;
        _out[2] = m02;
        _out[3] = m10;
        _out[4] = m11;
        _out[5] = m12;
        _out[6] = m20;
        _out[7] = m21;
        _out[8] = m22;
        return this;
    };
    /**
     * clone the mat3 matrix
     * @return {mat3}
     */
    clone() {
        let mat = new mat3().set(this._out[0], this._out[1], this._out[2],
            this._out[3], this._out[4], this._out[5],
            this._out[6], this._out[7], this._out[8]);
        return mat;
    };
    /**
     *  Copies the upper-left 3x3 values into the given mat3.
     *  construct from mat4
     *  @method fromMat4
     *  @return {mat3}
     */
    fromMat4(mat) {
        this.set(mat._out[0], mat._out[1], mat._out[2],
            mat._out[4], mat._out[5], mat._out[6],
            mat._out[8], mat._out[9], mat._out[10]
        )
        return this;
    };
    /**
    * Set a mat3 to the identity matrix
    * @method identity
    * @param {mat3} out the receiving matrix
    * @returns {mat3} out
    */
    identity = function () {
        _out[0] = 1;
        _out[1] = 0;
        _out[2] = 0;
        _out[3] = 0;
        _out[4] = 1;
        _out[5] = 0;
        _out[6] = 0;
        _out[7] = 0;
        _out[8] = 1;
        return this;
    };
    /**
     * Transpose the values of a mat3
     * @method transpose
     */
    transpose = function () {
        //temporary array
        var a = new matrix.ARRAY_TYPE(9);
        [this._out[0],this._out[1],this._out[2],
         this._out[3],this._out[4],this._out[5],
         this._out[6],this._out[7],this._out[8]
        ]
        =
        [this._out[0],this._out[3],this._out[6],
         this._out[1],this._out[4],this._out[7],
         this._out[2],this._out[5],this._out[8]
        ];
        return this;
    };
    /**
     * Inverts a mat3
     * @method invert
     */
    invert() {

        let [a00, a01, a02, a10, a11, a12, a20, a21, a22] = this._out;
        let b01 = a22 * a11 - a12 * a21,
            b11 = -a22 * a10 + a12 * a20,
            b21 = a21 * a10 - a11 * a20,
            det = a00 * b01 + a01 * b11 + a02 * b21;
        if (!det) return null;
        det = 1.0 / det;

        this._out[0] = b01 * det;
        this._out[1] = (-a22 * a01 + a02 * a21) * det;
        this._out[2] = (a12 * a01 - a02 * a11) * det;
        this._out[3] = b11 * det;
        this._out[4] = (a22 * a00 - a02 * a20) * det;
        this._out[5] = (-a12 * a00 + a02 * a10) * det;
        this._out[6] = b21 * det;
        this._out[7] = (-a21 * a00 + a01 * a20) * det;
        this._out[8] = (a11 * a00 - a01 * a10) * det;
        return this;
    };
    /**
     * Calculates the adjugate of a mat3
     * 
     */
    adjoint() {
        let [a00, a01, a02, a10, a11, a12, a20, a21, a22] = this._out;
        this._out[0] = (a11 * a22 - a12 * a21);
        this._out[1] = (a02 * a21 - a01 * a22);
        this._out[2] = (a01 * a12 - a02 * a11);
        this._out[3] = (a12 * a20 - a10 * a22);
        this._out[4] = (a00 * a22 - a02 * a20);
        this._out[5] = (a02 * a10 - a00 * a12);
        this._out[6] = (a10 * a21 - a11 * a20);
        this._out[7] = (a01 * a20 - a00 * a21);
        this._out[8] = (a00 * a11 - a01 * a10);
        return this;
    };
    /**
     * Calculates the determinant of a mat3
     */
    determinant() {
        let [a00, a01, a02, a10, a11, a12, a20, a21, a22] = this._out;
        return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
    };
    /**
     * Multiplies other mat3
     * @param {mat3} mat a matrix 3*3 wait to multiply
     */
    multiply(mat) {
        let [a00, a01, a02, a10, a11, a12, a20, a21, a22] = this._out;
        let [b00, b01, b02, b10, b11, b12, b20, b21, b22] = mat._out;
        this._out[0] = b00 * a00 + b01 * a10 + b02 * a20;
        this._out[1] = b00 * a01 + b01 * a11 + b02 * a21;
        this._out[2] = b00 * a02 + b01 * a12 + b02 * a22;

        this._out[3] = b10 * a00 + b11 * a10 + b12 * a20;
        this._out[4] = b10 * a01 + b11 * a11 + b12 * a21;
        this._out[5] = b10 * a02 + b11 * a12 + b12 * a22;

        this._out[6] = b20 * a00 + b21 * a10 + b22 * a20;
        this._out[7] = b20 * a01 + b21 * a11 + b22 * a21;
        this._out[8] = b20 * a02 + b21 * a12 + b22 * a22;
    };
    /**
     * Translate a mat3 by the given vector
     * @param {vec2} vec vetor to translate by
     * @return {mat3} 
     */
    translate(vec) {
        let [a00, a01, a02, a10, a11, a12, a20, a21, a22] = this._out;
        let [x, y] = vec._out;
        out[0] = a00;
        this._out[1] = a01;
        this._out[2] = a02;
        this._out[3] = a10;
        this._out[4] = a11;
        this._out[5] = a12;
        this._out[6] = x * a00 + y * a10 + a20;
        this._out[7] = x * a01 + y * a11 + a21;
        this._out[8] = x * a02 + y * a12 + a22;
        return this;
    };
    /**
     * Rotates a mat3 by the given angle
     * @param {Number} rad the angle to rotate the matrix by
     */
    rotate(rad) {
        let [a00, a01, a02, a10, a11, a12, a20, a21, a22] = this._out;
        let s = Math.sin(rad),
            c = Math.cos(rad);
        this._out[0] = c * a00 + s * a10;
        this._out[1] = c * a01 + s * a11;
        this._out[2] = c * a02 + s * a12;
        this._out[3] = c * a10 - s * a00;
        this._out[4] = c * a11 - s * a01;
        this._out[5] = c * a12 - s * a02;
        this._out[6] = a20;
        this._out[7] = a21;
        this._out[8] = a22;
        return this;
    };
    /**
     * Scales the mat3 by the dimensions in the given vec2
     * @param {vec2} v the vec2 to scale the matrix by
     */
    scale(vec) {
        let [x,y]=vec._out;
        this._out[0] = x *this._outa[0];
        this._out[1] = x * this._out[1];
        this._out[2] = x * this._out[2];
        this._out[3] = y * this._out[3];
        this._out[4] = y * this._out[4];
        this._out[5] = y * this._out[5];
        // this._out[6] = this._out[6];
        // this._out[7] = this._out[7];
        // this._out[8] = this._out[8];
        return this;
    };
    /**
     * Calculates a 3x3 matrix from the given quaternion
     */
    fromQuat(q){

    }

}











/**
* Calculates a 3x3 matrix from the given quaternion
*
* @param {mat3} out mat3 receiving operation result
* @param {quat} q Quaternion to create matrix from
*
* @returns {mat3} out
*/
mat3.fromQuat = function (out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        yx = y * x2,
        yy = y * y2,
        zx = z * x2,
        zy = z * y2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - yy - zz;
    out[3] = yx - wz;
    out[6] = zx + wy;

    out[1] = yx + wz;
    out[4] = 1 - xx - zz;
    out[7] = zy - wx;

    out[2] = zx - wy;
    out[5] = zy + wx;
    out[8] = 1 - xx - yy;

    return out;
};

/**
* Calculates a 3x3 normal matrix (transpose inverse) from the 4x4 matrix
*
* @param {mat3} out mat3 receiving operation result
* @param {mat4} a Mat4 to derive the normal matrix from
*
* @returns {mat3} out
*/
mat3.normalFromMat4 = function (out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) {
        return null;
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;

    out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;

    out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;

    return out;
};

/**
 * Returns a string representation of a mat3
 *
 * @param {mat3} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat3.str = function (a) {
    return 'mat3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' +
        a[3] + ', ' + a[4] + ', ' + a[5] + ', ' +
        a[6] + ', ' + a[7] + ', ' + a[8] + ')';
};

/**
 * Returns Frobenius norm of a mat3
 *
 * @param {mat3} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
mat3.frob = function (a) {
    return (Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + Math.pow(a[6], 2) + Math.pow(a[7], 2) + Math.pow(a[8], 2)))
};

/**
 * Adds two mat3's
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the first operand
 * @param {mat3} b the second operand
 * @returns {mat3} out
 */
mat3.add = function (out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    out[4] = a[4] + b[4];
    out[5] = a[5] + b[5];
    out[6] = a[6] + b[6];
    out[7] = a[7] + b[7];
    out[8] = a[8] + b[8];
    return out;
};

/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the first operand
 * @param {mat3} b the second operand
 * @returns {mat3} out
 */
mat3.subtract = function (out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    out[4] = a[4] - b[4];
    out[5] = a[5] - b[5];
    out[6] = a[6] - b[6];
    out[7] = a[7] - b[7];
    out[8] = a[8] - b[8];
    return out;
};

/**
 * Alias for {@link mat3.subtract}
 * @function
 */
mat3.sub = mat3.subtract;

/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat3} out
 */
mat3.multiplyScalar = function (out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    out[4] = a[4] * b;
    out[5] = a[5] * b;
    out[6] = a[6] * b;
    out[7] = a[7] * b;
    out[8] = a[8] * b;
    return out;
};

/**
 * Adds two mat3's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat3} out the receiving vector
 * @param {mat3} a the first operand
 * @param {mat3} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat3} out
 */
mat3.multiplyScalarAndAdd = function (out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    out[2] = a[2] + (b[2] * scale);
    out[3] = a[3] + (b[3] * scale);
    out[4] = a[4] + (b[4] * scale);
    out[5] = a[5] + (b[5] * scale);
    out[6] = a[6] + (b[6] * scale);
    out[7] = a[7] + (b[7] * scale);
    out[8] = a[8] + (b[8] * scale);
    return out;
};

/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {mat3} a The first matrix.
 * @param {mat3} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
mat3.exactEquals = function (a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] &&
        a[3] === b[3] && a[4] === b[4] && a[5] === b[5] &&
        a[6] === b[6] && a[7] === b[7] && a[8] === b[8];
};

/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {mat3} a The first matrix.
 * @param {mat3} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
mat3.equals = function (a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5], a6 = a[6], a7 = a[7], a8 = a[8];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7], b8 = b[8];
    return (Math.abs(a0 - b0) <= matrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
        Math.abs(a1 - b1) <= matrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
        Math.abs(a2 - b2) <= matrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) &&
        Math.abs(a3 - b3) <= matrix.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) &&
        Math.abs(a4 - b4) <= matrix.EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) &&
        Math.abs(a5 - b5) <= matrix.EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) &&
        Math.abs(a6 - b6) <= matrix.EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) &&
        Math.abs(a7 - b7) <= matrix.EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7)) &&
        Math.abs(a8 - b8) <= matrix.EPSILON * Math.max(1.0, Math.abs(a8), Math.abs(b8)));
};


module.exports = mat3;