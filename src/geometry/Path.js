import { isNil, isNumber, isArrayHasData, isFunction, forEachCoord } from '../core/util';
import { Animation } from '../core/Animation';
import Coordinate from '../geo/Coordinate';
import Extent from '../geo/Extent';
import Geometry from './Geometry';
import Polygon from './Polygon';
import simplify from 'simplify-js';

/**
 * @property {Object} options - configuration options
 * @property {String} [options.smoothness=0]      - line smoothing by quad bezier interporating, 0 by default
 * @property {Boolean} [options.enableSimplify=true] - whether to simplify path before rendering
 * @property {Number}  [options.simplifyTolerance=2] - tolerance to simplify path, the higher the simplify is more intense
 * @property {Boolean} [options.enableClip=true] - whether to clip path with map's current extent
 * @property {Object} options.symbol - Path's default symbol
 * @memberOf Path
 * @instance
 */
const options = {
    'smoothness' : 0,
    'enableClip' : true,
    'enableSimplify' : true,
    'simplifyTolerance' : 2,
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
 * @abstract
 * @category geometry
 * @extends Geometry
 */
class Path extends Geometry {

    getOutline() {
        const painter = this._getPainter();
        if (!painter) {
            return null;
        }
        const map = this.getMap();
        const extent = painter.getContainerExtent().convertTo(c => map.containerPointToCoord(c));
        return new Polygon(extent.toArray(), {
            symbol : {
                'lineWidth': 1,
                'lineColor': '6b707b'
            }
        });
    }

    /**
     * Show the linestring with animation
     * @param  {Object} [options=null] animation options
     * @param  {Number} [options.duration=1000] duration
     * @param  {String} [options.easing=out] animation easing
     * @param  {Function} [cb=null] callback function in animation, function parameters: frame, currentCoord
     * @example
     *  line.animateShow({
     *    duration : 2000,
     *    easing : 'linear'
     *  }, function (frame, currentCoord) {
     *    //frame is the animation frame
     *    //currentCoord is current coordinate of animation
     *  });
     * @return {LineString}         this
     */
    animateShow(options = {}, cb) {
        if (this._showPlayer) {
            this._showPlayer.finish();
        }
        if (isFunction(options)) {
            options = {};
            cb = options;
        }
        const coordinates = this.getCoordinates();
        if (coordinates.length === 0) {
            return this;
        }
        this._animIdx = 0;
        this._animLenSoFar = 0;
        this.show();
        const isPolygon = !!this.getShell;
        const animCoords = isPolygon ? this.getShell().concat(this.getShell()[0]) : this.getCoordinates();
        const projection = this._getProjection();
        this._aniShowCenter = projection.unproject(this._getPrjExtent().getCenter());
        const duration = options['duration'] || 1000,
            length = this.getLength(),
            easing = options['easing'] || 'out';
        this.setCoordinates([]);
        const player = this._showPlayer = Animation.animate({
            't': duration
        }, {
            'duration': duration,
            'easing': easing
        }, frame => {
            if (!this.getMap()) {
                if (player.playState !== 'finished') {
                    player.finish();
                    if (cb) {
                        const coordinates = this.getCoordinates();
                        cb(frame, coordinates[coordinates.length - 1]);
                    }
                }
                return;
            }
            const currentCoord = this._drawAnimShowFrame(frame.styles.t, duration, length, animCoords);
            if (frame.state.playState === 'finished') {
                delete this._showPlayer;
                delete this._aniShowCenter;
                delete this._animIdx;
                delete this._animLenSoFar;
                delete this._animTailRatio;
                this.setCoordinates(coordinates);
            }
            if (cb) {
                cb(frame, currentCoord);
            }
        });
        player.play();
        return player;
    }

    _drawAnimShowFrame(t, duration, length, coordinates) {
        if (t === 0) {
            return coordinates[0];
        }
        const map = this.getMap();
        const targetLength = t / duration * length;
        let segLen = 0;
        let i, l;
        for (i = this._animIdx, l = coordinates.length; i < l - 1; i++) {
            segLen = map.computeLength(coordinates[i], coordinates[i + 1]);
            if (this._animLenSoFar + segLen > targetLength) {
                break;
            }
            this._animLenSoFar += segLen;
        }
        this._animIdx = i;
        if (this._animIdx >= l - 1) {
            this.setCoordinates(coordinates);
            return coordinates[coordinates.length - 1];
        }
        const idx = this._animIdx;
        const p1 = coordinates[idx],
            p2 = coordinates[idx + 1],
            span = targetLength - this._animLenSoFar,
            r = span / segLen;
        this._animTailRatio = r;
        const x = p1.x + (p2.x - p1.x) * r,
            y = p1.y + (p2.y - p1.y) * r,
            targetCoord = new Coordinate(x, y);
        const isPolygon = !!this.getShell;
        if (!isPolygon && this.options['smoothness'] > 0) {
            //smooth line needs to set current coordinates plus 2 more to caculate correct control points
            const animCoords = coordinates.slice(0, this._animIdx + 3);
            this.setCoordinates(animCoords);
        } else {
            const animCoords = coordinates.slice(0, this._animIdx + 1);
            animCoords.push(targetCoord);
            if (isPolygon) {
                this.setCoordinates([this._aniShowCenter].concat(animCoords));
            } else {
                this.setCoordinates(animCoords);
            }
        }
        return targetCoord;
    }

    _getCenterInExtent(extent, coordinates, clipFn) {
        const meExtent = this.getExtent();
        if (!extent.intersects(meExtent)) {
            return null;
        }
        const clipped = clipFn(coordinates, extent);
        if (clipped.length === 0) {
            return null;
        }
        let [sumx, sumy, counter] = [0, 0, 0];
        clipped.forEach(part => {
            if (Array.isArray(part)) {
                part.forEach(c => {
                    if (c.point) {
                        c = c.point;
                    }
                    sumx += c.x;
                    sumy += c.y;
                    counter++;
                });
            } else {
                if (part.point) {
                    part = part.point;
                }
                sumx += part.x;
                sumy += part.y;
                counter++;
            }
        });
        const c = new Coordinate(sumx, sumy)._multi(1 / counter);
        c.count = counter;
        return c;
    }

    /**
     * Transform projected coordinates to view points
     * @param  {Coordinate[]} prjCoords           - projected coordinates
     * @param  {Boolean} disableSimplify          - whether to disable simplify\
     * @param  {Number} zoom                      - 2d points' zoom level
     * @returns {Point[]}
     * @private
     */
    _getPath2DPoints(prjCoords, disableSimplify, zoom) {
        if (!isArrayHasData(prjCoords)) {
            return [];
        }
        const map = this.getMap(),
            isSimplify = !disableSimplify && this._shouldSimplify(),
            tolerance = this.options['simplifyTolerance'] * map._getResolution(),
            isMulti = Array.isArray(prjCoords[0]);
        delete this._simplified;
        if (isSimplify && !isMulti) {
            const count = prjCoords.length;
            prjCoords = simplify(prjCoords, tolerance, false);
            this._simplified = prjCoords.length < count;
        }
        if (isNil(zoom)) {
            zoom = map.getZoom();
        }
        return forEachCoord(prjCoords, c => map._prjToPoint(c, zoom));
    }

    _shouldSimplify() {
        const layer = this.getLayer(),
            properties = this.getProperties();
        const hasAltitude = properties && layer.options['enableAltitude'] && !isNil(properties[layer.options['altitudeProperty']]);
        return layer && layer.options['enableSimplify'] && !hasAltitude && this.options['enableSimplify'] && !this._showPlayer/* && !this.options['smoothness'] */;
    }

    _setPrjCoordinates(prjPoints) {
        this._prjCoords = prjPoints;
        this.onShapeChanged();
    }

    _getPrjCoordinates() {
        const projection = this._getProjection();
        if (!projection) {
            return null;
        }
        this._verifyProjection();
        if (!this._prjCoords) {
            this._prjCoords = this._projectCoords(this._coordinates);
        }
        return this._prjCoords;
    }

    //update cached variables if geometry is updated.
    _updateCache() {
        this._clearCache();
        const projection = this._getProjection();
        if (!projection) {
            return;
        }
        if (this._prjCoords) {
            this._coordinates = this._unprojectCoords(this._getPrjCoordinates());
        }
    }

    _clearProjection() {
        this._prjCoords = null;
        super._clearProjection();
    }

    _projectCoords(points) {
        const projection = this._getProjection();
        if (projection) {
            return projection.projectCoords(points);
        }
        return [];
    }

    _unprojectCoords(prjPoints) {
        const projection = this._getProjection();
        if (projection) {
            return projection.unprojectCoords(prjPoints);
        }
        return [];
    }

    _computeCenter() {
        const ring = this._coordinates;
        if (!isArrayHasData(ring)) {
            return null;
        }
        let sumx = 0,
            sumy = 0,
            counter = 0;
        const size = ring.length;
        for (let i = 0; i < size; i++) {
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
        const shell = this._coordinates;
        if (!isArrayHasData(shell)) {
            return null;
        }
        const rings = [shell];
        if (this.hasHoles && this.hasHoles()) {
            rings.push.apply(rings, this.getHoles());
        }
        return this._coords2Extent(rings, this._getProjection());
    }

    _computePrjExtent() {
        const coords = [this._getPrjCoordinates()];
        if (this.hasHoles && this.hasHoles()) {
            coords.push.apply(coords, this._getPrjHoles());
        }
        return this._coords2Extent(coords);
    }

    _get2DLength() {
        const vertexes = this._getPath2DPoints(this._getPrjCoordinates(), true);
        let len = 0;
        for (let i = 1, l = vertexes.length; i < l; i++) {
            len += vertexes[i].distanceTo(vertexes[i - 1]);
        }
        return len;
    }

    _hitTestTolerance() {
        const symbol = this._getInternalSymbol();
        let w;
        if (Array.isArray(symbol)) {
            w = 0;
            for (let i = 0; i < symbol.length; i++) {
                if (isNumber(symbol[i]['lineWidth'])) {
                    if (symbol[i]['lineWidth'] > w) {
                        w = symbol[i]['lineWidth'];
                    }
                }
            }
        } else {
            w = symbol['lineWidth'];
        }
        return isNumber(w) ? w / 2 : 1.5;
    }

    _coords2Extent(coords, proj) {
        const result = new Extent(proj);
        for (let i = 0, l = coords.length; i < l; i++) {
            for (let j = 0, ll = coords[i].length; j < ll; j++) {
                result._combine(coords[i][j]);
            }
        }
        return result;
    }
}

Path.mergeOptions(options);

export default Path;
