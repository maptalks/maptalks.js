/**
 * based on placeGlyphAlongLine in projection.js of mapbox-gl-js
 * @param {Point} anchor - quad's anchor
 * @param {Object} quad  - quad object computed in quads.js
 * @param {Number} dx - offset x
 * @param {Number} dy - offset y
 */
export function getLineOffset(out, line, anchor, glyphOffset, dx, dy, segment, lineStartIndex, lineLength, fontScale, scale, flip) {
    const glyphOffsetX = glyphOffset[0] * fontScale;
    const offsetX = flip ?
        glyphOffsetX - dx :
        glyphOffsetX + dx;

    let dir = offsetX > 0 ? 1 : -1;

    let angle = 0;
    if (flip) {
        // The label needs to be flipped to keep text upright.
        // Iterate in the reverse direction.
        dir *= -1;
        angle = Math.PI;
    }
    if (dir < 0) angle += Math.PI;


    const lineEndIndex = lineStartIndex + lineLength;

    const absOffsetX = Math.abs(offsetX);

    let currentIndex = dir > 0 ?
        segment :
        segment + 1;

    let current = anchor;
    let prev = anchor;
    let distanceToPrev = 0;
    let currentSegmentDistance = 0;
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

        distanceToPrev += currentSegmentDistance;
        currentSegmentDistance = prev.dist(current) / scale;
    }
    if (miss) {
        //如果第一个scale（主级别）就miss，不做任何处理直接返回
        out[0] = out[3] = glyphOffsetX;
        out[1] = out[4] = glyphOffset[1] * fontScale + dy * dir;
        out[2] = out[5] = 0;
        return out;
    }
    // The point is on the current segment. Interpolate to find it.
    const segmentInterpolationT = (absOffsetX - distanceToPrev) / currentSegmentDistance;
    const prevToCurrent = current.sub(prev);
    const p = prevToCurrent.mult(segmentInterpolationT)._add(prev);

    // offset the point from the line to text-offset and icon-offset
    p._add(prevToCurrent._unit()._perp()._mult(dy * dir));

    let segmentAngle = angle + Math.atan2(current.y - prev.y, current.x - prev.x);

    out[0] = Math.round((p.x - anchor.x) / scale);
    out[1] = -Math.round((p.y - anchor.y) / scale);
    out[2] = Math.round(segmentAngle * 180 / Math.PI);

    return out;
}
