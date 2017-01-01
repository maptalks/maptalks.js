import { isArray, computeDegree } from 'core/util';
import Marker from 'geometry/Marker';
import Ellipse from 'geometry/Ellipse';
import Circle from 'geometry/Circle';
import Sector from 'geometry/Sector';
import Rectangle from 'geometry/Rectangle';
import LineString from 'geometry/LineString';
import Polygon from 'geometry/Polygon';

// 有中心点的图形的共同方法
const Center = {
    _getRenderPoints() {
        return [[this._getCenter2DPoint(this.getMap().getMaxZoom())], null];
    }
};

/**
 * 获取symbolizer所需的数据
 */
Marker.include(Center);

Ellipse.include(Center, {
    _getRenderSize() {
        var w = this.getWidth(),
            h = this.getHeight();
        var map = this.getMap();
        return map.distanceToPixel(w / 2, h / 2, map.getMaxZoom());
    }
});

Circle.include(Center, {
    _getRenderSize() {
        var radius = this.getRadius();
        var map = this.getMap();
        return map.distanceToPixel(radius, radius, map.getMaxZoom());
    }
});
//----------------------------------------------------
Sector.include(Center, {
    _getRenderSize() {
        var radius = this.getRadius();
        var map = this.getMap();
        return map.distanceToPixel(radius, radius, map.getMaxZoom());
    }
});
//----------------------------------------------------
Rectangle.include({
    _getRenderPoints(placement) {
        if (placement === 'vertex') {
            var shell = this.getShell();
            var points = [];
            for (var i = 0, len = shell.length; i < len; i++) {
                points.push(this.getMap().coordinateToPoint(shell[i]));
            }
            return [points, null];
        } else {
            var c = this.getMap().coordinateToPoint(this.getCenter());
            return [
                [c], null
            ];
        }
    },

    _getRenderSize() {
        var w = this.getWidth(),
            h = this.getHeight();
        var map = this.getMap();
        return map.distanceToPixel(w, h, map.getMaxZoom());
    }
});

//----------------------------------------------------
const Poly = {
    _getRenderPoints(placement) {
        var map = this.getMap();
        var maxZoom = map.getMaxZoom();
        var points, rotations = null;
        if (placement === 'vertex') {
            points = this._getPath2DPoints(this._getPrjCoordinates(), false, maxZoom);
            if (points && points.length > 0 && isArray(points[0])) {
                //anti-meridian
                points = points[0].concat(points[1]);
            }
        } else if (placement === 'line') {
            points = [];
            rotations = [];
            var vertice = this._getPath2DPoints(this._getPrjCoordinates(), false, maxZoom),
                isSplitted =  vertice.length > 0 && isArray(vertice[0]);
            var i, len;
            if (isSplitted) {
                //anti-meridian splitted
                var ring, ii, ilen;
                for (i = 1, len = vertice.length; i < len; i++) {
                    ring = vertice[i];
                    if (this instanceof Polygon && ring.length > 0 && !ring[0].equals(ring[ring.length - 1])) {
                        ring.push(ring[0]);
                    }
                    for (ii = 1, ilen = ring.length; ii < ilen; ii++) {
                        points.push(ring[ii].add(ring[ii - 1])._multi(0.5));
                        rotations.push(computeDegree(ring[ii - 1], ring[ii]));
                    }
                }
            } else {
                if (this instanceof Polygon && vertice.length > 0 && !vertice[0].equals(vertice[vertice.length - 1])) {
                    vertice.push(vertice[0]);
                }
                for (i = 1, len = vertice.length; i < len; i++) {
                    points.push(vertice[i].add(vertice[i - 1])._multi(0.5));
                    rotations.push(computeDegree(vertice[i - 1], vertice[i]));
                }
            }

        } else if (placement === 'vertex-first') {
            var first = this._getPrjCoordinates()[0];
            points = [map._prjToPoint(first, maxZoom)];
        } else if (placement === 'vertex-last') {
            var last = this._getPrjCoordinates()[this._getPrjCoordinates().length - 1];
            points = [map._prjToPoint(last, maxZoom)];
        } else {
            var pcenter = this._getProjection().project(this.getCenter());
            points = [map._prjToPoint(pcenter, maxZoom)];
        }
        return [points, rotations];
    }
};

LineString.include(Poly);

Polygon.include(Poly);
