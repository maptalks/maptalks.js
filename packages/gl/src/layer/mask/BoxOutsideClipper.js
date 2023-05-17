import ClipOutsideMask from './ClipOutsideMask';
import BoxClipper from './BoxClipper';

export default class BoxOutsideClipper extends BoxClipper {
    constructor(position, options) {
        super(position, options);
        this._clipper = new ClipOutsideMask([]);
    }
}
