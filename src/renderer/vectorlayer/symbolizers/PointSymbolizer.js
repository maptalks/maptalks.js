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
export class PointSymbolizer extends CanvasSymbolizer {
    get2DExtent(resources) {
        var extent = new PointExtent(),
            m = this.getMarkerExtent(resources);
        var renderPoints = this._getRenderPoints()[0];
        for (var i = renderPoints.length - 1; i >= 0; i--) {
            extent._combine(renderPoints[i]);
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
        var matrices = painter.getTransformMatrix(),
            matrix = matrices ? matrices['container'] : null,
            scale = matrices ? matrices['scale'] : null,
            dxdy = this.getDxDy(),
            layerPoint = map._pointToContainerPoint(this.geometry.getLayer()._getRenderer()._northWest);
        // layerPoint = this.geometry.getLayer()._getRenderer()._extent2D.getMin();
        if (matrix) {
            dxdy = new Point(dxdy.x / scale.x, dxdy.y / scale.y);
        }
        // console.log(layerPoint);
        var containerPoints = mapArrayRecursively(points, function (point) {
            // console.log(point);
            // return point.substract(layerPoint)._add(dxdy);
            return map._pointToContainerPoint(point)._add(dxdy)._substract(layerPoint);
        });
        if (matrix) {
            return matrix.applyToArray(containerPoints);
        }
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
