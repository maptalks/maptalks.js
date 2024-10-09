import * as maptalks from 'maptalks';
import { defined } from './common/Util';
import { createREGL, mat4, vec2, reshader, MaskRendererMixin } from '@maptalks/gl';
import { intersectsBox } from 'frustum-intersects';
import SHADER_MAP from './common/ShaderMap';
import pickingVert from './common/glsl/picking.vert';
import sceneVert from './common/glsl/sceneVert.vert';
import extentFrag from './common/glsl/extent.frag';
import GLTFWorkerConnection from './common/GLTFWorkerConnection';
import { loadGLTF } from './worker/';
import MultiGLTFMarker from './MultiGLTFMarker';

const uniformDeclares = [], tempBBox = [];
const pointLineModes = ['points', 'lines', 'line strip', 'line loop'];
class GLTFLayerRenderer extends MaskRendererMixin(maptalks.renderer.OverlayLayerCanvasRenderer) {

    constructor(layer) {
        super(layer);
        this._shaderList = {};
        this._renderMarkerList = [];
        this._multigltfmarker = {};
    }

    onAdd() {
        super.onAdd();
        this.prepareWorker();
    }

    draw(timestamp, context) {
        this.prepareCanvas();
        this._renderScene(context, timestamp);
    }

    drawOnInteracting(e, timestamp, context) {
        this._renderScene(context, timestamp);
    }

    //场景渲染函数
    _renderScene(context, timestamp) {
        this._drawContext = context;
        this._currentFrameTime = timestamp;
        let renderCount = 0;
        this._updateLightUniforms(context);
        this._toRenderMeshes = {};
        this._updateShaderList(context);
        const renderUniforms = this._prepareRenderUniforms(context);
        this._prepareRenderMeshes(timestamp);
        const targetFBO = context && context.renderTarget ? context.renderTarget.fbo : null;
        //以shader为循环渲染对象，而不采用以marker为渲染对象，是因为一般来说运用到的shader都是有限的几个，而marker在图层中数量
        //可能会非常庞大，频繁的去render,会大量调用gl.useProgram
        let drawCount = 0;
        for (const shaderName in this._shaderList) {
            if (shaderName === 'pointline') {
                continue;
            }
            if (context) {
                const { newShader, uniforms } = this._updateShader(context, shaderName);
                this._shaderList[shaderName].shader = newShader;
                maptalks.Util.extend(renderUniforms, uniforms);
            }
            const renderScene = this._createSceneByShader(shaderName);
            const shader = this._shaderList[shaderName].shader;
            shader.filter = context && context.sceneFilter || null;
            drawCount += this.renderer.render(shader, renderUniforms, renderScene, targetFBO);
            renderCount++;
        }
        //非三角形的mesh直接统一用pointline shader渲染
        const pointLineScene = this._createSceneByShader('pointline');
        if (pointLineScene.getMeshes().length) {
            renderUniforms['pointSize'] = this.layer.options['pointSize'] || 1.0;
            const pointLineShader = this._shaderList['pointline'].shader;
            pointLineShader.filter = context && context.sceneFilter || null;
            drawCount += this.renderer.render(pointLineShader, renderUniforms, pointLineScene, targetFBO);
            renderCount++;
        }
        this._renderBBox(renderUniforms, targetFBO);
        if (drawCount) {
            this.layer.fire('canvasisdirty', { renderCount: drawCount });
        }
        this._needRefreshPicking = true;
        this.completeRender();
        this.layer.fire('rendercomplete-debug', { count : renderCount });
    }

    _renderBBox(uniforms, targetFBO) {
        if (!this._bboxScene) {
            this._bboxScene = new reshader.Scene();
        }
        const markers = this.layer.getGeometries();
        const bboxMeshes = [];
        for (let i = 0; i < markers.length; i++) {
            if (!markers[i].options['showDebugBoundingBox']) {
                continue;
            }
            const bboxMesh = markers[i]._getBoundingBoxMesh();
            if (bboxMesh) {
                bboxMeshes.push(bboxMesh);
            }
        }
        if (!bboxMeshes.length) {
            return;
        }
        this._bboxScene.setMeshes(bboxMeshes);
        this.renderer.render(this._shaderList['wireframe'].shader, uniforms, this._bboxScene, targetFBO);
    }

