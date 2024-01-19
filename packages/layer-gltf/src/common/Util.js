import { Coordinate, measurer, Util } from 'maptalks';
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

export function coordinateToWorld(map, coordinate) {
    if (!map || !coordinate) {
        return null;
    }
    let coord = coordinate;
    if (Array.isArray(coordinate)) {
        if (!Util.isNumber(coordinate[0])) {
            return null;
        }
        coord = new Coordinate(coordinate);
    }
    const p = map.coordinateToPointAtRes(coord, map.getGLRes());
    const z = map.altitudeToPoint(coord.z || 0, map.getGLRes());
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

export function getGLTFAnchorsAlongLine(from, to, options) {
    const measure = measurer.Measurer.getInstance();
    const dist = measure.measureLenBetween(from, to);
    const modelBBoxWidth = options.gapLength + options.bboxWidth;
    let count = options.count;
    if (count && options['snapToEndVertexes']) {
        count = count - 1;
    }
    const boxWidth = count > 0 ? dist / count : modelBBoxWidth;
    const times = Math.floor(dist / boxWidth);
    const items = [];
    const map = options.map;
    const rotationZ = options.rotateAlongLine + getRotation(from, to, map);
    //取余缩放
    if (times >= 1) {
        const start = 0, end = times;
        if (options['snapToEndVertexes']) {
            for (let i = start; i <= end; i++) {
                const t = boxWidth * i / dist;
                const item = {
                    coordinates: calItemCenter(from, to, t),
                    scale: [1, 1, 1],
                    rotation: [0, 0, rotationZ]
                }
                items.push(item);
            }
        } else {
            for (let i = start + 1; i <= end; i++) {
                const t = boxWidth * (i - 0.5) / dist;
                const item = {
                    coordinates: calItemCenter(from, to, t),
                    scale: [1, 1, 1],
                    rotation: [0, 0, rotationZ]
                }
                items.push(item);
            }
        }
        //尾巴
        if (options['scaleEndModel']) {
            const t = (boxWidth * times + (dist - boxWidth * times) / 2) / dist;
            const scale = (dist - boxWidth * times) / boxWidth;
            const item = {
                coordinates: calItemCenter(from, to, t),
                scale: [scale, 1, 1],
                rotation: [0, 0, rotationZ]
            }
            items.push(item);
        }
    } else if (options['scaleEndModel']) {
        const scale = dist / boxWidth;
        const item = {
            coordinates: calItemCenter(from, to, 0.5),
            scale: [scale, 1, 1],
            rotation: [0, 0, rotationZ]
        }
        items.push(item);
    }
    return items;
}

function getRotation(from, to, map) {
    const res = map.getGLRes();
    const vp = map.coordinateToPointAtRes(from, res);
    const vp1 = map.coordinateToPointAtRes(to, res);
    const degree = Util.computeDegree(
        vp1.x, vp1.y,
        vp.x, vp.y
    );
    return degree / Math.PI * 180;
}

function calItemCenter(from ,to, t) {
    const x = lerp(from.x, to.x, t);
    const y = lerp(from.y, to.y, t);
    return new Coordinate(x, y);
}

function lerp(a, b, t) {
    return a + t * (b - a);
}
