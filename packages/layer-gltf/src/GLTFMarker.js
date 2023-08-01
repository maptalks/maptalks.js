import { Marker, Util, Point, Extent } from 'maptalks';
import { mat4, quat, vec3, vec4, reshader } from '@maptalks/gl';
import { defined, coordinateToWorld, getAbsoluteValue } from './common/Util';
import { loadFunctionTypes, hasFunctionDefinition } from '@maptalks/function-type';
import { intersectsBox } from 'frustum-intersects';

const EMPTY_QUAT = [];
//const DEFAULT_AXIS = [0, 0, 1];
const options = {
    symbol: null
};
const VEC41 = [], VEC42 = [], MAT4 = [], TEMP_SCALE = [1, 1, 1], TEMP_MAT = [], TEMP_TRANS = [], TEMP_FIXSIZE_SCALE = [1, 1, 1];
const TEMP_BBOX = new reshader.BoundingBox();
const Y_UP_TO_Z_UP = fromRotationTranslation(fromRotationX(Math.PI * 0.5), [0, 0, 0]);
const TEMP_POINT = new Point(0, 0);
const defaultColor = [186 / 255, 186 / 255, 186 / 255, 1];
const defaultOpacity = 1;
const phongUniforms = {
    'lightAmbient': [1.0, 1.0, 1.0],
    'lightDiffuse': [1.0, 1.0, 1.0],
    'lightSpecular': [1.0, 1.0, 1.0],
    'lightDirection': [1.0, 1.0, 1.0]
};
const effectSymbols = new Set(['url', 'translationX', 'translationY', 'translationZ', 'rotationX', 'rotationY', 'rotationZ', 'scaleX', 'scaleY', 'scaleZ', 'anchorZ', 'markerPixelHeight', 'modelHeight']);

export default class GLTFMarker extends Marker {
    constructor(coordinates, options) {
        //Marker中有维护自己的symbol，为避免重复处理symbol，先去掉symbol字段，后面利用自己的处理逻辑
        const opts = Util.extend({}, options);
        const symbol = opts['symbol'];
        // delete opts['symbol'];
        super(coordinates, opts);
        //父类会将symbol中的属性全部删掉，需要保存后再恢复
        this.options.symbol = symbol;
        this._loaded = false;
        this._modelMatrix = mat4.identity([]);
        this._type = 'gltfmarker';
        this._dirty = true;
        this._dirtyMarkerBBox = true;
        this._defaultTRS = {
            get translation() {
                return [0, 0, 0];
            },
            get rotation() {
                return [0, 0, 0];
            },
            get scale() {
                return [1, 1, 1];
            }
        };
        this._updateTRSMatrix();
    }

    static parseJSONData(json) {
        const marker = GLTFMarker.fromJSON(json);
        marker.setZoomOnAdded(json['zoomOnAdded']);
        return marker;
    }

    static fromJSON(json) {
        return new GLTFMarker(json.coordinates, json.options);
    }

    getMeshes(gltfManager, regl, timestamp) {
        let meshes = [];
        const map = this.getMap();
        if (regl) {
            this.regl = regl;
        }
        if (this.getLayer().isVisible() && this.isVisible() && this._getOpacity()) {
            if (!this._meshes) {
                this._loginGLTF(gltfManager, regl);
                return meshes;
            }
            let needUpdateMatrix = this.isAnimated() ||
            (this._getMarkerPixelHeight() && map.isZooming()) ||
            this._dirtyMarkerBBox ||
            (this.getGLTFMarkerType() === 'multigltfmarker' && this._dirty);
            if (!needUpdateMatrix) {
                const trsMatrix = this._modelMatrix;
                mat4.copy(TEMP_MAT, trsMatrix);
                this._updateTRSMatrix();
                needUpdateMatrix = !mat4.exactEquals(trsMatrix, TEMP_MAT);
            }
            if (needUpdateMatrix) {
                this._updateMeshMatrix(this._meshes, timestamp);
            }
            meshes = this._meshes.filter(mesh => {
                if (intersectsBox(map.projViewMatrix, mesh.getBoundingBox()) || mesh instanceof reshader.InstancedMesh) {
                    this._updateUniforms(mesh);
                    this._updateDefines(mesh);
                    return true;
                }
                return false;
            });
            this._dirty = false;
        }
        return meshes;
    }

    _getGLTFData() {
        return this._gltfData;
    }

    _setGLTFData(data) {
        this._gltfData = data;
    }

    _setPropInExternSymbol(prop, value) {
        this['_externSymbol'] = this['_externSymbol'] || {};
        this['_externSymbol'][prop] = value;
        if (prop === 'uniforms') {
            this._uniformDirty = true;
        }
    }

    setUrl(url) {
        this.updateSymbol({ url });
        return this;
    }

    setSymbol(symbol) {
        const url = this.getUrl();
        super.setSymbol(symbol);
        const shader = this.getShader();
        const gltfManager = this._gltfManager;
        if (gltfManager && symbol.url !== url) {
            gltfManager.logoutGLTF(url);
            this._login = false;
            this._setLoadState(false);
            delete this._meshes;
        }
        if (this._shader && this._shader !== shader) {
            // 只有shader存在且和symbol不同时才更新
            // https://github.com/maptalks/issues/issues/271
            this._updateGeometries(gltfManager, this.regl);

        }
        this._shader = shader;
        this._uniformDirty = true;
        this._dirty = true;
    }

    getCenter() {
        const map = this.getMap();
        if (!map) {
            return null;
        }
        const center = super.getCenter();
        const coordPosition = coordinateToWorld(map, center || this.getCoordinates());
        if (!coordPosition) {
            return null;
        }
        const translate = this._getTranslationPoint();
        const currentPosition = new Point([coordPosition[0] + translate[0], coordPosition[1] + translate[1]]);

        return map.pointAtResToCoord(currentPosition, map.getGLRes());
    }

