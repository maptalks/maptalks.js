import { isNil, isFunction } from 'core/util';
import { Animation } from 'core/Animation';
import Coordinate from 'geo/Coordinate';
import PointExtent from 'geo/PointExtent';
import { pointInsidePolygon, distanceToSegment } from 'core/util/path';
import Path from './Path';

/**
 * @property {Object} [options=null]
 * @property {String} [options.antiMeridian=continuous] - how to deal with the anti-meridian problem, split or continue the linestring when it cross the 180 or -180 longtitude line.
 * @property {String} [options.arrowStyle=null]                 - style of arrow, if not null, arrows will be drawn, possible values: classic
 * @property {String} [options.arrowPlacement=vertex-last]      - arrow's placement: vertex-first, vertex-last, vertex-firstlast, point
 * @memberOf LineString
 * @instance
 */
const options = {
    'arrowStyle': null,
    'arrowPlacement': 'vertex-last', //vertex-first, vertex-last, vertex-firstlast, point
    'clipToPaint' : true
};

/**
 * Represents a LineString type Geometry.
 * @category geometry
 * @extends Path
 * @example
 * var line = new LineString(
 *     [
 *         [121.45942, 31.24123],
 *         [121.46371, 31.24226],
 *         [121.46727, 31.23870],
 *         [121.47019, 31.24145]
 *     ]
 * ).addTo(layer);
 */
class LineString extends Path {

    /**
     * @param {Coordinate[]|Number[][]} coordinates - coordinates of the line string
     * @param {Object} [options=null] - construct options defined in [LineString]{@link LineString#options}
     */
    constructor(coordinates, options) {
        super(options);
        this.type = 'LineString';
        if (coordinates) {
            this.setCoordinates(coordinates);
        }
    }

    /**
     * Set new coordinates to the line string
     * @param {Coordinate[]|Number[][]} coordinates - new coordinates
     * @fires LineString#shapechange
     * @return {LineString} this
     */
    setCoordinates(coordinates) {
        if (!coordinates) {
            this._coordinates = null;
            this._setPrjCoordinates(null);
            return this;
        }
        this._coordinates = Coordinate.toCoordinates(coordinates);
        if (this.getMap()) {
            this._setPrjCoordinates(this._projectCoords(this._coordinates));
        } else {
            this.onShapeChanged();
        }
        return this;
    }

    /**
     * Get coordinates of the line string
     * @return {Coordinate[]|Number[][]} coordinates
     */
    getCoordinates() {
        return this._coordinates || [];
    }

    /**
     * Show the linestring with animation
     * @param  {Object} [options=null] animation options
     * @param  {Number} [options.duration=1000] duration
     * @param  {String} [options.easing=out] animation easing
     * @param  {Function} [cb=null] callback function in animation
     * @return {LineString}         this
     */
    animateShow(options = {}, cb) {
        if (isFunction(options)) {
            options = {};
            cb = options;
        }
        const coordinates = this.getCoordinates();
        const duration = options['duration'] || 1000;
        const length = this.getLength();
        const easing = options['easing'] || 'out';
        this.setCoordinates([]);
        const player = Animation.animate({
            't': duration
        }, {
            'duration': duration,
            'easing': easing
        }, frame => {
            if (!this.getMap()) {
                player.finish();
                this.setCoordinates(coordinates);
                if (cb) {
                    cb(frame);
                }
                return;
            }
            this._drawAnimFrame(frame.styles.t, duration, length, coordinates);
            if (cb) {
                cb(frame);
            }
        });
        player.play();
        return player;
    }

    _drawAnimFrame(t, duration, length, coordinates) {
        if (t === 0) {
            this.setCoordinates([]);
            return;
        }
        const map = this.getMap();
        const targetLength = t / duration * length;
        if (!this._animIdx) {
            this._animIdx = 0;
            this._animLenSoFar = 0;
            this.show();
        }
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
            return;
        }
        const idx = this._animIdx;
        const p1 = coordinates[idx],
            p2 = coordinates[idx + 1],
            span = targetLength - this._animLenSoFar,
            r = span / segLen;
        const x = p1.x + (p2.x - p1.x) * r,
            y = p1.y + (p2.y - p1.y) * r,
            targetCoord = new Coordinate(x, y);
        const animCoords = coordinates.slice(0, this._animIdx + 1);
        animCoords.push(targetCoord);

        this.setCoordinates(animCoords);
    }

    _computeGeodesicLength(measurer) {
        return measurer.measureLength(this.getCoordinates());
    }

    _computeGeodesicArea() {
        return 0;
    }

    _containsPoint(point, tolerance) {
        let t = isNil(tolerance) ? this._hitTestTolerance() : tolerance;

        function isContains(points) {
            let p1, p2;

            for (let i = 0, len = points.length; i < len - 1; i++) {
                p1 = points[i];
                p2 = points[i + 1];

                if (distanceToSegment(point, p1, p2) <= t) {
                    return true;
                }
            }
            return false;
        }

        if (t < 2) {
            t = 2;
        }

        const arrowStyle = this._getArrowStyle();
        const lineWidth = this._getInternalSymbol()['lineWidth'];

        const map = this.getMap(),
            extent = this._getPrjExtent(),
            nw = new Coordinate(extent.xmin, extent.ymax),
            se = new Coordinate(extent.xmax, extent.ymin),
            pxMin = map._prjToPoint(nw),
            pxMax = map._prjToPoint(se),
            pxExtent = new PointExtent(pxMin.x - t, pxMin.y - t,
                pxMax.x + t, pxMax.y + t);
        if (arrowStyle) {
            pxExtent._expand(Math.max(arrowStyle[0] * lineWidth, arrowStyle[1] * lineWidth));
        }
        if (!pxExtent.contains(point)) {
            return false;
        }

        // check arrow
        let points;
        if (this._getArrowStyle()) {
            points = this._getPath2DPoints(this._getPrjCoordinates(), true);
            const arrows = this._getArrows(points, lineWidth, (tolerance ? tolerance : 2) + lineWidth / 2);
            for (let ii = arrows.length - 1; ii >= 0; ii--) {
                if (pointInsidePolygon(point, arrows[ii])) {
                    return true;
                }
            }
        }

        points = points || this._getPath2DPoints(this._getPrjCoordinates());
        const isSplitted = points.length > 0 && Array.isArray(points[0]);
        if (isSplitted) {
            for (let i = 0, l = points.length; i < l; i++) {
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

LineString.mergeOptions(options);

LineString.registerJSONType('LineString');

export default LineString;
