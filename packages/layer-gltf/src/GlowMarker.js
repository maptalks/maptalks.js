import GLTFMarker from './GLTFMarker';

const options = {
    visible: true
};
export default class GlowMarker extends GLTFMarker {

    constructor(coordinates, options) {
        super(coordinates, options);
        this._type = 'glowmarker';
    }

    static fromJSON(json) {
        return new GlowMarker(json.coordinates, json.options);
    }

    getUrl() {
        return 'plane';
    }

    setSpeed(speed) {
        this.setUniform('speed', speed);
    }

    getSpeed() {
        const symbol = this._getInternalSymbol();
        return symbol.uniforms.speed;
    }

    getShader() {
        return 'glowmarker';
    }

    isAnimated() {
        const symbol = this._getInternalSymbol();
        return symbol && symbol.animation;
    }

    _updateTime() {
        const symbol = this._getInternalSymbol();
        let time = symbol.uniforms.time || 0.0;
        time += 0.01;
        this.setUniform('time', time);
    }
}

GlowMarker.mergeOptions(options);
