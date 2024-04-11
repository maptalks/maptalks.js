/*!
 * a compact version of mapbox-gl-style-spec
 * based on mapbox-gl-style-spec@13.28.0
 * https://github.com/mapbox/mapbox-gl-js/tree/main/src/style-spec
 * LICENSE : ISC
 */
var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var punycode$1 = {exports: {}};

/*! https://mths.be/punycode v1.3.2 by @mathias */

(function (module, exports) {
    (function (root) {
        /** Detect free variables */
        var freeExports = exports && !exports.nodeType && exports;
        var freeModule = module && !module.nodeType && module;
        var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal;
        if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal || freeGlobal.self === freeGlobal) {
            root = freeGlobal;
        }
        /**
         * The `punycode` object.
         * @name punycode
         * @type Object
         */
        var punycode,
            /** Highest positive signed 32-bit float value */
            maxInt = 2147483647,
            // aka. 0x7FFFFFFF or 2^31-1
            /** Bootstring parameters */
            base = 36, tMin = 1, tMax = 26, skew = 38, damp = 700, initialBias = 72, initialN = 128,
            // 0x80
            delimiter = '-',
            // '\x2D'
            /** Regular expressions */
            regexPunycode = /^xn--/, regexNonASCII = /[^\x20-\x7E]/,
            // unprintable ASCII chars + non-ASCII chars
            regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g,
            // RFC 3490 separators
            /** Error messages */
            errors = {
                'overflow': 'Overflow: input needs wider integers to process',
                'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
                'invalid-input': 'Invalid input'
            },
            /** Convenience shortcuts */
            baseMinusTMin = base - tMin, floor = Math.floor, stringFromCharCode = String.fromCharCode,
            /** Temporary variable */
            key;
        /*--------------------------------------------------------------------------*/
        /**
         * A generic error utility function.
         * @private
         * @param {String} type The error type.
         * @returns {Error} Throws a `RangeError` with the applicable error message.
         */
        function error(type) {
            throw RangeError(errors[type]);
        }
        /**
         * A generic `Array#map` utility function.
         * @private
         * @param {Array} array The array to iterate over.
         * @param {Function} callback The function that gets called for every array
         * item.
         * @returns {Array} A new array of values returned by the callback function.
         */
        function map(array, fn) {
            var length = array.length;
            var result = [];
            while (length--) {
                result[length] = fn(array[length]);
            }
            return result;
        }
        /**
         * A simple `Array#map`-like wrapper to work with domain name strings or email
         * addresses.
         * @private
         * @param {String} domain The domain name or email address.
         * @param {Function} callback The function that gets called for every
         * character.
         * @returns {Array} A new string of characters returned by the callback
         * function.
         */
        function mapDomain(string, fn) {
            var parts = string.split('@');
            var result = '';
            if (parts.length > 1) {
                // In email addresses, only the domain name should be punycoded. Leave
                // the local part (i.e. everything up to `@`) intact.
                result = parts[0] + '@';
                string = parts[1];
            }
            // Avoid `split(regex)` for IE8 compatibility. See #17.
            string = string.replace(regexSeparators, '.');
            var labels = string.split('.');
            var encoded = map(labels, fn).join('.');
            return result + encoded;
        }
        /**
         * Creates an array containing the numeric code points of each Unicode
         * character in the string. While JavaScript uses UCS-2 internally,
         * this function will convert a pair of surrogate halves (each of which
         * UCS-2 exposes as separate characters) into a single code point,
         * matching UTF-16.
         * @see `punycode.ucs2.encode`
         * @see <https://mathiasbynens.be/notes/javascript-encoding>
         * @memberOf punycode.ucs2
         * @name decode
         * @param {String} string The Unicode input string (UCS-2).
         * @returns {Array} The new array of code points.
         */
        function ucs2decode(string) {
            var output = [], counter = 0, length = string.length, value, extra;
            while (counter < length) {
                value = string.charCodeAt(counter++);
                if (value >= 55296 && value <= 56319 && counter < length) {
                    // high surrogate, and there is a next character
                    extra = string.charCodeAt(counter++);
                    if ((extra & 64512) == 56320) {
                        // low surrogate
                        output.push(((value & 1023) << 10) + (extra & 1023) + 65536);
                    } else {
                        // unmatched surrogate; only append this code unit, in case the next
                        // code unit is the high surrogate of a surrogate pair
                        output.push(value);
                        counter--;
                    }
                } else {
                    output.push(value);
                }
            }
            return output;
        }
        /**
         * Creates a string based on an array of numeric code points.
         * @see `punycode.ucs2.decode`
         * @memberOf punycode.ucs2
         * @name encode
         * @param {Array} codePoints The array of numeric code points.
         * @returns {String} The new Unicode string (UCS-2).
         */
        function ucs2encode(array) {
            return map(array, function (value) {
                var output = '';
                if (value > 65535) {
                    value -= 65536;
                    output += stringFromCharCode(value >>> 10 & 1023 | 55296);
                    value = 56320 | value & 1023;
                }
                output += stringFromCharCode(value);
                return output;
            }).join('');
        }
        /**
         * Converts a basic code point into a digit/integer.
         * @see `digitToBasic()`
         * @private
         * @param {Number} codePoint The basic numeric code point value.
         * @returns {Number} The numeric value of a basic code point (for use in
         * representing integers) in the range `0` to `base - 1`, or `base` if
         * the code point does not represent a value.
         */
        function basicToDigit(codePoint) {
            if (codePoint - 48 < 10) {
                return codePoint - 22;
            }
            if (codePoint - 65 < 26) {
                return codePoint - 65;
            }
            if (codePoint - 97 < 26) {
                return codePoint - 97;
            }
            return base;
        }
        /**
         * Converts a digit/integer into a basic code point.
         * @see `basicToDigit()`
         * @private
         * @param {Number} digit The numeric value of a basic code point.
         * @returns {Number} The basic code point whose value (when used for
         * representing integers) is `digit`, which needs to be in the range
         * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
         * used; else, the lowercase form is used. The behavior is undefined
         * if `flag` is non-zero and `digit` has no uppercase form.
         */
        function digitToBasic(digit, flag) {
            //  0..25 map to ASCII a..z or A..Z
            // 26..35 map to ASCII 0..9
            return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
        }
        /**
         * Bias adaptation function as per section 3.4 of RFC 3492.
         * http://tools.ietf.org/html/rfc3492#section-3.4
         * @private
         */
        function adapt(delta, numPoints, firstTime) {
            var k = 0;
            delta = firstTime ? floor(delta / damp) : delta >> 1;
            delta += floor(delta / numPoints);
            for (; delta > baseMinusTMin * tMax >> 1; k += base) {
                delta = floor(delta / baseMinusTMin);
            }
            return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
        }
        /**
         * Converts a Punycode string of ASCII-only symbols to a string of Unicode
         * symbols.
         * @memberOf punycode
         * @param {String} input The Punycode string of ASCII-only symbols.
         * @returns {String} The resulting string of Unicode symbols.
         */
        function decode(input) {
            // Don't use UCS-2
            var output = [], inputLength = input.length, out, i = 0, n = initialN, bias = initialBias, basic, j, index, oldi, w, k, digit, t,
                /** Cached calculation results */
                baseMinusT;
            // Handle the basic code points: let `basic` be the number of input code
            // points before the last delimiter, or `0` if there is none, then copy
            // the first basic code points to the output.
            basic = input.lastIndexOf(delimiter);
            if (basic < 0) {
                basic = 0;
            }
            for (j = 0; j < basic; ++j) {
                // if it's not a basic code point
                if (input.charCodeAt(j) >= 128) {
                    error('not-basic');
                }
                output.push(input.charCodeAt(j));
            }
            // Main decoding loop: start just after the last delimiter if any basic code
            // points were copied; start at the beginning otherwise.
            for (index = basic > 0 ? basic + 1 : 0; index < inputLength;) {
                // `index` is the index of the next character to be consumed.
                // Decode a generalized variable-length integer into `delta`,
                // which gets added to `i`. The overflow checking is easier
                // if we increase `i` as we go, then subtract off its starting
                // value at the end to obtain `delta`.
                for (oldi = i, w = 1, k = base;; k += base) {
                    if (index >= inputLength) {
                        error('invalid-input');
                    }
                    digit = basicToDigit(input.charCodeAt(index++));
                    if (digit >= base || digit > floor((maxInt - i) / w)) {
                        error('overflow');
                    }
                    i += digit * w;
                    t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
                    if (digit < t) {
                        break;
                    }
                    baseMinusT = base - t;
                    if (w > floor(maxInt / baseMinusT)) {
                        error('overflow');
                    }
                    w *= baseMinusT;
                }
                out = output.length + 1;
                bias = adapt(i - oldi, out, oldi == 0);
                // `i` was supposed to wrap around from `out` to `0`,
                // incrementing `n` each time, so we'll fix that now:
                if (floor(i / out) > maxInt - n) {
                    error('overflow');
                }
                n += floor(i / out);
                i %= out;
                // Insert `n` at position `i` of the output
                output.splice(i++, 0, n);
            }
            return ucs2encode(output);
        }
        /**
         * Converts a string of Unicode symbols (e.g. a domain name label) to a
         * Punycode string of ASCII-only symbols.
         * @memberOf punycode
         * @param {String} input The string of Unicode symbols.
         * @returns {String} The resulting Punycode string of ASCII-only symbols.
         */
        function encode(input) {
            var n, delta, handledCPCount, basicLength, bias, j, m, q, k, t, currentValue, output = [],
                /** `inputLength` will hold the number of code points in `input`. */
                inputLength,
                /** Cached calculation results */
                handledCPCountPlusOne, baseMinusT, qMinusT;
            // Convert the input in UCS-2 to Unicode
            input = ucs2decode(input);
            // Cache the length
            inputLength = input.length;
            // Initialize the state
            n = initialN;
            delta = 0;
            bias = initialBias;
            // Handle the basic code points
            for (j = 0; j < inputLength; ++j) {
                currentValue = input[j];
                if (currentValue < 128) {
                    output.push(stringFromCharCode(currentValue));
                }
            }
            handledCPCount = basicLength = output.length;
            // `handledCPCount` is the number of code points that have been handled;
            // `basicLength` is the number of basic code points.
            // Finish the basic string - if it is not empty - with a delimiter
            if (basicLength) {
                output.push(delimiter);
            }
            // Main encoding loop:
            while (handledCPCount < inputLength) {
                // All non-basic code points < n have been handled already. Find the next
                // larger one:
                for (m = maxInt, j = 0; j < inputLength; ++j) {
                    currentValue = input[j];
                    if (currentValue >= n && currentValue < m) {
                        m = currentValue;
                    }
                }
                // Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
                // but guard against overflow
                handledCPCountPlusOne = handledCPCount + 1;
                if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
                    error('overflow');
                }
                delta += (m - n) * handledCPCountPlusOne;
                n = m;
                for (j = 0; j < inputLength; ++j) {
                    currentValue = input[j];
                    if (currentValue < n && ++delta > maxInt) {
                        error('overflow');
                    }
                    if (currentValue == n) {
                        // Represent delta as a generalized variable-length integer
                        for (q = delta, k = base;; k += base) {
                            t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
                            if (q < t) {
                                break;
                            }
                            qMinusT = q - t;
                            baseMinusT = base - t;
                            output.push(stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0)));
                            q = floor(qMinusT / baseMinusT);
                        }
                        output.push(stringFromCharCode(digitToBasic(q, 0)));
                        bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
                        delta = 0;
                        ++handledCPCount;
                    }
                }
                ++delta;
                ++n;
            }
            return output.join('');
        }
        /**
         * Converts a Punycode string representing a domain name or an email address
         * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
         * it doesn't matter if you call it on a string that has already been
         * converted to Unicode.
         * @memberOf punycode
         * @param {String} input The Punycoded domain name or email address to
         * convert to Unicode.
         * @returns {String} The Unicode representation of the given Punycode
         * string.
         */
        function toUnicode(input) {
            return mapDomain(input, function (string) {
                return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
            });
        }
        /**
         * Converts a Unicode string representing a domain name or an email address to
         * Punycode. Only the non-ASCII parts of the domain name will be converted,
         * i.e. it doesn't matter if you call it with a domain that's already in
         * ASCII.
         * @memberOf punycode
         * @param {String} input The domain name or email address to convert, as a
         * Unicode string.
         * @returns {String} The Punycode representation of the given domain name or
         * email address.
         */
        function toASCII(input) {
            return mapDomain(input, function (string) {
                return regexNonASCII.test(string) ? 'xn--' + encode(string) : string;
            });
        }
        /*--------------------------------------------------------------------------*/
        /** Define the public API */
        punycode = {
            /**
             * A string representing the current Punycode.js version number.
             * @memberOf punycode
             * @type String
             */
            'version': '1.3.2',
            /**
             * An object of methods to convert from JavaScript's internal character
             * representation (UCS-2) to Unicode code points, and back.
             * @see <https://mathiasbynens.be/notes/javascript-encoding>
             * @memberOf punycode
             * @type Object
             */
            'ucs2': {
                'decode': ucs2decode,
                'encode': ucs2encode
            },
            'decode': decode,
            'encode': encode,
            'toASCII': toASCII,
            'toUnicode': toUnicode
        };
        /** Expose `punycode` */
        // Some AMD build optimizers, like r.js, check for specific condition patterns
        // like the following:
        if (freeExports && freeModule) {
            if (module.exports == freeExports) {
                // in Node.js or RingoJS v0.8.0+
                freeModule.exports = punycode;
            } else {
                // in Narwhal or RingoJS v0.7.0-
                for (key in punycode) {
                    punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
                }
            }
        } else {
            // in Rhino or a web browser
            root.punycode = punycode;
        }
    }(commonjsGlobal));
} (punycode$1, punycode$1.exports));

var util$1 = {
    isString: function (arg) {
        return typeof arg === 'string';
    },
    isObject: function (arg) {
        return typeof arg === 'object' && arg !== null;
    },
    isNull: function (arg) {
        return arg === null;
    },
    isNullOrUndefined: function (arg) {
        return arg == null;
    }
};

var querystring$1 = {};

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}
var decode = function (qs, sep, eq, options) {
    sep = sep || '&';
    eq = eq || '=';
    var obj = {};
    if (typeof qs !== 'string' || qs.length === 0) {
        return obj;
    }
    var regexp = /\+/g;
    qs = qs.split(sep);
    var maxKeys = 1000;
    if (options && typeof options.maxKeys === 'number') {
        maxKeys = options.maxKeys;
    }
    var len = qs.length;
    // maxKeys <= 0 means that we should not limit keys count
    if (maxKeys > 0 && len > maxKeys) {
        len = maxKeys;
    }
    for (var i = 0; i < len; ++i) {
        var x = qs[i].replace(regexp, '%20'), idx = x.indexOf(eq), kstr, vstr, k, v;
        if (idx >= 0) {
            kstr = x.substr(0, idx);
            vstr = x.substr(idx + 1);
        } else {
            kstr = x;
            vstr = '';
        }
        k = decodeURIComponent(kstr);
        v = decodeURIComponent(vstr);
        if (!hasOwnProperty(obj, k)) {
            obj[k] = v;
        } else if (Array.isArray(obj[k])) {
            obj[k].push(v);
        } else {
            obj[k] = [
                obj[k],
                v
            ];
        }
    }
    return obj;
};

var stringifyPrimitive = function (v) {
    switch (typeof v) {
    case 'string':
        return v;
    case 'boolean':
        return v ? 'true' : 'false';
    case 'number':
        return isFinite(v) ? v : '';
    default:
        return '';
    }
};
var encode = function (obj, sep, eq, name) {
    sep = sep || '&';
    eq = eq || '=';
    if (obj === null) {
        obj = undefined;
    }
    if (typeof obj === 'object') {
        return Object.keys(obj).map(function (k) {
            var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
            if (Array.isArray(obj[k])) {
                return obj[k].map(function (v) {
                    return ks + encodeURIComponent(stringifyPrimitive(v));
                }).join(sep);
            } else {
                return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
            }
        }).join(sep);
    }
    if (!name)
        return '';
    return encodeURIComponent(stringifyPrimitive(name)) + eq + encodeURIComponent(stringifyPrimitive(obj));
};

querystring$1.decode = querystring$1.parse = decode;
querystring$1.encode = querystring$1.stringify = encode;

var punycode = punycode$1.exports;
var util = util$1;
function Url() {
    this.protocol = null;
    this.slashes = null;
    this.auth = null;
    this.host = null;
    this.port = null;
    this.hostname = null;
    this.hash = null;
    this.search = null;
    this.query = null;
    this.pathname = null;
    this.path = null;
    this.href = null;
}
// Reference: RFC 3986, RFC 1808, RFC 2396
// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i, portPattern = /:[0-9]*$/,
    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,
    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = [
        '<',
        '>',
        '"',
        '`',
        ' ',
        '\r',
        '\n',
        '\t'
    ],
    // RFC 2396: characters not allowed for various reasons.
    unwise = [
        '{',
        '}',
        '|',
        '\\',
        '^',
        '`'
    ].concat(delims),
    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = [
        '%',
        '/',
        '?',
        ';',
        '#'
    ].concat(autoEscape), hostEndingChars = [
        '/',
        '?',
        '#'
    ], hostnameMaxLen = 255, hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/, hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
        'javascript': true,
        'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
        'javascript': true,
        'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
        'http': true,
        'https': true,
        'ftp': true,
        'gopher': true,
        'file': true,
        'http:': true,
        'https:': true,
        'ftp:': true,
        'gopher:': true,
        'file:': true
    }, querystring = querystring$1;
