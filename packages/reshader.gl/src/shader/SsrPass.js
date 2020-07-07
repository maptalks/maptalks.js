import { vec2, vec4, mat4 } from 'gl-matrix';
import Renderer from '../Renderer.js';
import SsrMipmapShader from './SsrMipmapShader.js';
import SsrCombineShader from './SsrCombineShader.js';
// import BoxBlurShader from './BoxBlurShader.js';

import quadVert from './glsl/quad.vert';
import quadFrag from './glsl/quad.frag';
import QuadShader from './QuadShader.js';

class SsrPass {

    static getUniformDeclares() {
        const corners = [[0, 0, 0, 0], [0, 0, 0, 0]];
        const invProjMatrix = new Array(16);
        return [
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
                    const width = props['uGlobalTexSize'][0];
                    const height = props['uGlobalTexSize'][1];
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
                    return mat4.multiply([], props['prevProjViewMatrix'], props['cameraWorldMatrix']);
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
        this._inputRGBM = 0;
    }

    setup(sourceTex) {
        this._initShaders();
        this._createTextures(sourceTex);
    }

    // _blur(tex) {
    //     this._initShaders();
    //     this._createTextures(tex);
    //     if (this._blurFBO.width !== tex.width ||
    //         this._blurFBO.height !== tex.height) {
    //         this._blurFBO.resize(tex.width, tex.height);
    //     }
    //     this._renderer.render(this._blurShader, {
    //         resolution: [tex.width, tex.height],
    //         textureSource:tex,
    //         uRGBMRange: 7,
    //         ignoreTransparent: 1
    //     }, null, this._blurFBO);
    //     return this._blurFBO.color[0];
    // }

    combine(sourceTex, ssrTex) {
        this.setup(sourceTex);
        if (this._combineFBO.width !== sourceTex.width ||
            this._combineFBO.height !== sourceTex.height) {
            this._combineFBO.resize(sourceTex.width, sourceTex.height);
        }
        // ssrTex = this._blur(ssrTex);
        this._renderer.render(this._combineShader, {
            TextureInput: sourceTex,
            TextureSSR: ssrTex,
            uTextureOutputSize: [sourceTex.width, sourceTex.height]
        }, null, this._combineFBO);
        return this._combineTex;
    }

    genMipMap(sourceTex) {
        this._ssrBlur(sourceTex);
        return this._outputTex;
    }

    _ssrBlur(inputTex) {
        const output = this._targetFBO;

        const sizeRatio = 0.5;
        const w = Math.ceil(sizeRatio * inputTex.width);
        const h = Math.ceil(sizeRatio * inputTex.height);
        if (output.width !== w || output.height !== h) {
            output.resize(w, h);
        }

        let uniforms = this._blurUniforms;
        if (!uniforms) {
            uniforms = this._blurUniforms = {
                'uRGBMRange': 7,
                'uTextureOutputSize': [0, 0],
            };
        }

        uniforms['TextureBlurInput'] = inputTex;
        uniforms['inputRGBM'] = +this._inputRGBM;
        vec2.set(uniforms['uTextureOutputSize'], output.width, output.height);

        uniforms['TextureBlurInput'] = inputTex;
        this._renderer.render(this._ssrQuadShader, uniforms, null, output);
    }

    getMipmapTexture() {
        if (!this._outputTex) {
            this._outputTex = this._renderer.regl.texture({
                type: 'uint8',
                width: 2,
                height: 2
            });
        }
        return this._outputTex;
    }

    dispose() {
        if (this._combineShader) {
            this._mipmapShader.dispose();
            // this._blurShader.dispose();
            this._ssrQuadShader.dispose();

            this._targetFBO.destroy();
            this._combineFBO.destroy();
            this._blurFBO.destroy();

            delete this._combineShader;
        }
    }

    _initShaders() {
        if (!this._combineShader) {
            this._mipmapShader = new SsrMipmapShader();
            this._combineShader = new SsrCombineShader();
            // this._blurShader = new BoxBlurShader({ blurOffset: 2 });

            const config = {
                vert: quadVert,
                frag: quadFrag,
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
            this._ssrQuadShader = new QuadShader(config);
        }
    }

    _createTextures(sourceTex) {
        if (!this._targetFBO) {
            const regl = this._regl;

            if (this._outputTex) {
                this._outputTex.destroy();
            }

            this._outputTex = regl.texture({
                min: 'linear',
                mag: 'linear',
                type: 'uint8',
                width: sourceTex.width,
                height: sourceTex.height
            });

            this._targetFBO = regl.framebuffer({
                width: sourceTex.width,
                height: sourceTex.height,
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
            this._combineFBO = regl.framebuffer({
                width: sourceTex.width,
                height: sourceTex.height,
                colors: [this._combineTex],
                depth: false,
                stencil: false
            });

            this._blurTex = regl.texture({
                min: 'linear',
                mag: 'linear',
                type: 'uint8',
                width: sourceTex.width,
                height: sourceTex.height
            });
            this._blurFBO = regl.framebuffer({
                width: sourceTex.width,
                height: sourceTex.height,
                colors: [this._blurTex],
                depth: false,
                stencil: false
            });
        }
    }
}

export default SsrPass;
