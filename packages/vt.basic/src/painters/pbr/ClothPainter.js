import { reshader } from '@maptalks/gl';
import StandardPainter from './StandardPainter.js';

class LitPainter extends StandardPainter {
    getShader(config) {
        return new reshader.pbr.ClothShader(config);
    }

    getMaterial(material) {
        return new reshader.pbr.ClothMaterial(material);
    }

}
export default LitPainter;
