import MultiPolygon from '../MultiPolygon';


export default class ClipOutsideMultiMask extends MultiPolygon {

    isOutSideMask() {
        return true;
    }

}
