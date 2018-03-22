(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.fusion = {})));
}(this, (function (exports) { 'use strict';

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
	  return typeof obj;
	} : function (obj) {
	  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
	};

	var jsx = function () {
	  var REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol.for && Symbol.for("react.element") || 0xeac7;
	  return function createRawReactElement(type, props, key, children) {
	    var defaultProps = type && type.defaultProps;
	    var childrenLength = arguments.length - 3;

	    if (!props && childrenLength !== 0) {
	      props = {};
	    }

	    if (props && defaultProps) {
	      for (var propName in defaultProps) {
	        if (props[propName] === void 0) {
	          props[propName] = defaultProps[propName];
	        }
	      }
	    } else if (!props) {
	      props = defaultProps || {};
	    }

	    if (childrenLength === 1) {
	      props.children = children;
	    } else if (childrenLength > 1) {
	      var childArray = Array(childrenLength);

	      for (var i = 0; i < childrenLength; i++) {
	        childArray[i] = arguments[i + 3];
	      }

	      props.children = childArray;
	    }

	    return {
	      $$typeof: REACT_ELEMENT_TYPE,
	      type: type,
	      key: key === undefined ? null : '' + key,
	      ref: null,
	      props: props,
	      _owner: null
	    };
	  };
	}();

	var asyncIterator = function (iterable) {
	  if (typeof Symbol === "function") {
	    if (Symbol.asyncIterator) {
	      var method = iterable[Symbol.asyncIterator];
	      if (method != null) return method.call(iterable);
	    }

	    if (Symbol.iterator) {
	      return iterable[Symbol.iterator]();
	    }
	  }

	  throw new TypeError("Object is not async iterable");
	};

	var asyncGenerator = function () {
	  function AwaitValue(value) {
	    this.value = value;
	  }

	  function AsyncGenerator(gen) {
	    var front, back;

	    function send(key, arg) {
	      return new Promise(function (resolve, reject) {
	        var request = {
	          key: key,
	          arg: arg,
	          resolve: resolve,
	          reject: reject,
	          next: null
	        };

	        if (back) {
	          back = back.next = request;
	        } else {
	          front = back = request;
	          resume(key, arg);
	        }
	      });
	    }

	    function resume(key, arg) {
	      try {
	        var result = gen[key](arg);
	        var value = result.value;

	        if (value instanceof AwaitValue) {
	          Promise.resolve(value.value).then(function (arg) {
	            resume("next", arg);
	          }, function (arg) {
	            resume("throw", arg);
	          });
	        } else {
	          settle(result.done ? "return" : "normal", result.value);
	        }
	      } catch (err) {
	        settle("throw", err);
	      }
	    }

	    function settle(type, value) {
	      switch (type) {
	        case "return":
	          front.resolve({
	            value: value,
	            done: true
	          });
	          break;

	        case "throw":
	          front.reject(value);
	          break;

	        default:
	          front.resolve({
	            value: value,
	            done: false
	          });
	          break;
	      }

	      front = front.next;

	      if (front) {
	        resume(front.key, front.arg);
	      } else {
	        back = null;
	      }
	    }

	    this._invoke = send;

	    if (typeof gen.return !== "function") {
	      this.return = undefined;
	    }
	  }

	  if (typeof Symbol === "function" && Symbol.asyncIterator) {
	    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
	      return this;
	    };
	  }

	  AsyncGenerator.prototype.next = function (arg) {
	    return this._invoke("next", arg);
	  };

	  AsyncGenerator.prototype.throw = function (arg) {
	    return this._invoke("throw", arg);
	  };

	  AsyncGenerator.prototype.return = function (arg) {
	    return this._invoke("return", arg);
	  };

	  return {
	    wrap: function (fn) {
	      return function () {
	        return new AsyncGenerator(fn.apply(this, arguments));
	      };
	    },
	    await: function (value) {
	      return new AwaitValue(value);
	    }
	  };
	}();

	var asyncGeneratorDelegate = function (inner, awaitWrap) {
	  var iter = {},
	      waiting = false;

	  function pump(key, value) {
	    waiting = true;
	    value = new Promise(function (resolve) {
	      resolve(inner[key](value));
	    });
	    return {
	      done: false,
	      value: awaitWrap(value)
	    };
	  }

	  if (typeof Symbol === "function" && Symbol.iterator) {
	    iter[Symbol.iterator] = function () {
	      return this;
	    };
	  }

	  iter.next = function (value) {
	    if (waiting) {
	      waiting = false;
	      return value;
	    }

	    return pump("next", value);
	  };

	  if (typeof inner.throw === "function") {
	    iter.throw = function (value) {
	      if (waiting) {
	        waiting = false;
	        throw value;
	      }

	      return pump("throw", value);
	    };
	  }

	  if (typeof inner.return === "function") {
	    iter.return = function (value) {
	      return pump("return", value);
	    };
	  }

	  return iter;
	};

	var asyncToGenerator = function (fn) {
	  return function () {
	    var gen = fn.apply(this, arguments);
	    return new Promise(function (resolve, reject) {
	      function step(key, arg) {
	        try {
	          var info = gen[key](arg);
	          var value = info.value;
	        } catch (error) {
	          reject(error);
	          return;
	        }

	        if (info.done) {
	          resolve(value);
	        } else {
	          return Promise.resolve(value).then(function (value) {
	            step("next", value);
	          }, function (err) {
	            step("throw", err);
	          });
	        }
	      }

	      return step("next");
	    });
	  };
	};

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

	var defineEnumerableProperties = function (obj, descs) {
	  for (var key in descs) {
	    var desc = descs[key];
	    desc.configurable = desc.enumerable = true;
	    if ("value" in desc) desc.writable = true;
	    Object.defineProperty(obj, key, desc);
	  }

	  return obj;
	};

	var defaults = function (obj, defaults) {
	  var keys = Object.getOwnPropertyNames(defaults);

	  for (var i = 0; i < keys.length; i++) {
	    var key = keys[i];
	    var value = Object.getOwnPropertyDescriptor(defaults, key);

	    if (value && value.configurable && obj[key] === undefined) {
	      Object.defineProperty(obj, key, value);
	    }
	  }

	  return obj;
	};

	var defineProperty = function (obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	};

	var _extends = Object.assign || function (target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i];

	    for (var key in source) {
	      if (Object.prototype.hasOwnProperty.call(source, key)) {
	        target[key] = source[key];
	      }
	    }
	  }

	  return target;
	};

	var get = function get(object, property, receiver) {
	  if (object === null) object = Function.prototype;
	  var desc = Object.getOwnPropertyDescriptor(object, property);

	  if (desc === undefined) {
	    var parent = Object.getPrototypeOf(object);

	    if (parent === null) {
	      return undefined;
	    } else {
	      return get(parent, property, receiver);
	    }
	  } else if ("value" in desc) {
	    return desc.value;
	  } else {
	    var getter = desc.get;

	    if (getter === undefined) {
	      return undefined;
	    }

	    return getter.call(receiver);
	  }
	};

	var inherits = function (subClass, superClass) {
	  if (typeof superClass !== "function" && superClass !== null) {
	    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
	  }

	  subClass.prototype = Object.create(superClass && superClass.prototype, {
	    constructor: {
	      value: subClass,
	      enumerable: false,
	      writable: true,
	      configurable: true
	    }
	  });
	  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
	};

	var _instanceof = function (left, right) {
	  if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
	    return right[Symbol.hasInstance](left);
	  } else {
	    return left instanceof right;
	  }
	};

	var interopRequireDefault = function (obj) {
	  return obj && obj.__esModule ? obj : {
	    default: obj
	  };
	};

	var interopRequireWildcard = function (obj) {
	  if (obj && obj.__esModule) {
	    return obj;
	  } else {
	    var newObj = {};

	    if (obj != null) {
	      for (var key in obj) {
	        if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
	      }
	    }

	    newObj.default = obj;
	    return newObj;
	  }
	};

	var newArrowCheck = function (innerThis, boundThis) {
	  if (innerThis !== boundThis) {
	    throw new TypeError("Cannot instantiate an arrow function");
	  }
	};

	var objectDestructuringEmpty = function (obj) {
	  if (obj == null) throw new TypeError("Cannot destructure undefined");
	};

	var objectWithoutProperties = function (obj, keys) {
	  var target = {};

	  for (var i in obj) {
	    if (keys.indexOf(i) >= 0) continue;
	    if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
	    target[i] = obj[i];
	  }

	  return target;
	};

	var possibleConstructorReturn = function (self, call) {
	  if (!self) {
	    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	  }

	  return call && (typeof call === "object" || typeof call === "function") ? call : self;
	};

	var selfGlobal = typeof global === "undefined" ? self : global;

	var set = function set(object, property, value, receiver) {
	  var desc = Object.getOwnPropertyDescriptor(object, property);

	  if (desc === undefined) {
	    var parent = Object.getPrototypeOf(object);

	    if (parent !== null) {
	      set(parent, property, value, receiver);
	    }
	  } else if ("value" in desc && desc.writable) {
	    desc.value = value;
	  } else {
	    var setter = desc.set;

	    if (setter !== undefined) {
	      setter.call(receiver, value);
	    }
	  }

	  return value;
	};

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

	var slicedToArrayLoose = function (arr, i) {
	  if (Array.isArray(arr)) {
	    return arr;
	  } else if (Symbol.iterator in Object(arr)) {
	    var _arr = [];

	    for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
	      _arr.push(_step.value);

	      if (i && _arr.length === i) break;
	    }

	    return _arr;
	  } else {
	    throw new TypeError("Invalid attempt to destructure non-iterable instance");
	  }
	};

	var taggedTemplateLiteral = function (strings, raw) {
	  return Object.freeze(Object.defineProperties(strings, {
	    raw: {
	      value: Object.freeze(raw)
	    }
	  }));
	};

	var taggedTemplateLiteralLoose = function (strings, raw) {
	  strings.raw = raw;
	  return strings;
	};

	var temporalRef = function (val, name, undef) {
	  if (val === undef) {
	    throw new ReferenceError(name + " is not defined - temporal dead zone");
	  } else {
	    return val;
	  }
	};

	var temporalUndefined = {};

	var toArray = function (arr) {
	  return Array.isArray(arr) ? arr : Array.from(arr);
	};

	var toConsumableArray = function (arr) {
	  if (Array.isArray(arr)) {
	    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

	    return arr2;
	  } else {
	    return Array.from(arr);
	  }
	};

	var babelHelpers = /*#__PURE__*/Object.freeze({
		jsx: jsx,
		asyncIterator: asyncIterator,
		asyncGenerator: asyncGenerator,
		asyncGeneratorDelegate: asyncGeneratorDelegate,
		asyncToGenerator: asyncToGenerator,
		classCallCheck: classCallCheck,
		createClass: createClass,
		defineEnumerableProperties: defineEnumerableProperties,
		defaults: defaults,
		defineProperty: defineProperty,
		get: get,
		inherits: inherits,
		interopRequireDefault: interopRequireDefault,
		interopRequireWildcard: interopRequireWildcard,
		newArrowCheck: newArrowCheck,
		objectDestructuringEmpty: objectDestructuringEmpty,
		objectWithoutProperties: objectWithoutProperties,
		possibleConstructorReturn: possibleConstructorReturn,
		selfGlobal: selfGlobal,
		set: set,
		slicedToArray: slicedToArray,
		slicedToArrayLoose: slicedToArrayLoose,
		taggedTemplateLiteral: taggedTemplateLiteral,
		taggedTemplateLiteralLoose: taggedTemplateLiteralLoose,
		temporalRef: temporalRef,
		temporalUndefined: temporalUndefined,
		toArray: toArray,
		toConsumableArray: toConsumableArray,
		typeof: _typeof,
		extends: _extends,
		instanceof: _instanceof
	});

	var isObject_1 = createCommonjsModule(function (module) {
	  /**
	   * reference:
	   * http://www.css88.com/doc/underscore/docs/underscore.html
	   * 
	   */

	  var isObject = function isObject(obj) {
	    var type = typeof obj === 'undefined' ? 'undefined' : _typeof(obj);
	    return type === 'function' || type === 'object' && !!obj;
	  };

	  module.exports = isObject;
	});

	var isString_1 = createCommonjsModule(function (module) {
	  /**
	   * reference:
	   *  http://www.css88.com/doc/underscore/docs/underscore.html
	   */

	  var isString = function isString(str) {
	    return typeof str == 'string' && str.constructor == String;
	  };

	  module.exports = isString;
	});

	var stamp_1 = createCommonjsModule(function (module) {
	    /**
	     * assign kiwi.gl object to be an unique id in the global
	     * @author yellow 2017/5/26
	     */

	    var _prefix = '_kiwi.gl_',
	        _prefixId = _prefix + 'id_';
	    /**
	     * the seed of id
	     */
	    var i = 1;
	    /**
	     * get uniqueId and count++
	     * @param {String} prefix 
	     */
	    var getId = function getId(prefix) {
	        return (prefix || _prefixId) + '_' + i++;
	    };
	    /**
	     * 
	     * @param {Object} obj 
	     * @param {String} id 
	     */
	    var setId = function setId(obj, id) {
	        if (isObject_1(obj) && isString_1(id)) {
	            obj._kiwi_gl_id_ = id;
	            return id;
	        }
	        return null;
	    };
	    /**
	     * get the unique id
	     * @method stamp
	     * @param {Object} obj 
	     * @return {String} error if returned 'null'
	     */
	    var stamp = function stamp(obj) {
	        var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _prefix;

	        if (!obj) return null;
	        if (!obj._kiwi_gl_id_) {
	            var id = getId(prefix);
	            return setId(obj, id);
	        } else {
	            return obj._kiwi_gl_id_;
	        }
	    };

	    module.exports = stamp;
	});

	/**
	 * 设计思路为.net framework 的 IDispose接口
	 * 除此之外提供额外的属性：
	 * -id
	 * -handle
	 * -create handle
	 * -dispose
	 */

	/**
	 * @class
	 */

	var Dispose = function () {
	  /**
	   * 构建一个可被销毁的资源对象,提供prefix
	   */
	  function Dispose() {
	    var prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
	    classCallCheck(this, Dispose);

	    this._id = stamp_1(this, prefix);
	  }
	  /**
	   * 获取资源id
	   */


	  createClass(Dispose, [{
	    key: 'dispose',

	    /**
	     * 资源销毁方法，执行完一段后，统一调用
	     * must be implement be child class
	     * @abstract
	     */
	    value: function dispose() {
	      throw new Error('no implementation of function dispose');
	    }
	  }, {
	    key: 'id',
	    get: function get$$1() {
	      return this._id;
	    }
	  }]);
	  return Dispose;
	}();

	var Dispose_1 = Dispose;

	/**
	*   @author }{yellow 2017/4/18
	*   @returns {Object} 合并后对象
	*/

	/**
	 * @func
	 */
	var merge = function merge() {
	  var _babelHelpers;

	  for (var _len = arguments.length, sources = Array(_len), _key = 0; _key < _len; _key++) {
	    sources[_key] = arguments[_key];
	  }

	  return (_babelHelpers = babelHelpers).extends.apply(_babelHelpers, [{}].concat(sources));
	};

	var merge_1 = merge;

	/**
	 * reference:
	 * http://www.css88.com/doc/underscore1.4.2/docs/underscore.html
	 * 
	 */

	/**
	 * 操作记单元
	 * @author yellow date 2018/1/4
	 */

	/**
	 * @class
	 */

	var Record = function () {
	  /**
	   * 
	   * @param {*} opName 
	   * @param {*} rest 
	   */
	  function Record(opName) {
	    classCallCheck(this, Record);

	    /**
	     * webgl operation name
	     */
	    this._opName = opName;
	    /**
	     * args
	     */

	    for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
	      rest[_key - 1] = arguments[_key];
	    }

	    this._rest = this._exact(rest);
	    /**
	     * use prfix instead of value in args
	     * @type {Int}
	     */
	    this._ptMapIndex = {};
	    /**
	     * indicate this record needs to return value
	     * @type {String}
	     */
	    this._returnId = null;
	  }
	  /**
	   * operation name
	   */


	  createClass(Record, [{
	    key: '_exact',

	    /**
	     * }{debug arraybuffer.set much more faster than copy
	     * 
	     * @private
	     * @param {Array} rest 
	     */
	    value: function _exact(rest) {
	      for (var i = 0, len = rest.length; i < len; i++) {
	        var target = rest[i];
	        if (target instanceof Float32Array) {
	          rest[i] = new Float32Array(target);
	        }
	      }
	      return rest;
	    }
	    /**
	     * 修改某处指令的值
	     * @param {int} ptIndex 
	     * @param {String} ptName always represents shaderId/porgramId/
	     */

	  }, {
	    key: 'exactIndexByValue',
	    value: function exactIndexByValue(ptIndex, ptName) {
	      var arr = ptName.split('_');
	      //map to _ptIndex
	      this._ptMapIndex[ptIndex] = {
	        prefix: arr[0],
	        index: ptIndex,
	        id: ptName
	      };
	      //replace value
	      this._rest[ptIndex] = ptName;
	    }
	    /**
	     * 
	     * @param {Array} ptIndex 
	     */

	  }, {
	    key: 'exactIndexByObject',
	    value: function exactIndexByObject(ptIndexs) {
	      for (var i = 0, len = ptIndexs.length; i < len; i++) {
	        var ptIndex = ptIndexs[i],
	            ptName = stamp_1(this._rest[ptIndex]);
	        ptName && ptName.indexOf('_') !== -1 ? this.exactIndexByValue(ptIndex, ptName) : null;
	      }
	    }
	    /**
	     * 
	     * @param {Array} refs 
	     */

	  }, {
	    key: 'replace',
	    value: function replace(refs) {
	      for (var key in refs) {
	        this._rest[key] = refs[key];
	      }
	    }
	    /**
	     * 设置返回的id
	     */

	  }, {
	    key: 'setReturnId',
	    value: function setReturnId(v) {
	      var needToAnalysis = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

	      this._returnId = v;
	      needToAnalysis ? this._analysisReturnId(v) : null;
	    }
	    /**
	     * 
	     * @param {String} v 
	     */

	  }, {
	    key: '_analysisReturnId',
	    value: function _analysisReturnId(v) {
	      var val = isString_1(v) ? v : stamp_1(v);
	      var arr = val.split('_');
	      //map to _ptIndex
	      this._returanIdPrefix = arr[0];
	    }
	  }, {
	    key: 'opName',
	    get: function get$$1() {
	      return this._opName;
	    }
	    /**
	     * arguments of record
	     */

	  }, {
	    key: 'args',
	    get: function get$$1() {
	      return this._rest;
	    }
	    /**
	     * @returns {String}
	     */

	  }, {
	    key: 'returnId',
	    get: function get$$1() {
	      return this._returnId;
	    }
	    /**
	     * @returns {String}
	     */

	  }, {
	    key: 'returanIdPrefix',
	    get: function get$$1() {
	      return this._returanIdPrefix;
	    }
	    /**
	     * @type {Int}
	     */

	  }, {
	    key: 'ptMapIndex',
	    get: function get$$1() {
	      return this._ptMapIndex;
	    }
	  }]);
	  return Record;
	}();

	var Record_1 = Record;

	/**
	 * reference:
	 * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext
	 * 
	 * 具有返回对象的操作
	 * -code 操作代码
	 * -return 具有返回值的操作,特指需要返回代替索引的操作
	 * -replace 需要使用新对象代替引用的操作
	 * -ptIndex 替换参数的位置索引
	 */

	var Encrypt_WebGLContext = {
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/canvas
	   * @property
	   */
	  'canvas': { code: 0, return: 1, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/commit
	   */
	  'commit': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawingBufferWidth
	   * @property
	   */
	  'drawingBufferWidth': { code: 0, return: 1, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawingBufferHeight
	   * @property
	   */
	  'drawingBufferHeight': { code: 0, return: 1, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getContextAttributes
	   */
	  'getContextAttributes': { code: 0, return: 1, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/isContextLost
	   */
	  'isContextLost': { code: 0, return: 1, replace: 0 }
	};

	var Encrypt_Viewing_And_Clipping = {
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/scissor
	   */
	  'scissor': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/viewport
	   */
	  'viewport': { code: 0, return: 0, replace: 0 }
	};

	var Encrypt_State_Information = {
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/activeTexture
	   */
	  'activeTexture': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendColor
	   */
	  'blendColor': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquation
	   */
	  'blendEquation': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquationSeparate
	   */
	  'blendEquationSeparate': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFunc
	   */
	  'blendFunc': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFuncSeparate
	   */
	  'blendFuncSeparate': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearColor
	   */
	  'clearColor': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearDepth
	   */
	  'clearDepth': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearStencil
	   */
	  'clearStencil': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/colorMask
	   */
	  'colorMask': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/cullFace
	   */
	  'cullFace': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthFunc
	   */
	  'depthFunc': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthMask
	   */
	  'depthMask': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthRange
	   */
	  'depthRange': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/disable
	   */
	  'disable': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/enable
	   */
	  'enable': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/frontFace
	   */
	  'frontFace': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
	   * @description 
	   * warning return appropriate value by the parameter 'pname'
	   */
	  'getParameter': { code: 0, return: 1, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getError
	   */
	  'getError': { code: 0, return: 1, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/hint
	   */
	  'hint': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/isEnabled
	   */
	  'isEnabled': { code: 0, return: 1, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/lineWidth
	   */
	  'lineWidth': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/pixelStorei
	   */
	  'pixelStorei': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/polygonOffset
	   */
	  'polygonOffset': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/sampleCoverage
	   */
	  'sampleCoverage': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFunc
	   */
	  'stencilFunc': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFuncSeparate
	   */
	  'stencilFuncSeparate': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilMask
	   */
	  'stencilMask': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilMaskSeparate
	   */
	  'stencilMaskSeparate': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilOp
	   */
	  'stencilOp': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilOpSeparate
	   */
	  'stencilOpSeparate': { code: 0, return: 0, replace: 0 }
	};

	var Encrypt_Buffers = {
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindBuffer
	   */
	  'bindBuffer': { code: 0, return: 0, replace: 1, ptIndex: [1] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferData
	   */
	  'bufferData': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferSubData
	   */
	  'bufferSubData': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createBuffer
	   */
	  'createBuffer': { code: 0, return: 1, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/deleteBuffer
	   */
	  'deleteBuffer': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getBufferParameter
	   */
	  'getBufferParameter': { code: 0, return: 1, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/isBuffer
	   */
	  'isBuffer': { code: 0, return: 1, replace: 0 }
	};

	var Encrypt_Framebuffers = {
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer
	   */
	  'bindFramebuffer': { code: 0, return: 0, replace: 1, ptIndex: [1] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/checkFramebufferStatus
	   */
	  'checkFramebufferStatus': { code: 0, return: 1, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createFramebuffer
	   */
	  'createFramebuffer': { code: 0, return: 1, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/deleteFramebuffer
	   */
	  'deleteFramebuffer': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/framebufferRenderbuffer
	   */
	  'framebufferRenderbuffer': { code: 0, return: 0, replace: 1, ptIndex: [3] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/framebufferTexture2D
	   */
	  'framebufferTexture2D': { code: 0, return: 0, replace: 1, ptIndex: [3] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getFramebufferAttachmentParameter
	   */
	  'getFramebufferAttachmentParameter': { code: 0, return: 1, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/isFramebuffer
	   */
	  'isFramebuffer': { code: 0, return: 1, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/readPixels
	   */
	  'readPixels': { code: 0, return: 0, replace: 0 }
	};

	var Encrypt_Renderbuffers = {
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindRenderbuffer
	   */
	  'bindRenderbuffer': { code: 0, return: 0, replace: 1, ptIndex: [1] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createRenderbuffer
	   */
	  'createRenderbuffer': { code: 0, return: 1, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/deleteRenderbuffer
	   */
	  'deleteRenderbuffer': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getRenderbufferParameter
	   */
	  'getRenderbufferParameter': { code: 0, return: 1, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/isRenderbuffer
	   */
	  'isRenderbuffer': { code: 0, return: 1, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/renderbufferStorage
	   */
	  'renderbufferStorage': { code: 0, return: 0, replace: 0 }
	};

	var Encrypt_Textures = {
	  /**
	  * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindTexture
	  */
	  'bindTexture': { code: 0, return: 0, replace: 1, ptIndex: [1] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/compressedTexImage2D
	   */
	  'compressedTexImage2D': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/copyTexImage2D
	   */
	  'copyTexImage2D': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/copyTexSubImage2D
	   */
	  'copyTexSubImage2D': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createTexture
	   */
	  'createTexture': { code: 0, return: 1, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/deleteTexture
	   */
	  'deleteTexture': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/generateMipmap
	   */
	  'generateMipmap': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getTexParameter
	   */
	  'getTexParameter': { code: 0, return: 1, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/isTexture
	   */
	  'isTexture': { code: 0, return: 1, replace: 1, ptIndex: [0] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
	   */
	  'texImage2D': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texSubImage2D
	   */
	  'texSubImage2D': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
	   */
	  'texParameterf': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
	   */
	  'texParameteri': { code: 0, return: 0, replace: 0 }
	};

	var Encrypt_Programs_And_Shaders = {
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/attachShader
	   * @augments
	   */
	  'attachShader': { code: 0, return: 0, replace: 2, ptIndex: [0, 1] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindAttribLocation
	   * @augments
	   */
	  'bindAttribLocation': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/compileShader
	   */
	  'compileShader': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createProgram
	   */
	  'createProgram': { code: 0, return: 1, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createShader
	   */
	  'createShader': { code: 0, return: 1, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/deleteProgram
	   */
	  'deleteProgram': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/deleteShader
	   */
	  'deleteShader': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/detachShader
	   */
	  'detachShader': { code: 0, return: 0, replace: 2, ptIndex: [0, 1] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getAttachedShaders
	   */
	  'getAttachedShaders': { code: 0, return: 1, replace: 1, ptIndex: [0] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getProgramParameter
	   */
	  'getProgramParameter': { code: 0, return: 1, replace: 1, ptIndex: [0] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getProgramInfoLog
	   */
	  'getProgramInfoLog': { code: 0, return: 1, replace: 1, ptIndex: [0] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getShaderParameter
	   */
	  'getShaderParameter': { code: 0, return: 1, replace: 1, ptIndex: [0] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getShaderPrecisionFormat
	   */
	  'getShaderPrecisionFormat': { code: 0, return: 1, replace: [0] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getShaderInfoLog
	   */
	  'getShaderInfoLog': { code: 0, return: 1, replace: 1, ptIndex: [0] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getShaderSource
	   */
	  'getShaderSource': { code: 0, return: 1, replace: 1, ptIndex: [0] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/isProgram
	   */
	  'isProgram': { code: 0, return: 1, replace: 1, ptIndex: [0] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/isShader
	   */
	  'isShader': { code: 0, return: 1, replace: 1, ptIndex: [0] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/linkProgram
	   */
	  'linkProgram': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/shaderSource
	   */
	  'shaderSource': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/useProgram
	   */
	  'useProgram': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/validateProgram
	   */
	  'validateProgram': { code: 0, return: 0, replace: 1, ptIndex: [0] }
	};

	var Encrypt_Uniforms_And_Attributes = {
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/disableVertexAttribArray
	   */
	  'disableVertexAttribArray': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/enableVertexAttribArray
	   */
	  'enableVertexAttribArray': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getActiveAttrib
	   */
	  'getActiveAttrib': { code: 0, return: 1, replace: 1, ptIndex: [0] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getActiveUniform
	   */
	  'getActiveUniform': { code: 0, return: 1, replace: 1, ptIndex: [0] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getAttribLocation
	   * }{ debug return directly,no need to cache,
	   */
	  'getAttribLocation': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getUniformLocation
	   */
	  'getUniformLocation': { code: 0, return: 1, replace: 1, ptIndex: [0] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getVertexAttrib
	   */
	  'getVertexAttrib': { code: 0, return: 1, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getVertexAttribOffset
	   */
	  'getVertexAttribOffset': { code: 0, return: 1, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
	   */
	  'vertexAttribPointer': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniformMatrix
	   */
	  'uniformMatrix2fv': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  'uniformMatrix3fv': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  'uniformMatrix4fv': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniform
	   */
	  'uniform1f': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  'uniform1fv': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  'uniform1i': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  'uniform1iv': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  'uniform2f': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  'uniform2fv': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  'uniform2i': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  'uniform2iv': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  'uniform3f': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  'uniform3fv': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  'uniform3i': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  'uniform3iv': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  'uniform4f': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  'uniform4fv': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  'uniform4i': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  'uniform4iv': { code: 0, return: 0, replace: 1, ptIndex: [0] },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttrib
	   */
	  'vertexAttrib1f': { code: 0, return: 0, replace: 0 },
	  'vertexAttrib2f': { code: 0, return: 0, replace: 0 },
	  'vertexAttrib3f': { code: 0, return: 0, replace: 0 },
	  'vertexAttrib4f': { code: 0, return: 0, replace: 0 },
	  'vertexAttrib1fv': { code: 0, return: 0, replace: 0 },
	  'vertexAttrib2fv': { code: 0, return: 0, replace: 0 },
	  'vertexAttrib3fv': { code: 0, return: 0, replace: 0 },
	  'vertexAttrib4fv': { code: 0, return: 0, replace: 0 }
	};

	var Encrypt_Drawing_Buffers = {
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clear
	   */
	  'clear': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawArrays
	   */
	  'drawArrays': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements
	   */
	  'drawElements': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/finish
	   */
	  'finish': { code: 0, return: 0, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/flush
	   */
	  'flush': { code: 0, return: 0, replace: 0 }
	};

	var Encrypt_Working_With_Extensions = {
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getSupportedExtensions
	   */
	  'getSupportedExtensions': { code: 0, return: 1, replace: 0 },
	  /**
	   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getExtension
	   */
	  'getExtension': { code: 0, return: 1, replace: 0 }

	  /** 
	   * only in webgl2
	  */
	};
	var Encrypt = merge_1({}, Encrypt_Buffers, Encrypt_Drawing_Buffers, Encrypt_Framebuffers, Encrypt_Programs_And_Shaders, Encrypt_Renderbuffers, Encrypt_State_Information, Encrypt_Textures, Encrypt_Uniforms_And_Attributes, Encrypt_Viewing_And_Clipping, Encrypt_WebGLContext, Encrypt_Working_With_Extensions);

	/**
	 * @author yellow date 2018/1/4
	 */

	/** 
	 * 
	*/

	/**
	 * @class
	 */

	var Recorder = function () {
	  function Recorder(glContext) {
	    var storeInstance = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
	    classCallCheck(this, Recorder);

	    /**
	     * @type {GLContext}
	     */
	    this._glContext = glContext;
	    /**
	     * @type {Array}
	     */
	    this._records = [];
	    /**
	     * 注册到全局实例中
	     */
	    storeInstance ? Recorder.instances[glContext.id] = this : null;
	  }
	  /**
	   * 新增record
	   * @param {Record} record 
	   */


	  createClass(Recorder, [{
	    key: 'increase',
	    value: function increase(record) {
	      this._records.push(record);
	    }
	    /**
	     * convert to gl commands collection
	     */

	  }, {
	    key: 'toInstruction',
	    value: function toInstruction(programId) {
	      var reocrds = this._records,
	          len = reocrds.length,
	          record = new Record_1('useProgram', null);
	      record.exactIndexByValue(0, programId);
	      return [record].concat(reocrds.splice(0, len));
	    }
	    /** 
	     * convert to commands collection which not just webgl operation
	     * makes recorder as a general logger.(such as htmlElement logger)
	    */

	  }, {
	    key: 'toOperation',
	    value: function toOperation() {
	      var len = this._records.length,
	          list = this._records.splice(0, len);
	      return list;
	    }
	  }]);
	  return Recorder;
	}();

	Recorder.instances = {};

	var Recorder_1 = Recorder;

	/**
	 * reference https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Constants
	 * reference https://github.com/uber/luma.gl/blob/master/src/webgl-utils/constants.js
	 * reference https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Types
	 * Store GLEnum value the boost glContext setting
	 * webgl2 used within a WebGL2RenderingContext,add GLint64(GLuint64EXT) 
	 * @author yellow date 2017/6/15
	 */
	var GLConstants = {
	    /**
	     * 深度缓冲，常用与 gl.clear(gl.Enum)
	     * Passed to clear to clear the current depth buffer.
	     */
	    DEPTH_BUFFER_BIT: 0x00000100,
	    /**
	     * 模版缓冲，常用与 gl.clear(gl.Enum)
	     * Passed to clear to clear the current stencil buffer.
	     */
	    STENCIL_BUFFER_BIT: 0x00000400,
	    /**
	     * 当前可写的颜色缓冲，常用与 gl.clear(gl.Enum)
	     *  Passed to clear to clear the current color buffer.
	     */
	    COLOR_BUFFER_BIT: 0x00004000, //
	    // Rendering primitives
	    // Constants passed to drawElements() or drawArrays() to specify what kind of primitive to render.
	    POINTS: 0x0000, // Passed to drawElements or drawArrays to draw single points.
	    LINES: 0x0001, // Passed to drawElements or drawArrays to draw lines. Each vertex connects to the one after it.
	    LINE_LOOP: 0x0002, // Passed to drawElements or drawArrays to draw lines. Each set of two vertices is treated as a separate line segment.
	    LINE_STRIP: 0x0003, // Passed to drawElements or drawArrays to draw a connected group of line segments from the first vertex to the last.
	    TRIANGLES: 0x0004, // Passed to drawElements or drawArrays to draw triangles. Each set of three vertices creates a separate triangle.
	    TRIANGLE_STRIP: 0x0005, // Passed to drawElements or drawArrays to draw a connected group of triangles.
	    TRIANGLE_FAN: 0x0006, // Passed to drawElements or drawArrays to draw a connected group of triangles. Each vertex connects to the previous and the first vertex in the fan.
	    // Blending modes
	    // Constants passed to blendFunc() or blendFuncSeparate() to specify the blending mode (for both, RBG and alpha, or separately).
	    ZERO: 0, // Passed to blendFunc or blendFuncSeparate to turn off a component.
	    ONE: 1, // Passed to blendFunc or blendFuncSeparate to turn on a component.
	    SRC_COLOR: 0x0300, // Passed to blendFunc or blendFuncSeparate to multiply a component by the source elements color.
	    ONE_MINUS_SRC_COLOR: 0x0301, // Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the source elements color.
	    SRC_ALPHA: 0x0302, // Passed to blendFunc or blendFuncSeparate to multiply a component by the source's alpha.
	    /**
	     * 传递给BleandFunc或BlendFuncSeparate使用，用来指定混合计算颜色时，基于源颜色的aplha所占比。
	     * Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the source's alpha.
	     */
	    ONE_MINUS_SRC_ALPHA: 0x0303,
	    DST_ALPHA: 0x0304, // Passed to blendFunc or blendFuncSeparate to multiply a component by the destination's alpha.
	    ONE_MINUS_DST_ALPHA: 0x0305, // Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the destination's alpha.
	    DST_COLOR: 0x0306, // Passed to blendFunc or blendFuncSeparate to multiply a component by the destination's color.
	    ONE_MINUS_DST_COLOR: 0x0307, // Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the destination's color.
	    SRC_ALPHA_SATURATE: 0x0308, // Passed to blendFunc or blendFuncSeparate to multiply a component by the minimum of source's alpha or one minus the destination's alpha.
	    CONSTANT_COLOR: 0x8001, // Passed to blendFunc or blendFuncSeparate to specify a constant color blend function.
	    ONE_MINUS_CONSTANT_COLOR: 0x8002, // Passed to blendFunc or blendFuncSeparate to specify one minus a constant color blend function.
	    CONSTANT_ALPHA: 0x8003, // Passed to blendFunc or blendFuncSeparate to specify a constant alpha blend function.
	    ONE_MINUS_CONSTANT_ALPHA: 0x8004, // Passed to blendFunc or blendFuncSeparate to specify one minus a constant alpha blend function.
	    // Blending equations
	    // Constants passed to blendEquation() or blendEquationSeparate() to control
	    // how the blending is calculated (for both, RBG and alpha, or separately).
	    FUNC_ADD: 0x8006, // Passed to blendEquation or blendEquationSeparate to set an addition blend function.
	    FUNC_SUBSTRACT: 0x800A, // Passed to blendEquation or blendEquationSeparate to specify a subtraction blend function (source - destination).
	    FUNC_REVERSE_SUBTRACT: 0x800B, // Passed to blendEquation or blendEquationSeparate to specify a reverse subtraction blend function (destination - source).
	    // Getting GL parameter information
	    // Constants passed to getParameter() to specify what information to return.
	    BLEND_EQUATION: 0x8009, // Passed to getParameter to get the current RGB blend function.
	    BLEND_EQUATION_RGB: 0x8009, // Passed to getParameter to get the current RGB blend function. Same as BLEND_EQUATION
	    BLEND_EQUATION_ALPHA: 0x883D, // Passed to getParameter to get the current alpha blend function. Same as BLEND_EQUATION
	    BLEND_DST_RGB: 0x80C8, // Passed to getParameter to get the current destination RGB blend function.
	    BLEND_SRC_RGB: 0x80C9, // Passed to getParameter to get the current destination RGB blend function.
	    BLEND_DST_ALPHA: 0x80CA, // Passed to getParameter to get the current destination alpha blend function.
	    BLEND_SRC_ALPHA: 0x80CB, // Passed to getParameter to get the current source alpha blend function.
	    BLEND_COLOR: 0x8005, // Passed to getParameter to return a the current blend color.
	    ARRAY_BUFFER_BINDING: 0x8894, // Passed to getParameter to get the array buffer binding.
	    ELEMENT_ARRAY_BUFFER_BINDING: 0x8895, // Passed to getParameter to get the current element array buffer.
	    LINE_WIDTH: 0x0B21, // Passed to getParameter to get the current lineWidth (set by the lineWidth method).
	    ALIASED_POINT_SIZE_RANGE: 0x846D, // Passed to getParameter to get the current size of a point drawn with gl.POINTS
	    ALIASED_LINE_WIDTH_RANGE: 0x846E, // Passed to getParameter to get the range of available widths for a line. Returns a length-2 array with the lo value at 0, and hight at 1.
	    CULL_FACE_MODE: 0x0B45, // Passed to getParameter to get the current value of cullFace. Should return FRONT, BACK, or FRONT_AND_BACK
	    FRONT_FACE: 0x0B46, // Passed to getParameter to determine the current value of frontFace. Should return CW or CCW.
	    DEPTH_RANGE: 0x0B70, // Passed to getParameter to return a length-2 array of floats giving the current depth range.
	    DEPTH_WRITEMASK: 0x0B72, // Passed to getParameter to determine if the depth write mask is enabled.
	    DEPTH_CLEAR_VALUE: 0x0B73, // Passed to getParameter to determine the current depth clear value.
	    DEPTH_FUNC: 0x0B74, // Passed to getParameter to get the current depth function. Returns NEVER, ALWAYS, LESS, EQUAL, LEQUAL, GREATER, GEQUAL, or NOTEQUAL.
	    STENCIL_CLEAR_VALUE: 0x0B91, // Passed to getParameter to get the value the stencil will be cleared to.
	    STENCIL_FUNC: 0x0B92, // Passed to getParameter to get the current stencil function. Returns NEVER, ALWAYS, LESS, EQUAL, LEQUAL, GREATER, GEQUAL, or NOTEQUAL.
	    STENCIL_FAIL: 0x0B94, // Passed to getParameter to get the current stencil fail function. Should return KEEP, REPLACE, INCR, DECR, INVERT, INCR_WRAP, or DECR_WRAP.
	    STENCIL_PASS_DEPTH_FAIL: 0x0B95, // Passed to getParameter to get the current stencil fail function should the depth buffer test fail. Should return KEEP, REPLACE, INCR, DECR, INVERT, INCR_WRAP, or DECR_WRAP.
	    STENCIL_PASS_DEPTH_PASS: 0x0B96, // Passed to getParameter to get the current stencil fail function should the depth buffer test pass. Should return KEEP, REPLACE, INCR, DECR, INVERT, INCR_WRAP, or DECR_WRAP.
	    STENCIL_REF: 0x0B97, // Passed to getParameter to get the reference value used for stencil tests.
	    STENCIL_VALUE_MASK: 0x0B93,
	    STENCIL_WRITEMASK: 0x0B98,
	    STENCIL_BACK_FUNC: 0x8800,
	    STENCIL_BACK_FAIL: 0x8801,
	    STENCIL_BACK_PASS_DEPTH_FAIL: 0x8802,
	    STENCIL_BACK_PASS_DEPTH_PASS: 0x8803,
	    STENCIL_BACK_REF: 0x8CA3,
	    STENCIL_BACK_VALUE_MASK: 0x8CA4,
	    STENCIL_BACK_WRITEMASK: 0x8CA5,
	    VIEWPORT: 0x0BA2, // Returns an Int32Array with four elements for the current viewport dimensions.
	    SCISSOR_BOX: 0x0C10, // Returns an Int32Array with four elements for the current scissor box dimensions.
	    COLOR_CLEAR_VALUE: 0x0C22,
	    COLOR_WRITEMASK: 0x0C23,
	    UNPACK_ALIGNMENT: 0x0CF5,
	    PACK_ALIGNMENT: 0x0D05,
	    MAX_TEXTURE_SIZE: 0x0D33,
	    MAX_VIEWPORT_DIMS: 0x0D3A,
	    SUBPIXEL_BITS: 0x0D50,
	    RED_BITS: 0x0D52,
	    GREEN_BITS: 0x0D53,
	    BLUE_BITS: 0x0D54,
	    ALPHA_BITS: 0x0D55,
	    DEPTH_BITS: 0x0D56,
	    STENCIL_BITS: 0x0D57,
	    POLYGON_OFFSET_UNITS: 0x2A00,
	    POLYGON_OFFSET_FACTOR: 0x8038,
	    TEXTURE_BINDING_2D: 0x8069,
	    SAMPLE_BUFFERS: 0x80A8,
	    SAMPLES: 0x80A9,
	    SAMPLE_COVERAGE_VALUE: 0x80AA,
	    SAMPLE_COVERAGE_INVERT: 0x80AB,
	    COMPRESSED_TEXTURE_FORMATS: 0x86A3,
	    VENDOR: 0x1F00,
	    RENDERER: 0x1F01,
	    VERSION: 0x1F02,
	    IMPLEMENTATION_COLOR_READ_TYPE: 0x8B9A,
	    IMPLEMENTATION_COLOR_READ_FORMAT: 0x8B9B,
	    BROWSER_DEFAULT_WEBGL: 0x9244,

	    // Buffers
	    // Constants passed to bufferData(), bufferSubData(), bindBuffer(), or
	    // getBufferParameter().

	    STATIC_DRAW: 0x88E4, // Passed to bufferData as a hint about whether the contents of the buffer are likely to be used often and not change often.
	    STREAM_DRAW: 0x88E0, // Passed to bufferData as a hint about whether the contents of the buffer are likely to not be used often.
	    DYNAMIC_DRAW: 0x88E8, // Passed to bufferData as a hint about whether the contents of the buffer are likely to be used often and change often.
	    ARRAY_BUFFER: 0x8892, // Passed to bindBuffer or bufferData to specify the type of buffer being used.
	    ELEMENT_ARRAY_BUFFER: 0x8893, // Passed to bindBuffer or bufferData to specify the type of buffer being used.
	    BUFFER_SIZE: 0x8764, // Passed to getBufferParameter to get a buffer's size.
	    BUFFER_USAGE: 0x8765, // Passed to getBufferParameter to get the hint for the buffer passed in when it was created.

	    // Vertex attributes
	    // Constants passed to getVertexAttrib().

	    CURRENT_VERTEX_ATTRIB: 0x8626, // Passed to getVertexAttrib to read back the current vertex attribute.
	    VERTEX_ATTRIB_ARRAY_ENABLED: 0x8622,
	    VERTEX_ATTRIB_ARRAY_SIZE: 0x8623,
	    VERTEX_ATTRIB_ARRAY_STRIDE: 0x8624,
	    VERTEX_ATTRIB_ARRAY_TYPE: 0x8625,
	    VERTEX_ATTRIB_ARRAY_NORMALIZED: 0x886A,
	    VERTEX_ATTRIB_ARRAY_POINTER: 0x8645,
	    VERTEX_ATTRIB_ARRAY_BUFFER_BINDING: 0x889F,

	    // Culling
	    // Constants passed to cullFace().

	    CULL_FACE: 0x0B44, // Passed to enable/disable to turn on/off culling. Can also be used with getParameter to find the current culling method.
	    FRONT: 0x0404, // Passed to cullFace to specify that only front faces should be drawn.
	    BACK: 0x0405, // Passed to cullFace to specify that only back faces should be drawn.
	    FRONT_AND_BACK: 0x0408, // Passed to cullFace to specify that front and back faces should be drawn.

	    // Enabling and disabling
	    // Constants passed to enable() or disable().

	    BLEND: 0x0BE2, // Passed to enable/disable to turn on/off blending. Can also be used with getParameter to find the current blending method.
	    DEPTH_TEST: 0x0B71, // Passed to enable/disable to turn on/off the depth test. Can also be used with getParameter to query the depth test.
	    DITHER: 0x0BD0, // Passed to enable/disable to turn on/off dithering. Can also be used with getParameter to find the current dithering method.
	    POLYGON_OFFSET_FILL: 0x8037, // Passed to enable/disable to turn on/off the polygon offset. Useful for rendering hidden-line images, decals, and or solids with highlighted edges. Can also be used with getParameter to query the scissor test.
	    SAMPLE_ALPHA_TO_COVERAGE: 0x809E, // Passed to enable/disable to turn on/off the alpha to coverage. Used in multi-sampling alpha channels.
	    SAMPLE_COVERAGE: 0x80A0, // Passed to enable/disable to turn on/off the sample coverage. Used in multi-sampling.
	    SCISSOR_TEST: 0x0C11, // Passed to enable/disable to turn on/off the scissor test. Can also be used with getParameter to query the scissor test.
	    /**
	     *  模版缓冲区测试，发生在透明度测试之后，和深度测试之前
	     *  Passed to enable/disable to turn on/off the stencil test. Can also be used with getParameter to query the stencil test.
	     */
	    STENCIL_TEST: 0x0B90,

	    // Errors
	    // Constants returned from getError().

	    NO_ERROR: 0, // Returned from getError.
	    INVALID_ENUM: 0x0500, //  Returned from getError.
	    INVALID_VALUE: 0x0501, //  Returned from getError.
	    INVALID_OPERATION: 0x0502, //  Returned from getError.
	    OUT_OF_MEMORY: 0x0505, //  Returned from getError.
	    CONTEXT_LOST_WEBGL: 0x9242, //  Returned from getError.

	    // Front face directions
	    // Constants passed to frontFace().

	    CW: 0x0900, //  Passed to frontFace to specify the front face of a polygon is drawn in the clockwise direction
	    CCW: 0x0901, // Passed to frontFace to specify the front face of a polygon is drawn in the counter clockwise direction

	    // Hints
	    // Constants passed to hint()

	    DONT_CARE: 0x1100, // There is no preference for this behavior.
	    FASTEST: 0x1101, // The most efficient behavior should be used.
	    NICEST: 0x1102, // The most correct or the highest quality option should be used.
	    GENERATE_MIPMAP_HINT: 0x8192, // Hint for the quality of filtering when generating mipmap images with generateMipmap().

	    // Data types

	    BYTE: 0x1400,
	    /**
	     * 无符号byte,即每通道8bit 适合 gl.RGBA
	     */
	    UNSIGNED_BYTE: 0x1401,
	    SHORT: 0x1402,
	    UNSIGNED_SHORT: 0x1403,
	    INT: 0x1404,
	    UNSIGNED_INT: 0x1405,
	    FLOAT: 0x1406,

	    // Pixel formats

	    DEPTH_COMPONENT: 0x1902,
	    ALPHA: 0x1906,
	    /**
	     * RGB颜色表示Texture，Image颜色读取规则
	     */
	    RGB: 0x1907,
	    RGBA: 0x1908,
	    LUMINANCE: 0x1909,
	    LUMINANCE_ALPHA: 0x190A,

	    // Pixel types

	    // UNSIGNED_BYTE: 0x1401,
	    UNSIGNED_SHORT_4_4_4_4: 0x8033,
	    UNSIGNED_SHORT_5_5_5_1: 0x8034,
	    UNSIGNED_SHORT_5_6_5: 0x8363,

	    // Shaders
	    // Constants passed to createShader() or getShaderParameter()

	    FRAGMENT_SHADER: 0x8B30, // Passed to createShader to define a fragment shader.
	    VERTEX_SHADER: 0x8B31, // Passed to createShader to define a vertex shader
	    /**
	     * shader 编译状态，
	     * Passed to getShaderParamter to get the status of the compilation. Returns false if the shader was not compiled. You can then query getShaderInfoLog to find the exact error
	     */
	    COMPILE_STATUS: 0x8B81,
	    DELETE_STATUS: 0x8B80, // Passed to getShaderParamter to determine if a shader was deleted via deleteShader. Returns true if it was, false otherwise.
	    LINK_STATUS: 0x8B82, // Passed to getProgramParameter after calling linkProgram to determine if a program was linked correctly. Returns false if there were errors. Use getProgramInfoLog to find the exact error.
	    VALIDATE_STATUS: 0x8B83, // Passed to getProgramParameter after calling validateProgram to determine if it is valid. Returns false if errors were found.
	    ATTACHED_SHADERS: 0x8B85, // Passed to getProgramParameter after calling attachShader to determine if the shader was attached correctly. Returns false if errors occurred.
	    /**
	     * 获取program里可用的attributes，【map到program里方便upload属性】
	     */
	    ACTIVE_ATTRIBUTES: 0x8B89, // Passed to getProgramParameter to get the number of attributes active in a program.
	    /**
	     * 获取program里可用的uniforms，【map到program里方便upload属性】
	     */
	    ACTIVE_UNIFORMS: 0x8B86, // Passed to getProgramParamter to get the number of uniforms active in a program.
	    MAX_VERTEX_ATTRIBS: 0x8869,
	    MAX_VERTEX_UNIFORM_VECTORS: 0x8DFB,
	    MAX_VARYING_VECTORS: 0x8DFC,
	    MAX_COMBINED_TEXTURE_IMAGE_UNITS: 0x8B4D,
	    MAX_VERTEX_TEXTURE_IMAGE_UNITS: 0x8B4C,
	    MAX_TEXTURE_IMAGE_UNITS: 0x8872, // Implementation dependent number of maximum texture units. At least 8.
	    MAX_FRAGMENT_UNIFORM_VECTORS: 0x8DFD,
	    SHADER_TYPE: 0x8B4F,
	    SHADING_LANGUAGE_VERSION: 0x8B8C,
	    CURRENT_PROGRAM: 0x8B8D,

	    // Depth or stencil tests
	    // Constants passed to depthFunc() or stencilFunc().

	    NEVER: 0x0200, //  Passed to depthFunction or stencilFunction to specify depth or stencil tests will never pass. i.e. Nothing will be drawn.
	    ALWAYS: 0x0207, //  Passed to depthFunction or stencilFunction to specify depth or stencil tests will always pass. i.e. Pixels will be drawn in the order they are drawn.
	    LESS: 0x0201, //  Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than the stored value.
	    EQUAL: 0x0202, //  Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is equals to the stored value.
	    /**
	     * 测试对比条件，当参考值小于等于模板值时，通过测试，常用于深度测试
	     * Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than or equal to the stored value.
	     */
	    LEQUAL: 0x0203,
	    /**
	     * 测试对比条件，当参考值大于模版值时，通过测试
	     * Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than the stored value.
	     */
	    GREATER: 0x0204,
	    GEQUAL: 0x0206, //  Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than or equal to the stored value.
	    NOTEQUAL: 0x0205, //  Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is not equal to the stored value.

	    // Stencil actions
	    // Constants passed to stencilOp().

	    KEEP: 0x1E00,
	    REPLACE: 0x1E01,
	    INCR: 0x1E02,
	    DECR: 0x1E03,
	    INVERT: 0x150A,
	    INCR_WRAP: 0x8507,
	    DECR_WRAP: 0x8508,

	    // Textures
	    // Constants passed to texParameteri(),
	    // texParameterf(), bindTexture(), texImage2D(), and others.

	    NEAREST: 0x2600,
	    LINEAR: 0x2601,
	    NEAREST_MIPMAP_NEAREST: 0x2700,
	    LINEAR_MIPMAP_NEAREST: 0x2701,
	    NEAREST_MIPMAP_LINEAR: 0x2702,
	    LINEAR_MIPMAP_LINEAR: 0x2703,
	    TEXTURE_MAG_FILTER: 0x2800,
	    TEXTURE_MIN_FILTER: 0x2801,
	    TEXTURE_WRAP_S: 0x2802,
	    TEXTURE_WRAP_T: 0x2803,
	    TEXTURE_2D: 0x0DE1,
	    TEXTURE: 0x1702,
	    TEXTURE_CUBE_MAP: 0x8513,
	    TEXTURE_BINDING_CUBE_MAP: 0x8514,
	    TEXTURE_CUBE_MAP_POSITIVE_X: 0x8515,
	    TEXTURE_CUBE_MAP_NEGATIVE_X: 0x8516,
	    TEXTURE_CUBE_MAP_POSITIVE_Y: 0x8517,
	    TEXTURE_CUBE_MAP_NEGATIVE_Y: 0x8518,
	    TEXTURE_CUBE_MAP_POSITIVE_Z: 0x8519,
	    TEXTURE_CUBE_MAP_NEGATIVE_Z: 0x851A,
	    MAX_CUBE_MAP_TEXTURE_SIZE: 0x851C,
	    // TEXTURE0 - 31 0x84C0 - 0x84DF A texture unit.
	    TEXTURE0: 0x84C0, // A texture unit.
	    ACTIVE_TEXTURE: 0x84E0, // The current active texture unit.
	    REPEAT: 0x2901,
	    CLAMP_TO_EDGE: 0x812F,
	    MIRRORED_REPEAT: 0x8370,

	    // Emulation
	    TEXTURE_WIDTH: 0x1000,
	    TEXTURE_HEIGHT: 0x1001,

	    // Uniform types

	    FLOAT_VEC2: 0x8B50,
	    FLOAT_VEC3: 0x8B51,
	    FLOAT_VEC4: 0x8B52,
	    INT_VEC2: 0x8B53,
	    INT_VEC3: 0x8B54,
	    INT_VEC4: 0x8B55,
	    BOOL: 0x8B56,
	    BOOL_VEC2: 0x8B57,
	    BOOL_VEC3: 0x8B58,
	    BOOL_VEC4: 0x8B59,
	    FLOAT_MAT2: 0x8B5A,
	    FLOAT_MAT3: 0x8B5B,
	    FLOAT_MAT4: 0x8B5C,
	    SAMPLER_2D: 0x8B5E,
	    SAMPLER_CUBE: 0x8B60,

	    // Shader precision-specified types

	    LOW_FLOAT: 0x8DF0,
	    MEDIUM_FLOAT: 0x8DF1,
	    HIGH_FLOAT: 0x8DF2,
	    LOW_INT: 0x8DF3,
	    MEDIUM_INT: 0x8DF4,
	    HIGH_INT: 0x8DF5,

	    // Framebuffers and renderbuffers
	    /**
	     * 绑定framebuffer
	     */
	    FRAMEBUFFER: 0x8D40,
	    /**
	     * 绑定 renderbuffer 
	     */
	    RENDERBUFFER: 0x8D41,
	    RGBA4: 0x8056,
	    RGB5_A1: 0x8057,
	    RGB565: 0x8D62,
	    DEPTH_COMPONENT16: 0x81A5,
	    STENCIL_INDEX: 0x1901,
	    STENCIL_INDEX8: 0x8D48,
	    /**
	     * 一般用于 bufferStorage，支持深度和缓冲区数据存储
	     */
	    DEPTH_STENCIL: 0x84F9,
	    RENDERBUFFER_WIDTH: 0x8D42,
	    RENDERBUFFER_HEIGHT: 0x8D43,
	    RENDERBUFFER_INTERNAL_FORMAT: 0x8D44,
	    RENDERBUFFER_RED_SIZE: 0x8D50,
	    RENDERBUFFER_GREEN_SIZE: 0x8D51,
	    RENDERBUFFER_BLUE_SIZE: 0x8D52,
	    RENDERBUFFER_ALPHA_SIZE: 0x8D53,
	    RENDERBUFFER_DEPTH_SIZE: 0x8D54,
	    RENDERBUFFER_STENCIL_SIZE: 0x8D55,
	    FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE: 0x8CD0,
	    FRAMEBUFFER_ATTACHMENT_OBJECT_NAME: 0x8CD1,
	    FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL: 0x8CD2,
	    FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE: 0x8CD3,
	    COLOR_ATTACHMENT0: 0x8CE0,
	    DEPTH_ATTACHMENT: 0x8D00,
	    STENCIL_ATTACHMENT: 0x8D20,
	    /**
	     * 深度和缓冲区附着，webgl2支持
	     */
	    DEPTH_STENCIL_ATTACHMENT: 0x821A,
	    NONE: 0,
	    FRAMEBUFFER_COMPLETE: 0x8CD5,
	    FRAMEBUFFER_INCOMPLETE_ATTACHMENT: 0x8CD6,
	    FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: 0x8CD7,
	    FRAMEBUFFER_INCOMPLETE_DIMENSIONS: 0x8CD9,
	    FRAMEBUFFER_UNSUPPORTED: 0x8CDD,
	    FRAMEBUFFER_BINDING: 0x8CA6,
	    RENDERBUFFER_BINDING: 0x8CA7,
	    MAX_RENDERBUFFER_SIZE: 0x84E8,
	    INVALID_FRAMEBUFFER_OPERATION: 0x0506,

	    // READ_FRAMEBUFFER: 0x8CA8,
	    // DRAW_FRAMEBUFFER: 0x8CA9,

	    // Pixel storage modes
	    // Constants passed to pixelStorei().

	    UNPACK_FLIP_Y_WEBGL: 0x9240,
	    UNPACK_PREMULTIPLY_ALPHA_WEBGL: 0x9241,
	    UNPACK_COLORSPACE_CONVERSION_WEBGL: 0x9243,

	    // /////////////////////////////////////////////////////
	    // Additional constants defined WebGL 2
	    // These constants are defined on the WebGL2RenderingContext interface.
	    // All WebGL 1 constants are also available in a WebGL 2 context.
	    // /////////////////////////////////////////////////////

	    // Getting GL parameter information
	    // Constants passed to getParameter()
	    // to specify what information to return.

	    READ_BUFFER: 0x0C02,
	    UNPACK_ROW_LENGTH: 0x0CF2,
	    UNPACK_SKIP_ROWS: 0x0CF3,
	    UNPACK_SKIP_PIXELS: 0x0CF4,
	    PACK_ROW_LENGTH: 0x0D02,
	    PACK_SKIP_ROWS: 0x0D03,
	    PACK_SKIP_PIXELS: 0x0D04,
	    TEXTURE_BINDING_3D: 0x806A,
	    UNPACK_SKIP_IMAGES: 0x806D,
	    UNPACK_IMAGE_HEIGHT: 0x806E,
	    MAX_3D_TEXTURE_SIZE: 0x8073,
	    MAX_ELEMENTS_VERTICES: 0x80E8,
	    MAX_ELEMENTS_INDICES: 0x80E9,
	    MAX_TEXTURE_LOD_BIAS: 0x84FD,
	    MAX_FRAGMENT_UNIFORM_COMPONENTS: 0x8B49,
	    MAX_VERTEX_UNIFORM_COMPONENTS: 0x8B4A,
	    MAX_ARRAY_TEXTURE_LAYERS: 0x88FF,
	    MIN_PROGRAM_TEXEL_OFFSET: 0x8904,
	    MAX_PROGRAM_TEXEL_OFFSET: 0x8905,
	    MAX_VARYING_COMPONENTS: 0x8B4B,
	    FRAGMENT_SHADER_DERIVATIVE_HINT: 0x8B8B,
	    RASTERIZER_DISCARD: 0x8C89,
	    VERTEX_ARRAY_BINDING: 0x85B5,
	    MAX_VERTEX_OUTPUT_COMPONENTS: 0x9122,
	    MAX_FRAGMENT_INPUT_COMPONENTS: 0x9125,
	    MAX_SERVER_WAIT_TIMEOUT: 0x9111,
	    MAX_ELEMENT_INDEX: 0x8D6B,

	    // Textures
	    // Constants passed to texParameteri(),
	    // texParameterf(), bindTexture(), texImage2D(), and others.

	    RED: 0x1903,
	    RGB8: 0x8051,
	    RGBA8: 0x8058,
	    RGB10_A2: 0x8059,
	    TEXTURE_3D: 0x806F,
	    TEXTURE_WRAP_R: 0x8072,
	    TEXTURE_MIN_LOD: 0x813A,
	    TEXTURE_MAX_LOD: 0x813B,
	    TEXTURE_BASE_LEVEL: 0x813C,
	    TEXTURE_MAX_LEVEL: 0x813D,
	    TEXTURE_COMPARE_MODE: 0x884C,
	    TEXTURE_COMPARE_FUNC: 0x884D,
	    SRGB: 0x8C40,
	    SRGB8: 0x8C41,
	    SRGB8_ALPHA8: 0x8C43,
	    COMPARE_REF_TO_TEXTURE: 0x884E,
	    RGBA32F: 0x8814,
	    RGB32F: 0x8815,
	    RGBA16F: 0x881A,
	    RGB16F: 0x881B,
	    TEXTURE_2D_ARRAY: 0x8C1A,
	    TEXTURE_BINDING_2D_ARRAY: 0x8C1D,
	    R11F_G11F_B10F: 0x8C3A,
	    RGB9_E5: 0x8C3D,
	    RGBA32UI: 0x8D70,
	    RGB32UI: 0x8D71,
	    RGBA16UI: 0x8D76,
	    RGB16UI: 0x8D77,
	    RGBA8UI: 0x8D7C,
	    RGB8UI: 0x8D7D,
	    RGBA32I: 0x8D82,
	    RGB32I: 0x8D83,
	    RGBA16I: 0x8D88,
	    RGB16I: 0x8D89,
	    RGBA8I: 0x8D8E,
	    RGB8I: 0x8D8F,
	    RED_INTEGER: 0x8D94,
	    RGB_INTEGER: 0x8D98,
	    RGBA_INTEGER: 0x8D99,
	    R8: 0x8229,
	    RG8: 0x822B,
	    R16F: 0x822D,
	    R32F: 0x822E,
	    RG16F: 0x822F,
	    RG32F: 0x8230,
	    R8I: 0x8231,
	    R8UI: 0x8232,
	    R16I: 0x8233,
	    R16UI: 0x8234,
	    R32I: 0x8235,
	    R32UI: 0x8236,
	    RG8I: 0x8237,
	    RG8UI: 0x8238,
	    RG16I: 0x8239,
	    RG16UI: 0x823A,
	    RG32I: 0x823B,
	    RG32UI: 0x823C,
	    R8_SNORM: 0x8F94,
	    RG8_SNORM: 0x8F95,
	    RGB8_SNORM: 0x8F96,
	    RGBA8_SNORM: 0x8F97,
	    RGB10_A2UI: 0x906F,

	    /* covered by extension
	    COMPRESSED_R11_EAC : 0x9270,
	    COMPRESSED_SIGNED_R11_EAC: 0x9271,
	    COMPRESSED_RG11_EAC: 0x9272,
	    COMPRESSED_SIGNED_RG11_EAC : 0x9273,
	    COMPRESSED_RGB8_ETC2 : 0x9274,
	    COMPRESSED_SRGB8_ETC2: 0x9275,
	    COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2 : 0x9276,
	    COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC : 0x9277,
	    COMPRESSED_RGBA8_ETC2_EAC: 0x9278,
	    COMPRESSED_SRGB8_ALPHA8_ETC2_EAC : 0x9279,
	    */
	    TEXTURE_IMMUTABLE_FORMAT: 0x912F,
	    TEXTURE_IMMUTABLE_LEVELS: 0x82DF,

	    // Pixel types

	    UNSIGNED_INT_2_10_10_10_REV: 0x8368,
	    UNSIGNED_INT_10F_11F_11F_REV: 0x8C3B,
	    UNSIGNED_INT_5_9_9_9_REV: 0x8C3E,
	    FLOAT_32_UNSIGNED_INT_24_8_REV: 0x8DAD,
	    UNSIGNED_INT_24_8: 0x84FA,
	    HALF_FLOAT: 0x140B,
	    RG: 0x8227,
	    RG_INTEGER: 0x8228,
	    INT_2_10_10_10_REV: 0x8D9F,

	    // Queries

	    CURRENT_QUERY: 0x8865,
	    QUERY_RESULT: 0x8866,
	    QUERY_RESULT_AVAILABLE: 0x8867,
	    ANY_SAMPLES_PASSED: 0x8C2F,
	    ANY_SAMPLES_PASSED_CONSERVATIVE: 0x8D6A,

	    // Draw buffers

	    MAX_DRAW_BUFFERS: 0x8824,
	    DRAW_BUFFER0: 0x8825,
	    DRAW_BUFFER1: 0x8826,
	    DRAW_BUFFER2: 0x8827,
	    DRAW_BUFFER3: 0x8828,
	    DRAW_BUFFER4: 0x8829,
	    DRAW_BUFFER5: 0x882A,
	    DRAW_BUFFER6: 0x882B,
	    DRAW_BUFFER7: 0x882C,
	    DRAW_BUFFER8: 0x882D,
	    DRAW_BUFFER9: 0x882E,
	    DRAW_BUFFER10: 0x882F,
	    DRAW_BUFFER11: 0x8830,
	    DRAW_BUFFER12: 0x8831,
	    DRAW_BUFFER13: 0x8832,
	    DRAW_BUFFER14: 0x8833,
	    DRAW_BUFFER15: 0x8834,
	    MAX_COLOR_ATTACHMENTS: 0x8CDF,
	    COLOR_ATTACHMENT1: 0x8CE1,
	    COLOR_ATTACHMENT2: 0x8CE2,
	    COLOR_ATTACHMENT3: 0x8CE3,
	    COLOR_ATTACHMENT4: 0x8CE4,
	    COLOR_ATTACHMENT5: 0x8CE5,
	    COLOR_ATTACHMENT6: 0x8CE6,
	    COLOR_ATTACHMENT7: 0x8CE7,
	    COLOR_ATTACHMENT8: 0x8CE8,
	    COLOR_ATTACHMENT9: 0x8CE9,
	    COLOR_ATTACHMENT10: 0x8CEA,
	    COLOR_ATTACHMENT11: 0x8CEB,
	    COLOR_ATTACHMENT12: 0x8CEC,
	    COLOR_ATTACHMENT13: 0x8CED,
	    COLOR_ATTACHMENT14: 0x8CEE,
	    COLOR_ATTACHMENT15: 0x8CEF,

	    // Samplers

	    SAMPLER_3D: 0x8B5F,
	    SAMPLER_2D_SHADOW: 0x8B62,
	    SAMPLER_2D_ARRAY: 0x8DC1,
	    SAMPLER_2D_ARRAY_SHADOW: 0x8DC4,
	    SAMPLER_CUBE_SHADOW: 0x8DC5,
	    INT_SAMPLER_2D: 0x8DCA,
	    INT_SAMPLER_3D: 0x8DCB,
	    INT_SAMPLER_CUBE: 0x8DCC,
	    INT_SAMPLER_2D_ARRAY: 0x8DCF,
	    UNSIGNED_INT_SAMPLER_2D: 0x8DD2,
	    UNSIGNED_INT_SAMPLER_3D: 0x8DD3,
	    UNSIGNED_INT_SAMPLER_CUBE: 0x8DD4,
	    UNSIGNED_INT_SAMPLER_2D_ARRAY: 0x8DD7,
	    MAX_SAMPLES: 0x8D57,
	    SAMPLER_BINDING: 0x8919,

	    // Buffers

	    PIXEL_PACK_BUFFER: 0x88EB,
	    PIXEL_UNPACK_BUFFER: 0x88EC,
	    PIXEL_PACK_BUFFER_BINDING: 0x88ED,
	    PIXEL_UNPACK_BUFFER_BINDING: 0x88EF,
	    COPY_READ_BUFFER: 0x8F36,
	    COPY_WRITE_BUFFER: 0x8F37,
	    COPY_READ_BUFFER_BINDING: 0x8F36,
	    COPY_WRITE_BUFFER_BINDING: 0x8F37,

	    // Data types

	    FLOAT_MAT2x3: 0x8B65,
	    FLOAT_MAT2x4: 0x8B66,
	    FLOAT_MAT3x2: 0x8B67,
	    FLOAT_MAT3x4: 0x8B68,
	    FLOAT_MAT4x2: 0x8B69,
	    FLOAT_MAT4x3: 0x8B6A,
	    UNSIGNED_INT_VEC2: 0x8DC6,
	    UNSIGNED_INT_VEC3: 0x8DC7,
	    UNSIGNED_INT_VEC4: 0x8DC8,
	    UNSIGNED_NORMALIZED: 0x8C17,
	    SIGNED_NORMALIZED: 0x8F9C,

	    // Vertex attributes

	    VERTEX_ATTRIB_ARRAY_INTEGER: 0x88FD,
	    VERTEX_ATTRIB_ARRAY_DIVISOR: 0x88FE,

	    // Transform feedback

	    TRANSFORM_FEEDBACK_BUFFER_MODE: 0x8C7F,
	    MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS: 0x8C80,
	    TRANSFORM_FEEDBACK_VARYINGS: 0x8C83,
	    TRANSFORM_FEEDBACK_BUFFER_START: 0x8C84,
	    TRANSFORM_FEEDBACK_BUFFER_SIZE: 0x8C85,
	    TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN: 0x8C88,
	    MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS: 0x8C8A,
	    MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS: 0x8C8B,
	    INTERLEAVED_ATTRIBS: 0x8C8C,
	    SEPARATE_ATTRIBS: 0x8C8D,
	    TRANSFORM_FEEDBACK_BUFFER: 0x8C8E,
	    TRANSFORM_FEEDBACK_BUFFER_BINDING: 0x8C8F,
	    TRANSFORM_FEEDBACK: 0x8E22,
	    TRANSFORM_FEEDBACK_PAUSED: 0x8E23,
	    TRANSFORM_FEEDBACK_ACTIVE: 0x8E24,
	    TRANSFORM_FEEDBACK_BINDING: 0x8E25,

	    // Framebuffers and renderbuffers

	    FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING: 0x8210,
	    FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE: 0x8211,
	    FRAMEBUFFER_ATTACHMENT_RED_SIZE: 0x8212,
	    FRAMEBUFFER_ATTACHMENT_GREEN_SIZE: 0x8213,
	    FRAMEBUFFER_ATTACHMENT_BLUE_SIZE: 0x8214,
	    FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE: 0x8215,
	    FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE: 0x8216,
	    FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE: 0x8217,
	    FRAMEBUFFER_DEFAULT: 0x8218,
	    // DEPTH_STENCIL_ATTACHMENT : 0x821A,
	    // DEPTH_STENCIL: 0x84F9,
	    DEPTH24_STENCIL8: 0x88F0,
	    DRAW_FRAMEBUFFER_BINDING: 0x8CA6,
	    // READ_FRAMEBUFFER : 0x8CA8,
	    // DRAW_FRAMEBUFFER : 0x8CA9,
	    READ_FRAMEBUFFER_BINDING: 0x8CAA,
	    RENDERBUFFER_SAMPLES: 0x8CAB,
	    FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER: 0x8CD4,
	    FRAMEBUFFER_INCOMPLETE_MULTISAMPLE: 0x8D56,

	    // Uniforms

	    UNIFORM_BUFFER: 0x8A11,
	    UNIFORM_BUFFER_BINDING: 0x8A28,
	    UNIFORM_BUFFER_START: 0x8A29,
	    UNIFORM_BUFFER_SIZE: 0x8A2A,
	    MAX_VERTEX_UNIFORM_BLOCKS: 0x8A2B,
	    MAX_FRAGMENT_UNIFORM_BLOCKS: 0x8A2D,
	    MAX_COMBINED_UNIFORM_BLOCKS: 0x8A2E,
	    MAX_UNIFORM_BUFFER_BINDINGS: 0x8A2F,
	    MAX_UNIFORM_BLOCK_SIZE: 0x8A30,
	    MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS: 0x8A31,
	    MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS: 0x8A33,
	    UNIFORM_BUFFER_OFFSET_ALIGNMENT: 0x8A34,
	    ACTIVE_UNIFORM_BLOCKS: 0x8A36,
	    UNIFORM_TYPE: 0x8A37,
	    UNIFORM_SIZE: 0x8A38,
	    UNIFORM_BLOCK_INDEX: 0x8A3A,
	    UNIFORM_OFFSET: 0x8A3B,
	    UNIFORM_ARRAY_STRIDE: 0x8A3C,
	    UNIFORM_MATRIX_STRIDE: 0x8A3D,
	    UNIFORM_IS_ROW_MAJOR: 0x8A3E,
	    UNIFORM_BLOCK_BINDING: 0x8A3F,
	    UNIFORM_BLOCK_DATA_SIZE: 0x8A40,
	    UNIFORM_BLOCK_ACTIVE_UNIFORMS: 0x8A42,
	    UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES: 0x8A43,
	    UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER: 0x8A44,
	    UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER: 0x8A46,

	    // Sync objects

	    OBJECT_TYPE: 0x9112,
	    SYNC_CONDITION: 0x9113,
	    SYNC_STATUS: 0x9114,
	    SYNC_FLAGS: 0x9115,
	    SYNC_FENCE: 0x9116,
	    SYNC_GPU_COMMANDS_COMPLETE: 0x9117,
	    UNSIGNALED: 0x9118,
	    SIGNALED: 0x9119,
	    ALREADY_SIGNALED: 0x911A,
	    TIMEOUT_EXPIRED: 0x911B,
	    CONDITION_SATISFIED: 0x911C,
	    WAIT_FAILED: 0x911D,
	    SYNC_FLUSH_COMMANDS_BIT: 0x00000001,

	    // Miscellaneous constants

	    COLOR: 0x1800,
	    DEPTH: 0x1801,
	    STENCIL: 0x1802,
	    MIN: 0x8007,
	    MAX: 0x8008,
	    DEPTH_COMPONENT24: 0x81A6,
	    STREAM_READ: 0x88E1,
	    STREAM_COPY: 0x88E2,
	    STATIC_READ: 0x88E5,
	    STATIC_COPY: 0x88E6,
	    DYNAMIC_READ: 0x88E9,
	    DYNAMIC_COPY: 0x88EA,
	    DEPTH_COMPONENT32F: 0x8CAC,
	    DEPTH32F_STENCIL8: 0x8CAD,
	    INVALID_INDEX: 0xFFFFFFFF,
	    TIMEOUT_IGNORED: -1,
	    MAX_CLIENT_WAIT_TIMEOUT_WEBGL: 0x9247,

	    // Constants defined in WebGL extensions

	    // ANGLE_instanced_arrays

	    VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE: 0x88FE, // Describes the frequency divisor used for instanced rendering.

	    // WEBGL_debug_renderer_info

	    UNMASKED_VENDOR_WEBGL: 0x9245, // Passed to getParameter to get the vendor string of the graphics driver.
	    UNMASKED_RENDERER_WEBGL: 0x9246, // Passed to getParameter to get the renderer string of the graphics driver.

	    // EXT_texture_filter_anisotropic

	    MAX_TEXTURE_MAX_ANISOTROPY_EXT: 0x84FF, // Returns the maximum available anisotropy.
	    TEXTURE_MAX_ANISOTROPY_EXT: 0x84FE, // Passed to texParameter to set the desired maximum anisotropy for a texture.

	    // WEBGL_compressed_texture_s3tc

	    COMPRESSED_RGB_S3TC_DXT1_EXT: 0x83F0, // A DXT1-compressed image in an RGB image format.
	    COMPRESSED_RGBA_S3TC_DXT1_EXT: 0x83F1, // A DXT1-compressed image in an RGB image format with a simple on/off alpha value.
	    COMPRESSED_RGBA_S3TC_DXT3_EXT: 0x83F2, // A DXT3-compressed image in an RGBA image format. Compared to a 32-bit RGBA texture, it offers 4:1 compression.
	    COMPRESSED_RGBA_S3TC_DXT5_EXT: 0x83F3, // A DXT5-compressed image in an RGBA image format. It also provides a 4:1 compression, but differs to the DXT3 compression in how the alpha compression is done.

	    // WEBGL_compressed_texture_es3

	    COMPRESSED_R11_EAC: 0x9270, // One-channel (red) unsigned format compression.
	    COMPRESSED_SIGNED_R11_EAC: 0x9271, // One-channel (red) signed format compression.
	    COMPRESSED_RG11_EAC: 0x9272, // Two-channel (red and green) unsigned format compression.
	    COMPRESSED_SIGNED_RG11_EAC: 0x9273, // Two-channel (red and green) signed format compression.
	    COMPRESSED_RGB8_ETC2: 0x9274, // Compresses RBG8 data with no alpha channel.
	    COMPRESSED_RGBA8_ETC2_EAC: 0x9275, // Compresses RGBA8 data. The RGB part is encoded the same as RGB_ETC2, but the alpha part is encoded separately.
	    COMPRESSED_SRGB8_ETC2: 0x9276, // Compresses sRBG8 data with no alpha channel.
	    COMPRESSED_SRGB8_ALPHA8_ETC2_EAC: 0x9277, // Compresses sRGBA8 data. The sRGB part is encoded the same as SRGB_ETC2, but the alpha part is encoded separately.
	    COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2: 0x9278, // Similar to RGB8_ETC, but with ability to punch through the alpha channel, which means to make it completely opaque or transparent.
	    COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2: 0x9279, // Similar to SRGB8_ETC, but with ability to punch through the alpha channel, which means to make it completely opaque or transparent.

	    // WEBGL_compressed_texture_pvrtc

	    COMPRESSED_RGB_PVRTC_4BPPV1_IMG: 0x8C00, // RGB compression in 4-bit mode. One block for each 4×4 pixels.
	    COMPRESSED_RGBA_PVRTC_4BPPV1_IMG: 0x8C02, // RGBA compression in 4-bit mode. One block for each 4×4 pixels.
	    COMPRESSED_RGB_PVRTC_2BPPV1_IMG: 0x8C01, // RGB compression in 2-bit mode. One block for each 8×4 pixels.
	    COMPRESSED_RGBA_PVRTC_2BPPV1_IMG: 0x8C03, // RGBA compression in 2-bit mode. One block for each 8×4 pixe

	    // WEBGL_compressed_texture_etc1

	    COMPRESSED_RGB_ETC1_WEBGL: 0x8D64, // Compresses 24-bit RGB data with no alpha channel.

	    // WEBGL_compressed_texture_atc

	    COMPRESSED_RGB_ATC_WEBGL: 0x8C92, //  Compresses RGB textures with no alpha channel.
	    COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL: 0x8C92, // Compresses RGBA textures using explicit alpha encoding (useful when alpha transitions are sharp).
	    COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL: 0x87EE, // Compresses RGBA textures using interpolated alpha encoding (useful when alpha transitions are gradient).

	    // WEBGL_depth_texture

	    UNSIGNED_INT_24_8_WEBGL: 0x84FA, // Unsigned integer type for 24-bit depth texture data.

	    // OES_texture_half_float

	    HALF_FLOAT_OES: 0x8D61, // Half floating-point type (16-bit).

	    // WEBGL_color_buffer_float

	    RGBA32F_EXT: 0x8814, // RGBA 32-bit floating-point color-renderable format.
	    RGB32F_EXT: 0x8815, // RGB 32-bit floating-point color-renderable format.
	    FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE_EXT: 0x8211,
	    UNSIGNED_NORMALIZED_EXT: 0x8C17,

	    // EXT_blend_minmax

	    MIN_EXT: 0x8007, // Produces the minimum color components of the source and destination colors.
	    MAX_EXT: 0x8008, // Produces the maximum color components of the source and destination colors.

	    // EXT_sRGB

	    SRGB_EXT: 0x8C40, // Unsized sRGB format that leaves the precision up to the driver.
	    SRGB_ALPHA_EXT: 0x8C42, // Unsized sRGB format with unsized alpha component.
	    SRGB8_ALPHA8_EXT: 0x8C43, // Sized (8-bit) sRGB and alpha formats.
	    FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT: 0x8210, // Returns the framebuffer color encoding.

	    // OES_standard_derivatives

	    FRAGMENT_SHADER_DERIVATIVE_HINT_OES: 0x8B8B, // Indicates the accuracy of the derivative calculation for the GLSL built-in functions: dFdx, dFdy, and fwidth.

	    // WEBGL_draw_buffers

	    COLOR_ATTACHMENT0_WEBGL: 0x8CE0, // Framebuffer color attachment point
	    COLOR_ATTACHMENT1_WEBGL: 0x8CE1, // Framebuffer color attachment point
	    COLOR_ATTACHMENT2_WEBGL: 0x8CE2, // Framebuffer color attachment point
	    COLOR_ATTACHMENT3_WEBGL: 0x8CE3, // Framebuffer color attachment point
	    COLOR_ATTACHMENT4_WEBGL: 0x8CE4, // Framebuffer color attachment point
	    COLOR_ATTACHMENT5_WEBGL: 0x8CE5, // Framebuffer color attachment point
	    COLOR_ATTACHMENT6_WEBGL: 0x8CE6, // Framebuffer color attachment point
	    COLOR_ATTACHMENT7_WEBGL: 0x8CE7, // Framebuffer color attachment point
	    COLOR_ATTACHMENT8_WEBGL: 0x8CE8, // Framebuffer color attachment point
	    COLOR_ATTACHMENT9_WEBGL: 0x8CE9, // Framebuffer color attachment point
	    COLOR_ATTACHMENT10_WEBGL: 0x8CEA, // Framebuffer color attachment point
	    COLOR_ATTACHMENT11_WEBGL: 0x8CEB, // Framebuffer color attachment point
	    COLOR_ATTACHMENT12_WEBGL: 0x8CEC, // Framebuffer color attachment point
	    COLOR_ATTACHMENT13_WEBGL: 0x8CED, // Framebuffer color attachment point
	    COLOR_ATTACHMENT14_WEBGL: 0x8CEE, // Framebuffer color attachment point
	    COLOR_ATTACHMENT15_WEBGL: 0x8CEF, // Framebuffer color attachment point
	    DRAW_BUFFER0_WEBGL: 0x8825, // Draw buffer
	    DRAW_BUFFER1_WEBGL: 0x8826, // Draw buffer
	    DRAW_BUFFER2_WEBGL: 0x8827, // Draw buffer
	    DRAW_BUFFER3_WEBGL: 0x8828, // Draw buffer
	    DRAW_BUFFER4_WEBGL: 0x8829, // Draw buffer
	    DRAW_BUFFER5_WEBGL: 0x882A, // Draw buffer
	    DRAW_BUFFER6_WEBGL: 0x882B, // Draw buffer
	    DRAW_BUFFER7_WEBGL: 0x882C, // Draw buffer
	    DRAW_BUFFER8_WEBGL: 0x882D, // Draw buffer
	    DRAW_BUFFER9_WEBGL: 0x882E, // Draw buffer
	    DRAW_BUFFER10_WEBGL: 0x882F, // Draw buffer
	    DRAW_BUFFER11_WEBGL: 0x8830, // Draw buffer
	    DRAW_BUFFER12_WEBGL: 0x8831, // Draw buffer
	    DRAW_BUFFER13_WEBGL: 0x8832, // Draw buffer
	    DRAW_BUFFER14_WEBGL: 0x8833, // Draw buffer
	    DRAW_BUFFER15_WEBGL: 0x8834, // Draw buffer
	    MAX_COLOR_ATTACHMENTS_WEBGL: 0x8CDF, // Maximum number of framebuffer color attachment points
	    MAX_DRAW_BUFFERS_WEBGL: 0x8824, // Maximum number of draw buffers

	    // OES_vertex_array_object

	    VERTEX_ARRAY_BINDING_OES: 0x85B5, // The bound vertex array object (VAO).

	    // EXT_disjoint_timer_query

	    QUERY_COUNTER_BITS_EXT: 0x8864, // The number of bits used to hold the query result for the given target.
	    CURRENT_QUERY_EXT: 0x8865, // The currently active query.
	    QUERY_RESULT_EXT: 0x8866, // The query result.
	    QUERY_RESULT_AVAILABLE_EXT: 0x8867, // A Boolean indicating whether or not a query result is available.
	    TIME_ELAPSED_EXT: 0x88BF, // Elapsed time (in nanoseconds).
	    TIMESTAMP_EXT: 0x8E28, // The current time.
	    GPU_DISJOINT_EXT: 0x8FBB // A Boolean indicating whether or not the GPU performed any disjoint operation.
	};

	var GLConstants_1 = GLConstants;

	/**
	 * reference:
	 * https://github.com/uber/luma.gl/blob/master/src/utils/is-browser.js
	 */
	var isNode = (typeof process === 'undefined' ? 'undefined' : _typeof(process)) === 'object' && String(process) === '[object process]' && !process.browser;

	var isNode_1 = isNode;

	/**
	 * store mapping data and default value
	 */
	var _polyfill = {};
	/**
	 * source poly
	 */
	var _poly = {
	    'MAX_VIEWPORT_DIMS': {
	        name: 'MAX_VIEWPORT_DIMS',
	        key: GLConstants_1.MAX_VIEWPORT_DIMS,
	        webgl: new Float32Array([32767, 32767]),
	        webgl2: new Float32Array([32767, 32767])
	    },
	    'ALIASED_POINT_SIZE_RANGE': {
	        name: 'ALIASED_POINT_SIZE_RANGE',
	        key: GLConstants_1.ALIASED_POINT_SIZE_RANGE,
	        webgl: new Float32Array([1, 1024]),
	        webgl2: new Float32Array([1, 1024])
	    },
	    'ALIASED_LINE_WIDTH_RANGE': {
	        name: 'ALIASED_LINE_WIDTH_RANGE',
	        key: GLConstants_1.ALIASED_LINE_WIDTH_RANGE,
	        webgl: new Float32Array([1, 1]),
	        webgl2: new Float32Array([1, 1])
	    },
	    'MAX_VERTEX_UNIFORM_VECTORS': {
	        name: 'MAX_VERTEX_UNIFORM_VECTORS',
	        key: GLConstants_1.MAX_VERTEX_UNIFORM_VECTORS,
	        webgl: 128,
	        webgl2: 128
	    },
	    'MAX_VERTEX_TEXTURE_IMAGE_UNITS': {
	        name: 'MAX_VERTEX_TEXTURE_IMAGE_UNITS',
	        key: GLConstants_1.MAX_VERTEX_TEXTURE_IMAGE_UNITS,
	        webgl: 0,
	        webgl2: 0
	    },
	    'MAX_VERTEX_ATTRIBS': {
	        name: 'MAX_VERTEX_ATTRIBS',
	        key: GLConstants_1.MAX_VERTEX_ATTRIBS,
	        webgl: 8,
	        webgl2: 8
	    },
	    'MAX_VARYING_VECTORS': {
	        name: 'MAX_VARYING_VECTORS',
	        key: GLConstants_1.MAX_VARYING_VECTORS,
	        webgl: 8,
	        webgl2: 8
	    },
	    'MAX_TEXTURE_SIZE': {
	        name: 'MAX_TEXTURE_SIZE',
	        key: GLConstants_1.MAX_TEXTURE_SIZE,
	        webgl: 64,
	        webgl2: 64
	    },
	    'MAX_RENDERBUFFER_SIZE': {
	        name: 'MAX_RENDERBUFFER_SIZE',
	        key: GLConstants_1.MAX_RENDERBUFFER_SIZE,
	        webgl: 1,
	        webgl2: 1
	    },
	    'MAX_TEXTURE_IMAGE_UNITS': {
	        name: 'MAX_TEXTURE_IMAGE_UNITS',
	        key: GLConstants_1.MAX_TEXTURE_IMAGE_UNITS,
	        webgl: 8,
	        webgl2: 8
	    },
	    'MAX_FRAGMENT_UNIFORM_VECTORS': {
	        name: 'MAX_FRAGMENT_UNIFORM_VECTORS',
	        key: GLConstants_1.MAX_FRAGMENT_UNIFORM_VECTORS,
	        webgl: 16,
	        webgl2: 16
	    },
	    'MAX_CUBE_MAP_TEXTURE_SIZE': {
	        name: 'MAX_CUBE_MAP_TEXTURE_SIZE',
	        key: GLConstants_1.MAX_CUBE_MAP_TEXTURE_SIZE,
	        webgl: 16,
	        webgl2: 16
	    },
	    'MAX_COMBINED_TEXTURE_IMAGE_UNITS': {
	        name: 'MAX_COMBINED_TEXTURE_IMAGE_UNITS',
	        key: GLConstants_1.MAX_COMBINED_TEXTURE_IMAGE_UNITS,
	        webgl: 8,
	        webgl2: 8

	    },
	    'VERSION': {
	        name: 'VERSION',
	        key: GLConstants_1.VERSION,
	        webgl: 'WebGL 1.0',
	        webgl2: 'WebGL 2.0'
	    }
	};
	/**
	 * map GLConstants location to key
	 */
	for (var key in _poly) {
	    var target = _poly[key];
	    _polyfill[key] = _polyfill[target.key] = target;
	}
	/**
	 * @class
	 */

	var GLLimits = function () {
	    /**
	     * 
	     * @param {GLContext} glContext 
	     */
	    function GLLimits(glContext) {
	        classCallCheck(this, GLLimits);

	        this._glContext = glContext;
	        this._type = glContext.renderType;
	        this._indexs = [];
	        this._map(_polyfill);
	    }
	    /**
	     * will be call while change or set WebGLRenderingContext
	     */


	    createClass(GLLimits, [{
	        key: '_include',
	        value: function _include() {}
	    }, {
	        key: '_map',
	        value: function _map(mapObject) {
	            var type = this._type;
	            for (var _key in mapObject) {
	                if (!this.hasOwnProperty(_key)) {
	                    var _target = mapObject[_key];
	                    if (!this[_key]) this[_key] = _target[type];
	                }
	            }
	        }
	    }]);
	    return GLLimits;
	}();

	var GLLimits_1 = GLLimits;

	/**
	 * reference:
	 * http://keenwon.com/851.html
	 */

	/**
	 * 
	 */
	var sys = {};

	if (!isNode_1) {
	  var ua = navigator.userAgent.toLowerCase();
	  //store version
	  var s = void 0;
	  (s = ua.match(/rv:([\d.]+)\) like gecko/)) ? sys.ie = s[1] : (s = ua.match(/msie ([\d.]+)/)) ? sys.ie = s[1] : (s = ua.match(/firefox\/([\d.]+)/)) ? sys.firefox = s[1] : (s = ua.match(/chrome\/([\d.]+)/)) ? sys.chrome = s[1] : (s = ua.match(/opera.([\d.]+)/)) ? sys.opera = s[1] : (s = ua.match(/version\/([\d.]+).*safari/)) ? sys.safari = s[1] : 0;
	}

	var browser = sys;

	/**
	 * management of GLExtension
	 * @author yellow date 2017/6/15
	 */
	/**
	 * contain ie firefox chrome opera safari
	 */

	/** 
	 * extension index
	*/
	var EXTENSION_INDEX = {
	    OES_standard_derivatives: ['OES_standard_derivatives'],
	    OES_element_index_uint: ['OES_element_index_uint'],
	    WEBGL_depth_texture: ['WEBGL_depth_texture', 'WEBKIT_WEBGL_depth_texture'],
	    OES_texture_float: ['OES_texture_float'],
	    EXT_frag_depth: ['EXT_frag_depth'],
	    WEBGL_debug_shaders: ['WEBGL_debug_shaders'],
	    WEBGL_compressed_texture_s3tc: ['WEBGL_compressed_texture_s3tc', 'MOZ_WEBGL_compressed_texture_s3tc', 'WEBKIT_WEBGL_compressed_texture_s3tc'],
	    WEBGL_compressed_texture_pvrtc: ['WEBGL_compressed_texture_pvrtc', 'WEBKIT_WEBGL_compressed_texture_pvrtc'],
	    WEBGL_compressed_texture_etc1: ['WEBGL_compressed_texture_etc1'],
	    EXT_texture_filter_anisotropic: ['EXT_texture_filter_anisotropic', 'MOZ_EXT_texture_filter_anisotropic', 'WEBKIT_EXT_texture_filter_anisotropic'],
	    OES_vertex_array_object: ['OES_vertex_array_object', 'MOZ_OES_vertex_array_object', 'WEBKIT_OES_vertex_array_object'],
	    ANGLE_instanced_arrays: ['ANGLE_instanced_arrays']
	    /** 
	     * webgl1 available extension
	    */
	};var extensions1 = {};
	/** 
	 * webgl2 available extension
	*/
	var extensions2 = {};
	/** 
	 * }{debug
	 * needs to be extend
	 * @class
	*/

	var Extension = function Extension(extName) {
	    classCallCheck(this, Extension);

	    this._name = extName;
	};
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays
	 */


	if (browser.firefox && parseInt(browser.firefox) >= 33 || browser.ie && parseInt(browser.ie) >= 11) {
	    extensions1['ANGLE_instanced_arrays'] = new Extension('ANGLE_instanced_arrays');
	}
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/EXT_blend_minmax
	 */
	if (browser.firefox && parseInt(browser.firefox) >= 33) {
	    extensions1['EXT_blend_minmax'] = new Extension('EXT_blend_minmax');
	}
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/EXT_color_buffer_float
	 */
	if (browser.firefox && parseInt(browser.firefox) >= 49) {
	    extensions2['EXT_color_buffer_float'] = new Extension('EXT_color_buffer_float');
	}
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/EXT_color_buffer_half_float
	 */
	if (browser.firefox && parseInt(browser.firefox) >= 30) {
	    extensions1['EXT_color_buffer_half_float'] = new Extension('EXT_color_buffer_half_float');
	}
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/EXT_disjoint_timer_query
	 */
	if (browser.firefox && parseInt(browser.firefox) >= 51 || browser.chrome && parseInt(browser.chrome) >= 47) {
	    extensions1['EXT_disjoint_timer_query'] = new Extension('EXT_disjoint_timer_query');
	}
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/EXT_frag_depth
	 */
	if (browser.firefox && parseInt(browser.firefox) >= 30 || browser.ie) {
	    extensions1['EXT_frag_depth'] = new Extension('EXT_frag_depth');
	}
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/EXT_sRGB
	 */
	if (browser.firefox && parseInt(browser.firefox) >= 28) {
	    extensions1['EXT_sRGB'] = new Extension('EXT_sRGB');
	}
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/EXT_shader_texture_lod
	 */
	if (browser.firefox && parseInt(browser.firefox) >= 50) {
	    extensions1['EXT_shader_texture_lod'] = new Extension('EXT_shader_texture_lod');
	}
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/EXT_texture_filter_anisotropic
	 */
	if (browser.firefox && parseInt(browser.firefox) >= 17 || browser.ie) {
	    extensions2['EXT_texture_filter_anisotropic'] = extensions1['EXT_texture_filter_anisotropic'] = new Extension('EXT_texture_filter_anisotropic');
	}
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/OES_element_index_uint
	 */
	if (browser.firefox && parseInt(browser.firefox) >= 24 || browser.ie) {
	    extensions2['OES_element_index_uint'] = extensions1['OES_element_index_uint'] = new Extension('OES_element_index_uint');
	}
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/OES_standard_derivatives
	 */
	if (browser.firefox && parseInt(browser.firefox) >= 10 || browser.ie) {
	    extensions1['OES_standard_derivatives'] = new Extension('OES_standard_derivatives');
	}
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/OES_texture_float
	 */
	if (browser.firefox && parseInt(browser.firefox) >= 6 || browser.ie) {
	    extensions1['OES_texture_float'] = new Extension('OES_texture_float');
	}
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/OES_texture_float_linear
	 */
	if (browser.firefox && parseInt(browser.firefox) >= 24 || browser.ie) {
	    extensions2['OES_texture_float_linear'] = extensions1['OES_texture_float_linear'] = new Extension('OES_texture_float_linear');
	}
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/OES_texture_half_float
	 */
	if (browser.firefox && parseInt(browser.firefox) >= 29 || browser.ie) {
	    extensions1['OES_texture_half_float'] = new Extension('OES_texture_half_float');
	}
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/OES_texture_half_float_linear
	 */
	if (browser.firefox && parseInt(browser.firefox) >= 30 || browser.ie) {
	    extensions2['OES_texture_half_float_linear'] = extensions1['OES_texture_half_float_linear'] = new Extension('OES_texture_half_float_linear');
	}
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/OES_vertex_array_object
	 */
	if (browser.firefox && parseInt(browser.firefox) >= 25) {
	    extensions1['OES_vertex_array_object'] = new Extension('OES_vertex_array_object');
	}
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_color_buffer_float
	 */
	if (browser.firefox && parseInt(browser.firefox) >= 30) {
	    extensions1['WEBGL_color_buffer_float'] = new Extension('WEBGL_color_buffer_float');
	}
	/**
	 * }{debug mobile/hardware
	 * https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_compressed_texture_astc
	 */
	if (browser.firefox && parseInt(browser.firefox) >= 53 || browser.chrome && parseInt(browser.chrome) >= 47) {
	    extensions2['WEBGL_compressed_texture_astc'] = extensions1['WEBGL_compressed_texture_astc'] = new Extension('WEBGL_compressed_texture_astc');
	}
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_compressed_texture_atc
	 */
	if (browser.firefox && parseInt(browser.firefox) >= 18) {
	    extensions2['WEBGL_compressed_texture_atc'] = extensions1['WEBGL_compressed_texture_atc'] = new Extension('WEBGL_compressed_texture_atc');
	}
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_compressed_texture_etc
	 */
	if (browser.firefox && parseInt(browser.firefox) >= 51) {
	    extensions2['WEBGL_compressed_texture_etc'] = extensions1['WEBGL_compressed_texture_etc'] = new Extension('WEBGL_compressed_texture_etc');
	}
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_compressed_texture_etc1
	 */
	if (browser.firefox && parseInt(browser.firefox) >= 30) {
	    extensions2['WEBGL_compressed_texture_etc1'] = extensions1['WEBGL_compressed_texture_etc1'] = new Extension('WEBGL_compressed_texture_etc1');
	}
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_compressed_texture_pvrtc
	 */
	if (browser.firefox && parseInt(browser.firefox) >= 18) {
	    extensions2['WEBGL_compressed_texture_pvrtc'] = extensions1['WEBGL_compressed_texture_pvrtc'] = new Extension('WEBGL_compressed_texture_pvrtc');
	}
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_compressed_texture_s3tc
	 */
	if (browser.firefox && parseInt(browser.firefox) >= 22 || browser.ie) {
	    extensions2['WEBGL_compressed_texture_s3tc'] = extensions1['WEBGL_compressed_texture_s3tc'] = new Extension('WEBGL_compressed_texture_s3tc');
	}
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_compressed_texture_s3tc_srgb
	 */
	if (browser.firefox && parseInt(browser.firefox) >= 55) {
	    extensions2['WEBGL_compressed_texture_s3tc_srgb'] = extensions1['WEBGL_compressed_texture_s3tc_srgb'] = new Extension('WEBGL_compressed_texture_s3tc_srgb');
	}
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_debug_renderer_info
	 */
	if (browser.firefox && parseInt(browser.firefox) >= 53 || browser.ie) {
	    extensions2['WEBGL_debug_renderer_info'] = extensions1['WEBGL_debug_renderer_info'] = new Extension('WEBGL_debug_renderer_info');
	}
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_debug_shaders
	 */
	if (browser.firefox && parseInt(browser.firefox) >= 30 || browser.chrome && parseInt(browser.chrome) >= 47) {
	    extensions2['WEBGL_debug_shaders'] = extensions1['WEBGL_debug_shaders'] = new Extension('WEBGL_debug_shaders');
	}
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_depth_texture
	 */
	if (browser.firefox && parseInt(browser.firefox) >= 22 || browser.ie) {
	    extensions1['WEBGL_debug_renderer_info'] = new Extension('WEBGL_debug_renderer_info');
	}
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_draw_buffers
	 */
	if (browser.firefox && parseInt(browser.firefox) === 28) {
	    extensions1['WEBGL_draw_buffers'] = new Extension('WEBGL_draw_buffers');
	}
	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_lose_context
	 */
	if (browser.firefox && parseInt(browser.firefox) === 22) {
	    extensions2['WEBGL_lose_context'] = extensions1['WEBGL_lose_context'] = new Extension('WEBGL_lose_context');
	}
	/**
	 * @class
	 */

	var GLExtension = function () {
	    /**
	     * 
	     * @param {GLContext} glContext 
	     */
	    function GLExtension(glContext) {
	        classCallCheck(this, GLExtension);

	        /**
	         * quote of GLContext instance
	         */
	        this._glContext = glContext;
	        /**
	         * indicate context webgl version,'webgl' or 'webgl2'
	         */
	        this._renderType = glContext.renderType;
	        /**
	         * store key and value of extension
	         * @type {Object}
	         */
	        this._options = {};
	        /**
	         * @type {Object}
	         */
	        this._extension = this._renderType === 'webgl' ? extensions1 : extensions2;
	        /**
	         * map webgl extension
	         */
	        this._map();
	    }
	    /**
	     * rebuild
	     */


	    createClass(GLExtension, [{
	        key: '_include',
	        value: function _include() {
	            //1.map exist
	            var extension = this._renderType === 'webgl' ? extensions1 : extensions2;
	            for (var key in extension) {
	                if (extension.hasOwnProperty(key)) {
	                    var extent = this.getExtension(key);
	                    if (extent) this[key] = extent;
	                }
	            }
	            //2.map standard
	            for (var key in EXTENSION_INDEX) {
	                if (EXTENSION_INDEX.hasOwnProperty(key)) {
	                    var _extent = this.getExtension(EXTENSION_INDEX[key]);
	                    if (_extent) this[key] = _extent;
	                }
	            }
	        }
	        /**
	        * 
	        * @param {String[]} extNames 
	        */

	    }, {
	        key: 'getExtension',
	        value: function getExtension() {
	            var _ref;

	            var gl = this._glContext.gl,
	                names = (_ref = []).concat.apply(_ref, arguments);
	            for (var i = 0, len = names.length; i < len; ++i) {
	                var extension = gl.getExtension(names[i]);
	                if (extension) return extension;
	            }
	            return null;
	        }
	        /**
	         * 
	         */

	    }, {
	        key: '_map',
	        value: function _map() {
	            var extension = this._extension;
	            for (var key in extension) {
	                if (extension.hasOwnProperty(key)) {
	                    this[key] = extension[key];
	                }
	            }
	        }
	    }]);
	    return GLExtension;
	}();

	var GLExtension_1 = GLExtension;

	/*
	 * Generated by PEG.js 0.10.0.
	 *
	 * http://pegjs.org/
	 */

	function peg$subclass(child, parent) {
	  function ctor() {
	    this.constructor = child;
	  }
	  ctor.prototype = parent.prototype;
	  child.prototype = new ctor();
	}

	function peg$SyntaxError(message, expected, found, location) {
	  this.message = message;
	  this.expected = expected;
	  this.found = found;
	  this.location = location;
	  this.name = "SyntaxError";

	  if (typeof Error.captureStackTrace === "function") {
	    Error.captureStackTrace(this, peg$SyntaxError);
	  }
	}

	peg$subclass(peg$SyntaxError, Error);

	peg$SyntaxError.buildMessage = function (expected, found) {
	  var DESCRIBE_EXPECTATION_FNS = {
	    literal: function literal(expectation) {
	      return "\"" + literalEscape(expectation.text) + "\"";
	    },

	    "class": function _class(expectation) {
	      var escapedParts = "",
	          i;

	      for (i = 0; i < expectation.parts.length; i++) {
	        escapedParts += expectation.parts[i] instanceof Array ? classEscape(expectation.parts[i][0]) + "-" + classEscape(expectation.parts[i][1]) : classEscape(expectation.parts[i]);
	      }

	      return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
	    },

	    any: function any(expectation) {
	      return "any character";
	    },

	    end: function end(expectation) {
	      return "end of input";
	    },

	    other: function other(expectation) {
	      return expectation.description;
	    }
	  };

	  function hex(ch) {
	    return ch.charCodeAt(0).toString(16).toUpperCase();
	  }

	  function literalEscape(s) {
	    return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\0/g, '\\0').replace(/\t/g, '\\t').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/[\x00-\x0F]/g, function (ch) {
	      return '\\x0' + hex(ch);
	    }).replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) {
	      return '\\x' + hex(ch);
	    });
	  }

	  function classEscape(s) {
	    return s.replace(/\\/g, '\\\\').replace(/\]/g, '\\]').replace(/\^/g, '\\^').replace(/-/g, '\\-').replace(/\0/g, '\\0').replace(/\t/g, '\\t').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/[\x00-\x0F]/g, function (ch) {
	      return '\\x0' + hex(ch);
	    }).replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) {
	      return '\\x' + hex(ch);
	    });
	  }

	  function describeExpectation(expectation) {
	    return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
	  }

	  function describeExpected(expected) {
	    var descriptions = new Array(expected.length),
	        i,
	        j;

	    for (i = 0; i < expected.length; i++) {
	      descriptions[i] = describeExpectation(expected[i]);
	    }

	    descriptions.sort();

	    if (descriptions.length > 0) {
	      for (i = 1, j = 1; i < descriptions.length; i++) {
	        if (descriptions[i - 1] !== descriptions[i]) {
	          descriptions[j] = descriptions[i];
	          j++;
	        }
	      }
	      descriptions.length = j;
	    }

	    switch (descriptions.length) {
	      case 1:
	        return descriptions[0];

	      case 2:
	        return descriptions[0] + " or " + descriptions[1];

	      default:
	        return descriptions.slice(0, -1).join(", ") + ", or " + descriptions[descriptions.length - 1];
	    }
	  }

	  function describeFound(found) {
	    return found ? "\"" + literalEscape(found) + "\"" : "end of input";
	  }

	  return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
	};

	function peg$parse(input, options) {
	  options = options !== void 0 ? options : {};

	  var peg$FAILED = {},
	      peg$startRuleFunctions = { start: peg$parsestart },
	      peg$startRuleFunction = peg$parsestart,
	      peg$c3 = /^[\n]/,
	      peg$c4 = peg$classExpectation(["\n"], false, false),
	      peg$c5 = function peg$c5() {
	    return "\n";
	  },
	      peg$c6 = peg$anyExpectation(),
	      peg$c7 = peg$otherExpectation("whitespace"),
	      peg$c8 = /^[\\\n]/,
	      peg$c9 = peg$classExpectation(["\\", "\n"], false, false),
	      peg$c10 = /^[\r\t\f\x0B ]/,
	      peg$c11 = peg$classExpectation(["\r", "\t", "\f", "\x0B", " "], false, false),
	      peg$c12 = "/*",
	      peg$c13 = peg$literalExpectation("/*", false),
	      peg$c14 = "*/",
	      peg$c15 = peg$literalExpectation("*/", false),
	      peg$c16 = "//",
	      peg$c17 = peg$literalExpectation("//", false),
	      peg$c18 = /^[^\n]/,
	      peg$c19 = peg$classExpectation(["\n"], true, false),
	      peg$c20 = peg$otherExpectation("comment"),
	      peg$c21 = ";",
	      peg$c22 = peg$literalExpectation(";", false),
	      peg$c23 = ",",
	      peg$c24 = peg$literalExpectation(",", false),
	      peg$c25 = "[",
	      peg$c26 = peg$literalExpectation("[", false),
	      peg$c27 = "]",
	      peg$c28 = peg$literalExpectation("]", false),
	      peg$c29 = "=",
	      peg$c30 = peg$literalExpectation("=", false),
	      peg$c31 = "(",
	      peg$c32 = peg$literalExpectation("(", false),
	      peg$c33 = ")",
	      peg$c34 = peg$literalExpectation(")", false),
	      peg$c35 = "{",
	      peg$c36 = peg$literalExpectation("{", false),
	      peg$c37 = "}",
	      peg$c38 = peg$literalExpectation("}", false),
	      peg$c39 = function peg$c39(statements) {
	    // Skip blank statements.  These were either whitespace or
	    var result = new node({
	      type: "root",
	      statements: []
	    });
	    for (var i = 0; i < statements.length; i++) {
	      if (statements[i]) {
	        result.statements = result.statements.concat(statements[i]);
	      }
	    }
	    return result;
	  },
	      peg$c40 = function peg$c40(statement) {
	    return statement;
	  },
	      peg$c41 = function peg$c41() {
	    return "";
	  },
	      peg$c42 = "#",
	      peg$c43 = peg$literalExpectation("#", false),
	      peg$c44 = "undef",
	      peg$c45 = peg$literalExpectation("undef", false),
	      peg$c46 = "pragma",
	      peg$c47 = peg$literalExpectation("pragma", false),
	      peg$c48 = "version",
	      peg$c49 = peg$literalExpectation("version", false),
	      peg$c50 = "error",
	      peg$c51 = peg$literalExpectation("error", false),
	      peg$c52 = "extension",
	      peg$c53 = peg$literalExpectation("extension", false),
	      peg$c54 = "line",
	      peg$c55 = peg$literalExpectation("line", false),
	      peg$c56 = "include",
	      peg$c57 = peg$literalExpectation("include", false),
	      peg$c58 = function peg$c58(directive, defname) {
	    return defname.join("");
	  },
	      peg$c59 = function peg$c59(directive, value) {
	    return new node({
	      type: "preprocessor",
	      directive: "#" + directive,
	      value: value
	    });
	  },
	      peg$c60 = /^[A-Za-z_]/,
	      peg$c61 = peg$classExpectation([["A", "Z"], ["a", "z"], "_"], false, false),
	      peg$c62 = /^[A-Za-z_0-9]/,
	      peg$c63 = peg$classExpectation([["A", "Z"], ["a", "z"], "_", ["0", "9"]], false, false),
	      peg$c64 = function peg$c64(head, tail) {
	    return new node({
	      type: "identifier",
	      name: head + tail.join("")
	    });
	  },
	      peg$c65 = function peg$c65(head, tail) {
	    if (!head) {
	      return [];
	    }
	    return [head].concat(tail.map(function (item) {
	      return item[1];
	    }));
	  },
	      peg$c74 = function peg$c74(macro_name, parameters) {
	    var result = new node({
	      type: "macro_call",
	      macro_name: macro_name,
	      parameters: parameters
	    });
	    if (!parameters) {
	      result.parameters = [];
	    }
	    return result;
	  },
	      peg$c76 = "define",
	      peg$c77 = peg$literalExpectation("define", false),
	      peg$c78 = /^[ \t]/,
	      peg$c79 = peg$classExpectation([" ", "\t"], false, false),
	      peg$c80 = function peg$c80(identifier, parameters, defname) {
	    return defname.join("");
	  },
	      peg$c81 = function peg$c81(identifier, parameters, token_string) {
	    return new node({
	      type: "preprocessor",
	      directive: "#define",
	      identifier: identifier.name,
	      token_string: token_string,
	      parameters: parameters || null
	    });
	  },
	      peg$c82 = "ifdef",
	      peg$c83 = peg$literalExpectation("ifdef", false),
	      peg$c84 = "ifndef",
	      peg$c85 = peg$literalExpectation("ifndef", false),
	      peg$c86 = "if",
	      peg$c87 = peg$literalExpectation("if", false),
	      peg$c88 = function peg$c88(directive, value) {
	    return new node({
	      type: "preprocessor",
	      directive: "#" + directive,
	      value: value
	    });
	  },
	      peg$c89 = "elif",
	      peg$c90 = peg$literalExpectation("elif", false),
	      peg$c91 = function peg$c91(defname) {
	    return defname.join("");
	  },
	      peg$c92 = function peg$c92(value) {
	    return new node({
	      type: "preprocessor",
	      directive: "#elif",
	      value: value
	    });
	  },
	      peg$c93 = "else",
	      peg$c94 = peg$literalExpectation("else", false),
	      peg$c95 = function peg$c95() {
	    return new node({
	      type: "preprocessor",
	      directive: "#else"
	    });
	  },
	      peg$c96 = "endif",
	      peg$c97 = peg$literalExpectation("endif", false),
	      peg$c98 = function peg$c98(if_directive, elif_directive, else_directive) {
	    return preprocessor_branch(if_directive, elif_directive, else_directive);
	  },
	      peg$c99 = function peg$c99(prototype, body) {
	    var result = new node({
	      type: "function_declaration",
	      name: prototype.name,
	      returnType: prototype.returnType,
	      parameters: prototype.parameters,
	      body: body
	    });
	    return result;
	  },
	      peg$c100 = function peg$c100(statements) {
	    var result = new node({
	      type: "scope",
	      statements: []
	    });
	    if (statements && statements.statements) {
	      result.statements = statements.statements;
	    }
	    return result;
	  },
	      peg$c101 = function peg$c101(list) {
	    return { statements: list };
	  },
	      peg$c102 = function peg$c102(statement) {
	    return statement;
	  },
	      peg$c103 = function peg$c103(condition, if_body, else_body) {
	    var result = new node({
	      type: "if_statement",
	      condition: condition,
	      body: if_body
	    });
	    if (else_body) {
	      result.elseBody = else_body[2];
	    }
	    return result;
	  },
	      peg$c104 = "for",
	      peg$c105 = peg$literalExpectation("for", false),
	      peg$c106 = function peg$c106(initializer, condition, increment, body) {
	    return new node({
	      type: "for_statement",
	      initializer: initializer,
	      condition: condition,
	      increment: increment,
	      body: body
	    });
	  },
	      peg$c107 = "while",
	      peg$c108 = peg$literalExpectation("while", false),
	      peg$c109 = function peg$c109(condition) {
	    return {
	      condition: condition
	    };
	  },
	      peg$c110 = function peg$c110(w, body) {
	    return new node({
	      type: "while_statement",
	      condition: w.condition,
	      body: body
	    });
	  },
	      peg$c111 = "do",
	      peg$c112 = peg$literalExpectation("do", false),
	      peg$c113 = function peg$c113(body, w) {
	    return new node({
	      type: "do_statement",
	      condition: w.condition,
	      body: body
	    });
	  },
	      peg$c114 = "return",
	      peg$c115 = peg$literalExpectation("return", false),
	      peg$c116 = "++",
	      peg$c117 = peg$literalExpectation("++", false),
	      peg$c118 = "--",
	      peg$c119 = peg$literalExpectation("--", false),
	      peg$c120 = "!",
	      peg$c121 = peg$literalExpectation("!", false),
	      peg$c122 = "~",
	      peg$c123 = peg$literalExpectation("~", false),
	      peg$c124 = "+",
	      peg$c125 = peg$literalExpectation("+", false),
	      peg$c126 = "-",
	      peg$c127 = peg$literalExpectation("-", false),
	      peg$c128 = function peg$c128(head, expression) {
	    return new node({
	      type: "return",
	      value: expression
	    });
	  },
	      peg$c129 = "continue",
	      peg$c130 = peg$literalExpectation("continue", false),
	      peg$c131 = "break",
	      peg$c132 = peg$literalExpectation("break", false),
	      peg$c133 = "discard",
	      peg$c134 = peg$literalExpectation("discard", false),
	      peg$c135 = function peg$c135(type) {
	    return new node({
	      type: type[0]
	    });
	  },
	      peg$c136 = function peg$c136(e) {
	    return new node({
	      type: "expression",
	      expression: e
	    });
	  },
	      peg$c137 = function peg$c137(head, tail) {
	    return new node({
	      type: "sequence",
	      expressions: [head].concat(tail.map(function (item) {
	        return item[1];
	      }))
	    });
	  },
	      peg$c138 = peg$otherExpectation("declaration"),
	      peg$c139 = function peg$c139(function_prototype) {
	    return function_prototype;
	  },
	      peg$c140 = function peg$c140(type, declarators) {
	    return new node({
	      type: "declarator",
	      typeAttribute: type,
	      declarators: declarators
	    });
	  },
	      peg$c141 = function peg$c141() {
	    return shaderType == "vs";
	  },
	      peg$c142 = "invariant",
	      peg$c143 = peg$literalExpectation("invariant", false),
	      peg$c144 = function peg$c144(head, tail) {
	    var items = [head].concat(tail.map(function (item) {
	      return item[1];
	    }));
	    return new node({
	      type: "invariant",
	      identifiers: items
	    });
	  },
	      peg$c145 = "precision",
	      peg$c146 = peg$literalExpectation("precision", false),
	      peg$c147 = function peg$c147(precission, type) {
	    return new node({
	      type: "precision",
	      precision: precission,
	      typeName: type
	    });
	  },
	      peg$c148 = function peg$c148(type, declarators) {
	    return new node({
	      type: "declarator",
	      typeAttribute: type,
	      declarators: declarators
	    });
	  },
	      peg$c149 = "void",
	      peg$c150 = peg$literalExpectation("void", false),
	      peg$c151 = function peg$c151(head, tail) {
	    return [head].concat(tail.map(function (item) {
	      return item[1];
	    }));
	  },
	      peg$c152 = function peg$c152(type, identifier, parameters) {
	    var result = new node({
	      type: "function_prototype",
	      name: identifier.name,
	      returnType: type,
	      parameters: parameters
	    });
	    if (parameters == "void" || !parameters) {
	      result.parameters = [];
	    }
	    return result;
	  },
	      peg$c153 = "inout",
	      peg$c154 = peg$literalExpectation("inout", false),
	      peg$c155 = "in",
	      peg$c156 = peg$literalExpectation("in", false),
	      peg$c157 = "out",
	      peg$c158 = peg$literalExpectation("out", false),
	      peg$c159 = function peg$c159(const_qualifier, parameter, precision, type_name, identifier, array_size) {
	    var result = new node({
	      type: "parameter",
	      type_name: type_name,
	      name: identifier.name
	    });
	    if (const_qualifier) result.typeQualifier = const_qualifier[0];
	    if (parameter) result.parameterQualifier = parameter[0];
	    if (precision) result.precision = precision[0];
	    if (array_size) result.arraySize = array_size[1];
	    // "const" is only legal on "in" parameter qualifiers.
	    if (result.typeQualifier && result.parameterQualifier && result.parameterQualifier != "in") {
	      return null;
	    } else {
	      return result;
	    }
	  },
	      peg$c160 = function peg$c160(head, tail) {
	    return [head].concat(tail.map(function (item) {
	      return item[1];
	    }));
	  },
	      peg$c161 = function peg$c161(name) {
	    return new node({
	      type: "declarator_item",
	      name: name
	    });
	  },
	      peg$c162 = function peg$c162(name, arraySize) {
	    return new node({
	      type: "declarator_item",
	      name: name,
	      arraySize: arraySize,
	      isArray: true
	    });
	  },
	      peg$c163 = function peg$c163(name) {
	    return new node({
	      type: "declarator_item",
	      name: name,
	      isArray: true
	    });
	  },
	      peg$c164 = function peg$c164(name, initializer) {
	    return new node({
	      type: "declarator_item",
	      name: name,
	      initializer: initializer
	    });
	  },
	      peg$c165 = function peg$c165(declarators) {
	    return declarators.map(function (item) {
	      return new node({
	        type: "declarator",
	        typeAttribute: item[0],
	        declarators: item[2]
	      });
	    });
	  },
	      peg$c166 = "struct",
	      peg$c167 = peg$literalExpectation("struct", false),
	      peg$c168 = function peg$c168(qualifier, identifier, members, declarators) {
	    var result = new node({
	      type: "struct_definition",
	      members: members
	    });
	    if (qualifier) {
	      result.qualifier = qualifier[0];
	    }
	    if (identifier) {
	      result.name = identifier[1].name;
	    }
	    if (declarators) {
	      result.declarators = declarators;
	    }
	    return result;
	  },
	      peg$c169 = function peg$c169(precision, name) {
	    var result = new node({
	      type: "type",
	      name: name
	    });
	    if (precision) result.precision = precision[0];
	    return result;
	  },
	      peg$c170 = peg$otherExpectation("locally specified type"),
	      peg$c171 = function peg$c171(qualifier, type) {
	    var result = type;
	    if (qualifier) result.qualifier = qualifier[0];
	    return result;
	  },
	      peg$c172 = "attribute",
	      peg$c173 = peg$literalExpectation("attribute", false),
	      peg$c174 = function peg$c174() {
	    return "attribute";
	  },
	      peg$c175 = function peg$c175(qualifier, type) {
	    var result = type;
	    result.qualifier = qualifier;
	    return result;
	  },
	      peg$c176 = peg$otherExpectation("fully specified type"),
	      peg$c177 = peg$otherExpectation("precision qualifier"),
	      peg$c178 = "highp",
	      peg$c179 = peg$literalExpectation("highp", false),
	      peg$c180 = "mediump",
	      peg$c181 = peg$literalExpectation("mediump", false),
	      peg$c182 = "lowp",
	      peg$c183 = peg$literalExpectation("lowp", false),
	      peg$c184 = "const",
	      peg$c185 = peg$literalExpectation("const", false),
	      peg$c186 = peg$otherExpectation("type qualifier"),
	      peg$c187 = "varying",
	      peg$c188 = peg$literalExpectation("varying", false),
	      peg$c189 = function peg$c189() {
	    return "invariant varying";
	  },
	      peg$c190 = "uniform",
	      peg$c191 = peg$literalExpectation("uniform", false),
	      peg$c192 = peg$otherExpectation("void"),
	      peg$c193 = function peg$c193() {
	    return new node({
	      type: "type",
	      name: "void"
	    });
	  },
	      peg$c194 = peg$otherExpectation("type name"),
	      peg$c195 = "float",
	      peg$c196 = peg$literalExpectation("float", false),
	      peg$c197 = "double",
	      peg$c198 = peg$literalExpectation("double", false),
	      peg$c199 = "int",
	      peg$c200 = peg$literalExpectation("int", false),
	      peg$c201 = "uint",
	      peg$c202 = peg$literalExpectation("uint", false),
	      peg$c203 = "bool",
	      peg$c204 = peg$literalExpectation("bool", false),
	      peg$c205 = function peg$c205(name) {
	    return name.name;
	  },
	      peg$c206 = peg$otherExpectation("identifier"),
	      peg$c207 = /^[^A-Za-z_0-9]/,
	      peg$c208 = peg$classExpectation([["A", "Z"], ["a", "z"], "_", ["0", "9"]], true, false),
	      peg$c209 = /^[$A-Za-z_]/,
	      peg$c210 = peg$classExpectation(["$", ["A", "Z"], ["a", "z"], "_"], false, false),
	      peg$c211 = /^[$A-Za-z_0-9]/,
	      peg$c212 = peg$classExpectation(["$", ["A", "Z"], ["a", "z"], "_", ["0", "9"]], false, false),
	      peg$c213 = peg$otherExpectation("keyword"),
	      peg$c214 = "sampler2D",
	      peg$c215 = peg$literalExpectation("sampler2D", false),
	      peg$c216 = "samplerCube",
	      peg$c217 = peg$literalExpectation("samplerCube", false),
	      peg$c218 = "true",
	      peg$c219 = peg$literalExpectation("true", false),
	      peg$c220 = "false",
	      peg$c221 = peg$literalExpectation("false", false),
	      peg$c222 = /^[biud]/,
	      peg$c223 = peg$classExpectation(["b", "i", "u", "d"], false, false),
	      peg$c224 = "vec",
	      peg$c225 = peg$literalExpectation("vec", false),
	      peg$c226 = /^[234]/,
	      peg$c227 = peg$classExpectation(["2", "3", "4"], false, false),
	      peg$c228 = function peg$c228(a) {
	    return a.join("");
	  },
	      peg$c229 = /^[d]/,
	      peg$c230 = peg$classExpectation(["d"], false, false),
	      peg$c231 = "mat",
	      peg$c232 = peg$literalExpectation("mat", false),
	      peg$c233 = /^[x]/,
	      peg$c234 = peg$classExpectation(["x"], false, false),
	      peg$c235 = /^[iu]/,
	      peg$c236 = peg$classExpectation(["i", "u"], false, false),
	      peg$c237 = "sampler",
	      peg$c238 = peg$literalExpectation("sampler", false),
	      peg$c239 = /^[123]/,
	      peg$c240 = peg$classExpectation(["1", "2", "3"], false, false),
	      peg$c241 = "D",
	      peg$c242 = peg$literalExpectation("D", false),
	      peg$c243 = "Array",
	      peg$c244 = peg$literalExpectation("Array", false),
	      peg$c245 = "Shadow",
	      peg$c246 = peg$literalExpectation("Shadow", false),
	      peg$c247 = "sampler2DRect",
	      peg$c248 = peg$literalExpectation("sampler2DRect", false),
	      peg$c249 = "sampler2DMS",
	      peg$c250 = peg$literalExpectation("sampler2DMS", false),
	      peg$c251 = "samplerBuffer",
	      peg$c252 = peg$literalExpectation("samplerBuffer", false),
	      peg$c260 = /^[\-1-9]/,
	      peg$c261 = peg$classExpectation(["-", ["1", "9"]], false, false),
	      peg$c262 = /^[0-9]/,
	      peg$c263 = peg$classExpectation([["0", "9"]], false, false),
	      peg$c264 = /^[Uu]/,
	      peg$c265 = peg$classExpectation(["U", "u"], false, false),
	      peg$c266 = function peg$c266(head, tail, unsigned) {
	    return new node({
	      type: "int",
	      format: "number",
	      value_base10: parseInt([head].concat(tail).join(""), 10),
	      value: [head].concat(tail).join("") + (unsigned ? unsigned : '')
	    });
	  },
	      peg$c267 = "0",
	      peg$c268 = peg$literalExpectation("0", false),
	      peg$c269 = /^[Xx]/,
	      peg$c270 = peg$classExpectation(["X", "x"], false, false),
	      peg$c271 = /^[0-9A-Fa-f]/,
	      peg$c272 = peg$classExpectation([["0", "9"], ["A", "F"], ["a", "f"]], false, false),
	      peg$c273 = function peg$c273(digits, unsigned) {
	    return new node({
	      type: "int",
	      format: "hex",
	      value_base10: parseInt(digits.join(""), 16),
	      value: "0x" + digits.join("") + (unsigned ? unsigned : '')
	    });
	  },
	      peg$c274 = /^[0-7]/,
	      peg$c275 = peg$classExpectation([["0", "7"]], false, false),
	      peg$c276 = function peg$c276(digits, unsigned) {
	    return new node({
	      type: "int",
	      format: "octal",
	      value_base10: parseInt(digits.join(""), 8),
	      value: "0" + digits.join("") + (unsigned ? unsigned : '')
	    });
	  },
	      peg$c277 = function peg$c277(unsigned) {
	    return new node({
	      type: "int",
	      format: "number",
	      value_base10: 0,
	      value: "0" + (unsigned ? unsigned : '')
	    });
	  },
	      peg$c278 = /^[\-0-9]/,
	      peg$c279 = peg$classExpectation(["-", ["0", "9"]], false, false),
	      peg$c280 = ".",
	      peg$c281 = peg$literalExpectation(".", false),
	      peg$c282 = /^[fF]/,
	      peg$c283 = peg$classExpectation(["f", "F"], false, false),
	      peg$c284 = "lf",
	      peg$c285 = peg$literalExpectation("lf", false),
	      peg$c286 = "LF",
	      peg$c287 = peg$literalExpectation("LF", false),
	      peg$c288 = function peg$c288(digits, suffix) {
	    digits[0] = digits[0].join("");
	    digits[2] = digits[2].join("");
	    return new node({
	      type: "float",
	      value_base10: parseFloat(digits.join("")),
	      value: digits.join("") + (suffix ? suffix : '')
	    });
	  },
	      peg$c289 = /^[f]/,
	      peg$c290 = peg$classExpectation(["f"], false, false),
	      peg$c291 = function peg$c291(digits, suffix) {
	    return new node({
	      type: "float",
	      value_base10: parseFloat(digits[0].join("") + digits[1]),
	      value: digits.join("") + (suffix ? suffix : '')
	    });
	  },
	      peg$c292 = /^[Ee]/,
	      peg$c293 = peg$classExpectation(["E", "e"], false, false),
	      peg$c294 = /^[+\-]/,
	      peg$c295 = peg$classExpectation(["+", "-"], false, false),
	      peg$c296 = function peg$c296(sign, exponent) {
	    return ["e", sign].concat(exponent).join("");
	  },
	      peg$c297 = function peg$c297(expression) {
	    return expression;
	  },
	      peg$c298 = function peg$c298(value) {
	    return new node({
	      type: "bool",
	      value: value == "true"
	    });
	  },
	      peg$c299 = function peg$c299(index) {
	    return new node({
	      type: "accessor",
	      index: index
	    });
	  },
	      peg$c300 = function peg$c300(id) {
	    return new node({
	      type: "field_selector",
	      selection: id.name
	    });
	  },
	      peg$c301 = function peg$c301(head, tail) {
	    var result = head;
	    for (var i = 0; i < tail.length; i++) {
	      result = new node({
	        type: "postfix",
	        operator: tail[i],
	        expression: result
	      });
	    }
	    return result;
	  },
	      peg$c302 = function peg$c302(head, tail, rest) {
	    var result = head;
	    if (tail) {
	      result = new node({
	        type: "postfix",
	        operator: new node({
	          id: next_id++,
	          type: "operator",
	          operator: tail
	        }),
	        expression: result
	      });
	    }
	    for (var i = 0; i < rest.length; i++) {
	      result = new node({
	        type: "postfix",
	        operator: rest[i],
	        expression: result
	      });
	    }
	    return result;
	  },
	      peg$c303 = function peg$c303() {
	    return [];
	  },
	      peg$c304 = function peg$c304(head, tail) {
	    return [head].concat(tail.map(function (item) {
	      return item[1];
	    }));
	  },
	      peg$c305 = function peg$c305(function_name, parameters) {
	    var result = new node({
	      type: "function_call",
	      function_name: function_name,
	      parameters: parameters
	    });
	    if (!parameters) {
	      result.parameters = [];
	    }
	    return result;
	  },
	      peg$c306 = function peg$c306(id) {
	    return id.name;
	  },
	      peg$c307 = function peg$c307(head, tail) {
	    var result = tail;
	    if (head) {
	      result = new node({
	        type: "unary",
	        expression: result,
	        operator: new node({
	          type: "operator",
	          operator: head
	        })
	      });
	    }
	    return result;
	  },
	      peg$c308 = "*",
	      peg$c309 = peg$literalExpectation("*", false),
	      peg$c310 = "/",
	      peg$c311 = peg$literalExpectation("/", false),
	      peg$c312 = "%",
	      peg$c313 = peg$literalExpectation("%", false),
	      peg$c314 = function peg$c314(operator) {
	    return new node({
	      type: "operator",
	      operator: operator
	    });
	  },
	      peg$c315 = function peg$c315(head, tail) {
	    return daisy_chain(head, tail);
	  },
	      peg$c316 = function peg$c316() {
	    return new node({
	      type: "operator",
	      operator: "+"
	    });
	  },
	      peg$c317 = function peg$c317() {
	    return new node({
	      type: "operator",
	      operator: "-"
	    });
	  },
	      peg$c318 = "<<",
	      peg$c319 = peg$literalExpectation("<<", false),
	      peg$c320 = ">>",
	      peg$c321 = peg$literalExpectation(">>", false),
	      peg$c322 = "<",
	      peg$c323 = peg$literalExpectation("<", false),
	      peg$c324 = function peg$c324(equal) {
	    return new node({
	      type: "operator",
	      operator: "<" + (equal ? equal : '')
	    });
	  },
	      peg$c325 = ">",
	      peg$c326 = peg$literalExpectation(">", false),
	      peg$c327 = function peg$c327(equal) {
	    return new node({
	      type: "operator",
	      operator: ">" + (equal ? equal : '')
	    });
	  },
	      peg$c328 = "==",
	      peg$c329 = peg$literalExpectation("==", false),
	      peg$c330 = "!=",
	      peg$c331 = peg$literalExpectation("!=", false),
	      peg$c332 = function peg$c332(operator) {
	    return new node({
	      type: "operator",
	      operator: operator
	    });
	  },
	      peg$c333 = "&",
	      peg$c334 = peg$literalExpectation("&", false),
	      peg$c335 = function peg$c335() {
	    return new node({
	      type: "operator",
	      operator: "&"
	    });
	  },
	      peg$c336 = "^",
	      peg$c337 = peg$literalExpectation("^", false),
	      peg$c338 = function peg$c338() {
	    return new node({
	      type: "operator",
	      operator: "^"
	    });
	  },
	      peg$c339 = "|",
	      peg$c340 = peg$literalExpectation("|", false),
	      peg$c341 = function peg$c341() {
	    return new node({
	      type: "operator",
	      operator: "|"
	    });
	  },
	      peg$c342 = "&&",
	      peg$c343 = peg$literalExpectation("&&", false),
	      peg$c344 = function peg$c344() {
	    return new node({
	      type: "operator",
	      operator: "&&"
	    });
	  },
	      peg$c345 = "^^",
	      peg$c346 = peg$literalExpectation("^^", false),
	      peg$c347 = function peg$c347() {
	    return new node({
	      type: "operator",
	      operator: "^^"
	    });
	  },
	      peg$c348 = "||",
	      peg$c349 = peg$literalExpectation("||", false),
	      peg$c350 = function peg$c350() {
	    return new node({
	      type: "operator",
	      operator: "||"
	    });
	  },
	      peg$c351 = "?",
	      peg$c352 = peg$literalExpectation("?", false),
	      peg$c353 = ":",
	      peg$c354 = peg$literalExpectation(":", false),
	      peg$c355 = function peg$c355(head, tail) {
	    var result = head;
	    if (tail) {
	      result = new node({
	        type: "ternary",
	        condition: head,
	        is_true: tail[3],
	        is_false: tail[7]
	      });
	    }
	    return result;
	  },
	      peg$c356 = "*=",
	      peg$c357 = peg$literalExpectation("*=", false),
	      peg$c358 = "/=",
	      peg$c359 = peg$literalExpectation("/=", false),
	      peg$c360 = "%=",
	      peg$c361 = peg$literalExpectation("%=", false),
	      peg$c362 = "+=",
	      peg$c363 = peg$literalExpectation("+=", false),
	      peg$c364 = "-=",
	      peg$c365 = peg$literalExpectation("-=", false),
	      peg$c366 = "<<=",
	      peg$c367 = peg$literalExpectation("<<=", false),
	      peg$c368 = ">>=",
	      peg$c369 = peg$literalExpectation(">>=", false),
	      peg$c370 = "&=",
	      peg$c371 = peg$literalExpectation("&=", false),
	      peg$c372 = "^=",
	      peg$c373 = peg$literalExpectation("^=", false),
	      peg$c374 = "|=",
	      peg$c375 = peg$literalExpectation("|=", false),
	      peg$c376 = function peg$c376(variable, operator, expression) {
	    return new node({
	      type: "binary",
	      operator: new node({
	        type: "operator",
	        operator: operator
	      }),
	      left: variable,
	      right: expression
	    });
	  },
	      peg$currPos = 0,
	      peg$posDetailsCache = [{ line: 1, column: 1 }],
	      peg$maxFailPos = 0,
	      peg$maxFailExpected = [],
	      peg$silentFails = 0,
	      peg$result;

	  if ("startRule" in options) {
	    if (!(options.startRule in peg$startRuleFunctions)) {
	      throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
	    }

	    peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
	  }

	  function peg$literalExpectation(text, ignoreCase) {
	    return { type: "literal", text: text, ignoreCase: ignoreCase };
	  }

	  function peg$classExpectation(parts, inverted, ignoreCase) {
	    return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
	  }

	  function peg$anyExpectation() {
	    return { type: "any" };
	  }

	  function peg$endExpectation() {
	    return { type: "end" };
	  }

	  function peg$otherExpectation(description) {
	    return { type: "other", description: description };
	  }

	  function peg$computePosDetails(pos) {
	    var details = peg$posDetailsCache[pos],
	        p;

	    if (details) {
	      return details;
	    } else {
	      p = pos - 1;
	      while (!peg$posDetailsCache[p]) {
	        p--;
	      }

	      details = peg$posDetailsCache[p];
	      details = {
	        line: details.line,
	        column: details.column
	      };

	      while (p < pos) {
	        if (input.charCodeAt(p) === 10) {
	          details.line++;
	          details.column = 1;
	        } else {
	          details.column++;
	        }

	        p++;
	      }

	      peg$posDetailsCache[pos] = details;
	      return details;
	    }
	  }

	  function peg$computeLocation(startPos, endPos) {
	    var startPosDetails = peg$computePosDetails(startPos),
	        endPosDetails = peg$computePosDetails(endPos);

	    return {
	      start: {
	        offset: startPos,
	        line: startPosDetails.line,
	        column: startPosDetails.column
	      },
	      end: {
	        offset: endPos,
	        line: endPosDetails.line,
	        column: endPosDetails.column
	      }
	    };
	  }

	  function peg$fail(expected) {
	    if (peg$currPos < peg$maxFailPos) {
	      return;
	    }

	    if (peg$currPos > peg$maxFailPos) {
	      peg$maxFailPos = peg$currPos;
	      peg$maxFailExpected = [];
	    }

	    peg$maxFailExpected.push(expected);
	  }

	  function peg$buildStructuredError(expected, found, location) {
	    return new peg$SyntaxError(peg$SyntaxError.buildMessage(expected, found), expected, found, location);
	  }

	  function peg$parsestart() {
	    var s0;

	    s0 = peg$parseexternal_statement_list();

	    return s0;
	  }

	  function peg$parsenewLine() {
	    var s0, s1;

	    s0 = peg$currPos;
	    if (peg$c3.test(input.charAt(peg$currPos))) {
	      s1 = input.charAt(peg$currPos);
	      peg$currPos++;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c4);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s1 = peg$c5();
	    }
	    s0 = s1;

	    return s0;
	  }

	  function peg$parseEOF() {
	    var s0, s1;

	    s0 = peg$currPos;
	    peg$silentFails++;
	    if (input.length > peg$currPos) {
	      s1 = input.charAt(peg$currPos);
	      peg$currPos++;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c6);
	      }
	    }
	    peg$silentFails--;
	    if (s1 === peg$FAILED) {
	      s0 = void 0;
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parse_() {
	    var s0, s1;

	    peg$silentFails++;
	    s0 = [];
	    s1 = peg$parsenewLine();
	    if (s1 === peg$FAILED) {
	      if (peg$c8.test(input.charAt(peg$currPos))) {
	        s1 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c9);
	        }
	      }
	      if (s1 === peg$FAILED) {
	        if (peg$c10.test(input.charAt(peg$currPos))) {
	          s1 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c11);
	          }
	        }
	        if (s1 === peg$FAILED) {
	          s1 = peg$parsecomment();
	        }
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      while (s1 !== peg$FAILED) {
	        s0.push(s1);
	        s1 = peg$parsenewLine();
	        if (s1 === peg$FAILED) {
	          if (peg$c8.test(input.charAt(peg$currPos))) {
	            s1 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c9);
	            }
	          }
	          if (s1 === peg$FAILED) {
	            if (peg$c10.test(input.charAt(peg$currPos))) {
	              s1 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s1 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c11);
	              }
	            }
	            if (s1 === peg$FAILED) {
	              s1 = peg$parsecomment();
	            }
	          }
	        }
	      }
	    } else {
	      s0 = peg$FAILED;
	    }
	    peg$silentFails--;
	    if (s0 === peg$FAILED) {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c7);
	      }
	    }

	    return s0;
	  }

	  function peg$parsenoNewlineComment() {
	    var s0, s1, s2, s3, s4, s5;

	    s0 = peg$currPos;
	    if (input.substr(peg$currPos, 2) === peg$c12) {
	      s1 = peg$c12;
	      peg$currPos += 2;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c13);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = [];
	      s3 = peg$currPos;
	      s4 = peg$currPos;
	      peg$silentFails++;
	      if (input.substr(peg$currPos, 2) === peg$c14) {
	        s5 = peg$c14;
	        peg$currPos += 2;
	      } else {
	        s5 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c15);
	        }
	      }
	      peg$silentFails--;
	      if (s5 === peg$FAILED) {
	        s4 = void 0;
	      } else {
	        peg$currPos = s4;
	        s4 = peg$FAILED;
	      }
	      if (s4 !== peg$FAILED) {
	        if (input.length > peg$currPos) {
	          s5 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s5 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c6);
	          }
	        }
	        if (s5 !== peg$FAILED) {
	          s4 = [s4, s5];
	          s3 = s4;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s3;
	        s3 = peg$FAILED;
	      }
	      while (s3 !== peg$FAILED) {
	        s2.push(s3);
	        s3 = peg$currPos;
	        s4 = peg$currPos;
	        peg$silentFails++;
	        if (input.substr(peg$currPos, 2) === peg$c14) {
	          s5 = peg$c14;
	          peg$currPos += 2;
	        } else {
	          s5 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c15);
	          }
	        }
	        peg$silentFails--;
	        if (s5 === peg$FAILED) {
	          s4 = void 0;
	        } else {
	          peg$currPos = s4;
	          s4 = peg$FAILED;
	        }
	        if (s4 !== peg$FAILED) {
	          if (input.length > peg$currPos) {
	            s5 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c6);
	            }
	          }
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        if (input.substr(peg$currPos, 2) === peg$c14) {
	          s3 = peg$c14;
	          peg$currPos += 2;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c15);
	          }
	        }
	        if (s3 !== peg$FAILED) {
	          s1 = [s1, s2, s3];
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }
	    if (s0 === peg$FAILED) {
	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c16) {
	        s1 = peg$c16;
	        peg$currPos += 2;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c17);
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        if (peg$c18.test(input.charAt(peg$currPos))) {
	          s3 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c19);
	          }
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          if (peg$c18.test(input.charAt(peg$currPos))) {
	            s3 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c19);
	            }
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          s1 = [s1, s2];
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    }

	    return s0;
	  }

	  function peg$parsenoNewlineWhitespace() {
	    var s0, s1;

	    s0 = [];
	    if (peg$c10.test(input.charAt(peg$currPos))) {
	      s1 = input.charAt(peg$currPos);
	      peg$currPos++;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c11);
	      }
	    }
	    if (s1 === peg$FAILED) {
	      s1 = peg$parsenoNewlineComment();
	    }
	    if (s1 !== peg$FAILED) {
	      while (s1 !== peg$FAILED) {
	        s0.push(s1);
	        if (peg$c10.test(input.charAt(peg$currPos))) {
	          s1 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c11);
	          }
	        }
	        if (s1 === peg$FAILED) {
	          s1 = peg$parsenoNewlineComment();
	        }
	      }
	    } else {
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsecomment() {
	    var s0, s1, s2, s3, s4, s5;

	    peg$silentFails++;
	    s0 = peg$currPos;
	    if (input.substr(peg$currPos, 2) === peg$c12) {
	      s1 = peg$c12;
	      peg$currPos += 2;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c13);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = [];
	      s3 = peg$currPos;
	      s4 = peg$currPos;
	      peg$silentFails++;
	      if (input.substr(peg$currPos, 2) === peg$c14) {
	        s5 = peg$c14;
	        peg$currPos += 2;
	      } else {
	        s5 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c15);
	        }
	      }
	      peg$silentFails--;
	      if (s5 === peg$FAILED) {
	        s4 = void 0;
	      } else {
	        peg$currPos = s4;
	        s4 = peg$FAILED;
	      }
	      if (s4 !== peg$FAILED) {
	        if (input.length > peg$currPos) {
	          s5 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s5 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c6);
	          }
	        }
	        if (s5 !== peg$FAILED) {
	          s4 = [s4, s5];
	          s3 = s4;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s3;
	        s3 = peg$FAILED;
	      }
	      while (s3 !== peg$FAILED) {
	        s2.push(s3);
	        s3 = peg$currPos;
	        s4 = peg$currPos;
	        peg$silentFails++;
	        if (input.substr(peg$currPos, 2) === peg$c14) {
	          s5 = peg$c14;
	          peg$currPos += 2;
	        } else {
	          s5 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c15);
	          }
	        }
	        peg$silentFails--;
	        if (s5 === peg$FAILED) {
	          s4 = void 0;
	        } else {
	          peg$currPos = s4;
	          s4 = peg$FAILED;
	        }
	        if (s4 !== peg$FAILED) {
	          if (input.length > peg$currPos) {
	            s5 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c6);
	            }
	          }
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        if (input.substr(peg$currPos, 2) === peg$c14) {
	          s3 = peg$c14;
	          peg$currPos += 2;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c15);
	          }
	        }
	        if (s3 !== peg$FAILED) {
	          s1 = [s1, s2, s3];
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }
	    if (s0 === peg$FAILED) {
	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c16) {
	        s1 = peg$c16;
	        peg$currPos += 2;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c17);
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        if (peg$c18.test(input.charAt(peg$currPos))) {
	          s3 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c19);
	          }
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          if (peg$c18.test(input.charAt(peg$currPos))) {
	            s3 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c19);
	            }
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parsenewLine();
	          if (s3 === peg$FAILED) {
	            s3 = peg$parseEOF();
	          }
	          if (s3 !== peg$FAILED) {
	            s1 = [s1, s2, s3];
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    }
	    peg$silentFails--;
	    if (s0 === peg$FAILED) {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c20);
	      }
	    }

	    return s0;
	  }

	  function peg$parsesemicolon() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    s1 = peg$parse_();
	    if (s1 === peg$FAILED) {
	      s1 = null;
	    }
	    if (s1 !== peg$FAILED) {
	      if (input.charCodeAt(peg$currPos) === 59) {
	        s2 = peg$c21;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c22);
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parse_();
	        if (s3 === peg$FAILED) {
	          s3 = null;
	        }
	        if (s3 !== peg$FAILED) {
	          s1 = [s1, s2, s3];
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsecomma() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    s1 = peg$parse_();
	    if (s1 === peg$FAILED) {
	      s1 = null;
	    }
	    if (s1 !== peg$FAILED) {
	      if (input.charCodeAt(peg$currPos) === 44) {
	        s2 = peg$c23;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c24);
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parse_();
	        if (s3 === peg$FAILED) {
	          s3 = null;
	        }
	        if (s3 !== peg$FAILED) {
	          s1 = [s1, s2, s3];
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parseleft_bracket() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    s1 = peg$parse_();
	    if (s1 === peg$FAILED) {
	      s1 = null;
	    }
	    if (s1 !== peg$FAILED) {
	      if (input.charCodeAt(peg$currPos) === 91) {
	        s2 = peg$c25;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c26);
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parse_();
	        if (s3 === peg$FAILED) {
	          s3 = null;
	        }
	        if (s3 !== peg$FAILED) {
	          s1 = [s1, s2, s3];
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parseright_bracket() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    s1 = peg$parse_();
	    if (s1 === peg$FAILED) {
	      s1 = null;
	    }
	    if (s1 !== peg$FAILED) {
	      if (input.charCodeAt(peg$currPos) === 93) {
	        s2 = peg$c27;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c28);
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parse_();
	        if (s3 === peg$FAILED) {
	          s3 = null;
	        }
	        if (s3 !== peg$FAILED) {
	          s1 = [s1, s2, s3];
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parseequals() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    s1 = peg$parse_();
	    if (s1 === peg$FAILED) {
	      s1 = null;
	    }
	    if (s1 !== peg$FAILED) {
	      if (input.charCodeAt(peg$currPos) === 61) {
	        s2 = peg$c29;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c30);
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parse_();
	        if (s3 === peg$FAILED) {
	          s3 = null;
	        }
	        if (s3 !== peg$FAILED) {
	          s1 = [s1, s2, s3];
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parseleft_paren() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    s1 = peg$parse_();
	    if (s1 === peg$FAILED) {
	      s1 = null;
	    }
	    if (s1 !== peg$FAILED) {
	      if (input.charCodeAt(peg$currPos) === 40) {
	        s2 = peg$c31;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c32);
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parse_();
	        if (s3 === peg$FAILED) {
	          s3 = null;
	        }
	        if (s3 !== peg$FAILED) {
	          s1 = [s1, s2, s3];
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parseright_paren() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    s1 = peg$parse_();
	    if (s1 === peg$FAILED) {
	      s1 = null;
	    }
	    if (s1 !== peg$FAILED) {
	      if (input.charCodeAt(peg$currPos) === 41) {
	        s2 = peg$c33;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c34);
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parse_();
	        if (s3 === peg$FAILED) {
	          s3 = null;
	        }
	        if (s3 !== peg$FAILED) {
	          s1 = [s1, s2, s3];
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parseleft_brace() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    s1 = peg$parse_();
	    if (s1 === peg$FAILED) {
	      s1 = null;
	    }
	    if (s1 !== peg$FAILED) {
	      if (input.charCodeAt(peg$currPos) === 123) {
	        s2 = peg$c35;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c36);
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parse_();
	        if (s3 === peg$FAILED) {
	          s3 = null;
	        }
	        if (s3 !== peg$FAILED) {
	          s1 = [s1, s2, s3];
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parseright_brace() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    s1 = peg$parse_();
	    if (s1 === peg$FAILED) {
	      s1 = null;
	    }
	    if (s1 !== peg$FAILED) {
	      if (input.charCodeAt(peg$currPos) === 125) {
	        s2 = peg$c37;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c38);
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parse_();
	        if (s3 === peg$FAILED) {
	          s3 = null;
	        }
	        if (s3 !== peg$FAILED) {
	          s1 = [s1, s2, s3];
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parseexternal_statement_list() {
	    var s0, s1, s2;

	    s0 = peg$currPos;
	    s1 = [];
	    s2 = peg$parseexternal_statement();
	    while (s2 !== peg$FAILED) {
	      s1.push(s2);
	      s2 = peg$parseexternal_statement();
	    }
	    if (s1 !== peg$FAILED) {
	      s1 = peg$c39(s1);
	    }
	    s0 = s1;

	    return s0;
	  }

	  function peg$parseexternal_statement() {
	    var s0, s1;

	    s0 = peg$currPos;
	    s1 = peg$parsepreprocessor_external_branch();
	    if (s1 === peg$FAILED) {
	      s1 = peg$parseexternal_declaration();
	    }
	    if (s1 !== peg$FAILED) {
	      s1 = peg$c40(s1);
	    }
	    s0 = s1;
	    if (s0 === peg$FAILED) {
	      s0 = peg$currPos;
	      s1 = peg$parse_();
	      if (s1 !== peg$FAILED) {
	        s1 = peg$c41();
	      }
	      s0 = s1;
	    }

	    return s0;
	  }

	  function peg$parseexternal_declaration() {
	    var s0;

	    s0 = peg$parsefunction_definition();
	    if (s0 === peg$FAILED) {
	      s0 = peg$parseglobal_declaration();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parsepreprocessor_define();
	        if (s0 === peg$FAILED) {
	          s0 = peg$parsepreprocessor_operator();
	          if (s0 === peg$FAILED) {
	            s0 = peg$parsestruct_definition();
	            if (s0 === peg$FAILED) {
	              s0 = peg$parsemacro_call();
	            }
	          }
	        }
	      }
	    }

	    return s0;
	  }

	  function peg$parsepreprocessor_operator() {
	    var s0, s1, s2, s3, s4, s5, s6;

	    s0 = peg$currPos;
	    if (input.charCodeAt(peg$currPos) === 35) {
	      s1 = peg$c42;
	      peg$currPos++;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c43);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      if (input.substr(peg$currPos, 5) === peg$c44) {
	        s2 = peg$c44;
	        peg$currPos += 5;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c45);
	        }
	      }
	      if (s2 === peg$FAILED) {
	        if (input.substr(peg$currPos, 6) === peg$c46) {
	          s2 = peg$c46;
	          peg$currPos += 6;
	        } else {
	          s2 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c47);
	          }
	        }
	        if (s2 === peg$FAILED) {
	          if (input.substr(peg$currPos, 7) === peg$c48) {
	            s2 = peg$c48;
	            peg$currPos += 7;
	          } else {
	            s2 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c49);
	            }
	          }
	          if (s2 === peg$FAILED) {
	            if (input.substr(peg$currPos, 5) === peg$c50) {
	              s2 = peg$c50;
	              peg$currPos += 5;
	            } else {
	              s2 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c51);
	              }
	            }
	            if (s2 === peg$FAILED) {
	              if (input.substr(peg$currPos, 9) === peg$c52) {
	                s2 = peg$c52;
	                peg$currPos += 9;
	              } else {
	                s2 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                  peg$fail(peg$c53);
	                }
	              }
	              if (s2 === peg$FAILED) {
	                if (input.substr(peg$currPos, 4) === peg$c54) {
	                  s2 = peg$c54;
	                  peg$currPos += 4;
	                } else {
	                  s2 = peg$FAILED;
	                  if (peg$silentFails === 0) {
	                    peg$fail(peg$c55);
	                  }
	                }
	                if (s2 === peg$FAILED) {
	                  if (input.substr(peg$currPos, 7) === peg$c56) {
	                    s2 = peg$c56;
	                    peg$currPos += 7;
	                  } else {
	                    s2 = peg$FAILED;
	                    if (peg$silentFails === 0) {
	                      peg$fail(peg$c57);
	                    }
	                  }
	                }
	              }
	            }
	          }
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parse_();
	        if (s3 !== peg$FAILED) {
	          s4 = peg$currPos;
	          s5 = [];
	          if (peg$c18.test(input.charAt(peg$currPos))) {
	            s6 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s6 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c19);
	            }
	          }
	          while (s6 !== peg$FAILED) {
	            s5.push(s6);
	            if (peg$c18.test(input.charAt(peg$currPos))) {
	              s6 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s6 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c19);
	              }
	            }
	          }
	          if (s5 !== peg$FAILED) {
	            s5 = peg$c58(s2, s5);
	          }
	          s4 = s5;
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parsenewLine();
	            if (s5 === peg$FAILED) {
	              s5 = peg$parseEOF();
	            }
	            if (s5 !== peg$FAILED) {
	              s1 = peg$c59(s2, s4);
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsemacro_identifier() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    if (peg$c60.test(input.charAt(peg$currPos))) {
	      s1 = input.charAt(peg$currPos);
	      peg$currPos++;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c61);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = [];
	      if (peg$c62.test(input.charAt(peg$currPos))) {
	        s3 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s3 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c63);
	        }
	      }
	      while (s3 !== peg$FAILED) {
	        s2.push(s3);
	        if (peg$c62.test(input.charAt(peg$currPos))) {
	          s3 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c63);
	          }
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c64(s1, s2);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsepreprocessor_parameter_list() {
	    var s0, s1, s2, s3, s4, s5, s6;

	    s0 = peg$currPos;
	    if (input.charCodeAt(peg$currPos) === 40) {
	      s1 = peg$c31;
	      peg$currPos++;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c32);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parsemacro_identifier();
	      if (s2 === peg$FAILED) {
	        s2 = null;
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = [];
	        s4 = peg$currPos;
	        s5 = peg$parsecomma();
	        if (s5 !== peg$FAILED) {
	          s6 = peg$parsemacro_identifier();
	          if (s6 !== peg$FAILED) {
	            s5 = [s5, s6];
	            s4 = s5;
	          } else {
	            peg$currPos = s4;
	            s4 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s4;
	          s4 = peg$FAILED;
	        }
	        while (s4 !== peg$FAILED) {
	          s3.push(s4);
	          s4 = peg$currPos;
	          s5 = peg$parsecomma();
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parsemacro_identifier();
	            if (s6 !== peg$FAILED) {
	              s5 = [s5, s6];
	              s4 = s5;
	            } else {
	              peg$currPos = s4;
	              s4 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s4;
	            s4 = peg$FAILED;
	          }
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parseright_paren();
	          if (s4 !== peg$FAILED) {
	            s1 = peg$c65(s2, s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsemacro_call() {
	    var s0, s1, s2, s3, s4, s5;

	    s0 = peg$currPos;
	    s1 = peg$parsemacro_identifier();
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parse_();
	      if (s2 === peg$FAILED) {
	        s2 = null;
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parseleft_paren();
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parseparameter_list();
	          if (s4 === peg$FAILED) {
	            s4 = null;
	          }
	          if (s4 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 41) {
	              s5 = peg$c33;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c34);
	              }
	            }
	            if (s5 !== peg$FAILED) {
	              s1 = peg$c74(s1, s4);
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsepreprocessor_define() {
	    var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;

	    s0 = peg$currPos;
	    if (input.charCodeAt(peg$currPos) === 35) {
	      s1 = peg$c42;
	      peg$currPos++;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c43);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parse_();
	      if (s2 === peg$FAILED) {
	        s2 = null;
	      }
	      if (s2 !== peg$FAILED) {
	        if (input.substr(peg$currPos, 6) === peg$c76) {
	          s3 = peg$c76;
	          peg$currPos += 6;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c77);
	          }
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parse_();
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parsemacro_identifier();
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parsepreprocessor_parameter_list();
	              if (s6 === peg$FAILED) {
	                s6 = null;
	              }
	              if (s6 !== peg$FAILED) {
	                s7 = [];
	                if (peg$c78.test(input.charAt(peg$currPos))) {
	                  s8 = input.charAt(peg$currPos);
	                  peg$currPos++;
	                } else {
	                  s8 = peg$FAILED;
	                  if (peg$silentFails === 0) {
	                    peg$fail(peg$c79);
	                  }
	                }
	                while (s8 !== peg$FAILED) {
	                  s7.push(s8);
	                  if (peg$c78.test(input.charAt(peg$currPos))) {
	                    s8 = input.charAt(peg$currPos);
	                    peg$currPos++;
	                  } else {
	                    s8 = peg$FAILED;
	                    if (peg$silentFails === 0) {
	                      peg$fail(peg$c79);
	                    }
	                  }
	                }
	                if (s7 !== peg$FAILED) {
	                  s8 = peg$currPos;
	                  s9 = [];
	                  if (peg$c18.test(input.charAt(peg$currPos))) {
	                    s10 = input.charAt(peg$currPos);
	                    peg$currPos++;
	                  } else {
	                    s10 = peg$FAILED;
	                    if (peg$silentFails === 0) {
	                      peg$fail(peg$c19);
	                    }
	                  }
	                  while (s10 !== peg$FAILED) {
	                    s9.push(s10);
	                    if (peg$c18.test(input.charAt(peg$currPos))) {
	                      s10 = input.charAt(peg$currPos);
	                      peg$currPos++;
	                    } else {
	                      s10 = peg$FAILED;
	                      if (peg$silentFails === 0) {
	                        peg$fail(peg$c19);
	                      }
	                    }
	                  }
	                  if (s9 !== peg$FAILED) {
	                    s9 = peg$c80(s5, s6, s9);
	                  }
	                  s8 = s9;
	                  if (s8 !== peg$FAILED) {
	                    s9 = peg$parsenewLine();
	                    if (s9 === peg$FAILED) {
	                      s9 = peg$parseEOF();
	                    }
	                    if (s9 !== peg$FAILED) {
	                      s1 = peg$c81(s5, s6, s8);
	                      s0 = s1;
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsepreprocessor_if() {
	    var s0, s1, s2, s3, s4, s5, s6, s7;

	    s0 = peg$currPos;
	    if (input.charCodeAt(peg$currPos) === 35) {
	      s1 = peg$c42;
	      peg$currPos++;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c43);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parse_();
	      if (s2 === peg$FAILED) {
	        s2 = null;
	      }
	      if (s2 !== peg$FAILED) {
	        if (input.substr(peg$currPos, 5) === peg$c82) {
	          s3 = peg$c82;
	          peg$currPos += 5;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c83);
	          }
	        }
	        if (s3 === peg$FAILED) {
	          if (input.substr(peg$currPos, 6) === peg$c84) {
	            s3 = peg$c84;
	            peg$currPos += 6;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c85);
	            }
	          }
	          if (s3 === peg$FAILED) {
	            if (input.substr(peg$currPos, 2) === peg$c86) {
	              s3 = peg$c86;
	              peg$currPos += 2;
	            } else {
	              s3 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c87);
	              }
	            }
	          }
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parse_();
	          if (s4 !== peg$FAILED) {
	            s5 = peg$currPos;
	            s6 = [];
	            if (peg$c18.test(input.charAt(peg$currPos))) {
	              s7 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s7 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c19);
	              }
	            }
	            while (s7 !== peg$FAILED) {
	              s6.push(s7);
	              if (peg$c18.test(input.charAt(peg$currPos))) {
	                s7 = input.charAt(peg$currPos);
	                peg$currPos++;
	              } else {
	                s7 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                  peg$fail(peg$c19);
	                }
	              }
	            }
	            if (s6 !== peg$FAILED) {
	              s6 = peg$c58(s3, s6);
	            }
	            s5 = s6;
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parsenewLine();
	              if (s6 === peg$FAILED) {
	                s6 = peg$parseEOF();
	              }
	              if (s6 !== peg$FAILED) {
	                s1 = peg$c88(s3, s5);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsepreprocessor_else_if() {
	    var s0, s1, s2, s3, s4, s5, s6, s7;

	    s0 = peg$currPos;
	    if (input.charCodeAt(peg$currPos) === 35) {
	      s1 = peg$c42;
	      peg$currPos++;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c43);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parse_();
	      if (s2 === peg$FAILED) {
	        s2 = null;
	      }
	      if (s2 !== peg$FAILED) {
	        if (input.substr(peg$currPos, 4) === peg$c89) {
	          s3 = peg$c89;
	          peg$currPos += 4;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c90);
	          }
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parse_();
	          if (s4 !== peg$FAILED) {
	            s5 = peg$currPos;
	            s6 = [];
	            if (peg$c18.test(input.charAt(peg$currPos))) {
	              s7 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s7 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c19);
	              }
	            }
	            while (s7 !== peg$FAILED) {
	              s6.push(s7);
	              if (peg$c18.test(input.charAt(peg$currPos))) {
	                s7 = input.charAt(peg$currPos);
	                peg$currPos++;
	              } else {
	                s7 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                  peg$fail(peg$c19);
	                }
	              }
	            }
	            if (s6 !== peg$FAILED) {
	              s6 = peg$c91(s6);
	            }
	            s5 = s6;
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parsenewLine();
	              if (s6 === peg$FAILED) {
	                s6 = peg$parseEOF();
	              }
	              if (s6 !== peg$FAILED) {
	                s1 = peg$c92(s5);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsepreprocessor_else() {
	    var s0, s1, s2, s3, s4, s5;

	    s0 = peg$currPos;
	    if (input.charCodeAt(peg$currPos) === 35) {
	      s1 = peg$c42;
	      peg$currPos++;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c43);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parse_();
	      if (s2 === peg$FAILED) {
	        s2 = null;
	      }
	      if (s2 !== peg$FAILED) {
	        if (input.substr(peg$currPos, 4) === peg$c93) {
	          s3 = peg$c93;
	          peg$currPos += 4;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c94);
	          }
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parsenoNewlineWhitespace();
	          if (s4 === peg$FAILED) {
	            s4 = null;
	          }
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parsenewLine();
	            if (s5 !== peg$FAILED) {
	              s1 = peg$c95();
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsepreprocessor_end() {
	    var s0, s1, s2, s3, s4, s5, s6;

	    s0 = peg$currPos;
	    if (input.charCodeAt(peg$currPos) === 35) {
	      s1 = peg$c42;
	      peg$currPos++;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c43);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parse_();
	      if (s2 === peg$FAILED) {
	        s2 = null;
	      }
	      if (s2 !== peg$FAILED) {
	        if (input.substr(peg$currPos, 5) === peg$c96) {
	          s3 = peg$c96;
	          peg$currPos += 5;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c97);
	          }
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parsenoNewlineWhitespace();
	          if (s4 === peg$FAILED) {
	            s4 = null;
	          }
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parsenewLine();
	            if (s5 === peg$FAILED) {
	              s5 = peg$parseEOF();
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parse_();
	              if (s6 === peg$FAILED) {
	                s6 = null;
	              }
	              if (s6 !== peg$FAILED) {
	                s1 = [s1, s2, s3, s4, s5, s6];
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsepreprocessor_external_branch() {
	    var s0, s1, s2, s3, s4, s5;

	    s0 = peg$currPos;
	    s1 = peg$currPos;
	    s2 = peg$parsepreprocessor_if();
	    if (s2 !== peg$FAILED) {
	      s3 = peg$parseexternal_statement_list();
	      if (s3 !== peg$FAILED) {
	        s2 = [s2, s3];
	        s1 = s2;
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s1;
	      s1 = peg$FAILED;
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = [];
	      s3 = peg$currPos;
	      s4 = peg$parsepreprocessor_else_if();
	      if (s4 !== peg$FAILED) {
	        s5 = peg$parseexternal_statement_list();
	        if (s5 !== peg$FAILED) {
	          s4 = [s4, s5];
	          s3 = s4;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s3;
	        s3 = peg$FAILED;
	      }
	      while (s3 !== peg$FAILED) {
	        s2.push(s3);
	        s3 = peg$currPos;
	        s4 = peg$parsepreprocessor_else_if();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parseexternal_statement_list();
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        s4 = peg$parsepreprocessor_else();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parseexternal_statement_list();
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 === peg$FAILED) {
	          s3 = null;
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parsepreprocessor_end();
	          if (s4 !== peg$FAILED) {
	            s1 = peg$c98(s1, s2, s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsepreprocessor_statement_branch() {
	    var s0, s1, s2, s3, s4, s5;

	    s0 = peg$currPos;
	    s1 = peg$currPos;
	    s2 = peg$parsepreprocessor_if();
	    if (s2 !== peg$FAILED) {
	      s3 = peg$parsestatement_list();
	      if (s3 !== peg$FAILED) {
	        s2 = [s2, s3];
	        s1 = s2;
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s1;
	      s1 = peg$FAILED;
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = [];
	      s3 = peg$currPos;
	      s4 = peg$parsepreprocessor_else_if();
	      if (s4 !== peg$FAILED) {
	        s5 = peg$parsestatement_list();
	        if (s5 !== peg$FAILED) {
	          s4 = [s4, s5];
	          s3 = s4;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s3;
	        s3 = peg$FAILED;
	      }
	      while (s3 !== peg$FAILED) {
	        s2.push(s3);
	        s3 = peg$currPos;
	        s4 = peg$parsepreprocessor_else_if();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parsestatement_list();
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        s4 = peg$parsepreprocessor_else();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parsestatement_list();
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 === peg$FAILED) {
	          s3 = null;
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parsepreprocessor_end();
	          if (s4 !== peg$FAILED) {
	            s1 = peg$c98(s1, s2, s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsefunction_definition() {
	    var s0, s1, s2;

	    s0 = peg$currPos;
	    s1 = peg$parsefunction_prototype();
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parsecompound_statement();
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c99(s1, s2);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsecompound_statement() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    s1 = peg$parseleft_brace();
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parsestatement_list();
	      if (s2 === peg$FAILED) {
	        s2 = null;
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parseright_brace();
	        if (s3 !== peg$FAILED) {
	          s1 = peg$c100(s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsestatement_list() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    s1 = peg$parse_();
	    if (s1 === peg$FAILED) {
	      s1 = null;
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = [];
	      s3 = peg$parsestatement_no_new_scope();
	      while (s3 !== peg$FAILED) {
	        s2.push(s3);
	        s3 = peg$parsestatement_no_new_scope();
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parse_();
	        if (s3 === peg$FAILED) {
	          s3 = null;
	        }
	        if (s3 !== peg$FAILED) {
	          s1 = peg$c101(s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsestatement_no_new_scope() {
	    var s0;

	    s0 = peg$parsecompound_statement();
	    if (s0 === peg$FAILED) {
	      s0 = peg$parsesimple_statement();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parsepreprocessor_statement_branch();
	      }
	    }

	    return s0;
	  }

	  function peg$parsestatement_with_scope() {
	    var s0;

	    s0 = peg$parsecompound_statement();
	    if (s0 === peg$FAILED) {
	      s0 = peg$parsesimple_statement();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parsepreprocessor_statement_branch();
	      }
	    }

	    return s0;
	  }

	  function peg$parsesimple_statement() {
	    var s0, s1;

	    s0 = peg$currPos;
	    s1 = peg$parsedeclaration();
	    if (s1 === peg$FAILED) {
	      s1 = peg$parseexpression_statement();
	      if (s1 === peg$FAILED) {
	        s1 = peg$parseselection_statement();
	        if (s1 === peg$FAILED) {
	          s1 = peg$parseiteration_statement();
	          if (s1 === peg$FAILED) {
	            s1 = peg$parsejump_statement();
	            if (s1 === peg$FAILED) {
	              s1 = peg$parsepreprocessor_define();
	              if (s1 === peg$FAILED) {
	                s1 = peg$parsepreprocessor_operator();
	                if (s1 === peg$FAILED) {
	                  s1 = peg$parsesequence_expression();
	                  if (s1 === peg$FAILED) {
	                    s1 = peg$parsemacro_call();
	                  }
	                }
	              }
	            }
	          }
	        }
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s1 = peg$c102(s1);
	    }
	    s0 = s1;

	    return s0;
	  }

	  function peg$parseselection_statement() {
	    var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

	    s0 = peg$currPos;
	    if (input.substr(peg$currPos, 2) === peg$c86) {
	      s1 = peg$c86;
	      peg$currPos += 2;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c87);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parseleft_paren();
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parseassignment_expression();
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parseright_paren();
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parsestatement_with_scope();
	            if (s5 !== peg$FAILED) {
	              s6 = peg$currPos;
	              if (input.substr(peg$currPos, 4) === peg$c93) {
	                s7 = peg$c93;
	                peg$currPos += 4;
	              } else {
	                s7 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                  peg$fail(peg$c94);
	                }
	              }
	              if (s7 !== peg$FAILED) {
	                s8 = peg$parse_();
	                if (s8 === peg$FAILED) {
	                  s8 = null;
	                }
	                if (s8 !== peg$FAILED) {
	                  s9 = peg$parsestatement_with_scope();
	                  if (s9 !== peg$FAILED) {
	                    s7 = [s7, s8, s9];
	                    s6 = s7;
	                  } else {
	                    peg$currPos = s6;
	                    s6 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s6;
	                  s6 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s6;
	                s6 = peg$FAILED;
	              }
	              if (s6 === peg$FAILED) {
	                s6 = null;
	              }
	              if (s6 !== peg$FAILED) {
	                s1 = peg$c103(s3, s5, s6);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsefor_loop() {
	    var s0, s1, s2, s3, s4, s5, s6, s7, s8;

	    s0 = peg$currPos;
	    if (input.substr(peg$currPos, 3) === peg$c104) {
	      s1 = peg$c104;
	      peg$currPos += 3;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c105);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parseleft_paren();
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parseexpression_statement();
	        if (s3 === peg$FAILED) {
	          s3 = peg$parsedeclaration();
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parsecondition();
	          if (s4 === peg$FAILED) {
	            s4 = null;
	          }
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parsesemicolon();
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parseassignment_expression();
	              if (s6 === peg$FAILED) {
	                s6 = null;
	              }
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parseright_paren();
	                if (s7 !== peg$FAILED) {
	                  s8 = peg$parsestatement_no_new_scope();
	                  if (s8 !== peg$FAILED) {
	                    s1 = peg$c106(s3, s4, s6, s8);
	                    s0 = s1;
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsewhile_statement() {
	    var s0, s1, s2, s3, s4;

	    s0 = peg$currPos;
	    if (input.substr(peg$currPos, 5) === peg$c107) {
	      s1 = peg$c107;
	      peg$currPos += 5;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c108);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parseleft_paren();
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parsecondition();
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parseright_paren();
	          if (s4 !== peg$FAILED) {
	            s1 = peg$c109(s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsewhile_loop() {
	    var s0, s1, s2;

	    s0 = peg$currPos;
	    s1 = peg$parsewhile_statement();
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parsestatement_no_new_scope();
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c110(s1, s2);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsedo_while() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    if (input.substr(peg$currPos, 2) === peg$c111) {
	      s1 = peg$c111;
	      peg$currPos += 2;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c112);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parsestatement_with_scope();
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parsewhile_statement();
	        if (s3 !== peg$FAILED) {
	          s1 = peg$c113(s2, s3);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parseiteration_statement() {
	    var s0;

	    s0 = peg$parsewhile_loop();
	    if (s0 === peg$FAILED) {
	      s0 = peg$parsedo_while();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parsefor_loop();
	      }
	    }

	    return s0;
	  }

	  function peg$parsejump_statement() {
	    var s0, s1, s2, s3, s4, s5;

	    s0 = peg$currPos;
	    if (input.substr(peg$currPos, 6) === peg$c114) {
	      s1 = peg$c114;
	      peg$currPos += 6;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c115);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      if (input.substr(peg$currPos, 2) === peg$c116) {
	        s2 = peg$c116;
	        peg$currPos += 2;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c117);
	        }
	      }
	      if (s2 === peg$FAILED) {
	        if (input.substr(peg$currPos, 2) === peg$c118) {
	          s2 = peg$c118;
	          peg$currPos += 2;
	        } else {
	          s2 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c119);
	          }
	        }
	        if (s2 === peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 33) {
	            s2 = peg$c120;
	            peg$currPos++;
	          } else {
	            s2 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c121);
	            }
	          }
	          if (s2 === peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 126) {
	              s2 = peg$c122;
	              peg$currPos++;
	            } else {
	              s2 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c123);
	              }
	            }
	            if (s2 === peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 43) {
	                s2 = peg$c124;
	                peg$currPos++;
	              } else {
	                s2 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                  peg$fail(peg$c125);
	                }
	              }
	              if (s2 === peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 45) {
	                  s2 = peg$c126;
	                  peg$currPos++;
	                } else {
	                  s2 = peg$FAILED;
	                  if (peg$silentFails === 0) {
	                    peg$fail(peg$c127);
	                  }
	                }
	              }
	            }
	          }
	        }
	      }
	      if (s2 === peg$FAILED) {
	        s2 = null;
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parse_();
	        if (s3 === peg$FAILED) {
	          s3 = null;
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parseassignment_expression();
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parsesemicolon();
	            if (s5 !== peg$FAILED) {
	              s1 = peg$c128(s2, s4);
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }
	    if (s0 === peg$FAILED) {
	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c129) {
	        s2 = peg$c129;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c130);
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parsesemicolon();
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 === peg$FAILED) {
	        s1 = peg$currPos;
	        if (input.substr(peg$currPos, 5) === peg$c131) {
	          s2 = peg$c131;
	          peg$currPos += 5;
	        } else {
	          s2 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c132);
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parsesemicolon();
	          if (s3 !== peg$FAILED) {
	            s2 = [s2, s3];
	            s1 = s2;
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	        if (s1 === peg$FAILED) {
	          s1 = peg$currPos;
	          if (input.substr(peg$currPos, 6) === peg$c114) {
	            s2 = peg$c114;
	            peg$currPos += 6;
	          } else {
	            s2 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c115);
	            }
	          }
	          if (s2 !== peg$FAILED) {
	            s3 = peg$parsesemicolon();
	            if (s3 !== peg$FAILED) {
	              s2 = [s2, s3];
	              s1 = s2;
	            } else {
	              peg$currPos = s1;
	              s1 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	          if (s1 === peg$FAILED) {
	            s1 = peg$currPos;
	            if (input.substr(peg$currPos, 7) === peg$c133) {
	              s2 = peg$c133;
	              peg$currPos += 7;
	            } else {
	              s2 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c134);
	              }
	            }
	            if (s2 !== peg$FAILED) {
	              s3 = peg$parsesemicolon();
	              if (s3 !== peg$FAILED) {
	                s2 = [s2, s3];
	                s1 = s2;
	              } else {
	                peg$currPos = s1;
	                s1 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s1;
	              s1 = peg$FAILED;
	            }
	          }
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        s1 = peg$c135(s1);
	      }
	      s0 = s1;
	    }

	    return s0;
	  }

	  function peg$parseexpression_statement() {
	    var s0, s1, s2;

	    s0 = peg$currPos;
	    s1 = peg$parseassignment_expression();
	    if (s1 === peg$FAILED) {
	      s1 = null;
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parsesemicolon();
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c136(s1);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsesequence_expression() {
	    var s0, s1, s2, s3, s4, s5;

	    s0 = peg$currPos;
	    s1 = peg$parseassignment_expression();
	    if (s1 !== peg$FAILED) {
	      s2 = [];
	      s3 = peg$currPos;
	      s4 = peg$parsecomma();
	      if (s4 !== peg$FAILED) {
	        s5 = peg$parseassignment_expression();
	        if (s5 !== peg$FAILED) {
	          s4 = [s4, s5];
	          s3 = s4;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s3;
	        s3 = peg$FAILED;
	      }
	      while (s3 !== peg$FAILED) {
	        s2.push(s3);
	        s3 = peg$currPos;
	        s4 = peg$parsecomma();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parseassignment_expression();
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c137(s1, s2);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsedeclaration() {
	    var s0, s1, s2, s3, s4, s5, s6, s7, s8;

	    peg$silentFails++;
	    s0 = peg$currPos;
	    s1 = peg$parsefunction_prototype();
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parsesemicolon();
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c139(s1);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }
	    if (s0 === peg$FAILED) {
	      s0 = peg$currPos;
	      s1 = peg$parselocally_specified_type();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse_();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseinit_declarator_list();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parsesemicolon();
	            if (s4 !== peg$FAILED) {
	              s1 = peg$c140(s1, s3);
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        s1 = peg$c141();
	        if (s1) {
	          s1 = void 0;
	        } else {
	          s1 = peg$FAILED;
	        }
	        if (s1 !== peg$FAILED) {
	          if (input.substr(peg$currPos, 9) === peg$c142) {
	            s2 = peg$c142;
	            peg$currPos += 9;
	          } else {
	            s2 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c143);
	            }
	          }
	          if (s2 !== peg$FAILED) {
	            s3 = peg$parse_();
	            if (s3 !== peg$FAILED) {
	              s4 = peg$parseidentifier();
	              if (s4 !== peg$FAILED) {
	                s5 = [];
	                s6 = peg$currPos;
	                s7 = peg$parsecomma();
	                if (s7 !== peg$FAILED) {
	                  s8 = peg$parseidentifier();
	                  if (s8 !== peg$FAILED) {
	                    s7 = [s7, s8];
	                    s6 = s7;
	                  } else {
	                    peg$currPos = s6;
	                    s6 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s6;
	                  s6 = peg$FAILED;
	                }
	                while (s6 !== peg$FAILED) {
	                  s5.push(s6);
	                  s6 = peg$currPos;
	                  s7 = peg$parsecomma();
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$parseidentifier();
	                    if (s8 !== peg$FAILED) {
	                      s7 = [s7, s8];
	                      s6 = s7;
	                    } else {
	                      peg$currPos = s6;
	                      s6 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s6;
	                    s6 = peg$FAILED;
	                  }
	                }
	                if (s5 !== peg$FAILED) {
	                  s6 = peg$parsesemicolon();
	                  if (s6 !== peg$FAILED) {
	                    s1 = peg$c144(s4, s5);
	                    s0 = s1;
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	        if (s0 === peg$FAILED) {
	          s0 = peg$currPos;
	          if (input.substr(peg$currPos, 9) === peg$c145) {
	            s1 = peg$c145;
	            peg$currPos += 9;
	          } else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c146);
	            }
	          }
	          if (s1 !== peg$FAILED) {
	            s2 = peg$parse_();
	            if (s2 !== peg$FAILED) {
	              s3 = peg$parseprecision_qualifier();
	              if (s3 !== peg$FAILED) {
	                s4 = peg$parse_();
	                if (s4 !== peg$FAILED) {
	                  s5 = peg$parsetype_name();
	                  if (s5 !== peg$FAILED) {
	                    s6 = peg$parsesemicolon();
	                    if (s6 !== peg$FAILED) {
	                      s1 = peg$c147(s3, s5);
	                      s0 = s1;
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        }
	      }
	    }
	    peg$silentFails--;
	    if (s0 === peg$FAILED) {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c138);
	      }
	    }

	    return s0;
	  }

	  function peg$parseglobal_declaration() {
	    var s0, s1, s2, s3, s4;

	    s0 = peg$parsedeclaration();
	    if (s0 === peg$FAILED) {
	      s0 = peg$currPos;
	      s1 = peg$parsefully_specified_type();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse_();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseinit_declarator_list();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parsesemicolon();
	            if (s4 !== peg$FAILED) {
	              s1 = peg$c148(s1, s3);
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        s1 = peg$parseattribute_type();
	        if (s1 !== peg$FAILED) {
	          s2 = peg$parse_();
	          if (s2 !== peg$FAILED) {
	            s3 = peg$parsedeclarator_list_no_array();
	            if (s3 !== peg$FAILED) {
	              s4 = peg$parsesemicolon();
	              if (s4 !== peg$FAILED) {
	                s1 = peg$c148(s1, s3);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      }
	    }

	    return s0;
	  }

	  function peg$parsefunction_prototype_parameter_list() {
	    var s0, s1, s2, s3, s4, s5;

	    if (input.substr(peg$currPos, 4) === peg$c149) {
	      s0 = peg$c149;
	      peg$currPos += 4;
	    } else {
	      s0 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c150);
	      }
	    }
	    if (s0 === peg$FAILED) {
	      s0 = peg$currPos;
	      s1 = peg$parseparameter_declaration();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parsecomma();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parseparameter_declaration();
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parsecomma();
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parseparameter_declaration();
	            if (s5 !== peg$FAILED) {
	              s4 = [s4, s5];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          s1 = peg$c151(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    }

	    return s0;
	  }

	  function peg$parsefunction_prototype() {
	    var s0, s1, s2, s3, s4, s5, s6;

	    s0 = peg$currPos;
	    s1 = peg$parsevoid_type();
	    if (s1 === peg$FAILED) {
	      s1 = peg$parseprecision_type();
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parse_();
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parseidentifier();
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parseleft_paren();
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parsefunction_prototype_parameter_list();
	            if (s5 === peg$FAILED) {
	              s5 = null;
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parseright_paren();
	              if (s6 !== peg$FAILED) {
	                s1 = peg$c152(s1, s3, s5);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parseparameter_qualifier() {
	    var s0;

	    if (input.substr(peg$currPos, 5) === peg$c153) {
	      s0 = peg$c153;
	      peg$currPos += 5;
	    } else {
	      s0 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c154);
	      }
	    }
	    if (s0 === peg$FAILED) {
	      if (input.substr(peg$currPos, 2) === peg$c155) {
	        s0 = peg$c155;
	        peg$currPos += 2;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c156);
	        }
	      }
	      if (s0 === peg$FAILED) {
	        if (input.substr(peg$currPos, 3) === peg$c157) {
	          s0 = peg$c157;
	          peg$currPos += 3;
	        } else {
	          s0 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c158);
	          }
	        }
	      }
	    }

	    return s0;
	  }

	  function peg$parseparameter_declaration() {
	    var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;

	    s0 = peg$currPos;
	    s1 = peg$currPos;
	    s2 = peg$parseconst_qualifier();
	    if (s2 !== peg$FAILED) {
	      s3 = peg$parse_();
	      if (s3 !== peg$FAILED) {
	        s2 = [s2, s3];
	        s1 = s2;
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s1;
	      s1 = peg$FAILED;
	    }
	    if (s1 === peg$FAILED) {
	      s1 = null;
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = peg$currPos;
	      s3 = peg$parseparameter_qualifier();
	      if (s3 !== peg$FAILED) {
	        s4 = peg$parse_();
	        if (s4 !== peg$FAILED) {
	          s3 = [s3, s4];
	          s2 = s3;
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s2;
	        s2 = peg$FAILED;
	      }
	      if (s2 === peg$FAILED) {
	        s2 = null;
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        s4 = peg$parseprecision_qualifier();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parse_();
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 === peg$FAILED) {
	          s3 = null;
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parsetype_name();
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parse_();
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parseidentifier();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$currPos;
	                s8 = peg$parseleft_bracket();
	                if (s8 !== peg$FAILED) {
	                  s9 = peg$parseconditional_expression();
	                  if (s9 !== peg$FAILED) {
	                    s10 = peg$parseright_bracket();
	                    if (s10 !== peg$FAILED) {
	                      s8 = [s8, s9, s10];
	                      s7 = s8;
	                    } else {
	                      peg$currPos = s7;
	                      s7 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s7;
	                    s7 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s7;
	                  s7 = peg$FAILED;
	                }
	                if (s7 === peg$FAILED) {
	                  s7 = null;
	                }
	                if (s7 !== peg$FAILED) {
	                  s1 = peg$c159(s1, s2, s3, s4, s6, s7);
	                  s0 = s1;
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parseinit_declarator_list() {
	    var s0, s1, s2, s3, s4, s5;

	    s0 = peg$currPos;
	    s1 = peg$parseinit_declarator();
	    if (s1 !== peg$FAILED) {
	      s2 = [];
	      s3 = peg$currPos;
	      s4 = peg$parsecomma();
	      if (s4 !== peg$FAILED) {
	        s5 = peg$parseinit_declarator();
	        if (s5 !== peg$FAILED) {
	          s4 = [s4, s5];
	          s3 = s4;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s3;
	        s3 = peg$FAILED;
	      }
	      while (s3 !== peg$FAILED) {
	        s2.push(s3);
	        s3 = peg$currPos;
	        s4 = peg$parsecomma();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parseinit_declarator();
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c160(s1, s2);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsedeclarator_list() {
	    var s0, s1, s2, s3, s4, s5;

	    s0 = peg$currPos;
	    s1 = peg$parsedeclarator();
	    if (s1 !== peg$FAILED) {
	      s2 = [];
	      s3 = peg$currPos;
	      s4 = peg$parsecomma();
	      if (s4 !== peg$FAILED) {
	        s5 = peg$parsedeclarator();
	        if (s5 !== peg$FAILED) {
	          s4 = [s4, s5];
	          s3 = s4;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s3;
	        s3 = peg$FAILED;
	      }
	      while (s3 !== peg$FAILED) {
	        s2.push(s3);
	        s3 = peg$currPos;
	        s4 = peg$parsecomma();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parsedeclarator();
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c160(s1, s2);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsedeclarator_list_no_array() {
	    var s0, s1, s2, s3, s4, s5;

	    s0 = peg$currPos;
	    s1 = peg$parsedeclarator_no_array();
	    if (s1 !== peg$FAILED) {
	      s2 = [];
	      s3 = peg$currPos;
	      s4 = peg$parsecomma();
	      if (s4 !== peg$FAILED) {
	        s5 = peg$parsedeclarator_no_array();
	        if (s5 !== peg$FAILED) {
	          s4 = [s4, s5];
	          s3 = s4;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s3;
	        s3 = peg$FAILED;
	      }
	      while (s3 !== peg$FAILED) {
	        s2.push(s3);
	        s3 = peg$currPos;
	        s4 = peg$parsecomma();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parsedeclarator_no_array();
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c160(s1, s2);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsedeclarator_list_arrays_have_size() {
	    var s0, s1, s2, s3, s4, s5;

	    s0 = peg$currPos;
	    s1 = peg$parsedeclarator_array_with_size();
	    if (s1 !== peg$FAILED) {
	      s2 = [];
	      s3 = peg$currPos;
	      s4 = peg$parsecomma();
	      if (s4 !== peg$FAILED) {
	        s5 = peg$parsedeclarator_array_with_size();
	        if (s5 !== peg$FAILED) {
	          s4 = [s4, s5];
	          s3 = s4;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s3;
	        s3 = peg$FAILED;
	      }
	      while (s3 !== peg$FAILED) {
	        s2.push(s3);
	        s3 = peg$currPos;
	        s4 = peg$parsecomma();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parsedeclarator_array_with_size();
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c160(s1, s2);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsedeclarator_no_array() {
	    var s0, s1;

	    s0 = peg$currPos;
	    s1 = peg$parseidentifier();
	    if (s1 !== peg$FAILED) {
	      s1 = peg$c161(s1);
	    }
	    s0 = s1;

	    return s0;
	  }

	  function peg$parsedeclarator_array_with_size() {
	    var s0, s1, s2, s3, s4;

	    s0 = peg$currPos;
	    s1 = peg$parseidentifier();
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parseleft_bracket();
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parseconditional_expression();
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parseright_bracket();
	          if (s4 !== peg$FAILED) {
	            s1 = peg$c162(s1, s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }
	    if (s0 === peg$FAILED) {
	      s0 = peg$parsedeclarator_no_array();
	    }

	    return s0;
	  }

	  function peg$parsedeclarator() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    s1 = peg$parseidentifier();
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parseleft_bracket();
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parseright_bracket();
	        if (s3 !== peg$FAILED) {
	          s1 = peg$c163(s1);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }
	    if (s0 === peg$FAILED) {
	      s0 = peg$parsedeclarator_array_with_size();
	    }

	    return s0;
	  }

	  function peg$parseinit_declarator() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    s1 = peg$parseidentifier();
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parseequals();
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parseconditional_expression();
	        if (s3 !== peg$FAILED) {
	          s1 = peg$c164(s1, s3);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }
	    if (s0 === peg$FAILED) {
	      s0 = peg$parsedeclarator();
	    }

	    return s0;
	  }

	  function peg$parsemember_list() {
	    var s0, s1, s2, s3, s4, s5, s6;

	    s0 = peg$currPos;
	    s1 = [];
	    s2 = peg$currPos;
	    s3 = peg$parselocally_specified_type();
	    if (s3 !== peg$FAILED) {
	      s4 = peg$parse_();
	      if (s4 !== peg$FAILED) {
	        s5 = peg$parsedeclarator_list_arrays_have_size();
	        if (s5 !== peg$FAILED) {
	          s6 = peg$parsesemicolon();
	          if (s6 !== peg$FAILED) {
	            s3 = [s3, s4, s5, s6];
	            s2 = s3;
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s2;
	        s2 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s2;
	      s2 = peg$FAILED;
	    }
	    if (s2 !== peg$FAILED) {
	      while (s2 !== peg$FAILED) {
	        s1.push(s2);
	        s2 = peg$currPos;
	        s3 = peg$parselocally_specified_type();
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parse_();
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parsedeclarator_list_arrays_have_size();
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parsesemicolon();
	              if (s6 !== peg$FAILED) {
	                s3 = [s3, s4, s5, s6];
	                s2 = s3;
	              } else {
	                peg$currPos = s2;
	                s2 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s2;
	              s2 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	      }
	    } else {
	      s1 = peg$FAILED;
	    }
	    if (s1 !== peg$FAILED) {
	      s1 = peg$c165(s1);
	    }
	    s0 = s1;

	    return s0;
	  }

	  function peg$parsestruct_definition() {
	    var s0, s1, s2, s3, s4, s5, s6, s7, s8;

	    s0 = peg$currPos;
	    s1 = peg$currPos;
	    s2 = peg$parsetype_qualifier();
	    if (s2 === peg$FAILED) {
	      s2 = peg$parseattribute_qualifier();
	    }
	    if (s2 !== peg$FAILED) {
	      s3 = peg$parse_();
	      if (s3 !== peg$FAILED) {
	        s2 = [s2, s3];
	        s1 = s2;
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s1;
	      s1 = peg$FAILED;
	    }
	    if (s1 === peg$FAILED) {
	      s1 = null;
	    }
	    if (s1 !== peg$FAILED) {
	      if (input.substr(peg$currPos, 6) === peg$c166) {
	        s2 = peg$c166;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c167);
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        s4 = peg$parse_();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parseidentifier();
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 === peg$FAILED) {
	          s3 = null;
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parseleft_brace();
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parsemember_list();
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parseright_brace();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parsedeclarator_list();
	                if (s7 === peg$FAILED) {
	                  s7 = null;
	                }
	                if (s7 !== peg$FAILED) {
	                  s8 = peg$parsesemicolon();
	                  if (s8 !== peg$FAILED) {
	                    s1 = peg$c168(s1, s3, s5, s7);
	                    s0 = s1;
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parseprecision_type() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    s1 = peg$currPos;
	    s2 = peg$parseprecision_qualifier();
	    if (s2 !== peg$FAILED) {
	      s3 = peg$parse_();
	      if (s3 !== peg$FAILED) {
	        s2 = [s2, s3];
	        s1 = s2;
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s1;
	      s1 = peg$FAILED;
	    }
	    if (s1 === peg$FAILED) {
	      s1 = null;
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parsetype_name();
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c169(s1, s2);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parselocally_specified_type() {
	    var s0, s1, s2, s3;

	    peg$silentFails++;
	    s0 = peg$currPos;
	    s1 = peg$currPos;
	    s2 = peg$parseconst_qualifier();
	    if (s2 !== peg$FAILED) {
	      s3 = peg$parse_();
	      if (s3 !== peg$FAILED) {
	        s2 = [s2, s3];
	        s1 = s2;
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s1;
	      s1 = peg$FAILED;
	    }
	    if (s1 === peg$FAILED) {
	      s1 = null;
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parseprecision_type();
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c171(s1, s2);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }
	    peg$silentFails--;
	    if (s0 === peg$FAILED) {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c170);
	      }
	    }

	    return s0;
	  }

	  function peg$parseattribute_qualifier() {
	    var s0, s1, s2;

	    s0 = peg$currPos;
	    s1 = peg$c141();
	    if (s1) {
	      s1 = void 0;
	    } else {
	      s1 = peg$FAILED;
	    }
	    if (s1 !== peg$FAILED) {
	      if (input.substr(peg$currPos, 9) === peg$c172) {
	        s2 = peg$c172;
	        peg$currPos += 9;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c173);
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c174();
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parseattribute_type() {
	    var s0, s1, s2, s3;

	    peg$silentFails++;
	    s0 = peg$currPos;
	    s1 = peg$parseattribute_qualifier();
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parse_();
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parseprecision_type();
	        if (s3 !== peg$FAILED) {
	          s1 = peg$c175(s1, s3);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }
	    peg$silentFails--;
	    if (s0 === peg$FAILED) {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c170);
	      }
	    }

	    return s0;
	  }

	  function peg$parsefully_specified_type() {
	    var s0, s1, s2, s3;

	    peg$silentFails++;
	    s0 = peg$currPos;
	    s1 = peg$currPos;
	    s2 = peg$parsetype_qualifier();
	    if (s2 !== peg$FAILED) {
	      s3 = peg$parse_();
	      if (s3 !== peg$FAILED) {
	        s2 = [s2, s3];
	        s1 = s2;
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s1;
	      s1 = peg$FAILED;
	    }
	    if (s1 === peg$FAILED) {
	      s1 = null;
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parseprecision_type();
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c171(s1, s2);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }
	    peg$silentFails--;
	    if (s0 === peg$FAILED) {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c176);
	      }
	    }

	    return s0;
	  }

	  function peg$parseprecision_qualifier() {
	    var s0;

	    peg$silentFails++;
	    if (input.substr(peg$currPos, 5) === peg$c178) {
	      s0 = peg$c178;
	      peg$currPos += 5;
	    } else {
	      s0 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c179);
	      }
	    }
	    if (s0 === peg$FAILED) {
	      if (input.substr(peg$currPos, 7) === peg$c180) {
	        s0 = peg$c180;
	        peg$currPos += 7;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c181);
	        }
	      }
	      if (s0 === peg$FAILED) {
	        if (input.substr(peg$currPos, 4) === peg$c182) {
	          s0 = peg$c182;
	          peg$currPos += 4;
	        } else {
	          s0 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c183);
	          }
	        }
	      }
	    }
	    peg$silentFails--;
	    if (s0 === peg$FAILED) {
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c177);
	      }
	    }

	    return s0;
	  }

	  function peg$parseconst_qualifier() {
	    var s0;

	    if (input.substr(peg$currPos, 5) === peg$c184) {
	      s0 = peg$c184;
	      peg$currPos += 5;
	    } else {
	      s0 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c185);
	      }
	    }

	    return s0;
	  }

	  function peg$parsetype_qualifier() {
	    var s0, s1, s2, s3;

	    peg$silentFails++;
	    s0 = peg$parseconst_qualifier();
	    if (s0 === peg$FAILED) {
	      if (input.substr(peg$currPos, 7) === peg$c187) {
	        s0 = peg$c187;
	        peg$currPos += 7;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c188);
	        }
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        if (input.substr(peg$currPos, 9) === peg$c142) {
	          s1 = peg$c142;
	          peg$currPos += 9;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c143);
	          }
	        }
	        if (s1 !== peg$FAILED) {
	          s2 = peg$parse_();
	          if (s2 !== peg$FAILED) {
	            if (input.substr(peg$currPos, 7) === peg$c187) {
	              s3 = peg$c187;
	              peg$currPos += 7;
	            } else {
	              s3 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c188);
	              }
	            }
	            if (s3 !== peg$FAILED) {
	              s1 = peg$c189();
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	        if (s0 === peg$FAILED) {
	          if (input.substr(peg$currPos, 7) === peg$c190) {
	            s0 = peg$c190;
	            peg$currPos += 7;
	          } else {
	            s0 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c191);
	            }
	          }
	        }
	      }
	    }
	    peg$silentFails--;
	    if (s0 === peg$FAILED) {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c186);
	      }
	    }

	    return s0;
	  }

	  function peg$parsevoid_type() {
	    var s0, s1;

	    peg$silentFails++;
	    s0 = peg$currPos;
	    if (input.substr(peg$currPos, 4) === peg$c149) {
	      s1 = peg$c149;
	      peg$currPos += 4;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c150);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s1 = peg$c193();
	    }
	    s0 = s1;
	    peg$silentFails--;
	    if (s0 === peg$FAILED) {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c192);
	      }
	    }

	    return s0;
	  }

	  function peg$parsetype_name() {
	    var s0, s1;

	    peg$silentFails++;
	    if (input.substr(peg$currPos, 5) === peg$c195) {
	      s0 = peg$c195;
	      peg$currPos += 5;
	    } else {
	      s0 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c196);
	      }
	    }
	    if (s0 === peg$FAILED) {
	      if (input.substr(peg$currPos, 6) === peg$c197) {
	        s0 = peg$c197;
	        peg$currPos += 6;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c198);
	        }
	      }
	      if (s0 === peg$FAILED) {
	        if (input.substr(peg$currPos, 3) === peg$c199) {
	          s0 = peg$c199;
	          peg$currPos += 3;
	        } else {
	          s0 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c200);
	          }
	        }
	        if (s0 === peg$FAILED) {
	          if (input.substr(peg$currPos, 4) === peg$c201) {
	            s0 = peg$c201;
	            peg$currPos += 4;
	          } else {
	            s0 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c202);
	            }
	          }
	          if (s0 === peg$FAILED) {
	            if (input.substr(peg$currPos, 4) === peg$c203) {
	              s0 = peg$c203;
	              peg$currPos += 4;
	            } else {
	              s0 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c204);
	              }
	            }
	            if (s0 === peg$FAILED) {
	              s0 = peg$parsesampler_buffer();
	              if (s0 === peg$FAILED) {
	                s0 = peg$parsesampler_rect();
	                if (s0 === peg$FAILED) {
	                  s0 = peg$parsesampler_ms();
	                  if (s0 === peg$FAILED) {
	                    s0 = peg$parsesampler();
	                    if (s0 === peg$FAILED) {
	                      s0 = peg$parsesampler_cube();
	                      if (s0 === peg$FAILED) {
	                        s0 = peg$parsevector();
	                        if (s0 === peg$FAILED) {
	                          s0 = peg$parsematrix();
	                          if (s0 === peg$FAILED) {
	                            s0 = peg$currPos;
	                            s1 = peg$parseidentifier();
	                            if (s1 !== peg$FAILED) {
	                              s1 = peg$c205(s1);
	                            }
	                            s0 = s1;
	                          }
	                        }
	                      }
	                    }
	                  }
	                }
	              }
	            }
	          }
	        }
	      }
	    }
	    peg$silentFails--;
	    if (s0 === peg$FAILED) {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c194);
	      }
	    }

	    return s0;
	  }

	  function peg$parseidentifier() {
	    var s0, s1, s2, s3, s4;

	    peg$silentFails++;
	    s0 = peg$currPos;
	    s1 = peg$currPos;
	    peg$silentFails++;
	    s2 = peg$currPos;
	    s3 = peg$parsekeyword();
	    if (s3 !== peg$FAILED) {
	      if (peg$c207.test(input.charAt(peg$currPos))) {
	        s4 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s4 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c208);
	        }
	      }
	      if (s4 !== peg$FAILED) {
	        s3 = [s3, s4];
	        s2 = s3;
	      } else {
	        peg$currPos = s2;
	        s2 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s2;
	      s2 = peg$FAILED;
	    }
	    peg$silentFails--;
	    if (s2 === peg$FAILED) {
	      s1 = void 0;
	    } else {
	      peg$currPos = s1;
	      s1 = peg$FAILED;
	    }
	    if (s1 !== peg$FAILED) {
	      if (peg$c209.test(input.charAt(peg$currPos))) {
	        s2 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c210);
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = [];
	        if (peg$c211.test(input.charAt(peg$currPos))) {
	          s4 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s4 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c212);
	          }
	        }
	        while (s4 !== peg$FAILED) {
	          s3.push(s4);
	          if (peg$c211.test(input.charAt(peg$currPos))) {
	            s4 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c212);
	            }
	          }
	        }
	        if (s3 !== peg$FAILED) {
	          s1 = peg$c64(s2, s3);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }
	    peg$silentFails--;
	    if (s0 === peg$FAILED) {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c206);
	      }
	    }

	    return s0;
	  }

	  function peg$parsekeyword() {
	    var s0;

	    peg$silentFails++;
	    if (input.substr(peg$currPos, 4) === peg$c203) {
	      s0 = peg$c203;
	      peg$currPos += 4;
	    } else {
	      s0 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c204);
	      }
	    }
	    if (s0 === peg$FAILED) {
	      if (input.substr(peg$currPos, 5) === peg$c195) {
	        s0 = peg$c195;
	        peg$currPos += 5;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c196);
	        }
	      }
	      if (s0 === peg$FAILED) {
	        if (input.substr(peg$currPos, 6) === peg$c197) {
	          s0 = peg$c197;
	          peg$currPos += 6;
	        } else {
	          s0 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c198);
	          }
	        }
	        if (s0 === peg$FAILED) {
	          if (input.substr(peg$currPos, 3) === peg$c199) {
	            s0 = peg$c199;
	            peg$currPos += 3;
	          } else {
	            s0 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c200);
	            }
	          }
	          if (s0 === peg$FAILED) {
	            if (input.substr(peg$currPos, 4) === peg$c201) {
	              s0 = peg$c201;
	              peg$currPos += 4;
	            } else {
	              s0 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c202);
	              }
	            }
	            if (s0 === peg$FAILED) {
	              s0 = peg$parsesampler_buffer();
	              if (s0 === peg$FAILED) {
	                s0 = peg$parsesampler_rect();
	                if (s0 === peg$FAILED) {
	                  s0 = peg$parsesampler_ms();
	                  if (s0 === peg$FAILED) {
	                    s0 = peg$parsesampler();
	                    if (s0 === peg$FAILED) {
	                      s0 = peg$parsesampler_cube();
	                      if (s0 === peg$FAILED) {
	                        s0 = peg$parsevector();
	                        if (s0 === peg$FAILED) {
	                          s0 = peg$parsematrix();
	                          if (s0 === peg$FAILED) {
	                            if (input.substr(peg$currPos, 5) === peg$c131) {
	                              s0 = peg$c131;
	                              peg$currPos += 5;
	                            } else {
	                              s0 = peg$FAILED;
	                              if (peg$silentFails === 0) {
	                                peg$fail(peg$c132);
	                              }
	                            }
	                            if (s0 === peg$FAILED) {
	                              if (input.substr(peg$currPos, 8) === peg$c129) {
	                                s0 = peg$c129;
	                                peg$currPos += 8;
	                              } else {
	                                s0 = peg$FAILED;
	                                if (peg$silentFails === 0) {
	                                  peg$fail(peg$c130);
	                                }
	                              }
	                              if (s0 === peg$FAILED) {
	                                if (input.substr(peg$currPos, 2) === peg$c111) {
	                                  s0 = peg$c111;
	                                  peg$currPos += 2;
	                                } else {
	                                  s0 = peg$FAILED;
	                                  if (peg$silentFails === 0) {
	                                    peg$fail(peg$c112);
	                                  }
	                                }
	                                if (s0 === peg$FAILED) {
	                                  if (input.substr(peg$currPos, 4) === peg$c93) {
	                                    s0 = peg$c93;
	                                    peg$currPos += 4;
	                                  } else {
	                                    s0 = peg$FAILED;
	                                    if (peg$silentFails === 0) {
	                                      peg$fail(peg$c94);
	                                    }
	                                  }
	                                  if (s0 === peg$FAILED) {
	                                    if (input.substr(peg$currPos, 3) === peg$c104) {
	                                      s0 = peg$c104;
	                                      peg$currPos += 3;
	                                    } else {
	                                      s0 = peg$FAILED;
	                                      if (peg$silentFails === 0) {
	                                        peg$fail(peg$c105);
	                                      }
	                                    }
	                                    if (s0 === peg$FAILED) {
	                                      if (input.substr(peg$currPos, 2) === peg$c86) {
	                                        s0 = peg$c86;
	                                        peg$currPos += 2;
	                                      } else {
	                                        s0 = peg$FAILED;
	                                        if (peg$silentFails === 0) {
	                                          peg$fail(peg$c87);
	                                        }
	                                      }
	                                      if (s0 === peg$FAILED) {
	                                        if (input.substr(peg$currPos, 7) === peg$c133) {
	                                          s0 = peg$c133;
	                                          peg$currPos += 7;
	                                        } else {
	                                          s0 = peg$FAILED;
	                                          if (peg$silentFails === 0) {
	                                            peg$fail(peg$c134);
	                                          }
	                                        }
	                                        if (s0 === peg$FAILED) {
	                                          if (input.substr(peg$currPos, 6) === peg$c114) {
	                                            s0 = peg$c114;
	                                            peg$currPos += 6;
	                                          } else {
	                                            s0 = peg$FAILED;
	                                            if (peg$silentFails === 0) {
	                                              peg$fail(peg$c115);
	                                            }
	                                          }
	                                          if (s0 === peg$FAILED) {
	                                            if (input.substr(peg$currPos, 9) === peg$c172) {
	                                              s0 = peg$c172;
	                                              peg$currPos += 9;
	                                            } else {
	                                              s0 = peg$FAILED;
	                                              if (peg$silentFails === 0) {
	                                                peg$fail(peg$c173);
	                                              }
	                                            }
	                                            if (s0 === peg$FAILED) {
	                                              if (input.substr(peg$currPos, 5) === peg$c184) {
	                                                s0 = peg$c184;
	                                                peg$currPos += 5;
	                                              } else {
	                                                s0 = peg$FAILED;
	                                                if (peg$silentFails === 0) {
	                                                  peg$fail(peg$c185);
	                                                }
	                                              }
	                                              if (s0 === peg$FAILED) {
	                                                if (input.substr(peg$currPos, 2) === peg$c155) {
	                                                  s0 = peg$c155;
	                                                  peg$currPos += 2;
	                                                } else {
	                                                  s0 = peg$FAILED;
	                                                  if (peg$silentFails === 0) {
	                                                    peg$fail(peg$c156);
	                                                  }
	                                                }
	                                                if (s0 === peg$FAILED) {
	                                                  if (input.substr(peg$currPos, 3) === peg$c157) {
	                                                    s0 = peg$c157;
	                                                    peg$currPos += 3;
	                                                  } else {
	                                                    s0 = peg$FAILED;
	                                                    if (peg$silentFails === 0) {
	                                                      peg$fail(peg$c158);
	                                                    }
	                                                  }
	                                                  if (s0 === peg$FAILED) {
	                                                    if (input.substr(peg$currPos, 5) === peg$c153) {
	                                                      s0 = peg$c153;
	                                                      peg$currPos += 5;
	                                                    } else {
	                                                      s0 = peg$FAILED;
	                                                      if (peg$silentFails === 0) {
	                                                        peg$fail(peg$c154);
	                                                      }
	                                                    }
	                                                    if (s0 === peg$FAILED) {
	                                                      if (input.substr(peg$currPos, 7) === peg$c190) {
	                                                        s0 = peg$c190;
	                                                        peg$currPos += 7;
	                                                      } else {
	                                                        s0 = peg$FAILED;
	                                                        if (peg$silentFails === 0) {
	                                                          peg$fail(peg$c191);
	                                                        }
	                                                      }
	                                                      if (s0 === peg$FAILED) {
	                                                        if (input.substr(peg$currPos, 7) === peg$c187) {
	                                                          s0 = peg$c187;
	                                                          peg$currPos += 7;
	                                                        } else {
	                                                          s0 = peg$FAILED;
	                                                          if (peg$silentFails === 0) {
	                                                            peg$fail(peg$c188);
	                                                          }
	                                                        }
	                                                        if (s0 === peg$FAILED) {
	                                                          if (input.substr(peg$currPos, 9) === peg$c214) {
	                                                            s0 = peg$c214;
	                                                            peg$currPos += 9;
	                                                          } else {
	                                                            s0 = peg$FAILED;
	                                                            if (peg$silentFails === 0) {
	                                                              peg$fail(peg$c215);
	                                                            }
	                                                          }
	                                                          if (s0 === peg$FAILED) {
	                                                            if (input.substr(peg$currPos, 11) === peg$c216) {
	                                                              s0 = peg$c216;
	                                                              peg$currPos += 11;
	                                                            } else {
	                                                              s0 = peg$FAILED;
	                                                              if (peg$silentFails === 0) {
	                                                                peg$fail(peg$c217);
	                                                              }
	                                                            }
	                                                            if (s0 === peg$FAILED) {
	                                                              if (input.substr(peg$currPos, 6) === peg$c166) {
	                                                                s0 = peg$c166;
	                                                                peg$currPos += 6;
	                                                              } else {
	                                                                s0 = peg$FAILED;
	                                                                if (peg$silentFails === 0) {
	                                                                  peg$fail(peg$c167);
	                                                                }
	                                                              }
	                                                              if (s0 === peg$FAILED) {
	                                                                if (input.substr(peg$currPos, 4) === peg$c149) {
	                                                                  s0 = peg$c149;
	                                                                  peg$currPos += 4;
	                                                                } else {
	                                                                  s0 = peg$FAILED;
	                                                                  if (peg$silentFails === 0) {
	                                                                    peg$fail(peg$c150);
	                                                                  }
	                                                                }
	                                                                if (s0 === peg$FAILED) {
	                                                                  if (input.substr(peg$currPos, 5) === peg$c107) {
	                                                                    s0 = peg$c107;
	                                                                    peg$currPos += 5;
	                                                                  } else {
	                                                                    s0 = peg$FAILED;
	                                                                    if (peg$silentFails === 0) {
	                                                                      peg$fail(peg$c108);
	                                                                    }
	                                                                  }
	                                                                  if (s0 === peg$FAILED) {
	                                                                    if (input.substr(peg$currPos, 5) === peg$c178) {
	                                                                      s0 = peg$c178;
	                                                                      peg$currPos += 5;
	                                                                    } else {
	                                                                      s0 = peg$FAILED;
	                                                                      if (peg$silentFails === 0) {
	                                                                        peg$fail(peg$c179);
	                                                                      }
	                                                                    }
	                                                                    if (s0 === peg$FAILED) {
	                                                                      if (input.substr(peg$currPos, 7) === peg$c180) {
	                                                                        s0 = peg$c180;
	                                                                        peg$currPos += 7;
	                                                                      } else {
	                                                                        s0 = peg$FAILED;
	                                                                        if (peg$silentFails === 0) {
	                                                                          peg$fail(peg$c181);
	                                                                        }
	                                                                      }
	                                                                      if (s0 === peg$FAILED) {
	                                                                        if (input.substr(peg$currPos, 4) === peg$c182) {
	                                                                          s0 = peg$c182;
	                                                                          peg$currPos += 4;
	                                                                        } else {
	                                                                          s0 = peg$FAILED;
	                                                                          if (peg$silentFails === 0) {
	                                                                            peg$fail(peg$c183);
	                                                                          }
	                                                                        }
	                                                                        if (s0 === peg$FAILED) {
	                                                                          if (input.substr(peg$currPos, 4) === peg$c218) {
	                                                                            s0 = peg$c218;
	                                                                            peg$currPos += 4;
	                                                                          } else {
	                                                                            s0 = peg$FAILED;
	                                                                            if (peg$silentFails === 0) {
	                                                                              peg$fail(peg$c219);
	                                                                            }
	                                                                          }
	                                                                          if (s0 === peg$FAILED) {
	                                                                            if (input.substr(peg$currPos, 5) === peg$c220) {
	                                                                              s0 = peg$c220;
	                                                                              peg$currPos += 5;
	                                                                            } else {
	                                                                              s0 = peg$FAILED;
	                                                                              if (peg$silentFails === 0) {
	                                                                                peg$fail(peg$c221);
	                                                                              }
	                                                                            }
	                                                                          }
	                                                                        }
	                                                                      }
	                                                                    }
	                                                                  }
	                                                                }
	                                                              }
	                                                            }
	                                                          }
	                                                        }
	                                                      }
	                                                    }
	                                                  }
	                                                }
	                                              }
	                                            }
	                                          }
	                                        }
	                                      }
	                                    }
	                                  }
	                                }
	                              }
	                            }
	                          }
	                        }
	                      }
	                    }
	                  }
	                }
	              }
	            }
	          }
	        }
	      }
	    }
	    peg$silentFails--;
	    if (s0 === peg$FAILED) {
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c213);
	      }
	    }

	    return s0;
	  }

	  function peg$parsevector() {
	    var s0, s1, s2, s3, s4;

	    s0 = peg$currPos;
	    s1 = peg$currPos;
	    if (peg$c222.test(input.charAt(peg$currPos))) {
	      s2 = input.charAt(peg$currPos);
	      peg$currPos++;
	    } else {
	      s2 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c223);
	      }
	    }
	    if (s2 === peg$FAILED) {
	      s2 = null;
	    }
	    if (s2 !== peg$FAILED) {
	      if (input.substr(peg$currPos, 3) === peg$c224) {
	        s3 = peg$c224;
	        peg$currPos += 3;
	      } else {
	        s3 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c225);
	        }
	      }
	      if (s3 !== peg$FAILED) {
	        if (peg$c226.test(input.charAt(peg$currPos))) {
	          s4 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s4 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c227);
	          }
	        }
	        if (s4 !== peg$FAILED) {
	          s2 = [s2, s3, s4];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s1;
	      s1 = peg$FAILED;
	    }
	    if (s1 !== peg$FAILED) {
	      s1 = peg$c228(s1);
	    }
	    s0 = s1;

	    return s0;
	  }

	  function peg$parsematrix() {
	    var s0, s1, s2, s3, s4, s5, s6, s7, s8;

	    s0 = peg$currPos;
	    s1 = peg$currPos;
	    if (peg$c229.test(input.charAt(peg$currPos))) {
	      s2 = input.charAt(peg$currPos);
	      peg$currPos++;
	    } else {
	      s2 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c230);
	      }
	    }
	    if (s2 === peg$FAILED) {
	      s2 = null;
	    }
	    if (s2 !== peg$FAILED) {
	      if (input.substr(peg$currPos, 3) === peg$c231) {
	        s3 = peg$c231;
	        peg$currPos += 3;
	      } else {
	        s3 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c232);
	        }
	      }
	      if (s3 !== peg$FAILED) {
	        if (peg$c226.test(input.charAt(peg$currPos))) {
	          s4 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s4 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c227);
	          }
	        }
	        if (s4 !== peg$FAILED) {
	          s5 = peg$currPos;
	          s6 = peg$currPos;
	          if (peg$c233.test(input.charAt(peg$currPos))) {
	            s7 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s7 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c234);
	            }
	          }
	          if (s7 !== peg$FAILED) {
	            if (peg$c226.test(input.charAt(peg$currPos))) {
	              s8 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s8 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c227);
	              }
	            }
	            if (s8 !== peg$FAILED) {
	              s7 = [s7, s8];
	              s6 = s7;
	            } else {
	              peg$currPos = s6;
	              s6 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s6;
	            s6 = peg$FAILED;
	          }
	          if (s6 === peg$FAILED) {
	            s6 = null;
	          }
	          if (s6 !== peg$FAILED) {
	            s5 = input.substring(s5, peg$currPos);
	          } else {
	            s5 = s6;
	          }
	          if (s5 !== peg$FAILED) {
	            s2 = [s2, s3, s4, s5];
	            s1 = s2;
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s1;
	      s1 = peg$FAILED;
	    }
	    if (s1 !== peg$FAILED) {
	      s1 = peg$c228(s1);
	    }
	    s0 = s1;

	    return s0;
	  }

	  function peg$parsesampler() {
	    var s0, s1, s2, s3, s4, s5, s6, s7;

	    s0 = peg$currPos;
	    s1 = peg$currPos;
	    if (peg$c235.test(input.charAt(peg$currPos))) {
	      s2 = input.charAt(peg$currPos);
	      peg$currPos++;
	    } else {
	      s2 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c236);
	      }
	    }
	    if (s2 === peg$FAILED) {
	      s2 = null;
	    }
	    if (s2 !== peg$FAILED) {
	      if (input.substr(peg$currPos, 7) === peg$c237) {
	        s3 = peg$c237;
	        peg$currPos += 7;
	      } else {
	        s3 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c238);
	        }
	      }
	      if (s3 !== peg$FAILED) {
	        if (peg$c239.test(input.charAt(peg$currPos))) {
	          s4 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s4 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c240);
	          }
	        }
	        if (s4 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 68) {
	            s5 = peg$c241;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c242);
	            }
	          }
	          if (s5 !== peg$FAILED) {
	            if (input.substr(peg$currPos, 5) === peg$c243) {
	              s6 = peg$c243;
	              peg$currPos += 5;
	            } else {
	              s6 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c244);
	              }
	            }
	            if (s6 === peg$FAILED) {
	              s6 = null;
	            }
	            if (s6 !== peg$FAILED) {
	              if (input.substr(peg$currPos, 6) === peg$c245) {
	                s7 = peg$c245;
	                peg$currPos += 6;
	              } else {
	                s7 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                  peg$fail(peg$c246);
	                }
	              }
	              if (s7 === peg$FAILED) {
	                s7 = null;
	              }
	              if (s7 !== peg$FAILED) {
	                s2 = [s2, s3, s4, s5, s6, s7];
	                s1 = s2;
	              } else {
	                peg$currPos = s1;
	                s1 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s1;
	              s1 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s1;
	      s1 = peg$FAILED;
	    }
	    if (s1 !== peg$FAILED) {
	      s1 = peg$c228(s1);
	    }
	    s0 = s1;

	    return s0;
	  }

	  function peg$parsesampler_cube() {
	    var s0, s1, s2, s3, s4, s5;

	    s0 = peg$currPos;
	    s1 = peg$currPos;
	    if (peg$c235.test(input.charAt(peg$currPos))) {
	      s2 = input.charAt(peg$currPos);
	      peg$currPos++;
	    } else {
	      s2 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c236);
	      }
	    }
	    if (s2 === peg$FAILED) {
	      s2 = null;
	    }
	    if (s2 !== peg$FAILED) {
	      if (input.substr(peg$currPos, 11) === peg$c216) {
	        s3 = peg$c216;
	        peg$currPos += 11;
	      } else {
	        s3 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c217);
	        }
	      }
	      if (s3 !== peg$FAILED) {
	        if (input.substr(peg$currPos, 5) === peg$c243) {
	          s4 = peg$c243;
	          peg$currPos += 5;
	        } else {
	          s4 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c244);
	          }
	        }
	        if (s4 === peg$FAILED) {
	          s4 = null;
	        }
	        if (s4 !== peg$FAILED) {
	          if (input.substr(peg$currPos, 6) === peg$c245) {
	            s5 = peg$c245;
	            peg$currPos += 6;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c246);
	            }
	          }
	          if (s5 === peg$FAILED) {
	            s5 = null;
	          }
	          if (s5 !== peg$FAILED) {
	            s2 = [s2, s3, s4, s5];
	            s1 = s2;
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s1;
	      s1 = peg$FAILED;
	    }
	    if (s1 !== peg$FAILED) {
	      s1 = peg$c228(s1);
	    }
	    s0 = s1;

	    return s0;
	  }

	  function peg$parsesampler_rect() {
	    var s0, s1, s2, s3, s4;

	    s0 = peg$currPos;
	    s1 = peg$currPos;
	    if (peg$c235.test(input.charAt(peg$currPos))) {
	      s2 = input.charAt(peg$currPos);
	      peg$currPos++;
	    } else {
	      s2 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c236);
	      }
	    }
	    if (s2 === peg$FAILED) {
	      s2 = null;
	    }
	    if (s2 !== peg$FAILED) {
	      if (input.substr(peg$currPos, 13) === peg$c247) {
	        s3 = peg$c247;
	        peg$currPos += 13;
	      } else {
	        s3 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c248);
	        }
	      }
	      if (s3 !== peg$FAILED) {
	        if (input.substr(peg$currPos, 6) === peg$c245) {
	          s4 = peg$c245;
	          peg$currPos += 6;
	        } else {
	          s4 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c246);
	          }
	        }
	        if (s4 === peg$FAILED) {
	          s4 = null;
	        }
	        if (s4 !== peg$FAILED) {
	          s2 = [s2, s3, s4];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s1;
	      s1 = peg$FAILED;
	    }
	    if (s1 !== peg$FAILED) {
	      s1 = peg$c228(s1);
	    }
	    s0 = s1;

	    return s0;
	  }

	  function peg$parsesampler_ms() {
	    var s0, s1, s2, s3, s4;

	    s0 = peg$currPos;
	    s1 = peg$currPos;
	    if (peg$c235.test(input.charAt(peg$currPos))) {
	      s2 = input.charAt(peg$currPos);
	      peg$currPos++;
	    } else {
	      s2 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c236);
	      }
	    }
	    if (s2 === peg$FAILED) {
	      s2 = null;
	    }
	    if (s2 !== peg$FAILED) {
	      if (input.substr(peg$currPos, 11) === peg$c249) {
	        s3 = peg$c249;
	        peg$currPos += 11;
	      } else {
	        s3 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c250);
	        }
	      }
	      if (s3 !== peg$FAILED) {
	        if (input.substr(peg$currPos, 5) === peg$c243) {
	          s4 = peg$c243;
	          peg$currPos += 5;
	        } else {
	          s4 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c244);
	          }
	        }
	        if (s4 === peg$FAILED) {
	          s4 = null;
	        }
	        if (s4 !== peg$FAILED) {
	          s2 = [s2, s3, s4];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s1;
	      s1 = peg$FAILED;
	    }
	    if (s1 !== peg$FAILED) {
	      s1 = peg$c228(s1);
	    }
	    s0 = s1;

	    return s0;
	  }

	  function peg$parsesampler_buffer() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    s1 = peg$currPos;
	    if (peg$c235.test(input.charAt(peg$currPos))) {
	      s2 = input.charAt(peg$currPos);
	      peg$currPos++;
	    } else {
	      s2 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c236);
	      }
	    }
	    if (s2 === peg$FAILED) {
	      s2 = null;
	    }
	    if (s2 !== peg$FAILED) {
	      if (input.substr(peg$currPos, 13) === peg$c251) {
	        s3 = peg$c251;
	        peg$currPos += 13;
	      } else {
	        s3 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c252);
	        }
	      }
	      if (s3 !== peg$FAILED) {
	        s2 = [s2, s3];
	        s1 = s2;
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s1;
	      s1 = peg$FAILED;
	    }
	    if (s1 !== peg$FAILED) {
	      s1 = peg$c228(s1);
	    }
	    s0 = s1;

	    return s0;
	  }

	  function peg$parseint_constant() {
	    var s0, s1, s2, s3, s4;

	    s0 = peg$currPos;
	    if (peg$c260.test(input.charAt(peg$currPos))) {
	      s1 = input.charAt(peg$currPos);
	      peg$currPos++;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c261);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = [];
	      if (peg$c262.test(input.charAt(peg$currPos))) {
	        s3 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s3 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c263);
	        }
	      }
	      while (s3 !== peg$FAILED) {
	        s2.push(s3);
	        if (peg$c262.test(input.charAt(peg$currPos))) {
	          s3 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c263);
	          }
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        if (peg$c264.test(input.charAt(peg$currPos))) {
	          s3 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c265);
	          }
	        }
	        if (s3 === peg$FAILED) {
	          s3 = null;
	        }
	        if (s3 !== peg$FAILED) {
	          s1 = peg$c266(s1, s2, s3);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }
	    if (s0 === peg$FAILED) {
	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 48) {
	        s1 = peg$c267;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c268);
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        if (peg$c269.test(input.charAt(peg$currPos))) {
	          s2 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s2 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c270);
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          s3 = [];
	          if (peg$c271.test(input.charAt(peg$currPos))) {
	            s4 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c272);
	            }
	          }
	          if (s4 !== peg$FAILED) {
	            while (s4 !== peg$FAILED) {
	              s3.push(s4);
	              if (peg$c271.test(input.charAt(peg$currPos))) {
	                s4 = input.charAt(peg$currPos);
	                peg$currPos++;
	              } else {
	                s4 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                  peg$fail(peg$c272);
	                }
	              }
	            }
	          } else {
	            s3 = peg$FAILED;
	          }
	          if (s3 !== peg$FAILED) {
	            if (peg$c264.test(input.charAt(peg$currPos))) {
	              s4 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s4 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c265);
	              }
	            }
	            if (s4 === peg$FAILED) {
	              s4 = null;
	            }
	            if (s4 !== peg$FAILED) {
	              s1 = peg$c273(s3, s4);
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 48) {
	          s1 = peg$c267;
	          peg$currPos++;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c268);
	          }
	        }
	        if (s1 !== peg$FAILED) {
	          s2 = [];
	          if (peg$c274.test(input.charAt(peg$currPos))) {
	            s3 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c275);
	            }
	          }
	          if (s3 !== peg$FAILED) {
	            while (s3 !== peg$FAILED) {
	              s2.push(s3);
	              if (peg$c274.test(input.charAt(peg$currPos))) {
	                s3 = input.charAt(peg$currPos);
	                peg$currPos++;
	              } else {
	                s3 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                  peg$fail(peg$c275);
	                }
	              }
	            }
	          } else {
	            s2 = peg$FAILED;
	          }
	          if (s2 !== peg$FAILED) {
	            if (peg$c264.test(input.charAt(peg$currPos))) {
	              s3 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s3 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c265);
	              }
	            }
	            if (s3 === peg$FAILED) {
	              s3 = null;
	            }
	            if (s3 !== peg$FAILED) {
	              s1 = peg$c276(s2, s3);
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	        if (s0 === peg$FAILED) {
	          s0 = peg$currPos;
	          if (input.charCodeAt(peg$currPos) === 48) {
	            s1 = peg$c267;
	            peg$currPos++;
	          } else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c268);
	            }
	          }
	          if (s1 !== peg$FAILED) {
	            if (peg$c264.test(input.charAt(peg$currPos))) {
	              s2 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s2 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c265);
	              }
	            }
	            if (s2 === peg$FAILED) {
	              s2 = null;
	            }
	            if (s2 !== peg$FAILED) {
	              s1 = peg$c277(s2);
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        }
	      }
	    }

	    return s0;
	  }

	  function peg$parsefloat_constant() {
	    var s0, s1, s2, s3, s4, s5;

	    s0 = peg$currPos;
	    s1 = peg$currPos;
	    s2 = [];
	    if (peg$c278.test(input.charAt(peg$currPos))) {
	      s3 = input.charAt(peg$currPos);
	      peg$currPos++;
	    } else {
	      s3 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c279);
	      }
	    }
	    while (s3 !== peg$FAILED) {
	      s2.push(s3);
	      if (peg$c278.test(input.charAt(peg$currPos))) {
	        s3 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s3 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c279);
	        }
	      }
	    }
	    if (s2 !== peg$FAILED) {
	      if (input.charCodeAt(peg$currPos) === 46) {
	        s3 = peg$c280;
	        peg$currPos++;
	      } else {
	        s3 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c281);
	        }
	      }
	      if (s3 !== peg$FAILED) {
	        s4 = [];
	        if (peg$c262.test(input.charAt(peg$currPos))) {
	          s5 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s5 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c263);
	          }
	        }
	        if (s5 !== peg$FAILED) {
	          while (s5 !== peg$FAILED) {
	            s4.push(s5);
	            if (peg$c262.test(input.charAt(peg$currPos))) {
	              s5 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c263);
	              }
	            }
	          }
	        } else {
	          s4 = peg$FAILED;
	        }
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parsefloat_exponent();
	          if (s5 === peg$FAILED) {
	            s5 = null;
	          }
	          if (s5 !== peg$FAILED) {
	            s2 = [s2, s3, s4, s5];
	            s1 = s2;
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s1;
	      s1 = peg$FAILED;
	    }
	    if (s1 === peg$FAILED) {
	      s1 = peg$currPos;
	      s2 = [];
	      if (peg$c262.test(input.charAt(peg$currPos))) {
	        s3 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s3 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c263);
	        }
	      }
	      if (s3 !== peg$FAILED) {
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          if (peg$c262.test(input.charAt(peg$currPos))) {
	            s3 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c263);
	            }
	          }
	        }
	      } else {
	        s2 = peg$FAILED;
	      }
	      if (s2 !== peg$FAILED) {
	        if (input.charCodeAt(peg$currPos) === 46) {
	          s3 = peg$c280;
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c281);
	          }
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = [];
	          if (peg$c262.test(input.charAt(peg$currPos))) {
	            s5 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c263);
	            }
	          }
	          while (s5 !== peg$FAILED) {
	            s4.push(s5);
	            if (peg$c262.test(input.charAt(peg$currPos))) {
	              s5 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c263);
	              }
	            }
	          }
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parsefloat_exponent();
	            if (s5 === peg$FAILED) {
	              s5 = null;
	            }
	            if (s5 !== peg$FAILED) {
	              s2 = [s2, s3, s4, s5];
	              s1 = s2;
	            } else {
	              peg$currPos = s1;
	              s1 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      if (peg$c282.test(input.charAt(peg$currPos))) {
	        s2 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c283);
	        }
	      }
	      if (s2 === peg$FAILED) {
	        if (input.substr(peg$currPos, 2) === peg$c284) {
	          s2 = peg$c284;
	          peg$currPos += 2;
	        } else {
	          s2 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c285);
	          }
	        }
	        if (s2 === peg$FAILED) {
	          if (input.substr(peg$currPos, 2) === peg$c286) {
	            s2 = peg$c286;
	            peg$currPos += 2;
	          } else {
	            s2 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c287);
	            }
	          }
	        }
	      }
	      if (s2 === peg$FAILED) {
	        s2 = null;
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c288(s1, s2);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }
	    if (s0 === peg$FAILED) {
	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      s2 = [];
	      if (peg$c278.test(input.charAt(peg$currPos))) {
	        s3 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s3 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c279);
	        }
	      }
	      if (s3 !== peg$FAILED) {
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          if (peg$c278.test(input.charAt(peg$currPos))) {
	            s3 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c279);
	            }
	          }
	        }
	      } else {
	        s2 = peg$FAILED;
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parsefloat_exponent();
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        if (peg$c289.test(input.charAt(peg$currPos))) {
	          s2 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s2 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c290);
	          }
	        }
	        if (s2 === peg$FAILED) {
	          s2 = null;
	        }
	        if (s2 !== peg$FAILED) {
	          s1 = peg$c291(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    }

	    return s0;
	  }

	  function peg$parsefloat_exponent() {
	    var s0, s1, s2, s3, s4;

	    s0 = peg$currPos;
	    if (peg$c292.test(input.charAt(peg$currPos))) {
	      s1 = input.charAt(peg$currPos);
	      peg$currPos++;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c293);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      if (peg$c294.test(input.charAt(peg$currPos))) {
	        s2 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c295);
	        }
	      }
	      if (s2 === peg$FAILED) {
	        s2 = null;
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = [];
	        if (peg$c262.test(input.charAt(peg$currPos))) {
	          s4 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s4 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c263);
	          }
	        }
	        if (s4 !== peg$FAILED) {
	          while (s4 !== peg$FAILED) {
	            s3.push(s4);
	            if (peg$c262.test(input.charAt(peg$currPos))) {
	              s4 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s4 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c263);
	              }
	            }
	          }
	        } else {
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s1 = peg$c296(s2, s3);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parseparen_expression() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    s1 = peg$parseleft_paren();
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parseassignment_expression();
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parseright_paren();
	        if (s3 !== peg$FAILED) {
	          s1 = peg$c297(s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsebool_constant() {
	    var s0, s1;

	    s0 = peg$currPos;
	    if (input.substr(peg$currPos, 4) === peg$c218) {
	      s1 = peg$c218;
	      peg$currPos += 4;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c219);
	      }
	    }
	    if (s1 === peg$FAILED) {
	      if (input.substr(peg$currPos, 5) === peg$c220) {
	        s1 = peg$c220;
	        peg$currPos += 5;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c221);
	        }
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s1 = peg$c298(s1);
	    }
	    s0 = s1;

	    return s0;
	  }

	  function peg$parseprimary_expression() {
	    var s0;

	    s0 = peg$parsefunction_call();
	    if (s0 === peg$FAILED) {
	      s0 = peg$parseidentifier();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parsefloat_constant();
	        if (s0 === peg$FAILED) {
	          s0 = peg$parseint_constant();
	          if (s0 === peg$FAILED) {
	            s0 = peg$parsebool_constant();
	            if (s0 === peg$FAILED) {
	              s0 = peg$parseparen_expression();
	            }
	          }
	        }
	      }
	    }

	    return s0;
	  }

	  function peg$parseindex_accessor() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    s1 = peg$parseleft_bracket();
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parseassignment_expression();
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parseright_bracket();
	        if (s3 !== peg$FAILED) {
	          s1 = peg$c299(s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsefield_selector() {
	    var s0, s1, s2;

	    s0 = peg$currPos;
	    if (input.charCodeAt(peg$currPos) === 46) {
	      s1 = peg$c280;
	      peg$currPos++;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c281);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parseidentifier();
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c300(s2);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsepostfix_expression() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    s1 = peg$parseprimary_expression();
	    if (s1 !== peg$FAILED) {
	      s2 = [];
	      s3 = peg$parsefield_selector();
	      if (s3 === peg$FAILED) {
	        s3 = peg$parseindex_accessor();
	      }
	      while (s3 !== peg$FAILED) {
	        s2.push(s3);
	        s3 = peg$parsefield_selector();
	        if (s3 === peg$FAILED) {
	          s3 = peg$parseindex_accessor();
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c301(s1, s2);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsepostfix_expression_no_repeat() {
	    var s0, s1, s2, s3, s4, s5;

	    s0 = peg$currPos;
	    s1 = peg$parsepostfix_expression();
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parse_();
	      if (s2 === peg$FAILED) {
	        s2 = null;
	      }
	      if (s2 !== peg$FAILED) {
	        if (input.substr(peg$currPos, 2) === peg$c116) {
	          s3 = peg$c116;
	          peg$currPos += 2;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c117);
	          }
	        }
	        if (s3 === peg$FAILED) {
	          if (input.substr(peg$currPos, 2) === peg$c118) {
	            s3 = peg$c118;
	            peg$currPos += 2;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c119);
	            }
	          }
	        }
	        if (s3 === peg$FAILED) {
	          s3 = null;
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = [];
	          s5 = peg$parsefield_selector();
	          if (s5 === peg$FAILED) {
	            s5 = peg$parseindex_accessor();
	          }
	          while (s5 !== peg$FAILED) {
	            s4.push(s5);
	            s5 = peg$parsefield_selector();
	            if (s5 === peg$FAILED) {
	              s5 = peg$parseindex_accessor();
	            }
	          }
	          if (s4 !== peg$FAILED) {
	            s1 = peg$c302(s1, s3, s4);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parseparameter_list() {
	    var s0, s1, s2, s3, s4, s5;

	    s0 = peg$currPos;
	    if (input.substr(peg$currPos, 4) === peg$c149) {
	      s1 = peg$c149;
	      peg$currPos += 4;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c150);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s1 = peg$c303();
	    }
	    s0 = s1;
	    if (s0 === peg$FAILED) {
	      s0 = peg$currPos;
	      s1 = peg$parseassignment_expression();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parsecomma();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parseassignment_expression();
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parsecomma();
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parseassignment_expression();
	            if (s5 !== peg$FAILED) {
	              s4 = [s4, s5];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          s1 = peg$c304(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    }

	    return s0;
	  }

	  function peg$parsefunction_call() {
	    var s0, s1, s2, s3, s4;

	    s0 = peg$currPos;
	    s1 = peg$parsefunction_identifier();
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parseleft_paren();
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parseparameter_list();
	        if (s3 === peg$FAILED) {
	          s3 = null;
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parseright_paren();
	          if (s4 !== peg$FAILED) {
	            s1 = peg$c305(s1, s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsefunction_identifier() {
	    var s0, s1;

	    s0 = peg$currPos;
	    s1 = peg$parseidentifier();
	    if (s1 !== peg$FAILED) {
	      s1 = peg$c306(s1);
	    }
	    s0 = s1;
	    if (s0 === peg$FAILED) {
	      s0 = peg$parsetype_name();
	    }

	    return s0;
	  }

	  function peg$parseunary_expression() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    if (input.substr(peg$currPos, 2) === peg$c116) {
	      s1 = peg$c116;
	      peg$currPos += 2;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c117);
	      }
	    }
	    if (s1 === peg$FAILED) {
	      if (input.substr(peg$currPos, 2) === peg$c118) {
	        s1 = peg$c118;
	        peg$currPos += 2;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c119);
	        }
	      }
	      if (s1 === peg$FAILED) {
	        if (input.charCodeAt(peg$currPos) === 33) {
	          s1 = peg$c120;
	          peg$currPos++;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c121);
	          }
	        }
	        if (s1 === peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 126) {
	            s1 = peg$c122;
	            peg$currPos++;
	          } else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c123);
	            }
	          }
	          if (s1 === peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 43) {
	              s1 = peg$c124;
	              peg$currPos++;
	            } else {
	              s1 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c125);
	              }
	            }
	            if (s1 === peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 45) {
	                s1 = peg$c126;
	                peg$currPos++;
	              } else {
	                s1 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                  peg$fail(peg$c127);
	                }
	              }
	            }
	          }
	        }
	      }
	    }
	    if (s1 === peg$FAILED) {
	      s1 = null;
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parse_();
	      if (s2 === peg$FAILED) {
	        s2 = null;
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parsepostfix_expression_no_repeat();
	        if (s3 !== peg$FAILED) {
	          s1 = peg$c307(s1, s3);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsemultiplicative_operator() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    if (input.charCodeAt(peg$currPos) === 42) {
	      s1 = peg$c308;
	      peg$currPos++;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c309);
	      }
	    }
	    if (s1 === peg$FAILED) {
	      if (input.charCodeAt(peg$currPos) === 47) {
	        s1 = peg$c310;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c311);
	        }
	      }
	      if (s1 === peg$FAILED) {
	        if (input.charCodeAt(peg$currPos) === 37) {
	          s1 = peg$c312;
	          peg$currPos++;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c313);
	          }
	        }
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = peg$currPos;
	      peg$silentFails++;
	      if (input.charCodeAt(peg$currPos) === 61) {
	        s3 = peg$c29;
	        peg$currPos++;
	      } else {
	        s3 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c30);
	        }
	      }
	      peg$silentFails--;
	      if (s3 === peg$FAILED) {
	        s2 = void 0;
	      } else {
	        peg$currPos = s2;
	        s2 = peg$FAILED;
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c314(s1);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsemultiplicative_expression() {
	    var s0, s1, s2, s3, s4, s5, s6, s7;

	    s0 = peg$currPos;
	    s1 = peg$parseunary_expression();
	    if (s1 !== peg$FAILED) {
	      s2 = [];
	      s3 = peg$currPos;
	      s4 = peg$parse_();
	      if (s4 === peg$FAILED) {
	        s4 = null;
	      }
	      if (s4 !== peg$FAILED) {
	        s5 = peg$parsemultiplicative_operator();
	        if (s5 !== peg$FAILED) {
	          s6 = peg$parse_();
	          if (s6 === peg$FAILED) {
	            s6 = null;
	          }
	          if (s6 !== peg$FAILED) {
	            s7 = peg$parseunary_expression();
	            if (s7 !== peg$FAILED) {
	              s4 = [s4, s5, s6, s7];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s3;
	        s3 = peg$FAILED;
	      }
	      while (s3 !== peg$FAILED) {
	        s2.push(s3);
	        s3 = peg$currPos;
	        s4 = peg$parse_();
	        if (s4 === peg$FAILED) {
	          s4 = null;
	        }
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parsemultiplicative_operator();
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse_();
	            if (s6 === peg$FAILED) {
	              s6 = null;
	            }
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parseunary_expression();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c315(s1, s2);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parseadditive_operator() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    if (input.charCodeAt(peg$currPos) === 43) {
	      s1 = peg$c124;
	      peg$currPos++;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c125);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = peg$currPos;
	      peg$silentFails++;
	      if (input.charCodeAt(peg$currPos) === 43) {
	        s3 = peg$c124;
	        peg$currPos++;
	      } else {
	        s3 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c125);
	        }
	      }
	      if (s3 === peg$FAILED) {
	        if (input.charCodeAt(peg$currPos) === 61) {
	          s3 = peg$c29;
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c30);
	          }
	        }
	      }
	      peg$silentFails--;
	      if (s3 === peg$FAILED) {
	        s2 = void 0;
	      } else {
	        peg$currPos = s2;
	        s2 = peg$FAILED;
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c316();
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }
	    if (s0 === peg$FAILED) {
	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 45) {
	        s1 = peg$c126;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c127);
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$currPos;
	        peg$silentFails++;
	        if (input.charCodeAt(peg$currPos) === 45) {
	          s3 = peg$c126;
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c127);
	          }
	        }
	        if (s3 === peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 61) {
	            s3 = peg$c29;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c30);
	            }
	          }
	        }
	        peg$silentFails--;
	        if (s3 === peg$FAILED) {
	          s2 = void 0;
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	        if (s2 !== peg$FAILED) {
	          s1 = peg$c317();
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    }

	    return s0;
	  }

	  function peg$parseadditive_expression() {
	    var s0, s1, s2, s3, s4, s5, s6, s7;

	    s0 = peg$currPos;
	    s1 = peg$parsemultiplicative_expression();
	    if (s1 !== peg$FAILED) {
	      s2 = [];
	      s3 = peg$currPos;
	      s4 = peg$parse_();
	      if (s4 === peg$FAILED) {
	        s4 = null;
	      }
	      if (s4 !== peg$FAILED) {
	        s5 = peg$parseadditive_operator();
	        if (s5 !== peg$FAILED) {
	          s6 = peg$parse_();
	          if (s6 === peg$FAILED) {
	            s6 = null;
	          }
	          if (s6 !== peg$FAILED) {
	            s7 = peg$parsemultiplicative_expression();
	            if (s7 !== peg$FAILED) {
	              s4 = [s4, s5, s6, s7];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s3;
	        s3 = peg$FAILED;
	      }
	      while (s3 !== peg$FAILED) {
	        s2.push(s3);
	        s3 = peg$currPos;
	        s4 = peg$parse_();
	        if (s4 === peg$FAILED) {
	          s4 = null;
	        }
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parseadditive_operator();
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse_();
	            if (s6 === peg$FAILED) {
	              s6 = null;
	            }
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parsemultiplicative_expression();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c315(s1, s2);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parseshift_operator() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    if (input.substr(peg$currPos, 2) === peg$c318) {
	      s1 = peg$c318;
	      peg$currPos += 2;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c319);
	      }
	    }
	    if (s1 === peg$FAILED) {
	      if (input.substr(peg$currPos, 2) === peg$c320) {
	        s1 = peg$c320;
	        peg$currPos += 2;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c321);
	        }
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = peg$currPos;
	      peg$silentFails++;
	      if (input.charCodeAt(peg$currPos) === 61) {
	        s3 = peg$c29;
	        peg$currPos++;
	      } else {
	        s3 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c30);
	        }
	      }
	      peg$silentFails--;
	      if (s3 === peg$FAILED) {
	        s2 = void 0;
	      } else {
	        peg$currPos = s2;
	        s2 = peg$FAILED;
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c314(s1);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parseshift_expression() {
	    var s0, s1, s2, s3, s4, s5, s6, s7;

	    s0 = peg$currPos;
	    s1 = peg$parseadditive_expression();
	    if (s1 !== peg$FAILED) {
	      s2 = [];
	      s3 = peg$currPos;
	      s4 = peg$parse_();
	      if (s4 === peg$FAILED) {
	        s4 = null;
	      }
	      if (s4 !== peg$FAILED) {
	        s5 = peg$parseshift_operator();
	        if (s5 !== peg$FAILED) {
	          s6 = peg$parse_();
	          if (s6 === peg$FAILED) {
	            s6 = null;
	          }
	          if (s6 !== peg$FAILED) {
	            s7 = peg$parseadditive_expression();
	            if (s7 !== peg$FAILED) {
	              s4 = [s4, s5, s6, s7];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s3;
	        s3 = peg$FAILED;
	      }
	      while (s3 !== peg$FAILED) {
	        s2.push(s3);
	        s3 = peg$currPos;
	        s4 = peg$parse_();
	        if (s4 === peg$FAILED) {
	          s4 = null;
	        }
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parseshift_operator();
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse_();
	            if (s6 === peg$FAILED) {
	              s6 = null;
	            }
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parseadditive_expression();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c315(s1, s2);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parserelational_operator() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    if (input.charCodeAt(peg$currPos) === 60) {
	      s1 = peg$c322;
	      peg$currPos++;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c323);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = peg$currPos;
	      peg$silentFails++;
	      if (input.charCodeAt(peg$currPos) === 60) {
	        s3 = peg$c322;
	        peg$currPos++;
	      } else {
	        s3 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c323);
	        }
	      }
	      peg$silentFails--;
	      if (s3 === peg$FAILED) {
	        s2 = void 0;
	      } else {
	        peg$currPos = s2;
	        s2 = peg$FAILED;
	      }
	      if (s2 !== peg$FAILED) {
	        if (input.charCodeAt(peg$currPos) === 61) {
	          s3 = peg$c29;
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c30);
	          }
	        }
	        if (s3 === peg$FAILED) {
	          s3 = null;
	        }
	        if (s3 !== peg$FAILED) {
	          s1 = peg$c324(s3);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }
	    if (s0 === peg$FAILED) {
	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 62) {
	        s1 = peg$c325;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c326);
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$currPos;
	        peg$silentFails++;
	        if (input.charCodeAt(peg$currPos) === 62) {
	          s3 = peg$c325;
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c326);
	          }
	        }
	        peg$silentFails--;
	        if (s3 === peg$FAILED) {
	          s2 = void 0;
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 61) {
	            s3 = peg$c29;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c30);
	            }
	          }
	          if (s3 === peg$FAILED) {
	            s3 = null;
	          }
	          if (s3 !== peg$FAILED) {
	            s1 = peg$c327(s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    }

	    return s0;
	  }

	  function peg$parserelational_expression() {
	    var s0, s1, s2, s3, s4, s5, s6, s7;

	    s0 = peg$currPos;
	    s1 = peg$parseshift_expression();
	    if (s1 !== peg$FAILED) {
	      s2 = [];
	      s3 = peg$currPos;
	      s4 = peg$parse_();
	      if (s4 === peg$FAILED) {
	        s4 = null;
	      }
	      if (s4 !== peg$FAILED) {
	        s5 = peg$parserelational_operator();
	        if (s5 !== peg$FAILED) {
	          s6 = peg$parse_();
	          if (s6 === peg$FAILED) {
	            s6 = null;
	          }
	          if (s6 !== peg$FAILED) {
	            s7 = peg$parseshift_expression();
	            if (s7 !== peg$FAILED) {
	              s4 = [s4, s5, s6, s7];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s3;
	        s3 = peg$FAILED;
	      }
	      while (s3 !== peg$FAILED) {
	        s2.push(s3);
	        s3 = peg$currPos;
	        s4 = peg$parse_();
	        if (s4 === peg$FAILED) {
	          s4 = null;
	        }
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parserelational_operator();
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse_();
	            if (s6 === peg$FAILED) {
	              s6 = null;
	            }
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parseshift_expression();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c315(s1, s2);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parseequality_operator() {
	    var s0, s1;

	    s0 = peg$currPos;
	    if (input.substr(peg$currPos, 2) === peg$c328) {
	      s1 = peg$c328;
	      peg$currPos += 2;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c329);
	      }
	    }
	    if (s1 === peg$FAILED) {
	      if (input.substr(peg$currPos, 2) === peg$c330) {
	        s1 = peg$c330;
	        peg$currPos += 2;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c331);
	        }
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s1 = peg$c332(s1);
	    }
	    s0 = s1;

	    return s0;
	  }

	  function peg$parseequality_expression() {
	    var s0, s1, s2, s3, s4, s5, s6, s7;

	    s0 = peg$currPos;
	    s1 = peg$parserelational_expression();
	    if (s1 !== peg$FAILED) {
	      s2 = [];
	      s3 = peg$currPos;
	      s4 = peg$parse_();
	      if (s4 === peg$FAILED) {
	        s4 = null;
	      }
	      if (s4 !== peg$FAILED) {
	        s5 = peg$parseequality_operator();
	        if (s5 !== peg$FAILED) {
	          s6 = peg$parse_();
	          if (s6 === peg$FAILED) {
	            s6 = null;
	          }
	          if (s6 !== peg$FAILED) {
	            s7 = peg$parserelational_expression();
	            if (s7 !== peg$FAILED) {
	              s4 = [s4, s5, s6, s7];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s3;
	        s3 = peg$FAILED;
	      }
	      while (s3 !== peg$FAILED) {
	        s2.push(s3);
	        s3 = peg$currPos;
	        s4 = peg$parse_();
	        if (s4 === peg$FAILED) {
	          s4 = null;
	        }
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parseequality_operator();
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse_();
	            if (s6 === peg$FAILED) {
	              s6 = null;
	            }
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parserelational_expression();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c315(s1, s2);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsebitwise_and_operator() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    if (input.charCodeAt(peg$currPos) === 38) {
	      s1 = peg$c333;
	      peg$currPos++;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c334);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = peg$currPos;
	      peg$silentFails++;
	      if (input.charCodeAt(peg$currPos) === 61) {
	        s3 = peg$c29;
	        peg$currPos++;
	      } else {
	        s3 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c30);
	        }
	      }
	      if (s3 === peg$FAILED) {
	        if (input.charCodeAt(peg$currPos) === 38) {
	          s3 = peg$c333;
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c334);
	          }
	        }
	      }
	      peg$silentFails--;
	      if (s3 === peg$FAILED) {
	        s2 = void 0;
	      } else {
	        peg$currPos = s2;
	        s2 = peg$FAILED;
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c335();
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsebitwise_and_expression() {
	    var s0, s1, s2, s3, s4, s5, s6, s7;

	    s0 = peg$currPos;
	    s1 = peg$parseequality_expression();
	    if (s1 !== peg$FAILED) {
	      s2 = [];
	      s3 = peg$currPos;
	      s4 = peg$parse_();
	      if (s4 === peg$FAILED) {
	        s4 = null;
	      }
	      if (s4 !== peg$FAILED) {
	        s5 = peg$parsebitwise_and_operator();
	        if (s5 !== peg$FAILED) {
	          s6 = peg$parse_();
	          if (s6 === peg$FAILED) {
	            s6 = null;
	          }
	          if (s6 !== peg$FAILED) {
	            s7 = peg$parseequality_expression();
	            if (s7 !== peg$FAILED) {
	              s4 = [s4, s5, s6, s7];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s3;
	        s3 = peg$FAILED;
	      }
	      while (s3 !== peg$FAILED) {
	        s2.push(s3);
	        s3 = peg$currPos;
	        s4 = peg$parse_();
	        if (s4 === peg$FAILED) {
	          s4 = null;
	        }
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parsebitwise_and_operator();
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse_();
	            if (s6 === peg$FAILED) {
	              s6 = null;
	            }
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parseequality_expression();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c315(s1, s2);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsebitwise_xor_operator() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    if (input.charCodeAt(peg$currPos) === 94) {
	      s1 = peg$c336;
	      peg$currPos++;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c337);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = peg$currPos;
	      peg$silentFails++;
	      if (input.charCodeAt(peg$currPos) === 61) {
	        s3 = peg$c29;
	        peg$currPos++;
	      } else {
	        s3 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c30);
	        }
	      }
	      if (s3 === peg$FAILED) {
	        if (input.charCodeAt(peg$currPos) === 94) {
	          s3 = peg$c336;
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c337);
	          }
	        }
	      }
	      peg$silentFails--;
	      if (s3 === peg$FAILED) {
	        s2 = void 0;
	      } else {
	        peg$currPos = s2;
	        s2 = peg$FAILED;
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c338();
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsebitwise_xor_expression() {
	    var s0, s1, s2, s3, s4, s5, s6, s7;

	    s0 = peg$currPos;
	    s1 = peg$parsebitwise_and_expression();
	    if (s1 !== peg$FAILED) {
	      s2 = [];
	      s3 = peg$currPos;
	      s4 = peg$parse_();
	      if (s4 === peg$FAILED) {
	        s4 = null;
	      }
	      if (s4 !== peg$FAILED) {
	        s5 = peg$parsebitwise_xor_operator();
	        if (s5 !== peg$FAILED) {
	          s6 = peg$parse_();
	          if (s6 === peg$FAILED) {
	            s6 = null;
	          }
	          if (s6 !== peg$FAILED) {
	            s7 = peg$parsebitwise_and_expression();
	            if (s7 !== peg$FAILED) {
	              s4 = [s4, s5, s6, s7];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s3;
	        s3 = peg$FAILED;
	      }
	      while (s3 !== peg$FAILED) {
	        s2.push(s3);
	        s3 = peg$currPos;
	        s4 = peg$parse_();
	        if (s4 === peg$FAILED) {
	          s4 = null;
	        }
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parsebitwise_xor_operator();
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse_();
	            if (s6 === peg$FAILED) {
	              s6 = null;
	            }
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parsebitwise_and_expression();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c315(s1, s2);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsebitwise_or_operator() {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    if (input.charCodeAt(peg$currPos) === 124) {
	      s1 = peg$c339;
	      peg$currPos++;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c340);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = peg$currPos;
	      peg$silentFails++;
	      if (input.charCodeAt(peg$currPos) === 61) {
	        s3 = peg$c29;
	        peg$currPos++;
	      } else {
	        s3 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c30);
	        }
	      }
	      if (s3 === peg$FAILED) {
	        if (input.charCodeAt(peg$currPos) === 124) {
	          s3 = peg$c339;
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c340);
	          }
	        }
	      }
	      peg$silentFails--;
	      if (s3 === peg$FAILED) {
	        s2 = void 0;
	      } else {
	        peg$currPos = s2;
	        s2 = peg$FAILED;
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c341();
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parsebitwise_or_expression() {
	    var s0, s1, s2, s3, s4, s5, s6, s7;

	    s0 = peg$currPos;
	    s1 = peg$parsebitwise_xor_expression();
	    if (s1 !== peg$FAILED) {
	      s2 = [];
	      s3 = peg$currPos;
	      s4 = peg$parse_();
	      if (s4 === peg$FAILED) {
	        s4 = null;
	      }
	      if (s4 !== peg$FAILED) {
	        s5 = peg$parsebitwise_or_operator();
	        if (s5 !== peg$FAILED) {
	          s6 = peg$parse_();
	          if (s6 === peg$FAILED) {
	            s6 = null;
	          }
	          if (s6 !== peg$FAILED) {
	            s7 = peg$parsebitwise_xor_expression();
	            if (s7 !== peg$FAILED) {
	              s4 = [s4, s5, s6, s7];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s3;
	        s3 = peg$FAILED;
	      }
	      while (s3 !== peg$FAILED) {
	        s2.push(s3);
	        s3 = peg$currPos;
	        s4 = peg$parse_();
	        if (s4 === peg$FAILED) {
	          s4 = null;
	        }
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parsebitwise_or_operator();
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse_();
	            if (s6 === peg$FAILED) {
	              s6 = null;
	            }
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parsebitwise_xor_expression();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c315(s1, s2);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parselogical_and_operator() {
	    var s0, s1;

	    s0 = peg$currPos;
	    if (input.substr(peg$currPos, 2) === peg$c342) {
	      s1 = peg$c342;
	      peg$currPos += 2;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c343);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s1 = peg$c344();
	    }
	    s0 = s1;

	    return s0;
	  }

	  function peg$parselogical_and_expression() {
	    var s0, s1, s2, s3, s4, s5, s6, s7;

	    s0 = peg$currPos;
	    s1 = peg$parsebitwise_or_expression();
	    if (s1 !== peg$FAILED) {
	      s2 = [];
	      s3 = peg$currPos;
	      s4 = peg$parse_();
	      if (s4 === peg$FAILED) {
	        s4 = null;
	      }
	      if (s4 !== peg$FAILED) {
	        s5 = peg$parselogical_and_operator();
	        if (s5 !== peg$FAILED) {
	          s6 = peg$parse_();
	          if (s6 === peg$FAILED) {
	            s6 = null;
	          }
	          if (s6 !== peg$FAILED) {
	            s7 = peg$parsebitwise_or_expression();
	            if (s7 !== peg$FAILED) {
	              s4 = [s4, s5, s6, s7];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s3;
	        s3 = peg$FAILED;
	      }
	      while (s3 !== peg$FAILED) {
	        s2.push(s3);
	        s3 = peg$currPos;
	        s4 = peg$parse_();
	        if (s4 === peg$FAILED) {
	          s4 = null;
	        }
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parselogical_and_operator();
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse_();
	            if (s6 === peg$FAILED) {
	              s6 = null;
	            }
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parsebitwise_or_expression();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c315(s1, s2);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parselogical_xor_operator() {
	    var s0, s1;

	    s0 = peg$currPos;
	    if (input.substr(peg$currPos, 2) === peg$c345) {
	      s1 = peg$c345;
	      peg$currPos += 2;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c346);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s1 = peg$c347();
	    }
	    s0 = s1;

	    return s0;
	  }

	  function peg$parselogical_xor_expression() {
	    var s0, s1, s2, s3, s4, s5, s6, s7;

	    s0 = peg$currPos;
	    s1 = peg$parselogical_and_expression();
	    if (s1 !== peg$FAILED) {
	      s2 = [];
	      s3 = peg$currPos;
	      s4 = peg$parse_();
	      if (s4 === peg$FAILED) {
	        s4 = null;
	      }
	      if (s4 !== peg$FAILED) {
	        s5 = peg$parselogical_xor_operator();
	        if (s5 !== peg$FAILED) {
	          s6 = peg$parse_();
	          if (s6 === peg$FAILED) {
	            s6 = null;
	          }
	          if (s6 !== peg$FAILED) {
	            s7 = peg$parselogical_and_expression();
	            if (s7 !== peg$FAILED) {
	              s4 = [s4, s5, s6, s7];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s3;
	        s3 = peg$FAILED;
	      }
	      while (s3 !== peg$FAILED) {
	        s2.push(s3);
	        s3 = peg$currPos;
	        s4 = peg$parse_();
	        if (s4 === peg$FAILED) {
	          s4 = null;
	        }
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parselogical_xor_operator();
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse_();
	            if (s6 === peg$FAILED) {
	              s6 = null;
	            }
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parselogical_and_expression();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c315(s1, s2);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parselogical_or_operator() {
	    var s0, s1;

	    s0 = peg$currPos;
	    if (input.substr(peg$currPos, 2) === peg$c348) {
	      s1 = peg$c348;
	      peg$currPos += 2;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) {
	        peg$fail(peg$c349);
	      }
	    }
	    if (s1 !== peg$FAILED) {
	      s1 = peg$c350();
	    }
	    s0 = s1;

	    return s0;
	  }

	  function peg$parselogical_or_expression() {
	    var s0, s1, s2, s3, s4, s5, s6, s7;

	    s0 = peg$currPos;
	    s1 = peg$parselogical_xor_expression();
	    if (s1 !== peg$FAILED) {
	      s2 = [];
	      s3 = peg$currPos;
	      s4 = peg$parse_();
	      if (s4 === peg$FAILED) {
	        s4 = null;
	      }
	      if (s4 !== peg$FAILED) {
	        s5 = peg$parselogical_or_operator();
	        if (s5 !== peg$FAILED) {
	          s6 = peg$parse_();
	          if (s6 === peg$FAILED) {
	            s6 = null;
	          }
	          if (s6 !== peg$FAILED) {
	            s7 = peg$parselogical_xor_expression();
	            if (s7 !== peg$FAILED) {
	              s4 = [s4, s5, s6, s7];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s3;
	        s3 = peg$FAILED;
	      }
	      while (s3 !== peg$FAILED) {
	        s2.push(s3);
	        s3 = peg$currPos;
	        s4 = peg$parse_();
	        if (s4 === peg$FAILED) {
	          s4 = null;
	        }
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parselogical_or_operator();
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse_();
	            if (s6 === peg$FAILED) {
	              s6 = null;
	            }
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parselogical_xor_expression();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c315(s1, s2);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parseconditional_expression() {
	    var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;

	    s0 = peg$currPos;
	    s1 = peg$parselogical_or_expression();
	    if (s1 !== peg$FAILED) {
	      s2 = peg$currPos;
	      s3 = peg$parse_();
	      if (s3 === peg$FAILED) {
	        s3 = null;
	      }
	      if (s3 !== peg$FAILED) {
	        if (input.charCodeAt(peg$currPos) === 63) {
	          s4 = peg$c351;
	          peg$currPos++;
	        } else {
	          s4 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c352);
	          }
	        }
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parse_();
	          if (s5 === peg$FAILED) {
	            s5 = null;
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parseassignment_expression();
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parse_();
	              if (s7 === peg$FAILED) {
	                s7 = null;
	              }
	              if (s7 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 58) {
	                  s8 = peg$c353;
	                  peg$currPos++;
	                } else {
	                  s8 = peg$FAILED;
	                  if (peg$silentFails === 0) {
	                    peg$fail(peg$c354);
	                  }
	                }
	                if (s8 !== peg$FAILED) {
	                  s9 = peg$parse_();
	                  if (s9 === peg$FAILED) {
	                    s9 = null;
	                  }
	                  if (s9 !== peg$FAILED) {
	                    s10 = peg$parseassignment_expression();
	                    if (s10 !== peg$FAILED) {
	                      s3 = [s3, s4, s5, s6, s7, s8, s9, s10];
	                      s2 = s3;
	                    } else {
	                      peg$currPos = s2;
	                      s2 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s2;
	                    s2 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s2;
	                  s2 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s2;
	                s2 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s2;
	              s2 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s2;
	        s2 = peg$FAILED;
	      }
	      if (s2 === peg$FAILED) {
	        s2 = null;
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = peg$c355(s1, s2);
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
	  }

	  function peg$parseassignment_expression() {
	    var s0, s1, s2, s3, s4, s5;

	    s0 = peg$currPos;
	    s1 = peg$parseconditional_expression();
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parse_();
	      if (s2 === peg$FAILED) {
	        s2 = null;
	      }
	      if (s2 !== peg$FAILED) {
	        if (input.charCodeAt(peg$currPos) === 61) {
	          s3 = peg$c29;
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c30);
	          }
	        }
	        if (s3 === peg$FAILED) {
	          if (input.substr(peg$currPos, 2) === peg$c356) {
	            s3 = peg$c356;
	            peg$currPos += 2;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c357);
	            }
	          }
	          if (s3 === peg$FAILED) {
	            if (input.substr(peg$currPos, 2) === peg$c358) {
	              s3 = peg$c358;
	              peg$currPos += 2;
	            } else {
	              s3 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c359);
	              }
	            }
	            if (s3 === peg$FAILED) {
	              if (input.substr(peg$currPos, 2) === peg$c360) {
	                s3 = peg$c360;
	                peg$currPos += 2;
	              } else {
	                s3 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                  peg$fail(peg$c361);
	                }
	              }
	              if (s3 === peg$FAILED) {
	                if (input.substr(peg$currPos, 2) === peg$c362) {
	                  s3 = peg$c362;
	                  peg$currPos += 2;
	                } else {
	                  s3 = peg$FAILED;
	                  if (peg$silentFails === 0) {
	                    peg$fail(peg$c363);
	                  }
	                }
	                if (s3 === peg$FAILED) {
	                  if (input.substr(peg$currPos, 2) === peg$c364) {
	                    s3 = peg$c364;
	                    peg$currPos += 2;
	                  } else {
	                    s3 = peg$FAILED;
	                    if (peg$silentFails === 0) {
	                      peg$fail(peg$c365);
	                    }
	                  }
	                  if (s3 === peg$FAILED) {
	                    if (input.substr(peg$currPos, 3) === peg$c366) {
	                      s3 = peg$c366;
	                      peg$currPos += 3;
	                    } else {
	                      s3 = peg$FAILED;
	                      if (peg$silentFails === 0) {
	                        peg$fail(peg$c367);
	                      }
	                    }
	                    if (s3 === peg$FAILED) {
	                      if (input.substr(peg$currPos, 3) === peg$c368) {
	                        s3 = peg$c368;
	                        peg$currPos += 3;
	                      } else {
	                        s3 = peg$FAILED;
	                        if (peg$silentFails === 0) {
	                          peg$fail(peg$c369);
	                        }
	                      }
	                      if (s3 === peg$FAILED) {
	                        if (input.substr(peg$currPos, 2) === peg$c370) {
	                          s3 = peg$c370;
	                          peg$currPos += 2;
	                        } else {
	                          s3 = peg$FAILED;
	                          if (peg$silentFails === 0) {
	                            peg$fail(peg$c371);
	                          }
	                        }
	                        if (s3 === peg$FAILED) {
	                          if (input.substr(peg$currPos, 2) === peg$c372) {
	                            s3 = peg$c372;
	                            peg$currPos += 2;
	                          } else {
	                            s3 = peg$FAILED;
	                            if (peg$silentFails === 0) {
	                              peg$fail(peg$c373);
	                            }
	                          }
	                          if (s3 === peg$FAILED) {
	                            if (input.substr(peg$currPos, 2) === peg$c374) {
	                              s3 = peg$c374;
	                              peg$currPos += 2;
	                            } else {
	                              s3 = peg$FAILED;
	                              if (peg$silentFails === 0) {
	                                peg$fail(peg$c375);
	                              }
	                            }
	                          }
	                        }
	                      }
	                    }
	                  }
	                }
	              }
	            }
	          }
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parse_();
	          if (s4 === peg$FAILED) {
	            s4 = null;
	          }
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parseassignment_expression();
	            if (s5 !== peg$FAILED) {
	              s1 = peg$c376(s1, s3, s5);
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }
	    if (s0 === peg$FAILED) {
	      s0 = peg$parseconditional_expression();
	    }

	    return s0;
	  }

	  function peg$parsecondition() {
	    var s0, s1, s2, s3, s4, s5, s6, s7;

	    s0 = peg$currPos;
	    s1 = peg$parselocally_specified_type();
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parse_();
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parseidentifier();
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parse_();
	          if (s4 === peg$FAILED) {
	            s4 = null;
	          }
	          if (s4 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 61) {
	              s5 = peg$c29;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c30);
	              }
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parse_();
	              if (s6 === peg$FAILED) {
	                s6 = null;
	              }
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parseassignment_expression();
	                if (s7 !== peg$FAILED) {
	                  s1 = [s1, s2, s3, s4, s5, s6, s7];
	                  s0 = s1;
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }
	    if (s0 === peg$FAILED) {
	      s0 = peg$parseassignment_expression();
	    }

	    return s0;
	  }

	  // Ideintifer for each node.
	  var next_id = 0;

	  // The type of shader being parsed.  This sould be set before parsing begins.
	  // This allows us to reject invalid constructs such as attribute declaration
	  // in a fragment shader or discard ina vertex shader.
	  var shaderType = "vs";

	  /** @constructor */
	  function node(extraProperties) {
	    this._isNode = true;
	    this.id = next_id++;
	    for (var prop in extraProperties) {
	      if (extraProperties.hasOwnProperty(prop)) {
	        this[prop] = extraProperties[prop];
	      }
	    }
	  }
	  // Helper function to daisy chain together a series of binary operations.
	  function daisy_chain(head, tail) {
	    var result = head;
	    for (var i = 0; i < tail.length; i++) {
	      result = new node({
	        type: "binary",
	        operator: tail[i][1],
	        left: result,
	        right: tail[i][3]
	      });
	    }
	    return result;
	  }
	  // Generates AST Nodes for a preprocessor branch.
	  function preprocessor_branch(if_directive, elif_directives, else_directive) {
	    var elseList = elif_directives;
	    if (else_directive) {
	      elseList = elseList.concat([else_directive]);
	    }
	    var result = if_directive[0];
	    result.guarded_statements = if_directive[1].statements;
	    var current_branch = result;
	    for (var i = 0; i < elseList.length; i++) {
	      current_branch.elseBody = elseList[i][0];
	      current_branch.elseBody.guarded_statements = elseList[i][1].statements;
	      current_branch = current_branch.elseBody;
	    }
	    return result;
	  }
	  peg$result = peg$startRuleFunction();

	  if (peg$result !== peg$FAILED && peg$currPos === input.length) {
	    return peg$result;
	  } else {
	    if (peg$result !== peg$FAILED && peg$currPos < input.length) {
	      peg$fail(peg$endExpectation());
	    }

	    throw peg$buildStructuredError(peg$maxFailExpected, peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null, peg$maxFailPos < input.length ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1) : peg$computeLocation(peg$maxFailPos, peg$maxFailPos));
	  }
	}

	var parser = {
	  SyntaxError: peg$SyntaxError,
	  parse: peg$parse
	};

	/**
	 * 
	 */
	var extend = function extend() {
	    for (var i = 1; i < arguments.length; i++) {
	        for (var key in arguments[i]) {
	            if (arguments[i].hasOwnProperty(key)) arguments[0][key] = arguments[i][key];
	        }
	    }return arguments[0];
	};

	var extend_1 = extend;

	/**
	 * @author yellow
	 */

	var traverseDepthFirstSync = function traverseDepthFirstSync(rootNode, options) {
	    options = extend_1({
	        subnodesAccessor: function subnodesAccessor(node) {
	            return node.subnodes;
	        },
	        userdataAccessor: function userdataAccessor(node, userdata) {
	            return userdata;
	        },
	        onNode: function onNode(node, userdata) {},
	        userdata: null
	    }, options);

	    var stack = [];
	    stack.push([rootNode, options.userdata]);
	    while (stack.length > 0) {
	        var top = stack.pop();
	        var node = top[0];
	        var data = top[1];
	        options.onNode(node, data);
	        var subnodeData = options.userdataAccessor(node, data);
	        var subnodes = options.subnodesAccessor(node);
	        for (var i = 0; i < subnodes.length; i++) {
	            stack.push([subnodes[i], subnodeData]);
	        }
	    }
	    return rootNode;
	};

	var tree = traverseDepthFirstSync;

	/**
	 * @author yellow 
	 * @param {*} node 
	 */
	var subnodes = function subnodes(node) {
	    var subnodes = [];
	    for (var param in node) {
	        if (!node.hasOwnProperty(param) || node[param] === null) continue;
	        if (param == 'parent') continue;
	        if (node[param] instanceof Array) {
	            subnodes = subnodes.concat(node[param]);
	        } else if (node[param]._isNode) {
	            subnodes.push(node[param]);
	        }
	    }
	    return subnodes;
	};

	var subnodes_1 = subnodes;

	/**
	 * @author yellow
	 */
	var pegjsParse = parser.parse;

	var build = function build(node) {
		tree(node, {
			subnodesAccessor: function subnodesAccessor(node) {
				var list = subnodes_1(node);
				if (!list) return [];
				for (var i = 0; i < list.length; i++) {
					list[i].parent = node;
				}return list;
			}
		});
		return node;
	};
	/**
	 * parse nodes
	 */
	var parse = function parse(str) {
		var nodes = pegjsParse(str);
		return build(nodes);
	};
	/**
	 * search node by depth
	 */
	var getUniformsAndAttributes = function getUniformsAndAttributes(ast) {
		var active = {};
		var define = {};
		var uniforms = [],
		    attributes = [];
		var _uniforms = [],
		    _attributes = [];

		var next = function next(nodes) {
			var identify = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'none';

			//顺序遍历
			nodes.forEach(function (node) {
				//处理宏定义
				if (node.type === 'preprocessor') {
					//1.首先寻找define
					if (node.directive === '#define') {
						define[node.identifier] = node.token_string;
					}
					if (node.directive === '#ifdef' && define[node.value] || node.directive === '#ifndef' && !define[node.value]) {
						if (node.guarded_statements) {
							next(node.guarded_statements, identify);
						}
					}
					if (node.directive === '#if') {
						for (var key in define) {
							var reg = new RegExp('\\b' + key + '\\b', 'gi');
							if (node.value.match(reg)) {
								next(node.guarded_statements, identify);
							}
						}
					}
					if (node.elseBody) {
						next([node.elseBody], identify);
					}
				} else if (node.type === 'function_declaration') {
					if (node.name === 'main') {
						next(node.body.statements, 'main');
					}
				} else if (node.type === 'postfix') {
					if (identify === 'main') {
						next([node.expression], identify);
					}
				} else if (node.type === 'expression') {
					next([node.expression], identify);
				} else if (node.type === 'binary') {
					//左边是等式
					if (node.left.type === 'identifier') {
						active[node.left.name] = 1;
					} else {
						next([node.left], identify);
					}
					if (node.right.type === 'identifier') {
						active[node.right.name] = 1;
					} else {
						next([node.right], identify);
					}
				} else if (node.type === 'function_call') {
					if (identify === 'main') {
						node.parameters.forEach(function (parameter) {
							next([parameter], identify);
						});
					}
				} else if (node.type === 'identifier') {
					if (identify === 'main') active[node.name] = 1;
				} else if (node.type === 'declarator') {
					if (node.typeAttribute) {
						next(node.declarators, node.typeAttribute.qualifier || identify);
					} else {
						next(node.declarators, identify);
					}
				} else if (node.type === 'declarator_item') {
					if (identify === 'uniform') {
						_uniforms.push({
							name: node.name.name,
							type: node.parent.typeAttribute.name
						});
					} else if (identify === 'attribute') {
						_attributes.push({
							name: node.name.name,
							type: node.parent.typeAttribute.name
						});
					} else if (identify === 'varying') {
					} else if (identify === 'main') {
						if (node.initializer) next([node.initializer], identify);else if (node.arraySize) next([node.arraySize], identify);
					}
				}
			});
		};
		next(ast.statements);
		//过滤non-actived的变量或者对象
		_uniforms.forEach(function (uniform) {
			if (active[uniform.name]) uniforms.push(uniform);
		});
		_attributes.forEach(function (attribute) {
			if (active[attribute.name]) attributes.push(attribute);
		});
		return [uniforms, attributes];
	};

	var init = {
		parse: parse,
		getUniformsAndAttributes: getUniformsAndAttributes
	};

	/**
	 * birgde to attach shader
	 * reference:
	 * https://github.com/KhronosGroup/glslang/blob/04f4566f285beb1e3619eb40baa7629eb5eb3946/glslang/MachineIndependent/Initialize.cpp
	 * https://www.cnblogs.com/bitzhuwei/p/LALR1-library-and-a-GLSL-parser-in-csharp.html
	 * https://github.com/aras-p/glsl-optimizer
	 * 
	 * @author yellow
	 */

	/**
	 * complier
	 */

	/**
	 * the prefix of Shader type
	 */
	var prefix = 'SHADER';
	/**
	 * convert DOMString to value
	 */
	var GLSL_TYPE_ENUM = {
	  'float': 0x1406,
	  'vec2': 0x8b50,
	  'vec3': 0x8b51,
	  'vec4': 0x8b52,
	  'mat2': 0x8b5a,
	  'mat3': 0x8b5b,
	  'mat4': 0x8b5c,
	  'sampler2D': 0x8b5e,
	  'sampler_external_oes': 0x8d66,
	  'sampler_cube': '0x8b60',
	  'int': 0x1404,
	  'bool': 0x8b56
	  /**
	   * @class
	   */
	};
	var GLShader = function (_Dispose) {
	  inherits(GLShader, _Dispose);

	  /**
	   * 
	   * @param {GLenum} type Either gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
	   * @param {GLContext} glContext 
	   */
	  function GLShader(type, glContext) {
	    classCallCheck(this, GLShader);

	    /**
	     * @type {GLenum}
	     */
	    var _this = possibleConstructorReturn(this, (GLShader.__proto__ || Object.getPrototypeOf(GLShader)).call(this, prefix));

	    _this._type = type;
	    /**
	     * @type {GLContext}
	     */
	    _this._glContext = glContext;
	    /**
	     * @type {String} shaderSource 
	     */
	    _this._source = null;
	    /**
	     * @type {boolean}
	     */
	    _this._isDelete = false;
	    /**
	     * @type {boolean}
	     */
	    _this._isComplied = false;
	    return _this;
	  }
	  /**
	   * @returns {GLenum}
	   */


	  createClass(GLShader, [{
	    key: 'getParameters',

	    /**
	     * bridge to shader
	     * @param {GLenum} pname 
	     */
	    value: function getParameters(pname) {
	      if (pname === GLConstants_1.DELETE_STATUS) return this._isDelete;else if (pname === GLConstants_1.COMPILE_STATUS) return this._isComplied;else if (pname === GLConstants_1.SHADER_TYPE) return this._type;
	    }
	    /**
	     * reference:
	     * https://github.com/WebKit/webkit/blob/4c0ce4f62b30a6d39140ac9841c416dee3bd07e0/Source/ThirdParty/ANGLE/util/shader_utils.cpp
	     * https://github.com/SDL-mirror/SDL/blob/865821287c68ff8039544a35e86eb56289bd162d/src/render/opengl/SDL_shaders_gl.c
	     * 
	     * }{yellow 寻找power vr sdk下 opengl es的实现
	     * use regex pattern to analy active attri/uniforms
	     */

	  }, {
	    key: 'complie',
	    value: function complie() {
	      var source = this._source;

	      var _parseShaderStrings2 = this._parseShaderStrings(source),
	          _parseShaderStrings3 = slicedToArray(_parseShaderStrings2, 2),
	          uniforms = _parseShaderStrings3[0],
	          attributes = _parseShaderStrings3[1];

	      this._uniforms = uniforms;
	      this._attributes = attributes;
	    }
	    /**
	     * @returns {Array}
	     */

	  }, {
	    key: '_parseShaderStrings',

	    /**
	     * reference:
	     * https://github.com/KhronosGroup/glslang/blob/eb2c0c72bf4c2f7a972883003b5f5fca3f8c94bd/glslang/MachineIndependent/ParseHelper.cpp#L186
	     */
	    value: function _parseShaderStrings(str) {
	      var ast = init.parse(str);

	      var _complier$getUniforms = init.getUniformsAndAttributes(ast),
	          _complier$getUniforms2 = slicedToArray(_complier$getUniforms, 2),
	          uniforms = _complier$getUniforms2[0],
	          attributes = _complier$getUniforms2[1];

	      return [this._convert(uniforms), this._convert(attributes)];
	    }
	    /**
	     * @param {Array} nodes
	     * @param {Array} attributeNodes
	     */

	  }, {
	    key: '_convert',
	    value: function _convert(nodes) {
	      var collection = [];
	      //deal with no struct type only 
	      nodes.forEach(function (element) {
	        collection.push({
	          name: element.name,
	          type: GLSL_TYPE_ENUM[element.type]
	        });
	      });
	      return collection;
	    }
	  }, {
	    key: 'type',
	    get: function get$$1() {
	      return this._type;
	    }
	    /**
	     * @type {String}
	     */

	  }, {
	    key: 'source',
	    set: function set$$1(v) {
	      this._source = v;
	    }
	    /**
	     * @returns {String}
	     */
	    ,
	    get: function get$$1() {
	      return this._source;
	    }
	  }, {
	    key: 'uniforms',
	    get: function get$$1() {
	      return this._uniforms;
	    }
	    /**
	     * @returns {Array}
	     */

	  }, {
	    key: 'attributes',
	    get: function get$$1() {
	      return this._attributes;
	    }
	  }]);
	  return GLShader;
	}(Dispose_1);

	var GLShader_1 = GLShader;

	var prefix$1 = 'BUFFER';

	/**
	 * @class
	 */

	var GLBuffer = function (_Dispose) {
	  inherits(GLBuffer, _Dispose);

	  /**
	   * 
	   * @param {GLContext} glContext 
	   */
	  function GLBuffer(glContext) {
	    classCallCheck(this, GLBuffer);

	    /**
	     * @type {GLContext}
	     */
	    var _this = possibleConstructorReturn(this, (GLBuffer.__proto__ || Object.getPrototypeOf(GLBuffer)).call(this, prefix$1));

	    _this._glContext = glContext;
	    return _this;
	  }

	  return GLBuffer;
	}(Dispose_1);

	var GLBuffer_1 = GLBuffer;

	var prefix$2 = 'FRAMEBUFFER';

	/**
	 * @class
	 */

	var GLFramebuffer = function (_Dispose) {
	  inherits(GLFramebuffer, _Dispose);

	  /**
	   * 
	   * @param {GLContext} glContext 
	   */
	  function GLFramebuffer(glContext) {
	    classCallCheck(this, GLFramebuffer);

	    /**
	     * @type {GLContext}
	     */
	    var _this = possibleConstructorReturn(this, (GLFramebuffer.__proto__ || Object.getPrototypeOf(GLFramebuffer)).call(this, prefix$2));

	    _this._glContext = glContext;
	    return _this;
	  }

	  return GLFramebuffer;
	}(Dispose_1);

	var GLFramebuffer_1 = GLFramebuffer;

	var prefix$3 = 'RENDERBUFFER';

	/**
	 * @class
	 */

	var GLRenderbuffer = function (_Dispose) {
	  inherits(GLRenderbuffer, _Dispose);

	  /**
	   * 
	   * @param {GLContext} glContext 
	   */
	  function GLRenderbuffer(glContext) {
	    classCallCheck(this, GLRenderbuffer);

	    /**
	     * @type {GLContext}
	     */
	    var _this = possibleConstructorReturn(this, (GLRenderbuffer.__proto__ || Object.getPrototypeOf(GLRenderbuffer)).call(this, prefix$3));

	    _this._glContext = glContext;
	    return _this;
	  }

	  return GLRenderbuffer;
	}(Dispose_1);

	var GLRenderbuffer_1 = GLRenderbuffer;

	/**
	 * @author yellow date 2018/2/27
	 */

	var prefix$4 = 'VERTEXARRAYOBJRCT ';
	/** 
	 * @class
	*/

	var GLVertexArray = function (_Dispose) {
	  inherits(GLVertexArray, _Dispose);

	  /**
	   * 
	   * @param {GLContext} glContext 
	   */
	  function GLVertexArray(glContext) {
	    classCallCheck(this, GLVertexArray);

	    var _this = possibleConstructorReturn(this, (GLVertexArray.__proto__ || Object.getPrototypeOf(GLVertexArray)).call(this, prefix$4));

	    _this._glContext = glContext;
	    return _this;
	  }

	  return GLVertexArray;
	}(Dispose_1);

	var GLVertexArray_1 = GLVertexArray;

	/**
	 * birgde to attach texture
	 */

	/**
	 * the prefix of Texture type
	 */
	var prefix$5 = 'TEXTURE';

	var GLTexture = function (_Dispose) {
	  inherits(GLTexture, _Dispose);

	  /**
	   * @param {GLContext} glContext 
	   */
	  function GLTexture(glContext) {
	    classCallCheck(this, GLTexture);

	    /**
	     * @type {GLContext}
	     */
	    var _this = possibleConstructorReturn(this, (GLTexture.__proto__ || Object.getPrototypeOf(GLTexture)).call(this, prefix$5));

	    _this._glContext = glContext;
	    return _this;
	  }

	  return GLTexture;
	}(Dispose_1);

	var GLTexture_1 = GLTexture;

	/**
	 * @author yellow
	 */

	/**
	 * prefix of Cache
	 */
	var prefixProgram = 'PROGRAM',
	    prefixUniform = 'UNIFOMR';
	/**
	 * @class
	 */

	var GLProgram = function (_Dispose) {
	  inherits(GLProgram, _Dispose);

	  /**
	   * 
	   * @param {GLContext} glContext 
	   */
	  function GLProgram(glContext) {
	    classCallCheck(this, GLProgram);

	    /**
	     * 索引glContext对象
	     */
	    var _this = possibleConstructorReturn(this, (GLProgram.__proto__ || Object.getPrototypeOf(GLProgram)).call(this, prefixProgram));

	    _this._glContext = glContext;
	    /**
	     * 映射attribute 和返回值
	     */
	    _this._attributeCache = {};
	    /**
	     * 映射uniforms
	     */
	    _this._uniformCache = {};
	    /**
	     * @type {GLShader}
	     */
	    _this._vs = null;
	    /**
	     * @type {GLShader}
	     */
	    _this._fs = null;
	    return _this;
	  }
	  /**
	   * @returns {Number}
	   */


	  createClass(GLProgram, [{
	    key: 'attachShader',

	    /**
	     * attach shader
	     * @param {GLShader} shader 
	     */
	    value: function attachShader(shader) {
	      if (shader.type === GLConstants_1.FRAGMENT_SHADER) this._fs = shader;else if (shader.type === GLConstants_1.VERTEX_SHADER) this._vs = shader;
	    }
	    /**
	     * initial shader and analysis uniform/attribute
	     */

	  }, {
	    key: 'link',
	    value: function link() {
	      //complier vShader and fShader
	      this._vs.complie();
	      this._fs.complie();
	      //store uniforms and attributes
	      this._uniforms = [].concat(this._vs.uniforms).concat(this._fs.uniforms);
	      this._attributes = [].concat(this._vs.attributes).concat(this._fs.attributes);
	      //reverse value and key
	      this._updateKeyValue();
	    }
	    /**
	     * 
	     */

	  }, {
	    key: '_updateKeyValue',
	    value: function _updateKeyValue() {
	      var uniforms = this._uniforms,
	          attributes = this._attributes,
	          uniformCache = this._uniformCache,
	          attributeCache = this._attributeCache;
	      //attribute location index
	      var index = 0;
	      //unifrom map
	      uniforms.forEach(function (uniform) {
	        var uniformLocation = {};
	        stamp_1(uniformLocation, prefixUniform);
	        uniformCache[uniform.name] = uniformLocation;
	      });
	      //attribute map
	      attributes.forEach(function (attribute) {
	        attributeCache[attribute.name] = index++;
	      });
	    }
	    /**
	     * no longer need to replace,return location directly
	     * @param {GLenum} pname 
	     */

	  }, {
	    key: 'getAttribLocation',
	    value: function getAttribLocation(pname) {
	      return this._attributeCache[pname];
	    }
	    /**
	     * 
	     * @param {DOMString} pname 
	     */

	  }, {
	    key: 'getUnifromLocation',
	    value: function getUnifromLocation(pname) {
	      var uniformLocation = {};
	      stamp_1(uniformLocation, prefixUniform);
	      this._uniformCache[pname] = this._uniformCache[pname] || uniformLocation;
	      return this._uniformCache[pname];
	    }
	  }, {
	    key: 'attachNum',
	    get: function get$$1() {
	      var num = 0;
	      if (this._vs) num++;
	      if (this._fs) num++;
	      return num;
	    }
	    /**
	     * @returns {Array}
	     */

	  }, {
	    key: 'uniforms',
	    get: function get$$1() {
	      return this._uniforms;
	    }
	    /**
	     * @returns {Array}
	     */

	  }, {
	    key: 'attributes',
	    get: function get$$1() {
	      return this._attributes;
	    }
	  }]);
	  return GLProgram;
	}(Dispose_1);

	var GLProgram_1 = GLProgram;

	/**
	 * 执行器，用于执行Record操作，全局自带一个Actuator
	 * @author yellow date 2018/1/3
	 */

	/**
	 * Cahce store
	 */
	var CHACHE = {
	  /**
	   * store program
	   */
	  PROGRAM: {},
	  /**
	  * store shader
	  */
	  SHADER: {},
	  /**
	  * store texture
	  */
	  TEXTURE: {},
	  /**
	   * store BUFFER
	   */
	  BUFFER: {},
	  /**
	   * store FRAMEBUFFER
	   */
	  FRAMEBUFFER: {},
	  /**
	   * store RENDERBUFFER
	   */
	  RENDERBUFFER: {},
	  /**
	   * store uinform
	   */
	  UNIFOMR: {},
	  /**
	   * store vao
	   */
	  VERTEXARRAYOBJRCT: {}
	  /**
	   * @class
	   */
	};
	var Actuator = function () {
	  function Actuator() {
	    classCallCheck(this, Actuator);

	    /**
	     * @type {Array}
	     */
	    this._records = [];
	    /**
	     * @type {WebGLRenderingContext}
	     */
	    this._gl = null;
	    /**
	     * @type {Boolean}
	     */
	    this._debug = false;
	    /**
	     * debug logger
	     * @type {Array}
	     */
	    this._logger = [];
	  }
	  /**
	   * 
	   * @param {WebGLRenderingContext} v
	   */


	  createClass(Actuator, [{
	    key: 'apply',
	    value: function apply(v) {
	      this._gl = v;
	      this.play();
	    }
	    /**
	     * get the excuted commands
	     */

	  }, {
	    key: 'play',

	    /**
	     * 执行
	     * @param {Array} records 
	     */
	    value: function play() {
	      var records = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

	      this._records = this._records.concat(records);
	      var gl = this._gl;
	      if (gl) {
	        var record = this._records.shift();
	        while (record) {
	          var opName = record.opName,
	              encrypt = Encrypt[opName] || {};
	          //replace the reference object
	          if (encrypt.replace > 0) {
	            var refObjects = {};
	            for (var key in record.ptMapIndex) {
	              var target = record.ptMapIndex[key],
	                  ptIndex = target.index,
	                  ptName = target.id,
	                  cacheName = target.prefix,
	                  refObject = CHACHE[cacheName][ptName];
	              refObjects[ptIndex] = refObject;
	            }
	            record.replace(refObjects);
	          }
	          //if need to return and cache,
	          if (encrypt.return) {
	            // case of uniform returned is not string
	            var returnId = isString_1(record.returnId) ? record.returnId : stamp_1(record.returnId),
	                returanIdPrefix = record.returanIdPrefix;
	            CHACHE[returanIdPrefix][returnId] = gl[opName].apply(gl, record.args);
	          } else {
	            gl[opName].apply(gl, record.args);
	          }
	          //debug logger
	          this._debug ? this._logger.push(opName) : null;
	          //next record
	          record = this._records.shift();
	        }
	      }
	    }
	  }, {
	    key: 'logger',
	    get: function get$$1() {
	      return this._logger;
	    }
	    /**
	     * 
	     */

	  }, {
	    key: 'debug',
	    get: function get$$1() {
	      return this._debug;
	    }
	    /**
	     * @param {Boolean} v
	     */
	    ,
	    set: function set$$1(v) {
	      this._debug = v;
	      !v ? this._logger = [] : null;
	    }
	  }]);
	  return Actuator;
	}();
	/**
	 * instance of Actuator
	 */


	var actuator = new Actuator();

	var Actuator_1 = actuator;

	/**
	 * @author yellow
	 */

	/**
	 * bridge object
	 */

	/**
	 * singleton
	 */

	/**
	 * the prefix of GLContext
	 */
	var prefix$6 = "WEBGLRENDERGINGCONTEXT";
	/**
	 * @class
	 */

	var GLContext = function (_Dispose) {
	    inherits(GLContext, _Dispose);

	    /**
	     * 
	     * @param {String} id parentId,just as the glCanvas'id
	     * @param {String} renderType support 'webgl' or 'webgl2'
	     * @param {Object} [options] 
	     */
	    function GLContext(id, renderType) {
	        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
	        classCallCheck(this, GLContext);

	        /**
	         * @type {String}
	         */
	        var _this = possibleConstructorReturn(this, (GLContext.__proto__ || Object.getPrototypeOf(GLContext)).call(this, prefix$6));

	        _this._renderType = renderType;
	        /**
	         * @type {Object}
	         */
	        _this._options = options;
	        /**
	         * @type {Recorder}
	         */
	        _this._recorder = new Recorder_1(_this);
	        /**
	         * @type {GLLimits}
	         */
	        _this._glLimits = new GLLimits_1(_this);
	        /**
	         * @type {GLExtension}
	         */
	        _this._glExtension = new GLExtension_1(_this);
	        /**
	         * @type {String}
	         */
	        _this._programId = null;
	        /**
	         * real WebGLRenderingContext
	         * @type {WebGLRenderingContext}
	         */
	        _this._gl = null;
	        /**
	         * @type {Array}
	         */
	        _this._clear = [];
	        /**
	         * map funciont
	         */
	        _this._map();
	        return _this;
	    }
	    /**
	     * map function and constants to Class
	     */


	    createClass(GLContext, [{
	        key: '_map',
	        value: function _map() {
	            var _this2 = this;

	            var recorder = this._recorder;
	            //1.map constants
	            for (var key in GLConstants_1) {
	                if (!this.hasOwnProperty(key)) {
	                    var target = GLConstants_1[key];
	                    if (!this[key]) this[key] = target;
	                }
	            }
	            //2.map void function(include replace and no replace)

	            var _loop = function _loop(_key) {
	                if (!_this2.hasOwnProperty(_key)) {
	                    var _target = Encrypt[_key];
	                    //2.1 void and no replace
	                    if (!_target.return && _target.replace === 0) {
	                        if (!_this2[_key] && !!_target) {
	                            _this2[_key] = function () {
	                                for (var _len = arguments.length, rest = Array(_len), _key2 = 0; _key2 < _len; _key2++) {
	                                    rest[_key2] = arguments[_key2];
	                                }

	                                var record = new (Function.prototype.bind.apply(Record_1, [null].concat([_key], rest)))();
	                                recorder.increase(record);
	                            };
	                        }
	                    }
	                    //2.2 void and replace 
	                    else if (!_target.return && _target.replace > 0) {
	                            if (!_this2[_key] && !!_target) {
	                                _this2[_key] = function () {
	                                    for (var _len2 = arguments.length, rest = Array(_len2), _key3 = 0; _key3 < _len2; _key3++) {
	                                        rest[_key3] = arguments[_key3];
	                                    }

	                                    var record = new (Function.prototype.bind.apply(Record_1, [null].concat([_key], rest)))(),
	                                        index = _target.ptIndex;
	                                    record.exactIndexByObject(index);
	                                    recorder.increase(record);
	                                };
	                            }
	                        }
	                    //2.3 return(make birdge to origin,should not to be implemented)
	                }
	            };

	            for (var _key in Encrypt) {
	                _loop(_key);
	            }
	        }
	        /*
	         * private ,only used in GLCanvas.link[Cnavas/GL] funcitons
	         * @param {WebGLRenderingContext} gl 
	         */

	    }, {
	        key: '_setgl',
	        value: function _setgl(gl) {
	            this._gl = gl;
	            this._glLimits._include();
	            this._glExtension._include();
	            Actuator_1.apply(gl);
	        }
	        /**
	         * get the version of webgl
	         * @returns {String} 'webgl' or 'webgl2'
	         */

	    }, {
	        key: 'createShader',

	        /**
	         * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createShader
	         * @param {String} type Either gl.VERTEX_SHADER or gl.FRAGMENT_SHADER 
	         */
	        value: function createShader(type) {
	            var glShader = new GLShader_1(type, this),
	                record = new Record_1('createShader', type);
	            record.setReturnId(glShader.id);
	            this._recorder.increase(record);
	            return glShader;
	        }
	        /**
	         * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/shaderSource
	         * @param {GLShader} shader 
	         * @param {String} source 
	         */

	    }, {
	        key: 'shaderSource',
	        value: function shaderSource(shader, source) {
	            shader.source = source;
	            var returnId = shader.id,
	                record = new Record_1('shaderSource', shader, source);
	            record.exactIndexByValue(0, returnId);
	            this._recorder.increase(record);
	        }
	        /**
	         * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/compileShader
	         * @param {GLShader} shader 
	         */

	    }, {
	        key: 'compileShader',
	        value: function compileShader(shader) {
	            var returnId = shader.id,
	                record = new Record_1('compileShader', shader);
	            record.exactIndexByValue(0, returnId);
	            shader._isComplied = true;
	            this._recorder.increase(record);
	        }
	        /**
	         * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createProgram
	         * @returns {GLProgram}
	         */

	    }, {
	        key: 'createProgram',
	        value: function createProgram() {
	            var glProgram = new GLProgram_1(this),
	                record = new Record_1('createProgram');
	            record.setReturnId(glProgram.id);
	            this._recorder.increase(record);
	            return glProgram;
	        }
	        /**
	         * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createProgram
	         * @returns {GLBuffer}
	         */

	    }, {
	        key: 'createBuffer',
	        value: function createBuffer() {
	            var glBuffer = new GLBuffer_1(this),
	                record = new Record_1('createBuffer');
	            record.setReturnId(glBuffer.id);
	            this._recorder.increase(record);
	            return glBuffer;
	        }
	        /**
	         * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createFramebuffer
	         * @returns {GLFramebuffer}
	         */

	    }, {
	        key: 'createFramebuffer',
	        value: function createFramebuffer() {
	            var glFramebuffer = new GLFramebuffer_1(this),
	                record = new Record_1('createFramebuffer');
	            record.setReturnId(glFramebuffer.id);
	            this._recorder.increase(record);
	            return glFramebuffer;
	        }
	        /** 
	         * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createRenderbuffer
	         * @returns {GLRenderbuffer}
	         */

	    }, {
	        key: 'createRenderbuffer',
	        value: function createRenderbuffer() {
	            var glRenderbuffer = new GLRenderbuffer_1(this),
	                record = new Record_1('createRenderbuffer');
	            record.setReturnId(glRenderbuffer.id);
	            this._recorder.increase(record);
	            return glRenderbuffer;
	        }
	        /** 
	         * needs ext 'OES_vertex_array_object' support
	         * https://developer.mozilla.org/en-US/docs/Web/API/WebGLVertexArrayObject
	         * @returns {GL}
	        */

	    }, {
	        key: 'createVertexArray',
	        value: function createVertexArray() {
	            var glVao = new GLVertexArray_1(this),
	                record = new Record_1('createVertexArray');
	            record.setReturnId(glVao.id);
	            this._recorder.increase(record);
	            return glVao;
	        }
	        /**
	         * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createTexture
	         * @returns {GLTexture}
	         */

	    }, {
	        key: 'createTexture',
	        value: function createTexture() {
	            var glTexture = new GLTexture_1(this),
	                record = new Record_1('createTexture');
	            record.setReturnId(glTexture.id);
	            this._recorder.increase(record);
	            return glTexture;
	        }
	        /**
	         * https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/attachShader
	         * @param {GLProgram} program 
	         * @param {GLShader} shader 
	         */

	    }, {
	        key: 'attachShader',
	        value: function attachShader(program, shader) {
	            var record = new Record_1('attachShader', program, shader);
	            record.exactIndexByValue(0, program.id);
	            record.exactIndexByValue(1, shader.id);
	            this._recorder.increase(record);
	            //
	            program.attachShader(shader);
	        }
	        /**
	         * https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/linkProgram
	         * @param {GLProgram} program 
	         */

	    }, {
	        key: 'linkProgram',
	        value: function linkProgram(program) {
	            var record = new Record_1('linkProgram', program);
	            record.exactIndexByValue(0, program.id);
	            this._recorder.increase(record);
	            program.link();
	        }
	        /**
	         * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getAttribLocation
	         * @modify yellow date 2018/2/3 direction return 
	         * 
	         * @param {GLProgram} program 
	         * @param {String} name 
	         */

	    }, {
	        key: 'getAttribLocation',
	        value: function getAttribLocation(program, name) {
	            var returnId = program.getAttribLocation(name),
	                record = new Record_1('getAttribLocation', program, name);
	            record.exactIndexByValue(0, program.id);
	            record.setReturnId(returnId, false);
	            this._recorder.increase(record);
	            return returnId;
	        }
	        /**
	         * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getUniformLocation
	         * @param {GLProgram} program 
	         * @param {DOMString} name 
	         */

	    }, {
	        key: 'getUniformLocation',
	        value: function getUniformLocation(program, name) {
	            var returnId = program.getUnifromLocation(name),
	                record = new Record_1('getUniformLocation', program, name);
	            record.exactIndexByValue(0, program.id);
	            record.setReturnId(returnId);
	            this._recorder.increase(record);
	            return returnId;
	        }
	        /**
	         * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getShaderParameter
	         * @param {GLShader} shader 
	         * @param {GLenum} pname 
	         */

	    }, {
	        key: 'getShaderParameter',
	        value: function getShaderParameter(shader, pname) {
	            return shader.getParameters(pname);
	        }
	        /**
	         * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getShaderInfoLog
	         * @param {GLShader} shader 
	         */

	    }, {
	        key: 'getShaderInfoLog',
	        value: function getShaderInfoLog(shader) {
	            return '';
	        }
	        /**
	         * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getProgramInfoLog
	         * @param {GLProgram} program 
	         */

	    }, {
	        key: 'getProgramInfoLog',
	        value: function getProgramInfoLog(program) {
	            return '';
	        }
	        /**
	         * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getActiveAttrib
	         * @param {GLProgram} program 
	         * @param {GLuint} index 
	         */

	    }, {
	        key: 'getActiveAttrib',
	        value: function getActiveAttrib(program, index) {
	            return program.attributes[index];
	        }
	        /**
	         * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getActiveUniform
	         * @param {GLProgram} program 
	         * @param {GLuint} index 
	         */

	    }, {
	        key: 'getActiveUniform',
	        value: function getActiveUniform(program, index) {
	            return program.uniforms[index];
	        }
	        /**
	         * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getProgramParameter
	         * @type {GLProgram} program
	         * @type {GLenum} pname
	         */

	    }, {
	        key: 'getProgramParameter',
	        value: function getProgramParameter(program, pname) {
	            if (pname === GLConstants_1.ACTIVE_UNIFORMS) {
	                return program.uniforms.length;
	            } else if (pname === GLConstants_1.ACTIVE_ATTRIBUTES) {
	                return program.attributes.length;
	            } else if (pname === GLConstants_1.ATTACHED_SHADERS) {
	                return program.attachNum;
	            } else if (pname === GLConstants_1.LINK_STATUS) {
	                return true;
	            } else if (pname === GLConstants_1.DELETE_STATUS) {
	                return true;
	            }
	        }
	        /**
	         * @param {GLProgram} program 
	         */

	    }, {
	        key: 'useProgram',
	        value: function useProgram(program) {
	            var programId = program.id;
	            var record = new Record_1('useProgram', program);
	            record.exactIndexByValue(0, programId);
	            this._recorder.increase(record);
	            this._programId = programId;
	        }
	        /**
	         * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getExtension
	         * @param {String} name 
	         */

	    }, {
	        key: 'getExtension',
	        value: function getExtension(name) {
	            var glExtension = this._glExtension;
	            return glExtension[name];
	        }
	        /**
	         * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
	         * @param {String} pname 
	         */

	    }, {
	        key: 'getParameter',
	        value: function getParameter(pname) {
	            //parameter search from limits
	            var glLimits = this._glLimits;
	            return glLimits[pname];
	        }
	        /**
	         * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clear
	         */

	    }, {
	        key: 'clear',
	        value: function clear(mask) {
	            //}{hack igonre 'screen clearing operations'
	            //1.GLConstants.COLOR_BUFFER_BIT|GLConstants.DEPTH_BUFFER_BIT|GLConstants.STENCIL_BUFFER_BIT  = 17664
	            //2.mask alpah !== 0
	            if (mask !== 17664) {
	                var record = new Record_1('clear', mask);
	                this._recorder.increase(record);
	            }
	        }
	        /**
	         * turning function
	         * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawArrays
	         */

	    }, {
	        key: 'drawArrays',
	        value: function drawArrays(mode, first, count) {
	            var record = new Record_1('drawArrays', mode, first, count),
	                programId = this._programId;
	            this._recorder.increase(record);
	            Actuator_1.play(this._recorder.toInstruction(programId));
	        }
	        /**
	         * turning function
	         * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements
	         */

	    }, {
	        key: 'drawElements',
	        value: function drawElements(mode, count, type, offset) {
	            var record = new Record_1('drawElements', mode, count, type, offset),
	                programId = this._programId;
	            this._recorder.increase(record);
	            Actuator_1.play(this._recorder.toInstruction(programId));
	        }
	    }, {
	        key: 'renderType',
	        get: function get$$1() {
	            return this._renderType;
	        }
	        /**
	         * get webglrendercontext
	         * @returns {WebGLRenderingContext}
	         */

	    }, {
	        key: 'gl',
	        get: function get$$1() {
	            return this._gl;
	        }
	        /**
	         * get glcontext's recorder
	         * @returns {Recorder}
	         */

	    }, {
	        key: 'recorder',
	        get: function get$$1() {
	            return this._recorder;
	        }
	    }]);
	    return GLContext;
	}(Dispose_1);

	var GLContext_1 = GLContext;

	/**
	 * store WebGLRenderingContext
	 */
	var CACHE_GL = {};
	/**
	 * the prefix of GLCanvas
	 */
	var prefix$7 = 'CANVASELEMENT';
	/**
	 * @class
	 * @example
	 * const glCavnas = new GLCanvas('mapCanvas',{
	 *  mock:new Mock(canvanElement,['width','height']);
	 * });
	 */

	var GLCanvas = function (_Dispose) {
	  inherits(GLCanvas, _Dispose);

	  /**
	   * 
	   * @param {String} id the real htmlCanvasElement id 
	   * @param {Object} [options]
	   * @param {HtmlMock} [options.mock]
	   */
	  function GLCanvas(id) {
	    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
	    classCallCheck(this, GLCanvas);

	    /**
	     * @type {String}
	     */
	    var _this = possibleConstructorReturn(this, (GLCanvas.__proto__ || Object.getPrototypeOf(GLCanvas)).call(this, prefix$7));

	    _this._canvasId = id;
	    /**
	     * @type {Object}
	     */
	    _this._options = merge_1({}, options);
	    /**
	     * @type {String}
	     */
	    _this._glType = 'webgl';
	    /**
	     * store the 'getContext' options
	     * @type {Object}
	     */
	    _this._contextOptions = {};
	    /**
	     * real html canvas element
	     * https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement
	     * @type {HtmlCanvasElement}
	     */
	    _this._canvas = null;
	    /**
	     * @type {GLContext}
	     */
	    _this._glContext = null;
	    /**
	     * @type {Object}
	     */
	    _this._style = {};
	    /**
	     * store canvas operations
	     * @type {Recorder}
	     */
	    _this._records = new Recorder_1(null, false);
	    /**
	     * mock function
	     */
	    _this._mock();
	    return _this;
	  }
	  /**
	   * 
	   */


	  createClass(GLCanvas, [{
	    key: '_mock',
	    value: function _mock() {
	      var _this2 = this;

	      var mock = this._options.mock;
	      if (!mock) return;
	      var mockList = mock.mockList;
	      mockList.forEach(function (key) {
	        if (!_this2.hasOwnProperty(key) && !_this2[key]) if (!mock.isAttribute(key)) _this2[key] = function () {
	          for (var _len = arguments.length, rest = Array(_len), _key = 0; _key < _len; _key++) {
	            rest[_key] = arguments[_key];
	          }

	          var element = mock.element;
	          return element[key].apply(element, rest);
	        };else _this2[key] = mock.element[key];
	      });
	    }
	    /**
	     * get context attributes
	     * include webgl2 attributes
	     * reference https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
	     * @param {Object} [options] 
	     */

	  }, {
	    key: '_getContextAttributes',
	    value: function _getContextAttributes() {
	      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	      return {
	        alpha: options.alpha || false,
	        depth: options.depth || true,
	        stencil: options.stencil || true,
	        antialias: options.antialias || false,
	        premultipliedAlpha: options.premultipliedAlpha || true,
	        preserveDrawingBuffer: options.preserveDrawingBuffer || false,
	        failIfMajorPerformanceCaveat: options.failIfMajorPerformanceCaveat || false
	      };
	    }
	    /**
	     * https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style
	     * https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration
	     * @type {CSSStyleDeclaration}
	     */

	  }, {
	    key: 'getContext',

	    /**
	     * get GLContext
	     * @param {String} renderType 
	     * @param {Object} [options]
	     * @returns {GLContext}
	     */
	    value: function getContext() {
	      var renderType = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'webgl';
	      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	      var id = this.id;
	      this._glType = this._glType || renderType;
	      this._contextOptions = this._contextOptions || this._getContextAttributes(options);
	      this._glContext = this._glContext || new GLContext_1(id, this._glType, this._contextOptions);
	      return this._glContext;
	    }
	    /**
	     * https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener
	     * @param {String} type 
	     * @param {Function} listener 
	     * @param {Object} options 
	     */

	  }, {
	    key: 'addEventListener',
	    value: function addEventListener(type, listener, options) {
	      var canvas = this._canvas;
	      if (canvas) {
	        canvas.addEventListener(type, listener, options);
	      } else {
	        var record = new Record_1('addEventListener', type, listener, options);
	        this._records.increase(record);
	      }
	    }
	    /**
	     * link virtual rendering context to real htmlCanvas
	     * @param {HtmlCanvasElement} canvas 
	     */

	  }, {
	    key: 'linkToCanvas',
	    value: function linkToCanvas(canvas) {
	      var id = stamp_1(canvas);
	      this._canvas = canvas;
	      this._canvasId = id;
	      //1. set style
	      this._canvas.style.width = this.style.width || this._canvas.clientWidth + 'px';
	      this._canvas.style.height = this.style.height || this._canvas.clientHeight + 'px';
	      //2.
	      var records = this._records.toOperation();
	      var record = records.shift();
	      while (record) {
	        canvas[record.opName].apply(canvas, record.args);
	        record = records.shift();
	      }
	      //3. set gl
	      CACHE_GL[id] = CACHE_GL[id] || canvas.getContext(this._glType, this._contextOptions) || canvas.getContext('experimental-' + this._glType, this._contextOptions);
	      var glContext = this.getContext('webgl');
	      glContext._setgl(CACHE_GL[id]);
	    }
	    /**
	     * link virtual rendering context to real htmlCanvas
	     * @param {WebGLRenderingContext} gl 
	     */

	  }, {
	    key: 'linkToWebGLRenderingContext',
	    value: function linkToWebGLRenderingContext(gl) {
	      if (this._canvas) {
	        throw new Error('exist htmlcanvaselement');
	      }
	      var canvas = gl.canvas;
	      if (canvas) {
	        this.linkToCanvas(canvas);
	      } else {
	        var glContext = this.getContext('webgl');
	        glContext._setgl(gl);
	      }
	    }
	  }, {
	    key: 'style',
	    get: function get$$1() {
	      return this._style;
	    }
	  }]);
	  return GLCanvas;
	}(Dispose_1);

	var GLCanvas_1 = GLCanvas;

	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/Element
	 * @class
	 * @author yellow date 2018/2/5
	 * @example
	 * const mock = new Mock(canvasElement,['width','heigh']);
	 */

	var attribute = {
	    'style': 1,
	    'nodeName': 1,
	    'width': 1,
	    'height': 1
	};

	/**
	 * @class
	 */

	var HtmlMock = function () {
	    /**
	     * 
	     * @param {HtmlCanvasElement} element 
	     */
	    function HtmlMock(element, mockList) {
	        classCallCheck(this, HtmlMock);

	        /**
	         * @type {HtmlCanvasElement}
	         */
	        this._element = element;
	        /**
	         * @type {Array}
	         */
	        this._mockList = mockList;
	    }
	    /**
	     * @type {Array}
	     */


	    createClass(HtmlMock, [{
	        key: 'isAttribute',
	        value: function isAttribute(name) {
	            return attribute[name] === 1;
	        }
	    }, {
	        key: 'mockList',
	        set: function set$$1(v) {
	            this._mockList = v;
	        }
	        /**
	         * @type {Array}
	         */
	        ,
	        get: function get$$1() {
	            return this._mockList;
	        }
	    }, {
	        key: 'element',
	        get: function get$$1() {
	            return this._element;
	        }
	    }]);
	    return HtmlMock;
	}();

	var HtmlMock_1 = HtmlMock;

	var init$1 = {
	  gl: {
	    /**
	     * mock html element functions and attributes
	     */
	    HtmlMock: HtmlMock_1,
	    /**
	     * virtual HtmlCanvasElement
	     */
	    GLCanvas: GLCanvas_1,
	    /**
	     * debug settings
	     */
	    Debug: {
	      /**
	       * enable debug logger
	       */
	      Enable: function Enable() {
	        Actuator_1.debug = true;
	      },
	      /**
	       * disable debug logger
	       */
	      Disable: function Disable() {
	        Actuator_1.debug = false;
	      },
	      /**
	       * executed commands
	       */
	      GetLogger: function GetLogger() {
	        return Actuator_1.logger;
	      }
	    }
	  }
	};

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
	            return distance(new Vec3());
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
	                _eye$value = slicedToArray(eye.value, 3),
	                eyex = _eye$value[0],
	                eyey = _eye$value[1],
	                eyez = _eye$value[2],
	                _up$value = slicedToArray(up.value, 3),
	                upx = _up$value[0],
	                upy = _up$value[1],
	                upz = _up$value[2],
	                _center$_out = slicedToArray(center._out, 3),
	                centerx = _center$_out[0],
	                centery = _center$_out[1],
	                centerz = _center$_out[2];

	            if (Math.abs(eyex - centerx) < GLMatrix_1.EPSILON && Math.abs(eyey - centery) < GLMatrix_1.EPSILON && Math.abs(eyez - centerz) < GLMatrix_1.EPSILON) {
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

	var init$2 = {
	    Vec2: Vec2_1,
	    Vec3: Vec3_1,
	    Vec4: Vec4_1,
	    Mat3: Mat3_1,
	    Mat4: Mat4_1,
	    Quat: Quat_1,
	    GLMatrix: GLMatrix_1
	};

	/**
	 * 矩阵计算
	 */
	var Mat4$1 = init$2.Mat4,
	    Vec3$1 = init$2.Vec3,
	    GLMatrix = init$2.GLMatrix;
	/**
	 * 
	 * https://learnopengl-cn.github.io/01%20Getting%20started/09%20Camera/
	 * 透视相机
	 * 构建相机的本质：
	 * 1.构建一个以相机位置为原点，与真实原点贯穿的三个轴为方向的坐标系
	 * 2.
	 * @class
	 */

	var PerspectiveCamera = function () {
	  /**
	   * @example
	   * var camera = new PerspectiveCameraP(45,800/600,1,2000);
	   * 
	   * @param {number} vertical of view in angle
	   * @param {*} aspect 
	   * @param {*} zNear 
	   * @param {*} zFar 
	   */
	  function PerspectiveCamera(fov, aspect, zNear, zFar) {
	    classCallCheck(this, PerspectiveCamera);

	    /**
	     * 默认相机位置
	     */
	    this._position = new Vec3$1().set(0, 0, 0);
	    this._front = new Vec3$1().set(0, 0, -1);
	    this._up = new Vec3$1().set(0, 1, 0);
	    this._right = new Vec3$1().set(1, 0, 0);
	    this._worldUp = new Vec3$1().set(0, 1, 0);
	    /**
	     * 默认相机配置
	     */
	    this.movementSpeed = 2.5;
	    /**
	     * 透视矩阵，用于将空间的物体投影在锥形的区域内
	     * http://www.cnblogs.com/yjmyzz/archive/2010/05/08/1730697.html
	     * 核心：scale = f1/(f1+z)
	     * 通过比例，将znear与zfar之间的元素投影在znear上，得到屏幕像素(x,y)
	     */
	    this.projectionMatrix = Mat4$1.perspective(GLMatrix.toRadian(fov), aspect, zNear, zFar);
	    /**
	     * 计算viewMatrix
	     */
	    this._update();
	  }
	  /*
	   * 计算相机矩阵
	   */


	  createClass(PerspectiveCamera, [{
	    key: '_update',
	    value: function _update() {
	      /**
	       * 相机矩阵，这个矩阵代表的是相机在世界坐标中的位置和姿态。 
	       * https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-3d-camera.html
	       */
	      var cameraMatrix = new Mat4$1().translate(this._position);
	      /**
	       * 视图矩阵是将所有物体以相反于相机的方向运动
	       */
	      var viewMatrix = cameraMatrix.clone().invert();
	      /**
	       * 将视图矩阵和投影矩阵结合在一起
	       */
	      this.viewProjectionMatrix = this.projectionMatrix.clone().multiply(viewMatrix);
	    }
	    /**
	     * 更新相机位置，重新计算viewPorjection
	     * @type {Array} [0,0,400]
	     */

	  }, {
	    key: 'move',

	    /**
	     * 更新相机位置，重新计算viewPorjection
	     * @param {FORWARD, BACKWARD, LEFT, RIGHT} direction
	     * @param {*} deltaTime
	     */
	    value: function move(direction) {
	      var deltaTime = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

	      var velocity = this.movementSpeed * deltaTime;
	      switch (direction) {
	        case "FORWARD":
	          this._position.add(this._front.clone().scale(velocity));
	          break;
	        case "BACKWARD":
	          this._position.sub(this._front.clone().scale(velocity));
	          break;
	        case "LEFT":
	          this._position.sub(this._right.clone().scale(velocity));
	          break;
	        case "RIGHT":
	          this._position.add(this._right.clone().scale(velocity));
	          break;
	      }
	      this._update();
	    }
	  }, {
	    key: 'position',
	    set: function set$$1(v) {
	      this._position.set(v[0], v[1], v[2]);
	      this._update();
	    }
	  }]);
	  return PerspectiveCamera;
	}();

	var PerspectiveCamera_1 = PerspectiveCamera;

	/**
	 * @author yellow date 2018/2/11
	 */

	var init$3 = {
	  /**
	   * WebGL namespace
	   */
	  gl: {
	    PerspectiveCamera: PerspectiveCamera_1,
	    HtmlMock: init$1.gl.HtmlMock,
	    GLCanvas: init$1.gl.GLCanvas
	  }
	};
	var init_1$3 = init$3.gl;

	exports.default = init$3;
	exports.gl = init_1$3;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
