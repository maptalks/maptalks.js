Z.PointExtent =
 /**
  * @constructor
  * @param {maptalks.Coordinate} p1 坐标
  * @param {maptalks.Coordinate} p2 坐标
  * @param {maptalks.Coordinate} p3 坐标
  * @param {maptalks.Coordinate} p4 坐标
  * @returns {maptalks.Extent} extent对象
  */
function(p1,p2,p3,p4) {
    this._clazz = Z.Point;
    this._initialize(p1,p2,p3,p4);
};

Z.Util.extend(Z.PointExtent.prototype, Z.Extent.prototype);
