import Handler from 'handler/Handler';
import Map from '../Map';
import DrawTool from '../tool/DrawTool';

class MapBoxZoomHander extends Handler {
    constructor(target) {
        super(target);
        this.drawTool = new DrawTool({
            'mode'   : 'Rectangle',
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
        this.drawTool.remove();
        const extent = param.geometry.getExtent();
        const zoom = this.target.getFitZoom(extent);
        this.target.animateTo({
            center : extent.getCenter(),
            zoom : zoom
        });
    }
}

Map.mergeOptions({
    'boxZoom' : true,
    'boxZoomSymbol': {
        'lineWidth' : 3,
        'lineColor' : '#1bbc9b',
        'lineDasharray' : [10, 5],
        'polygonOpacity' : 0.1,
        'polygonFill' : '#1bbc9b'
    }
});

Map.addOnLoadHook('addHandler', 'boxZoom', MapBoxZoomHander);

export default MapBoxZoomHander;
