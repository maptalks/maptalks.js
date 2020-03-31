import { mat4 } from 'gl-matrix';
import phongFrag from './glsl/phong.frag';
import phongVert from './glsl/phong.vert';
import MeshShader from '../shader/MeshShader.js';

class PhongShader extends MeshShader {
    constructor(config = {}) {
        super({
            vert: phongVert,
            frag: phongFrag,
            uniforms: [
                'halton',
                'globalTexSize',
                'cameraPosition',
                'lightAmbient',
                'lightDiffuse',
                'lightSpecular',
                'lightDirection',
                'ambientStrength',
                'specularStrength',
                'materialShininess',
                'projViewMatrix',
                'opacity',
                'baseColorTexture',
                'baseColorFactor',
                'bloom',
                'projMatrix',
                'viewMatrix',
                'positionMatrix',
                {
                    name: 'normalMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        const normalMatrix = [];
                        mat4.invert(normalMatrix, props['modelMatrix']);
                        mat4.transpose(normalMatrix, normalMatrix);
                        return normalMatrix;
                    }
                },
                {
                    name: 'viewModelMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        return mat4.multiply([], props['viewMatrix'], props['modelMatrix']);
                    }
                },
                //KHR_materials_pbrSpecularGlossiness
                'diffuseFactor',
                'specularFactor',
                'glossinessFactor',
                'diffuseTexture',
                'specularGlossinessTexture',
                //viewshed
                'viewshed_depthMapFromViewpoint',
                'viewshed_projViewMatrixFromViewpoint',
                'viewshed_visibleColor',
                'viewshed_invisibleColor',
                //floodAnalyse
                'flood_waterHeight',
                'flood_waterColor',
                //fog
                'fog_Dist',
                'fog_Color',

                'lineColor',
                'lineOpacity',
                'polygonFill',
                'polygonOpacity'
            ],
            defines: config.defines || {},
            extraCommandProps: config.extraCommandProps || {}
        });
    }
}
export default PhongShader;
