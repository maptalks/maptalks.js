import QuadShader from '../shader/QuadShader.js';
import vert from '../shader/glsl/quad.vert';
import frag from './glsl/ssao_extract.frag';

const KERNEL_SPHERE_SAMPLES = [
    -0.000002,  0.000000,  0.000002,
    -0.095089,  0.004589, -0.031253,
    0.015180, -0.025586,  0.003765,
    0.073426,  0.021802,  0.002778,
    0.094587,  0.043218,  0.089148,
    -0.009509,  0.051369,  0.019673,
    0.139973, -0.101685,  0.108570,
    -0.103804,  0.219853, -0.043016,
    0.004841, -0.033988,  0.094187,
    0.028011,  0.058466, -0.257110,
    -0.051031,  0.074993,  0.259843,
    0.118822, -0.186537, -0.134192,
    0.063949, -0.094894, -0.072683,
    0.108176,  0.327108, -0.254058,
    -0.047180,  0.219180,  0.263895,
    -0.407709,  0.240834, -0.200352
];

class SsaoExtactShader extends QuadShader {
    constructor() {
        super({
            vert, frag,
            uniforms : [
                {
                    name: 'kSphereSamples',
                    type: 'function',
                    // type: 'array',
                    // length: 16,
                    fn: function () {
                        return KERNEL_SPHERE_SAMPLES;
                    }
                }
            ],
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width: (context, props) => {
                        return props['outputSize'][0];
                    },
                    height: (context, props) => {
                        return props['outputSize'][1];
                    }
                }
            }
        });
        this.version = 300;
    }

    getMeshCommand(regl, mesh) {
        if (!this.commands['ssao_extract']) {
            this.commands['ssao_extract'] = this.createMeshCommand(regl, mesh);
        }
        return this.commands['ssao_extract'];
    }
}

export default SsaoExtactShader;
