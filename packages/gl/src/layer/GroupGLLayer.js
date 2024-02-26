import * as maptalks from 'maptalks';
import Renderer from './GroupGLLayerRenderer.js';
import { vec3 } from 'gl-matrix';
import { isNil, extend } from './util/util.js';
import TerrainLayer from './terrain/TerrainLayer';
import RayCaster from './raycaster/RayCaster.js';

const options = {
    renderer : 'gl',
    antialias : true,
    extensions : [

    ],
    single: true,
    onlyWebGL1: false,
    optionalExtensions : [
        'ANGLE_instanced_arrays',
        'OES_element_index_uint',
        'OES_standard_derivatives',
        'OES_vertex_array_object',
        'OES_texture_half_float',
        'OES_texture_half_float_linear',
        'OES_texture_float',
        'OES_texture_float_linear',
        'WEBGL_depth_texture',
        'EXT_shader_texture_lod',
        'EXT_frag_depth',
        'EXT_texture_filter_anisotropic',
        // compressed textures
        'WEBGL_compressed_texture_astc',
        'WEBGL_compressed_texture_etc',
        'WEBGL_compressed_texture_etc1',
        'WEBGL_compressed_texture_pvrtc',
        'WEBGL_compressed_texture_s3tc',
        'WEBGL_compressed_texture_s3tc_srgb'
    ],
    forceRenderOnZooming : true,
    forceRenderOnMoving : true,
    forceRenderOnRotating : true,
    viewMoveThreshold: 100,
    geometryEvents: true,
    multiSamples: 4,
    forceRedrawPerFrame: false
};

