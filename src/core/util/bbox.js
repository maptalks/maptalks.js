export const BBOX_TEMP = [];

//reset bbox
export function resetBBOX(bbox) {
    bbox[0] = Infinity;
    bbox[1] = Infinity;
    bbox[2] = -Infinity;
    bbox[3] = -Infinity;
}

//cal points bbox:linestring,polygon etc
export function pointsBBOX(points, out) {
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

export function setBBOX(bbox, x1, y1, x2, y2) {
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

export function validateBBOX(bbox) {
    return bbox && bbox[0] !== Infinity && bbox[0] !== undefined;
}
