import Coordinate from 'geo/Coordinate';
import Point from 'geo/Point';
import Map from './Map';
import { isFunction } from 'core/util';

Map.include(/** @lends Map.prototype */ {

    /**
     * Pan to the given coordinate
     * @param {Coordinate} coordinate - coordinate to pan to
     * @param {Object} [options=null] - pan options
     * @param {Boolean} [options.animation=null] - whether pan with animation
     * @param {Boolean} [options.duration=600] - pan animation duration
     * @return {Map} this
     */
    panTo: function (coordinate, options = {}) {
        if (!coordinate) {
            return this;
        }
        coordinate = new Coordinate(coordinate);
        return this._panAnimation(coordinate, options['duration']);
    },

    /**
     * Pan the map by the give point
     * @param  {Point} point - distance to pan, in pixel
     * @param {Object} [options=null] - pan options
     * @param {Boolean} [options.animation=null] - whether pan with animation
     * @param {Boolean} [options.duration=600] - pan animation duration
     * @return {Map} this
     */
    panBy: function (offset, options = {}) {
        return this._panBy(offset, options);
    },

    _panBy: function (offset, options, cb) {
        if (!offset) {
            return this;
        }
        offset = new Point(offset).multi(-1);
        this.onMoveStart();
        if (!options) {
            options = {};
        } else if (isFunction(options)) {
            cb = options;
            options = {};
        }
        if (typeof (options['animation']) === 'undefined' || options['animation']) {
            const target = this.locateByPoint(this.getCenter(), offset.x, offset.y);
            this._panAnimation(target, options['duration'], cb);
        } else {
            this._offsetCenterByPixel(offset);
            this.onMoving();
            if (cb) {
                cb();
            }
            this.onMoveEnd();
        }
        return this;
    },

    _panAnimation: function (target, t, onFinish) {
        if (!this.options['panAnimation']) {
            this.setCenter(target);
            return;
        }
        this.animateTo({
            'center' : target
        }, {
            'duration' : t || this.options['panAnimationDuration'],
            'onFinish' : onFinish
        });
    }
});
