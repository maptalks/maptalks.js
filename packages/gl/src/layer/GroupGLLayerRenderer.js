import * as maptalks from 'maptalks';
import { mat4, vec2 } from 'gl-matrix';
import { GLContext } from '@maptalks/fusiongl';
import ShadowPass from './shadow/ShadowProcess';
import * as reshader from '@maptalks/reshader.gl';
import createREGL from '@maptalks/regl';
import GroundPainter from './GroundPainter';
import PostProcess from './postprocess/PostProcess.js';

const bloomFilter = m => m.getUniform('bloom');
const ssrFilter = m => m.getUniform('ssr');
const noPostFilter = m => !m.getUniform('bloom') && !m.getUniform('ssr');
const noBloomFilter = m => !m.getUniform('bloom');
const noSsrFilter = m => !m.getUniform('ssr');


class Renderer extends maptalks.renderer.CanvasRenderer {

    setToRedraw() {
        this.setRetireFrames();
        super.setToRedraw();
    }

    onAdd() {
        super.onAdd();
        this.prepareCanvas();
    }

    updateSceneConfig() {
        if (this._groundPainter) {
            this._groundPainter.update();
        }
        this.setToRedraw();
    }

    render(...args) {
        if (!this.getMap() || !this.layer.isVisible()) {
            return;
        }
        this.forEachRenderer((renderer) => {
            if (renderer._replacedDrawFn) {
                return;
            }
            renderer.draw = this._buildDrawFn(renderer.draw);
            renderer.drawOnInteracting = this._buildDrawFn(renderer.drawOnInteracting);
            renderer.setToRedraw = this._buildSetToRedrawFn(renderer.setToRedraw);
            renderer._replacedDrawFn = true;
        });
        this.prepareRender();
        this.prepareCanvas();
        this.layer._updatePolygonOffset();
        this._renderChildLayers('render', args);
        this['_toRedraw'] = false;
        this._postProcess();
        this._renderHighlights();
    }

    drawOnInteracting(...args) {
        if (!this.getMap() || !this.layer.isVisible()) {
            return;
        }
        this.layer._updatePolygonOffset();
        this._renderChildLayers('drawOnInteracting', args);
        this['_toRedraw'] = false;
        this._postProcess();
        this._renderHighlights();
    }

    _renderChildLayers(methodName, args) {
        //noAA需要最后绘制，如果有noAa的图层，分为aa和noAa两个阶段分别绘制
        this._renderMode = 'default';
        const hasRenderTarget = this.hasRenderTarget();
        if (hasRenderTarget) {
            this._renderMode = 'aa';
        }
        let hasNoAA = false;
        this.forEachRenderer((renderer, layer) => {
            if (!layer.isVisible()) {
                return;
            }
            if (renderer.needRetireFrames && renderer.needRetireFrames()) {
                this.setRetireFrames();
            }
            if (renderer.hasNoAARendering && renderer.hasNoAARendering()) {
                hasNoAA = true;
            }
            this._clearStencil(renderer, this._targetFBO);
            renderer[methodName].apply(renderer, args);
        });
        if (hasNoAA && hasRenderTarget) {
            delete this._contextFrameTime;
            this._renderMode = 'noAa';
            this.forEachRenderer((renderer, layer) => {
                if (!layer.isVisible()) {
                    return;
                }
                if (renderer.hasNoAARendering && renderer.hasNoAARendering()) {
                    this._clearStencil(renderer, this._targetFBO);
                    renderer[methodName].apply(renderer, args);
                }
            });
        }
    }

    _renderHighlights() {
        this.forEachRenderer((renderer, layer) => {
            if (!layer.isVisible()) {
                return;
            }
            if (renderer.drawHighlight) {
                renderer.drawHighlight();
            }
        });
    }

    hasRenderTarget() {
        const sceneConfig =  this.layer._getSceneConfig();
        const config = sceneConfig && sceneConfig.postProcess;
        if (!config || !config.enable) {
            return false;
        }
        return true;
    }

    testIfNeedRedraw() {
        if (this['_toRedraw']) {
            this['_toRedraw'] = false;
            return true;
        }
        const map = this.getMap();
        if (map.isInteracting() && this._groundPainter && this._groundPainter.isEnable()) {
            return true;
        }
        const layers = this.layer.getLayers();
        for (const layer of layers) {
            const renderer = layer.getRenderer();
            if (renderer && renderer.testIfNeedRedraw()) {
                this.setRetireFrames();
                return true;
            }
        }
        return false;
    }

