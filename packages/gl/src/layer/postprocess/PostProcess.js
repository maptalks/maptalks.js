import * as reshader from '@maptalks/reshader.gl';
import { vec2, mat4 } from 'gl-matrix';

const RESOLUTION = [];
const bloomFilter = m => m.getUniform('bloom');
const ssrFilter = m => m.getUniform('ssr');

export default class PostProcess {
    constructor(regl, layer, jitter) {
        this._regl = regl;
        this._layer = layer;
        this._renderer = new reshader.Renderer(regl);
        this._fxaaShader = new reshader.FxaaShader();
        this._taaPass = new reshader.TaaPass(this._renderer, jitter);
    }

    setContextIncludes(/*context*/) {
        // if (this._layer.getRenderer().isEnableSSAO() && this._ssaoPass && !context.ssao) {
        //     const ssao = {
        //         defines: reshader.SsrPass.getDefines(),
        //         uniformDeclares: reshader.SsrPass.getUniformDeclares()
        //     };
        //     ssao.renderUniforms = {
        //         prevProjViewMatrix: this._ssaoPass.getPrevProjViewMatrix(),
        //         sSsaoTexture: this._ssaoPass.getSsaoTexture()
        //     };
        //     context.ssao = ssao;
        //     context.includes.ssao = 1;
        // }
    }

    bloom(curTex, depthTex, threshold, bloomFactor, bloomRadius) {
        const painted = this._drawBloom(depthTex);
        if (!painted) {
            return curTex;
        }
        if (!this._bloomPass) {
            this._bloomPass = new reshader.BloomPass(this._regl);
        }
        const bloomTex = this._bloomFBO.color[0];
        return this._bloomPass.render(curTex, bloomTex, threshold, bloomFactor, bloomRadius);
    }

    _drawBloom(depthTex) {
        const layerRenderer = this._layer.getRenderer();

        const regl = this._regl;
        const bloomFBO = this._bloomFBO;
        if (!bloomFBO) {
            const info = this._createFBOInfo(depthTex);
            this._bloomFBO = regl.framebuffer(info);
        } else {
            const { width, height } = layerRenderer.canvas;
            if (bloomFBO.width !== width || bloomFBO.height !== height) {
                bloomFBO.resize(width, height);
            }
            regl.clear({
                color: [0, 0, 0, 0],
                framebuffer: bloomFBO
            });
        }
        const timestamp = layerRenderer.getFrameTime();
        const event = layerRenderer.getFrameEvent();
        const context = layerRenderer.getFrameContext();
        const renderMode = context.renderMode;
        const sceneFilter = context.sceneFilter;
        const renderTarget = context.renderTarget;
        context.renderMode = 'default';
        context['sceneFilter'] = bloomFilter;
        context.renderTarget = {
            fbo: this._bloomFBO,
            getFramebuffer,
            getDepthTexture
        };
        const fGL = layerRenderer.glCtx;
        fGL.resetDrawCalls();
        if (event) {
            layerRenderer.forEachRenderer(renderer => {
                layerRenderer.clearStencil(renderer, bloomFBO);
                renderer.drawOnInteracting(event, timestamp, context);
            });
        } else {
            layerRenderer.forEachRenderer(renderer => {
                layerRenderer.clearStencil(renderer, bloomFBO);
                renderer.draw(timestamp, context);
            });
        }
        context.renderMode = renderMode;
        context.sceneFilter = sceneFilter;
        context.renderTarget = renderTarget;

        return fGL.getDrawCalls();
    }

    genSsrMipmap(tex) {
        if (!this._ssrPass || !this._ssrPainted) {
            return;
        }
        this._ssrPass.genMipMap(tex);
        if (!this._ssrFBO._projViewMatrix) {
            this._ssrFBO._projViewMatrix = [];
        }
        mat4.copy(this._ssrFBO._projViewMatrix, this._layer.getMap().projViewMatrix);
    }

    setupSSR(tex) {
        if (!this._ssrPass) {
            this._ssrPass = new reshader.SsrPass(this._regl);
        }
        this._ssrPass.setup(tex);
    }

