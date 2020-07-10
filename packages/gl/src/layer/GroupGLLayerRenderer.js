import * as maptalks from 'maptalks';
import { vec2, vec3 } from 'gl-matrix';
import { GLContext } from '@maptalks/fusiongl';
import ShadowPass from './shadow/ShadowProcess';
import * as reshader from '@maptalks/reshader.gl';
import createREGL from '@maptalks/regl';
import GroundPainter from './GroundPainter';
import EnvironmentPainter from './EnvironmentPainter';
import PostProcess from './postprocess/PostProcess.js';

const MIN_SSR_PITCH = 10;

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
        this._renderHighlights();
        this._postProcess();
    }

    drawOnInteracting(...args) {
        if (!this.getMap() || !this.layer.isVisible()) {
            return;
        }
        this.layer._updatePolygonOffset();
        this._renderChildLayers('drawOnInteracting', args);
        this['_toRedraw'] = false;
        this._renderHighlights();
        this._postProcess();
    }

    _renderChildLayers(methodName, args) {
        //noAA需要最后绘制，如果有noAa的图层，分为aa和noAa两个阶段分别绘制
        this._renderMode = 'default';
        const hasRenderTarget = this.hasRenderTarget();
        if (hasRenderTarget) {
            this._renderMode = 'aa';
        }

        let timestamp = args[0];
        if (!isNumber(timestamp)) {
            timestamp = args[1];
        }
        if (timestamp !== this._contextFrameTime) {
            this._drawContext = this._prepareDrawContext();
            this._contextFrameTime = timestamp;
            this._frameEvent = isNumber(args[0]) ? null : args[0];
        }

        if (!this._envPainter) {
            this._envPainter = new EnvironmentPainter(this._regl, this.layer);
        }
        this._envPainter.paint(this._drawContext);

        //如果放到图层后画，会出现透明图层下的ground消失的问题，#145
        this.drawGround();

        let hasNoAA = false;
        this.forEachRenderer((renderer, layer) => {
            if (!layer.isVisible()) {
                return;
            }
            if (renderer.hasNoAARendering && renderer.hasNoAARendering()) {
                hasNoAA = true;
            }
            this.clearStencil(renderer, this._targetFBO);
            renderer[methodName].apply(renderer, args);
        });

        if (this._postProcessor && this.isSSROn()) {
            this._postProcessor.drawSSR(this._depthTex);
        }

        if (hasNoAA && hasRenderTarget) {
            delete this._contextFrameTime;
            this._renderMode = this._drawContext.renderMode = 'noAa';
            this.forEachRenderer((renderer, layer) => {
                if (!layer.isVisible()) {
                    return;
                }
                if (renderer.hasNoAARendering && renderer.hasNoAARendering()) {
                    this.clearStencil(renderer, this._targetFBO);
                    renderer[methodName].apply(renderer, args);
                }
            });
        }
    }

    _renderHighlights() {
        const fbo = this._getOutlineFBO();

        const fGl = this.glCtx;
        fGl.resetDrawCalls();
        this.forEachRenderer((renderer, layer) => {
            if (!layer.isVisible()) {
                return;
            }
            if (renderer.drawHighlight) {
                renderer.drawHighlight(fbo);
            }
        });
        this._highlightCounts = fGl.getDrawCalls();
    }

    _getOutlineFBO() {
        const { width, height } = this.canvas;
        let fbo = this._outlineFBO;
        if (!fbo) {
            const outlineTex = this._regl.texture({
                width: width,
                height: height,
                format: 'rgba4'
            });
            fbo = this._outlineFBO = this._regl.framebuffer({
                width: width,
                height: height,
                colors: [outlineTex],
                depth: false,
                stencil: false
            });
        } else if (width !== fbo.width || height !== fbo.height) {
            fbo.resize(width, height);
        }
        return fbo;
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
        if (this._outlineFBO) {
            this._regl.clear({
                color: [0, 0, 0, 0],
                framebuffer: this._outlineFBO
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
        const names = ['webgl2', 'webgl', 'experimental-webgl'];
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

    clearStencil(renderer, fbo) {
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
        if (this._envPainter) {
            this._envPainter.dispose();
            delete this._envPainter;
        }
        if (this._shadowPass) {
            this._shadowPass.dispose();
            delete this._shadowPass;
        }
        if (this._postProcessor) {
            this._postProcessor.dispose();
            delete this._postProcessor;
        }
        if (this._outlineFBO) {
            this._outlineFBO.destroy();
            delete this._outlineFBO;
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
    }

    setRetireFrames() {
        this._needRetireFrames = true;
    }

    getFrameTime() {
        return this._contextFrameTime;
    }

    getFrameEvent() {
        return this._frameEvent;
    }

    getFrameContext() {
        return this._drawContext;
    }

    drawGround() {
        if (!this._groundPainter) {
            this._groundPainter = new GroundPainter(this._regl, this.layer);
        }
        return this._groundPainter.paint(this.getFrameContext());
    }

    _buildDrawFn(drawMethod) {
        const me = this;
        //drawBloom中会手动创建context
        return function (event, timestamp, context) {
            if (isNumber(event)) {
                context = timestamp;
                timestamp = event;
                event = null;
            }
            const hasRenderTarget = context && context.renderTarget;
            if (hasRenderTarget) {
                context.renderTarget.getFramebuffer = getFramebuffer;
                context.renderTarget.getDepthTexture = getDepthTexture;
            }
            if (event) {
                return drawMethod.call(this, event, timestamp, context || me._drawContext);
            } else {
                return drawMethod.call(this, timestamp, context || me._drawContext);
            }
        };
    }

    _buildSetToRedrawFn(fn) {
        const me = this;
        return function (...args) {
            me.setRetireFrames();
            return fn.apply(this, args);
        };
    }

    isEnableSSR() {
        const sceneConfig =  this.layer._getSceneConfig();
        const config = sceneConfig && sceneConfig.postProcess;
        return config && config.enable && config.ssr && config.ssr.enable;
    }

    isSSROn() {
        const enable = this.isEnableSSR();
        if (!enable) {
            return false;
        }
        if (!this._ssrpainted) {
            this._ssrpainted = true;
            return true;
        }
        const map = this.getMap();
        return map.getPitch() > MIN_SSR_PITCH;
    }

    isEnableSSAO() {
        const sceneConfig =  this.layer._getSceneConfig();
        const config = sceneConfig && sceneConfig.postProcess;
        return config && config.enable && config.ssao && config.ssao.enable;
    }

    _getViewStates() {
        const map = this.layer.getMap();

        const renderedView = this._renderedView;
        if (!renderedView) {
            this._renderedView = {
                center: map.getCenter(),
                bearing: map.getBearing(),
                pitch: map.getPitch()
                // count: scene.getMeshes().length - (displayShadow ? 1 : 0)
            };
            let lightDirectionChanged = false;
            if (map.options.lights) {
                const lightManager = map.getLightManager();
                const lightDirection = lightManager.getDirectionalLight().direction;
                this._renderedView.lightDirection = vec3.copy([], lightDirection);
                lightDirectionChanged = true;
            }
            return {
                viewChanged: true,
                lightDirectionChanged
            };
        }
        // const maxPitch = map.options['cascadePitches'][2];
        // const pitch = map.getPitch();
        const cp = map.coordToContainerPoint(this._renderedView.center);
        const viewMoveThreshold = this.layer.options['viewMoveThreshold'];
        // const viewPitchThreshold = this.layer.options['viewPitchThreshold'];
        const viewChanged = (cp._sub(map.width / 2, map.height / 2).mag() > viewMoveThreshold);
        // Math.abs(renderedView.bearing - map.getBearing()) > 30 ||
        // (renderedView.pitch < maxPitch || pitch < maxPitch) && Math.abs(renderedView.pitch - pitch) > viewPitchThreshold;
        let lightDirectionChanged = false;
        if (map.options.lights) {
            const lightManager = map.getLightManager();
            const lightDirection = lightManager.getDirectionalLight().direction;
            lightDirectionChanged = !vec3.equals(this._renderedView.lightDirection, lightDirection);
            if (lightDirectionChanged) {
                this._renderedView.lightDirection = vec3.copy([], lightDirection);
            }
        }
        //update renderView
        if (viewChanged) {
            this._renderedView.center = map.getCenter();
            this._renderedView.bearing = map.getBearing();
            this._renderedView.pitch = map.getPitch();
        }
        return {
            viewChanged,
            lightDirectionChanged
        };
    }



    _prepareDrawContext() {
        const sceneConfig =  this.layer._getSceneConfig();
        const config = sceneConfig && sceneConfig.postProcess;
        const context = {
            renderMode: this._renderMode || 'default',
            includes: {},
            states: this._getViewStates()
        };



        let renderTarget;
        if (!config || !config.enable) {
            this._clearFramebuffers();
        } else {
            const hasJitter = config.antialias && config.antialias.enable;
            if (hasJitter) {
                const ratio = config.antialias.jitterRatio || 0.25;
                let jitGetter = this._jitGetter;
                if (!jitGetter) {
                    jitGetter = this._jitGetter = new reshader.Jitter(ratio);
                } else {
                    jitGetter.setRatio(ratio);
                }
                const map = this.getMap();
                const enableTAA = config.antialias && config.antialias.enable && config.antialias.taa;
                if (map.isInteracting() && !enableTAA) {
                    jitGetter.reset();
                }
                jitGetter.getJitter(this._jitter);
                jitGetter.frame();
            } else {
                vec2.set(this._jitter, 0, 0);
            }
            context['jitter'] = this._jitter;
            const enableBloom = config.bloom && config.bloom.enable;
            const enableSsr = this.isSSROn();
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
        this._renderAnalysis(context, renderTarget);
        if (this._renderMode !== 'noAa') {
            this.forEachRenderer((renderer, layer) => {
                if (!layer.isVisible()) {
                    return;
                }
                if (renderer.needRetireFrames && renderer.needRetireFrames()) {
                    this.setRetireFrames();
                }
            });
            this._shadowContext = this._prepareShadowContext(context);
            if (this._shadowContext) {
                context.includes.shadow = 1;
            }
            this._includesState = this._updateIncludesState(context);
        }
        if (this._shadowContext) {
            context.shadow = this._shadowContext;
            context.includes.shadow = 1;
        }
        context.states.includesChanged = this._includesState;
        if (config && config.enable && this._postProcessor) {
            this._postProcessor.setContextIncludes(context);
        }
        return context;
    }

    _renderAnalysis(context, renderTarget) {
        let toAnalyseMeshes = [];
        this.forEachRenderer(renderer => {
            if (!renderer.getAnalysisMeshes) {
                return;
            }
            const meshes = renderer.getAnalysisMeshes();
            if (Array.isArray(meshes)) {
                for (let i = 0; i < meshes.length; i++) {
                    toAnalyseMeshes.push(meshes[i]);
                }
            }
        });
        const analysisTaskList = this.layer._analysisTaskList;
        if (!analysisTaskList) {
            return;
        }
        for (let i = 0; i < analysisTaskList.length; i++) {
            const task = analysisTaskList[i];
            task.renderAnalysis(context, toAnalyseMeshes, renderTarget && renderTarget.fbo);
        }
    }

    _updateIncludesState(context) {
        let state = false;
        const includeKeys = Object.keys(context.includes);
        const prevKeys = this._prevIncludeKeys;
        if (prevKeys) {
            const difference = includeKeys
                .filter(x => prevKeys.indexOf(x) === -1)
                .concat(prevKeys.filter(x => includeKeys.indexOf(x) === -1));
            if (difference.length) {
                state = difference.reduce((accumulator, currentValue) => {
                    accumulator[currentValue] = 1;
                    return accumulator;
                }, {});
            }
        }
        this._prevIncludeKeys = includeKeys;
        return state;
    }

    _prepareShadowContext(context) {
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
        const shadow = {
            config: sceneConfig.shadow,
            defines: this._shadowPass.getDefines(),
            uniformDeclares: ShadowPass.getUniformDeclares()
        };
        shadow.renderUniforms = this._renderShadow(context);
        return shadow;
    }

    _renderShadow(context) {
        const fbo = context.renderTarget && context.renderTarget.fbo;
        const sceneConfig =  this.layer._getSceneConfig();
        const meshes = [];
        let forceUpdate = context.states.lightDirectionChanged || context.states.viewChanged || this._needRetireFrames;
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
            this._postProcessor = new PostProcess(this._regl, this.layer, this._jitGetter);
        }
        let tex = this._targetFBO.color[0];

        const enableSSR = this.isSSROn();
        if (enableSSR) {
            tex = this._postProcessor.ssr(tex);
        }

        const enableSSAO = this.isEnableSSAO();
        if (enableSSAO) {
            //generate ssao texture for the next frame
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
            const bloomConfig = config.bloom;
            const threshold = +bloomConfig.threshold || 0;
            const factor = getValueOrDefault(bloomConfig, 'factor', 1);
            const radius = getValueOrDefault(bloomConfig, 'radius', 1);
            tex = this._postProcessor.bloom(tex, this._depthTex, threshold, factor, radius);
        }

        const enableTAA = config.antialias && config.antialias.enable;
        if (enableTAA) {
            const { outputTex, redraw } = this._postProcessor.taa(tex, this._depthTex, {
                projMatrix: map.projMatrix,
                projViewMatrix: map.projViewMatrix,
                cameraWorldMatrix: map.cameraWorldMatrix,
                fov: map.getFov() * Math.PI / 180,
                jitter: this._jitter,
                near: map.cameraNear,
                far: map.cameraFar,
                needClear: this._needRetireFrames || map.getRenderer().isViewChanged(),
                taa: !!config.antialias.taa
            });
            tex = outputTex;
            if (redraw) {
                this.setToRedraw();
            }
            this._needRetireFrames = false;
        }
        let sharpFactor = config.sharpen && config.sharpen.factor;
        if (!sharpFactor && sharpFactor !== 0) {
            sharpFactor = 0.2;// 0 - 5
        }

        let enableOutline = 0;
        let highlightFactor = 0.2;
        let outlineFactor = 0.3;
        let outlineWidth = 1;
        let outlineColor = [1, 1, 0];
        if (config.outline) {
            enableOutline = +!!config.outline.enable;
            highlightFactor = getValueOrDefault(config.outline, 'highlightFactor', highlightFactor);
            outlineFactor = getValueOrDefault(config, 'outlineFactor', outlineFactor);
            outlineWidth = getValueOrDefault(config, 'outlineWidth', outlineWidth);
            outlineColor = getValueOrDefault(config, 'outlineColor', outlineColor);
        }

        this._postProcessor.fxaa(tex, this._noAaFBO.color[0],
            // +!!(config.antialias && config.antialias.enable),
            1,
            +!!(config.toneMapping && config.toneMapping.enable),
            +!!(config.sharpen && config.sharpen.enable),
            map.getDevicePixelRatio(),
            sharpFactor,
            enableOutline && +(this._highlightCounts > 0),
            this._getOutlineFBO(),
            highlightFactor,
            outlineFactor,
            outlineWidth,
            outlineColor
        );
        if (enableSSR) {
            this._postProcessor.genSsrMipmap(tex);
        }
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


function getValueOrDefault(v, key, defaultValue) {
    if (isNil(v[key])) {
        return defaultValue;
    }
    return v[key];
}
