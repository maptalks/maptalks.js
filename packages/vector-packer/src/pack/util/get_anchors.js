// @flow

// import { number as interpolate } from '../style-spec/util/interpolate';

import Anchor from './Anchor';
import checkMaxAngle from './check_max_angle';

export { getAnchors, getCenterAnchor };

function getLineLength(line) {
    let lineLength = 0;
    for (let k = 0; k < line.length - 1; k++) {
        lineLength += line[k].dist(line[k + 1]);
    }
    return lineLength;
}

function getAngleWindowSize(shapedText,
    glyphSize,
    boxScale) {
    return shapedText ?
        3 / 5 * glyphSize * boxScale :
        0;
}

function getLabelLength(shapedText, shapedIcon) {
    return Math.max(
        shapedText ? shapedText.right - shapedText.left : 0,
        shapedIcon ? shapedIcon.right - shapedIcon.left : 0);
}

function getCenterAnchor(line,
    maxAngle,
    shapedText,
    shapedIcon,
    glyphSize,
    boxScale) {
    const angleWindowSize = getAngleWindowSize(shapedText, glyphSize, boxScale);
    const labelLength = getLabelLength(shapedText, shapedIcon);

    let prevDistance = 0;
    const centerDistance = getLineLength(line) / 2;

    for (let i = 0; i < line.length - 1; i++) {

        const a = line[i],
            b = line[i + 1];

        const segmentDistance = a.dist(b);

        if (prevDistance + segmentDistance > centerDistance) {
            // The center is on this segment
            const t = (centerDistance - prevDistance) / segmentDistance,
                x = interpolate(a.x, b.x, t),
                y = interpolate(a.y, b.y, t);

            const anchor = new Anchor(x, y, b.angleTo(a), i);
            anchor._round();
            if (angleWindowSize &&
                !checkMaxAngle(line, anchor, labelLength, angleWindowSize, maxAngle)) {
                return null;
            }

            return anchor;
        }

        prevDistance += segmentDistance;
    }
    return null;
}

function getAnchors(line,
    spacing,
    maxAngle,
    shapedText,
    shapedIcon,
    glyphSize,
    boxScale,
    overscaling,
    tileExtent,
    // 高度(centimeter转为瓦片空间坐标)
    is3DPitchText,
    altitudeToTileScale) {

    // Resample a line to get anchor points for labels and check that each
    // potential label passes text-max-angle check and has enough froom to fit
    // on the line.

    const angleWindowSize = getAngleWindowSize(shapedText, glyphSize, boxScale);
    const labelLength = getLabelLength(shapedText, shapedIcon);

    // Is the line continued from outside the tile boundary?
    const isLineContinued = line[0].x === 0 || line[0].x === tileExtent || line[0].y === 0 || line[0].y === tileExtent;

    // Is the label long, relative to the spacing?
    // If so, adjust the spacing so there is always a minimum space of `spacing / 4` between label edges.
    if (spacing - labelLength * boxScale  < spacing / 4) {
        spacing = labelLength * boxScale + spacing / 4;
    }

    // Offset the first anchor by:
    // Either half the label length plus a fixed extra offset if the line is not continued
    // Or half the spacing if the line is continued.

    // For non-continued lines, add a bit of fixed extra offset to avoid collisions at T intersections.
    const fixedExtraOffset = glyphSize * 2;

    const offset = !isLineContinued ?
        ((labelLength / 2 + fixedExtraOffset) * boxScale * overscaling) % spacing :
        (spacing / 2 * overscaling) % spacing;

    return resample(line, offset, spacing, angleWindowSize, maxAngle, labelLength * boxScale, isLineContinued, false, tileExtent, is3DPitchText, altitudeToTileScale);
}


function resample(line, offset, spacing, angleWindowSize, maxAngle, labelLength, isLineContinued, placeAtMiddle, tileExtent, is3DPitchText, altitudeToTileScale) {
    let count = 0;
    const halfLabelLength = labelLength / 2;
    const lineLength = getLineLength(line);

    let distance = 0,
        markedDistance = offset - spacing;

    let anchors = [];

    for (let i = 0; i < line.length - 1; i++) {

        const a = line[i],
            b = line[i + 1];

        const segmentDist = a.dist(b),
            angle = b.angleTo(a);

        while (markedDistance + spacing < distance + segmentDist) {
            markedDistance += spacing;

            const t = (markedDistance - distance) / segmentDist,
                x = interpolate(a.x, b.x, t),
                y = interpolate(a.y, b.y, t),
                z = interpolate(a.z || 0, b.z || 0, t);

            // Check that the point is within the tile boundaries and that
            // the label would fit before the beginning and end of the line
            // if placed at this point.
            if (x >= 0 && x < tileExtent && y >= 0 && y < tileExtent &&
                    markedDistance - halfLabelLength >= 0 &&
                    markedDistance + halfLabelLength <= lineLength) {
                const anchor = new Anchor(x, y, angle, i);
                anchor.z = z;
                if (is3DPitchText) {
                    // perp of [x - a.x, y - a.y]
                    anchor.axis = [a.y - y, x - a.x];
                    // 0.9是个magic number，用来让文字旋转角度更准确
                    anchor.angleR = (z === (a.z || 0)) ? 0 : Math.atan((z - (a.z || 0)) * 0.9 * altitudeToTileScale / a.dist(anchor));
                }

                anchor.line = line; //fuzhen 在anchor上增加了对line的引用，方便计算沿线偏移量
                anchor._round();

                if (!angleWindowSize || checkMaxAngle(line, anchor, labelLength, angleWindowSize, maxAngle)) {
                    anchors.push(anchor);
                } else if (angleWindowSize) {
                    count++;
                }
            }
        }

        distance += segmentDist;
    }

    if (!placeAtMiddle && !anchors.length && !isLineContinued) {
        // The first attempt at finding anchors at which labels can be placed failed.
        // Try again, but this time just try placing one anchor at the middle of the line.
        // This has the most effect for short lines in overscaled tiles, since the
        // initial offset used in overscaled tiles is calculated to align labels with positions in
        // parent tiles instead of placing the label as close to the beginning as possible.
        anchors = resample(line, distance / 2, spacing, angleWindowSize, maxAngle, labelLength, isLineContinued, true, tileExtent, is3DPitchText, altitudeToTileScale);
    }

    anchors.countOutOfAngle = count;
    return anchors;
}

function interpolate(a, b, t) {
    return (a * (1 - t)) + (b * t);
}
