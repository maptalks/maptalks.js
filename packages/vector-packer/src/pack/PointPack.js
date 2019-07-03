import VectorPack from './VectorPack';
import StyledPoint from './StyledPoint';
import clipLine from './util/clip_line';
import { getAnchors } from './util/get_anchors';
import classifyRings from './util/classify_rings';
import findPoleOfInaccessibility from './util/find_pole_of_inaccessibility';
import { getGlyphQuads, getIconQuads } from './util/quads';
import { allowsVerticalWritingMode } from './util/script_detection';
import { interpolated } from '@maptalks/function-type';
import { isFnTypeSymbol } from '../style/Util';
import Color from 'color';

const TEXT_MAX_ANGLE = 45 * Math.PI / 100;
const DEFAULT_SPACING = 250;

function getPackSDFFormat(symbol, positionSize) {
    if (symbol['textPlacement'] === 'line' && !symbol['isIconText']) {
        //position, shape0, textcoord0, shape1, textcoord1, size, color, opacity, offset, rotation
        return [
            {
                type: Int16Array,
                width: positionSize,
                name: 'aPosition'
            },
            {
                type: Int16Array,
                width: 2,
                name: 'aShape'
            },
            {
                type: Uint16Array,
                width: 2,
                name: 'aTexCoord'
            },
            {
                type: Uint8Array,
                width: 1,
                name: 'aCount'
            },
            {
                type: Int16Array,
                width: 2,
                name: 'aGlyphOffset'
            },
            //aSegment存放了anchor在line的片段序号
            {
                type: Uint16Array,
                width: 3,
                name: 'aSegment'
            },
            {
                type: Uint8Array,
                width: 1,
                name: 'aVertical'
            }
        ];
    } else {
        return [
            {
                type: Int16Array,
                width: positionSize,
                name: 'aPosition'
            },
            {
                type: Int16Array,
                width: 2,
                name: 'aShape'
            },
            {
                type: Uint16Array,
                width: 2,
                name: 'aTexCoord'
            },
            {
                type: Uint8Array,
                width: 1,
                name: 'aCount'
            }
        ];
    }
}

