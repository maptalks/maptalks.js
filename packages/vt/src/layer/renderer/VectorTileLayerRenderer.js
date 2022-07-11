import * as maptalks from 'maptalks';
import { mat4, vec3, createREGL, GroundPainter } from '@maptalks/gl';
import WorkerConnection from './worker/WorkerConnection';
import { EMPTY_VECTOR_TILE } from '../core/Constant';
import DebugPainter from './utils/DebugPainter';
import TileStencilRenderer from './stencil/TileStencilRenderer';
import { extend, pushIn, getCentiMeterScale } from '../../common/Util';
import convertToPainterFeatures from './utils/convert_to_painter_features';

// const DEFAULT_PLUGIN_ORDERS = ['native-point', 'native-line', 'fill'];
const EMPTY_ARRAY = [];
const CLEAR_COLOR = [0, 0, 0, 0];
const TILE_POINT = new maptalks.Point(0, 0);

class VectorTileLayerRenderer extends maptalks.renderer.TileLayerCanvasRenderer {

    supportRenderMode() {
        return true;
    }

    constructor(layer) {
        super(layer);
        this.ready = false;
        this._styleCounter = 0;
        this._requestingMVT = {};
        this._tileQueue = [];
    }

    getTileLevelValue(tileInfo, currentTileZoom) {
        if (!this.isBackTile(tileInfo.id)) {
            return 0;
        } else {
            const z = tileInfo.z;
            return (z - currentTileZoom >= 0) ? 0 : (currentTileZoom - z);
        }
    }

    getWorkerConnection() {
        return this._workerConn;
    }

    setStyle() {
        if (this._groundPainter) {
            this._groundPainter.update();
        }
        if (this._workerConn) {
            this._styleCounter++;
            this._workerConn.updateStyle(this.layer._getComputedStyle(), err => {
                if (err) throw new Error(err);
                this._needRetire = true;
                this.clear();
                this._clearPlugin();
                this._initPlugins();
                this.setToRedraw();
                this.layer.fire('refreshstyle');
            });
        } else {
            this._initPlugins();
        }
    }

    updateOptions(conf) {
        if (this._workerConn) {
            this._workerConn.updateOptions(this.layer.getWorkerOptions(), err => {
                if (err) throw new Error(err);
                //需要重新生成瓦片的设置
                if (conf['features'] || conf['pickingGeometry'] || conf['altitudeProperty']) {
                    this.clear();
                    this._clearPlugin();
                    this._initPlugins();
                }
                this.setToRedraw();
            });
        }
    }

    updateSceneConfig(type, idx, sceneConfig) {
        const plugins = type === 0 ? this.plugins : this.featurePlugins;
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
        const plugins = type === 0 ? this.plugins : this.featurePlugins;
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
        const plugins = type === 0 ? this.plugins : this.featurePlugins;
        if (!plugins || !plugins[idx]) {
            return false;
        }
        const allStyles = this.layer._getComputedStyle();
        const styles = this.layer._getTargetStyle(type, allStyles);
        // const symbol = styles[idx].symbol;
        const plugin = plugins[idx];
        plugin.style = styles[idx];
        const needRefresh = plugin.updateSymbol(symbol, styles[idx].symbol);
        this.setToRedraw();
        return needRefresh;
    }

