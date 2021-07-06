export default class StyledVector {
    constructor(feature, symbol, fnTypes, options) {
        //a_vertex, aTexCoord, aOpacity
        this.feature = feature;
        this.symbol = symbol;
        this.fnTypes = fnTypes;
        this.options = options;//minZoom maxZoom
    }

    setResource(res) {
        this._res = res;
    }

    getResource() {
        return this._res;
    }
}
