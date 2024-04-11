import PhongPainter from './PhongPainter';
import { reshader } from '@maptalks/gl';
import GLTFMixin from './GLTFMixin';

class GLTFPhongPainter extends GLTFMixin(PhongPainter) {

    getMaterialClazz(materialInfo) {
        return materialInfo.diffuseFactor ? reshader.PhongSpecularGlossinessMaterial : reshader.PhongMaterial;
    }
}

export default GLTFPhongPainter;
