import { registerWGSLSource } from '@maptalks/gl';

import depthVert from '../../analysis/src/pass/wgsl/depth_vert.wgsl';
import depthFrag from '../../analysis/src/pass/wgsl/depth_frag.wgsl';

registerWGSLSource('analysis_depth_vert', depthVert);
registerWGSLSource('analysis_depth_frag', depthFrag);
