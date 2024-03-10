/**
 * This provides methods used for event handling. It's a mixin and not meant to be used directly.
 * @mixin Common
 * @memberOf measurer
 * @protected
 */
declare const _default: {
    /**
     * Measure length between coordinate c1 and coordinate c2
     * @param  {coordinate} c1 coordinate
     * @param  {coordinate} c2 coordinate
     * @return {Number}    length
     * @function measurer.Common.measureLength
     */
    measureLength: (c1: any, c2: any) => number;
};
export default _default;
