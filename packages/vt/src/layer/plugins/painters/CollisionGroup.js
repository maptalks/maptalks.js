export default class CollisionGroup {
    constructor(meshes) {
        this._meshes = meshes || [];
        this.properties = {};
    }

    set meshes(m) {
        this._meshes = m;
    }

    get meshes() {
        return this._meshes;
    }
}
