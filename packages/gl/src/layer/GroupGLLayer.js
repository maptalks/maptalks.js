import * as maptalks from 'maptalks';
import { mat4, vec2 } from 'gl-matrix';
import { GLContext } from '@maptalks/fusiongl';
import ShadowPass from './shadow/ShadowProcess';
import * as reshader from '@maptalks/reshader.gl';
import createREGL from '@maptalks/regl';
import PostProcess from './postprocess/PostProcess.js';

const options = {
    renderer : 'gl',
    antialias : false,
    extensions : [
        'ANGLE_instanced_arrays',
        'OES_element_index_uint',
        'OES_standard_derivatives'
    ],
    optionalExtensions : [
        'OES_vertex_array_object',
        'OES_texture_half_float', 'OES_texture_half_float_linear',
        'OES_texture_float', 'OES_texture_float_linear',
        'WEBGL_depth_texture', /*'WEBGL_draw_buffers', */'EXT_shader_texture_lod'
    ],
    forceRenderOnZooming : true,
    forceRenderOnMoving : true,
    forceRenderOnRotating : true,
    jitterRatio: 0.02
};

const bloomFilter = m => m.getUniform('bloom');
const ssrFilter = m => m.getUniform('ssr');
const noPostFilter = m => !m.getUniform('bloom') && !m.getUniform('ssr');
const noBloomFilter = m => !m.getUniform('bloom');
const noSsrFilter = m => !m.getUniform('ssr');

export default class GroupGLLayer extends maptalks.Layer {
    /**
     * Reproduce a GroupGLLayer from layer's profile JSON.
     * @param  {Object} layerJSON - layer's profile JSON
     * @return {GroupGLLayer}
     * @static
     * @private
     * @function
     */
    static fromJSON(layerJSON) {
        if (!layerJSON || layerJSON['type'] !== 'GroupGLLayer') {
            return null;
        }
        const layers = layerJSON['layers'].map(json => maptalks.Layer.fromJSON(json));
        return new GroupGLLayer(layerJSON['id'], layers, layerJSON['options']);
    }

    /**
     * @param {String|Number} id    - layer's id
     * @param {Layer[]} layers      - layers to add
     * @param {Object}  [options=null]          - construct options
     * @param {*}  [options.*=null]             - options
     */
    constructor(id, layers, options) {
        super(id, options);
        this.layers = layers || [];
        this._checkChildren();
        this._layerMap = {};
    }

