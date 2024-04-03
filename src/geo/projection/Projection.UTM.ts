import { extend } from '../../core/util/common';
import PROJ9807, { type EPSG9807ProjectionType } from './Projection.EPSG9807';

export interface UTMProjectionParams {
    zone: string;
    south: boolean;
}

const UTMProjection = {
    /**
     * "EPSG:4490", Code of the projection
     * @constant
     */
    code: 'utm',
    aliases: [],
    create(params: Partial<UTMProjectionParams>) {
        const P: any = {};
        let zone = parseInt(params.zone);
        P.falseNorthing = params.south ? 10000000 : 0;
        P.falseEasting = 500000;
        if (zone > 0 && zone <= 60) {
            zone--;
        } else {
            throw new Error('zone must be > 0 and <= 60.');
        }
        P.centralMeridian = (zone + 0.5) * 6 - 180;
        P.scaleFactor = 0.9996;
        return PROJ9807.create(P);
    }
};

export type UTMProjectionType = EPSG9807ProjectionType & typeof UTMProjection;

/**
 * Universal Traverse Mercator projection
 *
 * @class
 * @category geo
 * @protected
 * @memberOf projection
 * @name EPSG4490
 * {@inheritDoc projection.EPSG9807}
 */
export default extend<UTMProjectionType, EPSG9807ProjectionType, typeof UTMProjection>({} as UTMProjectionType, PROJ9807, UTMProjection);
