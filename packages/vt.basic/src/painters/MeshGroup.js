export default class MeshGroup {
    constructor(meshes) {
        this._meshes = meshes;
    }

    set meshes(m) {
        this._meshes = m;
    }

    get meshes() {
        return this._meshes;
    }
}
