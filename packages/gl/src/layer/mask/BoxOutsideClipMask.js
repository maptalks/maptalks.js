import BoxClipMask from './BoxClipMask';

export default class BoxOutsideClipper extends BoxClipMask {
    constructor(position, options) {
        super(position, options);
        this._mode = 'clip-outside';
    }
}
