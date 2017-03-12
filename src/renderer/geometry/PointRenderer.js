import Marker from 'geometry/Marker';
import Ellipse from 'geometry/Ellipse';
import Circle from 'geometry/Circle';
import Sector from 'geometry/Sector';
import Rectangle from 'geometry/Rectangle';
import LineString from 'geometry/LineString';
import Polygon from 'geometry/Polygon';

// 有中心点的图形的共同方法
const CenterPointRenderer = {
    _getRenderPoints() {
        return [[this._getCenter2DPoint(this.getMap().getMaxZoom())], null];
    }
};

/**
 * 获取symbolizer所需的数据
 */
Marker.include(CenterPointRenderer);

Ellipse.include(CenterPointRenderer);

Circle.include(CenterPointRenderer);
//----------------------------------------------------
Sector.include(CenterPointRenderer);
//----------------------------------------------------
Rectangle.include({
    _getRenderPoints(placement) {
        const map = this.getMap();
        if (placement === 'vertex') {
            const shell = this.getShell();
            const points = [];
            for (let i = 0, len = shell.length; i < len; i++) {
                points.push(this.getMap().coordinateToPoint(shell[i]), map.getMaxZoom());
            }
            return [points, null];
        } else {
            const c = this.getMap().coordinateToPoint(this.getCenter(), map.getMaxZoom());
            return [
                [c], null
            ];
        }
    }
});

//----------------------------------------------------
const PolyRenderer = {
    _getRenderPoints(placement) {
        const map = this.getMap();
        const maxZoom = map.getMaxZoom();
        var points, rotations = null;
        if (placement === 'vertex') {
            points = this._getPath2DPoints(this._getPrjCoordinates(), false, maxZoom);
            if (points && points.length > 0 && Array.isArray(points[0])) {
                //anti-meridian
                points = points[0].concat(points[1]);
            }
        } else if (placement === 'line') {
            points = [];
            rotations = [];
            let vertice = this._getPath2DPoints(this._getPrjCoordinates(), false, maxZoom),
                isSplitted =  vertice.length > 0 && Array.isArray(vertice[0]);
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
            let first = this._getPrjCoordinates()[0];
            points = [map._prjToPoint(first, maxZoom)];
        } else if (placement === 'vertex-last') {
            let last = this._getPrjCoordinates()[this._getPrjCoordinates().length - 1];
            points = [map._prjToPoint(last, maxZoom)];
        } else {
            let pcenter = this._getProjection().project(this.getCenter());
            points = [map._prjToPoint(pcenter, maxZoom)];
        }
        return [points, rotations];
    }
};

LineString.include(PolyRenderer);

Polygon.include(PolyRenderer);
