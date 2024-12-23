import * as maptalks from '@maptalks/map';
import Point from '@mapbox/point-geometry';
import { projectPoint } from './projection';
import { vec3 } from '@maptalks/gl';
import { INVALID_ALTITUDE } from '../../../../common/Constant';

const CURRENT2 = [];
const PREV2 = [];
const P2 = [];

/**
 * based on placeGlyphAlongLine in projection.js of mapbox-gl-js
 * @param {Number[]} out -
 * @param {Number[]} anchor - quad's anchor
 * @param {}
 * @param {Number} dx - offset x
 * @param {Number} dy - offset y
 */
export function getLineOffset(out, mesh, line, projectedAnchor, anchor, glyphOffset, dx, dy, segment, lineStartIndex, lineLength, fontScale, flip, scale, elevatedAnchor, vtLayer, mvpMatrix, isPitchWithMap) {
    if (!elevatedAnchor) {
        elevatedAnchor = projectedAnchor;
    }
    const linePoints = mesh.geometry.properties.line;

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

    let current = Point.convert(projectedAnchor);
    let prev = Point.convert(projectedAnchor);

    let currentPoint = Point.convert(anchor);
    let prevPoint = Point.convert(anchor);

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

        prevPoint.x = currentPoint.x;
        prevPoint.y = currentPoint.y;

        current.x = line[currentIndex * 3];
        current.y = line[currentIndex * 3 + 1];

        currentPoint.x = linePoints[currentIndex * 3];
        currentPoint.y = linePoints[currentIndex * 3 + 1];

        distanceToPrev += currentSegmentDistance;
        currentSegmentDistance = prev.dist(current) / scale;
    }
    // The point is on the current segment. Interpolate to find it.
    const segmentInterpolationT = (absOffsetX - distanceToPrev) / currentSegmentDistance;

    const renderer = vtLayer && vtLayer.getRenderer();
    const terrainHelper = renderer && renderer.getTerrainHelper();
    const terrainTileInfos = mesh.properties.tile.terrainTileInfos;
    // const terrainTileInfo = mesh.properties.tile.terrainTileInfo;
    if (!isPitchWithMap && terrainHelper) {
        const { extent } = mesh.properties.tile;
        const tileScale = vtLayer.getTileSize().width / extent;
        const map = vtLayer.getMap();
        const prevToCurrent = currentPoint.sub(prevPoint);
        let p = prevToCurrent.mult(segmentInterpolationT)._add(prevPoint);

        current = elevate(CURRENT2, map, mesh, currentPoint, tileScale, vtLayer, mvpMatrix, terrainTileInfos);
        prev = elevate(PREV2, map, mesh, prevPoint, tileScale, vtLayer, mvpMatrix, terrainTileInfos);
        p = elevate(P2, map, mesh, p, tileScale, vtLayer, mvpMatrix, terrainTileInfos);

        const segmentAngle = angle + Math.atan2(current[1] - prev[1], current[0] - prev[0]);

        out[0] = (p[0] - elevatedAnchor[0]) / scale;
        out[1] = (p[1] - elevatedAnchor[1]) / scale;
        out[2] = segmentAngle;
        return out;
    }

    const prevToCurrent = current.sub(prev);
    const p = prevToCurrent.mult(segmentInterpolationT)._add(prev);

    // offset the point from the line to text-offset and icon-offset
    p._add(prevToCurrent._unit()._perp()._mult(dy * dir));

    const segmentAngle = angle + Math.atan2(current.y - prev.y, current.x - prev.x);

    out[0] = (p.x - projectedAnchor[0]) / scale;
    out[1] = (p.y - projectedAnchor[1]) / scale;
    out[2] = segmentAngle;

    return out;
}

const INVALID_OFFSET = [-99999, -99999];
const TILEPOINT = new maptalks.Point(0, 0);
const TEMP_V3 = [];

function elevate(out, map, mesh, anchor, tileScale, vtLayer, mvpMatrix, terrainTileInfos) {
    const { res, extent, extent2d } = mesh.properties.tile;
    const { xmin, ymax } = extent2d;
    const x = xmin + anchor.x * tileScale;
    const y = ymax - anchor.y * tileScale;
    let terrainTileInfo = null;
    if (terrainTileInfos) {
        for (let i = 0; i < terrainTileInfos.length; i++) {
            if (inTerrainTile(terrainTileInfos[i], x, y, res)) {
                terrainTileInfo = terrainTileInfos[i];
                break;

            }
        }
    }
    if (!terrainTileInfo) {
        return INVALID_OFFSET;
    }
    const tilePoint = TILEPOINT.set(xmin, ymax);
    const altitudeResult = vtLayer.queryTilePointTerrain(anchor, terrainTileInfo, tilePoint, extent, res);
    const altitude = altitudeResult[0] === null ? INVALID_ALTITUDE : altitudeResult[0];
    if (altitude) {
        let elevatedAnchor = vec3.set(TEMP_V3, anchor.x, anchor.y, 0);
        elevatedAnchor[2] += altitude * 100;
        elevatedAnchor = projectPoint(out, elevatedAnchor, mvpMatrix, map.width, map.height);
        return elevatedAnchor;
    } else {
        out[0] = anchor.x;
        out[1] = anchor.y;
        return out;
    }
}


export function inTerrainTile(tileInfo, x, y, res) {
    const point0 = TILEPOINT.set(x, y);
    const point1 = point0['_multi'](res / tileInfo.res);
    return tileInfo.extent2d.contains(point1);
}
