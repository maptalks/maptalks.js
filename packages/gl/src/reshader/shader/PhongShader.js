import { getWGSLSource } from '../gpu/WGSLSources';
import { mat4, mat3 } from 'gl-matrix';
import phongFrag from './glsl/phong.frag';
import phongVert from './glsl/phong.vert';
import MeshShader from '../shader/MeshShader.js';

class PhongShader extends MeshShader {
    constructor(config = {}) {
        const normalMatrix = [];
        const modelViewMatrix = [];
        const extraUniforms = config.uniforms;
        const uniforms = [
            {
                name: 'modelNormalMatrix',
                type: 'function',
                fn: function (context, props) {
                    return mat3.fromMat4(normalMatrix, props['modelMatrix']);
                }
            },
            {
                name: 'modelViewMatrix',
                type: 'function',
                fn: function (context, props) {
                    return mat4.multiply(modelViewMatrix, props['viewMatrix'], props['modelMatrix']);
                }
            }
        ];
        if (extraUniforms) {
            uniforms.push(...extraUniforms);
        }
        super({
            name: 'phong',
            vert: config.vert || phongVert,
            frag: config.frag || phongFrag,
            wgslVert: getWGSLSource('gl_phong_vert'),
            wgslFrag: getWGSLSource('gl_phong_frag'),
            uniforms,
            defines: config.defines || {},
            extraCommandProps: config.extraCommandProps || {}
        });
        this.version = 300;
    }

    getGeometryDefines(geometry) {
        const defines = {};
        if (geometry.data[geometry.desc.tangentAttribute]) {
            defines['HAS_TANGENT'] = 1;
        } else if (geometry.data[geometry.desc.normalAttribute]) {
            defines['HAS_NORMAL'] = 1;
        }
        return defines;
    }
}
export default PhongShader;
