import Point from '@mapbox/point-geometry';
import convert from './util/convert';
import IconAtlas from './atlas/IconAtlas';
import GlyphAtlas from './atlas/GlyphAtlas';
import Promise from './util/Promise';
import { getIndexArrayType, fillTypedArray, getFormatWidth, getPosArrayType } from './util/array';
import { RGBAImage, AlphaImage } from '../Image';
import convertGeometry from './util/convert_geometry';
import { extend } from '../style/Util';

//feature index defined in BaseLayerWorker
const KEY_IDX = '__fea_idx';
//style index defined in BaseLayerWorker
const STLYE_IDX = '__style_idx';

/**
 * abstract class for all vector packs
 */
export default class VectorPack {
    constructor(features, styles, options) {
        //TODO 预先把altitude传到pack里来？
        this._checkStyles(styles);
        this.features = this._check(features);
        this.styles = styles;
        this.options = options;
        this.styledVectors = [];
        // this.featureGroup = [];
    }

    _check(features) {
        if (!features.length) {
            return features;
        }
        const first = features[0];
        if (Array.isArray(first.geometry) && first.properties) {
            let g = first.geometry[0];
            while (Array.isArray(g)) {
                g = g[0];
            }
            if (g instanceof Point) {
                //a converted one
                return features;
            }
        }
        const checked = [];
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
                    fea[STLYE_IDX] = feature[STLYE_IDX];
                    fea[KEY_IDX] = feature[KEY_IDX];
                    checked.push(fea);
                }
            }
        }
        return checked;
    }

    _checkStyles(styles) {
        for (let i = 0; i < styles.length; i++) {
            const s = styles[i];
            if (!s['symbol']) throw new Error(`Invalid symbol at ${i}.`);
        }
    }

    load(scale = 1) {
        const styledVectors = this.styledVectors = [];
        // const featureGroup = this.featureGroup = [];
        this.count = 0;
        const features = this.features;
        if (!features || !features.length) return Promise.resolve();
        const styles = this.styles;
        const iconReqs = {}, glyphReqs = {};
        const options = { zoom : this.options.zoom };
        for (let i = 0, l = features.length; i < l; i++) {
            const feature = features[i];
            let styleIdx = feature[STLYE_IDX];
            if (styleIdx === undefined) {
                for (let ii = 0; ii < styles.length; ii++) {
                    if (styles[ii].filter(feature)) {
                        styleIdx = ii;
                        break;
                    }
                }
            }
            const style = styles[styleIdx];
            if (!style) {
                continue;
            }
            const vectors = styledVectors[styleIdx] = styledVectors[styleIdx] || [];
            // const feas = featureGroup[styleIdx] = featureGroup[styleIdx] || [];
            // feas.push(i);
            const symbol = style.symbol;
            if (Array.isArray(symbol)) {
                for (let ii = 0; ii < symbol.length; ii++) {
                    this.count++;
                    vectors[ii] = vectors[ii] || [];
                    const styledVector = this.createStyledVector(feature, symbol[ii], options, iconReqs, glyphReqs);
                    //KEY_IDX是feature在数组中的序号，在BaseLayerWorker中设置
                    styledVector.featureIdx = feature[KEY_IDX] === undefined ? i : feature[KEY_IDX];
                    vectors[ii].push(styledVector);
                }
            } else {
                this.count++;
                const styledVector = this.createStyledVector(feature, symbol, options, iconReqs, glyphReqs);
                styledVector.featureIdx = feature[KEY_IDX] === undefined ? i : feature[KEY_IDX];
                vectors.push(styledVector);
            }
        }

        return new Promise((resolve, reject) => {
            this.fetchAtlas(iconReqs, glyphReqs, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                // debugger
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
        const me = this;
        const styles = this.styles;
        const packs = [], meshes = [], buffers = [], saved = {};

        //创建datapack
        function create(key, vector, symbol) {
            let pack;
            if (saved[key] === undefined) {
                pack = me.createDataPack(vector, scale);
                if (pack) {
                    saved[key] = packs.length;
                    packs.push(pack);
                    buffers.push(...pack.buffers);
                    delete pack.buffers;
                } else {
                    saved[key] = null;
                }
            } else {
                //filterKey相同，即filter相同的pack已经创建过，无需再次创建
                pack = packs[saved[key]];
            }
            if (!pack) return;
            meshes.push({
                pack : saved[key],
                symbol
            });
        }

        for (let i = 0; i < this.styles.length; i++) {
            const symbol = styles[i].symbol;
            const key = styles[i].filterKey;
            const vectors = this.styledVectors[i];
            if (!vectors || !vectors.length) continue;
            if (Array.isArray(symbol)) {
                for (let ii = 0; ii < symbol.length; ii++) {
                    if (!vectors[ii] || !vectors[ii].length) continue;
                    create(key, vectors[ii], symbol[ii]);
                }
            } else {
                create(key, vectors, symbol, key);
            }
        }

        const vectorPack = {
            data : { packs, meshes }, buffers,
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

        let featureIndexes = [];
        let maxFeaIndex = 0;
        for (let i = 0, l = vectors.length; i < l; i++) {
            const eleCount = elements.length;
            this.placeVector(vectors[i], scale, formatWidth);
            const count = elements.length - eleCount;
            //fill feature index of every data
            for (let ii = 0; ii < count; ii++) {
                featureIndexes[elements[eleCount + ii]] = vectors[i].featureIdx;
            }
            maxFeaIndex = Math.max(maxFeaIndex, vectors[i].featureIdx);
        }
        const ArrType = getIndexArrayType(maxFeaIndex);
        featureIndexes = new ArrType(featureIndexes);

        //update aPosition's type
        format[0].type = getPosArrayType(this.maxPos);

        const arrays = fillTypedArray(format, data);
        arrays.featureIndexes = featureIndexes;

        const buffers = [];
        for (const p in arrays) {
            buffers.push(arrays[p].buffer);
        }

        const ElementType = getIndexArrayType(this.maxIndex);
        elements = new ElementType(elements);
        buffers.push(elements.buffer);
        return {
            data : arrays,
            // format,
            indices : elements,
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
                tl : pos.tl,
                br : pos.br,
                displaySize : pos.displaySize
            };
        }
        format = 'rgba';
    }
    const image = atlas.image;
    return {
        image : {
            width : image.width,
            height : image.height,
            data : image.data,
            format
        },
        positions : positions
    };
}
