import Handler from '../../handler/Handler';
import Map from '../Map';
import DrawTool from '../tool/DrawTool';
import Extent from '../../geo/Extent';
import { type Param } from './CommonType'

class MapBoxZoomHander extends Handler {
    drawTool: DrawTool
    constructor(target: any) {
        super(target);
        this.drawTool = new DrawTool({
            'mode': 'boxZoom',
            // TODO: 等待DrawTool补充类型
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            'ignoreMouseleave': false
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

    _onMouseDown(param: Param) {
        if (!this.target.options['boxZoom']) {
            return;
        }
        if (param.domEvent.shiftKey) {
            // TODO: 等待DrawTool补充类型
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            this.drawTool.setSymbol(this.target.options['boxZoomSymbol']).on('drawend', this._boxZoom, this).addTo(this.target);
        }
    }

    _boxZoom(param: Param) {
        const map = this.target;
        this.drawTool.remove();
        const geometry = param.geometry,
            center = geometry.getCenter(),
            symbol = geometry.getSymbol(),
            w = symbol.markerWidth,
            h = symbol.markerHeight;

        // TODO: 等待Geometry补充类型
        const extent = new Extent(center, map.locateByPoint(center, w, h), map.getProjection());
        const zoom = map.getFitZoom(extent);
        map._animateTo({
            center: extent.getCenter(),
            zoom: zoom
        });
    }
}

Map.mergeOptions({
    'boxZoom': true,
    'boxZoomSymbol': {
        'markerType': 'rectangle',
        'markerLineWidth': 3,
        'markerLineColor': '#1bbc9b',
        'markerLineDasharray': [10, 5],
        'markerFillOpacity': 0.1,
        'markerFill': '#1bbc9b',
        'markerWidth': 1,
        'markerHeight': 1
    }
});

Map.addOnLoadHook('addHandler', 'boxZoom', MapBoxZoomHander);

export default MapBoxZoomHander;
