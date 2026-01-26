import { uid, extend } from '../common/Util';

/**
 * @classdesc
 * Ajax Utilities. It is static and should not be initiated.
 * @class
 * @static
 * @category core
 */
const Ajax = {

    /**
     * Fetch remote resource by HTTP "GET" method
     * @param  {String}   url - resource url
     * @param  {Object}   [options=null] - request options
     * @param  {Object}   [options.headers=null] - HTTP headers
     * @param  {String}   [options.responseType=null] - responseType
     * @param  {String}   [options.credentials=null]  - if with credentials, set it to "include"
     * @param  {Function} cb  - callback function when completed
     * @return {Ajax}  Ajax
     * @example
     * maptalks.Ajax.get(
     *     'url/to/resource',
     *     (err, data) => {
     *         if (err) {
     *             throw new Error(err);
     *         }
     *         // do things with data
     *     }
     * );
     */
    get: function (url, options = {}, urlModifier) {
        if (!options) {
            options = {};
        }
        //https://github.com/maptalks/issues/issues/919
        //注意opitons的值,多个fetch的options可能共享,比如图层里有多个gltf,这个options可能来自layer上的options共享值
        //getArrayBuffer/getJSON 等,会修改 options.responseType
        //如果先 getJSON,然后在 getArrayBuffer，注意这时options.responseType被修改了，导致getJSON callback判断的responseType为arraybuffer
        options = extend({}, options);
        const controller = new AbortController();
        const signal = controller.signal;
        const requestConfig = extend({}, options);

        // const requestConfig = {
        //     signal, method: options.method || 'GET', referrerPolicy: 'origin'
        // };
        requestConfig.signal = signal;
        if (!requestConfig.method) {
            requestConfig.method = 'GET';
        }
        requestConfig.referrerPolicy = requestConfig.referrerPolicy || 'origin';
        if (typeof window !== 'undefined' && !requestConfig.referrer) {
            requestConfig.referrer = window.location.href;
        }
        // const isPost = options.method === 'POST';
        // if (isPost) {
        //     if (!isNil(options.body)) {
        //         requestConfig.body = JSON.stringify(options.body);
        //     }
        // }
        // if (!isNil(options.headers)) {
        //     requestConfig.headers = options.headers;
        // }
        // if (!isNil(options.credentials)) {
        //     requestConfig.credentials = options.credentials;
        // }
        if (urlModifier) {
            url = urlModifier(url);
        }
        const promise = fetch(url, requestConfig).then(response => {
            const parsed = this._parseResponse(response, options['responseType']);
            if (parsed.message) {
                return parsed;
            } else {
                return parsed.then(data => {
                    if (options.responseType === 'arraybuffer') {
                        return {
                            data,
                            cacheControl: response.headers.get('Cache-Control'),
                            expires: response.headers.get('Expires'),
                            contentType: response.headers.get('Content-Type')
                        };
                    } else {
                        return data;
                    }
                }).catch(err => {
                    if (!err.code || err.code !== DOMException.ABORT_ERR) {
                        throw err;
                    }
                });
            }
        }).catch(err => {
            if (!err.code || err.code !== DOMException.ABORT_ERR) {
                throw err;
            }
        });
        promise.xhr = controller;
        return promise;
    },

    _parseResponse(response, responseType) {
        if (response.status !== 200) {
            return {
                status: response.status,
                statusText: response.statusText,
                message: `incorrect http request with status code(${response.status}): ${response.statusText}`,
            };
        } else if (responseType === 'arraybuffer') {
            return response.arrayBuffer();
        } else if (responseType === 'json') {
            return response.json();
        } else {
            return response.text();
        }
    },
    /**
     * Fetch resource as arraybuffer.
     * @param {String} url    - url
     * @param {Object} [options=null] - options, same as Ajax.get
     * @param {Function} cb   - callback function when completed.
     * @example
     * maptalks.Ajax.getArrayBuffer(
     *     'url/to/resource.bin',
     *     (err, data) => {
     *         if (err) {
     *             throw new Error(err);
     *         }
     *         // data is a binary array
     *     }
     * );
     */
    getArrayBuffer(url, options = {}, urlModifier) {
        if (!options) {
            options = {};
        }
        options['responseType'] = 'arraybuffer';
        return Ajax.get(url, options, urlModifier);
    },

    // from mapbox-gl-js
    // getImage(img, url, options) {
    //     return Ajax.getArrayBuffer(url, options, (err, imgData) => {
    //         if (err) {
    //             if (img.onerror) {
    //                 img.onerror(err);
    //             }
    //         } else if (imgData) {
    //             const URL = window.URL || window.webkitURL;
    //             const onload = img.onload;
    //             img.onload = () => {
    //                 if (onload) {
    //                     onload();
    //                 }
    //                 URL.revokeObjectURL(img.src);
    //             };
    //             const blob = new Blob([new Uint8Array(imgData.data)], { type: imgData.contentType });
    //             img.cacheControl = imgData.cacheControl;
    //             img.expires = imgData.expires;
    //             img.src = imgData.data.byteLength ? URL.createObjectURL(blob) : emptyImageUrl;
    //         }
    //     });
    // }
};

/**
 * Fetch resource as a JSON Object.
 * @param {String} url          - json's url
 * @param {Object} [options=null]        - optional options
 * @param {String} [options.jsonp=false] - fetch by jsonp, false by default
 * @param {Function} cb   - callback function when completed.
 * @example
 * maptalks.Ajax.getJSON(
 *     'url/to/resource.json',
 *     { jsonp : true },
 *     (err, json) => {
 *         if (err) {
 *             throw new Error(err);
 *         }
 *         // json is a JSON Object
 *         console.log(json.foo);
 *     }
 * );
 * @static
 */
Ajax.getJSON = function (url, options = {}, urlModifier) {
    if (options && options['jsonp']) {
        return Ajax.jsonp(url);
    }
    options = options || {};
    options['responseType'] = 'json';
    return Ajax.get(url, options, urlModifier);
};


/**
 * Get JSON data by jsonp
 * from https://gist.github.com/gf3/132080/110d1b68d7328d7bfe7e36617f7df85679a08968
 * @param  {String}   url - resource url
 * @param  {Function} cb  - callback function when completed
 */
Ajax.jsonp = function (url) {
    // INIT
    const name = '_maptalks_jsonp_' + uid();
    if (url.match(/\?/)) url += '&callback=' + name;
    else url += '?callback=' + name;

    // Create script
    let script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;

    return new Promise((resolve) => {
        // Setup handler
        window[name] = function (data) {
            document.getElementsByTagName('head')[0].removeChild(script);
            script = null;
            delete window[name];
            resolve(data);
        };

        // Load JSON
        document.getElementsByTagName('head')[0].appendChild(script);
    });
};

export default Ajax;
