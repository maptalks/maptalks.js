import { reshader } from '@maptalks/gl';
//@ts-expect-error-error
import positionVert from './plugins/painters/includes/position.vert';
import { getVectorPacker } from '../packer/inject';
const { PackUtil, FilterUtil, SYMBOLS_NEED_REBUILD_IN_VT,  SYMBOLS_NEED_REBUILD_IN_VECTOR } = getVectorPacker();

reshader.ShaderLib.register('vt_position_vert', positionVert);

export * from './plugins'
export * from './types'

export {
    PackUtil,
    SYMBOLS_NEED_REBUILD_IN_VT,
    SYMBOLS_NEED_REBUILD_IN_VECTOR,
    FilterUtil
};
