import { reshader } from '@maptalks/gl';
import StandardPainter from './StandardPainter.js';

class LitPainter extends StandardPainter {
    getShader(config) {
        return new reshader.pbr.SubsurfaceShader(config);
    }

    getMaterial(material) {
        return new reshader.pbr.SubsurfaceMaterial(material);
    }

}
export default LitPainter;
