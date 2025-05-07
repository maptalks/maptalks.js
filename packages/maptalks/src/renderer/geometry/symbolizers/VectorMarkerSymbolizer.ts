import { isNumber, isArrayHasData, getValueOrDefault } from '../../../core/util';
import { isGradient, getGradientStamp } from '../../../core/util/style';
import { isVectorSymbol, getVectorMarkerFixedExtent, calVectorMarkerSize, getVectorMarkerAnchor, getMarkerRotationExtent } from '../../../core/util/marker';
import { drawVectorMarker, translateMarkerLineAndFill } from '../../../core/util/draw';
import { hashCode } from '../../../core/util/strings';
import { hasFunctionDefinition } from '../../../core/mapbox';
import Point from '../../../geo/Point';
import PointExtent from '../../../geo/PointExtent';
import Canvas from '../../../core/Canvas';
import PointSymbolizer from './PointSymbolizer';
import { getDefaultVAlign, getDefaultHAlign, DEFAULT_MARKER_SYMBOLS } from '../../../core/util/marker';
import { Geometry } from '../../../geometry';
import Painter from '../Painter';
import { Extent } from '../../../geo';
import { getDefaultBBOX, resetBBOX } from '../../../core/util/bbox';
import { ResourceCache } from '../../../core/ResourceCacheManager';

const MARKER_SIZE: [number, number] = [0, 0];
const TEMP_EXTENT = new PointExtent();
const DEFAULT_ANCHOR = new Point(0, 0);
const TEMP_BBOX = getDefaultBBOX();

export default class VectorMarkerSymbolizer extends PointSymbolizer {
    //@internal
    _dynamic: any;
    strokeAndFill: any;
    padding: number;
    //@internal
    _stamp: any;
    //@internal
    _fixedExtent: PointExtent;

    static test(symbol: any): boolean {
        return isVectorSymbol(symbol);
    }

    constructor(symbol: any, geometry: Geometry, painter: Painter) {
        super(symbol, geometry, painter);
        const style = this.translate();
        this._dynamic = hasFunctionDefinition(style);
        this.style = this._defineStyle(style);
        this.strokeAndFill = this._defineStyle(translateMarkerLineAndFill(this.style));
        // const lineWidth = this.strokeAndFill['lineWidth'];
        // if (lineWidth % 2 === 0) {
        //     this.padding = 2;
        // } else {
        //     this.padding = 1.5;
        // }
        this.padding = 0;
    }

    symbolize(ctx: CanvasRenderingContext2D, resources: ResourceCache) {
        if (!this.isVisible()) {
            return;
        }
        const style = this.style;
        if (!this.painter.isHitTesting() && (style['markerWidth'] === 0 || style['markerHeight'] === 0 ||
            (style['polygonOpacity'] === 0 && style['lineOpacity'] === 0))) {
            return;
        }
        const cookedPoints = this._getRenderContainerPoints();
        if (!isArrayHasData(cookedPoints)) {
            return;
        }
        this._prepareContext(ctx);
        if (
            this.getPainter().isSpriting() ||
            this.geometry.getLayer().getMask() === this.geometry ||
            this._dynamic ||
            this.geometry.getLayer().options['cacheVectorOnCanvas'] === false) {
            //动态样式或者不缓存,function-type style, or not cache vector on canvas
            this._drawMarkersWithDynamic(ctx, cookedPoints, resources);
        } else {
            this._drawMarkersWithCache(ctx, cookedPoints, resources);
        }
    }

