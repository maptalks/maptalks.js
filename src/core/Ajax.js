import { IS_NODE, isString, isFunction, parseJSON } from 'core/util';

/**
 * @classdesc
 * Ajax Utilities in both Browser and Node. It is static and should not be initiated.
 * @class
 * @static
 * @category core
 */
const Ajax = {
    /**
     * Fetch remote resource by HTTP "GET" method
     * @param  {String}   url - resource url
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
        if (IS_NODE && Ajax.get.node) {
            return Ajax.get.node(url, options, cb);
        }
        if (isFunction(options)) {
            cb = options;
            options = null;
        }
        const client = Ajax._getClient(cb);
        client.open('GET', url, true);
        if (options) {
            for (const k in options.headers) {
                client.setRequestHeader(k, options.headers[k]);
            }
            client.withCredentials = options.credentials === 'include';
            if (options['responseType']) {
                client.responseType = options['responseType'];
            }
        }
        client.send(null);
        return this;
    },

    /**
     * Fetch remote resource by HTTP "POST" method
     * @param  {Object}   options - post options
     * @param  {String}   options.url - url
     * @param  {Object}   options.headers - HTTP headers
     * @param  {String|Object} postData - data post to server
     * @param  {Function} cb  - callback function when completed
     * @return {Ajax}  Ajax
     * @example
     * maptalks.Ajax.post(
     *     {
     *         'url' : 'url/to/post'
     *     },
     *     {
     *         'param0' : 'val0',
     *         'param1' : 1
     *     },
     *     (err, data) => {
     *         if (err) {
     *             throw new Error(err);
     *         }
     *         // do things with data
     *     }
     * );
     */
    post: function (options, postData, cb) {
        if (IS_NODE && Ajax.post.node) {
            return Ajax.post.node(options, postData, cb);
        }
        const client = Ajax._getClient(cb);
        client.open('POST', options.url, true);
        if (!options.headers) {
            options.headers = {};
        }
        if (!options.headers['Content-Type']) {
            options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        if ('setRequestHeader' in client) {
            for (const p in options.headers) {
                if (options.headers.hasOwnProperty(p)) {
                    client.setRequestHeader(p, options.headers[p]);
                }
            }
        }
        if (!isString(postData)) {
            postData = JSON.stringify(postData);
        }
        client.send(postData);
        return this;
    },

    _wrapCallback: function (client, cb) {
        return function () {
            if (client.readyState === 4) {
                if (client.status === 200) {
                    if (client.responseType === 'arraybuffer') {
                        const response = client.response;
                        if (response.byteLength === 0) {
                            cb(new Error('http status 200 returned without content.'));
                        } else {
                            cb(null, {
                                data: client.response,
                                cacheControl: client.getResponseHeader('Cache-Control'),
                                expires: client.getResponseHeader('Expires')
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

    _getClient: function (cb) {
        /*eslint-disable no-empty, no-undef*/
        let client;
        try {
            client = new XMLHttpRequest();
        } catch (e) {
            try { client = new ActiveXObject('Msxml2.XMLHTTP'); } catch (e) {
                try { client = new ActiveXObject('Microsoft.XMLHTTP'); } catch (e) {}
            }
        }
        client.onreadystatechange = Ajax._wrapCallback(client, cb);
        return client;
        /*eslint-enable no-empty, no-undef*/
    },

    // from mapbox-gl-js
    getArrayBuffer(url, options, callback) {
        if (isFunction(options)) {
            callback = options;
            options = {};
        }
        if (!options) {
            options = {};
        }
        options['responseType'] = 'arraybuffer';
        return Ajax.get(url, options, callback);
    },

    // from mapbox-gl-js
    getImage(img, url, options) {
        return Ajax.getArrayBuffer(url, options, (err, imgData) => {
            if (err) {
                if (img.onerror) {
                    img.onerror(err);
                }
            } else if (imgData) {
                img.cacheControl = imgData.cacheControl;
                img.expires = imgData.expires;
                img.src = 'data:image/jpeg;base64,' + encode(new Uint8Array(imgData.data));
            }
        });
    }
};

function encode(input) {
    const keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    let chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    let i = 0;

    while (i < input.length) {
        chr1 = input[i++];
        chr2 = i < input.length ? input[i++] : Number.NaN; // Not sure if the index
        chr3 = i < input.length ? input[i++] : Number.NaN; // checks are needed here

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
            enc4 = 64;
        }
        output += keyStr.charAt(enc1) + keyStr.charAt(enc2) +
                  keyStr.charAt(enc3) + keyStr.charAt(enc4);
    }
    return output;
}

/**
 * Fetch resource as a JSON Object.
 * @param {String} url          - json's url
 * @param {Function} callback   - callback function when completed.
 * @example
 * maptalks.Ajax.getJSON(
 *     'url/to/resource.json',
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
Ajax.getJSON = function (url, cb) {
    const callback = function (err, resp) {
        const data = resp ? parseJSON(resp) : null;
        cb(err, data);
    };
    return Ajax.get(url, callback);
};

export default Ajax;
