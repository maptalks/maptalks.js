import * as maptalks from 'maptalks';
import { mat4, vec3, createREGL, GroundPainter } from '@maptalks/gl';
import WorkerConnection from './worker/WorkerConnection';
import { EMPTY_VECTOR_TILE } from '../core/Constant';
import DebugPainter from './utils/DebugPainter';
import TileStencilRenderer from './stencil/TileStencilRenderer';
import { extend, pushIn, getCentiMeterScale, isNil } from '../../common/Util';
import { default as convertToPainterFeatures, oldPropsKey }  from './utils/convert_to_painter_features';
import { isFunctionDefinition } from '@maptalks/function-type';
import { FilterUtil } from '@maptalks/vector-packer';
import { meterToPoint } from '../plugins/Util';

// const DEFAULT_PLUGIN_ORDERS = ['native-point', 'native-line', 'fill'];
const EMPTY_ARRAY = [];
const CLEAR_COLOR = [0, 0, 0, 0];
const TILE_POINT = new maptalks.Point(0, 0);

const TERRAIN_CLEAR = {
    color: CLEAR_COLOR,
    depth: 1,
    stencil: 0
};

const terrainSkinFilter = plugin => {
    return plugin.isTerrainSkin();
}

const terrainVectorFilter = plugin => {
    return plugin.isTerrainVector();
}

class VectorTileLayerRenderer extends maptalks.renderer.TileLayerCanvasRenderer {

    supportRenderMode() {
        return true;
    }

    constructor(layer) {
        super(layer);
        this.ready = false;
        this._styleCounter = 1;
        this._requestingMVT = {};
        this._plugins = {};
        this._featurePlugins = {};
    }

    getTileLevelValue(tileInfo, currentTileZoom) {
        if (!this.isBackTile(tileInfo.id)) {
            return 0;
        } else {
            const z = tileInfo.z;
            const maxChildDepth = 5;
            // 如果瓦片zoom比currentTileZoom大，则设为0-5之间的值，瓦片zoom越大，值越小
            // 如果瓦片zoom比currentTileZoom小，则设为5以上的值，越接近，值越小
            return (z - currentTileZoom >= 0) ? (currentTileZoom + maxChildDepth - z) : (maxChildDepth + (currentTileZoom - z));
        }
    }

    getWorkerConnection() {
        return this._workerConn;
    }

    getStyleCounter() {
        return this._styleCounter;
    }

    setStyle(silent) {
        if (this._groundPainter) {
            this._groundPainter.update();
        }
        if (this._workerConn) {
            this._styleCounter++;
            this._preservePrevTiles();
            const style = this.layer._getComputedStyle();
            style.styleCounter = this._styleCounter;
            this._workersyncing = true;
            this._workerConn.updateStyle(style, err => {
                this._workersyncing = false;
                if (err) throw new Error(err);
                if (!silent) {
                    this._needRetire = true;
                    // this.clear();
                    // this._clearPlugin();
                    this._initPlugins();
                    this.setToRedraw();
                }
                this.layer.fire('refreshstyle');
            });
        } else {
            this._initPlugins();
        }
    }

    // 为了解决阴影更新的闪烁问题，保留之前的绘制，当前数据载入后再删除
    _preservePrevTiles() {
        if (this._prevTilesInView) {
            for (const p in this._prevTilesInView) {
                const tile = this._prevTilesInView[p];
                if (tile) {
                    this.deleteTile(tile);
                }
            }
        }
        this._prevTilesInView = this.tilesInView;
        const tileCache = this.tileCache;
        for (const p in this._prevTilesInView) {
            const tile = this._prevTilesInView[p];
            if (tile && tile.info) {
                tileCache.getAndRemove(tile.info.id);
            }
        }
        tileCache.reset();
        this.tilesInView = {};
        this.tilesLoading = {};
        // 如果这里不清空 requestingMVT，updateStyle后的loadTile方法中，requestingMVT中会留有上次请求的缓存，导致不会调用worker的loadTile方法请求瓦片
        this._requestingMVT = {};
        this['_parentTiles'] = [];
        this['_childTiles'] = [];
        // 让 currentTilesFirst 起作用
        this['_tileZoom'] = undefined;
    }

    updateOptions(conf) {
        if (this._workerConn) {
            this._workerConn.updateOptions(this.layer.getWorkerOptions(), err => {
                if (err) throw new Error(err);
                //需要重新生成瓦片的设置
                if (conf && (conf['features'] || conf['pickingGeometry'] || conf['altitudeProperty'])) {
                    this.clear();
                    this._clearPlugin();
                    this._initPlugins();
                }
                this.setToRedraw();
            });
        }
    }

    updateSceneConfig(type, idx, sceneConfig) {
        const plugins = type === 0 ? this._getStylePlugins() : this._getFeaturePlugins();
        if (!plugins || !plugins[idx]) {
            return;
        }
        this._needRetire = true;
        const allStyles = this.layer._getComputedStyle();
        const styles = this.layer._getTargetStyle(type, allStyles);
        plugins[idx].config = styles[idx].renderPlugin;
        plugins[idx].updateSceneConfig({
            sceneConfig: sceneConfig
        });
        this.setToRedraw();
    }

    updateDataConfig(type, idx, dataConfig, old) {
        const plugins = type === 0 ? this._getStylePlugins() : this._getFeaturePlugins();
        if (!plugins || !plugins[idx]) {
            return;
        }
        this._needRetire = true;
        if (plugins[idx].updateDataConfig(dataConfig, old)) {
            this.setStyle();
        } else {
            this.setToRedraw();
        }
    }

    updateSymbol(type, idx, symbol) {
        const plugins = type === 0 ? this._getStylePlugins() : this._getFeaturePlugins();
        if (!plugins || !plugins[idx]) {
            return false;
        }
        const allStyles = this.layer._getComputedStyle();
        const styles = this.layer._getTargetStyle(type, allStyles);
        // const symbol = styles[idx].symbol;
        const plugin = plugins[idx];
        plugin.style = styles[idx];
        const needRefresh = plugin.updateSymbol(symbol, styles[idx].symbol);
        if (!needRefresh && needRefreshStyle(symbol)) {
            this.setStyle(true);
        }
        this.setToRedraw();
        return needRefresh;
    }

    //always redraw when map is interacting
    needToRedraw() {
        const redraw = super.needToRedraw();
        if (!redraw) {
            const plugins = this._getFramePlugins();
            for (let i = 0; i < plugins.length; i++) {
                if (plugins[i] && plugins[i].needToRedraw()) {
                    return true;
                }

            }
        }
        return redraw;
    }

    needRetireFrames() {
        if (this._needRetire) {
            return true;
        }
        const plugins = this._getFramePlugins();
        for (let i = 0; i < plugins.length; i++) {
            if (plugins[i] && plugins[i].needToRetireFrames()) {
                return true;
            }
        }
        return false;
    }

    isAnimating() {
        // maptalks/issues#712
        // 当highlight更新时，在当前帧（通过frametimestamp来识别）一直返回animating为true，让所有瓦片渲染时都能正确的渲染更新
        const mapRenderer = this.getMap().getRenderer();
        // 老版本核心库的mapRenderer上没有定义getFrameTimestamp
        const timestamp = mapRenderer.getFrameTimestamp && mapRenderer.getFrameTimestamp() || mapRenderer['_frameTimestamp'];
        if (this._highlightUpdated) {
            this._highlightFrametime = timestamp;
            delete this._highlightUpdated;
        }
        if (this._highlightFrametime === timestamp) {
            return true;
        }
        const plugins = this._getFramePlugins();
        for (let i = 0; i < plugins.length; i++) {
            if (plugins[i] && plugins[i].isAnimating()) {
                return true;
            }
        }
        return false;
    }

    needToRefreshTerrainTileOnZooming() {
        const plugins = this._getFramePlugins();
        for (let i = 0; i < plugins.length; i++) {
            if (plugins[i] && plugins[i].needToRefreshTerrainTileOnZooming()) {
                return true;
            }
        }
        return false;
    }

    _isInGroupGLLayer() {
        const inGroup = this.canvas && this.canvas.gl && this.canvas.gl.wrap;
        return !!inGroup;
    }