    isRenderComplete() {
        const layers = this.layer.getLayers();
        for (const layer of layers) {
            const renderer = layer.getRenderer();
            if (renderer && !renderer.isRenderComplete()) {
                return false;
            }
        }
        return true;
    }

    mustRenderOnInteracting() {
        const layers = this.layer.getLayers();
        for (const layer of layers) {
            const renderer = layer.getRenderer();
            if (renderer && renderer.mustRenderOnInteracting()) {
                return true;
            }
        }
        return false;
    }

    isCanvasUpdated() {
        if (super.isCanvasUpdated()) {
            return true;
        }
        const layers = this.layer.getLayers();
        for (const layer of layers) {
            const renderer = layer.getRenderer();
            if (renderer && renderer.isCanvasUpdated()) {
                return true;
            }
        }
        return false;
    }

    isBlank() {
        if (this._groundPainter && this._groundPainter.isEnable()) {
            return false;
        }
        const layers = this.layer.getLayers();
        for (const layer of layers) {
            const renderer = layer.getRenderer();
            if (renderer && !renderer.isBlank()) {
                return false;
            }
        }
        return true;
    }

    createContext() {
        const layer = this.layer;
        const attributes = layer.options['glOptions'] || {
            alpha: true,
            depth: true,
            stencil: true
        };
        attributes.preserveDrawingBuffer = true;
        attributes.antialias = layer.options['antialias'];
        this.glOptions = attributes;
        const gl = this.gl = this._createGLContext(this.canvas, attributes);        // this.gl = gl;
        this._initGL(gl);
        gl.wrap = () => {
            return new GLContext(this.gl);
        };
        this.glCtx = gl.wrap();
        this.canvas.gl = this.gl;
        this._reglGL = gl.wrap();
        this._regl = createREGL({
            gl: this._reglGL,
            attributes,
            extensions: layer.options['extensions'],
            optionalExtensions: layer.options['optionalExtensions']
        });
        this.gl.regl = this._regl;

        this._jitter = [0, 0];
        this._jitGetter = new reshader.Jitter(this.layer.options['jitterRatio']);
    }

    _initGL() {
        const layer = this.layer;
        const gl = this.gl;
        const extensions = layer.options['extensions'];
        if (extensions) {
            extensions.forEach(ext => {
                gl.getExtension(ext);
            });
        }
        const optionalExtensions = layer.options['optionalExtensions'];
        if (optionalExtensions) {
            optionalExtensions.forEach(ext => {
                gl.getExtension(ext);
            });
        }
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
    }

    clearCanvas() {
        super.clearCanvas();
        this._regl.clear({
            color: [0, 0, 0, 0],
            depth: 1,
            stencil: 0xFF
        });
        if (this._targetFBO) {
            this._regl.clear({
                color: [0, 0, 0, 0],
                depth: 1,
                stencil: 0xFF,
                framebuffer: this._targetFBO
            });
            this._regl.clear({
                color: [0, 0, 0, 0],
                framebuffer: this._noAaFBO
            });
        }
    }

    resizeCanvas() {
        super.resizeCanvas();
        if (this._targetFBO && (this._targetFBO.width !== this.canvas.width ||
            this._targetFBO.height !== this.canvas.height)) {
            this._targetFBO.resize(this.canvas.width, this.canvas.height);
            this._noAaFBO.resize(this.canvas.width, this.canvas.height);
        }
        if (this._bloomFBO && (this._bloomFBO.width !== this.canvas.width ||
            this._bloomFBO.height !== this.canvas.height)) {
            this._bloomFBO.resize(this.canvas.width, this.canvas.height);
        }
        if (this._ssrFBO && (this._ssrFBO.width !== this.canvas.width ||
            this._ssrFBO.height !== this.canvas.height)) {
            this._ssrFBO.resize(this.canvas.width, this.canvas.height);
        }
        this.forEachRenderer(renderer => {
            if (renderer.canvas) {
                renderer.resizeCanvas();
            }
        });
    }

    getCanvasImage() {
        this.forEachRenderer(renderer => {
            renderer.getCanvasImage();
        });
        return super.getCanvasImage();
    }