    //rename to _drawMarkersWithDynamic
    //@internal
    _drawMarkersWithDynamic(ctx: CanvasRenderingContext2D, cookedPoints: any[], resources: ResourceCache) {
        for (let i = cookedPoints.length - 1; i >= 0; i--) {
            let point = cookedPoints[i];
            const size = calVectorMarkerSize(MARKER_SIZE, this.style);
            const [width, height] = size;
            const origin = this._rotate(ctx, point, this._getRotationAt(i));
            this.rotations = [];
            let extent: PointExtent;
            if (origin) {
                const pixel = point.sub(origin);
                point = origin;
                const rad = this._getRotationAt(i);
                extent = getMarkerRotationExtent(TEMP_EXTENT, rad, width, height, point, DEFAULT_ANCHOR);
                extent._add(pixel);
                this.rotations.push(rad);
            }

            const bbox = this._drawVectorMarker(ctx, point, resources);
            if (origin) {
                ctx.restore();
                this._setBBOX(ctx, extent.xmin, extent.ymin, extent.xmax, extent.ymax);
            } else {
                if (bbox) {
                    this._setBBOX(ctx, bbox[0], bbox[1], bbox[2], bbox[3]);
                } else {
                    const { x, y } = point;
                    this._setBBOX(ctx, x, y, x + width, y + height);
                }
            }
        }
    }

    //@internal
    _drawMarkersWithCache(ctx: CanvasRenderingContext2D, cookedPoints: any[], resources: ResourceCache) {
        const stamp = this._stampSymbol();
        let image = resources.getImage(stamp);
        if (!image) {
            image = this._createMarkerImage(ctx, resources);
            resources.addResource([stamp, image.width, image.height], image);
        }
        const anchor = getVectorMarkerAnchor(this.style, image.width, image.height);
        for (let i = cookedPoints.length - 1; i >= 0; i--) {
            let point = cookedPoints[i];
            const origin = this._rotate(ctx, point, this._getRotationAt(i));
            this.rotations = [];
            let extent: PointExtent;
            if (origin) {
                //坐标对应的像素点
                const pixel = point.sub(origin);
                point = origin;
                const rad = this._getRotationAt(i);
                extent = getMarkerRotationExtent(TEMP_EXTENT, rad, image.width, image.height, point, anchor);
                extent._add(pixel);
                this.rotations.push(rad);
            }
            const x = point.x + anchor.x, y = point.y + anchor.y;
            Canvas.image(ctx, image, x, y);
            if (origin) {
                ctx.restore();
                this._setBBOX(ctx, extent.xmin, extent.ymin, extent.xmax, extent.ymax);
            } else {
                this._setBBOX(ctx, x, y, x + image.width, y + image.height);
            }
        }
    }

    //@internal
    _createMarkerImage(ctx: CanvasRenderingContext2D, resources: ResourceCache): any {
        const canvasClass = ctx.canvas.constructor,
            size = calVectorMarkerSize(MARKER_SIZE, this.style),
            canvas = Canvas.createCanvas(size[0], size[1], canvasClass),
            point = this._getCacheImageAnchor(size[0], size[1]);
        const context = canvas.getContext('2d');
        this._drawVectorMarker(context, point, resources);
        return canvas;
    }

    //@internal
    _stampSymbol(): any {
        if (!this._stamp) {
            this._stamp = hashCode([
                this.style['markerType'],
                isGradient(this.style['markerFill']) ? getGradientStamp(this.style['markerFill']) : this.style['markerFill'],
                this.style['markerFillOpacity'],
                this.style['markerFillPatternFile'],
                isGradient(this.style['markerLineColor']) ? getGradientStamp(this.style['markerLineColor']) : this.style['markerLineColor'],
                this.style['markerLineWidth'],
                this.style['markerLineOpacity'],
                this.style['markerLineDasharray'] ? this.style['markerLineDasharray'].join(',') : '',
                this.style['markerLinePatternFile'],
                this.style['markerWidth'],
                this.style['markerHeight'],
                this.style['markerHorizontalAlignment'],
                this.style['markerVerticalAlignment'],
            ].join('_'));
        }
        return this._stamp;
    }

    //@internal
    _getCacheImageAnchor(w: number, h: number): Point {
        const shadow = 2 * (this.symbol['shadowBlur'] || 0),
            margin = shadow + this.padding;
        const markerType = this.style['markerType'];
        if (markerType === 'bar' || markerType === 'pie' || markerType === 'pin') {
            return new Point(w / 2, h - margin);
        } else if (markerType === 'rectangle') {
            return new Point(margin, margin);
        } else {
            return new Point(w / 2, h / 2);
        }
    }

