import { reshader } from '@maptalks/gl';
import StandardPainter from './StandardPainter.js';

class LitPainter extends StandardPainter {
    getShader(config) {
        return new reshader.pbr.LitShader(config);
    }

    getMaterial(material) {
        return new reshader.pbr.LitMaterial(material);
    }

}
export default LitPainter;
