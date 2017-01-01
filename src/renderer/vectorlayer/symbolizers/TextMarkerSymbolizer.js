import {
    isNode,
    isNil,
    isNumber,
    isArrayHasData,
    replaceVariable,
    getAlignPoint,
    getValueOrDefault
} from 'core/util';
import { splitTextToRow } from 'core/util/text';
import Point from 'geo/Point';
import PointExtent from 'geo/PointExtent';
import Canvas from 'utils/Canvas';
import PointSymbolizer from './PointSymbolizer';

export default class TextMarkerSymbolizer extends PointSymbolizer {

    static test(symbol) {
        if (!symbol) {
            return false;
        }
        if (!isNil(symbol['textName'])) {
            return true;
        }
        return false;
    }

    constructor(symbol, geometry, painter) {
        super();
        this.symbol = symbol;
        this.geometry = geometry;
        this.painter = painter;
        var style = this.translate();
        this.style = this._defineStyle(style);
        this.strokeAndFill = this._defineStyle(this.translateLineAndFill(style));
        var textContent = replaceVariable(this.style['textName'], this.geometry.getProperties());
        this._descText(textContent);
    }

    symbolize(ctx, resources) {
        if (this.style['textSize'] === 0 || this.style['textOpacity'] === 0) {
            return;
        }
        var cookedPoints = this._getRenderContainerPoints();
        if (!isArrayHasData(cookedPoints)) {
            return;
        }
        var style = this.style,
            strokeAndFill = this.strokeAndFill;
        var textContent = replaceVariable(this.style['textName'], this.geometry.getProperties());
        this._descText(textContent);
        this._prepareContext(ctx);
        Canvas.prepareCanvas(ctx, strokeAndFill, resources);
        Canvas.prepareCanvasFont(ctx, style);
        var p;
        for (var i = 0, len = cookedPoints.length; i < len; i++) {
            p = cookedPoints[i];
            var origin = this._rotate(ctx, p, this._getRotationAt(i));
            if (origin) {
                p = origin;
            }
            Canvas.text(ctx, textContent, p, style, this.textDesc);
            if (origin) {
                ctx.restore();
            }
        }
    }

    getPlacement() {
        return this.symbol['textPlacement'];
    }

    getRotation() {
        var r = this.style['textRotation'];
        if (!isNumber(r)) {
            return null;
        }
        //to radian
        return r * Math.PI / 180;
    }

    getDxDy() {
        var s = this.style;
        var dx = s['textDx'],
            dy = s['textDy'];
        return new Point(dx, dy);
    }

    getMarkerExtent() {
        var dxdy = this.getDxDy(),
            style = this.style,
            size = this.textDesc['size'];
        var alignPoint = getAlignPoint(size, style['textHorizontalAlignment'], style['textVerticalAlignment']);
        var alignW = alignPoint.x,
            alignH = alignPoint.y;
        return new PointExtent(
            dxdy.add(alignW, alignH),
            dxdy.add(alignW + size['width'], alignH + size['height'])
        );
    }

    translate() {
        var s = this.symbol;
        var result = {
            'textName': s['textName'],
            'textFaceName': getValueOrDefault(s['textFaceName'], 'monospace'),
            'textWeight': getValueOrDefault(s['textWeight'], 'normal'), //'bold', 'bolder'
            'textStyle': getValueOrDefault(s['textStyle'], 'normal'), //'italic', 'oblique'
            'textSize': getValueOrDefault(s['textSize'], 10),
            'textFont': getValueOrDefault(s['textFont'], null),
            'textFill': getValueOrDefault(s['textFill'], '#000'),
            'textOpacity': getValueOrDefault(s['textOpacity'], 1),

            'textHaloFill': getValueOrDefault(s['textHaloFill'], '#ffffff'),
            'textHaloRadius': getValueOrDefault(s['textHaloRadius'], 0),
            'textHaloOpacity': getValueOrDefault(s['textHaloOpacity'], 1),

            'textWrapWidth': getValueOrDefault(s['textWrapWidth'], null),
            'textWrapBefore': getValueOrDefault(s['textWrapBefore'], false),
            'textWrapCharacter': getValueOrDefault(s['textWrapCharacter'], null),
            'textLineSpacing': getValueOrDefault(s['textLineSpacing'], 0),

            'textDx': getValueOrDefault(s['textDx'], 0),
            'textDy': getValueOrDefault(s['textDy'], 0),

            'textHorizontalAlignment': getValueOrDefault(s['textHorizontalAlignment'], 'middle'), //left | middle | right | auto
            'textVerticalAlignment': getValueOrDefault(s['textVerticalAlignment'], 'middle'), // top | middle | bottom | auto
            'textAlign': getValueOrDefault(s['textAlign'], 'center') //left | right | center | auto
        };

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

    _descText(textContent) {
        this.textDesc = this._loadFromCache(textContent, this.style);
        if (!this.textDesc) {
            this.textDesc = splitTextToRow(textContent, this.style);
            this._storeToCache(textContent, this.style, this.textDesc);
        }
    }

    _storeToCache(textContent, style, textDesc) {
        if (isNode) {
            return;
        }
        if (!this.geometry['___text_symbol_cache']) {
            this.geometry['___text_symbol_cache'] = {};
        }
        this.geometry['___text_symbol_cache'][this._genCacheKey(style)] = textDesc;
    }

    _loadFromCache(textContent, style) {
        if (!this.geometry['___text_symbol_cache']) {
            return null;
        }
        return this.geometry['___text_symbol_cache'][this._genCacheKey(textContent, style)];
    }

    _genCacheKey(textContent, style) {
        var key = [textContent];
        for (var p in style) {
            if (style.hasOwnProperty(p) && p.length > 4 && p.substring(0, 4) === 'text') {
                key.push(p + '=' + style[p]);
            }
        }
        return key.join('-');
    }
}
