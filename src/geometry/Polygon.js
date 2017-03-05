import { isNil, isArrayHasData } from 'core/util';
import Coordinate from 'geo/Coordinate';
import { pointInsidePolygon, distanceToSegment } from 'core/util/path';
import Path from './Path';


/**
 * @classdesc
 * Geometry class for polygon type
 * @category geometry
 * @extends Path
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
class Polygon extends Path {

    /**
     * @param {Number[][]|Number[][][]|Coordinate[]|Coordinate[][]} coordinates - coordinates, shell coordinates or all the rings.
     * @param {Object} [options=null] - construct options defined in [Polygon]{@link Polygon#options}
     */
    constructor(coordinates, opts) {
        super(opts);
        this.type = 'Polygon';
        if (coordinates) {
            this.setCoordinates(coordinates);
        }
    }

    /**
     * Set coordinates to the polygon
     *
     * @param {Number[][]|Number[][][]|Coordinate[]|Coordinate[][]} coordinates - new coordinates
     * @return {Polygon} this
     * @fires Polygon#shapechange
     */
    setCoordinates(coordinates) {
        if (!coordinates) {
            this._coordinates = null;
            this._holes = null;
            this._projectRings();
            return this;
        }
        var rings = Coordinate.toCoordinates(coordinates);
        var len = rings.length;
        if (!Array.isArray(rings[0])) {
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
    }

    /**
     * Gets polygons's coordinates
     *
     * @returns {Coordinate[][]}
     */
    getCoordinates() {
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
    }

    /**
     * Gets shell's coordinates of the polygon
     *
     * @returns {Coordinate[]}
     */
    getShell() {
        return this._coordinates || [];
    }


    /**
     * Gets holes' coordinates of the polygon if it has.
     * @returns {Coordinate[][]}
     */
    getHoles() {
        return this._holes || [];
    }

    /**
     * Whether the polygon has any holes inside.
     *
     * @returns {Boolean}
     */
    hasHoles() {
        return this.getHoles().length > 0;
    }

    _projectRings() {
        if (!this.getMap()) {
            this.onShapeChanged();
            return;
        }
        this._prjCoords = this._projectCoords(this._coordinates);
        this._prjHoles = this._projectCoords(this._holes);
        this.onShapeChanged();
    }

    _cleanRing(ring) {
        for (var i = ring.length - 1; i >= 0; i--) {
            if (!ring[i]) {
                ring.splice(i, 1);
            }
        }
    }

    /**
     * Check if ring is valid
     * @param  {*} ring ring to check
     * @return {Boolean} is ring a closed one
     * @private
     */
    _checkRing(ring) {
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
    }

    /**
     * If the first coordinate is equal with the last one, then remove the last coordinates.
     * @private
     */
    _trimRing(ring) {
        var isClose = this._checkRing(ring);
        if (isArrayHasData(ring) && isClose) {
            return ring.slice(0, ring.length - 1);
        } else {
            return ring;
        }
    }

    /**
     * If the first coordinate is different with the last one, then copy the first coordinates and add to the ring.
     * @private
     */
    _closeRing(ring) {
        var isClose = this._checkRing(ring);
        if (isArrayHasData(ring) && !isClose) {
            return ring.concat([new Coordinate(ring[0].x, ring[0].y)]);
        } else {
            return ring;
        }
    }


    _getPrjHoles() {
        if (!this._prjHoles) {
            this._prjHoles = this._projectCoords(this._holes);
        }
        return this._prjHoles;
    }

    _computeGeodesicLength(measurer) {
        var rings = this.getCoordinates();
        if (!isArrayHasData(rings)) {
            return 0;
        }
        var result = 0;
        for (var i = 0, len = rings.length; i < len; i++) {
            result += measurer.measureLength(rings[i]);
        }
        return result;
    }

    _computeGeodesicArea(measurer) {
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
    }

    _containsPoint(point, tolerance) {
        const t = isNil(tolerance) ? this._hitTestTolerance() : tolerance,
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

        const projection = this.getMap().getProjection();
        const shell = this.getShell().map(c => projection.project(c));

        const points = this._getPath2DPoints(shell),
            isSplitted = Array.isArray(points[0]);
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
}

Polygon.registerJSONType('Polygon');

export default Polygon;
