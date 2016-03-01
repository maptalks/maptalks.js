/**
 * Transformation between projected coordinates and base 2d point system.
 * @class
 * @protected
 * @classdesc
 * A core class used internally for mapping map's (usually geographical) coordinates to 2d points to view stuffs on a map.<br>
 * The base 2d point system is a fixed system that is consistent with HTML coordinate system: on X-Axis, left is smaller and right is larger; on Y-Axis, top is smaller and bottom is larger. <br>
 * As map's coordinates may not be in the same order(e.g. on a mercator projected earth, top is larger and bottom is smaller), <br>
 * transformation provides mapping functions to map arbitrary coordinates system to the fixed 2d point system. <br>
 * How to transform is decided by the constructor parameters which is a 4 number array [a, b, c, d]:<br>
 * a : the order scale of X-axis values 1 means right is larger and -1 means the reverse, left is larger;<br>
*  b : the order scale of Y-axis values 1 means bottom is larger and -1 means the reverse, top is larger;<br>
*  c : x of the origin point of the projected coordinate system <br>
*  d : y of the origin point of the projected coordinate system <br>
*  <br>
*  e.g.: Transformation parameters for Google map: [1, -1, -20037508.34, 20037508.34] <br>
*  <br>
*  Parameter scale in transform/untransform method is used to scale the result 2d points on map's different zoom levels.
*/
Z.Transformation = function(matrix) {
    this.matrix = matrix;
};

Z.Util.extend(Z.Transformation.prototype,  /** @lends maptalks.Transformation.prototype */{

    /**
     * Transform a projected coordinate to a 2d point.
     * @param  {Number[]|maptalks.Coordinate} coordinates - projected coordinate to transform
     * @param  {Number} scale                              - transform scale
     * @return {maptalks.Point} 2d point.
     */
    transform : function(coordinates, scale) {
        var matrix = this.matrix;
        var x,y;
        if (Z.Util.isArray(coordinates)) {
            x = coordinates[0];
            y = coordinates[1];
        } else {
            x = coordinates.x;
            y = coordinates.y;
        }
        var px = matrix[0]*(x-matrix[2])/scale;
        var py = matrix[1]*(y-matrix[3])/scale;
        return new Z.Point(px,py);
    },

    /**
     * Transform a 2d point to a projected coordinate.
     * @param  {maptalks.Point} point   - 2d point
     * @param  {Number} scale           - transform scale
     * @return {maptalks.Coordinate}  projected coordinate.
     */
    untransform : function(point, scale) {
        var matrix = this.matrix;
        var x,y;
        x = point.x;
        y = point.y;
        //inverse matrix
        var cx = (x*scale/matrix[0]+matrix[2]);
        var cy = (y*scale/matrix[1]+matrix[3]);
        return new Z.Coordinate(cx,cy);
    }
});
