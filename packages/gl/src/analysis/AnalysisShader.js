import { getWGSLSource } from '../reshader/gpu/WGSLSources';
// import QuadShader from '../shader/QuadShader.js';
import * as reshader from '../reshader';
import frag from './glsl/analysis.frag';
class AnalysisShader extends reshader.QuadShader {
    constructor(viewport) {
        super({
            name: 'analysis',
            frag,
            wgslFrag: getWGSLSource('gl_analysis_frag'),
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
