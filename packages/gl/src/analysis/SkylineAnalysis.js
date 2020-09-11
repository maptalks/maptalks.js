import * as reshader from '@maptalks/reshader.gl';
import { getGroundTransform } from '../layer/util/util';
import Analysis from './Analysis';

export default class SkylineAnalysis extends Analysis {
    constructor(options) {
        super(options);
        this.type = 'skyline';
    }

    addTo(layer) {
        super.addTo(layer);
        const renderer = this.layer.getRenderer();
        if (renderer) {
            this._setSkylinePass(renderer);
        } else {
            this.layer.once('renderercreate', e => {
                this._setSkylinePass(e.renderer);
            }, this);
        }
        return this;
    }

    _setSkylinePass(renderer) {
        const viewport = { width: renderer.canvas.width, height: renderer.canvas.height };
        const skylineRenderer = new reshader.Renderer(renderer.regl);
        this._skylinePass = new reshader.OutlinePass(skylineRenderer, viewport) || this._skylinePass;
        this.layer.addAnalysis(this);
        this._ground = this._createGround(renderer.regl);
    }

    renderAnalysis(context, toAanalyseMeshes, fbo) {
        super.renderAnalysis(context);
        this._ground = this._ground || this._createGround();
        const map = this.layer.getMap();
        this._transformGround(map);
        let skylineMeshes = toAanalyseMeshes.concat([this._ground]);
        this._skylinePass.render(skylineMeshes, fbo, {
            projViewMatrix: map.projViewMatrix,
            lineColor: this.options['lineColor'],
            lineWidth: this.options['lineWidth']
        });
    }

    _createGround(regl) {
        const planeGeo = new reshader.Plane();
        planeGeo.generateBuffers(regl);
        planeGeo.data.aTexCoord = new Float32Array(8);
        //TODO 还需要构造 tangent
        return new reshader.Mesh(planeGeo);
    }

    _transformGround(map) {
        const localTransform = getGroundTransform(this._ground.localTransform, map);
        this._ground.setLocalTransform(localTransform);
    }

    remove() {
        super.remove();
        if (this._skylinePass) {
            this._skylinePass.dispose();
        }
        if (this._ground) {
            this._ground.geometry.dispose();
            delete this._ground;
        }
    }

    getDefines() {
        return null;
    }
}
