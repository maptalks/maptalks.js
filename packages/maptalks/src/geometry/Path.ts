import { isNumber, isArrayHasData, isFunction, getPointsResultPts } from '../core/util';
import { Animation, AnimationOptionsType, Frame, Player } from '../core/Animation';
import Coordinate from '../geo/Coordinate';
import Extent from '../geo/Extent';
import Geometry, { GeometryOptionsType } from './Geometry';
import simplify from 'simplify-js';
import Point from '../geo/Point';
import { CommonProjectionType } from '../geo/projection';
import { FillSymbol, LineSymbol } from '../symbol';
import { GEOMETRY_NOT_FIND_PROJECTION } from '../core/Error';

/**
 * @property {Object} options - configuration options
 * @property {Number} [options.smoothness=0]      - line smoothing by quad bezier interporating, 0 by default
 * @property {Boolean} [options.enableSimplify=true] - whether to simplify path before rendering
 * @property {Number}  [options.simplifyTolerance=2] - tolerance to simplify path, the higher the simplify is more intense
 * @property {Boolean} [options.enableClip=true] - whether to clip path with map's current extent
 * @property {Object} options.symbol - Path's default symbol
 * @memberOf Path
 * @instance
 */
const options: PathOptionsType = {
    'smoothness': false,
    'enableClip': true,
    'enableSimplify': true,
    'simplifyTolerance': 2,
    'symbol': {
        'lineColor': '#000',
        'lineWidth': 2,
        'lineOpacity': 1,

        'polygonFill': '#fff', //default color in cartoCSS
        'polygonOpacity': 1,
        'opacity': 1
    }
};

type animateShowCallback = (frame: Frame, currentCoord: Coordinate) => void;
export type PathCoordinates = Array<Coordinate>;
export type PathsCoordinates = Array<PathCoordinates>;
export type MultiPathsCoordinates = Array<PathsCoordinates>;

/**
 * 一个抽象类Path，包含Path几何类的常用方法，例如LineString、Polygon
 * @english
 * An abstract class Path containing common methods for Path geometry classes, e.g. LineString, Polygon
 * @abstract
 * @category geometry
 * @extends Geometry
 */
export class Path extends Geometry {

    //@internal
    _coordinates: Coordinate[];
    //@internal
    _showPlayer: Player;
    //@internal
    _animIdx: number
    //@internal
    _animLenSoFar: number
    //@internal
    _animTailRatio: number
    //@internal
    _prjAniShowCenter: Coordinate
    //@internal
    _aniShowCenter: Coordinate
    //@internal
    _tempCoord: Coordinate
    //@internal
    _tempPrjCoord: Point
    //@internal
    _simplified: boolean
    //@internal
    _prjCoords: Array<Coordinate>
    hasHoles?(): boolean;
    //@internal
    _getPrjHoles?(): Array<Array<Coordinate>>;

