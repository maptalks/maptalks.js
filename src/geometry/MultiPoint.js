import MultiGeometry from './MultiGeometry';
import Marker from './Marker';

/**
 * @classdesc
 * Represents a Geometry type of MultiPoint.
 * @class
 * @category geometry
 * @extends MultiGeometry
 * @param {Number[][]|Coordinate[]|Marker[]} data - construct data, coordinates or a array of markers
 * @param {Object} [options=null] - options defined in [nMultiPoint]{@link MultiPoint#options}
 * @example
 * var multiPoint = new MultiPoint(
 *     [
 *         [121.5080881906138, 31.241128104458117],
 *         [121.50804527526954, 31.237238340103413],
 *         [121.5103728890997, 31.23888972560888]
 *     ]
 * ).addTo(layer);
 */
export default class MultiPoint extends MultiGeometry {

    constructor(data, opts) {
        super(Marker, 'MultiPoint', data, opts);
    }
}

MultiPoint.registerAs('MultiPoint');