    _createDataItem(marker) {
        const polygonFill = marker.getUniform('polygonFill') || [1, 1, 1, 1];
        const polygonOpacity = marker.getUniform('polygonOpacity') || 1;
        polygonFill[3] = polygonOpacity;
        return {
            coordinates: marker.getCoordinates(),
            translation: marker.getTranslation(),
            rotation: marker.getRotation(),
            scale: marker.getScale(),
            visible: marker.isVisible(),
            color: polygonFill,
            bloom: marker.isBloom(),
            outline: marker.isOutline(),
            modelHeight: marker.getModelHeight(),
            markerPixelHeight: marker._getMarkerPixelHeight(),
            anchorZ: marker.getAnchorZ(),
            pickingId: marker._getPickingId(),
            target: marker
        };
    }

    _markerToMultiGLTFMarker(marker) {
        const dataItem = this._createDataItem(marker);
        const multigltfmarker = new MultiGLTFMarker([dataItem], {
            symbol: {
                url: marker.getUrl(),
                shader: marker.getShader(),
                shadow: marker.isCastShadow()
            }
        });
        multigltfmarker._markerList = multigltfmarker._markerList || [];
        marker._converted = true;
        multigltfmarker._markerList.push(marker);
        multigltfmarker._setLayer(marker.getLayer());
        return multigltfmarker;
    }

    _clearMultiGLTFMarker() {
        for (const key in this._multigltfmarker) {
            const marker = this._multigltfmarker[key];
            marker.removeAllData();
        }
    }

    _setRenderMeshes(marker, timestamp) {
        const meshes = marker.getMeshes(this._gltfManager, this.regl, timestamp);
        const shader = marker.getShader();
        if (meshes.length) {
            this._renderMarkerList.push(marker);
            this._toRenderMeshes[shader] = this._toRenderMeshes[shader] || [];
            maptalks.Util.pushIn(this._toRenderMeshes[shader], meshes);
            for (let i = 0; i < meshes.length; i++) {
                if (meshes[i].properties.bloomMesh) {
                    this._toRenderMeshes[shader].push(meshes[i].properties.bloomMesh);
                }
            }
        }
    }

    _prepareRenderMeshes(timestamp) {
        this._renderMarkerList.length = 0;
        const markers = this.layer.getGeometries();
        if (this._isDirty()) {
            this._clearMultiGLTFMarker();//不需要每次都clear掉，可以监听multigltfmarker内部是否发生变化
        }
        for (let i = 0; i < markers.length; i++) {
            const marker = markers[i];
            const url = marker.getUrl();
            if (marker instanceof MultiGLTFMarker || marker.isAnimated() || !marker._converted) {
                this._setRenderMeshes(marker, timestamp);
                continue;
            }
            if (this._isDirty()) {
                const shader = marker.getShader();
                const shadow = marker.isCastShadow() ? 1 : 0;
                const key = `${url}_${shader}_${shadow}`;
                if (!this._multigltfmarker[key]) {
                    this._multigltfmarker[key] = this._markerToMultiGLTFMarker(marker);
                } else {
                    this._multigltfmarker[key].addData(this._createDataItem(marker));
                }
            }
        }

        for (const key in this._multigltfmarker) {
            const marker = this._multigltfmarker[key];
            marker.createdBygltfmarker = true;
            this._setRenderMeshes(marker, timestamp);
        }
    }

    _prepareRenderUniforms() {
        const renderUniforms = {};
        this._uniforms.outSize = [this.canvas.width, this.canvas.height];
        this._uniforms.halton = [0, 0];
        const inGroup = this.canvas.gl && this.canvas.gl.wrap;
        // 如果不在group里，map会以options.opacity透明度绘制layer canvas，所以layerOpacity需要设置为1
        const layerOpacity = inGroup ? (this.layer.options.opacity || 0) : 1;
        renderUniforms.layerOpacity = layerOpacity;

        maptalks.Util.extend(renderUniforms, this._uniforms);
        //for mask
        const maskUniforms = this.getMaskUniforms();
        maptalks.Util.extend(renderUniforms, maskUniforms);
        return renderUniforms;
    }

