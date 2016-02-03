var Symboling = {};
//有中心点的图形的共同方法
Symboling.Center = {
    _getRenderPoints:function(placement) {
        return [this._getCenterViewPoint()];
    }
};
/**
 * 获取symbolizer所需的数据
 */
Z.Marker.include(Symboling.Center);

Z.Ellipse.include(Symboling.Center,{
    _getRenderSize:function() {
        var w = this.getWidth(),
            h = this.getHeight();
        var map = this.getMap();
        return map.distanceToPixel(w/2,h/2);
    }
});

Z.Circle.include(Symboling.Center,{
    _getRenderSize:function() {
        var radius = this.getRadius();
        var map = this.getMap();
        return map.distanceToPixel(radius,radius);
    }
});
//----------------------------------------------------
Z.Sector.include(Symboling.Center,{
    _getRenderSize:function() {
        var radius = this.getRadius();
        var map = this.getMap();
        return map.distanceToPixel(radius,radius);
    }
});
//----------------------------------------------------
Z.Rectangle.include({
    _getRenderPoints:function(placement) {
        var domNw = this.getMap()._transformToViewPoint(this._getPrjCoordinates());
        return [domNw];
    },

    _getRenderSize:function() {
        var w = this.getWidth(),
            h = this.getHeight();
        var map = this.getMap();
        return map.distanceToPixel(w, h);
    }
});
//----------------------------------------------------
Symboling.Poly={
    _getRenderPoints:function(placement) {
        var map = this.getMap();
        var points;
        if ('vertex' === placement) {
            points = this._transformToViewPoint(this._getPrjCoordinates());
        } else if ('line' === placement) {
            //var vertexes = this._transformToViewPoint(this._getPrjCoordinates());
            points = [];
            //TODO 获取线段中心点
        } else {
            var center = this.getCenter();
            var pcenter = this._getProjection().project(center);
            points = [map._transformToViewPoint(pcenter)];
        }
        return points;
    }
};

Z.Polyline.include(Symboling.Poly);

Z.Polygon.include(Symboling.Poly);
