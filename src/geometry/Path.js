import { isArray, isNil, isNumber, isArrayHasData } from 'core/util';
import Coordinate from 'geo/Coordinate';
import Extent from 'geo/Extent';
import Geometry from './Geometry';
import * as Measurer from 'geo/measurer';
import simplify from 'simplify-js';

/**
 * @property {Object} options - Vector's options
 * @property {String} [options.antiMeridian=continuous] - continue | split, how to deal with the anti-meridian problem, split or continue the polygon when it cross the 180 or -180 longtitude line.
 * @property {Object} options.symbol - Vector's default symbol
 */
const options = {
    'antiMeridian': 'continuous',
    'symbol': {
        'lineColor': '#000',
        'lineWidth': 2,
        'lineOpacity': 1,

        'polygonFill': '#fff', //default color in cartoCSS
        'polygonOpacity': 1,
        'opacity': 1
    }
};

/**
 * An abstract class Path containing common methods for Path geometry classes, e.g. LineString, Polygon
 *
 * @extends Geometry
 */
export default class Path extends Geometry {

    /**
     * Transform projected coordinates to view points
     * @param  {Coordinate[]} prjCoords           - projected coordinates
     * @param  {Boolean} disableSimplify          - whether to disable simplify\
     * @param  {Number} zoom                      - 2d points' zoom level
     * @returns {Point[]}
     * @private
     */
    _getPath2DPoints(prjCoords, disableSimplify, zoom) {
        var result = [];
        if (!isArrayHasData(prjCoords)) {
            return result;
        }
        var map = this.getMap(),
            fullExtent = map.getFullExtent(),
            projection = this._getProjection();
        var anti = this.options['antiMeridian'] && Measurer.isSphere(projection),
            isClip = map.options['clipFullExtent'],
            isSimplify = !disableSimplify && this.getLayer() && this.getLayer().options['enableSimplify'],
            tolerance = 2 * map._getResolution(),
            isMulti = isArray(prjCoords[0]);
        if (isSimplify && !isMulti) {
            prjCoords = simplify(prjCoords, tolerance, false);
        }
        if (isNil(zoom)) {
            zoom = map.getZoom();
        }
        var i, len, p, pre, current, dx, dy, my,
            part1 = [],
            part2 = [],
            part = part1;
        for (i = 0, len = prjCoords.length; i < len; i++) {
            p = prjCoords[i];
            if (isMulti) {
                part.push(this._getPath2DPoints(p, disableSimplify, zoom));
                continue;
            }
            if (isNil(p) || (isClip && !fullExtent.contains(p))) {
                continue;
            }
            if (i > 0 && (anti === 'continuous' || anti === 'split')) {
                current = projection.unproject(p);
                if (anti === 'split' || !pre) {
                    pre = projection.unproject(prjCoords[i - 1]);
                }
                if (pre && current) {
                    dx = current.x - pre.x;
                    dy = current.y - pre.y;
                    if (Math.abs(dx) > 180) {
                        if (anti === 'continuous') {
                            current = this._anti(current, dx);
                            pre = current;
                            p = projection.project(current);
                        } else if (anti === 'split') {
                            if (dx > 0) {
                                my = pre.y + dy * (pre.x - (-180)) / (360 - dx) * (pre.y > current.y ? -1 : 1);
                                part = part === part1 ? part2 : part1;
                                part.push(map.coordinateToPoint(new Coordinate(180, my), zoom));
                            } else {
                                my = pre.y + dy * (180 - pre.x) / (360 + dx) * (pre.y > current.y ? 1 : -1);
                                part.push(map.coordinateToPoint(new Coordinate(180, my), zoom));
                                part = part === part1 ? part2 : part1;
                                part.push(map.coordinateToPoint(new Coordinate(-180, my), zoom));
                            }
                        }
                    }
                }
            }
            part.push(map._prjToPoint(p, zoom));
        }
        if (part2.length > 0) {
            result = [part1, part2];
        } else {
            result = part;
        }
        return result;
    }

    _anti(c, dx) {
        if (dx > 0) {
            return c.substract(180 * 2, 0);
        } else {
            return c.add(180 * 2, 0);
        }
    }

    _setPrjCoordinates(prjPoints) {
        this._prjCoords = prjPoints;
        this.onShapeChanged();
    }

    _getPrjCoordinates() {
        if (!this._prjCoords) {
            var points = this._coordinates;
            this._prjCoords = this._projectCoords(points);
        }
        return this._prjCoords;
    }

    //update cached variables if geometry is updated.
    _updateCache() {
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
    }

    _clearProjection() {
        this._prjCoords = null;
        if (this._prjHoles) {
            this._prjHoles = null;
        }
    }

    _projectCoords(points) {
        var projection = this._getProjection();
        if (projection) {
            return projection.projectCoords(points);
        }
        return null;
    }

    _unprojectCoords(prjPoints) {
        var projection = this._getProjection();
        if (projection) {
            return projection.unprojectCoords(prjPoints);
        }
        return null;
    }

    _computeCenter() {
        var ring = this._coordinates;
        if (!isArrayHasData(ring)) {
            return null;
        }
        var sumx = 0,
            sumy = 0;
        var counter = 0;
        var size = ring.length;
        for (var i = 0; i < size; i++) {
            if (ring[i]) {
                if (isNumber(ring[i].x) && isNumber(ring[i].y)) {
                    sumx += ring[i].x;
                    sumy += ring[i].y;
                    counter++;
                }
            }
        }
        return new Coordinate(sumx / counter, sumy / counter);
    }

    _computeExtent() {
        var ring = this._coordinates;
        if (!isArrayHasData(ring)) {
            return null;
        }
        var rings = [ring];
        if (this.hasHoles && this.hasHoles()) {
            rings = rings.concat(this.getHoles());
        }
        return this._computeCoordsExtent(rings);
    }

    /**
     * Compute extent of a group of coordinates
     * @param  {Coordinate[]} coords  - coordinates
     * @returns {Extent}
     * @private
     */
    _computeCoordsExtent(coords) {
        var result = null,
            anti = this.options['antiMeridian'];
        var ext, p, dx, pre;
        for (var i = 0, len = coords.length; i < len; i++) {
            for (var j = 0, jlen = coords[i].length; j < jlen; j++) {
                p = coords[i][j];
                if (j > 0 && anti) {
                    if (!pre) {
                        pre = coords[i][j - 1];
                    }
                    dx = p.x - pre.x;
                    if (Math.abs(dx) > 180) {
                        p = this._anti(p, dx);
                        pre = p;
                    }
                }
                ext = new Extent(p, p);
                result = ext.combine(result);
            }

        }
        return result;
    }

    _get2DLength() {
        var vertexes = this._getPath2DPoints(this._getPrjCoordinates(), true);
        var len = 0;
        for (var i = 1, l = vertexes.length; i < l; i++) {
            len += vertexes[i].distanceTo(vertexes[i - 1]);
        }
        return len;
    }

    _hitTestTolerance() {
        var symbol = this._getInternalSymbol();
        var w;
        if (isArray(symbol)) {
            w = 0;
            for (var i = 0; i < symbol.length; i++) {
                if (isNumber(symbol[i]['lineWidth'])) {
                    if (symbol[i]['lineWidth'] > w) {
                        w = symbol[i]['lineWidth'];
                    }
                }
            }
        } else {
            w = symbol['lineWidth'];
        }
        return w ? w / 2 : 1.5;
    }
}

Path.mergeOptions(options);
