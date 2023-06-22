import { COLOR_PROPERTIES } from '../../../core/Constants';
import { isString } from '../../../core/util';
import { getDefaultBBOX, resetBBOX, setBBOX } from '../../../core/util/bbox';

/**
 * @classdesc
 * Base class for all the symbolilzers
 * @class
 * @extends Class
 * @abstract
 * @private
 */
class Symbolizer {
    constructor() {
        this.bbox = getDefaultBBOX();
    }

    _resetBBOX() {
        resetBBOX(this.bbox);
        return this;
    }

    _setBBOX(x1, y1, x2, y2) {
        setBBOX(this.bbox, x1, y1, x2, y2);
        return this;
    }

    getMap() {
        return this.geometry.getMap();
    }

    getPainter() {
        return this.painter;
    }

    isDynamicSize() {
        return false;
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
        if (COLOR_PROPERTIES.indexOf(prop) >= 0) {
            return true;
        }
        return false;
    }
}

export default Symbolizer;
