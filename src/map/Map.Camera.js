import Map from './Map';
import Point from 'geo/Point';
import * as mat4 from 'core/util/mat4';
import { clamp, interpolate, wrap } from 'core/util';
import Browser from 'core/Browser';

const RADIAN = Math.PI / 180;
const DEFAULT_FOV = 0.6435011087932844;

/*!
 * based on snippets from mapbox-gl-js
 * https://github.com/mapbox/mapbox-gl-js
 * LICENSE : MIT
 * (c) mapbox
 */

Map.include(/** @lends Map.prototype */{
    /**
     * Get map's fov (field of view);
     * @return {Number} fov in degree
     */
    getFov() {
        if (!this._fov) {
            this._fov = DEFAULT_FOV;
        }
        return this._fov / RADIAN;
    },

    /**
     * Set a new fov to map
     * @param {Number} fov new fov in degree
     * @return {Map} this
     */
    setFov(fov) {
        if (this.isZooming()) {
            return this;
        }
        fov = Math.max(0.01, Math.min(60, fov));
        if (this._fov === fov) return this;
        const from = this.getFov();
        this._fov = fov * RADIAN;
        this._calcMatrices();
        this._renderLayers();
        /*
          * fovchange event
          * @event Map#fovchange
          * @type {Object}
          * @property {String} type                    - fovchange
          * @property {Map} target                     - the map fires event
          * @property {Number} from                    - fovchange from
          * @property {Number} to                      - fovchange to
        */
        this._fireEvent('fovchange', { 'from' : from, 'to': this.getFov() });
        return this;
    },

    /**
     * Get map's bearing
     * @return {Number} bearing in degree
     */
    getBearing() {
        if (!this._angle) {
            return 0;
        }
        return -this._angle / RADIAN;
    },

    /**
     * Set a new bearing to map
     * @param {Number} bearing new bearing in degree
     * @return {Map} this
     */
    setBearing(bearing) {
        if (Browser.ie9) {
            throw new Error('map can\'t rotate in IE9.');
        }
        const b = -wrap(bearing, -180, 180) * RADIAN;
        if (this._angle === b) return this;
        const from = this.getBearing();
        this._angle = b;
        this._calcMatrices();
        this._renderLayers();
        /*
          * rotate event
          * @event Map#rotate
          * @type {Object}
          * @property {String} type                    - rotate
          * @property {Map} target                     - the map fires event
          * @property {Number} from                    - bearing rotate from
          * @property {Number} to                      - bearing rotate to
        */
        this._fireEvent('rotate', { 'from' : from, 'to': b });
        return this;
    },

    /**
     * Get map's pitch
     * @return {Number} pitch in degree
     */
    getPitch() {
        if (!this._pitch) {
            return 0;
        }
        return this._pitch / Math.PI * 180;
    },

    /**
     * Set a new pitch to map
     * @param {Number} pitch new pitch in degree
     * @return {Map} this
     */
    setPitch(pitch) {
        if (Browser.ie9) {
            throw new Error('map can\'t tilt in IE9.');
        }
        const p = clamp(pitch, 0, 60) * RADIAN;
        if (this._pitch === p) return this;
        const from = this.getPitch();
        this._pitch = p;
        this._calcMatrices();
        this._renderLayers();
        /**
          * pitch event
          * @event Map#pitch
          * @type {Object}
          * @property {String} type                    - pitch
          * @property {Map} target                     - the map fires event
          * @property {Number} from                    - pitch from
          * @property {Number} to                      - pitch to
          */
        this._fireEvent('pitch', { 'from' : from, 'to': p });
        return this;
    },

    /**
     * Whether the map is rotating or tilting.
     * @return {Boolean}
     * @private
     */
    isTransforming() {
        return !!(this._pitch || this._angle);
    },

    /**
     * Convert 2d point at target zoom to containerPoint at current zoom
     * @param  {Point} point 2d point at target zoom
     * @param  {Number} zoom  point's zoom
     * @param  {Number} [altitude=0]  target's altitude in 2d point system at target zoom
     * @return {Point}       containerPoint at current zoom
     * @private
     */
    _pointToContainerPoint(point, zoom, altitude = 0) {
        point = this._pointToPoint(point, zoom);
        if (this.isTransforming() || altitude) {
            const t = [point.x, point.y, altitude, 1];
            mat4.transformMat4(t, t, this.pixelMatrix);
            return new Point(t[0] / t[3], t[1] / t[3]);
        } else {
            const centerPoint = this._prjToPoint(this._getPrjCenter());
            return point._sub(centerPoint)._add(this.width / 2, this.height / 2);
        }
    },

    /**
     * Convert containerPoint at current zoom to 2d point at target zoom
     * @param  {Point} p    container point at current zoom
     * @param  {Number} zoom target zoom, current zoom in default
     * @return {Point}      2d point at target zoom
     * @private
     */
    _containerPointToPoint(p, zoom) {
        if (this.isTransforming()) {
            const targetZ = 0;
            // since we don't know the correct projected z value for the point,
            // unproject two points to get a line and then find the point on that
            // line with z=0

            const coord0 = [p.x, p.y, 0, 1];
            const coord1 = [p.x, p.y, 1, 1];

            mat4.transformMat4(coord0, coord0, this.pixelMatrixInverse);
            mat4.transformMat4(coord1, coord1, this.pixelMatrixInverse);

            const w0 = coord0[3];
            const w1 = coord1[3];
            const x0 = coord0[0] / w0;
            const x1 = coord1[0] / w1;
            const y0 = coord0[1] / w0;
            const y1 = coord1[1] / w1;
            const z0 = coord0[2] / w0;
            const z1 = coord1[2] / w1;

            const t = z0 === z1 ? 0 : (targetZ - z0) / (z1 - z0);

            const cp = new Point(interpolate(x0, x1, t), interpolate(y0, y1, t));
            return ((zoom === undefined || this.getZoom() === zoom) ? cp : this._pointToPointAtZoom(cp, zoom));
        }
        const centerPoint = this._prjToPoint(this._getPrjCenter(), zoom),
            scale = (zoom !== undefined ? this._getResolution() / this._getResolution(zoom) : 1);
        const x = scale * (p.x - this.width / 2),
            y = scale * (p.y - this.height / 2);
        return centerPoint._add(x, y);
    },

    _calcMatrices() {
        if (!this.height || (typeof Float64Array === 'undefined')) {
            return;
        }
        if (!this._fov) {
            this._fov = DEFAULT_FOV;
        }
        if (!this._pitch) {
            this._pitch = 0;
        }
        if (!this._angle) {
            this._angle = 0;
        }

        this.cameraToCenterDistance = 0.5 / Math.tan(this._fov / 2) * this.height;

        // Find the distance from the center point [width/2, height/2] to the
        // center top point [width/2, 0] in Z units, using the law of sines.
        // 1 Z unit is equivalent to 1 horizontal px at the center of the map
        // (the distance between[width/2, height/2] and [width/2 + 1, height/2])
        const halfFov = this._fov / 2;
        const groundAngle = Math.PI / 2 + this._pitch;
        const topHalfSurfaceDistance = Math.sin(halfFov) * this.cameraToCenterDistance / Math.sin(Math.PI - groundAngle - halfFov);

        // Calculate z distance of the farthest fragment that should be rendered.
        const furthestDistance = Math.cos(Math.PI / 2 - this._pitch) * topHalfSurfaceDistance + this.cameraToCenterDistance;
        // Add a bit extra to avoid precision problems when a fragment's distance is exactly `furthestDistance`
        const farZ = furthestDistance * 1.5;

        // matrix for conversion from location to GL coordinates (-1 .. 1)
        let m = new Float64Array(16);
        mat4.perspective(m, this._fov, this.width / this.height, 1, farZ);

        mat4.scale(m, m, [1, -1, 1]);
        mat4.translate(m, m, [0, 0, -this.cameraToCenterDistance]);
        mat4.rotateX(m, m, this._pitch);
        mat4.rotateZ(m, m, this._angle);

        //matrix for doms
        const domMat = mat4.copy(new Float64Array(16), m);

        const centerPoint = this._prjToPoint(this._prjCenter);
        const x = centerPoint.x, y = centerPoint.y;
        mat4.translate(m, m, [-x, -y, 0]);

        // scale vertically to meters per pixel (inverse of ground resolution):
        // worldSize / (circumferenceOfEarth * cos(lat * π / 180))
        // but for maptalks.js, scaling on Z axis is unnecessary
        // const verticalScale = this.worldSize / (2 * Math.PI * 6378137 * Math.abs(Math.cos(this.center.lat * (Math.PI / 180))));
        // mat4.scale(m, m, [1, 1, verticalScale, 1]);

        this.projMatrix = m;

        // matrix for conversion from location to screen coordinates
        m = mat4.create();
        mat4.scale(m, m, [this.width / 2, -this.height / 2, 1]);
        mat4.translate(m, m, [1, -1, 0]);
        this.pixelMatrix = mat4.multiply(new Float64Array(16), m, this.projMatrix);

        // inverse matrix for conversion from screen coordinaes to location
        m = mat4.invert(new Float64Array(16), this.pixelMatrix);
        if (!m) throw new Error('failed to invert matrix');
        this.pixelMatrixInverse = m;

        if (!this._pitch && !this._angle) {
            this._clearMatrices();
            return;
        }

        // matrix for dom's css3 matrix3d transform
        m = mat4.create();
        mat4.scale(m, m, [this.width / 2, -this.height / 2, 1]);
        this.domCssMatrix = mat4.multiply(m, m, domMat);

        //camera alitutude in point
        this.cameraAltitude = this.cameraToCenterDistance * Math.cos(this._pitch);
    },

    _clearMatrices() {
        delete this.domCssMatrix;
    },

    _renderLayers() {
        if (this.isInteracting()) {
            return;
        }
        const layers = this._getLayers();
        // clear canvas layers to prevent unsync painting with tile layers.
        layers.forEach(layer => {
            if (!layer) {
                return;
            }
            const renderer = layer._getRenderer();
            if (renderer && renderer.setToRedraw) {
                renderer.setToRedraw();
            }
        });
    }
});