function urlParse(url, parseQueryString, slashesDenoteHost) {
    if (url && util.isObject(url) && url instanceof Url)
        return url;
    var u = new Url();
    u.parse(url, parseQueryString, slashesDenoteHost);
    return u;
}
Url.prototype.parse = function (url, parseQueryString, slashesDenoteHost) {
    if (!util.isString(url)) {
        throw new TypeError('Parameter \'url\' must be a string, not ' + typeof url);
    }
    // Copy chrome, IE, opera backslash-handling behavior.
    // Back slashes before the query string get converted to forward slashes
    // See: https://code.google.com/p/chromium/issues/detail?id=25916
    var queryIndex = url.indexOf('?'), splitter = queryIndex !== -1 && queryIndex < url.indexOf('#') ? '?' : '#', uSplit = url.split(splitter), slashRegex = /\\/g;
    uSplit[0] = uSplit[0].replace(slashRegex, '/');
    url = uSplit.join(splitter);
    var rest = url;
    // trim before proceeding.
    // This is to support parse stuff like "  http://foo.com  \n"
    rest = rest.trim();
    if (!slashesDenoteHost && url.split('#').length === 1) {
        // Try fast path regexp
        var simplePath = simplePathPattern.exec(rest);
        if (simplePath) {
            this.path = rest;
            this.href = rest;
            this.pathname = simplePath[1];
            if (simplePath[2]) {
                this.search = simplePath[2];
                if (parseQueryString) {
                    this.query = querystring.parse(this.search.substr(1));
                } else {
                    this.query = this.search.substr(1);
                }
            } else if (parseQueryString) {
                this.search = '';
                this.query = {};
            }
            return this;
        }
    }
    var proto = protocolPattern.exec(rest);
    if (proto) {
        proto = proto[0];
        var lowerProto = proto.toLowerCase();
        this.protocol = lowerProto;
        rest = rest.substr(proto.length);
    }
    // figure out if it's got a host
    // user@server is *always* interpreted as a hostname, and url
    // resolution will treat //foo/bar as host=foo,path=bar because that's
    // how the browser resolves relative URLs.
    if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
        var slashes = rest.substr(0, 2) === '//';
        if (slashes && !(proto && hostlessProtocol[proto])) {
            rest = rest.substr(2);
            this.slashes = true;
        }
    }
    if (!hostlessProtocol[proto] && (slashes || proto && !slashedProtocol[proto])) {
        // there's a hostname.
        // the first instance of /, ?, ;, or # ends the host.
        //
        // If there is an @ in the hostname, then non-host chars *are* allowed
        // to the left of the last @ sign, unless some host-ending character
        // comes *before* the @-sign.
        // URLs are obnoxious.
        //
        // ex:
        // http://a@b@c/ => user:a@b host:c
        // http://a@b?@c => user:a host:c path:/?@c
        // v0.12 TODO(isaacs): This is not quite how Chrome does things.
        // Review our test case against browsers more comprehensively.
        // find the first instance of any hostEndingChars
        var hostEnd = -1;
        for (var i = 0; i < hostEndingChars.length; i++) {
            var hec = rest.indexOf(hostEndingChars[i]);
            if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
                hostEnd = hec;
        }
        // at this point, either we have an explicit point where the
        // auth portion cannot go past, or the last @ char is the decider.
        var auth, atSign;
        if (hostEnd === -1) {
            // atSign can be anywhere.
            atSign = rest.lastIndexOf('@');
        } else {
            // atSign must be in auth portion.
            // http://a@b/c@d => host:b auth:a path:/c@d
            atSign = rest.lastIndexOf('@', hostEnd);
        }
        // Now we have a portion which is definitely the auth.
        // Pull that off.
        if (atSign !== -1) {
            auth = rest.slice(0, atSign);
            rest = rest.slice(atSign + 1);
            this.auth = decodeURIComponent(auth);
        }
        // the host is the remaining to the left of the first non-host char
        hostEnd = -1;
        for (var i = 0; i < nonHostChars.length; i++) {
            var hec = rest.indexOf(nonHostChars[i]);
            if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
                hostEnd = hec;
        }
        // if we still have not hit it, then the entire thing is a host.
        if (hostEnd === -1)
            hostEnd = rest.length;
        this.host = rest.slice(0, hostEnd);
        rest = rest.slice(hostEnd);
        // pull out port.
        this.parseHost();
        // we've indicated that there is a hostname,
        // so even if it's empty, it has to be present.
        this.hostname = this.hostname || '';
        // if hostname begins with [ and ends with ]
        // assume that it's an IPv6 address.
        var ipv6Hostname = this.hostname[0] === '[' && this.hostname[this.hostname.length - 1] === ']';
        // validate a little.
        if (!ipv6Hostname) {
            var hostparts = this.hostname.split(/\./);
            for (var i = 0, l = hostparts.length; i < l; i++) {
                var part = hostparts[i];
                if (!part)
                    continue;
                if (!part.match(hostnamePartPattern)) {
                    var newpart = '';
                    for (var j = 0, k = part.length; j < k; j++) {
                        if (part.charCodeAt(j) > 127) {
                            // we replace non-ASCII char with a temporary placeholder
                            // we need this to make sure size of hostname is not
                            // broken by replacing non-ASCII by nothing
                            newpart += 'x';
                        } else {
                            newpart += part[j];
                        }
                    }
                    // we test again with ASCII char only
                    if (!newpart.match(hostnamePartPattern)) {
                        var validParts = hostparts.slice(0, i);
                        var notHost = hostparts.slice(i + 1);
                        var bit = part.match(hostnamePartStart);
                        if (bit) {
                            validParts.push(bit[1]);
                            notHost.unshift(bit[2]);
                        }
                        if (notHost.length) {
                            rest = '/' + notHost.join('.') + rest;
                        }
                        this.hostname = validParts.join('.');
                        break;
                    }
                }
            }
        }
        if (this.hostname.length > hostnameMaxLen) {
            this.hostname = '';
        } else {
            // hostnames are always lower case.
            this.hostname = this.hostname.toLowerCase();
        }
        if (!ipv6Hostname) {
            // IDNA Support: Returns a punycoded representation of "domain".
            // It only converts parts of the domain name that
            // have non-ASCII characters, i.e. it doesn't matter if
            // you call it with a domain that already is ASCII-only.
            this.hostname = punycode.toASCII(this.hostname);
        }
        var p = this.port ? ':' + this.port : '';
        var h = this.hostname || '';
        this.host = h + p;
        this.href += this.host;
        // strip [ and ] from the hostname
        // the host field still retains them, though
        if (ipv6Hostname) {
            this.hostname = this.hostname.substr(1, this.hostname.length - 2);
            if (rest[0] !== '/') {
                rest = '/' + rest;
            }
        }
    }
    // now rest is set to the post-host stuff.
    // chop off any delim chars.
    if (!unsafeProtocol[lowerProto]) {
        // First, make 100% sure that any "autoEscape" chars get
        // escaped, even if encodeURIComponent doesn't think they
        // need to be.
        for (var i = 0, l = autoEscape.length; i < l; i++) {
            var ae = autoEscape[i];
            if (rest.indexOf(ae) === -1)
                continue;
            var esc = encodeURIComponent(ae);
            if (esc === ae) {
                esc = escape(ae);
            }
            rest = rest.split(ae).join(esc);
        }
    }
    // chop off from the tail first.
    var hash = rest.indexOf('#');
    if (hash !== -1) {
        // got a fragment string.
        this.hash = rest.substr(hash);
        rest = rest.slice(0, hash);
    }
    var qm = rest.indexOf('?');
    if (qm !== -1) {
        this.search = rest.substr(qm);
        this.query = rest.substr(qm + 1);
        if (parseQueryString) {
            this.query = querystring.parse(this.query);
        }
        rest = rest.slice(0, qm);
    } else if (parseQueryString) {
        // no query string, but parseQueryString still requested
        this.search = '';
        this.query = {};
    }
    if (rest)
        this.pathname = rest;
    if (slashedProtocol[lowerProto] && this.hostname && !this.pathname) {
        this.pathname = '/';
    }
    //to support http.request
    if (this.pathname || this.search) {
        var p = this.pathname || '';
        var s = this.search || '';
        this.path = p + s;
    }
    // finally, reconstruct the href based on what has been validated.
    this.href = this.format();
    return this;
};
Url.prototype.format = function () {
    var auth = this.auth || '';
    if (auth) {
        auth = encodeURIComponent(auth);
        auth = auth.replace(/%3A/i, ':');
        auth += '@';
    }
    var protocol = this.protocol || '', pathname = this.pathname || '', hash = this.hash || '', host = false, query = '';
    if (this.host) {
        host = auth + this.host;
    } else if (this.hostname) {
        host = auth + (this.hostname.indexOf(':') === -1 ? this.hostname : '[' + this.hostname + ']');
        if (this.port) {
            host += ':' + this.port;
        }
    }
    if (this.query && util.isObject(this.query) && Object.keys(this.query).length) {
        query = querystring.stringify(this.query);
    }
    var search = this.search || query && '?' + query || '';
    if (protocol && protocol.substr(-1) !== ':')
        protocol += ':';
    // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
    // unless they had them to begin with.
    if (this.slashes || (!protocol || slashedProtocol[protocol]) && host !== false) {
        host = '//' + (host || '');
        if (pathname && pathname.charAt(0) !== '/')
            pathname = '/' + pathname;
    } else if (!host) {
        host = '';
    }
    if (hash && hash.charAt(0) !== '#')
        hash = '#' + hash;
    if (search && search.charAt(0) !== '?')
        search = '?' + search;
    pathname = pathname.replace(/[?#]/g, function (match) {
        return encodeURIComponent(match);
    });
    search = search.replace('#', '%23');
    return protocol + host + pathname + search + hash;
};
Url.prototype.resolve = function (relative) {
    return this.resolveObject(urlParse(relative, false, true)).format();
};
Url.prototype.resolveObject = function (relative) {
    if (util.isString(relative)) {
        var rel = new Url();
        rel.parse(relative, false, true);
        relative = rel;
    }
    var result = new Url();
    var tkeys = Object.keys(this);
    for (var tk = 0; tk < tkeys.length; tk++) {
        var tkey = tkeys[tk];
        result[tkey] = this[tkey];
    }
    // hash is always overridden, no matter what.
    // even href="" will remove it.
    result.hash = relative.hash;
    // if the relative url is empty, then there's nothing left to do here.
    if (relative.href === '') {
        result.href = result.format();
        return result;
    }
    // hrefs like //foo/bar always cut to the protocol.
    if (relative.slashes && !relative.protocol) {
        // take everything except the protocol from relative
        var rkeys = Object.keys(relative);
        for (var rk = 0; rk < rkeys.length; rk++) {
            var rkey = rkeys[rk];
            if (rkey !== 'protocol')
                result[rkey] = relative[rkey];
        }
        //urlParse appends trailing / to urls like http://www.example.com
        if (slashedProtocol[result.protocol] && result.hostname && !result.pathname) {
            result.path = result.pathname = '/';
        }
        result.href = result.format();
        return result;
    }
    if (relative.protocol && relative.protocol !== result.protocol) {
        // if it's a known url protocol, then changing
        // the protocol does weird things
        // first, if it's not file:, then we MUST have a host,
        // and if there was a path
        // to begin with, then we MUST have a path.
        // if it is file:, then the host is dropped,
        // because that's known to be hostless.
        // anything else is assumed to be absolute.
        if (!slashedProtocol[relative.protocol]) {
            var keys = Object.keys(relative);
            for (var v = 0; v < keys.length; v++) {
                var k = keys[v];
                result[k] = relative[k];
            }
            result.href = result.format();
            return result;
        }
        result.protocol = relative.protocol;
        if (!relative.host && !hostlessProtocol[relative.protocol]) {
            var relPath = (relative.pathname || '').split('/');
            while (relPath.length && !(relative.host = relPath.shift()));
            if (!relative.host)
                relative.host = '';
            if (!relative.hostname)
                relative.hostname = '';
            if (relPath[0] !== '')
                relPath.unshift('');
            if (relPath.length < 2)
                relPath.unshift('');
            result.pathname = relPath.join('/');
        } else {
            result.pathname = relative.pathname;
        }
        result.search = relative.search;
        result.query = relative.query;
        result.host = relative.host || '';
        result.auth = relative.auth;
        result.hostname = relative.hostname || relative.host;
        result.port = relative.port;
        // to support http.request
        if (result.pathname || result.search) {
            var p = result.pathname || '';
            var s = result.search || '';
            result.path = p + s;
        }
        result.slashes = result.slashes || relative.slashes;
        result.href = result.format();
        return result;
    }
    var isSourceAbs = result.pathname && result.pathname.charAt(0) === '/', isRelAbs = relative.host || relative.pathname && relative.pathname.charAt(0) === '/', mustEndAbs = isRelAbs || isSourceAbs || result.host && relative.pathname, removeAllDots = mustEndAbs, srcPath = result.pathname && result.pathname.split('/') || [], relPath = relative.pathname && relative.pathname.split('/') || [], psychotic = result.protocol && !slashedProtocol[result.protocol];
    // if the url is a non-slashed url, then relative
    // links like ../.. should be able
    // to crawl up to the hostname, as well.  This is strange.
    // result.protocol has already been set by now.
    // Later on, put the first path part into the host field.
    if (psychotic) {
        result.hostname = '';
        result.port = null;
        if (result.host) {
            if (srcPath[0] === '')
                srcPath[0] = result.host;
            else
                srcPath.unshift(result.host);
        }
        result.host = '';
        if (relative.protocol) {
            relative.hostname = null;
            relative.port = null;
            if (relative.host) {
                if (relPath[0] === '')
                    relPath[0] = relative.host;
                else
                    relPath.unshift(relative.host);
            }
            relative.host = null;
        }
        mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
    }
    if (isRelAbs) {
        // it's absolute.
        result.host = relative.host || relative.host === '' ? relative.host : result.host;
        result.hostname = relative.hostname || relative.hostname === '' ? relative.hostname : result.hostname;
        result.search = relative.search;
        result.query = relative.query;
        srcPath = relPath;    // fall through to the dot-handling below.
    } else if (relPath.length) {
        // it's relative
        // throw away the existing file, and take the new path instead.
        if (!srcPath)
            srcPath = [];
        srcPath.pop();
        srcPath = srcPath.concat(relPath);
        result.search = relative.search;
        result.query = relative.query;
    } else if (!util.isNullOrUndefined(relative.search)) {
        // just pull out the search.
        // like href='?foo'.
        // Put this after the other two cases because it simplifies the booleans
        if (psychotic) {
            result.hostname = result.host = srcPath.shift();
            //occationaly the auth can get stuck only in host
            //this especially happens in cases like
            //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
            var authInHost = result.host && result.host.indexOf('@') > 0 ? result.host.split('@') : false;
            if (authInHost) {
                result.auth = authInHost.shift();
                result.host = result.hostname = authInHost.shift();
            }
        }
        result.search = relative.search;
        result.query = relative.query;
        //to support http.request
        if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
            result.path = (result.pathname ? result.pathname : '') + (result.search ? result.search : '');
        }
        result.href = result.format();
        return result;
    }
    if (!srcPath.length) {
        // no path at all.  easy.
        // we've already handled the other stuff above.
        result.pathname = null;
        //to support http.request
        if (result.search) {
            result.path = '/' + result.search;
        } else {
            result.path = null;
        }
        result.href = result.format();
        return result;
    }
    // if a url ENDs in . or .., then it must get a trailing slash.
    // however, if it ends in anything else non-slashy,
    // then it must NOT get a trailing slash.
    var last = srcPath.slice(-1)[0];
    var hasTrailingSlash = (result.host || relative.host || srcPath.length > 1) && (last === '.' || last === '..') || last === '';
    // strip single dots, resolve double dots to parent dir
    // if the path tries to go above the root, `up` ends up > 0
    var up = 0;
    for (var i = srcPath.length; i >= 0; i--) {
        last = srcPath[i];
        if (last === '.') {
            srcPath.splice(i, 1);
        } else if (last === '..') {
            srcPath.splice(i, 1);
            up++;
        } else if (up) {
            srcPath.splice(i, 1);
            up--;
        }
    }
    // if the path is allowed to go above the root, restore leading ..s
    if (!mustEndAbs && !removeAllDots) {
        for (; up--; up) {
            srcPath.unshift('..');
        }
    }
    if (mustEndAbs && srcPath[0] !== '' && (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
        srcPath.unshift('');
    }
    if (hasTrailingSlash && srcPath.join('/').substr(-1) !== '/') {
        srcPath.push('');
    }
    var isAbsolute = srcPath[0] === '' || srcPath[0] && srcPath[0].charAt(0) === '/';
    // put the host back
    if (psychotic) {
        result.hostname = result.host = isAbsolute ? '' : srcPath.length ? srcPath.shift() : '';
        //occationaly the auth can get stuck only in host
        //this especially happens in cases like
        //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
        var authInHost = result.host && result.host.indexOf('@') > 0 ? result.host.split('@') : false;
        if (authInHost) {
            result.auth = authInHost.shift();
            result.host = result.hostname = authInHost.shift();
        }
    }
    mustEndAbs = mustEndAbs || result.host && srcPath.length;
    if (mustEndAbs && !isAbsolute) {
        srcPath.unshift('');
    }
    if (!srcPath.length) {
        result.pathname = null;
        result.path = null;
    } else {
        result.pathname = srcPath.join('/');
    }
    //to support request.http
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
        result.path = (result.pathname ? result.pathname : '') + (result.search ? result.search : '');
    }
    result.auth = relative.auth || result.auth;
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
};
Url.prototype.parseHost = function () {
    var host = this.host;
    var port = portPattern.exec(host);
    if (port) {
        port = port[0];
        if (port !== ':') {
            this.port = port.substr(1);
        }
        host = host.substr(0, host.length - port.length);
    }
    if (host)
        this.hostname = host;
};

//
function extend (output, ...inputs) {
    for (const input of inputs) {
        for (const k in input) {
            output[k] = input[k];
        }
    }
    return output;
}

//
class ParsingError$1 extends Error {
    constructor(key, message) {
        super(message);
        this.message = message;
        this.key = key;
    }
}
var ParsingError$2 = ParsingError$1;

//
/**
 * Tracks `let` bindings during expression parsing.
 * @private
 */
class Scope {
    constructor(parent, bindings = []) {
        this.parent = parent;
        this.bindings = {};
        for (const [name, expression] of bindings) {
            this.bindings[name] = expression;
        }
    }
    concat(bindings) {
        return new Scope(this, bindings);
    }
    get(name) {
        if (this.bindings[name]) {
            return this.bindings[name];
        }
        if (this.parent) {
            return this.parent.get(name);
        }
        throw new Error(`${ name } not found in scope.`);
    }
    has(name) {
        if (this.bindings[name])
            return true;
        return this.parent ? this.parent.has(name) : false;
    }
}
var Scope$1 = Scope;

//
const NullType = { kind: 'null' };
const NumberType = { kind: 'number' };
const StringType = { kind: 'string' };
const BooleanType = { kind: 'boolean' };
const ColorType = { kind: 'color' };
const ObjectType = { kind: 'object' };
const ValueType = { kind: 'value' };
const ErrorType = { kind: 'error' };
const CollatorType = { kind: 'collator' };
const FormattedType = { kind: 'formatted' };
const ResolvedImageType = { kind: 'resolvedImage' };
function array$1(itemType, N) {
    return {
        kind: 'array',
        itemType,
        N
    };
}
function toString$1(type) {
    if (type.kind === 'array') {
        const itemType = toString$1(type.itemType);
        return typeof type.N === 'number' ? `array<${ itemType }, ${ type.N }>` : type.itemType.kind === 'value' ? 'array' : `array<${ itemType }>`;
    } else {
        return type.kind;
    }
}
const valueMemberTypes = [
    NullType,
    NumberType,
    StringType,
    BooleanType,
    ColorType,
    FormattedType,
    ObjectType,
    array$1(ValueType),
    ResolvedImageType
];
/**
 * Returns null if `t` is a subtype of `expected`; otherwise returns an
 * error message.
 * @private
 */
function checkSubtype(expected, t) {
    if (t.kind === 'error') {
        // Error is a subtype of every type
        return null;
    } else if (expected.kind === 'array') {
        if (t.kind === 'array' && (t.N === 0 && t.itemType.kind === 'value' || !checkSubtype(expected.itemType, t.itemType)) && (typeof expected.N !== 'number' || expected.N === t.N)) {
            return null;
        }
    } else if (expected.kind === t.kind) {
        return null;
    } else if (expected.kind === 'value') {
        for (const memberType of valueMemberTypes) {
            if (!checkSubtype(memberType, t)) {
                return null;
            }
        }
    }
    return `Expected ${ toString$1(expected) } but found ${ toString$1(t) } instead.`;
}
function isValidType(provided, allowedTypes) {
    return allowedTypes.some(t => t.kind === provided.kind);
}
function isValidNativeType(provided, allowedTypes) {
    return allowedTypes.some(t => {
        if (t === 'null') {
            return provided === null;
        } else if (t === 'array') {
            return Array.isArray(provided);
        } else if (t === 'object') {
            return provided && !Array.isArray(provided) && typeof provided === 'object';
        } else {
            return t === typeof provided;
        }
    });
}

var csscolorparser = {};

var parseCSSColor_1;
// (c) Dean McNamee <dean@gmail.com>, 2012.
//
// https://github.com/deanm/css-color-parser-js
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.
// http://www.w3.org/TR/css3-color/
var kCSSColorTable = {
    'transparent': [
        0,
        0,
        0,
        0
    ],
    'aliceblue': [
        240,
        248,
        255,
        1
    ],
    'antiquewhite': [
        250,
        235,
        215,
        1
    ],
    'aqua': [
        0,
        255,
        255,
        1
    ],
    'aquamarine': [
        127,
        255,
        212,
        1
    ],
    'azure': [
        240,
        255,
        255,
        1
    ],
    'beige': [
        245,
        245,
        220,
        1
    ],
    'bisque': [
        255,
        228,
        196,
        1
    ],
    'black': [
        0,
        0,
        0,
        1
    ],
    'blanchedalmond': [
        255,
        235,
        205,
        1
    ],
    'blue': [
        0,
        0,
        255,
        1
    ],
    'blueviolet': [
        138,
        43,
        226,
        1
    ],
    'brown': [
        165,
        42,
        42,
        1
    ],
    'burlywood': [
        222,
        184,
        135,
        1
    ],
    'cadetblue': [
        95,
        158,
        160,
        1
    ],
    'chartreuse': [
        127,
        255,
        0,
        1
    ],
    'chocolate': [
        210,
        105,
        30,
        1
    ],
    'coral': [
        255,
        127,
        80,
        1
    ],
    'cornflowerblue': [
        100,
        149,
        237,
        1
    ],
    'cornsilk': [
        255,
        248,
        220,
        1
    ],
    'crimson': [
        220,
        20,
        60,
        1
    ],
    'cyan': [
        0,
        255,
        255,
        1
    ],
    'darkblue': [
        0,
        0,
        139,
        1
    ],
    'darkcyan': [
        0,
        139,
        139,
        1
    ],
    'darkgoldenrod': [
        184,
        134,
        11,
        1
    ],
    'darkgray': [
        169,
        169,
        169,
        1
    ],
    'darkgreen': [
        0,
        100,
        0,
        1
    ],
    'darkgrey': [
        169,
        169,
        169,
        1
    ],
    'darkkhaki': [
        189,
        183,
        107,
        1
    ],
    'darkmagenta': [
        139,
        0,
        139,
        1
    ],
    'darkolivegreen': [
        85,
        107,
        47,
        1
    ],
    'darkorange': [
        255,
        140,
        0,
        1
    ],
    'darkorchid': [
        153,
        50,
        204,
        1
    ],
    'darkred': [
        139,
        0,
        0,
        1
    ],
    'darksalmon': [
        233,
        150,
        122,
        1
    ],
    'darkseagreen': [
        143,
        188,
        143,
        1
    ],
    'darkslateblue': [
        72,
        61,
        139,
        1
    ],
    'darkslategray': [
        47,
        79,
        79,
        1
    ],
    'darkslategrey': [
        47,
        79,
        79,
        1
    ],
    'darkturquoise': [
        0,
        206,
        209,
        1
    ],
    'darkviolet': [
        148,
        0,
        211,
        1
    ],
    'deeppink': [
        255,
        20,
        147,
        1
    ],
    'deepskyblue': [
        0,
        191,
        255,
        1
    ],
    'dimgray': [
        105,
        105,
        105,
        1
    ],
    'dimgrey': [
        105,
        105,
        105,
        1
    ],
    'dodgerblue': [
        30,
        144,
        255,
        1
    ],
    'firebrick': [
        178,
        34,
        34,
        1
    ],
    'floralwhite': [
        255,
        250,
        240,
        1
    ],
    'forestgreen': [
        34,
        139,
        34,
        1
    ],
    'fuchsia': [
        255,
        0,
        255,
        1
    ],
    'gainsboro': [
        220,
        220,
        220,
        1
    ],
    'ghostwhite': [
        248,
        248,
        255,
        1
    ],
    'gold': [
        255,
        215,
        0,
        1
    ],
    'goldenrod': [
        218,
        165,
        32,
        1
    ],
    'gray': [
        128,
        128,
        128,
        1
    ],
    'green': [
        0,
        128,
        0,
        1
    ],
    'greenyellow': [
        173,
        255,
        47,
        1
    ],
    'grey': [
        128,
        128,
        128,
        1
    ],
    'honeydew': [
        240,
        255,
        240,
        1
    ],
    'hotpink': [
        255,
        105,
        180,
        1
    ],
    'indianred': [
        205,
        92,
        92,
        1
    ],
    'indigo': [
        75,
        0,
        130,
        1
    ],
    'ivory': [
        255,
        255,
        240,
        1
    ],
    'khaki': [
        240,
        230,
        140,
        1
    ],
    'lavender': [
        230,
        230,
        250,
        1
    ],
    'lavenderblush': [
        255,
        240,
        245,
        1
    ],
    'lawngreen': [
        124,
        252,
        0,
        1
    ],
    'lemonchiffon': [
        255,
        250,
        205,
        1
    ],
    'lightblue': [
        173,
        216,
        230,
        1
    ],
    'lightcoral': [
        240,
        128,
        128,
        1
    ],
    'lightcyan': [
        224,
        255,
        255,
        1
    ],
    'lightgoldenrodyellow': [
        250,
        250,
        210,
        1
    ],
    'lightgray': [
        211,
        211,
        211,
        1
    ],
    'lightgreen': [
        144,
        238,
        144,
        1
    ],
    'lightgrey': [
        211,
        211,
        211,
        1
    ],
    'lightpink': [
        255,
        182,
        193,
        1
    ],
    'lightsalmon': [
        255,
        160,
        122,
        1
    ],
    'lightseagreen': [
        32,
        178,
        170,
        1
    ],
    'lightskyblue': [
        135,
        206,
        250,
        1
    ],
    'lightslategray': [
        119,
        136,
        153,
        1
    ],
    'lightslategrey': [
        119,
        136,
        153,
        1
    ],
    'lightsteelblue': [
        176,
        196,
        222,
        1
    ],
    'lightyellow': [
        255,
        255,
        224,
        1
    ],
    'lime': [
        0,
        255,
        0,
        1
    ],
    'limegreen': [
        50,
        205,
        50,
        1
    ],
    'linen': [
        250,
        240,
        230,
        1
    ],
    'magenta': [
        255,
        0,
        255,
        1
    ],
    'maroon': [
        128,
        0,
        0,
        1
    ],
    'mediumaquamarine': [
        102,
        205,
        170,
        1
    ],
    'mediumblue': [
        0,
        0,
        205,
        1
    ],
    'mediumorchid': [
        186,
        85,
        211,
        1
    ],
    'mediumpurple': [
        147,
        112,
        219,
        1
    ],
    'mediumseagreen': [
        60,
        179,
        113,
        1
    ],
    'mediumslateblue': [
        123,
        104,
        238,
        1
    ],
    'mediumspringgreen': [
        0,
        250,
        154,
        1
    ],
    'mediumturquoise': [
        72,
        209,
        204,
        1
    ],
    'mediumvioletred': [
        199,
        21,
        133,
        1
    ],
    'midnightblue': [
        25,
        25,
        112,
        1
    ],
    'mintcream': [
        245,
        255,
        250,
        1
    ],
    'mistyrose': [
        255,
        228,
        225,
        1
    ],
    'moccasin': [
        255,
        228,
        181,
        1
    ],
    'navajowhite': [
        255,
        222,
        173,
        1
    ],
    'navy': [
        0,
        0,
        128,
        1
    ],
    'oldlace': [
        253,
        245,
        230,
        1
    ],
    'olive': [
        128,
        128,
        0,
        1
    ],
    'olivedrab': [
        107,
        142,
        35,
        1
    ],
    'orange': [
        255,
        165,
        0,
        1
    ],
    'orangered': [
        255,
        69,
        0,
        1
    ],
    'orchid': [
        218,
        112,
        214,
        1
    ],
    'palegoldenrod': [
        238,
        232,
        170,
        1
    ],
    'palegreen': [
        152,
        251,
        152,
        1
    ],
    'paleturquoise': [
        175,
        238,
        238,
        1
    ],
    'palevioletred': [
        219,
        112,
        147,
        1
    ],
    'papayawhip': [
        255,
        239,
        213,
        1
    ],
    'peachpuff': [
        255,
        218,
        185,
        1
    ],
    'peru': [
        205,
        133,
        63,
        1
    ],
    'pink': [
        255,
        192,
        203,
        1
    ],
    'plum': [
        221,
        160,
        221,
        1
    ],
    'powderblue': [
        176,
        224,
        230,
        1
    ],
    'purple': [
        128,
        0,
        128,
        1
    ],
    'rebeccapurple': [
        102,
        51,
        153,
        1
    ],
    'red': [
        255,
        0,
        0,
        1
    ],
    'rosybrown': [
        188,
        143,
        143,
        1
    ],
    'royalblue': [
        65,
        105,
        225,
        1
    ],
    'saddlebrown': [
        139,
        69,
        19,
        1
    ],
    'salmon': [
        250,
        128,
        114,
        1
    ],
    'sandybrown': [
        244,
        164,
        96,
        1
    ],
    'seagreen': [
        46,
        139,
        87,
        1
    ],
    'seashell': [
        255,
        245,
        238,
        1
    ],
    'sienna': [
        160,
        82,
        45,
        1
    ],
    'silver': [
        192,
        192,
        192,
        1
    ],
    'skyblue': [
        135,
        206,
        235,
        1
    ],
    'slateblue': [
        106,
        90,
        205,
        1
    ],
    'slategray': [
        112,
        128,
        144,
        1
    ],
    'slategrey': [
        112,
        128,
        144,
        1
    ],
    'snow': [
        255,
        250,
        250,
        1
    ],
    'springgreen': [
        0,
        255,
        127,
        1
    ],
    'steelblue': [
        70,
        130,
        180,
        1
    ],
    'tan': [
        210,
        180,
        140,
        1
    ],
    'teal': [
        0,
        128,
        128,
        1
    ],
    'thistle': [
        216,
        191,
        216,
        1
    ],
    'tomato': [
        255,
        99,
        71,
        1
    ],
    'turquoise': [
        64,
        224,
        208,
        1
    ],
    'violet': [
        238,
        130,
        238,
        1
    ],
    'wheat': [
        245,
        222,
        179,
        1
    ],
    'white': [
        255,
        255,
        255,
        1
    ],
    'whitesmoke': [
        245,
        245,
        245,
        1
    ],
    'yellow': [
        255,
        255,
        0,
        1
    ],
    'yellowgreen': [
        154,
        205,
        50,
        1
    ]
};
function clamp_css_byte(i) {
    // Clamp to integer 0 .. 255.
    i = Math.round(i);
    // Seems to be what Chrome does (vs truncation).
    return i < 0 ? 0 : i > 255 ? 255 : i;
}
function clamp_css_float(f) {
    // Clamp to float 0.0 .. 1.0.
    return f < 0 ? 0 : f > 1 ? 1 : f;
}
function parse_css_int(str) {
    // int or percentage.
    if (str[str.length - 1] === '%')
        return clamp_css_byte(parseFloat(str) / 100 * 255);
    return clamp_css_byte(parseInt(str));
}
function parse_css_float(str) {
    // float or percentage.
    if (str[str.length - 1] === '%')
        return clamp_css_float(parseFloat(str) / 100);
    return clamp_css_float(parseFloat(str));
}
function css_hue_to_rgb(m1, m2, h) {
    if (h < 0)
        h += 1;
    else if (h > 1)
        h -= 1;
    if (h * 6 < 1)
        return m1 + (m2 - m1) * h * 6;
    if (h * 2 < 1)
        return m2;
    if (h * 3 < 2)
        return m1 + (m2 - m1) * (2 / 3 - h) * 6;
    return m1;
}
function parseCSSColor(css_str) {
    // Remove all whitespace, not compliant, but should just be more accepting.
    var str = css_str.replace(/ /g, '').toLowerCase();
    // Color keywords (and transparent) lookup.
    if (str in kCSSColorTable)
        return kCSSColorTable[str].slice();
    // dup.
    // #abc and #abc123 syntax.
    if (str[0] === '#') {
        if (str.length === 4) {
            var iv = parseInt(str.substr(1), 16);
            // TODO(deanm): Stricter parsing.
            if (!(iv >= 0 && iv <= 4095))
                return null;
            // Covers NaN.
            return [
                (iv & 3840) >> 4 | (iv & 3840) >> 8,
                iv & 240 | (iv & 240) >> 4,
                iv & 15 | (iv & 15) << 4,
                1
            ];
        } else if (str.length === 7) {
            var iv = parseInt(str.substr(1), 16);
            // TODO(deanm): Stricter parsing.
            if (!(iv >= 0 && iv <= 16777215))
                return null;
            // Covers NaN.
            return [
                (iv & 16711680) >> 16,
                (iv & 65280) >> 8,
                iv & 255,
                1
            ];
        }
        return null;
    }
    var op = str.indexOf('('), ep = str.indexOf(')');
    if (op !== -1 && ep + 1 === str.length) {
        var fname = str.substr(0, op);
        var params = str.substr(op + 1, ep - (op + 1)).split(',');
        var alpha = 1;
        // To allow case fallthrough.
        switch (fname) {
        case 'rgba':
            if (params.length !== 4)
                return null;
            alpha = parse_css_float(params.pop());
        // Fall through.
        case 'rgb':
            if (params.length !== 3)
                return null;
            return [
                parse_css_int(params[0]),
                parse_css_int(params[1]),
                parse_css_int(params[2]),
                alpha
            ];
        case 'hsla':
            if (params.length !== 4)
                return null;
            alpha = parse_css_float(params.pop());
        // Fall through.
        case 'hsl':
            if (params.length !== 3)
                return null;
            var h = (parseFloat(params[0]) % 360 + 360) % 360 / 360;
            // 0 .. 1
            // NOTE(deanm): According to the CSS spec s/l should only be
            // percentages, but we don't bother and let float or percentage.
            var s = parse_css_float(params[1]);
            var l = parse_css_float(params[2]);
            var m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s;
            var m1 = l * 2 - m2;
            return [
                clamp_css_byte(css_hue_to_rgb(m1, m2, h + 1 / 3) * 255),
                clamp_css_byte(css_hue_to_rgb(m1, m2, h) * 255),
                clamp_css_byte(css_hue_to_rgb(m1, m2, h - 1 / 3) * 255),
                alpha
            ];
        default:
            return null;
        }
    }
    return null;
}
try {
    parseCSSColor_1 = csscolorparser.parseCSSColor = parseCSSColor;
} catch (e) {
}

