export default class StyledVector {
    constructor(feature, symbol, fnTypes, options) {
        //a_vertex, aTexCoord, aOpacity
        this.feature = feature;
        this.symbol = symbol;
        this.fnTypes = fnTypes;
        this.options = options;//minZoom maxZoom
    }

    getResource() {
        let pattern = this.symbol['linePatternFile'] || this.symbol['polygonPatternFile'];
        const { linePatternFileFn, polygonPatternFileFn } = this.fnTypes;
        const patternFn = linePatternFileFn || polygonPatternFileFn;
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
