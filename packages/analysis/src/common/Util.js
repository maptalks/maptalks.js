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

export function coordinateToWorld(map, coordinate) {
    if (!map || !coordinate) {
        return null;
    }
    const p = map.coordinateToPointAtRes(new maptalks.Coordinate(coordinate[0], coordinate[1]), map.getGLRes());
    const height = altitudeToDistance(map, coordinate[2]);
    return [p.x, p.y, height];
}
