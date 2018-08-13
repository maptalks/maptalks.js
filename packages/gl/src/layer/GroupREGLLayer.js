import * as maptalks from 'maptalks';
import createREGL from 'regl';

const options = {
    renderer : 'gl',
    extensions : [
        // 'ANGLE_instanced_arrays',
        'OES_texture_float',
        'OES_texture_float_linear',
        'OES_element_index_uint',
        'OES_standard_derivatives'
    ],
    optionalExtensions : ['WEBGL_draw_buffers', 'EXT_shader_texture_lod']
};

export default class GroupREGLLayer extends maptalks.Layer {
    /**
     * Reproduce a GroupREGLLayer from layer's profile JSON.
     * @param  {Object} layerJSON - layer's profile JSON
     * @return {GroupREGLLayer}
     * @static
     * @private
     * @function
     */
    static fromJSON(layerJSON) {
        if (!layerJSON || layerJSON['type'] !== 'GroupREGLLayer') {
            return null;
        }
        const layers = layerJSON['layers'].map(json => maptalks.Layer.fromJSON(json));
        return new GroupREGLLayer(layerJSON['id'], layers, layerJSON['options']);
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
        this._groupChildren = [];
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
        const profile = {
            'type': this.getJSONType(),
            'id': this.getId(),
            'layers' : this.layers.map(layer => layer.toJSON()),
            'options': this.config()
        };
        return profile;
    }

    onLoadEnd() {
        const map = this.getMap();
        this.layers.forEach(layer => {
            this._layerMap[layer.getId()] = layer;
            if (layer.getChildLayer) {
                this._groupChildren.push(layer);
            }
            layer['_canvas'] = this.getRenderer().canvas;
            layer['_bindMap'](map);
            layer.once('renderercreate', this._onChildRendererCreate, this);
            layer.load();
            this._bindChildListeners(layer);
        });
        super.onLoadEnd();
    }

    onRemove() {
        this.layers.forEach(layer => {
            layer._doRemove();
            layer.off('show hide', this._onLayerShowHide, this);
        });
        delete this._layerMap;
        delete this._groupChildren;
        super.onRemove();
    }

    getChildLayer(id) {
        const layer = this._layerMap[id];
        if (layer) {
            return layer;
        }
        for (let i = 0; i < this._groupChildren.length; i++) {
            const child = this._groupChildren[i].getChildLayer(id);
            if (child) {
                return child;
            }
        }
        return null;
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
                throw new Error(`Duplicate child layer id (${layerId}) in the GroupREGLLayer (${this.getId()})`);
            } else {
                ids[layerId] = 1;
            }
        });
    }
}

GroupREGLLayer.mergeOptions(options);

GroupREGLLayer.registerJSONType('GroupREGLLayer');

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
        this.forEachRenderer(renderer => {
            renderer.render.apply(renderer, args);
        });
        this['_toRedraw'] = false;
    }

    drawOnInteracting(...args) {
        this.forEachRenderer(renderer => {
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
            antialias: true,
            stencil : true
        };
        attributes.preserveDrawingBuffer = true;
        this.glOptions = attributes;
        this.gl = this._createGLContext(this.canvas, attributes);

        this.regl = createREGL({
            gl : this.gl,
            attributes,
            extensions : layer.options['extensions'],
            optionalExtensions : layer.options['optionalExtensions']
        });
        this.canvas.groupRegl = this.regl;
        this.canvas.gl = this.gl;
    }

    clearCanvas() {
        super.clearCanvas();
        this.regl.clear({
            color: [0, 0, 0, 0],
            depth: 1,
            stencil: 0
        });
    }

    resizeCanvas() {
        super.resizeCanvas();
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
        let context = null;
        /* eslint-disable no-empty */
        for (let i = 0; i < names.length; ++i) {
            try {
                context = canvas.getContext(names[i], options);
            } catch (e) {}
            if (context) {
                break;
            }
        }
        return context;
        /* eslint-enable no-empty */
    }
}

GroupREGLLayer.registerRenderer('gl', Renderer);
GroupREGLLayer.registerRenderer('canvas', null);

function empty() {}

if (typeof window !== 'undefined') {
    // append GroupREGLLayer on maptalks manually
    if (window.maptalks) window.maptalks.GroupREGLLayer = GroupREGLLayer;
}
