import { vec3 } from 'gl-matrix';

const p0 = [], p1 = [];

class Scene {
    constructor(meshes) {
        this.meshes = Array.isArray(meshes) ? meshes : [meshes] || [];
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
            mesh.forEach(m => this.meshes.push(m));
        } else {
            this.meshes.push(mesh);
        }
        this.dirty();
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

        this._cameraPosition = cameraPosition;
        transparents.sort(this._compareBinded);
        delete this._mat;
        delete this._cameraPosition;

        this._dirty = false;

    }

    getSortedMeshes() {
        return this.sortedMeshes;
    }

    _compare(a, b) {
        vec3.transformMat4(p0, a.geometry.boundingBox.getCenter(), a.localTransform);
        vec3.transformMat4(p1, b.geometry.boundingBox.getCenter(), b.localTransform);
        return vec3.dist(p0, this._cameraPosition) - vec3.dist(p1, this._cameraPosition);
    }
}

export default Scene;
