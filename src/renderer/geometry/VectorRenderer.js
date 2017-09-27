import { pushIn } from 'core/util';
import Size from 'geo/Size';
import Canvas from 'core/Canvas';
import Geometry from 'geometry/Geometry';
import Ellipse from 'geometry/Ellipse';
import Circle from 'geometry/Circle';
import Sector from 'geometry/Sector';
import Rectangle from 'geometry/Rectangle';
import LineString from 'geometry/LineString';
import Polygon from 'geometry/Polygon';

Geometry.include({
    _redrawWhenPitch : () => false,

    _redrawWhenRotate: () => false
});

const el = {
    _redrawWhenPitch : () => true,

    _redrawWhenRotate: function () {
        return (this instanceof Ellipse) || (this instanceof Sector);
    },

    _paintAsPolygon: function () {
        const map = this.getMap();
        // when map is tilting, draw the circle/ellipse as a polygon by vertexes.
        return map.getPitch() || ((this instanceof Ellipse) && map.getBearing());
    },

    _getPaintParams() {
        const map = this.getMap();
        if (this._paintAsPolygon()) {
            return Polygon.prototype._getPaintParams.call(this, true);
        }
        const pcenter = this._getPrjCoordinates();
        const pt = map._prjToPoint(pcenter, map.getMaxNativeZoom());
        const size = this._getRenderSize();
        return [pt, size['width'], size['height']];
    },

    _paintOn: function () {
        if (this._paintAsPolygon()) {
            return Canvas.polygon.apply(Canvas, arguments);
        } else {
            return Canvas.ellipse.apply(Canvas, arguments);
        }
    },

    _getRenderSize() {
        const map = this.getMap(),
            z = map.getMaxNativeZoom();
        const prjExtent = this._getPrjExtent();
        const pmin = map._prjToPoint(prjExtent.getMin(), z),
            pmax = map._prjToPoint(prjExtent.getMax(), z);
        return new Size(Math.abs(pmax.x - pmin.x) / 2, Math.abs(pmax.y - pmin.y) / 2);
    }
};

Ellipse.include(el);

Circle.include(el);
//----------------------------------------------------
Rectangle.include({
    _getPaintParams() {
        const map = this.getMap();
        const maxZoom = map.getMaxNativeZoom();
        const shell = this._getPrjShell();
        const points = this._getPath2DPoints(shell, false, maxZoom);
        return [points];
    },

    _paintOn: Canvas.polygon
});
//----------------------------------------------------
Sector.include(el, {
    _redrawWhenPitch : () => true,

    _getPaintParams() {
        const map = this.getMap();
        if (map.getPitch()) {
            return Polygon.prototype._getPaintParams.call(this, true);
        }
        const pt = map._prjToPoint(this._getPrjCoordinates(), map.getMaxNativeZoom());
        const size = this._getRenderSize();
        return [pt, size['width'],
            [this.getStartAngle(), this.getEndAngle()]
        ];
    },

    _paintOn: function () {
        const map = this.getMap();
        if (map.getPitch()) {
            return Canvas.polygon.apply(Canvas, arguments);
        } else {
            const r = this.getMap().getBearing();
            const args = arguments;
            if (r) {
                args[3] = args[3].slice(0);
                args[3][0] += r;
                args[3][1] += r;
            }
            return Canvas.sector.apply(Canvas, args);
        }
    }

});
//----------------------------------------------------