    setSceneConfig(sceneConfig) {
        this.options.sceneConfig = sceneConfig;
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.updateSceneConfig();
        }
        return this;
    }

    getSceneConfig() {
        return JSON.parse(JSON.stringify(this.options.sceneConfig));
    }

    _getSceneConfig() {
        return this.options.sceneConfig;
    }

    /**
     * Add a new Layer.
     * @param {Layer} layer - new layer
     * @returns {GroupGLLayer} this
     */
    addLayer(layer, idx) {
        if (layer.getMap()) {
            throw new Error(`layer(${layer.getId()} is already added on map`);
        }
        if (idx === undefined) {
            this.layers.push(layer);
        } else {
            this.layers.splice(idx, 0, layer);
        }
        this._checkChildren();
        const renderer = this.getRenderer();
        if (!renderer) {
            // not loaded yet
            return this;
        }
        this._prepareLayer(layer);
        renderer.setToRedraw();
        return this;
    }

    removeLayer(layer) {
        if (maptalks.Util.isString(layer)) {
            layer = this.getChildLayer(layer);
        }
        const idx = this.layers.indexOf(layer);
        if (idx < 0) {
            return this;
        }
        layer._doRemove();
        layer.off('show hide', this._onLayerShowHide, this);
        delete this._layerMap[layer.getId()];
        this.layers.splice(idx, 1);
        const renderer = this.getRenderer();
        if (!renderer) {
            // not loaded yet
            return this;
        }
        renderer.setToRedraw();
        return this;
    }

    _updatePolygonOffset() {
        let total = 0;
        for (let i = 0; i < this.layers.length; i++) {
            if (this.layers[i].setPolygonOffset && this.layers[i].getPolygonOffsetCount) {
                total += this.layers[i].getPolygonOffsetCount();
            }
        }
        let offset = 0;
        for (let i = 0; i < this.layers.length; i++) {
            if (this.layers[i].setPolygonOffset && this.layers[i].getPolygonOffsetCount) {
                this.layers[i].setPolygonOffset(offset, total);
                offset += this.layers[i].getPolygonOffsetCount();
            }
        }
    }

    /**
     * Get children TileLayer
     * @returns {TileLayer[]}
     */
    getLayers() {
        return this.layers;
    }

    /**
     * Export the GroupTileLayer's profile json. <br>
     * Layer's profile is a snapshot of the layer in JSON format. <br>
     * It can be used to reproduce the instance by [fromJSON]{@link Layer#fromJSON} method
     * @return {Object} layer's profile JSON
     */
    toJSON() {
        const layers = [];
        if (this.layers) {
            for (let i = 0; i < this.layers.length; i++) {
                const layer = this.layers[i];
                if (!layer) {
                    continue;
                }
                if (layer && layer.toJSON) {
                    layers.push(layer.toJSON());
                }
            }
        }
        const profile = {
            'type': this.getJSONType(),
            'id': this.getId(),
            'layers' : layers,
            'options': this.config()
        };
        return profile;
    }

    onLoadEnd() {
        this.layers.forEach(layer => {
            this._prepareLayer(layer);
        });
        super.onLoadEnd();
    }

    _prepareLayer(layer) {
        const map = this.getMap();
        this._layerMap[layer.getId()] = layer;
        layer['_canvas'] = this.getRenderer().canvas;
        layer['_bindMap'](map);
        layer.once('renderercreate', this._onChildRendererCreate, this);
        // layer.on('setstyle updatesymbol', this._onChildLayerStyleChanged, this);
        layer.load();
        this._bindChildListeners(layer);
    }

    onRemove() {
        this.layers.forEach(layer => {
            layer._doRemove();
            layer.off('show hide', this._onLayerShowHide, this);
        });
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
        if (this._postProcessor) {
            this._postProcessor.delete();
            delete this._postProcessor;
        }
        if (this._shadowPass) {
            this._shadowPass.delete();
            delete this._shadowPass;
        }
        delete this._layerMap;
        super.onRemove();
    }

    getChildLayer(id) {
        const layer = this._layerMap[id];
        return layer || null;
    }

    _bindChildListeners(layer) {
        layer.on('show hide', this._onLayerShowHide, this);
    }

    _onLayerShowHide() {
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
    }

    _onChildRendererCreate(e) {
        e.renderer.clearCanvas = empty;
    }

    // _onChildLayerStyleChanged() {
    //     const renderer = this.getRenderer();
    //     if (renderer) {
    //         renderer.setTaaOutdated();
    //     }
    // }

    isVisible() {
        if (!super.isVisible()) {
            return false;
        }
        const children = this.layers;
        for (let i = 0, l = children.length; i < l; i++) {
            if (children[i].isVisible()) {
                return true;
            }
        }
        return false;
    }

    _checkChildren() {
        const ids = {};
        this.layers.forEach(layer => {
            const layerId = layer.getId();
            if (ids[layerId]) {
                throw new Error(`Duplicate child layer id (${layerId}) in the GroupGLLayer (${this.getId()})`);
            } else {
                ids[layerId] = 1;
            }
        });
    }
}

GroupGLLayer.mergeOptions(options);

GroupGLLayer.registerJSONType('GroupGLLayer');

class Renderer extends maptalks.renderer.CanvasRenderer {

    setToRedraw() {
        this.setTaaOutdated();
        super.setToRedraw();
    }

    onAdd() {
        super.onAdd();
        this.prepareCanvas();
    }

    updateSceneConfig() {
        this.setToRedraw();
    }

