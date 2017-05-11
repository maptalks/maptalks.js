/**
 * reference https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/mat4.js
 * switch to es6 syntax
 * warning:if you don't want to change the source value,please use mat.clone().* instead of mat.* (* means matrix operations)
 * @author yellow 2017/5/10
 */
import matrix from './mat';
import vec3 from './vec3';
import quat from './quat';
/**
 * @class 4x4 Matrix
 * @name mat4
 */
export default class mat4 {
    /**
     * private 4x4 matrix array store
     */
    _out;
    /**
     *  Creates a new identity mat4
     */
    constructor() {
        this._out = new matrix.ARRAY_TYPE(16);
        this._out[0] = 1;
        this._out[1] = 0;
        this._out[2] = 0;
        this._out[3] = 0;
        this._out[4] = 0;
        this._out[5] = 1;
        this._out[6] = 0;
        this._out[7] = 0;
        this._out[8] = 0;
        this._out[9] = 0;
        this._out[10] = 1;
        this._out[11] = 0;
        this._out[12] = 0;
        this._out[13] = 0;
        this._out[14] = 0;
        this._out[15] = 1;
        return this;
    };
    /**
     * set the value of 4x4 matrix
     */
    set(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
        this._out[0] = m00;
        this._out[1] = m01;
        this._out[2] = m02;
        this._out[3] = m03;
        this._out[4] = m10;
        this._out[5] = m11;
        this._out[6] = m12;
        this._out[7] = m13;
        this._out[8] = m20;
        this._out[9] = m21;
        this._out[10] = m22;
        this._out[11] = m23;
        this._out[12] = m30;
        this._out[13] = m31;
        this._out[14] = m32;
        this._out[15] = m33;
        return this;
    };
    /**
     * Creates a new mat4 initialized with values from an existing matrix
     */
    clone() {
        let mat = new mat4();
        mat.set(this._out[0], this._out[1], this._out[2], this._out[3],
            this._out[4], this._out[5], this._out[6], this._out[7],
            this._out[8], this._out[9], this._out[10], this._out[11],
            this._out[12], this._out[13], this._out[14], this._out[15]);
        return mat;
    };
    /**
     * Set a mat4 to the identity matrix
     */
    identity() {
        this.set(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1);
        return this;
    };
    /**
     * Transpose the values of a mat4 
     */
    transpose = (() => {
        return matrix.USE_SIMD ?
            () => {
                let a0, a1, a2, a3,
                    tmp01, tmp23,
                    out0, out1, out2, out3;
                //simd load all 4x4 matrix data
                r0 = SIMD.Float32x4.load(this._out, 0);
                r1 = SIMD.Float32x4.load(this._out, 4);
                r2 = SIMD.Float32x4.load(this._out, 8);
                r3 = SIMD.Float32x4.load(this._out, 12);
                //cause this._out[0],this._out[4],this._out[8],this._out[12] distribute in
                //r0 r1 r2 r3,but shuffle only accept two paramters,so...it need two tempary arrays
                tmp01 = SIMD.Float32x4.shuffle(a0, a1, 0, 1, 4, 5);
                tmp23 = SIMD.Float32x4.shuffle(a2, a3, 0, 1, 4, 5);
                out0 = SIMD.Float32x4.shuffle(tmp01, tmp23, 0, 2, 4, 6);
                out1 = SIMD.Float32x4.shuffle(tmp01, tmp23, 1, 3, 5, 7);
                SIMD.Float32x4.store(this._out, 0, out0);
                SIMD.Float32x4.store(this._out, 4, out1);
                //
                tmp01 = SIMD.Float32x4.shuffle(a0, a1, 2, 3, 6, 7);
                tmp23 = SIMD.Float32x4.shuffle(a2, a3, 2, 3, 6, 7);
                out2 = SIMD.Float32x4.shuffle(tmp01, tmp23, 0, 2, 4, 6);
                out3 = SIMD.Float32x4.shuffle(tmp01, tmp23, 1, 3, 5, 7);
                SIMD.Float32x4.store(this._out, 8, out2);
                SIMD.Float32x4.store(this._out, 12, out3);
                return this;
            }
            :
            () => {
                //deconstruction assignment
                [this._out[0], this._out[1], this._out[2], this._out[3],
                this._out[4], this._out[5], this._out[6], this._out[7],
                this._out[8], this._out[9], this._out[10], this._out[11],
                this._out[12], this._out[13], this._out[14], this._out[15]
                ]
                    =
                    [this._out[0], this._out[4], this._out[8], this._out[12],
                    this._out[1], this._out[5], this._out[9], this._out[13],
                    this._out[2], this._out[6], this._out[10], this._out[14],
                    this._out[3], this._out[7], this._out[11], this._out[15]
                    ];
                return this;
            };
    })();
    /**
     * Inverts a mat4
     */
    invert = (() => {
        //deconstruction assignment
        return () => {
            let [a00, a01, a02, a03,
                a10, a11, a12, a13,
                a20, a21, a22, a23,
                a30, a31, a32, a33] = this._out,
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
            [
                this._out[0], this._out[1], this._out[2], this._out[3],
                this._out[4], this._out[5], this._out[6], this._out[7],
                this._out[8], this._out[9], this._out[10], this._out[11],
                this._out[12], this._out[13], this._out[14], this._out[15]
            ]
                =
                [
                    (a11 * b11 - a12 * b10 + a13 * b09) * det, (a02 * b10 - a01 * b11 - a03 * b09) * det, (a31 * b05 - a32 * b04 + a33 * b03) * det, (a22 * b04 - a21 * b05 - a23 * b03) * det,
                    (a12 * b08 - a10 * b11 - a13 * b07) * det, (a00 * b11 - a02 * b08 + a03 * b07) * det, (a32 * b02 - a30 * b05 - a33 * b01) * det, (a20 * b05 - a22 * b02 + a23 * b01) * det,
                    (a10 * b10 - a11 * b08 + a13 * b06) * det, (a01 * b08 - a00 * b10 - a03 * b06) * det, (a30 * b04 - a31 * b02 + a33 * b00) * det, (a21 * b02 - a20 * b04 - a23 * b00) * det,
                    (a11 * b07 - a10 * b09 - a12 * b06) * det, (a00 * b09 - a01 * b07 + a02 * b06) * det, (a31 * b01 - a30 * b03 - a32 * b00) * det, (a20 * b03 - a21 * b01 + a22 * b00) * det
                ]
            return this;
        }
    })();
    /**
     * Calculates the adjugate of a mat4 not using SIMD
     */
    adjoint() {
        let [a00, a01, a02, a03,
            a10, a11, a12, a13,
            a20, a21, a22, a23,
            a30, a31, a32, a33] = this._out;
        this._out[0] = (a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22));
        this._out[1] = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
        this._out[2] = (a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12));
        this._out[3] = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
        this._out[4] = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
        this._out[5] = (a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22));
        this._out[6] = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
        this._out[7] = (a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12));
        this._out[8] = (a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21));
        this._out[9] = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
        this._out[10] = (a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11));
        this._out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
        this._out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
        this._out[13] = (a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21));
        this._out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
        this._out[15] = (a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11));
        return this;
    };
    /**
     * Calculates the determinant of a mat4
     * @return {number} determinant of this matrix
     */
    determinant() {
        let [a00, a01, a02, a03,
            a10, a11, a12, a13,
            a20, a21, a22, a23,
            a30, a31, a32, a33] = this._out;
        let b00 = a00 * a11 - a01 * a10,
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
            b11 = a22 * a33 - a23 * a32;
        // Calculate the determinant
        return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    };
    /**
     * Multiplies two mat4's explicitly not using SIMD
     * @param {mat4} mat
     */
    multiply(mat) {
        let [a00, a01, a02, a03,
            a10, a11, a12, a13,
            a20, a21, a22, a23,
            a30, a31, a32, a33] = this._out;
        // Cache only the current line of the second matrix
        let b0 = mat._out[0], b1 = mat._out[1], b2 = mat._out[2], b3 = mat._out[3];
        this._out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        this._out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        this._out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        this._out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = mat._out[4]; b1 = mat._out[5]; b2 = mat._out[6]; b3 = mat._out[7];
        this._out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        this._out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        this._out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        this._out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = mat._out[8]; b1 = mat._out[9]; b2 = mat._out[10]; b3 = mat._out[11];
        this._out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        this._out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        this._out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        this._out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = mat._out[12]; b1 = mat._out[13]; b2 = mat._out[14]; b3 = mat._out[15];
        this._out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        this._out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        this._out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        this._out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        return this;
    };
    /**
     * add two 4x4 matrixs 
     */
    add(mat) {
        this._out[0] += mat._out[0];
        this._out[1] += mat._out[1];
        this._out[2] += mat._out[2];
        this._out[3] += mat._out[3];
        this._out[4] += mat._out[4];
        this._out[5] += mat._out[5];
        this._out[6] += mat._out[6];
        this._out[7] += mat._out[7];
        this._out[8] += mat._out[8];
        this._out[9] += mat._out[9];
        this._out[10] += mat._out[10];
        this._out[11] += mat._out[11];
        this._out[12] += mat._out[12];
        this._out[13] += mat._out[13];
        this._out[14] += mat._out[14];
        this._out[15] += mat._out[15];
        return this;
    };
    /**
     * Translate a mat4 by the given vector not using SIMD
     * @param {vec3} vec vector to translate by
     */
    translate(vec) {
        let [x, y, z] = vec._out,
            [a00, a01, a02, a03,
                a10, a11, a12, a13,
                a20, a21, a22, a23] = this._out;
        this._out[12] = a00 * x + a10 * y + a20 * z + a[12];
        this._out[13] = a01 * x + a11 * y + a21 * z + a[13];
        this._out[14] = a02 * x + a12 * y + a22 * z + a[14];
        this._out[15] = a03 * x + a13 * y + a23 * z + a[15];
        return this;
    };
    /**
     * Scales the mat4 by the dimensions in the given vec3 not using vectorization
     * @param {vec3} vec the vec3 to scale the matrix by
     */
    scale(vec) {
        let [x, y, z] = vec._out;
        this._out[0] *= x;
        this._out[1] *= x;
        this._out[2] *= x;
        this._out[3] *= x;
        this._out[4] *= y;
        this._out[5] *= y;
        this._out[6] *= y;
        this._out[7] *= y;
        this._out[8] *= z;
        this._out[9] *= z;
        this._out[10] *= z;
        this._out[11] *= z;
        return this;
    };
    /**
     * Rotates a mat4 by the given angle around the given axis
     * @param {number} rad the angle to rotate the matrix by
     * @param {vec3} axis the axis to rotate around
     */
    rotate(rad, axis) {
        var [x, y, z] = axis._out,
            len = axis.len(),
            s, c, t,
            a00, a01, a02, a03,
            a10, a11, a12, a13,
            a20, a21, a22, a23,
            b00, b01, b02,
            b10, b11, b12,
            b20, b21, b22;
        if (Math.abs(len) < matrix.EPSILON) { return null; }
        len = 1.0 / len;
        x *= len;
        y *= len;
        z *= len;
        s = Math.sin(rad);
        c = Math.cos(rad);
        t = 1 - c;
        a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
        a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
        a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];
        // Construct the elements of the rotation matrix
        b00 = x * x * t + c; b01 = y * x * t + z * s; b02 = z * x * t - y * s;
        b10 = x * y * t - z * s; b11 = y * y * t + c; b12 = z * y * t + x * s;
        b20 = x * z * t + y * s; b21 = y * z * t - x * s; b22 = z * z * t + c;
        // Perform rotation-specific matrix multiplication
        this._out[0] = a00 * b00 + a10 * b01 + a20 * b02;
        this._out[1] = a01 * b00 + a11 * b01 + a21 * b02;
        this._out[2] = a02 * b00 + a12 * b01 + a22 * b02;
        this._out[3] = a03 * b00 + a13 * b01 + a23 * b02;
        this._out[4] = a00 * b10 + a10 * b11 + a20 * b12;
        this._out[5] = a01 * b10 + a11 * b11 + a21 * b12;
        this._out[6] = a02 * b10 + a12 * b11 + a22 * b12;
        this._out[7] = a03 * b10 + a13 * b11 + a23 * b12;
        this._out[8] = a00 * b20 + a10 * b21 + a20 * b22;
        this._out[9] = a01 * b20 + a11 * b21 + a21 * b22;
        this._out[10] = a02 * b20 + a12 * b21 + a22 * b22;
        this._out[11] = a03 * b20 + a13 * b21 + a23 * b22;
        return this;
    };
    /**
     * Rotates a matrix by the given angle around the X axis not using SIMD
     * @param {number} rad
     */
    rotateX(rad) {
        var s = Math.sin(rad),
            c = Math.cos(rad),
            a10 = this._out[4],
            a11 = this._out[5],
            a12 = this._out[6],
            a13 = this._out[7],
            a20 = this._out[8],
            a21 = this._out[9],
            a22 = this._out[10],
            a23 = this._out[11];
        // Perform axis-specific matrix multiplication
        this._out[4] = a10 * c + a20 * s;
        this._out[5] = a11 * c + a21 * s;
        this._out[6] = a12 * c + a22 * s;
        this._out[7] = a13 * c + a23 * s;
        this._out[8] = a20 * c - a10 * s;
        this._out[9] = a21 * c - a11 * s;
        this._out[10] = a22 * c - a12 * s;
        this._out[11] = a23 * c - a13 * s;
        return this;
    };
    /**
     * Rotates a matrix by the given angle around the Y axis not using SIMD
     * @param {Number} rad the angle to rotate the matrix by
     */
    rotateY(rad) {
        var s = Math.sin(rad),
            c = Math.cos(rad),
            a00 = this._out[0],
            a01 = this._out[1],
            a02 = this._out[2],
            a03 = this._out[3],
            a20 = this._out[8],
            a21 = this._out[9],
            a22 = this._out[10],
            a23 = this._out[11];
        // Perform axis-specific matrix multiplication
        this._out[0] = a00 * c - a20 * s;
        this._out[1] = a01 * c - a21 * s;
        this._out[2] = a02 * c - a22 * s;
        this._out[3] = a03 * c - a23 * s;
        this._out[8] = a00 * s + a20 * c;
        this._out[9] = a01 * s + a21 * c;
        this._out[10] = a02 * s + a22 * c;
        this._out[11] = a03 * s + a23 * c;
        return this;
    };
    /**
     * Rotates a matrix by the given angle around the Z axis not using SIMD
     * @param {Number} rad the angle to rotate the matrix by
     */
    rotateZ(rad) {
        var s = Math.sin(rad),
            c = Math.cos(rad),
            a00 = this._out[0],
            a01 = this._out[1],
            a02 = this._out[2],
            a03 = this._out[3],
            a10 = this._out[4],
            a11 = this._out[5],
            a12 = this._out[6],
            a13 = this._out[7];
        // Perform axis-specific matrix multiplication
        this._out[0] = a00 * c + a10 * s;
        this._out[1] = a01 * c + a11 * s;
        this._out[2] = a02 * c + a12 * s;
        this._out[3] = a03 * c + a13 * s;
        this._out[4] = a10 * c - a00 * s;
        this._out[5] = a11 * c - a01 * s;
        this._out[6] = a12 * c - a02 * s;
        this._out[7] = a13 * c - a03 * s;
        return this;
    };
    /**
     * Creates a matrix from a vector translation
     * This is equivalent to (but much faster than):
     *  mat4.identity(dest);
     *  mat4.translate(dest, dest, vec);
     * 
     * @param {vec3} vec Translation vector
     */
    static fromVec3Translation(vec) {
        let mat = new mat4(),
            [x, y, z] = vec._out;
        mat.set(1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, z, 1);
        return mat;
    };
    /**
     * Creates a matrix from a vector scaling
     * This is equivalent to (but much faster than):
     *  mat4.identity(dest);
     *  mat4.scale(dest, dest, vec);
     * @param {vec3} vec Scaling vector
     * @returns {mat4} 
     */
    static fromScaling(vec) {
        let mat = new mat4(),
            [x, y, z] = vec._out;
        mat.set(x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1);
        return mat;
    };
    /**
     * Creates a matrix from a given angle around a given axis
     * This is equivalent to (but much faster than):
     *  mat4.identity(dest);
     *  mat4.rotate(dest, dest, rad, axis);
     * @param {Number} rad the angle to rotate the matrix by
     * @param {vec3} axis the axis to rotate around
     */
    static fromRotation(rad, axis) {
        var [x, y, z] = axis._out,
            len = axis.len(),
            mat = new mat4(),
            s, c, t;
        if (len < matrix.EPSILON) { return null; }
        len = 1.0 / len;
        x *= len;
        y *= len;
        z *= len;
        s = Math.sin(rad);
        c = Math.cos(rad);
        t = 1 - c;
        // Perform rotation-specific matrix multiplication
        mat.set(x * x * t + c, y * x * t + z * s, z * x * t - y * s, 0,
            x * y * t - z * s, y * y * t + c, z * y * t + x * s, 0,
            x * z * t + y * s, y * z * t - x * s, z * z * t + c, 0,
            0, 0, 0, 1);
        return mat;
    };
    /**
     * Creates a matrix from the given angle around the X axis
     * This is equivalent to (but much faster than):
     *  mat4.identity(dest);
     *  mat4.rotateX(dest, dest, rad);
     * @param {Number} rad the angle to rotate the matrix by
     */
    static fromXRotation(rad) {
        let mat = new mat4(),
            s = Math.sin(rad),
            c = Math.cos(rad);
        mat.set(1, 0, 0, 0,
            0, c, s, 0,
            0, -s, c, 0,
            0, 0, 0, 1);
        return mat;
    };
    /**
     * Creates a matrix from the given angle around the Y axis
     * This is equivalent to (but much faster than):
     *  mat4.identity(dest);
     *  mat4.rotateY(dest, dest, rad);
     * 
     * @param {Number} rad the angle to rotate the matrix by
     */
    static fromYRotation(rad) {
        let mat = new mat4(),
            s = Math.sin(rad),
            c = Math.cos(rad);
        // Perform axis-specific matrix multiplication
        mat.set(c, 0, -s, 0,
            0, 1, 0, 0,
            s, 0, c, 0,
            0, 0, 0, 1);
        return mat;
    };
    /**
     * Creates a matrix from the given angle around the Z axis
     * This is equivalent to (but much faster than):
     *  mat4.identity(dest);
     *  mat4.rotateZ(dest, dest, rad);
     * 
     * @param {Number} rad the angle to rotate the matrix by
     */
    static fromZRotation(rad) {
        let mat = new mat4(),
            s = Math.sin(rad),
            c = Math.cos(rad);
        // Perform axis-specific matrix multiplication
        mat.set(c, s, 0, 0,
            -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1);
        return mat;
    };
    /**
     * Returns the translation vector component of a transformation
     *  matrix. If a matrix is built with fromRotationTranslation,
     *  the returned vector will be the same as the translation vector
     *  originally supplied.
     * @return {vec3} out
    */
    getTranslation() {
        let vec = new vec3();
        vec.set(mat._out[12], mat._out[13], mat._out[14]);
        return vec;
    };
    /**
     * Creates a matrix from a quaternion rotation and vector translation
     * This is equivalent to (but much faster than):
     *  mat4.identity(dest);
     *  mat4.translate(dest, vec);
     *  var quatMat = mat4.create();
     *  quat4.toMat4(quat, quatMat);
     *  mat4.multiply(dest, quatMat);
     * 
     * @param {quat} qua Rotation quaternion
     * @param {vec3} vec Translation vector
     */
    static fromRotationTranslation(qua, vec) {
        // Quaternion math
        let mat = new mat4(),
            [x, y, z, w] = qua._out,
            [v0, v1, v2] = vec._out,
            x2 = x + x,
            y2 = y + y,
            z2 = z + z,
            xx = x * x2,
            xy = x * y2,
            xz = x * z2,
            yy = y * y2,
            yz = y * z2,
            zz = z * z2,
            wx = w * x2,
            wy = w * y2,
            wz = w * z2;
        mat.set(1 - (yy + zz), xy + wz, xz - wy, 0,
            xy - wz, 1 - (xx + zz), yz + wx, 0,
            xz + wy, yz - wx, 1 - (xx + yy), 0,
            v0, v1, v2, 1);
        return mat;
    };
    /**
     * Returns the scaling factor component of a transformation
     * matrix. If a matrix is built with fromRotationTranslationScale
     * with a normalized Quaternion paramter, the returned vector will be 
     * the same as the scaling vector
     * originally supplied.
     * @return {vec3} 
     */
    getScaling() {
        let vec = new vec3(),
            m11 = mat[0],
            m12 = mat[1],
            m13 = mat[2],
            m21 = mat[4],
            m22 = mat[5],
            m23 = mat[6],
            m31 = mat[8],
            m32 = mat[9],
            m33 = mat[10];
        x = Math.sqrt(m11 * m11 + m12 * m12 + m13 * m13);
        y = Math.sqrt(m21 * m21 + m22 * m22 + m23 * m23);
        z = Math.sqrt(m31 * m31 + m32 * m32 + m33 * m33);
        vec.set(x, y, z);
        return vec;
    };
    /**
     * Returns a quaternion representing the rotational component
     * of a transformation matrix. If a matrix is built with
     * fromRotationTranslation, the returned quaternion will be the
     * same as the quaternion originally supplied.
     * Algorithm taken from http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
     * @return {quat} 
     */
    getRotation() {
        let S = 0,
            x, y, z, w,
            qua = new quat(),
            trace = this._out[0] + this._out[5] + this._out[10];

        if (trace > 0) {
            S = Math.sqrt(trace + 1.0) * 2;
            w = 0.25 * S;
            x = (this._out[6] - this._out[9]) / S;
            y = (this._out[8] - this._out[2]) / S;
            z = (this._out[1] - this._out[4]) / S;
        } else if ((this._out[0] > this._out[5]) & (this._out[0] > this._out[10])) {
            S = Math.sqrt(1.0 + this._out[0] - this._out[5] - this._out[10]) * 2;
            w = (this._out[6] - this._out[9]) / S;
            x = 0.25 * S;
            y = (this._out[1] + this._out[4]) / S;
            z = (this._out[8] + this._out[2]) / S;
        } else if (this._out[5] > this._out[10]) {
            S = Math.sqrt(1.0 + this._out[5] - this._out[0] - this._out[10]) * 2;
            w = (this._out[8] - this._out[2]) / S;
            x = (this._out[1] + this._out[4]) / S;
            y = 0.25 * S;
            z = (this._out[6] + this._out[9]) / S;
        } else {
            S = Math.sqrt(1.0 + this._out[10] - this._out[0] - this._out[5]) * 2;
            w = (this._out[1] - this._out[4]) / S;
            x = (this._out[8] + this._out[2]) / S;
            y = (this._out[6] + this._out[9]) / S;
            z = 0.25 * S;
        }
        qua.set(x, y, z, w);
        return qua;
    };

    /**
     * Creates a matrix from a quaternion rotation, vector translation and vector scale
     * This is equivalent to (but much faster than):
     *  mat4.identity(dest);
     *  mat4.translate(dest, vec);
     *  var quatMat = mat4.create();
     *  quat4.toMat4(quat, quatMat);
     *  mat4.multiply(dest, quatMat);
     *  mat4.scale(dest, scale)
     * 
     * @param {quat} q rotation quaternion
     * @param {vec3} v translation vector
     * @param {vec3} s scaling vectoer
     * @returns {mat4} 
     */
    static fromRotationTranslationScale(q, v, s) {
        let mat = new mat4(),
            [x, y, z, w] = qua._out,
            [v0, v1, v2] = v._out,
            x2 = x + x,
            y2 = y + y,
            z2 = z + z,
            xx = x * x2,
            xy = x * y2,
            xz = x * z2,
            yy = y * y2,
            yz = y * z2,
            zz = z * z2,
            wx = w * x2,
            wy = w * y2,
            wz = w * z2,
            sx = s[0],
            sy = s[1],
            sz = s[2];
        mat.set((1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0
            (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
            (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
            v0, v1, v2, 1);
        return mat;
    };
    /**
     * Creates a matrix from a quaternion rotation, vector translation and vector scale, rotating and scaling around the given origin
     * This is equivalent to (but much faster than):
     *  mat4.identity(dest);
     *  mat4.translate(dest, vec);
     *  mat4.translate(dest, origin);
     *  var quatMat = mat4.create();
     *  quat4.toMat4(quat, quatMat);
     *  mat4.multiply(dest, quatMat);
     *  mat4.scale(dest, scale);
     *  mat4.translate(dest, negativeOrigin);
     * 
     * @param {quat} q Rotation quaternion
     * @param {vec3} v Translation vector
     * @param {vec3} s Scaling vector
     * @param {vec3} o The origin vector around which to scale and rotate
     * @returns {mat4}
     */
    static fromRotationTranslationScaleOrigin(q, v, s, o) {
        // Quaternion math
        var mat = new mat4(),
            [x, y, z, w] = q._out,
            [sx, sy, sz] = v._out,
            [ox, oy, oz] = o._out,
            [vx, vy, vz] = v._out,
            x2 = x + x,
            y2 = y + y,
            z2 = z + z,
            xx = x * x2,
            xy = x * y2,
            xz = x * z2,
            yy = y * y2,
            yz = y * z2,
            zz = z * z2,
            wx = w * x2,
            wy = w * y2,
            wz = w * z2;
        mat.set((1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
            (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
            (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
            vx + ox - (out[0] * ox + out[4] * oy + out[8] * oz), vy + oy - (out[1] * ox + out[5] * oy + out[9] * oz), vz + oz - (out[2] * ox + out[6] * oy + out[10] * oz), 1);
        return mat;
    };
    /**
     * Calculates a 4x4 matrix from the given quaternion
     * @param {quat} q Quaternion to create matrix from
     * @returns {mat4}
     */
    static fromQuat(q) {
        let mat = new mat4(),
            [x, y, z, w] = q._out,
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
        mat.set(1 - yy - zz, yx + wz, zx - wy, 0,
            yx - wz, 1 - xx - zz, zy + wx, 0,
            zx + wy, zy - wx, 1 - xx - yy, 0,
            0, 0, 0, 1)
        return mat;
    };
    /**
     * Generates a frustum matrix with the given bounds
     * @param {Number} left Left bound of the frustum
     * @param {Number} right Right bound of the frustum
     * @param {Number} bottom Bottom bound of the frustum
     * @param {Number} top Top bound of the frustum
     * @param {Number} near Near bound of the frustum
     * @param {Number} far Far bound of the frustum
     * @returns {mat4}
     */
    static frustum(left, right, bottom, top, near, far) {
        var mat = new mat4(),
            rl = 1 / (right - left),
            tb = 1 / (top - bottom),
            nf = 1 / (near - far);
        mat.set((near * 2) * rl, 0, 0, 0,
            0, (near * 2) * tb, 0, 0,
            (right + left) * rl, (top + bottom) * tb, (far + near) * nf, -1,
            0, 0, (far * near * 2) * nf, 0);
        return mat;
    };
    /**
     * Generates a perspective projection matrix with the given bounds
     * @param {number} fovy Vertical field of view in radians
     * @param {number} aspect Aspect ratio. typically viewport width/height
     * @param {number} near Near bound of the frustum
     * @param {number} far Far bound of the frustum
     */
    perspective(fovy, aspect, near, far) {
        var mat = new mat4(),
            f = 1.0 / Math.tan(fovy / 2),
            nf = 1 / (near - far);
        mat.set(f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) * nf, -1,
            0, 0, (2 * far * near) * nf, 0);
        return mat;
    };
    /**
     * Generates a perspective projection matrix with the given field of view.
     * This is primarily useful for generating projection matrices to be used
     * with the still experiemental WebVR API.
     * @param {Object} fov Object containing the following values: upDegrees, downDegrees, leftDegrees, rightDegrees
     * @param {number} near Near bound of the frustum
     * @param {number} far Far bound of the frustum
     * @returns {mat4} out
     */
    static perspectiveFromFieldOfView(fov, near, far) {
        let mat = new mat4(),
            upTan = Math.tan(fov.upDegrees * Math.PI / 180.0),
            downTan = Math.tan(fov.downDegrees * Math.PI / 180.0),
            leftTan = Math.tan(fov.leftDegrees * Math.PI / 180.0),
            rightTan = Math.tan(fov.rightDegrees * Math.PI / 180.0),
            xScale = 2.0 / (leftTan + rightTan),
            yScale = 2.0 / (upTan + downTan);
        mat.set(xScale, 0, 0, 0,
            0, yScale, 0, 0,
            -((leftTan - rightTan) * xScale * 0.5), ((upTan - downTan) * yScale * 0.5), far / (near - far), -1,
            0, 0, (far * near) / (near - far), 0);
        return mat;
    };
    /**
     * Generates a orthogonal projection matrix with the given bounds
     * @param {number} left Left bound of the frustum
     * @param {number} right Right bound of the frustum
     * @param {number} bottom Bottom bound of the frustum
     * @param {number} top Top bound of the frustum
     * @param {number} near Near bound of the frustum
     * @param {number} far Far bound of the frustum
     * @returns {mat4} 
     */
    static ortho(left, right, bottom, top, near, far) {
        let mat = new mat4(),
            lr = 1.0 / (left - right),
            bt = 1.0 / (bottom - top),
            nf = 1.0 / (near - far);
        mat.set(-2 * lr, 0, 0, 0,
            0, -2 * bt, 0, 0,
            0, 0, 2 * nf, 0,
            (left + right) * lr, (top + bottom) * bt, (far + near) * nf, 1);
        return mat;
    };
    /**
     * Generates a look-at matrix with the given eye position, focal point, and up axis
     * @param {vec3} eye Position of the viewer
     * @param {vec3} center Point the viewer is looking at
     * @param {vec3} up vec3 pointing up
     * @returns {mat4}
     */
    lookAt(eye, center, up) {
        let x0, x1, x2, y0, y1, y2, z0, z1, z2, len,
            [eyex, eyey, eyez] = eye._out,
            [upx, upy, upz] = up._out,
            [centerx, centery, centerz] = center._out;

        if (Math.abs(eyex - centerx) < matrix.EPSILON &&
            Math.abs(eyey - centery) < matrix.EPSILON &&
            Math.abs(eyez - centerz) < matrix.EPSILON) {
            return this.identity();
        }
        z0 = eyex - centerx;
        z1 = eyey - centery;
        z2 = eyez - centerz;
        len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
        z0 *= len;
        z1 *= len;
        z2 *= len;
        x0 = upy * z2 - upz * z1;
        x1 = upz * z0 - upx * z2;
        x2 = upx * z1 - upy * z0;
        len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
        if (!len) {
            x0 = 0;
            x1 = 0;
            x2 = 0;
        } else {
            len = 1 / len;
            x0 *= len;
            x1 *= len;
            x2 *= len;
        }
        y0 = z1 * x2 - z2 * x1;
        y1 = z2 * x0 - z0 * x2;
        y2 = z0 * x1 - z1 * x0;
        len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
        if (!len) {
            y0 = 0;
            y1 = 0;
            y2 = 0;
        } else {
            len = 1 / len;
            y0 *= len;
            y1 *= len;
            y2 *= len;
        }
        this.set(x0, y0, z0, 0,
            x1, y1, z1, 0,
            x2, y2, z2, 0,
            -(x0 * eyex + x1 * eyey + x2 * eyez), -(y0 * eyex + y1 * eyey + y2 * eyez), -(z0 * eyex + z1 * eyey + z2 * eyez), 1);
        return this;
    };
    /**
     * Returns a string representation of a mat4
     */
    toString() {
        return 'mat4(' + this._out[0] + ', ' + this._out[1] + ', ' + this._out[2] + ', ' + this._out[3] + ', ' +
            this._out[4] + ', ' + this._out[5] + ', ' + this._out[6] + ', ' + this._out[7] + ', ' +
            this._out[8] + ', ' + this._out[9] + ', ' + this._out[10] + ', ' + this._out[11] + ', ' +
            this._out[12] + ', ' + this._out[13] + ', ' + this._out[14] + ', ' + this._out[15] + ')';
    };
    /**
     * Returns Frobenius norm of a mat4
     * @returns {Number} Frobenius norm
     */
    forb() {
        return Math.sqrt(Math.pow(this._out[0], 2) + Math.pow(this._out[1], 2) + Math.pow(this._out[2], 2) + Math.pow(this._out[3], 2) +
            Math.pow(this._out[4], 2) + Math.pow(this._out[5], 2) + Math.pow(this._out[6], 2) + Math.pow(this._out[7], 2) +
            Math.pow(this._out[8], 2) + Math.pow(this._out[9], 2) + Math.pow(this._out[10], 2) + Math.pow(this._out[11], 2) +
            Math.pow(this._out[12], 2) + Math.pow(this._out[13], 2) + Math.pow(this._out[14], 2) + Math.pow(this._out[15], 2));
    };
    /**
     * Adds two mat4's
     * @param {mat4} mat
     */
    add(mat) {
        this._out[0] += mat._out[0];
        this._out[1] += mat._out[1];
        this._out[2] += mat._out[2];
        this._out[3] += mat._out[3];
        this._out[4] += mat._out[4];
        this._out[5] += mat._out[5];
        this._out[6] += mat._out[6];
        this._out[7] += mat._out[7];
        this._out[8] += mat._out[8];
        this._out[9] += mat._out[9];
        this._out[10] += mat._out[10];
        this._out[11] += mat._out[11];
        this._out[12] += mat._out[12];
        this._out[13] += mat._out[13];
        this._out[14] += mat._out[14];
        this._out[15] += mat._out[15];
        return this;
    };
    /**
     * Subtracts matrix b from matrix a
     * @param {mat4} mat
     */
    sub(mat) {
        this._out[0] -= mat._out[0];
        this._out[1] -= mat._out[1];
        this._out[2] -= mat._out[2];
        this._out[3] -= mat._out[3];
        this._out[4] -= mat._out[4];
        this._out[5] -= mat._out[5];
        this._out[6] -= mat._out[6];
        this._out[7] -= mat._out[7];
        this._out[8] -= mat._out[8];
        this._out[9] -= mat._out[9];
        this._out[10] -= mat._out[10];
        this._out[11] -= mat._out[11];
        this._out[12] -= mat._out[12];
        this._out[13] -= mat._out[13];
        this._out[14] -= mat._out[14];
        this._out[15] -= mat._out[15];
        return this;
    };
    /**
     * Returns whether or not the matrices have approximately the same elements in the same position.
     * @param {mat4} mat
     */
    equals(mat) {
        let [a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15] = this._out,
            [b0, b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12, b13, b14, b15] = mat._out;
        return (Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
            Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
            Math.abs(a2 - b2) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) &&
            Math.abs(a3 - b3) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) &&
            Math.abs(a4 - b4) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) &&
            Math.abs(a5 - b5) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) &&
            Math.abs(a6 - b6) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) &&
            Math.abs(a7 - b7) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7)) &&
            Math.abs(a8 - b8) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a8), Math.abs(b8)) &&
            Math.abs(a9 - b9) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a9), Math.abs(b9)) &&
            Math.abs(a10 - b10) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a10), Math.abs(b10)) &&
            Math.abs(a11 - b11) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a11), Math.abs(b11)) &&
            Math.abs(a12 - b12) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a12), Math.abs(b12)) &&
            Math.abs(a13 - b13) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a13), Math.abs(b13)) &&
            Math.abs(a14 - b14) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a14), Math.abs(b14)) &&
            Math.abs(a15 - b15) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a15), Math.abs(b15)));
    };
}