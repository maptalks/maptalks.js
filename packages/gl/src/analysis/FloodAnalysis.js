import Analysis from './Analysis';
import * as reshader from '@maptalks/reshader.gl';

const DEFAULT_WATER_COLOR = [0.1451, 0.2588, 0.4863];

export default class FloodAnalysis extends Analysis {
    constructor(options) {
        super(options);
        this.type = 'floodAnalysis';
    }

    addTo(layer) {
        super.addTo(layer);
        const renderer = this.layer.getRenderer();
        const map = this.layer.getMap();
        this._renderOptions = {};
        this._renderOptions['waterHeight'] = this.options.waterHeight;
        this._renderOptions['projViewMatrix'] = map.projViewMatrix;
        if (renderer) {
            this._setViewshedPass(renderer);
        } else {
            this.layer.once('renderercreate', e => {
                this._setViewshedPass(e.renderer);
            }, this);
        }
        return this;
    }

    _setViewshedPass(renderer) {
        const viewport = {
            x : 0,
            y : 0,
            width : () => {
                return renderer.canvas ? renderer.canvas.width : 1;
            },
            height : () => {
                return renderer.canvas ? renderer.canvas.height : 1;
            }
        };
        const floodRenderer = new reshader.Renderer(renderer.regl);
        this._floodPass = new reshader.FloodPass(floodRenderer, viewport) || this._floodPass;
        this.layer.addAnalysis(this);
    }

    renderAnalysis(meshes) {
        const uniforms = {};
        uniforms['flood_waterColor'] = this.options['waterColor'] || DEFAULT_WATER_COLOR;
        this._renderOptions['waterHeight'] = this.options['waterHeight'];
        uniforms['floodMap'] = this._floodPass.render(meshes, this._renderOptions);
        return uniforms;
    }

    getDefines() {
        return {
            HAS_FLOODANALYSE: 1
        };
    }
}