    ssr(currentTex) {
        if (!this._ssrFBO || !this._ssrPainted) {
            return currentTex;
        }
        //合并ssr和原fbo中的像素
        const ssrTex = this._ssrFBO.color[0];
        return this._ssrPass.combine(currentTex, ssrTex);
    }

    drawSSR(depthTex) {
        //遍历开启了ssr的mesh重新绘制一遍，并只绘制有ssr的像素，discard掉其他像素
        const regl = this._regl;
        const layerRenderer = this._layer.getRenderer();
        const timestamp = layerRenderer.getFrameTime();
        const event = layerRenderer.getFrameEvent();
        const context = layerRenderer.getFrameContext();
        if (!this._ssrPass) {
            this._ssrPass = new reshader.SsrPass(regl);
        }
        let ssrFBO = this._ssrFBO;
        let ssrDepthTestFBO = this._ssrDepthTestFBO;
        if (!ssrFBO) {
            const info = this._createFBOInfo();
            ssrFBO = this._ssrFBO = regl.framebuffer(info);
            const depthTestInfo = this._createFBOInfo(depthTex);
            ssrDepthTestFBO = this._ssrDepthTestFBO = regl.framebuffer(depthTestInfo);
        } else {
            const { width, height } = layerRenderer.canvas;
            if (ssrFBO.width !== width || ssrFBO.height !== height) {
                ssrFBO.resize(width, height);
            }
            if (ssrDepthTestFBO.width !== width || ssrDepthTestFBO.height !== height) {
                ssrDepthTestFBO.resize(width, height);
            }
            regl.clear({
                color: [0, 0, 0, 0],
                depth: 1,
                framebuffer: ssrFBO
            });
        }
        context.ssr = this._prepareSSRContext(depthTex);
        const renderMode = context.renderMode;
        const filter = context['sceneFilter'];
        context.renderMode = 'default';
        context['sceneFilter'] = ssrFilter;
        const fGL = layerRenderer.glCtx;
        let cleared = false;
        if (event) {
            layerRenderer.forEachRenderer(renderer => {
                layerRenderer.clearStencil(renderer, ssrFBO);
                layerRenderer.clearStencil(renderer, ssrDepthTestFBO);
                if (!cleared) {
                    fGL.resetDrawCalls();
                    cleared = true;
                }
                renderer.drawOnInteracting(event, timestamp, context);
            });
        } else {
            layerRenderer.forEachRenderer(renderer => {
                layerRenderer.clearStencil(renderer, ssrFBO);
                layerRenderer.clearStencil(renderer, ssrDepthTestFBO);
                if (!cleared) {
                    fGL.resetDrawCalls();
                    cleared = true;
                }
                renderer.draw(timestamp, context);
            });
        }
        const groundPainted = layerRenderer.drawGround();
        //以免和bloom冲突
        delete context.ssr;
        context.renderMode = renderMode;
        context['sceneFilter'] = filter;
        this._ssrPainted = fGL.getDrawCalls() > 0;
        return groundPainted;
    }

    _prepareSSRContext(depthTex) {
        const sceneConfig =  this._layer._getSceneConfig();
        const config = sceneConfig && sceneConfig.postProcess;
        const map = this._layer.getMap();
        const texture = this._ssrPass.getMipmapTexture();
        const ssrFBO = this._ssrFBO;
        const ssrDepthTestFBO = this._ssrDepthTestFBO;
        return {
            renderUniforms: {
                'TextureDepthTest': this._ssrDepthTestFBO.color[0],
                'TextureDepth': depthTex,
                // 'TextureSource': currentTex,
                'TextureToBeRefracted': texture,
                'uSsrFactor': config.ssr.factor || 1,
                'uSsrQuality': config.ssr.quality || 2,
                'uPreviousGlobalTexSize': [texture.width, texture.height / 2],
                'uGlobalTexSize': [depthTex.width, depthTex.height],
                'uTextureToBeRefractedSize': [texture.width, texture.height],
                'fov': map.getFov() * Math.PI / 180,
                'prevProjViewMatrix': ssrFBO._projViewMatrix || map.projViewMatrix,
                'cameraWorldMatrix': map.cameraWorldMatrix
            },
            fbo: ssrFBO,
            depthTestFbo: ssrDepthTestFBO
        };
    }

