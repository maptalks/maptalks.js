import { mapArrayRecursively, isNil } from 'core/util';
import Point from 'geo/Point';
import PointExtent from 'geo/PointExtent';
import CanvasSymbolizer from './CanvasSymbolizer';

/**
 * @classdesc
 * Base symbolizer class for all the point type symbol styles.
 * @abstract
 * @class
 * @protected
 * @memberOf symbolizer
 * @name PointSymbolizer
 * @extends {CanvasSymbolizer}
 */
export default class PointSymbolizer extends CanvasSymbolizer {

    constructor(symbol, geometry, painter) {
        super();
        this.symbol = symbol;
        this.geometry = geometry;
        this.painter = painter;
    }

    get2DExtent(resources) {
        const map = this.getMap();
        const maxZoom = map.getMaxZoom();
        const extent = new PointExtent(),
            m = this.getMarkerExtent(resources);
        const renderPoints = this._getRenderPoints()[0];
        for (let i = renderPoints.length - 1; i >= 0; i--) {
            extent._combine(map._pointToPoint(renderPoints[i], maxZoom));
        }
        extent['xmin'] += m['xmin'];
        extent['ymin'] += m['ymin'];
        extent['xmax'] += m['xmax'];
        extent['ymax'] += m['ymax'];
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
        var painter = this.getPainter(),
            points = this._getRenderPoints()[0];
        if (painter.isSpriting()) {
            return points;
        }
        var map = this.getMap();
        var maxZoom = map.getMaxZoom();
        var dxdy = this.getDxDy(),
            layerPoint = map._pointToContainerPoint(this.geometry.getLayer()._getRenderer()._northWest);
        var containerPoints = mapArrayRecursively(points, point =>
            map._pointToContainerPoint(point, maxZoom)._add(dxdy)._substract(layerPoint)
        );
        return containerPoints;
    }

    _getRotationAt(i) {
        var r = this.getRotation(),
            rotations = this._getRenderPoints()[1];
        if (!rotations) {
            return r;
        }
        if (!r) {
            r = 0;
        }
        return rotations[i] + r;
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
