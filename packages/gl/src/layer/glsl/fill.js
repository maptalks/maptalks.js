import { getWGSLSource } from '../../reshader/gpu/WGSLSources';
import fillVert from './fill.vert';
import fillFrag from './fill.frag';

export default function getFillShaderCodes() {
    const fillWgslVert = getWGSLSource('gl_fill_vert');
    const fillWgslFrag = getWGSLSource('gl_fill_frag');
    return { fillVert, fillFrag, fillWgslVert, fillWgslFrag };
}
