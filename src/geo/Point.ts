import { isNil, isNumber } from '../core/util/common';

import Position from './Position';

export type PointJson = {
    x: number;
    y: number;
    z?: number;
}

export type PointArray = [number, number] | [number, number, number];

export type PointLike = Point | PointJson | PointArray;

/**
 * 2D 点实现
 * @english
 * Represents a 2d point.<br>
 * Can be created in serveral ways:
 *
 * @example
 *
 * ```ts
 *
 * var point = new Point(1000, 1000);
 *
 * var point = new Point([1000, 1000]);
 *
 * var point = new Point({ x:1000, y:1000 });
 * ```
 *
 * @category basic types
 */
class Point extends Position {
    /**
     * 使用差值与另一个点进行比较，判断是否临近
     *
     * @english
     *
     * Compare with another point with a delta
     * @param p
     * @param delta
     */
    closeTo(p: Point, delta?: number): boolean {
        if (!delta) {
            delta = 0;
        }
        return this.x >= (p.x - delta) && this.x <= (p.x + delta) &&
            this.y >= (p.y - delta) && this.y <= (p.y + delta);
    }

    /**
     * 计算对应的单位向量
     * 这意味着计算点到[0, 0]坐标的距离将等于1，并且从计算点到[0, 0]坐标的角度与之前相同
     * @english
     *
     * Calculate this point but as a unit vector from 0, 0, meaning
     * that the distance from the resulting point to the 0, 0
     * coordinate will be equal to 1 and the angle from the resulting
     * point to the 0, 0 coordinate will be the same as before.
     * @returns unit vector point
     */
    unit() {
        return this.copy()._unit();
    }

    _unit(): this {
        this._div(this.mag());
        return this;
    }

    /**
     * 计算一个垂直点，其中新的y坐标是旧的x坐标，而新的x坐标是旧的y坐标乘以-1。
     *
     * @english
     *
     * Compute a perpendicular point, where the new y coordinate
     * is the old x coordinate and the new x coordinate is the old y
     * coordinate multiplied by -1
     * @returns perpendicular point
     */
    perp() {
        return this.copy()._perp();
    }

    _perp() {
        [this.x, this.y] = [-this.y, this.x]
        return this;
    }

    /**
     * 获取这个点与另一个点之间的角度，单位为弧度
     *
     * @english
     *
     * Get the angle between this point and another point, in radians
     * from mapbox/point-geometry
     * @param b - the other point
     * @returns angle
     */
    angleWith(b: Point): number {
        return this.angleWithSep(b.x, b.y);
    }

    /**
     * 找到两个向量之间的角度
     *
     * @english
     *
     * Find the angle of the two vectors, solving the formula for
     * the cross product a x b = |a||b|sin(θ) for θ.
     * from mapbox/point-geometry
     *
     * @param x the x-coordinate
     * @param y the y-coordinate
     * @returns the angle in radians
     */
    angleWithSep(x: number, y: number) {
        return Math.atan2(
            this.x * y - this.y * x,
            this.x * x + this.y * y);
    }

