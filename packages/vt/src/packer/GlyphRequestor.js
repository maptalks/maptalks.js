import LRUCache from './LRUCache';
import { extend } from './style/Util';
import TinySDF from './pack/atlas/TinySDF';
import { charHasUprightVerticalOrientation } from './pack/util/script_detection';
import parseGlyphPBF from './parse_glyph_pbf';

let DEBUG_COUNTER = 0;
let LIMIT_PER_FRAME = 15;

// https://github.com/xiaoiver/custom-mapbox-layer/blob/386abe0cd78da95ec122bd14581ca9f11f455f37/src/utils/glyph-manager.ts#L19C8-L22C1
function isCJK(char) {
    return char >= 0x4E00 && char <= 0x9FFF;
}

// --- SDF Request Concurrency & Cache Optimization ---
const MAX_CONCURRENT_REQUESTS = 6;
let activeRequests = 0;
const requestQueue = [];


// --- IndexedDB persistent cache (works on HTTP & HTTPS) ---
const SDF_DB_NAME = 'maptalks-sdf-cache';
const SDF_STORE_NAME = 'sdf';
const SDF_DB_VERSION = 1;
let _sdfDB = null;
let _sdfDBReady = null; // shared promise

function _getCacheKey(url) {
    // Strip query parameters so tokens/timestamps don't break matching
    try {
        const u = new URL(url, typeof location !== 'undefined' ? location.href : undefined);
        return u.origin + u.pathname;
    } catch (e) {
        return url.split('?')[0];
    }
}

function _openSdfDB() {
    if (_sdfDBReady) return _sdfDBReady;
    _sdfDBReady = new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject(new Error('IndexedDB not available'));
            return;
        }
        const req = indexedDB.open(SDF_DB_NAME, SDF_DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(SDF_STORE_NAME)) {
                db.createObjectStore(SDF_STORE_NAME);
            }
        };
        req.onsuccess = () => {
            _sdfDB = req.result;
            resolve(_sdfDB);
        };
        req.onerror = () => reject(req.error);
    });
    return _sdfDBReady;
}

function _idbGet(key) {
    return _openSdfDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(SDF_STORE_NAME, 'readonly');
            const store = tx.objectStore(SDF_STORE_NAME);
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result); // ArrayBuffer or undefined
            req.onerror = () => reject(req.error);
        });
    });
}

function _idbPut(key, value) {
    return _openSdfDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(SDF_STORE_NAME, 'readwrite');
            const store = tx.objectStore(SDF_STORE_NAME);
            const req = store.put(value, key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    });
}
// -------------------------------------------------------

function enqueueSDFRequest(url, resolve, reject) {
    if (activeRequests < MAX_CONCURRENT_REQUESTS) {
        executeSDFRequest(url, resolve, reject);
    } else {
        requestQueue.push({ url, resolve, reject });
    }
}

function processNextSDFRequest() {
    if (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
        const { url, resolve, reject } = requestQueue.shift();
        executeSDFRequest(url, resolve, reject);
    }
}

function executeSDFRequest(url, resolve, reject) {
    activeRequests++;

    const onComplete = () => {
        activeRequests--;
        processNextSDFRequest();
    };

    const cacheKey = _getCacheKey(url);

    _idbGet(cacheKey).then(buffer => {
        if (buffer) {
            // Cache hit — return a copy so the buffer can be transferred
            resolve(buffer instanceof ArrayBuffer ? buffer.slice(0) : buffer);
            onComplete();
        } else {
            fetchAndCacheSDF(url, cacheKey, resolve, reject, onComplete);
        }
    }).catch(() => {
        // IndexedDB unavailable or error — fall back to network
        fetchAndCacheSDF(url, cacheKey, resolve, reject, onComplete);
    });
}

function fetchAndCacheSDF(url, cacheKey, resolve, reject, onComplete) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.arrayBuffer();
        })
        .then(buffer => {
            // Store in IndexedDB (fire-and-forget)
            _idbPut(cacheKey, buffer.slice(0)).catch(() => { });
            resolve(buffer);
            onComplete();
        })
        .catch(err => {
            reject(err);
            onComplete();
        });
}
// ----------------------------------------------------


export default class GlyphRequestor {
    constructor(framer, limit = LIMIT_PER_FRAME, isCompactChars, sdfURL) {
        this.entries = {};
        this._cachedFont = {};
        this._cache = new LRUCache(2048, function () { });
        this._framer = framer;
        this._limit = limit;
        this._isCompactChars = isCompactChars;
        this._sdfURL = sdfURL;
    }

