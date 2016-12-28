/**
 * @classdesc
 * Base symbolizer class for all the point type symbol styles.
 * @abstract
 * @class
 * @protected
 * @memberOf maptalks.symbolizer
 * @name PointSymbolizer
 * @extends {maptalks.symbolizer.CanvasSymbolizer}
 */
maptalks.symbolizer.PointSymbolizer = maptalks.symbolizer.CanvasSymbolizer.extend(/** @lends maptalks.symbolizer.PointSymbolizer */{
    get2DExtent: function (resources) {
        var map = this.getMap(),
            maxZoom = map.getMaxZoom();
        if (!this._2dExtent) {
            this._2dExtent = new maptalks.PointExtent();
            var renderPoints = this._getRenderPoints()[0];
            for (var i = renderPoints.length - 1; i >= 0; i--) {
                this._2dExtent._combine(renderPoints[i]);
            }
        }
        var extent = new maptalks.PointExtent(map._pointToPoint(this._2dExtent.getMin(), maxZoom), map._pointToPoint(this._2dExtent.getMax(), maxZoom));
        var m = this._isFunctionStyle ? this.getMarkerExtent(resources) : this._markerExtent;
        if (!m) {
            m = this._markerExtent = this.getMarkerExtent(resources);
        }
        extent['xmin'] += m['xmin'];
        extent['ymin'] += m['ymin'];
        extent['xmax'] += m['xmax'];
        extent['ymax'] += m['ymax'];
        return extent;
    },

    _getRenderPoints: function () {
        return this.getPainter().getRenderPoints(this.getPlacement());
    },

    /**
     * Get container points to draw on Canvas
     * @return {maptalks.Point[]}
     */
    _getRenderContainerPoints: function () {
        var painter = this.getPainter(),
            points = this._getRenderPoints()[0];
        if (painter.isSpriting()) {
            return points;
        }
        var map = this.getMap();
        var maxZoom = map.getMaxZoom();
        var dxdy = this.getDxDy(),
            layerPoint = map._pointToContainerPoint(this.geometry.getLayer()._getRenderer()._northWest);
        var containerPoints = maptalks.Util.mapArrayRecursively(points, function (point) {
            return map._pointToContainerPoint(point, maxZoom)._add(dxdy)._substract(layerPoint);
        });
        return containerPoints;
    },

    _getRotationAt: function (i) {
        var r = this.getRotation(),
            rotations = this._getRenderPoints()[1];
        if (!rotations) {
            return r;
        }
        if (!r) {
            r = 0;
        }
        return rotations[i] + r;
    },

    _rotate: function (ctx, origin, rotation) {
        if (!maptalks.Util.isNil(rotation)) {
            ctx.save();
            ctx.translate(origin.x, origin.y);
            ctx.rotate(rotation);
            return new maptalks.Point(0, 0);
        }
        return null;
    }
});
