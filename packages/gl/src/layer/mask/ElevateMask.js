import FlatMask from './FlatMask';

export default class ElevateMask extends FlatMask {
    constructor(coordinates, options) {
        super(coordinates, options);
        this.setElevate(options.elevate);
        this._mode = 'elevate';
    }

    setElevate(elevate) {
        this.options.elevate = elevate;
        this.setFlatheight(this.options.elevate);
    }
}
