import { vec4, mat4 } from 'gl-matrix';
import Renderer from '../Renderer.js';
import SsrMipmapShader from './SsrMipmapShader.js';
import SsrCombineShader from './SsrCombineShader.js';
import BlurPass from './BlurPass.js';
import { vec2 } from 'gl-matrix';

class SsrPass {

    static getUniformDeclares() {
        const corners = [[], []];
        const invProjMatrix = [];
        return [
            'TextureDepth',
            'TextureSource',
            'uSsrFactor',
            'uSsrQuality',
            'uPreviousGlobalTexSize',
            'TextureToBeRefracted',
            'uTextureToBeRefractedSize',
            {
                name: 'uInvProjMatrix',
                type : 'function',
                fn : (context, props) => {
                    return mat4.invert(invProjMatrix, props['projMatrix']);
                }
            },
            {
                name: 'uTaaCornersCSLeft',
                type: 'array',
                length: 2,
                fn: function (context, props) {
                    const cornerY = Math.tan(0.5 * props['fov']);
                    const width = props['TextureDepth'].width;
                    const height = props['TextureDepth'].height;
                    const aspect = width / height;
                    const cornerX = aspect * cornerY;
                    vec4.set(corners[0], cornerX, cornerY, cornerX, -cornerY);
                    vec4.set(corners[1], -cornerX, cornerY, -cornerX, -cornerY);
                    return corners;
                }
            },
            {
                name: 'uReprojectViewProj',
                type : 'function',
                fn : (context, props) => {
                    return props['projViewMatrix'];
                }
            }
        ];
    }

    static getDefines() {
        return {
            'HAS_SSR': 1
        };
    }

    constructor(regl) {
        this._regl = regl;
        this._renderer = new Renderer(regl);
    }

    combine(sourceTex, ssrTex) {
        this._initShaders();
        this._createTextures(sourceTex);
        if (this._combineFBO.width !== sourceTex.width ||
            this._combineFBO.height !== sourceTex.height) {
            this._combineFBO.resize(sourceTex.width, sourceTex.height);
        }
        this._renderer.render(this._combineShader, {
            TextureInput: sourceTex,
            TextureSSR: ssrTex,
            uTextureOutputSize: [sourceTex.width, sourceTex.height]
        }, null, this._combineFBO);
        return this._combineTex;
    }

