import Coordinate from '../geo/Coordinate';
import Point from '../geo/Point';
import Map from './Map';
import { isFunction } from '../core/util';

Map.include({
    /** @lends Map.prototype */

    /**
     * Pan to the given coordinate
     * @param {Coordinate} coordinate - coordinate to pan to
     * @param {Object} [options=null] - pan options
     * @param {Boolean} [options.animation=null] - whether pan with animation
     * @param {Boolean} [options.duration=600] - pan animation duration
     * @return {Map} this
     */
    panTo(coordinate, options?, step?) {
        if (!coordinate) {
            return this;
        }
        options = options || {};
        if (isFunction(options)) {
            step = options;
            options = {};
        }
        coordinate = new Coordinate(coordinate);
        if (typeof (options['animation']) === 'undefined' || options['animation']) {
            //@ts-ignore
            const prjCoord = this.getProjection().project(coordinate);
            return this._panAnimation(prjCoord, options['duration'], step);
        } else {
            //@ts-ignore
            this.setCenter(coordinate);
        }
        return this;
    },

    _panTo(prjCoord, options = {}) {
        if (typeof (options['animation']) === 'undefined' || options['animation']) {
            return this._panAnimation(prjCoord, options['duration']);
        } else {
            //@ts-ignore
            this.onMoveStart();
            //@ts-ignore
            this._setPrjCenter(prjCoord);
            //@ts-ignore
            this.onMoveEnd(this._parseEventFromCoord(this.getCenter()));
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
    panBy(offset, options = {}, step) {
        if (!offset) {
            return this;
        }
        if (isFunction(options)) {
            step = options;
            options = {};
        }
        offset = new Point(offset);
        //@ts-ignore
        const containerExtent = this.getContainerExtent();
        const ymin = containerExtent.ymin;
        if (ymin > 0 && offset.y > 30) {
            //limit offset'y when tilted to max pitch
            const y = offset.y;
            offset.y = 30;
            offset.x = offset.x * 30 / y;
            console.warn('offset is limited to panBy when pitch is above maxPitch');
            // return this;
        }
        if (typeof (options['animation']) === 'undefined' || options['animation']) {
            offset = offset.multi(-1);
            // const point0 = this._prjToPoint(this._getPrjCenter());
            // const point1 =
            // point._add(offset.x, offset.y);
            // const target = this._pointToPrj(point);
            //@ts-ignore
            const target = this._containerPointToPrj(new Point(this.width / 2 + offset.x, this.height / 2 + offset.y));
            // const target = this.locateByPoint(this.getCenter(), offset.x, offset.y);
            this._panAnimation(target, options['duration'], step);
        } else {
            //@ts-ignore
            this.onMoveStart();
            //@ts-ignore
            this._offsetCenterByPixel(offset);
            //@ts-ignore
            const endCoord = this.containerPointToCoord(new Point(this.width / 2, this.height / 2));
            //@ts-ignore
            this.onMoveEnd(this._parseEventFromCoord(endCoord));
        }
        return this;
    },

    _panAnimation(target, t, cb?) {
        //@ts-ignore
        return this._animateTo({
            'prjCenter': target
        }, {
            //@ts-ignore
            'duration': t || this.options['panAnimationDuration'],
        }, cb);
    }
});