//
/**
 * An RGBA color value. Create instances from color strings using the static
 * method `Color.parse`. The constructor accepts RGB channel values in the range
 * `[0, 1]`, premultiplied by A.
 *
 * @param {number} r The red channel.
 * @param {number} g The green channel.
 * @param {number} b The blue channel.
 * @param {number} a The alpha channel.
 * @private
 */
class Color {
    constructor(r, g, b, a = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    /**
     * Parses valid CSS color strings and returns a `Color` instance.
     * @returns A `Color` instance, or `undefined` if the input is not a valid color string.
     */
    static parse(input) {
        if (!input) {
            return undefined;
        }
        if (input instanceof Color) {
            return input;
        }
        if (typeof input !== 'string') {
            return undefined;
        }
        const rgba = parseCSSColor_1(input);
        if (!rgba) {
            return undefined;
        }
        return new Color(rgba[0] / 255 * rgba[3], rgba[1] / 255 * rgba[3], rgba[2] / 255 * rgba[3], rgba[3]);
    }
    /**
     * Returns an RGBA string representing the color value.
     *
     * @returns An RGBA string.
     * @example
     * var purple = new Color.parse('purple');
     * purple.toString; // = "rgba(128,0,128,1)"
     * var translucentGreen = new Color.parse('rgba(26, 207, 26, .73)');
     * translucentGreen.toString(); // = "rgba(26,207,26,0.73)"
     */
    toString() {
        const [r, g, b, a] = this.toArray();
        return `rgba(${ Math.round(r) },${ Math.round(g) },${ Math.round(b) },${ a })`;
    }
    /**
     * Returns an RGBA array of values representing the color, unpremultiplied by A.
     *
     * @returns An array of RGBA color values in the range [0, 255].
     */
    toArray() {
        const {r, g, b, a} = this;
        return a === 0 ? [
            0,
            0,
            0,
            0
        ] : [
            r * 255 / a,
            g * 255 / a,
            b * 255 / a,
            a
        ];
    }
    /**
     * Returns a RGBA array of float values representing the color, unpremultiplied by A.
     *
     * @returns An array of RGBA color values in the range [0, 1].
     */
    toArray01() {
        const {r, g, b, a} = this;
        return a === 0 ? [
            0,
            0,
            0,
            0
        ] : [
            r / a,
            g / a,
            b / a,
            a
        ];
    }
    /**
     * Returns an RGBA array of values representing the color, premultiplied by A.
     *
     * @returns An array of RGBA color values in the range [0, 1].
     */
    toArray01PremultipliedAlpha() {
        const {r, g, b, a} = this;
        return [
            r,
            g,
            b,
            a
        ];
    }
}
Color.black = new Color(0, 0, 0, 1);
Color.white = new Color(1, 1, 1, 1);
Color.transparent = new Color(0, 0, 0, 0);
Color.red = new Color(1, 0, 0, 1);
Color.blue = new Color(0, 0, 1, 1);
var Color$1 = Color;

//
// Flow type declarations for Intl cribbed from
// https://github.com/facebook/flow/issues/1270
class Collator {
    constructor(caseSensitive, diacriticSensitive, locale) {
        if (caseSensitive)
            this.sensitivity = diacriticSensitive ? 'variant' : 'case';
        else
            this.sensitivity = diacriticSensitive ? 'accent' : 'base';
        this.locale = locale;
        this.collator = new Intl.Collator(this.locale ? this.locale : [], {
            sensitivity: this.sensitivity,
            usage: 'search'
        });
    }
    compare(lhs, rhs) {
        return this.collator.compare(lhs, rhs);
    }
    resolvedLocale() {
        // We create a Collator without "usage: search" because we don't want
        // the search options encoded in our result (e.g. "en-u-co-search")
        return new Intl.Collator(this.locale ? this.locale : []).resolvedOptions().locale;
    }
}

//
class FormattedSection {
    constructor(text, image, scale, fontStack, textColor) {
        // combine characters so that diacritic marks are not separate code points
        this.text = text.normalize ? text.normalize() : text;
        this.image = image;
        this.scale = scale;
        this.fontStack = fontStack;
        this.textColor = textColor;
    }
}
class Formatted {
    constructor(sections) {
        this.sections = sections;
    }
    static fromString(unformatted) {
        return new Formatted([new FormattedSection(unformatted, null, null, null, null)]);
    }
    isEmpty() {
        if (this.sections.length === 0)
            return true;
        return !this.sections.some(section => section.text.length !== 0 || section.image && section.image.name.length !== 0);
    }
    static factory(text) {
        if (text instanceof Formatted) {
            return text;
        } else {
            return Formatted.fromString(text);
        }
    }
    toString() {
        if (this.sections.length === 0)
            return '';
        return this.sections.map(section => section.text).join('');
    }
    serialize() {
        const serialized = ['format'];
        for (const section of this.sections) {
            if (section.image) {
                serialized.push([
                    'image',
                    section.image.name
                ]);
                continue;
            }
            serialized.push(section.text);
            const options = {};
            if (section.fontStack) {
                options['text-font'] = [
                    'literal',
                    section.fontStack.split(',')
                ];
            }
            if (section.scale) {
                options['font-scale'] = section.scale;
            }
            if (section.textColor) {
                options['text-color'] = ['rgba'].concat(section.textColor.toArray());
            }
            serialized.push(options);
        }
        return serialized;
    }
}

//
class ResolvedImage {
    constructor(options) {
        this.name = options.name;
        this.available = options.available;
    }
    toString() {
        return this.name;
    }
    static fromString(name) {
        if (!name)
            return null;
        // treat empty values as no image
        return new ResolvedImage({
            name,
            available: false
        });
    }
    serialize() {
        return [
            'image',
            this.name
        ];
    }
}

function validateRGBA(r, g, b, a) {
    if (!(typeof r === 'number' && r >= 0 && r <= 255 && typeof g === 'number' && g >= 0 && g <= 255 && typeof b === 'number' && b >= 0 && b <= 255)) {
        const value = typeof a === 'number' ? [
            r,
            g,
            b,
            a
        ] : [
            r,
            g,
            b
        ];
        return `Invalid rgba value [${ value.join(', ') }]: 'r', 'g', and 'b' must be between 0 and 255.`;
    }
    if (!(typeof a === 'undefined' || typeof a === 'number' && a >= 0 && a <= 1)) {
        return `Invalid rgba value [${ [
            r,
            g,
            b,
            a
        ].join(', ') }]: 'a' must be between 0 and 1.`;
    }
    return null;
}
function isValue(mixed) {
    if (mixed === null) {
        return true;
    } else if (typeof mixed === 'string') {
        return true;
    } else if (typeof mixed === 'boolean') {
        return true;
    } else if (typeof mixed === 'number') {
        return true;
    } else if (mixed instanceof Color$1) {
        return true;
    } else if (mixed instanceof Collator) {
        return true;
    } else if (mixed instanceof Formatted) {
        return true;
    } else if (mixed instanceof ResolvedImage) {
        return true;
    } else if (Array.isArray(mixed)) {
        for (const item of mixed) {
            if (!isValue(item)) {
                return false;
            }
        }
        return true;
    } else if (typeof mixed === 'object') {
        for (const key in mixed) {
            if (!isValue(mixed[key])) {
                return false;
            }
        }
        return true;
    } else {
        return false;
    }
}
function typeOf(value) {
    if (value === null) {
        return NullType;
    } else if (typeof value === 'string') {
        return StringType;
    } else if (typeof value === 'boolean') {
        return BooleanType;
    } else if (typeof value === 'number') {
        return NumberType;
    } else if (value instanceof Color$1) {
        return ColorType;
    } else if (value instanceof Collator) {
        return CollatorType;
    } else if (value instanceof Formatted) {
        return FormattedType;
    } else if (value instanceof ResolvedImage) {
        return ResolvedImageType;
    } else if (Array.isArray(value)) {
        const length = value.length;
        let itemType;
        for (const item of value) {
            const t = typeOf(item);
            if (!itemType) {
                itemType = t;
            } else if (itemType === t) {
                continue;
            } else {
                itemType = ValueType;
                break;
            }
        }
        return array$1(itemType || ValueType, length);
    } else {
        return ObjectType;
    }
}
function toString(value) {
    const type = typeof value;
    if (value === null) {
        return '';
    } else if (type === 'string' || type === 'number' || type === 'boolean') {
        return String(value);
    } else if (value instanceof Color$1 || value instanceof Formatted || value instanceof ResolvedImage) {
        return value.toString();
    } else {
        return JSON.stringify(value);
    }
}

class Literal {
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }
    static parse(args, context) {
        if (args.length !== 2)
            return context.error(`'literal' expression requires exactly one argument, but found ${ args.length - 1 } instead.`);
        if (!isValue(args[1]))
            return context.error(`invalid value`);
        const value = args[1];
        let type = typeOf(value);
        // special case: infer the item type if possible for zero-length arrays
        const expected = context.expectedType;
        if (type.kind === 'array' && type.N === 0 && expected && expected.kind === 'array' && (typeof expected.N !== 'number' || expected.N === 0)) {
            type = expected;
        }
        return new Literal(type, value);
    }
    evaluate() {
        return this.value;
    }
    eachChild() {
    }
    outputDefined() {
        return true;
    }
    serialize() {
        if (this.type.kind === 'array' || this.type.kind === 'object') {
            return [
                'literal',
                this.value
            ];
        } else if (this.value instanceof Color$1) {
            // Constant-folding can generate Literal expressions that you
            // couldn't actually generate with a "literal" expression,
            // so we have to implement an equivalent serialization here
            return ['rgba'].concat(this.value.toArray());
        } else if (this.value instanceof Formatted) {
            // Same as Color
            return this.value.serialize();
        } else {
            return this.value;
        }
    }
}
var Literal$1 = Literal;

//
class RuntimeError {
    constructor(message) {
        this.name = 'ExpressionEvaluationError';
        this.message = message;
    }
    toJSON() {
        return this.message;
    }
}
var RuntimeError$1 = RuntimeError;

const types$1 = {
    string: StringType,
    number: NumberType,
    boolean: BooleanType,
    object: ObjectType
};
class Assertion {
    constructor(type, args) {
        this.type = type;
        this.args = args;
    }
    static parse(args, context) {
        if (args.length < 2)
            return context.error(`Expected at least one argument.`);
        let i = 1;
        let type;
        const name = args[0];
        if (name === 'array') {
            let itemType;
            if (args.length > 2) {
                const type = args[1];
                if (typeof type !== 'string' || !(type in types$1) || type === 'object')
                    return context.error('The item type argument of "array" must be one of string, number, boolean', 1);
                itemType = types$1[type];
                i++;
            } else {
                itemType = ValueType;
            }
            let N;
            if (args.length > 3) {
                if (args[2] !== null && (typeof args[2] !== 'number' || args[2] < 0 || args[2] !== Math.floor(args[2]))) {
                    return context.error('The length argument to "array" must be a positive integer literal', 2);
                }
                N = args[2];
                i++;
            }
            type = array$1(itemType, N);
        } else {
            type = types$1[name];
        }
        const parsed = [];
        for (; i < args.length; i++) {
            const input = context.parse(args[i], i, ValueType);
            if (!input)
                return null;
            parsed.push(input);
        }
        return new Assertion(type, parsed);
    }
    evaluate(ctx) {
        for (let i = 0; i < this.args.length; i++) {
            const value = this.args[i].evaluate(ctx);
            const error = checkSubtype(this.type, typeOf(value));
            if (!error) {
                return value;
            } else if (i === this.args.length - 1) {
                throw new RuntimeError$1(`Expected value to be of type ${ toString$1(this.type) }, but found ${ toString$1(typeOf(value)) } instead.`);
            }
        }
        return null;
    }
    eachChild(fn) {
        this.args.forEach(fn);
    }
    outputDefined() {
        return this.args.every(arg => arg.outputDefined());
    }
    serialize() {
        const type = this.type;
        const serialized = [type.kind];
        if (type.kind === 'array') {
            const itemType = type.itemType;
            if (itemType.kind === 'string' || itemType.kind === 'number' || itemType.kind === 'boolean') {
                serialized.push(itemType.kind);
                const N = type.N;
                if (typeof N === 'number' || this.args.length > 1) {
                    serialized.push(N);
                }
            }
        }
        return serialized.concat(this.args.map(arg => arg.serialize()));
    }
}
var Assertion$1 = Assertion;

//
class FormatExpression {
    constructor(sections) {
        this.type = FormattedType;
        this.sections = sections;
    }
    static parse(args, context) {
        if (args.length < 2) {
            return context.error(`Expected at least one argument.`);
        }
        const firstArg = args[1];
        if (!Array.isArray(firstArg) && typeof firstArg === 'object') {
            return context.error(`First argument must be an image or text section.`);
        }
        const sections = [];
        let nextTokenMayBeObject = false;
        for (let i = 1; i <= args.length - 1; ++i) {
            const arg = args[i];
            if (nextTokenMayBeObject && typeof arg === 'object' && !Array.isArray(arg)) {
                nextTokenMayBeObject = false;
                let scale = null;
                if (arg['font-scale']) {
                    scale = context.parse(arg['font-scale'], 1, NumberType);
                    if (!scale)
                        return null;
                }
                let font = null;
                if (arg['text-font']) {
                    font = context.parse(arg['text-font'], 1, array$1(StringType));
                    if (!font)
                        return null;
                }
                let textColor = null;
                if (arg['text-color']) {
                    textColor = context.parse(arg['text-color'], 1, ColorType);
                    if (!textColor)
                        return null;
                }
                const lastExpression = sections[sections.length - 1];
                lastExpression.scale = scale;
                lastExpression.font = font;
                lastExpression.textColor = textColor;
            } else {
                const content = context.parse(args[i], 1, ValueType);
                if (!content)
                    return null;
                const kind = content.type.kind;
                if (kind !== 'string' && kind !== 'value' && kind !== 'null' && kind !== 'resolvedImage')
                    return context.error(`Formatted text type must be 'string', 'value', 'image' or 'null'.`);
                nextTokenMayBeObject = true;
                sections.push({
                    content,
                    scale: null,
                    font: null,
                    textColor: null
                });
            }
        }
        return new FormatExpression(sections);
    }
    evaluate(ctx) {
        const evaluateSection = section => {
            const evaluatedContent = section.content.evaluate(ctx);
            if (typeOf(evaluatedContent) === ResolvedImageType) {
                return new FormattedSection('', evaluatedContent, null, null, null);
            }
            return new FormattedSection(toString(evaluatedContent), null, section.scale ? section.scale.evaluate(ctx) : null, section.font ? section.font.evaluate(ctx).join(',') : null, section.textColor ? section.textColor.evaluate(ctx) : null);
        };
        return new Formatted(this.sections.map(evaluateSection));
    }
    eachChild(fn) {
        for (const section of this.sections) {
            fn(section.content);
            if (section.scale) {
                fn(section.scale);
            }
            if (section.font) {
                fn(section.font);
            }
            if (section.textColor) {
                fn(section.textColor);
            }
        }
    }
    outputDefined() {
        // Technically the combinatoric set of all children
        // Usually, this.text will be undefined anyway
        return false;
    }
    serialize() {
        const serialized = ['format'];
        for (const section of this.sections) {
            serialized.push(section.content.serialize());
            const options = {};
            if (section.scale) {
                options['font-scale'] = section.scale.serialize();
            }
            if (section.font) {
                options['text-font'] = section.font.serialize();
            }
            if (section.textColor) {
                options['text-color'] = section.textColor.serialize();
            }
            serialized.push(options);
        }
        return serialized;
    }
}

//
class ImageExpression {
    constructor(input) {
        this.type = ResolvedImageType;
        this.input = input;
    }
    static parse(args, context) {
        if (args.length !== 2) {
            return context.error(`Expected two arguments.`);
        }
        const name = context.parse(args[1], 1, StringType);
        if (!name)
            return context.error(`No image name provided.`);
        return new ImageExpression(name);
    }
    evaluate(ctx) {
        const evaluatedImageName = this.input.evaluate(ctx);
        const value = ResolvedImage.fromString(evaluatedImageName);
        if (value && ctx.availableImages)
            value.available = ctx.availableImages.indexOf(evaluatedImageName) > -1;
        return value;
    }
    eachChild(fn) {
        fn(this.input);
    }
    outputDefined() {
        // The output of image is determined by the list of available images in the evaluation context
        return false;
    }
    serialize() {
        return [
            'image',
            this.input.serialize()
        ];
    }
}

const types = {
    'to-boolean': BooleanType,
    'to-color': ColorType,
    'to-number': NumberType,
    'to-string': StringType
};
/**
 * Special form for error-coalescing coercion expressions "to-number",
 * "to-color".  Since these coercions can fail at runtime, they accept multiple
 * arguments, only evaluating one at a time until one succeeds.
 *
 * @private
 */
