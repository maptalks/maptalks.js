export default class BloomPass {
    constructor(renderer, { bloomThreshold, bloomStrength, bloomRadius }) {
        this.renderer = renderer;
        this._bloomThreshold = bloomThreshold;
        this._bloomStrength = bloomStrength;
        this._bloomRaidus = bloomRadius;
    }


}
