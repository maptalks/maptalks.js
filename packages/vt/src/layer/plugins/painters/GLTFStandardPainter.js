import { reshader } from '@maptalks/gl';
import StandardPainter from './pbr/StandardPainter';
import GLTFMixin from './GLTFMixin';

class GLTFStandardPainter extends GLTFMixin(StandardPainter) {

    getMaterialClazz(materialInfo) {
        return (materialInfo['specularGlossinessTexture'] || materialInfo['diffuseTexture']) ? reshader.pbr.StandardSpecularGlossinessMaterial : reshader.pbr.StandardMaterial;
    }
}

export default GLTFStandardPainter;
