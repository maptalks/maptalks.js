/**
 * 圆形类
 * @class maptalks.Circle
 * @extends maptalks.Polygon
 * @author Maptalks Team
 */
Z.Circle=Z.Polygon.extend({
    includes:[Z.Geometry.Center],

    options:{
        'numberOfPoints':60
    },

    type:Z.Geometry['TYPE_CIRCLE'],

    initialize:function(coordinates,radius,opts) {
        this._coordinates = new Z.Coordinate(coordinates);
        this._radius = radius;
        this._initOptions(opts);
    },

    /**
     * 返回圆形的半径
     * @return {Number} [圆形半径]
     * @expose
     */
    getRadius:function() {
        return this._radius;
    },

    /**
     * 设置圆形半径
     * @param {Number} radius [新的半径]
     * @expose
     */
    setRadius:function(radius) {
        this._radius = radius;
        this._onShapeChanged();
        return this;
    },

    /**
     * 覆盖Polygon的getShell方法, 将圆形转化为多边形的外环坐标数组
     * @return {[Coordinate]} 外环坐标数组
     * @expose
     */
    getShell:function() {
        var measurer = this._getMeasurer();
        var center = this.getCoordinates();
        var numberOfPoints = this.options['numberOfPoints'];
        var radius = this.getRadius();
        var shell = [];
        for (var i=0;i<numberOfPoints;i++) {
            var rad = (360*i/numberOfPoints)*Math.PI/180;
            var dx = radius*Math.cos(rad);
            var dy = radius*Math.sin(rad);
            var vertex = measurer.locate(center, dx, dy);
            shell.push(vertex);
        }
        return shell;
    },

    /**
     * 覆盖Polygon的getHoles方法
     * @return {[Coordinate]} 空洞坐标
     * @expose
     */
    getHoles:function() {
        return null;
    },

    _containsPoint: function(point) {
        var center = this._getCenterViewPoint(),
            size = this.getSize(),
            t = this._hitTestTolerance(),
            pc = new Z.Point(center.x, center.y),
            pp = new Z.Point(point.x, point.y);

        return pp.distanceTo(pc) <= size.width / 2 + t;
    },

    _computeExtent:function(measurer) {
        if (!measurer || !this._coordinates || Z.Util.isNil(this._radius)) {
            return null;
        }

        var radius = this._radius;
        var p1 = measurer.locate(this._coordinates,radius,radius);
        var p2 = measurer.locate(this._coordinates,-radius,-radius);
        return new Z.Extent(p1,p2);
    },

    _computeGeodesicLength:function(measurer) {
        if (Z.Util.isNil(this._radius)) {
            return 0;
        }
        return Math.PI*2*this._radius;
    },

    _computeGeodesicArea:function(measurer) {
        if (Z.Util.isNil(this._radius)) {
            return 0;
        }
        return Math.PI*Math.pow(this._radius,2);
    },


    _exportGeoJSONGeometry:function() {
        var center = this.getCoordinates();
        return {
            'type':'Circle',
            'coordinates':[center.x, center.y],
            'radius':this.getRadius()
        };
    }

});