    getGlyphs(glyphs, cb) {
        if (!glyphs || !Object.keys(glyphs).length) {
            cb(null, { glyphs: null });
            return;
        }

        if (this._isValidSDFURL(this._sdfURL)) {
            this._requestRemoteSDF(glyphs, cb);
            return;
        }

        const entries = this.entries;
        const options = glyphs.options;
        let isCharsCompact = true;
        if (options) {
            isCharsCompact = options.isCharsCompact !== false;
        }
        isCharsCompact = isCharsCompact || this._isCompactChars;

        const run = (startStep, glyphSdfs, buffers) => {
            let drawCount = 0;
            let step = 0;
            // const now = performance.now();

            for (const font in glyphs) {
                if (font === 'options') {
                    continue;
                }
                entries[font] = entries[font] || {};
                glyphSdfs[font] = glyphSdfs[font] || {};
                for (const charCode in glyphs[font]) {
                    step++;
                    if (step <= startStep) {
                        continue;
                    }
                    const isCharCompact = isCharsCompact && !charHasUprightVerticalOrientation(+charCode);
                    const key = font + ':' + charCode + ':' + isCharCompact;
                    let sdf;
                    if (this._cache.has(key)) {
                        sdf = this._cache.get(key);
                    } else {
                        sdf = this._tinySDF(entries[font], font, charCode, isCharCompact);
                        // count++;
                        this._cache.add(key, sdf);
                        drawCount++;
                    }
                    sdf = cloneSDF(sdf);
                    glyphSdfs[font][charCode] = sdf;
                    buffers.push(sdf.bitmap.data.buffer);
                    if (this._framer && drawCount > this._limit) {
                        // console.log(`(下一帧)(${Math.round((performance.now() - now))}ms)渲染了${drawCount}个字符.`);
                        this._framer(closure(step, glyphSdfs, buffers));
                        return;
                    }
                    // chars[charCode] = 1;
                }
            }
            // console.log(`(结束)(${Math.round((performance.now() - now))}ms)渲染了${drawCount}个字符.`);
            cb(null, { glyphs: glyphSdfs, buffers });
        };

        run(0, {}, []);

        function closure(step, glyphSdfs, buffers) {
            return () => {
                run(step, glyphSdfs, buffers);
            };
        }

    }


    // 从远程服务请求sdf数据
    _requestRemoteSDF(glyphs, cb) {
        const glyphSdfs = {};
        const buffers = [];
        let pending = 0;
        let finished = false;

        const done = (err) => {
            if (finished) return;
            finished = true;
            cb(err, err ? null : { glyphs: glyphSdfs, buffers });
        };

        for (const font in glyphs) {
            if (font === 'options') continue;

            glyphSdfs[font] = {};
            const entry = this._getFontEntry(font);
            const ranges = this._groupByRange(glyphs[font]);

            for (const [range, chars] of ranges) {
                // 检查该范围内哪些字符尚未加载成功
                const missingChars = [];
                for (const code of chars) {
                    const glyph = entry.glyphs[code];
                    if (!glyph || !glyph.bitmap || !glyph.bitmap.data) {
                        missingChars.push(code);
                    }
                }

                // 如果所有字符都已成功加载，直接使用缓存
                if (missingChars.length === 0) {
                    for (const code of chars) {
                        const glyph = entry.glyphs[code];
                        if (glyph && glyph.bitmap && glyph.bitmap.data) {
                            // 确保字形metrics符合预期
                            if (!glyph.metrics) {
                                glyph.metrics = {
                                    width: 0,
                                    height: 0,
                                    left: 0,
                                    top: 0,
                                    advance: 0
                                };
                            }
                            const cloned = cloneSDF(glyph);
                            glyphSdfs[font][code] = cloned;
                            buffers.push(cloned.bitmap.data.buffer);
                        }
                    }
                } else {
                    // 有字符缺失，需要加载该范围
                    pending++;

                    this._loadGlyphRange(font, range, (err, rangeGlyphs) => {
                        if (finished) return;

                        if (err) {
                            done(err);
                            return;
                        }

                        for (const code of chars) {
                            const glyph = rangeGlyphs[code];
                            if (!glyph || !glyph.bitmap || !glyph.bitmap.data) continue;

                            // 确保字形metrics符合预期
                            if (!glyph.metrics) {
                                glyph.metrics = {
                                    width: 0,
                                    height: 0,
                                    left: 0,
                                    top: 0,
                                    advance: 0
                                };
                            }

                            const cloned = cloneSDF(glyph);
                            glyphSdfs[font][code] = cloned;
                            buffers.push(cloned.bitmap.data.buffer);
                        }

                        if (--pending === 0) {
                            done();
                        }
                    });
                }
            }
        }

        if (pending === 0) {
            done();
        }
    }

