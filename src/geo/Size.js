/**
 * Represents a size.
 * @class
 * @category basic types
 * @param {Number} width - width value
 * @param {Number} height - height value
 */
Z.Size=function(width,height) {
    /**
     * @property {Number} width - width
     */
    this.width=width;
    /**
     * @property {Number} height - height
     */
    this.height=height;
};

Z.Util.extend(Z.Size.prototype,/** @lends maptalks.Size.prototype */{
    /**
     * Returns a copy of the size
     * @return {maptalks.Size} copy
     */
    copy:function() {
        return new Z.Size(this['width'], this['height']);
    },
    /**
     * Returns the result of addition of another size.
     * @param {maptalks.Size} size - size to add
     * @return {maptalks.Size} result
     */
    add:function(size) {
        return new Z.Size(this['width']+size['width'], this['height']+size['height']);
    },
    /**
     * Compare with another size to see whether they are equal.
     * @param {maptalks.Size} size - size to compare
     * @return {Boolean}
     */
    equals:function(size) {
        return this['width'] === size['width'] && this['height'] === size['height'];
    },
    /**
     * Returns the result of multiplication of the current size by the given number.
     * @param {Number} ratio - ratio to multi
     * @return {maptalks.Size} result
     */
    multi:function(ratio) {
        return new Z.Size(this['width']*ratio, this['height']*ratio);
    },
    _multi:function(ratio) {
        this['width'] *= ratio;
        this['height'] *= ratio;
        return this;
    },
    _round:function() {
        this['width'] = Z.Util.round(this['width']);
        this['height'] = Z.Util.round(this['height']);
        return this;
    }
});
