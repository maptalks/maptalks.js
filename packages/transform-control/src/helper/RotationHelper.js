import { prepareMesh } from '../common/Util.js';

export default class RotationHelper {

    constructor(coordinate) {
        this._coordinate = coordinate;
        this._meshes = this._prepareMeshes();
    }

    setCoordinate(coordinate) {
        this._coordinate = coordinate;
    }

    _prepareMeshes() {
        const meshes = [];
        const scale = 340 / 177;
        const mesh = prepareMesh('xuanzhuan', [0, 0, 0], [180, 0, 0], [0.5 * scale, 0.5 * scale, 0.5 * scale], [50 / 255, 130 / 255, 184 / 255, 0.8], 11);
        meshes.push(mesh);
        return meshes;
    }

    getMeshes() {
        return this._meshes;
    }
}
