Z.symbolizer.PointSymbolizer=Z.symbolizer.CanvasSymbolizer.extend({
    getPixelExtent:function() {
        var extent = new Z.PointExtent();
        var markerExtent = this.getMarkerExtent();
        var min = markerExtent.getMin(),
            max = markerExtent.getMax();
        var renderPoints = this._getRenderPoints();
        for (var i = renderPoints.length - 1; i >= 0; i--) {
            var point = renderPoints[i];
            extent = extent.combine(new Z.PointExtent(point.add(min), point.add(max)));
        }
        return extent;
    },

    _getRenderPoints:function() {
       return this.geometry._getPainter()._getRenderPoints(this.getPlacement());
    },

    /**
     * Get container points to draw on Canvas
     * @return {*} [description]
     */
    _getRenderContainerPoints:function() {
        var points = this._getRenderPoints();
        var map = this.getMap();
        var matrix = map._getRenderer().getTransform();
        var dxdy = this.getDxDy();
        if (matrix) {
            var scale = matrix._scale;
            dxdy = new Z.Point(dxdy.x/scale.x, dxdy.y/scale.y);
        }

        var containerPoints = Z.Util.eachInArray(points,this,function(point) {
            return map.viewPointToContainerPoint(point)._add(dxdy);
        });
        var layer = this.geometry.getLayer();
        if (layer.isCanvasRender()) {
            if (matrix) {
                var p = matrix.applyToArray(containerPoints);
                return p;
            }
        }
        return containerPoints;
    }
});
