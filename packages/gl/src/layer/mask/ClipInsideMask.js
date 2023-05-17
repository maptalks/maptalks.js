import ClipMask from './ClipMask';

export default class ClipInsideMask extends ClipMask {
    constructor(coordinates, options) {
        super(coordinates, options);
        this._mode = 'clip-inside';
    }
}
