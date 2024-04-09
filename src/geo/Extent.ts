import { isNil, isNumber } from '../core/util/common';
import Coordinate, { CoordinateLike } from './Coordinate';
import Point from './Point';
import Size from './Size';
import type PointExtent from './PointExtent';
import type { WithNull } from '../types/typings';

// temparary variables
const TEMP_POINT0 = new Point(0, 0);
const TEMP_COORD0 = new Coordinate(0, 0);
const TEMP_COORD1 = new Coordinate(0, 0);
const TEMP_COORD2 = new Coordinate(0, 0);
const TEMP_COORD3 = new Coordinate(0, 0);
const TEMP_COORD4 = new Coordinate(0, 0);
const TEMP_COORD5 = new Coordinate(0, 0);
const TEMP_COORD6 = new Coordinate(0, 0);
const TEMP_COORD7 = new Coordinate(0, 0);
const MINMAX = [];
/* eslint-disable prefer-const */
let TEMP_EXTENT;
/* eslint-enable prefer-const */
const TEMP_COMBINE = [];

export type Projection = any;

export type Position = Point | Coordinate;

export type ArrayExtent = [number, number, number, number];
export type JsonExtent = {
    xmin: number;
    xmax: number;
    ymin: number;
    ymax: number;
};

export type ExtentLike = Extent | JsonExtent | ArrayExtent;

export interface Constructable<T> {
    new(p1?: WithNull<ExtentLike>, p?: Projection) : T;
    new(p1: Position, p2: Position, p?: Projection) : T;
    new(p1: number, p2: number, p3: number, p4: number, p?: Projection) : T;
}

/**
 * 表示地图上的边界框，即具有最小和最大坐标的矩形地理区域。 <br>
 * 有多种方法可以创建范围：
 *
 * @english
 *
 * Represent a bounding box on the map, a rectangular geographical area with minimum and maximum coordinates. <br>
 * There are serveral ways to create a extent:
 * @category basic types
 * @example
 *
 * ```ts
 * //with 4 numbers: xmin, ymin, xmax and ymax
 * var extent = new Extent(100, 10, 120, 20);
 *
 * //with 2 coordinates
 * var extent = new Extent(new Coordinate(100, 10), new Coordinate(120, 20));
 *
 * //with a json object containing xmin, ymin, xmax and ymax
 * var extent = new Extent({xmin : 100, ymin: 10, xmax: 120, ymax:20});
 *
 * var extent1 = new Extent(100, 10, 120, 20);
 * //with another extent
 * var extent2 = new Extent(extent1);
 * ```
 */
class Extent {
    _clazz: typeof Coordinate | typeof Point;
    _dirty: boolean;

    projection: any;
    xmin: WithNull<number>;
    xmax: WithNull<number>;
    ymin: WithNull<number>;
    ymax: WithNull<number>;
    pxmin: number;
    pxmax: number;
    pymin: number;
    pymax: number;
    // SpatialReference 对 Extent 做了一个扩充
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;

    constructor(p1?: WithNull<ExtentLike>, p?: Projection);
    constructor(p1: Position, p2: Position, p?: Projection);
    constructor(p1: number, p2: number, p3: number, p4: number, p?: Projection)
    constructor(...args: any[]) {
        this._clazz = Coordinate;
        const l = args.length; // tip 最后一个参数是投影
        const proj = l > 0 ? args[l - 1] : null;
        if (proj && proj.unproject) {
            this.projection = args[l - 1];
        }
        this._dirty = true;
        this._initialize(args[0], args[1], args[2], args[3]);
    }

