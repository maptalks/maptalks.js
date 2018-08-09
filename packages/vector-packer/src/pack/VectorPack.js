import convert from './util/convert';
import IconAtlas from './atlas/IconAtlas';
import GlyphAtlas from './atlas/GlyphAtlas';
import Promise from './util/Promise';
import SegmentVector from './SegmentVector';
import { getIndexArrayType, fillTypedArray, getFormatWidth, getPosArrayType } from './util/array';
import { RGBAImage, AlphaImage } from '../Image';

// 16bit unsigned int (short) in default
export const MAX_SEGMENTS_LENGTH = Math.pow(2, 16) - 1;

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
        this.featureGroup = [];
        this.segments = new SegmentVector();
    }

    _check(features) {
        if (!features.length) {
            return features;
        }
        const first = features[0];
        if (Array.isArray(first.geometry) && first.properties) {
            return features;
        }
        const checked = [];
        if (first.tags) {
            //TODO geojson-vt转化的feature转成vt feature
        } else {
            for (const feature of features) {
                const feas = convert(feature);
                for (const fea of feas) {
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

    load() {
        const styledVectors = this.styledVectors = [];
        const featureGroup = this.featureGroup = [];
        this.count = 0;
        const features = this.features;
        if (!features || !features.length) return Promise.resolve();
        const styles = this.styles;
        const iconReqs = {}, glyphReqs = {};
        const options = { minZoom : this.options.minZoom, maxZoom : this.options.maxZoom };
        for (let i = 0, l = features.length; i < l; i++) {
            const feature = features[i];
            let vectors, feas;
            for (let ii = 0; ii < styles.length; ii++) {
                vectors = styledVectors[ii] = styledVectors[ii] || [];
                feas = featureGroup[ii] = featureGroup[ii] || [];
                if (styles[ii].filter(feature)) {
                    feas.push(feature);
                    const symbol = styles[ii].symbol;
                    if (Array.isArray(symbol)) {
                        for (let iii = 0; iii < symbol.length; iii++) {
                            this.count++;
                            vectors[iii] = vectors[iii] || [];
                            vectors[iii].push(this.createStyledVector(feature, symbol[iii], options, iconReqs, glyphReqs));
                        }
                    } else {
                        this.count++;
                        vectors.push(this.createStyledVector(feature, symbol, options, iconReqs, glyphReqs));
                    }
                    break;
                }
            }
        }

        return new Promise((resolve, reject) => {
            this.fetchAtlas(iconReqs, glyphReqs, (err, icons, glyphs) => {
                if (err) {
                    reject(err);
                    return;
                }
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
                resolve(this.iconAtlas, this.glyphAtlas);
            });
        });
    }

    fetchAtlas(iconReqs, glyphReqs, cb) {
        //TODO 从主线程获取 IconAtlas 和 GlyphAtlas
        return this.options.requestor({ iconReqs, glyphReqs }, cb);
    }

    pack(scale) {
        if (!this.count) {
            return null;
        }
        if (scale === undefined || scale === null) {
            throw new Error('layout scale is undefined');
        }
        const styles = this.styles;
        const packs = [], buffers = [];
        for (let i = 0; i < this.styles.length; i++) {
            const symbol = styles[i].symbol;
            const vectors = this.styledVectors[i];
            if (!vectors || !vectors.length) continue;
            if (Array.isArray(symbol)) {
                for (let ii = 0; ii < symbol.length; ii++) {
                    if (!vectors[ii] || !vectors[ii].length) continue;
                    const pack = this.createDataPack(vectors[ii], scale);
                    if (!pack) continue;
                    const packBufs = pack.buffers;
                    delete pack.buffers;
                    packs.push(pack);
                    Array.prototype.push.apply(buffers, packBufs);
                }
            } else {
                const pack = this.createDataPack(this.styledVectors[i], scale);
                if (!pack) continue;
                const packBufs = pack.buffers;
                delete pack.buffers;
                packs.push(pack);
                Array.prototype.push.apply(buffers, packBufs);
            }
        }

        const vectorPack = {
            features : this.featureGroup,
            packs, buffers,
        };

        if (this.iconAtlas) {
            vectorPack.iconAtlas = serializeAtlas(this.iconAtlas);
            buffers.push(vectorPack.iconAtlas.image.data.buffer);
        }

        if (this.glyphAtlas) {
            vectorPack.glyphAtlas = serializeAtlas(this.glyphAtlas);
            buffers.push(vectorPack.glyphAtlas.image.data.buffer);
        }

        return vectorPack;
    }

    createDataPack(vectors, scale) {
        this.maxIndex = 0;
        this.maxPos = 0;
        const data = this.data = [];
        let elements = this.elements = [];
        const segments = this.segments = [{
            offset : 0,
            count : 0
        }];

        if (!vectors || !vectors.length) {
            return null;
        }
        //uniforms: opacity, u_size_t

        const format = this.getFormat(vectors[0].symbol),
            formatWidth = getFormatWidth(format);

        let featureIndex = [];
        for (let i = 0, l = vectors.length; i < l; i++) {
            this.placeVector(vectors[i], scale, formatWidth);
            featureIndex.push(data.length / formatWidth);
        }
        const ArrType = getIndexArrayType(data.length / formatWidth);
        featureIndex = new ArrType(featureIndex);

        format[0].type = getPosArrayType(this.maxPos);

        const arrays = fillTypedArray(format, data);
        const buffers = [];
        for (const p in arrays) {
            buffers.push(arrays[p].buffer);
        }
        buffers.push(featureIndex.buffer);

        const ElementType = getIndexArrayType(this.maxIndex);
        elements = new ElementType(elements);
        buffers.push(elements.buffer);
        return {
            data : arrays,
            format,
            elements,
            segments,
            featureIndex,
            buffers
        };
    }

    addElements(...e) {
        let segment = this.segments[this.segments.length - 1];
        if (!segment || this.elements.length + e.length > MAX_SEGMENTS_LENGTH) {
            segment = {
                offset: segment ? segment.offset + segment.count : 0,
                count: 0
            };
            this.segments.push(segment);
        }
        this.maxIndex = Math.max(this.maxIndex, ...e);
        Array.prototype.push.apply(this.elements, e);
        segment.count += e.length;
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
