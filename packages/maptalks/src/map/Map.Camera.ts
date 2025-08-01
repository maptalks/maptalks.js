import Map from './Map';
import Point from '../geo/Point';
import Coordinate from '../geo/Coordinate';
import * as mat4 from '../core/util/mat4';
import { subtract, add, scale, normalize, dot, set, distance, angle, cross } from '../core/util/vec3';
import { clamp, interpolate, isNumber, isNil, wrap, toDegree, toRadian, Matrix4, Vector3 } from '../core/util';
import { applyMatrix, matrixToQuaternion, quaternionToMatrix, lookAt, setPosition } from '../core/util/math';
import Browser from '../core/Browser';


declare module "./Map" {
    export interface Map {
        cameraPosition: [number, number, number];
        cameraLookAt: [number, number, number];
        projViewMatrix: Matrix4;
        getFov(): number;
        setFov(fov: number): this;
        getBearing(): number;
        setBearing(bearing: number): this;
        //@internal
        _setBearing(bearing: number): this;
        getPitch(): number;
        setPitch(pitch: number): this;
        //@internal
        _setPitch(pitch: number): this;
        //@internal
        _calcMatrices(): void;
        //@internal
        _containerPointToPoint(p: Point, zoom?: number, out?: Point, height?: number): Point;
        //@internal
        _recenterOnTerrain(): void;
        setCameraMovements(frameOptions: Array<MapViewType>, option?: { autoRotate: boolean });
        setCameraOrientation(params: MapViewType): this;
        setCameraPosition(coordinate: Coordinate);
        getFitZoomForCamera(cameraPosition: [number, number, number], pitch: number);
        getFitZoomForAltitude(altitude: number);
        isTransforming(): boolean;
        getFrustumAltitude(): number;
        updateCenterAltitude();
        //@internal
        _queryTerrainByProjCoord(coord: Coordinate): number;
        //@internal
        _hasAltitudeLayer(): boolean;
        //@internal
        _queryTerrainInfo(containerPoint: Point): { coordinate: Coordinate, altitude: number } | null;
        //@internal
        _pointAtResToContainerPoint(point: Point, res?: number, altitude?: number, out?: Point): Point;
        //@internal
        _pointToContainerPoint(point: Point, zoom?: number, out?: Point): Point;
        //@internal
        _pointsAtResToContainerPoints(point: Point[], res?: number, altitude?: number[], out?: Point[]): Point[];
        getContainerPointRay(from: Vector3, to: Vector3, containerPoint: Point, near?: number, far?: number);
        //@internal
        _query3DTilesInfo(containerPoint: Point);
        //@internal
        queryPrjCoordAtContainerPoint(containerPoint: Point);
    }
}


const RADIAN = Math.PI / 180;
const DEFAULT_FOV = 0.6435011087932844;
const TEMP_COORD = new Coordinate(0, 0);
const TEMP_POINT = new Point(0, 0);
const SOUTH = [0, -1, 0], BEARING = [];

