import { getValueOrDefault } from '../../../core/util';
import { isGradient as checkGradient } from '../../../core/util/style';
import Coordinate from '../../../geo/Coordinate';
import PointExtent from '../../../geo/PointExtent';
import CanvasSymbolizer from './CanvasSymbolizer';

export default class StrokeAndFillSymbolizer extends CanvasSymbolizer {

    static test(symbol, geometry) {
        if (!symbol) {
            return false;
        }
        if (geometry && (geometry.type === 'Point')) {
            return false;
        }
        for (const p in symbol) {
            const f = p.slice(0, 4);
            if (f === 'line' || f === 'poly') {
                return true;
            }
        }
        return false;
    }

    constructor(symbol, geometry, painter) {
        super();
        this.symbol = symbol;
        this.geometry = geometry;
        this.painter = painter;
        if (geometry.type === 'Point') {
            return;
        }
        this.style = this._defineStyle(this.translate());
    }

    symbolize(ctx, resources) {
        const style = this.style;
        if (style['polygonOpacity'] === 0 && style['lineOpacity'] === 0 && !this.painter.isHitTesting()) {
            return;
        }
        const paintParams = this._getPaintParams();
        if (!paintParams) {
            return;
        }
        this._prepareContext(ctx);
        const isGradient = checkGradient(style['lineColor']),
            isPath = (this.geometry.getJSONType() === 'Polygon') || (this.geometry.type === 'LineString');
        if (isGradient && (style['lineColor']['places'] || !isPath)) {
            style['lineGradientExtent'] = this.getPainter().getContainerExtent()._expand(style['lineWidth']);
        }
        if (checkGradient(style['polygonFill'])) {
            style['polygonGradientExtent'] = this.getPainter().getContainerExtent();
        }

        const points = paintParams[0],
            isSplitted = (this.geometry.getJSONType() === 'Polygon' && points.length > 0 && Array.isArray(points[0][0])) ||
            (this.geometry.type === 'LineString' && points.length > 0 && Array.isArray(points[0]));

        if (isSplitted) {
            for (let i = 0; i < points.length; i++) {
                this.prepareCanvas(ctx, style, resources);
                if (isGradient && isPath && !style['lineColor']['places']) {
                    this._createGradient(ctx, points[i], style['lineColor']);
                }
                const params = [ctx, points[i]];
                if (paintParams.length > 1) {
                    params.push.apply(params, paintParams.slice(1));
                }
                params.push(style['lineOpacity'], style['polygonOpacity'], style['lineDasharray']);
                this.geometry._paintOn.apply(this.geometry, params);
            }
        } else {
            this.prepareCanvas(ctx, style, resources);
            if (isGradient && isPath && !style['lineColor']['places']) {
                this._createGradient(ctx, points, style['lineColor']);
            }
            const params = [ctx];
            params.push.apply(params, paintParams);
            params.push(style['lineOpacity'], style['polygonOpacity'], style['lineDasharray']);
            this.geometry._paintOn.apply(this.geometry, params);
        }

        if (ctx.setLineDash && Array.isArray(style['lineDasharray'])) {
            ctx.setLineDash([]);
        }
    }

    get2DExtent() {
        const map = this.getMap();
        const extent = this.geometry._getPrjExtent();
        if (!extent) {
            return null;
        }
        // this ugly implementation is to improve perf as we can
        // it tries to avoid creating instances to save cpu consumption.
        if (!this._extMin || !this._extMax) {
            this._extMin = new Coordinate(0, 0);
            this._extMax = new Coordinate(0, 0);
        }
        this._extMin.x = extent['xmin'];
        this._extMin.y = extent['ymin'];
        this._extMax.x = extent['xmax'];
        this._extMax.y = extent['ymax'];
        const min = map._prjToPoint(this._extMin),
            max = map._prjToPoint(this._extMax);
        if (!this._pxExtent) {
            this._pxExtent = new PointExtent(min, max);
        } else {
            this._pxExtent['xmin'] = Math.min(min.x, max.x);
            this._pxExtent['xmax'] = Math.max(min.x, max.x);
            this._pxExtent['ymin'] = Math.min(min.y, max.y);
            this._pxExtent['ymax'] = Math.max(min.y, max.y);
        }
        return this._pxExtent;
    }

    getFixedExtent() {
        const t = this.style['lineWidth'] / 2;
        return new PointExtent(-t, -t, t, t);
    }

    _getPaintParams() {
        return this.getPainter().getPaintParams(this.style['lineDx'], this.style['lineDy']);
    }

    translate() {
        const s = this.symbol;
        const result = {
            'lineColor': getValueOrDefault(s['lineColor'], '#000'),
            'lineWidth': getValueOrDefault(s['lineWidth'], 2),
            'lineOpacity': getValueOrDefault(s['lineOpacity'], 1),
            'lineDasharray': getValueOrDefault(s['lineDasharray'], []),
            'lineCap': getValueOrDefault(s['lineCap'], 'butt'), //“butt”, “square”, “round”
            'lineJoin': getValueOrDefault(s['lineJoin'], 'miter'), //“bevel”, “round”, “miter”
            'linePatternFile': getValueOrDefault(s['linePatternFile'], null),
            'lineDx' : getValueOrDefault(s['lineDx'], 0),
            'lineDy' : getValueOrDefault(s['lineDy'], 0),
            'polygonFill': getValueOrDefault(s['polygonFill'], null),
            'polygonOpacity': getValueOrDefault(s['polygonOpacity'], 1),
            'polygonPatternFile': getValueOrDefault(s['polygonPatternFile'], null),
            'polygonPatternDx' : getValueOrDefault(s['polygonPatternDx'], 0),
            'polygonPatternDy' : getValueOrDefault(s['polygonPatternDy'], 0),
            'linePatternDx' : getValueOrDefault(s['linePatternDx'], 0),
            'linePatternDy' : getValueOrDefault(s['linePatternDy'], 0)
        };
        if (result['lineWidth'] === 0) {
            result['lineOpacity'] = 0;
        }
        // fill of arrow
        if ((this.geometry.type === 'LineString') && !result['polygonFill']) {
            result['polygonFill'] = result['lineColor'];
        }
        return result;
    }

    _createGradient(ctx, points, lineColor) {
        if (!Array.isArray(points) || !points.length) {
            return;
        }
        const len = points.length;
        const grad = ctx.createLinearGradient(points[0].x, points[0].y, points[len - 1].x, points[len - 1].y);
        lineColor['colorStops'].forEach(function (stop) {
            grad.addColorStop.apply(grad, stop);
        });
        ctx.strokeStyle = grad;
    }

}
