import LRUCache from './LRUCache';
import { extend } from './style/Util';
import TinySDF from './pack/atlas/TinySDF';
import { charHasUprightVerticalOrientation } from './pack/util/script_detection';

let DEBUG_COUNTER = 0;
let LIMIT_PER_FRAME = 15;

export default class GlyphRequestor {
    constructor(framer, limit = LIMIT_PER_FRAME, isCompactChars, sdfURL) {
        this.entries = {};
        this._cachedFont = {};
        this._cache = new LRUCache(2048, function () {});
        this._framer = framer;
        this._limit = limit;
        this._isCompactChars = isCompactChars;
        this._sdfURL = sdfURL;
    }

    _isValidSDFURL(url) {
        return url && url.indexOf('{stack}') >= 0 && url.indexOf('{range}') > 0;
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
        const promises = [];
        for (const font in glyphs) {
            for (const charCode of glyphs[font]) {
                promises.push(this._requestGlyph(font, charCode));
            }
        }
        Promise.all(promises).then(glyphData => {
            cb(null, glyphData);
        });
    }

    _requestGlyph(/* font, charCode */) {
        /* const url = this._sdfURL;
        let entry = this.entries[font];
        if (!entry) {
            entry = this.entries[font] = {
                glyphs: {},
                requests: {},
                ranges: {}
            };
        }
        let glyph = entry.glyphs[charCode];
        if (glyph) {
            return Promise.resolve({font, charCode, glyph});
        }

        const range = Math.floor(charCode / 256);
        if (range * 256 > 65535) {
            return Promise.reject(new Error('glyphs > 65535 not supported'));
        }
        let requests = entry.requests[range];
        if (!requests) {
            // request
        }
        requests.push((err, result) => {
            if (err) {
                return (err);
            } else if (result) {
                fnCallback(null, {stack, id, glyph: result.glyphs[id] || null});
            }
        }); */
        return Promise.resolve(null);
    }

    _tinySDF(entry, fonts, charCode, isCharsCompact) {
        // if (!isChar['CJK Unified Ideographs'](id) && !isChar['Hangul Syllables'](id)) { // eslint-disable-line new-cap
        //     return;
        // }
        const textFaceName = fonts;
        const fontFamily = textFaceName;
        let tinySDF = entry.tinySDF;
        const buffer = 2;
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


