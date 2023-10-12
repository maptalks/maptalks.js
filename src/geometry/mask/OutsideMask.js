import Polygon from '../Polygon';


export default class OutsideMask extends Polygon {


    isOutSideMask() {
        return true;
    }

}

OutsideMask.registerJSONType('OutsideMask');
