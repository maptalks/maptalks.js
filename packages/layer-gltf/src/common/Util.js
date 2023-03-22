import { Coordinate } from 'maptalks';

/**
 * Whether the object is null or undefined.
 * @param  {Object}  obj - object
 * @return {Boolean}
 */
export function isNil(obj) {
    return obj == null;
}


export function defined(obj) {
    return !isNil(obj);
}

export function isEmptyObject(e) {
    let t;
    for (t in e)
        return !1;
    return !0;
}

export function intersectArray(a, b) {
    const bSet = new Set(b);
    return Array.from(new Set(a.filter(v => bSet.has(v))));
}

export function coordinateToWorld(map, coordinate, z = 0) {
    if (!map || !(coordinate instanceof Coordinate)) {
        return null;
    }
    const p = map.coordinateToPointAtRes(coordinate, map.getGLRes());
    return [p.x, p.y, z];
}

export function getFitExtent(map, fitSize, zoom) {
    return fitSize * map.getGLScale(zoom);
}

export function getAbsoluteURL(url) {
    let a = document.createElement('a');
    a.href = url;
    url = a.href;
    a = null;
    return url;
}

export function getAbsoluteValue(value, s) {
    return Math.abs(value) * Math.sign(s);
}
