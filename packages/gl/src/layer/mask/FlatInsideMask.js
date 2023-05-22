import FlatMask from './FlatMask';

export default class FlatInsideMask extends FlatMask {
    constructor(coordinates, options) {
        super(coordinates, options);
        this._mode = 'flat-inside';
    }
}
