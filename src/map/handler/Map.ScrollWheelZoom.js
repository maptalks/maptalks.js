import { isNil } from 'core/util';
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
        preventDefault(evt);
        stopPropagation(evt);
        if (this._zooming) {
            this._requesting++;
            return false;
        }
        this._requesting = 0;
        const map = this.target;
        const container = map._containerDOM;
        this._zooming = true;
        let levelValue = (evt.wheelDelta ? evt.wheelDelta : evt.detail) > 0 ? 1 : -1;
        if (evt.detail) {
            levelValue *= -1;
        }
        let nextZoom = map.getZoom() + levelValue;
        nextZoom = map._checkZoom(levelValue > 0 ? Math.ceil(nextZoom) : Math.floor(nextZoom));
        const origin = map._checkZoomOrigin(getEventContainerPoint(evt, container));
        if (!map.isZooming()) {
            map.onZoomStart(null, origin);
            this._origin = origin;
            this._delta = levelValue;
            this._startTime = Date.now();
        }
        const duration = 180;
        map.animateTo({
            'zoom' : nextZoom - this._delta * 1 / 2,
            'around' : this._origin
        }, {
            'easing' : 'linear',
            'duration' : duration,
            'wheelZoom' : true,
            'onFinish' : () => {
                if (this._requesting < 3 || this._requesting >= 10) {
                    map.animateTo({
                        'zoom' : nextZoom,
                        'around' : this._origin
                    }, {
                        'duration' : duration,
                        'onFinish' : () => {
                            delete this._zooming;
                        }
                    });
                    delete this._origin;
                    delete this._delta;
                    delete this._timeout;
                    this._requesting = 0;
                } else if (!isNil(this._requesting)) {
                    delete this._zooming;
                    this._onWheelScroll(evt);
                }
            }
        });
        return false;
    }
}

Map.mergeOptions({
    'scrollWheelZoom': true
});

Map.addOnLoadHook('addHandler', 'scrollWheelZoom', MapScrollWheelZoomHandler);

export default MapScrollWheelZoomHandler;