    getPointZ() {
        const coordinate = this.getCoordinates();
        const map = this.getMap();
        if (!map || !coordinate) {
            return null;
        }
        const altitude = map.altitudeToPoint(coordinate.z || 0, map.getGLRes());
        return altitude;
    }

    getUrl() {
        const symbol = this['_getInternalSymbol']();
        return symbol && symbol.url || 'pyramid';
    }

    addTo(layer) {
        if (this.getLayer()) {
            throw new Error('GLTFMarker cannot be added to two or more layers at the same time.');
        }
        layer.addGeometry(this);
        return this;
    }

    _loginGLTF(gltfManager, regl) {
        const url = this.getUrl();
        this._gltfManager = gltfManager;
        if (!this._login) {
            if (!this._gltfRequestor) {
                const renderer = this.getLayer().getRenderer();
                this._gltfRequestor = renderer._requestor.bind(renderer);
            }
            gltfManager.loginGLTF(url, this._gltfRequestor);
            this._login = true;
        }
        const resource = gltfManager.getGLTF(url);
        if (resource && !resource.then) {
            this._setLoadState(true);
            this._createMeshes(resource, gltfManager, regl);
        }

    }

    _updateUniforms(mesh, timestamp) {
        if (this.getGLTFMarkerType() === 'effectmarker') {
            this.updateUV(timestamp);
        } else if (this.getGLTFMarkerType() === 'glowmarker') {
            this._updateTime();
        }
        const markerUniforms = this.getUniforms();
        //此处涉及到材质的更新，比较耗费性能，对于不需要更新材质的操作尽量不去更新
        if (markerUniforms  && this.isDirty() && this._isUniformsDirty()) {
            for (const u in markerUniforms) {
                mesh.material.set(u, markerUniforms[u]);
            }
        }
        if (this._isTransparent()) {
            mesh.transparent = true;
        }
        mesh.bloom = +!!this.isBloom();
        mesh.setUniform('uPickingId', this._getPickingId());
        mesh.properties.isAnimated = this.isAnimated();
        this._setPolygonFill(mesh);
    }

    _updateDefines(mesh) {
        const shader = this.getShader();
        const defines = mesh.getDefines();
        let needUpdateDefines = false;
        if (shader === 'pbr' || shader === 'pbr-lite') {
            const layer = this.getLayer();
            const { iblTexes } = reshader.pbr.PBRUtils.getIBLResOnCanvas(layer.getRenderer().canvas);
            if (iblTexes) {
                if (!defines['HAS_IBL_LIGHTING']) {
                    defines['HAS_IBL_LIGHTING'] = 1;
                    needUpdateDefines = true;
                }
            } else {
                if (defines['HAS_IBL_LIGHTING']) {
                    needUpdateDefines = true;
                    delete defines['HAS_IBL_LIGHTING'];
                }
            }
        }
        if (needUpdateDefines) {
            mesh.setDefines(defines);
        }
        const renderer = this.getLayer().getRenderer();
        if (renderer) {
            renderer.updateMaskDefines(mesh);
        }
    }

    _updateGeometries(gltfManager) {
        const url = this.getUrl();
        const meshes = this._meshes;
        if (!gltfManager || !meshes) {
            return;
        }
        if (gltfManager.isSimpleModel(url)) {
            this._updateMaterials(meshes);
            return;
        }
        const geometryObject = gltfManager.getGLTF(url);
        if (!geometryObject) {
            return;
        }
        meshes.forEach(mesh => {
            this._updateUniforms(mesh);
        });
        this._updateMaterials(meshes);
    }

    _updateMaterials(meshes) {
        const shader = this.getShader();
        meshes.forEach(mesh => {
            const material = this._buildMaterial(mesh.properties.geometryResource);
            //如果是wireframe，则用edgeGeometry, 同时判断一下是否有edgeGeometry
            if (shader === 'wireframe') {
                if (mesh.properties.geometryResource && !mesh.properties.geometryResource.copyGeometry) {
                    mesh.properties.geometryResource.copyEdgeGeometry();
                }
                mesh.geometry = mesh.properties.geometryResource.copyGeometry;
            } else {
                mesh.geometry = mesh.properties.geometryResource.geometry;
            }
            mesh.material = material;
        });
    }

