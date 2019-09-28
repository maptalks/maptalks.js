import Point from '@mapbox/point-geometry';
import convert from './util/convert';
import IconAtlas from './atlas/IconAtlas';
import GlyphAtlas from './atlas/GlyphAtlas';
import Promise from './util/Promise';
import { getIndexArrayType, fillTypedArray, getFormatWidth, getPosArrayType } from './util/array';
import { RGBAImage, AlphaImage } from '../Image';
import convertGeometry from './util/convert_geometry';
import { extend } from '../style/Util';
import { loadFunctionTypes } from '@maptalks/function-type';
import { createFilter } from '@maptalks/feature-filter';

//feature index defined in BaseLayerWorker
export const KEY_IDX = '__fea_idx';

/**
 * abstract class for all vector packs
 */
export default class VectorPack {
    constructor(features, symbol, options) {
        //TODO 预先把altitude传到pack里来？
        this.options = options;
        this.features = this._check(features);
        this.symbolDef = symbol;
        this.symbol = loadFunctionTypes(symbol, () => {
            return [options.zoom];
        });
        //TODO 数据只包含二维数据时，也认为是only2D
        this.positionSize = options['only2D'] ? 2 : 3;
        this.styledVectors = [];
        this.properties = {};
    }

    _check(features) {
        if (!features.length) {
            return features;
        }
        const first = features[0];
        let checked;
        if (Array.isArray(first.geometry) && first.properties) {
            let g = first.geometry[0];
            while (Array.isArray(g)) {
                g = g[0];
            }
            if (g instanceof Point) {
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
                        fea[KEY_IDX] = feature[KEY_IDX];
                        checked.push(fea);
                    }
                }
            }
        }

        const orders = this.options.order;
        if (orders) {
            const orderFilters = [];
            //顺序与
            for (let i = 0; i < orders.length; i++) {
                if (!orders[i]) {
                    continue;
                }
                orderFilters.push(createFilter(orders[i]));
            }
            checked = checked.sort((a, b) => {
                const l = orderFilters.length;
                let ia = l;
                let ib = l;
                for (let i = 0; i < l; i++) {
                    if (orderFilters[i](a)) {
                        ia = i;
                    }
                    if (orderFilters[i](b)) {
                        ib = i;
                    }
                    if (ia < l && ib < l) {
                        break;
                    }
                }
                return ia - ib;
            });
        }
        return checked;
    }

    load(scale = 1) {
        const vectors = this.styledVectors;
        this.count = 0;
        const features = this.features;
        if (!features || !features.length) return Promise.resolve();
        const iconReqs = {}, glyphReqs = {};
        const options = { zoom: this.options.zoom };
        const symbol = this.symbolDef;
        for (let i = 0, l = features.length; i < l; i++) {
            const feature = features[i];
            const styledVector = this.createStyledVector(feature, symbol, options, iconReqs, glyphReqs);
            if (!styledVector) {
                continue;
            }
            this.count++;
            styledVector.featureIdx = feature[KEY_IDX] === undefined ? i : feature[KEY_IDX];
            vectors.push(styledVector);
        }

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

                resolve(this.pack(scale));
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
        pack.properties = this.properties;
        const buffers = pack.buffers;
        delete pack.buffers;
        const vectorPack = {
            data: pack, buffers,
        };

        if (this.iconAtlas) {
            //icon纹理
            vectorPack.data.iconAtlas = serializeAtlas(this.iconAtlas);
            buffers.push(vectorPack.data.iconAtlas.image.data.buffer);
        }

        if (this.glyphAtlas) {
            //文字纹理
            vectorPack.data.glyphAtlas = serializeAtlas(this.glyphAtlas);
            buffers.push(vectorPack.data.glyphAtlas.image.data.buffer);
        }

        return vectorPack;
    }

    createDataPack(vectors, scale) {
        if (!vectors || !vectors.length) {
            return null;
        }
        this.maxIndex = 0;
        this.maxPos = 0;
        const data = this.data = [];
        let elements = this.elements = [];
        //uniforms: opacity, u_size_t

        const format = this.getFormat(vectors[0].symbol);
        const formatWidth = this.formatWidth = getFormatWidth(format);
        //每个顶点的feature index, 用于构造 pickingId
        let featureIndexes = [];
        let maxFeaIndex = 0;
        for (let i = 0, l = vectors.length; i < l; i++) {
            const eleCount = data.length;
            const properties = vectors[i].feature && vectors[i].feature.properties;
            properties['$layer'] = vectors[i].feature.layer;
            properties['$type'] = vectors[i].feature.type;
            this.placeVector(vectors[i], scale, formatWidth);
            delete properties['$layer'];
            delete properties['$type'];
            const count = (data.length - eleCount) / formatWidth;
            //fill feature index of every data
            for (let ii = 0; ii < count; ii++) {
                featureIndexes.push(vectors[i].featureIdx);
            }
            maxFeaIndex = Math.max(maxFeaIndex, vectors[i].featureIdx);
        }
        if (!elements.length) {
            return null;
        }
        const ArrType = getIndexArrayType(maxFeaIndex);
        featureIndexes = new ArrType(featureIndexes);

        //update aPosition's type
        format[0].type = getPosArrayType(this.maxPos);

        const arrays = fillTypedArray(format, data);
        arrays.aPickingId = featureIndexes;

        const buffers = [];
        for (const p in arrays) {
            buffers.push(arrays[p].buffer);
        }

        const ElementType = getIndexArrayType(this.maxIndex);
        elements = new ElementType(elements);
        buffers.push(elements.buffer);
        return {
            data: arrays,
            // format,
            indices: elements,
            positionSize: this.positionSize,
            buffers
        };
    }

    addElements(...e) {
        this.maxIndex = Math.max(this.maxIndex, ...e);
        this.elements.push(...e);
    }
}

function serializeAtlas(atlas) {
    let positions = atlas.positions;
    let format = 'alpha';
    if (atlas instanceof IconAtlas) {
        positions = {};
        for (const p in atlas.positions) {
            const pos = atlas.positions[p];
            positions[p] = {
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
        positions: positions
    };
}
