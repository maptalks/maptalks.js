import * as reshader from '@maptalks/reshader.gl';
import { vec2 } from '@maptalks/reshader.gl';

const RESOLUTION = [];
const bloomFilter = m => !!m.bloom;
const ssrFilter = m => !!m.ssr;

export default class PostProcess {
    constructor(regl, layer) {
        this._regl = regl;
        this._layer = layer;
        this._renderer = new reshader.Renderer(regl);
        this._fxaaShader = new reshader.FxaaShader();
        // this._taaPass = new reshader.TaaPass(this._renderer, jitter);
        this._copyShader = new reshader.CopyShader();
        this._ssrPass = new reshader.SsrPass(this._regl);
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

    bloom(curTex, noAaTex, pointTex, threshold, bloomFactor, bloomRadius, enableAA) {
        if (!this._bloomPass) {
            this._bloomPass = new reshader.BloomPass(this._regl);
        }
        const renderer = this._layer.getRenderer();
        const bloomTex = renderer._getFBOColor(this._bloomFBO);
        return this._bloomPass.render(curTex, bloomTex, threshold, bloomFactor, bloomRadius, noAaTex, pointTex, enableAA);
    }

    drawBloom(depthTex) {
        const layerRenderer = this._layer.getRenderer();

        const regl = this._regl;
        const bloomFBO = this._bloomFBO;
        if (!bloomFBO) {
            const info = this._createFBOInfo(depthTex);
            this._bloomFBO = regl.framebuffer(info);
        } else {
            const { width, height } = depthTex;
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
        context.isPostProcess = true;
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
        delete context.isPostProcess;
        context.renderMode = renderMode;
        context.sceneFilter = sceneFilter;
        context.renderTarget = renderTarget;

        return fGL.getDrawCalls();
    }

    genSsrMipmap(tex, depthTex) {
        const projViewMatrix = this._layer.getMap().projViewMatrix;
        this._ssrPass.genMipMap(tex, depthTex, projViewMatrix);
    }

    getPrevSsrProjViewMatrix() {
        return this._ssrPass && this._ssrPass.getPrevProjViewMatrix();
    }

    drawSSR(depthTex, fbo, isCopyDepth) {
        if (isCopyDepth) {
            this._ssrPass.copyDepthTex(depthTex);
        }
        //遍历开启了ssr的mesh重新绘制一遍，并只绘制有ssr的像素，discard掉其他像素
        const layerRenderer = this._layer.getRenderer();
        const timestamp = layerRenderer.getFrameTime();
        const event = layerRenderer.getFrameEvent();
        const context = layerRenderer.getFrameContext();
        context.isPostProcess = true;
        context.ssr = this.getSSRContext();
        const renderMode = context.renderMode;
        const filter = context['sceneFilter'];
        context.renderMode = 'default';
        context['sceneFilter'] = ssrFilter;
        context.renderTarget.fbo = fbo;
        const fGL = layerRenderer.glCtx;
        let cleared = false;
        if (event) {
            layerRenderer.forEachRenderer(renderer => {
                layerRenderer.clearStencil(renderer, fbo);
                if (!cleared) {
                    fGL.resetDrawCalls();
                    cleared = true;
                }
                renderer.drawOnInteracting(event, timestamp, context);
            });
        } else {
            layerRenderer.forEachRenderer(renderer => {
                layerRenderer.clearStencil(renderer, fbo);
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
        delete context.isPostProcess;
        context.renderMode = renderMode;
        context['sceneFilter'] = filter;
        this._ssrPainted = fGL.getDrawCalls() > 0;
        return groundPainted;
    }

    getSSRUniforms() {
        const sceneConfig =  this._layer._getSceneConfig();
        const config = sceneConfig && sceneConfig.postProcess;
        const map = this._layer.getMap();
        return this._ssrPass.getSSRUniforms(map, config.ssr.factor, config.ssr.quality);
    }

    getSSRContext() {
        const sceneConfig =  this._layer._getSceneConfig();
        const config = sceneConfig && sceneConfig.postProcess;
        const map = this._layer.getMap();
        const uniforms = this._ssrPass.getSSRUniforms(map, config.ssr.factor, config.ssr.quality);
        if (!uniforms) {
            return null;
        }
        const context = {
            renderUniforms: uniforms,
            defines: {
                'HAS_SSR': 1
            }
        };
        return context;
    }

    // taa(curTex, depthTex, {
    //     projMatrix, needClear
    // }) {
    //     const pass = this._taaPass;
    //     const outputTex = pass.render(
    //         curTex, depthTex,
    //         projMatrix, needClear
    //     );
    //     const redraw = pass.needToRedraw();
    //     return {
    //         outputTex,
    //         redraw
    //     };
    // }

    // isTaaNeedRedraw() {
    //     return this._taaPass.needToRedraw();
    // }

    // ssao(sourceTex, depthTex, uniforms) {
    //     if (!this._ssaoPass) {
    //         this._ssaoPass = new reshader.SsaoPass(this._renderer);
    //         this._layer.getRenderer().setToRedraw();
    //     }
    //     return this._ssaoPass.render({
    //         projMatrix: uniforms['projMatrix'],
    //         cameraNear: uniforms['cameraNear'],
    //         cameraFar: uniforms['cameraFar'],
    //         bias: uniforms['ssaoBias'],
    //         radius: uniforms['ssaoRadius'],
    //         intensity: uniforms['ssaoIntensity'],
    //         quality: 0.6
    //     }, sourceTex, depthTex);
    // }

    fxaa(fbo, source, noAaSource, pointSource, taaTextureSource, fxaaTextureSource, enableFXAA, enableToneMapping, enableSharpen, pixelRatio, sharpFactor,
        textureOutline, highlightFactor, outlineFactor, outlineWidth, outlineColor) {
        if (fbo && (fbo.width !== source.fbo || fbo.height !== source.height)) {
            fbo.resize(source.width, source.height);
        }
        const shaderDefines = {};
        if (taaTextureSource) {
            shaderDefines['HAS_TAA_TEX'] = 1;
        } else {
            delete shaderDefines['HAS_TAA_TEX'];
        }
        if (fxaaTextureSource) {
            shaderDefines['HAS_FXAA_TEX'] = 1;
        } else {
            delete shaderDefines['HAS_FXAA_TEX'];
        }
        if (textureOutline) {
            shaderDefines['HAS_OUTLINE_TEX'] = 1;
        } else {
            delete shaderDefines['HAS_OUTLINE_TEX'];
        }
        if (noAaSource) {
            shaderDefines['HAS_NOAA_TEX'] = 1;
        } else {
            delete shaderDefines['HAS_NOAA_TEX'];
        }
        if (pointSource) {
            shaderDefines['HAS_POINT_TEX'] = 1;
        } else {
            delete shaderDefines['HAS_POINT_TEX'];
        }
        this._fxaaShader.setDefines(shaderDefines);
        this._renderer.render(this._fxaaShader, {
            textureSource: source,
            noAaTextureSource: noAaSource,
            pointTextureSource: pointSource,
            taaTextureSource,
            fxaaTextureSource,
            resolution: vec2.set(RESOLUTION, source.width, source.height),
            enableFXAA,
            enableToneMapping,
            enableSharpen, pixelRatio, sharpFactor,
            textureOutline,
            highlightFactor,
            outlineFactor,
            outlineWidth,
            outlineColor
        }, null, fbo);
    }

    renderFBOToScreen(fbo, enableSharpen, sharpFactor, pixelRatio) {
        if (!this._copyFBOSize) {
            this._copyFBOSize = [];
        }
        this._copyFBOSize[0] = fbo.width;
        this._copyFBOSize[1] = fbo.height;
        const renderer = this._layer.getRenderer();
        this._renderer.render(this._copyShader, {
            texture: fbo.color && renderer._getFBOColor(fbo) || fbo,
            size: this._copyFBOSize,
            enableSharpen: +(!!enableSharpen),
            sharpFactor,
            pixelRatio
        });
    }

    //filmic grain + vigenett
    postprocess(fbo, uniforms, src) {
        if (!this._postProcessShader) {
            this._postProcessShader = new reshader.PostProcessShader();
        }
        const renderer = this._layer && this._layer.getRenderer();
        const source = src || renderer._getFBOColor(fbo);
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
        // if (this._taaPass) {
        //     this._taaPass.dispose();
        //     delete this._taaPass;
        // }
        // if (this._ssaoPass) {
        //     this._ssaoPass.dispose();
        //     delete this._ssaoPass;
        // }
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
        if (this._copyShader) {
            this._copyShader.dispose();
            delete this._copyShader;
        }
    }

    _createFBOInfo(depthTex, colorFormat) {
        const { width, height } = this._layer.getRenderer().canvas;
        const regl = this._regl;
        const renderer = this._layer.getRenderer();
        let color;
        if (renderer._isUseMultiSample()) {
            color = regl.renderbuffer({
                width,
                height,
                samples: this._layer.options['multiSamples'],
                format: 'rgba8'
            });
        } else {
            color = regl.texture({
                min: 'nearest',
                mag: 'nearest',
                format: colorFormat || 'rgba',
                width,
                height
            });
        }
        const fboInfo = {
            width,
            height,
            colors: [color]
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
