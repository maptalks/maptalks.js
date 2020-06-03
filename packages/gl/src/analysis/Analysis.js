import { Class, Eventable, Handlerable } from 'maptalks';

export default class Analysis extends Eventable(Handlerable(Class)) {
    addTo(layer) {
        this.layer = layer;
    }

    renderAnalysis(context) {
        const analysisType = this.getAnalysisType();
        context.includes[analysisType] = 1;
        context[analysisType] = {
            defines: this.getDefines()
        };
    }

    remove() {
        if (this.layer) {
            this.layer.removeAnalysis(this);
            delete this.layer;
        }
    }

    update(name, value) {
        this.options[name] = value;
        const renderer = this.layer.getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
    }

    getAnalysisType() {
        return this.type;
    }
}
