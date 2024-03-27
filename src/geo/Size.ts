import Point from './Point';
import { isNumber } from '../core/util/common';

/**
 * Represents a size.
 * @category basic types
 */
class Size {

    /**
     * @param {Number} width - width value
     * @param {Number} height - height value
     */
    constructor(width, height) {
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
     * Returns a copy of the size
     * @return {Size} copy
     */
    copy() {
        return new Size(this['width'], this['height']);
    }

    /**
     * Returns the result of addition of another size.
     * @param {Size} size - size to add
     * @return {Size} result
     */
    add(x, y) {
        let w, h;
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
     * Compare with another size to see whether they are equal.
     * @param {Size} size - size to compare
     * @return {Boolean}
     */
    equals(size) {
        return this['width'] === size['width'] && this['height'] === size['height'];
    }

    /**
     * Returns the result of multiplication of the current size by the given number.
     * @param {Number} ratio - ratio to multi
     * @return {Size} result
     */
    multi(ratio) {
        return new Size(this['width'] * ratio, this['height'] * ratio);
    }

    _multi(ratio) {
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
     * Converts the size object to a [Point]{Point}
     * @return {Point} point
     */
    toPoint() {
        return new Point(this['width'], this['height']);
    }

    /**
     * Converts the size object to an array [width, height]
     * @return {Number[]}
     */
    toArray() {
        return [this['width'], this['height']];
    }

    /**
     * Convert the size object to a json object {width : .., height : ..}
     * @return {Object} json
     */
    toJSON() {
        return {
            'width': this['width'],
            'height': this['height']
        };
    }
}

export default Size;
