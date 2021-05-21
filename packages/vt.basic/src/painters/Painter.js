import { reshader, mat4 } from '@maptalks/gl';
import { StencilHelper } from '@maptalks/vt-plugin';
import { loadFunctionTypes, isFunctionDefinition, interpolated } from '@maptalks/function-type';
import { extend, isNil } from '../Util';
import outlineFrag from './glsl/outline.frag';
import { updateOneGeometryFnTypeAttrib } from './util/fn_type_util';

const { createIBLTextures, disposeIBLTextures } = reshader.pbr.PBRUtils;

const TEX_CACHE_KEY = '__gl_textures';

const MAT = [];

const level0Filter = mesh => {
    return mesh.getUniform('level') === 0;
};

const levelNFilter = mesh => {
    return mesh.getUniform('level') > 0;
};

class Painter {
    constructor(regl, layer, symbol, sceneConfig, pluginIndex, dataConfig) {
        this.regl = regl;
        this.layer = layer;
        this.canvas = layer.getRenderer().canvas;
        this.sceneConfig = sceneConfig || {};
        this.dataConfig = dataConfig || {};
        //插件的序号，也是style的序号
        this.pluginIndex = pluginIndex;
        this.scene = new reshader.Scene();
        this.pickingFBO = layer.getRenderer().pickingFBO;
        this._stencilHelper = new StencilHelper();
        this.level0Filter = level0Filter;
        this.levelNFilter = levelNFilter;
        this.loginTextureCache();
        this.symbolDef = Array.isArray(symbol) ? symbol : [symbol];
        this._compileSymbols();
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
        this._colorCache = {};
    }

    getMap() {
        return this.layer ? this.layer.getMap() : null;
    }

    isVisible() {
        //TODO visibleFn没有支持多symbol
        // if (this._visibleFn && !this._visibleFn.isFeatureConstant) {
        //     return true;
        // }
        const visibleFns = this._visibleFn;
        if (visibleFns.length) {
            for (let i = 0; i < visibleFns.length; i++) {
                if (visibleFns[i] && !visibleFns[i].isFeatureConstant) {
                    return true;
                }
            }
        }
        const symbols = this.getSymbols();
        for (let i = 0; i < symbols.length; i++) {
            const visible = symbols[i].visible;
            if (visible !== false && visible !== 0) {
                return true;
            }
        }
        return false;
    }

