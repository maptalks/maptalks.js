import Coordinate from 'geo/Coordinate';
import Point from 'geo/Point';
import Map from './Map';

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
        if (typeof (options['animation']) === 'undefined' || options['animation']) {
            return this._panAnimation(coordinate, options['duration']);
        } else {
            this.setCenter(coordinate);
            return this;
        }
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
        if (!offset) {
            return this;
        }
        offset = new Point(offset).multi(-1);
        this.onMoveStart();
        if (typeof (options['animation']) === 'undefined' || options['animation']) {
            const target = this.locateByPoint(this.getCenter(), offset.x, offset.y);
            this._panAnimation(target, options['duration']);
        } else {
            this._offsetCenterByPixel(offset);
            this.onMoving();
            this.onMoveEnd();
        }
        return this;
    },

    _panAnimation: function (target, t, onFinish) {
        if (!this.options['panAnimation']) {
            return this.setCenter(target);
        }
        return this.animateTo({
            'center' : target
        }, {
            'duration' : t || this.options['panAnimationDuration'],
            'onFinish' : onFinish
        });
    }
});
