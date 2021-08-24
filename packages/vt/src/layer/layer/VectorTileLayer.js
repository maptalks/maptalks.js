import * as maptalks from 'maptalks';
import VectorTileLayerRenderer from '../renderer/VectorTileLayerRenderer';
import { extend, compileStyle, isNil, isString, hasOwn } from '../../common/Util';
import { compress, uncompress } from './Compress';
import Ajax from '../../worker/util/Ajax';
import Color from 'color';

const defaultOptions = {
    renderer: 'gl',
    fadeAnimation: false,
    altitudeProperty: 'altitude',
    forceRenderOnZooming: true,
    forceRenderOnMoving: true,
    forceRenderOnRotating: true,
    clipByPitch: false,
    zoomBackground: true,
    tileSize: [512, 512],
    tileSystem: [1, -1, -6378137 * Math.PI, 6378137 * Math.PI],
    stencil: false,
    features: true,
    schema: false,
    cascadeTiles: true,
    collision: true,
    picking: true,
    pickingPoint: false,
    pickingGeometry: false,
    //每帧每个瓦片最多能绘制的sdf数量
    glyphSdfLimitPerFrame: 15,
    //zooming或zoom fading时，每个瓦片最多能绘制的box(icon或text)数量
    boxLimitOnZoomout: 7,
    maxCacheSize: 72,
    antialias: false,
    iconErrorUrl: null,
    collisionFrameLimit: 1.5,
    //是否开启无style时的默认绘制功能
    defaultRendering: true,
    //允许用户调整文字的gamma清晰度
    textGamma: 1,
    //是否限制每帧的 tile mesh creation
    tileMeshCreationLimitPerFrame: 0,
    maxIconSize: 256,
    workarounds: {
        //#94, text rendering crashes on windows with intel gpu
        'win-intel-gpu-crash': true
    },
    pyramidMode: 1,
    styleScale: 1,
    spatialReference: null, //'preset-vt-3857', preset-vt-4326'
};

/**
 * Style:
 * [
 *  {
 *     renderPlugin : { ... },
 *     filter : [],
 *     symbol : { ... }
 *  }
 * ]
 */
class VectorTileLayer extends maptalks.TileLayer {

    constructor(id, options) {
        super(id, options);
        // if (options.spatialReference === undefined) {
        //     throw new Error(`options.spatialReference must be set for VectorTileLayer(${id}), possible values: null(using map's), preset-vt-3857, or a customized one.`);
        // }
        this.VERSION = VectorTileLayer.VERSION;
        const style = options && options.style;
        this.setStyle(style);
    }

    onAdd() {
        const map = this.getMap();
        const sr = this.getSpatialReference();
        const code = sr.toJSON().projection;
        const mapCode = map.getSpatialReference().toJSON().projection;
        if ((code && code.toLowerCase()) !== (mapCode && mapCode.toLowerCase())) {
            throw new Error(`VectorTileLayer's projection(${code}) must be the same with map(${mapCode}).`);
        }
    }

