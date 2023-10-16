
import MultiPolygon from '../MultiPolygon';

export default class ClipMultiMask extends MultiPolygon {

    isOutSideMask() {
        return this.options.outside === true;
    }
}

ClipMultiMask.registerJSONType('ClipMultiMask');
