import { isNil, isNumber } from '../core/util';

type NumberAble = number | string

export type PositionJson = {
    x: NumberAble;
    y: NumberAble;
    z?: NumberAble;
}

export type PositionArray = [NumberAble, NumberAble] | [NumberAble, NumberAble, NumberAble];

export type PositionLike = Position | PositionJson | PositionArray;

export interface Constructable<T> {
    new(x: PositionLike): T;
    new(x: [NumberAble, NumberAble] | [NumberAble, NumberAble, NumberAble]): T;
    new(x: NumberAble, y: NumberAble, z?: NumberAble): T;
}

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
    constructor(x: PositionArray)
    constructor(x: NumberAble, y: NumberAble, z?: NumberAble)
    constructor(x: any, y?: any, z?: number) {
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
     * Set point or coordinate's x, y value
     * @param x x value
     * @param y y value
     * @param z z value
     */
    set(x: number, y: number, z?: number) {
        this.x = x;
        this.y = y;
        this.z = z || 0;
        return this;
    }

    /**
     * Return abs value of the point
     * @returns abs point
     */
    abs() {
        return new (this.constructor as Constructable<Position>)(Math.abs(this.x), Math.abs(this.y));
    }

    //destructive abs
    _abs() {
        this.x = Math.abs(this.x);
        this.y = Math.abs(this.y);
        return this;
    }

    _round() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    }

    /**
     * Like math.round, rounding the point's xy.
     * @returns rounded point
     */
    round() {
        return new (this.constructor as Constructable<Position>)(Math.round(this.x), Math.round(this.y));
    }

    _ceil() {
        this.x = Math.ceil(this.x);
        this.y = Math.ceil(this.y);
        return this;
    }

    ceil() {
        return new (this.constructor as Constructable<Position>)(Math.ceil(this.x), Math.ceil(this.y));
    }

    /**
     * Returns the distance between the current and the given point.
     * @param  {Coordinate|Point} point - another point
     * @return {Number} distance
     */
    distanceTo(point) {
        const x = point.x - this.x,
            y = point.y - this.y;
        return Math.sqrt(x * x + y * y);
    }

    /**
     * Return the magnitude of this point: this is the Euclidean
     * distance from the 0, 0 coordinate to this point's x and y
     * coordinates.
     * @return {Number} magnitude
     */
    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    _floor() {
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
        return this;
    }

    floor() {
        return new (this.constructor as Constructable<Position>)(Math.floor(this.x), Math.floor(this.y));
    }

    /**
     * Returns a copy of the coordinate
     * @returns copy
     */
    copy() {
        return new (this.constructor as Constructable<Position>)(this.x, this.y, this.z);
    }

    //destructive add
    _add(x, y) {
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

    /**
     * Returns the result of addition of another coordinate.
     * @param {Coordinate|Point|Array|Number} x - coordinate to add
     * @param {Number} [y=undefined] - optional, coordinate to add
     * @returns result
     */
    add(x, y?: number) {
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
        return new (this.constructor as Constructable<Position>)(nx, ny);
    }

    //destructive substract
    _sub(x, y?: number) {
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

    _substract(...args) {
        return this._sub.call(this, ...args);
    }

    /**
     * Returns the result of subtraction of another coordinate.
     * @param {Coordinate|Point|Array|Number} x - coordinate to add
     * @param {Number} [y=undefined] - optional, coordinate to add
     * @returns result
     */
    sub(x, y?: any): any {
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
        return new (this.constructor as Constructable<Position>)(nx, ny);
    }

    /**
     * Alias for sub
     * @returns result
     * @param args
     */
    substract(...args: any[]) {
        return this.sub.call(this, ...args);
    }

    /**
     * Returns the result of multiplication of the current coordinate by the given number.
     * @param ratio - ratio to multi
     * @returns result
     */
    multi(ratio: number) {
        return new (this.constructor as Constructable<Position>)(this.x * ratio, this.y * ratio);
    }

    _multi(ratio: number) {
        this.x *= ratio;
        this.y *= ratio;
        return this;
    }

    /**
     * 返回当前坐标除以给定数字。
     * @english
     * Returns the result of division of the current point by the given number.
     * @param n number to div
     * @returns result
     */
    div(n: number) {
        return this.multi(1 / n);
    }

    /**
     * div by the given number
     * @private
     * @param n
     */
    _div(n: number) {
        return this._multi(1 / n);
    }

    /**
     * 与另外一个坐标进行比较，以查看它们是否相等。
     * @english
     * Compare with another coordinate to see whether they are equal.
     * @param c coordinate to compare
     */
    equals(c: Position) {
        if (!(c instanceof this.constructor)) {
            return false;
        }
        return this.x === c.x && this.y === c.y && this.z === c.z;
    }

    /**
     * `Coordinate` / `Point`是否是 `NaN`
     * @english
     * Whether the coordinate is NaN
     * @returns
     * @private
     */
    _isNaN() {
        return isNaN(this.x) || isNaN(this.y) || isNumber(this.z) && isNaN(this.z);
    }

    /**
     * `Coordinate` / `Point`是否为零
     * @english
     * Whether the coordinate/point is zero
     */
    isZero() {
        return this.x === 0 && this.y === 0;
    }

    /**
     * 转换为数组形式
     * @english
     * Convert to a number array [x, y]
     * @returns number array
     */
    toArray(): PositionArray {
        if (isNumber(this.z)) {
            return [this.x, this.y, this.z];
        }
        return [this.x, this.y];
    }

    /**
     * 坐标数字保留指定位数的小数
     * @english
     * Formats coordinate number using fixed-point notation.
     * @param n The number of digits to appear after the decimal point
     * @returns fixed coordinate
     */
    toFixed<T extends Position>(n: number) {
        return new (this.constructor as Constructable<T>)(this.x.toFixed(n), this.y.toFixed(n), isNumber(this.z) ? this.z.toFixed(n) : undefined);
    }

    /**
     * 转换到 json 对象
     *
     * @english
     * Convert to a json object {x : .., y : ..}
     * @returns json
     */
    toJSON(): PositionJson {
        const json = {
            x: this.x,
            y: this.y
        } as PositionJson;
        if (isNumber(this.z)) {
            json.z = this.z;
        }
        return json;
    }
}

export default Position;