    createContext() {
        const inGroup = this.canvas.gl && this.canvas.gl.wrap;
        if (inGroup) {
            this.gl = this.canvas.gl.wrap();
            this.regl = this.canvas.gl.regl;
        } else {
            const { gl, regl, attributes } = this._createREGLContext(this.canvas);
            this.gl = gl;
            this.regl = regl;
            this.glOptions = attributes;
        }
        if (inGroup) {
            this.canvas.pickingFBO = this.canvas.pickingFBO || this.regl.framebuffer(this.canvas.width, this.canvas.height);
        }
        this.pickingFBO = this.canvas.pickingFBO || this.regl.framebuffer(this.canvas.width, this.canvas.height);
        this._debugPainter = new DebugPainter(this.regl, this.getMap());
        this._prepareWorker();
        this._groundPainter = new GroundPainter(this.regl, this.layer);

        if (!this.consumeTile) {
            const version = this.getMap().VERSION;
            throw new Error(`Incompatible version of maptalks: ${version}, upgrade maptalks >= v1.0.0-rc.14`);
        }
    }

    _createREGLContext(canvas) {
        const layer = this.layer;

        const attributes = layer.options.glOptions || {
            alpha: true,
            depth: true,
            antialias: this.layer.options['antialias']
            // premultipliedAlpha : false
        };
        attributes.preserveDrawingBuffer = true;
        attributes.stencil = true;
        // this.glOptions = attributes;
        const gl = this._createGLContext(canvas, attributes);
        // this.gl.getParameter(this.gl.MAX_VERTEX_UNIFORM_VECTORS));
        const regl = createREGL({
            gl,
            attributes,
            extensions: [
                'ANGLE_instanced_arrays',
                'OES_element_index_uint',
                'OES_standard_derivatives'
            ],
            optionalExtensions: layer.options['glExtensions'] ||
                [
                    'OES_vertex_array_object',
                    'OES_texture_half_float', 'OES_texture_half_float_linear',
                    'OES_texture_float', 'OES_texture_float_linear',
                    'WEBGL_draw_buffers', 'EXT_shader_texture_lod',
                    'EXT_frag_depth'
                ]
        });
        return { gl, attributes, regl };
    }

    _prepareWorker() {
        if (!this._workerConn) {
            this._workerConn = new WorkerConnection('@maptalks/vt', this.layer);
        }
        const workerConn = this._workerConn;
        //setTimeout in case layer's style is set to layer after layer's creating.
        workerConn.addLayer((err, params) => {
            if (!this.layer) return;
            this.ready = true;
            this.layer.onWorkerReady(err, params);
            this.layer.fire('workerready');
            this.setToRedraw();
        });
    }

    clearCanvas() {
        super.clearCanvas();
        if (!this.regl) {
            return;
        }
        //这里必须通过regl来clear，如果直接调用webgl context的clear，则brdf的texture会被设为0
        if (this.glOptions.depth) {
            this.regl.clear({
                color: CLEAR_COLOR,
                depth: 1,
                stencil: 0
            });
        } else {
            this.regl.clear({
                color: CLEAR_COLOR,
                stencil: 0
            });
        }
    }

    isDrawable() {
        return true;
    }

    checkResources() {
        const result = EMPTY_ARRAY;
        return result;
    }

    _drawTiles(tiles, parentTiles, childTiles, placeholders, context) {
        super['_drawTiles'](tiles, parentTiles, childTiles, placeholders, context);
        if (this._prevTilesInView) {
            if (!Object.keys(this._prevTilesInView).length) {
                this._deletePrevPlugins();
                delete this._prevTilesInView;
            } else {
                for (const p in this._prevTilesInView) {
                    const tile = this._prevTilesInView[p];
                    if (tile && tile.info && tile.info.id && !this.tileCache.has(tile.info.id)) {
                        this['_drawTile'](tile.info, tile.image, context);
                    }
                }
            }
        }
    }

    _deletePrevPlugins() {
        const styleCounter = this._styleCounter;
        const retired = [];
        const retiredFeaPlulgin = [];
        for (const p in this._plugins) {
            if (+p !== styleCounter) {
                retired.push(p);
                const oldPlugins = this._getStylePlugins(p);
                oldPlugins.forEach(plugin => {
                    plugin.remove();
                });
            }
        }
        for (const p in this._featurePlugins) {
            if (+p !== styleCounter) {
                retiredFeaPlulgin.push(p);
                const oldFeaturePlugins = this._getFeaturePlugins(p);
                oldFeaturePlugins.forEach(plugin => {
                    plugin.remove();
                });
            }
        }
        for (let i = 0; i < retired.length; i++) {
            delete this._plugins[retired[i]];
        }
        for (let i = 0; i < retiredFeaPlulgin.length; i++) {
            delete this._featurePlugins[retiredFeaPlulgin[i]];
        }
    }

    draw(timestamp, parentContext) {
        if (this._currentTimestamp !== timestamp) {
            this._needRetire = false;
            this._setPluginIndex();
        }
        const layer = this.layer;
        this.prepareCanvas();
        if (!this.ready || !layer.ready) {
            super.draw(timestamp);
            return;
        }
        let plugins = this._plugins[this._styleCounter];
        if (!plugins) {
            this._initPlugins();
            this._setPluginIndex();
            plugins = this._getStylePlugins();
        }
        const featurePlugins = this._getFeaturePlugins();
        if (!layer.isDefaultRender() && (!plugins.length && !featurePlugins.length)) {
            return;
        }
        if (layer.options['collision']) {
            layer.clearCollisionIndex();
            // layer.clearBackgroundCollisionIndex();
        }
        this._frameTime = timestamp;
        this._zScale = this._getCentiMeterScale(this.getMap().getGLRes()); // scale to convert centi-meter to gl point
        this._parentContext = parentContext || {};
        this._startFrame(timestamp);
        super.draw(timestamp);
        if (this._currentTimestamp !== timestamp) {
            this._prepareRender(timestamp);
        }

        this._endFrame(timestamp);
        this._currentTimestamp = timestamp;
    }

    _setPluginIndex() {
        const plugins = this._getFramePlugins();
        //按照plugin顺序更新collision索引
        plugins.forEach((plugin, idx) => {
            if (!plugin) {
                return;
            }
            plugin.renderIndex = idx;
        });
    }

    _prepareRender() {
        const plugins = this._getFramePlugins();
        this._pluginOffsets = this._pluginOffsets || [];
        let polygonOffsetIndex = 0;
        const len = plugins.length;
        for (let i = len - 1; i >= 0; i--) {
            const plugin = plugins[i];
            if (!plugin.isVisible() || !plugin.hasMesh()) {
                continue;
            }
            this._pluginOffsets[i] = polygonOffsetIndex;
            if (plugin.needPolygonOffset()) {
                polygonOffsetIndex++;
            }
        }
        if (this._groundPainter.isEnable()) {
            polygonOffsetIndex++;
        }
        this._polygonOffsetIndex = polygonOffsetIndex;
    }

    getFrameTimestamp() {
        return this._frameTime;
    }

    drawOnInteracting(event, timestamp, parentContext) {
        this.draw(timestamp, parentContext);
    }

    drawOutline(fbo) {
        if (!this._outline && !this._outlineAll) {
            return;
        }
        if (this._outlineAll) {
            this.paintOutlineAll(fbo);
            return;
        }
        this._outline.forEach(outline => {
            this[outline[0]](fbo, ...outline[1]);
        });
    }

    getAnalysisMeshes() {
        return this.getShadowMeshes();
    }

    getShadowMeshes() {
        const meshes = [];
        const plugins = this._getAllPlugins();
        plugins.forEach((plugin) => {
            if (!plugin) {
                return;
            }
            const visible = this._isVisible(plugin);
            if (!visible) {
                return;
            }
            const shadowMeshes = plugin.getShadowMeshes();
            if (Array.isArray(shadowMeshes)) {
                for (let i = 0; i < shadowMeshes.length; i++) {
                    meshes.push(shadowMeshes[i]);
                }
            }
        });
        return meshes;
    }

    isForeground(mesh) {
        return !!(this._vtCurrentTiles && this._vtCurrentTiles[mesh.properties.tile.id]);
    }

    _getTileZoomDiff(mesh) {
        const layer = this.layer;
        let zoom = layer['_getTileZoom'](this.getMap().getZoom());
        const minZoom = layer.getMinZoom(),
            maxZoom = layer.getMaxZoom();
        zoom = maptalks.Util.clamp(zoom, minZoom, maxZoom);
        const gap = zoom - mesh.properties.tile.z;
        return gap;
    }

    isTileNearCamera(mesh) {
        const gap = this._getTileZoomDiff(mesh);
        return gap <= 1;
    }

    isBackTile(id) {
        return !!(this._vtBgTiles && this._vtBgTiles[id]);
    }

    loadTileQueue(tileQueue) {
        // worker与主线程同步期间，不再请求瓦片，避免出现瓦片与样式不同步的问题
        if (this._workersyncing) {
            return;
        }
        super.loadTileQueue(tileQueue);
    }

