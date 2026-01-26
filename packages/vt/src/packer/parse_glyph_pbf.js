// import { AlphaImage } from './Image';
import Protobuf from 'pbf';

export const GLYPH_PBF_BORDER = 3;

function readFontstacks(tag, data, pbf) {
    if (tag === 1) {
        data.glyphs = Object.create(null);
        pbf.readMessage(readFontstack, data);
    }
}

function readFontstack(tag, data, pbf) {
    if (tag === 3) {
        const glyph = pbf.readMessage(readGlyph, {});
        const border = GLYPH_PBF_BORDER;

        // Ensure glyph has all required properties
        glyph.width = glyph.width || 0;
        glyph.height = glyph.height || 0;
        glyph.left = glyph.left || 0;
        glyph.top = glyph.top || 0;
        glyph.advance = glyph.advance || 0;

        const bmpWidth  = glyph.width  + 2 * border;
        const bmpHeight = glyph.height + 2 * border;

        // Create a proper SDF structure matching local TinySDF output
        data.glyphs[glyph.id] = {
            charCode: glyph.id,
            bitmap: {
                width: bmpWidth,
                height: bmpHeight,
                data: new Uint8ClampedArray(glyph.bitmap || new ArrayBuffer(bmpWidth * bmpHeight))
            },
            metrics: {
                width: glyph.width,
                height: glyph.height,
                // left: glyph.left + border,
                // top: glyph.top + border,
                left: 1,
                top: -2,
                advance: glyph.advance
            }
        };
    } else if (tag === 4) {
        data.ascender = pbf.readSVarint();
    } else if (tag === 5) {
        data.descender = pbf.readSVarint();
    }
}

function readGlyph(tag, glyph, pbf) {
    if (tag === 1) glyph.id = pbf.readVarint();
    else if (tag === 2) glyph.bitmap = pbf.readBytes();
    else if (tag === 3) glyph.width = pbf.readVarint();
    else if (tag === 4) glyph.height = pbf.readVarint();
    else if (tag === 5) glyph.left = pbf.readSVarint();
    else if (tag === 6) glyph.top = pbf.readSVarint();
    else if (tag === 7) glyph.advance = pbf.readVarint();
}

export default function parseGlyphPbf(buffer) {
    return new Protobuf(new Uint8Array(buffer)).readFields(readFontstacks, {});
}
