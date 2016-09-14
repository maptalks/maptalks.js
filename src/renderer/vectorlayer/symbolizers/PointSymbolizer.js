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
Z.symbolizer.PointSymbolizer = Z.symbolizer.CanvasSymbolizer.extend(/** @lends maptalks.symbolizer.PointSymbolizer */{
    get2DExtent: function () {
        var extent = new Z.PointExtent(),
            m = this.getMarkerExtent();
        var renderPoints = this._getRenderPoints()[0];
        for (var i = renderPoints.length - 1; i >= 0; i--) {
            extent._combine(renderPoints[i]);
        }
        extent['xmin'] += m['xmin'];
        extent['ymin'] += m['ymin'];
        extent['xmax'] += m['xmax'];
        extent['ymax'] += m['ymax'];
        return extent;
    },

    _getRenderPoints: function () {
        return this.geometry._getPainter().getRenderPoints(this.getPlacement());
    },

    /**
     * Get container points to draw on Canvas
     * @return {maptalks.Point[]}
     */
    _getRenderContainerPoints: function () {
        var painter = this.geometry._getPainter(),
            points = this._getRenderPoints()[0];
        if (painter.isSpriting()) {
            return points;
        }
        var matrices = painter.getTransformMatrix(),
            matrix = matrices ? matrices['container'] : null,
            scale = matrices ? matrices['scale'] : null,
            dxdy = this.getDxDy(),
            layerPoint = this.geometry.getLayer()._getRenderer()._extent2D.getMin();
        if (matrix) {
            dxdy = new Z.Point(dxdy.x / scale.x, dxdy.y / scale.y);
        }

        var containerPoints = Z.Util.mapArrayRecursively(points, function (point) {
            return point.substract(layerPoint)._add(dxdy);
        });
        if (matrix) {
            return matrix.applyToArray(containerPoints);
        }
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
        if (!Z.Util.isNil(rotation)) {
            ctx.save();
            ctx.translate(origin.x, origin.y);
            ctx.rotate(rotation);
            return new Z.Point(0, 0);
        }
        return null;
    }
});