    loadTile(tileInfo) {
        const { url } = tileInfo;
        const cached = this._requestingMVT[url];
        if (!cached) {
            const map = this.getMap();
            const tilePoint = TILE_POINT.set(tileInfo.extent2d.xmin, tileInfo.extent2d.ymax);
            const tileCoord = map.pointAtResToCoord(new maptalks.Point(tilePoint), tileInfo.res);
            const centimeterToPoint = [meterToPoint(map, 1, tileCoord, tileInfo.res) / 100, meterToPoint(map, 1, tileCoord, tileInfo.res, 1) / 100];
            const verticalCentimeterToPoint = this.getCentimeterToPoint(tileInfo.z);
            // const centimeterToPoint = this.getCentimeterToPoint(tileInfo.z);
            // console.log(centimeterToPoint, centimeterToPoint1);
            const glScale = this.getTileGLScale(tileInfo.z);
            this._requestingMVT[url] = {
                keys: {},
                // 一个url可能对应了好几个tile，例如 repeatWorld 时
                tiles: [tileInfo]
            };
            this._requestingMVT[url].keys[tileInfo.id] = 1;
            const fetchOptions = this.layer.options['fetchOptions'];
            const referrer = window && window.location.href;
            this._workerConn.loadTile({ tileInfo: { res: tileInfo.res, x: tileInfo.x, y: tileInfo.y, z: tileInfo.z, url: tileInfo.url, id: tileInfo.id, extent2d: tileInfo.extent2d },
                glScale, zScale: this._zScale, centimeterToPoint, verticalCentimeterToPoint, fetchOptions, styleCounter: this._styleCounter, referrer }, this._onReceiveMVTData.bind(this, url));
        } else if (!cached.keys[tileInfo.id]) {
            cached.tiles.push(tileInfo);
            cached.keys[tileInfo.id] = 1;
        }
        return {};
    }

    getTileGLScale(z) {
        const map = this.getMap();
        const sr = this.layer.getSpatialReference();
        return sr.getResolution(z) / map.getGLRes();
    }

    getCentimeterToPoint(z) {
        const map = this.getMap();
        const sr = this.layer.getSpatialReference();
        const res = sr.getResolution(z);
        return getCentiMeterScale(res, map);
    }

    getRenderedFeatures() {
        const renderedFeatures = [];
        const keys = this.tileCache.keys();
        for (let i = 0; i < keys.length; i++) {
            const cache = this.tileCache.get(keys[i]);
            if (!cache || !cache.info || !cache.image) {
                continue;
            }
            const { info, image } = cache;
            const features = findFeatures(image);
            renderedFeatures.push({
                tile: { id: info.id, x: info.x, y: info.y, z: info.z, url: info.url },
                current: !!this.tilesInView[info.id],
                features
            });
        }
        return renderedFeatures;
    }

    _onReceiveMVTData(url, err, data) {
        this.setToRedraw();
        if (!this._requestingMVT[url]) {
            return;
        }
        if (data && data.canceled) {
            return;
        }
        const layer = this.layer;
        const useDefault = layer.isDefaultRender();
        const { tiles } = this._requestingMVT[url];
        delete this._requestingMVT[url];
        if (err) {
            if (err.status && (err.status === 404 || err.status === 204)) {
                //只处理404
                for (let i = 0; i < tiles.length; i++) {
                    const tileInfo = tiles[i];
                    this.onTileError(EMPTY_VECTOR_TILE, tileInfo);
                }

            }
            return;
        }
        if (!data) {
            for (let i = 0; i < tiles.length; i++) {
                const tileInfo = tiles[i];
                this.consumeTile({ _empty: true }, tileInfo);
            }
            return;
        }

        if (data.styleCounter !== this._styleCounter) {
            //返回的是上一个style的tileData
            return;
        }
        let needCompile = false;
        //restore features for plugin data
        const features = data.features;
        const layers = [];
        for (let i = 0; i < data.data.length; i++) {
            const pluginData = data.data[i]; // { data, featureIndex }
            if (!pluginData || !pluginData.data || !pluginData.styledFeatures.length) {
                continue;
            }
            const { isUpdated, layer } = this._parseTileData(0, i, pluginData, features, layers);
            layers.push(layer);
            if (isUpdated) {
                needCompile = isUpdated;
            }
        }
        //iterate plugins
        for (let i = 0; i < data.featureData.length; i++) {
            const pluginData = data.featureData[i]; // { data, featureIndex }
            if (!pluginData || !pluginData.data || !pluginData.styledFeatures.length) {
                continue;
            }
            this._parseTileData(1, i, pluginData, features);
        }

        if (needCompile) {
            layer._compileStyle();
        }

        const tileZoom = tiles[0].z;
        const schema = this.layer.getDataSchema(tileZoom);
        this._updateSchema(schema, data.schema);

        // data.features会在_parseTileData方法中被转化为 { [key_idx]: fea, .... } 的形式
        delete data.features;
        if (useDefault && data.data.length !== layers.length) {
            //因为默认绘制时，renderPlugin是以tileData中的图层顺序初始化的
            //当某个图层data为空时，需要将它从tileData中剔除，否则layer的renderPlugin就无法对应到数据
            const oldData = data.data;
            data.data = [];
            for (let i = 0; i < oldData.length; i++) {
                if (!oldData[i] || !oldData[i].features) {
                    continue;
                }
                data.data.push(oldData[i]);
            }
        }
        data.layers = layers;
        for (let i = 0; i < tiles.length; i++) {
            const tileInfo = tiles[i];
            if (i === 0) {
                if (layer.options['debugTileData']) {
                    const { x, y, z } = tileInfo;
                    console.log('tile', {
                        'layerId': layer.getId(),
                        x,
                        y,
                        z,
                        layers: groupFeatures(Object.values(features))
                    });
                }
            }
            const tileData = i === 0 ? data : copyTileData(data);
            for (let j = 0; j < tileData.data.length; j++) {
                if (!tileData.data[j]) {
                    continue;
                }
                const features = tileData.data[j].features;
                for (const p in features) {
                    const feature = features[p];
                    feature.tile = tileInfo;
                }
            }
            tileInfo.extent = tileData && tileData.extent;
            tileData.features = Object.values(features);
            tileData.styleCounter = data.styleCounter;
            this.onTileLoad(tileData, tileInfo)
        }
        this.layer.fire('datareceived', { url });
    }

    _parseTileData(styleType, i, pluginData, features) {
        const { style, isUpdated } = this._updatePluginIfNecessary(styleType, i, pluginData.data);

        const layer = this.layer;
        const useDefault = layer.isDefaultRender();

        const symbol = style.symbol;
        const feaIndexes = pluginData.styledFeatures;
        //pFeatures是一个和features相同容量的数组，只存放有样式的feature数据，其他为undefined
        //这样featureIndexes中的序号能从pFeatures取得正确的数据
        // GeoJSONVectorTileLayer上的features需要复制，以保留原有的数据
        const pluginFeas = convertToPainterFeatures(features, feaIndexes, i, symbol, layer, !!(layer.getData && layer.getData()));
        // const pluginFeas = {};
        // if (hasFeature(features)) {
        //     //[feature index, style index]
        //     for (let ii = 0, ll = feaIndexes.length; ii < ll; ii++) {
        //         let feature = features[feaIndexes[ii]];
        //         if (layer.options['features'] === 'id' && layer.getFeature) {
        //             feature = layer.getFeature(feature);
        //             feature.layer = i;
        //         }
        //         pluginFeas[feaIndexes[ii]] = {
        //             feature,
        //             symbol
        //         };
        //     }
        // }
        delete pluginData.styledFeatures;
        pluginData.features = pluginFeas;
        let data = pluginData.data;
        if (Array.isArray(data)) {
            // 多symbol返回的数据
            data = data[0];
        }
        return {
            isUpdated,
            layer: useDefault ? { layer: data.layer, type: data.type } : null
        };
    }

    _updateSchema(target, source) {
        // const useDefault = this.layer.isDefaultRender();
        for (const layer in source) {
            if (!target[layer]) {
                target[layer] = {
                    types: source[layer].types,
                    properties: {}
                };
                // if (useDefault && this._layerPlugins) {
                //     target[layer].symbol = this._layerPlugins[layer].symbol;
                // }
            }
            const srcProps = source[layer].properties;
            const targetProps = target[layer].properties;
            for (const type in srcProps) {
                if (!targetProps[type] ||
                    //之前的瓦片里，target[layer][type]的值是null或undefined时，类型被判断为object
                    targetProps[type] && srcProps[type] !== 'object' && targetProps[type] === 'object') {
                    targetProps[type] = srcProps[type];
                }
            }
        }
    }

