/**
 * @description promise/A标准的http对象，支持json,jsonp方法
 * @module http
 */
import noop from './noop';

const _parseData = function (data) {
    var ret = "";
    if (typeof data === "string") {
        ret = data;
    } else if (typeof data === "object") {
        for (var key in data) {
            ret += "&" + key + "=" + encodeURIComponent(data[key]);
        }
    }
    //ret += "&_time=" + this.now();
    ret = ret.substr(1);
    return ret;
}
const _now = function () {
    return (new Date()).getTime();
};

const _random = function () {
    return Math.random().toString().substr(2);
};

const _removeElem = function (elem) {
    var parent = elem.parentNode;
    if (parent && parent.nodeType !== 11) {
        parent.removeChild(elem);
    }
};
/**
 * @class
 */
class ajax {
    /**
     * 
     * @param {String} url 
     * @param {Object} data 
     * @param {*} success 
     * @param {*} fail 
     */
    static getBinary(url, data, success, fail) {
        let _url = url || "",
            _data = data || {},
            _success = success || noop,
            _fail = fail || noop;
        //ajax-get请求
        let xhr = new XMLHttpRequest();
        _url = _url + (_url.indexOf("?") === -1 ? "?" : "&") + _parseData(data);
        xhr.responseType = 'arraybuffer';
        let failTick = setTimeout(10000, function () {
            _fail('请求超时');
        });
        xhr.onload = (e) => {
            clearTimeout(failTick);
            success(xmlHttp.response);
        }
        xhr.open('GET', _url, true);
        xhr.send(null);
    }
    /**
     * ajax GET 方法
     * @param {any} url
     * @param {any} data
     * @param {any} success
     * @param {any} fail
     */
    static get(url, data, success, fail) {
        var _url = url || "",
            _data = data || {},
            _success = success || noop,
            _fail = fail || noop;
        //ajax-get请求
        var xhr = new XMLHttpRequest();
        _url = _url + (_url.indexOf("?") === -1 ? "?" : "&") + _parseData(data);
        var failTick = setTimeout(10000, function () {
            _fail('请求超时');
        });
        //ajax状态改变
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                clearTimeout(failTick);
                //success(xhr.responseXML);
                success(xhr.responseText);
            }
        };
        xhr.open('GET', _url, true);
        xhr.send(null);
    }
    /**
     * ajax POST 方法
     * @param {any} url
     * @param {any} data
     * @param {any} success
     * @param {any} fail
     */
    static post(url, data, success, fail) {
        let _url = url || "",
            _data = data || {},
            _success = success || noop,
            _fail = fail || noop;
        //ajax-post请求
        let xhr = new XMLHttpRequest();
        xhr.setRequestHeader("content-type", "application/x-www-form-urlencoded");
        let failTick = setTimeout(10000, function () {
            _fail('请求超时');
        });
        //ajax状态改变
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                clearTimeout(failTick);
                //success(xhr.responseXML);
                success(xhr.responseText);
            }
        };
        xhr.open('POST', _url, true);
        xhr.send(_data);
    }
}
/**
 * @class
 */
class jsonp {
    /**
     *  jsonp GET 方法
     * @param {any} url
     * @param {any} data
     * @param {any} success
     * @param {any} fail
     */
    static get(url, data, success, fail) {
        var name, that = this; //函数名
        success = success || noop;
        fail = fail || noop;
        // 拼装url
        url = url + (url.indexOf("?") === -1 ? "?" : "&") + _parseData(data) + "&_time=" + _now();
        // 检测callback的函数名是否已经定义
        var match = /callback=(\w+)/.exec(url);
        if (match && match[1]) {
            name = match[1];
        } else {
            // 如果未定义函数名的话随机成一个函数名
            // 随机生成的函数名通过时间戳拼16位随机数的方式，重名的概率基本为0
            // 如:jsonp_1355750852040_8260732076596469
            name = "jsonp_" + _now() + '_' + _rand();
            url += !match ? "&callback=?" : "";
            // 把callback中的?替换成函数名
            url = url.replace("callback=?", "callback=" + name);
            // 处理?被encode的情况
            url = url.replace("callback=%3F", "callback=" + name);
        }
        // 创建一个script元素
        var script = document.createElement("script");
        script.type = "text/javascript";
        // 设置要远程的url
        script.src = url;
        // 设置id，为了后面可以删除这个元素
        script.id = "id_" + name;
        var failTick = setTimeout(10000, function () {
            _fail("请求超时");
        });
        // 把传进来的函数重新组装，并把它设置为全局函数，远程就是调用这个函数
        window[name] = function (json) {
            // 执行这个函数后，要销毁这个函数
            window[name] = undefined;
            clearTimeout(failTick);
            // 获取这个script的元素
            var elem = document.getElementById("id_" + name);
            // 删除head里面插入的script，这三步都是为了不影响污染整个DOM啊
            _removeElem(elem);
            // 执行传入的的函数
            success(json);
        };
        var head = document.getElementsByTagName('head');
        if (head && head[0]) {
            head[0].appendChild(script);
        }
    }

}
/**
 * @class 
 */
class http {
    /**
     *
     * @param {String} url
     * @param {Object} args
     * @param {String} [type] 可选参数，支持 json和jsonp
     * @returns {Promise} promise对象
     */
    static get(url, args, type = 'json') {
        return new Promise(function (resolve, reject) {
            if (type === 'json') {//jsonp形式
                ajax.get(url, args, function (data) {
                    resolve(data);
                }, function (err) {
                    reject(err);
                });
            } else if (type === 'jsonp') {
                jsonp.get(url, args, function (data) {
                    resolve(data);
                }, function (err) {
                    reject(err);
                });
            }
        });
    }
    /**
     * use arraybuffer to get binarydata by xhr object
     * @param {String} url 
     * @param {object} args 
     */
    static getBinary(url, args) {
        return new Promise(function (resolve, reject) {
            ajax.getBinary(url, args||{}, function (data) {
                resolve(data);
            }, function (data) {
                reject(data);
            });
        });
    }
    /**
     * 
     * @param {any} url
     * @param {any} args
     * @returns {Promise} promise对象
     */
    static post(url, args) {
        return new Promise(function (resolve, reject) {
            ajax.post(url, args, function (data) {
                resolve(data);
            }, function (err) {
                reject(err);
            })
        })
    }
};

export default http;