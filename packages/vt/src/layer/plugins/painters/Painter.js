import * as maptalks from 'maptalks';
import { reshader, vec3, mat4, HighlightUtil } from '@maptalks/gl';
import { getVectorPacker } from '../../../packer/inject';
import { isFunctionDefinition, interpolated, piecewiseConstant } from '@maptalks/function-type';
import { extend, copyJSON, isNil, hasOwn } from '../Util';
import outlineFrag from './glsl/outline.frag';
import { updateOneGeometryFnTypeAttrib } from './util/fn_type_util';
import { inTerrainTile } from './util/line_offset';
import deepEuqal from 'fast-deep-equal';
import { oldPropsKey, externalPropsKey } from '../../renderer/utils/convert_to_painter_features';
import { INVALID_ALTITUDE } from '../../../common/Constant';

const { SYMBOLS_NEED_REBUILD_IN_VT, StyleUtil, FuncTypeUtil } = getVectorPacker();

const { loginIBLResOnCanvas, logoutIBLResOnCanvas, getIBLResOnCanvas } = reshader.pbr.PBRUtils;

const TEX_CACHE_KEY = '__gl_textures';

// const MAT = [];
const V3 = [];
const TILEPOINT = new maptalks.Point(0, 0);
const ANCHOR_POINT = new maptalks.Point(0, 0);

const ALTITUDE32 = new Float32Array(1);

const EMPTY_ARRAY = [];
const level0Filter = mesh => {
    return mesh.properties.level === 0;
};

const levelNFilter = mesh => {
    return mesh.properties.level > 0;
};

class Painter {
    static getBloomSymbol() {
        return ['bloom'];
    }

    constructor(regl, layer, symbol, sceneConfig, pluginIndex, dataConfig) {
        this._is2D = true;
        this.regl = regl;
        this.layer = layer;
        this.canvas = regl['_gl'].canvas;
        this.sceneConfig = sceneConfig || {};
        this.dataConfig = dataConfig || {};
        //插件的序号，也是style的序号
        this.pluginIndex = pluginIndex;
        this.scene = new reshader.Scene();
        this.pickingFBO = layer.getRenderer().pickingFBO;
        this.level0Filter = level0Filter;
        this.levelNFilter = levelNFilter;
        this.loginTextureCache();
        this.symbolDef = Array.isArray(symbol) ? symbol.map(s => copyJSON(s)) : [copyJSON(symbol)];
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
        this.colorCache = {};
        // 因为一开始visible为false的数据不会被创建，需要记录下来，updateSymbol时决定是否需要重新创建数据
        this._invisibleWhenCreated = this.symbolDef.map(s => !!(s && s.visible === false));
    }

    hasMesh() {
        const meshes = this.scene && this.scene.getMeshes();
        return this.isVisible() && meshes && !!meshes.length;
    }

    getMap() {
        return this.layer ? this.layer.getMap() : null;
    }

    getTileLevelValue(tileInfo, currentTileZoom) {
        const renderer = this.layer.getRenderer();
        return renderer.getTileLevelValue && renderer.getTileLevelValue(tileInfo, currentTileZoom) || 0;
    }

    getAnalysisMeshes() {
        if (this.getShadowMeshes) {
            return this.getShadowMeshes();
        }
        return EMPTY_ARRAY;
    }

