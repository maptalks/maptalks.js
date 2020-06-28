import { reshader, mat4 } from '@maptalks/gl';
import { StencilHelper } from '@maptalks/vt-plugin';
import { loadFunctionTypes } from '@maptalks/function-type';
import { extend } from '../Util';
import hightlightFrag from './glsl/highlight.frag';
import { OFFSET_FACTOR_SCALE } from './Constant';

const TEX_CACHE_KEY = '__gl_textures';

const MAT = [];

const level0Filter = mesh => {
    return mesh.getUniform('level') === 0;
};

const levelNFilter = mesh => {
    return mesh.getUniform('level') > 0;
};

class Painter {
    constructor(regl, layer, symbol, sceneConfig, pluginIndex) {
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
        this.symbolDef = symbol;
        this.pickingViewport = {
            x: 0,
            y: 0,
            width: () => {
                return this.canvas ? this.canvas.width : 1;
            },
            height: () => {
                return this.canvas ? this.canvas.height : 1;
            }
        };
        this.sortByCommandKey = sortByCommandKey.bind(this);
    }

    getMap() {
        return this.layer ? this.layer.getMap() : null;
    }

    isVisible() {
        const visible = this.getSymbol().visible;
        return visible !== false && visible !== 0;
    }

    needToRedraw() {
        return this._redraw;
    }

    needToRetireFrames() {
        return this._needRetire;
    }

    fillIncludes(defines, uniformDeclares, context) {
        const includes = context && context.includes;
        if (includes) {
            for (const p in includes) {
                if (includes[p]) {
                    if (context[p].uniformDeclares) {
                        uniformDeclares.push(...context[p].uniformDeclares);
                    }
                    if (context[p].defines) {
                        extend(defines, context[p].defines);
                    }
                }
            }
        }
    }

    setIncludeUniformValues(uniforms, context) {
        const includes = context && context.includes;
        if (includes) {
            for (const p in includes) {
                if (includes[p]) {
                    if (context[p].renderUniforms) {
                        extend(uniforms, context[p].renderUniforms);
                    }
                }
            }
        }
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
        this.pluginIndex = context.pluginIndex;
        if (this._currentTimestamp !== context.timestamp) {
            this.preparePaint(context);
            this._currentTimestamp = context.timestamp;
        }
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
        this._renderContext = context;

        const uniforms = this.getUniformValues(map, context);

        this.callShader(uniforms, context);

        if (this.pickingFBO && this.pickingFBO._renderer === this.picking) {
            delete this.pickingFBO._renderer;
        }

        return {
            redraw: this._redraw
        };
    }

    setToRedraw(needRetireFrames) {
        if (needRetireFrames) {
            this._needRetire = needRetireFrames;
        }
        this._redraw = true;
    }

    callShader(uniforms, context) {
        this.callCurrentTileShader(uniforms, context);
        this.callBackgroundTileShader(uniforms, context);
    }

    callCurrentTileShader(uniforms, context) {
        if (this.shader) {
            //1. render current tile level's meshes
            this.shader.filter = context.sceneFilter ? [this.level0Filter, context.sceneFilter] : this.level0Filter;
        }
        this.callRenderer(uniforms, context);
    }

    callBackgroundTileShader(uniforms, context) {
        if (this.shader) {
            //2. render background tile level's meshes
            //stenciled pixels already rendered in step 1
            this.shader.filter = context.sceneFilter ? [this.levelNFilter, context.sceneFilter] : this.levelNFilter;
        }
        this.callRenderer(uniforms, context);
    }

    callRenderer(uniforms, context) {
        this.renderer.render(this.shader, uniforms, this.scene, this.getRenderFBO(context));
    }

    getRenderFBO(context) {
        return context && context.renderTarget && context.renderTarget.fbo;
    }

    getPolygonOffset() {
        const layer = this.layer;
        return {
            factor: () => { return Math.floor(-OFFSET_FACTOR_SCALE * (layer.getPolygonOffset() + this.pluginIndex + 1) / layer.getTotalPolygonOffset()); },
            // factor: () => { return -(layer.getPolygonOffset() + this.pluginIndex + 1) * 2; },
            units: () => { return -(layer.getPolygonOffset() + this.pluginIndex + 1); }
        };
    }

