import MultiGeometry from './MultiGeometry';
import Marker from './Marker';

const options = {
    'symbol': {
        'markerType': 'path',
        'markerPath': [{
            'path': 'M8 23l0 0 0 0 0 0 0 0 0 0c-4,-5 -8,-10 -8,-14 0,-5 4,-9 8,-9l0 0 0 0c4,0 8,4 8,9 0,4 -4,9 -8,14z M3,9 a5,5 0,1,0,0,-0.9Z',
            'fill': '#DE3333'
        }],
        'markerPathWidth': 16,
        'markerPathHeight': 23,
        'markerWidth': 24,
        'markerHeight': 34
    }
};
/**
 * @classdesc
 * Represents a Geometry type of MultiPoint.
 * @category geometry
 * @extends MultiGeometry
 * @example
 * var multiPoint = new MultiPoint(
 *     [
 *         [121.5080881906138, 31.241128104458117],
 *         [121.50804527526954, 31.237238340103413],
 *         [121.5103728890997, 31.23888972560888]
 *     ]
 * ).addTo(layer);
 */
class MultiPoint extends MultiGeometry {

    /**
     * @param {Number[][]|Coordinate[]|Marker[]} data - construct data, coordinates or an array of markers
     * @param {Object} [options=null] - options defined in [nMultiPoint]{@link MultiPoint#options}
     */
    constructor(data, opts) {
        super(Marker, 'MultiPoint', data, opts);
    }

    /**
     * Find the closet point to the give coordinate
     * @param {Coordinate} coordinate coordinate
     * @returns {Coordinate} coordinate
     */
    findClosest(coordinate) {
        if (!coordinate) {
            return null;
        }
        const coords = this.getCoordinates();
        let hit = null;
        let max = Infinity;
        coords.forEach(c => {
            const dist = distanceTo(c, coordinate);
            if (dist < max) {
                hit = c;
                max = dist;
            }
        });
        return hit;
    }
}

MultiPoint.mergeOptions(options);
MultiPoint.registerJSONType('MultiPoint');

export default MultiPoint;

function distanceTo(p0, p1) {
    const x = p1.x - p0.x,
        y = p1.y - p0.y;
    return Math.sqrt(x * x + y * y);
}
