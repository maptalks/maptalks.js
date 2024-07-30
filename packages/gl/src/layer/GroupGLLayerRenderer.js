import * as maptalks from 'maptalks';
import { vec2, vec3, mat4 } from '@maptalks/reshader.gl';
import { GLContext } from '@maptalks/fusiongl';
import ShadowProcess from './shadow/ShadowProcess';
import * as reshader from '@maptalks/reshader.gl';
import createREGL from '@maptalks/regl';
import GroundPainter from './GroundPainter';
import EnvironmentPainter from './EnvironmentPainter';
import WeatherPainter from './weather/WeatherPainter';
import PostProcess from './postprocess/PostProcess.js';
import AnalysisPainter from '../analysis/AnalysisPainter.js';
import { createGLContext } from './util/util.js';

const EMPTY_COLOR = [0, 0, 0, 0];
const DEFAULT_LIGHT_DIRECTION = [1, 1, -1];

const MIN_SSR_PITCH = -0.001;
const NO_JITTER = [0, 0];

const noPostFilter = m => !m.bloom && !m.ssr;
const noBloomFilter = m => !m.bloom;
const noSsrFilter = m => !m.ssr;

const SSR_STATIC = 1;
const SSR_IN_ONE_FRAME = 2;

class GroupGLLayerRenderer extends maptalks.renderer.CanvasRenderer {

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
        if (this._envPainter) {
            this._envPainter.update();
        }
        if (this._weatherPainter) {
            this._weatherPainter.update();
        }
        this.setToRedraw();
    }

    render(...args) {
        if (!this.getMap() || !this.layer.isVisible()) {
            return;
        }
        this.forEachRenderer((renderer) => {
            if (renderer['_replacedDrawFn']) {
                return;
            }
            renderer.draw = this._buildDrawFn(renderer.draw);
            renderer.drawOnInteracting = this._buildDrawOnInteractingFn(renderer.drawOnInteracting);
            renderer.setToRedraw = this._buildSetToRedrawFn(renderer.setToRedraw);
            renderer['_replacedDrawFn'] = true;
        });
        this.prepareRender();
        this.prepareCanvas();
        this.layer._updatePolygonOffset();
        this['_toRedraw'] = false;
        this._renderChildLayers('render', args);
        this._renderOutlines();
        this._postProcess();
    }

    prepareCanvas() {
        super.prepareCanvas();
        this.forEachRenderer(renderer => {
            renderer.prepareCanvas();
        });
    }

    drawOnInteracting(...args) {
        if (!this.getMap() || !this.layer.isVisible()) {
            return;
        }
        this.layer._updatePolygonOffset();
        this['_toRedraw'] = false;
        this._renderChildLayers('drawOnInteracting', args);
        this._renderOutlines();
        this._postProcess();
    }

    _renderChildLayers(methodName, args) {
        this._renderMode = 'default';
        const hasRenderTarget = this.hasRenderTarget();
        const drawContext = this._getDrawContext(args);
        if (hasRenderTarget) {
            // reset renderTarget before drawing ground and child layers
            this._drawContext.renderTarget = this._getFramebufferTarget();
        }
        this._envPainter.paint(drawContext);
        //如果放到图层后画，会出现透明图层下的ground消失的问题，#145
        this.drawGround(true);
        if (!hasRenderTarget) {
            this._renderInMode('default', null, methodName, args, true);
            return;
        }
        const fGL = this.glCtx;

        const sceneConfig =  this.layer._getSceneConfig();
        const config = sceneConfig && sceneConfig.postProcess;
        const ssrMode = this.isSSROn();

        const enableTAA = this.isEnableTAA();
        const jitter = drawContext.jitter;
        drawContext.jitter = NO_JITTER;
        const groundConfig = this.layer.getGroundConfig();
        drawContext.hasSSRGround = !!(ssrMode && groundConfig && groundConfig.enable && groundConfig.symbol && groundConfig.symbol.ssr);
        fGL.resetDrawCalls();
        this._renderInMode(enableTAA ? 'fxaaBeforeTaa' : 'fxaa', this._targetFBO, methodName, args);
        this._fxaaDrawCount = fGL.getDrawCalls();

        // 重用上一帧的深度纹理，先绘制ssr图形
        // 解决因TAA jitter偏转，造成的ssr图形与taa图形的空白缝隙问题
        // #1545 SSR_ONE_FRAME模式里，建筑透明时，ssr后画会造成建筑后的ssr图形丢失，改为永远在每帧的开始，都绘制ssr图形
        if (ssrMode) {
            this._postProcessor.drawSSR(this._blitDepthTex(), this._targetFBO);
        }



        if (enableTAA) {
            const map = this.getMap();
            const needRefresh = this._postProcessor.isTaaNeedRedraw() || this._needRetireFrames || map.getRenderer().isViewChanged();
            drawContext.jitter = needRefresh ? jitter : this._jitGetter.getAverage();
            drawContext.onlyUpdateDepthInTaa = !needRefresh;
            let taaFBO = this._taaFBO;
            if (!taaFBO) {
                const regl = this.regl;
                const info = this.createFBOInfo(config, this._depthTex);
                taaFBO = this._taaFBO = regl.framebuffer(info);
            } else if (taaFBO.width !== this._targetFBO.width || taaFBO.height !== this._targetFBO.height) {
                taaFBO.resize(this._targetFBO.width, this._targetFBO.height);
            }
            fGL.resetDrawCalls();
            this._renderInMode('taa', taaFBO, methodName, args);
            this._taaDrawCount = fGL.getDrawCalls();
            delete drawContext.onlyUpdateDepthInTaa;
            drawContext.jitter = NO_JITTER;

            let fxaaFBO = this._fxaaFBO;
            if (!fxaaFBO) {
                const regl = this.regl;
                const info = this.createFBOInfo(config, this._depthTex);
                fxaaFBO = this._fxaaFBO = regl.framebuffer(info);
            } else if (fxaaFBO.width !== this._targetFBO.width || fxaaFBO.height !== this._targetFBO.height) {
                fxaaFBO.resize(this._targetFBO.width, this._targetFBO.height);
            }
            fGL.resetDrawCalls();
            this._renderInMode('fxaaAfterTaa', this._fxaaFBO, methodName, args);
            this._fxaaAfterTaaDrawCount = fGL.getDrawCalls();
        } else if (this._taaFBO) {
            this._taaFBO.destroy();
            this._fxaaFBO.destroy();
            delete this._taaFBO;
            delete this._fxaaFBO;
            delete this._fxaaAfterTaaDrawCount;
        }

        // let tex = this._fxaaFBO ? this._getFBOColor(this._fxaaFBO) : this._getFBOColor(this._targetFBO);

        // bloom的绘制放在ssr之前，更新深度缓冲，避免ssr绘制时，深度值不正确
        const enableBloom = config.bloom && config.bloom.enable;
        if (enableBloom) {
            this._bloomPainted = this._postProcessor.drawBloom(this._depthTex);
        }

        // ssr如果放到noAa之后，ssr图形会遮住noAa中的图形
        if (ssrMode === SSR_IN_ONE_FRAME) {
            this._postProcessor.drawSSR(this._blitDepthTex(), this._targetFBO, true);
        }

        // noAa的绘制放在bloom后，避免noAa的数据覆盖了bloom效果
        fGL.resetDrawCalls();
        this._renderInMode('noAa', this._noAaFBO, methodName, args);
        this._noaaDrawCount = fGL.getDrawCalls();

        fGL.resetDrawCalls();
        this._renderInMode('point', this._pointFBO, methodName, args, true);
        this._weatherPainter.renderScene(drawContext);
        this._pointDrawCount = fGL.getDrawCalls();

        // return tex;
    }

    _renderInMode(mode, fbo, methodName, args, isFinalRender) {
        //noAA需要最后绘制，如果有noAa的图层，分为aa和noAa两个阶段分别绘制
        this._renderMode = mode;
        const drawContext = this._getDrawContext(args);
        drawContext.renderMode = this._renderMode;
        if (drawContext.renderTarget) {
            drawContext.renderTarget.fbo = fbo;
        }
        if (isFinalRender) {
            drawContext.isFinalRender = true;
        }

        this.forEachRenderer((renderer, layer) => {
            if (!layer.isVisible()) {
                return;
            }
            if (mode === 'default' ||
                !renderer.supportRenderMode && (mode === 'fxaa' || mode === 'fxaaAfterTaa') ||
                renderer.supportRenderMode && renderer.supportRenderMode(mode)) {
                this.clearStencil(renderer, fbo);
                renderer[methodName].apply(renderer, args);
            }
        });
    }

    _getDrawContext(args) {
        let timestamp = args[0];
        if (!isNumber(timestamp)) {
            timestamp = args[1];
        }
        if (timestamp !== this._contextFrameTime) {
            this.forEachRenderer((renderer, layer) => {
                if (!layer.isVisible()) {
                    return;
                }
                if (renderer.needRetireFrames && renderer.needRetireFrames()) {
                    this.setRetireFrames();
                }
            });
            this._drawContext = this._prepareDrawContext(timestamp);
            this._contextFrameTime = timestamp;
            this._frameEvent = isNumber(args[0]) ? null : args[0];
        }
        return this._drawContext;
    }

    _renderOutlines() {
        if (!this.isEnableOutline()) {
            return;
        }
        const fbo = this._getOutlineFBO();

        const fGl = this.glCtx;
        fGl.resetDrawCalls();
        this.forEachRenderer((renderer, layer) => {
            if (!layer.isVisible()) {
                return;
            }
            if (renderer.drawOutline) {
                renderer.drawOutline(fbo);
            }
        });
        this._outlineCounts = fGl.getDrawCalls();
    }

    _getOutlineFBO() {
        const { width, height } = this.canvas;
        let fbo = this._outlineFBO;
        if (!fbo) {
            const outlineTex = this.regl.texture({
                width: width,
                height: height,
                format: 'rgba4'
            });
            fbo = this._outlineFBO = this.regl.framebuffer({
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

    _getFBOColor(fbo) {
        if (this._isUseMultiSample()) {
            const blitFBO = this._getBlitFBO(fbo);
            if (blitFBO.width !== fbo.width || blitFBO.height !== fbo.height) {
                blitFBO.resize(fbo.width, fbo.height);
            } else {
                this.regl.clear({
                    color: [0, 0, 0, 0],
                    fbo: blitFBO
                });
            }
            blitFBO.blit(fbo);
            return blitFBO.color[0];
        } else {
            return fbo.color[0];
        }
    }

    _blitDepthTex() {
        if (this._depthTex.subimage) {
            return this._depthTex;
        }
        const { width, height } = this._depthTex;
        // multi sampled depth stencil renderbuffer
        if (!this._blitDepthFBO) {
            const regl = this.regl;
            const depthStencilTexture = regl.texture({
                min: 'nearest',
                mag: 'nearest',
                mipmap: false,
                type: 'depth stencil',
                width,
                height,
                format: 'depth stencil'
            });
            const rb = regl.renderbuffer({
                width,
                height,
                format: 'rgba4'
            });
            const info = {
                depthStencil: depthStencilTexture,
                colors: [rb],
                colorFormat: 'rgba4',
                width,
                height
            };
            this._blitDepthFBO = regl.framebuffer(info);
        }
        if (this._blitDepthFBO.width !== width || this._blitDepthFBO.height !== height) {
            this._blitDepthFBO.resize(width, height);
        }
        this.regl.clear({
            color: [0, 0, 0, 0],
            depth: 1,
            fbo: this._blitDepthFBO
        });
        this._blitDepthFBO.blit(this._targetFBO, 0x00000100, 'nearest');
        return this._blitDepthFBO.depthStencil;
    }

    _getBlitFBO(fbo) {
        if (!this._blitFBOs) {
            this._blitFBOs = [];
        }
        if (!fbo._blitFBO) {
            const info = this._createSimpleFBOInfo(true, fbo.width, fbo.height);
            const blitFbo = this.regl.framebuffer(info);
            this._blitFBOs.push(blitFbo);
            fbo._blitFBO = blitFbo;
        }
        return fbo._blitFBO;
    }

    _isUseMultiSample() {
        const regl = this.regl;
        const isWebGL2 = regl.limits['version'].indexOf('WebGL 2.0') === 0;
        return isWebGL2 && this.layer.options.antialias;
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
        if (this.layer.options['forceRedrawPerFrame']) {
            return true;
        }
        if (this['_toRedraw']) {
            this['_toRedraw'] = false;
            return true;
        }
        const map = this.getMap();
        if (map.isInteracting() && (this._groundPainter && this._groundPainter.isEnable() || this._envPainter && this._envPainter.isEnable())) {
            return true;
        }
        if (this._weatherPainter && this._weatherPainter.isEnable()) {
            return true;
        }
        const terrainLayer = this.layer.getTerrainLayer();
        if (terrainLayer) {
            const renderer = terrainLayer.getRenderer();
            if (renderer && renderer.testIfNeedRedraw()) {
                this._needUpdateSSR = true;
                return true;
            }
        }
        const layers = this._getLayers();
        for (const layer of layers) {
            if (!layer || !layer.isVisible()) {
                continue;
            }
            const renderer = layer.getRenderer();
            if (renderer && renderer.testIfNeedRedraw()) {
                // 如果图层发生变化，保存的depthTexture可能发生变化，所以ssr需要多重绘一次，更新depthTexture
                this._needUpdateSSR = true;
                return true;
            }
        }
        return false;
    }

    // _isLayerEnableTAA(renderer) {
    //     return this.isEnableTAA() && renderer.supportRenderMode && renderer.supportRenderMode('taa');
    // }

    isRenderComplete() {
        const layers = this._getLayers();
        for (const layer of layers) {
            const renderer = layer.getRenderer();
            if (renderer && !renderer.isRenderComplete()) {
                return false;
            }
        }
        return true;
    }

    mustRenderOnInteracting() {
        const layers = this._getLayers();
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
        const layers = this._getLayers();
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
        if (this._envPainter && this._envPainter.isEnable()) {
            return false;
        }
        const terrainLayer = this.layer.getTerrainLayer();
        if (terrainLayer) {
            const renderer = terrainLayer.getRenderer();
            if (renderer && !renderer.isBlank()) {
                return false;
            }
        }
        const layers = this._getLayers();
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
        attributes.antialias = !!layer.options['antialias'];
        this.glOptions = attributes;
        const gl = this.gl = createGLContext(this.canvas, attributes, layer.options['onlyWebGL1']);        // this.gl = gl;
        this._initGL(gl);
        gl.wrap = () => {
            return new GLContext(this.gl);
        };
        this.glCtx = gl.wrap();
        this.canvas.gl = this.gl;
        this.reglGL = gl.wrap();
        this.regl = createREGL({
            gl: this.reglGL,
            attributes,
            extensions: layer.options['extensions'],
            optionalExtensions: layer.options['optionalExtensions']
        });
        this.gl.regl = this.regl;
        this._jitter = [0, 0];


        this._groundPainter = new GroundPainter(this.regl, this.layer);
        this._envPainter = new EnvironmentPainter(this.regl, this.layer);
        const weatherConfig = this.layer.getWeatherConfig();
        this._weatherPainter = new WeatherPainter(this.regl, layer, weatherConfig);
        this._analysisPainter = new AnalysisPainter(this.regl, layer);

        const sceneConfig =  this.layer._getSceneConfig() || {};
        const config = sceneConfig && sceneConfig.postProcess;
        const ratio = config && config.antialias && config.antialias.jitterRatio || 0.2;
        this._jitGetter = new reshader.Jitter(ratio);
        this._postProcessor = new PostProcess(this.regl, this.layer, this._jitGetter);

        this._shadowProcess = new ShadowProcess(this.regl, this.layer);
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
        this._clearFramebuffers();
    }

    _clearFramebuffers() {
        const regl = this.regl;
        if (this._targetFBO) {
            regl.clear({
                color: EMPTY_COLOR,
                depth: 1,
                stencil: 0xFF,
                framebuffer: this._targetFBO
            });
            regl.clear({
                color: EMPTY_COLOR,
                framebuffer: this._noAaFBO
            });
            regl.clear({
                color: EMPTY_COLOR,
                framebuffer: this._pointFBO
            });
            if (this._taaFBO && this._taaDrawCount) {
                regl.clear({
                    color: EMPTY_COLOR,
                    framebuffer: this._taaFBO
                });
            }
            if (this._fxaaFBO && this._fxaaAfterTaaDrawCount) {
                regl.clear({
                    color: EMPTY_COLOR,
                    framebuffer: this._fxaaFBO
                });
            }
        }
        if (this._outlineFBO) {
            regl.clear({
                color: EMPTY_COLOR,
                framebuffer: this._outlineFBO
            });
        }
        regl.clear({
            color: EMPTY_COLOR,
            depth: 1,
            stencil: 0xFF
        });
    }

    resizeCanvas() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        if (this._targetFBO && (this._targetFBO.width !== width ||
            this._targetFBO.height !== height)) {
            super.resizeCanvas();
            this._targetFBO.resize(width, height);
            this._noAaFBO.resize(width, height);
            this._pointFBO.resize(width, height);
            if (this._taaFBO) {
                this._taaFBO.resize(width, height);
            }
            if (this._fxaaFBO) {
                this._fxaaFBO.resize(width, height);
            }
            this._clearFramebuffers();
            this.forEachRenderer(renderer => {
                if (renderer.canvas) {
                    renderer.resizeCanvas();
                }
            });
        }

    }

    getCanvasImage() {
        this.forEachRenderer(renderer => {
            renderer.getCanvasImage();
        });
        return super.getCanvasImage();
    }

    _getLayers() {
        return this.layer._getLayers();
    }

    forEachRenderer(fn) {
        const layers = this._getLayers();
        for (const layer of layers) {
            if (!layer.isVisible() || !layer.options['beneathTerrain']) {
                continue;
            }
            const renderer = layer.getRenderer();
            if (renderer) {
                fn(renderer, layer);
            }
        }
        const terrainLayer = this.layer.getTerrainLayer();
        if (terrainLayer) {
            const renderer = terrainLayer.getRenderer();
            if (renderer) {
                fn(renderer, terrainLayer);
            }
        }
        for (const layer of layers) {
            if (!layer.isVisible() || layer.options['beneathTerrain']) {
                continue;
            }
            const renderer = layer.getRenderer();
            if (renderer) {
                fn(renderer, layer);
            }
        }

    }

    clearStencil(renderer, fbo) {
        const stencilValue = renderer.getStencilValue ? renderer.getStencilValue() : 0xFF;
        const config = {
            stencil: stencilValue
        };
        if (fbo) {
            config['framebuffer'] = fbo;
        }
        this.regl.clear(config);
    }

    onRemove() {
        //regl framebuffer for picking created by children layers
        if (this.canvas.pickingFBO && this.canvas.pickingFBO.destroy) {
            this.canvas.pickingFBO.destroy();
        }
        this._destroyFramebuffers();
        if (this._groundPainter) {
            this._groundPainter.dispose();
            delete this._groundPainter;
        }
        if (this._envPainter) {
            this._envPainter.dispose();
            delete this._envPainter;
        }
        if (this._shadowProcess) {
            this._shadowProcess.dispose();
            delete this._shadowProcess;
        }
        if (this._postProcessor) {
            this._postProcessor.dispose();
            delete this._postProcessor;
        }
        if (this._outlineFBO) {
            this._outlineFBO.destroy();
            delete this._outlineFBO;
        }
        if (this._weatherPainter) {
            this._weatherPainter.dispose();
            delete this._weatherPainter;
        }
        super.onRemove();
    }

    _destroyFramebuffers() {
        if (this._targetFBO) {
            this._targetFBO.destroy();
            this._noAaFBO.destroy();
            this._pointFBO.destroy();
            if (this._taaFBO) {
                this._taaFBO.destroy();
                delete this._taaFBO;
            }
            if (this._fxaaFBO) {
                this._fxaaFBO.destroy();
                delete this._fxaaFBO;
            }
            delete this._targetFBO;
            delete this._noAaFBO;
            delete this._pointFBO;
            if (this._postFBO) {
                this._postFBO.destroy();
                delete this._postFBO;
            }
            if (this._blitDepthFBO) {
                this._blitDepthFBO.destroy();
                delete this._blitDepthFBO;
            }
            if (this._blitFBOs) {
                for (let i = 0; i < this._blitFBOs.length; i++) {
                    if (this._blitFBOs[i]) {
                        this._blitFBOs[i].destroy();
                    }
                }
                delete this._blitFBOs;
            }
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

    drawGround(forceRender) {
        const config = this.layer.getGroundConfig();
        if (!config || !config.enable) {
            return false;
        }
        if (!this._groundPainter) {
            return false;
        }
        const context = this.getFrameContext();
        const jitter = context.jitter;
        //地面绘制不用引入jitter，会导致地面的晃动
        context.jitter = NO_JITTER;
        // 1 是留给开启了ssr的图形的
        const polygonOffsetCount = this.layer.getPolygonOffsetCount();
        // 加一是为了防止有ssr的图形的polygonOffset被设置成1
        context.offsetFactor = polygonOffsetCount + 1;
        context.offsetUnits = polygonOffsetCount + 1;
        let sceneFilter;
        if (forceRender) {
            // 第一次绘制 ground 应该忽略 sceneFilter
            // 否则 noSSRFilter 会把 ground 过滤掉
            // 但当场景有透明物体时，物体背后没画ground，出现绘制问题。
            sceneFilter = context.sceneFilter;
            delete context.sceneFilter;
        }
        const drawn = this._groundPainter.paint(context);
        if (this._groundPainter.needToRedraw()){
            this.setToRedraw();
        }
        if (sceneFilter) {
            context.sceneFilter = sceneFilter;
        }
        context.jitter = jitter;
        return drawn;
    }

    _buildDrawFn(drawMethod) {
        const me = this;
        //drawBloom中会手动创建context
        return function (timestamp, context) {
            context = context || me._drawContext;
            const hasRenderTarget = context && context.renderTarget;
            if (hasRenderTarget) {
                context.renderTarget.getFramebuffer = getFramebuffer;
                context.renderTarget.getDepthTexture = getDepthTexture;
            }
            return drawMethod.call(this, timestamp, context);
        };
    }

    _buildDrawOnInteractingFn(drawMethod) {
        const me = this;
        //drawBloom中会手动创建context
        return function (event, timestamp, context) {
            context = context || me._drawContext;
            const hasRenderTarget = context && context.renderTarget;
            if (hasRenderTarget) {
                context.renderTarget.getFramebuffer = getFramebuffer;
                context.renderTarget.getDepthTexture = getDepthTexture;
            }
            return drawMethod.call(this, event, timestamp, context);
        };
    }

    _buildSetToRedrawFn(fn) {
        return function (...args) {
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
        const map = this.getMap();
        if (!enable || map.getPitch() <= MIN_SSR_PITCH) {
            return 0;
        }
        const projViewMat = map.projViewMatrix;
        const prevSsrMat = this._postProcessor.getPrevSsrProjViewMatrix();
        return prevSsrMat && mat4.exactEquals(prevSsrMat, projViewMat) ? SSR_STATIC : SSR_IN_ONE_FRAME;
        // return SSR_IN_ONE_FRAME;
        // SSR_STATIC的思路是直接利用上一帧的深度纹理，来绘制ssr，这样无需额外的ssr pass。
        // 但当场景里有透明的物体时，被物体遮住的倒影会在SSR_STATIC阶段中绘制，但在SSR_IN_ONE_FRAME中不绘制，出现闪烁，故取消SSR_STATIC
        // 2021-01-11 fuzhen 该问题通过在ssr shader中，通过手动比较深度值，决定是否绘制解决
        // 2021-02-05 fuzhen 通过在drawSSR前copyDepth，ssr统一在StandardShader中绘制，不再需要ssr后处理, 之后SSR_IN_ONE_FRAME相比SSR_STATIC，只是多了drawSSR
        // 2021-02-07 fuzhen ssr绘制顺序不同，会导致一些绘制问题，改为统一用SSR_IN_ONE_FRAME
        // 2021-02-11 fuzhen 重新分为SSR_STATIC和SSR_IN_ONE_FRAME，SSR_STATIC时重用上一帧depth纹理，在taa前绘制ssr图形，解决taa抖动造成的ssr图形边缘缝隙问题
    }

    isEnableTAA() {
        // const sceneConfig =  this.layer._getSceneConfig();
        // const config = sceneConfig && sceneConfig.postProcess;
        // return config && config.antialias && config.antialias.enable && config.antialias.taa;
        return false;
    }

    isEnableSSAO() {
        // const sceneConfig =  this.layer._getSceneConfig();
        // const config = sceneConfig && sceneConfig.postProcess;
        // return config && config.enable && config.ssao && config.ssao.enable;
        return false;
    }

    isEnableOutline() {
        const sceneConfig =  this.layer._getSceneConfig();
        const config = sceneConfig && sceneConfig.postProcess;
        return config && config.enable && config.outline && config.outline.enable;
    }

    isEnableWeather() {
        const sceneConfig =  this.layer._getSceneConfig();
        const config = sceneConfig && sceneConfig.weather;
        return config && config.enable;
    }

    _getViewStates() {
        const map = this.layer.getMap();

        const renderedView = this._renderedView;
        if (!renderedView) {
            this._renderedView = {
                center: map.getCenter(),
                bearing: map.getBearing(),
                pitch: map.getPitch(),
                res: map.getResolution()
                // count: scene.getMeshes().length - (displayShadow ? 1 : 0)
            };
            let lightDirectionChanged = false;
            if (map.options.lights) {
                const lightManager = map.getLightManager();
                const lightDirection = lightManager.getDirectionalLight().direction || DEFAULT_LIGHT_DIRECTION;
                this._renderedView.lightDirection = vec3.copy([], lightDirection);
                lightDirectionChanged = true;
            }
            return {
                viewChanged: true,
                lightDirectionChanged
            };
        }
        const res = map.getResolution();
        const scale = res / this._renderedView.res;
        // const maxPitch = map.options['cascadePitches'][2];
        // const pitch = map.getPitch();
        const cp = map.coordToContainerPoint(this._renderedView.center);
        const viewMoveThreshold = this.layer.options['viewMoveThreshold'];
        // const viewPitchThreshold = this.layer.options['viewPitchThreshold'];
        const viewChanged = (cp['_sub'](map.width / 2, map.height / 2).mag() > viewMoveThreshold) || scale < 0.95 || scale > 1.05;
        // Math.abs(renderedView.bearing - map.getBearing()) > 30 ||
        // (renderedView.pitch < maxPitch || pitch < maxPitch) && Math.abs(renderedView.pitch - pitch) > viewPitchThreshold;
        let lightDirectionChanged = false;
        if (map.options.lights) {
            const lightManager = map.getLightManager();
            const lightDirection = lightManager.getDirectionalLight().direction || DEFAULT_LIGHT_DIRECTION;
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
            this._renderedView.res = map.getResolution();
        }
        return {
            viewChanged,
            lightDirectionChanged
        };
    }



    _prepareDrawContext(timestamp) {
        const sceneConfig =  this.layer._getSceneConfig();
        const config = sceneConfig && sceneConfig.postProcess;
        const weatherConfig = sceneConfig && sceneConfig.weather;
        const context = {
            timestamp,
            renderMode: this._renderMode || 'default',
            includes: {},
            states: this._getViewStates(),
            testSceneFilter: mesh => {
                return !context.sceneFilter || context.sceneFilter(mesh);
            },
            isFinalRender: false,
            weather: {//drawContext传递到各个子图层中，用来渲染天气相关
                fog: weatherConfig && weatherConfig.fog
            }
        };

        const ratio = config && config.antialias && config.antialias.jitterRatio || 0.2;
        const jitGetter = this._jitGetter;
        if (jitGetter) {
            jitGetter.setRatio(ratio);
        }

        const ssrMode = this.isSSROn();
        let renderTarget;
        if (!config || !config.enable) {
            this._destroyFramebuffers();
        } else {
            const hasJitter = this.isEnableTAA();
            if (hasJitter) {
                const map = this.getMap();
                if (map.isInteracting() || this._needRetireFrames) {
                    jitGetter.reset();
                }
                jitGetter.getJitter(this._jitter);
                jitGetter.frame();
            } else {
                vec2.set(this._jitter, 0, 0);
            }
            context['jitter'] = this._jitter;
            const enableBloom = config.bloom && config.bloom.enable;
            if (enableBloom && ssrMode) {
                context['bloom'] = 1;
                context['sceneFilter'] = noPostFilter;
            } else if (enableBloom) {
                context['bloom'] = 1;
                context['sceneFilter'] = noBloomFilter;
            } else if (ssrMode) {
                context['sceneFilter'] = noSsrFilter;
            }

            renderTarget = this._getFramebufferTarget();
            if (renderTarget) {
                context.renderTarget = renderTarget;
            }
        }
        if (this._renderMode !== 'noAa') {

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
        // 2021-02-20 ssr的绘制全部统一到了drawSSR中，而不会在平时的绘制阶段绘制ssr了
        // if (ssrMode === SSR_STATIC) {
        //     const ssr = this._postProcessor.getSSRContext();
        //     if (ssr) {
        //         context.ssr = ssr;
        //     }
        // }
        return context;
    }

    _renderAnalysis(tex) {
        const layers = this._getLayers().filter(layer => {
            return layer.isVisible();
        });
        if (this.layer.getTerrainLayer()) {
            layers.push(this.layer.getTerrainLayer());
        }
        return this._analysisPainter.paint(tex, layers);
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
            if (this._shadowProcess) {
                this._shadowProcess.dispose();
                delete this._shadowProcess;
            }
            return null;
        }
        if (!this._shadowProcess) {
            this._shadowProcess = new ShadowProcess(this.regl, this.layer);
        }
        const shadow = {
            config: sceneConfig.shadow,
            defines: this._shadowProcess.getDefines(),
            uniformDeclares: ShadowProcess.getUniformDeclares()
        };
        shadow.renderUniforms = this._renderShadow(context);
        return shadow;
    }

    _renderShadow(context) {
        const fbo = context.renderTarget && context.renderTarget.fbo;
        const sceneConfig =  this.layer._getSceneConfig();
        const meshes = [];
        let forceUpdate = context.states.lightDirectionChanged || context.states.viewChanged;
        this.forEachRenderer((renderer, layer) => {
            if (!renderer.getShadowMeshes || !layer.isVisible()) {
                return;
            }
            const shadowMeshes = renderer.getShadowMeshes();
            if (Array.isArray(shadowMeshes)) {
                for (let i = 0; i < shadowMeshes.length; i++) {
                    if (shadowMeshes[i].needUpdateShadow) {
                        forceUpdate = true;
                    }
                    shadowMeshes[i].needUpdateShadow = false;
                    if (!shadowMeshes[i].hasFunctionUniform('minAltitude')) {
                        shadowMeshes[i].setFunctionUniform('minAltitude', () => {
                            return layer && layer.options.altitude || 0;
                        });
                    }
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
        const lightManager = map.getLightManager();
        const lightDirection = lightManager && lightManager.getDirectionalLight().direction || DEFAULT_LIGHT_DIRECTION;
        const displayShadow = !sceneConfig.ground || !sceneConfig.ground.enable;
        const uniforms = this._shadowProcess.render(displayShadow, map.projMatrix, map.viewMatrix, shadowConfig.color, shadowConfig.opacity, lightDirection, this._shadowScene, this._jitter, fbo, forceUpdate);
        // if (this._shadowProcess.isUpdated()) {
        //     this.setRetireFrames();
        // }
        return uniforms;
    }

    _renderWeather(tex) {
        let meshes = [];
        this.forEachRenderer((renderer, layer) => {
            if (!renderer.getAnalysisMeshes || !layer.isVisible()) {
                return;
            }
            const renderMeshes = renderer.getAnalysisMeshes();
            meshes = meshes.concat(renderMeshes);
        });
        if (this._groundPainter) {
            const groundMesh = this._groundPainter.getRenderMeshes();
            meshes = meshes.concat(groundMesh);
        }
        const weatherConfig = this.layer.getWeatherConfig();
        return this._weatherPainter.paint(tex, meshes, weatherConfig);
    }

    getGroundMesh() {
        if (this._groundPainter) {
            const groundMesh = this._groundPainter.getRenderMeshes();
            return groundMesh;
        }
        return [];
    }

    _getFramebufferTarget() {
        const sceneConfig =  this.layer._getSceneConfig();
        const config = sceneConfig && sceneConfig.postProcess;
        if (!this._targetFBO) {
            const regl = this.regl;
            let depthTex = this._depthTex;
            if (!depthTex || !depthTex['_texture'] || depthTex['_texture'].refCount <= 0) {
                depthTex = null;
            }
            const fboInfo = this.createFBOInfo(config, depthTex);
            this._depthTex = fboInfo.depth || fboInfo.depthStencil;
            this._targetFBO = regl.framebuffer(fboInfo);
            const noAaInfo = this.createFBOInfo(config, this._depthTex);
            this._noAaFBO = regl.framebuffer(noAaInfo);
            const pointInfo = this.createFBOInfo(config, this._depthTex);
            this._pointFBO = regl.framebuffer(pointInfo);
            this._clearFramebuffers();
        }
        return {
            fbo: this._targetFBO
        };
    }

    _createSimpleFBOInfo(forceTexture, width, height) {
        width = width || this.canvas.width, height = height || this.canvas.height;
        const regl = this.regl;
        const useMultiSamples = this._isUseMultiSample();
        let color;
        if (!forceTexture && useMultiSamples) {
            color = regl.renderbuffer({
                width,
                height,
                samples: this.layer.options['multiSamples'],
                format: 'rgba8'
            });
        } else {
            const type = 'uint8';//colorType || regl.hasExtension('OES_texture_half_float') ? 'float16' : 'float';
            color = regl.texture({
                min: 'nearest',
                mag: 'nearest',
                type,
                width,
                height
            });
        }
        const fboInfo = {
            width,
            height,
            colors: [color],
            // stencil: true,
            // colorCount,
            colorFormat: useMultiSamples ? 'rgba8' : 'rgba'
        };

        return fboInfo;
    }

    createFBOInfo(config, depthTex) {
        const { width, height } = this.canvas;
        const regl = this.regl;
        const fboInfo = this._createSimpleFBOInfo();
        const useMultiSamples = this._isUseMultiSample();
        const enableDepthTex = regl.hasExtension('WEBGL_depth_texture');
        if (useMultiSamples) {
            const renderbuffer = depthTex || regl.renderbuffer({
                width,
                height,
                format: 'depth24 stencil8',
                samples: this.layer.options['multiSamples']
            });
            fboInfo.depthStencil = renderbuffer;
        } else {
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
            if (this.isEnableWeather()) {
                throw new Error('you must enable the post process to turn on weather');
            }
            return;
        }
        this.layer.fire('postprocessstart');
        const map = this.layer.getMap();

        const enableTAA = this.isEnableTAA();
        let taaTex;
        if (enableTAA) {
            const needClear = this._needRetireFrames || map.getRenderer().isViewChanged();
            if (needClear) {
                this.layer.fire('taastart');
            }
            const { outputTex, redraw } = this._postProcessor.taa(this._getFBOColor(this._taaFBO), this._blitDepthTex(), {
                projMatrix: map.projMatrix,
                needClear
            });
            taaTex = outputTex;
            if (redraw) {
                this.setToRedraw();
            } else {
                this.layer.fire('taaend');
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
            outlineFactor = getValueOrDefault(config.outline, 'outlineFactor', outlineFactor);
            outlineWidth = getValueOrDefault(config.outline, 'outlineWidth', outlineWidth);
            outlineColor = getValueOrDefault(config.outline, 'outlineColor', outlineColor);
        }

        // const enableSSAO = this.isEnableSSAO();
        const enableSSR = config.ssr && config.ssr.enable;
        const enableBloom = config.bloom && config.bloom.enable;
        const bloomPainted = enableBloom && this._bloomPainted;
        const enableAntialias = +!!(config.antialias && config.antialias.enable);
        const enableAnalysis = this._analysisPainter._hasAnalysis();
        const enableWeather = this._weatherPainter._hasWeather();
        const hasPost = /* enableSSAO ||  */enableBloom || enableSSR || enableAnalysis || enableWeather;

        let postFBO = this._postFBO;
        if (hasPost) {
            if (!postFBO) {
                const info = this._createSimpleFBOInfo();
                if (this._isUseMultiSample()) {
                    info.depthStencil = this.regl.renderbuffer({
                        width: this.canvas.width,
                        height: this.canvas.height,
                        samples: this.layer.options['multiSamples'],
                        format: 'depth24 stencil8'
                    });
                }
                postFBO = this._postFBO = this.regl.framebuffer(info);
            }
            const { width, height } = this.canvas;
            if (postFBO.width !== width || postFBO.height !== height) {
                postFBO.resize(width, height);
            }
        } else {
            postFBO = null;
            if (this._postFBO) {
                this._postFBO.destroy();
                delete this._postFBO;
            }
        }

        let tex = this._getFBOColor(this._targetFBO);
        const noAaTex = this._noaaDrawCount && this._getFBOColor(this._noAaFBO);
        const pointTex = this._pointDrawCount && this._getFBOColor(this._pointFBO);

        // const enableFXAA = config.antialias && config.antialias.enable && (config.antialias.fxaa || config.antialias.fxaa === undefined);
        this._postProcessor.fxaa(
            postFBO,
            tex,
            // 如果hasPost为true，则fxaa阶段不输入noAaTex，否则会在renderFBOToScreen阶段给文字和图标应用抗锯齿，造成绘制问题
            !bloomPainted && noAaTex,
            !bloomPainted && pointTex,
            taaTex,
            this._fxaaAfterTaaDrawCount && this._fxaaFBO && this._getFBOColor(this._fxaaFBO),
            enableAntialias,//+(!hasPost && enableAntialias),
            // +!!enableFXAA,
            // 1,
            +!!(config.toneMapping && config.toneMapping.enable),
            +!!(!hasPost && config.sharpen && config.sharpen.enable),
            map.getDevicePixelRatio(),
            sharpFactor,
            enableOutline && this._outlineCounts > 0 && this._getOutlineFBO(),
            highlightFactor,
            outlineFactor,
            outlineWidth,
            outlineColor
        );

        if (postFBO) {
            tex = this._getFBOColor(postFBO);
        }

        // if (enableSSAO && (this._fxaaAfterTaaDrawCount || this._taaDrawCount || this._fxaaDrawCount)) {
        //     //TODO 合成时，SSAO可能会被fxaaFBO上的像素遮住
        //     //generate ssao texture for the next frame
        //     tex = this._postProcessor.ssao(tex, this._blitDepthTex(), {
        //         projMatrix: map.projMatrix,
        //         cameraNear: map.cameraNear,
        //         cameraFar: map.cameraFar,
        //         ssaoBias: config.ssao && config.ssao.bias || 10,
        //         ssaoRadius: config.ssao && config.ssao.radius || 100,
        //         ssaoIntensity: config.ssao && config.ssao.intensity || 0.5
        //     });
        // }

        if (enableBloom && this._bloomPainted) {
            const bloomConfig = config.bloom;
            const threshold = +bloomConfig.threshold || 0;
            const factor = getValueOrDefault(bloomConfig, 'factor', 1);
            const radius = getValueOrDefault(bloomConfig, 'radius', 1);
            tex = this._postProcessor.bloom(tex, noAaTex, pointTex, threshold, factor, radius, enableAntialias);
        }

        if (enableSSR) {
            this._postProcessor.genSsrMipmap(tex, this._blitDepthTex());
            if (this._needUpdateSSR) {
                const needRetireFrames = this._needRetireFrames;
                this.setToRedraw();
                this._needRetireFrames = needRetireFrames;
                this._needUpdateSSR = false;
            }
        }
        if (this._analysisPainter) {
            tex = this._renderAnalysis(tex);
        }
        if (this.isEnableWeather()) {
            tex = this._renderWeather(tex);
        }

        if (hasPost) {
            this._postProcessor.renderFBOToScreen(tex, +!!(config.sharpen && config.sharpen.enable), sharpFactor, map.getDevicePixelRatio());
        }
        this.layer.fire('postprocessend');
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

export default GroupGLLayerRenderer;


function getValueOrDefault(v, key, defaultValue) {
    if (isNil(v[key])) {
        return defaultValue;
    }
    return v[key];
}
