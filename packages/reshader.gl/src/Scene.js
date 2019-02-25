import { vec3 } from 'gl-matrix';

const P0 = [], P1 = [];
let uid = 0;

class Scene {
    constructor(meshes) {
        this._id = uid++;
        this.meshes = Array.isArray(meshes) ? meshes : meshes ? [meshes] : [];
        this.sortedMeshes = {
            opaques : [],
            transparents : []
        };
        this._compareBinded = this._compare.bind(this);
        this.dirty();
    }

    setMeshes(meshes) {
        this.meshes = Array.isArray(meshes) ? meshes : [meshes];
        this.dirty();
        return this;
    }

    addMesh(mesh) {
        if (Array.isArray(mesh)) {
            mesh.forEach(m => {
                if (!m._scenes) {
                    m._scenes = {};
                }
                if (!m._scenes[this._id]) {
                    m._scenes[this._id] = 1;
                    this.meshes.push(m);
                }
            });
        } else {
            if (!mesh._scenes) {
                mesh._scenes = {};
            }
            if (!mesh._scenes[this._id]) {
                mesh._scenes[this._id] = 1;
                this.meshes.push(mesh);
            }
        }
        this.dirty();
        return this;
    }

    removeMesh(mesh) {
        if (Array.isArray(mesh)) {
            this.meshes = this.meshes.filter(el => {
                return mesh.indexOf(el) < 0;
            });
            for (let i = 0; i < mesh.length; i++) {
                delete mesh[i]._scenes[this._id];
            }
            this.sortMeshes();
        } else {
            const idx = this.meshes.indexOf(mesh);
            const oIdx = this.sortedMeshes.opaques.indexOf(mesh);
            const tIdx = this.sortedMeshes.transparents.indexOf(mesh);
            this.meshes.splice(idx, 1);
            this.sortedMeshes.opaques.splice(oIdx, 1);
            this.sortedMeshes.transparents.splice(tIdx, 1);
            delete mesh._scenes[this._id];
        }
        return this;
    }

    getMeshes() {
        return this.meshes;
    }

    clear() {
        for (let i = 0; i < this.meshes.length; i++) {
            delete this.meshes[i]._scenes[this._id];
        }
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
                    transparents.push(meshes[i]);
                } else {
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
        vec3.transformMat4(P0, a.geometry.boundingBox.getCenter(), a.localTransform);
        vec3.transformMat4(P1, b.geometry.boundingBox.getCenter(), b.localTransform);
        return vec3.dist(P1, this._cameraPosition) - vec3.dist(P0, this._cameraPosition);
    }
}

export default Scene;
