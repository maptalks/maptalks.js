import { Class, Eventable, Handlerable } from 'maptalks';

export default class Analysis extends Eventable(Handlerable(Class)) {

    constructor(options) {
        super(options);
        this._enable = true;
    }

    addTo(layer) {
        this.layer = layer;
    }

    enable() {
        this._enable = true;
        const renderer = this.layer.getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
    }

    disable() {
        this._enable = false;
        const renderer = this.layer.getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
    }

    isEnable() {
        return this._enable;
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
