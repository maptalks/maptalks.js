class Scene {
    constructor(meshes) {
        this.meshes = meshes;
        this.dirty = true;
    }

    addMesh(mesh) {
        this.meshes.push(mesh);
        this.dirty = true;
        return this;
    }

    getMeshes() {
        if (this.dirty) {
            this._sortMeshes();
        }
        return this.sortedMeshes;
    }

    _sortMeshes() {
        const meshes = this.meshes;
        //sort meshes by defines
        const opaques = [];
        const transparents = [];
        for (let i = 0, l = meshes.length; i < l; i++) {
            if (meshes[i].transparent) {
                transparents.push(meshes[i]);
            } else {
                opaques.push(meshes[i]);
            }
        }
        opaques.sort((a, b) => {
            if (a.material.getDefinesKey() === b.material.getDefinesKey()) {
                return 0;
            }
            return 1;
        });
        // transparents.sort((a, b) => {
        //     //TODO 根据距离camera的距离来排序
        // });
        this.sortedMeshes = {
            opaques,
            transparents
        };
        this.dirty = false;
    }
}

export default Scene;
