
import phongFrag from './glsl/phong.frag';
import phongVert from './glsl/phong.vert';
import PhongShader from '../shader/PhongShader.js';
class ToonShader extends PhongShader {
    constructor(config = {}) {
        super({
            vert: phongVert,
            frag: phongFrag,
            defines: config.defines || {},
            extraCommandProps: config.extraCommandProps || {}
        });
    }
}
export default ToonShader;
