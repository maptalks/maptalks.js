import { isFunction, isNil, uid } from '../../common/Util';

const USE_FETCH = typeof fetch === 'function' && typeof AbortController === 'function';

/**
 * @classdesc
 * Ajax Utilities. It is static and should not be initiated.
 * @class
 * @static
 * @category core
 */
const Ajax = {

    /**
     * Get JSON data by jsonp
     * from https://gist.github.com/gf3/132080/110d1b68d7328d7bfe7e36617f7df85679a08968
     * @param  {String}   url - resource url
     * @param  {Function} cb  - callback function when completed
     */
    jsonp: function (url, callback) {
        // INIT
        const name = '_maptalks_jsonp_' + uid();
        if (url.match(/\?/)) url += '&callback=' + name;
        else url += '?callback=' + name;

        // Create script
        let script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;

        // Setup handler
        window[name] = function (data) {
            callback(null, data);
            document.getElementsByTagName('head')[0].removeChild(script);
            script = null;
            delete window[name];
        };

        // Load JSON
        document.getElementsByTagName('head')[0].appendChild(script);
        return this;
    },

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
    get: function (url, options, cb) {
        if (isFunction(options)) {
            const t = cb;
            cb = options;
            options = t;
        }
        options = options || {};
        let errorLog = options.errorLog;
        if (isNil(errorLog)) {
            errorLog = true;
        }
        if (options.method) {
            options.method = options.method.toUpperCase();
        }
        const isPost = options.method === 'POST';
        if (!USE_FETCH) {
            const client = Ajax._getClient(cb);
            client.open(options.method || 'GET', url, true);
            if (options) {
                for (const k in options.headers) {
                    client.setRequestHeader(k, options.headers[k]);
                }
                client.withCredentials = options.credentials === 'include';
                if (options['responseType']) {
                    client.responseType = options['responseType'];
                }
            }
            client.send(isPost ? options.body : null);
            return client;
        } else {
            const controller = new AbortController();
            const requestConfig = options;
            requestConfig.signal = controller.signal;
            requestConfig.referrerPolicy = requestConfig.referrerPolicy || 'origin';
            requestConfig.method = requestConfig.method || 'GET';
            const request = new Request(url, requestConfig);
            if (options['returnJSON']) {
                request.headers.set('Accept', 'application/json');
            }
            fetch(request).then(response => {
                const parsed = this._parseResponse(response, options['returnJSON'], options['responseType']);
                if (parsed.message) {
                    parsed.url = url;
                    cb(parsed);
                } else {
                    parsed.then(data => {
                        if (options.responseType === 'arraybuffer') {
                            cb(null, {
                                data,
                                cacheControl: response.headers.get('Cache-Control'),
                                expires: response.headers.get('Expires'),
                                contentType: response.headers.get('Content-Type')
                            });
                        } else {
                            cb(null, data);
                        }
                    }).catch(err => {
                        if (!err.code || err.code !== DOMException.ABORT_ERR) {
                            if (errorLog) {
                                console.error('Fetch error:', url, err);
                            }
                            cb(err);
                        }
                    });
                }
            }).catch(err => {
                if (!err.code || err.code !== DOMException.ABORT_ERR) {
                    if (errorLog) {
                        console.error('Fetch error:', url, err);
                    }
                    cb(err);
                }
            });
            return controller;
        }
    },

    _parseResponse(response, isJSON, responseType) {
        if (response.status !== 200) {
            return {
                status: response.status,
                statusText: response.statusText,
                message: `incorrect http request with status code(${response.status}): ${response.statusText}`,
            };
        } else if (responseType === 'arraybuffer') {
            return response.arrayBuffer();
        } else {
            return isJSON ? response.json() : response.text();
        }
    },

    _wrapCallback: function (client, cb) {
        return function () {
            if (client.readyState === 4) {
                if (client.status === 200) {
                    if (client.responseType === 'arraybuffer') {
                        const response = client.response;
                        if (response.byteLength === 0) {
                            cb({
                                status: 200,
                                statusText: client.statusText,
                                message: 'http status 200 returned without content.'
                            });
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
                    cb({
                        status: client.status,
                        statusText: client.statusText,
                        message: `incorrect http request with status code(${client.status}): ${client.statusText}`,
                    });
                }
            }
        };
    },

    _getClient: function (cb) {
        /*eslint-disable no-empty, no-undef*/
        let client;
        try {
            client = new XMLHttpRequest();
        } catch (e) {
            try { client = new ActiveXObject('Msxml2.XMLHTTP'); } catch (e) {
                try { client = new ActiveXObject('Microsoft.XMLHTTP'); } catch (e) { }
            }
        }
        client.onreadystatechange = Ajax._wrapCallback(client, cb);
        return client;
        /*eslint-enable no-empty, no-undef*/
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
    getArrayBuffer(url, options, cb) {
        if (isFunction(options)) {
            const t = cb;
            cb = options;
            options = t;
        }
        if (!options) {
            options = {};
        }
        options['responseType'] = 'arraybuffer';
        return Ajax.get(url, options, cb);
    }
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
Ajax.getJSON = function (url, options, cb) {
    if (isFunction(options)) {
        const t = cb;
        cb = options;
        options = t;
    }
    const callback = function (err, resp) {
        const data = typeof resp === 'string' ? JSON.parse(resp) : resp || null;
        cb(err, data);
    };
    if (options && options['jsonp']) {
        return Ajax.jsonp(url, callback);
    }
    options = options || {};
    options['returnJSON'] = true;
    return Ajax.get(url, options, callback);
};

export default Ajax;
