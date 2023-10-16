import Polygon from '../Polygon';

/**
 * it is base class for Mask
 *
 * class ClipInsideMask extends ClipMask {
 *
 * }
 *
 */
export default class ClipMask extends Polygon {

    isOutSideMask() {
        return this.options.outside === true;
    }
}

ClipMask.registerJSONType('ClipMask');
