import Color from 'color';
import VectorPack from './VectorPack';
import StyledPoint from './StyledPoint';
import clipLine from './util/clip_line';
import  { getAnchors } from './util/get_anchors';
import classifyRings from './util/classify_rings';
import findPoleOfInaccessibility from './util/find_pole_of_inaccessibility';
import { evaluate } from '../style/Util';
import { getGlyphQuads, getIconQuads } from './util/quads';
import { getLineOffset } from './util/line_offset';

const TEXT_MAX_ANGLE = 45 * Math.PI / 100;
const DEFAULT_SPACING = 250;

function getPackSDFFormat(symbol) {
    if (symbol['textPlacement'] === 'line') {
        return [
            {
                type : Int16Array,
                width : 3,
                name : 'aPosition'
            },
            {
                type : Int16Array,
                width : 2,
                name : 'aShape'
            },
            {
                type : Uint16Array,
                width : 2,
                name : 'aTexCoord'
            },
            {
                type : Uint8Array,
                width : 1,
                name : 'aOpacity'
            },
            {
                type : Int8Array,
                width : 2,
                name : 'aOffset0'
            },
            {
                type : Int8Array,
                width : 2,
                name : 'aOffset1'
            },
            {
                type : Int8Array,
                width : 2,
                name : 'aOffset2'
            },
            {
                //TODO 更小的类型？
                type : Float32Array,
                width : 1,
                name : 'aRotation0'
            },
            {
                type : Float32Array,
                width : 1,
                name : 'aRotation1'
            },
            {
                type : Float32Array,
                width : 1,
                name : 'aRotation2'
            },
            {
                type : Uint8Array,
                width : 1,
                name : 'aSize'
            },
            {
                type : Uint8Array,
                width : 3,
                name : 'aColor'
            },
        ];
    } else {
        return [
            {
                type : Int16Array,
                width : 3,
                name : 'aPosition'
            },
            {
                type : Int16Array,
                width : 2,
                name : 'aShape'
            },
            {
                type : Uint16Array,
                width : 2,
                name : 'aTexCoord'
            },
            {
                type : Uint8Array,
                width : 1,
                name : 'aOpacity'
            },
            {
                type : Int8Array,
                width : 2,
                name : 'aOffset0'
            },
            {
                //TODO 更小的类型？
                type : Float32Array,
                width : 1,
                name : 'aRotation0'
            },
            {
                type : Uint8Array,
                width : 1,
                name : 'aSize'
            },
            {
                type : Uint8Array,
                width : 3,
                name : 'aColor'
            },
        ];
    }
}

function getPackMarkerFormat() {
    return [
        {
            type : Int16Array,
            width : 3,
            name : 'aPosition'
        },
        {
            type : Int16Array,
            width : 2,
            name : 'aShape'
        },
        {
            type : Uint16Array,
            width : 2,
            name : 'aTexCoord'
        },
        {
            type : Int8Array,
            width : 2,
            name : 'aOffset'
        },
        {
            type : Uint8Array,
            width : 1,
            name : 'aOpacity'
        },
        {
            type : Float32Array,
            width : 1,
            name : 'aRotation'
        },
        {
            type : Uint8Array,
            width : 2,
            name : 'aSize'
        }
    ];
}


/**
 * 点类型数据，负责输入feature和symbol后，生成能直接赋给shader的arraybuffer
 * 设计上能直接在worker中执行
 * 其执行过程：
 * 1. 解析features（ vt 格式或 geojson ）
 * 2. 根据 symbol 设置，设置每个 feature 的 symbol，生成 StyledFeature
 * 3. 遍历 SymbolFeature，生成绘制数据，例如 anchor，glyph 或 icon，旋转角度等
 * 4. 将3中的数据生成 arraybuffer ，如果是动态绘制，则生成基础绘制数据 ( arraybuffer )
 *   4.1 symbol 变化时，则重新生成3中的绘制数据，并重新生成 arraybuffer
 */
export default class PointPack extends VectorPack {
    getType() {
        return 'point';
    }

    //TODO 点的碰撞检测， 但带高度的碰撞检测无法在worker中计算

    createStyledVector(feature, symbol, options, iconReqs, glyphReqs) {
        //每个point的icon和text
        const point = new StyledPoint(feature, symbol, options);
        const iconGlyph = point.getIconAndGlyph();
        if (iconGlyph.icon) {
            if (!iconReqs[iconGlyph.icon]) {
                iconReqs[iconGlyph.icon] = 1;
            }
        }
        if (iconGlyph.glyph) {
            const { font, text } = iconGlyph.glyph;
            const fontGlphy = glyphReqs[font] = glyphReqs[font] || {};
            for (let i = 0; i < text.length; i++) {
                fontGlphy[text.charCodeAt(i)] = 1;
                //TODO mapbox-gl 这里对 vertical 字符做了特殊处理
            }
        }
        return point;
    }

