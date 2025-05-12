import VectorPack from './VectorPack';
import StyledPoint from './StyledPoint';
import { getPointAnchors } from './util/get_point_anchors.js';
import { getGlyphQuads, getIconQuads, getEmptyIconQuads } from './util/quads';
import { allowsVerticalWritingMode } from './util/script_detection';
import { isOut, isNil, wrap, getFeaAltitudeAndHeight } from './util/util';
import mergeLineFeatures from './util/merge_line_features';
import { isFunctionDefinition } from '@maptalks/function-type';
import { normalizeColor } from '../style/Util';

export const TEXT_MAX_ANGLE = 80;

const DEFAULT_SPACING = 250;
const DEFAULT_UNIFORMS = {
    'textFill': [0, 0, 0, 1],
    'textOpacity': 1,
    'textPitchAlignment': 0,
    'textRotationAlignment': 0,
    'textHaloRadius': 0,
    'textHaloFill': [1, 1, 1, 1],
    'textHaloBlur': 0,
    'textHaloOpacity': 1,
    'textPerspectiveRatio': 0,
    'textSize': 14,
    'textDx': 0,
    'textDy': 0,
    'textRotation': 0
};


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

    static needMerge(symbolDef, fnTypes, zoom) {
        if (!symbolDef) {
            return false;
        }
        let isLinePlacement = symbolDef['textPlacement'] === 'line' || symbolDef['markerPlacement'] === 'line';
        if (!isLinePlacement) {
            if (fnTypes['textPlacementFn']) {
                isLinePlacement = fnTypes['textPlacementFn'](zoom) === 'line';
            }
            if (fnTypes['markerPlacementFn']) {
                isLinePlacement = fnTypes['markerPlacementFn'](zoom) === 'line';
            }
        }
        return symbolDef['mergeOnProperty'] && isLinePlacement;
    }

    static mergeLineFeatures(features, symbolDef, fnTypes, zoom) {
        let textPlacement = symbolDef['textPlacement'];
        let markerPlacement = symbolDef['markerPlacement'];
        if (fnTypes['textPlacementFn']) {
            textPlacement = fnTypes['textPlacementFn'](zoom);
        }
        if (fnTypes['markerPlacementFn']) {
            markerPlacement = fnTypes['markerPlacementFn'](zoom);
        }
        if (textPlacement !== 'line' && markerPlacement !== 'line') {
            return features;
        }
        return mergeLineFeatures(features, symbolDef, fnTypes, zoom);
    }

    static splitPointSymbol(symbol, idx = 0) {
        const results = [];
        if (Array.isArray(symbol)) {
            const symbols = symbol;
            for (let i = 0; i < symbols.length; i++) {
                if (!symbols[i]) {
                    continue;
                }
                results.push(...PointPack.splitPointSymbol(symbols[i], i));
            }
            return results;
        }
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
        if (iconSymbol) {
            iconSymbol['isIconText'] = true;
            if (symbol['mergeOnProperty']) {
                iconSymbol['mergeOnProperty'] = symbol['mergeOnProperty'];
            }
            results.push(iconSymbol);
        }
        if (textSymbol) {
            if (iconSymbol) {
                //用marker的placement和spacing 覆盖文字的
                textSymbol['textPlacement'] = iconSymbol['markerPlacement'];
                textSymbol['textSpacing'] = iconSymbol['markerSpacing'];
                textSymbol['isIconText'] = true;
            }
            if (symbol['mergeOnProperty']) {
                textSymbol['mergeOnProperty'] = symbol['mergeOnProperty'];
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
        if (iconSymbol) {
            if (iconSymbol.markerTextFit && textSymbol) {
                // 存在markerTextFit时，需要根据textSize和text长度实时计算marker高宽，所以需要保存下面的信息
                iconSymbol.text = {};
                iconSymbol.text.textName = textSymbol.textName;
                iconSymbol.text.textSize = textSymbol.textSize;
            }
            iconSymbol.index = {
                index: idx,
                type: 0
            };
        }
        if (textSymbol) {
            textSymbol.index = {
                index: idx,
                type: 1
            };
        }
        return results;
    }

    static isAtlasLoaded(iconGlyph, atlas) {
        const { icon, glyph } = iconGlyph;
        const { iconAtlas, glyphAtlas } = atlas;
        if (icon) {
            if (!iconAtlas || !iconAtlas.positions[icon.url]) {
                return false;
            }
        }
        if (glyph) {
            if (!glyphAtlas || !glyphAtlas.positions[glyph.font]) {
                return false;
            }
            const fontGlphy = glyphAtlas.positions[glyph.font];
            const { text } = glyph;
            for (const codePoint of text) {
                if (!fontGlphy[codePoint.codePointAt(0)]) {
                    return false;
                }
            }
        }
        return true;
    }

    constructor(features, symbol, options) {
        super(features, symbol, options);
        this._textPlacement = symbol['textPlacement'];
        if (this._fnTypes['textPlacementFn']) {
            this._textPlacement = this._fnTypes['textPlacementFn'](this.options.zoom);
        }
    }

    createStyledVector(feature, symbol, fnTypes, options, iconReqs, glyphReqs) {
        //每个point的icon和text
        const point = new StyledPoint(feature, this.symbolDef, symbol, fnTypes, options);
        const iconGlyph = point.getIconAndGlyph();
        if (iconGlyph.icon && !this.options['atlas']) {
            const { url, iconSize: size } = iconGlyph.icon;
            // 有时请求同一个图片时，尺寸不同 (例如有 markerTextFit 时)，只保存最大的尺寸
            if (!iconReqs[url]) {
                iconReqs[url] = iconGlyph.icon.iconSize;
            }
            if (iconReqs[url][0] < size[0]) {
                iconReqs[url][0] = size[0];
            }
            if (iconReqs[url][1] < size[1]) {
                iconReqs[url][1] = size[1];
            }
        }
        if (iconGlyph.glyph && !this.options['atlas']) {
            const { font, text } = iconGlyph.glyph;
            const fontGlphy = glyphReqs[font] = glyphReqs[font] || {};
            for (const codePoint of text) {
                fontGlphy[codePoint.codePointAt(0)] = 1;
                //TODO mapbox-gl 这里对 vertical 字符做了特殊处理
            }
            if (this._textPlacement === 'line') {
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
        const isTextPlugin = this.options.pluginType === 'text';
        const isLineText = this._textPlacement === 'line' && !symbol['isIconText'];
        const format = this.getPackSDFFormat(symbol);
        format.push(...this._getTextFnTypeFormats());
        if (!isLineText) {
            format.push(...this._getMarkerFnTypeFormats());
        }
        const { markerOpacityFn, textOpacityFn, markerPitchAlignmentFn, textPitchAlignmentFn,
            markerRotationAlignmentFn, textRotationAlignmentFn, markerRotationFn, textRotationFn,
            markerAllowOverlapFn, textAllowOverlapFn, markerIgnorePlacementFn, textIgnorePlacementFn } = this._fnTypes;
        if (markerOpacityFn) {
            format.push({
                type: Uint8Array,
                width: 2,
                name: 'aColorOpacity'
            });
        } else if (textOpacityFn) {
            format.push({
                type: Uint8Array,
                width: 1,
                name: 'aColorOpacity'
            });
        }
        if (markerPitchAlignmentFn || textPitchAlignmentFn) {
            format.push({
                type: Uint8Array,
                width: isTextPlugin ? 1 : 2,
                name: 'aPitchAlign'
            });
        }
        if (markerRotationAlignmentFn || textRotationAlignmentFn) {
            format.push({
                type: Uint8Array,
                width: isTextPlugin ? 1 : 2,
                name: 'aRotationAlign'
            });
        }
        if (markerRotationFn || textRotationFn) {
            format.push({
                type: Uint16Array,
                width: isTextPlugin ? 1 : 2,
                name: 'aRotation'
            });
        }
        if (markerAllowOverlapFn || textAllowOverlapFn || markerIgnorePlacementFn || textIgnorePlacementFn) {
            format.push({
                type: Uint8Array,
                width: 1,
                name: 'aOverlap'
            });
        }
        return format;
    }

    _is3DPitchText() {
        return this.hasMapPitchAlign;
    }

    _getTextFnTypeFormats() {
        const { textFillFn, textSizeFn,
            textHaloFillFn, textHaloRadiusFn,
            textHaloOpacityFn,
            textDxFn, textDyFn
        } = this._fnTypes;
        const formats = [];
        if (textFillFn) {
            formats.push({
                type: Uint8Array,
                width: 4,
                name: 'aTextFill'
            });
        }
        if (textSizeFn) {
            formats.push({
                type: Uint8Array,
                width: 1,
                name: 'aTextSize'
            });
        }
        if (textHaloFillFn) {
            formats.push({
                type: Uint8Array,
                width: 4,
                name: 'aTextHaloFill'
            });
        }
        if (textHaloRadiusFn || textHaloOpacityFn) {
            formats.push({
                type: Uint8Array,
                width: 2,
                name: 'aTextHalo'
            });
        }
        // if (textHaloOpacityFn) {
        //     formats.push({
        //         type: Uint8Array,
        //         width: 1,
        //         name: 'aTextHaloOpacity'
        //     });
        // }
        if (textDxFn) {
            formats.push({
                type: Int8Array,
                width: 1,
                name: 'aTextDx'
            });
        }
        if (textDyFn) {
            formats.push({
                type: Int8Array,
                width: 1,
                name: 'aTextDy'
            });
        }
        return formats;
    }

    _getMarkerFnTypeFormats() {
        const { markerWidthFn, markerHeightFn, markerDxFn, markerDyFn, textDxFn, textDyFn } = this._fnTypes;
        const formats = [];
        if (markerWidthFn) {
            formats.push({
                type: this.options['markerWidthType'] || Uint8Array,
                width: 1,
                name: 'aMarkerWidth'
            });
        }
        if (markerHeightFn) {
            formats.push({
                type: this.options['markerHeightType'] || Uint8Array,
                width: 1,
                name: 'aMarkerHeight'
            });
        }
        if (markerDxFn || textDxFn) {
            formats.push({
                type: Int8Array,
                width: 1,
                name: 'aMarkerDx'
            });
        }
        if (markerDyFn || textDyFn) {
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
        this.countOutOfAngle = 0;
        this.lineVertex = [];
        const pack = super.createDataPack.apply(this, arguments);
        if (!pack) {
            return null;
        }
        pack.lineVertex = new Int16Array(this.lineVertex);
        pack.buffers.push(pack.lineVertex.buffer);
        return pack;
    }

    placeVector(point, scale) {
        const shape = point.getShape(this.iconAtlas, this.glyphAtlas);
        if (!shape) {
            return;
        }
        const { iconShape, textShape } = shape;
        const invalidIconShape = !iconShape || !iconShape.image;
        const invalidTextShape = !textShape || !textShape.horizontal && !textShape.vertical;
        if (!this.options['allowEmptyPack'] && invalidIconShape && invalidTextShape) {
            return;
        }
        const anchors = this._getAnchors(point, textShape || iconShape, scale);
        this.countOutOfAngle += anchors.countOutOfAngle || 0;
        const count = anchors.length;
        if (count === 0) {
            return;
        }
        const data = this.data;
        const positionSize = this.needAltitudeAttribute() ? 2 : 3;
        // must use aPosition.getLength() instead of .length
        let currentIdx = this.data.aPosition.getLength() / positionSize;
        // const minZoom = this.options.minZoom,
        //     maxZoom = this.options.maxZoom;
        const symbol = point.symbol;
        const properties = point.feature.properties;
        // const size = point.size;
        const alongLine = this._textPlacement === 'line' && !symbol['isIconText'];
        const hasText = !invalidTextShape;
        const hasIcon = !invalidIconShape;
        const isVertical = hasText && alongLine && allowsVerticalWritingMode(point.getIconAndGlyph().glyph.text) ? 1 : 0;
        const { textFillFn, textSizeFn, textHaloFillFn, textHaloRadiusFn, textHaloOpacityFn, textDxFn, textDyFn,
            textPitchAlignmentFn, textRotationAlignmentFn, textRotationFn,
            textAllowOverlapFn, textIgnorePlacementFn,
            textOpacityFn,
            markerWidthFn, markerHeightFn, markerDxFn, markerDyFn,
            markerPitchAlignmentFn, markerRotationAlignmentFn, markerRotationFn,
            markerAllowOverlapFn, markerIgnorePlacementFn,
            markerOpacityFn
        } = this._fnTypes;

        let textFill = [0, 0, 0, 0];
        let textSize = DEFAULT_UNIFORMS['textSize'];
        let textHaloFill = [0, 0, 0, 0];
        let textHaloRadius = 0;
        let textHaloOpacity = 0;
        let textDx = 0;
        let textDy = 0;

        let markerWidth = 0;
        let markerHeight = 0;
        let markerDx = 0;
        let markerDy = 0;

        let markerPitchAlign = 0, textPitchAlign = 0;
        let markerRotateAlign = 0, textRotateAlign = 0;
        let markerRotation = 0, textRotation = 0;
        let allowOverlap, ignorePlacement;
        let textQuads;
        if (hasText) {
            const font = point.getIconAndGlyph().glyph.font;
            textQuads = getGlyphQuads(textShape.horizontal, alongLine, this.glyphAtlas.positions[font]);
            //function type data
            if (textFillFn) {
                textFill = textFillFn(null, properties);
                if (isFunctionDefinition(textFill)) {
                    this.dynamicAttrs['aTextFill'] = 1;
                    // 说明是identity返回的仍然是个fn-type，fn-type-util.js中会计算刷新，这里不用计算

                } else {
                    textFill = normalizeColor([], textFill);
                }
            }
            if (textSizeFn) {
                textSize = textSizeFn(this.options['zoom'], properties);
                if (isNil(textSize)) {
                    textSize = DEFAULT_UNIFORMS['textSize'];
                }
            }
            if (textHaloFillFn) {
                textHaloFill = textHaloFillFn(null, properties);
                if (isFunctionDefinition(textHaloFill)) {
                    this.dynamicAttrs['aTextHaloFill'] = 1;
                    // 说明是identity返回的仍然是个fn-type，fn-type-util.js中会计算刷新，这里不用计算
                    // textHaloFill = [0, 0, 0, 0];
                } else {
                    textHaloFill = normalizeColor([], textHaloFill);
                }
            }
            if (textHaloRadiusFn) {
                textHaloRadius = textHaloRadiusFn(null, properties);
            }
            if (textHaloOpacityFn) {
                textHaloOpacity = textHaloOpacityFn(null, properties) * 255;
            }
            if (textDxFn) {
                textDx = textDxFn(null, properties) || 0;
            }
            if (textDyFn) {
                textDy = textDyFn(null, properties) || 0;
            }
            if (textPitchAlignmentFn) {
                textPitchAlign = +(textPitchAlignmentFn(null, properties) === 'map');
            }
            if (textRotationAlignmentFn) {
                textRotateAlign = +(textRotationAlignmentFn(null, properties) === 'map');
            }
            if (textRotationFn) {
                textRotation = wrap(textRotationFn(null, properties), 0, 360) * Math.PI / 180;
            }
        }
        let iconQuads;
        if (hasIcon) {

            iconQuads = iconShape ? getIconQuads(iconShape) : getEmptyIconQuads();
            if (markerWidthFn) {
                markerWidth = markerWidthFn(null, properties);
            }
            if (isNil(markerWidth)) {
                markerWidth = iconQuads[0].tex.w;
            }
            if (markerHeightFn) {
                markerHeight = markerHeightFn(null, properties);
            }
            if (isNil(markerHeight)) {
                markerHeight = iconQuads[0].tex.h;
            }
            if (markerDxFn) {
                markerDx = markerDxFn(null, properties);
            }
            if (markerDyFn) {
                markerDy = markerDyFn(null, properties);
            }
            if (markerPitchAlignmentFn) {
                markerPitchAlign = +(markerPitchAlignmentFn(null, properties) === 'map');
            }
            if (markerRotationAlignmentFn) {
                markerRotateAlign = +(markerRotationAlignmentFn(null, properties) === 'map');
            }
            if (markerRotationFn) {
                markerRotation = wrap(markerRotationFn(null, properties), 0, 360) * Math.PI / 180;
            }
        }

        if (isFunctionDefinition(textSize)) {
            this.dynamicAttrs['aTextSize'] = 1;
        }
        if (isFunctionDefinition(textHaloRadius) || isFunctionDefinition(textHaloOpacity)) {
            this.dynamicAttrs['aTextHalo'] = 1;
        }
        // if (isFunctionDefinition(textHaloOpacity)) {
        //     this.dynamicAttrs['aTextHaloOpacity'] = 1;
        // }
        // if (isFunctionDefinition(textDx)) {
        //     this.dynamicAttrs['aDxDy'] = 1;
        // }
        // if (isFunctionDefinition(textDy)) {
        //     this.dynamicAttrs['aDxDy'] = 1;
        // }
        if (isFunctionDefinition(markerWidth)) {
            this.dynamicAttrs['aMarkerWidth'] = 1;
        }
        if (isFunctionDefinition(markerHeight)) {
            this.dynamicAttrs['aMarkerHeight'] = 1;
        }
        if (isFunctionDefinition(markerDx) || isFunctionDefinition(textDx)) {
            this.dynamicAttrs['aDxDy'] = 1;
        }
        if (isFunctionDefinition(markerDy) || isFunctionDefinition(textDx)) {
            this.dynamicAttrs['aDxDy'] = 1;
        }
        if (isFunctionDefinition(markerPitchAlign) || isFunctionDefinition(textPitchAlign)) {
            this.dynamicAttrs['aPitchAlign'] = 1;
        }
        if (isFunctionDefinition(markerRotateAlign) || isFunctionDefinition(textRotateAlign)) {
            this.dynamicAttrs['aRotationAlign'] = 1;
        }
        if (isFunctionDefinition(markerRotation) || isFunctionDefinition(textRotation)) {
            this.dynamicAttrs['aRotation'] = 1;
        }

        const allowOverlapFn = markerAllowOverlapFn || textAllowOverlapFn;
        if (allowOverlapFn) {
            if (markerAllowOverlapFn) {
                allowOverlap = markerAllowOverlapFn(null, properties) || 0;
            }
            if (!allowOverlap && textAllowOverlapFn) {
                allowOverlap = textAllowOverlapFn(null, properties) || 0;
            }
        }
        const ignorePlacementFn = markerIgnorePlacementFn || textIgnorePlacementFn;
        if (ignorePlacementFn) {
            if (markerIgnorePlacementFn) {
                ignorePlacement = markerIgnorePlacementFn(null, properties) || 0;
            }
            if (!ignorePlacement && textIgnorePlacementFn) {
                ignorePlacement = textIgnorePlacementFn(null, properties) || 0;
            }
        }
        let opacity;
        const opacityFn = markerOpacityFn;
        if (opacityFn) {
            opacity = (opacityFn(this.options['zoom'], properties) || 0) * 255;
        }
        let textOpacity = 0;
        if (textOpacityFn) {
            textOpacity = (textOpacityFn(this.options['zoom'], properties) || 0) * 255;
        }

        const textCount = textQuads && textQuads.length || 0;
        // 每个 quad 会调用4次 _fillPos, _fillTextData 和 _fillFnTypeData
        this.ensureDataCapacity(4 * (textCount + (iconQuads && iconQuads.length || 0)), anchors.length);

        const extent = this.options.EXTENT;
        const { altitudeScale, altitudeProperty, defaultAltitude } = this.options;
        const { altitude: featureAltitude } = getFeaAltitudeAndHeight(point.feature, altitudeScale, altitudeProperty, defaultAltitude);

        const needAltitudeAttribute = this.needAltitudeAttribute();
        const fillQuadData = (isText, quads, x, y, altitude, anchor, isHalo) => {
            if (!quads) {
                return;
            }
            const charCount = isText ? textCount : 1;
            for (let i = 0; i < quads.length; i++) {
                const quad = quads[i];
                // const y = quad.glyphOffset[1];
                //把line的端点存到line vertex array里
                const { tl, tr, bl, br, tex } = quad;
                //char's quad if flipped
                this._fillPos(data, x, y, altitude, tl.x * 10, tl.y * 10,
                    tex.x, tex.y + tex.h, isText, isHalo);
                this._fillTextData(data, alongLine, charCount, quad.glyphOffset, anchor, isVertical, anchor.axis, anchor.angleR);

                this._fillFnTypeData(data, textFill, textSize, textHaloFill, textHaloRadius, textHaloOpacity, textDx, textDy,
                    markerWidth, markerHeight, markerDx, markerDy, opacity, textOpacity, markerPitchAlign, textPitchAlign,
                    markerRotateAlign, textRotateAlign,
                    markerRotation, textRotation,
                    allowOverlap, ignorePlacement);

                this._fillPos(data, x, y, altitude, tr.x * 10, tr.y * 10,
                    tex.x + tex.w, tex.y + tex.h, isText, isHalo);
                this._fillTextData(data, alongLine, charCount, quad.glyphOffset, anchor, isVertical, anchor.axis, anchor.angleR);

                this._fillFnTypeData(data, textFill, textSize, textHaloFill, textHaloRadius, textHaloOpacity, textDx, textDy,
                    markerWidth, markerHeight, markerDx, markerDy, opacity, textOpacity, markerPitchAlign, textPitchAlign,
                    markerRotateAlign, textRotateAlign,
                    markerRotation, textRotation,
                    allowOverlap, ignorePlacement);

                this._fillPos(data, x, y, altitude, bl.x * 10, bl.y * 10,
                    tex.x, tex.y, isText, isHalo);
                this._fillTextData(data, alongLine, charCount, quad.glyphOffset, anchor, isVertical, anchor.axis, anchor.angleR);

                this._fillFnTypeData(data, textFill, textSize, textHaloFill, textHaloRadius, textHaloOpacity, textDx, textDy,
                    markerWidth, markerHeight, markerDx, markerDy, opacity, textOpacity, markerPitchAlign, textPitchAlign,
                    markerRotateAlign, textRotateAlign,
                    markerRotation, textRotation,
                    allowOverlap, ignorePlacement);

                this._fillPos(data, x, y, altitude, br.x * 10, br.y * 10,
                    tex.x + tex.w, tex.y, isText, isHalo);
                this._fillTextData(data, alongLine, charCount, quad.glyphOffset, anchor, isVertical, anchor.axis, anchor.angleR);

                this._fillFnTypeData(data, textFill, textSize, textHaloFill, textHaloRadius, textHaloOpacity, textDx, textDy,
                    markerWidth, markerHeight, markerDx, markerDy, opacity, textOpacity, markerPitchAlign, textPitchAlign,
                    markerRotateAlign, textRotateAlign,
                    markerRotation, textRotation,
                    allowOverlap, ignorePlacement);


                this.addElements(currentIdx, currentIdx + 1, currentIdx + 2);
                this.addElements(currentIdx + 1, currentIdx + 2, currentIdx + 3);
                currentIdx += 4;

                let max;
                if (needAltitudeAttribute) {
                    max = Math.max(Math.abs(x), Math.abs(y));
                } else {
                    max = Math.max(Math.abs(x), Math.abs(y), Math.abs(altitude));
                }
                if (max > this.maxPos) {
                    this.maxPos = max;
                }
            }
        }

        const isTextPlugin = this.options.pluginType === 'text';

        for (let i = 0; i < anchors.length; i++) {
            const anchor = anchors[i];
            const altitude = anchor.z || featureAltitude || 0;
            if (extent !== Infinity && isOut(anchor, extent)) {
                continue;
            }
            const x = anchor.x;
            const y = anchor.y;
            // const l = quads.length;
            if (hasIcon) {
                fillQuadData(false, iconQuads, x, y, altitude, anchor);
            }

            if (hasText) {
                // halo
                if (!isTextPlugin) {
                    // halo attributes
                    fillQuadData(true, textQuads, x, y, altitude, anchor, true);
                }
                fillQuadData(true, textQuads, x, y, altitude, anchor, false);
            }
        }
    }

    _fillPos(data, x, y, altitude, shapeX, shapeY, texX, texY, isText, isHalo) {

        this.fillPosition(data, x, y, altitude);

        let index = data.aShape.currentIndex;
        data.aShape[index++] = shapeX;
        data.aShape[index++] = shapeY;
        data.aShape.currentIndex = index;

        index = data.aTexCoord.currentIndex;
        data.aTexCoord[index++] = texX;
        data.aTexCoord[index++] = texY;
        if (this.options.pluginType !== 'text') {
            data.aTexCoord[index++] = +!!isText;
            data.aTexCoord[index++] = +!!isHalo;
        }
        data.aTexCoord.currentIndex = index;

        // data.aShape.push(shapeX, shapeY);
        // data.aTexCoord.push(texX, texY);
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
    _fillTextData(data, alongLine, textCount, glyphOffset, anchor, vertical, axis, angleR) {
        // data.aCount.push(textCount);

        let index = data.aCount.currentIndex;
        data.aCount[index++] = textCount;
        data.aCount.currentIndex = index;

        if (alongLine) {
            // data.aGlyphOffset.push(glyphOffset[0], glyphOffset[1]);
            index = data.aGlyphOffset.currentIndex;
            data.aGlyphOffset[index++] = glyphOffset[0];
            data.aGlyphOffset[index++] = glyphOffset[1];
            data.aGlyphOffset.currentIndex = index;

            if (this._is3DPitchText()) {
                // data.aPitchRotation.push(axis[0], axis[1], angleR);
                index = data.aPitchRotation.currentIndex;
                data.aPitchRotation[index++] = axis[0];
                data.aPitchRotation[index++] = axis[1];
                data.aPitchRotation[index++] = angleR;
                data.aPitchRotation.currentIndex = index;
            }
            const startIndex = anchor.startIndex;
            // data.aSegment.push(anchor.segment + startIndex, startIndex, anchor.line.length);
            index = data.aSegment.currentIndex;
            data.aSegment[index++] = anchor.segment + startIndex;
            data.aSegment[index++] = startIndex;
            data.aSegment[index++] = anchor.line.length;
            data.aSegment.currentIndex = index;

            // data.aVertical.push(vertical);
            index = data.aVertical.currentIndex;
            data.aVertical[index++] = vertical;
            data.aVertical.currentIndex = index;
        }
    }

    _fillFnTypeData(data,
        textFill, textSize, textHaloFill, textHaloRadius, textHaloOpacity, textDx, textDy,
        markerWidth, markerHeight, markerDx, markerDy, opacity, textOpacity,
        markerPitchAlign, textPitchAlign, markerRotateAlign, textRotateAlign, markerRotation, textRotation,
        allowOverlap, ignorePlacement) {
        const { textFillFn, textSizeFn, textHaloFillFn, textHaloRadiusFn, textDxFn, textDyFn,
            textPitchAlignmentFn, textRotationAlignmentFn, textRotationFn,
            textAllowOverlapFn, textIgnorePlacementFn,
            textOpacityFn, textHaloOpacityFn,
            markerWidthFn, markerHeightFn, markerDxFn, markerDyFn,
            markerPitchAlignmentFn, markerRotationAlignmentFn, markerRotationFn,
            markerAllowOverlapFn, markerIgnorePlacementFn,
            markerOpacityFn } = this._fnTypes;
        if (textFillFn) {
            // data.aTextFill.push(...textFill);
            let index = data.aTextFill.currentIndex;
            data.aTextFill[index++] = textFill[0];
            data.aTextFill[index++] = textFill[1];
            data.aTextFill[index++] = textFill[2];
            data.aTextFill[index++] = textFill[3];
            data.aTextFill.currentIndex = index;
        }
        if (textSizeFn) {
            // data.aTextSize.push(textSize);
            let index = data.aTextSize.currentIndex;
            data.aTextSize[index++] = textSize;
            data.aTextSize.currentIndex = index;
        }
        if (textHaloFillFn) {
            // data.aTextHaloFill.push(...textHaloFill);
            let index = data.aTextHaloFill.currentIndex;
            data.aTextHaloFill[index++] = textHaloFill[0];
            data.aTextHaloFill[index++] = textHaloFill[1];
            data.aTextHaloFill[index++] = textHaloFill[2];
            data.aTextHaloFill[index++] = textHaloFill[3];
            data.aTextHaloFill.currentIndex = index;
        }
        if (textHaloRadiusFn || textHaloOpacityFn) {
            // data.aTextHaloRadius.push(textHaloRadius);
            let index = data.aTextHalo.currentIndex;
            data.aTextHalo[index++] = textHaloRadius || 0;
            data.aTextHalo.currentIndex = index;

            index = data.aTextHalo.currentIndex;
            data.aTextHalo[index++] = (isNil(textHaloOpacity) ? 1 : textHaloOpacity) * 255;
            data.aTextHalo.currentIndex = index;
        }
        // if (textHaloOpacityFn) {
        //     // data.aTextHaloOpacity.push(textHaloOpacity);
        //     let index = data.aTextHaloOpacity.currentIndex;
        //     data.aTextHaloOpacity[index++] = textHaloOpacity;
        //     data.aTextHaloOpacity.currentIndex = index;
        // }
        if (textDxFn) {
            // data.aTextDx.push(textDx);
            let index = data.aTextDx.currentIndex;
            data.aTextDx[index++] = textDx;
            data.aTextDx.currentIndex = index;
        }
        if (textDyFn) {
            // data.aTextDy.push(textDy);
            let index = data.aTextDy.currentIndex;
            data.aTextDy[index++] = textDy;
            data.aTextDy.currentIndex = index;
        }
        if (markerWidthFn) {
            // data.aMarkerWidth.push(markerWidth);
            let index = data.aMarkerWidth.currentIndex;
            data.aMarkerWidth[index++] = markerWidth;
            data.aMarkerWidth.currentIndex = index;
        }
        if (markerHeightFn) {
            // data.aMarkerHeight.push(markerHeight);
            let index = data.aMarkerHeight.currentIndex;
            data.aMarkerHeight[index++] = markerHeight;
            data.aMarkerHeight.currentIndex = index;
        }
        if (markerDxFn) {
            // data.aMarkerDx.push(markerDx);
            let index = data.aMarkerDx.currentIndex;
            data.aMarkerDx[index++] = markerDx;
            data.aMarkerDx.currentIndex = index;
        }
        if (markerDyFn) {
            // data.aMarkerDy.push(markerDy);
            let index = data.aMarkerDy.currentIndex;
            data.aMarkerDy[index++] = markerDy;
            data.aMarkerDy.currentIndex = index;
        }
        const isTextPlugin = this.options.pluginType === 'text';
        const opacityFn = markerOpacityFn;
        if (!isTextPlugin && (opacityFn || textOpacityFn)) {
            // debugger
            if (!opacityFn) {
                opacity = 255;
            }
            let index = data.aColorOpacity.currentIndex;
            data.aColorOpacity[index++] = opacity;
            data.aColorOpacity.currentIndex = index;
            if (textOpacityFn) {
                opacity = textOpacity;
            } else {
                opacity = 255;
            }
            index = data.aColorOpacity.currentIndex;
            data.aColorOpacity[index++] = opacity;
            data.aColorOpacity.currentIndex = index;
        }
        if (isTextPlugin && textOpacityFn) {
            let index = data.aColorOpacity.currentIndex;
            data.aColorOpacity[index++] = textOpacity;
            data.aColorOpacity.currentIndex = index;
        }

        if (textPitchAlignmentFn || markerPitchAlignmentFn) {
            if (isTextPlugin) {
                let index = data.aPitchAlign.currentIndex;
                data.aPitchAlign[index++] = textPitchAlign;
                data.aPitchAlign.currentIndex = index;
            } else {
                let index = data.aPitchAlign.currentIndex;
                data.aPitchAlign[index++] = markerPitchAlign;
                data.aPitchAlign.currentIndex = index;
                index = data.aPitchAlign.currentIndex;
                data.aPitchAlign[index++] = textPitchAlign;
                data.aPitchAlign.currentIndex = index;
            }
        }
        if (markerRotationAlignmentFn ||  textRotationAlignmentFn) {
            if (isTextPlugin) {
                let index = data.aRotationAlign.currentIndex;
                data.aRotationAlign[index++] = textRotateAlign;
                data.aRotationAlign.currentIndex = index;
            } else {
                let index = data.aRotationAlign.currentIndex;
                data.aRotationAlign[index++] = markerRotateAlign;
                data.aRotationAlign.currentIndex = index;
                index = data.aRotationAlign.currentIndex;
                data.aRotationAlign[index++] = textRotateAlign;
                data.aRotationAlign.currentIndex = index;
            }

        }
        if (markerRotationFn || textRotationFn) {
            if (isTextPlugin) {
                // data.aRotation.push(rotation * 9362)
                let index = data.aRotation.currentIndex;
                data.aRotation[index++] = textRotation * 9362;
                data.aRotation.currentIndex = index;
            } else {
                let index = data.aRotation.currentIndex;
                data.aRotation[index++] = markerRotation * 9362;
                data.aRotation.currentIndex = index;
                index = data.aRotation.currentIndex;
                data.aRotation[index++] = textRotation * 9362;
                data.aRotation.currentIndex = index;
            }

        }
        const allowOverlapFn = markerAllowOverlapFn || textAllowOverlapFn;
        const ignorePlacementFn = markerIgnorePlacementFn || textIgnorePlacementFn;
        if (allowOverlapFn || ignorePlacementFn) {
            const overlap = (allowOverlapFn ? 1 << 3 : 0) + allowOverlap * (1 << 2);
            const placement = (ignorePlacementFn ? 1 << 1 : 0) + ignorePlacement;
            // data.aOverlap.push(overlap + placement);
            let index = data.aOverlap.currentIndex;
            data.aOverlap[index++] = overlap + placement;
            data.aOverlap.currentIndex = index;
        }
        //update pack properties
        if (textHaloRadius > 0) {
            this.properties['hasHalo'] = 1;
        }
    }

    _getAnchors(point, shape, scale) {
        const { feature, symbol } = point;
        const placement = this._getPlacement(point, symbol);
        const properties = feature.properties;
        const { markerSpacingFn, textSpacingFn, textMaxAngleFn } = this._fnTypes;
        const spacing = (
            (markerSpacingFn ? markerSpacingFn(null, properties) : symbol['markerSpacing']) ||
            (textSpacingFn ? textSpacingFn(null, properties) : symbol['textSpacing']) ||
            DEFAULT_SPACING
        ) * scale;
        let textMaxAngle = textMaxAngleFn ? (textMaxAngleFn(this.options['zoom'], properties)) : symbol['textMaxAngle'];
        if (isNil(textMaxAngle)) {
            textMaxAngle = TEXT_MAX_ANGLE;
        }
        textMaxAngle *= Math.PI / 180;
        const EXTENT = this.options.EXTENT;
        const altitudeToTileScale = this.options['altitudeToTileScale'];
        const is3DPitchText = this._is3DPitchText();
        const anchors = getPointAnchors(point, this.lineVertex, textMaxAngle, shape, scale, EXTENT, placement, spacing, is3DPitchText, altitudeToTileScale);
        return anchors;
    }

    _getPlacement(point, symbol) {
        let placement;
        if (this._fnTypes.markerPlacementFn) {
            placement = this._fnTypes.markerPlacementFn(this.options['zoom'], point.feature.properties);
        } else {
            placement = symbol.markerPlacement || this._textPlacement;
        }
        // 记录pack的point placement
        if (!this._packMarkerPlacement && (symbol.markerPlacement || symbol.isIconText)) {
            this._packMarkerPlacement = placement;
        }
        if (this._textPlacement && !symbol.isIconText && !this._packTextPlacement) {
            this._packTextPlacement = placement;
        }
        return placement;
    }

    getPackSDFFormat(symbol) {
        if (this._textPlacement === 'line' && !symbol['isIconText']) {
            //position, shape0, textcoord0, shape1, textcoord1, size, color, opacity, offset, rotation
            const formats = [
                ...this.getPositionFormat(),
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
            if (this._is3DPitchText()) {
                formats.push({
                    type: Float32Array,
                    width: 3,
                    name: 'aPitchRotation'
                });
            }
            return formats;
        } else {
            return [
                ...this.getPositionFormat(),
                {
                    type: Int16Array,
                    width: 2,
                    name: 'aShape'
                },
                {
                    type: Uint16Array,
                    width: this.options.pluginType === 'text' ? 2 : 4,
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

    getPackMarkerFormat() {
        return [
            ...this.getPositionFormat(),
            {
                type: Int16Array,
                width: 2,
                name: 'aShape'
            },
            {
                type: Uint16Array,
                width: 3,
                name: 'aTexCoord'
            }
        ];
    }

}
