import { mat4 } from 'gl-matrix';
import wireframeFrag from './glsl/wireframe.frag';
import wireframeVert from './glsl/wireframe.vert';
import MeshShader from '../shader/MeshShader.js';
import { extend } from '../common/Util';
//http://codeflow.org/entries/2012/aug/02/easy-wireframe-display-with-barycentric-coordinates/
class WireframeShader extends MeshShader {

    constructor(config = {}) {
        let extraCommandProps = config.extraCommandProps || {};
        const positionAttribute = config.positionAttribute || 'aPosition',
            barycentricAttribute = config.barycentricAttribute || 'aBarycentric';
        extraCommandProps = extend({}, extraCommandProps, {
            blend : {
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
        let vert = wireframeVert;
        //将着色器代码中的aPosition替换成指定的变量名
        if (positionAttribute !== 'aPosition') {
            vert = vert.replace(/aPosition/g, positionAttribute);
        }
        if (barycentricAttribute !== 'aBarycentric') {
            vert = vert.replace(/aBarycentric/g, barycentricAttribute);
        }
        super({
            vert,
            frag : wireframeFrag,
            uniforms : [
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
                {
                    name : 'projViewModelMatrix',
                    type : 'function',
                    fn : (context, props) => {
                        return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                    }
                }
            ],
            extraCommandProps
        });
    }
}

export default WireframeShader;