    getFormat(symbol) {
        const isText = symbol['textName'] !== undefined;
        return isText ? getPackSDFFormat(symbol) : getPackMarkerFormat();
    }

    placeVector(point, scale, formatWidth) {
        const shape = point.getShape(this.iconAtlas, this.glyphAtlas);
        if (!shape) {
            return;
        }
        const anchors = this._getAnchors(point, shape, scale);
        const count = anchors.length;
        if (count === 0) {
            return;
        }
        const data = this.data;
        let currentIdx = data.length / formatWidth;
        // const minZoom = this.options.minZoom,
        //     maxZoom = this.options.maxZoom;
        const symbol = point.symbol,
            properties = point.feature.properties;
        const size = point.size;
        const alongLine = point.symbol['textPlacement'] === 'line' || point.symbol['markerPlacement'] === 'line';
        const isText = symbol['textName'] !== undefined;
        let quads, dx, dy, rotation, opacity, color;
        if (isText) {
            dx = evaluate(symbol['textDx'], properties) || 0;
            dy = evaluate(symbol['textDy'], properties) || 0;
            const textFill = evaluate(symbol['textFill'], properties) || '#000';
            rotation = evaluate(symbol['textRotation'], properties) || 0;
            color = Color(textFill || '#000').array();
            opacity = evaluate(symbol['textOpacity'], properties);
            if (opacity === undefined) {
                opacity = 1;
            }
            const font = point.getIconAndGlyph().glyph.font;
            quads = getGlyphQuads(shape.horizontal, alongLine, this.glyphAtlas.positions[font]);
        } else {
            dx = evaluate(symbol['markerDx'], properties) || 0;
            dy = evaluate(symbol['markerDy'], properties) || 0;
            rotation = (evaluate(symbol['markerRotation'], properties) || 0) * Math.PI / 180;
            opacity = evaluate(symbol['markerOpacity'], properties);
            if (opacity === undefined) {
                opacity = 1;
            }
            quads = getIconQuads(shape);
        }
        opacity = Math.round(opacity * 255);
        let lineOffset = [dx, dy, 0, dx, dy, 0, dx, dy, 0];
        const scales = [scale * 2, scale, scale / 2];
        for (let i = 0; i < anchors.length; i++) {
            const anchor = anchors[i];
            for (let ii = 0; ii < quads.length; ii++) {
                const quad = quads[ii];

                if (alongLine) {
                    // debugger
                    //TODO icon的逻辑还没有实现
                    if (isText) {
                        lineOffset = getLineOffset(lineOffset, anchor, quad, dx, dy, false, size[0] / 24, scales);
                    }
                } else {
                    lineOffset[0] = lineOffset[3] = lineOffset[6] = dx;
                    lineOffset[1] = lineOffset[4] = lineOffset[7] = dy;
                }
                const y = quad.glyphOffset[1];
                lineOffset[1] += y;
                lineOffset[4] += y;
                lineOffset[7] += y;

                const { tl, tr, bl, br, tex } = quad;

                data.push(
                    anchor.x, anchor.y, 0,
                    tl.x, tl.y,
                    tex.x, tex.y + tex.h,
                    opacity
                );
                if (isText) {
                    if (symbol['textPlacement'] === 'line') {
                        data.push(
                            //   minDx         minDy                                         maxDx        maxDy
                            lineOffset[0], lineOffset[1], lineOffset[3], lineOffset[4], lineOffset[6], lineOffset[7],
                            //     minRotation               maxRotation
                            rotation + lineOffset[2], rotation + lineOffset[5], rotation + lineOffset[8]
                        );
                    } else {
                        data.push(lineOffset[0], lineOffset[1], rotation);
                    }
                    data.push(size[0]);
                    data.push(color[0], color[1], color[2]);
                } else {
                    data.push(lineOffset[0], lineOffset[1], rotation);
                    data.push(size[0], size[1]);
                }

                data.push(
                    anchor.x, anchor.y, 0,
                    tr.x, tr.y,
                    tex.x + tex.w, tex.y + tex.h,
                    opacity
                );
                if (isText) {
                    if (symbol['textPlacement'] === 'line') {
                        data.push(
                            lineOffset[0], lineOffset[1], lineOffset[3], lineOffset[4], lineOffset[6], lineOffset[7],
                            rotation + lineOffset[2], rotation + lineOffset[5], rotation + lineOffset[8]
                        );
                    } else {
                        data.push(lineOffset[0], lineOffset[1], rotation);
                    }
                    data.push(size[0]);
                    data.push(color[0], color[1], color[2]);
                } else {
                    data.push(lineOffset[0], lineOffset[1], rotation);
                    data.push(size[0], size[1]);
                }

                data.push(
                    anchor.x, anchor.y, 0,
                    bl.x, bl.y,
                    tex.x, tex.y,
                    opacity
                );
                if (isText) {
                    if (symbol['textPlacement'] === 'line') {
                        data.push(
                            lineOffset[0], lineOffset[1], lineOffset[3], lineOffset[4], lineOffset[6], lineOffset[7],
                            rotation + lineOffset[2], rotation + lineOffset[5], rotation + lineOffset[8]
                        );
                    } else {
                        data.push(lineOffset[0], lineOffset[1], rotation);
                    }
                    data.push(size[0]);
                    data.push(color[0], color[1], color[2]);
                } else {
                    data.push(lineOffset[0], lineOffset[1], rotation);
                    data.push(size[0], size[1]);
                }

                data.push(
                    anchor.x, anchor.y, 0,
                    br.x, br.y,
                    tex.x + tex.w, tex.y,
                    opacity
                );
                if (isText) {
                    if (symbol['textPlacement'] === 'line') {
                        data.push(
                            lineOffset[0], lineOffset[1], lineOffset[3], lineOffset[4], lineOffset[6], lineOffset[7],
                            rotation + lineOffset[2], rotation + lineOffset[5], rotation + lineOffset[8]
                        );
                    } else {
                        data.push(lineOffset[0], lineOffset[1], rotation);
                    }
                    data.push(size[0]);
                    data.push(color[0], color[1], color[2]);
                } else {
                    data.push(lineOffset[0], lineOffset[1], rotation);
                    data.push(size[0], size[1]);
                }

                this.addElements(currentIdx, currentIdx + 1, currentIdx + 2);
                this.addElements(currentIdx + 1, currentIdx + 2, currentIdx + 3);
                currentIdx += 4;

                const max = Math.max(Math.abs(anchor.x), Math.abs(anchor.y));
                if (max > this.maxPos) {
                    this.maxPos = max;
                }
            }
        }
    }

