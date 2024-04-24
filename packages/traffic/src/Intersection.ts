import { uniqueId, extend } from './Util.js';
import Rect from './Rect.js';
import ControlSignals from './ControlSignals.js';

export default class Intersection {
    constructor(rect) {
        this.rect = rect;
        this.id = uniqueId('intersection');
        this.roads = [];
        this.inRoads = [];
        this.controlSignals = new ControlSignals(this);
    }

    copy(intersection) {
        intersection.rect = Rect.copy(intersection.rect);
        const result = Object.create(Intersection.prototype);
        extend(result, intersection);
        result.roads = [];
        result.inRoads = [];
        result.controlSignals = new ControlSignals(result);
        return result;
    }

    toJSON() {
        return { id: this.id, rect: this.rect };
    }

    update() {
        let road, i, j, len, len1;
        const ref = this.roads;
        for (i = 0, len = ref.length; i < len; i++) {
            road = ref[i];
            road.update();
        }
        const ref1 = this.inRoads;
        const results = [];
        for (j = 0, len1 = ref1.length; j < len1; j++) {
            road = ref1[j];
            results.push(road.update());
        }
        return results;
    }
}
