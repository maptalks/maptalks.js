import Analysis from './Analysis';

export default class FloodAnalysis extends Analysis {
    constructor(options) {
        super(options);
        this.type = 'floodAnalysis';
    }

    addTo(layer) {
        super.addTo(layer);
        this.layer.addAnalysis(this);
        return this;
    }

    renderAnalysis(context) {
        super.renderAnalysis(context);
        const analysisType = this.getAnalysisType();
        context[analysisType]['renderUniforms'] = this._createUniforms();
    }

    _createUniforms() {
        const uniforms = {};
        uniforms['flood_waterHeight'] = this.options['waterHeight'];
        uniforms['flood_waterColor'] = this.options['waterColor'];
        return uniforms;
    }

    getDefines() {
        return {
            HAS_FLOODANALYSE: 1
        };
    }
}
