import { ExtrudePolygonLayer } from '@maptalks/vt';
import ExcavateRenderer from './ExcavateRenderer';

export default class ExcavateAnalysis extends ExtrudePolygonLayer {

    excavate(layers) {
        this._enable = true;
        this._excavatedLayers = Array.isArray(layers) ? layers : [layers];
        const renderer = this.getRenderer();
        if (renderer) {
            renderer._updateHeightMap(); //被挖方的图层发生变化时，需要更新一下高度图
            renderer.setToRedraw();
        }
    }

    getExcavatedLayers() {
        return this._excavatedLayers
    }

    enable() {
        this._enable = true;
        this._redraw();
    }

    disable() {
        this._enable = false;
        this._redraw();
    }

    isEnable() {
        return this._enable;
    }

    _redraw() {
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
    }
}

ExcavateAnalysis.registerRenderer('gl', ExcavateRenderer);
ExcavateAnalysis.registerRenderer('gpu', ExcavateRenderer);
