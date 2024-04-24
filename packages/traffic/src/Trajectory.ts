import LanePosition from './LanePosition.js';
import Curve from './Curve.js';

export default class Trajectory {
    constructor(car, lane, position) {
        this.car = car;
        this.current = new LanePosition(this.car, lane, position || 0);
        this.current.acquire();
        this.next = new LanePosition(this.car);
        this.temp = new LanePosition(this.car);
        this.isChangingLanes = false;
    }

    get lane() {
        return this.temp.lane || this.current.lane;
    }

    get absolutePosition() {
        if (this.temp.lane != null) {
            return this.temp.position;
        }
        return this.current.position;
    }

    get relativePosition() {
        return this.absolutePosition / this.lane.length;
    }

    get direction() {
        return this.lane.getDirection(this.relativePosition);
    }

    get coords() {
        return this.lane.getPoint(this.relativePosition);
    }

    get nextCarDistance() {
        const a = this.current.nextCarDistance;
        const b = this.next.nextCarDistance;
        if (a.distance < b.distance) {
            return a;
        }
        else {
            return b;
        }
    }

    get distanceToStopLine() {
        if (!this.canEnterIntersection()) {
            return this.getDistanceToIntersection();
        }
        return Infinity;
    }

    get nextIntersection() {
        return this.current.lane.road.target;
    }

    get previousIntersection() {
        return this.current.lane.road.source;
    }

    isValidTurn() {
        const nextLane = this.car.nextLane;
        const sourceLane = this.current.lane;
        //if (!nextLane) throw Error('no road to enter');
        const turnNumber = sourceLane.getTurnDirection(nextLane);
        if (turnNumber === 3) throw Error('no U-turns are allowed');
        if (turnNumber === 0 && !sourceLane.isLeftmost) {
            throw Error('no left turns from this lane');
        }
        if (turnNumber === 2 && !sourceLane.isRightmost) {
            throw Error('no right turns from this lane');
        }
        return true;
    }

    canEnterIntersection() {
        const nextLane = this.car.nextLane;
        const sourceLane = this.current.lane;
        if (!nextLane) {
            return true;
        }
        const intersection = this.nextIntersection;
        const turnNumber = sourceLane.getTurnDirection(nextLane);
        const sideId = sourceLane.road.targetSideId;
        return intersection.controlSignals.state[sideId][turnNumber];
    }

    getDistanceToIntersection() {
        const distance = this.current.lane.length - this.car.length / 2 - this.current.position;
        if (!this.isChangingLanes) {
            return Math.max(distance, 0);
        }
        return Infinity;
    }

    timeToMakeTurn(plannedStep) {
        if (plannedStep == null) {
            plannedStep = 0;
        }
        return this.getDistanceToIntersection() <= plannedStep;
    }

    moveForward(distance) {
        let ref, ref1;
        distance = Math.max(distance, 0);
        this.current.position += distance;
        this.next.position += distance;
        this.temp.position += distance;
        if (this.timeToMakeTurn() && this.canEnterIntersection() && this.isValidTurn()) this._startChangingLanes(this.car.popNextLane(), 0);

        const tempRelativePosition = this.temp.position / ((ref = this.temp.lane) != null ? ref.length : void 0);
        const gap = 2 * this.car.length;
        if (this.isChangingLanes && this.temp.position > gap && !this.current.free) this.current.release();

        if (this.isChangingLanes && this.next.free && this.temp.position + gap > ((ref1 = this.temp.lane) != null ? ref1.length : void 0)) this.next.acquire();
        if (this.isChangingLanes && tempRelativePosition >= 1) this._finishChangingLanes();
        if (this.current.lane && !this.isChangingLanes && !this.car.nextLane) return this.car.pickNextLane();
        return null;
    }

    changeLane(nextLane) {
        if (this.isChangingLanes) throw Error('already changing lane');
        if (nextLane == null) throw Error('no next lane');
        if (nextLane === this.lane) throw Error('next lane == current lane');
        if (this.lane.road !== nextLane.road) throw Error('not neighbouring lanes');
        const nextPosition = this.current.position + 3 * this.car.length;
        //if (!(nextPosition < this.lane.length)) throw Error('too late to change lane');
        return this._startChangingLanes(nextLane, nextPosition);
    }

    _getAdjacentLaneChangeCurve() {
        const p1 = this.current.lane.getPoint(this.current.relativePosition);
        const p2 = this.next.lane.getPoint(this.next.relativePosition);
        const distance = p2.subtract(p1).length;
        const direction1 = this.current.lane.middleLine.vector.normalized.mult(distance * 0.3);
        const control1 = p1.add(direction1);
        const direction2 = this.next.lane.middleLine.vector.normalized.mult(distance * 0.3);
        const control2 = p2.subtract(direction2);
        return new Curve(p1, p2, control1, control2);
    }

    _getCurve() {
        return this._getAdjacentLaneChangeCurve();
    }

    _startChangingLanes(nextLane, nextPosition) {
        if (this.isChangingLanes) {
            throw Error('already changing lane');
        }
        if (nextLane == null) {return 0;}
        this.isChangingLanes = true;
        //this.next.setlane(nextLane);
        this.next.lane = nextLane;
        this.next.position = nextPosition;
        const curve = this._getCurve();
        this.temp.lane = curve;
        this.temp.position = 0;
        return this.next.position -= this.temp.lane.length;
    }

    _finishChangingLanes() {
        if (!this.isChangingLanes){
            throw Error('no lane changing is going on');
        }
        this.isChangingLanes = false;
        this.current.lane = this.next.lane;
        this.current.position = this.next.position || 0;
        this.current.acquire();
        this.next.lane = null;
        this.next.position = NaN;
        this.temp.lane = null;
        this.temp.position = NaN;
        return this.current.lane;
    }

    release() {
        let ref, ref1, ref2;
        if ((ref = this.current) != null) ref.release();
        if ((ref1 = this.next) != null) ref1.release();
        return (ref2 = this.temp) != null ? ref2.release() : void 0;
    }
}
