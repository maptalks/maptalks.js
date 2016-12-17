/**
 * Misc utilities used internally
 * @class
 * @category core
 * @protected
 */
import { isNode } from '../env';
import { utils } from '../utils';
import Coordinate from 'geo/Coordinate';

const Util = {
    /**
     * @property {Number} uid
     * @static
     */
    uid: 0,

    now: function () {
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
        for (var i = 1; i < arguments.length; i++) {
            var src = arguments[i];
            for (var k in src) {
                dest[k] = src[k];
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
            obj.options = obj.options ? Util.create(obj.options) : {};
        }
        for (var i in options) {
            obj.options[i] = options[i];
        }
        return obj.options;
    },

    isSVG: function (url) {
        var prefix = 'data:image/svg+xml';
        if (url.length > 4 && url.slice(-4) === '.svg') {
            return 1;
        } else if (url.slice(0, prefix.length) === prefix) {
            return 2;
        }
        return 0;
    },

    /**
     * Load a image, can be a remote one or a local file. <br>
     * If in node, a SVG image will be converted to a png file by [svg2img]{@link https://github.com/FuZhenn/node-svg2img}<br>
     * @param  {Image} img  - the image object to load.
     * @param  {Object[]} imgDesc - image's descriptor, it's a array. imgUrl[0] is the url string, imgUrl[1] is the width, imgUrl[2] is the height.
     */
    loadImage: function (img, imgDesc) {
        if (!isNode) {
            img.src = imgDesc[0];
            return;
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
            w = imgDesc[1],
            h = imgDesc[2];
        try {
            if (Util.isSVG(url) && Util.convertSVG) {
                Util.convertSVG(url, w, h, onLoadComplete);
            } else if (Util.isURL(url)) {
                //canvas-node的Image对象
                this._loadRemoteImage(img, url, onLoadComplete);
            } else {
                this._loadLocalImage(img, url, onLoadComplete);
            }
        } catch (error) {
            onError(error);
        }
    },

    _loadRemoteImage: function (img, url, onComplete) {
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
            'Accept': 'image/*,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Host': urlObj.host,
            'Pragma': 'no-cache',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.94 Safari/537.36'
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

    _loadLocalImage: function (img, url, onComplete) {
        //local file
        // require('fs').readFile(url, onComplete);
    },

    fixPNG: function () {},

    /**
     * Generate a global UID, not a real UUID, just a auto increment key with a prefix.
     * @return {Number}
     */
    UID: function () {
        return Util.uid++;
    },

    /**
     * Parse a JSON string to a object
     * @param {String} str      - a JSON string
     * @return {Object}
     */
    parseJSON: function (str) {
        if (!str || !Util.isString(str)) {
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

    executeWhen: function (fn, when) {
        var exe = function () {
            if (when()) {
                fn();
            } else {
                Util.requestAnimFrame(exe);
            }
        };

        exe();
        return this;
    },

    removeFromArray: function (obj, array) {
        for (var i = array.length - 1; i >= 0; i--) {
            if (array[i] === obj) {
                return array.splice(i, 1);
            }
        }
        return null;
    },


    mapArrayRecursively: function (arr, fn, context) {
        if (!this.isArray(arr)) {
            return null;
        }
        var result = [],
            p, pp;
        for (var i = 0, len = arr.length; i < len; i++) {
            p = arr[i];
            if (Util.isNil(p)) {
                result.push(null);
                continue;
            }
            if (Util.isArray(p)) {
                result.push(Util.mapArrayRecursively(p, fn, context));
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
            if (Util.isNil(p)) {
                result.push(null);
                continue;
            }
            pp = context ? fn.call(context, p) : fn(p);
            result.push(pp);
        }
        return result;
    },

    indexOfArray: function (obj, arr) {
        if (!Util.isArrayHasData(arr)) {
            return -1;
        }
        for (var i = 0, len = arr.length; i < len; i++) {
            if (arr[i] === obj) {
                return i;
            }
        }
        return -1;
    },

    getValueOrDefault: function (v, d) {
        return v === undefined ? d : v;
    },

    /**
     * Shallow comparison of two objects <br>
     * borrowed from expect.js
     * @param  {Object} a
     * @param  {Object} b
     * @return {Boolean}
     */
    objEqual: function (a, b) {
        return Util._objEqual(a, b);
    },

    /**
     * Deep comparison of two objects <br>
     * borrowed from expect.js
     * @param  {Object} a
     * @param  {Object} b
     * @return {Boolean}
     */
    objDeepEqual: function (a, b) {
        return Util._objEqual(a, b, true);
    },

    _objEqual: function (a, b, isDeep) {
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
        if (Util.isNil(a) || Util.isNil(b)) {
            return false;
        }
        // an identical "prototype" property.
        if (a.prototype !== b.prototype) {
            return false;
        }
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
                if (!Util.objEqual(a[key], b[key])) {
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
    round: function (num) {
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
    isCoordinate: function (obj) {
        if (obj instanceof Coordinate) {
            return true;
        }
        /*if (obj && !Util.isNil(obj.x) && !Util.isNil(obj.y)) {
            return true;
        }*/
        return false;
    },
    /*
     * Whether the object is null or undefined.
     * @param  {Object}  obj - object
     * @return {Boolean}
     */
    isNil: function (obj) {
        return obj == null;
    },

    /*
     * Whether val is a number and not a NaN.
     * @param  {Object}  val - val
     * @return {Boolean}
     */
    isNumber: function (val) {
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
    isArrayHasData: function (obj) {
        return this.isArray(obj) && obj.length > 0;
    },

    /*
     * 判断是否数组
     * @param {Object} obj
     * @return {Boolean} true|false
     */
    isArray: function (obj) {
        if (!obj) {
            return false;
        }
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
    isString: function (_str) {
        if (Util.isNil(_str)) {
            return false;
        }
        return typeof _str === 'string' || (_str.constructor !== null && _str.constructor === String);
    },

    /*
     * 判断是否函数
     * @param {Object} _func
     * @return {Boolean} true|false
     */
    isFunction: function (_func) {
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
    isURL: function (url) {
        if (!url) {
            return false;
        }
        var head = url.slice(0, 6);
        if (head === 'http:/' || head === 'https:') {
            return true;
        }
        return false;
    },

    //改原先的regex名字为xWithQuote；不带引号的regex，/^url\(([^\'\"].*[^\'\"])\)$/i，为xWithoutQuote。然后在is函数里||测试，extract函数里if...else处理。没引号的匹配后，取matches[1]

    // match: url('x'), url("x").
    // TODO: url(x)
    cssUrlReWithQuote: /^url\(([\'\"])(.+)\1\)$/i,

    cssUrlRe: /^url\(([^\'\"].*[^\'\"])\)$/i,

    isCssUrl: function (str) {
        if (!Util.isString(str)) {
            return 0;
        }
        var head = str.slice(0, 6);
        if (head === 'http:/' || head === 'https:') {
            return 3;
        }
        if (Util.cssUrlRe.test(str)) {
            return 1;
        }
        if (Util.cssUrlReWithQuote.test(str)) {
            return 2;
        }
        return 0;
    },

    extractCssUrl: function (str) {
        var test = Util.isCssUrl(str),
            matches;
        if (test === 3) {
            return str;
        }
        if (test === 1) {
            matches = Util.cssUrlRe.exec(str);
            return matches[1];
        } else if (test === 2) {
            matches = Util.cssUrlReWithQuote.exec(str);
            return matches[2];
        } else {
            // return as is if not an css url
            return str;
        }
    },

    b64chrs: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',

    /**
     * btoa or a polyfill in old browsers. <br>
     * Creates a base-64 encoded ASCII string from a String object in which each character in the string is treated as a byte of binary data.<br>
     * From https://github.com/davidchambers/Base64.js
     * @param  {Buffer} input - input string to convert
     * @return {String} ascii
     * @example
     *     var encodedData = Util.btoa(stringToEncode);
     */
    btoa: function (input) {
        if ((typeof window !== 'undefined') && window.btoa) {
            return window.btoa(input);
        }
        var str = String(input);
        for (
            // initialize result and counter
            var block, charCode, idx = 0, map = Util.b64chrs, output = '';
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

    lowerSymbolOpacity: function (symbol, ratio) {
        function s(_symbol, _ratio) {
            var op = _symbol['opacity'];
            if (Util.isNil(op)) {
                _symbol['opacity'] = _ratio;
            } else {
                _symbol['opacity'] *= _ratio;
            }
        }
        var lower;
        if (Util.isArray(symbol)) {
            lower = [];
            for (var i = 0; i < symbol.length; i++) {
                var d = Util.extend({}, symbol[i]);
                s(d, ratio);
                lower.push(d);
            }
        } else {
            lower = Util.extend({}, symbol);
            s(lower, ratio);
        }
        return lower;
    },

    extendSymbol: function (symbol) {
        var sources = Array.prototype.slice.call(arguments, 1);
        if (!sources || !sources.length) {
            sources = [{}];
        }
        if (Util.isArray(symbol)) {
            var s, dest, i, ii, l, ll;
            var result = [];
            for (i = 0, l = symbol.length; i < l; i++) {
                s = symbol[i];
                dest = {};
                for (ii = 0, ll = sources.length; ii < ll; ii++) {
                    if (!Util.isArray(sources[ii])) {
                        Util.extend(dest, s, sources[ii] ? sources[ii] : {});
                    } else if (!Util.isNil(sources[ii][i])) {
                        Util.extend(dest, s, sources[ii][i]);
                    } else {
                        Util.extend(dest, s ? s : {});
                    }
                }
                result.push(dest);
            }
            return result;
        } else {
            var args = [{}, symbol];
            args.push.apply(args, sources);
            return Util.extend.apply(Util, args);
        }
    },

    computeDegree: function (p1, p2) {
        var dx = p2.x - p1.x;
        var dy = p2.y - p1.y;
        return Math.atan2(dy, dx);
    },

    isGradient: function (g) {
        return g && g['colorStops'];
    },

    getGradientStamp: function (g) {
        var keys = [g['type']];
        if (g['places']) {
            keys.push(g['places'].join());
        }
        if (g['colorStops']) {
            var stops = [];
            for (var i = g['colorStops'].length - 1; i >= 0; i--) {
                stops.push(g['colorStops'][i].join());
            }
            keys.push(stops.join(','));
        }
        return keys.join('_');
    },

    getSymbolStamp: function (symbol) {
        var keys = [];
        if (Util.isArray(symbol)) {
            for (var i = 0; i < symbol.length; i++) {
                keys.push(Util.getSymbolStamp(symbol[i]));
            }
            return '[ ' + keys.join(' , ') + ' ]';
        }
        for (var p in symbol) {
            if (symbol.hasOwnProperty(p)) {
                if (!Util.isFunction(symbol[p])) {
                    if (Util.isGradient(symbol[p])) {
                        keys.push(p + '=' + Util.getGradientStamp(symbol[p]));
                    } else {
                        keys.push(p + '=' + symbol[p]);
                    }
                }
            }
        }
        return keys.join(';');
    },

    /**
     * Get external resources from the given symbol
     * @param  {Object} symbol      - symbol
     * @param  {Boolean} toAbsolute - whether convert url to aboslute
     * @return {String[]}           - resource urls
     */
    getExternalResources: function (symbol, toAbsolute) {
        if (!symbol) {
            return null;
        }
        var symbols = symbol;
        if (!Util.isArray(symbol)) {
            symbols = [symbol];
        }
        var resources = [];
        var props = maptalks.Symbolizer.resourceProperties,
            i, ii, iii, res, resSizeProp;
        var w, h;
        for (i = symbols.length - 1; i >= 0; i--) {
            symbol = symbols[i];
            if (!symbol) {
                continue;
            }
            if (toAbsolute) {
                symbol = Util.convertResourceUrl(symbol);
            }
            for (ii = 0; ii < props.length; ii++) {
                res = symbol[props[ii]];
                if (utils.isFunctionDefinition(res)) {
                    res = utils.getFunctionTypeResources(res);
                }
                if (!res) {
                    continue;
                }
                if (!Util.isArray(res)) {
                    res = [res];
                }
                for (iii = 0; iii < res.length; iii++) {
                    if (res[iii].slice(0, 4) === 'url(') {
                        res[iii] = Util.extractCssUrl(res[iii]);
                    }
                    resSizeProp = maptalks.Symbolizer.resourceSizeProperties[ii];
                    resources.push([res[iii], symbol[resSizeProp[0]], symbol[resSizeProp[1]]]);
                }
            }
            if (symbol['markerType'] === 'path' && symbol['markerPath']) {
                w = utils.isFunctionDefinition(symbol['markerWidth']) ? 200 : symbol['markerWidth'];
                h = utils.isFunctionDefinition(symbol['markerHeight']) ? 200 : symbol['markerHeight'];
                if (utils.isFunctionDefinition(symbol['markerPath'])) {
                    res = utils.getFunctionTypeResources(symbol['markerPath']);
                    var path = symbol['markerPath'];
                    for (iii = 0; iii < res.length; iii++) {
                        symbol['markerPath'] = res[iii];
                        resources.push([maptalks.Geometry.getMarkerPathBase64(symbol), w, h]);
                    }
                    symbol['markerPath'] = path;
                } else {
                    resources.push([maptalks.Geometry.getMarkerPathBase64(symbol), w, h]);
                }
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

        var s = symbol;
        if (isNode) {
            return s;
        }
        var props = maptalks.Symbolizer.resourceProperties;
        var res;
        for (var ii = 0, len = props.length; ii < len; ii++) {
            res = s[props[ii]];
            if (!res) {
                continue;
            }
            s[props[ii]] = this._convertUrlToAbsolute(res);
        }
        return s;
    },

    _convertUrlToAbsolute: function (res) {
        if (utils.isFunctionDefinition(res)) {
            var stops = res.stops;
            for (var i = 0; i < stops.length; i++) {
                stops[i][1] = Util._convertUrlToAbsolute(stops[i][1]);
            }
            return res;
        }
        var embed = 'data:';
        if (res.slice(0, 4) === 'url(') {
            res = Util.extractCssUrl(res);
        }
        if (!Util.isURL(res) &&
            (res.length <= embed.length || res.substring(0, embed.length) !== embed)) {
            res = this._absolute(location.href, res);
        }
        return res;
    },

    _absolute: function (base, relative) {
        var stack = base.split('/'),
            parts = relative.split('/');
        if (relative.slice(0, 1) === 0) {
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
    },

    /**
     * Compile layer's style, styles to symbolize layer's geometries, e.g.<br>
     * <pre>
     * [
     *   {
     *     'filter' : ['==', 'foo', 'val'],
     *     'symbol' : {'markerFile':'foo.png'}
     *   }
     * ]
     * </pre>
     * @param  {Object|Object[]} styles - style to compile
     * @return {Object[]}       compiled styles
     */
    compileStyle: function (styles) {
        if (!Util.isArray(styles)) {
            return Util.compileStyle([styles]);
        }
        var compiled = [];
        for (var i = 0; i < styles.length; i++) {
            if (styles[i]['filter'] === true) {
                compiled.push({
                    'filter': function () {
                        return true;
                    },
                    'symbol': styles[i].symbol
                });
            } else {
                compiled.push({
                    'filter': utils.createFilter(styles[i]['filter']),
                    'symbol': styles[i].symbol
                });
            }
        }
        return compiled;
    }

};

Util.GUID = Util.UID;


//RequestAnimationFrame, inspired by Leaflet
(function () {
    if (isNode) {
        Util.requestAnimFrame = function (fn) {
            return setTimeout(fn, 16);
        };

        Util.cancelAnimFrame = clearTimeout;
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
            getPrefixed('CancelRequestAnimationFrame') || function (id) {
                window.clearTimeout(id);
            };
    } else {
        requestFn = timeoutDefer;
        cancelFn = function (id) {
            clearTimeout(id);
        };
    }
    Util.requestAnimFrame = function (fn) {
        return requestFn(fn);
    };

    Util.cancelAnimFrame = function (id) {
        if (id) {
            cancelFn(id);
        }
    };
})();

export default Util;
