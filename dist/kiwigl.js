(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.kiwigl = global.kiwigl || {})));
}(this, (function (exports) { 'use strict';

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();



























var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

/**
 * reference https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/common.js
 * switch to es6 syntax
 * warning:if you don't want to change the source value,please use mat.clone().* instead of mat.*
 * @author yellow 2017/5/8
 */

var degree = Math.PI / 180;

var matrix = function () {
    function matrix() {
        classCallCheck(this, matrix);
    }

    createClass(matrix, null, [{
        key: 'setMatrixArrayType',


        /**
         * Set ArrayType,such as Float32Array or Array ([])
         * @param {Type} type Array type,such as Float32Array or Array
         */

        //precision
        value: function setMatrixArrayType(type) {
            matrix.ARRAY_TYPE = type;
        }
        //support ie9

    }, {
        key: 'toRadian',


        /**
         * Convert degree to radian
         * @param {Number} deg Angle in Degrees
         */
        value: function toRadian(deg) {
            return deg * degree;
        }

        /**
         * Convert rad to degree
         * @param {Number} rad Angle in Radian
         */

    }, {
        key: 'toDegree',
        value: function toDegree(rad) {
            return rad / degree;
        }

        /**
         * @param {Number} a The first number to test.
         * @param {Number} b The first number to test.
         * @return {Boolean} True if the numbers are approximately equal, false otherwise.
         */

    }, {
        key: 'equals',
        value: function equals(a, b) {
            return Math.abs(a - b) <= matrix.EPSILON * Math.max(1.0, Math.abs(a), Math.abs(b));
        }
    }]);
    return matrix;
}();

matrix.EPSILON = 1e-6;
matrix.ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
matrix.RANDOM = Math.random;
matrix.ENABLE_SIMD = true;
matrix.SIMD_AVAILABLE = matrix.ARRAY_TYPE === undefined.Float32Array && typeof SIMD != 'undefined';
matrix.USE_SIMD = matrix.ENABLE_SIMD && matrix.SIMD_AVAILABLE;

/**
 * reference https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/mat3.js
 * switch to es6 syntax,and change to quote
 * warning:if you don't want to change the source value,please use mat.clone().* instead of mat.*
 * @author yellow 2017/5/8
 */

/**
 * @class 3x3 Matrix
 * @name mat3
 */

var mat3 = function () {
    /**
     * Creates a new identity mat3
     */
    function mat3() {
        classCallCheck(this, mat3);

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
    }
    /**
     * an array to store the 3*3 matrix data
     * [1,0,0]
     * [0,1,0]
     * [0,0,1]
     * @private 
     */


    createClass(mat3, [{
        key: 'set',

        /**
         * set matrix value
         */
        value: function set$$1(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
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
        }
    }, {
        key: 'clone',

        /**
         * clone the mat3 matrix
         * @return {mat3}
         */
        value: function clone() {
            var mat = new mat3().set(this._out[0], this._out[1], this._out[2], this._out[3], this._out[4], this._out[5], this._out[6], this._out[7], this._out[8]);
            return mat;
        }
    }, {
        key: 'identity',

        /**
        * Set a mat3 to the identity matrix
        * @method identity
        * @param {mat3} out the receiving matrix
        * @returns {mat3} out
        */
        value: function identity() {
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
        }
    }, {
        key: 'transpose',

        /**
         * Transpose the values of a mat3
         * @method transpose
         */
        value: function transpose() {
            //temporary array
            var a = new matrix.ARRAY_TYPE(9);
            var _ref = [this._out[0], this._out[3], this._out[6], this._out[1], this._out[4], this._out[7], this._out[2], this._out[5], this._out[8]];
            this._out[0] = _ref[0];
            this._out[1] = _ref[1];
            this._out[2] = _ref[2];
            this._out[3] = _ref[3];
            this._out[4] = _ref[4];
            this._out[5] = _ref[5];
            this._out[6] = _ref[6];
            this._out[7] = _ref[7];
            this._out[8] = _ref[8];

            return this;
        }
    }, {
        key: 'invert',

        /**
         * Inverts a mat3
         * @method invert
         */
        value: function invert() {
            var _out2 = slicedToArray(this._out, 9),
                a00 = _out2[0],
                a01 = _out2[1],
                a02 = _out2[2],
                a10 = _out2[3],
                a11 = _out2[4],
                a12 = _out2[5],
                a20 = _out2[6],
                a21 = _out2[7],
                a22 = _out2[8];

            var b01 = a22 * a11 - a12 * a21,
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
        }
    }, {
        key: 'adjoint',

        /**
         * Calculates the adjugate of a mat3
         * 
         */
        value: function adjoint() {
            var _out3 = slicedToArray(this._out, 9),
                a00 = _out3[0],
                a01 = _out3[1],
                a02 = _out3[2],
                a10 = _out3[3],
                a11 = _out3[4],
                a12 = _out3[5],
                a20 = _out3[6],
                a21 = _out3[7],
                a22 = _out3[8];

            this._out[0] = a11 * a22 - a12 * a21;
            this._out[1] = a02 * a21 - a01 * a22;
            this._out[2] = a01 * a12 - a02 * a11;
            this._out[3] = a12 * a20 - a10 * a22;
            this._out[4] = a00 * a22 - a02 * a20;
            this._out[5] = a02 * a10 - a00 * a12;
            this._out[6] = a10 * a21 - a11 * a20;
            this._out[7] = a01 * a20 - a00 * a21;
            this._out[8] = a00 * a11 - a01 * a10;
            return this;
        }
    }, {
        key: 'determinant',

        /**
         * Calculates the determinant of a mat3
         */
        value: function determinant() {
            var _out4 = slicedToArray(this._out, 9),
                a00 = _out4[0],
                a01 = _out4[1],
                a02 = _out4[2],
                a10 = _out4[3],
                a11 = _out4[4],
                a12 = _out4[5],
                a20 = _out4[6],
                a21 = _out4[7],
                a22 = _out4[8];

            return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
        }
    }, {
        key: 'multiply',

        /**
         * Multiplies other mat3
         * @param {mat3} mat a matrix 3*3 wait to multiply
         */
        value: function multiply(mat) {
            var _out5 = slicedToArray(this._out, 9),
                a00 = _out5[0],
                a01 = _out5[1],
                a02 = _out5[2],
                a10 = _out5[3],
                a11 = _out5[4],
                a12 = _out5[5],
                a20 = _out5[6],
                a21 = _out5[7],
                a22 = _out5[8];

            var _mat$_out = slicedToArray(mat._out, 9),
                b00 = _mat$_out[0],
                b01 = _mat$_out[1],
                b02 = _mat$_out[2],
                b10 = _mat$_out[3],
                b11 = _mat$_out[4],
                b12 = _mat$_out[5],
                b20 = _mat$_out[6],
                b21 = _mat$_out[7],
                b22 = _mat$_out[8];

            this._out[0] = b00 * a00 + b01 * a10 + b02 * a20;
            this._out[1] = b00 * a01 + b01 * a11 + b02 * a21;
            this._out[2] = b00 * a02 + b01 * a12 + b02 * a22;
            this._out[3] = b10 * a00 + b11 * a10 + b12 * a20;
            this._out[4] = b10 * a01 + b11 * a11 + b12 * a21;
            this._out[5] = b10 * a02 + b11 * a12 + b12 * a22;
            this._out[6] = b20 * a00 + b21 * a10 + b22 * a20;
            this._out[7] = b20 * a01 + b21 * a11 + b22 * a21;
            this._out[8] = b20 * a02 + b21 * a12 + b22 * a22;
        }
    }, {
        key: 'translate',

        /**
         * Translate a mat3 by the given vector
         * @param {vec2} vec vetor to translate by
         * @return {mat3} 
         */
        value: function translate(vec) {
            var _out6 = slicedToArray(this._out, 9),
                a00 = _out6[0],
                a01 = _out6[1],
                a02 = _out6[2],
                a10 = _out6[3],
                a11 = _out6[4],
                a12 = _out6[5],
                a20 = _out6[6],
                a21 = _out6[7],
                a22 = _out6[8];

            var _vec$_out = slicedToArray(vec._out, 2),
                x = _vec$_out[0],
                y = _vec$_out[1];

            this._out[0] = a00;
            this._out[1] = a01;
            this._out[2] = a02;
            this._out[3] = a10;
            this._out[4] = a11;
            this._out[5] = a12;
            this._out[6] = x * a00 + y * a10 + a20;
            this._out[7] = x * a01 + y * a11 + a21;
            this._out[8] = x * a02 + y * a12 + a22;
            return this;
        }
    }, {
        key: 'rotate',

        /**
         * Rotates a mat3 by the given angle
         * @param {Number} rad the angle to rotate the matrix by
         */
        value: function rotate(rad) {
            var _out7 = slicedToArray(this._out, 9),
                a00 = _out7[0],
                a01 = _out7[1],
                a02 = _out7[2],
                a10 = _out7[3],
                a11 = _out7[4],
                a12 = _out7[5],
                a20 = _out7[6],
                a21 = _out7[7],
                a22 = _out7[8];

            var s = Math.sin(rad),
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
        }
    }, {
        key: 'scale',

        /**
         * Scales the mat3 by the dimensions in the given vec2
         * @param {vec2} v the vec2 to scale the matrix by
         */
        value: function scale(vec) {
            var _vec$_out2 = slicedToArray(vec._out, 2),
                x = _vec$_out2[0],
                y = _vec$_out2[1];

            this._out[0] = x * this._outa[0];
            this._out[1] = x * this._out[1];
            this._out[2] = x * this._out[2];
            this._out[3] = y * this._out[3];
            this._out[4] = y * this._out[4];
            this._out[5] = y * this._out[5];
            // this._out[6] = this._out[6];
            // this._out[7] = this._out[7];
            // this._out[8] = this._out[8];
            return this;
        }
    }, {
        key: 'fromQuat',

        /**
         * Calculates a 3x3 matrix from the given quaternion
         */
        value: function fromQuat(q) {}
    }], [{
        key: 'fromMat4',

        /**
         *  Copies the upper-left 3x3 values into the given mat3.
         *  construct from mat4
         *  @method fromMat4
         *  @param {mat3} m
         *  @return {mat3}
         */
        value: function fromMat4(m) {
            var mat = new mat3();
            mat.set(m._out[0], m._out[1], m._out[2], m._out[4], m._out[5], m._out[6], m._out[8], m._out[9], m._out[10]);
            return mat;
        }
    }]);
    return mat3;
}();



/**
* Calculates a 3x3 matrix from the given quaternion
*
* @param {mat3} out mat3 receiving operation result
* @param {quat} q Quaternion to create matrix from
*
* @returns {mat3} out
*/
mat3.fromQuat = function (out, q) {
    var x = q[0],
        y = q[1],
        z = q[2],
        w = q[3],
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
    var a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11],
        a30 = a[12],
        a31 = a[13],
        a32 = a[14],
        a33 = a[15],
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
    return 'mat3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' + a[4] + ', ' + a[5] + ', ' + a[6] + ', ' + a[7] + ', ' + a[8] + ')';
};

/**
 * Returns Frobenius norm of a mat3
 *
 * @param {mat3} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
mat3.frob = function (a) {
    return Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + Math.pow(a[6], 2) + Math.pow(a[7], 2) + Math.pow(a[8], 2));
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
    out[0] = a[0] + b[0] * scale;
    out[1] = a[1] + b[1] * scale;
    out[2] = a[2] + b[2] * scale;
    out[3] = a[3] + b[3] * scale;
    out[4] = a[4] + b[4] * scale;
    out[5] = a[5] + b[5] * scale;
    out[6] = a[6] + b[6] * scale;
    out[7] = a[7] + b[7] * scale;
    out[8] = a[8] + b[8] * scale;
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
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8];
};

/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {mat3} a The first matrix.
 * @param {mat3} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
mat3.equals = function (a, b) {
    var a0 = a[0],
        a1 = a[1],
        a2 = a[2],
        a3 = a[3],
        a4 = a[4],
        a5 = a[5],
        a6 = a[6],
        a7 = a[7],
        a8 = a[8];
    var b0 = b[0],
        b1 = b[1],
        b2 = b[2],
        b3 = b[3],
        b4 = b[4],
        b5 = b[5],
        b6 = b[6],
        b7 = b[7],
        b8 = b[8];
    return Math.abs(a0 - b0) <= matrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= matrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= matrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= matrix.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= matrix.EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= matrix.EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= matrix.EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= matrix.EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= matrix.EPSILON * Math.max(1.0, Math.abs(a8), Math.abs(b8));
};

/**
 * reference https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/vec3.js
 * switch to es6 syntax
 * warning:if you don't want to change the source value,please use mat.clone().* instead of mat.*
 * @author yellow 2017/5/8
 * 
 */
/**
 * @class 3 Dimensional Vector
 * @name vec3
 */

var vec3 = function () {
    /**
     * Creates a new, empty vec3
     */
    function vec3() {
        classCallCheck(this, vec3);

        this._out = new matrix.ARRAY_TYPE(3);
        this._out[0] = 0;
        this._out[1] = 0;
        this._out[2] = 0;
        return this;
    }
    /**
     * private array store for vec3
     */


    createClass(vec3, [{
        key: 'set',


        /**
         * set value of v0 v1 v2
         */
        value: function set$$1(x, y, z) {
            this._out[0] = x;
            this._out[1] = y;
            this._out[2] = z;
            return this;
        }
    }, {
        key: 'clone',

        /**
         * Creates a new vec3 initialized with values from an existing vector
         */
        value: function clone() {
            var vec = new vec3();
            vec.set(this._out[0], this._out[1], this._out[2]);
            return vec;
        }
    }, {
        key: 'add',

        /**
         * Adds two vec3's
         * @param {vec3} vec 
         */
        value: function add(vec) {
            this._out[0] += vec._out[0];
            this._out[1] += vec._out[1];
            this._out[2] += vec._out[2];
            return this;
        }
    }, {
        key: 'sub',

        /**
         * Subtracts vector vec from vector this
         * @param {vec3} vec
         */
        value: function sub(vec) {
            this._out[0] -= vec._out[0];
            this._out[1] -= vec._out[1];
            this._out[2] -= vec._out[2];
            return this;
        }
    }, {
        key: 'multiply',

        /**
         * Multiplies two vec3's
         */
        value: function multiply(vec) {
            this._out[0] *= vec._out[0];
            this._out[1] *= vec._out[1];
            this._out[2] *= vec._out[2];
            return this;
        }
    }, {
        key: 'divide',

        /**
         * Divides two vec3's
         */
        value: function divide(vec) {
            this._out[0] /= vec._out[0];
            this._out[1] /= vec._out[1];
            this._out[2] /= vec._out[2];
            return this;
        }
    }, {
        key: 'ceil',

        /**
         * Math.ceil the components of a vec3
         */
        value: function ceil() {
            this._out[0] = Math.ceil(this._out[0]);
            this._out[1] = Math.ceil(this._out[1]);
            this._out[2] = Math.ceil(this._out[2]);
            return this;
        }
    }, {
        key: 'floor',

        /**
         * Math.floor the components of a vec3
         */
        value: function floor() {
            this._out[0] = Math.floor(this._out[0]);
            this._out[1] = Math.floor(this._out[1]);
            this._out[2] = Math.floor(this._out[2]);
            return this;
        }
    }, {
        key: 'round',

        /**
         * Math.round the components of a vec3
         */
        value: function round() {
            this._out[0] = Math.round(this._out[0]);
            this._out[1] = Math.round(this._out[1]);
            this._out[2] = Math.round(this._out[2]);
            return this;
        }
    }, {
        key: 'min',

        /**
         * Returns the minimum of two vec3's
         */
        value: function min(vec) {
            this._out[0] = Math.min(this._out[0], vec._out[0]);
            this._out[1] = Math.min(this._out[1], vec._out[1]);
            this._out[2] = Math.min(this._out[2], vec._out[2]);
            return this;
        }
    }, {
        key: 'max',

        /**
         * Returns the maximum of two vec3's
         */
        value: function max(vec) {
            this._out[0] = Math.max(this._out[0], vec._out[0]);
            this._out[1] = Math.max(this._out[1], vec._out[1]);
            this._out[2] = Math.max(this._out[2], vec._out[2]);
            return this;
        }
    }, {
        key: 'scale',

        /**
         * Scales a vec3 by a scalar number
         * @param {number} v amount to scale the vector by
         */
        value: function scale(v) {
            this._out[0] *= v;
            this._out[1] *= v;
            this._out[2] *= v;
            return this;
        }
    }, {
        key: 'distance',

        /**
         * Calculates the euclidian distance between two vec3's
         * @param {vec3} vec
         */
        value: function distance(vec) {
            var _out = slicedToArray(this._out, 3),
                x0 = _out[0],
                y0 = _out[1],
                z0 = _out[2],
                _vec$_out = slicedToArray(vec._out, 3),
                x1 = _vec$_out[0],
                y1 = _vec$_out[1],
                z1 = _vec$_out[2],
                x = x0 - x1,
                y = y0 - y1,
                z = z0 - z1;

            return Math.sqrt(x * x + y * y + z * z);
        }
    }, {
        key: 'len',

        /**
         * Calculates the length of a vec3
         */
        value: function len() {
            return distance(new vec3());
        }
    }, {
        key: 'negate',

        /**
         * Negates the components of a vec3
         */
        value: function negate() {
            this._out[0] = -this._out[0];
            this._out[1] = -this._out[1];
            this._out[2] = -this._out[2];
            return this;
        }
    }, {
        key: 'inverse',

        /**
         * Returns the inverse of the components of a vec3
         */
        value: function inverse() {
            this._out[0] = 1.0 / this._out[0];
            this._out[1] = 1.0 / this._out[1];
            this._out[2] = 1.0 / this._out[2];
            return this;
        }
    }, {
        key: 'normalize',

        /**
         * Normalize a vec3
         */
        value: function normalize() {
            var len = this.len();
            if (len > 0) {
                len = 1.0 / len;
                this._out[0] *= len;
                this._out[1] *= len;
                this._out[2] *= len;
            }
            return this;
        }
    }, {
        key: 'dot',

        /**
         * Calculates the dot product of two vec3's
         * @param {vec3} vec
         */
        value: function dot(vec) {
            var _out2 = slicedToArray(this._out, 3),
                x0 = _out2[0],
                y0 = _out2[1],
                z0 = _out2[2],
                _vec$_out2 = slicedToArray(vec._out, 3),
                x1 = _vec$_out2[0],
                y1 = _vec$_out2[1],
                z1 = _vec$_out2[2];

            return x0 * x1 + y0 * y1 + z0 * z1;
        }
    }, {
        key: 'cross',

        /**
         * Computes the cross product of two vec3's
         */
        value: function cross(vec) {
            var _out3 = slicedToArray(this._out, 3),
                ax = _out3[0],
                ay = _out3[1],
                az = _out3[2],
                _vec$_out3 = slicedToArray(vec._out, 3),
                bx = _vec$_out3[0],
                by = _vec$_out3[1],
                bz = _vec$_out3[2];

            this._out[0] = ay * bz - az * by;
            this._out[1] = az * bx - ax * bz;
            this._out[2] = ax * by - ay * bx;
            return this;
        }
    }, {
        key: 'lerp',

        /**
         * Performs a linear interpolation between two vec3's
         * @param {vec3} vec
         * @param {number} t
         */
        value: function lerp(vec, t) {
            var _out4 = slicedToArray(this._out, 3),
                ax = _out4[0],
                ay = _out4[1],
                az = _out4[2],
                _vec$_out4 = slicedToArray(vec._out, 3),
                bx = _vec$_out4[0],
                by = _vec$_out4[1],
                bz = _vec$_out4[2];

            this._out[0] = ax + t * (bx - ax);
            this._out[1] = ay + t * (by - ay);
            this._out[2] = az + t * (bz - az);
            return this;
        }
    }, {
        key: 'hermite',

        /**
         * Performs a hermite interpolation with two control points
         * @param {vec3} vecI
         * @param {vec3} vecI
         * @param {vec3} vecI
         * @param {number} t interpolation amount between the two inputs
         */
        value: function hermite(vecI, vecII, vecIII, t) {
            var factorTimes2 = t * t,
                factor1 = factorTimes2 * (2 * t - 3) + 1,
                factor2 = factorTimes2 * (t - 2) + t,
                factor3 = factorTimes2 * (t - 1),
                factor4 = factorTimes2 * (3 - 2 * t);
            this._out[0] = this._out[0] * factor1 + vecI._out[0] * factor2 + vecII._out[0] * factor3 + vecIII._out[0] * factor4;
            this._out[1] = this._out[1] * factor1 + vecI._out[1] * factor2 + vecII._out[1] * factor3 + vecIII._out[1] * factor4;
            this._out[2] = this._out[2] * factor1 + vecI._out[2] * factor2 + vecII._out[2] * factor3 + vecIII._out[2] * factor4;
            return this;
        }
    }, {
        key: 'bezier',

        /**
         * Performs a bezier interpolation with two control points
         * @param {vec3} vecI
         * @param {vec3} vecII
         * @param {vec3} vecIII
         * @param {Number} t interpolation amount between the two inputs
         */
        value: function bezier(vecI, vecII, vecIII, t) {
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
            return this;
        }
    }, {
        key: 'transformMat4',

        /**
         * Transforms the vec3 with a mat4.
         * 4th vector component is implicitly '1'
         * @param {mat4} mat the 4x4 matrix to transform with
         */
        value: function transformMat4(mat) {
            var _out5 = slicedToArray(this._out, 3),
                x = _out5[0],
                y = _out5[1],
                z = _out5[2],
                w = mat._out[3] * x + mat._out[7] * y + mat._out[11] * z + mat._out[15] || 1.0;

            this._out[0] = (mat._out[0] * x + mat._out[4] * y + mat._out[8] * z + mat._out[12]) / w;
            this._out[1] = (mat._out[1] * x + mat._out[5] * y + mat._out[9] * z + mat._out[13]) / w;
            this._out[2] = (mat._out[2] * x + mat._out[6] * y + mat._out[10] * z + mat._out[14]) / w;
            return this;
        }
    }, {
        key: 'transformMat3',

        /**
         * Transforms the vec3 with a mat3.
         * @param {mat3} mat  the 3x3 matrix to transform with
         */
        value: function transformMat3(mat) {
            var _out6 = slicedToArray(this._out, 3),
                x = _out6[0],
                y = _out6[1],
                z = _out6[2];

            this._out[0] = x * mat._out[0] + y * mat._out[3] + z * mat._out[6];
            this._out[1] = x * mat._out[1] + y * mat._out[4] + z * mat._out[7];
            this._out[2] = x * mat._out[2] + y * mat._out[5] + z * mat._out[8];
            return this;
        }
    }, {
        key: 'toString',

        /**
         * returns a string represent vec3
         */
        value: function toString() {
            return 'vec3(' + this._out[0] + ', ' + this._out[1] + ', ' + this._out[2] + ')';
        }
    }, {
        key: 'transformQuat',

        /**
         * ransforms the vec3 with a quat
         * benchmarks: http://jsperf.com/quaternion-transform-vec3-implementations
         * @param {quat} q quaternion to transform with
         */
        value: function transformQuat(q) {
            var _out7 = slicedToArray(this._out, 3),
                x = _out7[0],
                y = _out7[1],
                z = _out7[2],
                _q$_out = slicedToArray(q._out, 4),
                qx = _q$_out[0],
                qy = _q$_out[1],
                qz = _q$_out[2],
                qw = _q$_out[3],
                ix = qw * x + qy * z - qz * y,
                iy = qw * y + qz * x - qx * z,
                iz = qw * z + qx * y - qy * x,
                iw = -qx * x - qy * y - qz * z;

            this._out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
            this._out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
            this._out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
            return this;
        }
    }, {
        key: 'rotateX',

        /**
         * Rotate a 3D vector around the x-axis
         * @param {vec3} vec the origin of the rotation
         * @param {number} c the angle of rotation
         */
        value: function rotateX(vec, c) {
            var p = [],
                r = [];
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
        }
    }, {
        key: 'rotateY',

        /**
         * Rotate a 3D vector around the y-axis
         * @param {vec3} vec The origin of the rotation
         * @param {number} c The angle of rotation
         */
        value: function rotateY(vec, c) {
            var p = [],
                r = [];
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
        }
    }, {
        key: 'rotateZ',

        /**
         * Rotate a 3D vector around the z-axis
         * @param {vec3} vec The origin of the rotation
         * @param {number} c the angle of rotation
         */
        value: function rotateZ(vec, c) {
            var p = [],
                r = [];
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
        }
    }, {
        key: 'angle',

        /**
         * calcute the angle between two 3D vectors
         * @param {vec3} vec the second vector
         */
        value: function angle(vec) {
            var vecI = this.clone().normalize(),
                vecII = vec.clone().normalize();
            var cosine = vec3.dot(vecI, vecII);
            if (cosine > 1.0) return 0;else if (cosine < -1.0) return Math.PI;else return Math.acos(cosine);
        }
    }, {
        key: 'equals',

        /**
         * Returns whether or not the vectors have approximately the same elements in the same position.
         */
        value: function equals(vec) {
            var _out8 = slicedToArray(this._out, 3),
                a0 = _out8[0],
                a1 = _out8[1],
                a2 = _out8[2],
                _vec$_out5 = slicedToArray(vec._out, 3),
                b0 = _vec$_out5[0],
                b1 = _vec$_out5[1],
                b2 = _vec$_out5[2];

            return Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2));
        }
    }], [{
        key: 'random',

        /**
         * Generates a random vector with the given scale
         * @param {number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
         */
        value: function random() {
            var scale = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1.0;

            var vec = new vec3();
            scale = scale || 1.0;
            var r = matrix.RANDOM() * 2.0 * Math.PI;
            var z = matrix.RANDOM() * 2.0 - 1.0;
            var z = Math.sqrt(1.0 - z * z) * scale;
            ax = Math.cos(r) * zScale;
            ay = Math.sin(r) * zScale;
            az = z * scale;
            vec.set(ax, ay, az);
            return vec;
        }
    }]);
    return vec3;
}();

