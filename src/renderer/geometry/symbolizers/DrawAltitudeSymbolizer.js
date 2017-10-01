import PointSymbolizer from './PointSymbolizer';
import StrokeAndFillSymbolizer from './StrokeAndFillSymbolizer';
import Canvas from 'core/Canvas';

export default class DrawAltitudeSymbolizer extends PointSymbolizer {
    static test(symbol, geometry) {
        const layer = geometry.getLayer();
        if (!layer) {
            return false;
        }
        const type = geometry.getJSONType();
        const properties = geometry.getProperties();
        // shoule be a point or linestring with valid altitude property
        return (type === 'Marker' || type === 'LineString' || type === 'Polygon') &&
            layer.options['drawAltitude'] && properties && properties[layer.options['altitudeProperty']];
    }

    constructor(symbol, geometry, painter) {
        super(symbol, geometry, painter);
        this.style = geometry.getLayer().options['drawAltitude'];
        this.style['lineDx'] = symbol['lineDx'] || 0;
        this.style['lineDy'] = symbol['lineDy'] || 0;
        if (!this.style['lineWidth']) {
            // for get2DExtent
            this.style['lineWidth'] = 0;
        }
    }

    symbolize(ctx) {
        this._prepareContext(ctx);
        if (this.geometry.type === 'LineString') {
            const paintParams = this._getPaintParams();
            if (!paintParams) {
                return;
            }
            //container points that ignore altitude
            const groundPoints = this.getPainter().getPaintParams(this.style['lineDx'], this.style['lineDy'], true)[0];
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

    get2DExtent() {
        if (this.geometry.type === 'LineString') {
            return StrokeAndFillSymbolizer.prototype.get2DExtent.apply(this);
        } else {
            return super.get2DExtent();
        }
    }

    getPlacement() {
        return 'point';
    }

    _getPaintParams() {
        return this.getPainter().getPaintParams(this.style['lineDx'], this.style['lineDy']);
    }

    _drawMarkerAltitude(ctx, point, groundPoint) {
        const style = this.style;
        Canvas.prepareCanvas(ctx, style);
        Canvas.path(ctx, [point, groundPoint], style['lineOpacity'], null, style['lineDasharray']);
    }

    _drawLineAltitude(ctx, points, groundPoints) {
        const style = this.style;
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

    _drawLine(ctx, points, groundPoints) {
        const style = this.style;
        Canvas.prepareCanvas(ctx, style);
        let op = style['lineOpacity'];
        if (style['lineWidth'] === 0) {
            op = 0;
        }
        for (let i = 0, l = points.length - 1; i < l; i++) {
            Canvas.polygon(ctx, [points[i], points[i + 1], groundPoints[i + 1], groundPoints[i]], op, style['polygonOpacity'], style['lineDasharray']);
        }
    }
}
