/*!
 * @license twgl.js 3.5.0 Copyright (c) 2015, Gregg Tavares All Rights Reserved.
 * Available via the MIT license.
 * see: http://github.com/greggman/twgl.js for details
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["twgl"] = factory();
	else
		root["twgl"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(1), __webpack_require__(10), __webpack_require__(11), __webpack_require__(12)], __WEBPACK_AMD_DEFINE_RESULT__ = function (twgl, m4, v3, primitives) {

	  "use strict";

	  twgl.m4 = m4;
	  twgl.v3 = v3;
	  twgl.primitives = primitives;
	  return twgl;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	/*
	 * Copyright 2015, Gregg Tavares.
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *     * Redistributions of source code must retain the above copyright
	 * notice, this list of conditions and the following disclaimer.
	 *     * Redistributions in binary form must reproduce the above
	 * copyright notice, this list of conditions and the following disclaimer
	 * in the documentation and/or other materials provided with the
	 * distribution.
	 *     * Neither the name of Gregg Tavares. nor the names of his
	 * contributors may be used to endorse or promote products derived from
	 * this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2), __webpack_require__(5), __webpack_require__(7), __webpack_require__(6), __webpack_require__(8), __webpack_require__(3), __webpack_require__(9), __webpack_require__(4)], __WEBPACK_AMD_DEFINE_RESULT__ = function (attributes, draw, framebuffers, programs, textures, typedArrays, vertexArrays, utils) {
	  "use strict";

	  /**
	   * The main TWGL module.
	   *
	   * For most use cases you shouldn't need anything outside this module.
	   * Exceptions between the stuff added to twgl-full (v3, m4, primitives)
	   *
	   * @module twgl
	   * @borrows module:twgl/attributes.setAttribInfoBufferFromArray as setAttribInfoBufferFromArray
	   * @borrows module:twgl/attributes.createBufferInfoFromArrays as createBufferInfoFromArrays
	   * @borrows module:twgl/attributes.createVertexArrayInfo as createVertexArrayInfo
	   * @borrows module:twgl/draw.drawBufferInfo as drawBufferInfo
	   * @borrows module:twgl/draw.drawObjectList as drawObjectList
	   * @borrows module:twgl/framebuffers.createFramebufferInfo as createFramebufferInfo
	   * @borrows module:twgl/framebuffers.resizeFramebufferInfo as resizeFramebufferInfo
	   * @borrows module:twgl/framebuffers.bindFramebufferInfo as bindFramebufferInfo
	   * @borrows module:twgl/programs.createProgramInfo as createProgramInfo
	   * @borrows module:twgl/programs.createUniformBlockInfo as createUniformBlockInfo
	   * @borrows module:twgl/programs.bindUniformBlock as bindUniformBlock
	   * @borrows module:twgl/programs.setUniformBlock as setUniformBlock
	   * @borrows module:twgl/programs.setBlockUniforms as setBlockUniforms
	   * @borrows module:twgl/programs.setUniforms as setUniforms
	   * @borrows module:twgl/programs.setBuffersAndAttributes as setBuffersAndAttributes
	   * @borrows module:twgl/textures.setTextureFromArray as setTextureFromArray
	   * @borrows module:twgl/textures.createTexture as createTexture
	   * @borrows module:twgl/textures.resizeTexture as resizeTexture
	   * @borrows module:twgl/textures.createTextures as createTextures
	   */

	  // make sure we don't see a global gl

	  var gl = undefined; // eslint-disable-line
	  var defaults = {
	    enableVertexArrayObjects: true
	  };

	  /**
	   * Various default settings for twgl.
	   *
	   * Note: You can call this any number of times. Example:
	   *
	   *     twgl.setDefaults({ textureColor: [1, 0, 0, 1] });
	   *     twgl.setDefaults({ attribPrefix: 'a_' });
	   *
	   * is equivalent to
	   *
	   *     twgl.setDefaults({
	   *       textureColor: [1, 0, 0, 1],
	   *       attribPrefix: 'a_',
	   *     });
	   *
	   * @typedef {Object} Defaults
	   * @property {string} attribPrefix The prefix to stick on attributes
	   *
	   *   When writing shaders I prefer to name attributes with `a_`, uniforms with `u_` and varyings with `v_`
	   *   as it makes it clear where they came from. But, when building geometry I prefer using unprefixed names.
	   *
	   *   In otherwords I'll create arrays of geometry like this
	   *
	   *       var arrays = {
	   *         position: ...
	   *         normal: ...
	   *         texcoord: ...
	   *       };
	   *
	   *   But need those mapped to attributes and my attributes start with `a_`.
	   *
	   *   Default: `""`
	   *
	   * @property {number[]} textureColor Array of 4 values in the range 0 to 1
	   *
	   *   The default texture color is used when loading textures from
	   *   urls. Because the URL will be loaded async we'd like to be
	   *   able to use the texture immediately. By putting a 1x1 pixel
	   *   color in the texture we can start using the texture before
	   *   the URL has loaded.
	   *
	   *   Default: `[0.5, 0.75, 1, 1]`
	   *
	   * @property {string} crossOrigin
	   *
	   *   If not undefined sets the crossOrigin attribute on images
	   *   that twgl creates when downloading images for textures.
	   *
	   *   Also see {@link module:twgl.TextureOptions}.
	   *
	   * @property {bool} enableVertexArrayObjects
	   *
	   *   If true then in WebGL 1.0 will attempt to get the `OES_vertex_array_object` extension.
	   *   If successful it will copy create/bind/delete/isVertexArrayOES from the extension to
	   *   the WebGLRenderingContext removing the OES at the end which is the standard entry point
	   *   for WebGL 2.
	   *
	   *   Note: According to webglstats.com 90% of devices support `OES_vertex_array_object`.
	   *   In fact AFAICT all devices support them it's just Microsoft Edge does not.
	   *   If you just want to count on support I suggest using [this polyfill](https://github.com/KhronosGroup/WebGL/blob/master/sdk/demos/google/resources/OESVertexArrayObject.js)
	   *   or ignoring devices that don't support them.
	   *
	   *   Default: `true`
	   *
	   * @memberOf module:twgl
	   */

	  /**
	   * Sets various defaults for twgl.
	   *
	   * In the interest of terseness which is kind of the point
	   * of twgl I've integrated a few of the older functions here
	   *
	   * @param {module:twgl.Defaults} newDefaults The default settings.
	   * @memberOf module:twgl
	   */
	  function setDefaults(newDefaults) {
	    utils.copyExistingProperties(newDefaults, defaults);
	    attributes.setDefaults_(newDefaults); // eslint-disable-line
	    textures.setDefaults_(newDefaults); // eslint-disable-line
	  }

	  /**
	   * Adds Vertex Array Objects to WebGL 1 GL contexts if available
	   * @param {WebGLRenderingContext} gl A WebGLRenderingContext
	   */
	  function addVertexArrayObjectSupport(gl) {
	    if (!gl || !defaults.enableVertexArrayObjects) {
	      return;
	    }
	    if (utils.isWebGL1(gl)) {
	      var ext = gl.getExtension("OES_vertex_array_object");
	      if (ext) {
	        gl.createVertexArray = function () {
	          return ext.createVertexArrayOES();
	        };
	        gl.deleteVertexArray = function (v) {
	          ext.deleteVertexArrayOES(v);
	        };
	        gl.isVertexArray = function (v) {
	          return ext.isVertexArrayOES(v);
	        };
	        gl.bindVertexArray = function (v) {
	          ext.bindVertexArrayOES(v);
	        };
	        gl.VERTEX_ARRAY_BINDING = ext.VERTEX_ARRAY_BINDING_OES;
	      }
	    }
	  }

	  /**
	   * Creates a webgl context.
	   * @param {HTMLCanvasElement} canvas The canvas tag to get
	   *     context from. If one is not passed in one will be
	   *     created.
	   * @return {WebGLRenderingContext} The created context.
	   */
	  function create3DContext(canvas, opt_attribs) {
	    var names = ["webgl", "experimental-webgl"];
	    var context = null;
	    for (var ii = 0; ii < names.length; ++ii) {
	      context = canvas.getContext(names[ii], opt_attribs);
	      if (context) {
	        break;
	      }
	    }
	    return context;
	  }

	  /**
	   * Gets a WebGL1 context.
	   *
	   * Note: Will attempt to enable Vertex Array Objects
	   * and add WebGL2 entry points. (unless you first set defaults with
	   * `twgl.setDefaults({enableVertexArrayObjects: false})`;
	   *
	   * @param {HTMLCanvasElement} canvas a canvas element.
	   * @param {WebGLContextCreationAttirbutes} [opt_attribs] optional webgl context creation attributes
	   * @memberOf module:twgl
	   */
	  function getWebGLContext(canvas, opt_attribs) {
	    var gl = create3DContext(canvas, opt_attribs);
	    addVertexArrayObjectSupport(gl);
	    return gl;
	  }

	  /**
	   * Creates a webgl context.
	   *
	   * Will return a WebGL2 context if possible.
	   *
	   * You can check if it's WebGL2 with
	   *
	   *     twgl.isWebGL2(gl);
	   *
	   * @param {HTMLCanvasElement} canvas The canvas tag to get
	   *     context from. If one is not passed in one will be
	   *     created.
	   * @return {WebGLRenderingContext} The created context.
	   */
	  function createContext(canvas, opt_attribs) {
	    var names = ["webgl2", "webgl", "experimental-webgl"];
	    var context = null;
	    for (var ii = 0; ii < names.length; ++ii) {
	      context = canvas.getContext(names[ii], opt_attribs);
	      if (context) {
	        break;
	      }
	    }
	    return context;
	  }

	  /**
	   * Gets a WebGL context.  Will create a WebGL2 context if possible.
	   *
	   * You can check if it's WebGL2 with
	   *
	   *    function isWebGL2(gl) {
	   *      return gl.getParameter(gl.VERSION).indexOf("WebGL 2.0 ") == 0;
	   *    }
	   *
	   * Note: For a WebGL1 context will attempt to enable Vertex Array Objects
	   * and add WebGL2 entry points. (unless you first set defaults with
	   * `twgl.setDefaults({enableVertexArrayObjects: false})`;
	   *
	   * @param {HTMLCanvasElement} canvas a canvas element.
	   * @param {WebGLContextCreationAttirbutes} [opt_attribs] optional webgl context creation attributes
	   * @return {WebGLRenderingContext} The created context.
	   * @memberOf module:twgl
	   */
	  function getContext(canvas, opt_attribs) {
	    var gl = createContext(canvas, opt_attribs);
	    addVertexArrayObjectSupport(gl);
	    return gl;
	  }

	  /**
	   * Resize a canvas to match the size it's displayed.
	   * @param {HTMLCanvasElement} canvas The canvas to resize.
	   * @param {number} [multiplier] So you can pass in `window.devicePixelRatio` if you want to.
	   * @return {boolean} true if the canvas was resized.
	   * @memberOf module:twgl
	   */
	  function resizeCanvasToDisplaySize(canvas, multiplier) {
	    multiplier = multiplier || 1;
	    multiplier = Math.max(1, multiplier);
	    var bounds = canvas.getBoundingClientRect();
	    var width = Math.round(bounds.width * multiplier);
	    var height = Math.round(bounds.height * multiplier);
	    if (canvas.width !== width || canvas.height !== height) {
	      canvas.width = width;
	      canvas.height = height;
	      return true;
	    }
	    return false;
	  }

	  // Using quotes prevents Uglify from changing the names.
	  // No speed diff AFAICT.
	  var api = {
	    "getContext": getContext,
	    "getWebGLContext": getWebGLContext,
	    "isWebGL1": utils.isWebGL1,
	    "isWebGL2": utils.isWebGL2,
	    "resizeCanvasToDisplaySize": resizeCanvasToDisplaySize,
	    "setDefaults": setDefaults
	  };

	  function notPrivate(name) {
	    return name[name.length - 1] !== '_';
	  }

	  function copyPublicProperties(src, dst) {
	    Object.keys(src).filter(notPrivate).forEach(function (key) {
	      dst[key] = src[key];
	    });
	    return dst;
	  }

	  var apis = {
	    attributes: attributes,
	    draw: draw,
	    framebuffers: framebuffers,
	    programs: programs,
	    textures: textures,
	    typedArrays: typedArrays,
	    vertexArrays: vertexArrays
	  };
	  Object.keys(apis).forEach(function (name) {
	    var srcApi = apis[name];
	    copyPublicProperties(srcApi, api);
	    api[name] = copyPublicProperties(srcApi, {});
	  });

	  return api;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	/*
	 * Copyright 2015, Gregg Tavares.
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *     * Redistributions of source code must retain the above copyright
	 * notice, this list of conditions and the following disclaimer.
	 *     * Redistributions in binary form must reproduce the above
	 * copyright notice, this list of conditions and the following disclaimer
	 * in the documentation and/or other materials provided with the
	 * distribution.
	 *     * Neither the name of Gregg Tavares. nor the names of his
	 * contributors may be used to endorse or promote products derived from
	 * this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(4)], __WEBPACK_AMD_DEFINE_RESULT__ = function (typedArrays, utils) {
	  "use strict";

	  /**
	   * Low level attribute and buffer related functions
	   *
	   * You should generally not need to use these functions. They are provided
	   * for those cases where you're doing something out of the ordinary
	   * and you need lower level access.
	   *
	   * For backward compatibily they are available at both `twgl.attributes` and `twgl`
	   * itself
	   *
	   * See {@link module:twgl} for core functions
	   *
	   * @module twgl/attributes
	   */

	  // make sure we don't see a global gl

	  var gl = undefined; // eslint-disable-line
	  var defaults = {
	    attribPrefix: ""
	  };

	  /**
	   * Sets the default attrib prefix
	   *
	   * When writing shaders I prefer to name attributes with `a_`, uniforms with `u_` and varyings with `v_`
	   * as it makes it clear where they came from. But, when building geometry I prefer using unprefixed names.
	   *
	   * In otherwords I'll create arrays of geometry like this
	   *
	   *     var arrays = {
	   *       position: ...
	   *       normal: ...
	   *       texcoord: ...
	   *     };
	   *
	   * But need those mapped to attributes and my attributes start with `a_`.
	   *
	   * @deprecated see {@link module:twgl.setDefaults}
	   * @param {string} prefix prefix for attribs
	   * @memberOf module:twgl/attributes
	   */
	  function setAttributePrefix(prefix) {
	    defaults.attribPrefix = prefix;
	  }

	  function setDefaults(newDefaults) {
	    utils.copyExistingProperties(newDefaults, defaults);
	  }

	  function setBufferFromTypedArray(gl, type, buffer, array, drawType) {
	    gl.bindBuffer(type, buffer);
	    gl.bufferData(type, array, drawType || gl.STATIC_DRAW);
	  }

	  /**
	   * Given typed array creates a WebGLBuffer and copies the typed array
	   * into it.
	   *
	   * @param {WebGLRenderingContext} gl A WebGLRenderingContext
	   * @param {ArrayBuffer|ArrayBufferView|WebGLBuffer} typedArray the typed array. Note: If a WebGLBuffer is passed in it will just be returned. No action will be taken
	   * @param {number} [type] the GL bind type for the buffer. Default = `gl.ARRAY_BUFFER`.
	   * @param {number} [drawType] the GL draw type for the buffer. Default = 'gl.STATIC_DRAW`.
	   * @return {WebGLBuffer} the created WebGLBuffer
	   * @memberOf module:twgl/attributes
	   */
	  function createBufferFromTypedArray(gl, typedArray, type, drawType) {
	    if (typedArray instanceof WebGLBuffer) {
	      return typedArray;
	    }
	    type = type || gl.ARRAY_BUFFER;
	    var buffer = gl.createBuffer();
	    setBufferFromTypedArray(gl, type, buffer, typedArray, drawType);
	    return buffer;
	  }

	  function isIndices(name) {
	    return name === "indices";
	  }

	  // This is really just a guess. Though I can't really imagine using
	  // anything else? Maybe for some compression?
	  function getNormalizationForTypedArray(typedArray) {
	    if (typedArray instanceof Int8Array) {
	      return true;
	    } // eslint-disable-line
	    if (typedArray instanceof Uint8Array) {
	      return true;
	    } // eslint-disable-line
	    return false;
	  }

	  // This is really just a guess. Though I can't really imagine using
	  // anything else? Maybe for some compression?
	  function getNormalizationForTypedArrayType(typedArrayType) {
	    if (typedArrayType === Int8Array) {
	      return true;
	    } // eslint-disable-line
	    if (typedArrayType === Uint8Array) {
	      return true;
	    } // eslint-disable-line
	    return false;
	  }

	  function getArray(array) {
	    return array.length ? array : array.data;
	  }

	  var texcoordRE = /coord|texture/i;
	  var colorRE = /color|colour/i;

	  function guessNumComponentsFromName(name, length) {
	    var numComponents;
	    if (texcoordRE.test(name)) {
	      numComponents = 2;
	    } else if (colorRE.test(name)) {
	      numComponents = 4;
	    } else {
	      numComponents = 3; // position, normals, indices ...
	    }

	    if (length % numComponents > 0) {
	      throw "Can not guess numComponents for attribute '" + name + "'. Tried " + numComponents + " but " + length + " values is not evenly divisible by " + numComponents + ". You should specify it.";
	    }

	    return numComponents;
	  }

	  function getNumComponents(array, arrayName) {
	    return array.numComponents || array.size || guessNumComponentsFromName(arrayName, getArray(array).length);
	  }

	  function makeTypedArray(array, name) {
	    if (typedArrays.isArrayBuffer(array)) {
	      return array;
	    }

	    if (typedArrays.isArrayBuffer(array.data)) {
	      return array.data;
	    }

	    if (Array.isArray(array)) {
	      array = {
	        data: array
	      };
	    }

	    var Type = array.type;
	    if (!Type) {
	      if (isIndices(name)) {
	        Type = Uint16Array;
	      } else {
	        Type = Float32Array;
	      }
	    }
	    return new Type(array.data);
	  }

	  /**
	   * The info for an attribute. This is effectively just the arguments to `gl.vertexAttribPointer` plus the WebGLBuffer
	   * for the attribute.
	   *
	   * @typedef {Object} AttribInfo
	   * @property {number} [numComponents] the number of components for this attribute.
	   * @property {number} [size] synonym for `numComponents`.
	   * @property {number} [type] the type of the attribute (eg. `gl.FLOAT`, `gl.UNSIGNED_BYTE`, etc...) Default = `gl.FLOAT`
	   * @property {boolean} [normalize] whether or not to normalize the data. Default = false
	   * @property {number} [offset] offset into buffer in bytes. Default = 0
	   * @property {number} [stride] the stride in bytes per element. Default = 0
	   * @property {WebGLBuffer} buffer the buffer that contains the data for this attribute
	   * @property {number} [drawType] the draw type passed to gl.bufferData. Default = gl.STATIC_DRAW
	   * @memberOf module:twgl
	   */

	  /**
	   * Use this type of array spec when TWGL can't guess the type or number of compoments of an array
	   * @typedef {Object} FullArraySpec
	   * @property {(number|number[]|ArrayBuffer)} data The data of the array. A number alone becomes the number of elements of type.
	   * @property {number} [numComponents] number of components for `vertexAttribPointer`. Default is based on the name of the array.
	   *    If `coord` is in the name assumes `numComponents = 2`.
	   *    If `color` is in the name assumes `numComponents = 4`.
	   *    otherwise assumes `numComponents = 3`
	   * @property {constructor} type The type. This is only used if `data` is a JavaScript array. It is the constructor for the typedarray. (eg. `Uint8Array`).
	   * For example if you want colors in a `Uint8Array` you might have a `FullArraySpec` like `{ type: Uint8Array, data: [255,0,255,255, ...], }`.
	   * @property {number} [size] synonym for `numComponents`.
	   * @property {boolean} [normalize] normalize for `vertexAttribPointer`. Default is true if type is `Int8Array` or `Uint8Array` otherwise false.
	   * @property {number} [stride] stride for `vertexAttribPointer`. Default = 0
	   * @property {number} [offset] offset for `vertexAttribPointer`. Default = 0
	   * @property {string} [attrib] name of attribute this array maps to. Defaults to same name as array prefixed by the default attribPrefix.
	   * @property {string} [name] synonym for `attrib`.
	   * @property {string} [attribName] synonym for `attrib`.
	   * @memberOf module:twgl
	   */

	  /**
	   * An individual array in {@link module:twgl.Arrays}
	   *
	   * When passed to {@link module:twgl.createBufferInfoFromArrays} if an ArraySpec is `number[]` or `ArrayBuffer`
	   * the types will be guessed based on the name. `indices` will be `Uint16Array`, everything else will
	   * be `Float32Array`. If an ArraySpec is a number it's the number of floats for an empty (zeroed) buffer.
	   *
	   * @typedef {(number|number[]|ArrayBuffer|module:twgl.FullArraySpec)} ArraySpec
	   * @memberOf module:twgl
	   */

	  /**
	   * This is a JavaScript object of arrays by name. The names should match your shader's attributes. If your
	   * attributes have a common prefix you can specify it by calling {@link module:twgl.setAttributePrefix}.
	   *
	   *     Bare JavaScript Arrays
	   *
	   *         var arrays = {
	   *            position: [-1, 1, 0],
	   *            normal: [0, 1, 0],
	   *            ...
	   *         }
	   *
	   *     Bare TypedArrays
	   *
	   *         var arrays = {
	   *            position: new Float32Array([-1, 1, 0]),
	   *            color: new Uint8Array([255, 128, 64, 255]),
	   *            ...
	   *         }
	   *
	   * *   Will guess at `numComponents` if not specified based on name.
	   *
	   *     If `coord` is in the name assumes `numComponents = 2`
	   *
	   *     If `color` is in the name assumes `numComponents = 4`
	   *
	   *     otherwise assumes `numComponents = 3`
	   *
	   * Objects with various fields. See {@link module:twgl.FullArraySpec}.
	   *
	   *     var arrays = {
	   *       position: { numComponents: 3, data: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0], },
	   *       texcoord: { numComponents: 2, data: [0, 0, 0, 1, 1, 0, 1, 1],                 },
	   *       normal:   { numComponents: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],     },
	   *       indices:  { numComponents: 3, data: [0, 1, 2, 1, 2, 3],                       },
	   *     };
	   *
	   * @typedef {Object.<string, module:twgl.ArraySpec>} Arrays
	   * @memberOf module:twgl
	   */

	  /**
	   * Creates a set of attribute data and WebGLBuffers from set of arrays
	   *
	   * Given
	   *
	   *      var arrays = {
	   *        position: { numComponents: 3, data: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0], },
	   *        texcoord: { numComponents: 2, data: [0, 0, 0, 1, 1, 0, 1, 1],                 },
	   *        normal:   { numComponents: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],     },
	   *        color:    { numComponents: 4, data: [255, 255, 255, 255, 255, 0, 0, 255, 0, 0, 255, 255], type: Uint8Array, },
	   *        indices:  { numComponents: 3, data: [0, 1, 2, 1, 2, 3],                       },
	   *      };
	   *
	   * returns something like
	   *
	   *      var attribs = {
	   *        position: { numComponents: 3, type: gl.FLOAT,         normalize: false, buffer: WebGLBuffer, },
	   *        texcoord: { numComponents: 2, type: gl.FLOAT,         normalize: false, buffer: WebGLBuffer, },
	   *        normal:   { numComponents: 3, type: gl.FLOAT,         normalize: false, buffer: WebGLBuffer, },
	   *        color:    { numComponents: 4, type: gl.UNSIGNED_BYTE, normalize: true,  buffer: WebGLBuffer, },
	   *      };
	   *
	   * notes:
	   *
	   * *   Arrays can take various forms
	   *
	   *     Bare JavaScript Arrays
	   *
	   *         var arrays = {
	   *            position: [-1, 1, 0],
	   *            normal: [0, 1, 0],
	   *            ...
	   *         }
	   *
	   *     Bare TypedArrays
	   *
	   *         var arrays = {
	   *            position: new Float32Array([-1, 1, 0]),
	   *            color: new Uint8Array([255, 128, 64, 255]),
	   *            ...
	   *         }
	   *
	   * *   Will guess at `numComponents` if not specified based on name.
	   *
	   *     If `coord` is in the name assumes `numComponents = 2`
	   *
	   *     If `color` is in the name assumes `numComponents = 4`
	   *
	   *     otherwise assumes `numComponents = 3`
	   *
	   * @param {WebGLRenderingContext} gl The webgl rendering context.
	   * @param {module:twgl.Arrays} arrays The arrays
	   * @return {Object.<string, module:twgl.AttribInfo>} the attribs
	   * @memberOf module:twgl/attributes
	   */
	  function createAttribsFromArrays(gl, arrays) {
	    var attribs = {};
	    Object.keys(arrays).forEach(function (arrayName) {
	      if (!isIndices(arrayName)) {
	        var array = arrays[arrayName];
	        var attribName = array.attrib || array.name || array.attribName || defaults.attribPrefix + arrayName;
	        var buffer;
	        var type;
	        var normalization;
	        var numComponents;
	        var numValues;
	        if (typeof array === "number" || typeof array.data === "number") {
	          numValues = array.data || array;
	          var arrayType = array.type || Float32Array;
	          var numBytes = numValues * arrayType.BYTES_PER_ELEMENT;
	          type = typedArrays.getGLTypeForTypedArrayType(arrayType);
	          normalization = array.normalize !== undefined ? array.normalize : getNormalizationForTypedArrayType(arrayType);
	          numComponents = array.numComponents || array.size || guessNumComponentsFromName(arrayName, numValues);
	          buffer = gl.createBuffer();
	          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	          gl.bufferData(gl.ARRAY_BUFFER, numBytes, array.drawType || gl.STATIC_DRAW);
	        } else {
	          var typedArray = makeTypedArray(array, arrayName);
	          buffer = createBufferFromTypedArray(gl, typedArray, undefined, array.drawType);
	          type = typedArrays.getGLTypeForTypedArray(typedArray);
	          normalization = array.normalize !== undefined ? array.normalize : getNormalizationForTypedArray(typedArray);
	          numComponents = getNumComponents(array, arrayName);
	          numValues = typedArray.length;
	        }
	        attribs[attribName] = {
	          buffer: buffer,
	          numComponents: numComponents,
	          type: type,
	          normalize: normalization,
	          stride: array.stride || 0,
	          offset: array.offset || 0,
	          drawType: array.drawType
	        };
	      }
	    });
	    gl.bindBuffer(gl.ARRAY_BUFFER, null);
	    return attribs;
	  }

	  /**
	   * Sets the contents of a buffer attached to an attribInfo
	   *
	   * This is helper function to dynamically update a buffer.
	   *
	   * Let's say you make a bufferInfo
	   *
	   *     var arrays = {
	   *        position: new Float32Array([0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0]),
	   *        texcoord: new Float32Array([0, 0, 0, 1, 1, 0, 1, 1]),
	   *        normal:   new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]),
	   *        indices:  new Uint16Array([0, 1, 2, 1, 2, 3]),
	   *     };
	   *     var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
	   *
	   *  And you want to dynamically upate the positions. You could do this
	   *
	   *     // assuming arrays.position has already been updated with new data.
	   *     twgl.setAttribInfoBufferFromArray(gl, bufferInfo.attribs.position, arrays.position);
	   *
	   * @param {WebGLRenderingContext} gl
	   * @param {AttribInfo} attribInfo The attribInfo who's buffer contents to set. NOTE: If you have an attribute prefix
	   *   the name of the attribute will include the prefix.
	   * @param {ArraySpec} array Note: it is arguably ineffient to pass in anything but a typed array because anything
	   *    else will have to be converted to a typed array before it can be used by WebGL. During init time that
	   *    inefficiency is usually not important but if you're updating data dynamically best to be efficient.
	   * @param {number} [offset] an optional offset into the buffer. This is only an offset into the WebGL buffer
	   *    not the array. To pass in an offset into the array itself use a typed array and create an `ArrayBufferView`
	   *    for the portion of the array you want to use.
	   *
	   *        var someArray = new Float32Array(1000); // an array with 1000 floats
	   *        var someSubArray = new Float32Array(someArray.buffer, offsetInBytes, sizeInUnits); // a view into someArray
	   *
	   *    Now you can pass `someSubArray` into setAttribInfoBufferFromArray`
	   * @memberOf module:twgl/attributes
	   */
	  function setAttribInfoBufferFromArray(gl, attribInfo, array, offset) {
	    array = makeTypedArray(array);
	    if (offset !== undefined) {
	      gl.bindBuffer(gl.ARRAY_BUFFER, attribInfo.buffer);
	      gl.bufferSubData(gl.ARRAY_BUFFER, offset, array);
	    } else {
	      setBufferFromTypedArray(gl, gl.ARRAY_BUFFER, attribInfo.buffer, array, attribInfo.drawType);
	    }
	  }

	  function getBytesPerValueForGLType(gl, type) {
	    if (type === gl.BYTE) return 1; // eslint-disable-line
	    if (type === gl.UNSIGNED_BYTE) return 1; // eslint-disable-line
	    if (type === gl.SHORT) return 2; // eslint-disable-line
	    if (type === gl.UNSIGNED_SHORT) return 2; // eslint-disable-line
	    if (type === gl.INT) return 4; // eslint-disable-line
	    if (type === gl.UNSIGNED_INT) return 4; // eslint-disable-line
	    if (type === gl.FLOAT) return 4; // eslint-disable-line
	    return 0;
	  }

	  /**
	   * tries to get the number of elements from a set of arrays.
	   */
	  var positionKeys = ['position', 'positions', 'a_position'];
	  function getNumElementsFromNonIndexedArrays(arrays) {
	    var key;
	    for (var ii = 0; ii < positionKeys.length; ++ii) {
	      key = positionKeys[ii];
	      if (key in arrays) {
	        break;
	      }
	    }
	    if (ii === positionKeys.length) {
	      key = Object.keys(arrays)[0];
	    }
	    var array = arrays[key];
	    var length = getArray(array).length;
	    var numComponents = getNumComponents(array, key);
	    var numElements = length / numComponents;
	    if (length % numComponents > 0) {
	      throw "numComponents " + numComponents + " not correct for length " + length;
	    }
	    return numElements;
	  }

	  function getNumElementsFromAttributes(gl, attribs) {
	    var key;
	    for (var ii = 0; ii < positionKeys.length; ++ii) {
	      key = positionKeys[ii];
	      if (key in attribs) {
	        break;
	      }
	      key = defaults.attribPrefix + key;
	      if (key in attribs) {
	        break;
	      }
	    }
	    if (ii === positionKeys.length) {
	      key = Object.keys(attribs)[0];
	    }
	    var attrib = attribs[key];
	    gl.bindBuffer(gl.ARRAY_BUFFER, attrib.buffer);
	    var numBytes = gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE);
	    gl.bindBuffer(gl.ARRAY_BUFFER, null);

	    var bytesPerValue = getBytesPerValueForGLType(gl, attrib.type);
	    var totalElements = numBytes / bytesPerValue;
	    var numComponents = attrib.numComponents || attrib.size;
	    // TODO: check stride
	    var numElements = totalElements / numComponents;
	    if (numElements % 1 !== 0) {
	      throw "numComponents " + numComponents + " not correct for length " + length;
	    }
	    return numElements;
	  }

	  /**
	   * @typedef {Object} BufferInfo
	   * @property {number} numElements The number of elements to pass to `gl.drawArrays` or `gl.drawElements`.
	   * @property {number} [elementType] The type of indices `UNSIGNED_BYTE`, `UNSIGNED_SHORT` etc..
	   * @property {WebGLBuffer} [indices] The indices `ELEMENT_ARRAY_BUFFER` if any indices exist.
	   * @property {Object.<string, module:twgl.AttribInfo>} [attribs] The attribs approriate to call `setAttributes`
	   * @memberOf module:twgl
	   */

	  /**
	   * Creates a BufferInfo from an object of arrays.
	   *
	   * This can be passed to {@link module:twgl.setBuffersAndAttributes} and to
	   * {@link module:twgl:drawBufferInfo}.
	   *
	   * Given an object like
	   *
	   *     var arrays = {
	   *       position: { numComponents: 3, data: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0], },
	   *       texcoord: { numComponents: 2, data: [0, 0, 0, 1, 1, 0, 1, 1],                 },
	   *       normal:   { numComponents: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],     },
	   *       indices:  { numComponents: 3, data: [0, 1, 2, 1, 2, 3],                       },
	   *     };
	   *
	   *  Creates an BufferInfo like this
	   *
	   *     bufferInfo = {
	   *       numElements: 4,        // or whatever the number of elements is
	   *       indices: WebGLBuffer,  // this property will not exist if there are no indices
	   *       attribs: {
	   *         a_position: { buffer: WebGLBuffer, numComponents: 3, },
	   *         a_normal:   { buffer: WebGLBuffer, numComponents: 3, },
	   *         a_texcoord: { buffer: WebGLBuffer, numComponents: 2, },
	   *       },
	   *     };
	   *
	   *  The properties of arrays can be JavaScript arrays in which case the number of components
	   *  will be guessed.
	   *
	   *     var arrays = {
	   *        position: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0],
	   *        texcoord: [0, 0, 0, 1, 1, 0, 1, 1],
	   *        normal:   [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
	   *        indices:  [0, 1, 2, 1, 2, 3],
	   *     };
	   *
	   *  They can also by TypedArrays
	   *
	   *     var arrays = {
	   *        position: new Float32Array([0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0]),
	   *        texcoord: new Float32Array([0, 0, 0, 1, 1, 0, 1, 1]),
	   *        normal:   new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]),
	   *        indices:  new Uint16Array([0, 1, 2, 1, 2, 3]),
	   *     };
	   *
	   *  Or augmentedTypedArrays
	   *
	   *     var positions = createAugmentedTypedArray(3, 4);
	   *     var texcoords = createAugmentedTypedArray(2, 4);
	   *     var normals   = createAugmentedTypedArray(3, 4);
	   *     var indices   = createAugmentedTypedArray(3, 2, Uint16Array);
	   *
	   *     positions.push([0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0]);
	   *     texcoords.push([0, 0, 0, 1, 1, 0, 1, 1]);
	   *     normals.push([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
	   *     indices.push([0, 1, 2, 1, 2, 3]);
	   *
	   *     var arrays = {
	   *        position: positions,
	   *        texcoord: texcoords,
	   *        normal:   normals,
	   *        indices:  indices,
	   *     };
	   *
	   * For the last example it is equivalent to
	   *
	   *     var bufferInfo = {
	   *       attribs: {
	   *         a_position: { numComponents: 3, buffer: gl.createBuffer(), },
	   *         a_texcoods: { numComponents: 2, buffer: gl.createBuffer(), },
	   *         a_normals: { numComponents: 3, buffer: gl.createBuffer(), },
	   *       },
	   *       indices: gl.createBuffer(),
	   *       numElements: 6,
	   *     };
	   *
	   *     gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.attribs.a_position.buffer);
	   *     gl.bufferData(gl.ARRAY_BUFFER, arrays.position, gl.STATIC_DRAW);
	   *     gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.attribs.a_texcoord.buffer);
	   *     gl.bufferData(gl.ARRAY_BUFFER, arrays.texcoord, gl.STATIC_DRAW);
	   *     gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.attribs.a_normal.buffer);
	   *     gl.bufferData(gl.ARRAY_BUFFER, arrays.normal, gl.STATIC_DRAW);
	   *     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferInfo.indices);
	   *     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, arrays.indices, gl.STATIC_DRAW);
	   *
	   * @param {WebGLRenderingContext} gl A WebGLRenderingContext
	   * @param {module:twgl.Arrays} arrays Your data
	   * @return {module:twgl.BufferInfo} A BufferInfo
	   * @memberOf module:twgl/attributes
	   */
	  function createBufferInfoFromArrays(gl, arrays) {
	    var bufferInfo = {
	      attribs: createAttribsFromArrays(gl, arrays)
	    };
	    var indices = arrays.indices;
	    if (indices) {
	      indices = makeTypedArray(indices, "indices");
	      bufferInfo.indices = createBufferFromTypedArray(gl, indices, gl.ELEMENT_ARRAY_BUFFER);
	      bufferInfo.numElements = indices.length;
	      bufferInfo.elementType = typedArrays.getGLTypeForTypedArray(indices);
	    } else {
	      bufferInfo.numElements = getNumElementsFromAttributes(gl, bufferInfo.attribs);
	    }

	    return bufferInfo;
	  }

	  /**
	   * Creates a buffer from an array, typed array, or array spec
	   *
	   * Given something like this
	   *
	   *     [1, 2, 3],
	   *
	   * or
	   *
	   *     new Uint16Array([1,2,3]);
	   *
	   * or
	   *
	   *     {
	   *        data: [1, 2, 3],
	   *        type: Uint8Array,
	   *     }
	   *
	   * returns a WebGLBuffer that constains the given data.
	   *
	   * @param {WebGLRenderingContext} gl A WebGLRenderingContext.
	   * @param {module:twgl.ArraySpec} array an array, typed array, or array spec.
	   * @param {string} arrayName name of array. Used to guess the type if type can not be dervied other wise.
	   * @return {WebGLBuffer} a WebGLBuffer containing the data in array.
	   * @memberOf module:twgl/attributes
	   */
	  function createBufferFromArray(gl, array, arrayName) {
	    var type = arrayName === "indices" ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
	    var typedArray = makeTypedArray(array, arrayName);
	    return createBufferFromTypedArray(gl, typedArray, type);
	  }

	  /**
	   * Creates buffers from arrays or typed arrays
	   *
	   * Given something like this
	   *
	   *     var arrays = {
	   *        positions: [1, 2, 3],
	   *        normals: [0, 0, 1],
	   *     }
	   *
	   * returns something like
	   *
	   *     buffers = {
	   *       positions: WebGLBuffer,
	   *       normals: WebGLBuffer,
	   *     }
	   *
	   * If the buffer is named 'indices' it will be made an ELEMENT_ARRAY_BUFFER.
	   *
	   * @param {WebGLRenderingContext} gl A WebGLRenderingContext.
	   * @param {module:twgl.Arrays} arrays
	   * @return {Object<string, WebGLBuffer>} returns an object with one WebGLBuffer per array
	   * @memberOf module:twgl/attributes
	   */
	  function createBuffersFromArrays(gl, arrays) {
	    var buffers = {};
	    Object.keys(arrays).forEach(function (key) {
	      buffers[key] = createBufferFromArray(gl, arrays[key], key);
	    });

	    // Ugh!
	    if (arrays.indices) {
	      buffers.numElements = arrays.indices.length;
	      buffers.elementType = typedArrays.getGLTypeForTypedArray(makeTypedArray(arrays.indices), 'indices');
	    } else {
	      buffers.numElements = getNumElementsFromNonIndexedArrays(arrays);
	    }

	    return buffers;
	  }

	  // Using quotes prevents Uglify from changing the names.
	  // No speed diff AFAICT.
	  return {
	    "createAttribsFromArrays": createAttribsFromArrays,
	    "createBuffersFromArrays": createBuffersFromArrays,
	    "createBufferFromArray": createBufferFromArray,
	    "createBufferFromTypedArray": createBufferFromTypedArray,
	    "createBufferInfoFromArrays": createBufferInfoFromArrays,
	    "setAttribInfoBufferFromArray": setAttribInfoBufferFromArray,

	    "setAttributePrefix": setAttributePrefix,

	    "setDefaults_": setDefaults,
	    "getNumComponents_": getNumComponents,
	    "getArray_": getArray
	  };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;"use strict";

	/*
	 * Copyright 2015, Gregg Tavares.
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *     * Redistributions of source code must retain the above copyright
	 * notice, this list of conditions and the following disclaimer.
	 *     * Redistributions in binary form must reproduce the above
	 * copyright notice, this list of conditions and the following disclaimer
	 * in the documentation and/or other materials provided with the
	 * distribution.
	 *     * Neither the name of Gregg Tavares. nor the names of his
	 * contributors may be used to endorse or promote products derived from
	 * this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */
	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {
	  "use strict";

	  /**
	   * Low level shader typed array related functions
	   *
	   * You should generally not need to use these functions. They are provided
	   * for those cases where you're doing something out of the ordinary
	   * and you need lower level access.
	   *
	   * For backward compatibily they are available at both `twgl.typedArray` and `twgl`
	   * itself
	   *
	   * See {@link module:twgl} for core functions
	   *
	   * @module twgl/typedArray
	   */

	  // make sure we don't see a global gl

	  var gl = undefined; // eslint-disable-line

	  /* DataType */
	  var BYTE = 0x1400;
	  var UNSIGNED_BYTE = 0x1401;
	  var SHORT = 0x1402;
	  var UNSIGNED_SHORT = 0x1403;
	  var INT = 0x1404;
	  var UNSIGNED_INT = 0x1405;
	  var FLOAT = 0x1406;
	  var UNSIGNED_SHORT_4_4_4_4 = 0x8033;
	  var UNSIGNED_SHORT_5_5_5_1 = 0x8034;
	  var UNSIGNED_SHORT_5_6_5 = 0x8363;
	  var HALF_FLOAT = 0x140B;
	  var UNSIGNED_INT_2_10_10_10_REV = 0x8368;
	  var UNSIGNED_INT_10F_11F_11F_REV = 0x8C3B;
	  var UNSIGNED_INT_5_9_9_9_REV = 0x8C3E;
	  var FLOAT_32_UNSIGNED_INT_24_8_REV = 0x8DAD;
	  var UNSIGNED_INT_24_8 = 0x84FA;

	  var glTypeToTypedArray = {};
	  {
	    var tt = glTypeToTypedArray;
	    tt[BYTE] = Int8Array;
	    tt[UNSIGNED_BYTE] = Uint8Array;
	    tt[SHORT] = Int16Array;
	    tt[UNSIGNED_SHORT] = Uint16Array;
	    tt[INT] = Int32Array;
	    tt[UNSIGNED_INT] = Uint32Array;
	    tt[FLOAT] = Float32Array;
	    tt[UNSIGNED_SHORT_4_4_4_4] = Uint16Array;
	    tt[UNSIGNED_SHORT_5_5_5_1] = Uint16Array;
	    tt[UNSIGNED_SHORT_5_6_5] = Uint16Array;
	    tt[HALF_FLOAT] = Uint16Array;
	    tt[UNSIGNED_INT_2_10_10_10_REV] = Uint32Array;
	    tt[UNSIGNED_INT_10F_11F_11F_REV] = Uint32Array;
	    tt[UNSIGNED_INT_5_9_9_9_REV] = Uint32Array;
	    tt[FLOAT_32_UNSIGNED_INT_24_8_REV] = Uint32Array;
	    tt[UNSIGNED_INT_24_8] = Uint32Array;
	  }

	  /**
	   * Get the GL type for a typedArray
	   * @param {ArrayBuffer|ArrayBufferView} typedArray a typedArray
	   * @return {number} the GL type for array. For example pass in an `Int8Array` and `gl.BYTE` will
	   *   be returned. Pass in a `Uint32Array` and `gl.UNSIGNED_INT` will be returned
	   * @memberOf module:twgl/typedArray
	   */
	  function getGLTypeForTypedArray(typedArray) {
	    if (typedArray instanceof Int8Array) {
	      return BYTE;
	    } // eslint-disable-line
	    if (typedArray instanceof Uint8Array) {
	      return UNSIGNED_BYTE;
	    } // eslint-disable-line
	    if (typedArray instanceof Uint8ClampedArray) {
	      return UNSIGNED_BYTE;
	    } // eslint-disable-line
	    if (typedArray instanceof Int16Array) {
	      return SHORT;
	    } // eslint-disable-line
	    if (typedArray instanceof Uint16Array) {
	      return UNSIGNED_SHORT;
	    } // eslint-disable-line
	    if (typedArray instanceof Int32Array) {
	      return INT;
	    } // eslint-disable-line
	    if (typedArray instanceof Uint32Array) {
	      return UNSIGNED_INT;
	    } // eslint-disable-line
	    if (typedArray instanceof Float32Array) {
	      return FLOAT;
	    } // eslint-disable-line
	    throw "unsupported typed array type";
	  }

	  /**
	   * Get the GL type for a typedArray type
	   * @param {ArrayBufferViewType} typedArrayType a typedArray constructor
	   * @return {number} the GL type for type. For example pass in `Int8Array` and `gl.BYTE` will
	   *   be returned. Pass in `Uint32Array` and `gl.UNSIGNED_INT` will be returned
	   * @memberOf module:twgl/typedArray
	   */
	  function getGLTypeForTypedArrayType(typedArrayType) {
	    if (typedArrayType === Int8Array) {
	      return BYTE;
	    } // eslint-disable-line
	    if (typedArrayType === Uint8Array) {
	      return UNSIGNED_BYTE;
	    } // eslint-disable-line
	    if (typedArrayType === Uint8ClampedArray) {
	      return UNSIGNED_BYTE;
	    } // eslint-disable-line
	    if (typedArrayType === Int16Array) {
	      return SHORT;
	    } // eslint-disable-line
	    if (typedArrayType === Uint16Array) {
	      return UNSIGNED_SHORT;
	    } // eslint-disable-line
	    if (typedArrayType === Int32Array) {
	      return INT;
	    } // eslint-disable-line
	    if (typedArrayType === Uint32Array) {
	      return UNSIGNED_INT;
	    } // eslint-disable-line
	    if (typedArrayType === Float32Array) {
	      return FLOAT;
	    } // eslint-disable-line
	    throw "unsupported typed array type";
	  }

	  /**
	   * Get the typed array constructor for a given GL type
	   * @param {number} type the GL type. (eg: `gl.UNSIGNED_INT`)
	   * @return {function} the constructor for a the corresponding typed array. (eg. `Uint32Array`).
	   * @memberOf module:twgl/typedArray
	   */
	  function getTypedArrayTypeForGLType(type) {
	    var CTOR = glTypeToTypedArray[type];
	    if (!CTOR) {
	      throw "unknown gl type";
	    }
	    return CTOR;
	  }

	  function isArrayBuffer(a) {
	    return a && a.buffer && a.buffer instanceof ArrayBuffer;
	  }

	  // Using quotes prevents Uglify from changing the names.
	  return {
	    "getGLTypeForTypedArray": getGLTypeForTypedArray,
	    "getGLTypeForTypedArrayType": getGLTypeForTypedArrayType,
	    "getTypedArrayTypeForGLType": getTypedArrayTypeForGLType,
	    "isArrayBuffer": isArrayBuffer
	  };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;"use strict";

	/*
	 * Copyright 2015, Gregg Tavares.
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *     * Redistributions of source code must retain the above copyright
	 * notice, this list of conditions and the following disclaimer.
	 *     * Redistributions in binary form must reproduce the above
	 * copyright notice, this list of conditions and the following disclaimer
	 * in the documentation and/or other materials provided with the
	 * distribution.
	 *     * Neither the name of Gregg Tavares. nor the names of his
	 * contributors may be used to endorse or promote products derived from
	 * this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {
	  "use strict";

	  /**
	   * Copy an object 1 level deep
	   * @param {object} src object to copy
	   * @return {object} the copy
	   */

	  function shallowCopy(src) {
	    var dst = {};
	    Object.keys(src).forEach(function (key) {
	      dst[key] = src[key];
	    });
	    return dst;
	  }

	  /**
	   * Copy named properties
	   *
	   * @param {string[]} names names of properties to copy
	   * @param {object} src object to copy properties from
	   * @param {object} dst object to copy properties to
	   */
	  function copyNamedProperties(names, src, dst) {
	    names.forEach(function (name) {
	      var value = src[name];
	      if (value !== undefined) {
	        dst[name] = value;
	      }
	    });
	  }

	  /**
	   * Copies properties from source to dest only if a matching key is in dest
	   *
	   * @param {Object.<string, ?>} src the source
	   * @param {Object.<string, ?>} dst the dest
	   */
	  function copyExistingProperties(src, dst) {
	    Object.keys(dst).forEach(function (key) {
	      if (dst.hasOwnProperty(key) && src.hasOwnProperty(key)) {
	        dst[key] = src[key];
	      }
	    });
	  }

	  /**
	   * Gets the gl version as a number
	   * @param {WebGLRenderingContext} gl A WebGLRenderingContext
	   * @return {number} version of gl
	   */
	  //function getVersionAsNumber(gl) {
	  //  return parseFloat(gl.getParameter(gl.VERSION).substr(6));
	  //}

	  /**
	   * Check if context is WebGL 2.0
	   * @param {WebGLRenderingContext} gl A WebGLRenderingContext
	   * @return {bool} true if it's WebGL 2.0
	   * @memberOf module:twgl
	   */
	  function isWebGL2(gl) {
	    // This is the correct check but it's slow
	    //return gl.getParameter(gl.VERSION).indexOf("WebGL 2.0") === 0;
	    // This might also be the correct check but I'm assuming it's slow-ish
	    // return gl instanceof WebGL2RenderingContext;
	    return !!gl.texStorage2D;
	  }

	  /**
	   * Check if context is WebGL 1.0
	   * @param {WebGLRenderingContext} gl A WebGLRenderingContext
	   * @return {bool} true if it's WebGL 1.0
	   * @memberOf module:twgl
	   */
	  function isWebGL1(gl) {
	    // This is the correct check but it's slow
	    //var version = getVersionAsNumber(gl);
	    //return version <= 1.0 && version > 0.0;  // because as of 2016/5 Edge returns 0.96
	    // This might also be the correct check but I'm assuming it's slow-ish
	    // return gl instanceof WebGLRenderingContext;
	    return !gl.texStorage2D;
	  }

	  var error = window.console && window.console.error && typeof window.console.error === "function" ? window.console.error.bind(window.console) : function () {};

	  var warn = window.console && window.console.warn && typeof window.console.warn === "function" ? window.console.warn.bind(window.console) : function () {};

	  return {
	    copyExistingProperties: copyExistingProperties,
	    copyNamedProperties: copyNamedProperties,
	    shallowCopy: shallowCopy,
	    isWebGL1: isWebGL1,
	    isWebGL2: isWebGL2,
	    error: error,
	    warn: warn
	  };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;"use strict";

	/*
	 * Copyright 2015, Gregg Tavares.
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *     * Redistributions of source code must retain the above copyright
	 * notice, this list of conditions and the following disclaimer.
	 *     * Redistributions in binary form must reproduce the above
	 * copyright notice, this list of conditions and the following disclaimer
	 * in the documentation and/or other materials provided with the
	 * distribution.
	 *     * Neither the name of Gregg Tavares. nor the names of his
	 * contributors may be used to endorse or promote products derived from
	 * this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(6)], __WEBPACK_AMD_DEFINE_RESULT__ = function (programs) {
	  "use strict";

	  /**
	   * Drawing related functions
	   *
	   * For backward compatibily they are available at both `twgl.draw` and `twgl`
	   * itself
	   *
	   * See {@link module:twgl} for core functions
	   *
	   * @module twgl/draw
	   */

	  /**
	   * Calls `gl.drawElements` or `gl.drawArrays`, whichever is appropriate
	   *
	   * normally you'd call `gl.drawElements` or `gl.drawArrays` yourself
	   * but calling this means if you switch from indexed data to non-indexed
	   * data you don't have to remember to update your draw call.
	   *
	   * @param {WebGLRenderingContext} gl A WebGLRenderingContext
	   * @param {(module:twgl.BufferInfo|module:twgl.VertexArrayInfo)} bufferInfo A BufferInfo as returned from {@link module:twgl.createBufferInfoFromArrays} or
	   *   a VertexArrayInfo as returned from {@link module:twgl.createVertexArrayInfo}
	   * @param {enum} [type] eg (gl.TRIANGLES, gl.LINES, gl.POINTS, gl.TRIANGLE_STRIP, ...). Defaults to `gl.TRIANGLES`
	   * @param {number} [count] An optional count. Defaults to bufferInfo.numElements
	   * @param {number} [offset] An optional offset. Defaults to 0.
	   * @memberOf module:twgl/draw
	   */

	  function drawBufferInfo(gl, bufferInfo, type, count, offset) {
	    type = type === undefined ? gl.TRIANGLES : type;
	    var indices = bufferInfo.indices;
	    var elementType = bufferInfo.elementType;
	    var numElements = count === undefined ? bufferInfo.numElements : count;
	    offset = offset === undefined ? 0 : offset;
	    if (elementType || indices) {
	      gl.drawElements(type, numElements, elementType === undefined ? gl.UNSIGNED_SHORT : bufferInfo.elementType, offset);
	    } else {
	      gl.drawArrays(type, offset, numElements);
	    }
	  }

	  /**
	   * A DrawObject is useful for putting objects in to an array and passing them to {@link module:twgl.drawObjectList}.
	   *
	   * You need either a `BufferInfo` or a `VertexArrayInfo`.
	   *
	   * @typedef {Object} DrawObject
	   * @property {boolean} [active] whether or not to draw. Default = `true` (must be `false` to be not true). In otherwords `undefined` = `true`
	   * @property {number} [type] type to draw eg. `gl.TRIANGLES`, `gl.LINES`, etc...
	   * @property {module:twgl.ProgramInfo} programInfo A ProgramInfo as returned from {@link module:twgl.createProgramInfo}
	   * @property {module:twgl.BufferInfo} [bufferInfo] A BufferInfo as returned from {@link module:twgl.createBufferInfoFromArrays}
	   * @property {module:twgl.VertexArrayInfo} [vertexArrayInfo] A VertexArrayInfo as returned from {@link module:twgl.createVertexArrayInfo}
	   * @property {Object<string, ?>} uniforms The values for the uniforms.
	   *   You can pass multiple objects by putting them in an array. For example
	   *
	   *     var sharedUniforms = {
	   *       u_fogNear: 10,
	   *       u_projection: ...
	   *       ...
	   *     };
	   *
	   *     var localUniforms = {
	   *       u_world: ...
	   *       u_diffuseColor: ...
	   *     };
	   *
	   *     var drawObj = {
	   *       ...
	   *       uniforms: [sharedUniforms, localUniforms],
	   *     };
	   *
	   * @property {number} [offset] the offset to pass to `gl.drawArrays` or `gl.drawElements`. Defaults to 0.
	   * @property {number} [count] the count to pass to `gl.drawArrays` or `gl.drawElemnts`. Defaults to bufferInfo.numElements.
	   * @memberOf module:twgl
	   */

	  /**
	   * Draws a list of objects
	   * @param {DrawObject[]} objectsToDraw an array of objects to draw.
	   * @memberOf module:twgl/draw
	   */
	  function drawObjectList(gl, objectsToDraw) {
	    var lastUsedProgramInfo = null;
	    var lastUsedBufferInfo = null;

	    objectsToDraw.forEach(function (object) {
	      if (object.active === false) {
	        return;
	      }

	      var programInfo = object.programInfo;
	      var bufferInfo = object.vertexArrayInfo || object.bufferInfo;
	      var bindBuffers = false;
	      var type = object.type === undefined ? gl.TRIANGLES : object.type;

	      if (programInfo !== lastUsedProgramInfo) {
	        lastUsedProgramInfo = programInfo;
	        gl.useProgram(programInfo.program);

	        // We have to rebind buffers when changing programs because we
	        // only bind buffers the program uses. So if 2 programs use the same
	        // bufferInfo but the 1st one uses only positions the when the
	        // we switch to the 2nd one some of the attributes will not be on.
	        bindBuffers = true;
	      }

	      // Setup all the needed attributes.
	      if (bindBuffers || bufferInfo !== lastUsedBufferInfo) {
	        if (lastUsedBufferInfo && lastUsedBufferInfo.vertexArrayObject && !bufferInfo.vertexArrayObject) {
	          gl.bindVertexArray(null);
	        }
	        lastUsedBufferInfo = bufferInfo;
	        programs.setBuffersAndAttributes(gl, programInfo, bufferInfo);
	      }

	      // Set the uniforms.
	      programs.setUniforms(programInfo, object.uniforms);

	      // Draw
	      drawBufferInfo(gl, bufferInfo, type, object.count, object.offset);
	    });

	    if (lastUsedBufferInfo.vertexArrayObject) {
	      gl.bindVertexArray(null);
	    }
	  }

	  // Using quotes prevents Uglify from changing the names.
	  // No speed diff AFAICT.
	  return {
	    "drawBufferInfo": drawBufferInfo,
	    "drawObjectList": drawObjectList
	  };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;"use strict";

	/*
	 * Copyright 2015, Gregg Tavares.
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *     * Redistributions of source code must retain the above copyright
	 * notice, this list of conditions and the following disclaimer.
	 *     * Redistributions in binary form must reproduce the above
	 * copyright notice, this list of conditions and the following disclaimer
	 * in the documentation and/or other materials provided with the
	 * distribution.
	 *     * Neither the name of Gregg Tavares. nor the names of his
	 * contributors may be used to endorse or promote products derived from
	 * this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(4)], __WEBPACK_AMD_DEFINE_RESULT__ = function (utils) {
	  "use strict";

	  /**
	   * Low level shader program related functions
	   *
	   * You should generally not need to use these functions. They are provided
	   * for those cases where you're doing something out of the ordinary
	   * and you need lower level access.
	   *
	   * For backward compatibily they are available at both `twgl.programs` and `twgl`
	   * itself
	   *
	   * See {@link module:twgl} for core functions
	   *
	   * @module twgl/programs
	   */

	  var error = utils.error;
	  var warn = utils.warn;

	  var FLOAT = 0x1406;
	  var FLOAT_VEC2 = 0x8B50;
	  var FLOAT_VEC3 = 0x8B51;
	  var FLOAT_VEC4 = 0x8B52;
	  var INT = 0x1404;
	  var INT_VEC2 = 0x8B53;
	  var INT_VEC3 = 0x8B54;
	  var INT_VEC4 = 0x8B55;
	  var BOOL = 0x8B56;
	  var BOOL_VEC2 = 0x8B57;
	  var BOOL_VEC3 = 0x8B58;
	  var BOOL_VEC4 = 0x8B59;
	  var FLOAT_MAT2 = 0x8B5A;
	  var FLOAT_MAT3 = 0x8B5B;
	  var FLOAT_MAT4 = 0x8B5C;
	  var SAMPLER_2D = 0x8B5E;
	  var SAMPLER_CUBE = 0x8B60;
	  var SAMPLER_3D = 0x8B5F;
	  var SAMPLER_2D_SHADOW = 0x8B62;
	  var FLOAT_MAT2x3 = 0x8B65;
	  var FLOAT_MAT2x4 = 0x8B66;
	  var FLOAT_MAT3x2 = 0x8B67;
	  var FLOAT_MAT3x4 = 0x8B68;
	  var FLOAT_MAT4x2 = 0x8B69;
	  var FLOAT_MAT4x3 = 0x8B6A;
	  var SAMPLER_2D_ARRAY = 0x8DC1;
	  var SAMPLER_2D_ARRAY_SHADOW = 0x8DC4;
	  var SAMPLER_CUBE_SHADOW = 0x8DC5;
	  var UNSIGNED_INT = 0x1405;
	  var UNSIGNED_INT_VEC2 = 0x8DC6;
	  var UNSIGNED_INT_VEC3 = 0x8DC7;
	  var UNSIGNED_INT_VEC4 = 0x8DC8;
	  var INT_SAMPLER_2D = 0x8DCA;
	  var INT_SAMPLER_3D = 0x8DCB;
	  var INT_SAMPLER_CUBE = 0x8DCC;
	  var INT_SAMPLER_2D_ARRAY = 0x8DCF;
	  var UNSIGNED_INT_SAMPLER_2D = 0x8DD2;
	  var UNSIGNED_INT_SAMPLER_3D = 0x8DD3;
	  var UNSIGNED_INT_SAMPLER_CUBE = 0x8DD4;
	  var UNSIGNED_INT_SAMPLER_2D_ARRAY = 0x8DD7;

	  var TEXTURE_2D = 0x0DE1;
	  var TEXTURE_CUBE_MAP = 0x8513;
	  var TEXTURE_3D = 0x806F;
	  var TEXTURE_2D_ARRAY = 0x8C1A;

	  var typeMap = {};

	  /**
	   * Returns the corresponding bind point for a given sampler type
	   */
	  function getBindPointForSamplerType(gl, type) {
	    return typeMap[type].bindPoint;
	  }

	  // This kind of sucks! If you could compose functions as in `var fn = gl[name];`
	  // this code could be a lot smaller but that is sadly really slow (T_T)

	  function floatSetter(gl, location) {
	    return function (v) {
	      gl.uniform1f(location, v);
	    };
	  }

	  function floatArraySetter(gl, location) {
	    return function (v) {
	      gl.uniform1fv(location, v);
	    };
	  }

	  function floatVec2Setter(gl, location) {
	    return function (v) {
	      gl.uniform2fv(location, v);
	    };
	  }

	  function floatVec3Setter(gl, location) {
	    return function (v) {
	      gl.uniform3fv(location, v);
	    };
	  }

	  function floatVec4Setter(gl, location) {
	    return function (v) {
	      gl.uniform4fv(location, v);
	    };
	  }

	  function intSetter(gl, location) {
	    return function (v) {
	      gl.uniform1i(location, v);
	    };
	  }

	  function intArraySetter(gl, location) {
	    return function (v) {
	      gl.uniform1iv(location, v);
	    };
	  }

	  function intVec2Setter(gl, location) {
	    return function (v) {
	      gl.uniform2iv(location, v);
	    };
	  }

	  function intVec3Setter(gl, location) {
	    return function (v) {
	      gl.uniform3iv(location, v);
	    };
	  }

	  function intVec4Setter(gl, location) {
	    return function (v) {
	      gl.uniform4iv(location, v);
	    };
	  }

	  function uintSetter(gl, location) {
	    return function (v) {
	      gl.uniform1ui(location, v);
	    };
	  }

	  function uintArraySetter(gl, location) {
	    return function (v) {
	      gl.uniform1uiv(location, v);
	    };
	  }

	  function uintVec2Setter(gl, location) {
	    return function (v) {
	      gl.uniform2uiv(location, v);
	    };
	  }

	  function uintVec3Setter(gl, location) {
	    return function (v) {
	      gl.uniform3uiv(location, v);
	    };
	  }

	  function uintVec4Setter(gl, location) {
	    return function (v) {
	      gl.uniform4uiv(location, v);
	    };
	  }

	  function floatMat2Setter(gl, location) {
	    return function (v) {
	      gl.uniformMatrix2fv(location, false, v);
	    };
	  }

	  function floatMat3Setter(gl, location) {
	    return function (v) {
	      gl.uniformMatrix3fv(location, false, v);
	    };
	  }

	  function floatMat4Setter(gl, location) {
	    return function (v) {
	      gl.uniformMatrix4fv(location, false, v);
	    };
	  }

	  function floatMat23Setter(gl, location) {
	    return function (v) {
	      gl.uniformMatrix2x3fv(location, false, v);
	    };
	  }

	  function floatMat32Setter(gl, location) {
	    return function (v) {
	      gl.uniformMatrix3x2fv(location, false, v);
	    };
	  }

	  function floatMat24Setter(gl, location) {
	    return function (v) {
	      gl.uniformMatrix2x4fv(location, false, v);
	    };
	  }

	  function floatMat42Setter(gl, location) {
	    return function (v) {
	      gl.uniformMatrix4x2fv(location, false, v);
	    };
	  }

	  function floatMat34Setter(gl, location) {
	    return function (v) {
	      gl.uniformMatrix3x4fv(location, false, v);
	    };
	  }

	  function floatMat43Setter(gl, location) {
	    return function (v) {
	      gl.uniformMatrix4x3fv(location, false, v);
	    };
	  }

	  function samplerSetter(gl, type, unit, location) {
	    var bindPoint = getBindPointForSamplerType(gl, type);
	    return utils.isWebGL2(gl) ? function (textureOrPair) {
	      var texture = void 0;
	      var sampler = void 0;
	      if (textureOrPair instanceof WebGLTexture) {
	        texture = textureOrPair;
	        sampler = null;
	      } else {
	        texture = textureOrPair.texture;
	        sampler = textureOrPair.sampler;
	      }
	      gl.uniform1i(location, unit);
	      gl.activeTexture(gl.TEXTURE0 + unit);
	      gl.bindTexture(bindPoint, texture);
	      gl.bindSampler(unit, sampler);
	    } : function (texture) {
	      gl.uniform1i(location, unit);
	      gl.activeTexture(gl.TEXTURE0 + unit);
	      gl.bindTexture(bindPoint, texture);
	    };
	  }

	  function samplerArraySetter(gl, type, unit, location, size) {
	    var bindPoint = getBindPointForSamplerType(gl, type);
	    var units = new Int32Array(size);
	    for (var ii = 0; ii < size; ++ii) {
	      units[ii] = unit + ii;
	    }

	    return utils.isWebGL2(gl) ? function (textures) {
	      gl.uniform1iv(location, units);
	      textures.forEach(function (textureOrPair, index) {
	        gl.activeTexture(gl.TEXTURE0 + units[index]);
	        var texture = void 0;
	        var sampler = void 0;
	        if (textureOrPair instanceof WebGLTexture) {
	          texture = textureOrPair;
	          sampler = null;
	        } else {
	          texture = textureOrPair.texture;
	          sampler = textureOrPair.sampler;
	        }
	        gl.bindSampler(unit, sampler);
	        gl.bindTexture(bindPoint, texture);
	      });
	    } : function (textures) {
	      gl.uniform1iv(location, units);
	      textures.forEach(function (texture, index) {
	        gl.activeTexture(gl.TEXTURE0 + units[index]);
	        gl.bindTexture(bindPoint, texture);
	      });
	    };
	  }

	  typeMap[FLOAT] = { Type: Float32Array, size: 4, setter: floatSetter, arraySetter: floatArraySetter };
	  typeMap[FLOAT_VEC2] = { Type: Float32Array, size: 8, setter: floatVec2Setter };
	  typeMap[FLOAT_VEC3] = { Type: Float32Array, size: 12, setter: floatVec3Setter };
	  typeMap[FLOAT_VEC4] = { Type: Float32Array, size: 16, setter: floatVec4Setter };
	  typeMap[INT] = { Type: Int32Array, size: 4, setter: intSetter, arraySetter: intArraySetter };
	  typeMap[INT_VEC2] = { Type: Int32Array, size: 8, setter: intVec2Setter };
	  typeMap[INT_VEC3] = { Type: Int32Array, size: 12, setter: intVec3Setter };
	  typeMap[INT_VEC4] = { Type: Int32Array, size: 16, setter: intVec4Setter };
	  typeMap[UNSIGNED_INT] = { Type: Uint32Array, size: 4, setter: uintSetter, arraySetter: uintArraySetter };
	  typeMap[UNSIGNED_INT_VEC2] = { Type: Uint32Array, size: 8, setter: uintVec2Setter };
	  typeMap[UNSIGNED_INT_VEC3] = { Type: Uint32Array, size: 12, setter: uintVec3Setter };
	  typeMap[UNSIGNED_INT_VEC4] = { Type: Uint32Array, size: 16, setter: uintVec4Setter };
	  typeMap[BOOL] = { Type: Uint32Array, size: 4, setter: intSetter, arraySetter: intArraySetter };
	  typeMap[BOOL_VEC2] = { Type: Uint32Array, size: 8, setter: intVec2Setter };
	  typeMap[BOOL_VEC3] = { Type: Uint32Array, size: 12, setter: intVec3Setter };
	  typeMap[BOOL_VEC4] = { Type: Uint32Array, size: 16, setter: intVec4Setter };
	  typeMap[FLOAT_MAT2] = { Type: Float32Array, size: 16, setter: floatMat2Setter };
	  typeMap[FLOAT_MAT3] = { Type: Float32Array, size: 36, setter: floatMat3Setter };
	  typeMap[FLOAT_MAT4] = { Type: Float32Array, size: 64, setter: floatMat4Setter };
	  typeMap[FLOAT_MAT2x3] = { Type: Float32Array, size: 24, setter: floatMat23Setter };
	  typeMap[FLOAT_MAT2x4] = { Type: Float32Array, size: 32, setter: floatMat24Setter };
	  typeMap[FLOAT_MAT3x2] = { Type: Float32Array, size: 24, setter: floatMat32Setter };
	  typeMap[FLOAT_MAT3x4] = { Type: Float32Array, size: 48, setter: floatMat34Setter };
	  typeMap[FLOAT_MAT4x2] = { Type: Float32Array, size: 32, setter: floatMat42Setter };
	  typeMap[FLOAT_MAT4x3] = { Type: Float32Array, size: 48, setter: floatMat43Setter };
	  typeMap[SAMPLER_2D] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D };
	  typeMap[SAMPLER_CUBE] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP };
	  typeMap[SAMPLER_3D] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_3D };
	  typeMap[SAMPLER_2D_SHADOW] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D };
	  typeMap[SAMPLER_2D_ARRAY] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY };
	  typeMap[SAMPLER_2D_ARRAY_SHADOW] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY };
	  typeMap[SAMPLER_CUBE_SHADOW] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP };
	  typeMap[INT_SAMPLER_2D] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D };
	  typeMap[INT_SAMPLER_3D] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_3D };
	  typeMap[INT_SAMPLER_CUBE] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP };
	  typeMap[INT_SAMPLER_2D_ARRAY] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY };
	  typeMap[UNSIGNED_INT_SAMPLER_2D] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D };
	  typeMap[UNSIGNED_INT_SAMPLER_3D] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_3D };
	  typeMap[UNSIGNED_INT_SAMPLER_CUBE] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP };
	  typeMap[UNSIGNED_INT_SAMPLER_2D_ARRAY] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY };

	  function floatAttribSetter(gl, index) {
	    return function (b) {
	      gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer);
	      gl.enableVertexAttribArray(index);
	      gl.vertexAttribPointer(index, b.numComponents || b.size, b.type || gl.FLOAT, b.normalize || false, b.stride || 0, b.offset || 0);
	    };
	  }

	  function intAttribSetter(gl, index) {
	    return function (b) {
	      gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer);
	      gl.enableVertexAttribArray(index);
	      gl.vertexAttribIPointer(index, b.numComponents || b.size, b.type || gl.INT, b.stride || 0, b.offset || 0);
	    };
	  }

	  function matAttribSetter(gl, index, typeInfo) {
	    var defaultSize = typeInfo.size;
	    var count = typeInfo.count;

	    return function (b) {
	      gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer);
	      var numComponents = b.size || b.numComponents || defaultSize;
	      var size = numComponents / count;
	      var type = b.type || gl.FLOAT;
	      var typeInfo = typeMap[type];
	      var stride = typeInfo.size * numComponents;
	      var normalize = b.normalize || false;
	      var offset = b.offset || 0;
	      var rowOffset = stride / count;
	      for (var i = 0; i < count; ++i) {
	        gl.enableVertexAttribArray(index + i);
	        gl.vertexAttribPointer(index + i, size, type, normalize, stride, offset + rowOffset * i);
	      }
	    };
	  }

	  var attrTypeMap = {};
	  attrTypeMap[FLOAT] = { size: 4, setter: floatAttribSetter };
	  attrTypeMap[FLOAT_VEC2] = { size: 8, setter: floatAttribSetter };
	  attrTypeMap[FLOAT_VEC3] = { size: 12, setter: floatAttribSetter };
	  attrTypeMap[FLOAT_VEC4] = { size: 16, setter: floatAttribSetter };
	  attrTypeMap[INT] = { size: 4, setter: intAttribSetter };
	  attrTypeMap[INT_VEC2] = { size: 8, setter: intAttribSetter };
	  attrTypeMap[INT_VEC3] = { size: 12, setter: intAttribSetter };
	  attrTypeMap[INT_VEC4] = { size: 16, setter: intAttribSetter };
	  attrTypeMap[UNSIGNED_INT] = { size: 4, setter: intAttribSetter };
	  attrTypeMap[UNSIGNED_INT_VEC2] = { size: 8, setter: intAttribSetter };
	  attrTypeMap[UNSIGNED_INT_VEC3] = { size: 12, setter: intAttribSetter };
	  attrTypeMap[UNSIGNED_INT_VEC4] = { size: 16, setter: intAttribSetter };
	  attrTypeMap[BOOL] = { size: 4, setter: intAttribSetter };
	  attrTypeMap[BOOL_VEC2] = { size: 8, setter: intAttribSetter };
	  attrTypeMap[BOOL_VEC3] = { size: 12, setter: intAttribSetter };
	  attrTypeMap[BOOL_VEC4] = { size: 16, setter: intAttribSetter };
	  attrTypeMap[FLOAT_MAT2] = { size: 4, setter: matAttribSetter, count: 2 };
	  attrTypeMap[FLOAT_MAT3] = { size: 9, setter: matAttribSetter, count: 3 };
	  attrTypeMap[FLOAT_MAT4] = { size: 16, setter: matAttribSetter, count: 4 };

	  // make sure we don't see a global gl
	  var gl = undefined; // eslint-disable-line

	  /**
	   * Error Callback
	   * @callback ErrorCallback
	   * @param {string} msg error message.
	   * @param {number} [lineOffset] amount to add to line number
	   * @memberOf module:twgl
	   */

	  function addLineNumbers(src, lineOffset) {
	    lineOffset = lineOffset || 0;
	    ++lineOffset;

	    return src.split("\n").map(function (line, ndx) {
	      return ndx + lineOffset + ": " + line;
	    }).join("\n");
	  }

	  var spaceRE = /^[ \t]*\n/;

	  /**
	   * Loads a shader.
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
	   * @param {string} shaderSource The shader source.
	   * @param {number} shaderType The type of shader.
	   * @param {module:twgl.ErrorCallback} opt_errorCallback callback for errors.
	   * @return {WebGLShader} The created shader.
	   */
	  function loadShader(gl, shaderSource, shaderType, opt_errorCallback) {
	    var errFn = opt_errorCallback || error;
	    // Create the shader object
	    var shader = gl.createShader(shaderType);

	    // Remove the first end of line because WebGL 2.0 requires
	    // #version 300 es
	    // as the first line. No whitespace allowed before that line
	    // so
	    //
	    // <script>
	    // #version 300 es
	    // </script>
	    //
	    // Has one line before it which is invalid according to GLSL ES 3.00
	    //
	    var lineOffset = 0;
	    if (spaceRE.test(shaderSource)) {
	      lineOffset = 1;
	      shaderSource = shaderSource.replace(spaceRE, '');
	    }

	    // Load the shader source
	    gl.shaderSource(shader, shaderSource);

	    // Compile the shader
	    gl.compileShader(shader);

	    // Check the compile status
	    var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	    if (!compiled) {
	      // Something went wrong during compilation; get the error
	      var lastError = gl.getShaderInfoLog(shader);
	      errFn(addLineNumbers(shaderSource, lineOffset) + "\n*** Error compiling shader: " + lastError);
	      gl.deleteShader(shader);
	      return null;
	    }

	    return shader;
	  }

	  /**
	   * @typedef {Object} ProgramOptions
	   * @property {function(string)} [errorCallback] callback for errors
	   * @property {Object.<string,number>} [attribLocations] a attribute name to location map
	   * @property {(module:twgl.BufferInfo|Object.<string,module:twgl.AttribInfo>|string[])} [transformFeedbackVaryings] If passed
	   *   a BufferInfo will use the attribs names inside. If passed an object of AttribInfos will use the names from that object. Otherwise
	   *   you can pass an array of names.
	   * @property {number} [transformFeedbackMode] the mode to pass `gl.transformFeedbackVaryings`. Defaults to `SEPARATE_ATTRIBS`.
	   * @memberOf module:twgl
	   */

	  /**
	   * Gets the program options based on all these optional arguments
	   * @param {module:twgl.ProgramOptions|string[]} [opt_attribs] Options for the program or an array of attribs names. Locations will be assigned by index if not passed in
	   * @param {number[]} [opt_locations] The locations for the. A parallel array to opt_attribs letting you assign locations.
	   * @param {module:twgl.ErrorCallback} [opt_errorCallback] callback for errors. By default it just prints an error to the console
	   *        on error. If you want something else pass an callback. It's passed an error message.
	   * @return {module:twgl.ProgramOptions} an instance of ProgramOptions based on the arguments pased on
	   */
	  function getProgramOptions(opt_attribs, opt_locations, opt_errorCallback) {
	    if (typeof opt_locations === 'function') {
	      opt_errorCallback = opt_locations;
	      opt_locations = undefined;
	    }
	    if (typeof opt_attribs === 'function') {
	      opt_errorCallback = opt_attribs;
	      opt_attribs = undefined;
	    } else if (opt_attribs && !Array.isArray(opt_attribs)) {
	      // If we have an errorCallback we can just return this object
	      // Otherwise we need to construct one with default errorCallback
	      if (opt_attribs.errorCallback) {
	        return opt_attribs;
	      }
	      var opt = opt_attribs;
	      opt_errorCallback = opt.errorCallback;
	      opt_attribs = opt.attribLocations;
	      var transformFeedbackVaryings = opt.transformFeedbackVaryings;
	    }

	    var options = {
	      errorCallback: opt_errorCallback || error,
	      transformFeedbackVaryings: transformFeedbackVaryings
	    };

	    if (opt_attribs) {
	      var attribLocations = {};
	      if (Array.isArray(opt_attribs)) {
	        opt_attribs.forEach(function (attrib, ndx) {
	          attribLocations[attrib] = opt_locations ? opt_locations[ndx] : ndx;
	        });
	      } else {
	        attribLocations = opt_attribs;
	      }
	      options.attribLocations = attribLocations;
	    }

	    return options;
	  }

	  var defaultShaderType = ["VERTEX_SHADER", "FRAGMENT_SHADER"];

	  function getShaderTypeFromScriptType(scriptType) {
	    if (scriptType.indexOf("frag") >= 0) {
	      return gl.FRAGMENT_SHADER;
	    } else if (scriptType.indexOf("vert") >= 0) {
	      return gl.VERTEX_SHADER;
	    }
	    return undefined;
	  }

	  function deleteShaders(gl, shaders) {
	    shaders.forEach(function (shader) {
	      gl.deleteShader(shader);
	    });
	  }

	  /**
	   * Creates a program, attaches (and/or compiles) shaders, binds attrib locations, links the
	   * program and calls useProgram.
	   *
	   * NOTE: There are 4 signatures for this function
	   *
	   *     twgl.createProgram(gl, [vs, fs], options);
	   *     twgl.createProgram(gl, [vs, fs], opt_errFunc);
	   *     twgl.createProgram(gl, [vs, fs], opt_attribs, opt_errFunc);
	   *     twgl.createProgram(gl, [vs, fs], opt_attribs, opt_locations, opt_errFunc);
	   *
	   * @param {WebGLShader[]|string[]} shaders The shaders to attach, or element ids for their source, or strings that contain their source
	   * @param {module:twgl.ProgramOptions|string[]} [opt_attribs] Options for the program or an array of attribs names. Locations will be assigned by index if not passed in
	   * @param {number[]} [opt_locations] The locations for the. A parallel array to opt_attribs letting you assign locations.
	   * @param {module:twgl.ErrorCallback} [opt_errorCallback] callback for errors. By default it just prints an error to the console
	   *        on error. If you want something else pass an callback. It's passed an error message.
	   * @return {WebGLProgram?} the created program or null if error.
	   * @memberOf module:twgl/programs
	   */
	  function createProgram(gl, shaders, opt_attribs, opt_locations, opt_errorCallback) {
	    var progOptions = getProgramOptions(opt_attribs, opt_locations, opt_errorCallback);
	    var realShaders = [];
	    var newShaders = [];
	    for (var ndx = 0; ndx < shaders.length; ++ndx) {
	      var shader = shaders[ndx];
	      if (typeof shader === 'string') {
	        var elem = document.getElementById(shader);
	        var src = elem ? elem.text : shader;
	        var type = gl[defaultShaderType[ndx]];
	        if (elem && elem.type) {
	          type = getShaderTypeFromScriptType(elem.type) || type;
	        }
	        shader = loadShader(gl, src, type, progOptions.errorCallback);
	        newShaders.push(shader);
	      }
	      if (shader instanceof WebGLShader) {
	        realShaders.push(shader);
	      }
	    }

	    if (realShaders.length !== shaders.length) {
	      programOptions.errorCallback("not enough shaders for program");
	      deleteShaders(gl, newShaders);
	      return null;
	    }

	    var program = gl.createProgram();
	    realShaders.forEach(function (shader) {
	      gl.attachShader(program, shader);
	    });
	    if (progOptions.attribLocations) {
	      Object.keys(progOptions.attribLocations).forEach(function (attrib) {
	        gl.bindAttribLocation(program, progOptions.attribLocations[attrib], attrib);
	      });
	    }
	    var varyings = progOptions.transformFeedbackVaryings;
	    if (varyings) {
	      if (varyings.attribs) {
	        varyings = varyings.attribs;
	      }
	      if (!Array.isArray(varyings)) {
	        varyings = Object.keys(varyings);
	      }
	      gl.transformFeedbackVaryings(program, varyings, progOptions.transformFeedbackMode || gl.SEPARATE_ATTRIBS);
	    }
	    gl.linkProgram(program);

	    // Check the link status
	    var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
	    if (!linked) {
	      // something went wrong with the link
	      var lastError = gl.getProgramInfoLog(program);
	      progOptions.errorCallback("Error in program linking:" + lastError);

	      gl.deleteProgram(program);
	      deleteShaders(gl, newShaders);
	      return null;
	    }
	    return program;
	  }

	  /**
	   * Loads a shader from a script tag.
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
	   * @param {string} scriptId The id of the script tag.
	   * @param {number} [opt_shaderType] The type of shader. If not passed in it will
	   *     be derived from the type of the script tag.
	   * @param {module:twgl.ErrorCallback} [opt_errorCallback] callback for errors.
	   * @return {WebGLShader?} The created shader or null if error.
	   */
	  function createShaderFromScript(gl, scriptId, opt_shaderType, opt_errorCallback) {
	    var shaderSource = "";
	    var shaderScript = document.getElementById(scriptId);
	    if (!shaderScript) {
	      throw "*** Error: unknown script element" + scriptId;
	    }
	    shaderSource = shaderScript.text;

	    var shaderType = opt_shaderType || getShaderTypeFromScriptType(shaderScript.type);
	    if (!shaderType) {
	      throw "*** Error: unknown shader type";
	    }

	    return loadShader(gl, shaderSource, shaderType, opt_errorCallback);
	  }

	  /**
	   * Creates a program from 2 script tags.
	   *
	   * NOTE: There are 4 signatures for this function
	   *
	   *     twgl.createProgramFromScripts(gl, [vs, fs], opt_options);
	   *     twgl.createProgramFromScripts(gl, [vs, fs], opt_errFunc);
	   *     twgl.createProgramFromScripts(gl, [vs, fs], opt_attribs, opt_errFunc);
	   *     twgl.createProgramFromScripts(gl, [vs, fs], opt_attribs, opt_locations, opt_errFunc);
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext
	   *        to use.
	   * @param {string[]} shaderScriptIds Array of ids of the script
	   *        tags for the shaders. The first is assumed to be the
	   *        vertex shader, the second the fragment shader.
	   * @param {string[]} [opt_attribs] An array of attribs names. Locations will be assigned by index if not passed in
	   * @param {number[]} [opt_locations] The locations for the. A parallel array to opt_attribs letting you assign locations.
	   * @param {module:twgl.ErrorCallback} opt_errorCallback callback for errors. By default it just prints an error to the console
	   *        on error. If you want something else pass an callback. It's passed an error message.
	   * @return {WebGLProgram} The created program.
	   * @memberOf module:twgl/programs
	   */
	  function createProgramFromScripts(gl, shaderScriptIds, opt_attribs, opt_locations, opt_errorCallback) {
	    var progOptions = getProgramOptions(opt_attribs, opt_locations, opt_errorCallback);
	    var shaders = [];
	    for (var ii = 0; ii < shaderScriptIds.length; ++ii) {
	      var shader = createShaderFromScript(gl, shaderScriptIds[ii], gl[defaultShaderType[ii]], progOptions.errorCallback);
	      if (!shader) {
	        return null;
	      }
	      shaders.push(shader);
	    }
	    return createProgram(gl, shaders, progOptions);
	  }

	  /**
	   * Creates a program from 2 sources.
	   *
	   * NOTE: There are 4 signatures for this function
	   *
	   *     twgl.createProgramFromSource(gl, [vs, fs], opt_options);
	   *     twgl.createProgramFromSource(gl, [vs, fs], opt_errFunc);
	   *     twgl.createProgramFromSource(gl, [vs, fs], opt_attribs, opt_errFunc);
	   *     twgl.createProgramFromSource(gl, [vs, fs], opt_attribs, opt_locations, opt_errFunc);
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext
	   *        to use.
	   * @param {string[]} shaderSources Array of sources for the
	   *        shaders. The first is assumed to be the vertex shader,
	   *        the second the fragment shader.
	   * @param {string[]} [opt_attribs] An array of attribs names. Locations will be assigned by index if not passed in
	   * @param {number[]} [opt_locations] The locations for the. A parallel array to opt_attribs letting you assign locations.
	   * @param {module:twgl.ErrorCallback} opt_errorCallback callback for errors. By default it just prints an error to the console
	   *        on error. If you want something else pass an callback. It's passed an error message.
	   * @return {WebGLProgram} The created program.
	   * @memberOf module:twgl/programs
	   */
	  function createProgramFromSources(gl, shaderSources, opt_attribs, opt_locations, opt_errorCallback) {
	    var progOptions = getProgramOptions(opt_attribs, opt_locations, opt_errorCallback);
	    var shaders = [];
	    for (var ii = 0; ii < shaderSources.length; ++ii) {
	      var shader = loadShader(gl, shaderSources[ii], gl[defaultShaderType[ii]], progOptions.errorCallback);
	      if (!shader) {
	        return null;
	      }
	      shaders.push(shader);
	    }
	    return createProgram(gl, shaders, progOptions);
	  }

	  /**
	   * Creates setter functions for all uniforms of a shader
	   * program.
	   *
	   * @see {@link module:twgl.setUniforms}
	   *
	   * @param {WebGLProgram} program the program to create setters for.
	   * @returns {Object.<string, function>} an object with a setter by name for each uniform
	   * @memberOf module:twgl/programs
	   */
	  function createUniformSetters(gl, program) {
	    var textureUnit = 0;

	    /**
	     * Creates a setter for a uniform of the given program with it's
	     * location embedded in the setter.
	     * @param {WebGLProgram} program
	     * @param {WebGLUniformInfo} uniformInfo
	     * @returns {function} the created setter.
	     */
	    function createUniformSetter(program, uniformInfo) {
	      var location = gl.getUniformLocation(program, uniformInfo.name);
	      var isArray = uniformInfo.size > 1 && uniformInfo.name.substr(-3) === "[0]";
	      var type = uniformInfo.type;
	      var typeInfo = typeMap[type];
	      if (!typeInfo) {
	        throw "unknown type: 0x" + type.toString(16); // we should never get here.
	      }
	      var setter;
	      if (typeInfo.bindPoint) {
	        // it's a sampler
	        var unit = textureUnit;
	        textureUnit += uniformInfo.size;
	        if (isArray) {
	          setter = typeInfo.arraySetter(gl, type, unit, location, uniformInfo.size);
	        } else {
	          setter = typeInfo.setter(gl, type, unit, location, uniformInfo.size);
	        }
	      } else {
	        if (typeInfo.arraySetter && isArray) {
	          setter = typeInfo.arraySetter(gl, location);
	        } else {
	          setter = typeInfo.setter(gl, location);
	        }
	      }
	      setter.location = location;
	      return setter;
	    }

	    var uniformSetters = {};
	    var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

	    for (var ii = 0; ii < numUniforms; ++ii) {
	      var uniformInfo = gl.getActiveUniform(program, ii);
	      if (!uniformInfo) {
	        break;
	      }
	      var name = uniformInfo.name;
	      // remove the array suffix.
	      if (name.substr(-3) === "[0]") {
	        name = name.substr(0, name.length - 3);
	      }
	      var setter = createUniformSetter(program, uniformInfo);
	      uniformSetters[name] = setter;
	    }
	    return uniformSetters;
	  }

	  /**
	   * @typedef {Object} TransformFeedbackInfo
	   * @property {number} index index of transform feedback
	   * @property {number} type GL type
	   * @property {number} size 1 - 4
	   * @memberOf module:twgl
	   */

	  /**
	   * Create TransformFeedbackInfo for passing to bind/unbindTransformFeedbackInfo.
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
	   * @param {WebGLProgram} program an existing WebGLProgram.
	   * @return {Object<string, module:twgl.TransformFeedbackInfo>}
	   * @memberOf module:twgl
	   */
	  function createTransformFeedbackInfo(gl, program) {
	    var info = {};
	    var numVaryings = gl.getProgramParameter(program, gl.TRANSFORM_FEEDBACK_VARYINGS);
	    for (var ii = 0; ii < numVaryings; ++ii) {
	      var varying = gl.getTransformFeedbackVarying(program, ii);
	      info[varying.name] = {
	        index: ii,
	        type: varying.type,
	        size: varying.size
	      };
	    }
	    return info;
	  }

	  /**
	   * Binds buffers for transform feedback.
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
	   * @param {(module:twgl.ProgramInfo|Object<string, module:twgl.TransformFeedbackInfo>)} transformFeedbackInfo A ProgramInfo or TransformFeedbackInfo.
	   * @param {(module:twgl.BufferInfo|Object<string, module:twgl.AttribInfo>)} [bufferInfo] A BufferInfo or set of AttribInfos.
	   * @memberOf module:twgl
	   */
	  function bindTransformFeedbackInfo(gl, transformFeedbackInfo, bufferInfo) {
	    if (transformFeedbackInfo.transformFeedbackInfo) {
	      transformFeedbackInfo = transformFeedbackInfo.transformFeedbackInfo;
	    }
	    if (bufferInfo.attribs) {
	      bufferInfo = bufferInfo.attribs;
	    }
	    for (var name in bufferInfo) {
	      var varying = transformFeedbackInfo[name];
	      if (varying) {
	        var buf = bufferInfo[name];
	        if (buf.offset) {
	          gl.bindBufferRange(gl.TRANSFORM_FEEDBACK_BUFFER, varying.index, buf.buffer, buf.offset, buf.size);
	        } else {
	          gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, varying.index, buf.buffer);
	        }
	      }
	    }
	  }

	  /**
	   * Unbinds buffers afetr transform feedback.
	   *
	   * Buffers can not be bound to 2 bind points so if you try to bind a buffer used
	   * in a transform feedback as an ARRAY_BUFFER for an attribute it will fail.
	   *
	   * This function unbinds all buffers that were bound with {@link module:twgl.bindTransformFeedbackInfo}.
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
	   * @param {(module:twgl.ProgramInfo|Object<string, module:twgl.TransformFeedbackInfo>)} transformFeedbackInfo A ProgramInfo or TransformFeedbackInfo.
	   * @param {(module:twgl.BufferInfo|Object<string, module:twgl.AttribInfo>)} [bufferInfo] A BufferInfo or set of AttribInfos.
	   */
	  function unbindTransformFeedbackInfo(gl, transformFeedbackInfo, bufferInfo) {
	    if (transformFeedbackInfo.transformFeedbackInfo) {
	      transformFeedbackInfo = transformFeedbackInfo.transformFeedbackInfo;
	    }
	    if (bufferInfo.attribs) {
	      bufferInfo = bufferInfo.attribs;
	    }
	    for (var name in bufferInfo) {
	      var varying = transformFeedbackInfo[name];
	      if (varying) {
	        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, varying.index, null);
	      }
	    }
	  }

	  /**
	   * Creates a transform feedback and sets the buffers
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
	   * @param {module:twgl.ProgramInfo} programInfo A ProgramInfo as returned from {@link module:twgl.createProgramInfo}
	   * @param {(module:twgl.BufferInfo|Object<string, module:twgl.AttribInfo>)} [bufferInfo] A BufferInfo or set of AttribInfos.
	   * @return {WebGLTransformFeedback} the created transform feedback
	   * @memberOf module:twgl
	   */
	  function createTransformFeedback(gl, programInfo, bufferInfo) {
	    var tf = gl.createTransformFeedback();
	    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
	    gl.useProgram(programInfo.program);
	    bindTransformFeedbackInfo(gl, programInfo, bufferInfo);
	    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
	    // This is only needed because of a bug in Chrome 56. Will remove
	    // when chrome fixes it.
	    unbindTransformFeedbackInfo(gl, programInfo, bufferInfo);
	    return tf;
	  }

	  /**
	   * @typedef {Object} UniformData
	   * @property {number} type The WebGL type enum for this uniform
	   * @property {number} size The number of elements for this uniform
	   * @property {number} blockNdx The block index this uniform appears in
	   * @property {number} offset The byte offset in the block for this uniform's value
	   * @memberOf module:twgl
	   */

	  /**
	   * The specification for one UniformBlockObject
	   *
	   * @typedef {Object} BlockSpec
	   * @property {number} index The index of the block.
	   * @property {number} size The size in bytes needed for the block
	   * @property {number[]} uniformIndices The indices of the uniforms used by the block. These indices
	   *    correspond to entries in a UniformData array in the {@link module:twgl.UniformBlockSpec}.
	   * @property {bool} usedByVertexShader Self explanitory
	   * @property {bool} usedByFragmentShader Self explanitory
	   * @property {bool} used Self explanitory
	   * @memberOf module:twgl
	   */

	  /**
	   * A `UniformBlockSpec` represents the data needed to create and bind
	   * UniformBlockObjects for a given program
	   *
	   * @typedef {Object} UniformBlockSpec
	   * @property {Object.<string, module:twgl.BlockSpec> blockSpecs The BlockSpec for each block by block name
	   * @property {UniformData[]} uniformData An array of data for each uniform by uniform index.
	   * @memberOf module:twgl
	   */

	  /**
	   * Creates a UniformBlockSpec for the given program.
	   *
	   * A UniformBlockSpec represents the data needed to create and bind
	   * UniformBlockObjects
	   *
	   * @param {WebGL2RenderingContext} gl A WebGL2 Rendering Context
	   * @param {WebGLProgram} program A WebGLProgram for a successfully linked program
	   * @return {module:twgl.UniformBlockSpec} The created UniformBlockSpec
	   * @memberOf module:twgl/programs
	   */
	  function createUniformBlockSpecFromProgram(gl, program) {
	    var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
	    var uniformData = [];
	    var uniformIndices = [];

	    for (var ii = 0; ii < numUniforms; ++ii) {
	      uniformIndices.push(ii);
	      uniformData.push({});
	      var uniformInfo = gl.getActiveUniform(program, ii);
	      if (!uniformInfo) {
	        break;
	      }
	      // REMOVE [0]?
	      uniformData[ii].name = uniformInfo.name;
	    }

	    [["UNIFORM_TYPE", "type"], ["UNIFORM_SIZE", "size"], // num elements
	    ["UNIFORM_BLOCK_INDEX", "blockNdx"], ["UNIFORM_OFFSET", "offset"]].forEach(function (pair) {
	      var pname = pair[0];
	      var key = pair[1];
	      gl.getActiveUniforms(program, uniformIndices, gl[pname]).forEach(function (value, ndx) {
	        uniformData[ndx][key] = value;
	      });
	    });

	    var blockSpecs = {};

	    var numUniformBlocks = gl.getProgramParameter(program, gl.ACTIVE_UNIFORM_BLOCKS);
	    for (ii = 0; ii < numUniformBlocks; ++ii) {
	      var name = gl.getActiveUniformBlockName(program, ii);
	      var blockSpec = {
	        index: ii,
	        usedByVertexShader: gl.getActiveUniformBlockParameter(program, ii, gl.UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER),
	        usedByFragmentShader: gl.getActiveUniformBlockParameter(program, ii, gl.UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER),
	        size: gl.getActiveUniformBlockParameter(program, ii, gl.UNIFORM_BLOCK_DATA_SIZE),
	        uniformIndices: gl.getActiveUniformBlockParameter(program, ii, gl.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES)
	      };
	      blockSpec.used = blockSpec.usedByVertexSahder || blockSpec.usedByFragmentShader;
	      blockSpecs[name] = blockSpec;
	    }

	    return {
	      blockSpecs: blockSpecs,
	      uniformData: uniformData
	    };
	  }

	  var arraySuffixRE = /\[\d+\]\.$/; // better way to check?

	  /**
	   * Represents a UniformBlockObject including an ArrayBuffer with all the uniform values
	   * and a corresponding WebGLBuffer to hold those values on the GPU
	   *
	   * @typedef {Object} UniformBlockInfo
	   * @property {string} name The name of the block
	   * @property {ArrayBuffer} array The array buffer that contains the uniform values
	   * @property {Float32Array} asFloat A float view on the array buffer. This is useful
	   *    inspecting the contents of the buffer in the debugger.
	   * @property {WebGLBuffer} buffer A WebGL buffer that will hold a copy of the uniform values for rendering.
	   * @property {number} [offset] offset into buffer
	   * @property {Object.<string, ArrayBufferView>} uniforms A uniform name to ArrayBufferView map.
	   *   each Uniform has a correctly typed `ArrayBufferView` into array at the correct offset
	   *   and length of that uniform. So for example a float uniform would have a 1 float `Float32Array`
	   *   view. A single mat4 would have a 16 element `Float32Array` view. An ivec2 would have an
	   *   `Int32Array` view, etc.
	   * @memberOf module:twgl
	   */

	  /**
	   * Creates a `UniformBlockInfo` for the specified block
	   *
	   * Note: **If the blockName matches no existing blocks a warning is printed to the console and a dummy
	   * `UniformBlockInfo` is returned**. This is because when debugging GLSL
	   * it is common to comment out large portions of a shader or for example set
	   * the final output to a constant. When that happens blocks get optimized out.
	   * If this function did not create dummy blocks your code would crash when debugging.
	   *
	   * @param {WebGL2RenderingContext} gl A WebGL2RenderingContext
	   * @param {WebGLProgram} program A WebGLProgram
	   * @param {module:twgl.UniformBlockSpec} uinformBlockSpec. A UniformBlockSpec as returned
	   *     from {@link module:twgl.createUniformBlockSpecFromProgram}.
	   * @param {string} blockName The name of the block.
	   * @return {module:twgl.UniformBlockInfo} The created UniformBlockInfo
	   * @memberOf module:twgl/programs
	   */
	  function createUniformBlockInfoFromProgram(gl, program, uniformBlockSpec, blockName) {
	    var blockSpecs = uniformBlockSpec.blockSpecs;
	    var uniformData = uniformBlockSpec.uniformData;
	    var blockSpec = blockSpecs[blockName];
	    if (!blockSpec) {
	      warn("no uniform block object named:", blockName);
	      return {
	        name: blockName,
	        uniforms: {}
	      };
	    }
	    var array = new ArrayBuffer(blockSpec.size);
	    var buffer = gl.createBuffer();
	    var uniformBufferIndex = blockSpec.index;
	    gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
	    gl.uniformBlockBinding(program, blockSpec.index, uniformBufferIndex);

	    var prefix = blockName + ".";
	    if (arraySuffixRE.test(prefix)) {
	      prefix = prefix.replace(arraySuffixRE, ".");
	    }
	    var uniforms = {};
	    blockSpec.uniformIndices.forEach(function (uniformNdx) {
	      var data = uniformData[uniformNdx];
	      var typeInfo = typeMap[data.type];
	      var Type = typeInfo.Type;
	      var length = data.size * typeInfo.size;
	      var name = data.name;
	      if (name.substr(0, prefix.length) === prefix) {
	        name = name.substr(prefix.length);
	      }
	      uniforms[name] = new Type(array, data.offset, length / Type.BYTES_PER_ELEMENT);
	    });
	    return {
	      name: blockName,
	      array: array,
	      asFloat: new Float32Array(array), // for debugging
	      buffer: buffer,
	      uniforms: uniforms
	    };
	  }

	  /**
	   * Creates a `UniformBlockInfo` for the specified block
	   *
	   * Note: **If the blockName matches no existing blocks a warning is printed to the console and a dummy
	   * `UniformBlockInfo` is returned**. This is because when debugging GLSL
	   * it is common to comment out large portions of a shader or for example set
	   * the final output to a constant. When that happens blocks get optimized out.
	   * If this function did not create dummy blocks your code would crash when debugging.
	   *
	   * @param {WebGL2RenderingContext} gl A WebGL2RenderingContext
	   * @param {module:twgl.ProgramInfo} programInfo a `ProgramInfo`
	   *     as returned from {@link module:twgl.createProgramInfo}
	   * @param {string} blockName The name of the block.
	   * @return {module:twgl.UniformBlockInfo} The created UniformBlockInfo
	   * @memberOf module:twgl/programs
	   */
	  function createUniformBlockInfo(gl, programInfo, blockName) {
	    return createUniformBlockInfoFromProgram(gl, programInfo.program, programInfo.uniformBlockSpec, blockName);
	  }

	  /**
	   * Binds a unform block to the matching uniform block point.
	   * Matches by blocks by name so blocks must have the same name not just the same
	   * structure.
	   *
	   * If you have changed any values and you upload the valus into the corresponding WebGLBuffer
	   * call {@link module:twgl.setUniformBlock} instead.
	   *
	   * @param {WebGL2RenderingContext} gl A WebGL 2 rendering context.
	   * @param {(module:twgl.ProgramInfo|module:twgl.UniformBlockSpec)} programInfo a `ProgramInfo`
	   *     as returned from {@link module:twgl.createProgramInfo} or or `UniformBlockSpec` as
	   *     returned from {@link module:twgl.createUniformBlockSpecFromProgram}.
	   * @param {module:twgl.UniformBlockInfo} uniformBlockInfo a `UniformBlockInfo` as returned from
	   *     {@link module:twgl.createUniformBlockInfo}.
	   * @return {bool} true if buffer was bound. If the programInfo has no block with the same block name
	   *     no buffer is bound.
	   * @memberOf module:twgl/programs
	   */
	  function bindUniformBlock(gl, programInfo, uniformBlockInfo) {
	    var uniformBlockSpec = programInfo.uniformBlockSpec || programInfo;
	    var blockSpec = uniformBlockSpec.blockSpecs[uniformBlockInfo.name];
	    if (blockSpec) {
	      var bufferBindIndex = blockSpec.index;
	      gl.bindBufferRange(gl.UNIFORM_BUFFER, bufferBindIndex, uniformBlockInfo.buffer, uniformBlockInfo.offset || 0, uniformBlockInfo.array.byteLength);
	      return true;
	    }
	    return false;
	  }

	  /**
	   * Uploads the current uniform values to the corresponding WebGLBuffer
	   * and binds that buffer to the program's corresponding bind point for the uniform block object.
	   *
	   * If you haven't changed any values and you only need to bind the uniform block object
	   * call {@link module:twgl.bindUniformBlock} instead.
	   *
	   * @param {WebGL2RenderingContext} gl A WebGL 2 rendering context.
	   * @param {(module:twgl.ProgramInfo|module:twgl.UniformBlockSpec)} programInfo a `ProgramInfo`
	   *     as returned from {@link module:twgl.createProgramInfo} or or `UniformBlockSpec` as
	   *     returned from {@link module:twgl.createUniformBlockSpecFromProgram}.
	   * @param {module:twgl.UniformBlockInfo} uniformBlockInfo a `UniformBlockInfo` as returned from
	   *     {@link module:twgl.createUniformBlockInfo}.
	   * @memberOf module:twgl/programs
	   */
	  function setUniformBlock(gl, programInfo, uniformBlockInfo) {
	    if (bindUniformBlock(gl, programInfo, uniformBlockInfo)) {
	      gl.bufferData(gl.UNIFORM_BUFFER, uniformBlockInfo.array, gl.DYNAMIC_DRAW);
	    }
	  }

	  /**
	   * Sets values of a uniform block object
	   *
	   * @param {module:twgl.UniformBlockInfo} uniformBlockInfo A UniformBlockInfo as returned by {@link module:twgl.createUniformBlockInfo}.
	   * @param {Object.<string, ?>} values A uniform name to value map where the value is correct for the given
	   *    type of uniform. So for example given a block like
	   *
	   *       uniform SomeBlock {
	   *         float someFloat;
	   *         vec2 someVec2;
	   *         vec3 someVec3Array[2];
	   *         int someInt;
	   *       }
	   *
	   *  You can set the values of the uniform block with
	   *
	   *       twgl.setBlockUniforms(someBlockInfo, {
	   *          someFloat: 12.3,
	   *          someVec2: [1, 2],
	   *          someVec3Array: [1, 2, 3, 4, 5, 6],
	   *          someInt: 5,
	   *       }
	   *
	   *  Arrays can be JavaScript arrays or typed arrays
	   *
	   *  Any name that doesn't match will be ignored
	   * @memberOf module:twgl/programs
	   */
	  function setBlockUniforms(uniformBlockInfo, values) {
	    var uniforms = uniformBlockInfo.uniforms;
	    for (var name in values) {
	      var array = uniforms[name];
	      if (array) {
	        var value = values[name];
	        if (value.length) {
	          array.set(value);
	        } else {
	          array[0] = value;
	        }
	      }
	    }
	  }

	  /**
	   * Set uniforms and binds related textures.
	   *
	   * example:
	   *
	   *     var programInfo = createProgramInfo(
	   *         gl, ["some-vs", "some-fs"]);
	   *
	   *     var tex1 = gl.createTexture();
	   *     var tex2 = gl.createTexture();
	   *
	   *     ... assume we setup the textures with data ...
	   *
	   *     var uniforms = {
	   *       u_someSampler: tex1,
	   *       u_someOtherSampler: tex2,
	   *       u_someColor: [1,0,0,1],
	   *       u_somePosition: [0,1,1],
	   *       u_someMatrix: [
	   *         1,0,0,0,
	   *         0,1,0,0,
	   *         0,0,1,0,
	   *         0,0,0,0,
	   *       ],
	   *     };
	   *
	   *     gl.useProgram(program);
	   *
	   * This will automatically bind the textures AND set the
	   * uniforms.
	   *
	   *     twgl.setUniforms(programInfo, uniforms);
	   *
	   * For the example above it is equivalent to
	   *
	   *     var texUnit = 0;
	   *     gl.activeTexture(gl.TEXTURE0 + texUnit);
	   *     gl.bindTexture(gl.TEXTURE_2D, tex1);
	   *     gl.uniform1i(u_someSamplerLocation, texUnit++);
	   *     gl.activeTexture(gl.TEXTURE0 + texUnit);
	   *     gl.bindTexture(gl.TEXTURE_2D, tex2);
	   *     gl.uniform1i(u_someSamplerLocation, texUnit++);
	   *     gl.uniform4fv(u_someColorLocation, [1, 0, 0, 1]);
	   *     gl.uniform3fv(u_somePositionLocation, [0, 1, 1]);
	   *     gl.uniformMatrix4fv(u_someMatrix, false, [
	   *         1,0,0,0,
	   *         0,1,0,0,
	   *         0,0,1,0,
	   *         0,0,0,0,
	   *       ]);
	   *
	   * Note it is perfectly reasonable to call `setUniforms` multiple times. For example
	   *
	   *     var uniforms = {
	   *       u_someSampler: tex1,
	   *       u_someOtherSampler: tex2,
	   *     };
	   *
	   *     var moreUniforms {
	   *       u_someColor: [1,0,0,1],
	   *       u_somePosition: [0,1,1],
	   *       u_someMatrix: [
	   *         1,0,0,0,
	   *         0,1,0,0,
	   *         0,0,1,0,
	   *         0,0,0,0,
	   *       ],
	   *     };
	   *
	   *     twgl.setUniforms(programInfo, uniforms);
	   *     twgl.setUniforms(programInfo, moreUniforms);
	   *
	   * You can also add WebGLSamplers to uniform samplers as in
	   *
	   *     var uniforms = {
	   *       u_someSampler: {
	   *         texture: someWebGLTexture,
	   *         sampler: someWebGLSampler,
	   *       },
	   *     };
	   *
	   * In which case both the sampler and texture will be bound to the
	   * same unit.
	   *
	   * @param {(module:twgl.ProgramInfo|Object.<string, function>)} setters a `ProgramInfo` as returned from `createProgramInfo` or the setters returned from
	   *        `createUniformSetters`.
	   * @param {Object.<string, ?>} values an object with values for the
	   *        uniforms.
	   *   You can pass multiple objects by putting them in an array or by calling with more arguments.For example
	   *
	   *     var sharedUniforms = {
	   *       u_fogNear: 10,
	   *       u_projection: ...
	   *       ...
	   *     };
	   *
	   *     var localUniforms = {
	   *       u_world: ...
	   *       u_diffuseColor: ...
	   *     };
	   *
	   *     twgl.setUniforms(programInfo, sharedUniforms, localUniforms);
	   *
	   *     // is the same as
	   *
	   *     twgl.setUniforms(programInfo, [sharedUniforms, localUniforms]);
	   *
	   *     // is the same as
	   *
	   *     twgl.setUniforms(programInfo, sharedUniforms);
	   *     twgl.setUniforms(programInfo, localUniforms};
	   *
	   * @memberOf module:twgl/programs
	   */
	  function setUniforms(setters, values) {
	    // eslint-disable-line
	    var actualSetters = setters.uniformSetters || setters;
	    var numArgs = arguments.length;
	    for (var andx = 1; andx < numArgs; ++andx) {
	      var vals = arguments[andx];
	      if (Array.isArray(vals)) {
	        var numValues = vals.length;
	        for (var ii = 0; ii < numValues; ++ii) {
	          setUniforms(actualSetters, vals[ii]);
	        }
	      } else {
	        for (var name in vals) {
	          var setter = actualSetters[name];
	          if (setter) {
	            setter(vals[name]);
	          }
	        }
	      }
	    }
	  }

	  /**
	   * Creates setter functions for all attributes of a shader
	   * program. You can pass this to {@link module:twgl.setBuffersAndAttributes} to set all your buffers and attributes.
	   *
	   * @see {@link module:twgl.setAttributes} for example
	   * @param {WebGLProgram} program the program to create setters for.
	   * @return {Object.<string, function>} an object with a setter for each attribute by name.
	   * @memberOf module:twgl/programs
	   */
	  function createAttributeSetters(gl, program) {
	    var attribSetters = {};

	    var numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
	    for (var ii = 0; ii < numAttribs; ++ii) {
	      var attribInfo = gl.getActiveAttrib(program, ii);
	      if (!attribInfo) {
	        break;
	      }
	      var index = gl.getAttribLocation(program, attribInfo.name);
	      var typeInfo = attrTypeMap[attribInfo.type];
	      var setter = typeInfo.setter(gl, index, typeInfo);
	      setter.location = index;
	      attribSetters[attribInfo.name] = setter;
	    }

	    return attribSetters;
	  }

	  /**
	   * Sets attributes and binds buffers (deprecated... use {@link module:twgl.setBuffersAndAttributes})
	   *
	   * Example:
	   *
	   *     var program = createProgramFromScripts(
	   *         gl, ["some-vs", "some-fs");
	   *
	   *     var attribSetters = createAttributeSetters(program);
	   *
	   *     var positionBuffer = gl.createBuffer();
	   *     var texcoordBuffer = gl.createBuffer();
	   *
	   *     var attribs = {
	   *       a_position: {buffer: positionBuffer, numComponents: 3},
	   *       a_texcoord: {buffer: texcoordBuffer, numComponents: 2},
	   *     };
	   *
	   *     gl.useProgram(program);
	   *
	   * This will automatically bind the buffers AND set the
	   * attributes.
	   *
	   *     setAttributes(attribSetters, attribs);
	   *
	   * Properties of attribs. For each attrib you can add
	   * properties:
	   *
	   * *   type: the type of data in the buffer. Default = gl.FLOAT
	   * *   normalize: whether or not to normalize the data. Default = false
	   * *   stride: the stride. Default = 0
	   * *   offset: offset into the buffer. Default = 0
	   *
	   * For example if you had 3 value float positions, 2 value
	   * float texcoord and 4 value uint8 colors you'd setup your
	   * attribs like this
	   *
	   *     var attribs = {
	   *       a_position: {buffer: positionBuffer, numComponents: 3},
	   *       a_texcoord: {buffer: texcoordBuffer, numComponents: 2},
	   *       a_color: {
	   *         buffer: colorBuffer,
	   *         numComponents: 4,
	   *         type: gl.UNSIGNED_BYTE,
	   *         normalize: true,
	   *       },
	   *     };
	   *
	   * @param {Object.<string, function>} setters Attribute setters as returned from createAttributeSetters
	   * @param {Object.<string, module:twgl.AttribInfo>} buffers AttribInfos mapped by attribute name.
	   * @memberOf module:twgl/programs
	   * @deprecated use {@link module:twgl.setBuffersAndAttributes}
	   */
	  function setAttributes(setters, buffers) {
	    for (var name in buffers) {
	      var setter = setters[name];
	      if (setter) {
	        setter(buffers[name]);
	      }
	    }
	  }

	  /**
	   * Sets attributes and buffers including the `ELEMENT_ARRAY_BUFFER` if appropriate
	   *
	   * Example:
	   *
	   *     var programInfo = createProgramInfo(
	   *         gl, ["some-vs", "some-fs");
	   *
	   *     var arrays = {
	   *       position: { numComponents: 3, data: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0], },
	   *       texcoord: { numComponents: 2, data: [0, 0, 0, 1, 1, 0, 1, 1],                 },
	   *     };
	   *
	   *     var bufferInfo = createBufferInfoFromArrays(gl, arrays);
	   *
	   *     gl.useProgram(programInfo.program);
	   *
	   * This will automatically bind the buffers AND set the
	   * attributes.
	   *
	   *     setBuffersAndAttributes(gl, programInfo, bufferInfo);
	   *
	   * For the example above it is equivilent to
	   *
	   *     gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	   *     gl.enableVertexAttribArray(a_positionLocation);
	   *     gl.vertexAttribPointer(a_positionLocation, 3, gl.FLOAT, false, 0, 0);
	   *     gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
	   *     gl.enableVertexAttribArray(a_texcoordLocation);
	   *     gl.vertexAttribPointer(a_texcoordLocation, 4, gl.FLOAT, false, 0, 0);
	   *
	   * @param {WebGLRenderingContext} gl A WebGLRenderingContext.
	   * @param {(module:twgl.ProgramInfo|Object.<string, function>)} setters A `ProgramInfo` as returned from {@link module:twgl.createProgrmaInfo} or Attribute setters as returned from {@link module:twgl.createAttributeSetters}
	   * @param {(module:twgl.BufferInfo|module:twgl.vertexArrayInfo)} buffers a `BufferInfo` as returned from {@link module:twgl.createBufferInfoFromArrays}.
	   *   or a `VertexArrayInfo` as returned from {@link module:twgl.createVertexArrayInfo}
	   * @memberOf module:twgl/programs
	   */
	  function setBuffersAndAttributes(gl, programInfo, buffers) {
	    if (buffers.vertexArrayObject) {
	      gl.bindVertexArray(buffers.vertexArrayObject);
	    } else {
	      setAttributes(programInfo.attribSetters || programInfo, buffers.attribs);
	      if (buffers.indices) {
	        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
	      }
	    }
	  }

	  /**
	   * @typedef {Object} ProgramInfo
	   * @property {WebGLProgram} program A shader program
	   * @property {Object<string, function>} uniformSetters object of setters as returned from createUniformSetters,
	   * @property {Object<string, function>} attribSetters object of setters as returned from createAttribSetters,
	   * @propetty {module:twgl.UniformBlockSpec} [uniformBlockSpace] a uniform block spec for making UniformBlockInfos with createUniformBlockInfo etc..
	   * @property {Object<string, module:twgl.TransformFeedbackInfo>} [transformFeedbackInfo] info for transform feedbacks
	   * @memberOf module:twgl
	   */

	  /**
	   * Creates a ProgramInfo from an existing program.
	   *
	   * A ProgramInfo contains
	   *
	   *     programInfo = {
	   *        program: WebGLProgram,
	   *        uniformSetters: object of setters as returned from createUniformSetters,
	   *        attribSetters: object of setters as returned from createAttribSetters,
	   *     }
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext
	   *        to use.
	   * @param {WebGLProgram} program an existing WebGLProgram.
	   * @return {module:twgl.ProgramInfo} The created ProgramInfo.
	   * @memberOf module:twgl/programs
	   */
	  function createProgramInfoFromProgram(gl, program) {
	    var uniformSetters = createUniformSetters(gl, program);
	    var attribSetters = createAttributeSetters(gl, program);
	    var programInfo = {
	      program: program,
	      uniformSetters: uniformSetters,
	      attribSetters: attribSetters
	    };

	    if (utils.isWebGL2(gl)) {
	      programInfo.uniformBlockSpec = createUniformBlockSpecFromProgram(gl, program);
	      programInfo.transformFeedbackInfo = createTransformFeedbackInfo(gl, program);
	    }

	    return programInfo;
	  }

	  /**
	   * Creates a ProgramInfo from 2 sources.
	   *
	   * A ProgramInfo contains
	   *
	   *     programInfo = {
	   *        program: WebGLProgram,
	   *        uniformSetters: object of setters as returned from createUniformSetters,
	   *        attribSetters: object of setters as returned from createAttribSetters,
	   *     }
	   *
	   * NOTE: There are 4 signatures for this function
	   *
	   *     twgl.createProgramInfo(gl, [vs, fs], options);
	   *     twgl.createProgramInfo(gl, [vs, fs], opt_errFunc);
	   *     twgl.createProgramInfo(gl, [vs, fs], opt_attribs, opt_errFunc);
	   *     twgl.createProgramInfo(gl, [vs, fs], opt_attribs, opt_locations, opt_errFunc);
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext
	   *        to use.
	   * @param {string[]} shaderSources Array of sources for the
	   *        shaders or ids. The first is assumed to be the vertex shader,
	   *        the second the fragment shader.
	   * @param {module:twgl.ProgramOptions|string[]} [opt_attribs] Options for the program or an array of attribs names. Locations will be assigned by index if not passed in
	   * @param {number[]} [opt_locations] The locations for the attributes. A parallel array to opt_attribs letting you assign locations.
	   * @param {module:twgl.ErrorCallback} opt_errorCallback callback for errors. By default it just prints an error to the console
	   *        on error. If you want something else pass an callback. It's passed an error message.
	   * @return {module:twgl.ProgramInfo?} The created ProgramInfo or null if it failed to link or compile
	   * @memberOf module:twgl/programs
	   */
	  function createProgramInfo(gl, shaderSources, opt_attribs, opt_locations, opt_errorCallback) {
	    var progOptions = getProgramOptions(opt_attribs, opt_locations, opt_errorCallback);
	    var good = true;
	    shaderSources = shaderSources.map(function (source) {
	      // Lets assume if there is no \n it's an id
	      if (source.indexOf("\n") < 0) {
	        var script = document.getElementById(source);
	        if (!script) {
	          progOptions.errorCallback("no element with id: " + source);
	          good = false;
	        } else {
	          source = script.text;
	        }
	      }
	      return source;
	    });
	    if (!good) {
	      return null;
	    }
	    var program = createProgramFromSources(gl, shaderSources, progOptions);
	    if (!program) {
	      return null;
	    }
	    return createProgramInfoFromProgram(gl, program);
	  }

	  // Using quotes prevents Uglify from changing the names.
	  // No speed diff AFAICT.
	  return {
	    "createAttributeSetters": createAttributeSetters,

	    "createProgram": createProgram,
	    "createProgramFromScripts": createProgramFromScripts,
	    "createProgramFromSources": createProgramFromSources,
	    "createProgramInfo": createProgramInfo,
	    "createProgramInfoFromProgram": createProgramInfoFromProgram,
	    "createUniformSetters": createUniformSetters,
	    "createUniformBlockSpecFromProgram": createUniformBlockSpecFromProgram,
	    "createUniformBlockInfoFromProgram": createUniformBlockInfoFromProgram,
	    "createUniformBlockInfo": createUniformBlockInfo,

	    "createTransformFeedback": createTransformFeedback,
	    "createTransformFeedbackInfo": createTransformFeedbackInfo,
	    "bindTransformFeedbackInfo": bindTransformFeedbackInfo,

	    "setAttributes": setAttributes,
	    "setBuffersAndAttributes": setBuffersAndAttributes,
	    "setUniforms": setUniforms,
	    "setUniformBlock": setUniformBlock,
	    "setBlockUniforms": setBlockUniforms,
	    "bindUniformBlock": bindUniformBlock
	  };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	/*
	 * Copyright 2015, Gregg Tavares.
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *     * Redistributions of source code must retain the above copyright
	 * notice, this list of conditions and the following disclaimer.
	 *     * Redistributions in binary form must reproduce the above
	 * copyright notice, this list of conditions and the following disclaimer
	 * in the documentation and/or other materials provided with the
	 * distribution.
	 *     * Neither the name of Gregg Tavares. nor the names of his
	 * contributors may be used to endorse or promote products derived from
	 * this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(8), __webpack_require__(4)], __WEBPACK_AMD_DEFINE_RESULT__ = function (textures, utils) {
	  "use strict";

	  /**
	   * Framebuffer related functions
	   *
	   * For backward compatibily they are available at both `twgl.framebuffer` and `twgl`
	   * itself
	   *
	   * See {@link module:twgl} for core functions
	   *
	   * @module twgl/framebuffers
	   */

	  // make sure we don't see a global gl

	  var gl = undefined; // eslint-disable-line

	  var UNSIGNED_BYTE = 0x1401;

	  /* PixelFormat */
	  var DEPTH_COMPONENT = 0x1902;
	  var RGBA = 0x1908;

	  /* Framebuffer Object. */
	  var RGBA4 = 0x8056;
	  var RGB5_A1 = 0x8057;
	  var RGB565 = 0x8D62;
	  var DEPTH_COMPONENT16 = 0x81A5;
	  var STENCIL_INDEX = 0x1901;
	  var STENCIL_INDEX8 = 0x8D48;
	  var DEPTH_STENCIL = 0x84F9;
	  var COLOR_ATTACHMENT0 = 0x8CE0;
	  var DEPTH_ATTACHMENT = 0x8D00;
	  var STENCIL_ATTACHMENT = 0x8D20;
	  var DEPTH_STENCIL_ATTACHMENT = 0x821A;

	  /* TextureWrapMode */
	  var REPEAT = 0x2901; // eslint-disable-line
	  var CLAMP_TO_EDGE = 0x812F;
	  var MIRRORED_REPEAT = 0x8370; // eslint-disable-line

	  /* TextureMagFilter */
	  var NEAREST = 0x2600; // eslint-disable-line
	  var LINEAR = 0x2601;

	  /* TextureMinFilter */
	  var NEAREST_MIPMAP_NEAREST = 0x2700; // eslint-disable-line
	  var LINEAR_MIPMAP_NEAREST = 0x2701; // eslint-disable-line
	  var NEAREST_MIPMAP_LINEAR = 0x2702; // eslint-disable-line
	  var LINEAR_MIPMAP_LINEAR = 0x2703; // eslint-disable-line

	  /**
	   * The options for a framebuffer attachment.
	   *
	   * Note: For a `format` that is a texture include all the texture
	   * options from {@link module:twgl.TextureOptions} for example
	   * `min`, `mag`, `clamp`, etc... Note that unlike {@link module:twgl.TextureOptions}
	   * `auto` defaults to `false` for attachment textures but `min` and `mag` default
	   * to `gl.LINEAR` and `wrap` defaults to `CLAMP_TO_EDGE`
	   *
	   * @typedef {Object} AttachmentOptions
	   * @property {number} [attach] The attachment point. Defaults
	   *   to `gl.COLOR_ATTACTMENT0 + ndx` unless type is a depth or stencil type
	   *   then it's gl.DEPTH_ATTACHMENT or `gl.DEPTH_STENCIL_ATTACHMENT` depending
	   *   on the format or attachment type.
	   * @property {number} [format] The format. If one of `gl.RGBA4`,
	   *   `gl.RGB565`, `gl.RGB5_A1`, `gl.DEPTH_COMPONENT16`,
	   *   `gl.STENCIL_INDEX8` or `gl.DEPTH_STENCIL` then will create a
	   *   renderbuffer. Otherwise will create a texture. Default = `gl.RGBA`
	   * @property {number} [type] The type. Used for texture. Default = `gl.UNSIGNED_BYTE`.
	   * @property {number} [target] The texture target for `gl.framebufferTexture2D`.
	   *   Defaults to `gl.TEXTURE_2D`. Set to appropriate face for cube maps.
	   * @property {number} [level] level for `gl.framebufferTexture2D`. Defaults to 0.
	   * @property {WebGLObject} [attachment] An existing renderbuffer or texture.
	   *    If provided will attach this Object. This allows you to share
	   *    attachemnts across framebuffers.
	   * @memberOf module:twgl
	   */

	  var defaultAttachments = [{ format: RGBA, type: UNSIGNED_BYTE, min: LINEAR, wrap: CLAMP_TO_EDGE }, { format: DEPTH_STENCIL }];

	  var attachmentsByFormat = {};
	  attachmentsByFormat[DEPTH_STENCIL] = DEPTH_STENCIL_ATTACHMENT;
	  attachmentsByFormat[STENCIL_INDEX] = STENCIL_ATTACHMENT;
	  attachmentsByFormat[STENCIL_INDEX8] = STENCIL_ATTACHMENT;
	  attachmentsByFormat[DEPTH_COMPONENT] = DEPTH_ATTACHMENT;
	  attachmentsByFormat[DEPTH_COMPONENT16] = DEPTH_ATTACHMENT;

	  function getAttachmentPointForFormat(format) {
	    return attachmentsByFormat[format];
	  }

	  var renderbufferFormats = {};
	  renderbufferFormats[RGBA4] = true;
	  renderbufferFormats[RGB5_A1] = true;
	  renderbufferFormats[RGB565] = true;
	  renderbufferFormats[DEPTH_STENCIL] = true;
	  renderbufferFormats[DEPTH_COMPONENT16] = true;
	  renderbufferFormats[STENCIL_INDEX] = true;
	  renderbufferFormats[STENCIL_INDEX8] = true;

	  function isRenderbufferFormat(format) {
	    return renderbufferFormats[format];
	  }

	  /**
	   * @typedef {Object} FramebufferInfo
	   * @property {WebGLFramebuffer} framebuffer The WebGLFramebuffer for this framebufferInfo
	   * @property {WebGLObject[]} attachments The created attachments in the same order as passed in to {@link module:twgl.createFramebufferInfo}.
	   * @memberOf module:twgl
	   */

	  /**
	   * Creates a framebuffer and attachments.
	   *
	   * This returns a {@link module:twgl.FramebufferInfo} because it needs to return the attachments as well as the framebuffer.
	   *
	   * The simplest usage
	   *
	   *     // create an RGBA/UNSIGNED_BYTE texture and DEPTH_STENCIL renderbuffer
	   *     var fbi = twgl.createFramebufferInfo(gl);
	   *
	   * More complex usage
	   *
	   *     // create an RGB565 renderbuffer and a STENCIL_INDEX8 renderbuffer
	   *     var attachments = [
	   *       { format: RGB565, mag: NEAREST },
	   *       { format: STENCIL_INDEX8 },
	   *     ]
	   *     var fbi = twgl.createFramebufferInfo(gl, attachments);
	   *
	   * Passing in a specific size
	   *
	   *     var width = 256;
	   *     var height = 256;
	   *     var fbi = twgl.createFramebufferInfo(gl, attachments, width, height);
	   *
	   * **Note!!** It is up to you to check if the framebuffer is renderable by calling `gl.checkFramebufferStatus`.
	   * [WebGL only guarantees 3 combinations of attachments work](https://www.khronos.org/registry/webgl/specs/latest/1.0/#6.6).
	   *
	   * @param {WebGLRenderingContext} gl the WebGLRenderingContext
	   * @param {module:twgl.AttachmentOptions[]} [attachments] which attachments to create. If not provided the default is a framebuffer with an
	   *    `RGBA`, `UNSIGNED_BYTE` texture `COLOR_ATTACHMENT0` and a `DEPTH_STENCIL` renderbuffer `DEPTH_STENCIL_ATTACHMENT`.
	   * @param {number} [width] the width for the attachments. Default = size of drawingBuffer
	   * @param {number} [height] the height for the attachments. Defautt = size of drawingBuffer
	   * @return {module:twgl.FramebufferInfo} the framebuffer and attachments.
	   * @memberOf module:twgl/framebuffers
	   */
	  function createFramebufferInfo(gl, attachments, width, height) {
	    var target = gl.FRAMEBUFFER;
	    var fb = gl.createFramebuffer();
	    gl.bindFramebuffer(target, fb);
	    width = width || gl.drawingBufferWidth;
	    height = height || gl.drawingBufferHeight;
	    attachments = attachments || defaultAttachments;
	    var colorAttachmentCount = 0;
	    var framebufferInfo = {
	      framebuffer: fb,
	      attachments: [],
	      width: width,
	      height: height
	    };
	    attachments.forEach(function (attachmentOptions) {
	      var attachment = attachmentOptions.attachment;
	      var format = attachmentOptions.format;
	      var attachmentPoint = getAttachmentPointForFormat(format);
	      if (!attachmentPoint) {
	        attachmentPoint = COLOR_ATTACHMENT0 + colorAttachmentCount++;
	      }
	      if (!attachment) {
	        if (isRenderbufferFormat(format)) {
	          attachment = gl.createRenderbuffer();
	          gl.bindRenderbuffer(gl.RENDERBUFFER, attachment);
	          gl.renderbufferStorage(gl.RENDERBUFFER, format, width, height);
	        } else {
	          var textureOptions = utils.shallowCopy(attachmentOptions);
	          textureOptions.width = width;
	          textureOptions.height = height;
	          if (textureOptions.auto === undefined) {
	            textureOptions.auto = false;
	            textureOptions.min = textureOptions.min || textureOptions.minMag || gl.LINEAR;
	            textureOptions.mag = textureOptions.mag || textureOptions.minMag || gl.LINEAR;
	            textureOptions.wrapS = textureOptions.wrapS || textureOptions.wrap || gl.CLAMP_TO_EDGE;
	            textureOptions.wrapT = textureOptions.wrapT || textureOptions.wrap || gl.CLAMP_TO_EDGE;
	          }
	          attachment = textures.createTexture(gl, textureOptions);
	        }
	      }
	      if (attachment instanceof WebGLRenderbuffer) {
	        gl.framebufferRenderbuffer(target, attachmentPoint, gl.RENDERBUFFER, attachment);
	      } else if (attachment instanceof WebGLTexture) {
	        gl.framebufferTexture2D(target, attachmentPoint, attachmentOptions.texTarget || gl.TEXTURE_2D, attachment, attachmentOptions.level || 0);
	      } else {
	        throw "unknown attachment type";
	      }
	      framebufferInfo.attachments.push(attachment);
	    });
	    return framebufferInfo;
	  }

	  /**
	   * Resizes the attachments of a framebuffer.
	   *
	   * You need to pass in the same `attachments` as you passed in {@link module:twgl.createFramebufferInfo}
	   * because TWGL has no idea the format/type of each attachment.
	   *
	   * The simplest usage
	   *
	   *     // create an RGBA/UNSIGNED_BYTE texture and DEPTH_STENCIL renderbuffer
	   *     var fbi = twgl.createFramebufferInfo(gl);
	   *
	   *     ...
	   *
	   *     function render() {
	   *       if (twgl.resizeCanvasToDisplaySize(gl.canvas)) {
	   *         // resize the attachments
	   *         twgl.resizeFramebufferInfo(gl, fbi);
	   *       }
	   *
	   * More complex usage
	   *
	   *     // create an RGB565 renderbuffer and a STENCIL_INDEX8 renderbuffer
	   *     var attachments = [
	   *       { format: RGB565, mag: NEAREST },
	   *       { format: STENCIL_INDEX8 },
	   *     ]
	   *     var fbi = twgl.createFramebufferInfo(gl, attachments);
	   *
	   *     ...
	   *
	   *     function render() {
	   *       if (twgl.resizeCanvasToDisplaySize(gl.canvas)) {
	   *         // resize the attachments to match
	   *         twgl.resizeFramebufferInfo(gl, fbi, attachments);
	   *       }
	   *
	   * @param {WebGLRenderingContext} gl the WebGLRenderingContext
	   * @param {module:twgl.FramebufferInfo} framebufferInfo a framebufferInfo as returned from {@link module:twgl.createFramebufferInfo}.
	   * @param {module:twgl.AttachmentOptions[]} [attachments] the same attachments options as passed to {@link module:twgl.createFramebufferInfo}.
	   * @param {number} [width] the width for the attachments. Default = size of drawingBuffer
	   * @param {number} [height] the height for the attachments. Defautt = size of drawingBuffer
	   * @memberOf module:twgl/framebuffers
	   */
	  function resizeFramebufferInfo(gl, framebufferInfo, attachments, width, height) {
	    width = width || gl.drawingBufferWidth;
	    height = height || gl.drawingBufferHeight;
	    framebufferInfo.width = width;
	    framebufferInfo.height = height;
	    attachments = attachments || defaultAttachments;
	    attachments.forEach(function (attachmentOptions, ndx) {
	      var attachment = framebufferInfo.attachments[ndx];
	      var format = attachmentOptions.format;
	      if (attachment instanceof WebGLRenderbuffer) {
	        gl.bindRenderbuffer(gl.RENDERBUFFER, attachment);
	        gl.renderbufferStorage(gl.RENDERBUFFER, format, width, height);
	      } else if (attachment instanceof WebGLTexture) {
	        textures.resizeTexture(gl, attachment, attachmentOptions, width, height);
	      } else {
	        throw "unknown attachment type";
	      }
	    });
	  }

	  /**
	   * Binds a framebuffer
	   *
	   * This function pretty much soley exists because I spent hours
	   * trying to figure out why something I wrote wasn't working only
	   * to realize I forget to set the viewport dimensions.
	   * My hope is this function will fix that.
	   *
	   * It is effectively the same as
	   *
	   *     gl.bindFramebuffer(gl.FRAMEBUFFER, someFramebufferInfo.framebuffer);
	   *     gl.viewport(0, 0, someFramebufferInfo.width, someFramebufferInfo.height);
	   *
	   * @param {WebGLRenderingContext} gl the WebGLRenderingContext
	   * @param {module:twgl.FramebufferInfo} [framebufferInfo] a framebufferInfo as returned from {@link module:twgl.createFramebufferInfo}.
	   *   If not passed will bind the canvas.
	   * @param {number} [target] The target. If not passed `gl.FRAMEBUFFER` will be used.
	   * @memberOf module:twgl/framebuffers
	   */

	  function bindFramebufferInfo(gl, framebufferInfo, target) {
	    target = target || gl.FRAMEBUFFER;
	    if (framebufferInfo) {
	      gl.bindFramebuffer(target, framebufferInfo.framebuffer);
	      gl.viewport(0, 0, framebufferInfo.width, framebufferInfo.height);
	    } else {
	      gl.bindFramebuffer(target, null);
	      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
	    }
	  }

	  // Using quotes prevents Uglify from changing the names.
	  // No speed diff AFAICT.
	  return {
	    "bindFramebufferInfo": bindFramebufferInfo,
	    "createFramebufferInfo": createFramebufferInfo,
	    "resizeFramebufferInfo": resizeFramebufferInfo
	  };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	/*
	 * Copyright 2015, Gregg Tavares.
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *     * Redistributions of source code must retain the above copyright
	 * notice, this list of conditions and the following disclaimer.
	 *     * Redistributions in binary form must reproduce the above
	 * copyright notice, this list of conditions and the following disclaimer
	 * in the documentation and/or other materials provided with the
	 * distribution.
	 *     * Neither the name of Gregg Tavares. nor the names of his
	 * contributors may be used to endorse or promote products derived from
	 * this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(4)], __WEBPACK_AMD_DEFINE_RESULT__ = function (typedArrays, utils) {
	  "use strict";

	  /**
	   * Low level texture related functions
	   *
	   * You should generally not need to use these functions. They are provided
	   * for those cases where you're doing something out of the ordinary
	   * and you need lower level access.
	   *
	   * For backward compatibily they are available at both `twgl.textures` and `twgl`
	   * itself
	   *
	   * See {@link module:twgl} for core functions
	   *
	   * @module twgl/textures
	   */

	  // make sure we don't see a global gl

	  var gl = undefined; // eslint-disable-line
	  var defaults = {
	    textureColor: new Uint8Array([128, 192, 255, 255]),
	    textureOptions: {},
	    crossOrigin: undefined
	  };
	  var isArrayBuffer = typedArrays.isArrayBuffer;

	  // Should we make this on demand?
	  var ctx = document.createElement("canvas").getContext("2d");

	  /* PixelFormat */
	  var ALPHA = 0x1906;
	  var RGB = 0x1907;
	  var RGBA = 0x1908;
	  var LUMINANCE = 0x1909;
	  var LUMINANCE_ALPHA = 0x190A;
	  var DEPTH_COMPONENT = 0x1902;
	  var DEPTH_STENCIL = 0x84F9;

	  /* TextureWrapMode */
	  var REPEAT = 0x2901; // eslint-disable-line
	  var MIRRORED_REPEAT = 0x8370; // eslint-disable-line

	  /* TextureMagFilter */
	  var NEAREST = 0x2600; // eslint-disable-line

	  /* TextureMinFilter */
	  var NEAREST_MIPMAP_NEAREST = 0x2700; // eslint-disable-line
	  var LINEAR_MIPMAP_NEAREST = 0x2701; // eslint-disable-line
	  var NEAREST_MIPMAP_LINEAR = 0x2702; // eslint-disable-line
	  var LINEAR_MIPMAP_LINEAR = 0x2703; // eslint-disable-line

	  var R8 = 0x8229;
	  var R8_SNORM = 0x8F94;
	  var R16F = 0x822D;
	  var R32F = 0x822E;
	  var R8UI = 0x8232;
	  var R8I = 0x8231;
	  var RG16UI = 0x823A;
	  var RG16I = 0x8239;
	  var RG32UI = 0x823C;
	  var RG32I = 0x823B;
	  var RG8 = 0x822B;
	  var RG8_SNORM = 0x8F95;
	  var RG16F = 0x822F;
	  var RG32F = 0x8230;
	  var RG8UI = 0x8238;
	  var RG8I = 0x8237;
	  var R16UI = 0x8234;
	  var R16I = 0x8233;
	  var R32UI = 0x8236;
	  var R32I = 0x8235;
	  var RGB8 = 0x8051;
	  var SRGB8 = 0x8C41;
	  var RGB565 = 0x8D62;
	  var RGB8_SNORM = 0x8F96;
	  var R11F_G11F_B10F = 0x8C3A;
	  var RGB9_E5 = 0x8C3D;
	  var RGB16F = 0x881B;
	  var RGB32F = 0x8815;
	  var RGB8UI = 0x8D7D;
	  var RGB8I = 0x8D8F;
	  var RGB16UI = 0x8D77;
	  var RGB16I = 0x8D89;
	  var RGB32UI = 0x8D71;
	  var RGB32I = 0x8D83;
	  var RGBA8 = 0x8058;
	  var SRGB8_ALPHA8 = 0x8C43;
	  var RGBA8_SNORM = 0x8F97;
	  var RGB5_A1 = 0x8057;
	  var RGBA4 = 0x8056;
	  var RGB10_A2 = 0x8059;
	  var RGBA16F = 0x881A;
	  var RGBA32F = 0x8814;
	  var RGBA8UI = 0x8D7C;
	  var RGBA8I = 0x8D8E;
	  var RGB10_A2UI = 0x906F;
	  var RGBA16UI = 0x8D76;
	  var RGBA16I = 0x8D88;
	  var RGBA32I = 0x8D82;
	  var RGBA32UI = 0x8D70;

	  var DEPTH_COMPONENT16 = 0x81A5;
	  var DEPTH_COMPONENT24 = 0x81A6;
	  var DEPTH_COMPONENT32F = 0x8CAC;
	  var DEPTH32F_STENCIL8 = 0x8CAD;
	  var DEPTH24_STENCIL8 = 0x88F0;

	  /* DataType */
	  var BYTE = 0x1400;
	  var UNSIGNED_BYTE = 0x1401;
	  var SHORT = 0x1402;
	  var UNSIGNED_SHORT = 0x1403;
	  var INT = 0x1404;
	  var UNSIGNED_INT = 0x1405;
	  var FLOAT = 0x1406;
	  var UNSIGNED_SHORT_4_4_4_4 = 0x8033;
	  var UNSIGNED_SHORT_5_5_5_1 = 0x8034;
	  var UNSIGNED_SHORT_5_6_5 = 0x8363;
	  var HALF_FLOAT = 0x140B;
	  var HALF_FLOAT_OES = 0x8D61; // Thanks Khronos for making this different >:(
	  var UNSIGNED_INT_2_10_10_10_REV = 0x8368;
	  var UNSIGNED_INT_10F_11F_11F_REV = 0x8C3B;
	  var UNSIGNED_INT_5_9_9_9_REV = 0x8C3E;
	  var FLOAT_32_UNSIGNED_INT_24_8_REV = 0x8DAD;
	  var UNSIGNED_INT_24_8 = 0x84FA;

	  var RG = 0x8227;
	  var RG_INTEGER = 0x8228;
	  var RED = 0x1903;
	  var RED_INTEGER = 0x8D94;
	  var RGB_INTEGER = 0x8D98;
	  var RGBA_INTEGER = 0x8D99;

	  var formatInfo = {};
	  {
	    // NOTE: this is named `numColorComponents` vs `numComponents` so we can let Uglify mangle
	    // the name.
	    var f = formatInfo;
	    f[ALPHA] = { numColorComponents: 1 };
	    f[LUMINANCE] = { numColorComponents: 1 };
	    f[LUMINANCE_ALPHA] = { numColorComponents: 2 };
	    f[RGB] = { numColorComponents: 3 };
	    f[RGBA] = { numColorComponents: 4 };
	    f[RED] = { numColorComponents: 1 };
	    f[RED_INTEGER] = { numColorComponents: 1 };
	    f[RG] = { numColorComponents: 2 };
	    f[RG_INTEGER] = { numColorComponents: 2 };
	    f[RGB] = { numColorComponents: 3 };
	    f[RGB_INTEGER] = { numColorComponents: 3 };
	    f[RGBA] = { numColorComponents: 4 };
	    f[RGBA_INTEGER] = { numColorComponents: 4 };
	    f[DEPTH_COMPONENT] = { numColorComponents: 1 };
	    f[DEPTH_STENCIL] = { numColorComponents: 2 };
	  }

	  var textureInternalFormatInfo = {};
	  {
	    (function () {
	      // NOTE: these properties need unique names so we can let Uglify mangle the name.
	      var t = textureInternalFormatInfo;
	      // unsized formats
	      t[ALPHA] = { textureFormat: ALPHA, colorRenderable: true, textureFilterable: true, bytesPerElement: [1, 2, 2, 4], type: [UNSIGNED_BYTE, HALF_FLOAT, HALF_FLOAT_OES, FLOAT] };
	      t[LUMINANCE] = { textureFormat: LUMINANCE, colorRenderable: true, textureFilterable: true, bytesPerElement: [1, 2, 2, 4], type: [UNSIGNED_BYTE, HALF_FLOAT, HALF_FLOAT_OES, FLOAT] };
	      t[LUMINANCE_ALPHA] = { textureFormat: LUMINANCE_ALPHA, colorRenderable: true, textureFilterable: true, bytesPerElement: [2, 4, 4, 8], type: [UNSIGNED_BYTE, HALF_FLOAT, HALF_FLOAT_OES, FLOAT] };
	      t[RGB] = { textureFormat: RGB, colorRenderable: true, textureFilterable: true, bytesPerElement: [3, 6, 6, 12, 2], type: [UNSIGNED_BYTE, HALF_FLOAT, HALF_FLOAT_OES, FLOAT, UNSIGNED_SHORT_5_6_5] };
	      t[RGBA] = { textureFormat: RGBA, colorRenderable: true, textureFilterable: true, bytesPerElement: [4, 8, 8, 16, 2, 2], type: [UNSIGNED_BYTE, HALF_FLOAT, HALF_FLOAT_OES, FLOAT, UNSIGNED_SHORT_4_4_4_4, UNSIGNED_SHORT_5_5_5_1] };

	      // sized formats
	      t[R8] = { textureFormat: RED, colorRenderable: true, textureFilterable: true, bytesPerElement: 1, type: UNSIGNED_BYTE };
	      t[R8_SNORM] = { textureFormat: RED, colorRenderable: false, textureFilterable: true, bytesPerElement: 1, type: BYTE };
	      t[R16F] = { textureFormat: RED, colorRenderable: false, textureFilterable: true, bytesPerElement: [4, 2], type: [FLOAT, HALF_FLOAT] };
	      t[R32F] = { textureFormat: RED, colorRenderable: false, textureFilterable: false, bytesPerElement: 4, type: FLOAT };
	      t[R8UI] = { textureFormat: RED_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 1, type: UNSIGNED_BYTE };
	      t[R8I] = { textureFormat: RED_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 1, type: BYTE };
	      t[R16UI] = { textureFormat: RED_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 2, type: UNSIGNED_SHORT };
	      t[R16I] = { textureFormat: RED_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 2, type: SHORT };
	      t[R32UI] = { textureFormat: RED_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 4, type: UNSIGNED_INT };
	      t[R32I] = { textureFormat: RED_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 4, type: INT };
	      t[RG8] = { textureFormat: RG, colorRenderable: true, textureFilterable: true, bytesPerElement: 2, type: UNSIGNED_BYTE };
	      t[RG8_SNORM] = { textureFormat: RG, colorRenderable: false, textureFilterable: true, bytesPerElement: 2, type: BYTE };
	      t[RG16F] = { textureFormat: RG, colorRenderable: false, textureFilterable: true, bytesPerElement: [8, 4], type: [FLOAT, HALF_FLOAT] };
	      t[RG32F] = { textureFormat: RG, colorRenderable: false, textureFilterable: false, bytesPerElement: 8, type: FLOAT };
	      t[RG8UI] = { textureFormat: RG_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 2, type: UNSIGNED_BYTE };
	      t[RG8I] = { textureFormat: RG_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 2, type: BYTE };
	      t[RG16UI] = { textureFormat: RG_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 4, type: UNSIGNED_SHORT };
	      t[RG16I] = { textureFormat: RG_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 4, type: SHORT };
	      t[RG32UI] = { textureFormat: RG_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 8, type: UNSIGNED_INT };
	      t[RG32I] = { textureFormat: RG_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 8, type: INT };
	      t[RGB8] = { textureFormat: RGB, colorRenderable: true, textureFilterable: true, bytesPerElement: 3, type: UNSIGNED_BYTE };
	      t[SRGB8] = { textureFormat: RGB, colorRenderable: false, textureFilterable: true, bytesPerElement: 3, type: UNSIGNED_BYTE };
	      t[RGB565] = { textureFormat: RGB, colorRenderable: true, textureFilterable: true, bytesPerElement: [3, 2], type: [UNSIGNED_BYTE, UNSIGNED_SHORT_5_6_5] };
	      t[RGB8_SNORM] = { textureFormat: RGB, colorRenderable: false, textureFilterable: true, bytesPerElement: 3, type: BYTE };
	      t[R11F_G11F_B10F] = { textureFormat: RGB, colorRenderable: false, textureFilterable: true, bytesPerElement: [12, 6, 4], type: [FLOAT, HALF_FLOAT, UNSIGNED_INT_10F_11F_11F_REV] };
	      t[RGB9_E5] = { textureFormat: RGB, colorRenderable: false, textureFilterable: true, bytesPerElement: [12, 6, 4], type: [FLOAT, HALF_FLOAT, UNSIGNED_INT_5_9_9_9_REV] };
	      t[RGB16F] = { textureFormat: RGB, colorRenderable: false, textureFilterable: true, bytesPerElement: [12, 6], type: [FLOAT, HALF_FLOAT] };
	      t[RGB32F] = { textureFormat: RGB, colorRenderable: false, textureFilterable: false, bytesPerElement: 12, type: FLOAT };
	      t[RGB8UI] = { textureFormat: RGB_INTEGER, colorRenderable: false, textureFilterable: false, bytesPerElement: 3, type: UNSIGNED_BYTE };
	      t[RGB8I] = { textureFormat: RGB_INTEGER, colorRenderable: false, textureFilterable: false, bytesPerElement: 3, type: BYTE };
	      t[RGB16UI] = { textureFormat: RGB_INTEGER, colorRenderable: false, textureFilterable: false, bytesPerElement: 6, type: UNSIGNED_SHORT };
	      t[RGB16I] = { textureFormat: RGB_INTEGER, colorRenderable: false, textureFilterable: false, bytesPerElement: 6, type: SHORT };
	      t[RGB32UI] = { textureFormat: RGB_INTEGER, colorRenderable: false, textureFilterable: false, bytesPerElement: 12, type: UNSIGNED_INT };
	      t[RGB32I] = { textureFormat: RGB_INTEGER, colorRenderable: false, textureFilterable: false, bytesPerElement: 12, type: INT };
	      t[RGBA8] = { textureFormat: RGBA, colorRenderable: true, textureFilterable: true, bytesPerElement: 4, type: UNSIGNED_BYTE };
	      t[SRGB8_ALPHA8] = { textureFormat: RGBA, colorRenderable: true, textureFilterable: true, bytesPerElement: 4, type: UNSIGNED_BYTE };
	      t[RGBA8_SNORM] = { textureFormat: RGBA, colorRenderable: false, textureFilterable: true, bytesPerElement: 4, type: BYTE };
	      t[RGB5_A1] = { textureFormat: RGBA, colorRenderable: true, textureFilterable: true, bytesPerElement: [4, 2, 4], type: [UNSIGNED_BYTE, UNSIGNED_SHORT_5_5_5_1, UNSIGNED_INT_2_10_10_10_REV] };
	      t[RGBA4] = { textureFormat: RGBA, colorRenderable: true, textureFilterable: true, bytesPerElement: [4, 2], type: [UNSIGNED_BYTE, UNSIGNED_SHORT_4_4_4_4] };
	      t[RGB10_A2] = { textureFormat: RGBA, colorRenderable: true, textureFilterable: true, bytesPerElement: 4, type: UNSIGNED_INT_2_10_10_10_REV };
	      t[RGBA16F] = { textureFormat: RGBA, colorRenderable: false, textureFilterable: true, bytesPerElement: [16, 8], type: [FLOAT, HALF_FLOAT] };
	      t[RGBA32F] = { textureFormat: RGBA, colorRenderable: false, textureFilterable: false, bytesPerElement: 16, type: FLOAT };
	      t[RGBA8UI] = { textureFormat: RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 4, type: UNSIGNED_BYTE };
	      t[RGBA8I] = { textureFormat: RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 4, type: BYTE };
	      t[RGB10_A2UI] = { textureFormat: RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 4, type: UNSIGNED_INT_2_10_10_10_REV };
	      t[RGBA16UI] = { textureFormat: RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 8, type: UNSIGNED_SHORT };
	      t[RGBA16I] = { textureFormat: RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 8, type: SHORT };
	      t[RGBA32I] = { textureFormat: RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 16, type: INT };
	      t[RGBA32UI] = { textureFormat: RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: 16, type: UNSIGNED_INT };
	      // Sized Internal
	      t[DEPTH_COMPONENT16] = { textureFormat: DEPTH_COMPONENT, colorRenderable: true, textureFilterable: false, bytesPerElement: [2, 4], type: [UNSIGNED_SHORT, UNSIGNED_INT] };
	      t[DEPTH_COMPONENT24] = { textureFormat: DEPTH_COMPONENT, colorRenderable: true, textureFilterable: false, bytesPerElement: 4, type: UNSIGNED_INT };
	      t[DEPTH_COMPONENT32F] = { textureFormat: DEPTH_COMPONENT, colorRenderable: true, textureFilterable: false, bytesPerElement: 4, type: FLOAT };
	      t[DEPTH24_STENCIL8] = { textureFormat: DEPTH_STENCIL, colorRenderable: true, textureFilterable: false, bytesPerElement: 4, type: UNSIGNED_INT_24_8 };
	      t[DEPTH32F_STENCIL8] = { textureFormat: DEPTH_STENCIL, colorRenderable: true, textureFilterable: false, bytesPerElement: 4, type: FLOAT_32_UNSIGNED_INT_24_8_REV };

	      Object.keys(t).forEach(function (internalFormat) {
	        var info = t[internalFormat];
	        info.bytesPerElementMap = {};
	        if (Array.isArray(info.bytesPerElement)) {
	          info.bytesPerElement.forEach(function (bytesPerElement, ndx) {
	            var type = info.type[ndx];
	            info.bytesPerElementMap[type] = bytesPerElement;
	          });
	        } else {
	          var type = info.type;
	          info.bytesPerElementMap[type] = info.bytesPerElement;
	        }
	      });
	    })();
	  }

	  /**
	   * Gets the number of bytes per element for a given internalFormat / type
	   * @param {number} internalFormat The internalFormat parameter from texImage2D etc..
	   * @param {number} type The type parameter for texImage2D etc..
	   * @return {number} the number of bytes per element for the given internalFormat, type combo
	   * @memberOf module:twgl/textures
	   */
	  function getBytesPerElementForInternalFormat(internalFormat, type) {
	    var info = textureInternalFormatInfo[internalFormat];
	    if (!info) {
	      throw "unknown internal format";
	    }
	    var bytesPerElement = info.bytesPerElementMap[type];
	    if (bytesPerElement === undefined) {
	      throw "unknown internal format";
	    }
	    return bytesPerElement;
	  }

	  /**
	   * Gets the format for a given internalFormat
	   *
	   * @param {number} internalFormat The internal format
	   * @return {{format:number, type:number}} the corresponding format and type
	   */
	  function getFormatAndTypeForInternalFormat(internalFormat) {
	    var info = textureInternalFormatInfo[internalFormat];
	    if (!info) {
	      throw "unknown internal format";
	    }
	    return {
	      format: info.textureFormat,
	      type: Array.isArray(info.type) ? info.type[0] : info.type
	    };
	  }

	  /**
	   * Returns true if value is power of 2
	   * @param {number} value number to check.
	   * @return true if value is power of 2
	   */
	  function isPowerOf2(value) {
	    return (value & value - 1) === 0;
	  }

	  /**
	   * Gets whether or not we can generate mips for the given format
	   * @param {number} internalFormat The internalFormat parameter from texImage2D etc..
	   * @param {number} type The type parameter for texImage2D etc..
	   * @return {boolean} true if we can generate mips
	   */
	  function canGenerateMipmap(gl, width, height, internalFormat /*, type */) {
	    if (!utils.isWebGL2(gl)) {
	      return isPowerOf2(width) && isPowerOf2(height);
	    }
	    var info = textureInternalFormatInfo[internalFormat];
	    if (!info) {
	      throw "unknown internal format";
	    }
	    return info.colorRenderable && info.textureFilterable;
	  }

	  /**
	   * Gets whether or not we can generate mips for the given format
	   * @param {number} internalFormat The internalFormat parameter from texImage2D etc..
	   * @param {number} type The type parameter for texImage2D etc..
	   * @return {boolean} true if we can generate mips
	   */
	  function canFilter(internalFormat /*, type */) {
	    var info = textureInternalFormatInfo[internalFormat];
	    if (!info) {
	      throw "unknown internal format";
	    }
	    return info.textureFilterable;
	  }

	  /**
	   * Gets the number of compontents for a given image format.
	   * @param {number} format the format.
	   * @return {number} the number of components for the format.
	   * @memberOf module:twgl/textures
	   */
	  function getNumComponentsForFormat(format) {
	    var info = formatInfo[format];
	    if (!info) {
	      throw "unknown format: " + format;
	    }
	    return info.numColorComponents;
	  }

	  /**
	   * Gets the texture type for a given array type.
	   * @param {WebGLRenderingContext} gl the WebGLRenderingContext
	   * @return {number} the gl texture type
	   */
	  function getTextureTypeForArrayType(gl, src, defaultType) {
	    if (isArrayBuffer(src)) {
	      return typedArrays.getGLTypeForTypedArray(src);
	    }
	    return defaultType || gl.UNSIGNED_BYTE;
	  }

	  function guessDimensions(gl, target, width, height, numElements) {
	    if (numElements % 1 !== 0) {
	      throw "can't guess dimensions";
	    }
	    if (!width && !height) {
	      var size = Math.sqrt(numElements / (target === gl.TEXTURE_CUBE_MAP ? 6 : 1));
	      if (size % 1 === 0) {
	        width = size;
	        height = size;
	      } else {
	        width = numElements;
	        height = 1;
	      }
	    } else if (!height) {
	      height = numElements / width;
	      if (height % 1) {
	        throw "can't guess dimensions";
	      }
	    } else if (!width) {
	      width = numElements / height;
	      if (width % 1) {
	        throw "can't guess dimensions";
	      }
	    }
	    return {
	      width: width,
	      height: height
	    };
	  }

	  /**
	   * Sets the default texture color.
	   *
	   * The default texture color is used when loading textures from
	   * urls. Because the URL will be loaded async we'd like to be
	   * able to use the texture immediately. By putting a 1x1 pixel
	   * color in the texture we can start using the texture before
	   * the URL has loaded.
	   *
	   * @param {number[]} color Array of 4 values in the range 0 to 1
	   * @deprecated see {@link module:twgl.setDefaults}
	   * @memberOf module:twgl/textures
	   */
	  function setDefaultTextureColor(color) {
	    defaults.textureColor = new Uint8Array([color[0] * 255, color[1] * 255, color[2] * 255, color[3] * 255]);
	  }

	  function setDefaults(newDefaults) {
	    utils.copyExistingProperties(newDefaults, defaults);
	    if (newDefaults.textureColor) {
	      setDefaultTextureColor(newDefaults.textureColor);
	    }
	  }

	  /**
	   * Gets a string for gl enum
	   *
	   * Note: Several enums are the same. Without more
	   * context (which function) it's impossible to always
	   * give the correct enum.
	   *
	   * @param {WebGLRenderingContext} gl A WebGLRenderingContext
	   * @param {number} value the value of the enum you want to look up.
	   */
	  var glEnumToString = function () {
	    var enums;

	    function init(gl) {
	      if (!enums) {
	        enums = {};
	        for (var key in gl) {
	          if (typeof gl[key] === 'number') {
	            enums[gl[key]] = key;
	          }
	        }
	      }
	    }

	    return function glEnumToString(gl, value) {
	      init(gl);
	      return enums[value] || "0x" + value.toString(16);
	    };
	  }();

	  /**
	   * A function to generate the source for a texture.
	   * @callback TextureFunc
	   * @param {WebGLRenderingContext} gl A WebGLRenderingContext
	   * @param {module:twgl.TextureOptions} options the texture options
	   * @return {*} Returns any of the things documentented for `src` for {@link module:twgl.TextureOptions}.
	   * @memberOf module:twgl
	   */

	  /**
	   * Texture options passed to most texture functions. Each function will use whatever options
	   * are appropriate for its needs. This lets you pass the same options to all functions.
	   *
	   * @typedef {Object} TextureOptions
	   * @property {number} [target] the type of texture `gl.TEXTURE_2D` or `gl.TEXTURE_CUBE_MAP`. Defaults to `gl.TEXTURE_2D`.
	   * @property {number} [level] the mip level to affect. Defaults to 0. Note, if set auto will be considered false unless explicitly set to true.
	   * @property {number} [width] the width of the texture. Only used if src is an array or typed array or null.
	   * @property {number} [height] the height of a texture. Only used if src is an array or typed array or null.
	   * @property {number} [depth] the depth of a texture. Only used if src is an array or type array or null and target is `TEXTURE_3D` .
	   * @property {number} [min] the min filter setting (eg. `gl.LINEAR`). Defaults to `gl.NEAREST_MIPMAP_LINEAR`
	   *     or if texture is not a power of 2 on both dimensions then defaults to `gl.LINEAR`.
	   * @property {number} [mag] the mag filter setting (eg. `gl.LINEAR`). Defaults to `gl.LINEAR`
	   * @property {number} [minMag] both the min and mag filter settings.
	   * @property {number} [internalFormat] internal format for texture. Defaults to `gl.RGBA`
	   * @property {number} [format] format for texture. Defaults to `gl.RGBA`.
	   * @property {number} [type] type for texture. Defaults to `gl.UNSIGNED_BYTE` unless `src` is ArrayBuffer. If `src`
	   *     is ArrayBuffer defaults to type that matches ArrayBuffer type.
	   * @property {number} [wrap] Texture wrapping for both S and T (and R if TEXTURE_3D or WebGLSampler). Defaults to `gl.REPEAT` for 2D unless src is WebGL1 and src not npot and `gl.CLAMP_TO_EDGE` for cube
	   * @property {number} [wrapS] Texture wrapping for S. Defaults to `gl.REPEAT` and `gl.CLAMP_TO_EDGE` for cube. If set takes precedence over `wrap`.
	   * @property {number} [wrapT] Texture wrapping for T. Defaults to `gl.REPEAT` and `gl.CLAMP_TO_EDGE` for cube. If set takes precedence over `wrap`.
	   * @property {number} [wrapR] Texture wrapping for R. Defaults to `gl.REPEAT` and `gl.CLAMP_TO_EDGE` for cube. If set takes precedence over `wrap`.
	   * @property {number} [minLod] TEXTURE_MIN_LOD setting
	   * @property {number} [maxLod] TEXTURE_MAX_LOD setting
	   * @property {number} [baseLevel] TEXTURE_BASE_LEVEL setting
	   * @property {number} [maxLevel] TEXTURE_MAX_LEVEL setting
	   * @property {number} [unpackAlignment] The `gl.UNPACK_ALIGNMENT` used when uploading an array. Defaults to 1.
	   * @property {number} [premultiplyAlpha] Whether or not to premultiply alpha. Defaults to whatever the current setting is.
	   *     This lets you set it once before calling `twgl.createTexture` or `twgl.createTextures` and only override
	   *     the current setting for specific textures.
	   * @property {number} [flipY] Whether or not to flip the texture vertically on upload. Defaults to whatever the current setting is.
	   *     This lets you set it once before calling `twgl.createTexture` or `twgl.createTextures` and only override
	   *     the current setting for specific textures.
	   * @property {number} [colorspaceConversion] Whether or not to let the browser do colorspace conversion of the texture on upload. Defaults to whatever the current setting is.
	   *     This lets you set it once before calling `twgl.createTexture` or `twgl.createTextures` and only override
	   *     the current setting for specific textures.
	   * @property {(number[]|ArrayBuffer)} color color used as temporary 1x1 pixel color for textures loaded async when src is a string.
	   *    If it's a JavaScript array assumes color is 0 to 1 like most GL colors as in `[1, 0, 0, 1] = red=1, green=0, blue=0, alpha=0`.
	   *    Defaults to `[0.5, 0.75, 1, 1]`. See {@link module:twgl.setDefaultTextureColor}. If `false` texture is set. Can be used to re-load a texture
	   * @property {boolean} [auto] If `undefined` or `true`, in WebGL1, texture filtering is set automatically for non-power of 2 images and
	   *    mips are generated for power of 2 images. In WebGL2 mips are generated if they can be. Note: if `level` is set above
	   *    then then `auto` is assumed to be `false` unless explicity set to `true`.
	   * @property {number[]} [cubeFaceOrder] The order that cube faces are pulled out of an img or set of images. The default is
	   *
	   *     [gl.TEXTURE_CUBE_MAP_POSITIVE_X,
	   *      gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
	   *      gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
	   *      gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
	   *      gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
	   *      gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]
	   *
	   * @property {(number[]|ArrayBuffer|HTMLCanvasElement|HTMLImageElement|HTMLVideoElement|string|string[]|module:twgl.TextureFunc)} [src] source for texture
	   *
	   *    If `string` then it's assumed to be a URL to an image. The image will be downloaded async. A usable
	   *    1x1 pixel texture will be returned immediatley. The texture will be updated once the image has downloaded.
	   *    If `target` is `gl.TEXTURE_CUBE_MAP` will attempt to divide image into 6 square pieces. 1x6, 6x1, 3x2, 2x3.
	   *    The pieces will be uploaded in `cubeFaceOrder`
	   *
	   *    If `string[]` then it must have 6 entries, one for each face of a cube map. Target must be `gl.TEXTURE_CUBE_MAP`.
	   *
	   *    If `HTMLElement` then it wil be used immediately to create the contents of the texture. Examples `HTMLImageElement`,
	   *    `HTMLCanvasElement`, `HTMLVideoElement`.
	   *
	   *    If `number[]` or `ArrayBuffer` it's assumed to be data for a texture. If `width` or `height` is
	   *    not specified it is guessed as follows. First the number of elements is computed by `src.length / numComponents`
	   *    where `numComponents` is derived from `format`. If `target` is `gl.TEXTURE_CUBE_MAP` then `numElements` is divided
	   *    by 6. Then
	   *
	   *    *   If neither `width` nor `height` are specified and `sqrt(numElements)` is an integer then width and height
	   *        are set to `sqrt(numElements)`. Otherwise `width = numElements` and `height = 1`.
	   *
	   *    *   If only one of `width` or `height` is specified then the other equals `numElements / specifiedDimension`.
	   *
	   * If `number[]` will be converted to `type`.
	   *
	   * If `src` is a function it will be called with a `WebGLRenderingContext` and these options.
	   * Whatever it returns is subject to these rules. So it can return a string url, an `HTMLElement`
	   * an array etc...
	   *
	   * If `src` is undefined then an empty texture will be created of size `width` by `height`.
	   *
	   * @property {string} [crossOrigin] What to set the crossOrigin property of images when they are downloaded.
	   *    default: undefined. Also see {@link module:twgl.setDefaults}.
	   *
	   * @memberOf module:twgl
	   */

	  // NOTE: While querying GL is considered slow it's not remotely as slow
	  // as uploading a texture. On top of that you're unlikely to call this in
	  // a perf critical loop. Even if upload a texture every frame that's unlikely
	  // to be more than 1 or 2 textures a frame. In other words, the benefits of
	  // making the API easy to use outweigh any supposed perf benefits
	  var lastPackState = {};

	  /**
	   * Saves any packing state that will be set based on the options.
	   * @param {module:twgl.TextureOptions} options A TextureOptions object with whatever parameters you want set.
	   * @param {WebGLRenderingContext} gl the WebGLRenderingContext
	   */
	  function savePackState(gl, options) {
	    if (options.colorspaceConversion !== undefined) {
	      lastPackState.colorspaceConversion = gl.getParameter(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL);
	      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, options.colorspaceConversion);
	    }
	    if (options.premultiplyAlpha !== undefined) {
	      lastPackState.premultiplyAlpha = gl.getParameter(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL);
	      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, options.premultiplyAlpha);
	    }
	    if (options.flipY !== undefined) {
	      lastPackState.flipY = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);
	      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, options.flipY);
	    }
	  }

	  /**
	   * Restores any packing state that was set based on the options.
	   * @param {module:twgl.TextureOptions} options A TextureOptions object with whatever parameters you want set.
	   * @param {WebGLRenderingContext} gl the WebGLRenderingContext
	   */
	  function restorePackState(gl, options) {
	    if (options.colorspaceConversion !== undefined) {
	      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, lastPackState.colorspaceConversion);
	    }
	    if (options.premultiplyAlpha !== undefined) {
	      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, lastPackState.premultiplyAlpha);
	    }
	    if (options.flipY !== undefined) {
	      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, lastPackState.flipY);
	    }
	  }

	  var WebGLSamplerCtor = window.WebGLSampler || function NotWebGLSampler() {};

	  /**
	   * Sets the parameters of a texture or sampler
	   * @param {WebGLRenderingContext} gl the WebGLRenderingContext
	   * @param {number|WebGLSampler} target texture target or sampler
	   * @param {function()} parameteriFn texParamteri or samplerParameteri fn
	   * @param {WebGLTexture} tex the WebGLTexture to set parameters for
	   * @param {module:twgl.TextureOptions} options A TextureOptions object with whatever parameters you want set.
	   *   This is often the same options you passed in when you created the texture.
	   */
	  function setTextureSamplerParameters(gl, target, parameteriFn, options) {
	    if (options.minMag) {
	      parameteriFn.call(gl, target, gl.TEXTURE_MIN_FILTER, options.minMag);
	      parameteriFn.call(gl, target, gl.TEXTURE_MAG_FILTER, options.minMag);
	    }
	    if (options.min) {
	      parameteriFn.call(gl, target, gl.TEXTURE_MIN_FILTER, options.min);
	    }
	    if (options.mag) {
	      parameteriFn.call(gl, target, gl.TEXTURE_MAG_FILTER, options.mag);
	    }
	    if (options.wrap) {
	      parameteriFn.call(gl, target, gl.TEXTURE_WRAP_S, options.wrap);
	      parameteriFn.call(gl, target, gl.TEXTURE_WRAP_T, options.wrap);
	      if (target === gl.TEXTURE_3D || target instanceof WebGLSamplerCtor) {
	        parameteriFn.call(gl, target, gl.TEXTURE_WRAP_R, options.wrap);
	      }
	    }
	    if (options.wrapR) {
	      parameteriFn.call(gl, target, gl.TEXTURE_WRAP_R, options.wrapR);
	    }
	    if (options.wrapS) {
	      parameteriFn.call(gl, target, gl.TEXTURE_WRAP_S, options.wrapS);
	    }
	    if (options.wrapT) {
	      parameteriFn.call(gl, target, gl.TEXTURE_WRAP_T, options.wrapT);
	    }
	    if (options.minLod) {
	      parameteriFn.call(gl, target, gl.TEXTURE_MIN_LOD, options.minLod);
	    }
	    if (options.maxLod) {
	      parameteriFn.call(gl, target, gl.TEXTURE_MAX_LOD, options.maxLod);
	    }
	    if (options.baseLevel) {
	      parameteriFn.call(gl, target, gl.TEXTURE_BASE_LEVEL, options.baseLevel);
	    }
	    if (options.maxLevel) {
	      parameteriFn.call(gl, target, gl.TEXTURE_MAX_LEVEL, options.maxLevel);
	    }
	  }

	  /**
	   * Sets the texture parameters of a texture.
	   * @param {WebGLRenderingContext} gl the WebGLRenderingContext
	   * @param {WebGLTexture} tex the WebGLTexture to set parameters for
	   * @param {module:twgl.TextureOptions} options A TextureOptions object with whatever parameters you want set.
	   *   This is often the same options you passed in when you created the texture.
	   * @memberOf module:twgl/textures
	   */
	  function setTextureParameters(gl, tex, options) {
	    var target = options.target || gl.TEXTURE_2D;
	    gl.bindTexture(target, tex);
	    setTextureSamplerParameters(gl, target, gl.texParameteri, options);
	  }

	  /**
	   * Sets the sampler parameters of a sampler.
	   * @param {WebGLRenderingContext} gl the WebGLRenderingContext
	   * @param {WebGLSampler} sampler the WebGLSampler to set parameters for
	   * @param {module:twgl.TextureOptions} options A TextureOptions object with whatever parameters you want set.
	   * @memberOf module:twgl/textures
	   */
	  function setSamplerParameters(gl, sampler, options) {
	    setTextureSamplerParameters(gl, sampler, gl.samplerParameteri, options);
	  }

	  /**
	   * Creates a new sampler object and sets parameters.
	   *
	   * Example:
	   *
	   *      const sampler = twgl.createSampler(gl, {
	   *        minMag: gl.NEAREST,         // sets both TEXTURE_MIN_FILTER and TEXTURE_MAG_FILTER
	   *        wrap: gl.CLAMP_TO_NEAREST,  // sets both TEXTURE_WRAP_S and TEXTURE_WRAP_T and TEXTURE_WRAP_R
	   *      });
	   *
	   * @param {WebGLRenderingContext} gl the WebGLRenderingContext
	   * @param {Object.<string,module:twgl.TextureOptions>} options A object of TextureOptions one per sampler.
	   * @return {Object.<string,WebGLSampler>} the created samplers by name
	   */
	  function createSampler(gl, options) {
	    var sampler = gl.createSampler();
	    setSamplerParameters(gl, sampler, options);
	    return sampler;
	  }

	  /**
	   * Creates a multiple sampler objects and sets parameters on each.
	   *
	   * Example:
	   *
	   *      const samplers = twgl.createSamplers(gl, {
	   *        nearest: {
	   *          minMag: gl.NEAREST,
	   *        },
	   *        nearestClampS: {
	   *          minMag: gl.NEAREST,
	   *          wrapS: gl.CLAMP_TO_NEAREST,
	   *        },
	   *        linear: {
	   *          minMag: gl.LINEAR,
	   *        },
	   *        nearestClamp: {
	   *          minMag: gl.NEAREST,
	   *          wrap: gl.CLAMP_TO_EDGE,
	   *        },
	   *        linearClamp: {
	   *          minMag: gl.LINEAR,
	   *          wrap: gl.CLAMP_TO_EDGE,
	   *        },
	   *        linearClampT: {
	   *          minMag: gl.LINEAR,
	   *          wrapT: gl.CLAMP_TO_EDGE,
	   *        },
	   *      });
	   *
	   * @param {WebGLRenderingContext} gl the WebGLRenderingContext
	   * @param {module:twgl.TextureOptions} [options] A TextureOptions object with whatever parameters you want set on the sampler
	   */
	  function createSamplers(gl, samplerOptions) {
	    var samplers = {};
	    Object.keys(samplerOptions).forEach(function (name) {
	      samplers[name] = createSampler(gl, samplerOptions[name]);
	    });
	    return samplers;
	  }

	  /**
	   * Makes a 1x1 pixel
	   * If no color is passed in uses the default color which can be set by calling `setDefaultTextureColor`.
	   * @param {(number[]|ArrayBuffer)} [color] The color using 0-1 values
	   * @return {Uint8Array} Unit8Array with color.
	   */
	  function make1Pixel(color) {
	    color = color || defaults.textureColor;
	    if (isArrayBuffer(color)) {
	      return color;
	    }
	    return new Uint8Array([color[0] * 255, color[1] * 255, color[2] * 255, color[3] * 255]);
	  }

	  /**
	   * Sets filtering or generates mips for texture based on width or height
	   * If width or height is not passed in uses `options.width` and//or `options.height`
	   *
	   * @param {WebGLRenderingContext} gl the WebGLRenderingContext
	   * @param {WebGLTexture} tex the WebGLTexture to set parameters for
	   * @param {module:twgl.TextureOptions} [options] A TextureOptions object with whatever parameters you want set.
	   *   This is often the same options you passed in when you created the texture.
	   * @param {number} [width] width of texture
	   * @param {number} [height] height of texture
	   * @param {number} [internalFormat] The internalFormat parameter from texImage2D etc..
	   * @param {number} [type] The type parameter for texImage2D etc..
	   * @memberOf module:twgl/textures
	   */
	  function setTextureFilteringForSize(gl, tex, options, width, height, internalFormat, type) {
	    options = options || defaults.textureOptions;
	    internalFormat = internalFormat || gl.RGBA;
	    type = type || gl.UNSIGNED_BYTE;
	    var target = options.target || gl.TEXTURE_2D;
	    width = width || options.width;
	    height = height || options.height;
	    gl.bindTexture(target, tex);
	    if (canGenerateMipmap(gl, width, height, internalFormat, type)) {
	      gl.generateMipmap(target);
	    } else {
	      var filtering = canFilter(internalFormat, type) ? gl.LINEAR : gl.NEAREST;
	      gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, filtering);
	      gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, filtering);
	      gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	      gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	    }
	  }

	  function shouldAutomaticallySetTextureFilteringForSize(options) {
	    return options.auto === true || options.auto === undefined && options.level === undefined;
	  }

	  /**
	   * Gets an array of cubemap face enums
	   * @param {WebGLRenderingContext} gl the WebGLRenderingContext
	   * @param {module:twgl.TextureOptions} options A TextureOptions object with whatever parameters you want set.
	   *   This is often the same options you passed in when you created the texture.
	   * @return {number[]} cubemap face enums
	   */
	  function getCubeFaceOrder(gl, options) {
	    options = options || {};
	    return options.cubeFaceOrder || [gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z];
	  }

	  /**
	   * @typedef {Object} FaceInfo
	   * @property {number} face gl enum for texImage2D
	   * @property {number} ndx face index (0 - 5) into source data
	   * @ignore
	   */

	  /**
	   * Gets an array of FaceInfos
	   * There's a bug in some NVidia drivers that will crash the driver if
	   * `gl.TEXTURE_CUBE_MAP_POSITIVE_X` is not uploaded first. So, we take
	   * the user's desired order from his faces to WebGL and make sure we
	   * do the faces in WebGL order
	   *
	   * @param {WebGLRenderingContext} gl the WebGLRenderingContext
	   * @param {module:twgl.TextureOptions} options A TextureOptions object with whatever parameters you want set.
	   * @return {FaceInfo[]} cubemap face infos. Arguably the `face` property of each element is redundent but
	   *    it's needed internally to sort the array of `ndx` properties by `face`.
	   */
	  function getCubeFacesWithNdx(gl, options) {
	    var faces = getCubeFaceOrder(gl, options);
	    // work around bug in NVidia drivers. We have to upload the first face first else the driver crashes :(
	    var facesWithNdx = faces.map(function (face, ndx) {
	      return { face: face, ndx: ndx };
	    });
	    facesWithNdx.sort(function (a, b) {
	      return a.face - b.face;
	    });
	    return facesWithNdx;
	  }

	  /**
	   * Set a texture from the contents of an element. Will also set
	   * texture filtering or generate mips based on the dimensions of the element
	   * unless `options.auto === false`. If `target === gl.TEXTURE_CUBE_MAP` will
	   * attempt to slice image into 1x6, 2x3, 3x2, or 6x1 images, one for each face.
	   * @param {WebGLRenderingContext} gl the WebGLRenderingContext
	   * @param {WebGLTexture} tex the WebGLTexture to set parameters for
	   * @param {HTMLElement} element a canvas, img, or video element.
	   * @param {module:twgl.TextureOptions} [options] A TextureOptions object with whatever parameters you want set.
	   *   This is often the same options you passed in when you created the texture.
	   * @memberOf module:twgl/textures
	   * @kind function
	   */
	  function setTextureFromElement(gl, tex, element, options) {
	    options = options || defaults.textureOptions;
	    var target = options.target || gl.TEXTURE_2D;
	    var level = options.level || 0;
	    var width = element.width;
	    var height = element.height;
	    var internalFormat = options.internalFormat || options.format || gl.RGBA;
	    var formatType = getFormatAndTypeForInternalFormat(internalFormat);
	    var format = options.format || formatType.format;
	    var type = options.type || formatType.type;
	    savePackState(gl, options);
	    gl.bindTexture(target, tex);
	    if (target === gl.TEXTURE_CUBE_MAP) {
	      // guess the parts
	      var imgWidth = element.width;
	      var imgHeight = element.height;
	      var size;
	      var slices;
	      if (imgWidth / 6 === imgHeight) {
	        // It's 6x1
	        size = imgHeight;
	        slices = [0, 0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0];
	      } else if (imgHeight / 6 === imgWidth) {
	        // It's 1x6
	        size = imgWidth;
	        slices = [0, 0, 0, 1, 0, 2, 0, 3, 0, 4, 0, 5];
	      } else if (imgWidth / 3 === imgHeight / 2) {
	        // It's 3x2
	        size = imgWidth / 3;
	        slices = [0, 0, 1, 0, 2, 0, 0, 1, 1, 1, 2, 1];
	      } else if (imgWidth / 2 === imgHeight / 3) {
	        // It's 2x3
	        size = imgWidth / 2;
	        slices = [0, 0, 1, 0, 0, 1, 1, 1, 0, 2, 1, 2];
	      } else {
	        throw "can't figure out cube map from element: " + (element.src ? element.src : element.nodeName);
	      }
	      ctx.canvas.width = size;
	      ctx.canvas.height = size;
	      width = size;
	      height = size;
	      getCubeFacesWithNdx(gl, options).forEach(function (f) {
	        var xOffset = slices[f.ndx * 2 + 0] * size;
	        var yOffset = slices[f.ndx * 2 + 1] * size;
	        ctx.drawImage(element, xOffset, yOffset, size, size, 0, 0, size, size);
	        gl.texImage2D(f.face, level, internalFormat, format, type, ctx.canvas);
	      });
	      // Free up the canvas memory
	      ctx.canvas.width = 1;
	      ctx.canvas.height = 1;
	    } else if (target === gl.TEXTURE_3D) {
	      var smallest = Math.min(element.width, element.height);
	      var largest = Math.max(element.width, element.height);
	      var depth = largest / smallest;
	      if (depth % 1 !== 0) {
	        throw "can not compute 3D dimensions of element";
	      }
	      var xMult = element.width === largest ? 1 : 0;
	      var yMult = element.height === largest ? 1 : 0;
	      gl.texImage3D(target, level, internalFormat, smallest, smallest, smallest, 0, format, type, null);
	      // remove this is texSubImage3D gets width and height arguments
	      ctx.canvas.width = smallest;
	      ctx.canvas.height = smallest;
	      for (var d = 0; d < depth; ++d) {
	        //        gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, d * smallest);
	        //        gl.texSubImage3D(target, 0, 0, 0, d, format, type, element);
	        var srcX = d * smallest * xMult;
	        var srcY = d * smallest * yMult;
	        var srcW = smallest;
	        var srcH = smallest;
	        var dstX = 0;
	        var dstY = 0;
	        var dstW = smallest;
	        var dstH = smallest;
	        ctx.drawImage(element, srcX, srcY, srcW, srcH, dstX, dstY, dstW, dstH);
	        gl.texSubImage3D(target, level, 0, 0, d, smallest, smallest, 1, format, type, ctx.canvas);
	      }
	      ctx.canvas.width = 0;
	      ctx.canvas.height = 0;
	      // FIX (save state)
	      //      gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, 0);
	    } else {
	      gl.texImage2D(target, level, internalFormat, format, type, element);
	    }
	    restorePackState(gl, options);
	    if (shouldAutomaticallySetTextureFilteringForSize(options)) {
	      setTextureFilteringForSize(gl, tex, options, width, height, internalFormat, type);
	    }
	    setTextureParameters(gl, tex, options);
	  }

	  function noop() {}

	  /**
	   * Loads an image
	   * @param {string} url url to image
	   * @param {function(err, img)} [callback] a callback that's passed an error and the image. The error will be non-null
	   *     if there was an error
	   * @return {HTMLImageElement} the image being loaded.
	   */
	  function loadImage(url, crossOrigin, callback) {
	    callback = callback || noop;
	    var img = new Image();
	    crossOrigin = crossOrigin !== undefined ? crossOrigin : defaults.crossOrigin;
	    if (crossOrigin !== undefined) {
	      img.crossOrigin = crossOrigin;
	    }

	    function clearEventHandlers() {
	      img.removeEventListener('error', onError); // eslint-disable-line
	      img.removeEventListener('load', onLoad); // eslint-disable-line
	      img = null;
	    }

	    function onError() {
	      var msg = "couldn't load image: " + url;
	      utils.error(msg);
	      callback(msg, img);
	      clearEventHandlers();
	    }

	    function onLoad() {
	      callback(null, img);
	      clearEventHandlers();
	    }

	    img.addEventListener('error', onError);
	    img.addEventListener('load', onLoad);
	    img.src = url;
	    return img;
	  }

	  /**
	   * Sets a texture to a 1x1 pixel color. If `options.color === false` is nothing happens. If it's not set
	   * the default texture color is used which can be set by calling `setDefaultTextureColor`.
	   * @param {WebGLRenderingContext} gl the WebGLRenderingContext
	   * @param {WebGLTexture} tex the WebGLTexture to set parameters for
	   * @param {module:twgl.TextureOptions} [options] A TextureOptions object with whatever parameters you want set.
	   *   This is often the same options you passed in when you created the texture.
	   * @memberOf module:twgl/textures
	   */
	  function setTextureTo1PixelColor(gl, tex, options) {
	    options = options || defaults.textureOptions;
	    var target = options.target || gl.TEXTURE_2D;
	    gl.bindTexture(target, tex);
	    if (options.color === false) {
	      return;
	    }
	    // Assume it's a URL
	    // Put 1x1 pixels in texture. That makes it renderable immediately regardless of filtering.
	    var color = make1Pixel(options.color);
	    if (target === gl.TEXTURE_CUBE_MAP) {
	      for (var ii = 0; ii < 6; ++ii) {
	        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + ii, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, color);
	      }
	    } else if (target === gl.TEXTURE_3D || target === gl.TEXTURE_2D_ARRAY) {
	      gl.texImage3D(target, 0, gl.RGBA, 1, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, color);
	    } else {
	      gl.texImage2D(target, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, color);
	    }
	  }

	  /**
	   * The src image(s) used to create a texture.
	   *
	   * When you call {@link module:twgl.createTexture} or {@link module:twgl.createTextures}
	   * you can pass in urls for images to load into the textures. If it's a single url
	   * then this will be a single HTMLImageElement. If it's an array of urls used for a cubemap
	   * this will be a corresponding array of images for the cubemap.
	   *
	   * @typedef {HTMLImageElement|HTMLImageElement[]} TextureSrc
	   * @memberOf module:twgl
	   */

	  /**
	   * A callback for when an image finished downloading and been uploaded into a texture
	   * @callback TextureReadyCallback
	   * @param {*} err If truthy there was an error.
	   * @param {WebGLTexture} texture the texture.
	   * @param {module:twgl.TextureSrc} souce image(s) used to as the src for the texture
	   * @memberOf module:twgl
	   */

	  /**
	   * A callback for when all images have finished downloading and been uploaded into their respective textures
	   * @callback TexturesReadyCallback
	   * @param {*} err If truthy there was an error.
	   * @param {Object.<string, WebGLTexture>} textures the created textures by name. Same as returned by {@link module:twgl.createTextures}.
	   * @param {Object.<string, module:twgl.TextureSrc>} sources the image(s) used for the texture by name.
	   * @memberOf module:twgl
	   */

	  /**
	   * A callback for when an image finished downloading and been uploaded into a texture
	   * @callback CubemapReadyCallback
	   * @param {*} err If truthy there was an error.
	   * @param {WebGLTexture} tex the texture.
	   * @param {HTMLImageElement[]} imgs the images for each face.
	   * @memberOf module:twgl
	   */

	  /**
	   * A callback for when an image finished downloading and been uploaded into a texture
	   * @callback ThreeDReadyCallback
	   * @param {*} err If truthy there was an error.
	   * @param {WebGLTexture} tex the texture.
	   * @param {HTMLImageElement[]} imgs the images for each slice.
	   * @memberOf module:twgl
	   */

	  /**
	   * Loads a texture from an image from a Url as specified in `options.src`
	   * If `options.color !== false` will set the texture to a 1x1 pixel color so that the texture is
	   * immediately useable. It will be updated with the contents of the image once the image has finished
	   * downloading. Filtering options will be set as approriate for image unless `options.auto === false`.
	   * @param {WebGLRenderingContext} gl the WebGLRenderingContext
	   * @param {WebGLTexture} tex the WebGLTexture to set parameters for
	   * @param {module:twgl.TextureOptions} [options] A TextureOptions object with whatever parameters you want set.
	   * @param {module:twgl.TextureReadyCallback} [callback] A function to be called when the image has finished loading. err will
	   *    be non null if there was an error.
	   * @return {HTMLImageElement} the image being downloaded.
	   * @memberOf module:twgl/textures
	   */
	  function loadTextureFromUrl(gl, tex, options, callback) {
	    callback = callback || noop;
	    options = options || defaults.textureOptions;
	    setTextureTo1PixelColor(gl, tex, options);
	    // Because it's async we need to copy the options.
	    options = utils.shallowCopy(options);
	    var img = loadImage(options.src, options.crossOrigin, function (err, img) {
	      if (err) {
	        callback(err, tex, img);
	      } else {
	        setTextureFromElement(gl, tex, img, options);
	        callback(null, tex, img);
	      }
	    });
	    return img;
	  }

	  /**
	   * Loads a cubemap from 6 urls as specified in `options.src`. Will set the cubemap to a 1x1 pixel color
	   * so that it is usable immediately unless `option.color === false`.
	   * @param {WebGLRenderingContext} gl the WebGLRenderingContext
	   * @param {WebGLTexture} tex the WebGLTexture to set parameters for
	   * @param {module:twgl.TextureOptions} options A TextureOptions object with whatever parameters you want set.
	   * @param {module:twgl.CubemapReadyCallback} [callback] A function to be called when all the images have finished loading. err will
	   *    be non null if there was an error.
	   * @memberOf module:twgl/textures
	   */
	  function loadCubemapFromUrls(gl, tex, options, callback) {
	    callback = callback || noop;
	    var urls = options.src;
	    if (urls.length !== 6) {
	      throw "there must be 6 urls for a cubemap";
	    }
	    var level = options.level || 0;
	    var internalFormat = options.internalFormat || options.format || gl.RGBA;
	    var formatType = getFormatAndTypeForInternalFormat(internalFormat);
	    var format = options.format || formatType.format;
	    var type = options.type || gl.UNSIGNED_BYTE;
	    var target = options.target || gl.TEXTURE_2D;
	    if (target !== gl.TEXTURE_CUBE_MAP) {
	      throw "target must be TEXTURE_CUBE_MAP";
	    }
	    setTextureTo1PixelColor(gl, tex, options);
	    // Because it's async we need to copy the options.
	    options = utils.shallowCopy(options);
	    var numToLoad = 6;
	    var errors = [];
	    var imgs;
	    var faces = getCubeFaceOrder(gl, options);

	    function uploadImg(faceTarget) {
	      return function (err, img) {
	        --numToLoad;
	        if (err) {
	          errors.push(err);
	        } else {
	          if (img.width !== img.height) {
	            errors.push("cubemap face img is not a square: " + img.src);
	          } else {
	            savePackState(gl, options);
	            gl.bindTexture(target, tex);

	            // So assuming this is the first image we now have one face that's img sized
	            // and 5 faces that are 1x1 pixel so size the other faces
	            if (numToLoad === 5) {
	              // use the default order
	              getCubeFaceOrder(gl).forEach(function (otherTarget) {
	                // Should we re-use the same face or a color?
	                gl.texImage2D(otherTarget, level, internalFormat, format, type, img);
	              });
	            } else {
	              gl.texImage2D(faceTarget, level, internalFormat, format, type, img);
	            }

	            restorePackState(gl, options);
	            if (shouldAutomaticallySetTextureFilteringForSize(options)) {
	              gl.generateMipmap(target);
	            }
	          }
	        }

	        if (numToLoad === 0) {
	          callback(errors.length ? errors : undefined, imgs, tex);
	        }
	      };
	    }

	    imgs = urls.map(function (url, ndx) {
	      return loadImage(url, options.crossOrigin, uploadImg(faces[ndx]));
	    });
	  }

	  /**
	   * Loads a 2d array or 3d texture from urls as specified in `options.src`.
	   * Will set the texture to a 1x1 pixel color
	   * so that it is usable immediately unless `option.color === false`.
	   *
	   * If the width and height is not specified the width and height of the first
	   * image loaded will be used. Note that since images are loaded async
	   * which image downloads first is unknown.
	   *
	   * If an image is not the same size as the width and height it will be scaled
	   * to that width and height.
	   *
	   * @param {WebGLRenderingContext} gl the WebGLRenderingContext
	   * @param {WebGLTexture} tex the WebGLTexture to set parameters for
	   * @param {module:twgl.TextureOptions} options A TextureOptions object with whatever parameters you want set.
	   * @param {module:twgl.ThreeDReadyCallback} [callback] A function to be called when all the images have finished loading. err will
	   *    be non null if there was an error.
	   * @memberOf module:twgl/textures
	   */
	  function loadSlicesFromUrls(gl, tex, options, callback) {
	    callback = callback || noop;
	    var urls = options.src;
	    var internalFormat = options.internalFormat || options.format || gl.RGBA;
	    var formatType = getFormatAndTypeForInternalFormat(internalFormat);
	    var format = options.format || formatType.format;
	    var type = options.type || gl.UNSIGNED_BYTE;
	    var target = options.target || gl.TEXTURE_2D_ARRAY;
	    if (target !== gl.TEXTURE_3D && target !== gl.TEXTURE_2D_ARRAY) {
	      throw "target must be TEXTURE_3D or TEXTURE_2D_ARRAY";
	    }
	    setTextureTo1PixelColor(gl, tex, options);
	    // Because it's async we need to copy the options.
	    options = utils.shallowCopy(options);
	    var numToLoad = urls.length;
	    var errors = [];
	    var imgs;
	    var level = options.level || 0;
	    var width = options.width;
	    var height = options.height;
	    var depth = urls.length;
	    var firstImage = true;

	    function uploadImg(slice) {
	      return function (err, img) {
	        --numToLoad;
	        if (err) {
	          errors.push(err);
	        } else {
	          savePackState(gl, options);
	          gl.bindTexture(target, tex);

	          if (firstImage) {
	            firstImage = false;
	            width = options.width || img.width;
	            height = options.height || img.height;
	            gl.texImage3D(target, level, internalFormat, width, height, depth, 0, format, type, null);

	            // put it in every slice otherwise some slices will be 0,0,0,0
	            for (var s = 0; s < depth; ++s) {
	              gl.texSubImage3D(target, level, 0, 0, s, width, height, 1, format, type, img);
	            }
	          } else {
	            var src = img;
	            if (img.width !== width || img.height !== height) {
	              // Size the image to fix
	              src = ctx.canvas;
	              ctx.canvas.width = width;
	              ctx.canvas.height = height;
	              ctx.drawImage(img, 0, 0, width, height);
	            }

	            gl.texSubImage3D(target, level, 0, 0, slice, width, height, 1, format, type, src);

	            // free the canvas memory
	            if (src === ctx.canvas) {
	              ctx.canvas.width = 0;
	              ctx.canvas.height = 0;
	            }
	          }

	          restorePackState(gl, options);
	          if (shouldAutomaticallySetTextureFilteringForSize(options)) {
	            gl.generateMipmap(target);
	          }
	        }

	        if (numToLoad === 0) {
	          callback(errors.length ? errors : undefined, imgs, tex);
	        }
	      };
	    }

	    imgs = urls.map(function (url, ndx) {
	      return loadImage(url, options.crossOrigin, uploadImg(ndx));
	    });
	  }

	  /**
	   * Sets a texture from an array or typed array. If the width or height is not provided will attempt to
	   * guess the size. See {@link module:twgl.TextureOptions}.
	   * @param {WebGLRenderingContext} gl the WebGLRenderingContext
	   * @param {WebGLTexture} tex the WebGLTexture to set parameters for
	   * @param {(number[]|ArrayBuffer)} src An array or typed arry with texture data.
	   * @param {module:twgl.TextureOptions} [options] A TextureOptions object with whatever parameters you want set.
	   *   This is often the same options you passed in when you created the texture.
	   * @memberOf module:twgl/textures
	   */
	  function setTextureFromArray(gl, tex, src, options) {
	    options = options || defaults.textureOptions;
	    var target = options.target || gl.TEXTURE_2D;
	    gl.bindTexture(target, tex);
	    var width = options.width;
	    var height = options.height;
	    var depth = options.depth;
	    var level = options.level || 0;
	    var internalFormat = options.internalFormat || options.format || gl.RGBA;
	    var formatType = getFormatAndTypeForInternalFormat(internalFormat);
	    var format = options.format || formatType.format;
	    var type = options.type || getTextureTypeForArrayType(gl, src, formatType.type);
	    if (!isArrayBuffer(src)) {
	      var Type = typedArrays.getTypedArrayTypeForGLType(type);
	      src = new Type(src);
	    } else {
	      if (src instanceof Uint8ClampedArray) {
	        src = new Uint8Array(src.buffer);
	      }
	    }
	    var bytesPerElement = getBytesPerElementForInternalFormat(internalFormat, type);
	    var numElements = src.byteLength / bytesPerElement; // TODO: check UNPACK_ALIGNMENT?
	    if (numElements % 1) {
	      throw "length wrong size for format: " + glEnumToString(gl, format);
	    }
	    var dimensions;
	    if (target === gl.TEXTURE_3D) {
	      if (!width && !height && !depth) {
	        var size = Math.cbrt(numElements);
	        if (size % 1 !== 0) {
	          throw "can't guess cube size of array of numElements: " + numElements;
	        }
	        width = size;
	        height = size;
	        depth = size;
	      } else if (width && (!height || !depth)) {
	        dimensions = guessDimensions(gl, target, height, depth, numElements / width);
	        height = dimensions.width;
	        depth = dimensions.height;
	      } else if (height && (!width || !depth)) {
	        dimensions = guessDimensions(gl, target, width, depth, numElements / height);
	        width = dimensions.width;
	        depth = dimensions.height;
	      } else {
	        dimensions = guessDimensions(gl, target, width, height, numElements / depth);
	        width = dimensions.width;
	        height = dimensions.height;
	      }
	    } else {
	      dimensions = guessDimensions(gl, target, width, height, numElements);
	      width = dimensions.width;
	      height = dimensions.height;
	    }
	    gl.pixelStorei(gl.UNPACK_ALIGNMENT, options.unpackAlignment || 1);
	    savePackState(gl, options);
	    if (target === gl.TEXTURE_CUBE_MAP) {
	      (function () {
	        var elementsPerElement = bytesPerElement / src.BYTES_PER_ELEMENT;
	        var faceSize = numElements / 6 * elementsPerElement;

	        getCubeFacesWithNdx(gl, options).forEach(function (f) {
	          var offset = faceSize * f.ndx;
	          var data = src.subarray(offset, offset + faceSize);
	          gl.texImage2D(f.face, level, internalFormat, width, height, 0, format, type, data);
	        });
	      })();
	    } else if (target === gl.TEXTURE_3D) {
	      gl.texImage3D(target, level, internalFormat, width, height, depth, 0, format, type, src);
	    } else {
	      gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, src);
	    }
	    restorePackState(gl, options);
	    return {
	      width: width,
	      height: height,
	      depth: depth,
	      type: type
	    };
	  }

	  /**
	   * Sets a texture with no contents of a certain size. In other words calls `gl.texImage2D` with `null`.
	   * You must set `options.width` and `options.height`.
	   * @param {WebGLRenderingContext} gl the WebGLRenderingContext
	   * @param {WebGLTexture} tex the WebGLTexture to set parameters for
	   * @param {module:twgl.TextureOptions} options A TextureOptions object with whatever parameters you want set.
	   * @memberOf module:twgl/textures
	   */
	  function setEmptyTexture(gl, tex, options) {
	    var target = options.target || gl.TEXTURE_2D;
	    gl.bindTexture(target, tex);
	    var level = options.level || 0;
	    var internalFormat = options.internalFormat || options.format || gl.RGBA;
	    var formatType = getFormatAndTypeForInternalFormat(internalFormat);
	    var format = options.format || formatType.format;
	    var type = options.type || formatType.type;
	    savePackState(gl, options);
	    if (target === gl.TEXTURE_CUBE_MAP) {
	      for (var ii = 0; ii < 6; ++ii) {
	        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + ii, level, internalFormat, options.width, options.height, 0, format, type, null);
	      }
	    } else if (target === gl.TEXTURE_3D) {
	      gl.texImage3D(target, level, internalFormat, options.width, options.height, options.depth, 0, format, type, null);
	    } else {
	      gl.texImage2D(target, level, internalFormat, options.width, options.height, 0, format, type, null);
	    }
	    restorePackState(gl, options);
	  }

	  /**
	   * Creates a texture based on the options passed in.
	   * @param {WebGLRenderingContext} gl the WebGLRenderingContext
	   * @param {module:twgl.TextureOptions} [options] A TextureOptions object with whatever parameters you want set.
	   * @param {module:twgl.TextureReadyCallback} [callback] A callback called when an image has been downloaded and uploaded to the texture.
	   * @return {WebGLTexture} the created texture.
	   * @memberOf module:twgl/textures
	   */
	  function createTexture(gl, options, callback) {
	    callback = callback || noop;
	    options = options || defaults.textureOptions;
	    var tex = gl.createTexture();
	    var target = options.target || gl.TEXTURE_2D;
	    var width = options.width || 1;
	    var height = options.height || 1;
	    var internalFormat = options.internalFormat || gl.RGBA;
	    var formatType = getFormatAndTypeForInternalFormat(internalFormat);
	    var type = options.type || formatType.type;
	    gl.bindTexture(target, tex);
	    if (target === gl.TEXTURE_CUBE_MAP) {
	      // this should have been the default for CUBEMAPS :(
	      gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	      gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	    }
	    var src = options.src;
	    if (src) {
	      if (typeof src === "function") {
	        src = src(gl, options);
	      }
	      if (typeof src === "string") {
	        loadTextureFromUrl(gl, tex, options, callback);
	      } else if (isArrayBuffer(src) || Array.isArray(src) && (typeof src[0] === 'number' || Array.isArray(src[0]) || isArrayBuffer(src[0]))) {
	        var dimensions = setTextureFromArray(gl, tex, src, options);
	        width = dimensions.width;
	        height = dimensions.height;
	        type = dimensions.type;
	      } else if (Array.isArray(src) && typeof src[0] === 'string') {
	        if (target === gl.TEXTURE_CUBE_MAP) {
	          loadCubemapFromUrls(gl, tex, options, callback);
	        } else {
	          loadSlicesFromUrls(gl, tex, options, callback);
	        }
	      } else if (src instanceof HTMLElement) {
	        setTextureFromElement(gl, tex, src, options);
	        width = src.width;
	        height = src.height;
	      } else {
	        throw "unsupported src type";
	      }
	    } else {
	      setEmptyTexture(gl, tex, options);
	    }
	    if (shouldAutomaticallySetTextureFilteringForSize(options)) {
	      setTextureFilteringForSize(gl, tex, options, width, height, internalFormat, type);
	    }
	    setTextureParameters(gl, tex, options);
	    return tex;
	  }

	  /**
	   * Resizes a texture based on the options passed in.
	   *
	   * Note: This is not a generic resize anything function.
	   * It's mostly used by {@link module:twgl.resizeFramebufferInfo}
	   * It will use `options.src` if it exists to try to determine a `type`
	   * otherwise it will assume `gl.UNSIGNED_BYTE`. No data is provided
	   * for the texture. Texture parameters will be set accordingly
	   *
	   * @param {WebGLRenderingContext} gl the WebGLRenderingContext
	   * @param {WebGLTexture} tex the texture to resize
	   * @param {module:twgl.TextureOptions} options A TextureOptions object with whatever parameters you want set.
	   * @param {number} [width] the new width. If not passed in will use `options.width`
	   * @param {number} [height] the new height. If not passed in will use `options.height`
	   * @memberOf module:twgl/textures
	   */
	  function resizeTexture(gl, tex, options, width, height) {
	    width = width || options.width;
	    height = height || options.height;
	    var target = options.target || gl.TEXTURE_2D;
	    gl.bindTexture(target, tex);
	    var level = options.level || 0;
	    var internalFormat = options.internalFormat || options.format || gl.RGBA;
	    var formatType = getFormatAndTypeForInternalFormat(internalFormat);
	    var format = options.format || formatType.format;
	    var type;
	    var src = options.src;
	    if (!src) {
	      type = options.type || formatType.type;
	    } else if (isArrayBuffer(src) || Array.isArray(src) && typeof src[0] === 'number') {
	      type = options.type || getTextureTypeForArrayType(gl, src, formatType.type);
	    } else {
	      type = options.type || formatType.type;
	    }
	    if (target === gl.TEXTURE_CUBE_MAP) {
	      for (var ii = 0; ii < 6; ++ii) {
	        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + ii, level, format, width, height, 0, format, type, null);
	      }
	    } else {
	      gl.texImage2D(target, level, format, width, height, 0, format, type, null);
	    }
	  }

	  /**
	   * Check if a src is an async request.
	   * if src is a string we're going to download an image
	   * if src is an array of strings we're going to download cubemap images
	   * @param {*} src The src from a TextureOptions
	   * @returns {bool} true if src is async.
	   */
	  function isAsyncSrc(src) {
	    return typeof src === 'string' || Array.isArray(src) && typeof src[0] === 'string';
	  }

	  /**
	   * Creates a bunch of textures based on the passed in options.
	   *
	   * Example:
	   *
	   *     var textures = twgl.createTextures(gl, {
	   *       // a power of 2 image
	   *       hftIcon: { src: "images/hft-icon-16.png", mag: gl.NEAREST },
	   *       // a non-power of 2 image
	   *       clover: { src: "images/clover.jpg" },
	   *       // From a canvas
	   *       fromCanvas: { src: ctx.canvas },
	   *       // A cubemap from 6 images
	   *       yokohama: {
	   *         target: gl.TEXTURE_CUBE_MAP,
	   *         src: [
	   *           'images/yokohama/posx.jpg',
	   *           'images/yokohama/negx.jpg',
	   *           'images/yokohama/posy.jpg',
	   *           'images/yokohama/negy.jpg',
	   *           'images/yokohama/posz.jpg',
	   *           'images/yokohama/negz.jpg',
	   *         ],
	   *       },
	   *       // A cubemap from 1 image (can be 1x6, 2x3, 3x2, 6x1)
	   *       goldengate: {
	   *         target: gl.TEXTURE_CUBE_MAP,
	   *         src: 'images/goldengate.jpg',
	   *       },
	   *       // A 2x2 pixel texture from a JavaScript array
	   *       checker: {
	   *         mag: gl.NEAREST,
	   *         min: gl.LINEAR,
	   *         src: [
	   *           255,255,255,255,
	   *           192,192,192,255,
	   *           192,192,192,255,
	   *           255,255,255,255,
	   *         ],
	   *       },
	   *       // a 1x2 pixel texture from a typed array.
	   *       stripe: {
	   *         mag: gl.NEAREST,
	   *         min: gl.LINEAR,
	   *         format: gl.LUMINANCE,
	   *         src: new Uint8Array([
	   *           255,
	   *           128,
	   *           255,
	   *           128,
	   *           255,
	   *           128,
	   *           255,
	   *           128,
	   *         ]),
	   *         width: 1,
	   *       },
	   *     });
	   *
	   * Now
	   *
	   * *   `textures.hftIcon` will be a 2d texture
	   * *   `textures.clover` will be a 2d texture
	   * *   `textures.fromCanvas` will be a 2d texture
	   * *   `textures.yohohama` will be a cubemap texture
	   * *   `textures.goldengate` will be a cubemap texture
	   * *   `textures.checker` will be a 2d texture
	   * *   `textures.stripe` will be a 2d texture
	   *
	   * @param {WebGLRenderingContext} gl the WebGLRenderingContext
	   * @param {Object.<string,module:twgl.TextureOptions>} options A object of TextureOptions one per texture.
	   * @param {module:twgl.TexturesReadyCallback} [callback] A callback called when all textures have been downloaded.
	   * @return {Object.<string,WebGLTexture>} the created textures by name
	   * @memberOf module:twgl/textures
	   */
	  function createTextures(gl, textureOptions, callback) {
	    callback = callback || noop;
	    var numDownloading = 0;
	    var errors = [];
	    var textures = {};
	    var images = {};

	    function callCallbackIfReady() {
	      if (numDownloading === 0) {
	        setTimeout(function () {
	          callback(errors.length ? errors : undefined, textures, images);
	        }, 0);
	      }
	    }

	    Object.keys(textureOptions).forEach(function (name) {
	      var options = textureOptions[name];
	      var onLoadFn;
	      if (isAsyncSrc(options.src)) {
	        onLoadFn = function onLoadFn(err, tex, img) {
	          images[name] = img;
	          --numDownloading;
	          if (err) {
	            errors.push(err);
	          }
	          callCallbackIfReady();
	        };
	        ++numDownloading;
	      }
	      textures[name] = createTexture(gl, options, onLoadFn);
	    });

	    // queue the callback if there are no images to download.
	    // We do this because if your code is structured to wait for
	    // images to download but then you comment out all the async
	    // images your code would break.
	    callCallbackIfReady();

	    return textures;
	  }

	  // Using quotes prevents Uglify from changing the names.
	  // No speed diff AFAICT.
	  return {
	    "setDefaults_": setDefaults,

	    "createSampler": createSampler,
	    "createSamplers": createSamplers,
	    "setSamplerParameters": setSamplerParameters,

	    "createTexture": createTexture,
	    "setEmptyTexture": setEmptyTexture,
	    "setTextureFromArray": setTextureFromArray,
	    "loadTextureFromUrl": loadTextureFromUrl,
	    "setTextureFromElement": setTextureFromElement,
	    "setTextureFilteringForSize": setTextureFilteringForSize,
	    "setTextureParameters": setTextureParameters,
	    "setDefaultTextureColor": setDefaultTextureColor,
	    "createTextures": createTextures,
	    "resizeTexture": resizeTexture,
	    "getNumComponentsForFormat": getNumComponentsForFormat,
	    "getBytesPerElementForInternalFormat": getBytesPerElementForInternalFormat
	  };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;"use strict";

	/*
	 * Copyright 2015, Gregg Tavares.
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *     * Redistributions of source code must retain the above copyright
	 * notice, this list of conditions and the following disclaimer.
	 *     * Redistributions in binary form must reproduce the above
	 * copyright notice, this list of conditions and the following disclaimer
	 * in the documentation and/or other materials provided with the
	 * distribution.
	 *     * Neither the name of Gregg Tavares. nor the names of his
	 * contributors may be used to endorse or promote products derived from
	 * this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(6)], __WEBPACK_AMD_DEFINE_RESULT__ = function (programs) {
	  "use strict";

	  /**
	   * vertex array object related functions
	   *
	   * You should generally not need to use these functions. They are provided
	   * for those cases where you're doing something out of the ordinary
	   * and you need lower level access.
	   *
	   * For backward compatibily they are available at both `twgl.attributes` and `twgl`
	   * itself
	   *
	   * See {@link module:twgl} for core functions
	   *
	   * @module twgl/vertexArrays
	   */

	  /**
	   * @typedef {Object} VertexArrayInfo
	   * @property {number} numElements The number of elements to pass to `gl.drawArrays` or `gl.drawElements`.
	   * @property {number} [elementType] The type of indices `UNSIGNED_BYTE`, `UNSIGNED_SHORT` etc..
	   * @property {WebGLVertexArrayObject} [vertexArrayObject] a vertex array object
	   * @memberOf module:twgl
	   */

	  /**
	   * Creates a VertexArrayInfo from a BufferInfo and one or more ProgramInfos
	   *
	   * This can be passed to {@link module:twgl.setBuffersAndAttributes} and to
	   * {@link module:twgl:drawBufferInfo}.
	   *
	   * > **IMPORTANT:** Vertex Array Objects are **not** a direct analog for a BufferInfo. Vertex Array Objects
	   *   assign buffers to specific attributes at creation time. That means they can only be used with programs
	   *   who's attributes use the same attribute locations for the same purposes.
	   *
	   * > Bind your attribute locations by passing an array of attribute names to {@link module:twgl.createProgramInfo}
	   *   or use WebGL 2's GLSL ES 3's `layout(location = <num>)` to make sure locations match.
	   *
	   * also
	   *
	   * > **IMPORTANT:** After calling twgl.setBuffersAndAttribute with a BufferInfo that uses a Vertex Array Object
	   *   that Vertex Array Object will be bound. That means **ANY MANIPULATION OF ELEMENT_ARRAY_BUFFER or ATTRIBUTES**
	   *   will affect the Vertex Array Object state.
	   *
	   * > Call `gl.bindVertexArray(null)` to get back manipulating the global attributes and ELEMENT_ARRAY_BUFFER.
	   *
	   * @param {WebGLRenderingContext} gl A WebGLRenderingContext
	   * @param {module:twgl.ProgramInfo|module:twgl.ProgramInfo[]} programInfo a programInfo or array of programInfos
	   * @param {module:twgl.BufferInfo} bufferInfo BufferInfo as returned from createBufferInfoFromArrays etc...
	   *
	   *    You need to make sure every attribute that will be used is bound. So for example assume shader 1
	   *    uses attributes A, B, C and shader 2 uses attributes A, B, D. If you only pass in the programInfo
	   *    for shader 1 then only attributes A, B, and C will have their attributes set because TWGL doesn't
	   *    now attribute D's location.
	   *
	   *    So, you can pass in both shader 1 and shader 2's programInfo
	   *
	   * @return {module:twgl.VertexArrayInfo} The created VertexArrayInfo
	   *
	   * @memberOf module:twgl/vertexArrays
	   */

	  function createVertexArrayInfo(gl, programInfos, bufferInfo) {
	    var vao = gl.createVertexArray();
	    gl.bindVertexArray(vao);
	    if (!programInfos.length) {
	      programInfos = [programInfos];
	    }
	    programInfos.forEach(function (programInfo) {
	      programs.setBuffersAndAttributes(gl, programInfo, bufferInfo);
	    });
	    gl.bindVertexArray(null);
	    return {
	      numElements: bufferInfo.numElements,
	      elementType: bufferInfo.elementType,
	      vertexArrayObject: vao
	    };
	  }

	  /**
	   * Creates a vertex array object and then sets the attributes on it
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
	   * @param {Object.<string, function>} setters Attribute setters as returned from createAttributeSetters
	   * @param {Object.<string, module:twgl.AttribInfo>} attribs AttribInfos mapped by attribute name.
	   * @param {WebGLBuffer} [indices] an optional ELEMENT_ARRAY_BUFFER of indices
	   * @memberOf module:twgl/vertexArrays
	   */
	  function createVAOAndSetAttributes(gl, setters, attribs, indices) {
	    var vao = gl.createVertexArray();
	    gl.bindVertexArray(vao);
	    programs.setAttributes(setters, attribs);
	    if (indices) {
	      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
	    }
	    // We unbind this because otherwise any change to ELEMENT_ARRAY_BUFFER
	    // like when creating buffers for other stuff will mess up this VAO's binding
	    gl.bindVertexArray(null);
	    return vao;
	  }

	  /**
	   * Creates a vertex array object and then sets the attributes
	   * on it
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext
	   *        to use.
	   * @param {Object.<string, function>| module:twgl.ProgramInfo} programInfo as returned from createProgramInfo or Attribute setters as returned from createAttributeSetters
	   * @param {module:twgl.BufferInfo} bufferInfo BufferInfo as returned from createBufferInfoFromArrays etc...
	   * @param {WebGLBuffer} [indices] an optional ELEMENT_ARRAY_BUFFER of indices
	   * @memberOf module:twgl/vertexArrays
	   */
	  function createVAOFromBufferInfo(gl, programInfo, bufferInfo) {
	    return createVAOAndSetAttributes(gl, programInfo.attribSetters || programInfo, bufferInfo.attribs, bufferInfo.indices);
	  }

	  // Using quotes prevents Uglify from changing the names.
	  // No speed diff AFAICT.
	  return {
	    "createVertexArrayInfo": createVertexArrayInfo,
	    "createVAOAndSetAttributes": createVAOAndSetAttributes,
	    "createVAOFromBufferInfo": createVAOFromBufferInfo
	  };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;"use strict";

	/*
	 * Copyright 2015, Gregg Tavares.
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *     * Redistributions of source code must retain the above copyright
	 * notice, this list of conditions and the following disclaimer.
	 *     * Redistributions in binary form must reproduce the above
	 * copyright notice, this list of conditions and the following disclaimer
	 * in the documentation and/or other materials provided with the
	 * distribution.
	 *     * Neither the name of Gregg Tavares. nor the names of his
	 * contributors may be used to endorse or promote products derived from
	 * this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(11)], __WEBPACK_AMD_DEFINE_RESULT__ = function (v3) {
	  "use strict";

	  /**
	   * 4x4 Matrix math math functions.
	   *
	   * Almost all functions take an optional `dst` argument. If it is not passed in the
	   * functions will create a new matrix. In other words you can do this
	   *
	   *     var mat = m4.translation([1, 2, 3]);  // Creates a new translation matrix
	   *
	   * or
	   *
	   *     var mat = m4.create();
	   *     m4.translation([1, 2, 3], mat);  // Puts translation matrix in mat.
	   *
	   * The first style is often easier but depending on where it's used it generates garbage where
	   * as there is almost never allocation with the second style.
	   *
	   * It is always save to pass any matrix as the destination. So for example
	   *
	   *     var mat = m4.identity();
	   *     var trans = m4.translation([1, 2, 3]);
	   *     m4.multiply(mat, trans, mat);  // Multiplies mat * trans and puts result in mat.
	   *
	   * @module twgl/m4
	   */

	  var MatType = Float32Array;

	  var tempV3a = v3.create();
	  var tempV3b = v3.create();
	  var tempV3c = v3.create();

	  /**
	   * A JavaScript array with 16 values or a Float32Array with 16 values.
	   * When created by the library will create the default type which is `Float32Array`
	   * but can be set by calling {@link module:twgl/m4.setDefaultType}.
	   * @typedef {(number[]|Float32Array)} Mat4
	   * @memberOf module:twgl/m4
	   */

	  /**
	   * Sets the type this library creates for a Mat4
	   * @param {constructor} ctor the constructor for the type. Either `Float32Array` or `Array`
	   * @return {constructor} previous constructor for Mat4
	   */
	  function setDefaultType(ctor) {
	    var oldType = MatType;
	    MatType = ctor;
	    return oldType;
	  }

	  /**
	   * Negates a matrix.
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} -m.
	   * @memberOf module:twgl/m4
	   */
	  function negate(m, dst) {
	    dst = dst || new MatType(16);

	    dst[0] = -m[0];
	    dst[1] = -m[1];
	    dst[2] = -m[2];
	    dst[3] = -m[3];
	    dst[4] = -m[4];
	    dst[5] = -m[5];
	    dst[6] = -m[6];
	    dst[7] = -m[7];
	    dst[8] = -m[8];
	    dst[9] = -m[9];
	    dst[10] = -m[10];
	    dst[11] = -m[11];
	    dst[12] = -m[12];
	    dst[13] = -m[13];
	    dst[14] = -m[14];
	    dst[15] = -m[15];

	    return dst;
	  }

	  /**
	   * Copies a matrix.
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {module:twgl/m4.Mat4} [dst] The matrix.
	   * @return {module:twgl/m4.Mat4} A copy of m.
	   * @memberOf module:twgl/m4
	   */
	  function copy(m, dst) {
	    dst = dst || new MatType(16);

	    dst[0] = m[0];
	    dst[1] = m[1];
	    dst[2] = m[2];
	    dst[3] = m[3];
	    dst[4] = m[4];
	    dst[5] = m[5];
	    dst[6] = m[6];
	    dst[7] = m[7];
	    dst[8] = m[8];
	    dst[9] = m[9];
	    dst[10] = m[10];
	    dst[11] = m[11];
	    dst[12] = m[12];
	    dst[13] = m[13];
	    dst[14] = m[14];
	    dst[15] = m[15];

	    return dst;
	  }

	  /**
	   * Creates an n-by-n identity matrix.
	   *
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} An n-by-n identity matrix.
	   * @memberOf module:twgl/m4
	   */
	  function identity(dst) {
	    dst = dst || new MatType(16);

	    dst[0] = 1;
	    dst[1] = 0;
	    dst[2] = 0;
	    dst[3] = 0;
	    dst[4] = 0;
	    dst[5] = 1;
	    dst[6] = 0;
	    dst[7] = 0;
	    dst[8] = 0;
	    dst[9] = 0;
	    dst[10] = 1;
	    dst[11] = 0;
	    dst[12] = 0;
	    dst[13] = 0;
	    dst[14] = 0;
	    dst[15] = 1;

	    return dst;
	  }

	  /**
	   * Takes the transpose of a matrix.
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} The transpose of m.
	   * @memberOf module:twgl/m4
	   */
	  function transpose(m, dst) {
	    dst = dst || new MatType(16);
	    if (dst === m) {
	      var t;

	      t = m[1];
	      m[1] = m[4];
	      m[4] = t;

	      t = m[2];
	      m[2] = m[8];
	      m[8] = t;

	      t = m[3];
	      m[3] = m[12];
	      m[12] = t;

	      t = m[6];
	      m[6] = m[9];
	      m[9] = t;

	      t = m[7];
	      m[7] = m[13];
	      m[13] = t;

	      t = m[11];
	      m[11] = m[14];
	      m[14] = t;
	      return dst;
	    }

	    var m00 = m[0 * 4 + 0];
	    var m01 = m[0 * 4 + 1];
	    var m02 = m[0 * 4 + 2];
	    var m03 = m[0 * 4 + 3];
	    var m10 = m[1 * 4 + 0];
	    var m11 = m[1 * 4 + 1];
	    var m12 = m[1 * 4 + 2];
	    var m13 = m[1 * 4 + 3];
	    var m20 = m[2 * 4 + 0];
	    var m21 = m[2 * 4 + 1];
	    var m22 = m[2 * 4 + 2];
	    var m23 = m[2 * 4 + 3];
	    var m30 = m[3 * 4 + 0];
	    var m31 = m[3 * 4 + 1];
	    var m32 = m[3 * 4 + 2];
	    var m33 = m[3 * 4 + 3];

	    dst[0] = m00;
	    dst[1] = m10;
	    dst[2] = m20;
	    dst[3] = m30;
	    dst[4] = m01;
	    dst[5] = m11;
	    dst[6] = m21;
	    dst[7] = m31;
	    dst[8] = m02;
	    dst[9] = m12;
	    dst[10] = m22;
	    dst[11] = m32;
	    dst[12] = m03;
	    dst[13] = m13;
	    dst[14] = m23;
	    dst[15] = m33;

	    return dst;
	  }

	  /**
	   * Computes the inverse of a 4-by-4 matrix.
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} The inverse of m.
	   * @memberOf module:twgl/m4
	   */
	  function inverse(m, dst) {
	    dst = dst || new MatType(16);

	    var m00 = m[0 * 4 + 0];
	    var m01 = m[0 * 4 + 1];
	    var m02 = m[0 * 4 + 2];
	    var m03 = m[0 * 4 + 3];
	    var m10 = m[1 * 4 + 0];
	    var m11 = m[1 * 4 + 1];
	    var m12 = m[1 * 4 + 2];
	    var m13 = m[1 * 4 + 3];
	    var m20 = m[2 * 4 + 0];
	    var m21 = m[2 * 4 + 1];
	    var m22 = m[2 * 4 + 2];
	    var m23 = m[2 * 4 + 3];
	    var m30 = m[3 * 4 + 0];
	    var m31 = m[3 * 4 + 1];
	    var m32 = m[3 * 4 + 2];
	    var m33 = m[3 * 4 + 3];
	    var tmp_0 = m22 * m33;
	    var tmp_1 = m32 * m23;
	    var tmp_2 = m12 * m33;
	    var tmp_3 = m32 * m13;
	    var tmp_4 = m12 * m23;
	    var tmp_5 = m22 * m13;
	    var tmp_6 = m02 * m33;
	    var tmp_7 = m32 * m03;
	    var tmp_8 = m02 * m23;
	    var tmp_9 = m22 * m03;
	    var tmp_10 = m02 * m13;
	    var tmp_11 = m12 * m03;
	    var tmp_12 = m20 * m31;
	    var tmp_13 = m30 * m21;
	    var tmp_14 = m10 * m31;
	    var tmp_15 = m30 * m11;
	    var tmp_16 = m10 * m21;
	    var tmp_17 = m20 * m11;
	    var tmp_18 = m00 * m31;
	    var tmp_19 = m30 * m01;
	    var tmp_20 = m00 * m21;
	    var tmp_21 = m20 * m01;
	    var tmp_22 = m00 * m11;
	    var tmp_23 = m10 * m01;

	    var t0 = tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31 - (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
	    var t1 = tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31 - (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
	    var t2 = tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31 - (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
	    var t3 = tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21 - (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

	    var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

	    dst[0] = d * t0;
	    dst[1] = d * t1;
	    dst[2] = d * t2;
	    dst[3] = d * t3;
	    dst[4] = d * (tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30 - (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30));
	    dst[5] = d * (tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30 - (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30));
	    dst[6] = d * (tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30 - (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30));
	    dst[7] = d * (tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20 - (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20));
	    dst[8] = d * (tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33 - (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33));
	    dst[9] = d * (tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33 - (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33));
	    dst[10] = d * (tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33 - (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33));
	    dst[11] = d * (tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23 - (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23));
	    dst[12] = d * (tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12 - (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22));
	    dst[13] = d * (tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22 - (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02));
	    dst[14] = d * (tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02 - (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12));
	    dst[15] = d * (tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12 - (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02));

	    return dst;
	  }

	  /**
	   * Multiplies two 4-by-4 matrices with a on the left and b on the right
	   * @param {module:twgl/m4.Mat4} a The matrix on the left.
	   * @param {module:twgl/m4.Mat4} b The matrix on the right.
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} The matrix product of a and b.
	   * @memberOf module:twgl/m4
	   */
	  function multiply(a, b, dst) {
	    dst = dst || new MatType(16);

	    var a00 = a[0];
	    var a01 = a[1];
	    var a02 = a[2];
	    var a03 = a[3];
	    var a10 = a[4 + 0];
	    var a11 = a[4 + 1];
	    var a12 = a[4 + 2];
	    var a13 = a[4 + 3];
	    var a20 = a[8 + 0];
	    var a21 = a[8 + 1];
	    var a22 = a[8 + 2];
	    var a23 = a[8 + 3];
	    var a30 = a[12 + 0];
	    var a31 = a[12 + 1];
	    var a32 = a[12 + 2];
	    var a33 = a[12 + 3];
	    var b00 = b[0];
	    var b01 = b[1];
	    var b02 = b[2];
	    var b03 = b[3];
	    var b10 = b[4 + 0];
	    var b11 = b[4 + 1];
	    var b12 = b[4 + 2];
	    var b13 = b[4 + 3];
	    var b20 = b[8 + 0];
	    var b21 = b[8 + 1];
	    var b22 = b[8 + 2];
	    var b23 = b[8 + 3];
	    var b30 = b[12 + 0];
	    var b31 = b[12 + 1];
	    var b32 = b[12 + 2];
	    var b33 = b[12 + 3];

	    dst[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
	    dst[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
	    dst[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
	    dst[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;
	    dst[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
	    dst[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
	    dst[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
	    dst[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;
	    dst[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
	    dst[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
	    dst[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
	    dst[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;
	    dst[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
	    dst[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
	    dst[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
	    dst[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;

	    return dst;
	  }

	  /**
	   * Sets the translation component of a 4-by-4 matrix to the given
	   * vector.
	   * @param {module:twgl/m4.Mat4} a The matrix.
	   * @param {Vec3} v The vector.
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} a once modified.
	   * @memberOf module:twgl/m4
	   */
	  function setTranslation(a, v, dst) {
	    dst = dst || identity();
	    if (a !== dst) {
	      dst[0] = a[0];
	      dst[1] = a[1];
	      dst[2] = a[2];
	      dst[3] = a[3];
	      dst[4] = a[4];
	      dst[5] = a[5];
	      dst[6] = a[6];
	      dst[7] = a[7];
	      dst[8] = a[8];
	      dst[9] = a[9];
	      dst[10] = a[10];
	      dst[11] = a[11];
	    }
	    dst[12] = v[0];
	    dst[13] = v[1];
	    dst[14] = v[2];
	    dst[15] = 1;
	    return dst;
	  }

	  /**
	   * Returns the translation component of a 4-by-4 matrix as a vector with 3
	   * entries.
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {Vec3} [dst] vector..
	   * @return {Vec3} The translation component of m.
	   * @memberOf module:twgl/m4
	   */
	  function getTranslation(m, dst) {
	    dst = dst || v3.create();
	    dst[0] = m[12];
	    dst[1] = m[13];
	    dst[2] = m[14];
	    return dst;
	  }

	  /**
	   * Returns an axis of a 4x4 matrix as a vector with 3 entries
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {number} axis The axis 0 = x, 1 = y, 2 = z;
	   * @return {Vec3} [dst] vector.
	   * @return {Vec3} The axis component of m.
	   * @memberOf module:twgl/m4
	   */
	  function getAxis(m, axis, dst) {
	    dst = dst || v3.create();
	    var off = axis * 4;
	    dst[0] = m[off + 0];
	    dst[1] = m[off + 1];
	    dst[2] = m[off + 2];
	    return dst;
	  }

	  /**
	   * Sets an axis of a 4x4 matrix as a vector with 3 entries
	   * @param {Vec3} v the axis vector
	   * @param {number} axis The axis  0 = x, 1 = y, 2 = z;
	   * @param {module:twgl/m4.Mat4} [dst] The matrix to set. If none a new one is created
	   * @return {module:twgl/m4.Mat4} dst
	   * @memberOf module:twgl/m4
	   */
	  function setAxis(a, v, axis, dst) {
	    if (dst !== a) {
	      dst = copy(a, dst);
	    }
	    var off = axis * 4;
	    dst[off + 0] = v[0];
	    dst[off + 1] = v[1];
	    dst[off + 2] = v[2];
	    return dst;
	  }

	  /**
	   * Computes a 4-by-4 perspective transformation matrix given the angular height
	   * of the frustum, the aspect ratio, and the near and far clipping planes.  The
	   * arguments define a frustum extending in the negative z direction.  The given
	   * angle is the vertical angle of the frustum, and the horizontal angle is
	   * determined to produce the given aspect ratio.  The arguments near and far are
	   * the distances to the near and far clipping planes.  Note that near and far
	   * are not z coordinates, but rather they are distances along the negative
	   * z-axis.  The matrix generated sends the viewing frustum to the unit box.
	   * We assume a unit box extending from -1 to 1 in the x and y dimensions and
	   * from 0 to 1 in the z dimension.
	   * @param {number} fieldOfViewYInRadians The camera angle from top to bottom (in radians).
	   * @param {number} aspect The aspect ratio width / height.
	   * @param {number} zNear The depth (negative z coordinate)
	   *     of the near clipping plane.
	   * @param {number} zFar The depth (negative z coordinate)
	   *     of the far clipping plane.
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} The perspective matrix.
	   * @memberOf module:twgl/m4
	   */
	  function perspective(fieldOfViewYInRadians, aspect, zNear, zFar, dst) {
	    dst = dst || new MatType(16);

	    var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewYInRadians);
	    var rangeInv = 1.0 / (zNear - zFar);

	    dst[0] = f / aspect;
	    dst[1] = 0;
	    dst[2] = 0;
	    dst[3] = 0;

	    dst[4] = 0;
	    dst[5] = f;
	    dst[6] = 0;
	    dst[7] = 0;

	    dst[8] = 0;
	    dst[9] = 0;
	    dst[10] = (zNear + zFar) * rangeInv;
	    dst[11] = -1;

	    dst[12] = 0;
	    dst[13] = 0;
	    dst[14] = zNear * zFar * rangeInv * 2;
	    dst[15] = 0;

	    return dst;
	  }

	  /**
	   * Computes a 4-by-4 othogonal transformation matrix given the left, right,
	   * bottom, and top dimensions of the near clipping plane as well as the
	   * near and far clipping plane distances.
	   * @param {number} left Left side of the near clipping plane viewport.
	   * @param {number} right Right side of the near clipping plane viewport.
	   * @param {number} top Top of the near clipping plane viewport.
	   * @param {number} bottom Bottom of the near clipping plane viewport.
	   * @param {number} near The depth (negative z coordinate)
	   *     of the near clipping plane.
	   * @param {number} far The depth (negative z coordinate)
	   *     of the far clipping plane.
	   * @param {module:twgl/m4.Mat4} [dst] Output matrix.
	   * @return {module:twgl/m4.Mat4} The perspective matrix.
	   * @memberOf module:twgl/m4
	   */
	  function ortho(left, right, bottom, top, near, far, dst) {
	    dst = dst || new MatType(16);

	    dst[0] = 2 / (right - left);
	    dst[1] = 0;
	    dst[2] = 0;
	    dst[3] = 0;

	    dst[4] = 0;
	    dst[5] = 2 / (top - bottom);
	    dst[6] = 0;
	    dst[7] = 0;

	    dst[8] = 0;
	    dst[9] = 0;
	    dst[10] = -1 / (far - near);
	    dst[11] = 0;

	    dst[12] = (right + left) / (left - right);
	    dst[13] = (top + bottom) / (bottom - top);
	    dst[14] = -near / (near - far);
	    dst[15] = 1;

	    return dst;
	  }

	  /**
	   * Computes a 4-by-4 perspective transformation matrix given the left, right,
	   * top, bottom, near and far clipping planes. The arguments define a frustum
	   * extending in the negative z direction. The arguments near and far are the
	   * distances to the near and far clipping planes. Note that near and far are not
	   * z coordinates, but rather they are distances along the negative z-axis. The
	   * matrix generated sends the viewing frustum to the unit box. We assume a unit
	   * box extending from -1 to 1 in the x and y dimensions and from 0 to 1 in the z
	   * dimension.
	   * @param {number} left The x coordinate of the left plane of the box.
	   * @param {number} right The x coordinate of the right plane of the box.
	   * @param {number} bottom The y coordinate of the bottom plane of the box.
	   * @param {number} top The y coordinate of the right plane of the box.
	   * @param {number} near The negative z coordinate of the near plane of the box.
	   * @param {number} far The negative z coordinate of the far plane of the box.
	   * @param {module:twgl/m4.Mat4} [dst] Output matrix.
	   * @return {module:twgl/m4.Mat4} The perspective projection matrix.
	   * @memberOf module:twgl/m4
	   */
	  function frustum(left, right, bottom, top, near, far, dst) {
	    dst = dst || new MatType(16);

	    var dx = right - left;
	    var dy = top - bottom;
	    var dz = near - far;

	    dst[0] = 2 * near / dx;
	    dst[1] = 0;
	    dst[2] = 0;
	    dst[3] = 0;
	    dst[4] = 0;
	    dst[5] = 2 * near / dy;
	    dst[6] = 0;
	    dst[7] = 0;
	    dst[8] = (left + right) / dx;
	    dst[9] = (top + bottom) / dy;
	    dst[10] = far / dz;
	    dst[11] = -1;
	    dst[12] = 0;
	    dst[13] = 0;
	    dst[14] = near * far / dz;
	    dst[15] = 0;

	    return dst;
	  }

	  /**
	   * Computes a 4-by-4 look-at transformation.
	   *
	   * This is a matrix which positions the camera itself. If you want
	   * a view matrix (a matrix which moves things in front of the camera)
	   * take the inverse of this.
	   *
	   * @param {Vec3} eye The position of the eye.
	   * @param {Vec3} target The position meant to be viewed.
	   * @param {Vec3} up A vector pointing up.
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} The look-at matrix.
	   * @memberOf module:twgl/m4
	   */
	  function lookAt(eye, target, up, dst) {
	    dst = dst || new MatType(16);

	    var xAxis = tempV3a;
	    var yAxis = tempV3b;
	    var zAxis = tempV3c;

	    v3.normalize(v3.subtract(eye, target, zAxis), zAxis);
	    v3.normalize(v3.cross(up, zAxis, xAxis), xAxis);
	    v3.normalize(v3.cross(zAxis, xAxis, yAxis), yAxis);

	    dst[0] = xAxis[0];
	    dst[1] = xAxis[1];
	    dst[2] = xAxis[2];
	    dst[3] = 0;
	    dst[4] = yAxis[0];
	    dst[5] = yAxis[1];
	    dst[6] = yAxis[2];
	    dst[7] = 0;
	    dst[8] = zAxis[0];
	    dst[9] = zAxis[1];
	    dst[10] = zAxis[2];
	    dst[11] = 0;
	    dst[12] = eye[0];
	    dst[13] = eye[1];
	    dst[14] = eye[2];
	    dst[15] = 1;

	    return dst;
	  }

	  /**
	   * Creates a 4-by-4 matrix which translates by the given vector v.
	   * @param {Vec3} v The vector by
	   *     which to translate.
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} The translation matrix.
	   * @memberOf module:twgl/m4
	   */
	  function translation(v, dst) {
	    dst = dst || new MatType(16);

	    dst[0] = 1;
	    dst[1] = 0;
	    dst[2] = 0;
	    dst[3] = 0;
	    dst[4] = 0;
	    dst[5] = 1;
	    dst[6] = 0;
	    dst[7] = 0;
	    dst[8] = 0;
	    dst[9] = 0;
	    dst[10] = 1;
	    dst[11] = 0;
	    dst[12] = v[0];
	    dst[13] = v[1];
	    dst[14] = v[2];
	    dst[15] = 1;
	    return dst;
	  }

	  /**
	   * Modifies the given 4-by-4 matrix by translation by the given vector v.
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {Vec3} v The vector by
	   *     which to translate.
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} m once modified.
	   * @memberOf module:twgl/m4
	   */
	  function translate(m, v, dst) {
	    dst = dst || new MatType(16);

	    var v0 = v[0];
	    var v1 = v[1];
	    var v2 = v[2];
	    var m00 = m[0];
	    var m01 = m[1];
	    var m02 = m[2];
	    var m03 = m[3];
	    var m10 = m[1 * 4 + 0];
	    var m11 = m[1 * 4 + 1];
	    var m12 = m[1 * 4 + 2];
	    var m13 = m[1 * 4 + 3];
	    var m20 = m[2 * 4 + 0];
	    var m21 = m[2 * 4 + 1];
	    var m22 = m[2 * 4 + 2];
	    var m23 = m[2 * 4 + 3];
	    var m30 = m[3 * 4 + 0];
	    var m31 = m[3 * 4 + 1];
	    var m32 = m[3 * 4 + 2];
	    var m33 = m[3 * 4 + 3];

	    if (m !== dst) {
	      dst[0] = m00;
	      dst[1] = m01;
	      dst[2] = m02;
	      dst[3] = m03;
	      dst[4] = m10;
	      dst[5] = m11;
	      dst[6] = m12;
	      dst[7] = m13;
	      dst[8] = m20;
	      dst[9] = m21;
	      dst[10] = m22;
	      dst[11] = m23;
	    }

	    dst[12] = m00 * v0 + m10 * v1 + m20 * v2 + m30;
	    dst[13] = m01 * v0 + m11 * v1 + m21 * v2 + m31;
	    dst[14] = m02 * v0 + m12 * v1 + m22 * v2 + m32;
	    dst[15] = m03 * v0 + m13 * v1 + m23 * v2 + m33;

	    return dst;
	  }

	  /**
	   * Creates a 4-by-4 matrix which rotates around the x-axis by the given angle.
	   * @param {number} angleInRadians The angle by which to rotate (in radians).
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} The rotation matrix.
	   * @memberOf module:twgl/m4
	   */
	  function rotationX(angleInRadians, dst) {
	    dst = dst || new MatType(16);

	    var c = Math.cos(angleInRadians);
	    var s = Math.sin(angleInRadians);

	    dst[0] = 1;
	    dst[1] = 0;
	    dst[2] = 0;
	    dst[3] = 0;
	    dst[4] = 0;
	    dst[5] = c;
	    dst[6] = s;
	    dst[7] = 0;
	    dst[8] = 0;
	    dst[9] = -s;
	    dst[10] = c;
	    dst[11] = 0;
	    dst[12] = 0;
	    dst[13] = 0;
	    dst[14] = 0;
	    dst[15] = 1;

	    return dst;
	  }

	  /**
	   * Modifies the given 4-by-4 matrix by a rotation around the x-axis by the given
	   * angle.
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {number} angleInRadians The angle by which to rotate (in radians).
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} m once modified.
	   * @memberOf module:twgl/m4
	   */
	  function rotateX(m, angleInRadians, dst) {
	    dst = dst || new MatType(16);

	    var m10 = m[4];
	    var m11 = m[5];
	    var m12 = m[6];
	    var m13 = m[7];
	    var m20 = m[8];
	    var m21 = m[9];
	    var m22 = m[10];
	    var m23 = m[11];
	    var c = Math.cos(angleInRadians);
	    var s = Math.sin(angleInRadians);

	    dst[4] = c * m10 + s * m20;
	    dst[5] = c * m11 + s * m21;
	    dst[6] = c * m12 + s * m22;
	    dst[7] = c * m13 + s * m23;
	    dst[8] = c * m20 - s * m10;
	    dst[9] = c * m21 - s * m11;
	    dst[10] = c * m22 - s * m12;
	    dst[11] = c * m23 - s * m13;

	    if (m !== dst) {
	      dst[0] = m[0];
	      dst[1] = m[1];
	      dst[2] = m[2];
	      dst[3] = m[3];
	      dst[12] = m[12];
	      dst[13] = m[13];
	      dst[14] = m[14];
	      dst[15] = m[15];
	    }

	    return dst;
	  }

	  /**
	   * Creates a 4-by-4 matrix which rotates around the y-axis by the given angle.
	   * @param {number} angleInRadians The angle by which to rotate (in radians).
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} The rotation matrix.
	   * @memberOf module:twgl/m4
	   */
	  function rotationY(angleInRadians, dst) {
	    dst = dst || new MatType(16);

	    var c = Math.cos(angleInRadians);
	    var s = Math.sin(angleInRadians);

	    dst[0] = c;
	    dst[1] = 0;
	    dst[2] = -s;
	    dst[3] = 0;
	    dst[4] = 0;
	    dst[5] = 1;
	    dst[6] = 0;
	    dst[7] = 0;
	    dst[8] = s;
	    dst[9] = 0;
	    dst[10] = c;
	    dst[11] = 0;
	    dst[12] = 0;
	    dst[13] = 0;
	    dst[14] = 0;
	    dst[15] = 1;

	    return dst;
	  }

	  /**
	   * Modifies the given 4-by-4 matrix by a rotation around the y-axis by the given
	   * angle.
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {number} angleInRadians The angle by which to rotate (in radians).
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} m once modified.
	   * @memberOf module:twgl/m4
	   */
	  function rotateY(m, angleInRadians, dst) {
	    dst = dst || new MatType(16);

	    var m00 = m[0 * 4 + 0];
	    var m01 = m[0 * 4 + 1];
	    var m02 = m[0 * 4 + 2];
	    var m03 = m[0 * 4 + 3];
	    var m20 = m[2 * 4 + 0];
	    var m21 = m[2 * 4 + 1];
	    var m22 = m[2 * 4 + 2];
	    var m23 = m[2 * 4 + 3];
	    var c = Math.cos(angleInRadians);
	    var s = Math.sin(angleInRadians);

	    dst[0] = c * m00 - s * m20;
	    dst[1] = c * m01 - s * m21;
	    dst[2] = c * m02 - s * m22;
	    dst[3] = c * m03 - s * m23;
	    dst[8] = c * m20 + s * m00;
	    dst[9] = c * m21 + s * m01;
	    dst[10] = c * m22 + s * m02;
	    dst[11] = c * m23 + s * m03;

	    if (m !== dst) {
	      dst[4] = m[4];
	      dst[5] = m[5];
	      dst[6] = m[6];
	      dst[7] = m[7];
	      dst[12] = m[12];
	      dst[13] = m[13];
	      dst[14] = m[14];
	      dst[15] = m[15];
	    }

	    return dst;
	  }

	  /**
	   * Creates a 4-by-4 matrix which rotates around the z-axis by the given angle.
	   * @param {number} angleInRadians The angle by which to rotate (in radians).
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} The rotation matrix.
	   * @memberOf module:twgl/m4
	   */
	  function rotationZ(angleInRadians, dst) {
	    dst = dst || new MatType(16);

	    var c = Math.cos(angleInRadians);
	    var s = Math.sin(angleInRadians);

	    dst[0] = c;
	    dst[1] = s;
	    dst[2] = 0;
	    dst[3] = 0;
	    dst[4] = -s;
	    dst[5] = c;
	    dst[6] = 0;
	    dst[7] = 0;
	    dst[8] = 0;
	    dst[9] = 0;
	    dst[10] = 1;
	    dst[11] = 0;
	    dst[12] = 0;
	    dst[13] = 0;
	    dst[14] = 0;
	    dst[15] = 1;

	    return dst;
	  }

	  /**
	   * Modifies the given 4-by-4 matrix by a rotation around the z-axis by the given
	   * angle.
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {number} angleInRadians The angle by which to rotate (in radians).
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} m once modified.
	   * @memberOf module:twgl/m4
	   */
	  function rotateZ(m, angleInRadians, dst) {
	    dst = dst || new MatType(16);

	    var m00 = m[0 * 4 + 0];
	    var m01 = m[0 * 4 + 1];
	    var m02 = m[0 * 4 + 2];
	    var m03 = m[0 * 4 + 3];
	    var m10 = m[1 * 4 + 0];
	    var m11 = m[1 * 4 + 1];
	    var m12 = m[1 * 4 + 2];
	    var m13 = m[1 * 4 + 3];
	    var c = Math.cos(angleInRadians);
	    var s = Math.sin(angleInRadians);

	    dst[0] = c * m00 + s * m10;
	    dst[1] = c * m01 + s * m11;
	    dst[2] = c * m02 + s * m12;
	    dst[3] = c * m03 + s * m13;
	    dst[4] = c * m10 - s * m00;
	    dst[5] = c * m11 - s * m01;
	    dst[6] = c * m12 - s * m02;
	    dst[7] = c * m13 - s * m03;

	    if (m !== dst) {
	      dst[8] = m[8];
	      dst[9] = m[9];
	      dst[10] = m[10];
	      dst[11] = m[11];
	      dst[12] = m[12];
	      dst[13] = m[13];
	      dst[14] = m[14];
	      dst[15] = m[15];
	    }

	    return dst;
	  }

	  /**
	   * Creates a 4-by-4 matrix which rotates around the given axis by the given
	   * angle.
	   * @param {Vec3} axis The axis
	   *     about which to rotate.
	   * @param {number} angleInRadians The angle by which to rotate (in radians).
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} A matrix which rotates angle radians
	   *     around the axis.
	   * @memberOf module:twgl/m4
	   */
	  function axisRotation(axis, angleInRadians, dst) {
	    dst = dst || new MatType(16);

	    var x = axis[0];
	    var y = axis[1];
	    var z = axis[2];
	    var n = Math.sqrt(x * x + y * y + z * z);
	    x /= n;
	    y /= n;
	    z /= n;
	    var xx = x * x;
	    var yy = y * y;
	    var zz = z * z;
	    var c = Math.cos(angleInRadians);
	    var s = Math.sin(angleInRadians);
	    var oneMinusCosine = 1 - c;

	    dst[0] = xx + (1 - xx) * c;
	    dst[1] = x * y * oneMinusCosine + z * s;
	    dst[2] = x * z * oneMinusCosine - y * s;
	    dst[3] = 0;
	    dst[4] = x * y * oneMinusCosine - z * s;
	    dst[5] = yy + (1 - yy) * c;
	    dst[6] = y * z * oneMinusCosine + x * s;
	    dst[7] = 0;
	    dst[8] = x * z * oneMinusCosine + y * s;
	    dst[9] = y * z * oneMinusCosine - x * s;
	    dst[10] = zz + (1 - zz) * c;
	    dst[11] = 0;
	    dst[12] = 0;
	    dst[13] = 0;
	    dst[14] = 0;
	    dst[15] = 1;

	    return dst;
	  }

	  /**
	   * Modifies the given 4-by-4 matrix by rotation around the given axis by the
	   * given angle.
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {Vec3} axis The axis
	   *     about which to rotate.
	   * @param {number} angleInRadians The angle by which to rotate (in radians).
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} m once modified.
	   * @memberOf module:twgl/m4
	   */
	  function axisRotate(m, axis, angleInRadians, dst) {
	    dst = dst || new MatType(16);

	    var x = axis[0];
	    var y = axis[1];
	    var z = axis[2];
	    var n = Math.sqrt(x * x + y * y + z * z);
	    x /= n;
	    y /= n;
	    z /= n;
	    var xx = x * x;
	    var yy = y * y;
	    var zz = z * z;
	    var c = Math.cos(angleInRadians);
	    var s = Math.sin(angleInRadians);
	    var oneMinusCosine = 1 - c;

	    var r00 = xx + (1 - xx) * c;
	    var r01 = x * y * oneMinusCosine + z * s;
	    var r02 = x * z * oneMinusCosine - y * s;
	    var r10 = x * y * oneMinusCosine - z * s;
	    var r11 = yy + (1 - yy) * c;
	    var r12 = y * z * oneMinusCosine + x * s;
	    var r20 = x * z * oneMinusCosine + y * s;
	    var r21 = y * z * oneMinusCosine - x * s;
	    var r22 = zz + (1 - zz) * c;

	    var m00 = m[0];
	    var m01 = m[1];
	    var m02 = m[2];
	    var m03 = m[3];
	    var m10 = m[4];
	    var m11 = m[5];
	    var m12 = m[6];
	    var m13 = m[7];
	    var m20 = m[8];
	    var m21 = m[9];
	    var m22 = m[10];
	    var m23 = m[11];

	    dst[0] = r00 * m00 + r01 * m10 + r02 * m20;
	    dst[1] = r00 * m01 + r01 * m11 + r02 * m21;
	    dst[2] = r00 * m02 + r01 * m12 + r02 * m22;
	    dst[3] = r00 * m03 + r01 * m13 + r02 * m23;
	    dst[4] = r10 * m00 + r11 * m10 + r12 * m20;
	    dst[5] = r10 * m01 + r11 * m11 + r12 * m21;
	    dst[6] = r10 * m02 + r11 * m12 + r12 * m22;
	    dst[7] = r10 * m03 + r11 * m13 + r12 * m23;
	    dst[8] = r20 * m00 + r21 * m10 + r22 * m20;
	    dst[9] = r20 * m01 + r21 * m11 + r22 * m21;
	    dst[10] = r20 * m02 + r21 * m12 + r22 * m22;
	    dst[11] = r20 * m03 + r21 * m13 + r22 * m23;

	    if (m !== dst) {
	      dst[12] = m[12];
	      dst[13] = m[13];
	      dst[14] = m[14];
	      dst[15] = m[15];
	    }

	    return dst;
	  }

	  /**
	   * Creates a 4-by-4 matrix which scales in each dimension by an amount given by
	   * the corresponding entry in the given vector; assumes the vector has three
	   * entries.
	   * @param {Vec3} v A vector of
	   *     three entries specifying the factor by which to scale in each dimension.
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} The scaling matrix.
	   * @memberOf module:twgl/m4
	   */
	  function scaling(v, dst) {
	    dst = dst || new MatType(16);

	    dst[0] = v[0];
	    dst[1] = 0;
	    dst[2] = 0;
	    dst[3] = 0;
	    dst[4] = 0;
	    dst[5] = v[1];
	    dst[6] = 0;
	    dst[7] = 0;
	    dst[8] = 0;
	    dst[9] = 0;
	    dst[10] = v[2];
	    dst[11] = 0;
	    dst[12] = 0;
	    dst[13] = 0;
	    dst[14] = 0;
	    dst[15] = 1;

	    return dst;
	  }

	  /**
	   * Modifies the given 4-by-4 matrix, scaling in each dimension by an amount
	   * given by the corresponding entry in the given vector; assumes the vector has
	   * three entries.
	   * @param {module:twgl/m4.Mat4} m The matrix to be modified.
	   * @param {Vec3} v A vector of three entries specifying the
	   *     factor by which to scale in each dimension.
	   * @param {module:twgl/m4.Mat4} [dst] matrix to hold result. If none new one is created..
	   * @return {module:twgl/m4.Mat4} m once modified.
	   * @memberOf module:twgl/m4
	   */
	  function scale(m, v, dst) {
	    dst = dst || new MatType(16);

	    var v0 = v[0];
	    var v1 = v[1];
	    var v2 = v[2];

	    dst[0] = v0 * m[0 * 4 + 0];
	    dst[1] = v0 * m[0 * 4 + 1];
	    dst[2] = v0 * m[0 * 4 + 2];
	    dst[3] = v0 * m[0 * 4 + 3];
	    dst[4] = v1 * m[1 * 4 + 0];
	    dst[5] = v1 * m[1 * 4 + 1];
	    dst[6] = v1 * m[1 * 4 + 2];
	    dst[7] = v1 * m[1 * 4 + 3];
	    dst[8] = v2 * m[2 * 4 + 0];
	    dst[9] = v2 * m[2 * 4 + 1];
	    dst[10] = v2 * m[2 * 4 + 2];
	    dst[11] = v2 * m[2 * 4 + 3];

	    if (m !== dst) {
	      dst[12] = m[12];
	      dst[13] = m[13];
	      dst[14] = m[14];
	      dst[15] = m[15];
	    }

	    return dst;
	  }

	  /**
	   * Takes a 4-by-4 matrix and a vector with 3 entries,
	   * interprets the vector as a point, transforms that point by the matrix, and
	   * returns the result as a vector with 3 entries.
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {Vec3} v The point.
	   * @param {Vec3} dst optional vec3 to store result
	   * @return {Vec3} dst or new vec3 if not provided
	   * @memberOf module:twgl/m4
	   */
	  function transformPoint(m, v, dst) {
	    dst = dst || v3.create();
	    var v0 = v[0];
	    var v1 = v[1];
	    var v2 = v[2];
	    var d = v0 * m[0 * 4 + 3] + v1 * m[1 * 4 + 3] + v2 * m[2 * 4 + 3] + m[3 * 4 + 3];

	    dst[0] = (v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0] + m[3 * 4 + 0]) / d;
	    dst[1] = (v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1] + m[3 * 4 + 1]) / d;
	    dst[2] = (v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2] + m[3 * 4 + 2]) / d;

	    return dst;
	  }

	  /**
	   * Takes a 4-by-4 matrix and a vector with 3 entries, interprets the vector as a
	   * direction, transforms that direction by the matrix, and returns the result;
	   * assumes the transformation of 3-dimensional space represented by the matrix
	   * is parallel-preserving, i.e. any combination of rotation, scaling and
	   * translation, but not a perspective distortion. Returns a vector with 3
	   * entries.
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {Vec3} v The direction.
	   * @param {Vec3} dst optional Vec3 to store result
	   * @return {Vec3} dst or new Vec3 if not provided
	   * @memberOf module:twgl/m4
	   */
	  function transformDirection(m, v, dst) {
	    dst = dst || v3.create();

	    var v0 = v[0];
	    var v1 = v[1];
	    var v2 = v[2];

	    dst[0] = v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0];
	    dst[1] = v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1];
	    dst[2] = v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2];

	    return dst;
	  }

	  /**
	   * Takes a 4-by-4 matrix m and a vector v with 3 entries, interprets the vector
	   * as a normal to a surface, and computes a vector which is normal upon
	   * transforming that surface by the matrix. The effect of this function is the
	   * same as transforming v (as a direction) by the inverse-transpose of m.  This
	   * function assumes the transformation of 3-dimensional space represented by the
	   * matrix is parallel-preserving, i.e. any combination of rotation, scaling and
	   * translation, but not a perspective distortion.  Returns a vector with 3
	   * entries.
	   * @param {module:twgl/m4.Mat4} m The matrix.
	   * @param {Vec3} v The normal.
	   * @param {Vec3} [dst] The direction.
	   * @return {Vec3} The transformed direction.
	   * @memberOf module:twgl/m4
	   */
	  function transformNormal(m, v, dst) {
	    dst = dst || v3.create();
	    var mi = inverse(m);
	    var v0 = v[0];
	    var v1 = v[1];
	    var v2 = v[2];

	    dst[0] = v0 * mi[0 * 4 + 0] + v1 * mi[0 * 4 + 1] + v2 * mi[0 * 4 + 2];
	    dst[1] = v0 * mi[1 * 4 + 0] + v1 * mi[1 * 4 + 1] + v2 * mi[1 * 4 + 2];
	    dst[2] = v0 * mi[2 * 4 + 0] + v1 * mi[2 * 4 + 1] + v2 * mi[2 * 4 + 2];

	    return dst;
	  }

	  // Using quotes prevents Uglify from changing the names.
	  // No speed diff AFAICT.
	  return {
	    "axisRotate": axisRotate,
	    "axisRotation": axisRotation,
	    "create": identity,
	    "copy": copy,
	    "frustum": frustum,
	    "getAxis": getAxis,
	    "getTranslation": getTranslation,
	    "identity": identity,
	    "inverse": inverse,
	    "lookAt": lookAt,
	    "multiply": multiply,
	    "negate": negate,
	    "ortho": ortho,
	    "perspective": perspective,
	    "rotateX": rotateX,
	    "rotateY": rotateY,
	    "rotateZ": rotateZ,
	    "rotateAxis": axisRotate,
	    "rotationX": rotationX,
	    "rotationY": rotationY,
	    "rotationZ": rotationZ,
	    "scale": scale,
	    "scaling": scaling,
	    "setAxis": setAxis,
	    "setDefaultType": setDefaultType,
	    "setTranslation": setTranslation,
	    "transformDirection": transformDirection,
	    "transformNormal": transformNormal,
	    "transformPoint": transformPoint,
	    "translate": translate,
	    "translation": translation,
	    "transpose": transpose
	  };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;"use strict";

	/*
	 * Copyright 2015, Gregg Tavares.
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *     * Redistributions of source code must retain the above copyright
	 * notice, this list of conditions and the following disclaimer.
	 *     * Redistributions in binary form must reproduce the above
	 * copyright notice, this list of conditions and the following disclaimer
	 * in the documentation and/or other materials provided with the
	 * distribution.
	 *     * Neither the name of Gregg Tavares. nor the names of his
	 * contributors may be used to endorse or promote products derived from
	 * this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {
	  "use strict";

	  /**
	   *
	   * Vec3 math math functions.
	   *
	   * Almost all functions take an optional `dst` argument. If it is not passed in the
	   * functions will create a new Vec3. In other words you can do this
	   *
	   *     var v = v3.cross(v1, v2);  // Creates a new Vec3 with the cross product of v1 x v2.
	   *
	   * or
	   *
	   *     var v3 = v3.create();
	   *     v3.cross(v1, v2, v);  // Puts the cross product of v1 x v2 in v
	   *
	   * The first style is often easier but depending on where it's used it generates garbage where
	   * as there is almost never allocation with the second style.
	   *
	   * It is always save to pass any vector as the destination. So for example
	   *
	   *     v3.cross(v1, v2, v1);  // Puts the cross product of v1 x v2 in v1
	   *
	   * @module twgl/v3
	   */

	  var VecType = Float32Array;

	  /**
	   * A JavaScript array with 3 values or a Float32Array with 3 values.
	   * When created by the library will create the default type which is `Float32Array`
	   * but can be set by calling {@link module:twgl/v3.setDefaultType}.
	   * @typedef {(number[]|Float32Array)} Vec3
	   * @memberOf module:twgl/v3
	   */

	  /**
	   * Sets the type this library creates for a Vec3
	   * @param {constructor} ctor the constructor for the type. Either `Float32Array` or `Array`
	   * @return {constructor} previous constructor for Vec3
	   */
	  function setDefaultType(ctor) {
	    var oldType = VecType;
	    VecType = ctor;
	    return oldType;
	  }

	  /**
	   * Creates a vec3; may be called with x, y, z to set initial values.
	   * @return {Vec3} the created vector
	   * @memberOf module:twgl/v3
	   */
	  function create(x, y, z) {
	    var dst = new VecType(3);
	    if (x) {
	      dst[0] = x;
	    }
	    if (y) {
	      dst[1] = y;
	    }
	    if (z) {
	      dst[2] = z;
	    }
	    return dst;
	  }

	  /**
	   * Adds two vectors; assumes a and b have the same dimension.
	   * @param {module:twgl/v3.Vec3} a Operand vector.
	   * @param {module:twgl/v3.Vec3} b Operand vector.
	   * @param {module:twgl/v3.Vec3} [dst] vector to hold result. If not new one is created..
	   * @memberOf module:twgl/v3
	   */
	  function add(a, b, dst) {
	    dst = dst || new VecType(3);

	    dst[0] = a[0] + b[0];
	    dst[1] = a[1] + b[1];
	    dst[2] = a[2] + b[2];

	    return dst;
	  }

	  /**
	   * Subtracts two vectors.
	   * @param {module:twgl/v3.Vec3} a Operand vector.
	   * @param {module:twgl/v3.Vec3} b Operand vector.
	   * @param {module:twgl/v3.Vec3} [dst] vector to hold result. If not new one is created..
	   * @memberOf module:twgl/v3
	   */
	  function subtract(a, b, dst) {
	    dst = dst || new VecType(3);

	    dst[0] = a[0] - b[0];
	    dst[1] = a[1] - b[1];
	    dst[2] = a[2] - b[2];

	    return dst;
	  }

	  /**
	   * Performs linear interpolation on two vectors.
	   * Given vectors a and b and interpolation coefficient t, returns
	   * (1 - t) * a + t * b.
	   * @param {module:twgl/v3.Vec3} a Operand vector.
	   * @param {module:twgl/v3.Vec3} b Operand vector.
	   * @param {number} t Interpolation coefficient.
	   * @param {module:twgl/v3.Vec3} [dst] vector to hold result. If not new one is created..
	   * @memberOf module:twgl/v3
	   */
	  function lerp(a, b, t, dst) {
	    dst = dst || new VecType(3);

	    dst[0] = (1 - t) * a[0] + t * b[0];
	    dst[1] = (1 - t) * a[1] + t * b[1];
	    dst[2] = (1 - t) * a[2] + t * b[2];

	    return dst;
	  }

	  /**
	   * Mutiplies a vector by a scalar.
	   * @param {module:twgl/v3.Vec3} v The vector.
	   * @param {number} k The scalar.
	   * @param {module:twgl/v3.Vec3} [dst] vector to hold result. If not new one is created..
	   * @return {module:twgl/v3.Vec3} dst.
	   * @memberOf module:twgl/v3
	   */
	  function mulScalar(v, k, dst) {
	    dst = dst || new VecType(3);

	    dst[0] = v[0] * k;
	    dst[1] = v[1] * k;
	    dst[2] = v[2] * k;

	    return dst;
	  }

	  /**
	   * Divides a vector by a scalar.
	   * @param {module:twgl/v3.Vec3} v The vector.
	   * @param {number} k The scalar.
	   * @param {module:twgl/v3.Vec3} [dst] vector to hold result. If not new one is created..
	   * @return {module:twgl/v3.Vec3} dst.
	   * @memberOf module:twgl/v3
	   */
	  function divScalar(v, k, dst) {
	    dst = dst || new VecType(3);

	    dst[0] = v[0] / k;
	    dst[1] = v[1] / k;
	    dst[2] = v[2] / k;

	    return dst;
	  }

	  /**
	   * Computes the cross product of two vectors; assumes both vectors have
	   * three entries.
	   * @param {module:twgl/v3.Vec3} a Operand vector.
	   * @param {module:twgl/v3.Vec3} b Operand vector.
	   * @param {module:twgl/v3.Vec3} [dst] vector to hold result. If not new one is created..
	   * @return {module:twgl/v3.Vec3} The vector a cross b.
	   * @memberOf module:twgl/v3
	   */
	  function cross(a, b, dst) {
	    dst = dst || new VecType(3);

	    var t1 = a[2] * b[0] - a[0] * b[2];
	    var t2 = a[0] * b[1] - a[1] * b[0];
	    dst[0] = a[1] * b[2] - a[2] * b[1];
	    dst[1] = t1;
	    dst[2] = t2;

	    return dst;
	  }

	  /**
	   * Computes the dot product of two vectors; assumes both vectors have
	   * three entries.
	   * @param {module:twgl/v3.Vec3} a Operand vector.
	   * @param {module:twgl/v3.Vec3} b Operand vector.
	   * @return {number} dot product
	   * @memberOf module:twgl/v3
	   */
	  function dot(a, b) {
	    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
	  }

	  /**
	   * Computes the length of vector
	   * @param {module:twgl/v3.Vec3} v vector.
	   * @return {number} length of vector.
	   * @memberOf module:twgl/v3
	   */
	  function length(v) {
	    return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	  }

	  /**
	   * Computes the square of the length of vector
	   * @param {module:twgl/v3.Vec3} v vector.
	   * @return {number} square of the length of vector.
	   * @memberOf module:twgl/v3
	   */
	  function lengthSq(v) {
	    return v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
	  }

	  /**
	   * Computes the distance between 2 points
	   * @param {module:twgl/v3.Vec3} a vector.
	   * @param {module:twgl/v3.Vec3} b vector.
	   * @return {number} distance between a and b
	   * @memberOf module:twgl/v3
	   */
	  function distance(a, b) {
	    var dx = a[0] - b[0];
	    var dy = a[1] - b[1];
	    var dz = a[2] - b[2];
	    return Math.sqrt(dx * dx + dy * dy + dz * dz);
	  }

	  /**
	   * Computes the square of the distance between 2 points
	   * @param {module:twgl/v3.Vec3} a vector.
	   * @param {module:twgl/v3.Vec3} b vector.
	   * @return {number} square of the distance between a and b
	   * @memberOf module:twgl/v3
	   */
	  function distanceSq(a, b) {
	    var dx = a[0] - b[0];
	    var dy = a[1] - b[1];
	    var dz = a[2] - b[2];
	    return dx * dx + dy * dy + dz * dz;
	  }

	  /**
	   * Divides a vector by its Euclidean length and returns the quotient.
	   * @param {module:twgl/v3.Vec3} a The vector.
	   * @param {module:twgl/v3.Vec3} [dst] vector to hold result. If not new one is created..
	   * @return {module:twgl/v3.Vec3} The normalized vector.
	   * @memberOf module:twgl/v3
	   */
	  function normalize(a, dst) {
	    dst = dst || new VecType(3);

	    var lenSq = a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
	    var len = Math.sqrt(lenSq);
	    if (len > 0.00001) {
	      dst[0] = a[0] / len;
	      dst[1] = a[1] / len;
	      dst[2] = a[2] / len;
	    } else {
	      dst[0] = 0;
	      dst[1] = 0;
	      dst[2] = 0;
	    }

	    return dst;
	  }

	  /**
	   * Negates a vector.
	   * @param {module:twgl/v3.Vec3} v The vector.
	   * @param {module:twgl/v3.Vec3} [dst] vector to hold result. If not new one is created..
	   * @return {module:twgl/v3.Vec3} -v.
	   * @memberOf module:twgl/v3
	   */
	  function negate(v, dst) {
	    dst = dst || new VecType(3);

	    dst[0] = -v[0];
	    dst[1] = -v[1];
	    dst[2] = -v[2];

	    return dst;
	  }

	  /**
	   * Copies a vector.
	   * @param {module:twgl/v3.Vec3} v The vector.
	   * @param {module:twgl/v3.Vec3} [dst] vector to hold result. If not new one is created..
	   * @return {module:twgl/v3.Vec3} A copy of v.
	   * @memberOf module:twgl/v3
	   */
	  function copy(v, dst) {
	    dst = dst || new VecType(3);

	    dst[0] = v[0];
	    dst[1] = v[1];
	    dst[2] = v[2];

	    return dst;
	  }

	  /**
	   * Multiplies a vector by another vector (component-wise); assumes a and
	   * b have the same length.
	   * @param {module:twgl/v3.Vec3} a Operand vector.
	   * @param {module:twgl/v3.Vec3} b Operand vector.
	   * @param {module:twgl/v3.Vec3} [dst] vector to hold result. If not new one is created..
	   * @return {module:twgl/v3.Vec3} The vector of products of entries of a and
	   *     b.
	   * @memberOf module:twgl/v3
	   */
	  function multiply(a, b, dst) {
	    dst = dst || new VecType(3);

	    dst[0] = a[0] * b[0];
	    dst[1] = a[1] * b[1];
	    dst[2] = a[2] * b[2];

	    return dst;
	  }

	  /**
	   * Divides a vector by another vector (component-wise); assumes a and
	   * b have the same length.
	   * @param {module:twgl/v3.Vec3} a Operand vector.
	   * @param {module:twgl/v3.Vec3} b Operand vector.
	   * @param {module:twgl/v3.Vec3} [dst] vector to hold result. If not new one is created..
	   * @return {module:twgl/v3.Vec3} The vector of quotients of entries of a and
	   *     b.
	   * @memberOf module:twgl/v3
	   */
	  function divide(a, b, dst) {
	    dst = dst || new VecType(3);

	    dst[0] = a[0] / b[0];
	    dst[1] = a[1] / b[1];
	    dst[2] = a[2] / b[2];

	    return dst;
	  }

	  // Using quotes prevents Uglify from changing the names.
	  // No speed diff AFAICT.
	  return {
	    "add": add,
	    "copy": copy,
	    "create": create,
	    "cross": cross,
	    "distance": distance,
	    "distanceSq": distanceSq,
	    "divide": divide,
	    "divScalar": divScalar,
	    "dot": dot,
	    "lerp": lerp,
	    "length": length,
	    "lengthSq": lengthSq,
	    "mulScalar": mulScalar,
	    "multiply": multiply,
	    "negate": negate,
	    "normalize": normalize,
	    "setDefaultType": setDefaultType,
	    "subtract": subtract
	  };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	/*
	 * Copyright 2015, Gregg Tavares.
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *     * Redistributions of source code must retain the above copyright
	 * notice, this list of conditions and the following disclaimer.
	 *     * Redistributions in binary form must reproduce the above
	 * copyright notice, this list of conditions and the following disclaimer
	 * in the documentation and/or other materials provided with the
	 * distribution.
	 *     * Neither the name of Gregg Tavares. nor the names of his
	 * contributors may be used to endorse or promote products derived from
	 * this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	/**
	 * Various functions to make simple primitives
	 *
	 * note: Most primitive functions come in 3 styles
	 *
	 * *  `createSomeShapeBufferInfo`
	 *
	 *    These functions are almost always the functions you want to call. They
	 *    create vertices then make WebGLBuffers and create {@link module:twgl.AttribInfo}s
	 *    returing a {@link module:twgl.BufferInfo} you can pass to {@link module:twgl.setBuffersAndAttributes}
	 *    and {@link module:twgl.drawBufferInfo} etc...
	 *
	 * *  `createSomeShapeBuffers`
	 *
	 *    These create WebGLBuffers and put your data in them but nothing else.
	 *    It's a shortcut to doing it yourself if you don't want to use
	 *    the higher level functions.
	 *
	 * *  `createSomeShapeVertices`
	 *
	 *    These just create vertices, no buffers. This allows you to manipulate the vertices
	 *    or add more data before generating a {@link module:twgl.BufferInfo}. Once you're finished
	 *    manipulating the vertices call {@link module:twgl.createBufferInfoFromArrays}.
	 *
	 *    example:
	 *
	 *        var arrays = twgl.primitives.createPlaneArrays(1);
	 *        twgl.primitives.reorientVertices(arrays, m4.rotationX(Math.PI * 0.5));
	 *        var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
	 *
	 * @module twgl/primitives
	 */
	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2), __webpack_require__(4), __webpack_require__(10), __webpack_require__(11)], __WEBPACK_AMD_DEFINE_RESULT__ = function (attributes, utils, m4, v3) {
	  "use strict";

	  var getArray = attributes.getArray_; // eslint-disable-line
	  var getNumComponents = attributes.getNumComponents_; // eslint-disable-line

	  /**
	   * Add `push` to a typed array. It just keeps a 'cursor'
	   * and allows use to `push` values into the array so we
	   * don't have to manually compute offsets
	   * @param {TypedArray} typedArray TypedArray to augment
	   * @param {number} numComponents number of components.
	   */
	  function augmentTypedArray(typedArray, numComponents) {
	    var cursor = 0;
	    typedArray.push = function () {
	      for (var ii = 0; ii < arguments.length; ++ii) {
	        var value = arguments[ii];
	        if (value instanceof Array || value.buffer && value.buffer instanceof ArrayBuffer) {
	          for (var jj = 0; jj < value.length; ++jj) {
	            typedArray[cursor++] = value[jj];
	          }
	        } else {
	          typedArray[cursor++] = value;
	        }
	      }
	    };
	    typedArray.reset = function (opt_index) {
	      cursor = opt_index || 0;
	    };
	    typedArray.numComponents = numComponents;
	    Object.defineProperty(typedArray, 'numElements', {
	      get: function get() {
	        return this.length / this.numComponents | 0;
	      }
	    });
	    return typedArray;
	  }

	  /**
	   * creates a typed array with a `push` function attached
	   * so that you can easily *push* values.
	   *
	   * `push` can take multiple arguments. If an argument is an array each element
	   * of the array will be added to the typed array.
	   *
	   * Example:
	   *
	   *     var array = createAugmentedTypedArray(3, 2);  // creates a Float32Array with 6 values
	   *     array.push(1, 2, 3);
	   *     array.push([4, 5, 6]);
	   *     // array now contains [1, 2, 3, 4, 5, 6]
	   *
	   * Also has `numComponents` and `numElements` properties.
	   *
	   * @param {number} numComponents number of components
	   * @param {number} numElements number of elements. The total size of the array will be `numComponents * numElements`.
	   * @param {constructor} opt_type A constructor for the type. Default = `Float32Array`.
	   * @return {ArrayBuffer} A typed array.
	   * @memberOf module:twgl/primitives
	   */
	  function createAugmentedTypedArray(numComponents, numElements, opt_type) {
	    var Type = opt_type || Float32Array;
	    return augmentTypedArray(new Type(numComponents * numElements), numComponents);
	  }

	  function allButIndices(name) {
	    return name !== "indices";
	  }

	  /**
	   * Given indexed vertices creates a new set of vertices unindexed by expanding the indexed vertices.
	   * @param {Object.<string, TypedArray>} vertices The indexed vertices to deindex
	   * @return {Object.<string, TypedArray>} The deindexed vertices
	   * @memberOf module:twgl/primitives
	   */
	  function deindexVertices(vertices) {
	    var indices = vertices.indices;
	    var newVertices = {};
	    var numElements = indices.length;

	    function expandToUnindexed(channel) {
	      var srcBuffer = vertices[channel];
	      var numComponents = srcBuffer.numComponents;
	      var dstBuffer = createAugmentedTypedArray(numComponents, numElements, srcBuffer.constructor);
	      for (var ii = 0; ii < numElements; ++ii) {
	        var ndx = indices[ii];
	        var offset = ndx * numComponents;
	        for (var jj = 0; jj < numComponents; ++jj) {
	          dstBuffer.push(srcBuffer[offset + jj]);
	        }
	      }
	      newVertices[channel] = dstBuffer;
	    }

	    Object.keys(vertices).filter(allButIndices).forEach(expandToUnindexed);

	    return newVertices;
	  }

	  /**
	   * flattens the normals of deindexed vertices in place.
	   * @param {Object.<string, TypedArray>} vertices The deindexed vertices who's normals to flatten
	   * @return {Object.<string, TypedArray>} The flattened vertices (same as was passed in)
	   * @memberOf module:twgl/primitives
	   */
	  function flattenNormals(vertices) {
	    if (vertices.indices) {
	      throw "can't flatten normals of indexed vertices. deindex them first";
	    }

	    var normals = vertices.normal;
	    var numNormals = normals.length;
	    for (var ii = 0; ii < numNormals; ii += 9) {
	      // pull out the 3 normals for this triangle
	      var nax = normals[ii + 0];
	      var nay = normals[ii + 1];
	      var naz = normals[ii + 2];

	      var nbx = normals[ii + 3];
	      var nby = normals[ii + 4];
	      var nbz = normals[ii + 5];

	      var ncx = normals[ii + 6];
	      var ncy = normals[ii + 7];
	      var ncz = normals[ii + 8];

	      // add them
	      var nx = nax + nbx + ncx;
	      var ny = nay + nby + ncy;
	      var nz = naz + nbz + ncz;

	      // normalize them
	      var length = Math.sqrt(nx * nx + ny * ny + nz * nz);

	      nx /= length;
	      ny /= length;
	      nz /= length;

	      // copy them back in
	      normals[ii + 0] = nx;
	      normals[ii + 1] = ny;
	      normals[ii + 2] = nz;

	      normals[ii + 3] = nx;
	      normals[ii + 4] = ny;
	      normals[ii + 5] = nz;

	      normals[ii + 6] = nx;
	      normals[ii + 7] = ny;
	      normals[ii + 8] = nz;
	    }

	    return vertices;
	  }

	  function applyFuncToV3Array(array, matrix, fn) {
	    var len = array.length;
	    var tmp = new Float32Array(3);
	    for (var ii = 0; ii < len; ii += 3) {
	      fn(matrix, [array[ii], array[ii + 1], array[ii + 2]], tmp);
	      array[ii] = tmp[0];
	      array[ii + 1] = tmp[1];
	      array[ii + 2] = tmp[2];
	    }
	  }

	  function transformNormal(mi, v, dst) {
	    dst = dst || v3.create();
	    var v0 = v[0];
	    var v1 = v[1];
	    var v2 = v[2];

	    dst[0] = v0 * mi[0 * 4 + 0] + v1 * mi[0 * 4 + 1] + v2 * mi[0 * 4 + 2];
	    dst[1] = v0 * mi[1 * 4 + 0] + v1 * mi[1 * 4 + 1] + v2 * mi[1 * 4 + 2];
	    dst[2] = v0 * mi[2 * 4 + 0] + v1 * mi[2 * 4 + 1] + v2 * mi[2 * 4 + 2];

	    return dst;
	  }

	  /**
	   * Reorients directions by the given matrix..
	   * @param {number[]|TypedArray} array The array. Assumes value floats per element.
	   * @param {Matrix} matrix A matrix to multiply by.
	   * @return {number[]|TypedArray} the same array that was passed in
	   * @memberOf module:twgl/primitives
	   */
	  function reorientDirections(array, matrix) {
	    applyFuncToV3Array(array, matrix, m4.transformDirection);
	    return array;
	  }

	  /**
	   * Reorients normals by the inverse-transpose of the given
	   * matrix..
	   * @param {number[]|TypedArray} array The array. Assumes value floats per element.
	   * @param {Matrix} matrix A matrix to multiply by.
	   * @return {number[]|TypedArray} the same array that was passed in
	   * @memberOf module:twgl/primitives
	   */
	  function reorientNormals(array, matrix) {
	    applyFuncToV3Array(array, m4.inverse(matrix), transformNormal);
	    return array;
	  }

	  /**
	   * Reorients positions by the given matrix. In other words, it
	   * multiplies each vertex by the given matrix.
	   * @param {number[]|TypedArray} array The array. Assumes value floats per element.
	   * @param {Matrix} matrix A matrix to multiply by.
	   * @return {number[]|TypedArray} the same array that was passed in
	   * @memberOf module:twgl/primitives
	   */
	  function reorientPositions(array, matrix) {
	    applyFuncToV3Array(array, matrix, m4.transformPoint);
	    return array;
	  }

	  /**
	   * Reorients arrays by the given matrix. Assumes arrays have
	   * names that contains 'pos' could be reoriented as positions,
	   * 'binorm' or 'tan' as directions, and 'norm' as normals.
	   *
	   * @param {Object.<string, (number[]|TypedArray)>} arrays The vertices to reorient
	   * @param {Matrix} matrix matrix to reorient by.
	   * @return {Object.<string, (number[]|TypedArray)>} same arrays that were passed in.
	   * @memberOf module:twgl/primitives
	   */
	  function reorientVertices(arrays, matrix) {
	    Object.keys(arrays).forEach(function (name) {
	      var array = arrays[name];
	      if (name.indexOf("pos") >= 0) {
	        reorientPositions(array, matrix);
	      } else if (name.indexOf("tan") >= 0 || name.indexOf("binorm") >= 0) {
	        reorientDirections(array, matrix);
	      } else if (name.indexOf("norm") >= 0) {
	        reorientNormals(array, matrix);
	      }
	    });
	    return arrays;
	  }

	  /**
	   * Creates XY quad BufferInfo
	   *
	   * The default with no parameters will return a 2x2 quad with values from -1 to +1.
	   * If you want a unit quad with that goes from 0 to 1 you'd call it with
	   *
	   *     twgl.primitives.createXYQuadBufferInfo(gl, 1, 0.5, 0.5);
	   *
	   * If you want a unit quad centered above 0,0 you'd call it with
	   *
	   *     twgl.primitives.createXYQuadBufferInfo(gl, 1, 0, 0.5);
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext.
	   * @param {number} [size] the size across the quad. Defaults to 2 which means vertices will go from -1 to +1
	   * @param {number} [xOffset] the amount to offset the quad in X
	   * @param {number} [yOffset] the amount to offset the quad in Y
	   * @return {Object.<string, WebGLBuffer>} the created XY Quad BufferInfo
	   * @memberOf module:twgl/primitives
	   * @function createXYQuadBufferInfo
	   */

	  /**
	   * Creates XY quad Buffers
	   *
	   * The default with no parameters will return a 2x2 quad with values from -1 to +1.
	   * If you want a unit quad with that goes from 0 to 1 you'd call it with
	   *
	   *     twgl.primitives.createXYQuadBufferInfo(gl, 1, 0.5, 0.5);
	   *
	   * If you want a unit quad centered above 0,0 you'd call it with
	   *
	   *     twgl.primitives.createXYQuadBufferInfo(gl, 1, 0, 0.5);
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext.
	   * @param {number} [size] the size across the quad. Defaults to 2 which means vertices will go from -1 to +1
	   * @param {number} [xOffset] the amount to offset the quad in X
	   * @param {number} [yOffset] the amount to offset the quad in Y
	   * @return {module:twgl.BufferInfo} the created XY Quad buffers
	   * @memberOf module:twgl/primitives
	   * @function createXYQuadBuffers
	   */

	  /**
	   * Creates XY quad vertices
	   *
	   * The default with no parameters will return a 2x2 quad with values from -1 to +1.
	   * If you want a unit quad with that goes from 0 to 1 you'd call it with
	   *
	   *     twgl.primitives.createXYQuadVertices(1, 0.5, 0.5);
	   *
	   * If you want a unit quad centered above 0,0 you'd call it with
	   *
	   *     twgl.primitives.createXYQuadVertices(1, 0, 0.5);
	   *
	   * @param {number} [size] the size across the quad. Defaults to 2 which means vertices will go from -1 to +1
	   * @param {number} [xOffset] the amount to offset the quad in X
	   * @param {number} [yOffset] the amount to offset the quad in Y
	   * @return {Object.<string, TypedArray> the created XY Quad vertices
	   * @memberOf module:twgl/primitives
	   */
	  function createXYQuadVertices(size, xOffset, yOffset) {
	    size = size || 2;
	    xOffset = xOffset || 0;
	    yOffset = yOffset || 0;
	    size *= 0.5;
	    return {
	      position: {
	        numComponents: 2,
	        data: [xOffset + -1 * size, yOffset + -1 * size, xOffset + 1 * size, yOffset + -1 * size, xOffset + -1 * size, yOffset + 1 * size, xOffset + 1 * size, yOffset + 1 * size]
	      },
	      normal: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
	      texcoord: [0, 0, 1, 0, 0, 1, 1, 1],
	      indices: [0, 1, 2, 2, 1, 3]
	    };
	  }

	  /**
	   * Creates XZ plane BufferInfo.
	   *
	   * The created plane has position, normal, and texcoord data
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext.
	   * @param {number} [width] Width of the plane. Default = 1
	   * @param {number} [depth] Depth of the plane. Default = 1
	   * @param {number} [subdivisionsWidth] Number of steps across the plane. Default = 1
	   * @param {number} [subdivisionsDepth] Number of steps down the plane. Default = 1
	   * @param {Matrix4} [matrix] A matrix by which to multiply all the vertices.
	   * @return {@module:twgl.BufferInfo} The created plane BufferInfo.
	   * @memberOf module:twgl/primitives
	   * @function createPlaneBufferInfo
	   */

	  /**
	   * Creates XZ plane buffers.
	   *
	   * The created plane has position, normal, and texcoord data
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext.
	   * @param {number} [width] Width of the plane. Default = 1
	   * @param {number} [depth] Depth of the plane. Default = 1
	   * @param {number} [subdivisionsWidth] Number of steps across the plane. Default = 1
	   * @param {number} [subdivisionsDepth] Number of steps down the plane. Default = 1
	   * @param {Matrix4} [matrix] A matrix by which to multiply all the vertices.
	   * @return {Object.<string, WebGLBuffer>} The created plane buffers.
	   * @memberOf module:twgl/primitives
	   * @function createPlaneBuffers
	   */

	  /**
	   * Creates XZ plane vertices.
	   *
	   * The created plane has position, normal, and texcoord data
	   *
	   * @param {number} [width] Width of the plane. Default = 1
	   * @param {number} [depth] Depth of the plane. Default = 1
	   * @param {number} [subdivisionsWidth] Number of steps across the plane. Default = 1
	   * @param {number} [subdivisionsDepth] Number of steps down the plane. Default = 1
	   * @param {Matrix4} [matrix] A matrix by which to multiply all the vertices.
	   * @return {Object.<string, TypedArray>} The created plane vertices.
	   * @memberOf module:twgl/primitives
	   */
	  function createPlaneVertices(width, depth, subdivisionsWidth, subdivisionsDepth, matrix) {
	    width = width || 1;
	    depth = depth || 1;
	    subdivisionsWidth = subdivisionsWidth || 1;
	    subdivisionsDepth = subdivisionsDepth || 1;
	    matrix = matrix || m4.identity();

	    var numVertices = (subdivisionsWidth + 1) * (subdivisionsDepth + 1);
	    var positions = createAugmentedTypedArray(3, numVertices);
	    var normals = createAugmentedTypedArray(3, numVertices);
	    var texcoords = createAugmentedTypedArray(2, numVertices);

	    for (var z = 0; z <= subdivisionsDepth; z++) {
	      for (var x = 0; x <= subdivisionsWidth; x++) {
	        var u = x / subdivisionsWidth;
	        var v = z / subdivisionsDepth;
	        positions.push(width * u - width * 0.5, 0, depth * v - depth * 0.5);
	        normals.push(0, 1, 0);
	        texcoords.push(u, v);
	      }
	    }

	    var numVertsAcross = subdivisionsWidth + 1;
	    var indices = createAugmentedTypedArray(3, subdivisionsWidth * subdivisionsDepth * 2, Uint16Array);

	    for (var z = 0; z < subdivisionsDepth; z++) {
	      // eslint-disable-line
	      for (var x = 0; x < subdivisionsWidth; x++) {
	        // eslint-disable-line
	        // Make triangle 1 of quad.
	        indices.push((z + 0) * numVertsAcross + x, (z + 1) * numVertsAcross + x, (z + 0) * numVertsAcross + x + 1);

	        // Make triangle 2 of quad.
	        indices.push((z + 1) * numVertsAcross + x, (z + 1) * numVertsAcross + x + 1, (z + 0) * numVertsAcross + x + 1);
	      }
	    }

	    var arrays = reorientVertices({
	      position: positions,
	      normal: normals,
	      texcoord: texcoords,
	      indices: indices
	    }, matrix);
	    return arrays;
	  }

	  /**
	   * Creates sphere BufferInfo.
	   *
	   * The created sphere has position, normal, and texcoord data
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext.
	   * @param {number} radius radius of the sphere.
	   * @param {number} subdivisionsAxis number of steps around the sphere.
	   * @param {number} subdivisionsHeight number of vertically on the sphere.
	   * @param {number} [opt_startLatitudeInRadians] where to start the
	   *     top of the sphere. Default = 0.
	   * @param {number} [opt_endLatitudeInRadians] Where to end the
	   *     bottom of the sphere. Default = Math.PI.
	   * @param {number} [opt_startLongitudeInRadians] where to start
	   *     wrapping the sphere. Default = 0.
	   * @param {number} [opt_endLongitudeInRadians] where to end
	   *     wrapping the sphere. Default = 2 * Math.PI.
	   * @return {module:twgl.BufferInfo} The created sphere BufferInfo.
	   * @memberOf module:twgl/primitives
	   * @function createSphereBufferInfo
	   */

	  /**
	   * Creates sphere buffers.
	   *
	   * The created sphere has position, normal, and texcoord data
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext.
	   * @param {number} radius radius of the sphere.
	   * @param {number} subdivisionsAxis number of steps around the sphere.
	   * @param {number} subdivisionsHeight number of vertically on the sphere.
	   * @param {number} [opt_startLatitudeInRadians] where to start the
	   *     top of the sphere. Default = 0.
	   * @param {number} [opt_endLatitudeInRadians] Where to end the
	   *     bottom of the sphere. Default = Math.PI.
	   * @param {number} [opt_startLongitudeInRadians] where to start
	   *     wrapping the sphere. Default = 0.
	   * @param {number} [opt_endLongitudeInRadians] where to end
	   *     wrapping the sphere. Default = 2 * Math.PI.
	   * @return {Object.<string, WebGLBuffer>} The created sphere buffers.
	   * @memberOf module:twgl/primitives
	   * @function createSphereBuffers
	   */

	  /**
	   * Creates sphere vertices.
	   *
	   * The created sphere has position, normal, and texcoord data
	   *
	   * @param {number} radius radius of the sphere.
	   * @param {number} subdivisionsAxis number of steps around the sphere.
	   * @param {number} subdivisionsHeight number of vertically on the sphere.
	   * @param {number} [opt_startLatitudeInRadians] where to start the
	   *     top of the sphere. Default = 0.
	   * @param {number} [opt_endLatitudeInRadians] Where to end the
	   *     bottom of the sphere. Default = Math.PI.
	   * @param {number} [opt_startLongitudeInRadians] where to start
	   *     wrapping the sphere. Default = 0.
	   * @param {number} [opt_endLongitudeInRadians] where to end
	   *     wrapping the sphere. Default = 2 * Math.PI.
	   * @return {Object.<string, TypedArray>} The created sphere vertices.
	   * @memberOf module:twgl/primitives
	   */
	  function createSphereVertices(radius, subdivisionsAxis, subdivisionsHeight, opt_startLatitudeInRadians, opt_endLatitudeInRadians, opt_startLongitudeInRadians, opt_endLongitudeInRadians) {
	    if (subdivisionsAxis <= 0 || subdivisionsHeight <= 0) {
	      throw Error('subdivisionAxis and subdivisionHeight must be > 0');
	    }

	    opt_startLatitudeInRadians = opt_startLatitudeInRadians || 0;
	    opt_endLatitudeInRadians = opt_endLatitudeInRadians || Math.PI;
	    opt_startLongitudeInRadians = opt_startLongitudeInRadians || 0;
	    opt_endLongitudeInRadians = opt_endLongitudeInRadians || Math.PI * 2;

	    var latRange = opt_endLatitudeInRadians - opt_startLatitudeInRadians;
	    var longRange = opt_endLongitudeInRadians - opt_startLongitudeInRadians;

	    // We are going to generate our sphere by iterating through its
	    // spherical coordinates and generating 2 triangles for each quad on a
	    // ring of the sphere.
	    var numVertices = (subdivisionsAxis + 1) * (subdivisionsHeight + 1);
	    var positions = createAugmentedTypedArray(3, numVertices);
	    var normals = createAugmentedTypedArray(3, numVertices);
	    var texcoords = createAugmentedTypedArray(2, numVertices);

	    // Generate the individual vertices in our vertex buffer.
	    for (var y = 0; y <= subdivisionsHeight; y++) {
	      for (var x = 0; x <= subdivisionsAxis; x++) {
	        // Generate a vertex based on its spherical coordinates
	        var u = x / subdivisionsAxis;
	        var v = y / subdivisionsHeight;
	        var theta = longRange * u;
	        var phi = latRange * v;
	        var sinTheta = Math.sin(theta);
	        var cosTheta = Math.cos(theta);
	        var sinPhi = Math.sin(phi);
	        var cosPhi = Math.cos(phi);
	        var ux = cosTheta * sinPhi;
	        var uy = cosPhi;
	        var uz = sinTheta * sinPhi;
	        positions.push(radius * ux, radius * uy, radius * uz);
	        normals.push(ux, uy, uz);
	        texcoords.push(1 - u, v);
	      }
	    }

	    var numVertsAround = subdivisionsAxis + 1;
	    var indices = createAugmentedTypedArray(3, subdivisionsAxis * subdivisionsHeight * 2, Uint16Array);
	    for (var x = 0; x < subdivisionsAxis; x++) {
	      // eslint-disable-line
	      for (var y = 0; y < subdivisionsHeight; y++) {
	        // eslint-disable-line
	        // Make triangle 1 of quad.
	        indices.push((y + 0) * numVertsAround + x, (y + 0) * numVertsAround + x + 1, (y + 1) * numVertsAround + x);

	        // Make triangle 2 of quad.
	        indices.push((y + 1) * numVertsAround + x, (y + 0) * numVertsAround + x + 1, (y + 1) * numVertsAround + x + 1);
	      }
	    }

	    return {
	      position: positions,
	      normal: normals,
	      texcoord: texcoords,
	      indices: indices
	    };
	  }

	  /**
	   * Array of the indices of corners of each face of a cube.
	   * @type {Array.<number[]>}
	   */
	  var CUBE_FACE_INDICES = [[3, 7, 5, 1], // right
	  [6, 2, 0, 4], // left
	  [6, 7, 3, 2], // ??
	  [0, 1, 5, 4], // ??
	  [7, 6, 4, 5], // front
	  [2, 3, 1, 0]];

	  /**
	   * Creates a BufferInfo for a cube.
	   *
	   * The cube is created around the origin. (-size / 2, size / 2).
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext.
	   * @param {number} [size] width, height and depth of the cube.
	   * @return {module:twgl.BufferInfo} The created BufferInfo.
	   * @memberOf module:twgl/primitives
	   * @function createCubeBufferInfo
	   */

	  /**
	   * Creates the buffers and indices for a cube.
	   *
	   * The cube is created around the origin. (-size / 2, size / 2).
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext.
	   * @param {number} [size] width, height and depth of the cube.
	   * @return {Object.<string, WebGLBuffer>} The created buffers.
	   * @memberOf module:twgl/primitives
	   * @function createCubeBuffers
	   */

	  /**
	   * Creates the vertices and indices for a cube.
	   *
	   * The cube is created around the origin. (-size / 2, size / 2).
	   *
	   * @param {number} [size] width, height and depth of the cube.
	   * @return {Object.<string, TypedArray>} The created vertices.
	   * @memberOf module:twgl/primitives
	   */
	  function createCubeVertices(size) {
	    size = size || 1;
	    var k = size / 2;

	    var cornerVertices = [[-k, -k, -k], [+k, -k, -k], [-k, +k, -k], [+k, +k, -k], [-k, -k, +k], [+k, -k, +k], [-k, +k, +k], [+k, +k, +k]];

	    var faceNormals = [[+1, +0, +0], [-1, +0, +0], [+0, +1, +0], [+0, -1, +0], [+0, +0, +1], [+0, +0, -1]];

	    var uvCoords = [[1, 0], [0, 0], [0, 1], [1, 1]];

	    var numVertices = 6 * 4;
	    var positions = createAugmentedTypedArray(3, numVertices);
	    var normals = createAugmentedTypedArray(3, numVertices);
	    var texcoords = createAugmentedTypedArray(2, numVertices);
	    var indices = createAugmentedTypedArray(3, 6 * 2, Uint16Array);

	    for (var f = 0; f < 6; ++f) {
	      var faceIndices = CUBE_FACE_INDICES[f];
	      for (var v = 0; v < 4; ++v) {
	        var position = cornerVertices[faceIndices[v]];
	        var normal = faceNormals[f];
	        var uv = uvCoords[v];

	        // Each face needs all four vertices because the normals and texture
	        // coordinates are not all the same.
	        positions.push(position);
	        normals.push(normal);
	        texcoords.push(uv);
	      }
	      // Two triangles make a square face.
	      var offset = 4 * f;
	      indices.push(offset + 0, offset + 1, offset + 2);
	      indices.push(offset + 0, offset + 2, offset + 3);
	    }

	    return {
	      position: positions,
	      normal: normals,
	      texcoord: texcoords,
	      indices: indices
	    };
	  }

	  /**
	   * Creates a BufferInfo for a truncated cone, which is like a cylinder
	   * except that it has different top and bottom radii. A truncated cone
	   * can also be used to create cylinders and regular cones. The
	   * truncated cone will be created centered about the origin, with the
	   * y axis as its vertical axis.
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext.
	   * @param {number} bottomRadius Bottom radius of truncated cone.
	   * @param {number} topRadius Top radius of truncated cone.
	   * @param {number} height Height of truncated cone.
	   * @param {number} radialSubdivisions The number of subdivisions around the
	   *     truncated cone.
	   * @param {number} verticalSubdivisions The number of subdivisions down the
	   *     truncated cone.
	   * @param {boolean} [opt_topCap] Create top cap. Default = true.
	   * @param {boolean} [opt_bottomCap] Create bottom cap. Default = true.
	   * @return {module:twgl.BufferInfo} The created cone BufferInfo.
	   * @memberOf module:twgl/primitives
	   * @function createTruncatedConeBufferInfo
	   */

	  /**
	   * Creates buffers for a truncated cone, which is like a cylinder
	   * except that it has different top and bottom radii. A truncated cone
	   * can also be used to create cylinders and regular cones. The
	   * truncated cone will be created centered about the origin, with the
	   * y axis as its vertical axis.
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext.
	   * @param {number} bottomRadius Bottom radius of truncated cone.
	   * @param {number} topRadius Top radius of truncated cone.
	   * @param {number} height Height of truncated cone.
	   * @param {number} radialSubdivisions The number of subdivisions around the
	   *     truncated cone.
	   * @param {number} verticalSubdivisions The number of subdivisions down the
	   *     truncated cone.
	   * @param {boolean} [opt_topCap] Create top cap. Default = true.
	   * @param {boolean} [opt_bottomCap] Create bottom cap. Default = true.
	   * @return {Object.<string, WebGLBuffer>} The created cone buffers.
	   * @memberOf module:twgl/primitives
	   * @function createTruncatedConeBuffers
	   */

	  /**
	   * Creates vertices for a truncated cone, which is like a cylinder
	   * except that it has different top and bottom radii. A truncated cone
	   * can also be used to create cylinders and regular cones. The
	   * truncated cone will be created centered about the origin, with the
	   * y axis as its vertical axis. .
	   *
	   * @param {number} bottomRadius Bottom radius of truncated cone.
	   * @param {number} topRadius Top radius of truncated cone.
	   * @param {number} height Height of truncated cone.
	   * @param {number} radialSubdivisions The number of subdivisions around the
	   *     truncated cone.
	   * @param {number} verticalSubdivisions The number of subdivisions down the
	   *     truncated cone.
	   * @param {boolean} [opt_topCap] Create top cap. Default = true.
	   * @param {boolean} [opt_bottomCap] Create bottom cap. Default = true.
	   * @return {Object.<string, TypedArray>} The created cone vertices.
	   * @memberOf module:twgl/primitives
	   */
	  function createTruncatedConeVertices(bottomRadius, topRadius, height, radialSubdivisions, verticalSubdivisions, opt_topCap, opt_bottomCap) {
	    if (radialSubdivisions < 3) {
	      throw Error('radialSubdivisions must be 3 or greater');
	    }

	    if (verticalSubdivisions < 1) {
	      throw Error('verticalSubdivisions must be 1 or greater');
	    }

	    var topCap = opt_topCap === undefined ? true : opt_topCap;
	    var bottomCap = opt_bottomCap === undefined ? true : opt_bottomCap;

	    var extra = (topCap ? 2 : 0) + (bottomCap ? 2 : 0);

	    var numVertices = (radialSubdivisions + 1) * (verticalSubdivisions + 1 + extra);
	    var positions = createAugmentedTypedArray(3, numVertices);
	    var normals = createAugmentedTypedArray(3, numVertices);
	    var texcoords = createAugmentedTypedArray(2, numVertices);
	    var indices = createAugmentedTypedArray(3, radialSubdivisions * (verticalSubdivisions + extra) * 2, Uint16Array);

	    var vertsAroundEdge = radialSubdivisions + 1;

	    // The slant of the cone is constant across its surface
	    var slant = Math.atan2(bottomRadius - topRadius, height);
	    var cosSlant = Math.cos(slant);
	    var sinSlant = Math.sin(slant);

	    var start = topCap ? -2 : 0;
	    var end = verticalSubdivisions + (bottomCap ? 2 : 0);

	    for (var yy = start; yy <= end; ++yy) {
	      var v = yy / verticalSubdivisions;
	      var y = height * v;
	      var ringRadius;
	      if (yy < 0) {
	        y = 0;
	        v = 1;
	        ringRadius = bottomRadius;
	      } else if (yy > verticalSubdivisions) {
	        y = height;
	        v = 1;
	        ringRadius = topRadius;
	      } else {
	        ringRadius = bottomRadius + (topRadius - bottomRadius) * (yy / verticalSubdivisions);
	      }
	      if (yy === -2 || yy === verticalSubdivisions + 2) {
	        ringRadius = 0;
	        v = 0;
	      }
	      y -= height / 2;
	      for (var ii = 0; ii < vertsAroundEdge; ++ii) {
	        var sin = Math.sin(ii * Math.PI * 2 / radialSubdivisions);
	        var cos = Math.cos(ii * Math.PI * 2 / radialSubdivisions);
	        positions.push(sin * ringRadius, y, cos * ringRadius);
	        normals.push(yy < 0 || yy > verticalSubdivisions ? 0 : sin * cosSlant, yy < 0 ? -1 : yy > verticalSubdivisions ? 1 : sinSlant, yy < 0 || yy > verticalSubdivisions ? 0 : cos * cosSlant);
	        texcoords.push(ii / radialSubdivisions, 1 - v);
	      }
	    }

	    for (var yy = 0; yy < verticalSubdivisions + extra; ++yy) {
	      // eslint-disable-line
	      for (var ii = 0; ii < radialSubdivisions; ++ii) {
	        // eslint-disable-line
	        indices.push(vertsAroundEdge * (yy + 0) + 0 + ii, vertsAroundEdge * (yy + 0) + 1 + ii, vertsAroundEdge * (yy + 1) + 1 + ii);
	        indices.push(vertsAroundEdge * (yy + 0) + 0 + ii, vertsAroundEdge * (yy + 1) + 1 + ii, vertsAroundEdge * (yy + 1) + 0 + ii);
	      }
	    }

	    return {
	      position: positions,
	      normal: normals,
	      texcoord: texcoords,
	      indices: indices
	    };
	  }

	  /**
	   * Expands RLE data
	   * @param {number[]} rleData data in format of run-length, x, y, z, run-length, x, y, z
	   * @param {number[]} [padding] value to add each entry with.
	   * @return {number[]} the expanded rleData
	   */
	  function expandRLEData(rleData, padding) {
	    padding = padding || [];
	    var data = [];
	    for (var ii = 0; ii < rleData.length; ii += 4) {
	      var runLength = rleData[ii];
	      var element = rleData.slice(ii + 1, ii + 4);
	      element.push.apply(element, padding);
	      for (var jj = 0; jj < runLength; ++jj) {
	        data.push.apply(data, element);
	      }
	    }
	    return data;
	  }

	  /**
	   * Creates 3D 'F' BufferInfo.
	   * An 'F' is useful because you can easily tell which way it is oriented.
	   * The created 'F' has position, normal, texcoord, and color buffers.
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext.
	   * @return {module:twgl.BufferInfo} The created BufferInfo.
	   * @memberOf module:twgl/primitives
	   * @function create3DFBufferInfo
	   */

	  /**
	   * Creates 3D 'F' buffers.
	   * An 'F' is useful because you can easily tell which way it is oriented.
	   * The created 'F' has position, normal, texcoord, and color buffers.
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext.
	   * @return {Object.<string, WebGLBuffer>} The created buffers.
	   * @memberOf module:twgl/primitives
	   * @function create3DFBuffers
	   */

	  /**
	   * Creates 3D 'F' vertices.
	   * An 'F' is useful because you can easily tell which way it is oriented.
	   * The created 'F' has position, normal, texcoord, and color arrays.
	   *
	   * @return {Object.<string, TypedArray>} The created vertices.
	   * @memberOf module:twgl/primitives
	   */
	  function create3DFVertices() {

	    var positions = [
	    // left column front
	    0, 0, 0, 0, 150, 0, 30, 0, 0, 0, 150, 0, 30, 150, 0, 30, 0, 0,

	    // top rung front
	    30, 0, 0, 30, 30, 0, 100, 0, 0, 30, 30, 0, 100, 30, 0, 100, 0, 0,

	    // middle rung front
	    30, 60, 0, 30, 90, 0, 67, 60, 0, 30, 90, 0, 67, 90, 0, 67, 60, 0,

	    // left column back
	    0, 0, 30, 30, 0, 30, 0, 150, 30, 0, 150, 30, 30, 0, 30, 30, 150, 30,

	    // top rung back
	    30, 0, 30, 100, 0, 30, 30, 30, 30, 30, 30, 30, 100, 0, 30, 100, 30, 30,

	    // middle rung back
	    30, 60, 30, 67, 60, 30, 30, 90, 30, 30, 90, 30, 67, 60, 30, 67, 90, 30,

	    // top
	    0, 0, 0, 100, 0, 0, 100, 0, 30, 0, 0, 0, 100, 0, 30, 0, 0, 30,

	    // top rung front
	    100, 0, 0, 100, 30, 0, 100, 30, 30, 100, 0, 0, 100, 30, 30, 100, 0, 30,

	    // under top rung
	    30, 30, 0, 30, 30, 30, 100, 30, 30, 30, 30, 0, 100, 30, 30, 100, 30, 0,

	    // between top rung and middle
	    30, 30, 0, 30, 60, 30, 30, 30, 30, 30, 30, 0, 30, 60, 0, 30, 60, 30,

	    // top of middle rung
	    30, 60, 0, 67, 60, 30, 30, 60, 30, 30, 60, 0, 67, 60, 0, 67, 60, 30,

	    // front of middle rung
	    67, 60, 0, 67, 90, 30, 67, 60, 30, 67, 60, 0, 67, 90, 0, 67, 90, 30,

	    // bottom of middle rung.
	    30, 90, 0, 30, 90, 30, 67, 90, 30, 30, 90, 0, 67, 90, 30, 67, 90, 0,

	    // front of bottom
	    30, 90, 0, 30, 150, 30, 30, 90, 30, 30, 90, 0, 30, 150, 0, 30, 150, 30,

	    // bottom
	    0, 150, 0, 0, 150, 30, 30, 150, 30, 0, 150, 0, 30, 150, 30, 30, 150, 0,

	    // left side
	    0, 0, 0, 0, 0, 30, 0, 150, 30, 0, 0, 0, 0, 150, 30, 0, 150, 0];

	    var texcoords = [
	    // left column front
	    0.22, 0.19, 0.22, 0.79, 0.34, 0.19, 0.22, 0.79, 0.34, 0.79, 0.34, 0.19,

	    // top rung front
	    0.34, 0.19, 0.34, 0.31, 0.62, 0.19, 0.34, 0.31, 0.62, 0.31, 0.62, 0.19,

	    // middle rung front
	    0.34, 0.43, 0.34, 0.55, 0.49, 0.43, 0.34, 0.55, 0.49, 0.55, 0.49, 0.43,

	    // left column back
	    0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1,

	    // top rung back
	    0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1,

	    // middle rung back
	    0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1,

	    // top
	    0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1,

	    // top rung front
	    0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1,

	    // under top rung
	    0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0,

	    // between top rung and middle
	    0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1,

	    // top of middle rung
	    0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1,

	    // front of middle rung
	    0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1,

	    // bottom of middle rung.
	    0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0,

	    // front of bottom
	    0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1,

	    // bottom
	    0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0,

	    // left side
	    0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0];

	    var normals = expandRLEData([
	    // left column front
	    // top rung front
	    // middle rung front
	    18, 0, 0, 1,

	    // left column back
	    // top rung back
	    // middle rung back
	    18, 0, 0, -1,

	    // top
	    6, 0, 1, 0,

	    // top rung front
	    6, 1, 0, 0,

	    // under top rung
	    6, 0, -1, 0,

	    // between top rung and middle
	    6, 1, 0, 0,

	    // top of middle rung
	    6, 0, 1, 0,

	    // front of middle rung
	    6, 1, 0, 0,

	    // bottom of middle rung.
	    6, 0, -1, 0,

	    // front of bottom
	    6, 1, 0, 0,

	    // bottom
	    6, 0, -1, 0,

	    // left side
	    6, -1, 0, 0]);

	    var colors = expandRLEData([
	    // left column front
	    // top rung front
	    // middle rung front
	    18, 200, 70, 120,

	    // left column back
	    // top rung back
	    // middle rung back
	    18, 80, 70, 200,

	    // top
	    6, 70, 200, 210,

	    // top rung front
	    6, 200, 200, 70,

	    // under top rung
	    6, 210, 100, 70,

	    // between top rung and middle
	    6, 210, 160, 70,

	    // top of middle rung
	    6, 70, 180, 210,

	    // front of middle rung
	    6, 100, 70, 210,

	    // bottom of middle rung.
	    6, 76, 210, 100,

	    // front of bottom
	    6, 140, 210, 80,

	    // bottom
	    6, 90, 130, 110,

	    // left side
	    6, 160, 160, 220], [255]);

	    var numVerts = positions.length / 3;

	    var arrays = {
	      position: createAugmentedTypedArray(3, numVerts),
	      texcoord: createAugmentedTypedArray(2, numVerts),
	      normal: createAugmentedTypedArray(3, numVerts),
	      color: createAugmentedTypedArray(4, numVerts, Uint8Array),
	      indices: createAugmentedTypedArray(3, numVerts / 3, Uint16Array)
	    };

	    arrays.position.push(positions);
	    arrays.texcoord.push(texcoords);
	    arrays.normal.push(normals);
	    arrays.color.push(colors);

	    for (var ii = 0; ii < numVerts; ++ii) {
	      arrays.indices.push(ii);
	    }

	    return arrays;
	  }

	  /**
	   * Creates cresent BufferInfo.
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext.
	   * @param {number} verticalRadius The vertical radius of the cresent.
	   * @param {number} outerRadius The outer radius of the cresent.
	   * @param {number} innerRadius The inner radius of the cresent.
	   * @param {number} thickness The thickness of the cresent.
	   * @param {number} subdivisionsDown number of steps around the cresent.
	   * @param {number} subdivisionsThick number of vertically on the cresent.
	   * @param {number} [startOffset] Where to start arc. Default 0.
	   * @param {number} [endOffset] Where to end arg. Default 1.
	   * @return {module:twgl.BufferInfo} The created BufferInfo.
	   * @memberOf module:twgl/primitives
	   * @function createCresentBufferInfo
	   */

	  /**
	   * Creates cresent buffers.
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext.
	   * @param {number} verticalRadius The vertical radius of the cresent.
	   * @param {number} outerRadius The outer radius of the cresent.
	   * @param {number} innerRadius The inner radius of the cresent.
	   * @param {number} thickness The thickness of the cresent.
	   * @param {number} subdivisionsDown number of steps around the cresent.
	   * @param {number} subdivisionsThick number of vertically on the cresent.
	   * @param {number} [startOffset] Where to start arc. Default 0.
	   * @param {number} [endOffset] Where to end arg. Default 1.
	   * @return {Object.<string, WebGLBuffer>} The created buffers.
	   * @memberOf module:twgl/primitives
	   * @function createCresentBuffers
	   */

	  /**
	   * Creates cresent vertices.
	   *
	   * @param {number} verticalRadius The vertical radius of the cresent.
	   * @param {number} outerRadius The outer radius of the cresent.
	   * @param {number} innerRadius The inner radius of the cresent.
	   * @param {number} thickness The thickness of the cresent.
	   * @param {number} subdivisionsDown number of steps around the cresent.
	   * @param {number} subdivisionsThick number of vertically on the cresent.
	   * @param {number} [startOffset] Where to start arc. Default 0.
	   * @param {number} [endOffset] Where to end arg. Default 1.
	   * @return {Object.<string, TypedArray>} The created vertices.
	   * @memberOf module:twgl/primitives
	   */
	  function createCresentVertices(verticalRadius, outerRadius, innerRadius, thickness, subdivisionsDown, startOffset, endOffset) {
	    if (subdivisionsDown <= 0) {
	      throw Error('subdivisionDown must be > 0');
	    }

	    startOffset = startOffset || 0;
	    endOffset = endOffset || 1;

	    var subdivisionsThick = 2;

	    var offsetRange = endOffset - startOffset;
	    var numVertices = (subdivisionsDown + 1) * 2 * (2 + subdivisionsThick);
	    var positions = createAugmentedTypedArray(3, numVertices);
	    var normals = createAugmentedTypedArray(3, numVertices);
	    var texcoords = createAugmentedTypedArray(2, numVertices);

	    function lerp(a, b, s) {
	      return a + (b - a) * s;
	    }

	    function createArc(arcRadius, x, normalMult, normalAdd, uMult, uAdd) {
	      for (var z = 0; z <= subdivisionsDown; z++) {
	        var uBack = x / (subdivisionsThick - 1);
	        var v = z / subdivisionsDown;
	        var xBack = (uBack - 0.5) * 2;
	        var angle = (startOffset + v * offsetRange) * Math.PI;
	        var s = Math.sin(angle);
	        var c = Math.cos(angle);
	        var radius = lerp(verticalRadius, arcRadius, s);
	        var px = xBack * thickness;
	        var py = c * verticalRadius;
	        var pz = s * radius;
	        positions.push(px, py, pz);
	        var n = v3.add(v3.multiply([0, s, c], normalMult), normalAdd);
	        normals.push(n);
	        texcoords.push(uBack * uMult + uAdd, v);
	      }
	    }

	    // Generate the individual vertices in our vertex buffer.
	    for (var x = 0; x < subdivisionsThick; x++) {
	      var uBack = (x / (subdivisionsThick - 1) - 0.5) * 2;
	      createArc(outerRadius, x, [1, 1, 1], [0, 0, 0], 1, 0);
	      createArc(outerRadius, x, [0, 0, 0], [uBack, 0, 0], 0, 0);
	      createArc(innerRadius, x, [1, 1, 1], [0, 0, 0], 1, 0);
	      createArc(innerRadius, x, [0, 0, 0], [uBack, 0, 0], 0, 1);
	    }

	    // Do outer surface.
	    var indices = createAugmentedTypedArray(3, subdivisionsDown * 2 * (2 + subdivisionsThick), Uint16Array);

	    function createSurface(leftArcOffset, rightArcOffset) {
	      for (var z = 0; z < subdivisionsDown; ++z) {
	        // Make triangle 1 of quad.
	        indices.push(leftArcOffset + z + 0, leftArcOffset + z + 1, rightArcOffset + z + 0);

	        // Make triangle 2 of quad.
	        indices.push(leftArcOffset + z + 1, rightArcOffset + z + 1, rightArcOffset + z + 0);
	      }
	    }

	    var numVerticesDown = subdivisionsDown + 1;
	    // front
	    createSurface(numVerticesDown * 0, numVerticesDown * 4);
	    // right
	    createSurface(numVerticesDown * 5, numVerticesDown * 7);
	    // back
	    createSurface(numVerticesDown * 6, numVerticesDown * 2);
	    // left
	    createSurface(numVerticesDown * 3, numVerticesDown * 1);

	    return {
	      position: positions,
	      normal: normals,
	      texcoord: texcoords,
	      indices: indices
	    };
	  }

	  /**
	   * Creates cylinder BufferInfo. The cylinder will be created around the origin
	   * along the y-axis.
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext.
	   * @param {number} radius Radius of cylinder.
	   * @param {number} height Height of cylinder.
	   * @param {number} radialSubdivisions The number of subdivisions around the cylinder.
	   * @param {number} verticalSubdivisions The number of subdivisions down the cylinder.
	   * @param {boolean} [topCap] Create top cap. Default = true.
	   * @param {boolean} [bottomCap] Create bottom cap. Default = true.
	   * @return {module:twgl.BufferInfo} The created BufferInfo.
	   * @memberOf module:twgl/primitives
	   * @function createCylinderBufferInfo
	   */

	  /**
	   * Creates cylinder buffers. The cylinder will be created around the origin
	   * along the y-axis.
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext.
	   * @param {number} radius Radius of cylinder.
	   * @param {number} height Height of cylinder.
	   * @param {number} radialSubdivisions The number of subdivisions around the cylinder.
	   * @param {number} verticalSubdivisions The number of subdivisions down the cylinder.
	   * @param {boolean} [topCap] Create top cap. Default = true.
	   * @param {boolean} [bottomCap] Create bottom cap. Default = true.
	   * @return {Object.<string, WebGLBuffer>} The created buffers.
	   * @memberOf module:twgl/primitives
	   * @function createCylinderBuffers
	   */

	  /**
	   * Creates cylinder vertices. The cylinder will be created around the origin
	   * along the y-axis.
	   *
	   * @param {number} radius Radius of cylinder.
	   * @param {number} height Height of cylinder.
	   * @param {number} radialSubdivisions The number of subdivisions around the cylinder.
	   * @param {number} verticalSubdivisions The number of subdivisions down the cylinder.
	   * @param {boolean} [topCap] Create top cap. Default = true.
	   * @param {boolean} [bottomCap] Create bottom cap. Default = true.
	   * @return {Object.<string, TypedArray>} The created vertices.
	   * @memberOf module:twgl/primitives
	   */
	  function createCylinderVertices(radius, height, radialSubdivisions, verticalSubdivisions, topCap, bottomCap) {
	    return createTruncatedConeVertices(radius, radius, height, radialSubdivisions, verticalSubdivisions, topCap, bottomCap);
	  }

	  /**
	   * Creates BufferInfo for a torus
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext.
	   * @param {number} radius radius of center of torus circle.
	   * @param {number} thickness radius of torus ring.
	   * @param {number} radialSubdivisions The number of subdivisions around the torus.
	   * @param {number} bodySubdivisions The number of subdivisions around the body torus.
	   * @param {boolean} [startAngle] start angle in radians. Default = 0.
	   * @param {boolean} [endAngle] end angle in radians. Default = Math.PI * 2.
	   * @return {module:twgl.BufferInfo} The created BufferInfo.
	   * @memberOf module:twgl/primitives
	   * @function createTorusBufferInfo
	   */

	  /**
	   * Creates buffers for a torus
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext.
	   * @param {number} radius radius of center of torus circle.
	   * @param {number} thickness radius of torus ring.
	   * @param {number} radialSubdivisions The number of subdivisions around the torus.
	   * @param {number} bodySubdivisions The number of subdivisions around the body torus.
	   * @param {boolean} [startAngle] start angle in radians. Default = 0.
	   * @param {boolean} [endAngle] end angle in radians. Default = Math.PI * 2.
	   * @return {Object.<string, WebGLBuffer>} The created buffers.
	   * @memberOf module:twgl/primitives
	   * @function createTorusBuffers
	   */

	  /**
	   * Creates vertices for a torus
	   *
	   * @param {number} radius radius of center of torus circle.
	   * @param {number} thickness radius of torus ring.
	   * @param {number} radialSubdivisions The number of subdivisions around the torus.
	   * @param {number} bodySubdivisions The number of subdivisions around the body torus.
	   * @param {boolean} [startAngle] start angle in radians. Default = 0.
	   * @param {boolean} [endAngle] end angle in radians. Default = Math.PI * 2.
	   * @return {Object.<string, TypedArray>} The created vertices.
	   * @memberOf module:twgl/primitives
	   */
	  function createTorusVertices(radius, thickness, radialSubdivisions, bodySubdivisions, startAngle, endAngle) {
	    if (radialSubdivisions < 3) {
	      throw Error('radialSubdivisions must be 3 or greater');
	    }

	    if (bodySubdivisions < 3) {
	      throw Error('verticalSubdivisions must be 3 or greater');
	    }

	    startAngle = startAngle || 0;
	    endAngle = endAngle || Math.PI * 2;
	    var range = endAngle - startAngle;

	    var radialParts = radialSubdivisions + 1;
	    var bodyParts = bodySubdivisions + 1;
	    var numVertices = radialParts * bodyParts;
	    var positions = createAugmentedTypedArray(3, numVertices);
	    var normals = createAugmentedTypedArray(3, numVertices);
	    var texcoords = createAugmentedTypedArray(2, numVertices);
	    var indices = createAugmentedTypedArray(3, radialSubdivisions * bodySubdivisions * 2, Uint16Array);

	    for (var slice = 0; slice < bodyParts; ++slice) {
	      var v = slice / bodySubdivisions;
	      var sliceAngle = v * Math.PI * 2;
	      var sliceSin = Math.sin(sliceAngle);
	      var ringRadius = radius + sliceSin * thickness;
	      var ny = Math.cos(sliceAngle);
	      var y = ny * thickness;
	      for (var ring = 0; ring < radialParts; ++ring) {
	        var u = ring / radialSubdivisions;
	        var ringAngle = startAngle + u * range;
	        var xSin = Math.sin(ringAngle);
	        var zCos = Math.cos(ringAngle);
	        var x = xSin * ringRadius;
	        var z = zCos * ringRadius;
	        var nx = xSin * sliceSin;
	        var nz = zCos * sliceSin;
	        positions.push(x, y, z);
	        normals.push(nx, ny, nz);
	        texcoords.push(u, 1 - v);
	      }
	    }

	    for (var slice = 0; slice < bodySubdivisions; ++slice) {
	      // eslint-disable-line
	      for (var ring = 0; ring < radialSubdivisions; ++ring) {
	        // eslint-disable-line
	        var nextRingIndex = 1 + ring;
	        var nextSliceIndex = 1 + slice;
	        indices.push(radialParts * slice + ring, radialParts * nextSliceIndex + ring, radialParts * slice + nextRingIndex);
	        indices.push(radialParts * nextSliceIndex + ring, radialParts * nextSliceIndex + nextRingIndex, radialParts * slice + nextRingIndex);
	      }
	    }

	    return {
	      position: positions,
	      normal: normals,
	      texcoord: texcoords,
	      indices: indices
	    };
	  }

	  /**
	   * Creates a disc BufferInfo. The disc will be in the xz plane, centered at
	   * the origin. When creating, at least 3 divisions, or pie
	   * pieces, need to be specified, otherwise the triangles making
	   * up the disc will be degenerate. You can also specify the
	   * number of radial pieces `stacks`. A value of 1 for
	   * stacks will give you a simple disc of pie pieces.  If you
	   * want to create an annulus you can set `innerRadius` to a
	   * value > 0. Finally, `stackPower` allows you to have the widths
	   * increase or decrease as you move away from the center. This
	   * is particularly useful when using the disc as a ground plane
	   * with a fixed camera such that you don't need the resolution
	   * of small triangles near the perimeter. For example, a value
	   * of 2 will produce stacks whose ouside radius increases with
	   * the square of the stack index. A value of 1 will give uniform
	   * stacks.
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext.
	   * @param {number} radius Radius of the ground plane.
	   * @param {number} divisions Number of triangles in the ground plane (at least 3).
	   * @param {number} [stacks] Number of radial divisions (default=1).
	   * @param {number} [innerRadius] Default 0.
	   * @param {number} [stackPower] Power to raise stack size to for decreasing width.
	   * @return {module:twgl.BufferInfo} The created BufferInfo.
	   * @memberOf module:twgl/primitives
	   * @function createDiscBufferInfo
	   */

	  /**
	   * Creates disc buffers. The disc will be in the xz plane, centered at
	   * the origin. When creating, at least 3 divisions, or pie
	   * pieces, need to be specified, otherwise the triangles making
	   * up the disc will be degenerate. You can also specify the
	   * number of radial pieces `stacks`. A value of 1 for
	   * stacks will give you a simple disc of pie pieces.  If you
	   * want to create an annulus you can set `innerRadius` to a
	   * value > 0. Finally, `stackPower` allows you to have the widths
	   * increase or decrease as you move away from the center. This
	   * is particularly useful when using the disc as a ground plane
	   * with a fixed camera such that you don't need the resolution
	   * of small triangles near the perimeter. For example, a value
	   * of 2 will produce stacks whose ouside radius increases with
	   * the square of the stack index. A value of 1 will give uniform
	   * stacks.
	   *
	   * @param {WebGLRenderingContext} gl The WebGLRenderingContext.
	   * @param {number} radius Radius of the ground plane.
	   * @param {number} divisions Number of triangles in the ground plane (at least 3).
	   * @param {number} [stacks] Number of radial divisions (default=1).
	   * @param {number} [innerRadius] Default 0.
	   * @param {number} [stackPower] Power to raise stack size to for decreasing width.
	   * @return {Object.<string, WebGLBuffer>} The created buffers.
	   * @memberOf module:twgl/primitives
	   * @function createDiscBuffers
	   */

	  /**
	   * Creates disc vertices. The disc will be in the xz plane, centered at
	   * the origin. When creating, at least 3 divisions, or pie
	   * pieces, need to be specified, otherwise the triangles making
	   * up the disc will be degenerate. You can also specify the
	   * number of radial pieces `stacks`. A value of 1 for
	   * stacks will give you a simple disc of pie pieces.  If you
	   * want to create an annulus you can set `innerRadius` to a
	   * value > 0. Finally, `stackPower` allows you to have the widths
	   * increase or decrease as you move away from the center. This
	   * is particularly useful when using the disc as a ground plane
	   * with a fixed camera such that you don't need the resolution
	   * of small triangles near the perimeter. For example, a value
	   * of 2 will produce stacks whose ouside radius increases with
	   * the square of the stack index. A value of 1 will give uniform
	   * stacks.
	   *
	   * @param {number} radius Radius of the ground plane.
	   * @param {number} divisions Number of triangles in the ground plane (at least 3).
	   * @param {number} [stacks] Number of radial divisions (default=1).
	   * @param {number} [innerRadius] Default 0.
	   * @param {number} [stackPower] Power to raise stack size to for decreasing width.
	   * @return {Object.<string, TypedArray>} The created vertices.
	   * @memberOf module:twgl/primitives
	   */
	  function createDiscVertices(radius, divisions, stacks, innerRadius, stackPower) {
	    if (divisions < 3) {
	      throw Error('divisions must be at least 3');
	    }

	    stacks = stacks ? stacks : 1;
	    stackPower = stackPower ? stackPower : 1;
	    innerRadius = innerRadius ? innerRadius : 0;

	    // Note: We don't share the center vertex because that would
	    // mess up texture coordinates.
	    var numVertices = (divisions + 1) * (stacks + 1);

	    var positions = createAugmentedTypedArray(3, numVertices);
	    var normals = createAugmentedTypedArray(3, numVertices);
	    var texcoords = createAugmentedTypedArray(2, numVertices);
	    var indices = createAugmentedTypedArray(3, stacks * divisions * 2, Uint16Array);

	    var firstIndex = 0;
	    var radiusSpan = radius - innerRadius;
	    var pointsPerStack = divisions + 1;

	    // Build the disk one stack at a time.
	    for (var stack = 0; stack <= stacks; ++stack) {
	      var stackRadius = innerRadius + radiusSpan * Math.pow(stack / stacks, stackPower);

	      for (var i = 0; i <= divisions; ++i) {
	        var theta = 2.0 * Math.PI * i / divisions;
	        var x = stackRadius * Math.cos(theta);
	        var z = stackRadius * Math.sin(theta);

	        positions.push(x, 0, z);
	        normals.push(0, 1, 0);
	        texcoords.push(1 - i / divisions, stack / stacks);
	        if (stack > 0 && i !== divisions) {
	          // a, b, c and d are the indices of the vertices of a quad.  unless
	          // the current stack is the one closest to the center, in which case
	          // the vertices a and b connect to the center vertex.
	          var a = firstIndex + (i + 1);
	          var b = firstIndex + i;
	          var c = firstIndex + i - pointsPerStack;
	          var d = firstIndex + (i + 1) - pointsPerStack;

	          // Make a quad of the vertices a, b, c, d.
	          indices.push(a, b, c);
	          indices.push(a, c, d);
	        }
	      }

	      firstIndex += divisions + 1;
	    }

	    return {
	      position: positions,
	      normal: normals,
	      texcoord: texcoords,
	      indices: indices
	    };
	  }

	  /**
	   * creates a random integer between 0 and range - 1 inclusive.
	   * @param {number} range
	   * @return {number} random value between 0 and range - 1 inclusive.
	   */
	  function randInt(range) {
	    return Math.random() * range | 0;
	  }

	  /**
	   * Used to supply random colors
	   * @callback RandomColorFunc
	   * @param {number} ndx index of triangle/quad if unindexed or index of vertex if indexed
	   * @param {number} channel 0 = red, 1 = green, 2 = blue, 3 = alpha
	   * @return {number} a number from 0 to 255
	   * @memberOf module:twgl/primitives
	   */

	  /**
	   * @typedef {Object} RandomVerticesOptions
	   * @property {number} [vertsPerColor] Defaults to 3 for non-indexed vertices
	   * @property {module:twgl/primitives.RandomColorFunc} [rand] A function to generate random numbers
	   * @memberOf module:twgl/primitives
	   */

	  /**
	   * Creates an augmentedTypedArray of random vertex colors.
	   * If the vertices are indexed (have an indices array) then will
	   * just make random colors. Otherwise assumes they are triangles
	   * and makes one random color for every 3 vertices.
	   * @param {Object.<string, augmentedTypedArray>} vertices Vertices as returned from one of the createXXXVertices functions.
	   * @param {module:twgl/primitives.RandomVerticesOptions} [options] options.
	   * @return {Object.<string, augmentedTypedArray>} same vertices as passed in with `color` added.
	   * @memberOf module:twgl/primitives
	   */
	  function makeRandomVertexColors(vertices, options) {
	    options = options || {};
	    var numElements = vertices.position.numElements;
	    var vcolors = createAugmentedTypedArray(4, numElements, Uint8Array);
	    var rand = options.rand || function (ndx, channel) {
	      return channel < 3 ? randInt(256) : 255;
	    };
	    vertices.color = vcolors;
	    if (vertices.indices) {
	      // just make random colors if index
	      for (var ii = 0; ii < numElements; ++ii) {
	        vcolors.push(rand(ii, 0), rand(ii, 1), rand(ii, 2), rand(ii, 3));
	      }
	    } else {
	      // make random colors per triangle
	      var numVertsPerColor = options.vertsPerColor || 3;
	      var numSets = numElements / numVertsPerColor;
	      for (var ii = 0; ii < numSets; ++ii) {
	        // eslint-disable-line
	        var color = [rand(ii, 0), rand(ii, 1), rand(ii, 2), rand(ii, 3)];
	        for (var jj = 0; jj < numVertsPerColor; ++jj) {
	          vcolors.push(color);
	        }
	      }
	    }
	    return vertices;
	  }

	  /**
	   * creates a function that calls fn to create vertices and then
	   * creates a buffers for them
	   */
	  function createBufferFunc(fn) {
	    return function (gl) {
	      var arrays = fn.apply(this, Array.prototype.slice.call(arguments, 1));
	      return attributes.createBuffersFromArrays(gl, arrays);
	    };
	  }

	  /**
	   * creates a function that calls fn to create vertices and then
	   * creates a bufferInfo object for them
	   */
	  function createBufferInfoFunc(fn) {
	    return function (gl) {
	      var arrays = fn.apply(null, Array.prototype.slice.call(arguments, 1));
	      return attributes.createBufferInfoFromArrays(gl, arrays);
	    };
	  }

	  var arraySpecPropertyNames = ["numComponents", "size", "type", "normalize", "stride", "offset", "attrib", "name", "attribName"];

	  /**
	   * Copy elements from one array to another
	   *
	   * @param {Array|TypedArray} src source array
	   * @param {Array|TypedArray} dst dest array
	   * @param {number} dstNdx index in dest to copy src
	   * @param {number} [offset] offset to add to copied values
	   */
	  function copyElements(src, dst, dstNdx, offset) {
	    offset = offset || 0;
	    var length = src.length;
	    for (var ii = 0; ii < length; ++ii) {
	      dst[dstNdx + ii] = src[ii] + offset;
	    }
	  }

	  /**
	   * Creates an array of the same time
	   *
	   * @param {(number[]|ArrayBuffer|module:twgl.FullArraySpec)} srcArray array who's type to copy
	   * @param {number} length size of new array
	   * @return {(number[]|ArrayBuffer|module:twgl.FullArraySpec)} array with same type as srcArray
	   */
	  function createArrayOfSameType(srcArray, length) {
	    var arraySrc = getArray(srcArray);
	    var newArray = new arraySrc.constructor(length);
	    var newArraySpec = newArray;
	    // If it appears to have been augmented make new one augemented
	    if (arraySrc.numComponents && arraySrc.numElements) {
	      augmentTypedArray(newArray, arraySrc.numComponents);
	    }
	    // If it was a fullspec make new one a fullspec
	    if (srcArray.data) {
	      newArraySpec = {
	        data: newArray
	      };
	      utils.copyNamedProperties(arraySpecPropertyNames, srcArray, newArraySpec);
	    }
	    return newArraySpec;
	  }

	  /**
	   * Concatinates sets of vertices
	   *
	   * Assumes the vertices match in composition. For example
	   * if one set of vertices has positions, normals, and indices
	   * all sets of vertices must have positions, normals, and indices
	   * and of the same type.
	   *
	   * Example:
	   *
	   *      var cubeVertices = twgl.primtiives.createCubeVertices(2);
	   *      var sphereVertices = twgl.primitives.createSphereVertices(1, 10, 10);
	   *      // move the sphere 2 units up
	   *      twgl.primitives.reorientVertices(
	   *          sphereVertices, twgl.m4.translation([0, 2, 0]));
	   *      // merge the sphere with the cube
	   *      var cubeSphereVertices = twgl.primitives.concatVertices(
	   *          [cubeVertices, sphereVertices]);
	   *      // turn them into WebGL buffers and attrib data
	   *      var bufferInfo = twgl.createBufferInfoFromArrays(gl, cubeSphereVertices);
	   *
	   * @param {module:twgl.Arrays[]} arrays Array of arrays of vertices
	   * @return {module:twgl.Arrays} The concatinated vertices.
	   * @memberOf module:twgl/primitives
	   */
	  function concatVertices(arrayOfArrays) {
	    var names = {};
	    var baseName;
	    // get names of all arrays.
	    // and numElements for each set of vertices
	    for (var ii = 0; ii < arrayOfArrays.length; ++ii) {
	      var arrays = arrayOfArrays[ii];
	      Object.keys(arrays).forEach(function (name) {
	        // eslint-disable-line
	        if (!names[name]) {
	          names[name] = [];
	        }
	        if (!baseName && name !== 'indices') {
	          baseName = name;
	        }
	        var arrayInfo = arrays[name];
	        var numComponents = getNumComponents(arrayInfo, name);
	        var array = getArray(arrayInfo);
	        var numElements = array.length / numComponents;
	        names[name].push(numElements);
	      });
	    }

	    // compute length of combined array
	    // and return one for reference
	    function getLengthOfCombinedArrays(name) {
	      var length = 0;
	      var arraySpec;
	      for (var ii = 0; ii < arrayOfArrays.length; ++ii) {
	        var arrays = arrayOfArrays[ii];
	        var arrayInfo = arrays[name];
	        var array = getArray(arrayInfo);
	        length += array.length;
	        if (!arraySpec || arrayInfo.data) {
	          arraySpec = arrayInfo;
	        }
	      }
	      return {
	        length: length,
	        spec: arraySpec
	      };
	    }

	    function copyArraysToNewArray(name, base, newArray) {
	      var baseIndex = 0;
	      var offset = 0;
	      for (var ii = 0; ii < arrayOfArrays.length; ++ii) {
	        var arrays = arrayOfArrays[ii];
	        var arrayInfo = arrays[name];
	        var array = getArray(arrayInfo);
	        if (name === 'indices') {
	          copyElements(array, newArray, offset, baseIndex);
	          baseIndex += base[ii];
	        } else {
	          copyElements(array, newArray, offset);
	        }
	        offset += array.length;
	      }
	    }

	    var base = names[baseName];

	    var newArrays = {};
	    Object.keys(names).forEach(function (name) {
	      var info = getLengthOfCombinedArrays(name);
	      var newArraySpec = createArrayOfSameType(info.spec, info.length);
	      copyArraysToNewArray(name, base, getArray(newArraySpec));
	      newArrays[name] = newArraySpec;
	    });
	    return newArrays;
	  }

	  /**
	   * Creates a duplicate set of vertices
	   *
	   * This is useful for calling reorientVertices when you
	   * also want to keep the original available
	   *
	   * @param {module:twgl.Arrays} arrays of vertices
	   * @return {module:twgl.Arrays} The dupilicated vertices.
	   * @memberOf module:twgl/primitives
	   */
	  function duplicateVertices(arrays) {
	    var newArrays = {};
	    Object.keys(arrays).forEach(function (name) {
	      var arraySpec = arrays[name];
	      var srcArray = getArray(arraySpec);
	      var newArraySpec = createArrayOfSameType(arraySpec, srcArray.length);
	      copyElements(srcArray, getArray(newArraySpec), 0);
	      newArrays[name] = newArraySpec;
	    });
	    return newArrays;
	  }

	  // Using quotes prevents Uglify from changing the names.
	  // No speed diff AFAICT.
	  return {
	    "create3DFBufferInfo": createBufferInfoFunc(create3DFVertices),
	    "create3DFBuffers": createBufferFunc(create3DFVertices),
	    "create3DFVertices": create3DFVertices,
	    "createAugmentedTypedArray": createAugmentedTypedArray,
	    "createCubeBufferInfo": createBufferInfoFunc(createCubeVertices),
	    "createCubeBuffers": createBufferFunc(createCubeVertices),
	    "createCubeVertices": createCubeVertices,
	    "createPlaneBufferInfo": createBufferInfoFunc(createPlaneVertices),
	    "createPlaneBuffers": createBufferFunc(createPlaneVertices),
	    "createPlaneVertices": createPlaneVertices,
	    "createSphereBufferInfo": createBufferInfoFunc(createSphereVertices),
	    "createSphereBuffers": createBufferFunc(createSphereVertices),
	    "createSphereVertices": createSphereVertices,
	    "createTruncatedConeBufferInfo": createBufferInfoFunc(createTruncatedConeVertices),
	    "createTruncatedConeBuffers": createBufferFunc(createTruncatedConeVertices),
	    "createTruncatedConeVertices": createTruncatedConeVertices,
	    "createXYQuadBufferInfo": createBufferInfoFunc(createXYQuadVertices),
	    "createXYQuadBuffers": createBufferFunc(createXYQuadVertices),
	    "createXYQuadVertices": createXYQuadVertices,
	    "createCresentBufferInfo": createBufferInfoFunc(createCresentVertices),
	    "createCresentBuffers": createBufferFunc(createCresentVertices),
	    "createCresentVertices": createCresentVertices,
	    "createCylinderBufferInfo": createBufferInfoFunc(createCylinderVertices),
	    "createCylinderBuffers": createBufferFunc(createCylinderVertices),
	    "createCylinderVertices": createCylinderVertices,
	    "createTorusBufferInfo": createBufferInfoFunc(createTorusVertices),
	    "createTorusBuffers": createBufferFunc(createTorusVertices),
	    "createTorusVertices": createTorusVertices,
	    "createDiscBufferInfo": createBufferInfoFunc(createDiscVertices),
	    "createDiscBuffers": createBufferFunc(createDiscVertices),
	    "createDiscVertices": createDiscVertices,
	    "deindexVertices": deindexVertices,
	    "flattenNormals": flattenNormals,
	    "makeRandomVertexColors": makeRandomVertexColors,
	    "reorientDirections": reorientDirections,
	    "reorientNormals": reorientNormals,
	    "reorientPositions": reorientPositions,
	    "reorientVertices": reorientVertices,
	    "concatVertices": concatVertices,
	    "duplicateVertices": duplicateVertices
	  };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }
/******/ ])
});
;