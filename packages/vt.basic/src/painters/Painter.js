import { reshader, mat4 } from '@maptalks/gl';
import { extend } from '../Util';
import { StencilHelper } from '@maptalks/vt-plugin';
import collisionVert from './glsl/collision.vert';
import collisionFrag from './glsl/collision.frag';

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

    createGeometry(glData, features) {
        const packs = glData.packs;
        if (!packs || !packs.length) {
            return [];
        }
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
                glyphAtlas
            };
            geometries.push(geometry);
        }
        return geometries;
    }

    createMesh(/* geometries, transform */) {
        throw new Error('not implemented');
    }

    addMesh(meshes) {
        // console.log(meshes.map(m => m.properties.tile.id).join());
        // if (meshes[0].properties.tile.id === 'road_name__214293__438808__20') {
        //     this.scene.addMesh(meshes);
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

        this._renderCollisionBox();

        return {
            redraw : this._redraw
        };
    }

    setToRedraw() {
        this._redraw = true;
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
        this._redraw = false;
        this.scene.clear();
    }

    resize() {}

    delete(context) {
        if (this._collisionMesh) {
            this._collisionMesh.geometry.dispose();
            this._collisionShader.dispose();
            this._collisionMesh.dispose();
            delete this._collisionMesh;
            delete this._collisionShader;
            delete this._collisionRenderer;
        }
        this.remove(context);
    }

    isCollides(box) {
        const map = this.layer.getMap();
        if (map.isOffscreen(box)) {
            return true;
        }
        const collisionIndex = this.layer.getCollisionIndex();
        return collisionIndex.collides(box);
    }

    insertCollisionBox(box) {
        const collisionIndex = this.layer.getCollisionIndex();
        collisionIndex.insertBox(box.slice(0));
    }

    addCollisionDebugBox(boxes, visible) {
        const allBoxes = this._collisionBoxes = this._collisionBoxes || {
            aPosition : [],
            aVisible : [],
            indices : []
        };
        const map = this.layer.getMap();
        for (let i = 0; i < boxes.length; i++) {
            const box = boxes[i];
            if (map.isOffscreen(box)) {
                continue;
            }
            const count = allBoxes.aPosition.length / 2;
            allBoxes.aPosition.push(
                box[0], box[1], box[2], box[1],
                box[2], box[3], box[0], box[3]
            );
            allBoxes.aVisible.push(visible, visible, visible, visible);
            allBoxes.indices.push(
                count, count + 1,
                count + 1, count + 2,
                count + 2,
                count + 3,
                count + 3, count
            );
        }

    }

    _renderCollisionBox() {
        if (!this._collisionBoxes || !this.layer.options['debugCollision']) {
            return;
        }
        if (!this._collisionRenderer) {
            this._initCollisionShader();
        }
        const { aPosition, aVisible, indices } = this._collisionBoxes;
        if (!this._collisionMesh) {
            const geometry = new reshader.Geometry(
                {
                    aPosition : [],
                    aVisible: []
                },
                [],
                0,
                {
                    positionSize : 2,
                    primitive : 'lines'
                }
            );

            this._collisionMesh = new reshader.Mesh(geometry);
            this._collisionScene = new reshader.Scene();
            this._collisionScene.addMesh(this._collisionMesh);
        }
        // debugger
        const geometry = this._collisionMesh.geometry;
        geometry.updateData('aPosition', new Float32Array(aPosition));
        geometry.updateData('aVisible', new Uint8Array(aVisible));
        geometry.setElements(indices);

        this._collisionRenderer.render(
            this._collisionShader,
            {
                size : [this.canvas.width, this.canvas.height]
            },
            this._collisionScene
        );
        delete this._collisionBoxes;
    }

    _initCollisionShader() {
        const regl = this.regl;

        this._collisionRenderer = new reshader.Renderer(regl);

        const canvas = this.canvas;
        const viewport = {
            x : 0,
            y : 0,
            width : () => {
                return canvas ? canvas.width : 1;
            },
            height : () => {
                return canvas ? canvas.height : 1;
            }
        };
        this._collisionShader = new reshader.MeshShader({
            vert : collisionVert, frag : collisionFrag,
            uniforms : [
                'size'
            ],
            extraCommandProps : {
                viewport,
                depth : {
                    enable : false,
                }
            }
        });

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
