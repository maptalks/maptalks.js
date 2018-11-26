import { reshader, mat4 } from '@maptalks/gl';
import { extend } from '../Util';
import { StencilHelper } from '@maptalks/vt-plugin';

const mat = [];

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
        if (sceneConfig.picking !== false) {
            this.pickingFBO = layer.getRenderer().pickingFBO;
        }
        this._stencilHelper = new StencilHelper();
        this.level0Filter = level0Filter;
        this.levelNFilter = levelNFilter;
        this.init();
    }

    needToRedraw() {
        throw new Error('not implemented');
    }

    createGeometry(glData, features, tile) {
        const packs = glData.packs;
        if (!packs || !packs.length) {
            return [];
        }
        const sr = this.layer.getSpatialReference(),
            res = sr.getResolution(tile.z);
        const regl = this.regl;
        let iconAtlas, glyphAtlas;
        if (glData.iconAtlas) {
            const image = glData.iconAtlas.image;
            iconAtlas = regl.texture({
                width : image.width,
                height : image.height,
                data : image.data,
                format : image.format,
                mag : 'linear', //very important
                min : 'linear', //very important
                flipY : false,
            });
        }
        if (glData.glyphAtlas) {
            const sdf = glData.glyphAtlas.image;
            glyphAtlas = regl.texture({
                width : sdf.width,
                height : sdf.height,
                data : sdf.data,
                format : sdf.format,
                mag : 'linear', //very important
                min : 'linear', //very important
                flipY : false,
            });
        }

        const geometries = [];
        for (let i = 0; i < packs.length; i++) {
            const data = extend({}, packs[i].data);
            data.aPickingId = data.featureIndexes;
            delete data.featureIndexes;
            const geometry = new reshader.Geometry(data, packs[i].indices);
            geometry.properties = {
                features,
                iconAtlas,
                glyphAtlas,
                res,
                z : tile.z,
                tileRatio : this.layer.options.extent / this.layer.getTileSize().width
            };
            geometries.push(geometry);
        }
        return geometries;
    }

    createMesh(/* geometries, transform */) {
        throw new Error('not implemented');
    }

    addMesh(meshes) {
        this.scene.addMesh(meshes);
        return meshes;
    }

    render(context) {
        return this.paint(context);
    }

    paint(context) {
        this._redraw = false;
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

        return {
            redraw : false
        };
    }

    callShader(uniforms) {
        //1. render current tile level's meshes
        this._shader.filter = this.level0Filter;
        this._renderer.render(this._shader, uniforms, this.scene);

        //2. render background tile level's meshes
        //stenciled pixels already rendered in step 1
        this._shader.filter = this.levelNFilter;
        this._renderer.render(this._shader, uniforms, this.scene);
    }

    pick(x, y) {
        if (!this.pickingFBO) {
            return null;
        }
        const map = this.layer.getMap();
        const uniforms = this.getUniformValues(map);
        this.picking.render(this.scene.getMeshes(), uniforms);
        const { meshId, pickingId, point } = this.picking.pick(x, y, uniforms, {
            viewMatrix : map.viewMatrix,
            projMatrix : map.projMatrix,
            returnPoint : true
        });
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

    clear() {
        this.scene.clear();
    }

    resize() {}

    delete(context) {
        this.remove(context);
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
        const projViewMatrix = this.layer.getMap().projViewMatrix;
        this._stencilHelper.start(quadStencil);
        const painted = {};
        for (let i = 0; i < stencils.length; i++) {
            const mesh = stencils[i].mesh;
            let id = painted[mesh.properties.tile.dupKey];
            if (id === undefined) {
                mat4.multiply(mat, projViewMatrix, stencils[i].transform);
                id = this._stencilHelper.write(quadStencil, mat);
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
