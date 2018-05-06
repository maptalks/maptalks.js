class Scene {
    constructor(meshes) {
        this.meshes = meshes;
        this.dirty();
    }

    setMeshes(meshes) {
        this.meshes = meshes;
        this.dirty();
        return this;
    }

    addMesh(mesh) {
        this.meshes.push(mesh);
        this.dirty();
        return this;
    }

    getMeshes() {
        this._sortMeshes();
        return this.sortedMeshes || [];
    }

    clear() {
        this.meshes = [];
        this.dirty();
        return this;
    }

    dirty() {
        this._dirty = true;
        return this;
    }

    _sortMeshes() {
        if (!this._dirty) {
            return;
        }
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
            if (a.material && b.material && a.material.getDefinesKey() === b.material.getDefinesKey()) {
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
        this._dirty = false;
    }
}

export default Scene;