/**
 * reference https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/vec4.js
 * switch to es6 syntax
 * warning:if you don't want to change the source value,please use mat.clone().* instead of mat.*
 * @author yellow 2017.5.9
 */
/**
 * @class 4 Dimensional Vector
 * @name vec4
 */

var vec4 = function () {
    /**
     *  Creates a new, empty vec4
     */
    function vec4() {
        classCallCheck(this, vec4);

        this._out = new glMatrix.ARRAY_TYPE(4);
        this._out[0] = 0;
        this._out[1] = 0;
        this._out[2] = 0;
        this._out[3] = 0;
        return this;
    }
    /**
     * private vec4 array store
     */


    createClass(vec4, [{
        key: 'set',

        /**
         * set the value of vec4
         */
        value: function set$$1(x, y, z, w) {
            this._out[0] = x;
            this._out[1] = y;
            this._out[2] = z;
            this._out[3] = w;
            return this;
        }
    }, {
        key: 'clone',

        /**
         * Creates a new vec4 initialized with values from an existing vector
         */
        value: function clone() {
            var vec = new vec4();
            vec.set(this._out[0], this._out[1], this._out[2], this._out[3]);
            return vec;
        }
    }, {
        key: 'add',

        /**
         * Adds two vec4's
         * @param {vec4} vec
         */
        value: function add(vec) {
            this._out[0] += vec._out[0];
            this._out[1] += vec._out[1];
            this._out[2] += vec._out[2];
            this._out[3] += vec._out[3];
            return this;
        }
    }, {
        key: 'sub',

        /**
         * Subtracts vector vec from vector this
         */
        value: function sub(vec) {
            this._out[0] -= vec._out[0];
            this._out[1] -= vec._out[1];
            this._out[2] -= vec._out[2];
            this._out[3] -= vec._out[3];
            return this;
        }
    }, {
        key: 'multiply',

        /**
         * Multiplies two vec4's
         */
        value: function multiply(vec) {
            this._out[0] *= vec._out[0];
            this._out[1] *= vec._out[1];
            this._out[2] *= vec._out[2];
            this._out[3] *= vec._out[3];
            return this;
        }
    }, {
        key: 'divide',

        /**
        * Divides two vec4's
        */
        value: function divide(vec) {
            this._out[0] /= vec._out[0];
            this._out[1] /= vec._out[1];
            this._out[2] /= vec._out[2];
            this._out[3] /= vec._out[3];
            return this;
        }
    }, {
        key: 'ceil',

        /**
         * Math.ceil the components of a vec4
         */
        value: function ceil() {
            this._out[0] = Math.ceil(this._out[0]);
            this._out[1] = Math.ceil(this._out[1]);
            this._out[2] = Math.ceil(this._out[2]);
            this._out[3] = Math.ceil(this._out[3]);
            return this;
        }
    }, {
        key: 'round',

        /**
         * Math.round the components of a vec4
         */
        value: function round() {
            this._out[0] = Math.round(this._out[0]);
            this._out[1] = Math.round(this._out[1]);
            this._out[2] = Math.round(this._out[2]);
            this._out[3] = Math.round(this._out[3]);
            return this;
        }
    }, {
        key: 'floor',

        /**
        * Math.floor the components of a vec4
        */
        value: function floor() {
            this._out[0] = Math.floor(this._out[0]);
            this._out[1] = Math.floor(this._out[1]);
            this._out[2] = Math.floor(this._out[2]);
            this._out[3] = Math.floor(this._out[3]);
            return this;
        }
    }, {
        key: 'min',

        /**
         * Returns the minimum of two vec4's
         * @param {vec4} vec
         */
        value: function min(vec) {
            this._out[0] = Math.min(this._out[0], vec._out[0]);
            this._out[1] = Math.min(this._out[1], vec._out[1]);
            this._out[2] = Math.min(this._out[2], vec._out[2]);
            this._out[3] = Math.min(this._out[3], vec._out[3]);
            return this;
        }
    }, {
        key: 'max',

        /**
         * Returns the maximum of two vec4's
         * @param {vec4} vec
         */
        value: function max(vec) {
            this._out[0] = Math.max(this._out[0], vec._out[0]);
            this._out[1] = Math.max(this._out[1], vec._out[1]);
            this._out[2] = Math.max(this._out[2], vec._out[2]);
            this._out[3] = Math.max(this._out[3], vec._out[3]);
            return this;
        }
    }, {
        key: 'scale',

        /**
         * Scales a vec4 by a scalar number
         * @param {number} s the scale
         */
        value: function scale(s) {
            this._out[0] *= s;
            this._out[1] *= s;
            this._out[2] *= s;
            this._out[3] *= s;
            return this;
        }
    }, {
        key: 'distance',

        /**
         * Calculates the euclidian distance between two vec4's
         * @param {vec4} vec the distance to vec
         */
        value: function distance(vec) {
            var _out = slicedToArray(this._out, 4),
                x0 = _out[0],
                y0 = _out[1],
                z0 = _out[2],
                w0 = _out[3],
                _vec$_out = slicedToArray(vec._out, 4),
                x1 = _vec$_out[0],
                y1 = _vec$_out[1],
                z1 = _vec$_out[2],
                w1 = _vec$_out[3],
                x = x0 - x1,
                y = y0 - y1,
                z = z0 - z1,
                w = w0 - w1;

            return Math.sqrt(x * x + y * y + z * z + w * w);
        }
    }, {
        key: 'len',

        /**
         * Calculates the length of a vec4
         */
        value: function len() {
            return this.distance(new vec4());
        }
    }, {
        key: 'negate',

        /**
         * Negates the components of a vec4
         */
        value: function negate() {
            this._out[0] = -this._out[0];
            this._out[1] = -this._out[1];
            this._out[2] = -this._out[2];
            this._out[3] = -this._out[3];
            return this;
        }
    }, {
        key: 'inverse',

        /**
         * Returns the inverse of the components of a vec4
         */
        value: function inverse() {
            this._out[0] = 1.0 / this._out[0];
            this._out[1] = 1.0 / this._out[1];
            this._out[2] = 1.0 / this._out[2];
            this._out[3] = 1.0 / this._out[3];
        }
    }, {
        key: 'normalize',

        /**
         * Normalize a vec4
         */
        value: function normalize() {
            var len = this.len();
            if (len > 0) {
                len = 1.0 / len;
                this._out[0] *= len;
                this._out[1] *= len;
                this._out[2] *= len;
                this._out[3] *= len;
            }
            return this;
        }
    }, {
        key: 'dot',

        /**
         * @param {vec4} vec
         */
        value: function dot(vec) {
            var _out2 = slicedToArray(this._out, 4),
                x0 = _out2[0],
                y0 = _out2[1],
                z0 = _out2[2],
                w0 = _out2[3],
                _vec$_out2 = slicedToArray(vec._out, 4),
                x1 = _vec$_out2[0],
                y1 = _vec$_out2[1],
                z1 = _vec$_out2[2],
                w1 = _vec$_out2[3];

            return x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1;
        }
    }, {
        key: 'lerp',

        /**
         *  Performs a linear interpolation between two vec4's
         */
        value: function lerp(vec, t) {
            var _out3 = slicedToArray(this._out, 4),
                ax = _out3[0],
                ay = _out3[1],
                az = _out3[2],
                aw = _out3[3];

            this._out[0] = ax + t * (vec._out[0] - ax);
            this._out[1] = ay + t * (vec._out[1] - ay);
            this._out[2] = az + t * (vec._out[2] - az);
            this._out[3] = aw + t * (vec._out[3] - aw);
            return this;
        }
    }, {
        key: 'transformMat4',

        /**
         * Transforms the vec4 with a mat4.
         * @param {mat4} mat matrix to transform with
         */
        value: function transformMat4(mat) {
            var _out4 = slicedToArray(this._out, 4),
                x = _out4[0],
                y = _out4[1],
                z = _out4[2],
                w = _out4[3];

            this._out[0] = mat._out[0] * x + mat._out[4] * y + mat._out[8] * z + mat._out[12] * w;
            this._out[1] = mat._out[1] * x + mat._out[5] * y + mat._out[9] * z + mat._out[13] * w;
            this._out[2] = mat._out[2] * x + mat._out[6] * y + mat._out[10] * z + mat._out[14] * w;
            this._out[3] = mat._out[3] * x + mat._out[7] * y + mat._out[11] * z + mat._out[15] * w;
            return this;
        }
    }, {
        key: 'transformQuat',

        /**
         * Transforms the vec4 with a quat
         * @param {quat} q quaternion to transform with
         */
        value: function transformQuat(q) {
            var _out5 = slicedToArray(this._out, 4),
                x = _out5[0],
                y = _out5[1],
                z = _out5[2],
                w = _out5[3],
                _q$_out = slicedToArray(q._out, 4),
                qx = _q$_out[0],
                qy = _q$_out[1],
                qz = _q$_out[2],
                qw = _q$_out[3],
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
        }
    }, {
        key: 'toString',

        /**
         * Returns a string representation of a vector
         */
        value: function toString() {
            return 'vec4(' + this._out[0] + ', ' + this._out[1] + ', ' + this._out[2] + ', ' + this._out[3] + ')';
        }
    }, {
        key: 'equals',

        /**
         * Returns whether or not the vectors have approximately the same elements in the same position.
         * @param {vec4} vec
         */
        value: function equals(vec) {
            var _out6 = slicedToArray(this._out, 4),
                a0 = _out6[0],
                a1 = _out6[1],
                a2 = _out6[2],
                a3 = _out6[3],
                _vec$_out3 = slicedToArray(vec._out, 4),
                b0 = _vec$_out3[0],
                b1 = _vec$_out3[1],
                b2 = _vec$_out3[2],
                b3 = _vec$_out3[3];

            return Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3));
        }
    }], [{
        key: 'random',

        /**
         * Generates a random vector with the given scale
         * @param {number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
         */
        value: function random() {
            var scale = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1.0;

            scale = scale || 1.0;
            var vec = new vec4();
            //TODO: This is a pretty awful way of doing this. Find something better.
            vec.set(matrix.RANDOM(), matrix.RANDOM(), matrix.RANDOM(), matrix.RANDOM()).normalize().scale();
            return vec;
        }
    }]);
    return vec4;
}();

