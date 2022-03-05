/**
 * Indicates if the provided Points are in a counter clockwise (true) or clockwise (false) order
 *
 * @private
 * @returns true for a counter clockwise set of points
 */
// http://bryceboe.com/2006/10/23/line-segment-intersection-algorithm/
export function isCounterClockwise(a, b, c) {
    return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
}

/**
 * Returns the signed area for the polygon ring.  Postive areas are exterior rings and
 * have a clockwise winding.  Negative areas are interior rings and have a counter clockwise
 * ordering.
 *
 * @private
 * @param ring Exterior or interior ring
 */
export function calculateSignedArea(ring) {
    let sum = 0;
    for (let i = 0, len = ring.length, j = len - 1, p1, p2; i < len; j = i++) {
        p1 = ring[i];
        p2 = ring[j];
        if (p1.x !== undefined) {
            sum += (p2.x - p1.x) * (p1.y + p2.y);
        } else {
            sum += (p2[0] - p1[0]) * (p1[1] + p2[1]);
        }

    }
    return sum;
}

export function isClippedEdge(vertices, i0, i1, width, EXTENT) {
    const x0 = vertices[i0 * width], y0 = vertices[i0 * width + 1],
        x1 = vertices[i1 * width], y1 = vertices[i1 * width + 1];
    return x0 === x1 && (x0 < 0 || x0 > EXTENT) && y0 !== y1 ||
        y0 === y1 && (y0 < 0 || y0 > EXTENT) && x0 !== x1;
}

export function getHeightValue(properties, heightProp, defaultValue) {
    //prepare altitude property
    let height = defaultValue;
    if (heightProp && properties) {
        height = properties[heightProp];
    }
    if (height === undefined) {
        height = defaultValue;
    }
    return (height || 0) * 10;//乘以10是因为 tileTransform 中是以分米为单位，但这里是以米为单位
}

export function getFeaAltitudeAndHeight(feature, altitudeScale, altitudeProperty, defaultAltitude, heightProperty, defaultHeight, minHeightProperty) {
    if (!altitudeScale && altitudeScale !== 0) {
        altitudeScale = 1;
    }
    const altitudeValue = getHeightValue(feature.properties, altitudeProperty, defaultAltitude);
    const altitude = altitudeValue * altitudeScale;

    let height = altitudeValue;
    if (heightProperty) {
        height = getHeightValue(feature.properties, heightProperty, defaultHeight);
    } else if (minHeightProperty) {
        height = altitudeValue - getHeightValue(feature.properties, minHeightProperty, 0);
    }
    height *= altitudeScale;
    return {
        altitude, height
    };
}

export function isOut(point, extent) {
    return extent < Infinity && (point.x < 0 || point.x > extent || point.y < 0 || point.y > extent);
}

export function isNil(v) {
    return v === null || v === undefined;
}

/**
 * Check whether the object is a string
 * @param {Object} obj
 * @return {Boolean}
 * @memberOf Util
 */
export function isString(obj) {
    if (isNil(obj)) {
        return false;
    }
    return typeof obj === 'string' || (obj.constructor !== null && obj.constructor === String);
}

export function wrap(n, min, max) {
    if (n === max || n === min) {
        return n;
    }
    const d = max - min;
    const w = ((n - min) % d + d) % d + min;
    return w;
}
