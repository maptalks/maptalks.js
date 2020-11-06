import { vec3, mat4 } from 'gl-matrix';

const TEMP_MATRIX = [];
const IDENTITY_MATRIX = mat4.identity([]);

class BoundingBox {
    constructor(min, max) {
        this.min = min || [Infinity, Infinity, Infinity];
        this.max = max || [-Infinity, -Infinity, -Infinity];
        this.updateVertex();
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
        this.vertex = [
            [this.min[0], this.min[1], this.min[2]],
            [this.min[0], this.min[1], this.max[2]],
            [this.min[0], this.max[1], this.max[2]],
            [this.min[0], this.max[1], this.min[2]],
            [this.max[0], this.min[1], this.min[2]],
            [this.max[0], this.min[1], this.max[2]],
            [this.max[0], this.max[1], this.max[2]],
            [this.max[0], this.max[1], this.min[2]]
        ];
        return this.vertex;
    }

    copy() {
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