/**
 * reference https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/quat.js
 * switch to es6 syntax
 * warning:if you don't want to change the source value,please use mat.clone().* instead of mat.*
 * @author yellow 2017/5/10
 */

/**
 * @class Quaternion
 * @name quat
 */

var quat = function () {
    /**
     * Creates a new identity quat
     */
    function quat() {
        var _this = this;

        classCallCheck(this, quat);

        this.rotationTo = function () {
            var tmpvec3 = new vec3(),
                xUnitVec3 = new vec3().set(1, 0, 0),
                yUnitVec3 = new vec3().set(0, 1, 0);
            return function (vecI, vecII) {
                var dot = vecI.dot(vecII);
                if (dot < -0.999999) {
                    tmpvec3 = xUnitVec3.clone().cross(vecI);
                    if (tmpvec3.len() < 0.000001) {
                        tmpvec3 = yUnitVec3.clone().cross(vecI);
                    }
                    tmpvec3.normalize();
                    _this.setAxisAngle(tmpvec3, Math.PI);
                    return _this;
                } else if (dot > 0.999999) {
                    _this._out[0] = 0;
                    _this._out[1] = 0;
                    _this._out[2] = 0;
                    _this._out[3] = 1;
                    return _this;
                } else {
                    tmpvec3 = vecI.clone().cross(vecII);
                    _this._out[0] = tmpvec3[0];
                    _this._out[1] = tmpvec3[1];
                    _this._out[2] = tmpvec3[2];
                    _this._out[3] = 1 + dot;
                    return _this.normalize();
                }
            };
        }();

        this.setAxes = function () {
            var mat = new mat3();

            return function (vecView, vecRight, vecUp) {
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
            };
        }();

        this.sqlerp = function () {
            var temp1 = new quat(),
                temp2 = new quat();
            return function (quaI, quaII, quaIII, t) {
                //a.slerp(d,t)  b.slerp(c,t)
                temp1 = _this.clone().slerp(quaIII, t);
                temp2 = quaI.clone().slerp(quaII, t);
                var qua = temp1.clone().slerp(temp2, 2 * t * (1 - t));
                return qua;
            };
        }();

        this._out = new matrix.ARRAY_TYPE(4);
        this._out[0] = 0;
        this._out[1] = 0;
        this._out[2] = 0;
        this._out[3] = 1;
    }

    createClass(quat, [{
        key: 'set',

        /**
         * set the value of quat
         */
        value: function set$$1(x, y, z, w) {
            this._out[0] = x;
            this._out[1] = y;
            this._out[2] = z;
            this._out[3] = w;
            return this;
        }
    }, {
        key: 'clone',

        /**
         * Creates a new quat initialized with values from an existing quaternion
         */
        value: function clone() {
            var qua = new quat();
            qua.set(qua._out[0], qua._out[1], qua._out[2], qua._out[3]);
            return qua;
        }
    }, {
        key: 'identity',

        /**
         * Set a quat to the identity quaternion
         */
        value: function identity() {
            this._out[0] = 0;
            this._out[1] = 0;
            this._out[2] = 0;
            this._out[3] = 1;
            return this;
        }
        /**
         * @param {vec3} vecI the initial vector
         * @param {vec3} vecII the destination vector
         * 
         */

        /**
         * Sets the specified quaternion with values corresponding to the given
         * axes. Each axis is a vec3 and is expected to be unit length and
         * perpendicular to all other specified axes.
         * @param {vec3} vecView  the vector representing the viewing direction
         * @param {vec3} vecRight the vector representing the local "right" direction
         * @param {vec3} vecUp    the vector representing the local "up" direction
         */

    }, {
        key: 'setAxisAngle',

        /**
         * Sets a quat from the given angle and rotation axis,
         * then returns it.
         * @param {vec3} axis the axis around which to rotate
         * @param {number} rad
         */
        value: function setAxisAngle(axis, rad) {
            rad = rad * 0.5;
            var s = Math.sin(rad);
            this._out[0] = s * axis._out[0];
            this._out[1] = s * axis._out[1];
            this._out[2] = s * axis._out[2];
            this._out[3] = Math.cos(rad);
            return this;
        }
    }, {
        key: 'getAxisAngle',

        /**
         * Gets the rotation axis and angle for a given quaternion. 
         * If a quaternion is created with setAxisAngle, 
         * this method will return the same values as providied in the original parameter list OR functionally equivalent values.
         * @example The quaternion formed by axis [0, 0, 1] and angle -90 is the same as the quaternion formed by [0, 0, 1] and 270. 
         *          This method favors the latter.
         * @return [axis,angle]
         */
        value: function getAxisAngle() {
            var rad = Math.acos(this._out[3]) * 2.0,
                s = Math.sin(rad / 2.0);
            var axis = new vec3();
            s === 0.0 ? axis.set(1, 0, 0) : axis.set(q[0] / s, q[1] / s, q[2] / s);
            return [axis, rad];
        }
    }, {
        key: 'add',

        /**
         * add two quat's
         * @param {quat} qua 
         */
        value: function add(qua) {
            this._out[0] += qua._out[0];
            this._out[1] += qua._out[1];
            this._out[2] += qua._out[2];
            this._out[3] += qua._out[3];
            return this;
        }
    }, {
        key: 'multiply',

        /**
         * Multiplies two quat's
         */
        value: function multiply(qua) {
            var _out = slicedToArray(this._out, 4),
                ax = _out[0],
                ay = _out[1],
                az = _out[2],
                aw = _out[3],
                _qua$_out = slicedToArray(qua._out, 4),
                bx = _qua$_out[0],
                by = _qua$_out[1],
                bz = _qua$_out[2],
                bw = _qua$_out[3];

            this._out[0] = ax * bw + aw * bx + ay * bz - az * by;
            this._out[1] = ay * bw + aw * by + az * bx - ax * bz;
            this._out[2] = az * bw + aw * bz + ax * by - ay * bx;
            this._out[3] = aw * bw - ax * bx - ay * by - az * bz;
            return this;
        }
    }, {
        key: 'scale',

        /**
         * @param {number} s
         */
        value: function scale(s) {
            this._out[0] *= s;
            this._out[1] *= s;
            this._out[2] *= s;
            this._out[3] *= s;
            return this;
        }
    }, {
        key: 'rotateX',

        /**
         * Rotates a quaternion by the given angle about the X axis
         * @param {number} rad angle (in radians) to rotate
         */
        value: function rotateX(rad) {
            rad *= 0.5;

            var _out2 = slicedToArray(this._out, 4),
                ax = _out2[0],
                ay = _out2[1],
                az = _out2[2],
                aw = _out2[3],
                bx = Math.sin(rad),
                bw = Math.cos(rad);

            this._out[0] = ax * bw + aw * bx;
            this._out[1] = ay * bw + az * bx;
            this._out[2] = az * bw - ay * bx;
            this._out[3] = aw * bw - ax * bx;
            return this;
        }
    }, {
        key: 'rotateY',

        /**
         * Rotates a quaternion by the given angle about the Y axis
         * @param {number} rad angle (in radians) to rotate
         */
        value: function rotateY(rad) {
            rad *= 0.5;

            var _out3 = slicedToArray(this._out, 4),
                ax = _out3[0],
                ay = _out3[1],
                az = _out3[2],
                aw = _out3[3],
                by = Math.sin(rad),
                bw = Math.cos(rad);

            this._out[0] = ax * bw - az * by;
            this._out[1] = ay * bw + aw * by;
            this._out[2] = az * bw + ax * by;
            this._out[3] = aw * bw - ay * by;
            return this;
        }
    }, {
        key: 'rotateZ',

        /**
         * Rotates a quaternion by the given angle about the Z axis
         * @param {number} rad angle (in radians) to rotate
         */
        value: function rotateZ(rad) {
            rad *= 0.5;

            var _out4 = slicedToArray(this._out, 4),
                ax = _out4[0],
                ay = _out4[1],
                az = _out4[2],
                aw = _out4[3],
                bz = Math.sin(rad),
                bw = Math.cos(rad);

            out[0] = ax * bw + ay * bz;
            this._out[1] = ay * bw - ax * bz;
            this._out[2] = az * bw + aw * bz;
            this._out[3] = aw * bw - az * bz;
            return this;
        }
    }, {
        key: 'calculateW',

        /**
         * Calculates the W component of a quat from the X, Y, and Z components.
         * Assumes that quaternion is 1 unit in length
         * Any existing W component will be ignored.
         */
        value: function calculateW() {
            var _out5 = slicedToArray(this._out, 4),
                x = _out5[0],
                y = _out5[1],
                z = _out5[2],
                w = _out5[3];

            this._out[3] = Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
            return this;
        }
    }, {
        key: 'dot',

        /**
         * Calculates the dot product of two quat's
         * @return {number} dot product of two quat's
         */
        value: function dot(qua) {
            var _out6 = slicedToArray(this._out, 4),
                x0 = _out6[0],
                y0 = _out6[1],
                z0 = _out6[2],
                w0 = _out6[3],
                _qua$_out2 = slicedToArray(qua._out, 4),
                x1 = _qua$_out2[0],
                y1 = _qua$_out2[1],
                z1 = _qua$_out2[2],
                w1 = _qua$_out2[3];

            return x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1;
        }
    }, {
        key: 'lerp',

        /**
         * Performs a linear interpolation between two quat's
         * @param {quat} qua the second operand
         * @param {Number} t interpolation amount between the two inputs
         */
        value: function lerp(qua, t) {
            var _out7 = slicedToArray(this._out, 4),
                ax = _out7[0],
                ay = _out7[1],
                az = _out7[2],
                aw = _out7[3];

            this._out[0] = ax + t * (qua._out[0] - ax);
            this._out[1] = ay + t * (qua._out[1] - ay);
            this._out[2] = az + t * (qua._out[2] - az);
            this._out[3] = aw + t * (qua._out[3] - aw);
            return this;
        }
    }, {
        key: 'slerp',

        /**
         * Performs a spherical linear interpolation between two quat
         * benchmarks: http://jsperf.com/quaternion-slerp-implementations
         */
        value: function slerp(qua, t) {
            var _out8 = slicedToArray(this._out, 4),
                ax = _out8[0],
                ay = _out8[1],
                az = _out8[2],
                aw = _out8[3],
                _qua$_out3 = slicedToArray(qua._out, 4),
                bx = _qua$_out3[0],
                by = _qua$_out3[1],
                bz = _qua$_out3[2],
                bw = _qua$_out3[3];

            var omega = void 0,
                cosom = void 0,
                sinom = void 0,
                scale0 = void 0,
                scale1 = void 0;
            // calc cosine
            cosom = ax * bx + ay * by + az * bz + aw * bw;
            // adjust signs (if necessary)
            if (cosom < 0.0) {
                cosom = -cosom;
                bx = -bx;
                by = -by;
                bz = -bz;
                bw = -bw;
            }
            // calculate coefficients
            if (1.0 - cosom > 0.000001) {
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
        }
        /**
         * Performs a spherical linear interpolation with two control points
         * @param {quat} quaI
         * @param {quat} quaII
         * @param {quat} quaIII
         * @return
         */

    }, {
        key: 'invert',

        /**
         * Calculates the inverse of a quat
         * @return {quat} the inversed quat 
         */
        value: function invert() {
            var _out9 = slicedToArray(this._out, 4),
                a0 = _out9[0],
                a1 = _out9[1],
                a2 = _out9[2],
                a3 = _out9[3],
                dot = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3,
                invDot = dot ? 1.0 / dot : 0;

            this._out[0] = -a0 * invDot;
            this._out[1] = -a1 * invDot;
            this._out[2] = -a2 * invDot;
            this._out[3] = a3 * invDot;
            return this;
        }
    }, {
        key: 'conjugate',

        /**
         * Calculates the conjugate of a quat
         * If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
         */
        value: function conjugate() {
            this._out[0] = -this._out[0];
            this._out[1] = -this._out[1];
            this._out[2] = -this._out[2];
            //this._out[3] = this._out[3]; omit to reduce assignment operation
            return this;
        }
    }, {
        key: 'len',

        /**
         * retrun the length of quat
         * @return {number} 
         */
        value: function len() {
            var _out10 = slicedToArray(this._out, 4),
                x = _out10[0],
                y = _out10[1],
                z = _out10[2],
                w = _out10[3];

            return Math.sqrt(x * x + y * y + z * z + w * w);
        }
    }, {
        key: 'normalize',

        /**
         * Normalize a quat
         */
        value: function normalize() {
            var len = this.len();
            if (len > 0) {
                len = 1.0 / len;
                this._out[0] *= len;
                this._out[0] *= len;
                this._out[0] *= len;
                this._out[0] *= len;
            }
            return this;
        }
    }, {
        key: 'toString',

        /**
         * Returns a string representation of a quatenion
         * @returns {String} string representation of the vector
         */
        value: function toString() {
            return 'quat(' + this._out[0] + ', ' + this._out[1] + ', ' + this._out[2] + ', ' + this._out[3] + ')';
        }
    }, {
        key: 'equals',

        /**
         * Returns whether or not the quat have approximately the same elements in the same position.
         * @param 
         */
        value: function equals(qua) {
            var _out11 = slicedToArray(this._out, 4),
                a0 = _out11[0],
                a1 = _out11[1],
                a2 = _out11[2],
                a3 = _out11[3],
                _qua$_out4 = slicedToArray(qua._out, 4),
                b0 = _qua$_out4[0],
                b1 = _qua$_out4[1],
                b2 = _qua$_out4[2],
                b3 = _qua$_out4[3];

            return Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3));
        }
    }], [{
        key: 'fromMat3',

        /**
         * generic a quat from mat3
         * @param {mat3} mat the 3x3 matrix 
         */
        value: function fromMat3(mat) {
            // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
            // article "Quaternion Calculus and Fast Animation".
            var fTrace = mat._out[0] + mat._out[4] + mat._out[8],
                qua = new quat(),
                fRoot = void 0;
            if (fTrace > 0.0) {
                // |w| > 1/2, may as well choose w > 1/2
                fRoot = Math.sqrt(fTrace + 1.0); // 2w
                out[3] = 0.5 * fRoot;
                fRoot = 0.5 / fRoot; // 1/(4w)
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
        }
    }]);
    return quat;
}();

