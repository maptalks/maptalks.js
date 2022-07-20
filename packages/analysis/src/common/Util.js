import * as maptalks from 'maptalks';


export function containerPointToWorldPoint(point, map) {
    const coordinate = map.containerPointToCoordinate(new maptalks.Point(point.x, point.y));
    return map.coordinateToPointAtRes(coordinate, map.getGLRes());
}

export function isNil(obj) {
    return obj == null;
}

export function defined(obj) {
    return !isNil(obj);
}

export function altitudeToDistance(map, z) {
    return map.altitudeToPoint(z || 0, map.getGLRes());
}

const COORD = new maptalks.Coordinate(0, 0);

export function coordinateToWorld(map, x, y, z) {
    if (!map) {
        return null;
    }
    COORD.set(x, y);
    const p = map.coordinateToPointAtRes(COORD, map.getGLRes());
    const height = altitudeToDistance(map, z);
    return [p.x, p.y, height];
}
