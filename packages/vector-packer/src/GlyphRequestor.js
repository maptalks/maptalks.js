import LRUCache from './LRUCache';
import { extend } from './style/Util';
import TinySDF from './pack/atlas/TinySDF';
import { charHasUprightVerticalOrientation } from './pack/util/script_detection';

let DEBUG_COUNTER = 0;

// const chars = {};
// let count = 0;
// let time = 0;

export default class GlyphRequestor {
    constructor() {
        this.entries = {};
        this._cachedFont = {};
        this._cache = new LRUCache(2048, function () {});
    }

    getGlyphs(glyphs, cb) {
        if (!glyphs || !Object.keys(glyphs).length) {
            return { glyphs: null };
        }
        const glyphSdfs = {};
        const buffers = [];
        const entries = this.entries;

        // const now = performance.now();

        for (const font in glyphs) {
            entries[font] = entries[font] || {};
            glyphSdfs[font] = {};
            for (const charCode in glyphs[font]) {
                const key = font + ':' + charCode;
                let sdf;
                if (this._cache.has(key)) {
                    sdf = this._cache.get(key);
                } else {
                    sdf = this._tinySDF(entries[font], font, charCode);
                    // count++;
                    this._cache.add(key, sdf);
                }
                sdf = cloneSDF(sdf);
                glyphSdfs[font][charCode] = sdf;
                buffers.push(sdf.bitmap.data.buffer);
                // chars[charCode] = 1;
            }
        }
        // time += (performance.now() - now);

        // console.log(`(${Math.round((performance.now() - now))}ms)渲染了${count}个, 实际${Object.keys(chars).length}个字符.`);
        // count = 0;
        return cb(null, { glyphs: glyphSdfs, buffers });
    }

    _tinySDF(entry, font, charCode) {

        // if (!isChar['CJK Unified Ideographs'](id) && !isChar['Hangul Syllables'](id)) { // eslint-disable-line new-cap
        //     return;
        // }
        // const fontFamily = this._getFontFamliy(font);
        const fonts = font.split(' ');
        const textStyle = fonts[0],
            textWeight = fonts[1],
            textFaceName = fonts.slice(3).join(' ');
        const fontFamily = textFaceName;
        let tinySDF = entry.tinySDF;
        const buffer = 3;
        let advBuffer = 1;
        if (fonts[0] === 'normal' && !charHasUprightVerticalOrientation(charCode)) {
            advBuffer = 2;
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
                advance: width + buffer - advBuffer
            }
        };
    }

    // _getFontFamliy(font) {
    //     if (!this._cachedFont[font]) {
    //         this._cachedFont[font] = extractFontFamily(font);
    //     }
    //     return this._cachedFont[font];
    // }
}

/* function extractFontFamily(font) {
    const span = document.createElement('span');
    document.body.appendChild(span);
    span.style.font = font;
    const computedStyle = window.getComputedStyle(span);
    const family = computedStyle.getPropertyValue('font-family');
    document.body.removeChild(span);
    return family;
} */

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
