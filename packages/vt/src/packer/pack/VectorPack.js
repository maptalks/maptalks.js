import convert from './util/convert';
import IconAtlas from './atlas/IconAtlas';
import GlyphAtlas from './atlas/GlyphAtlas';
import { getIndexArrayType, fillTypedArray, getPosArrayType, getUnsignedArrayType } from './util/array';
import { RGBAImage, AlphaImage } from '../Image';
import convertGeometry from './util/convert_geometry';
import { extend, isNil } from '../style/Util';
import { loadFunctionTypes, interpolated, piecewiseConstant } from '@maptalks/function-type';
import { isFnTypeSymbol, isNumber, hasOwn } from '../style/Util';
import { getHeightValue, generatePickingIndiceIndex } from './util/util';
import StyledVector from './StyledVector';
import { packPosition/*, unpackPosition*/ } from './util/pack_position';
import { compileFilter, isExpression, createExpression, getExpressionType, isInterpolated } from '../style/Filter';
import ArrayPool from './util/ArrayPool';

//feature index defined in BaseLayerWorker
export const KEY_IDX = '__fea_idx';

const TEMP_PACK_POS = [];

const params = {};
const feature = {};
const featureState = {};
const availableImages = [];

const arrayPool = ArrayPool.getInstance();

let textAngleWarned = false;

const ALTITUDE_LIMIT = Math.pow(2, 17);
/**
 * abstract class for all vector packs
 */
export default class VectorPack {

    static isAtlasLoaded(res, atlas = {}) {
        const { iconAtlas } = atlas;
        if (res) {
            if (!iconAtlas || !iconAtlas.positions[res]) {
                return false;
            }
        }
        return true;
    }

    static genFnTypes(symbolDef) {
        const fnTypes = {};
        for (const p in symbolDef) {
            if (isExpression(symbolDef[p])) {
                const fn0KeyName = (p + '_Fn_0').trim();
                const fnKeyName = (p + 'Fn').trim();
                const type = getExpressionType(p);
                fnTypes[fn0KeyName] = createExpression(symbolDef[p], type);
                fnTypes[fnKeyName] = (zoom, properties) => {
                    params.zoom = zoom;
                    feature.properties = properties;
                    let v;
                    try {
                        v = fnTypes[fn0KeyName].evaluateWithoutErrorHandling(params, feature, featureState, null, availableImages);
                    } catch (err) {
                        return null;
                    }
                    return v;
                };
            } else if (isFnTypeSymbol(symbolDef[p])) {
                const fn0KeyName = (p + '_Fn_0').trim();
                const fnKeyName = (p + 'Fn').trim();
                if (isInterpolated(p)) {
                    fnTypes[fn0KeyName] = interpolated(symbolDef[p]);
                    fnTypes[fnKeyName] = (zoom, properties) => {
                        const v = fnTypes[fn0KeyName](zoom, properties);
                        if (isFnTypeSymbol(v)) {
                            return interpolated(v)(zoom, properties);
                        } else {
                            return v;
                        }
                    }
                } else {
                    fnTypes[fn0KeyName] = piecewiseConstant(symbolDef[p]);
                    fnTypes[fnKeyName] = (zoom, properties) => {
                        const v = fnTypes[fn0KeyName](zoom, properties);
                        if (isFnTypeSymbol(v)) {
                            return piecewiseConstant(v)(zoom, properties);
                        } else {
                            return v;
                        }
                    }
                }
            }
        }
        return fnTypes;
    }

    constructor(features, symbol, options) {
        //TODO 预先把altitude传到pack里来？
        this.options = options;
        // if (!this.options['center']) {
        //     this.options['center'] = [0, 0];
        // }
        const params = [];
        this.symbolDef = symbol;
        this.symbol = loadFunctionTypes(symbol, () => {
            params[0] = options.zoom;
            return params;
        });
        this.styledVectors = [];
        this.properties = {};
        this._fnTypes = options.fnTypes || VectorPack.genFnTypes(this.symbolDef);
        if (isFnTypeSymbol(this.symbolDef['visible'])) {
            this._visibleFn = interpolated(this.symbolDef['visible']);
        }
        if (options.atlas) {
            this.iconAtlas = options.atlas.iconAtlas;
            this.glyphAtlas = options.atlas.glyphAtlas;
        }
        this.features = this._check(features);
    }

