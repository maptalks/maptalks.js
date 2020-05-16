import QuadShader from '../shader/QuadShader.js';
import vert from '../shader/glsl/quad.vert';
import frag from './glsl/ssao_extract.frag';

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

class SsaoExtactShader extends QuadShader {
    constructor() {
        super({
            vert, frag,
            uniforms : [
                // 'uFrameModTaaSS',
                // 'uQuality',
                // 'uSsaoBias',
                // 'uSsaoIntensity',
                // 'uSsaoProjectionScale',
                // 'uSsaoRadius',
                // 'TextureMipmapDepth',
                // 'uNearFar',
                // 'uTextureMipmapDepthRatio',
                // 'uTextureMipmapDepthSize',
                // 'uTextureOutputRatio',
                // 'uTextureOutputSize',
                // 'uSsaoProjectionInfo',
                // 'projMatrix',
                // 'invProjMatrix',
                // 'TextureDepth',
                // {
                //     name: 'kSphereSamples',
                //     type: 'array',
                //     length: 16,
                //     fn: function () {
                //         return KERNEL_SPHERE_SAMPLES;
                //     }
                // },
                'materialParams_depth',
                'materialParams.resolution',
                'materialParams.depthParams',
                'materialParams.positionParams',
                'materialParams.invRadiusSquared',
                'materialParams.peak2',
                'materialParams.projectionScaleRadius',
                'materialParams.bias',
                'materialParams.power',
                'materialParams.intensity',
                'materialParams.sampleCount',
                'materialParams.spiralTurns',
                'materialParams.invFarPlane'
            ],
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width: (context, props) => {
                        return props['materialParams']['resolution'][0];
                    },
                    height: (context, props) => {
                        return props['materialParams']['resolution'][1];
                    }
                }
            }
        });
    }

    getMeshCommand(regl, mesh) {
        if (!this.commands['ssao_extract']) {
            this.commands['ssao_extract'] = this.createREGLCommand(
                regl,
                null,
                ['aPosition', 'aTexCoord'],
                null,
                mesh.getElements()
            );
        }
        return this.commands['ssao_extract'];
    }
}

export default SsaoExtactShader;
