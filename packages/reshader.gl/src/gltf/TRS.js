import { mat4, vec3, quat } from 'gl-matrix';
const EMPTY_TRANS = [0, 0, 0], EMPTY_ROTATION = [0, 0, 0, 1], EMPTY_SCALE = [1, 1, 1];
const trans = [0, 0, 0];
const rotation = [0, 0, 0, 1];
const scale = [1, 1, 1];
export default class TRS {
    constructor(translation = [0, 0, 0], rotation = [0, 0, 0, 1], scale = [1, 1, 1]) {
        this.translation = translation;
        this.rotation = rotation;
        this.scale = scale;
    }

    setMatrix(dst) {
        dst = dst || [];
        mat4.fromRotationTranslationScale(dst, this.rotation, this.translation, this.scale);
        return dst;
    }

    decompose(matrix) {
        mat4.getTranslation(this.translation, matrix);
        mat4.getRotation(this.rotation, matrix);
        mat4.getScaling(this.scale, matrix);
    }

    update(animMatrix) {
        mat4.getTranslation(trans, animMatrix);
        mat4.getRotation(rotation, animMatrix);
        mat4.getScaling(scale, animMatrix);
        if (!vec3.equals(trans, EMPTY_TRANS)) {
            vec3.copy(this.translation, trans);
        }
        if (!quat.equals(rotation, EMPTY_ROTATION)) {
            quat.copy(this.rotation, rotation);
        }
        if (!vec3.equals(scale, EMPTY_SCALE)) {
            vec3.copy(this.scale, scale);
        }
    }
}
