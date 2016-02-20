/**
 * 基础工具类
 * @class maptalks.Util
 * @author Maptalks Team
 */
Z.Util = {
    /**
     * @property {Number} globalCounter
     * @static
     */
    globalCounter: 0,

    now:function() {
        if (!Date.now) {
            return new Date().getTime();
        }
        return Date.now();
    },

    /**
     * 类扩展
     * @param {Object} 父类
     */
    extend: function (dest) { // (Object[, Object, ...]) ->
        var sources = Array.prototype.slice.call(arguments, 1),i, j, len, src;

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
     * 设置options
     * @param {Object} obj 对象
     * @param {Object} options
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

    loadImage:function(img, url) {
        function onError(err) {
            console.error(err);
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
            if (!global._maptalksImageFileCache.get(url)) {
                global._maptalksImageFileCache.add(url, data);
            }
            var onloadFn = img.onload;
            if (onloadFn) {
                img.onload = function() {
                    onloadFn.call(img);
                };
            }
            img.src = data;
        }
        if (Z.runningInNode) {
            try {
                if (!global._maptalksImageFileCache) {
                    //cache 10 svg files.
                    global._maptalksImageFileCache = new Z.TileLayer.TileCache(100);
                }
                var cache = global._maptalksImageFileCache;
                if (cache.get(url)) {
                    onLoadComplete(null, cache.get(url))
                    return;
                }
                var segs = url.split('.');
                if (segs[segs.length-1] === 'svg') {
                    Z.Util._convertSVG2PNG(url, onLoadComplete);
                } else {
                    //canvas-node的Image对象
                    if (Z.Util.isURL(url)) {
                        this._loadRemoteImage(img, url, onLoadComplete);
                    } else {
                        this._loadLocalImage(img,url, onLoadComplete);
                    }
                }

            } catch (error) {
                 onError(error);
            }
        } else {
            img.src=url;
        }
        return this;
    },

    _loadRemoteImage:function(img, url, onComplete) {
        //读取远程图片
        var loader;
        if (url.indexOf('https://') === 0) {
            if (!this._nodeHttps) {
                this._nodeHttps = require('https');
            }
            loader = this._nodeHttps;
        } else {
            if (!this._nodeHttp) {
                this._nodeHttp = require('http');
            }
            loader = this._nodeHttp;
        }
        loader.get(url, function(res) {
            var data = new Buffer(parseInt(res.headers['content-length'],10));
            var pos = 0;
            res.on('data', function(chunk) {
              chunk.copy(data, pos);
              pos += chunk.length;
            });
            res.on('end', function () {
                onComplete(null, data);
            });
        }).on('error', onComplete);
    },

    _loadLocalImage:function(img, url, onComplete) {
        //读取本地图片
        if (!this._nodeFS) {
            this._nodeFS = require('fs');
        }
        var data = this._nodeFS.readFile(url,onComplete);
    },

    _convertSVG2PNG:function(url, complete) {
        if (!this._svg2png) {
            //use svg2png to convert svg to png.
            //https://github.com/domenic/svg2png
            this._svg2png = require('svg2png');
        }
        if (!this._nodeFS) {
            this._nodeFS = require('fs');
        }
        var furl = url;
        if (furl.indexOf('http://') < 0 && furl.indexOf('https://') < 0) {
            //is a local file
            furl = ('file:///'+furl).replace(/\\/g,'/');
        }

        var fs = this._nodeFS;
        function unlinkFile(file) {
            try {
                fs.stat(file, function(err, stat) {
                    if (err == null) {
                        try {
                            fs.unlink(file, function(err2) {
                                if (err2) {
                                    console.error(err2)
                                }
                            });
                        } catch (ulerr) {
                            console.error(ulerr);
                        }
                    }
                });
            } catch (error) {
                console.error(error);
            }

        }
        var now = new Date().getTime();
        var tmpPngFile = (__dirname+'/tmp-'+now+'.png').replace(/\\/g,'/');
        this._svg2png(furl, tmpPngFile, function (error) {
            if (error) {
                unlinkFile(tmpPngFile);
                complete(error);
                return;
            }
            fs.readFile(tmpPngFile, function(err,data) {
                unlinkFile(tmpPngFile);
                if (err) {
                    complete(err);
                    return;
                }
                complete(null, data);
            });
        });
    },

    fixPNG:function(img) {

    },

    /**
     * 获取全局id
     * @return {String} 全局id
     */
    GUID: function() {
        return '___MAPTALKS_GLOBAL_'+(Z.Util.globalCounter++);
    },

    lastId: 0,

    /**
     * 将字符串转化为JSON对象
     * @param {String} str 字符串
     * @return {Object} JSON object
     */
    parseJSON:function(str) {
        if (!str || !Z.Util.isString(str)) {
            return str;
        }
        return JSON.parse(str);
    },

    /**
     * 在低版本浏览器上实现create
     * @method
     */
    create: Object.create || (function () {
        function F() {}
        return function (proto) {
            F.prototype = proto;
            return new F();
        };
    })(),

    /**
     * 在低版本浏览器上实现bind
     * @param {Function} fn 执行的函数
     * @param {Object} obj 执行的上下文
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

    //from leaflet
    // return a function that won't be called more often than the given interval
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

    removeFromArray:function(obj, array) {
        for (var i = array.length - 1; i >= 0; i--) {
            if (array[i] === obj) {
                return array.splice(i, 1);
            }
        }
        return null;
    },

    /**
     * 遍历数组中的每个元素,并执行fn操作, 兼容N维数组, 如果数组中有null或undefined,则continue不作处理
     * @param {Array}   points 数组
     * @param {Object} context 上下文
     * @param {Function} fn 函数
     * @return {Array} result
     */
    eachInArray:function(points, context, fn) {
        if (!this.isArray(points)) {
            return null;
        }
        var result = [];
        for (var i=0,len=points.length;i<len;i++) {
            var p = points[i];
            if (Z.Util.isNil(p)) {
                continue;
            }
            if (Z.Util.isArray(p)) {
                result.push(Z.Util.eachInArray(p, context, fn));
            } else {
                var pp = fn.call(context,p);
                result.push(pp);
            }

        }
        return result;
    },

    /**
     * 在数组arr中查找obj,并返回其序号index
     * @param  {Object} obj 查找的对象
     * @param  {Array} arr 查找的目标数组
     * @return {Number}     序号
     */
    searchInArray:function(obj, arr) {
        if (Z.Util.isNil(obj) || !Z.Util.isArrayHasData(arr)) {
            return -1;
        }
        for (var i = 0, len=arr.length; i < len; i++) {
            if (arr[i] === obj) {
                return i;
            }
        }
        return -1;
    },

    /**
     * 判断a和b是否相同, 浅层判断, 不涉及子属性
     * borrowed from expect.js
     * @param  {Object} a
     * @param  {Object} b
     * @param {Boolean} isDeep 是否深度判断
     * @return {Boolean}   true|false
     */
    objEqual:function(a, b) {
        return Z.Util._objEqual(a,b);
    },

    /**
     * 判断a和b是否相同, 深层判断, 子属性也必须相同,du
     * borrowed from expect.js
     * @param  {Object} a
     * @param  {Object} b
     * @param {Boolean} isDeep 是否深度判断
     * @return {Boolean}   true|false
     */
    objDeepEqual:function(a, b) {
        return Z.Util._objEqual(a,b, true);
    },

    _objEqual:function(a, b, isDeep) {
        function getKeys (obj) {
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
        if (a.prototype !== b.prototype) {return false;}
        var ka, kb, key, i;
        try{
            ka = getKeys(a);
            kb = getKeys(b);
        } catch (e) {//happens when one is a string literal and the other isn't
          return false;
        }
        // having the same number of owned properties (keys incorporates hasOwnProperty)
        if (ka.length !== kb.length){
          return false;
        }
        //~~~cheap key test
        for (i = ka.length - 1; i >= 0; i--) {
          if (ka[i] != kb[i]){
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

    /**
     * 四舍五入
     * @param  {Number} num 坐标值
     * @return {Number} 处理后的坐标值
     */
    round:function(num) {
        if (num > 0) {
            return (0.5 + num) << 0;
        } else {
            return (num - 0.5) << 0;
        }

    },

    /**
     * 是否为坐标
     * @param  {Object} obj 对象
     * @return {Boolean} true：坐标
     */
    isCoordinate:function(obj) {
        if (obj instanceof Z.Coordinate) {
            return true;
        }
        /*if (obj && !Z.Util.isNil(obj.x) && !Z.Util.isNil(obj.y)) {
            return true;
        }*/
        return false;
    },
    /**
     * 判断obj是否为undefined或者null
     * @param  {Object}  obj 对象
     * @return {Boolean}     true|false
     */
    isNil:function(obj) {
        return (typeof(obj) === 'undefined' || obj === null);
    },

    /**
     * 判断val是不是合法的数字, 即数字类型且不是NaN
     * @param  {Object}  val 考察的数字
     * @return {Boolean}     结果
     */
    isNumber:function(val) {
        return (typeof val === 'number') && !isNaN(val);
    },

    /**
     * 判断obj是否是一个Object类型且不为null
     * @param  {[type]}  obj 要检查的对象
     * @return {Boolean}     如果obj是Object类型且不为null，返回true；反之返回false
     */
    isObject: function (obj) {
        return typeof obj === 'object' && !!obj;
    },
    /**
     * 设置默认值
     * @param {Object} value 赋值
     * @param {Object} defaultValue 默认值
     */
    getValueOrDefault: function(value, defaultValue) {
        return (Z.Util.isNil(value))?defaultValue:value;
    },

    /**
     * 判断数组中是否包含obj
     * @param {Object} obj
     * @return {Boolean} true|false
     */
    isArrayHasData:function(obj) {
        return this.isArray(obj) && obj.length>0;
    },

    /**
     * 判断是否数组
     * @param {Object} obj
     * @return {Boolean} true|false
     */
    isArray:function(obj) {
        if (!obj) {return false;}
        return typeof obj == 'array' || (obj.constructor !== null && obj.constructor == Array);
    },

    /**
     * 判断是否字符串
     * @param {Object} _str
     * @return {Boolean} true|false
     */
    isString:function(_str) {
        if (Z.Util.isNil(_str)) {return false;}
        return typeof _str == 'string' || (_str.constructor!==null && _str.constructor == String);
    },

    /**
     * 判断是否函数
     * @param {Object} _func
     * @return {Boolean} true|false
     */
    isFunction:function(_func) {
        if (this.isNil(_func)) {
            return false;
        }
        return typeof _func == 'function' || (_func.constructor!==null && _func.constructor == Function);
    },

    /**
     * 判断是否是url
     * @param  {[type]}  url [description]
     * @return {Boolean}     [description]
     */
    isURL:function(url) {
        if (!url) {
            return false;
        }
        if (url.indexOf('http://') >= 0 || url.indexOf('https://') >= 0 || url.indexOf('blob:') >= 0) {
            return true;
        }
        return false;
    },

    /**
     * 将带减号的名称转化为camel名称, 如foo-class -> fooClass
     * @param  {String} p 带减号名称
     * @return {String}   camel名称
     */
    convertMinusToCamel: function(str) {
        var re = /-([A-Za-z])/g;
        return str.replace(re, function (match, p1, offset, str) {
            return p1.toUpperCase();
        });
    },

    /**
     * 将camel名称转化为带减号的名称, 如fooClass -> foo-class
     * @param  {String} p camel名称
     * @return {String}   带减号名称
     */
    convertCamelToMinus: function(str) {
        var re = /([A-Z])/g;
        return str.replace(re, function (match, p1, offset, str) {
            if (offset > 0) {
                return '-' + p1.toLowerCase();
            }
            return p1.toLowerCase();
        });
    },

    /**
     * 转换对象属性变量名风格, 即将属性名在camel风格到minus风格间转换
     * @param  {Object} symbol 对象
     * @param  {String} style   转换风格:'minus'或'camel'
     * @return {Object}    转换后的对象
     */
    convertFieldNameStyle:function(symbol,style) {
        if (!symbol) {
            return null;
        }
        var fn;
        if (style === 'minus') {
            fn = this.convertCamelToMinus;
        } else {
            fn = this.convertMinusToCamel;
        }
        var option = {};
        for (var p in symbol) {
            if (symbol.hasOwnProperty(p)) {
                if (p === "") {continue;}
                option[fn(p)]=symbol[p];
            }
        }
        return option;
    },

    //改原先的regex名字为xWithQuote；不带引号的regex，/^url\(([^\'\"].*[^\'\"])\)$/i，为xWithoutQuote。然后在is函数里||测试，extract函数里if...else处理。没引号的匹配后，取matches[1]

    // match: url('x'), url("x").
    // TODO: url(x)
    cssUrlReWithQuote: /^url\(([\'\"])(.+)\1\)$/i,

    cssUrlRe:/^url\(([^\'\"].*[^\'\"])\)$/i,

    isCssUrl: function (str) {
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
        if (test === 1) {
            matches = Z.Util.cssUrlRe.exec(str);
            return matches[1];
        } if (test === 2) {
            matches = Z.Util.cssUrlReWithQuote.exec(str);
            return matches[2];
        } else {
            // return as is if not an css url
            return str;
        }
    },

    b64chrs : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',

    /**
     * from https://github.com/davidchambers/Base64.js
     * @param  {[type]} input [description]
     * @return {[type]}       [description]
     */
    btoa:function(input) {
        if (window && window.btoa) {
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
          charCode = str.charCodeAt(idx += 3/4);
          if (charCode > 0xFF) {
            throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
          }
          block = block << 8 | charCode;
        }
        return output;
    },

    /**
     * borrowed from jquery, Evaluates a script in a global context
     * @param {String} code
     */
    globalEval: function( code ) {
        var script = document.createElement( "script" );
        script.text = code;
        document.head.appendChild( script ).parentNode.removeChild( script );
    },

    globalScript: function( file ) {
        var script = document.createElement( "script" );
        script.type = "text/javascript"
        script.src = file;
        document.head.appendChild( script );
    },

    /**
     * 获取异常信息
     * @param {String} exceptionStr 异常字符串
     * @param {String[]} 参数数组
     * @return {String} 异常字符串
     */
    getExceptionInfo: function(exceptionStr, params) {
        if(!params) return exceptionStr;
        if(this.isString(params)) params = [params];
        if(this.isArray) {
            for(var i=0,len=params.length;i<len;i++) {
                exceptionStr = exceptionStr.replace('%'+(i+1), params[i]);
            }
        }
        return exceptionStr;
    },

    decreaseSymbolOpacity:function(symbol, ratio) {
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
                s(symbol[i],ratio);
            }
        } else {
            s(symbol,ratio);
        }
        return symbol;
    },

    extendSymbol:function(symbol) {
        var sources = Array.prototype.slice.call(arguments, 1);
        if (!sources) {
            sources = [{}];
        }
        if (Z.Util.isArray(symbol)) {
            var result = [];
            for (var i = 0; i < symbol.length; i++) {
                var s = symbol[i];
                var dest = {};
                for (var ii = 0; ii < sources.length; ii++) {
                    if (!Z.Util.isArray(sources[ii])) {
                        Z.Util.extend(dest, s, sources[ii]);
                    } else {
                        if (!Z.Util.isNil(sources[ii][i])) {
                            Z.Util.extend(dest, s, sources[ii][i]);
                        }
                    }
                }
                result.push(dest);
            }
            return result;
        } else {
            return Z.Util.extend.apply(Z.Util, [{}, symbol].concat(sources));
        }
    }

};

if (typeof(window) != 'undefined') {
    //动画, inspired by Leaflet
    (function () {
        // inspired by http://paulirish.com/2011/requestanimationframe-for-smart-animating/

        function getPrefixed(name) {
            return window['webkit' + name] || window['moz' + name] || window['ms' + name];
        }

        var lastTime = 0;

        // fallback for IE 7-8
        function timeoutDefer(fn) {
            var time = +new Date(),
                timeToCall = Math.max(0, 16 - (time - lastTime));

            lastTime = time + timeToCall;
            return window.setTimeout(fn, timeToCall);
        }

        var requestFn = window['requestAnimationFrame'] || getPrefixed('RequestAnimationFrame') || timeoutDefer,
            cancelFn = window['cancelAnimationFrame'] || getPrefixed('CancelAnimationFrame') ||
                       getPrefixed('CancelRequestAnimationFrame') || function (id) { window.clearTimeout(id); };


        Z.Util.requestAnimFrame = function (fn) {
                return requestFn.call(window, fn);
        };

        Z.Util.cancelAnimFrame = function (id) {
            if (id) {
                cancelFn.call(window, id);
            }
        };
    })();

}

/**
 * Ajax
 * @class maptalks.Util.Ajax
 * @author Maptalks Team
 */
Z.Util.Ajax =
    /**
     * Ajax请求
     * @method Ajax
     * @param {String} sUrl 请求地址
     * @param {String} sRecvTyp text/xml
     * @param {String} sQueryString 参数
     * @param {Function} oResultFunc 会到函数
     * @param {String} responseType 响应类型 text/xml/json
     */
function(sUrl,sRecvTyp,sQueryString,oResultFunc,responseType) {
    this.Url = sUrl;
    this.QueryString = sQueryString;
    this.resultFunc = oResultFunc;
    this.reponseType = responseType;
    this.XmlHttp = this.createXMLHttpRequest();
    if (!this.XmlHttp) {
        alert("error");
        return;
    }
    var objxml = this.XmlHttp;
    var me = this;
    if((window.XDomainRequest && document["documentMode"] === 8) || objxml.withCredentials!==undefined){    //xhr2直接用onload
        objxml.onload = function (){me.handleStateChange(objxml,sRecvTyp,oResultFunc);};
    }else{
        objxml.onreadystatechange = function (){me.handleStateChange(objxml,sRecvTyp,oResultFunc);};
    }
};

Z.Util.extend(Z.Util.Ajax.prototype, {
    /**
     * XMLHttp Request
     * @member maptalks.Util.Ajax
     */
    createXMLHttpRequest : function() {
        if (Z.Browser.ie) {
            if (document["documentMode"] == 8) {
                try { return new XDomainRequest();} catch(e) {}
            }
        }
        try { return new XMLHttpRequest(); } catch(e) {}
        try { return new ActiveXObject("Msxml2.XMLHTTP"); } catch(e) {}
        try { return new ActiveXObject("Microsoft.XMLHTTP"); } catch(e) {}

        return null;
    },

    /**
     * 构造请求字符串
     * @member maptalks.Util.Ajax
     */
    createQueryString : function () {
        var queryString = this.QueryString;
        return queryString;
    },

    /**
     * doGet Request
     * @member maptalks.Util.Ajax
     */
    get : function () {
        var sUrl = this.Url;
        var xmlHttp = this.XmlHttp;
        var queryString = this.createQueryString();
        var url = sUrl+(!queryString?"":("?"+queryString));
        xmlHttp.open("GET",url,true);
        if (this.reponseType  && xmlHttp.responseType) {
            xmlHttp.responseType=this.responseType;
        }
        xmlHttp.send(null);
    },

    /**
     * doPost Request
     * @member maptalks.Util.Ajax
     */
    post : function(contentType) {
        var sUrl = this.Url;
        var queryString = this.createQueryString();
        this.XmlHttp.open("POST",sUrl,true);
        if (this.reponseType && this.XmlHttp.responseType) {
            this.XmlHttp.responseType=this.responseType;
        }
        //alert((typeof this.XmlHttp));
        var ct = contentType ? contentType : 'application/x-www-form-urlencoded';
        if(!window.XDomainRequest) {
            this.XmlHttp.setRequestHeader("Content-Type", ct);
        }
        this.XmlHttp.send(queryString);
    },

    /**
     * ajax请求返回处理
     * @param {Object} XmlHttp http request Obj
     * @param {Object} sRecvTyp
     * @param {Function} oResultFunc 回调函数
     * @member maptalks.Util.Ajax
     */
    handleStateChange : function (XmlHttp,sRecvTyp,oResultFunc) {
        if(XmlHttp.withCredentials !== undefined || (window.XDomainRequest && Z.Browser.ie && document["documentMode"] === 8)) {
            oResultFunc(XmlHttp.responseText);
            //XmlHttp.responseText=null;
            XmlHttp = null;
        }else{
            if (XmlHttp.readyState == 4) {
                if (XmlHttp.status == 200) {
                    oResultFunc(sRecvTyp?XmlHttp.responseXML:XmlHttp.responseText);
                    //XmlHttp.responseText=null;
                    XmlHttp = null;
                } else {
                    if (XmlHttp.status === 0) {
                        XmlHttp = null;
                        return;
                    }
                    oResultFunc('{"success":false,"error":\"Status:'+XmlHttp.status+","+XmlHttp.statusText+'\"}');
                    XmlHttp = null;
                }
            }
        }
    }
});

/**
 * 载入外部资源, 并执行回调函数, 参数为资源内容
 * @param {String} url 请求地址
 * @param {Function} callback 请求回调函数
 * @param {Object} context 上下文
 * @member maptalks.Util.Ajax
 */
Z.Util.Ajax.getResource=function(url, callback, context) {
    var resourceAjax = new Z.Util.Ajax(url,0,null,function(responseText){
            if (callback) {
                if (context) {
                    callback.call(context,responseText);
                } else {
                    callback(responseText);
                }
            }
        });

    resourceAjax.get();
    resourceAjax = null;
};

/**
 * 载入script, 执行script, 并执行回调
 * @param {String} url 请求地址
 * @param {Function} callback 请求回调函数
 * @param {Object} context 上下文
 * @member maptalks.Util.Ajax
 */
Z.Util.Ajax.getScript=function(url, callback, context) {
    var realCallback = function(responseText) {
        Z.Util.globalEval(responseText);
        if (callback) {
            if (context) {
                callback.call(context);
            } else {
                callback();
            }
        }
    };
    Z.Util.Ajax.getResource(url,realCallback,context);
};