    taa(curTex, depthTex, {
        projMatrix, projViewMatrix, cameraWorldMatrix,
        fov, near, far, needClear, taa
    }) {
        const pass = this._taaPass;
        const outputTex = pass.render(
            curTex, depthTex,
            projMatrix, projViewMatrix, cameraWorldMatrix,
            fov, near, far, needClear, taa
        );
        const redraw = pass.needToRedraw();
        return {
            outputTex,
            redraw
        };
    }

    ssao(sourceTex, depthTex, uniforms) {
        if (!this._ssaoPass) {
            this._ssaoPass = new reshader.SsaoPass(this._renderer);
            this._layer.getRenderer().setToRedraw();
        }
        return this._ssaoPass.render({
            projMatrix: uniforms['projMatrix'],
            cameraNear: uniforms['cameraNear'],
            cameraFar: uniforms['cameraFar'],
            bias: uniforms['ssaoBias'],
            radius: uniforms['ssaoRadius'],
            intensity: uniforms['ssaoIntensity'],
            quality: 0.6
        }, sourceTex, depthTex);
    }

    fxaa(source, noAaSource, enableFXAA, enableToneMapping, enableSharpen, pixelRatio, sharpFactor) {
        this._renderer.render(this._fxaaShader, {
            textureSource: source,
            noAaTextureSource: noAaSource,
            resolution: vec2.set(RESOLUTION, source.width, source.height),
            enableFXAA,
            enableToneMapping,
            enableSharpen, pixelRatio, sharpFactor

        });
    }

    //filmic grain + vigenett
    postprocess(fbo, uniforms, src) {
        if (!this._postProcessShader) {
            this._postProcessShader = new reshader.PostProcessShader();
        }
        const source = src || fbo.color[0];
        uniforms['resolution'] = vec2.set(RESOLUTION, source.width, source.height);
        uniforms['textureSource'] = source;
        uniforms['timeGrain'] = performance.now();
        this._renderer.render(this._postProcessShader, uniforms);
        return this._target;
    }

    dispose() {
        if (this._bloomFBO) {
            this._bloomFBO.destroy();
            delete this._bloomFBO;
        }
        if (this._ssrFBO) {
            this._ssrFBO.destroy();
            this._ssrDepthTestFBO.destroy();
            delete this._ssrFBO;
        }
        if (this._taaPass) {
            this._taaPass.dispose();
            delete this._taaPass;
        }
        if (this._ssaoPass) {
            this._ssaoPass.dispose();
            delete this._ssaoPass;
        }
        if (this._bloomPass) {
            this._bloomPass.dispose();
            delete this._bloomPass;
        }
        if (this._postProcessShader) {
            this._postProcessShader.dispose();
            delete this._postProcessShader;
        }
        if (this._fxaaShader) {
            this._fxaaShader.dispose();
            delete this._fxaaShader;
        }
    }

    _createFBOInfo(depthTex) {
        const { width, height } = this._layer.getRenderer().canvas;
        const regl = this._regl;
        const type = 'uint8';//colorType || regl.hasExtension('OES_texture_half_float') ? 'float16' : 'float';
        const color = regl.texture({
            min: 'nearest',
            mag: 'nearest',
            type,
            width,
            height
        });
        const fboInfo = {
            width,
            height,
            colors: [color],
            // stencil: true,
            // colorCount,
            colorFormat: 'rgba'
        };
        if (depthTex) {
            fboInfo.depthStencil = depthTex;
        }
        return fboInfo;
    }
}

function getFramebuffer(fbo) {
    return fbo['_framebuffer'].framebuffer;
}

function getDepthTexture(fbo) {
    //TODO 也可能是renderbuffer
    return fbo.depthStencil._texture.texture;
}
