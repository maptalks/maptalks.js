import { extend, getIndexArrayType, compileStyle, isString, isObject, isNumber } from '../../common/Util';
import { buildWireframe, build3DExtrusion } from '../builder/';
import { PolygonPack, NativeLinePack, LinePack, PointPack, NativePointPack } from '@maptalks/vector-packer';
// import { GlyphRequestor } from '@maptalks/vector-packer';
import Promise from '../../common/Promise';
import distinctColors from '../../common/Colors';
import { createFilter } from '@maptalks/feature-filter';
import { KEY_IDX } from '../builder/Constant';
// import Browser from '../util/Browser';

// let FONT_CANVAS;

export default class BaseLayerWorker {
    constructor(id, options, upload) {
        this.id = id;
        this.options = options;
        this.upload = upload;
        this._compileStyle(options.style || []);
        this.requests = {};
        this._styleCounter = 0;
    }

    updateStyle(style, cb) {
        this.options.style = style;
        this._compileStyle(style || []);
        this._styleCounter++;
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
        const url = context.tileInfo.url;
        this.requests[url] = this.getTileFeatures(context.tileInfo, (err, features, layers) => {
            if (this.checkIfCanceled(url)) {
                delete this.requests[url];
                cb(null, { canceled: true });
                return;
            }
            if (err) {
                delete this.requests[url];
                cb(err);
                return;
            }
            if (!features || features.length === 0) {
                delete this.requests[url];
                cb();
                return;
            }
            this._createTileData(layers, features, context).then(data => {
                if (data.canceled || this.checkIfCanceled(url)) {
                    delete this.requests[url];
                    cb(null, { canceled: true });
                    return;
                }
                delete this.requests[url];
                data.data.style = this._styleCounter;
                cb(null, data.data, data.buffers);
            });
        });
    }

    abortTile(url, cb) {
        delete this.requests[url];
        cb();
    }

    checkIfCanceled(url) {
        return !this.requests[url];
    }

    fetchIconGlyphs(icons, glyphs, cb) {
        //2019-03-20 win10 chrome 74 64位，OffscreenCanvas fillText性能只有主线程的10%，还不可用
        // if (glyphs && Browser.offscreenCanvas) {
        //     this._glyphRequestor = new GlyphRequestor();
        //     this._glyphRequestor.getGlyphs(glyphs, cb);
        // } else {
        //command, params, buffers and callback
        this.upload('fetchIconGlyphs', { icons, glyphs }, null, cb);
        // }
    }

