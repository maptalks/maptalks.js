import GLTFMarker from './GLTFMarker';
import { Util } from 'maptalks';

const DEFAULT_UNIFORM = {
    offsetX: 0,
    offsetY: 0,
    uReflectivity: 0.8,
    opacity: 0.9,
    color: [0.9, 0.0, 0.0, 1.0]//设置颜色
};

export default class EffectRing extends GLTFMarker {
    //symbol中需要设置纹理图片
    constructor(coordinates, options) {
        super(coordinates, options);
        const uniforms = Util.extend({}, DEFAULT_UNIFORM, this.options.symbol.uniforms);
        this.setUniforms(uniforms);
        this.setShader('effectring');
        this._type = 'effectring';
    }
}
