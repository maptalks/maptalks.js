import { isNil, extend, isString, isObject, isNumber, pushIn, isFnTypeSymbol } from '../../common/Util';
import { buildWireframe, build3DExtrusion } from '../builder/';
import { createFilter } from '@maptalks/feature-filter';
import { KEY_IDX } from '../../common/Constant';
import Browser from '../util/Browser';
import { getVectorPacker } from '../../packer/inject';

const { VectorPack, PolygonPack, NativeLinePack, LinePack, PointPack, NativePointPack,
    LineExtrusionPack, CirclePack, RoundTubePack, SquareTubePack, FilterUtil,
    PackUtil, StyleUtil, TextUtil, DEFAULT_TEX_WIDTH, GlyphRequestor } = getVectorPacker();
// let FONT_CANVAS;

const oldPropsKey = '__original_properties';
const fntypePropsKey = '__fn-type_properties';

export default class BaseLayerWorker {
    constructor(id, options, upload, tileCache, tileLoading) {
        this.id = id;
        this.options = options;
        this.upload = upload;
        this._compileStyle(options.style);
        this.requests = {};
        this._cache = tileCache;
        this._styleCounter = 1;
        this.loadings = tileLoading;
    }

    updateStyle(style, cb) {
        this.options.style = style;
        this._styleCounter = style.styleCounter;
        this._compileStyle(style);
        cb();
    }

    updateOptions(options, cb) {
        this.options = extend(this.options, options);
        cb();
    }

    /**
     * Load a tile, paint and return gl directives
     * @param {Object} tileInfo  - tileInfo, xyz, res, extent, etc
     * @param {Function} cb - callback function when finished
     */
    loadTile(context, cb) {
        const loadings = this.loadings;
        const url = context.tileInfo.url;
        const debugTile = this.options.debugTile;
        if (debugTile) {
            const { x, y, z } = context.tileInfo;
            let hit = false;
            for (let i = 0; i < debugTile.length; i++) {
                if (x === debugTile[i].x && y === debugTile[i].y && z === debugTile[i].z) {
                    hit = true;
                    break;
                }
            }
            if (!hit) {
                cb();
                return;
            }
        }



        if (loadings[url]) {
            loadings[url].push({
                // 必须要保存context，因为context中的值可能会发生变化，例如styleCounter，导致逻辑发生错误
                context,
                callback: cb,
                ref: this
            });
            return;
        }
        loadings[url] = [{
            context,
            callback: cb,
            ref: this
        }];
        const feaIdProp = this.options.featureIdProperty;
        this.requests[url] = this.getTileFeatures(context, (err, features, layers, props) => {
            const waitings = loadings[url];
            delete loadings[url];
            if (this.checkIfCanceled(url)) {
                delete this.requests[url];
                this._callWaitings(waitings, null, { canceled: true });
                return;
            }
            delete this.requests[url];
            if ((this.options.debug || feaIdProp) && features) {
                for (let i = 0; i < features.length; i++) {
                    if (this.options.debug) {
                        features[i]['_debug_info'] = {
                            index: i,
                            id: features[i].id,
                            tileId: context.tileInfo.id
                        };
                    }
                    if (feaIdProp) {
                        const propName = isObject(feaIdProp) ? feaIdProp[features[i].layer] : feaIdProp;
                        const properties = features[i].properties;
                        features[i].id = properties && properties[propName] || null;
                    }
                }
            }
            if (err) {
                this._callWaitings(waitings, err);
                return;
            }
            if (!features || !features.length) {
                this._callWaitings(waitings);
                return;
            }
            if (waitings) {
                for (let i = 0; i < waitings.length; i++) {
                    this._onTileLoad.call(waitings[i].ref, waitings[i].context, waitings[i].callback, url, layers, features, props);
                }
            }
        });

    }

    _onTileLoad(context, cb, url, layers, features, props) {
        this._createTileData(layers, features, context).then(data => {
            if (data.canceled) {
                cb(null, { canceled: true });
                return;
            }
            data.data.styleCounter = context.styleCounter;
            if (props) {
                extend(data.data, props);
            }
            cb(null, data.data, data.buffers);
        }).catch(err => {
            cb(err);
        });
    }

    abortTile(url, cb) {
        delete this.requests[url];
        this._cancelLoadings(url);
        cb();
    }