    _createTileData(layers, features, { glScale, zScale, tileInfo }) {
        if (!features.length) {
            return Promise.resolve({
                data: null,
                buffers: []
            });
        }
        const useDefault = !this.options.style.length;
        let pluginConfigs = this.pluginConfig;
        if (useDefault) {
            //图层没有定义任何style，通过数据动态生成pluginConfig
            pluginConfigs = this._updateLayerPluginConfig(layers);
        }
        const EXTENT = features[0].extent;
        const zoom = tileInfo.z,
            data = [],
            pluginIndexes = [],
            options = this.options,
            buffers = [];
        const promises = [
            Promise.resolve(this._styleCounter)
        ];
        for (let i = 0; i < pluginConfigs.length; i++) {
            const pluginConfig = pluginConfigs[i];
            const { tileFeatures, tileFeaIndexes } = this._filterFeatures(pluginConfig.filter, features, i);

            if (!tileFeatures.length) {
                continue;
            }
            const maxIndex = tileFeaIndexes[tileFeaIndexes.length - 1];
            const arrCtor = getIndexArrayType(maxIndex);
            data[i] = {
                //[feature_index, style_index, ...]
                styledFeatures: new arrCtor(tileFeaIndexes)
            };
            //index of plugin with data
            pluginIndexes.push(i);
            buffers.push(data[i].styledFeatures.buffer);
            let promise = this._createTileGeometry(tileFeatures, pluginConfig, { extent: EXTENT, glScale, zScale, zoom });
            if (useDefault) {
                promise = promise.then(tileData => {
                    if (tileData.data) {
                        tileData.data.layer = tileFeatures[0].layer;
                    } else if (Array.isArray(tileData)) {
                        for (let i = 0; i < tileData.length; i++) {
                            if (tileData[i].data) tileData[i].data.layer = tileFeatures[0].layer;
                        }
                    }

                    return tileData;
                });
            }
            promises.push(promise);
        }

        return Promise.all(promises).then(([styleCount, ...tileDatas]) => {
            function handleTileData(tileData, i) {
                tileData.data.type = pluginConfigs[pluginIndexes[i]].renderPlugin.dataConfig.type;
                tileData.data.filter = pluginConfigs[pluginIndexes[i]].filter.def;

                if (tileData.buffers && tileData.buffers.length) {
                    for (let i = 0; i < tileData.buffers.length; i++) {
                        buffers.push(tileData.buffers[i]);
                    }
                }
            }

            if (styleCount !== this._styleCounter) {
                return { canceled: true };
            }

            for (let i = 0; i < tileDatas.length; i++) {
                if (!tileDatas[i]) {
                    continue;
                }
                const tileData = tileDatas[i];
                if (Array.isArray(tileData)) {
                    const datas = [];
                    for (let ii = 0; ii < tileData.length; ii++) {
                        handleTileData(tileData[ii], i);
                        datas.push(tileData[ii].data);
                    }
                    data[pluginIndexes[i]].data = datas;
                } else {
                    handleTileData(tileData, i);
                    data[pluginIndexes[i]].data = tileData.data;
                }

            }
            const allFeas = [];
            const schema = layers;
            if (options.features || options.schema) {
                let feature;
                for (let i = 0, l = features.length; i < l; i++) {
                    feature = features[i];
                    if (!schema[feature.layer].properties) {
                        schema[feature.layer].properties = getPropTypes(feature.properties);
                    }

                    if (options.features) {
                        //reset feature's marks
                        if (feature && feature[KEY_IDX] !== undefined) {
                            delete feature[KEY_IDX];
                            delete feature._styleMark;
                            if (options.features === 'id') {
                                allFeas.push(feature.id);
                            } else {
                                const o = extend({}, feature);
                                if (!options.pickingGeometry) {
                                    delete o.geometry;
                                }
                                delete o.extent;
                                allFeas.push(o);
                            }
                        } else {
                            //use '' instead of null, to reduce feature string size
                            allFeas.push('');
                        }
                    }
                }
            }
            return {
                data: {
                    schema,
                    data,
                    extent: EXTENT,
                    features: allFeas
                },
                buffers
            };
        });

    }

    _createTileGeometry(features, pluginConfig, context) {
        const dataConfig = pluginConfig.renderPlugin.dataConfig;
        const symbol = pluginConfig.symbol;

        const tileSize = this.options.tileSize[0];
        const { extent, glScale, zScale, zoom } = context;
        const type = dataConfig.type;
        if (type === '3d-extrusion') {
            return Promise.resolve(build3DExtrusion(features, dataConfig, extent, glScale, zScale, this.options['tileSize'][1]));
        } else if (type === '3d-wireframe') {
            return Promise.resolve(buildWireframe(features, dataConfig, extent));
        } else if (type === 'point') {
            const options = extend({}, dataConfig, {
                EXTENT: extent,
                requestor: this.fetchIconGlyphs.bind(this),
                zoom
            });
            const symbols = splitPointSymbol(symbol);
            const scale = extent / tileSize;
            return Promise.all(symbols.map(s => new PointPack(features, s, options).load(scale)));
            // const pack = new PointPack(features, symbol, options);
            // return pack.load(extent / tileSize);
        } else if (type === 'native-point') {
            const options = extend({}, dataConfig, {
                EXTENT: extent,
                zoom
            });
            const pack = new NativePointPack(features, symbol, options);
            return pack.load(extent / tileSize);
        } else if (type === 'line') {
            const options = extend({}, dataConfig, {
                EXTENT: extent,
                requestor: this.fetchIconGlyphs.bind(this),
                zoom
            });
            const pack = new LinePack(features, symbol, options);
            return pack.load();
        } else if (type === 'native-line') {
            const options = extend({}, dataConfig, {
                EXTENT: extent,
                zoom
            });
            const pack = new NativeLinePack(features, symbol, options);
            return pack.load();
        } else if (type === 'fill') {
            const options = extend({}, dataConfig, {
                EXTENT: extent,
                requestor: this.fetchIconGlyphs.bind(this),
                zoom
            });
            const pack = new PolygonPack(features, symbol, options);
            return pack.load();
        }
        return Promise.resolve({
            data: {},
            buffers: null
        });
    }