    _createSceneByShader(shaderName) {
        const pointLine = [], triangle = [];
        if (shaderName === 'pointline') {
            for (const sName in this._toRenderMeshes) {
                if (sName === 'wireframe') {
                    continue;
                }
                const meshes = this._toRenderMeshes[sName];
                meshes.forEach(mesh => {
                    if (pointLineModes.indexOf(mesh.geometry.desc.primitive) > -1) {
                        pointLine.push(mesh);
                    }
                });
            }
            const pointLineScene = new reshader.Scene(pointLine);
            pointLineScene.sortMeshes(this._uniforms.cameraPosition);
            return pointLineScene;
        }
        for (const sName in this._toRenderMeshes) {
            const meshes = this._toRenderMeshes[sName];
            if (sName === shaderName) {
                meshes.forEach(mesh => {
                    if (pointLineModes.indexOf(mesh.geometry.desc.primitive) < 0 || shaderName === 'wireframe') {
                        triangle.push(mesh);
                    }
                });
            }
        }
        const triangleScene = this._triangleScene = this._triangleScene || new reshader.Scene();
        triangleScene.setMeshes(triangle);
        triangleScene.sortMeshes(this._uniforms.cameraPosition);
        return triangleScene;
    }

    needToRedraw() {
        if (super.needToRedraw()) {
            return true;
        }
        return this._isDirty();

    }

    _isDirty() {
        const geoList = this.layer.getGeometries();
        for (let i = 0; i < geoList.length; i++) {
            if (this._renderMarkerList.indexOf(geoList[i]) > -1 && (geoList[i].isDirty() || geoList[i].isAnimated())) {
                return true;
            }
        }
        return false;
    }

    onRemove() {
        if (this.workerConn) {
            this.workerConn.removeLayer(this.layer.getId(), err => {
                if (err) throw err;
            });
            this.workerConn.remove();
            delete this.workerConn;
        }
        super.onRemove();
    }

    hitDetect() {
        return false;
    }

    createContext() {
        const inGroup = this.canvas.gl && this.canvas.gl.wrap;
        if (inGroup) {
            this.gl = this.canvas.gl.wrap();
            this.regl = this.canvas.gl.regl;
        } else {
            const layer = this.layer;
            const attributes = layer.options.glOptions || {
                alpha: true,
                depth: true,
                //antialias: true,
                stencil : true
            };
            this.glOptions = attributes;
            this.gl = this.gl || this._createGLContext(this.canvas, attributes);
            this.regl = createREGL({
                gl : this.gl,
                optionalExtensions : [
                    'ANGLE_instanced_arrays',
                    'OES_element_index_uint',
                    'OES_standard_derivatives',
                    'OES_vertex_array_object',
                    'OES_texture_half_float', 'OES_texture_half_float_linear',
                    'OES_texture_float', 'OES_texture_float_linear',
                    'WEBGL_depth_texture', 'EXT_shader_texture_lod',
                    'WEBGL_compressed_texture_s3tc'
                ]
            });
        }
        if (inGroup) {
            this.canvas.pickingFBO = this.canvas.pickingFBO || this.regl.framebuffer(this.canvas.width, this.canvas.height);
        }
        this.pickingFBO = this.canvas.pickingFBO || this.regl.framebuffer(this.canvas.width, this.canvas.height);
        this._gltfManager = this.regl.gltfManager = this.regl.gltfManager || this._createGLTFManager();
        // this._loginMarkerList();
        this._initRenderer();
        //检查是否有mesh、geometry未generate buffer过
        if (this._noBuffersMeshes) {
            this._noBuffersMeshes.forEach(mesh => {
                mesh.generateInstancedBuffers(this.regl);
            });
        }
        if (this._noBuffersGeometries) {
            this._noBuffersGeometries.forEach(geometry => {
                geometry.generateBuffers(this.regl);
            });
        }
        this.layer.fire('contextcreate', { regl: this.regl });
    }

    getGLTFManager() {
        return this._gltfManager;
    }

    _createGLTFManager() {
        return new reshader.GLTFManager(this.regl);
    }