class Coercion {
    constructor(type, args) {
        this.type = type;
        this.args = args;
    }
    static parse(args, context) {
        if (args.length < 2)
            return context.error(`Expected at least one argument.`);
        const name = args[0];
        if ((name === 'to-boolean' || name === 'to-string') && args.length !== 2)
            return context.error(`Expected one argument.`);
        const type = types[name];
        const parsed = [];
        for (let i = 1; i < args.length; i++) {
            const input = context.parse(args[i], i, ValueType);
            if (!input)
                return null;
            parsed.push(input);
        }
        return new Coercion(type, parsed);
    }
    evaluate(ctx) {
        if (this.type.kind === 'boolean') {
            return Boolean(this.args[0].evaluate(ctx));
        } else if (this.type.kind === 'color') {
            let input;
            let error;
            for (const arg of this.args) {
                input = arg.evaluate(ctx);
                error = null;
                if (input instanceof Color$1) {
                    return input;
                } else if (typeof input === 'string') {
                    const c = ctx.parseColor(input);
                    if (c)
                        return c;
                } else if (Array.isArray(input)) {
                    if (input.length < 3 || input.length > 4) {
                        error = `Invalid rbga value ${ JSON.stringify(input) }: expected an array containing either three or four numeric values.`;
                    } else {
                        error = validateRGBA(input[0], input[1], input[2], input[3]);
                    }
                    if (!error) {
                        return new Color$1(input[0] / 255, input[1] / 255, input[2] / 255, input[3]);
                    }
                }
            }
            throw new RuntimeError$1(error || `Could not parse color from value '${ typeof input === 'string' ? input : String(JSON.stringify(input)) }'`);
        } else if (this.type.kind === 'number') {
            let value = null;
            for (const arg of this.args) {
                value = arg.evaluate(ctx);
                if (value === null)
                    return 0;
                const num = Number(value);
                if (isNaN(num))
                    continue;
                return num;
            }
            throw new RuntimeError$1(`Could not convert ${ JSON.stringify(value) } to number.`);
        } else if (this.type.kind === 'formatted') {
            // There is no explicit 'to-formatted' but this coercion can be implicitly
            // created by properties that expect the 'formatted' type.
            return Formatted.fromString(toString(this.args[0].evaluate(ctx)));
        } else if (this.type.kind === 'resolvedImage') {
            return ResolvedImage.fromString(toString(this.args[0].evaluate(ctx)));
        } else {
            return toString(this.args[0].evaluate(ctx));
        }
    }
    eachChild(fn) {
        this.args.forEach(fn);
    }
    outputDefined() {
        return this.args.every(arg => arg.outputDefined());
    }
    serialize() {
        if (this.type.kind === 'formatted') {
            return new FormatExpression([{
                    content: this.args[0],
                    scale: null,
                    font: null,
                    textColor: null
                }]).serialize();
        }
        if (this.type.kind === 'resolvedImage') {
            return new ImageExpression(this.args[0]).serialize();
        }
        const serialized = [`to-${ this.type.kind }`];
        this.eachChild(child => {
            serialized.push(child.serialize());
        });
        return serialized;
    }
}
var Coercion$1 = Coercion;

//
const geometryTypes = [
    'Unknown',
    'Point',
    'LineString',
    'Polygon'
];
class EvaluationContext {
    constructor() {
        this.globals = null;
        this.feature = null;
        this.featureState = null;
        this.formattedSection = null;
        this._parseColorCache = {};
        this.availableImages = null;
        this.canonical = null;
        this.featureTileCoord = null;
        this.featureDistanceData = null;
    }
    id() {
        return this.feature && this.feature.id !== undefined ? this.feature.id : null;
    }
    geometryType() {
        return this.feature ? typeof this.feature.type === 'number' ? geometryTypes[this.feature.type] : this.feature.type : null;
    }
    geometry() {
        return this.feature && 'geometry' in this.feature ? this.feature.geometry : null;
    }
    canonicalID() {
        return this.canonical;
    }
    properties() {
        return this.feature && this.feature.properties || {};
    }
    distanceFromCenter() {
        if (this.featureTileCoord && this.featureDistanceData) {
            const c = this.featureDistanceData.center;
            const scale = this.featureDistanceData.scale;
            const {x, y} = this.featureTileCoord;
            // Calculate the distance vector `d` (left handed)
            const dX = x * scale - c[0];
            const dY = y * scale - c[1];
            // The bearing vector `b` (left handed)
            const bX = this.featureDistanceData.bearing[0];
            const bY = this.featureDistanceData.bearing[1];
            // Distance is calculated as `dot(d, v)`
            const dist = bX * dX + bY * dY;
            return dist;
        }
        return 0;
    }
    parseColor(input) {
        let cached = this._parseColorCache[input];
        if (!cached) {
            cached = this._parseColorCache[input] = Color$1.parse(input);
        }
        return cached;
    }
}
var EvaluationContext$1 = EvaluationContext;

//
class CompoundExpression {
    constructor(name, type, evaluate, args) {
        this.name = name;
        this.type = type;
        this._evaluate = evaluate;
        this.args = args;
    }
    evaluate(ctx) {
        return this._evaluate(ctx, this.args);
    }
    eachChild(fn) {
        this.args.forEach(fn);
    }
    outputDefined() {
        return false;
    }
    serialize() {
        return [this.name].concat(this.args.map(arg => arg.serialize()));
    }
    static parse(args, context) {
        const op = args[0];
        const definition = CompoundExpression.definitions[op];
        if (!definition) {
            return context.error(`Unknown expression "${ op }". If you wanted a literal array, use ["literal", [...]].`, 0);
        }
        // Now check argument types against each signature
        const type = Array.isArray(definition) ? definition[0] : definition.type;
        const availableOverloads = Array.isArray(definition) ? [[
                definition[1],
                definition[2]
            ]] : definition.overloads;
        const overloads = availableOverloads.filter(([signature]) => !Array.isArray(signature) || // varags
        signature.length === args.length - 1    // correct param count
);
        let signatureContext = null;
        for (const [params, evaluate] of overloads) {
            // Use a fresh context for each attempted signature so that, if
            // we eventually succeed, we haven't polluted `context.errors`.
            signatureContext = new ParsingContext$1(context.registry, context.path, null, context.scope);
            // First parse all the args, potentially coercing to the
            // types expected by this overload.
            const parsedArgs = [];
            let argParseFailed = false;
            for (let i = 1; i < args.length; i++) {
                const arg = args[i];
                const expectedType = Array.isArray(params) ? params[i - 1] : params.type;
                const parsed = signatureContext.parse(arg, 1 + parsedArgs.length, expectedType);
                if (!parsed) {
                    argParseFailed = true;
                    break;
                }
                parsedArgs.push(parsed);
            }
            if (argParseFailed) {
                // Couldn't coerce args of this overload to expected type, move
                // on to next one.
                continue;
            }
            if (Array.isArray(params)) {
                if (params.length !== parsedArgs.length) {
                    signatureContext.error(`Expected ${ params.length } arguments, but found ${ parsedArgs.length } instead.`);
                    continue;
                }
            }
            for (let i = 0; i < parsedArgs.length; i++) {
                const expected = Array.isArray(params) ? params[i] : params.type;
                const arg = parsedArgs[i];
                signatureContext.concat(i + 1).checkSubtype(expected, arg.type);
            }
            if (signatureContext.errors.length === 0) {
                return new CompoundExpression(op, type, evaluate, parsedArgs);
            }
        }
        if (overloads.length === 1) {
            context.errors.push(...signatureContext.errors);
        } else {
            const expected = overloads.length ? overloads : availableOverloads;
            const signatures = expected.map(([params]) => stringifySignature(params)).join(' | ');
            const actualTypes = [];
            // For error message, re-parse arguments without trying to
            // apply any coercions
            for (let i = 1; i < args.length; i++) {
                const parsed = context.parse(args[i], 1 + actualTypes.length);
                if (!parsed)
                    return null;
                actualTypes.push(toString$1(parsed.type));
            }
            context.error(`Expected arguments of type ${ signatures }, but found (${ actualTypes.join(', ') }) instead.`);
        }
        return null;
    }
    static register(registry, definitions) {
        CompoundExpression.definitions = definitions;
        for (const name in definitions) {
            registry[name] = CompoundExpression;
        }
    }
}
function stringifySignature(signature) {
    if (Array.isArray(signature)) {
        return `(${ signature.map(toString$1).join(', ') })`;
    } else {
        return `(${ toString$1(signature.type) }...)`;
    }
}
var CompoundExpression$1 = CompoundExpression;

//
class CollatorExpression {
    constructor(caseSensitive, diacriticSensitive, locale) {
        this.type = CollatorType;
        this.locale = locale;
        this.caseSensitive = caseSensitive;
        this.diacriticSensitive = diacriticSensitive;
    }
    static parse(args, context) {
        if (args.length !== 2)
            return context.error(`Expected one argument.`);
        const options = args[1];
        if (typeof options !== 'object' || Array.isArray(options))
            return context.error(`Collator options argument must be an object.`);
        const caseSensitive = context.parse(options['case-sensitive'] === undefined ? false : options['case-sensitive'], 1, BooleanType);
        if (!caseSensitive)
            return null;
        const diacriticSensitive = context.parse(options['diacritic-sensitive'] === undefined ? false : options['diacritic-sensitive'], 1, BooleanType);
        if (!diacriticSensitive)
            return null;
        let locale = null;
        if (options['locale']) {
            locale = context.parse(options['locale'], 1, StringType);
            if (!locale)
                return null;
        }
        return new CollatorExpression(caseSensitive, diacriticSensitive, locale);
    }
    evaluate(ctx) {
        return new Collator(this.caseSensitive.evaluate(ctx), this.diacriticSensitive.evaluate(ctx), this.locale ? this.locale.evaluate(ctx) : null);
    }
    eachChild(fn) {
        fn(this.caseSensitive);
        fn(this.diacriticSensitive);
        if (this.locale) {
            fn(this.locale);
        }
    }
    outputDefined() {
        // Technically the set of possible outputs is the combinatoric set of Collators produced
        // by all possible outputs of locale/caseSensitive/diacriticSensitive
        // But for the primary use of Collators in comparison operators, we ignore the Collator's
        // possible outputs anyway, so we can get away with leaving this false for now.
        return false;
    }
    serialize() {
        const options = {};
        options['case-sensitive'] = this.caseSensitive.serialize();
        options['diacritic-sensitive'] = this.diacriticSensitive.serialize();
        if (this.locale) {
            options['locale'] = this.locale.serialize();
        }
        return [
            'collator',
            options
        ];
    }
}

//
// minX, minY, maxX, maxY
const EXTENT = 8192;
function updateBBox(bbox, coord) {
    bbox[0] = Math.min(bbox[0], coord[0]);
    bbox[1] = Math.min(bbox[1], coord[1]);
    bbox[2] = Math.max(bbox[2], coord[0]);
    bbox[3] = Math.max(bbox[3], coord[1]);
}
function mercatorXfromLng(lng) {
    return (180 + lng) / 360;
}
function mercatorYfromLat(lat) {
    return (180 - 180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360))) / 360;
}
function boxWithinBox(bbox1, bbox2) {
    if (bbox1[0] <= bbox2[0])
        return false;
    if (bbox1[2] >= bbox2[2])
        return false;
    if (bbox1[1] <= bbox2[1])
        return false;
    if (bbox1[3] >= bbox2[3])
        return false;
    return true;
}
function getTileCoordinates(p, canonical) {
    const x = mercatorXfromLng(p[0]);
    const y = mercatorYfromLat(p[1]);
    const tilesAtZoom = Math.pow(2, canonical.z);
    return [
        Math.round(x * tilesAtZoom * EXTENT),
        Math.round(y * tilesAtZoom * EXTENT)
    ];
}
function onBoundary(p, p1, p2) {
    const x1 = p[0] - p1[0];
    const y1 = p[1] - p1[1];
    const x2 = p[0] - p2[0];
    const y2 = p[1] - p2[1];
    return x1 * y2 - x2 * y1 === 0 && x1 * x2 <= 0 && y1 * y2 <= 0;
}
function rayIntersect(p, p1, p2) {
    return p1[1] > p[1] !== p2[1] > p[1] && p[0] < (p2[0] - p1[0]) * (p[1] - p1[1]) / (p2[1] - p1[1]) + p1[0];
}
// ray casting algorithm for detecting if point is in polygon
function pointWithinPolygon(point, rings) {
    let inside = false;
    for (let i = 0, len = rings.length; i < len; i++) {
        const ring = rings[i];
        for (let j = 0, len2 = ring.length; j < len2 - 1; j++) {
            if (onBoundary(point, ring[j], ring[j + 1]))
                return false;
            if (rayIntersect(point, ring[j], ring[j + 1]))
                inside = !inside;
        }
    }
    return inside;
}
function pointWithinPolygons(point, polygons) {
    for (let i = 0; i < polygons.length; i++) {
        if (pointWithinPolygon(point, polygons[i]))
            return true;
    }
    return false;
}
function perp(v1, v2) {
    return v1[0] * v2[1] - v1[1] * v2[0];
}
// check if p1 and p2 are in different sides of line segment q1->q2
function twoSided(p1, p2, q1, q2) {
    // q1->p1 (x1, y1), q1->p2 (x2, y2), q1->q2 (x3, y3)
    const x1 = p1[0] - q1[0];
    const y1 = p1[1] - q1[1];
    const x2 = p2[0] - q1[0];
    const y2 = p2[1] - q1[1];
    const x3 = q2[0] - q1[0];
    const y3 = q2[1] - q1[1];
    const det1 = x1 * y3 - x3 * y1;
    const det2 = x2 * y3 - x3 * y2;
    if (det1 > 0 && det2 < 0 || det1 < 0 && det2 > 0)
        return true;
    return false;
}
// a, b are end points for line segment1, c and d are end points for line segment2
function lineIntersectLine(a, b, c, d) {
    // check if two segments are parallel or not
    // precondition is end point a, b is inside polygon, if line a->b is
    // parallel to polygon edge c->d, then a->b won't intersect with c->d
    const vectorP = [
        b[0] - a[0],
        b[1] - a[1]
    ];
    const vectorQ = [
        d[0] - c[0],
        d[1] - c[1]
    ];
    if (perp(vectorQ, vectorP) === 0)
        return false;
    // If lines are intersecting with each other, the relative location should be:
    // a and b lie in different sides of segment c->d
    // c and d lie in different sides of segment a->b
    if (twoSided(a, b, c, d) && twoSided(c, d, a, b))
        return true;
    return false;
}
function lineIntersectPolygon(p1, p2, polygon) {
    for (const ring of polygon) {
        // loop through every edge of the ring
        for (let j = 0; j < ring.length - 1; ++j) {
            if (lineIntersectLine(p1, p2, ring[j], ring[j + 1])) {
                return true;
            }
        }
    }
    return false;
}
function lineStringWithinPolygon(line, polygon) {
    // First, check if geometry points of line segments are all inside polygon
    for (let i = 0; i < line.length; ++i) {
        if (!pointWithinPolygon(line[i], polygon)) {
            return false;
        }
    }
    // Second, check if there is line segment intersecting polygon edge
    for (let i = 0; i < line.length - 1; ++i) {
        if (lineIntersectPolygon(line[i], line[i + 1], polygon)) {
            return false;
        }
    }
    return true;
}
function lineStringWithinPolygons(line, polygons) {
    for (let i = 0; i < polygons.length; i++) {
        if (lineStringWithinPolygon(line, polygons[i]))
            return true;
    }
    return false;
}
function getTilePolygon(coordinates, bbox, canonical) {
    const polygon = [];
    for (let i = 0; i < coordinates.length; i++) {
        const ring = [];
        for (let j = 0; j < coordinates[i].length; j++) {
            const coord = getTileCoordinates(coordinates[i][j], canonical);
            updateBBox(bbox, coord);
            ring.push(coord);
        }
        polygon.push(ring);
    }
    return polygon;
}
function getTilePolygons(coordinates, bbox, canonical) {
    const polygons = [];
    for (let i = 0; i < coordinates.length; i++) {
        const polygon = getTilePolygon(coordinates[i], bbox, canonical);
        polygons.push(polygon);
    }
    return polygons;
}
function updatePoint(p, bbox, polyBBox, worldSize) {
    if (p[0] < polyBBox[0] || p[0] > polyBBox[2]) {
        const halfWorldSize = worldSize * 0.5;
        let shift = p[0] - polyBBox[0] > halfWorldSize ? -worldSize : polyBBox[0] - p[0] > halfWorldSize ? worldSize : 0;
        if (shift === 0) {
            shift = p[0] - polyBBox[2] > halfWorldSize ? -worldSize : polyBBox[2] - p[0] > halfWorldSize ? worldSize : 0;
        }
        p[0] += shift;
    }
    updateBBox(bbox, p);
}
function resetBBox(bbox) {
    bbox[0] = bbox[1] = Infinity;
    bbox[2] = bbox[3] = -Infinity;
}
function getTilePoints(geometry, pointBBox, polyBBox, canonical) {
    const worldSize = Math.pow(2, canonical.z) * EXTENT;
    const shifts = [
        canonical.x * EXTENT,
        canonical.y * EXTENT
    ];
    const tilePoints = [];
    if (!geometry)
        return tilePoints;
    for (const points of geometry) {
        for (const point of points) {
            const p = [
                point.x + shifts[0],
                point.y + shifts[1]
            ];
            updatePoint(p, pointBBox, polyBBox, worldSize);
            tilePoints.push(p);
        }
    }
    return tilePoints;
}
function getTileLines(geometry, lineBBox, polyBBox, canonical) {
    const worldSize = Math.pow(2, canonical.z) * EXTENT;
    const shifts = [
        canonical.x * EXTENT,
        canonical.y * EXTENT
    ];
    const tileLines = [];
    if (!geometry)
        return tileLines;
    for (const line of geometry) {
        const tileLine = [];
        for (const point of line) {
            const p = [
                point.x + shifts[0],
                point.y + shifts[1]
            ];
            updateBBox(lineBBox, p);
            tileLine.push(p);
        }
        tileLines.push(tileLine);
    }
    if (lineBBox[2] - lineBBox[0] <= worldSize / 2) {
        resetBBox(lineBBox);
        for (const line of tileLines) {
            for (const p of line) {
                updatePoint(p, lineBBox, polyBBox, worldSize);
            }
        }
    }
    return tileLines;
}
function pointsWithinPolygons(ctx, polygonGeometry) {
    const pointBBox = [
        Infinity,
        Infinity,
        -Infinity,
        -Infinity
    ];
    const polyBBox = [
        Infinity,
        Infinity,
        -Infinity,
        -Infinity
    ];
    const canonical = ctx.canonicalID();
    if (!canonical) {
        return false;
    }
    if (polygonGeometry.type === 'Polygon') {
        const tilePolygon = getTilePolygon(polygonGeometry.coordinates, polyBBox, canonical);
        const tilePoints = getTilePoints(ctx.geometry(), pointBBox, polyBBox, canonical);
        if (!boxWithinBox(pointBBox, polyBBox))
            return false;
        for (const point of tilePoints) {
            if (!pointWithinPolygon(point, tilePolygon))
                return false;
        }
    }
    if (polygonGeometry.type === 'MultiPolygon') {
        const tilePolygons = getTilePolygons(polygonGeometry.coordinates, polyBBox, canonical);
        const tilePoints = getTilePoints(ctx.geometry(), pointBBox, polyBBox, canonical);
        if (!boxWithinBox(pointBBox, polyBBox))
            return false;
        for (const point of tilePoints) {
            if (!pointWithinPolygons(point, tilePolygons))
                return false;
        }
    }
    return true;
}
function linesWithinPolygons(ctx, polygonGeometry) {
    const lineBBox = [
        Infinity,
        Infinity,
        -Infinity,
        -Infinity
    ];
    const polyBBox = [
        Infinity,
        Infinity,
        -Infinity,
        -Infinity
    ];
    const canonical = ctx.canonicalID();
    if (!canonical) {
        return false;
    }
    if (polygonGeometry.type === 'Polygon') {
        const tilePolygon = getTilePolygon(polygonGeometry.coordinates, polyBBox, canonical);
        const tileLines = getTileLines(ctx.geometry(), lineBBox, polyBBox, canonical);
        if (!boxWithinBox(lineBBox, polyBBox))
            return false;
        for (const line of tileLines) {
            if (!lineStringWithinPolygon(line, tilePolygon))
                return false;
        }
    }
    if (polygonGeometry.type === 'MultiPolygon') {
        const tilePolygons = getTilePolygons(polygonGeometry.coordinates, polyBBox, canonical);
        const tileLines = getTileLines(ctx.geometry(), lineBBox, polyBBox, canonical);
        if (!boxWithinBox(lineBBox, polyBBox))
            return false;
        for (const line of tileLines) {
            if (!lineStringWithinPolygons(line, tilePolygons))
                return false;
        }
    }
    return true;
}
class Within {
    constructor(geojson, geometries) {
        this.type = BooleanType;
        this.geojson = geojson;
        this.geometries = geometries;
    }
    static parse(args, context) {
        if (args.length !== 2)
            return context.error(`'within' expression requires exactly one argument, but found ${ args.length - 1 } instead.`);
        if (isValue(args[1])) {
            const geojson = args[1];
            if (geojson.type === 'FeatureCollection') {
                for (let i = 0; i < geojson.features.length; ++i) {
                    const type = geojson.features[i].geometry.type;
                    if (type === 'Polygon' || type === 'MultiPolygon') {
                        return new Within(geojson, geojson.features[i].geometry);
                    }
                }
            } else if (geojson.type === 'Feature') {
                const type = geojson.geometry.type;
                if (type === 'Polygon' || type === 'MultiPolygon') {
                    return new Within(geojson, geojson.geometry);
                }
            } else if (geojson.type === 'Polygon' || geojson.type === 'MultiPolygon') {
                return new Within(geojson, geojson);
            }
        }
        return context.error(`'within' expression requires valid geojson object that contains polygon geometry type.`);
    }
    evaluate(ctx) {
        if (ctx.geometry() != null && ctx.canonicalID() != null) {
            if (ctx.geometryType() === 'Point') {
                return pointsWithinPolygons(ctx, this.geometries);
            } else if (ctx.geometryType() === 'LineString') {
                return linesWithinPolygons(ctx, this.geometries);
            }
        }
        return false;
    }
    eachChild() {
    }
    outputDefined() {
        return true;
    }
    serialize() {
        return [
            'within',
            this.geojson
        ];
    }
}
var Within$1 = Within;

//
function isFeatureConstant(e) {
    if (e instanceof CompoundExpression$1) {
        if (e.name === 'get' && e.args.length === 1) {
            return false;
        } else if (e.name === 'feature-state') {
            return false;
        } else if (e.name === 'has' && e.args.length === 1) {
            return false;
        } else if (e.name === 'properties' || e.name === 'geometry-type' || e.name === 'id') {
            return false;
        } else if (/^filter-/.test(e.name)) {
            return false;
        }
    }
    if (e instanceof Within$1) {
        return false;
    }
    let result = true;
    e.eachChild(arg => {
        if (result && !isFeatureConstant(arg)) {
            result = false;
        }
    });
    return result;
}
function isStateConstant(e) {
    if (e instanceof CompoundExpression$1) {
        if (e.name === 'feature-state') {
            return false;
        }
    }
    let result = true;
    e.eachChild(arg => {
        if (result && !isStateConstant(arg)) {
            result = false;
        }
    });
    return result;
}
function isGlobalPropertyConstant(e, properties) {
    if (e instanceof CompoundExpression$1 && properties.indexOf(e.name) >= 0) {
        return false;
    }
    let result = true;
    e.eachChild(arg => {
        if (result && !isGlobalPropertyConstant(arg, properties)) {
            result = false;
        }
    });
    return result;
}

//
class Var {
    constructor(name, boundExpression) {
        this.type = boundExpression.type;
        this.name = name;
        this.boundExpression = boundExpression;
    }
    static parse(args, context) {
        if (args.length !== 2 || typeof args[1] !== 'string')
            return context.error(`'var' expression requires exactly one string literal argument.`);
        const name = args[1];
        if (!context.scope.has(name)) {
            return context.error(`Unknown variable "${ name }". Make sure "${ name }" has been bound in an enclosing "let" expression before using it.`, 1);
        }
        return new Var(name, context.scope.get(name));
    }
    evaluate(ctx) {
        return this.boundExpression.evaluate(ctx);
    }
    eachChild() {
    }
    outputDefined() {
        return false;
    }
    serialize() {
        return [
            'var',
            this.name
        ];
    }
}
var Var$1 = Var;

