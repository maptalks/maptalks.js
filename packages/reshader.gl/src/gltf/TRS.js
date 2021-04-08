import { mat4, vec3, quat } from 'gl-matrix';
const EMPTY_TRANS = [0, 0, 0], EMPTY_ROTATION = [0, 0, 0, 1], EMPTY_SCALE = [1, 1, 1], EMPTY_MAT = [];
export default class TRS {
    constructor(translation = [0, 0, 0], rotation = [0, 0, 0, 1], scale = [1, 1, 1]) {
        this.translation = translation;
        this.rotation = rotation;
        this.scale = scale;
    }

    getMatrix() {
        return mat4.fromRotationTranslationScale(EMPTY_MAT, this.rotation, this.translation, this.scale);
    }

    decompose(matrix) {
        mat4.getTranslation(this.translation, matrix);
        mat4.getRotation(this.rotation, matrix);
        mat4.getScaling(this.scale, matrix);
    }

    update(animation) {
        if (!animation) {
            return;
        }
        if (animation.translation && !vec3.equals(animation.translation, EMPTY_TRANS)) {
            vec3.copy(this.translation, animation.translation);
        }
        if (animation.rotation && !quat.equals(animation.rotation, EMPTY_ROTATION)) {
            quat.copy(this.rotation, animation.rotation);
        }
        if (animation.scale && !vec3.equals(animation.scale, EMPTY_SCALE)) {
            vec3.copy(this.scale, animation.scale);
        }
    }
}
