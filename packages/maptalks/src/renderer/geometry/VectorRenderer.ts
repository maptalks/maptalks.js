/* eslint-disable @typescript-eslint/ban-ts-comment */
import { pushIn, isNumber } from '../../core/util';
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
import { BBOX, BBOX_TEMP, getDefaultBBOX, pointsBBOX, resetBBOX } from '../../core/util/bbox';
import Extent from '../../geo/Extent';
import Painter from './Painter';
import type { ProjectionType } from '../../geo/projection';
import Coordinate from '../../geo/Coordinate';
import { WithNull } from '../../types/typings';

const TEMP_WITHIN = {
    within: false,
    center: [0, 0]
};

// bbox in pixel
function isWithinPixel(painter: Painter) {
    if (!painter || !painter._containerBbox) {
        TEMP_WITHIN.within = false;
    } else {
        TEMP_WITHIN.within = false;
        const { minx, miny, maxx, maxy } = painter._containerBbox;
        const offsetx = Math.abs(maxx - minx);
        const offsety = Math.abs(maxy - miny);
        if (offsetx <= 1 && offsety <= 1) {
            TEMP_WITHIN.within = true;
            TEMP_WITHIN.center[0] = (minx + maxx) / 2;
            TEMP_WITHIN.center[1] = (miny + maxy) / 2;
        }
        delete painter._containerBbox;
    }
    return TEMP_WITHIN;
}

const geometryInclude = {
    //@internal
    _redrawWhenPitch: () => false,

    //@internal
    _redrawWhenRotate: () => false,

    //@internal
    _getRenderBBOX(ctx: CanvasRenderingContext2D, points: Point[]) {
        if (!ctx.isHitTesting) {
            resetBBOX(BBOX_TEMP);
            pointsBBOX(points, BBOX_TEMP);
            return BBOX_TEMP;
        }
        return null;
    }
};

export type GeometryIncludeType = typeof geometryInclude;

declare module '../../geometry/Geometry' {
    interface Geometry extends GeometryIncludeType { }
}

Geometry.include(geometryInclude);

function _computeRotatedPrjExtent() {
    const coord = this._getPrjShell();
    const bbox = getDefaultBBOX();
    //cal all points center
    pointsBBOX(coord, bbox);
    const [minx, miny, maxx, maxy] = bbox;
    return new Extent(minx, miny, maxx, maxy);
}

function getRotatedShell() {
    const prjs = this._getPrjShell();
    if (!prjs || !Array.isArray(prjs)) {
        return [];
    }
    const projection = this._getProjection() as ProjectionType;
    const coordinates = this.getCoordinates() || {};
    return prjs.map(prj => {
        const c = projection.unproject(prj);
        c.z = coordinates.z || 0;
        return c;
    });
}
//for Ellipse,Circle,
const el = {
    //@internal
    _redrawWhenPitch: (): boolean => true,

    //@internal
    _redrawWhenRotate: function (): boolean {
        return (this instanceof Ellipse) || (this instanceof Sector);
    },
    //@internal
    _computeRotatedPrjExtent,
    getRotatedShell,

    //@internal
    _paintAsPath: function (): boolean {
        //why? when rotate need draw by path
        if (this.isRotated()) {
            return true;
        }
        const map = this.getMap();
        const altitude = this._getAltitude();
        if (this instanceof Ellipse || this instanceof Circle) {
            return true;
        }
        // when map is tilting, draw the circle/ellipse as a polygon by vertexes.
        return altitude > 0 || map.getPitch() || ((this instanceof Ellipse) && map.getBearing());
    },

    //@internal
    _getPaintParams(): any[] {
        const map = this.getMap();
        if (this._paintAsPath()) {
            return Polygon.prototype._getPaintParams.call(this, true);
        }
        const pcenter = this._getPrjCoordinates();
        const pt: Point = map._prjToPointAtRes(pcenter, map.getGLRes());
        const size = this._getRenderSize(pt);
        return [pt, ...size];
    },

    //@internal
    _paintOn: function (...args: any[]) {
        if (this._paintAsPath()) {
            // @ts-expect-error
            return Canvas.polygon(...args);
        } else {
            // @ts-expect-error
            return Canvas.ellipse(...args);
        }
    },

    //@internal
    _getRenderSize(pt: Coordinate) {
        const map = this.getMap(),
            glRes = map.getGLRes();
        const prjExtent = this._getPrjExtent();
        const pmin = map._prjToPointAtRes(prjExtent.getMin(), glRes),
            pmax = map._prjToPointAtRes(prjExtent.getMax(), glRes);
        return [Math.abs(pmax.x - pmin.x) / 2, Math.abs(pmax.y - pt.y), Math.abs(pt.y - pmin.y)];
    }
};

export type ElType = typeof el;

