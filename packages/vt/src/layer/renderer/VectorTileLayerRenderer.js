import * as maptalks from 'maptalks';
import { mat4, vec3, createREGL } from '@maptalks/gl';
import WorkerConnection from './worker/WorkerConnection';
import { EMPTY_VECTOR_TILE } from '../core/Constant';
import DebugPainter from './utils/DebugPainter';

const DEFAULT_PLUGIN_ORDERS = ['native-point', 'native-line', 'fill'];

class VectorTileLayerRenderer extends maptalks.renderer.TileLayerCanvasRenderer {

    constructor(layer) {
        super(layer);
        this._initPlugins();
        this.ready = false;
        this._styleCounter = 0;
    }

    getWorkerConnection() {
        return this._workerConn;
    }

    setStyle() {
        if (this._workerConn) {
            this._styleCounter++;
            this.clear();
            this._clearPlugin();
            this._workerConn.updateStyle(this.layer.getStyle(), err => {
                if (err) throw new Error(err);
                this._initPlugins();
                this.setToRedraw();
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

    updateSceneConfig(idx, sceneConfig) {
        const plugins = this.plugins;
        if (!plugins) {
            return;
        }

        plugins[idx].config = this.layer.getStyle()[idx];
        plugins[idx].updateSceneConfig({
            sceneConfig : sceneConfig
        });
        this.setToRedraw();
    }

    updateSymbol(idx) {
        const plugins = this.plugins;
        if (!plugins) {
            return;
        }
        const plugin = plugins[idx];
        plugin.updateSymbol();
        this.setToRedraw();
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

    createContext() {
        const inGroup = this.canvas.gl && this.canvas.gl.wrap;
        if (inGroup) {
            this.gl = this.canvas.gl.wrap();
        }
        this._createREGLContext();
        if (inGroup) {
            this.canvas.pickingFBO = this.canvas.pickingFBO || this.regl.framebuffer(this.canvas.width, this.canvas.height);
        }
        this.pickingFBO = this.canvas.pickingFBO || this.regl.framebuffer(this.canvas.width, this.canvas.height);
        // this._quadStencil = new maptalks.renderer.QuadStencil(this.gl, new Uint16Array([
        //     0, EXTENT, 0,
        //     0, 0, 0,
        //     EXTENT, EXTENT, 0,
        //     EXTENT, 0, 0
        // ]), layer.options['stencil'] === 'debug');
        this._debugPainter = new DebugPainter(this.regl, this.canvas);
        this._prepareWorker();
    }

    _createREGLContext() {
        const layer = this.layer;

        const attributes = layer.options.glOptions || {
            alpha: true,
            depth: true,
            antialias : this.layer.options['antialias']
            // premultipliedAlpha : false
        };
        attributes.preserveDrawingBuffer = true;
        attributes.stencil = true;
        this.glOptions = attributes;
        this.gl = this.gl || this._createGLContext(this.canvas, attributes);
        // console.log(this.gl.getParameter(this.gl.MAX_VERTEX_UNIFORM_VECTORS));
        this.regl = createREGL({
            gl : this.gl,
            attributes,
            extensions : [
                'ANGLE_instanced_arrays',
                'OES_texture_float',
                'OES_texture_float_linear',
                'OES_element_index_uint',
                'OES_standard_derivatives'
            ],
            optionalExtensions : layer.options['glExtensions'] || ['WEBGL_draw_buffers', 'EXT_shader_texture_lod']
        });
    }

    _prepareWorker() {
        if (!this._workerConn) {
            this._workerConn = new WorkerConnection('@maptalks/vt', this.layer);
        }
        const workerConn = this._workerConn;
        //setTimeout in case layer's style is set to layer after layer's creating.
        workerConn.addLayer(err => {
            if (err) throw err;
            if (!this.layer) return;
            this.ready = true;
            this.layer.fire('workerready');
            this.setToRedraw();
        });
    }

    clearCanvas() {
        super.clearCanvas();
        //这里必须通过regl来clear，如果直接调用webgl context的clear，则brdf的texture会被设为0
        if (this.glOptions.depth) {
            this.regl.clear({
                color: this.layer.options['background'],
                depth: 1,
                stencil: 0
            });
        } else {
            this.regl.clear({
                color: this.layer.options['background'],
                stencil: 0
            });
        }
    }

    isDrawable() {
        return true;
    }

    checkResources() {
        const result = [];
        return result;
    }

    draw(timestamp) {
        const layer = this.layer;
        this.prepareCanvas();
        if (!this.ready || !layer.ready ||
            !layer.isDefaultRender() && (!this.plugins || !this.plugins.length)) {
            this.completeRender();
            return;
        }
        if (layer.options['collision']) {
            layer.clearCollisionIndex();
            layer.clearBackgroundCollisionIndex();
        }
        this._frameTime = timestamp;
        this._zScale = this._getCentiMeterScale(this.getMap().getGLZoom()); // scale to convert meter to gl point
        this._startFrame(timestamp);
        super.draw(timestamp);
        this._endFrame(timestamp);
        if (layer.options['debug']) {
            const mat = [];
            const projViewMatrix = this.getMap().projViewMatrix;
            for (const p in this.tilesInView) {
                const transform = this.tilesInView[p].info.transform;
                const extent = this.tilesInView[p].image.extent;
                if (transform && extent) this._debugPainter.draw(mat4.multiply(mat, projViewMatrix, transform), extent);
            }
        }
    }

    getFrameTimestamp() {
        return this._frameTime;
    }

    drawOnInteracting(event, timestamp) {
        if (!this.ready) {
            this.completeRender();
            return;
        }
        this.draw(timestamp);
    }

    loadTile(tileInfo) {
        const map = this.getMap();
        const layer = this.layer;
        const useDefault = layer.isDefaultRender();

        const glScale = map.getGLScale(tileInfo.z);
        this._workerConn.loadTile({ tileInfo, glScale, zScale : this._zScale }, (err, data) => {
            if (err) {
                if (err.status && err.status === 404) {
                    //只处理404
                    this.onTileError(EMPTY_VECTOR_TILE, tileInfo);
                }
                return;
            }
            if (!data) {
                this.onTileLoad({ _empty : true }, tileInfo);
                return;
            }
            if (data.canceled) {
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
            //iterate plugins
            for (let i = 0; i < data.data.length; i++) {
                const pluginData = data.data[i]; // { data, featureIndex }
                if (!pluginData || !pluginData.styledFeatures.length) {
                    continue;
                }
                const { style, isUpdated } = this._updatePluginIfNecessary(i, pluginData);
                if (isUpdated) { needCompile = true; }

                if (useDefault) {
                    layers.push(pluginData.data.layer);
                }

                const symbol = style.symbol;
                const feaIndexes = pluginData.styledFeatures;
                //pFeatures是一个和features相同容量的数组，只存放有样式的feature数据，其他为undefined
                //这样featureIndexes中的序号能从pFeatures取得正确的数据
                const pFeatures = new Array(features.length);
                if (features.length) {
                    //[feature index, style index]
                    for (let ii = 0, ll = feaIndexes.length; ii < ll; ii++) {
                        let feature = features[feaIndexes[ii]];
                        if (layer.options['features'] === 'id' && layer.getFeature) {
                            feature = layer.getFeature(feature);
                            feature.layer = i;
                        }
                        pFeatures[feaIndexes[ii]] = {
                            feature,
                            symbol
                        };
                    }
                }
                delete pluginData.styledFeatures;
                pluginData.features = pFeatures;
            }
            if (needCompile) {
                layer._compileStyle();
            }

            const tileZoom = tileInfo.z;
            const schema = this.layer.getDataSchema(tileZoom);
            this._updateSchema(schema, data.schema);

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
            this.onTileLoad(data, tileInfo);
        });
        return {};
    }

    _updateSchema(target, source) {
        const useDefault = this.layer.isDefaultRender();
        for (const layer in source) {
            if (!target[layer]) {
                target[layer] = {
                    types: source[layer].types,
                    properties: {}
                };
                if (useDefault && this._layerPlugins) {
                    target[layer].symbol = this._layerPlugins[layer].symbol;
                }
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

    _updatePluginIfNecessary(i, pluginData) {
        const layer = this.layer;
        let isUpdated = false;
        let style;
        const layerStyles = layer.getStyle();
        const useDefault = layer.isDefaultRender();
        if (useDefault) {
            //没有定义任何图层，采用图层默认的plugin渲染
            const layerId = pluginData.data.layer;
            const { updateAction, symbol, renderPlugin } = this._updateDefaultPluginPerLayer(pluginData.data.type, layerId);
            if (updateAction) {
                style = {
                    filter: ['==', '$layer', layerId],
                    symbol,
                    renderPlugin
                };
                if (updateAction === 'add') {
                    layerStyles.push(style);
                } else {
                    for (let ii = 0; ii < layerStyles.length; ii++) {
                        if (layerStyles[ii].filter[2] === layerId) {
                            layerStyles[ii] = style;
                            break;
                        }
                    }
                }
                isUpdated = true;
            } else {
                for (let ii = 0; ii < layerStyles.length; ii++) {
                    if (layerStyles[ii].filter[2] === layerId) {
                        style = layerStyles[ii];
                        break;
                    }
                }
            }
        } else {
            style = layerStyles[i];
            if (!style.symbol) {
                isUpdated = true;
                const { plugin, symbol, renderPlugin } = this._getDefaultRenderPlugin(pluginData.data.type);
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
            if (tileData) {
                plugins = tileData.layers.map(layer => this._layerPlugins[layer].plugin);
            } else {
                plugins = Object.values(this._layerPlugins).map(config => config.plugin);
            }
        }
        return plugins;
    }

    _getAllPlugins() {
        if (this.layer.isDefaultRender() && this._layerPlugins) {
            return Object.values(this._layerPlugins).map(config => config.plugin);
        }
        return this.plugins;
    }

    _startFrame(timestamp) {
        const plugins = this._getFramePlugins();
        plugins.forEach((plugin, idx) => {
            const visible = this._isVisible(idx);
            if (!plugin || !visible) {
                return;
            }
            plugin.startFrame({
                regl : this.regl,
                layer : this.layer,
                gl : this.gl,
                sceneConfig : plugin.config ? plugin.config.sceneConfig : null,
                pluginIndex : idx,
                timestamp
            });
        });
        this.getMap().collisionFrameTime = 0;
    }

    _endFrame(timestamp) {
        const cameraPosition = this.getMap().cameraPosition;
        const plugins = this._getFramePlugins();
        plugins.forEach((plugin, idx) => {
            const visible = this._isVisible(idx);
            if (!plugin || !visible) {
                return;
            }
            const status = plugin.endFrame({
                regl : this.regl,
                layer : this.layer,
                gl : this.gl,
                sceneConfig : plugin.config.sceneConfig,
                pluginIndex : idx,
                cameraPosition,
                quadStencil : this._quadStencil,
                timestamp
            });
            if (status && status.redraw) {
                //let plugin to determine when to redraw
                this.setToRedraw();
            }
        });
    }

    drawTile(tileInfo, tileData) {
        if (!tileData.loadTime || tileData._empty) return;
        let tileCache = tileData.cache;
        if (!tileCache) {
            tileCache = tileData.cache = {};
        }
        const tileTransform = tileInfo.transform = tileInfo.transform || this.calculateTileMatrix(tileInfo.point, tileInfo.z, tileData.extent);
        const pluginData = tileData.data;

        const plugins = this._getFramePlugins(tileData);

        plugins.forEach((plugin, idx) => {
            const visible = this._isVisible(idx);
            if (!pluginData[idx] || !plugin || !visible) {
                return;
            }
            if (!tileCache[idx]) {
                tileCache[idx] = {};
            }
            const context = {
                regl : this.regl,
                layer : this.layer,
                gl : this.gl,
                sceneConfig : plugin.config.sceneConfig,
                pluginIndex : idx,
                tileCache : tileCache[idx],
                tileData : pluginData[idx],
                tileCenter: tileInfo.point,
                tileTransform,
                tileExtent : tileData.extent,
                timestamp : this._frameTime,
                tileInfo,
                tileZoom : this['_tileZoom']
            };
            const status = plugin.paintTile(context);
            //插件数据以及经转化为geometry，可以删除原始数据以节省内存
            pluginData[idx] = 1;
            if (status && status.redraw) {
                //let plugin to determine when to redraw
                this.setToRedraw();
            }
        });
        this.setCanvasUpdated();
    }

    pick(x, y, options) {
        if (maptalks['Browser']['retina']) {
            const dpr = this.getMap().getDevicePixelRatio();
            x *= dpr;
            y *= dpr;
        }
        const hits = [];
        const plugins = this._getFramePlugins();
        plugins.forEach((plugin, idx) => {
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
                    if (plugin) {
                        plugin.deleteTile({
                            regl : this.regl,
                            layer : this.layer,
                            gl : this.gl,
                            tileCache : tile.image.cache ? tile.image.cache[idx] : {},
                            tileInfo : tile.info,
                            tileData : tile.image
                        });
                    }
                });
            }
        }
        //ask plugin to clear caches
        super.deleteTile(tile);
    }

    abortTileLoading(tileImage, tileInfo) {
        if (this._workerConn && tileInfo && tileInfo.url) {
            this._workerConn.abortTile(tileInfo.url);
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
        const size = new maptalks.Size(canvas.width, canvas.height);
        this._getFramePlugins().forEach(plugin => {
            if (!plugin) {
                return;
            }
            plugin.resize(size);
        });
    }

    onRemove() {
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
        if (this._quadStencil) {
            this._quadStencil.remove();
        }
        if (this._debugPainter) {
            this._debugPainter.remove();
        }
        if (super.onRemove) super.onRemove();
        this._clearPlugin();
    }

    _clearPlugin() {
        this._getFramePlugins().forEach(plugin => {
            plugin.remove();
        });
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
        const styles = this.layer.getStyle() || [];
        if (!Array.isArray(styles)) {
            return;
        }
        this.plugins = styles.map((style, idx) => {
            const config = style.renderPlugin;
            if (!config) {
                return null;
            }
            if (!config.type) {
                throw new Error('invalid plugin type for style at ' + idx);
            }
            return this._createRenderPlugin(config);
        });
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
            } catch (e) {}
            if (context) {
                break;
            }
        }
        return context;
        /* eslint-enable no-empty */
    }

    _getCentiMeterScale(z) {
        const map = this.getMap();
        const p = map.distanceToPoint(1000, 0, z).x;
        return p / 1000 / 100;
    }

    debugFBO(id, fbo) {
        const canvas = document.getElementById(id);
        const width = fbo.width, height = fbo.height;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const pixels = this.regl.read({
            framebuffer : fbo
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

    _updateDefaultPluginPerLayer(type, layer) {
        let layerPlugins = this._layerPlugins;
        if (!layerPlugins) {
            layerPlugins = this._layerPlugins = {};
        }
        let updateAction = false;
        if (!layerPlugins[layer]) {
            layerPlugins[layer] = this._getDefaultRenderPlugin(type);
            updateAction = 'add';
        } else {
            //当图层数据存在类型降级(面=>线=>点)时，则更新默认插件到低级别上
            const current = layerPlugins[layer].renderPlugin.type;
            if (DEFAULT_PLUGIN_ORDERS.indexOf(current) > DEFAULT_PLUGIN_ORDERS.indexOf(type)) {
                layerPlugins[layer] = this._getDefaultRenderPlugin(type);
                updateAction = 'update';
            }
        }
        const { plugin, symbol, renderPlugin } = layerPlugins[layer];
        return {
            updateAction,
            plugin,
            symbol,
            renderPlugin
        };
    }
    //TODO 可以把图层合并为只用这三个默认插件绘制
    _getDefaultRenderPlugin(type) {
        let renderPlugin;
        switch (type) {
        case 'native-line':
            renderPlugin = {
                type: 'native-line',
                dataConfig: { type: 'native-line', only2D: true },
                sceneConfig: { depthRange: [0.9998, 0.9998] }
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
                sceneConfig: { depthRange: [0.9999, 0.9999] }
            };
            break;
        default:
            renderPlugin = null;
        }
        const symbol = getDefaultSymbol(type);
        const plugin = this._createRenderPlugin(renderPlugin);
        return {
            plugin, symbol, renderPlugin
        };
    }

    _isVisible(idx) {
        const styles = this.layer.getCompiledStyle();
        if (!styles[idx]) return true;
        const symbol = styles[idx].symbol;
        if (!symbol) return true;
        const z = this.layer.getMap().getZoom();
        const v = evaluate(symbol['visible'], null, z);
        return v !== false;
    }

    isEnableWorkAround(key) {
        if (key === 'win-intel-gpu-crash') {
            return this.layer.options['workarounds']['win-intel-gpu-crash'] && isWinIntelGPU(this.gl);
        }
        return false;
    }
}

VectorTileLayerRenderer.prototype.calculateTileMatrix = function () {
    const v0 = new Array(3);
    const v1 = new Array(3);
    const v2 = new Array(3);
    return function (point, z, EXTENT) {
        const map = this.getMap();
        const glScale = map.getGLScale(z);
        const tilePos = point;
        const tileSize = this.layer.getTileSize();
        const posMatrix = mat4.identity([]);
        //TODO 计算zScale时，zoom可能和tileInfo.z不同
        mat4.scale(posMatrix, posMatrix, vec3.set(v0, glScale, glScale, this._zScale));
        mat4.translate(posMatrix, posMatrix, vec3.set(v1, tilePos.x, tilePos.y, 0));
        mat4.scale(posMatrix, posMatrix, vec3.set(v2, tileSize.width / EXTENT, tileSize.height / EXTENT, 1));

        return posMatrix;
    };
}();

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
            lineColor: '#fff',
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
