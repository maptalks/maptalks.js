var Ajax;
if (Z.node) {
    var urlParser = require('url'),
        http = require('http'),
        https = require('https');

    Ajax = {
        get: function (url, cb) {
            var parsed = urlParser.parse(url);
            this._getClient(parsed.protocol)
                .get(url, this._wrapCallback(cb))
                .on('error', cb);
            return this;
        },

        post: function (options, postData, cb) {
            var reqOpts = urlParser.parse(options.url);
            reqOpts.method = 'POST';
            if (options.headers) {
                reqOpts.headers = options.headers;
            }
            var req = this._getClient(reqOpts.protocol).request(reqOpts, this._wrapCallback(cb));

            req.on('error', cb);

            if (!Z.Util.isString(postData)) {
                postData = JSON.stringify(postData);
            }

            req.write(postData);
            req.end();
            return this;
        },

        _wrapCallback : function (cb) {
            return function (res) {
                var data = [],
                    isBuffer = false;
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    if (chunk instanceof Buffer) {
                        isBuffer = true;
                    }
                    data.push(chunk);
                });
                res.on('end', function () {
                    cb(null, isBuffer ? Buffer.concat(data).toString('utf8') : data.join(''));
                });
            };
        },

        _getClient: function (protocol) {
            if (!this._client) {
                this._client = (protocol && protocol === 'https:') ? https : http;
            }
            return this._client;
        }
    };
} else {
    Ajax = {
        get: function (url, cb) {
            var client = this._getClient(cb);
            client.open('GET', url, true);
            client.send(null);
            return this;
        },

        post: function (options, postData, cb) {
            var client = this._getClient(cb);
            client.open('POST', options.url, true);
            if (options.headers && client.setRequestHeader) {
                for (var p in options.headers) {
                    if (options.headers.hasOwnProperty(p)) {
                        client.setRequestHeader(p, options.headers[p]);
                    }
                }
            }
            if (!Z.Util.isString(postData)) {
                postData = JSON.stringify(postData);
            }
            client.send(postData);
            return this;
        },

        _wrapCallback: function (client, cb) {
            return function () {
                if (client.withCredentials !== undefined || this._isIE8()) {
                    cb(null, client.responseText);
                } else if (client.readyState === 4) {
                    if (client.status === 200) {
                        cb(client.responseText);
                    } else {
                        if (client.status === 0) {
                            return;
                        }
                        cb('{"success":false,"error":\"Status:' + client.status + ',' + client.statusText + '\"}');
                    }
                }
            };
        },

        _isIE8: function () {
            return Z.Browser.ie && document.documentMode === 8;
        },

        _getClient: function (cb) {
            /*eslint-disable no-empty, no-undef*/
            var client;
            if (this._isIE8()) {
                try {
                    client = new XDomainRequest();
                } catch (e) {}
            }
            try { client = new XMLHttpRequest(); } catch (e) {}
            try { client = new ActiveXObject('Msxml2.XMLHTTP'); } catch (e) {}
            try { client = new ActiveXObject('Microsoft.XMLHTTP'); } catch (e) {}

            if (this._isIE8() || client.withCredentials !== undefined) {
                //Cross Domain request in IE 8
                client.onload = this._wrapCallback(client, cb);
            } else {
                client.onreadystatechange = this._wrapCallback(client, cb);
            }

            return client;
            /*eslint-enable no-empty, no-undef*/
        }
    };
}

/**
 * Load a resource
 * @param {String} url          - resource url
 * @param {Function} callback   - callback function when completed.
 * @static
 */
Ajax.getResource = function (url, cb) {
    this.get(url, cb);
};

/**
 * Load a script and evaluates.
 * @param {String} url          - script's url
 * @param {Function} callback   - callback function when completed.
 * @static
 */
Ajax.getScript = function (url, cb) {
    var callback = function (responseText) {
        Z.Util.globalEval(responseText);
        if (cb) {
            cb();
        }
    };
    Ajax.getResource(url, callback);
};

Z.Ajax = Ajax;
