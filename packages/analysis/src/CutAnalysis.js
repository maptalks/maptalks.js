import { reshader } from '@maptalks/gl';
import Analysis from './Analysis';
import CutPass from './pass/CutPass';
import { coordinateToWorld } from './common/Util';

export default class CutAnalysis extends Analysis {
    constructor(options) {
        super(options);
        this.type = 'cut';
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

    reset() {
        if (this._pass) {
            const postion = this._renderOptions['position'];
            const rotation = this._renderOptions['rotation']
            const scale = this._renderOptions['scale']
            this._pass._resetController(postion, rotation, scale);
        }
    }

    _prepareRenderOptions() {
        const map = this.layer.getMap();
        this._renderOptions = {};
        this._renderOptions['position'] = coordinateToWorld(map, ...this.options.position);
        this._renderOptions['rotation'] = this.options.rotation || [0, 0, 0];
        this._renderOptions['scale'] = this.options.scale || [1, 1, 1];
        this._renderOptions['projViewMatrix'] = map.projViewMatrix;
        this._renderOptions['minAltitude'] = 0;
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
        const cutRenderer = new reshader.Renderer(renderer.device);
        cutRenderer.canvas = renderer.canvas;
        cutRenderer.parentRenderer = renderer;
        this._prepareRenderOptions();
        this._pass = new CutPass(cutRenderer, viewport) || this._pass;
        const map = this.layer.getMap();
        this._pass._setController(map, this._renderOptions['position'], this._renderOptions['rotation'], this._renderOptions['scale']);
        this.layer.addAnalysis(this);
        renderer.setToRedraw();
    }

    renderAnalysis(meshes) {
        const uniforms = {};
        this._renderOptions.map = this.layer.getMap();
        const { meshesMap, invisibleMap} =  this._pass.render(meshes, this._renderOptions);
        uniforms['meshesMap'] = meshesMap;
        uniforms['invisibleMap'] = invisibleMap;
        return uniforms;
    }

    getDefines() {
        return {
            HAS_CUT: 1
        };
    }
}
