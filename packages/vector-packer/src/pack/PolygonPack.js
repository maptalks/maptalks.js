import VectorPack from './VectorPack';
import StyledVector from './StyledVector';
import classifyRings from './util/classify_rings';
import earcut from 'earcut';
import { getIndexArrayType } from './util/array';


const EARCUT_MAX_RINGS = 500;

export default class PolygonPack extends VectorPack {

    constructor(...args) {
        super(...args);
        this.lineElements = [];
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
                type: Int32Array,
                width: 3,
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

        this._addPolygon(geometry, scale);

    }

    _addPolygon(geometry) {
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
                    ring[0].x, ring[0].y, 0
                );
                if (hasUV) {
                    this.data.push(ring[0].x * 32 / uvSize, ring[0].y * 32 / uvSize);
                }
                this.maxPos = Math.max(this.maxPos, Math.abs(ring[0].x), Math.abs(ring[0].y));
                this.addLineElements(lineIndex + ring.length - 1, lineIndex);

                flattened.push(ring[0].x);
                flattened.push(ring[0].y);

                for (let i = 1; i < ring.length; i++) {
                    this.data.push(ring[i].x, ring[i].y, 0);
                    if (hasUV) {
                        this.data.push(ring[i].x * 32 / uvSize, ring[i].y * 32 / uvSize);
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