    isMeshVisible(mesh) {
        const symbolIndex = mesh && mesh.properties && mesh.properties.symbolIndex;
        if (!symbolIndex) {
            return false;
        }
        const visibleFns = this._visibleFn;
        const i = symbolIndex.index;
        let visible;
        if (visibleFns[i]) {
            if (!visibleFns[i].isFeatureConstant) {
                return true;
            } else {
                visible = visibleFns[i](this.getMap().getZoom());
            }
        } else {
            visible = this.getSymbol(symbolIndex).visible;
        }
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

    prepareGeometry(glData, features) {
        const geometry = this.createGeometry(glData, features);
        if (Array.isArray(geometry)) {
            for (let i = 0; i < geometry.length; i++) {
                const { pickingIdMap, idPickingMap, hasFeaIds } = this._getIdMap(glData[i]);
                if (geometry[i] && geometry[i].geometry) {
                    const props = geometry[i].geometry.properties;
                    props.features = features;
                    if (hasFeaIds) {
                        props.feaIdPickingMap = pickingIdMap;
                        props.feaPickingIdMap = idPickingMap;
                    }
                }
            }
        } else if (geometry && geometry.geometry) {
            const { pickingIdMap, idPickingMap, hasFeaIds } = this._getIdMap(glData);
            const props = geometry.geometry.properties;
            props.features = features;
            if (hasFeaIds) {
                props.feaIdPickingMap = pickingIdMap;
                props.feaPickingIdMap = idPickingMap;
            }
        }
        return geometry;
    }

    _getIdMap(glData) {
        if (!glData) {
            return {};
        }
        if (Array.isArray(glData)) {
            glData = glData[0];
            if (!glData) {
                return {};
            }
        }
        var feaIds = glData.featureIds;
        var idPickingMap = {};
        var pickingIdMap = {};
        var hasFeaIds = feaIds && feaIds.length;
        if (hasFeaIds) {
            for (let i = 0; i < feaIds.length; i++) {
                idPickingMap[glData.data.aPickingId[i]] = feaIds[i];
                pickingIdMap[feaIds[i]] = glData.data.aPickingId[i];
            }
        }
        return { hasFeaIds, idPickingMap, pickingIdMap };
    }

    createGeometry(/* glData, features */) {
        throw new Error('not implemented');
    }

    createMesh(/* geometries, transform */) {
        throw new Error('not implemented');
    }

    isBloom(mesh) {
        return !!this.getSymbol(mesh.properties.symbolIndex)['bloom'];
    }

    addMesh(meshes) {
        // console.log(meshes.map(m => m.properties.tile.id).join());
        // if (meshes[0].properties.tile.id === 'data_vt__85960__140839__19') {
        //     console.log(meshes[0].properties.tile.z, meshes[0].properties.level);
        //     this.scene.addMesh(meshes[0]);
        // }
        if (Array.isArray(meshes)) {
            meshes = meshes.filter(m => this.isMeshVisible(m));
        } else if (!this.isMeshVisible(meshes)) {
            return;
        }

        if (Array.isArray(meshes)) {
            meshes.forEach(mesh => {
                const bloom = this.isBloom(mesh);
                const defines = mesh.defines || {};
                if (!!defines['HAS_BLOOM'] !== bloom) {
                    if (bloom) {
                        defines['HAS_BLOOM'] = 1;
                    } else {
                        delete defines['HAS_BLOOM'];
                    }
                    mesh.setDefines(defines);
                }
            });
        } else {
            const bloom = this.isBloom(meshes);
            const defines = meshes.defines || {};
            if (!!defines['HAS_BLOOM'] !== !!bloom) {
                if (bloom) {
                    defines['HAS_BLOOM'] = 1;
                } else {
                    delete defines['HAS_BLOOM'];
                }
                meshes.setDefines(defines);
            }
        }

        this.scene.addMesh(meshes);
        return;
    }

    updateCollision(/*context*/) {

    }

    render(context) {
        this.pluginIndex = context.pluginIndex;
        this.polygonOffsetIndex = context.polygonOffsetIndex;
        return this.paint(context);
    }

    prepareRender(context) {
        if (this._currentTimestamp === context.timestamp) {
            return;
        }
        this._currentTimestamp = context.timestamp;
        if (!this.createFnTypeConfig) {
            return;
        }
        const meshes = this.scene.getMeshes();
        if (!meshes || !meshes.length) {
            return;
        }
        const z = this.getMap().getZoom();
        for (let i = 0; i < meshes.length; i++) {
            if (!meshes[i] || !meshes[i].geometry) {
                continue;
            }
            const { symbolIndex } = meshes[i].properties;
            const symbolDef = this.getSymbolDef(symbolIndex);
            if (!symbolDef) {
                continue;
            }
            const fnTypeConfig = this.getFnTypeConfig(symbolIndex);
            updateOneGeometryFnTypeAttrib(this.regl, symbolDef, fnTypeConfig, meshes[i], z);
        }
    }

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

    needPolygonOffset() {
        return false;
    }

    getPolygonOffset() {
        const layer = this.layer;
        return {
            factor: (_, props) => {
                if (props.meshConfig.ssr) {
                    // ssr offset和factor值较小时，会影响ssr逻辑中深度精度，造成屏幕边缘出现“阴影”现象。
                    return 1;
                }
                const factor = -(layer.getPolygonOffset() + (this.polygonOffsetIndex || 0));
                return factor;
            },
            units: (_, props) => {
                if (props.meshConfig.ssr) {
                    return 1;
                }
                return -(layer.getPolygonOffset() + (this.polygonOffsetIndex || 0));
            }
        };
    }

    getBlendFunc() {
        return {
            src: () => {
                return this.sceneConfig.blendSrc || 'src alpha';
            },
            dst: () => {
                return this.sceneConfig.blendDst || 'one minus src alpha';
            }
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
        const result = {
            data: props && props.features && props.features[pickingId],
            point,
            plugin: this.pluginIndex,
        };
        const idMap = mesh.geometry.properties.feaPickingIdMap;
        if (idMap) {
            result.featureId = idMap[pickingId];
        }
        return result;
    }

    updateSceneConfig(/* config */) {
    }

    updateDataConfig() {
        return true;
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
        if (this._outlineShader) {
            this._outlineShader.dispose();
        }
        this.logoutTextureCache();
    }

    updateSymbol(symbolDef, all) {
        if (!Array.isArray(symbolDef)) {
            symbolDef = [symbolDef];
            all = [all];
        }
        for (let i = 0; i < symbolDef.length; i++) {
            if (symbolDef[i]) {
                this._updateChildSymbol(i, symbolDef[i], all[i]);
            }
        }


        delete this._fnTypeConfigs;
        this.setToRedraw(this.supportRenderMode('taa'));
    }

    _updateChildSymbol(i, symbolDef, all) {
        this.symbolDef[i] = all;
        if (!this._symbol) {
            return;
        }
        const symbol = this._symbol[i];
        for (const p in symbol) {
            delete symbol[p];
        }
        const map = this.getMap();
        // extend(this._symbol, this.symbolDef);
        const loadedSymbol = loadFunctionTypes(this.symbolDef[i], () => {
            return [map.getZoom()];
        });
        for (const p in loadedSymbol) {
            const d = Object.getOwnPropertyDescriptor(loadedSymbol, p);
            if (d.get) {
                Object.defineProperty(symbol, p, {
                    get: d.get,
                    set: d.set,
                    configurable: true,
                    enumerable: true
                });
            } else {
                symbol[p] = loadedSymbol[p];
            }
        }
        if (isFunctionDefinition(all.visible)) {
            this._visibleFn[i] = interpolated(all.visible);
        }
        // if (isFunctionDefinition(this.symbolDef.visible)) {
        //     this._visibleFn = interpolated(this.symbolDef.visible);
        // } else {
        //     delete this._visibleFn;
        // }
    }

    getSymbolDef(symbolIndex) {
        return this.symbolDef[symbolIndex.index];
    }

    getSymbols() {
        return this._symbol;
    }

    getSymbol(symbolIndex) {
        const index = symbolIndex.index;
        return this._symbol[index];
    }

    _compileSymbols() {
        const map = this.getMap();
        const fn = () => {
            return [map.getZoom()];
        };
        this._symbol = [];
        this._visibleFn = [];
        for (let i = 0; i < this.symbolDef.length; i++) {
            this._symbol[i] = loadFunctionTypes(extend({}, this.symbolDef[i]), fn);
            if (isFunctionDefinition(this.symbolDef[i].visible)) {
                this._visibleFn[i] = interpolated(this.symbolDef[i].visible);
            }
        }
    }

    getFnTypeConfig(symbolIndex) {
        if (!this._fnTypeConfigs) {
            this._fnTypeConfigs = [];
        }
        const index = symbolIndex.index;
        if (!this._fnTypeConfigs[index]) {
            const symbolDef = this.getSymbolDef(symbolIndex);
            const map = this.getMap();
            this._fnTypeConfigs[index] = this.createFnTypeConfig(map, symbolDef);
        }
        return this._fnTypeConfigs[index];
    }

    _deleteFnTypeConfigs() {
        delete this._fnTypeConfigs;
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

    supportRenderMode(mode) {
        return mode === 'taa' || mode === 'fxaa';
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

    outline(fbo, featureIds) {
        const painted = {};
        for (let i = 0; i < featureIds.length; i++) {
            if (isNil(featureIds[i]) || painted[featureIds[i]]) {
                continue;
            }
            this._outlineOne(fbo, featureIds[i]);
            painted[featureIds[i]] = 1;
        }
    }

    _outlineOne(fbo, featureId) {
        if (!this.picking) {
            return;
        }
        if (!this._outlineShader) {
            this._outlineScene = new reshader.Scene();
            this._initOutlineShader();
            this._outlineShader.filter = this.level0Filter;
            if (!this._outlineShader) {
                console.warn(`Plugin at ${this.pluginIndex} doesn't support outline.`);
                return;
            }
        }
        const uniforms = this.getUniformValues(this.getMap(), this._renderContext);

        const meshes = this._findMeshesHasFeaId(featureId);
        if (!meshes.length) {
            return;
        }
        for (let i = 0; i < meshes.length; i++) {
            const pickingMap = meshes[i].geometry.properties.feaIdPickingMap;
            if (pickingMap) {
                const pickingId = pickingMap[featureId];
                if (!isNil(pickingId)) {
                    uniforms.highlightPickingId = pickingId;
                    this._outlineScene.setMeshes(meshes[i]);
                    this.renderer.render(this._outlineShader, uniforms, this._outlineScene, fbo);
                }
            }
        }
    }

    _findMeshesHasFeaId(feaId) {
        const meshes = [];
        const allMeshes = this.scene.getMeshes();
        for (let i = 0; i < allMeshes.length; i++) {
            const mesh = allMeshes[i];
            const idMap = mesh.geometry.properties.feaIdPickingMap;
            if (idMap && idMap[feaId] !== undefined) {
                meshes.push(mesh);
            }
        }
        return meshes;
    }

    outlineAll(fbo) {
        if (!this.picking) {
            return;
        }
        if (!this._outlineShader) {
            this._initOutlineShader();
            if (!this._outlineShader) {
                console.warn(`Plugin at ${this.pluginIndex} doesn't support outline.`);
                return;
            }
        }
        const uniforms = this.getUniformValues(this.getMap(), this._renderContext);
        uniforms.highlightPickingId = -1;
        this.renderer.render(this._outlineShader, uniforms, this.scene, fbo);
    }

    _initOutlineShader() {

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
        this._outlineShader = new reshader.MeshShader({
            vert: pickingVert,
            frag: outlineFrag,
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

    hasIBL() {
        const lightManager = this.getMap().getLightManager();
        const resource = lightManager && lightManager.getAmbientResource();
        return !!resource;
    }

    updateIBLDefines(shader) {
        const shaderDefines = shader.shaderDefines;
        let updated = false;
        if (this.hasIBL()) {
            if (!shaderDefines[['HAS_IBL_LIGHTING']]) {
                shaderDefines['HAS_IBL_LIGHTING'] = 1;
                updated = true;
            }
        } else if (shaderDefines[['HAS_IBL_LIGHTING']]) {
            delete shaderDefines['HAS_IBL_LIGHTING'];
            updated = true;
        }
        if (updated) {
            shader.shaderDefines = shaderDefines;
        }
    }

    createIBLTextures() {
        const canvas = this.layer.getRenderer().canvas;
        if (!canvas.dfgLUT) {
            canvas.dfgLUT = reshader.pbr.PBRHelper.generateDFGLUT(this.regl);
            canvas.dfgLUT.mtkCount = 0;
        }
        if (this.dfgLUT !== canvas.dfgLUT) {
            canvas.dfgLUT.mtkCount++;
            this.dfgLUT = canvas.dfgLUT;
        }
        if (!this.hasIBL()) {
            return;
        }
        if (!canvas.iblTexes) {
            canvas.iblTexes = createIBLTextures(this.regl, this.getMap());
            canvas.iblTexes.mtkCount = 0;
        }
        this.iblTexes = canvas.iblTexes;
        canvas.iblTexes.mtkCount++;
        this.setToRedraw(true);
        this.layer.fire('iblupdated');
    }

    disposeIBLTextures() {
        const canvas = this.layer.getRenderer().canvas;
        if (this.dfgLUT && this.dfgLUT === canvas.dfgLUT) {
            canvas.dfgLUT.mtkCount--;
            if (canvas.dfgLUT.mtkCount <= 0) {
                canvas.dfgLUT.destroy();
                delete canvas.dfgLUT;
            }
        }
        delete this.dfgLUT;
        if (this.iblTexes && this.iblTexes === canvas.iblTexes) {
            canvas.iblTexes.mtkCount--;
            if (canvas.iblTexes.mtkCount <= 0) {
                disposeIBLTextures(canvas.iblTexes);
                delete canvas.iblTexes;
            }
        }
    }

    onUpdatelights(param) {
        if (param.ambientUpdate) {
            const canvas = this.layer.getRenderer().canvas;
            const iblTexes = canvas.iblTexes;
            const myIblTexes = this.iblTexes;
            delete this.iblTexes;
            if (iblTexes && myIblTexes === canvas.iblTexes && iblTexes.event !== param) {
                disposeIBLTextures(iblTexes);
                delete canvas.iblTexes;
                this.createIBLTextures();
                if (canvas.iblTexes) {
                    canvas.iblTexes.event = param;
                }
            }
        }
        this.setToRedraw(true);
    }
}

export default Painter;

function sortByCommandKey(a, b) {
    const k1 = a && a.getCommandKey(this.regl) || '';
    const k2 = b && b.getCommandKey(this.regl) || '';
    return k1.localeCompare(k2);
}
