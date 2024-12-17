import Coordinate from '../../geo/Coordinate';
import lineclip from 'lineclip';

const minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;

export type BBOX = [number, number, number, number]

export function getDefaultBBOX(): BBOX {
    return [minx, miny, maxx, maxy];
}

export const BBOX_TEMP = getDefaultBBOX();

/**
 * 重置bbox
 *
 * @english
 * reset bbox
 * @param bbox
 */
export function resetBBOX(bbox: BBOX) {
    bbox[0] = minx;
    bbox[1] = miny;
    bbox[2] = maxx;
    bbox[3] = maxy;
}

/**
 * cal points bbox:linestring,polygon etc
 *
 * @english
 * cal points bbox:linestring,polygon etc
 * @param points
 * @param out
 * @returns
 */
export function pointsBBOX(points: Coordinate, out: BBOX): void;
export function pointsBBOX(points: Coordinate[], out: BBOX): void;
export function pointsBBOX(points: any, out: any) {
    if (!points) {
        return;
    }
    if (Array.isArray(points[0])) {
        for (let i = 0, len = points.length; i < len; i++) {
            pointsBBOX(points[i], out);
        }
    } else if (Array.isArray(points)) {
        for (let i = 0, len = points.length; i < len; i++) {
            const { x, y } = points[i];
            out[0] = Math.min(x, out[0]);
            out[1] = Math.min(y, out[1]);
            out[2] = Math.max(x, out[2]);
            out[3] = Math.max(y, out[3]);
        }
    } else {
        const { x, y } = points;
        out[0] = Math.min(x, out[0]);
        out[1] = Math.min(y, out[1]);
        out[2] = Math.max(x, out[2]);
        out[3] = Math.max(y, out[3]);
    }
}

export function setBBOX(bbox: BBOX, x1?: number | BBOX, y1?: number, x2?: number, y2?: number) {
    if (x1 !== 0 && !x1) {
        return;
    }
    //x1 is bbox array
    if (Array.isArray(x1)) {
        y1 = x1[1];
        x2 = x1[2];
        y2 = x1[3];
        x1 = x1[0];
    }
    bbox[0] = Math.min(x1, bbox[0]);
    bbox[1] = Math.min(y1, bbox[1]);
    bbox[2] = Math.max(x2, bbox[2]);
    bbox[3] = Math.max(y2, bbox[3]);
}

export function validateBBOX(bbox?: BBOX) {
    return bbox && bbox[0] !== Infinity && bbox[0] !== undefined;
}

export function bufferBBOX(bbox: BBOX, bufferSize = 0) {
    bbox[0] -= bufferSize;
    bbox[1] -= bufferSize;
    bbox[2] += bufferSize;
    bbox[3] += bufferSize;
}

export function bboxIntersect(bbox1: BBOX, bbox2: BBOX) {
    if (bbox1[2] < bbox2[0]) {
        return false;
    }
    if (bbox1[1] > bbox2[3]) {
        return false;
    }
    if (bbox1[0] > bbox2[2]) {
        return false;
    }
    if (bbox1[3] < bbox2[1]) {
        return false;
    }
    return true;
}

export function bboxInBBOX(bbox1: BBOX, bbox2: BBOX) {
    const [x1, y1, x2, y2] = bbox1;
    return x1 >= bbox2[0] && x2 <= bbox2[2] && y1 >= bbox2[1] && y2 <= bbox2[3];
}

/**
 * bbox Intersect Mask
 * apply on TileLayer,VectorTileLayer,Geo3DTileLayer Layers
 * @param bbox 
 * @param maskGeoJSON(Polygon/MultiPolygon GeoJSON)
 * @returns 
 */
export function bboxInMask(bbox: BBOX, maskGeoJSON: Record<string, any>): boolean {
    //geojson bbox
    const maskBBOX = maskGeoJSON.bbox;
    if (!maskBBOX) {
        console.error('maskGeoJSON bbox is null:', maskGeoJSON);
        return false;
    }
    if (!bboxIntersect(maskBBOX, bbox)) {
        return false;
    } else {
        const geometry = maskGeoJSON.geometry;
        if (!geometry) {
            console.error('maskGeoJSON is error,not find geometry.', maskGeoJSON);
            return false;
        }
        let { coordinates } = geometry;
        const type = geometry.type;
        if (type === 'Polygon') {
            coordinates = [coordinates];
        }
        for (let i = 0, len = coordinates.length; i < len; i++) {
            const rings = coordinates[i];
            const outRing = rings[0];
            const result = lineclip.polygon(outRing, bbox);
            if (result.length > 0) {
                let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
                for (let j = 0, len1 = result.length; j < len1; j++) {
                    const [x, y] = result[j];
                    minx = Math.min(x, minx);
                    miny = Math.min(y, miny);
                    maxx = Math.max(x, maxx);
                    maxy = Math.max(y, maxy);
                }
                if (minx !== maxx && miny !== maxy) {
                    return true;
                }
            }
        }
        return false;
    }
}