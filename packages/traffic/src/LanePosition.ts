import { uniqueId } from './Util.js';

export default class LanePosition {
    constructor(car, lane, position) {
        this.car = car;
        this.position = position;
        this.id = uniqueId('laneposition');
        this.free = true;
        this.tmpLane = lane;
    }

    get lane() {
        return this.tmpLane;
    }

    set lane(lane) {
        this.release();
        this.tmpLane = lane;
    }

    get relativePosition() {
        return this.position / this.lane.length;
    }

    get nextCarDistance() {
        let frontPosition, rearPosition;
        const next = this.getNext();
        if (next) {
            rearPosition = next.position - next.car.length / 2;
            frontPosition = this.position + this.car.length / 2;
            return  { car: next.car, distance: (rearPosition - frontPosition) };
        }
        return { car: null, distance: Infinity };
    }

    acquire() {
        let ref;
        if (((ref = this.lane) != null ? ref.addCarPosition : void 0) != null) {
            this.free = false;
            return this.lane.addCarPosition(this);
        }
        return null;
    }

    release() {
        let ref;
        if (!this.free && ((ref = this.lane) != null ? ref.removeCar : void 0)) {
            this.free = true;
            return this.lane.removeCar(this);
        }
        return null;
    }

    getNext() {
        if (this.lane && !this.free) {
            return this.lane.getNext(this);
        }
        return null;
    }
}
