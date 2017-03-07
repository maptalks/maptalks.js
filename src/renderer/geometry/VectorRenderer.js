import { isArrayHasData } from 'core/util';
import Canvas from 'core/Canvas';
import Ellipse from 'geometry/Ellipse';
import Circle from 'geometry/Circle';
import Sector from 'geometry/Sector';
import Rectangle from 'geometry/Rectangle';
import LineString from 'geometry/LineString';
import Polygon from 'geometry/Polygon';

const el = {
    _redrawWhenPitch : true,

    _getPaintParams() {
        const map = this.getMap();
        if (map.getPitch()) {
            // when map is tilting, draw the vertexes as a polygon
            return Polygon.prototype._getPaintParams.call(this, true);
        }
        //TODO rotating ellipse
        const pcenter = this._getPrjCoordinates();
        const pt = map._prjToPoint(pcenter, map.getMaxZoom());
        const size = this._getRenderSize();
        return [pt, size['width'], size['height']];
    },

    _paintOn: function () {
        const map = this.getMap();
        if (map.getPitch()) {
            return Canvas.polygon.apply(Canvas, arguments);
        } else {
            return Canvas.ellipse.apply(Canvas, arguments);
        }
    }
};

Ellipse.include(el);

Circle.include(el);
//----------------------------------------------------
Rectangle.include({
    _getPaintParams() {
        const map = this.getMap();
        const maxZoom = map.getMaxZoom();
        const shell = this._getPrjShell();
        const points = this._getPath2DPoints(shell, false, maxZoom);
        return [points];
    },
    _paintOn: Canvas.polygon
});
//----------------------------------------------------
Sector.include({
    _redrawWhenPitch : true,

    _getPaintParams() {
        const map = this.getMap();
        if (map.getPitch()) {
            return Polygon.prototype._getPaintParams.call(this, true);
        }
        //TODO rotating sector
        const pt = map._prjToPoint(this._getPrjCoordinates(), map.getMaxZoom());
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
            return Canvas.sector.apply(Canvas, arguments);
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

        const normal = point.substract(prePoint)._unit();
        const p1 = point.substract(normal.multi(height));
        normal._perp();
        const p0 = p1.add(normal.multi(hw));
        normal._multi(-1);
        const p2 = p1.add(normal.multi(hw));
        return [p0, point, p2, p0];
    },

    _getPaintParams() {
        const prjVertexes = this._getPrjCoordinates();
        const points = this._getPath2DPoints(prjVertexes, false, this.getMap().getMaxZoom());
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
        for (let i = segments.length - 1; i >= 0; i--) {
            if (placement === 'vertex-first' || placement === 'vertex-firstlast') {
                arrows.push(this._getArrowPoints(segments[i][1], segments[i][0], lineWidth, arrowStyle, tolerance));
            }
            if (placement === 'vertex-last' || placement === 'vertex-firstlast') {
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
        var lineWidth = this._getInternalSymbol()['lineWidth'];
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
        const maxZoom = this.getMap().getMaxZoom();
        const prjVertexes = this._getPrjShell();
        var points = this._getPath2DPoints(prjVertexes, disableSimplify, maxZoom);
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
        if (isArrayHasData(prjHoles)) {
            for (let i = 0; i < prjHoles.length; i++) {
                let hole = this._getPath2DPoints(prjHoles[i], disableSimplify, maxZoom);
                if (isSplitted) {
                    if (Array.isArray(hole)) {
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
            points.push.apply(points, holePoints);
        }
        return [points];
    },
    _paintOn: Canvas.polygon
});

