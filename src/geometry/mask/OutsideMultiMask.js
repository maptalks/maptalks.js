import MultiPolygon from '../MultiPolygon';


export default class OutsideMultiMask extends MultiPolygon {

    isOutSideMask() {
        return true;
    }

}
