import TinySDF from '@mapbox/tiny-sdf';
import { AlphaImage } from './Image';

export default class GlyphRequestor {
    constructor() {
        this.entries = {};
    }

    getGlyphs(glyphs, cb) {
        if (!glyphs || !Object.keys(glyphs).length) {
            cb(null, { glyphs : {}});
            return;
        }
        const glyphSdfs = {};
        const buffers = [];
        const entries = this.entries;

        for (const font in glyphs) {
            entries[font] = entries[font] || {};
            glyphSdfs[font] = {};
            for (const charCode in glyphs[font]) {
                const sdf = this._tinySDF(entries[font], font, charCode);
                glyphSdfs[font][charCode] = sdf;
                buffers.push(sdf.bitmap.data);
            }
        }

        cb(null, { glyphs : glyphSdfs, buffers });
    }

    _tinySDF(entry, font, charCode) {

        // if (!isChar['CJK Unified Ideographs'](id) && !isChar['Hangul Syllables'](id)) { // eslint-disable-line new-cap
        //     return;
        // }

        let tinySDF = entry.tinySDF;
        if (!tinySDF) {
            let fontWeight = '400';
            if (/bold/i.test(font)) {
                fontWeight = '900';
            } else if (/medium/i.test(font)) {
                fontWeight = '500';
            } else if (/light/i.test(font)) {
                fontWeight = '200';
            }
            tinySDF = entry.tinySDF = new TinySDF(24, 3, 8, .25, font, fontWeight);
        }

        return {
            charCode,
            bitmap: new AlphaImage({ width: 30, height: 30 }, tinySDF.draw(String.fromCharCode(charCode))),
            metrics: {
                width: 24,
                height: 24,
                left: 0,
                top: -8,
                advance: 24
            }
        };
    }
}
