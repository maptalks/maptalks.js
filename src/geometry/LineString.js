/**
 * @classdesc Represents a LineString type Geometry.
 * @class
 * @category geometry
 * @extends {maptalks.Vector}
 * @mixes   {maptalks.Geometry.Poly}
 * @param {maptalks.Coordinate[]|Number[][]} coordinates - coordinates of the line string
 * @param {Object} [options=null] - specific construct options for LineString, also support options defined in [Vector]{@link maptalks.Vector#options} and [Geometry]{@link maptalks.Geometry#options}
 * @param {Number} [options.antiMeridian=default]            - antimeridian
 * @param {Number} [options.arrowStyle=null]                 - style of arrow, if not null, arrows will be drawn, possible values: classic
 * @param {Number} [options.arrowPlacement=vertex-last]      - arrow's placement: vertex-first, vertex-last, vertex-firstlast, point
 */
Z.LineString = Z.Polyline = Z.Vector.extend(/** @lends maptalks.LineString.prototype */{
    includes:[Z.Geometry.Poly],

    type:Z.Geometry['TYPE_LINESTRING'],

    /**
    * @property {Object} [options=null] - specific construct options for LineString, also support options defined in [Vector]{@link maptalks.Vector#options} and [Geometry]{@link maptalks.Geometry#options}
    * @property {Number} [options.antiMeridian=default]            - antimeridian
    * @property {Number} [options.arrowStyle=null]                 - style of arrow, if not null, arrows will be drawn, possible values: classic
    * @property {Number} [options.arrowPlacement=vertex-last]      - arrow's placement: vertex-first, vertex-last, vertex-firstlast, point
    */
    options:{
        'antiMeridian' : 'default',
        'arrowStyle' : null,
        'arrowPlacement' : 'vertex-last' //vertex-first, vertex-last, vertex-firstlast, point
    },

    initialize:function (coordinates, opts) {
        this.setCoordinates(coordinates);
        this._initOptions(opts);
    },

    /**
     * Set new coordinates to the line string
     * @param {maptalks.Coordinate[]|Number[][]} coordinates - new coordinates
     * @fires maptalks.Geometry#shapechange
     * @return {maptalks.LineString} this
     */
    setCoordinates:function (coordinates) {
        if (!coordinates) {
            this._coordinates = null;
            this._setPrjCoordinates(null);
            return this;
        }
        this._coordinates = Z.GeoJSON.toCoordinates(coordinates);
        if (this.getMap()) {
            this._setPrjCoordinates(this._projectCoords(this._coordinates));
        } else {
            this._onShapeChanged();
        }
        return this;
    },

    /**
     * Get coordinates of the line string
     * @return {maptalks.Coordinate[]|Number[][]} coordinates
     */
    getCoordinates:function () {
        if (!this._coordinates) {
            return [];
        }
        return this._coordinates;
    },

    _computeGeodesicLength:function (measurer) {
        return Z.GeoUtils.computeLength(this.getCoordinates(), measurer);
    },

    _computeGeodesicArea:function () {
        return 0;
    },

    _containsPoint: function (point, tolerance) {
        var map = this.getMap(),
            t = Z.Util.isNil(tolerance) ? this._hitTestTolerance() : tolerance,
            extent = this._getPrjExtent(),
            nw = new Z.Coordinate(extent.xmin, extent.ymax),
            se = new Z.Coordinate(extent.xmax, extent.ymin),
            pxMin = map._prjToViewPoint(nw),
            pxMax = map._prjToViewPoint(se),
            pxExtent = new Z.PointExtent(pxMin.x - t, pxMin.y - t,
                                    pxMax.x + t, pxMax.y + t);
        if (t < 2) {
            t = 2;
        }
        point = new Z.Point(point.x, point.y);

        if (!pxExtent.contains(point)) { return false; }

        // screen points
        var points = this._prjToViewPoint(this._getPrjCoordinates());

        var i, p1, p2,
            len = points.length;

        for (i = 0, len = points.length; i < len - 1; i++) {
            p1 = points[i];
            p2 = points[i + 1];

            if (Z.GeoUtils.distanceToSegment(point, p1, p2) <= t) {
                return true;
            }
        }

        return false;
    }

});
