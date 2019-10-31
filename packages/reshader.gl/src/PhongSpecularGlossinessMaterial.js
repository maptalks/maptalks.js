import PhongMaterial from './PhongMaterial.js';
import SpecularGlossinessMixin from './SpecularGlossinessMixin.js';


class PBRSpecularGlossinessMaterial extends SpecularGlossinessMixin(PhongMaterial) {
}

export default PBRSpecularGlossinessMaterial;
