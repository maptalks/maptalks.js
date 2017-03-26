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
    'arrowPlacement': 'vertex-last' //vertex-first, vertex-last, vertex-firstlast, point
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
   * @return {LineString}         this
   */
    animateShow() {

        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var cb = arguments[1];

        if (isFunction(options)) {
            options = {};
            cb = options;
        }
        this.totalCoordinates = this.getCoordinates();
        var duration = options['duration'] || 1000;
        this.unitTime = options['unitTime'] || 1;
        this.duration = duration / this.unitTime;
        this.totalLength = this.getLength();
        this.aniCallback = cb;
        var easing = options['easing'] || 'out';
        this.setCoordinates([]);
        this.played = 0;
        var player = Animation.animate({
            't': [0, 1]
        }, {
            'duration': this.duration,
            'easing': easing
        }, frame=>{
            this._step(frame);
        });
        this.player = player;
        return this;
    }
    _step(frame) {
        this.played = this.duration * frame.styles.t;
        var length = this.totalLength;
        var coordinates = this.totalCoordinates;
        if (!this.getMap()) {
            this.player.finish();
            this.setCoordinates(coordinates);
            if (this.aniCallback) {
                this.aniCallback(frame, coordinates[coordinates.length - 1], length - 1);
            }
            return;
        }
        var animCoords = this._drawAnimFrame(frame.styles.t, this.duration, length, coordinates);
        var currentCoordinate = (animCoords) ? animCoords[animCoords.length - 1] : coordinates[0];
        if (this.aniCallback) {
            this.aniCallback(frame, currentCoordinate, this._animIdx);
        }
    }

    setSpeed(t) {
        this.unitTime = this.unitTime * t;
        this._resetPlayer();
    }

    _resetPlayer() {
        var playing = this.player && this.player.playState === 'running';
        if (playing) {
            this.player.finish();
        }
        this._createPlayer();
        if (playing) {
            this.player.play();
        }
    }

    _createPlayer() {
        var duration = (this.duration - this.played) / this.unitTime;
        this.player = maptalks.animation.Animation.animate({ 't': [this.played / this.duration, 1] },
            { 'speed': duration, 'easing': 'linear' },
           function (frame) {
               this._step(frame);
           }.bind(this));
    }

    cancel() {
        if (this.player) {
            this.player.cancel();
            this.played = 0;
            if (this._animIdx > 0)
                this._animIdx = 0;
            if (this._animLenSoFar > 0)
                this._animLenSoFar = 0;
            this._createPlayer();
            this._step({ 'styles': { 't': 0 }});
            this.fire('playcancel');
            return this;
        }
        return null;
    }

    play() {
        if (!this.player) {
            this.player.play();
            this.fire('playstart');
            return this;
        } else {
            console.log('You should call animateShow method to play it!');
            return this;
        }
    }

    pause() {
        this.player.pause();
        this.fire('playpause');
        return this;
    }

    finish() {
        this.player.finish();
        this._step({ 'styles': { 't': 1 }});
        this.fire('playfinish');
        return this;
    }

    _drawAnimFrame(t, duration, length, coordinates) {
        if (t === 0) {
            this.setCoordinates([]);
            return null;
        }
        var map = this.getMap();
        var targetLength = t * length;
        if (!this._animIdx) {
            this._animIdx = 0;
            this._animLenSoFar = 0;
            this.show();
        }
        var i, l;
        var segLen = 0;
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
            this.unitTime = 1;
            this.fire('playfinish');
            return coordinates;
        }
        this.fire('playing');
        var idx = this._animIdx;
        var p1 = coordinates[idx],
            p2 = coordinates[idx + 1],
            span = targetLength - this._animLenSoFar,
            r = span / segLen;
        var x = p1.x + (p2.x - p1.x) * r,
            y = p1.y + (p2.y - p1.y) * r,
            targetCoord = new Coordinate(x, y);
        var animCoords = coordinates.slice(0, this._animIdx + 1);
        animCoords.push(targetCoord);

        this.setCoordinates(animCoords);

        return animCoords;
    }

    _computeGeodesicLength(measurer) {
        return measurer.measureLength(this.getCoordinates());
    }

    _computeGeodesicArea() {
        return 0;
    }

    _containsPoint(point, tolerance) {
        var t = isNil(tolerance) ? this._hitTestTolerance() : tolerance;

        function isContains(points) {
            var i, p1, p2,
                len = points.length;

            for (i = 0, len = points.length; i < len - 1; i++) {
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

        var arrowStyle = this._getArrowStyle();
        var lineWidth = this._getInternalSymbol()['lineWidth'];

        var map = this.getMap(),
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
        var points;
        if (this._getArrowStyle()) {
            points = this._getPath2DPoints(this._getPrjCoordinates(), true);
            var arrows = this._getArrows(points, lineWidth, (tolerance ? tolerance : 2) + lineWidth / 2);
            for (var ii = arrows.length - 1; ii >= 0; ii--) {
                if (pointInsidePolygon(point, arrows[ii])) {
                    return true;
                }
            }
        }

        points = points || this._getPath2DPoints(this._getPrjCoordinates());
        var isSplitted = points.length > 0 && Array.isArray(points[0]);
        if (isSplitted) {
            for (var i = 0, l = points.length; i < l; i++) {
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
