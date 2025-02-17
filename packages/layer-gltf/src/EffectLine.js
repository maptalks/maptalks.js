import EffectMarker  from './EffectMarker';
import { Util } from 'maptalks';

const DEFAULT_SYMBOL = {
    url: 'plane',
    animation: true,
    loop: true,
    rotation : [0, 0, 0],
    translation: [0, 0, 30],
    scale: [1, 1, 30]
};

const DEFAULT_UNIFORMS = {
    width: 1,
    height: 1,
    modelHeight: 60,
    startOpacity: 0,
    endOpacity: 1
};

export default class EffectLine extends EffectMarker {
    constructor(coordinates, options) {
        super(coordinates, options);
        const symbol = Util.extend({}, DEFAULT_SYMBOL, this.options.symbol);
        this.setSymbol(symbol);
        const uniforms = Util.extend({}, DEFAULT_UNIFORMS, this.options.symbol.uniforms);
        this.setUniforms(uniforms);
        this.setShader('effectline');
        this._type = 'effectmarker';
    }

    getEffectType() {
        return 'sequence';
    }

    setTexture(texture) {
        this.setUniform('texture', texture);
        return this;
    }

    setHeight(height) {
        this.setUniform('modelHeight', height);
        return this;
    }

    setStartOpacity(startOpacity) {
        this.setUniform('startOpacity', startOpacity);
        return this;
    }

    setEndOpacity(endOpacity) {
        this.setUniform('endOpacity', endOpacity);
        return this;
    }
}
