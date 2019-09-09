import Handler from '../../handler/Handler';
import Map from '../Map';
import DrawTool from '../tool/DrawTool';
import Extent from '../../geo/Extent';

class MapBoxZoomHander extends Handler {
    constructor(target) {
        super(target);
        this.drawTool = new DrawTool({
            'mode'   : 'boxZoom',
            'ignoreMouseleave' : false
        });
    }

    addHooks() {
        this.target.on('_mousedown', this._onMouseDown, this);
    }

    removeHooks() {
        this.target.off('_mousedown', this._onMouseDown, this);
        if (this.drawTool.isEnabled()) {
            this.drawTool.remove();
        }
    }

    _onMouseDown(param) {
        if (!this.target.options['boxZoom']) {
            return;
        }
        if (param.domEvent.shiftKey) {
            this.drawTool.setSymbol(this.target.options['boxZoomSymbol'])
                .on('drawend', this._boxZoom, this)
                .addTo(this.target);
        }
    }

    _boxZoom(param) {
        const map = this.target;
        this.drawTool.remove();
        const geometry = param.geometry,
            center = geometry.getCenter(),
            symbol = geometry.getSymbol(),
            w = symbol.markerWidth,
            h = symbol.markerHeight;

        const extent = new Extent(center, map.locateByPoint(center, w, h), map.getProjection());
        const zoom = map.getFitZoom(extent);
        map._animateTo({
            center : extent.getCenter(),
            zoom : zoom
        });
    }
}

Map.mergeOptions({
    'boxZoom' : true,
    'boxZoomSymbol': {
        'markerType' : 'rectangle',
        'markerLineWidth' : 3,
        'markerLineColor' : '#1bbc9b',
        'markerLineDasharray' : [10, 5],
        'markerFillOpacity' : 0.1,
        'markerFill' : '#1bbc9b',
        'markerWidth' : 1,
        'markerHeight' : 1
    }
});

Map.addOnLoadHook('addHandler', 'boxZoom', MapBoxZoomHander);

export default MapBoxZoomHander;
