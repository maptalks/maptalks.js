import { mat3, mat4 } from 'gl-matrix';
import vertSource from './glsl/standard.vert';
import frag from './glsl/standard.frag';
import MeshShader from '../shader/MeshShader.js';
import { extend } from '../common/Util';


//http://codeflow.org/entries/2012/aug/02/easy-wireframe-display-with-barycentric-coordinates/
class StandardShader extends MeshShader {
    constructor(config = {}) {
        let extraCommandProps = config.extraCommandProps || {};
        const positionAttribute  = config.positionAttribute || 'aPosition';
        const normalAttribute  = config.normalAttribute || 'aNormal';
        const tangentAttribute  = config.tangentAttribute || 'aTangent';
        const colorAttribute  = config.colorAttribute || 'aColor';
        const uv0Attribute = config.uv0Attribute || 'aTexCoord0';
        const uv1Attribute  = config.uv1Attribute || 'aTexCoord1';
        extraCommandProps = extend({}, extraCommandProps, {
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
            },
            sample: {
                alpha: true
            }
        });
        let vert = vertSource;
        //将着色器代码中的aPosition替换成指定的变量名
        if (positionAttribute !== 'aPosition') {
            vert = vert.replace(/aPosition/g, positionAttribute);
        }
        if (normalAttribute !== 'aNormal') {
            vert = vert.replace(/aNormal/g, normalAttribute);
        }
        if (tangentAttribute !== 'aTangent') {
            vert = vert.replace(/aTangent/g, tangentAttribute);
        }
        if (colorAttribute !== 'aColor') {
            vert = vert.replace(/aColor/g, colorAttribute);
        }
        if (uv0Attribute !== 'aTexCoord0') {
            vert = vert.replace(/aTexCoord0/g, uv0Attribute);
        }
        if (uv1Attribute !== 'aTexCoord1') {
            vert = vert.replace(/aTexCoord1/g, uv1Attribute);
        }
        super({
            vert,
            frag,
            uniforms : [
                'uCameraPosition',
                //vert中的uniforms
                {
                    name: 'uModelMatrix',
                    type: 'function',
                    fn: (context, props) => {
                        return props['modelMatrix'];
                    }
                },
                {
                    name: 'uModelNormalMatrix',
                    type: 'function',
                    fn: (context, props) => {
                        return mat3.fromMat4([], props['modelMatrix']);
                    }
                },
                // {
                //     name: 'uModelViewNormalMatrix',
                //     type: 'function',
                //     fn: (context, props) => {
                //         // const modelView = mat4.multiply(MAT4, props['viewMatrix'], props['modelMatrix']);
                //         // const inverted = mat4.invert(modelView, modelView);
                //         // const transposed = mat4.transpose(inverted, inverted);
                //         // return mat3.fromMat4([], transposed);
                //         const modelView = mat4.multiply(MAT4, props['viewMatrix'], props['modelMatrix']);
                //         return mat3.fromMat4([], modelView);
                //     }
                // },
                {
                    name : 'uProjViewModelMatrix',
                    type : 'function',
                    fn : (context, props) => {
                        return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                    }
                },
                // {
                //     name : 'uModelViewMatrix',
                //     type : 'function',
                //     fn : (context, props) => {
                //         return mat4.multiply([], props['viewMatrix'], props['modelMatrix']);
                //     }
                // },
                // {
                //     name : 'uProjectionMatrix',
                //     type : 'function',
                //     fn : (context, props) => {
                //         return props['projMatrix'];
                //     }
                // },
                'uvScale', 'uvOffset',
                'uEmitColor',
                'uAlbedoPBR',
                'uAlbedoPBRFactor', //1
                'uAnisotropyDirection', //0
                'uAnisotropyFactor', //1
                'uClearCoatF0', //0.04
                'uClearCoatFactor', //1
                'uClearCoatIor', //1.4
                'uClearCoatRoughnessFactor', //0.04
                'uClearCoatThickness', //5
                'uEmitColorFactor', //1
                'uEnvironmentExposure', //2
                'uFrameMod', //
                'uRoughnessPBRFactor', //0.4
                'uMetalnessPBRFactor', //0
                'uNormalMapFactor', //1
                'uRGBMRange', //7
                'uScatteringFactorPacker', //unused
                // 'uShadowReceive3_bias',
                'uSpecularF0Factor', //0.5862
                'uStaticFrameNumShadow3', //14
                'uSubsurfaceScatteringFactor', //1
                'uSubsurfaceScatteringProfile', //unused
                'uSubsurfaceTranslucencyFactor', //1
                'uSubsurfaceTranslucencyThicknessFactor', //37.4193
                'uAnisotropyFlipXY', //unused
                'uDrawOpaque', //unused
                'uEmitMultiplicative', //0
                'uNormalMapFlipY', //1
                'uOutputLinear', //1
                'uEnvironmentTransform', //0.5063, -0.0000, 0.8624, 0.6889, 0.6016, -0.4044, -0.5188, 0.7988, 0.3046
                'uAlbedoTexture', //albedo color
                'uNormalTexture',
                'uOcclusionTexture',
                'uMetallicRoughnessTexture',
                'uEmissiveTexture',
                'sIntegrateBRDF',
                'sSpecularPBR',
                'uNearFar', //unused
                // 'uShadow_Texture3_depthRange',
                // 'uShadow_Texture3_renderSize',
                'uTextureEnvironmentSpecularPBRLodRange', //8, 5
                'uTextureEnvironmentSpecularPBRTextureSize', //256,256
                'uClearCoatTint', //0.0060, 0.0060, 0.0060
                'uDiffuseSPH[9]',
                // 'uShadow_Texture3_projection',
                'uSketchfabLight0_viewDirection',
                // 'uSketchfabLight1_viewDirection',
                // 'uSketchfabLight2_viewDirection',
                // 'uSketchfabLight3_viewDirection',
                'uSubsurfaceTranslucencyColor', //1, 0.3700, 0.3000
                'uHalton', //0.0450, -0.0082, 1, 5
                // 'uShadow_Texture3_viewLook',
                // 'uShadow_Texture3_viewRight',
                // 'uShadow_Texture3_viewUp',
                'uSketchfabLight0_diffuse'
                // 'uSketchfabLight1_diffuse',
                // 'uSketchfabLight2_diffuse',
                // 'uSketchfabLight3_diffuse',
            ],
            extraCommandProps,
            defines: config.defines
        });
        this.positionAttribute = positionAttribute;
        this.normalAttribute = normalAttribute;
        this.tangentAttribute = tangentAttribute;
        this.colorAttribute = colorAttribute;
        this.uv0Attribute = uv0Attribute;
        this.uv1Attribute = uv1Attribute;
    }

    getGeometryDefines(geometry) {
        const defines = {};
        if (geometry.data[this.tangentAttribute]) {
            defines['HAS_TANGENT'] = 1;
        }
        return defines;
    }
}


export default StandardShader;
