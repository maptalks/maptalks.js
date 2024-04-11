import { isArrayHasData } from '../core/util';
import Coordinate from '../geo/Coordinate';
import { clipPolygon } from '../core/util/path';
import Path, { PathCoordinates, PathOptionsType, PathsCoordinates } from './Path';
import Extent from '../geo/Extent';
import { AnySymbol, FillSymbol } from '../symbol';
import { LineStringCoordinatesType } from './LineString';

const JSON_TYPE = 'Polygon';

/**
 * @classdesc
 * Geometry class for polygon type
 * @category geometry
 * @extends Path
 * @example
 * var polygon = new Polygon(
 *      [
 *          [
 *              [121.48053653961283, 31.24244899384889],
 *              [121.48049362426856, 31.238559229494186],
 *              [121.49032123809872, 31.236210614999653],
 *              [121.49366863494917, 31.242926029397037],
 *              [121.48577221160967, 31.243880093267567],
 *              [121.48053653961283, 31.24244899384889]
 *          ]
 *      ]
 *  ).addTo(layer);
 */

export type PolygonCoordinatesType = Array<Array<Coordinate>> | Array<Array<number>>;
export type RingCoordinates = PathCoordinates;
export type RingsCoordinates = PathsCoordinates;


export class Polygon extends Path {

    public _holes: RingsCoordinates;
    public _prjHoles: RingsCoordinates;
    public _prjShell: RingCoordinates;
    _getShell?(): RingCoordinates;
    /**
     * @param {Number[][]|Number[][][]|Coordinate[]|Coordinate[][]} coordinates - coordinates, shell coordinates or all the rings.
     * @param {Object} [options=null] - construct options defined in [Polygon]{@link Polygon#options}
     */
    constructor(coordinates: PolygonCoordinatesType | LineStringCoordinatesType, options?: PolygonOptionsType) {
        super(options);
        this.type = 'Polygon';
        if (coordinates) {
            this.setCoordinates(coordinates);
        }
    }

    getOutline(): null | Polygon {
        const painter = this._getPainter();
        if (!painter) {
            return null;
        }
        const extent = this.getExtent();
        return new Polygon(extent.toArray() as unknown as PolygonCoordinatesType, {
            symbol: {
                'lineWidth': 1,
                'lineColor': '6b707b'
            }
        });
    }

    /**
     * 设置多边形坐标
     * @english
     * Set coordinates to the polygon
     *
     * @param {Number[][]|Number[][][]|Coordinate[]|Coordinate[][]} coordinates - new coordinates
     * @return {Polygon} this
     * @fires Polygon#shapechange
     */
    setCoordinates(coordinates: PolygonCoordinatesType | LineStringCoordinatesType) {
        if (!coordinates) {
            this._coordinates = null;
            this._holes = null;
            this._projectRings();
            return this;
        }
        const rings: any = Coordinate.toCoordinates(coordinates as unknown as Coordinate[][]);
        const len = rings.length;
        if (!Array.isArray(rings[0])) {
            this._coordinates = this._trimRing(rings);
        } else {
            this._coordinates = this._trimRing(rings[0]);
            if (len > 1) {
                const holes = [];
                for (let i = 1; i < len; i++) {
                    if (!rings[i]) {
                        continue;
                    }
                    holes.push(this._trimRing(rings[i]));
                }
                this._holes = holes;
            } else {
                this._holes = null;
            }
        }

        this._projectRings();
        return this;
    }

    /**
     * 获取多边形坐标
     * @english
     * Gets polygons's coordinates
     *
     * @returns {Coordinate[][]}
     */
    getCoordinates(): RingsCoordinates {
        if (!this._coordinates) {
            return [];
        }
        const holes = this.getHoles();
        const rings = [this._copyAndCloseRing(this._coordinates)];
        for (let i = 0, l = holes.length; i < l; i++) {
            rings.push(this._copyAndCloseRing(holes[i]));
        }
        return rings;
    }

    /**
     * 获取具有给定范围的线串的交点的中心
     * @english
     * Get center of linestring's intersection with give extent
     * @example
     *  const extent = map.getExtent();
     *  const center = line.getCenterInExtent(extent);
     * @param {Extent} extent
     * @return {Coordinate} center, null if line doesn't intersect with extent
     */
    getCenterInExtent(extent: Extent): Coordinate {
        return this._getCenterInExtent(extent, this.getShell(), clipPolygon);
    }

    /**
     * 获取多边形的外壳坐标
     * @english
     * Gets shell's coordinates of the polygon
     *
     * @returns {Coordinate[]}
     */
    getShell(): RingCoordinates {
        return this._coordinates || [];
    }


