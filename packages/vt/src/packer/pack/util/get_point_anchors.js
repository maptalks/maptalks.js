import { isOut } from './util';
import clipLine from './clip_line';
import { getAnchors } from './get_anchors';
import classifyRings from './classify_rings';
import findPoleOfInaccessibility from './find_pole_of_inaccessibility';

export function getPointAnchors(point, lineVertex, textMaxAngle, shape, scale, EXTENT, placement, spacing, is3DPitchText, altitudeToTileScale) {
    const { feature, iconSize, textSize, symbol } = point;
    const glyphSize = (iconSize || textSize) ? 24 : 0;
    const fontScale = textSize ? textSize[0] / glyphSize : 1;
    const textBoxScale = scale * fontScale;
    if (placement === 'line') {
        const anchors = [];
        anchors.countOutOfAngle = 0;
        let lines = feature.geometry;
        if (EXTENT) {
            lines = clipLine(feature.geometry, 0, 0, EXTENT, EXTENT);
        }

        for (let i = 0; i < lines.length; i++) {
            const lineAnchors = getAnchors(lines[i],
                spacing,
                textMaxAngle,
                symbol['isIconText'] ? null : shape && shape.vertical || shape && shape.horizontal || shape,
                null, //shapedIcon,
                glyphSize,
                symbol['isIconText'] ? 1 : textBoxScale,
                1, //bucket.overscaling,
                EXTENT || Infinity,
                is3DPitchText,
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
            anchors.countOutOfAngle += lineAnchors.countOutOfAngle || 0;
        }
        return anchors;
    } else {
        return getFeatureAnchors(feature, placement, EXTENT);
    }
}


export function getFeatureAnchors(feature, placement, EXTENT, hasRotation, zScale) {
    const anchors = [];
    if (feature.type === 3) {
        const rings = classifyRings(feature.geometry, 0);
        for (let i = 0; i < rings.length; i++) {
            const polygon = rings[i];
            if (placement === 'vertex') {
                for (let ii = 0; ii < polygon.length; ii++) {
                    const ring = polygon[ii];
                    for (let iii = 0; iii < ring.length; iii++) {
                        if (!isOut(ring[iii], EXTENT)) {
                            anchors.push(ring[iii]);
                            if (hasRotation) {
                                if (iii === 0) {
                                    computeRotation(ring[iii], ring[iii], ring[ii + 1], zScale);
                                } else {
                                    computeRotation(ring[iii], ring[iii - 1], ring[iii], zScale);
                                }
                            }
                        }
                    }
                }
            } else if (placement === 'vertex-first') {
                const ring = polygon[0];
                if (ring && ring[0] && !isOut(ring[0], EXTENT)) {
                    anchors.push(ring[0]);
                    if (hasRotation) {
                        computeRotation(ring[0], ring[0], ring[1], zScale);
                    }
                }

            } else if (placement === 'vertex-last' || placement === 'vertex-firstlast') {
                const ring = polygon[0];
                if (placement === 'vertex-firstlast' && ring && ring[0] && !isOut(ring[0], EXTENT)) {
                    anchors.push(ring[0]);
                    if (hasRotation) {
                        computeRotation(ring[0], ring[0], ring[1], zScale);
                    }
                }
                if (ring && ring[ring.length - 1] && !isOut(ring[ring.length - 1], EXTENT)) {
                    const index = ring.length - 1;
                    anchors.push(ring[index]);
                    if (hasRotation) {
                        computeRotation(ring[index], ring[index - 1], ring[index], zScale);
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
                        if (hasRotation) {
                            if (ii === 0) {
                                computeRotation(line[ii], line[ii], line[ii + 1], zScale);
                            } else {
                                computeRotation(line[ii], line[ii - 1], line[ii], zScale);
                            }
                        }
                    }
                }
            } else if (placement === 'vertex-last' || placement === 'vertex-firstlast') {
                if (placement === 'vertex-firstlast' && !isOut(line[0], EXTENT)) {
                    anchors.push(line[0]);
                    if (hasRotation) {
                        computeRotation(line[0], line[0], line[1], zScale);
                    }
                }
                if (line && line[line.length - 1] && !isOut(line[line.length - 1], EXTENT)) {
                    const index = line.length - 1;
                    anchors.push(line[index]);
                    if (hasRotation) {
                        computeRotation(line[index], line[index - 1], line[index], zScale);
                    }
                }
            } else {
                if (!isOut(line[0], EXTENT)) {
                    anchors.push(line[0]);
                    if (hasRotation) {
                        computeRotation(line[0], line[0], line[1], zScale);
                    }
                }
            }
        }
    } else if (feature.type === 1) {
        for (let i = 0; i < feature.geometry.length; i++) {
            const points = feature.geometry[i];
            for (let ii = 0; ii < points.length; ii++) {
                const point = points[ii];
                if (!isOut(point, EXTENT)) {
                    if (hasRotation) {
                        point.xRotation = 0;
                        point.yRotation = 0;
                        point.zRotation = 0;
                    }
                    anchors.push(point);
                }
            }
        }
    }
    return anchors;
}


function computeRotation(out, p0, p1, zScale) {
    if (out.xRotation || out.yRotation || out.zRotation) {
        return out;
    }
    // debugger
    const dx = p1.x - p0.x;
    const dy = p0.y - p1.y;
    const dz = (p1.z - p0.z) * zScale;
    const zRotation = Math.atan2(dy, dx);
    out.zRotation = zRotation;
    const xyRotation = Math.atan2(dz, Math.sqrt(dx * dx + dy * dy));
    out.xyRotation = xyRotation;
    return out;
}
