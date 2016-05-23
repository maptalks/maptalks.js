 /**
 * @classdesc
 *     Geometry class for polygon type
 * @class
 * @category geometry
 * @extends maptalks.Vector
 * @mixins maptalks.Geometry.Poly
 * @param {Number[][]|Number[][][]|maptalks.Coordinate[]|maptalks.Coordinate[][]} coordinates - coordinates, shell coordinates or all the rings.
 * @param {Object} [options=null] - specific construct options for Polygon, also support options defined in [Vector]{@link maptalks.Vector#options} and [Geometry]{@link maptalks.Geometry#options}
 */
Z.Polygon = Z.Vector.extend(/** @lends maptalks.Polygon.prototype */{

    includes:[Z.Geometry.Poly],

    type:Z.Geometry['TYPE_POLYGON'],

    exceptionDefs:{
        'en-US':{
            'INVALID_COORDINATES':'invalid coordinates for polygon.'
        },
        'zh-CN':{
            'INVALID_COORDINATES':'对于多边形无效的坐标.'
        }
    },

    /**
     * @property {String} [options.antiMeridian=default] - antiMeridian
     */
    options:{
        'antiMeridian' : 'default'
    },

    initialize:function (coordinates, opts) {
        this.setCoordinates(coordinates);
        this._initOptions(opts);
    },

    /**
     * Set coordinates to the polygon
     * @param {Number[][]|Number[][][]|maptalks.Coordinate[]|maptalks.Coordinate[][]} coordinates - new coordinates
     * @return {maptalks.Polygon} this
     */
    setCoordinates:function (coordinates) {
        if (!coordinates) {
            this._coordinates = null;
            this._holes = null;
            this._projectRings();
            return this;
        }
        var rings = Z.GeoJSON.fromGeoJSONCoordinates(coordinates);
        var len = rings.length;
        if (!Z.Util.isArray(rings[0])) {
            this._coordinates = this._trimRing(rings);
        } else {
            this._coordinates = this._trimRing(rings[0]);
            if (len > 1) {
                var holes = [];
                for (var i = 1; i < len; i++) {
                    if (!rings[i]) {
                        continue;
                    }
                    holes.push(this._trimRing(rings[i]));
                }
                this._holes = holes;
            }
        }

        this._projectRings();
        return this;
    },

    /**
     * Gets polygons's coordinates
     * @returns {maptalks.Coordinate[][]}
     */
    getCoordinates:function () {
        if (!this._coordinates) {
            return [];
        }
        if (Z.Util.isArrayHasData(this._holes)) {
            var holes = [];
            for (var i = 0; i < this._holes.length; i++) {
                holes.push(this._closeRing(this._holes[i]));
            }
            return [this._closeRing(this._coordinates)].concat(holes);
        }
        return [this._closeRing(this._coordinates)];
    },

    /**
     * Gets shell coordinates of the polygon
     * @returns {maptalks.Coordinate[]}
     */
    getShell:function () {
        return this._coordinates;
    },


    /**
     * Gets holes' coordinates of the polygon if it has.
     * @returns {maptalks.Coordinate[][]}
     */
    getHoles:function () {
        if (this.hasHoles()) {
            return this._holes;
        }
        return null;
    },

    /**
     * Whether the polygon has any holes inside.
     * @returns {Boolean}
     */
    hasHoles:function () {
        if (Z.Util.isArrayHasData(this._holes)) {
            if (Z.Util.isArrayHasData(this._holes[0])) {
                return true;
            }
        }
        return false;
    },

    _projectRings:function () {
        if (!this.getMap()) {
            this._onShapeChanged();
            return;
        }
        this._prjCoords = this._projectCoords(this._coordinates);
        this._prjHoles = this._projectCoords(this._holes);
        this._onShapeChanged();
    },

    _cleanRing:function (ring) {
        for (var i = ring.length - 1; i >= 0; i--) {
            if (!ring[i]) {
                ring.splice(i, 1);
            }
        }
    },

    /**
     * 检查ring是否合法, 并返回ring是否闭合
     * @param  {*} ring [description]
     * @private
     */
    _checkRing:function (ring) {
        this._cleanRing(ring);
        if (!ring || !Z.Util.isArrayHasData(ring)) {
            return false;
        }
        var lastPoint = ring[ring.length - 1];
        var isClose = true;
        // var least = 4;
        if (ring[0].x !== lastPoint.x || ring[0].y !== lastPoint.y) {
            // least = 3;
            isClose = false;
        }
        // if (ring.length < least) {
            //throw new Error(this.exceptions['INVALID_COORDINATES']+', ring length is only '+ring.length);
        // }
        return isClose;
    },

    /**
     * 如果最后一个端点与第一个端点相同, 则去掉最后一个端点
     * @private
     */
    _trimRing:function (ring) {
        var isClose = this._checkRing(ring);
        if (Z.Util.isArrayHasData(ring) && isClose) {
            return ring.slice(0, ring.length - 1);
        } else {
            return ring;
        }
    },

    /**
     * 如果最后一个端点与第一个端点不同, 则在最后增加与第一个端点相同的点
     * @private
     */
    _closeRing:function (ring) {
        var isClose = this._checkRing(ring);
        if (Z.Util.isArrayHasData(ring) && !isClose) {
            return ring.concat([new Z.Coordinate(ring[0].x, ring[0].y)]);
        } else {
            return ring;
        }
    },


    _getPrjHoles:function () {
        if (!this._prjHoles) {
            this._prjHoles = this._projectCoords(this._holes);
        }
        return this._prjHoles;
    },

    _computeGeodesicLength:function (measurer) {
        var rings = this.getCoordinates();
        if (!Z.Util.isArrayHasData(rings)) {
            return 0;
        }
        var result = 0;
        for (var i = 0, len = rings.length; i < len; i++) {
            result += Z.GeoUtils.computeLength(rings[i], measurer);
        }
        return result;
    },

    _computeGeodesicArea:function (measurer) {
        var rings = this.getCoordinates();
        if (!Z.Util.isArrayHasData(rings)) {
            return 0;
        }
        var result = measurer.measureArea(rings[0]);
        //holes
        for (var i = 1, len = rings.length; i < len; i++) {
            result -= measurer.measureArea(rings[i]);

        }
        return result;
    },

    _containsPoint: function (point, tolerance) {
        var t = Z.Util.isNil(tolerance) ? this._hitTestTolerance() : tolerance,
            pxExtent = this._getPainter().getPixelExtent().expand(t);

        point = new Z.Point(point.x, point.y);

        if (!pxExtent.contains(point)) { return false; }

        // screen points
        var points = this._prjToViewPoint(this._getPrjCoordinates());

        var c = Z.GeoUtils.pointInsidePolygon(point, points);
        if (c) {
            return c;
        }

        var i, j, p1, p2,
            len = points.length;

        for (i = 0, j = len - 1; i < len; j = i++) {
            p1 = points[i];
            p2 = points[j];

            if (Z.GeoUtils.distanceToSegment(point, p1, p2) <= t) {
                return true;
            }
        }

        return false;
    }
});
