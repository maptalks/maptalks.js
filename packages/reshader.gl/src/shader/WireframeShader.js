import { mat4 } from '@mapbox/gl-matrix';
import wireframeFrag from './glsl/wireframe.frag';
import wireframeVert from './glsl/wireframe.vert';
import MeshShader from '../shader/MeshShader.js';
//http://codeflow.org/entries/2012/aug/02/easy-wireframe-display-with-barycentric-coordinates/
class WireframeShader extends MeshShader {

    constructor() {
        super({
            vert : wireframeVert, frag : wireframeFrag,
            uniforms : [
                'color', 'lineWidth', 'alpha',
                {
                    name : 'projectionViewModel',
                    type : 'function',
                    fn : (context, props) => {
                        return mat4.multiply([], props['projectionView'], props['model']);
                    }
                }
            ]
        });
    }
}

export default WireframeShader;
