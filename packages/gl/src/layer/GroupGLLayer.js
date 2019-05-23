import * as maptalks from 'maptalks';
import { GLContext } from '@maptalks/fusiongl';

const options = {
    renderer : 'gl',
    antialias : true,
    extensions : [
        // 'ANGLE_instanced_arrays',
        'OES_texture_float',
        'OES_texture_float_linear',
        'OES_element_index_uint',
        'OES_standard_derivatives'
    ],
    optionalExtensions : ['WEBGL_draw_buffers', 'EXT_shader_texture_lod'],
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
                if (!this.layers[i]) {
                    continue;
                }
                if (this.layers[i] && this.layers[i].toJSON) {
                    layers[i].push(layers[i].toJSON());
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

    }

    resizeCanvas() {
        super.resizeCanvas();
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
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
}

GroupGLLayer.registerRenderer('gl', Renderer);
GroupGLLayer.registerRenderer('canvas', null);

function empty() {}

if (typeof window !== 'undefined') {
    // append GroupGLLayer on maptalks manually
    if (window.maptalks) window.maptalks.GroupGLLayer = GroupGLLayer;
}