    forEachRenderer(fn) {
        const layers = this.layer.getLayers();
        for (const layer of layers) {
            const renderer = layer.getRenderer();
            if (renderer) {
                fn(renderer, layer);
            }
        }
    }

    _createGLContext(canvas, options) {
        const names = ['webgl', 'experimental-webgl'];
        let gl = null;
        /* eslint-disable no-empty */
        for (let i = 0; i < names.length; ++i) {
            try {
                gl = canvas.getContext(names[i], options);
            } catch (e) {}
            if (gl) {
                break;
            }
        }
        return gl;
        /* eslint-enable no-empty */
    }

    _clearStencil(renderer, fbo) {
        const stencilValue = renderer.getStencilValue ? renderer.getStencilValue() : 0xFF;
        const config = {
            stencil: stencilValue
        };
        if (fbo) {
            config['framebuffer'] = fbo;
        }
        this._regl.clear(config);
    }

    onRemove() {
        //regl framebuffer for picking created by children layers
        if (this.canvas.pickingFBO && this.canvas.pickingFBO.destroy) {
            this.canvas.pickingFBO.destroy();
        }
        this._clearFramebuffers();
        if (this._groundPainter) {
            this._groundPainter.dispose();
            delete this._groundPainter;
        }
        if (this._shadowPass) {
            this._shadowPass.dispose();
            delete this._shadowPass;
        }
        if (this._postProcessor) {
            this._postProcessor.dispose();
            delete this._postProcessor;
        }
        if (this._ssrPass) {
            this._ssrPass.dispose();
            delete this._ssrPass;
        }
        super.onRemove();
    }

    _clearFramebuffers() {
        if (this._targetFBO) {
            this._targetFBO.destroy();
            this._noAaFBO.destroy();
            delete this._targetFBO;
            delete this._noAaFBO;
        }
        if (this._bloomFBO) {
            this._bloomFBO.destroy();
            delete this._bloomFBO;
        }
        if (this._ssrFBO) {
            this._ssrFBO.destroy();
            delete this._ssrFBO;
        }
    }

    setRetireFrames() {
        this._needRetireFrames = true;
    }

    _buildDrawFn(drawMethod) {
        const parent = this;
        //drawBloom中会手动创建context
        return function (event, timestamp, context) {
            if (isNumber(event)) {
                context = timestamp;
                timestamp = event;
                event = null;
            }
            if (timestamp !== parent._contextFrameTime) {
                parent._drawContext = parent._prepareDrawContext();
                parent._contextFrameTime = timestamp;
                parent._frameEvent = event;
            }
            const hasRenderTarget = context && context.renderTarget;
            if (hasRenderTarget) {
                context.renderTarget.getFramebuffer = getFramebuffer;
                context.renderTarget.getDepthTexture = getDepthTexture;
            }
            if (event) {
                return drawMethod.call(this, event, timestamp, context || parent._drawContext);
            } else {
                return drawMethod.call(this, timestamp, context || parent._drawContext);
            }
        };
    }

    _buildSetToRedrawFn(fn) {
        const parent = this;
        return function (...args) {
            parent.setRetireFrames();
            return fn.apply(this, args);
        };
    }

    isEnableSSR() {
        const sceneConfig =  this.layer._getSceneConfig();
        const config = sceneConfig && sceneConfig.postProcess;
        return config && config.ssr && config.ssr.enable;
    }

    _prepareDrawContext() {
        const sceneConfig =  this.layer._getSceneConfig();
        const config = sceneConfig && sceneConfig.postProcess;
        const context = {
            renderMode: this._renderMode || 'default'
        };
        let renderTarget;
        if (!config || !config.enable) {
            this._clearFramebuffers();
        } else {
            const hasJitter = config.antialias && config.antialias.enable;
            if (hasJitter) {
                context['jitter'] = this._jitGetter.getJitter(this._jitter);
                this._jitGetter.frame();
            } else {
                vec2.set(this._jitter, 0, 0);
            }
            const enableBloom = config.bloom && config.bloom.enable;
            const enableSsr = this.isEnableSSR();
            if (enableBloom && enableSsr) {
                context['bloom'] = 1;
                context['sceneFilter'] = noPostFilter;
            } else if (enableBloom) {
                context['bloom'] = 1;
                context['sceneFilter'] = noBloomFilter;
            } else if (enableSsr) {
                context['sceneFilter'] = noSsrFilter;
            }
            renderTarget = this._getFramebufferTarget();
            if (renderTarget) {
                context.renderTarget = renderTarget;
            }
        }
        if (this._renderMode !== 'noAa') {
            this._shadowContext = this._prepareShadowContext(renderTarget && renderTarget.fbo);
        }
        if (this._shadowContext) {
            context.shadow = this._shadowContext;
        }
        if (this._renderMode !== 'noAa') {
            if (!this._groundPainter) {
                this._groundPainter = new GroundPainter(this._regl, this.layer);
            }
            this._groundPainter.paint(context);
        }
        return context;
    }

