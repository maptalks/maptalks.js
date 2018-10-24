/**
 * based on placeGlyphAlongLine in projection.js of mapbox-gl-js
 * @param {Array} out - output arr
 * @param {Point} anchor - quad's anchor
 * @param {Object} quad  - quad object computed in quads.js
 * @param {Number} dx - offset x
 * @param {Number} dy - offset y
 */
export function getLineOffset(out, anchor, quad, dx, dy, flip, scales) {
    // const tileScale = scales[0] / 2;
    const glyphOffset = quad.glyphOffset[0];
    const offsetX = flip ?
        glyphOffset - dx :
        glyphOffset + dx;

    let dir = offsetX > 0 ? 1 : -1;

    let angle = 0;
    if (flip) {
        // The label needs to be flipped to keep text upright.
        // Iterate in the reverse direction.
        dir *= -1;
        angle = Math.PI;
    }
    if (dir < 0) angle += Math.PI;


    const line = anchor.line;
    const lineStartIndex = 0;
    const lineEndIndex = line.length;



    for (let i = 0; i < scales.length; i++) {
        let currentIndex = dir > 0 ?
            anchor.segment :
            anchor.segment + 1;

        let current = anchor;
        let prev = anchor;
        let distanceToPrev = 0;
        let currentSegmentDistance = 0;
        const absOffsetX = Math.abs(offsetX);
        let miss = false;
        while (distanceToPrev + currentSegmentDistance <= absOffsetX) {
            currentIndex += dir;

            // offset does not fit on the projected line
            if (currentIndex < lineStartIndex || currentIndex >= lineEndIndex) {
                miss = true;
                break;
            }

            prev = current;

            current = line[currentIndex];

            distanceToPrev += currentSegmentDistance / scales[i];
            currentSegmentDistance = prev.dist(current) / scales[i];
        }
        if (miss) {
            out[0] = out[3] = quad.glyphOffset[0];
            out[1] = out[4] = quad.glyphOffset[1];
            out[2] = out[5] = 0;
            return out;
        }
        // The point is on the current segment. Interpolate to find it.
        const segmentInterpolationT = (absOffsetX - distanceToPrev) / currentSegmentDistance;
        const prevToCurrent = current.sub(prev);
        const p = prevToCurrent.mult(segmentInterpolationT)._add(prev);

        // offset the point from the line to text-offset and icon-offset
        p._add(prevToCurrent._unit()._perp()._mult(dy * dir));

        const segmentAngle = angle + Math.atan2(current.y - prev.y, current.x - prev.x);
        out[i * 3] = Math.round((p.x - anchor.x) / scales[i]);
        out[i * 3 + 1] = -Math.round((p.y - anchor.y) / scales[i]);
        out[i * 3 + 2] = segmentAngle;
    }

    return out;
}
