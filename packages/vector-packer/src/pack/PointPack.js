import VectorPack from './VectorPack';
import StyledPoint from './StyledPoint';
import { getPointAnchors } from './util/get_point_anchors.js';
import { getGlyphQuads, getIconQuads, getEmptyIconQuads } from './util/quads';
import { allowsVerticalWritingMode } from './util/script_detection';
import { interpolated, piecewiseConstant } from '@maptalks/function-type';
import { isFnTypeSymbol } from '../style/Util';
import Color from 'color';
import { isOut } from './util/util';

const DEFAULT_SPACING = 250;

function getPackSDFFormat(symbol) {
    if (symbol['textPlacement'] === 'line' && !symbol['isIconText']) {
        //position, shape0, textcoord0, shape1, textcoord1, size, color, opacity, offset, rotation
        return [
            {
                type: Int16Array,
                width: 3,
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
                width: 3,
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

function getPackMarkerFormat() {
    return [
        {
            type: Int16Array,
            width: 3,
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

    static splitPointSymbol(symbol) {
        let iconSymbol = null;
        let textSymbol = null;
        for (const name in symbol) {
            if (name.indexOf('marker') === 0) {
                iconSymbol = iconSymbol || {};
                iconSymbol[name] = symbol[name];
            } else if (name.indexOf('text') === 0) {
                textSymbol = textSymbol || {};
                textSymbol[name] = symbol[name];
            }
        }
        const results = [];
        if (iconSymbol) {
            iconSymbol['isIconText'] = true;
            results.push(iconSymbol);
        }
        if (textSymbol) {
            if (iconSymbol) {
                //用marker的placement和spacing 覆盖文字的
                textSymbol['textPlacement'] = iconSymbol['markerPlacement'];
                textSymbol['textSpacing'] = iconSymbol['markerSpacing'];
                textSymbol['isIconText'] = true;
            }
            results.push(textSymbol);
        }
        if (symbol['visible'] !== undefined) {
            if (iconSymbol) {
                iconSymbol['visible'] = symbol['visible'];
            }
            if (textSymbol) {
                textSymbol['visible'] = symbol['visible'];
            }
        }
        return results;
    }

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
        if (isFnTypeSymbol('textPlacement', this.symbolDef)) {
            this._textPlacementFn = interpolated(this.symbolDef['textPlacement']);
        }
        if (isFnTypeSymbol('textPitchAlignment', this.symbolDef)) {
            this._textPitchAlignFn = piecewiseConstant(this.symbolDef['textPitchAlignment']);
        }
        if (isFnTypeSymbol('textRotationAlignment', this.symbolDef)) {
            this._textRotateAlignFn = piecewiseConstant(this.symbolDef['textRotationAlignment']);
        }

        if (isFnTypeSymbol('markerWidth', this.symbolDef)) {
            this._markerWidthFn = interpolated(this.symbolDef['markerWidth']);
        }
        if (isFnTypeSymbol('markerHeight', this.symbolDef)) {
            this._markerHeightFn = interpolated(this.symbolDef['markerHeight']);
        }

        if (isFnTypeSymbol('markerDx', this.symbolDef)) {
            this._markerDxFn = interpolated(this.symbolDef['markerDx']);
        }
        if (isFnTypeSymbol('markerDy', this.symbolDef)) {
            this._markerDyFn = interpolated(this.symbolDef['markerDy']);
        }
        if (isFnTypeSymbol('markerSpacing', this.symbolDef)) {
            this._markerSpacingFn = interpolated(this.symbolDef['markerSpacing']);
        }
        if (isFnTypeSymbol('markerPlacement', this.symbolDef)) {
            this._markerPlacementFn = piecewiseConstant(this.symbolDef['markerPlacement']);
        }
        if (isFnTypeSymbol('markerOpacity', this.symbolDef) || isFnTypeSymbol('textOpacity', this.symbolDef)) {
            this._opacityFn = interpolated(this.symbolDef['markerOpacity'] || this.symbolDef['textOpacity']);
        }
        if (isFnTypeSymbol('markerPitchAlignment', this.symbolDef)) {
            this._markerPitchAlignFn = piecewiseConstant(this.symbolDef['markerPitchAlignment']);
        }
        if (isFnTypeSymbol('markerRotationAlignment', this.symbolDef)) {
            this._markerRotateAlignFn = piecewiseConstant(this.symbolDef['markerRotationAlignment']);
        }
    }

    createStyledVector(feature, symbol, options, iconReqs, glyphReqs) {
        //每个point的icon和text
        const point = new StyledPoint(feature, symbol, options);
        const iconGlyph = point.getIconAndGlyph();
        if (iconGlyph.icon && !this.options['atlas']) {
            if (!iconReqs[iconGlyph.icon]) {
                iconReqs[iconGlyph.icon] = 1;
            }
        }
        if (iconGlyph.glyph && !this.options['atlas']) {
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
        if (!this.options['allowEmptyPack'] && !iconGlyph.icon && !iconGlyph.glyph) {
            return null;
        }
        return point;
    }

    getFormat(symbol) {
        const isText = symbol['textName'] !== undefined;
        const format = isText ? getPackSDFFormat(symbol) : getPackMarkerFormat();
        if (isText) {
            format.push(...this._getTextFnTypeFormats());
        } else {
            format.push(...this._getMarkerFnTypeFormats());
        }
        if (this._opacityFn) {
            format.push({
                type: Uint8Array,
                width: 1,
                name: 'aColorOpacity'
            });
        }
        if (this._markerPitchAlignFn || this._textPitchAlignFn) {
            format.push({
                type: Uint8Array,
                width: 1,
                name: 'aPitchAlign'
            });
        }
        if (this._markerRotateAlignFn || this._textRotateAlignFn) {
            format.push({
                type: Uint8Array,
                width: 1,
                name: 'aRotationAlign'
            });
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
        const formats = [];
        if (this._markerWidthFn) {
            formats.push({
                type: Uint8Array,
                width: 1,
                name: 'aMarkerWidth'
            });
        }
        if (this._markerHeightFn) {
            formats.push({
                type: Uint8Array,
                width: 1,
                name: 'aMarkerHeight'
            });
        }
        if (this._markerDxFn) {
            formats.push({
                type: Int8Array,
                width: 1,
                name: 'aMarkerDx'
            });
        }
        if (this._markerDyFn) {
            formats.push({
                type: Int8Array,
                width: 1,
                name: 'aMarkerDy'
            });
        }

        return formats;
    }

    createDataPack() {
        if (!this.iconAtlas && !this.glyphAtlas) {
            if (!this.options['allowEmptyPack']) {
                return null;
            } else {
                this.empty = true;
            }
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
        if (!this.options['allowEmptyPack'] && !shape) {
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
        const properties = point.feature.properties;
        // const size = point.size;
        const alongLine = symbol['textPlacement'] === 'line' && !symbol['isIconText'];
        const isText = symbol['textName'] !== undefined;
        const isVertical = isText && alongLine && allowsVerticalWritingMode(point.getIconAndGlyph().glyph.text) ? 1 : 0;

        let quads;
        let textFill, textSize, textHaloFill, textHaloRadius, textDx, textDy;
        let markerWidth, markerHeight, markerDx, markerDy;
        let pitchAlign, rotateAlign;

        if (isText) {
            const font = point.getIconAndGlyph().glyph.font;
            quads = getGlyphQuads(shape.horizontal, alongLine, this.glyphAtlas.positions[font]);
            //function type data
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
            if (this._textPitchAlignFn) {
                pitchAlign = +(this._textPitchAlignFn(null, properties) === 'map');
            }
            if (this._textRotateAlignFn) {
                rotateAlign = +(this._textRotateAlignFn(null, properties) === 'map');
            }
        } else {
            quads = shape ? getIconQuads(shape) : getEmptyIconQuads();

            if (this._markerWidthFn) {
                markerWidth = this._markerWidthFn(null, properties);
            }
            if (this._markerHeightFn) {
                markerHeight = this._markerHeightFn(null, properties);
            }
            if (this._markerDxFn) {
                markerDx = this._markerDxFn(null, properties);
            }
            if (this._markerDyFn) {
                markerDy = this._markerDyFn(null, properties);
            }
            if (this._markerPitchAlignFn) {
                pitchAlign = +(this._markerPitchAlignFn(null, properties) === 'map');
            }
            if (this._markerRotateAlignFn) {
                rotateAlign = +(this._markerRotateAlignFn(null, properties) === 'map');
            }
        }
        let opacity;
        if (this._opacityFn) {
            opacity = this._opacityFn(this.options['zoom'], properties) * 255;
        }
        const extent = this.options.EXTENT;
        const textCount = quads.length;
        const altitude = this.getAltitude(point.feature.properties);
        for (let i = 0; i < anchors.length; i++) {
            const anchor = anchors[i];
            if (isOut(anchor, extent)) {
                continue;
            }
            const x = anchor.x;
            const y = anchor.y;
            const l = quads.length;
            for (let ii = 0; ii < l; ii++) {
                const quad = quads[ii];
                // const y = quad.glyphOffset[1];
                //把line的端点存到line vertex array里
                const { tl, tr, bl, br, tex } = quad;
                //char's quad if flipped
                data.push(x, y, altitude);
                data.push(
                    tl.x * 10, tl.y * 10,
                    tex.x, tex.y + tex.h
                );
                if (isText) {
                    this._fillData(data, alongLine, textCount, quad.glyphOffset, anchor, isVertical);
                }
                this._fillFnTypeData(data, textFill, textSize, textHaloFill, textHaloRadius, textDx, textDy, markerWidth, markerHeight, markerDx, markerDy, opacity, pitchAlign, rotateAlign);

                data.push(x, y, altitude);
                data.push(
                    tr.x * 10, tr.y * 10,
                    tex.x + tex.w, tex.y + tex.h
                );
                if (isText) {
                    this._fillData(data, alongLine, textCount, quad.glyphOffset, anchor, isVertical);
                }
                this._fillFnTypeData(data, textFill, textSize, textHaloFill, textHaloRadius, textDx, textDy, markerWidth, markerHeight, markerDx, markerDy, opacity, pitchAlign, rotateAlign);

                data.push(x, y, altitude);
                data.push(
                    bl.x * 10, bl.y * 10,
                    tex.x, tex.y
                );
                if (isText) {
                    this._fillData(data, alongLine, textCount, quad.glyphOffset, anchor, isVertical);
                }
                this._fillFnTypeData(data, textFill, textSize, textHaloFill, textHaloRadius, textDx, textDy, markerWidth, markerHeight, markerDx, markerDy, opacity, pitchAlign, rotateAlign);

                data.push(x, y, altitude);
                data.push(
                    br.x * 10, br.y * 10,
                    tex.x + tex.w, tex.y
                );
                if (isText) {
                    this._fillData(data, alongLine, textCount, quad.glyphOffset, anchor, isVertical);
                }
                this._fillFnTypeData(data, textFill, textSize, textHaloFill, textHaloRadius, textDx, textDy, markerWidth, markerHeight, markerDx, markerDy, opacity, pitchAlign, rotateAlign);


                this.addElements(currentIdx, currentIdx + 1, currentIdx + 2);
                this.addElements(currentIdx + 1, currentIdx + 2, currentIdx + 3);
                currentIdx += 4;

                const max = Math.max(Math.abs(x), Math.abs(y), Math.abs(altitude));
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

    _fillFnTypeData(data,
        textFill, textSize, textHaloFill, textHaloRadius, textDx, textDy,
        markerWidth, markerHeight, markerDx, markerDy, opacity, pitchAlign, rotateAlign) {
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
        if (this._markerWidthFn) {
            data.push(markerWidth);
        }
        if (this._markerHeightFn) {
            data.push(markerHeight);
        }
        if (this._markerDxFn) {
            data.push(markerDx);
        }
        if (this._markerDyFn) {
            data.push(markerDy);
        }
        if (this._opacityFn) {
            data.push(opacity);
        }
        if (this._textPitchAlignFn || this._markerPitchAlignFn) {
            data.push(pitchAlign);
        }
        if (this._markerRotateAlignFn ||  this._textRotateAlignFn) {
            data.push(rotateAlign);
        }
        //update pack properties
        if (textHaloRadius > 0) {
            this.properties['hasHalo'] = 1;
        }
    }

    _getAnchors(point, shape, scale) {
        const { feature, symbol } = point;
        const placement = this._getPlacement(symbol, point);
        const properties = feature.properties;
        const spacing = (
            (this._markerSpacingFn ? this._markerSpacingFn(null, properties) : symbol['markerSpacing']) ||
            (this._textSpacingFn ? this._textSpacingFn(null, properties) : symbol['textSpacing']) ||
            DEFAULT_SPACING
        ) * scale;
        const EXTENT = this.options.EXTENT;
        const anchors = getPointAnchors(point, this.lineVertex, shape, scale, EXTENT, placement, spacing);
        //TODO 还需要mergeLines
        return anchors;
    }

    _getPlacement(symbol, point) {
        if (this._markerPlacementFn) {
            return this._markerPlacementFn(null, point.feature && point.feature.properties);
        }
        if (this._textPlacementFn) {
            return this._textPlacementFn(null, point.feature && point.feature.properties);
        }
        return symbol.markerPlacement || symbol.textPlacement;
    }
}
