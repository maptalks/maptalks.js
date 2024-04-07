import { isObject } from '../../../core/util';
import Point from '../../../geo/Point';
import PointSymbolizer from './PointSymbolizer';
import StrokeAndFillSymbolizer from './StrokeAndFillSymbolizer';
import Canvas from '../../../core/Canvas';
import { Geometry } from '../../../geometry';
import Painter from '../Painter';
import { PointExtent } from '../../../geo';

const defaultSymbol = {
    lineWidth: 1,
    polygonFill: '#fff',
    polygonOpacity: 0.5,
};

export default class DrawAltitudeSymbolizer extends PointSymbolizer {
    public dxdy: any;
    static test(symbol: any, geometry: Geometry) {
        const layer = geometry.getLayer();
        if (!layer) {
            return false;
        }
        const type = geometry.getJSONType();
        // shoule be a point or linestring
        return type === 'Marker' || type === 'LineString';
    }

    constructor(symbol: any, geometry: Geometry, painter: Painter) {
        super(symbol, geometry, painter);
        this.style = geometry.getLayer().options['drawAltitude'];
        if (!this.style || !isObject(this.style)) {
            this.style = {
                lineWidth: 2,
            };
        }
        if (!this.style['lineWidth']) {
            // for get2DExtent
            this.style['lineWidth'] = 0;
        }
        this.dxdy = this._defineStyle({
            dx: symbol['textDx'] || symbol['markerDx'],
            dy: symbol['textDy'] || symbol['markerDy'],
        });
    }

    symbolize(ctx: CanvasRenderingContext2D): void {
        const layer = this.geometry.getLayer();
        if (!layer.options['drawAltitude']) {
            return;
        }
        // const properties = this.geometry.getProperties();
        // if (!properties || !properties[layer.options['altitudeProperty']]) {
        //     return;
        // }
        if (!this.geometry.hasAltitude()) {
            return;
        }
        const style = this._getStyle();
        this._prepareContext(ctx);
        if (this.geometry.type === 'LineString') {
            const paintParams = this._getPaintParams(style['lineDx'], style['lineDy']);
            if (!paintParams) {
                return;
            }
            //container points that ignore altitude
            const groundPoints = this.getPainter().getPaintParams(style['lineDx'], style['lineDy'], true, true, '_groundpt')[0];
            this._drawLineAltitude(ctx, paintParams[0], groundPoints);
        } else {
            const point = this._getRenderContainerPoints(),
                groundPoint = this._getRenderContainerPoints(true);
            if (!point || point.length === 0) {
                return;
            }
            this._drawMarkerAltitude(ctx, point[0], groundPoint[0]);
        }
    }

    getDxDy(): Point {
        const s = this.dxdy;
        return new Point(s['dx'] || 0, s['dy'] || 0);
    }

    get2DExtent(): PointExtent {
        if (this.geometry.type === 'LineString') {
            return StrokeAndFillSymbolizer.prototype.get2DExtent.apply(this);
        } else {
            return super.get2DExtent();
        }
    }

    getPlacement(): string {
        return 'point';
    }

    _getPaintParams(dx: any, dy: any): any[] {
        return this.getPainter().getPaintParams(dx || 0, dy || 0, null, true, '_altpt');
    }

    _drawMarkerAltitude(ctx: CanvasRenderingContext2D, point: Point, groundPoint: Point): void {
        const style = this._getStyle();
        this.prepareCanvas(ctx, style);
        Canvas.path(ctx, [point, groundPoint], style['lineOpacity'], null, style['lineDasharray']);
    }

    _drawLineAltitude(ctx: CanvasRenderingContext2D, points: any[], groundPoints: any[]): void {
        const style = this._getStyle();
        const isSplitted = points.length > 0 && Array.isArray(points[0]);

        if (isSplitted) {
            for (let i = 0; i < points.length; i++) {
                this._drawLine(ctx, points[i], groundPoints[i]);
            }
        } else {
            this._drawLine(ctx, points, groundPoints);
        }

        if (ctx.setLineDash && Array.isArray(style['lineDasharray'])) {
            ctx.setLineDash([]);
        }
    }

    _drawLine(ctx: CanvasRenderingContext2D, points: any[], groundPoints: any[]): void {
        const style = this._getStyle();
        this.prepareCanvas(ctx, style);
        for (let i = 0, l = points.length - 1; i < l; i++) {
            Canvas.polygon(ctx, [points[i], points[i + 1], groundPoints[i + 1], groundPoints[i],], style['lineOpacity'], style['polygonOpacity'], style['lineDasharray']);
        }
    }

    _getStyle(): any {
        // read drawAltitude from layer every time
        let style = this.geometry.getLayer().options['drawAltitude'];
        if (!isObject(style)) {
            style = defaultSymbol;
        }
        if (!style['lineWidth']) {
            // for get2DExtent
            style['lineWidth'] = 0;
            style['lineOpacity'] = 0;
        }
        return style;
    }
}
