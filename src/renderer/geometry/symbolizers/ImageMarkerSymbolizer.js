import { isNil, isNumber, isArrayHasData, getValueOrDefault } from '../../../core/util';
import { getAlignPoint } from '../../../core/util/strings';
import Size from '../../../geo/Size';
import Point from '../../../geo/Point';
import PointExtent from '../../../geo/PointExtent';
import Canvas from '../../../core/Canvas';
import PointSymbolizer from './PointSymbolizer';

export default class ImageMarkerSymbolizer extends PointSymbolizer {

    static test(symbol) {
        if (!symbol) {
            return false;
        }
        if (!isNil(symbol['markerFile'])) {
            return true;
        }
        return false;
    }

    constructor(symbol, geometry, painter) {
        super(symbol, geometry, painter);
        this.style = this._defineStyle(this.translate());
    }

    symbolize(ctx, resources) {
        const style = this.style;
        if (!this.painter.isHitTesting() && (style['markerWidth'] === 0 || style['markerHeight'] === 0 || style['markerOpacity'] === 0)) {
            return;
        }
        const cookedPoints = this._getRenderContainerPoints();
        if (!isArrayHasData(cookedPoints)) {
            return;
        }

        const img = this._getImage(resources);
        if (!img) {
            if (typeof console !== 'undefined') {
                console.warn('no img found for ' + (this.style['markerFile'] || this._url[0]));
            }
            return;
        }
        this._prepareContext(ctx);
        let width = style['markerWidth'];
        let height = style['markerHeight'];
        if (!isNumber(width) || !isNumber(height)) {
            width = img.width;
            height = img.height;
            style['markerWidth'] = width;
            style['markerHeight'] = height;
            const imgURL = [style['markerFile'], style['markerWidth'], style['markerHeight']];
            if (!resources.isResourceLoaded(imgURL)) {
                resources.addResource(imgURL, img);
            }
            const painter = this.getPainter();
            if (!painter.isSpriting()) {
                painter.removeCache();
            }
        }
        let alpha;
        // for VectorPathMarkerSymbolizer, opacity is already set into SVG element.
        if (this.symbol['markerType'] !== 'path' &&
            isNumber(style['markerOpacity']) && style['markerOpacity'] < 1) {
            alpha = ctx.globalAlpha;
            ctx.globalAlpha *= style['markerOpacity'];
        }
        const alignPoint = getAlignPoint(new Size(width, height), style['markerHorizontalAlignment'], style['markerVerticalAlignment']);
        for (let i = 0, len = cookedPoints.length; i < len; i++) {
            let p = cookedPoints[i];
            const origin = this._rotate(ctx, p, this._getRotationAt(i));
            if (origin) {
                p = origin;
            }
            Canvas.image(ctx, img,
                p.x + alignPoint.x,
                p.y + alignPoint.y,
                width, height);
            if (origin) {
                ctx.restore();
            }
        }
        if (alpha !== undefined) {
            ctx.globalAlpha = alpha;
        }
    }

    _getImage(resources) {
        const img = !resources ? null : resources.getImage([this.style['markerFile'], this.style['markerWidth'], this.style['markerHeight']]);
        return img;
    }

    getPlacement() {
        return this.symbol['markerPlacement'];
    }

    getRotation() {
        const r = this.style['markerRotation'];
        if (!isNumber(r)) {
            return null;
        }
        //to radian
        return -r * Math.PI / 180;
    }

    getDxDy() {
        const s = this.style;
        const dx = s['markerDx'],
            dy = s['markerDy'];
        return new Point(dx, dy);
    }

    getFixedExtent(resources) {
        const style = this.style;
        const url = style['markerFile'],
            img = resources ? resources.getImage(url) : null;
        const width = style['markerWidth'] || (img ? img.width : 0),
            height = style['markerHeight'] || (img ? img.height : 0);
        const dxdy = this.getDxDy();
        const alignPoint = getAlignPoint(new Size(width, height), style['markerHorizontalAlignment'], style['markerVerticalAlignment']);
        let result = new PointExtent(dxdy.add(0, 0), dxdy.add(width, height));
        result._add(alignPoint);
        const rotation = this.getRotation();
        if (rotation) {
            result = this._rotateExtent(result, rotation);
        }
        return result;
    }

    translate() {
        const s = this.symbol;
        return {
            'markerFile': s['markerFile'],
            'markerOpacity': getValueOrDefault(s['markerOpacity'], 1),
            'markerWidth': getValueOrDefault(s['markerWidth'], null),
            'markerHeight': getValueOrDefault(s['markerHeight'], null),
            'markerRotation' : getValueOrDefault(s['markerRotation'], 0),

            'markerDx': getValueOrDefault(s['markerDx'], 0),
            'markerDy': getValueOrDefault(s['markerDy'], 0),

            'markerHorizontalAlignment': getValueOrDefault(s['markerHorizontalAlignment'], 'middle'), //left | middle | right
            'markerVerticalAlignment': getValueOrDefault(s['markerVerticalAlignment'], 'top'), // top | middle | bottom
        };
    }
}