    onConfig(conf) {
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.updateOptions(conf);
        }
    }

    getWorkerOptions() {
        const map = this.getMap();
        return {
            debug: this.options['debug'],
            debugTile: this.options['debugTile'],
            altitudeProperty: this.options['altitudeProperty'],
            tileSize: this.options['tileSize'],
            baseRes: map.getResolution(map.getGLZoom()),
            //default render时，this._vtStyle有可能被default render设值
            style: this.isDefaultRender() ? { style: [], featureStyle: [] } : this._getComputedStyle(),
            features: this.options.features,
            schema: this.options.schema,
            pickingGeometry: this.options['pickingGeometry']
        };
    }

    setStyle(style) {
        if (isString(style)) {
            const url = style;
            const endIndex = url.lastIndexOf('/');
            const prefix = endIndex < 0 ? '.' : url.substring(0, endIndex);
            const root = prefix;
            this.ready = false;
            Ajax.getJSON(url, (err, json) => {
                if (err) {
                    this.setStyle([]);
                    throw err;
                }
                this.setStyle({
                    $root: root,
                    style: json
                });
                this.options['style'] = url;
            });
            return this;
        }
        this.options['style'] = style;
        if (style && (style['$root'] || style['$iconset'])) {
            let root = style['$root'];
            let iconset = style['$iconset'];
            if (root && root[root.length - 1] === '/') {
                root = root.substring(0, root.length - 1);
            }
            if (iconset && iconset[iconset.length - 1] === '/') {
                iconset = iconset.substring(0, iconset.length - 1);
            }
            this._replacer = function replacer(match) {
                if (match === '{$root}') {
                    return root;
                } else if (match === '{$iconset}') {
                    return iconset;
                }
                return null;
            };
        }
        this.ready = true;
        style = style || [];
        if (Array.isArray(style)) {
            style = { style };
        } else if (style.renderPlugin) {
            style = { style: style };
        }
        style = JSON.parse(JSON.stringify(style));
        style = uncompress(style);
        this._originFeatureStyle = style['featureStyle'] || [];
        this._featureStyle = parseFeatureStyle(style['featureStyle']);
        this._vtStyle = style['style'] || [];
        const background = style.background || {};
        this._background = {
            enable: background.enable || false,
            color: unitColor(background.color) || [0, 0, 0, 0],
            opacity: getOrDefault(background.opacity, 1),
            patternFile: background.patternFile,
            depthRange: background.depthRange
        };

        this.validateStyle();
        if (this._replacer) {
            this._parseStylePath();
        }
        this._compileStyle();
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.setStyle();
        }
        /**
         * setstyle event.
         *
         * @event VectorTileLayer#setstyle
         * @type {Object}
         * @property {String} type - setstyle
         * @property {VectorTileLayer} target - layer
         * @property {Object|Object[]} style - style to set
         */
        this.fire('setstyle', {
            'style': this.getStyle(),
            'computedStyle': this.getComputedStyle()
        });
        return this;
    }

    /**
     * 获取图层的polygonOffsetCount
     * 用于GroupGLLayer全局管理polygonOffset
     */
    getPolygonOffsetCount() {
        const renderer = this.getRenderer();
        if (!renderer) {
            return 0;
        }
        return renderer.getPolygonOffsetCount();
    }

    /**
     * 获取图层的polygonOffset
     * 用于GroupGLLayer全局管理polygonOffset
     */
    getPolygonOffset() {
        return this._polygonOffset || 0;
    }

    setPolygonOffset(offset, total) {
        this._polygonOffset = offset;
        this._totalPolygonOffset = total;
        return this;
    }

    getTotalPolygonOffset() {
        return this._totalPolygonOffset;
    }

    outlineAll() {
        const renderer = this.getRenderer();
        if (!renderer) {
            return this;
        }
        renderer.outlineAll();
        return this;
    }

    outline(idx, featureIds) {
        const renderer = this.getRenderer();
        if (!renderer) {
            return this;
        }
        renderer.outline(idx, featureIds);
        return this;
    }

    outlineBatch(idx) {
        const renderer = this.getRenderer();
        if (!renderer) {
            return this;
        }
        renderer.outlineBatch(idx);
        return this;
    }

    cancelOutline() {
        const renderer = this.getRenderer();
        if (!renderer) {
            return this;
        }
        renderer.cancelOutline();
        return this;
    }

    _parseStylePath() {
        maptalks.Util.convertStylePath(this._vtStyle, this._replacer);
        maptalks.Util.convertStylePath(this._featureStyle, this._replacer);
    }


    updateSceneConfig(idx, sceneConfig) {
        return this._updateSceneConfig(0, idx, sceneConfig);
    }

    updateFeatureSceneConfig(idx, styleIdx, sceneConfig) {
        return this._updateSceneConfig(1, idx, sceneConfig, styleIdx);
    }

    _updateSceneConfig(type, idx, sceneConfig, styleIdx) {
        const styles = this._getTargetStyle(type);
        if (!styles) {
            return this;
        }
        let renderIdx = idx;
        extend(styles[idx].renderPlugin.sceneConfig, sceneConfig);
        let computedSceneConfig;
        if (styleIdx !== undefined) {
            checkFeaStyleExist(this._originFeatureStyle, idx, styleIdx);
            renderIdx = this._originFeatureStyle[idx].style[styleIdx]._renderIdx;
            computedSceneConfig = styles[renderIdx].renderPlugin.sceneConfig;
        } else {
            checkStyleExist(styles, idx);
            computedSceneConfig = styles[idx].renderPlugin.sceneConfig;
        }
        extend(computedSceneConfig, sceneConfig);

        if (Array.isArray(this.options.style)) {
            extend(this.options.style[idx].renderPlugin.sceneConfig, sceneConfig);
        } else {
            const styles = this._getTargetStyle(type, this.options.style);
            let renderPlugin;
            if (styleIdx !== undefined) {
                checkFeaStyleExist(styles, idx, styleIdx);
                renderPlugin = styles[idx].style[styleIdx].renderPlugin;
            } else {
                checkStyleExist(styles, idx);
                renderPlugin = styles[idx].renderPlugin;
            }
            if (!renderPlugin.sceneConfig) {
                renderPlugin.sceneConfig = {};
            }
            extend(renderPlugin.sceneConfig, sceneConfig);
        }

        const renderer = this.getRenderer();
        if (renderer) {
            renderer.updateSceneConfig(type, renderIdx, sceneConfig);
        }
        if (type === 0) {
            this.fire('updatesceneconfig', { index: idx, sceneConfig });
        } else if (type === 1) {
            this.fire('updatefeaturesceneconfig', { index: idx, styleIdx, sceneConfig });
        }
        return this;
    }

    updateDataConfig(idx, dataConfig) {
        return this._updateDataConfig(0, idx, dataConfig);
    }

    updateFeatureDataConfig(idx, styleIdx, dataConfig) {
        return this._updateDataConfig(1, idx, dataConfig, styleIdx);
    }

    _updateDataConfig(type, idx, dataConfig, styleIdx) {
        const styles = this._getTargetStyle(type);
        if (!styles) {
            return this;
        }
        let rendererIdx = idx;
        let computedDataConfig;
        if (styleIdx !== undefined) {
            checkFeaStyleExist(this._originFeatureStyle, idx, styleIdx);
            rendererIdx = this._originFeatureStyle[idx].style[styleIdx]._renderIdx;
            computedDataConfig = styles[rendererIdx].renderPlugin.dataConfig;
        } else {
            checkStyleExist(styles, idx);
            computedDataConfig = styles[idx].renderPlugin.dataConfig;
        }
        const old = extend({}, computedDataConfig);
        extend(computedDataConfig, dataConfig);
        if (Array.isArray(this.options.style)) {
            extend(this.options.style[idx].renderPlugin.dataConfig, dataConfig);
        } else {
            const styles = this._getTargetStyle(type, this.options.style);
            let renderPlugin;
            if (styleIdx !== undefined) {
                checkFeaStyleExist(styles, idx, styleIdx);
                renderPlugin = styles[idx].style[styleIdx].renderPlugin;
            } else {
                checkStyleExist(styles, idx);
                renderPlugin = styles[idx].renderPlugin;
            }
            if (!renderPlugin.dataConfig) {
                renderPlugin.dataConfig = {};
            }
            extend(renderPlugin.dataConfig, dataConfig);
        }

        const renderer = this.getRenderer();
        if (renderer) {
            renderer.updateDataConfig(type, rendererIdx, dataConfig, old);
        }
        if (type === 0) {
            this.fire('updatedataconfig', { index: idx, dataConfig });
        } else if (type === 1) {
            this.fire('updatefeaturedataconfig', { index: idx, styleIdx, dataConfig });
        }
        return this;
    }

    updateSymbol(idx, symbol) {
        return this._updateSymbol(0, idx, symbol);
    }

    updateFeatureSymbol(idx, feaStyleIdx, symbol) {
        return this._updateSymbol(1, idx, symbol, feaStyleIdx);
    }

    _updateSymbol(type, idx, symbol, feaStyleIdx) {
        const styles = this._getTargetStyle(type);
        if (!styles) {
            return this;
        }
        let rendererIdx = idx;
        if (feaStyleIdx !== undefined) {
            checkFeaStyleExist(this._originFeatureStyle, idx, feaStyleIdx);
            rendererIdx = this._originFeatureStyle[idx].style[feaStyleIdx]._renderIdx;
        }
        const style = styles[rendererIdx];
        if (!style) {
            throw new Error(`No style defined at ${idx}`);
        }

        const self = this;
        const replacer = this._replacer;
        function update(symbol, target, index) {
            if (!symbol) {
                return false;
            }
            if (replacer) {
                symbol = JSON.parse(JSON.stringify(symbol));
                maptalks.Util.parseSymbolPath(symbol, replacer);
            }
            const props = Object.keys(symbol);
            let needRefresh = false;
            for (let i = 0; i < props.length; i++) {
                const key = props[i];
                if (isPropFunction(target[key]) || isPropFunction(symbol[key])) {
                    needRefresh = true;
                    break;
                }
            }
            for (const p in symbol) {
                if (hasOwn(symbol, p)) {
                    if (maptalks.Util.isObject(symbol[p]) && !Array.isArray(symbol[p]) && !symbol[p].stops) {
                        //对象类型的属性则extend
                        if (!target[p]) {
                            target[p] = {};
                        }
                        extend(target[p], symbol[p]);
                    } else {
                        target[p] = symbol[p];
                    }
                }
            }
            let styles = self.options.style;
            if (!Array.isArray(styles)) {
                styles = self._getTargetStyle(type, self.options.style);
            }
            const copy = JSON.parse(JSON.stringify(target));
            if (feaStyleIdx !== undefined) {
                checkFeaStyleExist(styles, idx, feaStyleIdx);
                if (index === undefined) {
                    styles[idx].style[feaStyleIdx].symbol = copy;
                } else {
                    styles[idx].style[feaStyleIdx].symbol[index] = copy;
                }

            } else {
                checkStyleExist(styles, idx);
                if (index === undefined) {
                    styles[idx].symbol = copy;
                } else {
                    styles[idx].symbol[index] = copy;
                }
            }

            return needRefresh;
        }

        const renderer = this.getRenderer();
        if (!renderer) {
            //layer还没有渲染，直接更新style并返回
            update();
            this._compileStyle();
            return this;
        }

        let needRefresh = false;
        const target = style.symbol;
        if (Array.isArray(symbol)) {
            for (let i = 0; i < symbol.length; i++) {
                const refresh = update(symbol[i], target[i], i);
                if (refresh) {
                    needRefresh = refresh;
                }
            }
        } else {
            update(symbol, target);
        }

        this._compileStyle();
        if (needRefresh) {
            renderer.setStyle();
        } else {
            needRefresh = renderer.updateSymbol(type, rendererIdx, symbol);
            if (needRefresh) {
                renderer.setStyle();
            }
        }
        if (type === 0) {
            this.fire('updatesymbol', { index: idx, symbol });
        } else if (type === 1) {
            this.fire('updatefeaturesymbol', { index: idx, featureStyleIndex: feaStyleIdx, symbol });
        }
        return this;
    }

    _getTargetStyle(type, allStyles) {
        if (allStyles) {
            const styles = type === 0 ? allStyles.style : allStyles.featureStyle;
            return styles;
        } else {
            return type === 0 ? this._vtStyle : this._featureStyle;
        }
    }

    isDefaultRender() {
        return !!this._isDefaultRender && this.options['defaultRendering'];
    }

    validateStyle() {
        this._isOnly2D = true;
        this._isDefaultRender = false;
        let styles = this._vtStyle;
        if (!this.options['style']) {
            this._isDefaultRender = true;
            styles = this._vtStyle = [];
        }
        if (!Array.isArray(styles)) {
            styles = this._vtStyle = [styles];
        }
        for (let i = 0; i < styles.length; i++) {
            let filter = styles[i].filter;
            if (filter && filter.value) {
                filter = filter.value;
            }
            if (filter !== undefined &&
                filter !== 'default' &&
                filter !== true &&
                !Array.isArray(filter)) {
                throw new Error(`Invalid filter at ${i} : ${JSON.stringify(filter)}`);
            }
            const dataConfig = styles[i].renderPlugin.dataConfig;
            if (!dataConfig['only2D']) {
                this._isOnly2D = false;
            }
            //TODO 如果定义了renderPlugin就必须定义symbol
        }
    }

    getStyle() {
        if (!this.options.style) {
            return null;
        }
        return JSON.parse(JSON.stringify(this.options.style));
    }

    getGroundConfig() {
        if (!this._backgroundConfig) {
            this._backgroundConfig = {
                enable: true,
                renderPlugin: {
                    type: 'fill',
                    sceneConfig: {
                    }
                },
                symbol: {
                    polygonFill: [0, 0, 0, 0],
                    polygonOpacity: 1
                }
            };
        }
        const background = this._getComputedStyle().background || {};
        this._backgroundConfig.enable = background.enable;
        this._backgroundConfig.symbol.polygonFill = background.color;
        this._backgroundConfig.symbol.polygonOpacity = background.opacity;
        this._backgroundConfig.symbol.polygonPatternFile = background.patternFile;
        this._backgroundConfig.renderPlugin.sceneConfig.depthRange = background.depthRange;
        return this._backgroundConfig;
    }

    getComputedStyle() {
        return JSON.parse(JSON.stringify(this._getComputedStyle()));
    }

    _getComputedStyle() {
        return {
            background: this._background,
            style: this._vtStyle || [],
            featureStyle: this._featureStyle || []
        };
    }

    isOnly2D() {
        return this._isOnly2D;
    }

    getCompiledStyle() {
        return {
            style: this._compiledStyles || [],
            featureStyle: this._compiledFeatureStyles || []
        };
    }

    /**
     * Identify the data on the given container point
     * @param  {maptalks.Point} point   - point to identify
     * @param  {Object} [options=null]  - options
     * @param  {Object} [options.tolerance=0] - identify tolerance in pixel
     * @param  {Object} [options.count=null]  - result count
     * @return {Object[]} data identified
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
     * Identify the data on the given container point
     * @param  {maptalks.Point} point   - point to identify
     * @param  {Object} [options=null]  - options
     * @param  {Object} [options.tolerance=0] - identify tolerance in pixel
     * @param  {Object} [options.count=null]  - result count
     * @return {Object[]} data identified
     */
    identifyAtPoint(point, options = {}) {
        const map = this.getMap();
        const renderer = this.getRenderer();
        if (!map || !renderer) {
            return [];
        }
        const dpr = map.getDevicePixelRatio();
        return renderer.pick(point.x * dpr, point.y * dpr, options);
    }

    /**
     * A separate collision index for background tiles
     * To avoid conflict with current zoom's tiles
     * @returns {CollisionIndex}
     */
    getBackgroundCollisionIndex() {
        if (!this._bgCollisionIndex) {
            this._bgCollisionIndex = new maptalks.CollisionIndex();
        }
        return this._bgCollisionIndex;
    }

    /**
     * Clear layer's background tiles collision index.
     */
    clearBackgroundCollisionIndex() {
        if (this._bgCollisionIndex) {
            this._bgCollisionIndex.clear();
        }
        return this;
    }

    /**
     * Return vector tile data's schema, including layers, properties, data types
     * Will return all zoom's schema if z is undefined
     * @param {Number} [z=undefined] - tile's zoom, optional
     * @returns {Object} data schema
     */
    getDataSchema(z) {
        if (!this._schema) {
            this._schema = {};
        }
        if (!isNil(z) && !this._schema[z]) {
            this._schema[z] = {};
        }
        if (isNil(z)) {
            return this._schema;
        }
        return this._schema[z];
    }

    onRemove() {
        super.onRemove();
    }

    static fromJSON(layerJSON) {
        if (!layerJSON || layerJSON['type'] !== 'VectorTileLayer') {
            return null;
        }

        return new VectorTileLayer(layerJSON['id'], layerJSON['options']);
    }

    _compileStyle() {
        if (this._vtStyle) {
            this._compiledStyles = compileStyle(this._vtStyle);
        }
        if (this._featureStyle) {
            this._compiledFeatureStyles = compileStyle(this._featureStyle);
        }

    }

    static registerPlugin(Plugin) {
        if (!VectorTileLayer.plugins) {
            VectorTileLayer.plugins = {};
        }
        VectorTileLayer.plugins[Plugin.type] = Plugin;
    }

    static getPlugins() {
        return VectorTileLayer.plugins || {};
    }

    static compressStyleJSON(json) {
        if (!Array.isArray(json) || !json.length) {
            return json;
        }

        return compress(json);
    }

}

