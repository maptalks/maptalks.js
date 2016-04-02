/**
 * Common methods for geometry classes based on coordinates arrays, e.g. LineString, Polygon
 * @mixin maptalks.Geometry.Poly
 */
Z.Geometry.Poly={
    /**
     * Transform projected coordinates to view points
     * @param  {maptalks.Coordinate[]} prjCoords  - projected coordinates
     * @returns {maptalks.Point[]}
     * @private
     */
    _prjToViewPoint:function(prjCoords) {
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
        var p, p_r, pp;
        for (var i=0,len=prjCoords.length;i<len;i++) {
            p = prjCoords[i];
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
                p_r = [];
                for (var j=0,jlen=p.length;j<jlen;j++) {
                    pp = p[j];
                    if (Z.Util.isNil(p[j])) {
                        continue;
                    }
                    if (j > 0 && (isAntiMeridian && isAntiMeridian !== 'default')) {
                        pp = this._antiMeridian(pp, p[j-1], projection, isAntiMeridian);
                    }
                    p_r.push(map._prjToViewPoint(pp));
                }
                delete this._preAntiMeridianCoord;
                result.push(p_r);
            } else {
                if (i > 0 && (isAntiMeridian && isAntiMeridian !== 'default')) {
                    p = this._antiMeridian(p, prjCoords[i-1], projection, isAntiMeridian);
                }
                pp = map._prjToViewPoint(p);
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
                    current._substract(180*2, 0)
                } else {
                    current._add(180*2, 0)
                }
                p = projection?projection.unproject(current):current;
            }
        }
        this._preAntiMeridianCoord = current;
        return p;
    },

    _setPrjCoordinates:function(prjPoints) {
        this._prjCoords = prjPoints;
        this._onShapeChanged();
    },

    _getPrjCoordinates:function() {
        if (!this._prjCoords) {
            var points = this._coordinates;
            this._prjCoords = this._projectCoords(points);
        }
        return this._prjCoords;
    },

    //update cached variables if geometry is updated.
    _updateCache:function() {
        delete this._extent;
        var projection = this._getProjection();
        if (!projection) {
            return;
        }
        if (this._prjCoords) {
            this._coordinates = this._unprojectCoords(this._getPrjCoordinates());
        }
        if (this._prjHoles) {
            this._holes = this._unprojectCoords(this._getPrjHoles());
        }
    },

    _clearProjection:function() {
        this._prjCoords = null;
        if (this._prjHoles) {
            this._prjHoles = null;
        }
    },

    _projectCoords:function(points) {
        var projection = this._getProjection();
        if (projection) {
            return projection.projectCoords(points);
        }
        return null;
    },

    _unprojectCoords:function(prjPoints) {
        var projection = this._getProjection();
        if (projection) {
            return projection.unprojectCoords(prjPoints);
        }
        return null;
    },

    _computeCenter:function() {
        var ring=this._coordinates;
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
        var ring = this._coordinates;
        if (!Z.Util.isArrayHasData(ring)) {
            return null;
        }
        var rings = ring;
        if (this.hasHoles && this.hasHoles()) {
            rings = rings.concat(this.getHoles());
        }
        return this._computeCoordsExtent(rings);
    },

     /**
      * Compute extent of a group of coordinates
      * @param  {maptalks.Coordinate[]} coords  - coordinates
      * @returns {maptalks.Extent}
      * @private
      */
    _computeCoordsExtent: function(coords) {
        var result=null;
        var ext,
            isAntiMeridian = this.options['antiMeridian'];
        for ( var i = 0, len = coords.length; i < len; i++) {
            var p;
            if (Z.Util.isArray(coords[i])) {
                for ( var j = 0, jlen = coords[i].length; j < jlen; j++) {
                    p = coords[i][j];
                    if (j > 0 && (isAntiMeridian && isAntiMeridian !== 'default')) {
                        p = this._antiMeridian(p, coords[i][j-1], null, isAntiMeridian);
                    }
                    ext = new Z.Extent(p,p);
                    result = ext.combine(result);
                }
            } else {
                p = coords[i];
                if (i > 0 && (isAntiMeridian && isAntiMeridian !== 'default')) {
                    p = this._antiMeridian(p, coords[i-1], null, isAntiMeridian);
                }
                ext = new Z.Extent(p,p);
                result = ext.combine(result);
            }
        }
        return result;
    }
};
