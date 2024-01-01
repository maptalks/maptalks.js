import { COLOR_PROPERTIES } from '../../../core/Constants';
import { isString } from '../../../core/util';
import { bufferBBOX, getDefaultBBOX, setBBOX } from '../../../core/util/bbox';

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

    _setBBOX(ctx, x1, y1, x2, y2) {
        if (!ctx.isHitTesting) {
            setBBOX(this.bbox, x1, y1, x2, y2);
        }
        return this;
    }

    _bufferBBOX(ctx, bufferSize = 0) {
        if (!ctx.isHitTesting) {
            bufferBBOX(this.bbox, bufferSize);
        }
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