    _rotate(angle: number) {
        const cos = Math.cos(angle),
            sin = Math.sin(angle),
            x = cos * this.x - sin * this.y,
            y = sin * this.x + cos * this.y;
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * 围绕0,0原点旋转这个点，旋转角度a以弧度为单位
     *
     * @english
     *
     * Rotate this point around the 0, 0 origin by an angle a,
     * given in radians
     * from mapbox/point-geometry
     *
     * @param a angle to rotate around, in radians
     * @returns output point
     */
    rotate(a: number) {
        return this.copy()._rotate(a);
    }

    /**
     * 返回该点绝对值的 `Point` 对象（不会改变原始数据）
     *
     * @english
     *
     * Return abs value of the point
     * @returns abs point
     */
    abs() {
        return new Point(Math.abs(this.x), Math.abs(this.y));
    }

    /**
     * 类似于数学中的四舍五入，对点的 x 和 y 坐标进行舍入，返回一个新 Point
     *
     * @english
     *
     * Like math.round, rounding the point's xy.
     * @returns rounded point
     */
    round() {
        return new Point(Math.round(this.x), Math.round(this.y));
    }

    /**
     * 对点的 x 和 y 坐标向上取整，返回一个新 Point
     *
     * @english
     *
     * Like math.ceil, ceil the point's xy.
     * @returns ceiled point
     */
    ceil() {
        return new Point(Math.ceil(this.x), Math.ceil(this.y));
    }

    /**
     * 对点的 x 和 y 坐标向下取整，返回一个新 Point
     *
     * @english
     *
     * Like math.floor, floor the point's xy.
     * @returns floored point
     */
    floor() {
        return new Point(Math.floor(this.x), Math.floor(this.y));
    }

    /**
     * 返回当前点的 copy
     *
     * @english
     *
     * Returns a copy of the point
     * @returns copy
     */
    copy() {
        return new Point(this.x, this.y, this.z);
    }

    /**
     * 坐标数字保留指定位数的小数
     *
     * @english
     *
     * Formats point number using fixed-point notation.
     * @param n - The number of digits to appear after the decimal point
     * @returns fixed point
     */
    toFixed(n: number) {
        return new Point(this.x.toFixed(n), this.y.toFixed(n), isNumber(this.z) ? this.z.toFixed(n) : undefined);
    }

    /**
     * 与传入坐标相加，返回一个新 Point
     *
     * @english
     *
     * Returns the result of addition of another coordinate.
     * @param x - point to add
     * @returns result
     */
    add(x: PointLike): Point;

    /**
     * 与传入坐标相加，返回一个新 Point
     *
     * @english
     *
     * Returns the result of addition of another coordinate.
     * @param x - point to add
     * @param y - point to add
     * @returns result
     */
    add(x: number, y: number): Point;

    /**
     * 与传入坐标相加，返回一个新 Point
     *
     * @english
     *
     * Returns the result of addition of another coordinate.
     * @param x - point to add
     * @param y - point to add
     * @returns result
     */
    add(x: any, y?: number) {
        let nx, ny;
        if (!isNil(x.x)) {
            nx = this.x + x.x;
            ny = this.y + x.y;
        } else if (!isNil(x[0])) {
            nx = this.x + x[0];
            ny = this.y + x[1];
        } else {
            nx = this.x + x;
            ny = this.y + y;
        }
        return new Point(nx, ny);
    }

    /**
     * 与传入坐标相减，返回一个新 Point。
     *
     * @english
     *
     * Returns the result of subtraction of another point.
     * @param x - point to add
     * @returns result
     */
    sub(x: PointLike): Point;

    /**
     * 与传入坐标相减，返回一个新 Point。
     *
     * @english
     *
     * Returns the result of subtraction of another point.
     * @param x - point to add
     * @param y - point to add
     * @returns result
     */
    sub(x: number, y: number): Point;

    /**
     * 与传入坐标相减，返回一个新 Point。
     *
     * @english
     *
     * Returns the result of subtraction of another point.
     * @param x - point to add
     * @param [y=undefined] - optional, point to add
     * @returns result
     */
    sub(x: any, y?: number): any {
        let nx, ny;
        if (!isNil(x.x)) {
            nx = this.x - x.x;
            ny = this.y - x.y;
        } else if (!isNil(x[0])) {
            nx = this.x - x[0];
            ny = this.y - x[1];
        } else {
            nx = this.x - x;
            ny = this.y - y;
        }
        return new Point(nx, ny);
    }

    /**
     * Returns the result of multiplication of the current coordinate by the given number.
     * @param ratio - ratio to multi
     * @returns result
     */
    multi(ratio: number) {
        return new Point(this.x * ratio, this.y * ratio);
    }

    /**
     * 与另外一个 point 进行比较，以查看它们是否相等
     *
     * @english
     *
     * Compare with another point to see whether they are equal.
     * @param c - point to compare
     */
    equals(c: Point) {
        if (!(c instanceof this.constructor)) {
            return false;
        }
        return this.x === c.x && this.y === c.y && this.z === c.z;
    }
}

export default Point;
