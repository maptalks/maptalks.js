import { isNil } from '../style/Util';
import { getMarkerPathBase64, evaluateIconSize, evaluateTextSize } from '../style/Marker';
import { getSDFFont, resolveText } from '../style/Text';
import { WritingMode, shapeText, shapeIcon } from './util/shaping';
import { allowsLetterSpacing } from './util/script_detection';
import { loadFunctionTypes } from '@maptalks/function-type';

const URL_PATTERN = /\{ *([\w_]+) *\}/g;

export default class StyledPoint {
    constructor(feature, symbol, options) {
        //anchor(世界坐标), offset(normalized offset), tex, size(世界坐标), opacity, rotation
        //u_size_scale 当前像素坐标相对世界坐标的大小, u_rotation map的旋转角度(?)
        this.feature = feature;
        this.symbol = loadFunctionTypes(symbol, () => {
            return [options.zoom];
        });
        this.options = options;
        this._thisReplacer = this._replacer.bind(this);
    }

    _replacer(str, key) {
        return this.feature.properties[key] || 'default';
    }

    getShape(iconAtlas, glyphAtlas) {
        if (this._shape) {
            return this._shape;
        }
        let shape;
        const symbol = this.symbol;
        const iconGlyph = this.getIconAndGlyph();
        if (iconGlyph && iconGlyph.glyph) {
            const { font, text } = iconGlyph.glyph;
            if (text === '') {
                return null;
            }
            const glyphSize = 24;
            const size = this.size[0],
                fontScale = size / glyphSize;
            const oneEm = 24;
            const keepUpright = symbol['textKeepUpright'],
                textAlongLine = symbol['textRotationAlignment'] === 'map' && symbol['textPlacement'] === 'line' && !symbol['isIconText'];
            const glyphs = glyphAtlas.glyphMap[font],
                textAnchor = getAnchor(symbol['textHorizontalAlignment'], symbol['textVerticalAlignment']),
                lineHeight = 1.2 * oneEm, //TODO 默认的lineHeight的计算
                isAllowLetterSpacing = allowsLetterSpacing(text),
                textLetterSpacing =  isAllowLetterSpacing ? symbol['textLetterSpacing'] / fontScale || 0 : 0,
                textOffset = [symbol['textDx'] / fontScale || 0, symbol['textDy'] / fontScale || 0],
                textWrapWidth = (symbol['textWrapWidth'] || 10 * oneEm) / fontScale;
            shape = {};
            shape.horizontal = shapeText(
                text,
                glyphs,
                textWrapWidth, //默认为10个字符
                lineHeight,
                textAnchor,
                'center',
                textLetterSpacing,
                textOffset,
                oneEm, //verticalHeight
                WritingMode.horizontal
            );
            if (isAllowLetterSpacing && textAlongLine && keepUpright) {
                shape.vertical = shapeText(text, glyphs, textWrapWidth, lineHeight,
                    textAnchor, 'center', textLetterSpacing, textOffset, oneEm, WritingMode.vertical
                );
            }
        } else if (iconGlyph && iconGlyph.icon) {
            if (!iconAtlas.positions[iconGlyph.icon]) {
                //图片没有载入成功
                return null;
            }
            const markerAnchor = getAnchor(symbol['markerHorizontalAlignment'], symbol['markerVerticalAlignment']);
            shape = shapeIcon(iconAtlas.positions[iconGlyph.icon], markerAnchor);
            if (!this.size) {
                this.size = shape.image.displaySize;
            }
        }
        this._shape = shape;
        return shape;
    }

    getIconAndGlyph() {
        if (this.iconGlyph) {
            return this.iconGlyph;
        }
        const { zoom } = this.options;
        const result = {};
        const symbol = this.symbol;
        const hasMarker = symbol.markerFile || symbol.markerPath || symbol.markerType;
        const hasText = !isNil(symbol.textName);
        let size;
        if (hasMarker) {
            size = evaluateIconSize(symbol, this.feature.properties, zoom);
        }
        if (hasText) {
            size = evaluateTextSize(symbol, this.feature.properties, zoom);
        }
        this.size = size;
        if (hasMarker) {
            let icon;
            if (symbol.markerType) {
                icon = 'vector://' + JSON.stringify(symbol);
            } else {
                icon = symbol.markerFile ? symbol.markerFile.replace(URL_PATTERN, this._thisReplacer) :
                    symbol.markerPath ? getMarkerPathBase64(symbol, size[0], size[1]) : symbol.markerType ? '' : null;
            }
            result.icon = icon;
        }

        if (hasText) {
            const font = getSDFFont(symbol);
            const text = resolveText(symbol.textName, this.feature.properties || this.feature.properties);
            result.glyph = {
                font, text
            };
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
