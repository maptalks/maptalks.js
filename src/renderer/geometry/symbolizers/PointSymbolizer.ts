import { computeDegree } from '../../../core/util';
import PointExtent from '../../../geo/PointExtent';
import Point from '../../../geo/Point';
import CanvasSymbolizer from './CanvasSymbolizer';
import { isFunctionDefinition } from '../../../core/mapbox';
import { getMarkerRotation } from '../../../core/util/marker';
import Painter from '../Painter';
import { Geometry } from '../../../geometry';

const TEMP_POINT0 = new Point(0, 0);
const TEMP_POINT1 = new Point(0, 0);
const TEMP_POINT2 = new Point(0, 0);
const TEMP_POINT3 = new Point(0, 0);
/**
 * 所有点类型符号样式的symbolizer基类
 *
 * @english
 * @classdesc
 * Base symbolizer class for all the point type symbol styles.
 * @abstract
 * @class
 * @private
 * @memberOf symbolizer
 * @name PointSymbolizer
 * @extends {symbolizer.CanvasSymbolizer}
 */
abstract class PointSymbolizer extends CanvasSymbolizer {
    public style: any;
    public symbol: any;
    public geometry: Geometry;
    public painter: Painter;
    constructor(symbol: any, geometry: Geometry, painter: Painter) {
        super();
        this.symbol = symbol;
        this.geometry = geometry;
        this.painter = painter;
    }

    get2DExtent(): PointExtent {
        const map = this.getMap();
        const glRes = map.getGLRes();
        const extent = new PointExtent();
        const renderPoints = this._getRenderPoints()[0];
        for (let i = renderPoints.length - 1; i >= 0; i--) {
            if (renderPoints[i]) {
                extent._combine(map._pointAtResToPoint(renderPoints[i], glRes));
            }
        }
        return extent;
    }

    isDynamicSize(): boolean {
        const symbol = this.symbol;
        return isFunctionDefinition(symbol['markerWidth']) || isFunctionDefinition(symbol['markerHeight']) ||
            isFunctionDefinition(symbol['textSize']);

    }

    _rotateExtent(fixedExtent: PointExtent, angle: number): PointExtent {
        return fixedExtent.convertTo((p: Point) => p._rotate(angle));
    }

    _getRenderPoints(): Point[][] {
        const painter = this.getPainter();
        const placement = painter.isSpriting() ? 'center' : this.getPlacement();
        return this.getPainter().getRenderPoints(placement);
    }

    /**
     * 获取容器内的点用于绘制
     *
     * @english
     * Get container points to draw on Canvas
     */
    _getRenderContainerPoints(ignoreAltitude?: boolean): Point[] {
        const painter = this.getPainter();
        if (painter.isSpriting()) {
            return this._getRenderPoints()[0];
        }
        const geometry = this.geometry as any;
        const dxdy = this.getDxDy();
        let cpoints: any[];
        if (geometry._cPoint && !ignoreAltitude) {
            //DANGEROUS
            //调用 _getRenderContainerPoints 获取坐标之后，都直接绘制了，所以这里可以用TEMP_POINT来减少对象创建
            //但如果 _getRenderContainerPoints 获取坐标后还有其他操作，会导致bug。
            const p = ignoreAltitude ? TEMP_POINT2 : TEMP_POINT3;
            p.set(geometry._cPoint.x, geometry._cPoint.y);
            // const p = geometry._cPoint;
            const containerOffset = painter.containerOffset;
            p._sub(containerOffset);
            const dx = dxdy.x, dy = dxdy.y;
            if (dx || dy) {
                p._add(dx || 0, dy || 0);
            }
            cpoints = [p];
        } else {
            const points = this._getRenderPoints()[0];
            cpoints = this.painter._pointContainerPoints(points, dxdy.x, dxdy.y, ignoreAltitude, true, this.getPlacement());
        }
        if (!cpoints || !Array.isArray(cpoints[0])) {
            return cpoints;
        }
        const flat = [];
        for (let i = 0, l = cpoints.length; i < l; i++) {
            for (let ii = 0, ll = cpoints[i].length; ii < ll; ii++) {
                flat.push(cpoints[i][ii]);
            }
        }
        return flat;
    }

    getPlacement(): any {
        return this.symbol['markerPlacement'];
    }

    getRotation(): number {
        return getMarkerRotation(this.style);
    }

    getDxDy(): Point {
        const s = this.style;
        const dx = s['markerDx'],
            dy = s['markerDy'];
        return new Point(dx, dy);
    }

    _getRotationAt(i: number): number {
        let r = this.getRotation();
        if (!r) {
            r = 0;
        }
        const rotations = this._getRenderPoints()[1];
        if (!rotations || !rotations[i]) {
            return r;
        }

        const map = this.getMap();
        let p0 = rotations[i][0],
            p1 = rotations[i][1];
        if (map.isTransforming()) {
            const glRes = map.getGLRes();
            p0 = map._pointAtResToContainerPoint(rotations[i][0], glRes, 0, TEMP_POINT0);
            p1 = map._pointAtResToContainerPoint(rotations[i][1], glRes, 0, TEMP_POINT1);
            return r + computeDegree(p0.x, p0.y, p1.x, p1.y);
        } else {
            //point的y轴方向与containerPoint是相反的，所以角度取负值
            return r + -computeDegree(p0.x, p0.y, p1.x, p1.y);
        }
    }

    _rotate(ctx: CanvasRenderingContext2D, origin: Point, rotation: number): Point | null {
        if (rotation) {
            const dxdy = this.getDxDy();
            const p = origin.sub(dxdy);
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(rotation);
            return dxdy;
        }
        return null;
    }
}

export default PointSymbolizer;
