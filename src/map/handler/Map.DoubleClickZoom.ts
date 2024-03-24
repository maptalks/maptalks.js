import Handler from '../../handler/Handler';
import Map from '../Map';

class MapDoubleClickZoomHandler extends Handler {
    addHooks() {
        if (!this.target) {
            return;
        }
        this.target.on('_dblclick', this._onDoubleClick, this);
    }

    removeHooks() {
        if (!this.target) {
            return;
        }
        this.target.off('_dblclick', this._onDoubleClick, this);
    }

    _onDoubleClick(param) {
        const map = this.target;
        if (map.options['doubleClickZoom']) {
            const oldZoom = map.getZoom(),
                zoom = param['domEvent']['shiftKey'] ? Math.ceil(oldZoom) - 1 : Math.floor(oldZoom) + 1;
            map._zoomAnimation(zoom, param['containerPoint']);
        }

    }
}

Map.mergeOptions({
    'doubleClickZoom': true
});

Map.addOnLoadHook('addHandler', 'doubleClickZoom', MapDoubleClickZoomHandler);

export default MapDoubleClickZoomHandler;
