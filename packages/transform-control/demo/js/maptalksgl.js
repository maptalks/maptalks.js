/*!
 * @maptalks/gl v0.19.2
 * LICENSE : UNLICENSED
 * (c) 2016-2020 maptalks.org
 */
!function(e, t) {
    "object" == typeof exports && "undefined" != typeof module ? t(exports, require("maptalks")) : "function" == typeof define && define.amd ? define([ "exports", "maptalks" ], t) : t((e = e || self).maptalksgl = {}, e.maptalks);
}(this, function(e, r) {
    "use strict";
    var t, c = (function(e) {
        e.exports = function() {
            var ne = function e(t) {
                return t instanceof Uint8Array || t instanceof Uint16Array || t instanceof Uint32Array || t instanceof Int8Array || t instanceof Int16Array || t instanceof Int32Array || t instanceof Float32Array || t instanceof Float64Array || t instanceof Uint8ClampedArray;
            }, ue = function e(t, n) {
                var r = Object.keys(n);
                for (var i = 0; i < r.length; ++i) {
                    t[r[i]] = n[r[i]];
                }
                return t;
            }, f = "\n";
            function l(e) {
                if (typeof atob !== "undefined") {
                    return atob(e);
                }
                return "base64:" + e;
            }
            function r(e) {
                var t = new Error("(regl) " + e);
                console.error(t);
                throw t;
            }
            function p(e, t) {
                if (!e) {
                    r(t);
                }
            }
            function i(e) {
                if (e) {
                    return ": " + e;
                }
                return "";
            }
            function e(e, t, n) {
                if (!(e in t)) {
                    r("unknown parameter (" + e + ")" + i(n) + ". possible values: " + Object.keys(t).join());
                }
            }
            function t(e, t) {
                if (!ne(e)) {
                    r("invalid parameter type" + i(t) + ". must be a typed array");
                }
            }
            function a(e, t) {
                switch (t) {
                  case "number":
                    return typeof e === "number";

                  case "object":
                    return typeof e === "object";

                  case "string":
                    return typeof e === "string";

                  case "boolean":
                    return typeof e === "boolean";

                  case "function":
                    return typeof e === "function";

                  case "undefined":
                    return typeof e === "undefined";

                  case "symbol":
                    return typeof e === "symbol";
                }
            }
            function n(e, t, n) {
                if (!a(e, t)) {
                    r("invalid parameter type" + i(n) + ". expected " + t + ", got " + typeof e);
                }
            }
            function o(e, t) {
                if (!(e >= 0 && (e | 0) === e)) {
                    r("invalid parameter type, (" + e + ")" + i(t) + ". must be a nonnegative integer");
                }
            }
            function s(e, t, n) {
                if (t.indexOf(e) < 0) {
                    r("invalid value" + i(n) + ". must be one of: " + t);
                }
            }
            var u = [ "gl", "canvas", "container", "attributes", "pixelRatio", "extensions", "optionalExtensions", "profile", "onDone" ];
            function c(e) {
                Object.keys(e).forEach(function(e) {
                    if (u.indexOf(e) < 0) {
                        r('invalid regl constructor argument "' + e + '". must be one of ' + u);
                    }
                });
            }
            function h(e, t) {
                e = e + "";
                while (e.length < t) {
                    e = " " + e;
                }
                return e;
            }
            function d() {
                this.name = "unknown";
                this.lines = [];
                this.index = {};
                this.hasErrors = false;
            }
            function v(e, t) {
                this.number = e;
                this.line = t;
                this.errors = [];
            }
            function m(e, t, n) {
                this.file = e;
                this.line = t;
                this.message = n;
            }
            function g() {
                var e = new Error();
                var t = (e.stack || e).toString();
                var n = /compileProcedure.*\n\s*at.*\((.*)\)/.exec(t);
                if (n) {
                    return n[1];
                }
                var r = /compileProcedure.*\n\s*at\s+(.*)(\n|$)/.exec(t);
                if (r) {
                    return r[1];
                }
                return "unknown";
            }
            function _() {
                var e = new Error();
                var t = (e.stack || e).toString();
                var n = /at REGLCommand.*\n\s+at.*\((.*)\)/.exec(t);
                if (n) {
                    return n[1];
                }
                var r = /at REGLCommand.*\n\s+at\s+(.*)\n/.exec(t);
                if (r) {
                    return r[1];
                }
                return "unknown";
            }
            function x(e, t) {
                var n = e.split("\n");
                var r = 1;
                var i = 0;
                var a = {
                    unknown: new d(),
                    0: new d()
                };
                a.unknown.name = a[0].name = t || g();
                a.unknown.lines.push(new v(0, ""));
                for (var o = 0; o < n.length; ++o) {
                    var s = n[o];
                    var u = /^\s*#\s*(\w+)\s+(.+)\s*$/.exec(s);
                    if (u) {
                        switch (u[1]) {
                          case "line":
                            var f = /(\d+)(\s+\d+)?/.exec(u[2]);
                            if (f) {
                                r = f[1] | 0;
                                if (f[2]) {
                                    i = f[2] | 0;
                                    if (!(i in a)) {
                                        a[i] = new d();
                                    }
                                }
                            }
                            break;

                          case "define":
                            var c = /SHADER_NAME(_B64)?\s+(.*)$/.exec(u[2]);
                            if (c) {
                                a[i].name = c[1] ? l(c[2]) : c[2];
                            }
                            break;
                        }
                    }
                    a[i].lines.push(new v(r++, s));
                }
                Object.keys(a).forEach(function(e) {
                    var t = a[e];
                    t.lines.forEach(function(e) {
                        t.index[e.number] = e;
                    });
                });
                return a;
            }
            function b(e) {
                var n = [];
                e.split("\n").forEach(function(e) {
                    if (e.length < 5) {
                        return;
                    }
                    var t = /^ERROR:\s+(\d+):(\d+):\s*(.*)$/.exec(e);
                    if (t) {
                        n.push(new m(t[1] | 0, t[2] | 0, t[3].trim()));
                    } else if (e.length > 0) {
                        n.push(new m("unknown", 0, e));
                    }
                });
                return n;
            }
            function y(r, e) {
                e.forEach(function(e) {
                    var t = r[e.file];
                    if (t) {
                        var n = t.index[e.line];
                        if (n) {
                            n.errors.push(e);
                            t.hasErrors = true;
                            return;
                        }
                    }
                    r.unknown.hasErrors = true;
                    r.unknown.lines[0].errors.push(e);
                });
            }
            function A(e, t, n, r, i) {
                if (!e.getShaderParameter(t, e.COMPILE_STATUS)) {
                    var a = e.getShaderInfoLog(t);
                    var o = r === e.FRAGMENT_SHADER ? "fragment" : "vertex";
                    O(n, "string", o + " shader source must be a string", i);
                    var s = x(n, i);
                    var u = b(a);
                    y(s, u);
                    Object.keys(s).forEach(function(e) {
                        var t = s[e];
                        if (!t.hasErrors) {
                            return;
                        }
                        var n = [ "" ];
                        var r = [ "" ];
                        function o(e, t) {
                            n.push(e);
                            r.push(t || "");
                        }
                        o("file number " + e + ": " + t.name + "\n", "color:red;text-decoration:underline;font-weight:bold");
                        t.lines.forEach(function(i) {
                            if (i.errors.length > 0) {
                                o(h(i.number, 4) + "|  ", "background-color:yellow; font-weight:bold");
                                o(i.line + f, "color:red; background-color:yellow; font-weight:bold");
                                var a = 0;
                                i.errors.forEach(function(e) {
                                    var t = e.message;
                                    var n = /^\s*'(.*)'\s*:\s*(.*)$/.exec(t);
                                    if (n) {
                                        var r = n[1];
                                        t = n[2];
                                        switch (r) {
                                          case "assign":
                                            r = "=";
                                            break;
                                        }
                                        a = Math.max(i.line.indexOf(r, a), 0);
                                    } else {
                                        a = 0;
                                    }
                                    o(h("| ", 6));
                                    o(h("^^^", a + 3) + f, "font-weight:bold");
                                    o(h("| ", 6));
                                    o(t + f, "font-weight:bold");
                                });
                                o(h("| ", 6) + f);
                            } else {
                                o(h(i.number, 4) + "|  ");
                                o(i.line + f, "color:red");
                            }
                        });
                        if (typeof document !== "undefined" && !window.chrome) {
                            r[0] = n.join("%c");
                            console.log.apply(console, r);
                        } else {
                            console.log(n.join(""));
                        }
                    });
                    p.raise("Error compiling " + o + " shader, " + s[0].name);
                }
            }
            function T(e, t, n, r, i) {
                if (!e.getProgramParameter(t, e.LINK_STATUS)) {
                    var a = e.getProgramInfoLog(t);
                    var o = x(n, i);
                    var s = x(r, i);
                    var u = 'Error linking program with vertex shader, "' + s[0].name + '", and fragment shader "' + o[0].name + '"';
                    if (typeof document !== "undefined") {
                        console.log("%c" + u + f + "%c" + a, "color:red;text-decoration:underline;font-weight:bold", "color:red");
                    } else {
                        console.log(u + f + a);
                    }
                    p.raise(u);
                }
            }
            function E(e) {
                e._commandRef = g();
            }
            function M(e, t, n, r) {
                E(e);
                function i(e) {
                    if (e) {
                        return r.id(e);
                    }
                    return 0;
                }
                e._fragId = i(e["static"].frag);
                e._vertId = i(e["static"].vert);
                function a(t, e) {
                    Object.keys(e).forEach(function(e) {
                        t[r.id(e)] = true;
                    });
                }
                var o = e._uniformSet = {};
                a(o, t["static"]);
                a(o, t.dynamic);
                var s = e._attributeSet = {};
                a(s, n["static"]);
                a(s, n.dynamic);
                e._hasCount = "count" in e["static"] || "count" in e.dynamic || "elements" in e["static"] || "elements" in e.dynamic;
            }
            function S(e, t) {
                var n = _();
                r(e + " in command " + (t || g()) + (n === "unknown" ? "" : " called from " + n));
            }
            function w(e, t, n) {
                if (!e) {
                    S(t, n || g());
                }
            }
            function R(e, t, n, r) {
                if (!(e in t)) {
                    S("unknown parameter (" + e + ")" + i(n) + ". possible values: " + Object.keys(t).join(), r || g());
                }
            }
            function O(e, t, n, r) {
                if (!a(e, t)) {
                    S("invalid parameter type" + i(n) + ". expected " + t + ", got " + typeof e, r || g());
                }
            }
            function C(e) {
                e();
            }
            function B(e, t, n) {
                if (e.texture) {
                    s(e.texture._texture.internalformat, t, "unsupported texture format for attachment");
                } else {
                    s(e.renderbuffer._renderbuffer.format, n, "unsupported renderbuffer format for attachment");
                }
            }
            var F = 33071, P = 9728, I = 9984, D = 9985, N = 9986, L = 9987, U, q = 5121, z = 5122, G = 5123, H = 5124, V = 5125, k = 5126, j = 32819, W = 32820, X = 33635, Y = 34042, K = 36193, J = {};
            function Q(e, t) {
                if (e === W || e === j || e === X) {
                    return 2;
                } else if (e === Y) {
                    return 4;
                } else {
                    return J[e] * t;
                }
            }
            function Z(e) {
                return !(e & e - 1) && !!e;
            }
            function $(e, t, n) {
                var r;
                var i = t.width;
                var a = t.height;
                var o = t.channels;
                p(i > 0 && i <= n.maxTextureSize && a > 0 && a <= n.maxTextureSize, "invalid texture shape");
                if (e.wrapS !== F || e.wrapT !== F) {
                    p(Z(i) && Z(a), "incompatible wrap mode for texture, both width and height must be power of 2");
                }
                if (t.mipmask === 1) {
                    if (i !== 1 && a !== 1) {
                        p(e.minFilter !== I && e.minFilter !== N && e.minFilter !== D && e.minFilter !== L, "min filter requires mipmap");
                    }
                } else {
                    p(Z(i) && Z(a), "texture must be a square power of 2 to support mipmapping");
                    p(t.mipmask === (i << 1) - 1, "missing or incomplete mipmap data");
                }
                if (t.type === k) {
                    if (n.extensions.indexOf("oes_texture_float_linear") < 0) {
                        p(e.minFilter === P && e.magFilter === P, "filter not supported, must enable oes_texture_float_linear");
                    }
                    p(!e.genMipmaps, "mipmap generation not supported with float textures");
                }
                var s = t.images;
                for (r = 0; r < 16; ++r) {
                    if (s[r]) {
                        var u = i >> r;
                        var f = a >> r;
                        p(t.mipmask & 1 << r, "missing mipmap data");
                        var c = s[r];
                        p(c.width === u && c.height === f, "invalid shape for mip images");
                        p(c.format === t.format && c.internalformat === t.internalformat && c.type === t.type, "incompatible type for mip image");
                        if (c.compressed) ; else if (c.data) {
                            var l = Math.ceil(Q(c.type, o) * u / c.unpackAlignment) * c.unpackAlignment;
                            p(c.data.byteLength === l * f, "invalid data for image, buffer size is inconsistent with image format");
                        } else if (c.element) ; else if (c.copy) ;
                    } else if (!e.genMipmaps) {
                        p((t.mipmask & 1 << r) === 0, "extra mipmap data");
                    }
                }
                if (t.compressed) {
                    p(!e.genMipmaps, "mipmap generation for compressed images not supported");
                }
            }
            function ee(e, t, n, r) {
                var i = e.width;
                var a = e.height;
                var o = e.channels;
                p(i > 0 && i <= r.maxTextureSize && a > 0 && a <= r.maxTextureSize, "invalid texture shape");
                p(i === a, "cube map must be square");
                p(t.wrapS === F && t.wrapT === F, "wrap mode not supported by cube map");
                for (var s = 0; s < n.length; ++s) {
                    var u = n[s];
                    p(u.width === i && u.height === a, "inconsistent cube map face shape");
                    if (t.genMipmaps) {
                        p(!u.compressed, "can not generate mipmap for compressed textures");
                        p(u.mipmask === 1, "can not specify mipmaps and generate mipmaps");
                    }
                    var f = u.images;
                    for (var c = 0; c < 16; ++c) {
                        var l = f[c];
                        if (l) {
                            var h = i >> c;
                            var d = a >> c;
                            p(u.mipmask & 1 << c, "missing mipmap data");
                            p(l.width === h && l.height === d, "invalid shape for mip images");
                            p(l.format === e.format && l.internalformat === e.internalformat && l.type === e.type, "incompatible type for mip image");
                            if (l.compressed) ; else if (l.data) {
                                p(l.data.byteLength === h * d * Math.max(Q(l.type, o), l.unpackAlignment), "invalid data for image, buffer size is inconsistent with image format");
                            } else if (l.element) ; else if (l.copy) ;
                        }
                    }
                }
            }
            J[5120] = J[q] = 1, J[z] = J[G] = J[K] = J[X] = J[j] = J[W] = 2, J[H] = J[V] = J[k] = J[Y] = 4;
            var fe = ue(p, {
                optional: C,
                raise: r,
                commandRaise: S,
                command: w,
                parameter: e,
                commandParameter: R,
                constructor: c,
                type: n,
                commandType: O,
                isTypedArray: t,
                nni: o,
                oneOf: s,
                shaderError: A,
                linkError: T,
                callSite: _,
                saveCommandRef: E,
                saveDrawInfo: M,
                framebufferFormat: B,
                guessCommand: g,
                texture2D: $,
                textureCube: ee
            }), te = 0, re = 0;
            function ie(e, t) {
                this.id = te++;
                this.type = e;
                this.data = t;
            }
            function ae(e) {
                return e.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
            }
            function oe(e) {
                if (e.length === 0) {
                    return [];
                }
                var t = e.charAt(0);
                var n = e.charAt(e.length - 1);
                if (e.length > 1 && t === n && (t === '"' || t === "'")) {
                    return [ '"' + ae(e.substr(1, e.length - 2)) + '"' ];
                }
                var r = /\[(false|true|null|\d+|'[^']*'|"[^"]*")\]/.exec(e);
                if (r) {
                    return oe(e.substr(0, r.index)).concat(oe(r[1])).concat(oe(e.substr(r.index + r[0].length)));
                }
                var i = e.split(".");
                if (i.length === 1) {
                    return [ '"' + ae(e) + '"' ];
                }
                var a = [];
                for (var o = 0; o < i.length; ++o) {
                    a = a.concat(oe(i[o]));
                }
                return a;
            }
            function se(e) {
                return "[" + oe(e).join("][") + "]";
            }
            function ce(e, t) {
                return new ie(e, se(t + ""));
            }
            function le(e) {
                return typeof e === "function" && !e._reglType || e instanceof ie;
            }
            function he(e, t) {
                if (typeof e === "function") {
                    return new ie(re, e);
                }
                return e;
            }
            var de = {
                DynamicVariable: ie,
                define: ce,
                isDynamic: le,
                unbox: he,
                accessor: se
            }, pe = {
                next: typeof requestAnimationFrame === "function" ? function(e) {
                    return requestAnimationFrame(e);
                } : function(e) {
                    return setTimeout(e, 16);
                },
                cancel: typeof cancelAnimationFrame === "function" ? function(e) {
                    return cancelAnimationFrame(e);
                } : clearTimeout
            }, ve = typeof performance !== "undefined" && performance.now ? function() {
                return performance.now();
            } : function() {
                return +new Date();
            };
            function me() {
                var r = {
                    "": 0
                };
                var i = [ "" ];
                return {
                    id: function e(t) {
                        var n = r[t];
                        if (n) {
                            return n;
                        }
                        n = r[t] = i.length;
                        i.push(t);
                        return n;
                    },
                    str: function e(t) {
                        return i[t];
                    }
                };
            }
            function ge(r, e, i) {
                var a = document.createElement("canvas");
                ue(a.style, {
                    border: 0,
                    margin: 0,
                    padding: 0,
                    top: 0,
                    left: 0
                });
                r.appendChild(a);
                if (r === document.body) {
                    a.style.position = "absolute";
                    ue(r.style, {
                        margin: 0,
                        padding: 0
                    });
                }
                function t() {
                    var e = window.innerWidth;
                    var t = window.innerHeight;
                    if (r !== document.body) {
                        var n = r.getBoundingClientRect();
                        e = n.right - n.left;
                        t = n.bottom - n.top;
                    }
                    a.width = i * e;
                    a.height = i * t;
                    ue(a.style, {
                        width: e + "px",
                        height: t + "px"
                    });
                }
                var n;
                if (r !== document.body && typeof ResizeObserver === "function") {
                    n = new ResizeObserver(function() {
                        setTimeout(t);
                    });
                    n.observe(r);
                } else {
                    window.addEventListener("resize", t, false);
                }
                function o() {
                    if (n) {
                        n.disconnect();
                    } else {
                        window.removeEventListener("resize", t);
                    }
                    r.removeChild(a);
                }
                t();
                return {
                    canvas: a,
                    onDestroy: o
                };
            }
            function _e(t, n) {
                function e(e) {
                    try {
                        return t.getContext(e, n);
                    } catch (e) {
                        return null;
                    }
                }
                return e("webgl") || e("experimental-webgl") || e("webgl-experimental");
            }
            function xe(e) {
                return typeof e.nodeName === "string" && typeof e.appendChild === "function" && typeof e.getBoundingClientRect === "function";
            }
            function be(e) {
                return typeof e.drawArrays === "function" || typeof e.drawElements === "function";
            }
            function ye(e) {
                if (typeof e === "string") {
                    return e.split();
                }
                fe(Array.isArray(e), "invalid extension array");
                return e;
            }
            function Ae(e) {
                if (typeof e === "string") {
                    fe(typeof document !== "undefined", "not supported outside of DOM");
                    return document.querySelector(e);
                }
                return e;
            }
            function Te(e) {
                var t = e || {};
                var n, r, i, a;
                var o = {};
                var s = [];
                var u = [];
                var f = typeof window === "undefined" ? 1 : window.devicePixelRatio;
                var c = false;
                var l = function e(t) {
                    if (t) {
                        fe.raise(t);
                    }
                };
                var h = function e() {};
                if (typeof t === "string") {
                    fe(typeof document !== "undefined", "selector queries only supported in DOM enviroments");
                    n = document.querySelector(t);
                    fe(n, "invalid query string for element");
                } else if (typeof t === "object") {
                    if (xe(t)) {
                        n = t;
                    } else if (be(t)) {
                        a = t;
                        i = a.canvas;
                    } else {
                        fe.constructor(t);
                        if ("gl" in t) {
                            a = t.gl;
                        } else if ("canvas" in t) {
                            i = Ae(t.canvas);
                        } else if ("container" in t) {
                            r = Ae(t.container);
                        }
                        if ("attributes" in t) {
                            o = t.attributes;
                            fe.type(o, "object", "invalid context attributes");
                        }
                        if ("extensions" in t) {
                            s = ye(t.extensions);
                        }
                        if ("optionalExtensions" in t) {
                            u = ye(t.optionalExtensions);
                        }
                        if ("onDone" in t) {
                            fe.type(t.onDone, "function", "invalid or missing onDone callback");
                            l = t.onDone;
                        }
                        if ("profile" in t) {
                            c = !!t.profile;
                        }
                        if ("pixelRatio" in t) {
                            f = +t.pixelRatio;
                            fe(f > 0, "invalid pixel ratio");
                        }
                    }
                } else {
                    fe.raise("invalid arguments to regl");
                }
                if (n) {
                    if (n.nodeName.toLowerCase() === "canvas") {
                        i = n;
                    } else {
                        r = n;
                    }
                }
                if (!a) {
                    if (!i) {
                        fe(typeof document !== "undefined", "must manually specify webgl context outside of DOM environments");
                        var d = ge(r || document.body, l, f);
                        if (!d) {
                            return null;
                        }
                        i = d.canvas;
                        h = d.onDestroy;
                    }
                    if (o.premultipliedAlpha === undefined) o.premultipliedAlpha = true;
                    a = _e(i, o);
                }
                if (!a) {
                    h();
                    l("webgl not supported, try upgrading your browser or graphics drivers http://get.webgl.org");
                    return null;
                }
                return {
                    gl: a,
                    canvas: i,
                    container: r,
                    extensions: s,
                    optionalExtensions: u,
                    pixelRatio: f,
                    profile: c,
                    onDone: l,
                    onDestroy: h
                };
            }
            function Ee(r, e) {
                var i = {};
                function t(e) {
                    fe.type(e, "string", "extension name must be string");
                    var t = e.toLowerCase();
                    var n;
                    try {
                        n = i[t] = r.getExtension(t);
                    } catch (e) {}
                    return !!n;
                }
                for (var n = 0; n < e.extensions.length; ++n) {
                    var a = e.extensions[n];
                    if (!t(a)) {
                        e.onDestroy();
                        e.onDone('"' + a + '" extension is not supported by the current WebGL context, try upgrading your system or a different browser');
                        return null;
                    }
                }
                e.optionalExtensions.forEach(t);
                return {
                    extensions: i,
                    restore: function e() {
                        Object.keys(i).forEach(function(e) {
                            if (i[e] && !t(e)) {
                                throw new Error("(regl): error restoring extension " + e);
                            }
                        });
                    }
                };
            }
            function Me(e, t) {
                var n = Array(e);
                for (var r = 0; r < e; ++r) {
                    n[r] = t(r);
                }
                return n;
            }
            var Se = 5120, we = 5121, Re = 5122, Oe = 5123, Ce = 5124, Be = 5125, Fe = 5126;
            function Pe(e) {
                for (var t = 16; t <= 1 << 28; t *= 16) {
                    if (e <= t) {
                        return t;
                    }
                }
                return 0;
            }
            function Ie(e) {
                var t, n;
                t = (e > 65535) << 4;
                e >>>= t;
                n = (e > 255) << 3;
                e >>>= n;
                t |= n;
                n = (e > 15) << 2;
                e >>>= n;
                t |= n;
                n = (e > 3) << 1;
                e >>>= n;
                t |= n;
                return t | e >> 1;
            }
            function De() {
                var r = Me(8, function() {
                    return [];
                });
                function i(e) {
                    var t = Pe(e);
                    var n = r[Ie(t) >> 2];
                    if (n.length > 0) {
                        return n.pop();
                    }
                    return new ArrayBuffer(t);
                }
                function t(e) {
                    r[Ie(e.byteLength) >> 2].push(e);
                }
                function e(e, t) {
                    var n = null;
                    switch (e) {
                      case Se:
                        n = new Int8Array(i(t), 0, t);
                        break;

                      case we:
                        n = new Uint8Array(i(t), 0, t);
                        break;

                      case Re:
                        n = new Int16Array(i(2 * t), 0, t);
                        break;

                      case Oe:
                        n = new Uint16Array(i(2 * t), 0, t);
                        break;

                      case Ce:
                        n = new Int32Array(i(4 * t), 0, t);
                        break;

                      case Be:
                        n = new Uint32Array(i(4 * t), 0, t);
                        break;

                      case Fe:
                        n = new Float32Array(i(4 * t), 0, t);
                        break;

                      default:
                        return null;
                    }
                    if (n.length !== t) {
                        return n.subarray(0, t);
                    }
                    return n;
                }
                function n(e) {
                    t(e.buffer);
                }
                return {
                    alloc: i,
                    free: t,
                    allocType: e,
                    freeType: n
                };
            }
            var Ne = De();
            Ne.zero = De();
            var Le = 6402, Ue = 34041, qe = 36193, ze = {
                WEBGL_depth_texture: {
                    UNSIGNED_INT_24_8_WEBGL: 34042
                },
                OES_element_index_uint: {},
                OES_texture_float: {},
                OES_texture_half_float: {
                    HALF_FLOAT_OES: 36193
                },
                EXT_color_buffer_float: {},
                OES_standard_derivatives: {},
                EXT_frag_depth: {},
                EXT_blend_minmax: {
                    MIN_EXT: 32775,
                    MAX_EXT: 32776
                },
                EXT_shader_texture_lod: {}
            }, Ge = {
                gl2: function e(t, n) {
                    t[this.versionProperty] = 2;
                    for (var r in ze) {
                        n[r.toLowerCase()] = ze[r];
                    }
                    t.getExtension("EXT_color_buffer_float");
                    n["webgl_draw_buffers"] = {
                        drawBuffersWEBGL: function e() {
                            return t.drawBuffers.apply(t, arguments);
                        }
                    };
                    n["oes_vertex_array_object"] = {
                        VERTEX_ARRAY_BINDING_OES: 34229,
                        createVertexArrayOES: function e() {
                            return t.createVertexArray();
                        },
                        deleteVertexArrayOES: function e() {
                            return t.deleteVertexArray.apply(t, arguments);
                        },
                        isVertexArrayOES: function e() {
                            return t.isVertexArray.apply(t, arguments);
                        },
                        bindVertexArrayOES: function e() {
                            return t.bindVertexArray.apply(t, arguments);
                        }
                    };
                    n["angle_instanced_arrays"] = {
                        VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE: 35070,
                        drawArraysInstancedANGLE: function e() {
                            return t.drawArraysInstanced.apply(t, arguments);
                        },
                        drawElementsInstancedANGLE: function e() {
                            return t.drawElementsInstanced.apply(t, arguments);
                        },
                        vertexAttribDivisorANGLE: function e() {
                            return t.vertexAttribDivisor.apply(t, arguments);
                        }
                    };
                },
                versionProperty: "___regl_gl_version___",
                getInternalFormat: function e(t, n, r) {
                    if (t[this.versionProperty] !== 2) {
                        return n;
                    }
                    if (n === Le) {
                        return 33190;
                    } else if (n === Ue) {
                        return 35056;
                    } else if (r === qe && n === t.RGBA) {
                        return 34842;
                    } else if (r === qe && n === t.RGB) {
                        return 34843;
                    } else if (r === t.FLOAT && n === t.RGBA) {
                        return 34836;
                    } else if (r === t.FLOAT && n === t.RGB) {
                        return 34837;
                    }
                    return n;
                },
                getTextureType: function e(t, n) {
                    if (t[this.versionProperty] !== 2) {
                        return n;
                    }
                    if (n === qe) {
                        return t.HALF_FLOAT;
                    }
                    return n;
                }
            }, He = 3408, Ve = 3410, ke = 3411, je = 3412, We = 3413, Xe = 3414, Ye = 3415, Ke = 33901, Je = 33902, Qe = 3379, Ze = 3386, $e = 34921, et = 36347, tt = 36348, nt = 35661, rt = 35660, it = 34930, at = 36349, ot = 34076, st = 34024, ut = 7936, ft = 7937, ct = 7938, lt = 35724, ht = 34047, dt = 36063, pt = 34852, vt = 3553, mt = 34067, gt = 34069, _t = 33984, xt = 6408, bt = 5126, yt = 5121, At = 36160, Tt = 36053, Et = 36064, Mt = 16384, St = function e(t, n) {
                var r = 1;
                if (n.ext_texture_filter_anisotropic) {
                    r = t.getParameter(ht);
                }
                var i = 1;
                var a = 1;
                if (n.webgl_draw_buffers) {
                    i = t.getParameter(pt);
                    a = t.getParameter(dt);
                }
                var o = !!n.oes_texture_float;
                if (o) {
                    var s = t.createTexture();
                    t.bindTexture(vt, s);
                    var u = Ge.getInternalFormat(t, xt, bt);
                    t.texImage2D(vt, 0, u, 1, 1, 0, xt, bt, null);
                    var f = t.createFramebuffer();
                    t.bindFramebuffer(At, f);
                    t.framebufferTexture2D(At, Et, vt, s, 0);
                    t.bindTexture(vt, null);
                    if (t.checkFramebufferStatus(At) !== Tt) o = false; else {
                        t.viewport(0, 0, 1, 1);
                        t.clearColor(1, 0, 0, 1);
                        t.clear(Mt);
                        var c = Ne.allocType(bt, 4);
                        t.readPixels(0, 0, 1, 1, xt, bt, c);
                        if (t.getError()) o = false; else {
                            t.deleteFramebuffer(f);
                            t.deleteTexture(s);
                            o = c[0] === 1;
                        }
                        Ne.freeType(c);
                    }
                }
                var l = typeof navigator !== "undefined" && (/MSIE/.test(navigator.userAgent) || /Trident\//.test(navigator.appVersion) || /Edge/.test(navigator.userAgent));
                var h = true;
                if (!l) {
                    var d = t.createTexture();
                    var p = Ne.allocType(yt, 36);
                    t.activeTexture(_t);
                    t.bindTexture(mt, d);
                    t.texImage2D(gt, 0, xt, 3, 3, 0, xt, yt, p);
                    Ne.freeType(p);
                    t.bindTexture(mt, null);
                    t.deleteTexture(d);
                    h = !t.getError();
                }
                return {
                    colorBits: [ t.getParameter(Ve), t.getParameter(ke), t.getParameter(je), t.getParameter(We) ],
                    depthBits: t.getParameter(Xe),
                    stencilBits: t.getParameter(Ye),
                    subpixelBits: t.getParameter(He),
                    extensions: Object.keys(n).filter(function(e) {
                        return !!n[e];
                    }),
                    maxAnisotropic: r,
                    maxDrawbuffers: i,
                    maxColorAttachments: a,
                    pointSizeDims: t.getParameter(Ke),
                    lineWidthDims: t.getParameter(Je),
                    maxViewportDims: t.getParameter(Ze),
                    maxCombinedTextureUnits: t.getParameter(nt),
                    maxCubeMapSize: t.getParameter(ot),
                    maxRenderbufferSize: t.getParameter(st),
                    maxTextureUnits: t.getParameter(it),
                    maxTextureSize: t.getParameter(Qe),
                    maxAttributes: t.getParameter($e),
                    maxVertexUniforms: t.getParameter(et),
                    maxVertexTextureUnits: t.getParameter(rt),
                    maxVaryingVectors: t.getParameter(tt),
                    maxFragmentUniforms: t.getParameter(at),
                    glsl: t.getParameter(lt),
                    renderer: t.getParameter(ft),
                    vendor: t.getParameter(ut),
                    version: t.getParameter(ct),
                    readFloat: o,
                    npotTextureCube: h
                };
            };
            function wt(e) {
                return !!e && typeof e === "object" && Array.isArray(e.shape) && Array.isArray(e.stride) && typeof e.offset === "number" && e.shape.length === e.stride.length && (Array.isArray(e.data) || ne(e.data));
            }
            var Rt = function e(t) {
                return Object.keys(t).map(function(e) {
                    return t[e];
                });
            }, Ot = {
                shape: Dt,
                flatten: It
            };
            function Ct(e, t, n) {
                for (var r = 0; r < t; ++r) {
                    n[r] = e[r];
                }
            }
            function Bt(e, t, n, r) {
                var i = 0;
                for (var a = 0; a < t; ++a) {
                    var o = e[a];
                    for (var s = 0; s < n; ++s) {
                        r[i++] = o[s];
                    }
                }
            }
            function Ft(e, t, n, r, i, a) {
                var o = a;
                for (var s = 0; s < t; ++s) {
                    var u = e[s];
                    for (var f = 0; f < n; ++f) {
                        var c = u[f];
                        for (var l = 0; l < r; ++l) {
                            i[o++] = c[l];
                        }
                    }
                }
            }
            function Pt(e, t, n, r, i) {
                var a = 1;
                for (var o = n + 1; o < t.length; ++o) {
                    a *= t[o];
                }
                var s = t[n];
                if (t.length - n === 4) {
                    var u = t[n + 1];
                    var f = t[n + 2];
                    var c = t[n + 3];
                    for (o = 0; o < s; ++o) {
                        Ft(e[o], u, f, c, r, i);
                        i += a;
                    }
                } else {
                    for (o = 0; o < s; ++o) {
                        Pt(e[o], t, n + 1, r, i);
                        i += a;
                    }
                }
            }
            function It(e, t, n, r) {
                var i = 1;
                if (t.length) {
                    for (var a = 0; a < t.length; ++a) {
                        i *= t[a];
                    }
                } else {
                    i = 0;
                }
                var o = r || Ne.allocType(n, i);
                switch (t.length) {
                  case 0:
                    break;

                  case 1:
                    Ct(e, t[0], o);
                    break;

                  case 2:
                    Bt(e, t[0], t[1], o);
                    break;

                  case 3:
                    Ft(e, t[0], t[1], t[2], o, 0);
                    break;

                  default:
                    Pt(e, t, 0, o, 0);
                }
                return o;
            }
            function Dt(e) {
                var t = [];
                for (var n = e; n.length; n = n[0]) {
                    t.push(n.length);
                }
                return t;
            }
            var Nt = {
                "[object Int8Array]": 5120,
                "[object Int16Array]": 5122,
                "[object Int32Array]": 5124,
                "[object Uint8Array]": 5121,
                "[object Uint8ClampedArray]": 5121,
                "[object Uint16Array]": 5123,
                "[object Uint32Array]": 5125,
                "[object Float32Array]": 5126,
                "[object Float64Array]": 5121,
                "[object ArrayBuffer]": 5121
            }, Lt, Ut, qt, zt, Gt, Ht, Vt, kt, jt = {
                int8: 5120,
                int16: 5122,
                int32: 5124,
                uint8: 5121,
                uint16: 5123,
                uint32: 5125,
                float: 5126,
                float32: 5126
            }, Wt, Xt, Yt = {
                dynamic: 35048,
                stream: 35040,
                static: 35044
            }, Kt = Ot.flatten, Jt = Ot.shape, Qt = 35044, Zt = 35040, $t = 5121, en = 5126, tn = [];
            function nn(e) {
                return Nt[Object.prototype.toString.call(e)] | 0;
            }
            function rn(e, t) {
                for (var n = 0; n < t.length; ++n) {
                    e[n] = t[n];
                }
            }
            function an(e, t, n, r, i, a, o) {
                var s = 0;
                for (var u = 0; u < n; ++u) {
                    for (var f = 0; f < r; ++f) {
                        e[s++] = t[i * u + a * f + o];
                    }
                }
            }
            function on(s, i, u, n) {
                var t = 0;
                var a = {};
                function f(e) {
                    this.id = t++;
                    this.buffer = s.createBuffer();
                    this.type = e;
                    this.usage = Qt;
                    this.byteLength = 0;
                    this.dimension = 1;
                    this.dtype = $t;
                    this.persistentData = null;
                    if (u.profile) {
                        this.stats = {
                            size: 0
                        };
                    }
                }
                f.prototype.bind = function() {
                    s.bindBuffer(this.type, this.buffer);
                };
                f.prototype.destroy = function() {
                    l(this);
                };
                var r = [];
                function e(e, t) {
                    var n = r.pop();
                    if (!n) {
                        n = new f(e);
                    }
                    n.bind();
                    c(n, t, Zt, 0, 1, false);
                    return n;
                }
                function o(e) {
                    r.push(e);
                }
                function _(e, t, n) {
                    e.byteLength = t.byteLength;
                    s.bufferData(e.type, t, n);
                }
                function c(e, t, n, r, i, a) {
                    var o;
                    e.usage = n;
                    if (Array.isArray(t)) {
                        e.dtype = r || en;
                        if (t.length > 0) {
                            var s;
                            if (Array.isArray(t[0])) {
                                o = Jt(t);
                                var u = 1;
                                for (var f = 1; f < o.length; ++f) {
                                    u *= o[f];
                                }
                                e.dimension = u;
                                s = Kt(t, o, e.dtype);
                                _(e, s, n);
                                if (a) {
                                    e.persistentData = s;
                                } else {
                                    Ne.freeType(s);
                                }
                            } else if (typeof t[0] === "number") {
                                e.dimension = i;
                                var c = Ne.allocType(e.dtype, t.length);
                                rn(c, t);
                                _(e, c, n);
                                if (a) {
                                    e.persistentData = c;
                                } else {
                                    Ne.freeType(c);
                                }
                            } else if (ne(t[0])) {
                                e.dimension = t[0].length;
                                e.dtype = r || nn(t[0]) || en;
                                s = Kt(t, [ t.length, t[0].length ], e.dtype);
                                _(e, s, n);
                                if (a) {
                                    e.persistentData = s;
                                } else {
                                    Ne.freeType(s);
                                }
                            } else {
                                fe.raise("invalid buffer data");
                            }
                        }
                    } else if (ne(t)) {
                        e.dtype = r || nn(t);
                        e.dimension = i;
                        _(e, t, n);
                        if (a) {
                            e.persistentData = new Uint8Array(new Uint8Array(t.buffer));
                        }
                    } else if (wt(t)) {
                        o = t.shape;
                        var l = t.stride;
                        var h = t.offset;
                        var d = 0;
                        var p = 0;
                        var v = 0;
                        var m = 0;
                        if (o.length === 1) {
                            d = o[0];
                            p = 1;
                            v = l[0];
                            m = 0;
                        } else if (o.length === 2) {
                            d = o[0];
                            p = o[1];
                            v = l[0];
                            m = l[1];
                        } else {
                            fe.raise("invalid shape");
                        }
                        e.dtype = r || nn(t.data) || en;
                        e.dimension = p;
                        var g = Ne.allocType(e.dtype, d * p);
                        an(g, t.data, d, p, v, m, h);
                        _(e, g, n);
                        if (a) {
                            e.persistentData = g;
                        } else {
                            Ne.freeType(g);
                        }
                    } else if (t instanceof ArrayBuffer) {
                        e.dtype = $t;
                        e.dimension = i;
                        _(e, t, n);
                        if (a) {
                            e.persistentData = new Uint8Array(new Uint8Array(t));
                        }
                    } else {
                        fe.raise("invalid buffer data");
                    }
                }
                function l(e) {
                    i.bufferCount--;
                    n(e);
                    var t = e.buffer;
                    fe(t, "buffer must not be deleted already");
                    s.deleteBuffer(t);
                    e.buffer = null;
                    delete a[e.id];
                }
                function h(e, t, n, o) {
                    i.bufferCount++;
                    var d = new f(t);
                    a[d.id] = d;
                    function p(e) {
                        var t = Qt;
                        var n = null;
                        var r = 0;
                        var i = 0;
                        var a = 1;
                        if (Array.isArray(e) || ne(e) || wt(e) || e instanceof ArrayBuffer) {
                            n = e;
                        } else if (typeof e === "number") {
                            r = e | 0;
                        } else if (e) {
                            fe.type(e, "object", "buffer arguments must be an object, a number or an array");
                            if ("data" in e) {
                                fe(n === null || Array.isArray(n) || ne(n) || wt(n), "invalid data for buffer");
                                n = e.data;
                            }
                            if ("usage" in e) {
                                fe.parameter(e.usage, Yt, "invalid buffer usage");
                                t = Yt[e.usage];
                            }
                            if ("type" in e) {
                                fe.parameter(e.type, jt, "invalid buffer type");
                                i = jt[e.type];
                            }
                            if ("dimension" in e) {
                                fe.type(e.dimension, "number", "invalid dimension");
                                a = e.dimension | 0;
                            }
                            if ("length" in e) {
                                fe.nni(r, "buffer length must be a nonnegative integer");
                                r = e.length | 0;
                            }
                        }
                        d.bind();
                        if (!n) {
                            if (r) s.bufferData(d.type, r, t);
                            d.dtype = i || $t;
                            d.usage = t;
                            d.dimension = a;
                            d.byteLength = r;
                        } else {
                            c(d, n, t, i, a, o);
                        }
                        if (u.profile) {
                            d.stats.size = d.byteLength * tn[d.dtype];
                        }
                        return p;
                    }
                    function v(e, t) {
                        fe(t + e.byteLength <= d.byteLength, "invalid buffer subdata call, buffer is too small. " + " Can't write data of size " + e.byteLength + " starting from offset " + t + " to a buffer of size " + d.byteLength);
                        s.bufferSubData(d.type, t, e);
                    }
                    function r(e, t) {
                        var n = (t || 0) | 0;
                        var r;
                        d.bind();
                        if (ne(e) || e instanceof ArrayBuffer) {
                            v(e, n);
                        } else if (Array.isArray(e)) {
                            if (e.length > 0) {
                                if (typeof e[0] === "number") {
                                    var i = Ne.allocType(d.dtype, e.length);
                                    rn(i, e);
                                    v(i, n);
                                    Ne.freeType(i);
                                } else if (Array.isArray(e[0]) || ne(e[0])) {
                                    r = Jt(e);
                                    var a = Kt(e, r, d.dtype);
                                    v(a, n);
                                    Ne.freeType(a);
                                } else {
                                    fe.raise("invalid buffer data");
                                }
                            }
                        } else if (wt(e)) {
                            r = e.shape;
                            var o = e.stride;
                            var s = 0;
                            var u = 0;
                            var f = 0;
                            var c = 0;
                            if (r.length === 1) {
                                s = r[0];
                                u = 1;
                                f = o[0];
                                c = 0;
                            } else if (r.length === 2) {
                                s = r[0];
                                u = r[1];
                                f = o[0];
                                c = o[1];
                            } else {
                                fe.raise("invalid shape");
                            }
                            var l = Array.isArray(e.data) ? d.dtype : nn(e.data);
                            var h = Ne.allocType(l, s * u);
                            an(h, e.data, s, u, f, c, e.offset);
                            v(h, n);
                            Ne.freeType(h);
                        } else {
                            fe.raise("invalid data for buffer subdata");
                        }
                        return p;
                    }
                    if (!n) {
                        p(e);
                    }
                    p._reglType = "buffer";
                    p._buffer = d;
                    p.subdata = r;
                    if (u.profile) {
                        p.stats = d.stats;
                    }
                    p.destroy = function() {
                        l(d);
                    };
                    return p;
                }
                function d() {
                    Rt(a).forEach(function(e) {
                        e.buffer = s.createBuffer();
                        s.bindBuffer(e.type, e.buffer);
                        s.bufferData(e.type, e.persistentData || e.byteLength, e.usage);
                    });
                }
                if (u.profile) {
                    i.getTotalBufferSize = function() {
                        var t = 0;
                        Object.keys(a).forEach(function(e) {
                            t += a[e].stats.size;
                        });
                        return t;
                    };
                }
                return {
                    create: h,
                    createStream: e,
                    destroyStream: o,
                    clear: function e() {
                        Rt(a).forEach(l);
                        r.forEach(l);
                    },
                    getBuffer: function e(t) {
                        if (t && t._buffer instanceof f) {
                            return t._buffer;
                        }
                        return null;
                    },
                    restore: d,
                    _initBuffer: c
                };
            }
            tn[5120] = 1, tn[5122] = 2, tn[5124] = 4, tn[5121] = 1, tn[5123] = 2, tn[5125] = 4;
            var sn, un, fn, cn, ln, hn, dn = {
                points: 0,
                point: 0,
                lines: 1,
                line: 1,
                triangles: tn[5126] = 4,
                triangle: 4,
                "line loop": 2,
                "line strip": 3,
                "triangle strip": 5,
                "triangle fan": 6
            }, pn = 0, vn = 1, mn = 4, gn = 5120, _n = 5121, xn = 5122, bn = 5123, yn = 5124, An = 5125, Tn = 34963, En = 35040, Mn = 35044;
            function Sn(h, d, p, n) {
                var t = {};
                var r = 0;
                var c = {
                    uint8: _n,
                    uint16: bn
                };
                if (d.oes_element_index_uint) {
                    c.uint32 = An;
                }
                function i(e) {
                    this.id = r++;
                    t[this.id] = this;
                    this.buffer = e;
                    this.primType = mn;
                    this.vertCount = 0;
                    this.type = 0;
                }
                i.prototype.bind = function() {
                    this.buffer.bind();
                };
                var a = [];
                function e(e) {
                    var t = a.pop();
                    if (!t) {
                        t = new i(p.create(null, Tn, true, false)._buffer);
                    }
                    l(t, e, En, -1, -1, 0, 0);
                    return t;
                }
                function o(e) {
                    a.push(e);
                }
                function l(e, t, n, r, i, a, o) {
                    e.buffer.bind();
                    var s;
                    if (t) {
                        var u = o;
                        if (!o && (!ne(t) || wt(t) && !ne(t.data))) {
                            u = d.oes_element_index_uint ? An : bn;
                        }
                        p._initBuffer(e.buffer, t, n, u, 3);
                    } else {
                        h.bufferData(Tn, a, n);
                        e.buffer.dtype = s || _n;
                        e.buffer.usage = n;
                        e.buffer.dimension = 3;
                        e.buffer.byteLength = a;
                    }
                    s = o;
                    if (!o) {
                        switch (e.buffer.dtype) {
                          case _n:
                          case gn:
                            s = _n;
                            break;

                          case bn:
                          case xn:
                            s = bn;
                            break;

                          case An:
                          case yn:
                            s = An;
                            break;

                          default:
                            fe.raise("unsupported type for element array");
                        }
                        e.buffer.dtype = s;
                    }
                    e.type = s;
                    fe(s !== An || !!d.oes_element_index_uint, "32 bit element buffers not supported, enable oes_element_index_uint first");
                    var f = i;
                    if (f < 0) {
                        f = e.buffer.byteLength;
                        if (s === bn) {
                            f >>= 1;
                        } else if (s === An) {
                            f >>= 2;
                        }
                    }
                    e.vertCount = f;
                    var c = r;
                    if (r < 0) {
                        c = mn;
                        var l = e.buffer.dimension;
                        if (l === 1) c = pn;
                        if (l === 2) c = vn;
                        if (l === 3) c = mn;
                    }
                    e.primType = c;
                }
                function v(e) {
                    n.elementsCount--;
                    fe(e.buffer !== null, "must not double destroy elements");
                    delete t[e.id];
                    e.buffer.destroy();
                    e.buffer = null;
                }
                function s(e, t) {
                    var s = p.create(null, Tn, true);
                    var u = new i(s._buffer);
                    n.elementsCount++;
                    function f(e) {
                        if (!e) {
                            s();
                            u.primType = mn;
                            u.vertCount = 0;
                            u.type = _n;
                        } else if (typeof e === "number") {
                            s(e);
                            u.primType = mn;
                            u.vertCount = e | 0;
                            u.type = _n;
                        } else {
                            var t = null;
                            var n = Mn;
                            var r = -1;
                            var i = -1;
                            var a = 0;
                            var o = 0;
                            if (Array.isArray(e) || ne(e) || wt(e)) {
                                t = e;
                            } else {
                                fe.type(e, "object", "invalid arguments for elements");
                                if ("data" in e) {
                                    t = e.data;
                                    fe(Array.isArray(t) || ne(t) || wt(t), "invalid data for element buffer");
                                }
                                if ("usage" in e) {
                                    fe.parameter(e.usage, Yt, "invalid element buffer usage");
                                    n = Yt[e.usage];
                                }
                                if ("primitive" in e) {
                                    fe.parameter(e.primitive, dn, "invalid element buffer primitive");
                                    r = dn[e.primitive];
                                }
                                if ("count" in e) {
                                    fe(typeof e.count === "number" && e.count >= 0, "invalid vertex count for elements");
                                    i = e.count | 0;
                                }
                                if ("type" in e) {
                                    fe.parameter(e.type, c, "invalid buffer type");
                                    o = c[e.type];
                                }
                                if ("length" in e) {
                                    a = e.length | 0;
                                } else {
                                    a = i;
                                    if (o === bn || o === xn) {
                                        a *= 2;
                                    } else if (o === An || o === yn) {
                                        a *= 4;
                                    }
                                }
                            }
                            l(u, t, n, r, i, a, o);
                        }
                        return f;
                    }
                    f(e);
                    f._reglType = "elements";
                    f._elements = u;
                    f.subdata = function(e, t) {
                        s.subdata(e, t);
                        return f;
                    };
                    f.destroy = function() {
                        v(u);
                    };
                    return f;
                }
                return {
                    create: s,
                    createStream: e,
                    destroyStream: o,
                    getElements: function e(t) {
                        if (typeof t === "function" && t._elements instanceof i) {
                            return t._elements;
                        }
                        return null;
                    },
                    clear: function e() {
                        Rt(t).forEach(v);
                    }
                };
            }
            var wn = new Float32Array(1), Rn = new Uint32Array(wn.buffer), On = 5123;
            function Cn(e) {
                var t = Ne.allocType(On, e.length);
                for (var n = 0; n < e.length; ++n) {
                    if (isNaN(e[n])) {
                        t[n] = 65535;
                    } else if (e[n] === Infinity) {
                        t[n] = 31744;
                    } else if (e[n] === -Infinity) {
                        t[n] = 64512;
                    } else {
                        wn[0] = e[n];
                        var r = Rn[0];
                        var i = r >>> 31 << 15;
                        var a = (r << 1 >>> 24) - 127;
                        var o = r >> 13 & (1 << 10) - 1;
                        if (a < -24) {
                            t[n] = i;
                        } else if (a < -14) {
                            var s = -14 - a;
                            t[n] = i + (o + (1 << 10) >> s);
                        } else if (a > 15) {
                            t[n] = i + 31744;
                        } else {
                            t[n] = i + (a + 15 << 10) + o;
                        }
                    }
                }
                return t;
            }
            function Bn(e) {
                return Array.isArray(e) || ne(e);
            }
            var Fn = function e(t) {
                return !(t & t - 1) && !!t;
            }, Pn = 34467, In = 3553, Dn = 34067, Nn = 34069, Ln = 6408, Un = 6406, qn = 6407, zn = 6409, Gn = 6410, Hn = 32854, Vn = 32855, kn = 36194, jn = 32819, Wn = 32820, Xn = 33635, Yn = 34042, Kn = 6402, Jn = 34041, Qn = 35904, Zn = 35906, $n = 36193, er = 33776, tr = 33777, nr = 33778, rr = 33779, ir = 35986, ar = 35987, or = 34798, sr = 35840, ur = 35841, fr = 35842, cr = 35843, lr = 36196, hr = 5121, dr = 5123, pr = 5125, vr = 5126, mr = 10242, gr = 10243, _r = 10497, xr = 33071, br = 33648, yr = 10240, Ar = 10241, Tr = 9728, Er = 9729, Mr = 9984, Sr = 9985, wr = 9986, Rr = 9987, Or = 33170, Cr = 4352, Br = 4353, Fr = 4354, Pr = 34046, Ir = 3317, Dr = 37440, Nr = 37441, Lr = 37443, Ur = 37444, qr = 33984, zr = [ Mr, wr, Sr, Rr ], Gr = [ 0, zn, Gn, qn, Ln ], Hr = {};
            function Vr(e) {
                return "[object " + e + "]";
            }
            Hr[zn] = Hr[Un] = Hr[Kn] = 1, Hr[Jn] = Hr[Gn] = 2, Hr[qn] = Hr[Qn] = 3, Hr[Ln] = Hr[Zn] = 4;
            var kr = Vr("HTMLCanvasElement"), jr = Vr("OffscreenCanvas"), Wr = Vr("CanvasRenderingContext2D"), Xr = Vr("ImageBitmap"), Yr = Vr("HTMLImageElement"), Kr = Vr("HTMLVideoElement"), Jr = Object.keys(Nt).concat([ kr, jr, Wr, Xr, Yr, Kr ]), Qr = [];
            Qr[hr] = 1, Qr[vr] = 4, Qr[$n] = 2, Qr[dr] = 2, Qr[pr] = 4;
            var Zr = [];
            function $r(e) {
                return Array.isArray(e) && (e.length === 0 || typeof e[0] === "number");
            }
            function ei(e) {
                if (!Array.isArray(e)) {
                    return false;
                }
                var t = e.length;
                if (t === 0 || !Bn(e[0])) {
                    return false;
                }
                return true;
            }
            function ti(e) {
                return Object.prototype.toString.call(e);
            }
            function ni(e) {
                return ti(e) === kr;
            }
            function ri(e) {
                return ti(e) === jr;
            }
            function ii(e) {
                return ti(e) === Wr;
            }
            function ai(e) {
                return ti(e) === Xr;
            }
            function oi(e) {
                return ti(e) === Yr;
            }
            function si(e) {
                return ti(e) === Kr;
            }
            function ui(e) {
                if (!e) {
                    return false;
                }
                var t = ti(e);
                if (Jr.indexOf(t) >= 0) {
                    return true;
                }
                return $r(e) || ei(e) || wt(e);
            }
            function fi(e) {
                return Nt[Object.prototype.toString.call(e)] | 0;
            }
            function ci(e, t) {
                var n = t.length;
                switch (e.type) {
                  case hr:
                  case dr:
                  case pr:
                  case vr:
                    var r = Ne.allocType(e.type, n);
                    r.set(t);
                    e.data = r;
                    break;

                  case $n:
                    e.data = Cn(t);
                    break;

                  default:
                    fe.raise("unsupported texture type, must specify a typed array");
                }
            }
            function li(e, t) {
                return Ne.allocType(e.type === $n ? vr : e.type, t);
            }
            function hi(e, t) {
                if (e.type === $n) {
                    e.data = Cn(t);
                    Ne.freeType(t);
                } else {
                    e.data = t;
                }
            }
            function di(e, t, n, r, i, a) {
                var o = e.width;
                var s = e.height;
                var u = e.channels;
                var f = o * s * u;
                var c = li(e, f);
                var l = 0;
                for (var h = 0; h < s; ++h) {
                    for (var d = 0; d < o; ++d) {
                        for (var p = 0; p < u; ++p) {
                            c[l++] = t[n * d + r * h + i * p + a];
                        }
                    }
                }
                hi(e, c);
            }
            function pi(e, t, n, r, i, a) {
                var o;
                if (typeof Zr[e] !== "undefined") {
                    o = Zr[e];
                } else {
                    o = Hr[e] * Qr[t];
                }
                if (a) {
                    o *= 6;
                }
                if (i) {
                    var s = 0;
                    var u = n;
                    while (u >= 1) {
                        s += o * u * u;
                        u /= 2;
                    }
                    return s;
                } else {
                    return o * n * r;
                }
            }
            function vi(d, c, y, h, A, u, p) {
                var l = {
                    "don't care": Cr,
                    "dont care": Cr,
                    nice: Fr,
                    fast: Br
                };
                var v = {
                    repeat: _r,
                    clamp: xr,
                    mirror: br
                };
                var m = {
                    nearest: Tr,
                    linear: Er
                };
                var g = ue({
                    mipmap: Rr,
                    "nearest mipmap nearest": Mr,
                    "linear mipmap nearest": Sr,
                    "nearest mipmap linear": wr,
                    "linear mipmap linear": Rr
                }, m);
                var _ = {
                    none: 0,
                    browser: Ur
                };
                var x = {
                    uint8: hr,
                    rgba4: jn,
                    rgb565: Xn,
                    "rgb5 a1": Wn
                };
                var b = {
                    alpha: Un,
                    luminance: zn,
                    "luminance alpha": Gn,
                    rgb: qn,
                    rgba: Ln,
                    rgba4: Hn,
                    "rgb5 a1": Vn,
                    rgb565: kn
                };
                var T = {};
                if (c.ext_srgb) {
                    b.srgb = Qn;
                    b.srgba = Zn;
                }
                if (c.oes_texture_float) {
                    x.float32 = x["float"] = vr;
                }
                if (c.oes_texture_half_float) {
                    x["float16"] = x["half float"] = $n;
                }
                if (c.webgl_depth_texture) {
                    ue(b, {
                        depth: Kn,
                        "depth stencil": Jn
                    });
                    ue(x, {
                        uint16: dr,
                        uint32: pr,
                        "depth stencil": Yn
                    });
                }
                if (c.webgl_compressed_texture_s3tc) {
                    ue(T, {
                        "rgb s3tc dxt1": er,
                        "rgba s3tc dxt1": tr,
                        "rgba s3tc dxt3": nr,
                        "rgba s3tc dxt5": rr
                    });
                }
                if (c.webgl_compressed_texture_atc) {
                    ue(T, {
                        "rgb atc": ir,
                        "rgba atc explicit alpha": ar,
                        "rgba atc interpolated alpha": or
                    });
                }
                if (c.webgl_compressed_texture_pvrtc) {
                    ue(T, {
                        "rgb pvrtc 4bppv1": sr,
                        "rgb pvrtc 2bppv1": ur,
                        "rgba pvrtc 4bppv1": fr,
                        "rgba pvrtc 2bppv1": cr
                    });
                }
                if (c.webgl_compressed_texture_etc1) {
                    T["rgb etc1"] = lr;
                }
                var n = Array.prototype.slice.call(d.getParameter(Pn));
                Object.keys(T).forEach(function(e) {
                    var t = T[e];
                    if (n.indexOf(t) >= 0) {
                        b[e] = t;
                    }
                });
                var e = Object.keys(b);
                y.textureFormats = e;
                var E = [];
                Object.keys(b).forEach(function(e) {
                    var t = b[e];
                    E[t] = e;
                });
                var M = [];
                Object.keys(x).forEach(function(e) {
                    var t = x[e];
                    M[t] = e;
                });
                var S = [];
                Object.keys(m).forEach(function(e) {
                    var t = m[e];
                    S[t] = e;
                });
                var w = [];
                Object.keys(g).forEach(function(e) {
                    var t = g[e];
                    w[t] = e;
                });
                var R = [];
                Object.keys(v).forEach(function(e) {
                    var t = v[e];
                    R[t] = e;
                });
                var O = e.reduce(function(e, t) {
                    var n = b[t];
                    if (n === zn || n === Un || n === zn || n === Gn || n === Kn || n === Jn || c.ext_srgb && (n === Qn || n === Zn)) {
                        e[n] = n;
                    } else if (n === Vn || t.indexOf("rgba") >= 0) {
                        e[n] = Ln;
                    } else {
                        e[n] = qn;
                    }
                    return e;
                }, {});
                function r() {
                    this.internalformat = Ln;
                    this.format = Ln;
                    this.type = hr;
                    this.compressed = false;
                    this.premultiplyAlpha = false;
                    this.flipY = false;
                    this.unpackAlignment = 1;
                    this.colorSpace = Ur;
                    this.width = 0;
                    this.height = 0;
                    this.channels = 0;
                }
                function C(e, t) {
                    e.internalformat = t.internalformat;
                    e.format = t.format;
                    e.type = t.type;
                    e.compressed = t.compressed;
                    e.premultiplyAlpha = t.premultiplyAlpha;
                    e.flipY = t.flipY;
                    e.unpackAlignment = t.unpackAlignment;
                    e.colorSpace = t.colorSpace;
                    e.width = t.width;
                    e.height = t.height;
                    e.channels = t.channels;
                }
                function B(e, t) {
                    if (typeof t !== "object" || !t) {
                        return;
                    }
                    if ("premultiplyAlpha" in t) {
                        fe.type(t.premultiplyAlpha, "boolean", "invalid premultiplyAlpha");
                        e.premultiplyAlpha = t.premultiplyAlpha;
                    }
                    if ("flipY" in t) {
                        fe.type(t.flipY, "boolean", "invalid texture flip");
                        e.flipY = t.flipY;
                    }
                    if ("alignment" in t) {
                        fe.oneOf(t.alignment, [ 1, 2, 4, 8 ], "invalid texture unpack alignment");
                        e.unpackAlignment = t.alignment;
                    }
                    if ("colorSpace" in t) {
                        fe.parameter(t.colorSpace, _, "invalid colorSpace");
                        e.colorSpace = _[t.colorSpace];
                    }
                    if ("type" in t) {
                        var n = t.type;
                        fe(c.oes_texture_float || !(n === "float" || n === "float32"), "you must enable the OES_texture_float extension in order to use floating point textures.");
                        fe(c.oes_texture_half_float || !(n === "half float" || n === "float16"), "you must enable the OES_texture_half_float extension in order to use 16-bit floating point textures.");
                        fe(c.webgl_depth_texture || !(n === "uint16" || n === "uint32" || n === "depth stencil"), "you must enable the WEBGL_depth_texture extension in order to use depth/stencil textures.");
                        fe.parameter(n, x, "invalid texture type");
                        e.type = x[n];
                    }
                    var r = e.width;
                    var i = e.height;
                    var a = e.channels;
                    var o = false;
                    if ("shape" in t) {
                        fe(Array.isArray(t.shape) && t.shape.length >= 2, "shape must be an array");
                        r = t.shape[0];
                        i = t.shape[1];
                        if (t.shape.length === 3) {
                            a = t.shape[2];
                            fe(a > 0 && a <= 4, "invalid number of channels");
                            o = true;
                        }
                        fe(r >= 0 && r <= y.maxTextureSize, "invalid width");
                        fe(i >= 0 && i <= y.maxTextureSize, "invalid height");
                    } else {
                        if ("radius" in t) {
                            r = i = t.radius;
                            fe(r >= 0 && r <= y.maxTextureSize, "invalid radius");
                        }
                        if ("width" in t) {
                            r = t.width;
                            fe(r >= 0 && r <= y.maxTextureSize, "invalid width");
                        }
                        if ("height" in t) {
                            i = t.height;
                            fe(i >= 0 && i <= y.maxTextureSize, "invalid height");
                        }
                        if ("channels" in t) {
                            a = t.channels;
                            fe(a > 0 && a <= 4, "invalid number of channels");
                            o = true;
                        }
                    }
                    e.width = r | 0;
                    e.height = i | 0;
                    e.channels = a | 0;
                    var s = false;
                    if ("format" in t) {
                        var u = t.format;
                        fe(c.webgl_depth_texture || !(u === "depth" || u === "depth stencil"), "you must enable the WEBGL_depth_texture extension in order to use depth/stencil textures.");
                        fe.parameter(u, b, "invalid texture format");
                        var f = e.internalformat = b[u];
                        e.format = O[f];
                        if (u in x) {
                            if (!("type" in t)) {
                                e.type = x[u];
                            }
                        }
                        if (u in T) {
                            e.compressed = true;
                        }
                        s = true;
                    }
                    if (!o && s) {
                        e.channels = Hr[e.format];
                    } else if (o && !s) {
                        if (e.channels !== Gr[e.format]) {
                            e.format = e.internalformat = Gr[e.channels];
                        }
                    } else if (s && o) {
                        fe(e.channels === Hr[e.format], "number of channels inconsistent with specified format");
                    }
                }
                function F(e) {
                    d.pixelStorei(Dr, e.flipY);
                    d.pixelStorei(Nr, e.premultiplyAlpha);
                    d.pixelStorei(Lr, e.colorSpace);
                    d.pixelStorei(Ir, e.unpackAlignment);
                }
                function t() {
                    r.call(this);
                    this.xOffset = 0;
                    this.yOffset = 0;
                    this.data = null;
                    this.needsFree = false;
                    this.element = null;
                    this.needsCopy = false;
                }
                function P(e, t) {
                    var n = null;
                    if (ui(t)) {
                        n = t;
                    } else if (t) {
                        fe.type(t, "object", "invalid pixel data type");
                        B(e, t);
                        if ("x" in t) {
                            e.xOffset = t.x | 0;
                        }
                        if ("y" in t) {
                            e.yOffset = t.y | 0;
                        }
                        if (ui(t.data)) {
                            n = t.data;
                        }
                    }
                    fe(!e.compressed || n instanceof Uint8Array, "compressed texture data must be stored in a uint8array");
                    if (t.copy) {
                        fe(!n, "can not specify copy and data field for the same texture");
                        var r = A.viewportWidth;
                        var i = A.viewportHeight;
                        e.width = e.width || r - e.xOffset;
                        e.height = e.height || i - e.yOffset;
                        e.needsCopy = true;
                        fe(e.xOffset >= 0 && e.xOffset < r && e.yOffset >= 0 && e.yOffset < i && e.width > 0 && e.width <= r && e.height > 0 && e.height <= i, "copy texture read out of bounds");
                    } else if (!n) {
                        e.width = e.width || 1;
                        e.height = e.height || 1;
                        e.channels = e.channels || 4;
                    } else if (ne(n)) {
                        e.channels = e.channels || 4;
                        e.data = n;
                        if (!("type" in t) && e.type === hr) {
                            e.type = fi(n);
                        }
                    } else if ($r(n)) {
                        e.channels = e.channels || 4;
                        ci(e, n);
                        e.alignment = 1;
                        e.needsFree = true;
                    } else if (wt(n)) {
                        var a = n.data;
                        if (!Array.isArray(a) && e.type === hr) {
                            e.type = fi(a);
                        }
                        var o = n.shape;
                        var s = n.stride;
                        var u, f, c, l, h, d;
                        if (o.length === 3) {
                            c = o[2];
                            d = s[2];
                        } else {
                            fe(o.length === 2, "invalid ndarray pixel data, must be 2 or 3D");
                            c = 1;
                            d = 1;
                        }
                        u = o[0];
                        f = o[1];
                        l = s[0];
                        h = s[1];
                        e.alignment = 1;
                        e.width = u;
                        e.height = f;
                        e.channels = c;
                        e.format = e.internalformat = Gr[c];
                        e.needsFree = true;
                        di(e, a, l, h, d, n.offset);
                    } else if (ni(n) || ri(n) || ii(n)) {
                        if (ni(n) || ri(n)) {
                            e.element = n;
                        } else {
                            e.element = n.canvas;
                        }
                        e.width = e.element.width;
                        e.height = e.element.height;
                        e.channels = 4;
                    } else if (ai(n)) {
                        e.element = n;
                        e.width = n.width;
                        e.height = n.height;
                        e.channels = 4;
                    } else if (oi(n)) {
                        e.element = n;
                        e.width = n.naturalWidth;
                        e.height = n.naturalHeight;
                        e.channels = 4;
                    } else if (si(n)) {
                        e.element = n;
                        e.width = n.videoWidth;
                        e.height = n.videoHeight;
                        e.channels = 4;
                    } else if (ei(n)) {
                        var p = e.width || n[0].length;
                        var v = e.height || n.length;
                        var m = e.channels;
                        if (Bn(n[0][0])) {
                            m = m || n[0][0].length;
                        } else {
                            m = m || 1;
                        }
                        var g = Ot.shape(n);
                        var _ = 1;
                        for (var x = 0; x < g.length; ++x) {
                            _ *= g[x];
                        }
                        var b = li(e, _);
                        Ot.flatten(n, g, "", b);
                        hi(e, b);
                        e.alignment = 1;
                        e.width = p;
                        e.height = v;
                        e.channels = m;
                        e.format = e.internalformat = Gr[m];
                        e.needsFree = true;
                    }
                    if (e.type === vr) {
                        fe(y.extensions.indexOf("oes_texture_float") >= 0, "oes_texture_float extension not enabled");
                    } else if (e.type === $n) {
                        fe(y.extensions.indexOf("oes_texture_half_float") >= 0, "oes_texture_half_float extension not enabled");
                    }
                }
                function i(e, t, n) {
                    var r = e.element;
                    var i = e.data;
                    var a = e.internalformat;
                    var o = e.format;
                    var s = e.type;
                    var u = e.width;
                    var f = e.height;
                    a = Ge.getInternalFormat(d, o, s);
                    s = Ge.getTextureType(d, s);
                    F(e);
                    if (r) {
                        d.texImage2D(t, n, a, o, s, r);
                    } else if (e.compressed) {
                        d.compressedTexImage2D(t, n, a, u, f, 0, i);
                    } else if (e.needsCopy) {
                        h();
                        d.copyTexImage2D(t, n, o, e.xOffset, e.yOffset, u, f, 0);
                    } else {
                        d.texImage2D(t, n, a, u, f, 0, o, s, i || null);
                    }
                }
                function I(e, t, n, r, i) {
                    var a = e.element;
                    var o = e.data;
                    var s = e.internalformat;
                    var u = e.format;
                    var f = e.type;
                    var c = e.width;
                    var l = e.height;
                    F(e);
                    if (a) {
                        d.texSubImage2D(t, i, n, r, u, f, a);
                    } else if (e.compressed) {
                        d.compressedTexSubImage2D(t, i, n, r, s, c, l, o);
                    } else if (e.needsCopy) {
                        h();
                        d.copyTexSubImage2D(t, i, n, r, e.xOffset, e.yOffset, c, l);
                    } else {
                        d.texSubImage2D(t, i, n, r, c, l, u, f, o);
                    }
                }
                var a = [];
                function D() {
                    return a.pop() || new t();
                }
                function N(e) {
                    if (e.needsFree) {
                        Ne.freeType(e.data);
                    }
                    t.call(e);
                    a.push(e);
                }
                function o() {
                    r.call(this);
                    this.genMipmaps = false;
                    this.mipmapHint = Cr;
                    this.mipmask = 0;
                    this.images = Array(16);
                }
                function L(e, t, n) {
                    var r = e.images[0] = D();
                    e.mipmask = 1;
                    r.width = e.width = t;
                    r.height = e.height = n;
                    r.channels = e.channels = 4;
                }
                function U(e, t) {
                    var n = null;
                    if (ui(t)) {
                        n = e.images[0] = D();
                        C(n, e);
                        P(n, t);
                        e.mipmask = 1;
                    } else {
                        B(e, t);
                        if (Array.isArray(t.mipmap)) {
                            var r = t.mipmap;
                            for (var i = 0; i < r.length; ++i) {
                                n = e.images[i] = D();
                                C(n, e);
                                n.width >>= i;
                                n.height >>= i;
                                P(n, r[i]);
                                e.mipmask |= 1 << i;
                            }
                        } else {
                            n = e.images[0] = D();
                            C(n, e);
                            P(n, t);
                            e.mipmask = 1;
                        }
                    }
                    C(e, e.images[0]);
                    if (e.compressed && (e.internalformat === er || e.internalformat === tr || e.internalformat === nr || e.internalformat === rr)) {
                        fe(e.width % 4 === 0 && e.height % 4 === 0, "for compressed texture formats, mipmap level 0 must have width and height that are a multiple of 4");
                    }
                }
                function q(e, t) {
                    var n = e.images;
                    for (var r = 0; r < n.length; ++r) {
                        if (!n[r]) {
                            return;
                        }
                        i(n[r], t, r);
                    }
                }
                var s = [];
                function z() {
                    var e = s.pop() || new o();
                    r.call(e);
                    e.mipmask = 0;
                    for (var t = 0; t < 16; ++t) {
                        e.images[t] = null;
                    }
                    return e;
                }
                function G(e) {
                    var t = e.images;
                    for (var n = 0; n < t.length; ++n) {
                        if (t[n]) {
                            N(t[n]);
                        }
                        t[n] = null;
                    }
                    s.push(e);
                }
                function H() {
                    this.minFilter = Tr;
                    this.magFilter = Tr;
                    this.wrapS = xr;
                    this.wrapT = xr;
                    this.anisotropic = 1;
                    this.genMipmaps = false;
                    this.mipmapHint = Cr;
                }
                function V(e, t) {
                    if ("min" in t) {
                        var n = t.min;
                        fe.parameter(n, g);
                        e.minFilter = g[n];
                        if (zr.indexOf(e.minFilter) >= 0 && !("faces" in t)) {
                            e.genMipmaps = true;
                        }
                    }
                    if ("mag" in t) {
                        var r = t.mag;
                        fe.parameter(r, m);
                        e.magFilter = m[r];
                    }
                    var i = e.wrapS;
                    var a = e.wrapT;
                    if ("wrap" in t) {
                        var o = t.wrap;
                        if (typeof o === "string") {
                            fe.parameter(o, v);
                            i = a = v[o];
                        } else if (Array.isArray(o)) {
                            fe.parameter(o[0], v);
                            fe.parameter(o[1], v);
                            i = v[o[0]];
                            a = v[o[1]];
                        }
                    } else {
                        if ("wrapS" in t) {
                            var s = t.wrapS;
                            fe.parameter(s, v);
                            i = v[s];
                        }
                        if ("wrapT" in t) {
                            var u = t.wrapT;
                            fe.parameter(u, v);
                            a = v[u];
                        }
                    }
                    e.wrapS = i;
                    e.wrapT = a;
                    if ("anisotropic" in t) {
                        var f = t.anisotropic;
                        fe(typeof f === "number" && f >= 1 && f <= y.maxAnisotropic, "aniso samples must be between 1 and ");
                        e.anisotropic = t.anisotropic;
                    }
                    if ("mipmap" in t) {
                        var c = false;
                        switch (typeof t.mipmap) {
                          case "string":
                            fe.parameter(t.mipmap, l, "invalid mipmap hint");
                            e.mipmapHint = l[t.mipmap];
                            e.genMipmaps = true;
                            c = true;
                            break;

                          case "boolean":
                            c = e.genMipmaps = t.mipmap;
                            break;

                          case "object":
                            fe(Array.isArray(t.mipmap), "invalid mipmap type");
                            e.genMipmaps = false;
                            c = true;
                            break;

                          default:
                            fe.raise("invalid mipmap type");
                        }
                        if (c && !("min" in t)) {
                            e.minFilter = Mr;
                        }
                    }
                }
                function k(e, t) {
                    d.texParameteri(t, Ar, e.minFilter);
                    d.texParameteri(t, yr, e.magFilter);
                    d.texParameteri(t, mr, e.wrapS);
                    d.texParameteri(t, gr, e.wrapT);
                    if (c.ext_texture_filter_anisotropic) {
                        d.texParameteri(t, Pr, e.anisotropic);
                    }
                    if (e.genMipmaps) {
                        d.hint(Or, e.mipmapHint);
                        d.generateMipmap(t);
                    }
                }
                var f = 0;
                var j = {};
                var W = y.maxTextureUnits;
                var X = Array(W).map(function() {
                    return null;
                });
                function Y(e) {
                    r.call(this);
                    this.mipmask = 0;
                    this.internalformat = Ln;
                    this.id = f++;
                    this.refCount = 1;
                    this.target = e;
                    this.texture = d.createTexture();
                    this.unit = -1;
                    this.bindCount = 0;
                    this.texInfo = new H();
                    if (p.profile) {
                        this.stats = {
                            size: 0
                        };
                    }
                }
                function K(e) {
                    d.activeTexture(qr);
                    d.bindTexture(e.target, e.texture);
                }
                function J() {
                    var e = X[0];
                    if (e) {
                        d.bindTexture(e.target, e.texture);
                    } else {
                        d.bindTexture(In, null);
                    }
                }
                function Q(e) {
                    var t = e.texture;
                    fe(t, "must not double destroy texture");
                    var n = e.unit;
                    var r = e.target;
                    if (n >= 0) {
                        d.activeTexture(qr + n);
                        d.bindTexture(r, null);
                        X[n] = null;
                    }
                    d.deleteTexture(t);
                    e.texture = null;
                    e.params = null;
                    e.pixels = null;
                    e.refCount = 0;
                    delete j[e.id];
                    u.textureCount--;
                }
                ue(Y.prototype, {
                    bind: function e() {
                        var t = this;
                        t.bindCount += 1;
                        var n = t.unit;
                        if (n < 0) {
                            for (var r = 0; r < W; ++r) {
                                var i = X[r];
                                if (i) {
                                    if (i.bindCount > 0) {
                                        continue;
                                    }
                                    i.unit = -1;
                                }
                                X[r] = t;
                                n = r;
                                break;
                            }
                            if (n >= W) {
                                fe.raise("insufficient number of texture units");
                            }
                            if (p.profile && u.maxTextureUnits < n + 1) {
                                u.maxTextureUnits = n + 1;
                            }
                            t.unit = n;
                            d.activeTexture(qr + n);
                            d.bindTexture(t.target, t.texture);
                        }
                        return n;
                    },
                    unbind: function e() {
                        this.bindCount -= 1;
                    },
                    decRef: function e() {
                        if (--this.refCount <= 0) {
                            Q(this);
                        }
                    }
                });
                function Z(e, t) {
                    var f = new Y(In);
                    j[f.id] = f;
                    u.textureCount++;
                    function c(e, t) {
                        var n = f.texInfo;
                        H.call(n);
                        var r = z();
                        if (typeof e === "number") {
                            if (typeof t === "number") {
                                L(r, e | 0, t | 0);
                            } else {
                                L(r, e | 0, e | 0);
                            }
                        } else if (e) {
                            fe.type(e, "object", "invalid arguments to regl.texture");
                            V(n, e);
                            U(r, e);
                        } else {
                            L(r, 1, 1);
                        }
                        if (n.genMipmaps) {
                            r.mipmask = (r.width << 1) - 1;
                        }
                        f.mipmask = r.mipmask;
                        C(f, r);
                        fe.texture2D(n, r, y);
                        f.internalformat = r.internalformat;
                        c.width = r.width;
                        c.height = r.height;
                        K(f);
                        q(r, In);
                        k(n, In);
                        J();
                        G(r);
                        if (p.profile) {
                            f.stats.size = pi(f.internalformat, f.type, r.width, r.height, n.genMipmaps, false);
                        }
                        c.format = E[f.internalformat];
                        c.type = M[f.type];
                        c.mag = S[n.magFilter];
                        c.min = w[n.minFilter];
                        c.wrapS = R[n.wrapS];
                        c.wrapT = R[n.wrapT];
                        return c;
                    }
                    function n(e, t, n, r) {
                        fe(!!e, "must specify image data");
                        var i = t | 0;
                        var a = n | 0;
                        var o = r | 0;
                        var s = D();
                        C(s, f);
                        s.width = 0;
                        s.height = 0;
                        P(s, e);
                        s.width = s.width || (f.width >> o) - i;
                        s.height = s.height || (f.height >> o) - a;
                        fe(f.type === s.type && f.format === s.format && f.internalformat === s.internalformat, "incompatible format for texture.subimage");
                        fe(i >= 0 && a >= 0 && i + s.width <= f.width && a + s.height <= f.height, "texture.subimage write out of bounds");
                        fe(f.mipmask & 1 << o, "missing mipmap data");
                        fe(s.data || s.element || s.needsCopy, "missing image data");
                        K(f);
                        I(s, In, i, a, o);
                        J();
                        N(s);
                        return c;
                    }
                    function r(e, t) {
                        var n = e | 0;
                        var r = t | 0 || n;
                        if (n === f.width && r === f.height) {
                            return c;
                        }
                        c.width = f.width = n;
                        c.height = f.height = r;
                        K(f);
                        var i = Ge.getInternalFormat(d, f.format, f.type);
                        var a = Ge.getTextureType(d, f.type);
                        for (var o = 0; f.mipmask >> o; ++o) {
                            var s = n >> o;
                            var u = r >> o;
                            if (!s || !u) break;
                            d.texImage2D(In, o, i, s, u, 0, f.format, a, null);
                        }
                        J();
                        if (p.profile) {
                            f.stats.size = pi(f.internalformat, f.type, n, r, false, false);
                        }
                        return c;
                    }
                    c(e, t);
                    c.subimage = n;
                    c.resize = r;
                    c._reglType = "texture2d";
                    c._texture = f;
                    if (p.profile) {
                        c.stats = f.stats;
                    }
                    c.destroy = function() {
                        f.decRef();
                    };
                    return c;
                }
                function $(e, t, n, r, i, a) {
                    var c = new Y(Dn);
                    j[c.id] = c;
                    u.cubeCount++;
                    var l = new Array(6);
                    function h(e, t, n, r, i, a) {
                        var o;
                        var s = c.texInfo;
                        H.call(s);
                        for (o = 0; o < 6; ++o) {
                            l[o] = z();
                        }
                        if (typeof e === "number" || !e) {
                            var u = e | 0 || 1;
                            for (o = 0; o < 6; ++o) {
                                L(l[o], u, u);
                            }
                        } else if (typeof e === "object") {
                            if (t) {
                                U(l[0], e);
                                U(l[1], t);
                                U(l[2], n);
                                U(l[3], r);
                                U(l[4], i);
                                U(l[5], a);
                            } else {
                                V(s, e);
                                B(c, e);
                                if ("faces" in e) {
                                    var f = e.faces;
                                    fe(Array.isArray(f) && f.length === 6, "cube faces must be a length 6 array");
                                    for (o = 0; o < 6; ++o) {
                                        fe(typeof f[o] === "object" && !!f[o], "invalid input for cube map face");
                                        C(l[o], c);
                                        U(l[o], f[o]);
                                    }
                                } else {
                                    for (o = 0; o < 6; ++o) {
                                        U(l[o], e);
                                    }
                                }
                            }
                        } else {
                            fe.raise("invalid arguments to cube map");
                        }
                        C(c, l[0]);
                        if (!y.npotTextureCube) {
                            fe(Fn(c.width) && Fn(c.height), "your browser does not support non power or two texture dimensions");
                        }
                        if (s.genMipmaps) {
                            c.mipmask = (l[0].width << 1) - 1;
                        } else {
                            c.mipmask = l[0].mipmask;
                        }
                        fe.textureCube(c, s, l, y);
                        c.internalformat = l[0].internalformat;
                        h.width = l[0].width;
                        h.height = l[0].height;
                        K(c);
                        for (o = 0; o < 6; ++o) {
                            q(l[o], Nn + o);
                        }
                        k(s, Dn);
                        J();
                        if (p.profile) {
                            c.stats.size = pi(c.internalformat, c.type, h.width, h.height, s.genMipmaps, true);
                        }
                        h.format = E[c.internalformat];
                        h.type = M[c.type];
                        h.mag = S[s.magFilter];
                        h.min = w[s.minFilter];
                        h.wrapS = R[s.wrapS];
                        h.wrapT = R[s.wrapT];
                        for (o = 0; o < 6; ++o) {
                            G(l[o]);
                        }
                        return h;
                    }
                    function o(e, t, n, r, i) {
                        fe(!!t, "must specify image data");
                        fe(typeof e === "number" && e === (e | 0) && e >= 0 && e < 6, "invalid face");
                        var a = n | 0;
                        var o = r | 0;
                        var s = i | 0;
                        var u = D();
                        C(u, c);
                        u.width = 0;
                        u.height = 0;
                        P(u, t);
                        u.width = u.width || (c.width >> s) - a;
                        u.height = u.height || (c.height >> s) - o;
                        fe(c.type === u.type && c.format === u.format && c.internalformat === u.internalformat, "incompatible format for texture.subimage");
                        fe(a >= 0 && o >= 0 && a + u.width <= c.width && o + u.height <= c.height, "texture.subimage write out of bounds");
                        fe(c.mipmask & 1 << s, "missing mipmap data");
                        fe(u.data || u.element || u.needsCopy, "missing image data");
                        K(c);
                        I(u, Nn + e, a, o, s);
                        J();
                        N(u);
                        return h;
                    }
                    function s(e) {
                        var t = e | 0;
                        if (t === c.width) {
                            return;
                        }
                        h.width = c.width = t;
                        h.height = c.height = t;
                        K(c);
                        for (var n = 0; n < 6; ++n) {
                            for (var r = 0; c.mipmask >> r; ++r) {
                                d.texImage2D(Nn + n, r, c.format, t >> r, t >> r, 0, c.format, c.type, null);
                            }
                        }
                        J();
                        if (p.profile) {
                            c.stats.size = pi(c.internalformat, c.type, h.width, h.height, false, true);
                        }
                        return h;
                    }
                    h(e, t, n, r, i, a);
                    h.subimage = o;
                    h.resize = s;
                    h._reglType = "textureCube";
                    h._texture = c;
                    if (p.profile) {
                        h.stats = c.stats;
                    }
                    h.destroy = function() {
                        c.decRef();
                    };
                    return h;
                }
                function ee() {
                    for (var e = 0; e < W; ++e) {
                        d.activeTexture(qr + e);
                        d.bindTexture(In, null);
                        X[e] = null;
                    }
                    Rt(j).forEach(Q);
                    u.cubeCount = 0;
                    u.textureCount = 0;
                }
                if (p.profile) {
                    u.getTotalTextureSize = function() {
                        var t = 0;
                        Object.keys(j).forEach(function(e) {
                            t += j[e].stats.size;
                        });
                        return t;
                    };
                }
                function te() {
                    for (var e = 0; e < W; ++e) {
                        var t = X[e];
                        if (t) {
                            t.bindCount = 0;
                            t.unit = -1;
                            X[e] = null;
                        }
                    }
                    Rt(j).forEach(function(e) {
                        e.texture = d.createTexture();
                        d.bindTexture(e.target, e.texture);
                        var t = Ge.getInternalFormat(d, e.format, e.type);
                        var n = Ge.getTextureType(d, e.type);
                        for (var r = 0; r < 32; ++r) {
                            if ((e.mipmask & 1 << r) === 0) {
                                continue;
                            }
                            if (e.target === In) {
                                d.texImage2D(In, r, t, e.width >> r, e.height >> r, 0, e.format, n, null);
                            } else {
                                for (var i = 0; i < 6; ++i) {
                                    d.texImage2D(Nn + i, r, t, e.width >> r, e.height >> r, 0, e.format, n, null);
                                }
                            }
                        }
                        k(e.texInfo, e.target);
                    });
                }
                return {
                    create2D: Z,
                    createCube: $,
                    clear: ee,
                    getTexture: function e(t) {
                        return null;
                    },
                    restore: te
                };
            }
            Zr[Hn] = 2, Zr[Vn] = 2, Zr[kn] = 2, Zr[Jn] = 4, Zr[er] = .5, Zr[tr] = .5, Zr[nr] = 1, 
            Zr[rr] = 1, Zr[ir] = .5, Zr[ar] = 1, Zr[or] = 1, Zr[sr] = .5, Zr[ur] = .25, Zr[fr] = .5, 
            Zr[cr] = .25, Zr[lr] = .5;
            var mi = 36161, gi = 32854, _i = 32855, xi = 36194, bi = 33189, yi = 36168, Ai = 34041, Ti = 35907, Ei = 34836, Mi = 34842, Si = 34843, wi = [];
            function Ri(e, t, n) {
                return wi[e] * t * n;
            }
            wi[gi] = 2, wi[_i] = 2, wi[xi] = 2, wi[bi] = 2, wi[yi] = 1, wi[Ai] = 4, wi[Ti] = 4, 
            wi[Ei] = 16, wi[Mi] = 8, wi[Si] = 6;
            var Oi = function e(f, t, c, r, l) {
                var h = {
                    rgba4: gi,
                    rgb565: xi,
                    "rgb5 a1": _i,
                    depth: bi,
                    stencil: yi,
                    "depth stencil": Ai
                };
                if (t.ext_srgb) {
                    h["srgba"] = Ti;
                }
                if (t.ext_color_buffer_half_float) {
                    h["rgba16f"] = Mi;
                    h["rgb16f"] = Si;
                }
                if (t.webgl_color_buffer_float) {
                    h["rgba32f"] = Ei;
                }
                var d = [];
                Object.keys(h).forEach(function(e) {
                    var t = h[e];
                    d[t] = e;
                });
                var n = 0;
                var i = {};
                function a(e) {
                    this.id = n++;
                    this.refCount = 1;
                    this.renderbuffer = e;
                    this.format = gi;
                    this.width = 0;
                    this.height = 0;
                    if (l.profile) {
                        this.stats = {
                            size: 0
                        };
                    }
                }
                a.prototype.decRef = function() {
                    if (--this.refCount <= 0) {
                        o(this);
                    }
                };
                function o(e) {
                    var t = e.renderbuffer;
                    fe(t, "must not double destroy renderbuffer");
                    f.bindRenderbuffer(mi, null);
                    f.deleteRenderbuffer(t);
                    e.renderbuffer = null;
                    e.refCount = 0;
                    delete i[e.id];
                    r.renderbufferCount--;
                }
                function s(e, t) {
                    var s = new a(f.createRenderbuffer());
                    i[s.id] = s;
                    r.renderbufferCount++;
                    function u(e, t) {
                        var n = 0;
                        var r = 0;
                        var i = gi;
                        if (typeof e === "object" && e) {
                            var a = e;
                            if ("shape" in a) {
                                var o = a.shape;
                                fe(Array.isArray(o) && o.length >= 2, "invalid renderbuffer shape");
                                n = o[0] | 0;
                                r = o[1] | 0;
                            } else {
                                if ("radius" in a) {
                                    n = r = a.radius | 0;
                                }
                                if ("width" in a) {
                                    n = a.width | 0;
                                }
                                if ("height" in a) {
                                    r = a.height | 0;
                                }
                            }
                            if ("format" in a) {
                                fe.parameter(a.format, h, "invalid renderbuffer format");
                                i = h[a.format];
                            }
                        } else if (typeof e === "number") {
                            n = e | 0;
                            if (typeof t === "number") {
                                r = t | 0;
                            } else {
                                r = n;
                            }
                        } else if (!e) {
                            n = r = 1;
                        } else {
                            fe.raise("invalid arguments to renderbuffer constructor");
                        }
                        fe(n > 0 && r > 0 && n <= c.maxRenderbufferSize && r <= c.maxRenderbufferSize, "invalid renderbuffer size");
                        if (n === s.width && r === s.height && i === s.format) {
                            return;
                        }
                        u.width = s.width = n;
                        u.height = s.height = r;
                        s.format = i;
                        f.bindRenderbuffer(mi, s.renderbuffer);
                        f.renderbufferStorage(mi, i, n, r);
                        if (l.profile) {
                            s.stats.size = Ri(s.format, s.width, s.height);
                        }
                        u.format = d[s.format];
                        return u;
                    }
                    function n(e, t) {
                        var n = e | 0;
                        var r = t | 0 || n;
                        if (n === s.width && r === s.height) {
                            return u;
                        }
                        fe(n > 0 && r > 0 && n <= c.maxRenderbufferSize && r <= c.maxRenderbufferSize, "invalid renderbuffer size");
                        u.width = s.width = n;
                        u.height = s.height = r;
                        f.bindRenderbuffer(mi, s.renderbuffer);
                        f.renderbufferStorage(mi, s.format, n, r);
                        fe(f.getError() === 0, "invalid render buffer format");
                        if (l.profile) {
                            s.stats.size = Ri(s.format, s.width, s.height);
                        }
                        return u;
                    }
                    u(e, t);
                    u.resize = n;
                    u._reglType = "renderbuffer";
                    u._renderbuffer = s;
                    if (l.profile) {
                        u.stats = s.stats;
                    }
                    u.destroy = function() {
                        s.decRef();
                    };
                    return u;
                }
                if (l.profile) {
                    r.getTotalRenderbufferSize = function() {
                        var t = 0;
                        Object.keys(i).forEach(function(e) {
                            t += i[e].stats.size;
                        });
                        return t;
                    };
                }
                function u() {
                    Rt(i).forEach(function(e) {
                        e.renderbuffer = f.createRenderbuffer();
                        f.bindRenderbuffer(mi, e.renderbuffer);
                        f.renderbufferStorage(mi, e.format, e.width, e.height);
                    });
                    f.bindRenderbuffer(mi, null);
                }
                return {
                    create: s,
                    clear: function e() {
                        Rt(i).forEach(o);
                    },
                    restore: u
                };
            }, Ci = 36160, Bi = 36161, Fi = 3553, Pi = 34069, Ii = 36064, Di = 36096, Ni = 36128, Li = 33306, Ui = 36053, qi = 36054, zi = 36055, Gi = 36057, Hi = 36061, Vi = 36193, ki = 5121, ji = 5126, Wi = 6407, Xi = 6408, Yi = 6402, Ki = [ Wi, Xi ], Ji = [];
            Ji[Xi] = 4, Ji[Wi] = 3;
            var Qi = [];
            Qi[ki] = 1, Qi[ji] = 4, Qi[Vi] = 2;
            var Zi, $i, ea, ta = 33189, na = 36168, ra = 34041, ia, aa, oa, sa, ua = [ 32854, 32855, 36194, 35907, 34842, 34843, 34836 ], fa = {};
            function ca(i, S, w, m, s, r) {
                var R = {
                    cur: null,
                    next: null,
                    dirty: false,
                    setFBO: null
                };
                var O = [ "rgba" ];
                var C = [ "rgba4", "rgb565", "rgb5 a1" ];
                if (S.ext_srgb) {
                    C.push("srgba");
                }
                if (S.ext_color_buffer_half_float) {
                    C.push("rgba16f", "rgb16f");
                }
                if (S.webgl_color_buffer_float) {
                    C.push("rgba32f");
                }
                var B = [ "uint8" ];
                if (S.oes_texture_half_float) {
                    B.push("half float", "float16");
                }
                if (S.oes_texture_float) {
                    B.push("float", "float32");
                }
                function u(e, t, n) {
                    this.target = e;
                    this.texture = t;
                    this.renderbuffer = n;
                    var r = 0;
                    var i = 0;
                    if (t) {
                        r = t.width;
                        i = t.height;
                    } else if (n) {
                        r = n.width;
                        i = n.height;
                    }
                    this.width = r;
                    this.height = i;
                }
                function t(e) {
                    if (e) {
                        if (e.texture) {
                            e.texture._texture.decRef();
                        }
                        if (e.renderbuffer) {
                            e.renderbuffer._renderbuffer.decRef();
                        }
                    }
                }
                function F(e, t, n) {
                    if (!e) {
                        return;
                    }
                    if (e.texture) {
                        var r = e.texture._texture;
                        var i = Math.max(1, r.width);
                        var a = Math.max(1, r.height);
                        fe(i === t && a === n, "inconsistent width/height for supplied texture");
                        r.refCount += 1;
                    } else {
                        var o = e.renderbuffer._renderbuffer;
                        fe(o.width === t && o.height === n, "inconsistent width/height for renderbuffer");
                        o.refCount += 1;
                    }
                }
                function a(e, t) {
                    if (t) {
                        if (t.texture) {
                            i.framebufferTexture2D(Ci, e, t.target, t.texture._texture.texture, 0);
                        } else {
                            i.framebufferRenderbuffer(Ci, e, Bi, t.renderbuffer._renderbuffer.renderbuffer);
                        }
                    }
                }
                function P(e) {
                    var t = Fi;
                    var n = null;
                    var r = null;
                    var i = e;
                    if (typeof e === "object") {
                        i = e.data;
                        if ("target" in e) {
                            t = e.target | 0;
                        }
                    }
                    fe.type(i, "function", "invalid attachment data");
                    var a = i._reglType;
                    if (a === "texture2d") {
                        n = i;
                        fe(t === Fi);
                    } else if (a === "textureCube") {
                        n = i;
                        fe(t >= Pi && t < Pi + 6, "invalid cube map target");
                    } else if (a === "renderbuffer") {
                        r = i;
                        t = Bi;
                    } else {
                        fe.raise("invalid regl object for attachment");
                    }
                    return new u(t, n, r);
                }
                function I(e, t, n, r, i) {
                    if (n) {
                        var a = m.create2D({
                            width: e,
                            height: t,
                            format: r,
                            type: i
                        });
                        a._texture.refCount = 0;
                        return new u(Fi, a, null);
                    } else {
                        var o = s.create({
                            width: e,
                            height: t,
                            format: r
                        });
                        o._renderbuffer.refCount = 0;
                        return new u(Bi, null, o);
                    }
                }
                function D(e) {
                    return e && (e.texture || e.renderbuffer);
                }
                function o(e, t, n) {
                    if (e) {
                        if (e.texture) {
                            e.texture.resize(t, n);
                        } else if (e.renderbuffer) {
                            e.renderbuffer.resize(t, n);
                        }
                        e.width = t;
                        e.height = n;
                    }
                }
                var e = 0;
                var n = {};
                function f() {
                    this.id = e++;
                    n[this.id] = this;
                    this.framebuffer = i.createFramebuffer();
                    this.width = 0;
                    this.height = 0;
                    this.colorAttachments = [];
                    this.depthAttachment = null;
                    this.stencilAttachment = null;
                    this.depthStencilAttachment = null;
                }
                function N(e) {
                    e.colorAttachments.forEach(t);
                    t(e.depthAttachment);
                    t(e.stencilAttachment);
                    t(e.depthStencilAttachment);
                }
                function c(e) {
                    var t = e.framebuffer;
                    fe(t, "must not double destroy framebuffer");
                    i.deleteFramebuffer(t);
                    e.framebuffer = null;
                    r.framebufferCount--;
                    delete n[e.id];
                }
                function L(e) {
                    var t;
                    i.bindFramebuffer(Ci, e.framebuffer);
                    var n = e.colorAttachments;
                    for (t = 0; t < n.length; ++t) {
                        a(Ii + t, n[t]);
                    }
                    for (t = n.length; t < w.maxColorAttachments; ++t) {
                        i.framebufferTexture2D(Ci, Ii + t, Fi, null, 0);
                    }
                    i.framebufferTexture2D(Ci, Li, Fi, null, 0);
                    i.framebufferTexture2D(Ci, Di, Fi, null, 0);
                    i.framebufferTexture2D(Ci, Ni, Fi, null, 0);
                    a(Di, e.depthAttachment);
                    a(Ni, e.stencilAttachment);
                    a(Li, e.depthStencilAttachment);
                    var r = i.checkFramebufferStatus(Ci);
                    if (!i.isContextLost() && r !== Ui) {
                        fe.raise("framebuffer configuration not supported, status = " + fa[r]);
                    }
                    i.bindFramebuffer(Ci, R.next ? R.next.framebuffer : null);
                    R.cur = R.next;
                    i.getError();
                }
                function g(e, t) {
                    var E = new f();
                    r.framebufferCount++;
                    function M(e, t) {
                        var n;
                        fe(R.next !== E, "can not update framebuffer which is currently in use");
                        var r = 0;
                        var i = 0;
                        var a = true;
                        var o = true;
                        var s = null;
                        var u = true;
                        var f = "rgba";
                        var c = "uint8";
                        var l = 1;
                        var h = null;
                        var d = null;
                        var p = null;
                        var v = false;
                        if (typeof e === "number") {
                            r = e | 0;
                            i = t | 0 || r;
                        } else if (!e) {
                            r = i = 1;
                        } else {
                            fe.type(e, "object", "invalid arguments for framebuffer");
                            var m = e;
                            if ("shape" in m) {
                                var g = m.shape;
                                fe(Array.isArray(g) && g.length >= 2, "invalid shape for framebuffer");
                                r = g[0];
                                i = g[1];
                            } else {
                                if ("radius" in m) {
                                    r = i = m.radius;
                                }
                                if ("width" in m) {
                                    r = m.width;
                                }
                                if ("height" in m) {
                                    i = m.height;
                                }
                            }
                            if ("color" in m || "colors" in m) {
                                s = m.color || m.colors;
                                if (Array.isArray(s)) {
                                    fe(s.length === 1 || S.webgl_draw_buffers, "multiple render targets not supported");
                                }
                            }
                            if (!s) {
                                if ("colorCount" in m) {
                                    l = m.colorCount | 0;
                                    fe(l > 0, "invalid color buffer count");
                                }
                                if ("colorTexture" in m) {
                                    u = !!m.colorTexture;
                                    f = "rgba4";
                                }
                                if ("colorType" in m) {
                                    c = m.colorType;
                                    if (!u) {
                                        if (c === "half float" || c === "float16") {
                                            fe(S.ext_color_buffer_half_float, "you must enable EXT_color_buffer_half_float to use 16-bit render buffers");
                                            f = "rgba16f";
                                        } else if (c === "float" || c === "float32") {
                                            fe(S.webgl_color_buffer_float, "you must enable WEBGL_color_buffer_float in order to use 32-bit floating point renderbuffers");
                                            f = "rgba32f";
                                        }
                                    } else {
                                        fe(S.oes_texture_float || !(c === "float" || c === "float32"), "you must enable OES_texture_float in order to use floating point framebuffer objects");
                                        fe(S.oes_texture_half_float || !(c === "half float" || c === "float16"), "you must enable OES_texture_half_float in order to use 16-bit floating point framebuffer objects");
                                    }
                                    fe.oneOf(c, B, "invalid color type");
                                }
                                if ("colorFormat" in m) {
                                    f = m.colorFormat;
                                    if (O.indexOf(f) >= 0) {
                                        u = true;
                                    } else if (C.indexOf(f) >= 0) {
                                        u = false;
                                    } else {
                                        if (u) {
                                            fe.oneOf(m.colorFormat, O, "invalid color format for texture");
                                        } else {
                                            fe.oneOf(m.colorFormat, C, "invalid color format for renderbuffer");
                                        }
                                    }
                                }
                            }
                            if ("depthTexture" in m || "depthStencilTexture" in m) {
                                v = !!(m.depthTexture || m.depthStencilTexture);
                                fe(!v || S.webgl_depth_texture, "webgl_depth_texture extension not supported");
                            }
                            if ("depth" in m) {
                                if (typeof m.depth === "boolean") {
                                    a = m.depth;
                                } else {
                                    h = m.depth;
                                    o = false;
                                }
                            }
                            if ("stencil" in m) {
                                if (typeof m.stencil === "boolean") {
                                    o = m.stencil;
                                } else {
                                    d = m.stencil;
                                    a = false;
                                }
                            }
                            if ("depthStencil" in m) {
                                if (typeof m.depthStencil === "boolean") {
                                    a = o = m.depthStencil;
                                } else {
                                    p = m.depthStencil;
                                    a = false;
                                    o = false;
                                }
                            }
                        }
                        var _ = null;
                        var x = null;
                        var b = null;
                        var y = null;
                        if (Array.isArray(s)) {
                            _ = s.map(P);
                        } else if (s) {
                            _ = [ P(s) ];
                        } else {
                            _ = new Array(l);
                            for (n = 0; n < l; ++n) {
                                _[n] = I(r, i, u, f, c);
                            }
                        }
                        fe(S.webgl_draw_buffers || _.length <= 1, "you must enable the WEBGL_draw_buffers extension in order to use multiple color buffers.");
                        fe(_.length <= w.maxColorAttachments, "too many color attachments, not supported");
                        r = r || _[0].width;
                        i = i || _[0].height;
                        if (h) {
                            x = P(h);
                        } else if (a && !o) {
                            x = I(r, i, v, "depth", "uint32");
                        }
                        if (d) {
                            b = P(d);
                        } else if (o && !a) {
                            b = I(r, i, false, "stencil", "uint8");
                        }
                        if (p) {
                            y = P(p);
                        } else if (!h && !d && o && a) {
                            y = I(r, i, v, "depth stencil", "depth stencil");
                        }
                        fe(!!h + !!d + !!p <= 1, "invalid framebuffer configuration, can specify exactly one depth/stencil attachment");
                        var A = null;
                        for (n = 0; n < _.length; ++n) {
                            F(_[n], r, i);
                            fe(!_[n] || _[n].texture && Ki.indexOf(_[n].texture._texture.format) >= 0 || _[n].renderbuffer && ua.indexOf(_[n].renderbuffer._renderbuffer.format) >= 0, "framebuffer color attachment " + n + " is invalid");
                            if (_[n] && _[n].texture) {
                                var T = Ji[_[n].texture._texture.format] * Qi[_[n].texture._texture.type];
                                if (A === null) {
                                    A = T;
                                } else {
                                    fe(A === T, "all color attachments much have the same number of bits per pixel.");
                                }
                            }
                        }
                        F(x, r, i);
                        fe(!x || x.texture && x.texture._texture.format === Yi || x.renderbuffer && x.renderbuffer._renderbuffer.format === ta, "invalid depth attachment for framebuffer object");
                        F(b, r, i);
                        fe(!b || b.renderbuffer && b.renderbuffer._renderbuffer.format === na, "invalid stencil attachment for framebuffer object");
                        F(y, r, i);
                        fe(!y || y.texture && y.texture._texture.format === ra || y.renderbuffer && y.renderbuffer._renderbuffer.format === ra, "invalid depth-stencil attachment for framebuffer object");
                        N(E);
                        E.width = r;
                        E.height = i;
                        E.colorAttachments = _;
                        E.depthAttachment = x;
                        E.stencilAttachment = b;
                        E.depthStencilAttachment = y;
                        M.color = _.map(D);
                        M.depth = D(x);
                        M.stencil = D(b);
                        M.depthStencil = D(y);
                        M.width = E.width;
                        M.height = E.height;
                        L(E);
                        return M;
                    }
                    function n(e, t) {
                        fe(R.next !== E, "can not resize a framebuffer which is currently in use");
                        var n = Math.max(e | 0, 1);
                        var r = Math.max(t | 0 || n, 1);
                        if (n === E.width && r === E.height) {
                            return M;
                        }
                        var i = E.colorAttachments;
                        for (var a = 0; a < i.length; ++a) {
                            o(i[a], n, r);
                        }
                        o(E.depthAttachment, n, r);
                        o(E.stencilAttachment, n, r);
                        o(E.depthStencilAttachment, n, r);
                        E.width = M.width = n;
                        E.height = M.height = r;
                        L(E);
                        return M;
                    }
                    M(e, t);
                    return ue(M, {
                        resize: n,
                        _reglType: "framebuffer",
                        _framebuffer: E,
                        destroy: function e() {
                            c(E);
                            N(E);
                        },
                        use: function e(t) {
                            R.setFBO({
                                framebuffer: M
                            }, t);
                        }
                    });
                }
                function l(e) {
                    var p = Array(6);
                    function v(e) {
                        var t;
                        fe(p.indexOf(R.next) < 0, "can not update framebuffer which is currently in use");
                        var n = {
                            color: null
                        };
                        var r = 0;
                        var i = null;
                        var a = "rgba";
                        var o = "uint8";
                        var s = 1;
                        if (typeof e === "number") {
                            r = e | 0;
                        } else if (!e) {
                            r = 1;
                        } else {
                            fe.type(e, "object", "invalid arguments for framebuffer");
                            var u = e;
                            if ("shape" in u) {
                                var f = u.shape;
                                fe(Array.isArray(f) && f.length >= 2, "invalid shape for framebuffer");
                                fe(f[0] === f[1], "cube framebuffer must be square");
                                r = f[0];
                            } else {
                                if ("radius" in u) {
                                    r = u.radius | 0;
                                }
                                if ("width" in u) {
                                    r = u.width | 0;
                                    if ("height" in u) {
                                        fe(u.height === r, "must be square");
                                    }
                                } else if ("height" in u) {
                                    r = u.height | 0;
                                }
                            }
                            if ("color" in u || "colors" in u) {
                                i = u.color || u.colors;
                                if (Array.isArray(i)) {
                                    fe(i.length === 1 || S.webgl_draw_buffers, "multiple render targets not supported");
                                }
                            }
                            if (!i) {
                                if ("colorCount" in u) {
                                    s = u.colorCount | 0;
                                    fe(s > 0, "invalid color buffer count");
                                }
                                if ("colorType" in u) {
                                    fe.oneOf(u.colorType, B, "invalid color type");
                                    o = u.colorType;
                                }
                                if ("colorFormat" in u) {
                                    a = u.colorFormat;
                                    fe.oneOf(u.colorFormat, O, "invalid color format for texture");
                                }
                            }
                            if ("depth" in u) {
                                n.depth = u.depth;
                            }
                            if ("stencil" in u) {
                                n.stencil = u.stencil;
                            }
                            if ("depthStencil" in u) {
                                n.depthStencil = u.depthStencil;
                            }
                        }
                        var c;
                        if (i) {
                            if (Array.isArray(i)) {
                                c = [];
                                for (t = 0; t < i.length; ++t) {
                                    c[t] = i[t];
                                }
                            } else {
                                c = [ i ];
                            }
                        } else {
                            c = Array(s);
                            var l = {
                                radius: r,
                                format: a,
                                type: o
                            };
                            for (t = 0; t < s; ++t) {
                                c[t] = m.createCube(l);
                            }
                        }
                        n.color = Array(c.length);
                        for (t = 0; t < c.length; ++t) {
                            var h = c[t];
                            fe(typeof h === "function" && h._reglType === "textureCube", "invalid cube map");
                            r = r || h.width;
                            fe(h.width === r && h.height === r, "invalid cube map shape");
                            n.color[t] = {
                                target: Pi,
                                data: c[t]
                            };
                        }
                        for (t = 0; t < 6; ++t) {
                            for (var d = 0; d < c.length; ++d) {
                                n.color[d].target = Pi + t;
                            }
                            if (t > 0) {
                                n.depth = p[0].depth;
                                n.stencil = p[0].stencil;
                                n.depthStencil = p[0].depthStencil;
                            }
                            if (p[t]) {
                                p[t](n);
                            } else {
                                p[t] = g(n);
                            }
                        }
                        return ue(v, {
                            width: r,
                            height: r,
                            color: c
                        });
                    }
                    function t(e) {
                        var t;
                        var n = e | 0;
                        fe(n > 0 && n <= w.maxCubeMapSize, "invalid radius for cube fbo");
                        if (n === v.width) {
                            return v;
                        }
                        var r = v.color;
                        for (t = 0; t < r.length; ++t) {
                            r[t].resize(n);
                        }
                        for (t = 0; t < 6; ++t) {
                            p[t].resize(n);
                        }
                        v.width = v.height = n;
                        return v;
                    }
                    v(e);
                    return ue(v, {
                        faces: p,
                        resize: t,
                        _reglType: "framebufferCube",
                        destroy: function e() {
                            p.forEach(function(e) {
                                e.destroy();
                            });
                        }
                    });
                }
                function h() {
                    R.cur = null;
                    R.next = null;
                    R.dirty = true;
                    Rt(n).forEach(function(e) {
                        e.framebuffer = i.createFramebuffer();
                        L(e);
                    });
                }
                return ue(R, {
                    getFramebuffer: function e(t) {
                        if (typeof t === "function" && t._reglType === "framebuffer") {
                            var n = t._framebuffer;
                            if (n instanceof f) {
                                return n;
                            }
                        }
                        return null;
                    },
                    create: g,
                    createCube: l,
                    clear: function e() {
                        Rt(n).forEach(c);
                    },
                    restore: h
                });
            }
            fa[Ui] = "complete", fa[qi] = "incomplete attachment", fa[Gi] = "incomplete dimensions", 
            fa[zi] = "incomplete, missing attachment", fa[Hi] = "unsupported";
            var la = 5126, ha = 34962;
            function da() {
                this.state = 0;
                this.x = 0;
                this.y = 0;
                this.z = 0;
                this.w = 0;
                this.buffer = null;
                this.size = 0;
                this.normalized = false;
                this.type = la;
                this.offset = 0;
                this.stride = 0;
                this.divisor = 0;
            }
            function pa(a, l, e, t, h) {
                var d = e.maxAttributes;
                var i = new Array(d);
                for (var n = 0; n < d; ++n) {
                    i[n] = new da();
                }
                var r = 0;
                var o = {};
                var s = {
                    Record: da,
                    scope: {},
                    state: i,
                    currentVAO: null,
                    targetVAO: null,
                    restore: f() ? x : function() {},
                    createVAO: b,
                    getVAO: p,
                    destroyBuffer: u,
                    setVAO: f() ? v : m,
                    clear: f() ? g : function() {}
                };
                function u(e) {
                    for (var t = 0; t < i.length; ++t) {
                        var n = i[t];
                        if (n.buffer === e) {
                            a.disableVertexAttribArray(t);
                            n.buffer = null;
                        }
                    }
                }
                function f() {
                    return l.oes_vertex_array_object;
                }
                function c() {
                    return l.angle_instanced_arrays;
                }
                function p(e) {
                    if (typeof e === "function" && e._vao) {
                        return e._vao;
                    }
                    return null;
                }
                function v(e) {
                    if (e === s.currentVAO) {
                        return;
                    }
                    var t = f();
                    if (e) {
                        t.bindVertexArrayOES(e.vao);
                    } else {
                        t.bindVertexArrayOES(null);
                    }
                    s.currentVAO = e;
                }
                function m(e) {
                    if (e === s.currentVAO) {
                        return;
                    }
                    if (e) {
                        e.bindAttrs();
                    } else {
                        var t = c();
                        for (var n = 0; n < i.length; ++n) {
                            var r = i[n];
                            if (r.buffer) {
                                a.enableVertexAttribArray(n);
                                a.vertexAttribPointer(n, r.size, r.type, r.normalized, r.stride, r.offfset);
                                if (t && r.divisor) {
                                    t.vertexAttribDivisorANGLE(n, r.divisor);
                                }
                            } else {
                                a.disableVertexAttribArray(n);
                                a.vertexAttrib4f(n, r.x, r.y, r.z, r.w);
                            }
                        }
                    }
                    s.currentVAO = e;
                }
                function g() {
                    Rt(o).forEach(function(e) {
                        e.destroy();
                    });
                }
                function _() {
                    this.id = ++r;
                    this.attributes = [];
                    var e = f();
                    if (e) {
                        this.vao = e.createVertexArrayOES();
                    } else {
                        this.vao = null;
                    }
                    o[this.id] = this;
                    this.buffers = [];
                }
                _.prototype.bindAttrs = function() {
                    var e = c();
                    var t = this.attributes;
                    for (var n = 0; n < t.length; ++n) {
                        var r = t[n];
                        if (r.buffer) {
                            a.enableVertexAttribArray(n);
                            a.bindBuffer(ha, r.buffer.buffer);
                            a.vertexAttribPointer(n, r.size, r.type, r.normalized, r.stride, r.offset);
                            if (e && r.divisor) {
                                e.vertexAttribDivisorANGLE(n, r.divisor);
                            }
                        } else {
                            a.disableVertexAttribArray(n);
                            a.vertexAttrib4f(n, r.x, r.y, r.z, r.w);
                        }
                    }
                    for (var i = t.length; i < d; ++i) {
                        a.disableVertexAttribArray(i);
                    }
                };
                _.prototype.refresh = function() {
                    var e = f();
                    if (e) {
                        e.bindVertexArrayOES(this.vao);
                        this.bindAttrs();
                        s.currentVAO = this;
                    }
                };
                _.prototype.destroy = function() {
                    if (this.vao) {
                        var e = f();
                        if (this === s.currentVAO) {
                            s.currentVAO = null;
                            e.bindVertexArrayOES(null);
                        }
                        e.deleteVertexArrayOES(this.vao);
                        this.vao = null;
                    }
                    if (o[this.id]) {
                        delete o[this.id];
                        t.vaoCount -= 1;
                    }
                };
                function x() {
                    var e = f();
                    if (e) {
                        Rt(o).forEach(function(e) {
                            e.refresh();
                        });
                    }
                }
                function b(e) {
                    var f = new _();
                    t.vaoCount += 1;
                    function c(e) {
                        fe(Array.isArray(e), "arguments to vertex array constructor must be an array");
                        fe(e.length < d, "too many attributes");
                        fe(e.length > 0, "must specify at least one attribute");
                        var t = {};
                        var n = f.attributes;
                        n.length = e.length;
                        for (var r = 0; r < e.length; ++r) {
                            var i = e[r];
                            var a = n[r] = new da();
                            var o = i.data || i;
                            if (Array.isArray(o) || ne(o) || wt(o)) {
                                var s;
                                if (f.buffers[r]) {
                                    s = f.buffers[r];
                                    if (ne(o) && s._buffer.byteLength >= o.byteLength) {
                                        s.subdata(o);
                                    } else {
                                        s.destroy();
                                        f.buffers[r] = null;
                                    }
                                }
                                if (!f.buffers[r]) {
                                    s = f.buffers[r] = h.create(i, ha, false, true);
                                }
                                a.buffer = h.getBuffer(s);
                                a.size = a.buffer.dimension | 0;
                                a.normalized = false;
                                a.type = a.buffer.dtype;
                                a.offset = 0;
                                a.stride = 0;
                                a.divisor = 0;
                                a.state = 1;
                                t[r] = 1;
                            } else if (h.getBuffer(i)) {
                                a.buffer = h.getBuffer(i);
                                a.size = a.buffer.dimension | 0;
                                a.normalized = false;
                                a.type = a.buffer.dtype;
                                a.offset = 0;
                                a.stride = 0;
                                a.divisor = 0;
                                a.state = 1;
                            } else if (h.getBuffer(i.buffer)) {
                                a.buffer = h.getBuffer(i.buffer);
                                a.size = (+i.size || a.buffer.dimension) | 0;
                                a.normalized = !!i.normalized || false;
                                if ("type" in i) {
                                    fe.parameter(i.type, jt, "invalid buffer type");
                                    a.type = jt[i.type];
                                } else {
                                    a.type = a.buffer.dtype;
                                }
                                a.offset = (i.offset || 0) | 0;
                                a.stride = (i.stride || 0) | 0;
                                a.divisor = (i.divisor || 0) | 0;
                                a.state = 1;
                                fe(a.size >= 1 && a.size <= 4, "size must be between 1 and 4");
                                fe(a.offset >= 0, "invalid offset");
                                fe(a.stride >= 0 && a.stride <= 255, "stride must be between 0 and 255");
                                fe(a.divisor >= 0, "divisor must be positive");
                                fe(!a.divisor || !!l.angle_instanced_arrays, "ANGLE_instanced_arrays must be enabled to use divisor");
                            } else if ("x" in i) {
                                fe(r > 0, "first attribute must not be a constant");
                                a.x = +i.x || 0;
                                a.y = +i.y || 0;
                                a.z = +i.z || 0;
                                a.w = +i.w || 0;
                                a.state = 2;
                            } else {
                                fe(false, "invalid attribute spec for location " + r);
                            }
                        }
                        for (var u = 0; u < f.buffers.length; ++u) {
                            if (!t[u] && f.buffers[u]) {
                                f.buffers[u].destroy();
                                f.buffers[u] = null;
                            }
                        }
                        f.refresh();
                        return c;
                    }
                    c.destroy = function() {
                        for (var e = 0; e < f.buffers.length; ++e) {
                            if (f.buffers[e]) {
                                f.buffers[e].destroy();
                            }
                        }
                        f.buffers.length = 0;
                        f.destroy();
                    };
                    c._vao = f;
                    c._reglType = "vao";
                    return c(e);
                }
                return s;
            }
            var va = 35632, ma = 35633, ga = 35718, _a = 35721;
            function xa(v, m, s, g) {
                var u = {};
                var f = {};
                function _(e, t, n, r) {
                    this.name = e;
                    this.id = t;
                    this.location = n;
                    this.info = r;
                }
                function x(e, t) {
                    for (var n = 0; n < e.length; ++n) {
                        if (e[n].id === t.id) {
                            e[n].location = t.location;
                            return;
                        }
                    }
                    e.push(t);
                }
                function b(e, t, n) {
                    var r = e === va ? u : f;
                    var i = r[t];
                    if (!i) {
                        var a = m.str(t);
                        i = v.createShader(e);
                        v.shaderSource(i, a);
                        v.compileShader(i);
                        fe.shaderError(v, i, a, e, n);
                        r[t] = i;
                    }
                    return i;
                }
                var c = {};
                var l = [];
                var n = 0;
                function h(e, t) {
                    this.id = n++;
                    this.fragId = e;
                    this.vertId = t;
                    this.program = null;
                    this.uniforms = [];
                    this.attributes = [];
                    this.refCount = 1;
                    if (g.profile) {
                        this.stats = {
                            uniformsCount: 0,
                            attributesCount: 0
                        };
                    }
                }
                function d(e, t, n) {
                    var r, i;
                    var a = b(va, e.fragId);
                    var o = b(ma, e.vertId);
                    var s = e.program = v.createProgram();
                    v.attachShader(s, a);
                    v.attachShader(s, o);
                    if (n) {
                        for (r = 0; r < n.length; ++r) {
                            var u = n[r];
                            v.bindAttribLocation(s, u[0], u[1]);
                        }
                    }
                    v.linkProgram(s);
                    fe.linkError(v, s, m.str(e.fragId), m.str(e.vertId), t);
                    var f = v.getProgramParameter(s, ga);
                    if (g.profile) {
                        e.stats.uniformsCount = f;
                    }
                    var c = e.uniforms;
                    for (r = 0; r < f; ++r) {
                        i = v.getActiveUniform(s, r);
                        if (i) {
                            if (i.size > 1) {
                                for (var l = 0; l < i.size; ++l) {
                                    var h = i.name.replace("[0]", "[" + l + "]");
                                    x(c, new _(h, m.id(h), v.getUniformLocation(s, h), i));
                                }
                            } else {
                                x(c, new _(i.name, m.id(i.name), v.getUniformLocation(s, i.name), i));
                            }
                        }
                    }
                    var d = v.getProgramParameter(s, _a);
                    if (g.profile) {
                        e.stats.attributesCount = d;
                    }
                    var p = e.attributes;
                    for (r = 0; r < d; ++r) {
                        i = v.getActiveAttrib(s, r);
                        if (i) {
                            x(p, new _(i.name, m.id(i.name), v.getAttribLocation(s, i.name), i));
                        }
                    }
                }
                if (g.profile) {
                    s.getMaxUniformsCount = function() {
                        var t = 0;
                        l.forEach(function(e) {
                            if (e.stats.uniformsCount > t) {
                                t = e.stats.uniformsCount;
                            }
                        });
                        return t;
                    };
                    s.getMaxAttributesCount = function() {
                        var t = 0;
                        l.forEach(function(e) {
                            if (e.stats.attributesCount > t) {
                                t = e.stats.attributesCount;
                            }
                        });
                        return t;
                    };
                }
                function e() {
                    u = {};
                    f = {};
                    for (var e = 0; e < l.length; ++e) {
                        d(l[e], null, l[e].attributes.map(function(e) {
                            return [ e.location, e.name ];
                        }));
                    }
                }
                return {
                    clear: function e() {
                        var t = v.deleteShader.bind(v);
                        Rt(u).forEach(t);
                        u = {};
                        Rt(f).forEach(t);
                        f = {};
                        l.forEach(function(e) {
                            v.deleteProgram(e.program);
                        });
                        l.length = 0;
                        c = {};
                        s.shaderCount = 0;
                    },
                    program: function n(e, t, r, i) {
                        fe.command(e >= 0, "missing vertex shader", r);
                        fe.command(t >= 0, "missing fragment shader", r);
                        var a = c[t];
                        if (!a) {
                            a = c[t] = {};
                        }
                        var o = a[e];
                        if (o) {
                            o.refCount++;
                            if (!i) {
                                return o;
                            }
                        }
                        var n = new h(t, e);
                        s.shaderCount++;
                        d(n, r, i);
                        if (!o) {
                            a[e] = n;
                        }
                        l.push(n);
                        return ue(n, {
                            destroy: function e() {
                                n.refCount--;
                                if (n.refCount <= 0) {
                                    v.deleteProgram(n.program);
                                    var t = l.indexOf(n);
                                    l.splice(t, 1);
                                    s.shaderCount--;
                                }
                                if (a[n.vertId].refCount <= 0) {
                                    v.deleteShader(f[n.vertId]);
                                    delete f[n.vertId];
                                    delete c[n.fragId][n.vertId];
                                }
                                if (!Object.keys(c[n.fragId]).length) {
                                    v.deleteShader(u[n.fragId]);
                                    delete u[n.fragId];
                                    delete c[n.fragId];
                                }
                            }
                        });
                    },
                    restore: e,
                    shader: b,
                    frag: -1,
                    vert: -1
                };
            }
            var ba = 6408, ya = 5121, Aa = 3333, Ta = 5126;
            function Ea(u, f, c, l, h, d, p) {
                function n(e) {
                    var t;
                    if (f.next === null) {
                        fe(h.preserveDrawingBuffer, 'you must create a webgl context with "preserveDrawingBuffer":true in order to read pixels from the drawing buffer');
                        t = ya;
                    } else {
                        fe(f.next.colorAttachments[0].texture !== null, "You cannot read from a renderbuffer");
                        t = f.next.colorAttachments[0].texture._texture.type;
                        if (d.oes_texture_float) {
                            fe(t === ya || t === Ta, "Reading from a framebuffer is only allowed for the types 'uint8' and 'float'");
                            if (t === Ta) {
                                fe(p.readFloat, "Reading 'float' values is not permitted in your browser. For a fallback, please see: https://www.npmjs.com/package/glsl-read-float");
                            }
                        } else {
                            fe(t === ya, "Reading from a framebuffer is only allowed for the type 'uint8'");
                        }
                    }
                    var n = 0;
                    var r = 0;
                    var i = l.framebufferWidth;
                    var a = l.framebufferHeight;
                    var o = null;
                    if (ne(e)) {
                        o = e;
                    } else if (e) {
                        fe.type(e, "object", "invalid arguments to regl.read()");
                        n = e.x | 0;
                        r = e.y | 0;
                        fe(n >= 0 && n < l.framebufferWidth, "invalid x offset for regl.read");
                        fe(r >= 0 && r < l.framebufferHeight, "invalid y offset for regl.read");
                        i = (e.width || l.framebufferWidth - n) | 0;
                        a = (e.height || l.framebufferHeight - r) | 0;
                        o = e.data || null;
                    }
                    if (o) {
                        if (t === ya) {
                            fe(o instanceof Uint8Array, "buffer must be 'Uint8Array' when reading from a framebuffer of type 'uint8'");
                        } else if (t === Ta) {
                            fe(o instanceof Float32Array, "buffer must be 'Float32Array' when reading from a framebuffer of type 'float'");
                        }
                    }
                    fe(i > 0 && i + n <= l.framebufferWidth, "invalid width for read pixels");
                    fe(a > 0 && a + r <= l.framebufferHeight, "invalid height for read pixels");
                    c();
                    var s = i * a * 4;
                    if (!o) {
                        if (t === ya) {
                            o = new Uint8Array(s);
                        } else if (t === Ta) {
                            o = o || new Float32Array(s);
                        }
                    }
                    fe.isTypedArray(o, "data buffer for regl.read() must be a typedarray");
                    fe(o.byteLength >= s, "data buffer for regl.read() too small");
                    u.pixelStorei(Aa, 4);
                    u.readPixels(n, r, i, a, ba, t, o);
                    return o;
                }
                function t(e) {
                    var t;
                    f.setFBO({
                        framebuffer: e.framebuffer
                    }, function() {
                        t = n(e);
                    });
                    return t;
                }
                function e(e) {
                    if (!e || !("framebuffer" in e)) {
                        return n(e);
                    } else {
                        return t(e);
                    }
                }
                return e;
            }
            function Ma(e) {
                return Array.prototype.slice.call(e);
            }
            function Sa(e) {
                return Ma(e).join("");
            }
            function wa() {
                var i = 0;
                var r = [];
                var a = [];
                function e(e) {
                    for (var t = 0; t < a.length; ++t) {
                        if (a[t] === e) {
                            return r[t];
                        }
                    }
                    var n = "g" + i++;
                    r.push(n);
                    a.push(e);
                    return n;
                }
                function o() {
                    var t = [];
                    function e() {
                        t.push.apply(t, Ma(arguments));
                    }
                    var n = [];
                    function r() {
                        var e = "v" + i++;
                        n.push(e);
                        if (arguments.length > 0) {
                            t.push(e, "=");
                            t.push.apply(t, Ma(arguments));
                            t.push(";");
                        }
                        return e;
                    }
                    return ue(e, {
                        def: r,
                        toString: function e() {
                            return Sa([ n.length > 0 ? "var " + n.join(",") + ";" : "", Sa(t) ]);
                        }
                    });
                }
                function u() {
                    var i = o();
                    var n = o();
                    var t = i.toString;
                    var r = n.toString;
                    function a(e, t) {
                        n(e, t, "=", i.def(e, t), ";");
                    }
                    return ue(function() {
                        i.apply(i, Ma(arguments));
                    }, {
                        def: i.def,
                        entry: i,
                        exit: n,
                        save: a,
                        set: function e(t, n, r) {
                            a(t, n);
                            i(t, n, "=", r, ";");
                        },
                        toString: function e() {
                            return t() + r();
                        }
                    });
                }
                function t() {
                    var n = Sa(arguments);
                    var t = u();
                    var r = u();
                    var i = t.toString;
                    var a = r.toString;
                    return ue(t, {
                        then: function e() {
                            t.apply(t, Ma(arguments));
                            return this;
                        },
                        else: function e() {
                            r.apply(r, Ma(arguments));
                            return this;
                        },
                        toString: function e() {
                            var t = a();
                            if (t) {
                                t = "else{" + t + "}";
                            }
                            return Sa([ "if(", n, "){", i(), "}", t ]);
                        }
                    });
                }
                var s = o();
                var f = {};
                function n(e, t) {
                    var n = [];
                    function r() {
                        var e = "a" + n.length;
                        n.push(e);
                        return e;
                    }
                    t = t || 0;
                    for (var i = 0; i < t; ++i) {
                        r();
                    }
                    var a = u();
                    var o = a.toString;
                    var s = f[e] = ue(a, {
                        arg: r,
                        toString: function e() {
                            return Sa([ "function(", n.join(), "){", o(), "}" ]);
                        }
                    });
                    return s;
                }
                function c() {
                    var t = [ '"use strict";', s, "return {" ];
                    Object.keys(f).forEach(function(e) {
                        t.push('"', e, '":', f[e].toString(), ",");
                    });
                    t.push("}");
                    var e = Sa(t).replace(/;/g, ";\n").replace(/}/g, "}\n").replace(/{/g, "{\n");
                    var n = Function.apply(null, r.concat(e));
                    return n.apply(null, a);
                }
                return {
                    global: s,
                    link: e,
                    block: o,
                    proc: n,
                    scope: u,
                    cond: t,
                    compile: c
                };
            }
            var Ra = "xyzw".split(""), Oa = 5121, Ca = 1, Ba = 2, Fa = 0, Pa = 1, Ia = 2, Da = 3, Na = 4, La = "dither", Ua = "blend.enable", qa = "blend.color", za = "blend.equation", Ga = "blend.func", Ha = "depth.enable", Va = "depth.func", ka = "depth.range", ja = "depth.mask", Wa = "colorMask", Xa = "cull.enable", Ya = "cull.face", Ka = "frontFace", Ja = "lineWidth", Qa = "polygonOffset.enable", Za = "polygonOffset.offset", $a = "sample.alpha", eo = "sample.enable", to = "sample.coverage", no = "stencil.enable", ro = "stencil.mask", io = "stencil.func", ao = "stencil.opFront", oo = "stencil.opBack", so = "scissor.enable", uo = "scissor.box", fo = "viewport", co = "profile", lo = "framebuffer", ho = "vert", po = "frag", vo = "elements", mo = "primitive", go = "count", _o = "offset", xo = "instances", bo = "vao", yo = "Width", Ao = "Height", To = lo + yo, Eo = lo + Ao, Mo = fo + yo, So = fo + Ao, wo = "drawingBuffer", Ro = wo + yo, Oo = wo + Ao, Co = [ Ga, za, io, ao, oo, to, fo, uo, Za ], Bo = 34962, Fo = 34963, Po, Io, Do = 3553, No = 34067, Lo = 2884, Uo = 3042, qo = 3024, zo = 2960, Go = 2929, Ho = 3089, Vo = 32823, ko = 32926, jo = 32928, Wo = 5126, Xo = 35664, Yo = 35665, Ko = 35666, Jo = 5124, Qo = 35667, Zo = 35668, $o = 35669, es = 35670, ts = 35671, ns = 35672, rs = 35673, is = 35674, as = 35675, os = 35676, ss = 35678, us = 35680, fs = 4, cs = 1028, ls = 1029, hs = 2304, ds = 2305, ps = 32775, vs = 32776, ms = 519, gs = 7680, _s = 0, xs = 1, bs = 32774, ys = 513, As = 36160, Ts = 36064, Es = {
                0: 0,
                1: 1,
                zero: 0,
                one: 1,
                "src color": 768,
                "one minus src color": 769,
                "src alpha": 770,
                "one minus src alpha": 771,
                "dst color": 774,
                "one minus dst color": 775,
                "dst alpha": 772,
                "one minus dst alpha": 773,
                "constant color": 32769,
                "one minus constant color": 32770,
                "constant alpha": 32771,
                "one minus constant alpha": 32772,
                "src alpha saturate": 776
            }, Ms = [ "constant color, constant alpha", "one minus constant color, constant alpha", "constant color, one minus constant alpha", "one minus constant color, one minus constant alpha", "constant alpha, constant color", "constant alpha, one minus constant color", "one minus constant alpha, constant color", "one minus constant alpha, one minus constant color" ], Ss = {
                never: 512,
                less: 513,
                "<": 513,
                equal: 514,
                "=": 514,
                "==": 514,
                "===": 514,
                lequal: 515,
                "<=": 515,
                greater: 516,
                ">": 516,
                notequal: 517,
                "!=": 517,
                "!==": 517,
                gequal: 518,
                ">=": 518,
                always: 519
            }, ws = {
                0: 0,
                zero: 0,
                keep: 7680,
                replace: 7681,
                increment: 7682,
                decrement: 7683,
                "increment wrap": 34055,
                "decrement wrap": 34056,
                invert: 5386
            }, Rs = {
                frag: 35632,
                vert: 35633
            }, Os = {
                cw: hs,
                ccw: ds
            };
            function Cs(e) {
                return Array.isArray(e) || ne(e) || wt(e);
            }
            function Bs(e) {
                return e.sort(function(e, t) {
                    if (e === fo) {
                        return -1;
                    } else if (t === fo) {
                        return 1;
                    }
                    return e < t ? -1 : 1;
                });
            }
            function Fs(e, t, n, r) {
                this.thisDep = e;
                this.contextDep = t;
                this.propDep = n;
                this.append = r;
            }
            function Ps(e) {
                return e && !(e.thisDep || e.contextDep || e.propDep);
            }
            function Is(e) {
                return new Fs(false, false, false, e);
            }
            function Ds(e, t) {
                var n = e.type;
                if (n === Fa) {
                    var r = e.data.length;
                    return new Fs(true, r >= 1, r >= 2, t);
                } else if (n === Na) {
                    var i = e.data;
                    return new Fs(i.thisDep, i.contextDep, i.propDep, t);
                } else {
                    return new Fs(n === Da, n === Ia, n === Pa, t);
                }
            }
            var Ns = new Fs(false, false, false, function() {});
            function Ls(e, E, x, p, v, c, t, i, n, b, l, r, a, y, o) {
                var m = b.Record;
                var f = {
                    add: 32774,
                    subtract: 32778,
                    "reverse subtract": 32779
                };
                if (x.ext_blend_minmax) {
                    f.min = ps;
                    f.max = vs;
                }
                var A = x.angle_instanced_arrays;
                var h = x.webgl_draw_buffers;
                var g = {
                    dirty: true,
                    profile: o.profile
                };
                var s = {};
                var T = [];
                var _ = {};
                var M = {};
                function S(e) {
                    return e.replace(".", "_");
                }
                function u(e, t, n) {
                    var r = S(e);
                    T.push(e);
                    s[r] = g[r] = !!n;
                    _[r] = t;
                }
                function d(e, t, n) {
                    var r = S(e);
                    T.push(e);
                    if (Array.isArray(n)) {
                        g[r] = n.slice();
                        s[r] = n.slice();
                    } else {
                        g[r] = s[r] = n;
                    }
                    M[r] = t;
                }
                u(La, qo);
                u(Ua, Uo);
                d(qa, "blendColor", [ 0, 0, 0, 0 ]);
                d(za, "blendEquationSeparate", [ bs, bs ]);
                d(Ga, "blendFuncSeparate", [ xs, _s, xs, _s ]);
                u(Ha, Go, true);
                d(Va, "depthFunc", ys);
                d(ka, "depthRange", [ 0, 1 ]);
                d(ja, "depthMask", true);
                d(Wa, Wa, [ true, true, true, true ]);
                u(Xa, Lo);
                d(Ya, "cullFace", ls);
                d(Ka, Ka, ds);
                d(Ja, Ja, 1);
                u(Qa, Vo);
                d(Za, "polygonOffset", [ 0, 0 ]);
                u($a, ko);
                u(eo, jo);
                d(to, "sampleCoverage", [ 1, false ]);
                u(no, zo);
                d(ro, "stencilMask", -1);
                d(io, "stencilFunc", [ ms, 0, -1 ]);
                d(ao, "stencilOpSeparate", [ cs, gs, gs, gs ]);
                d(oo, "stencilOpSeparate", [ ls, gs, gs, gs ]);
                u(so, Ho);
                d(uo, "scissor", [ 0, 0, e.drawingBufferWidth, e.drawingBufferHeight ]);
                d(fo, fo, [ 0, 0, e.drawingBufferWidth, e.drawingBufferHeight ]);
                var w = {
                    gl: e,
                    context: a,
                    strings: E,
                    next: s,
                    current: g,
                    draw: r,
                    elements: c,
                    buffer: v,
                    shader: l,
                    attributes: b.state,
                    vao: b,
                    uniforms: n,
                    framebuffer: i,
                    extensions: x,
                    timer: y,
                    isBufferArgs: Cs
                };
                var R = {
                    primTypes: dn,
                    compareFuncs: Ss,
                    blendFuncs: Es,
                    blendEquations: f,
                    stencilOps: ws,
                    glTypes: jt,
                    orientationType: Os
                };
                fe.optional(function() {
                    w.isArrayLike = Bn;
                });
                if (h) {
                    R.backBuffer = [ ls ];
                    R.drawBuffer = Me(p.maxDrawbuffers, function(e) {
                        if (e === 0) {
                            return [ 0 ];
                        }
                        return Me(e, function(e) {
                            return Ts + e;
                        });
                    });
                }
                var O = 0;
                function C() {
                    var r = wa();
                    var i = r.link;
                    var t = r.global;
                    r.id = O++;
                    r.batchId = "0";
                    var n = i(w);
                    var a = r.shared = {
                        props: "a0"
                    };
                    Object.keys(w).forEach(function(e) {
                        a[e] = t.def(n, ".", e);
                    });
                    fe.optional(function() {
                        r.CHECK = i(fe);
                        r.commandStr = fe.guessCommand();
                        r.command = i(r.commandStr);
                        r.assert = function(e, t, n) {
                            e("if(!(", t, "))", this.CHECK, ".commandRaise(", i(n), ",", this.command, ");");
                        };
                        R.invalidBlendCombinations = Ms;
                    });
                    var o = r.next = {};
                    var s = r.current = {};
                    Object.keys(M).forEach(function(e) {
                        if (Array.isArray(g[e])) {
                            o[e] = t.def(a.next, ".", e);
                            s[e] = t.def(a.current, ".", e);
                        }
                    });
                    var u = r.constants = {};
                    Object.keys(R).forEach(function(e) {
                        u[e] = t.def(JSON.stringify(R[e]));
                    });
                    r.invoke = function(e, t) {
                        switch (t.type) {
                          case Fa:
                            var n = [ "this", a.context, a.props, r.batchId ];
                            return e.def(i(t.data), ".call(", n.slice(0, Math.max(t.data.length + 1, 4)), ")");

                          case Pa:
                            return e.def(a.props, t.data);

                          case Ia:
                            return e.def(a.context, t.data);

                          case Da:
                            return e.def("this", t.data);

                          case Na:
                            t.data.append(r, e);
                            return t.data.ref;
                        }
                    };
                    r.attribCache = {};
                    var f = {};
                    r.scopeAttrib = function(e) {
                        var t = E.id(e);
                        if (t in f) {
                            return f[t];
                        }
                        var n = b.scope[t];
                        if (!n) {
                            n = b.scope[t] = new m();
                        }
                        var r = f[t] = i(n);
                        return r;
                    };
                    return r;
                }
                function B(e) {
                    var t = e["static"];
                    var n = e.dynamic;
                    var r;
                    if (co in t) {
                        var i = !!t[co];
                        r = Is(function(e, t) {
                            return i;
                        });
                        r.enable = i;
                    } else if (co in n) {
                        var a = n[co];
                        r = Ds(a, function(e, t) {
                            return e.invoke(t, a);
                        });
                    }
                    return r;
                }
                function F(e, t) {
                    var n = e["static"];
                    var r = e.dynamic;
                    if (lo in n) {
                        var a = n[lo];
                        if (a) {
                            a = i.getFramebuffer(a);
                            fe.command(a, "invalid framebuffer object");
                            return Is(function(e, t) {
                                var n = e.link(a);
                                var r = e.shared;
                                t.set(r.framebuffer, ".next", n);
                                var i = r.context;
                                t.set(i, "." + To, n + ".width");
                                t.set(i, "." + Eo, n + ".height");
                                return n;
                            });
                        } else {
                            return Is(function(e, t) {
                                var n = e.shared;
                                t.set(n.framebuffer, ".next", "null");
                                var r = n.context;
                                t.set(r, "." + To, r + "." + Ro);
                                t.set(r, "." + Eo, r + "." + Oo);
                                return "null";
                            });
                        }
                    } else if (lo in r) {
                        var s = r[lo];
                        return Ds(s, function(e, t) {
                            var n = e.invoke(t, s);
                            var r = e.shared;
                            var i = r.framebuffer;
                            var a = t.def(i, ".getFramebuffer(", n, ")");
                            fe.optional(function() {
                                e.assert(t, "!" + n + "||" + a, "invalid framebuffer object");
                            });
                            t.set(i, ".next", a);
                            var o = r.context;
                            t.set(o, "." + To, a + "?" + a + ".width:" + o + "." + Ro);
                            t.set(o, "." + Eo, a + "?" + a + ".height:" + o + "." + Oo);
                            return a;
                        });
                    } else {
                        return null;
                    }
                }
                function P(e, n, r) {
                    var i = e["static"];
                    var h = e.dynamic;
                    function t(u) {
                        if (u in i) {
                            var a = i[u];
                            fe.commandType(a, "object", "invalid " + u, r.commandStr);
                            var e = true;
                            var o = a.x | 0;
                            var s = a.y | 0;
                            var f, c;
                            if ("width" in a) {
                                f = a.width | 0;
                                fe.command(f >= 0, "invalid " + u, r.commandStr);
                            } else {
                                e = false;
                            }
                            if ("height" in a) {
                                c = a.height | 0;
                                fe.command(c >= 0, "invalid " + u, r.commandStr);
                            } else {
                                e = false;
                            }
                            return new Fs(!e && n && n.thisDep, !e && n && n.contextDep, !e && n && n.propDep, function(e, t) {
                                var n = e.shared.context;
                                var r = f;
                                if (!("width" in a)) {
                                    r = t.def(n, ".", To, "-", o);
                                }
                                var i = c;
                                if (!("height" in a)) {
                                    i = t.def(n, ".", Eo, "-", s);
                                }
                                return [ o, s, r, i ];
                            });
                        } else if (u in h) {
                            var l = h[u];
                            var t = Ds(l, function(e, t) {
                                var n = e.invoke(t, l);
                                fe.optional(function() {
                                    e.assert(t, n + "&&typeof " + n + '==="object"', "invalid " + u);
                                });
                                var r = e.shared.context;
                                var i = t.def(n, ".x|0");
                                var a = t.def(n, ".y|0");
                                var o = t.def('"width" in ', n, "?", n, ".width|0:", "(", r, ".", To, "-", i, ")");
                                var s = t.def('"height" in ', n, "?", n, ".height|0:", "(", r, ".", Eo, "-", a, ")");
                                fe.optional(function() {
                                    e.assert(t, o + ">=0&&" + s + ">=0", "invalid " + u);
                                });
                                return [ i, a, o, s ];
                            });
                            if (n) {
                                t.thisDep = t.thisDep || n.thisDep;
                                t.contextDep = t.contextDep || n.contextDep;
                                t.propDep = t.propDep || n.propDep;
                            }
                            return t;
                        } else if (n) {
                            return new Fs(n.thisDep, n.contextDep, n.propDep, function(e, t) {
                                var n = e.shared.context;
                                return [ 0, 0, t.def(n, ".", To), t.def(n, ".", Eo) ];
                            });
                        } else {
                            return null;
                        }
                    }
                    var a = t(fo);
                    if (a) {
                        var o = a;
                        a = new Fs(a.thisDep, a.contextDep, a.propDep, function(e, t) {
                            var n = o.append(e, t);
                            var r = e.shared.context;
                            t.set(r, "." + Mo, n[2]);
                            t.set(r, "." + So, n[3]);
                            return n;
                        });
                    }
                    return {
                        viewport: a,
                        scissor_box: t(uo)
                    };
                }
                function I(e, t) {
                    var n = e["static"];
                    var r = typeof n[po] === "string" && typeof n[ho] === "string";
                    if (r) {
                        if (Object.keys(t.dynamic).length > 0) {
                            return null;
                        }
                        var i = t["static"];
                        var a = Object.keys(i);
                        if (a.length > 0 && typeof i[a[0]] === "number") {
                            var o = [];
                            for (var s = 0; s < a.length; ++s) {
                                fe(typeof i[a[s]] === "number", "must specify all vertex attribute locations when using vaos");
                                o.push([ i[a[s]] | 0, a[s] ]);
                            }
                            return o;
                        }
                    }
                    return null;
                }
                function D(e, t, n) {
                    var r = e["static"];
                    var o = e.dynamic;
                    function i(i) {
                        if (i in r) {
                            var e = E.id(r[i]);
                            fe.optional(function() {
                                l.shader(Rs[i], e, fe.guessCommand());
                            });
                            var t = Is(function() {
                                return e;
                            });
                            t.id = e;
                            return t;
                        } else if (i in o) {
                            var a = o[i];
                            return Ds(a, function(e, t) {
                                var n = e.invoke(t, a);
                                var r = t.def(e.shared.strings, ".id(", n, ")");
                                fe.optional(function() {
                                    t(e.shared.shader, ".shader(", Rs[i], ",", r, ",", e.command, ");");
                                });
                                return r;
                            });
                        }
                        return null;
                    }
                    var s = i(po);
                    var u = i(ho);
                    var a = null;
                    var f;
                    if (Ps(s) && Ps(u)) {
                        a = l.program(u.id, s.id, null, n);
                        f = Is(function(e, t) {
                            return e.link(a);
                        });
                    } else {
                        f = new Fs(s && s.thisDep || u && u.thisDep, s && s.contextDep || u && u.contextDep, s && s.propDep || u && u.propDep, function(e, t) {
                            var n = e.shared.shader;
                            var r;
                            if (s) {
                                r = s.append(e, t);
                            } else {
                                r = t.def(n, ".", po);
                            }
                            var i;
                            if (u) {
                                i = u.append(e, t);
                            } else {
                                i = t.def(n, ".", ho);
                            }
                            var a = n + ".program(" + i + "," + r;
                            fe.optional(function() {
                                a += "," + e.command;
                            });
                            return t.def(a + ")");
                        });
                    }
                    return {
                        frag: s,
                        vert: u,
                        progVar: f,
                        program: a
                    };
                }
                function N(e, o) {
                    var s = e["static"];
                    var u = e.dynamic;
                    function t() {
                        if (vo in s) {
                            var r = s[vo];
                            if (Cs(r)) {
                                r = c.getElements(c.create(r, true));
                            } else if (r) {
                                r = c.getElements(r);
                                fe.command(r, "invalid elements", o.commandStr);
                            }
                            var e = Is(function(e, t) {
                                if (r) {
                                    var n = e.link(r);
                                    e.ELEMENTS = n;
                                    return n;
                                }
                                e.ELEMENTS = null;
                                return null;
                            });
                            e.value = r;
                            return e;
                        } else if (vo in u) {
                            var f = u[vo];
                            return Ds(f, function(e, t) {
                                var n = e.shared;
                                var r = n.isBufferArgs;
                                var i = n.elements;
                                var a = e.invoke(t, f);
                                var o = t.def("null");
                                var s = t.def(r, "(", a, ")");
                                var u = e.cond(s).then(o, "=", i, ".createStream(", a, ");")["else"](o, "=", i, ".getElements(", a, ");");
                                fe.optional(function() {
                                    e.assert(u["else"], "!" + a + "||" + o, "invalid elements");
                                });
                                t.entry(u);
                                t.exit(e.cond(s).then(i, ".destroyStream(", o, ");"));
                                e.ELEMENTS = o;
                                return o;
                            });
                        }
                        return null;
                    }
                    var f = t();
                    function n() {
                        if (mo in s) {
                            var n = s[mo];
                            fe.commandParameter(n, dn, "invalid primitve", o.commandStr);
                            return Is(function(e, t) {
                                return dn[n];
                            });
                        } else if (mo in u) {
                            var i = u[mo];
                            return Ds(i, function(e, t) {
                                var n = e.constants.primTypes;
                                var r = e.invoke(t, i);
                                fe.optional(function() {
                                    e.assert(t, r + " in " + n, "invalid primitive, must be one of " + Object.keys(dn));
                                });
                                return t.def(n, "[", r, "]");
                            });
                        } else if (f) {
                            if (Ps(f)) {
                                if (f.value) {
                                    return Is(function(e, t) {
                                        return t.def(e.ELEMENTS, ".primType");
                                    });
                                } else {
                                    return Is(function() {
                                        return fs;
                                    });
                                }
                            } else {
                                return new Fs(f.thisDep, f.contextDep, f.propDep, function(e, t) {
                                    var n = e.ELEMENTS;
                                    return t.def(n, "?", n, ".primType:", fs);
                                });
                            }
                        }
                        return null;
                    }
                    function r(r, i) {
                        if (r in s) {
                            var n = s[r] | 0;
                            fe.command(!i || n >= 0, "invalid " + r, o.commandStr);
                            return Is(function(e, t) {
                                if (i) {
                                    e.OFFSET = n;
                                }
                                return n;
                            });
                        } else if (r in u) {
                            var a = u[r];
                            return Ds(a, function(e, t) {
                                var n = e.invoke(t, a);
                                if (i) {
                                    e.OFFSET = n;
                                    fe.optional(function() {
                                        e.assert(t, n + ">=0", "invalid " + r);
                                    });
                                }
                                return n;
                            });
                        } else if (i && f) {
                            return Is(function(e, t) {
                                e.OFFSET = "0";
                                return 0;
                            });
                        }
                        return null;
                    }
                    var i = r(_o, true);
                    function a() {
                        if (go in s) {
                            var e = s[go] | 0;
                            fe.command(typeof e === "number" && e >= 0, "invalid vertex count", o.commandStr);
                            return Is(function() {
                                return e;
                            });
                        } else if (go in u) {
                            var r = u[go];
                            return Ds(r, function(e, t) {
                                var n = e.invoke(t, r);
                                fe.optional(function() {
                                    e.assert(t, "typeof " + n + '==="number"&&' + n + ">=0&&" + n + "===(" + n + "|0)", "invalid vertex count");
                                });
                                return n;
                            });
                        } else if (f) {
                            if (Ps(f)) {
                                if (f) {
                                    if (i) {
                                        return new Fs(i.thisDep, i.contextDep, i.propDep, function(e, t) {
                                            var n = t.def(e.ELEMENTS, ".vertCount-", e.OFFSET);
                                            fe.optional(function() {
                                                e.assert(t, n + ">=0", "invalid vertex offset/element buffer too small");
                                            });
                                            return n;
                                        });
                                    } else {
                                        return Is(function(e, t) {
                                            return t.def(e.ELEMENTS, ".vertCount");
                                        });
                                    }
                                } else {
                                    var t = Is(function() {
                                        return -1;
                                    });
                                    fe.optional(function() {
                                        t.MISSING = true;
                                    });
                                    return t;
                                }
                            } else {
                                var n = new Fs(f.thisDep || i.thisDep, f.contextDep || i.contextDep, f.propDep || i.propDep, function(e, t) {
                                    var n = e.ELEMENTS;
                                    if (e.OFFSET) {
                                        return t.def(n, "?", n, ".vertCount-", e.OFFSET, ":-1");
                                    }
                                    return t.def(n, "?", n, ".vertCount:-1");
                                });
                                fe.optional(function() {
                                    n.DYNAMIC = true;
                                });
                                return n;
                            }
                        }
                        return null;
                    }
                    return {
                        elements: f,
                        primitive: n(),
                        count: a(),
                        instances: r(xo, false),
                        offset: i
                    };
                }
                function L(e, o) {
                    var i = e["static"];
                    var s = e.dynamic;
                    var u = {};
                    T.forEach(function(l) {
                        var a = S(l);
                        function e(e, n) {
                            if (l in i) {
                                var t = e(i[l]);
                                u[a] = Is(function() {
                                    return t;
                                });
                            } else if (l in s) {
                                var r = s[l];
                                u[a] = Ds(r, function(e, t) {
                                    return n(e, t, e.invoke(t, r));
                                });
                            }
                        }
                        switch (l) {
                          case Xa:
                          case Ua:
                          case La:
                          case no:
                          case Ha:
                          case so:
                          case Qa:
                          case $a:
                          case eo:
                          case ja:
                            return e(function(e) {
                                fe.commandType(e, "boolean", l, o.commandStr);
                                return e;
                            }, function(e, t, n) {
                                fe.optional(function() {
                                    e.assert(t, "typeof " + n + '==="boolean"', "invalid flag " + l, e.commandStr);
                                });
                                return n;
                            });

                          case Va:
                            return e(function(e) {
                                fe.commandParameter(e, Ss, "invalid " + l, o.commandStr);
                                return Ss[e];
                            }, function(e, t, n) {
                                var r = e.constants.compareFuncs;
                                fe.optional(function() {
                                    e.assert(t, n + " in " + r, "invalid " + l + ", must be one of " + Object.keys(Ss));
                                });
                                return t.def(r, "[", n, "]");
                            });

                          case ka:
                            return e(function(e) {
                                fe.command(Bn(e) && e.length === 2 && typeof e[0] === "number" && typeof e[1] === "number" && e[0] <= e[1], "depth range is 2d array", o.commandStr);
                                return e;
                            }, function(e, t, n) {
                                fe.optional(function() {
                                    e.assert(t, e.shared.isArrayLike + "(" + n + ")&&" + n + ".length===2&&" + "typeof " + n + '[0]==="number"&&' + "typeof " + n + '[1]==="number"&&' + n + "[0]<=" + n + "[1]", "depth range must be a 2d array");
                                });
                                var r = t.def("+", n, "[0]");
                                var i = t.def("+", n, "[1]");
                                return [ r, i ];
                            });

                          case Ga:
                            return e(function(e) {
                                fe.commandType(e, "object", "blend.func", o.commandStr);
                                var t = "srcRGB" in e ? e.srcRGB : e.src;
                                var n = "srcAlpha" in e ? e.srcAlpha : e.src;
                                var r = "dstRGB" in e ? e.dstRGB : e.dst;
                                var i = "dstAlpha" in e ? e.dstAlpha : e.dst;
                                fe.commandParameter(t, Es, a + ".srcRGB", o.commandStr);
                                fe.commandParameter(n, Es, a + ".srcAlpha", o.commandStr);
                                fe.commandParameter(r, Es, a + ".dstRGB", o.commandStr);
                                fe.commandParameter(i, Es, a + ".dstAlpha", o.commandStr);
                                fe.command(Ms.indexOf(t + ", " + r) === -1, "unallowed blending combination (srcRGB, dstRGB) = (" + t + ", " + r + ")", o.commandStr);
                                return [ Es[t], Es[r], Es[n], Es[i] ];
                            }, function(r, i, a) {
                                var o = r.constants.blendFuncs;
                                fe.optional(function() {
                                    r.assert(i, a + "&&typeof " + a + '==="object"', "invalid blend func, must be an object");
                                });
                                function e(e, t) {
                                    var n = i.def('"', e, t, '" in ', a, "?", a, ".", e, t, ":", a, ".", e);
                                    fe.optional(function() {
                                        r.assert(i, n + " in " + o, "invalid " + l + "." + e + t + ", must be one of " + Object.keys(Es));
                                    });
                                    return n;
                                }
                                var t = e("src", "RGB");
                                var n = e("dst", "RGB");
                                fe.optional(function() {
                                    var e = r.constants.invalidBlendCombinations;
                                    r.assert(i, e + ".indexOf(" + t + '+", "+' + n + ") === -1 ", "unallowed blending combination for (srcRGB, dstRGB)");
                                });
                                var s = i.def(o, "[", t, "]");
                                var u = i.def(o, "[", e("src", "Alpha"), "]");
                                var f = i.def(o, "[", n, "]");
                                var c = i.def(o, "[", e("dst", "Alpha"), "]");
                                return [ s, f, u, c ];
                            });

                          case za:
                            return e(function(e) {
                                if (typeof e === "string") {
                                    fe.commandParameter(e, f, "invalid " + l, o.commandStr);
                                    return [ f[e], f[e] ];
                                } else if (typeof e === "object") {
                                    fe.commandParameter(e.rgb, f, l + ".rgb", o.commandStr);
                                    fe.commandParameter(e.alpha, f, l + ".alpha", o.commandStr);
                                    return [ f[e.rgb], f[e.alpha] ];
                                } else {
                                    fe.commandRaise("invalid blend.equation", o.commandStr);
                                }
                            }, function(r, e, t) {
                                var i = r.constants.blendEquations;
                                var n = e.def();
                                var a = e.def();
                                var o = r.cond("typeof ", t, '==="string"');
                                fe.optional(function() {
                                    function e(e, t, n) {
                                        r.assert(e, n + " in " + i, "invalid " + t + ", must be one of " + Object.keys(f));
                                    }
                                    e(o.then, l, t);
                                    r.assert(o["else"], t + "&&typeof " + t + '==="object"', "invalid " + l);
                                    e(o["else"], l + ".rgb", t + ".rgb");
                                    e(o["else"], l + ".alpha", t + ".alpha");
                                });
                                o.then(n, "=", a, "=", i, "[", t, "];");
                                o["else"](n, "=", i, "[", t, ".rgb];", a, "=", i, "[", t, ".alpha];");
                                e(o);
                                return [ n, a ];
                            });

                          case qa:
                            return e(function(t) {
                                fe.command(Bn(t) && t.length === 4, "blend.color must be a 4d array", o.commandStr);
                                return Me(4, function(e) {
                                    return +t[e];
                                });
                            }, function(e, t, n) {
                                fe.optional(function() {
                                    e.assert(t, e.shared.isArrayLike + "(" + n + ")&&" + n + ".length===4", "blend.color must be a 4d array");
                                });
                                return Me(4, function(e) {
                                    return t.def("+", n, "[", e, "]");
                                });
                            });

                          case ro:
                            return e(function(e) {
                                fe.commandType(e, "number", a, o.commandStr);
                                return e | 0;
                            }, function(e, t, n) {
                                fe.optional(function() {
                                    e.assert(t, "typeof " + n + '==="number"', "invalid stencil.mask");
                                });
                                return t.def(n, "|0");
                            });

                          case io:
                            return e(function(e) {
                                fe.commandType(e, "object", a, o.commandStr);
                                var t = e.cmp || "keep";
                                var n = e.ref || 0;
                                var r = "mask" in e ? e.mask : -1;
                                fe.commandParameter(t, Ss, l + ".cmp", o.commandStr);
                                fe.commandType(n, "number", l + ".ref", o.commandStr);
                                fe.commandType(r, "number", l + ".mask", o.commandStr);
                                return [ Ss[t], n, r ];
                            }, function(t, n, r) {
                                var i = t.constants.compareFuncs;
                                fe.optional(function() {
                                    function e() {
                                        t.assert(n, Array.prototype.join.call(arguments, ""), "invalid stencil.func");
                                    }
                                    e(r + "&&typeof ", r, '==="object"');
                                    e('!("cmp" in ', r, ")||(", r, ".cmp in ", i, ")");
                                });
                                var e = n.def('"cmp" in ', r, "?", i, "[", r, ".cmp]", ":", gs);
                                var a = n.def(r, ".ref|0");
                                var o = n.def('"mask" in ', r, "?", r, ".mask|0:-1");
                                return [ e, a, o ];
                            });

                          case ao:
                          case oo:
                            return e(function(e) {
                                fe.commandType(e, "object", a, o.commandStr);
                                var t = e.fail || "keep";
                                var n = e.zfail || "keep";
                                var r = e.zpass || "keep";
                                fe.commandParameter(t, ws, l + ".fail", o.commandStr);
                                fe.commandParameter(n, ws, l + ".zfail", o.commandStr);
                                fe.commandParameter(r, ws, l + ".zpass", o.commandStr);
                                return [ l === oo ? ls : cs, ws[t], ws[n], ws[r] ];
                            }, function(t, n, r) {
                                var i = t.constants.stencilOps;
                                fe.optional(function() {
                                    t.assert(n, r + "&&typeof " + r + '==="object"', "invalid " + l);
                                });
                                function e(e) {
                                    fe.optional(function() {
                                        t.assert(n, '!("' + e + '" in ' + r + ")||" + "(" + r + "." + e + " in " + i + ")", "invalid " + l + "." + e + ", must be one of " + Object.keys(ws));
                                    });
                                    return n.def('"', e, '" in ', r, "?", i, "[", r, ".", e, "]:", gs);
                                }
                                return [ l === oo ? ls : cs, e("fail"), e("zfail"), e("zpass") ];
                            });

                          case Za:
                            return e(function(e) {
                                fe.commandType(e, "object", a, o.commandStr);
                                var t = e.factor | 0;
                                var n = e.units | 0;
                                fe.commandType(t, "number", a + ".factor", o.commandStr);
                                fe.commandType(n, "number", a + ".units", o.commandStr);
                                return [ t, n ];
                            }, function(e, t, n) {
                                fe.optional(function() {
                                    e.assert(t, n + "&&typeof " + n + '==="object"', "invalid " + l);
                                });
                                var r = t.def(n, ".factor|0");
                                var i = t.def(n, ".units|0");
                                return [ r, i ];
                            });

                          case Ya:
                            return e(function(e) {
                                var t = 0;
                                if (e === "front") {
                                    t = cs;
                                } else if (e === "back") {
                                    t = ls;
                                }
                                fe.command(!!t, a, o.commandStr);
                                return t;
                            }, function(e, t, n) {
                                fe.optional(function() {
                                    e.assert(t, n + '==="front"||' + n + '==="back"', "invalid cull.face");
                                });
                                return t.def(n, '==="front"?', cs, ":", ls);
                            });

                          case Ja:
                            return e(function(e) {
                                fe.command(typeof e === "number" && e >= p.lineWidthDims[0] && e <= p.lineWidthDims[1], "invalid line width, must be a positive number between " + p.lineWidthDims[0] + " and " + p.lineWidthDims[1], o.commandStr);
                                return e;
                            }, function(e, t, n) {
                                fe.optional(function() {
                                    e.assert(t, "typeof " + n + '==="number"&&' + n + ">=" + p.lineWidthDims[0] + "&&" + n + "<=" + p.lineWidthDims[1], "invalid line width");
                                });
                                return n;
                            });

                          case Ka:
                            return e(function(e) {
                                fe.commandParameter(e, Os, a, o.commandStr);
                                return Os[e];
                            }, function(e, t, n) {
                                fe.optional(function() {
                                    e.assert(t, n + '==="cw"||' + n + '==="ccw"', "invalid frontFace, must be one of cw,ccw");
                                });
                                return t.def(n + '==="cw"?' + hs + ":" + ds);
                            });

                          case Wa:
                            return e(function(e) {
                                fe.command(Bn(e) && e.length === 4, "color.mask must be length 4 array", o.commandStr);
                                return e.map(function(e) {
                                    return !!e;
                                });
                            }, function(e, t, n) {
                                fe.optional(function() {
                                    e.assert(t, e.shared.isArrayLike + "(" + n + ")&&" + n + ".length===4", "invalid color.mask");
                                });
                                return Me(4, function(e) {
                                    return "!!" + n + "[" + e + "]";
                                });
                            });

                          case to:
                            return e(function(e) {
                                fe.command(typeof e === "object" && e, a, o.commandStr);
                                var t = "value" in e ? e.value : 1;
                                var n = !!e.invert;
                                fe.command(typeof t === "number" && t >= 0 && t <= 1, "sample.coverage.value must be a number between 0 and 1", o.commandStr);
                                return [ t, n ];
                            }, function(e, t, n) {
                                fe.optional(function() {
                                    e.assert(t, n + "&&typeof " + n + '==="object"', "invalid sample.coverage");
                                });
                                var r = t.def('"value" in ', n, "?+", n, ".value:1");
                                var i = t.def("!!", n, ".invert");
                                return [ r, i ];
                            });
                        }
                    });
                    return u;
                }
                function U(e, i) {
                    var a = e["static"];
                    var t = e.dynamic;
                    var o = {};
                    Object.keys(a).forEach(function(n) {
                        var r = a[n];
                        var e;
                        if (typeof r === "number" || typeof r === "boolean") {
                            e = Is(function() {
                                return r;
                            });
                        } else if (typeof r === "function") {
                            var t = r._reglType;
                            if (t === "texture2d" || t === "textureCube") {
                                e = Is(function(e) {
                                    return e.link(r);
                                });
                            } else if (t === "framebuffer" || t === "framebufferCube") {
                                fe.command(r.color.length > 0, 'missing color attachment for framebuffer sent to uniform "' + n + '"', i.commandStr);
                                e = Is(function(e) {
                                    return e.link(r.color[0]);
                                });
                            } else {
                                fe.commandRaise('invalid data for uniform "' + n + '"', i.commandStr);
                            }
                        } else if (Bn(r)) {
                            e = Is(function(t) {
                                var e = t.global.def("[", Me(r.length, function(e) {
                                    fe.command(typeof r[e] === "number" || typeof r[e] === "boolean", "invalid uniform " + n, t.commandStr);
                                    return r[e];
                                }), "]");
                                return e;
                            });
                        } else {
                            fe.commandRaise('invalid or missing data for uniform "' + n + '"', i.commandStr);
                        }
                        e.value = r;
                        o[n] = e;
                    });
                    Object.keys(t).forEach(function(e) {
                        var n = t[e];
                        o[e] = Ds(n, function(e, t) {
                            return e.invoke(t, n);
                        });
                    });
                    return o;
                }
                function q(e, h) {
                    var d = e["static"];
                    var t = e.dynamic;
                    var p = {};
                    Object.keys(d).forEach(function(r) {
                        var e = d[r];
                        var i = E.id(r);
                        var a = new m();
                        if (Cs(e)) {
                            a.state = Ca;
                            a.buffer = v.getBuffer(v.create(e, Bo, false, true));
                            a.type = 0;
                        } else {
                            var t = v.getBuffer(e);
                            if (t) {
                                a.state = Ca;
                                a.buffer = t;
                                a.type = 0;
                            } else {
                                fe.command(typeof e === "object" && e, "invalid data for attribute " + r, h.commandStr);
                                if ("constant" in e) {
                                    var n = e.constant;
                                    a.buffer = "null";
                                    a.state = Ba;
                                    if (typeof n === "number") {
                                        a.x = n;
                                    } else {
                                        fe.command(Bn(n) && n.length > 0 && n.length <= 4, "invalid constant for attribute " + r, h.commandStr);
                                        Ra.forEach(function(e, t) {
                                            if (t < n.length) {
                                                a[e] = n[t];
                                            }
                                        });
                                    }
                                } else {
                                    if (Cs(e.buffer)) {
                                        t = v.getBuffer(v.create(e.buffer, Bo, false, true));
                                    } else {
                                        t = v.getBuffer(e.buffer);
                                    }
                                    fe.command(!!t, 'missing buffer for attribute "' + r + '"', h.commandStr);
                                    var o = e.offset | 0;
                                    fe.command(o >= 0, 'invalid offset for attribute "' + r + '"', h.commandStr);
                                    var s = e.stride | 0;
                                    fe.command(s >= 0 && s < 256, 'invalid stride for attribute "' + r + '", must be integer betweeen [0, 255]', h.commandStr);
                                    var u = e.size | 0;
                                    fe.command(!("size" in e) || u > 0 && u <= 4, 'invalid size for attribute "' + r + '", must be 1,2,3,4', h.commandStr);
                                    var f = !!e.normalized;
                                    var c = 0;
                                    if ("type" in e) {
                                        fe.commandParameter(e.type, jt, "invalid type for attribute " + r, h.commandStr);
                                        c = jt[e.type];
                                    }
                                    var l = e.divisor | 0;
                                    if ("divisor" in e) {
                                        fe.command(l === 0 || A, 'cannot specify divisor for attribute "' + r + '", instancing not supported', h.commandStr);
                                        fe.command(l >= 0, 'invalid divisor for attribute "' + r + '"', h.commandStr);
                                    }
                                    fe.optional(function() {
                                        var t = h.commandStr;
                                        var n = [ "buffer", "offset", "divisor", "normalized", "type", "size", "stride" ];
                                        Object.keys(e).forEach(function(e) {
                                            fe.command(n.indexOf(e) >= 0, 'unknown parameter "' + e + '" for attribute pointer "' + r + '" (valid parameters are ' + n + ")", t);
                                        });
                                    });
                                    a.buffer = t;
                                    a.state = Ca;
                                    a.size = u;
                                    a.normalized = f;
                                    a.type = c || t.dtype;
                                    a.offset = o;
                                    a.stride = s;
                                    a.divisor = l;
                                }
                            }
                        }
                        p[r] = Is(function(e, t) {
                            var n = e.attribCache;
                            if (i in n) {
                                return n[i];
                            }
                            var r = {
                                isStream: false
                            };
                            Object.keys(a).forEach(function(e) {
                                r[e] = a[e];
                            });
                            if (a.buffer) {
                                r.buffer = e.link(a.buffer);
                                r.type = r.type || r.buffer + ".dtype";
                            }
                            n[i] = r;
                            return r;
                        });
                    });
                    Object.keys(t).forEach(function(h) {
                        var d = t[h];
                        function e(e, t) {
                            var n = e.invoke(t, d);
                            var r = e.shared;
                            var i = e.constants;
                            var a = r.isBufferArgs;
                            var o = r.buffer;
                            fe.optional(function() {
                                e.assert(t, n + "&&(typeof " + n + '==="object"||typeof ' + n + '==="function")&&(' + a + "(" + n + ")||" + o + ".getBuffer(" + n + ")||" + o + ".getBuffer(" + n + ".buffer)||" + a + "(" + n + ".buffer)||" + '("constant" in ' + n + "&&(typeof " + n + '.constant==="number"||' + r.isArrayLike + "(" + n + ".constant))))", 'invalid dynamic attribute "' + h + '"');
                            });
                            var s = {
                                isStream: t.def(false)
                            };
                            var u = new m();
                            u.state = Ca;
                            Object.keys(u).forEach(function(e) {
                                s[e] = t.def("" + u[e]);
                            });
                            var f = s.buffer;
                            var c = s.type;
                            t("if(", a, "(", n, ")){", s.isStream, "=true;", f, "=", o, ".createStream(", Bo, ",", n, ");", c, "=", f, ".dtype;", "}else{", f, "=", o, ".getBuffer(", n, ");", "if(", f, "){", c, "=", f, ".dtype;", '}else if("constant" in ', n, "){", s.state, "=", Ba, ";", "if(typeof " + n + '.constant === "number"){', s[Ra[0]], "=", n, ".constant;", Ra.slice(1).map(function(e) {
                                return s[e];
                            }).join("="), "=0;", "}else{", Ra.map(function(e, t) {
                                return s[e] + "=" + n + ".constant.length>" + t + "?" + n + ".constant[" + t + "]:0;";
                            }).join(""), "}}else{", "if(", a, "(", n, ".buffer)){", f, "=", o, ".createStream(", Bo, ",", n, ".buffer);", "}else{", f, "=", o, ".getBuffer(", n, ".buffer);", "}", c, '="type" in ', n, "?", i.glTypes, "[", n, ".type]:", f, ".dtype;", s.normalized, "=!!", n, ".normalized;");
                            function l(e) {
                                t(s[e], "=", n, ".", e, "|0;");
                            }
                            l("size");
                            l("offset");
                            l("stride");
                            l("divisor");
                            t("}}");
                            t.exit("if(", s.isStream, "){", o, ".destroyStream(", f, ");", "}");
                            return s;
                        }
                        p[h] = Ds(d, e);
                    });
                    return p;
                }
                function z(e, t) {
                    var n = e["static"];
                    var r = e.dynamic;
                    if (bo in n) {
                        var i = n[bo];
                        if (i !== null && b.getVAO(i) === null) {
                            i = b.createVAO(i);
                        }
                        return Is(function(e) {
                            return e.link(b.getVAO(i));
                        });
                    } else if (bo in r) {
                        var a = r[bo];
                        return Ds(a, function(e, t) {
                            var n = e.invoke(t, a);
                            return t.def(e.shared.vao + ".getVAO(" + n + ")");
                        });
                    }
                    return null;
                }
                function G(e) {
                    var t = e["static"];
                    var r = e.dynamic;
                    var i = {};
                    Object.keys(t).forEach(function(e) {
                        var n = t[e];
                        i[e] = Is(function(e, t) {
                            if (typeof n === "number" || typeof n === "boolean") {
                                return "" + n;
                            } else {
                                return e.link(n);
                            }
                        });
                    });
                    Object.keys(r).forEach(function(e) {
                        var n = r[e];
                        i[e] = Ds(n, function(e, t) {
                            return e.invoke(t, n);
                        });
                    });
                    return i;
                }
                function H(e, n, t, r, i) {
                    var a = e["static"];
                    var o = e.dynamic;
                    fe.optional(function() {
                        var t = [ lo, ho, po, vo, mo, _o, go, xo, co, bo ].concat(T);
                        function e(e) {
                            Object.keys(e).forEach(function(e) {
                                fe.command(t.indexOf(e) >= 0, 'unknown parameter "' + e + '"', i.commandStr);
                            });
                        }
                        e(a);
                        e(o);
                    });
                    var s = I(e, n);
                    var u = F(e);
                    var f = P(e, u, i);
                    var c = N(e, i);
                    var l = L(e, i);
                    var h = D(e, i, s);
                    function d(e) {
                        var t = f[e];
                        if (t) {
                            l[e] = t;
                        }
                    }
                    d(fo);
                    d(S(uo));
                    var p = Object.keys(l).length > 0;
                    var v = {
                        framebuffer: u,
                        draw: c,
                        shader: h,
                        state: l,
                        dirty: p,
                        scopeVAO: null,
                        drawVAO: null,
                        useVAO: false,
                        attributes: {}
                    };
                    v.profile = B(e);
                    v.uniforms = U(t, i);
                    v.drawVAO = v.scopeVAO = z(e);
                    if (!v.drawVAO && h.program && !s && x.angle_instanced_arrays) {
                        var m = true;
                        var g = h.program.attributes.map(function(e) {
                            var t = n["static"][e];
                            m = m && !!t;
                            return t;
                        });
                        if (m && g.length > 0) {
                            var _ = b.getVAO(b.createVAO(g));
                            v.drawVAO = new Fs(null, null, null, function(e, t) {
                                return e.link(_);
                            });
                            v.useVAO = true;
                        }
                    }
                    if (s) {
                        v.useVAO = true;
                    } else {
                        v.attributes = q(n, i);
                    }
                    v.context = G(r);
                    return v;
                }
                function V(n, r, i) {
                    var e = n.shared;
                    var a = e.context;
                    var o = n.scope();
                    Object.keys(i).forEach(function(e) {
                        r.save(a, "." + e);
                        var t = i[e];
                        o(a, ".", e, "=", t.append(n, r), ";");
                    });
                    r(o);
                }
                function k(e, t, n, r) {
                    var i = e.shared;
                    var a = i.gl;
                    var o = i.framebuffer;
                    var s;
                    if (h) {
                        s = t.def(i.extensions, ".webgl_draw_buffers");
                    }
                    var u = e.constants;
                    var f = u.drawBuffer;
                    var c = u.backBuffer;
                    var l;
                    if (n) {
                        l = n.append(e, t);
                    } else {
                        l = t.def(o, ".next");
                    }
                    if (!r) {
                        t("if(", l, "!==", o, ".cur){");
                    }
                    t("if(", l, "){", a, ".bindFramebuffer(", As, ",", l, ".framebuffer);");
                    if (h) {
                        t(s, ".drawBuffersWEBGL(", f, "[", l, ".colorAttachments.length]);");
                    }
                    t("}else{", a, ".bindFramebuffer(", As, ",null);");
                    if (h) {
                        t(s, ".drawBuffersWEBGL(", c, ");");
                    }
                    t("}", o, ".cur=", l, ";");
                    if (!r) {
                        t("}");
                    }
                }
                function j(o, e, s) {
                    var t = o.shared;
                    var u = t.gl;
                    var f = o.current;
                    var c = o.next;
                    var l = t.current;
                    var h = t.next;
                    var d = o.cond(l, ".dirty");
                    T.forEach(function(e) {
                        var t = S(e);
                        if (t in s.state) {
                            return;
                        }
                        var n, r;
                        if (t in c) {
                            n = c[t];
                            r = f[t];
                            var i = Me(g[t].length, function(e) {
                                return d.def(n, "[", e, "]");
                            });
                            d(o.cond(i.map(function(e, t) {
                                return e + "!==" + r + "[" + t + "]";
                            }).join("||")).then(u, ".", M[t], "(", i, ");", i.map(function(e, t) {
                                return r + "[" + t + "]=" + e;
                            }).join(";"), ";"));
                        } else {
                            n = d.def(h, ".", t);
                            var a = o.cond(n, "!==", l, ".", t);
                            d(a);
                            if (t in _) {
                                a(o.cond(n).then(u, ".enable(", _[t], ");")["else"](u, ".disable(", _[t], ");"), l, ".", t, "=", n, ";");
                            } else {
                                a(u, ".", M[t], "(", n, ");", l, ".", t, "=", n, ";");
                            }
                        }
                    });
                    if (Object.keys(s.state).length === 0) {
                        d(l, ".dirty=false;");
                    }
                    e(d);
                }
                function W(a, o, s, u) {
                    var e = a.shared;
                    var f = a.current;
                    var c = e.current;
                    var l = e.gl;
                    Bs(Object.keys(s)).forEach(function(e) {
                        var t = s[e];
                        if (u && !u(t)) {
                            return;
                        }
                        var n = t.append(a, o);
                        if (_[e]) {
                            var r = _[e];
                            if (Ps(t)) {
                                if (n) {
                                    o(l, ".enable(", r, ");");
                                } else {
                                    o(l, ".disable(", r, ");");
                                }
                            } else {
                                o(a.cond(n).then(l, ".enable(", r, ");")["else"](l, ".disable(", r, ");"));
                            }
                            o(c, ".", e, "=", n, ";");
                        } else if (Bn(n)) {
                            var i = f[e];
                            o(l, ".", M[e], "(", n, ");", n.map(function(e, t) {
                                return i + "[" + t + "]=" + e;
                            }).join(";"), ";");
                        } else {
                            o(l, ".", M[e], "(", n, ");", c, ".", e, "=", n, ";");
                        }
                    });
                }
                function X(e, t) {
                    if (A) {
                        e.instancing = t.def(e.shared.extensions, ".angle_instanced_arrays");
                    }
                }
                function Y(e, n, t, r, i) {
                    var a = e.shared;
                    var o = e.stats;
                    var s = a.current;
                    var u = a.timer;
                    var f = t.profile;
                    function c() {
                        if (typeof performance === "undefined") {
                            return "Date.now()";
                        } else {
                            return "performance.now()";
                        }
                    }
                    var l, h;
                    function d(e) {
                        l = n.def();
                        e(l, "=", c(), ";");
                        if (typeof i === "string") {
                            e(o, ".count+=", i, ";");
                        } else {
                            e(o, ".count++;");
                        }
                        if (y) {
                            if (r) {
                                h = n.def();
                                e(h, "=", u, ".getNumPendingQueries();");
                            } else {
                                e(u, ".beginQuery(", o, ");");
                            }
                        }
                    }
                    function p(e) {
                        e(o, ".cpuTime+=", c(), "-", l, ";");
                        if (y) {
                            if (r) {
                                e(u, ".pushScopeStats(", h, ",", u, ".getNumPendingQueries(),", o, ");");
                            } else {
                                e(u, ".endQuery();");
                            }
                        }
                    }
                    function v(e) {
                        var t = n.def(s, ".profile");
                        n(s, ".profile=", e, ";");
                        n.exit(s, ".profile=", t, ";");
                    }
                    var m;
                    if (f) {
                        if (Ps(f)) {
                            if (f.enable) {
                                d(n);
                                p(n.exit);
                                v("true");
                            } else {
                                v("false");
                            }
                            return;
                        }
                        m = f.append(e, n);
                        v(m);
                    } else {
                        m = n.def(s, ".profile");
                    }
                    var g = e.block();
                    d(g);
                    n("if(", m, "){", g, "}");
                    var _ = e.block();
                    p(_);
                    n.exit("if(", m, "){", _, "}");
                }
                function K(h, d, a, e, o) {
                    var p = h.shared;
                    function s(e) {
                        switch (e) {
                          case Xo:
                          case Qo:
                          case ts:
                            return 2;

                          case Yo:
                          case Zo:
                          case ns:
                            return 3;

                          case Ko:
                          case $o:
                          case rs:
                            return 4;

                          default:
                            return 1;
                        }
                    }
                    function u(e, r, i) {
                        var a = p.gl;
                        var o = d.def(e, ".location");
                        var s = d.def(p.attributes, "[", o, "]");
                        var t = i.state;
                        var u = i.buffer;
                        var n = [ i.x, i.y, i.z, i.w ];
                        var f = [ "buffer", "normalized", "offset", "stride" ];
                        function c() {
                            d("if(!", s, ".buffer){", a, ".enableVertexAttribArray(", o, ");}");
                            var e = i.type;
                            var t;
                            if (!i.size) {
                                t = r;
                            } else {
                                t = d.def(i.size, "||", r);
                            }
                            d("if(", s, ".type!==", e, "||", s, ".size!==", t, "||", f.map(function(e) {
                                return s + "." + e + "!==" + i[e];
                            }).join("||"), "){", a, ".bindBuffer(", Bo, ",", u, ".buffer);", a, ".vertexAttribPointer(", [ o, t, e, i.normalized, i.stride, i.offset ], ");", s, ".type=", e, ";", s, ".size=", t, ";", f.map(function(e) {
                                return s + "." + e + "=" + i[e] + ";";
                            }).join(""), "}");
                            if (A) {
                                var n = i.divisor;
                                d("if(", s, ".divisor!==", n, "){", h.instancing, ".vertexAttribDivisorANGLE(", [ o, n ], ");", s, ".divisor=", n, ";}");
                            }
                        }
                        function l() {
                            d("if(", s, ".buffer){", a, ".disableVertexAttribArray(", o, ");", s, ".buffer=null;", "}if(", Ra.map(function(e, t) {
                                return s + "." + e + "!==" + n[t];
                            }).join("||"), "){", a, ".vertexAttrib4f(", o, ",", n, ");", Ra.map(function(e, t) {
                                return s + "." + e + "=" + n[t] + ";";
                            }).join(""), "}");
                        }
                        if (t === Ca) {
                            c();
                        } else if (t === Ba) {
                            l();
                        } else {
                            d("if(", t, "===", Ca, "){");
                            c();
                            d("}else{");
                            l();
                            d("}");
                        }
                    }
                    e.forEach(function(e) {
                        var t = e.name;
                        var n = a.attributes[t];
                        var r;
                        if (n) {
                            if (!o(n)) {
                                return;
                            }
                            r = n.append(h, d);
                        } else {
                            if (!o(Ns)) {
                                return;
                            }
                            var i = h.scopeAttrib(t);
                            fe.optional(function() {
                                h.assert(d, i + ".state", "missing attribute " + t);
                            });
                            r = {};
                            Object.keys(new m()).forEach(function(e) {
                                r[e] = d.def(i, ".", e);
                            });
                        }
                        u(h.link(e), s(e.info.type), r);
                    });
                }
                function J(i, a, e, t, n) {
                    var o = i.shared;
                    var r = o.gl;
                    var s;
                    for (var u = 0; u < t.length; ++u) {
                        var f = t[u];
                        var c = f.name;
                        var l = f.info.type;
                        var h = e.uniforms[c];
                        var d = i.link(f);
                        var p = d + ".location";
                        var v;
                        if (h) {
                            if (!n(h)) {
                                continue;
                            }
                            if (Ps(h)) {
                                var m = h.value;
                                fe.command(m !== null && typeof m !== "undefined", 'missing uniform "' + c + '"', i.commandStr);
                                if (l === ss || l === us) {
                                    fe.command(typeof m === "function" && (l === ss && (m._reglType === "texture2d" || m._reglType === "framebuffer") || l === us && (m._reglType === "textureCube" || m._reglType === "framebufferCube")), "invalid texture for uniform " + c, i.commandStr);
                                    var g = i.link(m._texture || m.color[0]._texture);
                                    a(r, ".uniform1i(", p, ",", g + ".bind());");
                                    a.exit(g, ".unbind();");
                                } else if (l === is || l === as || l === os) {
                                    fe.optional(function() {
                                        fe.command(Bn(m), "invalid matrix for uniform " + c, i.commandStr);
                                        fe.command(l === is && m.length === 4 || l === as && m.length === 9 || l === os && m.length === 16, "invalid length for matrix uniform " + c, i.commandStr);
                                    });
                                    var _ = i.global.def("new Float32Array([" + Array.prototype.slice.call(m) + "])");
                                    var x = 2;
                                    if (l === as) {
                                        x = 3;
                                    } else if (l === os) {
                                        x = 4;
                                    }
                                    a(r, ".uniformMatrix", x, "fv(", p, ",false,", _, ");");
                                } else {
                                    switch (l) {
                                      case Wo:
                                        fe.commandType(m, "number", "uniform " + c, i.commandStr);
                                        s = "1f";
                                        break;

                                      case Xo:
                                        fe.command(Bn(m) && m.length === 2, "uniform " + c, i.commandStr);
                                        s = "2f";
                                        break;

                                      case Yo:
                                        fe.command(Bn(m) && m.length === 3, "uniform " + c, i.commandStr);
                                        s = "3f";
                                        break;

                                      case Ko:
                                        fe.command(Bn(m) && m.length === 4, "uniform " + c, i.commandStr);
                                        s = "4f";
                                        break;

                                      case es:
                                        fe.commandType(m, "boolean", "uniform " + c, i.commandStr);
                                        s = "1i";
                                        break;

                                      case Jo:
                                        fe.commandType(m, "number", "uniform " + c, i.commandStr);
                                        s = "1i";
                                        break;

                                      case ts:
                                        fe.command(Bn(m) && m.length === 2, "uniform " + c, i.commandStr);
                                        s = "2i";
                                        break;

                                      case Qo:
                                        fe.command(Bn(m) && m.length === 2, "uniform " + c, i.commandStr);
                                        s = "2i";
                                        break;

                                      case ns:
                                        fe.command(Bn(m) && m.length === 3, "uniform " + c, i.commandStr);
                                        s = "3i";
                                        break;

                                      case Zo:
                                        fe.command(Bn(m) && m.length === 3, "uniform " + c, i.commandStr);
                                        s = "3i";
                                        break;

                                      case rs:
                                        fe.command(Bn(m) && m.length === 4, "uniform " + c, i.commandStr);
                                        s = "4i";
                                        break;

                                      case $o:
                                        fe.command(Bn(m) && m.length === 4, "uniform " + c, i.commandStr);
                                        s = "4i";
                                        break;
                                    }
                                    a(r, ".uniform", s, "(", p, ",", Bn(m) ? Array.prototype.slice.call(m) : m, ");");
                                }
                                continue;
                            } else {
                                v = h.append(i, a);
                            }
                        } else {
                            if (!n(Ns)) {
                                continue;
                            }
                            v = a.def(o.uniforms, "[", E.id(c), "]");
                        }
                        if (l === ss) {
                            a("if(", v, "&&", v, '._reglType==="framebuffer"){', v, "=", v, ".color[0];", "}");
                        } else if (l === us) {
                            a("if(", v, "&&", v, '._reglType==="framebufferCube"){', v, "=", v, ".color[0];", "}");
                        }
                        fe.optional(function() {
                            function n(e, t) {
                                i.assert(a, e, 'bad data or missing for uniform "' + c + '".  ' + t);
                            }
                            function e(e) {
                                n("typeof " + v + '==="' + e + '"', "invalid type, expected " + e);
                            }
                            function t(e, t) {
                                n(o.isArrayLike + "(" + v + ")&&" + v + ".length===" + e, "invalid vector, should have length " + e, i.commandStr);
                            }
                            function r(e) {
                                n("typeof " + v + '==="function"&&' + v + '._reglType==="texture' + (e === Do ? "2d" : "Cube") + '"', "invalid texture type", i.commandStr);
                            }
                            switch (l) {
                              case Jo:
                                e("number");
                                break;

                              case Qo:
                                t(2);
                                break;

                              case Zo:
                                t(3);
                                break;

                              case $o:
                                t(4);
                                break;

                              case Wo:
                                e("number");
                                break;

                              case Xo:
                                t(2);
                                break;

                              case Yo:
                                t(3);
                                break;

                              case Ko:
                                t(4);
                                break;

                              case es:
                                e("boolean");
                                break;

                              case ts:
                                t(2);
                                break;

                              case ns:
                                t(3);
                                break;

                              case rs:
                                t(4);
                                break;

                              case is:
                                t(4);
                                break;

                              case as:
                                t(9);
                                break;

                              case os:
                                t(16);
                                break;

                              case ss:
                                r(Do);
                                break;

                              case us:
                                r(No);
                                break;
                            }
                        });
                        var b = 1;
                        switch (l) {
                          case ss:
                          case us:
                            var y = a.def(v, "._texture");
                            a(r, ".uniform1i(", p, ",", y, ".bind());");
                            a.exit(y, ".unbind();");
                            continue;

                          case Jo:
                          case es:
                            s = "1i";
                            break;

                          case Qo:
                          case ts:
                            s = "2i";
                            b = 2;
                            break;

                          case Zo:
                          case ns:
                            s = "3i";
                            b = 3;
                            break;

                          case $o:
                          case rs:
                            s = "4i";
                            b = 4;
                            break;

                          case Wo:
                            s = "1f";
                            break;

                          case Xo:
                            s = "2f";
                            b = 2;
                            break;

                          case Yo:
                            s = "3f";
                            b = 3;
                            break;

                          case Ko:
                            s = "4f";
                            b = 4;
                            break;

                          case is:
                            s = "Matrix2fv";
                            break;

                          case as:
                            s = "Matrix3fv";
                            break;

                          case os:
                            s = "Matrix4fv";
                            break;
                        }
                        a(r, ".uniform", s, "(", p, ",");
                        if (s.charAt(0) === "M") {
                            var A = Math.pow(l - is + 2, 2);
                            var T = i.global.def("new Float32Array(", A, ")");
                            a("false,(Array.isArray(", v, ")||", v, " instanceof Float32Array)?", v, ":(", Me(A, function(e) {
                                return T + "[" + e + "]=" + v + "[" + e + "]";
                            }), ",", T, ")");
                        } else if (b > 1) {
                            a(Me(b, function(e) {
                                return v + "[" + e + "]";
                            }));
                        } else {
                            a(v);
                        }
                        a(");");
                    }
                }
                function Q(r, i, a, o) {
                    var e = r.shared;
                    var s = e.gl;
                    var u = e.draw;
                    var f = o.draw;
                    function t() {
                        var e = f.elements;
                        var t;
                        var n = i;
                        if (e) {
                            if (e.contextDep && o.contextDynamic || e.propDep) {
                                n = a;
                            }
                            t = e.append(r, n);
                        } else {
                            t = n.def(u, ".", vo);
                        }
                        if (t) {
                            n("if(" + t + ")" + s + ".bindBuffer(" + Fo + "," + t + ".buffer.buffer);");
                        }
                        return t;
                    }
                    function n() {
                        var e = f.count;
                        var t;
                        var n = i;
                        if (e) {
                            if (e.contextDep && o.contextDynamic || e.propDep) {
                                n = a;
                            }
                            t = e.append(r, n);
                            fe.optional(function() {
                                if (e.MISSING) {
                                    r.assert(i, "false", "missing vertex count");
                                }
                                if (e.DYNAMIC) {
                                    r.assert(n, t + ">=0", "missing vertex count");
                                }
                            });
                        } else {
                            t = n.def(u, ".", go);
                            fe.optional(function() {
                                r.assert(n, t + ">=0", "missing vertex count");
                            });
                        }
                        return t;
                    }
                    var c = t();
                    function l(e) {
                        var t = f[e];
                        if (t) {
                            if (t.contextDep && o.contextDynamic || t.propDep) {
                                return t.append(r, a);
                            } else {
                                return t.append(r, i);
                            }
                        } else {
                            return i.def(u, ".", e);
                        }
                    }
                    var h = l(mo);
                    var d = l(_o);
                    var p = n();
                    if (typeof p === "number") {
                        if (p === 0) {
                            return;
                        }
                    } else {
                        a("if(", p, "){");
                        a.exit("}");
                    }
                    var v, m;
                    if (A) {
                        v = l(xo);
                        m = r.instancing;
                    }
                    var g = c + ".type";
                    var _ = f.elements && Ps(f.elements);
                    function x() {
                        function e() {
                            a(m, ".drawElementsInstancedANGLE(", [ h, p, g, d + "<<((" + g + "-" + Oa + ")>>1)", v ], ");");
                        }
                        function t() {
                            a(m, ".drawArraysInstancedANGLE(", [ h, d, p, v ], ");");
                        }
                        if (c) {
                            if (!_) {
                                a("if(", c, "){");
                                e();
                                a("}else{");
                                t();
                                a("}");
                            } else {
                                e();
                            }
                        } else {
                            t();
                        }
                    }
                    function b() {
                        function e() {
                            a(s + ".drawElements(" + [ h, p, g, d + "<<((" + g + "-" + Oa + ")>>1)" ] + ");");
                        }
                        function t() {
                            a(s + ".drawArrays(" + [ h, d, p ] + ");");
                        }
                        if (c) {
                            if (!_) {
                                a("if(", c, "){");
                                e();
                                a("}else{");
                                t();
                                a("}");
                            } else {
                                e();
                            }
                        } else {
                            t();
                        }
                    }
                    if (A && (typeof v !== "number" || v >= 0)) {
                        if (typeof v === "string") {
                            a("if(", v, ">0){");
                            x();
                            a("}else if(", v, "<0){");
                            b();
                            a("}");
                        } else {
                            x();
                        }
                    } else {
                        b();
                    }
                }
                function Z(e, t, n, r, i) {
                    var a = C();
                    var o = a.proc("body", i);
                    fe.optional(function() {
                        a.commandStr = t.commandStr;
                        a.command = a.link(t.commandStr);
                    });
                    if (A) {
                        a.instancing = o.def(a.shared.extensions, ".angle_instanced_arrays");
                    }
                    e(a, o, n, r);
                    return a.compile().body;
                }
                function $(e, t, n, r) {
                    X(e, t);
                    if (n.useVAO) {
                        if (n.drawVAO) {
                            t(e.shared.vao, ".setVAO(", n.drawVAO.append(e, t), ");");
                        } else {
                            t(e.shared.vao, ".setVAO(", e.shared.vao, ".targetVAO);");
                        }
                    } else {
                        t(e.shared.vao, ".setVAO(null);");
                        K(e, t, n, r.attributes, function() {
                            return true;
                        });
                    }
                    J(e, t, n, r.uniforms, function() {
                        return true;
                    });
                    Q(e, t, t, n);
                }
                function ee(t, n) {
                    var e = t.proc("draw", 1);
                    X(t, e);
                    V(t, e, n.context);
                    k(t, e, n.framebuffer);
                    j(t, e, n);
                    W(t, e, n.state);
                    Y(t, e, n, false, true);
                    var r = n.shader.progVar.append(t, e);
                    e(t.shared.gl, ".useProgram(", r, ".program);");
                    if (n.shader.program) {
                        $(t, e, n, n.shader.program);
                    } else {
                        e(t.shared.vao, ".setVAO(null);");
                        var i = t.global.def("{}");
                        var a = e.def(r, ".id");
                        var o = e.def(i, "[", a, "]");
                        e(t.cond(o).then(o, ".call(this,a0);")["else"](o, "=", i, "[", a, "]=", t.link(function(e) {
                            return Z($, t, n, e, 1);
                        }), "(", r, ");", o, ".call(this,a0);"));
                    }
                    if (Object.keys(n.state).length > 0) {
                        e(t.shared.current, ".dirty=true;");
                    }
                }
                function te(e, t, n, r) {
                    e.batchId = "a1";
                    X(e, t);
                    function i() {
                        return true;
                    }
                    K(e, t, n, r.attributes, i);
                    J(e, t, n, r.uniforms, i);
                    Q(e, t, t, n);
                }
                function ne(t, e, n, r) {
                    X(t, e);
                    var i = n.contextDep;
                    var a = e.def();
                    var o = "a0";
                    var s = "a1";
                    var u = e.def();
                    t.shared.props = u;
                    t.batchId = a;
                    var f = t.scope();
                    var c = t.scope();
                    e(f.entry, "for(", a, "=0;", a, "<", s, ";++", a, "){", u, "=", o, "[", a, "];", c, "}", f.exit);
                    function l(e) {
                        return e.contextDep && i || e.propDep;
                    }
                    function h(e) {
                        return !l(e);
                    }
                    if (n.needsContext) {
                        V(t, c, n.context);
                    }
                    if (n.needsFramebuffer) {
                        k(t, c, n.framebuffer);
                    }
                    W(t, c, n.state, l);
                    if (n.profile && l(n.profile)) {
                        Y(t, c, n, false, true);
                    }
                    if (!r) {
                        var d = t.global.def("{}");
                        var p = n.shader.progVar.append(t, c);
                        var v = c.def(p, ".id");
                        var m = c.def(d, "[", v, "]");
                        c(t.shared.gl, ".useProgram(", p, ".program);", "if(!", m, "){", m, "=", d, "[", v, "]=", t.link(function(e) {
                            return Z(te, t, n, e, 2);
                        }), "(", p, ");}", m, ".call(this,a0[", a, "],", a, ");");
                    } else {
                        if (n.useVAO) {
                            if (n.drawVAO) {
                                if (l(n.drawVAO)) {
                                    c(t.shared.vao, ".setVAO(", n.drawVAO.append(t, c), ");");
                                } else {
                                    f(t.shared.vao, ".setVAO(", n.drawVAO.append(t, f), ");");
                                }
                            } else {
                                f(t.shared.vao, ".setVAO(", t.shared.vao, ".targetVAO);");
                            }
                        } else {
                            f(t.shared.vao, ".setVAO(null);");
                            K(t, f, n, r.attributes, h);
                            K(t, c, n, r.attributes, l);
                        }
                        J(t, f, n, r.uniforms, h);
                        J(t, c, n, r.uniforms, l);
                        Q(t, f, c, n);
                    }
                }
                function re(t, n) {
                    var e = t.proc("batch", 2);
                    t.batchId = "0";
                    X(t, e);
                    var r = false;
                    var i = true;
                    Object.keys(n.context).forEach(function(e) {
                        r = r || n.context[e].propDep;
                    });
                    if (!r) {
                        V(t, e, n.context);
                        i = false;
                    }
                    var a = n.framebuffer;
                    var o = false;
                    if (a) {
                        if (a.propDep) {
                            r = o = true;
                        } else if (a.contextDep && r) {
                            o = true;
                        }
                        if (!o) {
                            k(t, e, a);
                        }
                    } else {
                        k(t, e, null);
                    }
                    if (n.state.viewport && n.state.viewport.propDep) {
                        r = true;
                    }
                    function s(e) {
                        return e.contextDep && r || e.propDep;
                    }
                    j(t, e, n);
                    W(t, e, n.state, function(e) {
                        return !s(e);
                    });
                    if (!n.profile || !s(n.profile)) {
                        Y(t, e, n, false, "a1");
                    }
                    n.contextDep = r;
                    n.needsContext = i;
                    n.needsFramebuffer = o;
                    var u = n.shader.progVar;
                    if (u.contextDep && r || u.propDep) {
                        ne(t, e, n, null);
                    } else {
                        var f = u.append(t, e);
                        e(t.shared.gl, ".useProgram(", f, ".program);");
                        if (n.shader.program) {
                            ne(t, e, n, n.shader.program);
                        } else {
                            e(t.shared.vao, ".setVAO(null);");
                            var c = t.global.def("{}");
                            var l = e.def(f, ".id");
                            var h = e.def(c, "[", l, "]");
                            e(t.cond(h).then(h, ".call(this,a0,a1);")["else"](h, "=", c, "[", l, "]=", t.link(function(e) {
                                return Z(ne, t, n, e, 2);
                            }), "(", f, ");", h, ".call(this,a0,a1);"));
                        }
                    }
                    if (Object.keys(n.state).length > 0) {
                        e(t.shared.current, ".dirty=true;");
                    }
                }
                function ie(r, i) {
                    var a = r.proc("scope", 3);
                    r.batchId = "a2";
                    var o = r.shared;
                    var e = o.current;
                    V(r, a, i.context);
                    if (i.framebuffer) {
                        i.framebuffer.append(r, a);
                    }
                    Bs(Object.keys(i.state)).forEach(function(n) {
                        var e = i.state[n];
                        var t = e.append(r, a);
                        if (Bn(t)) {
                            t.forEach(function(e, t) {
                                a.set(r.next[n], "[" + t + "]", e);
                            });
                        } else {
                            a.set(o.next, "." + n, t);
                        }
                    });
                    Y(r, a, i, true, true);
                    [ vo, _o, go, xo, mo ].forEach(function(e) {
                        var t = i.draw[e];
                        if (!t) {
                            return;
                        }
                        a.set(o.draw, "." + e, "" + t.append(r, a));
                    });
                    Object.keys(i.uniforms).forEach(function(e) {
                        a.set(o.uniforms, "[" + E.id(e) + "]", i.uniforms[e].append(r, a));
                    });
                    Object.keys(i.attributes).forEach(function(e) {
                        var t = i.attributes[e].append(r, a);
                        var n = r.scopeAttrib(e);
                        Object.keys(new m()).forEach(function(e) {
                            a.set(n, "." + e, t[e]);
                        });
                    });
                    if (i.scopeVAO) {
                        a.set(o.vao, ".targetVAO", i.scopeVAO.append(r, a));
                    }
                    function t(e) {
                        var t = i.shader[e];
                        if (t) {
                            a.set(o.shader, "." + e, t.append(r, a));
                        }
                    }
                    t(ho);
                    t(po);
                    if (Object.keys(i.state).length > 0) {
                        a(e, ".dirty=true;");
                        a.exit(e, ".dirty=true;");
                    }
                    a("a1(", r.shared.context, ",a0,", r.batchId, ");");
                }
                function ae(e) {
                    if (typeof e !== "object" || Bn(e)) {
                        return;
                    }
                    var t = Object.keys(e);
                    for (var n = 0; n < t.length; ++n) {
                        if (de.isDynamic(e[t[n]])) {
                            return true;
                        }
                    }
                    return false;
                }
                function oe(r, e, t) {
                    var a = e["static"][t];
                    if (!a || !ae(a)) {
                        return;
                    }
                    var i = r.global;
                    var n = Object.keys(a);
                    var o = false;
                    var s = false;
                    var u = false;
                    var f = r.global.def("{}");
                    n.forEach(function(e) {
                        var t = a[e];
                        if (de.isDynamic(t)) {
                            if (typeof t === "function") {
                                t = a[e] = de.unbox(t);
                            }
                            var n = Ds(t, null);
                            o = o || n.thisDep;
                            u = u || n.propDep;
                            s = s || n.contextDep;
                        } else {
                            i(f, ".", e, "=");
                            switch (typeof t) {
                              case "number":
                                i(t);
                                break;

                              case "string":
                                i('"', t, '"');
                                break;

                              case "object":
                                if (Array.isArray(t)) {
                                    i("[", t.join(), "]");
                                }
                                break;

                              default:
                                i(r.link(t));
                                break;
                            }
                            i(";");
                        }
                    });
                    function c(r, i) {
                        n.forEach(function(e) {
                            var t = a[e];
                            if (!de.isDynamic(t)) {
                                return;
                            }
                            var n = r.invoke(i, t);
                            i(f, ".", e, "=", n, ";");
                        });
                    }
                    e.dynamic[t] = new de.DynamicVariable(Na, {
                        thisDep: o,
                        contextDep: s,
                        propDep: u,
                        ref: f,
                        append: c
                    });
                    delete e["static"][t];
                }
                function se(t, n, e, r, i) {
                    var a = C();
                    a.stats = a.link(i);
                    Object.keys(n["static"]).forEach(function(e) {
                        oe(a, n, e);
                    });
                    Co.forEach(function(e) {
                        oe(a, t, e);
                    });
                    var o = H(t, n, e, r, a);
                    ee(a, o);
                    ie(a, o);
                    re(a, o);
                    return ue(a.compile(), {
                        destroy: function e() {
                            o.shader.program.destroy();
                        }
                    });
                }
                return {
                    next: s,
                    current: g,
                    procs: function() {
                        var s = C();
                        var u = s.proc("poll");
                        var f = s.proc("refresh");
                        var c = s.block();
                        u(c);
                        f(c);
                        var e = s.shared;
                        var l = e.gl;
                        var h = e.next;
                        var d = e.current;
                        c(d, ".dirty=false;");
                        k(s, u);
                        k(s, f, null, true);
                        var t;
                        if (A) {
                            t = s.link(A);
                        }
                        if (x.oes_vertex_array_object) {
                            f(s.link(x.oes_vertex_array_object), ".bindVertexArrayOES(null);");
                        }
                        for (var n = 0; n < p.maxAttributes; ++n) {
                            var r = f.def(e.attributes, "[", n, "]");
                            var i = s.cond(r, ".buffer");
                            i.then(l, ".enableVertexAttribArray(", n, ");", l, ".bindBuffer(", Bo, ",", r, ".buffer.buffer);", l, ".vertexAttribPointer(", n, ",", r, ".size,", r, ".type,", r, ".normalized,", r, ".stride,", r, ".offset);")["else"](l, ".disableVertexAttribArray(", n, ");", l, ".vertexAttrib4f(", n, ",", r, ".x,", r, ".y,", r, ".z,", r, ".w);", r, ".buffer=null;");
                            f(i);
                            if (A) {
                                f(t, ".vertexAttribDivisorANGLE(", n, ",", r, ".divisor);");
                            }
                        }
                        f(s.shared.vao, ".currentVAO=null;", s.shared.vao, ".setVAO(", s.shared.vao, ".targetVAO);");
                        Object.keys(_).forEach(function(e) {
                            var t = _[e];
                            var n = c.def(h, ".", e);
                            var r = s.block();
                            r("if(", n, "){", l, ".enable(", t, ")}else{", l, ".disable(", t, ")}", d, ".", e, "=", n, ";");
                            f(r);
                            u("if(", n, "!==", d, ".", e, "){", r, "}");
                        });
                        Object.keys(M).forEach(function(e) {
                            var t = M[e];
                            var n = g[e];
                            var r, i;
                            var a = s.block();
                            a(l, ".", t, "(");
                            if (Bn(n)) {
                                var o = n.length;
                                r = s.global.def(h, ".", e);
                                i = s.global.def(d, ".", e);
                                a(Me(o, function(e) {
                                    return r + "[" + e + "]";
                                }), ");", Me(o, function(e) {
                                    return i + "[" + e + "]=" + r + "[" + e + "];";
                                }).join(""));
                                u("if(", Me(o, function(e) {
                                    return r + "[" + e + "]!==" + i + "[" + e + "]";
                                }).join("||"), "){", a, "}");
                            } else {
                                r = c.def(h, ".", e);
                                i = c.def(d, ".", e);
                                a(r, ");", d, ".", e, "=", r, ";");
                                u("if(", r, "!==", i, "){", a, "}");
                            }
                            f(a);
                        });
                        return s.compile();
                    }(),
                    compile: se
                };
            }
            function Us() {
                return {
                    vaoCount: 0,
                    bufferCount: 0,
                    elementsCount: 0,
                    framebufferCount: 0,
                    shaderCount: 0,
                    textureCount: 0,
                    cubeCount: 0,
                    renderbufferCount: 0,
                    maxTextureUnits: 0
                };
            }
            var qs = 34918, zs = 34919, Gs = 35007, Hs = function e(t, c) {
                if (!c.ext_disjoint_timer_query) {
                    return null;
                }
                var n = [];
                function r() {
                    return n.pop() || c.ext_disjoint_timer_query.createQueryEXT();
                }
                function l(e) {
                    n.push(e);
                }
                var h = [];
                function i(e) {
                    var t = r();
                    c.ext_disjoint_timer_query.beginQueryEXT(Gs, t);
                    h.push(t);
                    f(h.length - 1, h.length, e);
                }
                function a() {
                    c.ext_disjoint_timer_query.endQueryEXT(Gs);
                }
                function o() {
                    this.startQueryIndex = -1;
                    this.endQueryIndex = -1;
                    this.sum = 0;
                    this.stats = null;
                }
                var s = [];
                function u() {
                    return s.pop() || new o();
                }
                function d(e) {
                    s.push(e);
                }
                var p = [];
                function f(e, t, n) {
                    var r = u();
                    r.startQueryIndex = e;
                    r.endQueryIndex = t;
                    r.sum = 0;
                    r.stats = n;
                    p.push(r);
                }
                var v = [];
                var m = [];
                function g() {
                    var e, t;
                    var n = h.length;
                    if (n === 0) {
                        return;
                    }
                    m.length = Math.max(m.length, n + 1);
                    v.length = Math.max(v.length, n + 1);
                    v[0] = 0;
                    m[0] = 0;
                    var r = 0;
                    e = 0;
                    for (t = 0; t < h.length; ++t) {
                        var i = h[t];
                        if (c.ext_disjoint_timer_query.getQueryObjectEXT(i, zs)) {
                            r += c.ext_disjoint_timer_query.getQueryObjectEXT(i, qs);
                            l(i);
                        } else {
                            h[e++] = i;
                        }
                        v[t + 1] = r;
                        m[t + 1] = e;
                    }
                    h.length = e;
                    e = 0;
                    for (t = 0; t < p.length; ++t) {
                        var a = p[t];
                        var o = a.startQueryIndex;
                        var s = a.endQueryIndex;
                        a.sum += v[s] - v[o];
                        var u = m[o];
                        var f = m[s];
                        if (f === u) {
                            a.stats.gpuTime += a.sum / 1e6;
                            d(a);
                        } else {
                            a.startQueryIndex = u;
                            a.endQueryIndex = f;
                            p[e++] = a;
                        }
                    }
                    p.length = e;
                }
                return {
                    beginQuery: i,
                    endQuery: a,
                    pushScopeStats: f,
                    update: g,
                    getNumPendingQueries: function e() {
                        return h.length;
                    },
                    clear: function e() {
                        n.push.apply(n, h);
                        for (var t = 0; t < n.length; t++) {
                            c.ext_disjoint_timer_query.deleteQueryEXT(n[t]);
                        }
                        h.length = 0;
                        n.length = 0;
                    },
                    restore: function e() {
                        h.length = 0;
                        n.length = 0;
                    }
                };
            }, Vs = 16384, ks = 256, js = 1024, Ws = 34962, Xs = "webglcontextlost", Ys = "webglcontextrestored", Ks = 1, Js = 2, Qs = 3;
            function Zs(e, t) {
                for (var n = 0; n < e.length; ++n) {
                    if (e[n] === t) {
                        return n;
                    }
                }
                return -1;
            }
            function $s(e) {
                var t = Te(e);
                if (!t) {
                    return null;
                }
                var i = t.gl;
                var n = i.getContextAttributes();
                var v = i.isContextLost();
                var r = Ee(i, t);
                if (!r) {
                    return null;
                }
                var a = me();
                var o = Us();
                var s = r.extensions;
                var u = Hs(i, s);
                var f = ve();
                var c = i.drawingBufferWidth;
                var l = i.drawingBufferHeight;
                var h = {
                    tick: 0,
                    time: 0,
                    viewportWidth: c,
                    viewportHeight: l,
                    framebufferWidth: c,
                    framebufferHeight: l,
                    drawingBufferWidth: c,
                    drawingBufferHeight: l,
                    pixelRatio: t.pixelRatio
                };
                var d = {};
                var p = {
                    elements: null,
                    primitive: 4,
                    count: -1,
                    offset: 0,
                    instances: -1
                };
                var m = St(i, s);
                var g = on(i, o, t, x);
                var _ = pa(i, s, m, o, g);
                function x(e) {
                    return _.destroyBuffer(e);
                }
                var b = Sn(i, s, g, o);
                var y = xa(i, a, o, t);
                var A = vi(i, s, m, function() {
                    M.procs.poll();
                }, h, o, t);
                var T = Oi(i, s, m, o, t);
                var E = ca(i, s, m, A, T, o);
                var M = Ls(i, a, s, m, g, b, A, E, d, _, y, p, h, u, t);
                var S = Ea(i, E, M.procs.poll, h, n, s, m);
                var w = M.next;
                var R = i.canvas;
                var O = [];
                var C = [];
                var B = [];
                var F = [ t.onDestroy ];
                var P = null;
                function I() {
                    if (O.length === 0) {
                        if (u) {
                            u.update();
                        }
                        P = null;
                        return;
                    }
                    P = pe.next(I);
                    W();
                    for (var e = O.length - 1; e >= 0; --e) {
                        var t = O[e];
                        if (t) {
                            t(h, null, 0);
                        }
                    }
                    i.flush();
                    if (u) {
                        u.update();
                    }
                }
                function D() {
                    if (!P && O.length > 0) {
                        P = pe.next(I);
                    }
                }
                function N() {
                    if (P) {
                        pe.cancel(I);
                        P = null;
                    }
                }
                function L(e) {
                    e.preventDefault();
                    v = true;
                    N();
                    C.forEach(function(e) {
                        e();
                    });
                }
                function U(e) {
                    i.getError();
                    v = false;
                    r.restore();
                    y.restore();
                    g.restore();
                    A.restore();
                    T.restore();
                    E.restore();
                    _.restore();
                    if (u) {
                        u.restore();
                    }
                    M.procs.refresh();
                    D();
                    B.forEach(function(e) {
                        e();
                    });
                }
                if (R) {
                    R.addEventListener(Xs, L, false);
                    R.addEventListener(Ys, U, false);
                }
                function q() {
                    O.length = 0;
                    N();
                    if (R) {
                        R.removeEventListener(Xs, L);
                        R.removeEventListener(Ys, U);
                    }
                    y.clear();
                    E.clear();
                    T.clear();
                    A.clear();
                    b.clear();
                    g.clear();
                    _.clear();
                    if (u) {
                        u.clear();
                    }
                    F.forEach(function(e) {
                        e();
                    });
                }
                function z(e) {
                    fe(!!e, "invalid args to regl({...})");
                    fe.type(e, "object", "invalid args to regl({...})");
                    function t(e) {
                        var r = ue({}, e);
                        delete r.uniforms;
                        delete r.attributes;
                        delete r.context;
                        delete r.vao;
                        if ("stencil" in r && r.stencil.op) {
                            r.stencil.opBack = r.stencil.opFront = r.stencil.op;
                            delete r.stencil.op;
                        }
                        function t(t) {
                            if (t in r) {
                                var n = r[t];
                                delete r[t];
                                Object.keys(n).forEach(function(e) {
                                    r[t + "." + e] = n[e];
                                });
                            }
                        }
                        t("blend");
                        t("depth");
                        t("cull");
                        t("stencil");
                        t("polygonOffset");
                        t("scissor");
                        t("sample");
                        if ("vao" in e) {
                            r.vao = e.vao;
                        }
                        return r;
                    }
                    function n(n) {
                        var r = {};
                        var i = {};
                        Object.keys(n).forEach(function(e) {
                            var t = n[e];
                            if (de.isDynamic(t)) {
                                i[e] = de.unbox(t, e);
                            } else {
                                r[e] = t;
                            }
                        });
                        return {
                            dynamic: i,
                            static: r
                        };
                    }
                    var r = n(e.context || {});
                    var i = n(e.uniforms || {});
                    var a = n(e.attributes || {});
                    var o = n(t(e));
                    var s = {
                        gpuTime: 0,
                        cpuTime: 0,
                        count: 0
                    };
                    var u = M.compile(o, a, i, r, s);
                    var f = u.draw;
                    var c = u.batch;
                    var l = u.scope;
                    var h = [];
                    function d(e) {
                        while (h.length < e) {
                            h.push(null);
                        }
                        return h;
                    }
                    function p(e, t) {
                        var n;
                        if (v) {
                            fe.raise("context lost");
                        }
                        if (typeof e === "function") {
                            return l.call(this, null, e, 0);
                        } else if (typeof t === "function") {
                            if (typeof e === "number") {
                                for (n = 0; n < e; ++n) {
                                    l.call(this, null, t, n);
                                }
                            } else if (Array.isArray(e)) {
                                for (n = 0; n < e.length; ++n) {
                                    l.call(this, e[n], t, n);
                                }
                            } else {
                                return l.call(this, e, t, 0);
                            }
                        } else if (typeof e === "number") {
                            if (e > 0) {
                                return c.call(this, d(e | 0), e | 0);
                            }
                        } else if (Array.isArray(e)) {
                            if (e.length) {
                                return c.call(this, e, e.length);
                            }
                        } else {
                            return f.call(this, e);
                        }
                    }
                    return ue(p, {
                        stats: s,
                        destroy: function e() {
                            u.destroy();
                        }
                    });
                }
                var G = E.setFBO = z({
                    framebuffer: de.define.call(null, Ks, "framebuffer")
                });
                function H(e, t) {
                    var n = 0;
                    M.procs.poll();
                    var r = t.color;
                    if (r) {
                        i.clearColor(+r[0] || 0, +r[1] || 0, +r[2] || 0, +r[3] || 0);
                        n |= Vs;
                    }
                    if ("depth" in t) {
                        i.clearDepth(+t.depth);
                        n |= ks;
                    }
                    if ("stencil" in t) {
                        i.clearStencil(t.stencil | 0);
                        n |= js;
                    }
                    fe(!!n, "called regl.clear with no buffer specified");
                    i.clear(n);
                }
                function V(e) {
                    fe(typeof e === "object" && e, "regl.clear() takes an object as input");
                    if ("framebuffer" in e) {
                        if (e.framebuffer && e.framebuffer_reglType === "framebufferCube") {
                            for (var t = 0; t < 6; ++t) {
                                G(ue({
                                    framebuffer: e.framebuffer.faces[t]
                                }, e), H);
                            }
                        } else {
                            G(e, H);
                        }
                    } else {
                        H(null, e);
                    }
                }
                function k(n) {
                    fe.type(n, "function", "regl.frame() callback must be a function");
                    O.push(n);
                    function e() {
                        var e = Zs(O, n);
                        fe(e >= 0, "cannot cancel a frame twice");
                        function t() {
                            var e = Zs(O, t);
                            O[e] = O[O.length - 1];
                            O.length -= 1;
                            if (O.length <= 0) {
                                N();
                            }
                        }
                        O[e] = t;
                    }
                    D();
                    return {
                        cancel: e
                    };
                }
                function j() {
                    var e = w.viewport;
                    var t = w.scissor_box;
                    e[0] = e[1] = t[0] = t[1] = 0;
                    h.viewportWidth = h.framebufferWidth = h.drawingBufferWidth = e[2] = t[2] = i.drawingBufferWidth;
                    h.viewportHeight = h.framebufferHeight = h.drawingBufferHeight = e[3] = t[3] = i.drawingBufferHeight;
                }
                function W() {
                    h.tick += 1;
                    h.time = Y();
                    j();
                    M.procs.poll();
                }
                function X() {
                    j();
                    M.procs.refresh();
                    if (u) {
                        u.update();
                    }
                }
                function Y() {
                    return (ve() - f) / 1e3;
                }
                X();
                function K(e, n) {
                    fe.type(n, "function", "listener callback must be a function");
                    var r;
                    switch (e) {
                      case "frame":
                        return k(n);

                      case "lost":
                        r = C;
                        break;

                      case "restore":
                        r = B;
                        break;

                      case "destroy":
                        r = F;
                        break;

                      default:
                        fe.raise("invalid event, must be one of frame,lost,restore,destroy");
                    }
                    r.push(n);
                    return {
                        cancel: function e() {
                            for (var t = 0; t < r.length; ++t) {
                                if (r[t] === n) {
                                    r[t] = r[r.length - 1];
                                    r.pop();
                                    return;
                                }
                            }
                        }
                    };
                }
                var J = ue(z, {
                    clear: V,
                    prop: de.define.bind(null, Ks),
                    context: de.define.bind(null, Js),
                    this: de.define.bind(null, Qs),
                    draw: z({}),
                    buffer: function e(t) {
                        return g.create(t, Ws, false, false);
                    },
                    elements: function e(t) {
                        return b.create(t, false);
                    },
                    texture: A.create2D,
                    cube: A.createCube,
                    renderbuffer: T.create,
                    framebuffer: E.create,
                    framebufferCube: E.createCube,
                    vao: _.createVAO,
                    attributes: n,
                    frame: k,
                    on: K,
                    limits: m,
                    hasExtension: function e(t) {
                        return m.extensions.indexOf(t.toLowerCase()) >= 0;
                    },
                    read: S,
                    destroy: q,
                    _gl: i,
                    _refresh: X,
                    poll: function e() {
                        W();
                        if (u) {
                            u.update();
                        }
                    },
                    now: Y,
                    stats: o
                });
                t.onDone(null, J);
                return J;
            }
            return $s;
        }();
    }(t = {
        exports: {}
    }), t.exports);
    function n(e, t) {
        for (var n = 0; n < t.length; n++) {
            var r = t[n];
            r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), 
            Object.defineProperty(e, r.key, r);
        }
    }
    function o(e, t) {
        e.prototype = Object.create(t.prototype), (e.prototype.constructor = e).__proto__ = t;
    }
    function i(e, t) {
        (null == t || t > e.length) && (t = e.length);
        for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
        return r;
    }
    function a(e) {
        var t = 0;
        if ("undefined" != typeof Symbol && null != e[Symbol.iterator]) return (t = e[Symbol.iterator]()).next.bind(t);
        if (Array.isArray(e) || (e = function(e, t) {
            if (e) {
                if ("string" == typeof e) return i(e, t);
                var n = Object.prototype.toString.call(e).slice(8, -1);
                return "Object" === n && e.constructor && (n = e.constructor.name), "Map" === n || "Set" === n ? Array.from(n) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? i(e, t) : void 0;
            }
        }(e))) return function() {
            return t >= e.length ? {
                done: !0
            } : {
                done: !1,
                value: e[t++]
            };
        };
        throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var I = 1e-6, s = "undefined" != typeof Float32Array ? Float32Array : Array, f = Math.random;
    function u(e, t) {
        return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[4], e[4] = t[5], e[5] = t[6], 
        e[6] = t[8], e[7] = t[9], e[8] = t[10], e;
    }
    function l(e, t) {
        return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], e[4] = t[4], e[5] = t[5], 
        e[6] = t[6], e[7] = t[7], e[8] = t[8], e[9] = t[9], e[10] = t[10], e[11] = t[11], 
        e[12] = t[12], e[13] = t[13], e[14] = t[14], e[15] = t[15], e;
    }
    function X(e) {
        return e[0] = 1, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = 1, e[6] = 0, e[7] = 0, 
        e[8] = 0, e[9] = 0, e[10] = 1, e[11] = 0, e[12] = 0, e[13] = 0, e[14] = 0, e[15] = 1, 
        e;
    }
    function h(e, t) {
        if (e === t) {
            var n = t[1], r = t[2], i = t[3], a = t[6], o = t[7], s = t[11];
            e[1] = t[4], e[2] = t[8], e[3] = t[12], e[4] = n, e[6] = t[9], e[7] = t[13], e[8] = r, 
            e[9] = a, e[11] = t[14], e[12] = i, e[13] = o, e[14] = s;
        } else e[0] = t[0], e[1] = t[4], e[2] = t[8], e[3] = t[12], e[4] = t[1], e[5] = t[5], 
        e[6] = t[9], e[7] = t[13], e[8] = t[2], e[9] = t[6], e[10] = t[10], e[11] = t[14], 
        e[12] = t[3], e[13] = t[7], e[14] = t[11], e[15] = t[15];
        return e;
    }
    function x(e, t) {
        var n = t[0], r = t[1], i = t[2], a = t[3], o = t[4], s = t[5], u = t[6], f = t[7], c = t[8], l = t[9], h = t[10], d = t[11], p = t[12], v = t[13], m = t[14], g = t[15], _ = n * s - r * o, x = n * u - i * o, b = n * f - a * o, y = r * u - i * s, A = r * f - a * s, T = i * f - a * u, E = c * v - l * p, M = c * m - h * p, S = c * g - d * p, w = l * m - h * v, R = l * g - d * v, O = h * g - d * m, C = _ * O - x * R + b * w + y * S - A * M + T * E;
        return C ? (C = 1 / C, e[0] = (s * O - u * R + f * w) * C, e[1] = (i * R - r * O - a * w) * C, 
        e[2] = (v * T - m * A + g * y) * C, e[3] = (h * A - l * T - d * y) * C, e[4] = (u * S - o * O - f * M) * C, 
        e[5] = (n * O - i * S + a * M) * C, e[6] = (m * b - p * T - g * x) * C, e[7] = (c * T - h * b + d * x) * C, 
        e[8] = (o * R - s * S + f * E) * C, e[9] = (r * S - n * R - a * E) * C, e[10] = (p * A - v * b + g * _) * C, 
        e[11] = (l * b - c * A - d * _) * C, e[12] = (s * M - o * w - u * E) * C, e[13] = (n * w - r * M + i * E) * C, 
        e[14] = (v * x - p * y - m * _) * C, e[15] = (c * y - l * x + h * _) * C, e) : null;
    }
    function Y(e, t, n) {
        var r = t[0], i = t[1], a = t[2], o = t[3], s = t[4], u = t[5], f = t[6], c = t[7], l = t[8], h = t[9], d = t[10], p = t[11], v = t[12], m = t[13], g = t[14], _ = t[15], x = n[0], b = n[1], y = n[2], A = n[3];
        return e[0] = x * r + b * s + y * l + A * v, e[1] = x * i + b * u + y * h + A * m, 
        e[2] = x * a + b * f + y * d + A * g, e[3] = x * o + b * c + y * p + A * _, x = n[4], 
        b = n[5], y = n[6], A = n[7], e[4] = x * r + b * s + y * l + A * v, e[5] = x * i + b * u + y * h + A * m, 
        e[6] = x * a + b * f + y * d + A * g, e[7] = x * o + b * c + y * p + A * _, x = n[8], 
        b = n[9], y = n[10], A = n[11], e[8] = x * r + b * s + y * l + A * v, e[9] = x * i + b * u + y * h + A * m, 
        e[10] = x * a + b * f + y * d + A * g, e[11] = x * o + b * c + y * p + A * _, x = n[12], 
        b = n[13], y = n[14], A = n[15], e[12] = x * r + b * s + y * l + A * v, e[13] = x * i + b * u + y * h + A * m, 
        e[14] = x * a + b * f + y * d + A * g, e[15] = x * o + b * c + y * p + A * _, e;
    }
    function d(e, t) {
        return e[0] = t[12], e[1] = t[13], e[2] = t[14], e;
    }
    function p(e, t) {
        var n = t[0], r = t[1], i = t[2], a = t[4], o = t[5], s = t[6], u = t[8], f = t[9], c = t[10];
        return e[0] = Math.sqrt(n * n + r * r + i * i), e[1] = Math.sqrt(a * a + o * o + s * s), 
        e[2] = Math.sqrt(u * u + f * f + c * c), e;
    }
    function v(e, t) {
        var n = t[0] + t[5] + t[10], r = 0;
        return 0 < n ? (r = 2 * Math.sqrt(n + 1), e[3] = .25 * r, e[0] = (t[6] - t[9]) / r, 
        e[1] = (t[8] - t[2]) / r, e[2] = (t[1] - t[4]) / r) : t[0] > t[5] && t[0] > t[10] ? (r = 2 * Math.sqrt(1 + t[0] - t[5] - t[10]), 
        e[3] = (t[6] - t[9]) / r, e[0] = .25 * r, e[1] = (t[1] + t[4]) / r, e[2] = (t[8] + t[2]) / r) : t[5] > t[10] ? (r = 2 * Math.sqrt(1 + t[5] - t[0] - t[10]), 
        e[3] = (t[8] - t[2]) / r, e[0] = (t[1] + t[4]) / r, e[1] = .25 * r, e[2] = (t[6] + t[9]) / r) : (r = 2 * Math.sqrt(1 + t[10] - t[0] - t[5]), 
        e[3] = (t[1] - t[4]) / r, e[0] = (t[8] + t[2]) / r, e[1] = (t[6] + t[9]) / r, e[2] = .25 * r), 
        e;
    }
    function m(e, t, n, r) {
        var i = t[0], a = t[1], o = t[2], s = t[3], u = i + i, f = a + a, c = o + o, l = i * u, h = i * f, d = i * c, p = a * f, v = a * c, m = o * c, g = s * u, _ = s * f, x = s * c, b = r[0], y = r[1], A = r[2];
        return e[0] = (1 - (p + m)) * b, e[1] = (h + x) * b, e[2] = (d - _) * b, e[3] = 0, 
        e[4] = (h - x) * y, e[5] = (1 - (l + m)) * y, e[6] = (v + g) * y, e[7] = 0, e[8] = (d + _) * A, 
        e[9] = (v - g) * A, e[10] = (1 - (l + p)) * A, e[11] = 0, e[12] = n[0], e[13] = n[1], 
        e[14] = n[2], e[15] = 1, e;
    }
    function g(e, t, n, r, i) {
        var a = 1 / Math.tan(t / 2), o = void 0;
        return e[0] = a / n, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = a, e[6] = 0, 
        e[7] = 0, e[8] = 0, e[9] = 0, e[11] = -1, e[12] = 0, e[13] = 0, e[15] = 0, null != i && i !== 1 / 0 ? (o = 1 / (r - i), 
        e[10] = (i + r) * o, e[14] = 2 * i * r * o) : (e[10] = -1, e[14] = -2 * r), e;
    }
    function K(e, t, n, r) {
        var i = void 0, a = void 0, o = void 0, s = void 0, u = void 0, f = void 0, c = void 0, l = void 0, h = void 0, d = void 0, p = t[0], v = t[1], m = t[2], g = r[0], _ = r[1], x = r[2], b = n[0], y = n[1], A = n[2];
        return Math.abs(p - b) < I && Math.abs(v - y) < I && Math.abs(m - A) < I ? X(e) : (c = p - b, 
        l = v - y, h = m - A, i = _ * (h *= d = 1 / Math.sqrt(c * c + l * l + h * h)) - x * (l *= d), 
        a = x * (c *= d) - g * h, o = g * l - _ * c, (d = Math.sqrt(i * i + a * a + o * o)) ? (i *= d = 1 / d, 
        a *= d, o *= d) : o = a = i = 0, s = l * o - h * a, u = h * i - c * o, f = c * a - l * i, 
        (d = Math.sqrt(s * s + u * u + f * f)) ? (s *= d = 1 / d, u *= d, f *= d) : f = u = s = 0, 
        e[0] = i, e[1] = s, e[2] = c, e[3] = 0, e[4] = a, e[5] = u, e[6] = l, e[7] = 0, 
        e[8] = o, e[9] = f, e[10] = h, e[11] = 0, e[12] = -(i * p + a * v + o * m), e[13] = -(s * p + u * v + f * m), 
        e[14] = -(c * p + l * v + h * m), e[15] = 1, e);
    }
    function _() {
        var e = new s(3);
        return s != Float32Array && (e[0] = 0, e[1] = 0, e[2] = 0), e;
    }
    function b(e) {
        var t = e[0], n = e[1], r = e[2];
        return Math.sqrt(t * t + n * n + r * r);
    }
    function y(e, t, n) {
        var r = new s(3);
        return r[0] = e, r[1] = t, r[2] = n, r;
    }
    function C(e, t) {
        return e[0] = t[0], e[1] = t[1], e[2] = t[2], e;
    }
    function B(e, t, n, r) {
        return e[0] = t, e[1] = n, e[2] = r, e;
    }
    function J(e, t, n) {
        return e[0] = t[0] + n[0], e[1] = t[1] + n[1], e[2] = t[2] + n[2], e;
    }
    function A(e, t, n) {
        return e[0] = t[0] - n[0], e[1] = t[1] - n[1], e[2] = t[2] - n[2], e;
    }
    function T(e, t, n) {
        return e[0] = t[0] * n[0], e[1] = t[1] * n[1], e[2] = t[2] * n[2], e;
    }
    function E(e, t, n) {
        return e[0] = t[0] / n[0], e[1] = t[1] / n[1], e[2] = t[2] / n[2], e;
    }
    function Q(e, t, n) {
        return e[0] = t[0] * n, e[1] = t[1] * n, e[2] = t[2] * n, e;
    }
    function M(e, t, n, r) {
        return e[0] = t[0] + n[0] * r, e[1] = t[1] + n[1] * r, e[2] = t[2] + n[2] * r, e;
    }
    function S(e, t) {
        var n = t[0] - e[0], r = t[1] - e[1], i = t[2] - e[2];
        return Math.sqrt(n * n + r * r + i * i);
    }
    function w(e, t) {
        var n = t[0] - e[0], r = t[1] - e[1], i = t[2] - e[2];
        return n * n + r * r + i * i;
    }
    function R(e) {
        var t = e[0], n = e[1], r = e[2];
        return t * t + n * n + r * r;
    }
    function Z(e, t) {
        var n = t[0], r = t[1], i = t[2], a = n * n + r * r + i * i;
        return 0 < a && (a = 1 / Math.sqrt(a), e[0] = t[0] * a, e[1] = t[1] * a, e[2] = t[2] * a), 
        e;
    }
    function F(e, t) {
        return e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
    }
    function P(e, t, n) {
        var r = t[0], i = t[1], a = t[2], o = n[0], s = n[1], u = n[2];
        return e[0] = i * u - a * s, e[1] = a * o - r * u, e[2] = r * s - i * o, e;
    }
    function O(e, t, n) {
        var r = t[0], i = t[1], a = t[2], o = n[3] * r + n[7] * i + n[11] * a + n[15];
        return o = o || 1, e[0] = (n[0] * r + n[4] * i + n[8] * a + n[12]) / o, e[1] = (n[1] * r + n[5] * i + n[9] * a + n[13]) / o, 
        e[2] = (n[2] * r + n[6] * i + n[10] * a + n[14]) / o, e;
    }
    function D(e, t) {
        var n = e[0], r = e[1], i = e[2], a = t[0], o = t[1], s = t[2];
        return Math.abs(n - a) <= I * Math.max(1, Math.abs(n), Math.abs(a)) && Math.abs(r - o) <= I * Math.max(1, Math.abs(r), Math.abs(o)) && Math.abs(i - s) <= I * Math.max(1, Math.abs(i), Math.abs(s));
    }
    var N, L = A, U = T, q = E, z = S, G = w, H = b, V = R, k = (N = _(), function(e, t, n, r, i, a) {
        var o = void 0, s = void 0;
        for (t = t || 3, n = n || 0, s = r ? Math.min(r * t + n, e.length) : e.length, o = n; o < s; o += t) N[0] = e[o], 
        N[1] = e[o + 1], N[2] = e[o + 2], i(N, N, a), e[o] = N[0], e[o + 1] = N[1], e[o + 2] = N[2];
        return e;
    }), j = Object.freeze({
        __proto__: null,
        create: _,
        clone: function(e) {
            var t = new s(3);
            return t[0] = e[0], t[1] = e[1], t[2] = e[2], t;
        },
        length: b,
        fromValues: y,
        copy: C,
        set: B,
        add: J,
        subtract: A,
        multiply: T,
        divide: E,
        ceil: function(e, t) {
            return e[0] = Math.ceil(t[0]), e[1] = Math.ceil(t[1]), e[2] = Math.ceil(t[2]), e;
        },
        floor: function(e, t) {
            return e[0] = Math.floor(t[0]), e[1] = Math.floor(t[1]), e[2] = Math.floor(t[2]), 
            e;
        },
        min: function(e, t, n) {
            return e[0] = Math.min(t[0], n[0]), e[1] = Math.min(t[1], n[1]), e[2] = Math.min(t[2], n[2]), 
            e;
        },
        max: function(e, t, n) {
            return e[0] = Math.max(t[0], n[0]), e[1] = Math.max(t[1], n[1]), e[2] = Math.max(t[2], n[2]), 
            e;
        },
        round: function(e, t) {
            return e[0] = Math.round(t[0]), e[1] = Math.round(t[1]), e[2] = Math.round(t[2]), 
            e;
        },
        scale: Q,
        scaleAndAdd: M,
        distance: S,
        squaredDistance: w,
        squaredLength: R,
        negate: function(e, t) {
            return e[0] = -t[0], e[1] = -t[1], e[2] = -t[2], e;
        },
        inverse: function(e, t) {
            return e[0] = 1 / t[0], e[1] = 1 / t[1], e[2] = 1 / t[2], e;
        },
        normalize: Z,
        dot: F,
        cross: P,
        lerp: function(e, t, n, r) {
            var i = t[0], a = t[1], o = t[2];
            return e[0] = i + r * (n[0] - i), e[1] = a + r * (n[1] - a), e[2] = o + r * (n[2] - o), 
            e;
        },
        hermite: function(e, t, n, r, i, a) {
            var o = a * a, s = o * (2 * a - 3) + 1, u = o * (a - 2) + a, f = o * (a - 1), c = o * (3 - 2 * a);
            return e[0] = t[0] * s + n[0] * u + r[0] * f + i[0] * c, e[1] = t[1] * s + n[1] * u + r[1] * f + i[1] * c, 
            e[2] = t[2] * s + n[2] * u + r[2] * f + i[2] * c, e;
        },
        bezier: function(e, t, n, r, i, a) {
            var o = 1 - a, s = o * o, u = a * a, f = s * o, c = 3 * a * s, l = 3 * u * o, h = u * a;
            return e[0] = t[0] * f + n[0] * c + r[0] * l + i[0] * h, e[1] = t[1] * f + n[1] * c + r[1] * l + i[1] * h, 
            e[2] = t[2] * f + n[2] * c + r[2] * l + i[2] * h, e;
        },
        random: function(e, t) {
            t = t || 1;
            var n = 2 * f() * Math.PI, r = 2 * f() - 1, i = Math.sqrt(1 - r * r) * t;
            return e[0] = Math.cos(n) * i, e[1] = Math.sin(n) * i, e[2] = r * t, e;
        },
        transformMat4: O,
        transformMat3: function(e, t, n) {
            var r = t[0], i = t[1], a = t[2];
            return e[0] = r * n[0] + i * n[3] + a * n[6], e[1] = r * n[1] + i * n[4] + a * n[7], 
            e[2] = r * n[2] + i * n[5] + a * n[8], e;
        },
        transformQuat: function(e, t, n) {
            var r = n[0], i = n[1], a = n[2], o = n[3], s = t[0], u = t[1], f = t[2], c = i * f - a * u, l = a * s - r * f, h = r * u - i * s, d = i * h - a * l, p = a * c - r * h, v = r * l - i * c, m = 2 * o;
            return c *= m, l *= m, h *= m, d *= 2, p *= 2, v *= 2, e[0] = s + c + d, e[1] = u + l + p, 
            e[2] = f + h + v, e;
        },
        rotateX: function(e, t, n, r) {
            var i = [], a = [];
            return i[0] = t[0] - n[0], i[1] = t[1] - n[1], i[2] = t[2] - n[2], a[0] = i[0], 
            a[1] = i[1] * Math.cos(r) - i[2] * Math.sin(r), a[2] = i[1] * Math.sin(r) + i[2] * Math.cos(r), 
            e[0] = a[0] + n[0], e[1] = a[1] + n[1], e[2] = a[2] + n[2], e;
        },
        rotateY: function(e, t, n, r) {
            var i = [], a = [];
            return i[0] = t[0] - n[0], i[1] = t[1] - n[1], i[2] = t[2] - n[2], a[0] = i[2] * Math.sin(r) + i[0] * Math.cos(r), 
            a[1] = i[1], a[2] = i[2] * Math.cos(r) - i[0] * Math.sin(r), e[0] = a[0] + n[0], 
            e[1] = a[1] + n[1], e[2] = a[2] + n[2], e;
        },
        rotateZ: function(e, t, n, r) {
            var i = [], a = [];
            return i[0] = t[0] - n[0], i[1] = t[1] - n[1], i[2] = t[2] - n[2], a[0] = i[0] * Math.cos(r) - i[1] * Math.sin(r), 
            a[1] = i[0] * Math.sin(r) + i[1] * Math.cos(r), a[2] = i[2], e[0] = a[0] + n[0], 
            e[1] = a[1] + n[1], e[2] = a[2] + n[2], e;
        },
        angle: function(e, t) {
            var n = y(e[0], e[1], e[2]), r = y(t[0], t[1], t[2]);
            Z(n, n), Z(r, r);
            var i = F(n, r);
            return 1 < i ? 0 : i < -1 ? Math.PI : Math.acos(i);
        },
        str: function(e) {
            return "vec3(" + e[0] + ", " + e[1] + ", " + e[2] + ")";
        },
        exactEquals: function(e, t) {
            return e[0] === t[0] && e[1] === t[1] && e[2] === t[2];
        },
        equals: D,
        sub: L,
        mul: U,
        div: q,
        dist: z,
        sqrDist: G,
        len: H,
        sqrLen: V,
        forEach: k
    });
    function W() {
        var e = new s(4);
        return s != Float32Array && (e[0] = 0, e[1] = 0, e[2] = 0, e[3] = 0), e;
    }
    function $(e, t) {
        return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], e;
    }
    function ee(e, t, n, r, i) {
        return e[0] = t, e[1] = n, e[2] = r, e[3] = i, e;
    }
    function te(e, t, n) {
        return e[0] = t[0] - n[0], e[1] = t[1] - n[1], e[2] = t[2] - n[2], e[3] = t[3] - n[3], 
        e;
    }
    function ne(e, t, n) {
        return e[0] = t[0] * n[0], e[1] = t[1] * n[1], e[2] = t[2] * n[2], e[3] = t[3] * n[3], 
        e;
    }
    function re(e, t, n) {
        return e[0] = t[0] / n[0], e[1] = t[1] / n[1], e[2] = t[2] / n[2], e[3] = t[3] / n[3], 
        e;
    }
    function ie(e, t, n) {
        return e[0] = t[0] * n, e[1] = t[1] * n, e[2] = t[2] * n, e[3] = t[3] * n, e;
    }
    function ae(e, t) {
        var n = t[0] - e[0], r = t[1] - e[1], i = t[2] - e[2], a = t[3] - e[3];
        return Math.sqrt(n * n + r * r + i * i + a * a);
    }
    function oe(e, t) {
        var n = t[0] - e[0], r = t[1] - e[1], i = t[2] - e[2], a = t[3] - e[3];
        return n * n + r * r + i * i + a * a;
    }
    function se(e) {
        var t = e[0], n = e[1], r = e[2], i = e[3];
        return Math.sqrt(t * t + n * n + r * r + i * i);
    }
    function ue(e) {
        var t = e[0], n = e[1], r = e[2], i = e[3];
        return t * t + n * n + r * r + i * i;
    }
    function fe(e, t) {
        var n = t[0], r = t[1], i = t[2], a = t[3], o = n * n + r * r + i * i + a * a;
        return 0 < o && (o = 1 / Math.sqrt(o), e[0] = n * o, e[1] = r * o, e[2] = i * o, 
        e[3] = a * o), e;
    }
    function ce(e, t, n) {
        var r = t[0], i = t[1], a = t[2], o = t[3];
        return e[0] = n[0] * r + n[4] * i + n[8] * a + n[12] * o, e[1] = n[1] * r + n[5] * i + n[9] * a + n[13] * o, 
        e[2] = n[2] * r + n[6] * i + n[10] * a + n[14] * o, e[3] = n[3] * r + n[7] * i + n[11] * a + n[15] * o, 
        e;
    }
    function le(e, t) {
        var n = e[0], r = e[1], i = e[2], a = e[3], o = t[0], s = t[1], u = t[2], f = t[3];
        return Math.abs(n - o) <= I * Math.max(1, Math.abs(n), Math.abs(o)) && Math.abs(r - s) <= I * Math.max(1, Math.abs(r), Math.abs(s)) && Math.abs(i - u) <= I * Math.max(1, Math.abs(i), Math.abs(u)) && Math.abs(a - f) <= I * Math.max(1, Math.abs(a), Math.abs(f));
    }
    var he, de = te, pe = ne, ve = re, me = ae, ge = oe, _e = se, xe = ue, be = (he = W(), 
    function(e, t, n, r, i, a) {
        var o = void 0, s = void 0;
        for (t = t || 4, n = n || 0, s = r ? Math.min(r * t + n, e.length) : e.length, o = n; o < s; o += t) he[0] = e[o], 
        he[1] = e[o + 1], he[2] = e[o + 2], he[3] = e[o + 3], i(he, he, a), e[o] = he[0], 
        e[o + 1] = he[1], e[o + 2] = he[2], e[o + 3] = he[3];
        return e;
    }), ye = Object.freeze({
        __proto__: null,
        create: W,
        clone: function(e) {
            var t = new s(4);
            return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[3], t;
        },
        fromValues: function(e, t, n, r) {
            var i = new s(4);
            return i[0] = e, i[1] = t, i[2] = n, i[3] = r, i;
        },
        copy: $,
        set: ee,
        add: function(e, t, n) {
            return e[0] = t[0] + n[0], e[1] = t[1] + n[1], e[2] = t[2] + n[2], e[3] = t[3] + n[3], 
            e;
        },
        subtract: te,
        multiply: ne,
        divide: re,
        ceil: function(e, t) {
            return e[0] = Math.ceil(t[0]), e[1] = Math.ceil(t[1]), e[2] = Math.ceil(t[2]), e[3] = Math.ceil(t[3]), 
            e;
        },
        floor: function(e, t) {
            return e[0] = Math.floor(t[0]), e[1] = Math.floor(t[1]), e[2] = Math.floor(t[2]), 
            e[3] = Math.floor(t[3]), e;
        },
        min: function(e, t, n) {
            return e[0] = Math.min(t[0], n[0]), e[1] = Math.min(t[1], n[1]), e[2] = Math.min(t[2], n[2]), 
            e[3] = Math.min(t[3], n[3]), e;
        },
        max: function(e, t, n) {
            return e[0] = Math.max(t[0], n[0]), e[1] = Math.max(t[1], n[1]), e[2] = Math.max(t[2], n[2]), 
            e[3] = Math.max(t[3], n[3]), e;
        },
        round: function(e, t) {
            return e[0] = Math.round(t[0]), e[1] = Math.round(t[1]), e[2] = Math.round(t[2]), 
            e[3] = Math.round(t[3]), e;
        },
        scale: ie,
        scaleAndAdd: function(e, t, n, r) {
            return e[0] = t[0] + n[0] * r, e[1] = t[1] + n[1] * r, e[2] = t[2] + n[2] * r, e[3] = t[3] + n[3] * r, 
            e;
        },
        distance: ae,
        squaredDistance: oe,
        length: se,
        squaredLength: ue,
        negate: function(e, t) {
            return e[0] = -t[0], e[1] = -t[1], e[2] = -t[2], e[3] = -t[3], e;
        },
        inverse: function(e, t) {
            return e[0] = 1 / t[0], e[1] = 1 / t[1], e[2] = 1 / t[2], e[3] = 1 / t[3], e;
        },
        normalize: fe,
        dot: function(e, t) {
            return e[0] * t[0] + e[1] * t[1] + e[2] * t[2] + e[3] * t[3];
        },
        lerp: function(e, t, n, r) {
            var i = t[0], a = t[1], o = t[2], s = t[3];
            return e[0] = i + r * (n[0] - i), e[1] = a + r * (n[1] - a), e[2] = o + r * (n[2] - o), 
            e[3] = s + r * (n[3] - s), e;
        },
        random: function(e, t) {
            var n, r, i, a, o, s;
            for (t = t || 1; 1 <= (o = (n = 2 * f() - 1) * n + (r = 2 * f() - 1) * r); ) ;
            for (;1 <= (s = (i = 2 * f() - 1) * i + (a = 2 * f() - 1) * a); ) ;
            var u = Math.sqrt((1 - o) / s);
            return e[0] = t * n, e[1] = t * r, e[2] = t * i * u, e[3] = t * a * u, e;
        },
        transformMat4: ce,
        transformQuat: function(e, t, n) {
            var r = t[0], i = t[1], a = t[2], o = n[0], s = n[1], u = n[2], f = n[3], c = f * r + s * a - u * i, l = f * i + u * r - o * a, h = f * a + o * i - s * r, d = -o * r - s * i - u * a;
            return e[0] = c * f + d * -o + l * -u - h * -s, e[1] = l * f + d * -s + h * -o - c * -u, 
            e[2] = h * f + d * -u + c * -s - l * -o, e[3] = t[3], e;
        },
        str: function(e) {
            return "vec4(" + e[0] + ", " + e[1] + ", " + e[2] + ", " + e[3] + ")";
        },
        exactEquals: function(e, t) {
            return e[0] === t[0] && e[1] === t[1] && e[2] === t[2] && e[3] === t[3];
        },
        equals: le,
        sub: de,
        mul: pe,
        div: ve,
        dist: me,
        sqrDist: ge,
        len: _e,
        sqrLen: xe,
        forEach: be
    });
    function Ae() {
        var e = new s(4);
        return s != Float32Array && (e[0] = 0, e[1] = 0, e[2] = 0), e[3] = 1, e;
    }
    function Te(e, t, n, r) {
        var i = t[0], a = t[1], o = t[2], s = t[3], u = n[0], f = n[1], c = n[2], l = n[3], h = void 0, d = void 0, p = void 0, v = void 0, m = void 0;
        return (d = i * u + a * f + o * c + s * l) < 0 && (d = -d, u = -u, f = -f, c = -c, 
        l = -l), m = I < 1 - d ? (h = Math.acos(d), p = Math.sin(h), v = Math.sin((1 - r) * h) / p, 
        Math.sin(r * h) / p) : (v = 1 - r, r), e[0] = v * i + m * u, e[1] = v * a + m * f, 
        e[2] = v * o + m * c, e[3] = v * s + m * l, e;
    }
    function Ee(e, t) {
        var n = t[0] + t[4] + t[8], r = void 0;
        if (0 < n) r = Math.sqrt(n + 1), e[3] = .5 * r, r = .5 / r, e[0] = (t[5] - t[7]) * r, 
        e[1] = (t[6] - t[2]) * r, e[2] = (t[1] - t[3]) * r; else {
            var i = 0;
            t[4] > t[0] && (i = 1), t[8] > t[3 * i + i] && (i = 2);
            var a = (i + 1) % 3, o = (i + 2) % 3;
            r = Math.sqrt(t[3 * i + i] - t[3 * a + a] - t[3 * o + o] + 1), e[i] = .5 * r, r = .5 / r, 
            e[3] = (t[3 * a + o] - t[3 * o + a]) * r, e[a] = (t[3 * a + i] + t[3 * i + a]) * r, 
            e[o] = (t[3 * o + i] + t[3 * i + o]) * r;
        }
        return e;
    }
    var Me, Se, we, Re, Oe, Ce, Be, Fe = $, Pe = ie, Ie = fe, De = le;
    Me = _(), Se = y(1, 0, 0), we = y(0, 1, 0), Re = Ae(), Oe = Ae(), Ce = new s(9), 
    s != Float32Array && (Ce[1] = 0, Ce[2] = 0, Ce[3] = 0, Ce[5] = 0, Ce[6] = 0, Ce[7] = 0), 
    Ce[0] = 1, Ce[4] = 1, Ce[8] = 1, Be = Ce;
    function Ne(e, t, n) {
        return e[0] = t, e[1] = n, e;
    }
    var Le, Ue;
    Le = new s(2), s != Float32Array && (Le[0] = 0, Le[1] = 0), Ue = Le;
    function qe(e) {
        return !ze(e) && ("string" == typeof e || null !== e.constructor && e.constructor === String);
    }
    function ze(e) {
        return null == e;
    }
    function Ge(e) {
        return !ze(e);
    }
    function He(e) {
        return !ze(e) && ("function" == typeof e || null !== e.constructor && e.constructor === Function);
    }
    var Ve = "function" == typeof Object.assign;
    function ke(e) {
        if (Ve) Object.assign.apply(Object, arguments); else for (var t = 1; t < arguments.length; t++) {
            var n = arguments[t];
            for (var r in n) e[r] = n[r];
        }
        return e;
    }
    function je(e) {
        for (var t = 1; t < arguments.length; t++) {
            var n = arguments[t];
            for (var r in n) void 0 !== n[r] && null !== n[r] && (e[r] = n[r]);
        }
        return e;
    }
    function We(e) {
        return "number" == typeof e && !isNaN(e);
    }
    function Xe(e, t, n) {
        return e * (1 - n) + t * n;
    }
    function Ye(e) {
        return Array.isArray(e) || e instanceof Uint8Array || e instanceof Int8Array || e instanceof Uint16Array || e instanceof Int16Array || e instanceof Uint32Array || e instanceof Int32Array || e instanceof Uint8ClampedArray || e instanceof Float32Array || e instanceof Float64Array;
    }
    function Ke(e) {
        return (e = Math.abs(e)) < 128 ? Int8Array : e < 32768 ? Int16Array : Float32Array;
    }
    function Je(e, t, n) {
        return Math.min(n, Math.max(t, e));
    }
    function Qe(e) {
        return e && e.hasExtension("oes_vertex_array_object");
    }
    function Ze(e) {
        return function(e) {
            function t() {
                return e.apply(this, arguments) || this;
            }
            o(t, e);
            var n = t.prototype;
            return n.on = function(e, t) {
                return this._events || (this._events = {
                    type: [ t ]
                }), this._events[e] = this._events[e] || [], this._events[e].push(t), this;
            }, n.once = function(e, t) {
                return this.on(e, this._wrapOnce(e, t));
            }, n.off = function(e, t) {
                return this._events && this._events[e] && this._events[e].splice(this._events[e].indexOf(t), 1), 
                this;
            }, n.fire = function(e, t) {
                if (void 0 === t && (t = {}), !this._events || !this._events[e]) return this;
                t.target || (t.target = this);
                for (var n, r = a(this._events[e].slice(0)); !(n = r()).done; ) {
                    (0, n.value)(t);
                }
                return this;
            }, n._wrapOnce = function(n, r) {
                var i = this, a = !1;
                return function e(t) {
                    a || (a = !0, r(t), i.off(n, e));
                };
            }, t;
        }(e);
    }
    var $e, et = Object.freeze({
        __proto__: null,
        isString: qe,
        isNil: ze,
        defined: Ge,
        isFunction: He,
        extend: ke,
        extend1: je,
        extend2: function(e) {
            for (var t = 1; t < arguments.length; t++) {
                var n = arguments[t];
                for (var r in n) void 0 === e[r] && (e[r] = n[r]);
            }
            return e;
        },
        isNumber: We,
        log2: function(e) {
            if (Math.log2) return Math.log2(e);
            var t = Math.log(e) * Math.LOG2E, n = Math.round(t);
            return Math.abs(n - t) < 1e-14 ? n : t;
        },
        normalize: function(e, t) {
            for (var n = 0, r = 0, i = t.length; r < i; r++) n += t[r];
            for (var a = 0, o = t.length; a < o; a++) e[a] = t[a] / n;
            return e;
        },
        interpolate: Xe,
        isArray: Ye,
        lerp: function(e, t, n, r) {
            for (var i = 0; i < e.length; i++) e[i] = t[i] + r * (n[i] - t[i]);
            return e;
        },
        set: function(e, t) {
            for (var n = 0; n < e.length; n++) e[n] = t[n];
            return e;
        },
        getPosArrayType: Ke,
        clamp: Je,
        isSupportVAO: Qe
    }), tt = "__reshader_disposed", nt = Object.freeze({
        __proto__: null,
        KEY_DISPOSED: tt,
        WEBGL_EXTENSIONS: [ "ANGLE_instanced_arrays", "OES_element_index_uint", "OES_standard_derivatives" ],
        WEBGL_OPTIONAL_EXTENSIONS: [ "OES_vertex_array_object", "OES_texture_half_float", "OES_texture_half_float_linear", "OES_texture_float", "OES_texture_float_linear", "WEBGL_depth_texture", "EXT_shader_texture_lod", "EXT_texture_filter_anisotropic" ]
    }), rt = Ze((($e = it.prototype).isReady = function() {
        return !this._loading;
    }, $e.set = function(e, t) {
        return this.config[e] = t, this.dirty = !0, this;
    }, $e.get = function(e) {
        return this.config[e];
    }, $e.getREGLTexture = function(e) {
        return this._texture || (this._texture = this.createREGLTexture(e)), this.dirty && this._updateREGL(), 
        this._texture;
    }, $e._updateREGL = function() {
        this._texture && this._texture(this.config), this.dirty = !1;
    }, $e.dispose = function() {
        this.config && this.config.url && this.resLoader.disposeRes(this.config.url), this._texture && !this._texture[tt] && (this._texture.destroy(), 
        this._texture[tt] = !0), delete this.resLoader, this.fire("disposed", {
            target: this,
            url: this.config && this.config.url
        }), delete this.config;
    }, $e._needPowerOf2 = function() {
        var e = this.config;
        return e.wrap && "clamp" !== e.wrap || e.wrapS && "clamp" !== e.wrapS || e.wrapT && "clamp" !== e.wrapT || e.min && "nearest" !== e.min && "linear" !== e.min;
    }, it));
    function it(e, t) {
        var n = this;
        if (He(e)) for (var r in this._texture = e, e = this.config = {}, this._texture) this._texture.hasOwnProperty(r) && (He(this._texture[r]) || (e[r] = this._texture[r])); else if (this.config = e || {}, 
        this.resLoader = t, (e.url || e.promise) && !e.data) {
            this._loading = !0;
            var i, a = this;
            if (e.promise) i = e.promise; else i = (e.arrayBuffer ? t.getArrayBuffer : t.get).call(t, e.url);
            e.data = t.getDefaultTexture(e.url), (this.promise = i).then(function(e) {
                return n.config && (e.data instanceof Image && n._needPowerOf2() && (e.data = function(e) {
                    if (at(e.width) && at(e.height)) return e;
                    var t = e.width, n = e.height;
                    at(t) || (t = ot(t)), at(n) || (n = ot(n));
                    var r = document.createElement("canvas");
                    r.width = t, r.height = n, r.getContext("2d").drawImage(e, 0, 0, t, n);
                    var i = e.src, a = i.lastIndexOf("/") + 1, o = i.substring(a);
                    return console.warn("Texture(" + o + ")'s size is not power of two, resize from (" + e.width + ", " + e.height + ") to (" + t + ", " + n + ")"), 
                    r;
                }(e.data)), delete n.promise, a._loading = !1, a.config && (a.onLoad(e), Array.isArray(e) || (e = [ e ]), 
                a.fire("complete", {
                    target: n,
                    resources: e
                }))), e;
            }).catch(function(e) {
                console.error("error when loading texture image.", e);
            });
        }
    }
    function at(e) {
        return 0 == (e & e - 1) && 0 !== e;
    }
    function ot(e) {
        return Math.pow(2, Math.floor(Math.log(e) / Math.LN2));
    }
    var st, ut = ((st = ft.prototype).render = function(e, t, n, r) {
        if (e.setUniforms(t || {}), e.setFramebuffer(r), n) {
            var i = n.getSortedMeshes(), a = i.opaques, o = i.transparents;
            e.draw(this.regl, a), e.draw(this.regl, o);
        } else e.draw(this.regl);
        return this;
    }, st.clear = function(e) {
        this.regl.clear(e);
    }, ft);
    function ft(e) {
        this.regl = e;
    }
    var ct, lt = (o(ht, ct = ut), ht);
    function ht() {
        return ct.apply(this, arguments) || this;
    }
    var dt = (pt.prototype.addUniqueNeighbor = function(e) {
        -1 === this.neighbors.indexOf(e) && this.neighbors.push(e);
    }, pt);
    function pt(e, t) {
        this.position = e, this.index = t, this.faces = [], this.neighbors = [];
    }
    var vt, mt = ((vt = gt.prototype).computeNormal = function() {
        var e = this.v1.position, t = this.v2.position, n = this.v3.position, r = P([], L([], n, t), L([], e, t));
        Z(this.normal, r);
    }, vt.hasVertex = function(e) {
        return e === this.v1 || e === this.v2 || e === this.v3;
    }, gt);
    function gt(e, t, n, r) {
        this.a = r.a, this.b = r.b, this.c = r.c, this.v1 = e, this.v2 = t, this.v3 = n, 
        this.normal = [], this.computeNormal(), e.faces.push(this), e.addUniqueNeighbor(t), 
        e.addUniqueNeighbor(n), t.faces.push(this), t.addUniqueNeighbor(e), t.addUniqueNeighbor(n), 
        n.faces.push(this), n.addUniqueNeighbor(e), n.addUniqueNeighbor(t);
    }
    var _t = 8, xt = [], bt = [], yt = [], At = [];
    function Tt(e, t, n) {
        var r, i = P(bt, t, n);
        e = Ee(e, function(e, t, n, r, i, a, o, s, u, f) {
            return e[0] = t, e[1] = n, e[2] = r, e[3] = i, e[4] = a, e[5] = o, e[6] = s, e[7] = u, 
            e[8] = f, e;
        }.apply(void 0, [ xt, n[0], n[1], n[2] ].concat(i, t))), e = (r = e = Ie(e, e))[3] < 0 ? Pe(r, r, -1) : r;
        var a = 1 / ((1 << 2 * _t - 1) - 1);
        if (e[3] < a) {
            e[3] = a;
            var o = Math.sqrt(1 - a * a);
            e[0] *= o, e[1] *= o, e[2] *= o;
        }
        var s = 0 < n[3] ? P(yt, n, t) : P(yt, t, n);
        return F(P(At, n, t), s) < 0 && Pe(e, e, -1), e;
    }
    function Et(e, t, n) {
        return e[0] = t[n], e[1] = t[n + 1], e[2] = t[n + 2], e;
    }
    function Mt(e, t, n) {
        return e[0] = t[n], e[1] = t[n + 1], e;
    }
    var St, wt, Rt = ((wt = Ot.prototype).dirty = function() {
        return this._dirty = !0, this;
    }, wt.getCenter = function() {
        return this.center || (this.center = [], this._dirty = !0), this._dirty && (J(this.center, this.min, this.max), 
        Q(this.center, this.center, .5)), this._dirty = !1, this.center;
    }, wt.containPoint = function(e) {
        var t = this.min, n = this.max;
        return t[0] <= e[0] && t[1] <= e[1] && t[2] <= e[2] && n[0] >= e[0] && n[1] >= e[1] && n[2] >= e[2];
    }, wt.isFinite = (St = function() {
        var e = this.min, t = this.max;
        return isFinite(e[0]) && isFinite(e[1]) && isFinite(e[2]) && isFinite(t[0]) && isFinite(t[1]) && isFinite(t[2]);
    }, Ct.toString = function() {
        return St.toString();
    }, Ct), wt.updateVertex = function() {
        return this.vertex = [ [ this.min[0], this.min[1], this.min[2] ], [ this.min[0], this.min[1], this.max[2] ], [ this.min[0], this.max[1], this.max[2] ], [ this.min[0], this.max[1], this.min[2] ], [ this.max[0], this.min[1], this.min[2] ], [ this.max[0], this.min[1], this.max[2] ], [ this.max[0], this.max[1], this.max[2] ], [ this.max[0], this.max[1], this.min[2] ] ], 
        this.vertex;
    }, wt.equals = function(e) {
        for (var t = 0; t < this.vertex.length; t++) if (!D(e[t], this.vertex[t])) return !1;
        return !0;
    }, Ot);
    function Ot(e, t) {
        this.min = e || [ 1 / 0, 1 / 0, 1 / 0 ], this.max = t || [ -1 / 0, -1 / 0, -1 / 0 ], 
        this.updateVertex();
    }
    function Ct() {
        return St.apply(this, arguments);
    }
    var Bt, Ft = {
        5120: "int8",
        5122: "int16",
        5124: "int32",
        5121: "uint8",
        5123: "uint16",
        5125: "uint32",
        5126: "float"
    }, Pt = {
        positionSize: 3,
        primitive: "triangles",
        positionAttribute: "aPosition",
        normalAttribute: "aNormal",
        uv0Attribute: "aTexCoord",
        uv1Attribute: "aTexCoord1",
        tangentAttribute: "aTangent"
    }, It = ((Bt = Dt.prototype)._prepareData = function() {
        if (this.data) {
            var e = this._buffers || {};
            for (var t in this.data) {
                var n = this.data[t];
                if (n && void 0 !== n.bufferView) {
                    var r = n.bufferView;
                    this.data[t] = {
                        buffer: r,
                        offset: n.byteOffset,
                        stride: n.byteStride,
                        type: Ft[n.componentType],
                        size: n.itemSize,
                        count: n.count
                    }, e[r] || (e[r] = {
                        data: n.array
                    });
                }
            }
            this._buffers = e;
            var i = this.elements;
            i && i.array && (this.elements = this.elements.array);
        }
    }, Bt.getREGLData = function(e, t) {
        var a = this, n = !1;
        if (!this._reglData || this._isAttrChanged(t)) {
            var r = this.data, i = this.desc, o = i.positionAttribute, s = i.normalAttribute, u = i.uv0Attribute, f = i.uv1Attribute, c = i.tangentAttribute;
            this._reglData = ke({}, this.data), delete this._reglData[o], this._reglData.aPosition = r[o], 
            r[s] && (delete this._reglData[s], this._reglData.aNormal = r[s]), r[u] && (delete this._reglData[u], 
            this._reglData.aTexCoord = r[u]), r[f] && (delete this._reglData[f], this._reglData.aTexCoord1 = r[f]), 
            r[c] && (delete this._reglData[c], this._reglData.aTangent = r[c]), this._activeAttributes = t, 
            n = !0;
        }
        if (Qe(e)) {
            var l = t.key;
            if (!this._vao[l] || n) {
                var h = this.getVertexCount(), d = t.map(function(e) {
                    var t = e.name, n = a._reglData[t].buffer;
                    if (n && n.destroy) return n;
                    var r = a._reglData[t], i = (r.data && Ye(r.data) ? r.data.length : r.length) / h;
                    return r.data ? (r.dimension = i, r) : {
                        data: r,
                        dimension: i
                    };
                });
                this._vao[l] ? this._vao[l].vao(d) : this._vao[l] = {
                    vao: e.vao(d)
                };
            }
            return this._vao[l];
        }
        return this._reglData;
    }, Bt._isAttrChanged = function(e) {
        if (e === this._activeAttributes) return !1;
        if (e.length !== this._activeAttributes.length) return !0;
        for (var t = 0; t < e.length; t++) if (e[t] !== this._activeAttributes[t]) return !0;
        return !1;
    }, Bt.generateBuffers = function(e) {
        var t = this._buffers;
        for (var n in t) t[n].buffer || (t[n].buffer = e.buffer(t[n].data)), delete t[n].data;
        var r = this.data, i = this.getVertexCount(), a = {};
        for (var o in r) if (r[o]) if (!r[o].buffer || r[o].buffer instanceof ArrayBuffer) {
            var s = r[o].data ? r[o].data.length / i : r[o].length / i, u = r[o].data ? r[o] : {
                data: r[o]
            };
            u.dimension = s, a[o] = {
                buffer: e.buffer(u)
            };
        } else r[o].buffer.destroy ? a[o] = r[o] : t[r[o].buffer] && (a[o] = ke({}, r[o]), 
        a[o].buffer = t[r[o].buffer].buffer);
        this.data = a, delete this._reglData, this.elements && !We(this.elements) && (this.elements = this.elements.destroy ? this.elements : e.elements({
            primitive: this.getPrimitive(),
            data: this.elements
        }));
    }, Bt.getVertexCount = function() {
        var e = this.desc, t = e.positionAttribute, n = e.positionSize, r = this.data[t];
        return r.data && (r = r.data), Ye(r) && (this._vertexCount = Math.ceil(r.length / n)), 
        this._vertexCount;
    }, Bt.addBuffer = function(e, t) {
        return this._buffers[e] = {
            data: t
        }, delete this._reglData, this._deleteVAO(), this;
    }, Bt.updateBuffer = function(e, t) {
        if (!this._buffers[e]) throw new Error("invalid buffer " + e + " in geometry");
        return this._buffers[e].buffer ? this._buffers[e].buffer.subdata(t) : this._buffers[e].data = t, 
        delete this._reglData, this._deleteVAO(), this;
    }, Bt.updateData = function(e, t) {
        var n, r = this.data[e];
        if (!r) return this;
        this.data[e] = t, r.buffer && r.buffer.destroy && (n = r);
        var i = this.getVertexCount();
        e === this.desc.positionAttribute && this.updateBoundingBox();
        var a = this.getVertexCount();
        return n && (a <= i ? n.buffer.subdata(t) : n.buffer(t), this.data[e] = n), this._prepareData(), 
        delete this._reglData, this;
    }, Bt.getPrimitive = function() {
        return this.desc.primitive;
    }, Bt.getElements = function() {
        return this.elements;
    }, Bt.setElements = function(e, t) {
        if (!e) throw new Error("elements data is invalid");
        var n = this.elements;
        return this.count = void 0 === t ? Nt(e) : t, n.destroy ? this.elements = n(e) : this.elements = e, 
        this;
    }, Bt.setDrawCount = function(e) {
        return this.count1 = e, this;
    }, Bt.getDrawCount = function() {
        return this.count1 || this.count;
    }, Bt.setDrawOffset = function(e) {
        return this.offset = e, this;
    }, Bt.getDrawOffset = function() {
        return this.offset || 0;
    }, Bt.dispose = function() {
        this._deleteVAO(), this._forEachBuffer(function(e) {
            e[tt] || (e[tt] = !0, e.destroy());
        }), this.data = {}, this._buffers = {}, delete this._reglData, delete this._attributes, 
        this.count = 0, this.elements = [], this._disposed = !0;
    }, Bt.isDisposed = function() {
        return !!this._disposed;
    }, Bt.updateBoundingBox = function() {
        var e = this.boundingBox;
        e = e || (this.boundingBox = new Rt());
        var t = this.desc.positionAttribute, n = this.data[t];
        if (Ye(n) || (n = n.data), n && n.length) {
            var r = e.min, i = e.max;
            B(r, n[0], n[1], n[2]), B(i, n[0], n[1], n[2]);
            for (var a = 3; a < n.length; ) {
                var o = n[a++], s = n[a++], u = n[a++];
                o < r[0] && (r[0] = o), s < r[1] && (r[1] = s), u < r[2] && (r[2] = u), o > i[0] && (i[0] = o), 
                s > i[1] && (i[1] = s), u > i[2] && (i[2] = u);
            }
            e.updateVertex(), e.dirty();
        }
    }, Bt.createTangent = function(e) {
        void 0 === e && (e = "aTangent");
        for (var t = this.desc, n = t.normalAttribute, r = t.positionAttribute, i = t.uv0Attribute, a = this.data[n], o = function(p, t, v, e) {
            for (var n = p.length / 3, r = new Array(4 * n), m = [], g = [], i = 0; i < n; i++) m[i] = [ 0, 0, 0 ], 
            g[i] = [ 0, 0, 0 ];
            var _ = [ 0, 0, 0 ], x = [ 0, 0, 0 ], b = [ 0, 0, 0 ], y = [ 0, 0 ], A = [ 0, 0 ], T = [ 0, 0 ], E = [ 0, 0, 0 ], M = [ 0, 0, 0 ];
            function a(e, t, n) {
                Et(_, p, 3 * e), Et(x, p, 3 * t), Et(b, p, 3 * n), Mt(y, v, 2 * e), Mt(A, v, 2 * t), 
                Mt(T, v, 2 * n);
                var r = x[0] - _[0], i = b[0] - _[0], a = x[1] - _[1], o = b[1] - _[1], s = x[2] - _[2], u = b[2] - _[2], f = A[0] - y[0], c = T[0] - y[0], l = A[1] - y[1], h = T[1] - y[1], d = 1 / (f * h - c * l);
                B(E, (h * r - l * i) * d, (h * a - l * o) * d, (h * s - l * u) * d), B(M, (f * i - c * r) * d, (f * o - c * a) * d, (f * u - c * s) * d), 
                J(m[e], m[e], E), J(m[t], m[t], E), J(m[n], m[n], E), J(g[e], g[e], M), J(g[t], g[t], M), 
                J(g[n], g[n], M);
            }
            for (var o = 0, s = e.length; o < s; o += 3) a(e[o + 0], e[o + 1], e[o + 2]);
            var u, f, c, l = [], h = [], d = [], S = [];
            function w(e) {
                Et(d, t, 3 * e), C(S, d), f = m[e], C(l, f), L(l, l, Q(d, d, F(d, f))), Z(l, l), 
                P(h, S, f), c = F(h, g[e]), u = c < 0 ? -1 : 1, r[4 * e] = l[0], r[4 * e + 1] = l[1], 
                r[4 * e + 2] = l[2], r[4 * e + 3] = u;
            }
            for (var R = 0, O = e.length; R < O; R += 3) w(e[R + 0]), w(e[R + 1]), w(e[R + 2]);
            return r;
        }(this.data[r], a, this.data[i], this.elements), s = this.data[e] = new Float32Array(o.length), u = [], f = [], c = [], l = 0; l < o.length; l += 4) {
            var h = l / 4 * 3;
            B(f, a[h], a[1 + h], a[2 + h]), ee(u, o[l], o[l + 1], o[l + 2], o[l + 3]), Tt(c, f, u), 
            $(s.subarray(l, l + 4), c);
        }
        delete this._reglData;
    }, Bt.createNormal = function(e) {
        void 0 === e && (e = "aNormal");
        var t = this.data[this.desc.positionAttribute];
        this.data[e] = function(e, t) {
            var n = [], r = [], i = 0;
            for (i = 0; i < e.length; i += 3) {
                var a = new dt([ e[i], e[i + 1], e[i + 2] ], i / 3);
                n.push(a);
            }
            for (i = 0; i < t.length / 3; i++) {
                var o = {
                    a: t[3 * i],
                    b: t[3 * i + 1],
                    c: t[3 * i + 2]
                };
                new mt(n[o.a], n[o.b], n[o.c], o);
            }
            var s = [], u = [ 0, 0, 0 ];
            for (i = 0; i < n.length; i++) {
                var f = n[i], c = f.index;
                B(u, 0, 0, 0);
                for (var l = f.faces.length, h = 0; h < l; h++) J(u, u, f.faces[h].normal);
                B(s, l = l || 1, l, l), E(u, u, s), r[3 * c] = u[0], r[3 * c + 1] = u[1], r[3 * c + 2] = u[2];
            }
            return r;
        }(t, this.elements), delete this._reglData;
    }, Bt.createBarycentric = function(e) {
        if (void 0 === e && (e = "aBarycentric"), "triangles" !== this.desc.primitive) throw new Error("Primitive must be triangles to create bary centric data");
        for (var t = new Uint8Array(3 * this.getVertexCount()), n = 0, r = this.elements.length; n < r; ) for (var i = 0; i < 3; i++) t[3 * this.elements[n++] + i] = 1;
        this.data[e] = t, delete this._reglData;
    }, Bt.buildUniqueVertex = function() {
        var e = this.data, t = this.elements;
        if (!Ye(t)) throw new Error("elements must be array to build unique vertex.");
        var n = Object.keys(e), r = {};
        if (!Ye(e[this.desc.positionAttribute])) throw new Error(this.desc.positionAttribute + " must be array to build unique vertex.");
        for (var i = this.getVertexCount(), a = t.length, o = 0; o < n.length; o++) {
            var s = n[o], u = e[s].length / i;
            if (!Ye(e[s])) throw new Error(s + " must be array to build unique vertex.");
            r[s] = e[s], r[s].size = u, e[s] = new e[s].constructor(a * u);
        }
        for (var f = 0, c = 0; c < a; c++) {
            for (var l = t[c], h = 0; h < n.length; h++) for (var d = n[h], p = e[d], v = r[d].size, m = 0; m < v; m++) p[f * v + m] = r[d][l * v + m];
            t[c] = f++;
        }
        delete this._reglData;
    }, Bt.getMemorySize = function() {
        var e = 0;
        for (var t in this.data) if (this.data.hasOwnProperty(t)) {
            var n = this.data[t];
            n.data ? e += n.data.length * n.data.BYTES_PER_ELEMENT : e += n.length * n.BYTES_PER_ELEMENT;
        }
        return e;
    }, Bt._deleteVAO = function() {
        for (var e in this._vao) this._vao[e].vao.destroy();
        this._vao = {};
    }, Bt._forEachBuffer = function(e) {
        for (var t in this.elements && this.elements.destroy && e(this.elements), this.data) this.data.hasOwnProperty(t) && this.data[t] && this.data[t].buffer && this.data[t].buffer.destroy && e(this.data[t].buffer);
        for (var n in this._buffers) this._buffers.hasOwnProperty(n) && this._buffers[n] && this._buffers[n].buffer && this._buffers[n].buffer.destroy && e(this._buffers[n].buffer);
    }, Dt);
    function Dt(e, t, n, r) {
        this.data = e, this.elements = t, this.desc = ke({}, Pt, r);
        var i = e[this.desc.positionAttribute];
        n || (t ? n = Nt(t) : i && i.length && (n = i.length / this.desc.positionSize)), 
        this.count = n, this.elements || (this.elements = n), this.properties = {}, this._buffers = {}, 
        this._vao = {}, this.updateBoundingBox(), this.getVertexCount(), this._prepareData();
    }
    function Nt(e) {
        if (We(e)) return e;
        if (void 0 !== e.count) return e.count;
        if (void 0 !== e.length) return e.length;
        if (e.data) return e.data.length;
        throw new Error("invalid elements length");
    }
    var Lt, Ut = Ze(((Lt = qt.prototype).isReady = function() {
        return this._loadingCount <= 0;
    }, Lt.set = function(e, t) {
        var n = !1;
        return ze(this.uniforms[e]) && (n = !0), this.uniforms[e] = t, (e.length < 2 || "u" !== e.charAt(0) || e.charAt(1) !== e.charAt(1).toUpperCase()) && (this.uniforms["u" + zt(e)] = t), 
        this._dirtyUniforms = this.isTexture(e) ? "texture" : "primitive", "texture" === this._dirtyUniforms && this._checkTextures(), 
        n && this._genUniformKeys(), this;
    }, Lt.get = function(e) {
        return this.uniforms[e];
    }, Lt.isDirty = function() {
        return this._dirtyUniforms;
    }, Lt.appendDefines = function(e) {
        var t = this.uniforms;
        return t.jointTexture && (e.HAS_SKIN = 1), t.morphWeights && (e.HAS_MORPH = 1), 
        e;
    }, Lt.getUniforms = function(n) {
        var r = this;
        if (!this._dirtyUniforms) return this._reglUniforms;
        function e(e) {
            var t = r.uniforms[e];
            r.isTexture(e) ? "primitive" === r._dirtyUniforms && r._reglUniforms[e] ? a[e] = r._reglUniforms[e] : (r._reglUniforms[e] && r._reglUniforms[e].destroy(), 
            a[e] = t.getREGLTexture(n)) : Object.defineProperty(a, e, {
                enumerable: !0,
                configurable: !0,
                get: function() {
                    return i && i[e];
                }
            });
        }
        var i = this.uniforms, a = {};
        for (var t in i) e(t);
        return this._reglUniforms = a, this._dirtyUniforms = !1, a;
    }, Lt.isTexture = function(e) {
        return this.uniforms[e] instanceof rt;
    }, Lt.dispose = function() {
        for (var e in this.uniforms) {
            var t = this.uniforms[e];
            t && (t.dispose ? t.dispose() : t.destroy && !t[tt] && (t.destroy(), t[tt] = !0));
        }
        delete this.uniforms, delete this._reglUniforms, this._disposed = !0;
    }, Lt.isDisposed = function() {
        return !!this._disposed;
    }, Lt._checkTextures = function() {
        for (var e in this._loadingCount = 0, this.uniforms) if (this.isTexture(e)) {
            var t = this.uniforms[e];
            t.isReady() || (this._loadingCount++, t.on("complete", this._bindedOnTextureComplete));
        }
    }, Lt._onTextureComplete = function() {
        this._loadingCount--, this._loadingCount <= 0 && this.fire("complete");
    }, Lt.getUniformKeys = function() {
        return this._uniformKeys;
    }, Lt._genUniformKeys = function() {
        var e = [];
        for (var t in this.uniforms) this.uniforms.hasOwnProperty(t) && !ze(this.uniforms[t]) && e.push(t);
        this._uniformKeys = e.join();
    }, qt));
    function qt(e, t) {
        for (var n in void 0 === e && (e = {}), this.uniforms = je({}, t || {}, e), e) {
            var r = Object.getOwnPropertyDescriptor(e, n).get;
            if (r && Object.defineProperty(this.uniforms, n, {
                get: r
            }), n.length < 2 || "u" !== n.charAt(0) || n.charAt(1) !== n.charAt(1).toUpperCase()) {
                var i = "u" + zt(n);
                this.uniforms[i] = e[n], r && Object.defineProperty(this.uniforms, i, {
                    get: r
                });
            }
        }
        this._dirtyUniforms = "texture", this._reglUniforms = {}, this.refCount = 0, this._bindedOnTextureComplete = this._onTextureComplete.bind(this), 
        this._genUniformKeys(), this._checkTextures();
    }
    function zt(e) {
        return e.charAt(0).toUpperCase() + e.substring(1);
    }
    var Gt, Ht = {
        time: 0,
        seeThrough: !0,
        thickness: .03,
        fill: [ 1, .5137254902, .98, 1 ],
        stroke: [ .7019607843, .9333333333, .2274509804, 1 ],
        dashEnabled: !1,
        dashAnimate: !1,
        dashRepeats: 1,
        dashLength: .8,
        dashOverlap: !0,
        insideAltColor: !1,
        squeeze: !1,
        squeezeMin: .5,
        squeezeMax: 1,
        dualStroke: !1,
        secondThickness: .05,
        opacity: 1
    }, Vt = (o(kt, Gt = Ut), kt);
    function kt(e) {
        return Gt.call(this, e, Ht) || this;
    }
    var jt, Wt = {
        baseColorFactor: [ 1, 1, 1, 1 ],
        materialShininess: 32,
        ambientStrength: 1,
        specularStrength: 32,
        opacity: 1,
        extrusionOpacity: 0,
        extrusionOpacityRange: [ 0, 1.8 ],
        baseColorTexture: null,
        normalTexture: null,
        emissiveTexture: null,
        uOcclusionTexture: null,
        uvScale: [ 1, 1 ],
        uvOffset: [ 0, 0 ]
    }, Xt = (o(Yt, jt = Ut), Yt.prototype.appendDefines = function(e, t) {
        jt.prototype.appendDefines.call(this, e, t);
        var n = this.uniforms;
        return n.extrusionOpacity && (e.HAS_EXTRUSION_OPACITY = 1), t.data[t.desc.uv0Attribute] && (n.baseColorTexture && (e.HAS_BASECOLOR_MAP = 1), 
        n.occlusionTexture && (e.HAS_AO_MAP = 1), n.emissiveTexture && (e.HAS_EMISSIVE_MAP = 1), 
        n.normalTexture && (e.HAS_NORMAL_MAP = 1), (e.HAS_BASECOLOR_MAP || e.HAS_AO_MAP || e.HAS_EMISSIVE_MAP || e.HAS_NORMAL_MAP) && (e.HAS_MAP = 1)), 
        e;
    }, Yt);
    function Yt(e) {
        return jt.call(this, e, Wt) || this;
    }
    var Kt, Jt = {
        toons: 4,
        specularToons: 2
    }, Qt = (o(Zt, Kt = Xt), Zt);
    function Zt(e) {
        return Kt.call(this, e, Jt) || this;
    }
    function $t(e) {
        return o(t, r = e), t.prototype.appendDefines = function(e, t) {
            if (r.prototype.appendDefines.call(this, e, t), e.SHADING_MODEL_SPECULAR_GLOSSINESS = 1, 
            !t.data[t.desc.uv0Attribute]) return e;
            var n = this.uniforms;
            return n.diffuseTexture && (e.HAS_DIFFUSE_MAP = 1), n.specularGlossinessTexture && (e.HAS_SPECULARGLOSSINESS_MAP = 1), 
            (e.HAS_SPECULARGLOSSINESS_MAP || e.HAS_DIFFUSE_MAP) && (e.HAS_MAP = 1), e;
        }, t;
        function t(e) {
            return r.call(this, e = ke({}, tn, e || {})) || this;
        }
        var r;
    }
    var en, tn = {
        diffuseFactor: [ 1, 1, 1, 1 ],
        specularFactor: [ 1, 1, 1 ],
        glossinessFactor: 1,
        diffuseTexture: null,
        specularGlossinessTexture: null,
        normalTexture: null,
        emissiveTexture: null,
        occlusionTexture: null
    }, nn = (o(rn, en = $t(Xt)), rn);
    function rn() {
        return en.apply(this, arguments) || this;
    }
    var an, on, sn = [], un = 0, fn = ((an = cn.prototype).setMaterial = function(e) {
        return this.material = e, this._dirtyUniforms = !0, this.dirtyDefines = !0, this;
    }, an.setParent = function() {
        return this.parent = parent, this;
    }, an.setLocalTransform = function(e) {
        return this.localTransform = e, this;
    }, an.setPositionMatrix = function(e) {
        this.positionMatrix = e;
    }, an.setUniform = function(e, t) {
        return void 0 === this.uniforms[e] && (this._dirtyUniforms = !0), this.uniforms[e] = t, 
        this;
    }, an.getUniform = function(e) {
        return this.uniforms[e];
    }, an.getDefines = function() {
        var e = {};
        return this.defines && ke(e, this.defines), this.material && this.geometry && this.material.appendDefines(e, this.geometry), 
        e;
    }, an.setDefines = function(e) {
        return this.defines = e, this.dirtyDefines = !0, this;
    }, an._getDefinesKey = function() {
        return this.dirtyDefines = !1, this._createDefinesKey(this.getDefines());
    }, an.getCommandKey = function() {
        if (!this._commandKey || this.dirtyDefines || this.material && this._materialKeys !== this.material.getUniformKeys()) {
            var e = this._getDefinesKey();
            e += "_" + (We(this.getElements()) ? "count" : "elements"), this._commandKey = e, 
            this.material && (this._materialKeys = this.material.getUniformKeys());
        }
        return this._commandKey;
    }, an.getUniforms = function(r) {
        var i = this;
        return (this._dirtyUniforms || this.material && this.material.isDirty()) && function() {
            function e(e) {
                i.uniforms.hasOwnProperty(e) && Object.defineProperty(i._realUniforms, e, {
                    enumerable: !0,
                    configurable: !0,
                    get: function() {
                        return t && t[e];
                    }
                });
            }
            i._realUniforms = {}, i.material && function() {
                function e(e) {
                    t.hasOwnProperty(e) && Object.defineProperty(i._realUniforms, e, {
                        enumerable: !0,
                        configurable: !0,
                        get: function() {
                            return t && t[e];
                        }
                    });
                }
                var t = i.material.getUniforms(r);
                for (var n in t) e(n);
            }();
            var t = i.uniforms;
            for (var n in i.uniforms) e(n);
            i._dirtyUniforms = !1;
        }(), this._realUniforms.modelMatrix = He(this.localTransform) ? this.localTransform() : this.localTransform, 
        this._realUniforms.positionMatrix = He(this.positionMatrix) ? this.positionMatrix() : this.positionMatrix, 
        this._realUniforms;
    }, an.getMaterial = function() {
        return this.material;
    }, an.getElements = function() {
        return this.geometry.getElements();
    }, an._getREGLAttrData = function(e, t) {
        return this.geometry.getREGLData(e, t);
    }, an.getREGLProps = function(e, t) {
        var n = this.getUniforms(e);
        return ke(n, this._getREGLAttrData(e, t)), n.elements = this.geometry.getElements(), 
        n.count = this.geometry.getDrawCount(), n.offset = this.geometry.getDrawOffset(), 
        n.primitive = this.geometry.getPrimitive(), n;
    }, an.dispose = function() {
        return delete this.geometry, delete this.material, this.uniforms = {}, this;
    }, an.isValid = function() {
        return this.geometry && !this.geometry.isDisposed() && (!this.material || !this.material.isDisposed());
    }, an.getBoundingBox = function() {
        return this._bbox || this.updateBoundingBox(), Y(sn, this.localTransform, this.positionMatrix), 
        this._currentTransform && (e = sn, t = this._currentTransform, n = e[0], r = e[1], 
        i = e[2], a = e[3], o = e[4], s = e[5], u = e[6], f = e[7], c = e[8], l = e[9], 
        h = e[10], d = e[11], p = e[12], v = e[13], m = e[14], g = e[15], _ = t[0], x = t[1], 
        b = t[2], y = t[3], A = t[4], T = t[5], E = t[6], M = t[7], S = t[8], w = t[9], 
        R = t[10], O = t[11], C = t[12], B = t[13], F = t[14], P = t[15], Math.abs(n - _) <= I * Math.max(1, Math.abs(n), Math.abs(_)) && Math.abs(r - x) <= I * Math.max(1, Math.abs(r), Math.abs(x)) && Math.abs(i - b) <= I * Math.max(1, Math.abs(i), Math.abs(b)) && Math.abs(a - y) <= I * Math.max(1, Math.abs(a), Math.abs(y)) && Math.abs(o - A) <= I * Math.max(1, Math.abs(o), Math.abs(A)) && Math.abs(s - T) <= I * Math.max(1, Math.abs(s), Math.abs(T)) && Math.abs(u - E) <= I * Math.max(1, Math.abs(u), Math.abs(E)) && Math.abs(f - M) <= I * Math.max(1, Math.abs(f), Math.abs(M)) && Math.abs(c - S) <= I * Math.max(1, Math.abs(c), Math.abs(S)) && Math.abs(l - w) <= I * Math.max(1, Math.abs(l), Math.abs(w)) && Math.abs(h - R) <= I * Math.max(1, Math.abs(h), Math.abs(R)) && Math.abs(d - O) <= I * Math.max(1, Math.abs(d), Math.abs(O)) && Math.abs(p - C) <= I * Math.max(1, Math.abs(p), Math.abs(C)) && Math.abs(v - B) <= I * Math.max(1, Math.abs(v), Math.abs(B)) && Math.abs(m - F) <= I * Math.max(1, Math.abs(m), Math.abs(F)) && Math.abs(g - P) <= I * Math.max(1, Math.abs(g), Math.abs(P))) && this.geometry.boundingBox.equals(this._GeomtryBBoxVertex) || this.updateBoundingBox(), 
        [ this._bbox.min, this._bbox.max ];
        var e, t, n, r, i, a, o, s, u, f, c, l, h, d, p, v, m, g, _, x, b, y, A, T, E, M, S, w, R, O, C, B, F, P;
    }, an.updateBoundingBox = function() {
        this._bbox || (this._bbox = new Rt());
        var e = this.geometry.boundingBox;
        if (this._currentTransform = this._currentTransform || [], this.localTransform[1] || this.localTransform[2] || this.localTransform[4] || this.localTransform[6] || this.localTransform[8] || this.localTransform[9]) {
            for (var t = e.vertex, n = Y(this._currentTransform, this.localTransform, this.positionMatrix), r = 0; r < t.length; r++) ee(this._bbox.vertex[r], t[r][0], t[r][1], t[r][2], 1), 
            ce(this._bbox.vertex[r], this._bbox.vertex[r], n);
            var i = this._bbox.vertex.map(function(e) {
                return e[0];
            }), a = this._bbox.vertex.map(function(e) {
                return e[1];
            }), o = this._bbox.vertex.map(function(e) {
                return e[2];
            }), s = Math.min.apply(Math, i), u = Math.max.apply(Math, i), f = Math.min.apply(Math, a), c = Math.max.apply(Math, a), l = Math.min.apply(Math, o), h = Math.max.apply(Math, o);
            B(this._bbox.min, s, f, l), B(this._bbox.max, u, c, h);
        } else {
            var d = e.min, p = e.max;
            ee(this._bbox.min, d[0], d[1], d[2], 1), ee(this._bbox.max, p[0], p[1], p[2], 1);
            var v = Y(this._currentTransform, this.localTransform, this.positionMatrix);
            ce(this._bbox.min, this._bbox.min, v), ce(this._bbox.max, this._bbox.max, v);
        }
        this._GeomtryBBoxVertex = e.vertex.map(function(e) {
            return [ e[0], e[1], e[2] ];
        });
    }, an._createDefinesKey = function(e) {
        var t = [];
        for (var n in e) t.push(n, e[n]);
        return t.join(",");
    }, cn);
    function cn(e, t, n) {
        void 0 === n && (n = {}), this.geometry = e, this.material = t, this.config = n, 
        this.transparent = !!n.transparent, this.castShadow = ze(n.castShadow) || n.castShadow, 
        this.picking = !!n.picking, this.uniforms = {}, this.localTransform = X(new Array(16)), 
        this.positionMatrix = X(new Array(16)), this.properties = {}, this._dirtyUniforms = !0, 
        Object.defineProperty(this, "uuid", {
            value: un++
        }), un > Number.MAX_VALUE - 10 && (un = 0);
    }
    fn.prototype.getWorldTransform = (on = [], function() {
        return parent ? Y(on, parent.getWorldTransform(), this.localTransform) : this.localTransform;
    });
    var ln, hn, dn, pn, vn, mn, gn, _n, xn, bn = [], yn = [], An = [], Tn = function(w) {
        function e(e, t, n, r, i) {
            var a;
            return void 0 === i && (i = {}), (a = w.call(this, n, r, i) || this).instanceCount = t, 
            a.instancedData = e || {}, a._checkInstancedProp(), a._vao = {}, a;
        }
        o(e, w);
        var t = e.prototype;
        return t._checkInstancedProp = function() {
            for (var e in this.instancedData) if (this.geometry.data[e]) throw new Error("Duplicate attribute " + e + " defined in geometry and instanced data");
        }, t._getREGLAttrData = function(e, t) {
            var n = this.geometry.getREGLData();
            if (Qe(e)) {
                var r = t.key;
                if (!this._vao[r]) {
                    for (var i = t.map(function(e) {
                        return e.name;
                    }), a = [], o = 0; o < i.length; o++) {
                        var s = n[i[o]] || this.instancedData[i[o]];
                        a.push(s);
                    }
                    this._vao[r] = {
                        vao: e.vao(a)
                    };
                }
                return this._vao[r];
            }
            return n;
        }, t.getDefines = function() {
            var e = w.prototype.getDefines.call(this);
            return e.HAS_INSTANCE = 1, e;
        }, t.getCommandKey = function(e) {
            return "i_" + w.prototype.getCommandKey.call(this, e);
        }, t.updateInstancedData = function(e, t) {
            var n = this.instancedData[e];
            return n && (this.instancedData[e] = t, n.buffer && n.buffer.destroy && n.buffer.destroy()), 
            this;
        }, t.generateInstancedBuffers = function(e) {
            var t = this.instancedData, n = {};
            for (var r in t) t[r] && (void 0 !== t[r].buffer && t[r].buffer.destroy ? (n[r] = t[r], 
            n[r].divisor && (n[r].divisor = 1)) : t[r].destroy ? n[r] = {
                buffer: t[r],
                divisor: 1
            } : n[r] = {
                buffer: e.buffer({
                    data: t[r],
                    dimension: t[r].length / this.instanceCount
                }),
                divisor: 1
            });
            return this.instancedData = n, this;
        }, t.getREGLProps = function(e, t) {
            var n = w.prototype.getREGLProps.call(this, e, t);
            return Qe(e) || ke(n, this.instancedData), n.instances = this.instanceCount, n;
        }, t.disposeInstanceData = function() {
            var e = this.instancedData;
            if (e) for (var t in e) e[t] && e[t].destroy && !e[t][tt] && (e[t][tt] = 1, e[t].destroy());
            for (var n in this.instancedData = {}, this._vao) this._vao[n].vao.destroy();
            this._vao = {};
        }, t.getBoundingBox = function() {
            return this._bbox || this.updateBoundingBox(), this._bbox;
        }, t.updateBoundingBox = function() {
            var e = this.instancedData, t = e.instance_vectorA, n = e.instance_vectorB, r = e.instance_vectorC, i = e.instance_vectorD;
            if (!(t && n && r && i)) return w.prototype.updateBoundingBox.call(this);
            this._bbox || (this._bbox = [ [ 1 / 0, 1 / 0, 1 / 0 ], [ -1 / 0, -1 / 0, -1 / 0 ] ]);
            for (var a, o, s, u, f, c, l, h, d, p, v, m, g, _, x, b, y, A = this.geometry.boundingBox, T = A.min, E = A.max, M = 0; M < t.length; M += 4) {
                a = bn, o = t[M], s = t[M + 1], u = t[M + 2], f = t[M + 3], c = n[M], l = n[M + 1], 
                h = n[M + 2], d = n[M + 3], p = r[M], v = r[M + 1], m = r[M + 2], g = r[M + 3], 
                _ = i[M], x = i[M + 1], b = i[M + 2], y = i[M + 3], a[0] = o, a[1] = s, a[2] = u, 
                a[3] = f, a[4] = c, a[5] = l, a[6] = h, a[7] = d, a[8] = p, a[9] = v, a[10] = m, 
                a[11] = g, a[12] = _, a[13] = x, a[14] = b, a[15] = y, Y(bn, bn, this.positionMatrix);
                var S = Y(bn, this.localTransform, bn);
                ee(yn, T[0], T[1], T[2], 1), ee(An, E[0], E[1], E[2], 1), ce(yn, yn, S), ce(An, An, S), 
                this._bbox[0][0] = Math.min(this._bbox[0][0], yn[0]), this._bbox[0][1] = Math.min(this._bbox[0][1], yn[1]), 
                this._bbox[0][2] = Math.min(this._bbox[0][2], yn[2]), this._bbox[1][0] = Math.max(this._bbox[1][0], yn[0]), 
                this._bbox[1][1] = Math.max(this._bbox[1][1], yn[1]), this._bbox[1][2] = Math.max(this._bbox[1][2], yn[2]);
            }
            return this._bbox;
        }, t._getBytesPerElement = function(e) {
            switch (e) {
              case 5120:
              case 5121:
                return 1;

              case 5122:
              case 5123:
                return 2;

              case 5124:
              case 5125:
              case 5126:
                return 4;
            }
            throw new Error("unsupported data type: " + e);
        }, e;
    }(fn), En = {
        getArrayBuffer: function(e, t) {
            return En.get(e, {
                responseType: "arraybuffer"
            }, t);
        },
        get: function(e, t, n) {
            var r = En._getClient(n);
            if (r.open("GET", e, !0), t) {
                for (var i in t.headers) r.setRequestHeader(i, t.headers[i]);
                r.withCredentials = "include" === t.credentials, t.responseType && (r.responseType = t.responseType);
            }
            return r.send(null), r;
        },
        _wrapCallback: function(e, t) {
            return function() {
                4 === e.readyState && (200 === e.status ? "arraybuffer" === e.responseType ? 0 === e.response.byteLength ? t(new Error("http status 200 returned without content.")) : t(null, {
                    data: e.response,
                    cacheControl: e.getResponseHeader("Cache-Control"),
                    expires: e.getResponseHeader("Expires"),
                    contentType: e.getResponseHeader("Content-Type")
                }) : t(null, e.responseText) : t(new Error(e.statusText + "," + e.status)));
            };
        },
        _getClient: function(e) {
            var t;
            try {
                t = new XMLHttpRequest();
            } catch (e) {
                try {
                    t = new ActiveXObject("Msxml2.XMLHTTP");
                } catch (e) {
                    try {
                        t = new ActiveXObject("Microsoft.XMLHTTP");
                    } catch (e) {}
                }
            }
            return t.onreadystatechange = En._wrapCallback(t, e), t;
        }
    }, Mn = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : {}, Sn = (hn = ln = {
        exports: {}
    }, dn = Mn, _n = "undefined", vn = [], mn = 0, gn = function() {
        if (typeof MutationObserver == _n) return typeof process != _n && "function" == typeof process.nextTick ? function() {
            process.nextTick(wn);
        } : typeof setImmediate != _n ? function() {
            setImmediate(wn);
        } : function() {
            setTimeout(wn, 0);
        };
        var e = document.createElement("div");
        return new MutationObserver(wn).observe(e, {
            attributes: !0
        }), function() {
            e.setAttribute("a", 0);
        };
    }(), xn = function(e) {
        vn.push(e), vn.length - mn == 1 && gn();
    }, Rn.prototype = {
        resolve: function(n) {
            if (void 0 === this.state) {
                if (n === this) return this.reject(new TypeError("Attempt to resolve promise with self"));
                var r = this;
                if (n && ("function" == typeof n || "object" == typeof n)) try {
                    var t = !0, e = n.then;
                    if ("function" == typeof e) return void e.call(n, function(e) {
                        t && (t = !1, r.resolve(e));
                    }, function(e) {
                        t && (t = !1, r.reject(e));
                    });
                } catch (e) {
                    return void (t && this.reject(e));
                }
                this.state = "fulfilled", this.v = n, r.c && xn(function() {
                    for (var e = 0, t = r.c.length; e < t; e++) On(r.c[e], n);
                });
            }
        },
        reject: function(n) {
            if (void 0 === this.state) {
                var e = this;
                this.state = "rejected", this.v = n;
                var r = this.c;
                xn(r ? function() {
                    for (var e = 0, t = r.length; e < t; e++) Cn(r[e], n);
                } : function() {
                    e.handled || !Rn.suppressUncaughtRejectionError && dn.console && Rn.warn("You upset Zousan. Please catch rejections: ", n, n ? n.stack : null);
                });
            }
        },
        then: function(e, t) {
            var n = new Rn(), r = {
                y: e,
                n: t,
                p: n
            };
            if (void 0 === this.state) this.c ? this.c.push(r) : this.c = [ r ]; else {
                var i = this.state, a = this.v;
                this.handled = !0, xn(function() {
                    ("fulfilled" === i ? On : Cn)(r, a);
                });
            }
            return n;
        },
        catch: function(e) {
            return this.then(null, e);
        },
        finally: function(e) {
            return this.then(e, e);
        },
        timeout: function(e, r) {
            r = r || "Timeout";
            var i = this;
            return new Rn(function(t, n) {
                setTimeout(function() {
                    n(Error(r));
                }, e), i.then(function(e) {
                    t(e);
                }, function(e) {
                    n(e);
                });
            });
        }
    }, Rn.resolve = function(e) {
        var t = new Rn();
        return t.resolve(e), t;
    }, Rn.reject = function(e) {
        var t = new Rn();
        return t.c = [], t.reject(e), t;
    }, Rn.all = function(n) {
        var r = [], i = 0, a = new Rn();
        function e(e, t) {
            e && "function" == typeof e.then || (e = Rn.resolve(e)), e.then(function(e) {
                r[t] = e, ++i == n.length && a.resolve(r);
            }, function(e) {
                a.reject(e);
            });
        }
        for (var t = 0; t < n.length; t++) e(n[t], t);
        return n.length || a.resolve(r), a;
    }, Rn.warn = console.warn, hn.exports && (hn.exports = Rn), dn.define && dn.define.amd && dn.define([], function() {
        return Rn;
    }), (dn.Zousan = Rn).soon = xn, ln.exports);
    function wn() {
        for (;vn.length - mn; ) {
            try {
                vn[mn]();
            } catch (e) {
                dn.console && dn.console.error(e);
            }
            vn[mn++] = pn, 1024 == mn && (vn.splice(0, 1024), mn = 0);
        }
    }
    function Rn(e) {
        if (!(this instanceof Rn)) throw new TypeError("Zousan must be created with the new keyword");
        if ("function" == typeof e) {
            var t = this;
            try {
                e(function(e) {
                    t.resolve(e);
                }, function(e) {
                    t.reject(e);
                });
            } catch (e) {
                t.reject(e);
            }
        } else if (0 < arguments.length) throw new TypeError("Zousan resolver " + e + " is not a function");
    }
    function On(e, t) {
        if ("function" == typeof e.y) try {
            var n = e.y.call(pn, t);
            e.p.resolve(n);
        } catch (t) {
            e.p.reject(t);
        } else e.p.resolve(t);
    }
    function Cn(e, t) {
        if ("function" == typeof e.n) try {
            var n = e.n.call(pn, t);
            e.p.resolve(n);
        } catch (t) {
            e.p.reject(t);
        } else e.p.reject(t);
    }
    var Bn, Fn = "undefined" != typeof Promise ? Promise : Sn, Pn = Ze(((Bn = In.prototype).get = function(e) {
        return Array.isArray(e) ? this._loadImages(e) : this._loadImage(e);
    }, Bn.getArrayBuffer = function(i) {
        var t = this;
        if (Array.isArray(i)) {
            var e = i.map(function(e) {
                return t.getArrayBuffer(e);
            });
            return Fn.all(e);
        }
        return new Fn(function(n, r) {
            En.getArrayBuffer(i, function(e, t) {
                e ? r(e) : n({
                    url: i,
                    data: t
                });
            });
        });
    }, Bn.disposeRes = function(e) {
        var t = this;
        return Array.isArray(e) ? e.forEach(function(e) {
            return t._disposeOne(e);
        }) : this._disposeOne(e), this;
    }, Bn.isLoading = function() {
        return this._count && 0 < this._count;
    }, Bn.getDefaultTexture = function(e) {
        return Array.isArray(e) ? this._getBlankTextures(e.length) : this.defaultTexture;
    }, Bn._disposeOne = function(e) {
        var t = this.resources;
        t[e] && (t[e].count--, t[e.count] <= 0 && delete t[e]);
    }, Bn._loadImage = function(r) {
        var i = this.resources;
        return i[r] ? Fn.resolve({
            url: r,
            data: i[r].image
        }) : new Fn(function(e, t) {
            var n = new Image();
            n.crossOrigin = "anonymous", n.onload = function() {
                i[r] = {
                    image: n,
                    count: 1
                }, e({
                    url: r,
                    data: n
                });
            }, n.onerror = function(e) {
                t(e);
            }, n.onabort = function() {
                t("image(" + r + ") loading aborted.");
            }, n.src = r;
        });
    }, Bn._loadImages = function(e) {
        var t = this, n = e.map(function(e) {
            return t._loadImage(e, !0);
        });
        return Fn.all(n);
    }, Bn._getBlankTextures = function(e) {
        for (var t = new Array(e), n = 0; n < 6; n++) t.push(this.defaultTexture);
        return t;
    }, In));
    function In(e) {
        this.defaultTexture = e, this.defaultCubeTexture = new Array(6), this.resources = {};
    }
    var Dn, Nn = [], Ln = [], Un = 0, qn = ((Dn = zn.prototype).setMeshes = function(e) {
        if (this.clear(), !e || Array.isArray(e) && !e.length || e === this.meshes) return this;
        e = Array.isArray(e) ? e : [ e ], this.meshes = [];
        for (var t = 0; t < e.length; t++) {
            var n = e[t];
            n && (n._scenes = n._scenes || {}, n._scenes[this._id] = 1, this.meshes.push(n));
        }
        return this.dirty(), this;
    }, Dn.addMesh = function(e) {
        var t = this;
        return !e || Array.isArray(e) && !e.length || (Array.isArray(e) ? e.forEach(function(e) {
            e._scenes = e._scenes || {}, e._scenes[t._id] || (e._scenes[t._id] = 1, t.meshes.push(e), 
            t.dirty());
        }) : (e._scenes = e._scenes || {}, e._scenes[this._id] || (e._scenes[this._id] = 1, 
        this.meshes.push(e), this.dirty()))), this;
    }, Dn.removeMesh = function(t) {
        if (!t || Array.isArray(t) && !t.length) return this;
        if (Array.isArray(t)) {
            for (var e = !1, n = 0; n < t.length; n++) t[n]._scenes && t[n]._scenes[this._id] && (e = !0, 
            this.dirty(), delete t[n]._scenes[this._id]);
            e && (this.meshes = this.meshes.filter(function(e) {
                return t.indexOf(e) < 0;
            }));
        } else {
            if (!t._scenes || !t._scenes[this._id]) return this;
            var r = this.meshes.indexOf(t);
            0 <= r && this.meshes.splice(r, 1), delete t._scenes[this._id], this.dirty();
        }
        return this;
    }, Dn.getMeshes = function() {
        return this.meshes;
    }, Dn.clear = function() {
        if (this.meshes) for (var e = 0; e < this.meshes.length; e++) delete this.meshes[e]._scenes[this._id];
        return this.meshes = [], this.sortedMeshes.opaques = [], this.sortedMeshes.transparents = [], 
        this;
    }, Dn.dirty = function() {
        return this._dirty = !0, this;
    }, Dn.sortMeshes = function(e) {
        var t = this.meshes;
        this.sortFunction && t.sort(this.sortFunction);
        var n = this.sortedMeshes.transparents;
        if (this._dirty) {
            var r = this.sortedMeshes.opaques = [];
            n = this.sortedMeshes.transparents = [];
            for (var i = 0, a = t.length; i < a; i++) t[i].transparent ? n.push(t[i]) : r.push(t[i]);
        }
        e && 1 < n.length && (this._cameraPosition = e, n.sort(this._compareBinded), delete this._cameraPosition), 
        this._dirty = !1;
    }, Dn.getSortedMeshes = function() {
        return this._dirty && this.sortMeshes(), this.sortedMeshes;
    }, Dn._compare = function(e, t) {
        return O(Nn, e.geometry.boundingBox.getCenter(), e.localTransform), O(Ln, t.geometry.boundingBox.getCenter(), t.localTransform), 
        z(Ln, this._cameraPosition) - z(Nn, this._cameraPosition);
    }, zn);
    function zn(e) {
        this._id = Un++, this.sortedMeshes = {}, this.setMeshes(e), this._compareBinded = this._compare.bind(this), 
        this.dirty();
    }
    var Gn = String.fromCharCode, Hn = 8, Vn = 32767;
    function kn(e, t, n, r) {
        if (0 < e[3]) {
            var i = Math.pow(2, e[3] - 128 - 8 + r);
            t[n + 0] = e[0] * i, t[n + 1] = e[1] * i, t[n + 2] = e[2] * i;
        } else t[n + 0] = 0, t[n + 1] = 0, t[n + 2] = 0;
        return t[n + 3] = 1, t;
    }
    function jn(e, t, n, r) {
        for (var i, a, o = 0, s = 0, u = r; 0 < u; ) if (e[s][0] = t[n++], e[s][1] = t[n++], 
        e[s][2] = t[n++], e[s][3] = t[n++], 1 === e[s][0] && 1 === e[s][1] && 1 === e[s][2]) {
            for (var f = e[s][3] << o >>> 0; 0 < f; f--) i = e[s - 1], (a = e[s])[0] = i[0], 
            a[1] = i[1], a[2] = i[2], a[3] = i[3], s++, u--;
            o += 8;
        } else s++, u--, o = 0;
        return n;
    }
    function Wn(e, t, n, r) {
        if (r < Hn | Vn < r) return jn(e, t, n, r);
        var i = t[n++];
        if (2 !== i) return jn(e, t, n - 1, r);
        if (e[0][1] = t[n++], e[0][2] = t[n++], i = t[n++], (e[0][2] << 8 >>> 0 | i) >>> 0 !== r) return null;
        for (var a = 0; a < 4; a++) for (var o = 0; o < r; ) {
            var s = t[n++];
            if (128 < s) {
                s = (127 & s) >>> 0;
                for (var u = t[n++]; s--; ) e[o++][a] = u;
            } else for (;s--; ) e[o++][a] = t[n++];
        }
        return n;
    }
    function Xn(e, t, n) {
        void 0 === t && (t = 0), void 0 === n && (n = 9);
        var r = new Uint8Array(e), i = r.length;
        if ("#?" !== function(e) {
            for (var t = "", n = 0; n < 2; n++) t += Gn(e[n]);
            return t;
        }(r)) return null;
        for (var a = 2; a < i && ("\n" !== Gn(r[a]) || "\n" !== Gn(r[a + 1])); a++) ;
        if (i <= a) return null;
        a += 2;
        for (var o = ""; a < i; a++) {
            var s = Gn(r[a]);
            if ("\n" === s) break;
            o += s;
        }
        var u = o.split(" "), f = parseInt(u[1]), c = parseInt(u[3]);
        if (!c || !f) return null;
        for (var l = a + 1, h = [], d = 0; d < c; d++) {
            h[d] = [];
            for (var p = 0; p < 4; p++) h[d][p] = 0;
        }
        for (var v, m, g, _, x, b, y, A = 0, T = new Array(c * f * 4), E = 0, M = 0; M < f; M++) {
            if (!(l = Wn(h, r, l, c))) return null;
            for (var S = 0; S < c; S++) kn(h[S], T, E, t), A = Math.max(A, T[E], T[E + 1], T[E + 2], T[E + 3]), 
            E += 4;
        }
        A = Math.min(A, n);
        for (var w = E = 0; w < f; w++) for (var R = 0; R < c; R++) g = A, y = void 0, _ = (v = T)[m = E] / g, 
        x = v[m + 1] / g, b = v[m + 2] / g, y = Je(Math.max(Math.max(_, x), Math.max(b, 1e-6)), 0, 1), 
        y = Math.ceil(255 * y) / 255, v[m] = Math.min(255, _ / y * 255), v[m + 1] = Math.min(255, x / y * 255), 
        v[m + 2] = Math.min(255, b / y * 255), v[m + 3] = Math.min(255, 255 * y), E += 4;
        return {
            width: c,
            height: f,
            pixels: T,
            rgbmRange: A
        };
    }
    var Yn, Kn = function(e) {
        function t() {
            return e.apply(this, arguments) || this;
        }
        o(t, e);
        var n = t.prototype;
        return n.onLoad = function(e) {
            var t = e.data, n = this.config;
            n.hdr ? (t = Xn(t.data, 0, n.maxRange), this.rgbmRange = t.rgbmRange, n.data = t.pixels) : n.data = t, 
            n.width = n.width || t.width, n.height = n.height || t.height, this._updateREGL();
        }, n.createREGLTexture = function(e) {
            return e.texture(this.config);
        }, t;
    }(rt), Jn = function(e) {
        function t() {
            return e.apply(this, arguments) || this;
        }
        o(t, e);
        var n = t.prototype;
        return n.onLoad = function(e) {
            var t = this.config, n = this._createFaces(e);
            t.faces = n.map(function(e) {
                return e.data;
            }), this._updateREGL();
        }, n.createREGLTexture = function(e) {
            return e.cube(this.config);
        }, n._createFaces = function() {
            return [];
        }, t;
    }(rt), Qn = (o(Zn, Yn = It), Zn);
    function Zn(e) {
        return Yn.call(this, {
            aPosition: new (Ke(e = e || 0))([ -1, -1, e, 1, -1, e, -1, 1, e, 1, 1, e ]),
            aNormal: new Int8Array([ 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1 ])
        }, [ 0, 1, 3, 3, 2, 0 ]) || this;
    }
    var $n = {
        vsm_shadow_vert: "\nuniform mat4 shadow_lightProjViewModelMatrix;\nvarying vec4 shadow_vLightSpacePos;\nvoid shadow_computeShadowPars(vec4 position) {\n    shadow_vLightSpacePos = shadow_lightProjViewModelMatrix * position;\n}",
        vsm_shadow_frag: "\nuniform sampler2D shadow_shadowMap;\nuniform float shadow_opacity;\nuniform vec3 shadow_color;\n#if defined(USE_ESM)\n    uniform float esm_shadow_threshold;\n#endif\nvarying vec4 shadow_vLightSpacePos;\n#ifdef PACK_FLOAT\n    #include <common_pack_float>\n#endif\n#if defined(USE_ESM)\nfloat esm(vec3 projCoords, vec4 shadowTexel) {\n    float compare = projCoords.z;\n    float c = 120.0;\n    #ifdef PACK_FLOAT\n        float depth = common_decodeDepth(shadowTexel);\n        if (depth >= 1.0 - 1E-6 || compare <= depth) {\n            return 1.0;\n        }\n    #else\n        float depth = shadowTexel.r;\n    #endif\n    depth = exp(-c * min(compare - depth, 0.05));\n    return clamp(depth, esm_shadow_threshold, 1.0);\n}\n#endif\n#if defined(USE_VSM)\nfloat vsm_shadow_chebyshevUpperBound(vec3 projCoords, vec4 shadowTexel){\n    vec2 moments = shadowTexel.rg;\n    float distance = projCoords.z;\n    if (distance >= 1.0 || distance <= moments.x)\n        return 1.0 ;\n    float variance = moments.y - (moments.x * moments.x);\n    variance = max(variance, 0.00002);\n    float d = distance - moments.x;\n    float p_max = variance / (variance + d * d);\n    return p_max;\n}\n#endif\nfloat shadow_computeShadow_coeff(sampler2D shadowMap, vec3 projCoords) {\n    vec2 uv = projCoords.xy;\n    vec4 shadowTexel = texture2D(shadowMap, uv);\n    #if defined(USE_ESM)\n        float esm_coeff = esm(projCoords, shadowTexel);\n        float coeff = esm_coeff * esm_coeff;\n    #endif\n    #if defined(USE_VSM)\n        float vsm_coeff = vsm_shadow_chebyshevUpperBound(projCoords, shadowTexel);\n        float coeff = vsm_coeff;\n    #endif\n    return 1.0 - (1.0 - coeff) * shadow_opacity;\n}\nfloat shadow_computeShadow() {\n    vec3 projCoords = shadow_vLightSpacePos.xyz / shadow_vLightSpacePos.w;\n    projCoords = projCoords * 0.5 + 0.5;\n    if(projCoords.z >= 1.0 || projCoords.x < 0.0 || projCoords.x > 1.0 || projCoords.y < 0.0 || projCoords.y > 1.0) return 1.0;\n    return shadow_computeShadow_coeff(shadow_shadowMap, projCoords);\n}\nvec3 shadow_blend(vec3 color, float coeff) {\n    color = color * coeff + shadow_color * shadow_opacity * (1.0 - coeff);\n    return color;\n}",
        fbo_picking_vert: "\n#ifdef ENABLE_PICKING\n#if HAS_PICKING_ID == 1\nattribute float aPickingId;\n#elif HAS_PICKING_ID == 2\nuniform float uPickingId;\n#endif\nvarying float vPickingId;\nvarying float vFbo_picking_viewZ;\nvarying float vFbo_picking_visible;\n#endif\nvoid fbo_picking_setData(float viewPosZ, bool visible) {\n    #ifdef ENABLE_PICKING\n    #if HAS_PICKING_ID == 1\n       vPickingId = aPickingId;\n    #elif HAS_PICKING_ID == 2\n        vPickingId = uPickingId;\n    #endif\n        vFbo_picking_viewZ = viewPosZ;\n    #endif\n    vFbo_picking_visible = visible ? 1.0 : 0.0;\n}",
        common_pack_float: "const float COMMON_FLOAT_MAX =  1.70141184e38;\nconst float COMMON_FLOAT_MIN = 1.17549435e-38;\nfloat common_packFloat(vec4 val){\n    vec4 scl = floor(255.0 * val + 0.5);\n    float sgn = (scl.a < 128.0) ? 1.0 : -1.0;\n    float exn = mod(scl.a * 2.0, 256.0) + floor(scl.b / 128.0) - 127.0;\n    float man = 1.0 +\n        (scl.r / 8388608.0) +\n        (scl.g / 32768.0) +\n        mod(scl.b, 128.0) / 128.0;\n    return sgn * man * pow(2.0, exn);\n}\nvec4 common_unpackFloat(highp float v) {\n    highp float av = abs(v);\n    if(av < COMMON_FLOAT_MIN) {\n        return vec4(0.0, 0.0, 0.0, 0.0);\n    } else if(v > COMMON_FLOAT_MAX) {\n        return vec4(127.0, 128.0, 0.0, 0.0) / 255.0;\n    } else if(v < -COMMON_FLOAT_MAX) {\n        return vec4(255.0, 128.0, 0.0, 0.0) / 255.0;\n    }\n    highp vec4 c = vec4(0,0,0,0);\n    highp float e = floor(log2(av));\n    highp float m = av * pow(2.0, -e) - 1.0;\n    c[1] = floor(128.0 * m);\n    m -= c[1] / 128.0;\n    c[2] = floor(32768.0 * m);\n    m -= c[2] / 32768.0;\n    c[3] = floor(8388608.0 * m);\n    highp float ebias = e + 127.0;\n    c[0] = floor(ebias / 2.0);\n    ebias -= c[0] * 2.0;\n    c[1] += floor(ebias) * 128.0;\n    c[0] += 128.0 * step(0.0, -v);\n    return c / 255.0;\n}\nvec4 common_encodeDepth(const in float depth) {\n    float alpha = 1.0;\n    vec4 pack = vec4(0.0);\n    pack.a = alpha;\n    const vec3 code = vec3(1.0, 255.0, 65025.0);\n    pack.rgb = vec3(code * depth);\n    pack.gb = fract(pack.gb);\n    pack.rg -= pack.gb * (1.0 / 256.0);\n    pack.b -= mod(pack.b, 4.0 / 255.0);\n    return pack;\n}\nfloat common_decodeDepth(const in vec4 pack) {\n    return pack.r + pack.g / 255.0;\n}",
        invert_matrix: "mat4 invert_matrix(mat4 matrix) {\n    #if __VERSION__ == 300\n        return inverse(matrix);\n    #else\n        vec4 vector1 = matrix[0], vector2 = matrix[1], vector3 = matrix[2], vector4 = matrix[3];\n        float a00 = vector1.x, a01 = vector1.y, a02 = vector1.z, a03 = vector1.w;\n        float a10 = vector2.x, a11 = vector2.y, a12 = vector2.z, a13 = vector2.w;\n        float a20 = vector3.x, a21 = vector3.y, a22 = vector3.z, a23 = vector3.w;\n        float a30 = vector4.x, a31 = vector4.y, a32 = vector4.z, a33 = vector4.w;\n        float b00 = a00 * a11 - a01 * a10;\n        float b01 = a00 * a12 - a02 * a10;\n        float b02 = a00 * a13 - a03 * a10;\n        float b03 = a01 * a12 - a02 * a11;\n        float b04 = a01 * a13 - a03 * a11;\n        float b05 = a02 * a13 - a03 * a12;\n        float b06 = a20 * a31 - a21 * a30;\n        float b07 = a20 * a32 - a22 * a30;\n        float b08 = a20 * a33 - a23 * a30;\n        float b09 = a21 * a32 - a22 * a31;\n        float b10 = a21 * a33 - a23 * a31;\n        float b11 = a22 * a33 - a23 * a32;\n        float det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;\n        det = 1.0 / det;\n        mat4 m = mat4(\n            (a11 * b11 - a12 * b10 + a13 * b09) * det,\n            (a02 * b10 - a01 * b11 - a03 * b09) * det,\n            (a31 * b05 - a32 * b04 + a33 * b03) * det,\n            (a22 * b04 - a21 * b05 - a23 * b03) * det,\n            (a12 * b08 - a10 * b11 - a13 * b07) * det,\n            (a00 * b11 - a02 * b08 + a03 * b07) * det,\n            (a32 * b02 - a30 * b05 - a33 * b01) * det,\n            (a20 * b05 - a22 * b02 + a23 * b01) * det,\n            (a10 * b10 - a11 * b08 + a13 * b06) * det,\n            (a01 * b08 - a00 * b10 - a03 * b06) * det,\n            (a30 * b04 - a31 * b02 + a33 * b00) * det,\n            (a21 * b02 - a20 * b04 - a23 * b00) * det,\n            (a11 * b07 - a10 * b09 - a12 * b06) * det,\n            (a00 * b09 - a01 * b07 + a02 * b06) * det,\n            (a31 * b01 - a30 * b03 - a32 * b00) * det,\n            (a20 * b03 - a21 * b01 + a22 * b00) * det\n        );\n        return m;\n    #endif\n}\nmat4 transpose_matrix(mat4 matrix) {\n    #if __VERSION__ == 300\n        return transpose(matrix);\n    #else\n        vec4 vector1 = matrix[0], vector2 = matrix[1], vector3 = matrix[2], vector4 = matrix[3];\n        float a01 = vector1.y, a02 = vector1.z, a03 = vector1.w;\n        float a12 = vector2.z, a13 = vector2.w;\n        float a23 = vector3.w;\n        mat4 m = mat4(\n            vector1.x,\n            vector2.x,\n            vector3.x,\n            vector4.x,\n            a01,\n            vector2.y,\n            vector3.y,\n            vector4.y,\n            a02,\n            a12,\n            vector3.z,\n            vector4.z,\n            a03,\n            a13,\n            a23,\n            vector4.w\n        );\n        return m;\n    #endif\n}",
        get_output: "#include <invert_matrix>\n#ifdef HAS_INSTANCE\n    #include <instance_vert>\n    #ifdef HAS_INSTANCE_COLOR\n        varying vec4 vInstanceColor;\n    #endif\n#endif\n#ifdef HAS_SKIN\n    uniform int skinAnimation;\n    #include <skin_vert>\n#endif\n#ifdef HAS_MORPH\n    attribute vec3 POSITION_0;\n    attribute vec3 POSITION_1;\n    attribute vec3 POSITION_2;\n    attribute vec3 POSITION_3;\n    #ifdef HAS_MORPHNORMALS\n        attribute vec3 NORMAL_0;\n        attribute vec3 NORMAL_1;\n        attribute vec3 NORMAL_2;\n        attribute vec3 NORMAL_3;\n    #endif\n    uniform vec4 morphWeights;\n#endif\nmat4 getPositionMatrix() {\n    mat4 worldMatrix;\n    #ifdef HAS_INSTANCE\n        #ifdef HAS_INSTANCE_COLOR\n            vInstanceColor = instance_getInstanceColor();\n        #endif\n        mat4 attributeMatrix = instance_getAttributeMatrix();\n        #ifdef HAS_SKIN\n            if (skinAnimation == 1) {\n                worldMatrix = attributeMatrix * positionMatrix * skin_getSkinMatrix();\n            } else {\n                worldMatrix = attributeMatrix * positionMatrix;\n            }\n        #else\n            worldMatrix = attributeMatrix * positionMatrix;\n        #endif\n    #else\n        #ifdef HAS_SKIN\n            if (skinAnimation == 1) {\n                worldMatrix = skin_getSkinMatrix() * positionMatrix;\n            } else {\n                worldMatrix = positionMatrix;\n            }\n        #else\n            worldMatrix = positionMatrix;\n        #endif\n    #endif\n    return worldMatrix;\n}\nvec4 getPosition(vec3 position) {\n    #ifdef HAS_MORPH\n        vec4 POSITION = vec4(position + morphWeights.x * POSITION_0 + morphWeights.y * POSITION_1 + morphWeights.z * POSITION_2 + morphWeights.w * POSITION_3, 1.0);\n   #else\n        vec4 POSITION = vec4(position, 1.0);\n    #endif\n    return POSITION;\n}\nmat4 getNormalMatrix(mat4 worldMatrix) {\n    mat4 inverseMat = invert_matrix(worldMatrix);\n    mat4 normalMat = transpose_matrix(inverseMat);\n    return normalMat;\n}\nvec4 getNormal(vec3 NORMAL) {\n    #ifdef HAS_MORPHNORMALS\n        vec4 normal = vec4(NORMAL + morphWeights.x * NORMAL_0 + morphWeights.y * NORMAL_1 + morphWeights.z * NORMAL_2 + morphWeights.w * NORMAL_3, 1.0);\n    #else\n        vec4 normal = vec4(NORMAL, 1.0);\n    #endif\n    return normal;\n}",
        instance_vert: "attribute vec4 instance_vectorA;\nattribute vec4 instance_vectorB;\nattribute vec4 instance_vectorC;\nattribute vec4 instance_vectorD;\nattribute vec4 instance_color;\nmat4 instance_getAttributeMatrix() {\n    mat4 mat = mat4(\n        instance_vectorA,\n        instance_vectorB,\n        instance_vectorC,\n        instance_vectorD\n    );\n    return mat;\n}\nvec4 instance_getInstanceColor() {\n    return instance_color;\n}",
        skin_vert: "attribute vec4 WEIGHTS_0;\nattribute vec4 JOINTS_0;\nuniform sampler2D jointTexture;\nuniform vec2 jointTextureSize;\nuniform float numJoints;\n#define ROW0_U ((0.5 + 0.0) / 4.)\n#define ROW1_U ((0.5 + 1.0) / 4.)\n#define ROW2_U ((0.5 + 2.0) / 4.)\n#define ROW3_U ((0.5 + 3.0) / 4.)\nmat4 skin_getBoneMatrix(float jointNdx) {\n    float v = (jointNdx + 0.5) / numJoints;\n    return mat4(\n        texture2D(jointTexture, vec2(ROW0_U, v)),\n        texture2D(jointTexture, vec2(ROW1_U, v)),\n        texture2D(jointTexture, vec2(ROW2_U, v)),\n        texture2D(jointTexture, vec2(ROW3_U, v)));\n}\nmat4 skin_getSkinMatrix() {\n        mat4 skinMatrix = skin_getBoneMatrix(JOINTS_0[0]) * WEIGHTS_0[0] +\n                        skin_getBoneMatrix(JOINTS_0[1]) * WEIGHTS_0[1] +\n                        skin_getBoneMatrix(JOINTS_0[2]) * WEIGHTS_0[2] +\n                        skin_getBoneMatrix(JOINTS_0[3]) * WEIGHTS_0[3];\n        return skinMatrix;\n}",
        viewshed_frag: "#ifdef HAS_VIEWSHED\n    uniform sampler2D viewshed_depthMapFromViewpoint;\n    uniform vec4 viewshed_visibleColor;\n    uniform vec4 viewshed_invisibleColor;\n    varying vec4 viewshed_positionFromViewpoint;\nfloat viewshed_unpack(const in vec4 rgbaDepth) {\n    const vec4 bitShift = vec4(1.0, 1.0/256.0, 1.0/(256.0*256.0), 1.0/(256.0*256.0*256.0));\n    float depth = dot(rgbaDepth, bitShift);\n    return depth;\n}\nvec4 viewshed_draw(vec4 color) {\n    vec3 shadowCoord = (viewshed_positionFromViewpoint.xyz / viewshed_positionFromViewpoint.w)/2.0 + 0.5;\n    vec4 rgbaDepth = texture2D(viewshed_depthMapFromViewpoint, shadowCoord.xy);\n    float depth = viewshed_unpack(rgbaDepth);    if (shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0 && shadowCoord.z <= 1.0) {\n        if (shadowCoord.z <= depth + 0.002) {\n            color = viewshed_visibleColor;\n        } else {\n            color = viewshed_invisibleColor;\n        }\n    }\n    return color;\n}\n#endif",
        viewshed_vert: "#ifdef HAS_VIEWSHED\n        uniform mat4 viewshed_projViewMatrixFromViewpoint;\n        varying vec4 viewshed_positionFromViewpoint;\n        void viewshed_getPositionFromViewpoint(vec4 scenePosition) {\n            viewshed_positionFromViewpoint = viewshed_projViewMatrixFromViewpoint * scenePosition;\n        }\n    #endif",
        flood_frag: "#ifdef HAS_FLOODANALYSE\n    varying float flood_height;\n    uniform float flood_waterHeight;\n    uniform vec3 flood_waterColor;\n    vec4 draw_floodAnalyse(vec4 color) {\n        if (flood_height < flood_waterHeight) {\n           color = vec4(mix(flood_waterColor, color.rgb, 0.6), color.a);\n        }\n        return color;\n    }\n#endif",
        flood_vert: "#ifdef HAS_FLOODANALYSE\n    varying float flood_height;\n    void flood_getHeight(vec4 worldPosition) {\n        flood_height = worldPosition.z;\n    }\n#endif",
        heatmap_render_vert: "#ifdef HAS_HEATMAP\nvarying vec2 heatmap_vTexCoord;\nvoid heatmap_compute(mat4 matrix, vec3 position) {\n    vec4 pos = matrix * vec4(position.xy, 0., 1.);\n    heatmap_vTexCoord = (1. + pos.xy / pos.w) / 2.;\n}\n#endif",
        heatmap_render_frag: "#ifdef HAS_HEATMAP\nuniform sampler2D heatmap_inputTexture;\nuniform sampler2D heatmap_colorRamp;\nuniform float heatmap_heatmapOpacity;\nvarying vec2 heatmap_vTexCoord;\nvec4 heatmap_getColor(vec4 color) {\n    float t = texture2D(heatmap_inputTexture, heatmap_vTexCoord).r;\n    vec4 heatmapColor = texture2D(heatmap_colorRamp, vec2(t, 0.5)) * heatmap_heatmapOpacity;\n    return color * (1.0 - heatmapColor.a) + heatmapColor * heatmapColor.a;\n}\n#endif",
        line_extrusion_vert: "#ifdef IS_LINE_EXTRUSION\n    #define ALTITUDE_SCALE 32767.0;\n    #define EXTRUDE_SCALE 63.0;\n    attribute vec2 aExtrude;\n    #ifdef HAS_LINE_WIDTH\n        attribute float aLineWidth;\n    #else\n        uniform float lineWidth;\n    #endif\n    #ifdef HAS_LINE_HEIGHT\n        attribute float aLineHeight;\n    #else\n        uniform float lineHeight;\n    #endif\n    uniform float linePixelScale;\n    vec3 getLineExtrudePosition(vec3 position) {\n        #ifdef HAS_LINE_WIDTH\n            float lineWidth = aLineWidth / 2.0;\n        #endif\n        #ifdef HAS_LINE_HEIGHT\n            float lineHeight = aLineHeight / 10.0;\n        #endif\n        float halfwidth = lineWidth / 2.0;\n        float outset = halfwidth;\n        vec2 dist = outset * aExtrude / EXTRUDE_SCALE;\n        position.z *= lineHeight / ALTITUDE_SCALE;\n        return position + vec3(dist, 0.0) * linePixelScale;\n    }\n#endif",
        fog_render_vert: "#ifdef HAS_FOG\n    varying float vFog_Dist;\n    void fog_getDist(vec4 worldPosition) {\n        vFog_Dist = worldPosition.y;\n    }\n#endif",
        fog_render_frag: "#ifdef HAS_FOG\n    varying float vFog_Dist;\n    uniform vec2 fog_Dist;\n    uniform vec3 fog_Color;\n    vec4 draw_fog(vec4 color) {\n        float fogFactor = clamp((vFog_Dist - fog_Dist.x) / (fog_Dist.y - fog_Dist.x), 0.0, 1.0);\n        vec3 color = mix(fog_Color, gl_FragColor.rgb, fogFactor);\n        color = vec4(color, gl_FragColor.a);\n        return color;\n    }\n#endif",
        gl2_vert: "#if __VERSION__ == 300\n    #define texture2D(tex, uv) texture(tex, uv)\n    #define varying out\n    #define attribute in\n#endif",
        gl2_frag: "#if __VERSION__ == 300\n    #define texture2D(tex, uv) texture(tex, uv)\n    #define varying in\n    out vec4 glFragColor;\n#else\n    vec4 glFragColor;\n#endif",
        hsv_frag: "\nconst mediump vec4 HSV_K0 = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);\nconst mediump vec4 HSV_K1 = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);\nconst mediump float HSV_E = 1.0e-10;\nvec3 hsv_rgb2hsv(vec3 c) {\n    vec4 K = HSV_K0;\n    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));\n    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));\n    float d = q.x - min(q.w, q.y);\n    float e = HSV_E;\n    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);\n}\nvec3 hsv_hsv2rgb(vec3 c) {\n    vec4 K = HSV_K1;\n    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);\n    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);\n}\nvec4 hsv_apply(vec4 c, vec3 hsvOffset) {\n    vec3 hsv = hsv_rgb2hsv(c.rgb);\n    hsv += hsv * hsvOffset;\n    hsv = clamp(hsv, 0.0, 1.0);\n    return vec4(hsv_hsv2rgb(hsv), c.a);\n}\nvec3 hsv_apply(vec3 c, vec3 hsvOffset) {\n    vec3 hsv = hsv_rgb2hsv(c.rgb);\n    hsv += hsv * hsvOffset;\n    hsv = clamp(hsv, 0.0, 1.0);\n    return hsv_hsv2rgb(hsv);\n}"
    }, er = function(e) {
        return nr(e);
    }, tr = /^[ \t]*#include +<([\w\d.]+)>/gm;
    function nr(e) {
        return e.replace(tr, rr);
    }
    function rr(e, t) {
        var n = $n[t];
        if (!n) throw new Error("Can not resolve #include <" + t + ">");
        return nr(n);
    }
    var ir, ar = "function", or = "array", sr = ((ir = ur.prototype).setFramebuffer = function(e) {
        return this.context.framebuffer = e, this;
    }, ir.appendRenderUniforms = function(e) {
        var t = this.context, n = ke(e, t), r = n, i = this.contextDesc;
        for (var a in i) if (i[a] && "array" === i[a].type) {
            var o = a, s = i[a].length, u = t[a];
            if (i[a].fn && (u = i[a].fn(t, n)), !u) continue;
            if (u.length !== s) throw new Error(o + " uniform's length is not " + s);
            r[o] = r[o] || {};
            for (var f = 0; f < s; f++) r[o]["" + f] = u[f];
        }
        return r;
    }, ir.setUniforms = function(e) {
        return this.context = e, this;
    }, ir.getVersion = function(e, t) {
        return "#version" === t.substring(0, 8) ? "" : 0 === e.limits.version.indexOf("WebGL 2.0") && 300 === this.version ? "#version 300 es\n" : "#version 100\n";
    }, ir.getActiveVars = function(e, t, n) {
        var r = e._gl, i = r.createProgram(), a = r.createShader(35633);
        r.shaderSource(a, t), r.compileShader(a);
        var o = r.createShader(35632);
        r.shaderSource(o, n), r.compileShader(o), r.attachShader(i, o), r.attachShader(i, a), 
        r.linkProgram(i);
        for (var s = r.getProgramParameter(i, 35721), u = [], f = 0; f < s; ++f) {
            var c = r.getActiveAttrib(i, f);
            c && u.push({
                name: c.name
            });
        }
        for (var l = r.getProgramParameter(i, 35718), h = [], d = 0; d < l; ++d) {
            var p = r.getActiveUniform(i, d);
            if (0 < p.name.indexOf("[")) for (var v = fr(p.name.replace("[0]", "[" + p.size + "]")), m = v.name, g = v.len, _ = 0; _ < g; _++) h.push(m + "[" + _ + "]"); else h.push(p.name);
        }
        return r.deleteProgram(i), r.deleteShader(a), r.deleteShader(o), {
            activeUniforms: h,
            activeAttributes: u
        };
    }, ir.createREGLCommand = function(r, e, t, n) {
        var i = Qe(r), a = ke({}, this.shaderDefines || {}, e || {}), o = this._insertDefines(this.vert, a), s = this.getVersion(r, o) + o, u = this._insertDefines(this.frag, a), f = this.getVersion(r, u) + u, c = this.getActiveVars(r, s, f), l = c.activeAttributes, h = c.activeUniforms, d = {};
        l.forEach(function(e, t) {
            var n = e.name;
            d[n] = i ? t : r.prop(n);
        });
        var p = {};
        h.forEach(function(e) {
            p[e] = r.prop(e);
        });
        var v = this.contextDesc;
        for (var m in v) if (v[m] && v[m].type === ar) p[m] = v[m].fn; else if (v[m] && v[m].type === or) for (var g = v[m].name, _ = v[m].length, x = 0; x < _; x++) {
            var b = g + "[" + x + "]";
            p[b] = r.prop(b);
        } else p[m] = r.prop(m);
        var y = {
            vert: s,
            frag: f,
            uniforms: p,
            attributes: d
        };
        i && (y.vao = r.prop("vao")), t && !We(t) && (y.elements = r.prop("elements")), 
        y.count = r.prop("count"), y.offset = r.prop("offset"), y.primitive = r.prop("primitive"), 
        y.framebuffer = r.prop("framebuffer"), n && (y.instances = r.prop("instances")), 
        ke(y, this.extraCommandProps);
        var A = r(y);
        return l.key = l.map(function(e) {
            return e.name;
        }).join(), A.activeAttributes = l, A;
    }, ir.dispose = function() {
        for (var e in this.commands) this.commands[e].destroy && this.commands[e].destroy();
        this.commands = {}, delete this.vert, delete this.frag;
    }, ir._insertDefines = function(e, t) {
        var n = [];
        for (var r in t) t.hasOwnProperty(r) && !He(t[r]) && n.push("#define " + r + " " + t[r] + "\n");
        return n.join("") + e;
    }, ir._compileSource = function() {
        this.vert = er(this.vert), this.frag = er(this.frag);
    }, ur);
    function ur(e) {
        var t = e.vert, n = e.frag, r = e.uniforms, i = e.defines, a = e.extraCommandProps;
        this.vert = t, this.frag = n, this.shaderDefines = i && ke({}, i) || {}, r = this.uniforms = r || [], 
        this.contextDesc = {};
        for (var o = 0, s = r.length; o < s; o++) {
            var u = r[o];
            if (qe(u)) if (0 < u.indexOf("[")) {
                var f = fr(u), c = f.name, l = f.len;
                this.contextDesc[c] = {
                    name: c,
                    type: "array",
                    length: l
                };
            } else this.contextDesc[u] = null; else if (0 < u.name.indexOf("[")) {
                var h = fr(u.name), d = h.name, p = h.len;
                this.contextDesc[d] = {
                    name: d,
                    type: "array",
                    length: p,
                    fn: u.fn
                };
            } else this.contextDesc[u.name] = u;
        }
        this.extraCommandProps = a && ke({}, a) || {}, this.commands = {}, this._compileSource();
    }
    function fr(e) {
        var t = e.indexOf("["), n = e.indexOf("]");
        return {
            name: e.substring(0, t),
            len: +e.substring(t + 1, n)
        };
    }
    var cr, lr = function(e) {
        function t() {
            return e.apply(this, arguments) || this;
        }
        o(t, e);
        var n = t.prototype;
        return n.draw = function(e, t) {
            if (!t || !t.length) return this;
            for (var n, r = [], i = 0, a = t.length; i < a; i++) if (t[i].isValid()) if (t[i].geometry.getDrawCount() && this._runFilter(t[i])) {
                var o = this.getMeshCommand(e, t[i]);
                r.length && n !== o && (n(r), r.length = 0);
                var s = t[i].getREGLProps(e, o.activeAttributes);
                this.appendRenderUniforms(s), r.push(s), i < a - 1 ? n = o : i === a - 1 && o(r);
            } else i === a - 1 && n && r.length && n(r); else i === a - 1 && n && r.length && n(r);
            return this;
        }, n._runFilter = function(e) {
            var t = this.filter;
            if (!t) return !0;
            if (Array.isArray(t)) {
                for (var n = 0; n < t.length; n++) if (!t[n](e)) return !1;
                return !0;
            }
            return t(e);
        }, n.getMeshCommand = function(e, t) {
            var n = t.getCommandKey(e), r = this.commands[n];
            if (!r) {
                var i = t.getDefines();
                r = this.commands[n] = this.createREGLCommand(e, i, t.getElements(), t instanceof Tn);
            }
            return r;
        }, t;
    }(sr), hr = (o(dr, cr = lr), dr);
    function dr(e) {
        var t;
        void 0 === e && (e = {});
        var n = e.extraCommandProps || {};
        return n = ke({}, n, {
            blend: {
                enable: !0,
                func: {
                    src: "src alpha",
                    dst: "one minus src alpha"
                },
                equation: "add"
            },
            sample: {
                alpha: !0
            }
        }), (t = cr.call(this, {
            vert: "#include <gl2_vert>\nattribute vec3 aPosition;\nattribute vec3 aBarycentric;\nvarying vec3 vBarycentric;\nuniform mat4 modelMatrix;\nuniform mat4 projViewMatrix;\nuniform mat4 projViewModelMatrix;\nuniform mat4 positionMatrix;\n#include <get_output>\n#include <viewshed_vert>\n#include <flood_vert>\n#include <fog_render_vert>\nvoid main() {\n  mat4 pX = getPositionMatrix();\n  vec4 pY = getPosition(aPosition);\n  gl_Position = projViewMatrix * modelMatrix * pX * pY;\n  vBarycentric = aBarycentric;\n#ifdef HAS_VIEWSHED\nviewshed_getPositionFromViewpoint(modelMatrix * pX * pY);\n#endif\n#ifdef HAS_FLOODANALYSE\nflood_getHeight(modelMatrix * pX * pY);\n#endif\n#ifdef HAS_FOG\nfog_getDist(modelMatrix * pX * pY);\n#endif\n}",
            frag: "#if __VERSION__ == 100\n#ifdef GL_OES_standard_derivatives\n#extension GL_OES_standard_derivatives : enable\n#endif\n#endif\nprecision mediump float;\n#include <gl2_frag>\nvarying vec3 vBarycentric;\nuniform float time;\nuniform float thickness;\nuniform float secondThickness;\nuniform float dashRepeats;\nuniform float dashLength;\nuniform bool dashOverlap;\nuniform bool dashEnabled;\nuniform bool dashAnimate;\nuniform bool seeThrough;\nuniform bool insideAltColor;\nuniform bool dualStroke;\nuniform bool squeeze;\nuniform float squeezeMin;\nuniform float squeezeMax;\nuniform vec4 stroke;\nuniform vec4 fill;\nuniform float opacity;\n#ifdef HAS_INSTANCE\nvarying vec4 vInstanceColor;\n#endif\n#include <viewshed_frag>\n#include <flood_frag>\n#include <fog_render_frag>\nconst float nH = 3.14159265;\nfloat pG(float pH, float pI) {\n  float pJ = fwidth(pI) * .5;\n  return smoothstep(pH - pJ, pH + pJ, pI);\n}\nvec4 pK(vec3 pL) {\n  float pM = min(min(pL.x, pL.y), pL.z);\n  float pN = max(pL.x, pL.y);\n  if(pL.y < pL.x && pL.y < pL.z) {\n    pN = 1. - pN;\n  }\n  float pO = thickness;\n  if(squeeze) {\n    pO *= mix(squeezeMin, squeezeMax, (1. - sin(pN * nH)));\n  }\n  if(dashEnabled) {\n    float pP = 1. / dashRepeats * dashLength / 2.;\n    if(!dashOverlap) {\n      pP += 1. / dashRepeats / 2.;\n    }\n    if(dashAnimate) {\n      pP += time * .22;\n    }\n    float pQ = fract((pN + pP) * dashRepeats);\n    pO *= 1. - pG(dashLength, pQ);\n  }\n  float pR = 1. - pG(pO, pM);\n#ifdef HAS_INSTANCE\nvec4 pS = vInstanceColor;\n#else\nvec4 pS = stroke;\n#endif\nvec4 pT = vec4(.0);\n  if(seeThrough) {\n    pT = vec4(pS.xyz, pR);\n    if(insideAltColor && !gl_FrontFacing) {\n      pT.rgb = fill.xyz;\n    }\n  } else {\n    vec3 pU = mix(fill.xyz, pS.xyz, pR);\n    pT.a = fill.a;\n    if(dualStroke) {\n      float pV = 1. - pG(secondThickness, pM);\n      vec3 pW = mix(fill.xyz, stroke.xyz, abs(pV - pR));\n      pT.rgb = pW;\n    } else {\n      pT.rgb = pU;\n    }\n  }\n  return pT;\n}\nvoid main() {\n  glFragColor = pK(vBarycentric) * opacity;\n#ifdef HAS_VIEWSHED\nglFragColor = viewshed_draw(glFragColor);\n#endif\n#ifdef HAS_FLOODANALYSE\nglFragColor = draw_floodAnalyse(glFragColor);\n#endif\n#ifdef HAS_FOG\nglFragColor = draw_fog(glFragColor);\n#endif\n#if __VERSION__ == 100\ngl_FragColor = glFragColor;\n#endif\n}",
            uniforms: [ {
                name: "projViewModelMatrix",
                type: "function",
                fn: function(e, t) {
                    return Y([], t.projViewMatrix, t.modelMatrix);
                }
            } ],
            extraCommandProps: n
        }) || this).version = 300, t;
    }
    var pr, vr = "precision mediump float;\n#include <gl2_frag>\nuniform vec4 baseColorFactor;\nuniform float materialShininess;\nuniform float opacity;\nuniform float ambientStrength;\nuniform float specularStrength;\nuniform vec3 uLight0_viewDirection;\nuniform vec3 uAmbientColor;\nuniform vec4 uLight0_diffuse;\nuniform vec3 lightSpecular;\nuniform vec3 cameraPosition;\n#ifdef HAS_TOON\nuniform float toons;\nuniform float specularToons;\n#endif\n#ifdef HAS_TANGENT\nvarying vec4 vTangent;\n#endif\n#ifdef HAS_MAP\nvarying vec2 vTexCoord;\n#endif\nvarying vec3 vNormal;\nvarying vec3 vFragPos;\n#ifdef HAS_INSTANCE_COLOR\nvarying vec4 vInstanceColor;\n#endif\n#ifdef HAS_BASECOLOR_MAP\nuniform sampler2D baseColorTexture;\n#endif\n#ifdef HAS_EXTRUSION_OPACITY\nuniform vec2 extrusionOpacityRange;\nvarying float vExtrusionOpacity;\n#endif\n#if defined(HAS_COLOR)\nvarying vec4 vColor;\n#elif defined(IS_LINE_EXTRUSION)\nuniform vec4 lineColor;\n#else\nuniform vec4 polygonFill;\n#endif\n#ifdef IS_LINE_EXTRUSION\nuniform float lineOpacity;\n#else\nuniform float polygonOpacity;\n#endif\n#ifdef HAS_OCCLUSION_MAP\nuniform sampler2D occlusionTexture;\n#endif\n#ifdef HAS_NORMAL_MAP\nuniform sampler2D normalTexture;\n#endif\n#ifdef HAS_EMISSIVE_MAP\nuniform sampler2D emissiveTexture;\n#endif\n#ifdef SHADING_MODEL_SPECULAR_GLOSSINESS\nuniform vec4 diffuseFactor;\nuniform vec3 specularFactor;\n#ifdef HAS_DIFFUSE_MAP\nuniform sampler2D diffuseTexture;\n#endif\n#ifdef HAS_SPECULARGLOSSINESS_MAP\nuniform sampler2D specularGlossinessTexture;\n#endif\n#endif\n#include <viewshed_frag>\n#include <flood_frag>\n#include <heatmap_render_frag>\n#include <fog_render_frag>\nvec3 pZ() {\n  \n#if defined(HAS_NORMAL_MAP)\nvec3 nP = normalize(vNormal);\n  vec3 qa = texture2D(normalTexture, vTexCoord).xyz * 2. - 1.;\n#if defined(HAS_TANGENT)\nvec3 t = normalize(vTangent.xyz);\n  vec3 b = normalize(cross(nP, t) * sign(vTangent.w));\n  mat3 qb = mat3(t, b, nP);\n  return normalize(qb * qa);\n#else\nreturn normalize(qa);\n#endif\n#else\nreturn normalize(vNormal);\n#endif\n}\nvec4 qc(const in vec4 pa) {\n  return vec4(pa.r < .0031308 ? pa.r * 12.92 : 1.055 * pow(pa.r, 1. / 2.4) - .055, pa.g < .0031308 ? pa.g * 12.92 : 1.055 * pow(pa.g, 1. / 2.4) - .055, pa.b < .0031308 ? pa.b * 12.92 : 1.055 * pow(pa.b, 1. / 2.4) - .055, pa.a);\n}\nvec4 qd() {\n  \n#if defined(HAS_BASECOLOR_MAP)\nreturn texture2D(baseColorTexture, vTexCoord);\n#elif defined(HAS_DIFFUSE_MAP)\nreturn texture2D(diffuseTexture, vTexCoord);\n#elif defined(SHADING_MODEL_SPECULAR_GLOSSINESS)\nreturn diffuseFactor;\n#else\nreturn baseColorFactor;\n#endif\n}\nvec3 qe() {\n  \n#if defined(HAS_SPECULARGLOSSINESS_MAP)\nreturn texture2D(specularGlossinessTexture, vTexCoord).rgb;\n#elif defined(SHADING_MODEL_SPECULAR_GLOSSINESS)\nreturn specularFactor;\n#else\nreturn vec3(1.);\n#endif\n}\nvoid main() {\n  vec4 qf = qd();\n  vec3 qg = ambientStrength * uAmbientColor * qf.rgb;\n#ifdef HAS_INSTANCE_COLOR\nqg *= vInstanceColor.rgb;\n#endif\nvec3 qh = pZ();\n  vec3 qi = normalize(-uLight0_viewDirection);\n  float qj = max(dot(qh, qi), .0);\n#ifdef HAS_TOON\nfloat qk = floor(qj * toons);\n  qj = qk / toons;\n#endif\nvec3 ql = uLight0_diffuse.rgb * qj * qf.rgb;\n#if defined(HAS_COLOR)\nvec3 pa = vColor.rgb;\n#elif defined(IS_LINE_EXTRUSION)\nvec3 pa = lineColor.rgb;\n#else\nvec3 pa = polygonFill.rgb;\n#endif\nqg *= pa.rgb;\n  ql *= pa.rgb;\n  vec3 qm = normalize(cameraPosition - vFragPos);\n  vec3 qn = normalize(qi + qm);\n  float qo = pow(max(dot(qh, qn), .0), materialShininess);\n#ifdef HAS_TOON\nfloat qp = floor(qo * specularToons);\n  qo = qp / specularToons;\n#endif\nvec3 pB = specularStrength * lightSpecular * qo * qe();\n#ifdef HAS_OCCLUSION_MAP\nfloat qq = texture2D(occlusionTexture, vTexCoord).r;\n  qg *= qq;\n#endif\nvec3 oi = qg + ql + pB;\n#ifdef HAS_EMISSIVE_MAP\nvec3 qr = texture2D(emissiveTexture, vTexCoord).rgb;\n  oi += qr;\n#endif\nglFragColor = vec4(oi, opacity);\n#if defined(HAS_COLOR)\nfloat qs = vColor.a;\n#elif defined(IS_LINE_EXTRUSION)\nfloat qs = lineColor.a;\n#else\nfloat qs = polygonFill.a;\n#endif\nglFragColor *= qs;\n#ifdef HAS_EXTRUSION_OPACITY\nfloat qt = extrusionOpacityRange.x;\n  float qu = extrusionOpacityRange.y;\n  float qv = qt + vExtrusionOpacity * (qu - qt);\n  qv = clamp(qv, .0, 1.);\n  glFragColor *= qv;\n#endif\n#ifdef HAS_HEATMAP\nglFragColor = heatmap_getColor(glFragColor);\n#endif\n#ifdef HAS_VIEWSHED\nglFragColor = viewshed_draw(glFragColor);\n#endif\n#ifdef HAS_FLOODANALYSE\nglFragColor = draw_floodAnalyse(glFragColor);\n#endif\n#ifdef HAS_FOG\nglFragColor = draw_fog(glFragColor);\n#endif\n#if __VERSION__ == 100\ngl_FragColor = glFragColor;\n#endif\n}", mr = "attribute vec3 aPosition;\n#include <line_extrusion_vert>\n#ifdef HAS_MAP\nuniform vec2 uvScale;\nuniform vec2 uvOffset;\nattribute vec2 aTexCoord;\nvarying vec2 vTexCoord;\n#endif\n#ifdef HAS_COLOR\nattribute vec4 aColor;\nvarying vec4 vColor;\n#endif\n#if defined(HAS_TANGENT)\nattribute vec4 aTangent;\n#else\nattribute vec3 aNormal;\n#endif\nvarying vec3 vFragPos;\nvarying vec3 vNormal;\nuniform mat4 projMatrix;\nuniform mat4 viewModelMatrix;\nuniform mat4 normalMatrix;\nuniform mat4 modelMatrix;\nuniform mat4 positionMatrix;\nuniform vec2 halton;\nuniform vec2 globalTexSize;\nuniform mat4 projViewMatrix;\n#include <get_output>\n#include <viewshed_vert>\n#include <flood_vert>\n#include <heatmap_render_vert>\n#include <fog_render_vert>\n#ifdef HAS_FLOODANALYSE\nvarying float vHeight;\n#endif\n#ifdef HAS_EXTRUSION_OPACITY\nattribute float aExtrusionOpacity;\nvarying float vExtrusionOpacity;\n#endif\n#if defined(HAS_TANGENT)\nvarying vec4 vTangent;\n#endif\nvoid qw(const highp vec4 q, out highp vec3 nP) {\n  nP = vec3(.0, .0, 1.) + vec3(2., -2., -2.) * q.x * q.zwx + vec3(2., 2., -2.) * q.y * q.wzy;\n}\nvoid qw(const highp vec4 q, out highp vec3 nP, out highp vec3 t) {\n  qw(q, nP);\n  t = vec3(1., .0, .0) + vec3(-2., 2., -2.) * q.y * q.yxw + vec3(-2., 2., 2.) * q.z * q.zwx;\n}\nvoid main() {\n  \n#ifdef IS_LINE_EXTRUSION\nvec4 pY = getPosition(getLineExtrudePosition(aPosition));\n#else\nvec4 pY = getPosition(aPosition);\n#endif\nmat4 pX = getPositionMatrix();\n  mat4 qx = getNormalMatrix(pX);\n  vFragPos = vec3(modelMatrix * pX * pY);\n  vec3 qy;\n#if defined(HAS_TANGENT)\nvec3 t;\n  qw(aTangent, qy, t);\n  vTangent = vec4(qx * t, aTangent.w);\n#else\nqy = aNormal;\n#endif\nvec4 qz = getNormal(qy);\n  vNormal = normalize(vec3(qx * qz));\n  mat4 qA = projMatrix;\n  qA[2].xy += halton.xy / globalTexSize.xy;\n  gl_Position = qA * viewModelMatrix * pX * pY;\n#ifdef HAS_MAP\nvTexCoord = (aTexCoord + uvOffset) * uvScale;\n#endif\n#ifdef HAS_EXTRUSION_OPACITY\nvExtrusionOpacity = aExtrusionOpacity;\n#endif\n#ifdef HAS_COLOR\nvColor = aColor / 255.;\n#endif\n#ifdef HAS_VIEWSHED\nviewshed_getPositionFromViewpoint(modelMatrix * pX * pY);\n#endif\n#ifdef HAS_FLOODANALYSE\nflood_getHeight(modelMatrix * pX * pY);\n#endif\n#ifdef HAS_HEATMAP\nheatmap_compute(projMatrix * viewModelMatrix * pX, pY);\n#endif\n#ifdef HAS_FOG\nfog_getDist(modelMatrix * pX * pY);\n#endif\n}", gr = (o(_r, pr = lr), 
    _r);
    function _r(e) {
        return void 0 === e && (e = {}), pr.call(this, {
            vert: mr,
            frag: vr,
            uniforms: [ {
                name: "normalMatrix",
                type: "function",
                fn: function(e, t) {
                    var n = [];
                    return x(n, t.modelMatrix), h(n, n), n;
                }
            }, {
                name: "viewModelMatrix",
                type: "function",
                fn: function(e, t) {
                    return Y([], t.viewMatrix, t.modelMatrix);
                }
            } ],
            defines: e.defines || {},
            extraCommandProps: e.extraCommandProps || {}
        }) || this;
    }
    var xr, br = (o(yr, xr = gr), yr);
    function yr(e) {
        return void 0 === e && (e = {}), xr.call(this, {
            vert: mr,
            frag: vr,
            defines: e.defines || {},
            extraCommandProps: e.extraCommandProps || {}
        }) || this;
    }
    var Ar, Tr = "#if __VERSION__ == 300\n#define attribute in\n#define varying out\n#endif\nattribute vec2 aPosition;\nattribute vec2 aTexCoord;\nvarying vec2 vTexCoord;\nvoid main() {\n  gl_Position = vec4(aPosition, 0., 1.);\n  vTexCoord = aTexCoord;\n}", Er = new Int8Array([ -1, 1, -1, -1, 1, 1, 1, 1, -1, -1, 1, -1 ]), Mr = new Uint8Array([ 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0 ]), Sr = function(t) {
        function e(e) {
            return e.vert = e.vert || Tr, e.extraCommandProps = e.extraCommandProps || {}, e.extraCommandProps.depth || (e.extraCommandProps.depth = {
                enable: !1,
                mask: !1
            }), e.extraCommandProps.stencil || (e.extraCommandProps.stencil = {
                enable: !1
            }), t.call(this, e) || this;
        }
        o(e, t);
        var n = e.prototype;
        return n.draw = function(e) {
            return this._quadMesh || this._createQuadMesh(e), t.prototype.draw.call(this, e, this._quadMesh);
        }, n.getMeshCommand = function(e) {
            return this.commands.quad || (this.commands.quad = this.createREGLCommand(e, null, this._quadMesh[0].getElements())), 
            this.commands.quad;
        }, n._createQuadMesh = function(e) {
            var t = new It({
                aPosition: Er,
                aTexCoord: Mr
            }, null, Er.length / 2, {
                positionSize: 2,
                primitive: "triangles"
            });
            t.generateBuffers(e), this._quadMesh = [ new fn(t) ];
        }, n.dispose = function() {
            if (this._quadMesh) {
                var e = this._quadMesh[0];
                e.geometry.dispose(), e.dispose();
            }
            return delete this._quadMesh, t.prototype.dispose.call(this);
        }, e;
    }(lr), wr = (o(Rr, Ar = Sr), Rr.prototype.getMeshCommand = function(e, t) {
        return this.commands.fxaa || (this.commands.fxaa = this.createREGLCommand(e, null, t.getElements())), 
        this.commands.fxaa;
    }, Rr);
    function Rr() {
        return Ar.call(this, {
            vert: Tr,
            frag: "#define SHADER_NAME FXAA\n#define FXAA_REDUCE_MIN   (1.0/ 128.0)\n#define FXAA_REDUCE_MUL   (1.0 / 8.0)\n#define FXAA_SPAN_MAX     8.0\nprecision mediump float;\nvarying vec2 vTexCoord;\nuniform float enableFXAA;\nuniform float enableToneMapping;\nuniform float enableSharpen;\nuniform vec2 resolution;\nuniform sampler2D textureSource;\nuniform sampler2D noAaTextureSource;\nuniform float pixelRatio;\nuniform float sharpFactor;\nuniform sampler2D textureOutline;\nuniform float enableOutline;\nuniform float highlightFactor;\nuniform float outlineFactor;\nuniform float outlineWidth;\nuniform vec3 outlineColor;\nvec2 re;\nvec2 sn;\nvec2 so;\nvec4 sp(vec2 qC, sampler2D rX) {\n  vec4 pa;\n  mediump vec2 sq = vec2(1. / resolution.x, 1. / resolution.y);\n  vec3 sr = texture2D(rX, (qC + vec2(-1., -1.)) * sq).xyz;\n  vec3 ss = texture2D(rX, (qC + vec2(1., -1.)) * sq).xyz;\n  vec3 st = texture2D(rX, (qC + vec2(-1., 1.)) * sq).xyz;\n  vec3 su = texture2D(rX, (qC + vec2(1.)) * sq).xyz;\n  vec4 sv = texture2D(rX, qC * sq);\n  vec3 sw = sv.xyz;\n  vec3 sx = vec3(.299, .587, .114);\n  float sy = dot(sr, sx);\n  float sz = dot(ss, sx);\n  float sA = dot(st, sx);\n  float sB = dot(su, sx);\n  float sC = dot(sw, sx);\n  float sD = min(sC, min(min(sy, sz), min(sA, sB)));\n  float sE = max(sC, max(max(sy, sz), max(sA, sB)));\n  mediump vec2 sb;\n  sb.x = -((sy + sz) - (sA + sB));\n  sb.y = (sy + sA) - (sz + sB);\n  float sF = max((sy + sz + sA + sB) * (.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);\n  float sG = 1. / (min(abs(sb.x), abs(sb.y)) + sF);\n  sb = min(vec2(FXAA_SPAN_MAX), max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX), sb * sG)) * sq;\n  vec4 sH = .5 * (texture2D(rX, qC * sq + sb * (1. / 3. - .5)) + texture2D(rX, qC * sq + sb * (2. / 3. - .5)));\n  vec4 sI = sH * .5 + .25 * (texture2D(rX, qC * sq + sb * -.5) + texture2D(rX, qC * sq + sb * .5));\n  float sJ = dot(sI.xyz, sx);\n  if(sJ < sD || sJ > sE)\n    pa = sH;\n  else\n    pa = sI;\n  return pa;\n}\nvec3 sK(const in vec3 pa, const float sL) {\n  vec2 sM = pixelRatio / sn.xy;\n  float sN = .0;\n  vec4 sr = texture2D(textureSource, re + sM * vec2(-1., -1.));\n  sr.rgb = mix(vec3(.0), sr.rgb, sign(sr.a));\n  sN += mix(.0, 1., sign(sr.a));\n  vec4 su = texture2D(textureSource, re + sM * vec2(1.));\n  su.rgb = mix(vec3(.0), su.rgb, sign(su.a));\n  sN += mix(.0, 1., sign(su.a));\n  vec4 ss = texture2D(textureSource, re + sM * vec2(1., -1.));\n  ss.rgb = mix(vec3(.0), ss.rgb, sign(ss.a));\n  sN += mix(.0, 1., sign(ss.a));\n  vec4 st = texture2D(textureSource, re + sM * vec2(-1., 1.));\n  st.rgb = mix(vec3(.0), st.rgb, sign(st.a));\n  sN += mix(.0, 1., sign(st.a));\n  return pa + sL * (sN * pa - sr.rgb - ss.rgb - st.rgb - su.rgb);\n}\nvec4 sO(const in vec4 pa) {\n  return vec4(sK(pa.rgb, sharpFactor), pa.a);\n}\nvec3 sP(const vec3 x) {\n  const float a = 2.51;\n  const float b = .03;\n  const float rc = 2.43;\n  const float pM = .59;\n  const float sQ = .14;\n  return (x * (a * x + b)) / (x * (rc * x + pM) + sQ);\n}\nvec3 sR(vec3 pa) {\n  pa = pa / (pa + vec3(1.));\n  return pa = pow(pa, vec3(1. / 2.2));\n}\nvec4 sS() {\n  float sT = 2.;\n  float sU = 1.;\n  float sV = pixelRatio / resolution[0] * outlineWidth;\n  float sW = pixelRatio / resolution[1] * outlineWidth;\n  vec4 sX = (texture2D(textureOutline, re + vec2(sV, sW)));\n  vec4 sY = (texture2D(textureOutline, re + vec2(sV, .0)));\n  vec4 sZ = (texture2D(textureOutline, re + vec2(sV, -sW)));\n  vec4 ta = (texture2D(textureOutline, re + vec2(.0, -sW)));\n  vec4 tb = (texture2D(textureOutline, re + vec2(-sV, -sW)));\n  vec4 tc = (texture2D(textureOutline, re + vec2(-sV, .0)));\n  vec4 td = (texture2D(textureOutline, re + vec2(-sV, sW)));\n  vec4 te = (texture2D(textureOutline, re + vec2(.0, sW)));\n  vec4 tf = -sT * tc + sT * sY + -sU * td + sU * sX + -sU * tb + sU * sZ;\n  vec4 tg = -sT * ta + sT * te + -sU * tb + sU * td + -sU * sZ + sU * sX;\n  float th = sqrt(dot(tg, tg) + dot(tf, tf));\n  bool ti = th < 1. / 65025.;\n  vec3 tj = (texture2D(textureOutline, re)).r * outlineColor;\n  if(tj == vec3(.0) || (highlightFactor == .0 && ti)) {\n    return vec4(.0);\n  }\n  float tk = ti ? highlightFactor : min(1., sqrt(th) * outlineFactor);\n  return tk * vec4(tj, 1.);\n}\nvec4 tl(const in vec4 pa) {\n  vec4 sS = sS();\n  return sS + vec4(pa) * (1. - sS.a);\n}\nvoid main() {\n  sn = resolution;\n  so = vec2(1.);\n  re = vTexCoord;\n  vec4 pa;\n  if(enableFXAA == 1.) {\n    pa = sp(re * resolution, textureSource);\n  } else {\n    pa = texture2D(textureSource, vTexCoord);\n  }\n  if(enableSharpen == 1.) {\n    pa = sO(pa);\n  }\n  vec4 tm = texture2D(noAaTextureSource, vTexCoord);\n  pa = tm + pa * (1. - tm.a);\n  if(enableToneMapping == 1.) {\n    pa.rgb = sR(pa.rgb);\n  }\n  if(enableOutline == 1.) {\n    pa = tl(pa);\n  }\n  gl_FragColor = pa;\n}",
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width: function(e, t) {
                        return t.resolution[0];
                    },
                    height: function(e, t) {
                        return t.resolution[1];
                    }
                }
            }
        }) || this;
    }
    var Or, Cr = (o(Br, Or = Sr), Br.prototype.getMeshCommand = function(e, t) {
        var n = "box_blur_" + this._blurOffset;
        return this.commands[n] || (this.commands[n] = this.createREGLCommand(e, null, t.getElements())), 
        this.commands[n];
    }, Br);
    function Br(e) {
        var t, n = e.blurOffset;
        return (t = Or.call(this, {
            vert: Tr,
            frag: "precision highp float;\nvarying vec2 vTexCoord;\nuniform sampler2D textureSource;\nuniform vec2 resolution;\nuniform float ignoreTransparent;\nvoid main() {\n  vec4 rc = vec4(.0);\n  float oh = .0;\n  for(int x = -BOXBLUR_OFFSET; x <= BOXBLUR_OFFSET; ++x)\n    for(int y = -BOXBLUR_OFFSET; y <= BOXBLUR_OFFSET; ++y) {\n      vec2 nU = vTexCoord.st + vec2(float(x) / resolution.x, float(y) / resolution.y);\n      nU = clamp(nU, .0, 1.);\n      vec4 rd = texture2D(textureSource, nU);\n      float qI;\n      if(ignoreTransparent == 1.) {\n        qI = sign(rd.a);\n      } else {\n        qI = 1.;\n      }\n      oh += qI;\n      rc += qI * rd;\n    }\n  gl_FragColor = rc / max(oh, 1.) * clamp(sign(oh - 1.), .0, 1.);\n}",
            defines: {
                BOXBLUR_OFFSET: n || 2
            },
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width: function(e, t) {
                        return t.resolution[0];
                    },
                    height: function(e, t) {
                        return t.resolution[1];
                    }
                }
            }
        }) || this)._blurOffset = n || 2, t;
    }
    var Fr, Pr = (o(Ir, Fr = Sr), Ir.prototype.getMeshCommand = function(e, t) {
        return this.commands.ssao_blur || (this.commands.ssao_blur = this.createREGLCommand(e, null, t.getElements())), 
        this.commands.ssao_blur;
    }, Ir);
    function Ir() {
        return Fr.call(this, {
            vert: Tr,
            frag: "precision mediump float;\n#define SHADER_NAME SSAO_BLUR\nstruct MaterialParams {\n  float farPlaneOverEdgeDistance;\n  vec2 axis;\n  vec2 resolution;\n};\nuniform sampler2D materialParams_ssao;\nuniform sampler2D TextureInput;\nuniform MaterialParams materialParams;\nvarying vec2 vTexCoord;\nconst int vI = 6;\nfloat vJ[8];\nvoid vK() {\n  vJ[0] = .099736;\n  vJ[1] = .096667;\n  vJ[2] = .088016;\n  vJ[3] = .075284;\n  vJ[4] = .060493;\n  vJ[5] = .045662;\n}\nfloat vL(vec2 rS) {\n  return (rS.x * (256. / 257.) + rS.y * (1. / 257.));\n}\nfloat vM(in float rS, in float vN) {\n  float qj = (vN - rS) * materialParams.farPlaneOverEdgeDistance;\n  return max(.0, 1. - qj * qj);\n}\nvoid tap(inout float vO, inout float tX, float oh, float rS, vec2 vP) {\n  vec3 vQ = texture2D(materialParams_ssao, vP).rgb;\n  float vR = vM(rS, vL(vQ.gb));\n  vR *= oh;\n  vO += vQ.r * vR;\n  tX += vR;\n}\nvoid main() {\n  vK();\n  highp vec2 nU = vTexCoord;\n  vec3 vQ = texture2D(materialParams_ssao, nU).rgb;\n  if(vQ.g * vQ.b == 1.) {\n    if(materialParams.axis.y > .0) {\n      vec4 pa = texture2D(TextureInput, nU);\n      gl_FragColor = pa;\n    } else {\n      gl_FragColor = vec4(vQ, 1.);\n    }\n    return;\n  }\n  float rS = vL(vQ.gb);\n  float tX = vJ[0];\n  float vO = vQ.r * tX;\n  vec2 vS = materialParams.axis / materialParams.resolution;\n  vec2 pP = vS;\n  for(int tY = 1; tY < vI; tY++) {\n    float oh = vJ[tY];\n    tap(vO, tX, oh, rS, nU + pP);\n    tap(vO, tX, oh, rS, nU - pP);\n    pP += vS;\n  }\n  float vT = vO * (1. / tX);\n  vec2 gb = vQ.gb;\n  if(materialParams.axis.y > .0) {\n    vec4 pa = texture2D(TextureInput, nU);\n    gl_FragColor = vec4(pa.rgb * vT, pa.a);\n  } else {\n    gl_FragColor = vec4(vT, gb, 1.);\n  }\n}",
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width: function(e, t) {
                        return t.outputSize[0];
                    },
                    height: function(e, t) {
                        return t.outputSize[1];
                    }
                }
            }
        }) || this;
    }
    var Dr, Nr = [ [ -2e-6, 0, 2e-6 ], [ -.095089, .004589, -.031253 ], [ .01518, -.025586, .003765 ], [ .073426, .021802, .002778 ], [ .094587, .043218, .089148 ], [ -.009509, .051369, .019673 ], [ .139973, -.101685, .10857 ], [ -.103804, .219853, -.043016 ], [ .004841, -.033988, .094187 ], [ .028011, .058466, -.25711 ], [ -.051031, .074993, .259843 ], [ .118822, -.186537, -.134192 ], [ .063949, -.094894, -.072683 ], [ .108176, .327108, -.254058 ], [ -.04718, .21918, .263895 ], [ -.407709, .240834, -.200352 ] ], Lr = (o(Ur, Dr = Sr), 
    Ur.prototype.getMeshCommand = function(e, t) {
        return this.commands.ssao_extract || (this.commands.ssao_extract = this.createREGLCommand(e, null, t.getElements())), 
        this.commands.ssao_extract;
    }, Ur);
    function Ur() {
        var e;
        return (e = Dr.call(this, {
            vert: Tr,
            frag: "#if __VERSION__ == 100\n#if defined(GL_OES_standard_derivatives)\n#extension GL_OES_standard_derivatives : enable\n#endif\n#endif\nprecision highp float;\n#include <gl2_frag>\nvarying vec2 vTexCoord;\n#define saturate(x)        clamp(x, 0.0, 1.0)\n#define SHADER_NAME SSAO_EXTRACT\n#define PI 3.14159265359\nconst float vU = .0625;\nstruct MaterialParams {\n  mat4 projMatrix;\n  mat4 invProjMatrix;\n  vec4 resolution;\n  float radius;\n  float bias;\n  float power;\n  float invFarPlane;\n};\nuniform MaterialParams materialParams;\nuniform sampler2D materialParams_depth;\n#define NOISE_NONE      0\n#define NOISE_PATTERN   1\n#define NOISE_RANDOM    2\n#define NOISE_TYPE      NOISE_PATTERN\nconst int vV = 16;\nuniform vec3 kSphereSamples[16];\nvec3 vW(const int x) {\n  if(x == 0) {\n    return vec3(-.078247, -.749924, -.656880);\n  } else if(x == 1) {\n    return vec3(-.572319, -.102379, -.813615);\n  } else if(x == 2) {\n    return vec3(.048653, -.380791, .923380);\n  } else if(x == 3) {\n    return vec3(.281202, -.656664, -.699799);\n  } else if(x == 4) {\n    return vec3(.711911, -.235841, -.661485);\n  } else if(x == 5) {\n    return vec3(-.445893, .611063, .654050);\n  } else if(x == 6) {\n    return vec3(-.703598, .674837, .222587);\n  } else if(x == 7) {\n    return vec3(.768236, .507457, .390257);\n  } else if(x == 8) {\n    return vec3(-.670286, -.470387, .573980);\n  } else if(x == 9) {\n    return vec3(.199235, .849336, -.488808);\n  } else if(x == 10) {\n    return vec3(-.768068, -.583633, -.263520);\n  } else if(x == 11) {\n    return vec3(-.897330, .328853, .294372);\n  } else if(x == 12) {\n    return vec3(-.570930, -.531056, -.626114);\n  } else if(x == 13) {\n    return vec3(.699014, .063283, -.712303);\n  } else if(x == 14) {\n    return vec3(.207495, .976129, -.064172);\n  } else if(x == 15) {\n    return vec3(-.060901, -.869738, -.489742);\n  } else {\n    return vec3(.0);\n  }\n  \n  \n  \n  \n  \n  \n  \n  \n  \n  \n  \n  \n  \n  \n  \n}\nvec2 rR(highp float rS) {\n  highp float z = clamp(rS * materialParams.invFarPlane, .0, 1.);\n  highp float t = floor(256. * z);\n  mediump float vX = t * (1. / 256.);\n  mediump float vY = 256. * z - t;\n  return vec2(vX, vY);\n}\nfloat vZ(highp vec2 nP) {\n  nP = fract(nP * vec2(5.3987, 5.4421));\n  nP += dot(nP.yx, nP.xy + vec2(21.5351, 14.3137));\n  highp float xy = nP.x * nP.y;\n  return fract(xy * 95.4307) + fract(xy * 75.04961) * .5;\n}\nvec3 wa(const vec2 nU) {\n  \n#if NOISE_TYPE == NOISE_RANDOM\nreturn normalize(2. * vec3(vZ(nU), vZ(nU * 2.), vZ(nU * 4.)) - vec3(1.));\n#elif NOISE_TYPE == NOISE_PATTERN\nvec2 xy = floor(gl_FragCoord.xy);\n  float wb = mod(xy.x, 4.);\n  float wc = mod(xy.y, 4.);\n  return vW(int(wb + wc * 4.));\n#else\nreturn vec3(.0);\n#endif\n}\nhighp mat4 wd() {\n  return materialParams.projMatrix;\n}\nhighp mat4 we() {\n  return materialParams.invProjMatrix;\n}\nhighp float uG(highp float rS) {\n  highp mat4 uH = wd();\n  highp float z = rS * 2. - 1.;\n  return -uH[3].z / (z + uH[2].z);\n}\nhighp float wf(const vec2 nU) {\n  return uG(texture2D(materialParams_depth, nU).r);\n}\nhighp vec3 wg(in vec2 p, highp float wh) {\n  p = p * 2. - 1.;\n  highp mat4 wi = we();\n  p.x *= wi[0].x;\n  p.y *= wi[1].y;\n  return vec3(p * -wh, wh);\n}\nhighp vec3 wj(const highp vec3 vP) {\n  highp vec3 wk = dFdx(vP);\n  highp vec3 wl = dFdy(vP);\n  return cross(wk, wl);\n}\nhighp vec3 wj(const highp vec3 vP, const vec2 nU) {\n  vec2 wm = nU + vec2(materialParams.resolution.z, .0);\n  vec2 wn = nU + vec2(.0, materialParams.resolution.w);\n  highp vec3 px = wg(wm, wf(wm));\n  highp vec3 py = wg(wn, wf(wn));\n  highp vec3 wk = px - vP;\n  highp vec3 wl = py - vP;\n  return cross(wk, wl);\n}\nfloat wo(const highp vec3 nN, const vec3 qa, const vec3 wp, const vec3 wq) {\n  highp mat4 uH = wd();\n  float wr = materialParams.radius;\n  float ws = materialParams.bias;\n  vec3 r = wq * wr;\n  r = reflect(r, wp);\n  r = sign(dot(r, qa)) * r;\n  highp vec3 wt = nN + r;\n  highp vec4 wu = uH * vec4(wt, 1.);\n  wu.xy = wu.xy * (.5 / wu.w) + .5;\n  highp float wv = wf(wu.xy);\n  float t = saturate(wr / abs(nN.z - wv));\n  float ww = t * t * (3. - 2. * t);\n  float pM = nN.z - wv;\n  return (pM >= -ws ? .0 : ww);\n}\nvoid main() {\n  highp vec2 nU = vTexCoord;\n  highp float rS = wf(nU);\n  highp vec3 nN = wg(nU, rS);\n  highp vec3 qa = wj(nN, nU);\n  qa = normalize(qa);\n  vec3 wp = wa(nU);\n  float vT = .0;\n  for(int tY = 0; tY < vV; tY++) {\n    vT += wo(nN, qa, wp, kSphereSamples[tY]);\n  }\n  float qq = 1. - vT / float(vV);\n  qq = mix(qq, qq * qq, materialParams.power);\n  vec2 wx = floor(gl_FragCoord.xy);\n  qq += (1. - step(vU, abs(dFdx(nN.z)))) * dFdx(qq) * (.5 - mod(wx.x, 2.));\n  qq += (1. - step(vU, abs(dFdy(nN.z)))) * dFdy(qq) * (.5 - mod(wx.y, 2.));\n  glFragColor = vec4(qq, rR(nN.z), 1.);\n#if __VERSION__ == 100\ngl_FragColor = glFragColor;\n#endif\n}",
            uniforms: [ {
                name: "kSphereSamples",
                type: "array",
                length: 16,
                fn: function() {
                    return Nr;
                }
            } ],
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width: function(e, t) {
                        return t.outputSize[0];
                    },
                    height: function(e, t) {
                        return t.outputSize[1];
                    }
                }
            }
        }) || this).version = 300, e;
    }
    var qr, zr = [], Gr = ((qr = Hr.prototype).render = function(e, t, n) {
        var r = n.width, i = n.height;
        return this._initShaders(), this._extractFBO || this._createTextures(n), this._extract(e, r, i, n), 
        this._blurAndCombine(t, e.cameraFar, r, i);
    }, qr._blurAndCombine = function(e, t, n, r) {
        var i = Math.floor(n / 2), a = Math.floor(r / 2);
        this._blurHTex.width === i && this._blurHTex.height === a || (this._blurHFBO.resize(i, a), 
        this._blurVFBO.resize(n, r));
        var o = [ n, r ], s = [ 1, 0 ];
        return this._renderer.render(this._ssaoBlurShader, {
            TextureInput: e,
            materialParams_ssao: this._extractTex,
            materialParams: {
                axis: s,
                farPlaneOverEdgeDistance: -t / .0625,
                resolution: o
            },
            outputSize: [ i, a ]
        }, null, this._blurHFBO), s[0] = 0, s[1] = 1, this._renderer.render(this._ssaoBlurShader, {
            TextureInput: e,
            materialParams_ssao: this._blurHTex,
            materialParams: {
                axis: s,
                farPlaneOverEdgeDistance: -t / .0625,
                resolution: o
            },
            outputSize: [ n, r ]
        }, null, this._blurVFBO), this._blurVTex;
    }, qr._extract = function(e, t, n, r) {
        var i = Math.floor(t / 2), a = Math.floor(n / 2);
        this._extractFBO.width === i && this._extractFBO.height === a || this._extractFBO.resize(i, a);
        var o = e.projMatrix, s = x(zr, o), u = e.power || 1;
        this._renderer.render(this._ssaoExtractShader, {
            materialParams_depth: r,
            materialParams: {
                projMatrix: o,
                invProjMatrix: s,
                resolution: [ i, a, 1 / i, 1 / a ],
                radius: e.radius,
                bias: e.bias,
                power: u,
                invFarPlane: 1 / -e.cameraFar
            },
            outputSize: [ i, a ]
        }, null, this._extractFBO);
    }, qr._createTextures = function(e) {
        var t = Math.floor(e.width / 2), n = Math.floor(e.height / 2);
        this._extractTex = this._createTex(t, n, "uint8"), this._extractFBO = this._createFBO(this._extractTex), 
        this._blurHTex = this._createTex(t, n, "uint8"), this._blurHFBO = this._createFBO(this._blurHTex), 
        this._blurVTex = this._createTex(e.width, e.height, "uint8"), this._blurVFBO = this._createFBO(this._blurVTex);
    }, qr._createTex = function(e, t, n) {
        return this._renderer.regl.texture({
            min: "linear",
            mag: "linear",
            wrap: "clamp",
            type: n,
            width: e,
            height: t
        });
    }, qr._createFBO = function(e) {
        return this._renderer.regl.framebuffer({
            width: e.width,
            height: e.height,
            colors: [ e ],
            depth: !1,
            stencil: !1
        });
    }, qr.dispose = function() {
        this._extractFBO && (this._extractFBO.destroy(), delete this._extractFBO, this._blurVFBO.destroy(), 
        this._blurHFBO.destroy(), this._ssaoExtractShader.dispose(), this._ssaoBlurShader.dispose(), 
        delete this._ssaoExtractShader);
    }, qr._initShaders = function() {
        this._ssaoExtractShader || (this._ssaoExtractShader = new Lr(), this._ssaoBlurShader = new Pr());
    }, Hr);
    function Hr(e) {
        this._renderer = e;
    }
    var Vr, kr = (o(jr, Vr = Sr), jr.prototype.getMeshCommand = function(e, t) {
        return this.commands.postprocess || (this.commands.postprocess = this.createREGLCommand(e, null, t.getElements())), 
        this.commands.postprocess;
    }, jr);
    function jr() {
        return Vr.call(this, {
            vert: Tr,
            frag: "precision mediump float;\nvarying vec2 vTexCoord;\nuniform vec2 resolution;\nuniform sampler2D textureSource;\nuniform float enableVignette;\nuniform float enableGrain;\nuniform float enableLut;\nuniform float timeGrain;\nuniform float grainFactor;\nuniform vec2 lensRadius;\nuniform float frameMod;\nuniform sampler2D lookupTable;\nfloat qB(const in vec2 qC) {\n  vec3 qD = fract(vec3(qC.xyx) * .1031);\n  qD += dot(qD, qD.yzx + 19.19);\n  return fract((qD.x + qD.y) * qD.z);\n}\nfloat qE() {\n  float qF = qB(gl_FragCoord.xy + 1000.0 * fract(timeGrain));\n  float qG = qF * 2. - 1.;\n  qF = qG * inversesqrt(abs(qG));\n  qF = max(-1., qF);\n  qF = qF - sign(qG) + .5;\n  return (qF + .5) * .5;\n}\nvec4 qH(const in vec4 pa) {\n  float qI = qE();\n  return vec4(mix(pa.rgb, pa.rgb * (pa.rgb + (1. - pa.rgb) * 2. * qI), grainFactor), pa.a);\n}\nfloat qc(const in float pa) {\n  return pa < .0031308 ? pa * 12.92 : 1.055 * pow(pa, 1. / 2.4) - .055;\n}\nvec3 qc(const in vec3 pa) {\n  return vec3(pa.r < .0031308 ? pa.r * 12.92 : 1.055 * pow(pa.r, 1. / 2.4) - .055, pa.g < .0031308 ? pa.g * 12.92 : 1.055 * pow(pa.g, 1. / 2.4) - .055, pa.b < .0031308 ? pa.b * 12.92 : 1.055 * pow(pa.b, 1. / 2.4) - .055);\n}\nvec4 qc(const in vec4 pa) {\n  return vec4(pa.r < .0031308 ? pa.r * 12.92 : 1.055 * pow(pa.r, 1. / 2.4) - .055, pa.g < .0031308 ? pa.g * 12.92 : 1.055 * pow(pa.g, 1. / 2.4) - .055, pa.b < .0031308 ? pa.b * 12.92 : 1.055 * pow(pa.b, 1. / 2.4) - .055, pa.a);\n}\nfloat qJ(const in float pa) {\n  return pa < .04045 ? pa * (1. / 12.92) : pow((pa + .055) * (1. / 1.055), 2.4);\n}\nvec3 qJ(const in vec3 pa) {\n  return vec3(pa.r < .04045 ? pa.r * (1. / 12.92) : pow((pa.r + .055) * (1. / 1.055), 2.4), pa.g < .04045 ? pa.g * (1. / 12.92) : pow((pa.g + .055) * (1. / 1.055), 2.4), pa.b < .04045 ? pa.b * (1. / 12.92) : pow((pa.b + .055) * (1. / 1.055), 2.4));\n}\nvec4 qJ(const in vec4 pa) {\n  return vec4(pa.r < .04045 ? pa.r * (1. / 12.92) : pow((pa.r + .055) * (1. / 1.055), 2.4), pa.g < .04045 ? pa.g * (1. / 12.92) : pow((pa.g + .055) * (1. / 1.055), 2.4), pa.b < .04045 ? pa.b * (1. / 12.92) : pow((pa.b + .055) * (1. / 1.055), 2.4), pa.a);\n}\nfloat qK(const in vec2 qC, const in float qL) {\n  vec3 qM = vec3(.06711056, .00583715, 52.9829189);\n  return fract(qM.z * fract(dot(qC.xy + qL * vec2(47., 17.) * .695, qM.xy)));\n}\nfloat qN() {\n  vec2 qO = lensRadius;\n  qO.y = min(qO.y, qO.x - 1e-4);\n  float qP = qK(gl_FragCoord.xy, frameMod);\n  qP = (qO.x - qO.y) * (qO.x + qO.y) * .07 * (qP - .5);\n  return smoothstep(qO.x, qO.y, qP + distance(vTexCoord, vec2(.5)));\n}\nvec4 qQ(const in vec4 pa) {\n  float qI = qN();\n  return vec4(qc(qJ(pa.rgb) * qI), clamp(pa.a + (1. - qI), .0, 1.));\n}\nvec4 qR(in vec4 qS, in sampler2D qT) {\n  mediump float qU = qS.b * 63.;\n  mediump vec2 qV;\n  qV.y = floor(floor(qU) / 8.);\n  qV.x = floor(qU) - qV.y * 8.;\n  mediump vec2 qW;\n  qW.y = floor(ceil(qU) / 8.);\n  qW.x = ceil(qU) - qW.y * 8.;\n  highp vec2 qX;\n  qX.x = qV.x * .125 + .5 / 512. + (.125 - 1. / 512.) * qS.r;\n  qX.y = qV.y * .125 + .5 / 512. + (.125 - 1. / 512.) * qS.g;\n#ifdef LUT_FLIP_Y\nqX.y = 1. - qX.y;\n#endif\nhighp vec2 qY;\n  qY.x = qW.x * .125 + .5 / 512. + (.125 - 1. / 512.) * qS.r;\n  qY.y = qW.y * .125 + .5 / 512. + (.125 - 1. / 512.) * qS.g;\n#ifdef LUT_FLIP_Y\nqY.y = 1. - qY.y;\n#endif\nlowp vec4 qZ = texture2D(qT, qX);\n  lowp vec4 ra = texture2D(qT, qY);\n  lowp vec4 rb = mix(qZ, ra, fract(qU));\n  return rb;\n}\nvoid main() {\n  vec4 pa = texture2D(textureSource, vTexCoord);\n  if(enableLut == 1.) {\n    pa = qR(pa, lookupTable);\n  }\n  if(enableVignette == 1.) {\n    pa = qQ(pa);\n  }\n  if(enableGrain == 1.) {\n    pa = qH(pa);\n  }\n  gl_FragColor = pa;\n}",
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width: function(e, t) {
                        return t.resolution[0];
                    },
                    height: function(e, t) {
                        return t.resolution[1];
                    }
                }
            }
        }) || this;
    }
    var Wr, Xr = (o(Yr, Wr = Sr), Yr.prototype.getMeshCommand = function(e, t) {
        return this.commands.taa || (this.commands.taa = this.createREGLCommand(e, null, t.getElements())), 
        this.commands.taa;
    }, Yr);
    function Yr() {
        var i = [ [], [] ];
        return Wr.call(this, {
            vert: Tr,
            frag: "precision highp float;\nuniform float uSSAARestart;\nuniform float uTaaEnabled;\nuniform float uClipAABBEnabled;\nuniform mat4 uProjectionMatrix;\nuniform mat4 uTaaCurrentFramePVLeft;\nuniform mat4 uTaaInvViewMatrixLeft;\nuniform mat4 uTaaLastFramePVLeft;\nuniform sampler2D TextureDepth;\nuniform sampler2D TextureInput;\nuniform sampler2D TexturePrevious;\nuniform vec2 uTextureDepthRatio;\nuniform vec2 uTextureDepthSize;\nuniform vec2 uTextureInputRatio;\nuniform vec2 uTextureInputSize;\nuniform vec2 uTextureOutputRatio;\nuniform vec2 uTextureOutputSize;\nuniform vec2 uTexturePreviousRatio;\nuniform vec2 uTexturePreviousSize;\nuniform vec4 uHalton;\nuniform vec4 uTaaCornersCSLeft[2];\n#define SHADER_NAME supersampleTaa\nvec2 re;\nfloat qc(const in float pa) {\n  return pa < .0031308 ? pa * 12.92 : 1.055 * pow(pa, 1. / 2.4) - .055;\n}\nvec3 qc(const in vec3 pa) {\n  return vec3(pa.r < .0031308 ? pa.r * 12.92 : 1.055 * pow(pa.r, 1. / 2.4) - .055, pa.g < .0031308 ? pa.g * 12.92 : 1.055 * pow(pa.g, 1. / 2.4) - .055, pa.b < .0031308 ? pa.b * 12.92 : 1.055 * pow(pa.b, 1. / 2.4) - .055);\n}\nvec4 qc(const in vec4 pa) {\n  return vec4(pa.r < .0031308 ? pa.r * 12.92 : 1.055 * pow(pa.r, 1. / 2.4) - .055, pa.g < .0031308 ? pa.g * 12.92 : 1.055 * pow(pa.g, 1. / 2.4) - .055, pa.b < .0031308 ? pa.b * 12.92 : 1.055 * pow(pa.b, 1. / 2.4) - .055, pa.a);\n}\nfloat qJ(const in float pa) {\n  return pa < .04045 ? pa * (1. / 12.92) : pow((pa + .055) * (1. / 1.055), 2.4);\n}\nvec3 qJ(const in vec3 pa) {\n  return vec3(pa.r < .04045 ? pa.r * (1. / 12.92) : pow((pa.r + .055) * (1. / 1.055), 2.4), pa.g < .04045 ? pa.g * (1. / 12.92) : pow((pa.g + .055) * (1. / 1.055), 2.4), pa.b < .04045 ? pa.b * (1. / 12.92) : pow((pa.b + .055) * (1. / 1.055), 2.4));\n}\nvec4 qJ(const in vec4 pa) {\n  return vec4(pa.r < .04045 ? pa.r * (1. / 12.92) : pow((pa.r + .055) * (1. / 1.055), 2.4), pa.g < .04045 ? pa.g * (1. / 12.92) : pow((pa.g + .055) * (1. / 1.055), 2.4), pa.b < .04045 ? pa.b * (1. / 12.92) : pow((pa.b + .055) * (1. / 1.055), 2.4), pa.a);\n}\nvec3 rk(const in vec4 rgba) {\n  const float rl = 8.;\n  return rgba.rgb * rl * rgba.a;\n}\nconst mat3 rm = mat3(6.0013, -2.7, -1.7995, -1.332, 3.1029, -5.772, .3007, -1.088, 5.6268);\nvec3 rn(const in vec4 ro) {\n  float rp = ro.z * 255. + ro.w;\n  vec3 rq;\n  rq.y = exp2((rp - 127.) / 2.);\n  rq.z = rq.y / ro.y;\n  rq.x = ro.x * rq.z;\n  vec3 rr = rm * rq;\n  return max(rr, .0);\n}\nvec4 rf(const in vec3 pa, const in float rg) {\n  if(rg <= .0)\n    return vec4(pa, 1.);\n  vec4 rh;\n  vec3 ri = pa / rg;\n  rh.a = clamp(max(max(ri.r, ri.g), max(ri.b, 1e-6)), .0, 1.);\n  rh.a = ceil(rh.a * 255.) / 255.;\n  rh.rgb = ri / rh.a;\n  return rh;\n}\nvec3 rj(const in vec4 pa, const in float rg) {\n  if(rg <= .0)\n    return pa.rgb;\n  return rg * pa.rgb * pa.a;\n}\nfloat ux(const in vec3 pa) {\n  const vec3 uw = vec3(.2126, .7152, .0722);\n  return dot(pa, uw);\n}\nint uD(const in vec4 rR) {\n  float uE = floor(rR.b * 255. + .5);\n  float uF = mod(uE, 2.);\n  uF += mod(uE - uF, 4.);\n  return int(uF);\n}\nfloat uG(float rS) {\n  highp mat4 uH = uProjectionMatrix;\n  highp float z = rS * 2. - 1.;\n  return -uH[3].z / (z + uH[2].z);\n}\nfloat uI(const in vec4 rR) {\n  return rR.x;\n}\nfloat uJ(const in vec4 rR) {\n  return rR.a;\n}\nvec3 uK(const in vec2 nU, const in vec4 uL, const in vec4 uM, const in mat4 uN, const in float rS) {\n  vec2 uO = nU;\n  vec4 uP = mix(uL, uM, vec4(uO.x));\n  vec3 uQ = vec3(mix(uP.xy, uP.zw, vec2(uO.y)), 1.) * rS;\n  return (uN * vec4(uQ, 1.)).xyz;\n}\nvec3 uR(in vec2 nU, const in vec2 uS) {\n  float rS = uI(texture2D(TextureDepth, min(nU, 1. - 1e+0 / uTextureInputSize.xy) * uTextureInputRatio));\n  return vec3(nU, rS);\n}\nvec4 uT(const in vec4 uU, const in vec4 uV, const in vec4 pa) {\n  const float uW = .00000001;\n  vec4 uX = .5 * (uV + uU);\n  vec4 uY = .5 * (uV - uU) + uW;\n  vec4 pP = pa - uX;\n  vec4 ts = abs(pP / uY);\n  float t = max(max(ts.r, ts.g), max(ts.b, ts.a));\n  return uX + pP / max(1., t);\n}\nvec4 uZ(const in vec2 uS, const in vec4 va, out vec4 vb, bool sO) {\n  vec2 nU = re;\n  vec4 vc = (texture2D(TextureInput, min(nU + vec2(-uS.x, uS.y), 1. - 1e+0 / uTextureInputSize.xy) * uTextureInputRatio));\n  vec4 t = (texture2D(TextureInput, min(nU + vec2(.0, uS.y), 1. - 1e+0 / uTextureInputSize.xy) * uTextureInputRatio));\n  vec4 tr = (texture2D(TextureInput, min(nU + vec2(uS.x, uS.y), 1. - 1e+0 / uTextureInputSize.xy) * uTextureInputRatio));\n  vec4 vd = (texture2D(TextureInput, min(nU + vec2(-uS.x, .0), 1. - 1e+0 / uTextureInputSize.xy) * uTextureInputRatio));\n  vec4 ve = (texture2D(TextureInput, min(nU + vec2(uS.x, .0), 1. - 1e+0 / uTextureInputSize.xy) * uTextureInputRatio));\n  vec4 vf = (texture2D(TextureInput, min(nU + vec2(-uS.x, -uS.y), 1. - 1e+0 / uTextureInputSize.xy) * uTextureInputRatio));\n  vec4 b = (texture2D(TextureInput, min(nU + vec2(.0, -uS.y), 1. - 1e+0 / uTextureInputSize.xy) * uTextureInputRatio));\n  vec4 br = (texture2D(TextureInput, min(nU + vec2(uS.x, -uS.y), 1. - 1e+0 / uTextureInputSize.xy) * uTextureInputRatio));\n  if(sO) {\n    vec4 vg = 2. * (tr + vf + br + vc) - 2. * vb;\n    vb += (vb - vg * .166667) * 2.718282 * .3;\n    vb = max(vec4(.0), vb);\n  }\n  vec4 vh = min(ve, min(vb, min(vd, min(t, b))));\n  vec4 vi = min(vh, min(vc, min(tr, min(vf, br))));\n  vec4 vj = max(ve, max(vb, max(vd, max(t, b))));\n  vec4 vk = max(vj, max(vc, max(tr, max(vf, br))));\n  vi = .5 * (vi + vh);\n  vk = .5 * (vk + vj);\n  return uT(vi, vk, va);\n}\nvec4 taa(const in vec2 vl, const in vec2 uS) {\n  vec2 nU = re;\n  vec4 vb = (texture2D(TextureInput, min(nU, 1. - 1e+0 / uTextureInputSize.xy) * uTextureInputRatio));\n  vec4 vm = (texture2D(TexturePrevious, min(nU - vl, 1. - 1e+0 / uTexturePreviousSize.xy) * uTexturePreviousRatio));\n  vm = uZ(uS, vm, vb, true);\n  float vn = ux(vb.rgb);\n  float vo = ux(vm.rgb);\n  float qj = abs(vn - vo) / max(vn, max(vo, .2));\n  float vp = 1. - qj;\n  float vq = mix(.88, .97, vp * vp);\n  return mix(vb, vm, vq);\n}\nvec2 vr(const in vec3 vs, const in mat4 vt, const in mat4 vu, const in bool vv) {\n  vec4 vw = vt * vec4(vs, 1.);\n  vec4 vx = vu * vec4(vs, 1.);\n  vec2 vy = vw.xy / vw.w;\n  vec2 vz = vx.xy / vx.w;\n  if(vz.x >= 1. || vz.x <= -1. || vz.x >= 1. || vz.y <= -1.)\n    return vec2(.0);\n  return .5 * (vy - vz);\n}\nvec4 vA() {\n  vec4 vB = (texture2D(TextureInput, min(re, 1. - 1e+0 / uTextureInputSize.xy) * uTextureInputRatio)).rgba;\n  float vC = abs(uHalton.z);\n  if(vC == 1.) {\n    return vB;\n  }\n  vec4 vD = (texture2D(TexturePrevious, (floor(min(re, 1. - 1e+0 / uTexturePreviousSize.xy) * uTexturePreviousSize) + .5) * uTexturePreviousRatio / uTexturePreviousSize, -99999.)).rgba;\n  if(uClipAABBEnabled == 1.) {\n    vec2 uS = vec2(1.) / uTextureInputSize;\n    vD = uZ(uS, vD, vB, false);\n  }\n  float vE = 1. / uHalton.w;\n  return mix(vD, vB, vE);\n}\nvec4 vF(const in mat4 uN, const in mat4 vt, const in mat4 vu, const in vec4 uL, const in vec4 uM) {\n  vec2 nU = re;\n  float vC = abs(uHalton.z);\n  if(vC == 1.) {\n    vec2 uS = vec2(1.) / uTextureInputSize;\n    vec3 vG = uR(nU, uS);\n    if(vG.z >= 1.) {\n      return (texture2D(TextureInput, min(nU - .5 * uHalton.xy * uS, 1. - 1e+0 / uTextureInputSize.xy) * uTextureInputRatio));\n    }\n    float rS = uG(vG.z);\n    vec3 ws = uK(vG.xy, uL, uM, uN, rS);\n    vec2 vl = vr(ws, vt, vu, nU.x >= .5);\n    return taa(vl, uS);\n  }\n  return vA();\n}\nvec4 vH() {\n  if(uTaaEnabled == .0) {\n    return vA();\n  }\n  return vF(uTaaInvViewMatrixLeft, uTaaCurrentFramePVLeft, uTaaLastFramePVLeft, uTaaCornersCSLeft[0], uTaaCornersCSLeft[1]);\n}\nvoid main(void) {\n  re = gl_FragCoord.xy / uTextureOutputSize.xy;\n  vec4 pa = vH();\n  gl_FragColor = pa;\n}",
            uniforms: [ {
                name: "uTaaCornersCSLeft",
                type: "array",
                length: 2,
                fn: function(e, t) {
                    var n = Math.tan(.5 * t.fov), r = t.uTextureOutputSize[0] / t.uTextureOutputSize[1] * n;
                    return ee(i[0], r, n, r, -n), ee(i[1], -r, n, -r, -n), i;
                }
            } ],
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width: function(e, t) {
                        return t.uTextureOutputSize[0];
                    },
                    height: function(e, t) {
                        return t.uTextureOutputSize[1];
                    }
                },
                blend: {
                    enable: !1
                },
                dither: !0
            }
        }) || this;
    }
    var Kr, Jr = [], Qr = ((Kr = Zr.prototype).needToRedraw = function() {
        return this._counter < this._jitter.getSampleCount();
    }, Kr.render = function(e, t, n, r, i, a, o, s, u, f) {
        var c = this._jitter, l = c.getJitter(Jr);
        this._initShaders(), this._createTextures(e), u && (this._counter = 0), this._counter++;
        var h = c.getSampleCount();
        if (this._counter >= h) return this._prevTex;
        this._fbo.width === e.width && this._fbo.height === e.height || this._fbo.resize(e.width, e.height);
        var d = this._outputTex, p = this._prevTex, v = this._uniforms || {
            uTextureDepthSize: [ t.width, t.height ],
            uTextureDepthRatio: [ 1, 1 ],
            uTextureInputRatio: [ 1, 1 ],
            uTextureInputSize: [ e.width, e.height ],
            uTextureOutputRatio: [ 1, 1 ],
            uTextureOutputSize: [ e.width, e.height ],
            uTexturePreviousRatio: [ 1, 1 ],
            uTexturePreviousSize: [ p.width, p.height ],
            uSSAARestart: 0,
            uClipAABBEnabled: 0
        };
        v.uTaaEnabled = +!!f, v.fov = a, v.uProjectionMatrix = n, v.uTaaCurrentFramePVLeft = r, 
        v.uTaaInvViewMatrixLeft = i, v.uTaaLastFramePVLeft = this._prevPvMatrix || r, v.TextureDepth = t, 
        v.TextureInput = e, v.TexturePrevious = p, v.uHalton = ee(this._halton, l[0], l[1], u ? 1 : 2, this._counter), 
        Ne(v.uTextureDepthSize, t.width, t.height), Ne(v.uTextureInputSize, e.width, e.height), 
        Ne(v.uTextureOutputSize, d.width, d.height), Ne(v.uTexturePreviousSize, p.width, p.height), 
        this._renderer.render(this._shader, v, null, this._fbo);
        var m = this._outputTex, g = this._fbo;
        return this._outputTex = this._prevTex, this._fbo = this._prevFbo, this._prevTex = m, 
        this._prevFbo = g, this._prevPvMatrix = r, d;
    }, Kr.dispose = function() {
        this._shader && (this._shader.dispose(), delete this._shader), this._fbo && this._fbo.destroy(), 
        this._prevFbo && this._prevFbo.destroy(), delete this._uniforms;
    }, Kr._createTextures = function(e) {
        if (!this._outputTex) {
            var t = this._renderer.regl;
            this._outputTex = this._createColorTex(e), this._fbo = t.framebuffer({
                width: e.width,
                height: e.height,
                colors: [ this._outputTex ],
                depth: !1,
                stencil: !1
            }), this._prevTex = this._createColorTex(e), this._prevFbo = t.framebuffer({
                width: e.width,
                height: e.height,
                colors: [ this._prevTex ],
                depth: !1,
                stencil: !1
            });
        }
    }, Kr._createColorTex = function(e) {
        var t = this._renderer.regl, n = e.width, r = e.height;
        return t.texture({
            min: "linear",
            mag: "linear",
            type: "uint8",
            width: n,
            height: r
        });
    }, Kr._initShaders = function() {
        this._shader || (this._shader = new Xr());
    }, Zr);
    function Zr(e, t) {
        this._jitter = t, this._renderer = e, this._halton = [], this._counter = 0;
    }
    var $r, ei = [ [ .263385, -.0252475 ], [ -.38545, .054485 ], [ -.139795, -.5379925 ], [ -.2793775, .6875475 ], [ .7139025, .4710925 ], [ .90044, -.16422 ], [ .4481775, -.82799 ], [ -.9253375, -.2910625 ], [ .3468025, 1.02292 ], [ -1.13742, .33522 ], [ -.7676225, -.9123175 ], [ -.2005775, -1.1774125 ], [ -.926525, .96876 ], [ 1.12909, -.7500325 ], [ .9603, 1.14625 ] ], ti = ei.length, ni = (($r = ri.prototype).getRatio = function() {
        return this._ratio;
    }, $r.setRatio = function(e) {
        this._ratio !== e && (this._ratio = e, this.reset());
    }, $r.reset = function() {
        this._frameNum = 0;
    }, $r.getJitter = function(e) {
        var t = this._frameNum % ti, n = this._ratio;
        return Ne(e, ei[t][0] * n, ei[t][1] * n), e;
    }, $r.frame = function() {
        this._frameNum++, this._frameNum % ti == 0 && (this._frameNum = 0);
    }, $r.getSampleCount = function() {
        return ti;
    }, ri);
    function ri(e) {
        this._frameNum = 0, this._ratio = e || .05;
    }
    var ii, ai = ((ii = oi.prototype).render = function(e, t) {
        this._initShaders(), this._createTextures(e), this._blur(e, t || 0);
        var n = {
            blurTex0: this._blur01Tex,
            blurTex1: this._blur11Tex,
            blurTex2: this._blur21Tex,
            blurTex3: this._blur31Tex,
            blurTex4: this._blur41Tex
        };
        return 5 < this._level && (n.blurTex5 = this._blur51Tex, n.blurTex6 = this._blur61Tex), 
        n;
    }, ii._blur = function(e, t) {
        var n = this._blurUniforms;
        Ne((n = n || (this._blurUniforms = {
            uRGBMRange: 7,
            uBlurDir: [ 0, 0 ],
            uGlobalTexSize: [ 0, 0 ],
            uPixelRatio: [ 1, 1 ],
            uTextureOutputSize: [ 0, 0 ]
        })).uGlobalTexSize, e.width, e.height), this._blurOnce(this._blur0Shader, e, this._blur00FBO, this._blur01FBO, .5, t), 
        this._blurOnce(this._blur1Shader, this._blur01FBO.color[0], this._blur10FBO, this._blur11FBO, .5), 
        this._blurOnce(this._blur2Shader, this._blur11FBO.color[0], this._blur20FBO, this._blur21FBO, .5), 
        this._blurOnce(this._blur3Shader, this._blur21FBO.color[0], this._blur30FBO, this._blur31FBO, .5), 
        this._blurOnce(this._blur4Shader, this._blur31FBO.color[0], this._blur40FBO, this._blur41FBO, .5), 
        5 < this._level && (this._blurOnce(this._blur5Shader, this._blur41FBO.color[0], this._blur50FBO, this._blur51FBO, .5), 
        this._blurOnce(this._blur6Shader, this._blur51FBO.color[0], this._blur60FBO, this._blur51FBO, .5));
    }, ii._blurOnce = function(e, t, n, r, i, a) {
        var o = Math.ceil(i * t.width), s = Math.ceil(i * t.height);
        n.width === o && n.height === s || n.resize(o, s), r.width === o && r.height === s || r.resize(o, s);
        var u = this._blurUniforms;
        u.uLuminThreshold = a, u.TextureBlurInput = t, u.inputRGBM = +this._inputRGBM, Ne(u.uBlurDir, 0, 1), 
        Ne(u.uTextureOutputSize, n.width, n.height), this._renderer.render(e, u, null, n), 
        u.uLuminThreshold = 0, u.inputRGBM = 1, Ne(u.uBlurDir, 1, 0), u.TextureBlurInput = n.color[0], 
        this._renderer.render(e, u, null, r);
    }, ii.dispose = function() {
        this._blur0Shader && (this._blur0Shader.dispose(), delete this._blur0Shader, this._blur1Shader.dispose(), 
        this._blur2Shader.dispose(), this._blur3Shader.dispose(), this._blur4Shader.dispose(), 
        this._blur5Shader && (this._blur5Shader.dispose(), this._blur6Shader.dispose(), 
        delete this._blur5Shader)), this._blur00Tex && (delete this._blur00Tex, this._blur00FBO.destroy(), 
        this._blur01FBO.destroy(), this._blur10FBO.destroy(), this._blur11FBO.destroy(), 
        this._blur20FBO.destroy(), this._blur21FBO.destroy(), this._blur30FBO.destroy(), 
        this._blur31FBO.destroy(), this._blur40FBO.destroy(), this._blur41FBO.destroy(), 
        this._blur50FBO && (this._blur50FBO.destroy(), this._blur51FBO.destroy(), this._blur60FBO.destroy(), 
        this._blur61FBO.destroy()));
    }, ii._createTextures = function(e) {
        if (!this._blur00Tex) {
            var t = e.width, n = e.height;
            this._blur00Tex = this._createColorTex(e, t, n), this._blur00FBO = this._createBlurFBO(this._blur00Tex), 
            this._blur01Tex = this._createColorTex(e), this._blur01FBO = this._createBlurFBO(this._blur01Tex), 
            t = Math.ceil(t / 2), n = Math.ceil(n / 2), this._blur10Tex = this._createColorTex(e, t, n), 
            this._blur10FBO = this._createBlurFBO(this._blur10Tex), this._blur11Tex = this._createColorTex(e, t, n), 
            this._blur11FBO = this._createBlurFBO(this._blur11Tex), t = Math.ceil(t / 2), n = Math.ceil(n / 2), 
            this._blur20Tex = this._createColorTex(e, t, n), this._blur20FBO = this._createBlurFBO(this._blur20Tex), 
            this._blur21Tex = this._createColorTex(e, t, n), this._blur21FBO = this._createBlurFBO(this._blur21Tex), 
            t = Math.ceil(t / 2), n = Math.ceil(n / 2), this._blur30Tex = this._createColorTex(e, t, n), 
            this._blur30FBO = this._createBlurFBO(this._blur30Tex), this._blur31Tex = this._createColorTex(e, t, n), 
            this._blur31FBO = this._createBlurFBO(this._blur31Tex), t = Math.ceil(t / 2), n = Math.ceil(n / 2), 
            this._blur40Tex = this._createColorTex(e, t, n), this._blur40FBO = this._createBlurFBO(this._blur40Tex), 
            this._blur41Tex = this._createColorTex(e, t, n), this._blur41FBO = this._createBlurFBO(this._blur41Tex), 
            5 < this._level && (t = Math.ceil(t / 2), n = Math.ceil(n / 2), this._blur50Tex = this._createColorTex(e, t, n), 
            this._blur50FBO = this._createBlurFBO(this._blur50Tex), this._blur51Tex = this._createColorTex(e, t, n), 
            this._blur51FBO = this._createBlurFBO(this._blur51Tex), t = Math.ceil(t / 2), n = Math.ceil(n / 2), 
            this._blur60Tex = this._createColorTex(e, t, n), this._blur60FBO = this._createBlurFBO(this._blur60Tex), 
            this._blur61Tex = this._createColorTex(e, t, n), this._blur61FBO = this._createBlurFBO(this._blur61Tex));
        }
    }, ii._createColorTex = function(e, t, n) {
        var r = this._regl, i = t || e.width, a = n || e.height;
        return r.texture({
            min: "linear",
            mag: "linear",
            type: "uint8",
            width: i,
            height: a
        });
    }, ii._createBlurFBO = function(e) {
        return this._regl.framebuffer({
            width: e.width,
            height: e.height,
            colors: [ e ],
            depth: !1,
            stencil: !1
        });
    }, ii._initShaders = function() {
        if (!this._blur0Shader) {
            var e = {
                vert: Tr,
                uniforms: [ "inputRGBM", "uRGBMRange", "TextureBlurInput", "uBlurDir", "uGlobalTexSize", "uPixelRatio", "uTextureOutputSize" ],
                extraCommandProps: {
                    viewport: {
                        x: 0,
                        y: 0,
                        width: function(e, t) {
                            return t.uTextureOutputSize[0];
                        },
                        height: function(e, t) {
                            return t.uTextureOutputSize[1];
                        }
                    }
                },
                frag: "#version 100\nprecision highp float;\nuniform float uRGBMRange;\nuniform sampler2D TextureBlurInput;\nuniform sampler2D TextureInput;\nuniform vec2 uBlurDir;\nuniform vec2 uPixelRatio;\nuniform vec2 uTextureOutputSize;\nuniform float inputRGBM;\nuniform float uLuminThreshold;\n#define SHADER_NAME TextureBlurTemp0\nconst vec3 uw = vec3(.2126, .7152, .0722);\nfloat ux(const in vec3 pa) {\n  return dot(pa, uw);\n}\nvec4 uy(vec4 pa) {\n  float uz = max(sign(ux(pa.rgb) - uLuminThreshold), .0);\n  return pa * uz;\n}\nvec2 re;\nfloat qc(const in float pa) {\n  return pa < .0031308 ? pa * 12.92 : 1.055 * pow(pa, 1. / 2.4) - .055;\n}\nvec3 qc(const in vec3 pa) {\n  return vec3(pa.r < .0031308 ? pa.r * 12.92 : 1.055 * pow(pa.r, 1. / 2.4) - .055, pa.g < .0031308 ? pa.g * 12.92 : 1.055 * pow(pa.g, 1. / 2.4) - .055, pa.b < .0031308 ? pa.b * 12.92 : 1.055 * pow(pa.b, 1. / 2.4) - .055);\n}\nvec4 qc(const in vec4 pa) {\n  return vec4(pa.r < .0031308 ? pa.r * 12.92 : 1.055 * pow(pa.r, 1. / 2.4) - .055, pa.g < .0031308 ? pa.g * 12.92 : 1.055 * pow(pa.g, 1. / 2.4) - .055, pa.b < .0031308 ? pa.b * 12.92 : 1.055 * pow(pa.b, 1. / 2.4) - .055, pa.a);\n}\nfloat qJ(const in float pa) {\n  return pa < .04045 ? pa * (1. / 12.92) : pow((pa + .055) * (1. / 1.055), 2.4);\n}\nvec3 qJ(const in vec3 pa) {\n  return vec3(pa.r < .04045 ? pa.r * (1. / 12.92) : pow((pa.r + .055) * (1. / 1.055), 2.4), pa.g < .04045 ? pa.g * (1. / 12.92) : pow((pa.g + .055) * (1. / 1.055), 2.4), pa.b < .04045 ? pa.b * (1. / 12.92) : pow((pa.b + .055) * (1. / 1.055), 2.4));\n}\nvec4 qJ(const in vec4 pa) {\n  return vec4(pa.r < .04045 ? pa.r * (1. / 12.92) : pow((pa.r + .055) * (1. / 1.055), 2.4), pa.g < .04045 ? pa.g * (1. / 12.92) : pow((pa.g + .055) * (1. / 1.055), 2.4), pa.b < .04045 ? pa.b * (1. / 12.92) : pow((pa.b + .055) * (1. / 1.055), 2.4), pa.a);\n}\nvec3 rk(const in vec4 rgba) {\n  const float rl = 8.;\n  return rgba.rgb * rl * rgba.a;\n}\nconst mat3 rm = mat3(6.0013, -2.7, -1.7995, -1.332, 3.1029, -5.772, .3007, -1.088, 5.6268);\nvec3 rn(const in vec4 ro) {\n  float rp = ro.z * 255. + ro.w;\n  vec3 rq;\n  rq.y = exp2((rp - 127.) / 2.);\n  rq.z = rq.y / ro.y;\n  rq.x = ro.x * rq.z;\n  vec3 rr = rm * rq;\n  return max(rr, .0);\n}\nvec4 rf(const in vec3 pa, const in float rg) {\n  vec4 rh;\n  vec3 ri = pa / rg;\n  rh.a = clamp(max(max(ri.r, ri.g), max(ri.b, 1e-6)), .0, 1.);\n  rh.a = ceil(rh.a * 255.) / 255.;\n  rh.rgb = ri / rh.a;\n  return rh;\n}\nvec3 rj(const in vec4 pa, const in float rg) {\n  if(inputRGBM == .0)\n    return pa.rgb;\n  return rg * pa.rgb * pa.a;\n}\nvec4 uA() {\n  vec3 uB = .375 * (uy(vec4(rj(texture2D(TextureBlurInput, re.xy), uRGBMRange), 1.))).rgb;\n  vec2 pP;\n  vec2 uC = uPixelRatio.xy * uBlurDir.xy / uTextureOutputSize.xy;\n  pP = uC * 1.2;\n  uB += .3125 * (uy(vec4(rj(texture2D(TextureBlurInput, re.xy + pP.xy), uRGBMRange), 1.))).rgb;\n  uB += .3125 * (uy(vec4(rj(texture2D(TextureBlurInput, re.xy - pP.xy), uRGBMRange), 1.))).rgb;\n  return vec4(uB, 1.);\n}\nvoid main(void) {\n  re = gl_FragCoord.xy / uTextureOutputSize.xy;\n  vec4 pa = uA();\n  pa = rf(pa.rgb, uRGBMRange);\n  gl_FragColor = pa;\n}"
            };
            this._blur0Shader = new Sr(e), e.frag = "#version 100\nprecision highp float;\nuniform float uRGBMRange;\nuniform sampler2D TextureBlurInput;\nuniform sampler2D TextureInput;\nuniform vec2 uBlurDir;\nuniform vec2 uPixelRatio;\nuniform vec2 uTextureOutputSize;\n#define SHADER_NAME TextureBlurTemp1\nvec2 re;\nfloat qc(const in float pa) {\n  return pa < .0031308 ? pa * 12.92 : 1.055 * pow(pa, 1. / 2.4) - .055;\n}\nvec3 qc(const in vec3 pa) {\n  return vec3(pa.r < .0031308 ? pa.r * 12.92 : 1.055 * pow(pa.r, 1. / 2.4) - .055, pa.g < .0031308 ? pa.g * 12.92 : 1.055 * pow(pa.g, 1. / 2.4) - .055, pa.b < .0031308 ? pa.b * 12.92 : 1.055 * pow(pa.b, 1. / 2.4) - .055);\n}\nvec4 qc(const in vec4 pa) {\n  return vec4(pa.r < .0031308 ? pa.r * 12.92 : 1.055 * pow(pa.r, 1. / 2.4) - .055, pa.g < .0031308 ? pa.g * 12.92 : 1.055 * pow(pa.g, 1. / 2.4) - .055, pa.b < .0031308 ? pa.b * 12.92 : 1.055 * pow(pa.b, 1. / 2.4) - .055, pa.a);\n}\nfloat qJ(const in float pa) {\n  return pa < .04045 ? pa * (1. / 12.92) : pow((pa + .055) * (1. / 1.055), 2.4);\n}\nvec3 qJ(const in vec3 pa) {\n  return vec3(pa.r < .04045 ? pa.r * (1. / 12.92) : pow((pa.r + .055) * (1. / 1.055), 2.4), pa.g < .04045 ? pa.g * (1. / 12.92) : pow((pa.g + .055) * (1. / 1.055), 2.4), pa.b < .04045 ? pa.b * (1. / 12.92) : pow((pa.b + .055) * (1. / 1.055), 2.4));\n}\nvec4 qJ(const in vec4 pa) {\n  return vec4(pa.r < .04045 ? pa.r * (1. / 12.92) : pow((pa.r + .055) * (1. / 1.055), 2.4), pa.g < .04045 ? pa.g * (1. / 12.92) : pow((pa.g + .055) * (1. / 1.055), 2.4), pa.b < .04045 ? pa.b * (1. / 12.92) : pow((pa.b + .055) * (1. / 1.055), 2.4), pa.a);\n}\nvec3 rk(const in vec4 rgba) {\n  const float rl = 8.;\n  return rgba.rgb * rl * rgba.a;\n}\nconst mat3 rm = mat3(6.0013, -2.7, -1.7995, -1.332, 3.1029, -5.772, .3007, -1.088, 5.6268);\nvec3 rn(const in vec4 ro) {\n  float rp = ro.z * 255. + ro.w;\n  vec3 rq;\n  rq.y = exp2((rp - 127.) / 2.);\n  rq.z = rq.y / ro.y;\n  rq.x = ro.x * rq.z;\n  vec3 rr = rm * rq;\n  return max(rr, .0);\n}\nvec4 rf(const in vec3 pa, const in float rg) {\n  if(rg <= .0)\n    return vec4(pa, 1.);\n  vec4 rh;\n  vec3 ri = pa / rg;\n  rh.a = clamp(max(max(ri.r, ri.g), max(ri.b, 1e-6)), .0, 1.);\n  rh.a = ceil(rh.a * 255.) / 255.;\n  rh.rgb = ri / rh.a;\n  return rh;\n}\nvec3 rj(const in vec4 pa, const in float rg) {\n  if(rg <= .0)\n    return pa.rgb;\n  return rg * pa.rgb * pa.a;\n}\nvec4 uA() {\n  vec3 uB = .3125 * (vec4(rj(texture2D(TextureBlurInput, re.xy), uRGBMRange), 1.)).rgb;\n  vec2 pP;\n  vec2 uC = uPixelRatio.xy * uBlurDir.xy / uTextureOutputSize.xy;\n  pP = uC * 1.2857142857142858;\n  uB += .328125 * (vec4(rj(texture2D(TextureBlurInput, re.xy + pP.xy), uRGBMRange), 1.)).rgb;\n  uB += .328125 * (vec4(rj(texture2D(TextureBlurInput, re.xy - pP.xy), uRGBMRange), 1.)).rgb;\n  return vec4(uB, 1.);\n}\nvoid main(void) {\n  re = gl_FragCoord.xy / uTextureOutputSize.xy;\n  vec4 pa = uA();\n  pa = rf(pa.rgb, uRGBMRange);\n  gl_FragColor = pa;\n}", 
            this._blur1Shader = new Sr(e), e.frag = "#version 100\nprecision highp float;\nuniform float uRGBMRange;\nuniform sampler2D TextureBlurInput;\nuniform sampler2D TextureInput;\nuniform vec2 uBlurDir;\nuniform vec2 uPixelRatio;\nuniform vec2 uTextureOutputSize;\n#define SHADER_NAME TextureBlurTemp2\nvec2 re;\nfloat qc(const in float pa) {\n  return pa < .0031308 ? pa * 12.92 : 1.055 * pow(pa, 1. / 2.4) - .055;\n}\nvec3 qc(const in vec3 pa) {\n  return vec3(pa.r < .0031308 ? pa.r * 12.92 : 1.055 * pow(pa.r, 1. / 2.4) - .055, pa.g < .0031308 ? pa.g * 12.92 : 1.055 * pow(pa.g, 1. / 2.4) - .055, pa.b < .0031308 ? pa.b * 12.92 : 1.055 * pow(pa.b, 1. / 2.4) - .055);\n}\nvec4 qc(const in vec4 pa) {\n  return vec4(pa.r < .0031308 ? pa.r * 12.92 : 1.055 * pow(pa.r, 1. / 2.4) - .055, pa.g < .0031308 ? pa.g * 12.92 : 1.055 * pow(pa.g, 1. / 2.4) - .055, pa.b < .0031308 ? pa.b * 12.92 : 1.055 * pow(pa.b, 1. / 2.4) - .055, pa.a);\n}\nfloat qJ(const in float pa) {\n  return pa < .04045 ? pa * (1. / 12.92) : pow((pa + .055) * (1. / 1.055), 2.4);\n}\nvec3 qJ(const in vec3 pa) {\n  return vec3(pa.r < .04045 ? pa.r * (1. / 12.92) : pow((pa.r + .055) * (1. / 1.055), 2.4), pa.g < .04045 ? pa.g * (1. / 12.92) : pow((pa.g + .055) * (1. / 1.055), 2.4), pa.b < .04045 ? pa.b * (1. / 12.92) : pow((pa.b + .055) * (1. / 1.055), 2.4));\n}\nvec4 qJ(const in vec4 pa) {\n  return vec4(pa.r < .04045 ? pa.r * (1. / 12.92) : pow((pa.r + .055) * (1. / 1.055), 2.4), pa.g < .04045 ? pa.g * (1. / 12.92) : pow((pa.g + .055) * (1. / 1.055), 2.4), pa.b < .04045 ? pa.b * (1. / 12.92) : pow((pa.b + .055) * (1. / 1.055), 2.4), pa.a);\n}\nvec3 rk(const in vec4 rgba) {\n  const float rl = 8.;\n  return rgba.rgb * rl * rgba.a;\n}\nconst mat3 rm = mat3(6.0013, -2.7, -1.7995, -1.332, 3.1029, -5.772, .3007, -1.088, 5.6268);\nvec3 rn(const in vec4 ro) {\n  float rp = ro.z * 255. + ro.w;\n  vec3 rq;\n  rq.y = exp2((rp - 127.) / 2.);\n  rq.z = rq.y / ro.y;\n  rq.x = ro.x * rq.z;\n  vec3 rr = rm * rq;\n  return max(rr, .0);\n}\nvec4 rf(const in vec3 pa, const in float rg) {\n  if(rg <= .0)\n    return vec4(pa, 1.);\n  vec4 rh;\n  vec3 ri = pa / rg;\n  rh.a = clamp(max(max(ri.r, ri.g), max(ri.b, 1e-6)), .0, 1.);\n  rh.a = ceil(rh.a * 255.) / 255.;\n  rh.rgb = ri / rh.a;\n  return rh;\n}\nvec3 rj(const in vec4 pa, const in float rg) {\n  if(rg <= .0)\n    return pa.rgb;\n  return rg * pa.rgb * pa.a;\n}\nvec4 uA() {\n  vec3 uB = .2734375 * (vec4(rj(texture2D(TextureBlurInput, re.xy), uRGBMRange), 1.)).rgb;\n  vec2 pP;\n  vec2 uC = uPixelRatio.xy * uBlurDir.xy / uTextureOutputSize.xy;\n  pP = uC * 1.3333333333333333;\n  uB += .328125 * (vec4(rj(texture2D(TextureBlurInput, re.xy + pP.xy), uRGBMRange), 1.)).rgb;\n  uB += .328125 * (vec4(rj(texture2D(TextureBlurInput, re.xy - pP.xy), uRGBMRange), 1.)).rgb;\n  pP = uC * 3.111111111111111;\n  uB += .03515625 * (vec4(rj(texture2D(TextureBlurInput, re.xy + pP.xy), uRGBMRange), 1.)).rgb;\n  uB += .03515625 * (vec4(rj(texture2D(TextureBlurInput, re.xy - pP.xy), uRGBMRange), 1.)).rgb;\n  return vec4(uB, 1.);\n}\nvoid main(void) {\n  re = gl_FragCoord.xy / uTextureOutputSize.xy;\n  vec4 pa = uA();\n  pa = rf(pa.rgb, uRGBMRange);\n  gl_FragColor = pa;\n}", 
            this._blur2Shader = new Sr(e), e.frag = "#version 100\nprecision highp float;\nuniform float uRGBMRange;\nuniform sampler2D TextureBlurInput;\nuniform sampler2D TextureInput;\nuniform vec2 uBlurDir;\nuniform vec2 uPixelRatio;\nuniform vec2 uTextureOutputSize;\n#define SHADER_NAME TextureBlurTemp3\nvec2 re;\nfloat qc(const in float pa) {\n  return pa < .0031308 ? pa * 12.92 : 1.055 * pow(pa, 1. / 2.4) - .055;\n}\nvec3 qc(const in vec3 pa) {\n  return vec3(pa.r < .0031308 ? pa.r * 12.92 : 1.055 * pow(pa.r, 1. / 2.4) - .055, pa.g < .0031308 ? pa.g * 12.92 : 1.055 * pow(pa.g, 1. / 2.4) - .055, pa.b < .0031308 ? pa.b * 12.92 : 1.055 * pow(pa.b, 1. / 2.4) - .055);\n}\nvec4 qc(const in vec4 pa) {\n  return vec4(pa.r < .0031308 ? pa.r * 12.92 : 1.055 * pow(pa.r, 1. / 2.4) - .055, pa.g < .0031308 ? pa.g * 12.92 : 1.055 * pow(pa.g, 1. / 2.4) - .055, pa.b < .0031308 ? pa.b * 12.92 : 1.055 * pow(pa.b, 1. / 2.4) - .055, pa.a);\n}\nfloat qJ(const in float pa) {\n  return pa < .04045 ? pa * (1. / 12.92) : pow((pa + .055) * (1. / 1.055), 2.4);\n}\nvec3 qJ(const in vec3 pa) {\n  return vec3(pa.r < .04045 ? pa.r * (1. / 12.92) : pow((pa.r + .055) * (1. / 1.055), 2.4), pa.g < .04045 ? pa.g * (1. / 12.92) : pow((pa.g + .055) * (1. / 1.055), 2.4), pa.b < .04045 ? pa.b * (1. / 12.92) : pow((pa.b + .055) * (1. / 1.055), 2.4));\n}\nvec4 qJ(const in vec4 pa) {\n  return vec4(pa.r < .04045 ? pa.r * (1. / 12.92) : pow((pa.r + .055) * (1. / 1.055), 2.4), pa.g < .04045 ? pa.g * (1. / 12.92) : pow((pa.g + .055) * (1. / 1.055), 2.4), pa.b < .04045 ? pa.b * (1. / 12.92) : pow((pa.b + .055) * (1. / 1.055), 2.4), pa.a);\n}\nvec3 rk(const in vec4 rgba) {\n  const float rl = 8.;\n  return rgba.rgb * rl * rgba.a;\n}\nconst mat3 rm = mat3(6.0013, -2.7, -1.7995, -1.332, 3.1029, -5.772, .3007, -1.088, 5.6268);\nvec3 rn(const in vec4 ro) {\n  float rp = ro.z * 255. + ro.w;\n  vec3 rq;\n  rq.y = exp2((rp - 127.) / 2.);\n  rq.z = rq.y / ro.y;\n  rq.x = ro.x * rq.z;\n  vec3 rr = rm * rq;\n  return max(rr, .0);\n}\nvec4 rf(const in vec3 pa, const in float rg) {\n  if(rg <= .0)\n    return vec4(pa, 1.);\n  vec4 rh;\n  vec3 ri = pa / rg;\n  rh.a = clamp(max(max(ri.r, ri.g), max(ri.b, 1e-6)), .0, 1.);\n  rh.a = ceil(rh.a * 255.) / 255.;\n  rh.rgb = ri / rh.a;\n  return rh;\n}\nvec3 rj(const in vec4 pa, const in float rg) {\n  if(rg <= .0)\n    return pa.rgb;\n  return rg * pa.rgb * pa.a;\n}\nvec4 uA() {\n  vec3 uB = .24609375 * (vec4(rj(texture2D(TextureBlurInput, re.xy), uRGBMRange), 1.)).rgb;\n  vec2 pP;\n  vec2 uC = uPixelRatio.xy * uBlurDir.xy / uTextureOutputSize.xy;\n  pP = uC * 1.3636363636363635;\n  uB += .322265625 * (vec4(rj(texture2D(TextureBlurInput, re.xy + pP.xy), uRGBMRange), 1.)).rgb;\n  uB += .322265625 * (vec4(rj(texture2D(TextureBlurInput, re.xy - pP.xy), uRGBMRange), 1.)).rgb;\n  pP = uC * 3.1818181818181817;\n  uB += .0537109375 * (vec4(rj(texture2D(TextureBlurInput, re.xy + pP.xy), uRGBMRange), 1.)).rgb;\n  uB += .0537109375 * (vec4(rj(texture2D(TextureBlurInput, re.xy - pP.xy), uRGBMRange), 1.)).rgb;\n  return vec4(uB, 1.);\n}\nvoid main(void) {\n  re = gl_FragCoord.xy / uTextureOutputSize.xy;\n  vec4 pa = uA();\n  pa = rf(pa.rgb, uRGBMRange);\n  gl_FragColor = pa;\n}", 
            this._blur3Shader = new Sr(e), e.frag = "#version 100\nprecision highp float;\nuniform float uRGBMRange;\nuniform sampler2D TextureBlurInput;\nuniform sampler2D TextureInput;\nuniform vec2 uBlurDir;\nuniform vec2 uPixelRatio;\nuniform vec2 uTextureOutputSize;\n#define SHADER_NAME TextureBlurTemp4\nvec2 re;\nfloat qc(const in float pa) {\n  return pa < .0031308 ? pa * 12.92 : 1.055 * pow(pa, 1. / 2.4) - .055;\n}\nvec3 qc(const in vec3 pa) {\n  return vec3(pa.r < .0031308 ? pa.r * 12.92 : 1.055 * pow(pa.r, 1. / 2.4) - .055, pa.g < .0031308 ? pa.g * 12.92 : 1.055 * pow(pa.g, 1. / 2.4) - .055, pa.b < .0031308 ? pa.b * 12.92 : 1.055 * pow(pa.b, 1. / 2.4) - .055);\n}\nvec4 qc(const in vec4 pa) {\n  return vec4(pa.r < .0031308 ? pa.r * 12.92 : 1.055 * pow(pa.r, 1. / 2.4) - .055, pa.g < .0031308 ? pa.g * 12.92 : 1.055 * pow(pa.g, 1. / 2.4) - .055, pa.b < .0031308 ? pa.b * 12.92 : 1.055 * pow(pa.b, 1. / 2.4) - .055, pa.a);\n}\nfloat qJ(const in float pa) {\n  return pa < .04045 ? pa * (1. / 12.92) : pow((pa + .055) * (1. / 1.055), 2.4);\n}\nvec3 qJ(const in vec3 pa) {\n  return vec3(pa.r < .04045 ? pa.r * (1. / 12.92) : pow((pa.r + .055) * (1. / 1.055), 2.4), pa.g < .04045 ? pa.g * (1. / 12.92) : pow((pa.g + .055) * (1. / 1.055), 2.4), pa.b < .04045 ? pa.b * (1. / 12.92) : pow((pa.b + .055) * (1. / 1.055), 2.4));\n}\nvec4 qJ(const in vec4 pa) {\n  return vec4(pa.r < .04045 ? pa.r * (1. / 12.92) : pow((pa.r + .055) * (1. / 1.055), 2.4), pa.g < .04045 ? pa.g * (1. / 12.92) : pow((pa.g + .055) * (1. / 1.055), 2.4), pa.b < .04045 ? pa.b * (1. / 12.92) : pow((pa.b + .055) * (1. / 1.055), 2.4), pa.a);\n}\nvec3 rk(const in vec4 rgba) {\n  const float rl = 8.;\n  return rgba.rgb * rl * rgba.a;\n}\nconst mat3 rm = mat3(6.0013, -2.7, -1.7995, -1.332, 3.1029, -5.772, .3007, -1.088, 5.6268);\nvec3 rn(const in vec4 ro) {\n  float rp = ro.z * 255. + ro.w;\n  vec3 rq;\n  rq.y = exp2((rp - 127.) / 2.);\n  rq.z = rq.y / ro.y;\n  rq.x = ro.x * rq.z;\n  vec3 rr = rm * rq;\n  return max(rr, .0);\n}\nvec4 rf(const in vec3 pa, const in float rg) {\n  if(rg <= .0)\n    return vec4(pa, 1.);\n  vec4 rh;\n  vec3 ri = pa / rg;\n  rh.a = clamp(max(max(ri.r, ri.g), max(ri.b, 1e-6)), .0, 1.);\n  rh.a = ceil(rh.a * 255.) / 255.;\n  rh.rgb = ri / rh.a;\n  return rh;\n}\nvec3 rj(const in vec4 pa, const in float rg) {\n  if(rg <= .0)\n    return pa.rgb;\n  return rg * pa.rgb * pa.a;\n}\nvec4 uA() {\n  vec3 uB = .2255859375 * (vec4(rj(texture2D(TextureBlurInput, re.xy), uRGBMRange), 1.)).rgb;\n  vec2 pP;\n  vec2 uC = uPixelRatio.xy * uBlurDir.xy / uTextureOutputSize.xy;\n  pP = uC * 1.3846153846153846;\n  uB += .314208984375 * (vec4(rj(texture2D(TextureBlurInput, re.xy + pP.xy), uRGBMRange), 1.)).rgb;\n  uB += .314208984375 * (vec4(rj(texture2D(TextureBlurInput, re.xy - pP.xy), uRGBMRange), 1.)).rgb;\n  pP = uC * 3.230769230769231;\n  uB += .06982421875 * (vec4(rj(texture2D(TextureBlurInput, re.xy + pP.xy), uRGBMRange), 1.)).rgb;\n  uB += .06982421875 * (vec4(rj(texture2D(TextureBlurInput, re.xy - pP.xy), uRGBMRange), 1.)).rgb;\n  pP = uC * 5.076923076923077;\n  uB += .003173828125 * (vec4(rj(texture2D(TextureBlurInput, re.xy + pP.xy), uRGBMRange), 1.)).rgb;\n  uB += .003173828125 * (vec4(rj(texture2D(TextureBlurInput, re.xy - pP.xy), uRGBMRange), 1.)).rgb;\n  return vec4(uB, 1.);\n}\nvoid main(void) {\n  re = gl_FragCoord.xy / uTextureOutputSize.xy;\n  vec4 pa = uA();\n  pa = rf(pa.rgb, uRGBMRange);\n  gl_FragColor = pa;\n}", 
            this._blur4Shader = new Sr(e), 5 < this._level && (e.frag = "precision highp float;\nuniform float uRGBMRange;\nuniform sampler2D TextureBlurInput;\nuniform sampler2D TextureInput;\nuniform vec2 uBlurDir;\nuniform vec2 uGlobalTexSize;\nuniform vec2 uPixelRatio;\nuniform vec2 uTextureOutputSize;\n#define SHADER_NAME TextureBlurTemp5\nvec2 re;\nfloat qc(const in float pa) {\n  return pa < .0031308 ? pa * 12.92 : 1.055 * pow(pa, 1. / 2.4) - .055;\n}\nvec3 qc(const in vec3 pa) {\n  return vec3(pa.r < .0031308 ? pa.r * 12.92 : 1.055 * pow(pa.r, 1. / 2.4) - .055, pa.g < .0031308 ? pa.g * 12.92 : 1.055 * pow(pa.g, 1. / 2.4) - .055, pa.b < .0031308 ? pa.b * 12.92 : 1.055 * pow(pa.b, 1. / 2.4) - .055);\n}\nvec4 qc(const in vec4 pa) {\n  return vec4(pa.r < .0031308 ? pa.r * 12.92 : 1.055 * pow(pa.r, 1. / 2.4) - .055, pa.g < .0031308 ? pa.g * 12.92 : 1.055 * pow(pa.g, 1. / 2.4) - .055, pa.b < .0031308 ? pa.b * 12.92 : 1.055 * pow(pa.b, 1. / 2.4) - .055, pa.a);\n}\nfloat qJ(const in float pa) {\n  return pa < .04045 ? pa * (1. / 12.92) : pow((pa + .055) * (1. / 1.055), 2.4);\n}\nvec3 qJ(const in vec3 pa) {\n  return vec3(pa.r < .04045 ? pa.r * (1. / 12.92) : pow((pa.r + .055) * (1. / 1.055), 2.4), pa.g < .04045 ? pa.g * (1. / 12.92) : pow((pa.g + .055) * (1. / 1.055), 2.4), pa.b < .04045 ? pa.b * (1. / 12.92) : pow((pa.b + .055) * (1. / 1.055), 2.4));\n}\nvec4 qJ(const in vec4 pa) {\n  return vec4(pa.r < .04045 ? pa.r * (1. / 12.92) : pow((pa.r + .055) * (1. / 1.055), 2.4), pa.g < .04045 ? pa.g * (1. / 12.92) : pow((pa.g + .055) * (1. / 1.055), 2.4), pa.b < .04045 ? pa.b * (1. / 12.92) : pow((pa.b + .055) * (1. / 1.055), 2.4), pa.a);\n}\nvec3 rk(const in vec4 rgba) {\n  const float rl = 8.;\n  return rgba.rgb * rl * rgba.a;\n}\nconst mat3 rm = mat3(6.0013, -2.7, -1.7995, -1.332, 3.1029, -5.772, .3007, -1.088, 5.6268);\nvec3 rn(const in vec4 ro) {\n  float rp = ro.z * 255. + ro.w;\n  vec3 rq;\n  rq.y = exp2((rp - 127.) / 2.);\n  rq.z = rq.y / ro.y;\n  rq.x = ro.x * rq.z;\n  vec3 rr = rm * rq;\n  return max(rr, .0);\n}\nvec4 rf(const in vec3 pa, const in float rg) {\n  if(rg <= .0)\n    return vec4(pa, 1.);\n  vec4 rh;\n  vec3 ri = pa / rg;\n  rh.a = clamp(max(max(ri.r, ri.g), max(ri.b, 1e-6)), .0, 1.);\n  rh.a = ceil(rh.a * 255.) / 255.;\n  rh.rgb = ri / rh.a;\n  return rh;\n}\nvec3 rj(const in vec4 pa, const in float rg) {\n  if(rg <= .0)\n    return pa.rgb;\n  return rg * pa.rgb * pa.a;\n}\nvec4 uA() {\n  vec3 uB = .20947265625 * (vec4(rj(texture2D(TextureBlurInput, re.xy), uRGBMRange), 1.)).rgb;\n  vec2 pP;\n  vec2 uC = uPixelRatio.xy * uBlurDir.xy / uTextureOutputSize.xy;\n  uC *= uGlobalTexSize.y * .00075;\n  pP = uC * 1.4;\n  uB += .30548095703125 * (vec4(rj(texture2D(TextureBlurInput, re.xy + pP.xy), uRGBMRange), 1.)).rgb;\n  uB += .30548095703125 * (vec4(rj(texture2D(TextureBlurInput, re.xy - pP.xy), uRGBMRange), 1.)).rgb;\n  pP = uC * 3.2666666666666666;\n  uB += .08331298828125 * (vec4(rj(texture2D(TextureBlurInput, re.xy + pP.xy), uRGBMRange), 1.)).rgb;\n  uB += .08331298828125 * (vec4(rj(texture2D(TextureBlurInput, re.xy - pP.xy), uRGBMRange), 1.)).rgb;\n  pP = uC * 5.133333333333334;\n  uB += .00640869140625 * (vec4(rj(texture2D(TextureBlurInput, re.xy + pP.xy), uRGBMRange), 1.)).rgb;\n  uB += .00640869140625 * (vec4(rj(texture2D(TextureBlurInput, re.xy - pP.xy), uRGBMRange), 1.)).rgb;\n  return vec4(uB, 1.);\n}\nvoid main(void) {\n  re = gl_FragCoord.xy / uTextureOutputSize.xy;\n  vec4 pa = uA();\n  pa = rf(pa.rgb, uRGBMRange);\n  gl_FragColor = pa;\n}", 
            this._blur5Shader = new Sr(e), e.frag = "#version 100\nprecision highp float;\nuniform float uRGBMRange;\nuniform sampler2D TextureBlurInput;\nuniform sampler2D TextureInput;\nuniform vec2 uBlurDir;\nuniform vec2 uGlobalTexSize;\nuniform vec2 uPixelRatio;\nuniform vec2 uTextureOutputSize;\n#define SHADER_NAME TextureBlurTemp6\nvec2 re;\nfloat qc(const in float pa) {\n  return pa < .0031308 ? pa * 12.92 : 1.055 * pow(pa, 1. / 2.4) - .055;\n}\nvec3 qc(const in vec3 pa) {\n  return vec3(pa.r < .0031308 ? pa.r * 12.92 : 1.055 * pow(pa.r, 1. / 2.4) - .055, pa.g < .0031308 ? pa.g * 12.92 : 1.055 * pow(pa.g, 1. / 2.4) - .055, pa.b < .0031308 ? pa.b * 12.92 : 1.055 * pow(pa.b, 1. / 2.4) - .055);\n}\nvec4 qc(const in vec4 pa) {\n  return vec4(pa.r < .0031308 ? pa.r * 12.92 : 1.055 * pow(pa.r, 1. / 2.4) - .055, pa.g < .0031308 ? pa.g * 12.92 : 1.055 * pow(pa.g, 1. / 2.4) - .055, pa.b < .0031308 ? pa.b * 12.92 : 1.055 * pow(pa.b, 1. / 2.4) - .055, pa.a);\n}\nfloat qJ(const in float pa) {\n  return pa < .04045 ? pa * (1. / 12.92) : pow((pa + .055) * (1. / 1.055), 2.4);\n}\nvec3 qJ(const in vec3 pa) {\n  return vec3(pa.r < .04045 ? pa.r * (1. / 12.92) : pow((pa.r + .055) * (1. / 1.055), 2.4), pa.g < .04045 ? pa.g * (1. / 12.92) : pow((pa.g + .055) * (1. / 1.055), 2.4), pa.b < .04045 ? pa.b * (1. / 12.92) : pow((pa.b + .055) * (1. / 1.055), 2.4));\n}\nvec4 qJ(const in vec4 pa) {\n  return vec4(pa.r < .04045 ? pa.r * (1. / 12.92) : pow((pa.r + .055) * (1. / 1.055), 2.4), pa.g < .04045 ? pa.g * (1. / 12.92) : pow((pa.g + .055) * (1. / 1.055), 2.4), pa.b < .04045 ? pa.b * (1. / 12.92) : pow((pa.b + .055) * (1. / 1.055), 2.4), pa.a);\n}\nvec3 rk(const in vec4 rgba) {\n  const float rl = 8.;\n  return rgba.rgb * rl * rgba.a;\n}\nconst mat3 rm = mat3(6.0013, -2.7, -1.7995, -1.332, 3.1029, -5.772, .3007, -1.088, 5.6268);\nvec3 rn(const in vec4 ro) {\n  float rp = ro.z * 255. + ro.w;\n  vec3 rq;\n  rq.y = exp2((rp - 127.) / 2.);\n  rq.z = rq.y / ro.y;\n  rq.x = ro.x * rq.z;\n  vec3 rr = rm * rq;\n  return max(rr, .0);\n}\nvec4 rf(const in vec3 pa, const in float rg) {\n  if(rg <= .0)\n    return vec4(pa, 1.);\n  vec4 rh;\n  vec3 ri = pa / rg;\n  rh.a = clamp(max(max(ri.r, ri.g), max(ri.b, 1e-6)), .0, 1.);\n  rh.a = ceil(rh.a * 255.) / 255.;\n  rh.rgb = ri / rh.a;\n  return rh;\n}\nvec3 rj(const in vec4 pa, const in float rg) {\n  if(rg <= .0)\n    return pa.rgb;\n  return rg * pa.rgb * pa.a;\n}\nvec4 uA() {\n  vec3 uB = .196380615234375 * (vec4(rj(texture2D(TextureBlurInput, re.xy), uRGBMRange), 1.)).rgb;\n  vec2 pP;\n  vec2 uC = uPixelRatio.xy * uBlurDir.xy / uTextureOutputSize.xy;\n  uC *= uGlobalTexSize.y * .00075;\n  pP = uC * 1.411764705882353;\n  uB += .2967529296875 * (vec4(rj(texture2D(TextureBlurInput, re.xy + pP.xy), uRGBMRange), 1.)).rgb;\n  uB += .2967529296875 * (vec4(rj(texture2D(TextureBlurInput, re.xy - pP.xy), uRGBMRange), 1.)).rgb;\n  pP = uC * 3.2941176470588234;\n  uB += .09442138671875 * (vec4(rj(texture2D(TextureBlurInput, re.xy + pP.xy), uRGBMRange), 1.)).rgb;\n  uB += .09442138671875 * (vec4(rj(texture2D(TextureBlurInput, re.xy - pP.xy), uRGBMRange), 1.)).rgb;\n  pP = uC * 5.176470588235294;\n  uB += .0103759765625 * (vec4(rj(texture2D(TextureBlurInput, re.xy + pP.xy), uRGBMRange), 1.)).rgb;\n  uB += .0103759765625 * (vec4(rj(texture2D(TextureBlurInput, re.xy - pP.xy), uRGBMRange), 1.)).rgb;\n  return vec4(uB, 1.);\n}\nvoid main(void) {\n  re = gl_FragCoord.xy / uTextureOutputSize.xy;\n  vec4 pa = uA();\n  pa = rf(pa.rgb, uRGBMRange);\n  gl_FragColor = pa;\n}", 
            this._blur6Shader = new Sr(e));
        }
    }, oi);
    function oi(e, t, n) {
        void 0 === n && (n = 5), this._regl = e, this._renderer = new ut(e), this._inputRGBM = t, 
        this._level = n;
    }
    var si, ui = ((si = fi.prototype).render = function(e, t, n, r, i, a) {
        this._initShaders(), this._createTextures(e);
        var o = this._blurPass.render(t, n);
        return this._combine(e, o, t, r, i, a);
    }, si._combine = function(e, t, n, r, i, a) {
        a || this._combineTex.width === e.width && this._combineTex.height === e.height || this._combineFBO.resize(e.width, e.height);
        var o = this._combineUniforms, s = t.blurTex0, u = t.blurTex1, f = t.blurTex2, c = t.blurTex3, l = t.blurTex4;
        return (o = o || (this._combineUniforms = {
            uBloomFactor: 0,
            uBloomRadius: 0,
            uRGBMRange: 7,
            TextureBloomBlur1: s,
            TextureBloomBlur2: u,
            TextureBloomBlur3: f,
            TextureBloomBlur4: c,
            TextureBloomBlur5: l,
            TextureInput: null,
            TextureSource: null,
            uTextureOutputSize: [ 0, 0 ]
        })).uBloomFactor = r, o.uBloomRadius = i, o.TextureInput = n, o.TextureSource = e, 
        Ne(o.uTextureOutputSize, e.width, e.height), this._renderer.render(this._combineShader, o, null, a ? null : this._combineFBO), 
        a ? null : this._combineTex;
    }, si.dispose = function() {
        this._combineFBO && (this._combineFBO.destroy(), delete this._combineFBO), this._blurPass && (this._blurPass.dispose(), 
        delete this._blurPass), delete this._uniforms;
    }, si._createTextures = function(e) {
        if (!this._combineTex) {
            var t = e.width, n = e.height;
            this._combineTex = this._createColorTex(e, t, n, "uint8"), this._combineFBO = this._createBlurFBO(this._combineTex);
        }
    }, si._createColorTex = function(e, t, n, r) {
        var i = this._renderer.regl, a = r || (i.hasExtension("OES_texture_half_float") ? "float16" : "float"), o = t || e.width, s = n || e.height;
        return i.texture({
            min: "linear",
            mag: "linear",
            type: a,
            width: o,
            height: s
        });
    }, si._createBlurFBO = function(e) {
        return this._renderer.regl.framebuffer({
            width: e.width,
            height: e.height,
            colors: [ e ],
            depth: !1,
            stencil: !1
        });
    }, si._initShaders = function() {
        this._combineShader || (this._blurPass = new ai(this._regl, !1), this._combineShader = new Sr({
            vert: Tr,
            frag: "#version 100\nprecision highp float;\nuniform float uBloomFactor;\nuniform float uBloomRadius;\nuniform float uRGBMRange;\nuniform sampler2D TextureBloomBlur1;\nuniform sampler2D TextureBloomBlur2;\nuniform sampler2D TextureBloomBlur3;\nuniform sampler2D TextureBloomBlur4;\nuniform sampler2D TextureBloomBlur5;\nuniform sampler2D TextureInput;\nuniform sampler2D TextureSource;\nuniform vec2 uTextureOutputSize;\n#define SHADER_NAME bloomCombine\nvec2 re;\nfloat qc(const in float pa) {\n  return pa < .0031308 ? pa * 12.92 : 1.055 * pow(pa, 1. / 2.4) - .055;\n}\nvec3 qc(const in vec3 pa) {\n  return vec3(pa.r < .0031308 ? pa.r * 12.92 : 1.055 * pow(pa.r, 1. / 2.4) - .055, pa.g < .0031308 ? pa.g * 12.92 : 1.055 * pow(pa.g, 1. / 2.4) - .055, pa.b < .0031308 ? pa.b * 12.92 : 1.055 * pow(pa.b, 1. / 2.4) - .055);\n}\nvec4 qc(const in vec4 pa) {\n  return vec4(pa.r < .0031308 ? pa.r * 12.92 : 1.055 * pow(pa.r, 1. / 2.4) - .055, pa.g < .0031308 ? pa.g * 12.92 : 1.055 * pow(pa.g, 1. / 2.4) - .055, pa.b < .0031308 ? pa.b * 12.92 : 1.055 * pow(pa.b, 1. / 2.4) - .055, pa.a);\n}\nfloat qJ(const in float pa) {\n  return pa < .04045 ? pa * (1. / 12.92) : pow((pa + .055) * (1. / 1.055), 2.4);\n}\nvec3 qJ(const in vec3 pa) {\n  return vec3(pa.r < .04045 ? pa.r * (1. / 12.92) : pow((pa.r + .055) * (1. / 1.055), 2.4), pa.g < .04045 ? pa.g * (1. / 12.92) : pow((pa.g + .055) * (1. / 1.055), 2.4), pa.b < .04045 ? pa.b * (1. / 12.92) : pow((pa.b + .055) * (1. / 1.055), 2.4));\n}\nvec4 qJ(const in vec4 pa) {\n  return vec4(pa.r < .04045 ? pa.r * (1. / 12.92) : pow((pa.r + .055) * (1. / 1.055), 2.4), pa.g < .04045 ? pa.g * (1. / 12.92) : pow((pa.g + .055) * (1. / 1.055), 2.4), pa.b < .04045 ? pa.b * (1. / 12.92) : pow((pa.b + .055) * (1. / 1.055), 2.4), pa.a);\n}\nvec3 rk(const in vec4 rgba) {\n  const float rl = 8.;\n  return rgba.rgb * rl * rgba.a;\n}\nconst mat3 rm = mat3(6.0013, -2.7, -1.7995, -1.332, 3.1029, -5.772, .3007, -1.088, 5.6268);\nvec3 rn(const in vec4 ro) {\n  float rp = ro.z * 255. + ro.w;\n  vec3 rq;\n  rq.y = exp2((rp - 127.) / 2.);\n  rq.z = rq.y / ro.y;\n  rq.x = ro.x * rq.z;\n  vec3 rr = rm * rq;\n  return max(rr, .0);\n}\nvec4 rf(const in vec3 pa, const in float rg) {\n  if(rg <= .0)\n    return vec4(pa, 1.);\n  vec4 rh;\n  vec3 ri = pa / rg;\n  rh.a = clamp(max(max(ri.r, ri.g), max(ri.b, 1e-6)), .0, 1.);\n  rh.a = ceil(rh.a * 255.) / 255.;\n  rh.rgb = ri / rh.a;\n  return rh;\n}\nvec3 rj(const in vec4 pa, const in float rg) {\n  if(rg <= .0)\n    return pa.rgb;\n  return rg * pa.rgb * pa.a;\n}\nfloat rs(const float rt, const float ru) {\n  return mix(rt, ru * 2. - rt, uBloomRadius);\n}\nvec4 rv() {\n  vec3 rw = vec3(.0);\n  const float rx = .6;\n  const float ry = 1.1;\n  const float rz = .9;\n  const float rA = .6;\n  const float rB = .3;\n  const float rC = .1;\n  rw += (vec4(rj(texture2D(TextureBloomBlur1, re), uRGBMRange), 1.)).rgb * rs(ry, rx);\n  rw += (vec4(rj(texture2D(TextureBloomBlur2, re), uRGBMRange), 1.)).rgb * rs(rz, rx);\n  rw += (vec4(rj(texture2D(TextureBloomBlur3, re), uRGBMRange), 1.)).rgb * rs(rA, rx);\n  rw += (vec4(rj(texture2D(TextureBloomBlur4, re), uRGBMRange), 1.)).rgb * rs(rB, rx);\n  rw += (vec4(rj(texture2D(TextureBloomBlur5, re), uRGBMRange), 1.)).rgb * rs(rC, rx);\n  vec4 pa = texture2D(TextureInput, re);\n  pa.rgb = mix(vec3(.0), pa.rgb, sign(pa.a));\n  float rD = mix(sqrt((rw.r + rw.g + rw.b) / 3.), pa.a, sign(pa.a));\n  vec4 rE = texture2D(TextureSource, re);\n  float rF = 1. - pa.a;\n  return vec4(rE.rgb * rF + pa.rgb + qc(rw.rgb * uBloomFactor), rD + rE.a * rF);\n}\nvoid main(void) {\n  re = gl_FragCoord.xy / uTextureOutputSize.xy;\n  vec4 pa = rv();\n  gl_FragColor = pa;\n}",
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width: function(e, t) {
                        return t.uTextureOutputSize[0];
                    },
                    height: function(e, t) {
                        return t.uTextureOutputSize[1];
                    }
                }
            }
        }));
    }, fi);
    function fi(e) {
        this._regl = e, this._renderer = new ut(e);
    }
    var ci, li = (o(hi, ci = Sr), hi.prototype.getMeshCommand = function(e, t) {
        return this.commands.ssr_mimap || (this.commands.ssr_mimap = this.createREGLCommand(e, null, t.getElements())), 
        this.commands.ssr_mimap;
    }, hi);
    function hi() {
        return ci.call(this, {
            vert: Tr,
            frag: "#version 100\nprecision highp float;\nuniform float inputRGBM;\nuniform float uRGBMRange;\nuniform sampler2D TextureInput;\nuniform sampler2D TextureRefractionBlur0;\nuniform sampler2D TextureRefractionBlur1;\nuniform sampler2D TextureRefractionBlur2;\nuniform sampler2D TextureRefractionBlur3;\nuniform sampler2D TextureRefractionBlur4;\nuniform sampler2D TextureRefractionBlur5;\nuniform sampler2D TextureRefractionBlur6;\nuniform sampler2D TextureRefractionBlur7;\nuniform vec2 uTextureOutputRatio;\nuniform vec2 uTextureOutputSize;\nuniform vec2 uTextureRefractionBlur0Ratio;\nuniform vec2 uTextureRefractionBlur0Size;\nuniform vec2 uTextureRefractionBlur1Ratio;\nuniform vec2 uTextureRefractionBlur1Size;\nuniform vec2 uTextureRefractionBlur2Ratio;\nuniform vec2 uTextureRefractionBlur2Size;\nuniform vec2 uTextureRefractionBlur3Ratio;\nuniform vec2 uTextureRefractionBlur3Size;\nuniform vec2 uTextureRefractionBlur4Ratio;\nuniform vec2 uTextureRefractionBlur4Size;\nuniform vec2 uTextureRefractionBlur5Ratio;\nuniform vec2 uTextureRefractionBlur5Size;\nuniform vec2 uTextureRefractionBlur6Ratio;\nuniform vec2 uTextureRefractionBlur6Size;\nuniform vec2 uTextureRefractionBlur7Ratio;\nuniform vec2 uTextureRefractionBlur7Size;\n#define SHADER_NAME TextureToBeRefracted\nvec2 re;\nfloat qc(const in float pa) {\n  return pa < .0031308 ? pa * 12.92 : 1.055 * pow(pa, 1. / 2.4) - .055;\n}\nvec3 qc(const in vec3 pa) {\n  return vec3(pa.r < .0031308 ? pa.r * 12.92 : 1.055 * pow(pa.r, 1. / 2.4) - .055, pa.g < .0031308 ? pa.g * 12.92 : 1.055 * pow(pa.g, 1. / 2.4) - .055, pa.b < .0031308 ? pa.b * 12.92 : 1.055 * pow(pa.b, 1. / 2.4) - .055);\n}\nvec4 qc(const in vec4 pa) {\n  return vec4(pa.r < .0031308 ? pa.r * 12.92 : 1.055 * pow(pa.r, 1. / 2.4) - .055, pa.g < .0031308 ? pa.g * 12.92 : 1.055 * pow(pa.g, 1. / 2.4) - .055, pa.b < .0031308 ? pa.b * 12.92 : 1.055 * pow(pa.b, 1. / 2.4) - .055, pa.a);\n}\nfloat qJ(const in float pa) {\n  return pa < .04045 ? pa * (1. / 12.92) : pow((pa + .055) * (1. / 1.055), 2.4);\n}\nvec3 qJ(const in vec3 pa) {\n  return vec3(pa.r < .04045 ? pa.r * (1. / 12.92) : pow((pa.r + .055) * (1. / 1.055), 2.4), pa.g < .04045 ? pa.g * (1. / 12.92) : pow((pa.g + .055) * (1. / 1.055), 2.4), pa.b < .04045 ? pa.b * (1. / 12.92) : pow((pa.b + .055) * (1. / 1.055), 2.4));\n}\nvec4 qJ(const in vec4 pa) {\n  return vec4(pa.r < .04045 ? pa.r * (1. / 12.92) : pow((pa.r + .055) * (1. / 1.055), 2.4), pa.g < .04045 ? pa.g * (1. / 12.92) : pow((pa.g + .055) * (1. / 1.055), 2.4), pa.b < .04045 ? pa.b * (1. / 12.92) : pow((pa.b + .055) * (1. / 1.055), 2.4), pa.a);\n}\nvec3 rk(const in vec4 rgba) {\n  const float rl = 8.;\n  return rgba.rgb * rl * rgba.a;\n}\nconst mat3 rm = mat3(6.0013, -2.7, -1.7995, -1.332, 3.1029, -5.772, .3007, -1.088, 5.6268);\nvec3 rn(const in vec4 ro) {\n  float rp = ro.z * 255. + ro.w;\n  vec3 rq;\n  rq.y = exp2((rp - 127.) / 2.);\n  rq.z = rq.y / ro.y;\n  rq.x = ro.x * rq.z;\n  vec3 rr = rm * rq;\n  return max(rr, .0);\n}\nvec4 rf(const in vec3 pa, const in float rg) {\n  if(rg <= .0)\n    return vec4(pa, 1.);\n  vec4 rh;\n  vec3 ri = pa / rg;\n  rh.a = clamp(max(max(ri.r, ri.g), max(ri.b, 1e-6)), .0, 1.);\n  rh.a = ceil(rh.a * 255.) / 255.;\n  rh.rgb = ri / rh.a;\n  return rh;\n}\nvec3 rj(const in vec4 pa, const in float rg) {\n  if(rg <= .0)\n    return pa.rgb;\n  return rg * pa.rgb * pa.a;\n}\nvec4 us() {\n  vec4 oi = vec4(.0, .0, .0, 1.);\n  re.y /= uTextureOutputRatio.y;\n  float ut = -log2(1. - re.y) + 1.;\n  float uu = floor(ut) - 1.;\n  float uv = pow(2., uu + 1.);\n  re.x = uv * re.x * .5;\n  re.y = uv * (1. - re.y) - 1.;\n  if(re.x > 1. || re.y > 1.)\n    return oi;\n  if(uu < .1) {\n    if(inputRGBM == .0) {\n      oi.rgb = texture2D(TextureRefractionBlur0, min(re, 1. - 1e+0 / uTextureRefractionBlur0Size.xy) * uTextureRefractionBlur0Ratio).rgb;\n    } else {\n      oi.rgb = (vec4(rj(texture2D(TextureRefractionBlur0, min(re, 1. - 1e+0 / uTextureRefractionBlur0Size.xy) * uTextureRefractionBlur0Ratio), uRGBMRange), 1.)).rgb;\n    }\n  } else if(uu < 1.1)\n    oi.rgb = (vec4(rj(texture2D(TextureRefractionBlur1, min(re, 1. - 1e+0 / uTextureRefractionBlur1Size.xy) * uTextureRefractionBlur1Ratio), uRGBMRange), 1.)).rgb;\n  else if(uu < 2.1)\n    oi.rgb = (vec4(rj(texture2D(TextureRefractionBlur2, min(re, 1. - 1e+0 / uTextureRefractionBlur2Size.xy) * uTextureRefractionBlur2Ratio), uRGBMRange), 1.)).rgb;\n  else if(uu < 3.1)\n    oi.rgb = (vec4(rj(texture2D(TextureRefractionBlur3, min(re, 1. - 1e+0 / uTextureRefractionBlur3Size.xy) * uTextureRefractionBlur3Ratio), uRGBMRange), 1.)).rgb;\n  else if(uu < 4.1)\n    oi.rgb = (vec4(rj(texture2D(TextureRefractionBlur4, min(re, 1. - 1e+0 / uTextureRefractionBlur4Size.xy) * uTextureRefractionBlur4Ratio), uRGBMRange), 1.)).rgb;\n  else if(uu < 5.1)\n    oi.rgb = (vec4(rj(texture2D(TextureRefractionBlur5, min(re, 1. - 1e+0 / uTextureRefractionBlur5Size.xy) * uTextureRefractionBlur5Ratio), uRGBMRange), 1.)).rgb;\n  else if(uu < 6.1)\n    oi.rgb = (vec4(rj(texture2D(TextureRefractionBlur6, min(re, 1. - 1e+0 / uTextureRefractionBlur6Size.xy) * uTextureRefractionBlur6Ratio), uRGBMRange), 1.)).rgb;\n  else if(uu < 7.1)\n    oi.rgb = (vec4(rj(texture2D(TextureRefractionBlur7, min(re, 1. - 1e+0 / uTextureRefractionBlur7Size.xy) * uTextureRefractionBlur7Ratio), uRGBMRange), 1.)).rgb;\n  \n  \n  \n  \n  \n  \n  \n  return oi;\n}\nvoid main(void) {\n  re = gl_FragCoord.xy / uTextureOutputSize.xy;\n  vec4 pa = us();\n  pa = rf(pa.rgb, uRGBMRange);\n  gl_FragColor = pa;\n}",
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width: function(e, t) {
                        return t.uTextureOutputSize[0];
                    },
                    height: function(e, t) {
                        return t.uTextureOutputSize[1];
                    }
                }
            }
        }) || this;
    }
    var di, pi = (o(vi, di = Sr), vi.prototype.getMeshCommand = function(e, t) {
        return this.commands.ssr_combine || (this.commands.ssr_combine = this.createREGLCommand(e, null, t.getElements())), 
        this.commands.ssr_combine;
    }, vi);
    function vi() {
        return di.call(this, {
            vert: Tr,
            frag: "#define SHADER_NAME SSR_COMBINE\nprecision mediump float;\nuniform sampler2D TextureInput;\nuniform sampler2D TextureSSR;\nuniform vec2 uTextureOutputSize;\nvoid main() {\n  vec2 nU = gl_FragCoord.xy / uTextureOutputSize;\n  vec4 uq = texture2D(TextureInput, nU);\n  vec4 ur = texture2D(TextureSSR, nU);\n  gl_FragColor = mix(uq, ur, ur.a);\n}",
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width: function(e, t) {
                        return t.uTextureOutputSize[0];
                    },
                    height: function(e, t) {
                        return t.uTextureOutputSize[1];
                    }
                }
            }
        }) || this;
    }
    var mi, gi = function() {
        function e(e) {
            this._regl = e, this._renderer = new ut(e), this._inputRGBM = 0;
        }
        e.getUniformDeclares = function() {
            var i = [ [ 0, 0, 0, 0 ], [ 0, 0, 0, 0 ] ], n = new Array(16);
            return [ {
                name: "uInvProjMatrix",
                type: "function",
                fn: function(e, t) {
                    return x(n, t.projMatrix);
                }
            }, {
                name: "uTaaCornersCSLeft",
                type: "array",
                length: 2,
                fn: function(e, t) {
                    var n = Math.tan(.5 * t.fov), r = t.uGlobalTexSize[0] / t.uGlobalTexSize[1] * n;
                    return ee(i[0], r, n, r, -n), ee(i[1], -r, n, -r, -n), i;
                }
            }, {
                name: "uReprojectViewProj",
                type: "function",
                fn: function(e, t) {
                    return Y([], t.prevProjViewMatrix, t.cameraWorldMatrix);
                }
            } ];
        }, e.getDefines = function() {
            return {
                HAS_SSR: 1
            };
        };
        var t = e.prototype;
        return t.setup = function(e) {
            this._initShaders(), this._createTextures(e);
        }, t.combine = function(e, t) {
            return this.setup(e), this._combineFBO.width === e.width && this._combineFBO.height === e.height || this._combineFBO.resize(e.width, e.height), 
            this._renderer.render(this._combineShader, {
                TextureInput: e,
                TextureSSR: t,
                uTextureOutputSize: [ e.width, e.height ]
            }, null, this._combineFBO), this._combineTex;
        }, t.genMipMap = function(e) {
            return this._ssrBlur(e), this._outputTex;
        }, t._ssrBlur = function(e) {
            var t = this._targetFBO, n = Math.ceil(.5 * e.width), r = Math.ceil(.5 * e.height);
            t.width === n && t.height === r || t.resize(n, r);
            var i = this._blurUniforms;
            (i = i || (this._blurUniforms = {
                uRGBMRange: 7,
                uTextureOutputSize: [ 0, 0 ]
            })).TextureBlurInput = e, i.inputRGBM = +this._inputRGBM, Ne(i.uTextureOutputSize, t.width, t.height), 
            i.TextureBlurInput = e, this._renderer.render(this._ssrQuadShader, i, null, t);
        }, t.getMipmapTexture = function() {
            return this._outputTex || (this._outputTex = this._renderer.regl.texture({
                type: "uint8",
                width: 2,
                height: 2
            })), this._outputTex;
        }, t.dispose = function() {
            this._combineShader && (this._mipmapShader.dispose(), this._ssrQuadShader.dispose(), 
            this._targetFBO.destroy(), this._combineFBO.destroy(), this._blurFBO.destroy(), 
            delete this._combineShader);
        }, t._initShaders = function() {
            if (!this._combineShader) {
                this._mipmapShader = new li(), this._combineShader = new pi();
                var e = {
                    vert: Tr,
                    frag: "#version 100\nprecision mediump float;\nuniform float uRGBMRange;\nuniform sampler2D TextureBlurInput;\nuniform vec2 uTextureOutputSize;\nuniform float inputRGBM;\n#define SHADER_NAME QUAD\nvec2 re;\nvec4 rf(const in vec3 pa, const in float rg) {\n  vec4 rh;\n  vec3 ri = pa / rg;\n  rh.a = clamp(max(max(ri.r, ri.g), max(ri.b, 1e-6)), .0, 1.);\n  rh.a = ceil(rh.a * 255.) / 255.;\n  rh.rgb = ri / rh.a;\n  return rh;\n}\nvec3 rj(const in vec4 pa, const in float rg) {\n  if(inputRGBM == .0)\n    return pa.rgb;\n  return rg * pa.rgb * pa.a;\n}\nvoid main(void) {\n  re = gl_FragCoord.xy / uTextureOutputSize.xy;\n  vec3 pa = rj(texture2D(TextureBlurInput, re.xy), uRGBMRange);\n  gl_FragColor = rf(pa.rgb, uRGBMRange);\n}",
                    extraCommandProps: {
                        viewport: {
                            x: 0,
                            y: 0,
                            width: function(e, t) {
                                return t.uTextureOutputSize[0];
                            },
                            height: function(e, t) {
                                return t.uTextureOutputSize[1];
                            }
                        }
                    }
                };
                this._ssrQuadShader = new Sr(e);
            }
        }, t._createTextures = function(e) {
            if (!this._targetFBO) {
                var t = this._regl;
                this._outputTex && this._outputTex.destroy(), this._outputTex = t.texture({
                    min: "linear",
                    mag: "linear",
                    type: "uint8",
                    width: e.width,
                    height: e.height
                }), this._targetFBO = t.framebuffer({
                    width: e.width,
                    height: e.height,
                    colors: [ this._outputTex ],
                    depth: !1,
                    stencil: !1
                }), this._combineTex = t.texture({
                    min: "linear",
                    mag: "linear",
                    type: "uint8",
                    width: e.width,
                    height: e.height
                }), this._combineFBO = t.framebuffer({
                    width: e.width,
                    height: e.height,
                    colors: [ this._combineTex ],
                    depth: !1,
                    stencil: !1
                }), this._blurTex = t.texture({
                    min: "linear",
                    mag: "linear",
                    type: "uint8",
                    width: e.width,
                    height: e.height
                }), this._blurFBO = t.framebuffer({
                    width: e.width,
                    height: e.height,
                    colors: [ this._blurTex ],
                    depth: !1,
                    stencil: !1
                });
            }
        }, e;
    }(), _i = ((mi = xi.prototype).render = function(e, t, n) {
        var r = n.projViewMatrix, i = n.lineColor, a = n.lineWidth;
        if (e && e.length) {
            this._clear(), this._resize(t);
            var o = new qn(e);
            this._drawExtent(o, r), this._drawOutline(i, a, t);
        }
    }, mi._init = function() {
        var e = this;
        this.fboExtent = this._createFBO();
        var t = {
            x: 0,
            y: 0,
            width: function() {
                return e.fboExtent.width;
            },
            height: function() {
                return e.fboExtent.height;
            }
        };
        this.extentShader = new lr({
            vert: "attribute vec3 aPosition;\nuniform mat4 projViewMatrix;\nuniform mat4 modelMatrix;\nuniform mat4 positionMatrix;\n#include <get_output>  \nvoid main() {\n  mat4 pX = getPositionMatrix();\n  gl_Position = projViewMatrix * modelMatrix * pX * getPosition(aPosition);\n}",
            frag: "precision highp float;\nvoid main() {\n  gl_FragColor = vec4(.0, .0, .0, 1.);\n}",
            positionAttribute: "POSITION",
            extraCommandProps: {
                viewport: t,
                cull: {
                    enable: !1
                }
            }
        }), this.outlineShader = new Sr({
            vert: Tr,
            frag: "precision highp float;\nprecision highp int;\nvarying vec2 vTexCoord;\nuniform sampler2D maskTexture;\nuniform vec2 texSize;\nuniform vec3 visibleEdgeColor;\nuniform float lineWidth;\nvoid main() {\n  vec2 rG = (1. / texSize) * lineWidth;\n  vec4 rH = vec4(1., .0, .0, 1.) * vec4(rG.x, rG.y, rG.x, rG.y);\n  vec4 rI = texture2D(maskTexture, vTexCoord + rH.xy);\n  vec4 rJ = texture2D(maskTexture, vTexCoord - rH.xy);\n  vec4 rK = texture2D(maskTexture, vTexCoord + rH.yw);\n  vec4 rL = texture2D(maskTexture, vTexCoord - rH.yw);\n  float rM = (rI.r - rJ.r) * .7;\n  float rN = (rK.r - rL.r) * .7;\n  float pM = length(vec2(rM, rN));\n  float rO = min(rI.g, rJ.g);\n  float rP = min(rK.g, rL.g);\n  float rQ = min(rO, rP);\n  gl_FragColor = 1. - rQ > .001 ? vec4(visibleEdgeColor, 1.) * vec4(pM) : vec4(.0);\n}",
            uniforms: [ "texSize", "visibleEdgeColor", "maskTexture", "lineWidth" ],
            positionAttribute: "POSITION",
            extraCommandProps: {
                viewport: t,
                depth: {
                    enable: !0,
                    mask: !1,
                    func: "always"
                },
                blend: {
                    enable: !0,
                    func: {
                        src: "one",
                        dst: "one minus src alpha"
                    },
                    equation: "add"
                }
            }
        });
    }, mi._drawExtent = function(e, t) {
        this._renderer.render(this.extentShader, {
            projViewMatrix: t
        }, e, this.fboExtent);
    }, mi._drawOutline = function(e, t, n) {
        this._renderer.render(this.outlineShader, {
            texSize: [ n.width, n.height ],
            visibleEdgeColor: e || [ 1, 0, 0 ],
            maskTexture: this.fboExtent,
            lineWidth: t || 1
        }, null, n);
    }, mi._createFBO = function() {
        return this.regl.framebuffer({
            color: this.regl.texture({
                width: 2,
                height: 2,
                wrap: "clamp",
                mag: "linear",
                min: "linear"
            }),
            depth: !0
        });
    }, mi._clear = function() {
        this.regl.clear({
            color: [ 1, 1, 1, 1 ],
            depth: 1,
            framebuffer: this.fboExtent
        });
    }, mi.dispose = function() {
        this.fboExtent && (this.fboExtent.destroy(), this.extentShader.dispose(), this.outlineShader.dispose(), 
        delete this.fboExtent);
    }, mi._resize = function(e) {
        var t = e.width, n = e.height;
        this.fboExtent.width === t && this.fboExtent.height === n || this.fboExtent.resize(t, n);
    }, xi);
    function xi(e) {
        this._renderer = e, this.regl = e.regl, this._init();
    }
    var bi, yi = ((bi = Ai.prototype)._init = function() {
        this._depthFBOViewport = this._viewport, this._depthShader = new lr({
            vert: "attribute vec3 aPosition;\nuniform mat4 projViewMatrix;\nuniform mat4 modelMatrix;\nuniform mat4 positionMatrix;\n#include <get_output>\nvoid main() {\n  mat4 pX = getPositionMatrix();\n  gl_Position = projViewMatrix * modelMatrix * pX * getPosition(aPosition);\n}",
            frag: "#ifdef GL_ES\nprecision highp float;\n#endif\nvec4 rR(float rS) {\n  const vec4 rT = vec4(1., 256., 256. * 256., 256. * 256. * 256.);\n  const vec4 rU = vec4(1. / 256., 1. / 256., 1. / 256., .0);\n  vec4 rV = fract(rS * rT);\n  rV -= rV.gbaa * rU;\n  return rV;\n}\nvoid main() {\n  gl_FragColor = rR(gl_FragCoord.z);\n}",
            extraCommandProps: {
                viewport: this._depthFBOViewport
            }
        }), this._depthFBO = this.renderer.regl.framebuffer({
            color: this.renderer.regl.texture({
                width: this._width,
                height: this._height,
                wrap: "clamp",
                mag: "linear",
                min: "linear"
            }),
            depth: !0
        });
    }, bi.render = function(e, t) {
        this._resize(), this.renderer.clear({
            color: [ 1, 0, 0, 1 ],
            depth: 1,
            framebuffer: this._depthFBO
        });
        var n = new qn(e), r = t.eyePos, i = t.lookPoint, a = t.verticalAngle, o = t.horizonAngle, s = this._createProjViewMatrix(r, i, a, o);
        return this._renderDepth(n, s), {
            depthMap: this._depthFBO,
            projViewMatrixFromViewpoint: s
        };
    }, bi._renderDepth = function(e, t) {
        var n = {
            projViewMatrix: t
        };
        this.renderer.render(this._depthShader, n, e, this._depthFBO);
    }, bi._createProjViewMatrix = function(e, t, n, r) {
        var i = n / r, a = Math.sqrt(Math.pow(e[0] - t[0], 2) + Math.pow(e[1] - t[1], 2) + Math.pow(e[2] - t[2], 2));
        return Y([], g([], r * Math.PI / 180, i, 1, a), K([], e, t, [ 0, 1, 0 ]));
    }, bi.dispose = function() {
        this._depthFBO && this._depthFBO.destroy();
    }, bi._resize = function() {
        this._width = He(this._viewport.width.data) ? this._viewport.width.data() : this._viewport.width, 
        this._height = He(this._viewport.height.data) ? this._viewport.height.data() : this._viewport.height, 
        !this._depthFBO || this._depthFBO.width === this._width && this._depthFBO.height === this._height || this._depthFBO.resize(this._width, this._height);
    }, Ai);
    function Ai(e, t) {
        this.renderer = e, this._viewport = t, this._width = 1, this._height = 1, this._init();
    }
    var Ti, Ei = (o(Mi, Ti = lr), Mi);
    function Mi(e) {
        var t = e && e.extraCommandProps || {};
        return Ti.call(this, {
            vert: "#define SHADER_NAME HEATMAP\nfloat to(const vec2 tp, const float t) {\n  return mix(tp[0], tp[1], t);\n}\nuniform mat4 projViewModelMatrix;\nuniform float extrudeScale;\nuniform float heatmapIntensity;\nattribute vec3 aPosition;\nvarying vec2 vExtrude;\n#ifdef HAS_HEAT_WEIGHT\nuniform lowp float heatmapWeightT;\nattribute highp vec2 aWeight;\nvarying highp float weight;\n#else\nuniform highp float heatmapWeight;\n#endif\nuniform mediump float heatmapRadius;\nconst highp float tq = 1. / 255. / 16.;\n#define GAUSS_COEF 0.3989422804014327\nvoid main(void) {\n  \n#ifdef HAS_HEAT_WEIGHT\nweight = to(aWeight, heatmapWeightT);\n#else\nhighp float oh = heatmapWeight;\n#endif\nmediump float tr = heatmapRadius;\n  vec2 ts = vec2(mod(aPosition.xy, 2.) * 2. - 1.);\n  float tt = sqrt(-2. * log(tq / oh / heatmapIntensity / GAUSS_COEF)) / 3.;\n  vExtrude = tt * ts;\n  vec2 tu = vExtrude * tr * extrudeScale;\n  vec4 nL = vec4(floor(aPosition.xy * .5) + tu, aPosition.z, 1);\n  gl_Position = projViewModelMatrix * nL;\n}",
            frag: "#define SHADER_NAME HEATMAP\nprecision mediump float;\nuniform highp float heatmapIntensity;\nvarying vec2 vExtrude;\n#ifdef HAS_HEAT_WEIGHT\nvarying highp float weight;\n#else\nuniform highp float heatmapWeight;\n#endif\n#define GAUSS_COEF 0.3989422804014327\nvoid main() {\n  \n#ifndef HAS_HEAT_WEIGHT\nhighp float oh = heatmapWeight;\n#endif\nfloat pM = -.5 * 3. * 3. * dot(vExtrude, vExtrude);\n  float tn = oh * heatmapIntensity * GAUSS_COEF * exp(pM);\n  gl_FragColor = vec4(tn, 1., 1., 1.);\n}",
            uniforms: [ {
                name: "extrudeScale",
                type: "function",
                fn: function(e, t) {
                    return t.resolution / t.dataResolution * t.tileRatio;
                }
            }, {
                name: "projViewModelMatrix",
                type: "function",
                fn: function(e, t) {
                    return Y([], t.projViewMatrix, t.modelMatrix);
                }
            } ],
            extraCommandProps: ke({}, t, {
                blend: {
                    enable: !0,
                    func: {
                        src: "one",
                        dst: "one"
                    },
                    equation: "add"
                }
            })
        }) || this;
    }
    var Si, wi = [ -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, 1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, 1, 1, -1, 1, -1, -1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, 1, 1, -1, 1, -1, -1, 1, -1, 1, -1, 1, 1, -1, 1, 1, 1, 1, 1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, 1, -1, 1 ], Ri = "#if __VERSION__ == 100\n#ifdef GL_EXT_shader_texture_lod\n#extension GL_EXT_shader_texture_lod : enable\n#define textureCubeLod(tex, uv, lod) textureCubeLodEXT(tex, uv, lod)\n#else\n#define textureCubeLod(tex, uv, lod) textureCube(tex, uv, lod)\n#endif\n#else\n#define textureCubeLod(tex, uv, lod) textureLod(tex, uv, lod)\n#endif\nprecision highp float;\n#include <gl2_frag>\n#include <hsv_frag>\nuniform vec3 hsv;\nvarying vec3 vWorldPos;\n#ifdef USE_AMBIENT\nuniform vec3 diffuseSPH[9];\n#else\nuniform samplerCube cubeMap;\nuniform float bias;\nuniform float size;\nuniform float environmentExposure;\n#endif\n#if defined(INPUT_RGBM) || defined(ENC_RGBM)\nuniform float rgbmRange;\n#endif\nvec4 rf(const in vec3 pa, const in float rg) {\n  if(rg <= .0)\n    return vec4(pa, 1.);\n  vec4 rh;\n  vec3 ri = pa / rg;\n  rh.a = clamp(max(max(ri.r, ri.g), max(ri.b, 1e-6)), .0, 1.);\n  rh.a = ceil(rh.a * 255.) / 255.;\n  rh.rgb = ri / rh.a;\n  return rh;\n}\nvec3 rj(const in vec4 pa, const in float rg) {\n  if(rg <= .0)\n    return pa.rgb;\n  return rg * pa.rgb * pa.a;\n}\nvec4 rW(const in samplerCube rX, const in vec3 rY, const in float rZ, const in float sa) {\n  vec3 sb = rY;\n  return textureCubeLod(rX, sb, sa);\n}\nvec3 sc(const in vec3 qa, const in vec3 sd[9]) {\n  float x = qa.x;\n  float y = qa.y;\n  float z = qa.z;\n  vec3 oi = (sd[0] + sd[1] * x + sd[2] * y + sd[3] * z + sd[4] * z * x + sd[5] * y * z + sd[6] * y * x + sd[7] * (3. * z * z - 1.) + sd[8] * (x * x - y * y));\n  return max(oi, vec3(.0));\n}\nfloat qB(const in vec2 qC) {\n  vec3 qD = fract(vec3(qC.xyx) * .1031);\n  qD += dot(qD, qD.yzx + 19.19);\n  return fract((qD.x + qD.y) * qD.z);\n}\nvoid main() {\n  vec4 se;\n#ifdef USE_AMBIENT\nvec3 qa = normalize(vWorldPos + mix(-.5 / 255., .5 / 255., qB(gl_FragCoord.xy)) * 2.);\n  se = vec4(sc(qa, diffuseSPH), 1.);\n  if(length(hsv) > .0) {\n    se.rgb = hsv_apply(se.rgb, hsv);\n  }\n#ifdef ENC_RGBM\nse = rf(se.rgb, rgbmRange);\n#endif\n#else\nse = rW(cubeMap, normalize(vWorldPos), size, bias);\n  se.rgb *= environmentExposure;\n#endif\n#ifdef ENC_RGBM\n#if !defined(USE_AMBIENT) && defined(INPUT_RGBM)\nif(length(hsv) > .0) {\n    se.rgb = hsv_apply(rj(se, rgbmRange).rgb, hsv);\n    se = rf(se.rgb, rgbmRange);\n  }\n#endif\nglFragColor = vec4(clamp(se.rgb, .0, 1., 1.));\n#elif !defined(USE_AMBIENT) && defined(INPUT_RGBM)\nglFragColor = vec4(rj(se, rgbmRange), 1.);\n  if(length(hsv) > .0) {\n    glFragColor.rgb = hsv_apply(clamp(glFragColor.rgb, .0, 1.), hsv);\n  }\n#else\nif(length(hsv) > .0) {\n    se.rgb = hsv_apply(se.rgb, hsv);\n  }\n  glFragColor = se;\n#endif\n#if __VERSION__ == 100\ngl_FragColor = glFragColor;\n#endif\n}", Oi = function(t) {
        function e() {
            var e;
            return (e = t.call(this, {
                vert: "#include <gl2_vert>\nattribute vec3 aPosition;\nuniform mat4 projMatrix;\nuniform mat4 viewMatrix;\nvarying vec3 vWorldPos;\nvoid main() {\n  vWorldPos = aPosition;\n  mat4 tv = mat4(mat3(viewMatrix));\n  vec4 tw = projMatrix * tv * vec4(vWorldPos, 1.);\n  gl_Position = tw.xyww;\n}",
                frag: Ri,
                extraCommandProps: {
                    depth: {
                        enable: !0,
                        range: [ 1, 1 ],
                        func: "lequal"
                    },
                    viewport: {
                        x: 0,
                        y: 0,
                        width: function(e, t) {
                            return t.resolution[0];
                        },
                        height: function(e, t) {
                            return t.resolution[1];
                        }
                    }
                }
            }) || this).version = 300, e;
        }
        o(e, t);
        var n = e.prototype;
        return n.setMode = function(e, t, n) {
            var r = {};
            return e && (r.INPUT_RGBM = 1), t && (r.ENC_RGBM = 1), 0 === n && (r.USE_AMBIENT = 1), 
            this._skyboxMesh ? this._skyboxMesh[0].setDefines(r) : this._meshDefines = r, this;
        }, n.draw = function(e) {
            return this._skyboxMesh || this._createSkyboxMesh(e), t.prototype.draw.call(this, e, this._skyboxMesh);
        }, n._createSkyboxMesh = function(e) {
            var t = new It({
                aPosition: new Int8Array(wi)
            }, null, wi.length / 3);
            t.generateBuffers(e), this._skyboxMesh = [ new fn(t) ], this._meshDefines && (this._skyboxMesh[0].setDefines(this._meshDefines), 
            delete this._meshDefines);
        }, n.dispose = function() {
            if (this._skyboxMesh) {
                var e = this._skyboxMesh[0];
                e.geometry.dispose(), e.dispose();
            }
            return delete this._skyboxMesh, t.prototype.dispose.call(this);
        }, e;
    }(lr), Ci = (o(Bi, Si = lr), Bi);
    function Bi(e) {
        var t = {
            blend: {
                enable: !0,
                func: {
                    src: "one",
                    dst: "one minus src alpha"
                },
                equation: "add"
            },
            viewport: {
                x: 0,
                y: 0,
                width: function(e, t) {
                    return t.inputTexture.width;
                },
                height: function(e, t) {
                    return t.inputTexture.height;
                }
            }
        };
        return e && e.extraCommandProps && ke(t, e.extraCommandProps), Si.call(this, {
            vert: "#define SHADER_NAME HEATMAP_DISPLAY\nuniform mat4 projViewModelMatrix;\nattribute vec3 aPosition;\nvoid main() {\n  gl_Position = projViewModelMatrix * vec4(aPosition, 1.);\n}",
            frag: "#define SHADER_NAME HEATMAP_DISPLAY\nprecision mediump float;\nuniform sampler2D inputTexture;\nuniform sampler2D colorRamp;\nuniform vec2 textureOutputSize;\nuniform float heatmapOpacity;\nvoid main() {\n  vec2 re = gl_FragCoord.xy / textureOutputSize.xy;\n  float t = texture2D(inputTexture, re).r;\n  vec4 pa = texture2D(colorRamp, vec2(t, .5));\n  gl_FragColor = pa * heatmapOpacity;\n}",
            uniforms: [ {
                name: "projViewModelMatrix",
                type: "function",
                fn: function(e, t) {
                    return Y([], t.projViewMatrix, t.modelMatrix);
                }
            }, {
                name: "textureOutputSize",
                type: "function",
                fn: function(e) {
                    return [ e.drawingBufferWidth, e.drawingBufferHeight ];
                }
            } ],
            extraCommandProps: t
        }) || this;
    }
    var Fi, Pi = (o(Ii, Fi = lr), Ii);
    function Ii(e) {
        return void 0 === e && (e = {}), Fi.call(this, {
            vert: "precision highp float;\nprecision highp sampler2D;\nconst float nH = 3.141592653589793;\nuniform mat4 projMatrix;\nuniform mat4 viewMatrix;\nuniform mat4 modelMatrix;\nattribute vec3 aPosition;\nattribute vec2 aTexCoord;\nattribute vec3 aNormal;\nvarying vec2 vuv;\nvarying vec3 vpos;\nvarying vec3 vnormal;\nvarying mat3 vtbnMatrix;\nvec4 nI(mat4 nJ, mat4 nK, vec3 nL) {\n  return nJ * modelMatrix * nK * vec4(nL, 1.);\n}\nvec3 nM(in vec3 nL, in vec3 nN) {\n  return normalize(nL + nN);\n}\nmat3 nO(in vec3 nP) {\n  vec3 t = normalize(cross(vec3(.0, .0, 1.), nP));\n  vec3 b = normalize(cross(nP, t));\n  return mat3(t, b, nP);\n}\nvoid nQ() {\n  \n}\nvoid main(void) {\n  vuv = aTexCoord;\n  vpos = (modelMatrix * vec4(aPosition, 1.)).xyz;\n  vnormal = aNormal;\n  vtbnMatrix = nO(vnormal);\n  gl_Position = nI(projMatrix, viewMatrix, vpos);\n  nQ();\n}",
            frag: "precision highp float;\nprecision highp sampler2D;\nuniform sampler2D texWaveNormal;\nuniform sampler2D texWavePerturbation;\nuniform vec3 octaveTextureRepeat;\nuniform vec4 waveParams;\nuniform vec2 waveDirection;\nuniform vec4 waterColor;\nuniform vec3 lightingDirection;\nuniform vec3 lightingIntensity;\nuniform vec3 camPos;\nuniform float timeElapsed;\nvarying vec2 vuv;\nvarying vec3 vpos;\nvarying vec3 vnormal;\nvarying mat3 vtbnMatrix;\nconst vec2 nR = vec2(6. / 25., 5. / 24.);\nvec2 nS(sampler2D nT, vec2 nU) {\n  return 2. * texture2D(nT, nU).rg - 1.;\n}\nfloat nV(vec2 nU) {\n  return texture2D(texWavePerturbation, nU).b;\n}\nvec3 nW(sampler2D nT, vec2 nU) {\n  return 2. * texture2D(nT, nU).rgb - 1.;\n}\nfloat nX(vec2 nU, float nY) {\n  return fract(nY);\n}\nfloat nZ(vec2 nU, float nY) {\n  float oa = nX(nU, nY);\n  return 1. - abs(1. - 2. * oa);\n}\nvec3 ob(sampler2D oc, vec2 nU, float nY, float od) {\n  float oe = waveParams[2];\n  float of = waveParams[3];\n  vec2 og = nS(oc, nU) * oe;\n  float oa = nX(nU, nY + od);\n  float oh = nZ(nU, nY + od);\n  vec2 oi = nU;\n  oi -= og * (oa + of);\n  oi += od;\n  oi += (nY - oa) * nR;\n  return vec3(oi, oh);\n}\nconst float oj = .3737;\nconst float ok = 7.77;\nvec3 ol(sampler2D om, sampler2D on, vec2 nU, vec2 oo, float nY) {\n  float op = waveParams[0];\n  vec2 oq = nY * -oo;\n  float or = nV(nU * oj) * ok;\n  vec3 os = ob(on, nU + oq, nY + or, .0);\n  vec3 ot = ob(on, nU + oq, nY + or, .5);\n  vec3 ou = nW(om, os.xy) * os.z;\n  vec3 ov = nW(om, ot.xy) * ot.z;\n  vec3 ow = normalize(ou + ov);\n  ow.xy *= op;\n  ow.z = sqrt(1. - dot(ow.xy, ow.xy));\n  return ow;\n}\nvec3 ox(vec2 nU, float nY) {\n  float oy = waveParams[1];\n  return ol(texWaveNormal, texWavePerturbation, nU * oy, waveDirection, nY);\n}\nconst float nH = 3.141592653589793;\nconst float oz = 1. / nH;\nconst float oA = .3183098861837907;\nconst float oB = 1.570796326794897;\nstruct PBRShadingWater {\n  float NdotL;\n  float NdotV;\n  float NdotH;\n  float VdotH;\n  float LdotH;\n  float VdotN;\n};\nfloat oC = 2.2;\nvec3 oD(float oE, vec3 oF, float oG) {\n  return oF + (oG - oF) * pow(1. - oE, 5.);\n}\nfloat oH(float oI, float oJ) {\n  float oK = oJ * oJ;\n  float oL = oI * oI;\n  float oM = pow((oL * (oK - 1.) + 1.), oC) * nH;\n  return oK / oM;\n}\nfloat oN(float oO) {\n  return .25 / (oO * oO);\n}\nvec3 oP(in PBRShadingWater oQ, float oJ, vec3 oR, float oS) {\n  vec3 oT = oD(oQ.VdotH, oR, oS);\n  float oU = oH(oQ.NdotH, oJ);\n  float oV = oN(oQ.LdotH);\n  return (oU * oV) * oT;\n}\nvec3 oW(const vec3 x) {\n  return (x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14);\n}\nconst float oX = 2.2;\nconst float oY = .4545454545;\nvec4 oZ(vec4 pa) {\n  return vec4(pow(pa.rgb, vec3(oY)), pa.w);\n}\nvec3 pb(vec3 pa) {\n  return pow(pa, vec3(oX));\n}\nconst vec3 pc = vec3(.02, 1., 5.);\nconst vec2 pd = vec2(.02, .1);\nconst float oJ = .06;\nconst vec3 pe = vec3(0, .6, .9);\nconst vec3 pf = vec3(.72, .92, 1.);\nPBRShadingWater pg;\nvec3 ph(in float pi, in vec3 pj, in vec3 pk) {\n  float pl = pow((1. - pi), pc[2]);\n  return mix(pk, pj, pl);\n}\nvec3 pm(in vec3 nP, in vec3 pn, in vec3 po, vec3 pa, in vec3 pp, in vec3 pq, in float pr) {\n  vec3 ps = pb(pa);\n  vec3 pt = normalize(po + pn);\n  pg.NdotL = clamp(dot(nP, po), .0, 1.);\n  pg.NdotV = clamp(dot(nP, pn), .001, 1.);\n  pg.VdotN = clamp(dot(pn, nP), .001, 1.);\n  pg.NdotH = clamp(dot(nP, pt), .0, 1.);\n  pg.VdotH = clamp(dot(pn, pt), .0, 1.);\n  pg.LdotH = clamp(dot(po, pt), .0, 1.);\n  float pu = max(dot(pq, pn), .0);\n  vec3 pv = pb(pf);\n  vec3 pw = pb(pe);\n  vec3 pf = ph(pu, pv, pw);\n  float px = max(dot(pq, po), .0);\n  pf *= .1 + px * .9;\n  float py = clamp(pr, .8, 1.);\n  vec3 pz = oD(pg.VdotN, vec3(pc[0]), pc[1]) * pf * py;\n  vec3 pA = ps * mix(pf, px * pp * oz, 2. / 3.) * py;\n  vec3 pB = vec3(.0);\n  if(pu > .0 && px > .0) {\n    vec3 pC = oP(pg, oJ, vec3(pd[0]), pd[1]);\n    vec3 pD = pp * oz * pr;\n    pB = pg.NdotL * pD * pC;\n  }\n  return oW(pz + pA + pB);\n}\nvoid main() {\n  vec3 pq = vnormal;\n  vec3 pE = ox(vuv, timeElapsed);\n  vec3 nP = normalize(vtbnMatrix * pE);\n  vec3 pn = -normalize(vpos - camPos);\n  vec3 po = normalize(-lightingDirection);\n  float pr = 1.;\n  vec4 pF = vec4(pm(nP, pn, po, waterColor.rgb, lightingIntensity, pq, pr), waterColor.w);\n  gl_FragColor = oZ(pF);\n}",
            defines: e.defines || {},
            extraCommandProps: e.extraCommandProps || {}
        }) || this;
    }
    var Di = "undefined" != typeof Promise ? Promise : Sn, Ni = {
        get: function(t, i) {
            var a = Ni._getClient(), e = new Di(function(n, r) {
                if (a.open("GET", t, !0), i) {
                    for (var e in i.headers) a.setRequestHeader(e, i.headers[e]);
                    a.withCredentials = "include" === i.credentials, i.responseType && (a.responseType = i.responseType);
                }
                a.onreadystatechange = Ni._wrapCallback(a, function(e, t) {
                    e ? r(e) : n(t);
                }), a.send(null);
            });
            return e.xhr = a, e;
        },
        _wrapCallback: function(e, t) {
            return function() {
                if (4 === e.readyState) if (200 === e.status) "arraybuffer" === e.responseType ? 0 === e.response.byteLength ? t(new Error("http status 200 returned without content.")) : t(null, {
                    data: e.response,
                    cacheControl: e.getResponseHeader("Cache-Control"),
                    expires: e.getResponseHeader("Expires"),
                    contentType: e.getResponseHeader("Content-Type")
                }) : t(null, e.responseText); else {
                    if (0 === e.status) return;
                    t(new Error(e.statusText + "," + e.status));
                }
            };
        },
        _getClient: function() {
            var t;
            try {
                t = new XMLHttpRequest();
            } catch (e) {
                try {
                    t = new ActiveXObject("Msxml2.XMLHTTP");
                } catch (e) {
                    try {
                        t = new ActiveXObject("Microsoft.XMLHTTP");
                    } catch (t) {}
                }
            }
            return t;
        },
        getArrayBuffer: function(e, t) {
            return (t = t || {}).responseType = "arraybuffer", Ni.get(e, t);
        }
    };
    function Li(e) {
        return null == e;
    }
    function Ui(e) {
        return !Li(e);
    }
    function qi(e) {
        return "number" == typeof e && isFinite(e);
    }
    function zi(e) {
        for (var t = 1; t < arguments.length; t++) {
            var n = arguments[t];
            for (var r in n) e[r] = n[r];
        }
        return e;
    }
    function Gi(e) {
        switch (e) {
          case 5120:
            return Int8Array;

          case 5121:
            return Uint8Array;

          case 5122:
            return Int16Array;

          case 5123:
            return Uint16Array;

          case 5124:
            return Int32Array;

          case 5125:
            return Uint32Array;

          case 5126:
            return Float32Array;
        }
        throw new Error("unsupported bufferView's component type: " + e);
    }
    Ni.getJSON = function(e, t) {
        var n = Ni.get(e, t), r = n.then(function(e) {
            return e ? JSON.parse(e) : null;
        });
        return r.xhr = n.xhr, r;
    };
    var Hi, Vi = ((Hi = ki.prototype).iterate = function(e, t) {
        var n = this.gltf[t];
        if (n) {
            var r = 0;
            for (var i in n) e(i, n[i], r++);
        }
    }, Hi.createNode = function(e, t) {
        var n = {};
        return Ui(e.name) && (n.name = e.name), Ui(e.children) && (n.children = e.children), 
        Ui(e.jointName) && (n.jointName = e.jointName), Ui(e.matrix) && (n.matrix = e.matrix), 
        Ui(e.rotation) && (n.rotation = e.rotation), Ui(e.scale) && (n.scale = e.scale), 
        Ui(e.translation) && (n.translation = e.translation), Ui(e.extras) && (n.extras = e.extras), 
        Ui(e.meshes) && (n.meshes = e.meshes.map(function(e) {
            return t[e];
        })), n;
    }, Hi.getBaseColorTexture = function(e) {
        var t, n, r = this.gltf.materials[e];
        if (void 0 === (n = r.instanceTechnique && r.instanceTechnique.values ? (t = r.instanceTechnique).values.diffuse : (t = r).values.tex || t.values.diffuseTex || t.values.diffuse) || void 0 === this.gltf.textures) return null;
        var i = this.gltf.textures[n];
        if (!i) return null;
        var a = this.gltf.samplers[i.sampler];
        return {
            format: i.format || 6408,
            internalFormat: i.internalFormat || 6408,
            type: i.type || 5121,
            sampler: a,
            source: this.gltf.images[i.source]
        };
    }, Hi.getMaterial = function() {
        return null;
    }, Hi.getAnimations = function() {
        return null;
    }, ki);
    function ki(e, t) {
        this.rootPath = e, this.gltf = t;
    }
    var ji, Wi = [ "SCALAR", 1, "VEC2", 2, "VEC3", 3, "VEC4", 4, "MAT2", 4, "MAT3", 9, "MAT4", 16 ], Xi = ((ji = Yi.prototype)._requestData = function(n, r) {
        var i = this, e = this.gltf, t = e.accessors[r], a = e.bufferViews[t.bufferView], o = e.buffers[a.buffer];
        if ("binary_glTF" !== a.buffer && "KHR_binary_glTF" !== a.buffer && o.uri) {
            var s = o.uri, u = 0 === o.uri.indexOf("data:application/") ? o.uri : this.rootPath + "/" + s;
            return this.requests[u] ? this.requests[u].then(function() {
                return i._toBufferData(n, r, i.buffers[u]);
            }) : this.requests[u] = Ni.getArrayBuffer(u, null).then(function(e) {
                var t = e.data;
                return i.buffers[u] = t, i._toBufferData(n, r, t);
            });
        }
        var f = this._toBufferData(n, r, this.glbBuffer.buffer, this.ignoreGLBOffset ? 0 : this.glbBuffer.byteOffset);
        return Di.resolve(f);
    }, ji._toBufferData = function(e, t, n, r) {
        void 0 === r && (r = 0);
        var i = this.gltf, a = i.accessors[t], o = i.bufferViews[a.bufferView], s = (o.byteOffset || 0) + r, u = this._getTypeItemSize(a.type), f = Gi(a.componentType), c = f.BYTES_PER_ELEMENT, l = o.byteStride || 0;
        l === c * u && (l = 0);
        var h = {
            array: void 0,
            name: e,
            accessorName: t,
            bufferView: a.bufferView,
            byteOffset: l && a.byteOffset || 0,
            byteStride: l,
            byteLength: a.count * u * f.BYTES_PER_ELEMENT,
            componentType: a.componentType,
            count: a.count,
            type: a.type,
            itemSize: u
        };
        if (a.min && (h.min = a.min), a.max && (h.max = a.max), 0 === l) {
            var d = s + (a.byteOffset || 0);
            d % f.BYTES_PER_ELEMENT != 0 && (console.warn(e + "'s bytes is not aligned"), n = n.slice(s, s + a.count * u * f.BYTES_PER_ELEMENT), 
            d = 0), delete h.bufferView, h.array = new f(n, d, u * a.count);
        } else h.array = new Uint8Array(n, s, o.byteLength);
        return h;
    }, ji._getTypeItemSize = function(e) {
        var t = Wi.indexOf(e);
        return Wi[t + 1];
    }, Yi);
    function Yi(e, t, n, r) {
        this.rootPath = e, this.gltf = t, this.glbBuffer = n, this.buffers = {}, this.requests = {}, 
        this.ignoreGLBOffset = r;
    }
    var Ki, Ji = ((Ki = Qi.prototype).iterate = function(e, t) {
        var n = this.gltf[t];
        if (n) for (var r = 0; r < n.length; r++) e(r, n[r], r);
    }, Ki.createNode = function(e, t, n) {
        var r = {};
        return zi(r, e), Ui(e.mesh) && (r.meshes = [ t[e.mesh] ]), Ui(e.skin) && (r.skin = n[e.skin], 
        r.skinIndex = e.skin), !Ui(e.weights) && r.meshes ? r.weights = r.meshes[0].weights : r.weights = e.weights, 
        r;
    }, Ki.getMaterial = function(e) {
        var i = this.gltf.materials[e], t = i.pbrMetallicRoughness, n = i.normalTexture, r = i.occlusionTexture, a = i.emissiveTexture, o = i.extensions, s = [];
        if (t && (t.name = "pbrMetallicRoughness", s.push(this._getPBRMaterial(t, [ "baseColorTexture", "metallicRoughnessTexture" ]))), 
        n && s.push(this._getTextureInfo(n, "normalTexture")), r && s.push(this._getTextureInfo(r, "occlusionTexture")), 
        a && s.push(this._getTextureInfo(a, "emissiveTexture")), o) {
            var u = o.KHR_materials_pbrSpecularGlossiness;
            u && (u.name = "pbrSpecularGlossiness", s.push(this._getPBRMaterial(u, [ "diffuseTexture", "specularGlossinessTexture" ])));
        }
        return Di.all(s).then(function(e) {
            var t = {};
            zi(t, i);
            for (var n = 0; n < e.length; n++) t[e[n].name] = e[n];
            if (t.extensions) {
                var r = t.extensions.KHR_materials_unlit;
                r && (t.unlit = r), delete t.extensions;
            }
            return {
                material: t
            };
        });
    }, Ki._getPBRMaterial = function(r, e) {
        for (var t = [], n = 0; n < e.length; n++) {
            var i = r[e[n]];
            i && t.push(this._getTextureInfo(i, e[n]));
        }
        return Di.all(t).then(function(e) {
            var t = {};
            zi(t, r);
            for (var n = 0; n < e.length; n++) delete e[n].index, t[e[n].name] = e[n];
            return t;
        });
    }, Ki._getTextureInfo = function(n, e) {
        var t = n.index, r = n.extensions;
        return Ui(t) ? (r && r.KHR_texture_transform && (n.KHR_texture_transform = {}, zi(n.KHR_texture_transform, r.KHR_texture_transform), 
        delete n.extensions), n.name = e, this._getTexture(t).then(function(e) {
            var t = {
                texture: e
            };
            return zi(t, n), delete t.index, t;
        })) : null;
    }, Ki._getTexture = function(e) {
        var r = this, i = this.gltf.textures[e];
        if (!i) return null;
        var a = this.gltf.images[i.source];
        return this._loadImage(a).then(function(e) {
            var t = {
                image: {
                    array: e.data,
                    width: e.width,
                    height: e.height,
                    index: i.source,
                    mimeType: a.mimeType,
                    name: a.name,
                    extensions: a.extensions,
                    extras: a.extras
                }
            };
            zi(t, i), delete t.sampler;
            var n = Ui(i.sampler) ? r.gltf.samplers[i.sampler] : void 0;
            return n && (t.sampler = n), t;
        });
    }, Ki._loadImage = function(e) {
        if (!Ui(e.bufferView)) {
            var t = e.uri, n = 0 === t.indexOf("data:image/") ? t : this.rootPath + "/" + t;
            return this._requestFromUrl(n);
        }
        var r = this.gltf.bufferViews[e.bufferView];
        if (this.buffers[e.bufferView]) return Di.resolve(this.buffers[e.bufferView]);
        var i = this.gltf.buffers[r.buffer];
        return i.uri ? this._requestFromArrayBuffer(i.uri, r, e) : this.glbBuffer ? this._requestFromGlbBuffer(r, e) : null;
    }, Ki._requestFromUrl = function(e) {
        var t = this;
        return this.requests[e] ? this.requests[e].then(function() {
            return t.buffers[e];
        }) : this.requests[e] = this._getImageInfo(e, e);
    }, Ki._requestFromArrayBuffer = function(e, a, o) {
        var s = this, u = o.bufferView;
        return this.requests[e] ? this.requests[e].then(function() {
            return s.buffers[u];
        }) : Ni.getArrayBuffer(e, null).then(function(e) {
            var t = e.data, n = s._createDataView(a, t), r = new Blob([ n ], {
                type: o.mimeType
            }), i = URL.createObjectURL(r);
            return s._getImageInfo(u, i);
        });
    }, Ki._requestFromGlbBuffer = function(e, t) {
        var n = this._createDataView(e, this.glbBuffer.buffer), r = new Blob([ n ], {
            type: t.mimeType
        }), i = URL.createObjectURL(r);
        return this._getImageInfo(t.bufferView, i);
    }, Ki._getImageInfo = function(i, e) {
        var a = this;
        return new Di(function(n, r) {
            a._requestImage(e, function(e, t) {
                e ? r(e) : (a.buffers[i] = t, n(a.buffers[i]));
            });
        });
    }, Ki._createDataView = function(e, t, n) {
        n = n || 0;
        var r = e.byteOffset + n, i = e.byteLength;
        return t.slice(r, r + i);
    }, Ki._transformArrayBufferToBase64 = function(e, t) {
        for (var n = new Array(e.byteLength), r = 0; r < e.byteLength; r++) n[r] = String.fromCharCode(e[r]);
        return n.join(""), "data:" + (t = t || "image/png") + ";base64," + window.btoa(unescape(encodeURIComponent(n)));
    }, Ki.getAnimations = function(n) {
        var t = this, r = [];
        return n.forEach(function(e) {
            r.push(t.getSamplers(e.samplers));
        }), Di.all(r).then(function(e) {
            for (var t = 0; t < e.length; t++) n[t].samplers = e[t];
            return n;
        });
    }, Ki.getSamplers = function(n) {
        for (var e = [], t = 0; t < n.length; t++) (Ui(n[t].input) || Ui(n[t].output)) && (e.push(this.accessor._requestData("input", n[t].input)), 
        e.push(this.accessor._requestData("output", n[t].output)));
        return Di.all(e).then(function(e) {
            for (var t = 0; t < e.length / 2; t++) n[t].input = e[2 * t], n[t].output = e[2 * t + 1], 
            n[t].interpolation || (n[t].interpolation = "LINEAR");
            return n;
        });
    }, Qi);
    function Qi(e, t, n, r) {
        this.rootPath = e, this.gltf = t, this.glbBuffer = n, this.buffers = {}, this.requests = {}, 
        this._requestImage = r, this.accessor = new Xi(e, t, n);
    }
    var Zi = "undefined" != typeof TextDecoder ? new TextDecoder("utf-8") : null, $i = 1313821514, ea = 5130562, ta = (na.read = function(e, t) {
        void 0 === t && (t = 0);
        var n = new DataView(e, t), r = n.getUint32(4, !0);
        if (1 === r) return na.readV1(n, t);
        if (2 === r) return na.readV2(e, t);
        throw new Error("Unsupported glb version : " + r);
    }, na.readV1 = function(e, t) {
        var n = e.getUint32(8, !0), r = e.getUint32(12, !0);
        if (n !== e.buffer.byteLength - t) throw new Error("Length in GLB header is inconsistent with glb's byte length.");
        var i = ra(e.buffer, 20 + t, r);
        return {
            json: JSON.parse(i),
            glbBuffer: {
                byteOffset: 20 + t + r,
                buffer: e.buffer
            }
        };
    }, na.readV2 = function(e, t) {
        for (var n, r, i = new DataView(e, t + 12), a = 0; a < i.byteLength; ) {
            var o = i.getUint32(a, !0);
            a += 4;
            var s = i.getUint32(a, !0);
            if (a += 4, s === $i) n = ra(e, t + 12 + a, o); else if (s === ea) {
                var u = t + 12 + a;
                r = e.slice(u, u + o);
            }
            a += o;
        }
        return {
            json: JSON.parse(n),
            glbBuffer: {
                byteOffset: t,
                buffer: r
            }
        };
    }, na);
    function na() {}
    function ra(e, t, n) {
        if (Zi) {
            var r = new Uint8Array(e, t, n);
            return Zi.decode(r);
        }
        return function(e) {
            for (var t = e.length, n = "", r = 0; r < t; ) {
                var i = e[r++];
                if (128 & i) {
                    var a = aa[i >> 3 & 7];
                    if (!(64 & i) || !a || t < r + a) return null;
                    for (i &= 63 >> a; 0 < a; --a) {
                        var o = e[r++];
                        if (128 != (192 & o)) return null;
                        i = i << 6 | 63 & o;
                    }
                }
                n += String.fromCharCode(i);
            }
            return n;
        }(new Uint8Array(e, t, n));
    }
    var ia, aa = [ 1, 1, 1, 1, 2, 2, 3, 0 ], oa = [ 0, 0, 0 ], sa = [ 0, 0, 0, 1 ], ua = [ 1, 1, 1 ], fa = [ 0, 0, 0 ], ca = [ 0, 0, 0, 1 ], la = [ 1, 1, 1 ], ha = {
        PREVIOUS: null,
        NEXT: null,
        PREINDEX: null,
        NEXTINDEX: null,
        INTERPOLATION: null
    }, da = {
        _getTRSW: function(e, t, n, r, i, a, o) {
            for (var s = e.animations, u = 0; u < s.length; u++) for (var f = s[u], c = f.channels, l = 0; l < c.length; l++) {
                var h = c[l];
                h.target.node === t && ("translation" === h.target.path ? this._getAnimateData(r, f.samplers[h.sampler], n, 1) : "rotation" === h.target.path ? this._getQuaternion(i, f.samplers[h.sampler], n, 1) : "scale" === h.target.path ? this._getAnimateData(a, f.samplers[h.sampler], n, 1) : "weights" === h.target.path && o && this._getAnimateData(o, f.samplers[h.sampler], n, o.length));
            }
        },
        _getAnimateData: function(e, t, n, r) {
            switch (t.interpolation) {
              case "LINEAR":
                var i = this._getPreNext(ha, t, n, +r);
                i && (e = function(e, t, n, r) {
                    for (var i = 0; i < e.length; i++) e[i] = t[i] + r * (n[i] - t[i]);
                    return e;
                }(e, i.PREVIOUS, i.NEXT, i.INTERPOLATION));
                break;

              case "STEP":
                var a = this._getPreNext(ha, t, n, +r);
                a && (e = function(e, t) {
                    for (var n = 0; n < e.length; n++) e[n] = t[n];
                    return e;
                }.apply(void 0, [ e ].concat(a.PREVIOUS)));
                break;

              case "CUBICSPLINE":
                var o = this._getPreNext(ha, t, n, 3 * r);
                o && (e = this._getCubicSpline(e, o, t.input.array, 3 * r));
            }
            return e;
        },
        _getQuaternion: function(e, t, n) {
            switch (t.interpolation) {
              case "LINEAR":
                var r = this._getPreNext(ha, t, n, 1);
                r && Te(e, r.PREVIOUS, r.NEXT, r.INTERPOLATION);
                break;

              case "STEP":
                var i = this._getPreNext(ha, t, n, 1);
                i && (e = ee.apply(ye, [ e ].concat(i.PREVIOUS)));
                break;

              case "CUBICSPLINE":
                var a = this._getPreNext(ha, t, n, 3);
                if (a) {
                    for (var o = 0; o < a.PREVIOUS.length; o++) a.PREVIOUS[o] = Math.acos(a.PREVIOUS[o]), 
                    a.NEXT[o] = Math.acos(a.NEXT[o]);
                    e = this._getCubicSpline(e, a, t.input.array, 3);
                    for (var s = 0; s < e.length; s++) e[s] = Math.cos(e[s]);
                }
            }
            return e;
        },
        _getPreNext: function(e, t, n, r) {
            var i, a, o, s = t.input.array, u = t.output.array, f = t.output.itemSize;
            (n < s[0] || n > s[s.length - 1]) && (n = Math.max(s[0], Math.min(s[s.length - 1], n))), 
            n === s[s.length - 1] && (n = s[0]);
            for (var c = 0; c < s.length - 1; c++) if (n >= s[c] && n < s[c + 1]) {
                var l = s[c];
                o = (n - l) / (s[a = (i = c) + 1] - l);
                break;
            }
            if (!a) return null;
            e.PREINDEX = i, e.NEXTINDEX = a, e.INTERPOLATION = o;
            var h = f * r;
            return e.PREVIOUS = u.subarray(e.PREINDEX * h, (e.PREINDEX + 1) * h), e.NEXT = u.subarray(e.NEXTINDEX * h, (e.NEXTINDEX + 1) * h), 
            e;
        },
        _getCubicSpline: function(e, t, n, r) {
            for (var i = t.INTERPOLATION, a = n[t.PREINDEX], o = n[t.NEXTINDEX], s = 0; s < 3; s++) {
                var u = t.PREVIOUS[r + s], f = (o - a) * t.PREVIOUS[2 * r + s], c = t.NEXT[3 + s], l = (o - a) * t.NEXT[s], h = (2 * Math.pow(i, 3) - 3 * Math.pow(i, 2) + 1) * u + (Math.pow(i, 3) - 2 * Math.pow(i, 2) + i) * f + (2 * -Math.pow(i, 3) + 3 * Math.pow(i, 2)) * c + (Math.pow(i, 3) - Math.pow(i, 2)) * l;
                e[s] = h;
            }
            return e;
        },
        getAnimationClip: function(e, t, n, r) {
            var i = t.nodes[n] && t.nodes[n].weights;
            B.apply(j, [ oa ].concat(fa)), ee.apply(ye, [ sa ].concat(ca)), B.apply(j, [ ua ].concat(la)), 
            this._getTRSW(t, n, r, oa, sa, ua, i), m(e, sa, oa, ua);
        },
        getTimeSpan: function(e) {
            if (!e.animations) return null;
            var a = -1 / 0, o = 1 / 0;
            return e.animations.forEach(function(e) {
                for (var t = e.channels, n = 0; n < t.length; n++) {
                    var r = t[n], i = e.samplers[r.sampler].input.array;
                    i[i.length - 1] > a && (a = i[i.length - 1]), i[0] < o && (o = i[0]);
                }
            }), {
                max: a,
                min: o
            };
        }
    }, pa = "undefined" == typeof document ? null : document.createElement("canvas"), va = ((ia = ma.prototype).load = function() {
        var e = this._loadScene(), t = this._loadAnimations();
        return Di.all([ e, t ]).then(function(e) {
            return e[0].animations = e[1], e[0];
        });
    }, ma.getAnimationClip = function(e, t, n, r) {
        return da.getAnimationClip(e, t, n, r);
    }, ma.getAnimationTimeSpan = function(e) {
        return da.getTimeSpan(e);
    }, ma.getTypedArrayCtor = function(e) {
        return Gi(e);
    }, ia._init = function(e, t, n) {
        this.gltf = t, this.version = t.asset ? +t.asset.version : 1, this.rootPath = e, 
        this.glbBuffer = n, this.buffers = {}, this.requests = {}, this.options.requestImage = this.options.requestImage || ga, 
        2 === this.version ? (this.accessor = new Xi(e, t, n, !0), this.adapter = new Ji(e, t, n, this.options.requestImage)) : (this.accessor = new Xi(e, t, n), 
        this.adapter = new Vi(e, t));
    }, ia._parseNodes = function(e, n) {
        var t, r = this;
        if (e.children && 0 < e.children.length) {
            if (!qi(e.children[0]) && (Li(t = e.children[0]) || "string" != typeof t && (null === t.constructor || t.constructor !== String))) return e;
            var i = e.children.map(function(e) {
                var t = n[e];
                return t.nodeIndex = e, r._parseNodes(t, n);
            });
            e.children = i;
        }
        if (Ui(e.skin)) {
            var a = e.skin.joints;
            if (a && a.length && qi(a[0])) {
                var o = e.skin.joints.map(function(e) {
                    return n[e];
                });
                e.skin.joints = o;
            }
        }
        return e;
    }, ia._loadScene = function() {
        var s = this;
        return this._loadNodes().then(function(i) {
            var a, o = s.scenes = [];
            for (var e in i) i[e] = s._parseNodes(i[e], i), i[e].nodeIndex = Number(e) ? Number(e) : e;
            s.adapter.iterate(function(e, t, n) {
                var r = {};
                t.name && (r.name = t.name), t.nodes && (r.nodes = t.nodes.map(function(e) {
                    return i[e];
                })), s.gltf.scene === e && (a = n), o.push(r);
            }, "scenes");
            var t = {
                scene: a,
                scenes: o,
                nodes: i,
                meshes: s.meshes,
                skins: s.skins
            };
            return s.gltf.extensions && (t.extensions = s.gltf.extensions), t;
        });
    }, ia._loadNodes = function() {
        var i = this;
        return this._loadMeshes().then(function() {
            var r = i.nodes = {};
            return i.adapter.iterate(function(e, t) {
                var n = i.adapter.createNode(t, i.meshes, i.skins);
                r[e] = n;
            }, "nodes"), r;
        });
    }, ia._loadSkins = function() {
        var r = this;
        this.skins = {};
        var i = [];
        return this.adapter.iterate(function(t, e, n) {
            i.push(r._loadSkin(e).then(function(e) {
                e.index = n, r.skins[t] = e;
            }));
        }, "skins"), i;
    }, ia._loadSkin = function(t) {
        var e = t.inverseBindMatrices;
        return this.accessor._requestData("inverseBindMatrices", e).then(function(e) {
            return t.inverseBindMatrices = e, t;
        });
    }, ia._loadAnimations = function() {
        var e = this.gltf.animations;
        return Ui(e) ? this.adapter.getAnimations(e) : null;
    }, ia._loadMeshes = function() {
        var r = this;
        this.meshes = {};
        var i = [];
        return this.adapter.iterate(function(t, e, n) {
            i.push(r._loadMesh(e).then(function(e) {
                e.index = n, r.meshes[t] = e;
            }));
        }, "meshes"), i = i.concat(this._loadSkins()), Di.all(i);
    }, ia._loadMesh = function(n) {
        var t = this, e = n.primitives.map(function(e) {
            return t._loadPrimitive(e);
        });
        return Di.all(e).then(function(e) {
            var t = {};
            return zi(t, n), t.primitives = e, t;
        });
    }, ia._loadPrimitive = function(r) {
        var i = this, e = [], t = r.attributes, n = this._loadMaterial(r);
        n && e.push(n);
        var a = null;
        for (var o in t) {
            var s = this.accessor._requestData(o, t[o]);
            s && e.push(s);
        }
        if (Ui(r.indices)) {
            var u = this.accessor._requestData("indices", r.indices);
            u && e.push(u);
        }
        if (Ui(r.targets)) for (var f = 0; f < r.targets.length; f++) {
            var c = r.targets[f];
            for (var l in c) {
                var h = this.accessor._requestData(l + "_" + f, c[l]);
                h && e.push(h);
            }
        }
        return Di.all(e).then(function(e) {
            var n;
            i.transferables = [];
            var t = {
                attributes: e.reduce(function(e, t) {
                    return t.material ? (a = t.material, t.transferables && t.transferables.forEach(function(e) {
                        i.transferables.indexOf(e) < 0 && i.transferables.push(e);
                    })) : ("indices" === t.name ? n = t : e[t.name] = t, i.transferables.indexOf(t.array.buffer) < 0 && i.transferables.push(t.array.buffer)), 
                    e;
                }, {}),
                material: a
            };
            return n && (t.indices = n), t.mode = Ui(r.mode) ? r.mode : 4, Ui(r.extras) && (t.extras = r.extras), 
            t;
        });
    }, ia._loadMaterial = function(e) {
        var i = e.material;
        if (2 === this.version) return Ui(i) ? this.adapter.getMaterial(i) : null;
        var a = this.adapter.getBaseColorTexture(i);
        return a ? this._loadImage(a.source).then(function(e) {
            var t = [ e.buffer ], n = a.source;
            e.index = n, zi(a.source, n), a.source.image = e;
            var r = {
                baseColorTexture: a
            };
            return i.name && (r.name = i.name), i.extensions && (r.extensions = i.extensions), 
            r.extensions && (delete r.extensions.KHR_binary_glTF, delete r.extensions.binary_glTF, 
            0 === Object.keys(r.extensions).length && delete r.extensions), i.extras && (r.extras = i.extras), 
            {
                material: r,
                transferables: t
            };
        }) : null;
    }, ia._loadImage = function(e) {
        var n = this;
        if (e.bufferView || e.extensions && (e.extensions.KHR_binary_glTF || e.extensions.binary_glTF)) {
            var t = e.bufferView ? e : e.extensions.KHR_binary_glTF || e.extensions.binary_glTF;
            if (e.extensions && (e.mimeType = t.mimeType, e.width = t.width, e.height = t.height), 
            this.buffers[t.bufferView]) return Di.resolve(this.buffers[t.bufferView]);
            var r = this.gltf.bufferViews[t.bufferView], i = (r.byteOffset || 0) + this.glbBuffer.byteOffset, a = r.byteLength, o = this.buffers[t.bufferView] = new Uint8Array(this.glbBuffer.buffer, i, a);
            return Di.resolve(o);
        }
        var s = e.uri, u = this.rootPath + "/" + s;
        return this.requests[u] ? this.requests[u].then(function() {
            return n.buffers[u];
        }) : this.requests[u] = Ni.getArrayBuffer(u, null).then(function(e) {
            var t = e.data;
            return n.buffers[u] = t, new Uint8Array(t);
        });
    }, ma);
    function ma(e, t, n) {
        if (this.options = n || {}, t.buffer instanceof ArrayBuffer) {
            var r = ta.read(t.buffer, t.byteOffset), i = r.json, a = r.glbBuffer;
            this._init(e, i, a);
        } else this._init(e, t);
    }
    function ga(e, r) {
        var i = new Image();
        i.crossOrigin = "", i.onload = function() {
            if (pa) {
                pa.width = i.width, pa.height = i.height;
                var e = pa.getContext("2d");
                e.drawImage(i, 0, 0, i.width, i.height);
                var t = e.getImageData(0, 0, i.width, i.height), n = {
                    width: i.width,
                    height: i.height,
                    data: new Uint8Array(t.data)
                };
                r(null, n);
            } else r(new Error("There is no canvas to draw image!"));
        }, i.onerror = function(e) {
            r(e);
        }, i.src = e;
    }
    var _a, xa = [], ba = ((_a = ya.prototype).setJointTexture = function(e) {
        this.jointTexture = e;
    }, _a.update = function(e) {
        x(xa, e);
        for (var t = 0; t < this.joints.length; ++t) {
            var n = this.joints[t], r = this.jointMatrices[t];
            Y(r, xa, n.nodeMatrix), Y(r, r, this.inverseBindMatrices[t]);
        }
        this.jointTexture({
            width: 4,
            type: "float",
            height: this.joints.length,
            data: this.jointData
        });
    }, _a.dispose = function() {
        this.jointTexture.destroy();
    }, ya);
    function ya(e, t, n) {
        this._regl = e, this.joints = t, this.inverseBindMatrices = [], this.jointMatrices = [], 
        this.jointData = new Float32Array(16 * t.length);
        for (var r = 0; r < t.length; ++r) this.inverseBindMatrices.push(new Float32Array(n.buffer, n.byteOffset + 16 * Float32Array.BYTES_PER_ELEMENT * r, 16)), 
        this.jointMatrices.push(new Float32Array(this.jointData.buffer, 16 * Float32Array.BYTES_PER_ELEMENT * r, 16));
        this.jointTexture = e.texture(), this.jointTextureSize = [ 4, 6 ];
    }
    var Aa, Ta = [ 0, 0, 0 ], Ea = [ 0, 0, 0, 1 ], Ma = [ 1, 1, 1 ], Sa = [ 0, 0, 0 ], wa = [ 0, 0, 0, 1 ], Ra = [ 1, 1, 1 ], Oa = ((Aa = Ca.prototype).setMatrix = function(e) {
        return m(e = e || [], this.rotation, this.translation, this.scale), e;
    }, Aa.decompose = function(e) {
        d(this.translation, e), v(this.rotation, e), p(this.scale, e);
    }, Aa.update = function(e) {
        d(Sa, e), v(wa, e), p(Ra, e), D(Sa, Ta) || C(this.translation, Sa), De(wa, Ea) || Fe(this.rotation, wa), 
        D(Ra, Ma) || C(this.scale, Ra);
    }, Ca);
    function Ca(e, t, n) {
        void 0 === e && (e = [ 0, 0, 0 ]), void 0 === t && (t = [ 0, 0, 0, 1 ]), void 0 === n && (n = [ 1, 1, 1 ]), 
        this.translation = e, this.rotation = t, this.scale = n;
    }
    var Ba, Fa = [], Pa = 0, Ia = [ "points", "lines", "line strip", "line loop", "triangles", "triangle strip", "triangle fan" ], Da = {
        9728: "nearest",
        9729: "linear",
        9984: "nearest mipmap nearest",
        9985: "linear mipmap nearest",
        9986: "nearest mipmap linear",
        9987: "linear mipmap linear",
        33071: "clamp ro edge",
        33684: "mirrored repeat",
        10497: "repeat"
    }, Na = ((Ba = La.prototype).getMeshesInfo = function() {
        var t = this;
        return this.geometries.length || this.gltf.scenes[0].nodes.forEach(function(e) {
            t._parserNode(e, t.geometries);
        }), this.geometries;
    }, Ba.dispose = function() {
        for (var e in this.getMeshesInfo().forEach(function(e) {
            for (var t in e.geometry.dispose(), e.materialInfo) e.materialInfo[t].destroy && e.materialInfo[t].destroy();
        }), this.gltf.nodes) {
            var t = this.gltf.nodes[e];
            t.skin && t.skin.jointTexture && t.skin.jointTexture.destroy();
        }
    }, Ba.updateAnimation = function(e, t, n) {
        var r = this, i = this.gltf;
        Pa = i.animations ? va.getAnimationTimeSpan(i) : null;
        var a = (t ? .001 * e % (Pa.max - Pa.min) : .001 * e) * n;
        for (var o in i.scenes[0].nodes.forEach(function(e) {
            r._updateNodeMatrix(a, e);
        }), this.gltf.nodes) {
            var s = this.gltf.nodes[o];
            s.skin && s.skin.update(s.nodeMatrix), s.weights && this._fillMorphWeights(s.morphWeights);
        }
    }, Ba.hasSkinAnimation = function() {
        return !!this._isAnimation;
    }, Ba._updateNodeMatrix = function(t, e, n) {
        var r = this, i = e.trs;
        i && i.setMatrix(e.localMatrix), n ? Y(e.nodeMatrix, n, e.localMatrix) : l(e.nodeMatrix, e.localMatrix);
        var a = e.nodeMatrix;
        if (e.children && e.children.forEach(function(e) {
            r._updateNodeMatrix(t, e, a);
        }), va.getAnimationClip(Fa, this.gltf, Number(e.nodeIndex), t), e.trs.update(Fa), 
        e.weights) for (var o = 0; o < e.weights.length; o++) e.morphWeights[o] = e.weights[o];
    }, Ba._parserNode = function(n, r, e) {
        var i = this;
        if (!n.isParsed) {
            n.nodeMatrix = n.nodeMatrix || X([]), n.localMatrix = n.localMatrix || X([]), n.matrix ? (n.trs = new Oa(), 
            n.trs.decompose(n.matrix)) : n.trs = new Oa(n.translation, n.rotation, n.scale);
            var t = n.trs;
            t && t.setMatrix(n.localMatrix), e ? Y(n.nodeMatrix, e, n.localMatrix) : l(n.nodeMatrix, n.localMatrix);
            var a = n.nodeMatrix;
            if (n.children) for (var o = 0; o < n.children.length; o++) {
                var s = n.children[o];
                this._parserNode(s, r, a);
            }
            if (n.skin) {
                this._isAnimation = !0;
                var u = n.skin;
                n.trs = new Oa(), n.skin = new ba(this.regl, u.joints, u.inverseBindMatrices.array);
            }
            n.weights && (n.morphWeights = [ 0, 0, 0, 0 ]), Ge(n.mesh) && (n.mesh = n.meshes[0], 
            (n.mesh.node = n).mesh.primitives.forEach(function(e) {
                var t = {
                    geometry: function(e) {
                        var t = {};
                        for (var n in e.attributes) t[n] = e.attributes[n], void 0 === t[n].bufferView && (t[n] = t[n].array);
                        if (t.POSITION_0) for (var r = 0; r < 4; r++) t["POSITION_" + r] || (t["POSITION_" + r] = new Array(t.POSITION.length).fill(0));
                        var i = e.indices;
                        void 0 === i.bufferView && i.array && (i = i.array);
                        var a = new It(t, i, 0, {
                            primitive: We(e.mode) ? Ia[e.mode] : e.mode,
                            positionAttribute: "POSITION",
                            normalAttribute: "NORMAL",
                            uv0Attribute: "TEXCOORD_0",
                            uv1Attribute: "TEXCOORD_1"
                        });
                        return a.data.NORMAL || a.createNormal("NORMAL"), a;
                    }(e),
                    nodeMatrix: a,
                    materialInfo: i._createMaterialInfo(e.material, n),
                    animationMatrix: n.trs.setMatrix()
                };
                n.skin && (t.skin = {
                    jointTextureSize: [ 4, 6 ],
                    numJoints: n.skin.joints.length,
                    jointTexture: n.skin.jointTexture
                }), n.morphWeights && (t.morphWeights = n.morphWeights), r.push(t);
            })), n.isParsed = !0;
        }
    }, Ba._createMaterialInfo = function(e) {
        var t = {
            baseColorFactor: [ 1, 1, 1, 1 ]
        };
        if (e) {
            var n = e.pbrMetallicRoughness;
            if (n) {
                var r = n.metallicRoughnessTexture, i = n.baseColorTexture;
                if (i) {
                    var a = this._toTexture(i);
                    t.baseColorTexture = a;
                } else n.baseColorFactor && (t.baseColorFactor = n.baseColorFactor);
                if (r) {
                    var o = this._toTexture(r);
                    t.metallicRoughnessTexture = o;
                } else Ge(n.metallicFactor) && (t.metallicFactor = n.metallicFactor), Ge(n.roughnessFactor) && (t.roughnessFactor = n.roughnessFactor);
            }
            var s = e.pbrSpecularGlossiness;
            if (s) for (var u in s) s[u].texture ? t[u] = this._toTexture(s[u]) : t[u] = s[u];
            if (e.normalTexture) {
                var f = this._toTexture(e.normalTexture);
                t.normalTexture = f;
            }
            if (e.occlusionTexture) {
                var c = this._toTexture(e.occlusionTexture);
                t.occlusionTexture = c;
            }
            if (e.emissiveTexture) {
                var l = this._toTexture(e.emissiveTexture);
                t.emissiveTexture = l;
            }
            e.emissiveFactor && (t.emissiveFactor = e.emissiveFactor);
        }
        return t;
    }, Ba._toTexture = function(e) {
        var t = e.texture.image.array, n = e.texture.sampler || {}, r = e.texture.image.width, i = e.texture.image.height;
        return this.regl.texture({
            width: r,
            height: i,
            data: t,
            mag: Da[n.magFilter] || Da[9729],
            min: Da[n.minFilter] || Da[9729],
            wrapS: Da[n.wrapS] || Da[10497],
            wrapT: Da[n.wrapT] || Da[10497]
        });
    }, Ba._fillMorphWeights = function(e) {
        if (e.length < 4) for (var t = 0; t < 4; t++) Ge(e[t]) || (e[t] = 0);
        return e;
    }, La);
    function La(e, t) {
        this.gltf = e, this.regl = t, this.geometries = [];
    }
    function Ua(e, t) {
        return new va(e, t).load();
    }
    var qa, za, Ga, Ha, Va, ka = Object.freeze({
        __proto__: null,
        load: function(e) {
            var t, n, r = e.lastIndexOf("/"), i = e.slice(0, r), a = e.slice(e.lastIndexOf(".")).toLowerCase();
            return ".gltf" === a ? (n = e, Ni.getJSON(n, {}).then(function(e) {
                return Ua(i, e);
            })) : ".glb" === a ? (t = e, Ni.getArrayBuffer(t, {}).then(function(e) {
                return Ua(i, {
                    buffer: e.data,
                    byteOffset: 0
                });
            })) : null;
        },
        exportGLTFPack: function(e, t) {
            return new Na(e, t);
        }
    }), ja = (za = [ K([], qa = [ 0, 0, 0 ], [ 1, 0, 0 ], [ 0, -1, 0 ]), K([], qa, [ -1, 0, 0 ], [ 0, -1, 0 ]), K([], qa, [ 0, 1, 0 ], [ 0, 0, 1 ]), K([], qa, [ 0, -1, 0 ], [ 0, 0, -1 ]), K([], qa, [ 0, 0, 1 ], [ 0, -1, 0 ]), K([], qa, [ 0, 0, -1 ], [ 0, -1, 0 ]) ], 
    Ga = 90 * Math.PI / 180, Ha = [ 0, 0, 0, 0 ], Va = new Array(16), function(i, a, o, s, u) {
        var e = {
            context: {
                viewMatrix: function(e, t, n) {
                    return za[n];
                },
                projMatrix: g(Va, Ga, 1, .5, 1.1)
            }
        };
        return a && (a.faces ? e.framebuffer = function(e, t, n) {
            return a.faces[n];
        } : e.framebuffer = a), i(e)(6, function(e, t, n) {
            var r = {
                color: Ha,
                depth: 1
            };
            a && (r.framebuffer = a.faces ? a.faces[n] : a), i.clear(r), o(s), u && u();
        }), a;
    }), Wa = {
        vertices: [ 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, -1 ],
        textures: [ 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0 ],
        indices: [ 0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23 ]
    }, Xa = "attribute vec3 aPosition;\nvarying vec3 vWorldPos;\nuniform mat4 projMatrix;\nuniform mat4 viewMatrix;\nvoid main() {\n  vWorldPos = aPosition;\n  gl_Position = projMatrix * viewMatrix * vec4(vWorldPos, 1.);\n}", Ya = "precision highp float;\n#define PI 3.1415926\nvarying vec3 vWorldPos;\nuniform sampler2D equirectangularMap;\nconst vec2 tG = vec2(.1591, .3183);\nvec2 tH(vec3 pn) {\n  vec2 nU = vec2(atan(pn.y, pn.x), asin(pn.z));\n  nU *= tG;\n  nU += .5;\n  return nU;\n}\nvec3 rj(const in vec4 pa, const in float rg) {\n  return rg * pa.rgb * pa.a;\n}\nvec4 rf(const in vec3 pa, const in float rg) {\n  vec4 rh;\n  vec3 ri = pa / rg;\n  rh.a = clamp(max(max(ri.r, ri.g), max(ri.b, 1e-6)), .0, 1.);\n  rh.a = ceil(rh.a * 255.) / 255.;\n  rh.rgb = ri / rh.a;\n  return rh;\n}\nvoid main() {\n  vec2 nU = tH(normalize(vWorldPos));\n  vec4 pa = texture2D(equirectangularMap, nU);\n#ifdef INPUT_RGBM\ngl_FragColor = pa;\n#else\ngl_FragColor = vec4(rj(pa, 7.), 1.);\n#endif\n}";
    var Ka = {
        px: [ 2, 1, 0, -1, -1, 1 ],
        nx: [ 2, 1, 0, 1, -1, -1 ],
        py: [ 0, 2, 1, 1, -1, -1 ],
        ny: [ 0, 2, 1, 1, 1, 1 ],
        pz: [ 0, 1, 2, -1, -1, -1 ],
        nz: [ 0, 1, 2, 1, -1, 1 ]
    }, Ja = [ "px", "nx", "py", "ny", "pz", "nz" ], Qa = er(Ri);
    function Za(t, e, n) {
        var r = t({
            frag: Qa,
            vert: Xa,
            attributes: {
                aPosition: Wa.vertices
            },
            uniforms: {
                projMatrix: t.context("projMatrix"),
                viewMatrix: t.context("viewMatrix"),
                cubeMap: e,
                environmentExposure: 1,
                bias: 0,
                size: n,
                hsv: [ 0, 0, 0 ]
            },
            elements: Wa.indices
        }), i = [], a = t.framebuffer(n);
        return ja(t, a, r, {
            size: n
        }, function() {
            var e = t.read();
            i.push(new e.constructor(e));
        }), a.destroy(), i;
    }
    var $a = [ -1, 1, 0, -1, -1, 0, 1, 1, 0, 1, -1, 0 ], eo = [ 0, 1, 0, 0, 1, 1, 1, 0 ];
    function to(e, t) {
        for (var n, r, i = new Array(e * t * 4), a = 0; a < e; a++) for (var o = (r = void 0, 
        {
            x: (n = a) / e,
            y: r = (((16711935 & (r = ((252645135 & (r = ((858993459 & (r = ((1431655765 & (r = (n << 16 | n >>> 16) >>> 0)) << 1 | (2863311530 & r) >>> 1) >>> 0)) << 2 | (3435973836 & r) >>> 2) >>> 0)) << 4 | (4042322160 & r) >>> 4) >>> 0)) << 8 | (4278255360 & r) >>> 8) >>> 0) / 4294967296
        }), s = o.x, u = o.y, f = 0; f < t; f++) {
            var c = f / t, l = c * c, h = 2 * Math.PI * s, d = Math.sqrt((1 - u) / (1 + (l * l - 1) * u)), p = Math.sqrt(1 - d * d), v = 4 * (a * t + f), m = p * Math.cos(h), g = p * Math.sin(h);
            i[v] = Math.abs(255 * m), i[1 + v] = Math.abs(255 * g), i[2 + v] = 255 * d, i[3 + v] = (0 < m ? 200 : 0) + (0 < g ? 55 : 0);
        }
        return i;
    }
    var no, ro, io = Object.freeze({
        __proto__: null,
        createIBLMaps: function(e, t) {
            void 0 === t && (t = {});
            var n, r = t.envTexture, i = t.envCubeSize || 512, a = t.sampleSize || 1024, o = t.roughnessLevels || 256, s = t.prefilterCubeSize || 256;
            if (Array.isArray(r)) {
                var u = e.cube.apply(e, r);
                n = function(t, e, n) {
                    var r = t({
                        frag: "#define ENC_RGBM 1\n" + Qa,
                        vert: Xa,
                        attributes: {
                            aPosition: Wa.vertices
                        },
                        uniforms: {
                            hsv: [ 0, 0, 0 ],
                            projMatrix: t.context("projMatrix"),
                            viewMatrix: t.context("viewMatrix"),
                            cubeMap: e
                        },
                        elements: Wa.indices
                    }), i = [], a = t.framebufferCube({
                        radius: n
                    });
                    ja(t, a, r, {
                        size: n
                    }, function() {
                        var e = t.read();
                        i.push(e);
                    });
                    var o = t.cube({
                        radius: n,
                        min: "linear mipmap linear",
                        mag: "linear",
                        faces: i
                    });
                    return a.destroy(), o;
                }(e, u, i), u.destroy();
            } else n = function(e, t, n) {
                n = n || 512;
                var r = e({
                    frag: "#define INPUT_RGBM 1\n" + Ya,
                    vert: Xa,
                    attributes: {
                        aPosition: Wa.vertices
                    },
                    uniforms: {
                        projMatrix: e.context("projMatrix"),
                        viewMatrix: e.context("viewMatrix"),
                        equirectangularMap: t
                    },
                    elements: Wa.indices
                }), i = e.cube({
                    width: n,
                    height: n,
                    min: "linear",
                    mag: "linear",
                    format: "rgba"
                }), a = e.framebufferCube({
                    radius: n,
                    color: i
                });
                return ja(e, a, r), a;
            }(e, r, i);
            var f, c, l, h, d, p, v = (f = e, c = n, l = t.rgbmRange, d = function(n, e, t, r, i, a) {
                for (var o = to(i = i || 1024, a = a || 256), s = n.texture({
                    data: o,
                    width: a,
                    height: i,
                    min: "nearest",
                    mag: "nearest"
                }), u = n({
                    frag: "#define SHADER_NAME PBR_prefilter\nprecision highp float;\nvarying vec3 vWorldPos;\nuniform samplerCube environmentMap;\nuniform sampler2D distributionMap;\nuniform float roughness;\nuniform float resolution;\nuniform float rgbmRange;\nconst float nH = 3.14159265359;\nfloat tI(vec3 tJ, vec3 tK, float oJ) {\n  float a = oJ * oJ;\n  float rP = a * a;\n  float oI = max(dot(tJ, tK), .0);\n  float oL = oI * oI;\n  float tL = rP;\n  float oM = (oL * (rP - 1.) + 1.);\n  oM = nH * oM * oM;\n  return tL / oM;\n}\nvec3 tM(float tN, vec3 tJ, float oJ) {\n  vec4 tO = texture2D(distributionMap, vec2(oJ, tN));\n  vec3 tK = tO.xyz;\n  float tP = sign(tO.w - .5);\n  float tQ = sign(tO.w - 200.0 / 255. * clamp(tP, .0, 1.) - .15);\n  tK.x *= tP;\n  tK.y *= tQ;\n  vec3 tR = abs(tJ.z) < .999 ? vec3(.0, .0, 1.) : vec3(1., .0, .0);\n  vec3 tS = normalize(cross(tR, tJ));\n  vec3 tT = cross(tJ, tS);\n  vec3 tU = tS * tK.x + tT * tK.y + tJ * tK.z;\n  return normalize(tU);\n}\nvec4 rf(const in vec3 pa, const in float rg) {\n  if(rg <= .0)\n    return vec4(pa, 1.);\n  vec4 rh;\n  vec3 ri = pa / rg;\n  rh.a = clamp(max(max(ri.r, ri.g), max(ri.b, 1e-6)), .0, 1.);\n  rh.a = ceil(rh.a * 255.) / 255.;\n  rh.rgb = ri / rh.a;\n  return rh;\n}\nvec3 rj(const in vec4 pa, const in float rg) {\n  if(rg <= .0)\n    return pa.rgb;\n  return rg * pa.rgb * pa.a;\n}\nvoid main() {\n  vec3 tJ = normalize(vWorldPos);\n  vec3 rY = tJ;\n  vec3 oV = rY;\n  const int tV = 1024;\n  vec3 tW = vec3(.0);\n  float tX = .0;\n  for(int tY = 0; tY < tV; ++tY) {\n    vec3 tK = tM(float(tY) / float(tV), tJ, roughness);\n    vec3 tZ = normalize(2. * dot(oV, tK) * tK - oV);\n    float ua = max(dot(tJ, tZ), .0);\n    if(ua > .0) {\n      tW += rj(textureCube(environmentMap, tZ), rgbmRange).rgb * ua;\n      tX += ua;\n    }\n  }\n  tW = tW / tX;\n  gl_FragColor = rf(tW, rgbmRange);\n}",
                    vert: Xa,
                    attributes: {
                        aPosition: Wa.vertices
                    },
                    uniforms: {
                        projMatrix: n.context("projMatrix"),
                        viewMatrix: n.context("viewMatrix"),
                        environmentMap: e,
                        distributionMap: s,
                        roughness: n.prop("roughness"),
                        resolution: r,
                        rgbmRange: t || 7
                    },
                    elements: Wa.indices,
                    viewport: {
                        x: 0,
                        y: 0,
                        width: n.prop("size"),
                        height: n.prop("size")
                    }
                }), f = r, c = n.texture({
                    radius: r,
                    min: "linear",
                    mag: "linear"
                }), l = n.framebuffer({
                    radius: r,
                    color: c
                }), h = Math.log(f) / Math.log(2), d = [], p = function(e) {
                    var t = 0;
                    ja(n, l, u, {
                        roughness: e / (h - 1),
                        size: f
                    }, function() {
                        var e = n.read({
                            framebuffer: l
                        });
                        d[t] || (d[t] = {
                            mipmap: []
                        }), d[t].mipmap.push(e), t++;
                    }), f /= 2, l.resize(f);
                }, v = 0; v <= h; v++) p(v);
                return l.destroy(), d;
            }(f, c, l, h = s, a, o), {
                prefilterMap: f.cube({
                    radius: h,
                    min: "linear mipmap linear",
                    mag: "linear",
                    faces: d
                }),
                prefilterMipmap: d
            }), m = v.prefilterMap, g = v.prefilterMipmap;
            if (!t.ignoreSH) {
                var _ = s;
                p = function(e, t, n) {
                    for (var r = new Array(9), i = [], a = [], o = [], s = 0; s < 9; s++) {
                        for (var u = [ 0, 0, 0 ], f = 0; f < Ja.length; f++) {
                            for (var c = e[f], l = [ 0, 0, 0 ], h = 0, d = 0, p = Ka[Ja[f]], v = 0; v < n; v++) for (var m = 0; m < t; m++) {
                                i[0] = m / (t - 1) * 2 - 1, i[1] = v / (n - 1) * 2 - 1, i[2] = -1, Z(i, i), o[0] = i[p[0]] * p[3], 
                                o[1] = i[p[1]] * p[4], o[2] = i[p[2]] * p[5], a[0] = c[d++] / 255, a[1] = c[d++] / 255, 
                                a[2] = c[d++] / 255;
                                var g = c[d++] / 255 * 7;
                                a[0] *= g, a[1] *= g, a[2] *= g, M(l, l, a, (x = s, 0, b = (_ = o)[0], y = _[1], 
                                A = _[2], (0 === x ? 1 : 1 === x ? b : 2 === x ? y : 3 === x ? A : 4 === x ? b * A : 5 === x ? y * A : 6 === x ? b * y : 7 === x ? 3 * A * A - 1 : b * b - y * y) * -i[2])), 
                                h += -i[2];
                            }
                            M(u, u, l, 1 / h);
                        }
                        r[s] = Q(u, u, 1 / 6);
                    }
                    var _, x, b, y, A;
                    return r;
                }(Za(e, m, _), _, _);
            }
            var x = {
                rgbmRange: t.rgbmRange,
                envMap: n,
                prefilterMap: m
            };
            return p && (x.sh = p), "array" === t.format && (x.envMap = {
                width: n.width,
                height: n.height,
                faces: Za(e, n, i)
            }, x.prefilterMap = {
                width: m.width,
                height: m.height,
                faces: g
            }, n.destroy(), m.destroy()), x;
        },
        generateDFGLUT: function(e, t, n, r) {
            t = t || 256;
            var i = to(n = n || 1024, r = r || 256), a = e.texture({
                data: i,
                width: r,
                height: n,
                min: "nearest",
                mag: "nearest"
            }), o = e.buffer($a), s = e.buffer(eo), u = e.framebuffer({
                radius: t,
                colorType: "uint8",
                colorFormat: "rgba",
                min: "linear",
                mag: "linear"
            });
            return e({
                frag: "precision mediump float;\nvarying vec2 vTexCoords;\nuniform sampler2D distributionMap;\nconst float nH = 3.14159265359;\nvec4 ub(float a, float b) {\n  a *= 65535.;\n  b *= 65535.;\n  vec4 rgba;\n  rgba[0] = mod(a, 255.);\n  rgba[1] = (a - rgba[0]) / 65280.0;\n  rgba[2] = mod(b, 255.);\n  rgba[3] = (b - rgba[2]) / 65280.0;\n  return rgba;\n}\nvec3 tM(float tN, vec3 tJ, float oJ) {\n  vec4 tO = texture2D(distributionMap, vec2(oJ, tN));\n  vec3 tK = tO.xyz;\n  float tP = sign(tO.w - .5);\n  float tQ = sign(tO.w - clamp(tP, .0, 1.) * 200.0 / 255. - .15);\n  tK.x *= tP;\n  tK.y *= tQ;\n  vec3 tR = abs(tJ.z) < .999 ? vec3(.0, .0, 1.) : vec3(1., .0, .0);\n  vec3 tS = normalize(cross(tR, tJ));\n  vec3 tT = cross(tJ, tS);\n  vec3 tU = tS * tK.x + tT * tK.y + tJ * tK.z;\n  return normalize(tU);\n}\nfloat uc(float ud, float oJ) {\n  float a = oJ;\n  float ue = (a * a) / 2.;\n  float tL = ud;\n  float oM = ud * (1. - ue) + ue;\n  return tL / oM;\n}\nfloat uf(float ud, float ua, float oJ) {\n  float ug = uc(ud, oJ);\n  float uh = uc(ua, oJ);\n  return uh * ug;\n}\nvec2 ui(float ud, float oJ) {\n  vec3 oV;\n  oV.x = sqrt(1. - ud * ud);\n  oV.y = .0;\n  oV.z = ud;\n  float uj = .0;\n  float uk = .0;\n  vec3 tJ = vec3(.0, .0, 1.);\n  const int tV = 1024;\n  for(int tY = 0; tY < tV; ++tY) {\n    vec3 tK = tM(float(tY) / float(tV), tJ, oJ);\n    vec3 tZ = normalize(2. * dot(oV, tK) * tK - oV);\n    float ua = max(tZ.z, .0);\n    float oI = max(tK.z, .0);\n    float ul = max(dot(oV, tK), .0);\n    float ud = max(dot(tJ, oV), .0);\n    if(ua > .0) {\n      float um = uf(ud, ua, oJ);\n      float un = (um * ul) / (oI * ud);\n      float uo = pow(1. - ul, 5.);\n      uj += (1. - uo) * un;\n      uk += uo * un;\n    }\n  }\n  uj /= float(tV);\n  uk /= float(tV);\n  return vec2(uj, uk);\n}\nvoid main() {\n  vec2 up = ui(vTexCoords.x, vTexCoords.y);\n  gl_FragColor = ub(up.x, up.y);\n}",
                vert: "attribute vec3 aPosition;\nattribute vec2 aTexCoord;\nvarying vec2 vTexCoords;\nvoid main() {\n  vTexCoords = aTexCoord;\n  gl_Position = vec4(aPosition, 1.);\n}",
                attributes: {
                    aPosition: {
                        buffer: o
                    },
                    aTexCoord: {
                        buffer: s
                    }
                },
                uniforms: {
                    distributionMap: a
                },
                framebuffer: u,
                viewport: {
                    x: 0,
                    y: 0,
                    width: t,
                    height: t
                },
                count: $a.length / 3,
                primitive: "triangle strip"
            })(), o.destroy(), s.destroy(), a.destroy(), u;
        }
    }), ao = {
        uvScale: [ 1, 1 ],
        uvOffset: [ 0, 0 ],
        uBaseColorFactor: [ 1, 1, 1, 1 ],
        uEmitColor: [ 0, 0, 0 ],
        uAlbedoPBRFactor: 1,
        uAnisotropyDirection: 0,
        uAnisotropyFactor: 0,
        uClearCoatF0: .04,
        uClearCoatFactor: 0,
        uClearCoatIor: 1.4,
        uClearCoatRoughnessFactor: .04,
        uClearCoatThickness: 5,
        uEmitColorFactor: 1,
        uOcclusionFactor: 1,
        uRoughnessFactor: .4,
        uMetallicFactor: 0,
        uNormalMapFactor: 1,
        uSpecularF0Factor: .5,
        uSubsurfaceTranslucencyFactor: 1,
        uEmitMultiplicative: 0,
        uNormalMapFlipY: 0,
        uOutputLinear: 0,
        uEnvironmentTransform: ((no = [])[0] = 1, no[1] = 0, no[2] = 0, no[3] = 0, no[4] = 1, 
        no[5] = 0, no[6] = 0, no[7] = 0, no[8] = 1, no),
        uBaseColorTexture: null,
        uNormalTexture: null,
        uOcclusionTexture: null,
        uMetallicRoughnessTexture: null,
        uEmissiveTexture: null,
        uClearCoatTint: [ .006, .006, .006 ],
        uSpecularAntiAliasingVariance: 1,
        uSpecularAntiAliasingThreshold: 1,
        uHsv: [ 0, 0, 0 ],
        bumpTexture: null,
        bumpScale: .05,
        bumpMinLayers: 5,
        bumpMaxLayers: 20
    }, oo = (o(so, ro = Ut), so.prototype.appendDefines = function(e, t) {
        ro.prototype.appendDefines.call(this, e, t);
        var n = this.uniforms;
        return n.GAMMA_CORRECT_INPUT && (e.GAMMA_CORRECT_INPUT = 1), t.data[t.desc.uv0Attribute] && (n.uBaseColorTexture && (e.HAS_ALBEDO_MAP = 1), 
        n.uMetallicRoughnessTexture && (e.HAS_METALLICROUGHNESS_MAP = 1), n.uOcclusionTexture && (e.HAS_AO_MAP = 1), 
        n.uEmissiveTexture && (e.HAS_EMISSIVE_MAP = 1), n.uNormalTexture && (e.HAS_NORMAL_MAP = 1), 
        n.bumpTexture && (e.HAS_BUMP_MAP = 1), (e.HAS_ALBEDO_MAP || e.HAS_METALLICROUGHNESS_MAP || e.HAS_AO_MAP || e.HAS_EMISSIVE_MAP || e.HAS_NORMAL_MAP || e.HAS_BUMP_MAP) && (e.HAS_MAP = 1)), 
        e;
    }, so);
    function so(e) {
        var t = ke({}, ao);
        return (e.uMetallicRoughnessTexture || e.metallicRoughnessTexture) && (t.uRoughnessFactor = 1, 
        t.uMetallicFactor = 1), ro.call(this, e, t) || this;
    }
    var uo, fo = Object.freeze({
        __proto__: null,
        getPBRUniforms: function(u, e, t, n) {
            var r = u.viewMatrix, i = u.projMatrix, a = u.cameraPosition, o = u.getRenderer().canvas, s = function(e) {
                var t, n = u.getLightManager(), r = n.getAmbientResource(), i = n.getAmbientLight(), a = n.getDirectionalLight();
                if (r) {
                    var o = e.prefilterMap.width, s = Math.log(o) / Math.log(2);
                    t = {
                        sSpecularPBR: e.prefilterMap,
                        uDiffuseSPH: e.sh,
                        uTextureEnvironmentSpecularPBRLodRange: [ s, s ],
                        uTextureEnvironmentSpecularPBRTextureSize: [ o, o ],
                        uHdrHsv: i.hsv || [ 0, 0, 0 ]
                    };
                } else t = {
                    uAmbientColor: i.color || [ .2, .2, .2 ]
                };
                return t.uRGBMRange = r ? e.rgbmRange : 7, t.uEnvironmentExposure = We(i.exposure) ? i.exposure : 1, 
                a && (t.uLight0_diffuse = [].concat(a.color || [ 1, 1, 1 ], [ 1 ]), t.uLight0_viewDirection = a.direction || [ 1, 1, -1 ]), 
                t;
            }(e), f = ke({
                viewMatrix: r,
                projMatrix: i,
                projectionMatrix: i,
                projViewMatrix: u.projViewMatrix,
                uCameraPosition: a,
                uGlobalTexSize: [ o.width, o.height ],
                uNearFar: [ u.cameraNear, u.cameraFar ]
            }, s);
            return f.sIntegrateBRDF = t, n && n.ssr && n.ssr.renderUniforms && ke(f, n.ssr.renderUniforms), 
            n && n.jitter ? f.uHalton = n.jitter : f.uHalton = [ 0, 0 ], f;
        },
        createIBLTextures: function(e, t) {
            var n = t.getLightManager(), r = n.getAmbientResource();
            if (!r) return null;
            var i = n.getAmbientLight().exposure;
            return {
                prefilterMap: e.cube({
                    width: r.prefilterMap.width,
                    height: r.prefilterMap.height,
                    faces: r.prefilterMap.faces,
                    min: "linear mipmap linear",
                    mag: "linear",
                    format: "rgba"
                }),
                exposure: We(i) ? i : 1,
                sh: r.sh,
                rgbmRange: r.rgbmRange
            };
        },
        disposeIBLTextures: function(e) {
            for (var t in e) e[t].destroy && e[t].destroy(), delete e[t];
        }
    }), co = (o(lo, uo = lr), lo.prototype.filter = function(e) {
        return e.castShadow;
    }, lo);
    function lo(e) {
        return uo.call(this, {
            vert: "attribute vec3 aPosition;\nuniform mat4 lightProjViewModelMatrix;\nuniform mat4 positionMatrix;\n#include <line_extrusion_vert>\n#include <get_output>\nvarying vec4 vPosition;\nvoid main() {\n  mat4 pX = getPositionMatrix();\n#ifdef IS_LINE_EXTRUSION\nvec3 sj = getLineExtrudePosition(aPosition);\n  vec4 sk = getPosition(sj);\n#else\nvec4 sk = getPosition(aPosition);\n#endif\ngl_Position = lightProjViewModelMatrix * pX * sk;\n  vPosition = gl_Position;\n}",
            frag: "#define SHADER_NAME vsm_mapping\n#ifdef USE_VSM\n#extension GL_OES_standard_derivatives : enable\n#endif\nprecision highp float;\nvarying vec4 vPosition;\n#ifdef PACK_FLOAT\n#include <common_pack_float>\n#endif\nvoid main() {\n  \n#if defined(USE_VSM)\nfloat rS = vPosition.z / vPosition.w;\n  rS = rS * .5 + .5;\n  float sf = rS;\n  float sg = rS * rS;\n  float sh = dFdx(rS);\n  float si = dFdy(rS);\n  sg += .25 * (sh * sh + si * si);\n  gl_FragColor = vec4(sf, sg, rS, .0);\n#endif\n#if defined(USE_ESM)\n#ifdef PACK_FLOAT\ngl_FragColor = common_encodeDepth(gl_FragCoord.z);\n#else\ngl_FragColor = vec4(gl_FragCoord.z, .0, .0, 1.);\n#endif\n#endif\n}",
            uniforms: [ {
                name: "lightProjViewModelMatrix",
                type: "function",
                fn: function(e, t) {
                    return Y([], t.lightProjViewMatrix, t.modelMatrix);
                }
            } ],
            extraCommandProps: {},
            defines: e
        }) || this;
    }
    var ho, po, vo, mo = (o(go, ho = Sr), go.prototype.getMeshCommand = function(e, t) {
        var n = "box_shadow_blur_" + this._blurOffset;
        return this.commands[n] || (this.commands[n] = this.createREGLCommand(e, null, t.getElements())), 
        this.commands[n];
    }, go);
    function go(e) {
        var t, n = e.blurOffset;
        return (t = ho.call(this, {
            vert: Tr,
            frag: "precision highp float;\nvarying vec2 vTexCoord;\nuniform sampler2D textureSource;\nuniform vec2 resolution;\n#include <common_pack_float>\nvoid main() {\n  float rc = .0;\n  float oh = .0;\n  for(int x = -BOXBLUR_OFFSET; x <= BOXBLUR_OFFSET; ++x)\n    for(int y = -BOXBLUR_OFFSET; y <= BOXBLUR_OFFSET; ++y) {\n      vec2 nU = vTexCoord.st + vec2(float(x) / resolution.x, float(y) / resolution.y);\n      nU = clamp(nU, .0, 1.);\n      float rS = common_decodeDepth(texture2D(textureSource, nU));\n      float s = max(.0, sign(1. - rS));\n      oh += sign(rS) * s;\n      rc += rS;\n    }\n  float wy = rc / max(1., oh);\n  gl_FragColor = common_encodeDepth(wy);\n}",
            defines: {
                BOXBLUR_OFFSET: n || 2
            }
        }) || this)._blurOffset = n || 2, t;
    }
    var _o, xo, bo, yo, Ao, To, Eo, Mo, So, wo, Ro, Oo, Co, Bo = ((_o = Fo.prototype).render = function(e, t) {
        var n = t.cameraProjViewMatrix, r = t.lightDir, i = t.farPlane, a = t.cameraLookAt;
        return {
            lightProjViewMatrix: this._renderShadow(e, n, r, i, a),
            shadowMap: this.blurTex || this.depthTex,
            depthFBO: this.depthFBO,
            blurFBO: this.blurFBO
        };
    }, _o.resize = function(e, t) {
        return this.depthTex && (this.depthTex.resize(e, t), this.depthFBO.resize(e, t)), 
        this.blurFBO && (this.blurTex.resize(e, t), this.blurFBO.resize(e, t)), this;
    }, _o._renderShadow = function(e, t, n, r, i) {
        var a = this.renderer, o = po(t);
        if (r) for (var s = 4; s < 8; s++) o[s] = r[s - 4];
        var u = vo(i, o, n);
        return a.clear({
            color: [ 1, 0, 0, 1 ],
            depth: 1,
            framebuffer: this.depthFBO
        }), a.render(this.shadowMapShader, {
            lightProjViewMatrix: u
        }, e, this.depthFBO), this.blurFBO && (this.boxBlurShader || (this.boxBlurShader = new mo({
            blurOffset: this.blurOffset
        })), a.clear({
            color: [ 1, 0, 0, 1 ],
            depth: 1,
            framebuffer: this.blurFBO
        }), a.render(this.boxBlurShader, {
            resolution: [ this.depthTex.width, this.depthTex.height ],
            textureSource: this.depthTex
        }, null, this.blurFBO)), u;
    }, _o._init = function(e) {
        var t = this.renderer.regl, n = this.width, r = this.height;
        this.depthTex = t.texture({
            width: n,
            height: r,
            format: "rgb",
            type: "uint8",
            min: "nearest",
            mag: "nearest"
        }), this.shadowMapShader = new co(e), this.shadowMapShader.filter = function(e) {
            return e.castShadow;
        }, this.depthFBO = t.framebuffer({
            color: this.depthTex
        }), this.blurOffset <= 0 || (this.blurTex = t.texture({
            width: n,
            height: r,
            format: "rgb",
            type: "uint8",
            min: "linear",
            mag: "linear"
        }), this.blurFBO = t.framebuffer({
            color: this.blurTex
        }));
    }, _o.dispose = function() {
        this.depthTex && (this.depthTex.destroy(), this.depthFBO.destroy(), delete this.depthTex, 
        delete this.depthFBO), this.blurTex && (this.blurTex.destroy(), this.blurFBO.destroy(), 
        delete this.blurTex, delete this.blurFBO), this.shadowMapShader && (this.shadowMapShader.dispose(), 
        delete this.shadowMapShader), this.boxBlurShader && (this.boxBlurShader.dispose(), 
        delete this.boxBlurShader);
    }, Fo);
    function Fo(e, t) {
        var n = t.width, r = t.height, i = t.blurOffset, a = t.defines;
        this.renderer = e, this.width = n || 512, this.height = r || 512, this.blurOffset = ze(i) ? 2 : i, 
        this._init(a);
    }
    Oo = [ [ -1, -1, -1, 1 ], [ 1, -1, -1, 1 ], [ 1, 1, -1, 1 ], [ -1, 1, -1, 1 ], [ -1, -1, 1, 1 ], [ 1, -1, 1, 1 ], [ 1, 1, 1, 1 ], [ -1, 1, 1, 1 ] ], 
    Co = new Array(16), po = function(e) {
        x(Co, e);
        for (var t = [], n = 0; n < Oo.length; n++) {
            var r = ce([], Oo[n], Co);
            ie(r, r, 1 / r[3]), t.push(r);
        }
        return t;
    }, xo = new Array(4), bo = new Array(3), yo = [ 0, 0, 0, 0 ], Ao = [ 0, 1, 0 ], 
    To = new Array(3), Eo = new Array(16), Mo = new Array(16), So = new Array(16), wo = [ 1, 1, 1 ], 
    Ro = [ 0, 0, 0 ], vo = function(e, t, n) {
        ee.apply(ye, [ yo ].concat(e, [ 1 ])), Q(bo, n, -1), Eo = K(Eo, J(To, yo, Z(To, bo)), yo, Ao), 
        ce(xo, t[0], Eo);
        for (var r, i, a, o, s, u, f, c, l, h, d = xo[2], p = xo[2], v = xo[0], m = xo[0], g = xo[1], _ = xo[1], x = 1; x < 8; x++) (xo = ce(xo, t[x], Eo))[2] > p && (p = xo[2]), 
        xo[2] < d && (d = xo[2]), xo[0] > m && (m = xo[0]), xo[0] < v && (v = xo[0]), xo[1] > _ && (_ = xo[1]), 
        xo[1] < g && (g = xo[1]);
        c = (s = a = 1) / ((i = -1) - a), l = 1 / ((o = -1) - s), h = 1 / ((u = -p) - (f = -d)), 
        (r = Mo)[0] = -2 * c, r[1] = 0, r[2] = 0, r[3] = 0, r[4] = 0, r[5] = -2 * l, r[6] = 0, 
        r[7] = 0, r[8] = 0, r[9] = 0, r[10] = 2 * h, r[11] = 0, r[12] = (i + a) * c, r[13] = (s + o) * l, 
        r[14] = (f + u) * h, r[15] = 1, Mo = r;
        var b, y, A, T, E, M, S, w, R, O, C, B, F, P, I, D, N, L, U, q, z, G, H, V, k = wo[0] = 2 / (m - v), j = wo[1] = -2 / (_ - g);
        Ro[0] = -.5 * (v + m) * k, Ro[1] = -.5 * (g + _) * j, X(So), w = S = So, O = (R = Ro)[0], 
        C = R[1], B = R[2], V = H = G = z = q = U = L = N = D = I = P = F = void 0, w === S ? (S[12] = w[0] * O + w[4] * C + w[8] * B + w[12], 
        S[13] = w[1] * O + w[5] * C + w[9] * B + w[13], S[14] = w[2] * O + w[6] * C + w[10] * B + w[14], 
        S[15] = w[3] * O + w[7] * C + w[11] * B + w[15]) : (F = w[0], P = w[1], I = w[2], 
        D = w[3], N = w[4], L = w[5], U = w[6], q = w[7], z = w[8], G = w[9], H = w[10], 
        V = w[11], S[0] = F, S[1] = P, S[2] = I, S[3] = D, S[4] = N, S[5] = L, S[6] = U, 
        S[7] = q, S[8] = z, S[9] = G, S[10] = H, S[11] = V, S[12] = F * O + N * C + z * B + w[12], 
        S[13] = P * O + L * C + G * B + w[13], S[14] = I * O + U * C + H * B + w[14], S[15] = D * O + q * C + V * B + w[15]), 
        y = b = So, T = (A = wo)[0], E = A[1], M = A[2], b[0] = y[0] * T, b[1] = y[1] * T, 
        b[2] = y[2] * T, b[3] = y[3] * T, b[4] = y[4] * E, b[5] = y[5] * E, b[6] = y[6] * E, 
        b[7] = y[7] * E, b[8] = y[8] * M, b[9] = y[9] * M, b[10] = y[10] * M, b[11] = y[11] * M, 
        b[12] = y[12], b[13] = y[13], b[14] = y[14], b[15] = y[15];
        var W = Y(Mo, So, Mo);
        return Y(new Array(16), W, Eo);
    };
    var Po, Io = (o(Do, Po = lr), Do.prototype.getMeshCommand = function(e, t) {
        return this.commands.shadow_display || (this.commands.shadow_display = this.createREGLCommand(e, null, t.getElements())), 
        this.commands.shadow_display;
    }, Do);
    function Do(e) {
        return Po.call(this, {
            vert: "#define SHADER_NAME SHADOW_DISPLAY\nattribute vec3 aPosition;\nuniform mat4 projMatrix;\nuniform mat4 modelViewMatrix;\nuniform vec2 halton;\nuniform vec2 globalTexSize;\nvarying vec4 vPosition;\n#include <vsm_shadow_vert>\nvoid main() {\n  vec4 nL = vec4(aPosition, 1.);\n  vec4 sm = modelViewMatrix * nL;\n  mat4 qA = projMatrix;\n  qA[2].xy += halton.xy / globalTexSize.xy;\n  gl_Position = qA * sm;\n  vPosition = gl_Position;\n  shadow_computeShadowPars(nL);\n}",
            frag: "#define SHADER_NAME SHADOW_DISPLAY\nprecision mediump float;\nuniform vec3 color;\n#include <vsm_shadow_frag>\nvoid main() {\n  float sl = shadow_computeShadow();\n  float qv = 1. - sl;\n  gl_FragColor = vec4(color * qv, qv);\n}",
            uniforms: [ {
                name: "modelViewMatrix",
                type: "function",
                fn: function(e, t) {
                    var n = [];
                    return Y(n, t.viewMatrix, t.modelMatrix), n;
                }
            } ],
            defines: e || {
                USE_ESM: 1
            },
            extraCommandProps: {
                depth: {
                    enable: !0,
                    mask: !1
                },
                viewport: {
                    x: 0,
                    y: 0,
                    width: function(e, t) {
                        return t.globalTexSize[0];
                    },
                    height: function(e, t) {
                        return t.globalTexSize[1];
                    }
                }
            }
        }) || this;
    }
    function No(e) {
        return 256 * e[2] * 256 + 256 * e[1] + e[0];
    }
    var Lo, Uo = new Uint8Array(4), qo = new Float32Array(Uo.buffer), zo = ((Lo = Go.prototype)._init = function() {
        var e = [];
        this._uniforms && e.push.apply(e, this._uniforms);
        var t = {
            ENABLE_PICKING: 1,
            HAS_PICKING_ID: 1
        };
        if (this._defines) for (var n in this._defines) t[n] = this._defines[n];
        var r = this._vert, i = this._extraCommandProps;
        this._shader0 = new lr({
            vert: r,
            frag: "\n    precision highp float;\n\n    varying float vPickingId;\n    varying float vFbo_picking_visible;\n\n    uniform float fbo_picking_meshId;\n\n    \n    vec3 unpack(highp float f) {\n        highp vec3 color;\n        color.b = floor(f / 65536.0);\n        color.g = floor((f - color.b * 65536.0) / 256.0);\n        color.r = f - floor(color.b * 65536.0) - floor(color.g * 256.0);\n        // now we have a vec3 with the 3 components in range [0..255]. Let's normalize it!\n        return color / 255.0;\n    }\n\n\n    void main() {\n        if (vFbo_picking_visible == 0.0) {\n            discard;\n            return;\n        }\n        gl_FragColor = vec4(unpack(vPickingId), fbo_picking_meshId / 255.0);\n    }\n",
            uniforms: e,
            defines: t,
            extraCommandProps: i
        }), this._shader2 = new lr({
            vert: r,
            frag: "\n    precision highp float;\n\n    varying float vPickingId;\n    varying float vFbo_picking_visible;\n\n    \n    vec3 unpack(highp float f) {\n        highp vec3 color;\n        color.b = floor(f / 65536.0);\n        color.g = floor((f - color.b * 65536.0) / 256.0);\n        color.r = f - floor(color.b * 65536.0) - floor(color.g * 256.0);\n        // now we have a vec3 with the 3 components in range [0..255]. Let's normalize it!\n        return color / 255.0;\n    }\n\n\n    void main() {\n        if (vFbo_picking_visible == 0.0) {\n            discard;\n            return;\n        }\n        gl_FragColor = vec4(unpack(vPickingId), 1.0);\n    }\n",
            uniforms: e,
            defines: t,
            extraCommandProps: i
        });
        var a = {
            ENABLE_PICKING: 1,
            HAS_PICKING_ID: 1
        };
        if (this._defines) for (var o in this._defines) a[o] = this._defines[o];
        this._shader1 = new lr({
            vert: r,
            frag: "\n    precision highp float;\n\n    uniform int fbo_picking_meshId;\n    varying float vFbo_picking_visible;\n\n    \n    vec3 unpack(highp float f) {\n        highp vec3 color;\n        color.b = floor(f / 65536.0);\n        color.g = floor((f - color.b * 65536.0) / 256.0);\n        color.r = f - floor(color.b * 65536.0) - floor(color.g * 256.0);\n        // now we have a vec3 with the 3 components in range [0..255]. Let's normalize it!\n        return color / 255.0;\n    }\n\n\n    void main() {\n        if (vFbo_picking_visible == 0.0) {\n            discard;\n            return;\n        }\n        gl_FragColor = vec4(unpack(float(fbo_picking_meshId)), 1.0);\n        // gl_FragColor = vec4(unpack(float(35)), 1.0);\n    }\n",
            uniforms: e,
            defines: a,
            extraCommandProps: i
        }), this._depthShader = new lr({
            vert: r,
            frag: "\n    #define SHADER_NAME depth\n\n    precision highp float;\n    varying float vFbo_picking_viewZ;\n\n    #include <common_pack_float>\n\n    void main() {\n        gl_FragColor = common_unpackFloat(vFbo_picking_viewZ);\n        // gl_FragColor = unpack(34678.3456789);\n    }\n",
            uniforms: e,
            defines: a,
            extraCommandProps: i
        }), this._scene = new qn(), this._scene1 = new qn();
    }, Lo.filter = function() {
        return !0;
    }, Lo.render = function(e, t, n) {
        var r = this;
        if (void 0 === n && (n = !1), !e || !e.length) return this;
        var i = this._fbo;
        n && this.clear(), this._scene.setMeshes(e);
        var a = this._getShader(e, n);
        a.filter = this.filter, this._currentShader && a !== this._currentShader && this.clear(), 
        this._currentShader = a, e.forEach(function(e, t) {
            e.setUniform("fbo_picking_meshId", t + r._currentMeshes.length);
        });
        for (var o = 0; o < e.length; o++) this._currentMeshes.push(e[o]);
        return this._renderer.render(a, t, this._scene, i), this;
    }, Lo.pick = function(e, t, n, r, i) {
        void 0 === i && (i = {});
        var a = this._currentShader, o = this._currentMeshes;
        if (!a || !o || !o.length) return {
            pickingId: null,
            meshId: null,
            point: null
        };
        e = Math.round(e), t = Math.round(t);
        var s = this._fbo;
        if (e <= 2 || e >= s.width - 2 || t <= 2 || t >= s.height - 2) return {
            pickingId: null,
            meshId: null,
            point: null
        };
        for (var u = this._getParams(e, t, n, s), f = u.px, c = u.py, l = u.width, h = u.height, d = new Uint8Array(4 * l * h), p = this._renderer.regl.read({
            data: d,
            x: f,
            y: c,
            framebuffer: s,
            width: l,
            height: h
        }), v = [], m = [], g = 0; g < p.length; g += 4) {
            var _ = this._packData(p.subarray(g, g + 4), a), x = _.pickingId, b = _.meshId;
            v.push(b), m.push(x);
        }
        var y = {}, A = v.filter(function(e) {
            return null != e && !y[e] && (y[e] = 1, !0);
        }).map(function(e) {
            return o[e];
        });
        v.length && a === this._shader1 && o[0].geometry.data.aPickingId && (m = this._getPickingId(f, c, l, h, d, A, r));
        var T = [];
        if (v.length && i.returnPoint) for (var E = i.viewMatrix, M = i.projMatrix, S = this._pickDepth(f, c, l, h, d, A, r), w = 0; w < S.length; w++) if (S[w] && null != v[w] && null != m[w]) {
            var R = this._getWorldPos(e, t, S[w], E, M);
            T.push(R);
        } else T.push(null);
        for (var O = [], C = 0; C <= n; C++) O.push(C), 0 < C && O.push(-C);
        for (var B = 0; B < O.length; B++) for (var F = 0; F < O.length; F++) {
            var P = (O[F] + n) * l + (O[B] + n);
            if (null != v[P] && null != m[P]) return {
                meshId: v[P],
                pickingId: m[P],
                point: T[P] || null
            };
        }
        return {
            pickingId: null,
            meshId: null,
            point: null
        };
    }, Lo.clear = function() {
        return this._fbo && this._clearFbo(this._fbo), this._currentMeshes = [], delete this._currentShader, 
        this;
    }, Lo.getMeshAt = function(e) {
        return this._currentMeshes ? this._currentMeshes[e] : null;
    }, Lo.getRenderedMeshes = function() {
        return this._currentMeshes;
    }, Lo.dispose = function() {
        this.clear(), this._shader0 && this._shader0.dispose(), this._shader1 && this._shader1.dispose(), 
        this._shader2 && this._shader2.dispose(), this._scene && this._scene.clear(), this._scene1 && this._scene1.clear();
    }, Lo._getWorldPos = function(e, t, n, r, i) {
        var a = this._fbo, o = [], s = a.width / 2 || 1, u = a.height / 2 || 1, f = [ (e - s) / s, (u - t) / u, 0, 1 ], c = [ (e - s) / s, (u - t) / u, 1, 1 ], l = x(o, i), h = [], d = [];
        Ho(h, f, l), Ho(d, c, l);
        var p = -h[2], v = (n - p) / (-d[2] - p), m = x(o, Y(o, i, r)), g = Ho(f, f, m), _ = Ho(c, c, m);
        return [ Xe(g[0], _[0], v), Xe(g[1], _[1], v), Xe(g[2], _[2], v) ];
    }, Lo._getPickingId = function(e, t, n, r, i, a, o) {
        var s = this._renderer.regl, u = this._getFBO1();
        this._clearFbo(u), this._scene1.setMeshes(a), this._renderer.render(this._shader2, o, this._scene1, u);
        for (var f = s.read({
            data: i,
            x: e,
            y: t,
            framebuffer: u,
            width: n,
            height: r
        }), c = [], l = 0; l < f.length; l += 4) c.push(No(f.subarray(l, l + 4)));
        return c;
    }, Lo._pickDepth = function(e, t, n, r, i, a, o) {
        var s = this._renderer.regl, u = this._getFBO1();
        this._scene1.setMeshes(a), this._clearFbo(u), this._renderer.render(this._depthShader, o, this._scene1, u);
        for (var f, c = s.read({
            data: i,
            x: e,
            y: t,
            framebuffer: u,
            width: n,
            height: r
        }), l = [], h = 0; h < c.length; h += 4) l.push((f = c.subarray(h, h + 4), Uo[0] = f[3], 
        Uo[1] = f[2], Uo[2] = f[1], Uo[3] = f[0], qo[0]));
        return l;
    }, Lo._packData = function(e, t) {
        if (255 === e[0] && 255 === e[1] && 255 === e[2] && 255 === e[3]) return {
            meshId: null,
            pickingId: null
        };
        var n = null, r = null;
        return t === this._shader1 ? r = No(e) : (r = t === this._shader0 ? e[3] : null, 
        n = No(e)), {
            meshId: r,
            pickingId: n
        };
    }, Lo._clearFbo = function(e) {
        this._renderer.regl.clear({
            color: [ 1, 1, 1, 1 ],
            depth: 1,
            stencil: 0,
            framebuffer: e
        });
    }, Lo._getShader = function(e, t) {
        return t && e.length < 256 ? this._shader0 : this._shader1;
    }, Lo._getFBO1 = function() {
        var e = this._renderer.regl, t = this._fbo;
        return this._fbo1 ? this._fbo1.width === t.width && this._fbo1.height === t.height || this._fbo1.resize(t.width, t.height) : this._fbo1 = e.framebuffer(t.width, t.height), 
        this._fbo1;
    }, Lo._getParams = function(e, t, n, r) {
        e -= n, t = r.height - t;
        var i = 2 * n + 1, a = 2 * n + 1, o = e + i, s = (t -= n) + a;
        return o > r.width && (i -= o - r.width), s > r.height && (a -= s - r.height), {
            px: e = e < 0 ? 0 : e,
            py: t = t < 0 ? 0 : t,
            width: i,
            height: a
        };
    }, Lo.getPickingVert = function() {
        return this._vert;
    }, Lo.getUniformDeclares = function() {
        return this._uniforms;
    }, Go);
    function Go(e, t, n) {
        var r = t.vert, i = t.uniforms, a = t.defines, o = t.extraCommandProps;
        this._renderer = e, this._fbo = n, this._clearFbo(n), this._vert = r, this._uniforms = i, 
        this._defines = a, this._extraCommandProps = o, this._currentMeshes = [], this._init();
    }
    function Ho(e, t, n) {
        var r = t[0], i = t[1], a = t[2], o = 1 / (n[3] * r + n[7] * i + n[11] * a + n[15]);
        return e[0] = (n[0] * r + n[4] * i + n[8] * a + n[12]) * o, e[1] = (n[1] * r + n[5] * i + n[9] * a + n[13]) * o, 
        e[2] = (n[2] * r + n[6] * i + n[10] * a + n[14]) * o, e;
    }
    var Vo, ko, jo, Wo = {
        parseHDR: Xn
    }, Xo = {
        PBRHelper: io,
        StandardMaterial: oo,
        StandardSpecularGlossinessMaterial: (o(Jo, jo = $t(oo)), Jo),
        StandardShader: (o(Ko, ko = lr), Ko.prototype.getGeometryDefines = function(e) {
            var t = {};
            return e.data[e.desc.tangentAttribute] && (t.HAS_TANGENT = 1), t;
        }, Ko),
        StandardDepthShader: (o(Yo, Vo = lr), Yo),
        PBRUtils: fo
    };
    function Yo(e) {
        void 0 === e && (e = {});
        var t = [ {
            name: "uProjectionMatrix",
            type: "function",
            fn: function(e, t) {
                return t.projMatrix;
            }
        }, {
            name: "uModelViewMatrix",
            type: "function",
            fn: function(e, t) {
                return Y([], t.viewMatrix, t.modelMatrix);
            }
        } ], n = e.extraCommandProps;
        return Vo.call(this, {
            vert: "#define SHADER_NAME depth_vert\nprecision highp float;\nattribute vec3 aPosition;\n#include <line_extrusion_vert>\nuniform mat4 uModelViewMatrix;\nuniform mat4 positionMatrix;\nuniform mat4 uProjectionMatrix;\nuniform vec2 uGlobalTexSize;\nuniform vec2 uHalton;\n#include <get_output>\nvoid main() {\n  mat4 pX = getPositionMatrix();\n#ifdef IS_LINE_EXTRUSION\nvec4 sk = getPosition(getLineExtrudePosition(aPosition));\n#else\nvec4 sk = getPosition(aPosition);\n#endif\nvec4 sm = uModelViewMatrix * pX * sk;\n  mat4 qA = uProjectionMatrix;\n  qA[2].xy += uHalton.xy / uGlobalTexSize.xy;\n  gl_Position = qA * sm;\n}",
            frag: "#define SHADER_NAME depth_frag\nprecision highp float;\nvoid main() {\n  gl_FragColor = vec4(1., .0, .0, 1.);\n}",
            uniforms: t,
            extraCommandProps: n,
            defines: e.defines
        }) || this;
    }
    function Ko(e) {
        var t;
        void 0 === e && (e = {});
        var n = e.extraCommandProps || {}, r = e.uniforms;
        n = ke({}, n);
        var i = e.defines || {}, a = [ {
            name: "uModelMatrix",
            type: "function",
            fn: function(e, t) {
                return t.modelMatrix;
            }
        }, {
            name: "uModelNormalMatrix",
            type: "function",
            fn: function(e, t) {
                return u([], t.modelMatrix);
            }
        }, {
            name: "uModelViewNormalMatrix",
            type: "function",
            fn: function(e, t) {
                var n = Y([], t.viewMatrix, t.modelMatrix), r = x(n, n);
                return u([], h(r, r));
            }
        }, {
            name: "uProjectionMatrix",
            type: "function",
            fn: function(e, t) {
                return t.projMatrix;
            }
        }, {
            name: "uModelViewMatrix",
            type: "function",
            fn: function(e, t) {
                return Y([], t.viewMatrix, t.modelMatrix);
            }
        } ];
        return r && a.push.apply(a, r), (t = ko.call(this, {
            vert: "#include <gl2_vert>\n#define SHADER_NAME PBR\nprecision highp float;\nattribute vec3 aPosition;\n#if defined(HAS_MAP)\nattribute vec2 aTexCoord;\nuniform vec2 uvScale;\nuniform vec2 uvOffset;\n#endif\n#if defined(HAS_TANGENT)\nattribute vec4 aTangent;\n#else\nattribute vec3 aNormal;\n#endif\nvec3 tx;\nvec3 qy;\nvec4 ty;\nuniform mat4 uModelMatrix;\nuniform mat4 uModelViewMatrix;\nuniform mat4 positionMatrix;\nuniform mat4 uProjectionMatrix;\nuniform vec2 uGlobalTexSize;\nuniform vec2 uHalton;\nuniform mediump vec3 uCameraPosition;\nuniform mat3 uModelNormalMatrix;\n#ifdef HAS_SSR\nuniform mat3 uModelViewNormalMatrix;\nvarying vec3 vViewNormal;\n#ifdef HAS_TANGENT\nvarying vec4 vViewTangent;\n#endif\n#endif\nvarying vec3 vModelNormal;\nvarying vec4 vViewVertex;\n#if defined(HAS_TANGENT)\nvarying vec4 vModelTangent;\nvarying vec3 vModelBiTangent;\n#endif\nvarying vec3 vModelVertex;\n#if defined(HAS_MAP)\nvarying vec2 vTexCoord;\n#endif\n#if defined(HAS_COLOR)\nattribute vec4 aColor;\nvarying vec4 vColor;\n#endif\n#include <line_extrusion_vert>\n#include <get_output>\n#include <viewshed_vert>\n#include <flood_vert>\n#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)\n#include <vsm_shadow_vert>\n#endif\n#include <heatmap_render_vert>\n#include <fog_render_vert>\n#ifdef HAS_BUMP_MAP\nvarying vec3 vTangentViewPos;\nvarying vec3 vTangentFragPos;\n#if __VERSION__ == 100\nmat3 tz(in mat3 tA) {\n  vec3 tB = tA[0];\n  vec3 tC = tA[1];\n  vec3 tD = tA[2];\n  return mat3(vec3(tB.x, tC.x, tD.x), vec3(tB.y, tC.y, tD.y), vec3(tB.z, tC.z, tD.z));\n}\n#else\nmat3 tz(in mat3 tA) {\n  return transpose(tA);\n}\n#endif\n#endif\nvoid qw(const highp vec4 q, out highp vec3 nP) {\n  nP = vec3(.0, .0, 1.) + vec3(2., -2., -2.) * q.x * q.zwx + vec3(2., 2., -2.) * q.y * q.wzy;\n}\nvoid qw(const highp vec4 q, out highp vec3 nP, out highp vec3 t) {\n  qw(q, nP);\n  t = vec3(1., .0, .0) + vec3(-2., 2., -2.) * q.y * q.yxw + vec3(-2., 2., 2.) * q.z * q.zwx;\n}\nvoid main() {\n  \n#if defined(HAS_MAP)\nvTexCoord = (aTexCoord + uvOffset) * uvScale;\n#endif\n#if defined(HAS_TANGENT)\nvec3 t;\n  qw(aTangent, qy, t);\n  vModelTangent = vec4(uModelNormalMatrix * t, aTangent.w);\n#else\nqy = aNormal;\n#endif\nmat4 pX = getPositionMatrix();\n#ifdef IS_LINE_EXTRUSION\nvec3 sj = getLineExtrudePosition(aPosition);\n  vec4 sk = getPosition(sj);\n#else\nvec4 sk = getPosition(aPosition);\n#endif\nvModelVertex = (uModelMatrix * sk).xyz;\n  vec3 qz = qy;\n  vModelNormal = uModelNormalMatrix * qz;\n#if defined(HAS_TANGENT)\nvModelBiTangent = cross(vModelNormal, vModelTangent.xyz) * sign(aTangent.w);\n#endif\n#ifdef HAS_SSR\nvViewNormal = uModelViewNormalMatrix * qy;\n#if defined(HAS_TANGENT)\nvec4 tE = vec4(t, aTangent.w);\n  vViewTangent = vec4(uModelViewNormalMatrix * tE.xyz, tE.w);\n#endif\n#endif\nvec4 sm = uModelViewMatrix * pX * sk;\n  vViewVertex = sm;\n  mat4 qA = uProjectionMatrix;\n  qA[2].xy += uHalton.xy / uGlobalTexSize.xy;\n  gl_Position = qA * sm;\n#if defined(HAS_COLOR)\nvColor = aColor / 255.;\n#endif\n#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)\nshadow_computeShadowPars(sk);\n#endif\n#ifdef HAS_VIEWSHED\nviewshed_getPositionFromViewpoint(modelMatrix * pX * sk);\n#endif\n#ifdef HAS_FLOODANALYSE\nflood_getHeight(modelMatrix * pX * sk);\n#endif\n#ifdef HAS_HEATMAP\nheatmap_compute(uProjectionMatrix * uModelViewMatrix * pX, sk);\n#endif\n#ifdef HAS_FOG\nfog_getDist(modelMatrix * pX * sk);\n#endif\n#ifdef HAS_BUMP_MAP\nmat3 tF = tz(mat3(vModelTangent.xyz, vModelBiTangent, vModelNormal));\n  vTangentViewPos = tF * uCameraPosition;\n  vTangentFragPos = tF * vModelVertex;\n#endif\n}",
            frag: "#if __VERSION__ == 100\n#if defined(GL_EXT_shader_texture_lod)\n#extension GL_EXT_shader_texture_lod : enable\n#define textureCubeLod(tex, uv, lod) textureCubeLodEXT(tex, uv, lod)\n#else\n#define textureCubeLod(tex, uv, lod) textureCube(tex, uv, lod)\n#endif\n#if defined(GL_OES_standard_derivatives)\n#extension GL_OES_standard_derivatives : enable\n#endif\n#else\n#define textureCubeLod(tex, uv, lod) textureLod(tex, uv, lod)\n#endif\n#define saturate(x)        clamp(x, 0.0, 1.0)\nprecision mediump float;\n#include <gl2_frag>\n#include <hsv_frag>\nuniform vec3 uHsv;\nstruct MaterialUniforms {\n  vec2 roughnessMetalness;\n  vec3 albedo;\n  float alpha;\n  vec3 normal;\n  vec3 emit;\n  float ao;\n  vec3 specularColor;\n  float glossiness;\n} wz;\n#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)\n#include <vsm_shadow_frag>\n#endif\nuniform vec3 uCameraPosition;\n#if defined(SHADING_MODEL_SPECULAR_GLOSSINESS)\nuniform vec4 uDiffuseFactor;\nuniform vec3 uSpecularFactor;\nuniform float uGlossinessFactor;\n#if defined(HAS_DIFFUSE_MAP)\nuniform sampler2D uDiffuseTexture;\n#endif\n#if defined(HAS_SPECULARGLOSSINESS_MAP)\nuniform sampler2D uSpecularGlossinessTexture;\n#endif\n#endif\nuniform vec3 uEmitColor;\nuniform vec4 uBaseColorFactor;\nuniform float uAlbedoPBRFactor;\nuniform float uAnisotropyDirection;\nuniform float uAnisotropyFactor;\nuniform float uClearCoatF0;\nuniform float uClearCoatFactor;\nuniform float uClearCoatIor;\nuniform float uClearCoatRoughnessFactor;\nuniform float uClearCoatThickness;\nuniform float uEmitColorFactor;\nuniform float uOcclusionFactor;\nuniform float uEnvironmentExposure;\nuniform float uRoughnessFactor;\nuniform float uMetallicFactor;\nuniform float uNormalMapFactor;\nuniform float uRGBMRange;\nuniform float uSpecularF0Factor;\nuniform float uStaticFrameNumShadow3;\nuniform float uSubsurfaceScatteringFactor;\nuniform float uSubsurfaceTranslucencyFactor;\nuniform float uSubsurfaceTranslucencyThicknessFactor;\nuniform int uEmitMultiplicative;\nuniform int uNormalMapFlipY;\nuniform int uOutputLinear;\nuniform mat3 uEnvironmentTransform;\n#if defined(HAS_ALBEDO_MAP)\nuniform sampler2D uBaseColorTexture;\n#endif\n#if defined(HAS_METALLICROUGHNESS_MAP)\nuniform sampler2D uMetallicRoughnessTexture;\n#endif\n#if defined(HAS_EMISSIVE_MAP)\nuniform sampler2D uEmissiveTexture;\n#endif\n#if defined(HAS_AO_MAP)\nuniform sampler2D uOcclusionTexture;\n#endif\n#if defined(HAS_NORMAL_MAP)\nuniform sampler2D uNormalTexture;\n#endif\nuniform sampler2D sIntegrateBRDF;\n#if defined(HAS_IBL_LIGHTING)\nuniform vec3 uHdrHsv;\nuniform samplerCube sSpecularPBR;\nuniform vec3 uDiffuseSPH[9];\nuniform vec2 uTextureEnvironmentSpecularPBRLodRange;\nuniform vec2 uTextureEnvironmentSpecularPBRTextureSize;\n#else\nuniform vec3 uAmbientColor;\n#endif\nuniform vec2 uNearFar;\nuniform vec3 uClearCoatTint;\nuniform vec3 uLight0_viewDirection;\nuniform vec4 uLight0_diffuse;\n#ifdef HAS_SSR\nvarying vec3 vViewNormal;\n#if defined(HAS_TANGENT)\nvarying vec4 vViewTangent;\n#endif\n#endif\nvarying vec3 vModelVertex;\nvarying vec4 vViewVertex;\n#if defined(HAS_MAP)\nvarying vec2 vTexCoord;\n#endif\nvarying vec3 vModelNormal;\n#if defined(HAS_TANGENT)\nvarying vec4 vModelTangent;\nvarying vec3 vModelBiTangent;\n#endif\n#if defined(HAS_COLOR)\nvarying vec4 vColor;\n#elif defined(IS_LINE_EXTRUSION)\nuniform vec4 lineColor;\n#else\nuniform vec4 polygonFill;\n#endif\n#ifdef HAS_INSTANCE_COLOR\nvarying vec4 vInstanceColor;\n#endif\n#ifdef IS_LINE_EXTRUSION\nuniform float lineOpacity;\n#else\nuniform float polygonOpacity;\n#endif\n#include <viewshed_frag>\n#include <flood_frag>\n#include <heatmap_render_frag>\n#include <fog_render_frag>\n#ifdef HAS_BUMP_MAP\nuniform sampler2D bumpTexture;\nuniform float bumpScale;\nuniform float bumpMaxLayers;\nuniform float bumpMinLayers;\nvec2 wA(vec2 nU, vec3 qm) {\n  float wB = mix(bumpMaxLayers, bumpMinLayers, abs(dot(vec3(.0, .0, 1.), qm)));\n  float wC = 1. / wB;\n  float wD = .0;\n  vec2 wE = qm.xy * bumpScale / (qm.z * wB);\n  vec2 wF = nU;\n  float wG = texture2D(bumpTexture, wF).r;\n  for(int tY = 0; tY < 30; tY++) {\n    wD += wC;\n    wF -= wE;\n    wG = texture2D(bumpTexture, wF).r;\n    if(wG < wD) {\n      break;\n    }\n  }\n  vec2 wH = wF + wE;\n  float wI = wG - wD;\n  float wJ = texture2D(bumpTexture, wH).r - wD + wC;\n  return mix(wF, wH, wI / (wI - wJ));\n}\nvarying vec3 vTangentViewPos;\nvarying vec3 vTangentFragPos;\n#endif\n#define SHADER_NAME PBR\nfloat qc(const in float pa) {\n  return pa < .0031308 ? pa * 12.92 : 1.055 * pow(pa, 1. / 2.4) - .055;\n}\nvec3 qc(const in vec3 pa) {\n  return vec3(pa.r < .0031308 ? pa.r * 12.92 : 1.055 * pow(pa.r, 1. / 2.4) - .055, pa.g < .0031308 ? pa.g * 12.92 : 1.055 * pow(pa.g, 1. / 2.4) - .055, pa.b < .0031308 ? pa.b * 12.92 : 1.055 * pow(pa.b, 1. / 2.4) - .055);\n}\nvec4 qc(const in vec4 pa) {\n  return vec4(pa.r < .0031308 ? pa.r * 12.92 : 1.055 * pow(pa.r, 1. / 2.4) - .055, pa.g < .0031308 ? pa.g * 12.92 : 1.055 * pow(pa.g, 1. / 2.4) - .055, pa.b < .0031308 ? pa.b * 12.92 : 1.055 * pow(pa.b, 1. / 2.4) - .055, pa.a);\n}\nfloat qJ(const in float pa) {\n  return pa < .04045 ? pa * (1. / 12.92) : pow((pa + .055) * (1. / 1.055), 2.4);\n}\nvec3 qJ(const in vec3 pa) {\n  return vec3(pa.r < .04045 ? pa.r * (1. / 12.92) : pow((pa.r + .055) * (1. / 1.055), 2.4), pa.g < .04045 ? pa.g * (1. / 12.92) : pow((pa.g + .055) * (1. / 1.055), 2.4), pa.b < .04045 ? pa.b * (1. / 12.92) : pow((pa.b + .055) * (1. / 1.055), 2.4));\n}\nvec4 qJ(const in vec4 pa) {\n  return vec4(pa.r < .04045 ? pa.r * (1. / 12.92) : pow((pa.r + .055) * (1. / 1.055), 2.4), pa.g < .04045 ? pa.g * (1. / 12.92) : pow((pa.g + .055) * (1. / 1.055), 2.4), pa.b < .04045 ? pa.b * (1. / 12.92) : pow((pa.b + .055) * (1. / 1.055), 2.4), pa.a);\n}\nvec3 rk(const in vec4 rgba) {\n  const float rl = 8.;\n  return rgba.rgb * rl * rgba.a;\n}\nconst mat3 rm = mat3(6.0013, -2.7, -1.7995, -1.332, 3.1029, -5.772, .3007, -1.088, 5.6268);\nvec3 rn(const in vec4 ro) {\n  float rp = ro.z * 255. + ro.w;\n  vec3 rq;\n  rq.y = exp2((rp - 127.) / 2.);\n  rq.z = rq.y / ro.y;\n  rq.x = ro.x * rq.z;\n  vec3 rr = rm * rq;\n  return max(rr, .0);\n}\nconst mat3 wK = mat3(.2209, .3390, .4184, .1138, .6780, .7319, .0102, .1130, .2969);\nvec4 wL(in vec3 rgb) {\n  vec4 oi;\n  vec3 rq = rgb * wK;\n  rq = max(rq, vec3(1e-6));\n  oi.xy = rq.xy / rq.z;\n  float rp = 2. * log2(rq.y) + 127.;\n  oi.w = fract(rp);\n  oi.z = (rp - floor(oi.w * 255.) / 255.) / 255.;\n  return oi;\n}\nvec4 rf(const in vec3 pa, const in float rg) {\n  if(rg <= .0)\n    return vec4(pa, 1.);\n  vec4 rh;\n  vec3 ri = pa / rg;\n  rh.a = clamp(max(max(ri.r, ri.g), max(ri.b, 1e-6)), .0, 1.);\n  rh.a = ceil(rh.a * 255.) / 255.;\n  rh.rgb = ri / rh.a;\n  return rh;\n}\nvec3 rj(const in vec4 pa, const in float rg) {\n  if(rg <= .0)\n    return pa.rgb;\n  return rg * pa.rgb * pa.a;\n}\nvec3 wM() {\n  return wz.albedo;\n}\nfloat wN() {\n  return wz.alpha;\n}\nfloat wO() {\n  \n#if defined(SHADING_MODEL_SPECULAR_GLOSSINESS)\nvec3 pa = wz.specularColor;\n  return max(max(pa.r, pa.g), pa.b);\n#else\nreturn wz.roughnessMetalness.y;\n#endif\n}\nfloat wP() {\n  return uSpecularF0Factor;\n}\nfloat wQ() {\n  \n#if defined(SHADING_MODEL_SPECULAR_GLOSSINESS)\nreturn 1. - wz.glossiness;\n#else\nreturn wz.roughnessMetalness.x;\n#endif\n}\nvec3 wR() {\n  return wz.emit;\n}\nfloat wS() {\n  return uSubsurfaceTranslucencyFactor;\n}\nvec3 wT() {\n  return wz.normal;\n}\nfloat wU() {\n  return uClearCoatFactor;\n}\nfloat wV() {\n  return uClearCoatRoughnessFactor;\n}\nfloat wW() {\n  return wz.ao;\n}\nint uD(const in vec4 rR) {\n  float uE = floor(rR.b * 255. + .5);\n  float uF = mod(uE, 2.);\n  uF += mod(uE - uF, 4.);\n  return int(uF);\n}\nfloat uI(const in vec4 rR) {\n  if(uD(rR) == 0) {\n    const vec3 wX = 1. / vec3(1., 255., 65025.);\n    return dot(rR.rgb, wX);\n  }\n  return rR.r + rR.g / 255.;\n}\nfloat wY(const in vec4 rR) {\n  float wZ = rR.b - mod(rR.b, 4. / 255.);\n  return wZ * 255. / 4. / 63.;\n}\nfloat uJ(const in vec4 rR) {\n  return rR.a;\n}\nfloat xa(const in sampler2D rS, const in vec2 nU, const in vec4 xb, const vec2 xc) {\n  float xd = clamp((-xb.z * xb.w - xc.x) / (xc.y - xc.x), .0, 1.);\n  return xd - uI(texture2D(rS, nU));\n}\nfloat qB(const in vec2 qC) {\n  vec3 qD = fract(vec3(qC.xyx) * .1031);\n  qD += dot(qD, qD.yzx + 19.19);\n  return fract((qD.x + qD.y) * qD.z);\n}\nfloat qK(const in vec2 qC, const in float qL) {\n  vec3 qM = vec3(.06711056, .00583715, 52.9829189);\n  return fract(qM.z * fract(dot(qC.xy + qL * vec2(47., 17.) * .695, qM.xy))) * .5;\n}\nfloat xe(const in vec2 qC, const in float qL) {\n  float xf = qL;\n  float xg = fract((qC.x + qC.y * 2. - 1.5 + xf) / 5.);\n  float wp = fract(dot(vec2(171., 231.) / 71., qC.xy));\n  return (xg * 5. + wp) * (1.2 / 6.);\n}\nvoid xh(const in vec4 qC, const in int xi, const in float qv, const in float qI, const in float xj, const in float qL, const in vec2 xc, const in vec4 xk) {\n  if(xi != 1) {\n    if(qv < qI)\n      discard;\n    return;\n  }\n  float xl;\n  if(xj == .0) {\n    float xm = (1. / qC.w - xc.x) / (xc.y - xc.x);\n    float xn = floor(xm * 500.0) / 500.0;\n    xl = qK(qC.xy + xn, qL);\n  } else {\n    xl = qB(qC.xy + xk.xy * 1000.0 + qC.z * (abs(xk.z) == 2. ? 1000.0 : 1.));\n  }\n  if(qv * qI < xl)\n    discard;\n  \n}\nvec3 xo(const in vec4 tS, const in vec3 qa, const in vec2 xp) {\n  vec3 xq = normalize(tS.xyz);\n  vec3 xr = tS.w * normalize(cross(qa, xq));\n  return normalize(qa + xp.x * xq + xp.y * xr);\n}\nvec3 pZ(const in float qI, in vec3 qa, const in vec3 t, const in vec3 b, in vec3 nP) {\n  qa.xy = qI * qa.xy;\n  mat3 qb = mat3(t, b, nP);\n  return normalize(qb * qa);\n}\nvec3 xs(in vec2 tS, const in vec3 t, const in vec3 b) {\n  return normalize(tS.x * t + tS.y * b);\n}\nvec3 xt(in vec2 xu, const in vec3 t, const in vec3 b, in vec3 nP) {\n  return normalize(xu.x * t + xu.y * b + nP);\n}\nfloat xv(const in vec4 rgba) {\n  return dot(rgba, vec4(1., 1. / 255., 1. / 65025., 1. / 16581375.));\n}\nfloat xw(const in sampler2D xx, const in vec2 nU) {\n  return xv(texture2D(xx, nU));\n}\nfloat xy(const in sampler2D xx, const in vec2 nU, const in float xz, const in vec4 xA) {\n  float rS = xw(xx, clamp(nU, xA.xy, xA.zw));\n  return xz - rS;\n}\nfloat xB(const in float pI, const in vec4 xC) {\n  float xD = xC.x;\n  float xE = xC.y * pI;\n  float xF = xC.z * pI * pI;\n  return 1. / (xD + xE + xF);\n}\nvoid xG(const in vec3 qa, const in vec3 sm, const in vec3 xH, const in vec4 xC, const in vec3 xI, const in float xJ, const in float xK, out float xL, out vec3 xM, out float xN) {\n  xM = xI - sm;\n  float pI = length(xM);\n  xM = pI > .0 ? xM / pI : vec3(.0, 1., .0);\n  float xO = dot(-xM, xH);\n  float xP = xO * smoothstep(.0, 1., (xO - xJ) / xK);\n  xN = dot(xM, qa);\n  xL = xP * xB(pI, xC);\n}\nvoid xQ(const in vec3 qa, const in vec3 sm, const in vec4 xC, const in vec3 xI, out float xL, out vec3 xM, out float xN) {\n  xM = xI - sm;\n  float pI = length(xM);\n  xL = xB(pI, xC);\n  xM = pI > .0 ? xM / pI : vec3(.0, 1., .0);\n  xN = dot(xM, qa);\n}\nvoid xR(const in vec3 xS, const in vec3 qa, const in vec3 xH, out float xL, out vec3 xM, out float xN) {\n  xL = 1.;\n  xM = -xH;\n  xN = dot(xM, qa);\n}\nvec4 xT(const in vec3 qa, const in vec3 xS, const in float oJ) {\n  float xU = clamp(dot(qa, xS), 0., 1.);\n  float oK = oJ * oJ;\n  return vec4(oK, oK * oK, xU, xU * (1. - oK));\n}\nfloat xV(const vec4 xT, const float xW) {\n  float rP = xT.y;\n  float pM = (xW * rP - xW) * xW + 1.;\n  return rP / (3.141593 * pM * pM);\n}\nvec3 xX(const vec3 oF, const float oG, const in float xY) {\n  float xZ = pow(1. - xY, 5.);\n  return oG * xZ + (1. - xZ) * oF;\n}\nfloat xX(const float oF, const float oG, const in float xY) {\n  return oF + (oG - oF) * pow(1. - xY, 5.);\n}\nfloat ya(const vec4 xT, const float yb) {\n  float a = xT.x;\n  float yc = yb * (xT.w + a);\n  float yd = xT.z * (yb * (1. - a) + a);\n  return .5 / (yc + yd);\n}\nvec3 ye(const vec4 xT, const vec3 qa, const vec3 xS, const vec3 xM, const vec3 pB, const float yb, const float oG) {\n  vec3 tK = normalize(xS + xM);\n  float xW = clamp(dot(qa, tK), 0., 1.);\n  float xY = clamp(dot(xM, tK), 0., 1.);\n  float oU = xV(xT, xW);\n  float oV = ya(xT, yb);\n  vec3 oT = xX(pB, oG, xY);\n  return (oU * oV * 3.141593) * oT;\n}\nvoid yf(const in vec3 qa, const in vec3 xS, const in float yb, const in vec4 xT, const in vec3 ql, const in vec3 pB, const in float xL, const in vec3 yg, const in vec3 xM, const in float oG, out vec3 yh, out vec3 yi, out bool yj) {\n  yj = yb > .0;\n  if(yj == false) {\n    yi = yh = vec3(.0);\n    return;\n  }\n  vec3 yk = xL * yb * yg;\n  yi = yk * ye(xT, qa, xS, xM, pB, yb, oG);\n  yh = yk * ql;\n}\nfloat yl(float at, float ab, float ym, float yn, float yo, float yp, float xU, float yb) {\n  float yq = yb * length(vec3(at * ym, ab * yn, xU));\n  float yr = xU * length(vec3(at * yo, ab * yp, yb));\n  return .5 / (yq + yr);\n}\nfloat ys(const float at, const float ab, const float yt, const float yu, const float xW) {\n  float rP = at * ab;\n  vec3 pM = vec3(ab * yt, at * yu, rP * xW);\n  float x = rP / dot(pM, pM);\n  return rP * (x * x) / 3.141593;\n}\nvec3 yv(const vec4 xT, const vec3 qa, const vec3 xS, const vec3 xM, const vec3 pB, const float yb, const float oG, const in vec3 yw, const in vec3 yx, const in float yy) {\n  vec3 tK = normalize(xS + xM);\n  float xW = clamp(dot(qa, tK), 0., 1.);\n  float xU = clamp(dot(qa, xS), 0., 1.);\n  float xY = clamp(dot(xM, tK), 0., 1.);\n  float ym = dot(yw, xS);\n  float yn = dot(yx, xS);\n  float yo = dot(yw, xM);\n  float yp = dot(yx, xM);\n  float yt = dot(yw, tK);\n  float yu = dot(yx, tK);\n  float yz = sqrt(1. - abs(yy) * .9);\n  if(yy > .0)\n    yz = 1. / yz;\n  float at = xT.x * yz;\n  float ab = xT.x / yz;\n  float oU = ys(at, ab, yt, yu, xW);\n  float oV = yl(at, ab, ym, yn, yo, yp, xU, yb);\n  vec3 oT = xX(pB, oG, xY);\n  return (oU * oV * 3.141593) * oT;\n}\nvoid yA(const in vec3 qa, const in vec3 xS, const in float yb, const in vec4 xT, const in vec3 ql, const in vec3 pB, const in float xL, const in vec3 yg, const in vec3 xM, const in float oG, const in vec3 yw, const in vec3 yx, const in float yy, out vec3 yh, out vec3 yi, out bool yj) {\n  yj = yb > .0;\n  if(yj == false) {\n    yi = yh = vec3(.0);\n    return;\n  }\n  vec3 yk = xL * yb * yg;\n  yi = yk * yv(xT, qa, xS, xM, pB, yb, oG, yw, yx, yy);\n  yh = yk * ql;\n}\n#if defined(HAS_IBL_LIGHTING)\nvec3 sc(const in vec3 qa) {\n  float x = qa.x;\n  float y = qa.y;\n  float z = qa.z;\n  vec3 oi = (uDiffuseSPH[0] + uDiffuseSPH[1] * x + uDiffuseSPH[2] * y + uDiffuseSPH[3] * z + uDiffuseSPH[4] * z * x + uDiffuseSPH[5] * y * z + uDiffuseSPH[6] * y * x + uDiffuseSPH[7] * (3. * z * z - 1.) + uDiffuseSPH[8] * (x * x - y * y));\n  if(length(uHdrHsv) > .0) {\n    oi = hsv_apply(oi, uHdrHsv);\n  }\n  return max(oi, vec3(.0));\n}\nfloat yB(const in float yC) {\n  return yC;\n}\nvec3 yD(const in float yE, const in vec3 rY) {\n  vec3 sb = rY;\n  float yF = uTextureEnvironmentSpecularPBRLodRange.x;\n  float yG = min(yF, yB(yE) * uTextureEnvironmentSpecularPBRLodRange.y);\n  vec3 yH = rj(textureCubeLod(sSpecularPBR, sb, yG), uRGBMRange);\n  if(length(uHdrHsv) > .0) {\n    return hsv_apply(yH, uHdrHsv);\n  } else {\n    return yH;\n  }\n}\nvec3 yI(const in vec3 tJ, const in vec3 rY, const in float yJ) {\n  float yK = 1. - yJ;\n  float yL = yK * (sqrt(yK) + yJ);\n  return mix(tJ, rY, yL);\n}\nvec3 yM(const in vec3 qa, const in vec3 xS, const in float oJ, const in vec3 yN) {\n  vec3 rY = reflect(-xS, qa);\n  rY = yI(qa, rY, oJ);\n  vec3 tW = yD(oJ, uEnvironmentTransform * rY);\n  float qI = clamp(1. + dot(rY, yN), .0, 1.);\n  tW *= qI * qI;\n  return tW;\n}\n#else\nvec3 yM(const in vec3 qa, const in vec3 xS, const in float oJ, const in vec3 yN) {\n  return uAmbientColor;\n}\n#endif\nvec3 yO(const in vec3 pB, const in float oJ, const in float xU, const in float oG) {\n  vec4 rgba = texture2D(sIntegrateBRDF, vec2(xU, oJ));\n  float b = (rgba[3] * 65280.0 + rgba[2] * 255.);\n  float a = (rgba[1] * 65280.0 + rgba[0] * 255.);\n  const float yP = 1. / 65535.;\n  return (pB * a + b * oG) * yP;\n}\nvec3 yQ(const in vec3 qa, const in vec3 xS, const in float oJ, const in vec3 pB, const in vec3 yN, const in float oG) {\n  float xU = dot(qa, xS);\n  return yM(qa, xS, oJ, yN) * yO(pB, oJ, xU, oG);\n}\nvec3 yR(const in float xN, const in float xL, const in float yS, const in vec3 yT, const in float yU, const in float yV, const in vec3 ql, const in vec3 yg) {\n  float wrap = clamp(.3 - xN, 0., 1.);\n  float yW = max(.0, yV / max(.001, yS));\n  float yX = yU * xL * wrap;\n  return yX * yg * ql * exp(-yW / max(yT, vec3(.001)));\n}\nfloat yY(const in vec2 nU, const in vec4 xk) {\n  return mod(step(xk.z, .0) + floor(nU.x) + floor(nU.y), 2.);\n}\nvec3 yZ(const float xU, const float yb, const vec3 za, const float pM) {\n  return exp(za * -pM * ((yb + xU) / max(yb * xU, 1e-3)));\n}\nvec3 zb(const in float xU, const in float yb, const in float zc) {\n  return mix(vec3(1.), yZ(xU, yb, uClearCoatTint, uClearCoatThickness), zc);\n}\nvoid zd(const in float ze, const in vec3 qa, const in vec3 xS, const in float xN, const in vec4 xT, const in float xL, const in vec3 yg, const in vec3 xM, const in float zc, out vec3 zf, out vec3 zg) {\n  if(xN <= .0) {\n    zf = vec3(.0);\n    zg = vec3(.0);\n    return;\n  }\n  float zh = clamp(dot(qa, -refract(xM, qa, 1. / uClearCoatIor)), 0., 1.);\n  vec3 zi = zb(ze, zh, zc);\n  vec3 tK = normalize(xS + xM);\n  float xW = clamp(dot(qa, tK), 0., 1.);\n  float xY = clamp(dot(xM, tK), 0., 1.);\n  float oU = xV(xT, xW);\n  float oV = ya(xT, zh);\n  float oT = xX(uClearCoatF0, 1., xY);\n  zf = (xL * xN * zc * oU * oV * 3.141593 * oT) * yg;\n  zg = (1. - oT * zc) * zi;\n}\nfloat zj(const in int zk, const in float qq, const in vec3 qa, const in vec3 xS) {\n  if(zk == 0)\n    return 1.;\n  float pM = dot(qa, xS) + qq;\n  return clamp(pM * pM - 1. + qq, .0, 1.);\n}\nfloat zl(const in float oJ, const in vec3 qa) {\n  float zm = dot(qa, qa);\n  if(zm < 1.) {\n    float zn = sqrt(zm);\n    float zo = (3. * zn - zm * zn) / (1. - zm);\n    return min(1., sqrt(oJ * oJ + 1. / zo));\n  }\n  return oJ;\n}\nvec3 zp(const in vec3 qa, const in vec3 xS, const in float oJ, const in vec3 yw, const in vec3 yx, const in float yy) {\n  vec3 zq = yy >= .0 ? yx : yw;\n  vec3 zr = cross(zq, xS);\n  vec3 zs = cross(zr, zq);\n  float zt = abs(yy) * clamp(5. * oJ, .0, 1.);\n  return normalize(mix(qa, zs, zt));\n}\nvec3 zu(vec3 pa) {\n  \n#if defined(GAMMA_CORRECT_INPUT)\nreturn pow(pa, vec3(2.2));\n#else\nreturn pa;\n#endif\n}\nvoid zv() {\n  \n#ifdef HAS_MAP\nvec2 nU = vTexCoord;\n#endif\n#ifdef HAS_BUMP_MAP\nnU = wA(nU, normalize(vTangentViewPos - vTangentFragPos));\n#endif\nwz.albedo = uAlbedoPBRFactor * uBaseColorFactor.rgb;\n  wz.alpha = uBaseColorFactor.a;\n#if defined(HAS_ALBEDO_MAP)\nvec4 qf = texture2D(uBaseColorTexture, nU);\n  wz.albedo *= qJ(qf.rgb);\n  wz.alpha *= qf.a;\n#endif\n#if defined(HAS_COLOR)\nwz.albedo *= vColor.rgb;\n  wz.alpha *= vColor.a;\n#elif defined(IS_LINE_EXTRUSION)\nwz.albedo *= lineColor.rgb;\n  wz.alpha *= lineColor.a;\n#else\nwz.albedo *= polygonFill.rgb;\n  wz.alpha *= polygonFill.a;\n#endif\n#if defined(HAS_INSTANCE_COLOR)\nwz.albedo *= vInstanceColor.rgb;\n  wz.alpha *= vInstanceColor.a;\n#endif\n#if defined(IS_LINE_EXTRUSION)\nwz.alpha *= lineOpacity;\n#else\nwz.alpha *= polygonOpacity;\n#endif\n#if defined(HAS_METALLICROUGHNESS_MAP)\nwz.roughnessMetalness = texture2D(uMetallicRoughnessTexture, nU).gb * vec2(uRoughnessFactor, uMetallicFactor);\n#else\nwz.roughnessMetalness = vec2(uRoughnessFactor, uMetallicFactor);\n#endif\n#if defined(HAS_EMISSIVE_MAP)\nwz.emit = qJ(texture2D(uEmissiveTexture, nU).rgb);\n#else\nwz.emit = uEmitColor;\n#endif\nwz.emit *= uEmitColorFactor;\n#if defined(HAS_AO_MAP)\nwz.ao = texture2D(uOcclusionTexture, nU).r;\n#else\nwz.ao = 1.;\n#endif\nwz.ao *= uOcclusionFactor;\n#if defined(HAS_NORMAL_MAP)\nvec3 zw = texture2D(uNormalTexture, nU).xyz * 2. - 1.;\n  zw.y = uNormalMapFlipY == 1 ? -zw.y : zw.y;\n  wz.normal = zw;\n#else\nwz.normal = normalize(vModelNormal);\n#endif\n#if defined(SHADING_MODEL_SPECULAR_GLOSSINESS)\nwz.albedo *= uDiffuseFactor.rgb;\n  wz.alpha *= uDiffuseFactor.a;\n#if defined(HAS_DIFFUSE_MAP)\nvec4 zx = texture2D(uDiffuseTexture, nU);\n  wz.zx *= qJ(zx.rgb);\n  wz.alpha *= zx.a;\n#endif\nwz.specularColor = uSpecularFactor;\n  wz.glossiness = uGlossinessFactor;\n#if defined(HAS_SPECULARGLOSSINESS_MAP)\nvec4 zy = texture2D(uSpecularGlossinessTexture, nU);\n  wz.specularColor *= qJ(zy.rgb);\n  wz.glossiness *= zy.a;\n#endif\n#endif\n}\nvec3 sP(const vec3 x) {\n  const float a = 2.51;\n  const float b = .03;\n  const float rc = 2.43;\n  const float pM = .59;\n  const float sQ = .14;\n  return (x * (a * x + b)) / (x * (rc * x + pM) + sQ);\n}\nvec3 sR(vec3 pa) {\n  pa = sP(pa);\n  return pa = pow(pa, vec3(1. / 2.2));\n}\nuniform float uSpecularAntiAliasingVariance;\nuniform float uSpecularAntiAliasingThreshold;\nfloat zz(float oJ, const vec3 zA) {\n  \n#ifdef GL_OES_standard_derivatives\nvec3 zB = dFdx(zA);\n  vec3 zC = dFdy(zA);\n  float zD = uSpecularAntiAliasingVariance * (dot(zB, zB) + dot(zC, zC));\n  float zE = min(2. * zD, uSpecularAntiAliasingThreshold);\n  float zF = saturate(oJ * oJ + zE);\n  return sqrt(zF);\n#else\nreturn oJ;\n#endif\n}\n#ifdef HAS_SSR\nuniform sampler2D TextureDepthTest;\nuniform sampler2D TextureDepth;\nuniform highp vec2 uGlobalTexSize;\nuniform float uSsrFactor;\nuniform float uSsrQuality;\nuniform vec2 uPreviousGlobalTexSize;\nuniform sampler2D TextureToBeRefracted;\nuniform vec2 uTextureToBeRefractedSize;\nuniform highp mat4 uProjectionMatrix;\nuniform mat4 uInvProjMatrix;\nuniform vec4 uTaaCornersCSLeft[2];\nuniform mat4 uReprojectViewProj;\nvec3 zG(const in float zH, const in float zI, const in vec2 rZ) {\n  float zJ = min(zI - .01, zH);\n  float zK = floor(zJ);\n  float zL = min(zI, zK + 1.);\n  float zM = pow(2., zL);\n  vec2 zN = 2. * zM / rZ;\n  if(zJ - zK > .5)\n    zM *= 2.;\n  return vec3(zN, zM);\n}\nvec2 zO(const in vec2 zP, const in vec3 zQ) {\n  vec2 nU = max(zQ.xy, min(1. - zQ.xy, zP));\n  return vec2(2. * nU.x, zQ.z - 1. - nU.y) / zQ.z;\n}\nvec3 zR(const in mat4 uH, const in vec3 sm) {\n  vec4 zS = uH * vec4(sm, 1.);\n  return vec3(.5 + .5 * zS.xy / zS.w, zS.w);\n}\nvec3 zT(const in float uu, const in vec2 nU) {\n  return rj(texture2D(TextureToBeRefracted, nU), 7.);\n}\nfloat uG(float rS) {\n  highp mat4 uH = uProjectionMatrix;\n  highp float z = rS * 2. - 1.;\n  return -uH[3].z / (z + uH[2].z);\n}\nfloat zU(const vec2 nU, const in vec3 zQ) {\n  return uG(texture2D(TextureDepth, nU).r);\n}\nvec3 zV(const in float qL, const in vec3 zW, const in vec3 zX, const in vec3 zY, const in vec3 xS, const in float zZ) {\n  vec2 Aa;\n  Aa.x = qK(gl_FragCoord.yx, qL);\n  Aa.y = fract(Aa.x * 52.9829189);\n  Aa.y = mix(Aa.y, 1., .7);\n  float Ab = 2. * 3.14159 * Aa.x;\n  float pi = pow(max(Aa.y, .000001), zZ / (2. - zZ));\n  float Ac = sqrt(1. - pi * pi);\n  vec3 pt = vec3(Ac * cos(Ab), Ac * sin(Ab), pi);\n  pt = pt.x * zW + pt.y * zX + pt.z * zY;\n  return normalize((2. * dot(xS, pt)) * pt - xS);\n}\nfloat Ad(const in float qL) {\n  return (qK(gl_FragCoord.xy, qL) - .5);\n}\nvec3 Ae(const in vec3 Af, const in float Ag, const in vec3 Ah) {\n  vec3 Ai = zR(uProjectionMatrix, vViewVertex.xyz + Ah * Ag);\n  Ai.z = 1. / Ai.z;\n  Ai -= Af;\n  float Aj = min(1., .99 * (1. - Af.x) / max(1e-5, Ai.x));\n  float Ak = min(1., .99 * (1. - Af.y) / max(1e-5, Ai.y));\n  float Al = min(1., .99 * Af.x / max(1e-5, -Ai.x));\n  float Am = min(1., .99 * Af.y / max(1e-5, -Ai.y));\n  return Ai * min(Aj, Ak) * min(Al, Am);\n}\nfloat An(const in vec3 Af, const in vec3 Ai, inout float Ao, inout float Ap) {\n  float Aq = (Ap + Ao) * .5;\n  vec3 Ar = Af + Ai * Aq;\n  float z = texture2D(TextureDepth, Ar.xy).r;\n  float rS = uG(z);\n  float vN = -1. / Ar.z;\n  Ao = rS > vN ? Ao : Aq;\n  Ap = rS > vN ? Aq : Ap;\n  return Aq;\n}\nvec4 As(const in vec3 Af, const in float Ag, in float At, const in vec3 Ah, const in float oJ, const in float qL) {\n  float Au = 1. / float(20);\n  if(uSsrQuality > 1.)\n    Au /= 2.;\n  At *= Au;\n  vec3 Ai = Ae(Af, Ag, Ah);\n  float Av = Au;\n  vec3 Aw = vec3(.0, Av, 1.);\n  vec3 Ar;\n  float z, rS, vN, Ax, Ay, Az;\n  bool AA;\n  float AB = 1.;\n  float Aq;\n  for(int tY = 0; tY < 20; tY++) {\n    Ar = Af + Ai * Aw.y;\n    z = texture2D(TextureDepth, Ar.xy).r;\n    rS = uG(z);\n    vN = -1. / Ar.z;\n    float AC = clamp(sign(.95 - rS), .0, 1.);\n    Ax = AC * (vN - rS);\n    AA = abs(Ax + At) < At;\n    Ay = clamp(Aw.x / (Aw.x - Ax), .0, 1.);\n    Az = AA ? Aw.y + Ay * Au - Au : 1.;\n    Aw.z = min(Aw.z, Az);\n    Aw.x = Ax;\n    if(AA) {\n      float Ao = Aw.y - Au;\n      float Ap = Aw.y;\n      Aq = An(Af, Ai, Ao, Ap);\n      Aq = An(Af, Ai, Ao, Ap);\n      Aq = An(Af, Ai, Ao, Ap);\n      AB = Aq;\n      break;\n    }\n    Aw.y += Au;\n  }\n  if(uSsrQuality > 1.) {\n    for(int tY = 0; tY < 8; tY++) {\n      Ar = Af + Ai * Aw.y;\n      z = texture2D(TextureDepth, Ar.xy).r;\n      rS = uG(z);\n      Ax = sign(1. - z) * (-1. / Ar.z - rS);\n      AA = abs(Ax + At) < At;\n      Ay = clamp(Aw.x / (Aw.x - Ax), .0, 1.);\n      Az = AA ? Aw.y + Ay * Au - Au : 1.;\n      Aw.z = min(Aw.z, Az);\n      Aw.x = Ax;\n      Aw.y += Au;\n    }\n  }\n  return vec4(Af + Ai * AB, 1. - AB);\n}\nvec4 AD(in vec4 AE, const in float AF, const in vec3 AG, const in vec3 AH, const in float oJ) {\n  vec4 uP = mix(uTaaCornersCSLeft[0], uTaaCornersCSLeft[1], AE.x);\n  AE.xyz = vec3(mix(uP.xy, uP.zw, AE.y), 1.) * -1. / AE.z;\n  AE.xyz = (uReprojectViewProj * vec4(AE.xyz, 1.)).xyw;\n  AE.xy /= AE.z;\n  float AI = clamp(6. - 6. * max(abs(AE.x), abs(AE.y)), .0, 1.);\n  AE.xy = .5 + .5 * AE.xy;\n  vec3 rd = AH * zT(oJ * (1. - AE.w), AE.xy);\n  return vec4(mix(AG, rd, AF * AI), 1.);\n}\nvec3 ssr(const in vec3 AG, const in vec3 AH, const in float oJ, const in vec3 qa, const in vec3 xS) {\n  float AJ = .0;\n  vec4 oi = vec4(.0);\n  float zZ = oJ * oJ;\n  zZ = zZ * zZ;\n  vec3 AK = abs(qa.z) < .999 ? vec3(.0, .0, 1.) : vec3(1., .0, .0);\n  vec3 zW = normalize(cross(AK, qa));\n  vec3 zX = cross(qa, zW);\n  float AF = uSsrFactor * clamp(-4. * dot(xS, qa) + 3.45, .0, 1.);\n  AF *= clamp(4.7 - oJ * 5., .0, 1.);\n  vec3 Af = zR(uProjectionMatrix, vViewVertex.xyz);\n  Af.z = 1. / Af.z;\n  vec3 Ah = zV(AJ, zW, zX, qa, xS, zZ);\n  float Ag = mix(uNearFar.y + vViewVertex.z, -vViewVertex.z - uNearFar.x, Ah.z * .5 + .5);\n  float At = .5 * Ag;\n  vec4 AE;\n  if(dot(Ah, qa) > .001 && AF > .0) {\n    AE = As(Af, Ag, At, Ah, oJ, AJ);\n    if(AE.w > .0)\n      oi += AD(AE, AF, AG, AH, oJ);\n    \n  }\n  return oi.w > .0 ? oi.rgb / oi.w : AG;\n}\n#endif\nvoid main() {\n  \n#ifdef HAS_SSR\nvec2 re = gl_FragCoord.xy / uGlobalTexSize;\n  float rS = texture2D(TextureDepthTest, re).r;\n  if(rS == .0) {\n    discard;\n    return;\n  }\n#endif\nzv();\n  vec3 xS = normalize(uCameraPosition - vModelVertex.xyz);\n#if defined(HAS_DOUBLE_SIDE)\nvec3 yN = gl_FrontFacing ? normalize(vModelNormal) : -normalize(vModelNormal);\n#else\nvec3 yN = normalize(vModelNormal);\n#endif\n#if defined(HAS_TANGENT)\nvec4 tS;\n  tS = vModelTangent;\n#if defined(HAS_DOUBLE_SIDE)\ntS.xyz = gl_FrontFacing ? normalize(tS.xyz) : -normalize(tS.xyz);\n#else\ntS.xyz = normalize(tS.xyz);\n#endif\nvec3 xr = normalize(vModelBiTangent);\n#endif\nfloat oF = .08 * wP();\n  float AL = wO();\n  vec3 AM = wM();\n#if defined(SHADING_MODEL_SPECULAR_GLOSSINESS)\nvec3 AN = wz.specularColor;\n#else\nvec3 AN = mix(vec3(oF), AM, AL);\n#endif\nAM *= 1. - AL;\n  float AO = clamp(50.0 * AN.g, .0, 1.);\n  float AP = wQ();\n  if(uSpecularAntiAliasingVariance > .0) {\n    AP = zz(AP, yN);\n  }\n  vec3 AQ = wR();\n  vec3 AR = wT();\n  vec3 AS = vec3(AR);\n#if defined(HAS_TANGENT) && defined(HAS_NORMAL_MAP)\nAS = pZ(uNormalMapFactor, AS, tS.xyz, xr, yN);\n#endif\nfloat AT = wU();\n  float AU = wV();\n  if(uSpecularAntiAliasingVariance > .0) {\n    AU = zz(AU, yN);\n  }\n  vec3 AV = yN;\n#if defined(HAS_TANGENT)\nfloat yy;\n  vec3 yw;\n  vec3 yx;\n  if(uAnisotropyFactor > .0) {\n    yy = uAnisotropyFactor;\n    tS.xyz = normalize(tS.xyz - AS * dot(tS.xyz, AS));\n    xr = normalize(cross(AS, tS.xyz)) * tS.w;\n    yw = normalize(mix(tS.xyz, xr, uAnisotropyDirection));\n    yx = normalize(mix(xr, -tS.xyz, uAnisotropyDirection));\n  }\n#endif\nvec3 ql = vec3(.0);\n  vec3 pB = vec3(.0);\n  vec3 AW;\n#if defined(HAS_TANGENT)\nif(uAnisotropyFactor > .0) {\n    AW = zp(AS, xS, AP, yw, yx, yy);\n  } else {\n    AW = AS;\n  }\n#else\nAW = AS;\n#endif\n#if defined(HAS_IBL_LIGHTING)\nql = AM * sc(AS) * .5;\n#else\nql = AM * uAmbientColor;\n#endif\npB = yQ(AW, xS, AP, AN, yN, AO);\n  float ze;\n  if(uClearCoatFactor > .0) {\n    ze = clamp(dot(AV, -refract(xS, AV, 1. / uClearCoatIor)), 0., 1.);\n    float AX = AT * xX(uClearCoatF0, 1., ze);\n    vec3 AY = zb(ze, ze, AT);\n    pB = mix(pB * AY, yM(AV, xS, AU, yN), AX);\n    ql *= AY * (1. - AX);\n  }\n  float AZ = 1.;\n  float Ba = wW();\n  ql *= uEnvironmentExposure * Ba;\n#ifdef HAS_IBL_LIGHTING\nAZ = zj(1, Ba, AS, xS);\n#endif\n#ifdef HAS_SSR\nvec3 Bb = normalize(gl_FrontFacing ? vViewNormal : -vViewNormal);\n  vec3 Bc = Bb;\n#if defined(HAS_TANGENT) && defined(HAS_NORMAL_MAP)\nvec4 tS;\n  tS = vViewTangent;\n  tS = gl_FrontFacing ? tS : -tS;\n  tS.xyz = normalize(tS.xyz);\n  vec3 xr = normalize(cross(Bb, tS.xyz)) * tS.w;\n  vec3 Bc = AR;\n  Bc = pZ(uNormalMapFactor, Bc, tS.xyz, xr, Bb);\n#endif\npB = ssr(pB, AN * AZ, AP, Bc, -normalize(vViewVertex.xyz));\n#endif\npB *= uEnvironmentExposure * AZ;\n  float xL, xN;\n  vec3 xM;\n  bool yj;\n  vec3 Bd;\n  vec3 Be;\n  vec4 Bf = xT(AS, xS, max(.045, AP));\n  vec3 Bg = vModelNormal;\n  xR(xS, AS, uLight0_viewDirection, xL, xM, xN);\n#if defined(HAS_TANGENT)\nif(uAnisotropyFactor > .0) {\n    yA(AS, xS, xN, Bf, AM, AN, xL, uLight0_diffuse.rgb, xM, AO, yw, yx, yy, Be, Bd, yj);\n  } else {\n    yf(AS, xS, xN, Bf, AM, AN, xL, uLight0_diffuse.rgb, xM, AO, Be, Bd, yj);\n  }\n#else\nyf(AS, xS, xN, Bf, AM, AN, xL, uLight0_diffuse.rgb, xM, AO, Be, Bd, yj);\n#endif\nif(uClearCoatFactor > .0) {\n    vec3 Bh;\n    vec3 Bi;\n    vec4 Bj = xT(AV, xS, AU);\n    zd(ze, AV, xS, dot(AV, xM), Bj, xL, uLight0_diffuse.rgb, xM, AT, Bh, Bi);\n    Be *= Bi;\n    Bd = Bh + Bd * Bi;\n  }\n#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)\nfloat Bk = shadow_computeShadow();\n  Be = shadow_blend(Be, Bk).rgb;\n  Bd = shadow_blend(Bd, Bk).rgb;\n#endif\nvec3 Bl = vec3(pB);\n  vec3 Bm = vec3(ql);\n  ql += Be;\n  pB += Bd;\n  ql = uEmitMultiplicative == 1 ? ql * AQ : ql + AQ;\n  if(uEmitMultiplicative == 1)\n    pB *= AQ;\n  vec3 Bn = pB + ql;\n  if(uOutputLinear != 1)\n    Bn = qc(Bn);\n  glFragColor = vec4(Bn, wN());\n#ifdef HAS_HEATMAP\nglFragColor = heatmap_getColor(glFragColor);\n#endif\n#ifdef HAS_VIEWSHED\nglFragColor = viewshed_draw(glFragColor);\n#endif\n#ifdef HAS_FLOODANALYSE\nglFragColor = draw_floodAnalyse(glFragColor);\n#endif\n#ifdef HAS_FOG\nglFragColor = draw_fog(glFragColor);\n#endif\nif(length(uHsv) > .0) {\n    glFragColor = hsv_apply(glFragColor, uHsv);\n  }\n#if __VERSION__ == 100\ngl_FragColor = glFragColor;\n#endif\n}",
            uniforms: a,
            extraCommandProps: n,
            defines: i
        }) || this).version = 300, t;
    }
    function Jo() {
        return jo.apply(this, arguments) || this;
    }
    var Qo = Object.freeze({
        __proto__: null,
        AbstractTexture: rt,
        BloomPass: ui,
        BoxBlurShader: Cr,
        Constants: nt,
        DeferredRenderer: lt,
        FBORayPicking: zo,
        FxaaShader: wr,
        GLTFHelper: ka,
        Geometry: It,
        HDR: Wo,
        HeatmapDisplayShader: Ci,
        HeatmapShader: Ei,
        InstancedMesh: Tn,
        Jitter: ni,
        Material: Ut,
        Mesh: fn,
        MeshShader: lr,
        OutlinePass: _i,
        PhongMaterial: Xt,
        PhongShader: gr,
        PhongSpecularGlossinessMaterial: nn,
        Plane: Qn,
        PostProcessShader: kr,
        QuadShader: Sr,
        Renderer: ut,
        ResourceLoader: Pn,
        Scene: qn,
        Shader: sr,
        ShadowDisplayShader: Io,
        ShadowMapShader: co,
        ShadowPass: Bo,
        SkyboxShader: Oi,
        SsaoPass: Gr,
        SsrPass: gi,
        TaaPass: Qr,
        Texture2D: Kn,
        TextureCube: Jn,
        ToonMaterial: Qt,
        ToonShader: br,
        Util: et,
        ViewshedPass: yi,
        WaterShader: Pi,
        WireFrameMaterial: Vt,
        WireframeShader: hr,
        pbr: Xo
    }), Zo = 1e-6, $o = "undefined" != typeof Float32Array ? Float32Array : Array, es = Math.random;
    var ts = Math.PI / 180;
    var ns = Object.freeze({
        __proto__: null,
        EPSILON: Zo,
        get ARRAY_TYPE() {
            return $o;
        },
        RANDOM: es,
        setMatrixArrayType: function(e) {
            $o = e;
        },
        toRadian: function(e) {
            return e * ts;
        },
        equals: function(e, t) {
            return Math.abs(e - t) <= Zo * Math.max(1, Math.abs(e), Math.abs(t));
        }
    });
    function rs(e, t, n) {
        var r = t[0], i = t[1], a = t[2], o = t[3], s = n[0], u = n[1], f = n[2], c = n[3];
        return e[0] = r * s + a * u, e[1] = i * s + o * u, e[2] = r * f + a * c, e[3] = i * f + o * c, 
        e;
    }
    function is(e, t, n) {
        return e[0] = t[0] - n[0], e[1] = t[1] - n[1], e[2] = t[2] - n[2], e[3] = t[3] - n[3], 
        e;
    }
    var as = rs, os = is, ss = Object.freeze({
        __proto__: null,
        create: function() {
            var e = new $o(4);
            return $o != Float32Array && (e[1] = 0, e[2] = 0), e[0] = 1, e[3] = 1, e;
        },
        clone: function(e) {
            var t = new $o(4);
            return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[3], t;
        },
        copy: function(e, t) {
            return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], e;
        },
        identity: function(e) {
            return e[0] = 1, e[1] = 0, e[2] = 0, e[3] = 1, e;
        },
        fromValues: function(e, t, n, r) {
            var i = new $o(4);
            return i[0] = e, i[1] = t, i[2] = n, i[3] = r, i;
        },
        set: function(e, t, n, r, i) {
            return e[0] = t, e[1] = n, e[2] = r, e[3] = i, e;
        },
        transpose: function(e, t) {
            if (e === t) {
                var n = t[1];
                e[1] = t[2], e[2] = n;
            } else e[0] = t[0], e[1] = t[2], e[2] = t[1], e[3] = t[3];
            return e;
        },
        invert: function(e, t) {
            var n = t[0], r = t[1], i = t[2], a = t[3], o = n * a - i * r;
            return o ? (o = 1 / o, e[0] = a * o, e[1] = -r * o, e[2] = -i * o, e[3] = n * o, 
            e) : null;
        },
        adjoint: function(e, t) {
            var n = t[0];
            return e[0] = t[3], e[1] = -t[1], e[2] = -t[2], e[3] = n, e;
        },
        determinant: function(e) {
            return e[0] * e[3] - e[2] * e[1];
        },
        multiply: rs,
        rotate: function(e, t, n) {
            var r = t[0], i = t[1], a = t[2], o = t[3], s = Math.sin(n), u = Math.cos(n);
            return e[0] = r * u + a * s, e[1] = i * u + o * s, e[2] = r * -s + a * u, e[3] = i * -s + o * u, 
            e;
        },
        scale: function(e, t, n) {
            var r = t[0], i = t[1], a = t[2], o = t[3], s = n[0], u = n[1];
            return e[0] = r * s, e[1] = i * s, e[2] = a * u, e[3] = o * u, e;
        },
        fromRotation: function(e, t) {
            var n = Math.sin(t), r = Math.cos(t);
            return e[0] = r, e[1] = n, e[2] = -n, e[3] = r, e;
        },
        fromScaling: function(e, t) {
            return e[0] = t[0], e[1] = 0, e[2] = 0, e[3] = t[1], e;
        },
        str: function(e) {
            return "mat2(" + e[0] + ", " + e[1] + ", " + e[2] + ", " + e[3] + ")";
        },
        frob: function(e) {
            return Math.sqrt(Math.pow(e[0], 2) + Math.pow(e[1], 2) + Math.pow(e[2], 2) + Math.pow(e[3], 2));
        },
        LDU: function(e, t, n, r) {
            return e[2] = r[2] / r[0], n[0] = r[0], n[1] = r[1], n[3] = r[3] - e[2] * n[1], 
            [ e, t, n ];
        },
        add: function(e, t, n) {
            return e[0] = t[0] + n[0], e[1] = t[1] + n[1], e[2] = t[2] + n[2], e[3] = t[3] + n[3], 
            e;
        },
        subtract: is,
        exactEquals: function(e, t) {
            return e[0] === t[0] && e[1] === t[1] && e[2] === t[2] && e[3] === t[3];
        },
        equals: function(e, t) {
            var n = e[0], r = e[1], i = e[2], a = e[3], o = t[0], s = t[1], u = t[2], f = t[3];
            return Math.abs(n - o) <= Zo * Math.max(1, Math.abs(n), Math.abs(o)) && Math.abs(r - s) <= Zo * Math.max(1, Math.abs(r), Math.abs(s)) && Math.abs(i - u) <= Zo * Math.max(1, Math.abs(i), Math.abs(u)) && Math.abs(a - f) <= Zo * Math.max(1, Math.abs(a), Math.abs(f));
        },
        multiplyScalar: function(e, t, n) {
            return e[0] = t[0] * n, e[1] = t[1] * n, e[2] = t[2] * n, e[3] = t[3] * n, e;
        },
        multiplyScalarAndAdd: function(e, t, n, r) {
            return e[0] = t[0] + n[0] * r, e[1] = t[1] + n[1] * r, e[2] = t[2] + n[2] * r, e[3] = t[3] + n[3] * r, 
            e;
        },
        mul: as,
        sub: os
    });
    function us(e, t, n) {
        var r = t[0], i = t[1], a = t[2], o = t[3], s = t[4], u = t[5], f = n[0], c = n[1], l = n[2], h = n[3], d = n[4], p = n[5];
        return e[0] = r * f + a * c, e[1] = i * f + o * c, e[2] = r * l + a * h, e[3] = i * l + o * h, 
        e[4] = r * d + a * p + s, e[5] = i * d + o * p + u, e;
    }
    function fs(e, t, n) {
        return e[0] = t[0] - n[0], e[1] = t[1] - n[1], e[2] = t[2] - n[2], e[3] = t[3] - n[3], 
        e[4] = t[4] - n[4], e[5] = t[5] - n[5], e;
    }
    var cs = us, ls = fs, hs = Object.freeze({
        __proto__: null,
        create: function() {
            var e = new $o(6);
            return $o != Float32Array && (e[1] = 0, e[2] = 0, e[4] = 0, e[5] = 0), e[0] = 1, 
            e[3] = 1, e;
        },
        clone: function(e) {
            var t = new $o(6);
            return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[3], t[4] = e[4], t[5] = e[5], 
            t;
        },
        copy: function(e, t) {
            return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], e[4] = t[4], e[5] = t[5], 
            e;
        },
        identity: function(e) {
            return e[0] = 1, e[1] = 0, e[2] = 0, e[3] = 1, e[4] = 0, e[5] = 0, e;
        },
        fromValues: function(e, t, n, r, i, a) {
            var o = new $o(6);
            return o[0] = e, o[1] = t, o[2] = n, o[3] = r, o[4] = i, o[5] = a, o;
        },
        set: function(e, t, n, r, i, a, o) {
            return e[0] = t, e[1] = n, e[2] = r, e[3] = i, e[4] = a, e[5] = o, e;
        },
        invert: function(e, t) {
            var n = t[0], r = t[1], i = t[2], a = t[3], o = t[4], s = t[5], u = n * a - r * i;
            return u ? (u = 1 / u, e[0] = a * u, e[1] = -r * u, e[2] = -i * u, e[3] = n * u, 
            e[4] = (i * s - a * o) * u, e[5] = (r * o - n * s) * u, e) : null;
        },
        determinant: function(e) {
            return e[0] * e[3] - e[1] * e[2];
        },
        multiply: us,
        rotate: function(e, t, n) {
            var r = t[0], i = t[1], a = t[2], o = t[3], s = t[4], u = t[5], f = Math.sin(n), c = Math.cos(n);
            return e[0] = r * c + a * f, e[1] = i * c + o * f, e[2] = r * -f + a * c, e[3] = i * -f + o * c, 
            e[4] = s, e[5] = u, e;
        },
        scale: function(e, t, n) {
            var r = t[0], i = t[1], a = t[2], o = t[3], s = t[4], u = t[5], f = n[0], c = n[1];
            return e[0] = r * f, e[1] = i * f, e[2] = a * c, e[3] = o * c, e[4] = s, e[5] = u, 
            e;
        },
        translate: function(e, t, n) {
            var r = t[0], i = t[1], a = t[2], o = t[3], s = t[4], u = t[5], f = n[0], c = n[1];
            return e[0] = r, e[1] = i, e[2] = a, e[3] = o, e[4] = r * f + a * c + s, e[5] = i * f + o * c + u, 
            e;
        },
        fromRotation: function(e, t) {
            var n = Math.sin(t), r = Math.cos(t);
            return e[0] = r, e[1] = n, e[2] = -n, e[3] = r, e[4] = 0, e[5] = 0, e;
        },
        fromScaling: function(e, t) {
            return e[0] = t[0], e[1] = 0, e[2] = 0, e[3] = t[1], e[4] = 0, e[5] = 0, e;
        },
        fromTranslation: function(e, t) {
            return e[0] = 1, e[1] = 0, e[2] = 0, e[3] = 1, e[4] = t[0], e[5] = t[1], e;
        },
        str: function(e) {
            return "mat2d(" + e[0] + ", " + e[1] + ", " + e[2] + ", " + e[3] + ", " + e[4] + ", " + e[5] + ")";
        },
        frob: function(e) {
            return Math.sqrt(Math.pow(e[0], 2) + Math.pow(e[1], 2) + Math.pow(e[2], 2) + Math.pow(e[3], 2) + Math.pow(e[4], 2) + Math.pow(e[5], 2) + 1);
        },
        add: function(e, t, n) {
            return e[0] = t[0] + n[0], e[1] = t[1] + n[1], e[2] = t[2] + n[2], e[3] = t[3] + n[3], 
            e[4] = t[4] + n[4], e[5] = t[5] + n[5], e;
        },
        subtract: fs,
        multiplyScalar: function(e, t, n) {
            return e[0] = t[0] * n, e[1] = t[1] * n, e[2] = t[2] * n, e[3] = t[3] * n, e[4] = t[4] * n, 
            e[5] = t[5] * n, e;
        },
        multiplyScalarAndAdd: function(e, t, n, r) {
            return e[0] = t[0] + n[0] * r, e[1] = t[1] + n[1] * r, e[2] = t[2] + n[2] * r, e[3] = t[3] + n[3] * r, 
            e[4] = t[4] + n[4] * r, e[5] = t[5] + n[5] * r, e;
        },
        exactEquals: function(e, t) {
            return e[0] === t[0] && e[1] === t[1] && e[2] === t[2] && e[3] === t[3] && e[4] === t[4] && e[5] === t[5];
        },
        equals: function(e, t) {
            var n = e[0], r = e[1], i = e[2], a = e[3], o = e[4], s = e[5], u = t[0], f = t[1], c = t[2], l = t[3], h = t[4], d = t[5];
            return Math.abs(n - u) <= Zo * Math.max(1, Math.abs(n), Math.abs(u)) && Math.abs(r - f) <= Zo * Math.max(1, Math.abs(r), Math.abs(f)) && Math.abs(i - c) <= Zo * Math.max(1, Math.abs(i), Math.abs(c)) && Math.abs(a - l) <= Zo * Math.max(1, Math.abs(a), Math.abs(l)) && Math.abs(o - h) <= Zo * Math.max(1, Math.abs(o), Math.abs(h)) && Math.abs(s - d) <= Zo * Math.max(1, Math.abs(s), Math.abs(d));
        },
        mul: cs,
        sub: ls
    });
    function ds() {
        var e = new $o(9);
        return $o != Float32Array && (e[1] = 0, e[2] = 0, e[3] = 0, e[5] = 0, e[6] = 0, 
        e[7] = 0), e[0] = 1, e[4] = 1, e[8] = 1, e;
    }
    function ps(e, t, n) {
        var r = t[0], i = t[1], a = t[2], o = t[3], s = t[4], u = t[5], f = t[6], c = t[7], l = t[8], h = n[0], d = n[1], p = n[2], v = n[3], m = n[4], g = n[5], _ = n[6], x = n[7], b = n[8];
        return e[0] = h * r + d * o + p * f, e[1] = h * i + d * s + p * c, e[2] = h * a + d * u + p * l, 
        e[3] = v * r + m * o + g * f, e[4] = v * i + m * s + g * c, e[5] = v * a + m * u + g * l, 
        e[6] = _ * r + x * o + b * f, e[7] = _ * i + x * s + b * c, e[8] = _ * a + x * u + b * l, 
        e;
    }
    function vs(e, t, n) {
        return e[0] = t[0] - n[0], e[1] = t[1] - n[1], e[2] = t[2] - n[2], e[3] = t[3] - n[3], 
        e[4] = t[4] - n[4], e[5] = t[5] - n[5], e[6] = t[6] - n[6], e[7] = t[7] - n[7], 
        e[8] = t[8] - n[8], e;
    }
    var ms = ps, gs = vs, _s = Object.freeze({
        __proto__: null,
        create: ds,
        fromMat4: function(e, t) {
            return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[4], e[4] = t[5], e[5] = t[6], 
            e[6] = t[8], e[7] = t[9], e[8] = t[10], e;
        },
        clone: function(e) {
            var t = new $o(9);
            return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[3], t[4] = e[4], t[5] = e[5], 
            t[6] = e[6], t[7] = e[7], t[8] = e[8], t;
        },
        copy: function(e, t) {
            return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], e[4] = t[4], e[5] = t[5], 
            e[6] = t[6], e[7] = t[7], e[8] = t[8], e;
        },
        fromValues: function(e, t, n, r, i, a, o, s, u) {
            var f = new $o(9);
            return f[0] = e, f[1] = t, f[2] = n, f[3] = r, f[4] = i, f[5] = a, f[6] = o, f[7] = s, 
            f[8] = u, f;
        },
        set: function(e, t, n, r, i, a, o, s, u, f) {
            return e[0] = t, e[1] = n, e[2] = r, e[3] = i, e[4] = a, e[5] = o, e[6] = s, e[7] = u, 
            e[8] = f, e;
        },
        identity: function(e) {
            return e[0] = 1, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 1, e[5] = 0, e[6] = 0, e[7] = 0, 
            e[8] = 1, e;
        },
        transpose: function(e, t) {
            if (e === t) {
                var n = t[1], r = t[2], i = t[5];
                e[1] = t[3], e[2] = t[6], e[3] = n, e[5] = t[7], e[6] = r, e[7] = i;
            } else e[0] = t[0], e[1] = t[3], e[2] = t[6], e[3] = t[1], e[4] = t[4], e[5] = t[7], 
            e[6] = t[2], e[7] = t[5], e[8] = t[8];
            return e;
        },
        invert: function(e, t) {
            var n = t[0], r = t[1], i = t[2], a = t[3], o = t[4], s = t[5], u = t[6], f = t[7], c = t[8], l = c * o - s * f, h = -c * a + s * u, d = f * a - o * u, p = n * l + r * h + i * d;
            return p ? (p = 1 / p, e[0] = l * p, e[1] = (-c * r + i * f) * p, e[2] = (s * r - i * o) * p, 
            e[3] = h * p, e[4] = (c * n - i * u) * p, e[5] = (-s * n + i * a) * p, e[6] = d * p, 
            e[7] = (-f * n + r * u) * p, e[8] = (o * n - r * a) * p, e) : null;
        },
        adjoint: function(e, t) {
            var n = t[0], r = t[1], i = t[2], a = t[3], o = t[4], s = t[5], u = t[6], f = t[7], c = t[8];
            return e[0] = o * c - s * f, e[1] = i * f - r * c, e[2] = r * s - i * o, e[3] = s * u - a * c, 
            e[4] = n * c - i * u, e[5] = i * a - n * s, e[6] = a * f - o * u, e[7] = r * u - n * f, 
            e[8] = n * o - r * a, e;
        },
        determinant: function(e) {
            var t = e[0], n = e[1], r = e[2], i = e[3], a = e[4], o = e[5], s = e[6], u = e[7], f = e[8];
            return t * (f * a - o * u) + n * (-f * i + o * s) + r * (u * i - a * s);
        },
        multiply: ps,
        translate: function(e, t, n) {
            var r = t[0], i = t[1], a = t[2], o = t[3], s = t[4], u = t[5], f = t[6], c = t[7], l = t[8], h = n[0], d = n[1];
            return e[0] = r, e[1] = i, e[2] = a, e[3] = o, e[4] = s, e[5] = u, e[6] = h * r + d * o + f, 
            e[7] = h * i + d * s + c, e[8] = h * a + d * u + l, e;
        },
        rotate: function(e, t, n) {
            var r = t[0], i = t[1], a = t[2], o = t[3], s = t[4], u = t[5], f = t[6], c = t[7], l = t[8], h = Math.sin(n), d = Math.cos(n);
            return e[0] = d * r + h * o, e[1] = d * i + h * s, e[2] = d * a + h * u, e[3] = d * o - h * r, 
            e[4] = d * s - h * i, e[5] = d * u - h * a, e[6] = f, e[7] = c, e[8] = l, e;
        },
        scale: function(e, t, n) {
            var r = n[0], i = n[1];
            return e[0] = r * t[0], e[1] = r * t[1], e[2] = r * t[2], e[3] = i * t[3], e[4] = i * t[4], 
            e[5] = i * t[5], e[6] = t[6], e[7] = t[7], e[8] = t[8], e;
        },
        fromTranslation: function(e, t) {
            return e[0] = 1, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 1, e[5] = 0, e[6] = t[0], 
            e[7] = t[1], e[8] = 1, e;
        },
        fromRotation: function(e, t) {
            var n = Math.sin(t), r = Math.cos(t);
            return e[0] = r, e[1] = n, e[2] = 0, e[3] = -n, e[4] = r, e[5] = 0, e[6] = 0, e[7] = 0, 
            e[8] = 1, e;
        },
        fromScaling: function(e, t) {
            return e[0] = t[0], e[1] = 0, e[2] = 0, e[3] = 0, e[4] = t[1], e[5] = 0, e[6] = 0, 
            e[7] = 0, e[8] = 1, e;
        },
        fromMat2d: function(e, t) {
            return e[0] = t[0], e[1] = t[1], e[2] = 0, e[3] = t[2], e[4] = t[3], e[5] = 0, e[6] = t[4], 
            e[7] = t[5], e[8] = 1, e;
        },
        fromQuat: function(e, t) {
            var n = t[0], r = t[1], i = t[2], a = t[3], o = n + n, s = r + r, u = i + i, f = n * o, c = r * o, l = r * s, h = i * o, d = i * s, p = i * u, v = a * o, m = a * s, g = a * u;
            return e[0] = 1 - l - p, e[3] = c - g, e[6] = h + m, e[1] = c + g, e[4] = 1 - f - p, 
            e[7] = d - v, e[2] = h - m, e[5] = d + v, e[8] = 1 - f - l, e;
        },
        normalFromMat4: function(e, t) {
            var n = t[0], r = t[1], i = t[2], a = t[3], o = t[4], s = t[5], u = t[6], f = t[7], c = t[8], l = t[9], h = t[10], d = t[11], p = t[12], v = t[13], m = t[14], g = t[15], _ = n * s - r * o, x = n * u - i * o, b = n * f - a * o, y = r * u - i * s, A = r * f - a * s, T = i * f - a * u, E = c * v - l * p, M = c * m - h * p, S = c * g - d * p, w = l * m - h * v, R = l * g - d * v, O = h * g - d * m, C = _ * O - x * R + b * w + y * S - A * M + T * E;
            return C ? (C = 1 / C, e[0] = (s * O - u * R + f * w) * C, e[1] = (u * S - o * O - f * M) * C, 
            e[2] = (o * R - s * S + f * E) * C, e[3] = (i * R - r * O - a * w) * C, e[4] = (n * O - i * S + a * M) * C, 
            e[5] = (r * S - n * R - a * E) * C, e[6] = (v * T - m * A + g * y) * C, e[7] = (m * b - p * T - g * x) * C, 
            e[8] = (p * A - v * b + g * _) * C, e) : null;
        },
        projection: function(e, t, n) {
            return e[0] = 2 / t, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = -2 / n, e[5] = 0, e[6] = -1, 
            e[7] = 1, e[8] = 1, e;
        },
        str: function(e) {
            return "mat3(" + e[0] + ", " + e[1] + ", " + e[2] + ", " + e[3] + ", " + e[4] + ", " + e[5] + ", " + e[6] + ", " + e[7] + ", " + e[8] + ")";
        },
        frob: function(e) {
            return Math.sqrt(Math.pow(e[0], 2) + Math.pow(e[1], 2) + Math.pow(e[2], 2) + Math.pow(e[3], 2) + Math.pow(e[4], 2) + Math.pow(e[5], 2) + Math.pow(e[6], 2) + Math.pow(e[7], 2) + Math.pow(e[8], 2));
        },
        add: function(e, t, n) {
            return e[0] = t[0] + n[0], e[1] = t[1] + n[1], e[2] = t[2] + n[2], e[3] = t[3] + n[3], 
            e[4] = t[4] + n[4], e[5] = t[5] + n[5], e[6] = t[6] + n[6], e[7] = t[7] + n[7], 
            e[8] = t[8] + n[8], e;
        },
        subtract: vs,
        multiplyScalar: function(e, t, n) {
            return e[0] = t[0] * n, e[1] = t[1] * n, e[2] = t[2] * n, e[3] = t[3] * n, e[4] = t[4] * n, 
            e[5] = t[5] * n, e[6] = t[6] * n, e[7] = t[7] * n, e[8] = t[8] * n, e;
        },
        multiplyScalarAndAdd: function(e, t, n, r) {
            return e[0] = t[0] + n[0] * r, e[1] = t[1] + n[1] * r, e[2] = t[2] + n[2] * r, e[3] = t[3] + n[3] * r, 
            e[4] = t[4] + n[4] * r, e[5] = t[5] + n[5] * r, e[6] = t[6] + n[6] * r, e[7] = t[7] + n[7] * r, 
            e[8] = t[8] + n[8] * r, e;
        },
        exactEquals: function(e, t) {
            return e[0] === t[0] && e[1] === t[1] && e[2] === t[2] && e[3] === t[3] && e[4] === t[4] && e[5] === t[5] && e[6] === t[6] && e[7] === t[7] && e[8] === t[8];
        },
        equals: function(e, t) {
            var n = e[0], r = e[1], i = e[2], a = e[3], o = e[4], s = e[5], u = e[6], f = e[7], c = e[8], l = t[0], h = t[1], d = t[2], p = t[3], v = t[4], m = t[5], g = t[6], _ = t[7], x = t[8];
            return Math.abs(n - l) <= Zo * Math.max(1, Math.abs(n), Math.abs(l)) && Math.abs(r - h) <= Zo * Math.max(1, Math.abs(r), Math.abs(h)) && Math.abs(i - d) <= Zo * Math.max(1, Math.abs(i), Math.abs(d)) && Math.abs(a - p) <= Zo * Math.max(1, Math.abs(a), Math.abs(p)) && Math.abs(o - v) <= Zo * Math.max(1, Math.abs(o), Math.abs(v)) && Math.abs(s - m) <= Zo * Math.max(1, Math.abs(s), Math.abs(m)) && Math.abs(u - g) <= Zo * Math.max(1, Math.abs(u), Math.abs(g)) && Math.abs(f - _) <= Zo * Math.max(1, Math.abs(f), Math.abs(_)) && Math.abs(c - x) <= Zo * Math.max(1, Math.abs(c), Math.abs(x));
        },
        mul: ms,
        sub: gs
    });
    function xs(e, t) {
        return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], e[4] = t[4], e[5] = t[5], 
        e[6] = t[6], e[7] = t[7], e[8] = t[8], e[9] = t[9], e[10] = t[10], e[11] = t[11], 
        e[12] = t[12], e[13] = t[13], e[14] = t[14], e[15] = t[15], e;
    }
    function bs(e) {
        return e[0] = 1, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = 1, e[6] = 0, e[7] = 0, 
        e[8] = 0, e[9] = 0, e[10] = 1, e[11] = 0, e[12] = 0, e[13] = 0, e[14] = 0, e[15] = 1, 
        e;
    }
    function ys(e, t, n) {
        var r = t[0], i = t[1], a = t[2], o = t[3], s = t[4], u = t[5], f = t[6], c = t[7], l = t[8], h = t[9], d = t[10], p = t[11], v = t[12], m = t[13], g = t[14], _ = t[15], x = n[0], b = n[1], y = n[2], A = n[3];
        return e[0] = x * r + b * s + y * l + A * v, e[1] = x * i + b * u + y * h + A * m, 
        e[2] = x * a + b * f + y * d + A * g, e[3] = x * o + b * c + y * p + A * _, x = n[4], 
        b = n[5], y = n[6], A = n[7], e[4] = x * r + b * s + y * l + A * v, e[5] = x * i + b * u + y * h + A * m, 
        e[6] = x * a + b * f + y * d + A * g, e[7] = x * o + b * c + y * p + A * _, x = n[8], 
        b = n[9], y = n[10], A = n[11], e[8] = x * r + b * s + y * l + A * v, e[9] = x * i + b * u + y * h + A * m, 
        e[10] = x * a + b * f + y * d + A * g, e[11] = x * o + b * c + y * p + A * _, x = n[12], 
        b = n[13], y = n[14], A = n[15], e[12] = x * r + b * s + y * l + A * v, e[13] = x * i + b * u + y * h + A * m, 
        e[14] = x * a + b * f + y * d + A * g, e[15] = x * o + b * c + y * p + A * _, e;
    }
    function As(e, t, n) {
        var r = n[0], i = n[1], a = n[2], o = void 0, s = void 0, u = void 0, f = void 0, c = void 0, l = void 0, h = void 0, d = void 0, p = void 0, v = void 0, m = void 0, g = void 0;
        return t === e ? (e[12] = t[0] * r + t[4] * i + t[8] * a + t[12], e[13] = t[1] * r + t[5] * i + t[9] * a + t[13], 
        e[14] = t[2] * r + t[6] * i + t[10] * a + t[14], e[15] = t[3] * r + t[7] * i + t[11] * a + t[15]) : (o = t[0], 
        s = t[1], u = t[2], f = t[3], c = t[4], l = t[5], h = t[6], d = t[7], p = t[8], 
        v = t[9], m = t[10], g = t[11], e[0] = o, e[1] = s, e[2] = u, e[3] = f, e[4] = c, 
        e[5] = l, e[6] = h, e[7] = d, e[8] = p, e[9] = v, e[10] = m, e[11] = g, e[12] = o * r + c * i + p * a + t[12], 
        e[13] = s * r + l * i + v * a + t[13], e[14] = u * r + h * i + m * a + t[14], e[15] = f * r + d * i + g * a + t[15]), 
        e;
    }
    function Ts(e, t, n) {
        var r = n[0], i = n[1], a = n[2];
        return e[0] = t[0] * r, e[1] = t[1] * r, e[2] = t[2] * r, e[3] = t[3] * r, e[4] = t[4] * i, 
        e[5] = t[5] * i, e[6] = t[6] * i, e[7] = t[7] * i, e[8] = t[8] * a, e[9] = t[9] * a, 
        e[10] = t[10] * a, e[11] = t[11] * a, e[12] = t[12], e[13] = t[13], e[14] = t[14], 
        e[15] = t[15], e;
    }
    function Es(e, t, n) {
        var r = t[0], i = t[1], a = t[2], o = t[3], s = r + r, u = i + i, f = a + a, c = r * s, l = r * u, h = r * f, d = i * u, p = i * f, v = a * f, m = o * s, g = o * u, _ = o * f;
        return e[0] = 1 - (d + v), e[1] = l + _, e[2] = h - g, e[3] = 0, e[4] = l - _, e[5] = 1 - (c + v), 
        e[6] = p + m, e[7] = 0, e[8] = h + g, e[9] = p - m, e[10] = 1 - (c + d), e[11] = 0, 
        e[12] = n[0], e[13] = n[1], e[14] = n[2], e[15] = 1, e;
    }
    function Ms(e, t) {
        return e[0] = t[12], e[1] = t[13], e[2] = t[14], e;
    }
    function Ss(e, t) {
        var n = t[0] + t[5] + t[10], r = 0;
        return 0 < n ? (r = 2 * Math.sqrt(n + 1), e[3] = .25 * r, e[0] = (t[6] - t[9]) / r, 
        e[1] = (t[8] - t[2]) / r, e[2] = (t[1] - t[4]) / r) : t[0] > t[5] && t[0] > t[10] ? (r = 2 * Math.sqrt(1 + t[0] - t[5] - t[10]), 
        e[3] = (t[6] - t[9]) / r, e[0] = .25 * r, e[1] = (t[1] + t[4]) / r, e[2] = (t[8] + t[2]) / r) : t[5] > t[10] ? (r = 2 * Math.sqrt(1 + t[5] - t[0] - t[10]), 
        e[3] = (t[8] - t[2]) / r, e[0] = (t[1] + t[4]) / r, e[1] = .25 * r, e[2] = (t[6] + t[9]) / r) : (r = 2 * Math.sqrt(1 + t[10] - t[0] - t[5]), 
        e[3] = (t[1] - t[4]) / r, e[0] = (t[8] + t[2]) / r, e[1] = (t[6] + t[9]) / r, e[2] = .25 * r), 
        e;
    }
    function ws(e, t, n) {
        return e[0] = t[0] - n[0], e[1] = t[1] - n[1], e[2] = t[2] - n[2], e[3] = t[3] - n[3], 
        e[4] = t[4] - n[4], e[5] = t[5] - n[5], e[6] = t[6] - n[6], e[7] = t[7] - n[7], 
        e[8] = t[8] - n[8], e[9] = t[9] - n[9], e[10] = t[10] - n[10], e[11] = t[11] - n[11], 
        e[12] = t[12] - n[12], e[13] = t[13] - n[13], e[14] = t[14] - n[14], e[15] = t[15] - n[15], 
        e;
    }
    var Rs = ys, Os = ws, Cs = Object.freeze({
        __proto__: null,
        create: function() {
            var e = new $o(16);
            return $o != Float32Array && (e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[6] = 0, 
            e[7] = 0, e[8] = 0, e[9] = 0, e[11] = 0, e[12] = 0, e[13] = 0, e[14] = 0), e[0] = 1, 
            e[5] = 1, e[10] = 1, e[15] = 1, e;
        },
        clone: function(e) {
            var t = new $o(16);
            return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[3], t[4] = e[4], t[5] = e[5], 
            t[6] = e[6], t[7] = e[7], t[8] = e[8], t[9] = e[9], t[10] = e[10], t[11] = e[11], 
            t[12] = e[12], t[13] = e[13], t[14] = e[14], t[15] = e[15], t;
        },
        copy: xs,
        fromValues: function(e, t, n, r, i, a, o, s, u, f, c, l, h, d, p, v) {
            var m = new $o(16);
            return m[0] = e, m[1] = t, m[2] = n, m[3] = r, m[4] = i, m[5] = a, m[6] = o, m[7] = s, 
            m[8] = u, m[9] = f, m[10] = c, m[11] = l, m[12] = h, m[13] = d, m[14] = p, m[15] = v, 
            m;
        },
        set: function(e, t, n, r, i, a, o, s, u, f, c, l, h, d, p, v, m) {
            return e[0] = t, e[1] = n, e[2] = r, e[3] = i, e[4] = a, e[5] = o, e[6] = s, e[7] = u, 
            e[8] = f, e[9] = c, e[10] = l, e[11] = h, e[12] = d, e[13] = p, e[14] = v, e[15] = m, 
            e;
        },
        identity: bs,
        transpose: function(e, t) {
            if (e === t) {
                var n = t[1], r = t[2], i = t[3], a = t[6], o = t[7], s = t[11];
                e[1] = t[4], e[2] = t[8], e[3] = t[12], e[4] = n, e[6] = t[9], e[7] = t[13], e[8] = r, 
                e[9] = a, e[11] = t[14], e[12] = i, e[13] = o, e[14] = s;
            } else e[0] = t[0], e[1] = t[4], e[2] = t[8], e[3] = t[12], e[4] = t[1], e[5] = t[5], 
            e[6] = t[9], e[7] = t[13], e[8] = t[2], e[9] = t[6], e[10] = t[10], e[11] = t[14], 
            e[12] = t[3], e[13] = t[7], e[14] = t[11], e[15] = t[15];
            return e;
        },
        invert: function(e, t) {
            var n = t[0], r = t[1], i = t[2], a = t[3], o = t[4], s = t[5], u = t[6], f = t[7], c = t[8], l = t[9], h = t[10], d = t[11], p = t[12], v = t[13], m = t[14], g = t[15], _ = n * s - r * o, x = n * u - i * o, b = n * f - a * o, y = r * u - i * s, A = r * f - a * s, T = i * f - a * u, E = c * v - l * p, M = c * m - h * p, S = c * g - d * p, w = l * m - h * v, R = l * g - d * v, O = h * g - d * m, C = _ * O - x * R + b * w + y * S - A * M + T * E;
            return C ? (C = 1 / C, e[0] = (s * O - u * R + f * w) * C, e[1] = (i * R - r * O - a * w) * C, 
            e[2] = (v * T - m * A + g * y) * C, e[3] = (h * A - l * T - d * y) * C, e[4] = (u * S - o * O - f * M) * C, 
            e[5] = (n * O - i * S + a * M) * C, e[6] = (m * b - p * T - g * x) * C, e[7] = (c * T - h * b + d * x) * C, 
            e[8] = (o * R - s * S + f * E) * C, e[9] = (r * S - n * R - a * E) * C, e[10] = (p * A - v * b + g * _) * C, 
            e[11] = (l * b - c * A - d * _) * C, e[12] = (s * M - o * w - u * E) * C, e[13] = (n * w - r * M + i * E) * C, 
            e[14] = (v * x - p * y - m * _) * C, e[15] = (c * y - l * x + h * _) * C, e) : null;
        },
        adjoint: function(e, t) {
            var n = t[0], r = t[1], i = t[2], a = t[3], o = t[4], s = t[5], u = t[6], f = t[7], c = t[8], l = t[9], h = t[10], d = t[11], p = t[12], v = t[13], m = t[14], g = t[15];
            return e[0] = s * (h * g - d * m) - l * (u * g - f * m) + v * (u * d - f * h), e[1] = -(r * (h * g - d * m) - l * (i * g - a * m) + v * (i * d - a * h)), 
            e[2] = r * (u * g - f * m) - s * (i * g - a * m) + v * (i * f - a * u), e[3] = -(r * (u * d - f * h) - s * (i * d - a * h) + l * (i * f - a * u)), 
            e[4] = -(o * (h * g - d * m) - c * (u * g - f * m) + p * (u * d - f * h)), e[5] = n * (h * g - d * m) - c * (i * g - a * m) + p * (i * d - a * h), 
            e[6] = -(n * (u * g - f * m) - o * (i * g - a * m) + p * (i * f - a * u)), e[7] = n * (u * d - f * h) - o * (i * d - a * h) + c * (i * f - a * u), 
            e[8] = o * (l * g - d * v) - c * (s * g - f * v) + p * (s * d - f * l), e[9] = -(n * (l * g - d * v) - c * (r * g - a * v) + p * (r * d - a * l)), 
            e[10] = n * (s * g - f * v) - o * (r * g - a * v) + p * (r * f - a * s), e[11] = -(n * (s * d - f * l) - o * (r * d - a * l) + c * (r * f - a * s)), 
            e[12] = -(o * (l * m - h * v) - c * (s * m - u * v) + p * (s * h - u * l)), e[13] = n * (l * m - h * v) - c * (r * m - i * v) + p * (r * h - i * l), 
            e[14] = -(n * (s * m - u * v) - o * (r * m - i * v) + p * (r * u - i * s)), e[15] = n * (s * h - u * l) - o * (r * h - i * l) + c * (r * u - i * s), 
            e;
        },
        determinant: function(e) {
            var t = e[0], n = e[1], r = e[2], i = e[3], a = e[4], o = e[5], s = e[6], u = e[7], f = e[8], c = e[9], l = e[10], h = e[11], d = e[12], p = e[13], v = e[14], m = e[15];
            return (t * o - n * a) * (l * m - h * v) - (t * s - r * a) * (c * m - h * p) + (t * u - i * a) * (c * v - l * p) + (n * s - r * o) * (f * m - h * d) - (n * u - i * o) * (f * v - l * d) + (r * u - i * s) * (f * p - c * d);
        },
        multiply: ys,
        translate: As,
        scale: Ts,
        rotate: function(e, t, n, r) {
            var i, a, o, s, u, f, c, l, h, d, p, v, m, g, _, x, b, y, A, T, E, M, S, w, R = r[0], O = r[1], C = r[2], B = Math.sqrt(R * R + O * O + C * C);
            return B < Zo ? null : (R *= B = 1 / B, O *= B, C *= B, i = Math.sin(n), o = 1 - (a = Math.cos(n)), 
            s = t[0], u = t[1], f = t[2], c = t[3], l = t[4], h = t[5], d = t[6], p = t[7], 
            v = t[8], m = t[9], g = t[10], _ = t[11], x = R * R * o + a, b = O * R * o + C * i, 
            y = C * R * o - O * i, A = R * O * o - C * i, T = O * O * o + a, E = C * O * o + R * i, 
            M = R * C * o + O * i, S = O * C * o - R * i, w = C * C * o + a, e[0] = s * x + l * b + v * y, 
            e[1] = u * x + h * b + m * y, e[2] = f * x + d * b + g * y, e[3] = c * x + p * b + _ * y, 
            e[4] = s * A + l * T + v * E, e[5] = u * A + h * T + m * E, e[6] = f * A + d * T + g * E, 
            e[7] = c * A + p * T + _ * E, e[8] = s * M + l * S + v * w, e[9] = u * M + h * S + m * w, 
            e[10] = f * M + d * S + g * w, e[11] = c * M + p * S + _ * w, t !== e && (e[12] = t[12], 
            e[13] = t[13], e[14] = t[14], e[15] = t[15]), e);
        },
        rotateX: function(e, t, n) {
            var r = Math.sin(n), i = Math.cos(n), a = t[4], o = t[5], s = t[6], u = t[7], f = t[8], c = t[9], l = t[10], h = t[11];
            return t !== e && (e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], e[12] = t[12], 
            e[13] = t[13], e[14] = t[14], e[15] = t[15]), e[4] = a * i + f * r, e[5] = o * i + c * r, 
            e[6] = s * i + l * r, e[7] = u * i + h * r, e[8] = f * i - a * r, e[9] = c * i - o * r, 
            e[10] = l * i - s * r, e[11] = h * i - u * r, e;
        },
        rotateY: function(e, t, n) {
            var r = Math.sin(n), i = Math.cos(n), a = t[0], o = t[1], s = t[2], u = t[3], f = t[8], c = t[9], l = t[10], h = t[11];
            return t !== e && (e[4] = t[4], e[5] = t[5], e[6] = t[6], e[7] = t[7], e[12] = t[12], 
            e[13] = t[13], e[14] = t[14], e[15] = t[15]), e[0] = a * i - f * r, e[1] = o * i - c * r, 
            e[2] = s * i - l * r, e[3] = u * i - h * r, e[8] = a * r + f * i, e[9] = o * r + c * i, 
            e[10] = s * r + l * i, e[11] = u * r + h * i, e;
        },
        rotateZ: function(e, t, n) {
            var r = Math.sin(n), i = Math.cos(n), a = t[0], o = t[1], s = t[2], u = t[3], f = t[4], c = t[5], l = t[6], h = t[7];
            return t !== e && (e[8] = t[8], e[9] = t[9], e[10] = t[10], e[11] = t[11], e[12] = t[12], 
            e[13] = t[13], e[14] = t[14], e[15] = t[15]), e[0] = a * i + f * r, e[1] = o * i + c * r, 
            e[2] = s * i + l * r, e[3] = u * i + h * r, e[4] = f * i - a * r, e[5] = c * i - o * r, 
            e[6] = l * i - s * r, e[7] = h * i - u * r, e;
        },
        fromTranslation: function(e, t) {
            return e[0] = 1, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = 1, e[6] = 0, e[7] = 0, 
            e[8] = 0, e[9] = 0, e[10] = 1, e[11] = 0, e[12] = t[0], e[13] = t[1], e[14] = t[2], 
            e[15] = 1, e;
        },
        fromScaling: function(e, t) {
            return e[0] = t[0], e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = t[1], e[6] = 0, 
            e[7] = 0, e[8] = 0, e[9] = 0, e[10] = t[2], e[11] = 0, e[12] = 0, e[13] = 0, e[14] = 0, 
            e[15] = 1, e;
        },
        fromRotation: function(e, t, n) {
            var r, i, a, o = n[0], s = n[1], u = n[2], f = Math.sqrt(o * o + s * s + u * u);
            return f < Zo ? null : (o *= f = 1 / f, s *= f, u *= f, r = Math.sin(t), a = 1 - (i = Math.cos(t)), 
            e[0] = o * o * a + i, e[1] = s * o * a + u * r, e[2] = u * o * a - s * r, e[3] = 0, 
            e[4] = o * s * a - u * r, e[5] = s * s * a + i, e[6] = u * s * a + o * r, e[7] = 0, 
            e[8] = o * u * a + s * r, e[9] = s * u * a - o * r, e[10] = u * u * a + i, e[11] = 0, 
            e[12] = 0, e[13] = 0, e[14] = 0, e[15] = 1, e);
        },
        fromXRotation: function(e, t) {
            var n = Math.sin(t), r = Math.cos(t);
            return e[0] = 1, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = r, e[6] = n, e[7] = 0, 
            e[8] = 0, e[9] = -n, e[10] = r, e[11] = 0, e[12] = 0, e[13] = 0, e[14] = 0, e[15] = 1, 
            e;
        },
        fromYRotation: function(e, t) {
            var n = Math.sin(t), r = Math.cos(t);
            return e[0] = r, e[1] = 0, e[2] = -n, e[3] = 0, e[4] = 0, e[5] = 1, e[6] = 0, e[7] = 0, 
            e[8] = n, e[9] = 0, e[10] = r, e[11] = 0, e[12] = 0, e[13] = 0, e[14] = 0, e[15] = 1, 
            e;
        },
        fromZRotation: function(e, t) {
            var n = Math.sin(t), r = Math.cos(t);
            return e[0] = r, e[1] = n, e[2] = 0, e[3] = 0, e[4] = -n, e[5] = r, e[6] = 0, e[7] = 0, 
            e[8] = 0, e[9] = 0, e[10] = 1, e[11] = 0, e[12] = 0, e[13] = 0, e[14] = 0, e[15] = 1, 
            e;
        },
        fromRotationTranslation: Es,
        fromQuat2: function(e, t) {
            var n = new $o(3), r = -t[0], i = -t[1], a = -t[2], o = t[3], s = t[4], u = t[5], f = t[6], c = t[7], l = r * r + i * i + a * a + o * o;
            return 0 < l ? (n[0] = 2 * (s * o + c * r + u * a - f * i) / l, n[1] = 2 * (u * o + c * i + f * r - s * a) / l, 
            n[2] = 2 * (f * o + c * a + s * i - u * r) / l) : (n[0] = 2 * (s * o + c * r + u * a - f * i), 
            n[1] = 2 * (u * o + c * i + f * r - s * a), n[2] = 2 * (f * o + c * a + s * i - u * r)), 
            Es(e, t, n), e;
        },
        getTranslation: Ms,
        getScaling: function(e, t) {
            var n = t[0], r = t[1], i = t[2], a = t[4], o = t[5], s = t[6], u = t[8], f = t[9], c = t[10];
            return e[0] = Math.sqrt(n * n + r * r + i * i), e[1] = Math.sqrt(a * a + o * o + s * s), 
            e[2] = Math.sqrt(u * u + f * f + c * c), e;
        },
        getRotation: Ss,
        fromRotationTranslationScale: function(e, t, n, r) {
            var i = t[0], a = t[1], o = t[2], s = t[3], u = i + i, f = a + a, c = o + o, l = i * u, h = i * f, d = i * c, p = a * f, v = a * c, m = o * c, g = s * u, _ = s * f, x = s * c, b = r[0], y = r[1], A = r[2];
            return e[0] = (1 - (p + m)) * b, e[1] = (h + x) * b, e[2] = (d - _) * b, e[3] = 0, 
            e[4] = (h - x) * y, e[5] = (1 - (l + m)) * y, e[6] = (v + g) * y, e[7] = 0, e[8] = (d + _) * A, 
            e[9] = (v - g) * A, e[10] = (1 - (l + p)) * A, e[11] = 0, e[12] = n[0], e[13] = n[1], 
            e[14] = n[2], e[15] = 1, e;
        },
        fromRotationTranslationScaleOrigin: function(e, t, n, r, i) {
            var a = t[0], o = t[1], s = t[2], u = t[3], f = a + a, c = o + o, l = s + s, h = a * f, d = a * c, p = a * l, v = o * c, m = o * l, g = s * l, _ = u * f, x = u * c, b = u * l, y = r[0], A = r[1], T = r[2], E = i[0], M = i[1], S = i[2], w = (1 - (v + g)) * y, R = (d + b) * y, O = (p - x) * y, C = (d - b) * A, B = (1 - (h + g)) * A, F = (m + _) * A, P = (p + x) * T, I = (m - _) * T, D = (1 - (h + v)) * T;
            return e[0] = w, e[1] = R, e[2] = O, e[3] = 0, e[4] = C, e[5] = B, e[6] = F, e[7] = 0, 
            e[8] = P, e[9] = I, e[10] = D, e[11] = 0, e[12] = n[0] + E - (w * E + C * M + P * S), 
            e[13] = n[1] + M - (R * E + B * M + I * S), e[14] = n[2] + S - (O * E + F * M + D * S), 
            e[15] = 1, e;
        },
        fromQuat: function(e, t) {
            var n = t[0], r = t[1], i = t[2], a = t[3], o = n + n, s = r + r, u = i + i, f = n * o, c = r * o, l = r * s, h = i * o, d = i * s, p = i * u, v = a * o, m = a * s, g = a * u;
            return e[0] = 1 - l - p, e[1] = c + g, e[2] = h - m, e[3] = 0, e[4] = c - g, e[5] = 1 - f - p, 
            e[6] = d + v, e[7] = 0, e[8] = h + m, e[9] = d - v, e[10] = 1 - f - l, e[11] = 0, 
            e[12] = 0, e[13] = 0, e[14] = 0, e[15] = 1, e;
        },
        frustum: function(e, t, n, r, i, a, o) {
            var s = 1 / (n - t), u = 1 / (i - r), f = 1 / (a - o);
            return e[0] = 2 * a * s, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = 2 * a * u, 
            e[6] = 0, e[7] = 0, e[8] = (n + t) * s, e[9] = (i + r) * u, e[10] = (o + a) * f, 
            e[11] = -1, e[12] = 0, e[13] = 0, e[14] = o * a * 2 * f, e[15] = 0, e;
        },
        perspective: function(e, t, n, r, i) {
            var a = 1 / Math.tan(t / 2), o = void 0;
            return e[0] = a / n, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = a, e[6] = 0, 
            e[7] = 0, e[8] = 0, e[9] = 0, e[11] = -1, e[12] = 0, e[13] = 0, e[15] = 0, null != i && i !== 1 / 0 ? (o = 1 / (r - i), 
            e[10] = (i + r) * o, e[14] = 2 * i * r * o) : (e[10] = -1, e[14] = -2 * r), e;
        },
        perspectiveFromFieldOfView: function(e, t, n, r) {
            var i = Math.tan(t.upDegrees * Math.PI / 180), a = Math.tan(t.downDegrees * Math.PI / 180), o = Math.tan(t.leftDegrees * Math.PI / 180), s = Math.tan(t.rightDegrees * Math.PI / 180), u = 2 / (o + s), f = 2 / (i + a);
            return e[0] = u, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = f, e[6] = 0, e[7] = 0, 
            e[8] = -(o - s) * u * .5, e[9] = (i - a) * f * .5, e[10] = r / (n - r), e[11] = -1, 
            e[12] = 0, e[13] = 0, e[14] = r * n / (n - r), e[15] = 0, e;
        },
        ortho: function(e, t, n, r, i, a, o) {
            var s = 1 / (t - n), u = 1 / (r - i), f = 1 / (a - o);
            return e[0] = -2 * s, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = -2 * u, e[6] = 0, 
            e[7] = 0, e[8] = 0, e[9] = 0, e[10] = 2 * f, e[11] = 0, e[12] = (t + n) * s, e[13] = (i + r) * u, 
            e[14] = (o + a) * f, e[15] = 1, e;
        },
        lookAt: function(e, t, n, r) {
            var i = void 0, a = void 0, o = void 0, s = void 0, u = void 0, f = void 0, c = void 0, l = void 0, h = void 0, d = void 0, p = t[0], v = t[1], m = t[2], g = r[0], _ = r[1], x = r[2], b = n[0], y = n[1], A = n[2];
            return Math.abs(p - b) < Zo && Math.abs(v - y) < Zo && Math.abs(m - A) < Zo ? bs(e) : (c = p - b, 
            l = v - y, h = m - A, i = _ * (h *= d = 1 / Math.sqrt(c * c + l * l + h * h)) - x * (l *= d), 
            a = x * (c *= d) - g * h, o = g * l - _ * c, (d = Math.sqrt(i * i + a * a + o * o)) ? (i *= d = 1 / d, 
            a *= d, o *= d) : o = a = i = 0, s = l * o - h * a, u = h * i - c * o, f = c * a - l * i, 
            (d = Math.sqrt(s * s + u * u + f * f)) ? (s *= d = 1 / d, u *= d, f *= d) : f = u = s = 0, 
            e[0] = i, e[1] = s, e[2] = c, e[3] = 0, e[4] = a, e[5] = u, e[6] = l, e[7] = 0, 
            e[8] = o, e[9] = f, e[10] = h, e[11] = 0, e[12] = -(i * p + a * v + o * m), e[13] = -(s * p + u * v + f * m), 
            e[14] = -(c * p + l * v + h * m), e[15] = 1, e);
        },
        targetTo: function(e, t, n, r) {
            var i = t[0], a = t[1], o = t[2], s = r[0], u = r[1], f = r[2], c = i - n[0], l = a - n[1], h = o - n[2], d = c * c + l * l + h * h;
            0 < d && (c *= d = 1 / Math.sqrt(d), l *= d, h *= d);
            var p = u * h - f * l, v = f * c - s * h, m = s * l - u * c;
            return 0 < (d = p * p + v * v + m * m) && (p *= d = 1 / Math.sqrt(d), v *= d, m *= d), 
            e[0] = p, e[1] = v, e[2] = m, e[3] = 0, e[4] = l * m - h * v, e[5] = h * p - c * m, 
            e[6] = c * v - l * p, e[7] = 0, e[8] = c, e[9] = l, e[10] = h, e[11] = 0, e[12] = i, 
            e[13] = a, e[14] = o, e[15] = 1, e;
        },
        str: function(e) {
            return "mat4(" + e[0] + ", " + e[1] + ", " + e[2] + ", " + e[3] + ", " + e[4] + ", " + e[5] + ", " + e[6] + ", " + e[7] + ", " + e[8] + ", " + e[9] + ", " + e[10] + ", " + e[11] + ", " + e[12] + ", " + e[13] + ", " + e[14] + ", " + e[15] + ")";
        },
        frob: function(e) {
            return Math.sqrt(Math.pow(e[0], 2) + Math.pow(e[1], 2) + Math.pow(e[2], 2) + Math.pow(e[3], 2) + Math.pow(e[4], 2) + Math.pow(e[5], 2) + Math.pow(e[6], 2) + Math.pow(e[7], 2) + Math.pow(e[8], 2) + Math.pow(e[9], 2) + Math.pow(e[10], 2) + Math.pow(e[11], 2) + Math.pow(e[12], 2) + Math.pow(e[13], 2) + Math.pow(e[14], 2) + Math.pow(e[15], 2));
        },
        add: function(e, t, n) {
            return e[0] = t[0] + n[0], e[1] = t[1] + n[1], e[2] = t[2] + n[2], e[3] = t[3] + n[3], 
            e[4] = t[4] + n[4], e[5] = t[5] + n[5], e[6] = t[6] + n[6], e[7] = t[7] + n[7], 
            e[8] = t[8] + n[8], e[9] = t[9] + n[9], e[10] = t[10] + n[10], e[11] = t[11] + n[11], 
            e[12] = t[12] + n[12], e[13] = t[13] + n[13], e[14] = t[14] + n[14], e[15] = t[15] + n[15], 
            e;
        },
        subtract: ws,
        multiplyScalar: function(e, t, n) {
            return e[0] = t[0] * n, e[1] = t[1] * n, e[2] = t[2] * n, e[3] = t[3] * n, e[4] = t[4] * n, 
            e[5] = t[5] * n, e[6] = t[6] * n, e[7] = t[7] * n, e[8] = t[8] * n, e[9] = t[9] * n, 
            e[10] = t[10] * n, e[11] = t[11] * n, e[12] = t[12] * n, e[13] = t[13] * n, e[14] = t[14] * n, 
            e[15] = t[15] * n, e;
        },
        multiplyScalarAndAdd: function(e, t, n, r) {
            return e[0] = t[0] + n[0] * r, e[1] = t[1] + n[1] * r, e[2] = t[2] + n[2] * r, e[3] = t[3] + n[3] * r, 
            e[4] = t[4] + n[4] * r, e[5] = t[5] + n[5] * r, e[6] = t[6] + n[6] * r, e[7] = t[7] + n[7] * r, 
            e[8] = t[8] + n[8] * r, e[9] = t[9] + n[9] * r, e[10] = t[10] + n[10] * r, e[11] = t[11] + n[11] * r, 
            e[12] = t[12] + n[12] * r, e[13] = t[13] + n[13] * r, e[14] = t[14] + n[14] * r, 
            e[15] = t[15] + n[15] * r, e;
        },
        exactEquals: function(e, t) {
            return e[0] === t[0] && e[1] === t[1] && e[2] === t[2] && e[3] === t[3] && e[4] === t[4] && e[5] === t[5] && e[6] === t[6] && e[7] === t[7] && e[8] === t[8] && e[9] === t[9] && e[10] === t[10] && e[11] === t[11] && e[12] === t[12] && e[13] === t[13] && e[14] === t[14] && e[15] === t[15];
        },
        equals: function(e, t) {
            var n = e[0], r = e[1], i = e[2], a = e[3], o = e[4], s = e[5], u = e[6], f = e[7], c = e[8], l = e[9], h = e[10], d = e[11], p = e[12], v = e[13], m = e[14], g = e[15], _ = t[0], x = t[1], b = t[2], y = t[3], A = t[4], T = t[5], E = t[6], M = t[7], S = t[8], w = t[9], R = t[10], O = t[11], C = t[12], B = t[13], F = t[14], P = t[15];
            return Math.abs(n - _) <= Zo * Math.max(1, Math.abs(n), Math.abs(_)) && Math.abs(r - x) <= Zo * Math.max(1, Math.abs(r), Math.abs(x)) && Math.abs(i - b) <= Zo * Math.max(1, Math.abs(i), Math.abs(b)) && Math.abs(a - y) <= Zo * Math.max(1, Math.abs(a), Math.abs(y)) && Math.abs(o - A) <= Zo * Math.max(1, Math.abs(o), Math.abs(A)) && Math.abs(s - T) <= Zo * Math.max(1, Math.abs(s), Math.abs(T)) && Math.abs(u - E) <= Zo * Math.max(1, Math.abs(u), Math.abs(E)) && Math.abs(f - M) <= Zo * Math.max(1, Math.abs(f), Math.abs(M)) && Math.abs(c - S) <= Zo * Math.max(1, Math.abs(c), Math.abs(S)) && Math.abs(l - w) <= Zo * Math.max(1, Math.abs(l), Math.abs(w)) && Math.abs(h - R) <= Zo * Math.max(1, Math.abs(h), Math.abs(R)) && Math.abs(d - O) <= Zo * Math.max(1, Math.abs(d), Math.abs(O)) && Math.abs(p - C) <= Zo * Math.max(1, Math.abs(p), Math.abs(C)) && Math.abs(v - B) <= Zo * Math.max(1, Math.abs(v), Math.abs(B)) && Math.abs(m - F) <= Zo * Math.max(1, Math.abs(m), Math.abs(F)) && Math.abs(g - P) <= Zo * Math.max(1, Math.abs(g), Math.abs(P));
        },
        mul: Rs,
        sub: Os
    });
    function Bs() {
        var e = new $o(3);
        return $o != Float32Array && (e[0] = 0, e[1] = 0, e[2] = 0), e;
    }
    function Fs(e) {
        var t = e[0], n = e[1], r = e[2];
        return Math.sqrt(t * t + n * n + r * r);
    }
    function Ps(e, t, n) {
        var r = new $o(3);
        return r[0] = e, r[1] = t, r[2] = n, r;
    }
    function Is(e, t) {
        return e[0] = t[0], e[1] = t[1], e[2] = t[2], e;
    }
    function Ds(e, t, n, r) {
        return e[0] = t, e[1] = n, e[2] = r, e;
    }
    function Ns(e, t, n) {
        return e[0] = t[0] - n[0], e[1] = t[1] - n[1], e[2] = t[2] - n[2], e;
    }
    function Ls(e, t, n) {
        return e[0] = t[0] * n[0], e[1] = t[1] * n[1], e[2] = t[2] * n[2], e;
    }
    function Us(e, t, n) {
        return e[0] = t[0] / n[0], e[1] = t[1] / n[1], e[2] = t[2] / n[2], e;
    }
    function qs(e, t) {
        var n = t[0] - e[0], r = t[1] - e[1], i = t[2] - e[2];
        return Math.sqrt(n * n + r * r + i * i);
    }
    function zs(e, t) {
        var n = t[0] - e[0], r = t[1] - e[1], i = t[2] - e[2];
        return n * n + r * r + i * i;
    }
    function Gs(e) {
        var t = e[0], n = e[1], r = e[2];
        return t * t + n * n + r * r;
    }
    function Hs(e, t) {
        var n = t[0], r = t[1], i = t[2], a = n * n + r * r + i * i;
        return 0 < a && (a = 1 / Math.sqrt(a), e[0] = t[0] * a, e[1] = t[1] * a, e[2] = t[2] * a), 
        e;
    }
    function Vs(e, t) {
        return e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
    }
    function ks(e, t, n) {
        var r = t[0], i = t[1], a = t[2], o = n[0], s = n[1], u = n[2];
        return e[0] = i * u - a * s, e[1] = a * o - r * u, e[2] = r * s - i * o, e;
    }
    function js(e, t) {
        var n = e[0], r = e[1], i = e[2], a = t[0], o = t[1], s = t[2];
        return Math.abs(n - a) <= Zo * Math.max(1, Math.abs(n), Math.abs(a)) && Math.abs(r - o) <= Zo * Math.max(1, Math.abs(r), Math.abs(o)) && Math.abs(i - s) <= Zo * Math.max(1, Math.abs(i), Math.abs(s));
    }
    var Ws, Xs = Ns, Ys = Ls, Ks = Us, Js = qs, Qs = zs, Zs = Fs, $s = Gs, eu = (Ws = Bs(), 
    function(e, t, n, r, i, a) {
        var o = void 0, s = void 0;
        for (t = t || 3, n = n || 0, s = r ? Math.min(r * t + n, e.length) : e.length, o = n; o < s; o += t) Ws[0] = e[o], 
        Ws[1] = e[o + 1], Ws[2] = e[o + 2], i(Ws, Ws, a), e[o] = Ws[0], e[o + 1] = Ws[1], 
        e[o + 2] = Ws[2];
        return e;
    }), tu = Object.freeze({
        __proto__: null,
        create: Bs,
        clone: function(e) {
            var t = new $o(3);
            return t[0] = e[0], t[1] = e[1], t[2] = e[2], t;
        },
        length: Fs,
        fromValues: Ps,
        copy: Is,
        set: Ds,
        add: function(e, t, n) {
            return e[0] = t[0] + n[0], e[1] = t[1] + n[1], e[2] = t[2] + n[2], e;
        },
        subtract: Ns,
        multiply: Ls,
        divide: Us,
        ceil: function(e, t) {
            return e[0] = Math.ceil(t[0]), e[1] = Math.ceil(t[1]), e[2] = Math.ceil(t[2]), e;
        },
        floor: function(e, t) {
            return e[0] = Math.floor(t[0]), e[1] = Math.floor(t[1]), e[2] = Math.floor(t[2]), 
            e;
        },
        min: function(e, t, n) {
            return e[0] = Math.min(t[0], n[0]), e[1] = Math.min(t[1], n[1]), e[2] = Math.min(t[2], n[2]), 
            e;
        },
        max: function(e, t, n) {
            return e[0] = Math.max(t[0], n[0]), e[1] = Math.max(t[1], n[1]), e[2] = Math.max(t[2], n[2]), 
            e;
        },
        round: function(e, t) {
            return e[0] = Math.round(t[0]), e[1] = Math.round(t[1]), e[2] = Math.round(t[2]), 
            e;
        },
        scale: function(e, t, n) {
            return e[0] = t[0] * n, e[1] = t[1] * n, e[2] = t[2] * n, e;
        },
        scaleAndAdd: function(e, t, n, r) {
            return e[0] = t[0] + n[0] * r, e[1] = t[1] + n[1] * r, e[2] = t[2] + n[2] * r, e;
        },
        distance: qs,
        squaredDistance: zs,
        squaredLength: Gs,
        negate: function(e, t) {
            return e[0] = -t[0], e[1] = -t[1], e[2] = -t[2], e;
        },
        inverse: function(e, t) {
            return e[0] = 1 / t[0], e[1] = 1 / t[1], e[2] = 1 / t[2], e;
        },
        normalize: Hs,
        dot: Vs,
        cross: ks,
        lerp: function(e, t, n, r) {
            var i = t[0], a = t[1], o = t[2];
            return e[0] = i + r * (n[0] - i), e[1] = a + r * (n[1] - a), e[2] = o + r * (n[2] - o), 
            e;
        },
        hermite: function(e, t, n, r, i, a) {
            var o = a * a, s = o * (2 * a - 3) + 1, u = o * (a - 2) + a, f = o * (a - 1), c = o * (3 - 2 * a);
            return e[0] = t[0] * s + n[0] * u + r[0] * f + i[0] * c, e[1] = t[1] * s + n[1] * u + r[1] * f + i[1] * c, 
            e[2] = t[2] * s + n[2] * u + r[2] * f + i[2] * c, e;
        },
        bezier: function(e, t, n, r, i, a) {
            var o = 1 - a, s = o * o, u = a * a, f = s * o, c = 3 * a * s, l = 3 * u * o, h = u * a;
            return e[0] = t[0] * f + n[0] * c + r[0] * l + i[0] * h, e[1] = t[1] * f + n[1] * c + r[1] * l + i[1] * h, 
            e[2] = t[2] * f + n[2] * c + r[2] * l + i[2] * h, e;
        },
        random: function(e, t) {
            t = t || 1;
            var n = 2 * es() * Math.PI, r = 2 * es() - 1, i = Math.sqrt(1 - r * r) * t;
            return e[0] = Math.cos(n) * i, e[1] = Math.sin(n) * i, e[2] = r * t, e;
        },
        transformMat4: function(e, t, n) {
            var r = t[0], i = t[1], a = t[2], o = n[3] * r + n[7] * i + n[11] * a + n[15];
            return o = o || 1, e[0] = (n[0] * r + n[4] * i + n[8] * a + n[12]) / o, e[1] = (n[1] * r + n[5] * i + n[9] * a + n[13]) / o, 
            e[2] = (n[2] * r + n[6] * i + n[10] * a + n[14]) / o, e;
        },
        transformMat3: function(e, t, n) {
            var r = t[0], i = t[1], a = t[2];
            return e[0] = r * n[0] + i * n[3] + a * n[6], e[1] = r * n[1] + i * n[4] + a * n[7], 
            e[2] = r * n[2] + i * n[5] + a * n[8], e;
        },
        transformQuat: function(e, t, n) {
            var r = n[0], i = n[1], a = n[2], o = n[3], s = t[0], u = t[1], f = t[2], c = i * f - a * u, l = a * s - r * f, h = r * u - i * s, d = i * h - a * l, p = a * c - r * h, v = r * l - i * c, m = 2 * o;
            return c *= m, l *= m, h *= m, d *= 2, p *= 2, v *= 2, e[0] = s + c + d, e[1] = u + l + p, 
            e[2] = f + h + v, e;
        },
        rotateX: function(e, t, n, r) {
            var i = [], a = [];
            return i[0] = t[0] - n[0], i[1] = t[1] - n[1], i[2] = t[2] - n[2], a[0] = i[0], 
            a[1] = i[1] * Math.cos(r) - i[2] * Math.sin(r), a[2] = i[1] * Math.sin(r) + i[2] * Math.cos(r), 
            e[0] = a[0] + n[0], e[1] = a[1] + n[1], e[2] = a[2] + n[2], e;
        },
        rotateY: function(e, t, n, r) {
            var i = [], a = [];
            return i[0] = t[0] - n[0], i[1] = t[1] - n[1], i[2] = t[2] - n[2], a[0] = i[2] * Math.sin(r) + i[0] * Math.cos(r), 
            a[1] = i[1], a[2] = i[2] * Math.cos(r) - i[0] * Math.sin(r), e[0] = a[0] + n[0], 
            e[1] = a[1] + n[1], e[2] = a[2] + n[2], e;
        },
        rotateZ: function(e, t, n, r) {
            var i = [], a = [];
            return i[0] = t[0] - n[0], i[1] = t[1] - n[1], i[2] = t[2] - n[2], a[0] = i[0] * Math.cos(r) - i[1] * Math.sin(r), 
            a[1] = i[0] * Math.sin(r) + i[1] * Math.cos(r), a[2] = i[2], e[0] = a[0] + n[0], 
            e[1] = a[1] + n[1], e[2] = a[2] + n[2], e;
        },
        angle: function(e, t) {
            var n = Ps(e[0], e[1], e[2]), r = Ps(t[0], t[1], t[2]);
            Hs(n, n), Hs(r, r);
            var i = Vs(n, r);
            return 1 < i ? 0 : i < -1 ? Math.PI : Math.acos(i);
        },
        str: function(e) {
            return "vec3(" + e[0] + ", " + e[1] + ", " + e[2] + ")";
        },
        exactEquals: function(e, t) {
            return e[0] === t[0] && e[1] === t[1] && e[2] === t[2];
        },
        equals: js,
        sub: Xs,
        mul: Ys,
        div: Ks,
        dist: Js,
        sqrDist: Qs,
        len: Zs,
        sqrLen: $s,
        forEach: eu
    });
    function nu() {
        var e = new $o(4);
        return $o != Float32Array && (e[0] = 0, e[1] = 0, e[2] = 0, e[3] = 0), e;
    }
    function ru(e) {
        var t = new $o(4);
        return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[3], t;
    }
    function iu(e, t, n, r) {
        var i = new $o(4);
        return i[0] = e, i[1] = t, i[2] = n, i[3] = r, i;
    }
    function au(e, t) {
        return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], e;
    }
    function ou(e, t, n, r, i) {
        return e[0] = t, e[1] = n, e[2] = r, e[3] = i, e;
    }
    function su(e, t, n) {
        return e[0] = t[0] + n[0], e[1] = t[1] + n[1], e[2] = t[2] + n[2], e[3] = t[3] + n[3], 
        e;
    }
    function uu(e, t, n) {
        return e[0] = t[0] - n[0], e[1] = t[1] - n[1], e[2] = t[2] - n[2], e[3] = t[3] - n[3], 
        e;
    }
    function fu(e, t, n) {
        return e[0] = t[0] * n[0], e[1] = t[1] * n[1], e[2] = t[2] * n[2], e[3] = t[3] * n[3], 
        e;
    }
    function cu(e, t, n) {
        return e[0] = t[0] / n[0], e[1] = t[1] / n[1], e[2] = t[2] / n[2], e[3] = t[3] / n[3], 
        e;
    }
    function lu(e, t, n) {
        return e[0] = t[0] * n, e[1] = t[1] * n, e[2] = t[2] * n, e[3] = t[3] * n, e;
    }
    function hu(e, t) {
        var n = t[0] - e[0], r = t[1] - e[1], i = t[2] - e[2], a = t[3] - e[3];
        return Math.sqrt(n * n + r * r + i * i + a * a);
    }
    function du(e, t) {
        var n = t[0] - e[0], r = t[1] - e[1], i = t[2] - e[2], a = t[3] - e[3];
        return n * n + r * r + i * i + a * a;
    }
    function pu(e) {
        var t = e[0], n = e[1], r = e[2], i = e[3];
        return Math.sqrt(t * t + n * n + r * r + i * i);
    }
    function vu(e) {
        var t = e[0], n = e[1], r = e[2], i = e[3];
        return t * t + n * n + r * r + i * i;
    }
    function mu(e, t) {
        var n = t[0], r = t[1], i = t[2], a = t[3], o = n * n + r * r + i * i + a * a;
        return 0 < o && (o = 1 / Math.sqrt(o), e[0] = n * o, e[1] = r * o, e[2] = i * o, 
        e[3] = a * o), e;
    }
    function gu(e, t) {
        return e[0] * t[0] + e[1] * t[1] + e[2] * t[2] + e[3] * t[3];
    }
    function _u(e, t, n, r) {
        var i = t[0], a = t[1], o = t[2], s = t[3];
        return e[0] = i + r * (n[0] - i), e[1] = a + r * (n[1] - a), e[2] = o + r * (n[2] - o), 
        e[3] = s + r * (n[3] - s), e;
    }
    function xu(e, t) {
        return e[0] === t[0] && e[1] === t[1] && e[2] === t[2] && e[3] === t[3];
    }
    function bu(e, t) {
        var n = e[0], r = e[1], i = e[2], a = e[3], o = t[0], s = t[1], u = t[2], f = t[3];
        return Math.abs(n - o) <= Zo * Math.max(1, Math.abs(n), Math.abs(o)) && Math.abs(r - s) <= Zo * Math.max(1, Math.abs(r), Math.abs(s)) && Math.abs(i - u) <= Zo * Math.max(1, Math.abs(i), Math.abs(u)) && Math.abs(a - f) <= Zo * Math.max(1, Math.abs(a), Math.abs(f));
    }
    var yu, Au = uu, Tu = fu, Eu = cu, Mu = hu, Su = du, wu = pu, Ru = vu, Ou = (yu = nu(), 
    function(e, t, n, r, i, a) {
        var o = void 0, s = void 0;
        for (t = t || 4, n = n || 0, s = r ? Math.min(r * t + n, e.length) : e.length, o = n; o < s; o += t) yu[0] = e[o], 
        yu[1] = e[o + 1], yu[2] = e[o + 2], yu[3] = e[o + 3], i(yu, yu, a), e[o] = yu[0], 
        e[o + 1] = yu[1], e[o + 2] = yu[2], e[o + 3] = yu[3];
        return e;
    }), Cu = Object.freeze({
        __proto__: null,
        create: nu,
        clone: ru,
        fromValues: iu,
        copy: au,
        set: ou,
        add: su,
        subtract: uu,
        multiply: fu,
        divide: cu,
        ceil: function(e, t) {
            return e[0] = Math.ceil(t[0]), e[1] = Math.ceil(t[1]), e[2] = Math.ceil(t[2]), e[3] = Math.ceil(t[3]), 
            e;
        },
        floor: function(e, t) {
            return e[0] = Math.floor(t[0]), e[1] = Math.floor(t[1]), e[2] = Math.floor(t[2]), 
            e[3] = Math.floor(t[3]), e;
        },
        min: function(e, t, n) {
            return e[0] = Math.min(t[0], n[0]), e[1] = Math.min(t[1], n[1]), e[2] = Math.min(t[2], n[2]), 
            e[3] = Math.min(t[3], n[3]), e;
        },
        max: function(e, t, n) {
            return e[0] = Math.max(t[0], n[0]), e[1] = Math.max(t[1], n[1]), e[2] = Math.max(t[2], n[2]), 
            e[3] = Math.max(t[3], n[3]), e;
        },
        round: function(e, t) {
            return e[0] = Math.round(t[0]), e[1] = Math.round(t[1]), e[2] = Math.round(t[2]), 
            e[3] = Math.round(t[3]), e;
        },
        scale: lu,
        scaleAndAdd: function(e, t, n, r) {
            return e[0] = t[0] + n[0] * r, e[1] = t[1] + n[1] * r, e[2] = t[2] + n[2] * r, e[3] = t[3] + n[3] * r, 
            e;
        },
        distance: hu,
        squaredDistance: du,
        length: pu,
        squaredLength: vu,
        negate: function(e, t) {
            return e[0] = -t[0], e[1] = -t[1], e[2] = -t[2], e[3] = -t[3], e;
        },
        inverse: function(e, t) {
            return e[0] = 1 / t[0], e[1] = 1 / t[1], e[2] = 1 / t[2], e[3] = 1 / t[3], e;
        },
        normalize: mu,
        dot: gu,
        lerp: _u,
        random: function(e, t) {
            var n, r, i, a, o, s;
            for (t = t || 1; 1 <= (o = (n = 2 * es() - 1) * n + (r = 2 * es() - 1) * r); ) ;
            for (;1 <= (s = (i = 2 * es() - 1) * i + (a = 2 * es() - 1) * a); ) ;
            var u = Math.sqrt((1 - o) / s);
            return e[0] = t * n, e[1] = t * r, e[2] = t * i * u, e[3] = t * a * u, e;
        },
        transformMat4: function(e, t, n) {
            var r = t[0], i = t[1], a = t[2], o = t[3];
            return e[0] = n[0] * r + n[4] * i + n[8] * a + n[12] * o, e[1] = n[1] * r + n[5] * i + n[9] * a + n[13] * o, 
            e[2] = n[2] * r + n[6] * i + n[10] * a + n[14] * o, e[3] = n[3] * r + n[7] * i + n[11] * a + n[15] * o, 
            e;
        },
        transformQuat: function(e, t, n) {
            var r = t[0], i = t[1], a = t[2], o = n[0], s = n[1], u = n[2], f = n[3], c = f * r + s * a - u * i, l = f * i + u * r - o * a, h = f * a + o * i - s * r, d = -o * r - s * i - u * a;
            return e[0] = c * f + d * -o + l * -u - h * -s, e[1] = l * f + d * -s + h * -o - c * -u, 
            e[2] = h * f + d * -u + c * -s - l * -o, e[3] = t[3], e;
        },
        str: function(e) {
            return "vec4(" + e[0] + ", " + e[1] + ", " + e[2] + ", " + e[3] + ")";
        },
        exactEquals: xu,
        equals: bu,
        sub: Au,
        mul: Tu,
        div: Eu,
        dist: Mu,
        sqrDist: Su,
        len: wu,
        sqrLen: Ru,
        forEach: Ou
    });
    function Bu() {
        var e = new $o(4);
        return $o != Float32Array && (e[0] = 0, e[1] = 0, e[2] = 0), e[3] = 1, e;
    }
    function Fu(e, t, n) {
        n *= .5;
        var r = Math.sin(n);
        return e[0] = r * t[0], e[1] = r * t[1], e[2] = r * t[2], e[3] = Math.cos(n), e;
    }
    function Pu(e, t, n) {
        var r = t[0], i = t[1], a = t[2], o = t[3], s = n[0], u = n[1], f = n[2], c = n[3];
        return e[0] = r * c + o * s + i * f - a * u, e[1] = i * c + o * u + a * s - r * f, 
        e[2] = a * c + o * f + r * u - i * s, e[3] = o * c - r * s - i * u - a * f, e;
    }
    function Iu(e, t, n) {
        n *= .5;
        var r = t[0], i = t[1], a = t[2], o = t[3], s = Math.sin(n), u = Math.cos(n);
        return e[0] = r * u + o * s, e[1] = i * u + a * s, e[2] = a * u - i * s, e[3] = o * u - r * s, 
        e;
    }
    function Du(e, t, n) {
        n *= .5;
        var r = t[0], i = t[1], a = t[2], o = t[3], s = Math.sin(n), u = Math.cos(n);
        return e[0] = r * u - a * s, e[1] = i * u + o * s, e[2] = a * u + r * s, e[3] = o * u - i * s, 
        e;
    }
    function Nu(e, t, n) {
        n *= .5;
        var r = t[0], i = t[1], a = t[2], o = t[3], s = Math.sin(n), u = Math.cos(n);
        return e[0] = r * u + i * s, e[1] = i * u - r * s, e[2] = a * u + o * s, e[3] = o * u - a * s, 
        e;
    }
    function Lu(e, t, n, r) {
        var i = t[0], a = t[1], o = t[2], s = t[3], u = n[0], f = n[1], c = n[2], l = n[3], h = void 0, d = void 0, p = void 0, v = void 0, m = void 0;
        return (d = i * u + a * f + o * c + s * l) < 0 && (d = -d, u = -u, f = -f, c = -c, 
        l = -l), m = Zo < 1 - d ? (h = Math.acos(d), p = Math.sin(h), v = Math.sin((1 - r) * h) / p, 
        Math.sin(r * h) / p) : (v = 1 - r, r), e[0] = v * i + m * u, e[1] = v * a + m * f, 
        e[2] = v * o + m * c, e[3] = v * s + m * l, e;
    }
    function Uu(e, t) {
        var n = t[0] + t[4] + t[8], r = void 0;
        if (0 < n) r = Math.sqrt(n + 1), e[3] = .5 * r, r = .5 / r, e[0] = (t[5] - t[7]) * r, 
        e[1] = (t[6] - t[2]) * r, e[2] = (t[1] - t[3]) * r; else {
            var i = 0;
            t[4] > t[0] && (i = 1), t[8] > t[3 * i + i] && (i = 2);
            var a = (i + 1) % 3, o = (i + 2) % 3;
            r = Math.sqrt(t[3 * i + i] - t[3 * a + a] - t[3 * o + o] + 1), e[i] = .5 * r, r = .5 / r, 
            e[3] = (t[3 * a + o] - t[3 * o + a]) * r, e[a] = (t[3 * a + i] + t[3 * i + a]) * r, 
            e[o] = (t[3 * o + i] + t[3 * i + o]) * r;
        }
        return e;
    }
    var qu, zu, Gu, Hu, Vu, ku, ju = ru, Wu = iu, Xu = au, Yu = ou, Ku = su, Ju = Pu, Qu = lu, Zu = gu, $u = _u, ef = pu, tf = ef, nf = vu, rf = nf, af = mu, of = xu, sf = bu, uf = (qu = Bs(), 
    zu = Ps(1, 0, 0), Gu = Ps(0, 1, 0), function(e, t, n) {
        var r = Vs(t, n);
        return r < -.999999 ? (ks(qu, zu, t), Zs(qu) < 1e-6 && ks(qu, Gu, t), Hs(qu, qu), 
        Fu(e, qu, Math.PI), e) : .999999 < r ? (e[0] = 0, e[1] = 0, e[2] = 0, e[3] = 1, 
        e) : (ks(qu, t, n), e[0] = qu[0], e[1] = qu[1], e[2] = qu[2], e[3] = 1 + r, af(e, e));
    }), ff = (Hu = Bu(), Vu = Bu(), function(e, t, n, r, i, a) {
        return Lu(Hu, t, i, a), Lu(Vu, n, r, a), Lu(e, Hu, Vu, 2 * a * (1 - a)), e;
    }), cf = (ku = ds(), function(e, t, n, r) {
        return ku[0] = n[0], ku[3] = n[1], ku[6] = n[2], ku[1] = r[0], ku[4] = r[1], ku[7] = r[2], 
        ku[2] = -t[0], ku[5] = -t[1], ku[8] = -t[2], af(e, Uu(e, ku));
    }), lf = Object.freeze({
        __proto__: null,
        create: Bu,
        identity: function(e) {
            return e[0] = 0, e[1] = 0, e[2] = 0, e[3] = 1, e;
        },
        setAxisAngle: Fu,
        getAxisAngle: function(e, t) {
            var n = 2 * Math.acos(t[3]), r = Math.sin(n / 2);
            return Zo < r ? (e[0] = t[0] / r, e[1] = t[1] / r, e[2] = t[2] / r) : (e[0] = 1, 
            e[1] = 0, e[2] = 0), n;
        },
        multiply: Pu,
        rotateX: Iu,
        rotateY: Du,
        rotateZ: Nu,
        calculateW: function(e, t) {
            var n = t[0], r = t[1], i = t[2];
            return e[0] = n, e[1] = r, e[2] = i, e[3] = Math.sqrt(Math.abs(1 - n * n - r * r - i * i)), 
            e;
        },
        slerp: Lu,
        random: function(e) {
            var t = es(), n = es(), r = es(), i = Math.sqrt(1 - t), a = Math.sqrt(t);
            return e[0] = i * Math.sin(2 * Math.PI * n), e[1] = i * Math.cos(2 * Math.PI * n), 
            e[2] = a * Math.sin(2 * Math.PI * r), e[3] = a * Math.cos(2 * Math.PI * r), e;
        },
        invert: function(e, t) {
            var n = t[0], r = t[1], i = t[2], a = t[3], o = n * n + r * r + i * i + a * a, s = o ? 1 / o : 0;
            return e[0] = -n * s, e[1] = -r * s, e[2] = -i * s, e[3] = a * s, e;
        },
        conjugate: function(e, t) {
            return e[0] = -t[0], e[1] = -t[1], e[2] = -t[2], e[3] = t[3], e;
        },
        fromMat3: Uu,
        fromEuler: function(e, t, n, r) {
            var i = .5 * Math.PI / 180;
            t *= i, n *= i, r *= i;
            var a = Math.sin(t), o = Math.cos(t), s = Math.sin(n), u = Math.cos(n), f = Math.sin(r), c = Math.cos(r);
            return e[0] = a * u * c - o * s * f, e[1] = o * s * c + a * u * f, e[2] = o * u * f - a * s * c, 
            e[3] = o * u * c + a * s * f, e;
        },
        str: function(e) {
            return "quat(" + e[0] + ", " + e[1] + ", " + e[2] + ", " + e[3] + ")";
        },
        clone: ju,
        fromValues: Wu,
        copy: Xu,
        set: Yu,
        add: Ku,
        mul: Ju,
        scale: Qu,
        dot: Zu,
        lerp: $u,
        length: ef,
        len: tf,
        squaredLength: nf,
        sqrLen: rf,
        normalize: af,
        exactEquals: of,
        equals: sf,
        rotationTo: uf,
        sqlerp: ff,
        setAxes: cf
    });
    function hf(e, t, n) {
        var r = .5 * n[0], i = .5 * n[1], a = .5 * n[2], o = t[0], s = t[1], u = t[2], f = t[3];
        return e[0] = o, e[1] = s, e[2] = u, e[3] = f, e[4] = r * f + i * u - a * s, e[5] = i * f + a * o - r * u, 
        e[6] = a * f + r * s - i * o, e[7] = -r * o - i * s - a * u, e;
    }
    function df(e, t) {
        return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], e[4] = t[4], e[5] = t[5], 
        e[6] = t[6], e[7] = t[7], e;
    }
    var pf = Xu;
    var vf = Xu;
    function mf(e, t, n) {
        var r = t[0], i = t[1], a = t[2], o = t[3], s = n[4], u = n[5], f = n[6], c = n[7], l = t[4], h = t[5], d = t[6], p = t[7], v = n[0], m = n[1], g = n[2], _ = n[3];
        return e[0] = r * _ + o * v + i * g - a * m, e[1] = i * _ + o * m + a * v - r * g, 
        e[2] = a * _ + o * g + r * m - i * v, e[3] = o * _ - r * v - i * m - a * g, e[4] = r * c + o * s + i * f - a * u + l * _ + p * v + h * g - d * m, 
        e[5] = i * c + o * u + a * s - r * f + h * _ + p * m + d * v - l * g, e[6] = a * c + o * f + r * u - i * s + d * _ + p * g + l * m - h * v, 
        e[7] = o * c - r * s - i * u - a * f + p * _ - l * v - h * m - d * g, e;
    }
    var gf = mf;
    var _f = Zu;
    var xf = ef, bf = nf, yf = bf;
    var Af = Object.freeze({
        __proto__: null,
        create: function() {
            var e = new $o(8);
            return $o != Float32Array && (e[0] = 0, e[1] = 0, e[2] = 0, e[4] = 0, e[5] = 0, 
            e[6] = 0, e[7] = 0), e[3] = 1, e;
        },
        clone: function(e) {
            var t = new $o(8);
            return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[3], t[4] = e[4], t[5] = e[5], 
            t[6] = e[6], t[7] = e[7], t;
        },
        fromValues: function(e, t, n, r, i, a, o, s) {
            var u = new $o(8);
            return u[0] = e, u[1] = t, u[2] = n, u[3] = r, u[4] = i, u[5] = a, u[6] = o, u[7] = s, 
            u;
        },
        fromRotationTranslationValues: function(e, t, n, r, i, a, o) {
            var s = new $o(8);
            s[0] = e, s[1] = t, s[2] = n, s[3] = r;
            var u = .5 * i, f = .5 * a, c = .5 * o;
            return s[4] = u * r + f * n - c * t, s[5] = f * r + c * e - u * n, s[6] = c * r + u * t - f * e, 
            s[7] = -u * e - f * t - c * n, s;
        },
        fromRotationTranslation: hf,
        fromTranslation: function(e, t) {
            return e[0] = 0, e[1] = 0, e[2] = 0, e[3] = 1, e[4] = .5 * t[0], e[5] = .5 * t[1], 
            e[6] = .5 * t[2], e[7] = 0, e;
        },
        fromRotation: function(e, t) {
            return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], e[4] = 0, e[5] = 0, e[6] = 0, 
            e[7] = 0, e;
        },
        fromMat4: function(e, t) {
            var n = Bu();
            Ss(n, t);
            var r = new $o(3);
            return Ms(r, t), hf(e, n, r), e;
        },
        copy: df,
        identity: function(e) {
            return e[0] = 0, e[1] = 0, e[2] = 0, e[3] = 1, e[4] = 0, e[5] = 0, e[6] = 0, e[7] = 0, 
            e;
        },
        set: function(e, t, n, r, i, a, o, s, u) {
            return e[0] = t, e[1] = n, e[2] = r, e[3] = i, e[4] = a, e[5] = o, e[6] = s, e[7] = u, 
            e;
        },
        getReal: pf,
        getDual: function(e, t) {
            return e[0] = t[4], e[1] = t[5], e[2] = t[6], e[3] = t[7], e;
        },
        setReal: vf,
        setDual: function(e, t) {
            return e[4] = t[0], e[5] = t[1], e[6] = t[2], e[7] = t[3], e;
        },
        getTranslation: function(e, t) {
            var n = t[4], r = t[5], i = t[6], a = t[7], o = -t[0], s = -t[1], u = -t[2], f = t[3];
            return e[0] = 2 * (n * f + a * o + r * u - i * s), e[1] = 2 * (r * f + a * s + i * o - n * u), 
            e[2] = 2 * (i * f + a * u + n * s - r * o), e;
        },
        translate: function(e, t, n) {
            var r = t[0], i = t[1], a = t[2], o = t[3], s = .5 * n[0], u = .5 * n[1], f = .5 * n[2], c = t[4], l = t[5], h = t[6], d = t[7];
            return e[0] = r, e[1] = i, e[2] = a, e[3] = o, e[4] = o * s + i * f - a * u + c, 
            e[5] = o * u + a * s - r * f + l, e[6] = o * f + r * u - i * s + h, e[7] = -r * s - i * u - a * f + d, 
            e;
        },
        rotateX: function(e, t, n) {
            var r = -t[0], i = -t[1], a = -t[2], o = t[3], s = t[4], u = t[5], f = t[6], c = t[7], l = s * o + c * r + u * a - f * i, h = u * o + c * i + f * r - s * a, d = f * o + c * a + s * i - u * r, p = c * o - s * r - u * i - f * a;
            return Iu(e, t, n), r = e[0], i = e[1], a = e[2], o = e[3], e[4] = l * o + p * r + h * a - d * i, 
            e[5] = h * o + p * i + d * r - l * a, e[6] = d * o + p * a + l * i - h * r, e[7] = p * o - l * r - h * i - d * a, 
            e;
        },
        rotateY: function(e, t, n) {
            var r = -t[0], i = -t[1], a = -t[2], o = t[3], s = t[4], u = t[5], f = t[6], c = t[7], l = s * o + c * r + u * a - f * i, h = u * o + c * i + f * r - s * a, d = f * o + c * a + s * i - u * r, p = c * o - s * r - u * i - f * a;
            return Du(e, t, n), r = e[0], i = e[1], a = e[2], o = e[3], e[4] = l * o + p * r + h * a - d * i, 
            e[5] = h * o + p * i + d * r - l * a, e[6] = d * o + p * a + l * i - h * r, e[7] = p * o - l * r - h * i - d * a, 
            e;
        },
        rotateZ: function(e, t, n) {
            var r = -t[0], i = -t[1], a = -t[2], o = t[3], s = t[4], u = t[5], f = t[6], c = t[7], l = s * o + c * r + u * a - f * i, h = u * o + c * i + f * r - s * a, d = f * o + c * a + s * i - u * r, p = c * o - s * r - u * i - f * a;
            return Nu(e, t, n), r = e[0], i = e[1], a = e[2], o = e[3], e[4] = l * o + p * r + h * a - d * i, 
            e[5] = h * o + p * i + d * r - l * a, e[6] = d * o + p * a + l * i - h * r, e[7] = p * o - l * r - h * i - d * a, 
            e;
        },
        rotateByQuatAppend: function(e, t, n) {
            var r = n[0], i = n[1], a = n[2], o = n[3], s = t[0], u = t[1], f = t[2], c = t[3];
            return e[0] = s * o + c * r + u * a - f * i, e[1] = u * o + c * i + f * r - s * a, 
            e[2] = f * o + c * a + s * i - u * r, e[3] = c * o - s * r - u * i - f * a, s = t[4], 
            u = t[5], f = t[6], c = t[7], e[4] = s * o + c * r + u * a - f * i, e[5] = u * o + c * i + f * r - s * a, 
            e[6] = f * o + c * a + s * i - u * r, e[7] = c * o - s * r - u * i - f * a, e;
        },
        rotateByQuatPrepend: function(e, t, n) {
            var r = t[0], i = t[1], a = t[2], o = t[3], s = n[0], u = n[1], f = n[2], c = n[3];
            return e[0] = r * c + o * s + i * f - a * u, e[1] = i * c + o * u + a * s - r * f, 
            e[2] = a * c + o * f + r * u - i * s, e[3] = o * c - r * s - i * u - a * f, s = n[4], 
            u = n[5], f = n[6], c = n[7], e[4] = r * c + o * s + i * f - a * u, e[5] = i * c + o * u + a * s - r * f, 
            e[6] = a * c + o * f + r * u - i * s, e[7] = o * c - r * s - i * u - a * f, e;
        },
        rotateAroundAxis: function(e, t, n, r) {
            if (Math.abs(r) < Zo) return df(e, t);
            var i = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
            r *= .5;
            var a = Math.sin(r), o = a * n[0] / i, s = a * n[1] / i, u = a * n[2] / i, f = Math.cos(r), c = t[0], l = t[1], h = t[2], d = t[3];
            e[0] = c * f + d * o + l * u - h * s, e[1] = l * f + d * s + h * o - c * u, e[2] = h * f + d * u + c * s - l * o, 
            e[3] = d * f - c * o - l * s - h * u;
            var p = t[4], v = t[5], m = t[6], g = t[7];
            return e[4] = p * f + g * o + v * u - m * s, e[5] = v * f + g * s + m * o - p * u, 
            e[6] = m * f + g * u + p * s - v * o, e[7] = g * f - p * o - v * s - m * u, e;
        },
        add: function(e, t, n) {
            return e[0] = t[0] + n[0], e[1] = t[1] + n[1], e[2] = t[2] + n[2], e[3] = t[3] + n[3], 
            e[4] = t[4] + n[4], e[5] = t[5] + n[5], e[6] = t[6] + n[6], e[7] = t[7] + n[7], 
            e;
        },
        multiply: mf,
        mul: gf,
        scale: function(e, t, n) {
            return e[0] = t[0] * n, e[1] = t[1] * n, e[2] = t[2] * n, e[3] = t[3] * n, e[4] = t[4] * n, 
            e[5] = t[5] * n, e[6] = t[6] * n, e[7] = t[7] * n, e;
        },
        dot: _f,
        lerp: function(e, t, n, r) {
            var i = 1 - r;
            return _f(t, n) < 0 && (r = -r), e[0] = t[0] * i + n[0] * r, e[1] = t[1] * i + n[1] * r, 
            e[2] = t[2] * i + n[2] * r, e[3] = t[3] * i + n[3] * r, e[4] = t[4] * i + n[4] * r, 
            e[5] = t[5] * i + n[5] * r, e[6] = t[6] * i + n[6] * r, e[7] = t[7] * i + n[7] * r, 
            e;
        },
        invert: function(e, t) {
            var n = bf(t);
            return e[0] = -t[0] / n, e[1] = -t[1] / n, e[2] = -t[2] / n, e[3] = t[3] / n, e[4] = -t[4] / n, 
            e[5] = -t[5] / n, e[6] = -t[6] / n, e[7] = t[7] / n, e;
        },
        conjugate: function(e, t) {
            return e[0] = -t[0], e[1] = -t[1], e[2] = -t[2], e[3] = t[3], e[4] = -t[4], e[5] = -t[5], 
            e[6] = -t[6], e[7] = t[7], e;
        },
        length: ef,
        len: xf,
        squaredLength: bf,
        sqrLen: yf,
        normalize: function(e, t) {
            var n = bf(t);
            if (0 < n) {
                n = Math.sqrt(n);
                var r = t[0] / n, i = t[1] / n, a = t[2] / n, o = t[3] / n, s = t[4], u = t[5], f = t[6], c = t[7], l = r * s + i * u + a * f + o * c;
                e[0] = r, e[1] = i, e[2] = a, e[3] = o, e[4] = (s - r * l) / n, e[5] = (u - i * l) / n, 
                e[6] = (f - a * l) / n, e[7] = (c - o * l) / n;
            }
            return e;
        },
        str: function(e) {
            return "quat2(" + e[0] + ", " + e[1] + ", " + e[2] + ", " + e[3] + ", " + e[4] + ", " + e[5] + ", " + e[6] + ", " + e[7] + ")";
        },
        exactEquals: function(e, t) {
            return e[0] === t[0] && e[1] === t[1] && e[2] === t[2] && e[3] === t[3] && e[4] === t[4] && e[5] === t[5] && e[6] === t[6] && e[7] === t[7];
        },
        equals: function(e, t) {
            var n = e[0], r = e[1], i = e[2], a = e[3], o = e[4], s = e[5], u = e[6], f = e[7], c = t[0], l = t[1], h = t[2], d = t[3], p = t[4], v = t[5], m = t[6], g = t[7];
            return Math.abs(n - c) <= Zo * Math.max(1, Math.abs(n), Math.abs(c)) && Math.abs(r - l) <= Zo * Math.max(1, Math.abs(r), Math.abs(l)) && Math.abs(i - h) <= Zo * Math.max(1, Math.abs(i), Math.abs(h)) && Math.abs(a - d) <= Zo * Math.max(1, Math.abs(a), Math.abs(d)) && Math.abs(o - p) <= Zo * Math.max(1, Math.abs(o), Math.abs(p)) && Math.abs(s - v) <= Zo * Math.max(1, Math.abs(s), Math.abs(v)) && Math.abs(u - m) <= Zo * Math.max(1, Math.abs(u), Math.abs(m)) && Math.abs(f - g) <= Zo * Math.max(1, Math.abs(f), Math.abs(g));
        }
    });
    function Tf() {
        var e = new $o(2);
        return $o != Float32Array && (e[0] = 0, e[1] = 0), e;
    }
    function Ef(e, t, n) {
        return e[0] = t, e[1] = n, e;
    }
    function Mf(e, t, n) {
        return e[0] = t[0] - n[0], e[1] = t[1] - n[1], e;
    }
    function Sf(e, t, n) {
        return e[0] = t[0] * n[0], e[1] = t[1] * n[1], e;
    }
    function wf(e, t, n) {
        return e[0] = t[0] / n[0], e[1] = t[1] / n[1], e;
    }
    function Rf(e, t) {
        var n = t[0] - e[0], r = t[1] - e[1];
        return Math.sqrt(n * n + r * r);
    }
    function Of(e, t) {
        var n = t[0] - e[0], r = t[1] - e[1];
        return n * n + r * r;
    }
    function Cf(e) {
        var t = e[0], n = e[1];
        return Math.sqrt(t * t + n * n);
    }
    function Bf(e) {
        var t = e[0], n = e[1];
        return t * t + n * n;
    }
    function Ff(e, t) {
        if (e === t) return !0;
        if (e && t && "object" == typeof e && "object" == typeof t) {
            var n, r, i, a = Vf(e), o = Vf(t);
            if (a && o) {
                if ((r = e.length) != t.length) return !1;
                for (n = r; 0 != n--; ) if (!Ff(e[n], t[n])) return !1;
                return !0;
            }
            if (a != o) return !1;
            var s = e instanceof Date, u = t instanceof Date;
            if (s != u) return !1;
            if (s && u) return e.getTime() == t.getTime();
            var f = e instanceof RegExp, c = t instanceof RegExp;
            if (f != c) return !1;
            if (f && c) return e.toString() == t.toString();
            var l = kf(e);
            if ((r = l.length) !== kf(t).length) return !1;
            for (n = r; 0 != n--; ) if (!jf.call(t, l[n])) return !1;
            for (n = r; 0 != n--; ) if (!Ff(e[i = l[n]], t[i])) return !1;
            return !0;
        }
        return e != e && t != t;
    }
    var Pf, If = Cf, Df = Mf, Nf = Sf, Lf = wf, Uf = Rf, qf = Of, zf = Bf, Gf = (Pf = Tf(), 
    function(e, t, n, r, i, a) {
        var o = void 0, s = void 0;
        for (t = t || 2, n = n || 0, s = r ? Math.min(r * t + n, e.length) : e.length, o = n; o < s; o += t) Pf[0] = e[o], 
        Pf[1] = e[o + 1], i(Pf, Pf, a), e[o] = Pf[0], e[o + 1] = Pf[1];
        return e;
    }), Hf = Object.freeze({
        __proto__: null,
        create: Tf,
        clone: function(e) {
            var t = new $o(2);
            return t[0] = e[0], t[1] = e[1], t;
        },
        fromValues: function(e, t) {
            var n = new $o(2);
            return n[0] = e, n[1] = t, n;
        },
        copy: function(e, t) {
            return e[0] = t[0], e[1] = t[1], e;
        },
        set: Ef,
        add: function(e, t, n) {
            return e[0] = t[0] + n[0], e[1] = t[1] + n[1], e;
        },
        subtract: Mf,
        multiply: Sf,
        divide: wf,
        ceil: function(e, t) {
            return e[0] = Math.ceil(t[0]), e[1] = Math.ceil(t[1]), e;
        },
        floor: function(e, t) {
            return e[0] = Math.floor(t[0]), e[1] = Math.floor(t[1]), e;
        },
        min: function(e, t, n) {
            return e[0] = Math.min(t[0], n[0]), e[1] = Math.min(t[1], n[1]), e;
        },
        max: function(e, t, n) {
            return e[0] = Math.max(t[0], n[0]), e[1] = Math.max(t[1], n[1]), e;
        },
        round: function(e, t) {
            return e[0] = Math.round(t[0]), e[1] = Math.round(t[1]), e;
        },
        scale: function(e, t, n) {
            return e[0] = t[0] * n, e[1] = t[1] * n, e;
        },
        scaleAndAdd: function(e, t, n, r) {
            return e[0] = t[0] + n[0] * r, e[1] = t[1] + n[1] * r, e;
        },
        distance: Rf,
        squaredDistance: Of,
        length: Cf,
        squaredLength: Bf,
        negate: function(e, t) {
            return e[0] = -t[0], e[1] = -t[1], e;
        },
        inverse: function(e, t) {
            return e[0] = 1 / t[0], e[1] = 1 / t[1], e;
        },
        normalize: function(e, t) {
            var n = t[0], r = t[1], i = n * n + r * r;
            return 0 < i && (i = 1 / Math.sqrt(i), e[0] = t[0] * i, e[1] = t[1] * i), e;
        },
        dot: function(e, t) {
            return e[0] * t[0] + e[1] * t[1];
        },
        cross: function(e, t, n) {
            var r = t[0] * n[1] - t[1] * n[0];
            return e[0] = e[1] = 0, e[2] = r, e;
        },
        lerp: function(e, t, n, r) {
            var i = t[0], a = t[1];
            return e[0] = i + r * (n[0] - i), e[1] = a + r * (n[1] - a), e;
        },
        random: function(e, t) {
            t = t || 1;
            var n = 2 * es() * Math.PI;
            return e[0] = Math.cos(n) * t, e[1] = Math.sin(n) * t, e;
        },
        transformMat2: function(e, t, n) {
            var r = t[0], i = t[1];
            return e[0] = n[0] * r + n[2] * i, e[1] = n[1] * r + n[3] * i, e;
        },
        transformMat2d: function(e, t, n) {
            var r = t[0], i = t[1];
            return e[0] = n[0] * r + n[2] * i + n[4], e[1] = n[1] * r + n[3] * i + n[5], e;
        },
        transformMat3: function(e, t, n) {
            var r = t[0], i = t[1];
            return e[0] = n[0] * r + n[3] * i + n[6], e[1] = n[1] * r + n[4] * i + n[7], e;
        },
        transformMat4: function(e, t, n) {
            var r = t[0], i = t[1];
            return e[0] = n[0] * r + n[4] * i + n[12], e[1] = n[1] * r + n[5] * i + n[13], e;
        },
        rotate: function(e, t, n, r) {
            var i = t[0] - n[0], a = t[1] - n[1], o = Math.sin(r), s = Math.cos(r);
            return e[0] = i * s - a * o + n[0], e[1] = i * o + a * s + n[1], e;
        },
        angle: function(e, t) {
            var n = e[0], r = e[1], i = t[0], a = t[1], o = n * n + r * r;
            0 < o && (o = 1 / Math.sqrt(o));
            var s = i * i + a * a;
            0 < s && (s = 1 / Math.sqrt(s));
            var u = (n * i + r * a) * o * s;
            return 1 < u ? 0 : u < -1 ? Math.PI : Math.acos(u);
        },
        str: function(e) {
            return "vec2(" + e[0] + ", " + e[1] + ")";
        },
        exactEquals: function(e, t) {
            return e[0] === t[0] && e[1] === t[1];
        },
        equals: function(e, t) {
            var n = e[0], r = e[1], i = t[0], a = t[1];
            return Math.abs(n - i) <= Zo * Math.max(1, Math.abs(n), Math.abs(i)) && Math.abs(r - a) <= Zo * Math.max(1, Math.abs(r), Math.abs(a));
        },
        len: If,
        sub: Df,
        mul: Nf,
        div: Lf,
        dist: Uf,
        sqrDist: qf,
        sqrLen: zf,
        forEach: Gf
    }), Vf = Array.isArray, kf = Object.keys, jf = Object.prototype.hasOwnProperty;
    function Wf(e) {
        for (var t = 1; t < arguments.length; t++) {
            var n = arguments[t];
            for (var r in n) e[r] = n[r];
        }
        return e;
    }
    function Xf(e) {
        for (var t = arguments.length, n = new Array(1 < t ? t - 1 : 0), r = 1; r < t; r++) n[r - 1] = arguments[r];
        for (var i = 0; i < n.length; i++) Wf(e, n[i]);
    }
    var Yf = (Kf.prototype.drawBuffersWEBGL = function() {
        return this.context.drawBuffers.apply(this.context, arguments);
    }, Kf);
    function Kf(e) {
        this.context = e, this.COLOR_ATTACHMENT0_WEBGL = 36064, this.COLOR_ATTACHMENT1_WEBGL = 36065, 
        this.COLOR_ATTACHMENT2_WEBGL = 36066, this.COLOR_ATTACHMENT3_WEBGL = 36067, this.COLOR_ATTACHMENT4_WEBGL = 36068, 
        this.COLOR_ATTACHMENT5_WEBGL = 36069, this.COLOR_ATTACHMENT6_WEBGL = 36070, this.COLOR_ATTACHMENT7_WEBGL = 36071, 
        this.COLOR_ATTACHMENT8_WEBGL = 36072, this.COLOR_ATTACHMENT9_WEBGL = 36073, this.COLOR_ATTACHMENT10_WEBGL = 577040, 
        this.COLOR_ATTACHMENT11_WEBGL = 577041, this.COLOR_ATTACHMENT12_WEBGL = 577042, 
        this.COLOR_ATTACHMENT13_WEBGL = 577043, this.COLOR_ATTACHMENT14_WEBGL = 577044, 
        this.COLOR_ATTACHMENT15_WEBGL = 577045, this.DRAW_BUFFER0_WEBGL = 34853, this.DRAW_BUFFER1_WEBGL = 34854, 
        this.DRAW_BUFFER2_WEBGL = 34855, this.DRAW_BUFFER3_WEBGL = 34856, this.DRAW_BUFFER4_WEBGL = 34857, 
        this.DRAW_BUFFER5_WEBGL = 34858, this.DRAW_BUFFER6_WEBGL = 34859, this.DRAW_BUFFER7_WEBGL = 34860, 
        this.DRAW_BUFFER8_WEBGL = 34861, this.DRAW_BUFFER9_WEBGL = 34862, this.DRAW_BUFFER10_WEBGL = 34863, 
        this.DRAW_BUFFER11_WEBGL = 34864, this.DRAW_BUFFER12_WEBGL = 34865, this.DRAW_BUFFER13_WEBGL = 34866, 
        this.DRAW_BUFFER14_WEBGL = 34867, this.DRAW_BUFFER15_WEBGL = 34868, this.MAX_COLOR_ATTACHMENTS_WEBGL = 36063, 
        this.MAX_DRAW_BUFFERS_WEBGL = 2178;
    }
    var Jf, Qf = ((Jf = Zf.prototype).createVertexArrayOES = function() {
        return this.context.createVertexArray();
    }, Jf.deleteVertexArrayOES = function() {
        return this.context.deleteVertexArray.apply(this.context, arguments);
    }, Jf.isVertexArrayOES = function() {
        return this.context.isVertexArray.apply(this.context, arguments);
    }, Jf.bindVertexArrayOES = function() {
        return this.context.bindVertexArray.apply(this.context, arguments);
    }, Zf);
    function Zf(e) {
        this.context = e, this.VERTEX_ARRAY_BINDING_OES = 34229;
    }
    var $f, ec = (($f = tc.prototype).drawArraysInstancedANGLE = function() {
        return this.context.drawArraysInstanced.apply(this.context, arguments);
    }, $f.drawElementsInstancedANGLE = function() {
        return this.context.drawElementsInstanced.apply(this.context, arguments);
    }, $f.vertexAttribDivisorANGLE = function() {
        return this.context.vertexAttribDivisor.apply(this.context, arguments);
    }, tc);
    function tc(e) {
        this.context = e, this.VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE = 35070;
    }
    var nc, rc, ic, ac = {
        webgl_depth_texture: {
            UNSIGNED_INT_24_8_WEBGL: 34042
        },
        oes_element_index_uint: {},
        oes_texture_float: {},
        oes_texture_half_float: {
            HALF_FLOAT_OES: 36193
        },
        ext_color_buffer_float: {},
        oes_standard_derivatives: {},
        ext_frag_depth: {},
        ext_blend_minmax: {
            MIN_EXT: 32775,
            MAX_EXT: 32776
        },
        ext_shader_texture_lod: {}
    }, oc = {
        has: function(e, t) {
            var n = e._, r = e.t;
            return !(!n && !r.getExtension(t)) && (t = t.toLowerCase(), n && ac[t] || "webgl_draw_buffers" === t || "oes_vertex_array_object" === t || "angle_instanced_arrays" === t);
        },
        mock: function(e, t) {
            return t = t.toLowerCase(), ac[t] ? e._ ? ("oes_texture_float" !== t && "oes_texture_half_float" !== t || e.t.getExtension("EXT_color_buffer_float"), 
            ac[t]) : this.t.getExtension(t) : "webgl_draw_buffers" === t ? new Yf(e) : "oes_vertex_array_object" === t ? new Qf(e) : "angle_instanced_arrays" === t ? new ec(e) : null;
        },
        getInternalFormat: function(e, t, n) {
            return 6402 === t ? 33190 : 34041 === t ? 35056 : 36193 === n && t === e.RGBA ? 34842 : 36193 === n && t === e.RGB ? 34843 : n === e.FLOAT && t === e.RGBA ? 34836 : n === e.FLOAT && t === e.RGB ? 34837 : t;
        },
        getTextureType: function(e, t) {
            return 36193 === t ? e.HALF_FLOAT : t;
        }
    }, sc = 1, uc = ((ic = fc.prototype).attachShader = function(e, t) {
        return this.t.attachShader(e, t);
    }, ic.shaderSource = function(e, t) {
        return this.t.shaderSource(e, t);
    }, ic.compileShader = function(e) {
        return this.t.compileShader(e);
    }, ic.createShader = function(e) {
        return this.t.createShader(e);
    }, ic.createProgram = function() {
        return this.t.createProgram();
    }, ic.deleteProgram = function(e) {
        return this.states.program === e && (this.states.program = null), this.t.deleteProgram(e);
    }, ic.deleteShader = function(e) {
        return this.t.deleteShader(e);
    }, ic.detachShader = function(e, t) {
        return this.t.detachShader(e, t);
    }, ic.getAttachedShaders = function(e) {
        return this.t.getAttachedShaders(e);
    }, ic.linkProgram = function(e) {
        return this.t.linkProgram(e);
    }, ic.getShaderParameter = function(e, t) {
        return this.t.getShaderParameter(e, t);
    }, ic.getShaderPrecisionFormat = function(e, t) {
        return this.t.getShaderPrecisionFormat(e, t);
    }, ic.getShaderInfoLog = function(e) {
        return this.t.getShaderInfoLog(e);
    }, ic.getShaderSource = function(e) {
        return this.t.getShaderSource(e);
    }, ic.getProgramInfoLog = function(e) {
        return this.t.getProgramInfoLog(e);
    }, ic.getProgramParameter = function(e, t) {
        return this.t.getProgramParameter(e, t);
    }, ic.getError = function() {
        return this.t.getError();
    }, ic.getContextAttributes = function() {
        return this.t.getContextAttributes();
    }, ic.getExtension = function(e) {
        return oc.has(this, e) ? oc.mock(this, e) : this.t.getExtension(e);
    }, ic.getSupportedExtensions = function() {
        return this.t.getSupportedExtensions();
    }, ic.getParameter = function(e) {
        return this.s(), this.t.getParameter(e);
    }, ic.isEnabled = function(e) {
        return this.t.isEnabled(e);
    }, ic.isProgram = function(e) {
        return this.t.isProgram(e);
    }, ic.isShader = function(e) {
        return this.t.isShader(e);
    }, ic.validateProgram = function(e) {
        return this.t.validateProgram(e);
    }, ic.clear = function(e) {
        return this.s(), this.t.clear(e);
    }, ic.drawArrays = function(e, t, n) {
        return this.s(), this.i(), this.t.drawArrays(e, t, n);
    }, ic.drawElements = function(e, t, n, r) {
        return this.s(), this.i(), this.t.drawElements(e, t, n, r);
    }, ic.drawBuffers = function(e) {
        return this.s(), this.i(), this._ ? this.t.drawBuffers(e) : this.buffersOES.drawBuffersWEBGL(e);
    }, ic.i = function() {
        this.t._fusiongl_drawCalls++;
    }, ic.resetDrawCalls = function() {
        this.t._fusiongl_drawCalls = 0;
    }, ic.getDrawCalls = function() {
        return this.t._fusiongl_drawCalls;
    }, ic.N = function() {
        for (var e = this.t, t = e.getParameter(e.CURRENT_PROGRAM), n = e.getProgramParameter(t, e.ACTIVE_ATTRIBUTES), r = [], i = 0; i < n; i++) r.push(e.getVertexAttrib(i, e.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING));
        this.I = {
            buffers: r,
            elements: e.getParameter(e.ELEMENT_ARRAY_BUFFER_BINDING),
            framebuffer: e.getParameter(e.FRAMEBUFFER_BINDING)
        }, window.DEBUGGING && (console.log(this.uid, this.I), console.log(this.uid, this.states.attributes), 
        console.log(this.states.attributes[0].buffer === this.I.buffers[0]), console.log(this.states.attributes[1].buffer === this.I.buffers[1]), 
        console.log(this.states.attributes[2].buffer === this.I.buffers[2]));
    }, ic.finish = function() {
        return this.t.finish();
    }, ic.flush = function() {
        return this.s(), this.t.flush();
    }, ic.commit = function() {
        return this.s(), this.t.commit();
    }, ic.isContextLost = function() {
        return this.t.isContextLost();
    }, n((nc = fc).prototype, [ {
        key: "canvas",
        get: function() {
            return this.t.canvas;
        }
    }, {
        key: "drawingBufferWidth",
        get: function() {
            return this.t.drawingBufferWidth;
        }
    }, {
        key: "drawingBufferHeight",
        get: function() {
            return this.t.drawingBufferHeight;
        }
    }, {
        key: "gl",
        get: function() {
            return this.t;
        }
    }, {
        key: "buffersOES",
        get: function() {
            return this.R || (this.R = this.t.getExtension("WEBGL_draw_buffers")), this.R;
        }
    }, {
        key: "vaoOES",
        get: function() {
            return this.T || (this.T = this.t.getExtension("OES_vertex_array_object")), this.T;
        }
    }, {
        key: "angleOES",
        get: function() {
            return this.A || (this.A = this.t.getExtension("ANGLE_instanced_arrays")), this.A;
        }
    } ]), rc && n(nc, rc), fc);
    function fc(e) {
        var r;
        this.uid = sc++, this.states = {
            scissor: [ 0, 0, (r = e).canvas.width, r.canvas.height ],
            viewport: [ 0, 0, r.canvas.width, r.canvas.height ],
            blendColor: [ 0, 0, 0, 0 ],
            blendEquationSeparate: [ r.FUNC_ADD, r.FUNC_ADD ],
            blendFuncSeparate: [ r.ONE, r.ZERO, r.ONE, r.ZERO ],
            clearColor: [ 0, 0, 0, 0 ],
            clearDepth: [ 1 ],
            clearStencil: [ 0 ],
            colorMask: [ !0, !0, !0, !0 ],
            cullFace: [ r.BACK ],
            depthFunc: [ r.LESS ],
            depthMask: [ !0 ],
            depthRange: [ 0, 1 ],
            capabilities: {
                3042: !1,
                2884: !1,
                2929: !1,
                3024: !1,
                32823: !1,
                32926: !1,
                32928: !1,
                3089: !1,
                2960: !1
            },
            frontFace: [ r.CCW ],
            hint: {
                33170: [ r.DONT_CARE ],
                35723: [ r.DONT_CARE ]
            },
            lineWidth: [ 1 ],
            pixelStorei: {
                3333: [ 4 ],
                3317: [ 4 ],
                37440: [ !1 ],
                37441: [ !1 ],
                37443: [ r.BROWSER_DEFAULT_WEBGL ]
            },
            polygonOffset: [ 0, 0 ],
            sampleCoverage: [ 1, !1 ],
            stencilFuncSeparate: {
                1028: [ r.ALWAYS, 0, 4294967295 ],
                1029: [ r.ALWAYS, 0, 4294967295 ]
            },
            stencilMaskSeparate: {
                1028: [ 4294967295 ],
                1029: [ 4294967295 ]
            },
            stencilOpSeparate: {
                1028: [ r.KEEP, r.KEEP, r.KEEP ],
                1029: [ r.KEEP, r.KEEP, r.KEEP ]
            },
            program: null,
            framebuffer: {
                36160: null,
                36008: null,
                36009: null
            },
            renderbuffer: {
                36161: null
            },
            textures: {
                active: -1,
                units: function() {
                    for (var e = [], t = r.getParameter(r.MAX_COMBINED_TEXTURE_IMAGE_UNITS), n = 0; n < t; n++) e.push({
                        3553: null,
                        34067: null
                    });
                    return e[-1] = {
                        3553: null,
                        34067: null
                    }, e;
                }()
            },
            attributes: {},
            arrayBuffer: null,
            elementArrayBuffer: null
        }, this.t = e, this.t._fusiongl_drawCalls = 0, this._ = typeof WebGL2RenderingContext && this.t instanceof WebGL2RenderingContext;
    }
    Xf(uc.prototype, {
        DEPTH_BUFFER_BIT: 256,
        STENCIL_BUFFER_BIT: 1024,
        COLOR_BUFFER_BIT: 16384,
        POINTS: 0,
        LINES: 1,
        LINE_LOOP: 2,
        LINE_STRIP: 3,
        TRIANGLES: 4,
        TRIANGLE_STRIP: 5,
        TRIANGLE_FAN: 6,
        ZERO: 0,
        ONE: 1,
        SRC_COLOR: 768,
        ONE_MINUS_SRC_COLOR: 769,
        SRC_ALPHA: 770,
        ONE_MINUS_SRC_ALPHA: 771,
        DST_ALPHA: 772,
        ONE_MINUS_DST_ALPHA: 773,
        DST_COLOR: 774,
        ONE_MINUS_DST_COLOR: 775,
        SRC_ALPHA_SATURATE: 776,
        CONSTANT_COLOR: 32769,
        ONE_MINUS_CONSTANT_COLOR: 32770,
        CONSTANT_ALPHA: 32771,
        ONE_MINUS_CONSTANT_ALPHA: 32772,
        FUNC_ADD: 32774,
        FUNC_SUBSTRACT: 32778,
        FUNC_REVERSE_SUBTRACT: 32779,
        BLEND_EQUATION: 32777,
        BLEND_EQUATION_RGB: 32777,
        BLEND_EQUATION_ALPHA: 34877,
        BLEND_DST_RGB: 32968,
        BLEND_SRC_RGB: 32969,
        BLEND_DST_ALPHA: 32970,
        BLEND_SRC_ALPHA: 32971,
        BLEND_COLOR: 32773,
        ARRAY_BUFFER_BINDING: 34964,
        ELEMENT_ARRAY_BUFFER_BINDING: 34965,
        LINE_WIDTH: 2849,
        ALIASED_POINT_SIZE_RANGE: 33901,
        ALIASED_LINE_WIDTH_RANGE: 33902,
        CULL_FACE_MODE: 2885,
        FRONT_FACE: 2886,
        DEPTH_RANGE: 2928,
        DEPTH_WRITEMASK: 2930,
        DEPTH_CLEAR_VALUE: 2931,
        DEPTH_FUNC: 2932,
        STENCIL_CLEAR_VALUE: 2961,
        STENCIL_FUNC: 2962,
        STENCIL_FAIL: 2964,
        STENCIL_PASS_DEPTH_FAIL: 2965,
        STENCIL_PASS_DEPTH_PASS: 2966,
        STENCIL_REF: 2967,
        STENCIL_VALUE_MASK: 2963,
        STENCIL_WRITEMASK: 2968,
        STENCIL_BACK_FUNC: 34816,
        STENCIL_BACK_FAIL: 34817,
        STENCIL_BACK_PASS_DEPTH_FAIL: 34818,
        STENCIL_BACK_PASS_DEPTH_PASS: 34819,
        STENCIL_BACK_REF: 36003,
        STENCIL_BACK_VALUE_MASK: 36004,
        STENCIL_BACK_WRITEMASK: 36005,
        VIEWPORT: 2978,
        SCISSOR_BOX: 3088,
        COLOR_CLEAR_VALUE: 3106,
        COLOR_WRITEMASK: 3107,
        UNPACK_ALIGNMENT: 3317,
        PACK_ALIGNMENT: 3333,
        MAX_TEXTURE_SIZE: 3379,
        MAX_VIEWPORT_DIMS: 3386,
        SUBPIXEL_BITS: 3408,
        RED_BITS: 3410,
        GREEN_BITS: 3411,
        BLUE_BITS: 3412,
        ALPHA_BITS: 3413,
        DEPTH_BITS: 3414,
        STENCIL_BITS: 3415,
        POLYGON_OFFSET_UNITS: 10752,
        POLYGON_OFFSET_FACTOR: 32824,
        TEXTURE_BINDING_2D: 32873,
        SAMPLE_BUFFERS: 32936,
        SAMPLES: 32937,
        SAMPLE_COVERAGE_VALUE: 32938,
        SAMPLE_COVERAGE_INVERT: 32939,
        COMPRESSED_TEXTURE_FORMATS: 34467,
        VENDOR: 7936,
        RENDERER: 7937,
        VERSION: 7938,
        IMPLEMENTATION_COLOR_READ_TYPE: 35738,
        IMPLEMENTATION_COLOR_READ_FORMAT: 35739,
        BROWSER_DEFAULT_WEBGL: 37444,
        STATIC_DRAW: 35044,
        STREAM_DRAW: 35040,
        DYNAMIC_DRAW: 35048,
        ARRAY_BUFFER: 34962,
        ELEMENT_ARRAY_BUFFER: 34963,
        BUFFER_SIZE: 34660,
        BUFFER_USAGE: 34661,
        CURRENT_VERTEX_ATTRIB: 34342,
        VERTEX_ATTRIB_ARRAY_ENABLED: 34338,
        VERTEX_ATTRIB_ARRAY_SIZE: 34339,
        VERTEX_ATTRIB_ARRAY_STRIDE: 34340,
        VERTEX_ATTRIB_ARRAY_TYPE: 34341,
        VERTEX_ATTRIB_ARRAY_NORMALIZED: 34922,
        VERTEX_ATTRIB_ARRAY_POINTER: 34373,
        VERTEX_ATTRIB_ARRAY_BUFFER_BINDING: 34975,
        CULL_FACE: 2884,
        FRONT: 1028,
        BACK: 1029,
        FRONT_AND_BACK: 1032,
        BLEND: 3042,
        DEPTH_TEST: 2929,
        DITHER: 3024,
        POLYGON_OFFSET_FILL: 32823,
        SAMPLE_ALPHA_TO_COVERAGE: 32926,
        SAMPLE_COVERAGE: 32928,
        SCISSOR_TEST: 3089,
        STENCIL_TEST: 2960,
        NO_ERROR: 0,
        INVALID_ENUM: 1280,
        INVALID_VALUE: 1281,
        INVALID_OPERATION: 1282,
        OUT_OF_MEMORY: 1285,
        CONTEXT_LOST_WEBGL: 37442,
        CW: 2304,
        CCW: 2305,
        DONT_CARE: 4352,
        FASTEST: 4353,
        NICEST: 4354,
        GENERATE_MIPMAP_HINT: 33170,
        BYTE: 5120,
        UNSIGNED_BYTE: 5121,
        SHORT: 5122,
        UNSIGNED_SHORT: 5123,
        INT: 5124,
        UNSIGNED_INT: 5125,
        FLOAT: 5126,
        DEPTH_COMPONENT: 6402,
        ALPHA: 6406,
        RGB: 6407,
        RGBA: 6408,
        LUMINANCE: 6409,
        LUMINANCE_ALPHA: 6410,
        UNSIGNED_SHORT_4_4_4_4: 32819,
        UNSIGNED_SHORT_5_5_5_1: 32820,
        UNSIGNED_SHORT_5_6_5: 33635,
        FRAGMENT_SHADER: 35632,
        VERTEX_SHADER: 35633,
        COMPILE_STATUS: 35713,
        DELETE_STATUS: 35712,
        LINK_STATUS: 35714,
        VALIDATE_STATUS: 35715,
        ATTACHED_SHADERS: 35717,
        ACTIVE_ATTRIBUTES: 35721,
        ACTIVE_UNIFORMS: 35718,
        MAX_VERTEX_ATTRIBS: 34921,
        MAX_VERTEX_UNIFORM_VECTORS: 36347,
        MAX_VARYING_VECTORS: 36348,
        MAX_COMBINED_TEXTURE_IMAGE_UNITS: 35661,
        MAX_VERTEX_TEXTURE_IMAGE_UNITS: 35660,
        MAX_TEXTURE_IMAGE_UNITS: 34930,
        MAX_FRAGMENT_UNIFORM_VECTORS: 36349,
        SHADER_TYPE: 35663,
        SHADING_LANGUAGE_VERSION: 35724,
        CURRENT_PROGRAM: 35725,
        NEVER: 512,
        ALWAYS: 519,
        LESS: 513,
        EQUAL: 514,
        LEQUAL: 515,
        GREATER: 516,
        GEQUAL: 518,
        NOTEQUAL: 517,
        KEEP: 7680,
        REPLACE: 7681,
        INCR: 7682,
        DECR: 7683,
        INVERT: 5386,
        INCR_WRAP: 34055,
        DECR_WRAP: 34056,
        NEAREST: 9728,
        LINEAR: 9729,
        NEAREST_MIPMAP_NEAREST: 9984,
        LINEAR_MIPMAP_NEAREST: 9985,
        NEAREST_MIPMAP_LINEAR: 9986,
        LINEAR_MIPMAP_LINEAR: 9987,
        TEXTURE_MAG_FILTER: 10240,
        TEXTURE_MIN_FILTER: 10241,
        TEXTURE_WRAP_S: 10242,
        TEXTURE_WRAP_T: 10243,
        TEXTURE_2D: 3553,
        TEXTURE: 5890,
        TEXTURE_CUBE_MAP: 34067,
        TEXTURE_BINDING_CUBE_MAP: 34068,
        TEXTURE_CUBE_MAP_POSITIVE_X: 34069,
        TEXTURE_CUBE_MAP_NEGATIVE_X: 34070,
        TEXTURE_CUBE_MAP_POSITIVE_Y: 34071,
        TEXTURE_CUBE_MAP_NEGATIVE_Y: 34072,
        TEXTURE_CUBE_MAP_POSITIVE_Z: 34073,
        TEXTURE_CUBE_MAP_NEGATIVE_Z: 34074,
        MAX_CUBE_MAP_TEXTURE_SIZE: 34076,
        TEXTURE0: 33984,
        TEXTURE1: 33985,
        TEXTURE2: 33986,
        TEXTURE3: 33987,
        TEXTURE4: 33988,
        TEXTURE5: 33989,
        TEXTURE6: 33990,
        TEXTURE7: 33991,
        TEXTURE8: 33992,
        TEXTURE9: 33993,
        TEXTURE10: 33994,
        TEXTURE11: 33995,
        TEXTURE12: 33996,
        TEXTURE13: 33997,
        TEXTURE14: 33998,
        TEXTURE15: 33999,
        TEXTURE16: 34e3,
        ACTIVE_TEXTURE: 34016,
        REPEAT: 10497,
        CLAMP_TO_EDGE: 33071,
        MIRRORED_REPEAT: 33648,
        TEXTURE_WIDTH: 4096,
        TEXTURE_HEIGHT: 4097,
        FLOAT_VEC2: 35664,
        FLOAT_VEC3: 35665,
        FLOAT_VEC4: 35666,
        INT_VEC2: 35667,
        INT_VEC3: 35668,
        INT_VEC4: 35669,
        BOOL: 35670,
        BOOL_VEC2: 35671,
        BOOL_VEC3: 35672,
        BOOL_VEC4: 35673,
        FLOAT_MAT2: 35674,
        FLOAT_MAT3: 35675,
        FLOAT_MAT4: 35676,
        SAMPLER_2D: 35678,
        SAMPLER_CUBE: 35680,
        LOW_FLOAT: 36336,
        MEDIUM_FLOAT: 36337,
        HIGH_FLOAT: 36338,
        LOW_INT: 36339,
        MEDIUM_INT: 36340,
        HIGH_INT: 36341,
        FRAMEBUFFER: 36160,
        RENDERBUFFER: 36161,
        RGBA4: 32854,
        RGB5_A1: 32855,
        RGB565: 36194,
        DEPTH_COMPONENT16: 33189,
        STENCIL_INDEX: 6401,
        STENCIL_INDEX8: 36168,
        DEPTH_STENCIL: 34041,
        RENDERBUFFER_WIDTH: 36162,
        RENDERBUFFER_HEIGHT: 36163,
        RENDERBUFFER_INTERNAL_FORMAT: 36164,
        RENDERBUFFER_RED_SIZE: 36176,
        RENDERBUFFER_GREEN_SIZE: 36177,
        RENDERBUFFER_BLUE_SIZE: 36178,
        RENDERBUFFER_ALPHA_SIZE: 36179,
        RENDERBUFFER_DEPTH_SIZE: 36180,
        RENDERBUFFER_STENCIL_SIZE: 36181,
        FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE: 36048,
        FRAMEBUFFER_ATTACHMENT_OBJECT_NAME: 36049,
        FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL: 36050,
        FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE: 36051,
        COLOR_ATTACHMENT0: 36064,
        DEPTH_ATTACHMENT: 36096,
        STENCIL_ATTACHMENT: 36128,
        DEPTH_STENCIL_ATTACHMENT: 33306,
        NONE: 0,
        FRAMEBUFFER_COMPLETE: 36053,
        FRAMEBUFFER_INCOMPLETE_ATTACHMENT: 36054,
        FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: 36055,
        FRAMEBUFFER_INCOMPLETE_DIMENSIONS: 36057,
        FRAMEBUFFER_UNSUPPORTED: 36061,
        FRAMEBUFFER_BINDING: 36006,
        RENDERBUFFER_BINDING: 36007,
        MAX_RENDERBUFFER_SIZE: 34024,
        INVALID_FRAMEBUFFER_OPERATION: 1286,
        UNPACK_FLIP_Y_WEBGL: 37440,
        UNPACK_PREMULTIPLY_ALPHA_WEBGL: 37441,
        UNPACK_COLORSPACE_CONVERSION_WEBGL: 37443,
        READ_BUFFER: 3074,
        UNPACK_ROW_LENGTH: 3314,
        UNPACK_SKIP_ROWS: 3315,
        UNPACK_SKIP_PIXELS: 3316,
        PACK_ROW_LENGTH: 3330,
        PACK_SKIP_ROWS: 3331,
        PACK_SKIP_PIXELS: 3332,
        UNPACK_SKIP_IMAGES: 32877,
        UNPACK_IMAGE_HEIGHT: 32878,
        MAX_3D_TEXTURE_SIZE: 32883,
        MAX_ELEMENTS_VERTICES: 33e3,
        MAX_ELEMENTS_INDICES: 33001,
        MAX_TEXTURE_LOD_BIAS: 34045,
        MAX_FRAGMENT_UNIFORM_COMPONENTS: 35657,
        MAX_VERTEX_UNIFORM_COMPONENTS: 35658,
        MAX_ARRAY_TEXTURE_LAYERS: 35071,
        MIN_PROGRAM_TEXEL_OFFSET: 35076,
        MAX_PROGRAM_TEXEL_OFFSET: 35077,
        MAX_VARYING_COMPONENTS: 35659,
        FRAGMENT_SHADER_DERIVATIVE_HINT: 35723,
        RASTERIZER_DISCARD: 35977,
        VERTEX_ARRAY_BINDING: 34229,
        MAX_VERTEX_OUTPUT_COMPONENTS: 37154,
        MAX_FRAGMENT_INPUT_COMPONENTS: 37157,
        MAX_SERVER_WAIT_TIMEOUT: 37137,
        MAX_ELEMENT_INDEX: 36203,
        RED: 6403,
        RGB8: 32849,
        RGBA8: 32856,
        RGB10_A2: 32857,
        TEXTURE_3D: 32879,
        TEXTURE_WRAP_R: 32882,
        TEXTURE_MIN_LOD: 33082,
        TEXTURE_MAX_LOD: 33083,
        TEXTURE_BASE_LEVEL: 33084,
        TEXTURE_MAX_LEVEL: 33085,
        TEXTURE_COMPARE_MODE: 34892,
        TEXTURE_COMPARE_FUNC: 34893,
        SRGB: 35904,
        SRGB8: 35905,
        SRGB8_ALPHA8: 35907,
        COMPARE_REF_TO_TEXTURE: 34894,
        RGBA32F: 34836,
        RGB32F: 34837,
        RGBA16F: 34842,
        RGB16F: 34843,
        TEXTURE_2D_ARRAY: 35866,
        TEXTURE_BINDING_2D_ARRAY: 35869,
        R11F_G11F_B10F: 35898,
        RGB9_E5: 35901,
        RGBA32UI: 36208,
        RGB32UI: 36209,
        RGBA16UI: 36214,
        RGB16UI: 36215,
        RGBA8UI: 36220,
        RGB8UI: 36221,
        RGBA32I: 36226,
        RGB32I: 36227,
        RGBA16I: 36232,
        RGB16I: 36233,
        RGBA8I: 36238,
        RGB8I: 36239,
        RED_INTEGER: 36244,
        RGB_INTEGER: 36248,
        RGBA_INTEGER: 36249,
        R8: 33321,
        RG8: 33323,
        R16F: 33325,
        R32F: 33326,
        RG16F: 33327,
        RG32F: 33328,
        R8I: 33329,
        R8UI: 33330,
        R16I: 33331,
        R16UI: 33332,
        R32I: 33333,
        R32UI: 33334,
        RG8I: 33335,
        RG8UI: 33336,
        RG16I: 33337,
        RG16UI: 33338,
        RG32I: 33339,
        RG32UI: 33340,
        R8_SNORM: 36756,
        RG8_SNORM: 36757,
        RGB8_SNORM: 36758,
        RGBA8_SNORM: 36759,
        RGB10_A2UI: 36975,
        TEXTURE_IMMUTABLE_FORMAT: 37167,
        TEXTURE_IMMUTABLE_LEVELS: 33503,
        UNSIGNED_INT_2_10_10_10_REV: 33640,
        UNSIGNED_INT_10F_11F_11F_REV: 35899,
        UNSIGNED_INT_5_9_9_9_REV: 35902,
        FLOAT_32_UNSIGNED_INT_24_8_REV: 36269,
        UNSIGNED_INT_24_8: 34042,
        HALF_FLOAT: 5131,
        RG: 33319,
        RG_INTEGER: 33320,
        INT_2_10_10_10_REV: 36255,
        CURRENT_QUERY: 34917,
        QUERY_RESULT: 34918,
        QUERY_RESULT_AVAILABLE: 34919,
        ANY_SAMPLES_PASSED: 35887,
        ANY_SAMPLES_PASSED_CONSERVATIVE: 36202,
        MAX_DRAW_BUFFERS: 34852,
        DRAW_BUFFER0: 34853,
        DRAW_BUFFER1: 34854,
        DRAW_BUFFER2: 34855,
        DRAW_BUFFER3: 34856,
        DRAW_BUFFER4: 34857,
        DRAW_BUFFER5: 34858,
        DRAW_BUFFER6: 34859,
        DRAW_BUFFER7: 34860,
        DRAW_BUFFER8: 34861,
        DRAW_BUFFER9: 34862,
        DRAW_BUFFER10: 34863,
        DRAW_BUFFER11: 34864,
        DRAW_BUFFER12: 34865,
        DRAW_BUFFER13: 34866,
        DRAW_BUFFER14: 34867,
        DRAW_BUFFER15: 34868,
        MAX_COLOR_ATTACHMENTS: 36063,
        COLOR_ATTACHMENT1: 36065,
        COLOR_ATTACHMENT2: 36066,
        COLOR_ATTACHMENT3: 36067,
        COLOR_ATTACHMENT4: 36068,
        COLOR_ATTACHMENT5: 36069,
        COLOR_ATTACHMENT6: 36070,
        COLOR_ATTACHMENT7: 36071,
        COLOR_ATTACHMENT8: 36072,
        COLOR_ATTACHMENT9: 36073,
        COLOR_ATTACHMENT10: 36074,
        COLOR_ATTACHMENT11: 36075,
        COLOR_ATTACHMENT12: 36076,
        COLOR_ATTACHMENT13: 36077,
        COLOR_ATTACHMENT14: 36078,
        COLOR_ATTACHMENT15: 36079,
        SAMPLER_3D: 35679,
        SAMPLER_2D_SHADOW: 35682,
        SAMPLER_2D_ARRAY: 36289,
        SAMPLER_2D_ARRAY_SHADOW: 36292,
        SAMPLER_CUBE_SHADOW: 36293,
        INT_SAMPLER_2D: 36298,
        INT_SAMPLER_3D: 36299,
        INT_SAMPLER_CUBE: 36300,
        INT_SAMPLER_2D_ARRAY: 36303,
        UNSIGNED_INT_SAMPLER_2D: 36306,
        UNSIGNED_INT_SAMPLER_3D: 36307,
        UNSIGNED_INT_SAMPLER_CUBE: 36308,
        UNSIGNED_INT_SAMPLER_2D_ARRAY: 36311,
        MAX_SAMPLES: 36183,
        SAMPLER_BINDING: 35097,
        PIXEL_PACK_BUFFER: 35051,
        PIXEL_UNPACK_BUFFER: 35052,
        PIXEL_PACK_BUFFER_BINDING: 35053,
        PIXEL_UNPACK_BUFFER_BINDING: 35055,
        COPY_READ_BUFFER: 36662,
        COPY_WRITE_BUFFER: 36663,
        COPY_READ_BUFFER_BINDING: 36662,
        COPY_WRITE_BUFFER_BINDING: 36663,
        FLOAT_MAT2x3: 35685,
        FLOAT_MAT2x4: 35686,
        FLOAT_MAT3x2: 35687,
        FLOAT_MAT3x4: 35688,
        FLOAT_MAT4x2: 35689,
        FLOAT_MAT4x3: 35690,
        UNSIGNED_INT_VEC2: 36294,
        UNSIGNED_INT_VEC3: 36295,
        UNSIGNED_INT_VEC4: 36296,
        UNSIGNED_NORMALIZED: 35863,
        SIGNED_NORMALIZED: 36764,
        VERTEX_ATTRIB_ARRAY_INTEGER: 35069,
        VERTEX_ATTRIB_ARRAY_DIVISOR: 35070,
        TRANSFORM_FEEDBACK_BUFFER_MODE: 35967,
        MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS: 35968,
        TRANSFORM_FEEDBACK_VARYINGS: 35971,
        TRANSFORM_FEEDBACK_BUFFER_START: 35972,
        TRANSFORM_FEEDBACK_BUFFER_SIZE: 35973,
        TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN: 35976,
        MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS: 35978,
        MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS: 35979,
        INTERLEAVED_ATTRIBS: 35980,
        SEPARATE_ATTRIBS: 35981,
        TRANSFORM_FEEDBACK_BUFFER: 35982,
        TRANSFORM_FEEDBACK_BUFFER_BINDING: 35983,
        TRANSFORM_FEEDBACK: 36386,
        TRANSFORM_FEEDBACK_PAUSED: 36387,
        TRANSFORM_FEEDBACK_ACTIVE: 36388,
        TRANSFORM_FEEDBACK_BINDING: 36389,
        FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING: 33296,
        FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE: 33297,
        FRAMEBUFFER_ATTACHMENT_RED_SIZE: 33298,
        FRAMEBUFFER_ATTACHMENT_GREEN_SIZE: 33299,
        FRAMEBUFFER_ATTACHMENT_BLUE_SIZE: 33300,
        FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE: 33301,
        FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE: 33302,
        FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE: 33303,
        FRAMEBUFFER_DEFAULT: 33304,
        DEPTH24_STENCIL8: 35056,
        DRAW_FRAMEBUFFER_BINDING: 36006,
        READ_FRAMEBUFFER_BINDING: 36010,
        RENDERBUFFER_SAMPLES: 36011,
        FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER: 36052,
        FRAMEBUFFER_INCOMPLETE_MULTISAMPLE: 36182,
        UNIFORM_BUFFER: 35345,
        UNIFORM_BUFFER_BINDING: 35368,
        UNIFORM_BUFFER_START: 35369,
        UNIFORM_BUFFER_SIZE: 35370,
        MAX_VERTEX_UNIFORM_BLOCKS: 35371,
        MAX_FRAGMENT_UNIFORM_BLOCKS: 35373,
        MAX_COMBINED_UNIFORM_BLOCKS: 35374,
        MAX_UNIFORM_BUFFER_BINDINGS: 35375,
        MAX_UNIFORM_BLOCK_SIZE: 35376,
        MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS: 35377,
        MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS: 35379,
        UNIFORM_BUFFER_OFFSET_ALIGNMENT: 35380,
        ACTIVE_UNIFORM_BLOCKS: 35382,
        UNIFORM_TYPE: 35383,
        UNIFORM_SIZE: 35384,
        UNIFORM_BLOCK_INDEX: 35386,
        UNIFORM_OFFSET: 35387,
        UNIFORM_ARRAY_STRIDE: 35388,
        UNIFORM_MATRIX_STRIDE: 35389,
        UNIFORM_IS_ROW_MAJOR: 35390,
        UNIFORM_BLOCK_BINDING: 35391,
        UNIFORM_BLOCK_DATA_SIZE: 35392,
        UNIFORM_BLOCK_ACTIVE_UNIFORMS: 35394,
        UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES: 35395,
        UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER: 35396,
        UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER: 35398,
        OBJECT_TYPE: 37138,
        SYNC_CONDITION: 37139,
        SYNC_STATUS: 37140,
        SYNC_FLAGS: 37141,
        SYNC_FENCE: 37142,
        SYNC_GPU_COMMANDS_COMPLETE: 37143,
        UNSIGNALED: 37144,
        SIGNALED: 37145,
        ALREADY_SIGNALED: 37146,
        TIMEOUT_EXPIRED: 37147,
        CONDITION_SATISFIED: 37148,
        WAIT_FAILED: 37149,
        SYNC_FLUSH_COMMANDS_BIT: 1,
        COLOR: 6144,
        DEPTH: 6145,
        STENCIL: 6146,
        MIN: 32775,
        MAX: 32776,
        DEPTH_COMPONENT24: 33190,
        STREAM_READ: 35041,
        STREAM_COPY: 35042,
        STATIC_READ: 35045,
        STATIC_COPY: 35046,
        DYNAMIC_READ: 35049,
        DYNAMIC_COPY: 35050,
        DEPTH_COMPONENT32F: 36012,
        DEPTH32F_STENCIL8: 36013,
        INVALID_INDEX: 4294967295,
        TIMEOUT_IGNORED: -1,
        MAX_CLIENT_WAIT_TIMEOUT_WEBGL: 37447,
        VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE: 35070,
        UNMASKED_VENDOR_WEBGL: 37445,
        UNMASKED_RENDERER_WEBGL: 37446,
        MAX_TEXTURE_MAX_ANISOTROPY_EXT: 34047,
        TEXTURE_MAX_ANISOTROPY_EXT: 34046,
        COMPRESSED_RGB_S3TC_DXT1_EXT: 33776,
        COMPRESSED_RGBA_S3TC_DXT1_EXT: 33777,
        COMPRESSED_RGBA_S3TC_DXT3_EXT: 33778,
        COMPRESSED_RGBA_S3TC_DXT5_EXT: 33779,
        COMPRESSED_R11_EAC: 37488,
        COMPRESSED_SIGNED_R11_EAC: 37489,
        COMPRESSED_RG11_EAC: 37490,
        COMPRESSED_SIGNED_RG11_EAC: 37491,
        COMPRESSED_RGB8_ETC2: 37492,
        COMPRESSED_RGBA8_ETC2_EAC: 37493,
        COMPRESSED_SRGB8_ETC2: 37494,
        COMPRESSED_SRGB8_ALPHA8_ETC2_EAC: 37495,
        COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2: 37496,
        COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2: 37497,
        COMPRESSED_RGB_PVRTC_4BPPV1_IMG: 35840,
        COMPRESSED_RGBA_PVRTC_4BPPV1_IMG: 35842,
        COMPRESSED_RGB_PVRTC_2BPPV1_IMG: 35841,
        COMPRESSED_RGBA_PVRTC_2BPPV1_IMG: 35843,
        COMPRESSED_RGB_ETC1_WEBGL: 36196,
        COMPRESSED_RGB_ATC_WEBGL: 35986,
        COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL: 35986,
        COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL: 34798,
        UNSIGNED_INT_24_8_WEBGL: 34042,
        HALF_FLOAT_OES: 36193,
        RGBA32F_EXT: 34836,
        RGB32F_EXT: 34837,
        FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE_EXT: 33297,
        UNSIGNED_NORMALIZED_EXT: 35863,
        MIN_EXT: 32775,
        MAX_EXT: 32776,
        SRGB_EXT: 35904,
        SRGB_ALPHA_EXT: 35906,
        SRGB8_ALPHA8_EXT: 35907,
        FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT: 33296,
        FRAGMENT_SHADER_DERIVATIVE_HINT_OES: 35723,
        COLOR_ATTACHMENT0_WEBGL: 36064,
        COLOR_ATTACHMENT1_WEBGL: 36065,
        COLOR_ATTACHMENT2_WEBGL: 36066,
        COLOR_ATTACHMENT3_WEBGL: 36067,
        COLOR_ATTACHMENT4_WEBGL: 36068,
        COLOR_ATTACHMENT5_WEBGL: 36069,
        COLOR_ATTACHMENT6_WEBGL: 36070,
        COLOR_ATTACHMENT7_WEBGL: 36071,
        COLOR_ATTACHMENT8_WEBGL: 36072,
        COLOR_ATTACHMENT9_WEBGL: 36073,
        COLOR_ATTACHMENT10_WEBGL: 36074,
        COLOR_ATTACHMENT11_WEBGL: 36075,
        COLOR_ATTACHMENT12_WEBGL: 36076,
        COLOR_ATTACHMENT13_WEBGL: 36077,
        COLOR_ATTACHMENT14_WEBGL: 36078,
        COLOR_ATTACHMENT15_WEBGL: 36079,
        DRAW_BUFFER0_WEBGL: 34853,
        DRAW_BUFFER1_WEBGL: 34854,
        DRAW_BUFFER2_WEBGL: 34855,
        DRAW_BUFFER3_WEBGL: 34856,
        DRAW_BUFFER4_WEBGL: 34857,
        DRAW_BUFFER5_WEBGL: 34858,
        DRAW_BUFFER6_WEBGL: 34859,
        DRAW_BUFFER7_WEBGL: 34860,
        DRAW_BUFFER8_WEBGL: 34861,
        DRAW_BUFFER9_WEBGL: 34862,
        DRAW_BUFFER10_WEBGL: 34863,
        DRAW_BUFFER11_WEBGL: 34864,
        DRAW_BUFFER12_WEBGL: 34865,
        DRAW_BUFFER13_WEBGL: 34866,
        DRAW_BUFFER14_WEBGL: 34867,
        DRAW_BUFFER15_WEBGL: 34868,
        MAX_COLOR_ATTACHMENTS_WEBGL: 36063,
        MAX_DRAW_BUFFERS_WEBGL: 34852,
        VERTEX_ARRAY_BINDING_OES: 34229,
        QUERY_COUNTER_BITS_EXT: 34916,
        CURRENT_QUERY_EXT: 34917,
        QUERY_RESULT_EXT: 34918,
        QUERY_RESULT_AVAILABLE_EXT: 34919,
        TIME_ELAPSED_EXT: 35007,
        TIMESTAMP_EXT: 36392,
        GPU_DISJOINT_EXT: 36795
    }), Xf(uc.prototype, {
        bufferData: function() {
            var e;
            return this.s(), (e = this.t).bufferData.apply(e, arguments);
        },
        bufferSubData: function() {
            var e;
            return this.s(), (e = this.t).bufferSubData.apply(e, arguments);
        },
        createBuffer: function() {
            return this.t.createBuffer();
        },
        deleteBuffer: function(e) {
            var t = this.states;
            t.arrayBuffer === e ? t.arrayBuffer = null : t.elementArrayBuffer === e && (t.elementArrayBuffer = null);
            var n = t.attributes;
            for (var r in n) n[r].buffer === e && (n[r].buffer = null);
            return this.t.deleteBuffer(e);
        },
        getBufferParameter: function(e, t) {
            return this.s(), this.t.getBufferParameter(e, t);
        },
        isBuffer: function(e) {
            return this.t.isBuffer(e);
        }
    }), Xf(uc.prototype, {
        checkFramebufferStatus: function(e) {
            return this.t.checkFramebufferStatus(e);
        },
        createFramebuffer: function() {
            return this.t.createFramebuffer();
        },
        deleteFramebuffer: function(e) {
            var t = this.states.framebuffer;
            for (var n in t) t[n] === e && (t[n] = null);
            return this.t.deleteFramebuffer(e);
        },
        framebufferRenderbuffer: function(e, t, n, r) {
            return this.s(), this.t.framebufferRenderbuffer(e, t, n, r);
        },
        framebufferTexture2D: function(e, t, n, r, i) {
            return this.s(), this.t.framebufferTexture2D(e, t, n, r, i);
        },
        getFramebufferAttachmentParameter: function(e, t, n) {
            return this.s(), this.t.getFramebufferAttachmentParameter(e, t, n);
        },
        isFramebuffer: function(e) {
            return this.t.isFramebuffer(e);
        },
        readPixels: function(e, t, n, r, i, a, o) {
            return this.s(), this.t.readPixels(e, t, n, r, i, a, o);
        }
    }), Xf(uc.prototype, {
        createRenderbuffer: function() {
            return this.t.createRenderbuffer();
        },
        deleteRenderbuffer: function(e) {
            var t = this.states.renderbuffer;
            for (var n in t) t[n] === e && (t[n] = null);
            return this.t.deleteRenderbuffer(e);
        },
        getRenderbufferParameter: function(e, t) {
            return this.s(), this.t.getRenderbufferParameter(e, t);
        },
        isRenderbuffer: function(e) {
            return this.t.isRenderbuffer(e);
        },
        renderbufferStorage: function(e, t, n, r) {
            return this.s(), this.t.renderbufferStorage(e, t, n, r);
        }
    }), Xf(uc.prototype, {
        scissor: function(e, t, n, r) {
            this.s();
            var i = this.states.scissor;
            i[0] === e && i[1] === t && i[2] === n && i[3] === r || (i[0] = e, i[1] = t, i[2] = n, 
            i[3] = r, this.t.scissor(e, t, n, r));
        },
        viewport: function(e, t, n, r) {
            this.s();
            var i = this.states.viewport;
            i[0] === e && i[1] === t && i[2] === n && i[3] === r || (i[0] = e, i[1] = t, i[2] = n, 
            i[3] = r, this.t.viewport(e, t, n, r));
        },
        blendColor: function(e, t, n, r) {
            this.s();
            var i = this.states.blendColor;
            i[0] === e && i[1] === t && i[2] === n && i[3] === r || (i[0] = e, i[1] = t, i[2] = n, 
            i[3] = r, this.t.blendColor(e, t, n, r));
        },
        blendEquation: function(e) {
            this.s();
            var t = this.states.blendEquationSeparate;
            t[0] === e && t[1] === e || (t[0] = e, t[1] = e, this.t.blendEquation(e));
        },
        blendEquationSeparate: function(e, t) {
            this.s();
            var n = this.states.blendEquationSeparate;
            n[0] === e && n[1] === t || (n[0] = e, n[1] = t, this.t.blendEquationSeparate(e, t));
        },
        blendFunc: function(e, t) {
            this.s();
            var n = this.states.blendFuncSeparate;
            n[0] === e && n[2] === e && n[1] === t && n[3] === t || (n[0] = e, n[1] = t, n[2] = e, 
            n[3] = t, this.t.blendFunc(e, t));
        },
        blendFuncSeparate: function(e, t, n, r) {
            this.s();
            var i = this.states.blendFuncSeparate;
            i[0] === e && i[1] === t && i[2] === n && i[3] === r || (i[0] = e, i[1] = t, i[2] = n, 
            i[3] = r, this.t.blendFuncSeparate(e, t, n, r));
        },
        clearColor: function(e, t, n, r) {
            this.s();
            var i = this.states.clearColor;
            i[0] === e && i[1] === t && i[2] === n && i[3] === r || (i[0] = e, i[1] = t, i[2] = n, 
            i[3] = r, this.t.clearColor(e, t, n, r));
        },
        clearDepth: function(e) {
            this.s();
            var t = this.states.clearDepth;
            t[0] !== e && (t[0] = e, this.t.clearDepth(e));
        },
        clearStencil: function(e) {
            this.s();
            var t = this.states.clearStencil;
            t[0] !== e && (t[0] = e, this.t.clearStencil(e));
        },
        colorMask: function(e, t, n, r) {
            this.s();
            var i = this.states.colorMask;
            i[0] === e && i[1] === t && i[2] === n && i[3] === r || (i[0] = e, i[1] = t, i[2] = n, 
            i[3] = r, this.t.colorMask(e, t, n, r));
        },
        cullFace: function(e) {
            this.s();
            var t = this.states.cullFace;
            t[0] !== e && (t[0] = e, this.t.cullFace(e));
        },
        depthFunc: function(e) {
            this.s();
            var t = this.states.depthFunc;
            t[0] !== e && (t[0] = e, this.t.depthFunc(e));
        },
        depthMask: function(e) {
            this.s();
            var t = this.states.depthMask;
            t[0] !== e && (t[0] = e, this.t.depthMask(e));
        },
        depthRange: function(e, t) {
            this.s();
            var n = this.states.depthRange;
            n[0] === e && n[1] === t || (n[0] = e, n[1] = t, this.t.depthRange(e, t));
        },
        disable: function(e) {
            this.s();
            var t = this.states.capabilities;
            t[e] && (t[e] = !1, this.t.disable(e));
        },
        enable: function(e) {
            this.s();
            var t = this.states.capabilities;
            t[e] || (t[e] = !0, this.t.enable(e));
        },
        frontFace: function(e) {
            this.s();
            var t = this.states.frontFace;
            t[0] !== e && (t[0] = e, this.t.frontFace(e));
        },
        hint: function(e, t) {
            this.s();
            var n = this.states.hint;
            n[e][0] !== t && (n[e][0] = t, this.t.hint(e, t));
        },
        lineWidth: function(e) {
            this.s();
            var t = this.states.lineWidth;
            t[0] !== e && (t[0] = e, this.t.lineWidth(e));
        },
        pixelStorei: function(e, t) {
            this.s();
            var n = this.states.pixelStorei;
            n[e] !== t && (n[e] && (n[e][0] = t), this.t.pixelStorei(e, t));
        },
        polygonOffset: function(e, t) {
            this.s();
            var n = this.states.polygonOffset;
            n[0] === e && n[1] === t || (n[0] = e, n[1] = t, this.t.polygonOffset(e, t));
        },
        sampleCoverage: function(e, t) {
            this.s();
            var n = this.states.sampleCoverage;
            n[0] === e && n[1] === t || (n[0] = e, n[1] = t, this.t.sampleCoverage(e, t));
        },
        stencilFunc: function(e, t, n) {
            this.s();
            var r = this.states.stencilFuncSeparate, i = this.t;
            r[i.FRONT][0] === e && r[i.FRONT][1] === t && r[i.FRONT][2] === n && r[i.BACK][0] === e && r[i.BACK][1] === t && r[i.BACK][2] === n || (r[i.FRONT][0] = r[i.BACK][0] = e, 
            r[i.FRONT][1] = r[i.BACK][1] = t, r[i.FRONT][2] = r[i.BACK][2] = n, this.t.stencilFunc(e, t, n));
        },
        stencilFuncSeparate: function(e, t, n, r) {
            if (this.s(), e !== this.t.FRONT_AND_BACK) {
                var i = this.states.stencilFuncSeparate;
                i[e][0] === t && i[e][1] === n && i[e][2] === r || (i[e][0] = t, i[e][1] = n, i[e][2] = r, 
                this.t.stencilFuncSeparate(e, t, n, r));
            } else this.stencilFunc(t, n, r);
        },
        stencilMask: function(e) {
            this.s();
            var t = this.t, n = this.states.stencilMaskSeparate;
            n[t.FRONT][0] === e && n[t.BACK][0] === e || (n[t.FRONT][0] = e, n[t.BACK][0] = e, 
            this.t.stencilMask(e));
        },
        stencilMaskSeparate: function(e, t) {
            if (this.s(), e !== this.t.FRONT_AND_BACK) {
                var n = this.states.stencilMaskSeparate;
                n[e][0] !== t && (n[e][0] = t, this.t.stencilMaskSeparate(e, t));
            } else this.stencilMask(t);
        },
        stencilOp: function(e, t, n) {
            this.s();
            var r = this.states.stencilOpSeparate, i = this.t;
            r[i.FRONT][0] === e && r[i.FRONT][1] === t && r[i.FRONT][2] === n && r[i.BACK][0] === e && r[i.BACK][1] === t && r[i.BACK][2] === n || (r[i.FRONT][0] = r[i.BACK][0] = e, 
            r[i.FRONT][1] = r[i.BACK][1] = t, r[i.FRONT][2] = r[i.BACK][2] = n, this.t.stencilOp(e, t, n));
        },
        stencilOpSeparate: function(e, t, n, r) {
            if (this.s(), e !== this.t.FRONT_AND_BACK) {
                var i = this.states.stencilOpSeparate;
                i[e][0] === t && i[e][1] === n && i[e][2] === r || (i[e][0] = t, i[e][1] = n, i[e][2] = r, 
                this.t.stencilOpSeparate(e, t, n, r));
            } else this.stencilOp(t, n, r);
        },
        bindFramebuffer: function(e, t) {
            this.s();
            var n = this.states.framebuffer;
            n[e] !== t && (n[e] = t, this.t.bindFramebuffer(e, t));
        },
        bindRenderbuffer: function(e, t) {
            this.s();
            var n = this.states.renderbuffer;
            n[e] !== t && (n[e] = t, this.t.bindRenderbuffer(e, t));
        },
        bindTexture: function(e, t) {
            this.s();
            var n = this.states.textures, r = -1 !== n.active ? n.active - 33984 : -1;
            n.units[r][e] = t, this.t.bindTexture(e, t);
        },
        activeTexture: function(e) {
            this.s();
            var t = this.t, n = this.states.textures, r = n.active;
            n.active = e, t.activeTexture(e), -1 === r && (n.units[e - 33984][t.TEXTURE_2D] = n.units[-1][t.TEXTURE_2D], 
            n.units[e - 33984][t.TEXTURE_CUBE_MAP] = n.units[-1][t.TEXTURE_CUBE_MAP], n.units[-1][t.TEXTURE_2D] = null, 
            n.units[-1][t.TEXTURE_CUBE_MAP] = null);
        },
        useProgram: function(e) {
            this.s();
            var t = this.states;
            t.program !== e && (t.program = e, this.t.useProgram(e));
        },
        bindBuffer: function(e, t) {
            this.s();
            var n = this.t, r = this.states;
            e === n.ELEMENT_ARRAY_BUFFER ? r.elementArrayBuffer = t : r.arrayBuffer = t, n.bindBuffer(e, t);
        },
        bindVertexArray: function(e) {
            this.s();
            var t = this.t, n = this.states;
            n.vao !== e && (n.vao = e, this._ ? t.bindVertexArray(e) : this.vaoOES.bindVertexArrayOES(e));
        },
        vertexAttribPointer: function(e, t, n, r, i, a) {
            this.s();
            var o = [ e, t, n, r, i, a ];
            this.states.attributes[e] || (this.states.attributes[e] = {
                enable: !0
            });
            var s = this.states.attributes[e];
            return s.buffer = this.states.arrayBuffer, s.args = o, this.t.vertexAttribPointer(e, t, n, r, i, a);
        },
        vertexAttribDivisor: function(e, t) {
            return this.s(), this.states.attributes[e].divisor = t, this._ ? this.t.vertexAttribDivisor(e, t) : this.angleOES.vertexAttribDivisorANGLE(e, t);
        }
    }, {
        s: function() {
            var e = this.t;
            if (e.h && e.h !== this) {
                var t = e.h;
                this.S(t.states), e.h = this;
            }
            e.h = this;
        },
        S: function(e) {
            var t = this.states, n = this.t;
            for (var r in t) if ("capabilities" !== r && "textures" !== r && "attributes" !== r && "arrayBuffer" !== r && "elementArrayBuffer" !== r) if ("program" === r) t.program !== e.program && n.useProgram(t.program); else if ("framebuffer" === r) for (var i in t[r]) t[r][i] !== e[r][i] && n.bindFramebuffer(+i, t[r][i]); else if ("renderbuffer" === r) for (var a in t[r]) t[r][a] !== e[r][a] && n.bindRenderbuffer(+a, t[r][a]); else if (!Ff(t[r], e[r])) if (Array.isArray(e[r])) n[r].apply(n, t[r]); else if (e[r]) for (var o in t[r]) Ff(t[r][o], e[r][o]) || n[r].apply(n, [ +o ].concat(t[r][o]));
            for (var s in t.capabilities) t.capabilities[s] !== e.capabilities[s] && n[t.capabilities[s] ? "enable" : "disable"](+s);
            for (var u = t.textures, f = e.textures, c = u.units, l = f.units, h = u.active - n.TEXTURE0, d = 0; d < c.length; d++) d === h || c[d][n.TEXTURE_2D] === l[d][n.TEXTURE_2D] && c[d][n.TEXTURE_CUBE_MAP] === l[d][n.TEXTURE_CUBE_MAP] || (n.activeTexture(n.TEXTURE0 + d), 
            n.bindTexture(n.TEXTURE_2D, c[d][n.TEXTURE_2D]), n.bindTexture(n.TEXTURE_CUBE_MAP, c[d][n.TEXTURE_CUBE_MAP]));
            if (-1 < u.active) {
                var p = c[h];
                p[n.TEXTURE_2D] === l[h][n.TEXTURE_2D] && p[n.TEXTURE_CUBE_MAP] === l[h][n.TEXTURE_CUBE_MAP] || (n.activeTexture(u.active), 
                n.bindTexture(n.TEXTURE_2D, p[n.TEXTURE_2D]), n.bindTexture(n.TEXTURE_CUBE_MAP, p[n.TEXTURE_CUBE_MAP]));
            }
            var v = t.attributes, m = e.attributes;
            for (var g in v) m[g] && v[g].buffer === m[g].buffer && Ff(v[g].args, m[g].args) || v[g].buffer && (n.bindBuffer(n.ARRAY_BUFFER, v[g].buffer), 
            n.vertexAttribPointer.apply(n, v[g].args), void 0 !== v[g].divisor && (this._ ? n.vertexAttribDivisor(+g, v[g].divisor) : this.angleOES.vertexAttribDivisorANGLE(+g, v[g].divisor)), 
            v[g].enable ? n.enableVertexAttribArray(v[g].args[0]) : n.disableVertexAttribArray(v[g].args[0]));
            n.bindBuffer(n.ARRAY_BUFFER, t.arrayBuffer), n.bindBuffer(n.ELEMENT_ARRAY_BUFFER, t.elementArrayBuffer);
            var _ = t.vao;
            _ !== e.vao && (this._ ? n.bindVertexArray(_ || null) : this.vaoOES.bindVertexArrayOES(_ || null));
        }
    }), Xf(uc.prototype, {
        compressedTexImage2D: function(e, t, n, r, i, a, o) {
            return this.s(), this.t.compressedTexImage2D(e, t, n, r, i, a, o);
        },
        copyTexImage2D: function(e, t, n, r, i, a, o, s) {
            return this.s(), this.t.copyTexImage2D(e, t, n, r, i, a, o, s);
        },
        copyTexSubImage2D: function(e, t, n, r, i, a, o, s) {
            return this.s(), this.t.copyTexSubImage2D(e, t, n, r, i, a, o, s);
        },
        createTexture: function() {
            return this.t.createTexture();
        },
        deleteTexture: function(e) {
            for (var t = this.states.textures.units, n = 0; n < t.length; n++) for (var r in t[n]) t[n][r] === e && (t[n][r] = null);
            return this.t.deleteTexture(e);
        },
        generateMipmap: function(e) {
            return this.s(), this.t.generateMipmap(e);
        },
        getTexParameter: function(e, t) {
            return this.s(), this.t.getTexParameter(e, t);
        },
        isTexture: function(e) {
            return this.t.isTexture(e);
        },
        texImage2D: function() {
            for (var e, t = arguments.length, n = new Array(t), r = 0; r < t; r++) n[r] = arguments[r];
            if (this.s(), this._) {
                var i = n[n.length - 2], a = oc.getInternalFormat(this.t, n[2], i);
                a !== n[2] && (n[2] = a);
                var o = oc.getTextureType(this.t, i);
                o !== i && (n[n.length - 2] = o);
            }
            return (e = this.t).texImage2D.apply(e, n);
        },
        texSubImage2D: function(e) {
            var t;
            if (this.s(), this._) {
                var n = e[e.length - 2], r = oc.getTextureType(this.t, n);
                r !== n && (e[e.length - 2] = r);
            }
            return (t = this.t).texSubImage2D.apply(t, e);
        },
        texParameterf: function(e, t, n) {
            return this.s(), this.t.texParameterf(e, t, n);
        },
        texParameteri: function(e, t, n) {
            return this.s(), this.t.texParameteri(e, t, n);
        }
    }), Xf(uc.prototype, {
        bindAttribLocation: function(e, t, n) {
            return this.t.bindAttribLocation(e, t, n);
        },
        enableVertexAttribArray: function(e) {
            return this.s(), this.states.attributes[e] || (this.states.attributes[e] = {}), 
            this.states.attributes[e].enable = !0, this.t.enableVertexAttribArray(e);
        },
        disableVertexAttribArray: function(e) {
            return this.s(), this.states.attributes[e] || (this.states.attributes[e] = {}), 
            this.states.attributes[e].enable = !1, this.t.disableVertexAttribArray(e);
        },
        getActiveAttrib: function(e, t) {
            return this.t.getActiveAttrib(e, t);
        },
        getActiveUniform: function(e, t) {
            return this.t.getActiveUniform(e, t);
        },
        getAttribLocation: function(e, t) {
            return this.t.getAttribLocation(e, t);
        },
        getUniformLocation: function(e, t) {
            return this.t.getUniformLocation(e, t);
        },
        getVertexAttrib: function(e, t) {
            return this.s(), this.t.getVertexAttrib(e, t);
        },
        getVertexAttribOffset: function(e, t) {
            return this.s(), this.t.getVertexAttribOffset(e, t);
        },
        uniformMatrix2fv: function(e, t, n) {
            return this.s(), this.t.uniformMatrix2fv(e, t, n);
        },
        uniformMatrix3fv: function(e, t, n) {
            return this.s(), this.t.uniformMatrix3fv(e, t, n);
        },
        uniformMatrix4fv: function(e, t, n) {
            return this.s(), this.t.uniformMatrix4fv(e, t, n);
        },
        uniform1f: function(e, t) {
            return this.s(), this.t.uniform1f(e, t);
        },
        uniform1fv: function(e, t) {
            return this.s(), this.t.uniform1fv(e, t);
        },
        uniform1i: function(e, t) {
            return this.s(), this.t.uniform1i(e, t);
        },
        uniform1iv: function(e, t) {
            return this.s(), this.t.uniform1iv(e, t);
        },
        uniform2f: function(e, t, n) {
            return this.s(), this.t.uniform2f(e, t, n);
        },
        uniform2fv: function(e, t) {
            return this.s(), this.t.uniform2fv(e, t);
        },
        uniform2i: function(e, t, n) {
            return this.s(), this.t.uniform2i(e, t, n);
        },
        uniform2iv: function(e, t) {
            return this.s(), this.t.uniform2iv(e, t);
        },
        uniform3f: function(e, t, n, r) {
            return this.s(), this.t.uniform3f(e, t, n, r);
        },
        uniform3fv: function(e, t) {
            return this.s(), this.t.uniform3fv(e, t);
        },
        uniform3i: function(e, t, n, r) {
            return this.s(), this.t.uniform3i(e, t, n, r);
        },
        uniform3iv: function(e, t) {
            return this.s(), this.t.uniform3iv(e, t);
        },
        uniform4f: function(e, t, n, r, i) {
            return this.s(), this.t.uniform4f(e, t, n, r, i);
        },
        uniform4fv: function(e, t) {
            return this.s(), this.t.uniform4fv(e, t);
        },
        uniform4i: function(e, t, n, r, i) {
            return this.s(), this.t.uniform4i(e, t, n, r, i);
        },
        uniform4iv: function(e, t) {
            return this.s(), this.t.uniform4iv(e, t);
        },
        vertexAttrib1f: function(e, t) {
            return this.s(), this.t.vertexAttrib1f(e, t);
        },
        vertexAttrib2f: function(e, t, n) {
            return this.s(), this.t.vertexAttrib2f(e, t, n);
        },
        vertexAttrib3f: function(e, t, n, r) {
            return this.s(), this.t.vertexAttrib3f(e, t, n, r);
        },
        vertexAttrib4f: function(e, t, n, r, i) {
            return this.s(), this.t.vertexAttrib4f(e, t, n, r, i);
        },
        vertexAttrib1fv: function(e, t) {
            return this.s(), this.t.vertexAttrib1fv(e, t);
        },
        vertexAttrib2fv: function(e, t) {
            return this.s(), this.t.vertexAttrib2fv(e, t);
        },
        vertexAttrib3fv: function(e, t) {
            return this.s(), this.t.vertexAttrib3fv(e, t);
        },
        vertexAttrib4fv: function(e, t) {
            return this.s(), this.t.vertexAttrib4fv(e, t);
        }
    }), Xf(uc.prototype, {
        createVertexArray: function() {
            return this._ ? this.t.createVertexArray() : this.vaoOES.createVertexArrayOES();
        },
        deleteVertexArray: function(e) {
            var t = this.states;
            return t.vao === e && (t.vao = null), this._ ? this.t.deleteVertexArray(e) : this.vaoOES.deleteVertexArrayOES(e);
        },
        isVertexArray: function(e) {
            return this._ ? this.t.isVertexArray(e) : this.vaoOES.isVertexArrayOES(e);
        }
    }), Xf(uc.prototype, {
        drawArraysInstanced: function(e, t, n, r) {
            return this.s(), this.i(), this._ ? this.t.drawArraysInstanced(e, t, n, r) : this.angleOES.drawArraysInstancedANGLE(e, t, n, r);
        },
        drawElementsInstanced: function(e, t, n, r, i) {
            return this.s(), this.i(), this._ ? this.t.drawElementsInstanced(e, t, n, r, i) : this.angleOES.drawElementsInstancedANGLE(e, t, n, r, i);
        }
    });
    var cc = [];
    function lc(e, t) {
        var n = t._get2DExtent(t.getGLZoom()), r = n.getWidth(), i = n.getHeight(), a = e;
        return bs(a), As(a, a, t.cameraLookAt), Ts(a, a, Ds(cc, r, i, 1)), a;
    }
    var hc = "function" == typeof Object.assign;
    function dc(e) {
        if (hc) Object.assign.apply(Object, arguments); else for (var t = 1; t < arguments.length; t++) {
            var n = arguments[t];
            for (var r in n) e[r] = n[r];
        }
        return e;
    }
    var pc, vc, mc = function() {
        function e(e, t, n) {
            this.renderer = new ut(e), this.sceneConfig = t, this._esmShadowThreshold = .3, 
            this._layer = n, this._init();
        }
        e.getUniformDeclares = function() {
            var e = [];
            return e.push({
                name: "shadow_lightProjViewModelMatrix",
                type: "function",
                fn: function(e, t) {
                    return ys([], t.shadow_lightProjViewMatrix, t.modelMatrix);
                }
            }), e.push("shadow_shadowMap", "shadow_opacity", "esm_shadow_threshold", "shadow_color", "shadow_nearFar"), 
            e;
        };
        var t = e.prototype;
        return t.resize = function() {
            var e = this.canvas;
            e.width = this._layer.getRenderer().canvas.width, e.height = this._layer.getRenderer().canvas.height;
        }, t._init = function() {
            var e = this.sceneConfig.shadow, t = 512, n = e.quality;
            "high" === n ? t = 2048 : "medium" === n && (t = 1024);
            var r = this.getDefines();
            this._shadowPass = new Bo(this.renderer, {
                width: t,
                height: t,
                blurOffset: e.blurOffset,
                defines: r
            }), this._shadowDisplayShader = new Io(r), this._createGround();
        }, t.getDefines = function() {
            return {
                HAS_SHADOWING: 1,
                PACK_FLOAT: 1,
                USE_ESM: 1
            };
        }, t.render = function(e, t, n, r, i, a, o, s, u, f) {
            this._transformGround();
            var c, l, h = this._layer.getMap();
            if (f || this._shadowChanged(h, o)) {
                var d = ys([], t, n), p = Hs([], a);
                pc = pc || h.getContainerExtent();
                var v = h.height;
                62 < h.getPitch() && (v = h._getVisualHeight(62));
                var m = pc.set(0, h.height - v, h.width, h.height).convertTo(function(e) {
                    return h._containerPointToPoint(e, h.getGLZoom());
                }).toArray();
                e && o.addMesh(this._ground);
                var g = m.map(function(e) {
                    return [ e.x, e.y, 0, 1 ];
                }), _ = this._shadowPass.render(o, {
                    cameraProjViewMatrix: d,
                    lightDir: p,
                    farPlane: g,
                    cameraLookAt: h.cameraLookAt
                }), x = _.lightProjViewMatrix, b = _.shadowMap, y = _.blurFBO;
                c = this._lightProjViewMatrix = x, l = this._shadowMap = b, this._blurFBO = y, this._renderedShadows = o.getMeshes().reduce(function(e, t) {
                    return t.castShadow && (e[t.uuid] = 1), e;
                }, {}), this._renderedView = {
                    count: o.getMeshes().length - (e ? 1 : 0)
                }, this._updated = !0;
            } else c = this._lightProjViewMatrix, l = this._shadowMap, this._updated = !1;
            return this._projMatrix = t, this._viewMatrix = n, e && o.getMeshes().length && this.displayShadow(r, i, s, u), 
            {
                shadow_lightProjViewMatrix: c,
                shadow_shadowMap: l,
                shadow_opacity: i,
                shadow_color: r,
                esm_shadow_threshold: this._esmShadowThreshold
            };
        }, t.displayShadow = function(e, t, n, r) {
            var i = this._lightProjViewMatrix, a = this._ground, o = this._groundLightProjViewModelMatrix || [], s = this._layer.getRenderer().canvas;
            this.renderer.render(this._shadowDisplayShader, {
                halton: n || [ 0, 0 ],
                globalTexSize: [ s.width, s.height ],
                modelMatrix: a.localTransform,
                projMatrix: this._projMatrix,
                viewMatrix: this._viewMatrix,
                shadow_lightProjViewModelMatrix: ys(o, i, a.localTransform),
                shadow_shadowMap: this._shadowMap,
                esm_shadow_threshold: this._esmShadowThreshold,
                shadow_opacity: t,
                color: e || [ 0, 0, 0 ]
            }, this._groundScene, r);
        }, t.dispose = function() {
            this._shadowPass.dispose(), this._shadowDisplayShader.dispose(), this._ground && (this._ground.geometry.dispose(), 
            this._ground.dispose()), delete this.renderer;
        }, t.isUpdated = function() {
            return !1 !== this._updated;
        }, t._shadowChanged = function(e, t) {
            if (!this._renderedShadows) return !0;
            var n = this._renderedView;
            if (t.getMeshes().length !== n.count) return !0;
            for (var r = t.getMeshes(), i = 0; i < r.length; i++) if (r[i].castShadow && !this._renderedShadows[r[i].uuid]) return !0;
            return !1;
        }, t._createGround = function() {
            var e = new Qn();
            e.generateBuffers(this.renderer.regl), this._ground = new fn(e), this._groundScene = new qn([ this._ground ]);
        }, t._transformGround = function() {
            var e = this._layer.getMap(), t = lc(this._ground.localTransform, e);
            this._ground.setLocalTransform(t);
        }, e;
    }(), gc = Xo.PBRUtils, _c = gc.createIBLTextures, xc = gc.disposeIBLTextures, bc = gc.getPBRUniforms, yc = ((vc = Ac.prototype).getMap = function() {
        return this._layer && this._layer.getMap();
    }, vc.getSymbol = function() {
        var e = this._layer._getSceneConfig();
        return e && e.ground && e.ground.symbol;
    }, vc.isEnable = function() {
        var e = this._layer._getSceneConfig();
        return e && e.ground && e.ground.enable;
    }, vc.paint = function(e) {
        if (!this.isEnable()) return !1;
        var t = this._getGroundDefines(e);
        this._ground.setDefines(t), this._ground.material !== this.material && this._ground.setMaterial(this.material);
        var n = this._getShader();
        this._transformGround();
        var r = this._getUniformValues(e), i = e && e.renderTarget && e.renderTarget.fbo, a = this._layer.getRenderer().isEnableSSR();
        if (!(n !== this._fillShader || a && e && e.ssr)) return this.renderer.render(n, r, this._groundScene, i), 
        this._layer.getRenderer().setCanvasUpdated(), !0;
        var o = !1;
        if (a && t && t.HAS_SSR) {
            if (e && e.ssr) {
                this._regl.clear({
                    color: [ 0, 0, 0, 0 ],
                    framebuffer: e.ssr.depthTestFbo
                });
                var s = {
                    uGlobalTexSize: r.uGlobalTexSize,
                    uHalton: r.uHalton,
                    lineWidth: r.lineWidth,
                    lineHeight: r.lineHeight,
                    linePixelScale: r.linePixelScale,
                    projMatrix: this.getMap().projMatrix,
                    viewMatrix: this.getMap().viewMatrix
                };
                this.renderer.render(this._depthShader, s, this._groundScene, e.ssr.depthTestFbo);
                var u = e && e.ssr.fbo;
                this.renderer.render(n, r, this._groundScene, u), o = !0;
            }
        } else e && e.ssr || (this.renderer.render(n, r, this._groundScene, i), o = !0);
        return o && this._layer.getRenderer().setCanvasUpdated(), o;
    }, vc.update = function() {
        var e = this, t = this._layer._getSceneConfig();
        if (t) {
            var n = t.ground && t.ground.symbol;
            if (n) {
                this._polygonFill = this._parseColor(n.polygonFill || [ 1, 1, 1, 1 ]), this._polygonOpacity = void 0 === n.polygonOpacity ? 1 : n.polygonOpacity;
                var r = n.polygonPatternFile;
                if (r) {
                    if (!this._polygonPatternFile || this._polygonPatternFile._pattern_src !== r) {
                        var i = new Image();
                        i.onload = function() {
                            e._polygonPatternFile && e._polygonPatternFile.destroy(), e._polygonPatternFile = e._createPatternTexture(i), 
                            e._polygonPatternFile._pattern_src = r;
                        }, i.src = r;
                    }
                } else this._polygonPatternFile && (this._polygonPatternFile.destroy(), delete this._polygonPatternFile);
            } else this._polygonFill = [ 1, 1, 1, 1 ], this._polygonOpacity = 1, this._polygonPatternFile && (this._polygonPatternFile.destroy(), 
            delete this._polygonPatternFile);
            this._updateMaterial();
        }
    }, vc.setToRedraw = function() {
        this._layer.getRenderer().setToRedraw();
    }, vc.dispose = function() {
        this.material && (this.material.dispose(), delete this.material), this._ground && (this._ground.geometry.dispose(), 
        this._ground.material && this._ground.material.dispose(), this._ground.dispose(), 
        delete this._ground), this._polygonPatternFile && (this._polygonPatternFile.destroy(), 
        delete this._polygonPatternFile), this._fillShader && (this._fillShader.dispose(), 
        delete this._fillShader), this._standardShader && (this._standardShader.dispose(), 
        delete this._standardShader), this._disposeIblTextures(), this._dfgLUT && (this._dfgLUT.destroy(), 
        delete this._dfgLUT);
    }, vc._getShader = function() {
        var e = this._layer._getSceneConfig().ground;
        if (!e || !e.renderPlugin) return this._fillShader;
        var t = e.renderPlugin.type;
        if ("lit" === t) return this._standardShader;
        if ("fill" === t) return this._fillShader;
        throw new Error("unsupported render plugin of " + t + " for layer ground");
    }, vc._getUniformValues = function(e) {
        var t = this._getCommonUniforms(e);
        return t.polygonFill = this._polygonFill, t.polygonOpacity = this._polygonOpacity, 
        this._getShader() === this._fillShader && this._polygonPatternFile && (t.polygonPatternFile = this._polygonPatternFile), 
        t;
    }, vc._getCommonUniforms = function(e) {
        this._iblTexes || (this._iblTexes = _c(this._regl, this.getMap()));
        var t = bc(this.getMap(), this._iblTexes, this._dfgLUT, e);
        return this._setIncludeUniformValues(t, e), t;
    }, vc._setIncludeUniformValues = function(e, t) {
        var n = t && t.includes;
        if (n) for (var r in n) n[r] && t[r].renderUniforms && dc(e, t[r].renderUniforms);
    }, vc._disposeIblTextures = function() {
        this._iblTexes && (xc(this._iblTexes), delete this._iblTexes);
    }, vc._init = function() {
        this.getMap().on("updatelights", this._updateLights, this);
        var e = this._getExtraCommandProps(), t = mc.getUniformDeclares();
        t.push("polygonFill", "polygonOpacity", "polygonPatternFile", {
            name: "projViewModelMatrix",
            type: "function",
            fn: function(e, t) {
                return ys([], t.projViewMatrix, t.modelMatrix);
            }
        }), this._fillShader = new lr({
            vert: "attribute vec3 aPosition;\nuniform mat4 projViewModelMatrix;\n#ifdef HAS_PATTERN\n    attribute vec2 aTexCoord;\n    uniform vec2 uvScale;\n    uniform vec2 uvOffset;\n    varying vec2 vTexCoord;\n#endif\n#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)\n    #include <vsm_shadow_vert>\n#endif\nvoid main () {\n    #ifdef HAS_PATTERN\n        vTexCoord = aTexCoord * uvScale + uvOffset;\n    #endif\n    vec3 position = vec3(aPosition);\n    gl_Position = projViewModelMatrix * vec4(position, 1.0);\n    #if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)\n        shadow_computeShadowPars(vec4(position, 1.0));\n    #endif\n}",
            frag: "precision mediump float;\n#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)\n    #include <vsm_shadow_frag>\n#endif\n#ifdef HAS_PATTERN\n    uniform sampler2D polygonPatternFile;\n    varying vec2 vTexCoord;\n#endif\nuniform vec4 polygonFill;\nuniform float polygonOpacity;\nvoid main() {\n    #ifdef HAS_PATTERN\n        vec4 color = texture2D(polygonPatternFile, vTexCoord);\n    #else\n        vec4 color = polygonFill;\n    #endif\n    gl_FragColor = color * polygonOpacity;\n    #if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)\n        float shadowCoeff = shadow_computeShadow();\n        gl_FragColor.rgb = shadow_blend(gl_FragColor.rgb, shadowCoeff);\n    #endif\n}",
            uniforms: t,
            extraCommandProps: e
        });
        var n = mc.getUniformDeclares();
        n.push.apply(n, gi.getUniformDeclares()), n.push("polygonFill", "polygonOpacity"), 
        this._standardShader = new Xo.StandardShader({
            uniforms: n,
            extraCommandProps: e
        }), delete e.blend, this._depthShader = new Xo.StandardDepthShader({
            extraCommandProps: e
        }), this._createGround(), this._dfgLUT = Xo.PBRHelper.generateDFGLUT(this._regl), 
        this.update();
    }, vc._getExtraCommandProps = function() {
        var t = this, e = this._layer.getRenderer().canvas;
        return {
            viewport: {
                x: 0,
                y: 0,
                width: function() {
                    return e.width;
                },
                height: function() {
                    return e.height;
                }
            },
            depth: {
                enable: !0,
                mask: function() {
                    var e = t._layer._getSceneConfig().ground;
                    return e.depth || void 0 === e.depth;
                },
                func: "<="
            },
            blend: {
                enable: !0,
                func: {
                    src: "src alpha",
                    dst: "one minus src alpha"
                },
                equation: "add"
            },
            polygonOffset: {
                enable: !0,
                offset: {
                    factor: function() {
                        return 1;
                    },
                    units: function() {
                        return 4;
                    }
                }
            }
        };
    }, vc._hasIBL = function() {
        return !!this.getMap().getLightManager().getAmbientResource();
    }, vc._createGround = function() {
        var e = new Qn();
        e.generateBuffers(this.renderer.regl), e.data.aTexCoord = new Float32Array(8), this._ground = new fn(e, null, {
            castShadow: !1
        }), this._groundScene = new qn([ this._ground ]);
    }, vc._transformGround = function() {
        var e = this.getMap(), t = lc(this._ground.localTransform, e);
        this._ground.setLocalTransform(t);
        var n = e._get2DExtent(e.getGLZoom()), r = n.getWidth(), i = n.getHeight(), a = e.cameraLookAt, o = (a[0] - r) / .5 % 1, s = (a[1] + i) / .5 % 1, u = n.getWidth() / .5 * 2, f = n.getHeight() / .5 * 2, c = this._ground.geometry.data.aTexCoord;
        c[0] = o, c[1] = s - f, c[2] = o + u, c[3] = s - f, c[4] = o, c[5] = s, c[6] = o + u, 
        c[7] = s, this._ground.geometry.updateData("aTexCoord", c);
    }, vc._getGroundDefines = function(e) {
        this._defines || (this._defines = {});
        var n = this._defines, t = this._layer._getSceneConfig();
        function r(e, t) {
            e ? n[t] || (n[t] = 1) : n[t] && delete n[t];
        }
        r(this._hasIBL(), "HAS_IBL_LIGHTING"), r(e && e.ssr && t.ground && t.ground.symbol && t.ground.symbol.ssr, "HAS_SSR");
        var i = e && t.shadow && t.shadow.enable;
        return r(i, "HAS_SHADOWING"), r(i, "USE_ESM"), r(!!this._polygonPatternFile, "HAS_PATTERN"), 
        r(e && e.ssao, "HAS_SSAO"), n;
    }, vc._updateMaterial = function() {
        var e = this.getSymbol() && this.getSymbol().material;
        if (e) {
            var t = {}, n = !1;
            for (var r in e) if (e.hasOwnProperty(r)) if (0 < r.indexOf("Texture")) {
                var i = e[r];
                if (!i) continue;
                (i = "string" == typeof i ? {
                    url: i,
                    wrap: "repeat"
                } : i).flipY = !0, i.min = "linear", i.mag = "linear", t[r] = new Kn(i, this._loader), 
                n = !0;
            } else t[r] = e[r];
            this.material ? (this._loadingMaterial = new Xo.StandardMaterial(t), this._loadingMaterial.isReady() ? this._onMaterialComplete() : this._loadingMaterial.once("complete", this._bindOnMaterialComplete)) : (this.material = new Xo.StandardMaterial(t), 
            this.material.once("complete", this._bindOnMaterialComplete, this)), n || this._onMaterialComplete();
        }
    }, vc._onMaterialComplete = function() {
        this._loadingMaterial && (this.material.dispose(), this.material = this._loadingMaterial, 
        delete this._loadingMaterial), this.setToRedraw(!0);
    }, vc._createPatternTexture = function(e) {
        var t = this._regl, n = {
            width: e.width,
            height: e.height,
            data: e,
            mag: "linear",
            min: "linear",
            flipY: !1,
            wrap: "repeat"
        };
        return t.texture(n);
    }, vc._updateLights = function(e) {
        e.ambientUpdate && (this._disposeIblTextures(), this._iblTexes = _c(this._regl, this.getMap())), 
        this.setToRedraw();
    }, vc._parseColor = function(e) {
        return Array.isArray(e) && 3 === e.length && e.push(1), e;
    }, Ac);
    function Ac(e, t) {
        this._regl = e, this.renderer = new ut(e), this._layer = t, this._loader = new Pn(), 
        this._bindOnMaterialComplete = this._onMaterialComplete.bind(this), this._init();
    }
    var Tc, Ec = Xo.PBRUtils, Mc = Ec.createIBLTextures, Sc = Ec.disposeIBLTextures, wc = ((Tc = Rc.prototype).paint = function(e) {
        if (this.isEnable() && this._resource) {
            var t = this._getUniformValues(e), n = e && e.renderTarget && e.renderTarget.fbo;
            this.renderer.render(this._shader, t, null, n);
        }
    }, Tc.update = function() {
        var e = this.getMap().getLightManager(), t = e && e.getAmbientResource();
        t !== this._resource && this._iblTexes && (Sc(this._iblTexes), delete this._iblTexes), 
        this._resource = t, this._updateMode();
    }, Tc.dispose = function() {
        this._shader.dispose(), Sc(this._iblTexes), delete this._shader, delete this._iblTexes, 
        delete this._resource;
    }, Tc.getMap = function() {
        return this._layer.getMap();
    }, Tc._updateMode = function() {
        if (this._resource) {
            var e = this._layer._getSceneConfig();
            this._shader.setMode(1, 0, e.environment && e.environment.mode ? 1 : 0);
        }
    }, Tc.isEnable = function() {
        var e = this._layer._getSceneConfig();
        return this._hasIBL() && e && e.environment && e.environment.enable;
    }, Tc._hasIBL = function() {
        var e = this.getMap().getLightManager();
        return !(!e || !e.getAmbientResource());
    }, Tc._getUniformValues = function() {
        var e = this.getMap(), t = this.getMap().getLightManager().getAmbientLight(), n = this._iblTexes;
        n = n || (this._iblTexes = Mc(this._regl, e));
        var r = this._layer.getRenderer().canvas, i = this._layer._getSceneConfig().environment.level || 0, a = n.prefilterMap.width;
        return {
            rgbmRange: n.rgbmRange,
            cubeMap: n.prefilterMap,
            bias: i,
            size: a / Math.pow(2, Math.max(0, i - 1)),
            environmentExposure: n.exposure,
            diffuseSPH: n.sh,
            viewMatrix: e.viewMatrix,
            projMatrix: e.projMatrix,
            resolution: [ r.width, r.height ],
            hsv: t && t.hsv || [ 0, 0, 0 ]
        };
    }, Tc._init = function() {
        var e = this.getMap();
        if (e.on("updatelights", this.update, this), this._shader = new Oi(), e.options.lights) {
            var t = this.getMap().getLightManager().getAmbientResource();
            this._resource = t;
        }
    }, Rc);
    function Rc(e, t) {
        this._maxLevel = 4, this._regl = e, this.renderer = new ut(e), this._layer = t, 
        this._init(), this._updateMode();
    }
    function Oc(e) {
        return e.getUniform("bloom");
    }
    function Cc(e) {
        return e.getUniform("ssr");
    }
    var Bc, Fc = [], Pc = ((Bc = Ic.prototype).setContextIncludes = function() {}, Bc.bloom = function(e, t, n, r, i) {
        if (!this._drawBloom(t)) return e;
        this._bloomPass || (this._bloomPass = new ui(this._regl));
        var a = this._bloomFBO.color[0];
        return this._bloomPass.render(e, a, n, r, i);
    }, Bc._drawBloom = function(e) {
        var t = this._layer.getRenderer(), n = this._regl, r = this._bloomFBO;
        if (r) {
            var i = t.canvas, a = i.width, o = i.height;
            r.width === a && r.height === o || r.resize(a, o), n.clear({
                color: [ 0, 0, 0, 0 ],
                framebuffer: r
            });
        } else {
            var s = this._createFBOInfo(e);
            this._bloomFBO = n.framebuffer(s);
        }
        var u = t.getFrameTime(), f = t.getFrameEvent(), c = t.getFrameContext(), l = c.renderMode, h = c.sceneFilter, d = c.renderTarget;
        c.renderMode = "default", c.sceneFilter = Oc, c.renderTarget = {
            fbo: this._bloomFBO,
            getFramebuffer: Dc,
            getDepthTexture: Nc
        };
        var p = t.glCtx;
        return p.resetDrawCalls(), f ? t.forEachRenderer(function(e) {
            t.clearStencil(e, r), e.drawOnInteracting(f, u, c);
        }) : t.forEachRenderer(function(e) {
            t.clearStencil(e, r), e.draw(u, c);
        }), c.renderMode = l, c.sceneFilter = h, c.renderTarget = d, p.getDrawCalls();
    }, Bc.genSsrMipmap = function(e) {
        this._ssrPass && this._ssrPainted && (this._ssrPass.genMipMap(e), this._ssrFBO._projViewMatrix || (this._ssrFBO._projViewMatrix = []), 
        xs(this._ssrFBO._projViewMatrix, this._layer.getMap().projViewMatrix));
    }, Bc.ssr = function(e) {
        if (!this._ssrFBO || !this._ssrPainted) return e;
        var t = this._ssrFBO.color[0];
        return this._ssrPass.combine(e, t);
    }, Bc.drawSSR = function(e) {
        var t = this._regl, n = this._layer.getRenderer(), r = n.getFrameTime(), i = n.getFrameEvent(), a = n.getFrameContext();
        this._ssrPass || (this._ssrPass = new gi(t));
        var o = this._ssrFBO, s = this._ssrDepthTestFBO;
        if (o) {
            var u = n.canvas, f = u.width, c = u.height;
            o.width === f && o.height === c || o.resize(f, c), s.width === f && s.height === c || s.resize(f, c), 
            t.clear({
                color: [ 0, 0, 0, 0 ],
                depth: 1,
                framebuffer: o
            });
        } else {
            var l = this._createFBOInfo();
            o = this._ssrFBO = t.framebuffer(l);
            var h = this._createFBOInfo(e, "rgba4");
            s = this._ssrDepthTestFBO = t.framebuffer(h);
        }
        a.ssr = this._prepareSSRContext(e);
        var d = a.renderMode, p = a.sceneFilter;
        a.renderMode = "default", a.sceneFilter = Cc;
        var v = n.glCtx, m = !1;
        i ? n.forEachRenderer(function(e) {
            n.clearStencil(e, o), n.clearStencil(e, s), m || (v.resetDrawCalls(), m = !0), e.drawOnInteracting(i, r, a);
        }) : n.forEachRenderer(function(e) {
            n.clearStencil(e, o), n.clearStencil(e, s), m || (v.resetDrawCalls(), m = !0), e.draw(r, a);
        });
        var g = n.drawGround();
        return delete a.ssr, a.renderMode = d, a.sceneFilter = p, this._ssrPainted = 0 < v.getDrawCalls(), 
        g;
    }, Bc._prepareSSRContext = function(e) {
        var t = this._layer._getSceneConfig(), n = t && t.postProcess, r = this._layer.getMap(), i = this._ssrPass.getMipmapTexture(), a = this._ssrFBO, o = this._ssrDepthTestFBO;
        return {
            renderUniforms: {
                TextureDepthTest: this._ssrDepthTestFBO.color[0],
                TextureDepth: e,
                TextureToBeRefracted: i,
                uSsrFactor: n.ssr.factor || 1,
                uSsrQuality: n.ssr.quality || 2,
                uPreviousGlobalTexSize: [ i.width, i.height / 2 ],
                uGlobalTexSize: [ e.width, e.height ],
                uTextureToBeRefractedSize: [ i.width, i.height ],
                fov: r.getFov() * Math.PI / 180,
                prevProjViewMatrix: a._projViewMatrix || r.projViewMatrix,
                cameraWorldMatrix: r.cameraWorldMatrix
            },
            fbo: a,
            depthTestFbo: o
        };
    }, Bc.taa = function(e, t, n) {
        var r = n.projMatrix, i = n.projViewMatrix, a = n.cameraWorldMatrix, o = n.fov, s = n.near, u = n.far, f = n.needClear, c = n.taa, l = this._taaPass;
        return {
            outputTex: l.render(e, t, r, i, a, o, s, u, f, c),
            redraw: l.needToRedraw()
        };
    }, Bc.ssao = function(e, t, n) {
        return this._ssaoPass || (this._ssaoPass = new Gr(this._renderer), this._layer.getRenderer().setToRedraw()), 
        this._ssaoPass.render({
            projMatrix: n.projMatrix,
            cameraNear: n.cameraNear,
            cameraFar: n.cameraFar,
            bias: n.ssaoBias,
            radius: n.ssaoRadius,
            intensity: n.ssaoIntensity,
            quality: .6
        }, e, t);
    }, Bc.fxaa = function(e, t, n, r, i, a, o, s, u, f, c, l, h) {
        this._renderer.render(this._fxaaShader, {
            textureSource: e,
            noAaTextureSource: t,
            resolution: Ef(Fc, e.width, e.height),
            enableFXAA: n,
            enableToneMapping: r,
            enableSharpen: i,
            pixelRatio: a,
            sharpFactor: o,
            enableOutline: s,
            textureOutline: u,
            highlightFactor: f,
            outlineFactor: c,
            outlineWidth: l,
            outlineColor: h
        });
    }, Bc.postprocess = function(e, t, n) {
        this._postProcessShader || (this._postProcessShader = new kr());
        var r = n || e.color[0];
        return t.resolution = Ef(Fc, r.width, r.height), t.textureSource = r, t.timeGrain = performance.now(), 
        this._renderer.render(this._postProcessShader, t), this._target;
    }, Bc.dispose = function() {
        this._bloomFBO && (this._bloomFBO.destroy(), delete this._bloomFBO), this._ssrFBO && (this._ssrFBO.destroy(), 
        this._ssrDepthTestFBO.destroy(), delete this._ssrFBO), this._taaPass && (this._taaPass.dispose(), 
        delete this._taaPass), this._ssaoPass && (this._ssaoPass.dispose(), delete this._ssaoPass), 
        this._bloomPass && (this._bloomPass.dispose(), delete this._bloomPass), this._postProcessShader && (this._postProcessShader.dispose(), 
        delete this._postProcessShader), this._fxaaShader && (this._fxaaShader.dispose(), 
        delete this._fxaaShader);
    }, Bc._createFBOInfo = function(e, t) {
        var n = this._layer.getRenderer().canvas, r = n.width, i = n.height, a = {
            width: r,
            height: i,
            colors: [ this._regl.texture({
                min: "nearest",
                mag: "nearest",
                format: t || "rgba",
                width: r,
                height: i
            }) ]
        };
        return e && (a.depthStencil = e), a;
    }, Ic);
    function Ic(e, t, n) {
        this._regl = e, this._layer = t, this._renderer = new ut(e), this._fxaaShader = new wr(), 
        this._taaPass = new Qr(this._renderer, n);
    }
    function Dc(e) {
        return e._framebuffer.framebuffer;
    }
    function Nc(e) {
        return e.depthStencil._texture.texture;
    }
    function Lc(e) {
        return !e.getUniform("bloom") && !e.getUniform("ssr");
    }
    function Uc(e) {
        return !e.getUniform("bloom");
    }
    function qc(e) {
        return !e.getUniform("ssr");
    }
    var zc = function(r) {
        function e() {
            return r.apply(this, arguments) || this;
        }
        o(e, r);
        var t = e.prototype;
        return t.setToRedraw = function() {
            this.setRetireFrames(), r.prototype.setToRedraw.call(this);
        }, t.onAdd = function() {
            r.prototype.onAdd.call(this), this.prepareCanvas();
        }, t.updateSceneConfig = function() {
            this._groundPainter && this._groundPainter.update(), this.setToRedraw();
        }, t.render = function() {
            var t = this;
            if (this.getMap() && this.layer.isVisible()) {
                this.forEachRenderer(function(e) {
                    e._replacedDrawFn || (e.draw = t._buildDrawFn(e.draw), e.drawOnInteracting = t._buildDrawFn(e.drawOnInteracting), 
                    e.setToRedraw = t._buildSetToRedrawFn(e.setToRedraw), e._replacedDrawFn = !0);
                }), this.prepareRender(), this.prepareCanvas(), this.layer._updatePolygonOffset();
                for (var e = arguments.length, n = new Array(e), r = 0; r < e; r++) n[r] = arguments[r];
                this._renderChildLayers("render", n), this._toRedraw = !1, this._renderOutlines(), 
                this._postProcess();
            }
        }, t.drawOnInteracting = function() {
            if (this.getMap() && this.layer.isVisible()) {
                this.layer._updatePolygonOffset();
                for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++) t[n] = arguments[n];
                this._renderChildLayers("drawOnInteracting", t), this._toRedraw = !1, this._renderOutlines(), 
                this._postProcess();
            }
        }, t._renderChildLayers = function(n, r) {
            var i = this;
            this._renderMode = "default";
            var e = this.hasRenderTarget();
            e && (this._renderMode = "aa");
            var t = r[0];
            Gc(t) || (t = r[1]), t !== this._contextFrameTime && (this._drawContext = this._prepareDrawContext(), 
            this._contextFrameTime = t, this._frameEvent = Gc(r[0]) ? null : r[0]), this._envPainter || (this._envPainter = new wc(this._regl, this.layer)), 
            this._envPainter.paint(this._drawContext), this.drawGround();
            var a = !1;
            this.forEachRenderer(function(e, t) {
                t.isVisible() && (e.hasNoAARendering && e.hasNoAARendering() && (a = !0), i.clearStencil(e, i._targetFBO), 
                e[n].apply(e, r));
            }), this._postProcessor && this.isSSROn() && this._postProcessor.drawSSR(this._depthTex), 
            a && e && (this._renderMode = this._drawContext.renderMode = "noAa", this.forEachRenderer(function(e, t) {
                t.isVisible() && e.hasNoAARendering && e.hasNoAARendering() && (i.clearStencil(e, i._targetFBO), 
                e[n].apply(e, r));
            }));
        }, t._renderOutlines = function() {
            if (this.isEnableOutline()) {
                var n = this._getOutlineFBO(), e = this.glCtx;
                e.resetDrawCalls(), this.forEachRenderer(function(e, t) {
                    t.isVisible() && e.drawOutline && e.drawOutline(n);
                }), this._outlineCounts = e.getDrawCalls();
            }
        }, t._getOutlineFBO = function() {
            var e = this.canvas, t = e.width, n = e.height, r = this._outlineFBO;
            if (r) t === r.width && n === r.height || r.resize(t, n); else {
                var i = this._regl.texture({
                    width: t,
                    height: n,
                    format: "rgba4"
                });
                r = this._outlineFBO = this._regl.framebuffer({
                    width: t,
                    height: n,
                    colors: [ i ],
                    depth: !1,
                    stencil: !1
                });
            }
            return r;
        }, t.hasRenderTarget = function() {
            var e = this.layer._getSceneConfig(), t = e && e.postProcess;
            return !(!t || !t.enable);
        }, t.testIfNeedRedraw = function() {
            if (this._toRedraw) return !(this._toRedraw = !1);
            if (this.getMap().isInteracting() && this._groundPainter && this._groundPainter.isEnable()) return !0;
            for (var e, t = a(this.layer.getLayers()); !(e = t()).done; ) {
                var n = e.value.getRenderer();
                if (n && n.testIfNeedRedraw()) return this.setRetireFrames(), !0;
            }
            return !1;
        }, t.isRenderComplete = function() {
            for (var e, t = a(this.layer.getLayers()); !(e = t()).done; ) {
                var n = e.value.getRenderer();
                if (n && !n.isRenderComplete()) return !1;
            }
            return !0;
        }, t.mustRenderOnInteracting = function() {
            for (var e, t = a(this.layer.getLayers()); !(e = t()).done; ) {
                var n = e.value.getRenderer();
                if (n && n.mustRenderOnInteracting()) return !0;
            }
            return !1;
        }, t.isCanvasUpdated = function() {
            if (r.prototype.isCanvasUpdated.call(this)) return !0;
            for (var e, t = a(this.layer.getLayers()); !(e = t()).done; ) {
                var n = e.value.getRenderer();
                if (n && n.isCanvasUpdated()) return !0;
            }
            return !1;
        }, t.isBlank = function() {
            if (this._groundPainter && this._groundPainter.isEnable()) return !1;
            for (var e, t = a(this.layer.getLayers()); !(e = t()).done; ) {
                var n = e.value.getRenderer();
                if (n && !n.isBlank()) return !1;
            }
            return !0;
        }, t.createContext = function() {
            var e = this, t = this.layer, n = t.options.glOptions || {
                alpha: !0,
                depth: !0,
                stencil: !0
            };
            n.preserveDrawingBuffer = !0, n.antialias = t.options.antialias, this.glOptions = n;
            var r = this.gl = this._createGLContext(this.canvas, n);
            this._initGL(r), r.wrap = function() {
                return new uc(e.gl);
            }, this.glCtx = r.wrap(), this.canvas.gl = this.gl, this._reglGL = r.wrap(), this._regl = c({
                gl: this._reglGL,
                attributes: n,
                extensions: t.options.extensions,
                optionalExtensions: t.options.optionalExtensions
            }), this.gl.regl = this._regl, this._jitter = [ 0, 0 ];
        }, t._initGL = function() {
            var e = this.layer, t = this.gl, n = e.options.extensions;
            n && n.forEach(function(e) {
                t.getExtension(e);
            });
            var r = e.options.optionalExtensions;
            r && r.forEach(function(e) {
                t.getExtension(e);
            }), this.gl.clearColor(0, 0, 0, 0);
        }, t.clearCanvas = function() {
            r.prototype.clearCanvas.call(this), this._regl.clear({
                color: [ 0, 0, 0, 0 ],
                depth: 1,
                stencil: 255
            }), this._targetFBO && (this._regl.clear({
                color: [ 0, 0, 0, 0 ],
                depth: 1,
                stencil: 255,
                framebuffer: this._targetFBO
            }), this._regl.clear({
                color: [ 0, 0, 0, 0 ],
                framebuffer: this._noAaFBO
            })), this._outlineFBO && this._regl.clear({
                color: [ 0, 0, 0, 0 ],
                framebuffer: this._outlineFBO
            });
        }, t.resizeCanvas = function() {
            r.prototype.resizeCanvas.call(this), !this._targetFBO || this._targetFBO.width === this.canvas.width && this._targetFBO.height === this.canvas.height || (this._targetFBO.resize(this.canvas.width, this.canvas.height), 
            this._noAaFBO.resize(this.canvas.width, this.canvas.height)), this.forEachRenderer(function(e) {
                e.canvas && e.resizeCanvas();
            });
        }, t.getCanvasImage = function() {
            return this.forEachRenderer(function(e) {
                e.getCanvasImage();
            }), r.prototype.getCanvasImage.call(this);
        }, t.forEachRenderer = function(e) {
            for (var t, n = a(this.layer.getLayers()); !(t = n()).done; ) {
                var r = t.value, i = r.getRenderer();
                i && e(i, r);
            }
        }, t._createGLContext = function(e, t) {
            for (var n = this.layer.options.onlyWebGL1 ? [ "webgl", "experimental-webgl" ] : [ "webgl2", "webgl", "experimental-webgl" ], r = null, i = 0; i < n.length; ++i) {
                try {
                    r = e.getContext(n[i], t);
                } catch (e) {}
                if (r) break;
            }
            return r;
        }, t.clearStencil = function(e, t) {
            var n = {
                stencil: e.getStencilValue ? e.getStencilValue() : 255
            };
            t && (n.framebuffer = t), this._regl.clear(n);
        }, t.onRemove = function() {
            this.canvas.pickingFBO && this.canvas.pickingFBO.destroy && this.canvas.pickingFBO.destroy(), 
            this._clearFramebuffers(), this._groundPainter && (this._groundPainter.dispose(), 
            delete this._groundPainter), this._envPainter && (this._envPainter.dispose(), delete this._envPainter), 
            this._shadowPass && (this._shadowPass.dispose(), delete this._shadowPass), this._postProcessor && (this._postProcessor.dispose(), 
            delete this._postProcessor), this._outlineFBO && (this._outlineFBO.destroy(), delete this._outlineFBO), 
            r.prototype.onRemove.call(this);
        }, t._clearFramebuffers = function() {
            this._targetFBO && (this._targetFBO.destroy(), this._noAaFBO.destroy(), delete this._targetFBO, 
            delete this._noAaFBO);
        }, t.setRetireFrames = function() {
            this._needRetireFrames = !0;
        }, t.getFrameTime = function() {
            return this._contextFrameTime;
        }, t.getFrameEvent = function() {
            return this._frameEvent;
        }, t.getFrameContext = function() {
            return this._drawContext;
        }, t.drawGround = function() {
            return this._groundPainter || (this._groundPainter = new yc(this._regl, this.layer)), 
            this._groundPainter.paint(this.getFrameContext());
        }, t._buildDrawFn = function(r) {
            var i = this;
            return function(e, t, n) {
                return Gc(e) && (n = t, t = e, e = null), n && n.renderTarget && (n.renderTarget.getFramebuffer = Hc, 
                n.renderTarget.getDepthTexture = Vc), e ? r.call(this, e, t, n || i._drawContext) : r.call(this, t, n || i._drawContext);
            };
        }, t._buildSetToRedrawFn = function(r) {
            var i = this;
            return function() {
                i.setRetireFrames();
                for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++) t[n] = arguments[n];
                return r.apply(this, t);
            };
        }, t.isEnableSSR = function() {
            var e = this.layer._getSceneConfig(), t = e && e.postProcess;
            return t && t.enable && t.ssr && t.ssr.enable;
        }, t.isSSROn = function() {
            return !!this.isEnableSSR() && (this._ssrpainted ? 10 < this.getMap().getPitch() : this._ssrpainted = !0);
        }, t.isEnableSSAO = function() {
            var e = this.layer._getSceneConfig(), t = e && e.postProcess;
            return t && t.enable && t.ssao && t.ssao.enable;
        }, t.isEnableOutline = function() {
            var e = this.layer._getSceneConfig(), t = e && e.postProcess;
            return t && t.enable && t.outline && t.outline.enable;
        }, t._getViewStates = function() {
            var e = this.layer.getMap();
            if (!this._renderedView) {
                var t = !(this._renderedView = {
                    center: e.getCenter(),
                    bearing: e.getBearing(),
                    pitch: e.getPitch()
                });
                if (e.options.lights) {
                    var n = e.getLightManager().getDirectionalLight().direction;
                    this._renderedView.lightDirection = Is([], n), t = !0;
                }
                return {
                    viewChanged: !0,
                    lightDirectionChanged: t
                };
            }
            var r = e.coordToContainerPoint(this._renderedView.center), i = this.layer.options.viewMoveThreshold, a = r._sub(e.width / 2, e.height / 2).mag() > i, o = !1;
            if (e.options.lights) {
                var s = e.getLightManager().getDirectionalLight().direction;
                (o = !js(this._renderedView.lightDirection, s)) && (this._renderedView.lightDirection = Is([], s));
            }
            return a && (this._renderedView.center = e.getCenter(), this._renderedView.bearing = e.getBearing(), 
            this._renderedView.pitch = e.getPitch()), {
                viewChanged: a,
                lightDirectionChanged: o
            };
        }, t._prepareDrawContext = function() {
            var e, n = this, t = this.layer._getSceneConfig(), r = t && t.postProcess, i = {
                renderMode: this._renderMode || "default",
                includes: {},
                states: this._getViewStates()
            };
            if (r && r.enable) {
                if (r.antialias && r.antialias.enable) {
                    var a = r.antialias.jitterRatio || .25, o = this._jitGetter;
                    o ? o.setRatio(a) : o = this._jitGetter = new ni(a);
                    var s = this.getMap(), u = r.antialias && r.antialias.enable && r.antialias.taa;
                    s.isInteracting() && !u && o.reset(), o.getJitter(this._jitter), o.frame();
                } else Ef(this._jitter, 0, 0);
                i.jitter = this._jitter;
                var f = r.bloom && r.bloom.enable, c = this.isSSROn();
                f && c ? (i.bloom = 1, i.sceneFilter = Lc) : f ? (i.bloom = 1, i.sceneFilter = Uc) : c && (i.sceneFilter = qc), 
                (e = this._getFramebufferTarget()) && (i.renderTarget = e);
            } else this._clearFramebuffers();
            return this._renderAnalysis(i, e), "noAa" !== this._renderMode && (this.forEachRenderer(function(e, t) {
                t.isVisible() && e.needRetireFrames && e.needRetireFrames() && n.setRetireFrames();
            }), this._shadowContext = this._prepareShadowContext(i), this._shadowContext && (i.includes.shadow = 1), 
            this._includesState = this._updateIncludesState(i)), this._shadowContext && (i.shadow = this._shadowContext, 
            i.includes.shadow = 1), i.states.includesChanged = this._includesState, r && r.enable && this._postProcessor && this._postProcessor.setContextIncludes(i), 
            i;
        }, t._renderAnalysis = function(e, t) {
            var r = [];
            this.forEachRenderer(function(e) {
                if (e.getAnalysisMeshes) {
                    var t = e.getAnalysisMeshes();
                    if (Array.isArray(t)) for (var n = 0; n < t.length; n++) r.push(t[n]);
                }
            });
            var n = this.layer._analysisTaskList;
            if (n) for (var i = 0; i < n.length; i++) {
                n[i].renderAnalysis(e, r, t && t.fbo);
            }
        }, t._updateIncludesState = function(e) {
            var t = !1, n = Object.keys(e.includes), r = this._prevIncludeKeys;
            if (r) {
                var i = n.filter(function(e) {
                    return -1 === r.indexOf(e);
                }).concat(r.filter(function(e) {
                    return -1 === n.indexOf(e);
                }));
                i.length && (t = i.reduce(function(e, t) {
                    return e[t] = 1, e;
                }, {}));
            }
            return this._prevIncludeKeys = n, t;
        }, t._prepareShadowContext = function(e) {
            var t = this.layer._getSceneConfig();
            if (!t || !t.shadow || !t.shadow.enable) return this._shadowPass && (this._shadowPass.dispose(), 
            delete this._shadowPass), null;
            this._shadowPass || (this._shadowPass = new mc(this._regl, t, this.layer));
            var n = {
                config: t.shadow,
                defines: this._shadowPass.getDefines(),
                uniformDeclares: mc.getUniformDeclares()
            };
            return n.renderUniforms = this._renderShadow(e), n;
        }, t._renderShadow = function(e) {
            var t = e.renderTarget && e.renderTarget.fbo, n = this.layer._getSceneConfig(), r = [], i = e.states.lightDirectionChanged || e.states.viewChanged || this._needRetireFrames;
            this.forEachRenderer(function(e) {
                if (e.getShadowMeshes) {
                    var t = e.getShadowMeshes();
                    if (Array.isArray(t)) for (var n = 0; n < t.length; n++) t[n].needUpdateShadow && (i = !0), 
                    t[n].needUpdateShadow = !1, r.push(t[n]);
                }
            }), this._shadowScene || (this._shadowScene = new qn()), this._shadowScene.setMeshes(r);
            var a = this.getMap(), o = n.shadow, s = a.getLightManager().getDirectionalLight().direction, u = !n.ground || !n.ground.enable, f = this._shadowPass.render(u, a.projMatrix, a.viewMatrix, o.color, o.opacity, s, this._shadowScene, this._jitter, t, i);
            return this._shadowPass.isUpdated() && this.setRetireFrames(), f;
        }, t._getFramebufferTarget = function() {
            var e = this.layer._getSceneConfig(), t = e && e.postProcess;
            if (!this._targetFBO) {
                var n = this._regl, r = this._createFBOInfo(t);
                this._depthTex = r.depth || r.depthStencil, this._targetFBO = n.framebuffer(r);
                var i = this._createFBOInfo(t, this._depthTex);
                this._noAaFBO = n.framebuffer(i);
            }
            return {
                fbo: this._targetFBO,
                noAaFbo: this._noAaFBO
            };
        }, t._createFBOInfo = function(e, t) {
            var n = this.canvas.width, r = this.canvas.height, i = this._regl, a = {
                width: n,
                height: r,
                colors: [ i.texture({
                    min: "nearest",
                    mag: "nearest",
                    type: "uint8",
                    width: n,
                    height: r
                }) ],
                colorFormat: "rgba"
            };
            if (i.hasExtension("WEBGL_depth_texture")) {
                var o = t || i.texture({
                    min: "nearest",
                    mag: "nearest",
                    mipmap: !1,
                    type: "depth stencil",
                    width: n,
                    height: r,
                    format: "depth stencil"
                });
                a.depthStencil = o;
            } else {
                var s = t || i.renderbuffer({
                    width: n,
                    height: r,
                    format: "depth stencil"
                });
                a.depthStencil = s;
            }
            return a;
        }, t._postProcess = function() {
            if (this._targetFBO) {
                var e = this.layer._getSceneConfig(), t = e && e.postProcess;
                if (t && t.enable) {
                    var n = this.layer.getMap();
                    this._postProcessor || (this._postProcessor = new Pc(this._regl, this.layer, this._jitGetter));
                    var r = this._targetFBO.color[0], i = this.isSSROn();
                    if (i && (r = this._postProcessor.ssr(r)), this.isEnableSSAO() && (r = this._postProcessor.ssao(r, this._depthTex, {
                        projMatrix: n.projMatrix,
                        cameraNear: n.cameraNear,
                        cameraFar: n.cameraFar,
                        ssaoBias: t.ssao && t.ssao.bias || 10,
                        ssaoRadius: t.ssao && t.ssao.radius || 100,
                        ssaoIntensity: t.ssao && t.ssao.intensity || .5
                    })), t.bloom && t.bloom.enable) {
                        var a = t.bloom, o = +a.threshold || 0, s = kc(a, "factor", 1), u = kc(a, "radius", 1);
                        r = this._postProcessor.bloom(r, this._depthTex, o, s, u);
                    }
                    if (t.antialias && t.antialias.enable) {
                        var f = this._postProcessor.taa(r, this._depthTex, {
                            projMatrix: n.projMatrix,
                            projViewMatrix: n.projViewMatrix,
                            cameraWorldMatrix: n.cameraWorldMatrix,
                            fov: n.getFov() * Math.PI / 180,
                            jitter: this._jitter,
                            near: n.cameraNear,
                            far: n.cameraFar,
                            needClear: this._needRetireFrames || n.getRenderer().isViewChanged(),
                            taa: !!t.antialias.taa
                        });
                        r = f.outputTex, f.redraw && this.setToRedraw(), this._needRetireFrames = !1;
                    }
                    var c = t.sharpen && t.sharpen.factor;
                    c || 0 === c || (c = .2);
                    var l = 0, h = .2, d = .3, p = 1, v = [ 1, 1, 0 ];
                    t.outline && (l = +!!t.outline.enable, h = kc(t.outline, "highlightFactor", h), 
                    d = kc(t.outline, "outlineFactor", d), p = kc(t.outline, "outlineWidth", p), v = kc(t.outline, "outlineColor", v)), 
                    this._postProcessor.fxaa(r, this._noAaFBO.color[0], 1, +!(!t.toneMapping || !t.toneMapping.enable), +!(!t.sharpen || !t.sharpen.enable), n.getDevicePixelRatio(), c, l && +(0 < this._outlineCounts), this._getOutlineFBO(), h, d, p, v), 
                    i && this._postProcessor.genSsrMipmap(r);
                }
            } else this._needRetireFrames = !1;
        }, e;
    }(r.renderer.CanvasRenderer);
    function Gc(e) {
        return "number" == typeof e && !isNaN(e);
    }
    function Hc(e) {
        return e._framebuffer.framebuffer;
    }
    function Vc(e) {
        return e.depthStencil._texture.texture;
    }
    function kc(e, t, n) {
        return null == e[t] ? n : e[t];
    }
    var jc = function(i) {
        function n(e, t, n) {
            var r;
            return (r = i.call(this, e, n) || this).layers = t || [], r._checkChildren(), r._layerMap = {}, 
            r;
        }
        o(n, i), n.fromJSON = function(e) {
            if (!e || "GroupGLLayer" !== e.type) return null;
            var t = e.layers.map(function(e) {
                return r.Layer.fromJSON(e);
            });
            return new n(e.id, t, e.options);
        };
        var e = n.prototype;
        return e.setSceneConfig = function(e) {
            this.options.sceneConfig = e;
            var t = this.getRenderer();
            return t && t.updateSceneConfig(), this;
        }, e.getSceneConfig = function() {
            return JSON.parse(JSON.stringify(this.options.sceneConfig || {}));
        }, e._getSceneConfig = function() {
            return this.options.sceneConfig;
        }, e.addLayer = function(e, t) {
            if (e.getMap()) throw new Error("layer(" + e.getId() + " is already added on map");
            void 0 === t ? this.layers.push(e) : this.layers.splice(t, 0, e), this._checkChildren();
            var n = this.getRenderer();
            return n && (this._prepareLayer(e), n.setToRedraw()), this;
        }, e.removeLayer = function(e) {
            r.Util.isString(e) && (e = this.getChildLayer(e));
            var t = this.layers.indexOf(e);
            if (t < 0) return this;
            e._doRemove(), e.off("show hide", this._onLayerShowHide, this), delete this._layerMap[e.getId()], 
            this.layers.splice(t, 1);
            var n = this.getRenderer();
            return n && n.setToRedraw(), this;
        }, e._updatePolygonOffset = function() {
            for (var e = 0, t = 0; t < this.layers.length; t++) this.layers[t].setPolygonOffset && this.layers[t].getPolygonOffsetCount && (e += this.layers[t].getPolygonOffsetCount());
            for (var n = 0, r = 0; r < this.layers.length; r++) this.layers[r].setPolygonOffset && this.layers[r].getPolygonOffsetCount && (this.layers[r].setPolygonOffset(n, e), 
            n += this.layers[r].getPolygonOffsetCount());
        }, e.getLayers = function() {
            return this.layers;
        }, e.toJSON = function() {
            var e = [];
            if (this.layers) for (var t = 0; t < this.layers.length; t++) {
                var n = this.layers[t];
                n && n && n.toJSON && e.push(n.toJSON());
            }
            return {
                type: this.getJSONType(),
                id: this.getId(),
                layers: e,
                options: this.config()
            };
        }, e.onLoadEnd = function() {
            var t = this;
            this.layers.forEach(function(e) {
                t._prepareLayer(e);
            }), i.prototype.onLoadEnd.call(this);
        }, e._prepareLayer = function(e) {
            var t = this.getMap();
            (this._layerMap[e.getId()] = e)._canvas = this.getRenderer().canvas, e._bindMap(t), 
            e.once("renderercreate", this._onChildRendererCreate, this), e.load(), this._bindChildListeners(e);
        }, e.onRemove = function() {
            var t = this;
            this.layers.forEach(function(e) {
                e._doRemove(), e.off("show hide", t._onLayerShowHide, t);
            }), delete this._layerMap, i.prototype.onRemove.call(this);
        }, e.getChildLayer = function(e) {
            return this._layerMap[e] || null;
        }, e.getLayer = function(e) {
            return this.getChildLayer(e);
        }, e._bindChildListeners = function(e) {
            e.on("show hide", this._onLayerShowHide, this);
        }, e._onLayerShowHide = function() {
            var e = this.getRenderer();
            e && e.setToRedraw();
        }, e._onChildRendererCreate = function(e) {
            e.renderer.clearCanvas = Wc;
        }, e._checkChildren = function() {
            var n = this, r = {};
            this.layers.forEach(function(e) {
                var t = e.getId();
                if (r[t]) throw new Error("Duplicate child layer id (" + t + ") in the GroupGLLayer (" + n.getId() + ")");
                r[t] = 1;
            });
        }, e.addAnalysis = function(e) {
            this._analysisTaskList = this._analysisTaskList || [], this._analysisTaskList.push(e);
            var t = this.getRenderer();
            t && t.setToRedraw();
        }, e.removeAnalysis = function(e) {
            if (this._analysisTaskList) {
                var t = this._analysisTaskList.indexOf(e);
                -1 < t && this._analysisTaskList.splice(t, 1);
            }
            var n = this.getRenderer();
            n && n.setToRedraw();
        }, n;
    }(r.Layer);
    function Wc() {}
    jc.mergeOptions({
        renderer: "gl",
        antialias: !1,
        extensions: [],
        onlyWebGL1: !1,
        optionalExtensions: [ "ANGLE_instanced_arrays", "OES_element_index_uint", "OES_standard_derivatives", "OES_vertex_array_object", "OES_texture_half_float", "OES_texture_half_float_linear", "OES_texture_float", "OES_texture_float_linear", "WEBGL_depth_texture", "EXT_shader_texture_lod" ],
        forceRenderOnZooming: !0,
        forceRenderOnMoving: !0,
        forceRenderOnRotating: !0,
        viewMoveThreshold: 100
    }), jc.registerJSONType("GroupGLLayer"), jc.registerRenderer("gl", zc), jc.registerRenderer("canvas", null);
    var Xc, Yc = ((Xc = Kc.prototype).render = function(e, t, n) {
        this._check();
        var r = this._layer.getMap();
        this.renderer.regl.clear({
            color: [ 0, 0, 0, 0 ],
            depth: 1,
            stencil: 255,
            framebuffer: this._heatmapFBO
        }), this.renderer.render(this._heatmapShader, t, e, this._heatmapFBO);
        var i = dc({
            colorRamp: this._colorRampTex,
            inputTexture: this._heatmapFBO,
            projViewMatrix: r.projViewMatrix
        }, t);
        this._transformGround(), this.renderer.render(this._displayShader, i, this._groundScene, n);
    }, Xc.dispose = function() {
        this._heatmapShader && (this._heatmapShader.dispose(), delete this._heatmapShader), 
        this._displayShader && (this._displayShader.dispose(), delete this._displayShader), 
        this._ground && (this._ground.geometry.dispose(), this._ground.dispose(), delete this._ground, 
        delete this._groundScene), this._heatmapFBO && (this._heatmapFBO.destroy(), delete this._heatmapFBO);
    }, Xc._createColorRamp = function() {
        var e = this._colorStops, t = this._rampCanvas, n = this._rampCtx;
        n ? n.clearRect(0, 0, 256, 1) : ((t = this._rampCanvas = document.createElement("canvas")).width = 256, 
        t.height = 1, n = this._rampCtx = t.getContext("2d"));
        for (var r = n.createLinearGradient(0, 0, 256, 1), i = 0; i < e.length; i++) r.addColorStop(e[i][0], e[i][1]);
        n.fillStyle = r, n.fillRect(0, 0, 256, 1), this._colorRampTex && this._colorRampTex.destroy();
        var a = this.renderer.regl;
        this._colorRampTex = a.texture({
            width: 256,
            height: 1,
            data: t,
            min: "linear",
            mag: "linear",
            premultiplyAlpha: !0
        });
    }, Xc._check = function() {
        var e = this._layer.getRenderer().canvas, t = Math.ceil(e.width / 4), n = Math.ceil(e.height / 4), r = this._heatmapFBO;
        r.width === t && r.height === n || r.resize(t, n);
    }, Xc._init = function() {
        this._createColorRamp(), this._createShader(), this._createHeatmapTex(), this._createGround();
    }, Xc._createGround = function() {
        var e = new Qn();
        e.generateBuffers(this.renderer.regl), this._ground = new fn(e), this._groundScene = new qn([ this._ground ]);
    }, Xc._transformGround = function() {
        var e = this._layer.getMap(), t = lc(this._ground.localTransform, e);
        this._ground.setLocalTransform(t);
    }, Xc._createHeatmapTex = function() {
        var e = this._layer.getRenderer().canvas, t = this.renderer.regl, n = t.hasExtension("OES_texture_half_float") ? "half float" : "float", r = Math.ceil(e.width / 4), i = Math.ceil(e.height / 4), a = t.texture({
            width: r,
            height: i,
            type: n,
            min: "linear",
            mag: "linear",
            format: "rgba"
        });
        this._heatmapFBO = t.framebuffer({
            width: r,
            height: i,
            color: [ a ]
        });
    }, Xc._createShader = function() {
        var e = this._layer.getRenderer().canvas, t = this.sceneConfig.depthRange, n = {
            viewport: {
                x: 0,
                y: 0,
                width: function() {
                    return e ? Math.ceil(e.width / 4) : 1;
                },
                height: function() {
                    return e ? Math.ceil(e.height / 4) : 1;
                }
            },
            depth: {
                enable: !0,
                func: "always"
            }
        };
        this._stencil && (n.stencil = this._stencil), this._heatmapShader = new Ei({
            extraCommandProps: n
        }), this._displayShader = new Ci({
            extraCommandProps: {
                stencil: {
                    enable: !1
                },
                depth: {
                    enable: !0,
                    range: t || [ 0, 1 ],
                    func: "<="
                },
                polygonOffset: {
                    enable: !0,
                    offset: this._polygonOffset
                }
            }
        });
    }, Kc);
    function Kc(e, t, n, r, i, a) {
        this.renderer = new ut(e), this.sceneConfig = t, this._layer = n, this._colorStops = r, 
        this._stencil = i, this._polygonOffset = a || {
            factor: 0,
            units: 0
        }, this._init();
    }
    var Jc = function(e) {
        function t() {
            return e.apply(this, arguments) || this;
        }
        o(t, e);
        var n = t.prototype;
        return n.addTo = function(e) {
            this.layer = e;
        }, n.renderAnalysis = function(e) {
            var t = this.getAnalysisType();
            e.includes[t] = 1, e[t] = {
                defines: this.getDefines()
            };
        }, n.remove = function() {
            this.layer && (this.layer.removeAnalysis(this), delete this.layer);
        }, n.update = function(e, t) {
            this.options[e] = t;
            var n = this.layer.getRenderer();
            n && n.setToRedraw();
        }, n.getAnalysisType = function() {
            return this.type;
        }, t;
    }(r.Eventable(r.Handlerable(r.Class))), Qc = function(a) {
        function e(e) {
            var t;
            return (t = a.call(this, e) || this).type = "viewshed", t;
        }
        o(e, a);
        var t = e.prototype;
        return t.addTo = function(e) {
            var t = this;
            a.prototype.addTo.call(this, e);
            var n = this.layer.getRenderer(), r = this.layer.getMap();
            return this._renderOptions = {}, this._renderOptions.eyePos = Zc(r, this.options.eyePos), 
            this._renderOptions.lookPoint = Zc(r, this.options.lookPoint), this._renderOptions.verticalAngle = this.options.verticalAngle, 
            this._renderOptions.horizonAngle = this.options.horizonAngle, n ? this._setViewshedPass(n) : this.layer.once("renderercreate", function(e) {
                t._setViewshedPass(e.renderer);
            }, this), this;
        }, t.update = function(e, t) {
            if (0 < t.length) {
                var n = this.layer.getMap();
                this._renderOptions[e] = Zc(n, t);
            } else this._renderOptions[e] = t;
            a.prototype.update.call(this, e, t);
        }, t._setViewshedPass = function(e) {
            var t = {
                x: 0,
                y: 0,
                width: function() {
                    return e.canvas ? e.canvas.width : 1;
                },
                height: function() {
                    return e.canvas ? e.canvas.height : 1;
                }
            }, n = new ut(e._regl);
            this._viewshedPass = new yi(n, t) || this._viewshedPass, this.layer.addAnalysis(this);
        }, t.renderAnalysis = function(e, t) {
            a.prototype.renderAnalysis.call(this, e);
            var n = this.getAnalysisType(), r = {}, i = this._viewshedPass.render(t, this._renderOptions);
            r.viewshed_depthMapFromViewpoint = i.depthMap, r.viewshed_projViewMatrixFromViewpoint = i.projViewMatrixFromViewpoint, 
            r.viewshed_visibleColor = this._renderOptions.visibleColor || [ 0, 1, 0, 1 ], r.viewshed_invisibleColor = this._renderOptions.invisibleColor || [ 1, 0, 0, 1 ], 
            e[n].renderUniforms = r;
        }, t.getDefines = function() {
            return {
                HAS_VIEWSHED: 1
            };
        }, t.remove = function() {
            a.prototype.remove.call(this), this._viewshedPass && this._viewshedPass.dispose();
        }, e;
    }(Jc);
    function Zc(e, t) {
        if (!e) return null;
        var n = e.coordinateToPoint(new r.Coordinate(t[0], t[1]), e.getGLZoom());
        return [ n.x, n.y, t[2] ];
    }
    var $c, el, tl, nl, rl, il = function(n) {
        function e(e) {
            var t;
            return (t = n.call(this, e) || this).type = "floodAnalysis", t;
        }
        o(e, n);
        var t = e.prototype;
        return t.addTo = function(e) {
            return n.prototype.addTo.call(this, e), this.layer.addAnalysis(this), this;
        }, t.renderAnalysis = function(e) {
            n.prototype.renderAnalysis.call(this, e), e[this.getAnalysisType()].renderUniforms = this._createUniforms();
        }, t._createUniforms = function() {
            var e = {};
            return e.flood_waterHeight = this.options.waterHeight, e.flood_waterColor = this.options.waterColor, 
            e;
        }, t.getDefines = function() {
            return {
                HAS_FLOODANALYSE: 1
            };
        }, e;
    }(Jc), al = function(a) {
        function e(e) {
            var t;
            return (t = a.call(this, e) || this).type = "skyline", t;
        }
        o(e, a);
        var t = e.prototype;
        return t.addTo = function(e) {
            var t = this;
            a.prototype.addTo.call(this, e);
            var n = this.layer.getRenderer();
            return n ? this._setSkylinePass(n) : this.layer.once("renderercreate", function(e) {
                t._setSkylinePass(e.renderer);
            }, this), this;
        }, t._setSkylinePass = function(e) {
            var t = {
                width: e.canvas.width,
                height: e.canvas.height
            }, n = new ut(e._regl);
            this._skylinePass = new _i(n, t) || this._skylinePass, this.layer.addAnalysis(this), 
            this._ground = this._createGround(e._regl);
        }, t.renderAnalysis = function(e, t, n) {
            a.prototype.renderAnalysis.call(this, e), this._ground = this._ground || this._createGround();
            var r = this.layer.getMap();
            this._transformGround(r);
            var i = t.concat([ this._ground ]);
            this._skylinePass.render(i, n, {
                projViewMatrix: r.projViewMatrix,
                lineColor: this.options.lineColor,
                lineWidth: this.options.lineWidth
            });
        }, t._createGround = function(e) {
            var t = new Qn();
            return t.generateBuffers(e), t.data.aTexCoord = new Float32Array(8), new fn(t);
        }, t._transformGround = function(e) {
            var t = lc(this._ground.localTransform, e);
            this._ground.setLocalTransform(t);
        }, t.remove = function() {
            a.prototype.remove.call(this), this._skylinePass && this._skylinePass.dispose(), 
            this._ground && (this._ground.geometry.dispose(), delete this._ground);
        }, t.getDefines = function() {
            return null;
        }, e;
    }(Jc), ol = document.createElement("canvas"), sl = c({
        canvas: ol,
        attributes: {
            depth: !1,
            stencil: !1,
            alpha: !1
        }
    }), ul = (($c = fl.prototype).getDirectionalLight = function() {
        return this._config && this._config.directional;
    }, $c.getAmbientLight = function() {
        return this._config && this._config.ambient;
    }, $c.getAmbientResource = function() {
        return this._iblMaps;
    }, $c.setConfig = function(e) {
        var t, n, r = this._config;
        if (this._config = JSON.parse(JSON.stringify(e)), e && e.ambient && e.ambient.resource) {
            if (!(r && r.ambient && (t = r.ambient, n = e.ambient, t.resource && t.resource.url === n.resource.url))) return void this._initAmbientResources();
            this._iblMaps && e.ambient.resource.sh && (this._iblMaps.sh = e.ambient.resource.sh);
        } else this._disposeCubeLight();
        this._map.fire("updatelights");
    }, $c._initAmbientResources = function() {
        var e = {
            url: this._config.ambient.resource.url,
            arrayBuffer: !0,
            hdr: !0,
            flipY: !0
        };
        this._hdr = new Kn(e, this._loader), this._hdr.once("complete", this.onHDRLoaded);
    }, $c.dispose = function() {
        this._disposeCubeLight();
    }, $c._onHDRLoaded = function() {
        this._hdr && (this._iblMaps = this._createIBLMaps(this._hdr), this._hdr.dispose(), 
        delete this._hdr, this._map.fire("updatelights", {
            ambientUpdate: !0
        }));
    }, $c._createIBLMaps = function(e) {
        var t = this._config.ambient.resource, n = this._config.ambient.textureSize || 256, r = Xo.PBRHelper.createIBLMaps(sl, {
            envTexture: e.getREGLTexture(sl),
            rgbmRange: e.rgbmRange,
            ignoreSH: !!t.sh,
            envCubeSize: n,
            prefilterCubeSize: n,
            format: "array"
        });
        return e.dispose(), t.sh && (r.sh = t.sh), r;
    }, $c._disposeCubeLight = function() {
        this._hdr && (this._hdr.dispose(), delete this._hdr), delete this._iblMaps;
    }, fl);
    function fl(e) {
        this._map = e, this._loader = new Pn(), this.onHDRLoaded = this._onHDRLoaded.bind(this);
    }
    r.Map.include({
        setLightConfig: function(e) {
            return this.options.lights = e, this._initLightManager(), this;
        },
        getLightConfig: function() {
            return this.options.lights;
        },
        _initLightManager: function() {
            this._lightManager || (this._lightManager = new ul(this)), this._lightManager.setConfig(this.getLightConfig());
        },
        getLightManager: function() {
            return this._lightManager ? this._lightManager : (this._warned || (this._warned = !0, 
            console.warn("map's light config is not set, use map.setLightConfig(config) to set lights.")), 
            null);
        }
    }), r.Map.addOnLoadHook(function() {
        this.options.lights && this._initLightManager();
    });
    var cl = {
        color: [ 0, 0, 0, 0 ]
    }, ll = {
        enable: !0
    };
    r.Map.include({
        setPostProcessConfig: function(e) {
            return this.options.postProcessConfig = e, this;
        },
        getPostProcessConfig: function() {
            return this.options.postProcessConfig;
        }
    });
    var hl = r.renderer.MapCanvasRenderer.prototype.drawLayerCanvas;
    r.renderer.MapCanvasRenderer.prototype.drawLayerCanvas = function() {
        var e = hl.apply(this, arguments);
        return e && function(n, e) {
            el || function(e, t) {
                el = document.createElement("canvas", e, t), tl = c({
                    canvas: el,
                    attributes: {
                        depth: !1,
                        stencil: !1,
                        alpha: !0,
                        antialias: !1,
                        premultipliedAlpha: !1
                    }
                }), nl = tl.texture({
                    mag: "linear",
                    min: "linear",
                    mipmap: !1,
                    flipY: !0,
                    width: e,
                    height: t
                }), rl = tl.texture();
            }(e.width, e.height);
            var t = n.map.getPostProcessConfig();
            if (!t || !t.enable) return;
            el.width === e.width && el.height === e.height || (el.width = e.width, el.height = e.height);
            tl.clear(cl);
            var r = t.filmicGrain || ll;
            void 0 === r.enable && (r.enable = !0);
            var i = t.vignette || ll;
            void 0 === i.enable && (i.enable = !0);
            var a = t.colorLUT || ll;
            void 0 === a.enable && (a.enable = !0);
            n._postProcessContext || (n._postProcessContext = {});
            var o = n._postProcessContext;
            if (a.enable) {
                var s = a.lut;
                if (!o.lutTexture || o.lutTexture.url !== s) {
                    var u = new Image();
                    u.onload = function() {
                        var e = {
                            data: u,
                            min: "linear",
                            mag: "linear"
                        }, t = o.lutTexture ? o.lutTexture.texture(e) : tl.texture(e);
                        o.lutTexture = {
                            url: s,
                            texture: t
                        }, n.setLayerCanvasUpdated();
                    }, u.src = s;
                }
            }
            var f = {
                enableGrain: +!!r.enable,
                grainFactor: void 0 === r.factor ? .15 : r.factor,
                timeGrain: performance.now(),
                enableVignette: +!!i.enable,
                lensRadius: i.lensRadius || [ .8, .25 ],
                frameMod: 1,
                enableLut: +!!a.enable,
                lookupTable: o.lutTexture ? o.lutTexture.texture : rl
            };
            (void 0).postprocess(f, nl({
                width: el.width,
                height: el.height,
                data: e,
                flipY: !0,
                mag: "linear",
                min: "linear",
                mipmap: !1
            })), r.enable && n.setLayerCanvasUpdated();
            n.context.drawImage(el, 0, 0, el.width, el.height);
        }(this, this.canvas), e;
    };
    var dl = r.renderer.MapCanvasRenderer.prototype.renderFrame;
    r.renderer.MapCanvasRenderer.prototype.renderFrame = function() {
        var e = dl.apply(this, arguments), t = this.map.getPostProcessConfig(), n = t && t.filmicGrain;
        return !n || void 0 !== n.enable && !0 !== n.enable || this.setLayerCanvasUpdated(), 
        e;
    }, "undefined" != typeof window && window.maptalks && (window.maptalks.GroupGLLayer = jc, 
    window.maptalks.ViewshedAnalysis = Qc, window.maptalks.FloodAnalysis = il, window.maptalks.SkylineAnalysis = al), 
    e.FloodAnalysis = il, e.GLContext = uc, e.GroupGLLayer = jc, e.HeatmapProcess = Yc, 
    e.SkylineAnalysis = al, e.ViewshedAnalysis = Qc, e.createREGL = c, e.glMatrix = ns, 
    e.mat2 = ss, e.mat2d = hs, e.mat3 = _s, e.mat4 = Cs, e.quat = lf, e.quat2 = Af, 
    e.reshader = Qo, e.vec2 = Hf, e.vec3 = tu, e.vec4 = Cu, Object.defineProperty(e, "__esModule", {
        value: !0
    }), "undefined" != typeof console && console.log("@maptalks/gl v0.19.2");
});