LineString.include({
    arrowStyles: {
        'classic': [3, 4]
    },

    _getArrowPoints(prePoint, point, lineWidth, arrowStyle, tolerance) {
        if (!tolerance) {
            tolerance = 0;
        }
        const width = lineWidth * arrowStyle[0],
            height = lineWidth * arrowStyle[1] + tolerance,
            hw = width / 2 + tolerance;

        const normal = point.sub(prePoint)._unit();
        const p1 = point.sub(normal.multi(height));
        normal._perp();
        const p0 = p1.add(normal.multi(hw));
        normal._multi(-1);
        const p2 = p1.add(normal.multi(hw));
        return [p0, point, p2, p0];
    },

    _getPaintParams() {
        const prjVertexes = this._getPrjCoordinates();
        const points = this._getPath2DPoints(prjVertexes, false, this.getMap().getMaxNativeZoom());
        return [points];
    },

    _paintOn(ctx, points, lineOpacity, fillOpacity, dasharray) {
        Canvas.path(ctx, points, lineOpacity, null, dasharray);
        this._paintArrow(ctx, points, lineOpacity);
    },

    _getArrowPlacement() {
        return this.options['arrowPlacement'];
    },

    _getArrowStyle() {
        const arrowStyle = this.options['arrowStyle'];
        if (arrowStyle) {
            return Array.isArray(arrowStyle) ? arrowStyle : this.arrowStyles[arrowStyle];
        }
        return null;
    },

    _getArrows(points, lineWidth, tolerance) {
        const arrowStyle = this._getArrowStyle();
        if (!arrowStyle || points.length < 2) {
            return [];
        }
        const isSplitted = points.length > 0 && Array.isArray(points[0]);
        const segments = isSplitted ? points : [points];
        const placement = this._getArrowPlacement();
        const arrows = [];
        const map = this.getMap(),
            first = map.coordinateToContainerPoint(this.getFirstCoordinate()),
            last = map.coordinateToContainerPoint(this.getLastCoordinate());
        for (let i = segments.length - 1; i >= 0; i--) {
            if (placement === 'vertex-first' || placement === 'vertex-firstlast' && segments[i][0].equals(first)) {
                arrows.push(this._getArrowPoints(segments[i][1], segments[i][0], lineWidth, arrowStyle, tolerance));
            }
            if (placement === 'vertex-last' || placement === 'vertex-firstlast' && segments[i][segments[i].length - 1].equals(last)) {
                arrows.push(this._getArrowPoints(segments[i][segments[i].length - 2], segments[i][segments[i].length - 1], lineWidth, arrowStyle, tolerance));
            } else if (placement === 'point') {
                for (let ii = 0, ll = segments[i].length - 1; ii < ll; ii++) {
                    arrows.push(this._getArrowPoints(segments[i][ii], segments[i][ii + 1], lineWidth, arrowStyle, tolerance));
                }
            }
        }
        return arrows;
    },

    _paintArrow(ctx, points, lineOpacity) {
        let lineWidth = this._getInternalSymbol()['lineWidth'];
        if (!lineWidth || lineWidth < 3) {
            lineWidth = 3;
        }
        const arrows = this._getArrows(points, lineWidth);
        if (!arrows.length) {
            return;
        }
        if (ctx.setLineDash) {
            //remove line dash effect if any
            ctx.setLineDash([]);
        }
        for (let i = arrows.length - 1; i >= 0; i--) {
            ctx.fillStyle = ctx.strokeStyle;
            Canvas.polygon(ctx, arrows[i], lineOpacity, lineOpacity);
        }
    }
});

Polygon.include({
    _getPaintParams(disableSimplify) {
        const maxZoom = this.getMap().getMaxNativeZoom();
        const prjVertexes = this._getPrjShell();
        let points = this._getPath2DPoints(prjVertexes, disableSimplify, maxZoom);
        //splitted by anti-meridian
        const isSplitted = points.length > 0 && Array.isArray(points[0]);
        if (isSplitted) {
            points = [
                [points[0]],
                [points[1]]
            ];
        }
        const prjHoles = this._getPrjHoles();
        const holePoints = [];
        if (prjHoles && prjHoles.length > 0) {
            for (let i = 0; i < prjHoles.length; i++) {
                const hole = this._getPath2DPoints(prjHoles[i], disableSimplify, maxZoom);
                if (Array.isArray(hole) && isSplitted) {
                    if (Array.isArray(hole[0])) {
                        points[0].push(hole[0]);
                        points[1].push(hole[1]);
                    } else {
                        points[0].push(hole);
                    }
                } else {
                    holePoints.push(hole);
                }

            }
        }
        if (!isSplitted) {
            points = [points];
            pushIn(points, holePoints);
        }
        return [points];
    },
    _paintOn: Canvas.polygon
});

