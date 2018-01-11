import { isString } from '../../../core/util';

/**
 * @classdesc
 * Base class for all the symbolilzers
 * @class
 * @extends Class
 * @abstract
 * @private
 */
class Symbolizer {
    getMap() {
        return this.geometry.getMap();
    }

    getPainter() {
        return this.painter;
    }

    /**
     * Test if the property is a property related with coloring
     * @param {String} prop - property name to test
     * @static
     * @function
     * @return {Boolean}
     * @memberof symbolizer.Symbolizer
     */
    static testColor(prop) {
        if (!prop || !isString(prop)) {
            return false;
        }
        if (Symbolizer.colorProperties.indexOf(prop) >= 0) {
            return true;
        }
        return false;
    }
}

Symbolizer.resourceProperties = [
    'markerFile', 'polygonPatternFile', 'linePatternFile', 'markerFillPatternFile', 'markerLinePatternFile'
];

Symbolizer.resourceSizeProperties = [
    ['markerWidth', 'markerHeight'],
    [],
    [null, 'lineWidth'],
    [],
    [null, 'markerLineWidth']
];

Symbolizer.numericalProperties = {
    'lineWidth': 1,
    'lineOpacity': 1,
    'lineDx': 1,
    'lineDy': 1,
    'polygonOpacity': 1,
    'markerWidth': 1,
    'markerHeight': 1,
    'markerDx': 1,
    'markerDy': 1,
    'markerOpacity': 1,
    'markerFillOpacity': 1,
    'markerLineWidth': 1,
    'markerLineOpacity': 1,
    'textSize': 1,
    'textOpacity': 1,
    'textHaloRadius': 1,
    'textWrapWidth': 1,
    'textLineSpacing': 1,
    'textDx': 1,
    'textDy': 1
};

/**
 * @property {String[]} colorProperties - Symbol properties related with coloring
 * @static
 * @constant
 */
Symbolizer.colorProperties = [
    'lineColor', 'polygonFill', 'markerFill', 'markerLineColor', 'textFill'
];

export default Symbolizer;
