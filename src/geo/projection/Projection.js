/**
 * @namespace
 */
maptalks.projection = {};

/**
 * Common Methods of Projections.
 * @mixin
 * @protected
 * @memberOf maptalks.projection
 * @name Common
 */
maptalks.projection.Common = {
    /**
     * Project a geographical coordinate to a projected coordinate (2d coordinate)
     * @param  {maptalks.Coordinate} p - coordinate to project
     * @return {maptalks.Coordinate}
     * @static
     */
    project:function () {},
    /**
     * Unproject a projected coordinate to a geographical coordinate (2d coordinate)
     * @param  {maptalks.Coordinate} p - coordinate to project
     * @return {maptalks.Coordinate}
     * @static
     */
    unproject:function () {},
    /**
     * Project a group of geographical coordinates to projected coordinates.
     * @param  {maptalks.Coordinate[]|maptalks.Coordinate[][]|maptalks.Coordinate[][][]} coordinates - coordinates to project
     * @return {maptalks.Coordinate[]|maptalks.Coordinate[][]|maptalks.Coordinate[][][]}
     * @static
     */
    projectCoords:function (coordinates) {
        return maptalks.Util.mapArrayRecursively(coordinates, this.project, this);
    },

    /**
     * Unproject a group of projected coordinates to geographical coordinates.
     * @param  {maptalks.Coordinate[]|maptalks.Coordinate[][]|maptalks.Coordinate[][][]} projCoords - projected coordinates to unproject
     * @return {maptalks.Coordinate[]|maptalks.Coordinate[][]|maptalks.Coordinate[][][]}
     * @static
     */
    unprojectCoords:function (projCoords) {
        return maptalks.Util.mapArrayRecursively(projCoords, this.unproject, this);
    }
};