    genMipMap(sourceTex) {
        //blur
        const blurTexes = this._blurPass.render(sourceTex);
        const { blurTex0, blurTex1, blurTex2, blurTex3, blurTex4, blurTex5, blurTex6 } = blurTexes;
        const uniforms = this._uniforms || {
            'uRGBMRange': 7,
            'TextureRefractionBlur0': null,
            'TextureRefractionBlur1': null,
            'TextureRefractionBlur2': null,
            'TextureRefractionBlur3': null,
            'TextureRefractionBlur4': null,
            'TextureRefractionBlur5': null,
            'TextureRefractionBlur6': null,
            'TextureRefractionBlur7': null,
            'uTextureOutputRatio': [1, 1],
            'uTextureOutputSize': [0, 0],
            'uTextureRefractionBlur0Ratio': [1, 1],
            'uTextureRefractionBlur0Size': [0, 0],
            'uTextureRefractionBlur1Ratio': [1, 1],
            'uTextureRefractionBlur1Size': [0, 0],
            'uTextureRefractionBlur2Ratio': [1, 1],
            'uTextureRefractionBlur2Size': [0, 0],
            'uTextureRefractionBlur3Ratio': [1, 1],
            'uTextureRefractionBlur3Size': [0, 0],
            'uTextureRefractionBlur4Ratio': [1, 1],
            'uTextureRefractionBlur4Size': [0, 0],
            'uTextureRefractionBlur5Ratio': [1, 1],
            'uTextureRefractionBlur5Size': [0, 0],
            'uTextureRefractionBlur6Ratio': [1, 1],
            'uTextureRefractionBlur6Size': [0, 0],
            'uTextureRefractionBlur7Ratio': [1, 1],
            'uTextureRefractionBlur7Size': [0, 0]
        };
        // uniforms['uExtractBright'] = extractBright ? 1 : 0;
        uniforms['TextureRefractionBlur0'] = sourceTex;
        uniforms['TextureRefractionBlur1'] = blurTex0;
        uniforms['TextureRefractionBlur2'] = blurTex1;
        uniforms['TextureRefractionBlur3'] = blurTex2;
        uniforms['TextureRefractionBlur4'] = blurTex3;
        uniforms['TextureRefractionBlur5'] = blurTex4;
        uniforms['TextureRefractionBlur6'] = blurTex5;
        uniforms['TextureRefractionBlur7'] = blurTex6;
        vec2.set(uniforms['uTextureRefractionBlur0Size'], sourceTex.width, sourceTex.height);
        vec2.set(uniforms['uTextureRefractionBlur1Size'], blurTex0.width, blurTex0.height);
        vec2.set(uniforms['uTextureRefractionBlur2Size'], blurTex1.width, blurTex1.height);
        vec2.set(uniforms['uTextureRefractionBlur3Size'], blurTex2.width, blurTex2.height);
        vec2.set(uniforms['uTextureRefractionBlur4Size'], blurTex3.width, blurTex3.height);
        vec2.set(uniforms['uTextureRefractionBlur5Size'], blurTex4.width, blurTex4.height);
        vec2.set(uniforms['uTextureRefractionBlur6Size'], blurTex5.width, blurTex5.height);
        vec2.set(uniforms['uTextureRefractionBlur7Size'], blurTex6.width, blurTex6.height);

        const output = this._targetFBO;
        const h = Math.ceil(sourceTex.height * 2);
        if (output.width !== sourceTex.width || output.height !== h) {
            output.resize(sourceTex.width, h);
        }
        vec2.set(uniforms['uTextureOutputSize'], output.width, output.height);

        this._renderer.render(this._mipmapShader, uniforms, null, output);

        return this._outputTex;
    }

    getMipmapTexture() {
        if (!this._outputTex) {
            this._outputTex = this._renderer.regl.texture({
                min: 'linear',
                mag: 'linear',
                type: 'uint8',
                width: 2,
                height: 2
            });
        }
        return this._outputTex;
    }

    dispose() {
        if (this._blurPass) {
            this._blurPass.dispose();
            delete this._blurPass;
            this._mipmapShader.dispose();
            this._targetFBO.destroy();
            this._combineFBO.destroy();
        }
    }

    _initShaders() {
        if (!this._blurPass) {
            this._blurPass = new BlurPass(this._regl, 7);
            this._mipmapShader = new SsrMipmapShader();
            this._combineShader = new SsrCombineShader();
        }
    }

    _createTextures(sourceTex) {
        if (!this._targetFBO) {
            const regl = this._regl;
            const h = Math.ceil(sourceTex.height * 2);
            this._outputTex = this._outputTex || regl.texture({
                min: 'linear',
                mag: 'linear',
                type: 'uint8',
                width: sourceTex.width,
                height: h
            });
            this._outputTex.resize(sourceTex.width, h);

            this._targetFBO = regl.framebuffer({
                width: sourceTex.width,
                height: h,
                colors: [this._outputTex],
                depth: false,
                stencil: false
            });

            this._combineTex = regl.texture({
                min: 'linear',
                mag: 'linear',
                type: 'uint8',
                width: sourceTex.width,
                height: sourceTex.height
            });
            this._combineTex.resize(sourceTex.width, sourceTex.height);

            this._combineFBO = regl.framebuffer({
                width: sourceTex.width,
                height: sourceTex.height,
                colors: [this._combineTex],
                depth: false,
                stencil: false
            });
        }
    }
}

export default SsrPass;
