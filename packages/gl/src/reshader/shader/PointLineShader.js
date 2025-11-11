import { mat4 } from 'gl-matrix';
import pointLineFrag from './glsl/pointLine.frag';
import pointLineVert from './glsl/pointLine.vert';
import MeshShader from './MeshShader.js';

class PointLineShader extends MeshShader {
    constructor(config = {}) {
        const projViewModelMatrix = [];
        super({
            vert: pointLineVert,
            frag: pointLineFrag,
            uniforms: [
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: (context, props) => {
                        return mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                    }
                }
            ],
            defines: config.defines || {},
            extraCommandProps: config.extraCommandProps || {}
        });
    }
}
export default PointLineShader;
