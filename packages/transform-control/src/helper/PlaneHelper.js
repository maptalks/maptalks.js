import { prepareMesh } from '../common/Util.js';

export default class PlaneHelper {
    constructor(coordinate) {
        this._coordinate = coordinate;
        this._meshes = this._prepareMeshes();
    }

    setCoordinate(coordinate) {
        this._coordinate = coordinate;
    }

    _prepareMeshes() {
        const meshes = [];
        const mesh = prepareMesh('plane', [0, 0, 0], [0, 0, 0], [10, 10, 10], [1, 0, 0, 0.5], 16);
        meshes.push(mesh);
        return meshes;
    }

    getMeshes() {
        return this._meshes;
    }
}