VectorTileLayer.prototype['_getTileZoom'] = function (zoom) {
    zoom = Math.floor(zoom);
    return maptalks.TileLayer.prototype['_getTileZoom'].call(this, zoom);
};


VectorTileLayer.registerJSONType('VectorTileLayer');

VectorTileLayer.mergeOptions(defaultOptions);

VectorTileLayer.registerRenderer('gl', VectorTileLayerRenderer);
VectorTileLayer.registerRenderer('canvas', null);

export default VectorTileLayer;

function isPropFunction(v) {
    return !!(v && v.properties);
}

function unitColor(color) {
    if (!color) {
        return null;
    }
    if (!Array.isArray(color)) {
        color = Color(color).unitArray();
    }
    if (color.length === 3) {
        color.push(1);
    }
    return color;
}

function getOrDefault(v, defaultValue) {
    if (v === undefined || v === null) {
        return defaultValue;
    }
    return v;
}

function parseFeatureStyle(featureStyle) {
    if (!featureStyle || !Array.isArray(featureStyle)) {
        return [];
    }
    const parsed = [];
    for (let i = 0; i < featureStyle.length; i++) {
        const style = featureStyle[i].style;
        if (style && Array.isArray(style) && style.length) {
            for (let ii = 0; ii < style.length; ii++) {
                const unitStyle = extend({}, featureStyle[i], style[ii]);
                style[ii]._renderIdx = parsed.length;
                delete unitStyle.style;
                parsed.push(unitStyle);
            }
        } else {
            parsed.push(extend({}, featureStyle[i]));
        }
    }
    return parsed;
}

function checkFeaStyleExist(styles, idx, styleIdx) {
    if (!styles[idx] || !styles[idx].style || !styles[idx].style[styleIdx]) {
        throw new Error(`No plugin defined at feature style of ${idx} - ${styleIdx}`);
    }
}

function checkStyleExist(styles, idx) {
    if (!styles[idx]) {
        throw new Error(`No plugin defined at style of ${idx}`);
    }
}
