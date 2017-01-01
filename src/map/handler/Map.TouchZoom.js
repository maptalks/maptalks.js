import { off, addDomEvent, removeDomEvent, getEventContainerPoint, preventDefault } from 'core/util/dom';
import Handler from 'core/Handler';
import Point from 'geo/Point';
import Map from '../Map';

//handler to zoom map by pinching
class MapTouchZoomHandler extends Handler {
    addHooks() {
        addDomEvent(this.target._containerDOM, 'touchstart', this._onTouchStart, this);
    }

    removeHooks() {
        removeDomEvent(this.target._containerDOM, 'touchstart', this._onTouchStart);
    }

    _onTouchStart(event) {
        var map = this.target;
        if (!event.touches || event.touches.length !== 2 || map._zooming) {
            return;
        }
        var container = map._containerDOM;
        var p1 = getEventContainerPoint(event.touches[0], container),
            p2 = getEventContainerPoint(event.touches[1], container);

        this._startDist = p1.distanceTo(p2);
        this._startZoom = map.getZoom();

        var size = map.getSize();
        this._Origin = new Point(size['width'] / 2, size['height'] / 2);
        addDomEvent(document, 'touchmove', this._onTouchMove, this);
        addDomEvent(document, 'touchend', this._onTouchEnd, this);
        preventDefault(event);

        map.onZoomStart.apply(map);
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
        var map = this.target;
        if (!event.touches || event.touches.length !== 2 || !map._zooming) {
            return;
        }
        var container = map._containerDOM,
            p1 = getEventContainerPoint(event.touches[0], container),
            p2 = getEventContainerPoint(event.touches[1], container),
            scale = p1.distanceTo(p2) / this._startDist;

        this._scale = scale;
        var res = map._getResolution(this._startZoom) / scale;
        var zoom = map.getZoomFromRes(res);
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
        var map = this.target;
        if (!map._zooming) {
            map._zooming = false;
            return;
        }
        map._zooming = false;

        off(document, 'touchmove', this._onTouchMove, this);
        off(document, 'touchend', this._onTouchEnd, this);

        var scale = this._scale;
        var zoom = map.getZoomForScale(scale);
        if (zoom === -1) {
            zoom = map.getZoom();
        }

        if (zoom !== map.getZoom()) {
            map._zoomAnimation(zoom, this._Origin, this._scale);
        } else {
            map.onZoomEnd(zoom);
        }
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