    _initRenderer() {
        const map = this.layer.getMap();
        const renderer = new reshader.Renderer(this.regl);
        this.renderer = renderer;
        this._uniforms = {
            'projMatrix': map.projMatrix,
            'projViewMatrix' : map.projViewMatrix,
            'viewMatrix': map.viewMatrix,
            //TODO 增加uCameraPosition用来适配pbr, 后面需要删掉
            'cameraPosition' : map.cameraPosition,
            'altitudeScale': 1
        };
        reshader.pbr.PBRUtils.loginIBLResOnCanvas(this.canvas, this.regl, map);

        this._picking = new reshader.FBORayPicking(
            renderer,
            {
                vert : pickingVert,
                uniforms : [
                    {
                        name : 'modelViewMatrix',
                        type : 'function',
                        fn : function (context, props) {
                            return mat4.multiply([], props['viewMatrix'], props['modelMatrix']);
                        }
                    }
                ]
            },
            this.pickingFBO,
            map
        );
    }

    prepareWorker() {
        if (!this.workerConn) {
            this.workerConn = new GLTFWorkerConnection('@maptalks/gltf-layer', this.layer);
        }
        const workerConn = this.workerConn;
        if (!workerConn.isActive()) {
            return;
        }
        const options = this.layer.options || {};
        const id = this.layer.getId();
        workerConn.addLayer(id, {
            markerType: options.markerTypes,
            pointSize: options.pointSize
        }, err => {
            if (err) throw err;
            if (!this.layer) return;
            this.ready = true;
            this.layer.fire('workerready');
        });
    }

    _requestor(url) {
        const urlModifier = this.layer.getURLModifier();
        let promise;
        if (urlModifier) {
            // 有urlModifier时，在主线程中请求模型
            const fetchOptions = this.layer.options.fetchOptions;
            promise = loadGLTF(null, url, fetchOptions, (url) => {
                const urlModifier = this.layer.getURLModifier();
                if (urlModifier) {
                    return urlModifier(url);
                } else {
                    return url;
                }
            });
        } else {
            promise = this.workerConn.loadGLTF(url);
        }
        return promise.then(data => {
            this.setToRedraw();
            this._needRetireFrames = true;
            return data;
        }).catch(err => {
            console.error(err);
            this.layer.fire('modelerror', { type: 'modelerror', url, info: err });
        });
    }

    _updateShaderList(context) {
        //遍历shader目录，主要包含默认shader和预先注册的shader
        const shaderMap = SHADER_MAP;
        for (const name in shaderMap) {
            if (this._shaderList[name]) {
                continue;
            }
            const shader = shaderMap[name];
            this._registerShader(context, shader.name, shader.type, shader.config);
        }
    }

    _registerShader(context, name, type, config) {
        if (!this.viewport) {
            this.viewport = {
                x : 0,
                y : 0,
                width : () => {
                    return this.canvas ? this.canvas.width : 1;
                },
                height : () => {
                    return this.canvas ? this.canvas.height : 1;
                }
            };
        }
        if (!config.extraCommandProps) {
            config.extraCommandProps = {};
        }
        const defines = {};
        if (context) {
            this._fillIncludes(defines, uniformDeclares, context);
        }
        //对shadermap进行复制，以免影响全局shadermap
        const copyConfig = maptalks.Util.extend({}, config);
        copyConfig.extraCommandProps = maptalks.Util.extend({}, config.extraCommandProps);
        copyConfig.extraCommandProps.viewport = this.viewport;
        copyConfig.uniforms = maptalks.Util.extend([], config.uniforms, uniformDeclares);
        copyConfig.defines = maptalks.Util.extend({}, copyConfig.defines, defines);
        if (type.indexOf('.') > -1) {
            type = type.split('.');
            this._shaderList[name] = {
                shader: new reshader[type[0]][type[1]](copyConfig),
                type
            };
        } else {
            this._shaderList[name] = {
                shader: new reshader[type](copyConfig),
                type
            };
        }
    }

    remove() {
        //图层移除时，销毁PBR相关资源
        this._disposePBRResource();
        //shader资源的释放
        const shaderList = this._shaderList;
        for (const name in shaderList) {
            shaderList[name].shader.dispose();
        }
        if (this.extentShader) {
            this.extentShader.dispose();
        }
        super.remove();
    }

    clearCanvas() {
        if (!this.canvas) {
            return;
        }
        this.regl.clear({
            color: [0, 0, 0, 0],
            depth: 1,
            stencil : 0
        });
        super.clearCanvas();
    }

