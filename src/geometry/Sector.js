/**
 * 扇形类
 * @class maptalks.Sector
 * @extends maptalks.Polygon
 * @author Maptalks Team
 */
Z['Sector']=Z.Sector=Z.Polygon.extend({
    includes:[Z.Geometry.Center],

    options:{
        'numberOfPoints':60
    },

    type:Z.Geometry['TYPE_SECTOR'],

    initialize:function(coordinates,radius,startAngle,endAngle,opts) {
        this._coordinates = new Z.Coordinate(coordinates);
        this._radius = radius;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
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
     * 返回扇形的开始角
     * @return {Number} 开始角
     * @expose
     */
    getStartAngle:function() {
        return this.startAngle;
    },

    /**
     * 设定扇形的开始角
     * @param {Number} startAngle 扇形开始角
     * @expose
     */
    setStartAngle:function(startAngle) {
        this.startAngle = startAngle;
        this._onShapeChanged();
        return this;
    },

    /**
     * 返回扇形的结束角
     * @return {Number} 结束角
     * @expose
     */
    getEndAngle:function() {
        return this.endAngle;
    },

    /**
     * 设定扇形的结束角
     * @param {Number} endAngle 扇形结束角
     * @expose
     */
    setEndAngle:function(endAngle) {
        this.endAngle = endAngle;
        this._onShapeChanged();
        return this;
    },

    /**
     * 将扇形转化为Polygon的外环坐标数组
     * @return {[Coordinate]} 转换后的坐标数组
     * @expose
     */
    getShell:function() {
        var measurer = this._getMeasurer();
        var center = this.getCoordinates();
        var numberOfPoints = this.options['numberOfPoints'];
        var radius = this.getRadius();
        var shell = [];
        var angle = this.getEndAngle()-this.getStartAngle();
        for (var i=0;i<numberOfPoints;i++) {
            var rad = (angle*i/numberOfPoints+this.getStartAngle())*Math.PI/180;
            var dx = radius*Math.cos(rad);
            var dy = radius*Math.sin(rad);
            var vertex = measurer.locate(center, dx, dy);
            shell.push(vertex);
        }
        return shell;

    },

    /**
     * 返回空洞
     * @return {[type]} [description]
     * @expose
     */
    getHoles:function() {
        return null;
    },

    _containsPoint: function(point) {
        var center = this._getCenterViewPoint(),
            t = this._hitTestTolerance(),
            size = this.getSize(),
            pc = center,
            pp = point,
            x = pp.x - pc.x,
            y = pc.y - pp.y,
            atan2 = Math.atan2(y, x),
            // [0.0, 360.0)
            angle = atan2 < 0 ? (atan2 + 2 * Math.PI) * 360 / (2 * Math.PI) :
                atan2 * 360 / (2 * Math.PI);
        var sAngle = this.startAngle % 360,
            eAngle = this.endAngle % 360;
        var between = false;
        if (sAngle > eAngle) {
            between = !(angle > eAngle && angle < sAngle);
        } else {
            between = (angle >= sAngle && angle <= eAngle);
        }

        // TODO: tolerance
        return pp.distanceTo(pc) <= size.width / 2 && between;
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
        return Math.PI*2*this._radius*Math.abs(this.startAngle-this.endAngle)/360+2*this._radius;
    },

    _computeGeodesicArea:function(measurer) {
        if (Z.Util.isNil(this._radius)) {
            return 0;
        }
        return Math.PI*Math.pow(this._radius,2)*Math.abs(this.startAngle-this.endAngle)/360;
    },

    _exportGeoJSONGeometry:function() {
        var center  = this.getCenter();
        return {
            'type':         "Sector",
            'coordinates':  [center.x,center.y],
            'radius':       this.getRadius(),
            'startAngle':   this.getStartAngle(),
            'endAngle':     this.getEndAngle()
        };
    }
});
