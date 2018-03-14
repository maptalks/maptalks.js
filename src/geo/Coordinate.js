import { isNumber, forEachCoord } from '../core/util';
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
 */
class Coordinate extends Position {

    /**
     * Convert one or more Coordinate objects to GeoJSON style coordinates
     * @param  {Coordinate|Coordinate[]} coordinates - coordinates to convert
     * @return {Number[]|Number[][]}
     * @example
     * // result is [[100,0], [101,1]]
     * var numCoords = Coordinate.toNumberArrays([new Coordinate(100,0), new Coordinate(101,1)]);
     */
    static toNumberArrays(coordinates) {
        if (!Array.isArray(coordinates)) {
            return [coordinates.x, coordinates.y];
        }
        return forEachCoord(coordinates, function (coord) {
            return [coord.x, coord.y];
        });
    }

    /**
     * Convert one or more GeoJSON style coordiantes to Coordinate objects
     * @param  {Number[]|Number[][]} coordinates - coordinates to convert
     * @return {Coordinate|Coordinate[]}
     * @example
     * var coordinates = Coordinate.toCoordinates([[100,0], [101,1]]);
     */
    static toCoordinates(coordinates) {
        if (isNumber(coordinates[0]) && isNumber(coordinates[1])) {
            return new Coordinate(coordinates);
        }
        const result = [];
        for (let i = 0, len = coordinates.length; i < len; i++) {
            const child = coordinates[i];
            if (Array.isArray(child)) {
                if (isNumber(child[0])) {
                    result.push(new Coordinate(child));
                } else {
                    result.push(Coordinate.toCoordinates(child));
                }
            } else {
                result.push(new Coordinate(child));
            }
        }
        return result;
    }


}

export default Coordinate;