    _updatePluginIfNecessary(styleType, i, data) {
        if (Array.isArray(data)) {
            // 是个多symbol数据
            data = data[0];
        }
        const layer = this.layer;
        let isUpdated = false;
        let style;
        const useDefault = layer.isDefaultRender();
        if (useDefault && styleType === 0) {
            let layerPlugins = this._layerPlugins;
            if (!layerPlugins) {
                layerPlugins = this._layerPlugins = {};
            }
            //没有定义任何图层，采用图层默认的plugin渲染
            const layerId = data.layer;
            const type = data.type;
            if (!layerPlugins[layerId]) {
                layerPlugins[layerId] = [];
            }
            const pluginTypeName = ('plugin_' + type).trim();
            if (!layerPlugins[layerId][pluginTypeName]) {
                style = this._getDefaultRenderPlugin(type);
                style.filter = data.filter;
                layerPlugins[layerId].push(style);
                layerPlugins[layerId][pluginTypeName] = style;
                isUpdated = true;
                // layerStyles.push(style);
            } else {
                style = layerPlugins[layerId][pluginTypeName];
            }
        } else {
            const allStyles = layer._getComputedStyle();
            const styles = layer._getTargetStyle(styleType, allStyles);
            const plugins = this._getStylePlugins();
            style = styles[i];
            if (!style.renderPlugin) {
                isUpdated = true;
                const { plugin, symbol, renderPlugin } = this._getDefaultRenderPlugin(data.type);
                plugins[i] = plugin;
                style.symbol = symbol;
                style.renderPlugin = renderPlugin;
            }
        }
        return { style, isUpdated };
    }

    _getFramePlugins(tileData) {
        const styleCounter = tileData && tileData.style;
        let plugins = this._getStylePlugins(styleCounter) || [];
        if (this.layer.isDefaultRender() && this._layerPlugins) {
            plugins = [];
            if (tileData) {
                if (tileData.layers) {
                    tileData.layers.forEach(info => {
                        if (!info) {
                            return;
                        }
                        const pluginTypeName = ('plugin_' + info.type).trim();
                        plugins.push(this._layerPlugins[info.layer][pluginTypeName].plugin);
                    });
                }
            } else {
                Object.keys(this._layerPlugins).forEach(layer => {
                    for (let i = 0; i < this._layerPlugins[layer].length; i++) {
                        plugins.push(this._layerPlugins[layer][i].plugin);
                    }
                });
            }
        }
        const featurePlugins = this._getFeaturePlugins(styleCounter);
        if (featurePlugins && featurePlugins.length) {
            plugins = plugins.slice();
            pushIn(plugins, featurePlugins);
        }

        return plugins;
    }

    _getAllPlugins() {
        if (this.layer.isDefaultRender() && this._layerPlugins) {
            const plugins = [];
            Object.keys(this._layerPlugins).forEach(layer => {
                for (let i = 0; i < this._layerPlugins[layer].length; i++) {
                    plugins.push(this._layerPlugins[layer][i].plugin);
                }
            });
            return plugins;
        }
        const plugins = [];
        for (const p in this._plugins) {
            plugins.push(...this._plugins[p])
        }
        for (const p in this._featurePlugins) {
            plugins.push(...this._featurePlugins[p]);
        }
        return plugins;
    }

    _getStylePlugins(styleCounter) {
        if (isNil(styleCounter)) {
            styleCounter = this._styleCounter;
        }
        return this._plugins[styleCounter] || EMPTY_ARRAY;
    }

    _getFeaturePlugins(styleCounter) {
        if (isNil(styleCounter)) {
            styleCounter = this._styleCounter;
        }
        return this._featurePlugins[styleCounter] || EMPTY_ARRAY;
    }

    _startFrame(timestamp, filter) {
        const isRenderingTerrain = !!this._terrainLayer;
        const useDefault = this.layer.isDefaultRender() && this._layerPlugins;
        const parentContext = this._parentContext;
        const plugins = this._getAllPlugins();
        plugins.forEach((plugin, idx) => {
            if (!plugin || filter && !filter(plugin)) {
                return;
            }
            const visible = this._isVisible(idx);
            if (!visible) {
                return;
            }
            const regl = this.regl;
            const gl = this.gl;
            const symbol = useDefault ? plugin.defaultSymbol : plugin.style && plugin.style.symbol;
            const context = {
                regl,
                layer: this.layer,
                symbol,
                gl,
                isRenderingTerrain,
                sceneConfig: plugin.config ? plugin.config.sceneConfig : null,
                dataConfig: plugin.config ? plugin.config.dataConfig : null,
                pluginIndex: idx,
                timestamp
            };
            if (parentContext) {
                extend(context, parentContext);
            }
            plugin.startFrame(context);
        });
    }

    _endFrame(timestamp) {
        const parentContext = this._parentContext;
        const mode = parentContext.renderMode;
        const targetFBO = parentContext && parentContext.renderTarget && parentContext.renderTarget.fbo;
        const cameraPosition = this.getMap().cameraPosition;
        const plugins = this._getAllPlugins();
        // terrain skin的相关数据已经在renderTerrainSkin中绘制，这里就不再绘制
        const isRenderingTerrain = !!this._terrainLayer;
        const isFinalRender = !parentContext.timestamp || parentContext.isFinalRender;

        // maptalks/issues#202, finalRender后不再更新collision，以免后处理（如bloom）阶段继续更新collision造成bug
        if (this.layer.options.collision && !parentContext.isPostProcess) {
            //按照plugin顺序更新collision索引
            plugins.forEach((plugin) => {
                if (!this._isVisible(plugin) || !plugin.hasMesh()) {
                    return;
                }
                if (mode && mode !== 'default' && !plugin.supportRenderMode(mode)) {
                    return;
                }
                if (isRenderingTerrain && !terrainVectorFilter(plugin)) {
                    return;
                }
                const context = this._getPluginContext(plugin, 0, cameraPosition, timestamp);
                plugin.prepareRender(context);
                plugin.updateCollision(context);
            });
        } else {
            plugins.forEach((plugin) => {
                if (!this._isVisible(plugin) || !plugin.hasMesh()) {
                    return;
                }
                if (mode && mode !== 'default' && !plugin.supportRenderMode(mode)) {
                    return;
                }
                if (isRenderingTerrain && !terrainVectorFilter(plugin)) {
                    return;
                }
                const context = this._getPluginContext(plugin, 0, cameraPosition, timestamp);
                plugin.prepareRender(context);
            });
        }

        const isFirstRender = this._currentTimestamp !== parentContext.timestamp;

        let dirty = false;
        //只在需要的时候才增加polygonOffset
        if (isFirstRender && !isRenderingTerrain) {
            const groundOffset = this.layer.getPolygonOffset() + this.layer.getPolygonOffsetCount();
            const groundContext = this._getPluginContext(null, groundOffset, cameraPosition, timestamp);
            groundContext.offsetFactor = groundOffset;
            groundContext.offsetUnits = groundOffset
            this._groundPainter.paint(groundContext);
        }
        plugins.forEach((plugin, idx) => {
            const hasMesh = this._isVisitable(plugin);
            if (!hasMesh) {
                return;
            }
            if (mode && mode !== 'default' && !plugin.supportRenderMode(mode)) {
                return;
            }
            if (isRenderingTerrain && !terrainVectorFilter(plugin)) {
                return;
            }
            this.regl.clear({
                stencil: 0xFF,
                framebuffer: targetFBO
            });
            const polygonOffsetIndex = this._pluginOffsets[idx] || 0;
            const context = this._getPluginContext(plugin, polygonOffsetIndex, cameraPosition, timestamp);
            if (plugin.painter && plugin.painter.isEnableTileStencil(context)) {
                this._drawTileStencil(targetFBO, plugin.painter);
            }
            const status = plugin.endFrame(context);
            if (status && status.redraw) {
                //let plugin to determine when to redraw
                this.setToRedraw();
            }
            dirty = true;
        });
        if (dirty) {
            this.layer.fire('canvasisdirty');
        }
        if (isFinalRender) {
            this._drawDebug();
        }
    }

    getPolygonOffsetCount() {
        return this._polygonOffsetIndex || 0;
    }

    _drawDebug() {
        const layer = this.layer;
        if (layer.options['debug']) {
            const parentContext = this._parentContext;
            const mat = [];
            const projViewMatrix = this.getMap().projViewMatrix;
            for (const p in this.tilesInView) {
                const info = this.tilesInView[p].info;
                const tileImage = this.tilesInView[p].image;
                if (tileImage._empty) {
                    continue;
                }
                const transform = info.transform;
                const extent = tileImage.extent;
                const renderTarget = parentContext && parentContext.renderTarget;
                if (transform && extent) {
                    const debugInfo = this.getDebugInfo(info.id);
                    const matrix = mat4.multiply(mat, projViewMatrix, transform);
                    const tileSize = this.layer.getTileSize().width;
                    this._debugPainter.draw(
                        debugInfo, matrix,
                        tileSize, extent,
                        renderTarget && renderTarget.fbo
                    );
                }
            }
        }
    }

