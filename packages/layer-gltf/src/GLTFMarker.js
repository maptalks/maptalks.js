import { Marker, Util, Point, Extent } from 'maptalks';
import { mat4, quat, vec3, vec4, reshader } from '@maptalks/gl';
import { defined, coordinateToWorld, getAbsoluteValue, getGLTFAnchorsAlongLine } from './common/Util';
import { loadFunctionTypes, hasFunctionDefinition } from '@maptalks/function-type';
import { intersectsBox } from 'frustum-intersects';

const EMPTY_QUAT = [];
//const DEFAULT_AXIS = [0, 0, 1];
const options = {
    symbol: null
};
const VEC41 = [], VEC42 = [], MAT4 = [], TEMP_SCALE = [1, 1, 1], TEMP_MAT = [], TEMP_TRANS = [], TEMP_FIXSIZE_SCALE = [1, 1, 1], EMPTY_MAT = [];
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

// BOX template
//    v2----- v1
//   / |     /|
//  v3------v0|
//  |  |v6  | /v5
//  | /     |/
//  v7------v4
const BOX_POS = [
    1.0, 1.0, 1.0,
    1.0, -1.0, 1.0,
    -1.0, -1.0, 1.0,
    -1.0, 1.0, 1.0,
    1.0, 1.0, -1.0,
    1.0, -1.0, -1.0,
    -1.0, -1.0, -1.0,
    -1.0, 1.0, -1.0
]
const BOX_INDEX = [
    0, 1,
    1, 2,
    2, 3,
    3, 0,
    0, 4,
    1, 5,
    2, 6,
    3, 7,
    4, 5,
    5, 6,
    6, 7,
    7, 4
];

