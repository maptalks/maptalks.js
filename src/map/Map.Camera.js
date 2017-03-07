import Map from './Map';
import Point from 'geo/Point';
import * as mat4 from 'core/util/mat4';
import { clamp, interpolate } from 'core/util';

/*!
 * based on snippets from mapbox-gl-js
 * https://github.com/mapbox/mapbox-gl-js
 * LICENSE : MIT
 * (c) mapbox
 */

Map.include(/** @lends Map.prototype */{

    // getBearing() {
    //     if (!this._angle) {
    //         return 0;
    //     }
    //     return -this._angle / Math.PI * 180;
    // },

    // setBearing(bearing) {
    //     var b = -wrap(bearing, -180, 180) * Math.PI / 180;
    //     if (this._angle === b) return this;
    //     const from = this.getBearing();
    //     this._angle = b;
    //     this._calcMatrices();
    //     this._renderLayers();
    //     *
    //       * rotate event
    //       * @event Map#rotate
    //       * @type {Object}
    //       * @property {String} type                    - rotate
    //       * @property {Map} target                     - the map fires event
    //       * @property {Number} from                    - bearing rotate from
    //       * @property {Number} to                      - bearing rotate to

    //     this._fireEvent('rotate', { 'from' : from, 'to': b });
    //     return this;
    // },

    getPitch() {
        if (!this._pitch) {
            return 0;
        }
        return this._pitch / Math.PI * 180;
    },

    setPitch(pitch) {
        const p = clamp(pitch, 0, 60) / 180 * Math.PI;
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

    getCameraMatrix() {
        return this._cameraMatrix;
    },

    /**
     * Convert 2d point at target zoom to containerPoint at current zoom
     * @param  {Point} point 2d point at target zoom
     * @param  {Number} zoom  target zoom, current zoom in default
     * @return {Point}       containerPoint at current zoom
     * @private
     */
    _pointToContainerPoint(point, zoom) {
        point = this._pointToPoint(point, zoom);
        if (this._pixelMatrix) {
            var t = [point.x, point.y, 0, 1];
            mat4.transformMat4(t, t, this._pixelMatrix);
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
        if (this._pixelMatrixInverse) {
            const targetZ = 0;
            // since we don't know the correct projected z value for the point,
            // unproject two points to get a line and then find the point on that
            // line with z=0

            var coord0 = [p.x, p.y, 0, 1];
            var coord1 = [p.x, p.y, 1, 1];

            mat4.transformMat4(coord0, coord0, this._pixelMatrixInverse);
            mat4.transformMat4(coord1, coord1, this._pixelMatrixInverse);

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
            return (zoom === undefined ? cp : this._pointToPoint(cp, zoom));
        }
        const centerPoint = this._prjToPoint(this._getPrjCenter(), zoom),
            scale = (zoom !== undefined ? this._getResolution() / this._getResolution(zoom) : 1);
        const x = scale * (p.x - this.width / 2),
            y = scale * (p.y - this.height / 2);
        return centerPoint._add(x, y);
    },

    _calcMatrices() {
        if (!this.height) return;
        if (!this._pitch) {
            this._pitch = 0;
        }
        if (!this._angle) {
            this._angle = 0;
        }

        if (!this._pitch && !this._angle) {
            this._clearMatrices();
            return;
        }

        const centerPoint = this._prjToPoint(this._prjCenter);
        const x = centerPoint.x, y = centerPoint.y;

        const altitude = this._altitude = 1.5;
         // Find the distance from the center point to the center top in altitude units using law of sines.
        const halfFov = Math.atan(0.5 / altitude);
        const topHalfSurfaceDistance = Math.sin(halfFov) * altitude / Math.sin(Math.PI / 2 - this._pitch - halfFov);

        // Calculate z value of the farthest fragment that should be rendered.
        const farZ = Math.cos(Math.PI / 2 - this._pitch) * topHalfSurfaceDistance + altitude;

        // matrix for conversion from location to GL coordinates (-1 .. 1)
        var m = new Float64Array(16);
        mat4.perspective(m, 2 * Math.atan((this.height / 2) / altitude), this.width / this.height, 0.1, farZ);
        mat4.translate(m, m, [0, 0, -altitude]);

        // After the rotateX, z values are in pixel units. Convert them to
        // altitude units. 1 altitude unit = the screen height.
        mat4.scale(m, m, [1, -1, 1 / this.height]);

        mat4.rotateX(m, m, this._pitch);
        mat4.rotateZ(m, m, this._angle);

        var m2 = mat4.copy(new Float64Array(16), m);

        mat4.translate(m, m, [-x, -y, 0]);

        this._projMatrix = m;

        // matrix for conversion from location to screen coordinates
        m = mat4.create();
        mat4.scale(m, m, [this.width / 2, -this.height / 2, 1]);
        mat4.translate(m, m, [1, -1, 0]);
        this._pixelMatrix = mat4.multiply(new Float64Array(16), m, this._projMatrix);

        // inverse matrix for conversion from screen coordinaes to location
        m = mat4.invert(new Float64Array(16), this._pixelMatrix);
        if (!m) throw new Error('failed to invert matrix');
        this._pixelMatrixInverse = m;


        // matrix for layer's css3 matrix3d transform
        m = mat4.create();
        mat4.scale(m, m, [this.width / 2, -this.height / 2, 1]);
        this._cameraMatrix = mat4.multiply(m, m, m2);
    },

    _clearMatrices() {
        delete this._projMatrix;
        delete this._pixelMatrix;
        delete this._pixelMatrixInverse;
        delete this._cameraMatrix;
    },

    _renderLayers() {
        const render = layer => {
            if (layer && layer._getRenderer()) {
                layer._getRenderer().render();
            }
        };
        render(this.getBaseLayer());
        this._getLayers().forEach(layer => {
            render(layer);
        });
    }
});
