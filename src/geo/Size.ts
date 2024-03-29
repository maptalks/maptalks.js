import Point from './Point';
import { isNumber } from '../core/util';

export type JsonSize = {
    width: number;
    height: number;
}

export type ArraySize = [number, number];

export type SizeLike = Size | JsonSize | ArraySize;

/**
 * 表示一个大小的实现类
 *
 * @english
 * Represents a size.
 * @category basic types
 */
class Size {
    public width: number;
    public height: number;

    /**
     * @param width width value
     */
    constructor(width: SizeLike)
    /**
     * @param width width value
     */
    constructor(width: ArraySize)
    /**
     * @param width width value
     * @param height height value
     */
    constructor(width: number, height: number)
    constructor(width: any, height?: any) {
        if (isNumber(width) && isNumber(height)) {
            /**
             * @property {Number} width - width
             */
            this.width = width;
            /**
             * @property {Number} height - height
             */
            this.height = height;
        } else if (isNumber(width['width'])) {
            this.width = width.width;
            this.height = width.height;
        } else if (Array.isArray(width)) {
            this.width = width[0];
            this.height = width[1];
        }
    }

    /**
     * 返回 `Size` 的拷贝
     * @english
     * Returns a copy of the size
     */
    copy() {
        return new Size(this['width'], this['height']);
    }

    /**
     * 返回当前`Size` 与另一个 `Size` 相加的结果
     *
     * @english
     * Returns the result of addition of another size.
     * @param x Size
     * @returns result
     */
    add(x: Size): Size
    /**
     * 返回当前`Size` 与另一个 `Size` 相加的结果
     *
     * @english
     * Returns the result of addition of another size.
     * @param x x value
     * @param y y value
     * @returns result
     */
    add(x: number, y: number): Size
    add(x: any, y?: any) {
        let w: number, h: number;
        if (x instanceof Size) {
            w = this.width + x.width;
            h = this.height + x.height;
        } else {
            w = this.width + x;
            h = this.height + y;
        }
        return new Size(w, h);
    }

    /**
     * 与另一个 `Size` 进行比较，以判断它们是否相等。
     *
     * @english
     * Compare with another size to see whether they are equal.
     * @param size size to compare
     */
    equals(size: Size) {
        return this['width'] === size['width'] && this['height'] === size['height'];
    }

    /**
     *
     * @english
     * Returns the result of multiplication of the current size by the given number.
     * @param ratio ratio to multi
     * @returns result
     */
    multi(ratio: number): Size {
        return new Size(this['width'] * ratio, this['height'] * ratio);
    }

    _multi(ratio: number) {
        this['width'] *= ratio;
        this['height'] *= ratio;
        return this;
    }

    _round() {
        this['width'] = Math.round(this['width']);
        this['height'] = Math.round(this['height']);
        return this;
    }

    /**
     *
     * @english
     * Converts the size object to a {@link Point}
     * @returns point
     */
    toPoint(): Point {
        return new Point(this['width'], this['height']);
    }

    /**
     *
     * @english
     * Converts the size object to an array [width, height]
     */
    toArray() {
        return [this['width'], this['height']];
    }

    /**
     * Convert the size object to a json object {width : ., height : .}
     * @returns json
     */
    toJSON(): JsonSize {
        return {
            'width': this['width'],
            'height': this['height']
        };
    }
}

export default Size;
