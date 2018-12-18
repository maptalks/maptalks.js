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
                'frontColor', 'backColor', 'lineWidth', 'alpha', 'fillColor',
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
