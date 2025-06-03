import { reshader } from '@maptalks/gl';
//@ts-expect-error-error
import positionVert from './plugins/painters/includes/position.vert';
//@ts-expect-error-error
import text_render_frag from './plugins/painters/includes/text_render.frag';
import positionWgsl from './plugins/painters/includes/vt_position';
import textRender from './plugins/painters/includes/text_render';
import { getVectorPacker } from '../packer/inject';
const { PackUtil, FilterUtil, SYMBOLS_NEED_REBUILD_IN_VT,  SYMBOLS_NEED_REBUILD_IN_VECTOR } = getVectorPacker();

reshader.ShaderLib.register('vt_position_vert', positionVert);
reshader.ShaderLib.register('text_render_frag', text_render_frag);
reshader.WgslShaderLib.register('vt_position', positionWgsl);
reshader.WgslShaderLib.register('text_render', textRender);

export * from './plugins'
export * from './types'

export {
    PackUtil,
    SYMBOLS_NEED_REBUILD_IN_VT,
    SYMBOLS_NEED_REBUILD_IN_VECTOR,
    FilterUtil
};
