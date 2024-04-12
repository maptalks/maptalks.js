import { ResourceCache } from '../..';
import { getValueOrDefault } from '../../../core/util';
import { isGradient as checkGradient } from '../../../core/util/style';
import Coordinate from '../../../geo/Coordinate';
import PointExtent from '../../../geo/PointExtent';
import { Geometry } from '../../../geometry';
import Painter from '../Painter';
import CanvasSymbolizer from './CanvasSymbolizer';

const TEMP_COORD0 = new Coordinate(0, 0);
const TEMP_COORD1 = new Coordinate(0, 0);

export default class StrokeAndFillSymbolizer extends CanvasSymbolizer {
    public _extMin: Coordinate;
    public _extMax: Coordinate;
    public _pxExtent: PointExtent;
    static test(symbol: any, geometry: Geometry): boolean {
        if (!symbol) {
            return false;
        }

        if (geometry && geometry.isPoint) {
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

    constructor(symbol: any, geometry: Geometry, painter: Painter) {
        super();
        this.symbol = symbol;
        this.geometry = geometry;
        this.painter = painter;

        if (geometry.isPoint) {
            return;
        }
        this.style = this._defineStyle(this.translate());
    }

    symbolize(ctx: CanvasRenderingContext2D, resources: ResourceCache) {
        if (!this.isVisible()) {
            return;
        }
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
            isPath = this.geometry.getJSONType() === 'Polygon' || this.geometry.type === 'LineString';
        if (isGradient && (style['lineColor']['places'] || !isPath)) {
            style['lineGradientExtent'] = this.geometry.getContainerExtent()._expand(style['lineWidth']);
        }
        if (checkGradient(style['polygonFill'])) {
            style['polygonGradientExtent'] = this.geometry.getContainerExtent();
        }
        // const lineWidth = style['lineWidth'] || 1;
        const geometryEventTolerance = this.geometry.getLayer().options['geometryEventTolerance'] || 0;
        const tolerance = this.geometry._hitTestTolerance() + geometryEventTolerance;

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
                    params.push(...paintParams.slice(1));
                }
                params.push(style['lineOpacity'], style['polygonOpacity'], style['lineDasharray']);
                // @ts-expect-error todo 属性“_paintOn”在类型“Geometry”上不存在
                const bbox = this.geometry._paintOn(...params);
                this._setBBOX(ctx, bbox);
                this._bufferBBOX(ctx, tolerance);
            }
        } else {
            this.prepareCanvas(ctx, style, resources);
            if (isGradient && isPath && !style['lineColor']['places']) {
                this._createGradient(ctx, points, style['lineColor']);
            }
            const params = [ctx];
            params.push(...paintParams);
            params.push(style['lineOpacity'], style['polygonOpacity'], style['lineDasharray']);
            // @ts-expect-error todo 属性“_paintOn”在类型“Geometry”上不存在
            const bbox = this.geometry._paintOn(...params);
            this._setBBOX(ctx, bbox);
            this._bufferBBOX(ctx, tolerance);
        }

        if (ctx.setLineDash && Array.isArray(style['lineDasharray'])) {
            ctx.setLineDash([]);
        }
    }

    get2DExtent(): PointExtent {
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
        // @ts-expect-error todo fix coordinate not to point
        const min = map._prjToPoint(this._extMin, undefined, TEMP_COORD0),
            // @ts-expect-error todo fix coordinate not to point
            max = map._prjToPoint(this._extMax, undefined, TEMP_COORD1);
        if (!this._pxExtent) {
            this._pxExtent = new PointExtent(min, max);
        } else {
            this._pxExtent.set(
                Math.min(min.x, max.x),
                Math.min(min.y, max.y),
                Math.max(min.x, max.x),
                Math.max(min.y, max.y)
            );
        }
        return this._pxExtent;
    }

    getFixedExtent(): PointExtent {
        const t = this.style['lineWidth'] / 2;
        return new PointExtent(-t, -t, t, t);
    }

    _getPaintParams(): any[] {
        // @ts-expect-error todo fix must has four params
        return this.getPainter().getPaintParams(this.style['lineDx'], this.style['lineDy']);
    }

    translate(): any {
        const s = this.symbol;
        const result = {
            lineColor: getValueOrDefault(s['lineColor'], '#000'),
            lineWidth: getValueOrDefault(s['lineWidth'], 2),
            lineOpacity: getValueOrDefault(s['lineOpacity'], 1),
            lineDasharray: getValueOrDefault(s['lineDasharray'], []),
            lineCap: getValueOrDefault(s['lineCap'], 'butt'), //“butt”, “square”, “round”
            lineJoin: getValueOrDefault(s['lineJoin'], 'miter'), //“bevel”, “round”, “miter”
            linePatternFile: getValueOrDefault(s['linePatternFile'], null),
            lineDx: getValueOrDefault(s['lineDx'], 0),
            lineDy: getValueOrDefault(s['lineDy'], 0),
            polygonFill: getValueOrDefault(s['polygonFill'], null),
            polygonOpacity: getValueOrDefault(s['polygonOpacity'], 1),
            polygonPatternFile: getValueOrDefault(s['polygonPatternFile'], null),
            polygonPatternDx: getValueOrDefault(s['polygonPatternDx'], 0),
            polygonPatternDy: getValueOrDefault(s['polygonPatternDy'], 0),
            linePatternDx: getValueOrDefault(s['linePatternDx'], 0),
            linePatternDy: getValueOrDefault(s['linePatternDy'], 0),
        };
        if (result['lineWidth'] === 0) {
            result['lineOpacity'] = 0;
        }
        // fill of arrow
        if (this.geometry.type === 'LineString' && !result['polygonFill']) {
            result['polygonFill'] = result['lineColor'];
        }
        return result;
    }

    _createGradient(ctx: CanvasRenderingContext2D, points: any[], lineColor: any): void {
        if (!Array.isArray(points) || !points.length) {
            return;
        }
        const [p1, p2] = getGradientPoints(points);
        if (!p1 || !p2) {
            console.error('unable create canvas LinearGradient,error data:', points);
            return;
        }
        const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
        lineColor['colorStops'].forEach(function (stop: [number, string]) {
            grad.addColorStop(...stop);
        });
        ctx.strokeStyle = grad;
    }
}

function getGradientPoints(points: any[]): any[] {
    let pts: string | any[];
    let isLine = true;
    //polygon rings
    if (Array.isArray(points[0])) {
        pts = points[0];
        isLine = false;
    } else {
        pts = points;
    }
    const len = pts.length;
    if (isLine) {
        return [pts[0], pts[len - 1]];
    }
    const p1 = pts[0];
    let distance = 0,
        p2: any;
    for (let i = 1; i < len; i++) {
        const p = pts[i];
        const dis = p1.distanceTo(p);
        if (dis > distance) {
            distance = dis;
            p2 = p;
        }
    }
    return [p1, p2];
}