    /**
     * 获取多边形的洞的坐标（如果有）。
     * @english
     * Gets holes' coordinates of the polygon if it has.
     * @returns {Coordinate[][]}
     */
    getHoles(): RingsCoordinates {
        return this._holes || [];
    }

    /**
     * 判断多边形是否带有洞
     * @english
     * Whether the polygon has any holes inside.
     *
     * @returns {Boolean}
     */
    hasHoles(): boolean {
        return this.getHoles().length > 0;
    }

    _projectRings(): void {
        if (!this.getMap()) {
            this.onShapeChanged();
            return;
        }
        this._prjCoords = this._projectCoords(this._coordinates) as RingCoordinates;
        this._prjHoles = this._projectCoords(this._holes) as RingsCoordinates;
        this.onShapeChanged();
    }

    _setPrjCoordinates(prjCoords: RingCoordinates): void {
        this._prjCoords = prjCoords;
        this.onShapeChanged();
    }

    _cleanRing(ring: RingCoordinates) {
        for (let i = ring.length - 1; i >= 0; i--) {
            if (!ring[i]) {
                ring.splice(i, 1);
            }
        }
    }

    /**
     * 检查环是否有效
     * @english
     * Check if ring is valid
     * @param  {*} ring ring to check
     * @return {Boolean} is ring a closed one
     * @private
     */
    _checkRing(ring: RingCoordinates): boolean {
        this._cleanRing(ring);
        if (!ring || !isArrayHasData(ring)) {
            return false;
        }
        const lastPoint = ring[ring.length - 1];
        let isClose = true;
        if (ring[0].x !== lastPoint.x || ring[0].y !== lastPoint.y) {
            isClose = false;
        }
        return isClose;
    }

    /**
     * 如果第一个坐标与最后一个坐标相等，则删除最后一个座标。
     * @english
     * If the first coordinate is equal with the last one, then remove the last coordinates.
     * @private
     */
    _trimRing(ring: RingCoordinates): RingCoordinates {
        const isClose = this._checkRing(ring);
        if (isArrayHasData(ring) && isClose) {
            ring.splice(ring.length - 1, 1);
        }
        return ring;
    }

    /**
     * 如果第一个坐标与最后一个不同，则复制第一个坐标并添加到环中。
     * @english
     * If the first coordinate is different with the last one, then copy the first coordinates and add to the ring.
     * @private
     */
    _copyAndCloseRing(ring: RingCoordinates): RingCoordinates {
        ring = ring.slice(0);
        const isClose = this._checkRing(ring);
        if (isArrayHasData(ring) && !isClose) {
            ring.push(ring[0].copy());
            return ring;
        } else {
            return ring;
        }
    }

    _getPrjShell(): RingCoordinates {
        if (this.getJSONType() === JSON_TYPE) {
            return this._getPrjCoordinates();
        }
        //r.g. for Rectangle
        this._verifyProjection();
        if (this._getProjection() && !this._prjShell) {
            this._prjShell = this._projectCoords(this._getShell ? this._getShell() : this.getShell()) as RingCoordinates;
        }
        return this._prjShell;
    }

    _getPrjHoles(): RingsCoordinates {
        const projection = this._getProjection();
        this._verifyProjection();
        if (projection && !this._prjHoles) {
            this._prjHoles = this._projectCoords(this.getHoles()) as RingsCoordinates;
        }
        return this._prjHoles;
    }

    _computeGeodesicLength(measurer: any): number {
        const rings = this.getCoordinates();
        if (!isArrayHasData(rings)) {
            return 0;
        }
        let result = 0;
        for (let i = 0, len = rings.length; i < len; i++) {
            result += measurer.measureLength(rings[i]);
        }
        return result;
    }

    _computeGeodesicArea(measurer: any): number {
        const rings = this.getCoordinates();
        if (!isArrayHasData(rings)) {
            return 0;
        }
        let result = measurer.measureArea(rings[0]);
        //holes
        for (let i = 1, len = rings.length; i < len; i++) {
            result -= measurer.measureArea(rings[i]);

        }
        return result;
    }

    _updateCache(): void {
        super._updateCache();
        if (this._prjHoles) {
            this._holes = this._unprojectCoords(this._getPrjHoles()) as RingsCoordinates;
        }
    }

    _clearCache(): any {
        delete this._prjShell;
        return super._clearCache();
    }

    _clearProjection(): void {
        if (this._prjHoles) {
            this._prjHoles = null;
        }
        if (this._prjShell) {
            this._prjShell = null;
        }
        super._clearProjection();
    }
}

Polygon.registerJSONType(JSON_TYPE);

export default Polygon;

export type PolygonOptionsType = PathOptionsType & {
    'symbol'?: FillSymbol | Array<AnySymbol>;
}