    /**
     * 动画展示线条
     * @english
     * Show the linestring with animation
     * @param  {Object} [options=null] animation options
     * @param  {Number} [options.duration=1000] duration
     * @param  {String} [options.easing=out] animation easing
     * @param  {Function} [cb=null] callback function in animation, function parameters: frame, currentCoord
     * @example
     *  line.animateShow({
     *    duration : 2000,
     *    easing : 'linear'
     *  }, function (frame, currentCoord) {
     *    //frame is the animation frame
     *    //currentCoord is current coordinate of animation
     *  });
     * @return {LineString}         this
     */
    animateShow(options: (AnimationOptionsType | animateShowCallback) = {}, cb?: animateShowCallback): Player | undefined {
        if (this._showPlayer) {
            this._showPlayer.finish();
        }
        if (isFunction(options)) {
            options = {};
            cb = options as animateShowCallback;
        }
        const coordinates: any = this.getCoordinates();
        if (coordinates.length === 0) {
            return;
        }
        this._animIdx = 0;
        this._animLenSoFar = 0;
        this.show();
        const isPolygon = !!this.getShell;
        const animCoords = isPolygon ? this.getShell().concat(this.getShell()[0]) : coordinates;
        const projection = this._getProjection();
        if (!projection) {
            console.error(GEOMETRY_NOT_FIND_PROJECTION);
            return;
        }

        const prjAnimCoords = projection.projectCoords(animCoords, this.options['antiMeridian']) as Coordinate[];

        this._prjAniShowCenter = this._getPrjExtent().getCenter();
        this._aniShowCenter = projection.unproject(this._prjAniShowCenter);
        const duration = options['duration'] || 1000,
            easing = options['easing'] || 'out';
        this.setCoordinates([]);
        let length = 0;
        if (prjAnimCoords.length) {
            // @ts-expect-error todo
            prjAnimCoords[0]._distance = 0;
        }
        for (let i = 1; i < prjAnimCoords.length; i++) {
            const distance = prjAnimCoords[i].distanceTo(prjAnimCoords[i - 1]);
            // cache distance calc
            // @ts-expect-error todo
            prjAnimCoords[i]._distance = distance;
            length += distance;
        }
        this._tempCoord = new Coordinate(0, 0);
        this._tempPrjCoord = new Point(0, 0);
        const player = this._showPlayer = Animation.animate({
            't': duration
        }, {
            'duration': duration,
            'easing': easing
        }, frame => {
            if (!this.getMap()) {
                if (player.playState !== 'finished') {
                    player.finish();
                    if (cb) {
                        const coordinates = this.getCoordinates() as Coordinate[];
                        cb(frame, coordinates[coordinates.length - 1]);
                    }
                }
                return;
            }
            const currentCoord = this._drawAnimShowFrame(frame.styles.t, duration, length, animCoords, prjAnimCoords);
            if (frame.state.playState === 'finished') {
                delete this._showPlayer;
                delete this._aniShowCenter;
                delete this._prjAniShowCenter;
                delete this._animIdx;
                delete this._animLenSoFar;
                delete this._animTailRatio;
                delete this._tempCoord;
                delete this._tempPrjCoord;
                this.setCoordinates(coordinates);
            }
            if (cb) {
                cb(frame, currentCoord);
            }
        }, this);
        player.play();
        return player;
    }

    //@internal
    _drawAnimShowFrame(t: number, duration: number, length: number, coordinates: Coordinate[], prjCoords: Array<Coordinate>): Coordinate {
        if (t === 0) {
            return coordinates[0];
        }
        // const projection = this._getProjection();
        // const map = this.getMap();
        const targetLength = t / duration * length;
        let segLen = 0;
        let i: number, l: number;
        for (i = this._animIdx + 1, l = prjCoords.length; i < l; i++) {
            // segLen = prjCoords[i].distanceTo(prjCoords[i + 1]);
            segLen = (prjCoords[i] as any)._distance;
            if (this._animLenSoFar + segLen > targetLength) {
                break;
            }
            this._animLenSoFar += segLen;
        }
        this._animIdx = i - 1;
        //is end
        if (this._animIdx >= l - 1) {
            this.setCoordinates(coordinates);
            return coordinates[coordinates.length - 1];
        }
        const idx = this._animIdx;
        const p1 = prjCoords[idx],
            p2 = prjCoords[idx + 1],
            span = targetLength - this._animLenSoFar,
            r = span / segLen;
        this._animTailRatio = r;
        const x = p1.x + (p2.x - p1.x) * r,
            y = p1.y + (p2.y - p1.y) * r;
        this._tempPrjCoord.x = x;
        this._tempPrjCoord.y = y;
        const lastCoord = this._tempPrjCoord;

        const c1 = coordinates[idx], c2 = coordinates[idx + 1];
        const cx = c1.x + (c2.x - c1.x) * r,
            cy = c1.y + (c2.y - c1.y) * r,
            cz = (c1.z || 0) + ((c2.z || 0) - (c1.z || 0)) * r;
        this._tempCoord.x = cx;
        this._tempCoord.y = cy;
        this._tempCoord.z = cz;

        // const targetCoord = projection.unproject(lastCoord, this._tempCoord);
        const targetCoord = this._tempCoord;
        const isPolygon = !!this.getShell;
        if (!isPolygon && this.options['smoothness'] > 0) {
            //smooth line needs to set current coordinates plus 2 more to caculate correct control points
            const animCoords = [], prjAnimCoords = [];
            for (let i = 0; i <= this._animIdx; i++) {
                animCoords.push(coordinates[i]);
                prjAnimCoords.push(prjCoords[i]);
            }
            animCoords.push(targetCoord, targetCoord);
            prjAnimCoords.push(lastCoord, lastCoord);
            // const animCoords = coordinates.slice(0, this._animIdx + 3);
            this.setCoordinates(animCoords);
            // const prjAnimCoords = prjCoords.slice(0, this._animIdx + 3);
            this._setPrjCoordinates(prjAnimCoords);
        } else {
            const animCoords = coordinates.slice(0, this._animIdx + 1);
            animCoords.push(targetCoord);
            const prjAnimCoords = prjCoords.slice(0, this._animIdx + 1);
            prjAnimCoords.push(lastCoord);
            if (isPolygon) {
                this.setCoordinates([this._aniShowCenter].concat(animCoords));
                this._setPrjCoordinates([this._prjAniShowCenter].concat(prjAnimCoords));
            } else {
                this.setCoordinates(animCoords);
                this._setPrjCoordinates(prjAnimCoords);
            }
        }
        return targetCoord;
    }

