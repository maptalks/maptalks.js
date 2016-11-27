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
        var _containerDOM = map._containerDOM;
        maptalks.DomUtil.preventDefault(evt);
        maptalks.DomUtil.stopPropagation(evt);
        if (map._zooming) { return false; }
        var _levelValue = 0;
        _levelValue += (evt.wheelDelta ? evt.wheelDelta : evt.detail) > 0 ? 1 : -1;
        if (evt.detail) {
            _levelValue *= -1;
        }
        var mouseOffset = maptalks.DomUtil.getEventContainerPoint(evt, _containerDOM);
        if (this._wheelExecutor) {
            clearTimeout(this._wheelExecutor);
        }
        this._wheelExecutor = setTimeout(function () {
            map._zoomAnimation(map.getZoom() + _levelValue, mouseOffset);
        }, 40);

        return false;
    }
    /*_onWheelScroll: function (evt) {
        var map = this.target;
        var containerDOM = map._containerDOM;
        maptalks.DomUtil.preventDefault(evt);
        maptalks.DomUtil.stopPropagation(evt);

        if (map._zooming || this._scaling) {return;}
        if (this._wheelExecutor) {
            clearTimeout(this._wheelExecutor);
        }
        this._scaling = true;
        var level = 0;
        level += (evt.wheelDelta?evt.wheelDelta:evt.detail) > 0 ? 1 : -1;
        if (evt.detail) {
            level *= -1;
        }
        var zoomPoint = maptalks.DomUtil.getEventContainerPoint(evt, containerDOM);
        if (maptalks.Util.isNil(this._targetZoom)) {
            this._targetZoom = map.getZoom();
        }
        var preZoom = this._targetZoom;
        this._targetZoom += level;
        this._targetZoom = map._checkZoomLevel(this._targetZoom);
        var scale = map._getResolution(map.getZoom())/map._getResolution(this._targetZoom);
        var preScale = map._getResolution(map.getZoom())/map._getResolution(preZoom);
        var render = map._getRenderer();
        var me = this;
        render.animateZoom(preScale, scale, zoomPoint, 100, function() {
            me._scaling = false;
            map._zoom(me._targetZoom, zoomPoint);
            me._wheelExecutor = setTimeout(function () {
                map.onZoomEnd(me._targetZoom);
                delete me._targetZoom;
            },100);
        });
        return false;
    }*/
});

maptalks.Map.addInitHook('addHandler', 'scrollWheelZoom', maptalks.Map.ScrollWheelZoom);
