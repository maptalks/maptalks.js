// import QuadShader from '../shader/QuadShader.js';
import * as reshader from '../reshader';
import frag from './glsl/analysis.frag';
import wgslFrag from './wgsl/analysis_frag.wgsl';

class AnalysisShader extends reshader.QuadShader {
    constructor(viewport) {
        super({
            name: 'analysis',
            frag,
            wgslFrag,
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
