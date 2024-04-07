import { isNil, isNumber } from '../core/util/common';
import type Point from './Point';
import type { PointArray, PointJson } from './Point';
import type Coordinate from './Coordinate';
import type { CoordinateArray, CoordinateJson } from './Coordinate';
import type { WithUndef } from '../types/typings';

type NumberAble = number | string

export type PositionJson<T> = {
    x: T;
    y: T;
    z?: T;
}

export type PositionArray<T> = [T, T] | [T, T, T];

export type PositionLike = Point | Coordinate | PositionJson<NumberAble> | PointJson | CoordinateJson;

/**
 * `Point` 和 `Coordinate` 的抽象类
 * @english
 *
 * Abstract parent class for Point and Coordinate
 * @category basic types
 */
abstract class Position {
    public x: number;
    public y: number;
    public z: WithUndef<number>;

    constructor(x: PositionLike)
    constructor(x: PositionArray<NumberAble>)
    constructor(x: PointArray)
    constructor(x: CoordinateArray)
    constructor(x: NumberAble, y: NumberAble, z?: NumberAble)
    constructor(x: any, y?: NumberAble, z?: number) {
        if (!isNil(x) && !isNil(y)) {
            /**
             * @property x {Number} - x value
             */
            this.x = +(x);
            /**
             * @property y {Number} - y value
             */
            this.y = +(y);
            /**
             * @property z {Number} - z value, it's a pure property and doesn't take part in caculation for now.
             */
            this.z = z;
        } else if (!isNil(x.x) && !isNil(x.y)) {
            this.x = +(x.x);
            this.y = +(x.y);
            this.z = x.z;
        } else if (Array.isArray(x)) {
            this.x = +(x[0]);
            this.y = +(x[1]);
            this.z = x[2];
        }
        if (this._isNaN()) {
            throw new Error('Position is NaN');
        }
    }

    /**
     * 设置点或坐标的 x、y 值
     *
     * @english
     *
     * Set point or coordinate's x, y value
     * @param x - x value
     * @param y - y value
     * @param z - z value
     */
    set(x: number, y: number, z?: number) {
        this.x = x;
        this.y = y;
        this.z = z || 0;
        return this;
    }

    abstract abs(): Point | Coordinate;

    /**
     * 修改原数据的绝对值
     *
     * @english
     * destructive abs
     */
    _abs() {
        this.x = Math.abs(this.x);
        this.y = Math.abs(this.y);
        return this;
    }

    /**
     * 对原数据的 x 和 y 四舍五入
     *
     * @english
     * destructive round
     */
    _round() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    }

    abstract round(): Point | Coordinate;

    /**
     * 对原数据的 x 和 y 进行向上取整
     *
     * @english
     * destructive ceil
     */
    _ceil() {
        this.x = Math.ceil(this.x);
        this.y = Math.ceil(this.y);
        return this;
    }

    abstract ceil(): Point | Coordinate;

    /**
     * 返回当前点与给定点之间的距离
     *
     * @english
     *
     * Returns the distance between the current and the given point.
     * @param  point - another point
     * @returns distance
     */
    distanceTo(point: Point | Coordinate): number {
        const x = point.x - this.x,
            y = point.y - this.y;
        return Math.sqrt(x * x + y * y);
    }

    /**
     * 返回该点的大小：这是从 0,0 坐标到该点的 x 和 y 坐标的欧几里得距离
     *
     * @english
     *
     * Return the magnitude of this point: this is the Euclidean
     * distance from the 0, 0 coordinate to this point's x and y
     * coordinates.
     * @returns magnitude
     */
    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * 对原数据的 x 和 y 进行向下取整
     *
     * @english
     * destructive floor
     */
    _floor() {
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
        return this;
    }

    abstract floor(): Point | Coordinate;

    abstract copy(): Point | Coordinate;

    _add(x: PositionLike): this;
    _add(x: number, y: number): this;

    /**
     * 对原数据的 x 和 y 与传入坐标相加
     *
     * @english
     *
     * destructive add
     *
     * @param x
     * @param y
     */
    _add(x: any, y?: number) {
        if (!isNil(x.x)) {
            this.x += x.x;
            this.y += x.y;
        } else if (!isNil(x[0])) {
            this.x += x[0];
            this.y += x[1];
        } else {
            this.x += x;
            this.y += y;
        }
        return this;
    }

    abstract add(x: any, y?: number): Point | Coordinate;

    _sub(x: PositionLike): this;
    _sub(x: number, y: number): this;
    /**
     * 对原数据的 x 和 y 与传入坐标相减
     *
     * @english
     *
     * destructive substract
     *
     * @param x
     * @param y
     */
    _sub(x: any, y?: number) {
        if (!isNil(x.x)) {
            this.x -= x.x;
            this.y -= x.y;
        } else if (!isNil(x[0])) {
            this.x -= x[0];
            this.y -= x[1];
        } else {
            this.x -= x;
            this.y -= y;
        }
        return this;
    }

    /**
     * `_sub` 方法的别名
     *
     * @english
     *
     * Alias for _sub
     *
     * @param x
     * @param y
     */
    _substract(x: PositionLike | number, y?: number) {
        if (isNumber(y)) {
            return this._sub(x as number, y);
        }

        return this._sub(x as PositionLike);
    }

    abstract sub(x: any, y?: number): Point | Coordinate;

    /**
     * `sub` 方法的别名。
     *
     * @english
     *
     * Alias for sub
     * @returns result
     * @param x
     * @param y
     */
    substract(x: PositionLike | number, y?: number) {
        return this.sub(x, y);
    }

    abstract multi(ratio: number): Point | Coordinate;

    _multi(ratio: number) {
        this.x *= ratio;
        this.y *= ratio;
        return this;
    }

    /**
     * 返回当前坐标除以给定数字
     *
     * @english
     *
     * Returns the result of division of the current point by the given number.
     * @param n - number to div
     * @returns result
     */
    div(n: number) {
        return this.multi(1 / n);
    }

    /**
     * 除以给定的数字
     *
     * @english
     *
     * div by the given number
     * @param n
     */
    _div(n: number) {
        return this._multi(1 / n);
    }

    abstract equals(c: Point | Coordinate): boolean;

    /**
     * `Coordinate` / `Point`是否是 `NaN`
     *
     * @english
     *
     * Whether the coordinate is NaN
     * @returns
     */
    _isNaN(): boolean {
        return isNaN(this.x) || isNaN(this.y) || isNumber(this.z) && isNaN(this.z);
    }

    /**
     * `Coordinate` / `Point`是否为零
     *
     * @english
     *
     * Whether the coordinate/point is zero
     */
    isZero(): boolean {
        return this.x === 0 && this.y === 0;
    }

    /**
     * 转换为数组形式
     *
     * @english
     *
     * Convert to a number array [x, y]
     * @returns number array
     */
    toArray(): PositionArray<number> {
        if (isNumber(this.z)) {
            return [this.x, this.y, this.z];
        }
        return [this.x, this.y];
    }

    /**
     * 坐标数字保留指定位数的小数
     *
     * @english
     *
     * Formats coordinate number using fixed-point notation.
     * @param n - The number of digits to appear after the decimal point
     * @returns fixed coordinate
     */
    abstract toFixed(n: number): Point | Coordinate;

    /**
     * 转换到 json 对象
     *
     * @english
     * Convert to a json object {x : .., y : ..}
     * @returns json
     */
    toJSON(): PositionJson<number> {
        const json = {
            x: this.x,
            y: this.y
        } as PositionJson<number>;
        if (isNumber(this.z)) {
            json.z = this.z;
        }
        return json;
    }
}

export default Position;