    _cancelLoadings(url) {
        const waitings = this.loadings[url];
        if (waitings) {
            for (let i = 0; i < waitings.length; i++) {
                waitings[i].callback(null, { canceled: true });
            }
        }
        delete this.loadings[url];
    }

    _callWaitings(waitings, err, data) {
        if (waitings) {
            for (let i = 0; i < waitings.length; i++) {
                waitings[i].callback(err, data);
            }
        }
    }

    checkIfCanceled(url) {
        return !this.requests[url];
    }

    onRemove() {
        this.loadings = {};
        delete this._cache;
        this.requests = {};
    }

    fetchIconGlyphs(icons, glyphs, cb) {
        //2019-03-20 win10 chrome 74 64位，OffscreenCanvas fillText性能只有主线程的10%，还不可用
        // 2021-02-25 Offscreen.fillText会造成程序出错，还不可用
        // 2023-07-32 改用Offscreen来创建glyph，用以提升性能
        if (this.options.workerGlyph && Browser.offscreenCanvas) {
            const promises = [];
            if (icons && Object.keys(icons).length) {
                const promise = new Promise((resolve) => {
                    this.upload('fetchIconGlyphs', { icons }, null, (err, data) => {
                        resolve({ err, iconData: data });
                    });
                })
                promises.push(promise);
            }
            if (glyphs && Object.keys(glyphs).length) {
                const promise = new Promise((resolve) => {
                    if (!this._glyphRequestor) {
                        this._glyphRequestor = new GlyphRequestor();
                    }
                    this._glyphRequestor.getGlyphs(glyphs, (err, glyphData) => {
                        resolve({ err, glyphData });
                    });
                })
                promises.push(promise);
            }


            Promise.all(promises).then(datas => {
                const data = { icons: null, glyphs: null };
                for (let i = 0; i < datas.length; i++) {
                    if (datas[i].err) {
                        cb(datas[i].err);
                        return;
                    } else if (datas[i].iconData) {
                        data.icons = datas[i].iconData.icons;
                    } else if (datas[i].glyphData) {
                        data.glyphs = datas[i].glyphData.glyphs;
                    }
                }
                return data;
            }).then(data => {
                cb(null, data);
            });

            // if (!this._iconRequestor) {
            //     this._iconRequestor = new IconRequestor();
            // }

        } else {
            //command, params, buffers and callback
            this.upload('fetchIconGlyphs', { icons, glyphs }, null, cb);
        }
        // this.upload('fetchIconGlyphs', { icons, glyphs }, null, cb);
    }

