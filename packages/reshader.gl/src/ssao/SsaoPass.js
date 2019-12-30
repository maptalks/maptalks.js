import { mat4 } from 'gl-matrix';
import SsaoBlurShader from './SsaoBlurShader.js';
import SsaoExtractShader from './SsaoExtractShader.js';
import SsaoCombineShader from './SsaoCombineShader.js';

const SAME_RATIO = [1, 1];

class SsaoPass {
    constructor(renderer) {
        this._renderer = renderer;
    }

    /**
    * uniforms值：
    *   projMatrix,
        bias,
        radius,
        intesity,
        cameraNear,
        cameraFar,
        quality: 0.6
    */
    render(uniforms, sourceTexture, depthTexture) {
        const { width, height } = depthTexture;
        this._initShaders();
        if (!this._extractFBO) {
            this._createTextures(depthTexture);
        }
        this._extract(uniforms, width, height, depthTexture);
        return this._blurAndCombine(sourceTexture, depthTexture, uniforms['projMatrix'], width, height);
    }

    _blurAndCombine(sourceTexture, depthTexture, projMatrix, w, h) {
        if (this._blurHTex.width !== w || this._blurHTex.h !== h) {
            this._blurHFBO.resize(w, h);
            this._blurVFBO.resize(w, h);
        }
        const size = [w, h];
        this._renderer.render(this._ssaoBlurShader, {
            'uTextureOutputSize': size,
            'projMatrix': projMatrix,
            'materialParams_depth': depthTexture,
            'materialParams_ssao': this._extractTex,
            'axis': [1, 0],
            'TextureInput': sourceTexture
        }, null, this._blurHFBO);

        this._renderer.render(this._ssaoBlurShader, {
            'uTextureOutputSize': size,
            'projMatrix': projMatrix,
            'materialParams_depth': depthTexture,
            'materialParams_ssao': this._blurHTex,
            'axis': [0, 1],
            'TextureInput': sourceTexture
        }, null, this._blurVFBO);

        return this._blurVTex;
    }

    _extract(uniforms, w, h, depthTexture) {
        if (this._extractFBO.width !== w || this._extractFBO.height !== h) {
            this._extractFBO.resize(w, h);
        }
        const { projMatrix } = uniforms;
        this._renderer.render(this._ssaoExtractShader, {
            'uQuality': uniforms['quality'],
            'uSsaoBias': uniforms['bias'],
            'uSsaoIntensity': uniforms['intensity'],
            'uSsaoRadius': uniforms['radius'],
            'uNearFar': [uniforms['cameraNear'], uniforms['cameraFar']],
            'uTextureOutputRatio': SAME_RATIO,
            'uTextureOutputSize': [w, h],
            'projMatrix': projMatrix,
            'invProjMatrix': mat4.invert([], projMatrix),
            'TextureDepth': depthTexture
        }, null, this._extractFBO);
    }

    _createTextures(tex) {
        const w = tex.width, h = tex.height;
        this._extractTex = this._createTex(w, h, 'uint8');
        this._extractFBO = this._createFBO(this._extractTex);

        this._blurHTex = this._createTex(w, h, 'uint8');
        this._blurHFBO = this._createFBO(this._blurHTex);

        const type = this._renderer.regl.hasExtension('OES_texture_half_float') ? 'float16' : 'float';
        this._blurVTex = this._createTex(w, h, type);
        this._blurVFBO = this._createFBO(this._blurVTex);
    }

    _createTex(width, height, type) {
        const regl = this._renderer.regl;
        const color = regl.texture({
            min: 'linear',
            mag: 'linear',
            wrap: 'clamp',
            type,
            width,
            height
        });
        return color;
    }

    _createFBO(tex) {
        const regl = this._renderer.regl;
        return regl.framebuffer({
            width: tex.width,
            height: tex.height,
            colors: [tex],
            depth: false,
            stencil: false
        });
    }

    delete() {
        if (this._extractFBO) {
            this._extractFBO.destroy();
            delete this._extractFBO;
            this._blurVFBO.destroy();
            this._blurHFBO.destroy();
            delete this._ssaoMipmapShader;
            this._ssaoExtractShader.dispose();
            this._ssaoBlurHShader.dispose();
            this._ssaoCombineShader.dispose();
        }
    }

    _initShaders() {
        if (!this._ssaoExtractShader) {
            const viewport = {
                x: 0,
                y: 0,
                width : (context, props) => {
                    return props['uTextureOutputSize'][0];
                },
                height : (context, props) => {
                    return props['uTextureOutputSize'][1];
                }
            };
            this._ssaoExtractShader = new SsaoExtractShader(viewport);
            delete this._ssaoExtractShader;
            this._ssaoBlurShader = new SsaoBlurShader(viewport);
            this._ssaoCombineShader = new SsaoCombineShader(viewport);
        }
    }
}

export default SsaoPass;
