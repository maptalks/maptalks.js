import ClipInsideMask from './ClipInsideMask';
import BoxClipper from './BoxClipper';

export default class BoxInsideClipper extends BoxClipper {
    constructor(position, options) {
        super(position, options);
        this._clipper = new ClipInsideMask([]);
    }
}