    _createTileData(layers, features, context) {
        if (!features.length) {
            return Promise.resolve({
                data: null,
                buffers: []
            });
        }
        const { glScale, tileInfo } = context;
        const useDefault = !this.options.style.style.length && !this.options.style.featureStyle.length;
        let pluginConfigs = this.pluginConfig.slice(0);
        if (useDefault) {
            //图层没有定义任何style，通过数据动态生成pluginConfig
            pluginConfigs = this._updateLayerPluginConfig(layers);
        }
        if (this.featurePlugins) {
            pushIn(pluginConfigs, this.featurePlugins);
        }
        const allCustomProps = {};
        for (let i = 0; i < pluginConfigs.length; i++) {
            cloneFeaAndAppendCustomTags(features, context.tileInfo.z, pluginConfigs[i], allCustomProps);
        }
        const feas = [];
        const copies = [];
        for (let i = 0; i < features.length; i++) {
            const feature = features[i];
            const customProps = allCustomProps[i];
            if (customProps) {
                copies.fill(null);
                let count = 0;
                for (const p in customProps) {
                    let index = 0;
                    const props = customProps[p].values();
                    for (const v of props) {
                        let fea = copies[index];
                        if (!fea) {
                            fea = proxyFea(feature);
                            copies[index] = fea;
                        }
                        fea.properties[p] = v;
                        index++;
                    }
                    if (index > count) {
                        count = index;
                    }
                }
                for (let i = 0; i < count; i++) {
                    feas.push(copies[i]);
                }
            } else {
                feas.push(feature)
            }
        }

        features = feas;

        const EXTENT = features[0].extent;
        const zoom = tileInfo.z,
            tilePoint = { x: tileInfo.extent2d.xmin * glScale, y: tileInfo.extent2d.ymax * glScale },
            data = [],
            featureData = [],
            pluginIndexes = [],
            options = this.options,
            buffers = [];
        const feaTags = {};
        const promises = [
            Promise.resolve(context.styleCounter)
        ];
        let currentType = 0;
        let typeIndex = -1;

        const fnTypeProps = [];
        let hasFnTypeProps = false;

        for (let i = 0; i < pluginConfigs.length; i++) {
            typeIndex++;
            const pluginConfig = pluginConfigs[i];
            if (pluginConfig.type !== currentType) {
                //plugin类型变成 feature plugin
                typeIndex = 0;
                currentType = pluginConfig.type;
            }
            // type = 0 是普通 style， type = 1 是 feature style
            const targetData = pluginConfig.type === 0 ? data : featureData;
            if (pluginConfig.symbol && pluginConfig.symbol.visible === false) {
                //数据不存在，则在data中添加个占位的null，不然renderer中featureData与data，对应的plugin会不正确
                targetData[typeIndex] = null;
                continue;
            }
            getFnTypeProps(pluginConfig.symbol, fnTypeProps, i);
            hasFnTypeProps = hasFnTypeProps || fnTypeProps[i] && fnTypeProps[i].size > 0;

            const { tileFeatures, tileFeaIndexes } = this._filterFeatures(zoom, pluginConfig.type, pluginConfig.filter, features, feaTags, i);

            if (!tileFeatures.length) {
                targetData[typeIndex] = null;
                continue;
            }

            const maxIndex = tileFeaIndexes[tileFeaIndexes.length - 1];
            const arrCtor = PackUtil.getIndexArrayType(maxIndex);
            targetData[typeIndex] = {
                //[feature_index, style_index, ...]
                styledFeatures: new arrCtor(tileFeaIndexes)
            };

            //index of plugin with data
            pluginIndexes.push({
                idx: i,
                typeIdx: typeIndex
            });

            buffers.push(targetData[typeIndex].styledFeatures.buffer);
            const tileContext = extend({}, context, { extent: EXTENT, zoom, tilePoint });
            if (this.options.debugTile) {
                const debugTile = this.options.debugTile;
                for (let i = 0; i < debugTile.length; i++) {
                    const { x, y, z } = debugTile[i];
                    if (tileInfo.x === x && tileInfo.y === y && tileInfo.z === z) {
                        tileContext.debugIndex = debugTile[i].index;
                        break;
                    }
                }
            }
            let promise = this._createTileGeometry(tileFeatures, pluginConfig, tileContext);
            if (useDefault) {
                promise = promise.then(tileData => {
                    if (!tileData) {
                        return null;
                    }
                    if (tileData.data) {
                        tileData.data.layer = tileFeatures[0].layer;
                    } else if (Array.isArray(tileData)) {
                        for (let i = 0; i < tileData.length; i++) {
                            if (tileData[i] && tileData[i].data) tileData[i].data.layer = tileFeatures[0].layer;
                        }
                    }
                    return tileData;
                });
            }
            promises.push(promise);
        }

        return Promise.all(promises).then(([styleCounter, ...tileDatas]) => {
            if (styleCounter !== this._styleCounter) {
                return { canceled: true };
            }
            function handleTileData(tileData, i) {
                if (tileData.data.ref !== undefined) {
                    return;
                }
                const pluginConfig = pluginConfigs[pluginIndexes[i].idx];
                const dataConfig = pluginConfig.renderPlugin.dataConfig;
                tileData.data.type = dataConfig.type;
                tileData.data.filter = pluginConfig.filter.def;
                if (dataConfig.altitudeOffset) {
                    tileData.data.properties.minAltitude += dataConfig.altitudeOffset;
                    tileData.data.properties.maxAltitude += dataConfig.altitudeOffset;
                }

                if (tileData.buffers && tileData.buffers.length) {
                    for (let i = 0; i < tileData.buffers.length; i++) {
                        buffers.push(tileData.buffers[i]);
                    }
                }
            }
            for (let i = 0; i < tileDatas.length; i++) {
                if (!tileDatas[i]) {
                    continue;
                }
                const tileData = tileDatas[i];
                const targetData = pluginConfigs[pluginIndexes[i].idx].type === 0 ? data : featureData;
                if (Array.isArray(tileData)) {
                    const datas = [];
                    for (let ii = 0; ii < tileData.length; ii++) {
                        if (!tileData[ii]) {
                            continue;
                        }
                        handleTileData(tileData[ii], i);
                        if (tileData[ii].data.ref !== undefined && !tileData[tileData[ii].data.ref]) {
                            continue;
                        }
                        datas.push(tileData[ii].data);
                    }
                    if (datas.length) {
                        targetData[pluginIndexes[i].typeIdx].data = datas;
                    }
                } else {
                    handleTileData(tileData, i);
                    targetData[pluginIndexes[i].typeIdx].data = tileData.data;
                }
            }
            const allFeas = {};
            const schema = layers;
            if (options.features || options.schema || hasFnTypeProps) {
                let needClearNoneFnTypeProps = false;
                let feature;
                for (let i = 0, l = features.length; i < l; i++) {
                    feature = features[i];
                    if (!schema[feature.layer].properties) {
                        schema[feature.layer].properties = getPropTypes(feature.properties);
                    }
                    if (feature && (options.features || hasFnTypeProps && feaTags[i])) {
                        //reset feature's marks
                        if (options.features === 'id') {
                            allFeas[i] = feature.id;
                        } else {
                            if (!options.pickingGeometry) {
                                delete feature.geometry;
                            }
                            delete feature.extent;
                            delete feature.properties['$layer'];
                            delete feature.properties['$type'];
                            // _getFeaturesToMerge 中用于排序的临时字段
                            delete feature['__index'];
                            const originalFeature = feature.originalFeature;
                            if (originalFeature) {
                                const properties = feature.properties;
                                const fea = extend({}, feature.originalFeature);
                                // fea.properties = extend({}, feature.originalFeature.properties, properties);
                                delete properties[oldPropsKey];
                                fea.customProps = extend({}, properties);

                                feature = fea;
                            }
                            const o = extend({}, feature);
                            if (hasFnTypeProps && feaTags[i] && (!options.features || options.features === 'transient')) {
                                // 只输出symbol中用到的属性
                                const pluginIndexs = feaTags[i];
                                for (let j = 0; j < pluginIndexs.length; j++) {
                                    const props = fnTypeProps[j];
                                    if (!props) {
                                        continue;
                                    }
                                    props.forEach(p => {
                                        const properties = originalFeature ? originalFeature.properties : feature.properties;
                                        if (!properties[fntypePropsKey]) {
                                            properties[fntypePropsKey] = new Set();
                                        }
                                        properties[fntypePropsKey].add(p);
                                        needClearNoneFnTypeProps = true;
                                    });
                                }
                            }
                            allFeas[i] = o;
                        }
                    }
                }
                if (needClearNoneFnTypeProps) {
                    // 验证batch底图的内存情况
                    // http://localhost/bugs/designer-947/
                    // 删除feature中，不是fn-type的属性
                    for (const p in allFeas) {
                        const feature = allFeas[p];
                        const keys = feature.properties[fntypePropsKey];
                        if (keys) {
                            delete feature.properties[fntypePropsKey];
                            if (options.features === 'transient') {
                                feature.fnTypeProps = extend({}, feature.properties);
                            }
                            for (const pp in feature.properties) {
                                if (!keys.has(pp)) {
                                    if (options.features === 'transient') {
                                        delete feature.fnTypeProps[pp];
                                    } else {
                                        delete feature.properties[pp];
                                    }

                                }
                            }
                        }
                    }
                }
            }
            return {
                data: {
                    styleCounter,
                    schema,
                    data,
                    featureData,
                    extent: EXTENT,
                    features: allFeas
                },
                buffers
            };
        }).catch(err => {
            console.error(err);
        });

    }

