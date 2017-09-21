import { computeDegree, mapArrayRecursively, isNil } from 'core/util';
import Point from 'geo/Point';
import PointExtent from 'geo/PointExtent';
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
        const maxZoom = map.getMaxNativeZoom();
        const extent = new PointExtent();
        const renderPoints = this._getRenderPoints()[0];
        for (let i = renderPoints.length - 1; i >= 0; i--) {
            extent._combine(map._pointToPoint(renderPoints[i], maxZoom));
        }
        return extent;
    }

    _getRenderPoints() {
        return this.getPainter().getRenderPoints(this.getPlacement());
    }

    /**
     * Get container points to draw on Canvas
     * @return {Point[]}
     */
    _getRenderContainerPoints() {
        const painter = this.getPainter(),
            points = this._getRenderPoints()[0];
        if (painter.isSpriting()) {
            return points;
        }
        const map = this.getMap();
        const maxZoom = map.getMaxNativeZoom();
        const dxdy = this.getDxDy(),
            height = this.painter.getHeight(),
            layerPoint = map._pointToContainerPoint(this.geometry.getLayer()._getRenderer()._northWest);
        const containerPoints = mapArrayRecursively(points, point =>
            map._pointToContainerPoint(point, maxZoom, height)._add(dxdy)._sub(layerPoint)
        );
        return containerPoints;
    }

    _getRotationAt(i) {
        let r = this.getRotation();
        const rotations = this._getRenderPoints()[1];
        if (!rotations) {
            return r;
        }
        if (!r) {
            r = 0;
        }
        const map = this.getMap();
        let p0 = rotations[i][0], p1 = rotations[i][1];
        if (map.isTransforming()) {
            const maxZoom = map.getMaxNativeZoom();
            p0 = map._pointToContainerPoint(rotations[i][0], maxZoom);
            p1 = map._pointToContainerPoint(rotations[i][1], maxZoom);
        }
        return r + computeDegree(p0, p1);
    }

    _rotate(ctx, origin, rotation) {
        if (!isNil(rotation)) {
            ctx.save();
            ctx.translate(origin.x, origin.y);
            ctx.rotate(rotation);
            return new Point(0, 0);
        }
        return null;
    }
}

export default PointSymbolizer;