//
/**
 * State associated parsing at a given point in an expression tree.
 * @private
 */
class ParsingContext {
    // The expected type of this expression. Provided only to allow Expression
    // implementations to infer argument types: Expression#parse() need not
    // check that the output type of the parsed expression matches
    // `expectedType`.
    constructor(registry, path = [], expectedType, scope = new Scope$1(), errors = []) {
        this.registry = registry;
        this.path = path;
        this.key = path.map(part => `[${ part }]`).join('');
        this.scope = scope;
        this.errors = errors;
        this.expectedType = expectedType;
    }
    /**
     * @param expr the JSON expression to parse
     * @param index the optional argument index if this expression is an argument of a parent expression that's being parsed
     * @param options
     * @param options.omitTypeAnnotations set true to omit inferred type annotations.  Caller beware: with this option set, the parsed expression's type will NOT satisfy `expectedType` if it would normally be wrapped in an inferred annotation.
     * @private
     */
    parse(expr, index, expectedType, bindings, options = {}) {
        if (index) {
            return this.concat(index, expectedType, bindings)._parse(expr, options);
        }
        return this._parse(expr, options);
    }
    _parse(expr, options) {
        if (expr === null || typeof expr === 'string' || typeof expr === 'boolean' || typeof expr === 'number') {
            expr = [
                'literal',
                expr
            ];
        }
        function annotate(parsed, type, typeAnnotation) {
            if (typeAnnotation === 'assert') {
                return new Assertion$1(type, [parsed]);
            } else if (typeAnnotation === 'coerce') {
                return new Coercion$1(type, [parsed]);
            } else {
                return parsed;
            }
        }
        if (Array.isArray(expr)) {
            if (expr.length === 0) {
                return this.error(`Expected an array with at least one element. If you wanted a literal array, use ["literal", []].`);
            }
            const op = expr[0];
            if (typeof op !== 'string') {
                this.error(`Expression name must be a string, but found ${ typeof op } instead. If you wanted a literal array, use ["literal", [...]].`, 0);
                return null;
            }
            const Expr = this.registry[op];
            if (Expr) {
                let parsed = Expr.parse(expr, this);
                if (!parsed)
                    return null;
                if (this.expectedType) {
                    const expected = this.expectedType;
                    const actual = parsed.type;
                    // When we expect a number, string, boolean, or array but have a value, wrap it in an assertion.
                    // When we expect a color or formatted string, but have a string or value, wrap it in a coercion.
                    // Otherwise, we do static type-checking.
                    //
                    // These behaviors are overridable for:
                    //   * The "coalesce" operator, which needs to omit type annotations.
                    //   * String-valued properties (e.g. `text-field`), where coercion is more convenient than assertion.
                    //
                    if ((expected.kind === 'string' || expected.kind === 'number' || expected.kind === 'boolean' || expected.kind === 'object' || expected.kind === 'array') && actual.kind === 'value') {
                        parsed = annotate(parsed, expected, options.typeAnnotation || 'assert');
                    } else if ((expected.kind === 'color' || expected.kind === 'formatted' || expected.kind === 'resolvedImage') && (actual.kind === 'value' || actual.kind === 'string')) {
                        parsed = annotate(parsed, expected, options.typeAnnotation || 'coerce');
                    } else if (this.checkSubtype(expected, actual)) {
                        return null;
                    }
                }
                // If an expression's arguments are all literals, we can evaluate
                // it immediately and replace it with a literal value in the
                // parsed/compiled result. Expressions that expect an image should
                // not be resolved here so we can later get the available images.
                if (!(parsed instanceof Literal$1) && parsed.type.kind !== 'resolvedImage' && isConstant(parsed)) {
                    const ec = new EvaluationContext$1();
                    try {
                        parsed = new Literal$1(parsed.type, parsed.evaluate(ec));
                    } catch (e) {
                        this.error(e.message);
                        return null;
                    }
                }
                return parsed;
            }
            return this.error(`Unknown expression "${ op }". If you wanted a literal array, use ["literal", [...]].`, 0);
        } else if (typeof expr === 'undefined') {
            return this.error(`'undefined' value invalid. Use null instead.`);
        } else if (typeof expr === 'object') {
            return this.error(`Bare objects invalid. Use ["literal", {...}] instead.`);
        } else {
            return this.error(`Expected an array, but found ${ typeof expr } instead.`);
        }
    }
    /**
     * Returns a copy of this context suitable for parsing the subexpression at
     * index `index`, optionally appending to 'let' binding map.
     *
     * Note that `errors` property, intended for collecting errors while
     * parsing, is copied by reference rather than cloned.
     * @private
     */
    concat(index, expectedType, bindings) {
        const path = typeof index === 'number' ? this.path.concat(index) : this.path;
        const scope = bindings ? this.scope.concat(bindings) : this.scope;
        return new ParsingContext(this.registry, path, expectedType || null, scope, this.errors);
    }
    /**
     * Push a parsing (or type checking) error into the `this.errors`
     * @param error The message
     * @param keys Optionally specify the source of the error at a child
     * of the current expression at `this.key`.
     * @private
     */
    error(error, ...keys) {
        const key = `${ this.key }${ keys.map(k => `[${ k }]`).join('') }`;
        this.errors.push(new ParsingError$2(key, error));
    }
    /**
     * Returns null if `t` is a subtype of `expected`; otherwise returns an
     * error message and also pushes it to `this.errors`.
     */
    checkSubtype(expected, t) {
        const error = checkSubtype(expected, t);
        if (error)
            this.error(error);
        return error;
    }
}
var ParsingContext$1 = ParsingContext;
function isConstant(expression) {
    if (expression instanceof Var$1) {
        return isConstant(expression.boundExpression);
    } else if (expression instanceof CompoundExpression$1 && expression.name === 'error') {
        return false;
    } else if (expression instanceof CollatorExpression) {
        // Although the results of a Collator expression with fixed arguments
        // generally shouldn't change between executions, we can't serialize them
        // as constant expressions because results change based on environment.
        return false;
    } else if (expression instanceof Within$1) {
        return false;
    }
    const isTypeAnnotation = expression instanceof Coercion$1 || expression instanceof Assertion$1;
    let childrenConstant = true;
    expression.eachChild(child => {
        // We can _almost_ assume that if `expressions` children are constant,
        // they would already have been evaluated to Literal values when they
        // were parsed.  Type annotations are the exception, because they might
        // have been inferred and added after a child was parsed.
        // So we recurse into isConstant() for the children of type annotations,
        // but otherwise simply check whether they are Literals.
        if (isTypeAnnotation) {
            childrenConstant = childrenConstant && isConstant(child);
        } else {
            childrenConstant = childrenConstant && child instanceof Literal$1;
        }
    });
    if (!childrenConstant) {
        return false;
    }
    return isFeatureConstant(expression) && isGlobalPropertyConstant(expression, [
        'zoom',
        'heatmap-density',
        'line-progress',
        'sky-radial-progress',
        'accumulated',
        'is-supported-script',
        'pitch',
        'distance-from-center'
    ]);
}

//
/**
 * Returns the index of the last stop <= input, or 0 if it doesn't exist.
 * @private
 */
function findStopLessThanOrEqualTo(stops, input) {
    const lastIndex = stops.length - 1;
    let lowerIndex = 0;
    let upperIndex = lastIndex;
    let currentIndex = 0;
    let currentValue, nextValue;
    while (lowerIndex <= upperIndex) {
        currentIndex = Math.floor((lowerIndex + upperIndex) / 2);
        currentValue = stops[currentIndex];
        nextValue = stops[currentIndex + 1];
        if (currentValue <= input) {
            if (currentIndex === lastIndex || input < nextValue) {
                // Search complete
                return currentIndex;
            }
            lowerIndex = currentIndex + 1;
        } else if (currentValue > input) {
            upperIndex = currentIndex - 1;
        } else {
            throw new RuntimeError$1('Input is not a number.');
        }
    }
    return 0;
}

//
class Step {
    constructor(type, input, stops) {
        this.type = type;
        this.input = input;
        this.labels = [];
        this.outputs = [];
        for (const [label, expression] of stops) {
            this.labels.push(label);
            this.outputs.push(expression);
        }
    }
    static parse(args, context) {
        if (args.length - 1 < 4) {
            return context.error(`Expected at least 4 arguments, but found only ${ args.length - 1 }.`);
        }
        if ((args.length - 1) % 2 !== 0) {
            return context.error(`Expected an even number of arguments.`);
        }
        const input = context.parse(args[1], 1, NumberType);
        if (!input)
            return null;
        const stops = [];
        let outputType = null;
        if (context.expectedType && context.expectedType.kind !== 'value') {
            outputType = context.expectedType;
        }
        for (let i = 1; i < args.length; i += 2) {
            const label = i === 1 ? -Infinity : args[i];
            const value = args[i + 1];
            const labelKey = i;
            const valueKey = i + 1;
            if (typeof label !== 'number') {
                return context.error('Input/output pairs for "step" expressions must be defined using literal numeric values (not computed expressions) for the input values.', labelKey);
            }
            if (stops.length && stops[stops.length - 1][0] >= label) {
                return context.error('Input/output pairs for "step" expressions must be arranged with input values in strictly ascending order.', labelKey);
            }
            const parsed = context.parse(value, valueKey, outputType);
            if (!parsed)
                return null;
            outputType = outputType || parsed.type;
            stops.push([
                label,
                parsed
            ]);
        }
        return new Step(outputType, input, stops);
    }
    evaluate(ctx) {
        const labels = this.labels;
        const outputs = this.outputs;
        if (labels.length === 1) {
            return outputs[0].evaluate(ctx);
        }
        const value = this.input.evaluate(ctx);
        if (value <= labels[0]) {
            return outputs[0].evaluate(ctx);
        }
        const stopCount = labels.length;
        if (value >= labels[stopCount - 1]) {
            return outputs[stopCount - 1].evaluate(ctx);
        }
        const index = findStopLessThanOrEqualTo(labels, value);
        return outputs[index].evaluate(ctx);
    }
    eachChild(fn) {
        fn(this.input);
        for (const expression of this.outputs) {
            fn(expression);
        }
    }
    outputDefined() {
        return this.outputs.every(out => out.outputDefined());
    }
    serialize() {
        const serialized = [
            'step',
            this.input.serialize()
        ];
        for (let i = 0; i < this.labels.length; i++) {
            if (i > 0) {
                serialized.push(this.labels[i]);
            }
            serialized.push(this.outputs[i].serialize());
        }
        return serialized;
    }
}
var Step$1 = Step;

var unitbezier = UnitBezier;
function UnitBezier(p1x, p1y, p2x, p2y) {
    // Calculate the polynomial coefficients, implicit first and last control points are (0,0) and (1,1).
    this.cx = 3 * p1x;
    this.bx = 3 * (p2x - p1x) - this.cx;
    this.ax = 1 - this.cx - this.bx;
    this.cy = 3 * p1y;
    this.by = 3 * (p2y - p1y) - this.cy;
    this.ay = 1 - this.cy - this.by;
    this.p1x = p1x;
    this.p1y = p1y;
    this.p2x = p2x;
    this.p2y = p2y;
}
UnitBezier.prototype = {
    sampleCurveX: function (t) {
        // `ax t^3 + bx t^2 + cx t' expanded using Horner's rule.
        return ((this.ax * t + this.bx) * t + this.cx) * t;
    },
    sampleCurveY: function (t) {
        return ((this.ay * t + this.by) * t + this.cy) * t;
    },
    sampleCurveDerivativeX: function (t) {
        return (3 * this.ax * t + 2 * this.bx) * t + this.cx;
    },
    solveCurveX: function (x, epsilon) {
        if (epsilon === undefined)
            epsilon = 0.000001;
        if (x < 0)
            return 0;
        if (x > 1)
            return 1;
        var t = x;
        // First try a few iterations of Newton's method - normally very fast.
        for (var i = 0; i < 8; i++) {
            var x2 = this.sampleCurveX(t) - x;
            if (Math.abs(x2) < epsilon)
                return t;
            var d2 = this.sampleCurveDerivativeX(t);
            if (Math.abs(d2) < 0.000001)
                break;
            t = t - x2 / d2;
        }
        // Fall back to the bisection method for reliability.
        var t0 = 0;
        var t1 = 1;
        t = x;
        for (i = 0; i < 20; i++) {
            x2 = this.sampleCurveX(t);
            if (Math.abs(x2 - x) < epsilon)
                break;
            if (x > x2) {
                t0 = t;
            } else {
                t1 = t;
            }
            t = (t1 - t0) * 0.5 + t0;
        }
        return t;
    },
    solve: function (x, epsilon) {
        return this.sampleCurveY(this.solveCurveX(x, epsilon));
    }
};

//
function number(a, b, t) {
    return a * (1 - t) + b * t;
}
function color(from, to, t) {
    return new Color$1(number(from.r, to.r, t), number(from.g, to.g, t), number(from.b, to.b, t), number(from.a, to.a, t));
}
function array(from, to, t) {
    return from.map((d, i) => {
        return number(d, to[i], t);
    });
}

var interpolate = /*#__PURE__*/Object.freeze({
  __proto__: null,
  number: number,
  color: color,
  array: array
});

//
// Constants
const Xn = 0.95047,
    // D65 standard referent
    Yn = 1, Zn = 1.08883, t0 = 4 / 29, t1 = 6 / 29, t2 = 3 * t1 * t1, t3 = t1 * t1 * t1, deg2rad = Math.PI / 180, rad2deg = 180 / Math.PI;
// Utilities
function xyz2lab(t) {
    return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
}
function lab2xyz(t) {
    return t > t1 ? t * t * t : t2 * (t - t0);
}
function xyz2rgb(x) {
    return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
}
function rgb2xyz(x) {
    x /= 255;
    return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}
// LAB
function rgbToLab(rgbColor) {
    const b = rgb2xyz(rgbColor.r), a = rgb2xyz(rgbColor.g), l = rgb2xyz(rgbColor.b), x = xyz2lab((0.4124564 * b + 0.3575761 * a + 0.1804375 * l) / Xn), y = xyz2lab((0.2126729 * b + 0.7151522 * a + 0.072175 * l) / Yn), z = xyz2lab((0.0193339 * b + 0.119192 * a + 0.9503041 * l) / Zn);
    return {
        l: 116 * y - 16,
        a: 500 * (x - y),
        b: 200 * (y - z),
        alpha: rgbColor.a
    };
}
function labToRgb(labColor) {
    let y = (labColor.l + 16) / 116, x = isNaN(labColor.a) ? y : y + labColor.a / 500, z = isNaN(labColor.b) ? y : y - labColor.b / 200;
    y = Yn * lab2xyz(y);
    x = Xn * lab2xyz(x);
    z = Zn * lab2xyz(z);
    return new Color$1(xyz2rgb(3.2404542 * x - 1.5371385 * y - 0.4985314 * z), // D65 -> sRGB
    xyz2rgb(-0.969266 * x + 1.8760108 * y + 0.041556 * z), xyz2rgb(0.0556434 * x - 0.2040259 * y + 1.0572252 * z), labColor.alpha);
}
function interpolateLab(from, to, t) {
    return {
        l: number(from.l, to.l, t),
        a: number(from.a, to.a, t),
        b: number(from.b, to.b, t),
        alpha: number(from.alpha, to.alpha, t)
    };
}
// HCL
function rgbToHcl(rgbColor) {
    const {l, a, b} = rgbToLab(rgbColor);
    const h = Math.atan2(b, a) * rad2deg;
    return {
        h: h < 0 ? h + 360 : h,
        c: Math.sqrt(a * a + b * b),
        l,
        alpha: rgbColor.a
    };
}
function hclToRgb(hclColor) {
    const h = hclColor.h * deg2rad, c = hclColor.c, l = hclColor.l;
    return labToRgb({
        l,
        a: Math.cos(h) * c,
        b: Math.sin(h) * c,
        alpha: hclColor.alpha
    });
}
function interpolateHue(a, b, t) {
    const d = b - a;
    return a + t * (d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d);
}
function interpolateHcl(from, to, t) {
    return {
        h: interpolateHue(from.h, to.h, t),
        c: number(from.c, to.c, t),
        l: number(from.l, to.l, t),
        alpha: number(from.alpha, to.alpha, t)
    };
}
const lab = {
    forward: rgbToLab,
    reverse: labToRgb,
    interpolate: interpolateLab
};
const hcl = {
    forward: rgbToHcl,
    reverse: hclToRgb,
    interpolate: interpolateHcl
};

var colorSpaces = /*#__PURE__*/Object.freeze({
  __proto__: null,
  lab: lab,
  hcl: hcl
});

//
class Interpolate {
    constructor(type, operator, interpolation, input, stops) {
        this.type = type;
        this.operator = operator;
        this.interpolation = interpolation;
        this.input = input;
        this.labels = [];
        this.outputs = [];
        for (const [label, expression] of stops) {
            this.labels.push(label);
            this.outputs.push(expression);
        }
    }
    static interpolationFactor(interpolation, input, lower, upper) {
        let t = 0;
        if (interpolation.name === 'exponential') {
            t = exponentialInterpolation(input, interpolation.base, lower, upper);
        } else if (interpolation.name === 'linear') {
            t = exponentialInterpolation(input, 1, lower, upper);
        } else if (interpolation.name === 'cubic-bezier') {
            const c = interpolation.controlPoints;
            const ub = new unitbezier(c[0], c[1], c[2], c[3]);
            t = ub.solve(exponentialInterpolation(input, 1, lower, upper));
        }
        return t;
    }
    static parse(args, context) {
        let [operator, interpolation, input, ...rest] = args;
        if (!Array.isArray(interpolation) || interpolation.length === 0) {
            return context.error(`Expected an interpolation type expression.`, 1);
        }
        if (interpolation[0] === 'linear') {
            interpolation = { name: 'linear' };
        } else if (interpolation[0] === 'exponential') {
            const base = interpolation[1];
            if (typeof base !== 'number')
                return context.error(`Exponential interpolation requires a numeric base.`, 1, 1);
            interpolation = {
                name: 'exponential',
                base
            };
        } else if (interpolation[0] === 'cubic-bezier') {
            const controlPoints = interpolation.slice(1);
            if (controlPoints.length !== 4 || controlPoints.some(t => typeof t !== 'number' || t < 0 || t > 1)) {
                return context.error('Cubic bezier interpolation requires four numeric arguments with values between 0 and 1.', 1);
            }
            interpolation = {
                name: 'cubic-bezier',
                controlPoints: controlPoints
            };
        } else {
            return context.error(`Unknown interpolation type ${ String(interpolation[0]) }`, 1, 0);
        }
        if (args.length - 1 < 4) {
            return context.error(`Expected at least 4 arguments, but found only ${ args.length - 1 }.`);
        }
        if ((args.length - 1) % 2 !== 0) {
            return context.error(`Expected an even number of arguments.`);
        }
        input = context.parse(input, 2, NumberType);
        if (!input)
            return null;
        const stops = [];
        let outputType = null;
        if (operator === 'interpolate-hcl' || operator === 'interpolate-lab') {
            outputType = ColorType;
        } else if (context.expectedType && context.expectedType.kind !== 'value') {
            outputType = context.expectedType;
        }
        for (let i = 0; i < rest.length; i += 2) {
            const label = rest[i];
            const value = rest[i + 1];
            const labelKey = i + 3;
            const valueKey = i + 4;
            if (typeof label !== 'number') {
                return context.error('Input/output pairs for "interpolate" expressions must be defined using literal numeric values (not computed expressions) for the input values.', labelKey);
            }
            if (stops.length && stops[stops.length - 1][0] >= label) {
                return context.error('Input/output pairs for "interpolate" expressions must be arranged with input values in strictly ascending order.', labelKey);
            }
            const parsed = context.parse(value, valueKey, outputType);
            if (!parsed)
                return null;
            outputType = outputType || parsed.type;
            stops.push([
                label,
                parsed
            ]);
        }
        if (outputType.kind !== 'number' && outputType.kind !== 'color' && !(outputType.kind === 'array' && outputType.itemType.kind === 'number' && typeof outputType.N === 'number')) {
            return context.error(`Type ${ toString$1(outputType) } is not interpolatable.`);
        }
        return new Interpolate(outputType, operator, interpolation, input, stops);
    }
    evaluate(ctx) {
        const labels = this.labels;
        const outputs = this.outputs;
        if (labels.length === 1) {
            return outputs[0].evaluate(ctx);
        }
        const value = this.input.evaluate(ctx);
        if (value <= labels[0]) {
            return outputs[0].evaluate(ctx);
        }
        const stopCount = labels.length;
        if (value >= labels[stopCount - 1]) {
            return outputs[stopCount - 1].evaluate(ctx);
        }
        const index = findStopLessThanOrEqualTo(labels, value);
        const lower = labels[index];
        const upper = labels[index + 1];
        const t = Interpolate.interpolationFactor(this.interpolation, value, lower, upper);
        const outputLower = outputs[index].evaluate(ctx);
        const outputUpper = outputs[index + 1].evaluate(ctx);
        if (this.operator === 'interpolate') {
            return interpolate[this.type.kind.toLowerCase()](outputLower, outputUpper, t);    // eslint-disable-line import/namespace
        } else if (this.operator === 'interpolate-hcl') {
            return hcl.reverse(hcl.interpolate(hcl.forward(outputLower), hcl.forward(outputUpper), t));
        } else {
            return lab.reverse(lab.interpolate(lab.forward(outputLower), lab.forward(outputUpper), t));
        }
    }
    eachChild(fn) {
        fn(this.input);
        for (const expression of this.outputs) {
            fn(expression);
        }
    }
    outputDefined() {
        return this.outputs.every(out => out.outputDefined());
    }
    serialize() {
        let interpolation;
        if (this.interpolation.name === 'linear') {
            interpolation = ['linear'];
        } else if (this.interpolation.name === 'exponential') {
            if (this.interpolation.base === 1) {
                interpolation = ['linear'];
            } else {
                interpolation = [
                    'exponential',
                    this.interpolation.base
                ];
            }
        } else {
            interpolation = ['cubic-bezier'].concat(this.interpolation.controlPoints);
        }
        const serialized = [
            this.operator,
            interpolation,
            this.input.serialize()
        ];
        for (let i = 0; i < this.labels.length; i++) {
            serialized.push(this.labels[i], this.outputs[i].serialize());
        }
        return serialized;
    }
}
/**
 * Returns a ratio that can be used to interpolate between exponential function
 * stops.
 * How it works: Two consecutive stop values define a (scaled and shifted) exponential function `f(x) = a * base^x + b`, where `base` is the user-specified base,
 * and `a` and `b` are constants affording sufficient degrees of freedom to fit
 * the function to the given stops.
 *
 * Here's a bit of algebra that lets us compute `f(x)` directly from the stop
 * values without explicitly solving for `a` and `b`:
 *
 * First stop value: `f(x0) = y0 = a * base^x0 + b`
 * Second stop value: `f(x1) = y1 = a * base^x1 + b`
 * => `y1 - y0 = a(base^x1 - base^x0)`
 * => `a = (y1 - y0)/(base^x1 - base^x0)`
 *
 * Desired value: `f(x) = y = a * base^x + b`
 * => `f(x) = y0 + a * (base^x - base^x0)`
 *
 * From the above, we can replace the `a` in `a * (base^x - base^x0)` and do a
 * little algebra:
 * ```
 * a * (base^x - base^x0) = (y1 - y0)/(base^x1 - base^x0) * (base^x - base^x0)
 *                     = (y1 - y0) * (base^x - base^x0) / (base^x1 - base^x0)
 * ```
 *
 * If we let `(base^x - base^x0) / (base^x1 base^x0)`, then we have
 * `f(x) = y0 + (y1 - y0) * ratio`.  In other words, `ratio` may be treated as
 * an interpolation factor between the two stops' output values.
 *
 * (Note: a slightly different form for `ratio`,
 * `(base^(x-x0) - 1) / (base^(x1-x0) - 1) `, is equivalent, but requires fewer
 * expensive `Math.pow()` operations.)
 *
 * @private
*/
function exponentialInterpolation(input, base, lowerValue, upperValue) {
    const difference = upperValue - lowerValue;
    const progress = input - lowerValue;
    if (difference === 0) {
        return 0;
    } else if (base === 1) {
        return progress / difference;
    } else {
        return (Math.pow(base, progress) - 1) / (Math.pow(base, difference) - 1);
    }
}
var Interpolate$1 = Interpolate;