const altitudesHasData = (altitudes) => {
    if (isNumber(altitudes)) {
        return altitudes !== 0;
    } else if (Array.isArray(altitudes) && altitudes.length > 0) {
        for (let i = 0, len = altitudes.length; i < len; i++) {
            if (isNumber(altitudes[i]) && altitudes[i] !== 0) {
                return true;
            }
        }
    }
    return false;
};

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
        this._fireEvent('fovchange', { 'from': from, 'to': this.getFov() });
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
        const view = { bearing };
        this._validateView(view);
        if (this._mapAnimPlayer) {
            this._stopAnim(this._mapAnimPlayer);
        }
        return this._setBearing(view.bearing);
    },

    //@internal
    _setBearing(bearing) {
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
        this._fireEvent('rotatestart', { 'from': from, 'to': b });
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
        this._fireEvent('rotate', { 'from': from, 'to': b });
        /*
          * rotateend event
          * @event Map#rotateend
          * @type {Object}
          * @property {String} type                    - rotateend
          * @property {Map} target                     - the map fires event
          * @property {Number} from                    - bearing rotate from
          * @property {Number} to                      - bearing rotate to
        */
        this._fireEvent('rotateend', { 'from': from, 'to': b });
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
        const view = { pitch };
        this._validateView(view);
        if (this._mapAnimPlayer) {
            this._stopAnim(this._mapAnimPlayer);
        }
        return this._setPitch(view.pitch);
    },

    //@internal
    _setPitch(pitch) {
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
        this._fireEvent('pitchstart', { 'from': from, 'to': p });
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
        this._fireEvent('pitch', { 'from': from, 'to': p });
        /**
          * pitchend event
          * @event Map#pitchend
          * @type {Object}
          * @property {String} type                    - pitchend
          * @property {Map} target                     - the map fires event
          * @property {Number} from                    - pitchend from
          * @property {Number} to                      - pitchend to
          */
        this._fireEvent('pitchend', { 'from': from, 'to': p });
        return this;
    },

    /**
     * set camera movements
     * @param {Array} frameOptions
     * [{ center: [114, 32], zoom: 14, pitch: 45, bearing: 90, timestamp: 0 }]
     * @param {Object} extraOptions
     * { autoRotate: true }
     */
    setCameraMovements(frameOptions, extraOptions) {
        if (!Array.isArray(frameOptions) || !frameOptions.length) {
            return this;
        }
        frameOptions.forEach(frameOption => {
            this._validateView(frameOption);
        });
        this.setView({
            center: frameOptions[0].center,
            zoom: frameOptions[0].zoom,
            pitch: frameOptions[0].pitch,
            bearing: frameOptions[0].bearing
        });
        if (frameOptions.length === 1) return this;
        let index = 1;
        let onFrame = frame => {
            if (frame.state.playState === 'finished') {
                index++;
                if (index === frameOptions.length - 1) onFrame = null;
                const frameOption = frameOptions[index];
                frameOption.duration = frameOption.timestamp - frameOptions[index - 1].timestamp;
                if (extraOptions && extraOptions.autoRotate) {
                    frameOption.bearing = calculateBearing(frameOptions[index - 1].center, frameOption.center);
                }
                this._setCameraMovement(frameOption, onFrame);
            }
        };
        if (frameOptions.length === 2) onFrame = null;
        const currentBearing = this.getBearing();
        this._setCameraMovement({
            bearing: currentBearing,
            duration: frameOptions[index].timestamp - frameOptions[index - 1].timestamp,
            ...frameOptions[index]
        }, onFrame);
        const play = () => {
            this._animPlayer.play();
        };
        const pause = () => {
            this._animPlayer.pause();
        };
        const cancel = () => {
            this._animPlayer.cancel();
        };
        const finish = () => {
            this._animPlayer.finish();
        };
        const reverse = () => {
            this._animPlayer.reverse();
        };
        return {
            play,
            pause,
            cancel,
            finish,
            reverse
        };
    },

    //@internal
    _setCameraMovement(frameOption, frame) {
        this.animateTo({
            zoom: frameOption.zoom,
            center: frameOption.center,
            pitch: frameOption.pitch,
            bearing: frameOption.bearing
        }, {
            duration: frameOption.duration,
            easing: 'out'
        }, frame);
    },

    /**
     * Set camera's orientation
     * @param {Object}   options - options
     * @param {Coordinate | Array}  options.position  - position of the camera.
     * @param {Number}   [options.pitch = 0]  - pitch of the camera
     * @param {Number}   [options.bearing = 0]  - bearing of the camera
     * @returns {Map} this
     */
    setCameraOrientation(params) {
        const { position } = params;
        this._validateView(params);
        let { pitch, bearing } = params;
        pitch = pitch || 0;
        bearing = bearing || 0;
        const { zoom, cameraToGroundDistance } = this.getFitZoomForCamera(position, pitch);
        const dist = Math.sin((pitch) * RADIAN) * cameraToGroundDistance;
        const wrapBearing = wrap(bearing, -180, 180);
        const bearingRadian = wrapBearing * RADIAN;

        const glRes = this.getGLRes();
        const tempCoord = new Coordinate(position[0], position[1]);
        const tempPoint = this.coordToPointAtRes(tempCoord, glRes);
        const point = new Point(0, 0);
        point.x = tempPoint.x + dist * Math.sin(bearingRadian);
        point.y = tempPoint.y + dist * Math.cos(bearingRadian);

        const prjCenter = this._pointToPrjAtRes(point, this.getGLRes());
        this._setPrjCenter(prjCenter);

        this.setView({
            bearing,
            pitch,
            zoom
        });

        return this;
    },

    //设置相机的坐标, 根据地图中心点和相机位置，反算地图的bearing、pitch、zoom
    /**
     * Set camera's position
     * @param {Coordinate}   coordinate - camera's position
     * @returns {Map} this
     */
    setCameraPosition(coordinate) {
        const glRes = this.getGLRes();
        const cameraPoint = this.coordToPointAtRes(coordinate, glRes);
        cameraPoint.z = this.altitudeToPoint(coordinate.z || 0, glRes);
        const center = this.getCenter();
        const centerPoint = this.coordToPointAtRes(center, glRes);
        centerPoint.z = this.altitudeToPoint(center.z, glRes);
        const direction = subtract([] as any, cameraPoint.toArray(), centerPoint.toArray());
        set(this.cameraUp || [0, 0, 0], 0, 0, 1);
        this._pitch = angle(direction, this.cameraUp);
        set(BEARING as any, direction[0], direction[1], 0);
        this._angle = -angle(BEARING as any, SOUTH as any);
        this._zoomLevel = this.getFitZoomForCamera(coordinate, this._pitch).zoom;
        this._calcMatrices();
    },

    getFitZoomForCamera(cameraPosition: Array<number> | Coordinate, pitch: number) {
        if (!isNumber(pitch)) {
            pitch = 0;
        }
        const z = Array.isArray(cameraPosition) ? cameraPosition[2] || 0 : cameraPosition.z || 0;
        const cameraAltitude = z * this._meterToGLPoint;

        const centerAltitude = this.centerAltitude || 0;
        const centerPointZ = centerAltitude * this._meterToGLPoint;

        const cz = cameraAltitude - centerPointZ;

        const pitchRadian = pitch * RADIAN;

        const cameraToGroundDistance = cz / Math.cos(pitchRadian);

        const cameraToCenterDistance = cameraToGroundDistance + centerPointZ;

        const zoom = this.getFitZoomForAltitude(cameraToCenterDistance);
        return { zoom, cameraToGroundDistance };
    },

    getFitZoomForAltitude(distance: number) {
        const ratio = this._getFovRatio();
        const scale = distance * ratio * 2 / (this.height || 1) * this.getGLRes();
        const resolutions = this._getResolutions();
        let z = 0;
        for (z; z < resolutions.length - 1; z++) {
            if (resolutions[z] === scale) {
                return z;
            } else if (resolutions[z + 1] === scale) {
                return z + 1;
            } else if (scale < resolutions[z] && scale > resolutions[z + 1]) {
                z = (scale - resolutions[z]) / (resolutions[z + 1] - resolutions[z]) + z;
                return z - 1;
            } else {
                continue;
            }
        }
        return z;
    },

    /**
     * Whether the map is rotating or tilting.
     * @return {Boolean}
     * @private
     */
    isTransforming() {
        return !!(this._pitch || this._angle || this._terrainLayer);
    },

    getFrustumAltitude() {
        return this._frustumAltitude;
    },

    //@internal
    _calcFrustumAltitude() {
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
     * @function
     */
    //@internal
    _pointToContainerPoint: function (point, zoom, altitude = 0, out) {
        const res = this._getResolution(zoom);
        return this._pointAtResToContainerPoint(point, res, altitude, out);
    },

    //@internal
    _pointAtResToContainerPoint: function (point, res, altitude = 0, out) {
        if (!out) {
            out = new Point(0, 0);
        }
        point = this._pointAtResToPoint(point, res, out);
        const isTransforming = this.isTransforming();
        let centerPoint;
        if (!isTransforming && !altitude) {
            centerPoint = this._prjToPoint(this._getPrjCenter(), undefined, TEMP_COORD);
        }
        this._toContainerPoint(out, isTransforming, altitude, centerPoint);
        return out;
    },


    /**
     *Batch conversion for better performance
     */
    //@internal
    _pointsAtResToContainerPoints: function (points, targetRes, altitudes = [], resultPoints = []) {
        const pitch = this.getPitch(), bearing = this.getBearing();
        const scale = targetRes / this._getResolution();
        if (pitch === 0 && bearing === 0 && !altitudesHasData(altitudes)) {
            const { xmin, ymin, xmax, ymax } = this.get2DExtent();
            if (xmax > xmin && ymax > ymin) {

                const { width, height } = this.getSize();
                const dxPerPixel = (xmax - xmin) / width, dyPerPixel = (ymax - ymin) / height;
                for (let i = 0, len = points.length; i < len; i++) {
                    if (!points[i]) {
                        resultPoints[i] = null;
                        continue;
                    }
                    const pt = resultPoints[i];
                    pt.x = points[i].x;
                    pt.y = points[i].y;
                    pt._multi(scale);
                    pt.x = (pt.x - xmin) * dxPerPixel;
                    pt.y = height - (pt.y - ymin) * dyPerPixel;
                }
                return resultPoints;
            }
        }
        const altitudeIsArray = Array.isArray(altitudes);
        const isTransforming = this.isTransforming();
        const centerPoint = this._prjToPoint(this._getPrjCenter(), undefined, TEMP_COORD);
        for (let i = 0, len = points.length; i < len; i++) {
            if (!points[i]) {
                resultPoints[i] = null;
                continue;
            }
            const pt = resultPoints[i];
            pt.x = points[i].x;
            pt.y = points[i].y;
            pt._multi(scale);
            const altitude = altitudeIsArray ? (altitudes[i] || 0) : altitudes;
            this._toContainerPoint(pt, isTransforming, altitude, centerPoint);
        }
        return resultPoints;
    },

    //@internal
    _toContainerPoint: function () {
        const a = [0, 0, 0];
        return function (out, isTransforming, altitude, centerPoint) {
            const w2 = this.width / 2, h2 = this.height / 2;
            if (isTransforming || altitude) {
                if (!this._altitudeScale) {
                    this._altitudeScale = this.altitudeToPoint(100, this.getGLRes()) / 100;
                }
                const scale = this._glScale;
                set(a as any, out.x * scale, out.y * scale, altitude * this._altitudeScale);
                const t = this._projIfBehindCamera(a, this.cameraPosition, this.cameraForward);
                applyMatrix(t, t, this.projViewMatrix);
                out.x = (t[0] * w2) + w2;
                out.y = -(t[1] * h2) + h2;
            } else {
                out._sub(centerPoint.x, centerPoint.y);
                out.set(out.x, -out.y);
                out._add(w2, h2);
            }
        };
    }(),

    // https://forum.unity.com/threads/camera-worldtoscreenpoint-bug.85311/#post-2121212
    //@internal
    _projIfBehindCamera: function () {
        const vectorFromCam = new Array(3);
        const proj = new Array(3);
        const sub = new Array(3);
        return function (position, cameraPos, camForward) {
            subtract(vectorFromCam as any, position, cameraPos);
            const camNormDot = dot(camForward, vectorFromCam as any);
            if (camNormDot <= 0) {
                scale(proj as any, camForward, camNormDot * 1.01);
                add(position, cameraPos, subtract(sub as any, vectorFromCam as any, proj as any));
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
     * @function
     */
    //@internal
    _containerPointToPoint: function (p, zoom, out, height) {
        const res = this._getResolution(zoom);
        return this._containerPointToPointAtRes(p, res, out, height);
    },

    //@internal
    _containerPointToPointAtRes: function () {
        const coord0 = [0, 0, 0],
            coord1 = [0, 0, 0];
        return function (p, res, out, height) {
            if (this.isTransforming()) {
                this.getContainerPointRay(coord0, coord1, p);
                const x0 = coord0[0];
                const x1 = coord1[0];
                const y0 = coord0[1];
                const y1 = coord1[1];
                const z0 = coord0[2];
                const z1 = coord1[2];

                //container plane maybe has height, although it is 0 in most cases.
                const altitudePoint = !height ? 0 : this.altitudeToPoint(height, res) * this._glScale;
                const t = z0 === z1 ? altitudePoint : (altitudePoint - z0) / (z1 - z0);
                const x = interpolate(x0, x1, t);
                const y = interpolate(y0, y1, t);
                if (out) {
                    out.x = x;
                    out.y = y;
                } else {
                    out = new Point(x, y);
                }
                out._multi(1 / this._glScale);
                return ((this._getResolution() === res) ? out : this._pointToPointAtRes(out, res, out));
            }
            const centerPoint = this._prjToPointAtRes(this._getPrjCenter(), res, out),
                scale = this._getResolution() / res;
            const x = scale * (p.x - this.width / 2),
                y = scale * (p.y - this.height / 2);
            return centerPoint._add(x, -y);
        };
    }(),

    getContainerPointRay: function () {
        const cp = [0, 0, 0],
            coord0 = [0, 0, 0, 1],
            coord1 = [0, 0, 0, 1];
        return function (from: Vector3, to: Vector3, containerPoint: Point, near: number = 0, far: number = 1) {
            const w2 = this.width / 2 || 1,
                h2 = this.height / 2 || 1;
            const p = containerPoint;
            set(cp as Vector3, (p.x - w2) / w2, (h2 - p.y) / h2, 0);
            set(coord0 as Vector3, cp[0], cp[1], near);
            set(coord1 as Vector3, cp[0], cp[1], far);
            coord0[3] = coord1[3] = 1;
            applyMatrix(from, coord0 as Vector3, this.projViewMatrixInverse);
            applyMatrix(to, coord1 as Vector3, this.projViewMatrixInverse);
        }
    }(),

    /**
     * GL Matrices in maptalks (based on THREE):
     * //based on point at map's gl world space, by map.coordToPointAtRes(coord, map.getGLRes()))
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
    //@internal
    _calcMatrices: function () {
        // closure matrixes to reuse
        const m1 = createMat4();
        return function () {
            //必须先删除缓存的常用值，否则后面计算常用值时，会循环引用造成错误
            delete this._mapRes;
            delete this._mapGlRes;
            delete this._mapExtent2D;
            delete this._mapGlExtent2D;
            const size = this.getSize();
            const w = size.width || 1,
                h = size.height || 1;

            this._glScale = this.getGLScale();
            // const pitch = this.getPitch() * Math.PI / 180;

            // camera world matrix
            const worldMatrix = this._getCameraWorldMatrix();

            // get field of view
            const fov = this.getFov() * Math.PI / 180;
            const farZ = this._getCameraFar(fov, this.getPitch());
            this.cameraFar = farZ;
            this.cameraNear = this.cameraCenterDistance / 20;
            // camera projection matrix
            const projMatrix = this.projMatrix || createMat4();
            mat4.perspective(projMatrix, fov, w / h, this.cameraNear, farZ);
            this.projMatrix = projMatrix;

            // view matrix
            this.viewMatrix = mat4.invert(this.viewMatrix || createMat4(), worldMatrix);
            // matrix for world point => screen point
            this.projViewMatrix = mat4.multiply(this.projViewMatrix || createMat4(), projMatrix, this.viewMatrix);
            this._calcCascadeMatrixes();
            // matrix for screen point => world point
            this.projViewMatrixInverse = mat4.multiply(this.projViewMatrixInverse || createMat4(), worldMatrix, mat4.invert(m1, projMatrix));
            this.domCssMatrix = this._calcDomMatrix();
            this._frustumAltitude = this._calcFrustumAltitude();
            //缓存常用的值
            this._mapRes = this._getResolution();
            this._mapGlRes = this.getGLRes();
            this._mapExtent2D = this.get2DExtent();
            this._mapGlExtent2D = this.get2DExtentAtRes(this._mapGlRes);
        };
    }(),

    //@internal
    _getCameraFar(fov, pitch) {
        const cameraCenterDistance = this.cameraCenterDistance = distance(this.cameraPosition, this.cameraLookAt);
        const distanceInMeter = cameraCenterDistance / this._meterToGLPoint;
        pitch = Math.min(pitch, 85);
        pitch = pitch * Math.PI / 180;
        const cameraFarDistance = distanceInMeter + this.options['cameraFarUndergroundInMeter'] / Math.cos(pitch);
        return Math.max(cameraFarDistance * this._meterToGLPoint, cameraCenterDistance * 5);
    },

    //@internal
    _calcCascadeMatrixes: function () {
        // const cameraLookAt = [];
        // const cameraPosition = [];
        // const cameraUp = [];
        // const cameraForward = [];
        // const cameraWorldMatrix = createMat4();
        const projMatrix = createMat4();
        // const viewMatrix = createMat4();
        function cal(curPitch, pitch, out) {
            const w = this.width;
            const h = this.height;
            const fov = this.getFov() * Math.PI / 180;
            // const worldMatrix = this._getCameraWorldMatrix(
            //     pitch, this.getBearing(),
            //     cameraLookAt, cameraPosition, cameraUp, cameraForward, cameraWorldMatrix
            // );

            // get field of view
            let farZ = this._getCameraFar(fov, pitch);
            const cameraCenterDistance = this.cameraCenterDistance;
            farZ = cameraCenterDistance + (farZ - cameraCenterDistance) / Math.cos((90 - pitch) * Math.PI / 180) * Math.cos((90 - curPitch) * Math.PI / 180);

            // camera projection matrix
            mat4.perspective(projMatrix, fov, w / h, 0.1, farZ);
            // view matrix
            // mat4.invert(viewMatrix, worldMatrix);
            const viewMatrix = this.viewMatrix;
            // matrix for world point => screen point
            return mat4.multiply(out, projMatrix, viewMatrix);
        }
        return function () {

            const pitch = this.getPitch();

            const cascadePitch0 = this.options['cascadePitches'][0];
            const cascadePitch1 = this.options['cascadePitches'][1];
            const projViewMatrix0 = this.cascadeFrustumMatrix0 = this.cascadeFrustumMatrix0 || createMat4();
            const projViewMatrix1 = this.cascadeFrustumMatrix1 = this.cascadeFrustumMatrix1 || createMat4();
            if (pitch > cascadePitch0) {
                cal.call(this, pitch, cascadePitch0, projViewMatrix0);
            } else {
                mat4.copy(this.cascadeFrustumMatrix0, this.projViewMatrix);
            }
            if (pitch > cascadePitch1) {
                cal.call(this, pitch, cascadePitch1, projViewMatrix1);
            } else {
                mat4.copy(this.cascadeFrustumMatrix1, this.cascadeFrustumMatrix0);
            }
        };
    }(),

    //@internal
    _calcDomMatrix: function () {
        const m = createMat4(),
            m1 = createMat4(),
            minusY = [1, -1, 1],
            arr = [0, 0, 0];
        return function () {
            const width = this.width || 1;
            const height = this.height || 1;
            const cameraToCenterDistance = 0.5 / Math.tan(this._fov / 2) * height;
            mat4.scale(m, this.projMatrix, minusY as any);
            mat4.translate(m, m, set(arr as any, 0, 0, -cameraToCenterDistance));//[0, 0, cameraToCenterDistance]
            if (this._pitch) {
                mat4.rotateX(m, m, this._pitch);
            }
            if (this._angle) {
                mat4.rotateZ(m, m, this._angle);
            }
            mat4.identity(m1);
            mat4.scale(m1, m1, set(arr as any, width / 2, -height / 2, 1)); //[this.width / 2, -this.height / 2, 1]
            return mat4.multiply(this.domCssMatrix || createMat4(), m1, m);
        };
    }(),

    //@internal
    _getFovZ(zoom) {
        const scale = this.getGLScale(zoom);
        const ratio = this._getFovRatio();
        return scale * (this.height || 1) / 2 / ratio;
    },

    //@internal
    _getCameraWorldMatrix: function () {
        const q = {};
        return function () {
            const glRes = this.getGLRes();
            if (!this._meterToGLPoint) {
                this._meterToGLPoint = this.altitudeToPoint(100, glRes) / 100;
            }

            const center2D = this._prjToPointAtRes(this._prjCenter, glRes, TEMP_POINT);
            const altitude = this.getCenter().z;
            const centerAltitude = altitude !== undefined ? altitude : this.centerAltitude || 0;
            const centerPointZ = centerAltitude * this._meterToGLPoint;
            this.cameraLookAt = set(this.cameraLookAt || [0, 0, 0], center2D.x, center2D.y, centerPointZ);

            const pitch = this.getPitch() * RADIAN;
            const bearing = this.getBearing() * RADIAN;

            // const ratio = this._getFovRatio();
            // const z = scale * (size.height || 1) / 2 / ratio;
            // const cz = z * Math.cos(pitch);
            const cameraToCenterDistance = this._getFovZ();
            const cameraZenithDistance = this.cameraZenithDistance === undefined ? cameraToCenterDistance : this.cameraZenithDistance;
            const cameraToGroundDistance = cameraZenithDistance - centerPointZ;
            const cz = cameraToGroundDistance * Math.cos(pitch);
            // and [dist] away from map's center on XY plane to tilt the scene.
            const dist = Math.sin(pitch) * cameraToGroundDistance;
            // when map rotates, the camera's xy position is rotating with the given bearing and still keeps [dist] away from map's center
            const cx = center2D.x - dist * Math.sin(bearing);
            const cy = center2D.y - dist * Math.cos(bearing);
            this.cameraPosition = set(this.cameraPosition || [0, 0, 0], cx, cy, cz + centerPointZ);
            // console.log('0.camera', this.cameraPosition);
            // console.log('0.center', center2D, this.centerAltitude);
            // console.log('0.cameraToGroundDistance', cameraToGroundDistance);

            // const adjustedZoom = this._adjustZoomOnTerrain();
            // if (adjustedZoom >= 0) {
            //     this._zoom(adjustedZoom);
            //     return this._getCameraWorldMatrix();
            // }
            // this.cameraToCenterDistance = distance(this.cameraPosition, this.cameraLookAt);
            this.cameraToCenterDistance = cameraToCenterDistance;
            // when map rotates, camera's up axis is pointing to bearing from south direction of map
            // default [0,1,0] is the Y axis while the angle of inclination always equal 0
            // if you want to rotate the map after up an incline,please rotateZ like this:
            // let up = new vec3(0,1,0);
            // up.rotateZ(target,radians);
            // const up = this.cameraUp = set(this.cameraUp || [0, 0, 0], Math.sin(bearing) * d, Math.cos(bearing) * d, 0);
            this.cameraUp = this.cameraUp || [0, 0, 0];
            this.cameraUp = this._getCameraUp(this.cameraUp, this.cameraLookAt, this.cameraPosition, pitch, bearing);
            const m = this.cameraWorldMatrix = this.cameraWorldMatrix || createMat4();
            lookAt(m, this.cameraPosition, this.cameraLookAt, this.cameraUp);

            const cameraForward = this.cameraForward || [0, 0, 0];
            subtract(cameraForward, this.cameraLookAt, this.cameraPosition);
            // similar with unity's camera.transform.forward
            this.cameraForward = normalize(cameraForward, cameraForward);
            // math from THREE.js
            matrixToQuaternion(q, m);
            quaternionToMatrix(m, q);
            setPosition(m, this.cameraPosition);
            // mat4.scale(m, m, minusY);
            return m;
        };
    }(),

    _getCameraUp: function () {
        const q: [number, number, number] = [0, 0, 0];
        const c: [number, number, number] = [0, 0, 0];
        const axis: [number, number, number] = [0, 0, 0];
        return function (out, cameraPosition, cameraLookAt, pitch, bearing) {
            set(axis, 0, 0, 1);
            if (pitch === 0) {
                set(axis, Math.sin(bearing), Math.cos(bearing), 0);
            } else if (pitch === Math.PI) {
                set(axis, -Math.sin(bearing), -Math.cos(bearing), 0);
            }
            // https://stackoverflow.com/questions/3427379/effective-way-to-calculate-the-up-vector-for-glulookat-which-points-up-the-y-axi
            const lookAt = subtract(q, cameraPosition, cameraLookAt);
            normalize(lookAt, lookAt);
            const right = cross(c, lookAt, axis);
            return cross(out, right, lookAt);
        }
    }(),

    updateCenterAltitude() {
        this.getRenderer().setToRedraw();
        if (!this.centerAltitude && this._hasAltitudeLayer()) {
            this.centerAltitude = 0;
        }
        this._recenterOnTerrain();
    },

    //@internal
    _recenterOnTerrain() {
        if (this.centerAltitude === undefined || this._centerZ !== undefined) {
            return;
        }
        let queriedAltitude = this._queryTerrainByProjCoord(this._prjCenter);
        if (isNil(queriedAltitude) && this._hasAltitudeLayer()) {
            // remains previous center altitude if queried altitude is null
            queriedAltitude = this.centerAltitude;
        }
        const centerAltitude = queriedAltitude > 0 && queriedAltitude || 0;
        const pitch = this.getPitch() * RADIAN;
        const bearing = this.getBearing() * RADIAN;
        const altDist = (centerAltitude - this.centerAltitude) * this._meterToGLPoint;

        const cameraToCenterDistance = this._getFovZ();
        const cameraZenithDistance = this.cameraZenithDistance === undefined ? cameraToCenterDistance : this.cameraZenithDistance;

        const cameraToGroundDistance = cameraZenithDistance - this.centerAltitude * this._meterToGLPoint;
        const newCameraToGroundDistance = cameraToGroundDistance - altDist / Math.cos(pitch);


        const cameraPosition = this.cameraPosition;
        const dist = Math.sin(pitch) * newCameraToGroundDistance;
        const center2D = TEMP_POINT;
        center2D.x = cameraPosition[0] + dist * Math.sin(bearing);
        center2D.y = cameraPosition[1] + dist * Math.cos(bearing);
        // console.log(centerAltitude);
        // centerAltitude = (cameraPosition[2] - Math.cos(pitch) * newCameraToGroundDistance) / this._meterToGLPoint;
        // console.log(centerAltitude, (this.cameraToCenterDistance - newCameraToGroundDistance) / this._meterToGLPoint);
        // centerAltitude = (this.cameraToCenterDistance - newCameraToGroundDistance) / this._meterToGLPoint;

        const centerPointZ = centerAltitude * this._meterToGLPoint;
        this.cameraZenithDistance = (cameraPosition[2] - centerPointZ) / Math.cos(pitch) + centerPointZ;

        // const newCameraToGroundDistance = cameraToGroundDistance - altDist / Math.sin(pitch);
        // console.log('1.camera', this.cameraPosition);
        // console.log('1.center', center2D, centerAltitude);
        // console.log('1.newCameraToGroundDistance', newCameraToGroundDistance);
        // console.log(newCameraToGroundDistance, newCameraToGroundDistance1);

        // const newPrjCenter = this._pointToPrjAtRes(center2D, this.getGLRes(), TEMP_COORD);


        this.centerAltitude = centerAltitude;
        // this._setPrjCenter(newPrjCenter);
        const newCenter = this.pointAtResToCoordinate(center2D, this.getGLRes(), TEMP_COORD);
        this._eventSilence = true;
        this._suppressRecenter = true;
        this.setCenter(newCenter);
        delete this._suppressRecenter;
        delete this._eventSilence;
        if (isNil(queriedAltitude)) {
            delete this.centerAltitude;
        }
    },
    // _adjustZoomOnTerrain() {
    //     const z = this._eventCameraZ;
    //     const cameraDelta = 1E-10;
    //     if (z === undefined || Math.abs(z - this.cameraPosition[2]) < cameraDelta) {
    //         return -1;
    //     }
    //     if (!this._eventCenterAltitude) {
    //         delete this._eventCameraZ;
    //     }
    //     const centerZ = this.cameraLookAt[2];
    //     const cameraHeight = z - centerZ;
    //     const pitch = this.getPitch() * RADIAN;

    //     const newDistance = cameraHeight / Math.cos(pitch);
    //     const ratio = this._getFovRatio();
    //     const scale = newDistance * 2 * ratio / (this.height || 1);
    //     const glRes = this.getGLRes();
    //     const res = scale * glRes;
    //     const zoom = this.getZoomFromRes(res);
    //     return zoom;
    // },

    //@internal
    _queryTerrainByProjCoord(coord) {
        const layers = this._getLayers();
        for (let i = 0; i < layers.length; i++) {
            if (layers[i].queryTerrainByProjCoord) {
                return layers[i].queryTerrainByProjCoord(coord)[0];
            }
        }
        return 0;
    },

    //@internal
    _hasAltitudeLayer() {
        const layers = this._getLayers();
        for (let i = 0; i < layers.length; i++) {
            if (layers[i].getTerrainLayer && layers[i].getTerrainLayer()) {
                return true;
            }
        }
        return false;
    },

    //@internal
    _queryTerrainInfo(containerPoint) {
        if (containerPoint) {
            const terrainLayer = this._findTerrainLayer();
            if (!terrainLayer) {
                return null;
            }
            const coordinate = terrainLayer.queryTerrainAtPoint(containerPoint);
            if (coordinate) {
                return {
                    coordinate,
                    altitude: coordinate.z
                };
            }
        }
        return null;
    },

    //@internal
    _query3DTilesInfo(containerPoint) {
        const layers = this._getLayers() || [];
        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            if (containerPoint && layer && layer.query3DTilesAtPoint) {
                const coordinate = layer.query3DTilesAtPoint(containerPoint);
                if (coordinate) {
                    return {
                        coordinate,
                        altitude: coordinate.z
                    };
                } else {
                    break;
                }
            }
        }
        return null;
    },

    //@internal
    queryPrjCoordAtContainerPoint(p) {
        let queryCoord = this._query3DTilesInfo(p)
        if (!queryCoord) {
            queryCoord = this._queryTerrainInfo(p);
        }
        if (queryCoord) {
            const prjCoord = this.getProjection().project(queryCoord.coordinate);
            prjCoord.z = queryCoord.altitude;
            return prjCoord;
        }
        if (this._isContainerPointOutOfMap(p)) {
            p = new Point(this.width / 2, this.height / 2);
        }
        return this._containerPointToPrj(p);
    },

    //@internal
    _getFovRatio() {
        const fov = this.getFov();
        return Math.tan(fov / 2 * RADIAN);
    },

    //@internal
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

function calculateBearing(start, end) {
    const lon1 = toRadian(start[0]);
    const lon2 = toRadian(end[0]);
    const lat1 = toRadian(start[1]);
    const lat2 = toRadian(end[1]);
    const a = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const b =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    return toDegree(Math.atan2(a, b));
}
