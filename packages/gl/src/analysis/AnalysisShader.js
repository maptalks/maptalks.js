// import QuadShader from '../shader/QuadShader.js';
import * as reshader from '../reshader';
import vert from './glsl/quad.vert';
import frag from './glsl/analysis.frag';

class AnalysisShader extends reshader.QuadShader {
    constructor(viewport) {
        super({
            vert, frag,
            extraCommandProps: {
                viewport,
                cull: {
                    enable: true
                },
                blend: {
                    enable: true,
                    func: {
                        srcRGB: 'src alpha',
                        srcAlpha: 1,
                        dstRGB: 'one minus src alpha',
                        dstAlpha: 'one minus src alpha'
                    },
                    equation: 'add'
                }
            }
        });
    }
}

export default AnalysisShader;
