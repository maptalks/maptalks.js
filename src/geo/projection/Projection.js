import { mapArrayRecursively } from 'core/util';

/**
 * Common Methods of Projections.
 * @mixin
 * @protected
 * @memberOf projection
 * @name Common
 */
export default /** @lends projection.Common */ {
    /**
     * Project a geographical coordinate to a projected coordinate (2d coordinate)
     * @param  {Coordinate} p - coordinate to project
     * @return {Coordinate}
     * @function projection.Common.project
     */
    project() {},
    /**
     * Unproject a projected coordinate to a geographical coordinate (2d coordinate)
     * @param  {Coordinate} p - coordinate to project
     * @return {Coordinate}
     * @function projection.Common.unproject
     */
    unproject() {},
    /**
     * Project a group of geographical coordinates to projected coordinates.
     * @param  {Coordinate[]|Coordinate[][]|Coordinate[][][]} coordinates - coordinates to project
     * @return {Coordinate[]|Coordinate[][]|Coordinate[][][]}
     * @function projection.Common.projectCoords
     */
    projectCoords(coordinates) {
        if (!coordinates) {
            return [];
        }
        return mapArrayRecursively(coordinates, this.project, this);
    },

    /**
     * Unproject a group of projected coordinates to geographical coordinates.
     * @param  {Coordinate[]|Coordinate[][]|Coordinate[][][]} projCoords - projected coordinates to unproject
     * @return {Coordinate[]|Coordinate[][]|Coordinate[][][]}
     * @function projection.Common.unprojectCoords
     */
    unprojectCoords(projCoords) {
        if (!projCoords) {
            return [];
        }
        return mapArrayRecursively(projCoords, this.unproject, this);
    }
};