    //@internal
    _getCenterInExtent(extent: Extent, coordinates: Coordinate[], clipFn: any): Coordinate {
        const meExtent = this.getExtent();
        if (!extent.intersects(meExtent)) {
            return null;
        }
        const clipped = clipFn(coordinates, extent);
        if (clipped.length === 0) {
            return null;
        }
        let [sumx, sumy, counter] = [0, 0, 0];
        clipped.forEach(part => {
            if (Array.isArray(part)) {
                part.forEach(c => {
                    if (c.point) {
                        c = c.point;
                    }
                    sumx += c.x;
                    sumy += c.y;
                    counter++;
                });
            } else {
                if (part.point) {
                    part = part.point;
                }
                sumx += part.x;
                sumy += part.y;
                counter++;
            }
        });
        const c = new Coordinate(sumx, sumy)._multi(1 / counter);
        // @ts-expect-error todo
        c.count = counter;
        return c;
    }

    /**
     * 将投影坐标转换为视点
     * @english
     * Transform projected coordinates to view points
     * @param  {Coordinate[]} prjCoords           - projected coordinates
     * @param  {Boolean} disableSimplify          - whether to disable simplify\
     * @param  {Number} zoom                      - 2d points' zoom level
     * @returns {Point[]}
     * @private
     */
    //@internal
    _getPath2DPoints(prjCoords: PathCoordinates | PathsCoordinates, disableSimplify: boolean, res?: number): Point | Array<Point> | Array<Array<Point>> {
        if (!isArrayHasData(prjCoords)) {
            return [];
        }
        const map = this.getMap(),
            isSimplify = !disableSimplify && this._shouldSimplify(),
            tolerance = this.options['simplifyTolerance'] * map._getResolution(),
            isMulti = Array.isArray(prjCoords[0]);
        delete this._simplified;
        if (isSimplify && !isMulti) {
            const count = prjCoords.length;
            prjCoords = simplify(prjCoords as PathCoordinates, tolerance, false) as Coordinate[];
            this._simplified = prjCoords.length < count;
        }
        if (!res) {
            res = map._getResolution();
        }
        if (!Array.isArray(prjCoords)) {
            return map._prjToPointAtRes(prjCoords as Coordinate, res);
        } else {
            let resultPoints = [];
            const glPointKey = '_glPt';
            if (!Array.isArray(prjCoords[0])) {
                resultPoints = getPointsResultPts(prjCoords, glPointKey);
                return map._prjsToPointsAtRes(prjCoords as Coordinate[], res, resultPoints);
            }
            const pts = [];
            for (let i = 0, len = prjCoords.length; i < len; i++) {
                const prjCoord = prjCoords[i] as Coordinate[];
                resultPoints = getPointsResultPts(prjCoord, glPointKey);
                const pt = map._prjsToPointsAtRes(prjCoord, res, resultPoints);
                pts.push(pt);
            }
            return pts;
        }
        // return forEachCoord(prjCoords, c => map._prjToPoint(c, zoom));
    }

    //@internal
    _shouldSimplify(): boolean {
        const layer = this.getLayer();
        const hasAltitude = layer.options['enableAltitude'];
        return layer && layer.options['enableSimplify'] && !hasAltitude && this.options['enableSimplify'] && !this._showPlayer/* && !this.options['smoothness'] */;
    }

    //@internal
    _setPrjCoordinates(prjPoints: PathCoordinates): void {
        this._prjCoords = prjPoints;
        this.onShapeChanged();
    }

    //@internal
    _getPrjCoordinates(): PathCoordinates {
        this._verifyProjection();
        if (!this._prjCoords && this._getProjection()) {
            this._prjCoords = this._projectCoords(this._coordinates) as PathCoordinates;
        }
        return this._prjCoords;
    }