    _isVisitable(plugin) {
        if (!plugin) {
            return true;
        }
        const parentContext = this._parentContext;
        const visible = this._isVisible(plugin);
        const includesChanged = parentContext && parentContext.states && parentContext.states.includesChanged;
        const hasMesh = this._hasMesh(plugin.painter.scene.getMeshes());
        const empty = !visible || !includesChanged && !hasMesh;
        if (empty) {
            return 0;
        } else {
            return hasMesh ? 2 : 1;
        }
    }

    _getPluginContext(plugin, polygonOffsetIndex, cameraPosition, timestamp) {
        const isRenderingTerrain = !!this._terrainLayer;
        const isRenderingTerrainSkin = isRenderingTerrain && plugin && terrainSkinFilter(plugin);
        const regl = this.regl;
        const gl = this.gl;
        const context = {
            regl,
            layer: this.layer,
            gl,
            isRenderingTerrain,
            isRenderingTerrainSkin,
            sceneConfig: plugin && plugin.config.sceneConfig,
            pluginIndex: plugin && plugin.renderIndex,
            polygonOffsetIndex,
            cameraPosition,
            timestamp
        };
        const parentContext = this._parentContext;
        if (parentContext) {
            extend(context, parentContext);
        }
        return context;
    }

    _hasMesh(meshes) {
        if (!meshes) {
            return false;
        }
        const filter = this._parentContext && this._parentContext.sceneFilter;
        if (!filter) {
            return meshes.length > 0;
        }
        // 还要检查是否存在 hlBloomMesh
        return meshes.filter(mesh => filter(mesh) || mesh.properties.hlBloomMesh && filter(mesh.properties.hlBloomMesh)).length > 0;
    }

    _drawTileStencil(fbo, painter) {
        const uniqueRef = painter.isUniqueStencilRefPerTile();
        const tileZoom = this.getCurrentTileZoom();
        let stencilRenderer = this._stencilRenderer;
        if (!stencilRenderer) {
            stencilRenderer = this._stencilRenderer = new TileStencilRenderer(this.regl, this.canvas, this.getMap());
        }
        stencilRenderer.start();
        const { tiles } = this._stencilTiles;
        let { parentTiles, childTiles } = this._stencilTiles;
        let ref = 1;
        childTiles = childTiles.sort(sortByLevel);
        for (let i = 0; i < childTiles.length; i++) {
            const stencilRef = uniqueRef ? ref : this.getTileLevelValue(childTiles[i].info, tileZoom);
            this._addTileStencil(childTiles[i].info, stencilRef);
            ref++;
        }
        parentTiles = parentTiles.sort(sortByLevel);
        for (let i = 0; i < parentTiles.length; i++) {
            const stencilRef = uniqueRef ? ref : this.getTileLevelValue(parentTiles[i].info, tileZoom);
            this._addTileStencil(parentTiles[i].info, stencilRef);
            ref++;
        }
        //默认情况下瓦片是按照level从小到大排列的，所以倒序排列，让level较小的tile最后画（优先级最高）
        const currentTiles = tiles.sort(sortByLevel);
        for (let i = currentTiles.length - 1; i >= 0; i--) {
            const stencilRef = uniqueRef ? ref : this.getTileLevelValue(currentTiles[i].info, tileZoom);
            this._addTileStencil(currentTiles[i].info, stencilRef);
            ref++;
        }

        stencilRenderer.render(fbo);
    }

    _addTileStencil(tileInfo, ref) {
        const tilePoint = TILE_POINT.set(tileInfo.extent2d.xmin, tileInfo.extent2d.ymax);
        const tileTransform = tileInfo.transform = tileInfo.transform || this.calculateTileMatrix(tilePoint, tileInfo.z, tileInfo.extent);
        tileInfo.stencilRef = ref;
        this._stencilRenderer.add(ref, tileInfo.extent, tileTransform);
    }

    onDrawTileStart(context) {
        super.onDrawTileStart(context);
        const { tiles, childTiles, parentTiles } = context;
        this._vtCurrentTiles = {};
        this._vtBgTiles = {};
        for (let i = 0; i < tiles.length; i++) {
            this._vtCurrentTiles[tiles[i].info.id] = 1;
        }
        for (let i = 0; i < childTiles.length; i++) {
            this._vtBgTiles[childTiles[i].info.id] = 1;
        }
        for (let i = 0; i < parentTiles.length; i++) {
            this._vtBgTiles[parentTiles[i].info.id] = 1;
        }
        this._stencilTiles = context;
    }

    isEnableTileStencil() {
        if (this.layer.options.altitude) {
            return false;
        }
        const plugins = this._getFramePlugins();
        for (let i = 0; i < plugins.length; i++) {
            if (!plugins[i] || !plugins[i].painter) {
                continue;
            }
            if (!plugins[i].painter.isOnly2D()) {
                return false;
            }
        }
        return true;
    }

    setTerrainHelper(terrainLayer) {
        this._terrainLayer = terrainLayer;
    }

    getTerrainHelper() {
        return this._terrainLayer;
    }

    // 有地形时的tile draw 方法
    drawTileOnTerrain(...args) {
        // drawTile 有可能在GroupGLLayer被替换，但prototype上的定义是不会被替换的
        // VectorTileLayerRenderer.prototype.drawTile.call(this, tileInfo, tileData, terrainSkinFilter);
        VectorTileLayerRenderer.prototype.drawTile.call(this, ...args);
    }

    createTerrainTexture(regl) {
        const tileSize = this.layer.getTileSize().width;
        const width = tileSize * 2;
        const height = tileSize * 2;
        const color = regl.texture({
            min: 'linear',
            mag: 'linear',
            type: 'uint8',
            width,
            height
        });
        if (!this._terrainDepthStencil) {
            this._terrainDepthStencil = regl.renderbuffer({
                width,
                height,
                format: 'depth24 stencil8'
            });
        }
        const fboInfo = {
            width,
            height,
            colors: [color],
            // stencil: true,
            // colorCount,
            colorFormat: 'rgba',
            ignoreStatusCheck: true
        };
        fboInfo.depthStencil = this._terrainDepthStencil;
        const texture = regl.framebuffer(fboInfo)
        texture.colorTex = color;
        // 单独创建的 color 必须要手动destroy回收，光destroy framebuffer，color是不会销毁的
        return texture;
    }

    deleteTerrainTexture(texture) {
        texture.destroy();
        if (texture.colorTex) {
            texture.colorTex.destroy();
            delete texture.colorTex;
        }
    }

    renderTerrainSkin(terrainRegl, terrainLayer, skinImages) {
        const timestamp = this._currentTimestamp;
        const parentContext = this._parentContext;
        const tileSize = this.layer.getTileSize().width;
        this._startFrame(timestamp);
        for (let i = 0; i < skinImages.length; i++) {
            const texture = skinImages[i].texture;
            this._parentContext = {
                renderTarget: {
                    fbo: texture
                }
            };
            TERRAIN_CLEAR.framebuffer = texture;
            terrainRegl.clear(TERRAIN_CLEAR);
            this._parentContext.viewport = getTileViewport(tileSize);
            // 如果矢量瓦片的目标绘制尺寸过大，拉伸后会过于失真，还不如不去绘制
            this._drawTerrainTile(skinImages[i].tile, texture);
        }
        this._endTerrainFrame(skinImages);
        this._parentContext = parentContext;
    }

    _drawTerrainTile(tile) {
        const { info, image } = tile;
        this.drawTile(info, image, terrainSkinFilter);
    }

    _endTerrainFrame(skinImages) {
        const plugins = this._getAllPlugins();
        const cameraPosition = this.getMap().cameraPosition;
        const timestamp = this._currentTimestamp || 0;

        if (this.layer.options.collision) {
            //按照plugin顺序更新collision索引
            plugins.forEach((plugin) => {
                if (!this._isVisible(plugin) || !plugin.hasMesh()) {
                    return;
                }
                if (!terrainSkinFilter(plugin) || !this.layer.options.awareOfTerrain) {
                    return;
                }
                const context = this._getPluginContext(plugin, 0, cameraPosition, timestamp);
                context.isRenderingTerrainSkin = true;
                plugin.prepareRender(context);
                plugin.updateCollision(context);
            });
        } else {
            plugins.forEach((plugin) => {
                if (!this._isVisible(plugin) || !plugin.hasMesh()) {
                    return;
                }
                if (!terrainSkinFilter(plugin) || !this.layer.options.awareOfTerrain) {
                    return;
                }
                const context = this._getPluginContext(plugin, 0, cameraPosition, timestamp);
                context.isRenderingTerrainSkin = true;
                plugin.prepareRender(context);
            });
        }

        plugins.forEach((plugin, idx) => {
            const hasMesh = this._isVisitable(plugin);
            if (!hasMesh || !terrainSkinFilter(plugin)) {
                return;
            }
            for (let i = 0; i < skinImages.length; i++) {
                const texture = skinImages[i].texture;
                this.regl.clear({
                    stencil: 0xFF,
                    framebuffer: texture
                });
            }

            const polygonOffsetIndex = this._pluginOffsets[idx] || 0;
            const context = this._getPluginContext(plugin, polygonOffsetIndex, [0, 0, 0], this._currentTimestamp);
            context.isRenderingTerrainSkin = true;
            plugin.endFrame(context);
        });
    }