class Coalesce {
    constructor(type, args) {
        this.type = type;
        this.args = args;
    }
    static parse(args, context) {
        if (args.length < 2) {
            return context.error('Expectected at least one argument.');
        }
        let outputType = null;
        const expectedType = context.expectedType;
        if (expectedType && expectedType.kind !== 'value') {
            outputType = expectedType;
        }
        const parsedArgs = [];
        for (const arg of args.slice(1)) {
            const parsed = context.parse(arg, 1 + parsedArgs.length, outputType, undefined, { typeAnnotation: 'omit' });
            if (!parsed)
                return null;
            outputType = outputType || parsed.type;
            parsedArgs.push(parsed);
        }
        // Above, we parse arguments without inferred type annotation so that
        // they don't produce a runtime error for `null` input, which would
        // preempt the desired null-coalescing behavior.
        // Thus, if any of our arguments would have needed an annotation, we
        // need to wrap the enclosing coalesce expression with it instead.
        const needsAnnotation = expectedType && parsedArgs.some(arg => checkSubtype(expectedType, arg.type));
        return needsAnnotation ? new Coalesce(ValueType, parsedArgs) : new Coalesce(outputType, parsedArgs);
    }
    evaluate(ctx) {
        let result = null;
        let argCount = 0;
        let firstImage;
        for (const arg of this.args) {
            argCount++;
            result = arg.evaluate(ctx);
            // we need to keep track of the first requested image in a coalesce statement
            // if coalesce can't find a valid image, we return the first image so styleimagemissing can fire
            if (result && result instanceof ResolvedImage && !result.available) {
                // set to first image
                if (!firstImage) {
                    firstImage = result;
                }
                result = null;
                // if we reach the end, return the first image
                if (argCount === this.args.length) {
                    return firstImage;
                }
            }
            if (result !== null)
                break;
        }
        return result;
    }
    eachChild(fn) {
        this.args.forEach(fn);
    }
    outputDefined() {
        return this.args.every(arg => arg.outputDefined());
    }
    serialize() {
        const serialized = ['coalesce'];
        this.eachChild(child => {
            serialized.push(child.serialize());
        });
        return serialized;
    }
}
var Coalesce$1 = Coalesce;

//
class Let {
    constructor(bindings, result) {
        this.type = result.type;
        this.bindings = [].concat(bindings);
        this.result = result;
    }
    evaluate(ctx) {
        return this.result.evaluate(ctx);
    }
    eachChild(fn) {
        for (const binding of this.bindings) {
            fn(binding[1]);
        }
        fn(this.result);
    }
    static parse(args, context) {
        if (args.length < 4)
            return context.error(`Expected at least 3 arguments, but found ${ args.length - 1 } instead.`);
        const bindings = [];
        for (let i = 1; i < args.length - 1; i += 2) {
            const name = args[i];
            if (typeof name !== 'string') {
                return context.error(`Expected string, but found ${ typeof name } instead.`, i);
            }
            if (/[^a-zA-Z0-9_]/.test(name)) {
                return context.error(`Variable names must contain only alphanumeric characters or '_'.`, i);
            }
            const value = context.parse(args[i + 1], i + 1);
            if (!value)
                return null;
            bindings.push([
                name,
                value
            ]);
        }
        const result = context.parse(args[args.length - 1], args.length - 1, context.expectedType, bindings);
        if (!result)
            return null;
        return new Let(bindings, result);
    }
    outputDefined() {
        return this.result.outputDefined();
    }
    serialize() {
        const serialized = ['let'];
        for (const [name, expr] of this.bindings) {
            serialized.push(name, expr.serialize());
        }
        serialized.push(this.result.serialize());
        return serialized;
    }
}
var Let$1 = Let;

//
class At {
    constructor(type, index, input) {
        this.type = type;
        this.index = index;
        this.input = input;
    }
    static parse(args, context) {
        if (args.length !== 3)
            return context.error(`Expected 2 arguments, but found ${ args.length - 1 } instead.`);
        const index = context.parse(args[1], 1, NumberType);
        const input = context.parse(args[2], 2, array$1(context.expectedType || ValueType));
        if (!index || !input)
            return null;
        const t = input.type;
        return new At(t.itemType, index, input);
    }
    evaluate(ctx) {
        const index = this.index.evaluate(ctx);
        const array = this.input.evaluate(ctx);
        if (index < 0) {
            throw new RuntimeError$1(`Array index out of bounds: ${ index } < 0.`);
        }
        if (index >= array.length) {
            throw new RuntimeError$1(`Array index out of bounds: ${ index } > ${ array.length - 1 }.`);
        }
        if (index !== Math.floor(index)) {
            throw new RuntimeError$1(`Array index must be an integer, but found ${ index } instead.`);
        }
        return array[index];
    }
    eachChild(fn) {
        fn(this.index);
        fn(this.input);
    }
    outputDefined() {
        return false;
    }
    serialize() {
        return [
            'at',
            this.index.serialize(),
            this.input.serialize()
        ];
    }
}
var At$1 = At;

//
class In {
    constructor(needle, haystack) {
        this.type = BooleanType;
        this.needle = needle;
        this.haystack = haystack;
    }
    static parse(args, context) {
        if (args.length !== 3) {
            return context.error(`Expected 2 arguments, but found ${ args.length - 1 } instead.`);
        }
        const needle = context.parse(args[1], 1, ValueType);
        const haystack = context.parse(args[2], 2, ValueType);
        if (!needle || !haystack)
            return null;
        if (!isValidType(needle.type, [
                BooleanType,
                StringType,
                NumberType,
                NullType,
                ValueType
            ])) {
            return context.error(`Expected first argument to be of type boolean, string, number or null, but found ${ toString$1(needle.type) } instead`);
        }
        return new In(needle, haystack);
    }
    evaluate(ctx) {
        const needle = this.needle.evaluate(ctx);
        const haystack = this.haystack.evaluate(ctx);
        if (haystack == null)
            return false;
        if (!isValidNativeType(needle, [
                'boolean',
                'string',
                'number',
                'null'
            ])) {
            throw new RuntimeError$1(`Expected first argument to be of type boolean, string, number or null, but found ${ toString$1(typeOf(needle)) } instead.`);
        }
        if (!isValidNativeType(haystack, [
                'string',
                'array'
            ])) {
            throw new RuntimeError$1(`Expected second argument to be of type array or string, but found ${ toString$1(typeOf(haystack)) } instead.`);
        }
        return haystack.indexOf(needle) >= 0;
    }
    eachChild(fn) {
        fn(this.needle);
        fn(this.haystack);
    }
    outputDefined() {
        return true;
    }
    serialize() {
        return [
            'in',
            this.needle.serialize(),
            this.haystack.serialize()
        ];
    }
}
var In$1 = In;

//
class IndexOf {
    constructor(needle, haystack, fromIndex) {
        this.type = NumberType;
        this.needle = needle;
        this.haystack = haystack;
        this.fromIndex = fromIndex;
    }
    static parse(args, context) {
        if (args.length <= 2 || args.length >= 5) {
            return context.error(`Expected 3 or 4 arguments, but found ${ args.length - 1 } instead.`);
        }
        const needle = context.parse(args[1], 1, ValueType);
        const haystack = context.parse(args[2], 2, ValueType);
        if (!needle || !haystack)
            return null;
        if (!isValidType(needle.type, [
                BooleanType,
                StringType,
                NumberType,
                NullType,
                ValueType
            ])) {
            return context.error(`Expected first argument to be of type boolean, string, number or null, but found ${ toString$1(needle.type) } instead`);
        }
        if (args.length === 4) {
            const fromIndex = context.parse(args[3], 3, NumberType);
            if (!fromIndex)
                return null;
            return new IndexOf(needle, haystack, fromIndex);
        } else {
            return new IndexOf(needle, haystack);
        }
    }
    evaluate(ctx) {
        const needle = this.needle.evaluate(ctx);
        const haystack = this.haystack.evaluate(ctx);
        if (!isValidNativeType(needle, [
                'boolean',
                'string',
                'number',
                'null'
            ])) {
            throw new RuntimeError$1(`Expected first argument to be of type boolean, string, number or null, but found ${ toString$1(typeOf(needle)) } instead.`);
        }
        if (!isValidNativeType(haystack, [
                'string',
                'array'
            ])) {
            throw new RuntimeError$1(`Expected second argument to be of type array or string, but found ${ toString$1(typeOf(haystack)) } instead.`);
        }
        if (this.fromIndex) {
            const fromIndex = this.fromIndex.evaluate(ctx);
            return haystack.indexOf(needle, fromIndex);
        }
        return haystack.indexOf(needle);
    }
    eachChild(fn) {
        fn(this.needle);
        fn(this.haystack);
        if (this.fromIndex) {
            fn(this.fromIndex);
        }
    }
    outputDefined() {
        return false;
    }
    serialize() {
        if (this.fromIndex != null && this.fromIndex !== undefined) {
            const fromIndex = this.fromIndex.serialize();
            return [
                'index-of',
                this.needle.serialize(),
                this.haystack.serialize(),
                fromIndex
            ];
        }
        return [
            'index-of',
            this.needle.serialize(),
            this.haystack.serialize()
        ];
    }
}
var IndexOf$1 = IndexOf;

// Map input label values to output expression index
class Match {
    constructor(inputType, outputType, input, cases, outputs, otherwise) {
        this.inputType = inputType;
        this.type = outputType;
        this.input = input;
        this.cases = cases;
        this.outputs = outputs;
        this.otherwise = otherwise;
    }
    static parse(args, context) {
        if (args.length < 5)
            return context.error(`Expected at least 4 arguments, but found only ${ args.length - 1 }.`);
        if (args.length % 2 !== 1)
            return context.error(`Expected an even number of arguments.`);
        let inputType;
        let outputType;
        if (context.expectedType && context.expectedType.kind !== 'value') {
            outputType = context.expectedType;
        }
        const cases = {};
        const outputs = [];
        for (let i = 2; i < args.length - 1; i += 2) {
            let labels = args[i];
            const value = args[i + 1];
            if (!Array.isArray(labels)) {
                labels = [labels];
            }
            const labelContext = context.concat(i);
            if (labels.length === 0) {
                return labelContext.error('Expected at least one branch label.');
            }
            for (const label of labels) {
                if (typeof label !== 'number' && typeof label !== 'string') {
                    return labelContext.error(`Branch labels must be numbers or strings.`);
                } else if (typeof label === 'number' && Math.abs(label) > Number.MAX_SAFE_INTEGER) {
                    return labelContext.error(`Branch labels must be integers no larger than ${ Number.MAX_SAFE_INTEGER }.`);
                } else if (typeof label === 'number' && Math.floor(label) !== label) {
                    return labelContext.error(`Numeric branch labels must be integer values.`);
                } else if (!inputType) {
                    inputType = typeOf(label);
                } else if (labelContext.checkSubtype(inputType, typeOf(label))) {
                    return null;
                }
                if (typeof cases[String(label)] !== 'undefined') {
                    return labelContext.error('Branch labels must be unique.');
                }
                cases[String(label)] = outputs.length;
            }
            const result = context.parse(value, i, outputType);
            if (!result)
                return null;
            outputType = outputType || result.type;
            outputs.push(result);
        }
        const input = context.parse(args[1], 1, ValueType);
        if (!input)
            return null;
        const otherwise = context.parse(args[args.length - 1], args.length - 1, outputType);
        if (!otherwise)
            return null;
        if (input.type.kind !== 'value' && context.concat(1).checkSubtype(inputType, input.type)) {
            return null;
        }
        return new Match(inputType, outputType, input, cases, outputs, otherwise);
    }
    evaluate(ctx) {
        const input = this.input.evaluate(ctx);
        const output = typeOf(input) === this.inputType && this.outputs[this.cases[input]] || this.otherwise;
        return output.evaluate(ctx);
    }
    eachChild(fn) {
        fn(this.input);
        this.outputs.forEach(fn);
        fn(this.otherwise);
    }
    outputDefined() {
        return this.outputs.every(out => out.outputDefined()) && this.otherwise.outputDefined();
    }
    serialize() {
        const serialized = [
            'match',
            this.input.serialize()
        ];
        // Sort so serialization has an arbitrary defined order, even though
        // branch order doesn't affect evaluation
        const sortedLabels = Object.keys(this.cases).sort();
        // Group branches by unique match expression to support condensed
        // serializations of the form [case1, case2, ...] -> matchExpression
        const groupedByOutput = [];
        const outputLookup = {};
        // lookup index into groupedByOutput for a given output expression
        for (const label of sortedLabels) {
            const outputIndex = outputLookup[this.cases[label]];
            if (outputIndex === undefined) {
                // First time seeing this output, add it to the end of the grouped list
                outputLookup[this.cases[label]] = groupedByOutput.length;
                groupedByOutput.push([
                    this.cases[label],
                    [label]
                ]);
            } else {
                // We've seen this expression before, add the label to that output's group
                groupedByOutput[outputIndex][1].push(label);
            }
        }
        const coerceLabel = label => this.inputType.kind === 'number' ? Number(label) : label;
        for (const [outputIndex, labels] of groupedByOutput) {
            if (labels.length === 1) {
                // Only a single label matches this output expression
                serialized.push(coerceLabel(labels[0]));
            } else {
                // Array of literal labels pointing to this output expression
                serialized.push(labels.map(coerceLabel));
            }
            serialized.push(this.outputs[outputIndex].serialize());
        }
        serialized.push(this.otherwise.serialize());
        return serialized;
    }
}
var Match$1 = Match;

class Case {
    constructor(type, branches, otherwise) {
        this.type = type;
        this.branches = branches;
        this.otherwise = otherwise;
    }
    static parse(args, context) {
        if (args.length < 4)
            return context.error(`Expected at least 3 arguments, but found only ${ args.length - 1 }.`);
        if (args.length % 2 !== 0)
            return context.error(`Expected an odd number of arguments.`);
        let outputType;
        if (context.expectedType && context.expectedType.kind !== 'value') {
            outputType = context.expectedType;
        }
        const branches = [];
        for (let i = 1; i < args.length - 1; i += 2) {
            const test = context.parse(args[i], i, BooleanType);
            if (!test)
                return null;
            const result = context.parse(args[i + 1], i + 1, outputType);
            if (!result)
                return null;
            branches.push([
                test,
                result
            ]);
            outputType = outputType || result.type;
        }
        const otherwise = context.parse(args[args.length - 1], args.length - 1, outputType);
        if (!otherwise)
            return null;
        return new Case(outputType, branches, otherwise);
    }
    evaluate(ctx) {
        for (const [test, expression] of this.branches) {
            if (test.evaluate(ctx)) {
                return expression.evaluate(ctx);
            }
        }
        return this.otherwise.evaluate(ctx);
    }
    eachChild(fn) {
        for (const [test, expression] of this.branches) {
            fn(test);
            fn(expression);
        }
        fn(this.otherwise);
    }
    outputDefined() {
        return this.branches.every(([_, out]) => out.outputDefined()) && this.otherwise.outputDefined();
    }
    serialize() {
        const serialized = ['case'];
        this.eachChild(child => {
            serialized.push(child.serialize());
        });
        return serialized;
    }
}
var Case$1 = Case;

//
class Slice {
    constructor(type, input, beginIndex, endIndex) {
        this.type = type;
        this.input = input;
        this.beginIndex = beginIndex;
        this.endIndex = endIndex;
    }
    static parse(args, context) {
        if (args.length <= 2 || args.length >= 5) {
            return context.error(`Expected 3 or 4 arguments, but found ${ args.length - 1 } instead.`);
        }
        const input = context.parse(args[1], 1, ValueType);
        const beginIndex = context.parse(args[2], 2, NumberType);
        if (!input || !beginIndex)
            return null;
        if (!isValidType(input.type, [
                array$1(ValueType),
                StringType,
                ValueType
            ])) {
            return context.error(`Expected first argument to be of type array or string, but found ${ toString$1(input.type) } instead`);
        }
        if (args.length === 4) {
            const endIndex = context.parse(args[3], 3, NumberType);
            if (!endIndex)
                return null;
            return new Slice(input.type, input, beginIndex, endIndex);
        } else {
            return new Slice(input.type, input, beginIndex);
        }
    }
    evaluate(ctx) {
        const input = this.input.evaluate(ctx);
        const beginIndex = this.beginIndex.evaluate(ctx);
        if (!isValidNativeType(input, [
                'string',
                'array'
            ])) {
            throw new RuntimeError$1(`Expected first argument to be of type array or string, but found ${ toString$1(typeOf(input)) } instead.`);
        }
        if (this.endIndex) {
            const endIndex = this.endIndex.evaluate(ctx);
            return input.slice(beginIndex, endIndex);
        }
        return input.slice(beginIndex);
    }
    eachChild(fn) {
        fn(this.input);
        fn(this.beginIndex);
        if (this.endIndex) {
            fn(this.endIndex);
        }
    }
    outputDefined() {
        return false;
    }
    serialize() {
        if (this.endIndex != null && this.endIndex !== undefined) {
            const endIndex = this.endIndex.serialize();
            return [
                'slice',
                this.input.serialize(),
                this.beginIndex.serialize(),
                endIndex
            ];
        }
        return [
            'slice',
            this.input.serialize(),
            this.beginIndex.serialize()
        ];
    }
}
var Slice$1 = Slice;

//
function isComparableType(op, type) {
    if (op === '==' || op === '!=') {
        // equality operator
        return type.kind === 'boolean' || type.kind === 'string' || type.kind === 'number' || type.kind === 'null' || type.kind === 'value';
    } else {
        // ordering operator
        return type.kind === 'string' || type.kind === 'number' || type.kind === 'value';
    }
}
function eq(ctx, a, b) {
    return a === b;
}
function neq(ctx, a, b) {
    return a !== b;
}
function lt(ctx, a, b) {
    return a < b;
}
function gt(ctx, a, b) {
    return a > b;
}
function lteq(ctx, a, b) {
    return a <= b;
}
function gteq(ctx, a, b) {
    return a >= b;
}
function eqCollate(ctx, a, b, c) {
    return c.compare(a, b) === 0;
}
function neqCollate(ctx, a, b, c) {
    return !eqCollate(ctx, a, b, c);
}
function ltCollate(ctx, a, b, c) {
    return c.compare(a, b) < 0;
}
function gtCollate(ctx, a, b, c) {
    return c.compare(a, b) > 0;
}
function lteqCollate(ctx, a, b, c) {
    return c.compare(a, b) <= 0;
}
function gteqCollate(ctx, a, b, c) {
    return c.compare(a, b) >= 0;
}
/**
 * Special form for comparison operators, implementing the signatures:
 * - (T, T, ?Collator) => boolean
 * - (T, value, ?Collator) => boolean
 * - (value, T, ?Collator) => boolean
 *
 * For inequalities, T must be either value, string, or number. For ==/!=, it
 * can also be boolean or null.
 *
 * Equality semantics are equivalent to Javascript's strict equality (===/!==)
 * -- i.e., when the arguments' types don't match, == evaluates to false, != to
 * true.
 *
 * When types don't match in an ordering comparison, a runtime error is thrown.
 *
 * @private
 */
function makeComparison(op, compareBasic, compareWithCollator) {
    const isOrderComparison = op !== '==' && op !== '!=';
    return class Comparison {
        constructor(lhs, rhs, collator) {
            this.type = BooleanType;
            this.lhs = lhs;
            this.rhs = rhs;
            this.collator = collator;
            this.hasUntypedArgument = lhs.type.kind === 'value' || rhs.type.kind === 'value';
        }
        static parse(args, context) {
            if (args.length !== 3 && args.length !== 4)
                return context.error(`Expected two or three arguments.`);
            const op = args[0];
            let lhs = context.parse(args[1], 1, ValueType);
            if (!lhs)
                return null;
            if (!isComparableType(op, lhs.type)) {
                return context.concat(1).error(`"${ op }" comparisons are not supported for type '${ toString$1(lhs.type) }'.`);
            }
            let rhs = context.parse(args[2], 2, ValueType);
            if (!rhs)
                return null;
            if (!isComparableType(op, rhs.type)) {
                return context.concat(2).error(`"${ op }" comparisons are not supported for type '${ toString$1(rhs.type) }'.`);
            }
            if (lhs.type.kind !== rhs.type.kind && lhs.type.kind !== 'value' && rhs.type.kind !== 'value') {
                return context.error(`Cannot compare types '${ toString$1(lhs.type) }' and '${ toString$1(rhs.type) }'.`);
            }
            if (isOrderComparison) {
                // typing rules specific to less/greater than operators
                if (lhs.type.kind === 'value' && rhs.type.kind !== 'value') {
                    // (value, T)
                    lhs = new Assertion$1(rhs.type, [lhs]);
                } else if (lhs.type.kind !== 'value' && rhs.type.kind === 'value') {
                    // (T, value)
                    rhs = new Assertion$1(lhs.type, [rhs]);
                }
            }
            let collator = null;
            if (args.length === 4) {
                if (lhs.type.kind !== 'string' && rhs.type.kind !== 'string' && lhs.type.kind !== 'value' && rhs.type.kind !== 'value') {
                    return context.error(`Cannot use collator to compare non-string types.`);
                }
                collator = context.parse(args[3], 3, CollatorType);
                if (!collator)
                    return null;
            }
            return new Comparison(lhs, rhs, collator);
        }
        evaluate(ctx) {
            const lhs = this.lhs.evaluate(ctx);
            const rhs = this.rhs.evaluate(ctx);
            if (isOrderComparison && this.hasUntypedArgument) {
                const lt = typeOf(lhs);
                const rt = typeOf(rhs);
                // check that type is string or number, and equal
                if (lt.kind !== rt.kind || !(lt.kind === 'string' || lt.kind === 'number')) {
                    throw new RuntimeError$1(`Expected arguments for "${ op }" to be (string, string) or (number, number), but found (${ lt.kind }, ${ rt.kind }) instead.`);
                }
            }
            if (this.collator && !isOrderComparison && this.hasUntypedArgument) {
                const lt = typeOf(lhs);
                const rt = typeOf(rhs);
                if (lt.kind !== 'string' || rt.kind !== 'string') {
                    return compareBasic(ctx, lhs, rhs);
                }
            }
            return this.collator ? compareWithCollator(ctx, lhs, rhs, this.collator.evaluate(ctx)) : compareBasic(ctx, lhs, rhs);
        }
        eachChild(fn) {
            fn(this.lhs);
            fn(this.rhs);
            if (this.collator) {
                fn(this.collator);
            }
        }
        outputDefined() {
            return true;
        }
        serialize() {
            const serialized = [op];
            this.eachChild(child => {
                serialized.push(child.serialize());
            });
            return serialized;
        }
    };
}
const Equals = makeComparison('==', eq, eqCollate);
const NotEquals = makeComparison('!=', neq, neqCollate);
const LessThan = makeComparison('<', lt, ltCollate);
const GreaterThan = makeComparison('>', gt, gtCollate);
const LessThanOrEqual = makeComparison('<=', lteq, lteqCollate);
const GreaterThanOrEqual = makeComparison('>=', gteq, gteqCollate);