//
const emptyMethod = () => {};
const EMPTY_COORD0 = new maptalks.Coordinate(0, 0), EMPTY_COORD1 = new maptalks.Coordinate(0, 0);
const TEMP_VEC3 = [];
const cp = [0, 0, 0], coord0 = [0, 0, 0, 1], coord1 = [0, 0, 0, 1];

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
        this.layers = layers && layers.slice() || [];
        this.layers.forEach(layer => {
            if (layer.getMap()) {
                throw new Error(`layer(${layer.getId()} is already added on map`);
            }
        });
        this._checkChildren();
        this.sortLayersByZIndex();
        this._layerMap = {};
    }

    sortLayersByZIndex() {
        if (!this.layers || !this.layers.length) {
            return;
        }
        for (let i = 0, l = this.layers.length; i < l; i++) {
            this.layers[i]['__group_gl_order'] = i;
        }
        this.layers.sort(sortLayersByZIndex);
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
        return JSON.parse(JSON.stringify(this._getSceneConfig()));
    }

    _getSceneConfig() {
        return this.options.sceneConfig || {};
    }

    getGroundConfig() {
        const sceneConfig = this._getSceneConfig();
        return sceneConfig.ground;
    }

    getWeatherConfig() {
        const sceneConfig = this._getSceneConfig();
        return sceneConfig.weather;
    }

    /**
     * Add a new Layer.
     * @param {Layer} layer - new layer
     * @returns {GroupGLLayer} this
     */
    addLayer(layer, idx) {
        if (layer.getMap()) {
            throw new Error(`layer(${layer.getId()}) is already added on map`);
        }
        if (layer.options['renderer'] !== 'gl') {
            throw new Error(`layer(${layer.getId()})'s renderer is canvas, not supported to be added to GroupGLLayer`);
        }
        if (idx === undefined) {
            this.layers.push(layer);
        } else {
            this.layers.splice(idx, 0, layer);
        }
        this._checkChildren();
        this.sortLayersByZIndex();
        const renderer = this.getRenderer();
        if (!renderer) {
            // not loaded yet
            return this;
        }
        this._prepareLayer(layer);
        this._updateTerrainSkinLayers();
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
        const layerRenderer = layer.getRenderer();
        if (layerRenderer && layerRenderer.setTerrainHelper) {
            layerRenderer.setTerrainHelper(null);
        }
        layer._doRemove();
        this._unbindChildListeners(layer);
        delete this._layerMap[layer.getId()];
        this.layers.splice(idx, 1);
        const renderer = this.getRenderer();
        if (!renderer) {
            // not loaded yet
            return this;
        }
        this._updateTerrainSkinLayers();
        renderer.setToRedraw();
        return this;
    }

    clearLayers() {
        const layers = this.getLayers();
        for (let i = 0; i < layers.length; i++) {
            if (layers[i]) {
                layers[i].remove();
            }
        }
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
        const len = this.layers.length;
        for (let i = len - 1; i >= 0; i--) {
            if (this.layers[i].setPolygonOffset && this.layers[i].getPolygonOffsetCount) {
                this.layers[i].setPolygonOffset(offset, total);
                offset += this.layers[i].getPolygonOffsetCount();
            }
        }
        this._polygonOffset = offset;
    }

    getPolygonOffsetCount() {
        return this._polygonOffset;
    }

    /**
     * Get children TileLayer
     * @returns {TileLayer[]}
     */
    getLayers() {
        return this.layers.slice();
    }

    _getLayers() {
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
        if (this.options['terrain']) {
            this._initTerrainLayer();
        }
        super.onLoadEnd();
    }

    _prepareLayer(layer) {
        const map = this.getMap();
        this._layerMap[layer.getId()] = layer;
        layer['_canvas'] = this.getRenderer().canvas;
        layer['_bindMap'](map);
        layer.once('renderercreate', this._onChildRendererCreate, this);
        // layer.on('setstyle updatesymbol', this._onChildLayerStyleChanged, this);
        layer.remove = () => {
            this.removeLayer(layer);
            layer.constructor.prototype.remove.call(layer);
            delete layer.remove;
        };
        layer.load();
        this._bindChildListeners(layer);
    }

    onRemove() {
        this._removeTerrainLayer();
        this.layers.forEach(layer => {
            this._resetSkinLayer(layer);
            layer['_doRemove']();
            this._unbindChildListeners(layer);
        });
        this._layerMap = {};
        this.clearAnalysis();
        super.onRemove();
    }

    getChildLayer(id) {
        const layer = this._layerMap[id];
        return layer || null;
    }

    getLayer(id) {
        return this.getChildLayer(id);
    }

    _bindChildListeners(layer) {
        layer.on('show hide', this._onLayerShowHide, this);
        layer.on('idchange', this._onLayerIDChange, this);
    }

    _unbindChildListeners(layer) {
        layer.off('show hide', this._onLayerShowHide, this);
        layer.off('idchange', this._onLayerIDChange, this);
    }

    _onLayerShowHide() {
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
    }

    _onLayerIDChange(e) {
        const newId = e.new;
        const oldId = e.old;
        const layer = this.getLayer(oldId);
        delete this._layerMap[oldId];
        this._layerMap[newId] = layer;
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

    // isVisible() {
    //     if (!super.isVisible()) {
    //         return false;
    //     }
    //     const children = this.layers;
    //     for (let i = 0, l = children.length; i < l; i++) {
    //         if (children[i].isVisible()) {
    //             return true;
    //         }
    //     }
    //     return false;
    // }

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

    addAnalysis(analysis) {
        this._analysisTaskList = this._analysisTaskList || [];
        this._analysisTaskList.push(analysis);
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
    }

    removeAnalysis(analysis) {
        if (this._analysisTaskList) {
            const index = this._analysisTaskList.indexOf(analysis);
            if (index > -1) {
                this._analysisTaskList.splice(index, 1);
                analysis.remove();
            }
        }
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
    }

    clearAnalysis() {
        if (this._analysisTaskList) {
            this._analysisTaskList.forEach(analysis => {
                analysis.remove();
            });
            this._analysisTaskList = [];
        }
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
    }

    /**
     * Identify the geometries on the given coordinate
     * @param  {maptalks.Coordinate} coordinate   - coordinate to identify
     * @param  {Object} [options=null]  - options
     * @param  {Object} [options.tolerance=0] - identify tolerance in pixel
     * @param  {Object} [options.count=null]  - result count
     * @return {Geometry[]} geometries identified
     */
    identify(coordinate, options = {}) {
        const map = this.getMap();
        const renderer = this.getRenderer();
        if (!map || !renderer) {
            return [];
        }
        const cp = map.coordToContainerPoint(new maptalks.Coordinate(coordinate));
        return this.identifyAtPoint(cp, options);
    }

    /**
     * Identify the data at the given point
     * @param {Point} point - container point to identify
     * @param {Object} options - the identify options
     * @param {Number}   [opts.count=1]  - limit of the result count, no limit if 0
     * @param {Number}   [opts.orderByCamera=false]  - sort by distance to camera, only support data has identified point
     * @return {Array} result
     **/
    identifyAtPoint(point, options = {}) {
        const isMapGeometryEvent = options.includeInternals;
        const childLayers = this.getLayers();
        const layers = (options && options.childLayers) || childLayers;
        const map = this.getMap();
        if (!map) {
            return [];
        }
        const count = isNil(options.count) ? 1 : options.count;
        let result = [];
        const len = layers.length;
        for (let i = len - 1; i >= 0; i--) {
            const layer = layers[i];
            if (childLayers.indexOf(layer) < 0 || !layer.identifyAtPoint) {
                continue;
            }
            const geometryEvents = layer.options['geometryEvents'];
            if (isMapGeometryEvent && (geometryEvents === undefined || geometryEvents === false || geometryEvents === 0)) {
                continue;
            }
            if (layer.isGeometryListening && isMapGeometryEvent && options.eventTypes.indexOf('mousemove') >= 0) {
                if (!layer.isGeometryListening(options.eventTypes)) {
                    continue;
                }
            }
            let picks = layer.identifyAtPoint(point, options);
            if (!picks || !picks.length) {
                continue;
            }
            if (options.filter) {
                picks = picks.filter(g => options.filter(g));
            }
            if (!picks.length) {
                continue;
            }
            const id = layer.getId();
            for (let j = 0; j < picks.length; j++) {
                if (picks[j]) {
                    picks[j].layer = id;
                }
            }
            result.push(...picks);
        }
        if (options.orderByCamera) {
            const cameraPosition = map.cameraPosition;
            result.sort((a, b) => {
                if (!b.point) {
                    return -1;
                } else if (!a.point) {
                    return 1;
                }
                return vec3.dist(a.point, cameraPosition) - vec3.dist(b.point, cameraPosition);
            });
        }
        if (count) {
            result = result.slice(0, count);
        }
        return result;
    }

    getTerrain() {
        return this.options['terrain'];
    }

    setTerrain(info) {
        this.options['terrain'] = info;
        if (!this.getRenderer()) {
            return this;
        }
        this._initTerrainLayer();
        this.getMap().updateCenterAltitude();
        return this;
    }

    removeTerrain() {
        return this.setTerrain(null);
    }

    updateTerrainMaterial(mat) {
        if (!this._terrainLayer || !mat) {
            return;
        }
        if (!this.options.terrain.material) {
            this.options.terrain.material = mat;
        } else {
            extend(this.options.terrain.material, mat);
        }
        this._terrainLayer.updateMaterial(mat);
    }

    _initTerrainLayer() {
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
        const info = this.options['terrain'];
        if (this._terrainLayer) {
            const options = this._terrainLayer.options;
            if (!info || options.urlTemplate !== info.urlTemplate || options.spatialReference !== info.spatialReference) {
                this._removeTerrainLayer();
            } else {
                for (const p in info) {
                    if (p === 'material') {
                        this._terrainLayer.setMaterial(info[p]);
                    } else if (p !== 'urlTemplate' && p !== 'spatialReference') {
                        this._terrainLayer.config(p, info[p]);
                    }
                }
                return this;
            }
        }
        this._resetTerrainSkinLayers();
        if (!info) {
            return this;
        }
        this._terrainLayer = new TerrainLayer('__terrain_in_group', info);
        this._updateTerrainSkinLayers();
        this._terrainLayer.on('tileload', this._onTerrainTileLoad, this);
        this._prepareLayer(this._terrainLayer);
        const masks = info.masks;
        if (masks && masks.length) {
            this._terrainLayer.setMask(masks);
        } else {
            this._terrainLayer.removeMask();
        }
        this.fire('terrainlayercreated');
        return this;
    }

    queryTerrain(coord, out) {
        if (!this._terrainLayer) {
            if (out) {
                out[0] = null;
                out[1] = 0;
            }
            return [null, 0];
        }
        return this._terrainLayer.queryTerrain(coord, out);
    }

    queryTerrainAtPoint(containerPoint, options = {}) {
        if (!this._terrainLayer) {
            return null;
        }
        const glRes = this.map.getGLRes();
        const map = this.map;
        const w2 = map.width / 2 || 1,
            h2 = map.height / 2 || 1;
        const p = containerPoint;
        vec3.set(cp, (p.x - w2) / w2, (h2 - p.y) / h2, 0);
        vec3.set(coord0, cp[0], cp[1], 0);
        vec3.set(coord1, cp[0], cp[1], 0.5);
        coord0[3] = coord1[3] = 1;
        applyMatrix(coord0, coord0, map.projViewMatrixInverse);
        applyMatrix(coord1, coord1, map.projViewMatrixInverse);
        const point0 = new maptalks.Point(coord0.slice(0, 3));
        const point1 = new maptalks.Point(coord1.slice(0, 3));
        const from = map.pointAtResToCoordinate(point0, glRes, EMPTY_COORD0);
        from.z = coord0[2] / map.altitudeToPoint(1, glRes);
        const to = map.pointAtResToCoordinate(point1, glRes, EMPTY_COORD1);
        to.z = coord1[2] / map.altitudeToPoint(1, glRes);
        if (!this._raycaster) {
            options['allowPointNotOnLine'] = true;
            this.raycaster = new RayCaster(from, to, options);
        } else {
            this.raycaster.setFromPoint(from);
            this.raycaster.setToPoint(to);
        }
        const terrainRenderer = this._terrainLayer.getRenderer();
        const meshes = terrainRenderer.getAnalysisMeshes();
        const results = this.raycaster.test(meshes, map);
        const coordinates = [];
        const fromPoint = vec3.set(TEMP_VEC3, from.x, from.y, from.z);
        // results数据结构 [{
        //    mesh: Mesh,
        //    coordinates: [{
        //        coordinate: maptalks.Coordinate,
        //        indices: Array
        //    },...]
        // },...]
        results.forEach(result => {
            result.coordinates.forEach(c => {
                coordinates.push(c.coordinate)
            });
        });
        coordinates.sort((a, b) => {
            return vec3.dist(a.toArray(), fromPoint) - vec3.dist(b.toArray(), fromPoint);
        });
        return coordinates[0];
    }

    queryTerrainByProjCoord(projCoord, out) {
        if (!this._terrainLayer) {
            if (out) {
                out[0] = null;
                out[1] = 0;
            }
            return [null, 0];
        }
        return this._terrainLayer.queryTerrainByProjCoord(projCoord, out);
    }

    _updateTerrainSkinLayers() {
        if (!this._terrainLayer) {
            return;
        }
        const layers = this.layers;
        const skinLayers = [];
        for (let i = 0; i < layers.length; i++) {
            if (!layers[i]) {
                continue;
            }
            const layer = layers[i];
            const renderer = layer.getRenderer();
            if (renderer.renderTerrainSkin) {
                if (renderer.deleteTile === emptyMethod) {
                    // 已经被初始化过了
                    skinLayers.push(layers[i]);
                    continue;
                }
                layer.getTiles = () => {
                    // debugger
                    return this._terrainLayer.getSkinTiles(layer);
                };
                // 重载原有的drawTile方法
                // 如果renderer定义了drawTileOnTerrain，则代替原有的drawTile，否则用空方法代替
                if (renderer.drawTileOnTerrain) {
                    renderer.drawTile = (...args) => {
                        return renderer.drawTileOnTerrain(...args);
                    };
                } else {
                    renderer.drawTile = emptyMethod;
                }
                // skinLayer的deleteTile交由TerrainLayerRenderer.deleteTile中手动执行
                renderer.deleteTile = emptyMethod;

                skinLayers.push(layers[i]);
            }
            if (renderer.setTerrainHelper) {
                renderer.setTerrainHelper(this._terrainLayer);
            }
        }
        this._terrainLayer.setSkinLayers(skinLayers);
    }

    _resetSkinLayer(layer) {
        if (!isTerrainSkin(layer)) {
            return;
        }
        const renderer = layer.getRenderer();
        if (renderer) {
            if (renderer.setTerrainHelper) {
                renderer.setTerrainHelper(null);
            }
            if (renderer.clear) {
                renderer.clear();
            }
            delete renderer.drawTile;
            delete renderer.deleteTile;
        }

        delete layer.getTiles;
    }

    _resetTerrainSkinLayers() {
        const layers = this.layers;
        for (let i = 0; i < layers.length; i++) {
            if (!layers[i]) {
                continue;
            }
            this._resetSkinLayer(layers[i]);
        }
    }

    _onTerrainTileLoad() {
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
    }

    _removeTerrainLayer() {
        if (this._terrainLayer) {
            const layer = this._terrainLayer;
            layer.off('tileload', this._onTerrainTileLoad, this);
            this._unbindChildListeners(layer);
            this._terrainLayer['_doRemove']();
            delete this._terrainLayer;
            this.fire('terrainlayerremoved');
        }
    }

    getTerrainLayer() {
        return this._terrainLayer;
    }

    _bindMap(...args) {
        if (this.options['single']) {
            const map = args[0];
            const layers = map.getLayers();
            for (let i = 0; i < layers.length; i++) {
                if (layers[i] instanceof GroupGLLayer) {
                    throw new Error('Only one GroupGLLayer is allowed in a map instance. Set options.single to false if you want to add two or more GroupGLLayers.');
                }
            }
        }
        return super._bindMap(...args);
    }

    fire(...args) {
        if (args[0] === 'layerload') {
            const layers = this._getLayers();
            for (const layer of layers) {
                const renderer = layer.getRenderer();
                if (renderer && renderer.isRenderComplete()) {
                    layer.fire('layerload');
                }
            }
        }
        super.fire(...args);
    }
}

GroupGLLayer.mergeOptions(options);

GroupGLLayer.registerJSONType('GroupGLLayer');

GroupGLLayer.registerRenderer('gl', Renderer);
GroupGLLayer.registerRenderer('canvas', null);

function empty() {}

function sortLayersByZIndex(a, b) {
    const c = a.getZIndex() - b.getZIndex();
    if (c === 0) {
        return a['__group_gl_order'] - b['__group_gl_order'];
    }
    return c;
}

function isTerrainSkin(layer) {
    if (!layer) {
        return false;
    }
    const renderer = layer.getRenderer();
    if (!renderer) {
        return false;
    }
    return !!renderer.renderTerrainSkin;
}

function applyMatrix(out, v, e) {
    const x = v[0],
        y = v[1],
        z = v[2];
    const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);
    out[0] = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
    out[1] = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
    out[2] = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;
    return out;
}
