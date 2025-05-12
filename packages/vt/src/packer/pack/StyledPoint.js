import { isNil } from '../style/Util';
import { getMarkerPathBase64, evaluateIconSize, evaluateTextSize } from '../style/Marker';
import { getSDFFont, resolveText } from '../style/Text';
import { WritingMode, shapeText, shapeIcon } from './util/shaping';
import { allowsLetterSpacing } from './util/script_detection';
import { convertRTLText } from './util/convert_rtl_text';
import { isFunctionDefinition, interpolated } from '@maptalks/function-type';

const URL_PATTERN = /\{ *([\w_]+) *\}/g;

export default class StyledPoint {
    constructor(feature, symbolDef, loadedSymbol, fnTypes, options) {
        //anchor(世界坐标), offset(normalized offset), tex, size(世界坐标), opacity, rotation
        //u_size_scale 当前像素坐标相对世界坐标的大小, u_rotation map的旋转角度(?)
        this.feature = feature;
        this.symbolDef = symbolDef;
        this.symbol = loadedSymbol;
        this.options = options;
        this._thisReplacer = this._replacer.bind(this);
        this._fnTypes = fnTypes;
    }


    _replacer(str, key) {
        return this.feature.properties[key] || '';
    }

    getShape(iconAtlas, glyphAtlas) {
        if (this._shape) {
            return this._shape;
        }
        const { textHorizontalAlignmentFn, textVerticalAlignmentFn, markerHorizontalAlignmentFn, markerVerticalAlignmentFn, textWrapWidthFn } = this._fnTypes;
        const shape = {};
        const symbol = this.symbol;
        const iconGlyph = this.getIconAndGlyph();
        const properties = this.feature.properties;
        if (iconGlyph && iconGlyph.glyph) {
            const { font, text } = iconGlyph.glyph;
            if (text === '') {
                return null;
            }
            const glyphSize = 24;
            const size = this.textSize[0],
                fontScale = size / glyphSize;
            const oneEm = 24;
            const keepUpright = symbol['textKeepUpright'],
                textAlongLine = symbol['textRotationAlignment'] === 'map' && symbol['textPlacement'] === 'line' && !symbol['isIconText'];
            const glyphs = glyphAtlas.glyphMap[font],
                hAlignment = textHorizontalAlignmentFn ? textHorizontalAlignmentFn(null, properties) : symbol['textHorizontalAlignment'],
                vAlignment = textVerticalAlignmentFn ? textVerticalAlignmentFn(null, properties) : symbol['textVerticalAlignment'],
                textAnchor = getAnchor(hAlignment, vAlignment),
                lineHeight = 1.2 * oneEm, //TODO 默认的lineHeight的计算
                isAllowLetterSpacing = allowsLetterSpacing(text),
                textLetterSpacing =  isAllowLetterSpacing ? symbol['textLetterSpacing'] / fontScale || 0 : 0,
                textOffset = [symbol['textDx'] / fontScale || 0, symbol['textDy'] / fontScale || 0],
                wrapWidth = textWrapWidthFn ? textWrapWidthFn(null, properties) : symbol['textWrapWidth'],
                textWrapWidth = (wrapWidth || 10 * oneEm) / fontScale;
            const textShape = {};
            textShape.horizontal = shapeText(
                text,
                glyphs,
                textWrapWidth, //默认为10个字符
                lineHeight,
                textAnchor,
                'center',
                textLetterSpacing,
                textOffset,
                oneEm, //verticalHeight
                WritingMode.horizontal,
                this.options.isVector3D
            );
            if (isAllowLetterSpacing && textAlongLine && keepUpright) {
                textShape.vertical = shapeText(text, glyphs, textWrapWidth, lineHeight,
                    textAnchor, 'center', textLetterSpacing, textOffset, oneEm, WritingMode.vertical
                );
            }
            shape.textShape = textShape;
        }
    if (iconGlyph && iconGlyph.icon) {
            if (!iconAtlas || !iconAtlas.positions[iconGlyph.icon.url]) {
                //图片没有载入成功
                return null;
            }
            const hAlignment = markerHorizontalAlignmentFn ? markerHorizontalAlignmentFn(null, properties) : symbol['markerHorizontalAlignment'];
            const vAlignment = markerVerticalAlignmentFn ? markerVerticalAlignmentFn(null, properties) : symbol['markerVerticalAlignment'];
            const markerAnchor = getAnchor(hAlignment, vAlignment);
            const iconShape = shapeIcon(iconAtlas.positions[iconGlyph.icon.url], markerAnchor, this.options.isVector3D);
            if (!this.iconSize) {
                this.iconSize = iconShape.image.displaySize;
            }
            shape.iconShape = iconShape;
        }
        this._shape = shape;
        return shape;
    }