//
class NumberFormat {
    // BCP 47 language tag
    // ISO 4217 currency code, required if style=currency
    // Simple units sanctioned for use in ECMAScript, required if style=unit. https://tc39.es/proposal-unified-intl-numberformat/section6/locales-currencies-tz_proposed_out.html#sec-issanctionedsimpleunitidentifier
    // Default 0
    // Default 3
    constructor(number, locale, currency, unit, minFractionDigits, maxFractionDigits) {
        this.type = StringType;
        this.number = number;
        this.locale = locale;
        this.currency = currency;
        this.unit = unit;
        this.minFractionDigits = minFractionDigits;
        this.maxFractionDigits = maxFractionDigits;
    }
    static parse(args, context) {
        if (args.length !== 3)
            return context.error(`Expected two arguments.`);
        const number = context.parse(args[1], 1, NumberType);
        if (!number)
            return null;
        const options = args[2];
        if (typeof options !== 'object' || Array.isArray(options))
            return context.error(`NumberFormat options argument must be an object.`);
        let locale = null;
        if (options['locale']) {
            locale = context.parse(options['locale'], 1, StringType);
            if (!locale)
                return null;
        }
        let currency = null;
        if (options['currency']) {
            currency = context.parse(options['currency'], 1, StringType);
            if (!currency)
                return null;
        }
        let unit = null;
        if (options['unit']) {
            unit = context.parse(options['unit'], 1, StringType);
            if (!unit)
                return null;
        }
        let minFractionDigits = null;
        if (options['min-fraction-digits']) {
            minFractionDigits = context.parse(options['min-fraction-digits'], 1, NumberType);
            if (!minFractionDigits)
                return null;
        }
        let maxFractionDigits = null;
        if (options['max-fraction-digits']) {
            maxFractionDigits = context.parse(options['max-fraction-digits'], 1, NumberType);
            if (!maxFractionDigits)
                return null;
        }
        return new NumberFormat(number, locale, currency, unit, minFractionDigits, maxFractionDigits);
    }
    evaluate(ctx) {
        return new Intl.NumberFormat(this.locale ? this.locale.evaluate(ctx) : [], {
            style: this.currency && 'currency' || this.unit && 'unit' || 'decimal',
            currency: this.currency ? this.currency.evaluate(ctx) : undefined,
            unit: this.unit ? this.unit.evaluate(ctx) : undefined,
            minimumFractionDigits: this.minFractionDigits ? this.minFractionDigits.evaluate(ctx) : undefined,
            maximumFractionDigits: this.maxFractionDigits ? this.maxFractionDigits.evaluate(ctx) : undefined
        }).format(this.number.evaluate(ctx));
    }
    eachChild(fn) {
        fn(this.number);
        if (this.locale) {
            fn(this.locale);
        }
        if (this.currency) {
            fn(this.currency);
        }
        if (this.unit) {
            fn(this.unit);
        }
        if (this.minFractionDigits) {
            fn(this.minFractionDigits);
        }
        if (this.maxFractionDigits) {
            fn(this.maxFractionDigits);
        }
    }
    outputDefined() {
        return false;
    }
    serialize() {
        const options = {};
        if (this.locale) {
            options['locale'] = this.locale.serialize();
        }
        if (this.currency) {
            options['currency'] = this.currency.serialize();
        }
        if (this.unit) {
            options['unit'] = this.unit.serialize();
        }
        if (this.minFractionDigits) {
            options['min-fraction-digits'] = this.minFractionDigits.serialize();
        }
        if (this.maxFractionDigits) {
            options['max-fraction-digits'] = this.maxFractionDigits.serialize();
        }
        return [
            'number-format',
            this.number.serialize(),
            options
        ];
    }
}

//
class Length {
    constructor(input) {
        this.type = NumberType;
        this.input = input;
    }
    static parse(args, context) {
        if (args.length !== 2)
            return context.error(`Expected 1 argument, but found ${ args.length - 1 } instead.`);
        const input = context.parse(args[1], 1);
        if (!input)
            return null;
        if (input.type.kind !== 'array' && input.type.kind !== 'string' && input.type.kind !== 'value')
            return context.error(`Expected argument of type string or array, but found ${ toString$1(input.type) } instead.`);
        return new Length(input);
    }
    evaluate(ctx) {
        const input = this.input.evaluate(ctx);
        if (typeof input === 'string') {
            return input.length;
        } else if (Array.isArray(input)) {
            return input.length;
        } else {
            throw new RuntimeError$1(`Expected value to be of type string or array, but found ${ toString$1(typeOf(input)) } instead.`);
        }
    }
    eachChild(fn) {
        fn(this.input);
    }
    outputDefined() {
        return false;
    }
    serialize() {
        const serialized = ['length'];
        this.eachChild(child => {
            serialized.push(child.serialize());
        });
        return serialized;
    }
}
var Length$1 = Length;

//
const expressions = {
    // special forms
    '==': Equals,
    '!=': NotEquals,
    '>': GreaterThan,
    '<': LessThan,
    '>=': GreaterThanOrEqual,
    '<=': LessThanOrEqual,
    'array': Assertion$1,
    'at': At$1,
    'boolean': Assertion$1,
    'case': Case$1,
    'coalesce': Coalesce$1,
    'collator': CollatorExpression,
    'format': FormatExpression,
    'image': ImageExpression,
    'in': In$1,
    'index-of': IndexOf$1,
    'interpolate': Interpolate$1,
    'interpolate-hcl': Interpolate$1,
    'interpolate-lab': Interpolate$1,
    'length': Length$1,
    'let': Let$1,
    'literal': Literal$1,
    'match': Match$1,
    'number': Assertion$1,
    'number-format': NumberFormat,
    'object': Assertion$1,
    'slice': Slice$1,
    'step': Step$1,
    'string': Assertion$1,
    'to-boolean': Coercion$1,
    'to-color': Coercion$1,
    'to-number': Coercion$1,
    'to-string': Coercion$1,
    'var': Var$1,
    'within': Within$1
};
function rgba(ctx, [r, g, b, a]) {
    r = r.evaluate(ctx);
    g = g.evaluate(ctx);
    b = b.evaluate(ctx);
    const alpha = a ? a.evaluate(ctx) : 1;
    const error = validateRGBA(r, g, b, alpha);
    if (error)
        throw new RuntimeError$1(error);
    return new Color$1(r / 255 * alpha, g / 255 * alpha, b / 255 * alpha, alpha);
}
function has(key, obj) {
    return key in obj;
}
function get(key, obj) {
    const v = obj[key];
    return typeof v === 'undefined' ? null : v;
}
function binarySearch(v, a, i, j) {
    while (i <= j) {
        const m = i + j >> 1;
        if (a[m] === v)
            return true;
        if (a[m] > v)
            j = m - 1;
        else
            i = m + 1;
    }
    return false;
}
function varargs(type) {
    return { type };
}
CompoundExpression$1.register(expressions, {
    'error': [
        ErrorType,
        [StringType],
        (ctx, [v]) => {
            throw new RuntimeError$1(v.evaluate(ctx));
        }
    ],
    'typeof': [
        StringType,
        [ValueType],
        (ctx, [v]) => toString$1(typeOf(v.evaluate(ctx)))
    ],
    'to-rgba': [
        array$1(NumberType, 4),
        [ColorType],
        (ctx, [v]) => {
            return v.evaluate(ctx).toArray();
        }
    ],
    'rgb': [
        ColorType,
        [
            NumberType,
            NumberType,
            NumberType
        ],
        rgba
    ],
    'rgba': [
        ColorType,
        [
            NumberType,
            NumberType,
            NumberType,
            NumberType
        ],
        rgba
    ],
    'has': {
        type: BooleanType,
        overloads: [
            [
                [StringType],
                (ctx, [key]) => has(key.evaluate(ctx), ctx.properties())
            ],
            [
                [
                    StringType,
                    ObjectType
                ],
                (ctx, [key, obj]) => has(key.evaluate(ctx), obj.evaluate(ctx))
            ]
        ]
    },
    'get': {
        type: ValueType,
        overloads: [
            [
                [StringType],
                (ctx, [key]) => get(key.evaluate(ctx), ctx.properties())
            ],
            [
                [
                    StringType,
                    ObjectType
                ],
                (ctx, [key, obj]) => get(key.evaluate(ctx), obj.evaluate(ctx))
            ]
        ]
    },
    'feature-state': [
        ValueType,
        [StringType],
        (ctx, [key]) => get(key.evaluate(ctx), ctx.featureState || {})
    ],
    'properties': [
        ObjectType,
        [],
        ctx => ctx.properties()
    ],
    'geometry-type': [
        StringType,
        [],
        ctx => ctx.geometryType()
    ],
    'id': [
        ValueType,
        [],
        ctx => ctx.id()
    ],
    'zoom': [
        NumberType,
        [],
        ctx => ctx.globals.zoom
    ],
    'pitch': [
        NumberType,
        [],
        ctx => ctx.globals.pitch || 0
    ],
    'distance-from-center': [
        NumberType,
        [],
        ctx => ctx.distanceFromCenter()
    ],
    'heatmap-density': [
        NumberType,
        [],
        ctx => ctx.globals.heatmapDensity || 0
    ],
    'line-progress': [
        NumberType,
        [],
        ctx => ctx.globals.lineProgress || 0
    ],
    'sky-radial-progress': [
        NumberType,
        [],
        ctx => ctx.globals.skyRadialProgress || 0
    ],
    'accumulated': [
        ValueType,
        [],
        ctx => ctx.globals.accumulated === undefined ? null : ctx.globals.accumulated
    ],
    '+': [
        NumberType,
        varargs(NumberType),
        (ctx, args) => {
            let result = 0;
            for (const arg of args) {
                result += arg.evaluate(ctx);
            }
            return result;
        }
    ],
    '*': [
        NumberType,
        varargs(NumberType),
        (ctx, args) => {
            let result = 1;
            for (const arg of args) {
                result *= arg.evaluate(ctx);
            }
            return result;
        }
    ],
    '-': {
        type: NumberType,
        overloads: [
            [
                [
                    NumberType,
                    NumberType
                ],
                (ctx, [a, b]) => a.evaluate(ctx) - b.evaluate(ctx)
            ],
            [
                [NumberType],
                (ctx, [a]) => -a.evaluate(ctx)
            ]
        ]
    },
    '/': [
        NumberType,
        [
            NumberType,
            NumberType
        ],
        (ctx, [a, b]) => a.evaluate(ctx) / b.evaluate(ctx)
    ],
    '%': [
        NumberType,
        [
            NumberType,
            NumberType
        ],
        (ctx, [a, b]) => a.evaluate(ctx) % b.evaluate(ctx)
    ],
    'ln2': [
        NumberType,
        [],
        () => Math.LN2
    ],
    'pi': [
        NumberType,
        [],
        () => Math.PI
    ],
    'e': [
        NumberType,
        [],
        () => Math.E
    ],
    '^': [
        NumberType,
        [
            NumberType,
            NumberType
        ],
        (ctx, [b, e]) => Math.pow(b.evaluate(ctx), e.evaluate(ctx))
    ],
    'sqrt': [
        NumberType,
        [NumberType],
        (ctx, [x]) => Math.sqrt(x.evaluate(ctx))
    ],
    'log10': [
        NumberType,
        [NumberType],
        (ctx, [n]) => Math.log(n.evaluate(ctx)) / Math.LN10
    ],
    'ln': [
        NumberType,
        [NumberType],
        (ctx, [n]) => Math.log(n.evaluate(ctx))
    ],
    'log2': [
        NumberType,
        [NumberType],
        (ctx, [n]) => Math.log(n.evaluate(ctx)) / Math.LN2
    ],
    'sin': [
        NumberType,
        [NumberType],
        (ctx, [n]) => Math.sin(n.evaluate(ctx))
    ],
    'cos': [
        NumberType,
        [NumberType],
        (ctx, [n]) => Math.cos(n.evaluate(ctx))
    ],
    'tan': [
        NumberType,
        [NumberType],
        (ctx, [n]) => Math.tan(n.evaluate(ctx))
    ],
    'asin': [
        NumberType,
        [NumberType],
        (ctx, [n]) => Math.asin(n.evaluate(ctx))
    ],
    'acos': [
        NumberType,
        [NumberType],
        (ctx, [n]) => Math.acos(n.evaluate(ctx))
    ],
    'atan': [
        NumberType,
        [NumberType],
        (ctx, [n]) => Math.atan(n.evaluate(ctx))
    ],
    'min': [
        NumberType,
        varargs(NumberType),
        (ctx, args) => Math.min(...args.map(arg => arg.evaluate(ctx)))
    ],
    'max': [
        NumberType,
        varargs(NumberType),
        (ctx, args) => Math.max(...args.map(arg => arg.evaluate(ctx)))
    ],
    'abs': [
        NumberType,
        [NumberType],
        (ctx, [n]) => Math.abs(n.evaluate(ctx))
    ],
    'round': [
        NumberType,
        [NumberType],
        (ctx, [n]) => {
            const v = n.evaluate(ctx);
            // Javascript's Math.round() rounds towards +Infinity for halfway
            // values, even when they're negative. It's more common to round
            // away from 0 (e.g., this is what python and C++ do)
            return v < 0 ? -Math.round(-v) : Math.round(v);
        }
    ],
    'floor': [
        NumberType,
        [NumberType],
        (ctx, [n]) => Math.floor(n.evaluate(ctx))
    ],
    'ceil': [
        NumberType,
        [NumberType],
        (ctx, [n]) => Math.ceil(n.evaluate(ctx))
    ],
    'filter-==': [
        BooleanType,
        [
            StringType,
            ValueType
        ],
        (ctx, [k, v]) => ctx.properties()[k.value] === v.value
    ],
    'filter-id-==': [
        BooleanType,
        [ValueType],
        (ctx, [v]) => ctx.id() === v.value
    ],
    'filter-type-==': [
        BooleanType,
        [StringType],
        (ctx, [v]) => ctx.geometryType() === v.value
    ],
    'filter-<': [
        BooleanType,
        [
            StringType,
            ValueType
        ],
        (ctx, [k, v]) => {
            const a = ctx.properties()[k.value];
            const b = v.value;
            return typeof a === typeof b && a < b;
        }
    ],
    'filter-id-<': [
        BooleanType,
        [ValueType],
        (ctx, [v]) => {
            const a = ctx.id();
            const b = v.value;
            return typeof a === typeof b && a < b;
        }
    ],
    'filter->': [
        BooleanType,
        [
            StringType,
            ValueType
        ],
        (ctx, [k, v]) => {
            const a = ctx.properties()[k.value];
            const b = v.value;
            return typeof a === typeof b && a > b;
        }
    ],
    'filter-id->': [
        BooleanType,
        [ValueType],
        (ctx, [v]) => {
            const a = ctx.id();
            const b = v.value;
            return typeof a === typeof b && a > b;
        }
    ],
    'filter-<=': [
        BooleanType,
        [
            StringType,
            ValueType
        ],
        (ctx, [k, v]) => {
            const a = ctx.properties()[k.value];
            const b = v.value;
            return typeof a === typeof b && a <= b;
        }
    ],
    'filter-id-<=': [
        BooleanType,
        [ValueType],
        (ctx, [v]) => {
            const a = ctx.id();
            const b = v.value;
            return typeof a === typeof b && a <= b;
        }
    ],
    'filter->=': [
        BooleanType,
        [
            StringType,
            ValueType
        ],
        (ctx, [k, v]) => {
            const a = ctx.properties()[k.value];
            const b = v.value;
            return typeof a === typeof b && a >= b;
        }
    ],
    'filter-id->=': [
        BooleanType,
        [ValueType],
        (ctx, [v]) => {
            const a = ctx.id();
            const b = v.value;
            return typeof a === typeof b && a >= b;
        }
    ],
    'filter-has': [
        BooleanType,
        [ValueType],
        (ctx, [k]) => k.value in ctx.properties()
    ],
    'filter-has-id': [
        BooleanType,
        [],
        ctx => ctx.id() !== null && ctx.id() !== undefined
    ],
    'filter-type-in': [
        BooleanType,
        [array$1(StringType)],
        (ctx, [v]) => v.value.indexOf(ctx.geometryType()) >= 0
    ],
    'filter-id-in': [
        BooleanType,
        [array$1(ValueType)],
        (ctx, [v]) => v.value.indexOf(ctx.id()) >= 0
    ],
    'filter-in-small': [
        BooleanType,
        [
            StringType,
            array$1(ValueType)
        ],
        // assumes v is an array literal
        (ctx, [k, v]) => v.value.indexOf(ctx.properties()[k.value]) >= 0
    ],
    'filter-in-large': [
        BooleanType,
        [
            StringType,
            array$1(ValueType)
        ],
        // assumes v is a array literal with values sorted in ascending order and of a single type
        (ctx, [k, v]) => binarySearch(ctx.properties()[k.value], v.value, 0, v.value.length - 1)
    ],
    'all': {
        type: BooleanType,
        overloads: [
            [
                [
                    BooleanType,
                    BooleanType
                ],
                (ctx, [a, b]) => a.evaluate(ctx) && b.evaluate(ctx)
            ],
            [
                varargs(BooleanType),
                (ctx, args) => {
                    for (const arg of args) {
                        if (!arg.evaluate(ctx))
                            return false;
                    }
                    return true;
                }
            ]
        ]
    },
    'any': {
        type: BooleanType,
        overloads: [
            [
                [
                    BooleanType,
                    BooleanType
                ],
                (ctx, [a, b]) => a.evaluate(ctx) || b.evaluate(ctx)
            ],
            [
                varargs(BooleanType),
                (ctx, args) => {
                    for (const arg of args) {
                        if (arg.evaluate(ctx))
                            return true;
                    }
                    return false;
                }
            ]
        ]
    },
    '!': [
        BooleanType,
        [BooleanType],
        (ctx, [b]) => !b.evaluate(ctx)
    ],
    'is-supported-script': [
        BooleanType,
        [StringType],
        // At parse time this will always return true, so we need to exclude this expression with isGlobalPropertyConstant
        (ctx, [s]) => {
            const isSupportedScript = ctx.globals && ctx.globals.isSupportedScript;
            if (isSupportedScript) {
                return isSupportedScript(s.evaluate(ctx));
            }
            return true;
        }
    ],
    'upcase': [
        StringType,
        [StringType],
        (ctx, [s]) => s.evaluate(ctx).toUpperCase()
    ],
    'downcase': [
        StringType,
        [StringType],
        (ctx, [s]) => s.evaluate(ctx).toLowerCase()
    ],
    'concat': [
        StringType,
        varargs(ValueType),
        (ctx, args) => args.map(arg => toString(arg.evaluate(ctx))).join('')
    ],
    'resolved-locale': [
        StringType,
        [CollatorType],
        (ctx, [collator]) => collator.evaluate(ctx).resolvedLocale()
    ]
});
var definitions = expressions;

//
/**
 * A type used for returning and propagating errors. The first element of the union
 * represents success and contains a value, and the second represents an error and
 * contains an error value.
 * @private
 */
function success(value) {
    return {
        result: 'success',
        value
    };
}
function error(value) {
    return {
        result: 'error',
        value
    };
}

//
function supportsPropertyExpression(spec) {
    return spec['property-type'] === 'data-driven';
}
function supportsZoomExpression(spec) {
    return !!spec.expression && spec.expression.parameters.indexOf('zoom') > -1;
}
function supportsInterpolation(spec) {
    return !!spec.expression && spec.expression.interpolated;
}

//
function getType(val) {
    if (val instanceof Number) {
        return 'number';
    } else if (val instanceof String) {
        return 'string';
    } else if (val instanceof Boolean) {
        return 'boolean';
    } else if (Array.isArray(val)) {
        return 'array';
    } else if (val === null) {
        return 'null';
    } else {
        return typeof val;
    }
}

