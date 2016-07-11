/**
 * Misc utilities used internally
 * @class
 * @category core
 * @protected
 */
Z.Util = {
    /**
     * @property {Number} guid
     * @static
     */
    guid: 0,

    now:function () {
        if (!Date.now) {
            return new Date().getTime();
        }
        return Date.now();
    },

    /**
     * Extend a object with one or more source objects.
     * @param  {Object} dest   - object to extend
     * @param  {...Object} src - sources
     * @return {Object}
     */
    extend: function (dest) { // (Object[, Object, ...]) ->
        var sources = Array.prototype.slice.call(arguments, 1), i, j, len, src;

        for (j = 0, len = sources.length; j < len; j++) {
            src = sources[j] || {};
            for (i in src) {
                if (src.hasOwnProperty(i)) {
                    dest[i] = src[i];
                }
            }
        }
        return dest;
    },

    /**
     * Set options to a object, extends its options member.
     * @param {Object} obj      - object to set options to
     * @param {Object} options  - options to set
     * @returns {Object} options set
     */
    setOptions: function (obj, options) {
        if (!obj.hasOwnProperty('options')) {
            obj.options = obj.options ? Z.Util.create(obj.options) : {};
        }
        for (var i in options) {
            obj.options[i] = options[i];
        }
        return obj.options;
    },

    isSVG:function (url) {
        var prefix = 'data:image/svg+xml';
        if (url.length > 4 && url.substring(url.length - 4) === '.svg') {
            return 1;
        } else if (url.substring(0, prefix.length) === prefix) {
            return 2;
        }
        return 0;
    },

    /**
     * Load a image, can be a remote one or a local file. <br>
     * If in node, a SVG image will be converted to a png file by [svg2img]{@link https://github.com/FuZhenn/node-svg2img}<br>
     * @param  {Image} img  - the image object to load.
     * @param  {Object[]} imgDesc - image's descriptor, it's a array. imgUrl[0] is the url string, imgUrl[1] is the width, imgUrl[2] is the height.
     * @return maptalks.Util
     */
    loadImage:function (img, imgDesc) {
        if (!Z.node) {
            img.src = imgDesc[0];
            return this;
        }
        function onError(err) {
            if (err) {
                console.error(err);
                console.error(err.stack);
            }
            var onerrorFn = img.onerror;
            if (onerrorFn) {
                onerrorFn.call(img);
            }
        }
        function onLoadComplete(err, data) {
            if (err) {
                onError(err);
                return;
            }
            var onloadFn = img.onload;
            if (onloadFn) {
                img.onload = function () {
                    onloadFn.call(img);
                };
            }
            img.src = data;
        }
        var url = imgDesc[0],
            w   = imgDesc[1],
            h   = imgDesc[2];
        try {
            if (Z.Util.isSVG(url)) {
                Z.Util._convertSVG2PNG(url, w, h, onLoadComplete);
            } else if (Z.Util.isURL(url)) {
                //canvas-node的Image对象
                this._loadRemoteImage(img, url, onLoadComplete);
            } else {
                this._loadLocalImage(img, url, onLoadComplete);
            }
        } catch (error) {
            onError(error);
        }
        return this;
    },

    _loadRemoteImage:function (img, url, onComplete) {
        //http
        var loader;
        if (url.indexOf('https://') === 0) {
            loader = require('https');
        } else {
            loader = require('http');
        }
        var urlObj = require('url').parse(url);
        //mimic the browser to prevent server blocking.
        urlObj.headers = {
            'Accept':'image/*,*/*;q=0.8',
            'Accept-Encoding':'gzip, deflate',
            'Cache-Control':'no-cache',
            'Connection':'keep-alive',
            'Host':urlObj.host,
            'Pragma':'no-cache',
            'User-Agent':'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.94 Safari/537.36'
        };
        loader.request(urlObj, function (res) {
            var data = [];
            res.on('data', function (chunk) {
                data.push(chunk);
            });
            res.on('end', function () {
                onComplete(null, Buffer.concat(data));
            });
        }).on('error', onComplete).end();
    },

    _loadLocalImage:function (img, url, onComplete) {
        //local file
        require('fs').readFile(url, onComplete);
    },

    _convertSVG2PNG:function (url, w, h, onComplete) {
        //use svg2img to convert svg to png.
        //https://github.com/FuZhenn/node-svg2img
        require('svg2img')(url, {'width':w, 'height':h}, onComplete);
    },

    fixPNG:function () {

    },

    /**
     * Generate a global UID, not a real UUID, just a auto increment key with a prefix.
     * @return {String}
     */
    GUID: function () {
        return '___MAPTALKS_GLOBAL_' + (Z.Util.guid++);
    },

    // return unique ID of an object
    stamp: function (obj) {
        /*eslint-disable camelcase*/
        obj._maptalks_id = obj._maptalks_id || Z.Util.GUID();
        return obj._maptalks_id;
        /*eslint-enable camelcase*/
    },

    /**
     * Parse a JSON string to a object
     * @param {String} str      - a JSON string
     * @return {Object}
     */
    parseJSON:function (str) {
        if (!str || !Z.Util.isString(str)) {
            return str;
        }
        return JSON.parse(str);
    },

    /**
     * Object.create or a polyfill in old browsers.
     * @function
     * @param {Object} proto - the proto to create on.
     * @return {Object}
     */
    create: Object.create || (function () {
        function F() {}
        return function (proto) {
            F.prototype = proto;
            return new F();
        };
    })(),

    /**
     * Function.bind or a polyfill in old browsers.
     * @param {Function} fn     - function to bind
     * @param {Object} obj      - context to bind
     * @return {Function} function binded.
     */
    bind: function (fn, obj) {
        var slice = Array.prototype.slice;
        if (fn.bind) {
            return fn.bind.apply(fn, slice.call(arguments, 1));
        }
        var args = slice.call(arguments, 2);
        return function () {
            return fn.apply(obj, args.length ? args.concat(slice.call(arguments)) : arguments);
        };
    },

    /**
     * from leaflet <br>
     * return a function that won't be called more often than the given interval
     *
     * @param  {Function} fn      - function to call
     * @param  {Number}   time    - interval to throttle
     * @param  {Object}   context - function's context
     * @return {Function} the throttled function
     */
    throttle: function (fn, time, context) {
        var lock, args, wrapperFn, later;

        later = function () {
            // reset lock and call if queued
            lock = false;
            if (args) {
                wrapperFn.apply(context, args);
                args = false;
            }
        };

        wrapperFn = function () {
            if (lock) {
                // called too soon, queue to call later
                args = arguments;

            } else {
                // call and lock until later
                fn.apply(context, arguments);
                setTimeout(later, time);
                lock = true;
            }
        };

        return wrapperFn;
    },

    removeFromArray:function (obj, array) {
        for (var i = array.length - 1; i >= 0; i--) {
            if (array[i] === obj) {
                return array.splice(i, 1);
            }
        }
        return null;
    },


    mapArrayRecursively:function (arr, fn, context) {
        if (!this.isArray(arr)) {
            return null;
        }
        var result = [],
            p, pp;
        for (var i = 0, len = arr.length; i < len; i++) {
            p = arr[i];
            if (Z.Util.isNil(p)) {
                result.push(null);
                continue;
            }
            if (Z.Util.isArray(p)) {
                result.push(Z.Util.mapArrayRecursively(p, fn, context));
            } else {
                pp = context ? fn.call(context, p) : fn(p);
                result.push(pp);
            }

        }
        return result;
    },


    mapArray: function (array, fn, context) {
        if (!this.isArray(array)) {
            return null;
        }
        var result = [],
            p, pp;
        for (var i = 0, len = array.length; i < len; i++) {
            p = array[i];
            if (Z.Util.isNil(p)) {
                result.push(null);
                continue;
            }
            pp = context ? fn.call(context, p) : fn(p);
            result.push(pp);
        }
        return result;
    },

    indexOfArray:function (obj, arr) {
        if (!Z.Util.isArrayHasData(arr)) {
            return -1;
        }
        for (var i = 0, len = arr.length; i < len; i++) {
            if (arr[i] === obj) {
                return i;
            }
        }
        return -1;
    },

    /**
     * Shallow comparison of two objects <br>
     * borrowed from expect.js
     * @param  {Object} a
     * @param  {Object} b
     * @return {Boolean}
     */
    objEqual:function (a, b) {
        return Z.Util._objEqual(a, b);
    },

    /**
     * Deep comparison of two objects <br>
     * borrowed from expect.js
     * @param  {Object} a
     * @param  {Object} b
     * @return {Boolean}
     */
    objDeepEqual:function (a, b) {
        return Z.Util._objEqual(a, b, true);
    },

    _objEqual:function (a, b, isDeep) {
        function getKeys(obj) {
            if (Object.keys) {
                return Object.keys(obj);
            }
            var keys = [];
            for (var i in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, i)) {
                    keys.push(i);
                }
            }
            return keys;
        }
        if (Z.Util.isNil(a) || Z.Util.isNil(b)) {
            return false;
        }
        // an identical "prototype" property.
        if (a.prototype !== b.prototype) { return false; }
        var ka, kb, key, i;
        try {
            ka = getKeys(a);
            kb = getKeys(b);
        } catch (e) { //happens when one is a string literal and the other isn't
            return false;
        }
        // having the same number of owned properties (keys incorporates hasOwnProperty)
        if (ka.length !== kb.length) {
            return false;
        }
        //~~~cheap key test
        for (i = ka.length - 1; i >= 0; i--) {
            if (ka[i] !== kb[i]) {
                return false;
            }
        }
        //equivalent values for every corresponding key, and
        //~~~possibly expensive deep test
        if (isDeep) {
            for (i = ka.length - 1; i >= 0; i--) {
                key = ka[i];
                if (!Z.Util.objEqual(a[key], b[key])) {
                    return false;
                }
            }
        }
        return true;
    },

    /*
     * round a number, more efficient one.
     * @param  {Number} num - num to round
     * @return {Number}
     */
    round:function (num) {
        if (num > 0) {
            return (0.5 + num) << 0;
        } else {
            return (num - 0.5) << 0;
        }

    },

    /*
     * Whether the object is a coordinate
     * @param  {Object} obj     - object
     * @return {Boolean}
     */
    isCoordinate:function (obj) {
        if (obj instanceof Z.Coordinate) {
            return true;
        }
        /*if (obj && !Z.Util.isNil(obj.x) && !Z.Util.isNil(obj.y)) {
            return true;
        }*/
        return false;
    },
    /*
     * Whether the object is null or undefined.
     * @param  {Object}  obj - object
     * @return {Boolean}
     */
    isNil:function (obj) {
        return (typeof (obj) === 'undefined' || obj === null);
    },

    /*
     * Whether val is a number and not a NaN.
     * @param  {Object}  val - val
     * @return {Boolean}
     */
    isNumber:function (val) {
        return (typeof val === 'number') && !isNaN(val);
    },

    /*
     * Whether the obj is a javascript object.
     * @param  {*}  obj     - object to check
     * @return {Boolean}
     */
    isObject: function (obj) {
        return typeof obj === 'object' && !!obj;
    },

    /*
     * 判断数组中是否包含obj
     * @param {Object} obj
     * @return {Boolean} true|false
     */
    isArrayHasData:function (obj) {
        return this.isArray(obj) && obj.length > 0;
    },

    /*
     * 判断是否数组
     * @param {Object} obj
     * @return {Boolean} true|false
     */
    isArray:function (obj) {
        if (!obj) { return false; }
        if (Array.isArray) {
            return Array.isArray(obj);
        }
        return Object.prototype.toString.call(obj) === '[object Array]';
    },

    /**
     * 判断是否字符串
     * @param {Object} _str
     * @return {Boolean} true|false
     */
    isString:function (_str) {
        if (Z.Util.isNil(_str)) { return false; }
        return typeof _str === 'string' || (_str.constructor !== null && _str.constructor === String);
    },

    /*
     * 判断是否函数
     * @param {Object} _func
     * @return {Boolean} true|false
     */
    isFunction:function (_func) {
        if (this.isNil(_func)) {
            return false;
        }
        return typeof _func === 'function' || (_func.constructor !== null && _func.constructor === Function);
    },

    /**
     * Whether the input string is a valid url.
     * @param  {String}  url - url to check
     * @return {Boolean}
     */
    isURL:function (url) {
        if (!url) {
            return false;
        }
        if (url.indexOf('http://') >= 0 || url.indexOf('https://') >= 0 || url.indexOf('blob:') >= 0) {
            return true;
        }
        return false;
    },

    //改原先的regex名字为xWithQuote；不带引号的regex，/^url\(([^\'\"].*[^\'\"])\)$/i，为xWithoutQuote。然后在is函数里||测试，extract函数里if...else处理。没引号的匹配后，取matches[1]

    // match: url('x'), url("x").
    // TODO: url(x)
    cssUrlReWithQuote: /^url\(([\'\"])(.+)\1\)$/i,

    cssUrlRe:/^url\(([^\'\"].*[^\'\"])\)$/i,

    isCssUrl: function (str) {
        if (!Z.Util.isString(str)) {
            return 0;
        }
        if (str.substring(0, 4) === 'http') {
            return 3;
        }
        if (Z.Util.cssUrlRe.test(str)) {
            return 1;
        }
        if (Z.Util.cssUrlReWithQuote.test(str)) {
            return 2;
        }
        return 0;
    },

    extractCssUrl: function (str) {
        var test = Z.Util.isCssUrl(str), matches;
        if (test === 3) {
            return str;
        }
        if (test === 1) {
            matches = Z.Util.cssUrlRe.exec(str);
            return matches[1];
        } else if (test === 2) {
            matches = Z.Util.cssUrlReWithQuote.exec(str);
            return matches[2];
        } else {
            // return as is if not an css url
            return str;
        }
    },

    b64chrs : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',

    /**
     * btoa or a polyfill in old browsers. <br>
     * Creates a base-64 encoded ASCII string from a String object in which each character in the string is treated as a byte of binary data.<br>
     * From https://github.com/davidchambers/Base64.js
     * @param  {Buffer} input - input string to convert
     * @return {String} ascii
     * @example
     *     var encodedData = maptalks.Util.btoa(stringToEncode);
     */
    btoa:function (input) {
        if ((typeof window !== 'undefined') && window.btoa) {
            return window.btoa(input);
        }
        var str = String(input);
        for (
          // initialize result and counter
          var block, charCode, idx = 0, map = Z.Util.b64chrs, output = '';
          // if the next str index does not exist:
          //   change the mapping table to "="
          //   check if d has no fractional digits
          str.charAt(idx | 0) || (map = '=', idx % 1);
          // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
          output += map.charAt(63 & block >> 8 - idx % 1 * 8)
        ) {
            charCode = str.charCodeAt(idx += 3 / 4);
            if (charCode > 0xFF) {
                throw new Error('\'btoa\' failed: The string to be encoded contains characters outside of the Latin1 range.');
            }
            block = block << 8 | charCode;
        }
        return output;
    },

    /**
     * Borrowed from jquery, evaluates a javascript snippet in a global context
     * @param {String} code
     */
    globalEval: function (code) {
        var script = document.createElement('script');
        script.text = code;
        document.head.appendChild(script).parentNode.removeChild(script);
    },

    /**
     * Borrowed from jquery, evaluates a script in a global context.
     * @param  {String} file    - javascript file to eval
     */
    globalScript: function (file) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = file;
        document.head.appendChild(script);
    },

    decreaseSymbolOpacity:function (symbol, ratio) {
        function s(_symbol, _ratio) {
            var op = _symbol['opacity'];
            if (Z.Util.isNil(op)) {
                _symbol['opacity'] = _ratio;
            } else {
                _symbol['opacity'] *= _ratio;
            }
        }
        if (Z.Util.isArray(symbol)) {
            for (var i = 0; i < symbol.length; i++) {
                s(symbol[i], ratio);
            }
        } else {
            s(symbol, ratio);
        }
        return symbol;
    },

    extendSymbol:function (symbol) {
        var sources = Array.prototype.slice.call(arguments, 1);
        if (!sources || !sources.length) {
            sources = [{}];
        }
        if (Z.Util.isArray(symbol)) {
            var s, dest, i, ii, l, ll;
            var result = [];
            for (i = 0, l = symbol.length; i < l; i++) {
                s = symbol[i];
                dest = {};
                for (ii = 0, ll = sources.length; ii < ll; ii++) {
                    if (!Z.Util.isArray(sources[ii])) {
                        Z.Util.extend(dest, s, sources[ii]);
                    } else if (!Z.Util.isNil(sources[ii][i])) {
                        Z.Util.extend(dest, s, sources[ii][i]);
                    } else {
                        Z.Util.extend(dest, s);
                    }
                }
                result.push(dest);
            }
            return result;
        } else {
            return Z.Util.extend.apply(Z.Util, [{}, symbol].concat(sources));
        }
    },

    computeDegree: function (p1, p2) {
        var dx = p2.x - p1.x;
        var dy = p2.y - p1.y;
        return Math.atan2(dy, dx);
    },

    isGradient: function (g) {
        return g && Z.Util.isArrayHasData(g['colorStops']);
    },

    /**
     * Get external resources from the given symbol
     * @param  {Object} symbol      - symbol
     * @return {String[]}           - resource urls
     */
    getExternalResources: function (symbol) {
        if (!symbol) {
            return null;
        }
        var symbols = symbol;
        if (!Z.Util.isArray(symbol)) {
            symbols = [symbol];
        }
        var resources = [];
        var props = Z.Symbolizer.resourceProperties,
            ii, res, resSizeProp;
        for (var i = symbols.length - 1; i >= 0; i--) {
            symbol = symbols[i];
            if (!symbol) {
                continue;
            }
            for (ii = 0; ii < props.length; ii++) {
                res = symbol[props[ii]];
                if (!res) {
                    continue;
                }
                if (res.indexOf('url(') >= 0) {
                    res = Z.Util.extractCssUrl(res);
                }
                resSizeProp = Z.Symbolizer.resourceSizeProperties[ii];
                resources.push([res, symbol[resSizeProp[0]], symbol[resSizeProp[1]]]);
            }
            if (symbol['markerType'] === 'path' && symbol['markerPath']) {
                resources.push([Z.Geometry._getMarkerPathURL(symbol), symbol['markerWidth'], symbol['markerHeight']]);
            }
        }
        return resources;
    },

     /**
     * Convert symbol's resources' urls from relative path to an absolute path.
     * @param  {Object} symbol
     * @private
     */
    convertResourceUrl: function (symbol) {
        if (!symbol) {
            return null;
        }

        function absolute(base, relative) {
            var stack = base.split('/'),
                parts = relative.split('/');
            if (relative.indexOf('/') === 0) {
                return stack.slice(0, 3).join('/') + relative;
            } else {
                stack.pop(); // remove current file name (or empty string)
                             // (omit if "base" is the current folder without trailing slash)
                for (var i = 0; i < parts.length; i++) {
                    if (parts[i] === '.')
                        continue;
                    if (parts[i] === '..')
                        stack.pop();
                    else
                        stack.push(parts[i]);
                }
                return stack.join('/');
            }

        }
        var s = Z.Util.extend({}, symbol);
        if (Z.node) {
            return s;
        }
        var props = Z.Symbolizer.resourceProperties;
        var res, isCssStyle = false;
        for (var ii = 0, len = props.length; ii < len; ii++) {
            res = s[props[ii]];
            if (!res) {
                continue;
            }
            isCssStyle = false;
            if (res.indexOf('url(') >= 0) {
                res = Z.Util.extractCssUrl(res);
                isCssStyle = true;
            }
            if (!Z.Util.isURL(res)) {
                res = absolute(location.href, res);
                s[props[ii]] = isCssStyle ? 'url("' + res + '")' : res;
            }
        }
        return s;
    }

};


    //RequestAnimationFrame, inspired by Leaflet
(function () {
    if (Z.node) {
        Z.Util.requestAnimFrame = function (fn) {
            return setTimeout(fn, 16);
        };

        Z.Util.cancelAnimFrame = clearTimeout;
        return;
    }

    var requestFn, cancelFn;
    var lastTime = 0;


        // fallback for IE 7-8
    function timeoutDefer(fn) {
        var time = +new Date(),
            timeToCall = Math.max(0, 16 - (time - lastTime));

        lastTime = time + timeToCall;
        return setTimeout(fn, timeToCall);
    }
    function getPrefixed(name) {
        return window['webkit' + name] || window['moz' + name] || window['ms' + name];
    }
    if (typeof (window) != 'undefined') {
            // inspired by http://paulirish.com/2011/requestanimationframe-for-smart-animating/

        requestFn = window['requestAnimationFrame'] || getPrefixed('RequestAnimationFrame') || timeoutDefer;
        cancelFn = window['cancelAnimationFrame'] || getPrefixed('CancelAnimationFrame') ||
                           getPrefixed('CancelRequestAnimationFrame') || function (id) { window.clearTimeout(id); };
    } else {
        requestFn = timeoutDefer;
        cancelFn =  function (id) { clearTimeout(id); };
    }
    Z.Util.requestAnimFrame = function (fn) {
        return requestFn(fn);
    };

    Z.Util.cancelAnimFrame = function (id) {
        if (id) {
            cancelFn(id);
        }
    };
})();
