var Symboling = {};
//有中心点的图形的共同方法
Symboling.Center = {
    _getRenderPoints:function () {
        return [[this._getCenterViewPoint()], null];
    }
};
/**
 * 获取symbolizer所需的数据
 */
Z.Marker.include(Symboling.Center);

Z.Ellipse.include(Symboling.Center, {
    _getRenderSize:function () {
        var w = this.getWidth(),
            h = this.getHeight();
        var map = this.getMap();
        return map.distanceToPixel(w / 2, h / 2);
    }
});

Z.Circle.include(Symboling.Center, {
    _getRenderSize:function () {
        var radius = this.getRadius();
        var map = this.getMap();
        return map.distanceToPixel(radius, radius);
    }
});
//----------------------------------------------------
Z.Sector.include(Symboling.Center, {
    _getRenderSize:function () {
        var radius = this.getRadius();
        var map = this.getMap();
        return map.distanceToPixel(radius, radius);
    }
});
//----------------------------------------------------
Z.Rectangle.include({
    _getRenderPoints:function (placement) {
        if (placement === 'point') {
            var shell = this.getShell();
            var points = [];
            for (var i = 0, len = shell.length; i < len; i++) {
                points.push(this.getMap().coordinateToViewPoint(shell[i]));
            }
            return [points, null];
        } else {
            var c = this.getMap().coordinateToViewPoint(this.getCenter());
            return [[c], null];
        }
    },

    _getRenderSize:function () {
        var w = this.getWidth(),
            h = this.getHeight();
        var map = this.getMap();
        return map.distanceToPixel(w, h);
    }
});
//----------------------------------------------------
Symboling.Poly = {
    _getRenderPoints:function (placement) {
        var map = this.getMap();
        var points, rotations = null;
        if (placement === 'point') {
            points = this._getPathViewPoints(this._getPrjCoordinates());
            if (points && points.length > 0 && Z.Util.isArray(points[0])) {
                //anti-meridian
                points = points[0].concat(points[1]);
            }
        } else if (placement === 'line') {
            points = [];
            rotations = [];
            var vertice = this._getPathViewPoints(this._getPrjCoordinates()),
                isSplitted =  vertice.length > 0 && Z.Util.isArray(vertice[0]);
            var i, len;
            if (isSplitted) {
                //anti-meridian splitted
                var ring, ii, ilen;
                for (i = 1, len = vertice.length; i < len; i++) {
                    ring = vertice[i];
                    if (this instanceof Z.Polygon && ring.length > 0 && !ring[0].equals(ring[ring.length - 1])) {
                        ring.push(ring[0]);
                    }
                    for (ii = 1, ilen = ring.length; ii < ilen; ii++) {
                        points.push(ring[ii].add(ring[ii - 1])._multi(0.5));
                        rotations.push(Z.Util.computeDegree(ring[ii - 1], ring[ii]));
                    }
                }
            } else {
                if (this instanceof Z.Polygon && vertice.length > 0 && !vertice[0].equals(vertice[vertice.length - 1])) {
                    vertice.push(vertice[0]);
                }
                for (i = 1, len = vertice.length; i < len; i++) {
                    points.push(vertice[i].add(vertice[i - 1])._multi(0.5));
                    rotations.push(Z.Util.computeDegree(vertice[i - 1], vertice[i]));
                }
            }

        } else {
            var center = this.getCenter();
            var pcenter = this._getProjection().project(center);
            points = [map._prjToViewPoint(pcenter)];
        }
        return [points, rotations];
    }
};

Z.Polyline.include(Symboling.Poly);

Z.Polygon.include(Symboling.Poly);
