import Coordinate from '../Coordinate'

const common = {
    /**
     * 测量两点之间的距离
     *
     * @english
     * Measure length between coordinate c1 and coordinate c2
     * @param c1 coordinate
     * @param c2 coordinate
     * @returns length
     */
    measureLength: function (c1: Coordinate, c2: Coordinate): number {
        if (!Array.isArray(c1)) {
            return this.measureLenBetween(c1, c2);
        }
        let len = 0;
        for (let i = 0, l = c1.length; i < l - 1; i++) {
            len += this.measureLenBetween(c1[i], c1[i + 1]);
        }
        return len;
    }
};

export type CommonMeasurer = typeof common;

/**
 * 这提供了用于通用测量器的方法。 它是一个 mixin，不适合直接使用。
 * @english
 * This provides methods used for common measurer. It's a mixin and not meant to be used directly.
 * @mixin Common
 * @group measurer
 * @protected
 */
export default common;
