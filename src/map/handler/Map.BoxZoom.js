import Handler from 'handler/Handler';
import Map from '../Map';
import DrawTool from '../tool/DrawTool';

class MapBoxZoomHander extends Handler {
    constructor(target) {
        super(target);
        this.drawTool = new DrawTool({
            'mode'   : 'Rectangle'
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
            this.drawTool.setSymbol(this.target.options['boxZoomSymbol']);
            this.drawTool.addTo(this.target);
            this.drawTool.on('drawend', this._boxZoom, this);
        }
    }

    _boxZoom(param) {
        const extent = param.geometry.getExtent();
        this.target.fitExtent(extent);
        this.drawTool.remove();
    }
}

Map.mergeOptions({
    'boxZoom' : true,
    'boxZoomSymbol': {
        'lineWidth' : 2,
        'lineColor' : '#000',
        'polygonOpacity' : 0
    }
});

Map.addOnLoadHook('addHandler', 'boxZoom', MapBoxZoomHander);

export default MapBoxZoomHander;