    _updateMeshMatrix(meshes, timestamp) {
        vec3.set(TEMP_SCALE, 1, 1, 1);
        const tmpMat = mat4.identity(TEMP_MAT);
        const isAnimated = this.isAnimated();
        //updateTRSMatrx方法更新
        this._updateTRSMatrix();
        const modelMatrix = this.getModelMatrix();
        const {nodeMatrixMap, skinMap } = this._updateAnimation(timestamp);
        this._calSpatialScale(TEMP_SCALE);
        let zOffset = 0;
        const markerPixelHeight = this._getMarkerPixelHeight();
        const modelHeight = this.getModelHeight();
        if (markerPixelHeight && markerPixelHeight > 0) {
            const fixSizeScale = this._calFixSizeScale(TEMP_FIXSIZE_SCALE);
            vec3.multiply(TEMP_SCALE, TEMP_SCALE, fixSizeScale);
        } else if (modelHeight) {
            const modelHeightScale = this._calModelHeightScale(TEMP_FIXSIZE_SCALE);
            vec3.multiply(TEMP_SCALE, TEMP_SCALE, modelHeightScale);
        }
        meshes.forEach((mesh) => {
            const nodeIndex = mesh.properties.geometryResource.nodeIndex;
            const animNodeMatrix = nodeMatrixMap[nodeIndex];
            const nodeMatrix = isAnimated && animNodeMatrix ? animNodeMatrix : mesh.nodeMatrix;
            mat4.scale(tmpMat, modelMatrix, TEMP_SCALE);
            mat4.multiply(tmpMat, tmpMat, Y_UP_TO_Z_UP);
            if (mesh instanceof reshader.InstancedMesh) {
                mesh.positionMatrix = mat4.multiply(mesh.positionMatrix, tmpMat, nodeMatrix);
                mesh.localTransform = this._getCenterMatrix();
                this._updateInstancedMeshData(mesh);
            } else {
                mesh.localTransform = mat4.multiply(mesh.localTransform, tmpMat, nodeMatrix);
            }
            const gltfBBox = mesh.geometry.boundingBox;
            const meshBox = gltfBBox.copy(TEMP_BBOX);
            meshBox.transform(mesh.positionMatrix, mesh.localTransform);
            const offset =  this._calAnchorTranslation(meshBox);
            if (Math.abs(offset) > Math.abs(zOffset)) {
                zOffset = offset;
            }
            if (isAnimated) {
                const skin  = skinMap[nodeIndex];
                if (skin) {
                    mesh.material.set('skinAnimation', 1);
                    mesh.material.set('jointTextureSize', skin.jointTextureSize);
                    mesh.material.set('numJoints', skin.numJoints);
                    mesh.material.set('jointTexture', skin.jointTexture);
                }
                const morphWeights = mesh.geometry.properties.morphWeights;
                if (morphWeights) {
                    this._fillMorphWeights(morphWeights, mesh.material);
                }
            } else {
                mesh.material.set('skinAnimation', 0);
            }
        });
        if (zOffset !== 0) {
            meshes.forEach(mesh => {
                vec3.set(TEMP_TRANS, 0, 0, zOffset);
                const matrix = mat4.fromTranslation(TEMP_MAT, TEMP_TRANS);
                if (mesh instanceof reshader.InstancedMesh) {
                    mesh.positionMatrix = mat4.multiply(mesh.positionMatrix, matrix, mesh.positionMatrix);
                    this._updateInstancedMeshData(mesh);
                } else {
                    const localTransform = mat4.multiply(mesh.localTransform, matrix, mesh.localTransform);
                    mesh.localTransform = localTransform;
                }
            });
        }
        meshes.forEach(mesh => {
            if (mesh instanceof reshader.InstancedMesh) {
                this._updateInstancedMeshData(mesh);
            }
        });
    }

    _calSpatialScale(out) {
        const map = this.getMap();
        const glRes = map.getGLRes();
        const scaleZ = map.altitudeToPoint(100, glRes);
        out[0] *= scaleZ / 100;
        out[1] *= scaleZ / 100;
        out[2] *= scaleZ / 100;
        return out;
    }

    _calModelHeightScale(out) {
        const modelHeight = this.getSymbol().modelHeight;
        const bbox = this._gltfModelBBox;
        const fitScale = modelHeight / (Math.abs(bbox.max[1] - bbox.min[1]));//YZ轴做了翻转，所以需要用y方向来算高度比例
        return vec3.set(out, fitScale, fitScale, fitScale);
    }

    _calFixSizeScale(out) {
        const bbox = this._gltfModelBBox;
        const symbol = this.getSymbol();
        const scale = this.getScale();
        const pixelHeight = symbol.markerPixelHeight;
        if (!pixelHeight || pixelHeight < 0 || !bbox) {
            return out;
        }
        const map = this.getMap();
        const boxHeight = Math.abs(bbox.max[1] - bbox.min[1]);
        const pointZ = map.altitudeToPoint(boxHeight, map.getGLRes());
        const heightInPoint = pixelHeight * map.getGLScale();
        const ratio = heightInPoint / pointZ;
        return vec3.set(out, ratio / scale[0] , ratio / scale[1], ratio / scale[2]);
    }

    getCurrentPixelHeight() {
        const bbox = this._getBoundingBox();
        const boxHeight = Math.abs(bbox.max[2] - bbox.min[2]);
        const map = this.getMap();
        return boxHeight / map.getGLScale();
    }

    getFitTranslate(out) {
        const bbox = this._gltfModelBBox;
        const center = vec3.set(out, (bbox.min[0] + bbox.max[0]) / 2, (bbox.min[1] + bbox.max[1]) / 2, (bbox.min[2] + bbox.max[2]) / 2);
        return vec3.scale(center, center, -1);
    }

    _calAnchorTranslation(gltfBBox) {
        const symbol = this.getSymbol();
        const anchorZ = (symbol && symbol.anchorZ) || 'center';
        let zOffset = 0;
        const height = gltfBBox.max[2] - gltfBBox.min[2];
        if (anchorZ === 'bottom') {
            zOffset = height / 2;
        } else if (anchorZ === 'top') {
            zOffset = -height / 2;
        }
        return zOffset;
    }

    _updateAnimation(timestamp) {
        const isAnimated = this.isAnimated();
        const hasGLTFAnimations = this._hasGLTFAnimations();
        const nodeMatrixMap = {};
        const skinMap = this._getSkinMap();
        if (timestamp && isAnimated && this.gltfPack && hasGLTFAnimations) {
            const currentAnimation = this._getCurrentAnimation();
            if (defined(currentAnimation)) {
                this._setAnimationStartTime(timestamp);
                const startTime = this._getAnimationStartTime()
                const looped = this.isAnimationLooped(), speed = this.getAnimationSpeed();
                this.gltfPack.updateAnimation(timestamp, looped, speed, currentAnimation, startTime, nodeMatrixMap, skinMap);
            } else {
                console.warn('animation specified does not exist!');
            }
        }
        return {nodeMatrixMap, skinMap};
    }

    _createMeshes(data, gltfManager, regl) {
        const url = this.getUrl();
        this._setGLTFData(data.json);
        this._prepareMeshes(url, gltfManager, regl);
        this._updateGeometries(gltfManager, regl);
        this.fire('load', { data: data.json });
        this.fire('setUrl-debug');
        this['_fireEvent']('meshcreate', { url });
    }