    drawTile(tileInfo, tileData, filter) {
        if (!tileData.cache) return;
        const isRenderingTerrain = !!this._terrainLayer;
        const tileCache = tileData.cache;
        const tilePoint = TILE_POINT.set(tileInfo.extent2d.xmin, tileInfo.extent2d.ymax);
        const tileTransform = tileInfo.transform = tileInfo.transform || this.calculateTileMatrix(tilePoint, tileInfo.z, tileInfo.extent);
        const tileTranslationMatrix = tileInfo.tileTranslationMatrix = tileInfo.tileTranslationMatrix || this.calculateTileTranslationMatrix(tilePoint, tileInfo.z);
        const terrainTileTransform = tileInfo.terrainTransform = tileInfo.terrainTransform || this.calculateTerrainTileMatrix(tilePoint, tileInfo.z, tileInfo.extent);

        const parentContext = this._parentContext;
        const pluginData = [];
        pushIn(pluginData, tileData.data);
        pushIn(pluginData, tileData.featureData);

        const plugins = this._getFramePlugins(tileData);

        plugins.forEach((plugin, idx) => {
            if (!plugin || filter && !filter(plugin)) {
                return;
            }
            if (!pluginData[idx]) {
                return;
            }
            if (!tileCache[idx]) {
                return;
            }
            const isRenderingTerrainSkin = isRenderingTerrain && terrainSkinFilter(plugin);
            const regl = this.regl;
            const gl = this.gl;
            const context = {
                regl,
                layer: this.layer,
                gl,
                sceneConfig: plugin.config.sceneConfig,
                pluginIndex: idx,
                tileCache: tileCache[idx],
                tileData: pluginData[idx],
                tileTransform: isRenderingTerrainSkin ? terrainTileTransform : tileTransform,
                tileVectorTransform: tileTransform,
                tileTranslationMatrix,
                tileExtent: tileData.extent,
                timestamp: this._frameTime,
                tileInfo,
                tileZoom: this['_tileZoom'],
                bloom: this._parentContext && this._parentContext.bloom,
                isRenderingTerrain,
                isRenderingTerrainSkin
            };
            if (isRenderingTerrainSkin && parentContext && parentContext.renderTarget) {
                // 渲染 terrain skin 时，每个瓦片需要绘制到各自的renderTarget里（terrain texture）
                context.renderTarget = parentContext.renderTarget;
            }
            const status = plugin.paintTile(context);
            if (!this._needRetire && (status.retire || status.redraw) && plugin.supportRenderMode('taa')) {
                this._needRetire = true;
            }
            if (status.redraw) {
                //let plugin to determine when to redraw
                this.setToRedraw();
            }
        });
        if (tileData && tileData.style === this._styleCounter) {
            this._retirePrevTile(tileInfo);
        }
        this.setCanvasUpdated();
    }

    _createOneTile(tileInfo, tileData) {
        if (!tileData.loadTime || tileData._empty) return;
        // const parentContext = this._parentContext;
        let tileCache = tileData.cache;
        if (!tileCache) {
            tileCache = tileData.cache = {};
        }
        const isRenderingTerrain = !!this._terrainLayer;
        const tilePoint = TILE_POINT.set(tileInfo.extent2d.xmin, tileInfo.extent2d.ymax);
        const tileTransform = tileInfo.transform = tileInfo.transform || this.calculateTileMatrix(tilePoint, tileInfo.z, tileData.extent);
        const tileTranslationMatrix = tileInfo.tileTranslationMatrix = tileInfo.tileTranslationMatrix || this.calculateTileTranslationMatrix(tilePoint, tileInfo.z);
        const terrainTileTransform = tileInfo.terrainTransform = tileInfo.terrainTransform || this.calculateTerrainTileMatrix(tilePoint, tileInfo.z, tileInfo.extent);
        const pluginData = [];
        pushIn(pluginData, tileData.data);
        pushIn(pluginData, tileData.featureData);

        const plugins = this._getFramePlugins(tileData);

        plugins.forEach((plugin, idx) => {
            if (!plugin) {
                return;
            }
            if (!pluginData[idx]) {
                return;
            }
            const isRenderingTerrainSkin = isRenderingTerrain && terrainSkinFilter(plugin);
            const regl = this.regl;
            const gl = this.gl;
            if (!tileCache[idx]) {
                tileCache[idx] = {};
            }
            const context = {
                regl,
                layer: this.layer,
                gl,
                sceneConfig: plugin.config.sceneConfig,
                pluginIndex: idx,
                tileCache: tileCache[idx],
                tileData: pluginData[idx],
                tileTransform: isRenderingTerrainSkin ? terrainTileTransform : tileTransform,
                tileVectorTransform: tileTransform,
                isRenderingTerrain,
                isRenderingTerrainSkin,
                tileTranslationMatrix,
                tileExtent: tileData.extent,
                timestamp: this._frameTime,
                tileInfo,
                tileZoom: this['_tileZoom']
            };
            const status = plugin.createTile(context);
            if (tileCache[idx].geometry) {
                //插件数据以及经转化为geometry，可以删除原始数据以节省内存
                tileData.data[idx] = 1;
            }
            if (!this._needRetire && status.retire && plugin.supportRenderMode('taa')) {
                this._needRetire = true;
            }
        });
    }

    checkTileInQueue(tileData) {
        return tileData.styleCounter === this._styleCounter;
    }

    pick(x, y, options) {
        const hits = [];
        if (!this.layer.isVisible()) {
            return hits;
        }
        const plugins = this._getFramePlugins();
        plugins.forEach((plugin) => {
            if (!plugin) {
                return;
            }
            const visible = this._isVisible(plugin);
            if (!visible) {
                return;
            }
            const picked = plugin.pick(x, y, options.tolerance);
            if (picked) {
                picked.type = plugin.getType();
                hits.push(picked);
            }
        });
        return hits;
    }

    deleteTile(tile) {
        if (!tile) {
            return;
        }
        if (tile.image && !tile.image._empty) {
            const styleCounter = tile.image && tile.image.style;
            const plugins = this._getStylePlugins(styleCounter);
            if (plugins) {
                plugins.forEach((plugin, idx) => {
                    if (!plugin) {
                        return;
                    }
                    plugin.deleteTile({
                        pluginIndex: idx,
                        regl: this.regl,
                        layer: this.layer,
                        gl: this.gl,
                        tileCache: tile.image.cache ? tile.image.cache[idx] : {},
                        tileInfo: tile.info,
                        tileData: tile.image
                    });
                });
            }
            tile.image.cache = {};
        }
        if (tile.info) {
            delete tile.info.completeTerrainQuery;
            delete tile.info.terrainQueryStatus;
        }
        //ask plugin to clear caches
        super.deleteTile(tile);
    }

    abortTileLoading(tileImage, tileInfo) {
        if (tileInfo && tileInfo.url) {
            if (this._workerConn) {
                this._workerConn.abortTile(tileInfo.url);
            }
            delete this._requestingMVT[tileInfo.url];
        }
        super.abortTileLoading(tileImage, tileInfo);
    }

    resizeCanvas(canvasSize) {
        super.resizeCanvas(canvasSize);
        const canvas = this.canvas;
        if (!canvas) {
            return;
        }
        if (this.pickingFBO && (this.pickingFBO.width !== canvas.width || this.pickingFBO.height !== canvas.height)) {
            this.pickingFBO.resize(canvas.width, canvas.height);
                this._getFramePlugins().forEach(plugin => {
                if (!plugin) {
                    return;
                }
                plugin.resize(canvas.width, canvas.height);
            });
        }
    }

