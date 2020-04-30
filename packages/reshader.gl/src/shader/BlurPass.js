import Renderer from '../Renderer.js';
import QuadShader from './QuadShader.js';
import quadVert from './glsl/quad.vert';
import blur0Frag from './glsl/blur0.frag';
import blur1Frag from './glsl/blur1.frag';
import blur2Frag from './glsl/blur2.frag';
import blur3Frag from './glsl/blur3.frag';
import blur4Frag from './glsl/blur4.frag';
import blur5Frag from './glsl/blur5.frag';
import blur6Frag from './glsl/blur6.frag';
import { vec2 } from 'gl-matrix';

class BlurPass {
    constructor(regl, inputRGBM, level = 5) {
        this._regl = regl;
        this._renderer = new Renderer(regl);
        this._inputRGBM = inputRGBM;
        this._level = level;
    }

    render(sourceTex) {
        this._initShaders();
        this._createTextures(sourceTex);

        //blur
        this._blur(sourceTex);

        const result = {
            blurTex0: this._blur01Tex,
            blurTex1: this._blur11Tex,
            blurTex2: this._blur21Tex,
            blurTex3: this._blur31Tex,
            blurTex4: this._blur41Tex
        };
        if (this._level > 5) {
            result.blurTex5 = this._blur51Tex;
            result.blurTex6 = this._blur61Tex;
        }
        return result;
    }

    _blur(curTex) {
        let uniforms = this._blurUniforms;
        if (!uniforms) {
            uniforms = this._blurUniforms = {
                'uRGBMRange': 7,
                'uBlurDir': [0, 0],
                'uGlobalTexSize': [0, 0],
                'uPixelRatio': [1, 1],
                'uTextureBlurInputRatio': [1, 1],
                'uTextureBlurInputSize': [0, 0],
                'uTextureOutputRatio': [1, 1],
                'uTextureOutputSize': [0, 0],
            };
        }
        vec2.set(uniforms['uGlobalTexSize'], curTex.width, curTex.height);

        this._blurOnce(this._blur0Shader, curTex, this._blur00FBO, this._blur01FBO, this._level > 5 ? 0.5 : 1);
        this._blurOnce(this._blur1Shader, this._blur01FBO.color[0], this._blur10FBO, this._blur11FBO, 0.5);
        this._blurOnce(this._blur2Shader, this._blur11FBO.color[0], this._blur20FBO, this._blur21FBO, 0.5);
        this._blurOnce(this._blur3Shader, this._blur21FBO.color[0], this._blur30FBO, this._blur31FBO, 0.5);
        this._blurOnce(this._blur4Shader, this._blur31FBO.color[0], this._blur40FBO, this._blur41FBO, 0.5);
        if (this._level > 5) {
            this._blurOnce(this._blur5Shader, this._blur41FBO.color[0], this._blur50FBO, this._blur51FBO, 0.5);
            this._blurOnce(this._blur6Shader, this._blur51FBO.color[0], this._blur60FBO, this._blur51FBO, 0.5);
        }
    }

    _blurOnce(shader, inputTex, output0, output1, sizeRatio) {
        const w = Math.ceil(sizeRatio * inputTex.width);
        const h = Math.ceil(sizeRatio * inputTex.height);
        if (output0.width !== w || output0.height !== h) {
            output0.resize(w, h);
        }
        if (output1.width !== w || output1.height !== h) {
            output1.resize(w, h);
        }

        const uniforms = this._blurUniforms;
        uniforms['TextureBlurInput'] = inputTex;
        //第一次输入是否需要decode rgbm
        uniforms['inputRGBM'] = +this._inputRGBM;
        vec2.set(uniforms['uBlurDir'], 0, 1);
        vec2.set(uniforms['uTextureBlurInputSize'], inputTex.width, inputTex.height);
        vec2.set(uniforms['uTextureOutputSize'], output0.width, output0.height);
        this._renderer.render(shader, uniforms, null, output0);

        uniforms['inputRGBM'] = 1;
        vec2.set(uniforms['uBlurDir'], 1, 0);
        uniforms['TextureBlurInput'] = output0.color[0];
        vec2.set(uniforms['uTextureBlurInputSize'], output0.width, output0.height);
        this._renderer.render(shader, uniforms, null, output1);
    }

    dispose() {
        if (this._blur0Shader) {
            this._blur0Shader.dispose();
            delete this._blur0Shader;
            this._blur1Shader.dispose();
            this._blur2Shader.dispose();
            this._blur3Shader.dispose();
            this._blur4Shader.dispose();
            if (this._blur5Shader) {
                this._blur5Shader.dispose();
                this._blur6Shader.dispose();
                delete this._blur5Shader;
            }
        }
        if (this._blur00Tex) {
            delete this._blur00Tex;
            this._blur00FBO.destroy();
            this._blur01FBO.destroy();
            this._blur10FBO.destroy();
            this._blur11FBO.destroy();
            this._blur20FBO.destroy();
            this._blur21FBO.destroy();
            this._blur30FBO.destroy();
            this._blur31FBO.destroy();
            this._blur40FBO.destroy();
            this._blur41FBO.destroy();
            if (this._blur50FBO) {
                this._blur50FBO.destroy();
                this._blur51FBO.destroy();
                this._blur60FBO.destroy();
                this._blur61FBO.destroy();
            }
        }
    }

