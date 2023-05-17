import ClipMask from './ClipMask';

export default class ClipOutsideMask extends ClipMask {
    constructor(coordinates, options) {
        super(coordinates, options);
        this._mode = 'clip-outside';
    }
}