function getPackMarkerFormat(positionSize) {
    return [
        {
            type: Int16Array,
            width: positionSize,
            name: 'aPosition'
        },
        {
            type: Int16Array,
            width: 2,
            name: 'aShape'
        },
        {
            type: Uint16Array,
            width: 2,
            name: 'aTexCoord'
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
    constructor(features, symbol, options) {
        super(features, symbol, options);
        this._initFnTypes();
    }

    _initFnTypes() {
        //text's function types
        if (isFnTypeSymbol('textFill', this.symbolDef)) {
            this._textFillFn = interpolated(this.symbolDef['textFill']);
        }
        if (isFnTypeSymbol('textSize', this.symbolDef)) {
            this._textSizeFn = interpolated(this.symbolDef['textSize']);
        }
        if (isFnTypeSymbol('textHaloRadius', this.symbolDef)) {
            this._textHaloRadiusFn = interpolated(this.symbolDef['textHaloRadius']);
        }
        if (isFnTypeSymbol('textHaloFill', this.symbolDef)) {
            this._textHaloFillFn = interpolated(this.symbolDef['textHaloFill']);
        }
        if (isFnTypeSymbol('textDx', this.symbolDef)) {
            this._textDxFn = interpolated(this.symbolDef['textDx']);
        }
        if (isFnTypeSymbol('textDy', this.symbolDef)) {
            this._textDyFn = interpolated(this.symbolDef['textDy']);
        }
        if (isFnTypeSymbol('textSpacing', this.symbolDef)) {
            this._textSpacingFn = interpolated(this.symbolDef['textSpacing']);
        }
    }

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
            if (symbol['textPlacement'] === 'line') {
                //isCharsCompact是指英文等字符需要适当缩小间隔，让文字更紧凑
                //但placement为line时，为解决intel gpu的崩溃问题需开启stencil，所以不能缩小间隔，否则会出现文字的削边问题
                glyphReqs.options = { isCharsCompact: false };
            }
        }
        return point;
    }

    getFormat(symbol) {
        const isText = symbol['textName'] !== undefined;
        const format = isText ? getPackSDFFormat(symbol, this.positionSize) : getPackMarkerFormat(this.positionSize);
        if (isText) {
            format.push(...this._getTextFnTypeFormats());
        } else {
            format.push(...this._getMarkerFnTypeFormats());
        }
        return format;
    }

    _getTextFnTypeFormats() {
        const formats = [];
        if (this._textFillFn) {
            formats.push({
                type: Uint8Array,
                width: 4,
                name: 'aTextFill'
            });
        }
        if (this._textSizeFn) {
            formats.push({
                type: Uint8Array,
                width: 1,
                name: 'aTextSize'
            });
        }
        if (this._textHaloFillFn) {
            formats.push({
                type: Uint8Array,
                width: 4,
                name: 'aTextHaloFill'
            });
        }
        if (this._textHaloRadiusFn) {
            formats.push({
                type: Uint8Array,
                width: 1,
                name: 'aTextHaloRadius'
            });
        }
        if (this._textDxFn) {
            formats.push({
                type: Int8Array,
                width: 1,
                name: 'aTextDx'
            });
        }
        if (this._textDyFn) {
            formats.push({
                type: Int8Array,
                width: 1,
                name: 'aTextDy'
            });
        }
        return formats;
    }

    _getMarkerFnTypeFormats() {

    }

    createDataPack() {
        if (!this.iconAtlas && !this.glyphAtlas) {
            return null;
        }
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
        const symbol = point.symbol;
        // const size = point.size;
        const alongLine = symbol['textPlacement'] === 'line' && !symbol['isIconText'] || symbol['markerPlacement'] === 'line';
        const isText = symbol['textName'] !== undefined;
        const isVertical = isText && alongLine && allowsVerticalWritingMode(point.getIconAndGlyph().glyph.text) ? 1 : 0;
        let quads;

        let textFill, textSize, textHaloFill, textHaloRadius, textDx, textDy;
        if (isText) {
            const font = point.getIconAndGlyph().glyph.font;
            quads = getGlyphQuads(shape.horizontal, alongLine, this.glyphAtlas.positions[font]);
            //function type data
            const properties = point.feature.properties;
            if (this._textFillFn) {
                textFill = this._textFillFn(null, properties);
                if (!Array.isArray(textFill)) {
                    textFill = Color(textFill).array();
                }
                if (textFill.length === 3) {
                    textFill.push(255);
                }
            }
            if (this._textSizeFn) {
                textSize = this._textSizeFn(null, properties);
            }
            if (this._textHaloFillFn) {
                textHaloFill = this._textHaloFillFn(null, properties);
                if (!Array.isArray(textHaloFill)) {
                    textHaloFill = Color(textHaloFill).array();
                }
                if (textHaloFill.length === 3) {
                    textHaloFill.push(255);
                }
            }
            if (this._textHaloRadiusFn) {
                textHaloRadius = this._textHaloRadiusFn(null, properties);
            }
            if (this._textDxFn) {
                textDx = this._textDxFn(null, properties);
            }
            if (this._textDyFn) {
                textDy = this._textDyFn(null, properties);
            }
        } else {
            quads = getIconQuads(shape);
        }
        if (textHaloRadius > 1) {
            this.properties['hasHalo'] = 1;
        }
        if (Math.abs(textDx) > 1) {
            this.properties['hasTextDx'] = 1;
        }
        if (Math.abs(textDy) > 1) {
            this.properties['hasTextDy'] = 1;
        }
        const textCount = quads.length;
        const only2D = this.options['only2D'];
        for (let i = 0; i < anchors.length; i++) {
            const anchor = anchors[i];
            const l = quads.length;
            for (let ii = 0; ii < l; ii++) {
                const quad = quads[ii];
                // const y = quad.glyphOffset[1];
                //把line的端点存到line vertex array里
                const { tl, tr, bl, br, tex } = quad;
                //char's quad if flipped
                data.push(anchor.x, anchor.y);
                if (!only2D) {
                    data.push(0);
                }
                data.push(
                    tl.x * 10, tl.y * 10,
                    tex.x, tex.y + tex.h
                );
                if (isText) {
                    this._fillData(data, alongLine, textCount, quad.glyphOffset, anchor, isVertical);
                }
                this._fillFnTypeData(data, textFill, textSize, textHaloFill, textHaloRadius, textDx, textDy);

                data.push(anchor.x, anchor.y);
                if (!only2D) {
                    data.push(0);
                }
                data.push(
                    tr.x * 10, tr.y * 10,
                    tex.x + tex.w, tex.y + tex.h
                );
                if (isText) {
                    this._fillData(data, alongLine, textCount, quad.glyphOffset, anchor, isVertical);
                }
                this._fillFnTypeData(data, textFill, textSize, textHaloFill, textHaloRadius, textDx, textDy);

                data.push(anchor.x, anchor.y);
                if (!only2D) {
                    data.push(0);
                }
                data.push(
                    bl.x * 10, bl.y * 10,
                    tex.x, tex.y
                );
                if (isText) {
                    this._fillData(data, alongLine, textCount, quad.glyphOffset, anchor, isVertical);
                }
                this._fillFnTypeData(data, textFill, textSize, textHaloFill, textHaloRadius, textDx, textDy);

                data.push(anchor.x, anchor.y);
                if (!only2D) {
                    data.push(0);
                }
                data.push(
                    br.x * 10, br.y * 10,
                    tex.x + tex.w, tex.y
                );
                if (isText) {
                    this._fillData(data, alongLine, textCount, quad.glyphOffset, anchor, isVertical);
                }
                this._fillFnTypeData(data, textFill, textSize, textHaloFill, textHaloRadius, textDx, textDy);


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
     * @param {Number} tx - flip quad's x offset
     * @param {Number} ty - flip quad's y offset
     * @param {Number} texx - flip quad's tex coord x
     * @param {Number} texy - flip quad's tex coord y
     */
    _fillData(data, alongLine, textCount, glyphOffset, anchor, vertical) {
        data.push(textCount);
        if (alongLine) {
            data.push(glyphOffset[0], glyphOffset[1]);
            const startIndex = anchor.startIndex;
            data.push(anchor.segment + startIndex, startIndex, anchor.line.length);
            data.push(vertical);
        }
    }

    _fillFnTypeData(data, textFill, textSize, textHaloFill, textHaloRadius, textDx, textDy) {
        if (this._textFillFn) {
            data.push(...textFill);
        }
        if (this._textSizeFn) {
            data.push(textSize);
        }
        if (this._textHaloFillFn) {
            data.push(...textHaloFill);
        }
        if (this._textHaloRadiusFn) {
            data.push(textHaloRadius);
        }
        if (this._textDxFn) {
            data.push(textDx);
        }
        if (this._textDyFn) {
            data.push(textDy);
        }
    }

    _getAnchors(point, shape, scale) {
        const feature = point.feature,
            type = point.feature.type,
            size = point.size,
            symbol = point.symbol,
            placement = this._getPlacement(symbol);

        let anchors = [];
        const glyphSize = 24;
        const fontScale = size[0] / glyphSize;
        const textBoxScale = scale * fontScale;
        // textMaxBoxScale = scale * textMaxSize / glyphSize,
        // textMaxBoxScale = 1, //TODO 可能的最大的 textMaxSize / glyphSize

        const spacing = (symbol['markerSpacing'] ||
            this._textSpacingFn ? this._textSpacingFn(null, point.feature.properties) : symbol['textSpacing'] ||
            DEFAULT_SPACING) * scale;
        const EXTENT = this.options.EXTENT;
        if (placement === 'line') {
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
                if (!isOut(poi, EXTENT)) {
                    anchors.push(poi);
                }
            }
        } else if (feature.type === 2) {
            // https://github.com/mapbox/mapbox-gl-js/issues/3808
            for (let i = 0; i < feature.geometry.length; i++) {
                const line = feature.geometry[i];
                if (!isOut(line[0], EXTENT)) {
                    anchors.push(line[0]);
                }
            }
        } else if (feature.type === 1) {
            for (let i = 0; i < feature.geometry.length; i++) {
                const points = feature.geometry[i];
                for (let ii = 0; ii < points.length; ii++) {
                    const point = points[ii];
                    if (!isOut(point, EXTENT)) {
                        anchors.push(point);
                    }
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

function isOut(point, extent) {
    return point.x < 0 || point.x > extent || point.y < 0 || point.y > extent;
}
