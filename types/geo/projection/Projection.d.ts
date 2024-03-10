/**
 * Common Methods of Projections.
 * @mixin
 * @protected
 * @memberOf projection
 * @name Common
 */
declare const _default: {
    /**
     * Project a geographical coordinate to a projected coordinate (2d coordinate)
     * @param  {Coordinate} p - coordinate to project
     * @return {Coordinate}
     * @function projection.Common.project
     */
    project(): void;
    /**
     * Unproject a projected coordinate to a geographical coordinate (2d coordinate)
     * @param  {Coordinate} p - coordinate to project
     * @return {Coordinate}
     * @function projection.Common.unproject
     */
    unproject(): void;
    /**
     * Project a group of geographical coordinates to projected coordinates.
     * @param  {Coordinate[]|Coordinate[][]|Coordinate[][][]} coordinates - coordinates to project
     * @return {Coordinate[]|Coordinate[][]|Coordinate[][][]}
     * @function projection.Common.projectCoords
     */
    projectCoords(coordinates: any, antiMeridian: any): any;
    /**
     * Unproject a group of projected coordinates to geographical coordinates.
     * @param  {Coordinate[]|Coordinate[][]|Coordinate[][][]} projCoords - projected coordinates to unproject
     * @return {Coordinate[]|Coordinate[][]|Coordinate[][][]}
     * @function projection.Common.unprojectCoords
     */
    unprojectCoords(projCoords: any): any;
    /**
     * Whether the projection is spherical
     * @return {Boolean}
     */
    isSphere(): boolean;
    /**
     * If the projected coord out of the sphere
     * @param  {Coordinate}  pcoord projected coord
     * @return {Boolean}
     */
    isOutSphere(pcoord: any): boolean;
    /**
     * Wrap the projected coord in the sphere
     * @param  {Coordinate} pcoord projected coord
     * @return {Coordinate} wrapped projected coord
     */
    wrapCoord(pcoord: any): any;
    getCircum(): any;
    getSphereExtent(): any;
};
export default /** @lends projection.Common */ _default;
