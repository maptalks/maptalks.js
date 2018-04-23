import { isNil } from '../../core/util';
import { addDomEvent, removeDomEvent, getEventContainerPoint, preventDefault, stopPropagation } from '../../core/util/dom';
import Handler from '../../handler/Handler';
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
        if (map._ignoreEvent(evt) || !map.options['zoomable']) {
            return false;
        }
        preventDefault(evt);
        stopPropagation(evt);
        if (this._zooming) {
            this._requesting++;
            return false;
        }
        this._requesting = 0;
        const container = map._containerDOM;
        let levelValue = (evt.wheelDelta ? evt.wheelDelta : evt.detail) > 0 ? 1 : -1;
        if (evt.detail) {
            levelValue *= -1;
        }
        const zoom = map.getZoom();
        let nextZoom = zoom + levelValue;
        nextZoom = map._checkZoom(levelValue > 0 ? Math.ceil(nextZoom) : Math.floor(nextZoom));
        if (nextZoom === zoom) {
            return false;
        }
        this._zooming = true;
        const origin = map._checkZoomOrigin(getEventContainerPoint(evt, container));
        if (!this._delta) {
            map.onZoomStart(null, origin);
            this._origin = origin;
            this._delta = levelValue;
            this._startZoom = map.getZoom();
        }
        const duration = 90;
        map.animateTo({
            'zoom' : nextZoom - this._delta * 1 / 2,
            'around' : this._origin
        }, {
            'continueOnViewChanged' : true,
            'easing' : 'linear',
            'duration' : duration,
            'wheelZoom' : true
        }, frame => {
            if (frame.state.playState !== 'finished') {
                return;
            }
            if (this._requesting < 1 || Math.abs(nextZoom - this._startZoom) > 2 ||
                //finish zooming if target zoom hits min/max
                nextZoom === map.getMaxZoom() || nextZoom === map.getMinZoom()) {

                map.animateTo({
                    'zoom' : nextZoom,
                    'around' : this._origin
                }, {
                    'continueOnViewChanged' : true,
                    'duration' : 100
                }, frame => {
                    if (frame.state.playState === 'finished') {
                        setTimeout(() => {
                            delete this._zooming;
                            delete this._requesting;
                        }, 200);
                    }
                });
                delete this._startZoom;
                delete this._origin;
                delete this._delta;
                this._requesting = 0;
            } else if (!isNil(this._requesting)) {
                delete this._zooming;
                this._onWheelScroll(evt);
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