    _initialize(p1: WithNull<ExtentLike>): void;
    _initialize(p1: Position, p2: Position): void;
    _initialize(p1: number, p2: number, p3: number, p4: number): void;
    _initialize(p1: ExtentLike | Position | number, p2?: Position | number, p3?: number, p4?: number) {
        /**
         * @property xmin - minimum x
         */
        this.xmin = null;
        /**
         * @property xmax - maximum x
         */
        this.xmax = null;
        /**
         * @property ymin - minimum y
         */
        this.ymin = null;
        /**
         * @property ymax - maximum y
         */
        this.ymax = null;
        if (isNil(p1)) {
            return;
        }
        const projection = this.projection;
        // Constructor 1: all numbers
        if (isNumber(p1) &&
            isNumber(p2) &&
            isNumber(p3) &&
            isNumber(p4)) {
            if (projection) {
                this.set(p1, p2, p3, p4);
            } else {
                this.set(
                    Math.min(p1, p3),
                    Math.min(p2, p4),
                    Math.max(p1, p3),
                    Math.max(p2, p4)
                );
            }
            return;
        } else if (Array.isArray(p1)) {
            if (projection) {
                this.set(p1[0], p1[1], p1[2], p1[3]);
            } else {
                this.set(
                    Math.min(p1[0], p1[2]),
                    Math.min(p1[1], p1[3]),
                    Math.max(p1[0], p1[2]),
                    Math.max(p1[1], p1[3])
                );
            }
        } else if (
            isNumber((p1 as Position).x) &&
            isNumber((p2 as Position).x) &&
            isNumber((p1 as Position).y) &&
            isNumber((p2 as Position).y)) {
            // Constructor 2: two coordinates
            const tp1 = p1 as Position;
            const tp2 = p2 as Position;
            if (projection) {
                this.set(tp1.x, tp1.y, tp2.x, tp2.y);
            } else {
                if (tp1.x > tp2.x) {
                    this['xmin'] = tp2.x;
                    this['xmax'] = tp1.x;
                } else {
                    this['xmin'] = tp1.x;
                    this['xmax'] = tp2.x;
                }
                if (tp1.y > tp2.y) {
                    this['ymin'] = tp2.y;
                    this['ymax'] = tp1.y;
                } else {
                    this['ymin'] = tp1.y;
                    this['ymax'] = tp2.y;
                }
            }
            // constructor 3: another extent or a object containing xmin, ymin, xmax and ymax
        } else if (isNumber(p1['xmin']) &&
            isNumber(p1['xmax']) &&
            isNumber(p1['ymin']) &&
            isNumber(p1['ymax'])) {
            this.set(p1['xmin'], p1['ymin'], p1['xmax'], p1['ymax']);
        }
    }

    /**
     * 与坐标或点相加, 会改变原数据
     *
     * @english
     *
     * Add the extent with a coordinate or a point.
     * @returns a new extent
     * @param p
     */
    _add(p: Extent): this;
    _add(p: PointExtent): this;
    _add(p: Position): this;
    _add(p: number[]): this;
    _add(p: any) {
        this._dirty = true;
        if (!isNil(p.x)) {
            this['xmin'] += p.x;
            this['ymin'] += p.y;
            this['xmax'] += p.x;
            this['ymax'] += p.y;
        } else if (!isNil(p.xmin)) {
            this['xmin'] += p.xmin;
            this['ymin'] += p.ymin;
            this['xmax'] += p.xmax;
            this['ymax'] += p.ymax;
        } else if (!isNil(p[0])) {
            this['xmin'] += p[0];
            this['ymin'] += p[1];
            this['xmax'] += p[0];
            this['ymax'] += p[1];
        }
        return this;
    }

    /**
     * 与坐标或点相加, 返回一个新的 extent
     *
     * @english
     *
     * Add the extent with a coordinate or a point.
     * @returns a new extent
     * @param p
     */
    add(p: Extent): this;
    add(p: PointExtent): this;
    add(p: Position): this;
    add(p: number[]): this;
    add(p: any) {
        const e = new (this.constructor as Constructable<Extent | PointExtent>)(this['xmin'], this['ymin'], this['xmax'], this['ymax'], this.projection);
        return e._add(p);
    }

    /**
     * 缩放当前 extent
     *
     * @english
     *
     * scale extent
     *
     * @param s
     */
    _scale(s: number) {
        this._dirty = true;
        this['xmin'] *= s;
        this['ymin'] *= s;
        this['xmax'] *= s;
        this['ymax'] *= s;
        return this;
    }

    /**
     * 当前范围减去 coordinate、point 或者 extent（改变原数据）
     *
     * @english
     *
     * Substract the extent with a coordinate or a point.
     * @param p
     */
    _sub(p: [number, number]): this;
    _sub(p: Position): this;
    _sub(p: Extent | PointExtent): this;
    _sub(p: any) {
        this._dirty = true;
        if (!isNil(p.x)) {
            this['xmin'] -= p.x;
            this['ymin'] -= p.y;
            this['xmax'] -= p.x;
            this['ymax'] -= p.y;
        } else if (!isNil(p.xmin)) {
            this['xmin'] -= p.xmin;
            this['ymin'] -= p.ymin;
            this['xmax'] -= p.xmax;
            this['ymax'] -= p.ymax;
        } else if (!isNil(p[0])) {
            this['xmin'] -= p[0];
            this['ymin'] -= p[1];
            this['xmax'] -= p[0];
            this['ymax'] -= p[1];
        }
        return this;
    }

