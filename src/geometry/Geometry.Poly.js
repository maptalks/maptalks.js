/**
 * 多折线/多边形工具类
 * @class maptalks.Geometry.Poly
 * @author Maptalks Team
 */
Z.Geometry.Poly={
    /**
     * 将points中的坐标转化为用于显示的容器坐标
     * @param  {Coordinate[]} prjCoords  投影坐标数组
     * @returns {Point[]} 容器坐标数组
     * @ignore
     */
    _transformToViewPoint:function(prjCoords) {
        var result = [];
        if (!Z.Util.isArrayHasData(prjCoords)) {
            return result;
        }
        var map = this.getMap(),
            fullExtent = map.getFullExtent(),
            projection = this._getProjection();

        var isAntiMeridian = this.options['antiMeridian'];

        var isClipping = map.options['clipFullExtent'],
            isSimplify = this.getLayer() && this.getLayer().options['enableSimplify'],
            tolerance,
            is2dArray = Z.Util.isArray(prjCoords[0])

        if (isSimplify) {
            var pxTolerance = 2;
            tolerance = map._getResolution()*pxTolerance;
        }
        if (!is2dArray && isSimplify) {
            prjCoords = Z.Simplify.simplify(prjCoords, tolerance, false);
        }
        var preCoordinate;
        for (var i=0,len=prjCoords.length;i<len;i++) {
            var p = prjCoords[i];
            if (Z.Util.isNil(p) || (isClipping && !fullExtent.contains(p))) {
                continue;
            }
            if (is2dArray) {
                if (!Z.Util.isArrayHasData(p)) {
                    result.push([]);
                    continue;
                }
                if (isSimplify) {
                    p = Z.Simplify.simplify(p, tolerance, false);
                }
                var p_r = [];
                for (var j=0,jlen=p.length;j<jlen;j++) {
                    var pp = p[j];
                    if (Z.Util.isNil(p[j])) {
                        continue;
                    }
                    if (j > 0 && (isAntiMeridian && isAntiMeridian !== 'default')) {
                        pp = this._antiMeridian(pp, p[j-1], projection, isAntiMeridian);
                    }
                    p_r.push(map._transformToViewPoint(pp));
                }
                delete this._preAntiMeridianCoord;
                result.push(p_r);
            } else {
                if (i > 0 && (isAntiMeridian && isAntiMeridian !== 'default')) {
                    p = this._antiMeridian(p, prjCoords[i-1], projection, isAntiMeridian);
                }
                var pp = map._transformToViewPoint(p);
                result.push(pp);
            }
        }
        delete this._preAntiMeridianCoord;
        return result;
    },

    _antiMeridian:function(p, preCoord, projection, isAntiMeridian) {
        var pre;
        //cache last projected coordinate, to improve some perf.
        if (this._preAntiMeridianCoord) {
            pre = this._preAntiMeridianCoord;
        } else {
            pre = projection?projection.unproject(preCoord):preCoord;
        }
        var current = projection?projection.unproject(p):p;
        var d = current.x - pre.x;
        if (isAntiMeridian === 'continuous') {
            if (Math.abs(d) > 180) {
                if (d > 0) {
                    current._substract(new Z.Coordinate(180*2,0))
                } else {
                    current._add(new Z.Coordinate(180*2,0))
                }
                p = projection?projection.unproject(current):current;
            }
        }
        this._preAntiMeridianCoord = current;
        return p;
    },

    _setPrjCoordinates:function(prjPoints) {
        this._prjPoints = prjPoints;
        this._onShapeChanged();
    },

    _getPrjCoordinates:function() {
        if (!this._prjPoints) {
            var points = this._points;
            this._prjPoints = this._projectPoints(points);
        }
        return this._prjPoints;
    },

    /**
     * 直接修改Geometry的投影坐标后调用该方法, 更新经纬度坐标缓存
     */
    _updateCache:function() {
        delete this._extent;
        var projection = this._getProjection();
        if (!projection) {
            return;
        }
        if (this._prjPoints) {
            this._points = this._unprojectPoints(this._getPrjCoordinates());
        }
        if (this._prjHoles) {
            this._holes = this._unprojectPoints(this._getPrjHoles());
        }
    },

    _clearProjection:function() {
        this._prjPoints = null;
        if (this._prjHoles) {
            this._prjHoles = null;
        }
    },

    _projectPoints:function(points) {
        var projection = this._getProjection();
        if (projection) {
            return projection.projectPoints(points);
        }
        return null;
    },

    _unprojectPoints:function(prjPoints) {
        var projection = this._getProjection();
        if (projection) {
            return projection.unprojectPoints(prjPoints);
        }
        return null;
    },

    _computeCenter:function() {
        var ring=this._points;
        if (!Z.Util.isArrayHasData(ring)) {
            return null;
        }
        var sumx=0,sumy=0;
        var counter = 0;
        var size = ring.length;
        for (var i=0;i<size;i++) {
            if (ring[i]) {
                if (Z.Util.isNumber(ring[i].x) && Z.Util.isNumber(ring[i].y)) {
                        sumx += ring[i].x;
                        sumy += ring[i].y;
                        counter++;
                }
            }
        }
        return new Z.Coordinate(sumx/counter, sumy/counter);
    },

    _computeExtent:function() {
        var ring = this._points;
        if (!Z.Util.isArrayHasData(ring)) {
            return null;
        }
        var rings = ring;
        if (this.hasHoles && this.hasHoles()) {
            rings = rings.concat(this.getHoles());
        }
        return this._computePointsExtent(rings);
    },

     /**
      * 计算坐标数组的extent, 数组内的元素可以坐标或者坐标数组,坐标为经纬度坐标,而不是投影坐标
      * @param  {Point[]} points  points数组
      * @returns {Extent} {@link maptalks.Extent}
      */
    _computePointsExtent: function(points) {
        var result=null;
        var ext,
            isAntiMeridian = this.options['antiMeridian'];
        for ( var i = 0, len = points.length; i < len; i++) {
            var p;
            if (Z.Util.isArray(points[i])) {
                for ( var j = 0, jlen = points[i].length; j < jlen; j++) {
                    p = points[i][j];
                    if (j > 0 && (isAntiMeridian && isAntiMeridian !== 'default')) {
                        p = this._antiMeridian(p, points[i][j-1], null, isAntiMeridian);
                    }
                    ext = new Z.Extent(p,p);
                    result = ext.combine(result);
                }
            } else {
                p = points[i];
                if (i > 0 && (isAntiMeridian && isAntiMeridian !== 'default')) {
                    p = this._antiMeridian(p, points[i-1], null, isAntiMeridian);
                }
                ext = new Z.Extent(p,p);
                result = ext.combine(result);
            }
        }
        return result;
    }
};