function isFunction(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function identityFunction(x) {
    return x;
}
function createFunction(parameters, propertySpec) {
    const isColor = propertySpec.type === 'color';
    const zoomAndFeatureDependent = parameters.stops && typeof parameters.stops[0][0] === 'object';
    const featureDependent = zoomAndFeatureDependent || parameters.property !== undefined;
    const zoomDependent = zoomAndFeatureDependent || !featureDependent;
    const type = parameters.type || (supportsInterpolation(propertySpec) ? 'exponential' : 'interval');
    if (isColor) {
        parameters = extend({}, parameters);
        if (parameters.stops) {
            parameters.stops = parameters.stops.map(stop => {
                return [
                    stop[0],
                    Color$1.parse(stop[1])
                ];
            });
        }
        if (parameters.default) {
            parameters.default = Color$1.parse(parameters.default);
        } else {
            parameters.default = Color$1.parse(propertySpec.default);
        }
    }
    if (parameters.colorSpace && parameters.colorSpace !== 'rgb' && !colorSpaces[parameters.colorSpace]) {
        // eslint-disable-line import/namespace
        throw new Error(`Unknown color space: ${ parameters.colorSpace }`);
    }
    let innerFun;
    let hashedStops;
    let categoricalKeyType;
    if (type === 'exponential') {
        innerFun = evaluateExponentialFunction;
    } else if (type === 'interval') {
        innerFun = evaluateIntervalFunction;
    } else if (type === 'categorical') {
        innerFun = evaluateCategoricalFunction;
        // For categorical functions, generate an Object as a hashmap of the stops for fast searching
        hashedStops = Object.create(null);
        for (const stop of parameters.stops) {
            hashedStops[stop[0]] = stop[1];
        }
        // Infer key type based on first stop key-- used to encforce strict type checking later
        categoricalKeyType = typeof parameters.stops[0][0];
    } else if (type === 'identity') {
        innerFun = evaluateIdentityFunction;
    } else {
        throw new Error(`Unknown function type "${ type }"`);
    }
    if (zoomAndFeatureDependent) {
        const featureFunctions = {};
        const zoomStops = [];
        for (let s = 0; s < parameters.stops.length; s++) {
            const stop = parameters.stops[s];
            const zoom = stop[0].zoom;
            if (featureFunctions[zoom] === undefined) {
                featureFunctions[zoom] = {
                    zoom,
                    type: parameters.type,
                    property: parameters.property,
                    default: parameters.default,
                    stops: []
                };
                zoomStops.push(zoom);
            }
            featureFunctions[zoom].stops.push([
                stop[0].value,
                stop[1]
            ]);
        }
        const featureFunctionStops = [];
        for (const z of zoomStops) {
            featureFunctionStops.push([
                featureFunctions[z].zoom,
                createFunction(featureFunctions[z], propertySpec)
            ]);
        }
        const interpolationType = { name: 'linear' };
        return {
            kind: 'composite',
            interpolationType,
            interpolationFactor: Interpolate$1.interpolationFactor.bind(undefined, interpolationType),
            zoomStops: featureFunctionStops.map(s => s[0]),
            evaluate({zoom}, properties) {
                return evaluateExponentialFunction({
                    stops: featureFunctionStops,
                    base: parameters.base
                }, propertySpec, zoom).evaluate(zoom, properties);
            }
        };
    } else if (zoomDependent) {
        const interpolationType = type === 'exponential' ? {
            name: 'exponential',
            base: parameters.base !== undefined ? parameters.base : 1
        } : null;
        return {
            kind: 'camera',
            interpolationType,
            interpolationFactor: Interpolate$1.interpolationFactor.bind(undefined, interpolationType),
            zoomStops: parameters.stops.map(s => s[0]),
            evaluate: ({zoom}) => innerFun(parameters, propertySpec, zoom, hashedStops, categoricalKeyType)
        };
    } else {
        return {
            kind: 'source',
            evaluate(_, feature) {
                const value = feature && feature.properties ? feature.properties[parameters.property] : undefined;
                if (value === undefined) {
                    return coalesce$1(parameters.default, propertySpec.default);
                }
                return innerFun(parameters, propertySpec, value, hashedStops, categoricalKeyType);
            }
        };
    }
}
function coalesce$1(a, b, c) {
    if (a !== undefined)
        return a;
    if (b !== undefined)
        return b;
    if (c !== undefined)
        return c;
}
function evaluateCategoricalFunction(parameters, propertySpec, input, hashedStops, keyType) {
    const evaluated = typeof input === keyType ? hashedStops[input] : undefined;
    // Enforce strict typing on input
    return coalesce$1(evaluated, parameters.default, propertySpec.default);
}
function evaluateIntervalFunction(parameters, propertySpec, input) {
    // Edge cases
    if (getType(input) !== 'number')
        return coalesce$1(parameters.default, propertySpec.default);
    const n = parameters.stops.length;
    if (n === 1)
        return parameters.stops[0][1];
    if (input <= parameters.stops[0][0])
        return parameters.stops[0][1];
    if (input >= parameters.stops[n - 1][0])
        return parameters.stops[n - 1][1];
    const index = findStopLessThanOrEqualTo(parameters.stops.map(stop => stop[0]), input);
    return parameters.stops[index][1];
}
function evaluateExponentialFunction(parameters, propertySpec, input) {
    const base = parameters.base !== undefined ? parameters.base : 1;
    // Edge cases
    if (getType(input) !== 'number')
        return coalesce$1(parameters.default, propertySpec.default);
    const n = parameters.stops.length;
    if (n === 1)
        return parameters.stops[0][1];
    if (input <= parameters.stops[0][0])
        return parameters.stops[0][1];
    if (input >= parameters.stops[n - 1][0])
        return parameters.stops[n - 1][1];
    const index = findStopLessThanOrEqualTo(parameters.stops.map(stop => stop[0]), input);
    const t = interpolationFactor(input, base, parameters.stops[index][0], parameters.stops[index + 1][0]);
    const outputLower = parameters.stops[index][1];
    const outputUpper = parameters.stops[index + 1][1];
    let interp = interpolate[propertySpec.type] || identityFunction;
    // eslint-disable-line import/namespace
    if (parameters.colorSpace && parameters.colorSpace !== 'rgb') {
        const colorspace = colorSpaces[parameters.colorSpace];
        // eslint-disable-line import/namespace
        interp = (a, b) => colorspace.reverse(colorspace.interpolate(colorspace.forward(a), colorspace.forward(b), t));
    }
    if (typeof outputLower.evaluate === 'function') {
        return {
            evaluate(...args) {
                const evaluatedLower = outputLower.evaluate.apply(undefined, args);
                const evaluatedUpper = outputUpper.evaluate.apply(undefined, args);
                // Special case for fill-outline-color, which has no spec default.
                if (evaluatedLower === undefined || evaluatedUpper === undefined) {
                    return undefined;
                }
                return interp(evaluatedLower, evaluatedUpper, t);
            }
        };
    }
    return interp(outputLower, outputUpper, t);
}
function evaluateIdentityFunction(parameters, propertySpec, input) {
    if (propertySpec.type === 'color') {
        input = Color$1.parse(input);
    } else if (propertySpec.type === 'formatted') {
        input = Formatted.fromString(input.toString());
    } else if (propertySpec.type === 'resolvedImage') {
        input = ResolvedImage.fromString(input.toString());
    } else if (getType(input) !== propertySpec.type && (propertySpec.type !== 'enum' || !propertySpec.values[input])) {
        input = undefined;
    }
    return coalesce$1(input, parameters.default, propertySpec.default);
}
/**
 * Returns a ratio that can be used to interpolate between exponential function
 * stops.
 *
 * How it works:
 * Two consecutive stop values define a (scaled and shifted) exponential
 * function `f(x) = a * base^x + b`, where `base` is the user-specified base,
 * and `a` and `b` are constants affording sufficient degrees of freedom to fit
 * the function to the given stops.
 *
 * Here's a bit of algebra that lets us compute `f(x)` directly from the stop
 * values without explicitly solving for `a` and `b`:
 *
 * First stop value: `f(x0) = y0 = a * base^x0 + b`
 * Second stop value: `f(x1) = y1 = a * base^x1 + b`
 * => `y1 - y0 = a(base^x1 - base^x0)`
 * => `a = (y1 - y0)/(base^x1 - base^x0)`
 *
 * Desired value: `f(x) = y = a * base^x + b`
 * => `f(x) = y0 + a * (base^x - base^x0)`
 *
 * From the above, we can replace the `a` in `a * (base^x - base^x0)` and do a
 * little algebra:
 * ```
 * a * (base^x - base^x0) = (y1 - y0)/(base^x1 - base^x0) * (base^x - base^x0)
 *                     = (y1 - y0) * (base^x - base^x0) / (base^x1 - base^x0)
 * ```
 *
 * If we let `(base^x - base^x0) / (base^x1 base^x0)`, then we have
 * `f(x) = y0 + (y1 - y0) * ratio`.  In other words, `ratio` may be treated as
 * an interpolation factor between the two stops' output values.
 *
 * (Note: a slightly different form for `ratio`,
 * `(base^(x-x0) - 1) / (base^(x1-x0) - 1) `, is equivalent, but requires fewer
 * expensive `Math.pow()` operations.)
 *
 * @private
 */
function interpolationFactor(input, base, lowerValue, upperValue) {
    const difference = upperValue - lowerValue;
    const progress = input - lowerValue;
    if (difference === 0) {
        return 0;
    } else if (base === 1) {
        return progress / difference;
    } else {
        return (Math.pow(base, progress) - 1) / (Math.pow(base, difference) - 1);
    }
}

class StyleExpression {
    constructor(expression, propertySpec) {
        this.expression = expression;
        this._warningHistory = {};
        this._evaluator = new EvaluationContext$1();
        this._defaultValue = propertySpec ? getDefaultValue(propertySpec) : null;
        this._enumValues = propertySpec && propertySpec.type === 'enum' ? propertySpec.values : null;
    }
    evaluateWithoutErrorHandling(globals, feature, featureState, canonical, availableImages, formattedSection, featureTileCoord, featureDistanceData) {
        this._evaluator.globals = globals;
        this._evaluator.feature = feature;
        this._evaluator.featureState = featureState;
        this._evaluator.canonical = canonical || null;
        this._evaluator.availableImages = availableImages || null;
        this._evaluator.formattedSection = formattedSection;
        this._evaluator.featureTileCoord = featureTileCoord || null;
        this._evaluator.featureDistanceData = featureDistanceData || null;
        return this.expression.evaluate(this._evaluator);
    }
    evaluate(globals, feature, featureState, canonical, availableImages, formattedSection, featureTileCoord, featureDistanceData) {
        this._evaluator.globals = globals;
        this._evaluator.feature = feature || null;
        this._evaluator.featureState = featureState || null;
        this._evaluator.canonical = canonical || null;
        this._evaluator.availableImages = availableImages || null;
        this._evaluator.formattedSection = formattedSection || null;
        this._evaluator.featureTileCoord = featureTileCoord || null;
        this._evaluator.featureDistanceData = featureDistanceData || null;
        try {
            const val = this.expression.evaluate(this._evaluator);
            // eslint-disable-next-line no-self-compare
            if (val === null || val === undefined || typeof val === 'number' && val !== val) {
                return this._defaultValue;
            }
            if (this._enumValues && !(val in this._enumValues)) {
                throw new RuntimeError$1(`Expected value to be one of ${ Object.keys(this._enumValues).map(v => JSON.stringify(v)).join(', ') }, but found ${ JSON.stringify(val) } instead.`);
            }
            return val;
        } catch (e) {
            if (!this._warningHistory[e.message]) {
                this._warningHistory[e.message] = true;
                if (typeof console !== 'undefined') {
                    console.warn(e.message);
                }
            }
            return this._defaultValue;
        }
    }
}
function isExpression(expression) {
    return Array.isArray(expression) && expression.length > 0 && typeof expression[0] === 'string' && expression[0] in definitions;
}
/**
 * Parse and typecheck the given style spec JSON expression.  If
 * options.defaultValue is provided, then the resulting StyleExpression's
 * `evaluate()` method will handle errors by logging a warning (once per
 * message) and returning the default value.  Otherwise, it will throw
 * evaluation errors.
 *
 * @private
 */
function createExpression(expression, propertySpec) {
    const parser = new ParsingContext$1(definitions, [], propertySpec ? getExpectedType(propertySpec) : undefined);
    // For string-valued properties, coerce to string at the top level rather than asserting.
    const parsed = parser.parse(expression, undefined, undefined, undefined, propertySpec && propertySpec.type === 'string' ? { typeAnnotation: 'coerce' } : undefined);
    if (!parsed) {
        return error(parser.errors);
    }
    return success(new StyleExpression(parsed, propertySpec));
}
class ZoomConstantExpression {
    constructor(kind, expression) {
        this.kind = kind;
        this._styleExpression = expression;
        this.isStateDependent = kind !== 'constant' && !isStateConstant(expression.expression);
    }
    evaluateWithoutErrorHandling(globals, feature, featureState, canonical, availableImages, formattedSection) {
        return this._styleExpression.evaluateWithoutErrorHandling(globals, feature, featureState, canonical, availableImages, formattedSection);
    }
    evaluate(globals, feature, featureState, canonical, availableImages, formattedSection) {
        return this._styleExpression.evaluate(globals, feature, featureState, canonical, availableImages, formattedSection);
    }
}
class ZoomDependentExpression {
    constructor(kind, expression, zoomStops, interpolationType) {
        this.kind = kind;
        this.zoomStops = zoomStops;
        this._styleExpression = expression;
        this.isStateDependent = kind !== 'camera' && !isStateConstant(expression.expression);
        this.interpolationType = interpolationType;
    }
    evaluateWithoutErrorHandling(globals, feature, featureState, canonical, availableImages, formattedSection) {
        return this._styleExpression.evaluateWithoutErrorHandling(globals, feature, featureState, canonical, availableImages, formattedSection);
    }
    evaluate(globals, feature, featureState, canonical, availableImages, formattedSection) {
        return this._styleExpression.evaluate(globals, feature, featureState, canonical, availableImages, formattedSection);
    }
    interpolationFactor(input, lower, upper) {
        if (this.interpolationType) {
            return Interpolate$1.interpolationFactor(this.interpolationType, input, lower, upper);
        } else {
            return 0;
        }
    }
}
function createPropertyExpression(expression, propertySpec) {
    expression = createExpression(expression, propertySpec);
    if (expression.result === 'error') {
        return expression;
    }
    const parsed = expression.value.expression;
    const isFeatureConstant$1 = isFeatureConstant(parsed);
    if (!isFeatureConstant$1 && !supportsPropertyExpression(propertySpec)) {
        return error([new ParsingError$2('', 'data expressions not supported')]);
    }
    const isZoomConstant = isGlobalPropertyConstant(parsed, [
        'zoom',
        'pitch',
        'distance-from-center'
    ]);
    if (!isZoomConstant && !supportsZoomExpression(propertySpec)) {
        return error([new ParsingError$2('', 'zoom expressions not supported')]);
    }
    const zoomCurve = findZoomCurve(parsed);
    if (!zoomCurve && !isZoomConstant) {
        return error([new ParsingError$2('', '"zoom" expression may only be used as input to a top-level "step" or "interpolate" expression.')]);
    } else if (zoomCurve instanceof ParsingError$2) {
        return error([zoomCurve]);
    } else if (zoomCurve instanceof Interpolate$1 && !supportsInterpolation(propertySpec)) {
        return error([new ParsingError$2('', '"interpolate" expressions cannot be used with this property')]);
    }
    if (!zoomCurve) {
        return success(isFeatureConstant$1 ? new ZoomConstantExpression('constant', expression.value) : new ZoomConstantExpression('source', expression.value));
    }
    const interpolationType = zoomCurve instanceof Interpolate$1 ? zoomCurve.interpolation : undefined;
    return success(isFeatureConstant$1 ? new ZoomDependentExpression('camera', expression.value, zoomCurve.labels, interpolationType) : new ZoomDependentExpression('composite', expression.value, zoomCurve.labels, interpolationType));
}
// serialization wrapper for old-style stop functions normalized to the
// expression interface
class StylePropertyFunction {
    constructor(parameters, specification) {
        this._parameters = parameters;
        this._specification = specification;
        extend(this, createFunction(this._parameters, this._specification));
    }
    static deserialize(serialized) {
        return new StylePropertyFunction(serialized._parameters, serialized._specification);
    }
    static serialize(input) {
        return {
            _parameters: input._parameters,
            _specification: input._specification
        };
    }
}
function normalizePropertyExpression(value, specification) {
    if (isFunction(value)) {
        return new StylePropertyFunction(value, specification);
    } else if (isExpression(value)) {
        const expression = createPropertyExpression(value, specification);
        if (expression.result === 'error') {
            // this should have been caught in validation
            throw new Error(expression.value.map(err => `${ err.key }: ${ err.message }`).join(', '));
        }
        return expression.value;
    } else {
        let constant = value;
        if (typeof value === 'string' && specification.type === 'color') {
            constant = Color$1.parse(value);
        }
        return {
            kind: 'constant',
            evaluate: () => constant
        };
    }
}
// Zoom-dependent expressions may only use ["zoom"] as the input to a top-level "step" or "interpolate"
// expression (collectively referred to as a "curve"). The curve may be wrapped in one or more "let" or
// "coalesce" expressions.
function findZoomCurve(expression) {
    let result = null;
    if (expression instanceof Let$1) {
        result = findZoomCurve(expression.result);
    } else if (expression instanceof Coalesce$1) {
        for (const arg of expression.args) {
            result = findZoomCurve(arg);
            if (result) {
                break;
            }
        }
    } else if ((expression instanceof Step$1 || expression instanceof Interpolate$1) && expression.input instanceof CompoundExpression$1 && expression.input.name === 'zoom') {
        result = expression;
    }
    if (result instanceof ParsingError$2) {
        return result;
    }
    expression.eachChild(child => {
        const childResult = findZoomCurve(child);
        if (childResult instanceof ParsingError$2) {
            result = childResult;
        } else if (!result && childResult) {
            result = new ParsingError$2('', '"zoom" expression may only be used as input to a top-level "step" or "interpolate" expression.');
        } else if (result && childResult && result !== childResult) {
            result = new ParsingError$2('', 'Only one zoom-based "step" or "interpolate" subexpression may be used in an expression.');
        }
    });
    return result;
}
function getExpectedType(spec) {
    const types = {
        color: ColorType,
        string: StringType,
        number: NumberType,
        enum: StringType,
        boolean: BooleanType,
        formatted: FormattedType,
        resolvedImage: ResolvedImageType
    };
    if (spec.type === 'array') {
        return array$1(types[spec.value] || ValueType, spec.length);
    }
    return types[spec.type];
}
function getDefaultValue(spec) {
    if (spec.type === 'color' && (isFunction(spec.default) || Array.isArray(spec.default))) {
        // Special case for heatmap-color: it uses the 'default:' to define a
        // default color ramp, but createExpression expects a simple value to fall
        // back to in case of runtime errors
        return new Color$1(0, 0, 0, 0);
    } else if (spec.type === 'color') {
        return Color$1.parse(spec.default) || null;
    } else if (spec.default === undefined) {
        return null;
    } else {
        return spec.default;
    }
}

//
// Turn jsonlint-lines-primitives objects into primitive objects
function unbundle(value) {
    if (value instanceof Number || value instanceof String || value instanceof Boolean) {
        return value.valueOf();
    } else {
        return value;
    }
}
function deepUnbundle(value) {
    if (Array.isArray(value)) {
        return value.map(deepUnbundle);
    } else if (value instanceof Object && !(value instanceof Number || value instanceof String || value instanceof Boolean)) {
        const unbundledValue = {};
        for (const key in value) {
            unbundledValue[key] = deepUnbundle(value[key]);
        }
        return unbundledValue;
    }
    return unbundle(value);
}

//
function isExpressionFilter(filter) {
    if (filter === true || filter === false) {
        return true;
    }
    if (!Array.isArray(filter) || filter.length === 0) {
        return false;
    }
    switch (filter[0]) {
    case 'has':
        return filter.length >= 2 && filter[1] !== '$id' && filter[1] !== '$type';
    case 'in':
        return filter.length >= 3 && (typeof filter[1] !== 'string' || Array.isArray(filter[2]));
    case '!in':
    case '!has':
    case 'none':
        return false;
    case '==':
    case '!=':
    case '>':
    case '>=':
    case '<':
    case '<=':
        return filter.length !== 3 || (Array.isArray(filter[1]) || Array.isArray(filter[2]));
    case 'any':
    case 'all':
        for (const f of filter.slice(1)) {
            if (!isExpressionFilter(f) && typeof f !== 'boolean') {
                return false;
            }
        }
        return true;
    default:
        return true;
    }
}
/**
 * Given a filter expressed as nested arrays, return a new function
 * that evaluates whether a given feature (with a .properties or .tags property)
 * passes its test.
 *
 * @private
 * @param {Array} filter mapbox gl filter
 * @param {string} layerType the type of the layer this filter will be applied to.
 * @returns {Function} filter-evaluating function
 */
function createFilter(filter, layerType = 'fill') {
    if (filter === null || filter === undefined) {
        return {
            filter: () => true,
            needGeometry: false,
            needFeature: false
        };
    }
    const filterExp = filter;
    let staticFilter = true;
    try {
        staticFilter = extractStaticFilter(filterExp);
    } catch (e) {
        console.warn(`Failed to extract static filter. Filter will continue working, but at higher memory usage and slower framerate.
This is most likely a bug, please report this via https://github.com/mapbox/mapbox-gl-js/issues/new?assignees=&labels=&template=Bug_report.md
and paste the contents of this message in the report.
Thank you!
Filter Expression:
${ JSON.stringify(filterExp, null, 2) }
        `);
    }
    // Compile the static component of the filter
    const filterSpec = null;
    const compiledStaticFilter = createExpression(staticFilter, filterSpec);
    let filterFunc = null;
    if (compiledStaticFilter.result === 'error') {
        throw new Error(compiledStaticFilter.value.map(err => `${ err.key }: ${ err.message }`).join(', '));
    } else {
        filterFunc = (globalProperties, feature, canonical) => compiledStaticFilter.value.evaluate(globalProperties, feature, {}, canonical);
    }
    // If the static component is not equal to the entire filter then we have a dynamic component
    // Compile the dynamic component separately
    let dynamicFilterFunc = null;
    let needFeature = null;
    if (staticFilter !== filterExp) {
        const compiledDynamicFilter = createExpression(filterExp, filterSpec);
        if (compiledDynamicFilter.result === 'error') {
            throw new Error(compiledDynamicFilter.value.map(err => `${ err.key }: ${ err.message }`).join(', '));
        } else {
            dynamicFilterFunc = (globalProperties, feature, canonical, featureTileCoord, featureDistanceData) => compiledDynamicFilter.value.evaluate(globalProperties, feature, {}, canonical, undefined, undefined, featureTileCoord, featureDistanceData);
            needFeature = !isFeatureConstant(compiledDynamicFilter.value.expression);
        }
    }
    filterFunc = filterFunc;
    const needGeometry = geometryNeeded(staticFilter);
    return {
        filter: filterFunc,
        dynamicFilter: dynamicFilterFunc ? dynamicFilterFunc : undefined,
        needGeometry,
        needFeature: !!needFeature
    };
}
function extractStaticFilter(filter) {
    if (!isDynamicFilter(filter)) {
        return filter;
    }
    // Shallow copy so we can replace expressions in-place
    let result = deepUnbundle(filter);
    // 1. Union branches
    unionDynamicBranches(result);
    // 2. Collapse dynamic conditions to  `true`
    result = collapseDynamicBooleanExpressions(result);
    return result;
}
function collapseDynamicBooleanExpressions(expression) {
    if (!Array.isArray(expression)) {
        return expression;
    }
    const collapsed = collapsedExpression(expression);
    if (collapsed === true) {
        return collapsed;
    } else {
        return collapsed.map(subExpression => collapseDynamicBooleanExpressions(subExpression));
    }
}
/**
 * Traverses the expression and replaces all instances of branching on a
 * `dynamic` conditional (such as `['pitch']` or `['distance-from-center']`)
 * into an `any` expression.
 * This ensures that all possible outcomes of a `dynamic` branch are considered
 * when evaluating the expression upfront during filtering.
 *
 * @param {Array<any>} filter the filter expression mutated in-place.
 */
function unionDynamicBranches(filter) {
    let isBranchingDynamically = false;
    const branches = [];
    if (filter[0] === 'case') {
        for (let i = 1; i < filter.length - 1; i += 2) {
            isBranchingDynamically = isBranchingDynamically || isDynamicFilter(filter[i]);
            branches.push(filter[i + 1]);
        }
        branches.push(filter[filter.length - 1]);
    } else if (filter[0] === 'match') {
        isBranchingDynamically = isBranchingDynamically || isDynamicFilter(filter[1]);
        for (let i = 2; i < filter.length - 1; i += 2) {
            branches.push(filter[i + 1]);
        }
        branches.push(filter[filter.length - 1]);
    } else if (filter[0] === 'step') {
        isBranchingDynamically = isBranchingDynamically || isDynamicFilter(filter[1]);
        for (let i = 1; i < filter.length - 1; i += 2) {
            branches.push(filter[i + 1]);
        }
    }
    if (isBranchingDynamically) {
        filter.length = 0;
        filter.push('any', ...branches);
    }
    // traverse and recurse into children
    for (let i = 1; i < filter.length; i++) {
        unionDynamicBranches(filter[i]);
    }
}
function isDynamicFilter(filter) {
    // Base Cases
    if (!Array.isArray(filter)) {
        return false;
    }
    if (isRootExpressionDynamic(filter[0])) {
        return true;
    }
    for (let i = 1; i < filter.length; i++) {
        const child = filter[i];
        if (isDynamicFilter(child)) {
            return true;
        }
    }
    return false;
}
function isRootExpressionDynamic(expression) {
    return expression === 'pitch' || expression === 'distance-from-center';
}
const dynamicConditionExpressions = new Set([
    'in',
    '==',
    '!=',
    '>',
    '>=',
    '<',
    '<=',
    'to-boolean'
]);
function collapsedExpression(expression) {
    if (dynamicConditionExpressions.has(expression[0])) {
        for (let i = 1; i < expression.length; i++) {
            const param = expression[i];
            if (isDynamicFilter(param)) {
                return true;
            }
        }
    }
    return expression;
}
function geometryNeeded(filter) {
    if (!Array.isArray(filter))
        return false;
    if (filter[0] === 'within')
        return true;
    for (let index = 1; index < filter.length; index++) {
        if (geometryNeeded(filter[index]))
            return true;
    }
    return false;
}

function commonjsRequire(path) {
    throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
//
const expression = {
    StyleExpression,
    isExpression,
    isExpressionFilter,
    createExpression,
    createPropertyExpression,
    normalizePropertyExpression,
    ZoomConstantExpression,
    ZoomDependentExpression,
    StylePropertyFunction
};

export { expression, createFilter as featureFilter };