    /**
     * _sub 的别名
     *
     * @english
     *
     * Alias for _sub
     * @param p
     */
    _substract(p: [number, number]): this;
    _substract(p: Position): this;
    _substract(p: Extent | PointExtent): this;
    _substract(p: any) {
        return this._sub(p);
    }

    /**
     * 当前范围减去 coordinate 或者 point
     *
     * @english
     *
     * Substract the extent with a coordinate or a point.
     * @returns a new extent
     * @param p
     */
    sub(p: [number, number]): this;
    sub(p: Position): this;
    sub(p: Extent | PointExtent): this;
    sub(p: any) {
        const e = new (this.constructor as Constructable<Extent | PointExtent>)(this['xmin'], this['ymin'], this['xmax'], this['ymax'], this.projection);
        return e._sub(p);
    }

    /**
     * sub 的别名
     *
     * @english
     *
     * Alias for sub
     * @returns a new extent
     * @param p
     */
    substract(p: [number, number]): this;
    substract(p: Position): this;
    substract(p: Extent | PointExtent): this;
    substract(p: any) {
        return this.sub(p);
    }

    /**
     * 对 Extent 边界值进行四舍五入，返回一个新的 Extent
     *
     * @english
     *
     * Round the extent
     * @returns rounded extent
     */
    round() {
        return new (this.constructor as Constructable<Extent | PointExtent>)(
            Math.round(this['xmin']), Math.round(this['ymin']),
            Math.round(this['xmax']), Math.round(this['ymax']),
            this.projection
        );
    }

    /**
     * 对当前 Extent 边界值进行四舍五入
     *
     * @english
     *
     * Round the extent
     * @returns rounded extent
     */
    _round() {
        this._dirty = true;
        this['xmin'] = Math.round(this['xmin']);
        this['ymin'] = Math.round(this['ymin']);
        this['xmax'] = Math.round(this['xmax']);
        this['ymax'] = Math.round(this['ymax']);
        return this;
    }

    /**
     * 获取 Extent 的最小点
     *
     * @english
     * Get the minimum point
     * @params [out=undefined] - optional point to receive result
     */
    getMin(out?: Point): Point;
    getMin(out?: Coordinate): Coordinate;
    getMin(out?: Position): Position {
        if (out) {
            out.set(this['xmin'], this['ymin']);
            return out;
        }
        return new this._clazz(this['xmin'], this['ymin']);
    }

    /**
     * 获取 Extent 的最大点
     *
     * @english
     * Get the maximum point
     * @params [out=undefined] - optional point to receive result
     */
    getMax(out?: Point): Point;
    getMax(out?: Coordinate): Coordinate;
    getMax(out?: Position) {
        if (out) {
            out.set(this['xmax'], this['ymax']);
            return out;
        }
        return new this._clazz(this['xmax'], this['ymax']);
    }

    /**
     * 获取 Extent 的中心点
     *
     * @english
     * Get center of the extent.
     * @params [out=undefined] - optional point to receive result
     */
    getCenter(out?: Position) {
        const x = (this['xmin'] + this['xmax']) / 2;
        const y = (this['ymin'] + this['ymax']) / 2;
        if (out) {
            out.set(x, y);
            return out;
        }
        return new this._clazz(x, y);
    }

    /**
     * 检查 Extent 是否有效
     *
     * @english
     * Whether the extent is valid
     * @protected
     */
    isValid(): boolean {
        return !isNil(this['xmin']) &&
            !isNil(this['ymin']) &&
            !isNil(this['xmax']) &&
            !isNil(this['ymax']);
    }

    /**
     * 与另一个 extent 进行比较它们是否相等
     *
     * @english
     *
     * Compare with another extent to see whether they are equal.
     * @param ext2 - extent to compare
     */
    equals(ext2: Extent | PointExtent): boolean {
        return (this['xmin'] === ext2['xmin'] &&
            this['xmax'] === ext2['xmax'] &&
            this['ymin'] === ext2['ymin'] &&
            this['ymax'] === ext2['ymax']);
    }