    //always redraw when map is interacting
    needToRedraw() {
        if (this._tileQueue.length) {
            return true;
        }
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

    createContext() {
        const inGroup = this.canvas.gl && this.canvas.gl.wrap;
        if (inGroup) {
            this.gl = this.canvas.gl.wrap();
            this.regl = this.canvas.gl.regl;
        } else {
            this._createREGLContext();
        }
        if (inGroup) {
            this.canvas.pickingFBO = this.canvas.pickingFBO || this.regl.framebuffer(this.canvas.width, this.canvas.height);
        }
        this.pickingFBO = this.canvas.pickingFBO || this.regl.framebuffer(this.canvas.width, this.canvas.height);
        this._debugPainter = new DebugPainter(this.regl, this.getMap());
        this._prepareWorker();
        this._groundPainter = new GroundPainter(this.regl, this.layer);
    }

    _createREGLContext() {
        const layer = this.layer;

        const attributes = layer.options.glOptions || {
            alpha: true,
            depth: true,
            antialias: this.layer.options['antialias']
            // premultipliedAlpha : false
        };
        attributes.preserveDrawingBuffer = true;
        attributes.stencil = true;
        this.glOptions = attributes;
        this.gl = this.gl || this._createGLContext(this.canvas, attributes);
        // console.log(this.gl.getParameter(this.gl.MAX_VERTEX_UNIFORM_VECTORS));
        this.regl = createREGL({
            gl: this.gl,
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
                    'WEBGL_draw_buffers', 'EXT_shader_texture_lod'
                ]
        });
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

    draw(timestamp, parentContext) {
        if (this._currentTimestamp !== timestamp) {
            this._needRetire = false;
            this._setPluginIndex();
        }
        const layer = this.layer;
        this.prepareCanvas();
        if (!this.ready || !layer.ready) {
            this.completeRender();
            return;
        }
        if (!this.plugins) {
            this._initPlugins();
        }
        if (!layer.isDefaultRender() && (!this.plugins.length && !this.featurePlugins.length)) {
            this.completeRender();
            return;
        }
        if (layer.options['collision']) {
            layer.clearCollisionIndex();
            layer.clearBackgroundCollisionIndex();
        }
        this._frameTime = timestamp;
        this._zScale = this._getCentiMeterScale(this.getMap().getGLRes()); // scale to convert centi-meter to gl point
        this._parentContext = parentContext || {};
        this._startFrame(timestamp);
        if (!parentContext || parentContext && parentContext.isFinalRender) {
            // maptalks/issues#10
            // 如果consumeTileQueue方法在每个renderMode都会调用，但多边形只在fxaa mode下才会绘制。
            // 导致可能出现consumeTileQueue在fxaa阶段后调用，之后的阶段就不再绘制。
            // 改为consumeTileQueue只在finalRender时调用即解决问题
            this._consumeTileQueue();
        }
        super.draw(timestamp);
        if (this._currentTimestamp !== timestamp) {
            this._prepareRender(timestamp);
        }

        this._endFrame(timestamp);

        this.completeRender();
        this._currentTimestamp = timestamp;
    }

    _setPluginIndex() {
        const plugins = this._getFramePlugins();
        //按照plugin顺序更新collision索引
        plugins.forEach((plugin, idx) => {
            plugin.renderIndex = idx;
        });
    }

    _prepareRender() {
        const plugins = this._getFramePlugins();
        this._pluginOffsets = [];
        const groundConfig = this.layer.getGroundConfig();
        let polygonOffsetIndex = +(!!groundConfig.enable);
        plugins.forEach((plugin, idx) => {
            if (!plugin.isVisible() || !hasMesh(plugin)) {
                return;
            }
            this._pluginOffsets[idx] = polygonOffsetIndex;
            if (plugin.needPolygonOffset()) {
                polygonOffsetIndex++;
            }
        });
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

    getShadowMeshes() {
        const meshes = [];
        const plugins = this._getFramePlugins();
        plugins.forEach((plugin, idx) => {
            if (!plugin) {
                return;
            }
            const visible = this._isVisible(idx);
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

    isTileNearCamera(mesh) {
        return Math.abs(this.getCurrentTileZoom() - mesh.properties.tile.z) <= 1;
    }

    isBackTile(id) {
        return !!(this._vtBgTiles && this._vtBgTiles[id]);
    }

    loadTile(tileInfo) {
        const { url } = tileInfo;
        const cached = this._requestingMVT[url];
        if (!cached) {
            const pointAtTileRes = this.getTilePointAtTileRes(tileInfo.z);
            const glScale = this.getTileGLScale(tileInfo.z);
            this._requestingMVT[url] = {
                keys: {},
                // 一个url可能对应了好几个tile，例如 repeatWorld 时
                tiles: [tileInfo]
            };
            this._requestingMVT[url].keys[tileInfo.id] = 1;
            this._workerConn.loadTile({ tileInfo, glScale, zScale: this._zScale, pointAtTileRes }, this._onReceiveMVTData.bind(this, url));
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

    getTilePointAtTileRes(z) {
        const map = this.getMap();
        const sr = this.layer.getSpatialReference();
        // / 10000是为了转换成厘米
        return map.distanceToPointAtRes(100, 100, sr.getResolution(z)).x / 10000;
    }

    _onReceiveMVTData(url, err, data) {
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
            if (err.status && err.status === 404) {
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
                this.onTileLoad({ _empty: true }, tileInfo);
            }
            return;
        }

        if (data.style !== this._styleCounter) {
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
            this._tileQueue.push({ tileData, tileInfo });
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
        const pluginFeas = convertToPainterFeatures(features, feaIndexes, i, symbol, layer);
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
            style = styles[i];
            if (!style.renderPlugin) {
                isUpdated = true;
                const { plugin, symbol, renderPlugin } = this._getDefaultRenderPlugin(data.type);
                this.plugins[i] = plugin;
                style.symbol = symbol;
                style.renderPlugin = renderPlugin;
            }
        }
        return { style, isUpdated };
    }

    _getFramePlugins(tileData) {
        let plugins = this.plugins || [];
        if (this.layer.isDefaultRender() && this._layerPlugins) {
            plugins = [];
            if (tileData) {
                if (tileData.layers) {
                    tileData.layers.forEach(info => {
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

        if (this.featurePlugins && this.featurePlugins.length) {
            plugins = plugins.slice();
            pushIn(plugins, this.featurePlugins);
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
        return this.plugins;
    }

    _startFrame(timestamp) {
        const useDefault = this.layer.isDefaultRender() && this._layerPlugins;
        const parentContext = this._parentContext;
        const plugins = this._getFramePlugins();
        plugins.forEach((plugin, idx) => {
            if (!plugin) {
                return;
            }
            const visible = this._isVisible(idx);
            if (!visible) {
                return;
            }
            const symbol = useDefault ? plugin.defaultSymbol : plugin.style && plugin.style.symbol;
            const context = {
                regl: this.regl,
                layer: this.layer,
                symbol,
                gl: this.gl,
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
        const plugins = this._getFramePlugins();

        if (this.layer.options.collision) {
            //按照plugin顺序更新collision索引
            plugins.forEach((plugin) => {
                if (!hasMesh(plugin)) {
                    return;
                }
                if (mode && mode !== 'default' && !plugin.supportRenderMode(mode)) {
                    return;
                }
                const context = this._getPluginContext(plugin, 0, cameraPosition, timestamp);
                plugin.prepareRender(context);
                plugin.updateCollision(context);
            });
        } else {
            plugins.forEach((plugin) => {
                if (!hasMesh(plugin)) {
                    return;
                }
                if (mode && mode !== 'default' && !plugin.supportRenderMode(mode)) {
                    return;
                }
                const context = this._getPluginContext(plugin, 0, cameraPosition, timestamp);
                plugin.prepareRender(context);
            });
        }

        const isFinalRender = !parentContext.timestamp || parentContext.isFinalRender;
        const isFirstRender = this._currentTimestamp !== parentContext.timestamp;

        let dirty = false;
        //只在需要的时候才增加polygonOffset
        if (isFirstRender) {
            const groundOffset = -this.layer.getPolygonOffset();
            const groundContext = this._getPluginContext(null, groundOffset, cameraPosition, timestamp);
            groundContext.offsetFactor = groundContext.offsetUnits = groundOffset;
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
            this.regl.clear({
                stencil: 0xFF,
                fbo: targetFBO
            });
            if (this.isEnableTileStencil() && plugin.painter && !plugin.painter.needClearStencil()) {
                this._drawTileStencil(targetFBO);
            }

            const polygonOffsetIndex = this._pluginOffsets[idx] || 0;
            const context = this._getPluginContext(plugin, polygonOffsetIndex, cameraPosition, timestamp);
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
                const transform = info.transform;
                const extent = this.tilesInView[p].image.extent;
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
        const idx = plugin.renderIndex;
        const parentContext = this._parentContext;
        const visible = this._isVisible(idx);
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
        const context = {
            regl: this.regl,
            layer: this.layer,
            gl: this.gl,
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
        return meshes.filter(filter).length > 0;
    }

    _drawTileStencil(fbo) {
        const only2D = this.isEnableTileStencil();
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
            this._addTileStencil(childTiles[i].info, only2D ? ref : this.getTileLevelValue(childTiles[i].info.z, tileZoom));
            ref++;
        }
        parentTiles = parentTiles.sort(sortByLevel);
        for (let i = 0; i < parentTiles.length; i++) {
            this._addTileStencil(parentTiles[i].info, only2D ? ref : this.getTileLevelValue(parentTiles[i].info.z, tileZoom));
            ref++;
        }
        //默认情况下瓦片是按照level从小到大排列的，所以倒序排列，让level较小的tile最后画（优先级最高）
        const currentTiles = tiles.sort(sortByLevel);
        for (let i = currentTiles.length - 1; i >= 0; i--) {
            this._addTileStencil(currentTiles[i].info, only2D ? ref : this.getTileLevelValue(currentTiles[i].info.z, tileZoom));
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
        return this.layer.isOnly2D();
    }

    drawTile(tileInfo, tileData) {
        if (!tileData.cache) return;
        const tileCache = tileData.cache;
        const tilePoint = TILE_POINT.set(tileInfo.extent2d.xmin, tileInfo.extent2d.ymax);
        const tileTransform = tileInfo.transform = tileInfo.transform || this.calculateTileMatrix(tilePoint, tileInfo.z, tileInfo.extent);
        const tileTranslationMatrix = tileInfo.tileTranslationMatrix = tileInfo.tileTranslationMatrix || this.calculateTileTranslationMatrix(tilePoint, tileInfo.z);

        const pluginData = [];
        pushIn(pluginData, tileData.data);
        pushIn(pluginData, tileData.featureData);

        const plugins = this._getFramePlugins(tileData);

        plugins.forEach((plugin, idx) => {
            if (!plugin) {
                return;
            }
            const visible = this._isVisible(idx);
            if (!pluginData[idx] || !visible) {
                return;
            }
            if (!tileCache[idx]) {
                return;
            }
            const context = {
                regl: this.regl,
                layer: this.layer,
                gl: this.gl,
                sceneConfig: plugin.config.sceneConfig,
                pluginIndex: idx,
                tileCache: tileCache[idx],
                tileData: pluginData[idx],
                tileTransform,
                tileTranslationMatrix,
                tileExtent: tileData.extent,
                timestamp: this._frameTime,
                tileInfo,
                tileZoom: this['_tileZoom'],
                bloom: this._parentContext && this._parentContext.bloom
            };
            const status = plugin.paintTile(context);
            if (!this._needRetire && (status.retire || status.redraw) && plugin.supportRenderMode('taa')) {
                this._needRetire = true;
            }
            if (status.redraw) {
                //let plugin to determine when to redraw
                this.setToRedraw();
            }
        });
        this.setCanvasUpdated();
    }

    _createOneTile(tileInfo, tileData) {
        if (!tileData.loadTime || tileData._empty) return;
        // const parentContext = this._parentContext;
        let tileCache = tileData.cache;
        if (!tileCache) {
            tileCache = tileData.cache = {};
        }
        const tilePoint = TILE_POINT.set(tileInfo.extent2d.xmin, tileInfo.extent2d.ymax);
        const tileTransform = tileInfo.transform = tileInfo.transform || this.calculateTileMatrix(tilePoint, tileInfo.z, tileData.extent);
        const tileTranslationMatrix = tileInfo.tileTranslationMatrix = tileInfo.tileTranslationMatrix || this.calculateTileTranslationMatrix(tilePoint, tileInfo.z);
        const pluginData = [];
        pushIn(pluginData, tileData.data);
        pushIn(pluginData, tileData.featureData);

        const plugins = this._getFramePlugins(tileData);

        plugins.forEach((plugin, idx) => {
            if (!plugin) {
                return;
            }
            const visible = this._isVisible(idx);
            if (!pluginData[idx] || !visible) {
                return;
            }
            if (!tileCache[idx]) {
                tileCache[idx] = {};
            }
            const context = {
                regl: this.regl,
                layer: this.layer,
                gl: this.gl,
                sceneConfig: plugin.config.sceneConfig,
                pluginIndex: idx,
                tileCache: tileCache[idx],
                tileData: pluginData[idx],
                tileTransform,
                tileTranslationMatrix,
                tileExtent: tileData.extent,
                timestamp: this._frameTime,
                tileInfo,
                tileZoom: this['_tileZoom']
            };
            const status = plugin.createTile(context);
            if (tileCache[idx].geometry) {
                //插件数据以及经转化为geometry，可以删除原始数据以节省内存
                pluginData[idx] = 1;
            }
            if (!this._needRetire && status.retire && plugin.supportRenderMode('taa')) {
                this._needRetire = true;
            }
        });
    }

    _consumeTileQueue() {
        let count = 0;
        const limit = this.layer.options['meshLimitPerFrame'];
        const queue = this._tileQueue;
        while (queue.length && count < limit) {
            const { tileData, tileInfo } = queue.shift();
            this.onTileLoad(tileData, tileInfo);
            this._createOneTile(tileInfo, tileData);
            count++;
        }
    }

    pick(x, y, options) {
        const hits = [];
        const plugins = this._getFramePlugins();
        plugins.forEach((plugin, idx) => {
            if (!plugin) {
                return;
            }
            const visible = this._isVisible(idx);
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
            const plugins = this._getAllPlugins();
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
        }
        this._getFramePlugins().forEach(plugin => {
            if (!plugin) {
                return;
            }
            plugin.resize(canvas.width, canvas.height);
        });
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
        }
        if (super.onRemove) super.onRemove();
        this._clearPlugin();
    }

    _clearPlugin() {
        this._getFramePlugins().forEach(plugin => {
            plugin.remove();
        });
        this.plugins = [];
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
            featurePlugins.push(plugin);
            return plugin;
        });
        this.plugins = plugins;
        this.featurePlugins = featurePlugins;
        this.layer.fire('pluginsinited');
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

    _isVisible(/*idx*/) {
        // const styles = this.layer.getCompiledStyle();
        // if (!styles[idx]) return true;
        // const symbol = styles[idx].symbol;
        // if (!symbol) return true;
        // // const z = this.layer.getMap().getZoom();
        // // const v = evaluate(symbol['visible'], null, z);
        // // return v !== false;
        // return symbol.visible !== false;
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
        const pluginIdx = idx;
        const plugins = this._getFramePlugins();
        if (!plugins[pluginIdx] || plugins[pluginIdx].painter && !plugins[pluginIdx].painter.isVisible()) {
            return;
        }
        plugins[pluginIdx].outline(fbo, featureIds);
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
}

VectorTileLayerRenderer.include({
    calculateTileMatrix: function () {
        const v0 = new Array(3);
        const v1 = new Array(3);
        const v2 = new Array(3);
        return function (point, z, EXTENT) {
            const glScale = this.getTileGLScale(z);
            const tilePos = point;
            const tileSize = this.layer.getTileSize();
            const posMatrix = mat4.identity([]);
            //TODO 计算zScale时，zoom可能和tileInfo.z不同
            mat4.scale(posMatrix, posMatrix, vec3.set(v0, glScale, glScale, this._zScale));
            mat4.translate(posMatrix, posMatrix, vec3.set(v1, tilePos.x, tilePos.y, 0));
            mat4.scale(posMatrix, posMatrix, vec3.set(v2, tileSize.width / EXTENT, -tileSize.height / EXTENT, 1));

            return posMatrix;
        };
    }(),

    calculateTileTranslationMatrix: function () {
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
            polygonFill: '#00f',
            polygonOpacity: 0.6
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

function hasMesh(plugin) {
    const meshes = plugin.painter && plugin.painter.scene && plugin.painter.scene.getMeshes();
    return meshes && meshes.length;
}
