import { prepareMesh } from '../common/Util.js';

export default class XyzScaleHelper {

    constructor(coordinate) {
        this._coordinate = coordinate;
        this._meshes = this._prepareMeshes();
    }

    setCoordinate(coordinate) {
        this._coordinate = coordinate;
    }

    _prepareMeshes() {
        const meshes = [];
        const mesh = prepareMesh('xyzScale', [0, 0, 0], [0, 0, 0], [2, 2, 2], null, 113);
        meshes.push(mesh);
        return meshes;
    }

    getMeshes() {
        return this._meshes;
    }
}
