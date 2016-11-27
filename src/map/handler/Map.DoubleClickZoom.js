maptalks.Map.mergeOptions({
    'doubleClickZoom': true
});

maptalks.Map.DoubleClickZoom = maptalks.Handler.extend({
    addHooks: function () {
        this.target.on('_dblclick', this._onDoubleClick, this);
    },

    removeHooks: function () {
        this.target.off('_dblclick', this._onDoubleClick, this);
    },

    _onDoubleClick: function (param) {
        var map = this.target;
        if (map.options['doubleClickZoom']) {
            var oldZoom = map.getZoom(),
                zoom = param['domEvent']['shiftKey'] ? Math.ceil(oldZoom) - 1 : Math.floor(oldZoom) + 1;
            map._zoomAnimation(zoom, param['containerPoint']);
        }

    }
});

maptalks.Map.addInitHook('addHandler', 'doubleClickZoom', maptalks.Map.DoubleClickZoom);