    _prepareMeshes(url, gltfManager, regl) {
        const modelMeshes = [];
        const shaderName = this.getShader();
        const gltfResource = gltfManager.getGLTF(url);
        //如果gltfResource可重复使用，则直接创建mesh，否则，需要解析gltf结构
        if (gltfResource && gltfResource.resources) {
            if (!gltfResource.resources.length) {
                this['_fireEvent']('modelerror', { url, info: 'there are no geomtries in the gltf model'});
                return;
            }
            this.gltfPack = gltfResource.gltfPack;
            gltfResource.resources.forEach(resource => {
                const modelMesh = this._prepareMesh(resource, shaderName, regl);
                modelMeshes.push(modelMesh);
            });
        }
        this._meshes = modelMeshes;
        this._gltfModelBBox = this._calGLTFModelBBox();
        this._checkSize(this._meshes);
        //用于测试新的mesh生成
        this.fire('createscene-debug', { meshes: this._meshes });
    }

    _checkSize(modelMeshes) {
        this._updateMeshMatrix(modelMeshes);
        const gltfBBox = this._getBoundingBox();
        if (!gltfBBox) {
            return;
        }
        const map = this.getMap();
        const { max, min } = gltfBBox;
        const length = vec3.length([max[0] - min[0], max[1] - min[1], max[2] - min[2]]);
        const pixelSize = length / map.getGLScale();
        if (pixelSize < 20) {
            console.warn('Model\'s size on screen is too small, try to increase its symbol.scaleX/Y/Z');
            this.fire('smallonscreen');
        }
    }

    _getBoundingBox() {
        const meshes = this._meshes;
        if (!meshes || !meshes.length) {
            return null;
        }
        if (!this._dirtyMarkerBBox) {
            return this._markerBBox;
        }
        if (this.getGLTFMarkerType() === 'multigltfmarker') {
            meshes.forEach(mesh => {
                this._updateInstancedMeshData(mesh);
                mesh.updateBoundingBox();
            });
        }
        const bbox0 = meshes[0].getBoundingBox();
        const min = vec3.copy([], bbox0[0]), max = vec3.copy([], bbox0[1]);
        for (let i = 1; i < meshes.length; i++) {
            const bbox = meshes[i].getBoundingBox();
            const bboxMin = vec3.copy([], bbox[0]), bboxMax = vec3.copy([], bbox[1]);
            if (bboxMin[0] < min[0]) {
                min[0] = bboxMin[0];
            }
            if (bboxMin[1] < min[1]) {
                min[1] = bboxMin[1];
            }
            if (bboxMin[2] < min[2]) {
                min[2] = bboxMin[2];
            }

            if (bboxMax[0] > max[0]) {
                max[0] = bboxMax[0];
            }
            if (bboxMax[1] > max[1]) {
                max[1] = bboxMax[1];
            }
            if (bboxMax[2] > max[2]) {
                max[2] = bboxMax[2];
            }
        }
        const bbox = { min, max };
        this._markerBBox = bbox;
        this._dirtyMarkerBBox = false;
        return bbox;
    }

    _calGLTFModelBBox() {
        const meshes = this._meshes;
        if (!meshes || !meshes.length) {
            return null;
        }
        let bbox0 = meshes[0].geometry.boundingBox.copy();
        bbox0 = bbox0.transform(mat4.identity(MAT4), meshes[0].nodeMatrix);
        const min = bbox0.min, max = bbox0.max;
        for (let i = 1; i < meshes.length; i++) {
            let bbox = meshes[i].geometry.boundingBox.copy();
            bbox = bbox.transform(mat4.identity(MAT4), meshes[i].nodeMatrix);
            const bboxMin = bbox.min, bboxMax = bbox.max;
            if (bboxMin[0] < min[0]) {
                min[0] = bboxMin[0];
            }
            if (bboxMin[1] < min[1]) {
                min[1] = bboxMin[1];
            }
            if (bboxMin[2] < min[2]) {
                min[2] = bboxMin[2];
            }

            if (bboxMax[0] > max[0]) {
                max[0] = bboxMax[0];
            }
            if (bboxMax[1] > max[1]) {
                max[1] = bboxMax[1];
            }
            if (bboxMax[2] > max[2]) {
                max[2] = bboxMax[2];
            }
        }
        return{ min, max };
    }

    _prepareMesh(resource, shaderName, regl) {
        const geometryResource = resource;
        const modelMesh = this._buildMesh(geometryResource, shaderName, regl);
        const defines = modelMesh.getDefines();
        if (modelMesh instanceof reshader.InstancedMesh) {
            defines.HAS_PICKING_ID = 1;
            defines.HAS_INSTANCE_COLOR = 1;
        } else {
            defines.HAS_PICKING_ID = 2;
        }
        if (modelMesh.geometry.data['COLOR_0']) {
            defines['HAS_COLOR0'] = 1;
        }
        if (geometryResource.extraInfo && geometryResource.extraInfo.alphaMode === 'MASK') {
            defines['HAS_ALPHAMODE'] = 1;
        }
        modelMesh.setDefines(defines);
        return modelMesh;
    }

    _buildMesh(geometryResource, shaderName, regl) {
        const type = this.getGLTFMarkerType();
        let modelMesh = null;
        const material = this._buildMaterial(geometryResource);
        let geometry = geometryResource.geometry;
        if (shaderName === 'wireframe') {
            geometryResource.copyEdgeGeometry();
            geometry = geometryResource.copyGeometry;
        }
        if (regl) {
            geometry.generateBuffers(regl);
        } else {
            this._noBuffersGeometries = this._noBuffersGeometries || [];
            this._noBuffersGeometries.push(geometry);
        }
        if (type === 'multigltfmarker') {
            this._updateAttributeMatrix();
            const attributes = this._getInstanceAttributesData(mat4.identity(MAT4));
            const count = this.getCount();
            modelMesh = new reshader.InstancedMesh(attributes, count, geometry, material);
            modelMesh.setUniform('instance', 1);
            if (regl) {
                modelMesh.generateInstancedBuffers(regl);
            } else {
                this._noBuffersMeshes = this._noBuffersMeshes || [];
                this._noBuffersMeshes.push(modelMesh);
            }
        } else {
            modelMesh = new reshader.Mesh(geometry, material);
            modelMesh.setUniform('instance', 0);
        }
        modelMesh.nodeMatrix = mat4.copy([], geometryResource.nodeMatrix);
        modelMesh.properties.geometryResource = geometryResource;
        modelMesh.properties.nodeIndex = geometryResource.nodeIndex;
        if (this.isBloom()) {
            modelMesh.bloom = 1;
        }
        modelMesh.transparent = this._isTransparent();
        const extraInfo = geometryResource.extraInfo;
        if (extraInfo.alphaMode === 'BLEND' || extraInfo.alphaMode === 'MASK') {
            modelMesh.transparent = true;
        }
        modelMesh.properties.pickingId = this._getPickingId();
        this._setPolygonFill(modelMesh);
        return modelMesh;
    }