    _prepareShadowContext(fbo) {
        const sceneConfig =  this.layer._getSceneConfig();
        if (!sceneConfig || !sceneConfig.shadow || !sceneConfig.shadow.enable) {
            if (this._shadowPass) {
                this._shadowPass.dispose();
                delete this._shadowPass;
            }
            return null;
        }
        if (!this._shadowPass) {
            this._shadowPass = new ShadowPass(this._regl, sceneConfig, this.layer);
        }
        const context = {
            config: sceneConfig.shadow,
            defines: this._shadowPass.getDefines(),
            uniformDeclares: ShadowPass.getUniformDeclares()
        };
        context.renderUniforms = this._renderShadow(fbo);
        return context;
    }

    _renderShadow(fbo) {
        const sceneConfig =  this.layer._getSceneConfig();
        const meshes = [];
        let forceUpdate = false;
        this.forEachRenderer(renderer => {
            if (!renderer.getShadowMeshes) {
                return;
            }
            const shadowMeshes = renderer.getShadowMeshes();
            if (Array.isArray(shadowMeshes)) {
                for (let i = 0; i < shadowMeshes.length; i++) {
                    if (shadowMeshes[i].needUpdateShadow) {
                        forceUpdate = true;
                    }
                    shadowMeshes[i].needUpdateShadow = false;
                    meshes.push(shadowMeshes[i]);
                }
            }
        });
        // if (!meshes.length) {
        //     return null;
        // }
        if (!this._shadowScene) {
            this._shadowScene = new reshader.Scene();
        }
        this._shadowScene.setMeshes(meshes);
        const map = this.getMap();
        const shadowConfig = sceneConfig.shadow;
        const lightDirection = map.getLightManager().getDirectionalLight().direction;
        const displayShadow = !sceneConfig.ground || !sceneConfig.ground.enable;
        const uniforms = this._shadowPass.render(displayShadow, map.projMatrix, map.viewMatrix, shadowConfig.color, shadowConfig.opacity, lightDirection, this._shadowScene, this._jitter, fbo, forceUpdate);
        if (this._shadowPass.isUpdated()) {
            this.setRetireFrames();
        }
        return uniforms;
    }

    _getFramebufferTarget() {
        const sceneConfig =  this.layer._getSceneConfig();
        const config = sceneConfig && sceneConfig.postProcess;
        if (!this._targetFBO) {
            const regl = this._regl;
            const fboInfo = this._createFBOInfo(config);
            this._depthTex = fboInfo.depth || fboInfo.depthStencil;
            this._targetFBO = regl.framebuffer(fboInfo);
            const noAaInfo = this._createFBOInfo(config, this._depthTex);
            this._noAaFBO = regl.framebuffer(noAaInfo);
        }
        return {
            fbo: this._targetFBO,
            noAaFbo: this._noAaFBO
        };
    }

    _createFBOInfo(config, depthTex) {
        const width = this.canvas.width, height = this.canvas.height;
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
        const enableDepthTex = regl.hasExtension('WEBGL_depth_texture');
        //depth(stencil) buffer 是可以共享的
        if (enableDepthTex) {
            const depthStencilTexture = depthTex || regl.texture({
                min: 'nearest',
                mag: 'nearest',
                mipmap: false,
                type: 'depth stencil',
                width,
                height,
                format: 'depth stencil'
            });
            fboInfo.depthStencil = depthStencilTexture;
        } else {
            const renderbuffer = depthTex || regl.renderbuffer({
                width,
                height,
                format: 'depth stencil'
            });
            fboInfo.depthStencil = renderbuffer;
        }
        return fboInfo;
    }