    resizeCanvas(size) {
        super.resizeCanvas(size);
        if (this.pickingFBO) {
            this.pickingFBO.resize(this.canvas.width, this.canvas.height);
        }
        this.layer.fire('resizecanvas', { size });
    }

    getFrameTimestamp() {
        return this._currentFrameTime;
    }

    getFrameContext() {
        return this._drawContext;
    }

    needRetireFrames() {
        return this._needRetireFrames;
    }

    _fillIncludes(defines, uniformDeclares, context) {
        const includes = context && context.includes;
        if (includes) {
            for (const p in includes) {
                if (includes[p]) {
                    if (context[p].uniformDeclares) {
                        uniformDeclares.length = 0;
                        uniformDeclares.push(...context[p].uniformDeclares);
                    }
                    if (context[p].defines) {
                        maptalks.Util.extend(defines, context[p].defines);
                    }
                }
            }
        }
    }

    _setIncludeUniformValues(uniforms, context) {
        const includes = context && context.includes;
        if (includes) {
            for (const p in includes) {
                if (includes[p]) {
                    if (context[p].renderUniforms) {
                        maptalks.Util.extend(uniforms, context[p].renderUniforms);
                    }
                }
            }
        }
    }

    //更新shader
    _updateShader(context, shaderName) {
        const { shader, type } = this._shaderList[shaderName];
        let newShader = null;
        const uniforms = {};
        this._setIncludeUniformValues(uniforms, context);
        //includesChanged为true时重新创建shader
        //首帧由于includesChanged始终为false，需要重新创建shader
        if (context.states.includesChanged) {
            const defines = {};
            this._fillIncludes(defines, uniformDeclares, context);
            const shaderConfig = {
                vert: shader.vert,
                frag: shader.frag,
                uniforms: shader.uniforms,
                extraCommandProps: shader.extraCommandProps
            };
            shaderConfig.defines = defines;
            shaderConfig.uniforms = maptalks.Util.extend([], shaderConfig.uniforms, uniformDeclares);
            if (Array.isArray(type)) {
                newShader = new  reshader[type[0]][type[1]](shaderConfig);
            } else {
                newShader = new reshader[type](shaderConfig);
            }
            shader.dispose();
        } else {
            newShader = shader;
        }
        return { uniforms, newShader };
    }

    //将context上面analysis相关的uniforms更新到全局uniforms上去
    _setUniformsForAnalysis(context, shader, uniforms) {
        if (context.viewshed) {
            for (const u in context.viewshed.renderUniforms) {
                uniforms[u] = context.viewshed.renderUniforms[u];
            }
            maptalks.Util.extend(shader.shaderDefines, context.viewshed.defines);
        }
        if (context.floodAnalysis) {
            for (const u in context.floodAnalysis.renderUniforms) {
                uniforms[u] = context.floodAnalysis.renderUniforms[u];
            }
            maptalks.Util.extend(shader.shaderDefines, context.floodAnalysis.defines);
        }
        return uniforms;
    }

    //获取设置阴影的mesh
    getShadowMeshes() {
        const shadowMeshes = [];
        //图层在隐藏后不应该还有阴影
        if (!this.layer || !this.layer.isVisible() || !this._toRenderMeshes) {
            return shadowMeshes;
        }
        const markers = this.layer.getGeometries();
        for (let i = 0; i < markers.length; i++) {
            if (markers[i].isCastShadow() && markers[i].isVisible() && markers[i]._getOpacity() && !markers[i]._converted) {
                const meshes = markers[i]._meshes || [];
                maptalks.Util.pushIn(shadowMeshes, meshes);
            }
        }
        for (const key in this._multigltfmarker) {
            const marker = this._multigltfmarker[key];
            if (marker.isCastShadow() && marker.isVisible() && marker._getOpacity()) {
                const meshes = marker._meshes || [];
                maptalks.Util.pushIn(shadowMeshes, meshes);
            }
        }
        return shadowMeshes;
    }

    _getToRenderMeshes() {
        const meshes = [];
        if (!this._toRenderMeshes || !Object.keys(this._toRenderMeshes).length) {
            return meshes;
        }
        for (const sName in this._toRenderMeshes) {
            maptalks.Util.pushIn(meshes, this._toRenderMeshes[sName]);
        }
        return meshes;
    }

    getAnalysisMeshes() {
        return this._getToRenderMeshes();
    }

