import type LanePosition from "./LanePosition";
import type Road from "./Road";
import Segment from "./Segment";

export default class Lane {
  length: number;
  sourceSegment: Segment;
  targetSegment: Segment;
  road: Road;
  leftAdjacent: Lane;
  rightAdjacent: Lane;
  leftmostAdjacent: Lane | null = null;
  rightmostAdjacent: Lane | null = null;
  middleLine: Segment;
  private direction: number;
  private carsPositions: Record<string, LanePosition> = {};

  constructor(sourceSegment: Segment, targetSegment: Segment, road: Road) {
    this.sourceSegment = sourceSegment;
    this.targetSegment = targetSegment;
    this.road = road;
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
    const obj: Lane = Object.assign({}, this);
    delete obj.carsPositions;
    return obj;
  }

  update() {
    this.middleLine = new Segment(
      this.sourceSegment.center,
      this.targetSegment.center
    );
    this.length = this.middleLine.length;
    return (this.direction = this.middleLine.direction);
  }

  getTurnDirection(other: Lane) {
    if (!other) {
      return 1;
    } else {
      return this.road.getTurnDirection(other.road);
    }
  }

  getDirection() {
    return this.direction;
  }

  getPoint(a: number) {
    return this.middleLine.getPoint(a);
  }

  addCarPosition(carPosition: LanePosition) {
    if (carPosition.id in this.carsPositions) {
      throw Error("car is already here");
    }
    return (this.carsPositions[carPosition.id] = carPosition);
  }

  removeCar(carPosition: LanePosition) {
    if (!(carPosition.id in this.carsPositions)) {
      throw Error("removing unknown car");
    }
    return delete this.carsPositions[carPosition.id];
  }

  getNext(carPosition: LanePosition) {
    if (carPosition.lane !== this) {
      throw Error("car is on other lane");
    }
    let next: LanePosition | null = null;
    let bestDistance = Infinity;
    const ref = this.carsPositions;
    for (const id in ref) {
      const o = ref[id];
      const distance = o.position - carPosition.position;
      if (!o.free && 0 < distance && distance < bestDistance) {
        bestDistance = distance;
        next = o;
      }
    }
    return next;
  }
}
