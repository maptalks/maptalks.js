import { mapArrayRecursively } from 'core/util';

/**
 * Common Methods of Projections.
 * @mixin
 * @protected
 * @memberOf projection
 * @name Common
 */
export default {
    /**
     * Project a geographical coordinate to a projected coordinate (2d coordinate)
     * @param  {Coordinate} p - coordinate to project
     * @return {Coordinate}
     * @static
     */
    project() {},
    /**
     * Unproject a projected coordinate to a geographical coordinate (2d coordinate)
     * @param  {Coordinate} p - coordinate to project
     * @return {Coordinate}
     * @static
     */
    unproject() {},
    /**
     * Project a group of geographical coordinates to projected coordinates.
     * @param  {Coordinate[]|Coordinate[][]|Coordinate[][][]} coordinates - coordinates to project
     * @return {Coordinate[]|Coordinate[][]|Coordinate[][][]}
     * @static
     */
    projectCoords(coordinates) {
        return mapArrayRecursively(coordinates, this.project, this);
    },

    /**
     * Unproject a group of projected coordinates to geographical coordinates.
     * @param  {Coordinate[]|Coordinate[][]|Coordinate[][][]} projCoords - projected coordinates to unproject
     * @return {Coordinate[]|Coordinate[][]|Coordinate[][][]}
     * @static
     */
    unprojectCoords(projCoords) {
        return mapArrayRecursively(projCoords, this.unproject, this);
    }
};
