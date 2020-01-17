import Renderer from '../Renderer.js';
import BloomExtractShader from './BloomExtractShader.js';
import QuadShader from './QuadShader.js';
import BlurPass from './BlurPass.js';
import quadVert from './glsl/quad.vert';
import combineFrag from './glsl/bloom_combine.frag';
import { vec2 } from 'gl-matrix';

class BloomPass {
    constructor(regl) {
        this._regl = regl;
        this._renderer = new Renderer(regl);
    }

    render(sourceTex, bloomTex, bloomThreshold, bloomFactor, bloomRadius, paintToScreen) {
        this._initShaders();
        this._createTextures(sourceTex);
        let output = this._outputTex;
        const uniforms = this._uniforms || {
            'uRGBMRange': 7,
            'uBloomThreshold': bloomThreshold,
            'TextureInput': bloomTex,
            'uTextureInputRatio': [1, 1],
            'uTextureInputSize': [bloomTex.width, bloomTex.height],
            'uTextureOutputSize': [bloomTex.width, bloomTex.height],
            'uExtractBright': 0
        };
        // uniforms['uExtractBright'] = extractBright ? 1 : 0;
        uniforms['TextureInput'] = bloomTex;
        vec2.set(uniforms['uTextureInputSize'], bloomTex.width, bloomTex.height);
        vec2.set(uniforms['uTextureOutputSize'], bloomTex.width, bloomTex.height);

        if (output.width !== bloomTex.width || output.height !== bloomTex.height) {
            this._targetFBO.resize(bloomTex.width, bloomTex.height);
        }

        this._renderer.render(this._extractShader, uniforms, null, this._targetFBO);

        //blur
        const blurTexes = this._blurPass.render(this._outputTex);
        //combine
        output = this._combine(sourceTex, blurTexes, bloomTex, bloomFactor, bloomRadius, paintToScreen);

        return output;
    }

    _combine(sourceTex, blurTexes, inputTex, bloomFactor, bloomRadius, paintToScreen) {
        if (!paintToScreen) {
            if (this._combineTex.width !== sourceTex.width || this._combineTex.height !== sourceTex.height) {
                this._combineFBO.resize(sourceTex.width, sourceTex.height);
            }
        }


        let uniforms = this._combineUniforms;
        const { blurTex0, blurTex1, blurTex2, blurTex3, blurTex4 } = blurTexes;
        if (!uniforms) {
            uniforms = this._combineUniforms = {
                'uBloomFactor': 0,
                'uBloomRadius': 0,
                'uRGBMRange': 7,
                'TextureBloomBlur1': blurTex0,
                'TextureBloomBlur2': blurTex1,
                'TextureBloomBlur3': blurTex2,
                'TextureBloomBlur4': blurTex3,
                'TextureBloomBlur5': blurTex4,
                'TextureInput': null,
                'TextureSource': null,
                'uTextureBloomBlur1Ratio': [1, 1],
                'uTextureBloomBlur1Size': [0, 0],
                'uTextureBloomBlur2Ratio': [1, 1],
                'uTextureBloomBlur2Size': [0, 0],
                'uTextureBloomBlur3Ratio': [1, 1],
                'uTextureBloomBlur3Size': [0, 0],
                'uTextureBloomBlur4Ratio': [1, 1],
                'uTextureBloomBlur4Size': [0, 0],
                'uTextureBloomBlur5Ratio': [1, 1],
                'uTextureBloomBlur5Size': [0, 0],
                'uTextureInputRatio': [1, 1],
                'uTextureInputSize': [0, 0],
                'uTextureOutputRatio': [1, 1],
                'uTextureOutputSize': [0, 0],
            };
        }
        uniforms['uBloomFactor'] = bloomFactor;
        uniforms['uBloomRadius'] = bloomRadius;
        uniforms['TextureInput'] = inputTex;
        uniforms['TextureSource'] = sourceTex;
        vec2.set(uniforms['uTextureBloomBlur1Size'], blurTex0.width, blurTex0.height);
        vec2.set(uniforms['uTextureBloomBlur2Size'], blurTex1.width, blurTex1.height);
        vec2.set(uniforms['uTextureBloomBlur3Size'], blurTex2.width, blurTex2.height);
        vec2.set(uniforms['uTextureBloomBlur4Size'], blurTex3.width, blurTex3.height);
        vec2.set(uniforms['uTextureBloomBlur5Size'], blurTex4.width, blurTex4.height);
        vec2.set(uniforms['uTextureInputSize'], sourceTex.width, sourceTex.height);
        vec2.set(uniforms['uTextureOutputSize'], sourceTex.width, sourceTex.height);

        this._renderer.render(this._combineShader, uniforms, null, paintToScreen ? null : this._combineFBO);
        return paintToScreen ? null : this._combineTex;
    }

    dispose() {
        if (this._extractShader) {
            this._extractShader.dispose();
            delete this._extractShader;
            this._combineShader.dispose();
        }
        if (this._targetFBO) {
            this._targetFBO.destroy();
            delete this._targetFBO;
            this._combineFBO.destroy();
        }
        if (this._blurPass) {
            this._blurPass.dispose();
            delete this._blurPass;
        }
        delete this._uniforms;
    }


    _createTextures(tex) {
        if (this._outputTex) {
            return;
        }
        const regl = this._renderer.regl;
        const output = this._outputTex = this._createColorTex(tex);
        this._targetFBO = regl.framebuffer({
            width: output.width,
            height: output.height,
            colors: [output],
            depth: false,
            stencil: false
        });

        let w = tex.width, h = tex.height;

        this._combineTex = this._createColorTex(tex, w, h, 'uint8');
        this._combineFBO = this._createBlurFBO(this._combineTex);

    }

    _createColorTex(curTex, w, h, dataType) {
        const regl = this._renderer.regl;
        const type = dataType || (regl.hasExtension('OES_texture_half_float') ? 'float16' : 'float');
        const width = w || curTex.width, height = h || curTex.height;
        const color = regl.texture({
            min: 'linear',
            mag: 'linear',
            type,
            width,
            height
        });
        return color;
    }

    _createBlurFBO(tex) {
        const regl = this._renderer.regl;
        return regl.framebuffer({
            width: tex.width,
            height: tex.height,
            colors: [tex],
            depth: false,
            stencil: false
        });
    }

    _initShaders() {
        if (!this._extractShader) {
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
            this._blurPass = new BlurPass(this._regl);
            this._extractShader = new BloomExtractShader();
            this._combineShader = new QuadShader({
                vert: quadVert,
                frag: combineFrag,
                uniforms: [
                    'uBloomFactor',
                    'uBloomRadius',
                    'uRGBMRange',
                    'TextureBloomBlur1',
                    'TextureBloomBlur2',
                    'TextureBloomBlur3',
                    'TextureBloomBlur4',
                    'TextureBloomBlur5',
                    'TextureInput',
                    'TextureSource',
                    'uTextureBloomBlur1Ratio',
                    'uTextureBloomBlur1Size',
                    'uTextureBloomBlur2Ratio',
                    'uTextureBloomBlur2Size',
                    'uTextureBloomBlur3Ratio',
                    'uTextureBloomBlur3Size',
                    'uTextureBloomBlur4Ratio',
                    'uTextureBloomBlur4Size',
                    'uTextureBloomBlur5Ratio',
                    'uTextureBloomBlur5Size',
                    'uTextureInputRatio',
                    'uTextureInputSize',
                    'uTextureOutputRatio',
                    'uTextureOutputSize',
                ],
                extraCommandProps: {
                    viewport
                }
            });
        }
    }
}

export default BloomPass;
