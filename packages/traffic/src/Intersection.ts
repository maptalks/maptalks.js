import ControlSignals from "./ControlSignals";
import Rect from "./Rect";
import Road from "./Road";
import { uniqueId } from "./Util";

export default class Intersection {
  id = uniqueId("intersection");
  rect: Rect;
  controlSignals: ControlSignals;
  roads: Road[];
  inRoads: Road[];
  connectRoads?: Road[];

  constructor(rect: Rect) {
    this.rect = rect;
    this.roads = [];
    this.inRoads = [];
    this.controlSignals = new ControlSignals(this);
  }

  static copy(intersection: Intersection) {
    intersection.rect = Rect.copy(intersection.rect);
    const result: Intersection = Object.create(Intersection.prototype);
    Object.assign(result, intersection);
    result.roads = [];
    result.inRoads = [];
    result.controlSignals = new ControlSignals(result);
    return result;
  }

  toJSON() {
    return { id: this.id, rect: this.rect };
  }

  update() {
    let road: Road, i: number, j: number, len: number, len1: number;
    const ref = this.roads;
    for (i = 0, len = ref.length; i < len; i++) {
      road = ref[i];
      road.update();
    }
    const ref1 = this.inRoads;
    const results: number[][] = [];
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      road = ref1[j];
      results.push(road.update());
    }
    return results;
  }
}
