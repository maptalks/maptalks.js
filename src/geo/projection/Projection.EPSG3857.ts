import { extend } from '../../core/util/common';
import { wrap, sign } from '../../core/util/util';
import Common, { type CommonProjectionType } from './Projection';
import Coordinate from '../Coordinate';
import { WGS84Sphere, type WGS84SphereType } from '../measurer';

const delta = 1E-7;

const EPSG3857Projection = {
    /**
     * "EPSG:3857", Code of the projection
     * @constant
     */
    code: 'EPSG:3857',
    rad: Math.PI / 180,
    metersPerDegree: 6378137 * Math.PI / 180,
    maxLatitude: 85.0511287798,

    project: function (lnglat: Coordinate, out?: Coordinate) {
        const rad = this.rad,
          metersPerDegree = this.metersPerDegree,
          max = this.maxLatitude;
        const lng = lnglat.x,
          lat = Math.max(Math.min(max, lnglat.y), -max);
        let c;
        if (lat === 0) {
            c = 0;
        } else {
            c = Math.log(Math.tan((90 + lat) * rad / 2)) / rad;
        }
        const x = lng * metersPerDegree;
        const y = c * metersPerDegree;
        if (out) {
            out.x = x;
            out.y = y;
            return out;
        }
        return new Coordinate(x, y);
    },

    unproject: function (pLnglat: Coordinate, out?: Coordinate) {
        const rad = this.rad;
        const metersPerDegree = this.metersPerDegree;
        let x = pLnglat.x / metersPerDegree;
        const y = pLnglat.y;
        let c;
        if (y === 0) {
            c = 0;
        } else {
            c = y / metersPerDegree;
            c = (2 * Math.atan(Math.exp(c * rad)) - Math.PI / 2) / rad;
        }
        if (Math.abs(Math.abs(x) - 180) < delta) {
            x = sign(x) * 180;
        }
        if (Math.abs(Math.abs(c) - this.maxLatitude) < delta) {
            c = sign(c) * this.maxLatitude;
        }
        const rx = wrap(x, -180, 180);
        const ry = wrap(c, -this.maxLatitude, this.maxLatitude);
        if (out) {
            out.x = rx;
            out.y = ry;
            return out;
        }
        return new Coordinate(rx, ry);
    }
};

export type EPSG3857ProjectionType = CommonProjectionType & typeof EPSG3857Projection & WGS84SphereType;

/**
 * Google 地图或 OSM 地图使用的常规投影，又名墨卡托投影。<br>
 * 这是地图的默认投影。
 *
 * @english
 * Well-known projection used by Google maps or Open Street Maps, aka Mercator Projection.<br>
 * It is map's default projection.
 *
 * @category geo
 * @protected
 * @group projection
 * @name EPSG3857
 * {@inheritDoc projection.Common}
 * {@inheritDoc measurer.WGS84Sphere}
 */
export default extend<EPSG3857ProjectionType, CommonProjectionType, typeof EPSG3857Projection, WGS84SphereType>({} as EPSG3857ProjectionType, Common, EPSG3857Projection , WGS84Sphere);