    _createTextures(tex) {
        if (this._blur00Tex) {
            return;
        }
        let w = tex.width, h = tex.height;

        this._blur00Tex = this._createColorTex(tex, w, h, 'uint8');
        this._blur00FBO = this._createBlurFBO(this._blur00Tex);
        this._blur01Tex = this._createColorTex(tex);
        this._blur01FBO = this._createBlurFBO(this._blur01Tex);

        w = Math.ceil(w / 2);
        h = Math.ceil(h / 2);
        this._blur10Tex = this._createColorTex(tex, w, h, 'uint8');
        this._blur10FBO = this._createBlurFBO(this._blur10Tex);
        this._blur11Tex = this._createColorTex(tex, w, h, 'uint8');
        this._blur11FBO = this._createBlurFBO(this._blur11Tex);

        w = Math.ceil(w / 2);
        h = Math.ceil(h / 2);
        this._blur20Tex = this._createColorTex(tex, w, h, 'uint8');
        this._blur20FBO = this._createBlurFBO(this._blur20Tex);
        this._blur21Tex = this._createColorTex(tex, w, h, 'uint8');
        this._blur21FBO = this._createBlurFBO(this._blur21Tex);

        w = Math.ceil(w / 2);
        h = Math.ceil(h / 2);
        this._blur30Tex = this._createColorTex(tex, w, h, 'uint8');
        this._blur30FBO = this._createBlurFBO(this._blur30Tex);
        this._blur31Tex = this._createColorTex(tex, w, h, 'uint8');
        this._blur31FBO = this._createBlurFBO(this._blur31Tex);

        w = Math.ceil(w / 2);
        h = Math.ceil(h / 2);
        this._blur40Tex = this._createColorTex(tex, w, h, 'uint8');
        this._blur40FBO = this._createBlurFBO(this._blur40Tex);
        this._blur41Tex = this._createColorTex(tex, w, h, 'uint8');
        this._blur41FBO = this._createBlurFBO(this._blur41Tex);

        if (this._level > 5) {
            w = Math.ceil(w / 2);
            h = Math.ceil(h / 2);
            this._blur50Tex = this._createColorTex(tex, w, h, 'uint8');
            this._blur50FBO = this._createBlurFBO(this._blur50Tex);
            this._blur51Tex = this._createColorTex(tex, w, h, 'uint8');
            this._blur51FBO = this._createBlurFBO(this._blur51Tex);

            w = Math.ceil(w / 2);
            h = Math.ceil(h / 2);
            this._blur60Tex = this._createColorTex(tex, w, h, 'uint8');
            this._blur60FBO = this._createBlurFBO(this._blur60Tex);
            this._blur61Tex = this._createColorTex(tex, w, h, 'uint8');
            this._blur61FBO = this._createBlurFBO(this._blur61Tex);
        }

    }

    _createColorTex(curTex, w, h, dataType) {
        const regl = this._regl;
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
        const regl = this._regl;
        return regl.framebuffer({
            width: tex.width,
            height: tex.height,
            colors: [tex],
            depth: false,
            stencil: false
        });
    }

    _initShaders() {
        if (!this._blur0Shader) {
            const config = {
                vert: quadVert,
                uniforms: [
                    'inputRGBM',
                    'uRGBMRange',
                    'TextureBlurInput',
                    'uBlurDir',
                    'uGlobalTexSize',
                    'uPixelRatio',
                    'uTextureBlurInputRatio',
                    'uTextureBlurInputSize',
                    'uTextureOutputRatio',
                    'uTextureOutputSize',
                ],
                extraCommandProps: {
                    viewport: {
                        x: 0,
                        y: 0,
                        width : (context, props) => {
                            return props['uTextureOutputSize'][0];
                        },
                        height : (context, props) => {
                            return props['uTextureOutputSize'][1];
                        }
                    }
                }
            };

            config.frag = blur0Frag;
            this._blur0Shader = new QuadShader(config);
            config.frag = blur1Frag;
            this._blur1Shader = new QuadShader(config);
            config.frag = blur2Frag;
            this._blur2Shader = new QuadShader(config);
            config.frag = blur3Frag;
            this._blur3Shader = new QuadShader(config);
            config.frag = blur4Frag;
            this._blur4Shader = new QuadShader(config);

            if (this._level > 5) {
                config.frag = blur5Frag;
                this._blur5Shader = new QuadShader(config);

                config.frag = blur6Frag;
                this._blur6Shader = new QuadShader(config);
            }
        }
    }
}

export default BlurPass;