    _getAnchors(point, shape, scale) {
        const feature = point.feature,
            type = point.feature.type,
            size = point.size,
            symbol = point.symbol,
            placement = this._getPlacement(symbol);

        let anchors = [];
        const glyphSize = 24,
            fontScale = size[0] / glyphSize,
            textBoxScale = scale * fontScale,
            // textMaxBoxScale = scale * textMaxSize / glyphSize,
            // textMaxBoxScale = 1, //TODO 可能的最大的 textMaxSize / glyphSize
            spacing = (symbol['markerSpacing'] || symbol['textSpacing'] || DEFAULT_SPACING) * scale;
        if (placement === 'line') {
            const EXTENT = this.options.EXTENT;
            let lines = feature.geometry;
            if (EXTENT) {
                lines = clipLine(feature.geometry, 0, 0, EXTENT, EXTENT);
            }

            for (let i = 0; i < lines.length; i++) {
                anchors.push.apply(
                    anchors,
                    getAnchors(lines[i],
                        spacing,
                        TEXT_MAX_ANGLE,
                        shape.vertical || shape.horizontal || shape,
                        null, //shapedIcon,
                        glyphSize,
                        textBoxScale,
                        1, //bucket.overscaling,
                        EXTENT || Infinity
                    )
                );
            }

        } else if (type === 3) {
            const rings = classifyRings(feature.geometry, 0);
            for (let i = 0; i < rings.length; i++) {
                const polygon = rings[i];
                // 16 here represents 2 pixels
                const poi = findPoleOfInaccessibility(polygon, 16);
                anchors.push(poi);
            }
        } else if (feature.type === 2) {
            // https://github.com/mapbox/mapbox-gl-js/issues/3808
            for (let i = 0; i < feature.geometry.length; i++) {
                const line = feature.geometry[i];
                anchors.push(line[0]);
            }
        } else if (feature.type === 1) {
            for (let i = 0; i < feature.geometry.length; i++) {
                const points = feature.geometry[i];
                for (let ii = 0; ii < points.length; ii++) {
                    const point = points[ii];
                    anchors.push(point);
                }
            }
        }
        //TODO 还需要mergeLines
        return anchors;
    }

    _getPlacement(symbol) {
        return symbol.markerPlacement || symbol.textPlacement;
    }
}

