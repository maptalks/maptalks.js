import * as maptalks from 'maptalks';
import Renderer from './GroupGLLayerRenderer.js';
import { vec3 } from '@maptalks/reshader.gl';
import { isNil, extend } from './util/util.js';
import TerrainLayer from './terrain/TerrainLayer';
import RayCaster from './raycaster/RayCaster.js';
import Mask from './mask/Mask.js';
import { LayerJSONType } from 'maptalks';

const options: GroupGLLayerOptions = {
    renderer : 'gl',
    antialias : true,
    extensions : [],
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
    viewMoveThreshold: 100,
    geometryEvents: true,
    multiSamples: 4,
    forceRedrawPerFrame: false
};

//
const emptyMethod = () => {};
const EMPTY_COORD0 = new maptalks.Coordinate(0, 0);
const TEMP_VEC3: vec3 = [0, 0, 0];
const coord0: [number, number, number] = [0, 0, 0], coord1: [number, number, number] = [0, 0, 0];

export default class GroupGLLayer extends maptalks.Layer {
    /**
     * Reproduce a GroupGLLayer from layer's profile JSON.
     * @param  {Object} layerJSON - layer's profile JSON
     * @return {GroupGLLayer}
     * @static
     * @private
     * @function
     */
    static fromJSON(layerJSON: object): GroupGLLayer {
        if (!layerJSON || layerJSON['type'] !== 'GroupGLLayer') {
            return null;
        }
        const layers = layerJSON['layers'].map(json => maptalks.Layer.fromJSON(json));
        return new GroupGLLayer(layerJSON['id'], layers, layerJSON['options']);
    }

    options: GroupGLLayerOptions
    layers: maptalks.Layer[]
    //@internal
    _layerMap: Record<string, maptalks.Layer>
    //@internal
    _polygonOffset?: number
    //TODO 需要等analysis类型定义
    //@internal
    _analysisTaskList: Analysis[]
    //@internal
    _terrainLayer: TerrainLayer

