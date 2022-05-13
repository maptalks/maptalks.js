import { isOut } from './util';
import clipLine from './clip_line';
import { getAnchors } from './get_anchors';
import classifyRings from './classify_rings';
import findPoleOfInaccessibility from './find_pole_of_inaccessibility';

const TEXT_MAX_ANGLE = 45 * Math.PI / 100;

export function getPointAnchors(point, lineVertex, shape, scale, EXTENT, placement, spacing, altitudeToTileScale) {
    const { feature, size, symbol } = point;
    const glyphSize = size ? 24 : 0;
    const fontScale = size ? size[0] / glyphSize : 1;
    const textBoxScale = scale * fontScale;
    const anchors = [];
    if (placement === 'line') {
        let lines = feature.geometry;
        if (EXTENT) {
            lines = clipLine(feature.geometry, 0, 0, EXTENT, EXTENT);
        }

        for (let i = 0; i < lines.length; i++) {
            const lineAnchors = getAnchors(lines[i],
                spacing,
                TEXT_MAX_ANGLE,
                symbol['isIconText'] ? null : shape.vertical || shape.horizontal || shape,
                null, //shapedIcon,
                glyphSize,
                symbol['isIconText'] ? 1 : textBoxScale,
                1, //bucket.overscaling,
                EXTENT || Infinity,
                altitudeToTileScale
            );
            if (symbol['textPlacement'] && !symbol['isIconText']) {
                for (let ii = 0; ii < lineAnchors.length; ii++) {
                    lineAnchors[ii].startIndex = lineVertex.length / 3;
                }
            }
            anchors.push.apply(
                anchors,
                lineAnchors
            );
            if (symbol['textPlacement'] && !symbol['isIconText']) {
                for (let ii = 0; ii < lines[i].length; ii++) {
                    //TODO 0是预留的高度值
                    lineVertex.push(lines[i][ii].x, lines[i][ii].y, lines[i][ii].z || 0);
                }
            }
        }

    } else if (feature.type === 3) {
        const rings = classifyRings(feature.geometry, 0);
        for (let i = 0; i < rings.length; i++) {
            const polygon = rings[i];
            if (placement === 'vertex') {
                for (let ii = 0; ii < polygon.length; ii++) {
                    const ring = polygon[ii];
                    for (let iii = 0; iii < ring.length; iii++) {
                        if (!isOut(ring[iii], EXTENT)) {
                            anchors.push(ring[iii]);
                        }
                    }
                }
            } else {
                // 16 here represents 2 pixels
                const poi = findPoleOfInaccessibility(polygon, 16);
                if (!isOut(poi, EXTENT)) {
                    anchors.push(poi);
                }
            }
        }
    } else if (feature.type === 2) {
        // https://github.com/mapbox/mapbox-gl-js/issues/3808
        for (let i = 0; i < feature.geometry.length; i++) {
            const line = feature.geometry[i];
            if (placement === 'vertex') {
                for (let ii = 0; ii < line.length; ii++) {
                    if (!isOut(line[ii], EXTENT)) {
                        anchors.push(line[ii]);
                    }
                }
            } else {
                if (!isOut(line[0], EXTENT)) {
                    anchors.push(line[0]);
                }
            }
        }
    } else if (feature.type === 1) {
        for (let i = 0; i < feature.geometry.length; i++) {
            const points = feature.geometry[i];
            for (let ii = 0; ii < points.length; ii++) {
                const point = points[ii];
                if (!isOut(point, EXTENT)) {
                    anchors.push(point);
                }
            }
        }
    }
    return anchors;
}
