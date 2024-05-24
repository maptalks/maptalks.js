import { isNil } from '../core/util';
import Point from '../geo/Point';
import Map from './Map';


declare module "./Map" {
    interface Map {

        _zoom(nextZoom: number, origin?: Point);
        _zoomAnimation(nextZoom: number, origin?: Point, startScale?: number);
        _checkZoomOrigin(origin?: Point): Point;
        _startZoomAnim(nextZoom: number, origin?: Point, startScale?: number);
        onZoomStart(nextZoom: number, origin?: Point);
        onZooming(nextZoom: number, origin?: Point, startScale?: number);
        onZoomEnd(nextZoom: number, origin?: Point);
        _zoomTo(nextZoom: number, origin?: Point);
        _checkZoom(nextZoom: number): number;

    }
}


Map.include(/** @lends Map.prototype */{

    _zoom(nextZoom: number, origin?: Point) {
        if (!this.options['zoomable'] || this.isZooming()) { return; }
        origin = this._checkZoomOrigin(origin);
        nextZoom = this._checkZoom(nextZoom);
        this.onZoomStart(nextZoom, origin);
        this._frameZoom = this.getZoom();
        this.onZoomEnd(nextZoom, origin);
    },

    _zoomAnimation(nextZoom: number, origin?: Point, startScale?: number) {
        if (!this.options['zoomable'] || this.isZooming()) { return; }

        nextZoom = this._checkZoom(nextZoom);
        if (this.getZoom() === nextZoom) {
            return;
        }
        origin = this._checkZoomOrigin(origin);
        this._startZoomAnim(nextZoom, origin, startScale);
    },

    _checkZoomOrigin(origin?: Point) {
        if (!origin || this.options['zoomInCenter']) {
            origin = new Point(this.width / 2, this.height / 2);
        }
        if (this.options['zoomOrigin']) {
            origin = new Point(this.options['zoomOrigin']);
        }
        return origin;
    },

    _startZoomAnim(nextZoom: number, origin?: Point, startScale?: number) {
        if (isNil(startScale)) {
            startScale = 1;
        }
        const endScale = this._getResolution(this._startZoomVal) / this._getResolution(nextZoom);
        const duration = this.options['zoomAnimationDuration'] * Math.abs(endScale - startScale) / Math.abs(endScale - 1);
        this._frameZoom = this._startZoomVal;
        this._animateTo({
            'zoom': nextZoom,
            'around': origin
        }, {
            'continueOnViewChanged': true,
            'duration': duration
        });
    },

    onZoomStart(nextZoom: number, origin?: Point) {
        if (!this.options['zoomable'] || this.isZooming()) { return; }
        if (this._mapAnimPlayer) {
            this._stopAnim(this._mapAnimPlayer);
        }
        delete this.cameraZenithDistance;
        this._zooming = true;
        this._startZoomVal = this.getZoom();
        this._startZoomCoord = origin && this._containerPointToPrj(origin);
        /**
          * zoomstart event
          * @event Map#zoomstart
          * @type {Object}
          * @property {String} type                    - zoomstart
          * @property {Map} target                     - the map fires event
          * @property {Number} from                    - zoom level zooming from
          * @property {Number} to                      - zoom level zooming to
          */
        this._fireEvent('zoomstart', { 'from': this._startZoomVal, 'to': nextZoom });
    },

    onZooming(nextZoom: number, origin?: Point, startScale?: number) {
        if (!this.options['zoomable']) { return; }
        const frameZoom = this._frameZoom;
        if (frameZoom === nextZoom) {
            return;
        }
        if (isNil(startScale)) {
            startScale = 1;
        }
        this._zoomTo(nextZoom, origin);
        const res = this.getResolution(nextZoom),
            fromRes = this.getResolution(this._startZoomVal),
            scale = fromRes / res / startScale,
            startPoint = this._startZoomCoord && this.prjToContainerPoint(this._startZoomCoord, this._startZoomVal);
        const offset = this.getViewPoint();
        if (!this.isRotating() && startPoint && !startPoint.equals(origin) && scale !== 1) {
            const pitch = this.getPitch();
            // coordinate at origin changed, usually by map.setCenter
            // add origin offset
            const originOffset = startPoint._sub(origin)._multi(1 / (1 - scale));
            if (pitch) {
                //FIXME Math.cos(pitch * Math.PI / 180) is just a magic num, works when tilting but may have problem when rotating
                originOffset.y /= Math.cos(pitch * Math.PI / 180);
            }
            origin = origin.add(originOffset) as Point;
        }
        const originX = origin && origin.x || this.width / 2;
        const originY = origin && origin.y || this.height / 2;
        const matrix = {
            'view': [scale, 0, 0, scale, (originX - offset.x) * (1 - scale), (originY - offset.y) * (1 - scale)]
        };
        const dpr = this.getDevicePixelRatio();
        matrix['container'] = [scale, 0, 0, scale, originX * dpr * (1 - scale), originY * dpr * (1 - scale)];
        /**
          * zooming event
          * @event Map#zooming
          * @type {Object}
          * @property {String} type                    - zooming
          * @property {Map} target                     - the map fires event
          * @property {Number} from                    - zoom level zooming from
          * @property {Number} to                      - zoom level zooming to
          */
        this._fireEvent('zooming', { 'from': this._startZoomVal, 'to': nextZoom, 'origin': new Point(originX, originY), 'matrix': matrix });
        this._frameZoom = nextZoom;
    },

    onZoomEnd(nextZoom: number, origin?: Point) {
        if (!this.options['zoomable']) { return; }
        const startZoomVal = this._startZoomVal;
        this._zoomTo(nextZoom, origin);
        this._zooming = false;
        this._getRenderer().onZoomEnd();
        if (!this._suppressRecenter) {
            this._recenterOnTerrain();
        }
        /**
          * zoomend event
          * @event Map#zoomend
          * @type {Object}
          * @property {String} type                    - zoomend
          * @property {Map} target                     - the map fires event
          * @property {Number} from                    - zoom level zooming from
          * @property {Number} to                      - zoom level zooming to
          */
        this._fireEvent('zoomend', { 'from': startZoomVal, 'to': nextZoom });
        if (!this._verifyExtent(this._getPrjCenter())) {
            this._panTo(this._prjMaxExtent.getCenter());
        }
    },

    _zoomTo(nextZoom: number, origin?: Point) {
        this._zoomLevel = nextZoom;
        this._calcMatrices();
        if (origin && this._startZoomCoord) {
            const p = this._containerPointToPoint(origin);
            const offset = p._sub(this._prjToPoint(this._getPrjCenter()));
            this._setPrjCoordAtOffsetToCenter(this._startZoomCoord, offset);
        }
    },

    _checkZoom(nextZoom: number) {
        const maxZoom = this.getMaxZoom(),
            minZoom = this.getMinZoom();
        if (nextZoom < minZoom) {
            nextZoom = minZoom;
        }
        if (nextZoom > maxZoom) {
            nextZoom = maxZoom;
        }
        return nextZoom;
    }
});
