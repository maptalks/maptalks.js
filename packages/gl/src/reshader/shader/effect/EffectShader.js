import QuadShader from '../../shader/QuadShader.js';
import vert from '../../shader/glsl/quad.vert';
import frag from './effect.frag';

class EffectShader extends QuadShader {
    constructor() {
        super({
            vert, frag,
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width: (context, props) => {
                        return props['resolution'][0];
                    },
                    height: (context, props) => {
                        return props['resolution'][1];
                    }
                }
            }
        });
    }
}

export default EffectShader;