    needAltitudeAttribute() {
        // 只有当positionType为Int16Array时，才适用默认的packPosition逻辑
        // 如果positionType是Float32时，就必须添加aAltitude属性
        const maxZValue = Math.max(Math.abs(this.maxPosZ), Math.abs(this.minPosZ));
        return this.options['forceAltitudeAttribute'] || maxZValue >= ALTITUDE_LIMIT || this.options.positionType === Float32Array;
    }

    getPositionFormat() {
        if (this.needAltitudeAttribute()) {
            return [
                {
                    type: Int16Array,
                    width: 2,
                    name: 'aPosition'
                },
                {
                    type: Float32Array,
                    width: 1,
                    name: 'aAltitude'
                }
            ];
        } else {
            return [
                {
                    type: Float32Array,
                    width: 3,
                    name: 'aPosition'
                }
            ];
        }
    }

    fillPosition(data, x, y, altitude) {
        if (x < this._minX) {
            this._minX = x;
        }
        if (x > this._maxX) {
            this._maxX = x;
        }
        if (y < this._minY) {
            this._minY = y;
        }
        if (y > this._maxY) {
            this._maxY = y;
        }
        // 乘以100是把米转为厘米
        if (this.needAltitudeAttribute()) {
            let index = data.aPosition.currentIndex;
            data.aPosition[index++] = x;
            data.aPosition[index++] = y;
            data.aPosition.currentIndex = index;

            index = data.aAltitude.currentIndex;
            data.aAltitude[index++] = altitude;
            data.aAltitude.currentIndex = index;

            // data.aPosition.push(x, y);
            // data.aAltitude.push(altitude);
        } else {
            packPosition(TEMP_PACK_POS, x, y, altitude);
            let index = data.aPosition.currentIndex;
            data.aPosition[index++] = TEMP_PACK_POS[0];
            data.aPosition[index++] = TEMP_PACK_POS[1];
            data.aPosition[index++] = TEMP_PACK_POS[2];
            data.aPosition.currentIndex = index;
        }
    }

    _check(features) {
        if (!features.length) {
            return features;
        }
        const keyName = (KEY_IDX + '').trim();
        let i = 0;
        let first = features[i];
        while (!first.geometry) {
            i++;
            first = features[i];
        }
        let checked;
        if (Array.isArray(first.geometry) && first.properties) {
            let g = first.geometry[0];
            while (Array.isArray(g)) {
                g = g[0];
            }
            if (!isNil(g.x)) {
                //a converted one
                checked = features;
            }
        }
        if (!checked) {
            checked = [];
            if (Array.isArray(first.geometry)) {
                for (let i = 0; i < features.length; i++) {
                    const feature = features[i];
                    const fea = extend({}, feature);
                    checked.push(convertGeometry(fea));
                }
            } else {
                for (let i = 0; i < features.length; i++) {
                    const feature = features[i];
                    const feas = convert(feature);
                    for (let ii = 0; ii < feas.length; ii++) {
                        const fea = feas[ii];
                        fea[keyName] = feature[keyName];
                        checked.push(fea);
                    }
                }
            }
        }

        this.maxPosZ = 0;
        this.minPosZ = 0;
        if (!this.options['forceAltitudeAttribute']) {
            const isLinePlacement = this.symbolDef['textPlacement'] === 'line';
            let maxZ = -Infinity;
            let minZ = Infinity;
            let hasMapPitchAlign = false;
            const { textPitchAlignmentFn } = this._fnTypes;
            if (!textPitchAlignmentFn && isLinePlacement && this.symbolDef['textPitchAlignment'] === 'map') {
                hasMapPitchAlign = true;
            }
            const MINMAX = [];
            for (let i = 0; i < checked.length; i++) {
                const [minAltitude, maxAltitude]  = getMaxAltitude(MINMAX, checked[i] && checked[i].geometry);
                if (maxAltitude > maxZ) {
                    maxZ = maxAltitude;
                }
                if (minAltitude < minZ) {
                    minZ = minAltitude;
                }
                if (isLinePlacement && !hasMapPitchAlign && textPitchAlignmentFn && checked[i].properties) {
                    const pitchAlign = textPitchAlignmentFn(null, checked[i].properties);
                    if (pitchAlign === 'map') {
                        hasMapPitchAlign = pitchAlign;
                    }
                }
            }
            this.hasMapPitchAlign = hasMapPitchAlign;
            this.maxPosZ = maxZ === -Infinity ? 0 : maxZ;
            this.minPosZ = minZ === Infinity ? 0 : minZ;
        }

        const orders = this.options.order;
        if (orders) {
            const orderFilters = [];
            //顺序与
            for (let i = 0; i < orders.length; i++) {
                if (!orders[i]) {
                    continue;
                }
                orderFilters.push(compileFilter(orders[i]));
            }
            checked = checked.sort((a, b) => {
                const l = orderFilters.length;
                let ia = -1;
                let ib = -1;
                for (let i = 0; i < l; i++) {
                    if (orderFilters[i](a)) {
                        ia = i;
                    }
                    if (orderFilters[i](b)) {
                        ib = i;
                    }
                    if (ia >= 0 && ia < l && ib >= 0 && ib < l) {
                        break;
                    }
                }
                return ia - ib;
            });
        }
        return checked;
    }

