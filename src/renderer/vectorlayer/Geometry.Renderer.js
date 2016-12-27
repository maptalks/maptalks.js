var Symboling = {};
//有中心点的图形的共同方法
Symboling.Center = {
    _getRenderPoints:function () {
        return [[this._getCenter2DPoint(this.getMap().getMaxZoom())], null];
    }
};
/**
 * 获取symbolizer所需的数据
 */
maptalks.Marker.include(Symboling.Center);

maptalks.Ellipse.include(Symboling.Center, {
    _getRenderSize:function () {
        var w = this.getWidth(),
            h = this.getHeight();
        var map = this.getMap();
        return map.distanceToPixel(w / 2, h / 2, map.getMaxZoom());
    }
});

maptalks.Circle.include(Symboling.Center, {
    _getRenderSize:function () {
        var radius = this.getRadius();
        var map = this.getMap();
        return map.distanceToPixel(radius, radius, map.getMaxZoom());
    }
});
//----------------------------------------------------
maptalks.Sector.include(Symboling.Center, {
    _getRenderSize:function () {
        var radius = this.getRadius();
        var map = this.getMap();
        return map.distanceToPixel(radius, radius, map.getMaxZoom());
    }
});
//----------------------------------------------------
maptalks.Rectangle.include({
    _getRenderPoints:function (placement) {
        if (placement === 'vertex') {
            var shell = this.getShell();
            var points = [];
            for (var i = 0, len = shell.length; i < len; i++) {
                points.push(this.getMap().coordinateToPoint(shell[i]));
            }
            return [points, null];
        } else {
            var c = this.getMap().coordinateToPoint(this.getCenter());
            return [[c], null];
        }
    },

    _getRenderSize:function () {
        var w = this.getWidth(),
            h = this.getHeight();
        var map = this.getMap();
        return map.distanceToPixel(w, h, map.getMaxZoom());
    }
});
//----------------------------------------------------
Symboling.Poly = {
    _getRenderPoints:function (placement) {
        var map = this.getMap();
        var maxZoom = map.getMaxZoom();
        var points, rotations = null;
        if (placement === 'vertex') {
            points = this._getPath2DPoints(this._getPrjCoordinates(), false, maxZoom);
            if (points && points.length > 0 && maptalks.Util.isArray(points[0])) {
                //anti-meridian
                points = points[0].concat(points[1]);
            }
        } else if (placement === 'line') {
            points = [];
            rotations = [];
            var vertice = this._getPath2DPoints(this._getPrjCoordinates(), false, maxZoom),
                isSplitted =  vertice.length > 0 && maptalks.Util.isArray(vertice[0]);
            var i, len;
            if (isSplitted) {
                //anti-meridian splitted
                var ring, ii, ilen;
                for (i = 1, len = vertice.length; i < len; i++) {
                    ring = vertice[i];
                    if (this instanceof maptalks.Polygon && ring.length > 0 && !ring[0].equals(ring[ring.length - 1])) {
                        ring.push(ring[0]);
                    }
                    for (ii = 1, ilen = ring.length; ii < ilen; ii++) {
                        points.push(ring[ii].add(ring[ii - 1])._multi(0.5));
                        rotations.push(maptalks.Util.computeDegree(ring[ii - 1], ring[ii]));
                    }
                }
            } else {
                if (this instanceof maptalks.Polygon && vertice.length > 0 && !vertice[0].equals(vertice[vertice.length - 1])) {
                    vertice.push(vertice[0]);
                }
                for (i = 1, len = vertice.length; i < len; i++) {
                    points.push(vertice[i].add(vertice[i - 1])._multi(0.5));
                    rotations.push(maptalks.Util.computeDegree(vertice[i - 1], vertice[i]));
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

maptalks.Polyline.include(Symboling.Poly);

maptalks.Polygon.include(Symboling.Poly);
