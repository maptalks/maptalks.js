import Polygon from '../Polygon';

/**
 * it is base class for Mask
 *
 * class ClipOnsideMask extends OutsideMask {
 *
 * }
 *
 */
export default class OutsideMask extends Polygon {

    isOutSideMask() {
        return true;
    }

}

OutsideMask.registerJSONType('OutsideMask');
