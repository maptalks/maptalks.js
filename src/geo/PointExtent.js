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
maptalks.PointExtent = function (p1, p2, p3, p4) {
    this._clazz = maptalks.Point;
    this._initialize(p1, p2, p3, p4);
};

maptalks.Util.extend(maptalks.PointExtent.prototype, maptalks.Extent.prototype, /** @lends maptalks.PointExtent.prototype */{
    /**
     * Get size of the PointExtent
     * @return {maptalks.Size}
     */
    getSize:function () {
        return new maptalks.Size(this.getWidth(), this.getHeight());
    }
});
