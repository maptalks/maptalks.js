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
        if (!event.touches || event.touches.length !== 2 || map.isZooming() || !map.options['zoomable']) {
            return;
        }
        const container = map.getContainer();
        const p1 = getEventContainerPoint(event.touches[0], container),
            p2 = getEventContainerPoint(event.touches[1], container);

        this._startDist = p1.distanceTo(p2);
        this._startZoom = map.getZoom();

        const size = map.getSize();
        this._Origin = new Point(size['width'] / 2, size['height'] / 2);
        addDomEvent(document, 'touchmove', this._onTouchMove, this);
        addDomEvent(document, 'touchend', this._onTouchEnd, this);
        preventDefault(event);

        map.onZoomStart(null, this._Origin);
        /**
          * touchzoomstart event
          * @event Map#touchzoomstart
          * @type {Object}
          * @property {String} type                    - touchzoomstart
          * @property {Map} target                     - the map fires event
          * @property {Number} from                    - zoom level zooming from
          */
        map._fireEvent('touchzoomstart', { 'from' : this._startZoom });
    }

    _onTouchMove(event) {
        const map = this.target;
        if (!event.touches || event.touches.length !== 2 || !map.isZooming()) {
            return;
        }
        const container = map.getContainer(),
            p1 = getEventContainerPoint(event.touches[0], container),
            p2 = getEventContainerPoint(event.touches[1], container),
            scale = p1.distanceTo(p2) / this._startDist;

        this._scale = scale;
        const res = map._getResolution(this._startZoom) / scale;
        const zoom = map.getZoomFromRes(res);
        map.onZooming(zoom, this._Origin);
        /**
          * touchzooming event
          * @event Map#touchzooming
          * @type {Object}
          * @property {String} type                    - touchzooming
          * @property {Map} target                     - the map fires event
          */
        map._fireEvent('touchzooming');
    }

    _onTouchEnd() {
        const map = this.target;
        if (!map._zooming) {
            map._zooming = false;
            return;
        }
        map._zooming = false;

        off(document, 'touchmove', this._onTouchMove, this);
        off(document, 'touchend', this._onTouchEnd, this);

        const scale = this._scale;
        const res = map._getResolution(this._startZoom) / scale;
        const zoom = map.getZoomFromRes(res);

        map.onZoomEnd(zoom, this._Origin);
        /**
         * touchzoomend event
         * @event Map#touchzoomend
         * @type {Object}
         * @property {String} type                    - touchzoomend
         * @property {Map} target            - the map fires event
         */
        map._fireEvent('touchzoomend');
    }
}

Map.mergeOptions({
    'touchZoom': true
});

Map.addOnLoadHook('addHandler', 'touchZoom', MapTouchZoomHandler);

export default MapTouchZoomHandler;
