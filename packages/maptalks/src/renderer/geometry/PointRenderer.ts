import Marker from '../../geometry/Marker';
import Ellipse from '../../geometry/Ellipse';
import Circle from '../../geometry/Circle';
import Sector from '../../geometry/Sector';
import Rectangle from '../../geometry/Rectangle';
import LineString from '../../geometry/LineString';
import Polygon from '../../geometry/Polygon';
import Point from '../../geo/Point';
import { WithNull } from "../../types/typings";

// 有中心点的图形的共同方法
const CenterPointRenderer = {
    //@internal
    _getRenderPoints(): [Point[], WithNull<Point[]>] {
        return [[this._getCenter2DPoint(this.getMap().getGLRes())], null];
    }
};

export type CenterPointRendererType = typeof CenterPointRenderer;

declare module '../../geometry/Marker' {
    interface Marker extends CenterPointRendererType { }
}

/**
 * 获取symbolizer所需的数据
 */
Marker.include(CenterPointRenderer);

Ellipse.include(CenterPointRenderer);

Circle.include(CenterPointRenderer);

Sector.include(CenterPointRenderer);

Rectangle.include({
    //@internal
    _getRenderPoints(placement?: string): [Point[], WithNull<Point[]>] {
        const map = this.getMap();
        const glRes = map.getGLRes();
        if (placement === 'vertex') {
            const shell = this._trimRing(this.getShell());
            const points = [];
            for (let i = 0, len = shell.length; i < len; i++) {
                points.push(map.coordToPointAtRes(shell[i], glRes));
            }
            return [points, null];
        } else {
            const c = map.coordToPointAtRes(this.getCenter(), glRes);
            return [
                [c], null
            ];
        }
    }
});

//----------------------------------------------------
const PolyRenderer = {
    //@internal
    _getRenderPoints(placement?: string) {
        const map = this.getMap();
        const glRes = map.getGLRes();
        let points, rotations = null;
        if (placement === 'point') {
            points = this._getPath2DPoints(this._getPrjCoordinates(), false, glRes);
            if (points && points.length > 0 && Array.isArray(points[0])) {
                //anti-meridian
                points = points[0].concat(points[1]);
            }
        } else if (placement === 'vertex') {
            points = this._getPath2DPoints(this._getPrjCoordinates(), false, glRes);
            rotations = [];
            if (points && points.length > 0 && Array.isArray(points[0])) {
                for (let i = 0, l = points.length; i < l; i++) {
                    for (let ii = 0, ll = points[i].length; ii < ll; ii++) {
                        if (ii === 0) {
                            rotations.push([points[i][ii], points[i][ii + 1]]);
                        } else {
                            rotations.push([points[i][ii - 1], points[i][ii]]);
                        }
                    }
                }
                points = points[0].concat(points[1]);
            } else {
                for (let i = 0, l = points.length; i < l; i++) {
                    if (i === 0) {
                        rotations.push([points[i], points[i + 1]]);
                    } else {
                        rotations.push([points[i - 1], points[i]]);
                    }
                }
            }
        } else if (placement === 'line') {
            points = [];
            rotations = [];
            const vertice = this._getPath2DPoints(this._getPrjCoordinates(), false, glRes),
                isSplitted = vertice.length > 0 && Array.isArray(vertice[0]);
            if (isSplitted) {
                //anti-meridian splitted
                let ring;
                for (let i = 1, l = vertice.length; i < l; i++) {
                    ring = vertice[i];
                    if (this instanceof Polygon && ring.length > 0 && !ring[0].equals(ring[ring.length - 1])) {
                        ring.push(ring[0]);
                    }
                    for (let ii = 1, ll = ring.length; ii < ll; ii++) {
                        points.push(ring[ii].add(ring[ii - 1])._multi(0.5));
                        rotations.push([ring[ii - 1], ring[ii]]);
                    }
                }
            } else {
                if (this instanceof Polygon && vertice.length > 0 && !vertice[0].equals(vertice[vertice.length - 1])) {
                    vertice.push(vertice[0]);
                }
                for (let i = 1, l = vertice.length; i < l; i++) {
                    points.push(vertice[i].add(vertice[i - 1])._multi(0.5));
                    rotations.push([vertice[i - 1], vertice[i]]);
                }
            }

        } else if (placement === 'vertex-first') {
            const coords = this._getPrjCoordinates();
            const l = coords.length;
            const point0 = l ? map._prjToPointAtRes(coords[0], glRes) : null;
            points = l ? [point0] : [];
            rotations = l ? [[point0, coords[1] ? map._prjToPointAtRes(coords[1], glRes) : point0]] : [];
        } else if (placement === 'vertex-last') {
            const coords = this._getPrjCoordinates();
            const l = coords.length;
            const curretPoint = l ? map._prjToPointAtRes(coords[l - 1], glRes) : null;
            points = l ? [curretPoint] : [];
            const previous = l > 1 ? l - 2 : l - 1;
            rotations = l ? [[coords[previous] ? map._prjToPointAtRes(coords[previous], glRes) : curretPoint, curretPoint]] : [];
        } else if (placement === 'vertex-firstlast') {
            points = [];
            rotations = [];
            const coords = this._getPrjCoordinates();
            const l = coords.length;
            if (l) {
                //first
                const point0 = map._prjToPointAtRes(coords[0], glRes)
                points = [point0];
                if (l > 1) {
                    rotations = [[point0, map._prjToPointAtRes(coords[1], glRes)]];
                    const point1 = map._prjToPointAtRes(coords[l - 1], glRes);
                    points.push(point1);
                    const previous = l > 1 ? l - 2 : l - 1;
                    rotations.push([map._prjToPointAtRes(coords[previous], glRes), point1]);
                }
            }
        } else {
            const center = this.getCenter();
            if (!center) {
                points = [];
            } else {
                const pcenter = this._getProjection().project(center);
                points = [map._prjToPointAtRes(pcenter, glRes)];
            }
        }
        return [points, rotations];
    }
};

declare module '../../geometry/LineString' {
    // @ts-expect-error 确实需要重写父类的属性
    interface LineString {
        //@internal
        _getRenderPoints(placement?: string): [Point[], WithNull<Point[]>];
    }
}

LineString.include(PolyRenderer);

declare module '../../geometry/Polygon' {
    interface Polygon {
        //@internal
        _getRenderPoints(placement?: string): [Point[], WithNull<Point[]>];
    }
}

Polygon.include(PolyRenderer);