    /**
     * 是否与另一个范围相交
     * @english
     *
     * Whether it intersects with another extent
     * @param ext2 - another extent
     */
    intersects(ext2: Extent | PointExtent): boolean {
        this._project(this);
        this._project(ext2);
        const rxmin = Math.max(this['pxmin'], ext2['pxmin']);
        const rymin = Math.max(this['pymin'], ext2['pymin']);
        const rxmax = Math.min(this['pxmax'], ext2['pxmax']);
        const rymax = Math.min(this['pymax'], ext2['pymax']);
        return !((rxmin > rxmax) || (rymin > rymax));
    }

    /**
     * 判断当前 extent 是否在其他 extent 范围内
     * @english
     *
     * Whether the extent is within another extent
     * @param extent - another extent
     */
    within(extent: Extent | PointExtent): boolean {
        this._project(this);
        this._project(extent);
        return this.pxmin >= extent.pxmin && this.pxmax <= extent.pxmax && this.pymin >= extent.pymin && this.pymax <= extent.pymax;
    }

    /**
     * 该范围是否包含输入点
     * @english
     * Whether the extent contains the input point.
     * @param c - input point
     */
    contains(c: CoordinateLike): boolean;
    contains(c: any): boolean {
        if (!c) {
            return false;
        }
        this._project(this);
        const proj = this.projection;
        if (proj) {
            const coord = TEMP_COORD0;
            if (Array.isArray(c)) {
                coord.x = c[0];
                coord.y = c[1];
                c = proj.project(coord, coord);
            } else if (c.x !== undefined) {
                coord.x = c.x;
                coord.y = c.y;
                c = proj.project(coord, coord);
            } else if (c.xmin !== undefined) {
                this._project(c);
            }
        }
        return ((c.x || c.pxmin || 0) >= this.pxmin) &&
            ((c.x || c.pxmax || 0) <= this.pxmax) &&
            ((c.y || c.pymin || 0) >= this.pymin) &&
            ((c.y || c.pymax || 0) <= this.pymax);
    }

    /**
     * 获取Extent的宽度
     *
     * @english
     * Get the width of the Extent
     */
    getWidth(): number {
        return Math.abs(this['xmax'] - this['xmin']);
    }

    /**
     * 获取Extent的高度
     *
     * @english
     * Get the height of the Extent
     */
    getHeight(): number {
        return Math.abs(this['ymax'] - this['ymin']);
    }

    /**
     * 获取Extent的大小 - 高度和宽度构造的 Size 对象
     *
     * @english
     * Get size of the Extent
     */
    getSize() {
        return new Size(this.getWidth(), this.getHeight());
    }

    /**
     * 设置 extent 的边界值
     *
     * @english
     *
     * set extent value
     *
     * @param xmin
     * @param ymin
     * @param xmax
     * @param ymax
     */
    set(xmin: WithNull<number>, ymin: WithNull<number>, xmax: WithNull<number>, ymax: WithNull<number>) {
        this.xmin = xmin;
        this.ymin = ymin;
        this.xmax = xmax;
        this.ymax = ymax;
        this._dirty = true;
        return this;
    }

    __combine(extent: Position | Extent | PointExtent): number[] {
        if ((extent as Position).x !== undefined) {
            TEMP_EXTENT.xmin = TEMP_EXTENT.xmax = (extent as Position).x;
            TEMP_EXTENT.ymin = TEMP_EXTENT.ymax = (extent as Position).y;
            extent = TEMP_EXTENT;
        }
        this._project(extent as (Extent | PointExtent));
        this._project(this);
        const inited = isNumber(this.pxmin);
        let xmin: number, ymin: number, xmax: number, ymax: number;
        if (!inited) {
            xmin = extent['pxmin'];
            ymin = extent['pymin'];
            xmax = extent['pxmax'];
            ymax = extent['pymax'];
        } else {
            xmin = Math.min(this['pxmin'], extent['pxmin']);
            ymin = Math.min(this['pymin'], extent['pymin']);
            xmax = Math.max(this['pxmax'], extent['pxmax']);
            ymax = Math.max(this['pymax'], extent['pymax']);
        }
        const proj = this.projection;
        if (proj) {
            TEMP_COORD1.set(xmin, ymin);
            TEMP_COORD2.set(xmax, ymax);
            const min = proj.unproject(TEMP_COORD1, TEMP_COORD1),
                max = proj.unproject(TEMP_COORD2, TEMP_COORD2);
            xmin = min.x;
            ymin = min.y;
            xmax = max.x;
            ymax = max.y;
        }
        TEMP_COMBINE[0] = xmin;
        TEMP_COMBINE[1] = ymin;
        TEMP_COMBINE[2] = xmax;
        TEMP_COMBINE[3] = ymax;
        return TEMP_COMBINE;
    }

