import QuadShader from '../shader/QuadShader.js';
import vert from '../shader/glsl/quad.vert';
import frag from './glsl/analysis.frag';

class AnalysisShader extends QuadShader {
    constructor(viewport) {
        super({
            vert, frag,
            extraCommandProps: {
                viewport
            }
        });
    }
}

export default AnalysisShader;
