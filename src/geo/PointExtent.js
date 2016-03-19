/**
 * Represent a bounding box on 2d surface , a rectangular area with minimum and maximum points. <br>
 * There are serveral ways to create a PointExtent:
 * @class
 * @category basic types
 * @param {Number} x1   - x of point 1
 * @param {Number} y1   - y of point 1
 * @param {Number} x2   - x of point 2
 * @param {Number} y2   - y of point 2
 * @extends {maptalks.Extent}
 * @example
 * //with 4 numbers
 * var extent = new maptalks.PointExtent(100, 10, 120, 20);
 * @example
 * //with 2 points
 * var extent = new maptalks.PointExtent(new maptalks.Point(100, 10), new maptalks.Point(120, 20));
 * @example
 * //with a json object containing xmin, ymin, xmax and ymax
 * var extent = new maptalks.PointExtent({xmin : 100, ymin: 10, xmax: 120, ymax:20});
 * @example
 * var extent1 = new maptalks.PointExtent(100, 10, 120, 20);
 * //with another extent
 * var extent2 = new maptalks.PointExtent(extent1);
 */
Z.PointExtent = function(p1,p2,p3,p4) {
    this._clazz = Z.Point;
    this._initialize(p1,p2,p3,p4);
};

Z.Util.extend(Z.PointExtent.prototype, Z.Extent.prototype, /** @lends maptalks.PointExtent.prototype */{
    /**
     * Get size of the PointExtent
     * @return {maptalks.Size}
     */
    getSize:function() {
        return new Z.Size(this.getWidth(), this.getHeight());
    },

    /**
     * Get the width of the PointExtent
     * @return {Number}
     */
    getWidth:function() {
        return this['xmax'] - this['xmin'];
    },

    /**
     * Get the height of the PointExtent
     * @return {Number}
     */
    getHeight:function() {
        return this['ymax'] - this['ymin'];
    }
});
