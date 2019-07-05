import VectorPack from './VectorPack';
import StyledVector from './StyledVector';
import classifyRings from './util/classify_rings';
import earcut from 'earcut';
import { getIndexArrayType } from './util/array';
import { isFunctionDefinition, interpolated, piecewiseConstant } from '@maptalks/function-type';
import Color from 'color';

const EARCUT_MAX_RINGS = 500;

export default class PolygonPack extends VectorPack {

    constructor(...args) {
        super(...args);
        this.lineElements = [];
        if (isFunctionDefinition(this.symbolDef['polygonFill']) &&
            this.symbolDef['polygonFill'].property) {
            this._polygonFillFn = piecewiseConstant(this.symbolDef['polygonFill']);
        }
        if (isFunctionDefinition(this.symbolDef['polygonOpacity']) &&
            this.symbolDef['polygonOpacity'].property) {
            this._polygonOpacityFn = interpolated(this.symbolDef['polygonOpacity']);
        }
    }

    createStyledVector(feature, symbol, options, iconReqs) {
        if (symbol['polygonPatternFile']) {
            iconReqs[symbol['polygonPatternFile']] = 'resize';
        }
        return new StyledVector(feature, symbol, options);
    }

    getFormat(symbol) {
        const format = [
            {
                type: Int16Array,
                width: this.positionSize,
                name: 'aPosition'
            }
            //TODO 动态color
        ];
        if (symbol['polygonPatternFile']) {
            format.push({
                type: Int16Array,
                width: 2,
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
            dynFill = this._polygonFillFn(null, feature.properties) || [0, 0, 0, 0];
            if (!Array.isArray(dynFill)) {
                dynFill = Color(dynFill).array();
            }
            if (dynFill.length === 3) {
                dynFill.push(255);
            }
        }
        if (this._polygonOpacityFn) {
            dynOpacity = this._polygonOpacityFn(null, feature.properties) || 0;
        }

        const uvSize = 256;
        const hasUV = !!this.symbol['polygonPatternFile'];
        const rings = classifyRings(geometry, EARCUT_MAX_RINGS);
        for (let i = 0; i < rings.length; i++) {
            const polygon = rings[i];
            const triangleIndex = this.data.length / this.formatWidth;

            const flattened = [];
            const holeIndices = [];

            for (let ii = 0; ii < polygon.length; ii++) {
                const ring = polygon[ii];
                if (ring.length === 0) {
                    continue;
                }

                if (ring !== polygon[0]) {
                    holeIndices.push(flattened.length / 2);
                }

                const lineIndex = this.lineElements.length;

                this.data.push(
                    ring[0].x, ring[0].y
                );
                if (this.positionSize === 3) {
                    this.data.push(0);
                }
                if (hasUV) {
                    this.data.push(ring[0].x * 32 / uvSize, ring[0].y * 32 / uvSize);
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
                        ring[i].x, ring[i].y
                    );
                    if (this.positionSize === 3) {
                        this.data.push(0);
                    }
                    if (hasUV) {
                        this.data.push(ring[i].x * 32 / uvSize, ring[i].y * 32 / uvSize);
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
