import { cancelAnimFrame } from 'core/util';
import { addDomEvent, removeDomEvent, getEventContainerPoint, preventDefault, stopPropagation } from 'core/util/dom';
import Handler from 'core/Handler';
import Map from '../Map';

Map.mergeOptions({
    'scrollWheelZoom': true
});

Map.ScrollWheelZoom = Handler.extend({
    addHooks: function () {
        addDomEvent(this.target._containerDOM, 'mousewheel', this._onWheelScroll, this);
    },

    removeHooks: function () {
        removeDomEvent(this.target._containerDOM, 'mousewheel', this._onWheelScroll);
    },

    _onWheelScroll: function (evt) {
        var map = this.target;
        var container = map._containerDOM;
        preventDefault(evt);
        stopPropagation(evt);
        if (map._zooming) { return false; }
        var levelValue = (evt.wheelDelta ? evt.wheelDelta : evt.detail) > 0 ? 1 : -1;
        if (evt.detail) {
            levelValue *= -1;
        }
        var mouseOffset = getEventContainerPoint(evt, container);
        if (this._scrollZoomFrame) {
            cancelAnimFrame(this._scrollZoomFrame);
        }
        this._scrollZoomFrame = maptalks.Util.requestAnimFrame(function () {
            map._zoomAnimation(map.getZoom() + levelValue, mouseOffset);
        });

        return false;
    }
});

Map.addInitHook('addHandler', 'scrollWheelZoom', Map.ScrollWheelZoom);
