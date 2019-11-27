import { mat4 } from 'gl-matrix';
import wireframeFrag from './glsl/wireframe.frag';
import wireframeVert from './glsl/wireframe.vert';
import MeshShader from '../shader/MeshShader.js';
import { extend } from '../common/Util';
//http://codeflow.org/entries/2012/aug/02/easy-wireframe-display-with-barycentric-coordinates/
class WireframeShader extends MeshShader {

    constructor(config = {}) {
        let extraCommandProps = config.extraCommandProps || {};
        extraCommandProps = extend({}, extraCommandProps, {
            blend: {
                enable: true,
                func: {
                    src: 'src alpha',
                    dst: 'one minus src alpha'
                },
                equation: 'add'
            },
            sample: {
                alpha: true
            }
        });
        super({
            vert: wireframeVert,
            frag: wireframeFrag,
            uniforms: [
                'time',
                'fill',
                'stroke',
                'dualStroke',
                'seeThrough',
                'insideAltColor',
                'thickness',
                'secondThickness',
                'dashEnabled',
                'dashRepeats',
                'dashOverlap',
                'dashLength',
                'dashAnimate',
                'squeeze',
                'squeezeMin',
                'squeezeMax',
                'opacity',
                'projViewMatrix',
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: (context, props) => {
                        return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                    }
                }
            ],
            extraCommandProps
        });
    }
}
export default WireframeShader;