    _buildMaterial(geometryResource) {
        let material = null;
        const shader = this.getShader();
        const markerUniforms = this.getUniforms() || {};
        const materialInfo = geometryResource.materialInfo || {};
        const renderer = this.getLayer().getRenderer();
        if (shader === 'phong') {
            if (materialInfo.name === 'pbrSpecularGlossiness') {
                material = new reshader.PhongSpecularGlossinessMaterial(materialInfo);
            } else {
                for (const u in phongUniforms) {
                    markerUniforms[u] = markerUniforms[u] || phongUniforms[u];
                }
                material = new reshader.PhongMaterial(materialInfo);
            }
        } else if (shader === 'pbr') {
            if (materialInfo.name === 'pbrSpecularGlossiness') {
                material = new reshader.pbr.StandardSpecularGlossinessMaterial(materialInfo);
            } else {
                material = new reshader.pbr.StandardMaterial(materialInfo);
            }
            if (renderer.regl && !reshader.pbr.PBRUtils.isSupported(renderer.regl)) {
                material = reshader.PhongMaterial.convertFrom(material);
                for (const u in phongUniforms) {
                    markerUniforms[u] = markerUniforms[u] || phongUniforms[u];
                }
            }
        } else if (shader === 'pbr-lite') {
            material = new reshader.StandardLiteMaterial(materialInfo);
        } else {
            material = new reshader.Material(materialInfo);
        }
        material.doubleSided = geometryResource.extraInfo && geometryResource.extraInfo['doubleSided'] ? 1 : 0;
        for (const m in markerUniforms) {
            material.set(m, markerUniforms[m]);
        }
        if (geometryResource.morphWeights) {
            this._fillMorphWeights(geometryResource.morphWeights, material);
        }
        if (geometryResource.skin) {
            //默认骨骼动画不开启
            material.set('skinAnimation', 0);
        }
        return material;
    }

    _fillMorphWeights(morphWeights, material) {
        const morphWeights1 = material.get('morphWeights1') || [], morphWeights2 = material.get('morphWeights2') || [];
        for (let i = 0; i < 4; i++) {
            morphWeights1[i] = morphWeights[i] || 0;
            morphWeights2[i] = morphWeights[i + 4] || 0;
        }
        material.set('morphWeights1', morphWeights1);
        material.set('morphWeights2', morphWeights2);
    }

    _setPolygonFill(mesh) {
        const symbol = this.getSymbol();
        if (symbol && symbol.uniforms) {
            mesh.setUniform('polygonFill', symbol.uniforms['polygonFill'] || defaultColor);
            mesh.setUniform('polygonOpacity', symbol.uniforms['polygonOpacity'] === undefined ? defaultOpacity : symbol.uniforms['polygonOpacity']);
            mesh.setUniform('lineColor', symbol.uniforms['lineColor'] || defaultColor);
            mesh.setUniform('lineOpacity', symbol.uniforms['lineOpacity'] === undefined ? defaultOpacity : symbol.uniforms['lineOpacity']);
        } else {
            mesh.setUniform('polygonFill', defaultColor);
            mesh.setUniform('polygonOpacity', defaultOpacity);
            mesh.setUniform('lineColor', defaultColor);
            mesh.setUniform('lineOpacity', defaultOpacity);
        }
    }

    _getMarkerContainerExtent() {
        const layer = this.getLayer();
        if (!layer) {
            return null;
        }
        const map = layer.getMap();
        if (!map) {
            throw Error('marker has not been added to map');
        }
        const gltfBBox = this._getBoundingBox();
        if (!gltfBBox) {
            return null;
        }
        const pointZ = this.getPointZ() || 0;
        const min = gltfBBox.min;
        const max = gltfBBox.max;
        const bboxMin = vec4.set(VEC41, (min[0] + max[0]) / 2, (min[1] + max[1]) / 2, min[2] + pointZ, 1);
        const bboxMax = vec4.set(VEC42, (min[0] + max[0]) / 2, (min[1] + max[1]) / 2, max[2] + pointZ, 1);
        //计算clip space中的最大最小点坐标
        const bboxClipSpaceMin = vec4.transformMat4(bboxMin, bboxMin, map.projViewMatrix);
        const bboxClipSpaceMax = vec4.transformMat4(bboxMax, bboxMax, map.projViewMatrix);
        //clip space转屏幕空间
        const screenMinX = (bboxClipSpaceMin[0] / bboxClipSpaceMin[3] + 1) * map.width / 2;
        const screenMinY = (1 - bboxClipSpaceMin[1] / bboxClipSpaceMin[3]) * map.height / 2;
        const screenMaxX = (bboxClipSpaceMax[0] / bboxClipSpaceMax[3] + 1) * map.width / 2;
        const screenMaxY = (1 - bboxClipSpaceMax[1] / bboxClipSpaceMax[3]) * map.height / 2;
        //由于从一个空间转到另一个空间后，最大最小有可能改变，需要重新比较大小
        const xmin = Math.min(screenMinX, screenMaxX);
        const xmax = Math.max(screenMinX, screenMaxX);
        const ymin = Math.min(screenMinY, screenMaxY);
        const ymax = Math.max(screenMinY, screenMaxY);
        const extent = new Extent({ xmin, ymin, xmax, ymax });
        return extent;
    }

