import * as maptalks from 'maptalks';
import Renderer from './GroupGLLayerRenderer.js';

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
        return JSON.parse(JSON.stringify(this.options.sceneConfig || {}));
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

GroupGLLayer.registerRenderer('gl', Renderer);
GroupGLLayer.registerRenderer('canvas', null);

function empty() {}

if (typeof window !== 'undefined') {
    // append GroupGLLayer on maptalks manually
    if (window.maptalks) window.maptalks.GroupGLLayer = GroupGLLayer;
}
