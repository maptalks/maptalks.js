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
        return this._blurAndCombine(sourceTexture, uniforms['cameraFar'], width, height);
    }

    _blurAndCombine(sourceTexture, cameraFar, w, h) {
        if (this._blurHTex.width !== w || this._blurHTex.h !== h) {
            this._blurHFBO.resize(w, h);
            this._blurVFBO.resize(w, h);
        }
        const resolution = [w, h];
        const axis = [2, 0];
        this._renderer.render(this._ssaoBlurShader, {
            'TextureInput': sourceTexture,
            'materialParams_ssao': this._extractTex,
            'materialParams': {
                'axis': axis,
                'farPlaneOverEdgeDistance': -cameraFar / 0.0625,
                'resolution': resolution
            }
        }, null, this._blurHFBO);
        axis[0] = 0;
        axis[1] = 2;
        this._renderer.render(this._ssaoBlurShader, {
            'TextureInput': sourceTexture,
            'materialParams_ssao': this._blurHTex,
            'materialParams': {
                'axis': axis,
                'farPlaneOverEdgeDistance': -cameraFar / 0.0625,
                'resolution': resolution
            }
        }, null, this._blurVFBO);

        return this._blurVTex;
    }

    _extract(uniforms, w, h, depthTexture) {
        if (this._extractFBO.width !== w || this._extractFBO.height !== h) {
            this._extractFBO.resize(w, h);
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
                'resolution': [w, h, 1 / w, 1 / h],
                'radius': uniforms['radius'],
                'bias': uniforms['bias'],
                'power': power,
                'invFarPlane': 1 / -uniforms['cameraFar']
            }
        }, null, this._extractFBO);
    }

    _createTextures(tex) {
        const type = 'uint8';
        const w = tex.width, h = tex.height;
        this._extractTex = this._createTex(w, h, type);
        this._extractFBO = this._createFBO(this._extractTex);

        this._blurHTex = this._createTex(w, h, type);
        this._blurHFBO = this._createFBO(this._blurHTex);

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
