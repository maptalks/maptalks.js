import * as reshader from '@maptalks/reshader.gl';
import { vec2 } from 'gl-matrix';

const RESOLUTION = [];
export default class PostProcess {
    constructor(regl, fbo) {
        this._regl = regl;
        this._target = fbo;
        this._fxaaShader = new reshader.FxaaShader();
        this._renderer = new reshader.Renderer(regl);
    }

    antialias(last) {
        this._renderer.render(this._fxaaShader, {
            textureSource: this._target.color[0],
            resolution: vec2.set(RESOLUTION, this._target.width, this._target.height)
        }, null, last ? null : this._target);
        return this._target;
    }
}
