/**
 * 矩形类
 * @class maptalks.Rectangle
 * @extends maptalks.Polygon
 * @author Maptalks Team
 */
Z['Rectangle'] = Z.Rectangle = Z.Polygon.extend({

    type:Z.Geometry['TYPE_RECT'],

    initialize:function(coordinates,width,height,opts) {
        this._coordinates = new Z.Coordinate(coordinates);
        this._width = width;
        this._height = height;
        this._initOptions(opts);
    },


    /**
     * 返回矩形左上角坐标
     * @return {Coordinate} [左上角坐标]
     * @expose
     */
    getCoordinates:function() {
        return this._coordinates;
    },

    /**
     * 设置新的矩形左上角坐标
     * @param {Coordinate} center 新的center
     * @expose
     */
    setCoordinates:function(nw){
        this._coordinates = new Z.Coordinate(nw);

        if (!this._coordinates || !this.getMap()) {
            this._onPositionChanged();
            return this;
        }
        var projection = this._getProjection();
        this._setPrjCoordinates(projection.project(this._coordinates));
        return this;
    },

    /**
     * 返回矩形的宽度
     * @return {Number} [矩形宽度]
     * @expose
     */
    getWidth:function() {
        return this._width;
    },

    /**
     * 设置矩形宽度
     * @param {Number} width [新的半径]
     * @expose
     */
    setWidth:function(width) {
        this._width = width;
        this._onShapeChanged();
        return this;
    },

    /**
     * 返回矩形的高度
     * @return {Number} [矩形高度]
     * @expose
     */
    getHeight:function() {
        return this._height;
    },

    /**
     * 设置矩形高度
     * @param {Number} height [矩形高度]
     * @expose
     */
    setHeight:function(height) {
        this._height = height;
        this._onShapeChanged();
        return this;
    },

    /**
     * 覆盖Polygon的getShell方法, 将矩形转化为多边形的外环坐标数组
     * @return {[Coordinate]} 外环坐标数组
     * @expose
     */
    getShell:function() {
        var measurer = this._getMeasurer();
        var nw =this._coordinates;
        var points = [];
        points.push(nw);
        points.push(measurer.locate(nw,this._width,0));
        points.push(measurer.locate(nw,this._width,this._height));
        points.push(measurer.locate(nw,0,this._height));
        points.push(nw);
        return points;

    },

    /**
     * 覆盖Polygon的getHoles方法
     * @return {[Coordinate]} 空洞坐标
     * @expose
     */
    getHoles:function() {
        return null;
    },

    _getPrjCoordinates:function() {
        var projection = this._getProjection();
        if (!projection) {return null;}
        if (!this._pnw) {
            if (this._coordinates) {
                this._pnw = projection.project(this._coordinates);
            }
        }
        return this._pnw;
    },

    /**
     * 设置投影坐标
     * @param {Coordinate} pnw 投影坐标
     */
    _setPrjCoordinates:function(pnw) {
        this._pnw=pnw;
        this._onPositionChanged();
    },


    /**
     * 修改投影坐标后调用该方法更新经纬度坐标缓存.
     * @return {[type]} [description]
     */
    _updateCache:function() {
        delete this._extent;
        var projection = this._getProjection();
        if (this._pnw && projection) {
            this._coordinates = projection.unproject(this._pnw);
        }
    },

    _clearProjection:function() {
        this._pnw = null;
    },

    /**
     * 计算中心店
     * @param  {[type]} measurer [description]
     * @return {[type]}            [description]
     */
    _computeCenter:function(measurer) {
        return measurer.locate(this._coordinates,this._width/2,-this._height/2);
    },

    _containsPoint: function(point) {
        var map = this.getMap(),
            t = this._hitTestTolerance(),
            sp = map.coordinateToViewPoint(this._coordinates),
            pxSize = map.distanceToPixel(this._width, this._height);

        var pxMin = new Z.Point(sp.x, sp.y),
            pxMax = new Z.Point(sp.x + pxSize.width, sp.y + pxSize.height),
            pxExtent = new Z.Extent(pxMin.x - t, pxMin.y - t,
                                    pxMax.x + t, pxMax.y + t);

        point = new Z.Point(point.x, point.y);

        return pxExtent.contains(point);
    },

    _computeExtent:function(measurer) {
        if (!measurer || !this._coordinates || Z.Util.isNil(this._width) || Z.Util.isNil(this._height)) {
            return null;
        }
        var width = this.getWidth(),
            height = this.getHeight();
        var p1 = measurer.locate(this._coordinates,width,-height);
        return new Z.Extent(p1,this._coordinates);
    },

    _computeGeodesicLength:function(measurer) {
        if (Z.Util.isNil(this._width) || Z.Util.isNil(this._height)) {
            return 0;
        }
        return 2*(this._width+this._height);
    },

    _computeGeodesicArea:function(measurer) {
        if (Z.Util.isNil(this._width) || Z.Util.isNil(this._height)) {
            return 0;
        }
        return this._width*this._height;
    },


    _exportGeoJSONGeometry:function() {
        var nw =this.getCoordinates();
        return {
            'type':"Rectangle",
            'coordinates':[nw.x,nw.y],
            'width':this.getWidth(),
            'height':this.getHeight()
        };
    }

});
