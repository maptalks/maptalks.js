import { getWGSLSource } from '../gpu/WGSLSources';
import Renderer from '../Renderer.js';
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

    render(sourceTex, bloomTex, bloomThreshold, bloomFactor, bloomRadius, noAaSource, pointSource, enableAA, paintToScreen) {
        this._initShaders();
        this._createTextures(sourceTex);

        //blur
        const blurTexes = this._blurPass.render(bloomTex, bloomThreshold);

        //combine
        const output = this._combine(sourceTex, blurTexes, bloomTex, bloomFactor, bloomRadius, noAaSource, pointSource, enableAA, paintToScreen);

        return output;
    }

    _combine(sourceTex, blurTexes, inputTex, bloomFactor, bloomRadius, noAaSource, pointSource, enableAA, paintToScreen) {
        if (!paintToScreen) {
            if (this._combineTex.width !== sourceTex.width || this._combineTex.height !== sourceTex.height) {
                this._combineFBO.resize(sourceTex.width, sourceTex.height);
            }
        }


        let uniforms = this._combineUniforms;
        const { blurTex0, blurTex1, blurTex2, blurTex3, blurTex4 } = blurTexes;
        if (!uniforms) {
            uniforms = this._combineUniforms = {
                'bloomFactor': 0,
                'bloomRadius': 0,
                'rgbmRange': 7,
                'TextureBloomBlur1': blurTex0,
                'TextureBloomBlur2': blurTex1,
                'TextureBloomBlur3': blurTex2,
                'TextureBloomBlur4': blurTex3,
                'TextureBloomBlur5': blurTex4,
                'TextureInput': null,
                'TextureSource': null,
                'outputSize': [0, 0],
            };
        }
        uniforms['noAaTextureSource'] = noAaSource;
        uniforms['pointTextureSource'] = pointSource;
        uniforms['enableAA'] = enableAA;
        uniforms['bloomFactor'] = bloomFactor;
        uniforms['bloomRadius'] = bloomRadius;
        uniforms['TextureInput'] = inputTex;
        uniforms['TextureSource'] = sourceTex;
        vec2.set(uniforms['outputSize'], sourceTex.width, sourceTex.height);

        const shaderDefines = {};
        if (sourceTex.config && sourceTex.config.sampleCount > 1) {
            shaderDefines['HAS_MULTISAMPLED'] = 1;
        }
        this._combineShader.setDefines(shaderDefines);
        this._renderer.render(this._combineShader, uniforms, null, paintToScreen ? null : this._combineFBO);
        return paintToScreen ? null : this._combineTex;
    }

    dispose() {
        if (this._combineFBO) {
            this._combineFBO.destroy();
            delete this._combineFBO;
        }
        if (this._blurPass) {
            this._blurPass.dispose();
            delete this._blurPass;
        }
        delete this._uniforms;
    }


    _createTextures(tex) {
        if (this._combineTex) {
            return;
        }
        const w = tex.width, h = tex.height;

        this._combineTex = this._createColorTex(tex, w, h, 'uint8');
        this._combineFBO = this._createBlurFBO(this._combineTex);

    }

    _createColorTex(curTex, w, h, dataType) {
        const regl = this._renderer.device;
        const type = dataType;
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
        const regl = this._renderer.device;
        return regl.framebuffer({
            width: tex.width,
            height: tex.height,
            colors: [tex],
            depth: false,
            stencil: false
        });
    }

    _initShaders() {
        if (!this._combineShader) {
            const viewport = {
                x: 0,
                y: 0,
                width : (context, props) => {
                    return props['outputSize'][0];
                },
                height : (context, props) => {
                    return props['outputSize'][1];
                }
            };
            this._blurPass = new BlurPass(this._regl, false);
            this._combineShader = new QuadShader({
                name: 'bloom-combine',
                vert: quadVert,
                frag: combineFrag,
                wgslVert: getWGSLSource('gl_quad_vert'),
                wgslFrag: getWGSLSource('gl_bloom_combine_frag'),
                extraCommandProps: {
                    viewport
                }
            });
        }
    }
}

export default BloomPass;
