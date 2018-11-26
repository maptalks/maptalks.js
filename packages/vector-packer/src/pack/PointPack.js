import Color from 'color';
import VectorPack from './VectorPack';
import StyledPoint from './StyledPoint';
import clipLine from './util/clip_line';
import  { getAnchors } from './util/get_anchors';
import classifyRings from './util/classify_rings';
import findPoleOfInaccessibility from './util/find_pole_of_inaccessibility';
import { evaluate } from '../style/Util';
import { getGlyphQuads, getIconQuads } from './util/quads';

const TEXT_MAX_ANGLE = 45 * Math.PI / 100;
const DEFAULT_SPACING = 250;

function getPackSDFFormat(symbol) {
    if (symbol['textPlacement'] === 'line') {
        //position, shape0, textcoord0, shape1, textcoord1, size, color, opacity, offset, rotation
        return [
            {
                type : Int16Array,
                width : 3,
                name : 'aPosition'
            },
            {
                type : Int16Array,
                width : 2,
                name : 'aShape0'
            },
            {
                type : Uint16Array,
                width : 2,
                name : 'aTexCoord0'
            },
            {
                type : Int16Array,
                width : 2,
                name : 'aShape1'
            },
            {
                type : Uint16Array,
                width : 2,
                name : 'aTexCoord1'
            },
            {
                type : Uint16Array,
                width : 3,
                name : 'aSegment'
            },
            {
                type : Uint8Array,
                width : 1,
                name : 'aSize'
            },
            {
                type : Int16Array,
                width : 2,
                name : 'aGlyphOffset'
            },
            {
                type : Uint8Array,
                width : 3,
                name : 'aColor'
            },
            {
                type : Int8Array,
                width : 2,
                name : 'aOffset'
            },
            {
                type : Int16Array,
                width : 1,
                name : 'aRotation'
            }
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
                name : 'aShape0'
            },
            {
                type : Uint16Array,
                width : 2,
                name : 'aTexCoord0'
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
            {
                type : Int8Array,
                width : 2,
                name : 'aOffset'
            },
            {
                type : Int16Array,
                width : 1,
                name : 'aRotation'
            }
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
            type : Uint8Array,
            width : 2,
            name : 'aSize'
        },
        {
            type : Int8Array,
            width : 2,
            name : 'aOffset'
        },
        {
            type : Float32Array,
            width : 1,
            name : 'aRotation'
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

    createDataPack() {
        this.lineVertex = [];
        const pack = super.createDataPack.apply(this, arguments);
        if (!pack) {
            return null;
        }
        pack.lineVertex = new Int16Array(this.lineVertex);
        pack.buffers.push(pack.lineVertex.buffer);
        return pack;
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
        let quads, dx, dy, rotation, color;

        if (isText) {
            dx = evaluate(symbol['textDx'], properties) || 0;
            dy = evaluate(symbol['textDy'], properties) || 0;
            const textFill = evaluate(symbol['textFill'], properties) || '#000';
            rotation = evaluate(symbol['textRotation'], properties) || 0;
            color = Color(textFill || '#000').array();
            const font = point.getIconAndGlyph().glyph.font;
            quads = getGlyphQuads(shape.horizontal, alongLine, this.glyphAtlas.positions[font]);
        } else {
            dx = evaluate(symbol['markerDx'], properties) || 0;
            dy = evaluate(symbol['markerDy'], properties) || 0;
            rotation = evaluate(symbol['markerRotation'], properties) || 0;
            quads = getIconQuads(shape);
        }
        for (let i = 0; i < anchors.length; i++) {
            const anchor = anchors[i];
            const l = quads.length;
            for (let ii = 0; ii < l; ii++) {
                const quad = quads[ii];
                const flipQuad = quads[l - 1 - ii];
                const y = quad.glyphOffset[1] + dy;
                //把line的端点存到line vertex array里

                const { tl, tr, bl, br, tex } = quad;
                //char's quad if flipped
                const tl1 = flipQuad.tl, tr1 = flipQuad.tr,
                    bl1 = flipQuad.bl, br1 = flipQuad.br, tex1 = flipQuad.tex;

                data.push(
                    anchor.x, anchor.y, 0,
                    tl.x, tl.y,
                    tex.x, tex.y + tex.h
                );
                this._fillData(data, isText, symbol, dx, y,
                    tl1.x, tl1.y,
                    tex1.x, tex1.y + tex1.h,
                    rotation, size, color, quad.glyphOffset, anchor);

                data.push(
                    anchor.x, anchor.y, 0,
                    tr.x, tr.y,
                    tex.x + tex.w, tex.y + tex.h
                );
                this._fillData(data, isText, symbol, dx, y,
                    tr1.x, tr1.y,
                    tex1.x + tex1.w, tex1.y + tex1.h,
                    rotation, size, color, quad.glyphOffset, anchor);

                data.push(
                    anchor.x, anchor.y, 0,
                    bl.x, bl.y,
                    tex.x, tex.y
                );
                this._fillData(data, isText, symbol, dx, y,
                    bl1.x, bl1.y,
                    tex1.x, tex1.y,
                    rotation, size, color, quad.glyphOffset, anchor);

                data.push(
                    anchor.x, anchor.y, 0,
                    br.x, br.y,
                    tex.x + tex.w, tex.y
                );
                this._fillData(data, isText, symbol, dx, y,
                    br1.x, br1.y,
                    tex1.x + tex1.w, tex1.y,
                    rotation, size, color, quad.glyphOffset, anchor);


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

    /**
     *
     * @param {Number[]} data
     * @param {Boolean} isText
     * @param {Object} symbol
     * @param {Number} dx
     * @param {Number} dy
     * @param {Number} tx - flip quad's x offset
     * @param {Number} ty - flip quad's y offset
     * @param {Number} texx - flip quad's tex coord x
     * @param {Number} texy - flip quad's tex coord y
     * @param {Number} rotation
     * @param {Number[]} size
     * @param {Number[]} color
     */
    _fillData(data, isText, symbol, dx, dy, tx, ty, texx, texy, rotation, size, color, alyphOffset, anchor) {
        if (isText) {
            if (symbol['textPlacement'] === 'line') {
                data.push(
                    tx, ty, texx, texy
                );
                const startIndex = anchor.startIndex;
                data.push(anchor.segment + startIndex, startIndex, anchor.line.length);
            }
            data.push(size[0]);
            data.push(alyphOffset[0], alyphOffset[1]);
            data.push(color[0], color[1], color[2]);
        } else {
            data.push(size[0], size[1]);
        }
        data.push(dx, dy, rotation);
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
                const lineAnchors = getAnchors(lines[i],
                    spacing,
                    TEXT_MAX_ANGLE,
                    shape.vertical || shape.horizontal || shape,
                    null, //shapedIcon,
                    glyphSize,
                    textBoxScale,
                    1, //bucket.overscaling,
                    EXTENT || Infinity
                );
                for (let ii = 0; ii < lineAnchors.length; ii++) {
                    lineAnchors[ii].startIndex = this.lineVertex.length / 3;
                }
                anchors.push.apply(
                    anchors,
                    lineAnchors
                );
                for (let ii = 0; ii < lines[i].length; ii++) {
                    //TODO 0是预留的高度值
                    this.lineVertex.push(lines[i][ii].x, lines[i][ii].y, 0);
                }
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

