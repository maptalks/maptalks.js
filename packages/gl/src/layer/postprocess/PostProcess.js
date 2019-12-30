import * as reshader from '@maptalks/reshader.gl';
import { vec2 } from 'gl-matrix';

const RESOLUTION = [];

export default class PostProcess {
    constructor(regl, viewport, jitter) {
        this._regl = regl;
        this._renderer = new reshader.Renderer(regl);
        this._fxaaShader = new reshader.FxaaShader(viewport);
        this._taaPass = new reshader.TaaPass(this._renderer, viewport, jitter);
        this._bloomPass = new reshader.BloomPass(this._renderer, viewport);
        this._postProcessShader = new reshader.PostProcessShader(viewport);
        this._emptyTexture = regl.texture();
    }

    bloom(curTex, bloomTex, threshold, bloomFactor, bloomRadius) {
        return this._bloomPass.render(curTex, bloomTex, threshold, bloomFactor, bloomRadius);
    }

    taa(curTex, depthTex, {
        projViewMatrix, cameraWorldMatrix,
        fov, jitter, near, far, needClear
    }) {
        const pass = this._taaPass;
        const outputTex = pass.render(
            curTex, depthTex,
            projViewMatrix, cameraWorldMatrix,
            fov, jitter, near, far, needClear
        );
        const redraw = pass.needToRedraw();
        return {
            outputTex,
            redraw
        };
    }

    ssao(sourceTex, depthTex, uniforms) {
        if (!this._ssaoPass) {
            this._ssaoPass = new reshader.SsaoPass(this._renderer);
        }
        return this._ssaoPass.render({
            projMatrix: uniforms['projMatrix'],
            cameraNear: uniforms['cameraNear'],
            cameraFar: uniforms['cameraFar'],
            bias: uniforms['ssaoBias'],
            radius: uniforms['ssaoRadius'],
            intensity: uniforms['ssaoIntensity'],
            quality: 0.6
        }, sourceTex, depthTex);
    }

    fxaa(source, enableFXAA, enableToneMapping) {
        this._renderer.render(this._fxaaShader, {
            textureSource: source,
            resolution: vec2.set(RESOLUTION, source.width, source.height),
            enableFXAA,
            enableToneMapping
        });
    }

    //filmic grain + vigenett
    postprocess(fbo, uniforms, src) {
        const source = src || fbo.color[0];
        uniforms['resolution'] = vec2.set(RESOLUTION, source.width, source.height);
        uniforms['textureSource'] = source;
        uniforms['timeGrain'] = performance.now();
        this._renderer.render(this._postProcessShader, uniforms);
        return this._target;
    }

    delete() {
        if (this._taaPass) {
            this._taaPass.dispose();
            delete this._taaPass;
        }
        if (this._ssaoPass) {
            this._ssaoPass.dispose();
            delete this._ssaoPass;
        }
    }
}
