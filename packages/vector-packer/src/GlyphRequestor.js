import TinySDF from '@mapbox/tiny-sdf';

export default class GlyphRequestor {
    constructor() {
        this.entries = {};
        this._cachedFont = {};
    }

    getGlyphs(glyphs) {
        if (!glyphs || !Object.keys(glyphs).length) {
            return { glyphs : null };
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
                buffers.push(sdf.bitmap.data.buffer);
            }
        }

        return { glyphs : glyphSdfs, buffers };
    }

    _tinySDF(entry, font, charCode) {

        // if (!isChar['CJK Unified Ideographs'](id) && !isChar['Hangul Syllables'](id)) { // eslint-disable-line new-cap
        //     return;
        // }
        // const fontFamily = this._getFontFamliy(font);
        const fonts = font.split(' ');
        const textWeight = fonts[1],
            textFaceName = fonts.slice(3).join(' ');
        const fontFamily = textFaceName;
        let tinySDF = entry.tinySDF;
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
            tinySDF = entry.tinySDF = new TinySDF(24, 3, 8, .25, fontFamily, fontWeight);
        }

        return {
            charCode,
            bitmap: {
                width : 30,
                height : 30,
                data : tinySDF.draw(String.fromCharCode(charCode))
            },
            metrics: {
                width: 24,
                height: 24,
                left: 0,
                top: -8,
                advance: 26
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
