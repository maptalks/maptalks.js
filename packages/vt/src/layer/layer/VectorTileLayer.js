import * as maptalks from 'maptalks';
import VectorTileLayerRenderer from '../renderer/VectorTileLayerRenderer';
import { extend, isNil, isString, hasOwn, equalsArray } from '../../common/Util';
import { compress, uncompress } from './Compress';
import Ajax from '../../worker/util/Ajax';
import Color from 'color';
import { PackUtil } from '@maptalks/vector-packer';

const TMP_POINT = new maptalks.Point(0, 0);
const TMP_COORD = new maptalks.Coordinate(0, 0);

const defaultOptions = {
    renderer: 'gl',
    altitudeProperty: 'altitude',
    forceRenderOnZooming: true,
    forceRenderOnMoving: true,
    forceRenderOnRotating: true,
    tileSize: [512, 512],
    tileSystem: [1, -1, -6378137 * Math.PI, 6378137 * Math.PI],
    features: false,
    schema: false,
    cascadeTiles: true,
    collision: true,
    picking: true,
    pickingPoint: false,
    pickingGeometry: false,
    //每帧每个瓦片最多能绘制的sdf数量
    glyphSdfLimitPerFrame: 15,
    //zooming或zoom fading时，每个瓦片最多能绘制的box(icon或text)数量
    // boxLimitOnZoomout: 7,
    tileLimitPerFrame: 1,
    maxCacheSize: 72,
    antialias: false,
    iconErrorUrl: null,
    collisionFrameLimit: 1.5,
    //是否开启无style时的默认绘制功能
    defaultRendering: true,
    //允许用户调整文字的gamma清晰度
    textGamma: 1,
    // altas中会在四周留一个像素的空隙，所以设为254，最大尺寸的icon也刚好存入256高宽的图片中
    maxIconSize: 254,
    workarounds: {
        //#94, text rendering crashes on windows with intel gpu
        'win-intel-gpu-crash': true
    },
    pyramidMode: 1,
    styleScale: 1,
    spatialReference: null, //'preset-vt-3857', preset-vt-4326'
    enableAltitude: true,
    fadeAnimation: false,

    debugTileData: false
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

    onWorkerReady() {}

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
            baseRes: map.getGLRes(),
            //default render时，this._vtStyle有可能被default render设值
            style: this.isDefaultRender() ? { style: [], featureStyle: [] } : this._getComputedStyle(),
            features: this.options.debugTileData || this.options.features,
            schema: this.options.schema,
            pickingGeometry: this.options['pickingGeometry']
        };
    }

    setStyle(style) {
        if (style && (isString(style) || style.url)) {
            const url = style;
            const endIndex = url.lastIndexOf('/');
            const prefix = endIndex < 0 ? '.' : url.substring(0, endIndex);
            const root = prefix;
            this.ready = false;
            Ajax.getJSON(style.url ? style.url : style, style.url ? style : {}, (err, json) => {
                if (err) {
                    this.setStyle([]);
                    throw err;
                }
                let styleJSON;
                if (json.style) {
                    styleJSON = json;
                    if (!styleJSON['$root']) {
                        styleJSON['$root'] = root;
                    }
                } else {
                    styleJSON = {
                        $root: root,
                        style: json
                    }
                }
                this.options['style'] = url;
                this._setStyle(styleJSON);
            });
            return this;
        }
        this.options['style'] = style;
        this._setStyle(style);
        return this;
    }

    _setStyle(style) {
        this._pathRoot = null;
        if (style && style['$root']) {
            let root = style['$root'];
            if (root && root[root.length - 1] === '/') {
                root = root.substring(0, root.length - 1);
            }
            this._pathRoot = root;
            this._replacer = function replacer(match) {
                if (match === '{$root}') {
                    return root;
                }/* else if (match === '{$iconset}') {
                    return iconset;
                }*/
                return null;
            };
        }
        this.ready = true;
        style = style || [];
        if (Array.isArray(style)) {
            style = { style };
        } else if (style.renderPlugin) {
            style = { style: [style] };
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

    outlineFeatures(featureIds) {
        const renderer = this.getRenderer();
        if (!renderer) {
            return this;
        }
        renderer.outlineFeatures(featureIds);
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

    highlight(highlights) {
        const renderer = this.getRenderer();
        if (!renderer) {
            return this;
        }
        renderer.highlight(highlights);
        return this;
    }

    cancelHighlight(ids) {
        const renderer = this.getRenderer();
        if (!renderer) {
            return this;
        }
        renderer.cancelHighlight(ids);
        return this;
    }

    cancelAllHighlight() {
        const renderer = this.getRenderer();
        if (!renderer) {
            return this;
        }
        renderer.cancelAllHighlight();
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
        if (!styles[idx].renderPlugin.sceneConfig) {
            styles[idx].renderPlugin.sceneConfig = {};
        }
        extend(styles[idx].renderPlugin.sceneConfig, sceneConfig);
        let computedSceneConfig;
        if (styleIdx !== undefined) {
            checkFeaStyleExist(this._originFeatureStyle, idx, styleIdx);
            renderIdx = this._originFeatureStyle[idx].style[styleIdx]._renderIdx;
            const renderPlugin = styles[renderIdx].renderPlugin;
            if (!renderPlugin.sceneConfig) {
                renderPlugin.sceneConfig = {};
            }
            computedSceneConfig = renderPlugin.sceneConfig;
        } else {
            checkStyleExist(styles, idx);
            computedSceneConfig = styles[idx].renderPlugin.sceneConfig;
        }
        extend(computedSceneConfig, sceneConfig);

        if (Array.isArray(this.options.style)) {
            const renderPlugin = this.options.style[idx].renderPlugin;
            if (!renderPlugin.sceneConfig) {
                renderPlugin.sceneConfig = {};
            }
            extend(renderPlugin.sceneConfig, sceneConfig);
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
        if (isString(idx)) {
            idx = this._getStyleIndex(idx);
        }
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
                !Array.isArray(filter) &&
                filter.condition === undefined) {
                throw new Error(`Invalid filter at ${i} : ${JSON.stringify(filter)}`);
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

    /**
     * 获取style定义
     *
     * @param {Number|String} index/name - 序号或者style的name
     * @returns Object
     **/
    getRenderStyle(index) {
        if (isString(index)) {
            // by name
            index = this._getStyleIndex(index);
        }
        let styles = this._vtStyle;
        return styles && styles[index];
    }

    /**
     * 在指定位置添加一个新的style，例如：
     *
     * layer.addStyle(0, {
     *   filter: true,
     *   renderPlugin,
     *   symbol
     * });
     * @param {Number} index - 序号，值-1时添加到最后
     * @param {Object} style - style定义
     * @returns this
     */
    addRenderStyle(index, style) {
        let styles = this._vtStyle;
        if (!styles) {
            styles = [style];
        } else {
            if (index < 0 || index >= styles.length) {
                styles.push(style);
            } else {
                styles.splice(index, 0, style);
            }
        }
        this._setStyle({
            $root: this._pathRoot,
            style: styles,
            featureStyle: this._originFeatureStyle
        });
        return this;
    }

    /**
     * 更新指定位置的style，例如：
     *
     * layer.updateStyle(1, {
     *   filter: true,
     *   renderPlugin,
     *   symbol
     * });
     * @param {Number|String} index/name - 序号或者style的name
     * @param {Object} style - style定义
     * @returns this
     */
    updateRenderStyle(index, style) {
        if (isString(index)) {
            // by name
            index = this._getStyleIndex(index);
        }
        let styles = this._vtStyle;
        if (!styles || index < 0 || index >= styles.length) {
            return this;
        }
        styles.splice(index, 1, style);
        this._setStyle({
            $root: this._pathRoot,
            style: styles,
            featureStyle: this._originFeatureStyle
        });
        return this;
    }

    /**
     * 删除指定位置的style
     * @param {Number|String} index/name - 序号或者style的name
     * @returns this
     */
    removeRenderStyle(index) {
        if (isString(index)) {
            // by name
            index = this._getStyleIndex(index);
        }
        let styles = this._vtStyle;
        if (!styles || index < 0 || index >= styles.length) {
            return this;
        }
        styles.splice(index, 1);
        this._setStyle({
            $root: this._pathRoot,
            style: styles,
            featureStyle: this._originFeatureStyle
        });
        return this;
    }

    /**
     * 根据feature id或者FeatureStyle定义
     * @param {String|Number|String[]|Number[]} id - feature id 或者 一组feature id
     * @returns Object
     **/
    getFeatureStyle(id) {
        const idx = this.getFeatureStyleIndex(id);
        if (idx < 0) {
            return null;
        }
        return this._originFeatureStyle[idx];
    }

    /**
     * 更新指定feature id的Feature Style，如果该id的feature style不存在，则添加一个，例如：
     *
     * layer.updateFeatureStyle({
     *     id: 10
     *     style: [
     *       {
     *         filter: true,
     *         renderPlugin,
     *         symbol
     *       }
     *     ]);
     * @param {String|Number} id - feature id
     * @param {Object} feature style - feature style定义
     * @returns this
     */
    updateFeatureStyle(featureStyle) {
        if (!featureStyle) {
            return this;
        }
        const id = featureStyle.id;
        if (isNil(id)) {
            return this;
        }
        const index = this.getFeatureStyleIndex(id);
        const featureStyles = this._originFeatureStyle || [];
        if (index < 0) {
            featureStyles.push(featureStyle);
        } else {
            featureStyles[index] = featureStyle;
        }
        this._setStyle({
            $root: this._pathRoot,
            style: this._vtStyle,
            featureStyle: featureStyles
        });
        return this;
    }

    /**
     * 删除指定feature id的feature style
     * @param id - feature id
     * @returns this
     */
    removeFeatureStyle(id) {
        const index = this.getFeatureStyleIndex(id);
        if (index < 0) {
            return this;
        }
        const featureStyles = this._originFeatureStyle.splice(index, 1);
        this._setStyle({
            $root: this._pathRoot,
            style: this._vtStyle,
            featureStyle: featureStyles
        });
        return this;
    }

    getFeatureStyleIndex(id) {
        if (isNil(id)) {
            return -1;
        }
        const featureStyles = this._originFeatureStyle;
        if (!featureStyles) {
            return -1;
        }
        const isArr = Array.isArray(id);
        for (let i = 0; i < featureStyles.length; i++) {
            if (isArr) {
                return Array.isArray(featureStyles[i].id) && equalsArray(id, featureStyles[i].id);
            } else if (featureStyles[i].id === id) {
                return i;
            }
        }
        return -1;
    }

    _getStyleIndex(name) {
        const styles = this._vtStyle;
        if (!styles) {
            return -1;
        }
        for (let i = 0; i < styles.length; i++) {
            if (styles[i].name === name) {
                return i;
            }
        }
        const error = `No style defined with name: ${name}`;
        throw new Error(error);
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

    // getCompiledStyle() {
    //     return {
    //         style: this._compiledStyles || [],
    //         featureStyle: this._compiledFeatureStyles || []
    //     };
    // }

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
        const results = renderer.pick(point.x * dpr, point.y * dpr, options);
        if (this.options['features'] && this.options['features'] !== 'id') {
            // 将瓦片坐标转成经纬度坐标
            return this._convertPickedFeature(results);
        } else {
            return results;
        }
    }

    _convertPickedFeature(picks) {
        const renderer = this.getRenderer();
        if (!renderer) {
            return picks;
        }
        const tileConfig = this['_getTileConfig']();
        const sr = this.getSpatialReference();
        for (let i = 0; i < picks.length; i++) {
            let pick = picks[i];
            if (!pick || !pick.data) {
                continue;
            }
            const { tile } = pick.data;
            const { x, y, z, extent } = tile;
            const res = sr.getResolution(z);
            const nw = tileConfig.getTilePointNW(x, y, res);
            const geometry = pick.data.feature && pick.data.feature.geometry;
            if (geometry) {
                pick.data = extend({}, pick.data);
                pick.data.feature = extend({}, pick.data.feature);
                const type = pick.data.feature.type;
                pick.data.feature.type = 'Feature';
                // pick.data.feature.type = getFeatureType(pick.data.feature);
                pick.data.feature.geometry = this._convertGeoemtry(type, geometry, nw, extent, res);
                // pick.data.feature.geometry = this._convertGeometryCoords(geometry, nw, extent, res);
            }
        }
        return picks;
    }

    _convertGeoemtry(type, geometry, nw, extent, res) {
        let geoType, coordinates;
        if (type === 1) {
            if (geometry.length <= 1) {
                geoType = 'Point';
                coordinates = this._convertGeometryCoords(geometry, nw, extent, res)[0] || [];
            } else {
                geoType = 'MultiPoint';
                coordinates = this._convertGeometryCoords(geometry, nw, extent, res);
            }
        } else if (type === 2) {
            if (geometry.length <= 1) {
                geoType = 'LineString';
                coordinates = this._convertGeometryCoords(geometry, nw, extent, res)[0] || [];
            } else {
                geoType = 'MultiLineString';
                coordinates = this._convertGeometryCoords(geometry, nw, extent, res);
            }
        } else if (type === 3) {
            coordinates = [];
            let polygon;
            let count = 0;
            for (let i = 0; i < geometry.length; i++) {
                const area = PackUtil.calculateSignedArea(geometry[i]);
                if (area > 0) {
                    count++;
                    if (polygon && polygon.length) {
                        coordinates.push(polygon);
                    }
                    polygon = [];
                }
                polygon.push(this._convertGeometryCoords(geometry[i], nw, extent, res))
            }
            if (polygon.length) {
                coordinates.push(polygon);
            }
            if (count <= 1) {
                geoType = 'Polygon';
                coordinates = coordinates[0];
            } else {
                geoType = 'MultiPolygon';
            }
        }
        return {
            type: geoType,
            coordinates
        };
    }

    _convertGeometryCoords(geometry, nw, extent, res) {
        const tileSize = this.options.tileSize[0];
        const tileScale = extent / tileSize;
        const map = this.getMap();
        const coords = [];
        for (let i = 0; i < geometry.length; i++) {
            if (Array.isArray(geometry[i])) {
                coords.push(this._convertGeometryCoords(geometry[i], nw, extent, res));
            } else {
                TMP_POINT.x = nw.x + geometry[i].x / tileScale;
                TMP_POINT.y = nw.y - geometry[i].y / tileScale;
                map.pointAtResToCoord(TMP_POINT, res, TMP_COORD);
                coords.push(TMP_COORD.toArray());
            }
        }
        return coords;
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
        // if (this._vtStyle) {
        //     this._compiledStyles = compileStyle(this._vtStyle);
        // }
        // if (this._featureStyle) {
        //     this._compiledFeatureStyles = compileStyle(this._featureStyle);
        // }

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
