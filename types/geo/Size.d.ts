import Point from './Point';
/**
 * Represents a size.
 * @category basic types
 */
declare class Size {
    width: number;
    height: number;
    /**
     * @param {Number} width - width value
     * @param {Number} height - height value
     */
    constructor(width: number | Array<number> | Size, height?: number);
    /**
     * Returns a copy of the size
     * @return {Size} copy
     */
    copy(): Size;
    /**
     * Returns the result of addition of another size.
     * @param {Size} size - size to add
     * @return {Size} result
     */
    add(x: any, y: any): Size;
    /**
     * Compare with another size to see whether they are equal.
     * @param {Size} size - size to compare
     * @return {Boolean}
     */
    equals(size: any): boolean;
    /**
     * Returns the result of multiplication of the current size by the given number.
     * @param {Number} ratio - ratio to multi
     * @return {Size} result
     */
    multi(ratio: any): Size;
    _multi(ratio: any): this;
    _round(): this;
    /**
     * Converts the size object to a [Point]{Point}
     * @return {Point} point
     */
    toPoint(): Point;
    /**
     * Converts the size object to an array [width, height]
     * @return {Number[]}
     */
    toArray(): number[];
    /**
     * Convert the size object to a json object {width : .., height : ..}
     * @return {Object} json
     */
    toJSON(): {
        width: number;
        height: number;
    };
}
export default Size;
