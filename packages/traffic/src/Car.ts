
import { rand, uniqueId, sample } from './Util.js';
import Trajectory from './Trajectory.js';

const TYPE_OF_CARS = [];
export default class Car {
    constructor(lane, position) {
        this.type = rand(TYPE_OF_CARS.length - 1);
        this.id = uniqueId('car');
        this.color = (300 + 240 * Math.random() | 0) % 360;
        this.tmpSpeed = 0;
        this.width = 2;
        this.length = 2;
        this.maxSpeed = 30;
        this.s0 = 2;
        this.timeHeadway = 1.5;
        this.maxAcceleration = 1;
        this.maxDeceleration = 3;
        this.trajectory = new Trajectory(this, lane, position);
        this.alive = true;
        this.preferedLane = null;
    }

    get coords() {
        return this.trajectory.coords;
    }

    get speed() {
        return this.tmpSpeed;
    }

    set speed(speed) {
        if (speed < 0) {
            speed = 0;
        }
        if (speed > this.maxSpeed) {
            speed = this.maxSpeed;
        }
        this.tmpSpeed = speed;
    }

    get direction() {
        return this.trajectory.direction;
    }

    release() {
        return this.trajectory.release();
    }

    getAcceleration() {
        let ref;
        const nextCarDistance = this.trajectory.nextCarDistance;
        const distanceToNextCar = Math.max(nextCarDistance.distance, 0);
        const a = this.maxAcceleration;
        const b = this.maxDeceleration;
        const deltaSpeed = (this.speed - ((ref = nextCarDistance.car) != null ? ref.speed : void 0)) || 0;
        const freeRoadCoeff = Math.pow(this.speed / this.maxSpeed, 4);
        const distanceGap = this.s0;
        const timeGap = this.speed * this.timeHeadway;
        const breakGap = this.speed * deltaSpeed / (2 * Math.sqrt(a * b));
        const safeDistance = distanceGap + timeGap + breakGap;
        const busyRoadCoeff = Math.pow(safeDistance / distanceToNextCar, 2);
        const safeIntersectionDistance = 1 + timeGap + Math.pow(this.speed, 2) / (2 * b);
        const intersectionCoeff = Math.pow(safeIntersectionDistance / this.trajectory.distanceToStopLine, 2);
        const coeff = 1 - freeRoadCoeff - busyRoadCoeff - intersectionCoeff;
        return this.maxAcceleration * coeff;
    }

    move(delta) {
        const acceleration = this.getAcceleration();
        this.speed += acceleration * delta;
        if (!this.trajectory.isChangingLanes && this.nextLane) {
            const currentLane = this.trajectory.current.lane;
            const turnNumber = currentLane.getTurnDirection(this.nextLane);
            const preferedLane = (function () {
                switch (turnNumber) {
                case 0:
                    return currentLane.leftmostAdjacent;
                case 2: return currentLane.rightmostAdjacent;
                default: return currentLane;
                }
            })();
            if (preferedLane !== currentLane) {
                this.trajectory.changeLane(preferedLane);
            }
        }
        const step = this.speed * delta + 0.5 * acceleration * Math.pow(delta, 2);
        if (this.trajectory.nextCarDistance.distance < step) console.log('bad IDM');
        if (this.trajectory.timeToMakeTurn(step)) {
            if (this.nextLane == null) {
                this.alive = false;
                return this.alive;
            }
        }
        return this.trajectory.moveForward(step);
    }

    pickNextRoad() {
        const intersection = this.trajectory.nextIntersection;
        const currentLane = this.trajectory.current.lane;
        const possibleRoads = intersection.roads.filter(function (x) {
            return x.target !== currentLane.road.source;
        });
        if (possibleRoads.length === 0) return null;
        const nextRoad = sample(possibleRoads);
        return nextRoad;
    }

    pickNextLane() {
        if (this.nextLane) throw Error('next lane is already chosen');
        this.nextLane = null;
        const nextRoad = this.pickNextRoad();
        if (!nextRoad) return null;
        const turnNumber = this.trajectory.current.lane.road.getTurnDirection(nextRoad);
        const laneNumber = (function () {
            switch (turnNumber) {
            case 0: return nextRoad.lanesNumber - 1;
            case 1: return rand(0, nextRoad.lanesNumber - 1);
            case 2: return 0;
            }
            return null;
        })();
        this.nextLane = nextRoad.lanes[laneNumber];
        return this.nextLane;
    }

    popNextLane() {
        const nextLane = this.nextLane;
        this.nextLane = null;
        this.preferedLane = null;
        return nextLane;
    }
}
