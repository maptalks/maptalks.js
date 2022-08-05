import VectorPack from './VectorPack';
import StyledVector from './StyledVector';
import classifyRings from './util/classify_rings';
import earcut from 'earcut';
import { getIndexArrayType } from './util/array';
import { isNil, normalizeColor } from '../style/Util';
import { clipPolygon } from './util/clip_polygon';
import { isFunctionDefinition } from '@maptalks/function-type';
import { vec4 } from 'gl-matrix';

const EARCUT_MAX_RINGS = 500;
const DYNCOLOR = [];

export default class PolygonPack extends VectorPack {

    constructor(...args) {
        super(...args);
        this.lineElements = [];
    }

    createStyledVector(feature, symbol, fnTypes, options, iconReqs) {
        const vector = new StyledVector(feature, symbol, fnTypes, options);
        const pattern = vector.getPolygonResource();
        if (!this.options['atlas'] && pattern) {
            iconReqs[pattern] = [0, 0];
        }
        return vector;
    }

    getFormat() {
        const format = [
            ...this.getPositionFormat()
        ];
        const { polygonFillFn, polygonOpacityFn, uvScaleFn, uvOffsetFn } = this._fnTypes;
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
        if (uvScaleFn) {
            format.push({
                type: Uint16Array,
                width: 2,
                name: 'aUVScale'
            });
        }
        if (uvOffsetFn) {
            format.push({
                type: Uint8Array,
                width: 2,
                name: 'aUVOffset'
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
        let dynFill, dynOpacity, dynUVScale, dynUVOffset;
        const { polygonFillFn, polygonOpacityFn, uvScaleFn, uvOffsetFn } = this._fnTypes;
        const properties = feature.properties;
        if (polygonFillFn) {
            dynFill = polygonFillFn(this.options['zoom'], properties) || vec4.set(DYNCOLOR, 255, 255, 255, 255);
            if (isFunctionDefinition(dynFill)) {
                // 说明是identity返回的仍然是个fn-type，fn-type-util.js中会计算刷新，这里不用计算
                dynFill = vec4.set(DYNCOLOR, 0, 0, 0, 0);
            } else {
                dynFill = normalizeColor(DYNCOLOR, dynFill);
            }

        }
        if (polygonOpacityFn) {
            dynOpacity = polygonOpacityFn(this.options['zoom'], properties);
            if (isNil(dynOpacity)) {
                dynOpacity = 1;
            }
            dynOpacity *= 255;
        }
        if (uvScaleFn) {
            dynUVScale = uvScaleFn(this.options['zoom'], properties);
            if (isNil(dynUVScale)) {
                dynUVScale = [1, 1];
            }
            dynUVScale = [dynUVScale[0] * 255, dynUVScale[1] * 255];
        }
        if (uvOffsetFn) {
            dynUVOffset = uvOffsetFn(this.options['zoom'], properties);
            if (isNil(dynUVOffset)) {
                dynUVOffset = [0, 0];
            }
            dynUVOffset = [dynUVOffset[0] * 255, dynUVOffset[1] * 255];
        }
        const hasUV = !!this.iconAtlas;
        const rings = classifyRings(geometry, EARCUT_MAX_RINGS);

        const uvStart = [0, 0];
        const uvSize = [0, 0];
        if (hasUV) {
            const { polygonPatternFileFn } = this._fnTypes;
            const patternFile = polygonPatternFileFn ? polygonPatternFileFn(null, properties) : this.symbol['polygonPatternFile'];
            const image = this.iconAtlas.glyphMap[patternFile];
            if (image) {
                const image = this.iconAtlas.positions[patternFile];
                // fuzhenn/maptalks-designer#607
                // uvStart增大一个像素，uvSize缩小一个像素，避免插值造成的缝隙
                uvStart[0] = image.tl[0] + 1;
                uvStart[1] = image.tl[1] + 1;
                //uvSize - 1.0 是为了把256宽实际存为255，这样可以用Uint8Array来存储宽度为256的值
                uvSize[0] = image.displaySize[0] - 3;
                uvSize[1] = image.displaySize[1] - 3;
            }
        }
        const positionSize = this.needAltitudeAttribute() ? 2 : 3;
        const BOUNDS = [-1, -1, feature.extent + 1, feature.extent + 1];
        for (let i = 0; i < rings.length; i++) {
            const polygon = rings[i];
            const triangleIndex = this.data.aPosition.length / positionSize;

            const flattened = [];
            const holeIndices = [];

            for (let ii = 0; ii < polygon.length; ii++) {
                let ring = polygon[ii];
                if (this.options.EXTENT !== Infinity && this.maxPosZ === 0) {
                    ring = clipPolygon(ring, BOUNDS);
                }
                if (ring.length === 0) {
                    continue;
                }
                //TODO 这里应该用ring signed来判断是否是hole
                if (ii !== 0) {
                    holeIndices.push(flattened.length / 3);
                }

                const lineIndex = this.lineElements.length;

                this.fillPosition(this.data, ring[0].x, ring[0].y, ring[0].z || 0);
                if (hasUV) {
                    this.data.aTexInfo.push(...uvStart, ...uvSize);
                }
                if (dynFill !== undefined) {
                    this.data.aColor.push(...dynFill);
                }
                if (dynOpacity !== undefined) {
                    this.data.aOpacity.push(dynOpacity);
                }
                if (dynUVScale !== undefined) {
                    this.data.aUVScale.push(...dynUVScale);
                }
                if (dynUVOffset !== undefined) {
                    this.data.aUVOffset.push(...dynUVOffset);
                }
                this.maxPos = Math.max(this.maxPos, Math.abs(ring[0].x), Math.abs(ring[0].y));
                this.addLineElements(lineIndex + ring.length - 1, lineIndex);

                flattened.push(ring[0].x);
                flattened.push(ring[0].y);
                flattened.push(ring[0].z || 0);

                for (let i = 1; i < ring.length; i++) {
                    this.fillPosition(this.data, ring[i].x, ring[i].y, ring[i].z || 0);
                    if (hasUV) {
                        this.data.aTexInfo.push(...uvStart, ...uvSize);
                    }
                    if (dynFill !== undefined) {
                        this.data.aColor.push(...dynFill);
                    }
                    if (dynOpacity !== undefined) {
                        this.data.aOpacity.push(dynOpacity);
                    }
                    if (dynUVScale !== undefined) {
                        this.data.aUVScale.push(...dynUVScale);
                    }
                    if (dynUVOffset !== undefined) {
                        this.data.aUVOffset.push(...dynUVOffset);
                    }
                    this.maxPos = Math.max(this.maxPos, Math.abs(ring[i].x), Math.abs(ring[i].y));
                    this.addLineElements(lineIndex + i - 1, lineIndex + i);
                    flattened.push(ring[i].x);
                    flattened.push(ring[i].y);
                    flattened.push(ring[i].z || 0);
                }
            }
            const indices = earcut(flattened, holeIndices, 3);

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
