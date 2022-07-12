/*!
 * From mapbox-gl-js
 * MIT License
 * https://github.com/mapbox/mapbox-gl-js
 */

import Point from '@mapbox/point-geometry';

export default clipLine;

/**
 * Returns the part of a multiline that intersects with the provided rectangular box.
 *
 * @param lines
 * @param x1 the left edge of the box
 * @param y1 the top edge of the box
 * @param x2 the right edge of the box
 * @param y2 the bottom edge of the box
 * @returns lines
 * @private
 */
function clipLine(lines, x1, y1, x2, y2) {
    const clippedLines = [];
    let p;

    for (let l = 0; l < lines.length; l++) {
        const line = lines[l];
        let clippedLine;
        let clipped = false;

        for (let i = 0; i < line.length - 1; i++) {
            let p0 = line[i];
            let p1 = line[i + 1];


            if (p0.x < x1 && p1.x < x1) {
                continue;
            } else if (p0.x < x1) {
                p = p0;
                p0 = new Point(x1, p0.y + (p1.y - p0.y) * ((x1 - p0.x) / (p1.x - p0.x)))._round();
                p0.z = p.z + (p1.z - p.z) * ((x1 - p.x) / (p1.x - p.x));
                clipped = true;
            } else if (p1.x < x1) {
                p = p1;
                p1 = new Point(x1, p0.y + (p1.y - p0.y) * ((x1 - p0.x) / (p1.x - p0.x)))._round();
                p1.z = p0.z + (p.z - p0.z) * ((x1 - p0.x) / (p.x - p0.x));
                clipped = true;
            }

            if (p0.y < y1 && p1.y < y1) {
                continue;
            } else if (p0.y < y1) {
                p = p0;
                p0 = new Point(p0.x + (p1.x - p0.x) * ((y1 - p0.y) / (p1.y - p0.y)), y1)._round();
                p0.z = p.z + (p1.z - p.z) * ((y1 - p.y) / (p1.y - p.y));
                clipped = true;
            } else if (p1.y < y1) {
                p = p1;
                p1 = new Point(p0.x + (p1.x - p0.x) * ((y1 - p0.y) / (p1.y - p0.y)), y1)._round();
                p1.z = p0.z + (p.z - p0.z) * ((y1 - p0.y) / (p.y - p0.y));
                clipped = true;
            }

            if (p0.x >= x2 && p1.x >= x2) {
                continue;
            } else if (p0.x >= x2) {
                p = p0;
                p0 = new Point(x2, p0.y + (p1.y - p0.y) * ((x2 - p0.x) / (p1.x - p0.x)))._round();
                p0.z = p.z + (p1.z - p.z) * ((x2 - p.x) / (p1.x - p.x));
                clipped = true;
            } else if (p1.x >= x2) {
                p = p1;
                p1 = new Point(x2, p0.y + (p1.y - p0.y) * ((x2 - p0.x) / (p1.x - p0.x)))._round();
                p1.z = p0.z + (p.z - p0.z) * ((x2 - p0.x) / (p.x - p0.x));
                clipped = true;
            }

            if (p0.y >= y2 && p1.y >= y2) {
                continue;
            } else if (p0.y >= y2) {
                p = p0;
                p0 = new Point(p0.x + (p1.x - p0.x) * ((y2 - p0.y) / (p1.y - p0.y)), y2)._round();
                p0.z = p.z + (p1.z - p.z) * ((y2 - p.y) / (p1.y - p.y));
                clipped = true;
            } else if (p1.y >= y2) {
                p = p1;
                p1 = new Point(p0.x + (p1.x - p0.x) * ((y2 - p0.y) / (p1.y - p0.y)), y2)._round();
                p1.z = p0.z + (p.z - p0.z) * ((y2 - p0.y) / (p.y - p0.y));
                clipped = true;
            }

            if (!clippedLine || !p0.equals(clippedLine[clippedLine.length - 1])) {
                clippedLine = [p0];
                clippedLines.push(clippedLine);
            }
            if (clipped) {
                clippedLine.clipped = true;
            }
            clippedLine.push(p1);
        }
    }
    return clippedLines;
}
