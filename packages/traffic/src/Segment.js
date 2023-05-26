export default class Segment {
    constructor(source, target) {
        this.source = source;
        this.target = target;
    }

    get vector() {
        return this.target.subtract(this.source);
    }

    get length() {
        return this.vector.length;
    }

    get direction() {
        return this.vector.direction;
    }

    get center() {
        return this.getPoint(0.5);
    }

    split(n, reverse) {
        let k, m, len, ref, results, results1;
        const order = reverse ? (function() {
            results = [];
            for (let i = ref = n - 1; ref <= 0 ? i <= 0 : i >= 0; ref <= 0 ? i++ : i--){ results.push(i); }
            return results;
        }).apply(this) : (function() {
            results1 = [];
            for (let j = 0, ref1 = n - 1; 0 <= ref1 ? j <= ref1 : j >= ref1; 0 <= ref1 ? j++ : j--){ results1.push(j); }
            return results1;
        }).apply(this);
        const results2 = [];
        for (m = 0, len = order.length; m < len; m++) {
            k = order[m];
            results2.push(this.subsegment(k / n, (k + 1) / n));
        }
        return results2;
    }

    getPoint(atPoint) {
        return this.source.add(this.vector.mult(atPoint));
    }

    subsegment(a, b) {
        const offset = this.vector;
        const start = this.source.add(offset.mult(a));
        const end = this.source.add(offset.mult(b));
        return new Segment(start, end);
    }
}
