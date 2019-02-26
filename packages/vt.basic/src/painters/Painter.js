import { reshader, mat4 } from '@maptalks/gl';
import { StencilHelper } from '@maptalks/vt-plugin';

const MAT = [];

const level0Filter = mesh => {
    return mesh.uniforms['level'] === 0;
};

const levelNFilter = mesh => {
    return mesh.uniforms['level'] > 0;
};

class Painter {
    constructor(regl, layer, sceneConfig) {
        this.regl = regl;
        this.layer = layer;
        this.canvas = layer.getRenderer().canvas;
        this.sceneConfig = sceneConfig || {};
        this.scene = new reshader.Scene();
        if (this.sceneConfig.picking !== false) {
            this.pickingFBO = layer.getRenderer().pickingFBO;
        }
        this._stencilHelper = new StencilHelper();
        this.level0Filter = level0Filter;
        this.levelNFilter = levelNFilter;
        this.init();
    }

    getMap() {
        return this.layer ? this.layer.getMap() : null;
    }

    needToRedraw() {
        return this._redraw;
    }

    createGeometry(/* glData, features */) {
        throw new Error('not implemented');
    }

    createMesh(/* geometries, transform */) {
        throw new Error('not implemented');
    }

    addMesh(meshes) {
        // console.log(meshes.map(m => m.properties.tile.id).join());
        // if (meshes[0].properties.tile.id === 'data_vt__85960__140839__19') {
        //     console.log(meshes[0].properties.tile.z, meshes[0].properties.level);
        //     this.scene.addMesh(meshes[0]);
        // }
        this.scene.addMesh(meshes);
        return meshes;
    }

    render(context) {
        this.preparePaint(context);
        return this.paint(context);
    }

    preparePaint() {}

    paint(context) {
        const layer = this.layer;
        const map = layer.getMap();
        if (!map) {
            return {
                redraw : false
            };
        }
        if (this.needStencil) {
            this._stencil(context.quadStencil);
        }

        this.regl.clear({
            stencil: 0xFF
        });
        const uniforms = this.getUniformValues(map);

        this.callShader(uniforms, context);

        this._pickingRendered = false;

        return {
            redraw : this._redraw
        };
    }

    setToRedraw() {
        this._redraw = true;
    }

    callShader(uniforms, context) {
        this.callCurrentTileShader(uniforms, context);
        this.callBackgroundTileShader(uniforms, context);
    }

    callCurrentTileShader(uniforms) {
        //1. render current tile level's meshes
        this.shader.filter = this.level0Filter;
        this.renderer.render(this.shader, uniforms, this.scene);
    }

    callBackgroundTileShader(uniforms) {
        //2. render background tile level's meshes
        //stenciled pixels already rendered in step 1
        this.shader.filter = this.levelNFilter;
        this.renderer.render(this.shader, uniforms, this.scene);
    }

    pick(x, y) {
        if (!this.pickingFBO || !this.picking) {
            return null;
        }
        const map = this.getMap();
        const uniforms = this.getUniformValues(map);
        if (!this._pickingRendered) {
            this.picking.render(this.scene.getMeshes(), uniforms, true);
            this._pickingRendered = true;
        }
        let picked = {};
        if (this.picking.getRenderedMeshes().length) {
            picked = this.picking.pick(x, y, uniforms, {
                viewMatrix : map.viewMatrix,
                projMatrix : map.projMatrix,
                returnPoint : true
            });
        }
        const { meshId, pickingId, point } = picked;
        const mesh = (meshId === 0 || meshId) && this.picking.getMeshAt(meshId);
        if (!mesh) {
            return null;
        }
        return {
            feature : mesh.geometry.properties.features[pickingId],
            point
        };
    }

    updateSceneConfig(/* config */) {
    }

    deleteMesh(meshes) {
        if (!meshes) {
            return;
        }
        this.scene.removeMesh(meshes);
        for (let i = 0; i < meshes.length; i++) {
            meshes[i].geometry.dispose();
            meshes[i].material.dispose();
            meshes[i].dispose();
        }
    }

    startFrame() {
        this._redraw = false;
        this.scene.clear();
    }

    resize() {}

    delete(/* context */) {
        this.scene.clear();
        this.shader.dispose();
        if (this.picking) {
            this.picking.dispose();
        }
    }

    _stencil(quadStencil) {
        const meshes = this.scene.getMeshes();
        if (!meshes.length) {
            return;
        }
        const stencils = meshes.map(mesh => {
            return {
                transform : mesh.localTransform,
                level : mesh.getUniform('level'),
                mesh
            };
        }).sort(this._compareStencil);
        const projViewMatrix = this.getMap().projViewMatrix;
        this._stencilHelper.start(quadStencil);
        const painted = {};
        for (let i = 0; i < stencils.length; i++) {
            const mesh = stencils[i].mesh;
            let id = painted[mesh.properties.tile.dupKey];
            if (id === undefined) {
                mat4.multiply(MAT, projViewMatrix, stencils[i].transform);
                id = this._stencilHelper.write(quadStencil, MAT);
                painted[mesh.properties.tile.dupKey] = id;
            }
            // stencil ref value
            mesh.setUniform('ref', id);
        }
        this._stencilHelper.end(quadStencil);
        //TODO 因为stencilHelper会改变 gl.ARRAY_BUFFER 和 vertexAttribPointer 的值，需要重刷regl状态
        //记录 array_buffer 和 vertexAttribPointer 后， 能省略掉 _refresh
        this.regl._refresh();
    }

    _compareStencil(a, b) {
        return b.level - a.level;
    }
}

export default Painter;
