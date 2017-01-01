import Handler from 'core/Handler';
import Map from '../Map';

class MapDoubleClickZoomHandler extends Handler {
    addHooks() {
        this.target.on('_dblclick', this._onDoubleClick, this);
    }

    removeHooks() {
        this.target.off('_dblclick', this._onDoubleClick, this);
    }

    _onDoubleClick(param) {
        var map = this.target;
        if (map.options['doubleClickZoom']) {
            var oldZoom = map.getZoom(),
                zoom = param['domEvent']['shiftKey'] ? Math.ceil(oldZoom) - 1 : Math.floor(oldZoom) + 1;
            map._zoomAnimation(zoom, param['containerPoint']);
        }

    }
}

Map.mergeOptions({
    'doubleClickZoom': true
});

Map.addInitHook('addHandler', 'doubleClickZoom', MapDoubleClickZoomHandler);

export default MapDoubleClickZoomHandler;
