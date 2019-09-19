import * as maptalks from 'maptalks';
import { GLContext } from '@maptalks/fusiongl';
import ShadowPass from './shadow/ShadowPass';
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
    optionalExtensions : ['OES_texture_float', 'WEBGL_depth_texture', 'WEBGL_draw_buffers', 'EXT_shader_texture_lod', 'OES_texture_float_linear'],
    forceRenderOnZooming : true,
    forceRenderOnMoving : true,
    forceRenderOnRotating : true
};

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
        this.getRenderer().setToRedraw();
        return this;
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
        layer.load();
        this._bindChildListeners(layer);
    }

    onRemove() {
        this.layers.forEach(layer => {
            layer._doRemove();
            layer.off('show hide', this._onLayerShowHide, this);
        });
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

    onAdd() {
        super.onAdd();
        this.prepareCanvas();
    }

    render(...args) {
        if (!this.getMap() || !this.layer.isVisible()) {
            return;
        }
        if (!this._replaceChildDraw) {
            this.forEachRenderer((renderer) => {
                renderer.draw = this._buildDrawFn(renderer.draw);
                renderer.drawOnInteracting = this._buildDrawFn(renderer.drawOnInteracting);
            });
            this._replaceChildDraw = true;
        }
        this.prepareRender();
        this.prepareCanvas();
        this.forEachRenderer((renderer, layer) => {
            if (!layer.isVisible()) {
                return;
            }
            const gl = renderer.gl;
            if (gl && (gl instanceof GLContext)) {
                gl.clear(gl.STENCIL_BUFFER_BIT);
            }
            renderer.render.apply(renderer, args);
        });
        this._postProcess();
        this['_toRedraw'] = false;
    }

    drawOnInteracting(...args) {
        if (!this.getMap() || !this.layer.isVisible()) {
            return;
        }
        this.forEachRenderer((renderer, layer) => {
            if (!layer.isVisible()) {
                return;
            }
            const gl = renderer.gl;
            if (gl && (gl instanceof GLContext)) {
                gl.clear(gl.STENCIL_BUFFER_BIT);
            }
            renderer.drawOnInteracting.apply(renderer, args);
        });
        this._postProcess();
        this['_toRedraw'] = false;
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
            stencil : true
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
            extensions: [
                'ANGLE_instanced_arrays',
                'OES_element_index_uint',
                'OES_standard_derivatives'
            ],
            optionalExtensions: layer.options['glExtensions'] || ['OES_texture_float', 'WEBGL_draw_buffers', 'EXT_shader_texture_lod', 'OES_texture_float_linear']
        });
        this.gl.regl = this._regl;
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
        const gl = this.glCtx;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);

        // only clear main framebuffer
        gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        if (this._targetFBO) {
            this._regl.clear({
                color: [0, 0, 0, 0],
                depth: 1,
                stencil: 0xFF,
                framebuffer: this._targetFBO
            });
        }
    }

    resizeCanvas() {
        super.resizeCanvas();
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        if (this._targetFBO) {
            this._targetFBO.resize(this.canvas.width, this.canvas.height);
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

    onRemove() {
        //regl framebuffer for picking created by children layers
        if (this.canvas.pickingFBO && this.canvas.pickingFBO.destroy) {
            this.canvas.pickingFBO.destroy();
        }
        super.onRemove();
    }

    _buildDrawFn(drawMethod) {
        const parent = this;
        return function (timestamp) {
            if (timestamp !== parent._contextFrameTime) {
                parent._drawContext = parent._prepareDrawContext();
                parent._contextFrameTime = timestamp;
            }
            return drawMethod.call(this, timestamp, parent._drawContext);
        };
    }

    _prepareDrawContext() {
        const context = {
        };
        const framebuffer = this._getFramebufferTarget();
        if (framebuffer) {
            context.renderTarget = framebuffer;
        }
        const shadowContext = this._getShadowContext(framebuffer && framebuffer.fbo);
        if (shadowContext) {
            context.shadow = shadowContext;
        }
        return context;
    }

    _getShadowContext(fbo) {
        const sceneConfig =  this.layer._getSceneConfig();
        if (!sceneConfig.shadow || !sceneConfig.shadow.enable) {
            if (this._shadowPass) {
                this._shadowPass.delete();
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
        this.forEachRenderer(renderer => {
            if (!renderer.getShadowMeshes) {
                return;
            }
            const shadowMeshes = renderer.getShadowMeshes();
            if (Array.isArray(shadowMeshes)) {
                for (let i = 0; i < shadowMeshes.length; i++) {
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
        const lightDirection = sceneConfig.shadow.lightDirection || [1, 1, -1];
        const shadowContext = this._shadowPass.render(map.projMatrix, map.viewMatrix, lightDirection, this._shadowScene, fbo);
        return shadowContext;
    }

    _getFramebufferTarget() {
        const sceneConfig =  this.layer._getSceneConfig();
        const config = sceneConfig.postProcess;
        if (!config || !this._isPostProcessEnabled()) {
            if (this._targetFBO) {
                this._targetFBO.destroy();
            }
            return null;
        }
        const depthTexture = config.ssao && config.ssao.enable;
        const colorCount = config.bloom && config.bloom.enable ? 2 : 1;
        if (!this._targetFBO) {
            const regl = this._regl;
            const color = regl.texture({
                min: 'linear',
                mag: 'linear',
                type: 'uint8',
                width: this.canvas.width,
                height: this.canvas.height
            });
            this._targetFBO = regl.framebuffer({
                width: this.canvas.width,
                height: this.canvas.height,
                colors: [color],
                // colorType: 'float',
                depthTexture: !!depthTexture,
                colorCount,
                colorFormat: 'rgba' //TODO 是否能改成rgb?
            });
        }
        return {
            bloom: config.bloom && config.bloom.enable1,
            fbo: this._targetFBO
        };
    }

    _postProcess() {
        const sceneConfig =  this.layer._getSceneConfig();
        const config = sceneConfig.postProcess;
        if (!config || !config.enable) {
            return;
        }
        if (!this._postProcessor) {
            const viewport = {
                x: 0,
                y: 0,
                width: () => {
                    return this.canvas.width;
                },
                height: () => {
                    return this.canvas.height;
                }
            };
            this._postProcessor = new PostProcess(this._regl, viewport, this._targetFBO);
        }
        if (config.antialias && config.antialias.enable) {
            this._postProcessor.fxaa();
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
