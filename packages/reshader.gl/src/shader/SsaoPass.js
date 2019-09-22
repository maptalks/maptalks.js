import { vec2 } from 'gl-matrix';
import SsaoShader from './SsaoShader.js';
import SsaoBlurShader from './SsaoBlurShader.js';

const EMPTY_COLOR = [0, 0, 0, 0];
const RESOLUTION = [];

class SsaoPass {
    constructor(renderer, fbo) {
        this._renderer = renderer;
        this._fbo = fbo;
    }
    render(uniforms, depthTexture) {
        this._initShaders();
        const fbo = this._fbo;
        const regl = this._renderer.regl;
        regl.clear({
            color: EMPTY_COLOR,
            depth: 1,
            framebuffer: fbo
        });
        const source = fbo;
        uniforms.resolution = vec2.set(RESOLUTION, source.width, source.height);
        uniforms['materialParams_depth'] = depthTexture;
        this._renderer.render(this._ssaoShader, uniforms, null, fbo);

        const blurFBO = this._blurFBO;
        if (blurFBO.width !== fbo.width ||
            blurFBO.height !== fbo.height) {
            blurFBO.resize(fbo.width, fbo.height);
        }
        this._renderer.render(this._blurShader, {
            'materialParams_depth': depthTexture,
            'materialParams_ssao': fbo,
            'axis': [1, 0],
            'resolution': RESOLUTION,
            'projMatrix': uniforms['projMatrix']
        }, null, blurFBO);

        this._renderer.render(this._blurShader, {
            'materialParams_depth': depthTexture,
            'materialParams_ssao': blurFBO,
            'axis': [0, 1],
            'resolution': RESOLUTION,
            'projMatrix': uniforms['projMatrix']
        }, null, fbo);
    }

    delete() {
        if (this._ssaoShader) {
            this._ssaoShader.dispose();
            this._blurShader.dispose();
            this._blurFBO.destroy();
            delete this._ssaoShader;
            delete this._blurShader;
            delete this._blurFBO;
        }
    }

    _initShaders() {
        if (!this._ssaoShader) {
            const viewport = {
                x: 0,
                y: 0,
                width : () => {
                    return this._fbo.width;
                },
                height : () => {
                    return this._fbo.height;
                }
            };
            this._ssaoShader = new SsaoShader(viewport);
            this._blurShader = new SsaoBlurShader(viewport);
            this._blurFBO = this._renderer.regl.framebuffer({
                width: this._fbo.width,
                height: this._fbo.height,
                depth: false,
                stencil: false
            });
        }
    }
}

export default SsaoPass;
