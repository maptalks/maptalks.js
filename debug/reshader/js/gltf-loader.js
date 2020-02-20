/*!
 * @maptalks/gltf-loader v0.2.0
 * LICENSE : UNLICENSED
 * (c) 2016-2020 maptalks.org
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = global || self, factory(global.gltf = {}));
}(this, function (exports) { 'use strict';

	var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var zousanMin = createCommonjsModule(function (module) {
	!function(i){var c,s,u="fulfilled",f="undefined",a=function(){var e=[],n=0;function o(){for(;e.length-n;){try{e[n]();}catch(t){i.console&&i.console.error(t);}e[n++]=s,1024==n&&(e.splice(0,1024),n=0);}}var r=function(){if(typeof MutationObserver===f)return typeof process!==f&&"function"==typeof process.nextTick?function(){process.nextTick(o);}:typeof setImmediate!==f?function(){setImmediate(o);}:function(){setTimeout(o,0);};var t=document.createElement("div");return new MutationObserver(o).observe(t,{attributes:!0}),function(){t.setAttribute("a",0);}}();return function(t){e.push(t),e.length-n==1&&r();}}();function l(t){if(!(this instanceof l))throw new TypeError("Zousan must be created with the new keyword");if("function"==typeof t){var e=this;try{t(function(t){e.resolve(t);},function(t){e.reject(t);});}catch(t){e.reject(t);}}else if(0<arguments.length)throw new TypeError("Zousan resolver "+t+" is not a function")}function h(e,t){if("function"==typeof e.y)try{var n=e.y.call(s,t);e.p.resolve(n);}catch(t){e.p.reject(t);}else e.p.resolve(t);}function v(e,t){if("function"==typeof e.n)try{var n=e.n.call(s,t);e.p.resolve(n);}catch(t){e.p.reject(t);}else e.p.reject(t);}l.prototype={resolve:function(n){if(this.state===c){if(n===this)return this.reject(new TypeError("Attempt to resolve promise with self"));var o=this;if(n&&("function"==typeof n||"object"==typeof n))try{var e=!0,t=n.then;if("function"==typeof t)return void t.call(n,function(t){e&&(e=!1,o.resolve(t));},function(t){e&&(e=!1,o.reject(t));})}catch(t){return void(e&&this.reject(t))}this.state=u,this.v=n,o.c&&a(function(){for(var t=0,e=o.c.length;t<e;t++)h(o.c[t],n);});}},reject:function(n){if(this.state===c){var t=this;this.state="rejected",this.v=n;var o=this.c;a(o?function(){for(var t=0,e=o.length;t<e;t++)v(o[t],n);}:function(){t.handled||!l.suppressUncaughtRejectionError&&i.console&&l.warn("You upset Zousan. Please catch rejections: ",n,n?n.stack:null);});}},then:function(t,e){var n=new l,o={y:t,n:e,p:n};if(this.state===c)this.c?this.c.push(o):this.c=[o];else{var r=this.state,i=this.v;this.handled=!0,a(function(){r===u?h(o,i):v(o,i);});}return n},catch:function(t){return this.then(null,t)},finally:function(t){return this.then(t,t)},timeout:function(t,o){o=o||"Timeout";var r=this;return new l(function(e,n){setTimeout(function(){n(Error(o));},t),r.then(function(t){e(t);},function(t){n(t);});})}},l.resolve=function(t){var e=new l;return e.resolve(t),e},l.reject=function(t){var e=new l;return e.c=[],e.reject(t),e},l.all=function(n){var o=[],r=0,i=new l;function t(t,e){t&&"function"==typeof t.then||(t=l.resolve(t)),t.then(function(t){o[e]=t,++r==n.length&&i.resolve(o);},function(t){i.reject(t);});}for(var e=0;e<n.length;e++)t(n[e],e);return n.length||i.resolve(o),i},l.warn=console.warn,module.exports&&(module.exports=l),i.define&&i.define.amd&&i.define([],function(){return l}),(i.Zousan=l).soon=a;}("undefined"!=typeof commonjsGlobal?commonjsGlobal:commonjsGlobal);
	});

	var promise;

	if (typeof Promise !== 'undefined') {
	  promise = Promise;
	} else {
	  promise = zousanMin;
	}

	var Promise$1 = promise;

	var Ajax = {
	  get: function get(url, options) {
	    var client = Ajax._getClient();

	    var promise = new Promise$1(function (resolve, reject) {
	      client.open('GET', url, true);

	      if (options) {
	        for (var k in options.headers) {
	          client.setRequestHeader(k, options.headers[k]);
	        }

	        client.withCredentials = options.credentials === 'include';

	        if (options['responseType']) {
	          client.responseType = options['responseType'];
	        }
	      }

	      client.onreadystatechange = Ajax._wrapCallback(client, function (err, data) {
	        if (err) {
	          reject(err);
	          return;
	        }

	        resolve(data);
	      });
	      client.send(null);
	    });
	    promise.xhr = client;
	    return promise;
	  },
	  _wrapCallback: function _wrapCallback(client, cb) {
	    return function () {
	      if (client.readyState === 4) {
	        if (client.status === 200) {
	          if (client.responseType === 'arraybuffer') {
	            var response = client.response;

	            if (response.byteLength === 0) {
	              cb(new Error('http status 200 returned without content.'));
	            } else {
	              cb(null, {
	                data: client.response,
	                cacheControl: client.getResponseHeader('Cache-Control'),
	                expires: client.getResponseHeader('Expires'),
	                contentType: client.getResponseHeader('Content-Type')
	              });
	            }
	          } else {
	            cb(null, client.responseText);
	          }
	        } else {
	          if (client.status === 0) {
	            return;
	          }

	          cb(new Error(client.statusText + ',' + client.status));
	        }
	      }
	    };
	  },
	  _getClient: function _getClient() {
	    var client;

	    try {
	      client = new XMLHttpRequest();
	    } catch (e) {
	      try {
	        client = new ActiveXObject('Msxml2.XMLHTTP');
	      } catch (e) {
	        try {
	          client = new ActiveXObject('Microsoft.XMLHTTP');
	        } catch (e) {}
	      }
	    }

	    return client;
	  },
	  getArrayBuffer: function getArrayBuffer(url, options) {
	    if (!options) {
	      options = {};
	    }

	    options['responseType'] = 'arraybuffer';
	    return Ajax.get(url, options);
	  }
	};

	Ajax.getJSON = function (url, options) {
	  var promise = Ajax.get(url, options);
	  var p = promise.then(function (data) {
	    return data ? JSON.parse(data) : null;
	  });
	  p.xhr = promise.xhr;
	  return p;
	};

	function isNil(obj) {
	  return obj == null;
	}
	function defined(obj) {
	  return !isNil(obj);
	}
	function isNumber(obj) {
	  return typeof obj === 'number' && isFinite(obj);
	}
	function isString(obj) {
	  if (isNil(obj)) {
	    return false;
	  }

	  return typeof obj === 'string' || obj.constructor !== null && obj.constructor === String;
	}
	function extend(dest) {
	  for (var i = 1; i < arguments.length; i++) {
	    var src = arguments[i];

	    for (var k in src) {
	      dest[k] = src[k];
	    }
	  }

	  return dest;
	}
	function lerp(out, a, b, t) {
	  for (var i = 0; i < out.length; i++) {
	    out[i] = a[i] + t * (b[i] - a[i]);
	  }

	  return out;
	}
	function set(out, input) {
	  for (var i = 0; i < out.length; i++) {
	    out[i] = input[i];
	  }

	  return out;
	}

	var V1 = function () {
	  function V1(rootPath, gltf) {
	    this.rootPath = rootPath;
	    this.gltf = gltf;
	  }

	  var _proto = V1.prototype;

	  _proto.iterate = function iterate(cb, propertyName) {
	    var properties = this.gltf[propertyName];

	    if (!properties) {
	      return;
	    }

	    var index = 0;

	    for (var p in properties) {
	      cb(p, properties[p], index++);
	    }
	  };

	  _proto.createNode = function createNode(nodeJSON, meshes) {
	    var node = {};
	    if (defined(nodeJSON.name)) node.name = nodeJSON.name;
	    if (defined(nodeJSON.children)) node.children = nodeJSON.children;
	    if (defined(nodeJSON.jointName)) node.jointName = nodeJSON.jointName;
	    if (defined(nodeJSON.matrix)) node.matrix = nodeJSON.matrix;
	    if (defined(nodeJSON.rotation)) node.rotation = nodeJSON.rotation;
	    if (defined(nodeJSON.scale)) node.scale = nodeJSON.scale;
	    if (defined(nodeJSON.translation)) node.translation = nodeJSON.translation;
	    if (defined(nodeJSON.extras)) node.extras = nodeJSON.extras;

	    if (defined(nodeJSON.meshes)) {
	      node.meshes = nodeJSON.meshes.map(function (m) {
	        return meshes[m];
	      });
	    }

	    return node;
	  };

	  _proto.getBaseColorTexture = function getBaseColorTexture(index) {
	    var material = this.gltf.materials[index];
	    var tech, texId;

	    if (material['instanceTechnique'] && material['instanceTechnique'].values) {
	      tech = material['instanceTechnique'];
	      texId = tech.values['diffuse'];
	    } else {
	      tech = material;
	      texId = tech.values['tex'] || tech.values['diffuse'];
	    }

	    if (texId === undefined || this.gltf.textures === undefined) {
	      return null;
	    }

	    var texture = this.gltf.textures[texId];

	    if (!texture) {
	      return null;
	    }

	    var sampler = this.gltf.samplers[texture.sampler];
	    var info = {
	      format: texture.format || 6408,
	      internalFormat: texture.internalFormat || 6408,
	      type: texture.type || 5121,
	      sampler: sampler,
	      source: this.gltf.images[texture.source]
	    };
	    return info;
	  };

	  _proto.getMaterial = function getMaterial() {
	    return null;
	  };

	  _proto.getAnimations = function getAnimations() {
	    return null;
	  };

	  return V1;
	}();

	var TYPES = ['SCALAR', 1, 'VEC2', 2, 'VEC3', 3, 'VEC4', 4, 'MAT2', 4, 'MAT3', 9, 'MAT4', 16];

	var Accessor = function () {
	  function Accessor(rootPath, gltf, glbBuffer) {
	    this.rootPath = rootPath;
	    this.gltf = gltf;
	    this.glbBuffer = glbBuffer;
	    this.buffers = {};
	    this.requests = {};
	  }

	  var _proto = Accessor.prototype;

	  _proto._requestData = function _requestData(name, accessorName) {
	    var _this = this;

	    var gltf = this.gltf,
	        accessor = gltf.accessors[accessorName];
	    var bufferView = gltf.bufferViews[accessor.bufferView],
	        buffer = gltf.buffers[bufferView.buffer];

	    if (bufferView.buffer === 'binary_glTF' || bufferView.buffer === 'KHR_binary_glTF' || !buffer.uri) {
	      var _this$_toTypedArray = this._toTypedArray(accessorName, this.glbBuffer.buffer, this.glbBuffer.byteOffset),
	          array = _this$_toTypedArray.array,
	          itemSize = _this$_toTypedArray.itemSize;

	      return Promise$1.resolve({
	        name: name,
	        accessorName: accessorName,
	        array: array,
	        itemSize: itemSize
	      });
	    } else {
	      var bin = buffer.uri;
	      var url = buffer.uri.indexOf('data:application/') === 0 ? buffer.uri : this.rootPath + '/' + bin;

	      if (this.requests[url]) {
	        return this.requests[url].then(function () {
	          var _this$_toTypedArray2 = _this._toTypedArray(accessorName, _this.buffers[url]),
	              array = _this$_toTypedArray2.array,
	              itemSize = _this$_toTypedArray2.itemSize;

	          return {
	            name: name,
	            accessorName: accessorName,
	            array: array,
	            itemSize: itemSize
	          };
	        });
	      }

	      var promise = this.requests[url] = Ajax.getArrayBuffer(url, null).then(function (response) {
	        var buffer = response.data;
	        _this.buffers[url] = buffer;

	        var _this$_toTypedArray3 = _this._toTypedArray(accessorName, buffer),
	            array = _this$_toTypedArray3.array,
	            itemSize = _this$_toTypedArray3.itemSize;

	        return {
	          name: name,
	          accessorName: accessorName,
	          array: array,
	          itemSize: itemSize
	        };
	      });
	      return promise;
	    }
	  };

	  _proto._toTypedArray = function _toTypedArray(accessorName, arrayBuffer, offset) {
	    if (offset === void 0) {
	      offset = 0;
	    }

	    var gltf = this.gltf;
	    var accessor = gltf.accessors[accessorName];
	    var bufferView = gltf.bufferViews[accessor.bufferView];
	    var start = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0) + offset;

	    var itemSize = this._getTypeItemSize(accessor.type);

	    var ArrayCtor = this._getArrayCtor(accessor.componentType);

	    var byteStride = accessor.byteStride;

	    if (byteStride && byteStride !== itemSize * ArrayCtor.BYTES_PER_ELEMENT) {
	      console.warn('GLTF interleaved accessors not supported');
	      return new ArrayCtor([]);
	    }

	    if (start % ArrayCtor.BYTES_PER_ELEMENT !== 0) {
	      arrayBuffer = arrayBuffer.slice(start, start + accessor.count * itemSize * ArrayCtor.BYTES_PER_ELEMENT);
	      start = 0;
	    }

	    return {
	      array: new ArrayCtor(arrayBuffer, start, accessor.count * itemSize),
	      itemSize: itemSize
	    };
	  };

	  _proto._getArrayCtor = function _getArrayCtor(componentType) {
	    switch (componentType) {
	      case 0x1400:
	        return Int8Array;

	      case 0x1401:
	        return Uint8Array;

	      case 0x1402:
	        return Int16Array;

	      case 0x1403:
	        return Uint16Array;

	      case 0x1404:
	        return Int32Array;

	      case 0x1405:
	        return Uint32Array;

	      case 0x1406:
	        return Float32Array;
	    }

	    throw new Error('unsupported bufferView\'s componeng type: ' + componentType);
	  };

	  _proto._getTypeItemSize = function _getTypeItemSize(type) {
	    var typeIdx = TYPES.indexOf(type);
	    return TYPES[typeIdx + 1];
	  };

	  return Accessor;
	}();

	var V2 = function () {
	  function V2(rootPath, gltf, glbBuffer, requestImage) {
	    this.rootPath = rootPath;
	    this.gltf = gltf;
	    this.glbBuffer = glbBuffer;
	    this.buffers = {};
	    this.requests = {};
	    this._requestImage = requestImage;
	    this.accessor = new Accessor(rootPath, gltf, glbBuffer);
	  }

	  var _proto = V2.prototype;

	  _proto.iterate = function iterate(cb, propertyName) {
	    var properties = this.gltf[propertyName];

	    if (!properties) {
	      return;
	    }

	    for (var i = 0; i < properties.length; i++) {
	      cb(i, properties[i], i);
	    }
	  };

	  _proto.createNode = function createNode(nodeJSON, meshes, skins) {
	    var node = {};
	    extend(node, nodeJSON);

	    if (defined(nodeJSON.mesh)) {
	      node.meshes = [meshes[nodeJSON.mesh]];
	    }

	    if (defined(nodeJSON.skin)) {
	      node.skin = skins[nodeJSON.skin];
	      node.skinIndex = nodeJSON.skin;
	    }

	    if (!defined(nodeJSON.weights) && node.meshes) {
	      node.weights = node.meshes[0].weights;
	    } else {
	      node.weights = nodeJSON.weights;
	    }

	    return node;
	  };

	  _proto.getMaterial = function getMaterial(index) {
	    var material = this.gltf.materials[index];
	    var pbrMetallicRoughness = material.pbrMetallicRoughness;
	    var normalTextureInfo = material.normalTexture;
	    var occlusionTextureInfo = material.occlusionTexture;
	    var emissiveTextureInfo = material.emissiveTexture;
	    var extensions = material.extensions;
	    var promises = [];

	    if (pbrMetallicRoughness) {
	      pbrMetallicRoughness.name = 'pbrMetallicRoughness';
	      promises.push(this._getPBRMaterial(pbrMetallicRoughness, ['baseColorTexture', 'metallicRoughnessTexture']));
	    }

	    if (normalTextureInfo) {
	      promises.push(this._getTextureInfo(normalTextureInfo, 'normalTexture'));
	    }

	    if (occlusionTextureInfo) {
	      promises.push(this._getTextureInfo(occlusionTextureInfo, 'occlusionTexture'));
	    }

	    if (emissiveTextureInfo) {
	      promises.push(this._getTextureInfo(emissiveTextureInfo, 'emissiveTexture'));
	    }

	    if (extensions) {
	      var pbrSpecularGlossiness = extensions['KHR_materials_pbrSpecularGlossiness'];

	      if (pbrSpecularGlossiness) {
	        pbrSpecularGlossiness.name = 'pbrSpecularGlossiness';
	        promises.push(this._getPBRMaterial(pbrSpecularGlossiness, ['diffuseTexture', 'specularGlossinessTexture']));
	      }
	    }

	    return Promise$1.all(promises).then(function (assets) {
	      var out = {};
	      extend(out, material);

	      for (var i = 0; i < assets.length; i++) {
	        out[assets[i].name] = assets[i];
	      }

	      if (out['extensions']) {
	        var unlit = out['extensions']['KHR_materials_unlit'];

	        if (unlit) {
	          out['unlit'] = unlit;
	        }

	        delete out['extensions'];
	      }

	      return {
	        material: out
	      };
	    });
	  };

	  _proto._getPBRMaterial = function _getPBRMaterial(prbMaterial, textures) {
	    var promises = [];

	    for (var i = 0; i < textures.length; i++) {
	      var texture = prbMaterial[textures[i]];

	      if (texture) {
	        promises.push(this._getTextureInfo(texture, textures[i]));
	      }
	    }

	    return Promise$1.all(promises).then(function (assets) {
	      var out = {};
	      extend(out, prbMaterial);

	      for (var _i = 0; _i < assets.length; _i++) {
	        delete assets[_i].index;
	        out[assets[_i].name] = assets[_i];
	      }

	      return out;
	    });
	  };

	  _proto._getTextureInfo = function _getTextureInfo(texInfo, name) {
	    var index = texInfo.index;
	    var extensions = texInfo.extensions;

	    if (!defined(index)) {
	      return null;
	    }

	    if (extensions && extensions['KHR_texture_transform']) {
	      texInfo['KHR_texture_transform'] = {};
	      extend(texInfo['KHR_texture_transform'], extensions['KHR_texture_transform']);
	      delete texInfo.extensions;
	    }

	    texInfo.name = name;

	    var promise = this._getTexture(index);

	    return promise.then(function (result) {
	      var out = {
	        texture: result
	      };
	      extend(out, texInfo);
	      delete out.index;
	      return out;
	    });
	  };

	  _proto._getTexture = function _getTexture(index) {
	    var _this = this;

	    var texture = this.gltf.textures[index];

	    if (!texture) {
	      return null;
	    }

	    var image = this.gltf.images[texture.source];

	    var promise = this._loadImage(image);

	    return promise.then(function (response) {
	      var out = {
	        image: {
	          array: response.data,
	          width: response.width,
	          height: response.height,
	          index: texture.source,
	          mimeType: image.mimeType,
	          name: image.name,
	          extensions: image.extensions,
	          extras: image.extras
	        }
	      };
	      extend(out, texture);
	      delete out.sampler;
	      var sampler = defined(texture.sampler) ? _this.gltf.samplers[texture.sampler] : undefined;

	      if (sampler) {
	        out.sampler = sampler;
	      }

	      return out;
	    });
	  };

	  _proto._loadImage = function _loadImage(source) {
	    if (defined(source.bufferView)) {
	      var bufferView = this.gltf.bufferViews[source.bufferView];

	      if (this.buffers[source.bufferView]) {
	        return Promise$1.resolve(this.buffers[source.bufferView]);
	      }

	      var bufferObj = this.gltf.buffers[bufferView.buffer];

	      if (bufferObj.uri) {
	        return this._requestFromArrayBuffer(bufferObj.uri, bufferView, source);
	      }

	      if (this.glbBuffer) {
	        return this._requestFromGlbBuffer(bufferView, source);
	      }
	    } else {
	      var file = source.uri;
	      var url = file.indexOf('data:image/') === 0 ? file : this.rootPath + '/' + file;
	      return this._requestFromUrl(url);
	    }

	    return null;
	  };

	  _proto._requestFromUrl = function _requestFromUrl(url) {
	    var _this2 = this;

	    if (this.requests[url]) {
	      return this.requests[url].then(function () {
	        return _this2.buffers[url];
	      });
	    }

	    var promise = this.requests[url] = this._getImageInfo(url, url);

	    return promise;
	  };

	  _proto._requestFromArrayBuffer = function _requestFromArrayBuffer(uri, bufferView, source) {
	    var _this3 = this;

	    var key = source.bufferView;

	    if (this.requests[uri]) {
	      return this.requests[uri].then(function () {
	        return _this3.buffers[key];
	      });
	    }

	    return Ajax.getArrayBuffer(uri, null).then(function (response) {
	      var bufferData = response.data;

	      var dataview = _this3._createDataView(bufferView, bufferData);

	      var blob = new Blob([dataview], {
	        type: source.mimeType
	      });
	      var sourceURI = URL.createObjectURL(blob);
	      return _this3._getImageInfo(key, sourceURI);
	    });
	  };

	  _proto._requestFromGlbBuffer = function _requestFromGlbBuffer(bufferView, source) {
	    var dataview = this._createDataView(bufferView, this.glbBuffer.buffer, this.glbBuffer.byteOffset);

	    var blob = new Blob([dataview], {
	      type: source.mimeType
	    });
	    var sourceURI = URL.createObjectURL(blob);
	    return this._getImageInfo(source.bufferView, sourceURI);
	  };

	  _proto._getImageInfo = function _getImageInfo(key, url) {
	    var _this4 = this;

	    return new Promise$1(function (resolve, reject) {
	      _this4._requestImage(url, function (err, result) {
	        if (err) {
	          reject(err);
	          return;
	        }

	        _this4.buffers[key] = result;
	        resolve(_this4.buffers[key]);
	      });
	    });
	  };

	  _proto._createDataView = function _createDataView(bufferView, bufferData, byteOffset) {
	    byteOffset = !byteOffset ? 0 : byteOffset;
	    var start = bufferView.byteOffset + byteOffset;
	    var length = bufferView.byteLength;
	    var dataview = bufferData.slice(start, start + length);
	    return dataview;
	  };

	  _proto._transformArrayBufferToBase64 = function _transformArrayBufferToBase64(array, mimeType) {
	    var binary = new Array(array.byteLength);

	    for (var i = 0; i < array.byteLength; i++) {
	      binary[i] = String.fromCharCode(array[i]);
	    }

	    binary.join('');
	    mimeType = !mimeType ? 'image/png' : mimeType;
	    var base64Url = 'data:' + mimeType + ';base64,' + window.btoa(unescape(encodeURIComponent(binary)));
	    return base64Url;
	  };

	  _proto.getAnimations = function getAnimations(animations) {
	    var _this5 = this;

	    var promises = [];
	    animations.forEach(function (animation) {
	      promises.push(_this5.getSamplers(animation.samplers));
	    });
	    return Promise$1.all(promises).then(function (assets) {
	      for (var i = 0; i < assets.length; i++) {
	        animations[i].samplers = assets[i];
	      }

	      return animations;
	    });
	  };

	  _proto.getSamplers = function getSamplers(samplers) {
	    var promises = [];

	    for (var i = 0; i < samplers.length; i++) {
	      if (!defined(samplers[i].input) && !defined(samplers[i].output)) continue;
	      promises.push(this.accessor._requestData('input', samplers[i].input));
	      promises.push(this.accessor._requestData('output', samplers[i].output));
	    }

	    return Promise$1.all(promises).then(function (assets) {
	      for (var _i2 = 0; _i2 < assets.length / 2; _i2++) {
	        samplers[_i2].input = assets[_i2 * 2];
	        samplers[_i2].output = assets[_i2 * 2 + 1];

	        if (!samplers[_i2].interpolation) {
	          samplers[_i2].interpolation = 'LINEAR';
	        }
	      }

	      return samplers;
	    });
	  };

	  return V2;
	}();

	var textDecoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;
	var BINARY_EXTENSION_HEADER_LENGTH = 12;
	var BINARY_EXTENSION_CHUNK_TYPES = {
	  JSON: 0x4E4F534A,
	  BIN: 0x004E4942
	};

	var GLBReader = function () {
	  function GLBReader() {}

	  GLBReader.read = function read(glb, glbOffset) {
	    if (glbOffset === void 0) {
	      glbOffset = 0;
	    }

	    var dataView = new DataView(glb, glbOffset);
	    var version = dataView.getUint32(4, true);

	    if (version === 1) {
	      return GLBReader.readV1(dataView, glbOffset);
	    } else if (version === 2) {
	      return GLBReader.readV2(glb, glbOffset);
	    } else {
	      throw new Error('Unsupported glb version : ' + version);
	    }
	  };

	  GLBReader.readV1 = function readV1(dataView, glbOffset) {
	    var length = dataView.getUint32(8, true);
	    var contentLength = dataView.getUint32(12, true);

	    if (length !== dataView.buffer.byteLength - glbOffset) {
	      throw new Error('Length in GLB header is inconsistent with glb\'s byte length.');
	    }

	    var json = readString(dataView.buffer, 20 + glbOffset, contentLength);
	    return {
	      json: JSON.parse(json),
	      glbBuffer: {
	        byteOffset: 20 + glbOffset + contentLength,
	        buffer: dataView.buffer
	      }
	    };
	  };

	  GLBReader.readV2 = function readV2(glb, glbOffset) {
	    var json, buffer;
	    var chunkView = new DataView(glb, BINARY_EXTENSION_HEADER_LENGTH);
	    var chunkIndex = 0;

	    while (chunkIndex < chunkView.byteLength) {
	      var chunkLength = chunkView.getUint32(chunkIndex, true);
	      chunkIndex += 4;
	      var chunkType = chunkView.getUint32(chunkIndex, true);
	      chunkIndex += 4;

	      if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.JSON) {
	        json = readString(glb, BINARY_EXTENSION_HEADER_LENGTH + chunkIndex, chunkLength);
	      } else if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.BIN) {
	        var byteOffset = BINARY_EXTENSION_HEADER_LENGTH + chunkIndex;
	        buffer = glb.slice(byteOffset, byteOffset + chunkLength);
	      }

	      chunkIndex += chunkLength;
	    }

	    return {
	      json: JSON.parse(json),
	      glbBuffer: {
	        byteOffset: glbOffset,
	        buffer: buffer
	      }
	    };
	  };

	  return GLBReader;
	}();

	function readString(buffer, offset, byteLength) {
	  if (textDecoder) {
	    var arr = new Uint8Array(buffer, offset, byteLength);
	    return textDecoder.decode(arr);
	  } else {
	    var _arr = new Uint8Array(buffer, offset, byteLength);

	    return stringFromUTF8Array(_arr);
	  }
	}

	var extraByteMap = [1, 1, 1, 1, 2, 2, 3, 0];

	function stringFromUTF8Array(data) {
	  var count = data.length;
	  var str = '';

	  for (var index = 0; index < count;) {
	    var ch = data[index++];

	    if (ch & 0x80) {
	      var extra = extraByteMap[ch >> 3 & 0x07];
	      if (!(ch & 0x40) || !extra || index + extra > count) return null;
	      ch = ch & 0x3F >> extra;

	      for (; extra > 0; extra -= 1) {
	        var chx = data[index++];
	        if ((chx & 0xC0) !== 0x80) return null;
	        ch = ch << 6 | chx & 0x3F;
	      }
	    }

	    str += String.fromCharCode(ch);
	  }

	  return str;
	}

	/**
	 * Common utilities
	 * @module glMatrix
	 */

	// Configuration Constants
	var EPSILON = 0.000001;
	var ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
	var RANDOM = Math.random;

	var degree = Math.PI / 180;

	/**
	 * 3x3 Matrix
	 * @module mat3
	 */

	/**
	 * Creates a new identity mat3
	 *
	 * @returns {mat3} a new 3x3 matrix
	 */
	function create$2() {
	  var out = new ARRAY_TYPE(9);
	  if (ARRAY_TYPE != Float32Array) {
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[5] = 0;
	    out[6] = 0;
	    out[7] = 0;
	  }
	  out[0] = 1;
	  out[4] = 1;
	  out[8] = 1;
	  return out;
	}

	/**
	 * Creates a matrix from a quaternion rotation, vector translation and vector scale
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.translate(dest, vec);
	 *     let quatMat = mat4.create();
	 *     quat4.toMat4(quat, quatMat);
	 *     mat4.multiply(dest, quatMat);
	 *     mat4.scale(dest, scale)
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {quat4} q Rotation quaternion
	 * @param {vec3} v Translation vector
	 * @param {vec3} s Scaling vector
	 * @returns {mat4} out
	 */
	function fromRotationTranslationScale(out, q, v, s) {
	  // Quaternion math
	  var x = q[0],
	      y = q[1],
	      z = q[2],
	      w = q[3];
	  var x2 = x + x;
	  var y2 = y + y;
	  var z2 = z + z;

	  var xx = x * x2;
	  var xy = x * y2;
	  var xz = x * z2;
	  var yy = y * y2;
	  var yz = y * z2;
	  var zz = z * z2;
	  var wx = w * x2;
	  var wy = w * y2;
	  var wz = w * z2;
	  var sx = s[0];
	  var sy = s[1];
	  var sz = s[2];

	  out[0] = (1 - (yy + zz)) * sx;
	  out[1] = (xy + wz) * sx;
	  out[2] = (xz - wy) * sx;
	  out[3] = 0;
	  out[4] = (xy - wz) * sy;
	  out[5] = (1 - (xx + zz)) * sy;
	  out[6] = (yz + wx) * sy;
	  out[7] = 0;
	  out[8] = (xz + wy) * sz;
	  out[9] = (yz - wx) * sz;
	  out[10] = (1 - (xx + yy)) * sz;
	  out[11] = 0;
	  out[12] = v[0];
	  out[13] = v[1];
	  out[14] = v[2];
	  out[15] = 1;

	  return out;
	}

	/**
	 * 3 Dimensional Vector
	 * @module vec3
	 */

	/**
	 * Creates a new, empty vec3
	 *
	 * @returns {vec3} a new 3D vector
	 */
	function create$4() {
	  var out = new ARRAY_TYPE(3);
	  if (ARRAY_TYPE != Float32Array) {
	    out[0] = 0;
	    out[1] = 0;
	    out[2] = 0;
	  }
	  return out;
	}

	/**
	 * Creates a new vec3 initialized with values from an existing vector
	 *
	 * @param {vec3} a vector to clone
	 * @returns {vec3} a new 3D vector
	 */
	function clone$4(a) {
	  var out = new ARRAY_TYPE(3);
	  out[0] = a[0];
	  out[1] = a[1];
	  out[2] = a[2];
	  return out;
	}

	/**
	 * Calculates the length of a vec3
	 *
	 * @param {vec3} a vector to calculate length of
	 * @returns {Number} length of a
	 */
	function length(a) {
	  var x = a[0];
	  var y = a[1];
	  var z = a[2];
	  return Math.sqrt(x * x + y * y + z * z);
	}

	/**
	 * Creates a new vec3 initialized with the given values
	 *
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @returns {vec3} a new 3D vector
	 */
	function fromValues$4(x, y, z) {
	  var out = new ARRAY_TYPE(3);
	  out[0] = x;
	  out[1] = y;
	  out[2] = z;
	  return out;
	}

	/**
	 * Copy the values from one vec3 to another
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the source vector
	 * @returns {vec3} out
	 */
	function copy$4(out, a) {
	  out[0] = a[0];
	  out[1] = a[1];
	  out[2] = a[2];
	  return out;
	}

	/**
	 * Set the components of a vec3 to the given values
	 *
	 * @param {vec3} out the receiving vector
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @returns {vec3} out
	 */
	function set$5(out, x, y, z) {
	  out[0] = x;
	  out[1] = y;
	  out[2] = z;
	  return out;
	}

	/**
	 * Adds two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {vec3} out
	 */
	function add$4(out, a, b) {
	  out[0] = a[0] + b[0];
	  out[1] = a[1] + b[1];
	  out[2] = a[2] + b[2];
	  return out;
	}

	/**
	 * Subtracts vector b from vector a
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {vec3} out
	 */
	function subtract$4(out, a, b) {
	  out[0] = a[0] - b[0];
	  out[1] = a[1] - b[1];
	  out[2] = a[2] - b[2];
	  return out;
	}

	/**
	 * Multiplies two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {vec3} out
	 */
	function multiply$4(out, a, b) {
	  out[0] = a[0] * b[0];
	  out[1] = a[1] * b[1];
	  out[2] = a[2] * b[2];
	  return out;
	}

	/**
	 * Divides two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {vec3} out
	 */
	function divide(out, a, b) {
	  out[0] = a[0] / b[0];
	  out[1] = a[1] / b[1];
	  out[2] = a[2] / b[2];
	  return out;
	}

	/**
	 * Math.ceil the components of a vec3
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a vector to ceil
	 * @returns {vec3} out
	 */
	function ceil(out, a) {
	  out[0] = Math.ceil(a[0]);
	  out[1] = Math.ceil(a[1]);
	  out[2] = Math.ceil(a[2]);
	  return out;
	}

	/**
	 * Math.floor the components of a vec3
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a vector to floor
	 * @returns {vec3} out
	 */
	function floor(out, a) {
	  out[0] = Math.floor(a[0]);
	  out[1] = Math.floor(a[1]);
	  out[2] = Math.floor(a[2]);
	  return out;
	}

	/**
	 * Returns the minimum of two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {vec3} out
	 */
	function min(out, a, b) {
	  out[0] = Math.min(a[0], b[0]);
	  out[1] = Math.min(a[1], b[1]);
	  out[2] = Math.min(a[2], b[2]);
	  return out;
	}

	/**
	 * Returns the maximum of two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {vec3} out
	 */
	function max(out, a, b) {
	  out[0] = Math.max(a[0], b[0]);
	  out[1] = Math.max(a[1], b[1]);
	  out[2] = Math.max(a[2], b[2]);
	  return out;
	}

	/**
	 * Math.round the components of a vec3
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a vector to round
	 * @returns {vec3} out
	 */
	function round(out, a) {
	  out[0] = Math.round(a[0]);
	  out[1] = Math.round(a[1]);
	  out[2] = Math.round(a[2]);
	  return out;
	}

	/**
	 * Scales a vec3 by a scalar number
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the vector to scale
	 * @param {Number} b amount to scale the vector by
	 * @returns {vec3} out
	 */
	function scale$4(out, a, b) {
	  out[0] = a[0] * b;
	  out[1] = a[1] * b;
	  out[2] = a[2] * b;
	  return out;
	}

	/**
	 * Adds two vec3's after scaling the second operand by a scalar value
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @param {Number} scale the amount to scale b by before adding
	 * @returns {vec3} out
	 */
	function scaleAndAdd(out, a, b, scale) {
	  out[0] = a[0] + b[0] * scale;
	  out[1] = a[1] + b[1] * scale;
	  out[2] = a[2] + b[2] * scale;
	  return out;
	}

	/**
	 * Calculates the euclidian distance between two vec3's
	 *
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {Number} distance between a and b
	 */
	function distance(a, b) {
	  var x = b[0] - a[0];
	  var y = b[1] - a[1];
	  var z = b[2] - a[2];
	  return Math.sqrt(x * x + y * y + z * z);
	}

	/**
	 * Calculates the squared euclidian distance between two vec3's
	 *
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {Number} squared distance between a and b
	 */
	function squaredDistance(a, b) {
	  var x = b[0] - a[0];
	  var y = b[1] - a[1];
	  var z = b[2] - a[2];
	  return x * x + y * y + z * z;
	}

	/**
	 * Calculates the squared length of a vec3
	 *
	 * @param {vec3} a vector to calculate squared length of
	 * @returns {Number} squared length of a
	 */
	function squaredLength(a) {
	  var x = a[0];
	  var y = a[1];
	  var z = a[2];
	  return x * x + y * y + z * z;
	}

	/**
	 * Negates the components of a vec3
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a vector to negate
	 * @returns {vec3} out
	 */
	function negate(out, a) {
	  out[0] = -a[0];
	  out[1] = -a[1];
	  out[2] = -a[2];
	  return out;
	}

	/**
	 * Returns the inverse of the components of a vec3
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a vector to invert
	 * @returns {vec3} out
	 */
	function inverse(out, a) {
	  out[0] = 1.0 / a[0];
	  out[1] = 1.0 / a[1];
	  out[2] = 1.0 / a[2];
	  return out;
	}

	/**
	 * Normalize a vec3
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a vector to normalize
	 * @returns {vec3} out
	 */
	function normalize(out, a) {
	  var x = a[0];
	  var y = a[1];
	  var z = a[2];
	  var len = x * x + y * y + z * z;
	  if (len > 0) {
	    //TODO: evaluate use of glm_invsqrt here?
	    len = 1 / Math.sqrt(len);
	    out[0] = a[0] * len;
	    out[1] = a[1] * len;
	    out[2] = a[2] * len;
	  }
	  return out;
	}

	/**
	 * Calculates the dot product of two vec3's
	 *
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {Number} dot product of a and b
	 */
	function dot(a, b) {
	  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
	}

	/**
	 * Computes the cross product of two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {vec3} out
	 */
	function cross(out, a, b) {
	  var ax = a[0],
	      ay = a[1],
	      az = a[2];
	  var bx = b[0],
	      by = b[1],
	      bz = b[2];

	  out[0] = ay * bz - az * by;
	  out[1] = az * bx - ax * bz;
	  out[2] = ax * by - ay * bx;
	  return out;
	}

	/**
	 * Performs a linear interpolation between two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
	 * @returns {vec3} out
	 */
	function lerp$1(out, a, b, t) {
	  var ax = a[0];
	  var ay = a[1];
	  var az = a[2];
	  out[0] = ax + t * (b[0] - ax);
	  out[1] = ay + t * (b[1] - ay);
	  out[2] = az + t * (b[2] - az);
	  return out;
	}

	/**
	 * Performs a hermite interpolation with two control points
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @param {vec3} c the third operand
	 * @param {vec3} d the fourth operand
	 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
	 * @returns {vec3} out
	 */
	function hermite(out, a, b, c, d, t) {
	  var factorTimes2 = t * t;
	  var factor1 = factorTimes2 * (2 * t - 3) + 1;
	  var factor2 = factorTimes2 * (t - 2) + t;
	  var factor3 = factorTimes2 * (t - 1);
	  var factor4 = factorTimes2 * (3 - 2 * t);

	  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
	  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
	  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;

	  return out;
	}

	/**
	 * Performs a bezier interpolation with two control points
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @param {vec3} c the third operand
	 * @param {vec3} d the fourth operand
	 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
	 * @returns {vec3} out
	 */
	function bezier(out, a, b, c, d, t) {
	  var inverseFactor = 1 - t;
	  var inverseFactorTimesTwo = inverseFactor * inverseFactor;
	  var factorTimes2 = t * t;
	  var factor1 = inverseFactorTimesTwo * inverseFactor;
	  var factor2 = 3 * t * inverseFactorTimesTwo;
	  var factor3 = 3 * factorTimes2 * inverseFactor;
	  var factor4 = factorTimes2 * t;

	  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
	  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
	  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;

	  return out;
	}

	/**
	 * Generates a random vector with the given scale
	 *
	 * @param {vec3} out the receiving vector
	 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
	 * @returns {vec3} out
	 */
	function random(out, scale) {
	  scale = scale || 1.0;

	  var r = RANDOM() * 2.0 * Math.PI;
	  var z = RANDOM() * 2.0 - 1.0;
	  var zScale = Math.sqrt(1.0 - z * z) * scale;

	  out[0] = Math.cos(r) * zScale;
	  out[1] = Math.sin(r) * zScale;
	  out[2] = z * scale;
	  return out;
	}

	/**
	 * Transforms the vec3 with a mat4.
	 * 4th vector component is implicitly '1'
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the vector to transform
	 * @param {mat4} m matrix to transform with
	 * @returns {vec3} out
	 */
	function transformMat4(out, a, m) {
	  var x = a[0],
	      y = a[1],
	      z = a[2];
	  var w = m[3] * x + m[7] * y + m[11] * z + m[15];
	  w = w || 1.0;
	  out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
	  out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
	  out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
	  return out;
	}

	/**
	 * Transforms the vec3 with a mat3.
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the vector to transform
	 * @param {mat3} m the 3x3 matrix to transform with
	 * @returns {vec3} out
	 */
	function transformMat3(out, a, m) {
	  var x = a[0],
	      y = a[1],
	      z = a[2];
	  out[0] = x * m[0] + y * m[3] + z * m[6];
	  out[1] = x * m[1] + y * m[4] + z * m[7];
	  out[2] = x * m[2] + y * m[5] + z * m[8];
	  return out;
	}

	/**
	 * Transforms the vec3 with a quat
	 * Can also be used for dual quaternions. (Multiply it with the real part)
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the vector to transform
	 * @param {quat} q quaternion to transform with
	 * @returns {vec3} out
	 */
	function transformQuat(out, a, q) {
	  // benchmarks: https://jsperf.com/quaternion-transform-vec3-implementations-fixed
	  var qx = q[0],
	      qy = q[1],
	      qz = q[2],
	      qw = q[3];
	  var x = a[0],
	      y = a[1],
	      z = a[2];
	  // var qvec = [qx, qy, qz];
	  // var uv = vec3.cross([], qvec, a);
	  var uvx = qy * z - qz * y,
	      uvy = qz * x - qx * z,
	      uvz = qx * y - qy * x;
	  // var uuv = vec3.cross([], qvec, uv);
	  var uuvx = qy * uvz - qz * uvy,
	      uuvy = qz * uvx - qx * uvz,
	      uuvz = qx * uvy - qy * uvx;
	  // vec3.scale(uv, uv, 2 * w);
	  var w2 = qw * 2;
	  uvx *= w2;
	  uvy *= w2;
	  uvz *= w2;
	  // vec3.scale(uuv, uuv, 2);
	  uuvx *= 2;
	  uuvy *= 2;
	  uuvz *= 2;
	  // return vec3.add(out, a, vec3.add(out, uv, uuv));
	  out[0] = x + uvx + uuvx;
	  out[1] = y + uvy + uuvy;
	  out[2] = z + uvz + uuvz;
	  return out;
	}

	/**
	 * Rotate a 3D vector around the x-axis
	 * @param {vec3} out The receiving vec3
	 * @param {vec3} a The vec3 point to rotate
	 * @param {vec3} b The origin of the rotation
	 * @param {Number} c The angle of rotation
	 * @returns {vec3} out
	 */
	function rotateX$1(out, a, b, c) {
	  var p = [],
	      r = [];
	  //Translate point to the origin
	  p[0] = a[0] - b[0];
	  p[1] = a[1] - b[1];
	  p[2] = a[2] - b[2];

	  //perform rotation
	  r[0] = p[0];
	  r[1] = p[1] * Math.cos(c) - p[2] * Math.sin(c);
	  r[2] = p[1] * Math.sin(c) + p[2] * Math.cos(c);

	  //translate to correct position
	  out[0] = r[0] + b[0];
	  out[1] = r[1] + b[1];
	  out[2] = r[2] + b[2];

	  return out;
	}

	/**
	 * Rotate a 3D vector around the y-axis
	 * @param {vec3} out The receiving vec3
	 * @param {vec3} a The vec3 point to rotate
	 * @param {vec3} b The origin of the rotation
	 * @param {Number} c The angle of rotation
	 * @returns {vec3} out
	 */
	function rotateY$1(out, a, b, c) {
	  var p = [],
	      r = [];
	  //Translate point to the origin
	  p[0] = a[0] - b[0];
	  p[1] = a[1] - b[1];
	  p[2] = a[2] - b[2];

	  //perform rotation
	  r[0] = p[2] * Math.sin(c) + p[0] * Math.cos(c);
	  r[1] = p[1];
	  r[2] = p[2] * Math.cos(c) - p[0] * Math.sin(c);

	  //translate to correct position
	  out[0] = r[0] + b[0];
	  out[1] = r[1] + b[1];
	  out[2] = r[2] + b[2];

	  return out;
	}

	/**
	 * Rotate a 3D vector around the z-axis
	 * @param {vec3} out The receiving vec3
	 * @param {vec3} a The vec3 point to rotate
	 * @param {vec3} b The origin of the rotation
	 * @param {Number} c The angle of rotation
	 * @returns {vec3} out
	 */
	function rotateZ$1(out, a, b, c) {
	  var p = [],
	      r = [];
	  //Translate point to the origin
	  p[0] = a[0] - b[0];
	  p[1] = a[1] - b[1];
	  p[2] = a[2] - b[2];

	  //perform rotation
	  r[0] = p[0] * Math.cos(c) - p[1] * Math.sin(c);
	  r[1] = p[0] * Math.sin(c) + p[1] * Math.cos(c);
	  r[2] = p[2];

	  //translate to correct position
	  out[0] = r[0] + b[0];
	  out[1] = r[1] + b[1];
	  out[2] = r[2] + b[2];

	  return out;
	}

	/**
	 * Get the angle between two 3D vectors
	 * @param {vec3} a The first operand
	 * @param {vec3} b The second operand
	 * @returns {Number} The angle in radians
	 */
	function angle(a, b) {
	  var tempA = fromValues$4(a[0], a[1], a[2]);
	  var tempB = fromValues$4(b[0], b[1], b[2]);

	  normalize(tempA, tempA);
	  normalize(tempB, tempB);

	  var cosine = dot(tempA, tempB);

	  if (cosine > 1.0) {
	    return 0;
	  } else if (cosine < -1.0) {
	    return Math.PI;
	  } else {
	    return Math.acos(cosine);
	  }
	}

	/**
	 * Returns a string representation of a vector
	 *
	 * @param {vec3} a vector to represent as a string
	 * @returns {String} string representation of the vector
	 */
	function str$4(a) {
	  return 'vec3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ')';
	}

	/**
	 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
	 *
	 * @param {vec3} a The first vector.
	 * @param {vec3} b The second vector.
	 * @returns {Boolean} True if the vectors are equal, false otherwise.
	 */
	function exactEquals$4(a, b) {
	  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
	}

	/**
	 * Returns whether or not the vectors have approximately the same elements in the same position.
	 *
	 * @param {vec3} a The first vector.
	 * @param {vec3} b The second vector.
	 * @returns {Boolean} True if the vectors are equal, false otherwise.
	 */
	function equals$5(a, b) {
	  var a0 = a[0],
	      a1 = a[1],
	      a2 = a[2];
	  var b0 = b[0],
	      b1 = b[1],
	      b2 = b[2];
	  return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2));
	}

	/**
	 * Alias for {@link vec3.subtract}
	 * @function
	 */
	var sub$4 = subtract$4;

	/**
	 * Alias for {@link vec3.multiply}
	 * @function
	 */
	var mul$4 = multiply$4;

	/**
	 * Alias for {@link vec3.divide}
	 * @function
	 */
	var div = divide;

	/**
	 * Alias for {@link vec3.distance}
	 * @function
	 */
	var dist = distance;

	/**
	 * Alias for {@link vec3.squaredDistance}
	 * @function
	 */
	var sqrDist = squaredDistance;

	/**
	 * Alias for {@link vec3.length}
	 * @function
	 */
	var len = length;

	/**
	 * Alias for {@link vec3.squaredLength}
	 * @function
	 */
	var sqrLen = squaredLength;

	/**
	 * Perform some operation over an array of vec3s.
	 *
	 * @param {Array} a the array of vectors to iterate over
	 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
	 * @param {Number} offset Number of elements to skip at the beginning of the array
	 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
	 * @param {Function} fn Function to call for each vector in the array
	 * @param {Object} [arg] additional argument to pass to fn
	 * @returns {Array} a
	 * @function
	 */
	var forEach = function () {
	  var vec = create$4();

	  return function (a, stride, offset, count, fn, arg) {
	    var i = void 0,
	        l = void 0;
	    if (!stride) {
	      stride = 3;
	    }

	    if (!offset) {
	      offset = 0;
	    }

	    if (count) {
	      l = Math.min(count * stride + offset, a.length);
	    } else {
	      l = a.length;
	    }

	    for (i = offset; i < l; i += stride) {
	      vec[0] = a[i];vec[1] = a[i + 1];vec[2] = a[i + 2];
	      fn(vec, vec, arg);
	      a[i] = vec[0];a[i + 1] = vec[1];a[i + 2] = vec[2];
	    }

	    return a;
	  };
	}();

	var vec3 = /*#__PURE__*/Object.freeze({
		create: create$4,
		clone: clone$4,
		length: length,
		fromValues: fromValues$4,
		copy: copy$4,
		set: set$5,
		add: add$4,
		subtract: subtract$4,
		multiply: multiply$4,
		divide: divide,
		ceil: ceil,
		floor: floor,
		min: min,
		max: max,
		round: round,
		scale: scale$4,
		scaleAndAdd: scaleAndAdd,
		distance: distance,
		squaredDistance: squaredDistance,
		squaredLength: squaredLength,
		negate: negate,
		inverse: inverse,
		normalize: normalize,
		dot: dot,
		cross: cross,
		lerp: lerp$1,
		hermite: hermite,
		bezier: bezier,
		random: random,
		transformMat4: transformMat4,
		transformMat3: transformMat3,
		transformQuat: transformQuat,
		rotateX: rotateX$1,
		rotateY: rotateY$1,
		rotateZ: rotateZ$1,
		angle: angle,
		str: str$4,
		exactEquals: exactEquals$4,
		equals: equals$5,
		sub: sub$4,
		mul: mul$4,
		div: div,
		dist: dist,
		sqrDist: sqrDist,
		len: len,
		sqrLen: sqrLen,
		forEach: forEach
	});

	/**
	 * 4 Dimensional Vector
	 * @module vec4
	 */

	/**
	 * Creates a new, empty vec4
	 *
	 * @returns {vec4} a new 4D vector
	 */
	function create$5() {
	  var out = new ARRAY_TYPE(4);
	  if (ARRAY_TYPE != Float32Array) {
	    out[0] = 0;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	  }
	  return out;
	}

	/**
	 * Creates a new vec4 initialized with values from an existing vector
	 *
	 * @param {vec4} a vector to clone
	 * @returns {vec4} a new 4D vector
	 */
	function clone$5(a) {
	  var out = new ARRAY_TYPE(4);
	  out[0] = a[0];
	  out[1] = a[1];
	  out[2] = a[2];
	  out[3] = a[3];
	  return out;
	}

	/**
	 * Creates a new vec4 initialized with the given values
	 *
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @param {Number} w W component
	 * @returns {vec4} a new 4D vector
	 */
	function fromValues$5(x, y, z, w) {
	  var out = new ARRAY_TYPE(4);
	  out[0] = x;
	  out[1] = y;
	  out[2] = z;
	  out[3] = w;
	  return out;
	}

	/**
	 * Copy the values from one vec4 to another
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the source vector
	 * @returns {vec4} out
	 */
	function copy$5(out, a) {
	  out[0] = a[0];
	  out[1] = a[1];
	  out[2] = a[2];
	  out[3] = a[3];
	  return out;
	}

	/**
	 * Set the components of a vec4 to the given values
	 *
	 * @param {vec4} out the receiving vector
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @param {Number} w W component
	 * @returns {vec4} out
	 */
	function set$6(out, x, y, z, w) {
	  out[0] = x;
	  out[1] = y;
	  out[2] = z;
	  out[3] = w;
	  return out;
	}

	/**
	 * Adds two vec4's
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @returns {vec4} out
	 */
	function add$5(out, a, b) {
	  out[0] = a[0] + b[0];
	  out[1] = a[1] + b[1];
	  out[2] = a[2] + b[2];
	  out[3] = a[3] + b[3];
	  return out;
	}

	/**
	 * Subtracts vector b from vector a
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @returns {vec4} out
	 */
	function subtract$5(out, a, b) {
	  out[0] = a[0] - b[0];
	  out[1] = a[1] - b[1];
	  out[2] = a[2] - b[2];
	  out[3] = a[3] - b[3];
	  return out;
	}

	/**
	 * Multiplies two vec4's
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @returns {vec4} out
	 */
	function multiply$5(out, a, b) {
	  out[0] = a[0] * b[0];
	  out[1] = a[1] * b[1];
	  out[2] = a[2] * b[2];
	  out[3] = a[3] * b[3];
	  return out;
	}

	/**
	 * Divides two vec4's
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @returns {vec4} out
	 */
	function divide$1(out, a, b) {
	  out[0] = a[0] / b[0];
	  out[1] = a[1] / b[1];
	  out[2] = a[2] / b[2];
	  out[3] = a[3] / b[3];
	  return out;
	}

	/**
	 * Math.ceil the components of a vec4
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a vector to ceil
	 * @returns {vec4} out
	 */
	function ceil$1(out, a) {
	  out[0] = Math.ceil(a[0]);
	  out[1] = Math.ceil(a[1]);
	  out[2] = Math.ceil(a[2]);
	  out[3] = Math.ceil(a[3]);
	  return out;
	}

	/**
	 * Math.floor the components of a vec4
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a vector to floor
	 * @returns {vec4} out
	 */
	function floor$1(out, a) {
	  out[0] = Math.floor(a[0]);
	  out[1] = Math.floor(a[1]);
	  out[2] = Math.floor(a[2]);
	  out[3] = Math.floor(a[3]);
	  return out;
	}

	/**
	 * Returns the minimum of two vec4's
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @returns {vec4} out
	 */
	function min$1(out, a, b) {
	  out[0] = Math.min(a[0], b[0]);
	  out[1] = Math.min(a[1], b[1]);
	  out[2] = Math.min(a[2], b[2]);
	  out[3] = Math.min(a[3], b[3]);
	  return out;
	}

	/**
	 * Returns the maximum of two vec4's
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @returns {vec4} out
	 */
	function max$1(out, a, b) {
	  out[0] = Math.max(a[0], b[0]);
	  out[1] = Math.max(a[1], b[1]);
	  out[2] = Math.max(a[2], b[2]);
	  out[3] = Math.max(a[3], b[3]);
	  return out;
	}

	/**
	 * Math.round the components of a vec4
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a vector to round
	 * @returns {vec4} out
	 */
	function round$1(out, a) {
	  out[0] = Math.round(a[0]);
	  out[1] = Math.round(a[1]);
	  out[2] = Math.round(a[2]);
	  out[3] = Math.round(a[3]);
	  return out;
	}

	/**
	 * Scales a vec4 by a scalar number
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the vector to scale
	 * @param {Number} b amount to scale the vector by
	 * @returns {vec4} out
	 */
	function scale$5(out, a, b) {
	  out[0] = a[0] * b;
	  out[1] = a[1] * b;
	  out[2] = a[2] * b;
	  out[3] = a[3] * b;
	  return out;
	}

	/**
	 * Adds two vec4's after scaling the second operand by a scalar value
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @param {Number} scale the amount to scale b by before adding
	 * @returns {vec4} out
	 */
	function scaleAndAdd$1(out, a, b, scale) {
	  out[0] = a[0] + b[0] * scale;
	  out[1] = a[1] + b[1] * scale;
	  out[2] = a[2] + b[2] * scale;
	  out[3] = a[3] + b[3] * scale;
	  return out;
	}

	/**
	 * Calculates the euclidian distance between two vec4's
	 *
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @returns {Number} distance between a and b
	 */
	function distance$1(a, b) {
	  var x = b[0] - a[0];
	  var y = b[1] - a[1];
	  var z = b[2] - a[2];
	  var w = b[3] - a[3];
	  return Math.sqrt(x * x + y * y + z * z + w * w);
	}

	/**
	 * Calculates the squared euclidian distance between two vec4's
	 *
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @returns {Number} squared distance between a and b
	 */
	function squaredDistance$1(a, b) {
	  var x = b[0] - a[0];
	  var y = b[1] - a[1];
	  var z = b[2] - a[2];
	  var w = b[3] - a[3];
	  return x * x + y * y + z * z + w * w;
	}

	/**
	 * Calculates the length of a vec4
	 *
	 * @param {vec4} a vector to calculate length of
	 * @returns {Number} length of a
	 */
	function length$1(a) {
	  var x = a[0];
	  var y = a[1];
	  var z = a[2];
	  var w = a[3];
	  return Math.sqrt(x * x + y * y + z * z + w * w);
	}

	/**
	 * Calculates the squared length of a vec4
	 *
	 * @param {vec4} a vector to calculate squared length of
	 * @returns {Number} squared length of a
	 */
	function squaredLength$1(a) {
	  var x = a[0];
	  var y = a[1];
	  var z = a[2];
	  var w = a[3];
	  return x * x + y * y + z * z + w * w;
	}

	/**
	 * Negates the components of a vec4
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a vector to negate
	 * @returns {vec4} out
	 */
	function negate$1(out, a) {
	  out[0] = -a[0];
	  out[1] = -a[1];
	  out[2] = -a[2];
	  out[3] = -a[3];
	  return out;
	}

	/**
	 * Returns the inverse of the components of a vec4
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a vector to invert
	 * @returns {vec4} out
	 */
	function inverse$1(out, a) {
	  out[0] = 1.0 / a[0];
	  out[1] = 1.0 / a[1];
	  out[2] = 1.0 / a[2];
	  out[3] = 1.0 / a[3];
	  return out;
	}

	/**
	 * Normalize a vec4
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a vector to normalize
	 * @returns {vec4} out
	 */
	function normalize$1(out, a) {
	  var x = a[0];
	  var y = a[1];
	  var z = a[2];
	  var w = a[3];
	  var len = x * x + y * y + z * z + w * w;
	  if (len > 0) {
	    len = 1 / Math.sqrt(len);
	    out[0] = x * len;
	    out[1] = y * len;
	    out[2] = z * len;
	    out[3] = w * len;
	  }
	  return out;
	}

	/**
	 * Calculates the dot product of two vec4's
	 *
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @returns {Number} dot product of a and b
	 */
	function dot$1(a, b) {
	  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
	}

	/**
	 * Performs a linear interpolation between two vec4's
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
	 * @returns {vec4} out
	 */
	function lerp$2(out, a, b, t) {
	  var ax = a[0];
	  var ay = a[1];
	  var az = a[2];
	  var aw = a[3];
	  out[0] = ax + t * (b[0] - ax);
	  out[1] = ay + t * (b[1] - ay);
	  out[2] = az + t * (b[2] - az);
	  out[3] = aw + t * (b[3] - aw);
	  return out;
	}

	/**
	 * Generates a random vector with the given scale
	 *
	 * @param {vec4} out the receiving vector
	 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
	 * @returns {vec4} out
	 */
	function random$1(out, scale) {
	  scale = scale || 1.0;

	  // Marsaglia, George. Choosing a Point from the Surface of a
	  // Sphere. Ann. Math. Statist. 43 (1972), no. 2, 645--646.
	  // http://projecteuclid.org/euclid.aoms/1177692644;
	  var v1, v2, v3, v4;
	  var s1, s2;
	  do {
	    v1 = RANDOM() * 2 - 1;
	    v2 = RANDOM() * 2 - 1;
	    s1 = v1 * v1 + v2 * v2;
	  } while (s1 >= 1);
	  do {
	    v3 = RANDOM() * 2 - 1;
	    v4 = RANDOM() * 2 - 1;
	    s2 = v3 * v3 + v4 * v4;
	  } while (s2 >= 1);

	  var d = Math.sqrt((1 - s1) / s2);
	  out[0] = scale * v1;
	  out[1] = scale * v2;
	  out[2] = scale * v3 * d;
	  out[3] = scale * v4 * d;
	  return out;
	}

	/**
	 * Transforms the vec4 with a mat4.
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the vector to transform
	 * @param {mat4} m matrix to transform with
	 * @returns {vec4} out
	 */
	function transformMat4$1(out, a, m) {
	  var x = a[0],
	      y = a[1],
	      z = a[2],
	      w = a[3];
	  out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
	  out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
	  out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
	  out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
	  return out;
	}

	/**
	 * Transforms the vec4 with a quat
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the vector to transform
	 * @param {quat} q quaternion to transform with
	 * @returns {vec4} out
	 */
	function transformQuat$1(out, a, q) {
	  var x = a[0],
	      y = a[1],
	      z = a[2];
	  var qx = q[0],
	      qy = q[1],
	      qz = q[2],
	      qw = q[3];

	  // calculate quat * vec
	  var ix = qw * x + qy * z - qz * y;
	  var iy = qw * y + qz * x - qx * z;
	  var iz = qw * z + qx * y - qy * x;
	  var iw = -qx * x - qy * y - qz * z;

	  // calculate result * inverse quat
	  out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
	  out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
	  out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
	  out[3] = a[3];
	  return out;
	}

	/**
	 * Returns a string representation of a vector
	 *
	 * @param {vec4} a vector to represent as a string
	 * @returns {String} string representation of the vector
	 */
	function str$5(a) {
	  return 'vec4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
	}

	/**
	 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
	 *
	 * @param {vec4} a The first vector.
	 * @param {vec4} b The second vector.
	 * @returns {Boolean} True if the vectors are equal, false otherwise.
	 */
	function exactEquals$5(a, b) {
	  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
	}

	/**
	 * Returns whether or not the vectors have approximately the same elements in the same position.
	 *
	 * @param {vec4} a The first vector.
	 * @param {vec4} b The second vector.
	 * @returns {Boolean} True if the vectors are equal, false otherwise.
	 */
	function equals$6(a, b) {
	  var a0 = a[0],
	      a1 = a[1],
	      a2 = a[2],
	      a3 = a[3];
	  var b0 = b[0],
	      b1 = b[1],
	      b2 = b[2],
	      b3 = b[3];
	  return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3));
	}

	/**
	 * Alias for {@link vec4.subtract}
	 * @function
	 */
	var sub$5 = subtract$5;

	/**
	 * Alias for {@link vec4.multiply}
	 * @function
	 */
	var mul$5 = multiply$5;

	/**
	 * Alias for {@link vec4.divide}
	 * @function
	 */
	var div$1 = divide$1;

	/**
	 * Alias for {@link vec4.distance}
	 * @function
	 */
	var dist$1 = distance$1;

	/**
	 * Alias for {@link vec4.squaredDistance}
	 * @function
	 */
	var sqrDist$1 = squaredDistance$1;

	/**
	 * Alias for {@link vec4.length}
	 * @function
	 */
	var len$1 = length$1;

	/**
	 * Alias for {@link vec4.squaredLength}
	 * @function
	 */
	var sqrLen$1 = squaredLength$1;

	/**
	 * Perform some operation over an array of vec4s.
	 *
	 * @param {Array} a the array of vectors to iterate over
	 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
	 * @param {Number} offset Number of elements to skip at the beginning of the array
	 * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
	 * @param {Function} fn Function to call for each vector in the array
	 * @param {Object} [arg] additional argument to pass to fn
	 * @returns {Array} a
	 * @function
	 */
	var forEach$1 = function () {
	  var vec = create$5();

	  return function (a, stride, offset, count, fn, arg) {
	    var i = void 0,
	        l = void 0;
	    if (!stride) {
	      stride = 4;
	    }

	    if (!offset) {
	      offset = 0;
	    }

	    if (count) {
	      l = Math.min(count * stride + offset, a.length);
	    } else {
	      l = a.length;
	    }

	    for (i = offset; i < l; i += stride) {
	      vec[0] = a[i];vec[1] = a[i + 1];vec[2] = a[i + 2];vec[3] = a[i + 3];
	      fn(vec, vec, arg);
	      a[i] = vec[0];a[i + 1] = vec[1];a[i + 2] = vec[2];a[i + 3] = vec[3];
	    }

	    return a;
	  };
	}();

	var vec4 = /*#__PURE__*/Object.freeze({
		create: create$5,
		clone: clone$5,
		fromValues: fromValues$5,
		copy: copy$5,
		set: set$6,
		add: add$5,
		subtract: subtract$5,
		multiply: multiply$5,
		divide: divide$1,
		ceil: ceil$1,
		floor: floor$1,
		min: min$1,
		max: max$1,
		round: round$1,
		scale: scale$5,
		scaleAndAdd: scaleAndAdd$1,
		distance: distance$1,
		squaredDistance: squaredDistance$1,
		length: length$1,
		squaredLength: squaredLength$1,
		negate: negate$1,
		inverse: inverse$1,
		normalize: normalize$1,
		dot: dot$1,
		lerp: lerp$2,
		random: random$1,
		transformMat4: transformMat4$1,
		transformQuat: transformQuat$1,
		str: str$5,
		exactEquals: exactEquals$5,
		equals: equals$6,
		sub: sub$5,
		mul: mul$5,
		div: div$1,
		dist: dist$1,
		sqrDist: sqrDist$1,
		len: len$1,
		sqrLen: sqrLen$1,
		forEach: forEach$1
	});

	/**
	 * Quaternion
	 * @module quat
	 */

	/**
	 * Creates a new identity quat
	 *
	 * @returns {quat} a new quaternion
	 */
	function create$6() {
	  var out = new ARRAY_TYPE(4);
	  if (ARRAY_TYPE != Float32Array) {
	    out[0] = 0;
	    out[1] = 0;
	    out[2] = 0;
	  }
	  out[3] = 1;
	  return out;
	}

	/**
	 * Sets a quat from the given angle and rotation axis,
	 * then returns it.
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {vec3} axis the axis around which to rotate
	 * @param {Number} rad the angle in radians
	 * @returns {quat} out
	 **/
	function setAxisAngle(out, axis, rad) {
	  rad = rad * 0.5;
	  var s = Math.sin(rad);
	  out[0] = s * axis[0];
	  out[1] = s * axis[1];
	  out[2] = s * axis[2];
	  out[3] = Math.cos(rad);
	  return out;
	}

	/**
	 * Performs a spherical linear interpolation between two quat
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a the first operand
	 * @param {quat} b the second operand
	 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
	 * @returns {quat} out
	 */
	function slerp(out, a, b, t) {
	  // benchmarks:
	  //    http://jsperf.com/quaternion-slerp-implementations
	  var ax = a[0],
	      ay = a[1],
	      az = a[2],
	      aw = a[3];
	  var bx = b[0],
	      by = b[1],
	      bz = b[2],
	      bw = b[3];

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
	  if (1.0 - cosom > EPSILON) {
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
	}

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
	function fromMat3(out, m) {
	  // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
	  // article "Quaternion Calculus and Fast Animation".
	  var fTrace = m[0] + m[4] + m[8];
	  var fRoot = void 0;

	  if (fTrace > 0.0) {
	    // |w| > 1/2, may as well choose w > 1/2
	    fRoot = Math.sqrt(fTrace + 1.0); // 2w
	    out[3] = 0.5 * fRoot;
	    fRoot = 0.5 / fRoot; // 1/(4w)
	    out[0] = (m[5] - m[7]) * fRoot;
	    out[1] = (m[6] - m[2]) * fRoot;
	    out[2] = (m[1] - m[3]) * fRoot;
	  } else {
	    // |w| <= 1/2
	    var i = 0;
	    if (m[4] > m[0]) i = 1;
	    if (m[8] > m[i * 3 + i]) i = 2;
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
	}

	/**
	 * Normalize a quat
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a quaternion to normalize
	 * @returns {quat} out
	 * @function
	 */
	var normalize$2 = normalize$1;

	/**
	 * Sets a quaternion to represent the shortest rotation from one
	 * vector to another.
	 *
	 * Both vectors are assumed to be unit length.
	 *
	 * @param {quat} out the receiving quaternion.
	 * @param {vec3} a the initial vector
	 * @param {vec3} b the destination vector
	 * @returns {quat} out
	 */
	var rotationTo = function () {
	  var tmpvec3 = create$4();
	  var xUnitVec3 = fromValues$4(1, 0, 0);
	  var yUnitVec3 = fromValues$4(0, 1, 0);

	  return function (out, a, b) {
	    var dot$$1 = dot(a, b);
	    if (dot$$1 < -0.999999) {
	      cross(tmpvec3, xUnitVec3, a);
	      if (len(tmpvec3) < 0.000001) cross(tmpvec3, yUnitVec3, a);
	      normalize(tmpvec3, tmpvec3);
	      setAxisAngle(out, tmpvec3, Math.PI);
	      return out;
	    } else if (dot$$1 > 0.999999) {
	      out[0] = 0;
	      out[1] = 0;
	      out[2] = 0;
	      out[3] = 1;
	      return out;
	    } else {
	      cross(tmpvec3, a, b);
	      out[0] = tmpvec3[0];
	      out[1] = tmpvec3[1];
	      out[2] = tmpvec3[2];
	      out[3] = 1 + dot$$1;
	      return normalize$2(out, out);
	    }
	  };
	}();

	/**
	 * Performs a spherical linear interpolation with two control points
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a the first operand
	 * @param {quat} b the second operand
	 * @param {quat} c the third operand
	 * @param {quat} d the fourth operand
	 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
	 * @returns {quat} out
	 */
	var sqlerp = function () {
	  var temp1 = create$6();
	  var temp2 = create$6();

	  return function (out, a, b, c, d, t) {
	    slerp(temp1, a, d, t);
	    slerp(temp2, b, c, t);
	    slerp(out, temp1, temp2, 2 * t * (1 - t));

	    return out;
	  };
	}();

	/**
	 * Sets the specified quaternion with values corresponding to the given
	 * axes. Each axis is a vec3 and is expected to be unit length and
	 * perpendicular to all other specified axes.
	 *
	 * @param {vec3} view  the vector representing the viewing direction
	 * @param {vec3} right the vector representing the local "right" direction
	 * @param {vec3} up    the vector representing the local "up" direction
	 * @returns {quat} out
	 */
	var setAxes = function () {
	  var matr = create$2();

	  return function (out, view, right, up) {
	    matr[0] = right[0];
	    matr[3] = right[1];
	    matr[6] = right[2];

	    matr[1] = up[0];
	    matr[4] = up[1];
	    matr[7] = up[2];

	    matr[2] = -view[0];
	    matr[5] = -view[1];
	    matr[8] = -view[2];

	    return normalize$2(out, fromMat3(out, matr));
	  };
	}();

	/**
	 * 2 Dimensional Vector
	 * @module vec2
	 */

	/**
	 * Creates a new, empty vec2
	 *
	 * @returns {vec2} a new 2D vector
	 */
	function create$8() {
	  var out = new ARRAY_TYPE(2);
	  if (ARRAY_TYPE != Float32Array) {
	    out[0] = 0;
	    out[1] = 0;
	  }
	  return out;
	}

	/**
	 * Perform some operation over an array of vec2s.
	 *
	 * @param {Array} a the array of vectors to iterate over
	 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
	 * @param {Number} offset Number of elements to skip at the beginning of the array
	 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
	 * @param {Function} fn Function to call for each vector in the array
	 * @param {Object} [arg] additional argument to pass to fn
	 * @returns {Array} a
	 * @function
	 */
	var forEach$2 = function () {
	  var vec = create$8();

	  return function (a, stride, offset, count, fn, arg) {
	    var i = void 0,
	        l = void 0;
	    if (!stride) {
	      stride = 2;
	    }

	    if (!offset) {
	      offset = 0;
	    }

	    if (count) {
	      l = Math.min(count * stride + offset, a.length);
	    } else {
	      l = a.length;
	    }

	    for (i = offset; i < l; i += stride) {
	      vec[0] = a[i];vec[1] = a[i + 1];
	      fn(vec, vec, arg);
	      a[i] = vec[0];a[i + 1] = vec[1];
	    }

	    return a;
	  };
	}();

	var T = [0, 0, 0],
	    R = [0, 0, 0, 1],
	    S = [1, 1, 1];
	var DEFAULT_VALUES = {
	  TRANSLATION: [0, 0, 0],
	  ROTATION: [0, 0, 0, 1],
	  SCALE: [1, 1, 1]
	};
	var CLIP_PRENEXT = {
	  PREVIOUS: null,
	  NEXT: null,
	  PREINDEX: null,
	  NEXTINDEX: null,
	  INTERPOLATION: null
	};
	var AnimationClip = {
	  _getTRSW: function _getTRSW(gltf, node, time, translation, rotation, scale$$1, weights) {
	    var animations = gltf.animations;

	    for (var i = 0; i < animations.length; i++) {
	      var animation = animations[i];
	      var channels = animation.channels;

	      for (var j = 0; j < channels.length; j++) {
	        var channel = channels[j];

	        if (channel.target.node === node) {
	          if (channel.target.path === 'translation') {
	            this._getAnimateData(translation, animation.samplers[channel.sampler], time, 1);
	          } else if (channel.target.path === 'rotation') {
	            this._getQuaternion(rotation, animation.samplers[channel.sampler], time, 1);
	          } else if (channel.target.path === 'scale') {
	            this._getAnimateData(scale$$1, animation.samplers[channel.sampler], time, 1);
	          } else if (channel.target.path === 'weights' && weights) {
	            this._getAnimateData(weights, animation.samplers[channel.sampler], time, weights.length);
	          }
	        }
	      }
	    }
	  },
	  _getAnimateData: function _getAnimateData(out, sampler, time, stride) {
	    switch (sampler.interpolation) {
	      case 'LINEAR':
	        {
	          var preNext = this._getPreNext(CLIP_PRENEXT, sampler, time, 1 * stride);

	          if (preNext) {
	            out = lerp(out, preNext.PREVIOUS, preNext.NEXT, preNext.INTERPOLATION);
	          }

	          break;
	        }

	      case 'STEP':
	        {
	          var _preNext = this._getPreNext(CLIP_PRENEXT, sampler, time, 1 * stride);

	          if (_preNext) {
	            out = set.apply(void 0, [out].concat(_preNext.PREVIOUS));
	          }

	          break;
	        }

	      case 'CUBICSPLINE':
	        {
	          var _preNext2 = this._getPreNext(CLIP_PRENEXT, sampler, time, 3 * stride);

	          if (_preNext2) {
	            out = this._getCubicSpline(out, _preNext2, sampler.input.array, 3 * stride);
	          }

	          break;
	        }
	    }

	    return out;
	  },
	  _getQuaternion: function _getQuaternion(out, sampler, time) {
	    switch (sampler.interpolation) {
	      case 'LINEAR':
	        {
	          var preNext = this._getPreNext(CLIP_PRENEXT, sampler, time, 1);

	          if (preNext) {
	            slerp(out, preNext.PREVIOUS, preNext.NEXT, preNext.INTERPOLATION);
	          }

	          break;
	        }

	      case 'STEP':
	        {
	          var _preNext3 = this._getPreNext(CLIP_PRENEXT, sampler, time, 1);

	          if (_preNext3) {
	            out = set$6.apply(vec4, [out].concat(_preNext3.PREVIOUS));
	          }

	          break;
	        }

	      case 'CUBICSPLINE':
	        {
	          var _preNext4 = this._getPreNext(CLIP_PRENEXT, sampler, time, 3);

	          if (_preNext4) {
	            for (var i = 0; i < _preNext4.PREVIOUS.length; i++) {
	              _preNext4.PREVIOUS[i] = Math.acos(_preNext4.PREVIOUS[i]);
	              _preNext4.NEXT[i] = Math.acos(_preNext4.NEXT[i]);
	            }

	            out = this._getCubicSpline(out, _preNext4, sampler.input.array, 3);

	            for (var j = 0; j < out.length; j++) {
	              out[j] = Math.cos(out[j]);
	            }
	          }

	          break;
	        }
	    }

	    return out;
	  },
	  _getPreNext: function _getPreNext(out, sampler, time, stride) {
	    var input = sampler.input.array;
	    var output = sampler.output.array;
	    var itemSize = sampler.output.itemSize;

	    if (time < input[0] || time > input[input.length - 1]) {
	      time = Math.max(input[0], Math.min(input[input.length - 1], time));
	    }

	    if (time === input[input.length - 1]) {
	      time = input[0];
	    }

	    var preIndx, nextIndex, interpolation;

	    for (var i = 0; i < input.length - 1; i++) {
	      if (time >= input[i] && time < input[i + 1]) {
	        var previousTime = input[i];
	        var nextTime = input[i + 1];
	        preIndx = i;
	        nextIndex = i + 1;
	        interpolation = (time - previousTime) / (nextTime - previousTime);
	        break;
	      }
	    }

	    if (!nextIndex) {
	      return null;
	    }

	    out.PREINDEX = preIndx;
	    out.NEXTINDEX = nextIndex;
	    out.INTERPOLATION = interpolation;
	    var width = itemSize * stride;
	    out.PREVIOUS = output.subarray(out.PREINDEX * width, (out.PREINDEX + 1) * width);
	    out.NEXT = output.subarray(out.NEXTINDEX * width, (out.NEXTINDEX + 1) * width);
	    return out;
	  },
	  _getCubicSpline: function _getCubicSpline(out, preNext, input, length$$1) {
	    var t = preNext.INTERPOLATION;
	    var tk = input[preNext.PREINDEX];
	    var tk1 = input[preNext.NEXTINDEX];

	    for (var i = 0; i < 3; i++) {
	      var p0 = preNext.PREVIOUS[length$$1 + i];
	      var m0 = (tk1 - tk) * preNext.PREVIOUS[length$$1 * 2 + i];
	      var p1 = preNext.NEXT[3 + i];
	      var m1 = (tk1 - tk) * preNext.NEXT[i];
	      var pti = (Math.pow(t, 3) * 2 - Math.pow(t, 2) * 3 + 1) * p0 + (Math.pow(t, 3) - Math.pow(t, 2) * 2 + t) * m0 + (-Math.pow(t, 3) * 2 + Math.pow(t, 2) * 3) * p1 + (Math.pow(t, 3) - Math.pow(t, 2)) * m1;
	      out[i] = pti;
	    }

	    return out;
	  },
	  getAnimationClip: function getAnimationClip(animMatrix, gltf, node, time) {
	    var weights = gltf.nodes[node] && gltf.nodes[node].weights;
	    set$5.apply(vec3, [T].concat(DEFAULT_VALUES.TRANSLATION));
	    set$6.apply(vec4, [R].concat(DEFAULT_VALUES.ROTATION));
	    set$5.apply(vec3, [S].concat(DEFAULT_VALUES.SCALE));

	    this._getTRSW(gltf, node, time, T, R, S, weights);

	    fromRotationTranslationScale(animMatrix, R, T, S);
	  },
	  getTimeSpan: function getTimeSpan(gltf) {
	    if (!gltf.animations) {
	      return null;
	    }

	    var max$$1 = -Infinity,
	        min$$1 = Infinity;
	    var animations = gltf.animations;
	    animations.forEach(function (animation) {
	      var channels = animation.channels;

	      for (var i = 0; i < channels.length; i++) {
	        var channel = channels[i];
	        var sampler = animation.samplers[channel.sampler];
	        var input = sampler.input.array;

	        if (input[input.length - 1] > max$$1) {
	          max$$1 = input[input.length - 1];
	        }

	        if (input[0] < min$$1) {
	          min$$1 = input[0];
	        }
	      }
	    });
	    return {
	      max: max$$1,
	      min: min$$1
	    };
	  }
	};

	var canvas = typeof document === 'undefined' ? null : document.createElement('canvas');

	var GLTFLoader = function () {
	  function GLTFLoader(rootPath, gltf, options) {
	    this.options = options || {};

	    if (gltf.buffer instanceof ArrayBuffer) {
	      var _GLBReader$read = GLBReader.read(gltf.buffer, gltf.byteOffset),
	          json = _GLBReader$read.json,
	          glbBuffer = _GLBReader$read.glbBuffer;

	      this._init(rootPath, json, glbBuffer);
	    } else {
	      this._init(rootPath, gltf);
	    }
	  }

	  var _proto = GLTFLoader.prototype;

	  _proto.load = function load() {
	    var gltf = this._loadScene();

	    var animations = this._loadAnimations();

	    return Promise$1.all([gltf, animations]).then(function (fullfilled) {
	      fullfilled[0].animations = fullfilled[1];
	      return fullfilled[0];
	    });
	  };

	  GLTFLoader.getAnimationClip = function getAnimationClip(animMatrix, gltf, node, time) {
	    return AnimationClip.getAnimationClip(animMatrix, gltf, node, time);
	  };

	  GLTFLoader.getAnimationTimeSpan = function getAnimationTimeSpan(gltf) {
	    return AnimationClip.getTimeSpan(gltf);
	  };

	  _proto._init = function _init(rootPath, gltf, glbBuffer) {
	    this.gltf = gltf;
	    this.version = gltf.asset ? +gltf.asset.version : 1;
	    this.rootPath = rootPath;
	    this.glbBuffer = glbBuffer;
	    this.buffers = {};
	    this.requests = {};
	    this.accessor = new Accessor(rootPath, gltf, glbBuffer);
	    this.options.requestImage = this.options.requestImage || requestImage;

	    if (this.version === 2) {
	      this.adapter = new V2(rootPath, gltf, glbBuffer, this.options.requestImage);
	    } else {
	      this.adapter = new V1(rootPath, gltf);
	    }
	  };

	  _proto._parseNodes = function _parseNodes(node, nodeMap) {
	    var _this = this;

	    if (node.children && node.children.length > 0) {
	      if (!isNumber(node.children[0]) && !isString(node.children[0])) {
	        return node;
	      }

	      var children = node.children.map(function (c) {
	        var childNode = nodeMap[c];
	        childNode.nodeIndex = c;
	        return _this._parseNodes(childNode, nodeMap);
	      });
	      node.children = children;
	    }

	    if (defined(node.skin)) {
	      var skinJoints = node.skin.joints;

	      if (skinJoints && skinJoints.length && isNumber(skinJoints[0])) {
	        var joints = node.skin.joints.map(function (j) {
	          return nodeMap[j];
	        });
	        node.skin.joints = joints;
	      }
	    }

	    return node;
	  };

	  _proto._loadScene = function _loadScene() {
	    var _this2 = this;

	    return this._loadNodes().then(function (nodeMap) {
	      var scenes = _this2.scenes = [];
	      var defaultScene;

	      for (var index in nodeMap) {
	        nodeMap[index] = _this2._parseNodes(nodeMap[index], nodeMap);
	        nodeMap[index].nodeIndex = Number(index) ? Number(index) : index;
	      }

	      _this2.adapter.iterate(function (key, sceneJSON, idx) {
	        var scene = {};
	        if (sceneJSON.name) scene.name = sceneJSON.name;

	        if (sceneJSON.nodes) {
	          scene.nodes = sceneJSON.nodes.map(function (n) {
	            return nodeMap[n];
	          });
	        }

	        if (_this2.gltf.scene === key) {
	          defaultScene = idx;
	        }

	        scenes.push(scene);
	      }, 'scenes');

	      var gltf = {
	        scene: defaultScene,
	        scenes: scenes,
	        nodes: nodeMap,
	        meshes: _this2.meshes,
	        skins: _this2.skins
	      };

	      if (_this2.gltf.extensions) {
	        gltf.extensions = _this2.gltf.extensions;
	      }

	      return gltf;
	    });
	  };

	  _proto._loadNodes = function _loadNodes() {
	    var _this3 = this;

	    var promise = this._loadMeshes();

	    return promise.then(function () {
	      var nodes = _this3.nodes = {};

	      _this3.adapter.iterate(function (key, nodeJSON) {
	        var node = _this3.adapter.createNode(nodeJSON, _this3.meshes, _this3.skins);

	        nodes[key] = node;
	      }, 'nodes');

	      return nodes;
	    });
	  };

	  _proto._loadSkins = function _loadSkins() {
	    var _this4 = this;

	    this.skins = {};
	    var promises = [];
	    this.adapter.iterate(function (key, skinJSON, index) {
	      promises.push(_this4._loadSkin(skinJSON).then(function (skin) {
	        skin.index = index;
	        _this4.skins[key] = skin;
	      }));
	    }, 'skins');
	    return promises;
	  };

	  _proto._loadSkin = function _loadSkin(skin) {
	    var inverseBindMatrices = skin.inverseBindMatrices;
	    return this.accessor._requestData('inverseBindMatrices', inverseBindMatrices).then(function (res) {
	      skin.inverseBindMatrices = res;
	      return skin;
	    });
	  };

	  _proto._loadAnimations = function _loadAnimations() {
	    var animations = this.gltf.animations;
	    var promise = defined(animations) ? this.adapter.getAnimations(animations) : null;
	    return promise;
	  };

	  _proto._loadMeshes = function _loadMeshes() {
	    var _this5 = this;

	    this.meshes = {};
	    var promises = [];
	    this.adapter.iterate(function (key, meshJSON, index) {
	      promises.push(_this5._loadMesh(meshJSON).then(function (mesh) {
	        mesh.index = index;
	        _this5.meshes[key] = mesh;
	      }));
	    }, 'meshes');
	    promises = promises.concat(this._loadSkins());
	    return Promise$1.all(promises);
	  };

	  _proto._loadMesh = function _loadMesh(mesh) {
	    var _this6 = this;

	    var primitives = mesh.primitives;
	    var promises = primitives.map(function (p) {
	      return _this6._loadPrimitive(p);
	    });
	    return Promise$1.all(promises).then(function (primitives) {
	      var out = {};
	      extend(out, mesh);
	      out.primitives = primitives;
	      return out;
	    });
	  };

	  _proto._loadPrimitive = function _loadPrimitive(primJSON) {
	    var _this7 = this;

	    var promises = [];
	    var attributes = primJSON.attributes;

	    var matPromise = this._loadMaterial(primJSON);

	    if (matPromise) promises.push(matPromise);
	    var material = null;

	    for (var attr in attributes) {
	      var promise = this.accessor._requestData(attr, attributes[attr]);

	      if (promise) {
	        promises.push(promise);
	      }
	    }

	    if (defined(primJSON.indices)) {
	      var _promise = this.accessor._requestData('indices', primJSON.indices);

	      if (_promise) {
	        promises.push(_promise);
	      }
	    }

	    if (defined(primJSON.targets)) {
	      for (var i = 0; i < primJSON.targets.length; i++) {
	        var target = primJSON.targets[i];

	        for (var _attr in target) {
	          var _promise2 = this.accessor._requestData(_attr + "_" + i, target[_attr]);

	          if (_promise2) {
	            promises.push(_promise2);
	          }
	        }
	      }
	    }

	    return Promise$1.all(promises).then(function (assets) {
	      var indices;
	      _this7.transferables = [];
	      var attrData = assets.reduce(function (accumulator, currentValue) {
	        if (currentValue.material) {
	          material = currentValue.material;

	          if (currentValue.transferables) {
	            currentValue.transferables.forEach(function (buffer) {
	              if (_this7.transferables.indexOf(buffer) < 0) {
	                _this7.transferables.push(buffer);
	              }
	            });
	          }
	        } else {
	          if (currentValue.name === 'indices') {
	            indices = currentValue.array;
	          } else {
	            accumulator[currentValue.name] = {
	              array: currentValue.array,
	              itemSize: currentValue.itemSize,
	              accessorName: currentValue.accessorName
	            };
	          }

	          if (_this7.transferables.indexOf(currentValue.array.buffer) < 0) {
	            _this7.transferables.push(currentValue.array.buffer);
	          }
	        }

	        return accumulator;
	      }, {});
	      var primitive = {
	        attributes: attrData,
	        material: material
	      };
	      if (indices) primitive.indices = indices;
	      primitive.mode = defined(primJSON.mode) ? primJSON.mode : 4;
	      if (defined(primJSON.extras)) primitive.extras = primJSON.extras;
	      return primitive;
	    });
	  };

	  _proto._loadMaterial = function _loadMaterial(primJSON) {
	    var material = primJSON.material;

	    if (this.version === 2) {
	      if (!defined(material)) {
	        return null;
	      }

	      var matPromise = this.adapter.getMaterial(material);
	      return matPromise;
	    }

	    var texture = this.adapter.getBaseColorTexture(material);

	    if (!texture) {
	      return null;
	    }

	    var promise = this._loadImage(texture.source);

	    return promise.then(function (image) {
	      var transferables = [image.buffer];
	      var source = texture.source;
	      image.index = source;
	      extend(texture.source, source);
	      texture.source.image = image;
	      var result = {
	        baseColorTexture: texture
	      };
	      if (material.name) result.name = material.name;
	      if (material.extensions) result.extensions = material.extensions;

	      if (result.extensions) {
	        delete result.extensions['KHR_binary_glTF'];
	        delete result.extensions['binary_glTF'];

	        if (Object.keys(result.extensions).length === 0) {
	          delete result.extensions;
	        }
	      }

	      if (material.extras) result.extras = material.extras;
	      return {
	        material: result,
	        transferables: transferables
	      };
	    });
	  };

	  _proto._loadImage = function _loadImage(source) {
	    var _this8 = this;

	    if (source.bufferView || source.extensions && (source.extensions['KHR_binary_glTF'] || source.extensions['binary_glTF'])) {
	      var binary = source.bufferView ? source : source.extensions['KHR_binary_glTF'] || source.extensions['binary_glTF'];

	      if (source.extensions) {
	        source.mimeType = binary.mimeType;
	        source.width = binary.width;
	        source.height = binary.height;
	      }

	      if (this.buffers[binary.bufferView]) {
	        return Promise$1.resolve(this.buffers[binary.bufferView]);
	      }

	      var bufferView = this.gltf.bufferViews[binary.bufferView];
	      var start = (bufferView.byteOffset || 0) + this.glbBuffer.byteOffset;
	      var length = bufferView.byteLength;
	      var buffer = this.buffers[binary.bufferView] = new Uint8Array(this.glbBuffer.buffer, start, length);
	      return Promise$1.resolve(buffer);
	    } else {
	      var bin = source.uri;
	      var url = this.rootPath + '/' + bin;

	      if (this.requests[url]) {
	        return this.requests[url].then(function () {
	          return _this8.buffers[url];
	        });
	      }

	      var promise = this.requests[url] = Ajax.getArrayBuffer(url, null).then(function (response) {
	        var buffer = response.data;
	        _this8.buffers[url] = buffer;
	        return new Uint8Array(buffer);
	      });
	      return promise;
	    }
	  };

	  return GLTFLoader;
	}();

	function requestImage(url, cb) {
	  var image = new Image();
	  image.crossOrigin = '';

	  image.onload = function () {
	    if (!canvas) {
	      cb(new Error('There is no canvas to draw image!'));
	      return;
	    }

	    canvas.width = image.width;
	    canvas.height = image.height;
	    var ctx = canvas.getContext('2d');
	    ctx.drawImage(image, 0, 0, image.width, image.height);
	    var imgData = ctx.getImageData(0, 0, image.width, image.height);
	    var result = {
	      width: image.width,
	      height: image.height,
	      data: new Uint8Array(imgData.data)
	    };
	    cb(null, result);
	  };

	  image.onerror = function (err) {
	    cb(err);
	  };

	  image.src = url;
	}

	exports.GLTFLoader = GLTFLoader;
	exports.Ajax = Ajax;

	Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2x0Zi1sb2FkZXIuanMiLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy96b3VzYW4vem91c2FuLW1pbi5qcyIsIi4uL3NyYy9jb3JlL1Byb21pc2UuanMiLCIuLi9zcmMvY29yZS9BamF4LmpzIiwiLi4vc3JjL2NvbW1vbi9VdGlsLmpzIiwiLi4vc3JjL2FkYXB0ZXJzL0dMVEZWMS5qcyIsIi4uL3NyYy9jb3JlL0FjY2Vzc29yLmpzIiwiLi4vc3JjL2FkYXB0ZXJzL0dMVEZWMi5qcyIsIi4uL3NyYy9HTEJSZWFkZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvZ2wtbWF0cml4L2xpYi9nbC1tYXRyaXgvY29tbW9uLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2dsLW1hdHJpeC9saWIvZ2wtbWF0cml4L21hdDMuanMiLCIuLi9ub2RlX21vZHVsZXMvZ2wtbWF0cml4L2xpYi9nbC1tYXRyaXgvbWF0NC5qcyIsIi4uL25vZGVfbW9kdWxlcy9nbC1tYXRyaXgvbGliL2dsLW1hdHJpeC92ZWMzLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2dsLW1hdHJpeC9saWIvZ2wtbWF0cml4L3ZlYzQuanMiLCIuLi9ub2RlX21vZHVsZXMvZ2wtbWF0cml4L2xpYi9nbC1tYXRyaXgvcXVhdC5qcyIsIi4uL25vZGVfbW9kdWxlcy9nbC1tYXRyaXgvbGliL2dsLW1hdHJpeC92ZWMyLmpzIiwiLi4vc3JjL2NvcmUvQW5pbWF0aW9uQ2xpcC5qcyIsIi4uL3NyYy9HTFRGTG9hZGVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIiFmdW5jdGlvbihpKXtcInVzZSBzdHJpY3RcIjt2YXIgYyxzLHU9XCJmdWxmaWxsZWRcIixmPVwidW5kZWZpbmVkXCIsYT1mdW5jdGlvbigpe3ZhciBlPVtdLG49MDtmdW5jdGlvbiBvKCl7Zm9yKDtlLmxlbmd0aC1uOyl7dHJ5e2Vbbl0oKX1jYXRjaCh0KXtpLmNvbnNvbGUmJmkuY29uc29sZS5lcnJvcih0KX1lW24rK109cywxMDI0PT1uJiYoZS5zcGxpY2UoMCwxMDI0KSxuPTApfX12YXIgcj1mdW5jdGlvbigpe2lmKHR5cGVvZiBNdXRhdGlvbk9ic2VydmVyPT09ZilyZXR1cm4gdHlwZW9mIHByb2Nlc3MhPT1mJiZcImZ1bmN0aW9uXCI9PXR5cGVvZiBwcm9jZXNzLm5leHRUaWNrP2Z1bmN0aW9uKCl7cHJvY2Vzcy5uZXh0VGljayhvKX06dHlwZW9mIHNldEltbWVkaWF0ZSE9PWY/ZnVuY3Rpb24oKXtzZXRJbW1lZGlhdGUobyl9OmZ1bmN0aW9uKCl7c2V0VGltZW91dChvLDApfTt2YXIgdD1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO3JldHVybiBuZXcgTXV0YXRpb25PYnNlcnZlcihvKS5vYnNlcnZlKHQse2F0dHJpYnV0ZXM6ITB9KSxmdW5jdGlvbigpe3Quc2V0QXR0cmlidXRlKFwiYVwiLDApfX0oKTtyZXR1cm4gZnVuY3Rpb24odCl7ZS5wdXNoKHQpLGUubGVuZ3RoLW49PTEmJnIoKX19KCk7ZnVuY3Rpb24gbCh0KXtpZighKHRoaXMgaW5zdGFuY2VvZiBsKSl0aHJvdyBuZXcgVHlwZUVycm9yKFwiWm91c2FuIG11c3QgYmUgY3JlYXRlZCB3aXRoIHRoZSBuZXcga2V5d29yZFwiKTtpZihcImZ1bmN0aW9uXCI9PXR5cGVvZiB0KXt2YXIgZT10aGlzO3RyeXt0KGZ1bmN0aW9uKHQpe2UucmVzb2x2ZSh0KX0sZnVuY3Rpb24odCl7ZS5yZWplY3QodCl9KX1jYXRjaCh0KXtlLnJlamVjdCh0KX19ZWxzZSBpZigwPGFyZ3VtZW50cy5sZW5ndGgpdGhyb3cgbmV3IFR5cGVFcnJvcihcIlpvdXNhbiByZXNvbHZlciBcIit0K1wiIGlzIG5vdCBhIGZ1bmN0aW9uXCIpfWZ1bmN0aW9uIGgoZSx0KXtpZihcImZ1bmN0aW9uXCI9PXR5cGVvZiBlLnkpdHJ5e3ZhciBuPWUueS5jYWxsKHMsdCk7ZS5wLnJlc29sdmUobil9Y2F0Y2godCl7ZS5wLnJlamVjdCh0KX1lbHNlIGUucC5yZXNvbHZlKHQpfWZ1bmN0aW9uIHYoZSx0KXtpZihcImZ1bmN0aW9uXCI9PXR5cGVvZiBlLm4pdHJ5e3ZhciBuPWUubi5jYWxsKHMsdCk7ZS5wLnJlc29sdmUobil9Y2F0Y2godCl7ZS5wLnJlamVjdCh0KX1lbHNlIGUucC5yZWplY3QodCl9bC5wcm90b3R5cGU9e3Jlc29sdmU6ZnVuY3Rpb24obil7aWYodGhpcy5zdGF0ZT09PWMpe2lmKG49PT10aGlzKXJldHVybiB0aGlzLnJlamVjdChuZXcgVHlwZUVycm9yKFwiQXR0ZW1wdCB0byByZXNvbHZlIHByb21pc2Ugd2l0aCBzZWxmXCIpKTt2YXIgbz10aGlzO2lmKG4mJihcImZ1bmN0aW9uXCI9PXR5cGVvZiBufHxcIm9iamVjdFwiPT10eXBlb2YgbikpdHJ5e3ZhciBlPSEwLHQ9bi50aGVuO2lmKFwiZnVuY3Rpb25cIj09dHlwZW9mIHQpcmV0dXJuIHZvaWQgdC5jYWxsKG4sZnVuY3Rpb24odCl7ZSYmKGU9ITEsby5yZXNvbHZlKHQpKX0sZnVuY3Rpb24odCl7ZSYmKGU9ITEsby5yZWplY3QodCkpfSl9Y2F0Y2godCl7cmV0dXJuIHZvaWQoZSYmdGhpcy5yZWplY3QodCkpfXRoaXMuc3RhdGU9dSx0aGlzLnY9bixvLmMmJmEoZnVuY3Rpb24oKXtmb3IodmFyIHQ9MCxlPW8uYy5sZW5ndGg7dDxlO3QrKyloKG8uY1t0XSxuKX0pfX0scmVqZWN0OmZ1bmN0aW9uKG4pe2lmKHRoaXMuc3RhdGU9PT1jKXt2YXIgdD10aGlzO3RoaXMuc3RhdGU9XCJyZWplY3RlZFwiLHRoaXMudj1uO3ZhciBvPXRoaXMuYzthKG8/ZnVuY3Rpb24oKXtmb3IodmFyIHQ9MCxlPW8ubGVuZ3RoO3Q8ZTt0KyspdihvW3RdLG4pfTpmdW5jdGlvbigpe3QuaGFuZGxlZHx8IWwuc3VwcHJlc3NVbmNhdWdodFJlamVjdGlvbkVycm9yJiZpLmNvbnNvbGUmJmwud2FybihcIllvdSB1cHNldCBab3VzYW4uIFBsZWFzZSBjYXRjaCByZWplY3Rpb25zOiBcIixuLG4/bi5zdGFjazpudWxsKX0pfX0sdGhlbjpmdW5jdGlvbih0LGUpe3ZhciBuPW5ldyBsLG89e3k6dCxuOmUscDpufTtpZih0aGlzLnN0YXRlPT09Yyl0aGlzLmM/dGhpcy5jLnB1c2gobyk6dGhpcy5jPVtvXTtlbHNle3ZhciByPXRoaXMuc3RhdGUsaT10aGlzLnY7dGhpcy5oYW5kbGVkPSEwLGEoZnVuY3Rpb24oKXtyPT09dT9oKG8saSk6dihvLGkpfSl9cmV0dXJuIG59LGNhdGNoOmZ1bmN0aW9uKHQpe3JldHVybiB0aGlzLnRoZW4obnVsbCx0KX0sZmluYWxseTpmdW5jdGlvbih0KXtyZXR1cm4gdGhpcy50aGVuKHQsdCl9LHRpbWVvdXQ6ZnVuY3Rpb24odCxvKXtvPW98fFwiVGltZW91dFwiO3ZhciByPXRoaXM7cmV0dXJuIG5ldyBsKGZ1bmN0aW9uKGUsbil7c2V0VGltZW91dChmdW5jdGlvbigpe24oRXJyb3IobykpfSx0KSxyLnRoZW4oZnVuY3Rpb24odCl7ZSh0KX0sZnVuY3Rpb24odCl7bih0KX0pfSl9fSxsLnJlc29sdmU9ZnVuY3Rpb24odCl7dmFyIGU9bmV3IGw7cmV0dXJuIGUucmVzb2x2ZSh0KSxlfSxsLnJlamVjdD1mdW5jdGlvbih0KXt2YXIgZT1uZXcgbDtyZXR1cm4gZS5jPVtdLGUucmVqZWN0KHQpLGV9LGwuYWxsPWZ1bmN0aW9uKG4pe3ZhciBvPVtdLHI9MCxpPW5ldyBsO2Z1bmN0aW9uIHQodCxlKXt0JiZcImZ1bmN0aW9uXCI9PXR5cGVvZiB0LnRoZW58fCh0PWwucmVzb2x2ZSh0KSksdC50aGVuKGZ1bmN0aW9uKHQpe29bZV09dCwrK3I9PW4ubGVuZ3RoJiZpLnJlc29sdmUobyl9LGZ1bmN0aW9uKHQpe2kucmVqZWN0KHQpfSl9Zm9yKHZhciBlPTA7ZTxuLmxlbmd0aDtlKyspdChuW2VdLGUpO3JldHVybiBuLmxlbmd0aHx8aS5yZXNvbHZlKG8pLGl9LGwud2Fybj1jb25zb2xlLndhcm4sdHlwZW9mIG1vZHVsZSE9ZiYmbW9kdWxlLmV4cG9ydHMmJihtb2R1bGUuZXhwb3J0cz1sKSxpLmRlZmluZSYmaS5kZWZpbmUuYW1kJiZpLmRlZmluZShbXSxmdW5jdGlvbigpe3JldHVybiBsfSksKGkuWm91c2FuPWwpLnNvb249YX0oXCJ1bmRlZmluZWRcIiE9dHlwZW9mIGdsb2JhbD9nbG9iYWw6dGhpcyk7IiwiaW1wb3J0IFpvdXNhbiBmcm9tICd6b3VzYW4nO1xyXG5cclxubGV0IHByb21pc2U7XHJcblxyXG5pZiAodHlwZW9mIFByb21pc2UgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAvLyBidWlsdC1pbiBQcm9taXNlXHJcbiAgICBwcm9taXNlID0gUHJvbWlzZTtcclxufSBlbHNlIHtcclxuICAgIHByb21pc2UgPSBab3VzYW47XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IHByb21pc2U7XHJcbiIsImltcG9ydCBQcm9taXNlIGZyb20gJy4vUHJvbWlzZSc7XHJcbi8qKlxyXG4gKiBAY2xhc3NkZXNjXHJcbiAqIEFqYXggVXRpbGl0aWVzLiBJdCBpcyBzdGF0aWMgYW5kIHNob3VsZCBub3QgYmUgaW5pdGlhdGVkLlxyXG4gKiBAY2xhc3NcclxuICogQHN0YXRpY1xyXG4gKiBAY2F0ZWdvcnkgY29yZVxyXG4gKi9cclxuY29uc3QgQWpheCA9IHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEZldGNoIHJlbW90ZSByZXNvdXJjZSBieSBIVFRQIFwiR0VUXCIgbWV0aG9kXHJcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9ICAgdXJsIC0gcmVzb3VyY2UgdXJsXHJcbiAgICAgKiBAcGFyYW0gIHtPYmplY3R9ICAgW29wdGlvbnM9bnVsbF0gLSByZXF1ZXN0IG9wdGlvbnNcclxuICAgICAqIEBwYXJhbSAge09iamVjdH0gICBbb3B0aW9ucy5oZWFkZXJzPW51bGxdIC0gSFRUUCBoZWFkZXJzXHJcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9ICAgW29wdGlvbnMucmVzcG9uc2VUeXBlPW51bGxdIC0gcmVzcG9uc2VUeXBlXHJcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9ICAgW29wdGlvbnMuY3JlZGVudGlhbHM9bnVsbF0gIC0gaWYgd2l0aCBjcmVkZW50aWFscywgc2V0IGl0IHRvIFwiaW5jbHVkZVwiXHJcbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2IgIC0gY2FsbGJhY2sgZnVuY3Rpb24gd2hlbiBjb21wbGV0ZWRcclxuICAgICAqIEByZXR1cm4ge0FqYXh9ICBBamF4XHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogbWFwdGFsa3MuQWpheC5nZXQoXHJcbiAgICAgKiAgICAgJ3VybC90by9yZXNvdXJjZScsXHJcbiAgICAgKiAgICAgKGVyciwgZGF0YSkgPT4ge1xyXG4gICAgICogICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgKiAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyKTtcclxuICAgICAqICAgICAgICAgfVxyXG4gICAgICogICAgICAgICAvLyBkbyB0aGluZ3Mgd2l0aCBkYXRhXHJcbiAgICAgKiAgICAgfVxyXG4gICAgICogKTtcclxuICAgICAqL1xyXG4gICAgZ2V0OiBmdW5jdGlvbiAodXJsLCBvcHRpb25zKSB7XHJcbiAgICAgICAgY29uc3QgY2xpZW50ID0gQWpheC5fZ2V0Q2xpZW50KCk7XHJcbiAgICAgICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgY2xpZW50Lm9wZW4oJ0dFVCcsIHVybCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGsgaW4gb3B0aW9ucy5oZWFkZXJzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xpZW50LnNldFJlcXVlc3RIZWFkZXIoaywgb3B0aW9ucy5oZWFkZXJzW2tdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNsaWVudC53aXRoQ3JlZGVudGlhbHMgPSBvcHRpb25zLmNyZWRlbnRpYWxzID09PSAnaW5jbHVkZSc7XHJcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9uc1sncmVzcG9uc2VUeXBlJ10pIHtcclxuICAgICAgICAgICAgICAgICAgICBjbGllbnQucmVzcG9uc2VUeXBlID0gb3B0aW9uc1sncmVzcG9uc2VUeXBlJ107XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2xpZW50Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IEFqYXguX3dyYXBDYWxsYmFjayhjbGllbnQsIGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGEpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgY2xpZW50LnNlbmQobnVsbCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcHJvbWlzZS54aHIgPSBjbGllbnQ7XHJcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIF93cmFwQ2FsbGJhY2s6IGZ1bmN0aW9uIChjbGllbnQsIGNiKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKGNsaWVudC5yZWFkeVN0YXRlID09PSA0KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY2xpZW50LnN0YXR1cyA9PT0gMjAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNsaWVudC5yZXNwb25zZVR5cGUgPT09ICdhcnJheWJ1ZmZlcicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBjbGllbnQucmVzcG9uc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5ieXRlTGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYihuZXcgRXJyb3IoJ2h0dHAgc3RhdHVzIDIwMCByZXR1cm5lZCB3aXRob3V0IGNvbnRlbnQuJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2IobnVsbCwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IGNsaWVudC5yZXNwb25zZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWNoZUNvbnRyb2w6IGNsaWVudC5nZXRSZXNwb25zZUhlYWRlcignQ2FjaGUtQ29udHJvbCcpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGlyZXM6IGNsaWVudC5nZXRSZXNwb25zZUhlYWRlcignRXhwaXJlcycpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRUeXBlIDogY2xpZW50LmdldFJlc3BvbnNlSGVhZGVyKCdDb250ZW50LVR5cGUnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYihudWxsLCBjbGllbnQucmVzcG9uc2VUZXh0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjbGllbnQuc3RhdHVzID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vYWJvcnRlZCB4aHIgcmVxdWVzdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNiKG5ldyBFcnJvcihjbGllbnQuc3RhdHVzVGV4dCArICcsJyArIGNsaWVudC5zdGF0dXMpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIF9nZXRDbGllbnQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvKmVzbGludC1kaXNhYmxlIG5vLWVtcHR5LCBuby11bmRlZiovXHJcbiAgICAgICAgbGV0IGNsaWVudDtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjbGllbnQgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHRyeSB7IGNsaWVudCA9IG5ldyBBY3RpdmVYT2JqZWN0KCdNc3htbDIuWE1MSFRUUCcpOyB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICB0cnkgeyBjbGllbnQgPSBuZXcgQWN0aXZlWE9iamVjdCgnTWljcm9zb2Z0LlhNTEhUVFAnKTsgfSBjYXRjaCAoZSkge31cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGNsaWVudDtcclxuICAgICAgICAvKmVzbGludC1lbmFibGUgbm8tZW1wdHksIG5vLXVuZGVmKi9cclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIEZldGNoIHJlc291cmNlIGFzIGFycmF5YnVmZmVyLlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHVybCAgICAtIHVybFxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPW51bGxdIC0gb3B0aW9ucywgc2FtZSBhcyBBamF4LmdldFxyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgICAtIGNhbGxiYWNrIGZ1bmN0aW9uIHdoZW4gY29tcGxldGVkLlxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIG1hcHRhbGtzLkFqYXguZ2V0QXJyYXlCdWZmZXIoXHJcbiAgICAgKiAgICAgJ3VybC90by9yZXNvdXJjZS5iaW4nLFxyXG4gICAgICogICAgIChlcnIsIGRhdGEpID0+IHtcclxuICAgICAqICAgICAgICAgaWYgKGVycikge1xyXG4gICAgICogICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycik7XHJcbiAgICAgKiAgICAgICAgIH1cclxuICAgICAqICAgICAgICAgLy8gZGF0YSBpcyBhIGJpbmFyeSBhcnJheVxyXG4gICAgICogICAgIH1cclxuICAgICAqICk7XHJcbiAgICAgKi9cclxuICAgIGdldEFycmF5QnVmZmVyKHVybCwgb3B0aW9ucykge1xyXG4gICAgICAgIGlmICghb3B0aW9ucykge1xyXG4gICAgICAgICAgICBvcHRpb25zID0ge307XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG9wdGlvbnNbJ3Jlc3BvbnNlVHlwZSddID0gJ2FycmF5YnVmZmVyJztcclxuICAgICAgICByZXR1cm4gQWpheC5nZXQodXJsLCBvcHRpb25zKTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gZnJvbSBtYXBib3gtZ2wtanNcclxuICAgIC8vIGdldEltYWdlKGltZywgdXJsLCBvcHRpb25zKSB7XHJcbiAgICAvLyAgICAgcmV0dXJuIEFqYXguZ2V0QXJyYXlCdWZmZXIodXJsLCBvcHRpb25zLCAoZXJyLCBpbWdEYXRhKSA9PiB7XHJcbiAgICAvLyAgICAgICAgIGlmIChlcnIpIHtcclxuICAgIC8vICAgICAgICAgICAgIGlmIChpbWcub25lcnJvcikge1xyXG4gICAgLy8gICAgICAgICAgICAgICAgIGltZy5vbmVycm9yKGVycik7XHJcbiAgICAvLyAgICAgICAgICAgICB9XHJcbiAgICAvLyAgICAgICAgIH0gZWxzZSBpZiAoaW1nRGF0YSkge1xyXG4gICAgLy8gICAgICAgICAgICAgY29uc3QgVVJMID0gd2luZG93LlVSTCB8fCB3aW5kb3cud2Via2l0VVJMO1xyXG4gICAgLy8gICAgICAgICAgICAgY29uc3Qgb25sb2FkID0gaW1nLm9ubG9hZDtcclxuICAgIC8vICAgICAgICAgICAgIGltZy5vbmxvYWQgPSAoKSA9PiB7XHJcbiAgICAvLyAgICAgICAgICAgICAgICAgaWYgKG9ubG9hZCkge1xyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBvbmxvYWQoKTtcclxuICAgIC8vICAgICAgICAgICAgICAgICB9XHJcbiAgICAvLyAgICAgICAgICAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTChpbWcuc3JjKTtcclxuICAgIC8vICAgICAgICAgICAgIH07XHJcbiAgICAvLyAgICAgICAgICAgICBjb25zdCBibG9iID0gbmV3IEJsb2IoW25ldyBVaW50OEFycmF5KGltZ0RhdGEuZGF0YSldLCB7IHR5cGU6IGltZ0RhdGEuY29udGVudFR5cGUgfSk7XHJcbiAgICAvLyAgICAgICAgICAgICBpbWcuY2FjaGVDb250cm9sID0gaW1nRGF0YS5jYWNoZUNvbnRyb2w7XHJcbiAgICAvLyAgICAgICAgICAgICBpbWcuZXhwaXJlcyA9IGltZ0RhdGEuZXhwaXJlcztcclxuICAgIC8vICAgICAgICAgICAgIGltZy5zcmMgPSBpbWdEYXRhLmRhdGEuYnl0ZUxlbmd0aCA/IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYikgOiBlbXB0eUltYWdlVXJsO1xyXG4gICAgLy8gICAgICAgICB9XHJcbiAgICAvLyAgICAgfSk7XHJcbiAgICAvLyB9XHJcbn07XHJcblxyXG4vKipcclxuICogRmV0Y2ggcmVzb3VyY2UgYXMgYSBKU09OIE9iamVjdC5cclxuICogQHBhcmFtIHtTdHJpbmd9IHVybCAgICAgICAgICAtIGpzb24ncyB1cmxcclxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPW51bGxdICAgICAgICAtIG9wdGlvbmFsIG9wdGlvbnNcclxuICogQHBhcmFtIHtTdHJpbmd9IFtvcHRpb25zLmpzb25wPWZhbHNlXSAtIGZldGNoIGJ5IGpzb25wLCBmYWxzZSBieSBkZWZhdWx0XHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNiICAgLSBjYWxsYmFjayBmdW5jdGlvbiB3aGVuIGNvbXBsZXRlZC5cclxuICogQGV4YW1wbGVcclxuICogbWFwdGFsa3MuQWpheC5nZXRKU09OKFxyXG4gKiAgICAgJ3VybC90by9yZXNvdXJjZS5qc29uJyxcclxuICogICAgIHsganNvbnAgOiB0cnVlIH0sXHJcbiAqICAgICAoZXJyLCBqc29uKSA9PiB7XHJcbiAqICAgICAgICAgaWYgKGVycikge1xyXG4gKiAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyKTtcclxuICogICAgICAgICB9XHJcbiAqICAgICAgICAgLy8ganNvbiBpcyBhIEpTT04gT2JqZWN0XHJcbiAqICAgICAgICAgY29uc29sZS5sb2coanNvbi5mb28pO1xyXG4gKiAgICAgfVxyXG4gKiApO1xyXG4gKiBAc3RhdGljXHJcbiAqL1xyXG5BamF4LmdldEpTT04gPSBmdW5jdGlvbiAodXJsLCBvcHRpb25zKSB7XHJcbiAgICBjb25zdCBwcm9taXNlID0gQWpheC5nZXQodXJsLCBvcHRpb25zKTtcclxuICAgIGNvbnN0IHAgPSBwcm9taXNlLnRoZW4oZGF0YSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIGRhdGEgPyBKU09OLnBhcnNlKGRhdGEpIDogbnVsbDtcclxuICAgIH0pO1xyXG4gICAgcC54aHIgPSBwcm9taXNlLnhocjtcclxuICAgIHJldHVybiBwO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgQWpheDtcclxuIiwiLyoqXHJcbiAqIFdoZXRoZXIgdGhlIG9iamVjdCBpcyBudWxsIG9yIHVuZGVmaW5lZC5cclxuICogQHBhcmFtICB7T2JqZWN0fSAgb2JqIC0gb2JqZWN0XHJcbiAqIEByZXR1cm4ge0Jvb2xlYW59XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNOaWwob2JqKSB7XHJcbiAgICByZXR1cm4gb2JqID09IG51bGw7XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZGVmaW5lZChvYmopIHtcclxuICAgIHJldHVybiAhaXNOaWwob2JqKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzTnVtYmVyKG9iaikge1xyXG4gICAgcmV0dXJuIHR5cGVvZiBvYmogPT09ICdudW1iZXInICYmIGlzRmluaXRlKG9iaik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1N0cmluZyhvYmopIHtcclxuICAgIGlmIChpc05pbChvYmopKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHR5cGVvZiBvYmogPT09ICdzdHJpbmcnIHx8IChvYmouY29uc3RydWN0b3IgIT09IG51bGwgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTdHJpbmcpO1xyXG59XHJcblxyXG4vKipcclxuICogTWVyZ2VzIHRoZSBwcm9wZXJ0aWVzIG9mIHNvdXJjZXMgaW50byBkZXN0aW5hdGlvbiBvYmplY3QuXHJcbiAqIEBwYXJhbSAge09iamVjdH0gZGVzdCAgIC0gb2JqZWN0IHRvIGV4dGVuZFxyXG4gKiBAcGFyYW0gIHsuLi5PYmplY3R9IHNyYyAtIHNvdXJjZXNcclxuICogQHJldHVybiB7T2JqZWN0fVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGV4dGVuZChkZXN0KSB7XHJcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGNvbnN0IHNyYyA9IGFyZ3VtZW50c1tpXTtcclxuICAgICAgICBmb3IgKGNvbnN0IGsgaW4gc3JjKSB7XHJcbiAgICAgICAgICAgIGRlc3Rba10gPSBzcmNba107XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGRlc3Q7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBQZXJmb3JtcyBhIGxpbmVhciBpbnRlcnBvbGF0aW9uIGJldHdlZW4gdHdvIG51bWJlcidzXHJcbiAqXHJcbiAqIEBwYXJhbSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcclxuICogQHBhcmFtIGEgdGhlIGZpcnN0IG9wZXJhbmRcclxuICogQHBhcmFtIGIgdGhlIHNlY29uZCBvcGVyYW5kXHJcbiAqIEBwYXJhbSB0IGludGVycG9sYXRpb24gYW1vdW50LCBpbiB0aGUgcmFuZ2UgWzAtMV0sIGJldHdlZW4gdGhlIHR3byBpbnB1dHNcclxuICogQHJldHVybnMgb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gbGVycChvdXQsIGEsIGIsIHQpIHtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb3V0Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgb3V0W2ldID0gYVtpXSArIHQgKiAoYltpXSAtIGFbaV0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNldChvdXQsIGlucHV0KSB7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG91dC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIG91dFtpXSA9IGlucHV0W2ldO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG91dDtcclxufVxyXG4iLCJpbXBvcnQgeyBkZWZpbmVkIH0gZnJvbSAnLi4vY29tbW9uL1V0aWwuanMnO1xyXG5cclxuLy8gR0xURiAxLjAgYWRhcHRlclxyXG4vLyBodHRwczovL2dpdGh1Yi5jb20vS2hyb25vc0dyb3VwL2dsVEYvdHJlZS9tYXN0ZXIvc3BlY2lmaWNhdGlvbi8xLjBcclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVjEge1xyXG4gICAgY29uc3RydWN0b3Iocm9vdFBhdGgsIGdsdGYpIHtcclxuICAgICAgICB0aGlzLnJvb3RQYXRoID0gcm9vdFBhdGg7XHJcbiAgICAgICAgdGhpcy5nbHRmID0gZ2x0ZjtcclxuICAgIH1cclxuXHJcbiAgICBpdGVyYXRlKGNiLCBwcm9wZXJ0eU5hbWUpIHtcclxuICAgICAgICBjb25zdCBwcm9wZXJ0aWVzID0gdGhpcy5nbHRmW3Byb3BlcnR5TmFtZV07XHJcbiAgICAgICAgaWYgKCFwcm9wZXJ0aWVzKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IGluZGV4ID0gMDtcclxuICAgICAgICBmb3IgKGNvbnN0IHAgaW4gcHJvcGVydGllcykge1xyXG4gICAgICAgICAgICBjYihwLCBwcm9wZXJ0aWVzW3BdLCBpbmRleCsrKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY3JlYXRlTm9kZShub2RlSlNPTiwgbWVzaGVzKSB7XHJcbiAgICAgICAgLy8gY2FtZXJhXHRzdHJpbmdcdFRoZSBJRCBvZiB0aGUgY2FtZXJhIHJlZmVyZW5jZWQgYnkgdGhpcyBub2RlLlx0Tm9cclxuICAgICAgICAvLyBjaGlsZHJlblx0c3RyaW5nW11cdFRoZSBJRHMgb2YgdGhpcyBub2RlJ3MgY2hpbGRyZW4uXHRObywgZGVmYXVsdDogW11cclxuICAgICAgICAvLyBza2VsZXRvbnNcdHN0cmluZ1tdXHRUaGUgSUQgb2Ygc2tlbGV0b24gbm9kZXMuXHROb1xyXG4gICAgICAgIC8vIHNraW5cdHN0cmluZ1x0VGhlIElEIG9mIHRoZSBza2luIHJlZmVyZW5jZWQgYnkgdGhpcyBub2RlLlx0Tm9cclxuICAgICAgICAvLyBqb2ludE5hbWVcdHN0cmluZ1x0TmFtZSB1c2VkIHdoZW4gdGhpcyBub2RlIGlzIGEgam9pbnQgaW4gYSBza2luLlx0Tm9cclxuICAgICAgICAvLyBtYXRyaXhcdG51bWJlclsxNl1cdEEgZmxvYXRpbmctcG9pbnQgNHg0IHRyYW5zZm9ybWF0aW9uIG1hdHJpeCBzdG9yZWQgaW4gY29sdW1uLW1ham9yIG9yZGVyLlx0Tm8sIGRlZmF1bHQ6IFsxLDAsMCwwLDAsMSwwLDAsMCwwLDEsMCwwLDAsMCwxXVxyXG4gICAgICAgIC8vIG1lc2hlc1x0c3RyaW5nW11cdFRoZSBJRHMgb2YgdGhlIG1lc2ggb2JqZWN0cyBpbiB0aGlzIG5vZGUuXHROb1xyXG4gICAgICAgIC8vIHJvdGF0aW9uXHRudW1iZXJbNF1cdFRoZSBub2RlJ3MgdW5pdCBxdWF0ZXJuaW9uIHJvdGF0aW9uIGluIHRoZSBvcmRlciAoeCwgeSwgeiwgdyksIHdoZXJlIHcgaXMgdGhlIHNjYWxhci5cdE5vLCBkZWZhdWx0OiBbMCwwLDAsMV1cclxuICAgICAgICAvLyBzY2FsZVx0bnVtYmVyWzNdXHRUaGUgbm9kZSdzIG5vbi11bmlmb3JtIHNjYWxlLlx0Tm8sIGRlZmF1bHQ6IFsxLDEsMV1cclxuICAgICAgICAvLyB0cmFuc2xhdGlvblx0bnVtYmVyWzNdXHRUaGUgbm9kZSdzIHRyYW5zbGF0aW9uLlx0Tm8sIGRlZmF1bHQ6IFswLDAsMF1cclxuICAgICAgICAvLyBuYW1lXHRzdHJpbmdcdFRoZSB1c2VyLWRlZmluZWQgbmFtZSBvZiB0aGlzIG9iamVjdC5cdE5vXHJcbiAgICAgICAgLy8gZXh0ZW5zaW9uc1x0b2JqZWN0XHREaWN0aW9uYXJ5IG9iamVjdCB3aXRoIGV4dGVuc2lvbi1zcGVjaWZpYyBvYmplY3RzLlx0Tm9cclxuICAgICAgICAvLyBleHRyYXNcdGFueVx0QXBwbGljYXRpb24tc3BlY2lmaWMgZGF0YS5cdE5vXHJcblxyXG4gICAgICAgIGNvbnN0IG5vZGUgPSB7fTtcclxuICAgICAgICBpZiAoZGVmaW5lZChub2RlSlNPTi5uYW1lKSkgbm9kZS5uYW1lID0gbm9kZUpTT04ubmFtZTtcclxuICAgICAgICBpZiAoZGVmaW5lZChub2RlSlNPTi5jaGlsZHJlbikpIG5vZGUuY2hpbGRyZW4gPSBub2RlSlNPTi5jaGlsZHJlbjtcclxuICAgICAgICBpZiAoZGVmaW5lZChub2RlSlNPTi5qb2ludE5hbWUpKSBub2RlLmpvaW50TmFtZSA9IG5vZGVKU09OLmpvaW50TmFtZTtcclxuICAgICAgICBpZiAoZGVmaW5lZChub2RlSlNPTi5tYXRyaXgpKSBub2RlLm1hdHJpeCA9IG5vZGVKU09OLm1hdHJpeDtcclxuICAgICAgICBpZiAoZGVmaW5lZChub2RlSlNPTi5yb3RhdGlvbikpIG5vZGUucm90YXRpb24gPSBub2RlSlNPTi5yb3RhdGlvbjtcclxuICAgICAgICBpZiAoZGVmaW5lZChub2RlSlNPTi5zY2FsZSkpIG5vZGUuc2NhbGUgPSBub2RlSlNPTi5zY2FsZTtcclxuICAgICAgICBpZiAoZGVmaW5lZChub2RlSlNPTi50cmFuc2xhdGlvbikpIG5vZGUudHJhbnNsYXRpb24gPSBub2RlSlNPTi50cmFuc2xhdGlvbjtcclxuICAgICAgICBpZiAoZGVmaW5lZChub2RlSlNPTi5leHRyYXMpKSBub2RlLmV4dHJhcyA9IG5vZGVKU09OLmV4dHJhcztcclxuICAgICAgICBpZiAoZGVmaW5lZChub2RlSlNPTi5tZXNoZXMpKSB7XHJcbiAgICAgICAgICAgIG5vZGUubWVzaGVzID0gbm9kZUpTT04ubWVzaGVzLm1hcChtID0+IG1lc2hlc1ttXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vVE9ETyDov5jnvLogY2FtZXJhLCBza2VsZXRvbnMsIHNraW4sIGV4dGVuc2lvbnMg55qE6Kej5p6QXHJcbiAgICAgICAgcmV0dXJuIG5vZGU7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0QmFzZUNvbG9yVGV4dHVyZShpbmRleCkge1xyXG4gICAgICAgIGNvbnN0IG1hdGVyaWFsID0gdGhpcy5nbHRmLm1hdGVyaWFsc1tpbmRleF07XHJcbiAgICAgICAgbGV0IHRlY2gsIHRleElkO1xyXG4gICAgICAgIGlmIChtYXRlcmlhbFsnaW5zdGFuY2VUZWNobmlxdWUnXSAmJiBtYXRlcmlhbFsnaW5zdGFuY2VUZWNobmlxdWUnXS52YWx1ZXMpIHtcclxuICAgICAgICAgICAgdGVjaCA9IG1hdGVyaWFsWydpbnN0YW5jZVRlY2huaXF1ZSddO1xyXG4gICAgICAgICAgICB0ZXhJZCA9IHRlY2gudmFsdWVzWydkaWZmdXNlJ107XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGVjaCA9IG1hdGVyaWFsO1xyXG4gICAgICAgICAgICB0ZXhJZCA9IHRlY2gudmFsdWVzWyd0ZXgnXSB8fCB0ZWNoLnZhbHVlc1snZGlmZnVzZSddO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGV4SWQgPT09IHVuZGVmaW5lZCB8fCB0aGlzLmdsdGYudGV4dHVyZXMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgdGV4dHVyZSA9IHRoaXMuZ2x0Zi50ZXh0dXJlc1t0ZXhJZF07XHJcbiAgICAgICAgaWYgKCF0ZXh0dXJlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBzYW1wbGVyID0gdGhpcy5nbHRmLnNhbXBsZXJzW3RleHR1cmUuc2FtcGxlcl07XHJcbiAgICAgICAgY29uc3QgaW5mbyA9IHtcclxuICAgICAgICAgICAgZm9ybWF0IDogdGV4dHVyZS5mb3JtYXQgfHwgNjQwOCxcclxuICAgICAgICAgICAgaW50ZXJuYWxGb3JtYXQgOiB0ZXh0dXJlLmludGVybmFsRm9ybWF0IHx8IDY0MDgsXHJcbiAgICAgICAgICAgIHR5cGUgOiB0ZXh0dXJlLnR5cGUgfHwgNTEyMSxcclxuICAgICAgICAgICAgc2FtcGxlcixcclxuICAgICAgICAgICAgc291cmNlIDogdGhpcy5nbHRmLmltYWdlc1t0ZXh0dXJlLnNvdXJjZV1cclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBpbmZvO1xyXG4gICAgfVxyXG5cclxuICAgIGdldE1hdGVyaWFsKCkge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEFuaW1hdGlvbnMoKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IEFqYXggZnJvbSAnLi4vY29yZS9BamF4JztcclxuaW1wb3J0IFByb21pc2UgZnJvbSAnLi4vY29yZS9Qcm9taXNlJztcclxuXHJcbmNvbnN0IFRZUEVTID0gWydTQ0FMQVInLCAxLCAnVkVDMicsIDIsICdWRUMzJywgMywgJ1ZFQzQnLCA0LCAnTUFUMicsIDQsICdNQVQzJywgOSwgJ01BVDQnLCAxNl07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBY2Nlc3NvciB7XHJcblxyXG4gICAgY29uc3RydWN0b3Iocm9vdFBhdGgsIGdsdGYsIGdsYkJ1ZmZlcikge1xyXG4gICAgICAgIHRoaXMucm9vdFBhdGggPSByb290UGF0aDtcclxuICAgICAgICB0aGlzLmdsdGYgPSBnbHRmO1xyXG4gICAgICAgIHRoaXMuZ2xiQnVmZmVyID0gZ2xiQnVmZmVyO1xyXG4gICAgICAgIHRoaXMuYnVmZmVycyA9IHt9O1xyXG4gICAgICAgIHRoaXMucmVxdWVzdHMgPSB7fTtcclxuICAgIH1cclxuXHJcbiAgICBfcmVxdWVzdERhdGEobmFtZSwgYWNjZXNzb3JOYW1lKSB7XHJcbiAgICAgICAgY29uc3QgZ2x0ZiA9IHRoaXMuZ2x0ZixcclxuICAgICAgICAgICAgYWNjZXNzb3IgPSBnbHRmLmFjY2Vzc29yc1thY2Nlc3Nvck5hbWVdO1xyXG4gICAgICAgIGNvbnN0IGJ1ZmZlclZpZXcgPSBnbHRmLmJ1ZmZlclZpZXdzW2FjY2Vzc29yLmJ1ZmZlclZpZXddLFxyXG4gICAgICAgICAgICBidWZmZXIgPSBnbHRmLmJ1ZmZlcnNbYnVmZmVyVmlldy5idWZmZXJdO1xyXG4gICAgICAgIGlmIChidWZmZXJWaWV3LmJ1ZmZlciA9PT0gJ2JpbmFyeV9nbFRGJyB8fCBidWZmZXJWaWV3LmJ1ZmZlciA9PT0gJ0tIUl9iaW5hcnlfZ2xURicgfHwgIWJ1ZmZlci51cmkpIHtcclxuICAgICAgICAgICAgY29uc3QgeyBhcnJheSwgaXRlbVNpemUgfSA9IHRoaXMuX3RvVHlwZWRBcnJheShhY2Nlc3Nvck5hbWUsIHRoaXMuZ2xiQnVmZmVyLmJ1ZmZlciwgdGhpcy5nbGJCdWZmZXIuYnl0ZU9mZnNldCk7XHJcbiAgICAgICAgICAgIC8vZnJvbSBnbGIgYnVmZmVyXHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgbmFtZSwgYWNjZXNzb3JOYW1lLFxyXG4gICAgICAgICAgICAgICAgYXJyYXksIGl0ZW1TaXplXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vbG9hZCBmcm9tIGV4dGVybmFsIHVyaVxyXG4gICAgICAgICAgICBjb25zdCBiaW4gPSBidWZmZXIudXJpO1xyXG4gICAgICAgICAgICBjb25zdCB1cmwgPSBidWZmZXIudXJpLmluZGV4T2YoJ2RhdGE6YXBwbGljYXRpb24vJykgPT09IDAgPyBidWZmZXIudXJpIDogdGhpcy5yb290UGF0aCArICcvJyArIGJpbjtcclxuICAgICAgICAgICAgaWYgKHRoaXMucmVxdWVzdHNbdXJsXSkge1xyXG4gICAgICAgICAgICAgICAgLy8gYSBwcm9taXNlIGFscmVhZHkgY3JlYXRlZFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVxdWVzdHNbdXJsXS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IGFycmF5LCBpdGVtU2l6ZSB9ID0gdGhpcy5fdG9UeXBlZEFycmF5KGFjY2Vzc29yTmFtZSwgdGhpcy5idWZmZXJzW3VybF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUsIGFjY2Vzc29yTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJyYXksIGl0ZW1TaXplXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IHByb21pc2UgPSB0aGlzLnJlcXVlc3RzW3VybF0gPSBBamF4LmdldEFycmF5QnVmZmVyKHVybCwgbnVsbCkudGhlbihyZXNwb25zZSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBidWZmZXIgPSByZXNwb25zZS5kYXRhO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5idWZmZXJzW3VybF0gPSBidWZmZXI7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB7IGFycmF5LCBpdGVtU2l6ZSB9ID0gdGhpcy5fdG9UeXBlZEFycmF5KGFjY2Vzc29yTmFtZSwgYnVmZmVyKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZSwgYWNjZXNzb3JOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIGFycmF5LCBpdGVtU2l6ZVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfdG9UeXBlZEFycmF5KGFjY2Vzc29yTmFtZSwgYXJyYXlCdWZmZXIsIG9mZnNldCA9IDApIHtcclxuICAgICAgICBjb25zdCBnbHRmID0gdGhpcy5nbHRmO1xyXG4gICAgICAgIGNvbnN0IGFjY2Vzc29yID0gZ2x0Zi5hY2Nlc3NvcnNbYWNjZXNzb3JOYW1lXTtcclxuXHJcbiAgICAgICAgY29uc3QgYnVmZmVyVmlldyA9IGdsdGYuYnVmZmVyVmlld3NbYWNjZXNzb3IuYnVmZmVyVmlld107XHJcbiAgICAgICAgbGV0IHN0YXJ0ID0gKGJ1ZmZlclZpZXcuYnl0ZU9mZnNldCB8fCAwKSArIChhY2Nlc3Nvci5ieXRlT2Zmc2V0IHx8IDApICsgb2Zmc2V0O1xyXG4gICAgICAgIGNvbnN0IGl0ZW1TaXplID0gdGhpcy5fZ2V0VHlwZUl0ZW1TaXplKGFjY2Vzc29yLnR5cGUpO1xyXG5cclxuICAgICAgICBjb25zdCBBcnJheUN0b3IgPSB0aGlzLl9nZXRBcnJheUN0b3IoYWNjZXNzb3IuY29tcG9uZW50VHlwZSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGJ5dGVTdHJpZGUgPSBhY2Nlc3Nvci5ieXRlU3RyaWRlO1xyXG4gICAgICAgIGlmIChieXRlU3RyaWRlICYmIGJ5dGVTdHJpZGUgIT09IGl0ZW1TaXplICogQXJyYXlDdG9yLkJZVEVTX1BFUl9FTEVNRU5UKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignR0xURiBpbnRlcmxlYXZlZCBhY2Nlc3NvcnMgbm90IHN1cHBvcnRlZCcpO1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEFycmF5Q3RvcihbXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc3RhcnQgJSBBcnJheUN0b3IuQllURVNfUEVSX0VMRU1FTlQgIT09IDApIHtcclxuICAgICAgICAgICAgLy/mi7fotJ0gYXJyYXkgYnVmZmVy77yM5Lul5L+d6K+B5q+U54m55a+56b2QXHJcbiAgICAgICAgICAgIC8v5pyJ5Lqb5LiN5aSq5q2j6KeE55qE5pWw5o2u5rKh5pyJ5q+U54m55a+56b2Q77yM5q2k5pe2IG5ldyBGbG9hdDMyQXJyYXkob2Zmc2V0LC4uICkg5Lya5oqb5Ye6IG9mZnNldCBtdXN0IGJlIG11bHRpcGxpZXIgb2YgNCDplJnor69cclxuICAgICAgICAgICAgYXJyYXlCdWZmZXIgPSBhcnJheUJ1ZmZlci5zbGljZShzdGFydCwgc3RhcnQgKyBhY2Nlc3Nvci5jb3VudCAqIGl0ZW1TaXplICogQXJyYXlDdG9yLkJZVEVTX1BFUl9FTEVNRU5UKTtcclxuICAgICAgICAgICAgc3RhcnQgPSAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgYXJyYXkgOiBuZXcgQXJyYXlDdG9yKGFycmF5QnVmZmVyLCBzdGFydCwgYWNjZXNzb3IuY291bnQgKiBpdGVtU2l6ZSksXHJcbiAgICAgICAgICAgIGl0ZW1TaXplXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBfZ2V0QXJyYXlDdG9yKGNvbXBvbmVudFR5cGUpIHtcclxuICAgICAgICBzd2l0Y2ggKGNvbXBvbmVudFR5cGUpIHtcclxuICAgICAgICBjYXNlIDB4MTQwMDpcclxuICAgICAgICAgICAgcmV0dXJuIEludDhBcnJheTtcclxuICAgICAgICBjYXNlIDB4MTQwMTpcclxuICAgICAgICAgICAgcmV0dXJuIFVpbnQ4QXJyYXk7XHJcbiAgICAgICAgY2FzZSAweDE0MDI6XHJcbiAgICAgICAgICAgIHJldHVybiBJbnQxNkFycmF5O1xyXG4gICAgICAgIGNhc2UgMHgxNDAzOlxyXG4gICAgICAgICAgICByZXR1cm4gVWludDE2QXJyYXk7XHJcbiAgICAgICAgY2FzZSAweDE0MDQ6XHJcbiAgICAgICAgICAgIHJldHVybiBJbnQzMkFycmF5O1xyXG4gICAgICAgIGNhc2UgMHgxNDA1OlxyXG4gICAgICAgICAgICByZXR1cm4gVWludDMyQXJyYXk7XHJcbiAgICAgICAgY2FzZSAweDE0MDY6XHJcbiAgICAgICAgICAgIHJldHVybiBGbG9hdDMyQXJyYXk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcigndW5zdXBwb3J0ZWQgYnVmZmVyVmlld1xcJ3MgY29tcG9uZW5nIHR5cGU6ICcgKyBjb21wb25lbnRUeXBlKTtcclxuICAgIH1cclxuXHJcbiAgICBfZ2V0VHlwZUl0ZW1TaXplKHR5cGUpIHtcclxuICAgICAgICBjb25zdCB0eXBlSWR4ID0gVFlQRVMuaW5kZXhPZih0eXBlKTtcclxuICAgICAgICByZXR1cm4gVFlQRVNbdHlwZUlkeCArIDFdO1xyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCB7IGRlZmluZWQsIGV4dGVuZCB9IGZyb20gJy4uL2NvbW1vbi9VdGlsLmpzJztcclxuaW1wb3J0IEFjY2Vzc29yIGZyb20gJy4uL2NvcmUvQWNjZXNzb3IuanMnO1xyXG5pbXBvcnQgUHJvbWlzZSBmcm9tICcuLi9jb3JlL1Byb21pc2UnO1xyXG5pbXBvcnQgQWpheCBmcm9tICcuLi9jb3JlL0FqYXgnO1xyXG5cclxuLy8gR0xURiAyLjAgYWRhcHRlclxyXG4vLyBodHRwczovL2dpdGh1Yi5jb20vS2hyb25vc0dyb3VwL2dsVEYvdHJlZS9tYXN0ZXIvc3BlY2lmaWNhdGlvbi8yLjBcclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVjIge1xyXG4gICAgY29uc3RydWN0b3Iocm9vdFBhdGgsIGdsdGYsIGdsYkJ1ZmZlciwgcmVxdWVzdEltYWdlKSB7XHJcbiAgICAgICAgdGhpcy5yb290UGF0aCA9IHJvb3RQYXRoO1xyXG4gICAgICAgIHRoaXMuZ2x0ZiA9IGdsdGY7XHJcbiAgICAgICAgdGhpcy5nbGJCdWZmZXIgPSBnbGJCdWZmZXI7XHJcbiAgICAgICAgdGhpcy5idWZmZXJzID0ge307XHJcbiAgICAgICAgdGhpcy5yZXF1ZXN0cyA9IHt9O1xyXG4gICAgICAgIHRoaXMuX3JlcXVlc3RJbWFnZSA9IHJlcXVlc3RJbWFnZTtcclxuICAgICAgICB0aGlzLmFjY2Vzc29yID0gbmV3IEFjY2Vzc29yKHJvb3RQYXRoLCBnbHRmLCBnbGJCdWZmZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIGl0ZXJhdGUoY2IsIHByb3BlcnR5TmFtZSkge1xyXG4gICAgICAgIGNvbnN0IHByb3BlcnRpZXMgPSB0aGlzLmdsdGZbcHJvcGVydHlOYW1lXTtcclxuICAgICAgICBpZiAoIXByb3BlcnRpZXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BlcnRpZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY2IoaSwgcHJvcGVydGllc1tpXSwgaSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNyZWF0ZU5vZGUobm9kZUpTT04sIG1lc2hlcywgc2tpbnMpIHtcclxuICAgICAgICAvLyBjYW1lcmFcdGludGVnZXJcdFRoZSBpbmRleCBvZiB0aGUgY2FtZXJhIHJlZmVyZW5jZWQgYnkgdGhpcyBub2RlLlx0Tm9cclxuICAgICAgICAvLyBjaGlsZHJlblx0aW50ZWdlciBbMS0qXVx0VGhlIGluZGljZXMgb2YgdGhpcyBub2RlJ3MgY2hpbGRyZW4uXHROb1xyXG4gICAgICAgIC8vIHNraW5cdGludGVnZXJcdFRoZSBpbmRleCBvZiB0aGUgc2tpbiByZWZlcmVuY2VkIGJ5IHRoaXMgbm9kZS5cdE5vXHJcbiAgICAgICAgLy8gbWF0cml4XHRudW1iZXIgWzE2XVx0QSBmbG9hdGluZy1wb2ludCA0eDQgdHJhbnNmb3JtYXRpb24gbWF0cml4IHN0b3JlZCBpbiBjb2x1bW4tbWFqb3Igb3JkZXIuXHRObywgZGVmYXVsdDogWzEsMCwwLDAsMCwxLDAsMCwwLDAsMSwwLDAsMCwwLDFdXHJcbiAgICAgICAgLy8gbWVzaFx0aW50ZWdlclx0VGhlIGluZGV4IG9mIHRoZSBtZXNoIGluIHRoaXMgbm9kZS5cdE5vXHJcbiAgICAgICAgLy8gcm90YXRpb25cdG51bWJlciBbNF1cdFRoZSBub2RlJ3MgdW5pdCBxdWF0ZXJuaW9uIHJvdGF0aW9uIGluIHRoZSBvcmRlciAoeCwgeSwgeiwgdyksIHdoZXJlIHcgaXMgdGhlIHNjYWxhci5cdE5vLCBkZWZhdWx0OiBbMCwwLDAsMV1cclxuICAgICAgICAvLyBzY2FsZVx0bnVtYmVyIFszXVx0VGhlIG5vZGUncyBub24tdW5pZm9ybSBzY2FsZSwgZ2l2ZW4gYXMgdGhlIHNjYWxpbmcgZmFjdG9ycyBhbG9uZyB0aGUgeCwgeSwgYW5kIHogYXhlcy5cdE5vLCBkZWZhdWx0OiBbMSwxLDFdXHJcbiAgICAgICAgLy8gdHJhbnNsYXRpb25cdG51bWJlciBbM11cdFRoZSBub2RlJ3MgdHJhbnNsYXRpb24gYWxvbmcgdGhlIHgsIHksIGFuZCB6IGF4ZXMuXHRObywgZGVmYXVsdDogWzAsMCwwXVxyXG4gICAgICAgIC8vIHdlaWdodHNcdG51bWJlciBbMS0qXVx0VGhlIHdlaWdodHMgb2YgdGhlIGluc3RhbnRpYXRlZCBNb3JwaCBUYXJnZXQuIE51bWJlciBvZiBlbGVtZW50cyBtdXN0IG1hdGNoIG51bWJlciBvZiBNb3JwaCBUYXJnZXRzIG9mIHVzZWQgbWVzaC5cdE5vXHJcbiAgICAgICAgLy8gbmFtZVx0c3RyaW5nXHRUaGUgdXNlci1kZWZpbmVkIG5hbWUgb2YgdGhpcyBvYmplY3QuXHROb1xyXG4gICAgICAgIC8vIGV4dGVuc2lvbnNcdG9iamVjdFx0RGljdGlvbmFyeSBvYmplY3Qgd2l0aCBleHRlbnNpb24tc3BlY2lmaWMgb2JqZWN0cy5cdE5vXHJcbiAgICAgICAgLy8gZXh0cmFzXHRhbnlcdEFwcGxpY2F0aW9uLXNwZWNpZmljIGRhdGEuXHROb1xyXG5cclxuICAgICAgICBjb25zdCBub2RlID0ge307XHJcbiAgICAgICAgZXh0ZW5kKG5vZGUsIG5vZGVKU09OKTtcclxuICAgICAgICAvLyBpZiAoZGVmaW5lZChub2RlSlNPTi5uYW1lKSkgbm9kZS5uYW1lID0gbm9kZUpTT04ubmFtZTtcclxuICAgICAgICAvLyBpZiAoZGVmaW5lZChub2RlSlNPTi5jaGlsZHJlbikpIG5vZGUuY2hpbGRyZW4gPSBub2RlSlNPTi5jaGlsZHJlbjtcclxuICAgICAgICAvLyBpZiAoZGVmaW5lZChub2RlSlNPTi5tYXRyaXgpKSBub2RlLm1hdHJpeCA9IG5vZGVKU09OLm1hdHJpeDtcclxuICAgICAgICAvLyBpZiAoZGVmaW5lZChub2RlSlNPTi5yb3RhdGlvbikpIG5vZGUucm90YXRpb24gPSBub2RlSlNPTi5yb3RhdGlvbjtcclxuICAgICAgICAvLyBpZiAoZGVmaW5lZChub2RlSlNPTi5zY2FsZSkpIG5vZGUuc2NhbGUgPSBub2RlSlNPTi5zY2FsZTtcclxuICAgICAgICAvLyBpZiAoZGVmaW5lZChub2RlSlNPTi50cmFuc2xhdGlvbikpIG5vZGUudHJhbnNsYXRpb24gPSBub2RlSlNPTi50cmFuc2xhdGlvbjtcclxuICAgICAgICAvLyBpZiAoZGVmaW5lZChub2RlSlNPTi5leHRyYXMpKSBub2RlLmV4dHJhcyA9IG5vZGVKU09OLmV4dHJhcztcclxuICAgICAgICBpZiAoZGVmaW5lZChub2RlSlNPTi5tZXNoKSkge1xyXG4gICAgICAgICAgICAvLyBWMuS4rW5vZGXnmoRtZXNo5ZSv5LiA77yM5L2G5Li65ZKMIFYxIOS/neaMgeS4gOiHtO+8jG1lc2hlc+ino+aekOS4uuaVsOe7hFxyXG4gICAgICAgICAgICBub2RlLm1lc2hlcyA9IFttZXNoZXNbbm9kZUpTT04ubWVzaF1dO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGVmaW5lZChub2RlSlNPTi5za2luKSkge1xyXG4gICAgICAgICAgICBub2RlLnNraW4gPSBza2luc1tub2RlSlNPTi5za2luXTtcclxuICAgICAgICAgICAgbm9kZS5za2luSW5kZXggPSBub2RlSlNPTi5za2luO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIWRlZmluZWQobm9kZUpTT04ud2VpZ2h0cykgJiYgbm9kZS5tZXNoZXMpIHtcclxuICAgICAgICAgICAgbm9kZS53ZWlnaHRzID0gbm9kZS5tZXNoZXNbMF0ud2VpZ2h0cztcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBub2RlLndlaWdodHMgPSBub2RlSlNPTi53ZWlnaHRzO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL1RPRE8g6L+Y57y6IGNhbWVyYSwgc2tlbGV0b25zLCBza2luLCBleHRlbnNpb25zLCB3ZWlnaHRzIOeahOino+aekFxyXG4gICAgICAgIHJldHVybiBub2RlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vaHR0cHM6Ly9naXRodWIuY29tL0tocm9ub3NHcm91cC9nbFRGL3RyZWUvbWFzdGVyL3NwZWNpZmljYXRpb24vMi4wI3JlZmVyZW5jZS1tYXRlcmlhbFxyXG4gICAgLy9BcyB0aGUgcmVmZXJlbmNlLW1hdGVyaWFsIGRlc2NyaWJsZWQsIHdlIHNob3VsZCBwYXJzZSB0aGUgcHJvcGVydGllcyB3aGljaCBhcmUgcGJyTWV0YWxsaWNSb3VnaG5lc3Msbm9ybWFsVGV4dHVyZUluZm8sb2NjbHVzaW9uVGV4dHVyZUluZm8gYW5kIGVtaXNzaXZlVGV4dHVyZUluZm9cclxuICAgIGdldE1hdGVyaWFsKGluZGV4KSB7XHJcbiAgICAgICAgY29uc3QgbWF0ZXJpYWwgPSB0aGlzLmdsdGYubWF0ZXJpYWxzW2luZGV4XTtcclxuICAgICAgICBjb25zdCBwYnJNZXRhbGxpY1JvdWdobmVzcyA9IG1hdGVyaWFsLnBick1ldGFsbGljUm91Z2huZXNzO1xyXG4gICAgICAgIGNvbnN0IG5vcm1hbFRleHR1cmVJbmZvID0gbWF0ZXJpYWwubm9ybWFsVGV4dHVyZTtcclxuICAgICAgICBjb25zdCBvY2NsdXNpb25UZXh0dXJlSW5mbyA9IG1hdGVyaWFsLm9jY2x1c2lvblRleHR1cmU7XHJcbiAgICAgICAgY29uc3QgZW1pc3NpdmVUZXh0dXJlSW5mbyA9IG1hdGVyaWFsLmVtaXNzaXZlVGV4dHVyZTtcclxuICAgICAgICBjb25zdCBleHRlbnNpb25zID0gbWF0ZXJpYWwuZXh0ZW5zaW9ucztcclxuICAgICAgICBjb25zdCBwcm9taXNlcyA9IFtdO1xyXG4gICAgICAgIGlmIChwYnJNZXRhbGxpY1JvdWdobmVzcykge1xyXG4gICAgICAgICAgICBwYnJNZXRhbGxpY1JvdWdobmVzcy5uYW1lID0gJ3Bick1ldGFsbGljUm91Z2huZXNzJztcclxuICAgICAgICAgICAgcHJvbWlzZXMucHVzaCh0aGlzLl9nZXRQQlJNYXRlcmlhbChwYnJNZXRhbGxpY1JvdWdobmVzcywgWydiYXNlQ29sb3JUZXh0dXJlJywgJ21ldGFsbGljUm91Z2huZXNzVGV4dHVyZSddKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChub3JtYWxUZXh0dXJlSW5mbykge1xyXG4gICAgICAgICAgICBwcm9taXNlcy5wdXNoKHRoaXMuX2dldFRleHR1cmVJbmZvKG5vcm1hbFRleHR1cmVJbmZvLCAnbm9ybWFsVGV4dHVyZScpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG9jY2x1c2lvblRleHR1cmVJbmZvKSB7XHJcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2godGhpcy5fZ2V0VGV4dHVyZUluZm8ob2NjbHVzaW9uVGV4dHVyZUluZm8sICdvY2NsdXNpb25UZXh0dXJlJykpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZW1pc3NpdmVUZXh0dXJlSW5mbykge1xyXG4gICAgICAgICAgICBwcm9taXNlcy5wdXNoKHRoaXMuX2dldFRleHR1cmVJbmZvKGVtaXNzaXZlVGV4dHVyZUluZm8sICdlbWlzc2l2ZVRleHR1cmUnKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChleHRlbnNpb25zKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHBiclNwZWN1bGFyR2xvc3NpbmVzcyA9IGV4dGVuc2lvbnNbJ0tIUl9tYXRlcmlhbHNfcGJyU3BlY3VsYXJHbG9zc2luZXNzJ107XHJcbiAgICAgICAgICAgIGlmIChwYnJTcGVjdWxhckdsb3NzaW5lc3MpIHtcclxuICAgICAgICAgICAgICAgIHBiclNwZWN1bGFyR2xvc3NpbmVzcy5uYW1lID0gJ3BiclNwZWN1bGFyR2xvc3NpbmVzcyc7XHJcbiAgICAgICAgICAgICAgICBwcm9taXNlcy5wdXNoKHRoaXMuX2dldFBCUk1hdGVyaWFsKHBiclNwZWN1bGFyR2xvc3NpbmVzcywgWydkaWZmdXNlVGV4dHVyZScsICdzcGVjdWxhckdsb3NzaW5lc3NUZXh0dXJlJ10pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oYXNzZXRzID0+IHtcclxuICAgICAgICAgICAgY29uc3Qgb3V0ID0ge307XHJcbiAgICAgICAgICAgIGV4dGVuZChvdXQsIG1hdGVyaWFsKTtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhc3NldHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIG91dFthc3NldHNbaV0ubmFtZV0gPSBhc3NldHNbaV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKG91dFsnZXh0ZW5zaW9ucyddKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB1bmxpdCA9IG91dFsnZXh0ZW5zaW9ucyddWydLSFJfbWF0ZXJpYWxzX3VubGl0J107XHJcbiAgICAgICAgICAgICAgICBpZiAodW5saXQpIHtcclxuICAgICAgICAgICAgICAgICAgICBvdXRbJ3VubGl0J10gPSB1bmxpdDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBvdXRbJ2V4dGVuc2lvbnMnXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4geyBtYXRlcmlhbCA6IG91dCB9O1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vcGJybWV0YWxsaWNyb3VnaG5lc3Mgc3BlY2lmaWNhdGlvbiBhbmQgS0hSX21hdGVyaWFsc19wYnJTcGVjdWxhckdsb3NzaW5lc3NcclxuICAgIC8vaHR0cHM6Ly9naXRodWIuY29tL0tocm9ub3NHcm91cC9nbFRGL3RyZWUvbWFzdGVyL3NwZWNpZmljYXRpb24vMi4wI3JlZmVyZW5jZS1wYnJtZXRhbGxpY3JvdWdobmVzc1xyXG4gICAgLy9odHRwczovL2dpdGh1Yi5jb20vS2hyb25vc0dyb3VwL2dsVEYvdHJlZS9tYXN0ZXIvZXh0ZW5zaW9ucy8yLjAvS2hyb25vcy9LSFJfbWF0ZXJpYWxzX3BiclNwZWN1bGFyR2xvc3NpbmVzc1xyXG4gICAgX2dldFBCUk1hdGVyaWFsKHByYk1hdGVyaWFsLCB0ZXh0dXJlcykge1xyXG4gICAgICAgIGNvbnN0IHByb21pc2VzID0gW107XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0dXJlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCB0ZXh0dXJlID0gcHJiTWF0ZXJpYWxbdGV4dHVyZXNbaV1dO1xyXG4gICAgICAgICAgICBpZiAodGV4dHVyZSkge1xyXG4gICAgICAgICAgICAgICAgcHJvbWlzZXMucHVzaCh0aGlzLl9nZXRUZXh0dXJlSW5mbyh0ZXh0dXJlLCB0ZXh0dXJlc1tpXSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbihhc3NldHMgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBvdXQgPSB7fTtcclxuICAgICAgICAgICAgZXh0ZW5kKG91dCwgcHJiTWF0ZXJpYWwpO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFzc2V0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGFzc2V0c1tpXS5pbmRleDtcclxuICAgICAgICAgICAgICAgIG91dFthc3NldHNbaV0ubmFtZV0gPSBhc3NldHNbaV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG91dDtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvL3RleHR1cmVpbmZvIHNwZWNpZmljYXRpb25cclxuICAgIC8vaHR0cHM6Ly9naXRodWIuY29tL0tocm9ub3NHcm91cC9nbFRGL3RyZWUvbWFzdGVyL3NwZWNpZmljYXRpb24vMi4wI3JlZmVyZW5jZS1ub3JtYWx0ZXh0dXJlaW5mb1xyXG4gICAgX2dldFRleHR1cmVJbmZvKHRleEluZm8sIG5hbWUpIHtcclxuICAgICAgICBjb25zdCBpbmRleCA9IHRleEluZm8uaW5kZXg7XHJcbiAgICAgICAgY29uc3QgZXh0ZW5zaW9ucyA9IHRleEluZm8uZXh0ZW5zaW9ucztcclxuICAgICAgICBpZiAoIWRlZmluZWQoaW5kZXgpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZXh0ZW5zaW9ucyAmJiBleHRlbnNpb25zWydLSFJfdGV4dHVyZV90cmFuc2Zvcm0nXSkge1xyXG4gICAgICAgICAgICB0ZXhJbmZvWydLSFJfdGV4dHVyZV90cmFuc2Zvcm0nXSA9IHt9O1xyXG4gICAgICAgICAgICBleHRlbmQodGV4SW5mb1snS0hSX3RleHR1cmVfdHJhbnNmb3JtJ10sIGV4dGVuc2lvbnNbJ0tIUl90ZXh0dXJlX3RyYW5zZm9ybSddKTtcclxuICAgICAgICAgICAgZGVsZXRlIHRleEluZm8uZXh0ZW5zaW9ucztcclxuICAgICAgICB9XHJcbiAgICAgICAgdGV4SW5mby5uYW1lID0gbmFtZTtcclxuICAgICAgICBjb25zdCBwcm9taXNlID0gdGhpcy5fZ2V0VGV4dHVyZShpbmRleCk7XHJcbiAgICAgICAgcmV0dXJuIHByb21pc2UudGhlbihyZXN1bHQgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBvdXQgPSB7XHJcbiAgICAgICAgICAgICAgICB0ZXh0dXJlIDogcmVzdWx0XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGV4dGVuZChvdXQsIHRleEluZm8pO1xyXG4gICAgICAgICAgICBkZWxldGUgb3V0LmluZGV4O1xyXG4gICAgICAgICAgICAvL1RPRE8g57y65bCR5LqGdGV4Q29vcmTnmoTojrflj5ZcclxuICAgICAgICAgICAgcmV0dXJuIG91dDtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvL2dldCB0ZXh0dXJlIGJ5IGluZGV4XHJcbiAgICBfZ2V0VGV4dHVyZShpbmRleCkge1xyXG4gICAgICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLmdsdGYudGV4dHVyZXNbaW5kZXhdO1xyXG4gICAgICAgIGlmICghdGV4dHVyZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgaW1hZ2UgPSB0aGlzLmdsdGYuaW1hZ2VzW3RleHR1cmUuc291cmNlXTsvL2dldCBpbWFnZSBvYmplY3QgYnkgc291cmNlIGluZGV4XHJcbiAgICAgICAgY29uc3QgcHJvbWlzZSA9IHRoaXMuX2xvYWRJbWFnZShpbWFnZSk7XHJcbiAgICAgICAgcmV0dXJuIHByb21pc2UudGhlbihyZXNwb25zZSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IG91dCA9IHtcclxuICAgICAgICAgICAgICAgIGltYWdlIDoge1xyXG4gICAgICAgICAgICAgICAgICAgIGFycmF5IDogcmVzcG9uc2UuZGF0YSxcclxuICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IHJlc3BvbnNlLndpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCA6IHJlc3BvbnNlLmhlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICBpbmRleCA6IHRleHR1cmUuc291cmNlLFxyXG4gICAgICAgICAgICAgICAgICAgIG1pbWVUeXBlIDogaW1hZ2UubWltZVR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZSA6IGltYWdlLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9ucyA6IGltYWdlLmV4dGVuc2lvbnMsXHJcbiAgICAgICAgICAgICAgICAgICAgZXh0cmFzIDogaW1hZ2UuZXh0cmFzXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGV4dGVuZChvdXQsIHRleHR1cmUpO1xyXG4gICAgICAgICAgICBkZWxldGUgb3V0LnNhbXBsZXI7XHJcbiAgICAgICAgICAgIGNvbnN0IHNhbXBsZXIgPSBkZWZpbmVkKHRleHR1cmUuc2FtcGxlcikgPyB0aGlzLmdsdGYuc2FtcGxlcnNbdGV4dHVyZS5zYW1wbGVyXSA6IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgaWYgKHNhbXBsZXIpIHtcclxuICAgICAgICAgICAgICAgIG91dC5zYW1wbGVyID0gc2FtcGxlcjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gb3V0O1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIF9sb2FkSW1hZ2Uoc291cmNlKSB7XHJcbiAgICAgICAgaWYgKGRlZmluZWQoc291cmNlLmJ1ZmZlclZpZXcpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJ1ZmZlclZpZXcgPSB0aGlzLmdsdGYuYnVmZmVyVmlld3Nbc291cmNlLmJ1ZmZlclZpZXddO1xyXG4gICAgICAgICAgICAvL+WmguaenGJ1ZmZlclZpZXflr7nlupTnmoTmlbDmja7lt7Lnu4/op6PmnpDov4fvvIzliJnnm7TmjqXkvb/nlKhcclxuICAgICAgICAgICAgaWYgKHRoaXMuYnVmZmVyc1tzb3VyY2UuYnVmZmVyVmlld10pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5idWZmZXJzW3NvdXJjZS5idWZmZXJWaWV3XSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy/ojrflj5bmjIflkJFnbHRm5Lit55qEYnVmZmVyc+WvueixoVxyXG4gICAgICAgICAgICBjb25zdCBidWZmZXJPYmogPSB0aGlzLmdsdGYuYnVmZmVyc1tidWZmZXJWaWV3LmJ1ZmZlcl07XHJcbiAgICAgICAgICAgIC8v5aaC5p6c5omA5oyH5ZCR55qEYnVmZmVy5a+56LGh6YeM5pyJdXJp5oyH5ZCR5b6X5pWw5o2u77yM5YiZ55u05o6l5LuOdXJp6YeM6Z2i6K+75Y+W77yM5ZCm5YiZ5aaC5p6cZ2xiQnVmZmVy5a2Y5Zyo77yM5YiZ5LuOZ2xiQnVmZmVy6K+75Y+WXHJcbiAgICAgICAgICAgIGlmIChidWZmZXJPYmoudXJpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVxdWVzdEZyb21BcnJheUJ1ZmZlcihidWZmZXJPYmoudXJpLCBidWZmZXJWaWV3LCBzb3VyY2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmdsYkJ1ZmZlcikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlcXVlc3RGcm9tR2xiQnVmZmVyKGJ1ZmZlclZpZXcsIHNvdXJjZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvL+S7juWklumDqOWbvueJh+iOt+WPllxyXG4gICAgICAgICAgICBjb25zdCBmaWxlID0gc291cmNlLnVyaTtcclxuICAgICAgICAgICAgY29uc3QgdXJsID0gZmlsZS5pbmRleE9mKCdkYXRhOmltYWdlLycpID09PSAwID8gZmlsZSA6IHRoaXMucm9vdFBhdGggKyAnLycgKyBmaWxlO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVxdWVzdEZyb21VcmwodXJsKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgX3JlcXVlc3RGcm9tVXJsKHVybCkge1xyXG4gICAgICAgIGlmICh0aGlzLnJlcXVlc3RzW3VybF0pIHtcclxuICAgICAgICAgICAgLy8gYSBwcm9taXNlIGFscmVhZHkgY3JlYXRlZFxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZXF1ZXN0c1t1cmxdLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYnVmZmVyc1t1cmxdO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgcHJvbWlzZSA9IHRoaXMucmVxdWVzdHNbdXJsXSA9IHRoaXMuX2dldEltYWdlSW5mbyh1cmwsIHVybCk7XHJcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XHJcbiAgICB9XHJcblxyXG4gICAgX3JlcXVlc3RGcm9tQXJyYXlCdWZmZXIodXJpLCBidWZmZXJWaWV3LCBzb3VyY2UpIHtcclxuICAgICAgICAvL+WmguaenOivt+axgui/h1xyXG4gICAgICAgIGNvbnN0IGtleSA9IHNvdXJjZS5idWZmZXJWaWV3O1xyXG4gICAgICAgIGlmICh0aGlzLnJlcXVlc3RzW3VyaV0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVxdWVzdHNbdXJpXS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmJ1ZmZlcnNba2V5XTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBBamF4LmdldEFycmF5QnVmZmVyKHVyaSwgbnVsbCkudGhlbihyZXNwb25zZSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJ1ZmZlckRhdGEgPSByZXNwb25zZS5kYXRhO1xyXG4gICAgICAgICAgICBjb25zdCBkYXRhdmlldyA9IHRoaXMuX2NyZWF0ZURhdGFWaWV3KGJ1ZmZlclZpZXcsIGJ1ZmZlckRhdGEpO1xyXG4gICAgICAgICAgICBjb25zdCBibG9iID0gbmV3IEJsb2IoW2RhdGF2aWV3XSwgeyB0eXBlOiBzb3VyY2UubWltZVR5cGUgfSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHNvdXJjZVVSSSA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9nZXRJbWFnZUluZm8oa2V5LCBzb3VyY2VVUkkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIF9yZXF1ZXN0RnJvbUdsYkJ1ZmZlcihidWZmZXJWaWV3LCBzb3VyY2UpIHtcclxuICAgICAgICBjb25zdCBkYXRhdmlldyA9IHRoaXMuX2NyZWF0ZURhdGFWaWV3KGJ1ZmZlclZpZXcsIHRoaXMuZ2xiQnVmZmVyLmJ1ZmZlciwgdGhpcy5nbGJCdWZmZXIuYnl0ZU9mZnNldCk7XHJcbiAgICAgICAgY29uc3QgYmxvYiA9IG5ldyBCbG9iKFtkYXRhdmlld10sIHsgdHlwZTogc291cmNlLm1pbWVUeXBlIH0pO1xyXG4gICAgICAgIGNvbnN0IHNvdXJjZVVSSSA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dldEltYWdlSW5mbyhzb3VyY2UuYnVmZmVyVmlldywgc291cmNlVVJJKTtcclxuICAgIH1cclxuXHJcbiAgICAvL+iOt+WPluWbvueJh+eahOmrmOOAgeWuveOAgeaVsOaNruetieS/oeaBr1xyXG4gICAgX2dldEltYWdlSW5mbyhrZXksIHVybCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlcXVlc3RJbWFnZSh1cmwsIChlcnIsIHJlc3VsdCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuYnVmZmVyc1trZXldID0gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLmJ1ZmZlcnNba2V5XSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVEYXRhVmlldyhidWZmZXJWaWV3LCBidWZmZXJEYXRhLCBieXRlT2Zmc2V0KSB7XHJcbiAgICAgICAgYnl0ZU9mZnNldCA9ICFieXRlT2Zmc2V0ID8gMCA6IGJ5dGVPZmZzZXQ7XHJcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBidWZmZXJWaWV3LmJ5dGVPZmZzZXQgICsgYnl0ZU9mZnNldDtcclxuICAgICAgICBjb25zdCBsZW5ndGggPSBidWZmZXJWaWV3LmJ5dGVMZW5ndGg7XHJcbiAgICAgICAgY29uc3QgZGF0YXZpZXcgPSBidWZmZXJEYXRhLnNsaWNlKHN0YXJ0LCBzdGFydCArIGxlbmd0aCk7XHJcbiAgICAgICAgcmV0dXJuIGRhdGF2aWV3O1xyXG4gICAgfVxyXG5cclxuICAgIC8v5qC55o2u5bCGQXJyYXlCdWZmZXLovazmjaLmiJBiYXNlNjRcclxuICAgIF90cmFuc2Zvcm1BcnJheUJ1ZmZlclRvQmFzZTY0KGFycmF5LCBtaW1lVHlwZSkge1xyXG4gICAgICAgIGNvbnN0IGJpbmFyeSA9IG5ldyBBcnJheShhcnJheS5ieXRlTGVuZ3RoKTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5LmJ5dGVMZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBiaW5hcnlbaV0gPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGFycmF5W2ldKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYmluYXJ5LmpvaW4oJycpO1xyXG4gICAgICAgIG1pbWVUeXBlID0gIW1pbWVUeXBlID8gJ2ltYWdlL3BuZycgOiBtaW1lVHlwZTtcclxuICAgICAgICBjb25zdCBiYXNlNjRVcmwgPSAnZGF0YTonICsgbWltZVR5cGUgKyAnO2Jhc2U2NCwnICsgd2luZG93LmJ0b2EodW5lc2NhcGUoZW5jb2RlVVJJQ29tcG9uZW50KGJpbmFyeSkpKTtcclxuICAgICAgICByZXR1cm4gYmFzZTY0VXJsO1xyXG4gICAgfVxyXG5cclxuICAgIC8vcmVzb2x2ZWQgZGF0YSBmcm9tIGFjY2Vzc29ycyBmb3Igc2FtcGxlcnMgYnkgaXRzIGl0ZW0ncyBpbmRleFxyXG4gICAgZ2V0QW5pbWF0aW9ucyhhbmltYXRpb25zKSB7XHJcbiAgICAgICAgY29uc3QgcHJvbWlzZXMgPSBbXTtcclxuICAgICAgICBhbmltYXRpb25zLmZvckVhY2goYW5pbWF0aW9uID0+IHtcclxuICAgICAgICAgICAgcHJvbWlzZXMucHVzaCh0aGlzLmdldFNhbXBsZXJzKGFuaW1hdGlvbi5zYW1wbGVycykpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbihhc3NldHMgPT4ge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFzc2V0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uc1tpXS5zYW1wbGVycyA9IGFzc2V0c1tpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gYW5pbWF0aW9ucztcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvL2h0dHBzOi8vZ2l0aHViLmNvbS9LaHJvbm9zR3JvdXAvZ2xURi90cmVlL21hc3Rlci9zcGVjaWZpY2F0aW9uLzIuMCNyZWZlcmVuY2UtYW5pbWF0aW9uLXNhbXBsZXJcclxuICAgIGdldFNhbXBsZXJzKHNhbXBsZXJzKSB7XHJcbiAgICAgICAgY29uc3QgcHJvbWlzZXMgPSBbXTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNhbXBsZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICghZGVmaW5lZChzYW1wbGVyc1tpXS5pbnB1dCkgJiYgIWRlZmluZWQoc2FtcGxlcnNbaV0ub3V0cHV0KSlcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBwcm9taXNlcy5wdXNoKHRoaXMuYWNjZXNzb3IuX3JlcXVlc3REYXRhKCdpbnB1dCcsIHNhbXBsZXJzW2ldLmlucHV0KSk7XHJcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2godGhpcy5hY2Nlc3Nvci5fcmVxdWVzdERhdGEoJ291dHB1dCcsIHNhbXBsZXJzW2ldLm91dHB1dCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oYXNzZXRzID0+IHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhc3NldHMubGVuZ3RoIC8gMjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBzYW1wbGVyc1tpXS5pbnB1dCA9IGFzc2V0c1tpICogMl07XHJcbiAgICAgICAgICAgICAgICBzYW1wbGVyc1tpXS5vdXRwdXQgPSBhc3NldHNbaSAqIDIgKyAxXTtcclxuICAgICAgICAgICAgICAgIC8vc2FtcGxlcidzIGRlZmF1bHQgaW50ZXJwb2xhdGlvbiBpcyAnTElORUFSJ1xyXG4gICAgICAgICAgICAgICAgaWYgKCFzYW1wbGVyc1tpXS5pbnRlcnBvbGF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2FtcGxlcnNbaV0uaW50ZXJwb2xhdGlvbiA9ICdMSU5FQVInO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBzYW1wbGVycztcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG4iLCJjb25zdCB0ZXh0RGVjb2RlciA9IHR5cGVvZiBUZXh0RGVjb2RlciAhPT0gJ3VuZGVmaW5lZCcgPyBuZXcgVGV4dERlY29kZXIoJ3V0Zi04JykgOiBudWxsO1xyXG5jb25zdCBCSU5BUllfRVhURU5TSU9OX0hFQURFUl9MRU5HVEggPSAxMjtcclxuY29uc3QgQklOQVJZX0VYVEVOU0lPTl9DSFVOS19UWVBFUyA9IHsgSlNPTjogMHg0RTRGNTM0QSwgQklOOiAweDAwNEU0OTQyIH07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHTEJSZWFkZXIge1xyXG4gICAgc3RhdGljIHJlYWQoZ2xiLCBnbGJPZmZzZXQgPSAwKSB7XHJcbiAgICAgICAgY29uc3QgZGF0YVZpZXcgPSBuZXcgRGF0YVZpZXcoZ2xiLCBnbGJPZmZzZXQpO1xyXG4gICAgICAgIC8vY29uc3QgbWFnaWMgPSBkYXRhVmlldy5nZXRVaW50MzIoMCk7IC8vICdnbHRmJ1xyXG4gICAgICAgIGNvbnN0IHZlcnNpb24gPSBkYXRhVmlldy5nZXRVaW50MzIoNCwgdHJ1ZSk7XHJcbiAgICAgICAgaWYgKHZlcnNpb24gPT09IDEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIEdMQlJlYWRlci5yZWFkVjEoZGF0YVZpZXcsIGdsYk9mZnNldCk7XHJcbiAgICAgICAgfSBlbHNlIGlmICh2ZXJzaW9uID09PSAyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBHTEJSZWFkZXIucmVhZFYyKGdsYiwgZ2xiT2Zmc2V0KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vuc3VwcG9ydGVkIGdsYiB2ZXJzaW9uIDogJyArIHZlcnNpb24pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvL21hZ2ljKHVpbnQzMikgdmVyc2lvbih1aW50MzIpIGxlbmd0aCh1aW50MzIpXHJcbiAgICAvL2NvbnRlbnRMZW5ndGgodWludDMyKSBjb250ZW50Rm9ybWF0KHVpbnQzMikgSlNPTlxyXG4gICAgLy8gYmluYXJ5RGF0YSAobGVuZ3RoIC0gY29udGVudExlbmd0aClcclxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9LaHJvbm9zR3JvdXAvZ2xURi90cmVlL21hc3Rlci9leHRlbnNpb25zLzEuMC9LaHJvbm9zL0tIUl9iaW5hcnlfZ2xURlxyXG4gICAgc3RhdGljIHJlYWRWMShkYXRhVmlldywgZ2xiT2Zmc2V0KSB7XHJcbiAgICAgICAgY29uc3QgbGVuZ3RoID0gZGF0YVZpZXcuZ2V0VWludDMyKDgsIHRydWUpO1xyXG4gICAgICAgIGNvbnN0IGNvbnRlbnRMZW5ndGggPSBkYXRhVmlldy5nZXRVaW50MzIoMTIsIHRydWUpO1xyXG5cclxuICAgICAgICBpZiAobGVuZ3RoICE9PSBkYXRhVmlldy5idWZmZXIuYnl0ZUxlbmd0aCAtIGdsYk9mZnNldCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0xlbmd0aCBpbiBHTEIgaGVhZGVyIGlzIGluY29uc2lzdGVudCB3aXRoIGdsYlxcJ3MgYnl0ZSBsZW5ndGguJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBqc29uID0gcmVhZFN0cmluZyhkYXRhVmlldy5idWZmZXIsIDIwICsgZ2xiT2Zmc2V0LCBjb250ZW50TGVuZ3RoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAganNvbiA6IEpTT04ucGFyc2UoanNvbiksXHJcbiAgICAgICAgICAgIGdsYkJ1ZmZlciA6IHtcclxuICAgICAgICAgICAgICAgIGJ5dGVPZmZzZXQgOiAyMCArIGdsYk9mZnNldCArIGNvbnRlbnRMZW5ndGgsXHJcbiAgICAgICAgICAgICAgICBidWZmZXIgOiBkYXRhVmlldy5idWZmZXJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL0tocm9ub3NHcm91cC9nbFRGL3RyZWUvbWFzdGVyL3NwZWNpZmljYXRpb24vMi4wI2dsYi1maWxlLWZvcm1hdC1zcGVjaWZpY2F0aW9uXHJcbiAgICAvLyByZWZlcmVuY2UgdG8gaHR0cHM6Ly9naXRodWIuY29tL21yZG9vYi90aHJlZS5qcy9ibG9iL3IxMDEvZXhhbXBsZXMvanMvbG9hZGVycy9HTFRGTG9hZGVyLmpzXHJcbiAgICBzdGF0aWMgcmVhZFYyKGdsYiwgZ2xiT2Zmc2V0KSB7XHJcbiAgICAgICAgbGV0IGpzb24sIGJ1ZmZlcjtcclxuICAgICAgICBjb25zdCBjaHVua1ZpZXcgPSBuZXcgRGF0YVZpZXcoZ2xiLCBCSU5BUllfRVhURU5TSU9OX0hFQURFUl9MRU5HVEgpO1xyXG4gICAgICAgIGxldCBjaHVua0luZGV4ID0gMDtcclxuICAgICAgICB3aGlsZSAoY2h1bmtJbmRleCA8IGNodW5rVmlldy5ieXRlTGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNodW5rTGVuZ3RoID0gY2h1bmtWaWV3LmdldFVpbnQzMihjaHVua0luZGV4LCB0cnVlKTtcclxuICAgICAgICAgICAgY2h1bmtJbmRleCArPSA0O1xyXG4gICAgICAgICAgICBjb25zdCBjaHVua1R5cGUgPSBjaHVua1ZpZXcuZ2V0VWludDMyKGNodW5rSW5kZXgsIHRydWUpO1xyXG4gICAgICAgICAgICBjaHVua0luZGV4ICs9IDQ7XHJcbiAgICAgICAgICAgIGlmIChjaHVua1R5cGUgPT09IEJJTkFSWV9FWFRFTlNJT05fQ0hVTktfVFlQRVMuSlNPTikge1xyXG4gICAgICAgICAgICAgICAganNvbiA9IHJlYWRTdHJpbmcoZ2xiLCBCSU5BUllfRVhURU5TSU9OX0hFQURFUl9MRU5HVEggKyBjaHVua0luZGV4LCBjaHVua0xlbmd0aCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2h1bmtUeXBlID09PSBCSU5BUllfRVhURU5TSU9OX0NIVU5LX1RZUEVTLkJJTikge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYnl0ZU9mZnNldCA9IEJJTkFSWV9FWFRFTlNJT05fSEVBREVSX0xFTkdUSCArIGNodW5rSW5kZXg7XHJcbiAgICAgICAgICAgICAgICBidWZmZXIgPSBnbGIuc2xpY2UoYnl0ZU9mZnNldCwgYnl0ZU9mZnNldCArIGNodW5rTGVuZ3RoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjaHVua0luZGV4ICs9IGNodW5rTGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBqc29uIDogSlNPTi5wYXJzZShqc29uKSxcclxuICAgICAgICAgICAgZ2xiQnVmZmVyIDoge1xyXG4gICAgICAgICAgICAgICAgYnl0ZU9mZnNldCA6IGdsYk9mZnNldCxcclxuICAgICAgICAgICAgICAgIGJ1ZmZlclxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcmVhZFN0cmluZyhidWZmZXIsIG9mZnNldCwgYnl0ZUxlbmd0aCkge1xyXG4gICAgaWYgKHRleHREZWNvZGVyKSB7XHJcbiAgICAgICAgY29uc3QgYXJyID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyLCBvZmZzZXQsIGJ5dGVMZW5ndGgpO1xyXG4gICAgICAgIHJldHVybiB0ZXh0RGVjb2Rlci5kZWNvZGUoYXJyKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc3QgYXJyID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyLCBvZmZzZXQsIGJ5dGVMZW5ndGgpO1xyXG4gICAgICAgIHJldHVybiBzdHJpbmdGcm9tVVRGOEFycmF5KGFycik7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNvbnN0IGV4dHJhQnl0ZU1hcCA9IFsxLCAxLCAxLCAxLCAyLCAyLCAzLCAwXTtcclxuXHJcbmZ1bmN0aW9uIHN0cmluZ0Zyb21VVEY4QXJyYXkoZGF0YSkge1xyXG4gICAgY29uc3QgY291bnQgPSBkYXRhLmxlbmd0aDtcclxuICAgIGxldCBzdHIgPSAnJztcclxuXHJcbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgY291bnQ7KSB7XHJcbiAgICAgICAgbGV0IGNoID0gZGF0YVtpbmRleCsrXTtcclxuICAgICAgICBpZiAoY2ggJiAweDgwKSB7XHJcbiAgICAgICAgICAgIGxldCBleHRyYSA9IGV4dHJhQnl0ZU1hcFsoY2ggPj4gMykgJiAweDA3XTtcclxuICAgICAgICAgICAgaWYgKCEoY2ggJiAweDQwKSB8fCAhZXh0cmEgfHwgKChpbmRleCArIGV4dHJhKSA+IGNvdW50KSlcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICAgICAgY2ggPSBjaCAmICgweDNGID4+IGV4dHJhKTtcclxuICAgICAgICAgICAgZm9yICg7ZXh0cmEgPiAwOyBleHRyYSAtPSAxKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjaHggPSBkYXRhW2luZGV4KytdO1xyXG4gICAgICAgICAgICAgICAgaWYgKChjaHggJiAweEMwKSAhPT0gMHg4MClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuXHJcbiAgICAgICAgICAgICAgICBjaCA9IChjaCA8PCA2KSB8IChjaHggJiAweDNGKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RyICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoY2gpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHN0cjtcclxufVxyXG4iLCIvKipcclxuICogQ29tbW9uIHV0aWxpdGllc1xyXG4gKiBAbW9kdWxlIGdsTWF0cml4XHJcbiAqL1xyXG5cclxuLy8gQ29uZmlndXJhdGlvbiBDb25zdGFudHNcclxuZXhwb3J0IHZhciBFUFNJTE9OID0gMC4wMDAwMDE7XHJcbmV4cG9ydCB2YXIgQVJSQVlfVFlQRSA9IHR5cGVvZiBGbG9hdDMyQXJyYXkgIT09ICd1bmRlZmluZWQnID8gRmxvYXQzMkFycmF5IDogQXJyYXk7XHJcbmV4cG9ydCB2YXIgUkFORE9NID0gTWF0aC5yYW5kb207XHJcblxyXG4vKipcclxuICogU2V0cyB0aGUgdHlwZSBvZiBhcnJheSB1c2VkIHdoZW4gY3JlYXRpbmcgbmV3IHZlY3RvcnMgYW5kIG1hdHJpY2VzXHJcbiAqXHJcbiAqIEBwYXJhbSB7VHlwZX0gdHlwZSBBcnJheSB0eXBlLCBzdWNoIGFzIEZsb2F0MzJBcnJheSBvciBBcnJheVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHNldE1hdHJpeEFycmF5VHlwZSh0eXBlKSB7XHJcbiAgQVJSQVlfVFlQRSA9IHR5cGU7XHJcbn1cclxuXHJcbnZhciBkZWdyZWUgPSBNYXRoLlBJIC8gMTgwO1xyXG5cclxuLyoqXHJcbiAqIENvbnZlcnQgRGVncmVlIFRvIFJhZGlhblxyXG4gKlxyXG4gKiBAcGFyYW0ge051bWJlcn0gYSBBbmdsZSBpbiBEZWdyZWVzXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdG9SYWRpYW4oYSkge1xyXG4gIHJldHVybiBhICogZGVncmVlO1xyXG59XHJcblxyXG4vKipcclxuICogVGVzdHMgd2hldGhlciBvciBub3QgdGhlIGFyZ3VtZW50cyBoYXZlIGFwcHJveGltYXRlbHkgdGhlIHNhbWUgdmFsdWUsIHdpdGhpbiBhbiBhYnNvbHV0ZVxyXG4gKiBvciByZWxhdGl2ZSB0b2xlcmFuY2Ugb2YgZ2xNYXRyaXguRVBTSUxPTiAoYW4gYWJzb2x1dGUgdG9sZXJhbmNlIGlzIHVzZWQgZm9yIHZhbHVlcyBsZXNzXHJcbiAqIHRoYW4gb3IgZXF1YWwgdG8gMS4wLCBhbmQgYSByZWxhdGl2ZSB0b2xlcmFuY2UgaXMgdXNlZCBmb3IgbGFyZ2VyIHZhbHVlcylcclxuICpcclxuICogQHBhcmFtIHtOdW1iZXJ9IGEgVGhlIGZpcnN0IG51bWJlciB0byB0ZXN0LlxyXG4gKiBAcGFyYW0ge051bWJlcn0gYiBUaGUgc2Vjb25kIG51bWJlciB0byB0ZXN0LlxyXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gVHJ1ZSBpZiB0aGUgbnVtYmVycyBhcmUgYXBwcm94aW1hdGVseSBlcXVhbCwgZmFsc2Ugb3RoZXJ3aXNlLlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGVxdWFscyhhLCBiKSB7XHJcbiAgcmV0dXJuIE1hdGguYWJzKGEgLSBiKSA8PSBFUFNJTE9OICogTWF0aC5tYXgoMS4wLCBNYXRoLmFicyhhKSwgTWF0aC5hYnMoYikpO1xyXG59IiwiaW1wb3J0ICogYXMgZ2xNYXRyaXggZnJvbSBcIi4vY29tbW9uLmpzXCI7XHJcblxyXG4vKipcclxuICogM3gzIE1hdHJpeFxyXG4gKiBAbW9kdWxlIG1hdDNcclxuICovXHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIG5ldyBpZGVudGl0eSBtYXQzXHJcbiAqXHJcbiAqIEByZXR1cm5zIHttYXQzfSBhIG5ldyAzeDMgbWF0cml4XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlKCkge1xyXG4gIHZhciBvdXQgPSBuZXcgZ2xNYXRyaXguQVJSQVlfVFlQRSg5KTtcclxuICBpZiAoZ2xNYXRyaXguQVJSQVlfVFlQRSAhPSBGbG9hdDMyQXJyYXkpIHtcclxuICAgIG91dFsxXSA9IDA7XHJcbiAgICBvdXRbMl0gPSAwO1xyXG4gICAgb3V0WzNdID0gMDtcclxuICAgIG91dFs1XSA9IDA7XHJcbiAgICBvdXRbNl0gPSAwO1xyXG4gICAgb3V0WzddID0gMDtcclxuICB9XHJcbiAgb3V0WzBdID0gMTtcclxuICBvdXRbNF0gPSAxO1xyXG4gIG91dFs4XSA9IDE7XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIENvcGllcyB0aGUgdXBwZXItbGVmdCAzeDMgdmFsdWVzIGludG8gdGhlIGdpdmVuIG1hdDMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgM3gzIG1hdHJpeFxyXG4gKiBAcGFyYW0ge21hdDR9IGEgICB0aGUgc291cmNlIDR4NCBtYXRyaXhcclxuICogQHJldHVybnMge21hdDN9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGZyb21NYXQ0KG91dCwgYSkge1xyXG4gIG91dFswXSA9IGFbMF07XHJcbiAgb3V0WzFdID0gYVsxXTtcclxuICBvdXRbMl0gPSBhWzJdO1xyXG4gIG91dFszXSA9IGFbNF07XHJcbiAgb3V0WzRdID0gYVs1XTtcclxuICBvdXRbNV0gPSBhWzZdO1xyXG4gIG91dFs2XSA9IGFbOF07XHJcbiAgb3V0WzddID0gYVs5XTtcclxuICBvdXRbOF0gPSBhWzEwXTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIG5ldyBtYXQzIGluaXRpYWxpemVkIHdpdGggdmFsdWVzIGZyb20gYW4gZXhpc3RpbmcgbWF0cml4XHJcbiAqXHJcbiAqIEBwYXJhbSB7bWF0M30gYSBtYXRyaXggdG8gY2xvbmVcclxuICogQHJldHVybnMge21hdDN9IGEgbmV3IDN4MyBtYXRyaXhcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjbG9uZShhKSB7XHJcbiAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDkpO1xyXG4gIG91dFswXSA9IGFbMF07XHJcbiAgb3V0WzFdID0gYVsxXTtcclxuICBvdXRbMl0gPSBhWzJdO1xyXG4gIG91dFszXSA9IGFbM107XHJcbiAgb3V0WzRdID0gYVs0XTtcclxuICBvdXRbNV0gPSBhWzVdO1xyXG4gIG91dFs2XSA9IGFbNl07XHJcbiAgb3V0WzddID0gYVs3XTtcclxuICBvdXRbOF0gPSBhWzhdO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDb3B5IHRoZSB2YWx1ZXMgZnJvbSBvbmUgbWF0MyB0byBhbm90aGVyXHJcbiAqXHJcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XHJcbiAqIEBwYXJhbSB7bWF0M30gYSB0aGUgc291cmNlIG1hdHJpeFxyXG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY29weShvdXQsIGEpIHtcclxuICBvdXRbMF0gPSBhWzBdO1xyXG4gIG91dFsxXSA9IGFbMV07XHJcbiAgb3V0WzJdID0gYVsyXTtcclxuICBvdXRbM10gPSBhWzNdO1xyXG4gIG91dFs0XSA9IGFbNF07XHJcbiAgb3V0WzVdID0gYVs1XTtcclxuICBvdXRbNl0gPSBhWzZdO1xyXG4gIG91dFs3XSA9IGFbN107XHJcbiAgb3V0WzhdID0gYVs4XTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlIGEgbmV3IG1hdDMgd2l0aCB0aGUgZ2l2ZW4gdmFsdWVzXHJcbiAqXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMDAgQ29tcG9uZW50IGluIGNvbHVtbiAwLCByb3cgMCBwb3NpdGlvbiAoaW5kZXggMClcclxuICogQHBhcmFtIHtOdW1iZXJ9IG0wMSBDb21wb25lbnQgaW4gY29sdW1uIDAsIHJvdyAxIHBvc2l0aW9uIChpbmRleCAxKVxyXG4gKiBAcGFyYW0ge051bWJlcn0gbTAyIENvbXBvbmVudCBpbiBjb2x1bW4gMCwgcm93IDIgcG9zaXRpb24gKGluZGV4IDIpXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMTAgQ29tcG9uZW50IGluIGNvbHVtbiAxLCByb3cgMCBwb3NpdGlvbiAoaW5kZXggMylcclxuICogQHBhcmFtIHtOdW1iZXJ9IG0xMSBDb21wb25lbnQgaW4gY29sdW1uIDEsIHJvdyAxIHBvc2l0aW9uIChpbmRleCA0KVxyXG4gKiBAcGFyYW0ge051bWJlcn0gbTEyIENvbXBvbmVudCBpbiBjb2x1bW4gMSwgcm93IDIgcG9zaXRpb24gKGluZGV4IDUpXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMjAgQ29tcG9uZW50IGluIGNvbHVtbiAyLCByb3cgMCBwb3NpdGlvbiAoaW5kZXggNilcclxuICogQHBhcmFtIHtOdW1iZXJ9IG0yMSBDb21wb25lbnQgaW4gY29sdW1uIDIsIHJvdyAxIHBvc2l0aW9uIChpbmRleCA3KVxyXG4gKiBAcGFyYW0ge051bWJlcn0gbTIyIENvbXBvbmVudCBpbiBjb2x1bW4gMiwgcm93IDIgcG9zaXRpb24gKGluZGV4IDgpXHJcbiAqIEByZXR1cm5zIHttYXQzfSBBIG5ldyBtYXQzXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZnJvbVZhbHVlcyhtMDAsIG0wMSwgbTAyLCBtMTAsIG0xMSwgbTEyLCBtMjAsIG0yMSwgbTIyKSB7XHJcbiAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDkpO1xyXG4gIG91dFswXSA9IG0wMDtcclxuICBvdXRbMV0gPSBtMDE7XHJcbiAgb3V0WzJdID0gbTAyO1xyXG4gIG91dFszXSA9IG0xMDtcclxuICBvdXRbNF0gPSBtMTE7XHJcbiAgb3V0WzVdID0gbTEyO1xyXG4gIG91dFs2XSA9IG0yMDtcclxuICBvdXRbN10gPSBtMjE7XHJcbiAgb3V0WzhdID0gbTIyO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXQgdGhlIGNvbXBvbmVudHMgb2YgYSBtYXQzIHRvIHRoZSBnaXZlbiB2YWx1ZXNcclxuICpcclxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcclxuICogQHBhcmFtIHtOdW1iZXJ9IG0wMCBDb21wb25lbnQgaW4gY29sdW1uIDAsIHJvdyAwIHBvc2l0aW9uIChpbmRleCAwKVxyXG4gKiBAcGFyYW0ge051bWJlcn0gbTAxIENvbXBvbmVudCBpbiBjb2x1bW4gMCwgcm93IDEgcG9zaXRpb24gKGluZGV4IDEpXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMDIgQ29tcG9uZW50IGluIGNvbHVtbiAwLCByb3cgMiBwb3NpdGlvbiAoaW5kZXggMilcclxuICogQHBhcmFtIHtOdW1iZXJ9IG0xMCBDb21wb25lbnQgaW4gY29sdW1uIDEsIHJvdyAwIHBvc2l0aW9uIChpbmRleCAzKVxyXG4gKiBAcGFyYW0ge051bWJlcn0gbTExIENvbXBvbmVudCBpbiBjb2x1bW4gMSwgcm93IDEgcG9zaXRpb24gKGluZGV4IDQpXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMTIgQ29tcG9uZW50IGluIGNvbHVtbiAxLCByb3cgMiBwb3NpdGlvbiAoaW5kZXggNSlcclxuICogQHBhcmFtIHtOdW1iZXJ9IG0yMCBDb21wb25lbnQgaW4gY29sdW1uIDIsIHJvdyAwIHBvc2l0aW9uIChpbmRleCA2KVxyXG4gKiBAcGFyYW0ge051bWJlcn0gbTIxIENvbXBvbmVudCBpbiBjb2x1bW4gMiwgcm93IDEgcG9zaXRpb24gKGluZGV4IDcpXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMjIgQ29tcG9uZW50IGluIGNvbHVtbiAyLCByb3cgMiBwb3NpdGlvbiAoaW5kZXggOClcclxuICogQHJldHVybnMge21hdDN9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHNldChvdXQsIG0wMCwgbTAxLCBtMDIsIG0xMCwgbTExLCBtMTIsIG0yMCwgbTIxLCBtMjIpIHtcclxuICBvdXRbMF0gPSBtMDA7XHJcbiAgb3V0WzFdID0gbTAxO1xyXG4gIG91dFsyXSA9IG0wMjtcclxuICBvdXRbM10gPSBtMTA7XHJcbiAgb3V0WzRdID0gbTExO1xyXG4gIG91dFs1XSA9IG0xMjtcclxuICBvdXRbNl0gPSBtMjA7XHJcbiAgb3V0WzddID0gbTIxO1xyXG4gIG91dFs4XSA9IG0yMjtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogU2V0IGEgbWF0MyB0byB0aGUgaWRlbnRpdHkgbWF0cml4XHJcbiAqXHJcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XHJcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpZGVudGl0eShvdXQpIHtcclxuICBvdXRbMF0gPSAxO1xyXG4gIG91dFsxXSA9IDA7XHJcbiAgb3V0WzJdID0gMDtcclxuICBvdXRbM10gPSAwO1xyXG4gIG91dFs0XSA9IDE7XHJcbiAgb3V0WzVdID0gMDtcclxuICBvdXRbNl0gPSAwO1xyXG4gIG91dFs3XSA9IDA7XHJcbiAgb3V0WzhdID0gMTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogVHJhbnNwb3NlIHRoZSB2YWx1ZXMgb2YgYSBtYXQzXHJcbiAqXHJcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XHJcbiAqIEBwYXJhbSB7bWF0M30gYSB0aGUgc291cmNlIG1hdHJpeFxyXG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdHJhbnNwb3NlKG91dCwgYSkge1xyXG4gIC8vIElmIHdlIGFyZSB0cmFuc3Bvc2luZyBvdXJzZWx2ZXMgd2UgY2FuIHNraXAgYSBmZXcgc3RlcHMgYnV0IGhhdmUgdG8gY2FjaGUgc29tZSB2YWx1ZXNcclxuICBpZiAob3V0ID09PSBhKSB7XHJcbiAgICB2YXIgYTAxID0gYVsxXSxcclxuICAgICAgICBhMDIgPSBhWzJdLFxyXG4gICAgICAgIGExMiA9IGFbNV07XHJcbiAgICBvdXRbMV0gPSBhWzNdO1xyXG4gICAgb3V0WzJdID0gYVs2XTtcclxuICAgIG91dFszXSA9IGEwMTtcclxuICAgIG91dFs1XSA9IGFbN107XHJcbiAgICBvdXRbNl0gPSBhMDI7XHJcbiAgICBvdXRbN10gPSBhMTI7XHJcbiAgfSBlbHNlIHtcclxuICAgIG91dFswXSA9IGFbMF07XHJcbiAgICBvdXRbMV0gPSBhWzNdO1xyXG4gICAgb3V0WzJdID0gYVs2XTtcclxuICAgIG91dFszXSA9IGFbMV07XHJcbiAgICBvdXRbNF0gPSBhWzRdO1xyXG4gICAgb3V0WzVdID0gYVs3XTtcclxuICAgIG91dFs2XSA9IGFbMl07XHJcbiAgICBvdXRbN10gPSBhWzVdO1xyXG4gICAgb3V0WzhdID0gYVs4XTtcclxuICB9XHJcblxyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbnZlcnRzIGEgbWF0M1xyXG4gKlxyXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxyXG4gKiBAcGFyYW0ge21hdDN9IGEgdGhlIHNvdXJjZSBtYXRyaXhcclxuICogQHJldHVybnMge21hdDN9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGludmVydChvdXQsIGEpIHtcclxuICB2YXIgYTAwID0gYVswXSxcclxuICAgICAgYTAxID0gYVsxXSxcclxuICAgICAgYTAyID0gYVsyXTtcclxuICB2YXIgYTEwID0gYVszXSxcclxuICAgICAgYTExID0gYVs0XSxcclxuICAgICAgYTEyID0gYVs1XTtcclxuICB2YXIgYTIwID0gYVs2XSxcclxuICAgICAgYTIxID0gYVs3XSxcclxuICAgICAgYTIyID0gYVs4XTtcclxuXHJcbiAgdmFyIGIwMSA9IGEyMiAqIGExMSAtIGExMiAqIGEyMTtcclxuICB2YXIgYjExID0gLWEyMiAqIGExMCArIGExMiAqIGEyMDtcclxuICB2YXIgYjIxID0gYTIxICogYTEwIC0gYTExICogYTIwO1xyXG5cclxuICAvLyBDYWxjdWxhdGUgdGhlIGRldGVybWluYW50XHJcbiAgdmFyIGRldCA9IGEwMCAqIGIwMSArIGEwMSAqIGIxMSArIGEwMiAqIGIyMTtcclxuXHJcbiAgaWYgKCFkZXQpIHtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuICBkZXQgPSAxLjAgLyBkZXQ7XHJcblxyXG4gIG91dFswXSA9IGIwMSAqIGRldDtcclxuICBvdXRbMV0gPSAoLWEyMiAqIGEwMSArIGEwMiAqIGEyMSkgKiBkZXQ7XHJcbiAgb3V0WzJdID0gKGExMiAqIGEwMSAtIGEwMiAqIGExMSkgKiBkZXQ7XHJcbiAgb3V0WzNdID0gYjExICogZGV0O1xyXG4gIG91dFs0XSA9IChhMjIgKiBhMDAgLSBhMDIgKiBhMjApICogZGV0O1xyXG4gIG91dFs1XSA9ICgtYTEyICogYTAwICsgYTAyICogYTEwKSAqIGRldDtcclxuICBvdXRbNl0gPSBiMjEgKiBkZXQ7XHJcbiAgb3V0WzddID0gKC1hMjEgKiBhMDAgKyBhMDEgKiBhMjApICogZGV0O1xyXG4gIG91dFs4XSA9IChhMTEgKiBhMDAgLSBhMDEgKiBhMTApICogZGV0O1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDYWxjdWxhdGVzIHRoZSBhZGp1Z2F0ZSBvZiBhIG1hdDNcclxuICpcclxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcclxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBzb3VyY2UgbWF0cml4XHJcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBhZGpvaW50KG91dCwgYSkge1xyXG4gIHZhciBhMDAgPSBhWzBdLFxyXG4gICAgICBhMDEgPSBhWzFdLFxyXG4gICAgICBhMDIgPSBhWzJdO1xyXG4gIHZhciBhMTAgPSBhWzNdLFxyXG4gICAgICBhMTEgPSBhWzRdLFxyXG4gICAgICBhMTIgPSBhWzVdO1xyXG4gIHZhciBhMjAgPSBhWzZdLFxyXG4gICAgICBhMjEgPSBhWzddLFxyXG4gICAgICBhMjIgPSBhWzhdO1xyXG5cclxuICBvdXRbMF0gPSBhMTEgKiBhMjIgLSBhMTIgKiBhMjE7XHJcbiAgb3V0WzFdID0gYTAyICogYTIxIC0gYTAxICogYTIyO1xyXG4gIG91dFsyXSA9IGEwMSAqIGExMiAtIGEwMiAqIGExMTtcclxuICBvdXRbM10gPSBhMTIgKiBhMjAgLSBhMTAgKiBhMjI7XHJcbiAgb3V0WzRdID0gYTAwICogYTIyIC0gYTAyICogYTIwO1xyXG4gIG91dFs1XSA9IGEwMiAqIGExMCAtIGEwMCAqIGExMjtcclxuICBvdXRbNl0gPSBhMTAgKiBhMjEgLSBhMTEgKiBhMjA7XHJcbiAgb3V0WzddID0gYTAxICogYTIwIC0gYTAwICogYTIxO1xyXG4gIG91dFs4XSA9IGEwMCAqIGExMSAtIGEwMSAqIGExMDtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogQ2FsY3VsYXRlcyB0aGUgZGV0ZXJtaW5hbnQgb2YgYSBtYXQzXHJcbiAqXHJcbiAqIEBwYXJhbSB7bWF0M30gYSB0aGUgc291cmNlIG1hdHJpeFxyXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBkZXRlcm1pbmFudCBvZiBhXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZGV0ZXJtaW5hbnQoYSkge1xyXG4gIHZhciBhMDAgPSBhWzBdLFxyXG4gICAgICBhMDEgPSBhWzFdLFxyXG4gICAgICBhMDIgPSBhWzJdO1xyXG4gIHZhciBhMTAgPSBhWzNdLFxyXG4gICAgICBhMTEgPSBhWzRdLFxyXG4gICAgICBhMTIgPSBhWzVdO1xyXG4gIHZhciBhMjAgPSBhWzZdLFxyXG4gICAgICBhMjEgPSBhWzddLFxyXG4gICAgICBhMjIgPSBhWzhdO1xyXG5cclxuICByZXR1cm4gYTAwICogKGEyMiAqIGExMSAtIGExMiAqIGEyMSkgKyBhMDEgKiAoLWEyMiAqIGExMCArIGExMiAqIGEyMCkgKyBhMDIgKiAoYTIxICogYTEwIC0gYTExICogYTIwKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIE11bHRpcGxpZXMgdHdvIG1hdDMnc1xyXG4gKlxyXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxyXG4gKiBAcGFyYW0ge21hdDN9IGEgdGhlIGZpcnN0IG9wZXJhbmRcclxuICogQHBhcmFtIHttYXQzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxyXG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gbXVsdGlwbHkob3V0LCBhLCBiKSB7XHJcbiAgdmFyIGEwMCA9IGFbMF0sXHJcbiAgICAgIGEwMSA9IGFbMV0sXHJcbiAgICAgIGEwMiA9IGFbMl07XHJcbiAgdmFyIGExMCA9IGFbM10sXHJcbiAgICAgIGExMSA9IGFbNF0sXHJcbiAgICAgIGExMiA9IGFbNV07XHJcbiAgdmFyIGEyMCA9IGFbNl0sXHJcbiAgICAgIGEyMSA9IGFbN10sXHJcbiAgICAgIGEyMiA9IGFbOF07XHJcblxyXG4gIHZhciBiMDAgPSBiWzBdLFxyXG4gICAgICBiMDEgPSBiWzFdLFxyXG4gICAgICBiMDIgPSBiWzJdO1xyXG4gIHZhciBiMTAgPSBiWzNdLFxyXG4gICAgICBiMTEgPSBiWzRdLFxyXG4gICAgICBiMTIgPSBiWzVdO1xyXG4gIHZhciBiMjAgPSBiWzZdLFxyXG4gICAgICBiMjEgPSBiWzddLFxyXG4gICAgICBiMjIgPSBiWzhdO1xyXG5cclxuICBvdXRbMF0gPSBiMDAgKiBhMDAgKyBiMDEgKiBhMTAgKyBiMDIgKiBhMjA7XHJcbiAgb3V0WzFdID0gYjAwICogYTAxICsgYjAxICogYTExICsgYjAyICogYTIxO1xyXG4gIG91dFsyXSA9IGIwMCAqIGEwMiArIGIwMSAqIGExMiArIGIwMiAqIGEyMjtcclxuXHJcbiAgb3V0WzNdID0gYjEwICogYTAwICsgYjExICogYTEwICsgYjEyICogYTIwO1xyXG4gIG91dFs0XSA9IGIxMCAqIGEwMSArIGIxMSAqIGExMSArIGIxMiAqIGEyMTtcclxuICBvdXRbNV0gPSBiMTAgKiBhMDIgKyBiMTEgKiBhMTIgKyBiMTIgKiBhMjI7XHJcblxyXG4gIG91dFs2XSA9IGIyMCAqIGEwMCArIGIyMSAqIGExMCArIGIyMiAqIGEyMDtcclxuICBvdXRbN10gPSBiMjAgKiBhMDEgKyBiMjEgKiBhMTEgKyBiMjIgKiBhMjE7XHJcbiAgb3V0WzhdID0gYjIwICogYTAyICsgYjIxICogYTEyICsgYjIyICogYTIyO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUcmFuc2xhdGUgYSBtYXQzIGJ5IHRoZSBnaXZlbiB2ZWN0b3JcclxuICpcclxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcclxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBtYXRyaXggdG8gdHJhbnNsYXRlXHJcbiAqIEBwYXJhbSB7dmVjMn0gdiB2ZWN0b3IgdG8gdHJhbnNsYXRlIGJ5XHJcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiB0cmFuc2xhdGUob3V0LCBhLCB2KSB7XHJcbiAgdmFyIGEwMCA9IGFbMF0sXHJcbiAgICAgIGEwMSA9IGFbMV0sXHJcbiAgICAgIGEwMiA9IGFbMl0sXHJcbiAgICAgIGExMCA9IGFbM10sXHJcbiAgICAgIGExMSA9IGFbNF0sXHJcbiAgICAgIGExMiA9IGFbNV0sXHJcbiAgICAgIGEyMCA9IGFbNl0sXHJcbiAgICAgIGEyMSA9IGFbN10sXHJcbiAgICAgIGEyMiA9IGFbOF0sXHJcbiAgICAgIHggPSB2WzBdLFxyXG4gICAgICB5ID0gdlsxXTtcclxuXHJcbiAgb3V0WzBdID0gYTAwO1xyXG4gIG91dFsxXSA9IGEwMTtcclxuICBvdXRbMl0gPSBhMDI7XHJcblxyXG4gIG91dFszXSA9IGExMDtcclxuICBvdXRbNF0gPSBhMTE7XHJcbiAgb3V0WzVdID0gYTEyO1xyXG5cclxuICBvdXRbNl0gPSB4ICogYTAwICsgeSAqIGExMCArIGEyMDtcclxuICBvdXRbN10gPSB4ICogYTAxICsgeSAqIGExMSArIGEyMTtcclxuICBvdXRbOF0gPSB4ICogYTAyICsgeSAqIGExMiArIGEyMjtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogUm90YXRlcyBhIG1hdDMgYnkgdGhlIGdpdmVuIGFuZ2xlXHJcbiAqXHJcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XHJcbiAqIEBwYXJhbSB7bWF0M30gYSB0aGUgbWF0cml4IHRvIHJvdGF0ZVxyXG4gKiBAcGFyYW0ge051bWJlcn0gcmFkIHRoZSBhbmdsZSB0byByb3RhdGUgdGhlIG1hdHJpeCBieVxyXG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcm90YXRlKG91dCwgYSwgcmFkKSB7XHJcbiAgdmFyIGEwMCA9IGFbMF0sXHJcbiAgICAgIGEwMSA9IGFbMV0sXHJcbiAgICAgIGEwMiA9IGFbMl0sXHJcbiAgICAgIGExMCA9IGFbM10sXHJcbiAgICAgIGExMSA9IGFbNF0sXHJcbiAgICAgIGExMiA9IGFbNV0sXHJcbiAgICAgIGEyMCA9IGFbNl0sXHJcbiAgICAgIGEyMSA9IGFbN10sXHJcbiAgICAgIGEyMiA9IGFbOF0sXHJcbiAgICAgIHMgPSBNYXRoLnNpbihyYWQpLFxyXG4gICAgICBjID0gTWF0aC5jb3MocmFkKTtcclxuXHJcbiAgb3V0WzBdID0gYyAqIGEwMCArIHMgKiBhMTA7XHJcbiAgb3V0WzFdID0gYyAqIGEwMSArIHMgKiBhMTE7XHJcbiAgb3V0WzJdID0gYyAqIGEwMiArIHMgKiBhMTI7XHJcblxyXG4gIG91dFszXSA9IGMgKiBhMTAgLSBzICogYTAwO1xyXG4gIG91dFs0XSA9IGMgKiBhMTEgLSBzICogYTAxO1xyXG4gIG91dFs1XSA9IGMgKiBhMTIgLSBzICogYTAyO1xyXG5cclxuICBvdXRbNl0gPSBhMjA7XHJcbiAgb3V0WzddID0gYTIxO1xyXG4gIG91dFs4XSA9IGEyMjtcclxuICByZXR1cm4gb3V0O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNjYWxlcyB0aGUgbWF0MyBieSB0aGUgZGltZW5zaW9ucyBpbiB0aGUgZ2l2ZW4gdmVjMlxyXG4gKlxyXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxyXG4gKiBAcGFyYW0ge21hdDN9IGEgdGhlIG1hdHJpeCB0byByb3RhdGVcclxuICogQHBhcmFtIHt2ZWMyfSB2IHRoZSB2ZWMyIHRvIHNjYWxlIHRoZSBtYXRyaXggYnlcclxuICogQHJldHVybnMge21hdDN9IG91dFxyXG4gKiovXHJcbmV4cG9ydCBmdW5jdGlvbiBzY2FsZShvdXQsIGEsIHYpIHtcclxuICB2YXIgeCA9IHZbMF0sXHJcbiAgICAgIHkgPSB2WzFdO1xyXG5cclxuICBvdXRbMF0gPSB4ICogYVswXTtcclxuICBvdXRbMV0gPSB4ICogYVsxXTtcclxuICBvdXRbMl0gPSB4ICogYVsyXTtcclxuXHJcbiAgb3V0WzNdID0geSAqIGFbM107XHJcbiAgb3V0WzRdID0geSAqIGFbNF07XHJcbiAgb3V0WzVdID0geSAqIGFbNV07XHJcblxyXG4gIG91dFs2XSA9IGFbNl07XHJcbiAgb3V0WzddID0gYVs3XTtcclxuICBvdXRbOF0gPSBhWzhdO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSB2ZWN0b3IgdHJhbnNsYXRpb25cclxuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIChidXQgbXVjaCBmYXN0ZXIgdGhhbik6XHJcbiAqXHJcbiAqICAgICBtYXQzLmlkZW50aXR5KGRlc3QpO1xyXG4gKiAgICAgbWF0My50cmFuc2xhdGUoZGVzdCwgZGVzdCwgdmVjKTtcclxuICpcclxuICogQHBhcmFtIHttYXQzfSBvdXQgbWF0MyByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxyXG4gKiBAcGFyYW0ge3ZlYzJ9IHYgVHJhbnNsYXRpb24gdmVjdG9yXHJcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBmcm9tVHJhbnNsYXRpb24ob3V0LCB2KSB7XHJcbiAgb3V0WzBdID0gMTtcclxuICBvdXRbMV0gPSAwO1xyXG4gIG91dFsyXSA9IDA7XHJcbiAgb3V0WzNdID0gMDtcclxuICBvdXRbNF0gPSAxO1xyXG4gIG91dFs1XSA9IDA7XHJcbiAgb3V0WzZdID0gdlswXTtcclxuICBvdXRbN10gPSB2WzFdO1xyXG4gIG91dFs4XSA9IDE7XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIGdpdmVuIGFuZ2xlXHJcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byAoYnV0IG11Y2ggZmFzdGVyIHRoYW4pOlxyXG4gKlxyXG4gKiAgICAgbWF0My5pZGVudGl0eShkZXN0KTtcclxuICogICAgIG1hdDMucm90YXRlKGRlc3QsIGRlc3QsIHJhZCk7XHJcbiAqXHJcbiAqIEBwYXJhbSB7bWF0M30gb3V0IG1hdDMgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcclxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZCB0aGUgYW5nbGUgdG8gcm90YXRlIHRoZSBtYXRyaXggYnlcclxuICogQHJldHVybnMge21hdDN9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGZyb21Sb3RhdGlvbihvdXQsIHJhZCkge1xyXG4gIHZhciBzID0gTWF0aC5zaW4ocmFkKSxcclxuICAgICAgYyA9IE1hdGguY29zKHJhZCk7XHJcblxyXG4gIG91dFswXSA9IGM7XHJcbiAgb3V0WzFdID0gcztcclxuICBvdXRbMl0gPSAwO1xyXG5cclxuICBvdXRbM10gPSAtcztcclxuICBvdXRbNF0gPSBjO1xyXG4gIG91dFs1XSA9IDA7XHJcblxyXG4gIG91dFs2XSA9IDA7XHJcbiAgb3V0WzddID0gMDtcclxuICBvdXRbOF0gPSAxO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSB2ZWN0b3Igc2NhbGluZ1xyXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gKGJ1dCBtdWNoIGZhc3RlciB0aGFuKTpcclxuICpcclxuICogICAgIG1hdDMuaWRlbnRpdHkoZGVzdCk7XHJcbiAqICAgICBtYXQzLnNjYWxlKGRlc3QsIGRlc3QsIHZlYyk7XHJcbiAqXHJcbiAqIEBwYXJhbSB7bWF0M30gb3V0IG1hdDMgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcclxuICogQHBhcmFtIHt2ZWMyfSB2IFNjYWxpbmcgdmVjdG9yXHJcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBmcm9tU2NhbGluZyhvdXQsIHYpIHtcclxuICBvdXRbMF0gPSB2WzBdO1xyXG4gIG91dFsxXSA9IDA7XHJcbiAgb3V0WzJdID0gMDtcclxuXHJcbiAgb3V0WzNdID0gMDtcclxuICBvdXRbNF0gPSB2WzFdO1xyXG4gIG91dFs1XSA9IDA7XHJcblxyXG4gIG91dFs2XSA9IDA7XHJcbiAgb3V0WzddID0gMDtcclxuICBvdXRbOF0gPSAxO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDb3BpZXMgdGhlIHZhbHVlcyBmcm9tIGEgbWF0MmQgaW50byBhIG1hdDNcclxuICpcclxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcclxuICogQHBhcmFtIHttYXQyZH0gYSB0aGUgbWF0cml4IHRvIGNvcHlcclxuICogQHJldHVybnMge21hdDN9IG91dFxyXG4gKiovXHJcbmV4cG9ydCBmdW5jdGlvbiBmcm9tTWF0MmQob3V0LCBhKSB7XHJcbiAgb3V0WzBdID0gYVswXTtcclxuICBvdXRbMV0gPSBhWzFdO1xyXG4gIG91dFsyXSA9IDA7XHJcblxyXG4gIG91dFszXSA9IGFbMl07XHJcbiAgb3V0WzRdID0gYVszXTtcclxuICBvdXRbNV0gPSAwO1xyXG5cclxuICBvdXRbNl0gPSBhWzRdO1xyXG4gIG91dFs3XSA9IGFbNV07XHJcbiAgb3V0WzhdID0gMTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuKiBDYWxjdWxhdGVzIGEgM3gzIG1hdHJpeCBmcm9tIHRoZSBnaXZlbiBxdWF0ZXJuaW9uXHJcbipcclxuKiBAcGFyYW0ge21hdDN9IG91dCBtYXQzIHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XHJcbiogQHBhcmFtIHtxdWF0fSBxIFF1YXRlcm5pb24gdG8gY3JlYXRlIG1hdHJpeCBmcm9tXHJcbipcclxuKiBAcmV0dXJucyB7bWF0M30gb3V0XHJcbiovXHJcbmV4cG9ydCBmdW5jdGlvbiBmcm9tUXVhdChvdXQsIHEpIHtcclxuICB2YXIgeCA9IHFbMF0sXHJcbiAgICAgIHkgPSBxWzFdLFxyXG4gICAgICB6ID0gcVsyXSxcclxuICAgICAgdyA9IHFbM107XHJcbiAgdmFyIHgyID0geCArIHg7XHJcbiAgdmFyIHkyID0geSArIHk7XHJcbiAgdmFyIHoyID0geiArIHo7XHJcblxyXG4gIHZhciB4eCA9IHggKiB4MjtcclxuICB2YXIgeXggPSB5ICogeDI7XHJcbiAgdmFyIHl5ID0geSAqIHkyO1xyXG4gIHZhciB6eCA9IHogKiB4MjtcclxuICB2YXIgenkgPSB6ICogeTI7XHJcbiAgdmFyIHp6ID0geiAqIHoyO1xyXG4gIHZhciB3eCA9IHcgKiB4MjtcclxuICB2YXIgd3kgPSB3ICogeTI7XHJcbiAgdmFyIHd6ID0gdyAqIHoyO1xyXG5cclxuICBvdXRbMF0gPSAxIC0geXkgLSB6ejtcclxuICBvdXRbM10gPSB5eCAtIHd6O1xyXG4gIG91dFs2XSA9IHp4ICsgd3k7XHJcblxyXG4gIG91dFsxXSA9IHl4ICsgd3o7XHJcbiAgb3V0WzRdID0gMSAtIHh4IC0geno7XHJcbiAgb3V0WzddID0genkgLSB3eDtcclxuXHJcbiAgb3V0WzJdID0genggLSB3eTtcclxuICBvdXRbNV0gPSB6eSArIHd4O1xyXG4gIG91dFs4XSA9IDEgLSB4eCAtIHl5O1xyXG5cclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuKiBDYWxjdWxhdGVzIGEgM3gzIG5vcm1hbCBtYXRyaXggKHRyYW5zcG9zZSBpbnZlcnNlKSBmcm9tIHRoZSA0eDQgbWF0cml4XHJcbipcclxuKiBAcGFyYW0ge21hdDN9IG91dCBtYXQzIHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XHJcbiogQHBhcmFtIHttYXQ0fSBhIE1hdDQgdG8gZGVyaXZlIHRoZSBub3JtYWwgbWF0cml4IGZyb21cclxuKlxyXG4qIEByZXR1cm5zIHttYXQzfSBvdXRcclxuKi9cclxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbEZyb21NYXQ0KG91dCwgYSkge1xyXG4gIHZhciBhMDAgPSBhWzBdLFxyXG4gICAgICBhMDEgPSBhWzFdLFxyXG4gICAgICBhMDIgPSBhWzJdLFxyXG4gICAgICBhMDMgPSBhWzNdO1xyXG4gIHZhciBhMTAgPSBhWzRdLFxyXG4gICAgICBhMTEgPSBhWzVdLFxyXG4gICAgICBhMTIgPSBhWzZdLFxyXG4gICAgICBhMTMgPSBhWzddO1xyXG4gIHZhciBhMjAgPSBhWzhdLFxyXG4gICAgICBhMjEgPSBhWzldLFxyXG4gICAgICBhMjIgPSBhWzEwXSxcclxuICAgICAgYTIzID0gYVsxMV07XHJcbiAgdmFyIGEzMCA9IGFbMTJdLFxyXG4gICAgICBhMzEgPSBhWzEzXSxcclxuICAgICAgYTMyID0gYVsxNF0sXHJcbiAgICAgIGEzMyA9IGFbMTVdO1xyXG5cclxuICB2YXIgYjAwID0gYTAwICogYTExIC0gYTAxICogYTEwO1xyXG4gIHZhciBiMDEgPSBhMDAgKiBhMTIgLSBhMDIgKiBhMTA7XHJcbiAgdmFyIGIwMiA9IGEwMCAqIGExMyAtIGEwMyAqIGExMDtcclxuICB2YXIgYjAzID0gYTAxICogYTEyIC0gYTAyICogYTExO1xyXG4gIHZhciBiMDQgPSBhMDEgKiBhMTMgLSBhMDMgKiBhMTE7XHJcbiAgdmFyIGIwNSA9IGEwMiAqIGExMyAtIGEwMyAqIGExMjtcclxuICB2YXIgYjA2ID0gYTIwICogYTMxIC0gYTIxICogYTMwO1xyXG4gIHZhciBiMDcgPSBhMjAgKiBhMzIgLSBhMjIgKiBhMzA7XHJcbiAgdmFyIGIwOCA9IGEyMCAqIGEzMyAtIGEyMyAqIGEzMDtcclxuICB2YXIgYjA5ID0gYTIxICogYTMyIC0gYTIyICogYTMxO1xyXG4gIHZhciBiMTAgPSBhMjEgKiBhMzMgLSBhMjMgKiBhMzE7XHJcbiAgdmFyIGIxMSA9IGEyMiAqIGEzMyAtIGEyMyAqIGEzMjtcclxuXHJcbiAgLy8gQ2FsY3VsYXRlIHRoZSBkZXRlcm1pbmFudFxyXG4gIHZhciBkZXQgPSBiMDAgKiBiMTEgLSBiMDEgKiBiMTAgKyBiMDIgKiBiMDkgKyBiMDMgKiBiMDggLSBiMDQgKiBiMDcgKyBiMDUgKiBiMDY7XHJcblxyXG4gIGlmICghZGV0KSB7XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcbiAgZGV0ID0gMS4wIC8gZGV0O1xyXG5cclxuICBvdXRbMF0gPSAoYTExICogYjExIC0gYTEyICogYjEwICsgYTEzICogYjA5KSAqIGRldDtcclxuICBvdXRbMV0gPSAoYTEyICogYjA4IC0gYTEwICogYjExIC0gYTEzICogYjA3KSAqIGRldDtcclxuICBvdXRbMl0gPSAoYTEwICogYjEwIC0gYTExICogYjA4ICsgYTEzICogYjA2KSAqIGRldDtcclxuXHJcbiAgb3V0WzNdID0gKGEwMiAqIGIxMCAtIGEwMSAqIGIxMSAtIGEwMyAqIGIwOSkgKiBkZXQ7XHJcbiAgb3V0WzRdID0gKGEwMCAqIGIxMSAtIGEwMiAqIGIwOCArIGEwMyAqIGIwNykgKiBkZXQ7XHJcbiAgb3V0WzVdID0gKGEwMSAqIGIwOCAtIGEwMCAqIGIxMCAtIGEwMyAqIGIwNikgKiBkZXQ7XHJcblxyXG4gIG91dFs2XSA9IChhMzEgKiBiMDUgLSBhMzIgKiBiMDQgKyBhMzMgKiBiMDMpICogZGV0O1xyXG4gIG91dFs3XSA9IChhMzIgKiBiMDIgLSBhMzAgKiBiMDUgLSBhMzMgKiBiMDEpICogZGV0O1xyXG4gIG91dFs4XSA9IChhMzAgKiBiMDQgLSBhMzEgKiBiMDIgKyBhMzMgKiBiMDApICogZGV0O1xyXG5cclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogR2VuZXJhdGVzIGEgMkQgcHJvamVjdGlvbiBtYXRyaXggd2l0aCB0aGUgZ2l2ZW4gYm91bmRzXHJcbiAqXHJcbiAqIEBwYXJhbSB7bWF0M30gb3V0IG1hdDMgZnJ1c3R1bSBtYXRyaXggd2lsbCBiZSB3cml0dGVuIGludG9cclxuICogQHBhcmFtIHtudW1iZXJ9IHdpZHRoIFdpZHRoIG9mIHlvdXIgZ2wgY29udGV4dFxyXG4gKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0IEhlaWdodCBvZiBnbCBjb250ZXh0XHJcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBwcm9qZWN0aW9uKG91dCwgd2lkdGgsIGhlaWdodCkge1xyXG4gIG91dFswXSA9IDIgLyB3aWR0aDtcclxuICBvdXRbMV0gPSAwO1xyXG4gIG91dFsyXSA9IDA7XHJcbiAgb3V0WzNdID0gMDtcclxuICBvdXRbNF0gPSAtMiAvIGhlaWdodDtcclxuICBvdXRbNV0gPSAwO1xyXG4gIG91dFs2XSA9IC0xO1xyXG4gIG91dFs3XSA9IDE7XHJcbiAgb3V0WzhdID0gMTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBhIG1hdDNcclxuICpcclxuICogQHBhcmFtIHttYXQzfSBhIG1hdHJpeCB0byByZXByZXNlbnQgYXMgYSBzdHJpbmdcclxuICogQHJldHVybnMge1N0cmluZ30gc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBtYXRyaXhcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBzdHIoYSkge1xyXG4gIHJldHVybiAnbWF0MygnICsgYVswXSArICcsICcgKyBhWzFdICsgJywgJyArIGFbMl0gKyAnLCAnICsgYVszXSArICcsICcgKyBhWzRdICsgJywgJyArIGFbNV0gKyAnLCAnICsgYVs2XSArICcsICcgKyBhWzddICsgJywgJyArIGFbOF0gKyAnKSc7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIEZyb2Jlbml1cyBub3JtIG9mIGEgbWF0M1xyXG4gKlxyXG4gKiBAcGFyYW0ge21hdDN9IGEgdGhlIG1hdHJpeCB0byBjYWxjdWxhdGUgRnJvYmVuaXVzIG5vcm0gb2ZcclxuICogQHJldHVybnMge051bWJlcn0gRnJvYmVuaXVzIG5vcm1cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBmcm9iKGEpIHtcclxuICByZXR1cm4gTWF0aC5zcXJ0KE1hdGgucG93KGFbMF0sIDIpICsgTWF0aC5wb3coYVsxXSwgMikgKyBNYXRoLnBvdyhhWzJdLCAyKSArIE1hdGgucG93KGFbM10sIDIpICsgTWF0aC5wb3coYVs0XSwgMikgKyBNYXRoLnBvdyhhWzVdLCAyKSArIE1hdGgucG93KGFbNl0sIDIpICsgTWF0aC5wb3coYVs3XSwgMikgKyBNYXRoLnBvdyhhWzhdLCAyKSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBZGRzIHR3byBtYXQzJ3NcclxuICpcclxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcclxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXHJcbiAqIEBwYXJhbSB7bWF0M30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcclxuICogQHJldHVybnMge21hdDN9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGFkZChvdXQsIGEsIGIpIHtcclxuICBvdXRbMF0gPSBhWzBdICsgYlswXTtcclxuICBvdXRbMV0gPSBhWzFdICsgYlsxXTtcclxuICBvdXRbMl0gPSBhWzJdICsgYlsyXTtcclxuICBvdXRbM10gPSBhWzNdICsgYlszXTtcclxuICBvdXRbNF0gPSBhWzRdICsgYls0XTtcclxuICBvdXRbNV0gPSBhWzVdICsgYls1XTtcclxuICBvdXRbNl0gPSBhWzZdICsgYls2XTtcclxuICBvdXRbN10gPSBhWzddICsgYls3XTtcclxuICBvdXRbOF0gPSBhWzhdICsgYls4XTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogU3VidHJhY3RzIG1hdHJpeCBiIGZyb20gbWF0cml4IGFcclxuICpcclxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcclxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXHJcbiAqIEBwYXJhbSB7bWF0M30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcclxuICogQHJldHVybnMge21hdDN9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHN1YnRyYWN0KG91dCwgYSwgYikge1xyXG4gIG91dFswXSA9IGFbMF0gLSBiWzBdO1xyXG4gIG91dFsxXSA9IGFbMV0gLSBiWzFdO1xyXG4gIG91dFsyXSA9IGFbMl0gLSBiWzJdO1xyXG4gIG91dFszXSA9IGFbM10gLSBiWzNdO1xyXG4gIG91dFs0XSA9IGFbNF0gLSBiWzRdO1xyXG4gIG91dFs1XSA9IGFbNV0gLSBiWzVdO1xyXG4gIG91dFs2XSA9IGFbNl0gLSBiWzZdO1xyXG4gIG91dFs3XSA9IGFbN10gLSBiWzddO1xyXG4gIG91dFs4XSA9IGFbOF0gLSBiWzhdO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBNdWx0aXBseSBlYWNoIGVsZW1lbnQgb2YgdGhlIG1hdHJpeCBieSBhIHNjYWxhci5cclxuICpcclxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcclxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBtYXRyaXggdG8gc2NhbGVcclxuICogQHBhcmFtIHtOdW1iZXJ9IGIgYW1vdW50IHRvIHNjYWxlIHRoZSBtYXRyaXgncyBlbGVtZW50cyBieVxyXG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gbXVsdGlwbHlTY2FsYXIob3V0LCBhLCBiKSB7XHJcbiAgb3V0WzBdID0gYVswXSAqIGI7XHJcbiAgb3V0WzFdID0gYVsxXSAqIGI7XHJcbiAgb3V0WzJdID0gYVsyXSAqIGI7XHJcbiAgb3V0WzNdID0gYVszXSAqIGI7XHJcbiAgb3V0WzRdID0gYVs0XSAqIGI7XHJcbiAgb3V0WzVdID0gYVs1XSAqIGI7XHJcbiAgb3V0WzZdID0gYVs2XSAqIGI7XHJcbiAgb3V0WzddID0gYVs3XSAqIGI7XHJcbiAgb3V0WzhdID0gYVs4XSAqIGI7XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEFkZHMgdHdvIG1hdDMncyBhZnRlciBtdWx0aXBseWluZyBlYWNoIGVsZW1lbnQgb2YgdGhlIHNlY29uZCBvcGVyYW5kIGJ5IGEgc2NhbGFyIHZhbHVlLlxyXG4gKlxyXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge21hdDN9IGEgdGhlIGZpcnN0IG9wZXJhbmRcclxuICogQHBhcmFtIHttYXQzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxyXG4gKiBAcGFyYW0ge051bWJlcn0gc2NhbGUgdGhlIGFtb3VudCB0byBzY2FsZSBiJ3MgZWxlbWVudHMgYnkgYmVmb3JlIGFkZGluZ1xyXG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gbXVsdGlwbHlTY2FsYXJBbmRBZGQob3V0LCBhLCBiLCBzY2FsZSkge1xyXG4gIG91dFswXSA9IGFbMF0gKyBiWzBdICogc2NhbGU7XHJcbiAgb3V0WzFdID0gYVsxXSArIGJbMV0gKiBzY2FsZTtcclxuICBvdXRbMl0gPSBhWzJdICsgYlsyXSAqIHNjYWxlO1xyXG4gIG91dFszXSA9IGFbM10gKyBiWzNdICogc2NhbGU7XHJcbiAgb3V0WzRdID0gYVs0XSArIGJbNF0gKiBzY2FsZTtcclxuICBvdXRbNV0gPSBhWzVdICsgYls1XSAqIHNjYWxlO1xyXG4gIG91dFs2XSA9IGFbNl0gKyBiWzZdICogc2NhbGU7XHJcbiAgb3V0WzddID0gYVs3XSArIGJbN10gKiBzY2FsZTtcclxuICBvdXRbOF0gPSBhWzhdICsgYls4XSAqIHNjYWxlO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBtYXRyaWNlcyBoYXZlIGV4YWN0bHkgdGhlIHNhbWUgZWxlbWVudHMgaW4gdGhlIHNhbWUgcG9zaXRpb24gKHdoZW4gY29tcGFyZWQgd2l0aCA9PT0pXHJcbiAqXHJcbiAqIEBwYXJhbSB7bWF0M30gYSBUaGUgZmlyc3QgbWF0cml4LlxyXG4gKiBAcGFyYW0ge21hdDN9IGIgVGhlIHNlY29uZCBtYXRyaXguXHJcbiAqIEByZXR1cm5zIHtCb29sZWFufSBUcnVlIGlmIHRoZSBtYXRyaWNlcyBhcmUgZXF1YWwsIGZhbHNlIG90aGVyd2lzZS5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBleGFjdEVxdWFscyhhLCBiKSB7XHJcbiAgcmV0dXJuIGFbMF0gPT09IGJbMF0gJiYgYVsxXSA9PT0gYlsxXSAmJiBhWzJdID09PSBiWzJdICYmIGFbM10gPT09IGJbM10gJiYgYVs0XSA9PT0gYls0XSAmJiBhWzVdID09PSBiWzVdICYmIGFbNl0gPT09IGJbNl0gJiYgYVs3XSA9PT0gYls3XSAmJiBhWzhdID09PSBiWzhdO1xyXG59XHJcblxyXG4vKipcclxuICogUmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgbWF0cmljZXMgaGF2ZSBhcHByb3hpbWF0ZWx5IHRoZSBzYW1lIGVsZW1lbnRzIGluIHRoZSBzYW1lIHBvc2l0aW9uLlxyXG4gKlxyXG4gKiBAcGFyYW0ge21hdDN9IGEgVGhlIGZpcnN0IG1hdHJpeC5cclxuICogQHBhcmFtIHttYXQzfSBiIFRoZSBzZWNvbmQgbWF0cml4LlxyXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gVHJ1ZSBpZiB0aGUgbWF0cmljZXMgYXJlIGVxdWFsLCBmYWxzZSBvdGhlcndpc2UuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZXF1YWxzKGEsIGIpIHtcclxuICB2YXIgYTAgPSBhWzBdLFxyXG4gICAgICBhMSA9IGFbMV0sXHJcbiAgICAgIGEyID0gYVsyXSxcclxuICAgICAgYTMgPSBhWzNdLFxyXG4gICAgICBhNCA9IGFbNF0sXHJcbiAgICAgIGE1ID0gYVs1XSxcclxuICAgICAgYTYgPSBhWzZdLFxyXG4gICAgICBhNyA9IGFbN10sXHJcbiAgICAgIGE4ID0gYVs4XTtcclxuICB2YXIgYjAgPSBiWzBdLFxyXG4gICAgICBiMSA9IGJbMV0sXHJcbiAgICAgIGIyID0gYlsyXSxcclxuICAgICAgYjMgPSBiWzNdLFxyXG4gICAgICBiNCA9IGJbNF0sXHJcbiAgICAgIGI1ID0gYls1XSxcclxuICAgICAgYjYgPSBiWzZdLFxyXG4gICAgICBiNyA9IGJbN10sXHJcbiAgICAgIGI4ID0gYls4XTtcclxuICByZXR1cm4gTWF0aC5hYnMoYTAgLSBiMCkgPD0gZ2xNYXRyaXguRVBTSUxPTiAqIE1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTApLCBNYXRoLmFicyhiMCkpICYmIE1hdGguYWJzKGExIC0gYjEpIDw9IGdsTWF0cml4LkVQU0lMT04gKiBNYXRoLm1heCgxLjAsIE1hdGguYWJzKGExKSwgTWF0aC5hYnMoYjEpKSAmJiBNYXRoLmFicyhhMiAtIGIyKSA8PSBnbE1hdHJpeC5FUFNJTE9OICogTWF0aC5tYXgoMS4wLCBNYXRoLmFicyhhMiksIE1hdGguYWJzKGIyKSkgJiYgTWF0aC5hYnMoYTMgLSBiMykgPD0gZ2xNYXRyaXguRVBTSUxPTiAqIE1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTMpLCBNYXRoLmFicyhiMykpICYmIE1hdGguYWJzKGE0IC0gYjQpIDw9IGdsTWF0cml4LkVQU0lMT04gKiBNYXRoLm1heCgxLjAsIE1hdGguYWJzKGE0KSwgTWF0aC5hYnMoYjQpKSAmJiBNYXRoLmFicyhhNSAtIGI1KSA8PSBnbE1hdHJpeC5FUFNJTE9OICogTWF0aC5tYXgoMS4wLCBNYXRoLmFicyhhNSksIE1hdGguYWJzKGI1KSkgJiYgTWF0aC5hYnMoYTYgLSBiNikgPD0gZ2xNYXRyaXguRVBTSUxPTiAqIE1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTYpLCBNYXRoLmFicyhiNikpICYmIE1hdGguYWJzKGE3IC0gYjcpIDw9IGdsTWF0cml4LkVQU0lMT04gKiBNYXRoLm1heCgxLjAsIE1hdGguYWJzKGE3KSwgTWF0aC5hYnMoYjcpKSAmJiBNYXRoLmFicyhhOCAtIGI4KSA8PSBnbE1hdHJpeC5FUFNJTE9OICogTWF0aC5tYXgoMS4wLCBNYXRoLmFicyhhOCksIE1hdGguYWJzKGI4KSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBbGlhcyBmb3Ige0BsaW5rIG1hdDMubXVsdGlwbHl9XHJcbiAqIEBmdW5jdGlvblxyXG4gKi9cclxuZXhwb3J0IHZhciBtdWwgPSBtdWx0aXBseTtcclxuXHJcbi8qKlxyXG4gKiBBbGlhcyBmb3Ige0BsaW5rIG1hdDMuc3VidHJhY3R9XHJcbiAqIEBmdW5jdGlvblxyXG4gKi9cclxuZXhwb3J0IHZhciBzdWIgPSBzdWJ0cmFjdDsiLCJpbXBvcnQgKiBhcyBnbE1hdHJpeCBmcm9tIFwiLi9jb21tb24uanNcIjtcclxuXHJcbi8qKlxyXG4gKiA0eDQgTWF0cml4PGJyPkZvcm1hdDogY29sdW1uLW1ham9yLCB3aGVuIHR5cGVkIG91dCBpdCBsb29rcyBsaWtlIHJvdy1tYWpvcjxicj5UaGUgbWF0cmljZXMgYXJlIGJlaW5nIHBvc3QgbXVsdGlwbGllZC5cclxuICogQG1vZHVsZSBtYXQ0XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBuZXcgaWRlbnRpdHkgbWF0NFxyXG4gKlxyXG4gKiBAcmV0dXJucyB7bWF0NH0gYSBuZXcgNHg0IG1hdHJpeFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZSgpIHtcclxuICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoMTYpO1xyXG4gIGlmIChnbE1hdHJpeC5BUlJBWV9UWVBFICE9IEZsb2F0MzJBcnJheSkge1xyXG4gICAgb3V0WzFdID0gMDtcclxuICAgIG91dFsyXSA9IDA7XHJcbiAgICBvdXRbM10gPSAwO1xyXG4gICAgb3V0WzRdID0gMDtcclxuICAgIG91dFs2XSA9IDA7XHJcbiAgICBvdXRbN10gPSAwO1xyXG4gICAgb3V0WzhdID0gMDtcclxuICAgIG91dFs5XSA9IDA7XHJcbiAgICBvdXRbMTFdID0gMDtcclxuICAgIG91dFsxMl0gPSAwO1xyXG4gICAgb3V0WzEzXSA9IDA7XHJcbiAgICBvdXRbMTRdID0gMDtcclxuICB9XHJcbiAgb3V0WzBdID0gMTtcclxuICBvdXRbNV0gPSAxO1xyXG4gIG91dFsxMF0gPSAxO1xyXG4gIG91dFsxNV0gPSAxO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgbmV3IG1hdDQgaW5pdGlhbGl6ZWQgd2l0aCB2YWx1ZXMgZnJvbSBhbiBleGlzdGluZyBtYXRyaXhcclxuICpcclxuICogQHBhcmFtIHttYXQ0fSBhIG1hdHJpeCB0byBjbG9uZVxyXG4gKiBAcmV0dXJucyB7bWF0NH0gYSBuZXcgNHg0IG1hdHJpeFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNsb25lKGEpIHtcclxuICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoMTYpO1xyXG4gIG91dFswXSA9IGFbMF07XHJcbiAgb3V0WzFdID0gYVsxXTtcclxuICBvdXRbMl0gPSBhWzJdO1xyXG4gIG91dFszXSA9IGFbM107XHJcbiAgb3V0WzRdID0gYVs0XTtcclxuICBvdXRbNV0gPSBhWzVdO1xyXG4gIG91dFs2XSA9IGFbNl07XHJcbiAgb3V0WzddID0gYVs3XTtcclxuICBvdXRbOF0gPSBhWzhdO1xyXG4gIG91dFs5XSA9IGFbOV07XHJcbiAgb3V0WzEwXSA9IGFbMTBdO1xyXG4gIG91dFsxMV0gPSBhWzExXTtcclxuICBvdXRbMTJdID0gYVsxMl07XHJcbiAgb3V0WzEzXSA9IGFbMTNdO1xyXG4gIG91dFsxNF0gPSBhWzE0XTtcclxuICBvdXRbMTVdID0gYVsxNV07XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIENvcHkgdGhlIHZhbHVlcyBmcm9tIG9uZSBtYXQ0IHRvIGFub3RoZXJcclxuICpcclxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcclxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBzb3VyY2UgbWF0cml4XHJcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjb3B5KG91dCwgYSkge1xyXG4gIG91dFswXSA9IGFbMF07XHJcbiAgb3V0WzFdID0gYVsxXTtcclxuICBvdXRbMl0gPSBhWzJdO1xyXG4gIG91dFszXSA9IGFbM107XHJcbiAgb3V0WzRdID0gYVs0XTtcclxuICBvdXRbNV0gPSBhWzVdO1xyXG4gIG91dFs2XSA9IGFbNl07XHJcbiAgb3V0WzddID0gYVs3XTtcclxuICBvdXRbOF0gPSBhWzhdO1xyXG4gIG91dFs5XSA9IGFbOV07XHJcbiAgb3V0WzEwXSA9IGFbMTBdO1xyXG4gIG91dFsxMV0gPSBhWzExXTtcclxuICBvdXRbMTJdID0gYVsxMl07XHJcbiAgb3V0WzEzXSA9IGFbMTNdO1xyXG4gIG91dFsxNF0gPSBhWzE0XTtcclxuICBvdXRbMTVdID0gYVsxNV07XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSBhIG5ldyBtYXQ0IHdpdGggdGhlIGdpdmVuIHZhbHVlc1xyXG4gKlxyXG4gKiBAcGFyYW0ge051bWJlcn0gbTAwIENvbXBvbmVudCBpbiBjb2x1bW4gMCwgcm93IDAgcG9zaXRpb24gKGluZGV4IDApXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMDEgQ29tcG9uZW50IGluIGNvbHVtbiAwLCByb3cgMSBwb3NpdGlvbiAoaW5kZXggMSlcclxuICogQHBhcmFtIHtOdW1iZXJ9IG0wMiBDb21wb25lbnQgaW4gY29sdW1uIDAsIHJvdyAyIHBvc2l0aW9uIChpbmRleCAyKVxyXG4gKiBAcGFyYW0ge051bWJlcn0gbTAzIENvbXBvbmVudCBpbiBjb2x1bW4gMCwgcm93IDMgcG9zaXRpb24gKGluZGV4IDMpXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMTAgQ29tcG9uZW50IGluIGNvbHVtbiAxLCByb3cgMCBwb3NpdGlvbiAoaW5kZXggNClcclxuICogQHBhcmFtIHtOdW1iZXJ9IG0xMSBDb21wb25lbnQgaW4gY29sdW1uIDEsIHJvdyAxIHBvc2l0aW9uIChpbmRleCA1KVxyXG4gKiBAcGFyYW0ge051bWJlcn0gbTEyIENvbXBvbmVudCBpbiBjb2x1bW4gMSwgcm93IDIgcG9zaXRpb24gKGluZGV4IDYpXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMTMgQ29tcG9uZW50IGluIGNvbHVtbiAxLCByb3cgMyBwb3NpdGlvbiAoaW5kZXggNylcclxuICogQHBhcmFtIHtOdW1iZXJ9IG0yMCBDb21wb25lbnQgaW4gY29sdW1uIDIsIHJvdyAwIHBvc2l0aW9uIChpbmRleCA4KVxyXG4gKiBAcGFyYW0ge051bWJlcn0gbTIxIENvbXBvbmVudCBpbiBjb2x1bW4gMiwgcm93IDEgcG9zaXRpb24gKGluZGV4IDkpXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMjIgQ29tcG9uZW50IGluIGNvbHVtbiAyLCByb3cgMiBwb3NpdGlvbiAoaW5kZXggMTApXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMjMgQ29tcG9uZW50IGluIGNvbHVtbiAyLCByb3cgMyBwb3NpdGlvbiAoaW5kZXggMTEpXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMzAgQ29tcG9uZW50IGluIGNvbHVtbiAzLCByb3cgMCBwb3NpdGlvbiAoaW5kZXggMTIpXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMzEgQ29tcG9uZW50IGluIGNvbHVtbiAzLCByb3cgMSBwb3NpdGlvbiAoaW5kZXggMTMpXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMzIgQ29tcG9uZW50IGluIGNvbHVtbiAzLCByb3cgMiBwb3NpdGlvbiAoaW5kZXggMTQpXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMzMgQ29tcG9uZW50IGluIGNvbHVtbiAzLCByb3cgMyBwb3NpdGlvbiAoaW5kZXggMTUpXHJcbiAqIEByZXR1cm5zIHttYXQ0fSBBIG5ldyBtYXQ0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZnJvbVZhbHVlcyhtMDAsIG0wMSwgbTAyLCBtMDMsIG0xMCwgbTExLCBtMTIsIG0xMywgbTIwLCBtMjEsIG0yMiwgbTIzLCBtMzAsIG0zMSwgbTMyLCBtMzMpIHtcclxuICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoMTYpO1xyXG4gIG91dFswXSA9IG0wMDtcclxuICBvdXRbMV0gPSBtMDE7XHJcbiAgb3V0WzJdID0gbTAyO1xyXG4gIG91dFszXSA9IG0wMztcclxuICBvdXRbNF0gPSBtMTA7XHJcbiAgb3V0WzVdID0gbTExO1xyXG4gIG91dFs2XSA9IG0xMjtcclxuICBvdXRbN10gPSBtMTM7XHJcbiAgb3V0WzhdID0gbTIwO1xyXG4gIG91dFs5XSA9IG0yMTtcclxuICBvdXRbMTBdID0gbTIyO1xyXG4gIG91dFsxMV0gPSBtMjM7XHJcbiAgb3V0WzEyXSA9IG0zMDtcclxuICBvdXRbMTNdID0gbTMxO1xyXG4gIG91dFsxNF0gPSBtMzI7XHJcbiAgb3V0WzE1XSA9IG0zMztcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogU2V0IHRoZSBjb21wb25lbnRzIG9mIGEgbWF0NCB0byB0aGUgZ2l2ZW4gdmFsdWVzXHJcbiAqXHJcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMDAgQ29tcG9uZW50IGluIGNvbHVtbiAwLCByb3cgMCBwb3NpdGlvbiAoaW5kZXggMClcclxuICogQHBhcmFtIHtOdW1iZXJ9IG0wMSBDb21wb25lbnQgaW4gY29sdW1uIDAsIHJvdyAxIHBvc2l0aW9uIChpbmRleCAxKVxyXG4gKiBAcGFyYW0ge051bWJlcn0gbTAyIENvbXBvbmVudCBpbiBjb2x1bW4gMCwgcm93IDIgcG9zaXRpb24gKGluZGV4IDIpXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMDMgQ29tcG9uZW50IGluIGNvbHVtbiAwLCByb3cgMyBwb3NpdGlvbiAoaW5kZXggMylcclxuICogQHBhcmFtIHtOdW1iZXJ9IG0xMCBDb21wb25lbnQgaW4gY29sdW1uIDEsIHJvdyAwIHBvc2l0aW9uIChpbmRleCA0KVxyXG4gKiBAcGFyYW0ge051bWJlcn0gbTExIENvbXBvbmVudCBpbiBjb2x1bW4gMSwgcm93IDEgcG9zaXRpb24gKGluZGV4IDUpXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMTIgQ29tcG9uZW50IGluIGNvbHVtbiAxLCByb3cgMiBwb3NpdGlvbiAoaW5kZXggNilcclxuICogQHBhcmFtIHtOdW1iZXJ9IG0xMyBDb21wb25lbnQgaW4gY29sdW1uIDEsIHJvdyAzIHBvc2l0aW9uIChpbmRleCA3KVxyXG4gKiBAcGFyYW0ge051bWJlcn0gbTIwIENvbXBvbmVudCBpbiBjb2x1bW4gMiwgcm93IDAgcG9zaXRpb24gKGluZGV4IDgpXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMjEgQ29tcG9uZW50IGluIGNvbHVtbiAyLCByb3cgMSBwb3NpdGlvbiAoaW5kZXggOSlcclxuICogQHBhcmFtIHtOdW1iZXJ9IG0yMiBDb21wb25lbnQgaW4gY29sdW1uIDIsIHJvdyAyIHBvc2l0aW9uIChpbmRleCAxMClcclxuICogQHBhcmFtIHtOdW1iZXJ9IG0yMyBDb21wb25lbnQgaW4gY29sdW1uIDIsIHJvdyAzIHBvc2l0aW9uIChpbmRleCAxMSlcclxuICogQHBhcmFtIHtOdW1iZXJ9IG0zMCBDb21wb25lbnQgaW4gY29sdW1uIDMsIHJvdyAwIHBvc2l0aW9uIChpbmRleCAxMilcclxuICogQHBhcmFtIHtOdW1iZXJ9IG0zMSBDb21wb25lbnQgaW4gY29sdW1uIDMsIHJvdyAxIHBvc2l0aW9uIChpbmRleCAxMylcclxuICogQHBhcmFtIHtOdW1iZXJ9IG0zMiBDb21wb25lbnQgaW4gY29sdW1uIDMsIHJvdyAyIHBvc2l0aW9uIChpbmRleCAxNClcclxuICogQHBhcmFtIHtOdW1iZXJ9IG0zMyBDb21wb25lbnQgaW4gY29sdW1uIDMsIHJvdyAzIHBvc2l0aW9uIChpbmRleCAxNSlcclxuICogQHJldHVybnMge21hdDR9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHNldChvdXQsIG0wMCwgbTAxLCBtMDIsIG0wMywgbTEwLCBtMTEsIG0xMiwgbTEzLCBtMjAsIG0yMSwgbTIyLCBtMjMsIG0zMCwgbTMxLCBtMzIsIG0zMykge1xyXG4gIG91dFswXSA9IG0wMDtcclxuICBvdXRbMV0gPSBtMDE7XHJcbiAgb3V0WzJdID0gbTAyO1xyXG4gIG91dFszXSA9IG0wMztcclxuICBvdXRbNF0gPSBtMTA7XHJcbiAgb3V0WzVdID0gbTExO1xyXG4gIG91dFs2XSA9IG0xMjtcclxuICBvdXRbN10gPSBtMTM7XHJcbiAgb3V0WzhdID0gbTIwO1xyXG4gIG91dFs5XSA9IG0yMTtcclxuICBvdXRbMTBdID0gbTIyO1xyXG4gIG91dFsxMV0gPSBtMjM7XHJcbiAgb3V0WzEyXSA9IG0zMDtcclxuICBvdXRbMTNdID0gbTMxO1xyXG4gIG91dFsxNF0gPSBtMzI7XHJcbiAgb3V0WzE1XSA9IG0zMztcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogU2V0IGEgbWF0NCB0byB0aGUgaWRlbnRpdHkgbWF0cml4XHJcbiAqXHJcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XHJcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpZGVudGl0eShvdXQpIHtcclxuICBvdXRbMF0gPSAxO1xyXG4gIG91dFsxXSA9IDA7XHJcbiAgb3V0WzJdID0gMDtcclxuICBvdXRbM10gPSAwO1xyXG4gIG91dFs0XSA9IDA7XHJcbiAgb3V0WzVdID0gMTtcclxuICBvdXRbNl0gPSAwO1xyXG4gIG91dFs3XSA9IDA7XHJcbiAgb3V0WzhdID0gMDtcclxuICBvdXRbOV0gPSAwO1xyXG4gIG91dFsxMF0gPSAxO1xyXG4gIG91dFsxMV0gPSAwO1xyXG4gIG91dFsxMl0gPSAwO1xyXG4gIG91dFsxM10gPSAwO1xyXG4gIG91dFsxNF0gPSAwO1xyXG4gIG91dFsxNV0gPSAxO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUcmFuc3Bvc2UgdGhlIHZhbHVlcyBvZiBhIG1hdDRcclxuICpcclxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcclxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBzb3VyY2UgbWF0cml4XHJcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiB0cmFuc3Bvc2Uob3V0LCBhKSB7XHJcbiAgLy8gSWYgd2UgYXJlIHRyYW5zcG9zaW5nIG91cnNlbHZlcyB3ZSBjYW4gc2tpcCBhIGZldyBzdGVwcyBidXQgaGF2ZSB0byBjYWNoZSBzb21lIHZhbHVlc1xyXG4gIGlmIChvdXQgPT09IGEpIHtcclxuICAgIHZhciBhMDEgPSBhWzFdLFxyXG4gICAgICAgIGEwMiA9IGFbMl0sXHJcbiAgICAgICAgYTAzID0gYVszXTtcclxuICAgIHZhciBhMTIgPSBhWzZdLFxyXG4gICAgICAgIGExMyA9IGFbN107XHJcbiAgICB2YXIgYTIzID0gYVsxMV07XHJcblxyXG4gICAgb3V0WzFdID0gYVs0XTtcclxuICAgIG91dFsyXSA9IGFbOF07XHJcbiAgICBvdXRbM10gPSBhWzEyXTtcclxuICAgIG91dFs0XSA9IGEwMTtcclxuICAgIG91dFs2XSA9IGFbOV07XHJcbiAgICBvdXRbN10gPSBhWzEzXTtcclxuICAgIG91dFs4XSA9IGEwMjtcclxuICAgIG91dFs5XSA9IGExMjtcclxuICAgIG91dFsxMV0gPSBhWzE0XTtcclxuICAgIG91dFsxMl0gPSBhMDM7XHJcbiAgICBvdXRbMTNdID0gYTEzO1xyXG4gICAgb3V0WzE0XSA9IGEyMztcclxuICB9IGVsc2Uge1xyXG4gICAgb3V0WzBdID0gYVswXTtcclxuICAgIG91dFsxXSA9IGFbNF07XHJcbiAgICBvdXRbMl0gPSBhWzhdO1xyXG4gICAgb3V0WzNdID0gYVsxMl07XHJcbiAgICBvdXRbNF0gPSBhWzFdO1xyXG4gICAgb3V0WzVdID0gYVs1XTtcclxuICAgIG91dFs2XSA9IGFbOV07XHJcbiAgICBvdXRbN10gPSBhWzEzXTtcclxuICAgIG91dFs4XSA9IGFbMl07XHJcbiAgICBvdXRbOV0gPSBhWzZdO1xyXG4gICAgb3V0WzEwXSA9IGFbMTBdO1xyXG4gICAgb3V0WzExXSA9IGFbMTRdO1xyXG4gICAgb3V0WzEyXSA9IGFbM107XHJcbiAgICBvdXRbMTNdID0gYVs3XTtcclxuICAgIG91dFsxNF0gPSBhWzExXTtcclxuICAgIG91dFsxNV0gPSBhWzE1XTtcclxuICB9XHJcblxyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbnZlcnRzIGEgbWF0NFxyXG4gKlxyXG4gKiBAcGFyYW0ge21hdDR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxyXG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIHNvdXJjZSBtYXRyaXhcclxuICogQHJldHVybnMge21hdDR9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGludmVydChvdXQsIGEpIHtcclxuICB2YXIgYTAwID0gYVswXSxcclxuICAgICAgYTAxID0gYVsxXSxcclxuICAgICAgYTAyID0gYVsyXSxcclxuICAgICAgYTAzID0gYVszXTtcclxuICB2YXIgYTEwID0gYVs0XSxcclxuICAgICAgYTExID0gYVs1XSxcclxuICAgICAgYTEyID0gYVs2XSxcclxuICAgICAgYTEzID0gYVs3XTtcclxuICB2YXIgYTIwID0gYVs4XSxcclxuICAgICAgYTIxID0gYVs5XSxcclxuICAgICAgYTIyID0gYVsxMF0sXHJcbiAgICAgIGEyMyA9IGFbMTFdO1xyXG4gIHZhciBhMzAgPSBhWzEyXSxcclxuICAgICAgYTMxID0gYVsxM10sXHJcbiAgICAgIGEzMiA9IGFbMTRdLFxyXG4gICAgICBhMzMgPSBhWzE1XTtcclxuXHJcbiAgdmFyIGIwMCA9IGEwMCAqIGExMSAtIGEwMSAqIGExMDtcclxuICB2YXIgYjAxID0gYTAwICogYTEyIC0gYTAyICogYTEwO1xyXG4gIHZhciBiMDIgPSBhMDAgKiBhMTMgLSBhMDMgKiBhMTA7XHJcbiAgdmFyIGIwMyA9IGEwMSAqIGExMiAtIGEwMiAqIGExMTtcclxuICB2YXIgYjA0ID0gYTAxICogYTEzIC0gYTAzICogYTExO1xyXG4gIHZhciBiMDUgPSBhMDIgKiBhMTMgLSBhMDMgKiBhMTI7XHJcbiAgdmFyIGIwNiA9IGEyMCAqIGEzMSAtIGEyMSAqIGEzMDtcclxuICB2YXIgYjA3ID0gYTIwICogYTMyIC0gYTIyICogYTMwO1xyXG4gIHZhciBiMDggPSBhMjAgKiBhMzMgLSBhMjMgKiBhMzA7XHJcbiAgdmFyIGIwOSA9IGEyMSAqIGEzMiAtIGEyMiAqIGEzMTtcclxuICB2YXIgYjEwID0gYTIxICogYTMzIC0gYTIzICogYTMxO1xyXG4gIHZhciBiMTEgPSBhMjIgKiBhMzMgLSBhMjMgKiBhMzI7XHJcblxyXG4gIC8vIENhbGN1bGF0ZSB0aGUgZGV0ZXJtaW5hbnRcclxuICB2YXIgZGV0ID0gYjAwICogYjExIC0gYjAxICogYjEwICsgYjAyICogYjA5ICsgYjAzICogYjA4IC0gYjA0ICogYjA3ICsgYjA1ICogYjA2O1xyXG5cclxuICBpZiAoIWRldCkge1xyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG4gIGRldCA9IDEuMCAvIGRldDtcclxuXHJcbiAgb3V0WzBdID0gKGExMSAqIGIxMSAtIGExMiAqIGIxMCArIGExMyAqIGIwOSkgKiBkZXQ7XHJcbiAgb3V0WzFdID0gKGEwMiAqIGIxMCAtIGEwMSAqIGIxMSAtIGEwMyAqIGIwOSkgKiBkZXQ7XHJcbiAgb3V0WzJdID0gKGEzMSAqIGIwNSAtIGEzMiAqIGIwNCArIGEzMyAqIGIwMykgKiBkZXQ7XHJcbiAgb3V0WzNdID0gKGEyMiAqIGIwNCAtIGEyMSAqIGIwNSAtIGEyMyAqIGIwMykgKiBkZXQ7XHJcbiAgb3V0WzRdID0gKGExMiAqIGIwOCAtIGExMCAqIGIxMSAtIGExMyAqIGIwNykgKiBkZXQ7XHJcbiAgb3V0WzVdID0gKGEwMCAqIGIxMSAtIGEwMiAqIGIwOCArIGEwMyAqIGIwNykgKiBkZXQ7XHJcbiAgb3V0WzZdID0gKGEzMiAqIGIwMiAtIGEzMCAqIGIwNSAtIGEzMyAqIGIwMSkgKiBkZXQ7XHJcbiAgb3V0WzddID0gKGEyMCAqIGIwNSAtIGEyMiAqIGIwMiArIGEyMyAqIGIwMSkgKiBkZXQ7XHJcbiAgb3V0WzhdID0gKGExMCAqIGIxMCAtIGExMSAqIGIwOCArIGExMyAqIGIwNikgKiBkZXQ7XHJcbiAgb3V0WzldID0gKGEwMSAqIGIwOCAtIGEwMCAqIGIxMCAtIGEwMyAqIGIwNikgKiBkZXQ7XHJcbiAgb3V0WzEwXSA9IChhMzAgKiBiMDQgLSBhMzEgKiBiMDIgKyBhMzMgKiBiMDApICogZGV0O1xyXG4gIG91dFsxMV0gPSAoYTIxICogYjAyIC0gYTIwICogYjA0IC0gYTIzICogYjAwKSAqIGRldDtcclxuICBvdXRbMTJdID0gKGExMSAqIGIwNyAtIGExMCAqIGIwOSAtIGExMiAqIGIwNikgKiBkZXQ7XHJcbiAgb3V0WzEzXSA9IChhMDAgKiBiMDkgLSBhMDEgKiBiMDcgKyBhMDIgKiBiMDYpICogZGV0O1xyXG4gIG91dFsxNF0gPSAoYTMxICogYjAxIC0gYTMwICogYjAzIC0gYTMyICogYjAwKSAqIGRldDtcclxuICBvdXRbMTVdID0gKGEyMCAqIGIwMyAtIGEyMSAqIGIwMSArIGEyMiAqIGIwMCkgKiBkZXQ7XHJcblxyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDYWxjdWxhdGVzIHRoZSBhZGp1Z2F0ZSBvZiBhIG1hdDRcclxuICpcclxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcclxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBzb3VyY2UgbWF0cml4XHJcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBhZGpvaW50KG91dCwgYSkge1xyXG4gIHZhciBhMDAgPSBhWzBdLFxyXG4gICAgICBhMDEgPSBhWzFdLFxyXG4gICAgICBhMDIgPSBhWzJdLFxyXG4gICAgICBhMDMgPSBhWzNdO1xyXG4gIHZhciBhMTAgPSBhWzRdLFxyXG4gICAgICBhMTEgPSBhWzVdLFxyXG4gICAgICBhMTIgPSBhWzZdLFxyXG4gICAgICBhMTMgPSBhWzddO1xyXG4gIHZhciBhMjAgPSBhWzhdLFxyXG4gICAgICBhMjEgPSBhWzldLFxyXG4gICAgICBhMjIgPSBhWzEwXSxcclxuICAgICAgYTIzID0gYVsxMV07XHJcbiAgdmFyIGEzMCA9IGFbMTJdLFxyXG4gICAgICBhMzEgPSBhWzEzXSxcclxuICAgICAgYTMyID0gYVsxNF0sXHJcbiAgICAgIGEzMyA9IGFbMTVdO1xyXG5cclxuICBvdXRbMF0gPSBhMTEgKiAoYTIyICogYTMzIC0gYTIzICogYTMyKSAtIGEyMSAqIChhMTIgKiBhMzMgLSBhMTMgKiBhMzIpICsgYTMxICogKGExMiAqIGEyMyAtIGExMyAqIGEyMik7XHJcbiAgb3V0WzFdID0gLShhMDEgKiAoYTIyICogYTMzIC0gYTIzICogYTMyKSAtIGEyMSAqIChhMDIgKiBhMzMgLSBhMDMgKiBhMzIpICsgYTMxICogKGEwMiAqIGEyMyAtIGEwMyAqIGEyMikpO1xyXG4gIG91dFsyXSA9IGEwMSAqIChhMTIgKiBhMzMgLSBhMTMgKiBhMzIpIC0gYTExICogKGEwMiAqIGEzMyAtIGEwMyAqIGEzMikgKyBhMzEgKiAoYTAyICogYTEzIC0gYTAzICogYTEyKTtcclxuICBvdXRbM10gPSAtKGEwMSAqIChhMTIgKiBhMjMgLSBhMTMgKiBhMjIpIC0gYTExICogKGEwMiAqIGEyMyAtIGEwMyAqIGEyMikgKyBhMjEgKiAoYTAyICogYTEzIC0gYTAzICogYTEyKSk7XHJcbiAgb3V0WzRdID0gLShhMTAgKiAoYTIyICogYTMzIC0gYTIzICogYTMyKSAtIGEyMCAqIChhMTIgKiBhMzMgLSBhMTMgKiBhMzIpICsgYTMwICogKGExMiAqIGEyMyAtIGExMyAqIGEyMikpO1xyXG4gIG91dFs1XSA9IGEwMCAqIChhMjIgKiBhMzMgLSBhMjMgKiBhMzIpIC0gYTIwICogKGEwMiAqIGEzMyAtIGEwMyAqIGEzMikgKyBhMzAgKiAoYTAyICogYTIzIC0gYTAzICogYTIyKTtcclxuICBvdXRbNl0gPSAtKGEwMCAqIChhMTIgKiBhMzMgLSBhMTMgKiBhMzIpIC0gYTEwICogKGEwMiAqIGEzMyAtIGEwMyAqIGEzMikgKyBhMzAgKiAoYTAyICogYTEzIC0gYTAzICogYTEyKSk7XHJcbiAgb3V0WzddID0gYTAwICogKGExMiAqIGEyMyAtIGExMyAqIGEyMikgLSBhMTAgKiAoYTAyICogYTIzIC0gYTAzICogYTIyKSArIGEyMCAqIChhMDIgKiBhMTMgLSBhMDMgKiBhMTIpO1xyXG4gIG91dFs4XSA9IGExMCAqIChhMjEgKiBhMzMgLSBhMjMgKiBhMzEpIC0gYTIwICogKGExMSAqIGEzMyAtIGExMyAqIGEzMSkgKyBhMzAgKiAoYTExICogYTIzIC0gYTEzICogYTIxKTtcclxuICBvdXRbOV0gPSAtKGEwMCAqIChhMjEgKiBhMzMgLSBhMjMgKiBhMzEpIC0gYTIwICogKGEwMSAqIGEzMyAtIGEwMyAqIGEzMSkgKyBhMzAgKiAoYTAxICogYTIzIC0gYTAzICogYTIxKSk7XHJcbiAgb3V0WzEwXSA9IGEwMCAqIChhMTEgKiBhMzMgLSBhMTMgKiBhMzEpIC0gYTEwICogKGEwMSAqIGEzMyAtIGEwMyAqIGEzMSkgKyBhMzAgKiAoYTAxICogYTEzIC0gYTAzICogYTExKTtcclxuICBvdXRbMTFdID0gLShhMDAgKiAoYTExICogYTIzIC0gYTEzICogYTIxKSAtIGExMCAqIChhMDEgKiBhMjMgLSBhMDMgKiBhMjEpICsgYTIwICogKGEwMSAqIGExMyAtIGEwMyAqIGExMSkpO1xyXG4gIG91dFsxMl0gPSAtKGExMCAqIChhMjEgKiBhMzIgLSBhMjIgKiBhMzEpIC0gYTIwICogKGExMSAqIGEzMiAtIGExMiAqIGEzMSkgKyBhMzAgKiAoYTExICogYTIyIC0gYTEyICogYTIxKSk7XHJcbiAgb3V0WzEzXSA9IGEwMCAqIChhMjEgKiBhMzIgLSBhMjIgKiBhMzEpIC0gYTIwICogKGEwMSAqIGEzMiAtIGEwMiAqIGEzMSkgKyBhMzAgKiAoYTAxICogYTIyIC0gYTAyICogYTIxKTtcclxuICBvdXRbMTRdID0gLShhMDAgKiAoYTExICogYTMyIC0gYTEyICogYTMxKSAtIGExMCAqIChhMDEgKiBhMzIgLSBhMDIgKiBhMzEpICsgYTMwICogKGEwMSAqIGExMiAtIGEwMiAqIGExMSkpO1xyXG4gIG91dFsxNV0gPSBhMDAgKiAoYTExICogYTIyIC0gYTEyICogYTIxKSAtIGExMCAqIChhMDEgKiBhMjIgLSBhMDIgKiBhMjEpICsgYTIwICogKGEwMSAqIGExMiAtIGEwMiAqIGExMSk7XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIENhbGN1bGF0ZXMgdGhlIGRldGVybWluYW50IG9mIGEgbWF0NFxyXG4gKlxyXG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIHNvdXJjZSBtYXRyaXhcclxuICogQHJldHVybnMge051bWJlcn0gZGV0ZXJtaW5hbnQgb2YgYVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGRldGVybWluYW50KGEpIHtcclxuICB2YXIgYTAwID0gYVswXSxcclxuICAgICAgYTAxID0gYVsxXSxcclxuICAgICAgYTAyID0gYVsyXSxcclxuICAgICAgYTAzID0gYVszXTtcclxuICB2YXIgYTEwID0gYVs0XSxcclxuICAgICAgYTExID0gYVs1XSxcclxuICAgICAgYTEyID0gYVs2XSxcclxuICAgICAgYTEzID0gYVs3XTtcclxuICB2YXIgYTIwID0gYVs4XSxcclxuICAgICAgYTIxID0gYVs5XSxcclxuICAgICAgYTIyID0gYVsxMF0sXHJcbiAgICAgIGEyMyA9IGFbMTFdO1xyXG4gIHZhciBhMzAgPSBhWzEyXSxcclxuICAgICAgYTMxID0gYVsxM10sXHJcbiAgICAgIGEzMiA9IGFbMTRdLFxyXG4gICAgICBhMzMgPSBhWzE1XTtcclxuXHJcbiAgdmFyIGIwMCA9IGEwMCAqIGExMSAtIGEwMSAqIGExMDtcclxuICB2YXIgYjAxID0gYTAwICogYTEyIC0gYTAyICogYTEwO1xyXG4gIHZhciBiMDIgPSBhMDAgKiBhMTMgLSBhMDMgKiBhMTA7XHJcbiAgdmFyIGIwMyA9IGEwMSAqIGExMiAtIGEwMiAqIGExMTtcclxuICB2YXIgYjA0ID0gYTAxICogYTEzIC0gYTAzICogYTExO1xyXG4gIHZhciBiMDUgPSBhMDIgKiBhMTMgLSBhMDMgKiBhMTI7XHJcbiAgdmFyIGIwNiA9IGEyMCAqIGEzMSAtIGEyMSAqIGEzMDtcclxuICB2YXIgYjA3ID0gYTIwICogYTMyIC0gYTIyICogYTMwO1xyXG4gIHZhciBiMDggPSBhMjAgKiBhMzMgLSBhMjMgKiBhMzA7XHJcbiAgdmFyIGIwOSA9IGEyMSAqIGEzMiAtIGEyMiAqIGEzMTtcclxuICB2YXIgYjEwID0gYTIxICogYTMzIC0gYTIzICogYTMxO1xyXG4gIHZhciBiMTEgPSBhMjIgKiBhMzMgLSBhMjMgKiBhMzI7XHJcblxyXG4gIC8vIENhbGN1bGF0ZSB0aGUgZGV0ZXJtaW5hbnRcclxuICByZXR1cm4gYjAwICogYjExIC0gYjAxICogYjEwICsgYjAyICogYjA5ICsgYjAzICogYjA4IC0gYjA0ICogYjA3ICsgYjA1ICogYjA2O1xyXG59XHJcblxyXG4vKipcclxuICogTXVsdGlwbGllcyB0d28gbWF0NHNcclxuICpcclxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcclxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXHJcbiAqIEBwYXJhbSB7bWF0NH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcclxuICogQHJldHVybnMge21hdDR9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIG11bHRpcGx5KG91dCwgYSwgYikge1xyXG4gIHZhciBhMDAgPSBhWzBdLFxyXG4gICAgICBhMDEgPSBhWzFdLFxyXG4gICAgICBhMDIgPSBhWzJdLFxyXG4gICAgICBhMDMgPSBhWzNdO1xyXG4gIHZhciBhMTAgPSBhWzRdLFxyXG4gICAgICBhMTEgPSBhWzVdLFxyXG4gICAgICBhMTIgPSBhWzZdLFxyXG4gICAgICBhMTMgPSBhWzddO1xyXG4gIHZhciBhMjAgPSBhWzhdLFxyXG4gICAgICBhMjEgPSBhWzldLFxyXG4gICAgICBhMjIgPSBhWzEwXSxcclxuICAgICAgYTIzID0gYVsxMV07XHJcbiAgdmFyIGEzMCA9IGFbMTJdLFxyXG4gICAgICBhMzEgPSBhWzEzXSxcclxuICAgICAgYTMyID0gYVsxNF0sXHJcbiAgICAgIGEzMyA9IGFbMTVdO1xyXG5cclxuICAvLyBDYWNoZSBvbmx5IHRoZSBjdXJyZW50IGxpbmUgb2YgdGhlIHNlY29uZCBtYXRyaXhcclxuICB2YXIgYjAgPSBiWzBdLFxyXG4gICAgICBiMSA9IGJbMV0sXHJcbiAgICAgIGIyID0gYlsyXSxcclxuICAgICAgYjMgPSBiWzNdO1xyXG4gIG91dFswXSA9IGIwICogYTAwICsgYjEgKiBhMTAgKyBiMiAqIGEyMCArIGIzICogYTMwO1xyXG4gIG91dFsxXSA9IGIwICogYTAxICsgYjEgKiBhMTEgKyBiMiAqIGEyMSArIGIzICogYTMxO1xyXG4gIG91dFsyXSA9IGIwICogYTAyICsgYjEgKiBhMTIgKyBiMiAqIGEyMiArIGIzICogYTMyO1xyXG4gIG91dFszXSA9IGIwICogYTAzICsgYjEgKiBhMTMgKyBiMiAqIGEyMyArIGIzICogYTMzO1xyXG5cclxuICBiMCA9IGJbNF07YjEgPSBiWzVdO2IyID0gYls2XTtiMyA9IGJbN107XHJcbiAgb3V0WzRdID0gYjAgKiBhMDAgKyBiMSAqIGExMCArIGIyICogYTIwICsgYjMgKiBhMzA7XHJcbiAgb3V0WzVdID0gYjAgKiBhMDEgKyBiMSAqIGExMSArIGIyICogYTIxICsgYjMgKiBhMzE7XHJcbiAgb3V0WzZdID0gYjAgKiBhMDIgKyBiMSAqIGExMiArIGIyICogYTIyICsgYjMgKiBhMzI7XHJcbiAgb3V0WzddID0gYjAgKiBhMDMgKyBiMSAqIGExMyArIGIyICogYTIzICsgYjMgKiBhMzM7XHJcblxyXG4gIGIwID0gYls4XTtiMSA9IGJbOV07YjIgPSBiWzEwXTtiMyA9IGJbMTFdO1xyXG4gIG91dFs4XSA9IGIwICogYTAwICsgYjEgKiBhMTAgKyBiMiAqIGEyMCArIGIzICogYTMwO1xyXG4gIG91dFs5XSA9IGIwICogYTAxICsgYjEgKiBhMTEgKyBiMiAqIGEyMSArIGIzICogYTMxO1xyXG4gIG91dFsxMF0gPSBiMCAqIGEwMiArIGIxICogYTEyICsgYjIgKiBhMjIgKyBiMyAqIGEzMjtcclxuICBvdXRbMTFdID0gYjAgKiBhMDMgKyBiMSAqIGExMyArIGIyICogYTIzICsgYjMgKiBhMzM7XHJcblxyXG4gIGIwID0gYlsxMl07YjEgPSBiWzEzXTtiMiA9IGJbMTRdO2IzID0gYlsxNV07XHJcbiAgb3V0WzEyXSA9IGIwICogYTAwICsgYjEgKiBhMTAgKyBiMiAqIGEyMCArIGIzICogYTMwO1xyXG4gIG91dFsxM10gPSBiMCAqIGEwMSArIGIxICogYTExICsgYjIgKiBhMjEgKyBiMyAqIGEzMTtcclxuICBvdXRbMTRdID0gYjAgKiBhMDIgKyBiMSAqIGExMiArIGIyICogYTIyICsgYjMgKiBhMzI7XHJcbiAgb3V0WzE1XSA9IGIwICogYTAzICsgYjEgKiBhMTMgKyBiMiAqIGEyMyArIGIzICogYTMzO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUcmFuc2xhdGUgYSBtYXQ0IGJ5IHRoZSBnaXZlbiB2ZWN0b3JcclxuICpcclxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcclxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBtYXRyaXggdG8gdHJhbnNsYXRlXHJcbiAqIEBwYXJhbSB7dmVjM30gdiB2ZWN0b3IgdG8gdHJhbnNsYXRlIGJ5XHJcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiB0cmFuc2xhdGUob3V0LCBhLCB2KSB7XHJcbiAgdmFyIHggPSB2WzBdLFxyXG4gICAgICB5ID0gdlsxXSxcclxuICAgICAgeiA9IHZbMl07XHJcbiAgdmFyIGEwMCA9IHZvaWQgMCxcclxuICAgICAgYTAxID0gdm9pZCAwLFxyXG4gICAgICBhMDIgPSB2b2lkIDAsXHJcbiAgICAgIGEwMyA9IHZvaWQgMDtcclxuICB2YXIgYTEwID0gdm9pZCAwLFxyXG4gICAgICBhMTEgPSB2b2lkIDAsXHJcbiAgICAgIGExMiA9IHZvaWQgMCxcclxuICAgICAgYTEzID0gdm9pZCAwO1xyXG4gIHZhciBhMjAgPSB2b2lkIDAsXHJcbiAgICAgIGEyMSA9IHZvaWQgMCxcclxuICAgICAgYTIyID0gdm9pZCAwLFxyXG4gICAgICBhMjMgPSB2b2lkIDA7XHJcblxyXG4gIGlmIChhID09PSBvdXQpIHtcclxuICAgIG91dFsxMl0gPSBhWzBdICogeCArIGFbNF0gKiB5ICsgYVs4XSAqIHogKyBhWzEyXTtcclxuICAgIG91dFsxM10gPSBhWzFdICogeCArIGFbNV0gKiB5ICsgYVs5XSAqIHogKyBhWzEzXTtcclxuICAgIG91dFsxNF0gPSBhWzJdICogeCArIGFbNl0gKiB5ICsgYVsxMF0gKiB6ICsgYVsxNF07XHJcbiAgICBvdXRbMTVdID0gYVszXSAqIHggKyBhWzddICogeSArIGFbMTFdICogeiArIGFbMTVdO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBhMDAgPSBhWzBdO2EwMSA9IGFbMV07YTAyID0gYVsyXTthMDMgPSBhWzNdO1xyXG4gICAgYTEwID0gYVs0XTthMTEgPSBhWzVdO2ExMiA9IGFbNl07YTEzID0gYVs3XTtcclxuICAgIGEyMCA9IGFbOF07YTIxID0gYVs5XTthMjIgPSBhWzEwXTthMjMgPSBhWzExXTtcclxuXHJcbiAgICBvdXRbMF0gPSBhMDA7b3V0WzFdID0gYTAxO291dFsyXSA9IGEwMjtvdXRbM10gPSBhMDM7XHJcbiAgICBvdXRbNF0gPSBhMTA7b3V0WzVdID0gYTExO291dFs2XSA9IGExMjtvdXRbN10gPSBhMTM7XHJcbiAgICBvdXRbOF0gPSBhMjA7b3V0WzldID0gYTIxO291dFsxMF0gPSBhMjI7b3V0WzExXSA9IGEyMztcclxuXHJcbiAgICBvdXRbMTJdID0gYTAwICogeCArIGExMCAqIHkgKyBhMjAgKiB6ICsgYVsxMl07XHJcbiAgICBvdXRbMTNdID0gYTAxICogeCArIGExMSAqIHkgKyBhMjEgKiB6ICsgYVsxM107XHJcbiAgICBvdXRbMTRdID0gYTAyICogeCArIGExMiAqIHkgKyBhMjIgKiB6ICsgYVsxNF07XHJcbiAgICBvdXRbMTVdID0gYTAzICogeCArIGExMyAqIHkgKyBhMjMgKiB6ICsgYVsxNV07XHJcbiAgfVxyXG5cclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogU2NhbGVzIHRoZSBtYXQ0IGJ5IHRoZSBkaW1lbnNpb25zIGluIHRoZSBnaXZlbiB2ZWMzIG5vdCB1c2luZyB2ZWN0b3JpemF0aW9uXHJcbiAqXHJcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XHJcbiAqIEBwYXJhbSB7bWF0NH0gYSB0aGUgbWF0cml4IHRvIHNjYWxlXHJcbiAqIEBwYXJhbSB7dmVjM30gdiB0aGUgdmVjMyB0byBzY2FsZSB0aGUgbWF0cml4IGJ5XHJcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcclxuICoqL1xyXG5leHBvcnQgZnVuY3Rpb24gc2NhbGUob3V0LCBhLCB2KSB7XHJcbiAgdmFyIHggPSB2WzBdLFxyXG4gICAgICB5ID0gdlsxXSxcclxuICAgICAgeiA9IHZbMl07XHJcblxyXG4gIG91dFswXSA9IGFbMF0gKiB4O1xyXG4gIG91dFsxXSA9IGFbMV0gKiB4O1xyXG4gIG91dFsyXSA9IGFbMl0gKiB4O1xyXG4gIG91dFszXSA9IGFbM10gKiB4O1xyXG4gIG91dFs0XSA9IGFbNF0gKiB5O1xyXG4gIG91dFs1XSA9IGFbNV0gKiB5O1xyXG4gIG91dFs2XSA9IGFbNl0gKiB5O1xyXG4gIG91dFs3XSA9IGFbN10gKiB5O1xyXG4gIG91dFs4XSA9IGFbOF0gKiB6O1xyXG4gIG91dFs5XSA9IGFbOV0gKiB6O1xyXG4gIG91dFsxMF0gPSBhWzEwXSAqIHo7XHJcbiAgb3V0WzExXSA9IGFbMTFdICogejtcclxuICBvdXRbMTJdID0gYVsxMl07XHJcbiAgb3V0WzEzXSA9IGFbMTNdO1xyXG4gIG91dFsxNF0gPSBhWzE0XTtcclxuICBvdXRbMTVdID0gYVsxNV07XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJvdGF0ZXMgYSBtYXQ0IGJ5IHRoZSBnaXZlbiBhbmdsZSBhcm91bmQgdGhlIGdpdmVuIGF4aXNcclxuICpcclxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcclxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBtYXRyaXggdG8gcm90YXRlXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XHJcbiAqIEBwYXJhbSB7dmVjM30gYXhpcyB0aGUgYXhpcyB0byByb3RhdGUgYXJvdW5kXHJcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiByb3RhdGUob3V0LCBhLCByYWQsIGF4aXMpIHtcclxuICB2YXIgeCA9IGF4aXNbMF0sXHJcbiAgICAgIHkgPSBheGlzWzFdLFxyXG4gICAgICB6ID0gYXhpc1syXTtcclxuICB2YXIgbGVuID0gTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkgKyB6ICogeik7XHJcbiAgdmFyIHMgPSB2b2lkIDAsXHJcbiAgICAgIGMgPSB2b2lkIDAsXHJcbiAgICAgIHQgPSB2b2lkIDA7XHJcbiAgdmFyIGEwMCA9IHZvaWQgMCxcclxuICAgICAgYTAxID0gdm9pZCAwLFxyXG4gICAgICBhMDIgPSB2b2lkIDAsXHJcbiAgICAgIGEwMyA9IHZvaWQgMDtcclxuICB2YXIgYTEwID0gdm9pZCAwLFxyXG4gICAgICBhMTEgPSB2b2lkIDAsXHJcbiAgICAgIGExMiA9IHZvaWQgMCxcclxuICAgICAgYTEzID0gdm9pZCAwO1xyXG4gIHZhciBhMjAgPSB2b2lkIDAsXHJcbiAgICAgIGEyMSA9IHZvaWQgMCxcclxuICAgICAgYTIyID0gdm9pZCAwLFxyXG4gICAgICBhMjMgPSB2b2lkIDA7XHJcbiAgdmFyIGIwMCA9IHZvaWQgMCxcclxuICAgICAgYjAxID0gdm9pZCAwLFxyXG4gICAgICBiMDIgPSB2b2lkIDA7XHJcbiAgdmFyIGIxMCA9IHZvaWQgMCxcclxuICAgICAgYjExID0gdm9pZCAwLFxyXG4gICAgICBiMTIgPSB2b2lkIDA7XHJcbiAgdmFyIGIyMCA9IHZvaWQgMCxcclxuICAgICAgYjIxID0gdm9pZCAwLFxyXG4gICAgICBiMjIgPSB2b2lkIDA7XHJcblxyXG4gIGlmIChsZW4gPCBnbE1hdHJpeC5FUFNJTE9OKSB7XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcblxyXG4gIGxlbiA9IDEgLyBsZW47XHJcbiAgeCAqPSBsZW47XHJcbiAgeSAqPSBsZW47XHJcbiAgeiAqPSBsZW47XHJcblxyXG4gIHMgPSBNYXRoLnNpbihyYWQpO1xyXG4gIGMgPSBNYXRoLmNvcyhyYWQpO1xyXG4gIHQgPSAxIC0gYztcclxuXHJcbiAgYTAwID0gYVswXTthMDEgPSBhWzFdO2EwMiA9IGFbMl07YTAzID0gYVszXTtcclxuICBhMTAgPSBhWzRdO2ExMSA9IGFbNV07YTEyID0gYVs2XTthMTMgPSBhWzddO1xyXG4gIGEyMCA9IGFbOF07YTIxID0gYVs5XTthMjIgPSBhWzEwXTthMjMgPSBhWzExXTtcclxuXHJcbiAgLy8gQ29uc3RydWN0IHRoZSBlbGVtZW50cyBvZiB0aGUgcm90YXRpb24gbWF0cml4XHJcbiAgYjAwID0geCAqIHggKiB0ICsgYztiMDEgPSB5ICogeCAqIHQgKyB6ICogcztiMDIgPSB6ICogeCAqIHQgLSB5ICogcztcclxuICBiMTAgPSB4ICogeSAqIHQgLSB6ICogcztiMTEgPSB5ICogeSAqIHQgKyBjO2IxMiA9IHogKiB5ICogdCArIHggKiBzO1xyXG4gIGIyMCA9IHggKiB6ICogdCArIHkgKiBzO2IyMSA9IHkgKiB6ICogdCAtIHggKiBzO2IyMiA9IHogKiB6ICogdCArIGM7XHJcblxyXG4gIC8vIFBlcmZvcm0gcm90YXRpb24tc3BlY2lmaWMgbWF0cml4IG11bHRpcGxpY2F0aW9uXHJcbiAgb3V0WzBdID0gYTAwICogYjAwICsgYTEwICogYjAxICsgYTIwICogYjAyO1xyXG4gIG91dFsxXSA9IGEwMSAqIGIwMCArIGExMSAqIGIwMSArIGEyMSAqIGIwMjtcclxuICBvdXRbMl0gPSBhMDIgKiBiMDAgKyBhMTIgKiBiMDEgKyBhMjIgKiBiMDI7XHJcbiAgb3V0WzNdID0gYTAzICogYjAwICsgYTEzICogYjAxICsgYTIzICogYjAyO1xyXG4gIG91dFs0XSA9IGEwMCAqIGIxMCArIGExMCAqIGIxMSArIGEyMCAqIGIxMjtcclxuICBvdXRbNV0gPSBhMDEgKiBiMTAgKyBhMTEgKiBiMTEgKyBhMjEgKiBiMTI7XHJcbiAgb3V0WzZdID0gYTAyICogYjEwICsgYTEyICogYjExICsgYTIyICogYjEyO1xyXG4gIG91dFs3XSA9IGEwMyAqIGIxMCArIGExMyAqIGIxMSArIGEyMyAqIGIxMjtcclxuICBvdXRbOF0gPSBhMDAgKiBiMjAgKyBhMTAgKiBiMjEgKyBhMjAgKiBiMjI7XHJcbiAgb3V0WzldID0gYTAxICogYjIwICsgYTExICogYjIxICsgYTIxICogYjIyO1xyXG4gIG91dFsxMF0gPSBhMDIgKiBiMjAgKyBhMTIgKiBiMjEgKyBhMjIgKiBiMjI7XHJcbiAgb3V0WzExXSA9IGEwMyAqIGIyMCArIGExMyAqIGIyMSArIGEyMyAqIGIyMjtcclxuXHJcbiAgaWYgKGEgIT09IG91dCkge1xyXG4gICAgLy8gSWYgdGhlIHNvdXJjZSBhbmQgZGVzdGluYXRpb24gZGlmZmVyLCBjb3B5IHRoZSB1bmNoYW5nZWQgbGFzdCByb3dcclxuICAgIG91dFsxMl0gPSBhWzEyXTtcclxuICAgIG91dFsxM10gPSBhWzEzXTtcclxuICAgIG91dFsxNF0gPSBhWzE0XTtcclxuICAgIG91dFsxNV0gPSBhWzE1XTtcclxuICB9XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJvdGF0ZXMgYSBtYXRyaXggYnkgdGhlIGdpdmVuIGFuZ2xlIGFyb3VuZCB0aGUgWCBheGlzXHJcbiAqXHJcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XHJcbiAqIEBwYXJhbSB7bWF0NH0gYSB0aGUgbWF0cml4IHRvIHJvdGF0ZVxyXG4gKiBAcGFyYW0ge051bWJlcn0gcmFkIHRoZSBhbmdsZSB0byByb3RhdGUgdGhlIG1hdHJpeCBieVxyXG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcm90YXRlWChvdXQsIGEsIHJhZCkge1xyXG4gIHZhciBzID0gTWF0aC5zaW4ocmFkKTtcclxuICB2YXIgYyA9IE1hdGguY29zKHJhZCk7XHJcbiAgdmFyIGExMCA9IGFbNF07XHJcbiAgdmFyIGExMSA9IGFbNV07XHJcbiAgdmFyIGExMiA9IGFbNl07XHJcbiAgdmFyIGExMyA9IGFbN107XHJcbiAgdmFyIGEyMCA9IGFbOF07XHJcbiAgdmFyIGEyMSA9IGFbOV07XHJcbiAgdmFyIGEyMiA9IGFbMTBdO1xyXG4gIHZhciBhMjMgPSBhWzExXTtcclxuXHJcbiAgaWYgKGEgIT09IG91dCkge1xyXG4gICAgLy8gSWYgdGhlIHNvdXJjZSBhbmQgZGVzdGluYXRpb24gZGlmZmVyLCBjb3B5IHRoZSB1bmNoYW5nZWQgcm93c1xyXG4gICAgb3V0WzBdID0gYVswXTtcclxuICAgIG91dFsxXSA9IGFbMV07XHJcbiAgICBvdXRbMl0gPSBhWzJdO1xyXG4gICAgb3V0WzNdID0gYVszXTtcclxuICAgIG91dFsxMl0gPSBhWzEyXTtcclxuICAgIG91dFsxM10gPSBhWzEzXTtcclxuICAgIG91dFsxNF0gPSBhWzE0XTtcclxuICAgIG91dFsxNV0gPSBhWzE1XTtcclxuICB9XHJcblxyXG4gIC8vIFBlcmZvcm0gYXhpcy1zcGVjaWZpYyBtYXRyaXggbXVsdGlwbGljYXRpb25cclxuICBvdXRbNF0gPSBhMTAgKiBjICsgYTIwICogcztcclxuICBvdXRbNV0gPSBhMTEgKiBjICsgYTIxICogcztcclxuICBvdXRbNl0gPSBhMTIgKiBjICsgYTIyICogcztcclxuICBvdXRbN10gPSBhMTMgKiBjICsgYTIzICogcztcclxuICBvdXRbOF0gPSBhMjAgKiBjIC0gYTEwICogcztcclxuICBvdXRbOV0gPSBhMjEgKiBjIC0gYTExICogcztcclxuICBvdXRbMTBdID0gYTIyICogYyAtIGExMiAqIHM7XHJcbiAgb3V0WzExXSA9IGEyMyAqIGMgLSBhMTMgKiBzO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSb3RhdGVzIGEgbWF0cml4IGJ5IHRoZSBnaXZlbiBhbmdsZSBhcm91bmQgdGhlIFkgYXhpc1xyXG4gKlxyXG4gKiBAcGFyYW0ge21hdDR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxyXG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIG1hdHJpeCB0byByb3RhdGVcclxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZCB0aGUgYW5nbGUgdG8gcm90YXRlIHRoZSBtYXRyaXggYnlcclxuICogQHJldHVybnMge21hdDR9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHJvdGF0ZVkob3V0LCBhLCByYWQpIHtcclxuICB2YXIgcyA9IE1hdGguc2luKHJhZCk7XHJcbiAgdmFyIGMgPSBNYXRoLmNvcyhyYWQpO1xyXG4gIHZhciBhMDAgPSBhWzBdO1xyXG4gIHZhciBhMDEgPSBhWzFdO1xyXG4gIHZhciBhMDIgPSBhWzJdO1xyXG4gIHZhciBhMDMgPSBhWzNdO1xyXG4gIHZhciBhMjAgPSBhWzhdO1xyXG4gIHZhciBhMjEgPSBhWzldO1xyXG4gIHZhciBhMjIgPSBhWzEwXTtcclxuICB2YXIgYTIzID0gYVsxMV07XHJcblxyXG4gIGlmIChhICE9PSBvdXQpIHtcclxuICAgIC8vIElmIHRoZSBzb3VyY2UgYW5kIGRlc3RpbmF0aW9uIGRpZmZlciwgY29weSB0aGUgdW5jaGFuZ2VkIHJvd3NcclxuICAgIG91dFs0XSA9IGFbNF07XHJcbiAgICBvdXRbNV0gPSBhWzVdO1xyXG4gICAgb3V0WzZdID0gYVs2XTtcclxuICAgIG91dFs3XSA9IGFbN107XHJcbiAgICBvdXRbMTJdID0gYVsxMl07XHJcbiAgICBvdXRbMTNdID0gYVsxM107XHJcbiAgICBvdXRbMTRdID0gYVsxNF07XHJcbiAgICBvdXRbMTVdID0gYVsxNV07XHJcbiAgfVxyXG5cclxuICAvLyBQZXJmb3JtIGF4aXMtc3BlY2lmaWMgbWF0cml4IG11bHRpcGxpY2F0aW9uXHJcbiAgb3V0WzBdID0gYTAwICogYyAtIGEyMCAqIHM7XHJcbiAgb3V0WzFdID0gYTAxICogYyAtIGEyMSAqIHM7XHJcbiAgb3V0WzJdID0gYTAyICogYyAtIGEyMiAqIHM7XHJcbiAgb3V0WzNdID0gYTAzICogYyAtIGEyMyAqIHM7XHJcbiAgb3V0WzhdID0gYTAwICogcyArIGEyMCAqIGM7XHJcbiAgb3V0WzldID0gYTAxICogcyArIGEyMSAqIGM7XHJcbiAgb3V0WzEwXSA9IGEwMiAqIHMgKyBhMjIgKiBjO1xyXG4gIG91dFsxMV0gPSBhMDMgKiBzICsgYTIzICogYztcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogUm90YXRlcyBhIG1hdHJpeCBieSB0aGUgZ2l2ZW4gYW5nbGUgYXJvdW5kIHRoZSBaIGF4aXNcclxuICpcclxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcclxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBtYXRyaXggdG8gcm90YXRlXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XHJcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiByb3RhdGVaKG91dCwgYSwgcmFkKSB7XHJcbiAgdmFyIHMgPSBNYXRoLnNpbihyYWQpO1xyXG4gIHZhciBjID0gTWF0aC5jb3MocmFkKTtcclxuICB2YXIgYTAwID0gYVswXTtcclxuICB2YXIgYTAxID0gYVsxXTtcclxuICB2YXIgYTAyID0gYVsyXTtcclxuICB2YXIgYTAzID0gYVszXTtcclxuICB2YXIgYTEwID0gYVs0XTtcclxuICB2YXIgYTExID0gYVs1XTtcclxuICB2YXIgYTEyID0gYVs2XTtcclxuICB2YXIgYTEzID0gYVs3XTtcclxuXHJcbiAgaWYgKGEgIT09IG91dCkge1xyXG4gICAgLy8gSWYgdGhlIHNvdXJjZSBhbmQgZGVzdGluYXRpb24gZGlmZmVyLCBjb3B5IHRoZSB1bmNoYW5nZWQgbGFzdCByb3dcclxuICAgIG91dFs4XSA9IGFbOF07XHJcbiAgICBvdXRbOV0gPSBhWzldO1xyXG4gICAgb3V0WzEwXSA9IGFbMTBdO1xyXG4gICAgb3V0WzExXSA9IGFbMTFdO1xyXG4gICAgb3V0WzEyXSA9IGFbMTJdO1xyXG4gICAgb3V0WzEzXSA9IGFbMTNdO1xyXG4gICAgb3V0WzE0XSA9IGFbMTRdO1xyXG4gICAgb3V0WzE1XSA9IGFbMTVdO1xyXG4gIH1cclxuXHJcbiAgLy8gUGVyZm9ybSBheGlzLXNwZWNpZmljIG1hdHJpeCBtdWx0aXBsaWNhdGlvblxyXG4gIG91dFswXSA9IGEwMCAqIGMgKyBhMTAgKiBzO1xyXG4gIG91dFsxXSA9IGEwMSAqIGMgKyBhMTEgKiBzO1xyXG4gIG91dFsyXSA9IGEwMiAqIGMgKyBhMTIgKiBzO1xyXG4gIG91dFszXSA9IGEwMyAqIGMgKyBhMTMgKiBzO1xyXG4gIG91dFs0XSA9IGExMCAqIGMgLSBhMDAgKiBzO1xyXG4gIG91dFs1XSA9IGExMSAqIGMgLSBhMDEgKiBzO1xyXG4gIG91dFs2XSA9IGExMiAqIGMgLSBhMDIgKiBzO1xyXG4gIG91dFs3XSA9IGExMyAqIGMgLSBhMDMgKiBzO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSB2ZWN0b3IgdHJhbnNsYXRpb25cclxuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIChidXQgbXVjaCBmYXN0ZXIgdGhhbik6XHJcbiAqXHJcbiAqICAgICBtYXQ0LmlkZW50aXR5KGRlc3QpO1xyXG4gKiAgICAgbWF0NC50cmFuc2xhdGUoZGVzdCwgZGVzdCwgdmVjKTtcclxuICpcclxuICogQHBhcmFtIHttYXQ0fSBvdXQgbWF0NCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxyXG4gKiBAcGFyYW0ge3ZlYzN9IHYgVHJhbnNsYXRpb24gdmVjdG9yXHJcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBmcm9tVHJhbnNsYXRpb24ob3V0LCB2KSB7XHJcbiAgb3V0WzBdID0gMTtcclxuICBvdXRbMV0gPSAwO1xyXG4gIG91dFsyXSA9IDA7XHJcbiAgb3V0WzNdID0gMDtcclxuICBvdXRbNF0gPSAwO1xyXG4gIG91dFs1XSA9IDE7XHJcbiAgb3V0WzZdID0gMDtcclxuICBvdXRbN10gPSAwO1xyXG4gIG91dFs4XSA9IDA7XHJcbiAgb3V0WzldID0gMDtcclxuICBvdXRbMTBdID0gMTtcclxuICBvdXRbMTFdID0gMDtcclxuICBvdXRbMTJdID0gdlswXTtcclxuICBvdXRbMTNdID0gdlsxXTtcclxuICBvdXRbMTRdID0gdlsyXTtcclxuICBvdXRbMTVdID0gMTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgdmVjdG9yIHNjYWxpbmdcclxuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIChidXQgbXVjaCBmYXN0ZXIgdGhhbik6XHJcbiAqXHJcbiAqICAgICBtYXQ0LmlkZW50aXR5KGRlc3QpO1xyXG4gKiAgICAgbWF0NC5zY2FsZShkZXN0LCBkZXN0LCB2ZWMpO1xyXG4gKlxyXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XHJcbiAqIEBwYXJhbSB7dmVjM30gdiBTY2FsaW5nIHZlY3RvclxyXG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZnJvbVNjYWxpbmcob3V0LCB2KSB7XHJcbiAgb3V0WzBdID0gdlswXTtcclxuICBvdXRbMV0gPSAwO1xyXG4gIG91dFsyXSA9IDA7XHJcbiAgb3V0WzNdID0gMDtcclxuICBvdXRbNF0gPSAwO1xyXG4gIG91dFs1XSA9IHZbMV07XHJcbiAgb3V0WzZdID0gMDtcclxuICBvdXRbN10gPSAwO1xyXG4gIG91dFs4XSA9IDA7XHJcbiAgb3V0WzldID0gMDtcclxuICBvdXRbMTBdID0gdlsyXTtcclxuICBvdXRbMTFdID0gMDtcclxuICBvdXRbMTJdID0gMDtcclxuICBvdXRbMTNdID0gMDtcclxuICBvdXRbMTRdID0gMDtcclxuICBvdXRbMTVdID0gMTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgZ2l2ZW4gYW5nbGUgYXJvdW5kIGEgZ2l2ZW4gYXhpc1xyXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gKGJ1dCBtdWNoIGZhc3RlciB0aGFuKTpcclxuICpcclxuICogICAgIG1hdDQuaWRlbnRpdHkoZGVzdCk7XHJcbiAqICAgICBtYXQ0LnJvdGF0ZShkZXN0LCBkZXN0LCByYWQsIGF4aXMpO1xyXG4gKlxyXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XHJcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XHJcbiAqIEBwYXJhbSB7dmVjM30gYXhpcyB0aGUgYXhpcyB0byByb3RhdGUgYXJvdW5kXHJcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBmcm9tUm90YXRpb24ob3V0LCByYWQsIGF4aXMpIHtcclxuICB2YXIgeCA9IGF4aXNbMF0sXHJcbiAgICAgIHkgPSBheGlzWzFdLFxyXG4gICAgICB6ID0gYXhpc1syXTtcclxuICB2YXIgbGVuID0gTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkgKyB6ICogeik7XHJcbiAgdmFyIHMgPSB2b2lkIDAsXHJcbiAgICAgIGMgPSB2b2lkIDAsXHJcbiAgICAgIHQgPSB2b2lkIDA7XHJcblxyXG4gIGlmIChsZW4gPCBnbE1hdHJpeC5FUFNJTE9OKSB7XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcblxyXG4gIGxlbiA9IDEgLyBsZW47XHJcbiAgeCAqPSBsZW47XHJcbiAgeSAqPSBsZW47XHJcbiAgeiAqPSBsZW47XHJcblxyXG4gIHMgPSBNYXRoLnNpbihyYWQpO1xyXG4gIGMgPSBNYXRoLmNvcyhyYWQpO1xyXG4gIHQgPSAxIC0gYztcclxuXHJcbiAgLy8gUGVyZm9ybSByb3RhdGlvbi1zcGVjaWZpYyBtYXRyaXggbXVsdGlwbGljYXRpb25cclxuICBvdXRbMF0gPSB4ICogeCAqIHQgKyBjO1xyXG4gIG91dFsxXSA9IHkgKiB4ICogdCArIHogKiBzO1xyXG4gIG91dFsyXSA9IHogKiB4ICogdCAtIHkgKiBzO1xyXG4gIG91dFszXSA9IDA7XHJcbiAgb3V0WzRdID0geCAqIHkgKiB0IC0geiAqIHM7XHJcbiAgb3V0WzVdID0geSAqIHkgKiB0ICsgYztcclxuICBvdXRbNl0gPSB6ICogeSAqIHQgKyB4ICogcztcclxuICBvdXRbN10gPSAwO1xyXG4gIG91dFs4XSA9IHggKiB6ICogdCArIHkgKiBzO1xyXG4gIG91dFs5XSA9IHkgKiB6ICogdCAtIHggKiBzO1xyXG4gIG91dFsxMF0gPSB6ICogeiAqIHQgKyBjO1xyXG4gIG91dFsxMV0gPSAwO1xyXG4gIG91dFsxMl0gPSAwO1xyXG4gIG91dFsxM10gPSAwO1xyXG4gIG91dFsxNF0gPSAwO1xyXG4gIG91dFsxNV0gPSAxO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gdGhlIGdpdmVuIGFuZ2xlIGFyb3VuZCB0aGUgWCBheGlzXHJcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byAoYnV0IG11Y2ggZmFzdGVyIHRoYW4pOlxyXG4gKlxyXG4gKiAgICAgbWF0NC5pZGVudGl0eShkZXN0KTtcclxuICogICAgIG1hdDQucm90YXRlWChkZXN0LCBkZXN0LCByYWQpO1xyXG4gKlxyXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XHJcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XHJcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBmcm9tWFJvdGF0aW9uKG91dCwgcmFkKSB7XHJcbiAgdmFyIHMgPSBNYXRoLnNpbihyYWQpO1xyXG4gIHZhciBjID0gTWF0aC5jb3MocmFkKTtcclxuXHJcbiAgLy8gUGVyZm9ybSBheGlzLXNwZWNpZmljIG1hdHJpeCBtdWx0aXBsaWNhdGlvblxyXG4gIG91dFswXSA9IDE7XHJcbiAgb3V0WzFdID0gMDtcclxuICBvdXRbMl0gPSAwO1xyXG4gIG91dFszXSA9IDA7XHJcbiAgb3V0WzRdID0gMDtcclxuICBvdXRbNV0gPSBjO1xyXG4gIG91dFs2XSA9IHM7XHJcbiAgb3V0WzddID0gMDtcclxuICBvdXRbOF0gPSAwO1xyXG4gIG91dFs5XSA9IC1zO1xyXG4gIG91dFsxMF0gPSBjO1xyXG4gIG91dFsxMV0gPSAwO1xyXG4gIG91dFsxMl0gPSAwO1xyXG4gIG91dFsxM10gPSAwO1xyXG4gIG91dFsxNF0gPSAwO1xyXG4gIG91dFsxNV0gPSAxO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gdGhlIGdpdmVuIGFuZ2xlIGFyb3VuZCB0aGUgWSBheGlzXHJcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byAoYnV0IG11Y2ggZmFzdGVyIHRoYW4pOlxyXG4gKlxyXG4gKiAgICAgbWF0NC5pZGVudGl0eShkZXN0KTtcclxuICogICAgIG1hdDQucm90YXRlWShkZXN0LCBkZXN0LCByYWQpO1xyXG4gKlxyXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XHJcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XHJcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBmcm9tWVJvdGF0aW9uKG91dCwgcmFkKSB7XHJcbiAgdmFyIHMgPSBNYXRoLnNpbihyYWQpO1xyXG4gIHZhciBjID0gTWF0aC5jb3MocmFkKTtcclxuXHJcbiAgLy8gUGVyZm9ybSBheGlzLXNwZWNpZmljIG1hdHJpeCBtdWx0aXBsaWNhdGlvblxyXG4gIG91dFswXSA9IGM7XHJcbiAgb3V0WzFdID0gMDtcclxuICBvdXRbMl0gPSAtcztcclxuICBvdXRbM10gPSAwO1xyXG4gIG91dFs0XSA9IDA7XHJcbiAgb3V0WzVdID0gMTtcclxuICBvdXRbNl0gPSAwO1xyXG4gIG91dFs3XSA9IDA7XHJcbiAgb3V0WzhdID0gcztcclxuICBvdXRbOV0gPSAwO1xyXG4gIG91dFsxMF0gPSBjO1xyXG4gIG91dFsxMV0gPSAwO1xyXG4gIG91dFsxMl0gPSAwO1xyXG4gIG91dFsxM10gPSAwO1xyXG4gIG91dFsxNF0gPSAwO1xyXG4gIG91dFsxNV0gPSAxO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gdGhlIGdpdmVuIGFuZ2xlIGFyb3VuZCB0aGUgWiBheGlzXHJcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byAoYnV0IG11Y2ggZmFzdGVyIHRoYW4pOlxyXG4gKlxyXG4gKiAgICAgbWF0NC5pZGVudGl0eShkZXN0KTtcclxuICogICAgIG1hdDQucm90YXRlWihkZXN0LCBkZXN0LCByYWQpO1xyXG4gKlxyXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XHJcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XHJcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBmcm9tWlJvdGF0aW9uKG91dCwgcmFkKSB7XHJcbiAgdmFyIHMgPSBNYXRoLnNpbihyYWQpO1xyXG4gIHZhciBjID0gTWF0aC5jb3MocmFkKTtcclxuXHJcbiAgLy8gUGVyZm9ybSBheGlzLXNwZWNpZmljIG1hdHJpeCBtdWx0aXBsaWNhdGlvblxyXG4gIG91dFswXSA9IGM7XHJcbiAgb3V0WzFdID0gcztcclxuICBvdXRbMl0gPSAwO1xyXG4gIG91dFszXSA9IDA7XHJcbiAgb3V0WzRdID0gLXM7XHJcbiAgb3V0WzVdID0gYztcclxuICBvdXRbNl0gPSAwO1xyXG4gIG91dFs3XSA9IDA7XHJcbiAgb3V0WzhdID0gMDtcclxuICBvdXRbOV0gPSAwO1xyXG4gIG91dFsxMF0gPSAxO1xyXG4gIG91dFsxMV0gPSAwO1xyXG4gIG91dFsxMl0gPSAwO1xyXG4gIG91dFsxM10gPSAwO1xyXG4gIG91dFsxNF0gPSAwO1xyXG4gIG91dFsxNV0gPSAxO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSBxdWF0ZXJuaW9uIHJvdGF0aW9uIGFuZCB2ZWN0b3IgdHJhbnNsYXRpb25cclxuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIChidXQgbXVjaCBmYXN0ZXIgdGhhbik6XHJcbiAqXHJcbiAqICAgICBtYXQ0LmlkZW50aXR5KGRlc3QpO1xyXG4gKiAgICAgbWF0NC50cmFuc2xhdGUoZGVzdCwgdmVjKTtcclxuICogICAgIGxldCBxdWF0TWF0ID0gbWF0NC5jcmVhdGUoKTtcclxuICogICAgIHF1YXQ0LnRvTWF0NChxdWF0LCBxdWF0TWF0KTtcclxuICogICAgIG1hdDQubXVsdGlwbHkoZGVzdCwgcXVhdE1hdCk7XHJcbiAqXHJcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IG1hdDQgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcclxuICogQHBhcmFtIHtxdWF0NH0gcSBSb3RhdGlvbiBxdWF0ZXJuaW9uXHJcbiAqIEBwYXJhbSB7dmVjM30gdiBUcmFuc2xhdGlvbiB2ZWN0b3JcclxuICogQHJldHVybnMge21hdDR9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGZyb21Sb3RhdGlvblRyYW5zbGF0aW9uKG91dCwgcSwgdikge1xyXG4gIC8vIFF1YXRlcm5pb24gbWF0aFxyXG4gIHZhciB4ID0gcVswXSxcclxuICAgICAgeSA9IHFbMV0sXHJcbiAgICAgIHogPSBxWzJdLFxyXG4gICAgICB3ID0gcVszXTtcclxuICB2YXIgeDIgPSB4ICsgeDtcclxuICB2YXIgeTIgPSB5ICsgeTtcclxuICB2YXIgejIgPSB6ICsgejtcclxuXHJcbiAgdmFyIHh4ID0geCAqIHgyO1xyXG4gIHZhciB4eSA9IHggKiB5MjtcclxuICB2YXIgeHogPSB4ICogejI7XHJcbiAgdmFyIHl5ID0geSAqIHkyO1xyXG4gIHZhciB5eiA9IHkgKiB6MjtcclxuICB2YXIgenogPSB6ICogejI7XHJcbiAgdmFyIHd4ID0gdyAqIHgyO1xyXG4gIHZhciB3eSA9IHcgKiB5MjtcclxuICB2YXIgd3ogPSB3ICogejI7XHJcblxyXG4gIG91dFswXSA9IDEgLSAoeXkgKyB6eik7XHJcbiAgb3V0WzFdID0geHkgKyB3ejtcclxuICBvdXRbMl0gPSB4eiAtIHd5O1xyXG4gIG91dFszXSA9IDA7XHJcbiAgb3V0WzRdID0geHkgLSB3ejtcclxuICBvdXRbNV0gPSAxIC0gKHh4ICsgenopO1xyXG4gIG91dFs2XSA9IHl6ICsgd3g7XHJcbiAgb3V0WzddID0gMDtcclxuICBvdXRbOF0gPSB4eiArIHd5O1xyXG4gIG91dFs5XSA9IHl6IC0gd3g7XHJcbiAgb3V0WzEwXSA9IDEgLSAoeHggKyB5eSk7XHJcbiAgb3V0WzExXSA9IDA7XHJcbiAgb3V0WzEyXSA9IHZbMF07XHJcbiAgb3V0WzEzXSA9IHZbMV07XHJcbiAgb3V0WzE0XSA9IHZbMl07XHJcbiAgb3V0WzE1XSA9IDE7XHJcblxyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgbmV3IG1hdDQgZnJvbSBhIGR1YWwgcXVhdC5cclxuICpcclxuICogQHBhcmFtIHttYXQ0fSBvdXQgTWF0cml4XHJcbiAqIEBwYXJhbSB7cXVhdDJ9IGEgRHVhbCBRdWF0ZXJuaW9uXHJcbiAqIEByZXR1cm5zIHttYXQ0fSBtYXQ0IHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZnJvbVF1YXQyKG91dCwgYSkge1xyXG4gIHZhciB0cmFuc2xhdGlvbiA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDMpO1xyXG4gIHZhciBieCA9IC1hWzBdLFxyXG4gICAgICBieSA9IC1hWzFdLFxyXG4gICAgICBieiA9IC1hWzJdLFxyXG4gICAgICBidyA9IGFbM10sXHJcbiAgICAgIGF4ID0gYVs0XSxcclxuICAgICAgYXkgPSBhWzVdLFxyXG4gICAgICBheiA9IGFbNl0sXHJcbiAgICAgIGF3ID0gYVs3XTtcclxuXHJcbiAgdmFyIG1hZ25pdHVkZSA9IGJ4ICogYnggKyBieSAqIGJ5ICsgYnogKiBieiArIGJ3ICogYnc7XHJcbiAgLy9Pbmx5IHNjYWxlIGlmIGl0IG1ha2VzIHNlbnNlXHJcbiAgaWYgKG1hZ25pdHVkZSA+IDApIHtcclxuICAgIHRyYW5zbGF0aW9uWzBdID0gKGF4ICogYncgKyBhdyAqIGJ4ICsgYXkgKiBieiAtIGF6ICogYnkpICogMiAvIG1hZ25pdHVkZTtcclxuICAgIHRyYW5zbGF0aW9uWzFdID0gKGF5ICogYncgKyBhdyAqIGJ5ICsgYXogKiBieCAtIGF4ICogYnopICogMiAvIG1hZ25pdHVkZTtcclxuICAgIHRyYW5zbGF0aW9uWzJdID0gKGF6ICogYncgKyBhdyAqIGJ6ICsgYXggKiBieSAtIGF5ICogYngpICogMiAvIG1hZ25pdHVkZTtcclxuICB9IGVsc2Uge1xyXG4gICAgdHJhbnNsYXRpb25bMF0gPSAoYXggKiBidyArIGF3ICogYnggKyBheSAqIGJ6IC0gYXogKiBieSkgKiAyO1xyXG4gICAgdHJhbnNsYXRpb25bMV0gPSAoYXkgKiBidyArIGF3ICogYnkgKyBheiAqIGJ4IC0gYXggKiBieikgKiAyO1xyXG4gICAgdHJhbnNsYXRpb25bMl0gPSAoYXogKiBidyArIGF3ICogYnogKyBheCAqIGJ5IC0gYXkgKiBieCkgKiAyO1xyXG4gIH1cclxuICBmcm9tUm90YXRpb25UcmFuc2xhdGlvbihvdXQsIGEsIHRyYW5zbGF0aW9uKTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogUmV0dXJucyB0aGUgdHJhbnNsYXRpb24gdmVjdG9yIGNvbXBvbmVudCBvZiBhIHRyYW5zZm9ybWF0aW9uXHJcbiAqICBtYXRyaXguIElmIGEgbWF0cml4IGlzIGJ1aWx0IHdpdGggZnJvbVJvdGF0aW9uVHJhbnNsYXRpb24sXHJcbiAqICB0aGUgcmV0dXJuZWQgdmVjdG9yIHdpbGwgYmUgdGhlIHNhbWUgYXMgdGhlIHRyYW5zbGF0aW9uIHZlY3RvclxyXG4gKiAgb3JpZ2luYWxseSBzdXBwbGllZC5cclxuICogQHBhcmFtICB7dmVjM30gb3V0IFZlY3RvciB0byByZWNlaXZlIHRyYW5zbGF0aW9uIGNvbXBvbmVudFxyXG4gKiBAcGFyYW0gIHttYXQ0fSBtYXQgTWF0cml4IHRvIGJlIGRlY29tcG9zZWQgKGlucHV0KVxyXG4gKiBAcmV0dXJuIHt2ZWMzfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRUcmFuc2xhdGlvbihvdXQsIG1hdCkge1xyXG4gIG91dFswXSA9IG1hdFsxMl07XHJcbiAgb3V0WzFdID0gbWF0WzEzXTtcclxuICBvdXRbMl0gPSBtYXRbMTRdO1xyXG5cclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogUmV0dXJucyB0aGUgc2NhbGluZyBmYWN0b3IgY29tcG9uZW50IG9mIGEgdHJhbnNmb3JtYXRpb25cclxuICogIG1hdHJpeC4gSWYgYSBtYXRyaXggaXMgYnVpbHQgd2l0aCBmcm9tUm90YXRpb25UcmFuc2xhdGlvblNjYWxlXHJcbiAqICB3aXRoIGEgbm9ybWFsaXplZCBRdWF0ZXJuaW9uIHBhcmFtdGVyLCB0aGUgcmV0dXJuZWQgdmVjdG9yIHdpbGwgYmVcclxuICogIHRoZSBzYW1lIGFzIHRoZSBzY2FsaW5nIHZlY3RvclxyXG4gKiAgb3JpZ2luYWxseSBzdXBwbGllZC5cclxuICogQHBhcmFtICB7dmVjM30gb3V0IFZlY3RvciB0byByZWNlaXZlIHNjYWxpbmcgZmFjdG9yIGNvbXBvbmVudFxyXG4gKiBAcGFyYW0gIHttYXQ0fSBtYXQgTWF0cml4IHRvIGJlIGRlY29tcG9zZWQgKGlucHV0KVxyXG4gKiBAcmV0dXJuIHt2ZWMzfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRTY2FsaW5nKG91dCwgbWF0KSB7XHJcbiAgdmFyIG0xMSA9IG1hdFswXTtcclxuICB2YXIgbTEyID0gbWF0WzFdO1xyXG4gIHZhciBtMTMgPSBtYXRbMl07XHJcbiAgdmFyIG0yMSA9IG1hdFs0XTtcclxuICB2YXIgbTIyID0gbWF0WzVdO1xyXG4gIHZhciBtMjMgPSBtYXRbNl07XHJcbiAgdmFyIG0zMSA9IG1hdFs4XTtcclxuICB2YXIgbTMyID0gbWF0WzldO1xyXG4gIHZhciBtMzMgPSBtYXRbMTBdO1xyXG5cclxuICBvdXRbMF0gPSBNYXRoLnNxcnQobTExICogbTExICsgbTEyICogbTEyICsgbTEzICogbTEzKTtcclxuICBvdXRbMV0gPSBNYXRoLnNxcnQobTIxICogbTIxICsgbTIyICogbTIyICsgbTIzICogbTIzKTtcclxuICBvdXRbMl0gPSBNYXRoLnNxcnQobTMxICogbTMxICsgbTMyICogbTMyICsgbTMzICogbTMzKTtcclxuXHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgYSBxdWF0ZXJuaW9uIHJlcHJlc2VudGluZyB0aGUgcm90YXRpb25hbCBjb21wb25lbnRcclxuICogIG9mIGEgdHJhbnNmb3JtYXRpb24gbWF0cml4LiBJZiBhIG1hdHJpeCBpcyBidWlsdCB3aXRoXHJcbiAqICBmcm9tUm90YXRpb25UcmFuc2xhdGlvbiwgdGhlIHJldHVybmVkIHF1YXRlcm5pb24gd2lsbCBiZSB0aGVcclxuICogIHNhbWUgYXMgdGhlIHF1YXRlcm5pb24gb3JpZ2luYWxseSBzdXBwbGllZC5cclxuICogQHBhcmFtIHtxdWF0fSBvdXQgUXVhdGVybmlvbiB0byByZWNlaXZlIHRoZSByb3RhdGlvbiBjb21wb25lbnRcclxuICogQHBhcmFtIHttYXQ0fSBtYXQgTWF0cml4IHRvIGJlIGRlY29tcG9zZWQgKGlucHV0KVxyXG4gKiBAcmV0dXJuIHtxdWF0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRSb3RhdGlvbihvdXQsIG1hdCkge1xyXG4gIC8vIEFsZ29yaXRobSB0YWtlbiBmcm9tIGh0dHA6Ly93d3cuZXVjbGlkZWFuc3BhY2UuY29tL21hdGhzL2dlb21ldHJ5L3JvdGF0aW9ucy9jb252ZXJzaW9ucy9tYXRyaXhUb1F1YXRlcm5pb24vaW5kZXguaHRtXHJcbiAgdmFyIHRyYWNlID0gbWF0WzBdICsgbWF0WzVdICsgbWF0WzEwXTtcclxuICB2YXIgUyA9IDA7XHJcblxyXG4gIGlmICh0cmFjZSA+IDApIHtcclxuICAgIFMgPSBNYXRoLnNxcnQodHJhY2UgKyAxLjApICogMjtcclxuICAgIG91dFszXSA9IDAuMjUgKiBTO1xyXG4gICAgb3V0WzBdID0gKG1hdFs2XSAtIG1hdFs5XSkgLyBTO1xyXG4gICAgb3V0WzFdID0gKG1hdFs4XSAtIG1hdFsyXSkgLyBTO1xyXG4gICAgb3V0WzJdID0gKG1hdFsxXSAtIG1hdFs0XSkgLyBTO1xyXG4gIH0gZWxzZSBpZiAobWF0WzBdID4gbWF0WzVdICYmIG1hdFswXSA+IG1hdFsxMF0pIHtcclxuICAgIFMgPSBNYXRoLnNxcnQoMS4wICsgbWF0WzBdIC0gbWF0WzVdIC0gbWF0WzEwXSkgKiAyO1xyXG4gICAgb3V0WzNdID0gKG1hdFs2XSAtIG1hdFs5XSkgLyBTO1xyXG4gICAgb3V0WzBdID0gMC4yNSAqIFM7XHJcbiAgICBvdXRbMV0gPSAobWF0WzFdICsgbWF0WzRdKSAvIFM7XHJcbiAgICBvdXRbMl0gPSAobWF0WzhdICsgbWF0WzJdKSAvIFM7XHJcbiAgfSBlbHNlIGlmIChtYXRbNV0gPiBtYXRbMTBdKSB7XHJcbiAgICBTID0gTWF0aC5zcXJ0KDEuMCArIG1hdFs1XSAtIG1hdFswXSAtIG1hdFsxMF0pICogMjtcclxuICAgIG91dFszXSA9IChtYXRbOF0gLSBtYXRbMl0pIC8gUztcclxuICAgIG91dFswXSA9IChtYXRbMV0gKyBtYXRbNF0pIC8gUztcclxuICAgIG91dFsxXSA9IDAuMjUgKiBTO1xyXG4gICAgb3V0WzJdID0gKG1hdFs2XSArIG1hdFs5XSkgLyBTO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBTID0gTWF0aC5zcXJ0KDEuMCArIG1hdFsxMF0gLSBtYXRbMF0gLSBtYXRbNV0pICogMjtcclxuICAgIG91dFszXSA9IChtYXRbMV0gLSBtYXRbNF0pIC8gUztcclxuICAgIG91dFswXSA9IChtYXRbOF0gKyBtYXRbMl0pIC8gUztcclxuICAgIG91dFsxXSA9IChtYXRbNl0gKyBtYXRbOV0pIC8gUztcclxuICAgIG91dFsyXSA9IDAuMjUgKiBTO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIHF1YXRlcm5pb24gcm90YXRpb24sIHZlY3RvciB0cmFuc2xhdGlvbiBhbmQgdmVjdG9yIHNjYWxlXHJcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byAoYnV0IG11Y2ggZmFzdGVyIHRoYW4pOlxyXG4gKlxyXG4gKiAgICAgbWF0NC5pZGVudGl0eShkZXN0KTtcclxuICogICAgIG1hdDQudHJhbnNsYXRlKGRlc3QsIHZlYyk7XHJcbiAqICAgICBsZXQgcXVhdE1hdCA9IG1hdDQuY3JlYXRlKCk7XHJcbiAqICAgICBxdWF0NC50b01hdDQocXVhdCwgcXVhdE1hdCk7XHJcbiAqICAgICBtYXQ0Lm11bHRpcGx5KGRlc3QsIHF1YXRNYXQpO1xyXG4gKiAgICAgbWF0NC5zY2FsZShkZXN0LCBzY2FsZSlcclxuICpcclxuICogQHBhcmFtIHttYXQ0fSBvdXQgbWF0NCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxyXG4gKiBAcGFyYW0ge3F1YXQ0fSBxIFJvdGF0aW9uIHF1YXRlcm5pb25cclxuICogQHBhcmFtIHt2ZWMzfSB2IFRyYW5zbGF0aW9uIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzN9IHMgU2NhbGluZyB2ZWN0b3JcclxuICogQHJldHVybnMge21hdDR9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGZyb21Sb3RhdGlvblRyYW5zbGF0aW9uU2NhbGUob3V0LCBxLCB2LCBzKSB7XHJcbiAgLy8gUXVhdGVybmlvbiBtYXRoXHJcbiAgdmFyIHggPSBxWzBdLFxyXG4gICAgICB5ID0gcVsxXSxcclxuICAgICAgeiA9IHFbMl0sXHJcbiAgICAgIHcgPSBxWzNdO1xyXG4gIHZhciB4MiA9IHggKyB4O1xyXG4gIHZhciB5MiA9IHkgKyB5O1xyXG4gIHZhciB6MiA9IHogKyB6O1xyXG5cclxuICB2YXIgeHggPSB4ICogeDI7XHJcbiAgdmFyIHh5ID0geCAqIHkyO1xyXG4gIHZhciB4eiA9IHggKiB6MjtcclxuICB2YXIgeXkgPSB5ICogeTI7XHJcbiAgdmFyIHl6ID0geSAqIHoyO1xyXG4gIHZhciB6eiA9IHogKiB6MjtcclxuICB2YXIgd3ggPSB3ICogeDI7XHJcbiAgdmFyIHd5ID0gdyAqIHkyO1xyXG4gIHZhciB3eiA9IHcgKiB6MjtcclxuICB2YXIgc3ggPSBzWzBdO1xyXG4gIHZhciBzeSA9IHNbMV07XHJcbiAgdmFyIHN6ID0gc1syXTtcclxuXHJcbiAgb3V0WzBdID0gKDEgLSAoeXkgKyB6eikpICogc3g7XHJcbiAgb3V0WzFdID0gKHh5ICsgd3opICogc3g7XHJcbiAgb3V0WzJdID0gKHh6IC0gd3kpICogc3g7XHJcbiAgb3V0WzNdID0gMDtcclxuICBvdXRbNF0gPSAoeHkgLSB3eikgKiBzeTtcclxuICBvdXRbNV0gPSAoMSAtICh4eCArIHp6KSkgKiBzeTtcclxuICBvdXRbNl0gPSAoeXogKyB3eCkgKiBzeTtcclxuICBvdXRbN10gPSAwO1xyXG4gIG91dFs4XSA9ICh4eiArIHd5KSAqIHN6O1xyXG4gIG91dFs5XSA9ICh5eiAtIHd4KSAqIHN6O1xyXG4gIG91dFsxMF0gPSAoMSAtICh4eCArIHl5KSkgKiBzejtcclxuICBvdXRbMTFdID0gMDtcclxuICBvdXRbMTJdID0gdlswXTtcclxuICBvdXRbMTNdID0gdlsxXTtcclxuICBvdXRbMTRdID0gdlsyXTtcclxuICBvdXRbMTVdID0gMTtcclxuXHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIHF1YXRlcm5pb24gcm90YXRpb24sIHZlY3RvciB0cmFuc2xhdGlvbiBhbmQgdmVjdG9yIHNjYWxlLCByb3RhdGluZyBhbmQgc2NhbGluZyBhcm91bmQgdGhlIGdpdmVuIG9yaWdpblxyXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gKGJ1dCBtdWNoIGZhc3RlciB0aGFuKTpcclxuICpcclxuICogICAgIG1hdDQuaWRlbnRpdHkoZGVzdCk7XHJcbiAqICAgICBtYXQ0LnRyYW5zbGF0ZShkZXN0LCB2ZWMpO1xyXG4gKiAgICAgbWF0NC50cmFuc2xhdGUoZGVzdCwgb3JpZ2luKTtcclxuICogICAgIGxldCBxdWF0TWF0ID0gbWF0NC5jcmVhdGUoKTtcclxuICogICAgIHF1YXQ0LnRvTWF0NChxdWF0LCBxdWF0TWF0KTtcclxuICogICAgIG1hdDQubXVsdGlwbHkoZGVzdCwgcXVhdE1hdCk7XHJcbiAqICAgICBtYXQ0LnNjYWxlKGRlc3QsIHNjYWxlKVxyXG4gKiAgICAgbWF0NC50cmFuc2xhdGUoZGVzdCwgbmVnYXRpdmVPcmlnaW4pO1xyXG4gKlxyXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XHJcbiAqIEBwYXJhbSB7cXVhdDR9IHEgUm90YXRpb24gcXVhdGVybmlvblxyXG4gKiBAcGFyYW0ge3ZlYzN9IHYgVHJhbnNsYXRpb24gdmVjdG9yXHJcbiAqIEBwYXJhbSB7dmVjM30gcyBTY2FsaW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzN9IG8gVGhlIG9yaWdpbiB2ZWN0b3IgYXJvdW5kIHdoaWNoIHRvIHNjYWxlIGFuZCByb3RhdGVcclxuICogQHJldHVybnMge21hdDR9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGZyb21Sb3RhdGlvblRyYW5zbGF0aW9uU2NhbGVPcmlnaW4ob3V0LCBxLCB2LCBzLCBvKSB7XHJcbiAgLy8gUXVhdGVybmlvbiBtYXRoXHJcbiAgdmFyIHggPSBxWzBdLFxyXG4gICAgICB5ID0gcVsxXSxcclxuICAgICAgeiA9IHFbMl0sXHJcbiAgICAgIHcgPSBxWzNdO1xyXG4gIHZhciB4MiA9IHggKyB4O1xyXG4gIHZhciB5MiA9IHkgKyB5O1xyXG4gIHZhciB6MiA9IHogKyB6O1xyXG5cclxuICB2YXIgeHggPSB4ICogeDI7XHJcbiAgdmFyIHh5ID0geCAqIHkyO1xyXG4gIHZhciB4eiA9IHggKiB6MjtcclxuICB2YXIgeXkgPSB5ICogeTI7XHJcbiAgdmFyIHl6ID0geSAqIHoyO1xyXG4gIHZhciB6eiA9IHogKiB6MjtcclxuICB2YXIgd3ggPSB3ICogeDI7XHJcbiAgdmFyIHd5ID0gdyAqIHkyO1xyXG4gIHZhciB3eiA9IHcgKiB6MjtcclxuXHJcbiAgdmFyIHN4ID0gc1swXTtcclxuICB2YXIgc3kgPSBzWzFdO1xyXG4gIHZhciBzeiA9IHNbMl07XHJcblxyXG4gIHZhciBveCA9IG9bMF07XHJcbiAgdmFyIG95ID0gb1sxXTtcclxuICB2YXIgb3ogPSBvWzJdO1xyXG5cclxuICB2YXIgb3V0MCA9ICgxIC0gKHl5ICsgenopKSAqIHN4O1xyXG4gIHZhciBvdXQxID0gKHh5ICsgd3opICogc3g7XHJcbiAgdmFyIG91dDIgPSAoeHogLSB3eSkgKiBzeDtcclxuICB2YXIgb3V0NCA9ICh4eSAtIHd6KSAqIHN5O1xyXG4gIHZhciBvdXQ1ID0gKDEgLSAoeHggKyB6eikpICogc3k7XHJcbiAgdmFyIG91dDYgPSAoeXogKyB3eCkgKiBzeTtcclxuICB2YXIgb3V0OCA9ICh4eiArIHd5KSAqIHN6O1xyXG4gIHZhciBvdXQ5ID0gKHl6IC0gd3gpICogc3o7XHJcbiAgdmFyIG91dDEwID0gKDEgLSAoeHggKyB5eSkpICogc3o7XHJcblxyXG4gIG91dFswXSA9IG91dDA7XHJcbiAgb3V0WzFdID0gb3V0MTtcclxuICBvdXRbMl0gPSBvdXQyO1xyXG4gIG91dFszXSA9IDA7XHJcbiAgb3V0WzRdID0gb3V0NDtcclxuICBvdXRbNV0gPSBvdXQ1O1xyXG4gIG91dFs2XSA9IG91dDY7XHJcbiAgb3V0WzddID0gMDtcclxuICBvdXRbOF0gPSBvdXQ4O1xyXG4gIG91dFs5XSA9IG91dDk7XHJcbiAgb3V0WzEwXSA9IG91dDEwO1xyXG4gIG91dFsxMV0gPSAwO1xyXG4gIG91dFsxMl0gPSB2WzBdICsgb3ggLSAob3V0MCAqIG94ICsgb3V0NCAqIG95ICsgb3V0OCAqIG96KTtcclxuICBvdXRbMTNdID0gdlsxXSArIG95IC0gKG91dDEgKiBveCArIG91dDUgKiBveSArIG91dDkgKiBveik7XHJcbiAgb3V0WzE0XSA9IHZbMl0gKyBveiAtIChvdXQyICogb3ggKyBvdXQ2ICogb3kgKyBvdXQxMCAqIG96KTtcclxuICBvdXRbMTVdID0gMTtcclxuXHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIENhbGN1bGF0ZXMgYSA0eDQgbWF0cml4IGZyb20gdGhlIGdpdmVuIHF1YXRlcm5pb25cclxuICpcclxuICogQHBhcmFtIHttYXQ0fSBvdXQgbWF0NCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxyXG4gKiBAcGFyYW0ge3F1YXR9IHEgUXVhdGVybmlvbiB0byBjcmVhdGUgbWF0cml4IGZyb21cclxuICpcclxuICogQHJldHVybnMge21hdDR9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGZyb21RdWF0KG91dCwgcSkge1xyXG4gIHZhciB4ID0gcVswXSxcclxuICAgICAgeSA9IHFbMV0sXHJcbiAgICAgIHogPSBxWzJdLFxyXG4gICAgICB3ID0gcVszXTtcclxuICB2YXIgeDIgPSB4ICsgeDtcclxuICB2YXIgeTIgPSB5ICsgeTtcclxuICB2YXIgejIgPSB6ICsgejtcclxuXHJcbiAgdmFyIHh4ID0geCAqIHgyO1xyXG4gIHZhciB5eCA9IHkgKiB4MjtcclxuICB2YXIgeXkgPSB5ICogeTI7XHJcbiAgdmFyIHp4ID0geiAqIHgyO1xyXG4gIHZhciB6eSA9IHogKiB5MjtcclxuICB2YXIgenogPSB6ICogejI7XHJcbiAgdmFyIHd4ID0gdyAqIHgyO1xyXG4gIHZhciB3eSA9IHcgKiB5MjtcclxuICB2YXIgd3ogPSB3ICogejI7XHJcblxyXG4gIG91dFswXSA9IDEgLSB5eSAtIHp6O1xyXG4gIG91dFsxXSA9IHl4ICsgd3o7XHJcbiAgb3V0WzJdID0genggLSB3eTtcclxuICBvdXRbM10gPSAwO1xyXG5cclxuICBvdXRbNF0gPSB5eCAtIHd6O1xyXG4gIG91dFs1XSA9IDEgLSB4eCAtIHp6O1xyXG4gIG91dFs2XSA9IHp5ICsgd3g7XHJcbiAgb3V0WzddID0gMDtcclxuXHJcbiAgb3V0WzhdID0genggKyB3eTtcclxuICBvdXRbOV0gPSB6eSAtIHd4O1xyXG4gIG91dFsxMF0gPSAxIC0geHggLSB5eTtcclxuICBvdXRbMTFdID0gMDtcclxuXHJcbiAgb3V0WzEyXSA9IDA7XHJcbiAgb3V0WzEzXSA9IDA7XHJcbiAgb3V0WzE0XSA9IDA7XHJcbiAgb3V0WzE1XSA9IDE7XHJcblxyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZW5lcmF0ZXMgYSBmcnVzdHVtIG1hdHJpeCB3aXRoIHRoZSBnaXZlbiBib3VuZHNcclxuICpcclxuICogQHBhcmFtIHttYXQ0fSBvdXQgbWF0NCBmcnVzdHVtIG1hdHJpeCB3aWxsIGJlIHdyaXR0ZW4gaW50b1xyXG4gKiBAcGFyYW0ge051bWJlcn0gbGVmdCBMZWZ0IGJvdW5kIG9mIHRoZSBmcnVzdHVtXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSByaWdodCBSaWdodCBib3VuZCBvZiB0aGUgZnJ1c3R1bVxyXG4gKiBAcGFyYW0ge051bWJlcn0gYm90dG9tIEJvdHRvbSBib3VuZCBvZiB0aGUgZnJ1c3R1bVxyXG4gKiBAcGFyYW0ge051bWJlcn0gdG9wIFRvcCBib3VuZCBvZiB0aGUgZnJ1c3R1bVxyXG4gKiBAcGFyYW0ge051bWJlcn0gbmVhciBOZWFyIGJvdW5kIG9mIHRoZSBmcnVzdHVtXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBmYXIgRmFyIGJvdW5kIG9mIHRoZSBmcnVzdHVtXHJcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBmcnVzdHVtKG91dCwgbGVmdCwgcmlnaHQsIGJvdHRvbSwgdG9wLCBuZWFyLCBmYXIpIHtcclxuICB2YXIgcmwgPSAxIC8gKHJpZ2h0IC0gbGVmdCk7XHJcbiAgdmFyIHRiID0gMSAvICh0b3AgLSBib3R0b20pO1xyXG4gIHZhciBuZiA9IDEgLyAobmVhciAtIGZhcik7XHJcbiAgb3V0WzBdID0gbmVhciAqIDIgKiBybDtcclxuICBvdXRbMV0gPSAwO1xyXG4gIG91dFsyXSA9IDA7XHJcbiAgb3V0WzNdID0gMDtcclxuICBvdXRbNF0gPSAwO1xyXG4gIG91dFs1XSA9IG5lYXIgKiAyICogdGI7XHJcbiAgb3V0WzZdID0gMDtcclxuICBvdXRbN10gPSAwO1xyXG4gIG91dFs4XSA9IChyaWdodCArIGxlZnQpICogcmw7XHJcbiAgb3V0WzldID0gKHRvcCArIGJvdHRvbSkgKiB0YjtcclxuICBvdXRbMTBdID0gKGZhciArIG5lYXIpICogbmY7XHJcbiAgb3V0WzExXSA9IC0xO1xyXG4gIG91dFsxMl0gPSAwO1xyXG4gIG91dFsxM10gPSAwO1xyXG4gIG91dFsxNF0gPSBmYXIgKiBuZWFyICogMiAqIG5mO1xyXG4gIG91dFsxNV0gPSAwO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZW5lcmF0ZXMgYSBwZXJzcGVjdGl2ZSBwcm9qZWN0aW9uIG1hdHJpeCB3aXRoIHRoZSBnaXZlbiBib3VuZHMuXHJcbiAqIFBhc3NpbmcgbnVsbC91bmRlZmluZWQvbm8gdmFsdWUgZm9yIGZhciB3aWxsIGdlbmVyYXRlIGluZmluaXRlIHByb2plY3Rpb24gbWF0cml4LlxyXG4gKlxyXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IGZydXN0dW0gbWF0cml4IHdpbGwgYmUgd3JpdHRlbiBpbnRvXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBmb3Z5IFZlcnRpY2FsIGZpZWxkIG9mIHZpZXcgaW4gcmFkaWFuc1xyXG4gKiBAcGFyYW0ge251bWJlcn0gYXNwZWN0IEFzcGVjdCByYXRpby4gdHlwaWNhbGx5IHZpZXdwb3J0IHdpZHRoL2hlaWdodFxyXG4gKiBAcGFyYW0ge251bWJlcn0gbmVhciBOZWFyIGJvdW5kIG9mIHRoZSBmcnVzdHVtXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBmYXIgRmFyIGJvdW5kIG9mIHRoZSBmcnVzdHVtLCBjYW4gYmUgbnVsbCBvciBJbmZpbml0eVxyXG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcGVyc3BlY3RpdmUob3V0LCBmb3Z5LCBhc3BlY3QsIG5lYXIsIGZhcikge1xyXG4gIHZhciBmID0gMS4wIC8gTWF0aC50YW4oZm92eSAvIDIpLFxyXG4gICAgICBuZiA9IHZvaWQgMDtcclxuICBvdXRbMF0gPSBmIC8gYXNwZWN0O1xyXG4gIG91dFsxXSA9IDA7XHJcbiAgb3V0WzJdID0gMDtcclxuICBvdXRbM10gPSAwO1xyXG4gIG91dFs0XSA9IDA7XHJcbiAgb3V0WzVdID0gZjtcclxuICBvdXRbNl0gPSAwO1xyXG4gIG91dFs3XSA9IDA7XHJcbiAgb3V0WzhdID0gMDtcclxuICBvdXRbOV0gPSAwO1xyXG4gIG91dFsxMV0gPSAtMTtcclxuICBvdXRbMTJdID0gMDtcclxuICBvdXRbMTNdID0gMDtcclxuICBvdXRbMTVdID0gMDtcclxuICBpZiAoZmFyICE9IG51bGwgJiYgZmFyICE9PSBJbmZpbml0eSkge1xyXG4gICAgbmYgPSAxIC8gKG5lYXIgLSBmYXIpO1xyXG4gICAgb3V0WzEwXSA9IChmYXIgKyBuZWFyKSAqIG5mO1xyXG4gICAgb3V0WzE0XSA9IDIgKiBmYXIgKiBuZWFyICogbmY7XHJcbiAgfSBlbHNlIHtcclxuICAgIG91dFsxMF0gPSAtMTtcclxuICAgIG91dFsxNF0gPSAtMiAqIG5lYXI7XHJcbiAgfVxyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZW5lcmF0ZXMgYSBwZXJzcGVjdGl2ZSBwcm9qZWN0aW9uIG1hdHJpeCB3aXRoIHRoZSBnaXZlbiBmaWVsZCBvZiB2aWV3LlxyXG4gKiBUaGlzIGlzIHByaW1hcmlseSB1c2VmdWwgZm9yIGdlbmVyYXRpbmcgcHJvamVjdGlvbiBtYXRyaWNlcyB0byBiZSB1c2VkXHJcbiAqIHdpdGggdGhlIHN0aWxsIGV4cGVyaWVtZW50YWwgV2ViVlIgQVBJLlxyXG4gKlxyXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IGZydXN0dW0gbWF0cml4IHdpbGwgYmUgd3JpdHRlbiBpbnRvXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBmb3YgT2JqZWN0IGNvbnRhaW5pbmcgdGhlIGZvbGxvd2luZyB2YWx1ZXM6IHVwRGVncmVlcywgZG93bkRlZ3JlZXMsIGxlZnREZWdyZWVzLCByaWdodERlZ3JlZXNcclxuICogQHBhcmFtIHtudW1iZXJ9IG5lYXIgTmVhciBib3VuZCBvZiB0aGUgZnJ1c3R1bVxyXG4gKiBAcGFyYW0ge251bWJlcn0gZmFyIEZhciBib3VuZCBvZiB0aGUgZnJ1c3R1bVxyXG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcGVyc3BlY3RpdmVGcm9tRmllbGRPZlZpZXcob3V0LCBmb3YsIG5lYXIsIGZhcikge1xyXG4gIHZhciB1cFRhbiA9IE1hdGgudGFuKGZvdi51cERlZ3JlZXMgKiBNYXRoLlBJIC8gMTgwLjApO1xyXG4gIHZhciBkb3duVGFuID0gTWF0aC50YW4oZm92LmRvd25EZWdyZWVzICogTWF0aC5QSSAvIDE4MC4wKTtcclxuICB2YXIgbGVmdFRhbiA9IE1hdGgudGFuKGZvdi5sZWZ0RGVncmVlcyAqIE1hdGguUEkgLyAxODAuMCk7XHJcbiAgdmFyIHJpZ2h0VGFuID0gTWF0aC50YW4oZm92LnJpZ2h0RGVncmVlcyAqIE1hdGguUEkgLyAxODAuMCk7XHJcbiAgdmFyIHhTY2FsZSA9IDIuMCAvIChsZWZ0VGFuICsgcmlnaHRUYW4pO1xyXG4gIHZhciB5U2NhbGUgPSAyLjAgLyAodXBUYW4gKyBkb3duVGFuKTtcclxuXHJcbiAgb3V0WzBdID0geFNjYWxlO1xyXG4gIG91dFsxXSA9IDAuMDtcclxuICBvdXRbMl0gPSAwLjA7XHJcbiAgb3V0WzNdID0gMC4wO1xyXG4gIG91dFs0XSA9IDAuMDtcclxuICBvdXRbNV0gPSB5U2NhbGU7XHJcbiAgb3V0WzZdID0gMC4wO1xyXG4gIG91dFs3XSA9IDAuMDtcclxuICBvdXRbOF0gPSAtKChsZWZ0VGFuIC0gcmlnaHRUYW4pICogeFNjYWxlICogMC41KTtcclxuICBvdXRbOV0gPSAodXBUYW4gLSBkb3duVGFuKSAqIHlTY2FsZSAqIDAuNTtcclxuICBvdXRbMTBdID0gZmFyIC8gKG5lYXIgLSBmYXIpO1xyXG4gIG91dFsxMV0gPSAtMS4wO1xyXG4gIG91dFsxMl0gPSAwLjA7XHJcbiAgb3V0WzEzXSA9IDAuMDtcclxuICBvdXRbMTRdID0gZmFyICogbmVhciAvIChuZWFyIC0gZmFyKTtcclxuICBvdXRbMTVdID0gMC4wO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZW5lcmF0ZXMgYSBvcnRob2dvbmFsIHByb2plY3Rpb24gbWF0cml4IHdpdGggdGhlIGdpdmVuIGJvdW5kc1xyXG4gKlxyXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IGZydXN0dW0gbWF0cml4IHdpbGwgYmUgd3JpdHRlbiBpbnRvXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBsZWZ0IExlZnQgYm91bmQgb2YgdGhlIGZydXN0dW1cclxuICogQHBhcmFtIHtudW1iZXJ9IHJpZ2h0IFJpZ2h0IGJvdW5kIG9mIHRoZSBmcnVzdHVtXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBib3R0b20gQm90dG9tIGJvdW5kIG9mIHRoZSBmcnVzdHVtXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB0b3AgVG9wIGJvdW5kIG9mIHRoZSBmcnVzdHVtXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBuZWFyIE5lYXIgYm91bmQgb2YgdGhlIGZydXN0dW1cclxuICogQHBhcmFtIHtudW1iZXJ9IGZhciBGYXIgYm91bmQgb2YgdGhlIGZydXN0dW1cclxuICogQHJldHVybnMge21hdDR9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIG9ydGhvKG91dCwgbGVmdCwgcmlnaHQsIGJvdHRvbSwgdG9wLCBuZWFyLCBmYXIpIHtcclxuICB2YXIgbHIgPSAxIC8gKGxlZnQgLSByaWdodCk7XHJcbiAgdmFyIGJ0ID0gMSAvIChib3R0b20gLSB0b3ApO1xyXG4gIHZhciBuZiA9IDEgLyAobmVhciAtIGZhcik7XHJcbiAgb3V0WzBdID0gLTIgKiBscjtcclxuICBvdXRbMV0gPSAwO1xyXG4gIG91dFsyXSA9IDA7XHJcbiAgb3V0WzNdID0gMDtcclxuICBvdXRbNF0gPSAwO1xyXG4gIG91dFs1XSA9IC0yICogYnQ7XHJcbiAgb3V0WzZdID0gMDtcclxuICBvdXRbN10gPSAwO1xyXG4gIG91dFs4XSA9IDA7XHJcbiAgb3V0WzldID0gMDtcclxuICBvdXRbMTBdID0gMiAqIG5mO1xyXG4gIG91dFsxMV0gPSAwO1xyXG4gIG91dFsxMl0gPSAobGVmdCArIHJpZ2h0KSAqIGxyO1xyXG4gIG91dFsxM10gPSAodG9wICsgYm90dG9tKSAqIGJ0O1xyXG4gIG91dFsxNF0gPSAoZmFyICsgbmVhcikgKiBuZjtcclxuICBvdXRbMTVdID0gMTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogR2VuZXJhdGVzIGEgbG9vay1hdCBtYXRyaXggd2l0aCB0aGUgZ2l2ZW4gZXllIHBvc2l0aW9uLCBmb2NhbCBwb2ludCwgYW5kIHVwIGF4aXMuXHJcbiAqIElmIHlvdSB3YW50IGEgbWF0cml4IHRoYXQgYWN0dWFsbHkgbWFrZXMgYW4gb2JqZWN0IGxvb2sgYXQgYW5vdGhlciBvYmplY3QsIHlvdSBzaG91bGQgdXNlIHRhcmdldFRvIGluc3RlYWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IG1hdDQgZnJ1c3R1bSBtYXRyaXggd2lsbCBiZSB3cml0dGVuIGludG9cclxuICogQHBhcmFtIHt2ZWMzfSBleWUgUG9zaXRpb24gb2YgdGhlIHZpZXdlclxyXG4gKiBAcGFyYW0ge3ZlYzN9IGNlbnRlciBQb2ludCB0aGUgdmlld2VyIGlzIGxvb2tpbmcgYXRcclxuICogQHBhcmFtIHt2ZWMzfSB1cCB2ZWMzIHBvaW50aW5nIHVwXHJcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBsb29rQXQob3V0LCBleWUsIGNlbnRlciwgdXApIHtcclxuICB2YXIgeDAgPSB2b2lkIDAsXHJcbiAgICAgIHgxID0gdm9pZCAwLFxyXG4gICAgICB4MiA9IHZvaWQgMCxcclxuICAgICAgeTAgPSB2b2lkIDAsXHJcbiAgICAgIHkxID0gdm9pZCAwLFxyXG4gICAgICB5MiA9IHZvaWQgMCxcclxuICAgICAgejAgPSB2b2lkIDAsXHJcbiAgICAgIHoxID0gdm9pZCAwLFxyXG4gICAgICB6MiA9IHZvaWQgMCxcclxuICAgICAgbGVuID0gdm9pZCAwO1xyXG4gIHZhciBleWV4ID0gZXllWzBdO1xyXG4gIHZhciBleWV5ID0gZXllWzFdO1xyXG4gIHZhciBleWV6ID0gZXllWzJdO1xyXG4gIHZhciB1cHggPSB1cFswXTtcclxuICB2YXIgdXB5ID0gdXBbMV07XHJcbiAgdmFyIHVweiA9IHVwWzJdO1xyXG4gIHZhciBjZW50ZXJ4ID0gY2VudGVyWzBdO1xyXG4gIHZhciBjZW50ZXJ5ID0gY2VudGVyWzFdO1xyXG4gIHZhciBjZW50ZXJ6ID0gY2VudGVyWzJdO1xyXG5cclxuICBpZiAoTWF0aC5hYnMoZXlleCAtIGNlbnRlcngpIDwgZ2xNYXRyaXguRVBTSUxPTiAmJiBNYXRoLmFicyhleWV5IC0gY2VudGVyeSkgPCBnbE1hdHJpeC5FUFNJTE9OICYmIE1hdGguYWJzKGV5ZXogLSBjZW50ZXJ6KSA8IGdsTWF0cml4LkVQU0lMT04pIHtcclxuICAgIHJldHVybiBpZGVudGl0eShvdXQpO1xyXG4gIH1cclxuXHJcbiAgejAgPSBleWV4IC0gY2VudGVyeDtcclxuICB6MSA9IGV5ZXkgLSBjZW50ZXJ5O1xyXG4gIHoyID0gZXlleiAtIGNlbnRlcno7XHJcblxyXG4gIGxlbiA9IDEgLyBNYXRoLnNxcnQoejAgKiB6MCArIHoxICogejEgKyB6MiAqIHoyKTtcclxuICB6MCAqPSBsZW47XHJcbiAgejEgKj0gbGVuO1xyXG4gIHoyICo9IGxlbjtcclxuXHJcbiAgeDAgPSB1cHkgKiB6MiAtIHVweiAqIHoxO1xyXG4gIHgxID0gdXB6ICogejAgLSB1cHggKiB6MjtcclxuICB4MiA9IHVweCAqIHoxIC0gdXB5ICogejA7XHJcbiAgbGVuID0gTWF0aC5zcXJ0KHgwICogeDAgKyB4MSAqIHgxICsgeDIgKiB4Mik7XHJcbiAgaWYgKCFsZW4pIHtcclxuICAgIHgwID0gMDtcclxuICAgIHgxID0gMDtcclxuICAgIHgyID0gMDtcclxuICB9IGVsc2Uge1xyXG4gICAgbGVuID0gMSAvIGxlbjtcclxuICAgIHgwICo9IGxlbjtcclxuICAgIHgxICo9IGxlbjtcclxuICAgIHgyICo9IGxlbjtcclxuICB9XHJcblxyXG4gIHkwID0gejEgKiB4MiAtIHoyICogeDE7XHJcbiAgeTEgPSB6MiAqIHgwIC0gejAgKiB4MjtcclxuICB5MiA9IHowICogeDEgLSB6MSAqIHgwO1xyXG5cclxuICBsZW4gPSBNYXRoLnNxcnQoeTAgKiB5MCArIHkxICogeTEgKyB5MiAqIHkyKTtcclxuICBpZiAoIWxlbikge1xyXG4gICAgeTAgPSAwO1xyXG4gICAgeTEgPSAwO1xyXG4gICAgeTIgPSAwO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBsZW4gPSAxIC8gbGVuO1xyXG4gICAgeTAgKj0gbGVuO1xyXG4gICAgeTEgKj0gbGVuO1xyXG4gICAgeTIgKj0gbGVuO1xyXG4gIH1cclxuXHJcbiAgb3V0WzBdID0geDA7XHJcbiAgb3V0WzFdID0geTA7XHJcbiAgb3V0WzJdID0gejA7XHJcbiAgb3V0WzNdID0gMDtcclxuICBvdXRbNF0gPSB4MTtcclxuICBvdXRbNV0gPSB5MTtcclxuICBvdXRbNl0gPSB6MTtcclxuICBvdXRbN10gPSAwO1xyXG4gIG91dFs4XSA9IHgyO1xyXG4gIG91dFs5XSA9IHkyO1xyXG4gIG91dFsxMF0gPSB6MjtcclxuICBvdXRbMTFdID0gMDtcclxuICBvdXRbMTJdID0gLSh4MCAqIGV5ZXggKyB4MSAqIGV5ZXkgKyB4MiAqIGV5ZXopO1xyXG4gIG91dFsxM10gPSAtKHkwICogZXlleCArIHkxICogZXlleSArIHkyICogZXlleik7XHJcbiAgb3V0WzE0XSA9IC0oejAgKiBleWV4ICsgejEgKiBleWV5ICsgejIgKiBleWV6KTtcclxuICBvdXRbMTVdID0gMTtcclxuXHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEdlbmVyYXRlcyBhIG1hdHJpeCB0aGF0IG1ha2VzIHNvbWV0aGluZyBsb29rIGF0IHNvbWV0aGluZyBlbHNlLlxyXG4gKlxyXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IGZydXN0dW0gbWF0cml4IHdpbGwgYmUgd3JpdHRlbiBpbnRvXHJcbiAqIEBwYXJhbSB7dmVjM30gZXllIFBvc2l0aW9uIG9mIHRoZSB2aWV3ZXJcclxuICogQHBhcmFtIHt2ZWMzfSBjZW50ZXIgUG9pbnQgdGhlIHZpZXdlciBpcyBsb29raW5nIGF0XHJcbiAqIEBwYXJhbSB7dmVjM30gdXAgdmVjMyBwb2ludGluZyB1cFxyXG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdGFyZ2V0VG8ob3V0LCBleWUsIHRhcmdldCwgdXApIHtcclxuICB2YXIgZXlleCA9IGV5ZVswXSxcclxuICAgICAgZXlleSA9IGV5ZVsxXSxcclxuICAgICAgZXlleiA9IGV5ZVsyXSxcclxuICAgICAgdXB4ID0gdXBbMF0sXHJcbiAgICAgIHVweSA9IHVwWzFdLFxyXG4gICAgICB1cHogPSB1cFsyXTtcclxuXHJcbiAgdmFyIHowID0gZXlleCAtIHRhcmdldFswXSxcclxuICAgICAgejEgPSBleWV5IC0gdGFyZ2V0WzFdLFxyXG4gICAgICB6MiA9IGV5ZXogLSB0YXJnZXRbMl07XHJcblxyXG4gIHZhciBsZW4gPSB6MCAqIHowICsgejEgKiB6MSArIHoyICogejI7XHJcbiAgaWYgKGxlbiA+IDApIHtcclxuICAgIGxlbiA9IDEgLyBNYXRoLnNxcnQobGVuKTtcclxuICAgIHowICo9IGxlbjtcclxuICAgIHoxICo9IGxlbjtcclxuICAgIHoyICo9IGxlbjtcclxuICB9XHJcblxyXG4gIHZhciB4MCA9IHVweSAqIHoyIC0gdXB6ICogejEsXHJcbiAgICAgIHgxID0gdXB6ICogejAgLSB1cHggKiB6MixcclxuICAgICAgeDIgPSB1cHggKiB6MSAtIHVweSAqIHowO1xyXG5cclxuICBsZW4gPSB4MCAqIHgwICsgeDEgKiB4MSArIHgyICogeDI7XHJcbiAgaWYgKGxlbiA+IDApIHtcclxuICAgIGxlbiA9IDEgLyBNYXRoLnNxcnQobGVuKTtcclxuICAgIHgwICo9IGxlbjtcclxuICAgIHgxICo9IGxlbjtcclxuICAgIHgyICo9IGxlbjtcclxuICB9XHJcblxyXG4gIG91dFswXSA9IHgwO1xyXG4gIG91dFsxXSA9IHgxO1xyXG4gIG91dFsyXSA9IHgyO1xyXG4gIG91dFszXSA9IDA7XHJcbiAgb3V0WzRdID0gejEgKiB4MiAtIHoyICogeDE7XHJcbiAgb3V0WzVdID0gejIgKiB4MCAtIHowICogeDI7XHJcbiAgb3V0WzZdID0gejAgKiB4MSAtIHoxICogeDA7XHJcbiAgb3V0WzddID0gMDtcclxuICBvdXRbOF0gPSB6MDtcclxuICBvdXRbOV0gPSB6MTtcclxuICBvdXRbMTBdID0gejI7XHJcbiAgb3V0WzExXSA9IDA7XHJcbiAgb3V0WzEyXSA9IGV5ZXg7XHJcbiAgb3V0WzEzXSA9IGV5ZXk7XHJcbiAgb3V0WzE0XSA9IGV5ZXo7XHJcbiAgb3V0WzE1XSA9IDE7XHJcbiAgcmV0dXJuIG91dDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGEgbWF0NFxyXG4gKlxyXG4gKiBAcGFyYW0ge21hdDR9IGEgbWF0cml4IHRvIHJlcHJlc2VudCBhcyBhIHN0cmluZ1xyXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG1hdHJpeFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHN0cihhKSB7XHJcbiAgcmV0dXJuICdtYXQ0KCcgKyBhWzBdICsgJywgJyArIGFbMV0gKyAnLCAnICsgYVsyXSArICcsICcgKyBhWzNdICsgJywgJyArIGFbNF0gKyAnLCAnICsgYVs1XSArICcsICcgKyBhWzZdICsgJywgJyArIGFbN10gKyAnLCAnICsgYVs4XSArICcsICcgKyBhWzldICsgJywgJyArIGFbMTBdICsgJywgJyArIGFbMTFdICsgJywgJyArIGFbMTJdICsgJywgJyArIGFbMTNdICsgJywgJyArIGFbMTRdICsgJywgJyArIGFbMTVdICsgJyknO1xyXG59XHJcblxyXG4vKipcclxuICogUmV0dXJucyBGcm9iZW5pdXMgbm9ybSBvZiBhIG1hdDRcclxuICpcclxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBtYXRyaXggdG8gY2FsY3VsYXRlIEZyb2Jlbml1cyBub3JtIG9mXHJcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IEZyb2Jlbml1cyBub3JtXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZnJvYihhKSB7XHJcbiAgcmV0dXJuIE1hdGguc3FydChNYXRoLnBvdyhhWzBdLCAyKSArIE1hdGgucG93KGFbMV0sIDIpICsgTWF0aC5wb3coYVsyXSwgMikgKyBNYXRoLnBvdyhhWzNdLCAyKSArIE1hdGgucG93KGFbNF0sIDIpICsgTWF0aC5wb3coYVs1XSwgMikgKyBNYXRoLnBvdyhhWzZdLCAyKSArIE1hdGgucG93KGFbN10sIDIpICsgTWF0aC5wb3coYVs4XSwgMikgKyBNYXRoLnBvdyhhWzldLCAyKSArIE1hdGgucG93KGFbMTBdLCAyKSArIE1hdGgucG93KGFbMTFdLCAyKSArIE1hdGgucG93KGFbMTJdLCAyKSArIE1hdGgucG93KGFbMTNdLCAyKSArIE1hdGgucG93KGFbMTRdLCAyKSArIE1hdGgucG93KGFbMTVdLCAyKSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBZGRzIHR3byBtYXQ0J3NcclxuICpcclxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcclxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXHJcbiAqIEBwYXJhbSB7bWF0NH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcclxuICogQHJldHVybnMge21hdDR9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGFkZChvdXQsIGEsIGIpIHtcclxuICBvdXRbMF0gPSBhWzBdICsgYlswXTtcclxuICBvdXRbMV0gPSBhWzFdICsgYlsxXTtcclxuICBvdXRbMl0gPSBhWzJdICsgYlsyXTtcclxuICBvdXRbM10gPSBhWzNdICsgYlszXTtcclxuICBvdXRbNF0gPSBhWzRdICsgYls0XTtcclxuICBvdXRbNV0gPSBhWzVdICsgYls1XTtcclxuICBvdXRbNl0gPSBhWzZdICsgYls2XTtcclxuICBvdXRbN10gPSBhWzddICsgYls3XTtcclxuICBvdXRbOF0gPSBhWzhdICsgYls4XTtcclxuICBvdXRbOV0gPSBhWzldICsgYls5XTtcclxuICBvdXRbMTBdID0gYVsxMF0gKyBiWzEwXTtcclxuICBvdXRbMTFdID0gYVsxMV0gKyBiWzExXTtcclxuICBvdXRbMTJdID0gYVsxMl0gKyBiWzEyXTtcclxuICBvdXRbMTNdID0gYVsxM10gKyBiWzEzXTtcclxuICBvdXRbMTRdID0gYVsxNF0gKyBiWzE0XTtcclxuICBvdXRbMTVdID0gYVsxNV0gKyBiWzE1XTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogU3VidHJhY3RzIG1hdHJpeCBiIGZyb20gbWF0cml4IGFcclxuICpcclxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcclxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXHJcbiAqIEBwYXJhbSB7bWF0NH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcclxuICogQHJldHVybnMge21hdDR9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHN1YnRyYWN0KG91dCwgYSwgYikge1xyXG4gIG91dFswXSA9IGFbMF0gLSBiWzBdO1xyXG4gIG91dFsxXSA9IGFbMV0gLSBiWzFdO1xyXG4gIG91dFsyXSA9IGFbMl0gLSBiWzJdO1xyXG4gIG91dFszXSA9IGFbM10gLSBiWzNdO1xyXG4gIG91dFs0XSA9IGFbNF0gLSBiWzRdO1xyXG4gIG91dFs1XSA9IGFbNV0gLSBiWzVdO1xyXG4gIG91dFs2XSA9IGFbNl0gLSBiWzZdO1xyXG4gIG91dFs3XSA9IGFbN10gLSBiWzddO1xyXG4gIG91dFs4XSA9IGFbOF0gLSBiWzhdO1xyXG4gIG91dFs5XSA9IGFbOV0gLSBiWzldO1xyXG4gIG91dFsxMF0gPSBhWzEwXSAtIGJbMTBdO1xyXG4gIG91dFsxMV0gPSBhWzExXSAtIGJbMTFdO1xyXG4gIG91dFsxMl0gPSBhWzEyXSAtIGJbMTJdO1xyXG4gIG91dFsxM10gPSBhWzEzXSAtIGJbMTNdO1xyXG4gIG91dFsxNF0gPSBhWzE0XSAtIGJbMTRdO1xyXG4gIG91dFsxNV0gPSBhWzE1XSAtIGJbMTVdO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBNdWx0aXBseSBlYWNoIGVsZW1lbnQgb2YgdGhlIG1hdHJpeCBieSBhIHNjYWxhci5cclxuICpcclxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcclxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBtYXRyaXggdG8gc2NhbGVcclxuICogQHBhcmFtIHtOdW1iZXJ9IGIgYW1vdW50IHRvIHNjYWxlIHRoZSBtYXRyaXgncyBlbGVtZW50cyBieVxyXG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gbXVsdGlwbHlTY2FsYXIob3V0LCBhLCBiKSB7XHJcbiAgb3V0WzBdID0gYVswXSAqIGI7XHJcbiAgb3V0WzFdID0gYVsxXSAqIGI7XHJcbiAgb3V0WzJdID0gYVsyXSAqIGI7XHJcbiAgb3V0WzNdID0gYVszXSAqIGI7XHJcbiAgb3V0WzRdID0gYVs0XSAqIGI7XHJcbiAgb3V0WzVdID0gYVs1XSAqIGI7XHJcbiAgb3V0WzZdID0gYVs2XSAqIGI7XHJcbiAgb3V0WzddID0gYVs3XSAqIGI7XHJcbiAgb3V0WzhdID0gYVs4XSAqIGI7XHJcbiAgb3V0WzldID0gYVs5XSAqIGI7XHJcbiAgb3V0WzEwXSA9IGFbMTBdICogYjtcclxuICBvdXRbMTFdID0gYVsxMV0gKiBiO1xyXG4gIG91dFsxMl0gPSBhWzEyXSAqIGI7XHJcbiAgb3V0WzEzXSA9IGFbMTNdICogYjtcclxuICBvdXRbMTRdID0gYVsxNF0gKiBiO1xyXG4gIG91dFsxNV0gPSBhWzE1XSAqIGI7XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEFkZHMgdHdvIG1hdDQncyBhZnRlciBtdWx0aXBseWluZyBlYWNoIGVsZW1lbnQgb2YgdGhlIHNlY29uZCBvcGVyYW5kIGJ5IGEgc2NhbGFyIHZhbHVlLlxyXG4gKlxyXG4gKiBAcGFyYW0ge21hdDR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcclxuICogQHBhcmFtIHttYXQ0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxyXG4gKiBAcGFyYW0ge051bWJlcn0gc2NhbGUgdGhlIGFtb3VudCB0byBzY2FsZSBiJ3MgZWxlbWVudHMgYnkgYmVmb3JlIGFkZGluZ1xyXG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gbXVsdGlwbHlTY2FsYXJBbmRBZGQob3V0LCBhLCBiLCBzY2FsZSkge1xyXG4gIG91dFswXSA9IGFbMF0gKyBiWzBdICogc2NhbGU7XHJcbiAgb3V0WzFdID0gYVsxXSArIGJbMV0gKiBzY2FsZTtcclxuICBvdXRbMl0gPSBhWzJdICsgYlsyXSAqIHNjYWxlO1xyXG4gIG91dFszXSA9IGFbM10gKyBiWzNdICogc2NhbGU7XHJcbiAgb3V0WzRdID0gYVs0XSArIGJbNF0gKiBzY2FsZTtcclxuICBvdXRbNV0gPSBhWzVdICsgYls1XSAqIHNjYWxlO1xyXG4gIG91dFs2XSA9IGFbNl0gKyBiWzZdICogc2NhbGU7XHJcbiAgb3V0WzddID0gYVs3XSArIGJbN10gKiBzY2FsZTtcclxuICBvdXRbOF0gPSBhWzhdICsgYls4XSAqIHNjYWxlO1xyXG4gIG91dFs5XSA9IGFbOV0gKyBiWzldICogc2NhbGU7XHJcbiAgb3V0WzEwXSA9IGFbMTBdICsgYlsxMF0gKiBzY2FsZTtcclxuICBvdXRbMTFdID0gYVsxMV0gKyBiWzExXSAqIHNjYWxlO1xyXG4gIG91dFsxMl0gPSBhWzEyXSArIGJbMTJdICogc2NhbGU7XHJcbiAgb3V0WzEzXSA9IGFbMTNdICsgYlsxM10gKiBzY2FsZTtcclxuICBvdXRbMTRdID0gYVsxNF0gKyBiWzE0XSAqIHNjYWxlO1xyXG4gIG91dFsxNV0gPSBhWzE1XSArIGJbMTVdICogc2NhbGU7XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgd2hldGhlciBvciBub3QgdGhlIG1hdHJpY2VzIGhhdmUgZXhhY3RseSB0aGUgc2FtZSBlbGVtZW50cyBpbiB0aGUgc2FtZSBwb3NpdGlvbiAod2hlbiBjb21wYXJlZCB3aXRoID09PSlcclxuICpcclxuICogQHBhcmFtIHttYXQ0fSBhIFRoZSBmaXJzdCBtYXRyaXguXHJcbiAqIEBwYXJhbSB7bWF0NH0gYiBUaGUgc2Vjb25kIG1hdHJpeC5cclxuICogQHJldHVybnMge0Jvb2xlYW59IFRydWUgaWYgdGhlIG1hdHJpY2VzIGFyZSBlcXVhbCwgZmFsc2Ugb3RoZXJ3aXNlLlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGV4YWN0RXF1YWxzKGEsIGIpIHtcclxuICByZXR1cm4gYVswXSA9PT0gYlswXSAmJiBhWzFdID09PSBiWzFdICYmIGFbMl0gPT09IGJbMl0gJiYgYVszXSA9PT0gYlszXSAmJiBhWzRdID09PSBiWzRdICYmIGFbNV0gPT09IGJbNV0gJiYgYVs2XSA9PT0gYls2XSAmJiBhWzddID09PSBiWzddICYmIGFbOF0gPT09IGJbOF0gJiYgYVs5XSA9PT0gYls5XSAmJiBhWzEwXSA9PT0gYlsxMF0gJiYgYVsxMV0gPT09IGJbMTFdICYmIGFbMTJdID09PSBiWzEyXSAmJiBhWzEzXSA9PT0gYlsxM10gJiYgYVsxNF0gPT09IGJbMTRdICYmIGFbMTVdID09PSBiWzE1XTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgd2hldGhlciBvciBub3QgdGhlIG1hdHJpY2VzIGhhdmUgYXBwcm94aW1hdGVseSB0aGUgc2FtZSBlbGVtZW50cyBpbiB0aGUgc2FtZSBwb3NpdGlvbi5cclxuICpcclxuICogQHBhcmFtIHttYXQ0fSBhIFRoZSBmaXJzdCBtYXRyaXguXHJcbiAqIEBwYXJhbSB7bWF0NH0gYiBUaGUgc2Vjb25kIG1hdHJpeC5cclxuICogQHJldHVybnMge0Jvb2xlYW59IFRydWUgaWYgdGhlIG1hdHJpY2VzIGFyZSBlcXVhbCwgZmFsc2Ugb3RoZXJ3aXNlLlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGVxdWFscyhhLCBiKSB7XHJcbiAgdmFyIGEwID0gYVswXSxcclxuICAgICAgYTEgPSBhWzFdLFxyXG4gICAgICBhMiA9IGFbMl0sXHJcbiAgICAgIGEzID0gYVszXTtcclxuICB2YXIgYTQgPSBhWzRdLFxyXG4gICAgICBhNSA9IGFbNV0sXHJcbiAgICAgIGE2ID0gYVs2XSxcclxuICAgICAgYTcgPSBhWzddO1xyXG4gIHZhciBhOCA9IGFbOF0sXHJcbiAgICAgIGE5ID0gYVs5XSxcclxuICAgICAgYTEwID0gYVsxMF0sXHJcbiAgICAgIGExMSA9IGFbMTFdO1xyXG4gIHZhciBhMTIgPSBhWzEyXSxcclxuICAgICAgYTEzID0gYVsxM10sXHJcbiAgICAgIGExNCA9IGFbMTRdLFxyXG4gICAgICBhMTUgPSBhWzE1XTtcclxuXHJcbiAgdmFyIGIwID0gYlswXSxcclxuICAgICAgYjEgPSBiWzFdLFxyXG4gICAgICBiMiA9IGJbMl0sXHJcbiAgICAgIGIzID0gYlszXTtcclxuICB2YXIgYjQgPSBiWzRdLFxyXG4gICAgICBiNSA9IGJbNV0sXHJcbiAgICAgIGI2ID0gYls2XSxcclxuICAgICAgYjcgPSBiWzddO1xyXG4gIHZhciBiOCA9IGJbOF0sXHJcbiAgICAgIGI5ID0gYls5XSxcclxuICAgICAgYjEwID0gYlsxMF0sXHJcbiAgICAgIGIxMSA9IGJbMTFdO1xyXG4gIHZhciBiMTIgPSBiWzEyXSxcclxuICAgICAgYjEzID0gYlsxM10sXHJcbiAgICAgIGIxNCA9IGJbMTRdLFxyXG4gICAgICBiMTUgPSBiWzE1XTtcclxuXHJcbiAgcmV0dXJuIE1hdGguYWJzKGEwIC0gYjApIDw9IGdsTWF0cml4LkVQU0lMT04gKiBNYXRoLm1heCgxLjAsIE1hdGguYWJzKGEwKSwgTWF0aC5hYnMoYjApKSAmJiBNYXRoLmFicyhhMSAtIGIxKSA8PSBnbE1hdHJpeC5FUFNJTE9OICogTWF0aC5tYXgoMS4wLCBNYXRoLmFicyhhMSksIE1hdGguYWJzKGIxKSkgJiYgTWF0aC5hYnMoYTIgLSBiMikgPD0gZ2xNYXRyaXguRVBTSUxPTiAqIE1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTIpLCBNYXRoLmFicyhiMikpICYmIE1hdGguYWJzKGEzIC0gYjMpIDw9IGdsTWF0cml4LkVQU0lMT04gKiBNYXRoLm1heCgxLjAsIE1hdGguYWJzKGEzKSwgTWF0aC5hYnMoYjMpKSAmJiBNYXRoLmFicyhhNCAtIGI0KSA8PSBnbE1hdHJpeC5FUFNJTE9OICogTWF0aC5tYXgoMS4wLCBNYXRoLmFicyhhNCksIE1hdGguYWJzKGI0KSkgJiYgTWF0aC5hYnMoYTUgLSBiNSkgPD0gZ2xNYXRyaXguRVBTSUxPTiAqIE1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTUpLCBNYXRoLmFicyhiNSkpICYmIE1hdGguYWJzKGE2IC0gYjYpIDw9IGdsTWF0cml4LkVQU0lMT04gKiBNYXRoLm1heCgxLjAsIE1hdGguYWJzKGE2KSwgTWF0aC5hYnMoYjYpKSAmJiBNYXRoLmFicyhhNyAtIGI3KSA8PSBnbE1hdHJpeC5FUFNJTE9OICogTWF0aC5tYXgoMS4wLCBNYXRoLmFicyhhNyksIE1hdGguYWJzKGI3KSkgJiYgTWF0aC5hYnMoYTggLSBiOCkgPD0gZ2xNYXRyaXguRVBTSUxPTiAqIE1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTgpLCBNYXRoLmFicyhiOCkpICYmIE1hdGguYWJzKGE5IC0gYjkpIDw9IGdsTWF0cml4LkVQU0lMT04gKiBNYXRoLm1heCgxLjAsIE1hdGguYWJzKGE5KSwgTWF0aC5hYnMoYjkpKSAmJiBNYXRoLmFicyhhMTAgLSBiMTApIDw9IGdsTWF0cml4LkVQU0lMT04gKiBNYXRoLm1heCgxLjAsIE1hdGguYWJzKGExMCksIE1hdGguYWJzKGIxMCkpICYmIE1hdGguYWJzKGExMSAtIGIxMSkgPD0gZ2xNYXRyaXguRVBTSUxPTiAqIE1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTExKSwgTWF0aC5hYnMoYjExKSkgJiYgTWF0aC5hYnMoYTEyIC0gYjEyKSA8PSBnbE1hdHJpeC5FUFNJTE9OICogTWF0aC5tYXgoMS4wLCBNYXRoLmFicyhhMTIpLCBNYXRoLmFicyhiMTIpKSAmJiBNYXRoLmFicyhhMTMgLSBiMTMpIDw9IGdsTWF0cml4LkVQU0lMT04gKiBNYXRoLm1heCgxLjAsIE1hdGguYWJzKGExMyksIE1hdGguYWJzKGIxMykpICYmIE1hdGguYWJzKGExNCAtIGIxNCkgPD0gZ2xNYXRyaXguRVBTSUxPTiAqIE1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTE0KSwgTWF0aC5hYnMoYjE0KSkgJiYgTWF0aC5hYnMoYTE1IC0gYjE1KSA8PSBnbE1hdHJpeC5FUFNJTE9OICogTWF0aC5tYXgoMS4wLCBNYXRoLmFicyhhMTUpLCBNYXRoLmFicyhiMTUpKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEFsaWFzIGZvciB7QGxpbmsgbWF0NC5tdWx0aXBseX1cclxuICogQGZ1bmN0aW9uXHJcbiAqL1xyXG5leHBvcnQgdmFyIG11bCA9IG11bHRpcGx5O1xyXG5cclxuLyoqXHJcbiAqIEFsaWFzIGZvciB7QGxpbmsgbWF0NC5zdWJ0cmFjdH1cclxuICogQGZ1bmN0aW9uXHJcbiAqL1xyXG5leHBvcnQgdmFyIHN1YiA9IHN1YnRyYWN0OyIsImltcG9ydCAqIGFzIGdsTWF0cml4IGZyb20gXCIuL2NvbW1vbi5qc1wiO1xyXG5cclxuLyoqXHJcbiAqIDMgRGltZW5zaW9uYWwgVmVjdG9yXHJcbiAqIEBtb2R1bGUgdmVjM1xyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgbmV3LCBlbXB0eSB2ZWMzXHJcbiAqXHJcbiAqIEByZXR1cm5zIHt2ZWMzfSBhIG5ldyAzRCB2ZWN0b3JcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGUoKSB7XHJcbiAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDMpO1xyXG4gIGlmIChnbE1hdHJpeC5BUlJBWV9UWVBFICE9IEZsb2F0MzJBcnJheSkge1xyXG4gICAgb3V0WzBdID0gMDtcclxuICAgIG91dFsxXSA9IDA7XHJcbiAgICBvdXRbMl0gPSAwO1xyXG4gIH1cclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIG5ldyB2ZWMzIGluaXRpYWxpemVkIHdpdGggdmFsdWVzIGZyb20gYW4gZXhpc3RpbmcgdmVjdG9yXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjM30gYSB2ZWN0b3IgdG8gY2xvbmVcclxuICogQHJldHVybnMge3ZlYzN9IGEgbmV3IDNEIHZlY3RvclxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNsb25lKGEpIHtcclxuICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoMyk7XHJcbiAgb3V0WzBdID0gYVswXTtcclxuICBvdXRbMV0gPSBhWzFdO1xyXG4gIG91dFsyXSA9IGFbMl07XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIENhbGN1bGF0ZXMgdGhlIGxlbmd0aCBvZiBhIHZlYzNcclxuICpcclxuICogQHBhcmFtIHt2ZWMzfSBhIHZlY3RvciB0byBjYWxjdWxhdGUgbGVuZ3RoIG9mXHJcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IGxlbmd0aCBvZiBhXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gbGVuZ3RoKGEpIHtcclxuICB2YXIgeCA9IGFbMF07XHJcbiAgdmFyIHkgPSBhWzFdO1xyXG4gIHZhciB6ID0gYVsyXTtcclxuICByZXR1cm4gTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkgKyB6ICogeik7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgbmV3IHZlYzMgaW5pdGlhbGl6ZWQgd2l0aCB0aGUgZ2l2ZW4gdmFsdWVzXHJcbiAqXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IFggY29tcG9uZW50XHJcbiAqIEBwYXJhbSB7TnVtYmVyfSB5IFkgY29tcG9uZW50XHJcbiAqIEBwYXJhbSB7TnVtYmVyfSB6IFogY29tcG9uZW50XHJcbiAqIEByZXR1cm5zIHt2ZWMzfSBhIG5ldyAzRCB2ZWN0b3JcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBmcm9tVmFsdWVzKHgsIHksIHopIHtcclxuICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoMyk7XHJcbiAgb3V0WzBdID0geDtcclxuICBvdXRbMV0gPSB5O1xyXG4gIG91dFsyXSA9IHo7XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIENvcHkgdGhlIHZhbHVlcyBmcm9tIG9uZSB2ZWMzIHRvIGFub3RoZXJcclxuICpcclxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBzb3VyY2UgdmVjdG9yXHJcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjb3B5KG91dCwgYSkge1xyXG4gIG91dFswXSA9IGFbMF07XHJcbiAgb3V0WzFdID0gYVsxXTtcclxuICBvdXRbMl0gPSBhWzJdO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXQgdGhlIGNvbXBvbmVudHMgb2YgYSB2ZWMzIHRvIHRoZSBnaXZlbiB2YWx1ZXNcclxuICpcclxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcclxuICogQHBhcmFtIHtOdW1iZXJ9IHggWCBjb21wb25lbnRcclxuICogQHBhcmFtIHtOdW1iZXJ9IHkgWSBjb21wb25lbnRcclxuICogQHBhcmFtIHtOdW1iZXJ9IHogWiBjb21wb25lbnRcclxuICogQHJldHVybnMge3ZlYzN9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHNldChvdXQsIHgsIHksIHopIHtcclxuICBvdXRbMF0gPSB4O1xyXG4gIG91dFsxXSA9IHk7XHJcbiAgb3V0WzJdID0gejtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogQWRkcyB0d28gdmVjMydzXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXHJcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxyXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXHJcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBhZGQob3V0LCBhLCBiKSB7XHJcbiAgb3V0WzBdID0gYVswXSArIGJbMF07XHJcbiAgb3V0WzFdID0gYVsxXSArIGJbMV07XHJcbiAgb3V0WzJdID0gYVsyXSArIGJbMl07XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFN1YnRyYWN0cyB2ZWN0b3IgYiBmcm9tIHZlY3RvciBhXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXHJcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxyXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXHJcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBzdWJ0cmFjdChvdXQsIGEsIGIpIHtcclxuICBvdXRbMF0gPSBhWzBdIC0gYlswXTtcclxuICBvdXRbMV0gPSBhWzFdIC0gYlsxXTtcclxuICBvdXRbMl0gPSBhWzJdIC0gYlsyXTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogTXVsdGlwbGllcyB0d28gdmVjMydzXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXHJcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxyXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXHJcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBtdWx0aXBseShvdXQsIGEsIGIpIHtcclxuICBvdXRbMF0gPSBhWzBdICogYlswXTtcclxuICBvdXRbMV0gPSBhWzFdICogYlsxXTtcclxuICBvdXRbMl0gPSBhWzJdICogYlsyXTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogRGl2aWRlcyB0d28gdmVjMydzXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXHJcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxyXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXHJcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBkaXZpZGUob3V0LCBhLCBiKSB7XHJcbiAgb3V0WzBdID0gYVswXSAvIGJbMF07XHJcbiAgb3V0WzFdID0gYVsxXSAvIGJbMV07XHJcbiAgb3V0WzJdID0gYVsyXSAvIGJbMl07XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIE1hdGguY2VpbCB0aGUgY29tcG9uZW50cyBvZiBhIHZlYzNcclxuICpcclxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcclxuICogQHBhcmFtIHt2ZWMzfSBhIHZlY3RvciB0byBjZWlsXHJcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjZWlsKG91dCwgYSkge1xyXG4gIG91dFswXSA9IE1hdGguY2VpbChhWzBdKTtcclxuICBvdXRbMV0gPSBNYXRoLmNlaWwoYVsxXSk7XHJcbiAgb3V0WzJdID0gTWF0aC5jZWlsKGFbMl0pO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBNYXRoLmZsb29yIHRoZSBjb21wb25lbnRzIG9mIGEgdmVjM1xyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdmVjdG9yIHRvIGZsb29yXHJcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBmbG9vcihvdXQsIGEpIHtcclxuICBvdXRbMF0gPSBNYXRoLmZsb29yKGFbMF0pO1xyXG4gIG91dFsxXSA9IE1hdGguZmxvb3IoYVsxXSk7XHJcbiAgb3V0WzJdID0gTWF0aC5mbG9vcihhWzJdKTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogUmV0dXJucyB0aGUgbWluaW11bSBvZiB0d28gdmVjMydzXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXHJcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxyXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXHJcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBtaW4ob3V0LCBhLCBiKSB7XHJcbiAgb3V0WzBdID0gTWF0aC5taW4oYVswXSwgYlswXSk7XHJcbiAgb3V0WzFdID0gTWF0aC5taW4oYVsxXSwgYlsxXSk7XHJcbiAgb3V0WzJdID0gTWF0aC5taW4oYVsyXSwgYlsyXSk7XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgdGhlIG1heGltdW0gb2YgdHdvIHZlYzMnc1xyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIGZpcnN0IG9wZXJhbmRcclxuICogQHBhcmFtIHt2ZWMzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxyXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gbWF4KG91dCwgYSwgYikge1xyXG4gIG91dFswXSA9IE1hdGgubWF4KGFbMF0sIGJbMF0pO1xyXG4gIG91dFsxXSA9IE1hdGgubWF4KGFbMV0sIGJbMV0pO1xyXG4gIG91dFsyXSA9IE1hdGgubWF4KGFbMl0sIGJbMl0pO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBNYXRoLnJvdW5kIHRoZSBjb21wb25lbnRzIG9mIGEgdmVjM1xyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdmVjdG9yIHRvIHJvdW5kXHJcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiByb3VuZChvdXQsIGEpIHtcclxuICBvdXRbMF0gPSBNYXRoLnJvdW5kKGFbMF0pO1xyXG4gIG91dFsxXSA9IE1hdGgucm91bmQoYVsxXSk7XHJcbiAgb3V0WzJdID0gTWF0aC5yb3VuZChhWzJdKTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogU2NhbGVzIGEgdmVjMyBieSBhIHNjYWxhciBudW1iZXJcclxuICpcclxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSB2ZWN0b3IgdG8gc2NhbGVcclxuICogQHBhcmFtIHtOdW1iZXJ9IGIgYW1vdW50IHRvIHNjYWxlIHRoZSB2ZWN0b3IgYnlcclxuICogQHJldHVybnMge3ZlYzN9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHNjYWxlKG91dCwgYSwgYikge1xyXG4gIG91dFswXSA9IGFbMF0gKiBiO1xyXG4gIG91dFsxXSA9IGFbMV0gKiBiO1xyXG4gIG91dFsyXSA9IGFbMl0gKiBiO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBZGRzIHR3byB2ZWMzJ3MgYWZ0ZXIgc2NhbGluZyB0aGUgc2Vjb25kIG9wZXJhbmQgYnkgYSBzY2FsYXIgdmFsdWVcclxuICpcclxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXHJcbiAqIEBwYXJhbSB7dmVjM30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcclxuICogQHBhcmFtIHtOdW1iZXJ9IHNjYWxlIHRoZSBhbW91bnQgdG8gc2NhbGUgYiBieSBiZWZvcmUgYWRkaW5nXHJcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBzY2FsZUFuZEFkZChvdXQsIGEsIGIsIHNjYWxlKSB7XHJcbiAgb3V0WzBdID0gYVswXSArIGJbMF0gKiBzY2FsZTtcclxuICBvdXRbMV0gPSBhWzFdICsgYlsxXSAqIHNjYWxlO1xyXG4gIG91dFsyXSA9IGFbMl0gKyBiWzJdICogc2NhbGU7XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIENhbGN1bGF0ZXMgdGhlIGV1Y2xpZGlhbiBkaXN0YW5jZSBiZXR3ZWVuIHR3byB2ZWMzJ3NcclxuICpcclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXHJcbiAqIEBwYXJhbSB7dmVjM30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcclxuICogQHJldHVybnMge051bWJlcn0gZGlzdGFuY2UgYmV0d2VlbiBhIGFuZCBiXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZGlzdGFuY2UoYSwgYikge1xyXG4gIHZhciB4ID0gYlswXSAtIGFbMF07XHJcbiAgdmFyIHkgPSBiWzFdIC0gYVsxXTtcclxuICB2YXIgeiA9IGJbMl0gLSBhWzJdO1xyXG4gIHJldHVybiBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSArIHogKiB6KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENhbGN1bGF0ZXMgdGhlIHNxdWFyZWQgZXVjbGlkaWFuIGRpc3RhbmNlIGJldHdlZW4gdHdvIHZlYzMnc1xyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIGZpcnN0IG9wZXJhbmRcclxuICogQHBhcmFtIHt2ZWMzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxyXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBzcXVhcmVkIGRpc3RhbmNlIGJldHdlZW4gYSBhbmQgYlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHNxdWFyZWREaXN0YW5jZShhLCBiKSB7XHJcbiAgdmFyIHggPSBiWzBdIC0gYVswXTtcclxuICB2YXIgeSA9IGJbMV0gLSBhWzFdO1xyXG4gIHZhciB6ID0gYlsyXSAtIGFbMl07XHJcbiAgcmV0dXJuIHggKiB4ICsgeSAqIHkgKyB6ICogejtcclxufVxyXG5cclxuLyoqXHJcbiAqIENhbGN1bGF0ZXMgdGhlIHNxdWFyZWQgbGVuZ3RoIG9mIGEgdmVjM1xyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdmVjdG9yIHRvIGNhbGN1bGF0ZSBzcXVhcmVkIGxlbmd0aCBvZlxyXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBzcXVhcmVkIGxlbmd0aCBvZiBhXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gc3F1YXJlZExlbmd0aChhKSB7XHJcbiAgdmFyIHggPSBhWzBdO1xyXG4gIHZhciB5ID0gYVsxXTtcclxuICB2YXIgeiA9IGFbMl07XHJcbiAgcmV0dXJuIHggKiB4ICsgeSAqIHkgKyB6ICogejtcclxufVxyXG5cclxuLyoqXHJcbiAqIE5lZ2F0ZXMgdGhlIGNvbXBvbmVudHMgb2YgYSB2ZWMzXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXHJcbiAqIEBwYXJhbSB7dmVjM30gYSB2ZWN0b3IgdG8gbmVnYXRlXHJcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBuZWdhdGUob3V0LCBhKSB7XHJcbiAgb3V0WzBdID0gLWFbMF07XHJcbiAgb3V0WzFdID0gLWFbMV07XHJcbiAgb3V0WzJdID0gLWFbMl07XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgdGhlIGludmVyc2Ugb2YgdGhlIGNvbXBvbmVudHMgb2YgYSB2ZWMzXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXHJcbiAqIEBwYXJhbSB7dmVjM30gYSB2ZWN0b3IgdG8gaW52ZXJ0XHJcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpbnZlcnNlKG91dCwgYSkge1xyXG4gIG91dFswXSA9IDEuMCAvIGFbMF07XHJcbiAgb3V0WzFdID0gMS4wIC8gYVsxXTtcclxuICBvdXRbMl0gPSAxLjAgLyBhWzJdO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBOb3JtYWxpemUgYSB2ZWMzXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXHJcbiAqIEBwYXJhbSB7dmVjM30gYSB2ZWN0b3IgdG8gbm9ybWFsaXplXHJcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemUob3V0LCBhKSB7XHJcbiAgdmFyIHggPSBhWzBdO1xyXG4gIHZhciB5ID0gYVsxXTtcclxuICB2YXIgeiA9IGFbMl07XHJcbiAgdmFyIGxlbiA9IHggKiB4ICsgeSAqIHkgKyB6ICogejtcclxuICBpZiAobGVuID4gMCkge1xyXG4gICAgLy9UT0RPOiBldmFsdWF0ZSB1c2Ugb2YgZ2xtX2ludnNxcnQgaGVyZT9cclxuICAgIGxlbiA9IDEgLyBNYXRoLnNxcnQobGVuKTtcclxuICAgIG91dFswXSA9IGFbMF0gKiBsZW47XHJcbiAgICBvdXRbMV0gPSBhWzFdICogbGVuO1xyXG4gICAgb3V0WzJdID0gYVsyXSAqIGxlbjtcclxuICB9XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIENhbGN1bGF0ZXMgdGhlIGRvdCBwcm9kdWN0IG9mIHR3byB2ZWMzJ3NcclxuICpcclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXHJcbiAqIEBwYXJhbSB7dmVjM30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcclxuICogQHJldHVybnMge051bWJlcn0gZG90IHByb2R1Y3Qgb2YgYSBhbmQgYlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGRvdChhLCBiKSB7XHJcbiAgcmV0dXJuIGFbMF0gKiBiWzBdICsgYVsxXSAqIGJbMV0gKyBhWzJdICogYlsyXTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENvbXB1dGVzIHRoZSBjcm9zcyBwcm9kdWN0IG9mIHR3byB2ZWMzJ3NcclxuICpcclxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXHJcbiAqIEBwYXJhbSB7dmVjM30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcclxuICogQHJldHVybnMge3ZlYzN9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNyb3NzKG91dCwgYSwgYikge1xyXG4gIHZhciBheCA9IGFbMF0sXHJcbiAgICAgIGF5ID0gYVsxXSxcclxuICAgICAgYXogPSBhWzJdO1xyXG4gIHZhciBieCA9IGJbMF0sXHJcbiAgICAgIGJ5ID0gYlsxXSxcclxuICAgICAgYnogPSBiWzJdO1xyXG5cclxuICBvdXRbMF0gPSBheSAqIGJ6IC0gYXogKiBieTtcclxuICBvdXRbMV0gPSBheiAqIGJ4IC0gYXggKiBiejtcclxuICBvdXRbMl0gPSBheCAqIGJ5IC0gYXkgKiBieDtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogUGVyZm9ybXMgYSBsaW5lYXIgaW50ZXJwb2xhdGlvbiBiZXR3ZWVuIHR3byB2ZWMzJ3NcclxuICpcclxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXHJcbiAqIEBwYXJhbSB7dmVjM30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcclxuICogQHBhcmFtIHtOdW1iZXJ9IHQgaW50ZXJwb2xhdGlvbiBhbW91bnQsIGluIHRoZSByYW5nZSBbMC0xXSwgYmV0d2VlbiB0aGUgdHdvIGlucHV0c1xyXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gbGVycChvdXQsIGEsIGIsIHQpIHtcclxuICB2YXIgYXggPSBhWzBdO1xyXG4gIHZhciBheSA9IGFbMV07XHJcbiAgdmFyIGF6ID0gYVsyXTtcclxuICBvdXRbMF0gPSBheCArIHQgKiAoYlswXSAtIGF4KTtcclxuICBvdXRbMV0gPSBheSArIHQgKiAoYlsxXSAtIGF5KTtcclxuICBvdXRbMl0gPSBheiArIHQgKiAoYlsyXSAtIGF6KTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogUGVyZm9ybXMgYSBoZXJtaXRlIGludGVycG9sYXRpb24gd2l0aCB0d28gY29udHJvbCBwb2ludHNcclxuICpcclxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXHJcbiAqIEBwYXJhbSB7dmVjM30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcclxuICogQHBhcmFtIHt2ZWMzfSBjIHRoZSB0aGlyZCBvcGVyYW5kXHJcbiAqIEBwYXJhbSB7dmVjM30gZCB0aGUgZm91cnRoIG9wZXJhbmRcclxuICogQHBhcmFtIHtOdW1iZXJ9IHQgaW50ZXJwb2xhdGlvbiBhbW91bnQsIGluIHRoZSByYW5nZSBbMC0xXSwgYmV0d2VlbiB0aGUgdHdvIGlucHV0c1xyXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaGVybWl0ZShvdXQsIGEsIGIsIGMsIGQsIHQpIHtcclxuICB2YXIgZmFjdG9yVGltZXMyID0gdCAqIHQ7XHJcbiAgdmFyIGZhY3RvcjEgPSBmYWN0b3JUaW1lczIgKiAoMiAqIHQgLSAzKSArIDE7XHJcbiAgdmFyIGZhY3RvcjIgPSBmYWN0b3JUaW1lczIgKiAodCAtIDIpICsgdDtcclxuICB2YXIgZmFjdG9yMyA9IGZhY3RvclRpbWVzMiAqICh0IC0gMSk7XHJcbiAgdmFyIGZhY3RvcjQgPSBmYWN0b3JUaW1lczIgKiAoMyAtIDIgKiB0KTtcclxuXHJcbiAgb3V0WzBdID0gYVswXSAqIGZhY3RvcjEgKyBiWzBdICogZmFjdG9yMiArIGNbMF0gKiBmYWN0b3IzICsgZFswXSAqIGZhY3RvcjQ7XHJcbiAgb3V0WzFdID0gYVsxXSAqIGZhY3RvcjEgKyBiWzFdICogZmFjdG9yMiArIGNbMV0gKiBmYWN0b3IzICsgZFsxXSAqIGZhY3RvcjQ7XHJcbiAgb3V0WzJdID0gYVsyXSAqIGZhY3RvcjEgKyBiWzJdICogZmFjdG9yMiArIGNbMl0gKiBmYWN0b3IzICsgZFsyXSAqIGZhY3RvcjQ7XHJcblxyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBQZXJmb3JtcyBhIGJlemllciBpbnRlcnBvbGF0aW9uIHdpdGggdHdvIGNvbnRyb2wgcG9pbnRzXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXHJcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxyXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXHJcbiAqIEBwYXJhbSB7dmVjM30gYyB0aGUgdGhpcmQgb3BlcmFuZFxyXG4gKiBAcGFyYW0ge3ZlYzN9IGQgdGhlIGZvdXJ0aCBvcGVyYW5kXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSB0IGludGVycG9sYXRpb24gYW1vdW50LCBpbiB0aGUgcmFuZ2UgWzAtMV0sIGJldHdlZW4gdGhlIHR3byBpbnB1dHNcclxuICogQHJldHVybnMge3ZlYzN9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGJlemllcihvdXQsIGEsIGIsIGMsIGQsIHQpIHtcclxuICB2YXIgaW52ZXJzZUZhY3RvciA9IDEgLSB0O1xyXG4gIHZhciBpbnZlcnNlRmFjdG9yVGltZXNUd28gPSBpbnZlcnNlRmFjdG9yICogaW52ZXJzZUZhY3RvcjtcclxuICB2YXIgZmFjdG9yVGltZXMyID0gdCAqIHQ7XHJcbiAgdmFyIGZhY3RvcjEgPSBpbnZlcnNlRmFjdG9yVGltZXNUd28gKiBpbnZlcnNlRmFjdG9yO1xyXG4gIHZhciBmYWN0b3IyID0gMyAqIHQgKiBpbnZlcnNlRmFjdG9yVGltZXNUd287XHJcbiAgdmFyIGZhY3RvcjMgPSAzICogZmFjdG9yVGltZXMyICogaW52ZXJzZUZhY3RvcjtcclxuICB2YXIgZmFjdG9yNCA9IGZhY3RvclRpbWVzMiAqIHQ7XHJcblxyXG4gIG91dFswXSA9IGFbMF0gKiBmYWN0b3IxICsgYlswXSAqIGZhY3RvcjIgKyBjWzBdICogZmFjdG9yMyArIGRbMF0gKiBmYWN0b3I0O1xyXG4gIG91dFsxXSA9IGFbMV0gKiBmYWN0b3IxICsgYlsxXSAqIGZhY3RvcjIgKyBjWzFdICogZmFjdG9yMyArIGRbMV0gKiBmYWN0b3I0O1xyXG4gIG91dFsyXSA9IGFbMl0gKiBmYWN0b3IxICsgYlsyXSAqIGZhY3RvcjIgKyBjWzJdICogZmFjdG9yMyArIGRbMl0gKiBmYWN0b3I0O1xyXG5cclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogR2VuZXJhdGVzIGEgcmFuZG9tIHZlY3RvciB3aXRoIHRoZSBnaXZlbiBzY2FsZVxyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge051bWJlcn0gW3NjYWxlXSBMZW5ndGggb2YgdGhlIHJlc3VsdGluZyB2ZWN0b3IuIElmIG9tbWl0dGVkLCBhIHVuaXQgdmVjdG9yIHdpbGwgYmUgcmV0dXJuZWRcclxuICogQHJldHVybnMge3ZlYzN9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbShvdXQsIHNjYWxlKSB7XHJcbiAgc2NhbGUgPSBzY2FsZSB8fCAxLjA7XHJcblxyXG4gIHZhciByID0gZ2xNYXRyaXguUkFORE9NKCkgKiAyLjAgKiBNYXRoLlBJO1xyXG4gIHZhciB6ID0gZ2xNYXRyaXguUkFORE9NKCkgKiAyLjAgLSAxLjA7XHJcbiAgdmFyIHpTY2FsZSA9IE1hdGguc3FydCgxLjAgLSB6ICogeikgKiBzY2FsZTtcclxuXHJcbiAgb3V0WzBdID0gTWF0aC5jb3MocikgKiB6U2NhbGU7XHJcbiAgb3V0WzFdID0gTWF0aC5zaW4ocikgKiB6U2NhbGU7XHJcbiAgb3V0WzJdID0geiAqIHNjYWxlO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUcmFuc2Zvcm1zIHRoZSB2ZWMzIHdpdGggYSBtYXQ0LlxyXG4gKiA0dGggdmVjdG9yIGNvbXBvbmVudCBpcyBpbXBsaWNpdGx5ICcxJ1xyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIHZlY3RvciB0byB0cmFuc2Zvcm1cclxuICogQHBhcmFtIHttYXQ0fSBtIG1hdHJpeCB0byB0cmFuc2Zvcm0gd2l0aFxyXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdHJhbnNmb3JtTWF0NChvdXQsIGEsIG0pIHtcclxuICB2YXIgeCA9IGFbMF0sXHJcbiAgICAgIHkgPSBhWzFdLFxyXG4gICAgICB6ID0gYVsyXTtcclxuICB2YXIgdyA9IG1bM10gKiB4ICsgbVs3XSAqIHkgKyBtWzExXSAqIHogKyBtWzE1XTtcclxuICB3ID0gdyB8fCAxLjA7XHJcbiAgb3V0WzBdID0gKG1bMF0gKiB4ICsgbVs0XSAqIHkgKyBtWzhdICogeiArIG1bMTJdKSAvIHc7XHJcbiAgb3V0WzFdID0gKG1bMV0gKiB4ICsgbVs1XSAqIHkgKyBtWzldICogeiArIG1bMTNdKSAvIHc7XHJcbiAgb3V0WzJdID0gKG1bMl0gKiB4ICsgbVs2XSAqIHkgKyBtWzEwXSAqIHogKyBtWzE0XSkgLyB3O1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUcmFuc2Zvcm1zIHRoZSB2ZWMzIHdpdGggYSBtYXQzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIHZlY3RvciB0byB0cmFuc2Zvcm1cclxuICogQHBhcmFtIHttYXQzfSBtIHRoZSAzeDMgbWF0cml4IHRvIHRyYW5zZm9ybSB3aXRoXHJcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiB0cmFuc2Zvcm1NYXQzKG91dCwgYSwgbSkge1xyXG4gIHZhciB4ID0gYVswXSxcclxuICAgICAgeSA9IGFbMV0sXHJcbiAgICAgIHogPSBhWzJdO1xyXG4gIG91dFswXSA9IHggKiBtWzBdICsgeSAqIG1bM10gKyB6ICogbVs2XTtcclxuICBvdXRbMV0gPSB4ICogbVsxXSArIHkgKiBtWzRdICsgeiAqIG1bN107XHJcbiAgb3V0WzJdID0geCAqIG1bMl0gKyB5ICogbVs1XSArIHogKiBtWzhdO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUcmFuc2Zvcm1zIHRoZSB2ZWMzIHdpdGggYSBxdWF0XHJcbiAqIENhbiBhbHNvIGJlIHVzZWQgZm9yIGR1YWwgcXVhdGVybmlvbnMuIChNdWx0aXBseSBpdCB3aXRoIHRoZSByZWFsIHBhcnQpXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXHJcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgdmVjdG9yIHRvIHRyYW5zZm9ybVxyXG4gKiBAcGFyYW0ge3F1YXR9IHEgcXVhdGVybmlvbiB0byB0cmFuc2Zvcm0gd2l0aFxyXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdHJhbnNmb3JtUXVhdChvdXQsIGEsIHEpIHtcclxuICAvLyBiZW5jaG1hcmtzOiBodHRwczovL2pzcGVyZi5jb20vcXVhdGVybmlvbi10cmFuc2Zvcm0tdmVjMy1pbXBsZW1lbnRhdGlvbnMtZml4ZWRcclxuICB2YXIgcXggPSBxWzBdLFxyXG4gICAgICBxeSA9IHFbMV0sXHJcbiAgICAgIHF6ID0gcVsyXSxcclxuICAgICAgcXcgPSBxWzNdO1xyXG4gIHZhciB4ID0gYVswXSxcclxuICAgICAgeSA9IGFbMV0sXHJcbiAgICAgIHogPSBhWzJdO1xyXG4gIC8vIHZhciBxdmVjID0gW3F4LCBxeSwgcXpdO1xyXG4gIC8vIHZhciB1diA9IHZlYzMuY3Jvc3MoW10sIHF2ZWMsIGEpO1xyXG4gIHZhciB1dnggPSBxeSAqIHogLSBxeiAqIHksXHJcbiAgICAgIHV2eSA9IHF6ICogeCAtIHF4ICogeixcclxuICAgICAgdXZ6ID0gcXggKiB5IC0gcXkgKiB4O1xyXG4gIC8vIHZhciB1dXYgPSB2ZWMzLmNyb3NzKFtdLCBxdmVjLCB1dik7XHJcbiAgdmFyIHV1dnggPSBxeSAqIHV2eiAtIHF6ICogdXZ5LFxyXG4gICAgICB1dXZ5ID0gcXogKiB1dnggLSBxeCAqIHV2eixcclxuICAgICAgdXV2eiA9IHF4ICogdXZ5IC0gcXkgKiB1dng7XHJcbiAgLy8gdmVjMy5zY2FsZSh1diwgdXYsIDIgKiB3KTtcclxuICB2YXIgdzIgPSBxdyAqIDI7XHJcbiAgdXZ4ICo9IHcyO1xyXG4gIHV2eSAqPSB3MjtcclxuICB1dnogKj0gdzI7XHJcbiAgLy8gdmVjMy5zY2FsZSh1dXYsIHV1diwgMik7XHJcbiAgdXV2eCAqPSAyO1xyXG4gIHV1dnkgKj0gMjtcclxuICB1dXZ6ICo9IDI7XHJcbiAgLy8gcmV0dXJuIHZlYzMuYWRkKG91dCwgYSwgdmVjMy5hZGQob3V0LCB1diwgdXV2KSk7XHJcbiAgb3V0WzBdID0geCArIHV2eCArIHV1dng7XHJcbiAgb3V0WzFdID0geSArIHV2eSArIHV1dnk7XHJcbiAgb3V0WzJdID0geiArIHV2eiArIHV1dno7XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJvdGF0ZSBhIDNEIHZlY3RvciBhcm91bmQgdGhlIHgtYXhpc1xyXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCBUaGUgcmVjZWl2aW5nIHZlYzNcclxuICogQHBhcmFtIHt2ZWMzfSBhIFRoZSB2ZWMzIHBvaW50IHRvIHJvdGF0ZVxyXG4gKiBAcGFyYW0ge3ZlYzN9IGIgVGhlIG9yaWdpbiBvZiB0aGUgcm90YXRpb25cclxuICogQHBhcmFtIHtOdW1iZXJ9IGMgVGhlIGFuZ2xlIG9mIHJvdGF0aW9uXHJcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiByb3RhdGVYKG91dCwgYSwgYiwgYykge1xyXG4gIHZhciBwID0gW10sXHJcbiAgICAgIHIgPSBbXTtcclxuICAvL1RyYW5zbGF0ZSBwb2ludCB0byB0aGUgb3JpZ2luXHJcbiAgcFswXSA9IGFbMF0gLSBiWzBdO1xyXG4gIHBbMV0gPSBhWzFdIC0gYlsxXTtcclxuICBwWzJdID0gYVsyXSAtIGJbMl07XHJcblxyXG4gIC8vcGVyZm9ybSByb3RhdGlvblxyXG4gIHJbMF0gPSBwWzBdO1xyXG4gIHJbMV0gPSBwWzFdICogTWF0aC5jb3MoYykgLSBwWzJdICogTWF0aC5zaW4oYyk7XHJcbiAgclsyXSA9IHBbMV0gKiBNYXRoLnNpbihjKSArIHBbMl0gKiBNYXRoLmNvcyhjKTtcclxuXHJcbiAgLy90cmFuc2xhdGUgdG8gY29ycmVjdCBwb3NpdGlvblxyXG4gIG91dFswXSA9IHJbMF0gKyBiWzBdO1xyXG4gIG91dFsxXSA9IHJbMV0gKyBiWzFdO1xyXG4gIG91dFsyXSA9IHJbMl0gKyBiWzJdO1xyXG5cclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogUm90YXRlIGEgM0QgdmVjdG9yIGFyb3VuZCB0aGUgeS1heGlzXHJcbiAqIEBwYXJhbSB7dmVjM30gb3V0IFRoZSByZWNlaXZpbmcgdmVjM1xyXG4gKiBAcGFyYW0ge3ZlYzN9IGEgVGhlIHZlYzMgcG9pbnQgdG8gcm90YXRlXHJcbiAqIEBwYXJhbSB7dmVjM30gYiBUaGUgb3JpZ2luIG9mIHRoZSByb3RhdGlvblxyXG4gKiBAcGFyYW0ge051bWJlcn0gYyBUaGUgYW5nbGUgb2Ygcm90YXRpb25cclxuICogQHJldHVybnMge3ZlYzN9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHJvdGF0ZVkob3V0LCBhLCBiLCBjKSB7XHJcbiAgdmFyIHAgPSBbXSxcclxuICAgICAgciA9IFtdO1xyXG4gIC8vVHJhbnNsYXRlIHBvaW50IHRvIHRoZSBvcmlnaW5cclxuICBwWzBdID0gYVswXSAtIGJbMF07XHJcbiAgcFsxXSA9IGFbMV0gLSBiWzFdO1xyXG4gIHBbMl0gPSBhWzJdIC0gYlsyXTtcclxuXHJcbiAgLy9wZXJmb3JtIHJvdGF0aW9uXHJcbiAgclswXSA9IHBbMl0gKiBNYXRoLnNpbihjKSArIHBbMF0gKiBNYXRoLmNvcyhjKTtcclxuICByWzFdID0gcFsxXTtcclxuICByWzJdID0gcFsyXSAqIE1hdGguY29zKGMpIC0gcFswXSAqIE1hdGguc2luKGMpO1xyXG5cclxuICAvL3RyYW5zbGF0ZSB0byBjb3JyZWN0IHBvc2l0aW9uXHJcbiAgb3V0WzBdID0gclswXSArIGJbMF07XHJcbiAgb3V0WzFdID0gclsxXSArIGJbMV07XHJcbiAgb3V0WzJdID0gclsyXSArIGJbMl07XHJcblxyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSb3RhdGUgYSAzRCB2ZWN0b3IgYXJvdW5kIHRoZSB6LWF4aXNcclxuICogQHBhcmFtIHt2ZWMzfSBvdXQgVGhlIHJlY2VpdmluZyB2ZWMzXHJcbiAqIEBwYXJhbSB7dmVjM30gYSBUaGUgdmVjMyBwb2ludCB0byByb3RhdGVcclxuICogQHBhcmFtIHt2ZWMzfSBiIFRoZSBvcmlnaW4gb2YgdGhlIHJvdGF0aW9uXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBjIFRoZSBhbmdsZSBvZiByb3RhdGlvblxyXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcm90YXRlWihvdXQsIGEsIGIsIGMpIHtcclxuICB2YXIgcCA9IFtdLFxyXG4gICAgICByID0gW107XHJcbiAgLy9UcmFuc2xhdGUgcG9pbnQgdG8gdGhlIG9yaWdpblxyXG4gIHBbMF0gPSBhWzBdIC0gYlswXTtcclxuICBwWzFdID0gYVsxXSAtIGJbMV07XHJcbiAgcFsyXSA9IGFbMl0gLSBiWzJdO1xyXG5cclxuICAvL3BlcmZvcm0gcm90YXRpb25cclxuICByWzBdID0gcFswXSAqIE1hdGguY29zKGMpIC0gcFsxXSAqIE1hdGguc2luKGMpO1xyXG4gIHJbMV0gPSBwWzBdICogTWF0aC5zaW4oYykgKyBwWzFdICogTWF0aC5jb3MoYyk7XHJcbiAgclsyXSA9IHBbMl07XHJcblxyXG4gIC8vdHJhbnNsYXRlIHRvIGNvcnJlY3QgcG9zaXRpb25cclxuICBvdXRbMF0gPSByWzBdICsgYlswXTtcclxuICBvdXRbMV0gPSByWzFdICsgYlsxXTtcclxuICBvdXRbMl0gPSByWzJdICsgYlsyXTtcclxuXHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEdldCB0aGUgYW5nbGUgYmV0d2VlbiB0d28gM0QgdmVjdG9yc1xyXG4gKiBAcGFyYW0ge3ZlYzN9IGEgVGhlIGZpcnN0IG9wZXJhbmRcclxuICogQHBhcmFtIHt2ZWMzfSBiIFRoZSBzZWNvbmQgb3BlcmFuZFxyXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBUaGUgYW5nbGUgaW4gcmFkaWFuc1xyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGFuZ2xlKGEsIGIpIHtcclxuICB2YXIgdGVtcEEgPSBmcm9tVmFsdWVzKGFbMF0sIGFbMV0sIGFbMl0pO1xyXG4gIHZhciB0ZW1wQiA9IGZyb21WYWx1ZXMoYlswXSwgYlsxXSwgYlsyXSk7XHJcblxyXG4gIG5vcm1hbGl6ZSh0ZW1wQSwgdGVtcEEpO1xyXG4gIG5vcm1hbGl6ZSh0ZW1wQiwgdGVtcEIpO1xyXG5cclxuICB2YXIgY29zaW5lID0gZG90KHRlbXBBLCB0ZW1wQik7XHJcblxyXG4gIGlmIChjb3NpbmUgPiAxLjApIHtcclxuICAgIHJldHVybiAwO1xyXG4gIH0gZWxzZSBpZiAoY29zaW5lIDwgLTEuMCkge1xyXG4gICAgcmV0dXJuIE1hdGguUEk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBNYXRoLmFjb3MoY29zaW5lKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGEgdmVjdG9yXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjM30gYSB2ZWN0b3IgdG8gcmVwcmVzZW50IGFzIGEgc3RyaW5nXHJcbiAqIEByZXR1cm5zIHtTdHJpbmd9IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgdmVjdG9yXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gc3RyKGEpIHtcclxuICByZXR1cm4gJ3ZlYzMoJyArIGFbMF0gKyAnLCAnICsgYVsxXSArICcsICcgKyBhWzJdICsgJyknO1xyXG59XHJcblxyXG4vKipcclxuICogUmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgdmVjdG9ycyBoYXZlIGV4YWN0bHkgdGhlIHNhbWUgZWxlbWVudHMgaW4gdGhlIHNhbWUgcG9zaXRpb24gKHdoZW4gY29tcGFyZWQgd2l0aCA9PT0pXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjM30gYSBUaGUgZmlyc3QgdmVjdG9yLlxyXG4gKiBAcGFyYW0ge3ZlYzN9IGIgVGhlIHNlY29uZCB2ZWN0b3IuXHJcbiAqIEByZXR1cm5zIHtCb29sZWFufSBUcnVlIGlmIHRoZSB2ZWN0b3JzIGFyZSBlcXVhbCwgZmFsc2Ugb3RoZXJ3aXNlLlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGV4YWN0RXF1YWxzKGEsIGIpIHtcclxuICByZXR1cm4gYVswXSA9PT0gYlswXSAmJiBhWzFdID09PSBiWzFdICYmIGFbMl0gPT09IGJbMl07XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSB2ZWN0b3JzIGhhdmUgYXBwcm94aW1hdGVseSB0aGUgc2FtZSBlbGVtZW50cyBpbiB0aGUgc2FtZSBwb3NpdGlvbi5cclxuICpcclxuICogQHBhcmFtIHt2ZWMzfSBhIFRoZSBmaXJzdCB2ZWN0b3IuXHJcbiAqIEBwYXJhbSB7dmVjM30gYiBUaGUgc2Vjb25kIHZlY3Rvci5cclxuICogQHJldHVybnMge0Jvb2xlYW59IFRydWUgaWYgdGhlIHZlY3RvcnMgYXJlIGVxdWFsLCBmYWxzZSBvdGhlcndpc2UuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZXF1YWxzKGEsIGIpIHtcclxuICB2YXIgYTAgPSBhWzBdLFxyXG4gICAgICBhMSA9IGFbMV0sXHJcbiAgICAgIGEyID0gYVsyXTtcclxuICB2YXIgYjAgPSBiWzBdLFxyXG4gICAgICBiMSA9IGJbMV0sXHJcbiAgICAgIGIyID0gYlsyXTtcclxuICByZXR1cm4gTWF0aC5hYnMoYTAgLSBiMCkgPD0gZ2xNYXRyaXguRVBTSUxPTiAqIE1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTApLCBNYXRoLmFicyhiMCkpICYmIE1hdGguYWJzKGExIC0gYjEpIDw9IGdsTWF0cml4LkVQU0lMT04gKiBNYXRoLm1heCgxLjAsIE1hdGguYWJzKGExKSwgTWF0aC5hYnMoYjEpKSAmJiBNYXRoLmFicyhhMiAtIGIyKSA8PSBnbE1hdHJpeC5FUFNJTE9OICogTWF0aC5tYXgoMS4wLCBNYXRoLmFicyhhMiksIE1hdGguYWJzKGIyKSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzMuc3VidHJhY3R9XHJcbiAqIEBmdW5jdGlvblxyXG4gKi9cclxuZXhwb3J0IHZhciBzdWIgPSBzdWJ0cmFjdDtcclxuXHJcbi8qKlxyXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzMubXVsdGlwbHl9XHJcbiAqIEBmdW5jdGlvblxyXG4gKi9cclxuZXhwb3J0IHZhciBtdWwgPSBtdWx0aXBseTtcclxuXHJcbi8qKlxyXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzMuZGl2aWRlfVxyXG4gKiBAZnVuY3Rpb25cclxuICovXHJcbmV4cG9ydCB2YXIgZGl2ID0gZGl2aWRlO1xyXG5cclxuLyoqXHJcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjMy5kaXN0YW5jZX1cclxuICogQGZ1bmN0aW9uXHJcbiAqL1xyXG5leHBvcnQgdmFyIGRpc3QgPSBkaXN0YW5jZTtcclxuXHJcbi8qKlxyXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzMuc3F1YXJlZERpc3RhbmNlfVxyXG4gKiBAZnVuY3Rpb25cclxuICovXHJcbmV4cG9ydCB2YXIgc3FyRGlzdCA9IHNxdWFyZWREaXN0YW5jZTtcclxuXHJcbi8qKlxyXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzMubGVuZ3RofVxyXG4gKiBAZnVuY3Rpb25cclxuICovXHJcbmV4cG9ydCB2YXIgbGVuID0gbGVuZ3RoO1xyXG5cclxuLyoqXHJcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjMy5zcXVhcmVkTGVuZ3RofVxyXG4gKiBAZnVuY3Rpb25cclxuICovXHJcbmV4cG9ydCB2YXIgc3FyTGVuID0gc3F1YXJlZExlbmd0aDtcclxuXHJcbi8qKlxyXG4gKiBQZXJmb3JtIHNvbWUgb3BlcmF0aW9uIG92ZXIgYW4gYXJyYXkgb2YgdmVjM3MuXHJcbiAqXHJcbiAqIEBwYXJhbSB7QXJyYXl9IGEgdGhlIGFycmF5IG9mIHZlY3RvcnMgdG8gaXRlcmF0ZSBvdmVyXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBzdHJpZGUgTnVtYmVyIG9mIGVsZW1lbnRzIGJldHdlZW4gdGhlIHN0YXJ0IG9mIGVhY2ggdmVjMy4gSWYgMCBhc3N1bWVzIHRpZ2h0bHkgcGFja2VkXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBvZmZzZXQgTnVtYmVyIG9mIGVsZW1lbnRzIHRvIHNraXAgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgYXJyYXlcclxuICogQHBhcmFtIHtOdW1iZXJ9IGNvdW50IE51bWJlciBvZiB2ZWMzcyB0byBpdGVyYXRlIG92ZXIuIElmIDAgaXRlcmF0ZXMgb3ZlciBlbnRpcmUgYXJyYXlcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gRnVuY3Rpb24gdG8gY2FsbCBmb3IgZWFjaCB2ZWN0b3IgaW4gdGhlIGFycmF5XHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBbYXJnXSBhZGRpdGlvbmFsIGFyZ3VtZW50IHRvIHBhc3MgdG8gZm5cclxuICogQHJldHVybnMge0FycmF5fSBhXHJcbiAqIEBmdW5jdGlvblxyXG4gKi9cclxuZXhwb3J0IHZhciBmb3JFYWNoID0gZnVuY3Rpb24gKCkge1xyXG4gIHZhciB2ZWMgPSBjcmVhdGUoKTtcclxuXHJcbiAgcmV0dXJuIGZ1bmN0aW9uIChhLCBzdHJpZGUsIG9mZnNldCwgY291bnQsIGZuLCBhcmcpIHtcclxuICAgIHZhciBpID0gdm9pZCAwLFxyXG4gICAgICAgIGwgPSB2b2lkIDA7XHJcbiAgICBpZiAoIXN0cmlkZSkge1xyXG4gICAgICBzdHJpZGUgPSAzO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghb2Zmc2V0KSB7XHJcbiAgICAgIG9mZnNldCA9IDA7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGNvdW50KSB7XHJcbiAgICAgIGwgPSBNYXRoLm1pbihjb3VudCAqIHN0cmlkZSArIG9mZnNldCwgYS5sZW5ndGgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbCA9IGEubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAoaSA9IG9mZnNldDsgaSA8IGw7IGkgKz0gc3RyaWRlKSB7XHJcbiAgICAgIHZlY1swXSA9IGFbaV07dmVjWzFdID0gYVtpICsgMV07dmVjWzJdID0gYVtpICsgMl07XHJcbiAgICAgIGZuKHZlYywgdmVjLCBhcmcpO1xyXG4gICAgICBhW2ldID0gdmVjWzBdO2FbaSArIDFdID0gdmVjWzFdO2FbaSArIDJdID0gdmVjWzJdO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhO1xyXG4gIH07XHJcbn0oKTsiLCJpbXBvcnQgKiBhcyBnbE1hdHJpeCBmcm9tIFwiLi9jb21tb24uanNcIjtcclxuXHJcbi8qKlxyXG4gKiA0IERpbWVuc2lvbmFsIFZlY3RvclxyXG4gKiBAbW9kdWxlIHZlYzRcclxuICovXHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIG5ldywgZW1wdHkgdmVjNFxyXG4gKlxyXG4gKiBAcmV0dXJucyB7dmVjNH0gYSBuZXcgNEQgdmVjdG9yXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlKCkge1xyXG4gIHZhciBvdXQgPSBuZXcgZ2xNYXRyaXguQVJSQVlfVFlQRSg0KTtcclxuICBpZiAoZ2xNYXRyaXguQVJSQVlfVFlQRSAhPSBGbG9hdDMyQXJyYXkpIHtcclxuICAgIG91dFswXSA9IDA7XHJcbiAgICBvdXRbMV0gPSAwO1xyXG4gICAgb3V0WzJdID0gMDtcclxuICAgIG91dFszXSA9IDA7XHJcbiAgfVxyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgbmV3IHZlYzQgaW5pdGlhbGl6ZWQgd2l0aCB2YWx1ZXMgZnJvbSBhbiBleGlzdGluZyB2ZWN0b3JcclxuICpcclxuICogQHBhcmFtIHt2ZWM0fSBhIHZlY3RvciB0byBjbG9uZVxyXG4gKiBAcmV0dXJucyB7dmVjNH0gYSBuZXcgNEQgdmVjdG9yXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY2xvbmUoYSkge1xyXG4gIHZhciBvdXQgPSBuZXcgZ2xNYXRyaXguQVJSQVlfVFlQRSg0KTtcclxuICBvdXRbMF0gPSBhWzBdO1xyXG4gIG91dFsxXSA9IGFbMV07XHJcbiAgb3V0WzJdID0gYVsyXTtcclxuICBvdXRbM10gPSBhWzNdO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgbmV3IHZlYzQgaW5pdGlhbGl6ZWQgd2l0aCB0aGUgZ2l2ZW4gdmFsdWVzXHJcbiAqXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IFggY29tcG9uZW50XHJcbiAqIEBwYXJhbSB7TnVtYmVyfSB5IFkgY29tcG9uZW50XHJcbiAqIEBwYXJhbSB7TnVtYmVyfSB6IFogY29tcG9uZW50XHJcbiAqIEBwYXJhbSB7TnVtYmVyfSB3IFcgY29tcG9uZW50XHJcbiAqIEByZXR1cm5zIHt2ZWM0fSBhIG5ldyA0RCB2ZWN0b3JcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBmcm9tVmFsdWVzKHgsIHksIHosIHcpIHtcclxuICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoNCk7XHJcbiAgb3V0WzBdID0geDtcclxuICBvdXRbMV0gPSB5O1xyXG4gIG91dFsyXSA9IHo7XHJcbiAgb3V0WzNdID0gdztcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogQ29weSB0aGUgdmFsdWVzIGZyb20gb25lIHZlYzQgdG8gYW5vdGhlclxyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdGhlIHNvdXJjZSB2ZWN0b3JcclxuICogQHJldHVybnMge3ZlYzR9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNvcHkob3V0LCBhKSB7XHJcbiAgb3V0WzBdID0gYVswXTtcclxuICBvdXRbMV0gPSBhWzFdO1xyXG4gIG91dFsyXSA9IGFbMl07XHJcbiAgb3V0WzNdID0gYVszXTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogU2V0IHRoZSBjb21wb25lbnRzIG9mIGEgdmVjNCB0byB0aGUgZ2l2ZW4gdmFsdWVzXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IFggY29tcG9uZW50XHJcbiAqIEBwYXJhbSB7TnVtYmVyfSB5IFkgY29tcG9uZW50XHJcbiAqIEBwYXJhbSB7TnVtYmVyfSB6IFogY29tcG9uZW50XHJcbiAqIEBwYXJhbSB7TnVtYmVyfSB3IFcgY29tcG9uZW50XHJcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXQob3V0LCB4LCB5LCB6LCB3KSB7XHJcbiAgb3V0WzBdID0geDtcclxuICBvdXRbMV0gPSB5O1xyXG4gIG91dFsyXSA9IHo7XHJcbiAgb3V0WzNdID0gdztcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogQWRkcyB0d28gdmVjNCdzXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXHJcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxyXG4gKiBAcGFyYW0ge3ZlYzR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXHJcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBhZGQob3V0LCBhLCBiKSB7XHJcbiAgb3V0WzBdID0gYVswXSArIGJbMF07XHJcbiAgb3V0WzFdID0gYVsxXSArIGJbMV07XHJcbiAgb3V0WzJdID0gYVsyXSArIGJbMl07XHJcbiAgb3V0WzNdID0gYVszXSArIGJbM107XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFN1YnRyYWN0cyB2ZWN0b3IgYiBmcm9tIHZlY3RvciBhXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXHJcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxyXG4gKiBAcGFyYW0ge3ZlYzR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXHJcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBzdWJ0cmFjdChvdXQsIGEsIGIpIHtcclxuICBvdXRbMF0gPSBhWzBdIC0gYlswXTtcclxuICBvdXRbMV0gPSBhWzFdIC0gYlsxXTtcclxuICBvdXRbMl0gPSBhWzJdIC0gYlsyXTtcclxuICBvdXRbM10gPSBhWzNdIC0gYlszXTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogTXVsdGlwbGllcyB0d28gdmVjNCdzXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXHJcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxyXG4gKiBAcGFyYW0ge3ZlYzR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXHJcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBtdWx0aXBseShvdXQsIGEsIGIpIHtcclxuICBvdXRbMF0gPSBhWzBdICogYlswXTtcclxuICBvdXRbMV0gPSBhWzFdICogYlsxXTtcclxuICBvdXRbMl0gPSBhWzJdICogYlsyXTtcclxuICBvdXRbM10gPSBhWzNdICogYlszXTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogRGl2aWRlcyB0d28gdmVjNCdzXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXHJcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxyXG4gKiBAcGFyYW0ge3ZlYzR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXHJcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBkaXZpZGUob3V0LCBhLCBiKSB7XHJcbiAgb3V0WzBdID0gYVswXSAvIGJbMF07XHJcbiAgb3V0WzFdID0gYVsxXSAvIGJbMV07XHJcbiAgb3V0WzJdID0gYVsyXSAvIGJbMl07XHJcbiAgb3V0WzNdID0gYVszXSAvIGJbM107XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIE1hdGguY2VpbCB0aGUgY29tcG9uZW50cyBvZiBhIHZlYzRcclxuICpcclxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcclxuICogQHBhcmFtIHt2ZWM0fSBhIHZlY3RvciB0byBjZWlsXHJcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjZWlsKG91dCwgYSkge1xyXG4gIG91dFswXSA9IE1hdGguY2VpbChhWzBdKTtcclxuICBvdXRbMV0gPSBNYXRoLmNlaWwoYVsxXSk7XHJcbiAgb3V0WzJdID0gTWF0aC5jZWlsKGFbMl0pO1xyXG4gIG91dFszXSA9IE1hdGguY2VpbChhWzNdKTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogTWF0aC5mbG9vciB0aGUgY29tcG9uZW50cyBvZiBhIHZlYzRcclxuICpcclxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcclxuICogQHBhcmFtIHt2ZWM0fSBhIHZlY3RvciB0byBmbG9vclxyXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZmxvb3Iob3V0LCBhKSB7XHJcbiAgb3V0WzBdID0gTWF0aC5mbG9vcihhWzBdKTtcclxuICBvdXRbMV0gPSBNYXRoLmZsb29yKGFbMV0pO1xyXG4gIG91dFsyXSA9IE1hdGguZmxvb3IoYVsyXSk7XHJcbiAgb3V0WzNdID0gTWF0aC5mbG9vcihhWzNdKTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogUmV0dXJucyB0aGUgbWluaW11bSBvZiB0d28gdmVjNCdzXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXHJcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxyXG4gKiBAcGFyYW0ge3ZlYzR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXHJcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBtaW4ob3V0LCBhLCBiKSB7XHJcbiAgb3V0WzBdID0gTWF0aC5taW4oYVswXSwgYlswXSk7XHJcbiAgb3V0WzFdID0gTWF0aC5taW4oYVsxXSwgYlsxXSk7XHJcbiAgb3V0WzJdID0gTWF0aC5taW4oYVsyXSwgYlsyXSk7XHJcbiAgb3V0WzNdID0gTWF0aC5taW4oYVszXSwgYlszXSk7XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgdGhlIG1heGltdW0gb2YgdHdvIHZlYzQnc1xyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcclxuICogQHBhcmFtIHt2ZWM0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxyXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gbWF4KG91dCwgYSwgYikge1xyXG4gIG91dFswXSA9IE1hdGgubWF4KGFbMF0sIGJbMF0pO1xyXG4gIG91dFsxXSA9IE1hdGgubWF4KGFbMV0sIGJbMV0pO1xyXG4gIG91dFsyXSA9IE1hdGgubWF4KGFbMl0sIGJbMl0pO1xyXG4gIG91dFszXSA9IE1hdGgubWF4KGFbM10sIGJbM10pO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBNYXRoLnJvdW5kIHRoZSBjb21wb25lbnRzIG9mIGEgdmVjNFxyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdmVjdG9yIHRvIHJvdW5kXHJcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiByb3VuZChvdXQsIGEpIHtcclxuICBvdXRbMF0gPSBNYXRoLnJvdW5kKGFbMF0pO1xyXG4gIG91dFsxXSA9IE1hdGgucm91bmQoYVsxXSk7XHJcbiAgb3V0WzJdID0gTWF0aC5yb3VuZChhWzJdKTtcclxuICBvdXRbM10gPSBNYXRoLnJvdW5kKGFbM10pO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTY2FsZXMgYSB2ZWM0IGJ5IGEgc2NhbGFyIG51bWJlclxyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdGhlIHZlY3RvciB0byBzY2FsZVxyXG4gKiBAcGFyYW0ge051bWJlcn0gYiBhbW91bnQgdG8gc2NhbGUgdGhlIHZlY3RvciBieVxyXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gc2NhbGUob3V0LCBhLCBiKSB7XHJcbiAgb3V0WzBdID0gYVswXSAqIGI7XHJcbiAgb3V0WzFdID0gYVsxXSAqIGI7XHJcbiAgb3V0WzJdID0gYVsyXSAqIGI7XHJcbiAgb3V0WzNdID0gYVszXSAqIGI7XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEFkZHMgdHdvIHZlYzQncyBhZnRlciBzY2FsaW5nIHRoZSBzZWNvbmQgb3BlcmFuZCBieSBhIHNjYWxhciB2YWx1ZVxyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcclxuICogQHBhcmFtIHt2ZWM0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxyXG4gKiBAcGFyYW0ge051bWJlcn0gc2NhbGUgdGhlIGFtb3VudCB0byBzY2FsZSBiIGJ5IGJlZm9yZSBhZGRpbmdcclxuICogQHJldHVybnMge3ZlYzR9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHNjYWxlQW5kQWRkKG91dCwgYSwgYiwgc2NhbGUpIHtcclxuICBvdXRbMF0gPSBhWzBdICsgYlswXSAqIHNjYWxlO1xyXG4gIG91dFsxXSA9IGFbMV0gKyBiWzFdICogc2NhbGU7XHJcbiAgb3V0WzJdID0gYVsyXSArIGJbMl0gKiBzY2FsZTtcclxuICBvdXRbM10gPSBhWzNdICsgYlszXSAqIHNjYWxlO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDYWxjdWxhdGVzIHRoZSBldWNsaWRpYW4gZGlzdGFuY2UgYmV0d2VlbiB0d28gdmVjNCdzXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxyXG4gKiBAcGFyYW0ge3ZlYzR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXHJcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IGRpc3RhbmNlIGJldHdlZW4gYSBhbmQgYlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGRpc3RhbmNlKGEsIGIpIHtcclxuICB2YXIgeCA9IGJbMF0gLSBhWzBdO1xyXG4gIHZhciB5ID0gYlsxXSAtIGFbMV07XHJcbiAgdmFyIHogPSBiWzJdIC0gYVsyXTtcclxuICB2YXIgdyA9IGJbM10gLSBhWzNdO1xyXG4gIHJldHVybiBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSArIHogKiB6ICsgdyAqIHcpO1xyXG59XHJcblxyXG4vKipcclxuICogQ2FsY3VsYXRlcyB0aGUgc3F1YXJlZCBldWNsaWRpYW4gZGlzdGFuY2UgYmV0d2VlbiB0d28gdmVjNCdzXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxyXG4gKiBAcGFyYW0ge3ZlYzR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXHJcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IHNxdWFyZWQgZGlzdGFuY2UgYmV0d2VlbiBhIGFuZCBiXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gc3F1YXJlZERpc3RhbmNlKGEsIGIpIHtcclxuICB2YXIgeCA9IGJbMF0gLSBhWzBdO1xyXG4gIHZhciB5ID0gYlsxXSAtIGFbMV07XHJcbiAgdmFyIHogPSBiWzJdIC0gYVsyXTtcclxuICB2YXIgdyA9IGJbM10gLSBhWzNdO1xyXG4gIHJldHVybiB4ICogeCArIHkgKiB5ICsgeiAqIHogKyB3ICogdztcclxufVxyXG5cclxuLyoqXHJcbiAqIENhbGN1bGF0ZXMgdGhlIGxlbmd0aCBvZiBhIHZlYzRcclxuICpcclxuICogQHBhcmFtIHt2ZWM0fSBhIHZlY3RvciB0byBjYWxjdWxhdGUgbGVuZ3RoIG9mXHJcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IGxlbmd0aCBvZiBhXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gbGVuZ3RoKGEpIHtcclxuICB2YXIgeCA9IGFbMF07XHJcbiAgdmFyIHkgPSBhWzFdO1xyXG4gIHZhciB6ID0gYVsyXTtcclxuICB2YXIgdyA9IGFbM107XHJcbiAgcmV0dXJuIE1hdGguc3FydCh4ICogeCArIHkgKiB5ICsgeiAqIHogKyB3ICogdyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDYWxjdWxhdGVzIHRoZSBzcXVhcmVkIGxlbmd0aCBvZiBhIHZlYzRcclxuICpcclxuICogQHBhcmFtIHt2ZWM0fSBhIHZlY3RvciB0byBjYWxjdWxhdGUgc3F1YXJlZCBsZW5ndGggb2ZcclxuICogQHJldHVybnMge051bWJlcn0gc3F1YXJlZCBsZW5ndGggb2YgYVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHNxdWFyZWRMZW5ndGgoYSkge1xyXG4gIHZhciB4ID0gYVswXTtcclxuICB2YXIgeSA9IGFbMV07XHJcbiAgdmFyIHogPSBhWzJdO1xyXG4gIHZhciB3ID0gYVszXTtcclxuICByZXR1cm4geCAqIHggKyB5ICogeSArIHogKiB6ICsgdyAqIHc7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBOZWdhdGVzIHRoZSBjb21wb25lbnRzIG9mIGEgdmVjNFxyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdmVjdG9yIHRvIG5lZ2F0ZVxyXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gbmVnYXRlKG91dCwgYSkge1xyXG4gIG91dFswXSA9IC1hWzBdO1xyXG4gIG91dFsxXSA9IC1hWzFdO1xyXG4gIG91dFsyXSA9IC1hWzJdO1xyXG4gIG91dFszXSA9IC1hWzNdO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBpbnZlcnNlIG9mIHRoZSBjb21wb25lbnRzIG9mIGEgdmVjNFxyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdmVjdG9yIHRvIGludmVydFxyXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaW52ZXJzZShvdXQsIGEpIHtcclxuICBvdXRbMF0gPSAxLjAgLyBhWzBdO1xyXG4gIG91dFsxXSA9IDEuMCAvIGFbMV07XHJcbiAgb3V0WzJdID0gMS4wIC8gYVsyXTtcclxuICBvdXRbM10gPSAxLjAgLyBhWzNdO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBOb3JtYWxpemUgYSB2ZWM0XHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXHJcbiAqIEBwYXJhbSB7dmVjNH0gYSB2ZWN0b3IgdG8gbm9ybWFsaXplXHJcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemUob3V0LCBhKSB7XHJcbiAgdmFyIHggPSBhWzBdO1xyXG4gIHZhciB5ID0gYVsxXTtcclxuICB2YXIgeiA9IGFbMl07XHJcbiAgdmFyIHcgPSBhWzNdO1xyXG4gIHZhciBsZW4gPSB4ICogeCArIHkgKiB5ICsgeiAqIHogKyB3ICogdztcclxuICBpZiAobGVuID4gMCkge1xyXG4gICAgbGVuID0gMSAvIE1hdGguc3FydChsZW4pO1xyXG4gICAgb3V0WzBdID0geCAqIGxlbjtcclxuICAgIG91dFsxXSA9IHkgKiBsZW47XHJcbiAgICBvdXRbMl0gPSB6ICogbGVuO1xyXG4gICAgb3V0WzNdID0gdyAqIGxlbjtcclxuICB9XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIENhbGN1bGF0ZXMgdGhlIGRvdCBwcm9kdWN0IG9mIHR3byB2ZWM0J3NcclxuICpcclxuICogQHBhcmFtIHt2ZWM0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXHJcbiAqIEBwYXJhbSB7dmVjNH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcclxuICogQHJldHVybnMge051bWJlcn0gZG90IHByb2R1Y3Qgb2YgYSBhbmQgYlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGRvdChhLCBiKSB7XHJcbiAgcmV0dXJuIGFbMF0gKiBiWzBdICsgYVsxXSAqIGJbMV0gKyBhWzJdICogYlsyXSArIGFbM10gKiBiWzNdO1xyXG59XHJcblxyXG4vKipcclxuICogUGVyZm9ybXMgYSBsaW5lYXIgaW50ZXJwb2xhdGlvbiBiZXR3ZWVuIHR3byB2ZWM0J3NcclxuICpcclxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcclxuICogQHBhcmFtIHt2ZWM0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXHJcbiAqIEBwYXJhbSB7dmVjNH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcclxuICogQHBhcmFtIHtOdW1iZXJ9IHQgaW50ZXJwb2xhdGlvbiBhbW91bnQsIGluIHRoZSByYW5nZSBbMC0xXSwgYmV0d2VlbiB0aGUgdHdvIGlucHV0c1xyXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gbGVycChvdXQsIGEsIGIsIHQpIHtcclxuICB2YXIgYXggPSBhWzBdO1xyXG4gIHZhciBheSA9IGFbMV07XHJcbiAgdmFyIGF6ID0gYVsyXTtcclxuICB2YXIgYXcgPSBhWzNdO1xyXG4gIG91dFswXSA9IGF4ICsgdCAqIChiWzBdIC0gYXgpO1xyXG4gIG91dFsxXSA9IGF5ICsgdCAqIChiWzFdIC0gYXkpO1xyXG4gIG91dFsyXSA9IGF6ICsgdCAqIChiWzJdIC0gYXopO1xyXG4gIG91dFszXSA9IGF3ICsgdCAqIChiWzNdIC0gYXcpO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZW5lcmF0ZXMgYSByYW5kb20gdmVjdG9yIHdpdGggdGhlIGdpdmVuIHNjYWxlXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBbc2NhbGVdIExlbmd0aCBvZiB0aGUgcmVzdWx0aW5nIHZlY3Rvci4gSWYgb21taXR0ZWQsIGEgdW5pdCB2ZWN0b3Igd2lsbCBiZSByZXR1cm5lZFxyXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tKG91dCwgc2NhbGUpIHtcclxuICBzY2FsZSA9IHNjYWxlIHx8IDEuMDtcclxuXHJcbiAgLy8gTWFyc2FnbGlhLCBHZW9yZ2UuIENob29zaW5nIGEgUG9pbnQgZnJvbSB0aGUgU3VyZmFjZSBvZiBhXHJcbiAgLy8gU3BoZXJlLiBBbm4uIE1hdGguIFN0YXRpc3QuIDQzICgxOTcyKSwgbm8uIDIsIDY0NS0tNjQ2LlxyXG4gIC8vIGh0dHA6Ly9wcm9qZWN0ZXVjbGlkLm9yZy9ldWNsaWQuYW9tcy8xMTc3NjkyNjQ0O1xyXG4gIHZhciB2MSwgdjIsIHYzLCB2NDtcclxuICB2YXIgczEsIHMyO1xyXG4gIGRvIHtcclxuICAgIHYxID0gZ2xNYXRyaXguUkFORE9NKCkgKiAyIC0gMTtcclxuICAgIHYyID0gZ2xNYXRyaXguUkFORE9NKCkgKiAyIC0gMTtcclxuICAgIHMxID0gdjEgKiB2MSArIHYyICogdjI7XHJcbiAgfSB3aGlsZSAoczEgPj0gMSk7XHJcbiAgZG8ge1xyXG4gICAgdjMgPSBnbE1hdHJpeC5SQU5ET00oKSAqIDIgLSAxO1xyXG4gICAgdjQgPSBnbE1hdHJpeC5SQU5ET00oKSAqIDIgLSAxO1xyXG4gICAgczIgPSB2MyAqIHYzICsgdjQgKiB2NDtcclxuICB9IHdoaWxlIChzMiA+PSAxKTtcclxuXHJcbiAgdmFyIGQgPSBNYXRoLnNxcnQoKDEgLSBzMSkgLyBzMik7XHJcbiAgb3V0WzBdID0gc2NhbGUgKiB2MTtcclxuICBvdXRbMV0gPSBzY2FsZSAqIHYyO1xyXG4gIG91dFsyXSA9IHNjYWxlICogdjMgKiBkO1xyXG4gIG91dFszXSA9IHNjYWxlICogdjQgKiBkO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUcmFuc2Zvcm1zIHRoZSB2ZWM0IHdpdGggYSBtYXQ0LlxyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdGhlIHZlY3RvciB0byB0cmFuc2Zvcm1cclxuICogQHBhcmFtIHttYXQ0fSBtIG1hdHJpeCB0byB0cmFuc2Zvcm0gd2l0aFxyXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdHJhbnNmb3JtTWF0NChvdXQsIGEsIG0pIHtcclxuICB2YXIgeCA9IGFbMF0sXHJcbiAgICAgIHkgPSBhWzFdLFxyXG4gICAgICB6ID0gYVsyXSxcclxuICAgICAgdyA9IGFbM107XHJcbiAgb3V0WzBdID0gbVswXSAqIHggKyBtWzRdICogeSArIG1bOF0gKiB6ICsgbVsxMl0gKiB3O1xyXG4gIG91dFsxXSA9IG1bMV0gKiB4ICsgbVs1XSAqIHkgKyBtWzldICogeiArIG1bMTNdICogdztcclxuICBvdXRbMl0gPSBtWzJdICogeCArIG1bNl0gKiB5ICsgbVsxMF0gKiB6ICsgbVsxNF0gKiB3O1xyXG4gIG91dFszXSA9IG1bM10gKiB4ICsgbVs3XSAqIHkgKyBtWzExXSAqIHogKyBtWzE1XSAqIHc7XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFRyYW5zZm9ybXMgdGhlIHZlYzQgd2l0aCBhIHF1YXRcclxuICpcclxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcclxuICogQHBhcmFtIHt2ZWM0fSBhIHRoZSB2ZWN0b3IgdG8gdHJhbnNmb3JtXHJcbiAqIEBwYXJhbSB7cXVhdH0gcSBxdWF0ZXJuaW9uIHRvIHRyYW5zZm9ybSB3aXRoXHJcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiB0cmFuc2Zvcm1RdWF0KG91dCwgYSwgcSkge1xyXG4gIHZhciB4ID0gYVswXSxcclxuICAgICAgeSA9IGFbMV0sXHJcbiAgICAgIHogPSBhWzJdO1xyXG4gIHZhciBxeCA9IHFbMF0sXHJcbiAgICAgIHF5ID0gcVsxXSxcclxuICAgICAgcXogPSBxWzJdLFxyXG4gICAgICBxdyA9IHFbM107XHJcblxyXG4gIC8vIGNhbGN1bGF0ZSBxdWF0ICogdmVjXHJcbiAgdmFyIGl4ID0gcXcgKiB4ICsgcXkgKiB6IC0gcXogKiB5O1xyXG4gIHZhciBpeSA9IHF3ICogeSArIHF6ICogeCAtIHF4ICogejtcclxuICB2YXIgaXogPSBxdyAqIHogKyBxeCAqIHkgLSBxeSAqIHg7XHJcbiAgdmFyIGl3ID0gLXF4ICogeCAtIHF5ICogeSAtIHF6ICogejtcclxuXHJcbiAgLy8gY2FsY3VsYXRlIHJlc3VsdCAqIGludmVyc2UgcXVhdFxyXG4gIG91dFswXSA9IGl4ICogcXcgKyBpdyAqIC1xeCArIGl5ICogLXF6IC0gaXogKiAtcXk7XHJcbiAgb3V0WzFdID0gaXkgKiBxdyArIGl3ICogLXF5ICsgaXogKiAtcXggLSBpeCAqIC1xejtcclxuICBvdXRbMl0gPSBpeiAqIHF3ICsgaXcgKiAtcXogKyBpeCAqIC1xeSAtIGl5ICogLXF4O1xyXG4gIG91dFszXSA9IGFbM107XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgYSB2ZWN0b3JcclxuICpcclxuICogQHBhcmFtIHt2ZWM0fSBhIHZlY3RvciB0byByZXByZXNlbnQgYXMgYSBzdHJpbmdcclxuICogQHJldHVybnMge1N0cmluZ30gc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB2ZWN0b3JcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBzdHIoYSkge1xyXG4gIHJldHVybiAndmVjNCgnICsgYVswXSArICcsICcgKyBhWzFdICsgJywgJyArIGFbMl0gKyAnLCAnICsgYVszXSArICcpJztcclxufVxyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgd2hldGhlciBvciBub3QgdGhlIHZlY3RvcnMgaGF2ZSBleGFjdGx5IHRoZSBzYW1lIGVsZW1lbnRzIGluIHRoZSBzYW1lIHBvc2l0aW9uICh3aGVuIGNvbXBhcmVkIHdpdGggPT09KVxyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzR9IGEgVGhlIGZpcnN0IHZlY3Rvci5cclxuICogQHBhcmFtIHt2ZWM0fSBiIFRoZSBzZWNvbmQgdmVjdG9yLlxyXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gVHJ1ZSBpZiB0aGUgdmVjdG9ycyBhcmUgZXF1YWwsIGZhbHNlIG90aGVyd2lzZS5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBleGFjdEVxdWFscyhhLCBiKSB7XHJcbiAgcmV0dXJuIGFbMF0gPT09IGJbMF0gJiYgYVsxXSA9PT0gYlsxXSAmJiBhWzJdID09PSBiWzJdICYmIGFbM10gPT09IGJbM107XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSB2ZWN0b3JzIGhhdmUgYXBwcm94aW1hdGVseSB0aGUgc2FtZSBlbGVtZW50cyBpbiB0aGUgc2FtZSBwb3NpdGlvbi5cclxuICpcclxuICogQHBhcmFtIHt2ZWM0fSBhIFRoZSBmaXJzdCB2ZWN0b3IuXHJcbiAqIEBwYXJhbSB7dmVjNH0gYiBUaGUgc2Vjb25kIHZlY3Rvci5cclxuICogQHJldHVybnMge0Jvb2xlYW59IFRydWUgaWYgdGhlIHZlY3RvcnMgYXJlIGVxdWFsLCBmYWxzZSBvdGhlcndpc2UuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZXF1YWxzKGEsIGIpIHtcclxuICB2YXIgYTAgPSBhWzBdLFxyXG4gICAgICBhMSA9IGFbMV0sXHJcbiAgICAgIGEyID0gYVsyXSxcclxuICAgICAgYTMgPSBhWzNdO1xyXG4gIHZhciBiMCA9IGJbMF0sXHJcbiAgICAgIGIxID0gYlsxXSxcclxuICAgICAgYjIgPSBiWzJdLFxyXG4gICAgICBiMyA9IGJbM107XHJcbiAgcmV0dXJuIE1hdGguYWJzKGEwIC0gYjApIDw9IGdsTWF0cml4LkVQU0lMT04gKiBNYXRoLm1heCgxLjAsIE1hdGguYWJzKGEwKSwgTWF0aC5hYnMoYjApKSAmJiBNYXRoLmFicyhhMSAtIGIxKSA8PSBnbE1hdHJpeC5FUFNJTE9OICogTWF0aC5tYXgoMS4wLCBNYXRoLmFicyhhMSksIE1hdGguYWJzKGIxKSkgJiYgTWF0aC5hYnMoYTIgLSBiMikgPD0gZ2xNYXRyaXguRVBTSUxPTiAqIE1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTIpLCBNYXRoLmFicyhiMikpICYmIE1hdGguYWJzKGEzIC0gYjMpIDw9IGdsTWF0cml4LkVQU0lMT04gKiBNYXRoLm1heCgxLjAsIE1hdGguYWJzKGEzKSwgTWF0aC5hYnMoYjMpKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjNC5zdWJ0cmFjdH1cclxuICogQGZ1bmN0aW9uXHJcbiAqL1xyXG5leHBvcnQgdmFyIHN1YiA9IHN1YnRyYWN0O1xyXG5cclxuLyoqXHJcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjNC5tdWx0aXBseX1cclxuICogQGZ1bmN0aW9uXHJcbiAqL1xyXG5leHBvcnQgdmFyIG11bCA9IG11bHRpcGx5O1xyXG5cclxuLyoqXHJcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjNC5kaXZpZGV9XHJcbiAqIEBmdW5jdGlvblxyXG4gKi9cclxuZXhwb3J0IHZhciBkaXYgPSBkaXZpZGU7XHJcblxyXG4vKipcclxuICogQWxpYXMgZm9yIHtAbGluayB2ZWM0LmRpc3RhbmNlfVxyXG4gKiBAZnVuY3Rpb25cclxuICovXHJcbmV4cG9ydCB2YXIgZGlzdCA9IGRpc3RhbmNlO1xyXG5cclxuLyoqXHJcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjNC5zcXVhcmVkRGlzdGFuY2V9XHJcbiAqIEBmdW5jdGlvblxyXG4gKi9cclxuZXhwb3J0IHZhciBzcXJEaXN0ID0gc3F1YXJlZERpc3RhbmNlO1xyXG5cclxuLyoqXHJcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjNC5sZW5ndGh9XHJcbiAqIEBmdW5jdGlvblxyXG4gKi9cclxuZXhwb3J0IHZhciBsZW4gPSBsZW5ndGg7XHJcblxyXG4vKipcclxuICogQWxpYXMgZm9yIHtAbGluayB2ZWM0LnNxdWFyZWRMZW5ndGh9XHJcbiAqIEBmdW5jdGlvblxyXG4gKi9cclxuZXhwb3J0IHZhciBzcXJMZW4gPSBzcXVhcmVkTGVuZ3RoO1xyXG5cclxuLyoqXHJcbiAqIFBlcmZvcm0gc29tZSBvcGVyYXRpb24gb3ZlciBhbiBhcnJheSBvZiB2ZWM0cy5cclxuICpcclxuICogQHBhcmFtIHtBcnJheX0gYSB0aGUgYXJyYXkgb2YgdmVjdG9ycyB0byBpdGVyYXRlIG92ZXJcclxuICogQHBhcmFtIHtOdW1iZXJ9IHN0cmlkZSBOdW1iZXIgb2YgZWxlbWVudHMgYmV0d2VlbiB0aGUgc3RhcnQgb2YgZWFjaCB2ZWM0LiBJZiAwIGFzc3VtZXMgdGlnaHRseSBwYWNrZWRcclxuICogQHBhcmFtIHtOdW1iZXJ9IG9mZnNldCBOdW1iZXIgb2YgZWxlbWVudHMgdG8gc2tpcCBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBhcnJheVxyXG4gKiBAcGFyYW0ge051bWJlcn0gY291bnQgTnVtYmVyIG9mIHZlYzRzIHRvIGl0ZXJhdGUgb3Zlci4gSWYgMCBpdGVyYXRlcyBvdmVyIGVudGlyZSBhcnJheVxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBGdW5jdGlvbiB0byBjYWxsIGZvciBlYWNoIHZlY3RvciBpbiB0aGUgYXJyYXlcclxuICogQHBhcmFtIHtPYmplY3R9IFthcmddIGFkZGl0aW9uYWwgYXJndW1lbnQgdG8gcGFzcyB0byBmblxyXG4gKiBAcmV0dXJucyB7QXJyYXl9IGFcclxuICogQGZ1bmN0aW9uXHJcbiAqL1xyXG5leHBvcnQgdmFyIGZvckVhY2ggPSBmdW5jdGlvbiAoKSB7XHJcbiAgdmFyIHZlYyA9IGNyZWF0ZSgpO1xyXG5cclxuICByZXR1cm4gZnVuY3Rpb24gKGEsIHN0cmlkZSwgb2Zmc2V0LCBjb3VudCwgZm4sIGFyZykge1xyXG4gICAgdmFyIGkgPSB2b2lkIDAsXHJcbiAgICAgICAgbCA9IHZvaWQgMDtcclxuICAgIGlmICghc3RyaWRlKSB7XHJcbiAgICAgIHN0cmlkZSA9IDQ7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFvZmZzZXQpIHtcclxuICAgICAgb2Zmc2V0ID0gMDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoY291bnQpIHtcclxuICAgICAgbCA9IE1hdGgubWluKGNvdW50ICogc3RyaWRlICsgb2Zmc2V0LCBhLmxlbmd0aCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBsID0gYS5sZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yIChpID0gb2Zmc2V0OyBpIDwgbDsgaSArPSBzdHJpZGUpIHtcclxuICAgICAgdmVjWzBdID0gYVtpXTt2ZWNbMV0gPSBhW2kgKyAxXTt2ZWNbMl0gPSBhW2kgKyAyXTt2ZWNbM10gPSBhW2kgKyAzXTtcclxuICAgICAgZm4odmVjLCB2ZWMsIGFyZyk7XHJcbiAgICAgIGFbaV0gPSB2ZWNbMF07YVtpICsgMV0gPSB2ZWNbMV07YVtpICsgMl0gPSB2ZWNbMl07YVtpICsgM10gPSB2ZWNbM107XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGE7XHJcbiAgfTtcclxufSgpOyIsImltcG9ydCAqIGFzIGdsTWF0cml4IGZyb20gXCIuL2NvbW1vbi5qc1wiO1xyXG5pbXBvcnQgKiBhcyBtYXQzIGZyb20gXCIuL21hdDMuanNcIjtcclxuaW1wb3J0ICogYXMgdmVjMyBmcm9tIFwiLi92ZWMzLmpzXCI7XHJcbmltcG9ydCAqIGFzIHZlYzQgZnJvbSBcIi4vdmVjNC5qc1wiO1xyXG5cclxuLyoqXHJcbiAqIFF1YXRlcm5pb25cclxuICogQG1vZHVsZSBxdWF0XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBuZXcgaWRlbnRpdHkgcXVhdFxyXG4gKlxyXG4gKiBAcmV0dXJucyB7cXVhdH0gYSBuZXcgcXVhdGVybmlvblxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZSgpIHtcclxuICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoNCk7XHJcbiAgaWYgKGdsTWF0cml4LkFSUkFZX1RZUEUgIT0gRmxvYXQzMkFycmF5KSB7XHJcbiAgICBvdXRbMF0gPSAwO1xyXG4gICAgb3V0WzFdID0gMDtcclxuICAgIG91dFsyXSA9IDA7XHJcbiAgfVxyXG4gIG91dFszXSA9IDE7XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNldCBhIHF1YXQgdG8gdGhlIGlkZW50aXR5IHF1YXRlcm5pb25cclxuICpcclxuICogQHBhcmFtIHtxdWF0fSBvdXQgdGhlIHJlY2VpdmluZyBxdWF0ZXJuaW9uXHJcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpZGVudGl0eShvdXQpIHtcclxuICBvdXRbMF0gPSAwO1xyXG4gIG91dFsxXSA9IDA7XHJcbiAgb3V0WzJdID0gMDtcclxuICBvdXRbM10gPSAxO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXRzIGEgcXVhdCBmcm9tIHRoZSBnaXZlbiBhbmdsZSBhbmQgcm90YXRpb24gYXhpcyxcclxuICogdGhlbiByZXR1cm5zIGl0LlxyXG4gKlxyXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cclxuICogQHBhcmFtIHt2ZWMzfSBheGlzIHRoZSBheGlzIGFyb3VuZCB3aGljaCB0byByb3RhdGVcclxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZCB0aGUgYW5nbGUgaW4gcmFkaWFuc1xyXG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XHJcbiAqKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHNldEF4aXNBbmdsZShvdXQsIGF4aXMsIHJhZCkge1xyXG4gIHJhZCA9IHJhZCAqIDAuNTtcclxuICB2YXIgcyA9IE1hdGguc2luKHJhZCk7XHJcbiAgb3V0WzBdID0gcyAqIGF4aXNbMF07XHJcbiAgb3V0WzFdID0gcyAqIGF4aXNbMV07XHJcbiAgb3V0WzJdID0gcyAqIGF4aXNbMl07XHJcbiAgb3V0WzNdID0gTWF0aC5jb3MocmFkKTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgcm90YXRpb24gYXhpcyBhbmQgYW5nbGUgZm9yIGEgZ2l2ZW5cclxuICogIHF1YXRlcm5pb24uIElmIGEgcXVhdGVybmlvbiBpcyBjcmVhdGVkIHdpdGhcclxuICogIHNldEF4aXNBbmdsZSwgdGhpcyBtZXRob2Qgd2lsbCByZXR1cm4gdGhlIHNhbWVcclxuICogIHZhbHVlcyBhcyBwcm92aWRpZWQgaW4gdGhlIG9yaWdpbmFsIHBhcmFtZXRlciBsaXN0XHJcbiAqICBPUiBmdW5jdGlvbmFsbHkgZXF1aXZhbGVudCB2YWx1ZXMuXHJcbiAqIEV4YW1wbGU6IFRoZSBxdWF0ZXJuaW9uIGZvcm1lZCBieSBheGlzIFswLCAwLCAxXSBhbmRcclxuICogIGFuZ2xlIC05MCBpcyB0aGUgc2FtZSBhcyB0aGUgcXVhdGVybmlvbiBmb3JtZWQgYnlcclxuICogIFswLCAwLCAxXSBhbmQgMjcwLiBUaGlzIG1ldGhvZCBmYXZvcnMgdGhlIGxhdHRlci5cclxuICogQHBhcmFtICB7dmVjM30gb3V0X2F4aXMgIFZlY3RvciByZWNlaXZpbmcgdGhlIGF4aXMgb2Ygcm90YXRpb25cclxuICogQHBhcmFtICB7cXVhdH0gcSAgICAgUXVhdGVybmlvbiB0byBiZSBkZWNvbXBvc2VkXHJcbiAqIEByZXR1cm4ge051bWJlcn0gICAgIEFuZ2xlLCBpbiByYWRpYW5zLCBvZiB0aGUgcm90YXRpb25cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRBeGlzQW5nbGUob3V0X2F4aXMsIHEpIHtcclxuICB2YXIgcmFkID0gTWF0aC5hY29zKHFbM10pICogMi4wO1xyXG4gIHZhciBzID0gTWF0aC5zaW4ocmFkIC8gMi4wKTtcclxuICBpZiAocyA+IGdsTWF0cml4LkVQU0lMT04pIHtcclxuICAgIG91dF9heGlzWzBdID0gcVswXSAvIHM7XHJcbiAgICBvdXRfYXhpc1sxXSA9IHFbMV0gLyBzO1xyXG4gICAgb3V0X2F4aXNbMl0gPSBxWzJdIC8gcztcclxuICB9IGVsc2Uge1xyXG4gICAgLy8gSWYgcyBpcyB6ZXJvLCByZXR1cm4gYW55IGF4aXMgKG5vIHJvdGF0aW9uIC0gYXhpcyBkb2VzIG5vdCBtYXR0ZXIpXHJcbiAgICBvdXRfYXhpc1swXSA9IDE7XHJcbiAgICBvdXRfYXhpc1sxXSA9IDA7XHJcbiAgICBvdXRfYXhpc1syXSA9IDA7XHJcbiAgfVxyXG4gIHJldHVybiByYWQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBNdWx0aXBsaWVzIHR3byBxdWF0J3NcclxuICpcclxuICogQHBhcmFtIHtxdWF0fSBvdXQgdGhlIHJlY2VpdmluZyBxdWF0ZXJuaW9uXHJcbiAqIEBwYXJhbSB7cXVhdH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxyXG4gKiBAcGFyYW0ge3F1YXR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXHJcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBtdWx0aXBseShvdXQsIGEsIGIpIHtcclxuICB2YXIgYXggPSBhWzBdLFxyXG4gICAgICBheSA9IGFbMV0sXHJcbiAgICAgIGF6ID0gYVsyXSxcclxuICAgICAgYXcgPSBhWzNdO1xyXG4gIHZhciBieCA9IGJbMF0sXHJcbiAgICAgIGJ5ID0gYlsxXSxcclxuICAgICAgYnogPSBiWzJdLFxyXG4gICAgICBidyA9IGJbM107XHJcblxyXG4gIG91dFswXSA9IGF4ICogYncgKyBhdyAqIGJ4ICsgYXkgKiBieiAtIGF6ICogYnk7XHJcbiAgb3V0WzFdID0gYXkgKiBidyArIGF3ICogYnkgKyBheiAqIGJ4IC0gYXggKiBiejtcclxuICBvdXRbMl0gPSBheiAqIGJ3ICsgYXcgKiBieiArIGF4ICogYnkgLSBheSAqIGJ4O1xyXG4gIG91dFszXSA9IGF3ICogYncgLSBheCAqIGJ4IC0gYXkgKiBieSAtIGF6ICogYno7XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJvdGF0ZXMgYSBxdWF0ZXJuaW9uIGJ5IHRoZSBnaXZlbiBhbmdsZSBhYm91dCB0aGUgWCBheGlzXHJcbiAqXHJcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHF1YXQgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcclxuICogQHBhcmFtIHtxdWF0fSBhIHF1YXQgdG8gcm90YXRlXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSByYWQgYW5nbGUgKGluIHJhZGlhbnMpIHRvIHJvdGF0ZVxyXG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcm90YXRlWChvdXQsIGEsIHJhZCkge1xyXG4gIHJhZCAqPSAwLjU7XHJcblxyXG4gIHZhciBheCA9IGFbMF0sXHJcbiAgICAgIGF5ID0gYVsxXSxcclxuICAgICAgYXogPSBhWzJdLFxyXG4gICAgICBhdyA9IGFbM107XHJcbiAgdmFyIGJ4ID0gTWF0aC5zaW4ocmFkKSxcclxuICAgICAgYncgPSBNYXRoLmNvcyhyYWQpO1xyXG5cclxuICBvdXRbMF0gPSBheCAqIGJ3ICsgYXcgKiBieDtcclxuICBvdXRbMV0gPSBheSAqIGJ3ICsgYXogKiBieDtcclxuICBvdXRbMl0gPSBheiAqIGJ3IC0gYXkgKiBieDtcclxuICBvdXRbM10gPSBhdyAqIGJ3IC0gYXggKiBieDtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogUm90YXRlcyBhIHF1YXRlcm5pb24gYnkgdGhlIGdpdmVuIGFuZ2xlIGFib3V0IHRoZSBZIGF4aXNcclxuICpcclxuICogQHBhcmFtIHtxdWF0fSBvdXQgcXVhdCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxyXG4gKiBAcGFyYW0ge3F1YXR9IGEgcXVhdCB0byByb3RhdGVcclxuICogQHBhcmFtIHtudW1iZXJ9IHJhZCBhbmdsZSAoaW4gcmFkaWFucykgdG8gcm90YXRlXHJcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiByb3RhdGVZKG91dCwgYSwgcmFkKSB7XHJcbiAgcmFkICo9IDAuNTtcclxuXHJcbiAgdmFyIGF4ID0gYVswXSxcclxuICAgICAgYXkgPSBhWzFdLFxyXG4gICAgICBheiA9IGFbMl0sXHJcbiAgICAgIGF3ID0gYVszXTtcclxuICB2YXIgYnkgPSBNYXRoLnNpbihyYWQpLFxyXG4gICAgICBidyA9IE1hdGguY29zKHJhZCk7XHJcblxyXG4gIG91dFswXSA9IGF4ICogYncgLSBheiAqIGJ5O1xyXG4gIG91dFsxXSA9IGF5ICogYncgKyBhdyAqIGJ5O1xyXG4gIG91dFsyXSA9IGF6ICogYncgKyBheCAqIGJ5O1xyXG4gIG91dFszXSA9IGF3ICogYncgLSBheSAqIGJ5O1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSb3RhdGVzIGEgcXVhdGVybmlvbiBieSB0aGUgZ2l2ZW4gYW5nbGUgYWJvdXQgdGhlIFogYXhpc1xyXG4gKlxyXG4gKiBAcGFyYW0ge3F1YXR9IG91dCBxdWF0IHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XHJcbiAqIEBwYXJhbSB7cXVhdH0gYSBxdWF0IHRvIHJvdGF0ZVxyXG4gKiBAcGFyYW0ge251bWJlcn0gcmFkIGFuZ2xlIChpbiByYWRpYW5zKSB0byByb3RhdGVcclxuICogQHJldHVybnMge3F1YXR9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHJvdGF0ZVoob3V0LCBhLCByYWQpIHtcclxuICByYWQgKj0gMC41O1xyXG5cclxuICB2YXIgYXggPSBhWzBdLFxyXG4gICAgICBheSA9IGFbMV0sXHJcbiAgICAgIGF6ID0gYVsyXSxcclxuICAgICAgYXcgPSBhWzNdO1xyXG4gIHZhciBieiA9IE1hdGguc2luKHJhZCksXHJcbiAgICAgIGJ3ID0gTWF0aC5jb3MocmFkKTtcclxuXHJcbiAgb3V0WzBdID0gYXggKiBidyArIGF5ICogYno7XHJcbiAgb3V0WzFdID0gYXkgKiBidyAtIGF4ICogYno7XHJcbiAgb3V0WzJdID0gYXogKiBidyArIGF3ICogYno7XHJcbiAgb3V0WzNdID0gYXcgKiBidyAtIGF6ICogYno7XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIENhbGN1bGF0ZXMgdGhlIFcgY29tcG9uZW50IG9mIGEgcXVhdCBmcm9tIHRoZSBYLCBZLCBhbmQgWiBjb21wb25lbnRzLlxyXG4gKiBBc3N1bWVzIHRoYXQgcXVhdGVybmlvbiBpcyAxIHVuaXQgaW4gbGVuZ3RoLlxyXG4gKiBBbnkgZXhpc3RpbmcgVyBjb21wb25lbnQgd2lsbCBiZSBpZ25vcmVkLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cclxuICogQHBhcmFtIHtxdWF0fSBhIHF1YXQgdG8gY2FsY3VsYXRlIFcgY29tcG9uZW50IG9mXHJcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjYWxjdWxhdGVXKG91dCwgYSkge1xyXG4gIHZhciB4ID0gYVswXSxcclxuICAgICAgeSA9IGFbMV0sXHJcbiAgICAgIHogPSBhWzJdO1xyXG5cclxuICBvdXRbMF0gPSB4O1xyXG4gIG91dFsxXSA9IHk7XHJcbiAgb3V0WzJdID0gejtcclxuICBvdXRbM10gPSBNYXRoLnNxcnQoTWF0aC5hYnMoMS4wIC0geCAqIHggLSB5ICogeSAtIHogKiB6KSk7XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFBlcmZvcm1zIGEgc3BoZXJpY2FsIGxpbmVhciBpbnRlcnBvbGF0aW9uIGJldHdlZW4gdHdvIHF1YXRcclxuICpcclxuICogQHBhcmFtIHtxdWF0fSBvdXQgdGhlIHJlY2VpdmluZyBxdWF0ZXJuaW9uXHJcbiAqIEBwYXJhbSB7cXVhdH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxyXG4gKiBAcGFyYW0ge3F1YXR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSB0IGludGVycG9sYXRpb24gYW1vdW50LCBpbiB0aGUgcmFuZ2UgWzAtMV0sIGJldHdlZW4gdGhlIHR3byBpbnB1dHNcclxuICogQHJldHVybnMge3F1YXR9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHNsZXJwKG91dCwgYSwgYiwgdCkge1xyXG4gIC8vIGJlbmNobWFya3M6XHJcbiAgLy8gICAgaHR0cDovL2pzcGVyZi5jb20vcXVhdGVybmlvbi1zbGVycC1pbXBsZW1lbnRhdGlvbnNcclxuICB2YXIgYXggPSBhWzBdLFxyXG4gICAgICBheSA9IGFbMV0sXHJcbiAgICAgIGF6ID0gYVsyXSxcclxuICAgICAgYXcgPSBhWzNdO1xyXG4gIHZhciBieCA9IGJbMF0sXHJcbiAgICAgIGJ5ID0gYlsxXSxcclxuICAgICAgYnogPSBiWzJdLFxyXG4gICAgICBidyA9IGJbM107XHJcblxyXG4gIHZhciBvbWVnYSA9IHZvaWQgMCxcclxuICAgICAgY29zb20gPSB2b2lkIDAsXHJcbiAgICAgIHNpbm9tID0gdm9pZCAwLFxyXG4gICAgICBzY2FsZTAgPSB2b2lkIDAsXHJcbiAgICAgIHNjYWxlMSA9IHZvaWQgMDtcclxuXHJcbiAgLy8gY2FsYyBjb3NpbmVcclxuICBjb3NvbSA9IGF4ICogYnggKyBheSAqIGJ5ICsgYXogKiBieiArIGF3ICogYnc7XHJcbiAgLy8gYWRqdXN0IHNpZ25zIChpZiBuZWNlc3NhcnkpXHJcbiAgaWYgKGNvc29tIDwgMC4wKSB7XHJcbiAgICBjb3NvbSA9IC1jb3NvbTtcclxuICAgIGJ4ID0gLWJ4O1xyXG4gICAgYnkgPSAtYnk7XHJcbiAgICBieiA9IC1iejtcclxuICAgIGJ3ID0gLWJ3O1xyXG4gIH1cclxuICAvLyBjYWxjdWxhdGUgY29lZmZpY2llbnRzXHJcbiAgaWYgKDEuMCAtIGNvc29tID4gZ2xNYXRyaXguRVBTSUxPTikge1xyXG4gICAgLy8gc3RhbmRhcmQgY2FzZSAoc2xlcnApXHJcbiAgICBvbWVnYSA9IE1hdGguYWNvcyhjb3NvbSk7XHJcbiAgICBzaW5vbSA9IE1hdGguc2luKG9tZWdhKTtcclxuICAgIHNjYWxlMCA9IE1hdGguc2luKCgxLjAgLSB0KSAqIG9tZWdhKSAvIHNpbm9tO1xyXG4gICAgc2NhbGUxID0gTWF0aC5zaW4odCAqIG9tZWdhKSAvIHNpbm9tO1xyXG4gIH0gZWxzZSB7XHJcbiAgICAvLyBcImZyb21cIiBhbmQgXCJ0b1wiIHF1YXRlcm5pb25zIGFyZSB2ZXJ5IGNsb3NlXHJcbiAgICAvLyAgLi4uIHNvIHdlIGNhbiBkbyBhIGxpbmVhciBpbnRlcnBvbGF0aW9uXHJcbiAgICBzY2FsZTAgPSAxLjAgLSB0O1xyXG4gICAgc2NhbGUxID0gdDtcclxuICB9XHJcbiAgLy8gY2FsY3VsYXRlIGZpbmFsIHZhbHVlc1xyXG4gIG91dFswXSA9IHNjYWxlMCAqIGF4ICsgc2NhbGUxICogYng7XHJcbiAgb3V0WzFdID0gc2NhbGUwICogYXkgKyBzY2FsZTEgKiBieTtcclxuICBvdXRbMl0gPSBzY2FsZTAgKiBheiArIHNjYWxlMSAqIGJ6O1xyXG4gIG91dFszXSA9IHNjYWxlMCAqIGF3ICsgc2NhbGUxICogYnc7XHJcblxyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZW5lcmF0ZXMgYSByYW5kb20gcXVhdGVybmlvblxyXG4gKlxyXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cclxuICogQHJldHVybnMge3F1YXR9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbShvdXQpIHtcclxuICAvLyBJbXBsZW1lbnRhdGlvbiBvZiBodHRwOi8vcGxhbm5pbmcuY3MudWl1Yy5lZHUvbm9kZTE5OC5odG1sXHJcbiAgLy8gVE9ETzogQ2FsbGluZyByYW5kb20gMyB0aW1lcyBpcyBwcm9iYWJseSBub3QgdGhlIGZhc3Rlc3Qgc29sdXRpb25cclxuICB2YXIgdTEgPSBnbE1hdHJpeC5SQU5ET00oKTtcclxuICB2YXIgdTIgPSBnbE1hdHJpeC5SQU5ET00oKTtcclxuICB2YXIgdTMgPSBnbE1hdHJpeC5SQU5ET00oKTtcclxuXHJcbiAgdmFyIHNxcnQxTWludXNVMSA9IE1hdGguc3FydCgxIC0gdTEpO1xyXG4gIHZhciBzcXJ0VTEgPSBNYXRoLnNxcnQodTEpO1xyXG5cclxuICBvdXRbMF0gPSBzcXJ0MU1pbnVzVTEgKiBNYXRoLnNpbigyLjAgKiBNYXRoLlBJICogdTIpO1xyXG4gIG91dFsxXSA9IHNxcnQxTWludXNVMSAqIE1hdGguY29zKDIuMCAqIE1hdGguUEkgKiB1Mik7XHJcbiAgb3V0WzJdID0gc3FydFUxICogTWF0aC5zaW4oMi4wICogTWF0aC5QSSAqIHUzKTtcclxuICBvdXRbM10gPSBzcXJ0VTEgKiBNYXRoLmNvcygyLjAgKiBNYXRoLlBJICogdTMpO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDYWxjdWxhdGVzIHRoZSBpbnZlcnNlIG9mIGEgcXVhdFxyXG4gKlxyXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cclxuICogQHBhcmFtIHtxdWF0fSBhIHF1YXQgdG8gY2FsY3VsYXRlIGludmVyc2Ugb2ZcclxuICogQHJldHVybnMge3F1YXR9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGludmVydChvdXQsIGEpIHtcclxuICB2YXIgYTAgPSBhWzBdLFxyXG4gICAgICBhMSA9IGFbMV0sXHJcbiAgICAgIGEyID0gYVsyXSxcclxuICAgICAgYTMgPSBhWzNdO1xyXG4gIHZhciBkb3QgPSBhMCAqIGEwICsgYTEgKiBhMSArIGEyICogYTIgKyBhMyAqIGEzO1xyXG4gIHZhciBpbnZEb3QgPSBkb3QgPyAxLjAgLyBkb3QgOiAwO1xyXG5cclxuICAvLyBUT0RPOiBXb3VsZCBiZSBmYXN0ZXIgdG8gcmV0dXJuIFswLDAsMCwwXSBpbW1lZGlhdGVseSBpZiBkb3QgPT0gMFxyXG5cclxuICBvdXRbMF0gPSAtYTAgKiBpbnZEb3Q7XHJcbiAgb3V0WzFdID0gLWExICogaW52RG90O1xyXG4gIG91dFsyXSA9IC1hMiAqIGludkRvdDtcclxuICBvdXRbM10gPSBhMyAqIGludkRvdDtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogQ2FsY3VsYXRlcyB0aGUgY29uanVnYXRlIG9mIGEgcXVhdFxyXG4gKiBJZiB0aGUgcXVhdGVybmlvbiBpcyBub3JtYWxpemVkLCB0aGlzIGZ1bmN0aW9uIGlzIGZhc3RlciB0aGFuIHF1YXQuaW52ZXJzZSBhbmQgcHJvZHVjZXMgdGhlIHNhbWUgcmVzdWx0LlxyXG4gKlxyXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cclxuICogQHBhcmFtIHtxdWF0fSBhIHF1YXQgdG8gY2FsY3VsYXRlIGNvbmp1Z2F0ZSBvZlxyXG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY29uanVnYXRlKG91dCwgYSkge1xyXG4gIG91dFswXSA9IC1hWzBdO1xyXG4gIG91dFsxXSA9IC1hWzFdO1xyXG4gIG91dFsyXSA9IC1hWzJdO1xyXG4gIG91dFszXSA9IGFbM107XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBxdWF0ZXJuaW9uIGZyb20gdGhlIGdpdmVuIDN4MyByb3RhdGlvbiBtYXRyaXguXHJcbiAqXHJcbiAqIE5PVEU6IFRoZSByZXN1bHRhbnQgcXVhdGVybmlvbiBpcyBub3Qgbm9ybWFsaXplZCwgc28geW91IHNob3VsZCBiZSBzdXJlXHJcbiAqIHRvIHJlbm9ybWFsaXplIHRoZSBxdWF0ZXJuaW9uIHlvdXJzZWxmIHdoZXJlIG5lY2Vzc2FyeS5cclxuICpcclxuICogQHBhcmFtIHtxdWF0fSBvdXQgdGhlIHJlY2VpdmluZyBxdWF0ZXJuaW9uXHJcbiAqIEBwYXJhbSB7bWF0M30gbSByb3RhdGlvbiBtYXRyaXhcclxuICogQHJldHVybnMge3F1YXR9IG91dFxyXG4gKiBAZnVuY3Rpb25cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBmcm9tTWF0MyhvdXQsIG0pIHtcclxuICAvLyBBbGdvcml0aG0gaW4gS2VuIFNob2VtYWtlJ3MgYXJ0aWNsZSBpbiAxOTg3IFNJR0dSQVBIIGNvdXJzZSBub3Rlc1xyXG4gIC8vIGFydGljbGUgXCJRdWF0ZXJuaW9uIENhbGN1bHVzIGFuZCBGYXN0IEFuaW1hdGlvblwiLlxyXG4gIHZhciBmVHJhY2UgPSBtWzBdICsgbVs0XSArIG1bOF07XHJcbiAgdmFyIGZSb290ID0gdm9pZCAwO1xyXG5cclxuICBpZiAoZlRyYWNlID4gMC4wKSB7XHJcbiAgICAvLyB8d3wgPiAxLzIsIG1heSBhcyB3ZWxsIGNob29zZSB3ID4gMS8yXHJcbiAgICBmUm9vdCA9IE1hdGguc3FydChmVHJhY2UgKyAxLjApOyAvLyAyd1xyXG4gICAgb3V0WzNdID0gMC41ICogZlJvb3Q7XHJcbiAgICBmUm9vdCA9IDAuNSAvIGZSb290OyAvLyAxLyg0dylcclxuICAgIG91dFswXSA9IChtWzVdIC0gbVs3XSkgKiBmUm9vdDtcclxuICAgIG91dFsxXSA9IChtWzZdIC0gbVsyXSkgKiBmUm9vdDtcclxuICAgIG91dFsyXSA9IChtWzFdIC0gbVszXSkgKiBmUm9vdDtcclxuICB9IGVsc2Uge1xyXG4gICAgLy8gfHd8IDw9IDEvMlxyXG4gICAgdmFyIGkgPSAwO1xyXG4gICAgaWYgKG1bNF0gPiBtWzBdKSBpID0gMTtcclxuICAgIGlmIChtWzhdID4gbVtpICogMyArIGldKSBpID0gMjtcclxuICAgIHZhciBqID0gKGkgKyAxKSAlIDM7XHJcbiAgICB2YXIgayA9IChpICsgMikgJSAzO1xyXG5cclxuICAgIGZSb290ID0gTWF0aC5zcXJ0KG1baSAqIDMgKyBpXSAtIG1baiAqIDMgKyBqXSAtIG1bayAqIDMgKyBrXSArIDEuMCk7XHJcbiAgICBvdXRbaV0gPSAwLjUgKiBmUm9vdDtcclxuICAgIGZSb290ID0gMC41IC8gZlJvb3Q7XHJcbiAgICBvdXRbM10gPSAobVtqICogMyArIGtdIC0gbVtrICogMyArIGpdKSAqIGZSb290O1xyXG4gICAgb3V0W2pdID0gKG1baiAqIDMgKyBpXSArIG1baSAqIDMgKyBqXSkgKiBmUm9vdDtcclxuICAgIG91dFtrXSA9IChtW2sgKiAzICsgaV0gKyBtW2kgKiAzICsga10pICogZlJvb3Q7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIHF1YXRlcm5pb24gZnJvbSB0aGUgZ2l2ZW4gZXVsZXIgYW5nbGUgeCwgeSwgei5cclxuICpcclxuICogQHBhcmFtIHtxdWF0fSBvdXQgdGhlIHJlY2VpdmluZyBxdWF0ZXJuaW9uXHJcbiAqIEBwYXJhbSB7eH0gQW5nbGUgdG8gcm90YXRlIGFyb3VuZCBYIGF4aXMgaW4gZGVncmVlcy5cclxuICogQHBhcmFtIHt5fSBBbmdsZSB0byByb3RhdGUgYXJvdW5kIFkgYXhpcyBpbiBkZWdyZWVzLlxyXG4gKiBAcGFyYW0ge3p9IEFuZ2xlIHRvIHJvdGF0ZSBhcm91bmQgWiBheGlzIGluIGRlZ3JlZXMuXHJcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcclxuICogQGZ1bmN0aW9uXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZnJvbUV1bGVyKG91dCwgeCwgeSwgeikge1xyXG4gIHZhciBoYWxmVG9SYWQgPSAwLjUgKiBNYXRoLlBJIC8gMTgwLjA7XHJcbiAgeCAqPSBoYWxmVG9SYWQ7XHJcbiAgeSAqPSBoYWxmVG9SYWQ7XHJcbiAgeiAqPSBoYWxmVG9SYWQ7XHJcblxyXG4gIHZhciBzeCA9IE1hdGguc2luKHgpO1xyXG4gIHZhciBjeCA9IE1hdGguY29zKHgpO1xyXG4gIHZhciBzeSA9IE1hdGguc2luKHkpO1xyXG4gIHZhciBjeSA9IE1hdGguY29zKHkpO1xyXG4gIHZhciBzeiA9IE1hdGguc2luKHopO1xyXG4gIHZhciBjeiA9IE1hdGguY29zKHopO1xyXG5cclxuICBvdXRbMF0gPSBzeCAqIGN5ICogY3ogLSBjeCAqIHN5ICogc3o7XHJcbiAgb3V0WzFdID0gY3ggKiBzeSAqIGN6ICsgc3ggKiBjeSAqIHN6O1xyXG4gIG91dFsyXSA9IGN4ICogY3kgKiBzeiAtIHN4ICogc3kgKiBjejtcclxuICBvdXRbM10gPSBjeCAqIGN5ICogY3ogKyBzeCAqIHN5ICogc3o7XHJcblxyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGEgcXVhdGVuaW9uXHJcbiAqXHJcbiAqIEBwYXJhbSB7cXVhdH0gYSB2ZWN0b3IgdG8gcmVwcmVzZW50IGFzIGEgc3RyaW5nXHJcbiAqIEByZXR1cm5zIHtTdHJpbmd9IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgdmVjdG9yXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gc3RyKGEpIHtcclxuICByZXR1cm4gJ3F1YXQoJyArIGFbMF0gKyAnLCAnICsgYVsxXSArICcsICcgKyBhWzJdICsgJywgJyArIGFbM10gKyAnKSc7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgbmV3IHF1YXQgaW5pdGlhbGl6ZWQgd2l0aCB2YWx1ZXMgZnJvbSBhbiBleGlzdGluZyBxdWF0ZXJuaW9uXHJcbiAqXHJcbiAqIEBwYXJhbSB7cXVhdH0gYSBxdWF0ZXJuaW9uIHRvIGNsb25lXHJcbiAqIEByZXR1cm5zIHtxdWF0fSBhIG5ldyBxdWF0ZXJuaW9uXHJcbiAqIEBmdW5jdGlvblxyXG4gKi9cclxuZXhwb3J0IHZhciBjbG9uZSA9IHZlYzQuY2xvbmU7XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIG5ldyBxdWF0IGluaXRpYWxpemVkIHdpdGggdGhlIGdpdmVuIHZhbHVlc1xyXG4gKlxyXG4gKiBAcGFyYW0ge051bWJlcn0geCBYIGNvbXBvbmVudFxyXG4gKiBAcGFyYW0ge051bWJlcn0geSBZIGNvbXBvbmVudFxyXG4gKiBAcGFyYW0ge051bWJlcn0geiBaIGNvbXBvbmVudFxyXG4gKiBAcGFyYW0ge051bWJlcn0gdyBXIGNvbXBvbmVudFxyXG4gKiBAcmV0dXJucyB7cXVhdH0gYSBuZXcgcXVhdGVybmlvblxyXG4gKiBAZnVuY3Rpb25cclxuICovXHJcbmV4cG9ydCB2YXIgZnJvbVZhbHVlcyA9IHZlYzQuZnJvbVZhbHVlcztcclxuXHJcbi8qKlxyXG4gKiBDb3B5IHRoZSB2YWx1ZXMgZnJvbSBvbmUgcXVhdCB0byBhbm90aGVyXHJcbiAqXHJcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHRoZSByZWNlaXZpbmcgcXVhdGVybmlvblxyXG4gKiBAcGFyYW0ge3F1YXR9IGEgdGhlIHNvdXJjZSBxdWF0ZXJuaW9uXHJcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcclxuICogQGZ1bmN0aW9uXHJcbiAqL1xyXG5leHBvcnQgdmFyIGNvcHkgPSB2ZWM0LmNvcHk7XHJcblxyXG4vKipcclxuICogU2V0IHRoZSBjb21wb25lbnRzIG9mIGEgcXVhdCB0byB0aGUgZ2l2ZW4gdmFsdWVzXHJcbiAqXHJcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHRoZSByZWNlaXZpbmcgcXVhdGVybmlvblxyXG4gKiBAcGFyYW0ge051bWJlcn0geCBYIGNvbXBvbmVudFxyXG4gKiBAcGFyYW0ge051bWJlcn0geSBZIGNvbXBvbmVudFxyXG4gKiBAcGFyYW0ge051bWJlcn0geiBaIGNvbXBvbmVudFxyXG4gKiBAcGFyYW0ge051bWJlcn0gdyBXIGNvbXBvbmVudFxyXG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XHJcbiAqIEBmdW5jdGlvblxyXG4gKi9cclxuZXhwb3J0IHZhciBzZXQgPSB2ZWM0LnNldDtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIHR3byBxdWF0J3NcclxuICpcclxuICogQHBhcmFtIHtxdWF0fSBvdXQgdGhlIHJlY2VpdmluZyBxdWF0ZXJuaW9uXHJcbiAqIEBwYXJhbSB7cXVhdH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxyXG4gKiBAcGFyYW0ge3F1YXR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXHJcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcclxuICogQGZ1bmN0aW9uXHJcbiAqL1xyXG5leHBvcnQgdmFyIGFkZCA9IHZlYzQuYWRkO1xyXG5cclxuLyoqXHJcbiAqIEFsaWFzIGZvciB7QGxpbmsgcXVhdC5tdWx0aXBseX1cclxuICogQGZ1bmN0aW9uXHJcbiAqL1xyXG5leHBvcnQgdmFyIG11bCA9IG11bHRpcGx5O1xyXG5cclxuLyoqXHJcbiAqIFNjYWxlcyBhIHF1YXQgYnkgYSBzY2FsYXIgbnVtYmVyXHJcbiAqXHJcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXHJcbiAqIEBwYXJhbSB7cXVhdH0gYSB0aGUgdmVjdG9yIHRvIHNjYWxlXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBiIGFtb3VudCB0byBzY2FsZSB0aGUgdmVjdG9yIGJ5XHJcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcclxuICogQGZ1bmN0aW9uXHJcbiAqL1xyXG5leHBvcnQgdmFyIHNjYWxlID0gdmVjNC5zY2FsZTtcclxuXHJcbi8qKlxyXG4gKiBDYWxjdWxhdGVzIHRoZSBkb3QgcHJvZHVjdCBvZiB0d28gcXVhdCdzXHJcbiAqXHJcbiAqIEBwYXJhbSB7cXVhdH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxyXG4gKiBAcGFyYW0ge3F1YXR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXHJcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IGRvdCBwcm9kdWN0IG9mIGEgYW5kIGJcclxuICogQGZ1bmN0aW9uXHJcbiAqL1xyXG5leHBvcnQgdmFyIGRvdCA9IHZlYzQuZG90O1xyXG5cclxuLyoqXHJcbiAqIFBlcmZvcm1zIGEgbGluZWFyIGludGVycG9sYXRpb24gYmV0d2VlbiB0d28gcXVhdCdzXHJcbiAqXHJcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHRoZSByZWNlaXZpbmcgcXVhdGVybmlvblxyXG4gKiBAcGFyYW0ge3F1YXR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcclxuICogQHBhcmFtIHtxdWF0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxyXG4gKiBAcGFyYW0ge051bWJlcn0gdCBpbnRlcnBvbGF0aW9uIGFtb3VudCwgaW4gdGhlIHJhbmdlIFswLTFdLCBiZXR3ZWVuIHRoZSB0d28gaW5wdXRzXHJcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcclxuICogQGZ1bmN0aW9uXHJcbiAqL1xyXG5leHBvcnQgdmFyIGxlcnAgPSB2ZWM0LmxlcnA7XHJcblxyXG4vKipcclxuICogQ2FsY3VsYXRlcyB0aGUgbGVuZ3RoIG9mIGEgcXVhdFxyXG4gKlxyXG4gKiBAcGFyYW0ge3F1YXR9IGEgdmVjdG9yIHRvIGNhbGN1bGF0ZSBsZW5ndGggb2ZcclxuICogQHJldHVybnMge051bWJlcn0gbGVuZ3RoIG9mIGFcclxuICovXHJcbmV4cG9ydCB2YXIgbGVuZ3RoID0gdmVjNC5sZW5ndGg7XHJcblxyXG4vKipcclxuICogQWxpYXMgZm9yIHtAbGluayBxdWF0Lmxlbmd0aH1cclxuICogQGZ1bmN0aW9uXHJcbiAqL1xyXG5leHBvcnQgdmFyIGxlbiA9IGxlbmd0aDtcclxuXHJcbi8qKlxyXG4gKiBDYWxjdWxhdGVzIHRoZSBzcXVhcmVkIGxlbmd0aCBvZiBhIHF1YXRcclxuICpcclxuICogQHBhcmFtIHtxdWF0fSBhIHZlY3RvciB0byBjYWxjdWxhdGUgc3F1YXJlZCBsZW5ndGggb2ZcclxuICogQHJldHVybnMge051bWJlcn0gc3F1YXJlZCBsZW5ndGggb2YgYVxyXG4gKiBAZnVuY3Rpb25cclxuICovXHJcbmV4cG9ydCB2YXIgc3F1YXJlZExlbmd0aCA9IHZlYzQuc3F1YXJlZExlbmd0aDtcclxuXHJcbi8qKlxyXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHF1YXQuc3F1YXJlZExlbmd0aH1cclxuICogQGZ1bmN0aW9uXHJcbiAqL1xyXG5leHBvcnQgdmFyIHNxckxlbiA9IHNxdWFyZWRMZW5ndGg7XHJcblxyXG4vKipcclxuICogTm9ybWFsaXplIGEgcXVhdFxyXG4gKlxyXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cclxuICogQHBhcmFtIHtxdWF0fSBhIHF1YXRlcm5pb24gdG8gbm9ybWFsaXplXHJcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcclxuICogQGZ1bmN0aW9uXHJcbiAqL1xyXG5leHBvcnQgdmFyIG5vcm1hbGl6ZSA9IHZlYzQubm9ybWFsaXplO1xyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgd2hldGhlciBvciBub3QgdGhlIHF1YXRlcm5pb25zIGhhdmUgZXhhY3RseSB0aGUgc2FtZSBlbGVtZW50cyBpbiB0aGUgc2FtZSBwb3NpdGlvbiAod2hlbiBjb21wYXJlZCB3aXRoID09PSlcclxuICpcclxuICogQHBhcmFtIHtxdWF0fSBhIFRoZSBmaXJzdCBxdWF0ZXJuaW9uLlxyXG4gKiBAcGFyYW0ge3F1YXR9IGIgVGhlIHNlY29uZCBxdWF0ZXJuaW9uLlxyXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gVHJ1ZSBpZiB0aGUgdmVjdG9ycyBhcmUgZXF1YWwsIGZhbHNlIG90aGVyd2lzZS5cclxuICovXHJcbmV4cG9ydCB2YXIgZXhhY3RFcXVhbHMgPSB2ZWM0LmV4YWN0RXF1YWxzO1xyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgd2hldGhlciBvciBub3QgdGhlIHF1YXRlcm5pb25zIGhhdmUgYXBwcm94aW1hdGVseSB0aGUgc2FtZSBlbGVtZW50cyBpbiB0aGUgc2FtZSBwb3NpdGlvbi5cclxuICpcclxuICogQHBhcmFtIHtxdWF0fSBhIFRoZSBmaXJzdCB2ZWN0b3IuXHJcbiAqIEBwYXJhbSB7cXVhdH0gYiBUaGUgc2Vjb25kIHZlY3Rvci5cclxuICogQHJldHVybnMge0Jvb2xlYW59IFRydWUgaWYgdGhlIHZlY3RvcnMgYXJlIGVxdWFsLCBmYWxzZSBvdGhlcndpc2UuXHJcbiAqL1xyXG5leHBvcnQgdmFyIGVxdWFscyA9IHZlYzQuZXF1YWxzO1xyXG5cclxuLyoqXHJcbiAqIFNldHMgYSBxdWF0ZXJuaW9uIHRvIHJlcHJlc2VudCB0aGUgc2hvcnRlc3Qgcm90YXRpb24gZnJvbSBvbmVcclxuICogdmVjdG9yIHRvIGFub3RoZXIuXHJcbiAqXHJcbiAqIEJvdGggdmVjdG9ycyBhcmUgYXNzdW1lZCB0byBiZSB1bml0IGxlbmd0aC5cclxuICpcclxuICogQHBhcmFtIHtxdWF0fSBvdXQgdGhlIHJlY2VpdmluZyBxdWF0ZXJuaW9uLlxyXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIGluaXRpYWwgdmVjdG9yXHJcbiAqIEBwYXJhbSB7dmVjM30gYiB0aGUgZGVzdGluYXRpb24gdmVjdG9yXHJcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcclxuICovXHJcbmV4cG9ydCB2YXIgcm90YXRpb25UbyA9IGZ1bmN0aW9uICgpIHtcclxuICB2YXIgdG1wdmVjMyA9IHZlYzMuY3JlYXRlKCk7XHJcbiAgdmFyIHhVbml0VmVjMyA9IHZlYzMuZnJvbVZhbHVlcygxLCAwLCAwKTtcclxuICB2YXIgeVVuaXRWZWMzID0gdmVjMy5mcm9tVmFsdWVzKDAsIDEsIDApO1xyXG5cclxuICByZXR1cm4gZnVuY3Rpb24gKG91dCwgYSwgYikge1xyXG4gICAgdmFyIGRvdCA9IHZlYzMuZG90KGEsIGIpO1xyXG4gICAgaWYgKGRvdCA8IC0wLjk5OTk5OSkge1xyXG4gICAgICB2ZWMzLmNyb3NzKHRtcHZlYzMsIHhVbml0VmVjMywgYSk7XHJcbiAgICAgIGlmICh2ZWMzLmxlbih0bXB2ZWMzKSA8IDAuMDAwMDAxKSB2ZWMzLmNyb3NzKHRtcHZlYzMsIHlVbml0VmVjMywgYSk7XHJcbiAgICAgIHZlYzMubm9ybWFsaXplKHRtcHZlYzMsIHRtcHZlYzMpO1xyXG4gICAgICBzZXRBeGlzQW5nbGUob3V0LCB0bXB2ZWMzLCBNYXRoLlBJKTtcclxuICAgICAgcmV0dXJuIG91dDtcclxuICAgIH0gZWxzZSBpZiAoZG90ID4gMC45OTk5OTkpIHtcclxuICAgICAgb3V0WzBdID0gMDtcclxuICAgICAgb3V0WzFdID0gMDtcclxuICAgICAgb3V0WzJdID0gMDtcclxuICAgICAgb3V0WzNdID0gMTtcclxuICAgICAgcmV0dXJuIG91dDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZlYzMuY3Jvc3ModG1wdmVjMywgYSwgYik7XHJcbiAgICAgIG91dFswXSA9IHRtcHZlYzNbMF07XHJcbiAgICAgIG91dFsxXSA9IHRtcHZlYzNbMV07XHJcbiAgICAgIG91dFsyXSA9IHRtcHZlYzNbMl07XHJcbiAgICAgIG91dFszXSA9IDEgKyBkb3Q7XHJcbiAgICAgIHJldHVybiBub3JtYWxpemUob3V0LCBvdXQpO1xyXG4gICAgfVxyXG4gIH07XHJcbn0oKTtcclxuXHJcbi8qKlxyXG4gKiBQZXJmb3JtcyBhIHNwaGVyaWNhbCBsaW5lYXIgaW50ZXJwb2xhdGlvbiB3aXRoIHR3byBjb250cm9sIHBvaW50c1xyXG4gKlxyXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cclxuICogQHBhcmFtIHtxdWF0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXHJcbiAqIEBwYXJhbSB7cXVhdH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcclxuICogQHBhcmFtIHtxdWF0fSBjIHRoZSB0aGlyZCBvcGVyYW5kXHJcbiAqIEBwYXJhbSB7cXVhdH0gZCB0aGUgZm91cnRoIG9wZXJhbmRcclxuICogQHBhcmFtIHtOdW1iZXJ9IHQgaW50ZXJwb2xhdGlvbiBhbW91bnQsIGluIHRoZSByYW5nZSBbMC0xXSwgYmV0d2VlbiB0aGUgdHdvIGlucHV0c1xyXG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XHJcbiAqL1xyXG5leHBvcnQgdmFyIHNxbGVycCA9IGZ1bmN0aW9uICgpIHtcclxuICB2YXIgdGVtcDEgPSBjcmVhdGUoKTtcclxuICB2YXIgdGVtcDIgPSBjcmVhdGUoKTtcclxuXHJcbiAgcmV0dXJuIGZ1bmN0aW9uIChvdXQsIGEsIGIsIGMsIGQsIHQpIHtcclxuICAgIHNsZXJwKHRlbXAxLCBhLCBkLCB0KTtcclxuICAgIHNsZXJwKHRlbXAyLCBiLCBjLCB0KTtcclxuICAgIHNsZXJwKG91dCwgdGVtcDEsIHRlbXAyLCAyICogdCAqICgxIC0gdCkpO1xyXG5cclxuICAgIHJldHVybiBvdXQ7XHJcbiAgfTtcclxufSgpO1xyXG5cclxuLyoqXHJcbiAqIFNldHMgdGhlIHNwZWNpZmllZCBxdWF0ZXJuaW9uIHdpdGggdmFsdWVzIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGdpdmVuXHJcbiAqIGF4ZXMuIEVhY2ggYXhpcyBpcyBhIHZlYzMgYW5kIGlzIGV4cGVjdGVkIHRvIGJlIHVuaXQgbGVuZ3RoIGFuZFxyXG4gKiBwZXJwZW5kaWN1bGFyIHRvIGFsbCBvdGhlciBzcGVjaWZpZWQgYXhlcy5cclxuICpcclxuICogQHBhcmFtIHt2ZWMzfSB2aWV3ICB0aGUgdmVjdG9yIHJlcHJlc2VudGluZyB0aGUgdmlld2luZyBkaXJlY3Rpb25cclxuICogQHBhcmFtIHt2ZWMzfSByaWdodCB0aGUgdmVjdG9yIHJlcHJlc2VudGluZyB0aGUgbG9jYWwgXCJyaWdodFwiIGRpcmVjdGlvblxyXG4gKiBAcGFyYW0ge3ZlYzN9IHVwICAgIHRoZSB2ZWN0b3IgcmVwcmVzZW50aW5nIHRoZSBsb2NhbCBcInVwXCIgZGlyZWN0aW9uXHJcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcclxuICovXHJcbmV4cG9ydCB2YXIgc2V0QXhlcyA9IGZ1bmN0aW9uICgpIHtcclxuICB2YXIgbWF0ciA9IG1hdDMuY3JlYXRlKCk7XHJcblxyXG4gIHJldHVybiBmdW5jdGlvbiAob3V0LCB2aWV3LCByaWdodCwgdXApIHtcclxuICAgIG1hdHJbMF0gPSByaWdodFswXTtcclxuICAgIG1hdHJbM10gPSByaWdodFsxXTtcclxuICAgIG1hdHJbNl0gPSByaWdodFsyXTtcclxuXHJcbiAgICBtYXRyWzFdID0gdXBbMF07XHJcbiAgICBtYXRyWzRdID0gdXBbMV07XHJcbiAgICBtYXRyWzddID0gdXBbMl07XHJcblxyXG4gICAgbWF0clsyXSA9IC12aWV3WzBdO1xyXG4gICAgbWF0cls1XSA9IC12aWV3WzFdO1xyXG4gICAgbWF0cls4XSA9IC12aWV3WzJdO1xyXG5cclxuICAgIHJldHVybiBub3JtYWxpemUob3V0LCBmcm9tTWF0MyhvdXQsIG1hdHIpKTtcclxuICB9O1xyXG59KCk7IiwiaW1wb3J0ICogYXMgZ2xNYXRyaXggZnJvbSBcIi4vY29tbW9uLmpzXCI7XHJcblxyXG4vKipcclxuICogMiBEaW1lbnNpb25hbCBWZWN0b3JcclxuICogQG1vZHVsZSB2ZWMyXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBuZXcsIGVtcHR5IHZlYzJcclxuICpcclxuICogQHJldHVybnMge3ZlYzJ9IGEgbmV3IDJEIHZlY3RvclxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZSgpIHtcclxuICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoMik7XHJcbiAgaWYgKGdsTWF0cml4LkFSUkFZX1RZUEUgIT0gRmxvYXQzMkFycmF5KSB7XHJcbiAgICBvdXRbMF0gPSAwO1xyXG4gICAgb3V0WzFdID0gMDtcclxuICB9XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBuZXcgdmVjMiBpbml0aWFsaXplZCB3aXRoIHZhbHVlcyBmcm9tIGFuIGV4aXN0aW5nIHZlY3RvclxyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdmVjdG9yIHRvIGNsb25lXHJcbiAqIEByZXR1cm5zIHt2ZWMyfSBhIG5ldyAyRCB2ZWN0b3JcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjbG9uZShhKSB7XHJcbiAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDIpO1xyXG4gIG91dFswXSA9IGFbMF07XHJcbiAgb3V0WzFdID0gYVsxXTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIG5ldyB2ZWMyIGluaXRpYWxpemVkIHdpdGggdGhlIGdpdmVuIHZhbHVlc1xyXG4gKlxyXG4gKiBAcGFyYW0ge051bWJlcn0geCBYIGNvbXBvbmVudFxyXG4gKiBAcGFyYW0ge051bWJlcn0geSBZIGNvbXBvbmVudFxyXG4gKiBAcmV0dXJucyB7dmVjMn0gYSBuZXcgMkQgdmVjdG9yXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZnJvbVZhbHVlcyh4LCB5KSB7XHJcbiAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDIpO1xyXG4gIG91dFswXSA9IHg7XHJcbiAgb3V0WzFdID0geTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogQ29weSB0aGUgdmFsdWVzIGZyb20gb25lIHZlYzIgdG8gYW5vdGhlclxyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIHNvdXJjZSB2ZWN0b3JcclxuICogQHJldHVybnMge3ZlYzJ9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNvcHkob3V0LCBhKSB7XHJcbiAgb3V0WzBdID0gYVswXTtcclxuICBvdXRbMV0gPSBhWzFdO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXQgdGhlIGNvbXBvbmVudHMgb2YgYSB2ZWMyIHRvIHRoZSBnaXZlbiB2YWx1ZXNcclxuICpcclxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcclxuICogQHBhcmFtIHtOdW1iZXJ9IHggWCBjb21wb25lbnRcclxuICogQHBhcmFtIHtOdW1iZXJ9IHkgWSBjb21wb25lbnRcclxuICogQHJldHVybnMge3ZlYzJ9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHNldChvdXQsIHgsIHkpIHtcclxuICBvdXRbMF0gPSB4O1xyXG4gIG91dFsxXSA9IHk7XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEFkZHMgdHdvIHZlYzInc1xyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcclxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxyXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gYWRkKG91dCwgYSwgYikge1xyXG4gIG91dFswXSA9IGFbMF0gKyBiWzBdO1xyXG4gIG91dFsxXSA9IGFbMV0gKyBiWzFdO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTdWJ0cmFjdHMgdmVjdG9yIGIgZnJvbSB2ZWN0b3IgYVxyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcclxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxyXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gc3VidHJhY3Qob3V0LCBhLCBiKSB7XHJcbiAgb3V0WzBdID0gYVswXSAtIGJbMF07XHJcbiAgb3V0WzFdID0gYVsxXSAtIGJbMV07XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIE11bHRpcGxpZXMgdHdvIHZlYzInc1xyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcclxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxyXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gbXVsdGlwbHkob3V0LCBhLCBiKSB7XHJcbiAgb3V0WzBdID0gYVswXSAqIGJbMF07XHJcbiAgb3V0WzFdID0gYVsxXSAqIGJbMV07XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIERpdmlkZXMgdHdvIHZlYzInc1xyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcclxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxyXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZGl2aWRlKG91dCwgYSwgYikge1xyXG4gIG91dFswXSA9IGFbMF0gLyBiWzBdO1xyXG4gIG91dFsxXSA9IGFbMV0gLyBiWzFdO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBNYXRoLmNlaWwgdGhlIGNvbXBvbmVudHMgb2YgYSB2ZWMyXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXHJcbiAqIEBwYXJhbSB7dmVjMn0gYSB2ZWN0b3IgdG8gY2VpbFxyXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY2VpbChvdXQsIGEpIHtcclxuICBvdXRbMF0gPSBNYXRoLmNlaWwoYVswXSk7XHJcbiAgb3V0WzFdID0gTWF0aC5jZWlsKGFbMV0pO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBNYXRoLmZsb29yIHRoZSBjb21wb25lbnRzIG9mIGEgdmVjMlxyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdmVjdG9yIHRvIGZsb29yXHJcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBmbG9vcihvdXQsIGEpIHtcclxuICBvdXRbMF0gPSBNYXRoLmZsb29yKGFbMF0pO1xyXG4gIG91dFsxXSA9IE1hdGguZmxvb3IoYVsxXSk7XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgdGhlIG1pbmltdW0gb2YgdHdvIHZlYzInc1xyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcclxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxyXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gbWluKG91dCwgYSwgYikge1xyXG4gIG91dFswXSA9IE1hdGgubWluKGFbMF0sIGJbMF0pO1xyXG4gIG91dFsxXSA9IE1hdGgubWluKGFbMV0sIGJbMV0pO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBtYXhpbXVtIG9mIHR3byB2ZWMyJ3NcclxuICpcclxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcclxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSBmaXJzdCBvcGVyYW5kXHJcbiAqIEBwYXJhbSB7dmVjMn0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcclxuICogQHJldHVybnMge3ZlYzJ9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIG1heChvdXQsIGEsIGIpIHtcclxuICBvdXRbMF0gPSBNYXRoLm1heChhWzBdLCBiWzBdKTtcclxuICBvdXRbMV0gPSBNYXRoLm1heChhWzFdLCBiWzFdKTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogTWF0aC5yb3VuZCB0aGUgY29tcG9uZW50cyBvZiBhIHZlYzJcclxuICpcclxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcclxuICogQHBhcmFtIHt2ZWMyfSBhIHZlY3RvciB0byByb3VuZFxyXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcm91bmQob3V0LCBhKSB7XHJcbiAgb3V0WzBdID0gTWF0aC5yb3VuZChhWzBdKTtcclxuICBvdXRbMV0gPSBNYXRoLnJvdW5kKGFbMV0pO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTY2FsZXMgYSB2ZWMyIGJ5IGEgc2NhbGFyIG51bWJlclxyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIHZlY3RvciB0byBzY2FsZVxyXG4gKiBAcGFyYW0ge051bWJlcn0gYiBhbW91bnQgdG8gc2NhbGUgdGhlIHZlY3RvciBieVxyXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gc2NhbGUob3V0LCBhLCBiKSB7XHJcbiAgb3V0WzBdID0gYVswXSAqIGI7XHJcbiAgb3V0WzFdID0gYVsxXSAqIGI7XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEFkZHMgdHdvIHZlYzIncyBhZnRlciBzY2FsaW5nIHRoZSBzZWNvbmQgb3BlcmFuZCBieSBhIHNjYWxhciB2YWx1ZVxyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcclxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxyXG4gKiBAcGFyYW0ge051bWJlcn0gc2NhbGUgdGhlIGFtb3VudCB0byBzY2FsZSBiIGJ5IGJlZm9yZSBhZGRpbmdcclxuICogQHJldHVybnMge3ZlYzJ9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHNjYWxlQW5kQWRkKG91dCwgYSwgYiwgc2NhbGUpIHtcclxuICBvdXRbMF0gPSBhWzBdICsgYlswXSAqIHNjYWxlO1xyXG4gIG91dFsxXSA9IGFbMV0gKyBiWzFdICogc2NhbGU7XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIENhbGN1bGF0ZXMgdGhlIGV1Y2xpZGlhbiBkaXN0YW5jZSBiZXR3ZWVuIHR3byB2ZWMyJ3NcclxuICpcclxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSBmaXJzdCBvcGVyYW5kXHJcbiAqIEBwYXJhbSB7dmVjMn0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcclxuICogQHJldHVybnMge051bWJlcn0gZGlzdGFuY2UgYmV0d2VlbiBhIGFuZCBiXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZGlzdGFuY2UoYSwgYikge1xyXG4gIHZhciB4ID0gYlswXSAtIGFbMF0sXHJcbiAgICAgIHkgPSBiWzFdIC0gYVsxXTtcclxuICByZXR1cm4gTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkpO1xyXG59XHJcblxyXG4vKipcclxuICogQ2FsY3VsYXRlcyB0aGUgc3F1YXJlZCBldWNsaWRpYW4gZGlzdGFuY2UgYmV0d2VlbiB0d28gdmVjMidzXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxyXG4gKiBAcGFyYW0ge3ZlYzJ9IGIgdGhlIHNlY29uZCBvcGVyYW5kXHJcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IHNxdWFyZWQgZGlzdGFuY2UgYmV0d2VlbiBhIGFuZCBiXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gc3F1YXJlZERpc3RhbmNlKGEsIGIpIHtcclxuICB2YXIgeCA9IGJbMF0gLSBhWzBdLFxyXG4gICAgICB5ID0gYlsxXSAtIGFbMV07XHJcbiAgcmV0dXJuIHggKiB4ICsgeSAqIHk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDYWxjdWxhdGVzIHRoZSBsZW5ndGggb2YgYSB2ZWMyXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjMn0gYSB2ZWN0b3IgdG8gY2FsY3VsYXRlIGxlbmd0aCBvZlxyXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBsZW5ndGggb2YgYVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGxlbmd0aChhKSB7XHJcbiAgdmFyIHggPSBhWzBdLFxyXG4gICAgICB5ID0gYVsxXTtcclxuICByZXR1cm4gTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkpO1xyXG59XHJcblxyXG4vKipcclxuICogQ2FsY3VsYXRlcyB0aGUgc3F1YXJlZCBsZW5ndGggb2YgYSB2ZWMyXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjMn0gYSB2ZWN0b3IgdG8gY2FsY3VsYXRlIHNxdWFyZWQgbGVuZ3RoIG9mXHJcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IHNxdWFyZWQgbGVuZ3RoIG9mIGFcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBzcXVhcmVkTGVuZ3RoKGEpIHtcclxuICB2YXIgeCA9IGFbMF0sXHJcbiAgICAgIHkgPSBhWzFdO1xyXG4gIHJldHVybiB4ICogeCArIHkgKiB5O1xyXG59XHJcblxyXG4vKipcclxuICogTmVnYXRlcyB0aGUgY29tcG9uZW50cyBvZiBhIHZlYzJcclxuICpcclxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcclxuICogQHBhcmFtIHt2ZWMyfSBhIHZlY3RvciB0byBuZWdhdGVcclxuICogQHJldHVybnMge3ZlYzJ9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIG5lZ2F0ZShvdXQsIGEpIHtcclxuICBvdXRbMF0gPSAtYVswXTtcclxuICBvdXRbMV0gPSAtYVsxXTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogUmV0dXJucyB0aGUgaW52ZXJzZSBvZiB0aGUgY29tcG9uZW50cyBvZiBhIHZlYzJcclxuICpcclxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcclxuICogQHBhcmFtIHt2ZWMyfSBhIHZlY3RvciB0byBpbnZlcnRcclxuICogQHJldHVybnMge3ZlYzJ9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGludmVyc2Uob3V0LCBhKSB7XHJcbiAgb3V0WzBdID0gMS4wIC8gYVswXTtcclxuICBvdXRbMV0gPSAxLjAgLyBhWzFdO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBOb3JtYWxpemUgYSB2ZWMyXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXHJcbiAqIEBwYXJhbSB7dmVjMn0gYSB2ZWN0b3IgdG8gbm9ybWFsaXplXHJcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemUob3V0LCBhKSB7XHJcbiAgdmFyIHggPSBhWzBdLFxyXG4gICAgICB5ID0gYVsxXTtcclxuICB2YXIgbGVuID0geCAqIHggKyB5ICogeTtcclxuICBpZiAobGVuID4gMCkge1xyXG4gICAgLy9UT0RPOiBldmFsdWF0ZSB1c2Ugb2YgZ2xtX2ludnNxcnQgaGVyZT9cclxuICAgIGxlbiA9IDEgLyBNYXRoLnNxcnQobGVuKTtcclxuICAgIG91dFswXSA9IGFbMF0gKiBsZW47XHJcbiAgICBvdXRbMV0gPSBhWzFdICogbGVuO1xyXG4gIH1cclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogQ2FsY3VsYXRlcyB0aGUgZG90IHByb2R1Y3Qgb2YgdHdvIHZlYzInc1xyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcclxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxyXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBkb3QgcHJvZHVjdCBvZiBhIGFuZCBiXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZG90KGEsIGIpIHtcclxuICByZXR1cm4gYVswXSAqIGJbMF0gKyBhWzFdICogYlsxXTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENvbXB1dGVzIHRoZSBjcm9zcyBwcm9kdWN0IG9mIHR3byB2ZWMyJ3NcclxuICogTm90ZSB0aGF0IHRoZSBjcm9zcyBwcm9kdWN0IG11c3QgYnkgZGVmaW5pdGlvbiBwcm9kdWNlIGEgM0QgdmVjdG9yXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXHJcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxyXG4gKiBAcGFyYW0ge3ZlYzJ9IGIgdGhlIHNlY29uZCBvcGVyYW5kXHJcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjcm9zcyhvdXQsIGEsIGIpIHtcclxuICB2YXIgeiA9IGFbMF0gKiBiWzFdIC0gYVsxXSAqIGJbMF07XHJcbiAgb3V0WzBdID0gb3V0WzFdID0gMDtcclxuICBvdXRbMl0gPSB6O1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBQZXJmb3JtcyBhIGxpbmVhciBpbnRlcnBvbGF0aW9uIGJldHdlZW4gdHdvIHZlYzInc1xyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcclxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxyXG4gKiBAcGFyYW0ge051bWJlcn0gdCBpbnRlcnBvbGF0aW9uIGFtb3VudCwgaW4gdGhlIHJhbmdlIFswLTFdLCBiZXR3ZWVuIHRoZSB0d28gaW5wdXRzXHJcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBsZXJwKG91dCwgYSwgYiwgdCkge1xyXG4gIHZhciBheCA9IGFbMF0sXHJcbiAgICAgIGF5ID0gYVsxXTtcclxuICBvdXRbMF0gPSBheCArIHQgKiAoYlswXSAtIGF4KTtcclxuICBvdXRbMV0gPSBheSArIHQgKiAoYlsxXSAtIGF5KTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogR2VuZXJhdGVzIGEgcmFuZG9tIHZlY3RvciB3aXRoIHRoZSBnaXZlbiBzY2FsZVxyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge051bWJlcn0gW3NjYWxlXSBMZW5ndGggb2YgdGhlIHJlc3VsdGluZyB2ZWN0b3IuIElmIG9tbWl0dGVkLCBhIHVuaXQgdmVjdG9yIHdpbGwgYmUgcmV0dXJuZWRcclxuICogQHJldHVybnMge3ZlYzJ9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbShvdXQsIHNjYWxlKSB7XHJcbiAgc2NhbGUgPSBzY2FsZSB8fCAxLjA7XHJcbiAgdmFyIHIgPSBnbE1hdHJpeC5SQU5ET00oKSAqIDIuMCAqIE1hdGguUEk7XHJcbiAgb3V0WzBdID0gTWF0aC5jb3MocikgKiBzY2FsZTtcclxuICBvdXRbMV0gPSBNYXRoLnNpbihyKSAqIHNjYWxlO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUcmFuc2Zvcm1zIHRoZSB2ZWMyIHdpdGggYSBtYXQyXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXHJcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgdmVjdG9yIHRvIHRyYW5zZm9ybVxyXG4gKiBAcGFyYW0ge21hdDJ9IG0gbWF0cml4IHRvIHRyYW5zZm9ybSB3aXRoXHJcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiB0cmFuc2Zvcm1NYXQyKG91dCwgYSwgbSkge1xyXG4gIHZhciB4ID0gYVswXSxcclxuICAgICAgeSA9IGFbMV07XHJcbiAgb3V0WzBdID0gbVswXSAqIHggKyBtWzJdICogeTtcclxuICBvdXRbMV0gPSBtWzFdICogeCArIG1bM10gKiB5O1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUcmFuc2Zvcm1zIHRoZSB2ZWMyIHdpdGggYSBtYXQyZFxyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIHZlY3RvciB0byB0cmFuc2Zvcm1cclxuICogQHBhcmFtIHttYXQyZH0gbSBtYXRyaXggdG8gdHJhbnNmb3JtIHdpdGhcclxuICogQHJldHVybnMge3ZlYzJ9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zZm9ybU1hdDJkKG91dCwgYSwgbSkge1xyXG4gIHZhciB4ID0gYVswXSxcclxuICAgICAgeSA9IGFbMV07XHJcbiAgb3V0WzBdID0gbVswXSAqIHggKyBtWzJdICogeSArIG1bNF07XHJcbiAgb3V0WzFdID0gbVsxXSAqIHggKyBtWzNdICogeSArIG1bNV07XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFRyYW5zZm9ybXMgdGhlIHZlYzIgd2l0aCBhIG1hdDNcclxuICogM3JkIHZlY3RvciBjb21wb25lbnQgaXMgaW1wbGljaXRseSAnMSdcclxuICpcclxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcclxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSB2ZWN0b3IgdG8gdHJhbnNmb3JtXHJcbiAqIEBwYXJhbSB7bWF0M30gbSBtYXRyaXggdG8gdHJhbnNmb3JtIHdpdGhcclxuICogQHJldHVybnMge3ZlYzJ9IG91dFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zZm9ybU1hdDMob3V0LCBhLCBtKSB7XHJcbiAgdmFyIHggPSBhWzBdLFxyXG4gICAgICB5ID0gYVsxXTtcclxuICBvdXRbMF0gPSBtWzBdICogeCArIG1bM10gKiB5ICsgbVs2XTtcclxuICBvdXRbMV0gPSBtWzFdICogeCArIG1bNF0gKiB5ICsgbVs3XTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG4vKipcclxuICogVHJhbnNmb3JtcyB0aGUgdmVjMiB3aXRoIGEgbWF0NFxyXG4gKiAzcmQgdmVjdG9yIGNvbXBvbmVudCBpcyBpbXBsaWNpdGx5ICcwJ1xyXG4gKiA0dGggdmVjdG9yIGNvbXBvbmVudCBpcyBpbXBsaWNpdGx5ICcxJ1xyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIHZlY3RvciB0byB0cmFuc2Zvcm1cclxuICogQHBhcmFtIHttYXQ0fSBtIG1hdHJpeCB0byB0cmFuc2Zvcm0gd2l0aFxyXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdHJhbnNmb3JtTWF0NChvdXQsIGEsIG0pIHtcclxuICB2YXIgeCA9IGFbMF07XHJcbiAgdmFyIHkgPSBhWzFdO1xyXG4gIG91dFswXSA9IG1bMF0gKiB4ICsgbVs0XSAqIHkgKyBtWzEyXTtcclxuICBvdXRbMV0gPSBtWzFdICogeCArIG1bNV0gKiB5ICsgbVsxM107XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJvdGF0ZSBhIDJEIHZlY3RvclxyXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCBUaGUgcmVjZWl2aW5nIHZlYzJcclxuICogQHBhcmFtIHt2ZWMyfSBhIFRoZSB2ZWMyIHBvaW50IHRvIHJvdGF0ZVxyXG4gKiBAcGFyYW0ge3ZlYzJ9IGIgVGhlIG9yaWdpbiBvZiB0aGUgcm90YXRpb25cclxuICogQHBhcmFtIHtOdW1iZXJ9IGMgVGhlIGFuZ2xlIG9mIHJvdGF0aW9uXHJcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiByb3RhdGUob3V0LCBhLCBiLCBjKSB7XHJcbiAgLy9UcmFuc2xhdGUgcG9pbnQgdG8gdGhlIG9yaWdpblxyXG4gIHZhciBwMCA9IGFbMF0gLSBiWzBdLFxyXG4gICAgICBwMSA9IGFbMV0gLSBiWzFdLFxyXG4gICAgICBzaW5DID0gTWF0aC5zaW4oYyksXHJcbiAgICAgIGNvc0MgPSBNYXRoLmNvcyhjKTtcclxuXHJcbiAgLy9wZXJmb3JtIHJvdGF0aW9uIGFuZCB0cmFuc2xhdGUgdG8gY29ycmVjdCBwb3NpdGlvblxyXG4gIG91dFswXSA9IHAwICogY29zQyAtIHAxICogc2luQyArIGJbMF07XHJcbiAgb3V0WzFdID0gcDAgKiBzaW5DICsgcDEgKiBjb3NDICsgYlsxXTtcclxuXHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEdldCB0aGUgYW5nbGUgYmV0d2VlbiB0d28gMkQgdmVjdG9yc1xyXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgVGhlIGZpcnN0IG9wZXJhbmRcclxuICogQHBhcmFtIHt2ZWMyfSBiIFRoZSBzZWNvbmQgb3BlcmFuZFxyXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBUaGUgYW5nbGUgaW4gcmFkaWFuc1xyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGFuZ2xlKGEsIGIpIHtcclxuICB2YXIgeDEgPSBhWzBdLFxyXG4gICAgICB5MSA9IGFbMV0sXHJcbiAgICAgIHgyID0gYlswXSxcclxuICAgICAgeTIgPSBiWzFdO1xyXG5cclxuICB2YXIgbGVuMSA9IHgxICogeDEgKyB5MSAqIHkxO1xyXG4gIGlmIChsZW4xID4gMCkge1xyXG4gICAgLy9UT0RPOiBldmFsdWF0ZSB1c2Ugb2YgZ2xtX2ludnNxcnQgaGVyZT9cclxuICAgIGxlbjEgPSAxIC8gTWF0aC5zcXJ0KGxlbjEpO1xyXG4gIH1cclxuXHJcbiAgdmFyIGxlbjIgPSB4MiAqIHgyICsgeTIgKiB5MjtcclxuICBpZiAobGVuMiA+IDApIHtcclxuICAgIC8vVE9ETzogZXZhbHVhdGUgdXNlIG9mIGdsbV9pbnZzcXJ0IGhlcmU/XHJcbiAgICBsZW4yID0gMSAvIE1hdGguc3FydChsZW4yKTtcclxuICB9XHJcblxyXG4gIHZhciBjb3NpbmUgPSAoeDEgKiB4MiArIHkxICogeTIpICogbGVuMSAqIGxlbjI7XHJcblxyXG4gIGlmIChjb3NpbmUgPiAxLjApIHtcclxuICAgIHJldHVybiAwO1xyXG4gIH0gZWxzZSBpZiAoY29zaW5lIDwgLTEuMCkge1xyXG4gICAgcmV0dXJuIE1hdGguUEk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBNYXRoLmFjb3MoY29zaW5lKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGEgdmVjdG9yXHJcbiAqXHJcbiAqIEBwYXJhbSB7dmVjMn0gYSB2ZWN0b3IgdG8gcmVwcmVzZW50IGFzIGEgc3RyaW5nXHJcbiAqIEByZXR1cm5zIHtTdHJpbmd9IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgdmVjdG9yXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gc3RyKGEpIHtcclxuICByZXR1cm4gJ3ZlYzIoJyArIGFbMF0gKyAnLCAnICsgYVsxXSArICcpJztcclxufVxyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgd2hldGhlciBvciBub3QgdGhlIHZlY3RvcnMgZXhhY3RseSBoYXZlIHRoZSBzYW1lIGVsZW1lbnRzIGluIHRoZSBzYW1lIHBvc2l0aW9uICh3aGVuIGNvbXBhcmVkIHdpdGggPT09KVxyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgVGhlIGZpcnN0IHZlY3Rvci5cclxuICogQHBhcmFtIHt2ZWMyfSBiIFRoZSBzZWNvbmQgdmVjdG9yLlxyXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gVHJ1ZSBpZiB0aGUgdmVjdG9ycyBhcmUgZXF1YWwsIGZhbHNlIG90aGVyd2lzZS5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBleGFjdEVxdWFscyhhLCBiKSB7XHJcbiAgcmV0dXJuIGFbMF0gPT09IGJbMF0gJiYgYVsxXSA9PT0gYlsxXTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgd2hldGhlciBvciBub3QgdGhlIHZlY3RvcnMgaGF2ZSBhcHByb3hpbWF0ZWx5IHRoZSBzYW1lIGVsZW1lbnRzIGluIHRoZSBzYW1lIHBvc2l0aW9uLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgVGhlIGZpcnN0IHZlY3Rvci5cclxuICogQHBhcmFtIHt2ZWMyfSBiIFRoZSBzZWNvbmQgdmVjdG9yLlxyXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gVHJ1ZSBpZiB0aGUgdmVjdG9ycyBhcmUgZXF1YWwsIGZhbHNlIG90aGVyd2lzZS5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBlcXVhbHMoYSwgYikge1xyXG4gIHZhciBhMCA9IGFbMF0sXHJcbiAgICAgIGExID0gYVsxXTtcclxuICB2YXIgYjAgPSBiWzBdLFxyXG4gICAgICBiMSA9IGJbMV07XHJcbiAgcmV0dXJuIE1hdGguYWJzKGEwIC0gYjApIDw9IGdsTWF0cml4LkVQU0lMT04gKiBNYXRoLm1heCgxLjAsIE1hdGguYWJzKGEwKSwgTWF0aC5hYnMoYjApKSAmJiBNYXRoLmFicyhhMSAtIGIxKSA8PSBnbE1hdHJpeC5FUFNJTE9OICogTWF0aC5tYXgoMS4wLCBNYXRoLmFicyhhMSksIE1hdGguYWJzKGIxKSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzIubGVuZ3RofVxyXG4gKiBAZnVuY3Rpb25cclxuICovXHJcbmV4cG9ydCB2YXIgbGVuID0gbGVuZ3RoO1xyXG5cclxuLyoqXHJcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjMi5zdWJ0cmFjdH1cclxuICogQGZ1bmN0aW9uXHJcbiAqL1xyXG5leHBvcnQgdmFyIHN1YiA9IHN1YnRyYWN0O1xyXG5cclxuLyoqXHJcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjMi5tdWx0aXBseX1cclxuICogQGZ1bmN0aW9uXHJcbiAqL1xyXG5leHBvcnQgdmFyIG11bCA9IG11bHRpcGx5O1xyXG5cclxuLyoqXHJcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjMi5kaXZpZGV9XHJcbiAqIEBmdW5jdGlvblxyXG4gKi9cclxuZXhwb3J0IHZhciBkaXYgPSBkaXZpZGU7XHJcblxyXG4vKipcclxuICogQWxpYXMgZm9yIHtAbGluayB2ZWMyLmRpc3RhbmNlfVxyXG4gKiBAZnVuY3Rpb25cclxuICovXHJcbmV4cG9ydCB2YXIgZGlzdCA9IGRpc3RhbmNlO1xyXG5cclxuLyoqXHJcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjMi5zcXVhcmVkRGlzdGFuY2V9XHJcbiAqIEBmdW5jdGlvblxyXG4gKi9cclxuZXhwb3J0IHZhciBzcXJEaXN0ID0gc3F1YXJlZERpc3RhbmNlO1xyXG5cclxuLyoqXHJcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjMi5zcXVhcmVkTGVuZ3RofVxyXG4gKiBAZnVuY3Rpb25cclxuICovXHJcbmV4cG9ydCB2YXIgc3FyTGVuID0gc3F1YXJlZExlbmd0aDtcclxuXHJcbi8qKlxyXG4gKiBQZXJmb3JtIHNvbWUgb3BlcmF0aW9uIG92ZXIgYW4gYXJyYXkgb2YgdmVjMnMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7QXJyYXl9IGEgdGhlIGFycmF5IG9mIHZlY3RvcnMgdG8gaXRlcmF0ZSBvdmVyXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBzdHJpZGUgTnVtYmVyIG9mIGVsZW1lbnRzIGJldHdlZW4gdGhlIHN0YXJ0IG9mIGVhY2ggdmVjMi4gSWYgMCBhc3N1bWVzIHRpZ2h0bHkgcGFja2VkXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBvZmZzZXQgTnVtYmVyIG9mIGVsZW1lbnRzIHRvIHNraXAgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgYXJyYXlcclxuICogQHBhcmFtIHtOdW1iZXJ9IGNvdW50IE51bWJlciBvZiB2ZWMycyB0byBpdGVyYXRlIG92ZXIuIElmIDAgaXRlcmF0ZXMgb3ZlciBlbnRpcmUgYXJyYXlcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gRnVuY3Rpb24gdG8gY2FsbCBmb3IgZWFjaCB2ZWN0b3IgaW4gdGhlIGFycmF5XHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBbYXJnXSBhZGRpdGlvbmFsIGFyZ3VtZW50IHRvIHBhc3MgdG8gZm5cclxuICogQHJldHVybnMge0FycmF5fSBhXHJcbiAqIEBmdW5jdGlvblxyXG4gKi9cclxuZXhwb3J0IHZhciBmb3JFYWNoID0gZnVuY3Rpb24gKCkge1xyXG4gIHZhciB2ZWMgPSBjcmVhdGUoKTtcclxuXHJcbiAgcmV0dXJuIGZ1bmN0aW9uIChhLCBzdHJpZGUsIG9mZnNldCwgY291bnQsIGZuLCBhcmcpIHtcclxuICAgIHZhciBpID0gdm9pZCAwLFxyXG4gICAgICAgIGwgPSB2b2lkIDA7XHJcbiAgICBpZiAoIXN0cmlkZSkge1xyXG4gICAgICBzdHJpZGUgPSAyO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghb2Zmc2V0KSB7XHJcbiAgICAgIG9mZnNldCA9IDA7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGNvdW50KSB7XHJcbiAgICAgIGwgPSBNYXRoLm1pbihjb3VudCAqIHN0cmlkZSArIG9mZnNldCwgYS5sZW5ndGgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbCA9IGEubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAoaSA9IG9mZnNldDsgaSA8IGw7IGkgKz0gc3RyaWRlKSB7XHJcbiAgICAgIHZlY1swXSA9IGFbaV07dmVjWzFdID0gYVtpICsgMV07XHJcbiAgICAgIGZuKHZlYywgdmVjLCBhcmcpO1xyXG4gICAgICBhW2ldID0gdmVjWzBdO2FbaSArIDFdID0gdmVjWzFdO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhO1xyXG4gIH07XHJcbn0oKTsiLCJpbXBvcnQgeyBtYXQ0LCBxdWF0LCB2ZWMzLCB2ZWM0IH0gZnJvbSAnZ2wtbWF0cml4JztcclxuaW1wb3J0IHsgbGVycCwgc2V0IH0gZnJvbSAnLi4vY29tbW9uL1V0aWwnO1xyXG5cclxuY29uc3QgIFQgPSBbMCwgMCwgMF0sIFIgPSBbMCwgMCwgMCwgMV0sIFMgPSBbMSwgMSwgMV07XHJcbmNvbnN0IERFRkFVTFRfVkFMVUVTID0ge1xyXG4gICAgVFJBTlNMQVRJT04gOiBbMCwgMCwgMF0sXHJcbiAgICBST1RBVElPTiA6IFswLCAwLCAwLCAxXSxcclxuICAgIFNDQUxFIDogWzEsIDEsIDFdXHJcbn07XHJcbmNvbnN0IENMSVBfUFJFTkVYVCA9IHtcclxuICAgIFBSRVZJT1VTIDogbnVsbCxcclxuICAgIE5FWFQgOiBudWxsLFxyXG4gICAgUFJFSU5ERVggOiBudWxsLFxyXG4gICAgTkVYVElOREVYIDogbnVsbCxcclxuICAgIElOVEVSUE9MQVRJT04gOiBudWxsXHJcbn07XHJcbmNvbnN0IEFuaW1hdGlvbkNsaXAgPSB7XHJcbiAgICBfZ2V0VFJTVyhnbHRmLCBub2RlLCB0aW1lLCB0cmFuc2xhdGlvbiwgcm90YXRpb24sIHNjYWxlLCB3ZWlnaHRzKSB7XHJcbiAgICAgICAgY29uc3QgYW5pbWF0aW9ucyA9IGdsdGYuYW5pbWF0aW9ucztcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFuaW1hdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgYW5pbWF0aW9uID0gYW5pbWF0aW9uc1tpXTtcclxuICAgICAgICAgICAgY29uc3QgY2hhbm5lbHMgPSBhbmltYXRpb24uY2hhbm5lbHM7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgY2hhbm5lbHMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNoYW5uZWwgPSBjaGFubmVsc1tqXTtcclxuICAgICAgICAgICAgICAgIGlmIChjaGFubmVsLnRhcmdldC5ub2RlID09PSBub2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoYW5uZWwudGFyZ2V0LnBhdGggPT09ICd0cmFuc2xhdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2V0QW5pbWF0ZURhdGEodHJhbnNsYXRpb24sIGFuaW1hdGlvbi5zYW1wbGVyc1tjaGFubmVsLnNhbXBsZXJdLCB0aW1lLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNoYW5uZWwudGFyZ2V0LnBhdGggPT09ICdyb3RhdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2V0UXVhdGVybmlvbihyb3RhdGlvbiwgYW5pbWF0aW9uLnNhbXBsZXJzW2NoYW5uZWwuc2FtcGxlcl0sIHRpbWUsIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2hhbm5lbC50YXJnZXQucGF0aCA9PT0gJ3NjYWxlJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9nZXRBbmltYXRlRGF0YShzY2FsZSwgYW5pbWF0aW9uLnNhbXBsZXJzW2NoYW5uZWwuc2FtcGxlcl0sIHRpbWUsIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2hhbm5lbC50YXJnZXQucGF0aCA9PT0gJ3dlaWdodHMnICYmIHdlaWdodHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2V0QW5pbWF0ZURhdGEod2VpZ2h0cywgYW5pbWF0aW9uLnNhbXBsZXJzW2NoYW5uZWwuc2FtcGxlcl0sIHRpbWUsIHdlaWdodHMubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIF9nZXRBbmltYXRlRGF0YShvdXQsIHNhbXBsZXIsIHRpbWUsIHN0cmlkZSkge1xyXG4gICAgICAgIHN3aXRjaCAoc2FtcGxlci5pbnRlcnBvbGF0aW9uKSB7XHJcbiAgICAgICAgY2FzZSAnTElORUFSJzoge1xyXG4gICAgICAgICAgICBjb25zdCBwcmVOZXh0ID0gdGhpcy5fZ2V0UHJlTmV4dChDTElQX1BSRU5FWFQsIHNhbXBsZXIsIHRpbWUsIDEgKiBzdHJpZGUpO1xyXG4gICAgICAgICAgICBpZiAocHJlTmV4dCkge1xyXG4gICAgICAgICAgICAgICAgb3V0ID0gbGVycChvdXQsIHByZU5leHQuUFJFVklPVVMsIHByZU5leHQuTkVYVCwgcHJlTmV4dC5JTlRFUlBPTEFUSU9OKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgICAgY2FzZSAnU1RFUCc6IHtcclxuICAgICAgICAgICAgY29uc3QgcHJlTmV4dCA9IHRoaXMuX2dldFByZU5leHQoQ0xJUF9QUkVORVhULCBzYW1wbGVyLCB0aW1lLCAxICogc3RyaWRlKTtcclxuICAgICAgICAgICAgaWYgKHByZU5leHQpIHtcclxuICAgICAgICAgICAgICAgIG91dCA9IHNldChvdXQsIC4uLnByZU5leHQuUFJFVklPVVMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXNlICdDVUJJQ1NQTElORSc6IHtcclxuICAgICAgICAgICAgY29uc3QgcHJlTmV4dCA9IHRoaXMuX2dldFByZU5leHQoQ0xJUF9QUkVORVhULCBzYW1wbGVyLCB0aW1lLCAzICogc3RyaWRlKTtcclxuICAgICAgICAgICAgaWYgKHByZU5leHQpIHtcclxuICAgICAgICAgICAgICAgIG91dCA9IHRoaXMuX2dldEN1YmljU3BsaW5lKG91dCwgcHJlTmV4dCwgc2FtcGxlci5pbnB1dC5hcnJheSwgMyAqIHN0cmlkZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gb3V0O1xyXG4gICAgfSxcclxuXHJcbiAgICBfZ2V0UXVhdGVybmlvbihvdXQsIHNhbXBsZXIsIHRpbWUpIHtcclxuICAgICAgICBzd2l0Y2ggKHNhbXBsZXIuaW50ZXJwb2xhdGlvbikge1xyXG4gICAgICAgIGNhc2UgJ0xJTkVBUic6IHtcclxuICAgICAgICAgICAgY29uc3QgcHJlTmV4dCA9IHRoaXMuX2dldFByZU5leHQoQ0xJUF9QUkVORVhULCBzYW1wbGVyLCB0aW1lLCAxKTtcclxuICAgICAgICAgICAgaWYgKHByZU5leHQpIHtcclxuICAgICAgICAgICAgICAgIHF1YXQuc2xlcnAob3V0LCBwcmVOZXh0LlBSRVZJT1VTLCBwcmVOZXh0Lk5FWFQsIHByZU5leHQuSU5URVJQT0xBVElPTik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhc2UgJ1NURVAnOiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHByZU5leHQgPSB0aGlzLl9nZXRQcmVOZXh0KENMSVBfUFJFTkVYVCwgc2FtcGxlciwgdGltZSwgMSk7XHJcbiAgICAgICAgICAgIGlmIChwcmVOZXh0KSB7XHJcbiAgICAgICAgICAgICAgICBvdXQgPSB2ZWM0LnNldChvdXQsIC4uLnByZU5leHQuUFJFVklPVVMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXNlICdDVUJJQ1NQTElORSc6IHtcclxuICAgICAgICAgICAgY29uc3QgcHJlTmV4dCA9IHRoaXMuX2dldFByZU5leHQoQ0xJUF9QUkVORVhULCBzYW1wbGVyLCB0aW1lLCAzKTtcclxuICAgICAgICAgICAgaWYgKHByZU5leHQpIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJlTmV4dC5QUkVWSU9VUy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHByZU5leHQuUFJFVklPVVNbaV0gPSBNYXRoLmFjb3MocHJlTmV4dC5QUkVWSU9VU1tpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJlTmV4dC5ORVhUW2ldID0gTWF0aC5hY29zKHByZU5leHQuTkVYVFtpXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBvdXQgPSB0aGlzLl9nZXRDdWJpY1NwbGluZShvdXQsIHByZU5leHQsIHNhbXBsZXIuaW5wdXQuYXJyYXksIDMpO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBvdXQubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBvdXRbal0gPSBNYXRoLmNvcyhvdXRbal0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG91dDtcclxuICAgIH0sXHJcblxyXG4gICAgX2dldFByZU5leHQob3V0LCBzYW1wbGVyLCB0aW1lLCBzdHJpZGUpIHtcclxuICAgICAgICBjb25zdCBpbnB1dCA9IHNhbXBsZXIuaW5wdXQuYXJyYXk7XHJcbiAgICAgICAgY29uc3Qgb3V0cHV0ID0gc2FtcGxlci5vdXRwdXQuYXJyYXk7XHJcbiAgICAgICAgY29uc3QgaXRlbVNpemUgPSBzYW1wbGVyLm91dHB1dC5pdGVtU2l6ZTtcclxuICAgICAgICAvLyBjb25zdCBpbnRlcnBvbGF0aW9uID0gdGhpcy5fZ2V0SW50ZXJwb2xhdGlvbihwcmVOZXh0LCBpbnB1dCwgdGltZSk7XHJcbiAgICAgICAgaWYgKHRpbWUgPCBpbnB1dFswXSB8fCB0aW1lID4gaW5wdXRbaW5wdXQubGVuZ3RoIC0gMV0pIHtcclxuICAgICAgICAgICAgdGltZSA9IE1hdGgubWF4KGlucHV0WzBdLCBNYXRoLm1pbihpbnB1dFtpbnB1dC5sZW5ndGggLSAxXSwgdGltZSkpO1xyXG4gICAgICAgIH0gaWYgKHRpbWUgPT09IGlucHV0W2lucHV0Lmxlbmd0aCAtIDFdKSB7XHJcbiAgICAgICAgICAgIHRpbWUgPSBpbnB1dFswXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IHByZUluZHgsIG5leHRJbmRleCwgaW50ZXJwb2xhdGlvbjtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0Lmxlbmd0aCAtIDE7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAodGltZSA+PSBpbnB1dFtpXSAmJiB0aW1lIDwgaW5wdXRbaSArIDFdKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwcmV2aW91c1RpbWUgPSBpbnB1dFtpXTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG5leHRUaW1lID0gaW5wdXRbaSArIDFdO1xyXG4gICAgICAgICAgICAgICAgcHJlSW5keCA9IGk7XHJcbiAgICAgICAgICAgICAgICBuZXh0SW5kZXggPSBpICsgMTtcclxuICAgICAgICAgICAgICAgIGludGVycG9sYXRpb24gPSAodGltZSAtIHByZXZpb3VzVGltZSkgLyAobmV4dFRpbWUgLSBwcmV2aW91c1RpbWUpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFuZXh0SW5kZXgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG91dC5QUkVJTkRFWCA9IHByZUluZHg7XHJcbiAgICAgICAgb3V0Lk5FWFRJTkRFWCA9IG5leHRJbmRleDtcclxuICAgICAgICBvdXQuSU5URVJQT0xBVElPTiA9IGludGVycG9sYXRpb247XHJcbiAgICAgICAgLy9wcmV2aW91cyArIGludGVycG9sYXRpb25WYWx1ZSAqIChuZXh0IC0gcHJldmlvdXMpXHJcbiAgICAgICAgY29uc3Qgd2lkdGggPSBpdGVtU2l6ZSAqIHN0cmlkZTtcclxuICAgICAgICBvdXQuUFJFVklPVVMgPSBvdXRwdXQuc3ViYXJyYXkob3V0LlBSRUlOREVYICogd2lkdGgsIChvdXQuUFJFSU5ERVggKyAxKSAqIHdpZHRoKTtcclxuICAgICAgICBvdXQuTkVYVCA9IG91dHB1dC5zdWJhcnJheShvdXQuTkVYVElOREVYICogd2lkdGgsIChvdXQuTkVYVElOREVYICsgMSkgKiB3aWR0aCk7XHJcbiAgICAgICAgcmV0dXJuIG91dDtcclxuICAgIH0sXHJcblxyXG4gICAgX2dldEN1YmljU3BsaW5lKG91dCwgcHJlTmV4dCwgaW5wdXQsIGxlbmd0aCkge1xyXG4gICAgICAgIGNvbnN0IHQgPSBwcmVOZXh0LklOVEVSUE9MQVRJT047XHJcbiAgICAgICAgY29uc3QgdGsgPSBpbnB1dFtwcmVOZXh0LlBSRUlOREVYXTtcclxuICAgICAgICBjb25zdCB0azEgPSBpbnB1dFtwcmVOZXh0Lk5FWFRJTkRFWF07XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgcDAgPSBwcmVOZXh0LlBSRVZJT1VTW2xlbmd0aCArIGldO1xyXG4gICAgICAgICAgICBjb25zdCBtMCA9ICh0azEgLSB0aykgKiBwcmVOZXh0LlBSRVZJT1VTW2xlbmd0aCAqIDIgKyBpXTtcclxuICAgICAgICAgICAgY29uc3QgcDEgPSBwcmVOZXh0Lk5FWFRbMyArIGldO1xyXG4gICAgICAgICAgICBjb25zdCBtMSA9ICh0azEgLSB0aykgKiBwcmVOZXh0Lk5FWFRbaV07XHJcbiAgICAgICAgICAgIGNvbnN0IHB0aSA9IChNYXRoLnBvdyh0LCAzKSAqIDIgLSBNYXRoLnBvdyh0LCAyKSAqIDMgKyAxKSAqIHAwICsgKE1hdGgucG93KHQsIDMpIC0gTWF0aC5wb3codCwgMikgKiAyICsgdCkgKiBtMCArICgtTWF0aC5wb3codCwgMykgKiAyICsgTWF0aC5wb3codCwgMikgKiAzKSAqIHAxICsgKE1hdGgucG93KHQsIDMpIC0gTWF0aC5wb3codCwgMikpICogbTE7XHJcbiAgICAgICAgICAgIG91dFtpXSA9IHB0aTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG91dDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0QW5pbWF0aW9uQ2xpcChhbmltTWF0cml4LCBnbHRmLCBub2RlLCB0aW1lKSB7XHJcbiAgICAgICAgY29uc3Qgd2VpZ2h0cyA9IGdsdGYubm9kZXNbbm9kZV0gJiYgZ2x0Zi5ub2Rlc1tub2RlXS53ZWlnaHRzO1xyXG4gICAgICAgIC8v5ZyoY2hhbm5lbC50YXJnZXQubm9kZSA9PT0gbm9kZei/meS4gOadoeS7tuS4jea7oei2s+eahOaXtuWAme+8jOebtOaOpeS9v+eUqOWFqOWxgFTjgIFS44CBU+WPr+iDveaYr+S4iuS4gOW4p+eahFTjgIFS44CBU+WAvCzmiYDku6XpnIDopoHph43nva5cclxuICAgICAgICB2ZWMzLnNldChULCAuLi5ERUZBVUxUX1ZBTFVFUy5UUkFOU0xBVElPTik7XHJcbiAgICAgICAgdmVjNC5zZXQoUiwgLi4uREVGQVVMVF9WQUxVRVMuUk9UQVRJT04pO1xyXG4gICAgICAgIHZlYzMuc2V0KFMsIC4uLkRFRkFVTFRfVkFMVUVTLlNDQUxFKTtcclxuICAgICAgICB0aGlzLl9nZXRUUlNXKGdsdGYsIG5vZGUsIHRpbWUsIFQsIFIsIFMsIHdlaWdodHMpO1xyXG4gICAgICAgIG1hdDQuZnJvbVJvdGF0aW9uVHJhbnNsYXRpb25TY2FsZShhbmltTWF0cml4LCBSLCBULCBTKTtcclxuICAgIH0sXHJcblxyXG4gICAgLy9odHRwczovL2dpdGh1Yi5jb20vQmFieWxvbkpTL0JhYnlsb24uanMvaXNzdWVzLzM1NDhcclxuICAgIC8v5q+P5Liqbm9kZeeahOWKqOeUu+eahOaXtumXtOmXtOmalOW6lOivpeWvuem9kOWIsOaVtOS4qnNjZW5l55qE5pe26Ze057q/5LiK5p2l77yM5LiU5piv5ZCmbG9vcOW+queOr+mcgOimgeS6pOe7meS4iuWxguiwg+eUqOadpeWGs+WumlxyXG4gICAgZ2V0VGltZVNwYW4oZ2x0Zikge1xyXG4gICAgICAgIGlmICghZ2x0Zi5hbmltYXRpb25zKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgbWF4ID0gLUluZmluaXR5LCBtaW4gPSBJbmZpbml0eTtcclxuICAgICAgICBjb25zdCBhbmltYXRpb25zID0gZ2x0Zi5hbmltYXRpb25zO1xyXG4gICAgICAgIGFuaW1hdGlvbnMuZm9yRWFjaChhbmltYXRpb24gPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBjaGFubmVscyA9IGFuaW1hdGlvbi5jaGFubmVscztcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGFubmVscy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY2hhbm5lbCA9IGNoYW5uZWxzW2ldO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2FtcGxlciA9IGFuaW1hdGlvbi5zYW1wbGVyc1tjaGFubmVsLnNhbXBsZXJdO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaW5wdXQgPSBzYW1wbGVyLmlucHV0LmFycmF5O1xyXG4gICAgICAgICAgICAgICAgLy9tYXgucHVzaChpbnB1dFtpbnB1dC5sZW5ndGggLSAxXSk7XHJcbiAgICAgICAgICAgICAgICAvL21pbi5wdXNoKGlucHV0WzBdKTtcclxuICAgICAgICAgICAgICAgIGlmIChpbnB1dFtpbnB1dC5sZW5ndGggLSAxXSA+IG1heCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1heCA9IGlucHV0W2lucHV0Lmxlbmd0aCAtIDFdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGlucHV0WzBdIDwgbWluKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWluID0gaW5wdXRbMF07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4geyBtYXgsIG1pbiB9O1xyXG4gICAgfVxyXG5cclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0ICBBbmltYXRpb25DbGlwO1xyXG4iLCJpbXBvcnQgUHJvbWlzZSBmcm9tICcuL2NvcmUvUHJvbWlzZS5qcyc7XHJcbmltcG9ydCBBamF4IGZyb20gJy4vY29yZS9BamF4LmpzJztcclxuaW1wb3J0IEdMVEZWMSBmcm9tICcuL2FkYXB0ZXJzL0dMVEZWMS5qcyc7XHJcbmltcG9ydCBHTFRGVjIgZnJvbSAnLi9hZGFwdGVycy9HTFRGVjIuanMnO1xyXG5pbXBvcnQgR0xCUmVhZGVyIGZyb20gJy4vR0xCUmVhZGVyLmpzJztcclxuaW1wb3J0IHsgZGVmaW5lZCwgZXh0ZW5kLCBpc051bWJlciwgaXNTdHJpbmcgfSBmcm9tICcuL2NvbW1vbi9VdGlsLmpzJztcclxuaW1wb3J0IEFjY2Vzc29yIGZyb20gJy4vY29yZS9BY2Nlc3Nvci5qcyc7XHJcbmltcG9ydCBBbmltYXRpb25DbGlwIGZyb20gJy4vY29yZS9BbmltYXRpb25DbGlwLmpzJztcclxuXHJcbmNvbnN0IGNhbnZhcyA9IHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcgPyBudWxsIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHTFRGTG9hZGVyIHtcclxuICAgIGNvbnN0cnVjdG9yKHJvb3RQYXRoLCBnbHRmLCBvcHRpb25zKSB7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgICAgICBpZiAoZ2x0Zi5idWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xyXG4gICAgICAgICAgICBjb25zdCB7IGpzb24sIGdsYkJ1ZmZlciB9ID0gR0xCUmVhZGVyLnJlYWQoZ2x0Zi5idWZmZXIsIGdsdGYuYnl0ZU9mZnNldCk7XHJcbiAgICAgICAgICAgIHRoaXMuX2luaXQocm9vdFBhdGgsIGpzb24sIGdsYkJ1ZmZlcik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5faW5pdChyb290UGF0aCwgZ2x0Zik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGxvYWQoKSB7XHJcbiAgICAgICAgLy8gdGhpcy5faW5pdFRleHR1cmUoKTtcclxuICAgICAgICBjb25zdCBnbHRmID0gdGhpcy5fbG9hZFNjZW5lKCk7XHJcbiAgICAgICAgY29uc3QgYW5pbWF0aW9ucyA9IHRoaXMuX2xvYWRBbmltYXRpb25zKCk7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFtnbHRmLCBhbmltYXRpb25zXSkudGhlbihmdWxsZmlsbGVkID0+IHtcclxuICAgICAgICAgICAgZnVsbGZpbGxlZFswXS5hbmltYXRpb25zID0gZnVsbGZpbGxlZFsxXTtcclxuICAgICAgICAgICAgcmV0dXJuIGZ1bGxmaWxsZWRbMF07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGdldEFuaW1hdGlvbkNsaXAoYW5pbU1hdHJpeCwgZ2x0Ziwgbm9kZSwgdGltZSkge1xyXG4gICAgICAgIHJldHVybiBBbmltYXRpb25DbGlwLmdldEFuaW1hdGlvbkNsaXAoYW5pbU1hdHJpeCwgZ2x0Ziwgbm9kZSwgdGltZSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGdldEFuaW1hdGlvblRpbWVTcGFuKGdsdGYpIHtcclxuICAgICAgICByZXR1cm4gQW5pbWF0aW9uQ2xpcC5nZXRUaW1lU3BhbihnbHRmKTtcclxuICAgIH1cclxuXHJcbiAgICBfaW5pdChyb290UGF0aCwgZ2x0ZiwgZ2xiQnVmZmVyKSB7XHJcbiAgICAgICAgdGhpcy5nbHRmID0gZ2x0ZjtcclxuICAgICAgICB0aGlzLnZlcnNpb24gPSBnbHRmLmFzc2V0ID8gK2dsdGYuYXNzZXQudmVyc2lvbiA6IDE7XHJcbiAgICAgICAgdGhpcy5yb290UGF0aCA9IHJvb3RQYXRoO1xyXG4gICAgICAgIHRoaXMuZ2xiQnVmZmVyID0gZ2xiQnVmZmVyO1xyXG4gICAgICAgIHRoaXMuYnVmZmVycyA9IHt9O1xyXG4gICAgICAgIHRoaXMucmVxdWVzdHMgPSB7fTtcclxuICAgICAgICB0aGlzLmFjY2Vzc29yID0gbmV3IEFjY2Vzc29yKHJvb3RQYXRoLCBnbHRmLCBnbGJCdWZmZXIpO1xyXG4gICAgICAgIHRoaXMub3B0aW9ucy5yZXF1ZXN0SW1hZ2UgPSB0aGlzLm9wdGlvbnMucmVxdWVzdEltYWdlIHx8IHJlcXVlc3RJbWFnZTtcclxuICAgICAgICBpZiAodGhpcy52ZXJzaW9uID09PSAyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWRhcHRlciA9IG5ldyBHTFRGVjIocm9vdFBhdGgsIGdsdGYsIGdsYkJ1ZmZlciwgdGhpcy5vcHRpb25zLnJlcXVlc3RJbWFnZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5hZGFwdGVyID0gbmV3IEdMVEZWMShyb290UGF0aCwgZ2x0Zik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIF9sb2FkSW1hZ2VzKClcclxuXHJcbiAgICAvL1Yx5ZKMVjLpnIDopoHlrp7njrDnmoTmlrnms5VcclxuICAgIC8vIGl0ZXJhdGVNZXNoLCBpdGVyYXRlTm9kZSxcclxuXHJcbiAgICBfcGFyc2VOb2Rlcyhub2RlLCBub2RlTWFwKSB7XHJcbiAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4gJiYgbm9kZS5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGlmICghaXNOdW1iZXIobm9kZS5jaGlsZHJlblswXSkgJiYgIWlzU3RyaW5nKG5vZGUuY2hpbGRyZW5bMF0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbm9kZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBjaGlsZHJlbiA9IG5vZGUuY2hpbGRyZW4ubWFwKChjKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjaGlsZE5vZGUgPSBub2RlTWFwW2NdO1xyXG4gICAgICAgICAgICAgICAgY2hpbGROb2RlLm5vZGVJbmRleCA9IGM7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fcGFyc2VOb2RlcyhjaGlsZE5vZGUsIG5vZGVNYXApO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgbm9kZS5jaGlsZHJlbiA9IGNoaWxkcmVuO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL3NraW7lt7Lnu4/lnKhHTFRGVjLkuK3ooqvop6PmnpDkuLpPYmplY3RcclxuICAgICAgICBpZiAoZGVmaW5lZChub2RlLnNraW4pKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNraW5Kb2ludHMgPSAgbm9kZS5za2luLmpvaW50cztcclxuICAgICAgICAgICAgaWYgKHNraW5Kb2ludHMgJiYgc2tpbkpvaW50cy5sZW5ndGggJiYgaXNOdW1iZXIoc2tpbkpvaW50c1swXSkpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGpvaW50cyA9IG5vZGUuc2tpbi5qb2ludHMubWFwKGogPT4gbm9kZU1hcFtqXSk7XHJcbiAgICAgICAgICAgICAgICBub2RlLnNraW4uam9pbnRzID0gam9pbnRzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBub2RlO1xyXG4gICAgfVxyXG5cclxuICAgIF9sb2FkU2NlbmUoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWROb2RlcygpLnRoZW4obm9kZU1hcCA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lcyA9IHRoaXMuc2NlbmVzID0gW107XHJcbiAgICAgICAgICAgIGxldCBkZWZhdWx0U2NlbmU7XHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgaW5kZXggaW4gbm9kZU1hcCkge1xyXG4gICAgICAgICAgICAgICAgbm9kZU1hcFtpbmRleF0gPSB0aGlzLl9wYXJzZU5vZGVzKG5vZGVNYXBbaW5kZXhdLCBub2RlTWFwKTtcclxuICAgICAgICAgICAgICAgIG5vZGVNYXBbaW5kZXhdLm5vZGVJbmRleCA9IE51bWJlcihpbmRleCkgPyBOdW1iZXIoaW5kZXgpIDogaW5kZXg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5hZGFwdGVyLml0ZXJhdGUoKGtleSwgc2NlbmVKU09OLCBpZHgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNjZW5lID0ge307XHJcbiAgICAgICAgICAgICAgICBpZiAoc2NlbmVKU09OLm5hbWUpIHNjZW5lLm5hbWUgPSBzY2VuZUpTT04ubmFtZTtcclxuICAgICAgICAgICAgICAgIGlmIChzY2VuZUpTT04ubm9kZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBzY2VuZS5ub2RlcyA9IHNjZW5lSlNPTi5ub2Rlcy5tYXAobiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBub2RlTWFwW25dO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZ2x0Zi5zY2VuZSA9PT0ga2V5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFNjZW5lID0gaWR4O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc2NlbmVzLnB1c2goc2NlbmUpO1xyXG4gICAgICAgICAgICB9LCAnc2NlbmVzJyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGdsdGYgPSB7XHJcbiAgICAgICAgICAgICAgICBzY2VuZSA6IGRlZmF1bHRTY2VuZSxcclxuICAgICAgICAgICAgICAgIHNjZW5lcyA6IHNjZW5lcyxcclxuICAgICAgICAgICAgICAgIG5vZGVzIDogbm9kZU1hcCxcclxuICAgICAgICAgICAgICAgIG1lc2hlcyA6IHRoaXMubWVzaGVzLFxyXG4gICAgICAgICAgICAgICAgc2tpbnMgOiB0aGlzLnNraW5zXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmdsdGYuZXh0ZW5zaW9ucykge1xyXG4gICAgICAgICAgICAgICAgZ2x0Zi5leHRlbnNpb25zID0gdGhpcy5nbHRmLmV4dGVuc2lvbnM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGdsdGY7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgX2xvYWROb2RlcygpIHtcclxuICAgICAgICAvLyBub2RlIC0+IG1lc2hlcyAtPiBwcmltaXRpdmVzIC0+XHJcbiAgICAgICAgY29uc3QgcHJvbWlzZSA9IHRoaXMuX2xvYWRNZXNoZXMoKTtcclxuICAgICAgICByZXR1cm4gcHJvbWlzZS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgY29uc3Qgbm9kZXMgPSB0aGlzLm5vZGVzID0ge307XHJcbiAgICAgICAgICAgIHRoaXMuYWRhcHRlci5pdGVyYXRlKChrZXksIG5vZGVKU09OKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAvL1RPRE8g57y65bCRIHNraW7vvIwgbW9yZ2ggdGFyZ2V0cyDlkowgZXh0ZW5zaW9uc1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMuYWRhcHRlci5jcmVhdGVOb2RlKG5vZGVKU09OLCB0aGlzLm1lc2hlcywgdGhpcy5za2lucyk7XHJcbiAgICAgICAgICAgICAgICBub2Rlc1trZXldID0gbm9kZTtcclxuICAgICAgICAgICAgfSwgJ25vZGVzJyk7XHJcbiAgICAgICAgICAgIHJldHVybiBub2RlcztcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBfbG9hZFNraW5zKCkge1xyXG4gICAgICAgIHRoaXMuc2tpbnMgPSB7fTtcclxuICAgICAgICBjb25zdCBwcm9taXNlcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuYWRhcHRlci5pdGVyYXRlKChrZXksIHNraW5KU09OLCBpbmRleCkgPT4ge1xyXG4gICAgICAgICAgICBwcm9taXNlcy5wdXNoKHRoaXMuX2xvYWRTa2luKHNraW5KU09OKS50aGVuKHNraW4gPT4ge1xyXG4gICAgICAgICAgICAgICAgc2tpbi5pbmRleCA9IGluZGV4O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5za2luc1trZXldID0gc2tpbjtcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgIH0sICdza2lucycpO1xyXG4gICAgICAgIHJldHVybiBwcm9taXNlcztcclxuICAgIH1cclxuXHJcbiAgICBfbG9hZFNraW4oc2tpbikge1xyXG4gICAgICAgIGNvbnN0IGludmVyc2VCaW5kTWF0cmljZXMgPSBza2luLmludmVyc2VCaW5kTWF0cmljZXM7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYWNjZXNzb3IuX3JlcXVlc3REYXRhKCdpbnZlcnNlQmluZE1hdHJpY2VzJywgaW52ZXJzZUJpbmRNYXRyaWNlcykudGhlbihyZXMgPT4ge1xyXG4gICAgICAgICAgICBza2luLmludmVyc2VCaW5kTWF0cmljZXMgPSByZXM7XHJcbiAgICAgICAgICAgIHJldHVybiBza2luO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIF9sb2FkQW5pbWF0aW9ucygpIHtcclxuICAgICAgICBjb25zdCBhbmltYXRpb25zID0gdGhpcy5nbHRmLmFuaW1hdGlvbnM7XHJcbiAgICAgICAgY29uc3QgcHJvbWlzZSA9IGRlZmluZWQoYW5pbWF0aW9ucykgPyB0aGlzLmFkYXB0ZXIuZ2V0QW5pbWF0aW9ucyhhbmltYXRpb25zKSA6IG51bGw7XHJcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XHJcbiAgICB9XHJcblxyXG4gICAgX2xvYWRNZXNoZXMoKSB7XHJcbiAgICAgICAgdGhpcy5tZXNoZXMgPSB7fTtcclxuICAgICAgICBsZXQgcHJvbWlzZXMgPSBbXTtcclxuICAgICAgICB0aGlzLmFkYXB0ZXIuaXRlcmF0ZSgoa2V5LCBtZXNoSlNPTiwgaW5kZXgpID0+IHtcclxuICAgICAgICAgICAgcHJvbWlzZXMucHVzaCh0aGlzLl9sb2FkTWVzaChtZXNoSlNPTikudGhlbihtZXNoID0+IHtcclxuICAgICAgICAgICAgICAgIC8vcmVjb3JkIG1lc2gncyBpbmRleCB0byByZXVzZSBpdCBhcyBwb3NzaWJsZVxyXG4gICAgICAgICAgICAgICAgbWVzaC5pbmRleCA9IGluZGV4O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tZXNoZXNba2V5XSA9IG1lc2g7XHJcbiAgICAgICAgICAgICAgICAvL3JldHVybiBtZXNoO1xyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgfSwgJ21lc2hlcycpO1xyXG4gICAgICAgIHByb21pc2VzID0gcHJvbWlzZXMuY29uY2F0KHRoaXMuX2xvYWRTa2lucygpKTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xyXG4gICAgfVxyXG5cclxuICAgIF9sb2FkTWVzaChtZXNoKSB7XHJcbiAgICAgICAgLy9UT0RPIOino+aekOadkOi0qFxyXG4gICAgICAgIGNvbnN0IHByaW1pdGl2ZXMgPSBtZXNoLnByaW1pdGl2ZXM7IC8vIGF0dHJpYnV0ZXNcclxuICAgICAgICBjb25zdCBwcm9taXNlcyA9IHByaW1pdGl2ZXMubWFwKHAgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbG9hZFByaW1pdGl2ZShwKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4ocHJpbWl0aXZlcyA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IG91dCA9IHtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgZXh0ZW5kKG91dCwgbWVzaCk7XHJcbiAgICAgICAgICAgIG91dC5wcmltaXRpdmVzID0gcHJpbWl0aXZlcztcclxuICAgICAgICAgICAgcmV0dXJuIG91dDtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBfbG9hZFByaW1pdGl2ZShwcmltSlNPTikge1xyXG4gICAgICAgIC8vIFR5cGVcdERlc2NyaXB0aW9uXHRSZXF1aXJlZFxyXG4gICAgICAgIC8vIGF0dHJpYnV0ZXNcdG9iamVjdFx0QSBkaWN0aW9uYXJ5IG9iamVjdCwgd2hlcmUgZWFjaCBrZXkgY29ycmVzcG9uZHMgdG8gbWVzaCBhdHRyaWJ1dGUgc2VtYW50aWMgYW5kIGVhY2ggdmFsdWUgaXMgdGhlIGluZGV4IG9mIHRoZSBhY2Nlc3NvciBjb250YWluaW5nIGF0dHJpYnV0ZSdzIGRhdGEuXHTinIUgWWVzXHJcbiAgICAgICAgLy8gaW5kaWNlc1x0aW50ZWdlclx0VGhlIGluZGV4IG9mIHRoZSBhY2Nlc3NvciB0aGF0IGNvbnRhaW5zIHRoZSBpbmRpY2VzLlx0Tm9cclxuICAgICAgICAvLyBtYXRlcmlhbFx0aW50ZWdlclx0VGhlIGluZGV4IG9mIHRoZSBtYXRlcmlhbCB0byBhcHBseSB0byB0aGlzIHByaW1pdGl2ZSB3aGVuIHJlbmRlcmluZy5cdE5vXHJcbiAgICAgICAgLy8gbW9kZVx0aW50ZWdlclx0VGhlIHR5cGUgb2YgcHJpbWl0aXZlcyB0byByZW5kZXIuXHRObywgZGVmYXVsdDogNFxyXG4gICAgICAgIC8vIHRhcmdldHNcdG9iamVjdCBbMS0qXVx0QW4gYXJyYXkgb2YgTW9ycGggVGFyZ2V0cywgZWFjaCBNb3JwaCBUYXJnZXQgaXMgYSBkaWN0aW9uYXJ5IG1hcHBpbmcgYXR0cmlidXRlcyAob25seSBQT1NJVElPTiwgTk9STUFMLCBhbmQgVEFOR0VOVCBzdXBwb3J0ZWQpIHRvIHRoZWlyIGRldmlhdGlvbnMgaW4gdGhlIE1vcnBoIFRhcmdldC5cdE5vXHJcbiAgICAgICAgLy8gZXh0ZW5zaW9uc1x0b2JqZWN0XHREaWN0aW9uYXJ5IG9iamVjdCB3aXRoIGV4dGVuc2lvbi1zcGVjaWZpYyBvYmplY3RzLlx0Tm9cclxuICAgICAgICAvLyBleHRyYXNcdGFueVx0QXBwbGljYXRpb24tc3BlY2lmaWMgZGF0YS5cdE5vXHJcblxyXG4gICAgICAgIGNvbnN0IHByb21pc2VzID0gW107XHJcbiAgICAgICAgY29uc3QgYXR0cmlidXRlcyA9IHByaW1KU09OLmF0dHJpYnV0ZXM7XHJcbiAgICAgICAgY29uc3QgbWF0UHJvbWlzZSA9IHRoaXMuX2xvYWRNYXRlcmlhbChwcmltSlNPTik7XHJcbiAgICAgICAgLy8gdG8ga2VlcCBpdCBzaW1wbGUsIHJlYWQgYmFzZUNvbG9yIHRleHR1cmUgZnJvbSBnbHRmLnRleHR1cmVzIGRpcmVjdGx5LlxyXG4gICAgICAgIGlmIChtYXRQcm9taXNlKSBwcm9taXNlcy5wdXNoKG1hdFByb21pc2UpO1xyXG4gICAgICAgIGxldCBtYXRlcmlhbCA9IG51bGw7XHJcbiAgICAgICAgZm9yIChjb25zdCBhdHRyIGluIGF0dHJpYnV0ZXMpIHtcclxuICAgICAgICAgICAgLy9lLmcuICAgICAgICAgIE5PUk1BTCwgMFxyXG4gICAgICAgICAgICBjb25zdCBwcm9taXNlID0gdGhpcy5hY2Nlc3Nvci5fcmVxdWVzdERhdGEoYXR0ciwgYXR0cmlidXRlc1thdHRyXSk7XHJcbiAgICAgICAgICAgIGlmIChwcm9taXNlKSB7XHJcbiAgICAgICAgICAgICAgICBwcm9taXNlcy5wdXNoKHByb21pc2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZGVmaW5lZChwcmltSlNPTi5pbmRpY2VzKSkge1xyXG4gICAgICAgICAgICBjb25zdCBwcm9taXNlID0gdGhpcy5hY2Nlc3Nvci5fcmVxdWVzdERhdGEoJ2luZGljZXMnLCBwcmltSlNPTi5pbmRpY2VzKTtcclxuICAgICAgICAgICAgaWYgKHByb21pc2UpIHtcclxuICAgICAgICAgICAgICAgIHByb21pc2VzLnB1c2gocHJvbWlzZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChkZWZpbmVkKHByaW1KU09OLnRhcmdldHMpKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJpbUpTT04udGFyZ2V0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gcHJpbUpTT04udGFyZ2V0c1tpXTtcclxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgYXR0ciBpbiB0YXJnZXQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9taXNlID0gdGhpcy5hY2Nlc3Nvci5fcmVxdWVzdERhdGEoYCR7YXR0cn1fJHtpfWAsIHRhcmdldFthdHRyXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb21pc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXMucHVzaChwcm9taXNlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbihhc3NldHMgPT4ge1xyXG4gICAgICAgICAgICBsZXQgaW5kaWNlcztcclxuICAgICAgICAgICAgdGhpcy50cmFuc2ZlcmFibGVzID0gW107XHJcbiAgICAgICAgICAgIGNvbnN0IGF0dHJEYXRhID0gYXNzZXRzLnJlZHVjZSgoYWNjdW11bGF0b3IsIGN1cnJlbnRWYWx1ZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRWYWx1ZS5tYXRlcmlhbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1hdGVyaWFsID0gY3VycmVudFZhbHVlLm1hdGVyaWFsO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50VmFsdWUudHJhbnNmZXJhYmxlcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWUudHJhbnNmZXJhYmxlcy5mb3JFYWNoKGJ1ZmZlciA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50cmFuc2ZlcmFibGVzLmluZGV4T2YoYnVmZmVyKSA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zZmVyYWJsZXMucHVzaChidWZmZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50VmFsdWUubmFtZSA9PT0gJ2luZGljZXMnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGljZXMgPSBjdXJyZW50VmFsdWUuYXJyYXk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWNjdW11bGF0b3JbY3VycmVudFZhbHVlLm5hbWVdID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyYXkgOiBjdXJyZW50VmFsdWUuYXJyYXksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtU2l6ZSA6ICBjdXJyZW50VmFsdWUuaXRlbVNpemUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3JlY29yZCBhY2Nlc3Nvck5hbWUgdG8gcmV1c2UgdGhlIGJ1ZmZlciBhcyBwb3NzaWJsZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWNjZXNzb3JOYW1lIDogY3VycmVudFZhbHVlLmFjY2Vzc29yTmFtZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50cmFuc2ZlcmFibGVzLmluZGV4T2YoY3VycmVudFZhbHVlLmFycmF5LmJ1ZmZlcikgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNmZXJhYmxlcy5wdXNoKGN1cnJlbnRWYWx1ZS5hcnJheS5idWZmZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBhY2N1bXVsYXRvcjtcclxuICAgICAgICAgICAgfSwge30pO1xyXG4gICAgICAgICAgICBjb25zdCBwcmltaXRpdmUgPSB7XHJcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzIDogYXR0ckRhdGEsXHJcbiAgICAgICAgICAgICAgICBtYXRlcmlhbFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBpZiAoaW5kaWNlcykgcHJpbWl0aXZlLmluZGljZXMgPSBpbmRpY2VzO1xyXG4gICAgICAgICAgICBwcmltaXRpdmUubW9kZSA9IGRlZmluZWQocHJpbUpTT04ubW9kZSkgPyBwcmltSlNPTi5tb2RlIDogNDsgLy9kZWZhdWx0IG1vZGUgaXMgdHJpYW5nbGVzXHJcbiAgICAgICAgICAgIGlmIChkZWZpbmVkKHByaW1KU09OLmV4dHJhcykpIHByaW1pdGl2ZS5leHRyYXMgPSBwcmltSlNPTi5leHRyYXM7XHJcbiAgICAgICAgICAgIC8vVE9ETyBtYXRlcmlhbCDlkowgdGFyZ2V0cyDmsqHmnInlpITnkIZcclxuICAgICAgICAgICAgcmV0dXJuIHByaW1pdGl2ZTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBfbG9hZE1hdGVyaWFsKHByaW1KU09OKSB7XHJcbiAgICAgICAgY29uc3QgbWF0ZXJpYWwgPSBwcmltSlNPTi5tYXRlcmlhbDtcclxuICAgICAgICBpZiAodGhpcy52ZXJzaW9uID09PSAyKSB7XHJcbiAgICAgICAgICAgIGlmICghZGVmaW5lZChtYXRlcmlhbCkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IG1hdFByb21pc2UgPSB0aGlzLmFkYXB0ZXIuZ2V0TWF0ZXJpYWwobWF0ZXJpYWwpO1xyXG4gICAgICAgICAgICByZXR1cm4gbWF0UHJvbWlzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy92ZXJzaW9uIDFcclxuICAgICAgICBjb25zdCB0ZXh0dXJlID0gdGhpcy5hZGFwdGVyLmdldEJhc2VDb2xvclRleHR1cmUobWF0ZXJpYWwpO1xyXG4gICAgICAgIGlmICghdGV4dHVyZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgcHJvbWlzZSA9IHRoaXMuX2xvYWRJbWFnZSh0ZXh0dXJlLnNvdXJjZSk7XHJcbiAgICAgICAgcmV0dXJuIHByb21pc2UudGhlbihpbWFnZSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zZmVyYWJsZXMgPSBbaW1hZ2UuYnVmZmVyXTtcclxuICAgICAgICAgICAgY29uc3Qgc291cmNlID0gdGV4dHVyZS5zb3VyY2U7XHJcbiAgICAgICAgICAgIC8vcmVjb3JkIGluZGV4IG9mIHRoZSBpbWFnZSwgdG8gcmV1c2UgaXQgYXMgcG9zc2libGVcclxuICAgICAgICAgICAgaW1hZ2UuaW5kZXggPSBzb3VyY2U7XHJcbiAgICAgICAgICAgIGV4dGVuZCh0ZXh0dXJlLnNvdXJjZSwgc291cmNlKTtcclxuICAgICAgICAgICAgdGV4dHVyZS5zb3VyY2UuaW1hZ2UgPSBpbWFnZTtcclxuICAgICAgICAgICAgLy8gaWYgKHNvdXJjZS51cmkpIHRleHR1cmUuc291cmNlLnVyaSA9IHNvdXJjZS51cmk7XHJcbiAgICAgICAgICAgIC8vIGlmIChzb3VyY2UubmFtZSkgdGV4dHVyZS5zb3VyY2UubmFtZSA9IHNvdXJjZS5uYW1lO1xyXG4gICAgICAgICAgICAvLyBpZiAoc291cmNlLmV4dGVuc2lvbnMpIHRleHR1cmUuc291cmNlLmV4dGVuc2lvbnMgPSBzb3VyY2UuZXh0ZW5zaW9ucztcclxuICAgICAgICAgICAgLy8gaWYgKHNvdXJjZS5leHRyYXMpIHRleHR1cmUuc291cmNlLmV4dHJhcyA9IHNvdXJjZS5leHRyYXM7XHJcbiAgICAgICAgICAgIC8vIGlmIChzb3VyY2UubWltZVR5cGUpIHRleHR1cmUuc291cmNlLm1pbWVUeXBlID0gc291cmNlLm1pbWVUeXBlO1xyXG4gICAgICAgICAgICAvLyBpZiAoc291cmNlLndpZHRoKSB0ZXh0dXJlLnNvdXJjZS53aWR0aCA9IHNvdXJjZS53aWR0aDtcclxuICAgICAgICAgICAgLy8gaWYgKHNvdXJjZS5oZWlnaHQpIHRleHR1cmUuc291cmNlLmhlaWdodCA9IHNvdXJjZS5oZWlnaHQ7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHtcclxuICAgICAgICAgICAgICAgIGJhc2VDb2xvclRleHR1cmUgOiB0ZXh0dXJlXHJcbiAgICAgICAgICAgICAgICAvL1RPRE8g5YW25LuW5p2Q6LSo55qE6K+75Y+WXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGlmIChtYXRlcmlhbC5uYW1lKSByZXN1bHQubmFtZSA9IG1hdGVyaWFsLm5hbWU7XHJcbiAgICAgICAgICAgIGlmIChtYXRlcmlhbC5leHRlbnNpb25zKSByZXN1bHQuZXh0ZW5zaW9ucyA9IG1hdGVyaWFsLmV4dGVuc2lvbnM7XHJcbiAgICAgICAgICAgIGlmIChyZXN1bHQuZXh0ZW5zaW9ucykge1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIHJlc3VsdC5leHRlbnNpb25zWydLSFJfYmluYXJ5X2dsVEYnXTtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSByZXN1bHQuZXh0ZW5zaW9uc1snYmluYXJ5X2dsVEYnXTtcclxuICAgICAgICAgICAgICAgIGlmIChPYmplY3Qua2V5cyhyZXN1bHQuZXh0ZW5zaW9ucykubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHJlc3VsdC5leHRlbnNpb25zO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChtYXRlcmlhbC5leHRyYXMpIHJlc3VsdC5leHRyYXMgPSBtYXRlcmlhbC5leHRyYXM7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBtYXRlcmlhbCA6IHJlc3VsdCxcclxuICAgICAgICAgICAgICAgIHRyYW5zZmVyYWJsZXNcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBfbG9hZEltYWdlKHNvdXJjZSkge1xyXG4gICAgICAgIGlmIChzb3VyY2UuYnVmZmVyVmlldyB8fCBzb3VyY2UuZXh0ZW5zaW9ucyAmJiAoc291cmNlLmV4dGVuc2lvbnNbJ0tIUl9iaW5hcnlfZ2xURiddIHx8IHNvdXJjZS5leHRlbnNpb25zWydiaW5hcnlfZ2xURiddKSkge1xyXG4gICAgICAgICAgICBjb25zdCBiaW5hcnkgPSBzb3VyY2UuYnVmZmVyVmlldyA/IHNvdXJjZSA6IHNvdXJjZS5leHRlbnNpb25zWydLSFJfYmluYXJ5X2dsVEYnXSB8fCBzb3VyY2UuZXh0ZW5zaW9uc1snYmluYXJ5X2dsVEYnXTtcclxuICAgICAgICAgICAgaWYgKHNvdXJjZS5leHRlbnNpb25zKSB7XHJcbiAgICAgICAgICAgICAgICBzb3VyY2UubWltZVR5cGUgPSBiaW5hcnkubWltZVR5cGU7XHJcbiAgICAgICAgICAgICAgICBzb3VyY2Uud2lkdGggPSBiaW5hcnkud2lkdGg7XHJcbiAgICAgICAgICAgICAgICBzb3VyY2UuaGVpZ2h0ID0gYmluYXJ5LmhlaWdodDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5idWZmZXJzW2JpbmFyeS5idWZmZXJWaWV3XSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLmJ1ZmZlcnNbYmluYXJ5LmJ1ZmZlclZpZXddKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBidWZmZXJWaWV3ID0gdGhpcy5nbHRmLmJ1ZmZlclZpZXdzW2JpbmFyeS5idWZmZXJWaWV3XTtcclxuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSAoYnVmZmVyVmlldy5ieXRlT2Zmc2V0IHx8IDApICsgdGhpcy5nbGJCdWZmZXIuYnl0ZU9mZnNldDtcclxuICAgICAgICAgICAgY29uc3QgbGVuZ3RoID0gYnVmZmVyVmlldy5ieXRlTGVuZ3RoO1xyXG4gICAgICAgICAgICBjb25zdCBidWZmZXIgPSB0aGlzLmJ1ZmZlcnNbYmluYXJ5LmJ1ZmZlclZpZXddID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5nbGJCdWZmZXIuYnVmZmVyLCBzdGFydCwgbGVuZ3RoKTtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShidWZmZXIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vbG9hZCBmcm9tIGV4dGVybmFsIHVyaVxyXG4gICAgICAgICAgICBjb25zdCBiaW4gPSBzb3VyY2UudXJpO1xyXG4gICAgICAgICAgICBjb25zdCB1cmwgPSB0aGlzLnJvb3RQYXRoICsgJy8nICsgYmluO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5yZXF1ZXN0c1t1cmxdKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBhIHByb21pc2UgYWxyZWFkeSBjcmVhdGVkXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZXF1ZXN0c1t1cmxdLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmJ1ZmZlcnNbdXJsXTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IHByb21pc2UgPSB0aGlzLnJlcXVlc3RzW3VybF0gPSBBamF4LmdldEFycmF5QnVmZmVyKHVybCwgbnVsbCkudGhlbihyZXNwb25zZSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBidWZmZXIgPSByZXNwb25zZS5kYXRhO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5idWZmZXJzW3VybF0gPSBidWZmZXI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuLy/pu5jorqTnmoRpbWFnZeivu+WPluaWueazle+8jOWPr+WcqG9wdGlvbnPkuK3mm7/mjaLvvIzkvovlpoLnlLF3b3JrZXLkvKDlm57nu5nkuLvnur/nqIvop6PmnpBcclxuZnVuY3Rpb24gcmVxdWVzdEltYWdlKHVybCwgY2IpIHtcclxuICAgIGNvbnN0IGltYWdlID0gbmV3IEltYWdlKCk7XHJcbiAgICBpbWFnZS5jcm9zc09yaWdpbiA9ICcnO1xyXG4gICAgaW1hZ2Uub25sb2FkID0gKCkgPT4ge1xyXG4gICAgICAgIGlmICghY2FudmFzKSB7XHJcbiAgICAgICAgICAgIGNiKG5ldyBFcnJvcignVGhlcmUgaXMgbm8gY2FudmFzIHRvIGRyYXcgaW1hZ2UhJykpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhbnZhcy53aWR0aCA9IGltYWdlLndpZHRoO1xyXG4gICAgICAgIGNhbnZhcy5oZWlnaHQgPSBpbWFnZS5oZWlnaHQ7XHJcbiAgICAgICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICAgICAgY3R4LmRyYXdJbWFnZShpbWFnZSwgMCwgMCwgaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XHJcbiAgICAgICAgY29uc3QgaW1nRGF0YSA9IGN0eC5nZXRJbWFnZURhdGEoMCwgMCwgaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XHJcbiAgICAgICAgLy9UT0RPLCByZXRpbmEgbWF5IG5lZWQgc3BlY2lhbCBvcGVyYXRpb25zXHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0geyB3aWR0aCA6IGltYWdlLndpZHRoLCBoZWlnaHQgOiBpbWFnZS5oZWlnaHQsIGRhdGEgOiBuZXcgVWludDhBcnJheShpbWdEYXRhLmRhdGEpIH07XHJcbiAgICAgICAgY2IobnVsbCwgcmVzdWx0KTtcclxuICAgIH07XHJcbiAgICBpbWFnZS5vbmVycm9yID0gZnVuY3Rpb24gKGVycikge1xyXG4gICAgICAgIGNiKGVycik7XHJcbiAgICB9O1xyXG4gICAgaW1hZ2Uuc3JjID0gdXJsO1xyXG59XHJcbiJdLCJuYW1lcyI6WyJnbG9iYWwiLCJ0aGlzIiwicHJvbWlzZSIsIlByb21pc2UiLCJab3VzYW4iLCJBamF4IiwiZ2V0IiwidXJsIiwib3B0aW9ucyIsImNsaWVudCIsIl9nZXRDbGllbnQiLCJyZXNvbHZlIiwicmVqZWN0Iiwib3BlbiIsImsiLCJoZWFkZXJzIiwic2V0UmVxdWVzdEhlYWRlciIsIndpdGhDcmVkZW50aWFscyIsImNyZWRlbnRpYWxzIiwicmVzcG9uc2VUeXBlIiwib25yZWFkeXN0YXRlY2hhbmdlIiwiX3dyYXBDYWxsYmFjayIsImVyciIsImRhdGEiLCJzZW5kIiwieGhyIiwiY2IiLCJyZWFkeVN0YXRlIiwic3RhdHVzIiwicmVzcG9uc2UiLCJieXRlTGVuZ3RoIiwiRXJyb3IiLCJjYWNoZUNvbnRyb2wiLCJnZXRSZXNwb25zZUhlYWRlciIsImV4cGlyZXMiLCJjb250ZW50VHlwZSIsInJlc3BvbnNlVGV4dCIsInN0YXR1c1RleHQiLCJYTUxIdHRwUmVxdWVzdCIsImUiLCJBY3RpdmVYT2JqZWN0IiwiZ2V0QXJyYXlCdWZmZXIiLCJnZXRKU09OIiwicCIsInRoZW4iLCJKU09OIiwicGFyc2UiLCJpc05pbCIsIm9iaiIsImRlZmluZWQiLCJpc051bWJlciIsImlzRmluaXRlIiwiaXNTdHJpbmciLCJjb25zdHJ1Y3RvciIsIlN0cmluZyIsImV4dGVuZCIsImRlc3QiLCJpIiwiYXJndW1lbnRzIiwibGVuZ3RoIiwic3JjIiwibGVycCIsIm91dCIsImEiLCJiIiwidCIsInNldCIsImlucHV0IiwiVjEiLCJyb290UGF0aCIsImdsdGYiLCJpdGVyYXRlIiwicHJvcGVydHlOYW1lIiwicHJvcGVydGllcyIsImluZGV4IiwiY3JlYXRlTm9kZSIsIm5vZGVKU09OIiwibWVzaGVzIiwibm9kZSIsIm5hbWUiLCJjaGlsZHJlbiIsImpvaW50TmFtZSIsIm1hdHJpeCIsInJvdGF0aW9uIiwic2NhbGUiLCJ0cmFuc2xhdGlvbiIsImV4dHJhcyIsIm1hcCIsIm0iLCJnZXRCYXNlQ29sb3JUZXh0dXJlIiwibWF0ZXJpYWwiLCJtYXRlcmlhbHMiLCJ0ZWNoIiwidGV4SWQiLCJ2YWx1ZXMiLCJ1bmRlZmluZWQiLCJ0ZXh0dXJlcyIsInRleHR1cmUiLCJzYW1wbGVyIiwic2FtcGxlcnMiLCJpbmZvIiwiZm9ybWF0IiwiaW50ZXJuYWxGb3JtYXQiLCJ0eXBlIiwic291cmNlIiwiaW1hZ2VzIiwiZ2V0TWF0ZXJpYWwiLCJnZXRBbmltYXRpb25zIiwiVFlQRVMiLCJBY2Nlc3NvciIsImdsYkJ1ZmZlciIsImJ1ZmZlcnMiLCJyZXF1ZXN0cyIsIl9yZXF1ZXN0RGF0YSIsImFjY2Vzc29yTmFtZSIsImFjY2Vzc29yIiwiYWNjZXNzb3JzIiwiYnVmZmVyVmlldyIsImJ1ZmZlclZpZXdzIiwiYnVmZmVyIiwidXJpIiwiX3RvVHlwZWRBcnJheSIsImJ5dGVPZmZzZXQiLCJhcnJheSIsIml0ZW1TaXplIiwiYmluIiwiaW5kZXhPZiIsImFycmF5QnVmZmVyIiwib2Zmc2V0Iiwic3RhcnQiLCJfZ2V0VHlwZUl0ZW1TaXplIiwiQXJyYXlDdG9yIiwiX2dldEFycmF5Q3RvciIsImNvbXBvbmVudFR5cGUiLCJieXRlU3RyaWRlIiwiQllURVNfUEVSX0VMRU1FTlQiLCJjb25zb2xlIiwid2FybiIsInNsaWNlIiwiY291bnQiLCJJbnQ4QXJyYXkiLCJVaW50OEFycmF5IiwiSW50MTZBcnJheSIsIlVpbnQxNkFycmF5IiwiSW50MzJBcnJheSIsIlVpbnQzMkFycmF5IiwiRmxvYXQzMkFycmF5IiwidHlwZUlkeCIsIlYyIiwicmVxdWVzdEltYWdlIiwiX3JlcXVlc3RJbWFnZSIsInNraW5zIiwibWVzaCIsInNraW4iLCJza2luSW5kZXgiLCJ3ZWlnaHRzIiwicGJyTWV0YWxsaWNSb3VnaG5lc3MiLCJub3JtYWxUZXh0dXJlSW5mbyIsIm5vcm1hbFRleHR1cmUiLCJvY2NsdXNpb25UZXh0dXJlSW5mbyIsIm9jY2x1c2lvblRleHR1cmUiLCJlbWlzc2l2ZVRleHR1cmVJbmZvIiwiZW1pc3NpdmVUZXh0dXJlIiwiZXh0ZW5zaW9ucyIsInByb21pc2VzIiwicHVzaCIsIl9nZXRQQlJNYXRlcmlhbCIsIl9nZXRUZXh0dXJlSW5mbyIsInBiclNwZWN1bGFyR2xvc3NpbmVzcyIsImFsbCIsImFzc2V0cyIsInVubGl0IiwicHJiTWF0ZXJpYWwiLCJ0ZXhJbmZvIiwiX2dldFRleHR1cmUiLCJyZXN1bHQiLCJpbWFnZSIsIl9sb2FkSW1hZ2UiLCJ3aWR0aCIsImhlaWdodCIsIm1pbWVUeXBlIiwiYnVmZmVyT2JqIiwiX3JlcXVlc3RGcm9tQXJyYXlCdWZmZXIiLCJfcmVxdWVzdEZyb21HbGJCdWZmZXIiLCJmaWxlIiwiX3JlcXVlc3RGcm9tVXJsIiwiX2dldEltYWdlSW5mbyIsImtleSIsImJ1ZmZlckRhdGEiLCJkYXRhdmlldyIsIl9jcmVhdGVEYXRhVmlldyIsImJsb2IiLCJCbG9iIiwic291cmNlVVJJIiwiVVJMIiwiY3JlYXRlT2JqZWN0VVJMIiwiX3RyYW5zZm9ybUFycmF5QnVmZmVyVG9CYXNlNjQiLCJiaW5hcnkiLCJBcnJheSIsImZyb21DaGFyQ29kZSIsImpvaW4iLCJiYXNlNjRVcmwiLCJ3aW5kb3ciLCJidG9hIiwidW5lc2NhcGUiLCJlbmNvZGVVUklDb21wb25lbnQiLCJhbmltYXRpb25zIiwiZm9yRWFjaCIsImFuaW1hdGlvbiIsImdldFNhbXBsZXJzIiwib3V0cHV0IiwiaW50ZXJwb2xhdGlvbiIsInRleHREZWNvZGVyIiwiVGV4dERlY29kZXIiLCJCSU5BUllfRVhURU5TSU9OX0hFQURFUl9MRU5HVEgiLCJCSU5BUllfRVhURU5TSU9OX0NIVU5LX1RZUEVTIiwiQklOIiwiR0xCUmVhZGVyIiwicmVhZCIsImdsYiIsImdsYk9mZnNldCIsImRhdGFWaWV3IiwiRGF0YVZpZXciLCJ2ZXJzaW9uIiwiZ2V0VWludDMyIiwicmVhZFYxIiwicmVhZFYyIiwiY29udGVudExlbmd0aCIsImpzb24iLCJyZWFkU3RyaW5nIiwiY2h1bmtWaWV3IiwiY2h1bmtJbmRleCIsImNodW5rTGVuZ3RoIiwiY2h1bmtUeXBlIiwiYXJyIiwiZGVjb2RlIiwic3RyaW5nRnJvbVVURjhBcnJheSIsImV4dHJhQnl0ZU1hcCIsInN0ciIsImNoIiwiZXh0cmEiLCJjaHgiLCJjcmVhdGUiLCJnbE1hdHJpeC5BUlJBWV9UWVBFIiwiY2xvbmUiLCJmcm9tVmFsdWVzIiwiY29weSIsImFkZCIsInN1YnRyYWN0IiwibXVsdGlwbHkiLCJnbE1hdHJpeC5SQU5ET00iLCJyb3RhdGVYIiwicm90YXRlWSIsInJvdGF0ZVoiLCJleGFjdEVxdWFscyIsImVxdWFscyIsImdsTWF0cml4LkVQU0lMT04iLCJzdWIiLCJtdWwiLCJkaXZpZGUiLCJjZWlsIiwiZmxvb3IiLCJtaW4iLCJtYXgiLCJyb3VuZCIsInNjYWxlQW5kQWRkIiwiZGlzdGFuY2UiLCJzcXVhcmVkRGlzdGFuY2UiLCJzcXVhcmVkTGVuZ3RoIiwibmVnYXRlIiwiaW52ZXJzZSIsIm5vcm1hbGl6ZSIsImRvdCIsInJhbmRvbSIsInRyYW5zZm9ybU1hdDQiLCJ0cmFuc2Zvcm1RdWF0IiwiZGl2IiwiZGlzdCIsInNxckRpc3QiLCJsZW4iLCJzcXJMZW4iLCJ2ZWM0Lm5vcm1hbGl6ZSIsInZlYzMuY3JlYXRlIiwidmVjMy5mcm9tVmFsdWVzIiwidmVjMy5kb3QiLCJ2ZWMzLmNyb3NzIiwidmVjMy5sZW4iLCJ2ZWMzLm5vcm1hbGl6ZSIsIm1hdDMuY3JlYXRlIiwiVCIsIlIiLCJTIiwiREVGQVVMVF9WQUxVRVMiLCJUUkFOU0xBVElPTiIsIlJPVEFUSU9OIiwiU0NBTEUiLCJDTElQX1BSRU5FWFQiLCJQUkVWSU9VUyIsIk5FWFQiLCJQUkVJTkRFWCIsIk5FWFRJTkRFWCIsIklOVEVSUE9MQVRJT04iLCJBbmltYXRpb25DbGlwIiwiX2dldFRSU1ciLCJ0aW1lIiwiY2hhbm5lbHMiLCJqIiwiY2hhbm5lbCIsInRhcmdldCIsInBhdGgiLCJfZ2V0QW5pbWF0ZURhdGEiLCJfZ2V0UXVhdGVybmlvbiIsInN0cmlkZSIsInByZU5leHQiLCJfZ2V0UHJlTmV4dCIsIl9nZXRDdWJpY1NwbGluZSIsInF1YXQiLCJ2ZWM0IiwiTWF0aCIsImFjb3MiLCJjb3MiLCJwcmVJbmR4IiwibmV4dEluZGV4IiwicHJldmlvdXNUaW1lIiwibmV4dFRpbWUiLCJzdWJhcnJheSIsInRrIiwidGsxIiwicDAiLCJtMCIsInAxIiwibTEiLCJwdGkiLCJwb3ciLCJnZXRBbmltYXRpb25DbGlwIiwiYW5pbU1hdHJpeCIsIm5vZGVzIiwidmVjMyIsIm1hdDQiLCJnZXRUaW1lU3BhbiIsIkluZmluaXR5IiwiY2FudmFzIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiR0xURkxvYWRlciIsIkFycmF5QnVmZmVyIiwiX2luaXQiLCJsb2FkIiwiX2xvYWRTY2VuZSIsIl9sb2FkQW5pbWF0aW9ucyIsImZ1bGxmaWxsZWQiLCJnZXRBbmltYXRpb25UaW1lU3BhbiIsImFzc2V0IiwiYWRhcHRlciIsIkdMVEZWMiIsIkdMVEZWMSIsIl9wYXJzZU5vZGVzIiwibm9kZU1hcCIsImMiLCJjaGlsZE5vZGUiLCJub2RlSW5kZXgiLCJza2luSm9pbnRzIiwiam9pbnRzIiwiX2xvYWROb2RlcyIsInNjZW5lcyIsImRlZmF1bHRTY2VuZSIsIk51bWJlciIsInNjZW5lSlNPTiIsImlkeCIsInNjZW5lIiwibiIsIl9sb2FkTWVzaGVzIiwiX2xvYWRTa2lucyIsInNraW5KU09OIiwiX2xvYWRTa2luIiwiaW52ZXJzZUJpbmRNYXRyaWNlcyIsInJlcyIsIm1lc2hKU09OIiwiX2xvYWRNZXNoIiwiY29uY2F0IiwicHJpbWl0aXZlcyIsIl9sb2FkUHJpbWl0aXZlIiwicHJpbUpTT04iLCJhdHRyaWJ1dGVzIiwibWF0UHJvbWlzZSIsIl9sb2FkTWF0ZXJpYWwiLCJhdHRyIiwiaW5kaWNlcyIsInRhcmdldHMiLCJ0cmFuc2ZlcmFibGVzIiwiYXR0ckRhdGEiLCJyZWR1Y2UiLCJhY2N1bXVsYXRvciIsImN1cnJlbnRWYWx1ZSIsInByaW1pdGl2ZSIsIm1vZGUiLCJiYXNlQ29sb3JUZXh0dXJlIiwiT2JqZWN0Iiwia2V5cyIsIkltYWdlIiwiY3Jvc3NPcmlnaW4iLCJvbmxvYWQiLCJjdHgiLCJnZXRDb250ZXh0IiwiZHJhd0ltYWdlIiwiaW1nRGF0YSIsImdldEltYWdlRGF0YSIsIm9uZXJyb3IiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQUFBLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxBQUFhLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxHQUFHLE9BQU8sZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLE9BQU8sT0FBTyxPQUFPLEdBQUcsQ0FBQyxFQUFFLFVBQVUsRUFBRSxPQUFPLE9BQU8sQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxPQUFPLFlBQVksR0FBRyxDQUFDLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLElBQUksZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxZQUFZLENBQUMsQ0FBQyxDQUFDLE1BQU0sSUFBSSxTQUFTLENBQUMsNkNBQTZDLENBQUMsQ0FBQyxHQUFHLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxTQUFTLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLFNBQVMsQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsRUFBRSxPQUFPLENBQUMsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUMsT0FBTyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyw4QkFBOEIsRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsNkNBQTZDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FB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QUFHLEVBQUUsQ0FBQztDQUNsQixFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNoQixFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNoQixFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7Q0FFaEIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztDQUNoQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDO0NBQzFCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUM7Q0FDMUIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ2IsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQztDQUMxQixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO0NBQ2hDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUM7Q0FDMUIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ2IsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQztDQUMxQixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDO0NBQzFCLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7Q0FDakMsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ2QsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2pCLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNqQixFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDakIsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDOztDQUVkLEVBQUUsT0FBTyxHQUFHLENBQUM7Q0FDYixDQUFDOztDQ3ZyQ0Q7Q0FDQTtDQUNBO0NBQ0E7O0NBRUE7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtBQUNBLENBQU8sU0FBU0QsUUFBTSxHQUFHO0NBQ3pCLEVBQUUsSUFBSSxHQUFHLEdBQUcsSUFBSUMsVUFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN2QyxFQUFFLElBQUlBLFVBQW1CLElBQUksWUFBWSxFQUFFO0NBQzNDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNmLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNmLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNmLEdBQUc7Q0FDSCxFQUFFLE9BQU8sR0FBRyxDQUFDO0NBQ2IsQ0FBQzs7Q0FFRDtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7QUFDQSxDQUFPLFNBQVNDLE9BQUssQ0FBQyxDQUFDLEVBQUU7Q0FDekIsRUFBRSxJQUFJLEdBQUcsR0FBRyxJQUFJRCxVQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3ZDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNoQixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDaEIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2hCLEVBQUUsT0FBTyxHQUFHLENBQUM7Q0FDYixDQUFDOztDQUVEO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtBQUNBLENBQU8sU0FBUyxNQUFNLENBQUMsQ0FBQyxFQUFFO0NBQzFCLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2YsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDZixFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNmLEVBQUUsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7Q0FDMUMsQ0FBQzs7Q0FFRDtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0FBQ0EsQ0FBTyxTQUFTRSxZQUFVLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7Q0FDcEMsRUFBRSxJQUFJLEdBQUcsR0FBRyxJQUFJRixVQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3ZDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNiLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNiLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNiLEVBQUUsT0FBTyxHQUFHLENBQUM7Q0FDYixDQUFDOztDQUVEO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0FBQ0EsQ0FBTyxTQUFTRyxNQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRTtDQUM3QixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDaEIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2hCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNoQixFQUFFLE9BQU8sR0FBRyxDQUFDO0NBQ2IsQ0FBQzs7Q0FFRDtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7QUFDQSxDQUFPLFNBQVNwTCxLQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0NBQ2xDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNiLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNiLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNiLEVBQUUsT0FBTyxHQUFHLENBQUM7Q0FDYixDQUFDOztDQUVEO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7QUFDQSxDQUFPLFNBQVNxTCxLQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7Q0FDL0IsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN2QixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3ZCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDdkIsRUFBRSxPQUFPLEdBQUcsQ0FBQztDQUNiLENBQUM7O0NBRUQ7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtBQUNBLENBQU8sU0FBU0MsVUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0NBQ3BDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDdkIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN2QixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3ZCLEVBQUUsT0FBTyxHQUFHLENBQUM7Q0FDYixDQUFDOztDQUVEO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7QUFDQSxDQUFPLFNBQVNDLFVBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtDQUNwQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3ZCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDdkIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN2QixFQUFFLE9BQU8sR0FBRyxDQUFDO0NBQ2IsQ0FBQzs7Q0FFRDtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0FBQ0EsQ0FBTyxTQUFTLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtDQUNsQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3ZCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDdkIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN2QixFQUFFLE9BQU8sR0FBRyxDQUFDO0NBQ2IsQ0FBQzs7Q0FFRDtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtBQUNBLENBQU8sU0FBUyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRTtDQUM3QixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQzNCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDM0IsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUMzQixFQUFFLE9BQU8sR0FBRyxDQUFDO0NBQ2IsQ0FBQzs7Q0FFRDtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtBQUNBLENBQU8sU0FBUyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRTtDQUM5QixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQzVCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDNUIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUM1QixFQUFFLE9BQU8sR0FBRyxDQUFDO0NBQ2IsQ0FBQzs7Q0FFRDtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0FBQ0EsQ0FBTyxTQUFTLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtDQUMvQixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNoQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNoQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNoQyxFQUFFLE9BQU8sR0FBRyxDQUFDO0NBQ2IsQ0FBQzs7Q0FFRDtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0FBQ0EsQ0FBTyxTQUFTLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtDQUMvQixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNoQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNoQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNoQyxFQUFFLE9BQU8sR0FBRyxDQUFDO0NBQ2IsQ0FBQzs7Q0FFRDtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtBQUNBLENBQU8sU0FBUyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRTtDQUM5QixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQzVCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDNUIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUM1QixFQUFFLE9BQU8sR0FBRyxDQUFDO0NBQ2IsQ0FBQzs7Q0FFRDtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0FBQ0EsQ0FBTyxTQUFTckssT0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0NBQ2pDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDcEIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNwQixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ3BCLEVBQUUsT0FBTyxHQUFHLENBQUM7Q0FDYixDQUFDOztDQUVEO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtBQUNBLENBQU8sU0FBUyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFO0NBQzlDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDO0NBQy9CLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDO0NBQy9CLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDO0NBQy9CLEVBQUUsT0FBTyxHQUFHLENBQUM7Q0FDYixDQUFDOztDQUVEO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0FBQ0EsQ0FBTyxTQUFTLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0NBQy9CLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN0QixFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDdEIsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3RCLEVBQUUsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7Q0FDMUMsQ0FBQzs7Q0FFRDtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtBQUNBLENBQU8sU0FBUyxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRTtDQUN0QyxFQUFF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QUFDO0NBQzdCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztDQUM3QixFQUFFLE9BQU8sR0FBRyxDQUFDO0NBQ2IsQ0FBQzs7Q0FFRDtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7QUFDQSxDQUFPLFNBQVN2QixNQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0NBQ25DLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2hCLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2hCLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2hCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0NBQ2hDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0NBQ2hDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0NBQ2hDLEVBQUUsT0FBTyxHQUFHLENBQUM7Q0FDYixDQUFDOztDQUVEO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7QUFDQSxDQUFPLFNBQVMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0NBQzVDLEVBQUUsSUFBSSxZQUFZLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUMzQixFQUFFLElBQUksT0FBTyxHQUFHLFlBQVksSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUMvQyxFQUFFLElBQUksT0FBTyxHQUFHLFlBQVksSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQzNDLEVBQUUsSUFBSSxPQUFPLEdBQUcsWUFBWSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztDQUN2QyxFQUFFLElBQUksT0FBTyxHQUFHLFlBQVksSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDOztDQUUzQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDO0NBQzdFLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUM7Q0FDN0UsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQzs7Q0FFN0UsRUFBRSxPQUFPLEdBQUcsQ0FBQztDQUNiLENBQUM7O0NBRUQ7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtB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QUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2YsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7Q0FDbEQsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQztDQUNmLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztDQUN4RCxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7Q0FDeEQsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO0NBQ3pELEVBQUUsT0FBTyxHQUFHLENBQUM7Q0FDYixDQUFDOztDQUVEO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7QUFDQSxDQUFPLFNBQVMsYUFBYSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0NBQ3pDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNkLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDZCxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDZixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUMxQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUMxQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUMxQyxFQUFFLE9BQU8sR0FBRyxDQUFDO0NBQ2IsQ0FBQzs7Q0FFRDtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7QUFDQSxDQUFPLFNBQVMsYUFBYSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0NBQ3pDO0NBQ0EsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2YsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNmLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDZixNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDaEIsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNkLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNmO0NBQ0E7Q0FDQSxFQUFFLElBQUksR0FBRyxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7Q0FDM0IsTUFBTSxHQUFHLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztDQUMzQixNQUFNLEdBQUcsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7Q0FDNUI7Q0FDQSxFQUFFLElBQUksSUFBSSxHQUFHLEVBQUUsR0FBRyxHQUFHLEdBQUcsRUFBRSxHQUFHLEdBQUc7Q0FDaEMsTUFBTSxJQUFJLEdBQUcsRUFBRSxHQUFHLEdBQUcsR0FBRyxFQUFFLEdBQUcsR0FBRztDQUNoQyxNQUFNLElBQUksR0FBRyxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsR0FBRyxHQUFHLENBQUM7Q0FDakM7Q0FDQSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7Q0FDbEIsRUFBRSxHQUFHLElBQUksRUFBRSxDQUFDO0NBQ1osRUFBRSxHQUFHLElBQUksRUFBRSxDQUFDO0NBQ1osRUFBRSxHQUFHLElBQUksRUFBRSxDQUFDO0NBQ1o7Q0FDQSxFQUFFLElBQUksSUFBSSxDQUFDLENBQUM7Q0FDWixFQUFFLElBQUksSUFBSSxDQUFDLENBQUM7Q0FDWixFQUFFLElBQUksSUFBSSxDQUFDLENBQUM7Q0FDWjtDQUNBLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDO0NBQzFCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDO0NBQzFCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDO0NBQzFCLEVBQUUsT0FBTyxHQUFHLENBQUM7Q0FDYixDQUFDOztDQUVEO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7QUFDQSxDQUFPLFNBQVNDLFNBQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7Q0FDdEMsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFO0NBQ1osTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO0NBQ2I7Q0FDQSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3JCLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDckIsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7Q0FFckI7Q0FDQSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDZCxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNqRCxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7Q0FFakQ7Q0FDQSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3ZCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDdkIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7Q0FFdkIsRUFBRSxPQUFPLEdBQUcsQ0FBQztDQUNiLENBQUM7O0NBRUQ7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtBQUNBLENBQU8sU0FBU0MsU0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtDQUN0QyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUU7Q0FDWixNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7Q0FDYjtDQUNBLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDckIsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNyQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOztDQUVyQjtDQUNBLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2pELEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNkLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDOztDQUVqRDtDQUNBLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDdkIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN2QixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOztDQUV2QixFQUFFLE9BQU8sR0FBRyxDQUFDO0NBQ2IsQ0FBQzs7Q0FFRDtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0FBQ0EsQ0FBTyxTQUFTQyxTQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0NBQ3RDLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRTtDQUNaLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztDQUNiO0NBQ0EsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNyQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3JCLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7O0NBRXJCO0NBQ0EsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDakQsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDakQsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOztDQUVkO0NBQ0EsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN2QixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3ZCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7O0NBRXZCLEVBQUUsT0FBTyxHQUFHLENBQUM7Q0FDYixDQUFDOztDQUVEO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtBQUNBLENBQU8sU0FBUyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRTtDQUM1QixFQUFFLElBQUksS0FBSyxHQUFHUixZQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUMzQyxFQUFFLElBQUksS0FBSyxHQUFHQSxZQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7Q0FFM0MsRUFBRSxTQUFTLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0NBQzFCLEVBQUUsU0FBUyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQzs7Q0FFMUIsRUFBRSxJQUFJLE1BQU0sR0FBRyxHQUFHLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDOztDQUVqQyxFQUFFLElBQUksTUFBTSxHQUFHLEdBQUcsRUFBRTtDQUNwQixJQUFJLE9BQU8sQ0FBQyxDQUFDO0NBQ2IsR0FBRyxNQUFNLElBQUksTUFBTSxHQUFHLENBQUMsR0FBRyxFQUFFO0NBQzVCLElBQUksT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDO0NBQ25CLEdBQUcsTUFBTTtDQUNULElBQUksT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0NBQzdCLEdBQUc7Q0FDSCxDQUFDOztDQUVEO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtBQUNBLENBQU8sU0FBU1AsS0FBRyxDQUFDLENBQUMsRUFBRTtDQUN2QixFQUFFLE9BQU8sT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO0NBQzFELENBQUM7O0NBRUQ7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7QUFDQSxDQUFPLFNBQVNnQixhQUFXLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRTtDQUNsQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDekQsQ0FBQzs7Q0FFRDtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtBQUNBLENBQU8sU0FBU0MsUUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUU7Q0FDN0IsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2YsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNmLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNoQixFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDZixNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2YsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2hCLEVBQUUsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSUMsT0FBZ0IsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSUEsT0FBZ0IsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSUEsT0FBZ0IsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztDQUNyUSxDQUFDOztDQUVEO0NBQ0E7Q0FDQTtDQUNBO0FBQ0EsQ0FBTyxJQUFJQyxLQUFHLEdBQUdULFVBQVEsQ0FBQzs7Q0FFMUI7Q0FDQTtDQUNBO0NBQ0E7QUFDQSxDQUFPLElBQUlVLEtBQUcsR0FBR1QsVUFBUSxDQUFDOztDQUUxQjtDQUNBO0NBQ0E7Q0FDQTtBQUNBLENBQU8sSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDOztDQUV4QjtDQUNBO0NBQ0E7Q0FDQTtBQUNBLENBQU8sSUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDOztDQUUzQjtDQUNBO0NBQ0E7Q0FDQTtBQUNBLENBQU8sSUFBSSxPQUFPLEdBQUcsZUFBZSxDQUFDOztDQUVyQztDQUNBO0NBQ0E7Q0FDQTtBQUNBLENBQU8sSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDOztDQUV4QjtDQUNBO0NBQ0E7Q0FDQTtBQUNBLENBQU8sSUFBSSxNQUFNLEdBQUcsYUFBYSxDQUFDOztDQUVsQztDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7QUFDQSxDQUFPLElBQUksT0FBTyxHQUFHLFlBQVk7Q0FDakMsRUFBRSxJQUFJLEdBQUcsR0FBR1AsUUFBTSxFQUFFLENBQUM7O0NBRXJCLEVBQUUsT0FBTyxVQUFVLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFO0NBQ3RELElBQUksSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDO0NBQ2xCLFFBQVEsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDO0NBQ25CLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtDQUNqQixNQUFNLE1BQU0sR0FBRyxDQUFDLENBQUM7Q0FDakIsS0FBSzs7Q0FFTCxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7Q0FDakIsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDO0NBQ2pCLEtBQUs7O0NBRUwsSUFBSSxJQUFJLEtBQUssRUFBRTtDQUNmLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLE1BQU0sR0FBRyxNQUFNLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0NBQ3RELEtBQUssTUFBTTtDQUNYLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7Q0FDbkIsS0FBSzs7Q0FFTCxJQUFJLEtBQUssQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxNQUFNLEVBQUU7Q0FDekMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0NBQ3hELE1BQU0sRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7Q0FDeEIsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3hELEtBQUs7O0NBRUwsSUFBSSxPQUFPLENBQUMsQ0FBQztDQUNiLEdBQUcsQ0FBQztDQUNKLENBQUMsRUFBRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztLQUFDLEpDaHhCSjtDQUNBO0NBQ0E7Q0FDQTs7Q0FFQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0FBQ0EsQ0FBTyxTQUFTQSxRQUFNLEdBQUc7Q0FDekIsRUFBRSxJQUFJLEdBQUcsR0FBRyxJQUFJQyxVQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3ZDLEVBQUUsSUFBSUEsVUFBbUIsSUFBSSxZQUFZLEVBQUU7Q0FDM0MsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ2YsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ2YsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ2YsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ2YsR0FBRztDQUNILEVBQUUsT0FBTyxHQUFHLENBQUM7Q0FDYixDQUFDOztDQUVEO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtBQUNBLENBQU8sU0FBU0MsT0FBSyxDQUFDLENBQUMsRUFBRTtDQUN6QixFQUFFLElBQUksR0FBRyxHQUFHLElBQUlELFVBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDdkMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2hCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNoQixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDaEIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2hCLEVBQUUsT0FBTyxHQUFHLENBQUM7Q0FDYixDQUFDOztDQUVEO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtBQUNBLENBQU8sU0FBU0UsWUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtDQUN2QyxFQUFFLElBQUksR0FBRyxHQUFHLElBQUlGLFVBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDdkMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ2IsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ2IsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ2IsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ2IsRUFBRSxPQUFPLEdBQUcsQ0FBQztDQUNiLENBQUM7O0NBRUQ7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7QUFDQSxDQUFPLFNBQVNHLE1BQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFO0NBQzdCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNoQixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDaEIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2hCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNoQixFQUFFLE9BQU8sR0FBRyxDQUFDO0NBQ2IsQ0FBQzs7Q0FFRDtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtBQUNBLENBQU8sU0FBU3BMLEtBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0NBQ3JDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNiLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNiLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNiLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNiLEVBQUUsT0FBTyxHQUFHLENBQUM7Q0FDYixDQUFDOztDQUVEO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7QUFDQSxDQUFPLFNBQVNxTCxLQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7Q0FDL0IsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN2QixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3ZCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDdkIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN2QixFQUFFLE9BQU8sR0FBRyxDQUFDO0NBQ2IsQ0FBQzs7Q0FFRDtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0FBQ0EsQ0FBTyxTQUFTQyxVQUFRLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7Q0FDcEMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN2QixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3ZCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDdkIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN2QixFQUFFLE9BQU8sR0FBRyxDQUFDO0NBQ2IsQ0FBQzs7Q0FFRDtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0FBQ0EsQ0FBTyxTQUFTQyxVQUFRLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7Q0FDcEMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN2QixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3ZCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDdkIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN2QixFQUFFLE9BQU8sR0FBRyxDQUFDO0NBQ2IsQ0FBQzs7Q0FFRDtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0FBQ0EsQ0FBTyxTQUFTVSxRQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7Q0FDbEMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN2QixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3ZCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDdkIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN2QixFQUFFLE9BQU8sR0FBRyxDQUFDO0NBQ2IsQ0FBQzs7Q0FFRDtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtBQUNBLENBQU8sU0FBU0MsTUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUU7Q0FDN0IsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUMzQixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQzNCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDM0IsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUMzQixFQUFFLE9BQU8sR0FBRyxDQUFDO0NBQ2IsQ0FBQzs7Q0FFRDtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtBQUNBLENBQU8sU0FBU0MsT0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUU7Q0FDOUIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUM1QixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQzVCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDNUIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUM1QixFQUFFLE9BQU8sR0FBRyxDQUFDO0NBQ2IsQ0FBQzs7Q0FFRDtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0FBQ0EsQ0FBTyxTQUFTQyxLQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7Q0FDL0IsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDaEMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDaEMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDaEMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDaEMsRUFBRSxPQUFPLEdBQUcsQ0FBQztDQUNiLENBQUM7O0NBRUQ7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtBQUNBLENBQU8sU0FBU0MsS0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0NBQy9CLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2hDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2hDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2hDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2hDLEVBQUUsT0FBTyxHQUFHLENBQUM7Q0FDYixDQUFDOztDQUVEO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0FBQ0EsQ0FBTyxTQUFTQyxPQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRTtDQUM5QixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQzVCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDNUIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUM1QixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQzVCLEVBQUUsT0FBTyxHQUFHLENBQUM7Q0FDYixDQUFDOztDQUVEO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7QUFDQSxDQUFPLFNBQVNwTCxPQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7Q0FDakMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNwQixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ3BCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDcEIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNwQixFQUFFLE9BQU8sR0FBRyxDQUFDO0NBQ2IsQ0FBQzs7Q0FFRDtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7QUFDQSxDQUFPLFNBQVNxTCxhQUFXLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFO0NBQzlDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDO0NBQy9CLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDO0NBQy9CLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDO0NBQy9CLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDO0NBQy9CLEVBQUUsT0FBTyxHQUFHLENBQUM7Q0FDYixDQUFDOztDQUVEO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0FBQ0EsQ0FBTyxTQUFTQyxVQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRTtDQUMvQixFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDdEIsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3RCLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN0QixFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDdEIsRUFBRSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0NBQ2xELENBQUM7O0NBRUQ7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7QUFDQSxDQUFPLFNBQVNDLGlCQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRTtDQUN0QyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDdEIsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3RCLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN0QixFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDdEIsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDdkMsQ0FBQzs7Q0FFRDtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7QUFDQSxDQUFPLFNBQVNoTixRQUFNLENBQUMsQ0FBQyxFQUFFO0NBQzFCLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2YsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDZixFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNmLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2YsRUFBRSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0NBQ2xELENBQUM7O0NBRUQ7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0FBQ0EsQ0FBTyxTQUFTaU4sZUFBYSxDQUFDLENBQUMsRUFBRTtDQUNqQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNmLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2YsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDZixFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNmLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ3ZDLENBQUM7O0NBRUQ7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7QUFDQSxDQUFPLFNBQVNDLFFBQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFO0NBQy9CLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2pCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2pCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2pCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2pCLEVBQUUsT0FBTyxHQUFHLENBQUM7Q0FDYixDQUFDOztDQUVEO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0FBQ0EsQ0FBTyxTQUFTQyxTQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRTtDQUNoQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3RCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDdEIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN0QixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3RCLEVBQUUsT0FBTyxHQUFHLENBQUM7Q0FDYixDQUFDOztDQUVEO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0FBQ0EsQ0FBTyxTQUFTQyxXQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRTtDQUNsQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNmLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2YsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDZixFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNmLEVBQUUsSUFBSSxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUMxQyxFQUFFLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRTtDQUNmLElBQUksR0FBRyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQzdCLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUM7Q0FDckIsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQztDQUNyQixJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDO0NBQ3JCLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUM7Q0FDckIsR0FBRztDQUNILEVBQUUsT0FBTyxHQUFHLENBQUM7Q0FDYixDQUFDOztDQUVEO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0FBQ0EsQ0FBTyxTQUFTQyxLQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRTtDQUMxQixFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUMvRCxDQUFDOztDQUVEO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtBQUNBLENBQU8sU0FBU25OLE1BQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7Q0FDbkMsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDaEIsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDaEIsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDaEIsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDaEIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7Q0FDaEMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7Q0FDaEMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7Q0FDaEMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7Q0FDaEMsRUFBRSxPQUFPLEdBQUcsQ0FBQztDQUNiLENBQUM7O0NBRUQ7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7QUFDQSxDQUFPLFNBQVNvTixRQUFNLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRTtDQUNuQyxFQUFFLEtBQUssR0FBRyxLQUFLLElBQUksR0FBRyxDQUFDOztDQUV2QjtDQUNBO0NBQ0E7Q0FDQSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO0NBQ3JCLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDO0NBQ2IsRUFBRSxHQUFHO0NBQ0wsSUFBSSxFQUFFLEdBQUd2QixNQUFlLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ25DLElBQUksRUFBRSxHQUFHQSxNQUFlLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ25DLElBQUksRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztDQUMzQixHQUFHLFFBQVEsRUFBRSxJQUFJLENBQUMsRUFBRTtDQUNwQixFQUFFLEdBQUc7Q0FDTCxJQUFJLEVBQUUsR0FBR0EsTUFBZSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNuQyxJQUFJLEVBQUUsR0FBR0EsTUFBZSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNuQyxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUM7Q0FDM0IsR0FBRyxRQUFRLEVBQUUsSUFBSSxDQUFDLEVBQUU7O0NBRXBCLEVBQUUsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Q0FDbkMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLEVBQUUsQ0FBQztDQUN0QixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUcsRUFBRSxDQUFDO0NBQ3RCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0NBQzFCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0NBQzFCLEVBQUUsT0FBTyxHQUFHLENBQUM7Q0FDYixDQUFDOztDQUVEO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7QUFDQSxDQUFPLFNBQVN3QixlQUFhLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7Q0FDekMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNkLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDZCxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDZixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ3RELEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDdEQsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUN2RCxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENB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QyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDMUUsQ0FBQzs7Q0FFRDtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtBQUNBLENBQU8sU0FBU0MsUUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUU7Q0FDN0IsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2YsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNmLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDZixNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDaEIsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2YsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNmLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDZixNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDaEIsRUFBRSxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJQyxPQUFnQixHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJQSxPQUFnQixHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJQSxPQUFnQixHQUFHLElBQUksQ0FBQyxH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TUFBTSxHQUFHLEVBQUUsR0FBRyxNQUFNLEdBQUcsRUFBRSxDQUFDO0NBQ3JDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sR0FBRyxFQUFFLEdBQUcsTUFBTSxHQUFHLEVBQUUsQ0FBQztDQUNyQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLEdBQUcsRUFBRSxHQUFHLE1BQU0sR0FBRyxFQUFFLENBQUM7O0NBRXJDLEVBQUUsT0FBTyxHQUFHLENBQUM7Q0FDYixDQUFDO0FBQ0QsQUErREE7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0FBQ0EsQ0FBTyxTQUFTLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFO0NBQ2pDO0NBQ0E7Q0FDQSxFQUFFLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2xDLEVBQUUsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUM7O0NBRXJCLEVBQUUsSUFBSSxNQUFNLEdBQUcsR0FBRyxFQUFFO0NBQ3BCO0NBQ0EsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUM7Q0FDcEMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLEtBQUssQ0FBQztDQUN6QixJQUFJLEtBQUssR0FBRyxHQUFHLEdBQUcsS0FBSyxDQUFDO0NBQ3hCLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUM7Q0FDbkMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQztDQUNuQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDO0NBQ25DLEdBQUcsTUFBTTtDQUNUO0NBQ0EsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDZCxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQzNCLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNuQyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Q0FDeEIsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDOztDQUV4QixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO0NBQ3hFLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxLQUFLLENBQUM7Q0FDekIsSUFBSSxLQUFLLEdBQUcsR0FBRyxHQUFHLEtBQUssQ0FBQztDQUN4QixJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQztD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