/**
 * reference https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/mat4.js
 * switch to es6 syntax
 * warning:if you don't want to change the source value,please use mat.clone().* instead of mat.* (* means matrix operations)
 * @author yellow 2017/5/10
 */
/**
 * @class 4x4 Matrix
 * @name mat4
 */

var mat4 = function () {
    /**
     *  Creates a new identity mat4
     */
    function mat4() {
        var _this = this;

        classCallCheck(this, mat4);

        this.transpose = function () {
            return matrix.USE_SIMD ? function () {
                var a0 = void 0,
                    a1 = void 0,
                    a2 = void 0,
                    a3 = void 0,
                    tmp01 = void 0,
                    tmp23 = void 0,
                    out0 = void 0,
                    out1 = void 0,
                    out2 = void 0,
                    out3 = void 0;
                //simd load all 4x4 matrix data
                r0 = SIMD.Float32x4.load(_this._out, 0);
                r1 = SIMD.Float32x4.load(_this._out, 4);
                r2 = SIMD.Float32x4.load(_this._out, 8);
                r3 = SIMD.Float32x4.load(_this._out, 12);
                //cause this._out[0],this._out[4],this._out[8],this._out[12] distribute in
                //r0 r1 r2 r3,but shuffle only accept two paramters,so...it need two tempary arrays
                tmp01 = SIMD.Float32x4.shuffle(a0, a1, 0, 1, 4, 5);
                tmp23 = SIMD.Float32x4.shuffle(a2, a3, 0, 1, 4, 5);
                out0 = SIMD.Float32x4.shuffle(tmp01, tmp23, 0, 2, 4, 6);
                out1 = SIMD.Float32x4.shuffle(tmp01, tmp23, 1, 3, 5, 7);
                SIMD.Float32x4.store(_this._out, 0, out0);
                SIMD.Float32x4.store(_this._out, 4, out1);
                //
                tmp01 = SIMD.Float32x4.shuffle(a0, a1, 2, 3, 6, 7);
                tmp23 = SIMD.Float32x4.shuffle(a2, a3, 2, 3, 6, 7);
                out2 = SIMD.Float32x4.shuffle(tmp01, tmp23, 0, 2, 4, 6);
                out3 = SIMD.Float32x4.shuffle(tmp01, tmp23, 1, 3, 5, 7);
                SIMD.Float32x4.store(_this._out, 8, out2);
                SIMD.Float32x4.store(_this._out, 12, out3);
                return _this;
            } : function () {
                var _ref = [_this._out[0], _this._out[4], _this._out[8], _this._out[12], _this._out[1], _this._out[5], _this._out[9], _this._out[13], _this._out[2], _this._out[6], _this._out[10], _this._out[14], _this._out[3], _this._out[7], _this._out[11], _this._out[15]];
                //deconstruction assignment

                _this._out[0] = _ref[0];
                _this._out[1] = _ref[1];
                _this._out[2] = _ref[2];
                _this._out[3] = _ref[3];
                _this._out[4] = _ref[4];
                _this._out[5] = _ref[5];
                _this._out[6] = _ref[6];
                _this._out[7] = _ref[7];
                _this._out[8] = _ref[8];
                _this._out[9] = _ref[9];
                _this._out[10] = _ref[10];
                _this._out[11] = _ref[11];
                _this._out[12] = _ref[12];
                _this._out[13] = _ref[13];
                _this._out[14] = _ref[14];
                _this._out[15] = _ref[15];

                return _this;
            };
        }();

        this.invert = function () {
            //deconstruction assignment
            return function () {
                var _out = slicedToArray(_this._out, 16),
                    a00 = _out[0],
                    a01 = _out[1],
                    a02 = _out[2],
                    a03 = _out[3],
                    a10 = _out[4],
                    a11 = _out[5],
                    a12 = _out[6],
                    a13 = _out[7],
                    a20 = _out[8],
                    a21 = _out[9],
                    a22 = _out[10],
                    a23 = _out[11],
                    a30 = _out[12],
                    a31 = _out[13],
                    a32 = _out[14],
                    a33 = _out[15],
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
                    det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

                if (!det) {
                    return null;
                }
                det = 1.0 / det;
                var _ref2 = [(a11 * b11 - a12 * b10 + a13 * b09) * det, (a02 * b10 - a01 * b11 - a03 * b09) * det, (a31 * b05 - a32 * b04 + a33 * b03) * det, (a22 * b04 - a21 * b05 - a23 * b03) * det, (a12 * b08 - a10 * b11 - a13 * b07) * det, (a00 * b11 - a02 * b08 + a03 * b07) * det, (a32 * b02 - a30 * b05 - a33 * b01) * det, (a20 * b05 - a22 * b02 + a23 * b01) * det, (a10 * b10 - a11 * b08 + a13 * b06) * det, (a01 * b08 - a00 * b10 - a03 * b06) * det, (a30 * b04 - a31 * b02 + a33 * b00) * det, (a21 * b02 - a20 * b04 - a23 * b00) * det, (a11 * b07 - a10 * b09 - a12 * b06) * det, (a00 * b09 - a01 * b07 + a02 * b06) * det, (a31 * b01 - a30 * b03 - a32 * b00) * det, (a20 * b03 - a21 * b01 + a22 * b00) * det];
                _this._out[0] = _ref2[0];
                _this._out[1] = _ref2[1];
                _this._out[2] = _ref2[2];
                _this._out[3] = _ref2[3];
                _this._out[4] = _ref2[4];
                _this._out[5] = _ref2[5];
                _this._out[6] = _ref2[6];
                _this._out[7] = _ref2[7];
                _this._out[8] = _ref2[8];
                _this._out[9] = _ref2[9];
                _this._out[10] = _ref2[10];
                _this._out[11] = _ref2[11];
                _this._out[12] = _ref2[12];
                _this._out[13] = _ref2[13];
                _this._out[14] = _ref2[14];
                _this._out[15] = _ref2[15];

                return _this;
            };
        }();

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
    }
    /**
     * private 4x4 matrix array store
     */


    createClass(mat4, [{
        key: 'set',

        /**
         * set the value of 4x4 matrix
         */
        value: function set$$1(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
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
        }
    }, {
        key: 'clone',

        /**
         * Creates a new mat4 initialized with values from an existing matrix
         */
        value: function clone() {
            var mat = new mat4();
            mat.set(this._out[0], this._out[1], this._out[2], this._out[3], this._out[4], this._out[5], this._out[6], this._out[7], this._out[8], this._out[9], this._out[10], this._out[11], this._out[12], this._out[13], this._out[14], this._out[15]);
            return mat;
        }
    }, {
        key: 'identity',

        /**
         * Set a mat4 to the identity matrix
         */
        value: function identity() {
            this.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
            return this;
        }
        /**
         * Transpose the values of a mat4 
         */

        /**
         * Inverts a mat4
         */

    }, {
        key: 'adjoint',

        /**
         * Calculates the adjugate of a mat4 not using SIMD
         */
        value: function adjoint() {
            var _out2 = slicedToArray(this._out, 16),
                a00 = _out2[0],
                a01 = _out2[1],
                a02 = _out2[2],
                a03 = _out2[3],
                a10 = _out2[4],
                a11 = _out2[5],
                a12 = _out2[6],
                a13 = _out2[7],
                a20 = _out2[8],
                a21 = _out2[9],
                a22 = _out2[10],
                a23 = _out2[11],
                a30 = _out2[12],
                a31 = _out2[13],
                a32 = _out2[14],
                a33 = _out2[15];

            this._out[0] = a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22);
            this._out[1] = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
            this._out[2] = a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12);
            this._out[3] = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
            this._out[4] = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
            this._out[5] = a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22);
            this._out[6] = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
            this._out[7] = a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12);
            this._out[8] = a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21);
            this._out[9] = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
            this._out[10] = a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11);
            this._out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
            this._out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
            this._out[13] = a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21);
            this._out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
            this._out[15] = a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11);
            return this;
        }
    }, {
        key: 'determinant',

        /**
         * Calculates the determinant of a mat4
         * @return {number} determinant of this matrix
         */
        value: function determinant() {
            var _out3 = slicedToArray(this._out, 16),
                a00 = _out3[0],
                a01 = _out3[1],
                a02 = _out3[2],
                a03 = _out3[3],
                a10 = _out3[4],
                a11 = _out3[5],
                a12 = _out3[6],
                a13 = _out3[7],
                a20 = _out3[8],
                a21 = _out3[9],
                a22 = _out3[10],
                a23 = _out3[11],
                a30 = _out3[12],
                a31 = _out3[13],
                a32 = _out3[14],
                a33 = _out3[15];

            var b00 = a00 * a11 - a01 * a10,
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
        }
    }, {
        key: 'multiply',

        /**
         * Multiplies two mat4's explicitly not using SIMD
         * @param {mat4} mat
         */
        value: function multiply(mat) {
            var _out4 = slicedToArray(this._out, 16),
                a00 = _out4[0],
                a01 = _out4[1],
                a02 = _out4[2],
                a03 = _out4[3],
                a10 = _out4[4],
                a11 = _out4[5],
                a12 = _out4[6],
                a13 = _out4[7],
                a20 = _out4[8],
                a21 = _out4[9],
                a22 = _out4[10],
                a23 = _out4[11],
                a30 = _out4[12],
                a31 = _out4[13],
                a32 = _out4[14],
                a33 = _out4[15];
            // Cache only the current line of the second matrix


            var b0 = mat._out[0],
                b1 = mat._out[1],
                b2 = mat._out[2],
                b3 = mat._out[3];
            this._out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
            this._out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
            this._out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
            this._out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

            b0 = mat._out[4];b1 = mat._out[5];b2 = mat._out[6];b3 = mat._out[7];
            this._out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
            this._out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
            this._out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
            this._out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

            b0 = mat._out[8];b1 = mat._out[9];b2 = mat._out[10];b3 = mat._out[11];
            this._out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
            this._out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
            this._out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
            this._out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

            b0 = mat._out[12];b1 = mat._out[13];b2 = mat._out[14];b3 = mat._out[15];
            this._out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
            this._out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
            this._out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
            this._out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

            return this;
        }
    }, {
        key: 'add',

        /**
         * add two 4x4 matrixs 
         */
        value: function add(mat) {
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
        }
    }, {
        key: 'translate',

        /**
         * Translate a mat4 by the given vector not using SIMD
         * @param {vec3} vec vector to translate by
         */
        value: function translate(vec) {
            var _vec$_out = slicedToArray(vec._out, 3),
                x = _vec$_out[0],
                y = _vec$_out[1],
                z = _vec$_out[2],
                _out5 = slicedToArray(this._out, 12),
                a00 = _out5[0],
                a01 = _out5[1],
                a02 = _out5[2],
                a03 = _out5[3],
                a10 = _out5[4],
                a11 = _out5[5],
                a12 = _out5[6],
                a13 = _out5[7],
                a20 = _out5[8],
                a21 = _out5[9],
                a22 = _out5[10],
                a23 = _out5[11];

            this._out[12] = a00 * x + a10 * y + a20 * z + a[12];
            this._out[13] = a01 * x + a11 * y + a21 * z + a[13];
            this._out[14] = a02 * x + a12 * y + a22 * z + a[14];
            this._out[15] = a03 * x + a13 * y + a23 * z + a[15];
            return this;
        }
    }, {
        key: 'scale',

        /**
         * Scales the mat4 by the dimensions in the given vec3 not using vectorization
         * @param {vec3} vec the vec3 to scale the matrix by
         */
        value: function scale(vec) {
            var _vec$_out2 = slicedToArray(vec._out, 3),
                x = _vec$_out2[0],
                y = _vec$_out2[1],
                z = _vec$_out2[2];

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
        }
    }, {
        key: 'rotate',

        /**
         * Rotates a mat4 by the given angle around the given axis
         * @param {number} rad the angle to rotate the matrix by
         * @param {vec3} axis the axis to rotate around
         */
        value: function rotate(rad, axis) {
            var _axis$_out = slicedToArray(axis._out, 3),
                x = _axis$_out[0],
                y = _axis$_out[1],
                z = _axis$_out[2],
                len = axis.len(),
                s,
                c,
                t,
                a00,
                a01,
                a02,
                a03,
                a10,
                a11,
                a12,
                a13,
                a20,
                a21,
                a22,
                a23,
                b00,
                b01,
                b02,
                b10,
                b11,
                b12,
                b20,
                b21,
                b22;

            if (Math.abs(len) < matrix.EPSILON) {
                return null;
            }
            len = 1.0 / len;
            x *= len;
            y *= len;
            z *= len;
            s = Math.sin(rad);
            c = Math.cos(rad);
            t = 1 - c;
            a00 = a[0];a01 = a[1];a02 = a[2];a03 = a[3];
            a10 = a[4];a11 = a[5];a12 = a[6];a13 = a[7];
            a20 = a[8];a21 = a[9];a22 = a[10];a23 = a[11];
            // Construct the elements of the rotation matrix
            b00 = x * x * t + c;b01 = y * x * t + z * s;b02 = z * x * t - y * s;
            b10 = x * y * t - z * s;b11 = y * y * t + c;b12 = z * y * t + x * s;
            b20 = x * z * t + y * s;b21 = y * z * t - x * s;b22 = z * z * t + c;
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
        }
    }, {
        key: 'rotateX',

        /**
         * Rotates a matrix by the given angle around the X axis not using SIMD
         * @param {number} rad
         */
        value: function rotateX(rad) {
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
        }
    }, {
        key: 'rotateY',

        /**
         * Rotates a matrix by the given angle around the Y axis not using SIMD
         * @param {Number} rad the angle to rotate the matrix by
         */
        value: function rotateY(rad) {
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
        }
    }, {
        key: 'rotateZ',

        /**
         * Rotates a matrix by the given angle around the Z axis not using SIMD
         * @param {Number} rad the angle to rotate the matrix by
         */
        value: function rotateZ(rad) {
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
        }
    }, {
        key: 'getTranslation',

        /**
         * Returns the translation vector component of a transformation
         *  matrix. If a matrix is built with fromRotationTranslation,
         *  the returned vector will be the same as the translation vector
         *  originally supplied.
         * @return {vec3} out
        */
        value: function getTranslation() {
            var vec = new vec3();
            vec.set(mat._out[12], mat._out[13], mat._out[14]);
            return vec;
        }
    }, {
        key: 'getScaling',

        /**
         * Returns the scaling factor component of a transformation
         * matrix. If a matrix is built with fromRotationTranslationScale
         * with a normalized Quaternion paramter, the returned vector will be 
         * the same as the scaling vector
         * originally supplied.
         * @return {vec3} 
         */
        value: function getScaling() {
            var vec = new vec3(),
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
        }
    }, {
        key: 'getRotation',

        /**
         * Returns a quaternion representing the rotational component
         * of a transformation matrix. If a matrix is built with
         * fromRotationTranslation, the returned quaternion will be the
         * same as the quaternion originally supplied.
         * Algorithm taken from http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
         * @return {quat} 
         */
        value: function getRotation() {
            var S = 0,
                x = void 0,
                y = void 0,
                z = void 0,
                w = void 0,
                qua = new quat(),
                trace = this._out[0] + this._out[5] + this._out[10];

            if (trace > 0) {
                S = Math.sqrt(trace + 1.0) * 2;
                w = 0.25 * S;
                x = (this._out[6] - this._out[9]) / S;
                y = (this._out[8] - this._out[2]) / S;
                z = (this._out[1] - this._out[4]) / S;
            } else if (this._out[0] > this._out[5] & this._out[0] > this._out[10]) {
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
        }
    }, {
        key: 'perspective',

        /**
         * Generates a perspective projection matrix with the given bounds
         * @param {number} fovy Vertical field of view in radians
         * @param {number} aspect Aspect ratio. typically viewport width/height
         * @param {number} near Near bound of the frustum
         * @param {number} far Far bound of the frustum
         */
        value: function perspective(fovy, aspect, near, far) {
            var mat = new mat4(),
                f = 1.0 / Math.tan(fovy / 2),
                nf = 1 / (near - far);
            mat.set(f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0);
            return mat;
        }
    }, {
        key: 'lookAt',

        /**
         * Generates a look-at matrix with the given eye position, focal point, and up axis
         * @param {vec3} eye Position of the viewer
         * @param {vec3} center Point the viewer is looking at
         * @param {vec3} up vec3 pointing up
         * @returns {mat4}
         */
        value: function lookAt(eye, center, up) {
            var x0 = void 0,
                x1 = void 0,
                x2 = void 0,
                y0 = void 0,
                y1 = void 0,
                y2 = void 0,
                z0 = void 0,
                z1 = void 0,
                z2 = void 0,
                len = void 0,
                _eye$_out = slicedToArray(eye._out, 3),
                eyex = _eye$_out[0],
                eyey = _eye$_out[1],
                eyez = _eye$_out[2],
                _up$_out = slicedToArray(up._out, 3),
                upx = _up$_out[0],
                upy = _up$_out[1],
                upz = _up$_out[2],
                _center$_out = slicedToArray(center._out, 3),
                centerx = _center$_out[0],
                centery = _center$_out[1],
                centerz = _center$_out[2];

            if (Math.abs(eyex - centerx) < matrix.EPSILON && Math.abs(eyey - centery) < matrix.EPSILON && Math.abs(eyez - centerz) < matrix.EPSILON) {
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
            this.set(x0, y0, z0, 0, x1, y1, z1, 0, x2, y2, z2, 0, -(x0 * eyex + x1 * eyey + x2 * eyez), -(y0 * eyex + y1 * eyey + y2 * eyez), -(z0 * eyex + z1 * eyey + z2 * eyez), 1);
            return this;
        }
    }, {
        key: 'toString',

        /**
         * Returns a string representation of a mat4
         */
        value: function toString() {
            return 'mat4(' + this._out[0] + ', ' + this._out[1] + ', ' + this._out[2] + ', ' + this._out[3] + ', ' + this._out[4] + ', ' + this._out[5] + ', ' + this._out[6] + ', ' + this._out[7] + ', ' + this._out[8] + ', ' + this._out[9] + ', ' + this._out[10] + ', ' + this._out[11] + ', ' + this._out[12] + ', ' + this._out[13] + ', ' + this._out[14] + ', ' + this._out[15] + ')';
        }
    }, {
        key: 'forb',

        /**
         * Returns Frobenius norm of a mat4
         * @returns {Number} Frobenius norm
         */
        value: function forb() {
            return Math.sqrt(Math.pow(this._out[0], 2) + Math.pow(this._out[1], 2) + Math.pow(this._out[2], 2) + Math.pow(this._out[3], 2) + Math.pow(this._out[4], 2) + Math.pow(this._out[5], 2) + Math.pow(this._out[6], 2) + Math.pow(this._out[7], 2) + Math.pow(this._out[8], 2) + Math.pow(this._out[9], 2) + Math.pow(this._out[10], 2) + Math.pow(this._out[11], 2) + Math.pow(this._out[12], 2) + Math.pow(this._out[13], 2) + Math.pow(this._out[14], 2) + Math.pow(this._out[15], 2));
        }
    }, {
        key: 'add',

        /**
         * Adds two mat4's
         * @param {mat4} mat
         */
        value: function add(mat) {
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
        }
    }, {
        key: 'sub',

        /**
         * Subtracts matrix b from matrix a
         * @param {mat4} mat
         */
        value: function sub(mat) {
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
        }
    }, {
        key: 'equals',

        /**
         * Returns whether or not the matrices have approximately the same elements in the same position.
         * @param {mat4} mat
         */
        value: function equals(mat) {
            var _out6 = slicedToArray(this._out, 16),
                a0 = _out6[0],
                a1 = _out6[1],
                a2 = _out6[2],
                a3 = _out6[3],
                a4 = _out6[4],
                a5 = _out6[5],
                a6 = _out6[6],
                a7 = _out6[7],
                a8 = _out6[8],
                a9 = _out6[9],
                a10 = _out6[10],
                a11 = _out6[11],
                a12 = _out6[12],
                a13 = _out6[13],
                a14 = _out6[14],
                a15 = _out6[15],
                _mat$_out = slicedToArray(mat._out, 16),
                b0 = _mat$_out[0],
                b1 = _mat$_out[1],
                b2 = _mat$_out[2],
                b3 = _mat$_out[3],
                b4 = _mat$_out[4],
                b5 = _mat$_out[5],
                b6 = _mat$_out[6],
                b7 = _mat$_out[7],
                b8 = _mat$_out[8],
                b9 = _mat$_out[9],
                b10 = _mat$_out[10],
                b11 = _mat$_out[11],
                b12 = _mat$_out[12],
                b13 = _mat$_out[13],
                b14 = _mat$_out[14],
                b15 = _mat$_out[15];

            return Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a8), Math.abs(b8)) && Math.abs(a9 - b9) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a9), Math.abs(b9)) && Math.abs(a10 - b10) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a10), Math.abs(b10)) && Math.abs(a11 - b11) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a11), Math.abs(b11)) && Math.abs(a12 - b12) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a12), Math.abs(b12)) && Math.abs(a13 - b13) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a13), Math.abs(b13)) && Math.abs(a14 - b14) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a14), Math.abs(b14)) && Math.abs(a15 - b15) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a15), Math.abs(b15));
        }
    }], [{
        key: 'fromVec3Translation',

        /**
         * Creates a matrix from a vector translation
         * This is equivalent to (but much faster than):
         *  mat4.identity(dest);
         *  mat4.translate(dest, dest, vec);
         * 
         * @param {vec3} vec Translation vector
         */
        value: function fromVec3Translation(vec) {
            var mat = new mat4(),
                _vec$_out3 = slicedToArray(vec._out, 3),
                x = _vec$_out3[0],
                y = _vec$_out3[1],
                z = _vec$_out3[2];

            mat.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1);
            return mat;
        }
    }, {
        key: 'fromScaling',

        /**
         * Creates a matrix from a vector scaling
         * This is equivalent to (but much faster than):
         *  mat4.identity(dest);
         *  mat4.scale(dest, dest, vec);
         * @param {vec3} vec Scaling vector
         * @returns {mat4} 
         */
        value: function fromScaling(vec) {
            var mat = new mat4(),
                _vec$_out4 = slicedToArray(vec._out, 3),
                x = _vec$_out4[0],
                y = _vec$_out4[1],
                z = _vec$_out4[2];

            mat.set(x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1);
            return mat;
        }
    }, {
        key: 'fromRotation',

        /**
         * Creates a matrix from a given angle around a given axis
         * This is equivalent to (but much faster than):
         *  mat4.identity(dest);
         *  mat4.rotate(dest, dest, rad, axis);
         * @param {Number} rad the angle to rotate the matrix by
         * @param {vec3} axis the axis to rotate around
         */
        value: function fromRotation(rad, axis) {
            var _axis$_out2 = slicedToArray(axis._out, 3),
                x = _axis$_out2[0],
                y = _axis$_out2[1],
                z = _axis$_out2[2],
                len = axis.len(),
                mat = new mat4(),
                s,
                c,
                t;

            if (len < matrix.EPSILON) {
                return null;
            }
            len = 1.0 / len;
            x *= len;
            y *= len;
            z *= len;
            s = Math.sin(rad);
            c = Math.cos(rad);
            t = 1 - c;
            // Perform rotation-specific matrix multiplication
            mat.set(x * x * t + c, y * x * t + z * s, z * x * t - y * s, 0, x * y * t - z * s, y * y * t + c, z * y * t + x * s, 0, x * z * t + y * s, y * z * t - x * s, z * z * t + c, 0, 0, 0, 0, 1);
            return mat;
        }
    }, {
        key: 'fromXRotation',

        /**
         * Creates a matrix from the given angle around the X axis
         * This is equivalent to (but much faster than):
         *  mat4.identity(dest);
         *  mat4.rotateX(dest, dest, rad);
         * @param {Number} rad the angle to rotate the matrix by
         */
        value: function fromXRotation(rad) {
            var mat = new mat4(),
                s = Math.sin(rad),
                c = Math.cos(rad);
            mat.set(1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1);
            return mat;
        }
    }, {
        key: 'fromYRotation',

        /**
         * Creates a matrix from the given angle around the Y axis
         * This is equivalent to (but much faster than):
         *  mat4.identity(dest);
         *  mat4.rotateY(dest, dest, rad);
         * 
         * @param {Number} rad the angle to rotate the matrix by
         */
        value: function fromYRotation(rad) {
            var mat = new mat4(),
                s = Math.sin(rad),
                c = Math.cos(rad);
            // Perform axis-specific matrix multiplication
            mat.set(c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1);
            return mat;
        }
    }, {
        key: 'fromZRotation',

        /**
         * Creates a matrix from the given angle around the Z axis
         * This is equivalent to (but much faster than):
         *  mat4.identity(dest);
         *  mat4.rotateZ(dest, dest, rad);
         * 
         * @param {Number} rad the angle to rotate the matrix by
         */
        value: function fromZRotation(rad) {
            var mat = new mat4(),
                s = Math.sin(rad),
                c = Math.cos(rad);
            // Perform axis-specific matrix multiplication
            mat.set(c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
            return mat;
        }
    }, {
        key: 'fromRotationTranslation',

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
        value: function fromRotationTranslation(qua, vec) {
            // Quaternion math
            var mat = new mat4(),
                _qua$_out = slicedToArray(qua._out, 4),
                x = _qua$_out[0],
                y = _qua$_out[1],
                z = _qua$_out[2],
                w = _qua$_out[3],
                _vec$_out5 = slicedToArray(vec._out, 3),
                v0 = _vec$_out5[0],
                v1 = _vec$_out5[1],
                v2 = _vec$_out5[2],
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

            mat.set(1 - (yy + zz), xy + wz, xz - wy, 0, xy - wz, 1 - (xx + zz), yz + wx, 0, xz + wy, yz - wx, 1 - (xx + yy), 0, v0, v1, v2, 1);
            return mat;
        }
    }, {
        key: 'fromRotationTranslationScale',


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
        value: function fromRotationTranslationScale(q, v, s) {
            var mat = new mat4(),
                _qua$_out2 = slicedToArray(qua._out, 4),
                x = _qua$_out2[0],
                y = _qua$_out2[1],
                z = _qua$_out2[2],
                w = _qua$_out2[3],
                _v$_out = slicedToArray(v._out, 3),
                v0 = _v$_out[0],
                v1 = _v$_out[1],
                v2 = _v$_out[2],
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

            mat.set((1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0(xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0, (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0, v0, v1, v2, 1);
            return mat;
        }
    }, {
        key: 'fromRotationTranslationScaleOrigin',

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
        value: function fromRotationTranslationScaleOrigin(q, v, s, o) {
            // Quaternion math
            var mat = new mat4(),
                _q$_out = slicedToArray(q._out, 4),
                x = _q$_out[0],
                y = _q$_out[1],
                z = _q$_out[2],
                w = _q$_out[3],
                _v$_out2 = slicedToArray(v._out, 3),
                sx = _v$_out2[0],
                sy = _v$_out2[1],
                sz = _v$_out2[2],
                _o$_out = slicedToArray(o._out, 3),
                ox = _o$_out[0],
                oy = _o$_out[1],
                oz = _o$_out[2],
                _v$_out3 = slicedToArray(v._out, 3),
                vx = _v$_out3[0],
                vy = _v$_out3[1],
                vz = _v$_out3[2],
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

            mat.set((1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0, (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0, (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0, vx + ox - (out[0] * ox + out[4] * oy + out[8] * oz), vy + oy - (out[1] * ox + out[5] * oy + out[9] * oz), vz + oz - (out[2] * ox + out[6] * oy + out[10] * oz), 1);
            return mat;
        }
    }, {
        key: 'fromQuat',

        /**
         * Calculates a 4x4 matrix from the given quaternion
         * @param {quat} q Quaternion to create matrix from
         * @returns {mat4}
         */
        value: function fromQuat(q) {
            var mat = new mat4(),
                _q$_out2 = slicedToArray(q._out, 4),
                x = _q$_out2[0],
                y = _q$_out2[1],
                z = _q$_out2[2],
                w = _q$_out2[3],
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

            mat.set(1 - yy - zz, yx + wz, zx - wy, 0, yx - wz, 1 - xx - zz, zy + wx, 0, zx + wy, zy - wx, 1 - xx - yy, 0, 0, 0, 0, 1);
            return mat;
        }
    }, {
        key: 'frustum',

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
        value: function frustum(left, right, bottom, top, near, far) {
            var mat = new mat4(),
                rl = 1 / (right - left),
                tb = 1 / (top - bottom),
                nf = 1 / (near - far);
            mat.set(near * 2 * rl, 0, 0, 0, 0, near * 2 * tb, 0, 0, (right + left) * rl, (top + bottom) * tb, (far + near) * nf, -1, 0, 0, far * near * 2 * nf, 0);
            return mat;
        }
    }, {
        key: 'perspectiveFromFieldOfView',

        /**
         * Generates a perspective projection matrix with the given field of view.
         * This is primarily useful for generating projection matrices to be used
         * with the still experiemental WebVR API.
         * @param {Object} fov Object containing the following values: upDegrees, downDegrees, leftDegrees, rightDegrees
         * @param {number} near Near bound of the frustum
         * @param {number} far Far bound of the frustum
         * @returns {mat4} out
         */
        value: function perspectiveFromFieldOfView(fov, near, far) {
            var mat = new mat4(),
                upTan = Math.tan(fov.upDegrees * Math.PI / 180.0),
                downTan = Math.tan(fov.downDegrees * Math.PI / 180.0),
                leftTan = Math.tan(fov.leftDegrees * Math.PI / 180.0),
                rightTan = Math.tan(fov.rightDegrees * Math.PI / 180.0),
                xScale = 2.0 / (leftTan + rightTan),
                yScale = 2.0 / (upTan + downTan);
            mat.set(xScale, 0, 0, 0, 0, yScale, 0, 0, -((leftTan - rightTan) * xScale * 0.5), (upTan - downTan) * yScale * 0.5, far / (near - far), -1, 0, 0, far * near / (near - far), 0);
            return mat;
        }
    }, {
        key: 'ortho',

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
        value: function ortho(left, right, bottom, top, near, far) {
            var mat = new mat4(),
                lr = 1.0 / (left - right),
                bt = 1.0 / (bottom - top),
                nf = 1.0 / (near - far);
            mat.set(-2 * lr, 0, 0, 0, 0, -2 * bt, 0, 0, 0, 0, 2 * nf, 0, (left + right) * lr, (top + bottom) * bt, (far + near) * nf, 1);
            return mat;
        }
    }]);
    return mat4;
}();

/**
 * reference https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/vec2.js
 * switch to es6 syntax
 * warning:if you don't want to change the source value,please use mat.clone().* instead of mat.*
 * @author yellow 2017/5/8
 */
var vec2 = function () {
    /**
     * Creates a new, empty vec2
     */
    function vec2() {
        classCallCheck(this, vec2);

        _out = new matrix.ARRAY_TYPE(2);
        _out[0] = 0;
        _out[1] = 0;
        return this;
    }
    /**
     * private array store for vec2
     */


    createClass(vec2, [{
        key: 'set',

        /**
         * set value of vec2,such as [x,y]
         */
        value: function set$$1(x, y) {
            _out[0] = x;
            _out[1] = y;
            return this;
        }

        /**
         * Creates a new vec2 initialized with values from an existing vector
         */

    }, {
        key: 'clone',
        value: function clone() {
            var vec = new vec2();
            vec.set(this._out[0], this._out[1]);
            return vec;
        }
    }, {
        key: 'add',

        /**
         * Add two vec2's
         * @param {vec2} vec the vec2 which waiting for add
         */
        value: function add(vec) {
            this._out[0] += vec._out[0];
            this._out[1] += vec._out[1];
            return vec;
        }
    }, {
        key: 'sub',

        /**
         * substract vector vec from this
         * @param {vec2} vec
         */
        value: function sub(vec) {
            this._out[0] -= vec._out[0];
            this._out[1] -= vec._out[1];
            return this;
        }
    }, {
        key: 'multiply',

        /**
         * multiplies two vec2's
         * @param {vec2} 
         */
        value: function multiply(vec) {
            this._out[0] *= vec._out[0];
            this._out[1] *= vec._out[1];
            return this;
        }
    }, {
        key: 'divide',

        /**
         * diveides two vec2's
         * 
         */
        value: function divide(vec) {
            this._out[0] /= vec._out[0];
            this._out[1] /= vec._out[1];
            return this;
        }
    }, {
        key: 'ceil',

        /**
         * use math.ceil to adjust the value of v0 v1
         * 
         */
        value: function ceil() {
            this._out[0] = Math.ceil(this._out[0]);
            this._out[1] = Math.ceil(this._out[1]);
            return this;
        }
    }, {
        key: 'floor',

        /**
         * use math.floor to adjust the value of v0 v1
         */
        value: function floor() {
            this._out[0] = Math.floor(this._out[0]);
            this._out[1] = Math.floor(this._out[1]);
            return this;
        }
    }, {
        key: 'round',

        /**
         * use math.round to adjust the value of v0 v1
         */
        value: function round() {
            this._out[0] = Math.round(this._out[0]);
            this._out[1] = Math.round(this._out[1]);
            return this;
        }
    }, {
        key: 'min',

        /**
         * merge two vector's min value
         * 
         */
        value: function min(vec) {
            this._out[0] = Math.min(this._out[0], vec._out[0]);
            this._out[1] = Math.min(this._out[1], vec._out[1]);
            return this;
        }
    }, {
        key: 'max',

        /**
         *  merge two vector's max value
         */
        value: function max(vec) {
            this._out[0] = Math.max(this._out[0], vec._out[0]);
            this._out[1] = Math.max(this._out[1], vec._out[1]);
            return this;
        }
    }, {
        key: 'scale',

        /**
         * Scales a vec2 by a scalar number
         * @param {Number} n
         */
        value: function scale(n) {
            this._out[0] *= n;
            this._out[1] *= n;
            return this;
        }
    }, {
        key: 'distance',

        /**
         * Calculates the euclidian distance between two vec2's
         */
        value: function distance(vec) {
            var x = this._out[0] - vec._out[0],
                y = this._out[1] - vec._out[2];
            return Math.sqrt(x * x + y * y);
        }
    }, {
        key: 'manhattanDistance',

        /**
         * Calculates the manhattan distance between two vec2's
         */
        value: function manhattanDistance(vec) {
            var x = Math.abs(this._out[0] - vec._out[0]),
                y = Math.abs(this._out[1] - vec._out[2]);
            return x + y;
        }
    }, {
        key: 'chebyshevDistance',

        /**
         * Calculates the chebyshev distance between two vec2's
         */
        value: function chebyshevDistance(vec) {
            var x = Math.abs(this._out[0] - vec._out[0]),
                y = Math.abs(this._out[1] - vec._out[2]);
            return Math.max(x, y);
        }
    }, {
        key: 'len',

        /**
         * Calculates the length of a vec2
         */
        value: function len() {
            return this.distance(new vec2());
        }
    }, {
        key: 'negate',

        /**
         * Negates the components of a vec2
         */
        value: function negate() {
            this._out[0] = -this._out[0];
            this._out[1] = -this._out[1];
            return this;
        }
    }, {
        key: 'inverse',

        /**
         * Returns the inverse of the components of a vec2
         */
        value: function inverse() {
            this._out[0] = 1.0 / this._out[0];
            this._out[1] = 1.0 / this._out[1];
            return this;
        }
    }, {
        key: 'normalize',

        /**
         * Normalize a vec2
         */
        value: function normalize() {
            var len = this.vec2Length();
            if (len > 0) {
                //for the reason * has a high performance than /
                len = 1.0 / len;
                this._out[0] *= len;
                this._out[1] *= len;
            }
            return this;
        }
    }, {
        key: 'dot',

        /**
         * Calculates the dot product of two vec2's
         */
        value: function dot(vec) {
            return this._out[0] * vec._out[0] + this._out[1] * vec._out[1];
        }
    }, {
        key: 'lerp',

        /**
         * performs a linear interpolation between two vec2's
         * @param {vec2} vec
         * @param {number} t interpolation amount between the two inputs
         */
        value: function lerp(vec, t) {
            var _out2 = slicedToArray(this._out, 2),
                ax = _out2[0],
                ay = _out2[1],
                _vec$_out = slicedToArray(vec._out, 2),
                bx = _vec$_out[0],
                by = _vec$_out[1];

            this._out[0] = ax + t * (bx - ax);
            this._out[1] = ay + t * (by - ay);
            return this;
        }
    }, {
        key: 'toString',

        /**
         * Returns a string representation of a vector
         */
        value: function toString() {
            return 'vec2(' + this._out[0] + ', ' + this._out[1] + ')';
        }
    }, {
        key: 'transformMat3',

        /**
         * Transforms the vec2 with a mat3
         * @param {mat3} mat matrix to transform with
         */
        value: function transformMat3(mat) {
            var _out3 = slicedToArray(this._out, 2),
                x = _out3[0],
                y = _out3[1];

            this._out[0] = mat._out[0] * x + mat._out[3] * y + mat._out[6];
            this._out[1] = mat._out[1] * x + mat._out[4] * y + mat._out[7];
            return this;
        }
    }, {
        key: 'transformMat4',

        /**
         * Transforms the vec2 with a mat4
         */
        value: function transformMat4(mat) {
            var _out4 = slicedToArray(this._out, 2),
                x = _out4[0],
                y = _out4[1];

            this._out[0] = mat._out[0] * x + mat._out[4] * y + mat._out[5];
            this._out[1] = mat._out[1] * x + mat._out[5] * y + mat._out[13];
            return this;
        }
    }, {
        key: 'equals',

        /**
         * Returns whether or not the vectors have approximately the same elements in the same position.
         * precision
         */
        value: function equals(vec) {
            var _out5 = slicedToArray(this._out, 2),
                a0 = _out5[0],
                a1 = _out5[1],
                _vec$_out2 = slicedToArray(vec._out, 2),
                b0 = _vec$_out2[0],
                b1 = _vec$_out2[1];

            return Math.abs(a0 - b0) <= matrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= matrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1));
        }
    }], [{
        key: 'random',

        /**
         * generate a random vector
         */
        value: function random() {
            var scale = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1.0;

            scale = scale || 1.0;
            var vec = new vec2(),
                r = matrix.RANDOM() * 2.0 * Math.PI;
            ax = Math.cos(r) * scale;
            ay = Math.sin(r) * scale;
            return vec;
        }
    }]);
    return vec2;
}();

/**
 * make a package of matrix
 * 
 */

exports.vec2 = vec2;
exports.vec3 = vec3;
exports.vec4 = vec4;
exports.mat3 = mat3;
exports.mat4 = mat4;
exports.quat = quat;

Object.defineProperty(exports, '__esModule', { value: true });

})));