    getRayCastData(mesh) {
        const markers = this.layer.getGeometries();
        for (let i = 0; i < markers.length; i++) {
            const meshes = markers[i]._meshes;
            if (meshes && meshes.indexOf(mesh) > -1) {
                return markers[i];
            }
        }
        return null;
    }

    drawOutline(fbo) {
        if (!this.extentShader) {
            this.extentShader = new reshader.MeshShader({
                vert: sceneVert,
                frag: extentFrag,
                uniforms: [
                    {
                        name: 'modelViewMatrix',
                        type: 'function',
                        fn: (_, props) => {
                            return mat4.multiply([], props['viewMatrix'], props['modelMatrix']);
                        }
                    },
                ],
                positionAttribute: 'POSITION',
                extraCommandProps: {
                    viewport: this.viewport,
                    cull: {
                        enable: false
                    },
                    blend: {
                        enable: true,
                        func: {
                            src: 'src alpha',
                            dst: 'one minus src alpha'
                        },
                        equation: 'add'
                    }
                },
            });
        }
        const outlineMeshes = this.getOutlineMeshes();
        if (!outlineMeshes.length) {
            return;
        }
        this._outlineScene = this._outlineScene || new reshader.Scene();
        this._outlineScene.setMeshes(outlineMeshes);
        this.renderer.render(this.extentShader, {
            'projMatrix': this._uniforms.projMatrix,
            'viewMatrix': this._uniforms.viewMatrix
        }, this._outlineScene, fbo);
    }

    //获取设置outline的mesh
    getOutlineMeshes() {
        const outlineMeshes = [];
        if (!this.layer) {
            return outlineMeshes;
        }
        const markers = this.layer.getGeometries();
        for (let i = 0; i < markers.length; i++) {
            if (markers[i]._converted) {
                continue;
            }
            const meshes = markers[i]._getOutlineMeshes();
            maptalks.Util.pushIn(outlineMeshes, meshes);
        }
        for (const key in this._multigltfmarker) {
            const meshes = this._multigltfmarker[key]._getOutlineMeshes();
            maptalks.Util.pushIn(outlineMeshes, meshes);
        }
        return outlineMeshes;
    }

    _disposePBRResource() {
        if (this.canvas) {
            reshader.pbr.PBRUtils.logoutIBLResOnCanvas(this.canvas, this.getMap());
        }
    }

    _updateLightUniforms(context) {
        const map = this.layer.getMap();
        const { iblTexes, dfgLUT } = reshader.pbr.PBRUtils.getIBLResOnCanvas(this.canvas);
        if (map && map.getLights()) {
            // 获取 pbr 灯光设置相关的 uniforms
            const pbrUniforms = reshader.pbr.PBRUtils.getPBRUniforms(map, iblTexes, dfgLUT, context && context.ssr, context && context.jitter);
            const lightConfig = map.getLights();
            //phong光照需要设置ambientColor
            const ambientColor = (lightConfig.ambient && lightConfig.ambient.color) ? lightConfig.ambient.color : [0.2, 0.2, 0.2];
            this._uniforms['ambientColor'] = ambientColor;
            if (pbrUniforms) {
                maptalks.Util.extend(this._uniforms, pbrUniforms);
            }
        } else {
            const lightUniforms = reshader.pbr.PBRUtils.getPBRUniforms(map, null, dfgLUT, context && context.ssr, context && context.jitter);
            maptalks.Util.extend(this._uniforms, lightUniforms);
        }
    }

    _createGLContext(canvas, options) {
        const names = ['webgl', 'experimental-webgl'];
        let context = null;
        /* eslint-disable no-empty */
        for (let i = 0; i < names.length; ++i) {
            try {
                context = canvas.getContext(names[i], options);
            } catch (e) {}
            if (context) {
                break;
            }
        }
        return context;
        /* eslint-enable no-empty */
    }

