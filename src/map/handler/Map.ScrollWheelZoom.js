import { requestAnimFrame, cancelAnimFrame } from 'core/util';
import { addDomEvent, removeDomEvent, getEventContainerPoint, preventDefault, stopPropagation } from 'core/util/dom';
import Handler from 'handler/Handler';
import Map from '../Map';

class MapScrollWheelZoomHandler extends Handler {
    addHooks() {
        addDomEvent(this.target._containerDOM, 'mousewheel', this._onWheelScroll, this);
    }

    removeHooks() {
        removeDomEvent(this.target._containerDOM, 'mousewheel', this._onWheelScroll);
    }

    _onWheelScroll(evt) {
        const map = this.target;
        const container = map._containerDOM;
        preventDefault(evt);
        stopPropagation(evt);
        if (map.isZooming()) { return false; }
        let levelValue = (evt.wheelDelta ? evt.wheelDelta : evt.detail) > 0 ? 1 : -1;
        if (evt.detail) {
            levelValue *= -1;
        }
        const mouseOffset = getEventContainerPoint(evt, container);
        if (this._scrollZoomFrame) {
            cancelAnimFrame(this._scrollZoomFrame);
        }
        this._scrollZoomFrame = requestAnimFrame(function () {
            map._zoomAnimation(map.getZoom() + levelValue, mouseOffset);
        });

        return false;
    }
}

Map.mergeOptions({
    'scrollWheelZoom': true
});

Map.addOnLoadHook('addHandler', 'scrollWheelZoom', MapScrollWheelZoomHandler);

export default MapScrollWheelZoomHandler;