    /**
     * Filter
     * @param {*} filter
     * @param {*} features
     */
    _filterFeatures(filter, features) {
        const indexes = [];
        const filtered = [];
        const l = features.length;
        for (let i = 0; i < l; i++) {
            //filter.def没有定义，或者为default时，说明其实默认样式，feature之前没有其他样式时的应用样式
            if ((!filter.def || filter.def === 'default') && !features[i]._styleMark ||
                (filter.def === true || Array.isArray(filter.def) && filter(features[i]))) {
                features[i][KEY_IDX] = i;
                features[i]._styleMark = 1;
                filtered.push(features[i]);
                indexes.push(i);
            }
        }
        return {
            tileFeatures: filtered,
            tileFeaIndexes: indexes
        };
    }

    _compileStyle(layerStyle) {
        this.pluginConfig = compileStyle(layerStyle);
        for (let i = 0; i < layerStyle.length; i++) {
            if (this.pluginConfig[i].filter) {
                this.pluginConfig[i].filter.def = layerStyle[i].filter ? (layerStyle[i].filter.value || layerStyle[i].filter) : undefined;
            }
        }
    }

    _updateLayerPluginConfig(layers) {
        let plugins = this._layerPlugins;
        if (!this._layerPlugins) {
            plugins = this._layerPlugins = {};
        }
        const framePlugins = [];
        for (const p in layers) {
            const layer = p;
            const type = Math.min(...layers[p].types);
            if (!plugins[layer]) {
                const def = ['==', '$layer', layer];
                plugins[layer] = {
                    filter: createFilter(def),
                    renderPlugin: getDefaultRenderPlugin(type),
                    symbol: getDefaultSymbol(type)
                };
                plugins[layer].filter.def = def;
            }
            framePlugins.push(plugins[layer]);
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
//         mat4.scale(tileMatrix, tileMatrix, [tileSize[0] / EXTENT, tileSize[1] / EXTENT, 1]);

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
                type: 'native-point'
            }
        };
    case 2:
        return {
            type: 'native-line',
            dataConfig: {
                type: 'native-line'
            }
        };
    case 3:
        return {
            type: 'fill',
            dataConfig: {
                type: 'fill'
            }
        };
    }
    return null;
}

let COLOR_INCRE = 0;

function getDefaultSymbol(type) {
    const length = distinctColors.length;
    const color = distinctColors[COLOR_INCRE++ % length];
    switch (type) {
    case 1:
        return {
            markerFill: color,
            markerSize: 10
        };
    case 2:
        return {
            lineColor: color
        };
    case 3:
        return {
            polygonFill: color
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

function splitPointSymbol(symbol) {
    let iconSymbol = null;
    let textSymbol = null;
    for (const name in symbol) {
        if (name.indexOf('marker') === 0) {
            iconSymbol = iconSymbol || {};
            iconSymbol[name] = symbol[name];
        } else if (name.indexOf('text') === 0) {
            textSymbol = textSymbol || {};
            textSymbol[name] = symbol[name];
        }
    }
    const results = [];
    if (iconSymbol) results.push(iconSymbol);
    if (textSymbol) {
        if (iconSymbol) {
            //用marker的placement和spacing 覆盖文字的
            textSymbol['textPlacement'] = iconSymbol['markerPlacement'];
            textSymbol['textSpacing'] = iconSymbol['markerSpacing'];
            textSymbol['isIconText'] = true;
        }
        results.push(textSymbol);
    }
    return results;
}