    _createTileGeometry(tileFeatures, pluginConfig, context) {
        let features = tileFeatures;
        const dataConfig = pluginConfig.renderPlugin.dataConfig;
        const symbol = pluginConfig.symbol;
        const tileSize = this.options.tileSize;
        const { extent, glScale, zScale, zoom, tilePoint, centimeterToPoint, verticalCentimeterToPoint } = context;
        const tileRatio = extent / tileSize;
        const type = dataConfig.type;
        const debugIndex = context.debugIndex;
        // console.log(context.tileInfo.id, tileFeatures.length);
        let options = extend({}, dataConfig, {
            EXTENT: extent,
            zoom,
            debugIndex,
            features: this.options.features
        });
        if (type === '3d-extrusion') {
            const t = hasTexture(symbol);
            if (t) {
                dataConfig.uv = 1;
                if (t === 2) {
                    // dataConfig.tangent = 1;
                }
            }
            const projectionCode = this.options.projectionCode;
            const textureWidth = symbol.material && symbol.material.textureWidth || DEFAULT_TEX_WIDTH;
            return Promise.all([Promise.resolve(build3DExtrusion(features, dataConfig, extent, tilePoint,
                textureWidth, context.tileInfo.res, glScale, extent / this.options['tileSize'], centimeterToPoint, verticalCentimeterToPoint, symbol, zoom, projectionCode, debugIndex))]);
        } else if (type === '3d-wireframe') {
            return Promise.all([Promise.resolve(buildWireframe(features, extent, symbol, dataConfig))]);
        } else if (type === 'point') {
            options = extend(options, {
                requestor: this.fetchIconGlyphs.bind(this),
                //把 altitude 转为瓦片坐标
                altitudeToTileScale: zScale * extent / this.options['tileSize'] / glScale
            });
            // 如果同时定义了 marker 属性和text属性，textPlacement， textSpacing会被markerPlacement，markerSpacing代替
            const symbols = PointPack.splitPointSymbol(symbol);
            const fnTypes = VectorPack.genFnTypes(symbols[0]);
            if (PointPack.needMerge(symbols[0], fnTypes, zoom)) {
                features = PointPack.mergeLineFeatures(features, symbols[0], fnTypes, zoom);
            }
            return Promise.all(symbols.map((symbol, index) => {
                if (index === 0) {
                    options.fnTypes = fnTypes;
                } else {
                    delete options.fnTypes;
                }
                return new PointPack(features, symbol, options).load(tileRatio);
            }));
        } else if (type === 'native-point') {
            const altitudeToTileScale = zScale * extent / this.options['tileSize'] / glScale;
            options.altitudeToTileScale = altitudeToTileScale;
            return parseSymbolAndGenPromises(features, symbol, options, NativePointPack, extent / tileSize);
        } else if (type === 'line') {
            options = extend(options, {
                requestor: this.fetchIconGlyphs.bind(this),
                tileRatio
            });
            return parseSymbolAndGenPromises(features, symbol, options, LinePack, 1, true);
            // return Promise.resolve(null);
        } else if (type === 'native-line') {
            return parseSymbolAndGenPromises(features, symbol, options, NativeLinePack, 1, true);
        } /*else if (type === 'pixel-line') {
            options = extend(options, {
                requestor: this.fetchIconGlyphs.bind(this),
                tileRatio
            });
            return parseSymbolAndGenPromises(features, symbol, options, PixelLinePack);
        } */else if (type === 'fill') {
            options = extend(options, {
                requestor: this.fetchIconGlyphs.bind(this)
            });
            return parseSymbolAndGenPromises(features, symbol, options, PolygonPack);
        } else if (type === 'line-extrusion') {
            //line-extrusion 不需要 lineGradientProperty 属性，以免错误的把linesofar转化到了 0-2^15
            delete symbol['lineGradientProperty'];
            symbol['lineJoin'] = 'miter';
            symbol['lineCap'] = 'butt';
            const t = hasTexture(symbol);
            if (t) {
                dataConfig.uv = 1;
                if (t === 2) {
                    // dataConfig.tangent = 1;
                }
            }
            options = extend(options, {
                tileSize,
                zScale,
                glScale
            });
            if (symbol.mergeOnProperty) {
                const fnTypes = VectorPack.genFnTypes(symbol);
                features = LinePack.mergeLineFeatures(features, symbol, fnTypes, options.zoom);
            }
            if (t) {
                const packs = [];
                if (dataConfig.top !== false) {
                    const opt = extend({}, options);
                    opt.side = false;
                    packs.push(new LineExtrusionPack(features, symbol, opt));
                }
                if (dataConfig.side !== false) {
                    options.side = true;
                    options.top = false;
                    packs.push(new LineExtrusionPack(features, symbol, options));
                }
                return Promise.all(packs.map(pack => pack.load()));
            } else {
                return Promise.all([new LineExtrusionPack(features, symbol, options).load()]);
            }
        } else if (type === 'circle') {
            return parseSymbolAndGenPromises(features, symbol, options, CirclePack);
            // const pack = new CirclePack(features, symbol, options);
            // return pack.load();
        } else if (type === 'round-tube' || type === 'square-tube') {
            const clazz = type === 'round-tube' ? RoundTubePack : SquareTubePack;
            options = extend(options, {
                requestor: this.fetchIconGlyphs.bind(this),
                radialSegments: type === 'round-tube' ? (dataConfig.radialSegments || 8) : 4,
                centimeterToPoint,
                verticalCentimeterToPoint,
                tileRatio,
                isTube: true
            });
            return parseSymbolAndGenPromises(features, symbol, options, clazz);
        }
        return Promise.resolve([]);
    }