    onAdd() {
        const map = this.getLayer().getMap();
        if (map && !defined(this._zoomOnAdded)) {
            const zoom = map.getZoom();
            this._zoomOnAdded = zoom;
        }
        delete this._gltfRequestor;
    }

    onRemove() {
        this._deleteTRSState();//marker在移除后，需要去掉为自适应大小和位置设置的辅助字段，避免该marker再次添加到图层后对显示效果的影响
    }

    remove() {
        const url = this.getUrl();
        if (this._gltfManager) {
            delete this._meshes;
            this._gltfManager.logoutGLTF(url);
            delete this._gltfManager;
        }
        delete this._gltfData;
        delete this.gltfPack;
        super.remove();
    }

    show() {
        super.updateSymbol({ visible: true });
        return this;
    }

    hide() {
        super.updateSymbol({ visible: false });
    }

    setBloom(bloom) {
        super.updateSymbol({ bloom });
        return this;
    }

    isBloom() {
        const symbol = this['_getInternalSymbol']();
        return symbol && symbol.bloom;
    }

    setCastShadow(shadow) {
        super.updateSymbol({ shadow });
        return this;
    }

    isCastShadow() {
        const symbol = this['_getInternalSymbol']();
        return symbol && symbol.shadow;
    }

    outline() {
        this._outline = true;
        this._dirty = true;
        return this;
    }

    cancelOutline() {
        this._outline = false;
        this._dirty = true;
        return this;
    }

    isOutline() {
        return this._outline;
    }

    isVisible() {
        const symbol = this['_getInternalSymbol']();
        if (symbol && defined(symbol.visible)) {
            return symbol.visible;
        }
        return true;
    }

    //支持数组[x, y]和maptalks.Coordinate两种形式
    setCoordinates(coordinates) {
        super.setCoordinates(coordinates);
        this._dirty = true;
        this._dirtyMarkerBBox = true;
        return this;
    }

    copy() {
        const jsonData = this.toJSON();
        const marker = GLTFMarker.fromJSON(jsonData);
        marker.setZoomOnAdded(this._zoomOnAdded);
        return marker;
    }

    //设置shader后，需要将marker所属shader更新
    setShader(shader) {
        // const old = this.getShader();
        super.updateSymbol({ shader });
        return this;
    }

    getShader() {
        const symbol = this['_getInternalSymbol']();
        return symbol && symbol.shader || 'pbr';
    }

    setUniforms(uniforms) {
        super.updateSymbol({ uniforms });
        this._uniformDirty = true;
        return this;
    }

    getUniforms() {
        const symbol = this['_getInternalSymbol']();
        return symbol && symbol.uniforms;
    }

    setUniform(key, value) {
        const uniforms = this.getUniforms() || {};
        uniforms[key] = value;
        super.updateSymbol({ uniforms });
        this._uniformDirty = true;
        return this;
    }

    getUniform(key) {
        const symbol = this['_getInternalSymbol']();
        return symbol && symbol.uniforms && symbol.uniforms[key];
    }

    isAnimated() {
        const symbol = this['_getInternalSymbol']();
        return symbol && symbol.animation && this._gltfData && this._gltfData.animations;
    }

    isDashAnimated() {
        const symbol = this['_getInternalSymbol']();
        return symbol && symbol.uniforms && symbol.uniforms['dashEnabled'] && symbol.uniforms['dashAnimate'];
    }

    setAnimation(isAnimation) {
        super.updateSymbol({ animation: isAnimation });
        delete this._startAnimationTime;
        return this;
    }

    setAnimationLoop(looped) {
        super.updateSymbol({ loop: looped });
        delete this._startAnimationTime;
        this._dirty = true;
        return this;
    }

    isAnimationLooped() {
        const symbol = this['_getInternalSymbol']();
        return symbol && symbol.loop;
    }


    getAnimationSpeed() {
        const symbol = this['_getInternalSymbol']();
        return symbol && defined(symbol.speed) ? symbol.speed : 1.0;
    }

    setAnimationSpeed(speed) {
        super.updateSymbol({ speed });
        return this;
    }

    _getPosition(coordinate) {
        const map = this.getMap();
        if (map) {
            return coordinateToWorld(map, coordinate || this.getCoordinates());
        }
        return null;
    }

    setTRS(translation, rotation, scale) {
        const trans = translation || this._defaultTRS.translation;
        super.updateSymbol({
            translationX: trans[0],
            translationY: trans[1],
            translationZ: trans[2],
            rotationX: rotation[0],
            rotationY: rotation[1],
            rotationZ: rotation[2],
            scaleX: scale[0],
            scaleY: scale[1],
            scaleZ: scale[2]
        });
        return this;
    }

    _getWorldTranslation() {
        const translation = this._getTranslationPoint();
        const position = this._getPosition();
        if (position) {
            return vec3.add(translation, translation, position);
        }
        return translation;
    }

    updateSymbol(symbol) {
        for (const name in symbol) {
            if (effectSymbols.has(name)) {
                this._dirtyMarkerBBox = true;
                break;
            }
        }
        return super.updateSymbol(symbol);
    }

    setTranslation(translationX, translationY, translationZ) {
        this.updateSymbol({
            translationX,
            translationY,
            translationZ
        });
        return this;
    }

    setRotation(rotationX, rotationY, rotationZ) {
        this.updateSymbol({
            rotationX,
            rotationY,
            rotationZ
        });
        return this;
    }

    setScale(scaleX, scaleY, scaleZ) {
        this.updateSymbol({
            scaleX,
            scaleY,
            scaleZ
        });
        return this;
    }

