import * as reshader from '@maptalks/reshader.gl';
import { vec2 } from 'gl-matrix';

const RESOLUTION = [];
export default class PostProcess {
    constructor(regl, viewport, fbo) {
        this._regl = regl;
        this._target = fbo;
        this._fxaaShader = new reshader.FxaaShader(viewport);
        this._postProcessShader = new reshader.PostProcessShader(viewport);
        this._renderer = new reshader.Renderer(regl);
    }

    fxaa(src) {
        const source = src || this._target.color[0];
        this._renderer.render(this._fxaaShader, {
            textureSource: source,
            resolution: vec2.set(RESOLUTION, source.width, source.height)
        });
        return this._target;
    }

    //filmic grain + vigenett
    postprocess(uniforms, src) {
        const source = src || this._target.color[0];
        uniforms['resolution'] = vec2.set(RESOLUTION, source.width, source.height);
        uniforms['textureSource'] = source;
        uniforms['timeGrain'] = performance.now();
        this._renderer.render(this._postProcessShader, uniforms);
        return this._target;
    }
}