    onRemove() {
        if (this._stencilRenderer) {
            this._stencilRenderer.remove();
        }
        // const map = this.getMap();
        if (this._workerConn) {
            this._workerConn.removeLayer(err => {
                if (err) throw err;
            });
            this._workerConn.remove();
            delete this._workerConn;
        }
        if (this.pickingFBO) {
            if (!this.canvas.pickingFBO) {
                this.pickingFBO.destroy();
            }
            delete this.pickingFBO;
        }
        if (this._debugPainter) {
            this._debugPainter.delete();
            delete this._debugPainter;
        }
        if (this._terrainDepthStencil) {
            this._terrainDepthStencil.destroy();
            delete this._terrainDepthStencil;
        }
        if (this._groundPainter) {
            this._groundPainter.dispose();
            delete this._groundPainter;
        }
        if (super.onRemove) super.onRemove();
        this._clearPlugin();
    }

    _clearPlugin() {
        this._getAllPlugins().forEach(plugin => {
            plugin.remove();
        });
        this.plugins = {};
    }

    hitDetect(point) {
        if (!this.gl || !this.layer.options['hitDetect']) {
            return false;
        }
        const gl = this.gl;
        const pixels = new Uint8Array(1 * 1 * 4);
        const h = this.canvas.height;
        gl.readPixels(point.x, h - point.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        return (pixels[3] > 0);
    }

    _initPlugins() {
        const { style, featureStyle } = this.layer._getComputedStyle();
        const plugins = style.map((style, idx) => {
            const config = style.renderPlugin;
            if (!config) {
                return null;
            }
            if (!config.type) {
                throw new Error('invalid plugin type for style at ' + idx);
            }
            const plugin = this._createRenderPlugin(config);
            plugin.styleCounter = this._styleCounter;
            plugin.style = style;
            return plugin;
        });
        const featurePlugins = [];
        featureStyle.forEach((featureStyle, idx) => {
            const config = featureStyle.renderPlugin;
            if (!config) {
                return null;
            }
            if (!config.type) {
                throw new Error('invalid plugin type for features at ' + idx);
            }
            const plugin = this._createRenderPlugin(config);
            plugin.style = featureStyle;
            plugin.styleCounter = this._styleCounter;
            featurePlugins.push(plugin);
            return plugin;
        });
        const styleCounter = this._styleCounter;
        this._plugins[styleCounter] = plugins;
        this._featurePlugins[styleCounter] = featurePlugins;
        this.layer.fire('pluginsinited');

        if (this._highlighted && this._highlighted.size || this.layer._highlighted) {
            if (this.layer._highlighted) {
                this.layer._resumeHighlights();
            }
            const map = this.getMap();
            const renderer = map.getRenderer();
            renderer.callInNextFrame(() => {
                const plugins = this._getFramePlugins();
                plugins.forEach(plugin => {
                    plugin.highlight(this._highlighted);
                });
            });
        }

        return plugins;
    }

    _createRenderPlugin(config) {
        const pluginClazz = this.layer.constructor.getPlugins();
        const P = pluginClazz[config.type];
        if (!P) {
            throw new Error(`Plugin for (${config.type}) is not loaded.`);
        }
        const p = new P();
        p.config = config;
        if (!p.config.sceneConfig) {
            p.config.sceneConfig = {};
        }
        return p;
    }

    _createGLContext(canvas, options) {
        const names = ['webgl', 'experimental-webgl'];
        let context = null;
        /* eslint-disable no-empty */
        for (let i = 0; i < names.length; ++i) {
            try {
                context = canvas.getContext(names[i], options);
            } catch (e) { }
            if (context) {
                break;
            }
        }
        return context;
        /* eslint-enable no-empty */
    }

    _getCentiMeterScale(res) {
        const map = this.getMap();
        return getCentiMeterScale(res, map);
    }

    debugFBO(id, fbo) {
        const canvas = document.getElementById(id);
        const width = fbo.width, height = fbo.height;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const pixels = this.regl.read({
            framebuffer: fbo
        });

        const halfHeight = height / 2 | 0;  // the | 0 keeps the result an int
        const bytesPerRow = width * 4;

        for (let i = 0; i < pixels.length; i++) {
            pixels[i] *= 255;
        }

        // make a temp buffer to hold one row
        const temp = new Uint8Array(width * 4);
        for (let y = 0; y < halfHeight; ++y) {
            const topOffset = y * bytesPerRow;
            const bottomOffset = (height - y - 1) * bytesPerRow;

            // make copy of a row on the top half
            temp.set(pixels.subarray(topOffset, topOffset + bytesPerRow));

            // copy a row from the bottom half to the top
            pixels.copyWithin(topOffset, bottomOffset, bottomOffset + bytesPerRow);

            // copy the copy of the top half row to the bottom half
            pixels.set(temp, bottomOffset);
        }

        // This part is not part of the answer. It's only here
        // to show the code above worked
        // copy the pixels in a 2d canvas to show it worked
        const imgdata = new ImageData(width, height);
        imgdata.data.set(pixels);
        ctx.putImageData(imgdata, 0, 0);
    }

    //TODO 可以把图层合并为只用这三个默认插件绘制
    _getDefaultRenderPlugin(type) {
        let renderPlugin;
        switch (type) {
        case 'native-line':
            renderPlugin = {
                type: 'native-line',
                dataConfig: { type: 'native-line', only2D: true }
            };
            break;
        case 'native-point':
            renderPlugin = {
                type: 'native-point',
                dataConfig: { type: 'native-point', only2D: true }
            };
            break;
        case 'fill':
            renderPlugin = {
                type: 'fill',
                dataConfig: { type: 'fill', only2D: true },
                sceneConfig: { antialias: true }
            };
            break;
        default:
            renderPlugin = null;
        }
        const symbol = getDefaultSymbol(type);
        const plugin = this._createRenderPlugin(renderPlugin);
        plugin.defaultSymbol = symbol;
        return {
            plugin, symbol, renderPlugin
        };
    }

    _isVisible() {
        // return plugin.isVisible();
        return true;
    }

    isEnableWorkAround(key) {
        if (key === 'win-intel-gpu-crash') {
            return this.layer.options['workarounds']['win-intel-gpu-crash'] && isWinIntelGPU(this.gl);
        }
        return false;
    }

    getZScale() {
        return this._zScale;
    }

    outline(idx, featureIds) {
        if (!featureIds) {
            return;
        }
        if (!Array.isArray(featureIds)) {
            featureIds = [featureIds];
        }
        if (!this._outline) {
            this._outline = [];
        }
        this._outline.push(['paintOutline', [idx, featureIds]]);
        this.setToRedraw();
    }

    outlineFeatures(featureIds) {
        if (!featureIds) {
            return;
        }
        if (!Array.isArray(featureIds)) {
            featureIds = [featureIds];
        }
        if (!this._outline) {
            this._outline = [];
        }
        this._outline.push(['paintOutline', [null, featureIds]]);
        this.setToRedraw();
    }

    outlineBatch(idx) {
        if (!this._outline) {
            this._outline = [];
        }
        this._outline.push(['paintBatchOutline', [idx]]);
        this.setToRedraw();
    }

    outlineAll() {
        this._outlineAll = true;
        this.setToRedraw();
    }

    paintOutlineAll(fbo) {
        const plugins = this._getFramePlugins();
        for (let i = 0; i < plugins.length; i++) {
            plugins[i].outlineAll(fbo);
        }
    }

    paintOutline(fbo, idx, featureIds) {
        if (!isNil(idx)) {
            const pluginIdx = idx;
            const plugins = this._getFramePlugins();
            if (!plugins[pluginIdx] || plugins[pluginIdx].painter && !plugins[pluginIdx].painter.isVisible()) {
                return;
            }
            plugins[pluginIdx].outline(fbo, featureIds);
            return;
        }
        const feaPlugins = this._getFramePlugins();
        for (let i = 0; i < featureIds.length; i++) {
            const feaId = featureIds[i];
            for (let j = 0; j < feaPlugins.length; j++) {
                if (feaPlugins[j].style && feaPlugins[j].style.id === feaId) {
                    feaPlugins[j].outline(fbo, [feaId]);
                }
            }
        }
    }

    paintBatchOutline(fbo, idx) {
        const plugins = this._getFramePlugins();
        if (!plugins[idx] || plugins[idx].painter && !plugins[idx].painter.isVisible()) {
            return;
        }
        plugins[idx].outlineAll(fbo);
    }

    cancelOutline() {
        delete this._outline;
        delete this._outlineAll;
        this.setToRedraw();
    }

    setZIndex() {
        this.setToRedraw();
        // 不retire的话，taa的图层不会更新，fuzhenn/maptalks-studio#1112
        this._needRetire = true;
        return super.setZIndex.apply(this, arguments);
    }

    consumeTile(tileImage, tileInfo) {
        this._retirePrevTile(tileInfo);
        super.consumeTile(tileImage, tileInfo);
        if (this.layer.options.features === 'transient' && tileImage.data) {
            for (let j = 0; j < tileImage.data.length; j++) {
                if (!tileImage.data[j]) {
                    continue;
                }
                const features = tileImage.data[j].features;
                if (!features) {
                    continue;
                }
                for (const p in features) {
                    const feature = features[p] && features[p].feature;
                    if (!feature) {
                        continue;
                    }
                    if (feature.fnTypeProps) {
                        feature.customProps[oldPropsKey] = feature.fnTypeProps;
                    } else {
                        features[p] = null;
                    }
                }
            }
            this.layer.fire('_transientfeature', { tileImage });
        }
        if (tileImage && tileImage.features) {
            tileImage.features = [];
        }
        this._createOneTile(tileInfo, tileImage);
    }

    onTileError(tileImage, tileInfo) {
        this._retirePrevTile(tileInfo);
        super.onTileError(tileImage, tileInfo);
    }

    _retirePrevTile(tileInfo) {
        const { id } = tileInfo;
        if (this._prevTilesInView && this._prevTilesInView[id]) {
            const oldTile = this._prevTilesInView[id];
            this.deleteTile(oldTile);
            delete this._prevTilesInView[id];
        }
    }

    highlight(highlights) {
        if (!this._highlighted) {
            this._highlighted = new Map();
        }
        if (Array.isArray(highlights)) {
            for (let i = 0; i < highlights.length; i++) {
                if (isNil(highlights[i].name) && !isNil(highlights[i].id)) {
                    highlights[i] = extend({}, highlights[i]);
                    highlights[i].name = highlights[i].id;
                }
                this._highlighted.set(highlights[i].name, highlights[i]);
            }
        } else {
            if (isNil(highlights.name) && !isNil(highlights.id)) {
                highlights = extend({}, highlights);
                highlights.name = highlights.id;
            }
            this._highlighted.set(highlights.name, highlights);
        }

        const plugins = this._getFramePlugins();
        plugins.forEach(plugin => {
            plugin.highlight(this._highlighted);
        });
        this._highlightUpdated = true;
    }

    cancelHighlight(names) {
        if (!this._highlighted) {
            return;
        }
        if (Array.isArray(names)) {
            for (let i = 0; i < names.length; i++) {
                this._highlighted.delete(names[i]);
            }
        } else {
            this._highlighted.delete(names);
        }
        const plugins = this._getFramePlugins();
        plugins.forEach(plugin => {
            plugin.highlight(this._highlighted);
        });
        this._highlightUpdated = true;
    }

    cancelAllHighlight() {
        if (!this._highlighted) {
            return;
        }
        delete this._highlighted;
        const plugins = this._getFramePlugins();
        plugins.forEach(plugin => {
            plugin.cancelAllHighlight();
        });
        this._highlightUpdated = true;
    }

    _getLayerOpacity() {
        const layerOpacity = this.layer.options['opacity'];
        // 不在GroupGLLayer中时，MapCanvasRenderer会读取opacity并按照透明度绘制，所以layerOpacity设成1
        return this._isInGroupGLLayer() ? (isNil(layerOpacity) ? 1 : layerOpacity) : 1;
    }
}

VectorTileLayerRenderer.include({
    calculateTileMatrix: function () {
        const v0 = new Array(3);
        const v1 = new Array(3);
        const v2 = new Array(3);
        return function (point, z, EXTENT) {
            const glScale = this.getTileGLScale(z);
            const tilePos = point;
            const tileSize = this.layer.getTileSize().width;
            const posMatrix = mat4.identity([]);
            //TODO 计算zScale时，zoom可能和tileInfo.z不同
            mat4.scale(posMatrix, posMatrix, vec3.set(v0, glScale, glScale, this._zScale));
            mat4.translate(posMatrix, posMatrix, vec3.set(v1, tilePos.x, tilePos.y, 0));
            mat4.scale(posMatrix, posMatrix, vec3.set(v2, tileSize / EXTENT, -tileSize / EXTENT, 1));

            return posMatrix;
        };
    }(),

    calculateTerrainTileMatrix: function () {
        const v0 = new Array(3);
        return function (point, z, EXTENT) {
            const posMatrix = mat4.identity([]);
            const halfExtent = EXTENT / 2;
            mat4.scale(posMatrix, posMatrix, vec3.set(v0, 1 / halfExtent, -1 / halfExtent, 0));
            mat4.translate(posMatrix, posMatrix, vec3.set(v0, -halfExtent, -halfExtent, 0));
            return posMatrix;
        };
    }(),

    calculateTileTranslationMatrix: function () {
        // GLTF_Mixin中用到的
        const v0 = new Array(3);
        return function (point, z) {
            const glScale = this.getTileGLScale(z);
            const tilePos = point;
            const posMatrix = mat4.identity([]);
            mat4.translate(posMatrix, posMatrix, vec3.set(v0, tilePos.x * glScale, tilePos.y * glScale, 0));
            return posMatrix;
        };
    }()
});

export default VectorTileLayerRenderer;


function getDefaultSymbol(type) {
    switch (type) {
    case 'native-point':
        return {
            markerFill: '#f00',
            markerSize: 6,
            markerOpacity: 0.5
        };
    case 'native-line':
        return {
            lineColor: '#bbb',
            lineOpacity: 0.5
        };
    case 'fill':
        return {
            polygonFill: '#76a6f0',
            polygonOpacity: 0.8
        };
    }
    return null;
}

export function evaluate(prop, properties, zoom) {
    if (maptalks.Util.isFunction(prop)) {
        if (zoom !== undefined) {
            return prop(zoom, properties);
        } else {
            return prop(null, properties);
        }
    } else {
        return prop;
    }
}

function isWinIntelGPU(gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo && typeof navigator !== 'undefined') {
        //e.g. ANGLE (Intel(R) HD Graphics 620
        const gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        const win = navigator.platform === 'Win32' || navigator.platform === 'Win64';
        if (gpu && gpu.toLowerCase().indexOf('intel') >= 0 && win) {
            return true;
        }
    }
    return false;
}

