import FloodAnalysis from './FloodAnalysis';
import { altitudeToDistance } from './common/Util';

const DEFAULT_LIMIT_COLOR = [0.8, 0.1, 0.1];
export default class HeightLimitAnalysis extends FloodAnalysis {
    constructor(options) {
        super(options);
        this.type = 'heightLimitAnalysis';
    }

    _prepareRenderOptions(renderer) {
        super._prepareRenderOptions(renderer);
        const map = this.layer.getMap();
        this._renderOptions['waterHeight'] = altitudeToDistance(map, this.options.limitHeight);
        this._renderOptions['analysisType'] = 2;
    }

    update(name, value) {
        super.update(name, value);
        if (name === 'limitHeight') {
            const map = this.layer.getMap();
            this._renderOptions['waterHeight'] = map.altitudeToPoint(value || 0, map.getGLRes());
        }
    }

    renderAnalysis(meshes) {
        const uniforms = super.renderAnalysis(meshes);
        uniforms['heightLimitMap'] = uniforms['floodMap'];
        uniforms['limitColor'] = this.options['limitColor'] || DEFAULT_LIMIT_COLOR;
        return uniforms;
    }

    getDefines() {
        return {
            HAS_HEIGHTLIMIT: 1
        };
    }
}
