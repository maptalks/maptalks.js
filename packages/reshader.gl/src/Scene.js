import { vec3 } from 'gl-matrix';

const p0 = [], p1 = [];

const IDX_KEY = '__scene_idx',
    OPAQUES_KEY = '__scene_o_idx',
    TRANSPARENTS_KEY = '__scene_t_idx';

class Scene {
    constructor(meshes) {
        this.meshes = Array.isArray(meshes) ? meshes : meshes ? [meshes] : [];
        this.sortedMeshes = {
            opaques : [],
            transparents : []
        };
        this._compareBinded = this._compare.bind(this);
        this.dirty();
        this._tag(this.meshes, IDX_KEY);
    }

    setMeshes(meshes) {
        this.meshes = Array.isArray(meshes) ? meshes : [meshes];
        this.dirty();
        this._tag(this.meshes, IDX_KEY);
        return this;
    }

    addMesh(mesh) {
        if (Array.isArray(mesh)) {
            mesh.forEach(m => {
                m[IDX_KEY] = this.meshes.length;
                this.meshes.push(m);
            });
        } else {
            mesh[IDX_KEY] = this.meshes.length;
            this.meshes.push(mesh);
        }
        this.dirty();
        return this;
    }

    removeMesh(mesh) {
        //ugly codes to save cost as possible
        if (Array.isArray(mesh)) {
            let hit0, hit1, hit2;
            mesh.sort(sort0);
            for (let i = 0; i < mesh.length; i++) {
                if (this.meshes[mesh[i][IDX_KEY]] === mesh[i]) {
                    hit0 = true;
                    this.meshes.splice(mesh[i][IDX_KEY], 1);
                }
            }

            mesh.sort(sort1);
            for (let i = 0; i < mesh.length; i++) {
                if (this.sortedMeshes.opaques[mesh[i][OPAQUES_KEY]] === mesh[i]) {
                    hit1 = true;
                    this.sortedMeshes.opaques.splice(mesh[i][OPAQUES_KEY], 1);
                }
            }

            mesh.sort(sort2);
            for (let i = 0; i < mesh.length; i++) {
                if (this.sortedMeshes.transparents[mesh[i][TRANSPARENTS_KEY]] === mesh[i]) {
                    hit2 = true;
                    this.sortedMeshes.transparents.splice(mesh[i][TRANSPARENTS_KEY], 1);
                }
            }
            if (hit0) this._tag(this.meshes, IDX_KEY);
            if (hit1) this._tag(this.sortedMeshes.opaques, OPAQUES_KEY);
            if (hit2) this._tag(this.sortedMeshes.transparents, TRANSPARENTS_KEY);
        } else {
            if (this.meshes[mesh[IDX_KEY]] === mesh) {
                this.meshes.splice(mesh[IDX_KEY], 1);
                this._tag(this.meshes, IDX_KEY);
            }
            if (this.sortedMeshes.opaques[mesh[OPAQUES_KEY]] === mesh) {
                this.sortedMeshes.opaques.splice(mesh[OPAQUES_KEY], 1);
                this._tag(this.sortedMeshes.opaques, OPAQUES_KEY);
            } else if (this.sortedMeshes.opaques[mesh[TRANSPARENTS_KEY]] === mesh) {
                this.sortedMeshes.transparents.splice(mesh[TRANSPARENTS_KEY], 1);
                this._tag(this.sortedMeshes.transparents, TRANSPARENTS_KEY);
            }
        }
        return this;
    }

    getMeshes() {
        return this.meshes;
    }

    clear() {
        this.meshes = [];
        this.sortedMeshes.opaques = [];
        this.sortedMeshes.transparents = [];
        return this;
    }

    dirty() {
        this._dirty = true;
        return this;
    }

    sortMeshes(cameraPosition) {
        const meshes = this.meshes;

        //sort meshes by defines
        let transparents = this.sortedMeshes.transparents;
        if (this._dirty) {
            const opaques = this.sortedMeshes.opaques = [];
            transparents = this.sortedMeshes.transparents = [];
            for (let i = 0, l = meshes.length; i < l; i++) {
                if (meshes[i].transparent) {
                    meshes[i][TRANSPARENTS_KEY] = transparents.length;
                    transparents.push(meshes[i]);
                } else {
                    meshes[i][OPAQUES_KEY] = opaques.length;
                    opaques.push(meshes[i]);
                }
            }
        }

        // 即使是opaques，渲染顺序也不能随便改变，因为可能有stencil测试，或者depthMask等会因渲染顺序影响渲染效果的设置
        // opaques.sort((a, b) => {
        //     if (a.getDefinesKey() === b.getDefinesKey()) {
        //         return 0;
        //     }
        //     return 1;
        // });
        if (cameraPosition && transparents.length > 1) {
            this._cameraPosition = cameraPosition;
            transparents.sort(this._compareBinded);
            delete this._cameraPosition;
        }

        this._dirty = false;
    }

    getSortedMeshes() {
        if (this._dirty) {
            this.sortMeshes();
        }
        return this.sortedMeshes;
    }

    _compare(a, b) {
        vec3.transformMat4(p0, a.geometry.boundingBox.getCenter(), a.localTransform);
        vec3.transformMat4(p1, b.geometry.boundingBox.getCenter(), b.localTransform);
        return vec3.dist(p1, this._cameraPosition) - vec3.dist(p0, this._cameraPosition);
    }

    _tag(meshes, key) {
        for (let i = 0; i < meshes.length; i++) {
            meshes[i][key] = i;
        }
    }
}

export default Scene;

//sort by IDX_KEY
function sort0(a, b) {
    return b[IDX_KEY] - a[IDX_KEY];
}

//sort by OPAQUES_KEY
function sort1(a, b) {
    return b[OPAQUES_KEY] - a[OPAQUES_KEY];
}

//sort by TRANSPARENTS_KEY
function sort2(a, b) {
    return b[TRANSPARENTS_KEY] - a[TRANSPARENTS_KEY];
}
