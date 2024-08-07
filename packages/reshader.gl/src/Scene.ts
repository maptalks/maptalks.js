import { vec3 } from 'gl-matrix';
import Mesh from './Mesh';

const P0: vec3 = [0, 0, 0], P1: vec3 = [0, 0, 0];
let uid = 0;

class Scene {
    //@internal
    _cameraPosition?: vec3
    //@internal
    _id: number
    //@internal
    _compareBinded: (a: Mesh, b: Mesh) => number
    sortedMeshes: { opaques?: Mesh[], transparents?: Mesh[] }
    sortFunction?: (a: Mesh, b: Mesh) => number
    meshes?: Mesh[]
    //@internal
    _dirty: boolean

    constructor(meshes) {
        this._id = uid++;
        this.sortedMeshes = {};
        this.setMeshes(meshes);
        this._compareBinded = this._compare.bind(this);
        this.dirty();
    }

    setMeshes(meshes?: Mesh | Mesh[]) {
        this.clear();
        if (!meshes || (Array.isArray(meshes) && !meshes.length) || meshes === this.meshes) {
            return this;
        }
        meshes = Array.isArray(meshes) ? meshes : [meshes];
        this.meshes = [];
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i] as any;
            if (!mesh) {
                continue;
            }
            mesh._scenes = mesh._scenes || {};
            mesh._scenes[this._id] = 1;
            this.meshes.push(mesh);
        }
        this.dirty();
        return this;
    }

    addMesh(mesh: Mesh | Mesh[]) {
        if (!mesh || (Array.isArray(mesh) && !mesh.length)) {
            return this;
        }
        if (Array.isArray(mesh)) {
            mesh.forEach(m => {
                const scenes = (m as any)._scenes = (m as any)._scenes || {};
                if (!scenes[this._id]) {
                    scenes[this._id] = 1;
                    this.meshes.push(m);
                    this.dirty();
                }
            });
        } else {
            const scenes = (mesh as any)._scenes = (mesh as any)._scenes || {};
            if (!scenes[this._id]) {
                scenes[this._id] = 1;
                this.meshes.push(mesh);
                this.dirty();
            }
        }
        return this;
    }

    removeMesh(mesh?: Mesh | Mesh[]) {
        if (!mesh || (Array.isArray(mesh) && !mesh.length)) { return this; }
        if (Array.isArray(mesh)) {
            let hit = false;
            for (let i = 0; i < mesh.length; i++) {
                const scenes = (mesh[i] as any)._scenes;
                if (scenes && scenes[this._id]) {
                    hit = true;
                    this.dirty();
                    delete scenes[this._id];
                }
            }
            if (hit) {
                this.meshes = this.meshes.filter(el => {
                    return mesh.indexOf(el) < 0;
                });
            }
        } else {
            const scenes = (mesh as any)._scenes;
            if (!scenes || !scenes[this._id]) {
                return this;
            }
            const idx = this.meshes.indexOf(mesh);
            if (idx >= 0) {
                this.meshes.splice(idx, 1);
            }
            delete scenes[this._id];
            this.dirty();
        }
        return this;
    }

    getMeshes() {
        return this.meshes || [];
    }

    clear() {
        if (this.meshes) {
            for (let i = 0; i < this.meshes.length; i++) {
                delete (this.meshes[i] as any)._scenes[this._id];
            }
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

    sortMeshes(cameraPosition?: vec3) {
        const meshes = this.meshes;
        if (this.sortFunction) {
            meshes.sort(this.sortFunction);
        }

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

    getSortedMeshes(): { opaques?: Mesh[], transparents?: Mesh[] } {
        if (this._dirty) {
            this.sortMeshes();
        }
        return this.sortedMeshes || {};
    }

    //@internal
    _compare(a: Mesh, b: Mesh) {
        vec3.transformMat4(P0, a.geometry.boundingBox.getCenter(), a.localTransform);
        vec3.transformMat4(P1, b.geometry.boundingBox.getCenter(), b.localTransform);
        return vec3.dist(P1, this._cameraPosition) - vec3.dist(P0, this._cameraPosition);
    }
}

export default Scene;
