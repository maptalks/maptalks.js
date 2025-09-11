const Ajax =  {
    getArrayBuffer(url, cb) {
        return Ajax.get(url, {
            responseType : 'arraybuffer'
        }, cb);
    },

    get: function (url, options, cb) {
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
        return client;
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
                                expires: client.getResponseHeader('Expires'),
                                contentType : client.getResponseHeader('Content-Type')
                            });
                        }
                    } else {
                        cb(null, client.responseText);
                    }
                } else {
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
};

export default Ajax;