const BBOX_LINECOLOR = [0.8, 0.8, 0.1, 1.0], BBOX_LINEOPACITY = 1;
// const DEFAULT_TRANS = [0, 0, 0], DEFAULT_ROTATION = [0, 0, 0], DEFAULT_SCALE = [1, 1, 1];
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

    static getGLTFAnchorsAlongLineString(coordinates, bboxWidth, map, options) {
        const markerBatchs = [];
        for (let i = 0; i < coordinates.length - 1; i++) {
            const from = coordinates[i], to = coordinates[i + 1];
            const dataArr = getGLTFAnchorsAlongLine(from, to, {
                map,
                bboxWidth, //模型boundingBox
                gapLength: options.gapLength || 0, //bbox之间间距
                count: options.count, //复制模型的数量
                rotateAlongLine: options.rotateAlongLine, //是否沿线方向旋转
                snapToEndVertexes: options.snapToEndVertexes, //首末端点是否对齐
                scaleEndModel: options.scaleEndModel //是否缩放尾部端点处的模型
            });
            Util.pushIn(markerBatchs, dataArr);
        }
        return markerBatchs;
    }

    static combineGLTFBoundingBox(markers) {
        const bboxes = [];
        for (let i = 0; i < markers.length; i++) {
            const bbox = markers[i].getBoundingBox();
            bboxes.push([bbox.min, bbox.max]);
        }
        const bbox0 = bboxes[0];
        if (!bbox0) {
            return null;
        }
        const min = vec3.copy([], bbox0[0]), max = vec3.copy([], bbox0[1]);
        for (let i = 1; i < bboxes.length; i++) {
            const bbox = bboxes[i];
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
        return { min, max };
    }

    setTransformOrigin(coordinate) {
        this._transformOrigin = coordinate;
    }

    getTransformOrigin() {
        return this._transformOrigin || this.getCenter();
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
            (this.getGLTFMarkerType() === 'multigltfmarker' && this._dirty) ||
            this.getGLTFMarkerType() === 'effectmarker';
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
                    this._updateUniforms(mesh, timestamp);
                    this._updateDefines(mesh);
                    return true;
                }
                return false;
            });
            this._setDirty(false);
        }
        return meshes;
    }


    getGLTFJSON() {
        return this._gltfData;
    }

    getAllMeshes() {
        return this._meshes;
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
        const currentPosition = new Point([coordPosition[0] + translate[0], coordPosition[1] + translate[1], coordPosition[2] + translate[2]]);
        const glRes = map.getGLRes();
        const coord = map.pointAtResToCoord(currentPosition, glRes);
        coord.z = (currentPosition.z / map.altitudeToPoint(100, glRes)) * 100;
        return coord;
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
            const renderer = this.getLayer().getRenderer();
            gltfManager.loginGLTF(url, (...args) => {
                return renderer._requestor.apply(renderer, args);
            });
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
                mesh.setUniform(u, markerUniforms[u]);
            }
        }
        if (this._isTransparent()) {
            mesh.transparent = true;
        }
        mesh.setUniform('uPickingId', this._getPickingId());
        mesh.properties.isAnimated = this.isAnimated();
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
            // 如果mesh上已经有老的material，因为material上的纹理是在GLTFPack中管理的，老的material无需dispose，可以直接替换
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
        meshes.forEach((mesh) => {
            const nodeIndex = mesh.properties.geometryResource.nodeIndex;
            const animNodeMatrix = nodeMatrixMap[nodeIndex];
            const nodeMatrix = isAnimated && animNodeMatrix ? animNodeMatrix : mesh.nodeMatrix;
            mat4.scale(tmpMat, modelMatrix, TEMP_SCALE);
            mat4.multiply(tmpMat, tmpMat, Y_UP_TO_Z_UP);
            mesh._nodeMatrix = mesh._nodeMatrix || mat4.identity([]);
            const m = mat4.multiply(EMPTY_MAT, mesh._nodeMatrix, nodeMatrix);
            if (mesh instanceof reshader.InstancedMesh) {
                mesh.positionMatrix = mat4.multiply(mesh.positionMatrix, tmpMat, m);
                mesh.localTransform = this._getCenterMatrix();
                this._updateInstancedMeshData(mesh);
            } else {
                mesh.localTransform = mat4.multiply(mesh.localTransform, tmpMat, m);
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
        const bboxMesh = this._getBoundingBoxMesh();
        if (bboxMesh) {
            mat4.scale(tmpMat, modelMatrix, TEMP_SCALE);
            mat4.multiply(tmpMat, tmpMat, Y_UP_TO_Z_UP);
            this._bboxMesh.localTransform = mat4.multiply(this._bboxMesh.localTransform, tmpMat, this._bboxMesh._originLocalTransform);
        }
        if (zOffset !== 0) {
            vec3.set(TEMP_TRANS, 0, 0, zOffset);
            const matrix = mat4.fromTranslation(TEMP_MAT, TEMP_TRANS);
            meshes.forEach(mesh => {
                if (mesh instanceof reshader.InstancedMesh) {
                    mesh.positionMatrix = mat4.multiply(mesh.positionMatrix, matrix, mesh.positionMatrix);
                    this._updateInstancedMeshData(mesh);
                } else {
                    const localTransform = mat4.multiply(mesh.localTransform, matrix, mesh.localTransform);
                    mesh.localTransform = localTransform;
                }
            });
            if (bboxMesh) {
                this._bboxMesh.localTransform = mat4.multiply(this._bboxMesh.localTransform, matrix, this._bboxMesh.localTransform);
            }
        }
        meshes.forEach(mesh => {
            if (mesh instanceof reshader.InstancedMesh) {
                this._updateInstancedMeshData(mesh);
            }
        });
        this.fire('updatematrix', { target: this });
    }

    getBoundingBoxCenter() {
        const bbox = this._gltfModelBBox;
        const map = this.getMap();
        if (!bbox || !this._bboxMesh || !map) {
            return null;
        }
        const glRes = map.getGLRes();
        const { min, max } = bbox;
        const center = vec3.add([], min, max);
        vec3.scale(center, center, 0.5);
        vec3.transformMat4(center, center, this._bboxMesh.localTransform);
        const pCenter = new Point(center);
        const coordinate = map.pointAtResToCoordinate(pCenter, glRes);
        coordinate.z = (100 / map.altitudeToPoint(100, glRes)) * center[2];
        return coordinate;
    }

    getBoundingBoxWidth(axis) {
        const bbox = this._gltfModelBBox;
        if (!bbox) {
            return 0;
        }
        let idx = 0;
        if (axis === 'x') {
            idx = 0;
        } else if (axis === 'y') {//由于模型存在YZ翻转，算YZ方向长度需要对换
            idx = 2;
        } else if (axis === 'z') {
            idx = 1;
        }
        const { min, max } = bbox;
        const scale = this._getScale()[idx];
        return (max[idx] - min[idx]) * scale;
    }

    getAxisXWidth() {
        return this.getBoundingBoxWidth('x');
    }

    getAxisYWidth() {
        return this.getBoundingBoxWidth('y');
    }

    getAxisZWidth() {
        return this.getBoundingBoxWidth('z');
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

    _calModelHeightScale(out, modelHeight) {
        return this.gltfPack.calModelHeightScale(out, modelHeight);
    }

    _calFixSizeScale(out, pixelHeight) {
        const bbox = this._gltfModelBBox;
        if (!pixelHeight || pixelHeight < 0 || !bbox) {
            return out;
        }
        const map = this.getMap();
        const boxHeight = Math.abs(bbox.max[1] - bbox.min[1]);
        const pointZ = map.altitudeToPoint(boxHeight, map.getGLRes());
        const heightInPoint = pixelHeight * map.getGLScale();
        const ratio = heightInPoint / pointZ;
        return vec3.set(out, ratio , ratio , ratio);
    }

    getCurrentPixelHeight() {
        const bbox = this.getBoundingBox();
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
                const symbol = this.getSymbol();
                const animationNodes = symbol && symbol.animationNodes;
                for (let i = 0; i < currentAnimation.length; i++) {
                    this.gltfPack.updateAnimation(timestamp, looped, speed, currentAnimation[i], startTime, nodeMatrixMap, skinMap, animationNodes);
                }
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
        if (!this.createdBygltfmarker) {
            this.fire('load', { data: data.json });
            this.fire('setUrl-debug');
            this['_fireEvent']('meshcreate', { url });
        }
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
            gltfResource.resources.forEach((resource) => {
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
        const gltfBBox = this.getBoundingBox();
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

    //    v2----- v1
    //   / |     /|
    //  v3------v0|
    //  |  |v6  | /v5
    //  | /     |/
    //  v7------v4
    _getBoundingBoxMesh() {
        if (this._bboxMesh) {
            this._bboxMesh.material.set('lineColor', this._bboxLineColor || BBOX_LINECOLOR);
            this._bboxMesh.material.set('lineOpacity', this._bboxLineOpacity || BBOX_LINEOPACITY);
            return this._bboxMesh;
        }
        const bbox = this._gltfModelBBox;
        if (!bbox) {
            return null;
        }
        const { min, max } = bbox;
        BOX_POS[0] = max[0];
        BOX_POS[1] = min[1];
        BOX_POS[2] = max[2];

        BOX_POS[3] = max[0];
        BOX_POS[4] = max[1];
        BOX_POS[5] = max[2];

        BOX_POS[6] = min[0];
        BOX_POS[7] = max[1];
        BOX_POS[8] = max[2];

        BOX_POS[9] = min[0];
        BOX_POS[10] = min[1];
        BOX_POS[11] = max[2];

        BOX_POS[12] = max[0];
        BOX_POS[13] = min[1];
        BOX_POS[14] = min[2];

        BOX_POS[15] = max[0];
        BOX_POS[16] = max[1];
        BOX_POS[17] = min[2];

        BOX_POS[18] = min[0];
        BOX_POS[19] = max[1];
        BOX_POS[20] = min[2];

        BOX_POS[21] = min[0];
        BOX_POS[22] = min[1];
        BOX_POS[23] = min[2];

        const geometry = new reshader.Geometry({
            POSITION: BOX_POS
        },
        BOX_INDEX,
        0,
        {
            primitive : 'lines',
            positionAttribute: 'POSITION'
        });
        geometry.generateBuffers(this.regl);
        const mesh = new reshader.Mesh(geometry, new reshader.Material({ lineColor: this._bboxLineColor || BBOX_LINECOLOR, lineOpacity: this._bboxLineOpacity || BBOX_LINEOPACITY }));
        this._bboxMesh = mesh;
        this._bboxMesh._originLocalTransform = mat4.copy([], mesh.localTransform);
        return mesh;
    }

    showBoundingBox(options) {
        this.options['showDebugBoundingBox'] = true;
        this._bboxLineColor = options && options.lineColor;
        this._bboxLineOpacity = options && options.lineOpacity;
        this._dirty = true;
    }

    hideBoundingBox() {
        this.options['showDebugBoundingBox'] = false;
        this._dirty = true;
    }

    getBoundingBox() {
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
        if (this.getGLTFMarkerType() === 'multigltfmarker') {//MultiGLTFMarker的BoundingBox受数据项数量影响, 是否dirty需要特殊处理
            if (this._data.length) {
                this._dirtyMarkerBBox = false;
            }
        } else {
            this._dirtyMarkerBBox = false;
        }
        return bbox;
    }

    _calGLTFModelBBox() {
        return this.gltfPack.getGLTFBBox();
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
        defines['HAS_MIN_ALTITUDE'] = 1;
        defines['HAS_LAYER_OPACITY'] = 1;
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
            const count = this._getNoBloomDataCount();
            modelMesh = new reshader.InstancedMesh(attributes.attributesData, count, geometry, material);
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
        if (extraInfo.alphaMode === 'BLEND') {
            modelMesh.transparent = true;
        }
        modelMesh.properties.pickingId = this._getPickingId();
        this._setPolygonFill(modelMesh);
        const layer = this.getLayer();
        Object.defineProperty(modelMesh.uniforms, 'minAltitude', {
            enumerable: true,
            get: () => {
                return layer.options['altitude'] || 0;
            }
        });
        return modelMesh;
    }

    _buildMaterial(geometryResource) {
        let material = null;
        const shader = this.getShader();
        const markerUniforms = this.getUniforms() || {};
        const materialInfo = geometryResource.materialInfo || {};
        // materialInfo.alphaTest = 0.1;
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
        const symbol = this.getSymbol()
        const doubleSided = symbol && symbol.doubleSided;
        if (defined(doubleSided)) {
            material.doubleSided = doubleSided;
        }
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
            return null;
        }
        const gltfBBox = this.getBoundingBox();
        if (!gltfBBox) {
            return null;
        }
        const min = gltfBBox.min;
        const max = gltfBBox.max;
        const bboxMin = vec4.set(VEC41, (min[0] + max[0]) / 2, (min[1] + max[1]) / 2, min[2], 1);
        const bboxMax = vec4.set(VEC42, (min[0] + max[0]) / 2, (min[1] + max[1]) / 2, max[2], 1);
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
        if (this._skinMap) {
            for (const p in this._skinMap) {
                if (this._skinMap[p] && this._skinMap[p].jointTexture) {
                    this._skinMap[p].jointTexture.destroy();
                }
            }
            delete this._skinMap;
        }
        if (this._bboxMesh) {
            this._bboxMesh.geometry.dispose();
            this._bboxMesh.dispose();
            delete this._bboxMesh;
        }
        if (this._meshes) {
            this._meshes.forEach(mesh => {
                mesh.dispose();
                if (mesh.properties.bloomMesh) {
                    mesh.properties.bloomMesh.dispose();
                    delete mesh.properties.bloomMesh;
                }
            });
        }
        this._login = false;
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
        this.updateSymbol({ bloom });
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
        return symbol && (symbol.shadow || symbol.shadow === undefined);
    }

    outlineNodes(nodes) {
        const meshes = this._meshes;
        if (!meshes) {
            return this;
        }
        meshes.forEach(mesh => {
            if (nodes.indexOf(mesh.properties.nodeIndex) > -1) {
                mesh.properties.outline = true;
            }
        });
        this._dirty = true;
        return this;
    }

    outline() {
        this.updateSymbol({ outline: true });
        const meshes = this._meshes;
        if (!meshes) {
            return this;
        }
        meshes.forEach(mesh => {
            mesh.properties.outline = true;
        });
        this._dirty = true;
        return this;
    }

    cancelOutline(nodes) {
        this.updateSymbol({ outline: false });
        const meshes = this._meshes;
        if (!meshes) {
            return this;
        }
        meshes.forEach(mesh => {
            if (nodes) {
                if (nodes.indexOf(mesh.properties.nodeIndex) > -1) {
                    mesh.properties.outline = false;
                }
            } else {
                mesh.properties.outline = false;
            }
        });
        this._dirty = true;
        return this;
    }

    isOutline() {
        const symbol = this['_getInternalSymbol']();
        if (symbol && defined(symbol.outline)) {
            return symbol.outline;
        }
        return false;
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
        this.updateSymbol({
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
            if (name === 'bloom' && this._meshes) {
                this._meshes.forEach(mesh => {
                    mesh.bloom = +!!symbol[name];
                });
            }
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

    rotateAround(coordinate, degree) {
        const map = this.getMap();
        if (!map) {
            return;
        }
        const glRes = map.getGLRes();
        let coord = this.getCoordinates();
        const point = map.coordinateToPointAtRes(coord, glRes);
        const rotatePoint = map.coordinateToPointAtRes(coordinate, glRes);
        const relativeX = point.x - rotatePoint.x;
        const relativeY = point.y - rotatePoint.y;
        const currentAngle = Math.atan2(relativeY, relativeX) * 180 / Math.PI;
        const angle = currentAngle + degree;
        const radius = Math.sqrt(relativeX * relativeX + relativeY * relativeY);
        const theta = Math.PI * angle / 180;
        const x = radius * Math.cos(theta) + rotatePoint.x;//圆公式
        const y = radius * Math.sin(theta) + rotatePoint.y;
        TEMP_POINT.set(x, y);
        coord = map.pointAtResToCoordinate(TEMP_POINT, glRes);
        this.setCoordinates(coord);
        this.updateSymbol({ rotationZ: angle });
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
        const point = map.distanceToPointAtRes(translation[0], translation[1], map.getGLRes(), TEMP_POINT);
        const z = map.altitudeToPoint(translation[2], map.getGLRes());
        return vec3.set(TEMP_TRANS, getAbsoluteValue(point.x, translation[0]), getAbsoluteValue(point.y, translation[1]), getAbsoluteValue(z, translation[2]));
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
        if (!symbol) {
            return vec3.set(this._defaultTRS.scale, 1, 1, 1);
        }
        const scaleX = Util.isNil(symbol['scaleX']) ? 1 : symbol['scaleX'];
        const scaleY = Util.isNil(symbol['scaleY']) ? 1 : symbol['scaleY'];
        const scaleZ = Util.isNil(symbol['scaleZ']) ? 1 : symbol['scaleZ'];
        return vec3.set(this._defaultTRS.scale, scaleX, scaleY, scaleZ);
    }

    _getScale() {
        const scale = this.getScale();
        if (this._gltfModelBBox) {
            const markerPixelHeight = this._getMarkerPixelHeight();
            const modelHeight = this.getModelHeight();
            if (markerPixelHeight && markerPixelHeight > 0) {
                const pixelHeightScale = this._calFixSizeScale(TEMP_FIXSIZE_SCALE, markerPixelHeight);
                return vec3.multiply(pixelHeightScale, pixelHeightScale, scale);
            } else if (modelHeight) {
                const modelHeightScale = this._calModelHeightScale(TEMP_FIXSIZE_SCALE, modelHeight);
                return vec3.multiply(modelHeightScale, modelHeightScale, scale);
            }
        }
        return scale;
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
        const scale = this._getScale();
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
    // on(events, callback, context) {
    //     super.on(events, callback, context || this);
    //     if (this.getLayer()) {
    //         this.getLayer()._addEvents(events);
    //     }
    // }

    // off(events, callback, context) {
    //     super.off(events, callback, context || this);
    //     if (this.getLayer()) {
    //         this.getLayer()._removeEvents();
    //     }
    // }

    _toJSONObject() {
        const json = this.toJSON();
        json.zoomOnAdded = this._zoomOnAdded;
        return json;
    }

    toJSON() {
        const json = JSON.parse(JSON.stringify({
            coordinates: this.getCoordinates(),
            options: this.options || {},
            type: 'GLTFMarker'
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
        const gltf = this._gltfData;
        const animations = gltf.animations ? gltf.animations.map((animation, index) => { return { name: defined(animation.name) ? animation.name : index }; }) : null;
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

    //animationName支持数组，即多个动画同时起作用
    _getCurrentAnimation() {
        const animations = this.getAnimations();
        if (!animations) {
            return null;
        }
        let animationName = this.getCurrentAnimation();
        if (!defined(animationName)) {
            return animations.slice(0, 1);
        }
        const animationList = [];
        animationName = Array.isArray(animationName) ? animationName : [animationName];
        for (let i = 0; i < animationName.length; i++) {
            if (animations.indexOf(animationName[i]) > -1) {
                animationList.push(animationName[i]);
            }
        }
        return animationList.length ? animationList : null;
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

    /**
     * set transltion, rotation and scale for specific node
     * @param  {Object} options   an option object including animation{boolean}、duration{number}、pitch{number}、bearing{number}、zoomOffset{number}、heightOffset{number}
     * @param  {Function}  - step function during animation, animation frame as the parameter
     * @return this
     */
    zoomTo(options = { animation: true }, step) {
        const markerBBox = this.getBoundingBox();
        const map = this.getMap();
        if (!map || !markerBBox) {
            return;
        }
        const { min, max } = markerBBox;
        TEMP_POINT.set((min[0] + max[0]) / 2, (min[1] + max[1]) / 2);
        const glRes = map.getGLRes();
        const bboxCenter = map.pointAtResToCoordinate(TEMP_POINT, glRes);
        bboxCenter.z = ((min[2] + max[2]) / 2) / map.altitudeToPoint(1, glRes);
        return this._zoomTo(bboxCenter, options, step);
    }

    _zoomTo(center, options, step) {
        const map = this.getMap();
        const pitch = options.pitch || map.getPitch();
        const bearing = options.bearing || map.getBearing();
        const duration = options.duration || 500;
        const easing = options.easing || 'linear';
        const zoom = this._getFitZoomByBoundingBox(options.heightOffset || 0) + (options.zoomOffset || 0);
        if (options.animation || options.animation === undefined) {
            map.animateTo({
                center,
                zoom,
                bearing,
                pitch
            }, {
                duration,
                easing
            }, step);
        } else {
            map.setView({
                center,
                zoom,
                bearing,
                pitch
            });
        }
        return this;
    }

    _getFitZoomByBoundingBox(heightOffset) {
        const map = this.getMap();
        const glRes = map.getGLRes();
        const meterToGLPoint = map.distanceToPointAtRes(100, 0, glRes).x / 100;
        const markerBBox = this.getBoundingBox();
        const { min, max } = markerBBox;
        const maxHeight = max[2] / map.altitudeToPoint(1, glRes) + heightOffset;
        const zoom1 = map.getFitZoomForAltitude(maxHeight * meterToGLPoint);
        TEMP_POINT.set(min[0], min[1]);
        const minCoord = map.pointAtResToCoordinate(TEMP_POINT, map.getGLRes());
        TEMP_POINT.set(max[0], max[1]);
        const maxCoord = map.pointAtResToCoordinate(TEMP_POINT, map.getGLRes());
        const extent = new Extent(minCoord, maxCoord);
        const zoom2 = map.getFitZoom(extent);
        return zoom1 < zoom2 ? zoom1 : zoom2;
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

    _onEvent(event, type) {
        const layer = this.getLayer();
        if (!layer) {
            return;
        }
        const id = layer.getId();
        this._pickingParams = (event.gltfPickingInfo && event.gltfPickingInfo[id]) || {};
        super['_onEvent'](event, type);
    }

    _fireEvent(eventName, param) {
        for (const p in this._pickingParams) {
            param[p] = this._pickingParams[p];
        }
        delete this._pickingParams;
        super['_fireEvent'](eventName, param);
    }

    _getOutlineMeshes() {
        let outlineMeshes = [];
        if (this._meshes && this.isVisible() && this._getOpacity()) {
            if (this.isOutline && this.isOutline()) {
                return this._meshes;
            }
            outlineMeshes = this._meshes.filter(mesh => { return mesh.properties.outline; });
            return outlineMeshes;
        }
        return outlineMeshes;
    }

    highlightNodes(highlights) {
        const meshes = this._meshes;
        if (!meshes) {
            this.once('load', () => {
                this._highlightForMeshes(highlights, this._meshes);
            }, this);
            return;
        }
        this._highlightForMeshes(highlights, meshes);
    }

    _highlightForMeshes(highlights, meshes) {
        highlights.forEach(highlight => {
            meshes.forEach(mesh => {
                if (mesh.properties.nodeIndex === highlight.nodeIndex) {
                    this._highlightMesh(mesh, highlight.color, highlight.opacity, highlight.bloom);
                }
            });
        });
        this._dirty = true;
    }

    highlight(highlight) {
        const { color, opacity, bloom } = highlight;
        const meshes = this._meshes;
        if (!meshes) {
            this.once('load', () => {
                this._meshes.forEach(mesh => {
                    this._highlightMesh(mesh, color, opacity, bloom);
                });
                this._dirty = true;
            }, this);
            return;
        }
        meshes.forEach(mesh => {
            this._highlightMesh(mesh, color, opacity, bloom);
        });
        this._dirty = true;
    }

    _highlightMesh(mesh, color, opacity, bloom) {
        if (!mesh.properties['polygonFill']) {
            mesh.properties['polygonFill'] = mesh.getUniform('polygonFill') || defaultColor;
        }
        if (!mesh.properties['polygonOpacity']) {
            mesh.properties['polygonOpacity'] = mesh.getUniform('polygonOpacity') || defaultOpacity;
        }
        mesh.setUniform('polygonFill', color || defaultColor);
        mesh.setUniform('polygonOpacity', opacity || defaultOpacity);
        mesh.bloom = bloom;
    }

    _cancelHighlight() {
        if (this._highlighted) {
            if (Array.isArray(this._highlighted)) {
                const nodes = this._highlighted.map(highlight => { return highlight.nodeIndex; });
                this.cancelHighlight(nodes);
            } else {
                this.cancelHighlight(this._highlighted.nodeIndex);
            }
        }
    }

    cancelHighlight(nodes) {
        const layer = this.getLayer();
        if (!layer) {
            return;
        }
        const renderer = layer.getRenderer();
        if (!renderer) {
            return;
        }
        let meshes = this._meshes;
        if (!meshes) {
            return;
        }
        if (nodes) {
            let nodeList = nodes;
            if (!Array.isArray(nodeList)) {
                nodeList = [nodeList];
            }
            meshes = meshes.filter(mesh => { return nodeList.indexOf(mesh.properties.nodeIndex) > -1 });
        }
        meshes.forEach(mesh => {
            const { polygonFill, polygonOpacity } = mesh.properties;
            mesh.setUniform('polygonFill', polygonFill);
            mesh.setUniform('polygonOpacity', polygonOpacity);
            mesh.bloom = false;
        });
        renderer.setToRedraw();
    }

    /**
     * set transltion, rotation and scale for specific node
     * @param  {Number} nodeIndex   - specific node index for gltf
     * @param  {Object} [trs = {}]  - includes transltion, rotation, scale
     * @return this
     */
    setNodeTRS(nodeIndex, trs = {}) {
        const meshes = this._meshes;
        if (!meshes) {
            return;
        }
        const translation = trs.translation || this._defaultTRS.translation;
        const r = trs.rotation || this._defaultTRS.rotation;
        const rotation = quat.fromEuler(EMPTY_QUAT, r[0], r[1], r[2]);
        const scale = trs.scale || this._defaultTRS.scale;
        meshes.forEach(mesh => {
            if (mesh.properties.nodeIndex === nodeIndex) {
                mesh._nodeMatrix = mat4.fromRotationTranslationScale(mesh._nodeMatrix || [], rotation, translation, scale);
            }
        });
        this._updateMeshMatrix(meshes);
        this._dirty = true;
        return this;
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