declare module '../../geometry/Ellipse' {
    interface Ellipse extends Omit<ElType, '_paintOn' | '_getPaintParams'> { }
}

Ellipse.include(el);

declare module '../../geometry/Circle' {
    interface Circle extends Omit<ElType, '_paintOn' | '_getPaintParams'> { }
}

Circle.include(el);

const rectangleInclude = {
    //@internal
    _getPaintParams() {
        const map = this.getMap();
        const shell = this._getPrjShell();
        const points = this._getPath2DPoints(shell, false, map.getGLRes());
        return [points];
    },

    //@internal
    _paintOn: Canvas.polygon,
    //@internal
    _computeRotatedPrjExtent,
    getRotatedShell
};

export type RectangleIncludeType = typeof rectangleInclude;

declare module '../../geometry/Rectangle' {
    // @ts-expect-error 确实需要重写父类的属性
    interface Rectangle extends Omit<RectangleIncludeType, '_paintOn' | '_getPaintParams'> { }
}

Rectangle.include(rectangleInclude);

const sectorInclude = {
    //@internal
    _redrawWhenPitch: (): boolean => true,

    //@internal
    _getPaintParams(): [Point, number, [number, number]] {
        if (this._paintAsPath()) {
            return Polygon.prototype._getPaintParams.call(this, true);
        }
        const map = this.getMap();
        const pt = map._prjToPointAtRes(this._getPrjCoordinates(), map.getGLRes());
        const size = this._getRenderSize(pt);
        const [startAngle, endAngle] = this._correctAngles();
        return [
            pt,
            size[0],
            [startAngle, endAngle]
        ];
    },

    //@internal
    _paintOn: function (...args: any[]) {
        if (this._paintAsPath()) {
            // @ts-expect-error
            return Canvas.polygon(...args);
        } else {
            const r = this.getMap().getBearing();
            if (r) {
                args[3] = args[3].slice(0);
                args[3][0] += r;
                args[3][1] += r;
            }
            // @ts-expect-error
            return Canvas.sector(...args);
        }
    }
};

export type SectorIncludeType = typeof sectorInclude;

declare module '../../geometry/Sector' {
    interface Sector extends Omit<SectorIncludeType, '_paintOn' | '_getPaintParams'> { }
}

Sector.include(el, sectorInclude);

declare module '../../geometry/Path' {
    interface Path {
        //@internal
        _paintAsPath: () => boolean;
    }
}

Path.include({
    //@internal
    _paintAsPath: () => true
});

