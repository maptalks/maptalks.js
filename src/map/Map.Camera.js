import Map from './Map';
import Point from '../geo/Point';
import * as mat4 from '../core/util/mat4';
import { subtract, add, scale, normalize, dot, set } from '../core/util/vec3';
import { clamp, interpolate, wrap } from '../core/util';
import { applyMatrix, matrixToQuaternion, quaternionToMatrix, lookAt, setPosition } from '../core/util/math';
import Browser from '../core/Browser';

const RADIAN = Math.PI / 180;
const DEFAULT_FOV = 0.6435011087932844;

/*!
 * contains code from mapbox-gl-js
 * https://github.com/mapbox/mapbox-gl-js
 * LICENSE : MIT
 * (c) mapbox
 *
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
        /*
          * rotate event
          * @event Map#rotatestart
          * @type {Object}
          * @property {String} type                    - rotatestart
          * @property {Map} target                     - the map fires event
          * @property {Number} from                    - bearing rotate from
          * @property {Number} to                      - bearing rotate to
        */
        this._fireEvent('rotatestart', { 'from' : from, 'to': b });
        this._angle = b;
        this._calcMatrices();
        this._renderLayers();
        /*
          * rotate event, alias of rotateend, deprecated
          *
          * @event Map#rotate
          * @type {Object}
          * @property {String} type                    - rotate
          * @property {Map} target                     - the map fires event
          * @property {Number} from                    - bearing rotate from
          * @property {Number} to                      - bearing rotate to
        */
        this._fireEvent('rotate', { 'from' : from, 'to': b });
        /*
          * rotateend event
          * @event Map#rotateend
          * @type {Object}
          * @property {String} type                    - rotateend
          * @property {Map} target                     - the map fires event
          * @property {Number} from                    - bearing rotate from
          * @property {Number} to                      - bearing rotate to
        */
        this._fireEvent('rotateend', { 'from' : from, 'to': b });
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
        const p = clamp(pitch, 0, this.options['maxPitch']) * RADIAN;
        if (this._pitch === p) return this;
        const from = this.getPitch();
        /*
          * rotate event
          * @event Map#pitchstart
          * @type {Object}
          * @property {String} type                    - pitchstart
          * @property {Map} target                     - the map fires event
          * @property {Number} from                    - pitch from
          * @property {Number} to                      - pitch to
        */
        this._fireEvent('pitchstart', { 'from' : from, 'to': p });
        this._pitch = p;
        this._calcMatrices();
        this._renderLayers();
        /**
          * pitch event, alias of pitchend, deprecated
          * @event Map#pitch
          * @type {Object}
          * @property {String} type                    - pitch
          * @property {Map} target                     - the map fires event
          * @property {Number} from                    - pitch from
          * @property {Number} to                      - pitch to
          */
        this._fireEvent('pitch', { 'from' : from, 'to': p });
        /**
          * pitchend event
          * @event Map#pitchend
          * @type {Object}
          * @property {String} type                    - pitchend
          * @property {Map} target                     - the map fires event
          * @property {Number} from                    - pitchend from
          * @property {Number} to                      - pitchend to
          */
        this._fireEvent('pitchend', { 'from' : from, 'to': p });
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

    getFrustumAltitude() {
        const pitch = 90 - this.getPitch();
        let fov = this.getFov() / 2;
        const cameraAlt = this.cameraPosition ? this.cameraPosition[2] : 0;
        if (fov <= pitch) {
            return cameraAlt;
        }
        fov = Math.PI * fov / 180;
        const d1 = new Point(this.cameraPosition).distanceTo(new Point(this.cameraLookAt)),
            d2 = cameraAlt * Math.tan(fov * 2);
        const d = Math.tan(fov) * (d1 + d2);
        return cameraAlt + d;
    },

    /**
     * Convert 2d point at target zoom to containerPoint at current zoom
     * @param  {Point} point 2d point at target zoom
     * @param  {Number} zoom  point's zoom
     * @param  {Number} [altitude=0]  target's altitude in 2d point system at target zoom
     * @return {Point}       containerPoint at current zoom
     * @private
     */
    _pointToContainerPoint: function () {
        const a = [0, 0, 0];
        return function (point, zoom, altitude = 0) {
            point = this._pointToPoint(point, zoom);
            if (this.isTransforming() || altitude) {
                //convert altitude at zoom to current zoom
                altitude *= this.getResolution(zoom) / this.getResolution();
                const scale = this._glScale;
                set(a, point.x * scale, point.y * scale, altitude * scale);

                const t = this._projIfBehindCamera(a, this.cameraPosition, this.cameraForward);
                applyMatrix(t, t, this.projViewMatrix);

                const w2 = this.width / 2, h2 = this.height / 2;
                t[0] = (t[0] * w2) + w2;
                t[1] = -(t[1] * h2) + h2;
                return new Point(t[0], t[1]);
            } else {
                const centerPoint = this._prjToPoint(this._getPrjCenter());
                return point._sub(centerPoint)._add(this.width / 2, this.height / 2);
            }
        };
    }(),

    // https://forum.unity.com/threads/camera-worldtoscreenpoint-bug.85311/#post-2121212
    _projIfBehindCamera: function () {
        const vectorFromCam = new Array(3);
        const proj = new Array(3);
        const sub = new Array(3);
        return function (position, cameraPos, camForward) {
            subtract(vectorFromCam, position, cameraPos);
            const camNormDot = dot(camForward, vectorFromCam);
            if (camNormDot <= 0) {
                scale(proj, camForward, camNormDot * 1.01);
                add(position, cameraPos, subtract(sub, vectorFromCam, proj));
            }
            return position;
        };
    }(),

    /**
     * Convert containerPoint at current zoom to 2d point at target zoom
     * from mapbox-gl-js
     * @param  {Point} p    container point at current zoom
     * @param  {Number} zoom target zoom, current zoom in default
     * @return {Point}      2d point at target zoom
     * @private
     */
    _containerPointToPoint: function () {
        const cp = [0, 0, 0],
            coord0 = [0, 0, 0, 1],
            coord1 = [0, 0, 0, 1];
        return function (p, zoom) {
            if (this.isTransforming()) {
                const w2 = this.width / 2 || 1, h2 = this.height / 2 || 1;
                set(cp, (p.x - w2) / w2, (h2 - p.y) / h2, 0);

                set(coord0, cp[0], cp[1], 0);
                set(coord1, cp[0], cp[1], 1);
                coord0[3] = coord1[3] = 1;

                applyMatrix(coord0, coord0, this.projViewMatrixInverse);
                applyMatrix(coord1, coord1, this.projViewMatrixInverse);
                const x0 = coord0[0];
                const x1 = coord1[0];
                const y0 = coord0[1];
                const y1 = coord1[1];
                const z0 = coord0[2];
                const z1 = coord1[2];

                const t = z0 === z1 ? 0 : (0 - z0) / (z1 - z0);

                const point = new Point(interpolate(x0, x1, t), interpolate(y0, y1, t))._multi(1 / this._glScale);
                return ((zoom === undefined || this.getZoom() === zoom) ? point : this._pointToPointAtZoom(point, zoom));
            }
            const centerPoint = this._prjToPoint(this._getPrjCenter(), zoom),
                scale = (zoom !== undefined ? this._getResolution() / this._getResolution(zoom) : 1);
            const x = scale * (p.x - this.width / 2),
                y = scale * (p.y - this.height / 2);
            return centerPoint._add(x, y);
        };
    }(),

    /**
     * GL Matrices in maptalks (based on THREE):
     * //based on point at map's gl world zoom, by map.coordToPoint(coord, map.getGLZoom())
     * map.cameraPosition
     * map.cameraLookAt
     * map.cameraUp       //camera's up vector
     * map.cameraForward  //camera's forward vector
     * map.cameraWorldMatrix
     * map.projMatrix
     * map.viewMatrix = cameraWorldMatrix.inverse()
     * map.projViewMatrix = projMatrix * viewMatrix
     * map.projViewMatrixInverse = projViewMatrix.inverse()
     *  @private
     */
    _calcMatrices: function () {
        // closure matrixes to reuse
        const m0 = Browser.ie9 ? null : createMat4(),
            m1 = Browser.ie9 ? null : createMat4();
        return function () {
            // get pixel size of map
            if (Browser.ie9) {
                return;
            }
            const size = this.getSize();
            const w = size.width || 1,
                h = size.height || 1;

            this._glScale = this.getGLScale();
            // get field of view
            const fov = this.getFov() * Math.PI / 180;
            const maxScale = this.getScale(this.getMinZoom()) / this.getScale(this.getMaxNativeZoom());
            const farZ = maxScale * h / 2 / this._getFovRatio() * 1.4;
            // camera projection matrix
            const projMatrix = this.projMatrix || createMat4();
            mat4.perspective(projMatrix, fov, w / h, 0.1, farZ);
            this.projMatrix = projMatrix;
            // camera world matrix
            const worldMatrix = this._getCameraWorldMatrix();
            // view matrix
            this.viewMatrix = mat4.invert(m0, worldMatrix);
            // matrix for world point => screen point
            this.projViewMatrix = mat4.multiply(this.projViewMatrix || createMat4(), projMatrix, this.viewMatrix);
            // matrix for screen point => world point
            this.projViewMatrixInverse = mat4.multiply(this.projViewMatrixInverse || createMat4(), worldMatrix, mat4.invert(m1, projMatrix));
            this.domCssMatrix = this._calcDomMatrix();
        };
    }(),

    _calcDomMatrix: function () {
        const m = Browser.ie9 ? null : createMat4(),
            minusY = [1, -1, 1],
            arr = [0, 0, 0];
        return function () {
            const cameraToCenterDistance = 0.5 / Math.tan(this._fov / 2) * this.height;
            mat4.scale(m, this.projMatrix, minusY);
            mat4.translate(m, m, set(arr, 0, 0, -cameraToCenterDistance));//[0, 0, cameraToCenterDistance]
            if (this._pitch) {
                mat4.rotateX(m, m, this._pitch);
            }
            if (this._angle) {
                mat4.rotateZ(m, m, this._angle);
            }
            const m1 = createMat4();
            mat4.scale(m1, m1, set(arr, this.width / 2, -this.height / 2, 1)); //[this.width / 2, -this.height / 2, 1]
            return mat4.multiply(this.domCssMatrix || createMat4(), m1, m);
        };
    }(),

    _getCameraWorldMatrix: function () {
        const q = {},
            minusY = [1, -1, 1];
        return function () {
            const targetZ = this.getGLZoom();

            const size = this.getSize(),
                scale = this.getGLScale();
            const center2D = this._prjToPoint(this._prjCenter, targetZ);
            this.cameraLookAt = set(this.cameraLookAt || [0, 0, 0], center2D.x, center2D.y, 0);

            const pitch = this.getPitch() * RADIAN;
            const bearing = -this.getBearing() * RADIAN;

            const ratio = this._getFovRatio();
            const z = scale * (size.height || 1) / 2 / ratio;
            const cz = z * Math.cos(pitch);
            // and [dist] away from map's center on XY plane to tilt the scene.
            const dist = Math.sin(pitch) * z;
            // when map rotates, the camera's xy position is rotating with the given bearing and still keeps [dist] away from map's center
            const cx = center2D.x + dist * Math.sin(bearing);
            const cy = center2D.y + dist * Math.cos(bearing);
            this.cameraPosition = set(this.cameraPosition || [0, 0, 0], cx, cy, cz);
            // when map rotates, camera's up axis is pointing to bearing from south direction of map
            // default [0,1,0] is the Y axis while the angle of inclination always equal 0
            // if you want to rotate the map after up an incline,please rotateZ like this:
            // let up = new vec3(0,1,0);
            // up.rotateZ(target,radians);
            const d = dist || 1;
            const up = this.cameraUp = set(this.cameraUp || [0, 0, 0], Math.sin(bearing) * d, Math.cos(bearing) * d, 0);
            const m = this.cameraWorldMatrix = this.cameraWorldMatrix || createMat4();
            lookAt(m, this.cameraPosition, this.cameraLookAt, up);

            const cameraForward = this.cameraForward || [0, 0, 0];
            subtract(cameraForward, this.cameraLookAt, this.cameraPosition);
            // similar with unity's camera.transform.forward
            this.cameraForward = normalize(cameraForward, cameraForward);
            // math from THREE.js
            matrixToQuaternion(q, m);
            quaternionToMatrix(m, q);
            setPosition(m, this.cameraPosition);
            mat4.scale(m, m, minusY);
            return m;
        };
    }(),

    _getFovRatio() {
        const fov = this.getFov();
        return Math.tan(fov / 2 * RADIAN);
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

function createMat4() {
    return mat4.identity(new Array(16));
}