    _loadGlyphRange(font, range, callback) {
        const entry = this._getFontEntry(font);

        if (entry.ranges[range]) {
            callback(null, entry.glyphs);
            return;
        }

        if (entry.requests[range]) {
            entry.requests[range].push(callback);
            return;
        }

        entry.requests[range] = [callback];

        const rangeStr = `${range}-${range + 255}`;
        let url = this._sdfURL
            .replace('{fontstack}', font)
            .replace('{stack}', font)
            .replace('{range}', rangeStr);

        new Promise((resolve, reject) => {
            enqueueSDFRequest(url, resolve, reject);
        })
            .then(buf => {
                const data = parseGlyphPBF(buf);

                entry.ascender = data.ascender;
                entry.descender = data.descender;

                for (const code in data.glyphs) {
                    entry.glyphs[+code] = data.glyphs[code];
                }

                entry.ranges[range] = true;
                this._flushCallbacks(entry, range, null);
            })
            .catch(err => {
                this._flushCallbacks(entry, range, err);
            });
    }

    _tinySDF(entry, fonts, charCode, isCharsCompact) {
        // if (!isChar['CJK Unified Ideographs'](id) && !isChar['Hangul Syllables'](id)) { // eslint-disable-line new-cap
        //     return;
        // }
        const textFaceName = fonts;
        const fontFamily = textFaceName;
        let tinySDF = entry.tinySDF;
        let buffer = 2;
        if (isCJK(charCode)) {
            buffer = 4;
        }
        //1. 中日韩字符中间适当多留一些间隔
        //2. 英文或其他拉丁文字，减小 advanceBuffer，让文字更紧凑
        //3. 但因为intel gpu崩溃问题，启用stencil且advancaBuffer < 0时，会有文字削边现象，所以设为 1
        const advanceBuffer = isCharsCompact ? -1 : 2;
        if (!tinySDF) {
            let fontWeight = '400';
            if (/bolder/i.test(fontFamily)) {
                fontWeight = '1000';
            } else if (/bold/i.test(fontFamily)) {
                fontWeight = '900';
            } else if (/medium/i.test(fontFamily)) {
                fontWeight = '500';
            } else if (/light/i.test(fontFamily)) {
                fontWeight = '200';
            }
            tinySDF = entry.tinySDF = new TinySDF(24, buffer, 8, .25, fontFamily, fontWeight);

        }
        const chr = String.fromCodePoint(charCode);
        const metrics = tinySDF.ctx.measureText(chr);
        const width = Math.round(metrics.width);
        const data = tinySDF.draw(chr, width + buffer * 2, 24 + buffer * 2);

        if (DEBUG_COUNTER < 4) {
            const sdfDebug = typeof document !== 'undefined' && document.getElementById('sdf-debug-' + DEBUG_COUNTER++);
            if (sdfDebug) {
                sdfDebug.width = width + buffer * 2;
                sdfDebug.height = tinySDF.canvas.height;
                const ctx = sdfDebug.getContext('2d');
                ctx.drawImage(tinySDF.canvas, 0, 0);
            }
        }

        // console.log(chr, Math.ceil(metrics.width));
        // return {
        //     charCode,
        //     bitmap: {
        //         width : 30,
        //         height : 30,
        //         data : tinySDF.draw(String.fromCodePoint(charCode))
        //     },
        //     metrics: {
        //         width: 24,
        //         height: 24,
        //         left: 0,
        //         top: -8,
        //         advance: 26
        //     }
        // };
        return {
            charCode,
            bitmap: {
                width: width + buffer * 2,
                height: 24 + buffer * 2,
                data
            },
            metrics: {
                width: width,
                height: 24,
                left: 1,
                top: -buffer,
                advance: width + buffer + advanceBuffer
            }
        };
    }
    /* =======================
    * Utils
    * ======================= */

    _getFontEntry(font) {
        return this.entries[font] = this.entries[font] || {
            glyphs: {},
            requests: {},
            ranges: {},
            ascender: undefined,
            descender: undefined,
            tinySDF: null
        };
    }

    _groupByRange(chars) {
        const map = new Map();
        for (const code in chars) {
            const r = Math.floor(code / 256) * 256;
            (map.get(r) || map.set(r, []).get(r)).push(+code);
        }
        return map;
    }

    _flushCallbacks(entry, range, err) {
        const cbs = entry.requests[range];
        delete entry.requests[range];
        cbs.forEach(cb => cb(err, entry.glyphs));
    }

    _isValidSDFURL(url) {
        return (
            url &&
            (url.includes('{fontstack}') || url.includes('{stack}')) &&
            url.includes('{range}')
        );
    }
}

function cloneSDF(sdf) {
    const bitmap = {
        width: sdf.bitmap.width,
        height: sdf.bitmap.height,
        data: new Uint8ClampedArray(sdf.bitmap.data),
    };
    return {
        charCode: sdf.charCode,
        bitmap,
        metrics: extend({}, sdf.metrics)
    };
}


