import { DEFAULT_TEXT_SIZE } from '../../../core/Constants';
import { isNumber, isArrayHasData, getValueOrDefault, getAlignPoint, } from '../../../core/util';
import Point from '../../../geo/Point';
import PointExtent from '../../../geo/PointExtent';
import { hasFunctionDefinition } from '../../../core/mapbox';
import { isTextSymbol, getTextMarkerFixedExtent, getMarkerRotationExtent, } from '../../../core/util/marker';
import Canvas from '../../../core/Canvas';
import PointSymbolizer from './PointSymbolizer';
import { replaceVariable, describeText } from '../../../core/util/strings';
import { Geometry } from '../../../geometry';
import Painter from '../Painter';
import { ResourceCache } from '../..';

const TEMP_EXTENT = new PointExtent();

export default class TextMarkerSymbolizer extends PointSymbolizer {
    public _dynamic: any;
    public strokeAndFill: any;
    public _textDesc: any;
    public _fixedExtent: PointExtent;
    public _index: number;

    static test(symbol: any): boolean {
        return isTextSymbol(symbol);
    }

    constructor(symbol: any, geometry: Geometry, painter: Painter) {
        super(symbol, geometry, painter);
        const style = this.translate();
        this._dynamic = hasFunctionDefinition(style);
        this.style = this._defineStyle(style);
        if (this.style['textWrapWidth'] === 0) {
            return;
        }
        this.strokeAndFill = this._defineStyle(this.translateLineAndFill(this.style));
    }

    symbolize(ctx: CanvasRenderingContext2D, resources: ResourceCache): void {
        if (!this.isVisible()) {
            return;
        }
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
        const textHaloRadius = style.textHaloRadius || 0;
        for (let i = 0, len = cookedPoints.length; i < len; i++) {
            let p = cookedPoints[i];
            // const origin = this._rotate(ctx, p, this._getRotationAt(i));
            const origin = this.getRotation() ? this._rotate(ctx, p, this._getRotationAt(i)) : null;
            let extent: PointExtent;
            if (origin) {
                //坐标对应的像素点
                const pixel = p.sub(origin);
                p = origin;
                const rad = this._getRotationAt(i);
                const { width, height } = textDesc.size || { width: 0, height: 0 };
                const alignPoint = getAlignPoint(textDesc.size, style['textHorizontalAlignment'], style['textVerticalAlignment']);
                extent = getMarkerRotationExtent(TEMP_EXTENT, rad, width, height, p, alignPoint);
                extent._add(pixel);
            }
            const bbox = Canvas.text(ctx, textContent, p, style, textDesc);
            if (origin) {
                this._setBBOX(ctx, extent.xmin, extent.ymin, extent.xmax, extent.ymax);
                ctx.restore();
            } else {
                this._setBBOX(ctx, bbox);
            }
            this._bufferBBOX(ctx, textHaloRadius);
        }
    }

    getPlacement(): any {
        return this.symbol['textPlacement'];
    }

    getRotation(): number {
        const r = this.style['textRotation'];
        if (!isNumber(r)) {
            return null;
        }
        //to radian
        return (-r * Math.PI) / 180;
    }

    getDxDy(): Point {
        const s = this.style;
        return new Point(s['textDx'], s['textDy']);
    }

    getFixedExtent(): PointExtent {
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

    translate(): any {
        const s = this.symbol;
        const result = {
            textName: s['textName'],
            textFaceName: getValueOrDefault(s['textFaceName'], 'monospace'),
            textWeight: getValueOrDefault(s['textWeight'], 'normal'), //'bold', 'bolder'
            textStyle: getValueOrDefault(s['textStyle'], 'normal'), //'italic', 'oblique'
            textSize: getValueOrDefault(s['textSize'], DEFAULT_TEXT_SIZE),
            textFont: getValueOrDefault(s['textFont'], null),
            textFill: getValueOrDefault(s['textFill'], '#000'),
            textOpacity: getValueOrDefault(s['textOpacity'], 1),

            textHaloFill: getValueOrDefault(s['textHaloFill'], '#ffffff'),
            textHaloRadius: getValueOrDefault(s['textHaloRadius'], 0),
            textHaloOpacity: getValueOrDefault(s['textHaloOpacity'], 1),

            textWrapWidth: getValueOrDefault(s['textWrapWidth'], null),
            textWrapCharacter: getValueOrDefault(s['textWrapCharacter'], '\n'),
            textLineSpacing: getValueOrDefault(s['textLineSpacing'], 0),

            textDx: getValueOrDefault(s['textDx'], 0),
            textDy: getValueOrDefault(s['textDy'], 0),

            textHorizontalAlignment: getValueOrDefault(s['textHorizontalAlignment'], 'middle'), //left | middle | right | auto
            textVerticalAlignment: getValueOrDefault(s['textVerticalAlignment'], 'middle'), // top | middle | bottom | auto
            textAlign: getValueOrDefault(s['textAlign'], 'center'), //left | right | center | auto

            textRotation: getValueOrDefault(s['textRotation'], 0),

            textMaxWidth: getValueOrDefault(s['textMaxWidth'], 0),
            textMaxHeight: getValueOrDefault(s['textMaxHeight'], 0),
        };

        if (result['textMaxWidth'] > 0 && (!result['textWrapWidth'] || result['textWrapWidth'] > result['textMaxWidth'])) {
            if (!result['textWrapWidth']) {
                result['textMaxHeight'] = 1;
            }
            result['textWrapWidth'] = result['textMaxWidth'];
        }
        return result;
    }

    translateLineAndFill(s: any): any {
        return {
            lineColor: s['textHaloRadius'] ? s['textHaloFill'] : s['textFill'],
            lineWidth: s['textHaloRadius'],
            lineOpacity: s['textOpacity'],
            lineDasharray: null,
            lineCap: 'butt',
            lineJoin: 'round',
            polygonFill: s['textFill'],
            polygonOpacity: s['textOpacity'],
        };
    }
}
