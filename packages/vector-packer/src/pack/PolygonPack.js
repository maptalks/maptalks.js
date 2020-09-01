import VectorPack from './VectorPack';
import StyledVector from './StyledVector';
import classifyRings from './util/classify_rings';
import earcut from 'earcut';
import { getIndexArrayType } from './util/array';
import { interpolated, piecewiseConstant } from '@maptalks/function-type';
import Color from 'color';
import { isFnTypeSymbol, isNil } from '../style/Util';
import { clipPolygon } from './util/clip_polygon';

const EARCUT_MAX_RINGS = 500;

export default class PolygonPack extends VectorPack {

    constructor(...args) {
        super(...args);
        this.lineElements = [];
        if (isFnTypeSymbol('polygonFill', this.symbolDef)) {
            this._polygonFillFn = piecewiseConstant(this.symbolDef['polygonFill']);
        }
        if (isFnTypeSymbol('polygonOpacity', this.symbolDef)) {
            this._polygonOpacityFn = interpolated(this.symbolDef['polygonOpacity']);
        }
        if (isFnTypeSymbol('polygonPatternFile', this.symbolDef)) {
            this._patternFn = piecewiseConstant(this.symbolDef['polygonPatternFile']);
        }
    }

    createStyledVector(feature, symbol, options, iconReqs) {
        if (!this.options['atlas'] && symbol['polygonPatternFile']) {
            let pattern = symbol['polygonPatternFile'];
            if (this._patternFn) {
                pattern = this._patternFn(options['zoom'], feature.properties);
            }
            if (pattern) {
                iconReqs[pattern] = 'resize';
            }
        }
        return new StyledVector(feature, symbol, options);
    }

    getFormat() {
        const format = [
            {
                type: Int16Array,
                width: 3,
                name: 'aPosition'
            }
        ];
        if (this.iconAtlas) {
            const width = this.iconAtlas.image.data.width;
            const height = this.iconAtlas.image.data.height;
            format.push({
                type: (width > 256 || height > 256) ? Uint16Array : Uint8Array,
                width: 4,
                name: 'aTexCoord'
            });
        }
        if (this._polygonFillFn) {
            format.push({
                type: Uint8Array,
                width: 4,
                name: 'aColor'
            });
        }
        if (this._polygonOpacityFn) {
            format.push({
                type: Uint8Array,
                width: 1,
                name: 'aOpacity'
            });
        }
        return format;
    }

    createDataPack(...args) {
        this.maxLineIndex = 0;
        this.lineElements = [];
        const pack = super.createDataPack(...args);
        if (!pack) {
            return pack;
        }
        let lineElements = this.lineElements;
        const ElementType = getIndexArrayType(this.maxLineIndex);
        lineElements = new ElementType(this.lineElements);
        pack.lineIndices = lineElements;
        pack.buffers.push(lineElements.buffer);
        return pack;
    }

    placeVector(polygon, scale) {
        // const symbol = polygon.symbol;
        const feature = polygon.feature,
            geometry = feature.geometry;

        this._addPolygon(geometry, feature, scale);

    }

    _addPolygon(geometry, feature) {
        let dynFill, dynOpacity;
        if (this._polygonFillFn) {
            dynFill = this._polygonFillFn(this.options['zoom'], feature.properties) || [255, 255, 255, 255];
            if (!Array.isArray(dynFill)) {
                dynFill = Color(dynFill).array();
            }
            if (dynFill.length === 3) {
                dynFill.push(255);
            }
        }
        if (this._polygonOpacityFn) {
            dynOpacity = this._polygonOpacityFn(this.options['zoom'], feature.properties);
            if (isNil(dynOpacity)) {
                dynOpacity = 1;
            }
            dynOpacity *= 255;
        }
        const hasUV = !!this.iconAtlas;
        const rings = classifyRings(geometry, EARCUT_MAX_RINGS);

        const altitude = this.getAltitude(feature.properties);
        const uvStart = [0, 0];
        const uvSize = [0, 0];
        if (hasUV) {
            const patternFile = this._patternFn ? this._patternFn(null, feature.properties) : this.symbol['polygonPatternFile'];
            const image = this.iconAtlas.glyphMap[patternFile];
            if (image) {
                const rect = this.iconAtlas.positions[patternFile].paddedRect;
                uvStart[0] = rect.x;
                uvStart[1] = rect.y;
                //uvSize - 1.0 是为了把256宽实际存为255，这样可以用Uint8Array来存储宽度为256的值
                uvSize[0] = rect.w - 1;
                uvSize[1] = rect.h - 1;
            }
        }
        const BOUNDS = [-1, -1, feature.extent + 1, feature.extent + 1];
        for (let i = 0; i < rings.length; i++) {
            const polygon = rings[i];
            const triangleIndex = this.data.length / this.formatWidth;

            const flattened = [];
            const holeIndices = [];

            for (let ii = 0; ii < polygon.length; ii++) {
                let ring = polygon[ii];
                if (this.options.EXTENT !== Infinity) {
                    ring = clipPolygon(ring, BOUNDS);
                }
                if (ring.length === 0) {
                    continue;
                }
                //TODO 这里应该用ring signed来判断是否是hole
                if (ii !== 0) {
                    holeIndices.push(flattened.length / 2);
                }

                const lineIndex = this.lineElements.length;

                this.data.push(
                    ring[0].x, ring[0].y, altitude
                );
                if (hasUV) {
                    this.data.push(...uvStart, ...uvSize);
                }
                if (dynFill !== undefined) {
                    this.data.push(...dynFill);
                }
                if (dynOpacity !== undefined) {
                    this.data.push(dynOpacity);
                }
                this.maxPos = Math.max(this.maxPos, Math.abs(ring[0].x), Math.abs(ring[0].y));
                this.addLineElements(lineIndex + ring.length - 1, lineIndex);

                flattened.push(ring[0].x);
                flattened.push(ring[0].y);

                for (let i = 1; i < ring.length; i++) {
                    this.data.push(
                        ring[i].x, ring[i].y, altitude
                    );
                    if (hasUV) {
                        this.data.push(...uvStart, ...uvSize);
                    }
                    if (dynFill !== undefined) {
                        this.data.push(...dynFill);
                    }
                    if (dynOpacity !== undefined) {
                        this.data.push(dynOpacity);
                    }
                    this.maxPos = Math.max(this.maxPos, Math.abs(ring[i].x), Math.abs(ring[i].y));
                    this.addLineElements(lineIndex + i - 1, lineIndex + i);
                    flattened.push(ring[i].x);
                    flattened.push(ring[i].y);
                }
            }
            const indices = earcut(flattened, holeIndices);

            for (let i = 0; i < indices.length; i += 3) {
                this.addElements(
                    triangleIndex + indices[i],
                    triangleIndex + indices[i + 1],
                    triangleIndex + indices[i + 2]);
            }
        }
    }

    addLineElements(...e) {
        this.maxLineIndex = Math.max(this.maxLineIndex, ...e);
        this.lineElements.push(...e);
    }
}
