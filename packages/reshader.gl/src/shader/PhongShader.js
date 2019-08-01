import { mat4 } from 'gl-matrix';
import phongFrag from './glsl/phong.frag';
import phongVert from './glsl/phong.vert';
import MeshShader from '../shader/MeshShader.js';

class PhongShader extends MeshShader {

    constructor(config = {}) {
        let extraCommandProps = config.extraCommandProps || {};
        const positionAttribute = config.positionAttribute || 'aPosition';
        let vert = phongVert;
        if (positionAttribute !== 'aPosition') {
            vert = vert.replace(/aPosition/g, positionAttribute);
        }
        super({
            vert,
            frag : phongFrag,
            uniforms : [
                'viewPos',
                'lightAmbient',
                'lightDiffuse',
                'lightSpecular',
                'ambientStrength',
                'specularStrength',
                'materialShininess',
                'projViewMatrix',
                'opacity',
                'sample',
                'lightPosition',

                {
                    name : 'normalMatrix',
                    type : 'function',
                    fn : function (context, props) {
                        const normalMatrix = [];
                        mat4.invert(normalMatrix, props['modelMatrix']);
                        mat4.transpose(normalMatrix, normalMatrix);
                        return normalMatrix;
                    }
                },
                {
                    name : 'projViewModelMatrix',
                    type : 'function',
                    fn : function (context, props) {
                        return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                    }
                }
            ],
            defines : {
            },
            extraCommandProps
        });
    }
}

export default PhongShader;
