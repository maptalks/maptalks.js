import Point from '@mapbox/point-geometry';

export function getEmptyIconQuads() {
    const tl = new Point(0, 0);
    const tr = new Point(0, 0);
    const br = new Point(0, 0);
    const bl = new Point(0, 0);
    return [{ tl, tr, bl, br, tex: { x: 0, y: 0, w: 0, h: 0 }, writingMode: undefined, glyphOffset: [0, 0] }];
}

/**
 * Create the quads used for rendering an icon.
 * @private
 */
export function getIconQuads(
    shapedIcon //: PositionedIcon,
) {
    const image = shapedIcon.image;

    // If you have a 10px icon that isn't perfectly aligned to the pixel grid it will cover 11 actual
    // pixels. The quad needs to be padded to account for this, otherwise they'll look slightly clipped
    // on one edge in some cases.
    const border = 1;

    const top = shapedIcon.top - border / image.pixelRatio;
    const left = shapedIcon.left - border / image.pixelRatio;
    const bottom = shapedIcon.bottom + border / image.pixelRatio;
    const right = shapedIcon.right + border / image.pixelRatio;
    let tl, tr, br, bl;

    tl = new Point(left, top);
    tr = new Point(right, top);
    br = new Point(right, bottom);
    bl = new Point(left, bottom);

    // Icon quad is padded, so texture coordinates also need to be padded.
    return [{ tl, tr, bl, br, tex: { x: image.tl[0], y: image.tl[1], w: image.displaySize[0], h: image.displaySize[1] }, writingMode: undefined, glyphOffset: [0, 0] }];
}

const GLYPH_PBF_BORDER = 3;
const glyphPadding = 1.0;

export function getGlyphQuads(shaping,
    alongLine,
    positions) {
    const positionedGlyphs = shaping.positionedGlyphs;
    const quads = [];

    for (let k = 0; k < positionedGlyphs.length; k++) {
        const positionedGlyph = positionedGlyphs[k];
        const glyph = positions[positionedGlyph.glyph];
        if (!glyph) continue;

        const rect = glyph.rect;
        if (!rect) continue;

        // The rects have an addditional buffer that is not included in their size.

        const rectBuffer = GLYPH_PBF_BORDER + glyphPadding;

        const halfAdvance = glyph.metrics.advance / 2;
        const halfHeight = glyph.metrics.height / 2;
        const glyphOffset = alongLine ?
            [positionedGlyph.x + halfAdvance, 0] :
            [0, 0];

        const builtInOffset = alongLine ?
            [0, positionedGlyph.y - halfHeight] :
            [positionedGlyph.x + halfAdvance, positionedGlyph.y - halfHeight];


        const x1 = glyph.metrics.left - rectBuffer - halfAdvance + builtInOffset[0];
        const y1 = glyph.metrics.top - rectBuffer + builtInOffset[1];
        const x2 = x1 + rect.w;
        const y2 = y1 + rect.h;

        const tl = new Point(x1, y1);
        const tr = new Point(x2, y1);
        const bl  = new Point(x1, y2);
        const br = new Point(x2, y2);

        if (alongLine && positionedGlyph.vertical) {
            // Vertical-supporting glyphs are laid out in 24x24 point boxes (1 square em)
            // In horizontal orientation, the y values for glyphs are below the midline
            // and we use a "yOffset" of -17 to pull them up to the middle.
            // By rotating counter-clockwise around the point at the center of the left
            // edge of a 24x24 layout box centered below the midline, we align the center
            // of the glyphs with the horizontal midline, so the yOffset is no longer
            // necessary, but we also pull the glyph to the left along the x axis
            const center = new Point(-halfAdvance, halfAdvance);
            const verticalRotation = -Math.PI / 2;
            const xOffsetCorrection = new Point(5, 0);
            tl._rotateAround(verticalRotation, center)._add(xOffsetCorrection);
            tr._rotateAround(verticalRotation, center)._add(xOffsetCorrection);
            bl._rotateAround(verticalRotation, center)._add(xOffsetCorrection);
            br._rotateAround(verticalRotation, center)._add(xOffsetCorrection);
        }

        quads.push({ tl, tr, bl, br, tex: rect, writingMode: shaping.writingMode, glyphOffset });
    }

    return quads;
}