    /**
     * Filter
     * @param {*} filter
     * @param {*} features
     */
    _filterFeatures(zoom, styleType, filter, features, tags, index) {
        const keyName = (KEY_IDX + '').trim();
        const indexes = [];
        const filtered = [];
        const l = features.length;
        for (let i = 0; i < l; i++) {
            if (styleType !== 1 && features[i].id !== undefined && this.styledFeatures[features[i].id]) {
                continue;
            }

            //filter.def没有定义，或者为default时，说明其实默认样式，feature之前没有其他样式时的应用样式
            // 并识别哪些feature归类到默认样式
            if ((!filter.def || filter.def === 'default') && !tags[i] ||
                (filter.def === true || filter.def && (filter.def.condition !== undefined || Array.isArray(filter.def)) && filter(features[i], zoom))) {
                const fea = features[i];
                if (fea[keyName] === undefined) {
                    fea[keyName] = i;
                }
                if (!tags[i]) {
                    tags[i] = [];
                }
                tags[i].push(index);
                filtered.push(fea);
                indexes.push(i);
                if (styleType === 1) {
                    break;
                }
            }
        }
        return {
            tileFeatures: filtered,
            tileFeaIndexes: indexes
        };
    }

    _compileStyle(layerStyle) {
        const { style, featureStyle } = layerStyle;
        const styledFeatures = {};
        featureStyle.forEach(style => {
            if (Array.isArray(style.id)) {
                style.id.forEach(id => {
                    styledFeatures[id] = 1;
                });
                style.filter = ['in', '$id', ...style.id];
            } else {
                styledFeatures[style.id] = 1;
                style.filter = ['==', '$id', style.id];
            }
        });
        const pluginConfigs = FilterUtil.compileStyle(style);
        for (let i = 0; i < style.length; i++) {
            if (pluginConfigs[i].filter) {
                // filter.value 是为方便studio，定义的对象结构
                // 设置def，是为了识别哪些feature归类到默认样式
                pluginConfigs[i].filter.def = style[i].filter ? (style[i].filter.value || style[i].filter) : undefined;
            }
            pluginConfigs[i].type = 0;
        }

        const featurePlugins = [];
        const compiledFeatureStyle = FilterUtil.compileStyle(featureStyle);
        for (let i = 0; i < featureStyle.length; i++) {
            compiledFeatureStyle[i].type = 1;
            // 定义def，是为了与默认样式相区分(默认样式的filter没有def)
            compiledFeatureStyle[i].filter.def = featureStyle[i].filter ? (featureStyle[i].filter.value || featureStyle[i].filter) : undefined;
            //没有renderPlugin就不生成数据，必须和VectorTileLayerRenderer的_initPlugins中的逻辑对应起来
            if (compiledFeatureStyle[i].renderPlugin) {
                featurePlugins.push(compiledFeatureStyle[i]);
            }
        }

        this.pluginConfig = pluginConfigs;
        this.featurePlugins = featurePlugins;
        this.styledFeatures = styledFeatures;
    }

