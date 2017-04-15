/**
 * This provides methods used for event handling. It's a mixin and not meant to be used directly.
 * @mixin Common
 * @memberOf measurer
 * @protected
 */
export default {
    /**
     * Measure length between coordinate c1 and coordinate c2
     * @param  {coordinate} c1 coordinate
     * @param  {coordinate} c2 coordinate
     * @return {Number}    length
     * @function measurer.Common.measureLength
     */
    measureLength: function (c1, c2) {
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
