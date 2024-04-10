import Material from './Material';
import { MaterialUniforms } from './types/typings';

const DEFAULT_UNIFORMS: MaterialUniforms = {
    'time': 0,
    'seeThrough': true,
    'thickness': 0.03,
    'fill': [1.0, 0.5137254902, 0.98, 1.0],
    'stroke': [0.7019607843, 0.9333333333, 0.2274509804, 1.0],
    'dashEnabled': false,
    'dashAnimate': false,
    'dashRepeats': 1,
    'dashLength': 0.8,
    'dashOverlap': true,
    'insideAltColor': false,
    'squeeze': false,
    'squeezeMin': 0.5,
    'squeezeMax': 1,
    'dualStroke': false,
    'secondThickness': 0.05,
    'opacity': 1.0,
    'noiseEnable': false
};

class WireFrameMaterial extends Material {
    constructor(uniforms: MaterialUniforms) {
        super(uniforms, DEFAULT_UNIFORMS);
    }
}
export default WireFrameMaterial;
