import LRUCache from './LRUCache';
import { extend } from './style/Util';
import TinySDF from './pack/atlas/TinySDF';
import { charHasUprightVerticalOrientation } from './pack/util/script_detection';

let DEBUG_COUNTER = 0;
let LIMIT_PER_FRAME = 15;

export default class GlyphRequestor {
    constructor(framer, limit = LIMIT_PER_FRAME, useCharBackBuffer) {
        this.entries = {};
        this._cachedFont = {};
        this._cache = new LRUCache(2048, function () {});
        this._framer = framer;
        this._limit = limit;
        this._useCharBackBuffer = useCharBackBuffer;
    }

    getGlyphs(glyphs, cb) {
        if (!glyphs || !Object.keys(glyphs).length) {
            cb(null, { glyphs: null });
            return;
        }
        const entries = this.entries;

        const run = (startStep, glyphSdfs, buffers) => {
            let drawCount = 0;
            let step = 0;
            // const now = performance.now();

            for (const font in glyphs) {
                entries[font] = entries[font] || {};
                glyphSdfs[font] = glyphSdfs[font] || {};
                for (const charCode in glyphs[font]) {
                    step++;
                    if (step <= startStep) {
                        continue;
                    }
                    const key = font + ':' + charCode;
                    let sdf;
                    if (this._cache.has(key)) {
                        sdf = this._cache.get(key);
                    } else {
                        sdf = this._tinySDF(entries[font], font, charCode);
                        // count++;
                        this._cache.add(key, sdf);
                        drawCount++;
                    }
                    sdf = cloneSDF(sdf);
                    glyphSdfs[font][charCode] = sdf;
                    buffers.push(sdf.bitmap.data.buffer);
                    if (drawCount > this._limit) {
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

    _tinySDF(entry, font, charCode) {

        // if (!isChar['CJK Unified Ideographs'](id) && !isChar['Hangul Syllables'](id)) { // eslint-disable-line new-cap
        //     return;
        // }
        const fonts = font.split(' ');
        const textStyle = fonts[0],
            textWeight = fonts[1],
            textFaceName = fonts.slice(3).join(' ');
        const fontFamily = textFaceName;
        let tinySDF = entry.tinySDF;
        const buffer = 3;
        let backBuffer = this._useCharBackBuffer ? 1 : 0;
        if (fonts[0] === 'normal' && !charHasUprightVerticalOrientation(charCode)) {
            //非中文/韩文时，增大 backBuffer，让文字更紧凑
            //但因为intel gpu崩溃问题，启用stencil且backBuffer不为0时，会有文字削边现象，所以必须设为0
            backBuffer = this._useCharBackBuffer ? 2 : 0;
        }
        if (!tinySDF) {
            let fontWeight = '400';
            if (/bolder/i.test(textWeight)) {
                fontWeight = '1000';
            } else if (/bold/i.test(textWeight)) {
                fontWeight = '900';
            } else if (/medium/i.test(textWeight)) {
                fontWeight = '500';
            } else if (/light/i.test(textWeight)) {
                fontWeight = '200';
            }
            tinySDF = entry.tinySDF = new TinySDF(24, buffer, 8, .25, fontFamily, fontWeight, textStyle);

        }
        const chr = String.fromCharCode(charCode);
        const metrics = tinySDF.ctx.measureText(chr);
        const width = Math.round(metrics.width);
        const data = tinySDF.draw(String.fromCharCode(charCode), width + buffer * 2, 24 + buffer * 2);

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
        //         data : tinySDF.draw(String.fromCharCode(charCode))
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
                left: 0,
                top: -8 - (buffer - 3),
                // top: -buffer,
                advance: width + buffer - backBuffer
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


