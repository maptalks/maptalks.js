import EffectMarker  from './EffectMarker';
import { Util } from '@maptalks/map';

const DEFAULT_SYMBOL = {
    animation : true,
    loop : true,
    url: 'plane',
    effect : 'sequence',
    speed : 1,
    scale : [1, 1, 1],
    rotation : [90, 0, 0]
};

const DEFAULT_UNIFORMS = {
    width : 9,
    height : 5
};

export default class AEMarker extends EffectMarker {
    constructor(coordinates, options) {
        super(coordinates, options);
        const symbol = Util.extend({}, DEFAULT_SYMBOL, this.options.symbol);
        this.setSymbol(symbol);
        const uniforms = Util.extend({}, DEFAULT_UNIFORMS, this.options.symbol.uniforms);
        this.setUniforms(uniforms);
    }
}
