import { getWGSLSource } from '../../reshader/gpu/WGSLSources';
import fillVert from './fill.vert';
import fillFrag from './fill.frag';
const fillWgslVert = getWGSLSource('gl_fill_vert');
const fillWgslFrag = getWGSLSource('gl_fill_frag');
export { fillVert, fillFrag, fillWgslVert, fillWgslFrag };
