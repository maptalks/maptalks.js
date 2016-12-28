maptalks.Map.mergeOptions({
    'scrollWheelZoom': true
});

maptalks.Map.ScrollWheelZoom = maptalks.Handler.extend({
    addHooks: function () {
        maptalks.DomUtil.addDomEvent(this.target._containerDOM, 'mousewheel', this._onWheelScroll, this);
    },

    removeHooks: function () {
        maptalks.DomUtil.removeDomEvent(this.target._containerDOM, 'mousewheel', this._onWheelScroll);
    },

    _onWheelScroll: function (evt) {
        var map = this.target;
        var container = map._containerDOM;
        maptalks.DomUtil.preventDefault(evt);
        maptalks.DomUtil.stopPropagation(evt);
        if (map._zooming) { return false; }
        var levelValue = (evt.wheelDelta ? evt.wheelDelta : evt.detail) > 0 ? 1 : -1;
        if (evt.detail) {
            levelValue *= -1;
        }
        var mouseOffset = maptalks.DomUtil.getEventContainerPoint(evt, container);
        if (this._scrollZoomFrame) {
            maptalks.Util.cancelAnimFrame(this._scrollZoomFrame);
        }
        this._scrollZoomFrame = maptalks.Util.requestAnimFrame(function () {
            map._zoomAnimation(map.getZoom() + levelValue, mouseOffset);
        });

        return false;
    }
});

maptalks.Map.addInitHook('addHandler', 'scrollWheelZoom', maptalks.Map.ScrollWheelZoom);