function copyTileData(data) {
    let arrays;
    if (Array.isArray(data.data)) {
        arrays = [];
        pushIn(arrays, data.data);
    } else {
        arrays = {};
        extend(arrays, data.data);
    }
    const tileData = extend({}, data);
    tileData.data = arrays;
    return tileData;
}

//z小的排在后面
function sortByLevel(m0, m1) {
    return m1.info.z - m0.info.z;
}

function groupFeatures(features) {
    const group = {};
    for (let i = 0; i < features.length; i++) {
        const layer = features[i].layer || 'default';
        if (!group[layer]) {
            group[layer] = [];
        }
        group[layer].push(features[i]);
    }
    return group;
}


function needRefreshStyle(symbol) {
    if (Array.isArray(symbol)) {
        const symbols = symbol;
        for (let i = 0; i < symbols.length; i++) {
            if (needRefreshStyle(symbols[i])) {
                return true;
            }
        }
    }
    for (const p in symbol) {
        if (isFunctionDefinition(symbol[p]) || FilterUtil.isExpression(symbol[p])) {
            return true;
        }
    }
    return false;
}

// function getTileViewport(tile, terrainTileInfo) {
//     const { extent2d: extent, res, offset: terrainOffset } = terrainTileInfo;
//     const scale = tile.info.res / res;
//     const { info } = tile;
//     const offset = info.offset;
//     const width = info.extent2d.getWidth() * scale;
//     const height = info.extent2d.getHeight() * scale;
//     const xmin = info.extent2d.xmin * scale;
//     const ymax = info.extent2d.ymax * scale;
//     const left = xmin - extent.xmin;
//     const top = extent.ymax - ymax;
//     const dx = terrainOffset[0] - offset[0];
//     const dy = offset[1] - terrainOffset[1];
//     return {
//         x: (left + dx) * 2,
//         y: (extent.getHeight() - (top + dy + height)) * 2,
//         width: width * 2,
//         height: height * 2
//     };
// }

function getTileViewport(tileSize) {
    return {
        x: 0,
        y: 0,
        width: tileSize * 2,
        height: tileSize * 2
    };
}

function findFeatures(image) {
    if (!image.cache) {
        return [];
    }
    for (const p in image.cache) {
        const data = image.cache[p];
        if (!data.geometry) {
            continue;
        }
        for (let i = 0; i < data.geometry.length; i++) {
            const geometry = data.geometry[i] && data.geometry[i].geometry;
            if (geometry && geometry.properties && geometry.properties.features) {
                const empty = geometry.properties.features.empty;
                delete geometry.properties.features.empty;
                const features = Object.values(geometry.properties.features);
                if (empty !== undefined) {
                    geometry.properties.features.empty = empty;
                }
                return features;
            }
        }

    }
    return [];
}
