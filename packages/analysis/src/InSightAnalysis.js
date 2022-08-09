import { reshader } from '@maptalks/gl';
import { coordinateToWorld } from './common/Util';
import Analysis from './Analysis';
import InSightPass from './pass/InSightPass';

export default class InSightAnalysis extends Analysis {
    constructor(options) {
        super(options);
        this.type = 'insight';
    }

    update(name, value) {
        if (name === 'eyePos' || name === 'lookPoint') {
            const map = this.layer.getMap();
            this._renderOptions[name] = coordinateToWorld(map, ...value);
        } else {
            this._renderOptions[name] = value;
        }
        super.update(name, value);
    }

    _prepareRenderOptions() {
        const map = this.layer.getMap();
        this._renderOptions = {};
        this._renderOptions['eyePos'] = coordinateToWorld(map, ...this.options.eyePos);
        this._renderOptions['lookPoint'] = coordinateToWorld(map, ...this.options.lookPoint);
        this._renderOptions['visibleColor'] = this.options.visibleColor;
        this._renderOptions['invisibleColor'] = this.options.invisibleColor;
        this._renderOptions['projViewMatrix'] = map.projViewMatrix;
    }

    _setPass(renderer) {
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
        this._prepareRenderOptions();
        const insightRenderer = new reshader.Renderer(renderer.regl);
        this._pass = this._pass || new InSightPass(insightRenderer, viewport);
        this.layer.addAnalysis(this);
        renderer.setToRedraw();
    }

    renderAnalysis(meshes) {
        const uniforms = {};
        const insightMap =  this._pass.render(meshes, this._renderOptions);
        uniforms['insightMap'] = insightMap;
        uniforms['insight_visibleColor'] =  this._renderOptions['visibleColor'] || [0.0, 1.0, 0.0, 1.0];
        uniforms['insight_invisibleColor'] = this._renderOptions['invisibleColor'] || [1.0, 0.0, 0.0, 1.0];
        return uniforms;
    }

    getDefines() {
        return {
            HAS_INSIGHT: 1
        };
    }
}
