import { isNil, isArray, isArrayHasData } from 'core/util';
import Coordinate from 'geo/Coordinate';
import { pointInsidePolygon, distanceToSegment, _computeLength } from 'geo/utils';
import { Geometry } from './Geometry';
import { GeoJSON } from './GeoJSON';
import { Vector } from './Vector';

/**
 * @classdesc
 *     Geometry class for polygon type
 * @class
 * @category geometry
 * @extends Vector
 * @mixins Geometry.Poly
 * @param {Number[][]|Number[][][]|Coordinate[]|Coordinate[][]} coordinates - coordinates, shell coordinates or all the rings.
 * @param {Object} [options=null] - construct options defined in [Polygon]{@link Polygon#options}
 * @example
 * var polygon = new Polygon(
 *      [
 *          [
 *              [121.48053653961283, 31.24244899384889],
 *              [121.48049362426856, 31.238559229494186],
 *              [121.49032123809872, 31.236210614999653],
 *              [121.49366863494917, 31.242926029397037],
 *              [121.48577221160967, 31.243880093267567],
 *              [121.48053653961283, 31.24244899384889]
 *          ]
 *      ]
 *  ).addTo(layer);
 */
export const Polygon = Vector.extend(/** @lends Polygon.prototype */ {

    includes: [Geometry.Poly],

    type: Geometry['TYPE_POLYGON'],

    /**
     * @property {String} [options.antiMeridian=continuous] - continue | split, how to deal with the anti-meridian problem, split or continue the polygon when it cross the 180 or -180 longtitude line.
     */
    options: {
        'antiMeridian': 'continuous'
    },

    initialize: function (coordinates, opts) {
        this.setCoordinates(coordinates);
        this._initOptions(opts);
    },

    /**
     * Set coordinates to the polygon
     *
     * @param {Number[][]|Number[][][]|Coordinate[]|Coordinate[][]} coordinates - new coordinates
     * @return {Polygon} this
     * @fires Polygon#shapechange
     */
    setCoordinates: function (coordinates) {
        if (!coordinates) {
            this._coordinates = null;
            this._holes = null;
            this._projectRings();
            return this;
        }
        var rings = GeoJSON.toCoordinates(coordinates);
        var len = rings.length;
        if (!isArray(rings[0])) {
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
     *
     * @returns {Coordinate[][]}
     */
    getCoordinates: function () {
        if (!this._coordinates) {
            return [];
        }
        if (isArrayHasData(this._holes)) {
            var holes = [];
            for (var i = 0; i < this._holes.length; i++) {
                holes.push(this._closeRing(this._holes[i]));
            }
            return [this._closeRing(this._coordinates)].concat(holes);
        }
        return [this._closeRing(this._coordinates)];
    },

    /**
     * Gets shell's coordinates of the polygon
     *
     * @returns {Coordinate[]}
     */
    getShell: function () {
        return this._coordinates;
    },


    /**
     * Gets holes' coordinates of the polygon if it has.
     * @returns {Coordinate[][]}
     */
    getHoles: function () {
        if (this.hasHoles()) {
            return this._holes;
        }
        return null;
    },

    /**
     * Whether the polygon has any holes inside.
     *
     * @returns {Boolean}
     */
    hasHoles: function () {
        if (isArrayHasData(this._holes)) {
            if (isArrayHasData(this._holes[0])) {
                return true;
            }
        }
        return false;
    },

    _projectRings: function () {
        if (!this.getMap()) {
            this.onShapeChanged();
            return;
        }
        this._prjCoords = this._projectCoords(this._coordinates);
        this._prjHoles = this._projectCoords(this._holes);
        this.onShapeChanged();
    },

    _cleanRing: function (ring) {
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
    _checkRing: function (ring) {
        this._cleanRing(ring);
        if (!ring || !isArrayHasData(ring)) {
            return false;
        }
        var lastPoint = ring[ring.length - 1];
        var isClose = true;
        if (ring[0].x !== lastPoint.x || ring[0].y !== lastPoint.y) {
            isClose = false;
        }
        return isClose;
    },

    /**
     * 如果最后一个端点与第一个端点相同, 则去掉最后一个端点
     * @private
     */
    _trimRing: function (ring) {
        var isClose = this._checkRing(ring);
        if (isArrayHasData(ring) && isClose) {
            return ring.slice(0, ring.length - 1);
        } else {
            return ring;
        }
    },

    /**
     * 如果最后一个端点与第一个端点不同, 则在最后增加与第一个端点相同的点
     * @private
     */
    _closeRing: function (ring) {
        var isClose = this._checkRing(ring);
        if (isArrayHasData(ring) && !isClose) {
            return ring.concat([new Coordinate(ring[0].x, ring[0].y)]);
        } else {
            return ring;
        }
    },


    _getPrjHoles: function () {
        if (!this._prjHoles) {
            this._prjHoles = this._projectCoords(this._holes);
        }
        return this._prjHoles;
    },

    _computeGeodesicLength: function (measurer) {
        var rings = this.getCoordinates();
        if (!isArrayHasData(rings)) {
            return 0;
        }
        var result = 0;
        for (var i = 0, len = rings.length; i < len; i++) {
            result += _computeLength(rings[i], measurer);
        }
        return result;
    },

    _computeGeodesicArea: function (measurer) {
        var rings = this.getCoordinates();
        if (!isArrayHasData(rings)) {
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
        var t = isNil(tolerance) ? this._hitTestTolerance() : tolerance,
            pxExtent = this._getPainter().get2DExtent().expand(t);

        function isContains(points) {
            var c = pointInsidePolygon(point, points);
            if (c) {
                return c;
            }

            var i, j, p1, p2,
                len = points.length;

            for (i = 0, j = len - 1; i < len; j = i++) {
                p1 = points[i];
                p2 = points[j];

                if (distanceToSegment(point, p1, p2) <= t) {
                    return true;
                }
            }

            return false;
        }

        if (!pxExtent.contains(point)) {
            return false;
        }

        // screen points
        var points = this._getPath2DPoints(this._getPrjCoordinates()),
            isSplitted = isArray(points[0]);
        if (isSplitted) {
            for (var i = 0; i < points.length; i++) {
                if (isContains(points[i])) {
                    return true;
                }
            }
            return false;
        } else {
            return isContains(points);
        }

    }
});
