import Renderer from '../Renderer.js';
import QuadShader from './QuadShader.js';
import blurFrag from './glsl/bloom_blur.frag';
import { vec2 } from 'gl-matrix';

class BloomBlurPass {
    constructor(regl) {
        this._regl = regl;
        this._renderer = new Renderer(regl);
    }

    render(sourceTex, radius, threshold) {
        this._initShaders();
        this._createTextures(sourceTex.width, sourceTex.height);
        //blur
        this._blur(sourceTex, radius, threshold);
        const result = {
            blurTex0: this._blur01Tex,
            blurTex1: this._blur11Tex
        };
        return result;
    }

    _blur(curTex, radius, threshold) {
        this._blurOnce(curTex, this._blur00FBO, this._blur01FBO, radius, threshold, 0.3);
        this._blurOnce(this._blur01FBO, this._blur10FBO, this._blur11FBO, radius, 0, 0.6);
    }

    _blurOnce(inputTex, output0, output1, radius, threshold, delta) {
        delta *= radius;
        const shader = this._blurShader;
        const w = Math.floor(0.5 * inputTex.width);
        const h = Math.floor(0.5 * inputTex.height);
        if (output0.width !== w || output0.height !== h) {
            output0.resize(w, h);
        }
        if (output1.width !== w || output1.height !== h) {
            output1.resize(w, h);
        }
        const uniforms = this._blurUniforms = this._blurUniforms || {
            textureSampler: inputTex,
            bloomThreshold: threshold,
            resolution: [0, 0],
            direction: [0, 0],
        };
        uniforms['bloomThreshold'] = threshold;
        uniforms['textureSampler'] = inputTex;
        vec2.set(uniforms['resolution'], w, h);
        vec2.set(uniforms['direction'], delta, 0);
        this._renderer.render(shader, uniforms, null, output0);

        uniforms['textureSampler'] = output0;
        uniforms['bloomThreshold'] = 0; //turn off extract bright
        vec2.set(uniforms['direction'], 0, delta);
        this._renderer.render(shader, uniforms, null, output1);
    }

    dispose() {
        if (this._blurShader) {
            this._blurShader.dispose();
            delete this._blurShader;
        }
        if (this._blur00Tex) {
            delete this._blur00Tex;
            this._blur00FBO.destroy();
            this._blur01FBO.destroy();
            this._blur10FBO.destroy();
            this._blur11FBO.destroy();
        }
    }

    _createTextures(w, h) {
        if (this._blur00Tex) {
            return;
        }
        const type = 'uint8';
        w = Math.floor(w / 2);
        h = Math.floor(h / 2);

        this._blur00Tex = this._createColorTex(w, h, type);
        this._blur00FBO = this._createBlurFBO(this._blur00Tex);
        this._blur01Tex = this._createColorTex(w, h, type);
        this._blur01FBO = this._createBlurFBO(this._blur01Tex);

        w = Math.floor(w / 2);
        h = Math.floor(h / 2);
        this._blur10Tex = this._createColorTex(w, h, type);
        this._blur10FBO = this._createBlurFBO(this._blur10Tex);
        this._blur11Tex = this._createColorTex(w, h, type);
        this._blur11FBO = this._createBlurFBO(this._blur11Tex);
    }

    _createColorTex(width, height, dataType) {
        const regl = this._regl;
        const type = dataType;
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
                frag: blurFrag,
                extraCommandProps: {
                    viewport: {
                        x: 0,
                        y: 0,
                        width : (context, props) => {
                            return props.resolution[0];
                        },
                        height : (context, props) => {
                            return props.resolution[1];
                        }
                    }
                }
            };
            this._blurShader = new QuadShader(config);
        }
    }
}

export default BloomBlurPass;
