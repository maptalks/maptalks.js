import FlatMask from './FlatMask';

export default class ElevateMask extends FlatMask {
    constructor(coordinates, options) {
        super(coordinates, options);
        this.setElevation(options.elevation);
        this._mode = 'elevate';
    }

    setElevation(elevation) {
        this.options.elevation = elevation;
        this.setFlatheight(this.options.elevation);
    }
}