    getIconAndGlyph() {
        if (this.iconGlyph) {
            return this.iconGlyph;
        }
        const { markerFileFn, markerTypeFn, markerPathFn, markerWidthFn, markerHeightFn, markerFillFn, markerFillPatternFileFn, markerFillOpacityFn, markerTextFitFn, markerTextFitPaddingFn,
            markerLineColorFn, markerLineWidthFn, markerLineOpacityFn, markerLineDasharrayFn, markerLinePatternFileFn, markerPathWidthFn, markerPathHeightFn, textNameFn,
            textFaceNameFn } = this._fnTypes;
        const { zoom } = this.options;
        const result = {};
        const symbol = this.symbol;
        const symbolDef = this.symbolDef;
        const properties = this.feature.properties;
        const markerFile = markerFileFn ? markerFileFn(null, properties) : symbol.markerFile;
        const markerType = markerTypeFn ? markerTypeFn(null, properties) : symbol.markerType;
        const hasMarker = markerFile || markerType || symbol.markerPath;
        const hasText = !isNil(this.symbolDef.textName);
        let iconSize;
        let textSize;
        if (hasMarker) {
            iconSize = evaluateIconSize(symbol, this.symbolDef, properties, zoom, markerWidthFn, markerHeightFn) || [0, 0];
            let textFit = symbol.markerTextFit;
            if (markerTextFitFn) {
                textFit = markerTextFitFn(zoom, properties);
            }
            if (textFit && symbolDef.textName && textFit !== 'none') {
                const textSize = symbolDef.textSize;
                let textName = symbolDef.textName;
                if (isFunctionDefinition(textName)) {
                    textName = interpolated(textName)(zoom, properties);
                }
                const text = resolveText(textName, properties);
                if (!text) {
                    // blank text
                    iconSize[0] = iconSize[1] = -1;
                } else {
                    const textSizeFnName = '__fn_textSize'.trim();
                    const textSizeFn0Name = '__fn_textSize_0'.trim();
                    if (isFunctionDefinition(textSize) && !symbolDef[textSizeFnName]) {
                        symbolDef[textSizeFn0Name] = interpolated(textSize);
                        symbolDef[textSizeFnName] = (zoom, properties) => {
                            const v = symbolDef[textSizeFn0Name](zoom, properties);
                            if (isFunctionDefinition(v)) {
                                return interpolated(v)(zoom, properties);
                            } else {
                                return v;
                            }
                        };
                    }
                    const tsize = evaluateTextSize(symbolDef, symbolDef, properties, zoom);
                    if (textFit === 'width' || textFit === 'both') {
                        iconSize[0] = tsize[0] * text.length;
                    }
                    // TODO 这里不支持多行文字
                    if (textFit === 'height' || textFit === 'both') {
                        iconSize[1] = tsize[1];
                    }
                    if (tsize[0] && tsize[1]) {
                        let padding = symbol.markerTextFitPadding || [0, 0, 0, 0];
                        if (markerTextFitPaddingFn) {
                            padding = markerTextFitPaddingFn(zoom, properties);
                        }
                        iconSize[0] += padding[1] + padding[3];
                        iconSize[1] += padding[0] + padding[2];
                    }
                }
            }
        }
        if (hasText) {
            textSize = evaluateTextSize(symbol, this.symbolDef, properties, zoom);
        }
        if (!textSize && !iconSize) {
            return result;
        }
        if (iconSize) {
            iconSize[0] = Math.ceil(iconSize[0]);
            iconSize[1] = Math.ceil(iconSize[1]);
        }
        if (textSize) {
            textSize[0] = Math.ceil(textSize[0]);
            textSize[1] = Math.ceil(textSize[1]);
        }

        this.iconSize = iconSize;
        this.textSize = textSize;
        // size为0时，仍然能请求图片，例如只有markerFile的symbol，size < 0时的图片应该忽略，例如文字为空的markerTextFit图标
        if (hasMarker && iconSize[0] >= 0 && iconSize[1] >= 0) {
            let icon;
            if (markerType) {
                const url = {};
                url['markerType'] = markerType;
                if (markerType === 'path') {
                    url['markerPath'] = markerPathFn ? markerPathFn(null, properties) : symbol.markerPath;
                    url['markerPathWidth'] = markerPathWidthFn ? markerPathWidthFn(null, properties) : symbol.markerPathWidth;
                    url['markerPathHeight'] = markerPathHeightFn ? markerPathHeightFn(null, properties) : symbol.markerPathHeight;
                }
                if (markerWidthFn) {
                    const width =  markerWidthFn(null, properties);
                    if (!isNil(width)) {
                        url['markerWidth'] = width;
                    }
                } else if (symbol.markerWidth >= 0) {
                    url['markerWidth'] = symbol.markerWidth;
                }
                if (markerHeightFn) {
                    const height = markerHeightFn(null, properties);
                    if (!isNil(height)) {
                        url['markerHeight'] = height;
                    }
                } else if (symbol.markerHeight >= 0) {
                    url['markerHeight'] = symbol.markerHeight;
                }
                if (markerFillFn) {
                    const fill = markerFillFn(null, properties);
                    if (!isNil(fill)) {
                        url['markerFill'] = fill;
                    }
                } else if (symbol.markerFill) {
                    url['markerFill'] = symbol.markerFill;
                }
                if (markerFillPatternFileFn) {
                    const fillPattern = markerFillPatternFileFn(null, properties);
                    if (!isNil(fillPattern)) {
                        url['markerFillPatternFile'] = fillPattern;
                    }
                } else if (symbol.markerFillPatternFile) {
                    url['markerFillPatternFile'] = symbol.markerFillPatternFile;
                }
                if (markerFillOpacityFn) {
                    const fillOpacity = markerFillOpacityFn(null, properties);
                    if (!isNil(fillOpacity)) {
                        url['markerFillOpacity'] = fillOpacity;
                    }
                } else if (symbol.markerFillOpacity >= 0) {
                    url['markerFillOpacity'] = symbol.markerFillOpacity;
                }
                if (markerLineColorFn) {
                    const lineColor = markerLineColorFn(null, properties);
                    if (!isNil(lineColor)) {
                        url['markerLineColor'] = lineColor;
                    }
                } else if (symbol.markerLineColor) {
                    url['markerLineColor'] = symbol.markerLineColor;
                }
                if (markerLineWidthFn) {
                    const lineWidth = markerLineWidthFn(null, properties);
                    if (!isNil(lineWidth)) {
                        url['markerLineWidth'] = lineWidth;
                    }
                } else if (symbol.markerLineWidth >= 0) {
                    url['markerLineWidth'] = symbol.markerLineWidth;
                }
                if (markerLineOpacityFn) {
                    const lineOpacity = markerLineOpacityFn(null, properties);
                    if (!isNil(lineOpacity)) {
                        url['markerLineOpacity'] = lineOpacity;
                    }
                } else if (symbol.markerLineOpacity >= 0) {
                    url['markerLineOpacity'] = symbol.markerLineOpacity;
                }
                if (markerLineDasharrayFn) {
                    const dasharray = markerLineDasharrayFn(null, properties);
                    if (!isNil(dasharray)) {
                        url['markerLineDasharray'] = dasharray;
                    }
                } else if (symbol.markerLineDasharray) {
                    url['markerLineDasharray'] = symbol.markerLineDasharray;
                }
                if (markerLinePatternFileFn) {
                    const linePattern = markerLinePatternFileFn(null, properties);
                    if (!isNil(linePattern)) {
                        url['markerLinePatternFile'] = linePattern;
                    }
                } else if (symbol.markerLinePatternFile) {
                    url['markerLinePatternFile'] = symbol.markerLinePatternFile;
                }
                icon = 'vector://' + JSON.stringify(url);
            } else {
                icon = markerFile ? markerFile.replace(URL_PATTERN, this._thisReplacer) :
                    symbol.markerPath ? getMarkerPathBase64(symbol, iconSize[0], iconSize[1]) : null;
            }
            result.icon = {
                url: icon,
                iconSize,
                textSize
            };
        }

        if (hasText) {
            const textName = textNameFn ? textNameFn(this.options.zoom, properties) : symbol['textName'];
            if (textName || textName === 0) {
                const textFaceName = textFaceNameFn ? textFaceNameFn(null, properties) : symbol['textFaceName'];
                // const textStyle = textStyleFn ? textStyleFn(null, properties) : symbol['textStyle'];
                // const textWeight = textWeightFn ? textWeightFn(null, properties) : symbol['textWeight'];
                const font = getSDFFont(textFaceName);
                let text = resolveText(textName, properties);
                //(改为在前端计算)在TextPainter中能通过feature.properties['$label']直接取得标签内容
                // this.feature.properties['$label'] = text;
                // 识别文字中的RTL，并重新排序
                if (text && text.length) {
                    text = convertRTLText(text);
                    result.glyph = {
                        font, text
                    };
                }
            }
        }
        this.iconGlyph = result;
        return result;


        // markerOpacity
        // markerWidth
        // markerHeight
        // markerDx
        // markerDy
        // markerHorizontalAlignment
        // markerVerticalAlignment
        // markerPlacement
        // markerRotation
        // markerFile
        // markerType
        // markerFill
        // markerFillPatternFile
        // markerFillOpacity
        // markerLineColor
        // markerLineWidth
        // markerLineOpacity
        // markerLineDasharray
        // markerLinePatternFile
        // markerPath
        // markerPathWidth
        // markerPathHeight
    }
}

function getAnchor(h, v) {
    if (!v || v === 'middle') {
        v = 'center';
    }
    if (!h || h === 'middle') {
        h = 'center';
    }
    let vv = v !== 'center' ? v : '';
    vv += h !== 'center' ? (vv.length ? '-' : '') + h : '';
    return vv;
}