    _updateLayerPluginConfig(layers) {
        let layerPlugins = this._layerPlugins;
        if (!this._layerPlugins) {
            layerPlugins = this._layerPlugins = {};
        }
        const TYPES = [
            '',
            'Point',
            'LineString',
            'Polygon',
            'MultiPoint',
            'MultiLineString',
            'MultiPolygon'
        ];
        const framePlugins = [];
        for (const p in layers) {
            const layer = p;
            if (!layerPlugins[p]) {
                const stylePlugins = [];
                for (let i = 0; i < layers[p].types.length; i++) {
                    const type = layers[p].types[i];
                    const def = ['all', ['==', '$layer', layer], ['==', '$type', TYPES[type]]];
                    const plugin = {
                        filter: createFilter(def),
                        renderPlugin: getDefaultRenderPlugin(type),
                        symbol: getDefaultSymbol(type)
                    };
                    plugin.filter.def = def;
                    plugin.type = 0;
                    stylePlugins.push(plugin);
                }
                layerPlugins[layer] = stylePlugins;
            }
            // const type = Math.min(...layers[p].types);
            // if (!layerPlugins[layer]) {
            //     const def = ['==', '$layer', layer];
            //     layerPlugins[layer] = {
            //         filter: createFilter(def),
            //         renderPlugin: getDefaultRenderPlugin(type),
            //         symbol: getDefaultSymbol(type)
            //     };
            //     layerPlugins[layer].filter.def = def;
            // }
            framePlugins.push(...layerPlugins[layer]);
        }
        return framePlugins;
    }
}

