import VectorPack from './VectorPack';
import StyledVector from './StyledVector';
import classifyRings from './util/classify_rings';
import earcut from 'earcut';
import { getIndexArrayType } from './util/array';
import Color from 'color';
import { isNil } from '../style/Util';
import { clipPolygon } from './util/clip_polygon';

const EARCUT_MAX_RINGS = 500;

export default class PolygonPack extends VectorPack {

    static isAtlasLoaded(res, atlas = {}) {
        const { iconAtlas } = atlas;
        if (res) {
            if (!iconAtlas || !iconAtlas.positions[res]) {
                return false;
            }
        }
        return true;
    }

    constructor(...args) {
        super(...args);
        this.lineElements = [];
    }

    createStyledVector(feature, symbol, fnTypes, options, iconReqs) {
        const vector = new StyledVector(feature, symbol, fnTypes, options);
        const pattern = vector.getResource();
        if (!this.options['atlas'] && pattern) {
            iconReqs[pattern] = 1;
        }
        return vector;
    }

    getFormat() {
        const format = [
            {
                type: Int16Array,
                width: 3,
                name: 'aPosition'
            }
        ];
        const { polygonFillFn, polygonOpacityFn } = this._fnTypes;
        if (this.iconAtlas) {
            const max = this.getIconAtlasMaxValue();
            format.push({
                type: max > 255 ? Uint16Array : Uint8Array,
                width: 4,
                name: 'aTexInfo'
            });
        }
        if (polygonFillFn) {
            format.push({
                type: Uint8Array,
                width: 4,
                name: 'aColor'
            });
        }
        if (polygonOpacityFn) {
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
        const { polygonFillFn, polygonOpacityFn } = this._fnTypes;
        if (polygonFillFn) {
            dynFill = polygonFillFn(this.options['zoom'], feature.properties) || [255, 255, 255, 255];
            if (!Array.isArray(dynFill)) {
                dynFill = Color(dynFill).array();
            } else {
                dynFill = dynFill.map(c => c * 255);
            }
            if (dynFill.length === 3) {
                dynFill.push(255);
            }
        }
        if (polygonOpacityFn) {
            dynOpacity = polygonOpacityFn(this.options['zoom'], feature.properties);
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
            const { polygonPatternFileFn } = this._fnTypes;
            const patternFile = polygonPatternFileFn ? polygonPatternFileFn(null, feature.properties) : this.symbol['polygonPatternFile'];
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
