Z.Map.mergeOptions({
    /**
     * @cfg {Boolean} [doubleClickZoom="true"] 双击放大地图
     * @member maptalks.Map
     */
    'doubleClickZoom': true
});

Z.Map.DoubleClickZoom = Z.Handler.extend({
    addHooks: function () {
        this.target.on('_dblclick', this._onDoubleClick, this);
    },

    removeHooks: function () {
        this.target.off('_dblclick', this._onDoubleClick, this);
    },

    _onDoubleClick: function (param) {
        var map = this.target;
        if(map.options['doubleClickZoom']) {
            var oldZoom = map.getZoom(),
                zoom = param['domEvent']['shiftKey'] ? Math.ceil(oldZoom) - 1 : Math.floor(oldZoom) + 1;
            map._zoomAnimation(zoom, param['containerPoint']);
        }

    }
});

Z.Map.addInitHook('addHandler', 'doubleClickZoom', Z.Map.DoubleClickZoom);