    pick(x, y, tolerance = 3) {
        if (!this.layer.options['picking'] || this.sceneConfig.picking === false) {
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
        let props = mesh.geometry.properties;
        if (!props.features) {
            //GLTFPhongPainter中，因为geometry是gltf数据，由全部的tile共享，features是存储在mesh上的
            props = mesh.properties;
        }
        if (point && point.length) {
            point[0] = Math.round(point[0] * 1E5) / 1E5;
            point[1] = Math.round(point[1] * 1E5) / 1E5;
            point[2] = Math.round(point[2] * 1E5) / 1E5;
        }
        return {
            data: props && props.features && props.features[pickingId],
            point,
            plugin: this.pluginIndex,
            meshId,
            pickingId
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
                meshes[i]['___debug__disposed_by_painter'] = 1;
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
            meshes['___debug__disposed_by_painter'] = 1;
        }
    }

    startFrame(context) {
        if (!this._inited) {
            this.init(context);
            this._inited = true;
        }
        if (this._currentTimestamp !== context.timestamp) {
            this._redraw = false;
            this._needRetire = false;
        }
        this.scene.clear();
    }

    resize(/*width, height*/) {}

    delete(/* context */) {
        this.scene.clear();
        if (this.shader) {
            this.shader.dispose();
        }
        if (this.picking) {
            this.picking.dispose();
        }
        if (this._highlightShader) {
            this._highlightShader.dispose();
        }
        this.logoutTextureCache();
    }

    updateSymbol(symbolDef) {
        // const styles = this.layer.getCompiledStyle();
        // this.symbolDef = styles[this.pluginIndex].symbol;
        this.symbolDef = symbolDef;
        if (!this._symbol) {
            return;
        }
        for (const p in this._symbol) {
            delete this._symbol[p];
        }
        // extend(this._symbol, this.symbolDef);
        const loadedSymbol = loadFunctionTypes(this.symbolDef, () => {
            return [this.getMap().getZoom()];
        });
        for (const p in loadedSymbol) {
            const d = Object.getOwnPropertyDescriptor(loadedSymbol, p);
            if (d.get) {
                Object.defineProperty(this._symbol, p, {
                    get: d.get,
                    set: d.set,
                    configurable: true,
                    enumerable: true
                });
            } else {
                this._symbol[p] = loadedSymbol[p];
            }
        }
    }

    getSymbol() {
        if (this._symbol) {
            return this._symbol;
        }
        this._symbol = loadFunctionTypes(extend({}, this.symbolDef), () => {
            return [this.getMap().getZoom()];
        });
        this._symbol.def = this.symbolDef;
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
        const map = this.getMap();
        let cached = map[TEX_CACHE_KEY][url];
        if (!cached) {
            cached = map[TEX_CACHE_KEY][url] = {
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
        return false;
    }

    needClearStencil() {
        return false;
    }

    needAA() {
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
            let id = painted[mesh.properties.tile.id];
            if (id === undefined) {
                mat4.multiply(MAT, projViewMatrix, stencils[i].transform);
                id = this._stencilHelper.write(quadStencil, MAT);
                painted[mesh.properties.tile.id] = id;
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

    highlight(picked, color) {
        if (!this._highlightShader) {
            this._highlightScene = new reshader.Scene();
            this._initHighlightShader();
            if (!this._highlightShader) {
                console.warn(`Plugin at ${this.pluginIndex} doesn't support highlight.`);
                return;
            }
        }
        const uniforms = this.getUniformValues(this.getMap(), this._renderContext);
        uniforms.highlightPickingId = picked.pickingId;
        uniforms.highlightColor = color || [0, 1, 0, 0.1];
        this._highlightScene.setMeshes(this.picking.getMeshAt(picked.meshId));
        this.renderer.render(this._highlightShader, uniforms, this._highlightScene);
    }

    highlightAll(color) {
        if (!this._highlightShader) {
            this._initHighlightShader();
            if (!this._highlightShader) {
                console.warn(`Plugin at ${this.pluginIndex} doesn't support highlight.`);
                return;
            }
        }
        const uniforms = this.getUniformValues(this.getMap(), this._renderContext);
        uniforms.highlightPickingId = -1;
        uniforms.highlightColor = color || [0, 1, 0, 0.1];
        this.renderer.render(this._highlightShader, uniforms, this.scene);
    }

    _initHighlightShader() {

        if (!this.picking) {
            return;
        }
        const canvas = this.layer.getRenderer().canvas;
        const pickingVert = this.picking.getPickingVert();
        const defines = {
            'ENABLE_PICKING': 1,
            'HAS_PICKING_ID': 1
        };
        const uniforms = this.picking.getUniformDeclares().slice(0);
        if (uniforms['uPickingId'] !== undefined) {
            defines['HAS_PICKING_ID'] = 2;
        }
        uniforms.push('highlightPickingId', 'highlightColor');
        this._highlightShader = new reshader.MeshShader({
            vert: pickingVert,
            frag: hightlightFrag,
            uniforms,
            defines,
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width: () => {
                        return canvas.width;
                    },
                    height: () => {
                        return canvas.height;
                    }
                },
                depth: {
                    enable: true,
                    mask: false,
                    func: 'always'
                },
                blend: {
                    enable: true,
                    func: {
                        src: 'src alpha',
                        dst: 'one minus src alpha'
                    },
                    equation: 'add'
                }
            }
        });
    }
}

export default Painter;

function sortByCommandKey(a, b) {
    const k1 = a && a.getCommandKey(this.regl) || '';
    const k2 = b && b.getCommandKey(this.regl) || '';
    return k1.localeCompare(k2);
}
