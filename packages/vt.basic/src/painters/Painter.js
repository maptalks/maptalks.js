import { reshader, mat4 } from '@maptalks/gl';
import { StencilHelper } from '@maptalks/vt-plugin';
import { loadFunctionTypes } from '@maptalks/function-type';

const TEX_CACHE_KEY = '__gl_textures';

const MAT = [];

const level0Filter = mesh => {
    return mesh.uniforms['level'] === 0;
};

const levelNFilter = mesh => {
    return mesh.uniforms['level'] > 0;
};

class Painter {
    constructor(regl, layer, sceneConfig, pluginIndex) {
        this.regl = regl;
        this.layer = layer;
        this.canvas = layer.getRenderer().canvas;
        this.sceneConfig = sceneConfig || {};
        //插件的序号，也是style的序号
        this.pluginIndex = pluginIndex;
        this.scene = new reshader.Scene();
        this.pickingFBO = layer.getRenderer().pickingFBO;
        this._stencilHelper = new StencilHelper();
        this.level0Filter = level0Filter;
        this.levelNFilter = levelNFilter;
        this.loginTextureCache();
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
                redraw: false
            };
        }
        // if (this.needStencil) {
        //     this._stencil(context.quadStencil);
        // }

        if (this.scene.getMeshes().length) {
            this.regl.clear({
                stencil: 0xFF
            });
        }
        const uniforms = this.getUniformValues(map);

        this.callShader(uniforms, context);

        if (this.pickingFBO && this.pickingFBO._renderer === this.picking) {
            delete this.pickingFBO._renderer;
        }

        return {
            redraw: this._redraw
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

    pick(x, y, tolerance = 3) {
        if (!this.layer.options['picking'] || !this.sceneConfig.picking === false) {
            return null;
        }
        if (!this.pickingFBO || !this.picking) {
            return null;
        }
        const map = this.getMap();
        const uniforms = this.getUniformValues(map);
        if (this.pickingFBO._renderer !== this.picking) {
            this.picking.render(this.scene.getMeshes(), uniforms, true);
            this.pickingFBO = this.picking;
        }
        let picked = {};
        if (this.picking.getRenderedMeshes().length) {
            picked = this.picking.pick(x, y, tolerance, uniforms, {
                viewMatrix: map.viewMatrix,
                projMatrix: map.projMatrix,
                returnPoint: this.layer.options['pickingPoint'] && this.sceneConfig.pickingPoint !== false
            });
        }
        const { meshId, pickingId, point } = picked;
        const mesh = (meshId === 0 || meshId) && this.picking.getMeshAt(meshId);
        if (!mesh || !mesh.geometry) {
            //有可能mesh已经被回收，geometry不再存在
            return null;
        }
        const props = mesh.geometry.properties;
        return {
            data: props && props.features && props.features[pickingId],
            point
        };
    }

    updateSceneConfig(/* config */) {
    }

    deleteMesh(meshes, keepGeometry) {
        if (!meshes) {
            return;
        }
        this.scene.removeMesh(meshes);
        if (Array.isArray(meshes)) {
            for (let i = 0; i < meshes.length; i++) {
                if (!meshes[i].isValid()) {
                    continue;
                }
                const geometry = meshes[i].geometry;
                if (!keepGeometry && geometry) {
                    geometry.dispose();
                }
                if (meshes[i].material) {
                    meshes[i].material.dispose();
                }
                meshes[i].dispose();
            }
        } else {
            if (!meshes.isValid()) {
                return;
            }
            if (!keepGeometry && meshes.geometry) {
                meshes.geometry.dispose();
            }
            if (meshes.material) {
                meshes.material.dispose();
            }
            meshes.dispose();
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
        this.logoutTextureCache();
    }

    updateSymbol() {
        delete this._symbol;
    }

    getSymbol() {
        if (this._symbol) {
            return this._symbol;
        }
        const styles = this.layer.getCompiledStyle();
        this._symbol = loadFunctionTypes(styles[this.pluginIndex].symbol, () => {
            return [this.layer.getRenderer().getCurrentTileZoom()];
        });
        return this.getSymbol();
    }

    loginTextureCache() {
        const map = this.getMap();
        if (!map[TEX_CACHE_KEY]) {
            map[TEX_CACHE_KEY] = {
                count: 0
            };
        }
        map[TEX_CACHE_KEY].count++;
    }

    logoutTextureCache() {
        const map = this.getMap();
        const myTextures = this._myTextures;
        if (myTextures) {
            for (const url in myTextures) {
                if (myTextures.hasOwnProperty(url)) {
                    if (map[TEX_CACHE_KEY][url]) {
                        map[TEX_CACHE_KEY][url].count--;
                        if (map[TEX_CACHE_KEY][url].count <= 0) {
                            delete map[TEX_CACHE_KEY][url];
                        }
                    }
                }
            }
        }
        map[TEX_CACHE_KEY].count--;
        if (map[TEX_CACHE_KEY].count <= 0) {
            map[TEX_CACHE_KEY] = {};
        }
    }

    getCachedTexture(url) {
        const cached = this.getMap()[TEX_CACHE_KEY][url];
        return cached ? cached.data : null;
    }

    addCachedTexture(url, data) {
        let cached = this.getMap()[TEX_CACHE_KEY][url];
        if (!cached) {
            cached = this.getMap()[TEX_CACHE_KEY][url] = {
                data,
                count: 0
            };
        } else {
            cached.data = data;
        }
        if (!this._myTextures) {
            this._myTextures = {};
        }
        if (!cached.data.then && !this._myTextures[url]) {
            //不是promise时才计数，painter内部不管引用多少次，计数器只+1
            cached.count++;
            this._myTextures[url] = 1;
        }
    }

    disposeCachedTexture(texture) {
        let url;
        if (typeof texture === 'string') {
            url = texture;
        } else {
            url = texture.url;
        }
        if (!this._myTextures || !this._myTextures[url]) {
            return;
        }
        //删除texture时，同时回收cache上的纹理，尽量保证不出现内存泄漏
        //最常见场景： 更新material时，回收原有的texture
        delete this._myTextures[url];
        const map = this.getMap();
        if (map[TEX_CACHE_KEY][url]) {
            map[TEX_CACHE_KEY][url].count--;
            if (map[TEX_CACHE_KEY][url].count <= 0) {
                delete map[TEX_CACHE_KEY][url];
            }
        }
    }

    shouldDeleteMeshOnUpdateSymbol() {
        return true;
    }

    _stencil(quadStencil) {
        const meshes = this.scene.getMeshes();
        if (!meshes.length) {
            return;
        }
        const stencils = meshes.map(mesh => {
            return {
                transform: mesh.localTransform,
                level: mesh.getUniform('level'),
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