    getTranslation() {
        const symbol = this['_getInternalSymbol']();
        const translationX = symbol && symbol['translationX'] || 0;
        const translationY = symbol && symbol['translationY'] || 0;
        const translationZ = symbol && symbol['translationZ'] || 0;
        return vec3.set(this._defaultTRS.translation, translationX, translationY, translationZ);
    }

    _getTranslationPoint() {
        const translation = this.getTranslation();
        const map = this.getMap();
        if (!map) {
            return this._defaultTRS.translation;
        }
        return this._translationToWorldPoint(translation);
    }

    _translationToWorldPoint(translation) {
        const map = this.getMap();
        const point = map.distanceToPointAtRes(translation[0], translation[1], map.getGLRes());
        const z = map.altitudeToPoint(translation[2], map.getGLRes());
        return vec3.set([], getAbsoluteValue(point.x, translation[0]), getAbsoluteValue(point.y, translation[1]), getAbsoluteValue(z, translation[2]));
    }

    getRotation() {
        const symbol = this['_getInternalSymbol']();
        const rotationX = symbol && symbol['rotationX'] || 0;
        const rotationY = symbol && symbol['rotationY'] || 0;
        const rotationZ = symbol && symbol['rotationZ'] || 0;
        return vec3.set(this._defaultTRS.rotation, rotationX, rotationY, rotationZ);
    }

    getScale() {
        const symbol = this['_getInternalSymbol']();
        const scaleX = symbol && symbol['scaleX'] || 1;
        const scaleY = symbol && symbol['scaleY'] || 1;
        const scaleZ = symbol && symbol['scaleZ'] || 1;
        return vec3.set(this._defaultTRS.scale, scaleX, scaleY, scaleZ);
    }

    //TODO
    //绕轴旋转的方法暂时不提供，需要知道将四元数组反解为欧拉角的方法
    // rotateAround(angle, axis) {
    //     const out = [];
    //     const rotationAround = quat.setAxisAngle(out, axis || DEFAULT_AXIS,  angle || 0);
    //     this.options.symbol.rotation = quat.multiply(out, rotationAround, this.options.symbol.rotation || DEFAULT_ROTATION);
    //     this._updateMatrix();
    //     return this;
    // }

    cancelMarkerPixelHeight() {
        return this.updateSymbol({
            markerPixelHeight: null
        });
    }

    setAnchorZ(anchorZ) {
        this.updateSymbol({ anchorZ });
        return this;
    }

    getAnchorZ() {
        const symbol = this['_getInternalSymbol']();
        return symbol && symbol.anchorZ || 'bottom';
    }

    _setExternSymbol(symbol) {
        this._dirty = true;
        return super['_setExternSymbol'](symbol);
    }


    _loadFunctionTypes(obj) {
        return loadFunctionTypes(obj, () => {
            const map = this.getMap();
            if (map) {
                const zoom = map.getZoom();
                return [zoom];
            } else {
                return null;
            }
        });
    }

    _prepareSymbol(symbol) {
        super['_prepareSymbol'](symbol);
        const functionSymbol = this._loadFunctionTypes(symbol);
        if (functionSymbol && functionSymbol.uniforms) {
            functionSymbol.uniforms = this._loadFunctionTypes(symbol.uniforms);
        }
        //如果重新改变过symbol，删除缓存过的hasFunctionDefinition结果
        delete this._hasFuncDefinition;
        return functionSymbol;
    }

    hasFunctionDefinition() {
        //缓存hasFuctionDefinition的结果，以免多次遍历symbol
        if (defined(this._hasFuncDefinition)) {
            return this._hasFuncDefinition;
        }
        const symbol = this['_getInternalSymbol']();
        this._hasFuncDefinition = (hasFunctionDefinition(symbol) || (symbol && symbol.uniforms && hasFunctionDefinition(symbol.uniforms)));
        return this._hasFuncDefinition;
    }

    setModelMatrix(matrix) {
        const translation = mat4.getTranslation(this._defaultTRS.translation, matrix);
        const rotation = mat4.getRotation(this._defaultTRS.rotation, matrix);
        const scale = mat4.getScaling(this._defaultTRS.scale, matrix);
        this.setTranslation(translation[0], translation[1], translation[2]);
        this.setRotation(rotation[0], rotation[1], rotation[2]);
        this.setScale(scale[0], scale[1], scale[2]);
        return this;
    }

    getModelMatrix() {
        return this._modelMatrix;
    }

    _updateTRSMatrix() {
        const translation = this._getWorldTranslation();
        const r = this.getRotation();
        const rotation = quat.fromEuler(EMPTY_QUAT, r[0], r[1], r[2]);
        const scale = this.getScale();
        this._modelMatrix = mat4.fromRotationTranslationScale(this._modelMatrix, rotation, translation, scale);
    }

    isDirty() {
        return this._dirty;
    }

    _setDirty(dirty) {
        this._dirty = dirty;
        return this;
    }

    //重写事件监听方法
    on(events, callback, context) {
        super.on(events, callback, context || this);
        if (this.getLayer()) {
            this.getLayer()._addEvents(events);
        }
    }

    off(events, callback, context) {
        super.off(events, callback, context || this);
        if (this.getLayer()) {
            this.getLayer()._removeEvents();
        }
    }

    _toJSONObject() {
        const json = this.toJSON();
        json.zoomOnAdded = this._zoomOnAdded;
        return json;
    }

    toJSON() {
        const json = JSON.parse(JSON.stringify({
            coordinates: this.getCoordinates(),
            options: this.options || {}
        }));
        const id = this.getId();
        if (!Util.isNil(id)) {
            json.options['id'] = id;
        }

        const properties = this.getProperties();
        if (properties) {
            json.options['properties'] = JSON.parse(JSON.stringify(properties));
        }

        const symbol = this.getSymbol();
        if (symbol) {
            json.options['symbol'] =  JSON.parse(JSON.stringify(symbol));
        }
        return json;
    }

