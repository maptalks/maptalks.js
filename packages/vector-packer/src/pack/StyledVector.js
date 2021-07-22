export default class StyledVector {
    constructor(feature, symbol, fnTypes, options) {
        //a_vertex, aTexCoord, aOpacity
        this.feature = feature;
        this.symbol = symbol;
        this.fnTypes = fnTypes;
        this.options = options;//minZoom maxZoom
    }

    getPolygonResource() {
        let pattern = this.symbol['polygonPatternFile'];
        const { polygonPatternFileFn } = this.fnTypes;
        const patternFn = polygonPatternFileFn;
        return this._getResource(pattern, patternFn);
    }

    getLineResource() {
        let pattern = this.symbol['linePatternFile'];
        const { linePatternFileFn } = this.fnTypes;
        const patternFn = linePatternFileFn;
        return this._getResource(pattern, patternFn);
    }
    _getResource(pattern, patternFn) {
        if (patternFn) {
            const feature = this.feature;
            const properties = feature && feature.properties || {};
            properties['$layer'] = feature.layer;
            properties['$type'] = feature.type;
            pattern = patternFn(this.options['zoom'], properties);
            delete properties['$layer'];
            delete properties['$type'];
        }
        return pattern;
    }
}
