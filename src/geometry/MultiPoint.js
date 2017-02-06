import MultiGeometry from './MultiGeometry';
import Marker from './Marker';

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
}

MultiPoint.registerJSONType('MultiPoint');

export default MultiPoint;
