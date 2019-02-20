import { pushIn, isNumber } from '../../core/util';
import Size from '../../geo/Size';
import Point from '../../geo/Point';
import Canvas from '../../core/Canvas';
import Geometry from '../../geometry/Geometry';
import Ellipse from '../../geometry/Ellipse';
import Circle from '../../geometry/Circle';
import Sector from '../../geometry/Sector';
import Rectangle from '../../geometry/Rectangle';
import Path from '../../geometry/Path';
import LineString from '../../geometry/LineString';
import Polygon from '../../geometry/Polygon';

Geometry.include({
    _redrawWhenPitch: () => false,

    _redrawWhenRotate: () => false
});

const el = {
    _redrawWhenPitch: () => true,

    _redrawWhenRotate: function () {
        return (this instanceof Ellipse) || (this instanceof Sector);
    },

    _paintAsPath: function () {
        const map = this.getMap();
        const altitude = this._getPainter().getAltitude();
        // when map is tilting, draw the circle/ellipse as a polygon by vertexes.
        return altitude > 0 || map.getPitch() || ((this instanceof Ellipse) && map.getBearing());
    },

    _getPaintParams() {
        const map = this.getMap();
        if (this._paintAsPath()) {
            return Polygon.prototype._getPaintParams.call(this, true);
        }
        const pcenter = this._getPrjCoordinates();
        const pt = map._prjToPoint(pcenter, map.getGLZoom());
        const size = this._getRenderSize();
        return [pt, size['width'], size['height']];
    },

    _paintOn: function () {
        if (this._paintAsPath()) {
            return Canvas.polygon.apply(Canvas, arguments);
        } else {
            return Canvas.ellipse.apply(Canvas, arguments);
        }
    },

    _getRenderSize() {
        const map = this.getMap(),
            z = map.getGLZoom();
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
        const pointZoom = map.getGLZoom();
        const shell = this._getPrjShell();
        const points = this._getPath2DPoints(shell, false, pointZoom);
        return [points];
    },

    _paintOn: Canvas.polygon
});
//----------------------------------------------------
Sector.include(el, {
    _redrawWhenPitch: () => true,

    _getPaintParams() {
        if (this._paintAsPath()) {
            return Polygon.prototype._getPaintParams.call(this, true);
        }
        const map = this.getMap();
        const pt = map._prjToPoint(this._getPrjCoordinates(), map.getGLZoom());
        const size = this._getRenderSize();
        return [pt, size['width'],
            [this.getStartAngle(), this.getEndAngle()]
        ];
    },

    _paintOn: function () {
        if (this._paintAsPath()) {
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
Path.include({
    _paintAsPath: () => true
});


LineString.include({

    arrowStyles: {
        'classic': [3, 4]
    },

    _getArrowShape(prePoint, point, lineWidth, arrowStyle, tolerance) {
        if (!tolerance) {
            tolerance = 0;
        }
        const width = lineWidth * arrowStyle[0],
            height = lineWidth * arrowStyle[1] + tolerance,
            hw = width / 2 + tolerance;

        let normal;
        if (point.nextCtrlPoint || point.prevCtrlPoint) {
            // use control points to caculate normal if it's a bezier curve
            if (point.prevCtrlPoint) {
                normal = point.sub(new Point(point.prevCtrlPoint));
            } else {
                normal = point.sub(new Point(point.nextCtrlPoint));
            }
        } else {
            normal = point.sub(prePoint);
        }
        normal._unit();
        const p1 = point.sub(normal.multi(height));
        normal._perp();
        const p0 = p1.add(normal.multi(hw));
        normal._multi(-1);
        const p2 = p1.add(normal.multi(hw));
        return [p0, point, p2, p0];
    },

    _getPaintParams() {
        const prjVertexes = this._getPrjCoordinates();
        const points = this._getPath2DPoints(prjVertexes, false, this.getMap().getGLZoom());
        return [points];
    },

    _paintOn(ctx, points, lineOpacity, fillOpacity, dasharray) {
        if (this.options['smoothness']) {
            Canvas.paintSmoothLine(ctx, points, lineOpacity, this.options['smoothness'], false, this._animIdx, this._animTailRatio);
        } else {
            Canvas.path(ctx, points, lineOpacity, null, dasharray);
        }
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
            first = map.coordToContainerPoint(this.getFirstCoordinate()),
            last = map.coordToContainerPoint(this.getLastCoordinate());
        for (let i = segments.length - 1; i >= 0; i--) {
            if (placement === 'vertex-first' || placement === 'vertex-firstlast' && segments[i][0].closeTo(first, 0.01)) {
                arrows.push(this._getArrowShape(segments[i][1], segments[i][0], lineWidth, arrowStyle, tolerance));
            }
            if (placement === 'vertex-last' || placement === 'vertex-firstlast' && segments[i][segments[i].length - 1].closeTo(last, 0.01)) {
                arrows.push(this._getArrowShape(segments[i][segments[i].length - 2], segments[i][segments[i].length - 1], lineWidth, arrowStyle, tolerance));
            } else if (placement === 'point') {
                this._getArrowPoints(arrows, segments[i], lineWidth, arrowStyle, tolerance);
            }
        }
        return arrows;
    },

    _getArrowPoints(arrows, segments, lineWidth, arrowStyle, tolerance) {
        for (let ii = 0, ll = segments.length - 1; ii < ll; ii++) {
            arrows.push(this._getArrowShape(segments[ii], segments[ii + 1], lineWidth, arrowStyle, tolerance));
        }
    },

    _paintArrow(ctx, points, lineOpacity) {
        let lineWidth = this._getInternalSymbol()['lineWidth'];
        if (!isNumber(lineWidth) || lineWidth < 3) {
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
        const maxZoom = this.getMap().getGLZoom();
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
            //outer ring  simplify result;
            const simplified = this._simplified;
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
            // if outer ring  simplify==true , Ignore inner ring  simplify result
            if (simplified) {
                this._simplified = simplified;
            }
        }
        if (!isSplitted) {
            points = [points];
            pushIn(points, holePoints);
        }
        return [points];
    },

    _paintOn(ctx, points, lineOpacity, fillOpacity, dasharray) {
        Canvas.polygon(ctx, points, lineOpacity, fillOpacity, dasharray, this.options['smoothness']);
    }
});