    render(...args) {
        if (!this.getMap() || !this.layer.isVisible()) {
            return;
        }
        if (!this._replaceChildDraw) {
            this.forEachRenderer((renderer) => {
                renderer.draw = this._buildDrawFn(renderer.draw);
                renderer.drawOnInteracting = this._buildDrawFn(renderer.drawOnInteracting);
                renderer.setToRedraw = this._buildSetToRedrawFn(renderer.setToRedraw);
            });
            this._replaceChildDraw = true;
        }
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
                this._aaOutdated = true;
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
        const layers = this.layer.getLayers();
        for (const layer of layers) {
            const renderer = layer.getRenderer();
            if (renderer && renderer.testIfNeedRedraw()) {
                this.setTaaOutdated();
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
        super.onRemove();
    }

    setTaaOutdated() {
        this._aaOutdated = true;
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
            parent.setTaaOutdated();
            return fn.apply(this, args);
        };
    }

    _prepareDrawContext() {
        const sceneConfig =  this.layer._getSceneConfig();
        const config = sceneConfig && sceneConfig.postProcess;
        const context = {
            renderMode: this._renderMode || 'default'
        };
        let renderTarget;
        if (!config || !config.enable) {
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
        } else {
            const hasJitter = config.antialias && config.antialias.enable;
            if (hasJitter) {
                context['jitter'] = this._jitGetter.getJitter(this._jitter);
                this._jitGetter.frame();
            } else {
                vec2.set(this._jitter, 0, 0);
            }
            const enableBloom = config.bloom && config.bloom.enable;
            const enableSsr = config.ssr && config.ssr.enable;
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
            const shadowContext = this._getShadowContext(renderTarget && renderTarget.fbo);
            if (shadowContext) {
                context.shadow = shadowContext;
            }
        }
        return context;
    }

    _getShadowContext(fbo) {
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
            uniformDeclares: this._shadowPass.getUniformDeclares()
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
        const lightDirection = shadowConfig.lightDirection || [1, 1, -1];
        const uniforms = this._shadowPass.render(map.projMatrix, map.viewMatrix, shadowConfig.color, shadowConfig.opacity, lightDirection, this._shadowScene, this._jitter, fbo, forceUpdate);
        this._shadowUpdated = this._shadowPass.isUpdated();
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

    _createFBOInfo(config, depthTex, colorType) {
        const width = this.canvas.width, height = this.canvas.height;
        const regl = this._regl;
        const type = colorType || regl.hasExtension('OES_texture_half_float') ? 'float16' : 'float';
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
            this._aaOutdated = false;
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

        const enableSSR = config.ssr && config.ssr.enable;
        if (enableSSR) {
            const ssrTex = this._drawSsr();
            tex = this._ssrPass.combine(tex, ssrTex);
        } else if (this._ssrPass) {
            this._ssrPass.dispose();
            delete this._ssrPass;
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
            const factor = isNil(bloomConfig.factor) ? 0.5 : +bloomConfig.factor;
            const radius = isNil(bloomConfig.radius) ? 0.1 : +bloomConfig.radius;
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
                needClear: this._aaOutdated || this._shadowUpdated || map.getRenderer().isViewChanged(),
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
            this._aaOutdated = false;
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

        if (this._ssrPass) {
            this._ssrPass.genMipMap(tex);
            if (!this._ssrFBO._projViewMatrix) {
                this._ssrFBO._projViewMatrix = [];
            }
            mat4.copy(this._ssrFBO._projViewMatrix, this.getMap().projViewMatrix);
        }

        delete this._shadowUpdated;
    }


    _drawSsr() {
        const regl = this._regl;
        if (!this._ssrPass) {
            this._ssrPass = new reshader.SsrPass(regl);
        }
        const ssrFBO = this._ssrFBO;
        const sceneConfig =  this.layer._getSceneConfig();
        const config = sceneConfig && sceneConfig.postProcess;
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
        const timestamp = this._contextFrameTime;
        const event = this._frameEvent;
        const context = this._drawContext;
        context['sceneFilter'] = ssrFilter;
        const texture = this._ssrPass.getMipmapTexture();
        context.ssr = {
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
            const info = this._createFBOInfo(config, this._depthTex/*, 'uint8'*/);
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

GroupGLLayer.registerRenderer('gl', Renderer);
GroupGLLayer.registerRenderer('canvas', null);

function empty() {}

if (typeof window !== 'undefined') {
    // append GroupGLLayer on maptalks manually
    if (window.maptalks) window.maptalks.GroupGLLayer = GroupGLLayer;
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
