import type Intersection from "./Intersection";

export default class ControlSignals {
  private flipMultiplier = 1 + (Math.random() * 0.4 - 0.2);
  private time = 0;
  private stateNum = 0;
  private lightsFlipInterval = 20;
  private states = [
    ["L", "", "L", ""],
    ["FR", "", "FR", ""],
    ["", "L", "", "L"],
    ["", "FR", "", "FR"],
  ];
  private intersection: Intersection;

  constructor(intersection: Intersection) {
    this.intersection = intersection;
  }

  get flipInterval() {
    return this.flipMultiplier * this.lightsFlipInterval;
  }

  get state() {
    let stringState = this.states[this.stateNum % this.states.length];
    if (this.intersection.roads.length <= 2) {
      stringState = ["LFR", "LFR", "LFR", "LFR"];
    }
    const results: number[][] = [];
    for (let i = 0, len = stringState.length; i < len; i++) {
      const x = stringState[i];
      results.push(this.decode(x));
    }
    return results;
  }

  decode(str: string) {
    const state = [0, 0, 0];
    const indexOf =
      [].indexOf ||
      function (item) {
        for (let i = 0, l = this.length; i < l; i++) {
          if (i in this && this[i] === item) return i;
        }
        return -1;
      };
    if (indexOf.call(str, "L") >= 0) state[0] = 1;
    if (indexOf.call(str, "F") >= 0) state[1] = 1;
    if (indexOf.call(str, "R") >= 0) state[2] = 1;
    return state;
  }

  flip() {
    return (this.stateNum += 1);
  }

  onTick(delta: number) {
    this.time += delta;
    if (this.time > this.flipInterval) {
      this.flip();
      return (this.time -= this.flipInterval);
    }
    return null;
  }
}
