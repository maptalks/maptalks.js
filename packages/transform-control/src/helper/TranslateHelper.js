import { prepareMesh } from '../common/Util.js';

export default class TranslateHelper {
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
        const right = prepareMesh('jiantou', [1.2 * scale, 0, 0], [0, 0, 90], [scale, scale, scale], [89 / 255, 206 / 255, 147 / 255, 0], 7);
        const bottom = prepareMesh('jiantou', [0, 1.2 * scale, 0], [0, 0, 180], [scale, scale, scale], [89 / 255, 206 / 255, 147 / 255, 0], 8);
        const left = prepareMesh('jiantou', [-1.2 * scale, 0, 0], [0, 0, 270], [scale, scale, scale], [89 / 255, 206 / 255, 147 / 255, 0], 9);
        const up = prepareMesh('jiantou', [0, -1.2 * scale, 0], [0, 0, 0], [scale, scale, scale], [89 / 255, 206 / 255, 147 / 255, 0], 10);
        meshes.push(right, bottom, left, up);
        return meshes;
    }

    getMeshes() {
        return this._meshes;
    }
}
