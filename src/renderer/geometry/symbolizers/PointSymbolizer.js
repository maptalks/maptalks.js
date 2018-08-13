import { computeDegree } from '../../../core/util';
import PointExtent from '../../../geo/PointExtent';
import CanvasSymbolizer from './CanvasSymbolizer';

/**
 * @classdesc
 * Base symbolizer class for all the point type symbol styles.
 * @abstract
 * @class
 * @private
 * @memberOf symbolizer
 * @name PointSymbolizer
 * @extends {symbolizer.CanvasSymbolizer}
 */
class PointSymbolizer extends CanvasSymbolizer {

    constructor(symbol, geometry, painter) {
        super();
        this.symbol = symbol;
        this.geometry = geometry;
        this.painter = painter;
    }

    get2DExtent() {
        const map = this.getMap();
        const glZoom = map.getGLZoom();
        const extent = new PointExtent();
        const renderPoints = this._getRenderPoints()[0];
        for (let i = renderPoints.length - 1; i >= 0; i--) {
            if (renderPoints[i]) {
                extent._combine(map._pointToPoint(renderPoints[i], glZoom));
            }
        }
        return extent;
    }

    _rotateExtent(fixedExtent, angle) {
        return fixedExtent.convertTo(p => p._rotate(angle));
    }

    _getRenderPoints() {
        return this.getPainter().getRenderPoints(this.getPlacement());
    }

    /**
     * Get container points to draw on Canvas
     * @return {Point[]}
     */
    _getRenderContainerPoints(ignoreAltitude) {
        const painter = this.getPainter(),
            points = this._getRenderPoints()[0];
        if (painter.isSpriting()) {
            return points;
        }
        const dxdy = this.getDxDy();
        const cpoints = this.painter._pointContainerPoints(points, dxdy.x, dxdy.y, ignoreAltitude, true, this.getPlacement());
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

    _getRotationAt(i) {
        let r = this.getRotation();
        if (!r) {
            r = 0;
        }
        const rotations = this._getRenderPoints()[1];
        if (!rotations || !rotations[i]) {
            return r;
        }

        const map = this.getMap();
        let p0 = rotations[i][0], p1 = rotations[i][1];
        if (map.isTransforming()) {
            const maxZoom = map.getGLZoom();
            p0 = map._pointToContainerPoint(rotations[i][0], maxZoom);
            p1 = map._pointToContainerPoint(rotations[i][1], maxZoom);
        }
        return r + computeDegree(p0.x, p0.y, p1.x, p1.y);
    }

    _rotate(ctx, origin, rotation) {
        if (rotation) {
            const dxdy = this.getDxDy();
            const p = origin.sub(dxdy);
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(rotation);
            return this.getDxDy();
        }
        return null;
    }
}

export default PointSymbolizer;