    /**
     * 与其他 extent 合并
     * @english
     * Combine it with another extent to a larger extent.
     * @param extent - extent/coordinate/point to combine into
     * @returns extent combined
     */
    _combine(extent: Position | Extent | PointExtent) {
        // 传入的对象如果判断是非法的直接返回，不继续计算
        if (!extent || (extent as Extent).isValid && !(extent as Extent).isValid()) {
            return this;
        }
        const ext = this.__combine(extent);
        this.set(ext[0], ext[1], ext[2], ext[3]);
        this._dirty = true;
        return this;
    }

    /**
     * 与其他 extent 合并到一个更大的 extent，返回一个新 extent
     * @english
     * Combine it with another extent to a larger extent.
     * @param extent - extent/coordinate/point to combine into
     * @returns extent combined
     */
    combine(extent: Position | Extent | PointExtent) {
        // 传入的对象如果判断是非法的直接返回，不继续计算
        if (!extent || (extent as Extent).isValid && !(extent as Extent).isValid()) {
            return this;
        }
        const ext = this.__combine(extent);
        return new (this.constructor as Constructable<Extent | PointExtent>)(ext[0], ext[1], ext[2], ext[3], this.projection);
    }

    /**
     * 获取当前 extent 与另一个 extent 的交集范围
     *
     * @english
     *
     * Gets the intersection extent of this and another extent.
     * @param extent - another extent
     * @returns intersection extent
     */
    intersection(extent: Extent | PointExtent) {
        if (!this.intersects(extent)) {
            return null;
        }
        TEMP_COORD3.x = Math.max(this['pxmin'], extent['pxmin']);
        TEMP_COORD3.y = Math.max(this['pymin'], extent['pymin']);
        TEMP_COORD4.x = Math.min(this['pxmax'], extent['pxmax']);
        TEMP_COORD4.y = Math.min(this['pymax'], extent['pymax']);
        let min = TEMP_COORD3,
            max = TEMP_COORD4;
        const proj = this.projection;
        if (proj) {
            min = proj.unproject(min, min);
            max = proj.unproject(max, max);
        }
        return new (this.constructor as Constructable<Extent | PointExtent>)(min, max, proj);
    }

    /**
     * 扩大 extent，返回一个新 Extent
     * @english
     *
     * Expand the extent by distance
     * @param distance  - distance to expand
     * @returns a new extent expanded from
     */
    expand(distance: number | Size) {
        let w: number, h: number;
        if (!isNumber(distance)) {
            w = distance['width'] || distance['x'] || distance[0] || 0;
            h = distance['height'] || distance['y'] || distance[1] || 0;
        } else {
            w = h = distance;
        }
        return new (this.constructor as Constructable<Extent | PointExtent>)(this['xmin'] - w, this['ymin'] - h, this['xmax'] + w, this['ymax'] + h, this.projection);
    }

    /**
     * 扩大 extent
     * @english
     * Expand the extent by distance
     * @param distance  - distance to expand
     */
    _expand(distance: number | Size) {
        let w: number, h: number;
        if (!isNumber(distance)) {
            w = distance['width'] || distance['x'] || distance[0] || 0;
            h = distance['height'] || distance['y'] || distance[1] || 0;
        } else {
            w = h = distance;
        }
        this['xmin'] -= w;
        this['ymin'] -= h;
        this['xmax'] += w;
        this['ymax'] += h;
        this._dirty = true;
        return this;
    }

    /**
     * 获取 extent 的 JSON 对象。
     *
     * @english
     * Get extent's JSON object.
     * @returns jsonObject
     * @example
     *
     * ```ts
     * // {xmin : 100, ymin: 10, xmax: 120, ymax:20}
     * var json = extent.toJSON();
     * ```
     */
    toJSON(): JsonExtent {
        return {
            'xmin': this['xmin'],
            'ymin': this['ymin'],
            'xmax': this['xmax'],
            'ymax': this['ymax']
        };
    }

