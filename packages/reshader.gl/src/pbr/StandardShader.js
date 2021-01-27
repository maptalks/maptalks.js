import { mat3, mat4 } from 'gl-matrix';
import vert from './glsl/standard.vert';
import frag from './glsl/standard.frag';
import MeshShader from '../shader/MeshShader.js';
import { extend } from '../common/Util';


//http://codeflow.org/entries/2012/aug/02/easy-wireframe-display-with-barycentric-coordinates/
class StandardShader extends MeshShader {
    constructor(config = {}) {
        let extraCommandProps = config.extraCommandProps || {};
        const extraUniforms = config.uniforms;
        extraCommandProps = extend({}, extraCommandProps/*, {
            blend : {
                enable: true,
                func: {
                    src: 'one',
                    dst: 'one minus src alpha'
                    // srcRGB: 'src alpha',
                    // srcAlpha: 1,
                    // dstRGB: 'one minus src alpha',
                    // dstAlpha: 'one minus src alpha'
                },
                equation: 'add'
            }
        }*/);

        const defines = config.defines || {};

        // const modelMatrix = [1, -0.0000, -0.0000, 0, 0, 0.0000, 1, 0, 0.0000, -1, 0.0000, 0, -155.4500, 0, 287.6630, 1];
        // const modelViewMatrix = [-0.2274, -0.5468, 0.8058, 0, 0, 0.8275, 0.5615, 0, -0.9738, 0.1277, -0.1882, 0, 71.0551, 174.0461, -2710.2300, 1];
        // const viewMatrix = mat4.multiply([], modelViewMatrix, mat4.invert([], modelMatrix));
        // const modelView = mat4.multiply([], viewMatrix, modelMatrix);
        // const inverted = mat4.invert(modelView, modelView);
        // const transposed = mat4.transpose(inverted, inverted);
        // console.log(mat3.fromMat4([], transposed));

        const uniforms = [
            //vert中的uniforms
            {
                name: 'uModelMatrix',
                type: 'function',
                fn: (_, props) => {
                    return props['modelMatrix'];
                }
            },
            {
                name: 'uModelNormalMatrix',
                type: 'function',
                fn: (_, props) => {
                    // const model3 = mat3.fromMat4([], props['modelMatrix']);
                    // const transposed = mat3.transpose(model3, model3);
                    // const inverted = mat3.invert(transposed, transposed);
                    // return inverted;
                    return mat3.fromMat4([], props['modelMatrix']);
                }
            },
            {
                name: 'uModelViewNormalMatrix',
                type: 'function',
                fn: (_, props) => {
                    const modelView = mat4.multiply([], props['viewMatrix'], props['modelMatrix']);
                    const inverted = mat4.invert(modelView, modelView);
                    const transposed = mat4.transpose(inverted, inverted);
                    return mat3.fromMat4([], transposed);
                    // const modelView = mat4.multiply([], props['viewMatrix'], props['modelMatrix']);
                    // return mat3.fromMat4([], modelView);
                }
            },
            {
                name: 'uProjectionMatrix',
                type: 'function',
                fn: (_, props) => {
                    return props['projMatrix'];
                }
            },
            // {
            //     name: 'uProjViewModelMatrix',
            //     type: 'function',
            //     fn: (_, props) => {
            //         return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
            //     }
            // },
            {
                name: 'uModelViewMatrix',
                type: 'function',
                fn: (_, props) => {
                    return mat4.multiply([], props['viewMatrix'], props['modelMatrix']);
                }
            },
            {
                name: 'uEnvironmentTransform',
                type: 'function',
                fn: (_, props) => {
                    const rotation = props['environmentRotation'] || 0;
                    return mat3.fromRotation([], Math.PI * rotation / 180);
                }
            }

        ];
        if (extraUniforms) {
            uniforms.push(...extraUniforms);
        }
        const fragSource = config.frag || frag;
        super({
            vert,
            frag: fragSource,
            uniforms,
            extraCommandProps,
            defines
        });
        this.version = 300;
    }

    getGeometryDefines(geometry) {
        const defines = {};
        if (geometry.data[geometry.desc.tangentAttribute]) {
            defines['HAS_TANGENT'] = 1;
        }
        return defines;
    }
}


export default StandardShader;
