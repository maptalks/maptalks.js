import { extend } from './Util.js';
import Segment from './Segment.js';

export default class Lane {
    constructor(sourceSegment, targetSegment, road) {
        this.sourceSegment = sourceSegment;
        this.targetSegment = targetSegment;
        this.road = road;
        this.leftAdjacent = null;
        this.rightAdjacent = null;
        this.leftmostAdjacent = null;
        this.rightmostAdjacent = null;
        this.carsPositions = {};
        this.update();
    }

    get sourceSideId() {
        return this.road.sourceSideId;
    }

    get targetSideId() {
        return this.road.targetSideId;
    }

    get isRightmost() {
        return this === this.rightmostAdjacent;
    }

    get isLeftmost() {
        return this === this.leftmostAdjacent;
    }

    get leftBorder() {
        return new Segment(this.sourceSegment.source, this.targetSegment.target);
    }

    get rightBorder() {
        return new Segment(this.sourceSegment.target, this.targetSegment.source);
    }

    toJSON() {
        const obj = extend({}, this);
        delete obj.carsPositions;
        return obj;
    }

    update() {
        this.middleLine = new Segment(this.sourceSegment.center, this.targetSegment.center);
        this.length = this.middleLine.length;
        return this.direction = this.middleLine.direction;
    }

    getTurnDirection(other) {
        if (!other) {
            return 1;
        } else {
            return this.road.getTurnDirection(other.road);
        }
    }

    getDirection() {
        return this.direction;
    }

    getPoint(a) {
        return this.middleLine.getPoint(a);
    }

    addCarPosition(carPosition) {
        if (carPosition.id in this.carsPositions) {
            throw Error('car is already here');
        }
        return this.carsPositions[carPosition.id] = carPosition;
    }

    removeCar(carPosition) {
        if (!(carPosition.id in this.carsPositions)) {
            throw Error('removing unknown car');
        }
        return delete this.carsPositions[carPosition.id];
    }

    getNext(carPosition) {
        if (carPosition.lane !== this) {
            throw Error('car is on other lane');
        }
        let next = null;
        let bestDistance = Infinity;
        const ref = this.carsPositions;
        for (const id in ref) {
            const o = ref[id];
            const distance = o.position - carPosition.position;
            if (!o.free && (0 < distance && distance < bestDistance)) {
                bestDistance = distance;
                next = o;
            }
        }
        return next;
    }
}