    //@internal
    _getGraidentExtent(points: PointExtent | Extent): PointExtent {
        const e = new PointExtent(),
            dxdy = this.getDxDy(),
            m = this.getFixedExtent();
        if (Array.isArray(points)) {
            for (let i = points.length - 1; i >= 0; i--) {
                e._combine(points[i]);
            }
        } else {
            e._combine(points);
        }
        e['xmin'] += m['xmin'] - dxdy.x;
        e['ymin'] += m['ymin'] - dxdy.y;
        e['xmax'] += m['xmax'] - dxdy.x;
        e['ymax'] += m['ymax'] - dxdy.y;
        return e;
    }

    //@internal
    _drawVectorMarker(ctx: CanvasRenderingContext2D, point: Point, resources: ResourceCache) {
        resetBBOX(TEMP_BBOX);
        drawVectorMarker(ctx, point, this.style, resources, TEMP_BBOX);
        return TEMP_BBOX;
    }

    getFixedExtent(): PointExtent {
        // const isDynamic = this.isDynamicSize();
        // const w = this.style.markerWidth;
        // const h = this.style.markerHeight;
        // this._fixedExtent = this._fixedExtent || new PointExtent();
        // return getVectorMarkerFixedExtent(this._fixedExtent, this.style, isDynamic ? [128, 128 * (w === 0 ? 1 : h / w)] : null);

        this._fixedExtent = this._fixedExtent || new PointExtent();
        return getVectorMarkerFixedExtent(this._fixedExtent, this.style, null);

    }

    translate(): any {
        const s = this.symbol;
        const result = {
            markerType: getValueOrDefault(s['markerType'], 'ellipse'), //<----- ellipse | cross | x | triangle | diamond | square | bar | pin等,默认ellipse
            markerFill: getValueOrDefault(s['markerFill'], '#00f'), //blue as cartoCSS
            markerFillOpacity: getValueOrDefault(s['markerFillOpacity'], 1),
            markerFillPatternFile: getValueOrDefault(s['markerFillPatternFile'], null),
            markerLineColor: getValueOrDefault(s['markerLineColor'], '#000'), //black
            markerLineWidth: getValueOrDefault(s['markerLineWidth'], DEFAULT_MARKER_SYMBOLS.markerLineWidth),
            markerLineOpacity: getValueOrDefault(s['markerLineOpacity'], 1),
            markerLineDasharray: getValueOrDefault(s['markerLineDasharray'], []),
            markerLinePatternFile: getValueOrDefault(s['markerLinePatternFile'], null),

            markerDx: getValueOrDefault(s['markerDx'], 0),
            markerDy: getValueOrDefault(s['markerDy'], 0),

            markerWidth: getValueOrDefault(s['markerWidth'], DEFAULT_MARKER_SYMBOLS.markerWidth),
            markerHeight: getValueOrDefault(s['markerHeight'], DEFAULT_MARKER_SYMBOLS.markerHeight),

            markerRotation: getValueOrDefault(s['markerRotation'], 0),
            shadowBlur: getValueOrDefault(s['shadowBlur'], 0),
            shadowOffsetX: getValueOrDefault(s['shadowOffsetX'], 0),
            shadowOffsetY: getValueOrDefault(s['shadowOffsetY'], 0),
        };
        const markerType = result['markerType'];
        const ha = getDefaultHAlign(markerType);
        const va = getDefaultVAlign(markerType);

        result['markerHorizontalAlignment'] = getValueOrDefault(s['markerHorizontalAlignment'], ha); //left | middle | right
        result['markerVerticalAlignment'] = getValueOrDefault(s['markerVerticalAlignment'], va); // top | middle | bottom

        //markerOpacity覆盖fillOpacity和lineOpacity
        if (isNumber(s['markerOpacity'])) {
            if (isNumber(s['markerFillOpacity'])) {
                result['markerFillOpacity'] *= s['markerOpacity'];
            }
            if (isNumber(s['markerLineOpacity'])) {
                result['markerLineOpacity'] *= s['markerOpacity'];
            }
        }
        return result;
    }
}
