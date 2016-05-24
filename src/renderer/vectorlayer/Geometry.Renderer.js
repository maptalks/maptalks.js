var Symboling = {};
//有中心点的图形的共同方法
Symboling.Center = {
    _getRenderPoints:function () {
        return [this._getCenterViewPoint()];
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
        if (placement === 'vertex') {
            var shell = this.getShell();
            var points = [];
            for (var i = 0, len = shell.length; i < len; i++) {
                points.push(this.getMap().coordinateToViewPoint(shell[i]));
            }
            return points;
        } else {
            var domNw = this.getMap()._prjToViewPoint(this._getPrjCoordinates());
            return [domNw];
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
        var points;
        if (placement === 'vertex') {
            points = this._prjToViewPoint(this._getPrjCoordinates());
        } else if (placement === 'line') {
            //var vertexes = this._prjToViewPoint(this._getPrjCoordinates());
            points = [];
            //TODO 获取线段中心点
        } else {
            var center = this.getCenter();
            var pcenter = this._getProjection().project(center);
            points = [map._prjToViewPoint(pcenter)];
        }
        return points;
    }
};

Z.Polyline.include(Symboling.Poly);

Z.Polygon.include(Symboling.Poly);
