import { DEFAULT_TEXT_SIZE } from '../../../core/Constants';
import {
    isNumber,
    isArrayHasData,
    getValueOrDefault
} from '../../../core/util';
import Point from '../../../geo/Point';
import PointExtent from '../../../geo/PointExtent';
import { hasFunctionDefinition } from '../../../core/mapbox';
import { isTextSymbol, getTextMarkerFixedExtent } from '../../../core/util/marker';
import Canvas from '../../../core/Canvas';
import PointSymbolizer from './PointSymbolizer';
import { replaceVariable, describeText } from '../../../core/util/strings';

export default class TextMarkerSymbolizer extends PointSymbolizer {

    static test(symbol) {
        return isTextSymbol(symbol);
    }

    constructor(symbol, geometry, painter) {
        super(symbol, geometry, painter);
        const style = this.translate();
        this._dynamic = hasFunctionDefinition(style);
        this.style = this._defineStyle(style);
        if (this.style['textWrapWidth'] === 0) {
            return;
        }
        this.strokeAndFill = this._defineStyle(this.translateLineAndFill(this.style));
    }

    symbolize(ctx, resources) {
        if (!this.painter.isHitTesting() && (this.style['textSize'] === 0 ||
            !this.style['textOpacity'] && (!this.style['textHaloRadius'] || !this.style['textHaloOpacity']) ||
            this.style['textWrapWidth'] === 0)) {
            return;
        }
        const cookedPoints = this._getRenderContainerPoints();
        if (!isArrayHasData(cookedPoints)) {
            return;
        }
        const style = this.style,
            strokeAndFill = this.strokeAndFill;
        const textContent = replaceVariable(this.style['textName'], this.geometry.getProperties());
        if (this._dynamic) {
            delete this._textDesc;
        }
        const textDesc = this._textDesc = this._textDesc || describeText(textContent, this.style);
        this._prepareContext(ctx);
        this.prepareCanvas(ctx, strokeAndFill, resources);
        Canvas.prepareCanvasFont(ctx, style);
        for (let i = 0, len = cookedPoints.length; i < len; i++) {
            let p = cookedPoints[i];
            // const origin = this._rotate(ctx, p, this._getRotationAt(i));
            const origin = this.getRotation() ? this._rotate(ctx, p, this._getRotationAt(i)) : null;
            if (origin) {
                p = origin;
            }
            const bbox = Canvas.text(ctx, textContent, p, style, textDesc);
            this._setBBOX(ctx, bbox);
            if (origin) {
                ctx.restore();
            }
        }
    }

    getPlacement() {
        return this.symbol['textPlacement'];
    }

    getRotation() {
        const r = this.style['textRotation'];
        if (!isNumber(r)) {
            return null;
        }
        //to radian
        return -r * Math.PI / 180;
    }

    getDxDy() {
        const s = this.style;
        return new Point(s['textDx'], s['textDy']);
    }

    getFixedExtent() {
        let textDesc = this.geometry.getTextDesc();
        if (Array.isArray(textDesc)) {
            textDesc = textDesc[this._index];
        }
        this._fixedExtent = this._fixedExtent || new PointExtent();
        if (!textDesc) {
            return this._fixedExtent;
        }
        return getTextMarkerFixedExtent(this._fixedExtent, this.style, textDesc);
    }

    translate() {
        const s = this.symbol;
        const result = {
            'textName': s['textName'],
            'textFaceName': getValueOrDefault(s['textFaceName'], 'monospace'),
            'textWeight': getValueOrDefault(s['textWeight'], 'normal'), //'bold', 'bolder'
            'textStyle': getValueOrDefault(s['textStyle'], 'normal'), //'italic', 'oblique'
            'textSize': getValueOrDefault(s['textSize'], DEFAULT_TEXT_SIZE),
            'textFont': getValueOrDefault(s['textFont'], null),
            'textFill': getValueOrDefault(s['textFill'], '#000'),
            'textOpacity': getValueOrDefault(s['textOpacity'], 1),

            'textHaloFill': getValueOrDefault(s['textHaloFill'], '#ffffff'),
            'textHaloRadius': getValueOrDefault(s['textHaloRadius'], 0),
            'textHaloOpacity': getValueOrDefault(s['textHaloOpacity'], 1),

            'textWrapWidth': getValueOrDefault(s['textWrapWidth'], null),
            'textWrapCharacter': getValueOrDefault(s['textWrapCharacter'], '\n'),
            'textLineSpacing': getValueOrDefault(s['textLineSpacing'], 0),

            'textDx': getValueOrDefault(s['textDx'], 0),
            'textDy': getValueOrDefault(s['textDy'], 0),

            'textHorizontalAlignment': getValueOrDefault(s['textHorizontalAlignment'], 'middle'), //left | middle | right | auto
            'textVerticalAlignment': getValueOrDefault(s['textVerticalAlignment'], 'middle'), // top | middle | bottom | auto
            'textAlign': getValueOrDefault(s['textAlign'], 'center'), //left | right | center | auto

            'textRotation': getValueOrDefault(s['textRotation'], 0),

            'textMaxWidth': getValueOrDefault(s['textMaxWidth'], 0),
            'textMaxHeight': getValueOrDefault(s['textMaxHeight'], 0)
        };

        if (result['textMaxWidth'] > 0 && (!result['textWrapWidth'] || result['textWrapWidth'] > result['textMaxWidth'])) {
            if (!result['textWrapWidth']) {
                result['textMaxHeight'] = 1;
            }
            result['textWrapWidth'] = result['textMaxWidth'];
        }
        return result;
    }

    translateLineAndFill(s) {
        return {
            'lineColor': s['textHaloRadius'] ? s['textHaloFill'] : s['textFill'],
            'lineWidth': s['textHaloRadius'],
            'lineOpacity': s['textOpacity'],
            'lineDasharray': null,
            'lineCap': 'butt',
            'lineJoin': 'round',
            'polygonFill': s['textFill'],
            'polygonOpacity': s['textOpacity']
        };
    }
}
