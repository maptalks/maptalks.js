import {
    IS_NODE,
    isNil,
    isNumber,
    isArrayHasData,
    getValueOrDefault
} from '../../../core/util';
import Point from '../../../geo/Point';
import { hasFunctionDefinition } from '../../../core/mapbox';
import { splitTextToRow, getAlignPoint, replaceVariable } from '../../../core/util/strings';
import PointExtent from '../../../geo/PointExtent';
import Canvas from '../../../core/Canvas';
import PointSymbolizer from './PointSymbolizer';

export const CACHE_KEY = '___text_symbol_cache';

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
        super(symbol, geometry, painter);
        this._dynamic = hasFunctionDefinition(symbol);
        this.style = this._defineStyle(this.translate());
        if (this.style['textWrapWidth'] === 0) {
            return;
        }
        this.strokeAndFill = this._defineStyle(this.translateLineAndFill(this.style));
        const textContent = replaceVariable(this.style['textName'], this.geometry.getProperties());
        if (!this._dynamic) {
            // the key to cache text descriptor
            this._cacheKey = genCacheKey(textContent, this.style);
        }
        this._descText(textContent);
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
        this._descText(textContent);
        this._prepareContext(ctx);
        this.prepareCanvas(ctx, strokeAndFill, resources);
        Canvas.prepareCanvasFont(ctx, style);
        for (let i = 0, len = cookedPoints.length; i < len; i++) {
            let p = cookedPoints[i];
            const origin = this._rotate(ctx, p, this._getRotationAt(i));
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
        const dxdy = this.getDxDy(),
            style = this.style;
        let size = this.textDesc['size'];
        const alignPoint = getAlignPoint(size, style['textHorizontalAlignment'], style['textVerticalAlignment']);
        const alignW = alignPoint.x,
            alignH = alignPoint.y;
        if (style['textHaloRadius']) {
            const r = style['textHaloRadius'];
            size = size.add(r * 2, r * 2);
        }
        let result = new PointExtent(
            dxdy.add(alignW, alignH),
            dxdy.add(alignW + size['width'], alignH + size['height'])
        );
        const rotation = this.getRotation();
        if (rotation) {
            result = this._rotateExtent(result, rotation);
        }
        return result;
    }

    translate() {
        const s = this.symbol;
        const result = {
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
            'textWrapCharacter': getValueOrDefault(s['textWrapCharacter'], '\n'),
            'textLineSpacing': getValueOrDefault(s['textLineSpacing'], 0),

            'textDx': getValueOrDefault(s['textDx'], 0),
            'textDy': getValueOrDefault(s['textDy'], 0),

            'textHorizontalAlignment': getValueOrDefault(s['textHorizontalAlignment'], 'middle'), //left | middle | right | auto
            'textVerticalAlignment': getValueOrDefault(s['textVerticalAlignment'], 'middle'), // top | middle | bottom | auto
            'textAlign': getValueOrDefault(s['textAlign'], 'center'), //left | right | center | auto

            'textRotation' : getValueOrDefault(s['textRotation'], 0),

            'textMaxWidth' : getValueOrDefault(s['textMaxWidth'], 0),
            'textMaxHeight' : getValueOrDefault(s['textMaxHeight'], 0)
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

    _descText(textContent) {
        if (this._dynamic) {
            this.textDesc = this._measureText(textContent);
            return;
        }
        this.textDesc = this._loadFromCache();
        if (!this.textDesc) {
            this.textDesc = this._measureText(textContent);
            this._storeToCache(this.textDesc);
        }
    }

    _measureText(textContent) {
        const maxHeight = this.style['textMaxHeight'];
        const textDesc = splitTextToRow(textContent, this.style);
        if (maxHeight && maxHeight < textDesc.size.height) {
            textDesc.size.height = maxHeight;
        }
        return textDesc;
    }

    _storeToCache(textDesc) {
        if (IS_NODE) {
            return;
        }
        if (!this.geometry[CACHE_KEY]) {
            this.geometry[CACHE_KEY] = {};
        }
        this.geometry[CACHE_KEY][this._cacheKey] = { 'desc' : textDesc, 'active' : true };
    }

    _loadFromCache() {
        if (!this.geometry[CACHE_KEY]) {
            return null;
        }
        const cache = this.geometry[CACHE_KEY][this._cacheKey];
        if (!cache) {
            return null;
        }
        cache.active = true;
        return cache.desc;
    }
}

TextMarkerSymbolizer.CACHE_KEY = CACHE_KEY;

function genCacheKey(textContent, style) {
    const key = [textContent];
    for (const p in style) {
        if (style.hasOwnProperty(p) && p.length > 4 && p.substring(0, 4) === 'text') {
            key.push(p + '=' + style[p]);
        }
    }
    return key.join('-');
}
