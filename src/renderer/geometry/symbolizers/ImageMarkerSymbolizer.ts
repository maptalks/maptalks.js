import { isNumber, isArrayHasData, getValueOrDefault, } from '../../../core/util';
import { getAlignPoint } from '../../../core/util/strings';
import { getImage } from '../../../core/util/draw';
import Size from '../../../geo/Size';
import PointExtent from '../../../geo/PointExtent';
import { getImageMarkerFixedExtent, getMarkerRotationExtent, isImageSymbol, } from '../../../core/util/marker';
import Canvas from '../../../core/Canvas';
import PointSymbolizer from './PointSymbolizer';
import { Geometry } from '../../../geometry';
import Painter from '../Painter';
import { ResourceCache } from '../../layer/CanvasRenderer';
const TEMP_SIZE = new Size(1, 1);
const TEMP_EXTENT = new PointExtent();

export default class ImageMarkerSymbolizer extends PointSymbolizer {
    public _url: [string, string | number, string | number];
    public _fixedExtent: PointExtent;
    static test(symbol: any): boolean {
        return isImageSymbol(symbol);
    }

    constructor(symbol: any, geometry: Geometry, painter: Painter) {
        super(symbol, geometry, painter);
        this.style = this._defineStyle(this.translate());
    }

    symbolize(ctx: CanvasRenderingContext2D, resources: ResourceCache): void {
        if (!this.isVisible()) {
            return;
        }
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
            const imgURL = style['markerFile'];
            if (!resources.isResourceLoaded(imgURL)) {
                resources.addResource(imgURL, img);
            }
            const painter = this.getPainter();
            if (!painter.isSpriting()) {
                painter.removeCache();
            }
        }
        let alpha: any;
        // for VectorPathMarkerSymbolizer, opacity is already set into SVG element.
        if (
            this.symbol['markerType'] !== 'path' &&
            isNumber(style['markerOpacity']) && style['markerOpacity'] < 1) {
            alpha = ctx.globalAlpha;
            ctx.globalAlpha *= style['markerOpacity'];
        }
        TEMP_SIZE.width = width;
        TEMP_SIZE.height = height;
        const alignPoint = getAlignPoint(TEMP_SIZE, style['markerHorizontalAlignment'], style['markerVerticalAlignment']);
        for (let i = 0, len = cookedPoints.length; i < len; i++) {
            let p = cookedPoints[i];
            // //for debug
            // ctx.fillStyle = 'red';
            // ctx.fillRect(p.x - 2, p.y - 160, 4, 4);
            // const origin = this._rotate(ctx, p, this._getRotationAt(i));
            const origin = this.getRotation() ? this._rotate(ctx, p, this._getRotationAt(i)) : null;
            let extent: PointExtent;
            if (origin) {
                //坐标对应的像素点
                const pixel = p.sub(origin);
                p = origin;
                const rad = this._getRotationAt(i);
                extent = getMarkerRotationExtent(TEMP_EXTENT, rad, width, height, p, alignPoint);
                extent._add(pixel);
            }
            const x = p.x + alignPoint.x,
                y = p.y + alignPoint.y;
            Canvas.image(ctx, img, x, y, width, height);
            if (origin) {
                ctx.restore();
            }
            if (origin) {
                this._setBBOX(ctx, extent.xmin, extent.ymin, extent.xmax, extent.ymax);
            } else {
                this._setBBOX(ctx, x, y, x + width, y + height);
            }
        }
        if (alpha !== undefined) {
            ctx.globalAlpha = alpha;
        }
    }

    _getImage(resources: ResourceCache): any {
        return getImage(resources, this.style['markerFile']);
    }

    getFixedExtent(resources: ResourceCache): PointExtent {
        this._fixedExtent = this._fixedExtent || new PointExtent();
        return getImageMarkerFixedExtent(this._fixedExtent, this.style, resources);
    }

    translate(): any {
        const s = this.symbol;
        return {
            markerFile: s['markerFile'],
            markerOpacity: getValueOrDefault(s['markerOpacity'], 1),
            markerWidth: getValueOrDefault(s['markerWidth'], null),
            markerHeight: getValueOrDefault(s['markerHeight'], null),
            markerRotation: getValueOrDefault(s['markerRotation'], 0),

            markerDx: getValueOrDefault(s['markerDx'], 0),
            markerDy: getValueOrDefault(s['markerDy'], 0),

            markerHorizontalAlignment: getValueOrDefault(s['markerHorizontalAlignment'], 'middle'), //left | middle | right
            markerVerticalAlignment: getValueOrDefault(s['markerVerticalAlignment'], 'top'), // top | middle | bottom
        };
    }
}