// LayerWorker.prototype.getProjViewMatrix = function (transform) {
//     const m = new Float64Array(16);
//     const m1 = new Float32Array(16);
//     return function (tileInfo, matrix) {
//         const tilePos = tileInfo.point;
//         const tileSize = this.tileSize;

//         const tileMatrix = mat4.identity(m);
//         mat4.translate(tileMatrix, tileMatrix, [tilePos.x, tilePos.y, 0]);
//         mat4.scale(tileMatrix, tileMatrix, [tileSize / EXTENT, tileSize / EXTENT, 1]);

//         //local transform in current frame
//         if (transform) {
//             mat4.multiply(tileMatrix, tileMatrix, transform);
//         }

//         mat4.multiply(tileMatrix, matrix, tileMatrix);

//         return mat4.copy(m1, tileMatrix);
//     };
// }();

function getDefaultRenderPlugin(type) {
    switch (type) {
    case 1:
        return {
            type: 'native-point',
            dataConfig: {
                type: 'native-point',
                only2D: true
            }
        };
    case 2:
        return {
            type: 'native-line',
            dataConfig: {
                type: 'native-line',
                only2D: true
            }
        };
    case 3:
        return {
            type: 'fill',
            dataConfig: {
                type: 'fill',
                only2D: true
            }
        };
    }
    return null;
}


function getDefaultSymbol(type) {
    switch (type) {
    case 1:
        return {
            markerFill: '#f00',
            markerSize: 10
        };
    case 2:
        return {
            lineColor: '#fff'
        };
    case 3:
        return {
            polygonFill: '#00f',
            polygonOpacity: 0.4
        };
    }
    return null;
}

function getPropTypes(properties) {
    if (Array.isArray(properties) || !isObject(properties)) {
        return {};
    }
    const types = {};
    for (const p in properties) {
        const v = properties[p];
        if (isString(v)) {
            types[p] = 'string';
        } else if (isNumber(v)) {
            types[p] = 'number';
        } else if (v === true || v === false) {
            types[p] = 'boolean';
        } else if (Array.isArray(v)) {
            types[p] = 'array';
        } else {
            types[p] = 'object';
        }
    }
    return types;
}

export function hasTexture(symbol) {
    if (!symbol) {
        return 0;
    }
    let t = 0;
    for (const p in symbol) {
        if ((p === 'normalTexture' || p === 'bumpTexture') && symbol[p]) {
            return 2;
        } else if (p.indexOf('Texture') > 0 && symbol[p]) {
            t = 1;
        } else if (isObject(symbol[p])) {
            const t0 = hasTexture(symbol[p]);
            if (t0 === 2) {
                return t0;
            } else if (t0 === 1) {
                t = 1;
            }
        }
    }
    return t;
}

function parseSymbolAndGenPromises(features, symbol, options, clazz, scale, isLine) {
    const parsed = {};
    const symbols = Array.isArray(symbol) ? symbol : [symbol];
    let first = -1;
    for (let i = 0; i < symbols.length; i++) {
        parsed[i] = hasFnTypeKeys(symbols[i]);
        if (!parsed[i] && symbols[i] && first === -1) {
            first = i;
        }
    }
    const promises = [];
    for (let i = 0; i < symbols.length; i++) {
        if (!symbols[i]) {
            // promises.push({ data: { symbolIndex: { index: i } } });
            continue;
        }
        // 用来在 VectorPack 中生成 symbolIndex
        symbols[i].index = { index: i };
        let packFeatures = features;
        if (isLine && symbols[i].mergeOnProperty) {
            const fnTypes = VectorPack.genFnTypes(symbols[i]);
            packFeatures = LinePack.mergeLineFeatures(features, symbols[0], fnTypes, options.zoom);
        }
        if (!parsed[i]) {
            if (i === first) {
                promises.push(new clazz(packFeatures, symbols[i], options).load(scale));
            } else {
                promises.push({ data: { ref: first, symbolIndex: { index: i } } });
            }
        } else {
            promises.push(new clazz(packFeatures, symbols[i], options).load(scale));
        }
    }
    return Promise.all(promises);
}

