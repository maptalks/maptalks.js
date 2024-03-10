import Position from './Position';
/**
 * Represents a coordinate point <br>
 * e.g. <br>
 * A geographical point (longitude, latitude)
 * @example
 * var coord = new Coordinate(0, 0);
 * @example
 * var coord = new Coordinate([ 0, 0 ]);
 * @example
 * var coord = new Coordinate({ x : 0, y : 0 });
 * @category basic types
 * @extends Position
 */
declare class Coordinate extends Position {
    /**
     * Convert one or more Coordinate objects to GeoJSON style coordinates
     * @param  {Coordinate|Coordinate[]} coordinates - coordinates to convert
     * @return {Number[]|Number[][]}
     * @example
     * // result is [[100,0], [101,1]]
     * var numCoords = Coordinate.toNumberArrays([new Coordinate(100,0), new Coordinate(101,1)]);
     */
    static toNumberArrays(coordinates: any): any;
    /**
     * Convert one or more GeoJSON style coordiantes to Coordinate objects
     * @param  {Number[]|Number[][]} coordinates - coordinates to convert
     * @return {Coordinate|Coordinate[]}
     * @example
     * var coordinates = Coordinate.toCoordinates([[100,0], [101,1]]);
     */
    static toCoordinates(coordinates: any): any[] | Coordinate;
}
export default Coordinate;
