import { prepareMesh } from '../common/Util.js';
export default class ScalingHelper {
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
        const mesh = prepareMesh('yuanhuan', [0, 0, 0], [0, 0, 0], [0.5 * scale, 0.5 * scale, 0.5 * scale], [149 / 255, 179 / 255, 199 / 255, 0.5], 12);
        meshes.push(mesh);
        return meshes;
    }

    getMeshes() {
        return this._meshes;
    }
}
