class BoundingBox {
    constructor(min, max) {
        this.min = min || [Infinity, Infinity, Infinity];
        this.max = max || [-Infinity, -Infinity, -Infinity];
    }

    /**
     * If contain point entirely
     * @param  {Number[]} point
     * @return {Boolean}
     */
    containPoint(p) {
        var min = this.min;
        var max = this.max;

        return min[0] <= p[0] && min[1] <= p[1] && min[2] <= p[2] &&
            max[0] >= p[0] && max[1] >= p[1] && max[2] >= p[2];
    }

    /**
     * If bounding box is finite
     * @return {Boolean}
     */
    isFinite() {
        var min = this.min;
        var max = this.max;
        return isFinite(min[0]) && isFinite(min[1]) && isFinite(min[2]) &&
            isFinite(max[0]) && isFinite(max[1]) && isFinite(max[2]);
    }
}

export default BoundingBox;
