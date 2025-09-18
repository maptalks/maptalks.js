import waterVert from './water.vert';
import waterFrag from './water.frag';
import MeshShader from '../shader/MeshShader.js';
class WaterShader extends MeshShader {
    constructor(config = {}) {
        super({
            vert: waterVert,
            frag: waterFrag,
            defines: config.defines || {},
            extraCommandProps: config.extraCommandProps || {}
        });
    }
}
export default WaterShader;