    _pick(x, y, options = {}) {
        if (!this._picking || !this.layer.isVisible()) {
            return null;
        }
        const map = this.layer.getMap();
        const inGroup = this.canvas.gl && this.canvas.gl.wrap;
        //如果图层在groupgllayer中，则每次pick都要refresh
        if (this._needRefreshPicking || inGroup) {
            if (!this._toRenderMeshes || !Object.keys(this._toRenderMeshes).length) {
                return null;
            }
            const meshes = this._getToRenderMeshes();
            const uniforms = maptalks.Util.extend({}, this._uniforms);
            uniforms['pointSize'] = this.layer.options['pointSize'] || 1.0;
            this._picking.render(meshes, uniforms, true);
            this._needRefreshPicking = false;
        }
        const method = options.returnAll ? 'pickAll' : 'pick';
        const results = this._picking[method](
            x,   // 屏幕坐标 x轴的值
            y,  // 屏幕坐标 y轴的值
            options.tolerance || 3,
            {
                'projMatrix': map.projMatrix,
                'viewMatrix': map.viewMatrix,
                'pointSize': this.layer.options['pointSize'] || 1.0
            },
            {
                viewMatrix : map.viewMatrix,  //viewMatrix和projMatrix用于计算点的世界坐标值
                projMatrix : map.projMatrix,
                returnPoint : true
            }
        );
        if (results.length) {
            const checked = {};
            const pickedResults = [];//只返回pickingId唯一的
            for (let i = 0; i < results.length; i++) {
                if (!checked[results[i].pickingId]) {
                    const result = this._getResult(results[i]);
                    checked[results[i].pickingId] = true;
                    pickedResults.push(result);
                }
            }
            return pickedResults;
        }
        return this._getResult(results);
    }

    _getResult(result) {
        const { meshId, pickingId, point, coordinate } = result;
        const meshes = this._getToRenderMeshes();
        const mesh = meshes[meshId];
        const markerId = this._squeezeTarget(pickingId);
        const data = this.layer._getMarkerMap()[markerId];
        const index = pickingId - markerId;
        const nodeIndex = this._getNodeIndex(meshId);
        return { meshId, mesh, data, pickingId, point, coordinate, index, nodeIndex };
    }

    _getNodeIndex(meshId) {
        const meshes = this._getToRenderMeshes();
        const mesh = meshes[meshId];
        return mesh && mesh.properties.nodeIndex;
    }
    //根据pickingId,查找其所属于哪个marker, 返回marker的markerId, 其中pickingId是连续的，但如果图层上存在groupmarker, markerId不一定连续
    //pickingId : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    //markerId : [0, 1, 2, 3, 4, 10, 11, 12]
    //上面markerId中4到10表示有一个groupmarker, 且它含有6个数据项。例如，要查找pickingId为7所属的marker, 结果应该为4
    _squeezeTarget(pickingId) {
        if (!defined(pickingId)) {
            return null;
        }
        if (this.layer._getMarkerMap()[pickingId]) {
            return pickingId;
        }
        const keys = Object.keys(this.layer._getMarkerMap());
        const length = keys.length;
        let left = 0;
        let right = length - 1;
        let middle = Math.floor((left + right) / 2);
        while (left <= length - 1 && right >= 0) {
            if (left === right) {
                return keys[left];
            } else if (keys[middle] <= pickingId && pickingId < keys[middle + 1]) {
                return keys[middle];
            } else if (pickingId < keys[middle]) {
                right = middle - 1;
                middle = Math.floor((left + right) / 2);
            } else if (keys[middle + 1] < pickingId) {
                left = middle + 1;
                middle = Math.floor((left + right) / 2);
            }
        }
        return null;
    }

    isInFrustum(marker) {
        const map = this.layer.getMap();
        const bbox = marker.getBoundingBox();
        if (!bbox || marker.getGLTFMarkerType() === 'multigltfmarker') {//multigltfmarker由于没有coordinate, coordinates是分散于instanceData中，无法提供确定bbox，所以这里需要排除掉
            return true;
        }
        const boundingBox = vec2.set(tempBBox, bbox.min, bbox.max);
        if (intersectsBox(map.projViewMatrix, boundingBox)) {
            return true;
        }
        return false;
    }

    getRenderMeshesTest() {
        return this._getToRenderMeshes();
    }

    isMarkerTransparent(marker) {
        return marker._isTransparent();
    }

    getMarkerFitSizeScale(marker) {
        return marker._getFitSizeScale();
    }

    getMarkerFitTranslate(marker) {
        return marker._getFitTranslate();
    }

    getFBORayPicking() {
        return this._picking;
    }

    getShaderList() {
        return this._shaderList;
    }
}

export default GLTFLayerRenderer;