    load(scale = 1) {
        // fix terser's bug
        const keyName = (KEY_IDX + '').trim();
        const keyNameDebug = ('_debug_info').trim();
        const fnTypes = this._fnTypes;
        const vectors = this.styledVectors;
        this.count = 0;
        const features = this.features;
        if (!features || !features.length) return Promise.resolve(null);
        const iconReqs = {}, glyphReqs = {};
        const options = { zoom: this.options.zoom, isVector3D: !!this.options.center };
        const params = [];
        const symbol = loadFunctionTypes(this.symbolDef, () => {
            params[0] = options.zoom;
            return params;
        });
        let i = 0, l = features.length;
        const debugIndex = this.options.debugIndex;
        try {
            for (; i < l; i++) {
                const feature = features[i];
                // let vector;
                // PointLayer中，Marker的symbol有多个时，properties就会是数组了，但这个设计并不是很好，需要调整
                // if (Array.isArray(feature.properties)) {
                //     vector = [];
                //     for (let j = 0; j < feature.properties.length; j++) {
                //         const fea = extend({}, feature);
                //         fea.properties = feature.properties[j];
                //         const v = this.createStyledVector(fea, symbol, options, iconReqs, glyphReqs);
                //         if (v) {

                //             vector.push(v);
                //         }
                //     }
                //     vector.featureIdx = feature[KEY_IDX] === undefined ? i : feature[KEY_IDX];
                //     if (!vector.length) {
                //         continue;
                //     }
                // } else {
                if (!feature || !feature.geometry) {
                    continue;
                }
                if (isNumber(debugIndex) && feature[keyNameDebug].index !== debugIndex) {
                    continue;
                }
                if (!feature.properties) {
                    feature.properties = {};
                }
                feature.properties['$layer'] = feature.layer;
                feature.properties['$type'] = feature.type;
                const vector = this.createStyledVector(feature, symbol, fnTypes, options, iconReqs, glyphReqs);
                if (!vector || !vector.feature.geometry) {
                    continue;
                }
                vector.featureIdx = feature[keyName] === undefined ? i : feature[keyName];

                // }
                this.count++;
                vectors.push(vector);
            }
        } catch (err) {
            return Promise.reject(err);
        }

        if (this.options['atlas']) {
            return Promise.resolve(this.pack(scale));
        }

        return this.loadAtlas(iconReqs, glyphReqs).then(() => {
            return this.pack(scale);
        });
    }

