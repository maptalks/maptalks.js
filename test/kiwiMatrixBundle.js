(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.kiwiMatrix = {})));
}(this, (function (exports) { 'use strict';

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

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

	var GLMatrix_1 = createCommonjsModule(function (module) {
	  /**
	   * reference:
	   * https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/common.js
	   * 
	   * switch to es6 syntax
	   * @author yellow 2017/5/8
	   */
	  /**
	   * the degree to rad factor
	   * @type {number}
	   */
	  var degree = Math.PI / 180;
	  /**
	   * @class
	   */

	  var GLMatrix = function GLMatrix() {
	    classCallCheck(this, GLMatrix);
	  };
	  /**
	   * the precision to indicate two value is equal
	   * @type {number}
	   */


	  GLMatrix.EPSILON = 1e-6;
	  /**
	   * support ie9
	   * @type {Float32Array|Array}
	   */
	  GLMatrix.ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
	  /**
	   * the Math.random adapter
	   * @func
	   */
	  GLMatrix.RANDOM = Math.random;
	  /**
	   * the default setting to use SIMD
	   * @static
	   */
	  GLMatrix.ENABLE_SIMD = true;
	  /**
	   * indicate to use SIMD
	   * @static
	   */
	  GLMatrix.SIMD_AVAILABLE = GLMatrix.ARRAY_TYPE === Float32Array && typeof SIMD != 'undefined';
	  /**
	   * 使用simd
	   * @type {boolean}
	   */
	  GLMatrix.USE_SIMD = GLMatrix.ENABLE_SIMD && GLMatrix.SIMD_AVAILABLE;
	  /**
	   * Set ArrayType,such as Float32Array or Array ([])
	   * @param {Float32Array|Array} type Array type,such as Float32Array or Array
	   */
	  GLMatrix.setMatrixArrayType = function (type) {
	    GLMatrix.ARRAY_TYPE = type;
	  };
	  /**
	   * Convert degree to radian
	   * @param {number} deg Angle in Degrees
	   */
	  GLMatrix.toRadian = function (deg) {
	    return deg * degree;
	  };
	  /**
	   * Convert rad to degree
	   * @param {number} rad Angle in Radian
	   */
	  GLMatrix.toDegree = function (rad) {
	    return rad / degree;
	  };
	  /**
	   * #debug
	   * @param {Object} obj 
	   */
	  GLMatrix.formatDisplay = function (obj) {
	    var output = "\n";
	    if (obj.constructor.name === 'mat4') {
	      for (var i = 0; i < 4; i++) {
	        output += '[' + obj.value[i * 4] + ',' + obj.value[i * 4 + 1] + ',' + obj.value[i * 4 + 2] + ',' + obj.value[i * 4 + 3] + ']\n';
	      }
	    }
	  };
	  /**
	   * @param {number} a The first number to test.
	   * @param {number} b The first number to test.
	   * @return {boolean} True if the numbers are approximately equal, false otherwise.
	   */
	  GLMatrix.equals = function (a, b) {
	    return Math.abs(a - b) <= GLMatrix.EPSILON * Math.max(1.0, Math.abs(a), Math.abs(b));
	  };

	  module.exports = GLMatrix;
	});

	/**
	 * reference https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/vec2.js
	 * switch to es6 syntax
	 * warning:if you don't want to change the source value,please use vec2.clone().* instead of vec2.*
	 * @author yellow 2017/5/8
	 */

	/**
	 * @class
	 */

	var Vec2 = function () {
	    /**
	     * Creates a new, empty vec2
	     */
	    function Vec2() {
	        classCallCheck(this, Vec2);

	        /**
	         * array store for vec2
	         * @private
	         */
	        this._out = new GLMatrix_1.ARRAY_TYPE(2);
	        this._out[0] = 0;
	        this._out[1] = 0;
	        return this;
	    }

	    createClass(Vec2, [{
	        key: 'set',

	        /**
	         * set value of vec2,such as [x,y]
	         */
	        value: function set$$1(x, y) {
	            this._out[0] = x;
	            this._out[1] = y;
	            return this;
	        }
	    }, {
	        key: 'clone',

	        /**
	         * Creates a new vec2 initialized with values from an existing vector
	         */
	        value: function clone() {
	            var vec = new Vec2();
	            vec.set(this._out[0], this._out[1]);
	            return vec;
	        }
	    }, {
	        key: 'add',

	        /**
	         * Add two vec2's
	         * @param {Vec2} vec the vec2 which waiting for add
	         */
	        value: function add(vec) {
	            this._out[0] += vec._out[0];
	            this._out[1] += vec._out[1];
	            return this;
	        }
	    }, {
	        key: 'sub',

	        /**
	         * substract vector vec from this
	         * @param {Vec2} vec
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
	         * @param {Vec2} 
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
	            return this.distance(new Vec2());
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
	         * @param {Vec2} vec
	         * @param {number} t interpolation amount between the two inputs
	         */
	        value: function lerp(vec, t) {
	            var _out = slicedToArray(this._out, 2),
	                ax = _out[0],
	                ay = _out[1],
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
	            return 'vec2(' + this._out[0] + ',' + this._out[1] + ')';
	        }
	    }, {
	        key: 'transformMat3',

	        /**
	         * Transforms the vec2 with a mat3
	         * @param {mat3} mat matrix to transform with
	         */
	        value: function transformMat3(mat) {
	            var _out2 = slicedToArray(this._out, 2),
	                x = _out2[0],
	                y = _out2[1];

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
	            var _out3 = slicedToArray(this._out, 2),
	                x = _out3[0],
	                y = _out3[1];

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
	            var _out4 = slicedToArray(this._out, 2),
	                a0 = _out4[0],
	                a1 = _out4[1],
	                _vec$_out2 = slicedToArray(vec._out, 2),
	                b0 = _vec$_out2[0],
	                b1 = _vec$_out2[1];

	            return Math.abs(a0 - b0) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1));
	        }
	    }, {
	        key: 'value',

	        /**
	         * adapter for webgl matrix
	         * get the array directly
	         * @memberof vec2
	         * @return {Array}
	         */
	        get: function get$$1() {
	            return this._out;
	        }
	    }], [{
	        key: 'random',

	        /**
	         * generate a random vector
	         */
	        value: function random() {
	            var scale = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1.0;

	            scale = scale || 1.0;
	            var vec = new Vec2(),
	                r = GLMatrix_1.RANDOM() * 2.0 * Math.PI;
	            ax = Math.cos(r) * scale;
	            ay = Math.sin(r) * scale;
	            return vec;
	        }
	    }]);
	    return Vec2;
	}();

	var Vec2_1 = Vec2;

	/**
	 * reference https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/vec3.js
	 * switch to es6 syntax
	 * warning:if you don't want to change the source value,please use vec3.clone().* instead of vec3.*
	 * @author yellow 2017/5/8
	 * 
	 */

	/**
	 * @class 3 Dimensional Vector
	 * @name vec3
	 */

	var Vec3 = function () {
	    /**
	     * Creates a new, empty vec3
	     */
	    function Vec3() {
	        classCallCheck(this, Vec3);

	        /**
	         * array store for vec3
	         * @private
	         */
	        this._out = new GLMatrix_1.ARRAY_TYPE(3);
	        this._out[0] = 0;
	        this._out[1] = 0;
	        this._out[2] = 0;
	        return this;
	    }

	    createClass(Vec3, [{
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
	            var vec = new Vec3();
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
	            return this.distance(new Vec3());
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
	         * https://webgl2fundamentals.org/webgl/lessons/webgl-3d-camera.html
	         * calcue the perpendicular vec3 
	         * @param {Vec3} v3
	         * @return {Vec3}
	         * @example
	         * let v3_out = v3_in1.clone().cross(v3_in2);
	         * the v3_out perpendicular to v3_in1 and v3_in2
	         */
	        value: function cross(v3) {
	            var _out3 = slicedToArray(this._out, 3),
	                ax = _out3[0],
	                ay = _out3[1],
	                az = _out3[2],
	                _v3$value = slicedToArray(v3.value, 3),
	                bx = _v3$value[0],
	                by = _v3$value[1],
	                bz = _v3$value[2];

	            this._out[0] = ay * bz - az * by;
	            this._out[1] = az * bx - ax * bz;
	            this._out[2] = ax * by - ay * bx;
	            return this;
	        }
	    }, {
	        key: 'lerp',

	        /**
	         * Performs a linear interpolation between two vec3's
	         * @param {Vec3} vec
	         * @param {number} t
	         */
	        value: function lerp(vec, t) {
	            var _out4 = slicedToArray(this._out, 3),
	                ax = _out4[0],
	                ay = _out4[1],
	                az = _out4[2],
	                _vec$_out3 = slicedToArray(vec._out, 3),
	                bx = _vec$_out3[0],
	                by = _vec$_out3[1],
	                bz = _vec$_out3[2];

	            this._out[0] = ax + t * (bx - ax);
	            this._out[1] = ay + t * (by - ay);
	            this._out[2] = az + t * (bz - az);
	            return this;
	        }
	    }, {
	        key: 'hermite',

	        /**
	         * Performs a hermite interpolation with two control points
	         * @param {Vec3} vecI
	         * @param {Vec3} vecI
	         * @param {Vec3} vecI
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
	         * @param {Vec3} vecI
	         * @param {Vec3} vecII
	         * @param {Vec3} vecIII
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
	         * @param {Vec3} vec the origin of the rotation
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
	         * @param {Vec3} vec The origin of the rotation
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
	         * @param {Vec3} vec The origin of the rotation
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
	         * @param {Vec3} vec the second vector
	         */
	        value: function angle(vec) {
	            var vecI = this.clone().normalize(),
	                vecII = vec.clone().normalize();
	            var cosine = Vec3.dot(vecI, vecII);
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
	                _vec$_out4 = slicedToArray(vec._out, 3),
	                b0 = _vec$_out4[0],
	                b1 = _vec$_out4[1],
	                b2 = _vec$_out4[2];

	            return Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2));
	        }
	    }, {
	        key: 'value',

	        /**
	         * adapter for webgl matrix
	         * get the array directly
	         * @memberof vec3
	         * @return {Array}
	         */
	        get: function get$$1() {
	            return this._out;
	        }
	    }], [{
	        key: 'random',

	        /**
	         * Generates a random vector with the given scale
	         * @param {number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
	         */
	        value: function random() {
	            var scale = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1.0;

	            var vec = new Vec3();
	            scale = scale || 1.0;
	            var r = GLMatrix_1.RANDOM() * 2.0 * Math.PI;
	            var z = GLMatrix_1.RANDOM() * 2.0 - 1.0;
	            var z = Math.sqrt(1.0 - z * z) * scale;
	            ax = Math.cos(r) * zScale;
	            ay = Math.sin(r) * zScale;
	            az = z * scale;
	            vec.set(ax, ay, az);
	            return vec;
	        }
	    }]);
	    return Vec3;
	}();

	var Vec3_1 = Vec3;

	/**
	 * reference https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/vec4.js
	 * switch to es6 syntax
	 * warning:if you don't want to change the source value,please use vec4.clone().* instead of vec4.*
	 * @author yellow 2017.5.9
	 */

	/**
	 * @class 4 Dimensional Vector
	 * @name vec4
	 */

	var Vec4 = function () {
	    /**
	     *  Creates a new, empty vec4
	     */
	    function Vec4() {
	        classCallCheck(this, Vec4);

	        /**
	         * vec4 array store
	         * @private
	         */
	        this._out = new GLMatrix_1.ARRAY_TYPE(4);
	        this._out[0] = 0;
	        this._out[1] = 0;
	        this._out[2] = 0;
	        this._out[3] = 0;
	        return this;
	    }
	    /**
	     * adapter for webgl matrix
	     * get the array directly
	     * @memberof vec4
	     * @return {Array}
	     */


	    createClass(Vec4, [{
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
	        /**
	         * Creates a new vec4 initialized with values from an existing vector
	         */

	    }, {
	        key: 'clone',
	        value: function clone() {
	            var vec = new Vec4();
	            vec.set(this._out[0], this._out[1], this._out[2], this._out[3]);
	            return vec;
	        }
	        /**
	         * Adds two vec4's
	         * @param {Vec4} vec
	         */

	    }, {
	        key: 'add',
	        value: function add(vec) {
	            this._out[0] += vec.value[0];
	            this._out[1] += vec.value[1];
	            this._out[2] += vec.value[2];
	            this._out[3] += vec.value[3];
	            return this;
	        }
	        /**
	         * Subtracts vector vec from vector this
	         */

	    }, {
	        key: 'sub',
	        value: function sub(vec) {
	            this._out[0] -= vec.value[0];
	            this._out[1] -= vec.value[1];
	            this._out[2] -= vec.value[2];
	            this._out[3] -= vec.value[3];
	            return this;
	        }
	        /**
	         * Multiplies two vec4's
	         */

	    }, {
	        key: 'multiply',
	        value: function multiply(vec) {
	            this._out[0] *= vec.value[0];
	            this._out[1] *= vec.value[1];
	            this._out[2] *= vec.value[2];
	            this._out[3] *= vec.value[3];
	            return this;
	        }
	        /**
	        * Divides two vec4's
	        */

	    }, {
	        key: 'divide',
	        value: function divide(vec) {
	            this._out[0] /= vec.value[0];
	            this._out[1] /= vec.value[1];
	            this._out[2] /= vec.value[2];
	            this._out[3] /= vec.value[3];
	            return this;
	        }
	        /**
	         * Math.ceil the components of a vec4
	         */

	    }, {
	        key: 'ceil',
	        value: function ceil() {
	            this._out[0] = Math.ceil(this._out[0]);
	            this._out[1] = Math.ceil(this._out[1]);
	            this._out[2] = Math.ceil(this._out[2]);
	            this._out[3] = Math.ceil(this._out[3]);
	            return this;
	        }
	        /**
	         * Math.round the components of a vec4
	         */

	    }, {
	        key: 'round',
	        value: function round() {
	            this._out[0] = Math.round(this._out[0]);
	            this._out[1] = Math.round(this._out[1]);
	            this._out[2] = Math.round(this._out[2]);
	            this._out[3] = Math.round(this._out[3]);
	            return this;
	        }
	        /**
	        * Math.floor the components of a vec4
	        */

	    }, {
	        key: 'floor',
	        value: function floor() {
	            this._out[0] = Math.floor(this._out[0]);
	            this._out[1] = Math.floor(this._out[1]);
	            this._out[2] = Math.floor(this._out[2]);
	            this._out[3] = Math.floor(this._out[3]);
	            return this;
	        }
	        /**
	         * Returns the minimum of two vec4's
	         * @param {Vec4} vec
	         */

	    }, {
	        key: 'min',
	        value: function min(vec) {
	            this._out[0] = Math.min(this._out[0], vec.value[0]);
	            this._out[1] = Math.min(this._out[1], vec.value[1]);
	            this._out[2] = Math.min(this._out[2], vec.value[2]);
	            this._out[3] = Math.min(this._out[3], vec.value[3]);
	            return this;
	        }
	        /**
	         * Returns the maximum of two vec4's
	         * @param {Vec4} vec
	         */

	    }, {
	        key: 'max',
	        value: function max(vec) {
	            this._out[0] = Math.max(this._out[0], vec.value[0]);
	            this._out[1] = Math.max(this._out[1], vec.value[1]);
	            this._out[2] = Math.max(this._out[2], vec.value[2]);
	            this._out[3] = Math.max(this._out[3], vec._out[3]);
	            return this;
	        }
	        /**
	         * Scales a vec4 by a scalar number
	         * @param {number} s the scale
	         */

	    }, {
	        key: 'scale',
	        value: function scale(s) {
	            this._out[0] *= s;
	            this._out[1] *= s;
	            this._out[2] *= s;
	            this._out[3] *= s;
	            return this;
	        }
	        /**
	         * Calculates the euclidian distance between two vec4's
	         * @param {Vec4} vec the distance to vec
	         */

	    }, {
	        key: 'distance',
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
	        /**
	         * Calculates the length of a vec4
	         */

	    }, {
	        key: 'len',
	        value: function len() {
	            return this.distance(new Vec4());
	        }
	        /**
	         * Negates the components of a vec4
	         */

	    }, {
	        key: 'negate',
	        value: function negate() {
	            this._out[0] = -this._out[0];
	            this._out[1] = -this._out[1];
	            this._out[2] = -this._out[2];
	            this._out[3] = -this._out[3];
	            return this;
	        }
	        /**
	         * Returns the inverse of the components of a vec4
	         */

	    }, {
	        key: 'inverse',
	        value: function inverse() {
	            this._out[0] = 1.0 / this._out[0];
	            this._out[1] = 1.0 / this._out[1];
	            this._out[2] = 1.0 / this._out[2];
	            this._out[3] = 1.0 / this._out[3];
	        }
	        /**
	         * Normalize a vec4
	         */

	    }, {
	        key: 'normalize',
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
	        /**
	         * @param {Vec4} vec
	         */

	    }, {
	        key: 'dot',
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
	        /**
	         *  Performs a linear interpolation between two vec4's
	         */

	    }, {
	        key: 'lerp',
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
	        /**
	         * Transforms the vec4 with a mat4.
	         * @param {mat4} mat matrix to transform with
	         */

	    }, {
	        key: 'transformMat4',
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
	        /**
	         * Transforms the vec4 with a quat
	         * @param {quat} q quaternion to transform with
	         */

	    }, {
	        key: 'transformQuat',
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
	        /**
	         * Returns a string representation of a vector
	         */

	    }, {
	        key: 'toString',
	        value: function toString() {
	            return 'vec4(' + this._out[0] + ', ' + this._out[1] + ', ' + this._out[2] + ', ' + this._out[3] + ')';
	        }
	        /**
	         * Returns whether or not the vectors have approximately the same elements in the same position.
	         * @param {Vec4} vec
	         */

	    }, {
	        key: 'equals',
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

	            return Math.abs(a0 - b0) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3));
	        }
	    }, {
	        key: 'value',
	        get: function get$$1() {
	            return this._out;
	        }
	        /**
	         * Generates a random vector with the given scale
	         * @param {number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
	         */

	    }], [{
	        key: 'random',
	        value: function random() {
	            var vec = new Vec4();
	            //TODO: This is a pretty awful way of doing this. Find something better.
	            vec.set(GLMatrix_1.RANDOM(), GLMatrix_1.RANDOM(), GLMatrix_1.RANDOM(), GLMatrix_1.RANDOM()).normalize().scale();
	            return vec;
	        }
	    }]);
	    return Vec4;
	}();

	var Vec4_1 = Vec4;

	/**
	 * reference https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/mat3.js
	 * switch to es6 syntax,and change to quote
	 * warning:if you don't want to change the source value,please use mat3.clone().* instead of mat3.*
	 * @author yellow 2017/5/8
	 */

	/**
	 * @class
	 */

	var Mat3 = function () {
	    /**
	     * Creates a new identity mat3
	     */
	    function Mat3() {
	        classCallCheck(this, Mat3);

	        /**
	         * an array to store the 3*3 matrix data
	         * [1,0,0]
	         * [0,1,0]
	         * [0,0,1]
	         * @private 
	        */
	        this._out = new GLMatrix_1.ARRAY_TYPE(9);
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
	     * adapter for webgl matrix
	     * get the array directly
	     * @memberof mat3
	     * @return {Array}
	     */


	    createClass(Mat3, [{
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
	        /**
	         * clone the mat3 matrix
	         * @return {Mat3}
	         */

	    }, {
	        key: 'clone',
	        value: function clone() {
	            var mat = new Mat3().set(this._out[0], this._out[1], this._out[2], this._out[3], this._out[4], this._out[5], this._out[6], this._out[7], this._out[8]);
	            return mat;
	        }
	        /**
	         *  Copies the upper-left 3x3 values into the given mat3.
	         *  construct from mat4
	         *  @method fromMat4
	         *  @param {mat3} m
	         *  @return {mat3}
	         */

	    }, {
	        key: 'identity',

	        /**
	        * Set a mat3 to the identity matrix
	        * @method identity
	        * @param {Mat3} out the receiving matrix
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
	        /**
	         * Inverts a mat3
	         * @method invert
	         */

	    }, {
	        key: 'invert',
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
	                b21 = a21 * a10 - a11 * a20;
	            var det = a00 * b01 + a01 * b11 + a02 * b21;
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
	        /**
	         * Calculates the adjugate of a mat3
	         * 
	         */

	    }, {
	        key: 'adjoint',
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
	        /**
	         * Calculates the determinant of a mat3
	         */

	    }, {
	        key: 'determinant',
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
	        /**
	         * Multiplies other mat3
	         * @param {Mat3} mat a matrix 3*3 wait to multiply
	         */

	    }, {
	        key: 'multiply',
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

	            var _mat$value = slicedToArray(mat.value, 9),
	                b00 = _mat$value[0],
	                b01 = _mat$value[1],
	                b02 = _mat$value[2],
	                b10 = _mat$value[3],
	                b11 = _mat$value[4],
	                b12 = _mat$value[5],
	                b20 = _mat$value[6],
	                b21 = _mat$value[7],
	                b22 = _mat$value[8];

	            this._out[0] = b00 * a00 + b01 * a10 + b02 * a20;
	            this._out[1] = b00 * a01 + b01 * a11 + b02 * a21;
	            this._out[2] = b00 * a02 + b01 * a12 + b02 * a22;
	            this._out[3] = b10 * a00 + b11 * a10 + b12 * a20;
	            this._out[4] = b10 * a01 + b11 * a11 + b12 * a21;
	            this._out[5] = b10 * a02 + b11 * a12 + b12 * a22;
	            this._out[6] = b20 * a00 + b21 * a10 + b22 * a20;
	            this._out[7] = b20 * a01 + b21 * a11 + b22 * a21;
	            this._out[8] = b20 * a02 + b21 * a12 + b22 * a22;
	            return this;
	        }
	        /**
	         * Translate a mat3 by the given vector
	         * @param {vec2} vec vetor to translate by
	         * @return {mat3} 
	         */

	    }, {
	        key: 'translate',
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

	            var _vec$value = slicedToArray(vec.value, 2),
	                x = _vec$value[0],
	                y = _vec$value[1];

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
	        /**
	         * Rotates a mat3 by the given angle
	         * @param {Number} rad the angle to rotate the matrix by
	         */

	    }, {
	        key: 'rotate',
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
	        /**
	         * Scales the mat3 by the dimensions in the given vec2
	         * @param {vec2} v the vec2 to scale the matrix by
	         */

	    }, {
	        key: 'scale',
	        value: function scale(vec) {
	            var _vec$value2 = slicedToArray(vec.value, 2),
	                x = _vec$value2[0],
	                y = _vec$value2[1];

	            this._out[0] = x * this._out[0];
	            this._out[1] = x * this._out[1];
	            this._out[2] = x * this._out[2];
	            this._out[3] = y * this._out[3];
	            this._out[4] = y * this._out[4];
	            this._out[5] = y * this._out[5];
	            return this;
	        }
	        /**
	         * Calculates a 3x3 matrix from the given quaternion
	         * @param {quat} q Quaternion to create matrix from
	         */

	    }, {
	        key: 'fromQuat',
	        value: function fromQuat(q) {
	            var _q$value = slicedToArray(q.value, 4),
	                x = _q$value[0],
	                y = _q$value[1],
	                z = _q$value[2],
	                w = _q$value[3];

	            var x2 = x + x,
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
	            var _mat = new Mat3().set(1 - yy - zz, yx + wz, zx - wy, yx - wz, 1 - xx - zz, zy + wx, zx + wy, zy - wx, 1 - xx - yy);
	            return _mat;
	        }
	        /**
	         * 
	         * Calculates a 3x3 normal matrix (transpose inverse) from the 4x4 matrix
	         * @param {mat4} mat 
	         */

	    }, {
	        key: 'normalFromMat4',
	        value: function normalFromMat4(mat) {
	            var _mat$value2 = slicedToArray(mat.value, 16),
	                a00 = _mat$value2[0],
	                a01 = _mat$value2[1],
	                a02 = _mat$value2[2],
	                a03 = _mat$value2[3],
	                a10 = _mat$value2[4],
	                a11 = _mat$value2[5],
	                a12 = _mat$value2[6],
	                a13 = _mat$value2[7],
	                a20 = _mat$value2[8],
	                a21 = _mat$value2[9],
	                a22 = _mat$value2[10],
	                a23 = _mat$value2[11],
	                a30 = _mat$value2[12],
	                a31 = _mat$value2[13],
	                a32 = _mat$value2[14],
	                a33 = _mat$value2[15];

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
	            var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
	            if (!det) return null;
	            det = 1.0 / det;
	            var m00 = (a11 * b11 - a12 * b10 + a13 * b09) * det,
	                m01 = (a12 * b08 - a10 * b11 - a13 * b07) * det,
	                m02 = (a10 * b10 - a11 * b08 + a13 * b06) * det,
	                m10 = (a02 * b10 - a01 * b11 - a03 * b09) * det,
	                m11 = (a00 * b11 - a02 * b08 + a03 * b07) * det,
	                m12 = (a01 * b08 - a00 * b10 - a03 * b06) * det,
	                m20 = (a31 * b05 - a32 * b04 + a33 * b03) * det,
	                m21 = (a32 * b02 - a30 * b05 - a33 * b01) * det,
	                m22 = (a30 * b04 - a31 * b02 + a33 * b00) * det;
	            var _mat = new Mat3().set(m00, m01, m02, m10, m11, m12, m20, m21, m22);
	            return _mat;
	        }
	        /**
	         * Returns a string representation of a mat3
	         */

	    }, {
	        key: 'toString',
	        value: function toString() {
	            return 'mat3(' + this._out[0] + ', ' + this._out[1] + ', ' + this._out[2] + ', ' + this._out[3] + ', ' + this._out[4] + ', ' + this._out[5] + ', ' + this._out[6] + ', ' + this._out[7] + ', ' + this._out[8] + ')';
	        }
	        /**
	         * Returns Frobenius norm of a mat3 
	         * mat3 Frobenius norm
	         */

	    }, {
	        key: 'frob',
	        value: function frob() {
	            return Math.sqrt(Math.pow(this._out[0], 2) + Math.pow(this._out[1], 2) + Math.pow(this._out[2], 2) + Math.pow(this._out[3], 2) + Math.pow(this._out[4], 2) + Math.pow(this._out[5], 2) + Math.pow(this._out[6], 2) + Math.pow(this._out[7], 2) + Math.pow(this._out[8], 2));
	        }
	        /**
	         * Adds two mat3's
	         * @param {Mat3} mat 
	         * @return {Mat3}
	         */

	    }, {
	        key: 'add',
	        value: function add(mat) {
	            this._out[0] += mat.value[0];
	            this._out[1] += mat.value[1];
	            this._out[2] += mat.value[2];
	            this._out[3] += mat.value[3];
	            this._out[4] += mat.value[4];
	            this._out[5] += mat.value[5];
	            this._out[6] += mat.value[6];
	            this._out[7] += mat.value[7];
	            this._out[8] += mat.value[8];
	            return this;
	        }
	        /**
	         * Subtracts matrix b from matrix a
	         * @param {Mat3} mat 
	         * @return {Mat3}
	         */

	    }, {
	        key: 'sub',
	        value: function sub(mat) {
	            this._out[0] -= mat.value[0];
	            this._out[1] -= mat.value[1];
	            this._out[2] -= mat.value[2];
	            this._out[3] -= mat.value[3];
	            this._out[4] -= mat.value[4];
	            this._out[5] -= mat.value[5];
	            this._out[6] -= mat.value[6];
	            this._out[7] -= mat.value[7];
	            this._out[8] -= mat.value[8];
	            return this;
	        }
	        /**
	         * Multiply each element of the matrix by a vec3.
	         * @param {Vec3} vec 
	         */

	    }, {
	        key: 'scale',
	        value: function scale(vec) {
	            this._out[0] *= vec.value[0];
	            this._out[0] *= vec.value[0];
	            this._out[0] *= vec.value[0];
	            this._out[0] *= vec.value[1];
	            this._out[0] *= vec.value[1];
	            this._out[0] *= vec.value[1];
	            this._out[0] *= vec.value[2];
	            this._out[0] *= vec.value[2];
	            this._out[0] *= vec.value[2];
	            return this;
	        }
	        /**
	         * @param {any} mat 
	         * @memberof mat3
	         */

	    }, {
	        key: 'equals',
	        value: function equals(mat) {
	            var _out8 = slicedToArray(this._out, 9),
	                a0 = _out8[0],
	                a1 = _out8[1],
	                a2 = _out8[2],
	                a3 = _out8[3],
	                a4 = _out8[4],
	                a5 = _out8[5],
	                a6 = _out8[6],
	                a7 = _out8[7],
	                a8 = _out8[8];

	            var _mat$value3 = slicedToArray(mat.value, 9),
	                b0 = _mat$value3[0],
	                b1 = _mat$value3[1],
	                b2 = _mat$value3[2],
	                b3 = _mat$value3[3],
	                b4 = _mat$value3[4],
	                b5 = _mat$value3[5],
	                b6 = _mat$value3[6],
	                b7 = _mat$value3[7],
	                b8 = _mat$value3[8];

	            return Math.abs(a0 - b0) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a8), Math.abs(b8));
	        }
	    }, {
	        key: 'value',
	        get: function get$$1() {
	            return this._out;
	        }
	    }], [{
	        key: 'fromMat4',
	        value: function fromMat4(m) {
	            var mat = new Mat3();
	            mat.set(m.value[0], m.value[1], m.value[2], m.value[4], m.value[5], m.value[6], m.value[8], m.value[9], m.value[10]);
	            return mat;
	        }
	    }]);
	    return Mat3;
	}();

	var Mat3_1 = Mat3;

	/**
	 * reference https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/quat.js
	 * switch to es6 syntax
	 * warning:if you don't want to change the source value,please use quat.clone().* instead of quat.*
	 * @author yellow 2017/5/10
	 */

	/**
	 * @class Quaternion
	 * @name quat
	 */

	var Quat = function () {
	    /**
	     * Creates a new identity quat
	     */
	    function Quat() {
	        classCallCheck(this, Quat);

	        /**
	         * quat array store
	         * @private
	         */
	        this._out = new GLMatrix_1.ARRAY_TYPE(4);
	        this._out[0] = 0;
	        this._out[1] = 0;
	        this._out[2] = 0;
	        this._out[3] = 1;
	    }
	    /**
	     * adapter for webgl matrix
	     * get the array directly
	     * @memberof quat
	     * @return {Array}
	     */


	    createClass(Quat, [{
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
	        /**
	         * Creates a new quat initialized with values from an existing quaternion
	         */

	    }, {
	        key: 'clone',
	        value: function clone() {
	            var qua = new Quat();
	            qua.set(qua._out[0], qua._out[1], qua._out[2], qua._out[3]);
	            return qua;
	        }
	        /**
	         * Set a quat to the identity quaternion
	         */

	    }, {
	        key: 'identity',
	        value: function identity() {
	            this._out[0] = 0;
	            this._out[1] = 0;
	            this._out[2] = 0;
	            this._out[3] = 1;
	            return this;
	        }
	        /**
	         * @param {Vec3} vI the initial vector
	         * @param {Vec3} vII the destination vector
	         * 
	         */

	    }, {
	        key: 'rotationTo',
	        value: function rotationTo(vI, vII) {
	            this.r1 = this.r1 || new Vec3_1();
	            this.r2 = this.r2 || new Vec3_1().set(1, 0, 0);
	            this.r3 = this.r3 || new Vec3_1().set(0, 1, 0);
	            //
	            var dot = vI.dot(vII);
	            if (dot < -0.999999) {
	                this.r1 = this.r3.clone().cross(vI);
	                if (this.r1.len() < 0.000001) {
	                    this.r1 = this.r3.clone().cross(vI);
	                }
	                this.r3.normalize();
	                this.setAxisAngle(this.r1, Math.PI);
	                return this;
	            } else if (dot > 0.999999) {
	                this._out[0] = 0;
	                this._out[1] = 0;
	                this._out[2] = 0;
	                this._out[3] = 1;
	                return this;
	            } else {
	                this.r1 = vI.clone().cross(vII);
	                this._out[0] = tmpvec3[0];
	                this._out[1] = tmpvec3[1];
	                this._out[2] = tmpvec3[2];
	                this._out[3] = 1 + dot;
	                return this.normalize();
	            }
	        }
	        /**
	         * Sets the specified quaternion with values corresponding to the given
	         * axes. Each axis is a vec3 and is expected to be unit length and
	         * perpendicular to all other specified axes.
	         * @param {Vec3} vecView  the vector representing the viewing direction
	         * @param {Vec3} vecRight the vector representing the local "right" direction
	         * @param {Vec3} vecUp    the vector representing the local "up" direction
	         */

	    }, {
	        key: 'setAxes',
	        value: function setAxes(vecView, vecRight, vecUp) {
	            var mat = new Mat3_1().set(vecRight._out[0], vecUp._out[0], -vecView._out[0], vecRight._out[1], vecUp._out[1], -vecView._out[1], vecRight._out[2], vecUp._out[2], -vecView._out[2]);
	            return Quat.fromMat3(mat);
	        }
	        /**
	         * Sets a quat from the given angle and rotation axis,
	         * then returns it.
	         * @param {Vec3} axis the axis around which to rotate
	         * @param {number} rad
	         */

	    }, {
	        key: 'setAxisAngle',
	        value: function setAxisAngle(axis, rad) {
	            rad = rad * 0.5;
	            var s = Math.sin(rad);
	            this._out[0] = s * axis._out[0];
	            this._out[1] = s * axis._out[1];
	            this._out[2] = s * axis._out[2];
	            this._out[3] = Math.cos(rad);
	            return this;
	        }
	        /**
	         * Gets the rotation axis and angle for a given quaternion. 
	         * If a quaternion is created with setAxisAngle, 
	         * this method will return the same values as providied in the original parameter list OR functionally equivalent values.
	         * @example The quaternion formed by axis [0, 0, 1] and angle -90 is the same as the quaternion formed by [0, 0, 1] and 270. 
	         *          This method favors the latter.
	         * @return [axis,angle]
	         */

	    }, {
	        key: 'getAxisAngle',
	        value: function getAxisAngle() {
	            var rad = Math.acos(this._out[3]) * 2.0,
	                s = Math.sin(rad / 2.0);
	            var axis = new Vec3_1();
	            s === 0.0 ? axis.set(1, 0, 0) : axis.set(q[0] / s, q[1] / s, q[2] / s);
	            return [axis, rad];
	        }
	        /**
	         * add two quat's
	         * @param {Quat} qua 
	         */

	    }, {
	        key: 'add',
	        value: function add(qua) {
	            this._out[0] += qua._out[0];
	            this._out[1] += qua._out[1];
	            this._out[2] += qua._out[2];
	            this._out[3] += qua._out[3];
	            return this;
	        }
	        /**
	         * Multiplies two quat's
	         */

	    }, {
	        key: 'multiply',
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
	        /**
	         * @param {number} s
	         */

	    }, {
	        key: 'scale',
	        value: function scale(s) {
	            this._out[0] *= s;
	            this._out[1] *= s;
	            this._out[2] *= s;
	            this._out[3] *= s;
	            return this;
	        }
	        /**
	         * Rotates a quaternion by the given angle about the X axis
	         * @param {number} rad angle (in radians) to rotate
	         */

	    }, {
	        key: 'rotateX',
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
	        /**
	         * Rotates a quaternion by the given angle about the Y axis
	         * @param {number} rad angle (in radians) to rotate
	         */

	    }, {
	        key: 'rotateY',
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
	        /**
	         * Rotates a quaternion by the given angle about the Z axis
	         * @param {number} rad angle (in radians) to rotate
	         */

	    }, {
	        key: 'rotateZ',
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
	        /**
	         * Calculates the W component of a quat from the X, Y, and Z components.
	         * Assumes that quaternion is 1 unit in length
	         * Any existing W component will be ignored.
	         */

	    }, {
	        key: 'calculateW',
	        value: function calculateW() {
	            var _out5 = slicedToArray(this._out, 4),
	                x = _out5[0],
	                y = _out5[1],
	                z = _out5[2],
	                w = _out5[3];

	            this._out[3] = Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
	            return this;
	        }
	        /**
	         * Calculates the dot product of two quat's
	         * @return {number} dot product of two quat's
	         */

	    }, {
	        key: 'dot',
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
	        /**
	         * Performs a linear interpolation between two quat's
	         * @param {Quat} qua the second operand
	         * @param {Number} t interpolation amount between the two inputs
	         */

	    }, {
	        key: 'lerp',
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
	        /**
	         * Performs a spherical linear interpolation between two quat
	         * benchmarks: http://jsperf.com/quaternion-slerp-implementations
	         */

	    }, {
	        key: 'slerp',
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
	         * @param {Quat} quaI
	         * @param {Quat} quaII
	         * @param {Quat} quaIII
	         * @return
	         */

	    }, {
	        key: 'sqlerp',
	        value: function sqlerp(quaI, quaII, quaIII, t) {
	            this.sqlery1 = this.sqlery1 || new Quat();
	            this.sqlery2 = this.sqlery1 || new Quat();
	            //a.slerp(d,t)  b.slerp(c,t)
	            this.sqlery1 = this.clone().slerp(quaIII, t);
	            this.sqlery2 = quaI.clone().slerp(quaII, t);
	            var qua = this.sqlery1.clone().slerp(this.sqlery2, 2 * t * (1 - t));
	            return qua;
	        }
	        /**
	         * Calculates the inverse of a quat
	         * @return {Quat} the inversed quat 
	         */

	    }, {
	        key: 'invert',
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
	        /**
	         * Calculates the conjugate of a quat
	         * If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
	         */

	    }, {
	        key: 'conjugate',
	        value: function conjugate() {
	            this._out[0] = -this._out[0];
	            this._out[1] = -this._out[1];
	            this._out[2] = -this._out[2];
	            //this._out[3] = this._out[3]; omit to reduce assignment operation
	            return this;
	        }
	        /**
	         * retrun the length of quat
	         * @return {number} 
	         */

	    }, {
	        key: 'len',
	        value: function len() {
	            var _out10 = slicedToArray(this._out, 4),
	                x = _out10[0],
	                y = _out10[1],
	                z = _out10[2],
	                w = _out10[3];

	            return Math.sqrt(x * x + y * y + z * z + w * w);
	        }
	        /**
	         * Normalize a quat
	         */

	    }, {
	        key: 'normalize',
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
	        /**
	         * Returns a string representation of a quatenion
	         * @returns {String} string representation of the vector
	         */

	    }, {
	        key: 'toString',
	        value: function toString() {
	            return 'quat(' + this._out[0] + ', ' + this._out[1] + ', ' + this._out[2] + ', ' + this._out[3] + ')';
	        }
	        /**
	         * Returns whether or not the quat have approximately the same elements in the same position.
	         * @param 
	         */

	    }, {
	        key: 'equals',
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
	    }, {
	        key: 'value',
	        get: function get$$1() {
	            return this._out;
	        }
	        /**
	         * generic a quat from mat3
	         * @param {mat3} mat the 3x3 matrix 
	         */

	    }], [{
	        key: 'fromMat3',
	        value: function fromMat3(mat) {
	            // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
	            // article "Quaternion Calculus and Fast Animation".
	            var fTrace = mat._out[0] + mat._out[4] + mat._out[8],
	                qua = new Quat(),
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
	    return Quat;
	}();

	var Quat_1 = Quat;

	/**
	 * reference https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/mat4.js
	 * switch to es6 syntax
	 * warning:if you don't want to change the source value,please use mat4.clone().* instead of mat4.* (* means matrix operations)
	 * @author yellow 2017/5/10
	 * translation:
	 * [1, 0, 0, 0,
	 *  0, 1, 0, 0,
	 *  0, 0, 1, 0,
	 *  tx,ty,tz,1]
	 * x-rotation:
	 * [1, 0, 0, 0,
	 *  0, c, s, 0,
	 *  0,-s, c, 0,
	 *  0, 0, 0, 1]
	 * y-rotation:
	 * [c, 0,-s, 0,
	 *  0, 1, 0, 0,
	 *  s, 0, c, 0,
	 *  0, 0, 0, 1]
	 * z-rotation:
	 * [c, s, 0, 0,
	 *  -s,c, s, 0,
	 *  0, 0, 1, 0,
	 *  0, 0, 0, 1]
	 * scale:
	 * [sx,0, 0, 0,
	 *  0, sy,0, 0,
	 *  0, 0, sz,0,
	 *  0, 0, 0, 1]
	 * notice that multlpy as translation*vec
	 */

	/**
	 * @class
	 */

	var Mat4 = function () {
	    /**
	     *  Creates a new identity mat4
	     */
	    function Mat4() {
	        classCallCheck(this, Mat4);

	        /**
	         * 4x4 matrix array store
	         * @private
	         */
	        this._out = new GLMatrix_1.ARRAY_TYPE(16);
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
	     * adapter for webgl matrix
	     * get the array directly
	     * @memberof mat4
	     * @return {Array}
	     */


	    createClass(Mat4, [{
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
	        /**
	         * Creates a new mat4 initialized with values from an existing matrix
	         */

	    }, {
	        key: 'clone',
	        value: function clone() {
	            var mat = new Mat4();
	            mat.set(this._out[0], this._out[1], this._out[2], this._out[3], this._out[4], this._out[5], this._out[6], this._out[7], this._out[8], this._out[9], this._out[10], this._out[11], this._out[12], this._out[13], this._out[14], this._out[15]);
	            return mat;
	        }
	        /**
	         * Set a mat4 to the identity matrix
	         */

	    }, {
	        key: 'identity',
	        value: function identity() {
	            this.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
	            return this;
	        }
	        /**
	         * Inverts a mat4
	         */

	    }, {
	        key: 'invert',
	        value: function invert() {
	            //deconstruction assignment
	            var _out = slicedToArray(this._out, 16),
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
	                b11 = a22 * a33 - a23 * a32;
	            // Calculate the determinant


	            var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
	            if (!det) return null;
	            det = 1.0 / det;
	            this._out = [(a11 * b11 - a12 * b10 + a13 * b09) * det, (a02 * b10 - a01 * b11 - a03 * b09) * det, (a31 * b05 - a32 * b04 + a33 * b03) * det, (a22 * b04 - a21 * b05 - a23 * b03) * det, (a12 * b08 - a10 * b11 - a13 * b07) * det, (a00 * b11 - a02 * b08 + a03 * b07) * det, (a32 * b02 - a30 * b05 - a33 * b01) * det, (a20 * b05 - a22 * b02 + a23 * b01) * det, (a10 * b10 - a11 * b08 + a13 * b06) * det, (a01 * b08 - a00 * b10 - a03 * b06) * det, (a30 * b04 - a31 * b02 + a33 * b00) * det, (a21 * b02 - a20 * b04 - a23 * b00) * det, (a11 * b07 - a10 * b09 - a12 * b06) * det, (a00 * b09 - a01 * b07 + a02 * b06) * det, (a31 * b01 - a30 * b03 - a32 * b00) * det, (a20 * b03 - a21 * b01 + a22 * b00) * det];
	            return this;
	        }
	        /**
	         * Calculates the adjugate of a mat4 not using SIMD
	         */

	    }, {
	        key: 'adjoint',
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
	        /**
	         * Calculates the determinant of a mat4
	         * @return {number} determinant of this matrix
	         */

	    }, {
	        key: 'determinant',
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
	        /**
	         * Multiplies two mat4's explicitly not using SIMD
	         * @param {Mat4} mat
	         */

	    }, {
	        key: 'multiply',
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


	            var b0 = mat.value[0],
	                b1 = mat.value[1],
	                b2 = mat.value[2],
	                b3 = mat.value[3];
	            this._out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	            this._out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	            this._out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	            this._out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

	            b0 = mat.value[4];b1 = mat.value[5];b2 = mat.value[6];b3 = mat.value[7];
	            this._out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	            this._out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	            this._out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	            this._out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

	            b0 = mat.value[8];b1 = mat.value[9];b2 = mat.value[10];b3 = mat.value[11];
	            this._out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	            this._out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	            this._out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	            this._out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

	            b0 = mat.value[12];b1 = mat.value[13];b2 = mat.value[14];b3 = mat.value[15];
	            this._out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	            this._out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	            this._out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	            this._out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

	            return this;
	        }
	        /**
	         * add two 4x4 matrixs 
	         */

	    }, {
	        key: 'add',
	        value: function add(mat) {
	            this._out[0] += mat.value[0];
	            this._out[1] += mat.value[1];
	            this._out[2] += mat.value[2];
	            this._out[3] += mat.value[3];
	            this._out[4] += mat.value[4];
	            this._out[5] += mat.value[5];
	            this._out[6] += mat.value[6];
	            this._out[7] += mat.value[7];
	            this._out[8] += mat.value[8];
	            this._out[9] += mat.value[9];
	            this._out[10] += mat.value[10];
	            this._out[11] += mat.value[11];
	            this._out[12] += mat.value[12];
	            this._out[13] += mat.value[13];
	            this._out[14] += mat.value[14];
	            this._out[15] += mat.value[15];
	            return this;
	        }
	        /**
	         * Translate a mat4 by the given vector not using SIMD
	         * @param {Vec3} v3 vector to translate by
	         * @return {Mat4}
	         * @example
	         *  let m4=new mat4();
	         *  m4.translate(new vec3(1,0,4));
	         *  m4.getTranslation(); 
	         */

	    }, {
	        key: 'translate',
	        value: function translate(v3) {
	            var _v3$value = slicedToArray(v3.value, 3),
	                x = _v3$value[0],
	                y = _v3$value[1],
	                z = _v3$value[2],
	                _out5 = slicedToArray(this._out, 16),
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
	                a23 = _out5[11],
	                a30 = _out5[12],
	                a31 = _out5[13],
	                a32 = _out5[14],
	                a33 = _out5[15];

	            this._out[12] = a00 * x + a10 * y + a20 * z + a30;
	            this._out[13] = a01 * x + a11 * y + a21 * z + a31;
	            this._out[14] = a02 * x + a12 * y + a22 * z + a32;
	            this._out[15] = a03 * x + a13 * y + a23 * z + a33;
	            return this;
	        }
	        /**
	         * Scales the mat4 by the dimensions in the given vec3 not using vectorization
	         * @param {Vec3} vec the vec3 to scale the matrix by
	         */

	    }, {
	        key: 'scale',
	        value: function scale(vec) {
	            var _vec$_out = slicedToArray(vec._out, 3),
	                x = _vec$_out[0],
	                y = _vec$_out[1],
	                z = _vec$_out[2];

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
	        /**
	         * Rotates a mat4 by the given angle around the given axis
	         * @param {number} rad the angle to rotate the matrix by
	         * @param {Vec3} axis the axis to rotate around
	         */

	    }, {
	        key: 'rotate',
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

	            if (Math.abs(len) < GLMatrix_1.EPSILON) {
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
	        /**
	         * Rotates a matrix by the given angle around the X axis not using SIMD
	         * @param {number} rad
	         */

	    }, {
	        key: 'rotateX',
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
	        /**
	         * Rotates a matrix by the given angle around the Y axis not using SIMD
	         * @param {Number} rad the angle to rotate the matrix by
	         */

	    }, {
	        key: 'rotateY',
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
	        /**
	         * Rotates a matrix by the given angle around the Z axis not using SIMD
	         * @param {Number} rad the angle to rotate the matrix by
	         */

	    }, {
	        key: 'rotateZ',
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
	        /**
	         * Creates a matrix from a vector translation
	         * This is equivalent to (but much faster than):
	         *      mat4.identity(dest);
	         *      mat4.translate(dest, dest, vec);
	         * @param {Vec3} v3 Translation vector
	         */

	    }, {
	        key: 'getTranslation',

	        /**
	         * Returns the translation vector component of a transformation
	         *  matrix. If a matrix is built with fromRotationTranslation,
	         *  the returned vector will be the same as the translation vector
	         *  originally supplied.
	         * @return {Vec3} out
	        */
	        value: function getTranslation() {
	            var v3 = new Vec3_1();
	            v3.set(this._out[12], this._out[13], this._out[14]);
	            return v3;
	        }
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
	         * @param {Vec3} vec Translation vector
	         */

	    }, {
	        key: 'getScaling',

	        /**
	         * Returns the scaling factor component of a transformation
	         * matrix. If a matrix is built with fromRotationTranslationScale
	         * with a normalized Quaternion paramter, the returned vector will be 
	         * the same as the scaling vector
	         * originally supplied.
	         * @return {Vec3} 
	         */
	        value: function getScaling() {
	            var vec = new Vec3_1(),
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
	        /**
	         * Returns a quaternion representing the rotational component
	         * of a transformation matrix. If a matrix is built with
	         * fromRotationTranslation, the returned quaternion will be the
	         * same as the quaternion originally supplied.
	         * Algorithm taken from http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
	         * @return {quat} 
	         */

	    }, {
	        key: 'getRotation',
	        value: function getRotation() {
	            var S = 0,
	                x = void 0,
	                y = void 0,
	                z = void 0,
	                w = void 0,
	                qua = new Quat_1(),
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
	        /**
	         * Creates a matrix from a quaternion rotation, vector translation and vector scale
	         * This is equivalent to (but much faster than):
	         *  mat4.identity(dest);
	         *  mat4.translate(dest, vec);
	         *  var quatMat = mat4.create();
	         *  quat4.toMat4(quat, quatMat);
	         *  mat4.multiply(dest, quatMat);
	         *  mat4.scale(dest, scale)
	         * @param {quat} q rotation quaternion
	         * @param {Vec3} v translation vector
	         * @param {Vec3} s scaling vectoer
	         * @return {Mat4} 
	         */

	    }, {
	        key: 'lookAt',

	        /**
	         * Generates a look-at matrix with the given eye position, focal point, and up axis
	         * @param {Vec3} eye the camera Position of the viewer
	         * @param {Vec3} center the target point the viewer is looking at
	         * @param {Vec3} up vec3 pointing up
	         * @return {Mat4}
	         */
	        // lookAt(eye, center, up) {
	        //     let x0, x1, x2, y0, y1, y2, z0, z1, z2, len,
	        //         [eyex, eyey, eyez] = eye.value,
	        //         [upx, upy, upz] = up.value,
	        //         [centerx, centery, centerz] = center._out;

	        //     if (Math.abs(eyex - centerx) < GLMatrix.EPSILON &&
	        //         Math.abs(eyey - centery) < GLMatrix.EPSILON &&
	        //         Math.abs(eyez - centerz) < GLMatrix.EPSILON) {
	        //         return this.identity();
	        //     }
	        //     z0 = eyex - centerx;
	        //     z1 = eyey - centery;
	        //     z2 = eyez - centerz;
	        //     len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
	        //     z0 *= len;
	        //     z1 *= len;
	        //     z2 *= len;
	        //     x0 = upy * z2 - upz * z1;
	        //     x1 = upz * z0 - upx * z2;
	        //     x2 = upx * z1 - upy * z0;
	        //     len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
	        //     if (!len) {
	        //         x0 = 0;
	        //         x1 = 0;
	        //         x2 = 0;
	        //     } else {
	        //         len = 1 / len;
	        //         x0 *= len;
	        //         x1 *= len;
	        //         x2 *= len;
	        //     }
	        //     y0 = z1 * x2 - z2 * x1;
	        //     y1 = z2 * x0 - z0 * x2;
	        //     y2 = z0 * x1 - z1 * x0;
	        //     len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
	        //     if (!len) {
	        //         y0 = 0;
	        //         y1 = 0;
	        //         y2 = 0;
	        //     } else {
	        //         len = 1 / len;
	        //         y0 *= len;
	        //         y1 *= len;
	        //         y2 *= len;
	        //     }
	        //     this.set(x0, y0, z0, 0,
	        //         x1, y1, z1, 0,
	        //         x2, y2, z2, 0,
	        //         -(x0 * eyex + x1 * eyey + x2 * eyez), -(y0 * eyex + y1 * eyey + y2 * eyez), -(z0 * eyex + z1 * eyey + z2 * eyez), 1);
	        //     return this;
	        // }
	        /**
	         * Generates a look-at matrix with the given eye position, focal point, and up axis
	         * @param {Vec3} cameraPosition the camera Position of the viewer
	         * @param {Vec3} center the target point the viewer is looking at
	         * @param {Vec3} up vec3 pointing up
	         * @return {Mat4}
	         */
	        value: function lookAt(cameraPosition, target, up) {
	            var zAxis = cameraPosition.clone().sub(target).normalize(),
	                xAxis = up.clone().cross(zAxis),
	                yAxis = zAxis.clone().cross(xAxis);
	            this.set(xAxis.value[0], xAxis.value[1], xAxis.value[2], 0, yAxis.value[0], yAxis.value[1], yAxis.value[2], 0, zAxis.value[0], zAxis.value[1], zAxis.value[2], 0, cameraPosition.value[0], cameraPosition.value[1], cameraPosition.value[2], 1);
	            return this;
	        }
	        /**
	         * Returns a string representation of a mat4
	         * @return {String}
	         */

	    }, {
	        key: 'toString',
	        value: function toString() {
	            return 'mat4(' + this._out[0] + ', ' + this._out[1] + ', ' + this._out[2] + ', ' + this._out[3] + ', ' + this._out[4] + ', ' + this._out[5] + ', ' + this._out[6] + ', ' + this._out[7] + ', ' + this._out[8] + ', ' + this._out[9] + ', ' + this._out[10] + ', ' + this._out[11] + ', ' + this._out[12] + ', ' + this._out[13] + ', ' + this._out[14] + ', ' + this._out[15] + ')';
	        }
	        /**
	         * Returns Frobenius norm of a mat4
	         * @return {Number} Frobenius norm
	         */

	    }, {
	        key: 'forb',
	        value: function forb() {
	            return Math.sqrt(Math.pow(this._out[0], 2) + Math.pow(this._out[1], 2) + Math.pow(this._out[2], 2) + Math.pow(this._out[3], 2) + Math.pow(this._out[4], 2) + Math.pow(this._out[5], 2) + Math.pow(this._out[6], 2) + Math.pow(this._out[7], 2) + Math.pow(this._out[8], 2) + Math.pow(this._out[9], 2) + Math.pow(this._out[10], 2) + Math.pow(this._out[11], 2) + Math.pow(this._out[12], 2) + Math.pow(this._out[13], 2) + Math.pow(this._out[14], 2) + Math.pow(this._out[15], 2));
	        }
	        /**
	         * Adds two mat4's
	         * @param {Mat4} m4
	         */

	    }, {
	        key: 'add',
	        value: function add(m4) {
	            this._out[0] += m4.value[0];
	            this._out[1] += m4.value[1];
	            this._out[2] += m4.value[2];
	            this._out[3] += m4.value[3];
	            this._out[4] += m4.value[4];
	            this._out[5] += m4.value[5];
	            this._out[6] += m4.value[6];
	            this._out[7] += m4.value[7];
	            this._out[8] += m4.value[8];
	            this._out[9] += m4.value[9];
	            this._out[10] += m4.value[10];
	            this._out[11] += m4.value[11];
	            this._out[12] += m4.value[12];
	            this._out[13] += m4.value[13];
	            this._out[14] += m4.value[14];
	            this._out[15] += m4.value[15];
	            return this;
	        }
	        /**
	         * Subtracts matrix b from matrix a
	         * @param {Mat4} m4
	         * @return {Mat4}
	         */

	    }, {
	        key: 'sub',
	        value: function sub(m4) {
	            this._out[0] -= m4.value[0];
	            this._out[1] -= m4.value[1];
	            this._out[2] -= m4.value[2];
	            this._out[3] -= m4.value[3];
	            this._out[4] -= m4.value[4];
	            this._out[5] -= m4.value[5];
	            this._out[6] -= m4.value[6];
	            this._out[7] -= m4.value[7];
	            this._out[8] -= m4.value[8];
	            this._out[9] -= m4.value[9];
	            this._out[10] -= m4.value[10];
	            this._out[11] -= m4.value[11];
	            this._out[12] -= m4.value[12];
	            this._out[13] -= m4.value[13];
	            this._out[14] -= m4.value[14];
	            this._out[15] -= m4.value[15];
	            return this;
	        }
	        /**
	         * Returns whether or not the matrices have approximately the same elements in the same position.
	         * @param {Mat4} m4
	         * @param {boolean}
	         */

	    }, {
	        key: 'equals',
	        value: function equals(m4) {
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
	                _m4$value = slicedToArray(m4.value, 16),
	                b0 = _m4$value[0],
	                b1 = _m4$value[1],
	                b2 = _m4$value[2],
	                b3 = _m4$value[3],
	                b4 = _m4$value[4],
	                b5 = _m4$value[5],
	                b6 = _m4$value[6],
	                b7 = _m4$value[7],
	                b8 = _m4$value[8],
	                b9 = _m4$value[9],
	                b10 = _m4$value[10],
	                b11 = _m4$value[11],
	                b12 = _m4$value[12],
	                b13 = _m4$value[13],
	                b14 = _m4$value[14],
	                b15 = _m4$value[15];

	            return Math.abs(a0 - b0) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a8), Math.abs(b8)) && Math.abs(a9 - b9) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a9), Math.abs(b9)) && Math.abs(a10 - b10) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a10), Math.abs(b10)) && Math.abs(a11 - b11) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a11), Math.abs(b11)) && Math.abs(a12 - b12) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a12), Math.abs(b12)) && Math.abs(a13 - b13) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a13), Math.abs(b13)) && Math.abs(a14 - b14) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a14), Math.abs(b14)) && Math.abs(a15 - b15) <= GLMatrix_1.EPSILON * Math.max(1.0, Math.abs(a15), Math.abs(b15));
	        }
	    }, {
	        key: 'value',
	        get: function get$$1() {
	            return this._out;
	        }
	    }], [{
	        key: 'fromVec3Translation',
	        value: function fromVec3Translation(v3) {
	            var m4 = new Mat4(),
	                _v3$value2 = slicedToArray(v3.value, 3),
	                x = _v3$value2[0],
	                y = _v3$value2[1],
	                z = _v3$value2[2];

	            m4.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1);
	            return m4;
	        }
	        /**
	         * Creates a matrix from a vector scaling
	         * This is equivalent to (but much faster than):
	         *  mat4.identity(dest);
	         *  mat4.scale(dest, dest, vec);
	         * @param {Vec3} vec Scaling vector
	         * @returns {Mat4} 
	         */

	    }, {
	        key: 'fromScaling',
	        value: function fromScaling(vec) {
	            var mat = new Mat4(),
	                _vec$_out2 = slicedToArray(vec._out, 3),
	                x = _vec$_out2[0],
	                y = _vec$_out2[1],
	                z = _vec$_out2[2];

	            mat.set(x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1);
	            return mat;
	        }
	        /**
	         * Creates a matrix from a given angle around a given axis
	         * This is equivalent to (but much faster than):
	         *  mat4.identity(dest);
	         *  mat4.rotate(dest, dest, rad, axis);
	         * @param {Number} rad the angle to rotate the matrix by
	         * @param {Vec3} axis the axis to rotate around
	         */

	    }, {
	        key: 'fromRotation',
	        value: function fromRotation(rad, axis) {
	            var _axis$_out2 = slicedToArray(axis._out, 3),
	                x = _axis$_out2[0],
	                y = _axis$_out2[1],
	                z = _axis$_out2[2],
	                len = axis.len(),
	                mat = new Mat4(),
	                s,
	                c,
	                t;

	            if (len < GLMatrix_1.EPSILON) {
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
	        /**
	         * Creates a matrix from the given angle around the X axis
	         * This is equivalent to (but much faster than):
	         *  mat4.identity(dest);
	         *  mat4.rotateX(dest, dest, rad);
	         * @param {Number} rad the angle to rotate the matrix by
	         */

	    }, {
	        key: 'fromXRotation',
	        value: function fromXRotation(rad) {
	            var mat = new Mat4(),
	                s = Math.sin(rad),
	                c = Math.cos(rad);
	            mat.set(1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1);
	            return mat;
	        }
	        /**
	         * Creates a matrix from the given angle around the Y axis
	         * This is equivalent to (but much faster than):
	         *  mat4.identity(dest);
	         *  mat4.rotateY(dest, dest, rad);
	         * 
	         * @param {Number} rad the angle to rotate the matrix by
	         */

	    }, {
	        key: 'fromYRotation',
	        value: function fromYRotation(rad) {
	            var mat = new Mat4(),
	                s = Math.sin(rad),
	                c = Math.cos(rad);
	            // Perform axis-specific matrix multiplication
	            mat.set(c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1);
	            return mat;
	        }
	        /**
	         * Creates a matrix from the given angle around the Z axis
	         * This is equivalent to (but much faster than):
	         *  mat4.identity(dest);
	         *  mat4.rotateZ(dest, dest, rad);
	         * 
	         * @param {Number} rad the angle to rotate the matrix by
	         */

	    }, {
	        key: 'fromZRotation',
	        value: function fromZRotation(rad) {
	            var mat = new Mat4(),
	                s = Math.sin(rad),
	                c = Math.cos(rad);
	            // Perform axis-specific matrix multiplication
	            mat.set(c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
	            return mat;
	        }
	    }, {
	        key: 'fromRotationTranslation',
	        value: function fromRotationTranslation(qua, vec) {
	            // Quaternion math
	            var mat = new Mat4(),
	                _qua$_out = slicedToArray(qua._out, 4),
	                x = _qua$_out[0],
	                y = _qua$_out[1],
	                z = _qua$_out[2],
	                w = _qua$_out[3],
	                _vec$_out3 = slicedToArray(vec._out, 3),
	                v0 = _vec$_out3[0],
	                v1 = _vec$_out3[1],
	                v2 = _vec$_out3[2],
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
	        value: function fromRotationTranslationScale(q, v, s) {
	            var mat = new Mat4(),
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
	         * @param {Vec3} v Translation vector
	         * @param {Vec3} s Scaling vector
	         * @param {Vec3} o The origin vector around which to scale and rotate
	         * @return {Mat4}
	         */

	    }, {
	        key: 'fromRotationTranslationScaleOrigin',
	        value: function fromRotationTranslationScaleOrigin(q, v, s, o) {
	            // Quaternion math
	            var mat = new Mat4(),
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
	        /**
	         * Calculates a 4x4 matrix from the given quaternion
	         * @param {quat} q Quaternion to create matrix from
	         * @return {Mat4}
	         */

	    }, {
	        key: 'fromQuat',
	        value: function fromQuat(q) {
	            var mat = new Mat4(),
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
	        /**
	         * Generates a frustum matrix with the given bounds
	         * @param {Number} left Left bound of the frustum
	         * @param {Number} right Right bound of the frustum
	         * @param {Number} bottom Bottom bound of the frustum
	         * @param {Number} top Top bound of the frustum
	         * @param {Number} near Near bound of the frustum
	         * @param {Number} far Far bound of the frustum
	         * @return {Mat4}
	         */

	    }, {
	        key: 'frustum',
	        value: function frustum(left, right, bottom, top, near, far) {
	            var mat = new Mat4(),
	                rl = 1 / (right - left),
	                tb = 1 / (top - bottom),
	                nf = 1 / (near - far);
	            mat.set(near * 2 * rl, 0, 0, 0, 0, near * 2 * tb, 0, 0, (right + left) * rl, (top + bottom) * tb, (far + near) * nf, -1, 0, 0, far * near * 2 * nf, 0);
	            return mat;
	        }
	        /**
	         * Generates a perspective projection matrix with the given bounds
	         * @param {number} fovy Vertical field of view in radians
	         * @param {number} aspect Aspect ratio. typically viewport width/height
	         * @param {number} near Near bound of the frustum
	         * @param {number} far Far bound of the frustum
	         * @return {Mat4}
	         */

	    }, {
	        key: 'perspective',
	        value: function perspective(fovy, aspect, near, far) {
	            var m4 = new Mat4(),

	            //f = 1.0 / Math.tan(fovy / 2), discard
	            //tan（π/2-α）= cotα 
	            //cot(fovy/2) = tan(pi/2 - fovy/2);
	            f = Math.tan((Math.PI - fovy) * 0.5),
	                nf = 1.0 / (near - far);
	            m4.set(f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0);
	            return m4;
	        }
	        /**
	         * Generates a perspective projection matrix with the given field of view.
	         * This is primarily useful for generating projection matrices to be used
	         * with the still experiemental WebVR API.
	         * @param {Object} fov Object containing the following values: upDegrees, downDegrees, leftDegrees, rightDegrees
	         * @param {number} near Near bound of the frustum
	         * @param {number} far Far bound of the frustum
	         * @return {Mat4} out
	         */

	    }, {
	        key: 'perspectiveFromFieldOfView',
	        value: function perspectiveFromFieldOfView(fov, near, far) {
	            var m4 = new Mat4(),
	                upTan = Math.tan(fov.upDegrees * Math.PI / 180.0),
	                downTan = Math.tan(fov.downDegrees * Math.PI / 180.0),
	                leftTan = Math.tan(fov.leftDegrees * Math.PI / 180.0),
	                rightTan = Math.tan(fov.rightDegrees * Math.PI / 180.0),
	                xScale = 2.0 / (leftTan + rightTan),
	                yScale = 2.0 / (upTan + downTan);
	            m4.set(xScale, 0, 0, 0, 0, yScale, 0, 0, -((leftTan - rightTan) * xScale * 0.5), (upTan - downTan) * yScale * 0.5, far / (near - far), -1, 0, 0, far * near / (near - far), 0);
	            return m4;
	        }
	        /**
	         * Generates a orthogonal projection matrix with the given bounds
	         * reference https://webgl2fundamentals.org/webgl/lessons/webgl-3d-orthographic.html
	         * @param {number} left Left bound of the frustum
	         * @param {number} right Right bound of the frustum
	         * @param {number} bottom Bottom bound of the frustum
	         * @param {number} top Top bound of the frustum
	         * @param {number} near Near bound of the frustum
	         * @param {number} far Far bound of the frustum
	         * @return {Mat4} 
	         */

	    }, {
	        key: 'ortho',
	        value: function ortho(left, right, bottom, top, near, far) {
	            var mat = new Mat4(),
	                lr = 1.0 / (left - right),
	                bt = 1.0 / (bottom - top),
	                nf = 1.0 / (near - far);
	            mat.set(-2 * lr, 0, 0, 0, 0, -2 * bt, 0, 0, 0, 0, 2 * nf, 0, (left + right) * lr, (top + bottom) * bt, (far + near) * nf, 1);
	            return mat;
	        }
	    }]);
	    return Mat4;
	}();

	var Mat4_1 = Mat4;

	/**
	 * make a package of matrix
	 */

	var init = {
	    Vec2: Vec2_1,
	    Vec3: Vec3_1,
	    Vec4: Vec4_1,
	    Mat3: Mat3_1,
	    Mat4: Mat4_1,
	    Quat: Quat_1,
	    GLMatrix: GLMatrix_1
	};
	var init_1 = init.Vec2;
	var init_2 = init.Vec3;
	var init_3 = init.Vec4;
	var init_4 = init.Mat3;
	var init_5 = init.Mat4;
	var init_6 = init.Quat;
	var init_7 = init.GLMatrix;

	exports.default = init;
	exports.Vec2 = init_1;
	exports.Vec3 = init_2;
	exports.Vec4 = init_3;
	exports.Mat3 = init_4;
	exports.Mat4 = init_5;
	exports.Quat = init_6;
	exports.GLMatrix = init_7;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