    _postProcess() {
        if (!this._targetFBO) {
            this._needRetireFrames = false;
            return;
        }
        const sceneConfig =  this.layer._getSceneConfig();
        const config = sceneConfig && sceneConfig.postProcess;
        if (!config || !config.enable) {
            return;
        }
        const map = this.layer.getMap();
        if (!this._postProcessor) {
            this._postProcessor = new PostProcess(this._regl, this._jitGetter);
        }
        let tex = this._targetFBO.color[0];

        const enableSSR = this.isEnableSSR();
        if (enableSSR) {
            //遍历开启了ssr的mesh重新绘制一遍，并只绘制有ssr的像素，discard掉其他像素
            const ssrTex = this._drawSsr();
            //合并ssr和原fbo中的像素
            tex = this._ssrPass.combine(tex, ssrTex);
        } else {
            if (this._ssrFBO) {
                this._ssrFBO.destroy();
                delete this._ssrFBO;
            }
            if (this._ssrPass) {
                this._ssrPass.dispose();
                delete this._ssrPass;
            }
        }

        const enableSSAO = config.ssao && config.ssao.enable;
        if (enableSSAO) {
            tex = this._postProcessor.ssao(tex, this._depthTex, {
                projMatrix: map.projMatrix,
                cameraNear: map.cameraNear,
                cameraFar: map.cameraFar,
                ssaoBias: config.ssao && config.ssao.bias || 10,
                ssaoRadius: config.ssao && config.ssao.radius || 100,
                ssaoIntensity: config.ssao && config.ssao.intensity || 0.5
            });
        }

        const enableBloom = config.bloom && config.bloom.enable;
        if (enableBloom) {
            this._drawBloom();
            const bloomConfig = config.bloom;
            const threshold = +bloomConfig.threshold || 0;
            const factor = isNil(bloomConfig.factor) ? 1 : +bloomConfig.factor;
            const radius = isNil(bloomConfig.radius) ? 1 : +bloomConfig.radius;
            tex = this._postProcessor.bloom(tex, this._bloomFBO.color[0], threshold, factor, radius);
        }

        const enableTAA = config.antialias && config.antialias.enable;
        if (enableTAA) {
            // const redrawFrame = this.testIfNeedRedraw();
            const { outputTex, redraw } = this._postProcessor.taa(tex, this._depthTex, {
                projMatrix: map.projMatrix,
                projViewMatrix: map.projViewMatrix,
                // prevProjViewMatrix: this._prevProjViewMatrix || map.projViewMatrix,
                cameraWorldMatrix: map.cameraWorldMatrix,
                fov: map.getFov() * Math.PI / 180,
                jitter: this._jitter,
                near: map.cameraNear,
                far: map.cameraFar,
                needClear: this._needRetireFrames || map.getRenderer().isViewChanged(),
                taa: !!config.antialias.taa
            });
            tex = outputTex;
            // if (!this._prevProjViewMatrix) {
            //     this._prevProjViewMatrix = new Array(16);
            // } else if (mat4.equals(map.projViewMatrix, this._prevProjViewMatrix)) {
            //     if (map.getRenderer().isViewChanged()) {
            //         console.log('hit');
            //     }
            // } else {
            //     console.log('updated');
            // }
            // mat4.copy(this._prevProjViewMatrix, map.projViewMatrix);
            if (redraw) {
                this.setToRedraw();
            }
            this._needRetireFrames = false;
        }
        let sharpFactor = config.sharpen && config.sharpen.factor;
        if (!sharpFactor && sharpFactor !== 0) {
            sharpFactor = 0.2;// 0 - 5
        }
        this._postProcessor.fxaa(tex, this._noAaFBO.color[0],
            // +!!(config.antialias && config.antialias.enable),
            1,
            +!!(config.toneMapping && config.toneMapping.enable),
            +!!(config.sharpen && config.sharpen.enable),
            map.getDevicePixelRatio(),
            sharpFactor
        );

        if (enableSSR && this._ssrPass) {
            this._ssrPass.genMipMap(tex);
            if (!this._ssrFBO._projViewMatrix) {
                this._ssrFBO._projViewMatrix = [];
            }
            mat4.copy(this._ssrFBO._projViewMatrix, this.getMap().projViewMatrix);
        }
    }