    loadAtlas(iconReqs, glyphReqs) {
        return new Promise((resolve, reject) => {
            this.fetchAtlas(iconReqs, glyphReqs, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (data) {
                    const { icons, glyphs } = data;
                    if (icons && Object.keys(icons).length) {
                        for (const url in icons) {
                            const icon = icons[url];
                            const { width, height, data } = icon.data;
                            icon.data = new RGBAImage({ width, height }, data);
                        }
                        this.iconAtlas = new IconAtlas(icons);
                    }
                    if (glyphs && Object.keys(glyphs).length) {
                        for (const font in glyphs) {
                            const glyph = glyphs[font];
                            for (const code in glyph) {
                                const sdf = glyph[code];
                                const { width, height, data } = sdf.bitmap;
                                sdf.bitmap = new AlphaImage({ width, height }, data);
                            }

                        }

                        this.glyphAtlas = new GlyphAtlas(glyphs);
                    }
                }

                resolve({ glyphAtlas: this.glyphAtlas, iconAtlas: this.iconAtlas });
                // resolve(this.iconAtlas, this.glyphAtlas);
            });
        });
    }

    fetchAtlas(iconReqs, glyphReqs, cb) {
        const needFetch = Object.keys(iconReqs).length > 0 || Object.keys(glyphReqs).length > 0;
        if (!needFetch) {
            cb();
            return;
        }
        this.options.requestor(iconReqs, glyphReqs, cb);
    }

    pack(scale) {
        if (!this.count) {
            return null;
        }
        if (scale === undefined || scale === null) {
            throw new Error('layout scale is undefined');
        }
        const pack = this.createDataPack(this.styledVectors, scale);
        if (!pack) {
            return null;
        }
        this.properties.minAltitude = this.minPosZ / 100;
        this.properties.maxAltitude = this.maxPosZ / 100;
        pack.properties = this.properties;
        if (this.empty) {
            pack.empty = true;
        }
        const buffers = pack.buffers;
        delete pack.buffers;
        const vectorPack = {
            data: pack, buffers,
        };

        if (this.iconAtlas) {
            //icon纹理
            const atlas = vectorPack.data.iconAtlas = serializeAtlas(this.iconAtlas);
            if (atlas.glyphMap) {
                for (const p in atlas.glyphMap) {
                    const map = atlas.glyphMap[p];
                    buffers.push(map.data.data.buffer);
                }
            }
            buffers.push(vectorPack.data.iconAtlas.image.data.buffer);
        }

        if (this.glyphAtlas) {
            //文字纹理
            vectorPack.data.glyphAtlas = serializeAtlas(this.glyphAtlas);
            buffers.push(vectorPack.data.glyphAtlas.image.data.buffer);
        }
        return vectorPack;
    }

    createStyledVector(feature, symbol, fnTypes, options) {
        return new StyledVector(feature, symbol, fnTypes, options);
    }

    createDataPack(vectors, scale) {
        if (!vectors || !vectors.length) {
            return null;
        }
        this.maxIndex = 0;
        this.maxPos = 0;
        this._minX = this._minY = Infinity;
        this._maxX = this._maxY = -Infinity;
        this.maxAltitude = 0;
        this.dynamicAttrs = {};
        const data = this.data = {};
        this._arrayPool = arrayPool;
        arrayPool.reset();
        // !! 这里是危险区域，需要格外注意：
        // 2024年06月，为了提升arrayPool中数组的性能，arrayPool.get方法范围的数组不再使用Proxy对array进行包装，导致array.length不再返回array中的数据条数，而是数组本身的大小。
        // 所以使用该类数组时，需要使用 array.getLength() 才能返回正确的数据条数，而用 array.length 会返回错误的值
        let elements = this.elements = arrayPool.get();
        //uniforms: opacity, u_size_t

        const format = this._dataFormat = this.getFormat(Array.isArray(vectors[0]) ? vectors[0][0].symbol : vectors[0].symbol);
        const positionSize = this.needAltitudeAttribute() ? 2 : 3;

        // 创建format各属性需要的类型数组
        for (let i = 0; i < format.length; i++) {
            data[format[i].name] = arrayPool.get(format[i].type);
        }
        //每个顶点的feature index, 用于构造 pickingId
        let feaIdxValues = arrayPool.get();
        let maxFeaIndex = 0;
        const featIds = arrayPool.get();
        let maxFeaId = 0;
        let hasNegative = false;
        let isIdUnique = true;
        const ids = new Set();

        for (let i = 0, l = vectors.length; i < l; i++) {
            if (!vectors[i].feature.geometry) {
                continue;
            }
            const feaId = Array.isArray(vectors[i]) ? vectors[i][0].feature.id : vectors[i].feature.id;

            if (isIdUnique) {
                if (feature.id !== undefined) {
                    if (ids) {
                        if (ids.has(feature.id)) {
                            isIdUnique = false;
                        } else {
                            ids.add(feature.id);
                        }
                    }
                } else {
                    isIdUnique = false;
                }
            }

            if (isNumber(feaId)) {
                if (Math.abs(feaId) > maxFeaId) {
                    maxFeaId = Math.abs(feaId);
                }
                if (feaId < 0) {
                    hasNegative = true;
                }
            }
            const eleCount = this.data.aPosition.getLength();
            if (!Array.isArray(vectors[i])) {
                this._placeVector(vectors[i], scale);
            } else {
                for (let j = 0; j < vectors[i].length; j++) {
                    this._placeVector(vectors[i][j], scale);
                }
            }
            const count = (data.aPosition.getLength() - eleCount) / positionSize;
            //fill feature index of every data
            for (let ii = 0; ii < count; ii++) {
                feaIdxValues.push(vectors[i].featureIdx);
                if (isNumber(feaId)) {
                    featIds.push(feaId);
                }
            }
            maxFeaIndex = Math.max(maxFeaIndex, vectors[i].featureIdx);
        }
        if (this.countOutOfAngle > 0 && !textAngleWarned) {
            textAngleWarned = true;
            console.warn('text anchor along line is ignored as anchor\'s line angle is bigger than textMaxAngle.');
        }
        if (this.hasElements() && !elements.getLength()) {
            return null;
        }
        const isVector3D = !!this.options.center;
        // maptalks/issues#541, Vector3D 时，因为数据会频繁修改，无法预知最终数量，aPickingId的类型固定为Float32Array，以适用所有情况
        const ArrType = isVector3D ? Float32Array : getUnsignedArrayType(maxFeaIndex);
        feaIdxValues = ArrayPool.createTypedArray(feaIdxValues, ArrType);

        if (this.options.positionType) {
            format[0].type = this.options.positionType;
        } else {
            //update aPosition's type
            format[0].type = getPosArrayType(this.maxPos);
        }
        const center = this.options.center;
        if (center && (center[0] || center[1])) {
            const aPosition = data.aPosition;
            const count = aPosition.getLength();
            for (let i = 0; i < count; i += positionSize) {
                aPosition[i] -= center[0];
                aPosition[i + 1] -= center[1];
            }
        }

        const arrays = fillTypedArray(format, data);
        // aPickingId中存放的featureIdx，即 KEY_IDX 属性里的值
        arrays.aPickingId = feaIdxValues;

        //因为 IS_2D_POSITION 会导致program切换，2位aPosition和3位aPosition的性能变化不大，所以不再执行only2D逻辑
        // if (!this.maxAltitude) {
        //     //only2D
        //     const positions = new arrays.aPosition.constructor(arrays.aPosition.length * 2 / 3);
        //     for (let i = 0; i < positions.length; i += 2) {
        //         positions[i] = arrays.aPosition[i / 2 * 3];
        //         positions[i + 1] = arrays.aPosition[i / 2 * 3 + 1];
        //     }
        //     arrays.aPosition = positions;
        // }

        const buffers = [];
        for (const p in arrays) {
            buffers.push(arrays[p].buffer);
        }

        const ElementType = getIndexArrayType(this.maxIndex);
        elements = ArrayPool.createTypedArray(elements, ElementType);

        buffers.push(elements.buffer);
        // 最终传递给主线程的数据结构
        const result = {
            data: arrays,
            isIdUnique,
            is2D: this.maxPosZ === 0 && this.minPosZ === 0,
            // format,
            indices: this.hasElements() ? elements : null,
            positionSize,
            positionBounding: [this._minX, this._minY, this._maxX, this._maxY],
            buffers,
            symbolIndex: this.symbolDef.index || { index: 0 },
            dynamicAttributes: this.dynamicAttrs
        };

        if (this._packMarkerPlacement) {
            result.markerPlacement = this._packMarkerPlacement;
        }
        if (this._packTextPlacement) {
            result.textPlacement = this._packTextPlacement;
        }

        if (featIds.getLength()) {
            const feaCtor = hasNegative ? getPosArrayType(maxFeaId) : getUnsignedArrayType(maxFeaId);
            // featureIds 里存放的是 feature.id
            result.featureIds = ArrayPool.createTypedArray(featIds, feaCtor);
            buffers.push(result.featureIds.buffer);
        } else {
            result.featureIds = [];
        }

        result.pickingIdIndiceMap = generatePickingIndiceIndex(feaIdxValues, result.indices);
        return result;
    }

    _placeVector(vector, scale) {
        const properties = vector.feature.properties;
        if (this._visibleFn && !this._visibleFn(this.options.zoom, properties)) {
            return;
        }
        this.placeVector(vector, scale, this.formatWidth);
    }

    addElements(e0, e1, e2) {
        this.maxIndex = Math.max(this.maxIndex, e0, e1, e2);
        let index = this.elements.currentIndex;
        this.elements[index++] = e0;
        this.elements[index++] = e1;
        this.elements[index++] = e2;
        this.elements.currentIndex = index;
    }

    hasElements() {
        return true;
    }

    getAltitude(properties) {
        const { altitudeProperty, defaultAltitude, altitudeScale } = this.options;
        let altitude = getHeightValue(properties, altitudeProperty, defaultAltitude);
        if (altitudeScale) {
            altitude *= altitudeScale;
        }
        this.maxAltitude = Math.max(this.maxAltitude, Math.abs(altitude));
        return altitude;
    }

    getIconAtlasMaxValue() {
        const positions = this.iconAtlas.positions;
        let max = 0;
        for (const p in positions) {
            if (hasOwn(positions, p)) {
                const { tl, displaySize } = positions[p];
                //w/h - 1 是为了把256宽实际存为255，这样可以用Uint8Array来存储宽度为256的值
                const m = Math.max(tl[0], tl[1], displaySize[0] - 1, displaySize[1] - 1);
                if (m > max) {
                    max = m;
                }
            }
        }
        return max;
    }

    ensureDataCapacity(countPerVertex, vertexCount) {
        const format = this._dataFormat;
        for (let i = 0; i < format.length; i++) {
            const array = this.data[format[i].name];
            if (!array) {
                continue;
            }
            const estimatedItemCount = format[i].width * countPerVertex;
            const length = array.getLength();
            this.data[format[i].name] = ArrayPool.ensureCapacity(array, length + estimatedItemCount * vertexCount);
        }
    }
}

