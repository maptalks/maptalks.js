import BoxClipMask from './BoxClipMask';

export default class BoxInsideClipper extends BoxClipMask {
    constructor(position, options) {
        super(position, options);
        this._mode = 'clip-inside';
    }
}