    _prepareSSRContext() {
        const sceneConfig =  this.layer._getSceneConfig();
        const config = sceneConfig && sceneConfig.postProcess;
        const regl = this._regl;
        if (!this._ssrPass) {
            this._ssrPass = new reshader.SsrPass(regl);
        }
        const ssrFBO = this._ssrFBO;
        if (!ssrFBO) {
            const info = this._createFBOInfo(config);
            this._ssrFBO = regl.framebuffer(info);
        } else {
            if (ssrFBO.width !== this._targetFBO.width || ssrFBO.height !== this._targetFBO.height) {
                ssrFBO.resize(this._targetFBO.width, this._targetFBO.height);
            }
            regl.clear({
                color: [0, 0, 0, 0],
                depth: 1,
                framebuffer: ssrFBO
            });
        }
        const map = this.getMap();
        const texture = this._ssrPass.getMipmapTexture();
        return {
            renderUniforms: {
                'TextureDepth': this._depthTex,
                'TextureSource': this._targetFBO.color[0],
                'TextureToBeRefracted': texture,
                'uSsrFactor': config.ssr.factor || 1,
                'uSsrQuality': config.ssr.quality || 2,
                'uPreviousGlobalTexSize': [texture.width, texture.height / 2],
                'uGlobalTexSize': [this._depthTex.width, this._depthTex.height],
                'uTextureToBeRefractedSize': [texture.width, texture.height],
                'fov': this.layer.getMap().getFov() * Math.PI / 180,
                'prevProjViewMatrix': this._ssrFBO._projViewMatrix || map.projViewMatrix,
                'cameraWorldMatrix': map.cameraWorldMatrix
            },
            fbo: this._ssrFBO
        };
    }

    _drawSsr() {
        const ssrFBO = this._ssrFBO;
        const context = this._drawContext;
        const timestamp = this._contextFrameTime;
        const event = this._frameEvent;
        if (this._shadowContext) {
            context.shadow = this._shadowContext;
        }
        context.ssr = this._prepareSSRContext(context);
        context.renderMode = 'default';
        context['sceneFilter'] = ssrFilter;
        if (event) {
            this.forEachRenderer(renderer => {
                this._clearStencil(renderer, ssrFBO);
                renderer.drawOnInteracting(event, timestamp, context);
            });
        } else {
            this.forEachRenderer(renderer => {
                this._clearStencil(renderer, ssrFBO);
                renderer.draw(timestamp, context);
            });
        }
        this._groundPainter.paint(context);
        //以免和bloom冲突
        delete context.ssr;
        return this._ssrFBO.color[0];
    }

    _drawBloom() {
        const regl = this._regl;
        const bloomFBO = this._bloomFBO;
        if (!bloomFBO) {
            const sceneConfig =  this.layer._getSceneConfig();
            const config = sceneConfig && sceneConfig.postProcess;
            const info = this._createFBOInfo(config, this._depthTex);
            this._bloomFBO = regl.framebuffer(info);
        } else {
            if (bloomFBO.width !== this._targetFBO.width || bloomFBO.height !== this._targetFBO.height) {
                bloomFBO.resize(this._targetFBO.width, this._targetFBO.height);
            }
            regl.clear({
                color: [0, 0, 0, 0],
                framebuffer: bloomFBO
            });
        }
        const timestamp = this._contextFrameTime;
        const event = this._frameEvent;
        const context = this._drawContext;
        context.renderMode = 'default';
        context['sceneFilter'] = bloomFilter;
        context.renderTarget = {
            fbo: this._bloomFBO,
            getFramebuffer,
            getDepthTexture
        };
        if (event) {
            this.forEachRenderer(renderer => {
                this._clearStencil(renderer, bloomFBO);
                renderer.drawOnInteracting(event, timestamp, context);
            });
        } else {
            this.forEachRenderer(renderer => {
                this._clearStencil(renderer, bloomFBO);
                renderer.draw(timestamp, context);
            });
        }
    }

    _isPostProcessEnabled() {
        const sceneConfig =  this.layer._getSceneConfig();
        const config = sceneConfig.postProcess;
        if (!config.enable) {
            return false;
        }
        for (const p in config) {
            if (config[p] && config[p].enable) {
                return true;
            }
        }
        return false;
    }
}


function isNil(obj) {
    return obj == null;
}

function isNumber(val) {
    return (typeof val === 'number') && !isNaN(val);
}

function getFramebuffer(fbo) {
    return fbo['_framebuffer'].framebuffer;
}

function getDepthTexture(fbo) {
    //TODO 也可能是renderbuffer
    return fbo.depthStencil._texture.texture;
}

export default Renderer;

