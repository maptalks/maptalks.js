import { vec2, vec4, mat4 } from 'gl-matrix';
import Renderer from '../Renderer.js';
import CopyDepthShader from './CopyDepthShader.js';

import quadVert from './glsl/quad.vert';
import quadFrag from './glsl/quad.frag';
import QuadShader from './QuadShader.js';

class SsrPass {

    static getUniformDeclares() {
        const corners = [[0, 0, 0, 0], [0, 0, 0, 0]];
        const invProjMatrix = new Array(16);
        return [
            {
                name: 'invProjMatrix',
                type : 'function',
                fn : (context, props) => {
                    return mat4.invert(invProjMatrix, props['projMatrix']);
                }
            },
            {
                name: 'outputFovInfo',
                type: 'array',
                length: 2,
                fn: function (context, props) {
                    const cornerY = Math.tan(0.5 * props['fov']);
                    const width = props['outSize'][0];
                    const height = props['outSize'][1];
                    const aspect = width / height;
                    const cornerX = aspect * cornerY;
                    vec4.set(corners[0], cornerX, cornerY, cornerX, -cornerY);
                    vec4.set(corners[1], -cornerX, cornerY, -cornerX, -cornerY);
                    return corners;
                }
            },
            {
                name: 'reprojViewProjMatrix',
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

    getSSRUniforms(map, factor, quality) {
        if (!this._depthCopy) {
            return null;
        }
        const depthTex = this._depthCopy;
        const texture = this.getMipmapTexture();
        // const thickness = map.distanceToPoint(50, 0, map.getGLZoom());
        const uniforms = {
            'TextureDepth': depthTex,
            // 'TextureSource': currentTex,
            'TextureReflected': texture,
            'ssrFactor': factor || 1,
            'ssrQuality': quality || 2,
            // 'uPreviousGlobalTexSize': [texture.width, texture.height / 2],
            'outSize': [depthTex.width, depthTex.height],
            // 'uTextureReflectedSize': [texture.width, texture.height],
            'fov': map.getFov() * Math.PI / 180,
            'prevProjViewMatrix': this._projViewMatrix || map.projViewMatrix,
            'cameraWorldMatrix': map.cameraWorldMatrix
            // 'ssrThickness': thickness.x
        };
        return uniforms;
    }

    genMipMap(sourceTex, depthTex, projViewMatrix) {
        this.setup(sourceTex);
        this._mipmap(sourceTex);
        this.copyDepthTex(depthTex);
        if (!this._projViewMatrix) {
            this._projViewMatrix = [];
        }
        mat4.copy(this._projViewMatrix, projViewMatrix);
        delete this._depthCopied;
        return this._outputTex;
    }

    getPrevProjViewMatrix() {
        return this._projViewMatrix;
    }

    copyDepthTex(depthTex) {
        // 说明depth已经在drawSSR阶段复制过了
        if (this._depthCopied) {
            return null;
        }
        this.setup(depthTex);
        if (!this._depthCopy) {
            const info = {
                min: 'nearest',
                mag: 'nearest',
                mipmap: false,
                type: 'uint8',
                width: depthTex.width,
                height: depthTex.height,
            };
            this._depthCopy = this._regl.texture(info);
            const fboInfo = {
                width: depthTex.width,
                height: depthTex.height,
                colors: [this._depthCopy],
                // stencil: true,
                // colorCount,
                colorFormat: 'rgba'
            };
            this._depthCopyFBO = this._regl.framebuffer(fboInfo);
        } else if (depthTex.width !== this._depthCopy.width || depthTex.height !== this._depthCopy.height) {
            this._depthCopyFBO.resize(depthTex.width, depthTex.height);
        }
        this._renderer.render(this._copyDepthShader, {
            'TextureDepth': depthTex
        }, null, this._depthCopyFBO);
        this._depthCopied = true;
        return this._depthCopy;
    }

    _mipmap(inputTex) {
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
                'rgbmRange': 7,
                'outputSize': [0, 0],
            };
        }

        uniforms['TextureInput'] = inputTex;
        uniforms['inputRGBM'] = +this._inputRGBM;
        vec2.set(uniforms['outputSize'], output.width, output.height);

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
        if (this._copyDepthShader) {
            this._ssrQuadShader.dispose();
            this._copyDepthShader.dispose();

            this._targetFBO.destroy();

            delete this._copyDepthShader;
        }
        if (this._depthCopy) {
            this._depthCopyFBO.destroy();
            delete this._depthCopy;
            delete this._depthCopyFBO;
        }
    }

    _initShaders() {
        if (!this._copyDepthShader) {
            this._copyDepthShader = new CopyDepthShader();

            const config = {
                vert: quadVert,
                frag: quadFrag,
                extraCommandProps: {
                    viewport: {
                        x: 0,
                        y: 0,
                        width : (context, props) => {
                            return props['outputSize'][0];
                        },
                        height : (context, props) => {
                            return props['outputSize'][1];
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
        }
    }
}

export default SsrPass;
