import { getWGSLSource } from '@maptalks/gl';
import fillVert from './fill.vert';
import fillFrag from './fill.frag';
export { fillVert, fillFrag, fillWgslVert: getWGSLSource('gl_fill_vert'), fillWgslFrag: getWGSLSource('gl_fill_frag') };
