import { isNumber, isNil } from '../core/util/common';
import { forEachCoord } from '../core/util/util';
import Position from './Position';

export type CoordinateJson = {
    x: number;
    y: number;
    z?: number;
}

export type CoordinateArray = [number, number] | [number, number, number];

export type CoordinateLike = Coordinate | CoordinateJson | CoordinateArray;

/**
 * 坐标 `Coordinate` 的实现，例如一个地理坐标点（经度，纬度）
 *
 * @english
 *
 * Represents a coordinate point <br>
 * e.g. <br>
 * A geographical point (longitude, latitude)
 * @example
 *
 * ```ts
 * const coord = new Coordinate(0, 0);
 * ```
 * @example
 *
 * ```ts
 * const coord = new Coordinate([ 0, 0 ]);
 * ```
 * @example
 *
 * ```ts
 * const coord = new Coordinate({ x : 0, y : 0 });
 * ```
 * @category basic types
 */
class Coordinate extends Position {
    /**
     * 将一个或多个坐标对象转换为GeoJSON风格的坐标。
     *
     * @english
     *
     * Convert one or more Coordinate objects to GeoJSON style coordinates
     * @param coordinates - coordinates to convert
     * @example
     *
     * ```ts
     * // result is [[100,0], [101,1]]
     * const numCoords = Coordinate.toNumberArrays([new Coordinate(100,0), new Coordinate(101,1)]);
     * ```
     */
    static toNumberArrays(coordinates: Coordinate);
    static toNumberArrays(coordinates: Coordinate[]);
    static toNumberArrays(coordinates: Coordinate[][]);
    static toNumberArrays(coordinates: Coordinate[][][]);
    static toNumberArrays(coordinates: Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][]) {
        if (!Array.isArray(coordinates)) {
            return coordinates.toArray();
        }
        return forEachCoord(coordinates, function (coord: Coordinate) {
            return coord.toArray();
        });
    }

    /**
     * 将一个或多个GeoJSON风格的坐标转换为坐标对象。
     *
     * @english
     *
     * Convert one or more GeoJSON style coordiantes to Coordinate objects
     * @param coordinates - coordinates to convert
     * @example
     *
     * ```ts
     * const coordinates = Coordinate.toCoordinates([[100,0], [101,1]]);
     * ```
     */
    static toCoordinates(coordinates: CoordinateArray | CoordinateArray[] | CoordinateArray[][] | Coordinate | Coordinate[] | Coordinate[][]): Coordinate | Coordinate[] | Coordinate[][] {
        if (isNumber(coordinates[0]) && isNumber(coordinates[1])) {
            return new Coordinate(coordinates as CoordinateArray);
        }
        if (coordinates instanceof Coordinate) {
            return coordinates;
        }
        const result: Coordinate[] = [];
        for (let i = 0, len = coordinates.length; i < len; i++) {
            const child = coordinates[i];
            if (Array.isArray(child)) {
                if (isNumber(child[0])) {
                    result.push(new Coordinate(child as CoordinateArray));
                } else {
                    result.push(Coordinate.toCoordinates(child) as Coordinate);
                }
            } else if (child instanceof Coordinate) {
                result.push(child);
            } else {
                result.push(new Coordinate(child as unknown as CoordinateArray));
            }
        }
        return result;
    }

    /**
     * 使用差值与另一个坐标进行比较，判断是否临近
     *
     * @english
     *
     * Compare with another Coordinate with a delta
     * @param p
     * @param delta
     */
    closeTo(p: Coordinate, delta?: number): boolean {
        if (!delta) {
            delta = 0;
        }
        return this.x >= (p.x - delta) && this.x <= (p.x + delta) &&
            this.y >= (p.y - delta) && this.y <= (p.y + delta);
    }

    /**
     * 返回该坐标的经纬度绝对值的坐标对象（不会改变原始数据）
     *
     * @english
     *
     * Return abs value of the coordinate
     * @returns abs Coordinate
     */
    abs() {
        return new Coordinate(Math.abs(this.x), Math.abs(this.y));
    }

    /**
     * 类似于数学中的四舍五入，对坐标的 x 和 y 进行舍入，返回一个新 Coordinate
     *
     * @english
     *
     * Like math.round, rounding the coordinate's xy.
     * @returns rounded coordinate
     */
    round() {
        return new Coordinate(Math.round(this.x), Math.round(this.y));
    }

    /**
     * 对坐标的 x 和 y 向上取整，返回一个新 Coordinate
     *
     * @english
     *
     * Like math.ceil, ceil the coordinate's xy.
     * @returns ceiled coordinate
     */
    ceil() {
        return new Coordinate(Math.ceil(this.x), Math.ceil(this.y));
    }

    /**
     * 对坐标的 x 和 y 向下取整，返回一个新 Coordinate
     *
     * @english
     *
     * Like math.floor, floor the coordinate's xy.
     * @returns floored coordinate
     */
    floor() {
        return new Coordinate(Math.floor(this.x), Math.floor(this.y));
    }

    /**
     * 返回当前坐标的 copy
     *
     * @english
     *
     * Returns a copy of the coordinate
     * @returns copy
     */
    copy() {
        return new Coordinate(this.x, this.y, this.z);
    }

    /**
     * 坐标数字保留指定位数的小数
     *
     * @english
     *
     * Formats coordinate number using fixed-coordinate notation.
     * @param n - The number of digits to appear after the decimal coordinate
     * @returns fixed coordinate
     */
    toFixed(n: number) {
        return new Coordinate(this.x.toFixed(n), this.y.toFixed(n), isNumber(this.z) ? this.z.toFixed(n) : undefined);
    }

    /**
     * 与传入坐标相加，返回一个新 Coordinate
     *
     * @english
     *
     * Returns the result of addition of another coordinate.
     * @param x - coordinate to add
     * @returns result
     */
    add(x: CoordinateLike): Coordinate;

    /**
     * 与传入坐标相加，返回一个新 Coordinate
     *
     * @english
     *
     * Returns the result of addition of another coordinate.
     * @param x - coordinate to add
     * @param y - coordinate to add
     * @returns result
     */
    add(x: number, y: number): Coordinate;

    /**
     * 与传入坐标相加，返回一个新 Coordinate
     *
     * @english
     *
     * Returns the result of addition of another coordinate.
     * @param x - coordinate to add
     * @param y - coordinate to add
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
        return new Coordinate(nx, ny);
    }

    /**
     * 与传入坐标相减，返回一个新 Coordinate。
     *
     * @english
     *
     * Returns the result of subtraction of another coordinate.
     * @param x - coordinate to add
     * @returns result
     */
    sub(x: CoordinateLike): Coordinate;

    /**
     * 与传入坐标相减，返回一个新 Coordinate。
     *
     * @english
     *
     * Returns the result of subtraction of another coordinate.
     * @param x - coordinate to add
     * @param y - coordinate to add
     * @returns result
     */
    sub(x: number, y: number): Coordinate;

    /**
     * 与传入坐标相减，返回一个新 Coordinate。
     *
     * @english
     *
     * Returns the result of subtraction of another coordinate.
     * @param x - coordinate to add
     * @param [y=undefined] - optional, coordinate to add
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
        return new Coordinate(nx, ny);
    }

    /**
     * Returns the result of multiplication of the current coordinate by the given number.
     * @param ratio - ratio to multi
     * @returns result
     */
    multi(ratio: number) {
        return new Coordinate(this.x * ratio, this.y * ratio);
    }

    /**
     * 与另外一个 coordinate 进行比较，以查看它们是否相等
     *
     * @english
     *
     * Compare with another coordinate to see whether they are equal.
     * @param c - coordinate to compare
     */
    equals(c: Coordinate) {
        if (!(c instanceof this.constructor)) {
            return false;
        }
        return this.x === c.x && this.y === c.y && this.z === c.z;
    }
}

export default Coordinate;