    /**
     * @param id    - layer's id
     * @param layers      - layers to add
     * @param  [options=null]          - construct options
     */
    constructor(id: string, layers: maptalks.Layer[], options: GroupGLLayerOptions) {
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

    setSceneConfig(sceneConfig: GroupGLLayerSceneConfig): this {
        this.options.sceneConfig = sceneConfig;
        const renderer = (this as any).getRenderer();
        if (renderer) {
            renderer.updateSceneConfig();
        }
        return this;
    }

    getSceneConfig(): GroupGLLayerSceneConfig {
        return JSON.parse(JSON.stringify(this._getSceneConfig()));
    }

    //@internal
    _getSceneConfig(): GroupGLLayerSceneConfig {
        return this.options.sceneConfig || {};
    }

    getGroundConfig(): SceneGround {
        const sceneConfig = this._getSceneConfig();
        return sceneConfig.ground;
    }

    getWeatherConfig(): SceneWeather {
        const sceneConfig = this._getSceneConfig();
        return sceneConfig.weather;
    }

    /**
     * Add a new Layer.
     * @param layer - new layer
     * @param index - index to insert
     * @returns {GroupGLLayer} this
     */
    addLayer(layer: maptalks.Layer, index?: number): this {
        if (layer.getMap()) {
            throw new Error(`layer(${layer.getId()}) is already added on map`);
        }
        if (layer.options['renderer'] !== 'gl') {
            throw new Error(`layer(${layer.getId()})'s renderer is canvas, not supported to be added to GroupGLLayer`);
        }
        if (index === undefined) {
            this.layers.push(layer);
        } else {
            this.layers.splice(index, 0, layer);
        }
        this._checkChildren();
        this.sortLayersByZIndex();
        const renderer = (this as any).getRenderer();
        if (!renderer) {
            // not loaded yet
            return this;
        }
        this._prepareLayer(layer);
        this._updateTerrainSkinLayers();
        renderer.setToRedraw();
        return this;
    }

    removeLayer(layer: maptalks.Layer): this {
        if (maptalks.Util.isString(layer)) {
            layer = this.getChildLayer(layer);
        }
        const idx = this.layers.indexOf(layer);
        if (idx < 0) {
            return this;
        }
        const layerRenderer = layer.getRenderer() as any;
        if (layerRenderer && layerRenderer.setTerrainHelper) {
            layerRenderer.setTerrainHelper(null);
        }
        layer['_doRemove']();
        this._unbindChildListeners(layer);
        delete this._layerMap[layer.getId()];
        this.layers.splice(idx, 1);
        const renderer = (this as any).getRenderer();
        if (!renderer) {
            // not loaded yet
            return this;
        }
        this._updateTerrainSkinLayers();
        renderer.setToRedraw();
        return this;
    }

    clearLayers(): this {
        const layers = this.getLayers();
        for (let i = 0; i < layers.length; i++) {
            if (layers[i]) {
                layers[i].remove();
            }
        }
        return this;
    }

    //@internal
    _updatePolygonOffset() {
        let total = 0;
        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i] as any;
            if (layer.setPolygonOffset && layer.getPolygonOffsetCount) {
                total += layer.getPolygonOffsetCount();
            }
        }
        let offset = 0;
        const len = this.layers.length;
        for (let i = len - 1; i >= 0; i--) {
            const layer = this.layers[i] as any;
            if (layer.setPolygonOffset && layer.getPolygonOffsetCount) {
                layer.setPolygonOffset(offset, total);
                offset += layer.getPolygonOffsetCount();
            }
        }
        this._polygonOffset = offset;
    }

    getPolygonOffsetCount(): number {
        return this._polygonOffset;
    }

    /**
     * Get children TileLayer
     * @returns {TileLayer[]}
     */
    getLayers(): maptalks.Layer[] {
        return this.layers.slice();
    }

    //@internal
    _getLayers(): maptalks.Layer[] {
        return this.layers;
    }

    /**
     * 导出GroupGLLayer的序列化JSON对象，可以用于反序列化为一个GroupGLLayer对象。
     * @english
     * Export the GroupGLLayer's profile json. <br>
     * Layer's profile is a snapshot of the layer in JSON format. <br>
     * It can be used to reproduce the instance by [fromJSON]{@link Layer#fromJSON} method
     * @return layer's profile JSON
     */
    toJSON(): LayerJSONType {
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
            'type': (this as any).getJSONType(),
            'id': (this as any).getId(),
            'layers' : layers,
            'options': (this as any).config()
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

    //@internal
    _prepareLayer(layer: maptalks.Layer) {
        const map = (this as any).getMap();
        this._layerMap[layer.getId()] = layer;
        layer['_canvas'] = (this as any).getRenderer().canvas;
        layer['_bindMap'](map);
        // layer.on('setstyle updatesymbol', this._onChildLayerStyleChanged, this);
        layer.remove = () => {
            this.removeLayer(layer);
            layer.constructor.prototype.remove.call(layer);
            delete layer.remove;
            return this;
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

    getChildLayer(id: string): maptalks.Layer | null {
        const layer = this._layerMap[id];
        return layer || null;
    }

    getLayer(id: string): maptalks.Layer | null {
        return this.getChildLayer(id);
    }

    //@internal
    _bindChildListeners(layer: maptalks.Layer) {
        layer.on('show hide', this._onLayerShowHide, this);
        layer.on('idchange', this._onLayerIDChange, this);
    }

    //@internal
    _unbindChildListeners(layer: maptalks.Layer) {
        layer.off('show hide', this._onLayerShowHide, this);
        layer.off('idchange', this._onLayerIDChange, this);
    }

    //@internal
    _onLayerShowHide() {
        const renderer = (this as any).getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
    }

    //@internal
    _onLayerIDChange(e) {
        const newId = e.new;
        const oldId = e.old;
        const layer = this.getLayer(oldId);
        delete this._layerMap[oldId];
        this._layerMap[newId] = layer;
    }

    // _onChildLayerStyleChanged() {
    //     const renderer = (this as any).getRenderer();
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

    //@internal
    _checkChildren() {
        const ids = {};
        this.layers.forEach(layer => {
            const layerId = layer.getId();
            if (ids[layerId]) {
                throw new Error(`Duplicate child layer id (${layerId}) in the GroupGLLayer (${(this as any).getId()})`);
            } else {
                ids[layerId] = 1;
            }
        });
    }

    addAnalysis(analysis: Analysis) {
        this._analysisTaskList = this._analysisTaskList || [];
        this._analysisTaskList.push(analysis);
        const renderer = (this as any).getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
    }

    removeAnalysis(analysis: Analysis) {
        if (this._analysisTaskList) {
            const index = this._analysisTaskList.indexOf(analysis);
            if (index > -1) {
                this._analysisTaskList.splice(index, 1);
                analysis.remove();
            }
        }
        const renderer = (this as any).getRenderer();
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
        const renderer = (this as any).getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
    }

    /**
     * 查询给定坐标上的数据要素
     *
     * @english
     * Identify the geometries on the given coordinate
     * @param  coordinate   - coordinate to identify
     * @param  options      - options
     * @return
     */
    identify(coordinate: maptalks.Coordinate, options: object): any[] {
        const map = (this as any).getMap();
        const renderer = (this as any).getRenderer();
        if (!map || !renderer) {
            return [];
        }
        const cp = map.coordToContainerPoint(new maptalks.Coordinate(coordinate));
        return this.identifyAtPoint(cp, options);
    }

    /**
     * 查询给定容器坐标（containerPoint）上的数据要素
     * @english
     * Identify the data at the given point
     * @param point - container point to identify
     * @param options - the identify options
     **/
    identifyAtPoint(point: maptalks.Point, options: any = {}): any[] {
        const isMapGeometryEvent = options.includeInternals;
        const childLayers = this.getLayers();
        const layers = (options && options.childLayers) || childLayers;
        const map = (this as any).getMap();
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
            const picks = layer.identifyAtPoint(point, options);
            if (!picks || !picks.length) {
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

    getTerrain(): TerrainOptions | undefined | null {
        return this.options.terrain;
    }

    setTerrain(info: TerrainOptions | null) {
        this.options.terrain = info;
        if (!(this as any).getRenderer()) {
            return this;
        }
        this._initTerrainLayer();
        (this as any).getMap().updateCenterAltitude();
        return this;
    }

    removeTerrain() {
        return this.setTerrain(null);
    }

    updateTerrainMaterial(mat: object) {
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

    //@internal
    _initTerrainLayer() {
        const renderer = (this as any).getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
        const info = this.options['terrain'];
        if (this._terrainLayer) {
            const terrainLayer = this._terrainLayer as any;
            const options = terrainLayer.options;
            if (!info || options.urlTemplate !== info.urlTemplate || options.spatialReference !== info.spatialReference) {
                this._removeTerrainLayer();
            } else {
                for (const p in info) {
                    if (p === 'material') {
                        terrainLayer.setMaterial(info[p]);
                    } else if (p !== 'urlTemplate' && p !== 'spatialReference') {
                        terrainLayer.config(p, info[p]);
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
        const terrainLayer = this._terrainLayer as any;
        terrainLayer.on('tileload', this._onTerrainTileLoad, this);
        this._prepareLayer(terrainLayer);
        const masks = info.masks;
        if (masks && masks.length) {
            terrainLayer.setMask(masks);
        } else {
            terrainLayer.removeMask();
        }
        this.fire('terrainlayercreated');
        return this;
    }

    queryTerrain(coord: maptalks.Coordinate, out: QueryHitResult): QueryHitResult {
        if (!this._terrainLayer) {
            if (out) {
                out[0] = null;
                out[1] = 0;
            }
            return [null, 0];
        }
        return this._terrainLayer.queryTerrain(coord, out);
    }

    // 结果需要与queryTerrain统一起来
    queryTerrainAtPoint(containerPoint: maptalks.Point) {
        if (!this._terrainLayer) {
            return null;
        }
        const terrainLayer = this._terrainLayer as any;
        const terrainRenderer = terrainLayer.getRenderer();
        const meshes = terrainRenderer.getAnalysisMeshes();
        return this._queryRayCast(containerPoint, meshes);
    }

    query3DTilesAtPoint(containerPoint: maptalks.Point) {
        const layers = this._getLayers();
        const tilesLayers = layers.filter(layer => layer && (layer as any).isGeo3DTilesLayer);
        if (!tilesLayers.length) {
            return null;
        }
        const options = { excludeMasks: true };
        for (let i = 0; i < tilesLayers.length; i++) {
            const renderer = tilesLayers[i].getRenderer() as any;
            if (!renderer) {
                continue;
            }
            const hits = (tilesLayers[i] as any).identifyAtPoint(containerPoint, options);
            if (hits.length) {
                return new maptalks.Coordinate(hits[0].coordinate);
            }
        }
        return null;
    }

    _queryRayCast(containerPoint: maptalks.Point, meshes: any[]) {
        const map = this.getMap();
        const glRes = map.getGLRes();
        map.getContainerPointRay(coord0, coord1, containerPoint);
        const raycaster = new RayCaster(coord0, coord1, false);
        const results = raycaster.test(meshes, map, { count: 1 });

        const coordinates = [];
        results.forEach(result => {
            result.coordinates.forEach(c => {
                coordinates.push(c.coordinate)
            });
        });

        const from = map.pointAtResToCoordinate(new maptalks.Point(coord0[0], coord0[1]), glRes, EMPTY_COORD0);
        from.z = coord0[2] / map.altitudeToPoint(1, glRes);
        const fromPoint = vec3.set(TEMP_VEC3, from.x, from.y, from.z);

        coordinates.sort((a, b) => {
            return vec3.dist(a.toArray(), fromPoint) - vec3.dist(b.toArray(), fromPoint);
        });
        return coordinates[0];
    }

    queryTerrainByProjCoord(projCoord: maptalks.Coordinate, out: QueryHitResult): QueryHitResult {
        if (!this._terrainLayer) {
            if (out) {
                out[0] = null;
                out[1] = 0;
            }
            return [null, 0];
        }
        return this._terrainLayer.queryTerrainByProjCoord(projCoord, out);
    }

    //@internal
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
            const layer = layers[i] as any;
            const renderer = layer.getRenderer() as any;
            if (renderer.renderTerrainSkin) {
                if (renderer.deleteTile === emptyMethod) {
                    // 已经被初始化过了
                    skinLayers.push(layers[i]);
                    continue;
                }
                layer.getTiles = () => {
                    // debugger
                    return this._terrainLayer && this._terrainLayer.getSkinTiles(layer);
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

    //@internal
    _resetSkinLayer(layer: maptalks.Layer) {
        if (!isTerrainSkin(layer)) {
            return;
        }
        const renderer = layer.getRenderer() as any;
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

        delete (layer as any).getTiles;
    }

    //@internal
    _resetTerrainSkinLayers() {
        const layers = this.layers;
        for (let i = 0; i < layers.length; i++) {
            if (!layers[i]) {
                continue;
            }
            this._resetSkinLayer(layers[i]);
        }
    }

    //@internal
    _onTerrainTileLoad() {
        const renderer = (this as any).getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
    }

    //@internal
    _removeTerrainLayer() {
        if (this._terrainLayer) {
            const layer = this._terrainLayer as any;
            layer.off('tileload', this._onTerrainTileLoad, this);
            this._unbindChildListeners(layer);
            this._terrainLayer['_doRemove']();
            delete this._terrainLayer;
            this.fire('terrainlayerremoved');
        }
    }

    getTerrainLayer(): TerrainLayer | undefined {
        return this._terrainLayer;
    }

    //@internal
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
        return super['_bindMap'](...args);
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
        //@ts-expect-error-error
        super.fire(...args);
    }
}

(GroupGLLayer as any).mergeOptions(options);

(GroupGLLayer as any).registerJSONType('GroupGLLayer');

(GroupGLLayer as any).registerRenderer('gl', Renderer);
(GroupGLLayer as any).registerRenderer('canvas', null);

function sortLayersByZIndex(a: maptalks.Layer, b: maptalks.Layer) {
    const c = a.getZIndex() - b.getZIndex();
    if (c === 0) {
        return a['__group_gl_order'] - b['__group_gl_order'];
    }
    return c;
}

function isTerrainSkin(layer: maptalks.Layer) {
    if (!layer) {
        return false;
    }
    const renderer = layer.getRenderer() as any;
    if (!renderer) {
        return false;
    }
    return !!renderer.renderTerrainSkin;
}

export type TerrainOptions = {
    type: 'mapbox' | 'tianditu' | 'cesium' | 'cesium-ion',
    urlTemplate: string,
    spatialReference?: string,
    shader?: 'lit' | 'default',
    subdomains?: string[],
    tileSystem?: number[],
    tileSize?: number,
    zoomOffset?: number,
    requireSkuToken?: boolean,
    depthMask?: boolean,
    depthFunc?: ComparisonOperatorType,
    blendSrc?: BlendingFunction,
    blendDst?: BlendingFunction,
    material?: object,
    masks?: Mask[]
}

export type QueryHitResult = [number | null, 0 | 1]

export type GroupGLLayerOptions = {
    renderer?: 'gl',
    antialias?: true,
    extensions?: string[],
    single?: boolean,
    onlyWebGL1?: boolean,
    optionalExtensions?: string[],
    viewMoveThreshold?: number,
    geometryEvents?: boolean,
    multiSamples?: number,
    forceRedrawPerFrame?: boolean,
    sceneConfig?: GroupGLLayerSceneConfig,
    terrain?: TerrainOptions
};

export enum SkyboxMode {
    AMBIENT,
    REALISTIC
}

export type SceneEnvironment = {
    enable: boolean,
    mode?: SkyboxMode,
    level?: 0 | 1 | 2 | 3,
    brightness?: number
}

export type SceneGround = {
    enable?: boolean,
    renderPlugin: {
        type: 'lit' | 'fill'
    },
    symbol: {
        ssr?: true,                                    // 是否开启ssr，屏幕空间反射
        material?: any,
        polygonFill?: number[],
        polygonOpacity?: number
    }
}

export type SceneWeather = {
    enable?: boolean,
    fog?: {
        enable?: boolean,
        start?: number,
        end?: number,
        color?: number[]
    },
    rain?: {
        enable?: boolean
        density?: number,
        windDirectionX?: number,
        windDirectionY?: number,
        rainTexture: string,
    },
    snow?: {
        enable?: boolean
    }
}

export type SceneShadow = {
    enable?: boolean,
    type?: 'esm',
    quality?: 'low' | 'medium' | 'high',
    opacity?: number,
    color?: number[],
    blurOffset?: number
}

export type ScenePostProcess = {
    enable?: boolean,
    antialias?: {
        enable?: boolean
    },
    ssr?: {
        enable?: boolean
    },
    // ssao?: {
    //     enable?: boolean,
    //     bias?: number,
    //     radius?: number,
    //     intensity?: number
    // },
    sharpen?: {
        enable?: boolean,
        factor?: number
    },
    bloom?: {
        enable?: boolean,
        factor?: number,
        threshold?: number,
        radius?: number
    },
    outline: {
        enable?: boolean,
        highlightFactor?: number,
        outlineFactor?: number,
        outlineWidth?: number,
        outlineColor?: number[]
    }
}

export type GroupGLLayerSceneConfig = {
    environment?: SceneEnvironment,
    shadow? : SceneShadow,
    ground?: SceneGround,
    weather?: SceneWeather,
    postProcess?: ScenePostProcess
}