    setZoomOnAdded(zoom) {
        this._zoomOnAdded = zoom;
    }

    getZoomOnAdded() {
        return this._zoomOnAdded;
    }

    //判断模型是否为透明模型, 透明模型和非透明模型在渲染顺序上会有先后
    _isTransparent() {
        const opacity = this._getOpacity();
        if (opacity < 1) {
            return true;
        }
        return false;
    }

    _getOpacity() {
        const uniforms = this.getUniforms();
        const shader = this.getShader();
        if (shader === 'pbr' || shader === 'phong') {
            return uniforms && defined(uniforms['polygonOpacity']) ? uniforms['polygonOpacity'] : 1;
        }
        if (shader === 'wireframe') {
            return uniforms && defined(uniforms['lineOpacity']) ? uniforms['lineOpacity'] : 1;
        }
        return 1;
    }

    //设置当前marker的加载状态
    _setLoadState(state) {
        this._loaded = state;
    }

    isLoaded() {
        return this._loaded;
    }

    getGLTFMarkerType() {
        return this._type;
    }

    _setPickingId(pickingId) {
        this._pickingId = pickingId;
    }

    _getPickingId() {
        return this._pickingId;
    }

    getCount() {
        return 1;
    }

    getContainerExtent() {
        return this._getMarkerContainerExtent();
    }

    getGLTFAsset() {
        return this._gltfData && this._gltfData.asset;
    }

    openInfoWindow(coordinate) {
        if (!this._gltfData) {
            this.once('load', () => {
                super.openInfoWindow(coordinate);
            });
        } else {
            super.openInfoWindow(coordinate);
        }
    }

    getAnimations() {
        if (!this._gltfData) {
            return null;
        }
        const animations = this._gltfData.animations;
        if (!animations) {
            return null;
        }
        return animations.map((animation, i) => {
            return animation.name || i;
        });
    }

    getCurrentAnimation() {
        const symbol = this['_getInternalSymbol']();
        return symbol && symbol.animationName;
    }

    _getCurrentAnimation() {
        const animations = this.getAnimations();
        if (!animations) {
            return null;
        }
        const animationName = this.getCurrentAnimation();
        if (!defined(animationName)) {
            return animations[0];
        }
        if (animations.indexOf(animationName) > -1) {
            return animationName;
        }
        return null;
    }

    setCurrentAnimation(animationName) {
        this.updateSymbol({ animationName });
    }

    _setAnimationStartTime(timestamp) {
        if (!defined(this._startAnimationTime)) {
            this._startAnimationTime = timestamp;
        }
    }

    _getAnimationStartTime() {
        return this._startAnimationTime || 0;
    }

    _getSkinMap() {
        this._skinMap = this._skinMap || {};
        for (const node in this._skinMap) {
            this._skinMap[node].jointTexture.destroy();
            delete this._skinMap[node];
        }
        return this._skinMap;
    }

    _getMarkerPixelHeight() {
        const symbol = this['_getInternalSymbol']();
        return symbol && symbol.markerPixelHeight;
    }

    setModelHeight(modelHeight) {
        this.updateSymbol({ modelHeight });
        return this;
    }

    getModelHeight() {
        const symbol = this['_getInternalSymbol']();
        return symbol && symbol.modelHeight;
    }

    getGLTFBBox() {
        return this._gltfModelBBox;
    }

    zoomTo(zoomOffset) {
        const markerBBox = this._getBoundingBox();
        const map = this.getMap();
        const { min, max } = markerBBox;
        TEMP_POINT.set(min[0], min[1]);
        const minCoord = map.pointAtResToCoordinate(TEMP_POINT, map.getGLRes());
        TEMP_POINT.set(max[0], max[1]);
        const maxCoord = map.pointAtResToCoordinate(TEMP_POINT, map.getGLRes());
        const extent = new Extent(minCoord, maxCoord);
        map.fitExtent(extent, zoomOffset, {}, (params) => {
            if (params.state.playState === 'finished') {
                this.fire('zoomtoend', { target: this, extent });
            }
        });
    }

    _isUniformsDirty() {
        return this._uniformDirty;
    }

    _resetUniformsDirty() {
        this._uniformDirty = false;
    }

    setAnimationTimeframe(timestamp) {
        const startTime = this._getAnimationStartTime();
        const skinMap = this._getSkinMap();
        //根据指定的时间戳，更新nodeMatrix，然后验证mesh对应的node上面的nodeMatrix是否正确
        this.gltfPack.updateAnimation(timestamp, this.isAnimationLooped(), this.getAnimationSpeed(), startTime, {}, skinMap)
    }

    _deleteTRSState() {
        delete this._markerBBox;
        delete this._zoomOnAdded;
    }

    _hasGLTFAnimations() {
        return this.getGLTFMarkerType() !== 'effectmarker' && this.getGLTFMarkerType() !== 'glowmarker';
    }
}


function fromRotationTranslation(rotation, translation) {
    const result = [];

    result[0] = rotation[0];
    result[1] = rotation[1];
    result[2] = rotation[2];
    result[3] = 0.0;
    result[4] = rotation[3];
    result[5] = rotation[4];
    result[6] = rotation[5];
    result[7] = 0.0;
    result[8] = rotation[6];
    result[9] = rotation[7];
    result[10] = rotation[8];
    result[11] = 0.0;
    result[12] = translation[0];
    result[13] = translation[1];
    result[14] = translation[2];
    result[15] = 1.0;
    return result;
}
function fromRotationX(angle) {

    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    const result = [];

    result[0] = 1.0;
    result[1] = 0.0;
    result[2] = 0.0;
    result[3] = 0.0;
    result[4] = cosAngle;
    result[5] = sinAngle;
    result[6] = 0.0;
    result[7] = -sinAngle;
    result[8] = cosAngle;

    return result;
}
GLTFMarker.mergeOptions(options);
GLTFMarker.registerJSONType('GLTFMarker');
