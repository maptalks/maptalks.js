import { vec3 } from 'gl-matrix';

class BoundingBox {
    constructor(min, max) {
        this.min = min || [Infinity, Infinity, Infinity];
        this.max = max || [-Infinity, -Infinity, -Infinity];
    }

    dirty() {
        this._dirty = true;
        return this;
    }

    /**
     * Get center of the bounding box
     * @returns {Number[]} center
     */
    getCenter() {
        if (!this.center) {
            this.center = [];
            this._dirty = true;
        }
        if (this._dirty) {
            vec3.add(this.center, this.min, this.max);
            vec3.scale(this.center, this.center, 0.5);
        }
        this._dirty = false;
        return this.center;
    }

    /**
     * If contain point entirely
     * @param  {Number[]} point
     * @return {Boolean}
     */
    containPoint(p) {
        const min = this.min;
        const max = this.max;

        return min[0] <= p[0] && min[1] <= p[1] && min[2] <= p[2] &&
            max[0] >= p[0] && max[1] >= p[1] && max[2] >= p[2];
    }

    /**
     * If bounding box is finite
     * @return {Boolean}
     */
    isFinite() {
        const min = this.min;
        const max = this.max;
        return isFinite(min[0]) && isFinite(min[1]) && isFinite(min[2]) &&
            isFinite(max[0]) && isFinite(max[1]) && isFinite(max[2]);
    }
}

export default BoundingBox;
