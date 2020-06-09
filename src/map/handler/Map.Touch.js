import { off, addDomEvent, removeDomEvent, getEventContainerPoint, preventDefault } from '../../core/util/dom';
import Handler from '../../handler/Handler';
import Point from '../../geo/Point';
import Map from '../Map';

//handler to zoom map by pinching
class MapTouchZoomHandler extends Handler {
    addHooks() {
        addDomEvent(this.target.getContainer(), 'touchstart', this._onTouchStart, this);
    }

    removeHooks() {
        removeDomEvent(this.target.getContainer(), 'touchstart', this._onTouchStart);
    }

    _onTouchStart(event) {
        const map = this.target;
        if (!event.touches || event.touches.length < 2) {
            return;
        }
        const container = map.getContainer();
        const p1 = getEventContainerPoint(event.touches[0], container),
            p2 = getEventContainerPoint(event.touches[1], container);

        this.preY = p1.y;
        this._startP1 = p1;
        this._startP2 = p2;
        this._startDist = p1.distanceTo(p2);
        this._startVector = p1.sub(p2);
        this._startZoom = map.getZoom();
        this._startBearing = map.getBearing();

        off(document, 'touchmove', this._onTouchMove, this);
        off(document, 'touchend', this._onTouchEnd, this);
        addDomEvent(document, 'touchmove', this._onTouchMove, this);
        addDomEvent(document, 'touchend', this._onTouchEnd, this);
        preventDefault(event);

        /**
          * touchactstart event
          * @event Map#touchactstart
          * @type {Object}
          * @property {String} type                    - touchactstart
          * @property {Map} target                     - the map fires event
          */
        map._fireEvent('touchactstart');
    }

    _onTouchMove(event) {
        const map = this.target;
        if (!event.touches || event.touches.length < 2) {
            return;
        }
        const container = map.getContainer(),
            p1 = getEventContainerPoint(event.touches[0], container),
            p2 = getEventContainerPoint(event.touches[1], container),
            d1 = p1.sub(this._startP1),
            d2 = p2.sub(this._startP2),
            vector = p1.sub(p2),
            scale = p1.distanceTo(p2) / this._startDist,
            bearing = vector.angleWith(this._startVector) * 180 / Math.PI,
            preY = this.preY || p1.y,
            pitch = (preY - p1.y) * 0.4;
        // console.log(preY, p1.y);
        this.preY = p1.y;
        const param = {
            'domEvent': event,
            'mousePos': [p1, p2]
        };
        if (!this.mode) {
            if (map.options['touchRotate'] && Math.abs(bearing) > 8) {
                this.mode = map.options['touchZoomRotate'] ? 'rotate_zoom' : 'rotate';
            } else if (map.options['touchPitch'] && d1.y * d2.y > 0 && Math.abs(d1.y) > 10 && Math.abs(d2.y) > 10) {
                this.mode = 'pitch';
            } else if (map.options['zoomable'] && map.options['touchZoom'] && Math.abs(1 - scale) > 0.15) {
                this.mode = map.options['touchZoomRotate'] && map.options['touchRotate'] ? 'rotate_zoom' : 'zoom';
            }
            this._startTouching(param);
        }
        if (this.mode === 'zoom' || this.mode === 'rotate_zoom') {
            this._scale = scale;
            const res = map._getResolution(this._startZoom) / scale;
            const zoom = map.getZoomFromRes(res);
            map.onZooming(zoom, this._Origin);
        }
        if (this.mode === 'rotate' || this.mode === 'rotate_zoom') {
            map.setBearing(this._startBearing + bearing);
            map.onDragRotating(param);
        } else if (this.mode === 'pitch') {
            map.setPitch(map.getPitch() + pitch);
            map.onDragRotating(param);
        }
        /**
          * touchacting event
          * @event Map#touchacting
          * @type {Object}
          * @property {String} type                    - touchacting
          * @property {Map} target                     - the map fires event
          */
        map._fireEvent('touchactinging');
    }

    _startTouching(param) {
        const map = this.target;
        if (this.mode === 'zoom' || this.mode === 'rotate_zoom') {
            const size = map.getSize();
            this._Origin = new Point(size['width'] / 2, size['height'] / 2);
            map.onZoomStart(null, this._Origin);
        }
        if (this.mode === 'rotate' || this.mode === 'pitch' || this.mode === 'rotate_zoom') {
            map.onDragRotateStart(param);
        }
    }

    _onTouchEnd(event) {
        delete this.preY;
        const map = this.target;

        off(document, 'touchmove', this._onTouchMove, this);
        off(document, 'touchend', this._onTouchEnd, this);

        if (this.mode === 'zoom' || this.mode === 'rotate_zoom') {
            const scale = this._scale;
            const res = map._getResolution(this._startZoom) / scale;
            const zoom = map.getZoomFromRes(res);
            map.onZoomEnd(zoom, this._Origin);
        }
        if (this.mode === 'pitch' || this.mode === 'rotate' || this.mode === 'rotate_zoom') {
            map.onDragRotateEnd({
                'domEvent': event
            });
        }
        delete this.mode;
        /**
          * touchactend event
          * @event Map#touchactend
          * @type {Object}
          * @property {String} type                    - touchactend
          * @property {Map} target                     - the map fires event
          */
        map._fireEvent('touchactend');
    }
}

Map.mergeOptions({
    'touchGesture': true,
    'touchZoom': true,
    'touchPitch': true,
    'touchRotate': true,
    'touchZoomRotate': false
});

Map.addOnLoadHook('addHandler', 'touchGesture', MapTouchZoomHandler);

export default MapTouchZoomHandler;
