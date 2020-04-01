import Renderer from '../Renderer.js';
import QuadShader from './QuadShader.js';
import BloomBlurPass from './BloomBlurPass.js';
import quadVert from './glsl/quad.vert';
import combineFrag from './glsl/bloom_blur_combine.frag';

class BloomPass {
    constructor(regl) {
        this._regl = regl;
        this._renderer = new Renderer(regl);
    }

    render(sourceTex, bloomTex, bloomThreshold, bloomFactor, bloomRadius, paintToScreen) {
        this._initShaders();
        this._createTextures(sourceTex);
        //blur
        const blurTexes = this._blurPass.render(bloomTex, bloomRadius, bloomThreshold);
        //combine
        const output = this._combine(sourceTex, blurTexes, bloomTex, bloomFactor, paintToScreen);

        return output;
    }

    _combine(sourceTex, blurTexes, inputTex, bloomFactor, paintToScreen) {
        if (!paintToScreen) {
            if (this._combineTex.width !== sourceTex.width || this._combineTex.height !== sourceTex.height) {
                this._combineFBO.resize(sourceTex.width, sourceTex.height);
            }
        }
        let uniforms = this._combineUniforms;
        const { blurTex0, blurTex1 } = blurTexes;
        if (!uniforms) {
            uniforms = this._combineUniforms = {
            };
        }
        uniforms['textureBloomBlur1'] = blurTex0;
        uniforms['textureBloomBlur2'] = blurTex1;
        uniforms['factor'] = bloomFactor;
        uniforms['textureInput'] = inputTex;
        uniforms['textureSource'] = sourceTex;

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
                width: context => {
                    return context.framebufferWidth;
                },
                height: context => {
                    return context.framebufferHeight;
                }
            };
            this._blurPass = new BloomBlurPass(this._regl);
            this._combineShader = new QuadShader({
                vert: quadVert,
                frag: combineFrag,
                uniforms: [
                    'factor',
                    'textureBloomBlur1',
                    'textureBloomBlur2',
                    'textureInput',
                    'textureSource',
                ],
                extraCommandProps: {
                    viewport
                }
            });
        }
    }
}

export default BloomPass;