function serializeAtlas(atlas) {
    let positions = atlas.positions;
    let format = atlas.image && atlas.image.format || 'alpha';
    if (atlas instanceof IconAtlas) {
        //iconAtlas中原属性用get方法实现，无法transfer，故遍历复制为普通对象
        positions = {};
        for (const p in atlas.positions) {
            const pos = atlas.positions[p];
            positions[p] = {
                paddedRect: pos.paddedRect,
                pixelRatio: pos.pixelRatio,
                tl: pos.tl,
                br: pos.br,
                displaySize: pos.displaySize
            };
        }
        format = 'rgba';
    }
    const image = atlas.image;
    return {
        image: {
            width: image.width,
            height: image.height,
            data: image.data,
            format
        },
        glyphMap: atlas.glyphMap,
        positions: positions
    };
}

function getMaxAltitude(out, geometry) {
    if (!geometry) {
        return 0;
    }
    let maxAltitude = -Infinity;
    let minAltitude = Infinity;
    const minMax = [];
    if (Array.isArray(geometry)) {
        for (let i = 0; i < geometry.length; i++) {
            if (Array.isArray(geometry[i])) {
                const [min, max] = getMaxAltitude(minMax, geometry[i]);
                if (max > maxAltitude) {
                    maxAltitude = max;
                }
                if (min < minAltitude) {
                    minAltitude = min;
                }
            } else {
                const alt = Math.abs(geometry[i].z || 0);
                if (alt > maxAltitude) {
                    maxAltitude = alt;
                }
                if (alt < minAltitude) {
                    minAltitude = alt;
                }
            }
        }
    } else {
        const alt = Math.abs(geometry.z || 0);
        if (alt > maxAltitude) {
            maxAltitude = alt;
        }
        if (alt < minAltitude) {
            minAltitude = alt;
        }
    }
    out[0] = minAltitude;
    out[1] = maxAltitude;
    return out;
}

