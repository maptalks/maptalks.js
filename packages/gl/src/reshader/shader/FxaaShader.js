import { getWGSLSource } from '@maptalks/gl';
import QuadShader from './QuadShader.js';
import frag from './glsl/fxaa.frag';
class FxaaShader extends QuadShader {
    constructor() {
        super({
            name: 'fxaa',
            frag, wgslFrag: getWGSLSource('gl_fxaa_frag'),
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width: (_, props) => {
                        return props['resolution'][0];
                    },
                    height: (_, props) => {
                        return props['resolution'][1];
                    }
                }
            }
        });
    }
}

export default FxaaShader;
