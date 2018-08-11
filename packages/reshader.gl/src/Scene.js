class Scene {
    constructor(meshes) {
        this.meshes = Array.isArray(meshes) ? meshes : [meshes] || [];
        this.dirty();
    }

    setMeshes(meshes) {
        this.meshes = Array.isArray(meshes) ? meshes : [meshes];
        this.dirty();
        return this;
    }

    addMesh(mesh) {
        if (Array.isArray(mesh)) {
            mesh.forEach(m => this.meshes.push(m));
        } else {
            this.meshes.push(mesh);
        }
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
        // 即使是opaques，渲染顺序也不能随便改变，因为可能有stencil测试，或者depthMask等会因渲染顺序影响渲染效果的设置
        // opaques.sort((a, b) => {
        //     if (a.getDefinesKey() === b.getDefinesKey()) {
        //         return 0;
        //     }
        //     return 1;
        // });
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
