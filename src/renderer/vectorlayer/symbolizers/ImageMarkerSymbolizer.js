import { isNil, isNumber, isArrayHasData, getValueOrDefault } from 'core/util';
import Browser from 'core/Browser';
import Point from 'geo/Point';
import PointExtent from 'geo/PointExtent';
import Canvas from 'utils/Canvas';
import PointSymbolizer from './PointSymbolizer';
// import { VectorPathMarkerSymbolizer } from './VectorPathMarkerSymbolizer';

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
        super();
        this.symbol = symbol;
        this.geometry = geometry;
        this.painter = painter;
        this.style = this._defineStyle(this.translate());
    }

    symbolize(ctx, resources) {
        var style = this.style;
        if (style['markerWidth'] === 0 || style['markerHeight'] === 0 || style['markerOpacity'] === 0) {
            return;
        }
        var cookedPoints = this._getRenderContainerPoints();
        if (!isArrayHasData(cookedPoints)) {
            return;
        }

        var img = this._getImage(resources);
        if (!img) {
            if (!Browser.phantomjs && console) {
                console.warn('no img found for ' + (this.style['markerFile'] || this._url[0]));
            }
            return;
        }
        this._prepareContext(ctx);
        var width = style['markerWidth'];
        var height = style['markerHeight'];
        if (!isNumber(width) || !isNumber(height)) {
            width = img.width;
            height = img.height;
            style['markerWidth'] = width;
            style['markerHeight'] = height;
            var imgURL = [style['markerFile'], style['markerWidth'], style['markerHeight']];
            if (!resources.isResourceLoaded(imgURL)) {
                resources.addResource(imgURL, img);
            }
            var painter = this.getPainter();
            if (!painter.isSpriting()) {
                painter.removeCache();
            }
        }
        var alpha;
        // if (!(this instanceof of VectorPathMarkerSymbolizer) &&
        if (!(this.constructor.name === 'VectorPathMarkerSymbolizer') &&
            isNumber(style['markerOpacity']) && style['markerOpacity'] < 1) {
            alpha = ctx.globalAlpha;
            ctx.globalAlpha *= style['markerOpacity'];
        }
        var p;
        for (var i = 0, len = cookedPoints.length; i < len; i++) {
            p = cookedPoints[i];
            var origin = this._rotate(ctx, p, this._getRotationAt(i));
            if (origin) {
                p = origin;
            }
            //图片定位到中心底部
            Canvas.image(ctx, img,
                p.x - width / 2,
                p.y - height,
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
        var img = !resources ? null : resources.getImage([this.style['markerFile'], this.style['markerWidth'], this.style['markerHeight']]);
        return img;
    }

    getPlacement() {
        return this.symbol['markerPlacement'];
    }

    getRotation() {
        var r = this.style['markerRotation'];
        if (!isNumber(r)) {
            return null;
        }
        //to radian
        return r * Math.PI / 180;
    }

    getDxDy() {
        var s = this.style;
        var dx = s['markerDx'] || 0,
            dy = s['markerDy'] || 0;
        return new Point(dx, dy);
    }

    getMarkerExtent(resources) {
        var url = this.style['markerFile'],
            img = resources ? resources.getImage(url) : null;
        var width = this.style['markerWidth'] || (img ? img.width : 0),
            height = this.style['markerHeight'] || (img ? img.height : 0);
        var dxdy = this.getDxDy();
        return new PointExtent(dxdy.add(-width / 2, 0), dxdy.add(width / 2, -height));
    }

    translate() {
        var s = this.symbol;
        return {
            'markerFile': s['markerFile'],
            'markerOpacity': getValueOrDefault(s['markerOpacity'], 1),
            'markerWidth': getValueOrDefault(s['markerWidth'], null),
            'markerHeight': getValueOrDefault(s['markerHeight'], null),
            'markerDx': getValueOrDefault(s['markerDx'], 0),
            'markerDy': getValueOrDefault(s['markerDy'], 0)
        };
    }
}