function hasFnTypeKeys(symbol) {
    if (!symbol) {
        return 0;
    }
    for (const p in symbol) {
        if (isFnTypeSymbol(symbol[p])) {
            return 1;
        }
    }
    return 0;
}

function cloneFeaAndAppendCustomTags(features, zoom, pluginConfig, customProps) {
    const customProperties = pluginConfig.customProperties;
    if (!customProperties) {
        return features;
    }
    if (customProperties) {
        for (let i = 0; i < customProperties.length; i++) {
            customProperties[i].fn = FilterUtil.compileFilter(customProperties[i].filter);
        }
    }
    for (let j = 0; j < customProperties.length; j++) {
        for (let i = 0, l = features.length; i < l; i++) {
            if (customProperties[j].fn(features[i], zoom)) {
                for (const p in customProperties[j].properties) {
                    const v = customProperties[j].properties[p];
                    if (isNil(v)) {
                        continue;
                    }
                    if (!customProps[i]) {
                        customProps[i] = {};
                    }
                    if (!customProps[i][p]) {
                        customProps[i][p] = new Set();
                    }
                    customProps[i][p].add(v);
                }
            }
        }
    }
}

const proxyGetter0 = {
    get (obj, prop) {
        return prop in obj ? obj[prop] : obj.originalFeature[prop];
    },
    has(obj, key) {
        return (key in obj) || (key in obj.originalFeature);
    }
};

const proxyGetter1 = {
    get: function(obj, prop) {
        return prop in obj ? obj[prop] : obj[oldPropsKey][prop];
    },
    has(obj, key) {
        return (key in obj) || (key in obj[oldPropsKey]);
    }
};

const EMPTY_PROPS = {};

function proxyFea(feature) {
    const fea = {};
    fea.originalFeature = feature;
    const result = new Proxy(fea, proxyGetter0);
    result.properties = new Proxy({}, proxyGetter1);
    result.properties[oldPropsKey] = feature.properties || EMPTY_PROPS;
    return result;
}

function addFnTypeProp(props, i, property) {
    if (!props[i]) {
        props[i] = new Set();
    }
    props[i].add(property);
}

const EMPTY_ARRAY = [];
function getFnTypeProps(symbol, props, i) {
    if (!symbol) {
        return EMPTY_ARRAY;
    }
    for (const p in symbol) {
        // 只保留支持zoom fn-type的样式属性，其他的属性忽略掉
        if (!symbol[p] || !StyleUtil.checkIfZoomFnTypeSymbol(p)) {
            continue;
        }
        if (isFnTypeSymbol(symbol[p])) {
            addFnTypeProp(props, i, symbol[p].property);
        } else if (p === 'lineGradientProperty') {
            addFnTypeProp(props, i, symbol[p]);
            continue;
        } else if (p === 'textName') {
            // 返回 textName 中可能用到的属性名
            if (isString(symbol[p])) {
                const vars = TextUtil.resolveVarNames(symbol[p]);
                if (vars) {
                    for (let j = 0; j < vars.length; j++) {
                        addFnTypeProp(props, i, vars[j]);
                    }
                }
            } else if (FilterUtil.isExpression(symbol[p])) {
                const vars = [];
                TextUtil.resolveExpVarNames(vars, symbol[p]);
                for (let j = 0; j < vars.length; j++) {
                    addFnTypeProp(props, i, vars[j]);
                }
            }
        }
        const stops = symbol[p].stops;
        if (stops && stops.length) {
            for (let i = 0; i < stops.length; i++) {
                if (isFnTypeSymbol(stops[i][1])) {
                    addFnTypeProp(props, i, stops[i][1].property);
                }
            }
        }

    }
    return props[i];
}
