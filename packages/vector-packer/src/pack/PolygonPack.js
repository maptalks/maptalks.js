import { MAX_SEGMENTS_LENGTH, default as VectorPack } from './VectorPack';
import StyledVector from './StyledVector';
import classifyRings from './util/classify_rings';
import earcut from 'earcut';
import { getIndexArrayType } from './util/array';
import { evaluate } from '../style/Util';


const EARCUT_MAX_RINGS = 500;

export default class PolygonPack extends VectorPack {

    constructor(...args) {
        super(...args);
        this.lineElements = [];
        this.lineSegments = [];
    }

    createStyledVector(feature, symbol, options, iconReqs) {
        //每个point的icon和text
        if (symbol['polygonPatternFile']) {
            iconReqs[symbol['polygonPatternFile']] = 1;
        }
        return new StyledVector(feature, symbol, options);
    }

    getFormat() {
        return [
            {
                type : Int32Array,
                width : 3,
                name : 'aPos'
            }
            //TODO 动态color
        ];
    }

    createDataPack(...args) {
        this.maxLineIndex = 0;
        this.lineElements = [];
        this.lineSegments = [];
        const pack = super.createDataPack(...args);
        let lineElements = this.lineElements;
        const ElementType = getIndexArrayType(this.maxLineIndex);
        lineElements = new ElementType(this.lineElements);
        pack.lineElements = lineElements;
        pack.lineSegments = this.lineSegments;
        pack.buffers.push(lineElements.buffer);
        return pack;
    }

    placeVector(polygon, scale) {
        const symbol = polygon.symbol;

        const feature = polygon.feature,
            geometry = feature.geometry;

        this._addPolygon(geometry, scale);

    }

    _addPolygon(geometry) {
        for (const polygon of classifyRings(geometry, EARCUT_MAX_RINGS)) {
            const triangleIndex = this.elements.length;

            const flattened = [];
            const holeIndices = [];

            for (const ring of polygon) {
                if (ring.length === 0) {
                    continue;
                }

                if (ring !== polygon[0]) {
                    holeIndices.push(flattened.length / 2);
                }

                const lineIndex = this.lineElements.length;

                this.data.push(
                    ring[0].x, ring[0].y, 0
                    //TODO color?
                );
                this.maxPos = Math.max(this.maxPos, Math.abs(ring[0].x), Math.abs(ring[0].y));
                this.addLineElements(lineIndex + ring.length - 1, lineIndex);

                flattened.push(ring[0].x);
                flattened.push(ring[0].y);

                for (let i = 1; i < ring.length; i++) {
                    this.data.push(ring[i].x, ring[i].y, 0);
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
        let segment = this.lineSegments[this.lineSegments.length - 1];
        if (!segment || this.lineElements.length + e.length > MAX_SEGMENTS_LENGTH) {
            segment = {
                offset: segment ? segment.offset + segment.count : 0,
                count: 0
            };
            this.lineSegments.push(segment);
        }
        this.maxLineIndex = Math.max(this.maxLineIndex, ...e);
        Array.prototype.push.apply(this.lineElements, e);
        segment.count += e.length;
    }
}