    /**
     * 获取extent矩形区域的坐标数组，包含5个坐标，第一个坐标与最后一个坐标相等。
     * @english
     * Get a coordinate array of extent's rectangle area, containing 5 coordinates in which the first equals with the last.
     * @returns coordinates array
     */
    toArray(out?: Position[]) {
        const xmin = this['xmin'],
            ymin = this['ymin'],
            xmax = this['xmax'],
            ymax = this['ymax'];
        if (!out) {
            return [
                new this._clazz([xmin, ymax]), new this._clazz([xmax, ymax]),
                new this._clazz([xmax, ymin]), new this._clazz([xmin, ymin]),
                new this._clazz([xmin, ymax])
            ];
        } else {
            out[0].x = xmin;
            out[0].y = ymax;

            out[1].x = xmax;
            out[1].y = ymax;

            out[2].x = xmax;
            out[2].y = ymin;

            out[3].x = xmin;
            out[3].y = ymin;

            out[4].x = xmin;
            out[4].y = ymax;
            return out;
        }
    }

    /**
     * 获取 extent 的 xmin、ymin、xmax、ymax 组成的字符串
     *
     * @english
     *
     * Get the string consisting of xmin, ymin, xmax, and ymax of extent
     */
    toString(): string {
        return `${this.xmin},${this.ymin},${this.xmax},${this.ymax}`;
    }

    /**
     * 复制 extent
     *
     * @english
     *
     * Get a copy of the extent.
     * @returns copy
     */
    copy() {
        return new (this.constructor as Constructable<Extent | PointExtent>)(this['xmin'], this['ymin'], this['xmax'], this['ymax'], this.projection);
    }

    /**
     * 转换到新的 extent
     *
     * @english
     *
     * Convert to a new extent
     * @param fn convert function on each point
     * @param out temp out
     */
    convertTo(fn: (p: Point) => Point, out?: Extent | PointExtent): Extent | PointExtent;
    convertTo(fn: (p: Coordinate) => Coordinate, out?: Extent | PointExtent): Extent | PointExtent;
    convertTo(fn: (p: any) => any, out?: Extent | PointExtent): Extent | PointExtent {
        if (!this.isValid()) {
            return null;
        }
        const e = out || new (this.constructor as Constructable<Extent | PointExtent>)();
        if (out) {
            e.set(null, null, null, null);
        }
        let coord: Position;
        if (this._clazz === Coordinate) {
            coord = TEMP_COORD5;
        } else if (this._clazz === Point) {
            coord = TEMP_POINT0;
        }
        coord.x = this.xmin;
        coord.y = this.ymax;
        e._combine(fn(coord));
        coord.x = this.xmax;
        e._combine(fn(coord));
        coord.y = this.ymin;
        e._combine(fn(coord));
        coord.x = this.xmin;
        e._combine(fn(coord));
        return e;
    }

    /**
     * 计算给定 Extent 的投影范围
     *
     * @english
     *
     * Calculate the projected range of the given Extent
     * @param ext extent
     */
    _project(ext: Extent | PointExtent) {
        if (!ext || !ext.isValid()) {
            if (ext) {
                ext.pxmin = ext.pxmax = ext.pymin = ext.pymax = null;
            }
            return;
        }
        const proj = this.projection;
        if (proj) {
            //FIXME a rare but potential bug:
            //An extent may be projected by multiple projection
            if (ext._dirty) {
                TEMP_COORD6.set(ext.xmax, ext.ymin);
                TEMP_COORD7.set(ext.xmin, ext.ymax);
                MINMAX[0] = TEMP_COORD6;
                MINMAX[1] = TEMP_COORD7;
                const minmax = proj.projectCoords(MINMAX);
                const min = minmax[0],
                    max = minmax[1];
                ext.pxmin = Math.min(min.x, max.x);
                ext.pymin = Math.min(min.y, max.y);
                ext.pxmax = Math.max(min.x, max.x);
                ext.pymax = Math.max(min.y, max.y);
            }
            delete ext._dirty;
        } else {
            ext.pxmin = ext.xmin;
            ext.pxmax = ext.xmax;
            ext.pymin = ext.ymin;
            ext.pymax = ext.ymax;
        }
    }
}

TEMP_EXTENT = new Extent(0, 0, 0, 0);

export default Extent;
