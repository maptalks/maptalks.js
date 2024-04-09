import { vec3, mat4 } from 'gl-matrix';

const TEMP_MATRIX = [];
const IDENTITY_MATRIX = mat4.identity([]);

const TEMP_BBOX = { min: [], max: [] };

class BoundingBox {
    constructor(min, max) {
        this.min = min || [Infinity, Infinity, Infinity];
        this.max = max || [-Infinity, -Infinity, -Infinity];
        this.updateVertex();
    }

    static copy(out, bbox) {
        vec3.copy(out.min, bbox.min);
        vec3.copy(out.max, bbox.max);
        for (let i = 0; i < bbox.vertex.length; i++) {
            vec3.copy(out.vertex[i], bbox.vertex[i]);
        }
        return out;
    }

    combine(bbox) {
        if (!bbox) {
            return this;
        }
        if (Array.isArray(bbox)) {
            vec3.copy(TEMP_BBOX.min, bbox[0]);
            vec3.copy(TEMP_BBOX.max, bbox[1]);
            bbox = TEMP_BBOX;
        }
        if (bbox.min[0] < this.min[0]) {
            this.min[0] = bbox.min[0];
            this._dirty = true;
        }
        if (bbox.min[1] < this.min[1]) {
            this.min[1] = bbox.min[1];
            this._dirty = true;
        }
        if (bbox.min[2] < this.min[2]) {
            this.min[2] = bbox.min[2];
            this._dirty = true;
        }
        if (bbox.max[0] > this.max[0]) {
            this.max[0] = bbox.max[0];
            this._dirty = true;
        }
        if (bbox.max[1] > this.max[1]) {
            this.max[1] = bbox.max[1];
            this._dirty = true;
        }
        if (bbox.max[2] > this.max[2]) {
            this.max[2] = bbox.max[2];
            this._dirty = true;
        }
        return this;
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

    updateVertex() {
        if (!this.vertex) {
            this.vertex = [];
            for (let i = 0; i < 8; i++) {
                this.vertex.push([]);
            }
        }
        this.vertex[0][0] = this.min[0];
        this.vertex[0][1] = this.min[1];
        this.vertex[0][2] = this.min[2];

        this.vertex[1][0] = this.min[0];
        this.vertex[1][1] = this.min[1];
        this.vertex[1][2] = this.max[2];

        this.vertex[2][0] = this.min[0];
        this.vertex[2][1] = this.max[1];
        this.vertex[2][2] = this.max[2];

        this.vertex[3][0] = this.min[0];
        this.vertex[3][1] = this.max[1];
        this.vertex[3][2] = this.min[2];

        this.vertex[4][0] = this.max[0];
        this.vertex[4][1] = this.min[1];
        this.vertex[4][2] = this.min[2];

        this.vertex[5][0] = this.max[0];
        this.vertex[5][1] = this.min[1];
        this.vertex[5][2] = this.max[2];

        this.vertex[6][0] = this.max[0];
        this.vertex[6][1] = this.max[1];
        this.vertex[6][2] = this.max[2];

        this.vertex[7][0] = this.max[0];
        this.vertex[7][1] = this.max[1];
        this.vertex[7][2] = this.min[2];
        return this.vertex;
    }

    copy(out) {
        if (out) {
            return BoundingBox.copy(out, this);
        }
        return new BoundingBox(this.min.slice(), this.max.slice());
    }

    equals(box) {
        if (!vec3.equals(this.min, box.min) || !vec3.equals(this.max, box.max)) {
            return false;
        }
        const vertex = box.vertex;
        for (let i = 0; i < this.vertex.length; i++) {
            if (!vec3.equals(vertex[i], this.vertex[i])) {
                return false;
            }
        }
        return true;
    }

    transform(positionMatrix, modelMatrix) {
        positionMatrix = positionMatrix || IDENTITY_MATRIX;
        modelMatrix = modelMatrix || IDENTITY_MATRIX;
        if (!modelMatrix[1] && !modelMatrix[2] && !modelMatrix[4] && !modelMatrix[6] && !modelMatrix[8] && !modelMatrix[9]) {
            const matrix = mat4.multiply(TEMP_MATRIX, modelMatrix, positionMatrix);
            vec3.transformMat4(this.min, this.min, matrix);
            vec3.transformMat4(this.max, this.max, matrix);
        } else {
            const boxVertex = this.vertex;
            const matrix = mat4.multiply(TEMP_MATRIX, modelMatrix, positionMatrix);
            for (let i = 0; i < boxVertex.length; i++) {
                vec3.transformMat4(this.vertex[i], this.vertex[i], matrix);
            }
            const xVertex = this.vertex.map(v => v[0]);
            const yVertex = this.vertex.map(v => v[1]);
            const zVertex = this.vertex.map(v => v[2]);
            const minX = Math.min(...xVertex), maxX = Math.max(...xVertex);
            const minY = Math.min(...yVertex), maxY = Math.max(...yVertex);
            const minZ = Math.min(...zVertex), maxZ = Math.max(...zVertex);
            vec3.set(this.min, minX, minY, minZ);
            vec3.set(this.max, maxX, maxY, maxZ);
        }
        return this;
    }
}

export default BoundingBox;
