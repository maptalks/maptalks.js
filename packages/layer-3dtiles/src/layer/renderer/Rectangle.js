import { equalsEpsilon } from '../../common/Math';
const EPSILON14 = 0.00000000000001;
const TWO_PI = 2.0 * Math.PI;

export default class Rectangle {
    constructor(west, south, east, north) {
        this.west = west;
        this.south = south;
        this.east = east;
        this.north = north;
    }

    static contains(rectangle, cartographic) {

        let longitude = cartographic[0];
        const latitude = cartographic[1];

        const west = rectangle.west;
        let east = rectangle.east;

        if (east < west) {
            east += TWO_PI;
            if (longitude < 0.0) {
                longitude += TWO_PI;
            }
        }
        return (
            (longitude > west ||
            equalsEpsilon(longitude, west, EPSILON14)) &&
        (longitude < east ||
            equalsEpsilon(longitude, east, EPSILON14)) &&
        latitude >= rectangle.south &&
        latitude <= rectangle.north
        );
    }


    static southwest(rectangle, result) {
        result[0] = rectangle.west;
        result[1] = rectangle.south;
        result[2] = 0;
        return result;
    }

    static northeast(rectangle, result) {
        result[0] = rectangle.east;
        result[1] = rectangle.north;
        result[2] = 0;
        return result;
    }

    static southeast(rectangle, result) {
        result[0] = rectangle.east;
        result[1] = rectangle.south;
        result[2] = 0;
        return result;
    }

    static northwest(rectangle, result) {
        result[0] = rectangle.west;
        result[1] = rectangle.north;
        result[2] = 0;
        return result;
    }
}