    //update cached variables if geometry is updated.
    //@internal
    _updateCache(): void {
        this._clearCache();
        const projection = this._getProjection();
        if (!projection) {
            return;
        }
        if (this._prjCoords) {
            this._coordinates = this._unprojectCoords(this._getPrjCoordinates()) as PathCoordinates;
        }
    }

    //@internal
    _clearProjection(): void {
        this._prjCoords = null;
        super._clearProjection();
    }

    //@internal
    _projectCoords(points: PathCoordinates | PathsCoordinates): PathCoordinates | PathsCoordinates {
        const projection = this._getProjection();
        if (projection) {
            return projection.projectCoords(points, this.options['antiMeridian']) as PathCoordinates;
        }
        return [];
    }

    //@internal
    _unprojectCoords(prjPoints: PathCoordinates | PathsCoordinates): PathCoordinates | PathsCoordinates {
        const projection = this._getProjection();
        if (projection) {
            return projection.unprojectCoords(prjPoints) as PathCoordinates;
        }
        return [];
    }

    //@internal
    _computeCenter(): null | Coordinate {
        const ring = this._coordinates;
        if (!isArrayHasData(ring)) {
            return null;
        }
        let sumx = 0,
            sumy = 0,
            counter = 0;
        const size = ring.length;
        for (let i = 0; i < size; i++) {
            if (ring[i]) {
                if (isNumber(ring[i].x) && isNumber(ring[i].y)) {
                    sumx += ring[i].x;
                    sumy += ring[i].y;
                    counter++;
                }
            }
        }
        return new Coordinate(sumx / counter, sumy / counter);
    }

    //@internal
    _computeExtent(_?: any): Extent {
        const shell = this._coordinates;
        if (!isArrayHasData(shell)) {
            return null;
        }
        const rings = [shell];
        if (this.hasHoles && this.hasHoles()) {
            rings.push.call(rings, ...this.getHoles());
        }
        return this._coords2Extent(rings, this._getProjection());
    }

    //@internal
    _computePrjExtent(_?: any): Extent {
        const coords = [this._getPrjCoordinates()];
        if (this.hasHoles && this.hasHoles()) {
            coords.push.call(coords, ...this._getPrjHoles());
        }
        return this._coords2Extent(coords);
    }

    //@internal
    _get2DLength(): number {
        const vertexes = this._getPath2DPoints(this._getPrjCoordinates(), true) as Point[];
        let len = 0;
        for (let i = 1, l = vertexes.length; i < l; i++) {
            len += vertexes[i].distanceTo(vertexes[i - 1]);
        }
        return len;
    }

    //@internal
    _hitTestTolerance(): number {
        const symbol = this._getInternalSymbol();
        let w, border = 0;
        if (Array.isArray(symbol)) {
            w = 0;

            for (let i = 0; i < symbol.length; i++) {
                if (isNumber(symbol[i]['lineWidth'])) {
                    if (symbol[i]['lineWidth'] > w) {
                        w = symbol[i]['lineWidth'];
                    }
                }
                if (isNumber(symbol[i]['lineStrokeWidth'])) {
                    border = Math.max(border, symbol[i]['lineStrokeWidth']);
                }
            }
        } else {
            w = symbol['lineWidth'];
            border = symbol['lineStrokeWidth'] || 0;
        }
        w += border * 2;
        return super._hitTestTolerance() + (isNumber(w) ? w / 2 : 1.5);
    }

    //@internal
    _coords2Extent(coords: PathsCoordinates, proj?: CommonProjectionType): Extent {
        // linestring,  polygon
        if (!coords || coords.length === 0 || (Array.isArray(coords[0]) && coords[0].length === 0)) {
            return null;
        }
        const result = new Extent(proj as any);
        for (let i = 0, l = coords.length; i < l; i++) {
            for (let j = 0, ll = coords[i].length; j < ll; j++) {
                result._combine(coords[i][j]);
            }
        }
        return result;
    }
}

Path.mergeOptions(options);

export default Path;

export type PathOptionsType = GeometryOptionsType & {
    'smoothness'?: boolean;
    'enableClip'?: boolean;
    'enableSimplify'?: boolean;
    'simplifyTolerance'?: number;
    'symbol'?: FillSymbol | LineSymbol;
};
