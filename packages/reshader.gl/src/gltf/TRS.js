import { mat4 } from 'gl-matrix';
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
}
