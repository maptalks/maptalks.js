import Point from '@mapbox/point-geometry';

/**
 * based on placeGlyphAlongLine in projection.js of mapbox-gl-js
 * @param {Number[]} out -
 * @param {Number[]} anchor - quad's anchor
 * @param {}
 * @param {Number} dx - offset x
 * @param {Number} dy - offset y
 */
export function getLineOffset(out, line, anchor, glyphOffset, dx, dy, segment, lineStartIndex, lineLength, fontScale, flip, scale) {
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

    let current = Point.convert(anchor);
    let prev = Point.convert(anchor);
    let distanceToPrev = 0;
    let currentSegmentDistance = 0;
    while (distanceToPrev + currentSegmentDistance <= absOffsetX) {
        currentIndex += dir;

        // offset does not fit on the projected line
        if (currentIndex < lineStartIndex || currentIndex >= lineEndIndex) {
            return null;
        }

        // prev = current;
        prev.x = current.x;
        prev.y = current.y;

        current.x = line[currentIndex * 3];
        current.y = line[currentIndex * 3 + 1];

        distanceToPrev += currentSegmentDistance;
        currentSegmentDistance = prev.dist(current) / scale;
    }
    // The point is on the current segment. Interpolate to find it.
    const segmentInterpolationT = (absOffsetX - distanceToPrev) / currentSegmentDistance;
    const prevToCurrent = current.sub(prev);
    const p = prevToCurrent.mult(segmentInterpolationT)._add(prev);

    // offset the point from the line to text-offset and icon-offset
    p._add(prevToCurrent._unit()._perp()._mult(dy * dir));

    const segmentAngle = angle + Math.atan2(current.y - prev.y, current.x - prev.x);

    out[0] = (p.x - anchor[0]) / scale;
    out[1] = (p.y - anchor[1]) / scale;
    out[2] = segmentAngle;

    return out;
}
