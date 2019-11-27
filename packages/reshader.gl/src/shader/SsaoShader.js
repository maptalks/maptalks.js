import QuadShader from './QuadShader.js';
import vert from './glsl/quad.vert';
import frag from './glsl/ssao_main.frag';
import { mat4 } from 'gl-matrix';

const KERNEL_SPHERE_SAMPLES = [
    [-1.60954e-06,  3.93118e-07,  1.51895e-06],
    [-0.09508890,  0.00458908, -0.0312535],
    [0.015179900, -0.025586400,  0.003764530],
    [0.07342620,  0.02180220,  0.0027781],
    [0.094587400,  0.043218400,  0.089147500],
    [-0.00950861,  0.05136860,  0.0196730],
    [0.139973000, -0.101685000,  0.108570000],
    [-0.10380400,  0.21985300, -0.0430164],
    [0.004840530, -0.033987800,  0.094186800],
    [0.02801140,  0.05846620, -0.2571100],
    [-0.051030600,  0.074993000,  0.259843000],
    [0.11882200, -0.18653700, -0.1341920],
    [0.063949400, -0.094893600, -0.072683000],
    [0.10817600,  0.32710800, -0.2540580],
    [-0.047179600,  0.219180000,  0.263895000],
    [-0.40770900,  0.24083400, -0.200352]
];

const KERNEL_NOISE_SAMPLES = [
    [-0.0782473, -0.749924, -0.6568800],
    [-0.5723190, -0.1023790, -0.813615],
    [0.0486527, -0.380791,  0.9233800],
    [0.2812020, -0.6566640, -0.699799],
    [0.7119110, -0.235841, -0.6614850],
    [-0.4458930,  0.6110630,  0.654050],
    [-0.7035980,  0.674837,  0.2225870],
    [0.7682360,  0.5074570,  0.390257],
    [-0.6702860, -0.470387,  0.5739800],
    [0.1992350,  0.8493360, -0.488808],
    [-0.7680680, -0.583633, -0.2635200],
    [-0.8973300,  0.3288530,  0.294372],
    [-0.5709300, -0.531056, -0.6261140],
    [0.6990140,  0.0632826, -0.712303],
    [0.2074950,  0.976129, -0.0641723],
    [-0.0609008, -0.8697380, -0.48974]
];

class SsaoShader extends QuadShader {
    constructor(viewport) {
        super({
            vert, frag,
            uniforms : [
                'resolution',
                'bias', 'radius', 'power',
                'projMatrix', 'materialParams_depth',
                // 'cameraNear', 'cameraFar',
                {
                    name: 'invProjMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        return mat4.invert([], props['projMatrix']);
                    }
                },
                {
                    name: 'kSphereSamples',
                    type: 'array',
                    length: 16,
                    fn: function () {
                        return KERNEL_SPHERE_SAMPLES;
                    }
                },
                {
                    name: 'kNoiseSamples',
                    type: 'array',
                    length: 16,
                    fn: function () {
                        return KERNEL_NOISE_SAMPLES;
                    }
                },
            ],
            extraCommandProps: {
                viewport
            }
        });
    }

    getMeshCommand(regl, mesh) {
        if (!this.commands['ssao']) {
            this.commands['ssao'] = this.createREGLCommand(
                regl,
                null,
                ['aPosition', 'aTexCoord'],
                null,
                mesh.getElements()
            );
        }
        return this.commands['ssao'];
    }
}

export default SsaoShader;
