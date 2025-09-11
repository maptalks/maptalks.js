import { mat4 } from 'gl-matrix';
import SsaoBlurShader from './SsaoBlurShader.js';
import SsaoExtractShader from './SsaoExtractShader.js';

const MAT = [];

class SsaoPass {
    constructor(renderer) {
        this._renderer = renderer;
    }

    /**
    * uniforms值：
    *   projMatrix,
        bias,
        radius,
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
        return this._blurAndCombine(sourceTexture, uniforms['cameraFar'], width, height);
    }

    _blurAndCombine(sourceTexture, cameraFar, w, h) {
        const hw = Math.floor(w / 2);
        const hh = Math.floor(h / 2);
        if (this._blurHTex.width !== hw || this._blurHTex.height !== hh) {
            this._blurHFBO.resize(hw, hh);
            this._blurVFBO.resize(w, h);
        }
        const resolution = [w, h];
        const axis = [1, 0];
        this._renderer.render(this._ssaoBlurShader, {
            'TextureInput': sourceTexture,
            'materialParams_ssao': this._extractTex,
            'materialParams': {
                'axis': axis,
                'farPlaneOverEdgeDistance': -cameraFar / 0.0625,
                'resolution': resolution
            },
            'outputSize': [hw, hh]
        }, null, this._blurHFBO);
        axis[0] = 0;
        axis[1] = 1;
        this._renderer.render(this._ssaoBlurShader, {
            'TextureInput': sourceTexture,
            'materialParams_ssao': this._blurHTex,
            'materialParams': {
                'axis': axis,
                'farPlaneOverEdgeDistance': -cameraFar / 0.0625,
                'resolution': resolution
            },
            'outputSize': [w, h]
        }, null, this._blurVFBO);

        return this._blurVTex;
    }

    _extract(uniforms, w, h, depthTexture) {
        const hw = Math.floor(w / 2);
        const hh = Math.floor(h / 2);
        if (this._extractFBO.width !== hw || this._extractFBO.height !== hh) {
            this._extractFBO.resize(hw, hh);
        }
        const { projMatrix } = uniforms;
        const invProjMatrix = mat4.invert(MAT, projMatrix);
        // always square AO result, as it looks much better
        const power = uniforms['power'] || 1;
        this._renderer.render(this._ssaoExtractShader, {
            'materialParams_depth': depthTexture,
            'materialParams': {
                'projMatrix': projMatrix,
                'invProjMatrix': invProjMatrix,
                'resolution': [hw, hh, 1 / hw, 1 / hh],
                'radius': uniforms['radius'],
                'bias': uniforms['bias'],
                'power': power,
                // 'invFarPlane': 1 / -uniforms['cameraFar'],
                'cameraNearFar': [uniforms['cameraNear'], uniforms['cameraFar']]
            },
            'outputSize': [hw, hh]
        }, null, this._extractFBO);
    }

    _createTextures(tex) {
        const type = 'uint8';
        const hw = Math.floor(tex.width / 2), hh = Math.floor(tex.height / 2);
        this._extractTex = this._createTex(hw, hh, type);
        this._extractFBO = this._createFBO(this._extractTex);

        this._blurHTex = this._createTex(hw, hh, type);
        this._blurHFBO = this._createFBO(this._blurHTex);

        this._blurVTex = this._createTex(tex.width, tex.height, type);
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

    dispose() {
        if (this._extractFBO) {
            this._extractFBO.destroy();
            delete this._extractFBO;
            this._blurVFBO.destroy();
            this._blurHFBO.destroy();
            this._ssaoExtractShader.dispose();
            this._ssaoBlurShader.dispose();
            delete this._ssaoExtractShader;
        }
    }

    _initShaders() {
        if (!this._ssaoExtractShader) {
            this._ssaoExtractShader = new SsaoExtractShader();
            this._ssaoBlurShader = new SsaoBlurShader();
        }
    }
}

export default SsaoPass;
