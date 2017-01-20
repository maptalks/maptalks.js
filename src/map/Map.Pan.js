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
    panTo: function (coordinate, options) {
        if (!coordinate) {
            return this;
        }
        var map = this;
        coordinate = new Coordinate(coordinate);
        var dest = this.coordinateToContainerPoint(coordinate),
            current = this.coordinateToContainerPoint(this.getCenter());
        return this._panBy(dest.substract(current), options, function () {
            var c = map.getProjection().project(coordinate);
            map._setPrjCenterAndMove(c);
        });
    },

    /**
     * Pan the map by the give point
     * @param  {Point} point - distance to pan, in pixel
     * @param {Object} [options=null] - pan options
     * @param {Boolean} [options.animation=null] - whether pan with animation
     * @param {Boolean} [options.duration=600] - pan animation duration
     * @return {Map} this
     */
    panBy: function (offset, options) {
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
        }
        if (typeof (options['animation']) === 'undefined' || options['animation']) {
            this._panAnimation(offset, options['duration'], cb);
        } else {
            this.offsetPlatform(offset);
            this._offsetCenterByPixel(offset);
            this.onMoving();
            if (cb) {
                cb();
            }
            this.onMoveEnd();
        }
        return this;
    },

    _panAnimation: function (offset, t, onFinish) {
        this._getRenderer().panAnimation(offset, t, onFinish);
    }

});
