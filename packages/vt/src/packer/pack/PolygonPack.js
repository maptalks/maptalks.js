import VectorPack from './VectorPack';
import StyledVector from './StyledVector';
import classifyRings from './util/classify_rings';
import { isPowerOfTwo } from './util/util';
import earcut from 'earcut';
import { isNil, normalizeColor } from '../style/Util';
import { clipPolygon } from './util/clip_polygon';
import { isFunctionDefinition } from '@maptalks/function-type';
import { vec4 } from 'gl-matrix';

const EARCUT_MAX_RINGS = 500;
const EMPTY_FILL = [0, 0, 0, 0];
export const INVALID_TEX_COORD = -9999999;

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
        const { polygonFillFn, polygonOpacityFn, uvScaleFn, uvOffsetFn, polygonPatternUVFn } = this._fnTypes;
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
        if (polygonPatternUVFn) {
            format.push({
                type: Float32Array,
                width: 2,
                name: 'aTexCoord'
            });
        }
        return format;
    }

    // createDataPack(...args) {
    //     this.maxLineIndex = 0;
    //     this.lineElements = [];
    //     const pack = super.createDataPack(...args);
    //     if (!pack) {
    //         return pack;
    //     }
    //     let lineElements = this.lineElements;
    //     const ElementType = getIndexArrayType(this.maxLineIndex);
    //     lineElements = new ElementType(this.lineElements);
    //     pack.lineIndices = lineElements;
    //     pack.buffers.push(lineElements.buffer);
    //     return pack;
    // }

    placeVector(polygon, scale) {
        // const symbol = polygon.symbol;
        const feature = polygon.feature,
            geometry = feature.geometry;

        this._addPolygon(geometry, feature, scale);

    }

    _addPolygon(geometry, feature) {
        let dynFill, dynOpacity, dynUVScale, dynUVOffset;
        const { polygonFillFn, polygonOpacityFn, uvScaleFn, uvOffsetFn, uvOffsetInMeterFn, polygonPatternUVFn } = this._fnTypes;
        const properties = feature.properties;
        if (polygonFillFn) {
            dynFill = polygonFillFn(this.options['zoom'], properties) || vec4.set([], 255, 255, 255, 255);
            if (isFunctionDefinition(dynFill)) {
                this.dynamicAttrs['aColor'] = 1;
                // 说明是identity返回的仍然是个fn-type，fn-type-util.js中会计算刷新，这里不用计算
                dynFill = EMPTY_FILL;
            } else {
                dynFill = normalizeColor([], dynFill);
            }

        }
        if (polygonOpacityFn) {
            dynOpacity = polygonOpacityFn(this.options['zoom'], properties);
            if (isFunctionDefinition(dynOpacity)) {
                this.dynamicAttrs['aOpacity'] = 1;
                dynOpacity = 255;
            } else {
                if (isNil(dynOpacity)) {
                    dynOpacity = 1;
                }
                dynOpacity *= 255;
            }

        }
        if (uvScaleFn) {
            dynUVScale = uvScaleFn(this.options['zoom'], properties);
            if (isFunctionDefinition(dynUVScale)) {
                dynUVScale = [255, 255];
                this.dynamicAttrs['aUVScale'] = 1;
            } else {
                if (isNil(dynUVScale)) {
                    dynUVScale = [1, 1];
                }
                dynUVScale = [dynUVScale[0] * 255, dynUVScale[1] * 255];
            }

        }
        if (uvOffsetFn) {
            if (uvOffsetInMeterFn && uvOffsetInMeterFn(null, properties)) {
                dynUVOffset = [0, 0];
            } else {
                dynUVOffset = uvOffsetFn(this.options['zoom'], properties);
                if (isFunctionDefinition(dynUVOffset)) {
                    dynUVOffset = [0, 0];
                    this.dynamicAttrs['aUVOffset'] = 1;
                } else {
                    if (isNil(dynUVOffset)) {
                        dynUVOffset = [0, 0];
                    }
                    dynUVOffset = [dynUVOffset[0] * 255, dynUVOffset[1] * 255];
                }
            }
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
                // 如果图形长宽不是二的n次方，uvStart和uvSize均需要略微缩小，避免缝隙产生
                const needPadding = !isPowerOfTwo(image.displaySize[0]) || !isPowerOfTwo(image.displaySize[1]);
                // fuzhenn/maptalks-designer#607
                uvStart[0] = image.tl[0] + (needPadding && 1 || 0);
                uvStart[1] = image.tl[1] + (needPadding && 1 || 0);
                //uvSize - 1.0 是为了把256宽实际存为255，这样可以用Uint8Array来存储宽度为256的值
                uvSize[0] = image.displaySize[0] - 1 - (needPadding && 2 || 0);
                uvSize[1] = image.displaySize[1] - 1 - (needPadding && 2 || 0);
            }
        }

        let texCoords;
        let tIndex = 0;
        if (polygonPatternUVFn) {
            texCoords = polygonPatternUVFn(this.options['zoom'], properties);
        }

        const positionSize = this.needAltitudeAttribute() ? 2 : 3;
        const BOUNDS = [-1, -1, feature.extent + 1, feature.extent + 1];
        const flattened = this._flattened = this._flattened || this._arrayPool.getProxy();
        const holeIndices = this._holeIndices = this._holeIndices || this._arrayPool.getProxy();
        for (let i = 0; i < rings.length; i++) {
            const polygon = rings[i];
            const triangleIndex = this.data.aPosition.getLength() / positionSize;
            flattened.setLength(0);
            holeIndices.setLength(0);

            for (let ii = 0; ii < polygon.length; ii++) {
                let ring = polygon[ii];
                if (this.options.EXTENT !== Infinity && this.maxPosZ === 0 && this.minPosZ === 0) {
                    ring = clipPolygon(ring, BOUNDS);
                }
                if (ring.length === 0) {
                    continue;
                }
                //TODO 这里应该用ring signed来判断是否是hole
                if (ii !== 0) {
                    holeIndices.push(flattened.length / 3);
                }

                this.ensureDataCapacity(ring.length);

                // const lineIndex = this.lineElements.length;

                // this.fillPosition(this.data, ring[0].x, ring[0].y, ring[0].z || 0);
                // if (hasUV) {
                //     this.data.aTexInfo.push(uvStart[0], uvStart[1], uvSize[0], uvSize[1]);
                // }
                // if (dynFill !== undefined) {
                //     this.data.aColor.push(dynFill[0], dynFill[1], dynFill[2], dynFill[3]);
                // }
                // if (dynOpacity !== undefined) {
                //     this.data.aOpacity.push(dynOpacity);
                // }
                // if (dynUVScale !== undefined) {
                //     this.data.aUVScale.push(dynUVScale[0], dynUVScale[1]);
                // }
                // if (dynUVOffset !== undefined) {
                //     this.data.aUVOffset.push(dynUVOffset[0], dynUVOffset[1]);
                // }

                // const absX = Math.abs(ring[0].x);
                // const absY = Math.abs(ring[0].y);
                // if (absX > this.maxPos) {
                //     this.maxPos = absX;
                // }
                // if (absY > this.maxPos) {
                //     this.maxPos = absY;
                // }
                // this.addLineElements(lineIndex + ring.length - 1, lineIndex);
                // flattened.push(ring[0].x, ring[0].y, ring[0].z || 0);
                const data = this.data;
                for (let i = 0; i < ring.length; i++) {
                    const x = ring[i].x;
                    const y = ring[i].y;
                    const z = ring[i].z || 0;
                    this.fillPosition(this.data, x, y, z);
                    if (hasUV) {
                        // this.data.aTexInfo.push(uvStart[0], uvStart[1], uvSize[0], uvSize[1]);
                        let index = data.aTexInfo.currentIndex;
                        data.aTexInfo[index++] = uvStart[0];
                        data.aTexInfo[index++] = uvStart[1];
                        data.aTexInfo[index++] = uvSize[0];
                        data.aTexInfo[index++] = uvSize[1];
                        data.aTexInfo.currentIndex = index;
                    }
                    if (dynFill !== undefined) {
                        // this.data.aColor.push(dynFill[0], dynFill[1], dynFill[2], dynFill[3]);
                        let index = data.aColor.currentIndex;
                        data.aColor[index++] = dynFill[0];
                        data.aColor[index++] = dynFill[1];
                        data.aColor[index++] = dynFill[2];
                        data.aColor[index++] = dynFill[3];
                        data.aColor.currentIndex = index;
                    }
                    if (dynOpacity !== undefined) {
                        // this.data.aOpacity.push(dynOpacity);
                        let index = data.aOpacity.currentIndex;
                        data.aOpacity[index++] = dynOpacity;
                        data.aOpacity.currentIndex = index;
                    }
                    if (dynUVScale !== undefined) {
                        // this.data.aUVScale.push(dynUVScale[0], dynUVScale[1]);
                        let index = data.aUVScale.currentIndex;
                        data.aUVScale[index++] = dynUVScale[0];
                        data.aUVScale[index++] = dynUVScale[1];
                        data.aUVScale.currentIndex = index;
                    }
                    if (dynUVOffset !== undefined) {
                        // this.data.aUVOffset.push(dynUVOffset[0], dynUVOffset[1]);
                        let index = data.aUVOffset.currentIndex;
                        data.aUVOffset[index++] = dynUVOffset[0];
                        data.aUVOffset[index++] = dynUVOffset[1];
                        data.aUVOffset.currentIndex = index;
                    }
                    if (polygonPatternUVFn) {
                        let index = data.aTexCoord.currentIndex;
                        if (texCoords) {
                            const tx = isNil(texCoords[tIndex * 2]) ? texCoords[0] : texCoords[tIndex * 2];
                            const ty = isNil(texCoords[tIndex * 2] + 1) ? texCoords[1] : texCoords[tIndex * 2 + 1];
                            // this.data.aTexCoord.push(tx, ty);
                            data.aTexCoord[index++] = tx;
                            data.aTexCoord[index++] = ty;
                        } else {
                            // this.data.aTexCoord.push(INVALID_TEX_COORD, INVALID_TEX_COORD);
                            data.aTexCoord[index++] = INVALID_TEX_COORD;
                            data.aTexCoord[index++] = INVALID_TEX_COORD;
                        }
                        data.aTexCoord.currentIndex = index;
                        tIndex++;
                    }

                    const absX = Math.abs(x);
                    const absY = Math.abs(y);
                    if (absX > this.maxPos) {
                        this.maxPos = absX;
                    }
                    if (absY > this.maxPos) {
                        this.maxPos = absY;
                    }

                    // this.addLineElements(lineIndex + i - 1, lineIndex + i);
                    flattened.push(x, y, z);
                }
            }

            let indices = earcut(flattened, holeIndices, 3);
            if (flattened.length && !indices.length) {
                // 在xy平面投影没有值时，无法生成结果，讨论：
                // https://github.com/mapbox/earcut/issues/21
                // 把面投影到xz平面上
                const reprojected = [];
                for (let i = 0; i < flattened.length; i += 3) {
                    reprojected[i] = flattened[i];
                    reprojected[i + 1] = flattened[i + 2];
                    reprojected[i + 2] = flattened[i + 1];
                }
                indices = earcut(reprojected, holeIndices, 3);
                // xz平面仍然没结果，投影到yz平面上
                if (!indices.length) {
                    for (let i = 0; i < flattened.length; i += 3) {
                        reprojected[i] = flattened[i + 1];
                        reprojected[i + 1] = flattened[i + 2];
                        reprojected[i + 2] = flattened[i];
                    }
                    indices = earcut(reprojected, holeIndices, 3);
                }
            }

            for (let i = 0; i < indices.length; i += 3) {
                this.addElements(
                    triangleIndex + indices[i],
                    triangleIndex + indices[i + 1],
                    triangleIndex + indices[i + 2]);
            }
        }
    }


    ensureDataCapacity(vertexCount) {
        super.ensureDataCapacity(1, vertexCount);
    }

    // addLineElements(...e) {
    //     this.maxLineIndex = Math.max(this.maxLineIndex, ...e);
    //     this.lineElements.push(...e);
    // }
}
