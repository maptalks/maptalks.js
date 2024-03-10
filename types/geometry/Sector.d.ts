import Coordinate from './../geo/Coordinate';
import Circle, { CirlceOptionsType } from './Circle';
export type SectorOptionsType = CirlceOptionsType & {
    'numberOfShellPoints'?: number;
};
/**
 * @classdesc
 * Represents a sector Geometry.
 * @category geometry
 * @extends Circle
 * @example
 * var sector = new Sector([100, 0], 1000, 30, 120, {
 *     id : 'sector0'
 * });
 */
declare class Sector extends Circle {
    startAngle: number;
    endAngle: number;
    static fromJSON(json: any): Sector;
    /**
     * @param {Coordinate} center - center of the sector
     * @param {Number} radius           - radius of the sector, in meter
     * @param {Number} startAngle       - start angle of the sector, in degree
     * @param {Number} endAngle         - end angle of the sector, in degree
     * @param {Object} [options=null]   - construct options defined in [Sector]{@link Sector#options}
     */
    constructor(coordinates: any, radius: number, startAngle: number, endAngle: number, opts: SectorOptionsType);
    /**
     * Get the sector's start angle
     * @return {Number}
     */
    getStartAngle(): number;
    /**
     * Set a new start angle to the sector
     * @param {Number} startAngle
     * @return {Sector} this
     * @fires Sector#shapechange
     */
    setStartAngle(startAngle: number): this;
    /**
     * Get the sector's end angle
     * @return {Number}
     */
    getEndAngle(): number;
    /**
     * Set a new end angle to the sector
     * @param {Number} endAngle
     * @return {Sector} this
     * @fires Sector#shapechange
     */
    setEndAngle(endAngle: number): this;
    /**
     * Gets the shell of the sector as a polygon, number of the shell points is decided by [options.numberOfShellPoints]{@link Sector#options}
     * @return {Coordinate[]} - shell coordinates
     */
    getShell(): Array<Coordinate>;
    _containsPoint(point: any, tolerance: any): boolean;
    _computeGeodesicLength(): number;
    _computeGeodesicArea(): number;
    _toJSON(options: any): {
        feature: object;
        subType: string;
        coordinates: number[];
        radius: number;
        startAngle: number;
        endAngle: number;
    };
}
export default Sector;
