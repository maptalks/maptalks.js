/**
 * 椭圆形类
 * @class maptalks.Ellipse
 * @extends maptalks.Polygon
 * @author Maptalks Team
 */
Z.Ellipse = Z.Polygon.extend({
    includes:[Z.Geometry.Center],

    options:{
        'numberOfPoints':60
    },

    type:Z.Geometry['TYPE_ELLIPSE'],

    initialize:function(coordinates,width,height,opts) {
        this._coordinates = new Z.Coordinate(coordinates);
        this.width = width;
        this.height = height;
        this._initOptions(opts);
    },

    /**
     * 返回椭圆的宽度
     * @return {Number} [椭圆宽度]
     * @expose
     */
    getWidth:function() {
        return this.width;
    },

    /**
     * 设置椭圆宽度
     * @param {Number} width [新的半径]
     * @expose
     */
    setWidth:function(width) {
        this.width = width;
        this._onShapeChanged();
        return this;
    },

    /**
     * 返回椭圆的高度
     * @return {Number} [椭圆高度]
     * @expose
     */
    getHeight:function() {
        return this.height;
    },

    /**
     * 设置椭圆高度
     * @param {Number} height [椭圆高度]
     * @expose
     */
    setHeight:function(height) {
        this.height = height;
        this._onShapeChanged();
        return this;
    },

    /**
     * 覆盖Polygon的getShell方法, 将椭圆形转化为多边形的外环坐标数组
     * @return {[Coordinate]} 外环坐标数组
     * @expose
     */
    getShell:function() {
        var measurer = this._getMeasurer();
        var center = this.getCoordinates();
        var numberOfPoints = this.options['numberOfPoints'];
        var width = this.getWidth(),
            height = this.getHeight();
        var shell = [];
        var s = Math.pow(width,2)*Math.pow(height,2),
            sx = Math.pow(width,2),
            sy = Math.pow(height,2);
        for (var i=0;i<numberOfPoints;i++) {
            var rad = (360*i/numberOfPoints)*Math.PI/180;
            var dx = Math.sqrt(s/(sx*Math.pow(Math.tan(rad),2)+sy));
            var dy = Math.sqrt(s/(sy*Math.pow(1/Math.tan(rad),2)+sx));
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
        var map = this.getMap(),
            t = this._hitTestTolerance(),
            pa = map.distanceToPixel(this.width / 2, 0),
            pb = map.distanceToPixel(0, this.height /2),
            a = pa.width,
            b = pb.height,
            c = Math.sqrt(Math.abs(a * a - b * b)),
            xfocus = a >= b;
        var center = this._getCenterViewPoint();
        var f1, f2, d;
        if (xfocus) {
            f1 = new Z.Point(center.x - c, center.y);
            f2 = new Z.Point(center.x + c, center.y);
            d = a * 2;
        } else {
            f1 = new Z.Point(center.x, center.y - c);
            f2 = new Z.Point(center.x, center.y + c);
            d = b * 2;
        }
        point = new Z.Point(point.x, point.y);

        /*
         L1 + L2 = D
         L1 + t >= L1'
         L2 + t >= L2'
         D + 2t >= L1' + L2'
         */
        return point.distanceTo(f1) + point.distanceTo(f2) <= d + 2 * t;
    },

    _computeExtent:function(measurer) {
        if (!measurer || !this._coordinates || Z.Util.isNil(this.width) || Z.Util.isNil(this.height)) {
            return null;
        }
        var width = this.getWidth(),
            height = this.getHeight();
        var p1 = measurer.locate(this._coordinates,width/2,height/2);
        var p2 = measurer.locate(this._coordinates,-width/2,-height/2);
        return new Z.Extent(p1,p2);
    },

    _computeGeodesicLength:function(measurer) {
        if (Z.Util.isNil(this.width) || Z.Util.isNil(this.height)) {
            return 0;
        }
        //L=2πb+4(a-b)
        //近似值
        var longer = (this.width > this.height?this.width:this.height);
        return 2*Math.PI*longer/2-4*Math.abs(this.width-this.height);
    },

    _computeGeodesicArea:function(measurer) {
        if (Z.Util.isNil(this.width) || Z.Util.isNil(this.height)) {
            return 0;
        }
        return Math.PI*this.width*this.height/4;
    },


    _exportGeoJSONGeometry:function() {
        var center = this.getCenter();
        return {
            'type':'Ellipse',
            'coordinates':[center.x, center.y],
            'width':this.getWidth(),
            'height':this.getHeight()
        };
    }

});