const lineStringInclude = {

    arrowStyles: {
        'classic': [3, 4]
    },

    //@internal
    _getArrowShape(prePoint?: Point, point?: any, lineWidth?: number, arrowStyle?: any, tolerance?: number) {
        if (!prePoint || !point || prePoint.equals(point)) {
            return null;
        }
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

    //@internal
    _getPaintParams(): [Point[]] {
        const prjVertexes = this._getPrjCoordinates();
        const points = this._getPath2DPoints(prjVertexes, false, this.getMap().getGLRes());
        return [points];
    },

    //@internal
    _paintOn(ctx: CanvasRenderingContext2D, points: Point[], lineOpacity?: number, fillOpacity?: number, dasharray?: number[], lineColorIn?: any) {
        const r = isWithinPixel(this._painter);
        if (r.within) {
            Canvas.pixelRect(ctx, r.center, lineOpacity, fillOpacity);
        } else if (this.options['smoothness']) {
            Canvas.paintSmoothLine(ctx, points, lineOpacity, this.options['smoothness'], false, this._animIdx, this._animTailRatio);
        } else {
            ctx.lineColorIn = lineColorIn;
            Canvas.path(ctx, points, lineOpacity, null, dasharray);
        }
        this._paintArrow(ctx, points, lineOpacity);
        return this._getRenderBBOX(ctx, points);
    },

    //@internal
    _getArrowPlacement() {
        return this.options['arrowPlacement'];
    },

    //@internal
    _getArrowStyle() {
        const arrowStyle = this.options['arrowStyle'];
        if (arrowStyle) {
            return Array.isArray(arrowStyle) ? arrowStyle : this.arrowStyles[arrowStyle];
        }
        return null;
    },

    //@internal
    _getArrows(points: Array<Point> | Array<Array<Point>>, lineWidth: number, tolerance?: number) {
        const arrowStyle = this._getArrowStyle();
        if (!arrowStyle || points.length < 2) {
            return [];
        }
        const isSplitted = points.length > 0 && Array.isArray(points[0]);
        const segments: Array<Array<Point>> = (isSplitted ? points : [points]) as Array<Array<Point>>;
        const placement = this._getArrowPlacement();
        const arrows = [];
        // const map = this.getMap();
        // first = map.coordToContainerPoint(this.getFirstCoordinate()),
        //     last = map.coordToContainerPoint(this.getLastCoordinate());
        let p1: Point, p2: Point;
        const createArrow = () => {
            if (p1 && p2) {
                const arrow = this._getArrowShape(p1, p2, lineWidth, arrowStyle, tolerance);
                if (arrow) {
                    arrows.push(arrow);
                }
            }
        }
        //关于弧线或者平滑曲线的箭头节点分布
        /**
         * P0--arrowNextPoint----------arrowPrePoint--P1-------------arrowPrePoint--P2------------arrowPrePoint--P3.............arrowPrePoint--Pn
         */
        for (let i = segments.length - 1; i >= 0; i--) {
            const path = segments[i];
            const len = path.length;
            const first = path[0];
            const last = path[len - 1];
            //忽略closeTo判断，因为点可能有海拔，比如两个点可能是垂直关系
            if (placement === 'vertex-first') {
                //如果有箭头专用节点使用箭头专用节点,一般是弧线或者平滑曲线
                //第一个节点有箭头专用后置节点
                p1 = first.arrowNextPoint || path[1];
                p2 = first;
            } else if (placement === 'vertex-last') {
                //如果有箭头专用节点使用箭头专用节点,一般是弧线或者平滑曲线
                //其他节点有箭头专用的前置节点
                p1 = last.arrowPrePoint || path[len - 2];
                p2 = last;
            }
            createArrow();
            if (placement === 'vertex-firstlast') {
                p1 = first.arrowNextPoint || path[1];
                p2 = first;
                createArrow();
                p1 = last.arrowPrePoint || path[len - 2];
                p2 = last;
                createArrow();
            }
            if (placement === 'point') {
                this._getArrowPoints(arrows, path, lineWidth, arrowStyle, tolerance);
            }
            // if (placement === 'vertex-first' || placement === 'vertex-firstlast' && segments[i][0].closeTo(first, 0.01)) {
            //     const arrow = this._getArrowShape(segments[i][1], segments[i][0], lineWidth, arrowStyle, tolerance);
            //     if (arrow) {
            //         arrows.push(arrow);
            //     }
            // }
            // if (placement === 'vertex-last' || placement === 'vertex-firstlast' && segments[i][segments[i].length - 1].closeTo(last, 0.01)) {
            //     const arrow = this._getArrowShape(segments[i][segments[i].length - 2], segments[i][segments[i].length - 1], lineWidth, arrowStyle, tolerance);
            //     if (arrow) {
            //         arrows.push(arrow);
            //     }
            // } else if (placement === 'point') {
            //     this._getArrowPoints(arrows, segments[i], lineWidth, arrowStyle, tolerance);
            // }
        }
        return arrows;
    },

    //@internal
    _getArrowPoints(arrows: any[], segments: any[], lineWidth?: number, arrowStyle?: any, tolerance?: number) {
        for (let ii = 0, ll = segments.length - 1; ii < ll; ii++) {
            const pre = segments[ii];
            const next = segments[ii + 1];
            //如果有箭头专用节点使用箭头专用节点
            const arrow = this._getArrowShape(next.arrowPrePoint || pre, next, lineWidth, arrowStyle, tolerance);
            if (arrow) {
                arrows.push(arrow);
            }
        }
    },

    //@internal
    _paintArrow(ctx: CanvasRenderingContext2D, points: Point[], lineOpacity?: number) {
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
};

export type LineStringIncludeType = typeof lineStringInclude;

declare module '../../geometry/LineString' {
    interface LineString extends LineStringIncludeType { }
}

LineString.include(lineStringInclude);

const polygonInclude = {
    //@internal
    _getPaintParams(disableSimplify?: boolean) {
        const glRes = this.getMap().getGLRes();
        const prjVertexes = this._getPrjShell();
        let points = this._getPath2DPoints(prjVertexes, disableSimplify, glRes);
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
                const hole = this._getPath2DPoints(prjHoles[i], disableSimplify, glRes);
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

    //@internal
    _paintOn(ctx: CanvasRenderingContext2D, points: Point[], lineOpacity?: number, fillOpacity?: number, dasharray?: number[], lineColorIn?: any) {
        const r = isWithinPixel(this._painter);
        if (r.within) {
            Canvas.pixelRect(ctx, r.center, lineOpacity, fillOpacity);
        } else {
            ctx.lineColorIn = lineColorIn;
            Canvas.polygon(ctx, points, lineOpacity, fillOpacity, dasharray, this.options['smoothness']);
        }
        return this._getRenderBBOX(ctx, points);
    }
};

declare module '../../geometry/Polygon' {
    interface Polygon {
        //@internal
        _paintOn(ctx: CanvasRenderingContext2D, points: Point[], lineOpacity?: number, fillOpacity?: number, dasharray?: number[]): WithNull<BBOX>;
    }
}

Polygon.include(polygonInclude);
