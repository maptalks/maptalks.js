import { uniqueId, extend } from './Util.js';
import Lane from './Lane.js';

export default class Road {
    constructor(source, target, gridSize) {
        this.source = source;
        this.target = target;
        this.id = uniqueId('road');
        this.lanes = [];
        this.gridSize = gridSize || 32;
        this.lanesNumber = null;
        this.update();
    }

    get length() {
        return this.targetSide.target.subtract(this.sourceSide.source).length;
    }

    get leftmostLane() {
        return this.lanes[this.lanesNumber - 1];
    }

    get rightmostLane() {
        return this.lanes[0];
    }

    copy(road) {
        const result = Object.create(Road.prototype);
        extend.extend(result, road);
        if (result.lanes == null) {
            result.lanes = [];
        }
        return result;
    }

    toJSON() {
        return { id: this.id, source: this.source.id, target: this.target.id };
    }

    getTurnDirection(other) {
        if (this.target !== other.source) {
            throw Error('invalid roads');
        }
        const side1 = this.targetSideId;
        const side2 = other.sourceSideId;
        return (side2 - side1 - 1 + 8) % 4;
    }

    update() {
        let i, base, i1, j, ref, ref1;
        if (!(this.source && this.target)) {
            throw Error('incomplete road');
        }
        this.sourceSideId = this.source.rect.getSectorId(this.target.rect.center());
        this.sourceSide = this.source.rect.getSide(this.sourceSideId).subsegment(0.5, 1.0);
        this.targetSideId = this.target.rect.getSectorId(this.source.rect.center());
        this.targetSide = this.target.rect.getSide(this.targetSideId).subsegment(0, 0.5);
        this.lanesNumber = Math.min(this.sourceSide.length, this.targetSide.length) | 0;
        this.lanesNumber = Math.max(2, this.lanesNumber / this.gridSize | 0);
        const sourceSplits = this.sourceSide.split(this.lanesNumber, true);
        const targetSplits = this.targetSide.split(this.lanesNumber);
        if ((this.lanes == null) || this.lanes.length < this.lanesNumber) {
            if (this.lanes == null) this.lanes = [];
            for (i = i1 = 0, ref = this.lanesNumber - 1; 0 <= ref ? i1 <= ref : i1 >= ref; i = 0 <= ref ? ++i1 : --i1) {
                if ((base = this.lanes)[i] == null) base[i] = new Lane(sourceSplits[i], targetSplits[i], this);
            }
        }
        const results = [];
        for (i = j = 0, ref1 = this.lanesNumber - 1; 0 <= ref1 ? j <= ref1 : j >= ref1; i = 0 <= ref1 ? ++j : --j) {
            this.lanes[i].sourceSegment = sourceSplits[i];
            this.lanes[i].targetSegment = targetSplits[i];
            this.lanes[i].leftAdjacent = this.lanes[i + 1];
            this.lanes[i].rightAdjacent = this.lanes[i - 1];
            this.lanes[i].leftmostAdjacent = this.lanes[this.lanesNumber - 1];
            this.lanes[i].rightmostAdjacent = this.lanes[0];
            results.push(this.lanes[i].update());
        }
        return results;
    }
}
