import { extend } from '../../core/util/common';
import Coordinate from '../Coordinate';
import Common, { type CommonProjectionType } from './Projection';
import { Identity, type IdentityMeasurerType } from '../measurer';

const IdentityProjection = {
    /**
     * "IDENTITY", Code of the projection
     * @constant
     */
    code: 'IDENTITY',
    project: function (p: Coordinate, out?: Coordinate): Coordinate {
        if (out) {
            out.x = p.x;
            out.y = p.y;
            return out;
        }
        return p.copy();
    },
    unproject: function (p: Coordinate, out?: Coordinate): Coordinate {
        if (out) {
            out.x = p.x;
            out.y = p.y;
            return out;
        }
        return p.copy();
    }
};

export type IdentityProjectionType = CommonProjectionType & typeof IdentityProjection & IdentityMeasurerType;

/**
 * 基于笛卡尔坐标系的投影。<br>
 * 该投影直接映射 x、y，常用于平面地图（例如室内地图、游戏地图）。
 *
 * @english
 * A projection based on Cartesian coordinate system.<br>
 * This projection maps x, y directly, it is useful for maps of flat surfaces (e.g. indoor maps, game maps).
 *
 * @category geo
 * @protected
 * @group projection
 * @name IDENTITY
 * {@inheritDoc projection.Common}
 * {@inheritDoc measurer.Identity}
 */
export default extend<IdentityProjectionType, CommonProjectionType, typeof IdentityProjection, IdentityMeasurerType>({} as IdentityProjectionType, Common, IdentityProjection, Identity);
