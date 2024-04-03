import { extend } from '../../core/util/common';
import Common, { type CommonProjectionType } from './Projection';
import Coordinate from '../Coordinate';
import { WGS84Sphere, type WGS84SphereType } from '../measurer';

const EPSG4326Projection = {
    /**
     * "EPSG:4326", Code of the projection
     * @constant
     */
    code: 'EPSG:4326',
    aliases: ['EPSG:4490'],
    project: function (p: Coordinate, out?: Coordinate): Coordinate {
        if (out) {
            out.x = p.x;
            out.y = p.y;
            return out;
        }
        return new Coordinate(p);
    },
    unproject: function (p: Coordinate, out?: Coordinate): Coordinate {
        if (out) {
            out.x = p.x;
            out.y = p.y;
            return out;
        }
        return new Coordinate(p);
    }
};

export type EPSG4326ProjectionType = CommonProjectionType & typeof EPSG4326Projection & WGS84SphereType;

/**
 * GIS 中常见的 CRS。 使用简单的等距矩形投影
 *
 * @english
 * A common CRS among GIS enthusiasts. Uses simple Equirectangular projection.
 *
 * @category geo
 * @protected
 * @group projection
 * @name EPSG4326
 * {@inheritDoc projection.Common}
 * {@inheritDoc measurer.WGS84Sphere}
 */
export default extend<EPSG4326ProjectionType, CommonProjectionType, typeof EPSG4326Projection, WGS84SphereType>({} as EPSG4326ProjectionType, Common, EPSG4326Projection, WGS84Sphere);