    isVisible() {
        //TODO visibleFn没有支持多symbol
        // if (this._visibleFn && !this._visibleFn.isFeatureConstant) {
        //     return true;
        // }
        const { minZoom, maxZoom } = this.sceneConfig;
        const map = this.getMap();
        const zoom = map.getZoom();
        if (!isNil(minZoom) && zoom < minZoom) {
            return false;
        }
        if (!isNil(maxZoom) && zoom > maxZoom) {
            return false;
        }
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

    isAnimating() {
        return false;
    }

    needToRedraw() {
        return this.isAnimating() || this._redraw;
    }

    needToRetireFrames() {
        return this._needRetire;
    }

    needToRefreshTerrainTileOnZooming() {
        return true;
    }

    isTerrainSkin() {
        return this.layer.options.awareOfTerrain;
    }

    isTerrainVector() {
        return false;
    }

    isShadowIncludeChanged(context) {
        const isRenderingTerrainSkin = context && context.isRenderingTerrain && this.isTerrainSkin();
        return context && context.states && context.states.includesChanged['shadow'] || isRenderingTerrainSkin && this._includeKeys;
    }

    fillIncludes(defines, uniformDeclares, context) {
        delete this._includeKeys;
        if (context && context.isRenderingTerrain && this.isTerrainSkin()) {
            return;
        }
        const includes = context && context.includes;
        if (includes) {
            let keys = '';
            for (const p in includes) {
                if (includes[p]) {
                    keys += p;
                    if (context[p].uniformDeclares) {
                        uniformDeclares.push(...context[p].uniformDeclares);
                    }
                    if (context[p].defines) {
                        extend(defines, context[p].defines);
                    }
                }
            }
            this._includeKeys = keys;
        }
    }

    setIncludeUniformValues(uniforms, context) {
        if (context && context.isRenderingTerrain && this.isTerrainSkin()) {
            return;
        }
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

    createGeometries(glData, features) {
        if (!glData.length) {
            return EMPTY_ARRAY;
        }
        const geometries = [];
        for (let i = 0; i < glData.length; i++) {
            if (!glData[i]) {
                continue;
            }
            if (glData[i].ref !== undefined) {
                if (!geometries[glData[i].ref]) {
                    geometries.push(null);
                } else {
                    geometries.push({
                        geometry: geometries[glData[i].ref].geometry,
                        symbolIndex: glData[i].symbolIndex,
                        ref: glData[i].ref
                    });
                }
            } else {
                if (glData[i] && !glData[i].is2D) {
                    this._is2D = false;
                }
                const geo = this.createGeometry(glData[i], features, i);
                if (geo && geo.geometry) {
                    const props = geo.geometry.properties;
                    const { pickingIdMap, idPickingMap, hasFeaIds } = this._getIdMap(glData[i]);
                    if (hasFeaIds) {
                        props.feaIdPickingMap = pickingIdMap;
                        props.feaPickingIdMap = idPickingMap;
                    }

                    props.symbolIndex = geo.symbolIndex;
                    props.features = features;
                    props.is2D = glData[i].is2D;
                    props.layer = this.layer;
                    props.positionBounding = glData[i].positionBounding;
                    // props.elements = props.elements || geo.geometry.elements;

                    this.postCreateGeometry(geo, geometries);
                }
                // null 也需要push，保证ref指向的顺序是正确的
                geometries.push(geo);
            }
        }
        return geometries;
    }

    isOnly2D() {
        return this._is2D;
    }

    postCreateGeometry() {}

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
        const feaIds = glData.featureIds;
        const idPickingMap = {};
        const pickingIdMap = {};
        const hasFeaIds = feaIds && feaIds.length;
        if (hasFeaIds) {
            for (let i = 0; i < feaIds.length; i++) {
                const pickingId = glData.data.aPickingId[i];
                if (idPickingMap[pickingId] !== undefined) {
                    continue;
                }
                idPickingMap[pickingId] = feaIds[i];
                if (!pickingIdMap[feaIds[i]]) {
                    pickingIdMap[feaIds[i]] = [];
                }
                pickingIdMap[feaIds[i]].push(glData.data.aPickingId[i]);
            }
        }
        return { hasFeaIds, idPickingMap, pickingIdMap };
    }

    createGeometry(/* glData, features */) {
        throw new Error('not implemented');
    }

    createMeshes(geometries, transform, params, context) {
        const awareOfTerrain = this.layer.options.awareOfTerrain;
        const meshes = [];
        for (let i = 0; i < geometries.length; i++) {
            if (!geometries[i]) {
                continue;
            }
            if (awareOfTerrain && context && context.isRenderingTerrain && this.isTerrainVector()) {
                const geometry = geometries[i];
                const geo = geometry && geometry.geometry;
                this._updateTerrainAltitude(geo, geo.data, geo.properties, geo.positionSize || geo.desc.positionSize, context);
            }
            let mesh = this.createMesh(geometries[i], transform, params, context || {});
            if (Array.isArray(mesh)) {
                mesh = mesh.filter(m => !!m);
                meshes.push(...mesh);
            } else if (mesh) {
                meshes.push(mesh);
            }

        }
        return meshes;
    }

    createMesh(/* geometries, transform */) {
        throw new Error('not implemented');
    }

    getAltitudeOffsetMatrix() {
        const altitudeOffset = (this.dataConfig.altitudeOffset || 0) * 100;
        const matrix = mat4.identity([]);
        vec3.set(V3, 0, 0, altitudeOffset);
        mat4.translate(matrix, matrix, V3);
        return matrix;
    }

    isBloom(mesh) {
        return !!this.getSymbol(mesh.properties.symbolIndex)['bloom'];
    }

    // 不允许地形上的upscale放大
    forbiddenTerrainUpscale() {
        return true;
    }

    addMesh(meshes, progress, context) {
        // console.log(meshes.map(m => m.properties.tile.id).join());
        // if (meshes[0].properties.tile.id === 'data_vt__85960__140839__19') {
        //     console.log(meshes[0].properties.tile.z, meshes[0].properties.level);
        //     this.scene.addMesh(meshes[0]);
        // }

        const isRenderingTerrainSkin = context.isRenderingTerrain && this.isTerrainSkin();
        if (isRenderingTerrainSkin && this.forbiddenTerrainUpscale()) {
            const res = this.getMap().getResolution();
            const tileRes = context.tileInfo.res;
            const scale = tileRes / res;
            if (scale > 3) {
                // 过于放大
                return;
            }
        }
        const isRenderingTerrainVector = context.isRenderingTerrain && this.isTerrainVector();
        const fbo = this.getRenderFBO(context);
        meshes = meshes.filter(m => this.isMeshVisible(m));
        if (isRenderingTerrainVector) {
            // 只绘制加载了地形数据的mesh
            meshes = meshes.filter(m => m.geometry && m.geometry.data.aTerrainAltitude);
        }
        const castShadow = this.sceneConfig.castShadow === undefined || !!this.sceneConfig.castShadow;
        const isEnableBloom = !!(context && context.bloom);
        meshes.forEach(mesh => {
            const bloom = this.isBloom(mesh) && isEnableBloom;
            mesh.bloom = bloom;
            mesh.castShadow = castShadow;
            let updated = false;
            const defines = mesh.defines || {};
            if (!!defines['HAS_BLOOM'] !== bloom) {
                updated = true;
                if (bloom) {
                    defines['HAS_BLOOM'] = 1;
                } else {
                    delete defines['HAS_BLOOM'];
                }
            }
            if (isRenderingTerrainVector) {
                if (mesh.geometry.data.aTerrainAltitude) {
                    const geo = mesh.geometry;
                    this._updateTerrainAltitude(geo, geo.data, geo.properties, geo.desc.positionSize, context);
                }
                if (mesh.geometry.data.aTerrainAltitude && !defines['HAS_TERRAIN_ALTITUDE']) {
                    defines['HAS_TERRAIN_ALTITUDE'] = 1;
                    updated = true;
                }
            } else if (defines['HAS_TERRAIN_ALTITUDE']) {
                delete defines['HAS_TERRAIN_ALTITUDE'];
                updated = true;
            }

            if (updated) {
                mesh.setDefines(defines);
            }
            if (!fbo) {
                if (mesh.uniforms['targetFramebuffer']) {
                    mesh.uniforms['targetFramebuffer'] = null;
                }
            } else {
                mesh.setUniform('targetFramebuffer', fbo);
            }
            this._highlightMesh(mesh);
        });

        this.scene.addMesh(meshes);
        return;
    }

    updateCollision(/*context*/) {

    }

    render(context) {
        this.pluginIndex = context.pluginIndex;
        this.polygonOffsetIndex = context.polygonOffsetIndex;
        this.paint(context);
        return {
            redraw: this._redraw,
            drawCount: this._drawCount
        };
    }

    prepareRender(context) {
        if (this._currentTimestamp === context.timestamp) {
            return;
        }
        if (!this.createFnTypeConfig) {
            return;
        }
        const meshes = this.scene.getMeshes();
        if (!meshes || !meshes.length) {
            return;
        }
        const sceneFilter = context && context.sceneFilter;
        const z = this.getMap().getZoom();
        for (let i = 0; i < meshes.length; i++) {
            if (!meshes[i] || !meshes[i].geometry) {
                continue;
            }
            if (sceneFilter && !sceneFilter(meshes[i])) {
                continue;
            }
            const { symbolIndex } = meshes[i].properties;
            const symbolDef = this.getSymbolDef(symbolIndex);
            if (!symbolDef) {
                continue;
            }
            this._currentTimestamp = context.timestamp;
            const fnTypeConfig = this.getFnTypeConfig(symbolIndex);
            updateOneGeometryFnTypeAttrib(this.regl, this.layer, symbolDef, fnTypeConfig, meshes[i], z);
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
            this.shader.filter = context && context.sceneFilter ? [this.level0Filter, context.sceneFilter] : this.level0Filter;
        }
        this.callRenderer(this.shader, uniforms, context);
    }

    callBackgroundTileShader(uniforms, context) {
        if (this.shader) {
            //2. render background tile level's meshes
            //stenciled pixels already rendered in step 1
            this.shader.filter = context && context.sceneFilter ? [this.levelNFilter, context.sceneFilter] : this.levelNFilter;
        }
        this.scene.getMeshes().sort(sortByLevel);
        this.callRenderer(this.shader, uniforms, context);
    }

    callRenderer(shader, uniforms, context) {
        const meshes = this.scene.getMeshes();
        const renderMeshes = [];
        meshes.forEach(mesh => {
            if (mesh.properties.hlBloomMesh && context && context.bloom) {
                renderMeshes.push(mesh.properties.hlBloomMesh);
            }
            renderMeshes.push(mesh);
        });

        this._setLayerUniforms(uniforms);

        this.scene.setMeshes(renderMeshes);
        this._drawCount += this.renderer.render(shader, uniforms, this.scene, this.getRenderFBO(context));
        this.scene.setMeshes(meshes);
    }

    _setLayerUniforms(uniforms) {
        const altitude = this.layer.options['altitude'] || 0;
        const renderer = this.layer.getRenderer();
        uniforms.layerOpacity = renderer._getLayerOpacity();
        uniforms.minAltitude = altitude;
    }

    getRenderFBO(context) {
        return context && context.renderTarget && context.renderTarget.fbo;
    }

    needPolygonOffset() {
        return false;
    }

    needRebuildOnGometryPropertiesChanged() {
        return true;
    }

    onFeatureChange() {

    }

    getPolygonOffset() {
        const layer = this.layer;
        return {
            factor: () => {
                // if (props.meshConfig.ssr) {
                //     return layer.getTotalPolygonOffset();
                // }
                const factor = layer.getPolygonOffset() + (this.polygonOffsetIndex || 0);
                return factor;
            },
            units: () => {
                // if (props.meshConfig.ssr) {
                //     return layer.getTotalPolygonOffset();
                // }
                const units = layer.getPolygonOffset() + (this.polygonOffsetIndex || 0);
                return units;
            }
        };
    }

    getBlendFunc() {
        return {
            src: () => {
                // src 设成 one 是因为 maptalks-designer#968
                // 另外设成one，options.opacity < 1时，直接绘制的透明度才和直接添加到map上一致
                return this.sceneConfig.blendSrc || 'one';
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
        this._setLayerUniforms(uniforms);
        for (let i = 0; i < this.picking.length; i++) {
            const picking = this.picking[i];
            picking.render(this.scene.getMeshes(), uniforms, true);
            let picked = {};
            if (picking.getRenderedMeshes().length) {
                picked = picking.pick(x, y, tolerance, uniforms, {
                    viewMatrix: map.viewMatrix,
                    projMatrix: map.projMatrix,
                    returnPoint: this.layer.options['pickingPoint'] && this.sceneConfig.pickingPoint !== false,
                    logDepthBufFC: 2.0 / (Math.log(map.cameraFar + 1.0) / Math.LN2)
                });
            }
            const { meshId, pickingId, point } = picked;
            const mesh = (meshId === 0 || meshId) && picking.getMeshAt(meshId);
            if (!mesh || !mesh.geometry) {
                //有可能mesh已经被回收，geometry不再存在
                continue;
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
                data: this._convertProxyFeature(props && props.features && props.features[pickingId]),
                point,
                coordinate: picked.coordinate,
                plugin: this.pluginIndex,
            };
            // const idMap = mesh.geometry.properties.feaPickingIdMap;
            // if (idMap) {
            //     result.featureId = idMap[pickingId];
            // }
            return result;
        }
        return null;
    }

    _convertProxyFeature(data) {
        const feature = data && data.feature;
        if (!feature || !feature.customProps) {
            return data;
        }
        const result = extend({}, data);
        result.feature = extend({}, data.feature);
        delete result.feature.customProps;
        result.feature.properties = extend({}, feature.properties, feature.properties[oldPropsKey], feature.properties[externalPropsKey]);
        delete result.feature.properties[externalPropsKey];
        delete result.feature.properties[oldPropsKey];
        delete result.feature.properties['$layer'];
        delete result.feature.properties['$type'];
        return result;
    }

    updateSceneConfig(/* config */) {
    }

    updateDataConfig(dataConfig) {
        extend(this.dataConfig, dataConfig);
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
                HighlightUtil.deleteHighlightBloomMesh(meshes[i]);
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
            HighlightUtil.deleteHighlightBloomMesh(meshes);
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
            this._drawCount = 0;
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
            for (let i = 0; i < this.picking.length; i++) {
                this.picking[i].dispose();
            }
            delete this.picking;
        }
        if (this._outlineShaders) {
            for (let i = 0; i < this._outlineShaders.length; i++) {
                this._outlineShaders[i].dispose();
            }
            delete this._outlineShaders;
        }
        delete this._terrainAltitudeCache;
        this.logoutTextureCache();
    }

    updateSymbol(symbolDef, all) {
        // maptalks-studio#2442, needRetire要提前计算，否则symbol更新后，可能出现错误
        // const needRetire = this.supportRenderMode('taa');
        const needRetire = false;
        if (!Array.isArray(symbolDef)) {
            symbolDef = [symbolDef];
            all = [all];
        }
        let needRefresh = false;
        for (let i = 0; i < symbolDef.length; i++) {
            if (symbolDef[i]) {
                const refresh = this._updateChildSymbol(i, symbolDef[i], all[i]);
                if (refresh) {
                    needRefresh = refresh;
                }
            }
        }


        delete this._fnTypeConfigs;
        this.setToRedraw(needRetire);
        return needRefresh;
    }

    _isNeedRefreshStyle(oldSymbolDef, newSymbolDef) {
        for (const p in newSymbolDef) {
            if (hasOwn(newSymbolDef, p)) {
                // 当新的symbol中是fn-type类型属性，且没有缓存features而且property不一致时，就刷新
                if (StyleUtil.isFnTypeSymbol(newSymbolDef[p]) && !this.layer.options['features'] && (!oldSymbolDef[p] || oldSymbolDef[p].property !== newSymbolDef[p].property)) {
                    return true;
                }
                if (SYMBOLS_NEED_REBUILD_IN_VT[p] && !deepEuqal(newSymbolDef[p], oldSymbolDef[p])) {
                    return true;
                }
            }
        }
        return false;
    }

    _updateChildSymbol(i, symbolDef, all) {
        if (!this._symbol) {
            return false;
        }
        const refresh = this._isNeedRefreshStyle(this.symbolDef[i] || {}, all);
        if (this._invisibleWhenCreated[i] && all.visible !== false) {
            this._invisibleWhenCreated[i] = false;
            return true;
        }
        this.symbolDef[i] = copyJSON(all);
        const symbol = this._symbol[i];
        for (const p in symbol) {
            delete symbol[p];
        }
        const map = this.getMap();
        const params = [];
        // extend(this._symbol, this.symbolDef);
        const loadedSymbol = FuncTypeUtil.loadSymbolFnTypes(this.symbolDef[i], () => {
            params[0] = map.getZoom();
            return params;
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
        return refresh;
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
        const params = [];
        const fn = () => {
            params[0] = map.getZoom();
            return params;
        };
        this._symbol = [];
        this._visibleFn = [];
        for (let i = 0; i < this.symbolDef.length; i++) {
            this._symbol[i] = FuncTypeUtil.loadSymbolFnTypes(extend({}, this.symbolDef[i]), fn);
            if (this.symbolDef[i] && isFunctionDefinition(this.symbolDef[i].visible)) {
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
        const keyName = (TEX_CACHE_KEY + '').trim();
        const map = this.getMap();
        if (!map[keyName]) {
            map[keyName] = {
                count: 0
            };
        }
        map[keyName].count++;
    }

    logoutTextureCache() {
        const keyName = (TEX_CACHE_KEY + '').trim();
        const map = this.getMap();
        const myTextures = this._myTextures;
        if (myTextures) {
            for (const url in myTextures) {
                if (hasOwn(myTextures, url)) {
                    if (map[keyName][url]) {
                        map[keyName][url].count--;
                        if (map[keyName][url].count <= 0) {
                            delete map[keyName][url];
                        }
                    }
                }
            }
        }
        map[keyName].count--;
        if (map[keyName].count <= 0) {
            map[keyName] = {};
        }
    }

    getCachedTexture(url) {
        const keyName = (TEX_CACHE_KEY + '').trim();
        const cached = this.getMap()[keyName][url];
        return cached ? cached.data : null;
    }

    addCachedTexture(url, data) {
        const keyName = (TEX_CACHE_KEY + '').trim();
        const map = this.getMap();
        let cached = map[keyName][url];
        if (!cached) {
            cached = map[keyName][url] = {
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
        const keyName = (TEX_CACHE_KEY + '').trim();
        //删除texture时，同时回收cache上的纹理，尽量保证不出现内存泄漏
        //最常见场景： 更新material时，回收原有的texture
        delete this._myTextures[url];
        const map = this.getMap();
        if (map[keyName][url]) {
            map[keyName][url].count--;
            if (map[keyName][url].count <= 0) {
                delete map[keyName][url];
            }
        }
    }

    shouldDeleteMeshOnUpdateSymbol() {
        return false;
    }

    isEnableTileStencil() {
        return true;
    }

    isUniqueStencilRefPerTile() {
        return this.isOnly2D();
    }

    supportRenderMode(mode) {
        return mode === 'taa' || mode === 'fxaa';
    }

    // _stencil(quadStencil) {
    //     const meshes = this.scene.getMeshes();
    //     if (!meshes.length) {
    //         return;
    //     }
    //     const stencils = meshes.map(mesh => {
    //         return {
    //             transform: mesh.localTransform,
    //             level: mesh.properties.level,
    //             mesh
    //         };
    //     }).sort(this._compareStencil);
    //     const projViewMatrix = this.getMap().projViewMatrix;
    //     this._stencilHelper.start(quadStencil);
    //     const painted = {};
    //     for (let i = 0; i < stencils.length; i++) {
    //         const mesh = stencils[i].mesh;
    //         let id = painted[mesh.properties.tile.id];
    //         if (id === undefined) {
    //             mat4.multiply(MAT, projViewMatrix, stencils[i].transform);
    //             id = this._stencilHelper.write(quadStencil, MAT);
    //             painted[mesh.properties.tile.id] = id;
    //         }
    //         // stencil ref value
    //         mesh.setUniform('ref', id);
    //     }
    //     this._stencilHelper.end(quadStencil);
    //     //TODO 因为stencilHelper会改变 gl.ARRAY_BUFFER 和 vertexAttribPointer 的值，需要重刷regl状态
    //     //记录 array_buffer 和 vertexAttribPointer 后， 能省略掉 _refresh
    //     this.regl._refresh();
    // }

    // _compareStencil(a, b) {
    //     return b.level - a.level;
    // }

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
        if (!this._outlineScene) {
            this._outlineScene = new reshader.Scene();
        }
        if (!this._outlineShaders) {
            this._initOutlineShaders();
            // this._outlineShader.filter = this.level0Filter;
            if (!this._outlineShaders) {
                console.warn(`Plugin at ${this.pluginIndex} doesn't support outline.`);
                return;
            }
        }
        const uniforms = this.getUniformValues(this.getMap(), this._renderContext);
        this._setLayerUniforms(uniforms);

        const meshes = this._findMeshesHasFeaId(featureId);
        if (!meshes.length) {
            return;
        }
        for (let i = 0; i < meshes.length; i++) {
            const pickingMap = meshes[i].geometry.properties.feaIdPickingMap;
            if (pickingMap) {
                const pickingIds = pickingMap[featureId];
                if (pickingIds) {
                    const painted = {};
                    this._outlineScene.setMeshes(meshes[i]);
                    for (let ii = 0; ii < pickingIds.length; ii++) {
                        const pickingId = pickingIds[ii];
                        if (painted[pickingId]) {
                            continue;
                        }
                        painted[pickingId] = 1;
                        uniforms.highlightPickingId = pickingId;
                        for (let j = 0; j < this._outlineShaders.length; j++) {
                            this.renderer.render(this._outlineShaders[j], uniforms, this._outlineScene, fbo);
                        }
                    }

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
        if (!this._outlineShaders) {
            this._initOutlineShaders();
            if (!this._outlineShaders) {
                console.warn(`Plugin at ${this.pluginIndex} doesn't support outline.`);
                return;
            }
        }
        const uniforms = this.getUniformValues(this.getMap(), this._renderContext);
        this._setLayerUniforms(uniforms);
        uniforms.highlightPickingId = -1;
        for (let j = 0; j < this._outlineShaders.length; j++) {
            this.renderer.render(this._outlineShaders[j], uniforms, this.scene, fbo);
        }
    }

    _initOutlineShaders() {

        if (!this.picking) {
            return;
        }
        const canvas = this.layer.getRenderer().canvas;
        this._outlineShaders = [];
        for (let i = 0; i < this.picking.length; i++) {
            const pickingVert = this.picking[i].getPickingVert();
            const defines = {
                'ENABLE_PICKING': 1,
                'HAS_PICKING_ID': 1
            };
            const uniforms = this.picking[i].getUniformDeclares().slice(0);
            if (uniforms['uPickingId'] !== undefined) {
                defines['HAS_PICKING_ID'] = 2;
            }
            this._outlineShaders[i] = new reshader.MeshShader({
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
            this._outlineShaders[i].filter = this.picking[i].filter;
        }

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

    getIBLRes() {
        const canvas = this.layer.getRenderer().canvas;
        return getIBLResOnCanvas(canvas);
    }

    createIBLTextures() {
        const canvas = this.layer.getRenderer().canvas;
        loginIBLResOnCanvas(canvas, this.regl, this.getMap());
        this.setToRedraw(true);
        this.layer.fire('iblupdated');
    }

    disposeIBLTextures() {
        const canvas = this.layer.getRenderer().canvas;
        logoutIBLResOnCanvas(canvas, this.getMap());
    }

    // 在createFnTypeConfig方法中，有时fnTypeConfig中计算的值仍然是fn-type，(例如Vector3DLayer的数据symbol属性是fn type时)
    // 缓存生成的函数对象，并计算出真正的值并返回
    evaluateInFnTypeConfig(v, geometry, map, properties, isPiecewiseConstant) {
        let fnCaches = this._fnCaches;
        if (!fnCaches) {
            fnCaches = this._fnCaches = {};
        }
        const key = hashCode(JSON.stringify(v));
        let fn = fnCaches[key];
        if (!fn) {
            fn = fnCaches[key] = isPiecewiseConstant ? piecewiseConstant(v) : interpolated(v);
        }
        return fn(map.getZoom(), properties);
    }

    highlight(highlights) {
        this._highlighted = highlights;
        this._highlightTimestamp = this.layer.getRenderer().getFrameTimestamp();
        this.setToRedraw(true);
    }

    cancelAllHighlight() {
        this._highlighted = null;
        this._highlightTimestamp = this.layer.getRenderer().getFrameTimestamp();
        this.setToRedraw(true);
    }

    _prepareFeatureIds(geometry, glData) {
        const { featureIds, pickingIdIndiceMap } = glData;
        geometry.properties.aFeaIds = featureIds;
        geometry.properties.pickingIdIndiceMap = pickingIdIndiceMap;
    }

    _highlightMesh(mesh) {
        // ignore halo text meshes, maptalks/issues#562
        if (mesh && mesh.properties.isHalo) {
            return;
        }
        const { pickingIdIndiceMap } = mesh.geometry.properties;
        const highlights = this._highlighted ? convertHighlights(mesh, this.layer, this._highlighted) : null;
        HighlightUtil.highlightMesh(this.regl, mesh, highlights, this._highlightTimestamp, pickingIdIndiceMap);
    }

    _updateTerrainAltitude(geometry, geoData, geoProperties, positionSize, context) {
        let aAnchor = geoProperties.aAnchor;
        if (!aAnchor) {
            const { aPosition } = geoData;
            aAnchor = geoProperties.aAnchor = aPosition.slice(0);
        }
        let aTerrainAltitude = geoProperties.aTerrainAltitude;
        if (!aTerrainAltitude) {
            aTerrainAltitude = geoProperties.aTerrainAltitude = new Float32Array(aAnchor.length / positionSize);
            aTerrainAltitude.fill(INVALID_ALTITUDE);
        }
        this._fillTerrainAltitude(aTerrainAltitude, aAnchor, context.tileInfo, 0, aTerrainAltitude.length - 1);

        if (!geoData.aTerrainAltitude) {
            geoData.aTerrainAltitude = aTerrainAltitude;
        } else if (aTerrainAltitude.dirty) {
            this._updateATerrainAltitude(geometry, aTerrainAltitude);
        }
        aTerrainAltitude.dirty = false;
    }

    _updateATerrainAltitude(geometry, aTerrainAltitude) {
        if (!geometry) {
            return;
        }
        // GLTFMixin 的 geometry 就没有updateData
        if (geometry.updateData) {
            geometry.updateData('aTerrainAltitude', aTerrainAltitude);
        }

    }

    _fillTerrainAltitude(aTerrainAltitude, aPosition, tile, start, end) {
        const { res, extent, extent2d, id } = tile;
        const pluginIndex = this.pluginIndex;
        const cacheId = id + '-' + pluginIndex;
        if (!tile.completeTerrainQuery) {
            tile.completeTerrainQuery = [];
        }
        if (tile.completeTerrainQuery[pluginIndex]) {
            return;
        }
        if (!tile.completeTerrainQuery[pluginIndex] && this._terrainAltitudeCache && this._terrainAltitudeCache.has(cacheId)) {
            const cachedAltitude = this._terrainAltitudeCache.getAndRemove(cacheId);
            this._terrainAltitudeCache.add(cacheId, cachedAltitude);
            aTerrainAltitude.set(cachedAltitude.altitudeData);
            tile.terrainTileInfos = cachedAltitude.terrainTileInfos;
            aTerrainAltitude.dirty = true;
            tile.completeTerrainQuery[pluginIndex] = true;
            return;
        }
        const layer = this.layer;
        const map = layer.getMap();
        const renderer = layer.getRenderer();

        const terrainHelper = renderer && renderer.getTerrainHelper();

        let terrainTileInfos = tile.terrainTileInfos;
        if (!terrainTileInfos) {
            terrainTileInfos = tile.terrainTileInfos = this.layer.queryTerrainTiles(tile);
        }
        if (!tile.terrainQueryStatus) {
            tile.terrainQueryStatus = [];
        }
        let terrainChanged = false;
        let queryStatus = [];
        // 查询地形瓦片是否有新的加载，如果没有则无需查询
        for (let i = 0; i < tile.terrainTileInfos.length; i++) {
            queryStatus[i] = (+terrainHelper.isTerrainTileLoaded(tile.terrainTileInfos[i].id));
            if (queryStatus[i] && tile.terrainQueryStatus[pluginIndex] && !tile.terrainQueryStatus[pluginIndex][i]) {
                terrainChanged = true;
                break;
            }
        }
        if (!terrainChanged && tile.terrainQueryStatus[pluginIndex]) {
            return;
        }

        const layerClazz = layer.constructor;
        if (map.isInteracting()) {
            // 地图交互时，如果留给altitudeQuery的时间片用完，则不再继续
            const timestamp = renderer.getFrameTimestamp();

            if (layerClazz.altitudeQueryFrameTimestamp !== timestamp) {
                layerClazz.altitudeQueryFrameTimestamp = timestamp;
                layerClazz.altitudeQueryFrameTime = 0;
            }
            const timeLimit = layer.options['altitudeQueryTimeLimitPerFrame'];
            if (layerClazz.altitudeQueryFrameTime > timeLimit) {
                return;
            }
        }

        const startTime = performance.now();

        tile.terrainQueryStatus[pluginIndex] = queryStatus;

        const { xmin, ymax } = extent2d;
        const tilePoint = TILEPOINT.set(xmin, ymax);
        const tileScale = this.layer.getTileSize().width / tile.extent;
        const positionSize = aPosition.length / aTerrainAltitude.length;
        let queryResult = aTerrainAltitude.queryResult;
        if (!queryResult) {
            queryResult = aTerrainAltitude.queryResult = new Map();
        }
        let complete = true;
        for (let i = start; i <= end; i++) {
            let x = aPosition[i * positionSize];
            if (x < 0) {
                x = 0;
            } else if (x > extent) {
                x = extent;
            }
            let y = aPosition[i * positionSize + 1];
            if (y < 0) {
                y = 0;
            } else if (y > extent) {
                y = extent;
            }
            const index = x + y * extent;
            let altitude = queryResult.get(index);
            if (altitude || altitude === 0) {
                if (aTerrainAltitude[i] !== altitude) {
                    aTerrainAltitude[i] = altitude;
                    aTerrainAltitude.dirty = true;
                }
                continue;
            }
            let terrainTile;
            for (let j = 0; j < terrainTileInfos.length; j++) {
                if (inTerrainTile(terrainTileInfos[j], xmin + tileScale * x, ymax - tileScale * y, res)) {
                    terrainTile = terrainTileInfos[j];
                    break;
                }
            }
            let result;
            if (terrainTile && (terrainHelper.getRenderer().isTileCached(terrainTile.id) || aTerrainAltitude[i] === INVALID_ALTITUDE)) {
                ANCHOR_POINT.set(x, y);
                result = this.layer.queryTilePointTerrain(ANCHOR_POINT, terrainTile, tilePoint, extent, res);
            }
            altitude = aTerrainAltitude[i];
            if (result) {
                altitude = result[0] === null ? INVALID_ALTITUDE : result[0];
                ALTITUDE32[0] = altitude;
                altitude = ALTITUDE32[0];
            }
            if (aTerrainAltitude[i] !== altitude) {
                aTerrainAltitude[i] = altitude;
                aTerrainAltitude.dirty = true;
            }
            if (result && result[1]) {
                queryResult.set(index, altitude);
            } else {
                complete = false;
            }
        }
        layerClazz.altitudeQueryFrameTime = (layerClazz.altitudeQueryFrameTime || 0) + (performance.now() - startTime);
        tile.completeTerrainQuery[pluginIndex] = complete;
        if (complete) {
            if (!this._terrainAltitudeCache) {
                this._terrainAltitudeCache = new maptalks.LRUCache(this.layer.options['maxCacheSize'] * 4);
            }
            this._terrainAltitudeCache.add(cacheId, { altitudeData: aTerrainAltitude, terrainTileInfos });
        }
    }
}

export default Painter;

function sortByCommandKey(a, b) {
    const k1 = a && a.getCommandKey(this.regl) || '';
    const k2 = b && b.getCommandKey(this.regl) || '';
    return k1.localeCompare(k2);
}


function sortByLevel(m0, m1) {
    return m0.properties.level - m1.properties.level;
}

function hashCode(s) {
    let hash = 0;
    const strlen = s && s.length || 0;
    if (!strlen) {
        return hash;
    }
    let c;
    for (let i = 0; i < strlen; i++) {
        c = s.codePointAt(i);
        hash = ((hash << 5) - hash) + c;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

// 用户输入的highlights的转换函数
// * 如果highlight输入的是id，转化成pickingId
// * 如果highlight输入的是filter函数，则转换成过滤后数据的pickingId
// 转换后gl中的highlightMesh方法只需要考虑id相关逻辑
function convertHighlights(mesh, layer, inputHighlights) {
    const { aPickingId, feaIdPickingMap, features } = mesh.geometry.properties;
    const highlights = new Map();
    const names = inputHighlights.keys();
    for (const name of names) {
        const highlight = inputHighlights.get(name);
        if (!highlight) {
            continue;
        }
        if (!isNil(highlight.id)) {
            const pickingIds = feaIdPickingMap[highlight.id];
            if (!pickingIds || !pickingIds.length) {
                continue;
            }
            for (let i = 0; i < pickingIds.length; i++) {
                highlights.set(pickingIds[i], highlight);
            }
        } else if (highlight.filter && aPickingId) {
            let current = null;
            for (let i = 0; i < aPickingId.length; i++) {
                if (aPickingId[i] !== current) {
                    current = aPickingId[i];
                }
                const feature = features[current];
                if (highlight.filter(feature && feature.feature, layer)) {
                    highlights.set(current, highlight);
                }
            }
        }
    }
    return highlights;
}
